import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ViewAttributeAntigenDialogData } from '../../models/initiate-hospital-transfer.model';

@Component({
  selector: 'app-view-attribute-antigen-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './view-attribute-antigen-dialog.html',
  styleUrls: ['./view-attribute-antigen-dialog.scss'],
})
export class ViewAttributeAntigenDialogComponent {
  readonly data = inject<ViewAttributeAntigenDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ViewAttributeAntigenDialogComponent>);

  onClose(): void {
    this.dialogRef.close();
  }
}
