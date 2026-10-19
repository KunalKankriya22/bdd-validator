import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SponsorDriveModel } from '../models/merge-duplicate-sponsors.model';

export interface ViewDrivesDialogData {
  sponsorId: string;
  sponsorName: string;
  drives: SponsorDriveModel[];
}

@Component({
  selector: 'app-view-drives-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './view-drives-dialog.html',
  styleUrls: ['./view-drives-dialog.scss']
})
export class ViewDrivesDialog {
  sortColumn: 'driveId' | 'driveDate' | 'driveType' | 'status' = 'driveId';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    public dialogRef: MatDialogRef<ViewDrivesDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ViewDrivesDialogData
  ) {}

  get sortedDrives(): SponsorDriveModel[] {
    const drives = [...this.data.drives];

    return drives.sort((a, b) => {
      let compareValue = 0;

      switch (this.sortColumn) {
        case 'driveId':
          compareValue = (a.driveId || '').localeCompare(b.driveId || '');
          break;
        case 'driveDate':
          compareValue = (a.driveDate || '').localeCompare(b.driveDate || '');
          break;
        case 'driveType':
          compareValue = (a.driveTypeDisplay || '').localeCompare(b.driveTypeDisplay || '');
          break;
        case 'status':
          compareValue = (a.status || '').localeCompare(b.status || '');
          break;
      }

      return this.sortDirection === 'asc' ? compareValue : -compareValue;
    });
  }

  sortBy(column: 'driveId' | 'driveDate' | 'driveType' | 'status'): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getSortIcon(column: 'driveId' | 'driveDate' | 'driveType' | 'status'): string {
    if (this.sortColumn !== column) {
      return '';
    }
    return this.sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  close(): void {
    this.dialogRef.close();
  }
}
