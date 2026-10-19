import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';

import { QuickLink } from '@shared/interfaces/dialog.interface';

@Component({
  selector: 'app-quick-links',
  standalone: true,
  imports: [
    CommonModule,
    MatTooltipModule,
    TranslateModule
  ],
  templateUrl: './quick-links.html',
  styleUrls: ['./quick-links.scss']
})
export class QuickLinks {
  /** Section title */
  @Input() title: string = '';

  /** List of quick links */
  @Input() links: QuickLink[] = [];

  /** Disable all links globally */
  @Input() disabled: boolean = false;

  /** Tooltip to show when links are disabled */
  @Input() disabledTooltip: string = '';

  /** Emits when a link is clicked */
  @Output() linkClick = new EventEmitter<QuickLink>();

  /**
   * Handle link click
   */
  onLinkClick(link: QuickLink, event: Event): void {
    event.preventDefault();

    if (this.disabled || link.disabled) {
      return;
    }

    this.linkClick.emit(link);
  }

  /**
   * Get tooltip for a link
   */
  getTooltip(link: QuickLink): string {
    if (this.disabled) {
      return this.disabledTooltip;
    }
    if (link.disabled) {
      return link.tooltip || '';
    }
    return link.tooltip || '';
  }

  /**
   * Check if link is disabled
   */
  isLinkDisabled(link: QuickLink): boolean {
    return this.disabled || !!link.disabled;
  }

  /**
   * Track by function for ngFor
   */
  trackByLink(index: number, link: QuickLink): string {
    return link.id;
  }
}
