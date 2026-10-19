import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { ValidCatalogNumbersComponent } from '../valid-catalog-numbers/valid-catalog-numbers';
import { LotDetailsForBagsComponent } from '../lot-details-for-bags/lot-details-for-bags';

@Component({
  selector: 'app-component-product-management',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    PageHeaderWithBreadcrumb,
    ValidCatalogNumbersComponent,
    LotDetailsForBagsComponent,
  ],
  templateUrl: './component-product-management.html',
  styleUrls: ['./component-product-management.scss'],
})
export class ComponentProductManagementComponent implements OnInit {
  private readonly router = inject(Router);

  readonly selectedTabIndex = signal(0);

  readonly tabs = [
    { id: 'valid-catalog', label: 'Manage Catalog Numbers', route: '/laboratory-functions/component-production/valid-catalog-numbers' },
    { id: 'lot-details', label: 'Lot Details for Bags', route: '/laboratory-functions/component-production/lot-details-for-bags' },
  ];

  pageHeaderConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Component Product Management', link: null },
    ],
  };

  ngOnInit(): void {
    // Determine which tab to show based on current URL
    const currentUrl = this.router.url;
    if (currentUrl.includes('/lot-details-for-bags')) {
      this.selectedTabIndex.set(1);
    } else {
      this.selectedTabIndex.set(0); // Default to Valid Catalog Numbers
    }
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex.set(event.index);
    // Optionally navigate to the corresponding route when tab is clicked
    const selectedTab = this.tabs[event.index];
    if (selectedTab?.route) {
      this.router.navigate([selectedTab.route]);
    }
  }
}
