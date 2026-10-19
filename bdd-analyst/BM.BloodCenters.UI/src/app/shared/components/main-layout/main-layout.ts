import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { LeftSidenav } from '../../../shared/components/left-sidenav/left-sidenav';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';
import { LoadingSpinnerComponent } from '../loading-spinner.component';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, LeftSidenav, HeaderComponent, FooterComponent, LoadingSpinnerComponent, CommonModule],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
})
export class MainLayout implements OnInit, OnDestroy {
  isNavigationLoading = signal(false);
  private routerSubscription?: Subscription;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isNavigationLoading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.isNavigationLoading.set(false);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
