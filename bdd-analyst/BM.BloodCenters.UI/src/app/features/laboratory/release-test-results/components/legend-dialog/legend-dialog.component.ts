import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CollectionDayLegendItem } from '../../models/release-test-results.models';

export interface LegendDialogData {
  legendData: CollectionDayLegendItem[];
}

@Component({
  selector: 'app-legend-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './legend-dialog.component.html',
  styleUrl: './legend-dialog.component.scss'
})
export class LegendDialogComponent {
  private static nextId = 0;
  protected readonly componentId = `legend-dialog-${LegendDialogComponent.nextId++}`;

  private readonly dialogRef = inject(MatDialogRef<LegendDialogComponent>);

  readonly legendItems: CollectionDayLegendItem[];

  constructor(@Inject(MAT_DIALOG_DATA) data: LegendDialogData) {
    this.legendItems = data?.legendData ?? [];
  }

  getColorClass(code: string): string {
    switch (code?.toUpperCase()) {
      case 'WHITE': return 'date-white';
      case 'YELLOW': return 'date-yellow';
      case 'GREEN': return 'date-green';
      case 'BLUE': return 'date-blue';
      case 'RED': return 'date-red';
      default: return '';
    }
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
