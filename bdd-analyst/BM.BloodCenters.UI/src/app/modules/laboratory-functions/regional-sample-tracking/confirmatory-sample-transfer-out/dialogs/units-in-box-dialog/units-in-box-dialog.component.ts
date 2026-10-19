import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { BoxHeaderDto, BoxUnitDto } from '../../models/confirmatory-sample-transfer-out.model';

export interface UnitsInBoxDialogData {
  boxHeader: BoxHeaderDto;
  units: BoxUnitDto[];
}

@Component({
  selector: 'app-units-in-box-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './units-in-box-dialog.component.html',
  styleUrl: './units-in-box-dialog.component.scss',
})
export class UnitsInBoxDialogComponent {
  readonly data = inject<UnitsInBoxDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<UnitsInBoxDialogComponent>);

  protected readonly selectedUnit = signal<BoxUnitDto | null>(
    this.data.units.length > 0 ? this.data.units[0] : null
  );

  onSelectUnit(unit: BoxUnitDto): void {
    this.selectedUnit.set(unit);
  }

  onClose(): void {
    this.dialogRef.close();
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '--';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}-${month}-${year}, ${hours}:${minutes}`;
    } catch {
      return dateString;
    }
  }
}
