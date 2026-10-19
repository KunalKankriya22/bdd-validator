import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { DialogHeaderField } from '@shared/interfaces/dialog.interface';

@Component({
  selector: 'app-dialog-header-fields',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule
  ],
  templateUrl: './dialog-header-fields.html',
  styleUrls: ['./dialog-header-fields.scss']
})
export class DialogHeaderFields {
  /** Array of header fields to display */
  @Input() fields: DialogHeaderField[] = [];

  /** Placeholder for empty values */
  @Input() emptyValuePlaceholder: string = '--';

  /** Layout mode */
  @Input() layout: 'row' | 'grid' = 'row';

  /** Number of columns for grid layout */
  @Input() columns: number = 2;

  /** Custom gap for grid layout (e.g., '4px', '8px') */
  @Input() gap?: string;

  /** Custom column gap for grid layout */
  @Input() columnGap?: string;

  /** Custom row gap for grid layout */
  @Input() rowGap?: string;

  /**
   * Get display value for a field
   */
  getDisplayValue(field: DialogHeaderField): string {
    if (field.value === null || field.value === undefined || field.value === '') {
      return this.emptyValuePlaceholder;
    }
    return String(field.value);
  }

  /**
   * Get grid template columns style
   */
  getGridStyle(): { [key: string]: string } {
    if (this.layout === 'grid') {
      const style: { [key: string]: string } = {
        'grid-template-columns': `repeat(${this.columns}, 1fr)`
      };

      if (this.gap) {
        style['gap'] = this.gap;
      }
      if (this.columnGap) {
        style['column-gap'] = this.columnGap;
      }
      if (this.rowGap) {
        style['row-gap'] = this.rowGap;
      }

      return style;
    }
    return {};
  }

  /**
   * Track by function for fields
   */
  trackByField(index: number, field: DialogHeaderField): string {
    return field.label + index;
  }
}
