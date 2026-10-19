import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-print-transfer-slip-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './print-transfer-slip-dialog.html',
  styleUrls: ['./print-transfer-slip-dialog.scss'],
})
export class PrintTransferSlipDialogComponent {
  private readonly dialogRef = inject(MatDialogRef<PrintTransferSlipDialogComponent>);

  onNo(): void {
    this.dialogRef.close(false);
  }

  onYes(): void {
    this.dialogRef.close(true);
  }
}
