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
import { TuiButton, TuiDataList,TuiAlertService,TuiIcon } from '@taiga-ui/core';
import {
  TuiComboBoxModule,
  TuiInputDateRangeModule,
  TuiSelectModule,
  
} from '@taiga-ui/legacy';
import { ReportService } from '../../shared/report.service';
import { Company } from '../../shared/interfaces/company';
import { DatePipe, NgClass,NgIf } from '@angular/common';
import { TuiDataListWrapper, TuiStringifyContentPipe } from '@taiga-ui/kit';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import {
  downloadReport,
  generateFileName,
} from '../../shared/helpers/report-download.helper';

@Component({
  selector: 'app-member',
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
  templateUrl: './member.component.html',
  styleUrl: './member.component.css',
})
export class MemberComponent implements OnInit {
  reportService = inject(ReportService);
  alerts = inject(TuiAlertService);
  companies: WritableSignal<Company[]> = signal([]);
  isFormSubmitted = signal(false);
  isFetchingCompanies = signal(false);
  memberReportForm = new FormGroup({
    corporateAccount: new FormControl<Company | null>(
      { value: null, disabled: this.isFetchingCompanies() },
      [Validators.required],
    ),
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
    this.memberReportForm.disable();
    this.reportService.getCompanies().subscribe({
      next: (value) => {
        if (value.state == 'loaded') {
          this.companies.set(value?.data.body ?? []);
        }
      },
      complete: () => {
        this.memberReportForm.enable();
        this.isFetchingCompanies.set(false);
      },
    });
  }

  selectItemLabel = (company: Company): string => {
    return `${company?.name} - ${company?.accountNumber}`;
  };

  get corporateAccount() {
    return this.memberReportForm.controls.corporateAccount;
  }

  onSubmit() {
    this.isFormSubmitted.set(true);
    if (this.memberReportForm.valid) {
      const corporateAccountNumber =
        this.corporateAccount?.value?.accountNumber ?? '';

      this.memberReportForm.disable();
      this.isFetchingReports.set(true);
      this.reportService
        .getMemberReport({
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
                downloadReport(event, generateFileName(corporateAccountNumber));
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
            this.memberReportForm.enable();
            this.memberReportForm.markAsPristine();
            this.memberReportForm.markAsUntouched();
            this.memberReportForm.reset();
            this.downloadProgress.update(() => 0);
          },
          error: (error) => {
            console.error(error);
            this.isFetchingReports.set(false);
            this.memberReportForm.enable();
          },
        });
    }
    console.log(this.memberReportForm.value);
    console.log(this.memberReportForm.controls.corporateAccount.errors);
  }
}
