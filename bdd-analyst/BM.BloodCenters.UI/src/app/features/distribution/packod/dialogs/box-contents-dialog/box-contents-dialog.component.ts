import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { BoxContentItemDto } from '../../models';

export interface BoxContentsDialogData {
  boxId: string;
  boxContents: BoxContentItemDto[];
}

@Component({
  selector: 'app-box-contents-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule
  ],
  templateUrl: './box-contents-dialog.component.html',
  styleUrls: ['./box-contents-dialog.component.scss']
})
export class BoxContentsDialogComponent {
  readonly data = inject<BoxContentsDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<BoxContentsDialogComponent>);

  readonly displayedColumns: string[] = ['unitId', 'expDate', 'productType', 'productCode', 'aboDesc'];
  protected readonly products = signal<BoxContentItemDto[]>(this.data.boxContents ?? []);

  formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return '';
    const d = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      .toUpperCase().replace(/ /g, '-');
    const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${d}  ${t}`;
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
