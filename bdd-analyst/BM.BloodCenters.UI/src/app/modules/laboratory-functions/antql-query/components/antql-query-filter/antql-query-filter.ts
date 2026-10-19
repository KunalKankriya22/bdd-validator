import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface AntqlFilterData {
  testIds: string[];
  selectedTestId: string | null;
}

@Component({
  selector: 'app-antql-query-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './antql-query-filter.html',
  styleUrl: './antql-query-filter.scss',
})
export class AntqlQueryFilterComponent {
  pendingTestId: string | null;

  constructor(
    private dialogRef: MatDialogRef<AntqlQueryFilterComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AntqlFilterData
  ) {
    this.pendingTestId = data.selectedTestId;
  }

  onApply(): void {
    this.dialogRef.close(this.pendingTestId);
  }

  onClear(): void {
    this.pendingTestId = null;
    this.dialogRef.close(null);
  }

  closeDialog(): void {
    this.dialogRef.close(undefined);
  }
}
