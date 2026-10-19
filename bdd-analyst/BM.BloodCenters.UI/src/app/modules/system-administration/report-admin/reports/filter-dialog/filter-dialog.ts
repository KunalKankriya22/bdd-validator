import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

export interface FilterDialogData {
  parameterType: string;
  upperFilter: string;
  listFilter: string;
  parameterTypes?: string[];
}

@Component({
  selector: 'app-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './filter-dialog.html',
  styleUrls: ['./filter-dialog.scss']
})
export class FilterDialogComponent {
  parameterType: string;
  upperFilter: string;
  listFilter: string;
  parameterTypes: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<FilterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: FilterDialogData
  ) {
    // Initialize with existing filter values
    this.parameterType = data.parameterType || 'all';
    this.upperFilter = data.upperFilter || 'all';
    this.listFilter = data.listFilter || 'all';
    this.parameterTypes = data.parameterTypes || [];
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  clearAll(): void {
    this.parameterType = 'all';
    this.upperFilter = 'all';
    this.listFilter = 'all';
    // Apply the cleared filters
    this.applyFilters();
  }

  applyFilters(): void {
    this.dialogRef.close({
      parameterType: this.parameterType,
      upperFilter: this.upperFilter,
      listFilter: this.listFilter
    });
  }
}
