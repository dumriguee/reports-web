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
import { TuiButton, TuiDataList, TuiIcon } from '@taiga-ui/core';
import {
  TuiComboBoxModule,
  TuiInputDateRangeModule,
  TuiSelectModule,
} from '@taiga-ui/legacy';
import { ReportService } from '../../shared/report.service';
import { Company } from '../../shared/interfaces/company';
import { DatePipe, NgClass,NgIf } from '@angular/common';
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
    NgIf,
  ],
  providers: [ReportService, DatePipe],
  templateUrl: './termination.component.html',
  styleUrl: './termination.component.css',
})
export class TerminationComponent implements OnInit {
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
  ngOnInit() {
    this.isFetchingCompanies.set(true);
    this.terminationReportForm.disable();
    this.reportService.getCompanies().subscribe({
      next: (value) => {
        if (value.state == 'loaded') {
          this.companies.set(value?.data.body ?? []);
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
      this.isFetchingReports.set(true);
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
            //this.isFetchingReports.update((value) => !value);
            this.isFetchingReports.set(false);
            this.isFormSubmitted.set(false);
            this.terminationReportForm.enable();
            this.terminationReportForm.markAsPristine();
            this.terminationReportForm.markAsUntouched();
            this.terminationReportForm.reset();
            this.downloadProgress.update(() => 0);
          },
          error: (error) => {
            console.error(error);
            this.isFetchingReports.set(false);
            this.terminationReportForm.enable();
          },
        });
    }
    console.log(this.terminationReportForm.value);
    console.log(this.terminationReportForm.controls.corporateAccount.errors);
  }
}
