import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { of } from 'rxjs';
import moment from 'moment';

import { AddEditOrderClass } from './add-edit-order-class';
import { OrderClassCodesService } from '../services/order-class-codes.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { OrderClassCodesModel } from '../models/order-class-codes.model';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditOrderClass', () => {
  let component: AddEditOrderClass;
  let fixture: ComponentFixture<AddEditOrderClass>;
  let mockOrderClassCodesService: jasmine.SpyObj<OrderClassCodesService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: { chapterId: jasmine.Spy };
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const mockEditData: OrderClassCodesModel = {
    orderClass: 'AD',
    chapterId: 'DAL',
    description: 'After Processing',
    priority: 11,
    hours: 12,
    displayFlag: 'Y',
    effectiveDate: new Date('2026-12-04T00:00:00'),
    terminationDate: new Date('2026-12-18T11:11:49.570Z')
  };

  beforeEach(() => {
    mockOrderClassCodesService = jasmine.createSpyObj('OrderClassCodesService', [
      'addOrderClassCode',
      'updateOrderClassCode'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockHeaderService = {
      chapterId: jasmine.createSpy('chapterId').and.returnValue('DAL')
    };

    mockChapterTimezoneService = jasmine.createSpyObj<ChapterTimezoneService>('ChapterTimezoneService', ['getChapterLocalDate', 'isChapterLocalDateAvailable']);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2026-04-16'));
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);

    mockOrderClassCodesService.addOrderClassCode.and.returnValue(of({ message: 'Created' } as any));
    mockOrderClassCodesService.updateOrderClassCode.and.returnValue(of({ message: 'Updated' } as any));

    TestBed.configureTestingModule({
      imports: [AddEditOrderClass],
      providers: [
        provideAnimationsAsync(),
        { provide: OrderClassCodesService, useValue: mockOrderClassCodesService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    });

    mockOrderClassCodesService.addOrderClassCode.calls.reset();
    mockOrderClassCodesService.updateOrderClassCode.calls.reset();
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2026-04-16'));
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
    mockOrderClassCodesService.addOrderClassCode.and.returnValue(of({ message: 'Created' } as any));
    mockOrderClassCodesService.updateOrderClassCode.and.returnValue(of({ message: 'Updated' } as any));

    fixture = TestBed.createComponent(AddEditOrderClass);
    component = fixture.componentInstance;
  });


  it('should call add API with chapterId from HeaderService', fakeAsync(() => {
    spyOn(component.saveSuccess, 'emit');
    spyOn(component.closePanel, 'emit');

    component.mode = 'add';
    fixture.detectChanges();

    component.form.patchValue({
      orderClass: 'ST',
      description: 'Stat',
      priority: 22,
      hours: 8,
      displayInOrders: true,
      effectiveDate: moment('2026-12-04T00:00:00'),
      terminationDate: moment('2026-12-18T11:11:49.570Z')
    });

    component.onSave();
    tick();

    expect(mockHeaderService.chapterId).toHaveBeenCalled();
    expect(mockOrderClassCodesService.addOrderClassCode).toHaveBeenCalledWith(
      jasmine.objectContaining({
        orderClass: 'ST',
        chapterId: 'DAL',
        description: 'Stat',
        priority: 22,
        hours: 8,
        displayFlag: 'Y'
      })
    );
    expect(component.saveSuccess.emit).toHaveBeenCalled();
    expect(component.closePanel.emit).toHaveBeenCalled();
  }));

  it('should call update API with chapterId from HeaderService in edit mode', fakeAsync(() => {
    component.mode = 'edit';
    component.data = mockEditData;
    fixture.detectChanges();

    component.form.patchValue({
      description: 'After 6 pm1',
      priority: 11,
      hours: 12,
      displayInOrders: true,
      effectiveDate: moment('2026-12-04T00:00:00'),
      terminationDate: moment('2026-12-18T11:11:49.570Z')
    });

    component.onSave();
    tick();

    expect(mockHeaderService.chapterId).toHaveBeenCalled();
    expect(mockOrderClassCodesService.updateOrderClassCode).toHaveBeenCalledWith(
      jasmine.objectContaining({
        orderClass: 'AD',
        chapterId: 'DAL',
        description: 'After 6 pm1',
        priority: 11,
        hours: 12,
        displayFlag: 'Y'
      })
    );
  }));


  describe('Order Class Validation', () => {
    it('should convert Order Class input to uppercase', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const mockInput = document.createElement('input');
      mockInput.value = 'st';
      const mockEvent = { target: mockInput } as unknown as Event;

      component.onOrderClassInput(mockEvent);

      expect(mockInput.value).toBe('ST');
      expect(component.form.get('orderClass')?.value).toBe('ST');
    });

    it('should validate Order Class has exactly 2 characters', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const orderClassControl = component.form.get('orderClass');

      // Test single character
      orderClassControl?.setValue('A');
      orderClassControl?.markAsTouched();
      expect(orderClassControl?.hasError('minlength')).toBe(true);

      // Test 3 characters
      orderClassControl?.setValue('ABC');
      orderClassControl?.markAsTouched();
      expect(orderClassControl?.hasError('maxlength')).toBe(true);

      // Test exactly 2 characters
      orderClassControl?.setValue('AB');
      orderClassControl?.markAsTouched();
      expect(orderClassControl?.hasError('minlength')).toBe(false);
      expect(orderClassControl?.hasError('maxlength')).toBe(false);
    });

    it('should not allow whitespace-only Order Class', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const orderClassControl = component.form.get('orderClass');
      orderClassControl?.setValue('  ');
      orderClassControl?.markAsTouched();

      expect(orderClassControl?.hasError('whitespaceOnly')).toBe(true);
    });
  });

  describe('Description Validation', () => {
    it('should allow empty description (optional field)', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const descriptionControl = component.form.get('description');
      descriptionControl?.setValue('');
      descriptionControl?.markAsTouched();

      expect(descriptionControl?.hasError('required')).toBeFalsy();
      expect(descriptionControl?.valid).toBe(true);
    });

    it('should allow up to 20 characters for description', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const descriptionControl = component.form.get('description');

      // 20 characters should be valid
      descriptionControl?.setValue('a'.repeat(20));
      descriptionControl?.markAsTouched();
      expect(descriptionControl?.valid).toBe(true);
    });

    it('should not show error message for description even if maxlength is exceeded', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const descriptionControl = component.form.get('description');

      // HTML maxlength="20" prevents typing beyond 20, but if value is set programmatically
      // the getDescriptionError method should not return a maxlength error message
      descriptionControl?.setValue('a'.repeat(21));
      descriptionControl?.markAsTouched();
      expect(component.getDescriptionError()).toBe('');
    });

    it('should not allow whitespace-only description', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const descriptionControl = component.form.get('description');
      descriptionControl?.setValue('   ');
      descriptionControl?.markAsTouched();

      expect(descriptionControl?.hasError('whitespaceOnly')).toBe(true);
    });
  });

  describe('Priority and Hours Default Values', () => {
    it('should initialize priority as null in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.form.get('priority')?.value).toBeNull();
    });

    it('should initialize hours as null in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.form.get('hours')?.value).toBeNull();
    });

    it('should reset priority to null when switching to add mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      // Verify edit mode has the data values
      expect(component.form.get('priority')?.value).toBe(11);
      expect(component.form.get('hours')?.value).toBe(12);

      // Switch to add mode
      component.mode = 'add';
      component.ngOnChanges({
        mode: { currentValue: 'add', previousValue: 'edit', firstChange: false, isFirstChange: () => false },
        data: { currentValue: null, previousValue: mockEditData, firstChange: false, isFirstChange: () => false }
      });
      fixture.detectChanges();

      expect(component.form.get('priority')?.value).toBeNull();
      expect(component.form.get('hours')?.value).toBeNull();
    });

    it('should use null fallback for priority and hours when edit data has null values', () => {
      const dataWithNulls: OrderClassCodesModel = {
        ...mockEditData,
        priority: undefined,
        hours: undefined
      };

      component.mode = 'edit';
      component.data = dataWithNulls;
      fixture.detectChanges();

      expect(component.form.get('priority')?.value).toBeNull();
      expect(component.form.get('hours')?.value).toBeNull();
    });
  });

  describe('Date Validation Error Messages', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show "Effective Date is invalid" for invalid date format', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: { text: '32-APR-2026' } });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should show "Effective Date is invalid" for invalidDate error', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should show "Effective Date is invalid" for invalidDateFormat error', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should show "Effective Date cannot be past date" for past date', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ effectiveDatePast: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
    });

    it('should show "Effective Date is required" when empty', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ required: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should prioritize invalid format over past date for effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: { text: 'bad' }, effectiveDatePast: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date is invalid');
    });

    it('should prioritize past date over required for effective date', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ effectiveDatePast: true, required: true });
      control?.markAsTouched();

      expect(component.getEffectiveDateError()).toBe('Effective Date cannot be past date');
    });

    it('should show "Termination Date is invalid" for invalid date format', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ matDatepickerParse: { text: '99-APR-2026' } });
      control?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should show "Termination Date is invalid" for invalidDate error', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should show "Termination Date cannot be past date" for past date', () => {
      const control = component.form.get('terminationDate');
      // Set a past date value (before chapter date 2026-04-16)
      control?.setValue(moment('2026-04-10'));
      control?.setErrors({ terminationDatePast: true });
      control?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date cannot be past date');
    });

    it('should show "Termination Date cannot be past date" for matDatepickerMin with past value', () => {
      const control = component.form.get('terminationDate');
      // Set a past date value (before chapter date 2026-04-16)
      control?.setValue(moment('2026-04-10'));
      control?.setErrors({ matDatepickerMin: true });
      control?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date cannot be past date');
    });

    it('should prioritize invalid format over past date for termination date', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true, terminationDatePast: true });
      control?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should show cross-field range error when effective date is valid and termination is before it', () => {
      const effControl = component.form.get('effectiveDate');
      const termControl = component.form.get('terminationDate');

      // Set effective date to a valid future date with no errors
      effControl?.setValue(moment('2026-12-10'));
      effControl?.setErrors(null);

      // Set termination date to a future date (>= chapter date) but before effective date
      termControl?.setValue(moment('2026-12-05'));
      termControl?.setErrors({ matDatepickerMin: true });
      termControl?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should not show cross-field range error when effective date has errors', () => {
      const effControl = component.form.get('effectiveDate');
      const termControl = component.form.get('terminationDate');

      // Set effective date as invalid (past date)
      effControl?.setValue(moment('2026-04-10'));
      effControl?.setErrors({ effectiveDatePast: true });

      // Set termination date to a future value (>= chapter date) with matDatepickerMin error
      termControl?.setValue(moment('2026-05-01'));
      termControl?.setErrors({ matDatepickerMin: true });
      termControl?.markAsTouched();

      // Should return empty because effective date has errors, cross-field check is skipped
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should not show cross-field range error when effective date is a past date', () => {
      const effControl = component.form.get('effectiveDate');
      const termControl = component.form.get('terminationDate');

      // Set effective date to a past date (before chapter date)
      effControl?.setValue(moment('2026-04-10'));
      effControl?.setErrors({ effectiveDatePast: true });

      // Set termination date to a valid future date with matDatepickerMin error
      termControl?.setValue(moment('2026-04-20'));
      termControl?.setErrors({ matDatepickerMin: true });
      termControl?.markAsTouched();

      // Cross-field error should NOT show because effective date is a past date with errors
      expect(component.getTerminationDateError()).toBe('');
    });

  });

  describe('Save Button State', () => {


    it('should disable Save button in edit mode when form is pristine', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: undefined, firstChange: true, isFirstChange: () => true },
        data: { currentValue: mockEditData, previousValue: undefined, firstChange: true, isFirstChange: () => true }
      });
      fixture.detectChanges();

      // Form is valid but not dirty
      expect(component.form.valid).toBe(true);
      expect(component.form.dirty).toBe(false);
      expect(component.isSaveButtonEnabled).toBe(false);
    });

    it('should enable Save button in edit mode when form is dirty and valid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: undefined, firstChange: true, isFirstChange: () => true },
        data: { currentValue: mockEditData, previousValue: undefined, firstChange: true, isFirstChange: () => true }
      });
      fixture.detectChanges();

      // Change a value to make form dirty
      component.form.patchValue({
        description: 'Updated Description'
      });
      component.form.markAsDirty();

      expect(component.form.valid).toBe(true);
      expect(component.form.dirty).toBe(true);
      expect(component.isSaveButtonEnabled).toBe(true);
    });

    it('should disable Save button in edit mode when form is dirty but invalid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: { currentValue: 'edit', previousValue: undefined, firstChange: true, isFirstChange: () => true },
        data: { currentValue: mockEditData, previousValue: undefined, firstChange: true, isFirstChange: () => true }
      });
      fixture.detectChanges();

      // Make form dirty with invalid data
      component.form.patchValue({
        priority: 150 // Invalid - exceeds max
      });
      component.form.markAsDirty();

      expect(component.form.valid).toBe(false);
      expect(component.form.dirty).toBe(true);
      expect(component.isSaveButtonEnabled).toBe(false);
    });
  });


  describe('Chapter Timezone Integration', () => {
    it('should set chapter current date from ChapterTimezoneService', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(mockChapterTimezoneService.getChapterLocalDate).toHaveBeenCalled();
      expect(component.chapterCurrentDate.format('YYYY-MM-DD')).toBe('2026-04-16');
    });

    it('should initialize chapter current date for date validation', () => {
      component.mode = 'add';
      fixture.detectChanges();

      // The chapterCurrentDate should be initialized for use as minDate
      expect(component.chapterCurrentDate).toBeDefined();
      expect(component.chapterCurrentDate.isValid()).toBe(true);
      expect(component.minDate.isSame(component.chapterCurrentDate, 'day')).toBe(true);
    });
  });

  describe('Termination Min Date', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return chapterCurrentDate when no effective date is set', () => {
      component.form.get('effectiveDate')?.setValue(null);

      expect(component.terminationMinDate.isSame(component.chapterCurrentDate, 'day')).toBe(true);
    });

    it('should return chapterCurrentDate when effective date is before chapter date', () => {
      component.form.get('effectiveDate')?.setValue(moment('2026-04-10'));

      expect(component.terminationMinDate.isSame(component.chapterCurrentDate, 'day')).toBe(true);
    });

    it('should return chapterCurrentDate when effective date equals chapter date', () => {
      component.form.get('effectiveDate')?.setValue(moment('2026-04-16'));

      expect(component.terminationMinDate.isSame(component.chapterCurrentDate, 'day')).toBe(true);
    });

    it('should return effective date when it is after chapter date', () => {
      const futureDate = moment('2026-12-10');
      component.form.get('effectiveDate')?.setValue(futureDate);

      expect(component.terminationMinDate.isSame(futureDate, 'day')).toBe(true);
    });
  });

  describe('Edit Mode Termination Date Validator', () => {
    it('should not flag future termination date as past in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const termControl = component.form.get('terminationDate');

      // Set a future date - the validator should NOT flag it
      termControl?.setValue(moment('2026-12-20'));
      termControl?.markAsTouched();

      expect(termControl?.hasError('terminationDatePast')).toBe(false);
    });

    it('should show past date error message in edit mode for past termination date', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const termControl = component.form.get('terminationDate');
      termControl?.setValue(moment('2026-04-10'));
      termControl?.markAsTouched();

      expect(component.getTerminationDateError()).toBe('Termination Date cannot be past date');
    });
  });

  describe('Edit Mode Effective Date', () => {
    it('should make effective date editable in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const effControl = component.form.get('effectiveDate');
      expect(effControl?.disabled).toBe(false);
    });

    it('should return null for effectiveDateMinDate in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      expect(component.effectiveDateMinDate).toBeNull();
    });

    it('should return minDate for effectiveDateMinDate in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.effectiveDateMinDate).not.toBeNull();
      expect(component.effectiveDateMinDate!.isSame(component.minDate, 'day')).toBe(true);
    });

    it('should allow original date in effectiveDateFilter for edit mode', () => {
      const pastDate = new Date('2025-01-15T00:00:00');
      component.mode = 'edit';
      component.data = { ...mockEditData, effectiveDate: pastDate };
      fixture.detectChanges();

      const result = component.effectiveDateFilter(moment(pastDate));
      expect(result).toBe(true);
    });

    it('should block past dates (not original) in effectiveDateFilter for edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const differentPastDate = moment('2025-01-10');
      const result = component.effectiveDateFilter(differentPastDate);
      expect(result).toBe(false);
    });

    it('should allow future dates in effectiveDateFilter for edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const futureDate = moment('2027-06-15');
      const result = component.effectiveDateFilter(futureDate);
      expect(result).toBe(true);
    });

    it('should allow all dates in effectiveDateFilter for add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const pastDate = moment('2020-01-01');
      const result = component.effectiveDateFilter(pastDate);
      expect(result).toBe(true);
    });

    it('should not show validation error when effective date unchanged in edit mode', () => {
      const pastDate = new Date('2025-01-15T00:00:00');
      component.mode = 'edit';
      component.data = { ...mockEditData, effectiveDate: pastDate };
      fixture.detectChanges();

      const effControl = component.form.get('effectiveDate');
      effControl?.setValue(moment(pastDate));
      effControl?.markAsTouched();
      effControl?.updateValueAndValidity();

      expect(effControl?.hasError('effectiveDatePast')).toBe(false);
    });

    it('should show validation error when effective date changed to past date in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const effControl = component.form.get('effectiveDate');
      effControl?.setValue(moment('2025-02-01'));
      effControl?.markAsTouched();
      effControl?.updateValueAndValidity();

      expect(effControl?.hasError('effectiveDatePast')).toBe(true);
    });

    it('should allow changing effective date to future date in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const effControl = component.form.get('effectiveDate');
      effControl?.setValue(moment('2027-06-15'));
      effControl?.markAsTouched();
      effControl?.updateValueAndValidity();

      expect(effControl?.hasError('effectiveDatePast')).toBe(false);
      expect(effControl?.valid).toBe(true);
    });
  });

  describe('Date Formatting', () => {
    it('should format Date object in DD-MMM-YYYY format with uppercase month', () => {
      const date = new Date('2026-12-04T00:00:00');
      const formatted = component.formatDate(date);

      expect(formatted).toBe('04-DEC-2026');
    });

    it('should format moment object in DD-MMM-YYYY format with uppercase month', () => {
      const date = moment('2026-04-24');
      const formatted = component.formatDate(date);

      expect(formatted).toBe('24-APR-2026');
    });


    it('should format single-digit day with leading zero', () => {
      const date = new Date('2026-03-05T00:00:00');
      const formatted = component.formatDate(date);

      expect(formatted).toBe('05-MAR-2026');
    });

    it('should format dates with uppercase month abbreviations', () => {
      const dates = [
        { input: new Date('2026-01-15'), expected: '15-JAN-2026' },
        { input: new Date('2026-02-15'), expected: '15-FEB-2026' },
        { input: new Date('2026-03-15'), expected: '15-MAR-2026' },
        { input: new Date('2026-04-15'), expected: '15-APR-2026' },
        { input: new Date('2026-05-15'), expected: '15-MAY-2026' },
        { input: new Date('2026-06-15'), expected: '15-JUN-2026' },
        { input: new Date('2026-07-15'), expected: '15-JUL-2026' },
        { input: new Date('2026-08-15'), expected: '15-AUG-2026' },
        { input: new Date('2026-09-15'), expected: '15-SEP-2026' },
        { input: new Date('2026-10-15'), expected: '15-OCT-2026' },
        { input: new Date('2026-11-15'), expected: '15-NOV-2026' },
        { input: new Date('2026-12-15'), expected: '15-DEC-2026' }
      ];

      dates.forEach(({ input, expected }) => {
        expect(component.formatDate(input)).toBe(expected);
      });
    });
  });
});
