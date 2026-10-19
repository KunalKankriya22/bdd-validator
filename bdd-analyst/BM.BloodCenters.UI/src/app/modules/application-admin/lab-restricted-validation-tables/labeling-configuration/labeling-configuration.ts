import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { Subject, filter, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
@Component({
  selector: 'app-labeling-configuration',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './labeling-configuration.html',
  styleUrls: ['./labeling-configuration.scss']
})
export class LabelingConfigurationComponent implements OnInit, OnDestroy {
  selectedTabIndex = 0;
  private destroy$ = new Subject<void>();
  private readonly routes = [
    'bar-code',
    'product-type-prioritization',
    'recovered-plasma-test',
    'test-message-mapping',
    'rbc-antigen-product-type'
  ];

  readonly tabs = [
    { route: 'bar-code', label: 'Bar Code' },
    { route: 'product-type-prioritization', label: 'Product Type Prioritization' },
    { route: 'recovered-plasma-test', label: 'Recovered Plasma Test' },
    { route: 'test-message-mapping', label: 'Test Message Mapping' },
    { route: 'rbc-antigen-product-type', label: 'RBC Antigen Product Type' }
  ];

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: '', link: null }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private pageHeaderService: PageHeaderService
  ) {
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

  ngOnInit(): void {
    this.syncTabWithRoute();

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
