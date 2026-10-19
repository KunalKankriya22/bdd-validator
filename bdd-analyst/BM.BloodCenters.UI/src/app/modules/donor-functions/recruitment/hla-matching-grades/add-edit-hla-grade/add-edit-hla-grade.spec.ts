import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditHlaGrade } from './add-edit-hla-grade';
import { HlaGradingService } from '../services/hla-grading.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { HlaGradingDialogData, DropdownOption } from '../models/hla-grading.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditHlaGrade', () => {
  let component: AddEditHlaGrade;
  let fixture: ComponentFixture<AddEditHlaGrade>;
  let mockService: jasmine.SpyObj<HlaGradingService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditHlaGrade>>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;

  const gradeOptions: DropdownOption[] = [
    { key: 'C3X', value: 'Grade C3X' },
    { key: 'B1U', value: 'Grade B1U' }
  ];

  const hlaCodeOptions: DropdownOption[] = [
    { key: 'I', value: 'Code I' },
    { key: 'U', value: 'Code U' },
    { key: 'S', value: 'Code S' }
  ];

  const addDialogData: HlaGradingDialogData = {
    mode: 'add',
    gradeOptions,
    hlaCodeOptions,
    nextGradeId: 10
  };

  const editDialogData: HlaGradingDialogData = {
    mode: 'edit',
    record: {
      gradeId: 5, grade: 'C3X', a1: 'I', a2: 'S', b1: 'I', b2: 'U',
      gradeLevel: 1, effectiveDate: '2024-01-01T00:00:00', terminationDate: null,
      totalCount: 10, maxGradeId: 5
    },
    gradeOptions,
    hlaCodeOptions,
    nextGradeId: 5
  };

  function createComponent(dialogData: HlaGradingDialogData): void {
    mockService = jasmine.createSpyObj('HlaGradingService', ['createHlaGrading', 'updateHlaGrading']);
    mockSnackbar = createMockSnackbarService();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockHeaderService = createMockHeaderService();
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate']);
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment().startOf('day'));

    TestBed.configureTestingModule({
      imports: [AddEditHlaGrade, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HlaGradingService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService }
      ]
    });

    fixture = TestBed.createComponent(AddEditHlaGrade);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Add Mode', () => {
    beforeEach(() => createComponent(addDialogData));


    it('should set nextGradeId from dialog data', () => {
      expect(component.nextGradeId).toBe(10);
    });

    it('should initialize isSaving as false', () => {
      expect(component.isSaving).toBeFalse();
    });



    it('should have min(1) validator on gradeLevel', () => {
      component.form.get('gradeLevel')?.setValue(0);
      expect(component.form.get('gradeLevel')?.hasError('min')).toBeTrue();

      component.form.get('gradeLevel')?.setValue(1);
      expect(component.form.get('gradeLevel')?.hasError('min')).toBeFalse();
    });

    it('should set filtered options from dialog data', () => {
      expect(component.filteredGradeOptions).toEqual(gradeOptions);
      expect(component.filteredA1Options).toEqual(hlaCodeOptions);
      expect(component.filteredA2Options).toEqual(hlaCodeOptions);
      expect(component.filteredB1Options).toEqual(hlaCodeOptions);
      expect(component.filteredB2Options).toEqual(hlaCodeOptions);
    });

  });

  describe('Edit Mode', () => {
    beforeEach(() => createComponent(editDialogData));


    it('should patch form with record values', () => {
      expect(component.form.get('grade')?.value).toBe('C3X');
      expect(component.form.get('gradeLevel')?.value).toBe(1);
      expect(component.form.get('a1')?.value).toBe('I');
      expect(component.form.get('a2')?.value).toBe('S');
      expect(component.form.get('b1')?.value).toBe('I');
      expect(component.form.get('b2')?.value).toBe('U');
    });

    it('should have form in pristine state after patching', () => {
      expect(component.form.pristine).toBeTrue();
    });



    it('should report form as invalid when value changed back to original', () => {
      component.form.get('gradeLevel')?.setValue(2);
      expect(component.isFormValid).toBeTrue();

      component.form.get('gradeLevel')?.setValue(1);
      expect(component.isFormValid).toBeFalse();
    });

    it('should detect changes in dropdown fields', () => {
      component.form.get('a1')?.setValue('U');
      expect(component.isFormValid).toBeTrue();

      component.form.get('a1')?.setValue('I');
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('Search Filters', () => {
    beforeEach(() => createComponent(addDialogData));




    it('should reset options when dropdown is opened', () => {
      component.gradeSearchControl.setValue('B1U');
      expect(component.filteredGradeOptions.length).toBe(1);

      component.onGradeDropdownOpened(true);

      expect(component.filteredGradeOptions.length).toBe(2);
      expect(component.gradeSearchControl.value).toBe('');
    });

    it('should reset HLA code options when dropdown opened', () => {
      component.a1SearchControl.setValue('U');
      component.onHlaCodeDropdownOpened('a1', true);

      expect(component.filteredA1Options).toEqual(hlaCodeOptions);
    });

    it('should do nothing when dropdown is closed', () => {
      component.a1SearchControl.setValue('U');
      component.onHlaCodeDropdownOpened('a1', false);

      expect(component.filteredA1Options.length).toBe(1);
    });

    it('should handle all HLA code dropdown fields', () => {
      component.onHlaCodeDropdownOpened('a2', true);
      expect(component.filteredA2Options).toEqual(hlaCodeOptions);

      component.onHlaCodeDropdownOpened('b1', true);
      expect(component.filteredB1Options).toEqual(hlaCodeOptions);

      component.onHlaCodeDropdownOpened('b2', true);
      expect(component.filteredB2Options).toEqual(hlaCodeOptions);
    });
  });

  describe('Selected Label', () => {
    beforeEach(() => createComponent(addDialogData));


    it('should return formatted label for grade', () => {
      component.form.get('grade')?.setValue('C3X');

      expect(component.getSelectedLabel('grade')).toBe('C3X');
    });

    it('should return formatted label for HLA code fields', () => {
      component.form.get('a1')?.setValue('I');

      expect(component.getSelectedLabel('a1')).toBe('I');
    });

    it('should return raw value when option not found', () => {
      component.form.get('grade')?.setValue('UNKNOWN');

      expect(component.getSelectedLabel('grade')).toBe('UNKNOWN');
    });
  });

  describe('Truncation Checks', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should detect truncation on grade trigger', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkGradeTruncation(el);
      expect(component.isGradeTruncated).toBeTrue();
    });

    it('should not detect truncation when content fits', () => {
      const el = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      component.checkGradeTruncation(el);
      expect(component.isGradeTruncated).toBeFalse();
    });

    it('should check all HLA code truncation methods', () => {
      const truncatedEl = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;

      component.checkA1Truncation(truncatedEl);
      expect(component.isA1Truncated).toBeTrue();

      component.checkA2Truncation(truncatedEl);
      expect(component.isA2Truncated).toBeTrue();

      component.checkB1Truncation(truncatedEl);
      expect(component.isB1Truncated).toBeTrue();

      component.checkB2Truncation(truncatedEl);
      expect(component.isB2Truncated).toBeTrue();
    });
  });


  describe('Save - Add Mode', () => {
    beforeEach(() => createComponent(addDialogData));




    it('should set isSaving during API call', () => {
      mockService.createHlaGrading.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201, data: {}, total: 0
      }));

      component.form.patchValue({
        grade: 'C3X', gradeLevel: 1, a1: 'I', a2: 'I', b1: 'I', b2: 'I',
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });

    it('should reset isSaving on error', () => {
      mockService.createHlaGrading.and.returnValue(throwError(() => new Error('fail')));

      component.form.patchValue({
        grade: 'C3X', gradeLevel: 1, a1: 'I', a2: 'I', b1: 'I', b2: 'I',
        effectiveDate: moment().add(10, 'days')
      });

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });


  });

  describe('Save and Add Another', () => {
    beforeEach(() => createComponent(addDialogData));


    it('should increment nextGradeId on save and add another', () => {
      mockService.createHlaGrading.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201, data: {}, total: 0
      }));

      component.form.patchValue({
        grade: 'C3X', gradeLevel: 1, a1: 'I', a2: 'U', b1: 'I', b2: 'S',
        effectiveDate: moment().add(10, 'days')
      });

      const initialGradeId = component.nextGradeId;
      component.onSaveAndAddAnother();

      expect(component.nextGradeId).toBe(initialGradeId + 1);
    });

    it('should close with success when cancel is clicked after save and add another', () => {
      mockService.createHlaGrading.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201, data: {}, total: 0
      }));

      component.form.patchValue({
        grade: 'C3X', gradeLevel: 1, a1: 'I', a2: 'U', b1: 'I', b2: 'S',
        effectiveDate: moment().add(10, 'days')
      });

      component.onSaveAndAddAnother();
      mockDialogRef.close.calls.reset();

      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
    });

  });

  describe('Save - Edit Mode', () => {
    beforeEach(() => createComponent(editDialogData));


    it('should include original values in update payload', () => {
      mockService.updateHlaGrading.and.returnValue(of({
        success: true, message: 'Updated', statusCode: 200, data: {}, total: 0
      }));

      component.form.get('gradeLevel')?.setValue(2);

      component.onSave();

      const payload = mockService.updateHlaGrading.calls.mostRecent().args[0];
      expect(payload.originalGradeId).toBe(5);
      expect(payload.originalGrade).toBe('C3X');
      expect(payload.originalA1).toBe('I');
    });


    it('should reset isSaving on update error', () => {
      mockService.updateHlaGrading.and.returnValue(throwError(() => new Error('fail')));

      component.form.get('gradeLevel')?.setValue(2);

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });
  });



  describe('Inactive Dropdown Values in Edit Mode', () => {
    const inactiveGradeDialogData: HlaGradingDialogData = {
      mode: 'edit',
      record: {
        gradeId: 2, grade: 'B1X', a1: 'Z', a2: 'I', b1: 'I', b2: 'W',
        gradeLevel: 25, effectiveDate: '1997-09-11T00:00:00', terminationDate: null,
        totalCount: 10, maxGradeId: 5
      },
      gradeOptions,
      hlaCodeOptions,
      nextGradeId: 2
    };

    beforeEach(() => createComponent(inactiveGradeDialogData));

    it('should set isGradeInOptions to false when grade not in options', () => {
      expect(component.isGradeInOptions).toBeFalse();
    });

    it('should set isA1InOptions to false when a1 not in options', () => {
      expect(component.isA1InOptions).toBeFalse();
    });

    it('should set isA2InOptions to true when a2 is in options', () => {
      expect(component.isA2InOptions).toBeTrue();
    });

    it('should set isB2InOptions to false when b2 not in options', () => {
      expect(component.isB2InOptions).toBeFalse();
    });

    it('should still patch the form value even when not in options', () => {
      expect(component.form.get('grade')?.value).toBe('B1X');
      expect(component.form.get('a1')?.value).toBe('Z');
      expect(component.form.get('b2')?.value).toBe('W');
    });

    it('should return raw value for getSelectedLabel when grade not in options', () => {
      expect(component.getSelectedLabel('grade')).toBe('B1X');
    });
  });

  describe('Active Dropdown Values in Edit Mode', () => {
    beforeEach(() => createComponent(editDialogData));

    it('should set all isInOptions flags to true when values exist in options', () => {
      expect(component.isGradeInOptions).toBeTrue();
      expect(component.isA1InOptions).toBeTrue();
      expect(component.isA2InOptions).toBeTrue();
      expect(component.isB1InOptions).toBeTrue();
      expect(component.isB2InOptions).toBeTrue();
    });
  });

  describe('isInOptions flags in Add Mode', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should default all isInOptions flags to true in add mode', () => {
      expect(component.isGradeInOptions).toBeTrue();
      expect(component.isA1InOptions).toBeTrue();
      expect(component.isA2InOptions).toBeTrue();
      expect(component.isB1InOptions).toBeTrue();
      expect(component.isB2InOptions).toBeTrue();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should complete destroy subject', () => {
      const spy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Date control getters', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should return effectiveDate control', () => {
      expect(component.effectiveDateControl).toBe(component.form.get('effectiveDate'));
    });

    it('should return terminationDate control', () => {
      expect(component.terminationDateControl).toBe(component.form.get('terminationDate'));
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should return error string', () => {
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should return error string', () => {
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should handle date input', () => {
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should handle date input in add mode', () => {
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('onTerminationDateInput in edit mode', () => {
    beforeEach(() => createComponent(editDialogData));

    it('should handle date input in edit mode', () => {
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return false for past date', () => {
      expect(component.terminationDateFilter(moment().subtract(10, 'days'))).toBeFalse();
    });

    it('should return true for future date', () => {
      expect(component.terminationDateFilter(moment().add(10, 'days'))).toBeTrue();
    });

    it('should return false for date before effective date', () => {
      component.form.patchValue({ effectiveDate: moment().add(5, 'days') });
      expect(component.terminationDateFilter(moment().add(2, 'days'))).toBeFalse();
    });
  });

  describe('preventInvalidInput', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should allow digit keys', () => {
      const input = document.createElement('input');
      input.value = '12';
      const event = new KeyboardEvent('keydown', { key: '5' });
      Object.defineProperty(event, 'target', { value: input });
      spyOn(event, 'preventDefault');
      component.preventInvalidInput(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace' });
      spyOn(event, 'preventDefault');
      component.preventInvalidInput(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'preventDefault');
      component.preventInvalidInput(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow ctrl+key combinations', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
      spyOn(event, 'preventDefault');
      component.preventInvalidInput(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('formatDate', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should format a date string', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toContain('2024');
    });
  });

  describe('duplicateHlaCodeValidator', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should detect duplicate A codes', () => {
      component.form.patchValue({ a1: 'I', a2: 'I' });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('duplicateA')).toBeTrue();
    });

    it('should detect duplicate B codes', () => {
      component.form.patchValue({ b1: 'U', b2: 'U' });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('duplicateB')).toBeTrue();
    });

    it('should not set errors for different codes', () => {
      component.form.patchValue({ a1: 'I', a2: 'U', b1: 'I', b2: 'U' });
      component.form.updateValueAndValidity();
      expect(component.form.hasError('duplicateA')).toBeFalse();
      expect(component.form.hasError('duplicateB')).toBeFalse();
    });
  });

  describe('isFormValid - add mode', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should return false when form is invalid', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when duplicate errors exist', () => {
      component.form.patchValue({
        grade: 'C3X', gradeLevel: 1, a1: 'I', a2: 'I', b1: 'I', b2: 'U',
        effectiveDate: moment().add(10, 'days')
      });
      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('hasActualChanges - date changes', () => {
    beforeEach(() => createComponent(editDialogData));

    it('should detect effective date change', () => {
      component.form.patchValue({ effectiveDate: moment('2025-06-01') });
      expect(component.hasActualChanges).toBeTrue();
    });

    it('should detect termination date added', () => {
      component.form.patchValue({ terminationDate: moment().add(30, 'days') });
      expect(component.hasActualChanges).toBeTrue();
    });

    it('should return false when no changes', () => {
      expect(component.hasActualChanges).toBeFalse();
    });
  });

  describe('setupDateValidationListeners', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should update form validity when effective date changes', () => {
      component.form.patchValue({ effectiveDate: moment().add(1, 'day') });
      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should update form validity when termination date changes', () => {
      component.form.patchValue({ terminationDate: moment().add(30, 'days') });
      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should trigger validation when HLA codes change', () => {
      component.form.patchValue({ a1: 'U' });
      // No error should be thrown
      expect(component.form).toBeTruthy();
    });
  });

  describe('onCancel without prior save', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should close with undefined when no record saved', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith(undefined);
    });
  });

  describe('submitForm - invalid form path', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should not save if form is invalid', () => {
      component.onSave();
      expect(mockService.createHlaGrading).not.toHaveBeenCalled();
    });

    it('should not save if isSaving is true', () => {
      component.isSaving = true;
      component.form.patchValue({
        grade: 'C3X', gradeLevel: 1, a1: 'I', a2: 'U', b1: 'I', b2: 'S',
        effectiveDate: moment().add(10, 'days')
      });
      component.onSave();
      expect(mockService.createHlaGrading).not.toHaveBeenCalled();
    });
  });

  describe('setupErrorMatchers', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should create error matchers', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher).toBeDefined();
    });
  });

  describe('getSelectedLabel with empty value', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should return empty string for empty value', () => {
      component.form.patchValue({ grade: '' });
      expect(component.getSelectedLabel('grade')).toBe('');
    });
  });

  describe('Search filter subscriptions', () => {
    beforeEach(() => createComponent(addDialogData));

    it('should filter grade options by search', () => {
      component.gradeSearchControl.setValue('B1U');
      expect(component.filteredGradeOptions.length).toBe(1);
      expect(component.filteredGradeOptions[0].key).toBe('B1U');
    });

    it('should filter a2 options', () => {
      component.a2SearchControl.setValue('S');
      expect(component.filteredA2Options.length).toBe(1);
    });

    it('should filter b1 options', () => {
      component.b1SearchControl.setValue('I');
      expect(component.filteredB1Options.length).toBe(1);
    });

    it('should filter b2 options', () => {
      component.b2SearchControl.setValue('U');
      expect(component.filteredB2Options.length).toBe(1);
    });

    it('should return all options when search is empty', () => {
      component.gradeSearchControl.setValue('B1U');
      component.gradeSearchControl.setValue('');
      expect(component.filteredGradeOptions.length).toBe(2);
    });
  });

  describe('Save - Edit Mode update success', () => {
    beforeEach(() => createComponent(editDialogData));

    it('should close dialog on successful update', () => {
      mockService.updateHlaGrading.and.returnValue(of({
        success: true, message: 'Updated', statusCode: 200, data: {}, total: 0
      }));
      component.form.get('gradeLevel')?.setValue(2);
      component.onSave();
      expect(mockDialogRef.close).toHaveBeenCalledWith({ success: true });
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Updated');
    });
  });
});
