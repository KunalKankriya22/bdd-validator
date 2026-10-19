import { Component, signal, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { SpProductsSpecialProcessesComponent } from '../sp-products-special-processes/sp-products-special-processes.component';
import { SpProcessesStagesComponent } from '../sp-processes-stages/sp-processes-stages.component';

@Component({
  selector: 'app-special-processing-workflows',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb,
    SpProductsSpecialProcessesComponent,
    SpProcessesStagesComponent,
  ],
  templateUrl: './special-processing-workflows.html',
  styleUrls: ['./special-processing-workflows.scss'],
})
export class SpecialProcessingWorkflowsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pageHeaderService = inject(PageHeaderService);
  private menuService = inject(MenuService);

  private readonly PRODUCTS_PATH = '/laboratory-functions/component-production/special-processing-workflows/products';

  readonly selectedTabIndex = signal(0);

  readonly tabs = [
    { id: 'stages', label: 'Stages' },
    { id: 'products', label: 'Products' },
  ];

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
    ],
    title: '',
    subtitle: '',
  };

  constructor() {
    effect(() => {
      let pageData = this.pageHeaderService.pageHeaderData();
      if (!pageData) {
        const fallbackItem = this.menuService.findMenuItemByPath(this.PRODUCTS_PATH);
        if (fallbackItem) {
          pageData = {
            title: fallbackItem.label,
            subtitle: fallbackItem.remarks?.trim() || fallbackItem.subtitle?.trim(),
          };
        }
      }
      if (pageData) {
        this.pageHeaderConfig = {
          ...this.pageHeaderConfig,
          breadcrumbs: [
            { label: 'Home', link: '/home' },
            { label: pageData.title, link: null },
          ],
          title: pageData.title,
          subtitle: pageData.subtitle || '',
        };
      }
    });
  }

  ngOnInit(): void {
    // Determine tab based on URL path
    const urlPath = this.route.snapshot.url.map(segment => segment.path).join('/');

    if (urlPath.includes('stages')) {
      this.selectedTabIndex.set(0);
    } else if (urlPath.includes('products')) {
      this.selectedTabIndex.set(1);
    } else {
      // Fallback to query params if no specific path
      this.route.queryParams
        .pipe(takeUntil(this.destroy$))
        .subscribe(params => {
          const tab = Number(params['tab']);
          if (!isNaN(tab) && (tab === 0 || tab === 1)) {
            this.selectedTabIndex.set(tab);
          } else {
            this.selectedTabIndex.set(1); // Default to Products tab
          }
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(event: MatTabChangeEvent): void {
    const tab = this.tabs[event.index];
    const basePath = '/laboratory-functions/component-production/special-processing-workflows';

    if (tab.id === 'stages') {
      this.router.navigate([`${basePath}/stages`]);
    } else if (tab.id === 'products') {
      this.router.navigate([`${basePath}/products`]);
    }
  }
}
