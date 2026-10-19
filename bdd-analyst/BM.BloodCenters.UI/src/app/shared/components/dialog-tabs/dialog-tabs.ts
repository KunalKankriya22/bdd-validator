import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { DialogTab } from '@shared/interfaces/dialog.interface';

@Component({
  selector: 'app-dialog-tabs',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './dialog-tabs.html',
  styleUrls: ['./dialog-tabs.scss']
})
export class DialogTabs implements OnInit {
  /** Array of tabs to display */
  @Input() tabs: DialogTab[] = [];

  /** Currently active tab ID */
  @Input() activeTab: string = '';

  /** Emits when active tab changes */
  @Output() tabChange = new EventEmitter<string>();

  ngOnInit(): void {
    // Set first tab as active if none specified
    if (!this.activeTab && this.tabs.length > 0) {
      this.activeTab = this.tabs[0].id;
    }
  }

  /**
   * Handle tab click
   */
  onTabClick(tab: DialogTab): void {
    if (tab.disabled) {
      return;
    }

    if (this.activeTab !== tab.id) {
      this.activeTab = tab.id;
      this.tabChange.emit(tab.id);
    }
  }

  /**
   * Handle keyboard navigation
   */
  onKeyDown(event: KeyboardEvent, tab: DialogTab, index: number): void {
    let nextIndex: number | null = null;

    switch (event.key) {
      case 'ArrowLeft':
        nextIndex = index > 0 ? index - 1 : this.tabs.length - 1;
        break;
      case 'ArrowRight':
        nextIndex = index < this.tabs.length - 1 ? index + 1 : 0;
        break;
      case 'Home':
        nextIndex = 0;
        break;
      case 'End':
        nextIndex = this.tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.onTabClick(tab);
        return;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextTab = this.tabs[nextIndex];
      if (!nextTab.disabled) {
        this.onTabClick(nextTab);
        // Focus the next tab button
        const tabButtons = document.querySelectorAll('.dialog-tabs__tab');
        (tabButtons[nextIndex] as HTMLElement)?.focus();
      }
    }
  }

  /**
   * Check if tab is active
   */
  isActive(tab: DialogTab): boolean {
    return this.activeTab === tab.id;
  }

  /**
   * Track by function for tabs
   */
  trackByTab(index: number, tab: DialogTab): string {
    return tab.id;
  }
}
