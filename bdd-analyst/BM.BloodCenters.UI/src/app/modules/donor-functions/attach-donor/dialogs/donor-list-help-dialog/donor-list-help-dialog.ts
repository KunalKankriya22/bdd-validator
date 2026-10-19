import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Donor List Help Dialog
 * Displays information about active/inactive donor lists
 * Content is hard-coded as specified in developer notes
 */
@Component({
  selector: 'app-donor-list-help-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './donor-list-help-dialog.html',
  styleUrl: './donor-list-help-dialog.scss'
})
export class DonorListHelpDialogComponent {
  constructor(private dialogRef: MatDialogRef<DonorListHelpDialogComponent>) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
