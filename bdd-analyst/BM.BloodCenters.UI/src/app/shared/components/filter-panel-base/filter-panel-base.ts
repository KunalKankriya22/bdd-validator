import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Shared base component for filter panels with consistent structure and styling.
 * Provides a fixed-height panel with scrollable content area.
 *
 * Usage:
 * <app-filter-panel-base
 *   [title]="'Filters'"
 *   [maxContentHeight]="280"
 *   [width]="350"
 *   (apply)="onApply()"
 *   (clear)="onClear()"
 *   (close)="onClose()">
 *   <!-- Project your filter form fields here -->
 *   <mat-form-field appearance="fill">
 *     <mat-label>Field Name</mat-label>
 *     <mat-select>...</mat-select>
 *   </mat-form-field>
 * </app-filter-panel-base>
 */
@Component({
  selector: 'app-filter-panel-base',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './filter-panel-base.html',
  styleUrls: ['./filter-panel-base.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterPanelBase {
  /**
   * Title displayed in the filter panel header
   */
  @Input() title: string = 'Filters';

  /**
   * Maximum height for the scrollable content area in pixels
   * @default 280
   */
  @Input() maxContentHeight: number = 280;

  /**
   * Width of the filter panel in pixels
   * @default 350
   */
  @Input() width: number = 350;

  /**
   * Label for the clear button
   * @default 'CLEAR ALL'
   */
  @Input() clearButtonLabel: string = 'CLEAR ALL';

  /**
   * Label for the apply button
   * @default 'APPLY'
   */
  @Input() applyButtonLabel: string = 'APPLY';

  /**
   * Whether to show the clear button
   * @default true
   */
  @Input() showClearButton: boolean = true;

  /**
   * Whether the clear button is disabled
   * @default false
   */
  @Input() clearDisabled: boolean = false;

  /**
   * Whether the apply button is disabled
   * @default false
   */
  @Input() applyDisabled: boolean = false;

  /**
   * Emitted when the apply button is clicked
   */
  @Output() apply = new EventEmitter<void>();

  /**
   * Emitted when the clear button is clicked
   */
  @Output() clear = new EventEmitter<void>();

  /**
   * Emitted when the close button is clicked
   */
  @Output() close = new EventEmitter<void>();

  /**
   * Handle apply button click
   */
  onApply(): void {
    this.apply.emit();
  }

  /**
   * Handle clear button click
   */
  onClear(): void {
    this.clear.emit();
  }

  /**
   * Handle close button click
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Get the panel width as a CSS value
   */
  get panelWidth(): string {
    return `${this.width}px`;
  }

  /**
   * Get the content max-height as a CSS value
   */
  get contentMaxHeight(): string {
    return `${this.maxContentHeight}px`;
  }
}
