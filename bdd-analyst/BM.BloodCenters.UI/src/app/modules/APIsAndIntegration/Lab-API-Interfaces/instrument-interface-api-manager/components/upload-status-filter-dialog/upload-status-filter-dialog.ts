import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, DateAdapter } from '@angular/material/core';
import { MatMomentDateModule, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import moment, { Moment } from 'moment';

export interface UploadStatusFilterData {
  chapterId: string;
  instrumentId: string;
  appliedFilters?: {
    fileId?: string;
    testBatchId?: string;
    status?: string;
    period?: string;
    processDate?: Date | null;
  };
  uploadStatusList?: any[];
  statusOptions?: { value: string; label: string }[];
}

// Custom DateAdapter to use chapter timezone for "today"
class ChapterTimezoneCustomDateAdapter extends MomentDateAdapter {
  private chapterMinDate: Moment | null = null;

  setChapterMinDate(date: Moment): void {
    this.chapterMinDate = date;
  }

  override today(): Moment {
    // Return chapter timezone's current date instead of browser's local date
    return this.chapterMinDate ? this.chapterMinDate.clone() : moment();
  }

  override format(date: Moment, displayFormat: string): string {
    const formatted = super.format(date, displayFormat);
    return formatted.toUpperCase();
  }
}

@Component({
  selector: 'app-upload-status-filter-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatMomentDateModule,
    MatProgressSpinnerModule,
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterTimezoneCustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './upload-status-filter-dialog.html',
  styleUrls: ['./upload-status-filter-dialog.scss'],
})
export class UploadStatusFilterDialog implements OnInit {
  fileId: string = '';
  testBatchId: string = '';
  status: string = '';
  period: string = '';
  processDate: Date | null = null;

  fileIdOptions: string[] = [];
  testBatchIdOptions: string[] = [];
  loadingFileIds = false;
  loadingTestBatchIds = false;

  dateInvalid: boolean = false;
  minDate!: Moment;

  statusOptions: { value: string; label: string }[] = [];

  constructor(
    private dialogRef: MatDialogRef<UploadStatusFilterDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UploadStatusFilterData,
    private instrumentService: InstrumentInterfaceService,
    private headerService: HeaderService,
    private dateAdapter: DateAdapter<Moment>
  ) {
    // Get chapter timezone and set minDate based on chapter date
    const chapterTimezone = this.headerService.chapterTimeZone();
    this.minDate = DateFieldValidationUtility.getMinDate(chapterTimezone);

    // Set chapter timezone's current date as "today" for the datepicker
    if (this.dateAdapter instanceof ChapterTimezoneCustomDateAdapter) {
      this.dateAdapter.setChapterMinDate(this.minDate);
    }

    this.statusOptions = data?.statusOptions || [];

    if (data?.appliedFilters) {
      this.fileId = data.appliedFilters.fileId || '';
      this.testBatchId = data.appliedFilters.testBatchId || '';
      this.status = data.appliedFilters.status || '';
      this.period = data.appliedFilters.period || '';
      this.processDate = data.appliedFilters.processDate || null;
    }
  }

  ngOnInit(): void {
    this.loadFileIds();
    this.loadTestBatchIds();
    if (this.statusOptions.length === 0) {
      this.loadStatusOptions();
    }
  }

  loadFileIds(): void {
    // Extract unique File IDs from upload status list
    if (this.data.uploadStatusList && this.data.uploadStatusList.length > 0) {
      const uniqueFileIds = [...new Set(this.data.uploadStatusList.map((item: any) => item.fileId))];
      this.fileIdOptions = uniqueFileIds.filter(id => id).sort();
      this.loadingFileIds = false;
    } else {
      // Fallback to API if no data available
      if (!this.data.chapterId || !this.data.instrumentId) {
        return;
      }

      this.loadingFileIds = true;
      this.instrumentService
        .getFileIds(this.data.chapterId, this.data.instrumentId)
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

  loadTestBatchIds(): void {
    // Extract unique Test Batch IDs from upload status list
    if (this.data.uploadStatusList && this.data.uploadStatusList.length > 0) {
      const uniqueTestBatchIds = [...new Set(this.data.uploadStatusList.map((item: any) => item.ltTbId))];
      this.testBatchIdOptions = uniqueTestBatchIds.filter(id => id).sort();
      this.loadingTestBatchIds = false;
    } else {
      // Fallback to API if no data available
      if (!this.data.chapterId || !this.data.instrumentId) {
        return;
      }

      this.loadingTestBatchIds = true;
      this.instrumentService
        .getTestBatchIds(this.data.chapterId, this.data.instrumentId)
        .subscribe({
          next: (response) => {
            this.testBatchIdOptions = response.data?.map((item: any) => item.ltTbId || item) || [];
            this.loadingTestBatchIds = false;
          },
          error: () => {
            this.loadingTestBatchIds = false;
          },
        });
    }
  }

  apply(): void {
    this.dateInvalid = Boolean((this.period && !this.processDate) || (!this.period && this.processDate));

    if (this.dateInvalid) return;

    this.dialogRef.close({
      fileId: this.fileId,
      testBatchId: this.testBatchId,
      status: this.status,
      period: this.period,
      processDate: this.processDate,
    });
  }

  clearAll(): void {
    this.fileId = '';
    this.testBatchId = '';
    this.status = '';
    this.period = '';
    this.processDate = null;
    this.dateInvalid = false;
  }

  close(): void {
    this.dialogRef.close();
  }

  private loadStatusOptions(): void {
    if (!this.data.chapterId || !this.data.instrumentId) return;
    this.instrumentService.getUploadStatuses(this.data.chapterId, this.data.instrumentId).subscribe({
      next: (options) => this.statusOptions = options,
      error: () => this.statusOptions = [],
    });
  }
}
