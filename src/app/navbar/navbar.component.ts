import { TuiButton, TuiIcon, TuiTitle } from '@taiga-ui/core';
import { TuiTabs } from '@taiga-ui/kit';
import { TuiCardLarge, TuiHeader, TuiNavigation } from '@taiga-ui/layout';
import { RouterLink, RouterModule } from '@angular/router';
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    TuiIcon,
    TuiButton,
    TuiTitle,
    TuiHeader,
    TuiNavigation,
    TuiCardLarge,
    TuiTabs,
    RouterLink,
    RouterModule,
  ],
  providers: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {}
