import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

import { HHQuestionsTab } from './hh-questions/hh-questions.tab';
import { HHResponsesTab } from './hh-responses/hh-responses.tab';
import { HHTemplatesTab } from './hh-templates/hh-templates.tab';

@Component({
  selector: 'app-health-history-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb,
    HHQuestionsTab,
    HHResponsesTab,
    HHTemplatesTab
  ],
  templateUrl: './health-history-management.html',
  styleUrls: ['./health-history-management.scss']
})
export class HealthHistoryManagement implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private menuService = inject(MenuService);
  private route = inject(ActivatedRoute);

  selectedTabIndex = 0;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Health History Management', link: null }
    ],
    title: 'Health History Management',
    subtitle: '',
    actions: []
  };

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.HealthHistoryManagement].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || ''
          };
        }
      }
    });
  }

  ngOnInit(): void {
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const tab = Number(params['tab']);
        if (!isNaN(tab) && tab >= 0 && tab <= 2) {
          this.selectedTabIndex = tab;
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.selectedTabIndex = index;
  }

  private savedTitle = '';
  private savedSubtitle = '';

  onTemplateViewModeChange(event: { mode: 'list' | 'detail' | 'add'; templateId?: string }): void {
    const title = this.savedTitle || this.headerConfig.title || 'Health History Management';
    if (!this.savedTitle) {
      this.savedTitle = this.headerConfig.title || 'Health History Management';
      this.savedSubtitle = this.headerConfig.subtitle || '';
    }

    if (event.mode === 'detail' && event.templateId) {
      this.headerConfig = {
        ...this.headerConfig,
        title: '',
        subtitle: '',
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: title, link: null },
          { label: event.templateId, link: null }
        ]
      };
    } else {
      this.headerConfig = {
        ...this.headerConfig,
        title: this.savedTitle,
        subtitle: this.savedSubtitle,
        breadcrumbs: [
          { label: 'Home', link: '/home' },
          { label: title, link: null }
        ]
      };
    }
  }
}
