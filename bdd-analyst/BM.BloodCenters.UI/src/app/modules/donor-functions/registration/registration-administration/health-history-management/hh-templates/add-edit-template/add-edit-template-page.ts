import { Component, OnInit, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { MenuService } from '@shared/services/menu.service';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';

import { AddEditTemplate } from './add-edit-template';

@Component({
  selector: 'app-add-edit-template-page',
  standalone: true,
  imports: [
    CommonModule,
    MatSnackBarModule,
    PageHeaderWithBreadcrumb,
    AddEditTemplate
  ],
  template: `
    <main class="add-edit-template-page">
      <app-page-header-with-breadcrumb [config]="headerConfig"></app-page-header-with-breadcrumb>
      <div class="page-content">
        <app-add-edit-template
          (save)="onSaved($event)"
          (cancel)="onCancel()">
        </app-add-edit-template>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .add-edit-template-page {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
    }
    app-page-header-with-breadcrumb {
      display: block;
      flex-shrink: 0;
    }
    ::ng-deep .page-header-with-breadcrumb__header {
      display: none !important;
    }
    .page-content {
      flex: 1;
      overflow: hidden;
    }
  `]
})
export class AddEditTemplatePage implements OnInit {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private menuService = inject(MenuService);

  mode: 'add' | 'edit' | null = null;

  private readonly hhManagementPath = ROUTE_REGISTRY[RouteKey.HealthHistoryManagement].path;

  headerConfig: PageHeaderConfig = {
    breadcrumbs: [
      { label: 'Home', link: '/home' },
      { label: 'Health History Management', link: this.hhManagementPath },
      { label: 'Add New Template', link: null }
    ],
    title: '',
    subtitle: '',
    showBackButton: true,
    onBackClick: () => this.navigateBack(),
    actions: []
  };

  constructor() {
    this.loadRouteState();

    effect(() => {
      const menuItems = this.menuService.getMenuItemsSignal()();
      if (menuItems.length > 0) {
        const menuItem = this.menuService.findMenuItemByPath(this.hhManagementPath);
        if (menuItem) {
          const label = this.mode === 'edit' ? 'Edit Template' : 'Add New Template';
          this.headerConfig = {
            ...this.headerConfig,
            breadcrumbs: [
              { label: 'Home', link: '/home' },
              { label: menuItem.label, link: this.hhManagementPath },
              { label: label, link: null }
            ]
          };
        }
      }
    });
  }

  ngOnInit(): void {
    if (!this.mode) {
      this.router.navigate([this.hhManagementPath], { queryParams: { tab: 2 } });
    }
  }

  private loadRouteState(): void {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;

    if (state?.mode) {
      this.mode = state.mode;
    }
  }

  onSaved(templateId?: string): void {
    const message = templateId
      ? `Template ${templateId} saved successfully`
      : 'Template saved successfully';
    this.snackBar.open(message, 'DISMISS', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
    this.navigateBack();
  }

  onCancel(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    this.router.navigate([this.hhManagementPath], { queryParams: { tab: 2 } });
  }
}
