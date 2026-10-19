import { Component, OnInit, OnDestroy, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialogModule } from '@angular/material/dialog';
import { ErrorCodeDialogService } from './services/error-code-dialog.service';
import { ErrorCodeFacadeService } from './services/error-code-facade.service';
import { ErrorCodeStateService } from './services/error-code-state.service';
import { TabType } from './models/error-code.model';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from '../../../core/constants/route-registry';
import { RouteKey } from '../../../core/constants/route-keys';

@Component({
  selector: 'app-error-codes',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTabsModule,
    RouterModule,
    MatDialogModule,
    TranslateModule,
    PageHeaderWithBreadcrumb
  ],
  templateUrl: './error-codes.html',
  styleUrl: './error-codes.scss',
})
export class ErrorCodes implements OnInit, OnDestroy {
  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Error Codes', link: null }
    ],
    actions: [{
      label: 'NEW CODE',
      icon: 'add',
      onClick: () => this.openNewCodeDialog()
    }]
  };
  selectedTabIndex = 0;
  get currentTab$() { return this.facade.currentTab$; }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private errorCodeDialogService: ErrorCodeDialogService,
    private facade: ErrorCodeFacadeService,
    private stateService: ErrorCodeStateService,
    private menuService: MenuService
  ) {
    effect(() => {
      const menuItem = this.menuService.findMenuItemByPath(
        ROUTE_REGISTRY[RouteKey.DonorErrorCodes].path
      );
      if (menuItem) {
        this.headerConfig = {
          ...this.headerConfig,
          title: menuItem.label,
          subtitle: menuItem.remarks?.trim() || menuItem.subtitle?.trim()
        };
      }
    });
  }

  ngOnInit(): void {
    // Clear all filters and state when component initializes
    this.stateService.resetAllStates();

    // Check the current active route and set tab accordingly
    const currentRoute = this.route.firstChild?.snapshot.routeConfig?.path;

    if (currentRoute) {
      // Route already exists (direct navigation to /donor, /lab, or /distribution)
      switch (currentRoute) {
        case 'donor':
          this.selectedTabIndex = 0;
          this.facade.changeTab(TabType.DONOR);
          break;
        case 'lab':
          this.selectedTabIndex = 1;
          this.facade.changeTab(TabType.LAB);
          break;
        case 'distribution':
          this.selectedTabIndex = 2;
          this.facade.changeTab(TabType.DISTRIBUTION);
          break;
      }
    } else {
      // No child route active, navigate to donor by default
      this.router.navigate(['donor'], { relativeTo: this.route });
      this.selectedTabIndex = 0;
      this.facade.changeTab(TabType.DONOR);
    }
  }

  ngOnDestroy(): void {
    // Clear all filter states when navigating away from error codes component
    this.stateService.resetAllStates();
  }

  openNewCodeDialog(): void {
    // Get the current tab type from facade
    const currentTabType = this.facade.currentTab$();

    this.errorCodeDialogService.openNewCodeDialog(currentTabType).subscribe(result => {
      // Dialog now handles API call internally and returns true on success
      // No need to make API call here
      if (result) {
        // Success - dialog already handled the API call and closed
      }
    });
  }

  onTabChange(event: MatTabChangeEvent): void {
    this.selectedTabIndex = event.index;
    const tabIndex = event.index;
    const routes: TabType[] = [TabType.DONOR, TabType.LAB, TabType.DISTRIBUTION];
    
    // Validate tab index is within valid range
    if (tabIndex >= 0 && tabIndex < routes.length) {
      this.router.navigate([routes[tabIndex]], { relativeTo: this.route });
      this.facade.changeTab(routes[tabIndex]);
    }
  }
  
  getTabIcon(tabName: string): string {
    const isActive = (tabName === 'donor' && this.selectedTabIndex === 0) ||
                     (tabName === 'lab' && this.selectedTabIndex === 1) ||
                     (tabName === 'distribution' && this.selectedTabIndex === 2);
    
    if (isActive) {
      return `assets/images/error-codes/${tabName}.svg`;
    } else {
      const filledImageMap: { [key: string]: string } = {
        'donor': 'filled-donor-functions',
        'lab': 'filled-lab', 
        'distribution': 'filled-distributions'
      };
      return `assets/images/navigation/${filledImageMap[tabName]}.svg`;
    }
  }
}
