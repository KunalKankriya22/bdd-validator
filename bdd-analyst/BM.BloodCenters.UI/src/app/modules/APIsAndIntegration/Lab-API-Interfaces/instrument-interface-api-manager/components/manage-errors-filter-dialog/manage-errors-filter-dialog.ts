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
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { HeaderService } from '@shared/services/header.service';
import moment, { Moment } from 'moment';

export interface ManageErrorsFilterData {
  machineTestIds: string[];
  appliedFilters?: {
    machineTestId?: string;
    effDatePeriod?: string;
    effDate?: Date | null;
    termDatePeriod?: string;
    termDate?: Date | null;
  };
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
  selector: 'app-manage-errors-filter-dialog',
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
  ],
  providers: [
    { provide: DateAdapter, useClass: ChapterTimezoneCustomDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
  ],
  templateUrl: './manage-errors-filter-dialog.html',
  styleUrls: ['./manage-errors-filter-dialog.scss'],
})
export class ManageErrorsFilterDialog implements OnInit {
  machineTestId: string = '';
  effDatePeriod: string = 'after';
  effDate: Date | null = null;
  termDatePeriod: string = 'after';
  termDate: Date | null = null;

  dateInvalid: boolean = false;
  minDate!: Moment;

  constructor(
    private dialogRef: MatDialogRef<ManageErrorsFilterDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ManageErrorsFilterData,
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

    if (data?.appliedFilters) {
      this.machineTestId = data.appliedFilters.machineTestId || '';
      this.effDatePeriod = data.appliedFilters.effDatePeriod || 'after';
      this.effDate = data.appliedFilters.effDate || null;
      this.termDatePeriod = data.appliedFilters.termDatePeriod || 'after';
      this.termDate = data.appliedFilters.termDate || null;
    }
  }

  ngOnInit(): void {}

  apply(): void {
    // Validate effective date
    const effDateInvalid = Boolean(
      (this.effDatePeriod && !this.effDate) || (!this.effDatePeriod && this.effDate)
    );

    // Validate termination date
    const termDateInvalid = Boolean(
      (this.termDatePeriod && !this.termDate) || (!this.termDatePeriod && this.termDate)
    );

    this.dateInvalid = effDateInvalid || termDateInvalid;

    if (this.dateInvalid) return;

    this.dialogRef.close({
      machineTestId: this.machineTestId,
      effDatePeriod: this.effDatePeriod,
      effDate: this.effDate,
      termDatePeriod: this.termDatePeriod,
      termDate: this.termDate,
    });
  }

  clearAll(): void {
    this.machineTestId = '';
    this.effDatePeriod = 'after';
    this.effDate = null;
    this.termDatePeriod = 'after';
    this.termDate = null;
    this.dateInvalid = false;
  }

  close(): void {
    this.dialogRef.close();
  }
}
