import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export interface RawDataFilterData {
  chapterId: string;
  instrumentId: string;
  appliedFilters?: {
    fileId?: string;
  };
  rawDataList?: any[];
}

@Component({
  selector: 'app-raw-data-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './raw-data-filter-dialog.html',
  styleUrls: ['./raw-data-filter-dialog.scss'],
})
export class RawDataFilterDialog implements OnInit {
  fileId: string = '';

  fileIdOptions: string[] = [];
  loadingFileIds = false;

  constructor(
    private dialogRef: MatDialogRef<RawDataFilterDialog>,
    @Inject(MAT_DIALOG_DATA) public data: RawDataFilterData,
    private instrumentService: InstrumentInterfaceService
  ) {
    if (data?.appliedFilters) {
      this.fileId = data.appliedFilters.fileId || '';
    }
  }

  ngOnInit(): void {
    this.loadFileIds();
  }

  loadFileIds(): void {
    // Extract unique File IDs from the raw data list
    if (this.data.rawDataList && this.data.rawDataList.length > 0) {
      const uniqueFileIds = [...new Set(this.data.rawDataList.map((item: any) => item.fileId))];
      this.fileIdOptions = uniqueFileIds.sort();
      this.loadingFileIds = false;
    } else {
      // Fallback to API call if no raw data is available
      if (!this.data.chapterId || !this.data.instrumentId) {
        return;
      }

      this.loadingFileIds = true;
      this.instrumentService
        .getPendingFileIds(this.data.chapterId, this.data.instrumentId)
        .subscribe({
          next: (response) => {
            this.fileIdOptions = response.data?.map((item: any) => item.fileId || item) || [];
            this.loadingFileIds = false;
          },
          error: () => {
            this.loadingFileIds = false;
          },
        });
    }
  }

  apply(): void {
    this.dialogRef.close({
      fileId: this.fileId,
    });
  }

  clearAll(): void {
    this.fileId = '';
  }

  close(): void {
    this.dialogRef.close();
  }
}
