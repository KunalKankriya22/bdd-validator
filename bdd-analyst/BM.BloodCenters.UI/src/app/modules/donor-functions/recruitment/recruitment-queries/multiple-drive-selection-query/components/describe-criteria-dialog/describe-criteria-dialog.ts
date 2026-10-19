import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface DescribeCriteriaDialogData {
  criteriaList: string[];
}

@Component({
  selector: 'app-describe-criteria-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './describe-criteria-dialog.html',
  styleUrls: ['./describe-criteria-dialog.scss']
})
export class DescribeCriteriaDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DescribeCriteriaDialogData,
    private dialogRef: MatDialogRef<DescribeCriteriaDialog>
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
