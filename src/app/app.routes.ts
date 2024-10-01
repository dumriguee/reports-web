import { Routes } from '@angular/router';
import { MemberComponent } from './members/member/member.component';
import { EnrollmentComponent } from './enrollments/enrollment/enrollment.component';
import { TerminationComponent } from './terminations/termination/termination.component';

export const routes: Routes = [
  { path: 'member', component: MemberComponent },
  { path: 'enrollment', component: EnrollmentComponent },
  { path: 'termination', component: TerminationComponent },
];
