import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Subject, filter, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

@Component({
  selector: 'app-test-configuration',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatIconModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './test-configuration.html',
  styleUrls: ['./test-configuration.scss']
})
export class TestConfigurationComponent implements OnInit, OnDestroy {
  selectedTabIndex = 0;
  private destroy$ = new Subject<void>();
  private readonly routes = ['lab-tests', 'donor-tests', 'override-rules'];

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pageHeaderService: PageHeaderService
  ) {
    this.initializeConfigurations();

    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          ...this.headerConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || ''
        };
      }
    });
  }

  private initializeConfigurations(): void {
    this.headerConfig = {
      breadcrumbs: [
        { label: 'Home', link: '/home' }
      ],
      title: '',
      subtitle: '',
      actions: []
    };
  }

  ngOnInit(): void {
    // Sync tab selection with current route on initial load
    this.syncTabWithRoute();

    // Listen for route changes and update tab selection
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.syncTabWithRoute();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private syncTabWithRoute(): void {
    // Get the current child route
    const currentRoute = this.route.firstChild?.snapshot.routeConfig?.path;

    if (currentRoute) {
      const index = this.routes.indexOf(currentRoute);
      if (index !== -1) {
        this.selectedTabIndex = index;
      }
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.router.navigate([this.routes[event.index]], { relativeTo: this.route });
  }
}
