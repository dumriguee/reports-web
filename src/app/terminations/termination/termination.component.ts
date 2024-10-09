import {
  Component,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  TuiAlertService,
  TuiButton,
  TuiDataList,
  TuiIcon,
} from '@taiga-ui/core';
import {
  TuiComboBoxModule,
  TuiInputDateRangeModule,
  TuiSelectModule,
} from '@taiga-ui/legacy';
import { ReportService } from '../../shared/report.service';
import { Company } from '../../shared/interfaces/company';
import { DatePipe, NgClass } from '@angular/common';
import { TuiDataListWrapper, TuiStringifyContentPipe } from '@taiga-ui/kit';
import { TuiDay, TuiDayRange } from '@taiga-ui/cdk/date-time';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import {
  downloadReport,
  generateFileName,
} from '../../shared/helpers/report-download.helper';

@Component({
  selector: 'app-termination',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TuiButton,
    TuiDataList,
    TuiIcon,
    TuiDataListWrapper,
    TuiStringifyContentPipe,
    TuiInputDateRangeModule,
    TuiComboBoxModule,
    TuiSelectModule,
    NgClass,
  ],
  providers: [ReportService, DatePipe],
  templateUrl: './termination.component.html',
  styleUrl: './termination.component.css',
})
export class TerminationComponent implements OnInit {
  alerts = inject(TuiAlertService);
  reportService = inject(ReportService);

  companies: WritableSignal<Company[]> = signal([]);
  currentDay = TuiDay.currentLocal();
  isFormSubmitted = signal(false);
  isFetchingCompanies = signal(false);
  terminationReportForm = new FormGroup({
    corporateAccount: new FormControl<Company | null>(
      { value: null, disabled: this.isFetchingCompanies() },
      [Validators.required],
    ),
    dateRange: new FormControl<TuiDayRange | null>(null, [Validators.required]),
  });

  // Fetching Status
  downloadProgress = signal(0);
  isFetchingReports = signal(false);

  constructor(private datePipe: DatePipe) {}

  errorNotification(title: string, message: string): void {
    this.alerts
      .open(title, { label: message, appearance: 'error' })
      .subscribe();
  }

  successNotification(title: string, message: string): void {
    this.alerts
      .open(title, { label: message, appearance: 'success' })
      .subscribe();
  }

  ngOnInit() {
    this.isFetchingCompanies.set(true);
    this.terminationReportForm.disable();
    this.reportService.getCompanies().subscribe({
      next: (value) => {
        if (value.state == 'loaded') {
          this.companies.set(value?.data.body ?? []);
        }

        if (value.state === 'error') {
          this.errorNotification(
            'Had a problem fetching corporate accounts.',
            'Error fetching companies',
          );
        }
      },
      complete: () => {
        this.terminationReportForm.enable();
        this.isFetchingCompanies.set(false);
      },
    });
  }

  selectItemLabel = (company: Company): string => {
    return `${company?.name} - ${company?.accountNumber}`;
  };

  get corporateAccount() {
    return this.terminationReportForm.controls.corporateAccount;
  }

  get dateRange() {
    return this.terminationReportForm.controls.dateRange;
  }

  onSubmit() {
    this.isFormSubmitted.set(true);
    if (this.terminationReportForm.valid) {
      const startDate =
        this.dateRange?.value?.from.toUtcNativeDate() ?? new Date();
      const endDate = this.dateRange?.value?.to.toUtcNativeDate() ?? new Date();
      const corporateAccountNumber =
        this.corporateAccount?.value?.accountNumber ?? '';

      this.terminationReportForm.disable();
      this.reportService
        .getTerminationReport({
          startDate,
          endDate,
          corporateAccountNumber,
        })
        .subscribe({
          next: (event: HttpEvent<Blob>) => {
            switch (event.type) {
              case HttpEventType.Response: {
                this.successNotification(
                  'You have successfully generated a termination report. Please review it for accuracy and completeness.',
                  'Succesful Termination Report Generation',
                );
                downloadReport(
                  event,
                  generateFileName(
                    corporateAccountNumber,
                    this.datePipe.transform(
                      this.currentDay?.toLocalNativeDate(),
                      'shortDate',
                    ) ?? '',
                  ),
                );
                break;
              }
              case HttpEventType.DownloadProgress: {
                const total = event.total ?? 1;
                const progess = Math.round((100 * event.loaded) / total);

                this.downloadProgress.set(progess);
                break;
              }
            }
          },
          complete: () => {
            this.isFetchingReports.update((value) => !value);
            this.isFormSubmitted.set(false);
            this.terminationReportForm.enable();
            this.terminationReportForm.markAsPristine();
            this.terminationReportForm.markAsUntouched();
            this.terminationReportForm.reset();
            this.dateRange.setValue(
              new TuiDayRange(TuiDay.currentLocal(), TuiDay.currentLocal()),
            );
            this.downloadProgress.update(() => 0);
          },
          error: () => {
            this.terminationReportForm.enable();
          },
        });
    }
  }
}
