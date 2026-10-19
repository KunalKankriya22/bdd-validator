import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { DialogButton } from '@shared/interfaces/dialog.interface';

/**
 * SidePanelBase - Reusable side panel component that slides in from the right.
 *
 * Usage:
 * ```html
 * <app-side-panel-base
 *   [title]="'Panel Title'"
 *   [footerButtons]="buttons"
 *   (closePanel)="onClose()"
 *   (buttonClick)="onButtonClick($event)">
 *
 *   <ng-container panelHeaderFields>
 *     <app-dialog-header-fields [fields]="headerFields"></app-dialog-header-fields>
 *   </ng-container>
 *
 *   <ng-container panelTabs>
 *     <app-dialog-tabs [tabs]="tabs" ...></app-dialog-tabs>
 *   </ng-container>
 *
 *   <ng-container panelContent>
 *     <!-- Main content here -->
 *   </ng-container>
 * </app-side-panel-base>
 * ```
 */
@Component({
  selector: 'app-side-panel-base',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './side-panel-base.html',
  styleUrl: './side-panel-base.scss'
})
export class SidePanelBase {
  /** Panel title displayed in the header */
  @Input() title: string = '';

  /** Panel width - can be any valid CSS width value (e.g., '754px', '50%', '600px') */
  @Input() width: string = '754px';

  /** Whether to show the footer section */
  @Input() showFooter: boolean = true;

  /** Footer button configuration */
  @Input() footerButtons: DialogButton[] = [];

  /** Aria label for the close button */
  @Input() closeButtonAriaLabel: string = 'Close panel';

  /** Emitted when the panel should be closed */
  @Output() closePanel = new EventEmitter<void>();

  /** Emitted when a footer button is clicked */
  @Output() buttonClick = new EventEmitter<string>();

  /**
   * Handle Escape key to close the panel
   */
  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closePanel.emit();
  }

  /**
   * Handle close button click
   */
  onCloseClick(): void {
    this.closePanel.emit();
  }

  /**
   * Handle footer button click
   */
  onButtonClick(action: string): void {
    this.buttonClick.emit(action);
  }

  /**
   * Track function for footer buttons
   */
  trackByButton(index: number, btn: DialogButton): string {
    return btn.action;
  }
}
