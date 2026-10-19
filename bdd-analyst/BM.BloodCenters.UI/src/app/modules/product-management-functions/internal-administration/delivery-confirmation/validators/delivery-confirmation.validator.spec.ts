import { FormControl } from '@angular/forms';
import moment from 'moment';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  receiptDateNotFutureValidator,
  receiptDateAfterShipmentValidator,
  timeFormatValidator,
} from './delivery-confirmation.validator';

describe('DeliveryConfirmation Validators', () => {
  describe('receiptDateNotFutureValidator', () => {
    const mockChapterTimezoneService = {
      getChapterLocalDate: () => moment().startOf('day')
    } as unknown as ChapterTimezoneService;

    const validator = receiptDateNotFutureValidator(mockChapterTimezoneService);





    it('should return error for future date', () => {
      const futureDate = moment().add(1, 'days').toDate();
      const control = new FormControl(futureDate);
      expect(validator(control)).toEqual({ receiptDateInFuture: true });
    });

  });

  describe('receiptDateAfterShipmentValidator', () => {
    const shipmentDate = '2024-01-15T09:30:00Z';





    it('should return error when receipt date is before shipment date', () => {
      const validator = receiptDateAfterShipmentValidator(shipmentDate);
      const control = new FormControl(moment('2024-01-10').toDate());
      expect(validator(control)).toEqual({ receiptBeforeShipment: true });
    });

  });

  describe('timeFormatValidator', () => {
    const validator = timeFormatValidator();



    it('should accept HH:mm format', () => {
      const control = new FormControl('14:30');
      expect(validator(control)).toBeNull();
    });

    it('should accept HH:mm:ss format', () => {
      const control = new FormControl('14:30:45');
      expect(validator(control)).toBeNull();
    });

    it('should accept 00:00', () => {
      const control = new FormControl('00:00');
      expect(validator(control)).toBeNull();
    });

    it('should accept 23:59', () => {
      const control = new FormControl('23:59');
      expect(validator(control)).toBeNull();
    });

    it('should accept 23:59:59', () => {
      const control = new FormControl('23:59:59');
      expect(validator(control)).toBeNull();
    });

    it('should reject invalid time format', () => {
      const control = new FormControl('invalid');
      expect(validator(control)).toEqual({ invalidTimeFormat: true });
    });

    it('should reject hours > 23', () => {
      const control = new FormControl('24:00');
      expect(validator(control)).toEqual({ invalidTimeFormat: true });
    });

    it('should reject minutes > 59', () => {
      const control = new FormControl('14:60');
      expect(validator(control)).toEqual({ invalidTimeFormat: true });
    });

    it('should reject seconds > 59', () => {
      const control = new FormControl('14:30:60');
      expect(validator(control)).toEqual({ invalidTimeFormat: true });
    });

    it('should reject single digit format', () => {
      const control = new FormControl('1:30');
      expect(validator(control)).toEqual({ invalidTimeFormat: true });
    });

    it('should reject time with AM/PM', () => {
      const control = new FormControl('02:30 PM');
      expect(validator(control)).toEqual({ invalidTimeFormat: true });
    });
  });
});
