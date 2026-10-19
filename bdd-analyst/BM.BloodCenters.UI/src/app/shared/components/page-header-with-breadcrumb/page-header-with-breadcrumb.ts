import { Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderConfig } from '@shared/interfaces/page-header-with-breadcrumb.interface';
import { PageHeaderService } from '@shared/services/page-header.service';

@Component({
  selector: 'app-page-header-with-breadcrumb',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    TranslateModule
  ],
  templateUrl: './page-header-with-breadcrumb.html',
  styleUrls: ['./page-header-with-breadcrumb.scss']
})
export class PageHeaderWithBreadcrumb {
  config = input.required<PageHeaderConfig>();

  private pageHeaderService = inject(PageHeaderService);

  /**
   * Computed title: Uses config.title if provided, otherwise uses dynamic title from current route
   */
  displayTitle = computed(() => {
    const cfg = this.config();
    if (cfg?.title) {
      return cfg.title;
    }
    return this.pageHeaderService.getTitle() || '';
  });

  /**
   * Computed subtitle: Uses config.subtitle if provided, otherwise uses dynamic subtitle from current route
   */
  displaySubtitle = computed(() => {
    const cfg = this.config();
    if (cfg?.subtitle !== undefined) {
      return cfg.subtitle;
    }
    return this.pageHeaderService.getSubtitle();
  });

  onActionClick(action: any): void {
    if (action.onClick && !action.disabled) {
      action.onClick();
    }
  }

  onBackButtonClick(): void {
    const cfg = this.config();
    if (cfg?.onBackClick) {
      cfg.onBackClick();
    }
  }

  trackByLabel(index: number, item: any): string {
    return item.label;
  }
}