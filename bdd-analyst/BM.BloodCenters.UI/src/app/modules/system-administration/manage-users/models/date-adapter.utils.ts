/**
 * Custom Date Adapter and Date Formats for Manage Users module
 * Shared across add-user, edit-user, and assignChapter components
 */

import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import * as moment from 'moment';

/**
 * Custom Date Adapter to format month in uppercase and use chapter's local date as "today"
 */
export class CustomMomentDateAdapter extends MomentDateAdapter {
  private _chapterOffset: string = '+00:00';

  setChapterOffset(offset: string): void {
    this._chapterOffset = offset;
  }

  override format(date: moment.Moment, displayFormat: string): string {
    const formattedDate = super.format(date, displayFormat);
    // Replace month abbreviation with uppercase
    return formattedDate.replace(/([A-Z][a-z]{2})/g, (match) => match.toUpperCase());
  }

  override today(): moment.Moment {
    // Return chapter's local date instead of system date
    const chapterDate = DateFieldValidationUtility.getMinDate(this._chapterOffset);
    return moment.utc(chapterDate.format('YYYY-MM-DD'), 'YYYY-MM-DD');
  }
}

/**
 * Date format configuration for Material Datepicker
 */
export const MY_DATE_FORMATS = {
  parse: {
    dateInput: ['DD-MMM-YYYY', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'YYYY/MM/DD', 'DD-MM-YYYY', 'D-MMM-YYYY', 'D/M/YYYY'],
  },
  display: {
    dateInput: 'DD-MMM-YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'DD-MMM-YYYY',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
