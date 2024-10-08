import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ReportFunctionParemeters } from './report.model';
import { ReportConstants } from './constants';
import { DatePipe } from '@angular/common';
import { type Company } from './interfaces/company';
import { withLoadingState } from './with-loading-state';
import { environment } from '../../environments/development';

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  baseUrl: string = environment.API_BASE_PATH;
  dateFormat: string = ReportConstants.REPORT_DATE_FORMAT;
  datePipe = new DatePipe('en-US');

  constructor(private http: HttpClient) {}

  getMemberReport(paremeters: ReportFunctionParemeters) {
    return this.http.get(
      `${this.baseUrl}/report/member?StartDate=${this.datePipe.transform(paremeters.startDate, this.dateFormat)}&EndDate=${this.datePipe.transform(paremeters.endDate, this.dateFormat)}&Corpacct=${paremeters.corporateAccountNumber}`,
      {
        responseType: 'blob',
        observe: 'events' as const,
        reportProgress: true,
      },
    );
  }

  getEnrollmentReport(paremeters: ReportFunctionParemeters) {
    return this.http.get(
      `${this.baseUrl}/report/enrollment?StartDate=${this.datePipe.transform(paremeters.startDate, this.dateFormat)}&EndDate=${this.datePipe.transform(paremeters.endDate, this.dateFormat)}&Corpacct=${paremeters.corporateAccountNumber}`,
      {
        responseType: 'blob',
        observe: 'events' as const,
        reportProgress: true,
      },
    );
  }

  getTerminationReport(paremeters: ReportFunctionParemeters) {
    console.log(`FORMATTED:
      ${this.datePipe.transform(paremeters.startDate, this.dateFormat)},
      paremeters.startDate,
      `);
    return this.http.get(
      `${this.baseUrl}/report/termination?StartDate=${this.datePipe.transform(paremeters.startDate, this.dateFormat)}&EndDate=${this.datePipe.transform(paremeters.endDate, this.dateFormat)}&Corpacct=${paremeters.corporateAccountNumber}`,
      {
        responseType: 'blob',
        observe: 'events' as const,
        reportProgress: true,
      },
    );
  }

  getCompanies() {
    return this.http
      .get<Company[]>(`${this.baseUrl}/companies`, {
        observe: 'response',
      })
      .pipe(withLoadingState);
  }
}
