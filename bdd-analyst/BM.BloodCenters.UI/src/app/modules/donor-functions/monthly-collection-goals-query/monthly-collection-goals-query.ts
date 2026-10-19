import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ROUTES } from '../../../core/constants/route.constants';

import { SearchTabComponent } from './components/search-tab/search-tab';
import { SummaryTabComponent } from './components/summary-tab/summary-tab';
import { MonthlyCollectionGoalsService } from './services/monthly-collection-goals.service';
import { SummaryTabType } from './models/monthly-collection-goals.model';

@Component({
  selector: 'app-monthly-collection-goals-query',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb,
    SearchTabComponent,
    SummaryTabComponent
  ],
  templateUrl: './monthly-collection-goals-query.html',
  styleUrls: ['./monthly-collection-goals-query.scss']
})
export class MonthlyCollectionGoalsQueryComponent implements OnInit {
  private readonly goalsService = inject(MonthlyCollectionGoalsService);
  private readonly pageHeaderService = inject(PageHeaderService);

  // Page header configuration
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: ROUTES.HOME }
    ],
    title: '',
    subtitle: '',
    actions: []
  };

  // Tab state
  selectedTabIndex = signal(0);

  // Year options from API
  yearOptions: number[] = [];
  isLoadingYears = signal(false);

  // Track which tabs are active for lazy loading
  activeTab = signal<number>(0);

  // Tab configuration
  readonly tabs: { id: string; label: string; type: SummaryTabType | 'search' }[] = [
    { id: 'search', label: 'Search', type: 'search' },
    { id: 'donation-type', label: 'By Donation Type', type: 'donation-type' },
    { id: 'procedure-type', label: 'By Procedure Type', type: 'procedure-type' },
    { id: 'territories', label: 'Territories', type: 'territories' },
    { id: 'fixed-sites', label: 'Fixed Sites', type: 'fixed-sites' }
  ];

  constructor() {
    // Update header config from menu-items API response
    effect(() => {
      const pageData = this.pageHeaderService.pageHeaderData();
      if (pageData) {
        this.headerConfig = {
          breadcrumbs: [
            { label: 'Home', link: ROUTES.HOME },
            { label: pageData.title, link: null }
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
          actions: []
        };
      }
    });
  }

  ngOnInit(): void {
    this.loadYearOptions();
  }

  private loadYearOptions(): void {
    this.isLoadingYears.set(true);
    this.goalsService.getYearRange().subscribe({
      next: (years) => {
        this.yearOptions = years;
        this.isLoadingYears.set(false);
      },
      error: () => {
        // Fallback to current year on error
        this.yearOptions = [new Date().getFullYear()];
        this.isLoadingYears.set(false);
      }
    });
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex.set(event.index);
    this.activeTab.set(event.index);
  }

  isTabActive(index: number): boolean {
    return this.activeTab() === index;
  }

  getTabType(index: number): SummaryTabType {
    const tab = this.tabs[index];
    return tab.type as SummaryTabType;
  }

  // Accessibility
  getTabAriaLabel(tab: { label: string }): string {
    return `View goals ${tab.label}`;
  }
}
