import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { Subject, filter, takeUntil } from 'rxjs';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';
import { ROUTES } from '../../../core/constants/route.constants';

@Component({
  selector: 'app-donor-survey-manager',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './donor-survey-manager.html',
  styleUrls: ['./donor-survey-manager.scss']
})
export class DonorSurveyManagerComponent implements OnInit, OnDestroy {
  selectedTabIndex = 0;
  private destroy$ = new Subject<void>();
  private readonly routes = ['qa-library', 'survey-template', 'access-management'];

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [],
    title: '',
    subtitle: '',
    actions: []
  };

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private menuService = inject(MenuService);

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const basePath = ROUTE_REGISTRY[RouteKey.DonorSurveyManager].path;
        const menuItem = this.menuService.findMenuItemByPath(basePath);

        if (menuItem) {
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: ROUTES.HOME },
              { label: menuItem.label, link: null }
            ],
            title: menuItem.label,
            subtitle: menuItem.remarks || menuItem.subtitle || ''
          };
        }
      }
    });
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
