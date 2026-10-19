import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-include-exclude-info-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  templateUrl: './include-exclude-info-dialog.html',
  styleUrls: ['./include-exclude-info-dialog.scss'],
})
export class IncludeExcludeInfoDialogComponent {
  constructor(private dialogRef: MatDialogRef<IncludeExcludeInfoDialogComponent>) {}

  onClose(): void {
    this.dialogRef.close();
  }
}
