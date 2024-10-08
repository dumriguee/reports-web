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
import { DatePipe, NgClass } from '@angular/common';
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
  ],
  providers: [ReportService, DatePipe],
  templateUrl: './enrollment.component.html',
  styleUrl: './enrollment.component.css',
})
export class EnrollmentComponent implements OnInit {
  reportService = inject(ReportService);

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
            this.enrollmentReportForm.enable();
            this.enrollmentReportForm.markAsPristine();
            this.enrollmentReportForm.markAsUntouched();
            this.enrollmentReportForm.reset();
            this.downloadProgress.update(() => 0);
          },
          error: (error) => {
            console.error(error);
            this.enrollmentReportForm.enable();
          },
        });
    }
    console.log(this.enrollmentReportForm.value);
    console.log(this.enrollmentReportForm.controls.corporateAccount.errors);
  }
}

