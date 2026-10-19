import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import moment from 'moment';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

/**
 * Validates that receipt date is not in the future
 * Uses chapter local date for timezone-aware validation
 */
export function receiptDateNotFutureValidator(chapterTimezoneService: ChapterTimezoneService): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const receiptDate = moment(control.value);
    if (!receiptDate.isValid()) {
      return null;
    }

    const today = chapterTimezoneService.getChapterLocalDate();
    const receiptDateOnly = receiptDate.clone().startOf('day');

    if (receiptDateOnly.isAfter(today)) {
      return { receiptDateInFuture: true };
    }

    return null;
  };
}

/**
 * Validates that receipt date is not before shipment date
 * This is a form-level validator that checks both fields
 */
export function receiptDateAfterShipmentValidator(shipmentDate: string | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value || !shipmentDate) {
      return null;
    }

    const receiptDate = moment(control.value);
    const shipDate = moment(shipmentDate);

    if (!receiptDate.isValid() || !shipDate.isValid()) {
      return null;
    }

    const receiptDateOnly = receiptDate.clone().startOf('day');
    const shipDateOnly = shipDate.clone().startOf('day');

    if (receiptDateOnly.isBefore(shipDateOnly)) {
      return { receiptBeforeShipment: true };
    }

    return null;
  };
}

/**
 * Validates time format (HH:mm or HH:mm:ss)
 */
export function timeFormatValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
    if (!timePattern.test(control.value)) {
      return { invalidTimeFormat: true };
    }

    return null;
  };
}
