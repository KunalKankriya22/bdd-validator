import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatchedDonor } from '../../models/hla-rbc-request-query.model';

@Component({
  selector: 'app-donor-antigen-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './donor-antigen-dialog.html',
  styleUrls: ['./donor-antigen-dialog.scss']
})
export class DonorAntigenDialog {
  private dialogRef = inject(MatDialogRef<DonorAntigenDialog>);
  donor = inject<MatchedDonor>(MAT_DIALOG_DATA);

  onClose(): void {
    this.dialogRef.close();
  }
}
