import { Component, OnInit, OnDestroy, signal, computed, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { DriveEquipmentTabType } from './models/drive-equipment-parameters.model';

/**
 * Drive Equipment Parameters - Parent Component
 * Contains 4 tabs: Drive Profile, QC Parameters, QC Dependency, Physical Equipment
 */
@Component({
  selector: 'app-drive-equipment-parameters',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    RouterModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './drive-equipment-parameters.html',
  styleUrls: ['./drive-equipment-parameters.scss']
})
export class DriveEquipmentParameters implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private menuService = inject(MenuService);

  // Tab configuration
  readonly tabs = [
    { route: DriveEquipmentTabType.DRIVE_PROFILE, label: 'Drive Profile' },
    { route: DriveEquipmentTabType.QC_PARAMETERS, label: 'QC Parameters' },
    { route: DriveEquipmentTabType.QC_DEPENDENCY, label: 'QC Dependency' },
    { route: DriveEquipmentTabType.PHYSICAL_EQUIPMENT, label: 'Physical Equipment' }
  ];

  // Page header configuration - Dynamic from MenuService
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Drive Equipment Parms', link: null }
    ],
    title: 'Drive Equipment Parms',
    subtitle: ''
  };

  // Current tab state
  private currentTabIndex = signal<number>(0);
  selectedTabIndex = computed(() => this.currentTabIndex());

  constructor() {
    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();

      if (menuItems.length > 0) {
        const menuItem = this.menuService.findMenuItemByPath('/application-administration/donor-restricted-validation-tables/drive-equipment-parms');

        if (menuItem) {
          this.headerConfig = {
            breadcrumbs: [
              { label: 'Home', link: '/home' },
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
    // Use setTimeout to ensure router state is fully initialized
    setTimeout(() => {
      // Check if URL already contains a valid child route
      const currentUrl = this.router.url;

      // Remove query parameters and fragments, then split by '/'
      const urlPath = currentUrl.split('?')[0].split('#')[0];
      const urlSegments = urlPath.split('/').filter(segment => segment);
      const lastSegment = urlSegments[urlSegments.length - 1];

      // Find if the last URL segment matches any tab route
      const tabIndex = this.tabs.findIndex(tab => tab.route === lastSegment);

      if (tabIndex !== -1) {
        // URL already has a valid child route, just set the tab index
        this.currentTabIndex.set(tabIndex);
      } else {
        // No valid child route in URL, navigate to default
        this.router.navigate([DriveEquipmentTabType.DRIVE_PROFILE], {
          relativeTo: this.route,
          replaceUrl: true
        });
        this.currentTabIndex.set(0);
      }
    }, 0);
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  /**
   * Handles tab change event
   */
  onTabChange(event: MatTabChangeEvent): void {
    const tabIndex = event.index;

    if (tabIndex >= 0 && tabIndex < this.tabs.length) {
      this.currentTabIndex.set(tabIndex);
      this.router.navigate([this.tabs[tabIndex].route], { relativeTo: this.route });
    }
  }

  /**
   * Returns the tab icon based on active state
   */
  getTabIcon(tabRoute: string): string {
    const isActive = this.tabs[this.currentTabIndex()].route === tabRoute;

    const iconMap: Record<string, { active: string; inactive: string }> = {
      [DriveEquipmentTabType.DRIVE_PROFILE]: {
        active: 'assets/images/icons/drive-profile-active.svg',
        inactive: 'assets/images/icons/drive-profile.svg'
      },
      [DriveEquipmentTabType.QC_PARAMETERS]: {
        active: 'assets/images/icons/qc-parameters-active.svg',
        inactive: 'assets/images/icons/qc-parameters.svg'
      },
      [DriveEquipmentTabType.QC_DEPENDENCY]: {
        active: 'assets/images/icons/qc-dependency-active.svg',
        inactive: 'assets/images/icons/qc-dependency.svg'
      },
      [DriveEquipmentTabType.PHYSICAL_EQUIPMENT]: {
        active: 'assets/images/icons/physical-equipment-active.svg',
        inactive: 'assets/images/icons/physical-equipment.svg'
      }
    };

    // Return default icon if custom icons don't exist
    return isActive ? iconMap[tabRoute]?.active : iconMap[tabRoute]?.inactive;
  }
}
