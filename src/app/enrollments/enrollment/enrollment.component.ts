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
import { TuiButton, TuiDataList, TuiIcon, TuiLoader, tuiLoaderOptionsProvider,TuiAlertService, } from '@taiga-ui/core';
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
  selector: 'app-enrollment',
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
    TuiLoader,
  ],
  providers: [ReportService, DatePipe,tuiLoaderOptionsProvider({size: 'xl'}),],
  templateUrl: './enrollment.component.html',
  styleUrl: './enrollment.component.css',
})
export class EnrollmentComponent implements OnInit {
  reportService = inject(ReportService);
  alerts = inject(TuiAlertService);
  companies: WritableSignal<Company[]> = signal([]);
  currentDay = TuiDay.currentLocal();
  isFormSubmitted = signal(false);
  isFetchingCompanies = signal(false);
  enrollmentReportForm = new FormGroup({
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
    this.enrollmentReportForm.disable();
    this.reportService.getCompanies().subscribe({
      next: (value) => {
        if (value.state == 'loaded') {
          this.companies.set(value?.data.body ?? []);
        }
      },
      complete: () => {
        this.enrollmentReportForm.enable();
        this.isFetchingCompanies.set(false);
      },
    });
  }

  selectItemLabel = (company: Company): string => {
    return `${company?.name} - ${company?.accountNumber}`;
  };

  get corporateAccount() {
    return this.enrollmentReportForm.controls.corporateAccount;
  }

  get dateRange() {
    return this.enrollmentReportForm.controls.dateRange;
  }

  onSubmit() {
    this.isFormSubmitted.set(true);
    if (this.enrollmentReportForm.valid) {
      const startDate =
        this.dateRange?.value?.from.toUtcNativeDate() ?? new Date();
      const endDate = this.dateRange?.value?.to.toUtcNativeDate() ?? new Date();
      const corporateAccountNumber =
        this.corporateAccount?.value?.accountNumber ?? '';

      this.enrollmentReportForm.disable();
      this.isFetchingReports.set(true);
      this.reportService
        .getEnrollmentReport({
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
                const total = event.total ?? 5;
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
            this.enrollmentReportForm.enable();
            this.enrollmentReportForm.markAsPristine();
            this.enrollmentReportForm.markAsUntouched();
            this.enrollmentReportForm.reset();
            this.downloadProgress.update(() => 0);
          },
          error: (error) => {
            console.error(error);
            this.isFetchingReports.set(false);
            this.enrollmentReportForm.enable();
          },
        });
    }
    console.log(this.enrollmentReportForm.value);
    console.log(this.enrollmentReportForm.controls.corporateAccount.errors);
  }
}

