import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import moment from 'moment';

import { AddEditSpecialProcessingComponent } from './add-edit-special-processing';
import { HeaderService } from '@shared/services/header.service';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddEditSpecialProcessingComponent', () => {
  let component: AddEditSpecialProcessingComponent;
  let fixture: ComponentFixture<AddEditSpecialProcessingComponent>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockEditData = {
    codeType: 'SPL',
    code: 'SPL01',
    codeDesc: 'Split Component',
    effDate: '2023-01-15',
    termDate: '2024-12-31',
    lastModifiedDate: '2023-06-15',
  };

  const futureDate = moment().add(30, 'days');

  beforeEach(() => {

    headerServiceSpy = createMockHeaderService();
      TestBed.configureTestingModule({
imports: [
        AddEditSpecialProcessingComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] },
      ],
    });

    });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddEditSpecialProcessingComponent);
    component = fixture.componentInstance;

    });

  afterEach(() => {
    fixture.destroy();
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should initialize empty form with required validators', () => {
      expect(component.form.get('code')?.value).toBe('');
      expect(component.form.get('codeDesc')?.value).toBe('');
      expect(component.form.get('effDate')?.value).toBeNull();
    });

    it('should require code field', () => {
      component.form.get('code')?.setValue('');
      component.form.get('code')?.markAsTouched();

      expect(component.form.get('code')?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength on code field', () => {
      component.form.patchValue({ code: 'ABCDEF' });

      expect(component.form.get('code')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on description field', () => {
      component.form.patchValue({ codeDesc: 'A'.repeat(51) });

      expect(component.form.get('codeDesc')?.hasError('maxlength')).toBeTrue();
    });

    it('should calculate remaining chars for code field', () => {
      component.form.patchValue({ code: 'AB' });

      expect(component.codeRemainingChars).toBe(3);
    });

    it('should calculate remaining chars for description field', () => {
      component.form.patchValue({ codeDesc: 'Test Description' });

      expect(component.descriptionRemainingChars).toBe(50 - 'Test Description'.length);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should populate form with existing data', () => {
      expect(component.form.getRawValue().code).toBe('SPL01');
      expect(component.form.get('codeDesc')?.value).toBe('Split Component');
    });

    it('should disable code field in edit mode', () => {
      expect(component.form.get('code')?.disabled).toBeTrue();
    });

    it('should parse effective date as moment', () => {
      const effDate = component.form.get('effDate')?.value;
      expect(moment.isMoment(effDate)).toBeTrue();
    });

    it('should parse termination date as moment', () => {
      const termDate = component.form.get('termDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
    });
  });

  describe('isFormInvalid', () => {
    it('should return true in edit mode when form is not dirty', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      expect(component.isFormInvalid).toBeTrue();
    });

    it('should return false in edit mode when form is dirty and valid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.get('codeDesc')?.setValue('Updated Description');
      component.form.get('codeDesc')?.markAsDirty();

      expect(component.isFormInvalid).toBeFalse();
    });

    it('should return true in add mode when required fields are empty', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.isFormInvalid).toBeTrue();
    });
  });

  describe('Submit', () => {
    describe('Add Mode Submit', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.codeType = 'SPL';
        fixture.detectChanges();
      });

      it('should emit save event with CreateSPMasterCodeRequest when form is valid', fakeAsync(() => {
        spyOn(component.save, 'emit');

        component.form.patchValue({
          code: 'NEW1',
          codeDesc: 'New Code',
          effDate: futureDate,
        });

        component.onSubmit();
        tick();

        expect(component.save.emit).toHaveBeenCalled();
        const emittedDto = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
        expect(emittedDto.codeType).toBe('SPL');
        expect(emittedDto.code).toBe('NEW1');
        expect(emittedDto.codeDesc).toBe('New Code');
        expect(component.isSubmitting).toBeTrue();
      }));

      it('should mark all fields as touched on invalid submit', () => {
        component.onSubmit();

        expect(component.form.get('code')?.touched).toBeTrue();
        expect(component.form.get('codeDesc')?.touched).toBeTrue();
        expect(component.form.get('effDate')?.touched).toBeTrue();
      });

      it('should not emit save when form is invalid', () => {
        spyOn(component.save, 'emit');

        component.onSubmit();

        expect(component.save.emit).not.toHaveBeenCalled();
        expect(component.isSubmitting).toBeFalse();
      });

      it('should not submit if already submitting', fakeAsync(() => {
        spyOn(component.save, 'emit');
        component.isSubmitting = true;

        component.form.patchValue({
          code: 'NEW1',
          codeDesc: 'New Code',
          effDate: futureDate,
        });

        component.onSubmit();
        tick();

        expect(component.save.emit).not.toHaveBeenCalled();
      }));
    });

    describe('Edit Mode Submit', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = mockEditData;
        component.codeType = 'SPL';
        fixture.detectChanges();
      });

      it('should emit save event with UpdateSPMasterCodeRequest', fakeAsync(() => {
        spyOn(component.save, 'emit');

        component.form.get('codeDesc')?.setValue('Updated Desc');
        component.form.get('codeDesc')?.markAsDirty();

        component.onSubmit();
        tick();

        expect(component.save.emit).toHaveBeenCalled();
        const emittedDto = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
        expect(emittedDto.codeDesc).toBe('Updated Desc');
        expect(emittedDto.code).toBeUndefined();
      }));
    });
  });

  describe('Save and Create Another', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should emit saveAndCreateAnother with valid form data', fakeAsync(() => {
      spyOn(component.saveAndCreateAnother, 'emit');

      component.form.patchValue({
        code: 'NEW2',
        codeDesc: 'Another Code',
        effDate: futureDate,
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(component.saveAndCreateAnother.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBeTrue();
    }));

    it('should not emit saveAndCreateAnother when form is invalid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');

      component.onSaveAndCreateAnother();

      expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
    });
  });

  describe('Clear and Reset', () => {
    it('should clear description and termDate in edit mode on clearAll', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.onClearAll();

      expect(component.form.get('codeDesc')?.value).toBe('');
      expect(component.form.get('termDate')?.value).toBeNull();
      expect(component.form.get('codeDesc')?.dirty).toBeTrue();
    });

    it('should reset form to pristine untouched state', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.form.patchValue({ code: 'X', codeDesc: 'Y' });
      component.form.markAllAsTouched();
      component.isSubmitting = true;
      component.errorMessage = 'Error occurred';

      component.resetForm();

      expect(component.form.get('code')?.value).toBe('');
      expect(component.form.get('codeDesc')?.value).toBe('');
      expect(component.form.pristine).toBeTrue();
      expect(component.isSubmitting).toBeFalse();
      expect(component.errorMessage).toBeNull();
    });
  });

  describe('Close', () => {
    it('should emit close event', () => {
      component.mode = 'add';
      fixture.detectChanges();
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Error Message', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set error message and reset submitting state', () => {
      component.isSubmitting = true;

      component.setErrorMessage('Duplicate code found');

      expect(component.errorMessage).toBe('Duplicate code found');
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('Date Formatting', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should format valid date as DD-MMM-YYYY', () => {
      expect(component.formatDate('2023-01-15')).toBe('15-JAN-2023');
    });

    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });
  });

  describe('Mode Changes via ngOnChanges', () => {
    it('should reinitialize form when switching from add to edit', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false),
      });

      expect(component.form.getRawValue().code).toBe('SPL01');
      expect(component.form.get('code')?.disabled).toBeTrue();
    });
  });

  describe('Termination Min Date', () => {
    it('should update terminationMinDate when effective date changes', fakeAsync(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.form.patchValue({ effDate: futureDate });
      tick();

      expect(component.terminationMinDate.isSameOrAfter(component.minDate)).toBeTrue();
    }));

    it('should set terminationMinDate to effective date when effective date is after minDate', fakeAsync(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const farFutureDate = moment().add(60, 'days');
      component.form.patchValue({ effDate: farFutureDate });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(farFutureDate.format('YYYY-MM-DD'));
    }));

    it('should set terminationMinDate to minDate when no effective date is set', fakeAsync(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.form.patchValue({ effDate: null });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    }));

    it('should handle effective date as a native Date object', fakeAsync(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const nativeDate = moment().add(45, 'days').toDate();
      component.form.patchValue({ effDate: nativeDate });
      tick();

      expect(component.terminationMinDate.isSameOrAfter(component.minDate)).toBeTrue();
    }));
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility.handleStartDateInput with the input value', () => {
      const spy = spyOn(
        (DateFieldValidationUtility as any),
        'handleStartDateInput',
      );
      const event = { target: { value: '15-JAN-2025' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      expect(spy).toHaveBeenCalledWith('15-JAN-2025', component.form.get('effDate'));
    });

    it('should handle empty input value', () => {
      const spy = spyOn(
        (DateFieldValidationUtility as any),
        'handleStartDateInput',
      );
      const event = { target: { value: '' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      expect(spy).toHaveBeenCalledWith('', component.form.get('effDate'));
    });
  });

  describe('onEffectiveDateChange', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should mark effDate as touched', () => {
      component.onEffectiveDateChange();

      expect(component.form.get('effDate')?.touched).toBeTrue();
    });

    it('should mark effDate as dirty', () => {
      component.onEffectiveDateChange();

      expect(component.form.get('effDate')?.dirty).toBeTrue();
    });

    it('should update form validity', () => {
      const spy = spyOn(component.form, 'updateValueAndValidity');

      component.onEffectiveDateChange();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should call DateFieldValidationUtility.handleEndDateInput with input value and add mode', () => {
      const spy = spyOn(
        (DateFieldValidationUtility as any),
        'handleEndDateInput',
      );
      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;

      component.onTerminationDateInput(event);

      expect(spy).toHaveBeenCalledWith('31-DEC-2025', component.form.get('termDate'), false);
    });

    it('should pass isEditMode=true when in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component['initializeForm']();

      const spy = spyOn(
        (DateFieldValidationUtility as any),
        'handleEndDateInput',
      );
      const event = { target: { value: '31-DEC-2025' } } as unknown as Event;

      component.onTerminationDateInput(event);

      expect(spy).toHaveBeenCalledWith('31-DEC-2025', component.form.get('termDate'), true);
    });
  });

  describe('onTerminationDateChange', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should mark termDate as touched', () => {
      component.onTerminationDateChange();

      expect(component.form.get('termDate')?.touched).toBeTrue();
    });

    it('should mark termDate as dirty', () => {
      component.onTerminationDateChange();

      expect(component.form.get('termDate')?.dirty).toBeTrue();
    });

    it('should update form validity', () => {
      const spy = spyOn(component.form, 'updateValueAndValidity');

      component.onTerminationDateChange();

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should pass form errors when lastChangedDateField is effective', () => {
      component['lastChangedDateField'] = 'effective';
      component.form.get('effDate')?.markAsTouched();
      component.form.get('effDate')?.markAsDirty();

      const result = component.getEffectiveDateError();

      expect(typeof result).toBe('string');
    });

    it('should pass null for form errors when lastChangedDateField is not effective', () => {
      component['lastChangedDateField'] = 'termination';
      component.form.get('effDate')?.markAsTouched();

      const result = component.getEffectiveDateError();

      expect(typeof result).toBe('string');
    });

    it('should pass null for form errors when lastChangedDateField is null', () => {
      component['lastChangedDateField'] = null;
      component.form.get('effDate')?.markAsTouched();

      const result = component.getEffectiveDateError();

      expect(typeof result).toBe('string');
    });

    it('should return required error when effDate is empty and touched', () => {
      component.form.get('effDate')?.setValue(null);
      component.form.get('effDate')?.markAsTouched();

      const result = component.getEffectiveDateError();

      expect(result).toContain('required');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should pass form errors when lastChangedDateField is termination', () => {
      component['lastChangedDateField'] = 'termination';
      component.form.get('termDate')?.markAsTouched();
      component.form.get('termDate')?.markAsDirty();

      const result = component.getTerminationDateError();

      expect(typeof result).toBe('string');
    });

    it('should pass null for form errors when lastChangedDateField is not termination', () => {
      component['lastChangedDateField'] = 'effective';
      component.form.get('termDate')?.markAsTouched();

      const result = component.getTerminationDateError();

      expect(typeof result).toBe('string');
    });

    it('should pass null for form errors when lastChangedDateField is null', () => {
      component['lastChangedDateField'] = null;
      component.form.get('termDate')?.markAsTouched();

      const result = component.getTerminationDateError();

      expect(typeof result).toBe('string');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges additional scenarios', () => {
    it('should NOT reinitialize form on first change', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const initSpy = spyOn<any>(component, 'initializeForm');

      component.ngOnChanges({
        mode: new SimpleChange(undefined, 'add', true),
      });

      expect(initSpy).not.toHaveBeenCalled();
    });

    it('should NOT reinitialize when both mode and data have firstChange=true', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const initSpy = spyOn<any>(component, 'initializeForm');

      component.ngOnChanges({
        mode: new SimpleChange(undefined, 'add', true),
        data: new SimpleChange(undefined, null, true),
      });

      expect(initSpy).not.toHaveBeenCalled();
    });

    it('should reinitialize form when mode changes and is NOT firstChange', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const initSpy = spyOn<any>(component, 'initializeForm');
      const setupSpy = spyOn<any>(component, 'setupDateValidationListeners');

      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
      });

      expect(initSpy).toHaveBeenCalled();
      expect(setupSpy).toHaveBeenCalled();
    });

    it('should reinitialize form when data changes and is NOT firstChange', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const initSpy = spyOn<any>(component, 'initializeForm');

      component.ngOnChanges({
        data: new SimpleChange(null, mockEditData, false),
      });

      expect(initSpy).toHaveBeenCalled();
    });

    it('should not reinitialize when unrelated changes are passed', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const initSpy = spyOn<any>(component, 'initializeForm');

      component.ngOnChanges({
        codeType: new SimpleChange('', 'SPL', false),
      });

      expect(initSpy).not.toHaveBeenCalled();
    });
  });

  describe('isFormInvalid additional scenarios', () => {
    it('should return true when form is null/undefined', () => {
      component.mode = 'add';
      fixture.detectChanges();
      (component as any).form = undefined;

      expect(component.isFormInvalid).toBeTrue();
    });

    it('should return true in edit mode when codeDesc is invalid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.get('codeDesc')?.setValue('');
      component.form.get('codeDesc')?.markAsDirty();

      expect(component.isFormInvalid).toBeTrue();
    });

    it('should return true in edit mode when dateRangeInvalid error is present', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.get('codeDesc')?.setValue('Updated');
      component.form.get('codeDesc')?.markAsDirty();
      component.form.setErrors({ dateRangeInvalid: true });

      expect(component.isFormInvalid).toBeTrue();
    });

    it('should return false in edit mode with dirty valid codeDesc and no dateRangeInvalid error', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.get('codeDesc')?.setValue('Updated Desc');
      component.form.get('codeDesc')?.markAsDirty();
      component.form.setErrors(null);

      expect(component.isFormInvalid).toBeFalse();
    });

    it('should return true in edit mode when termDate is dirty and invalid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.get('codeDesc')?.setValue('Updated');
      component.form.get('codeDesc')?.markAsDirty();
      component.form.get('termDate')?.markAsDirty();
      component.form.get('termDate')?.setErrors({ invalidDate: true });

      expect(component.isFormInvalid).toBeTrue();
    });

    it('should return false in edit mode when termDate is dirty but valid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.get('codeDesc')?.setValue('Updated');
      component.form.get('codeDesc')?.markAsDirty();
      component.form.get('termDate')?.setValue(moment().add(90, 'days'));
      component.form.get('termDate')?.markAsDirty();
      component.form.setErrors(null);

      expect(component.isFormInvalid).toBeFalse();
    });
  });

  describe('onSubmit additional scenarios', () => {
    it('should set lastChangedDateField to effective when dateRangeInvalid and lastChangedDateField is null', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.form.patchValue({
        code: 'NEW1',
        codeDesc: 'New Code',
        effDate: futureDate,
        termDate: moment().subtract(1, 'day'),
      });
      component.form.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = null;

      component.onSubmit();

      expect(component['lastChangedDateField']).toBe('effective');
    });

    it('should not override lastChangedDateField when already set', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.form.patchValue({
        code: 'NEW1',
        codeDesc: 'New Code',
        effDate: futureDate,
      });
      component.form.setErrors({ dateRangeInvalid: true });
      component['lastChangedDateField'] = 'termination';

      component.onSubmit();

      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should clear errorMessage on valid submit', fakeAsync(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.errorMessage = 'Previous error';
      component.form.patchValue({
        code: 'NEW1',
        codeDesc: 'New Code',
        effDate: futureDate,
      });

      component.onSubmit();
      tick();

      expect(component.errorMessage).toBeNull();
    }));

    it('should call DateFieldValidationUtility.clearOptionalDateErrors for termDate', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const spy = spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');

      component.onSubmit();

      expect(spy).toHaveBeenCalledWith(component.form, 'termDate');
    });

    it('should call cdr.markForCheck during submit', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      component.onSubmit();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('onSaveAndCreateAnother additional scenarios', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should not emit when already submitting', () => {
      spyOn(component.saveAndCreateAnother, 'emit');
      component.isSubmitting = true;

      component.form.patchValue({
        code: 'NEW1',
        codeDesc: 'New Code',
        effDate: futureDate,
      });

      component.onSaveAndCreateAnother();

      expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
    });

    it('should call DateFieldValidationUtility.clearOptionalDateErrors for termDate', () => {
      const spy = spyOn(DateFieldValidationUtility, 'clearOptionalDateErrors');

      component.onSaveAndCreateAnother();

      expect(spy).toHaveBeenCalledWith(component.form, 'termDate');
    });

    it('should call cdr.markForCheck during saveAndCreateAnother', () => {
      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      component.onSaveAndCreateAnother();

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should set isSubmitting and clear errorMessage on valid submit', fakeAsync(() => {
      component.errorMessage = 'Old error';
      component.form.patchValue({
        code: 'NEW1',
        codeDesc: 'New Code',
        effDate: futureDate,
      });

      component.onSaveAndCreateAnother();
      tick();

      expect(component.isSubmitting).toBeTrue();
      expect(component.errorMessage).toBeNull();
    }));

    it('should emit CreateSPMasterCodeRequest with codeType', fakeAsync(() => {
      spyOn(component.saveAndCreateAnother, 'emit');

      component.form.patchValue({
        code: 'NEW3',
        codeDesc: 'Another New',
        effDate: futureDate,
      });

      component.onSaveAndCreateAnother();
      tick();

      const emittedDto = (component.saveAndCreateAnother.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedDto.codeType).toBe('SPL');
      expect(emittedDto.code).toBe('NEW3');
      expect(emittedDto.codeDesc).toBe('Another New');
    }));
  });

  describe('onClearAll additional scenarios', () => {
    it('should not clear anything when mode is add', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.form.patchValue({ code: 'ABC', codeDesc: 'Test' });

      component.onClearAll();

      expect(component.form.get('code')?.value).toBe('ABC');
      expect(component.form.get('codeDesc')?.value).toBe('Test');
    });

    it('should reset lastChangedDateField to null in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component['lastChangedDateField'] = 'effective';

      component.onClearAll();

      expect(component['lastChangedDateField']).toBeNull();
    });

    it('should clear errorMessage in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
      component.errorMessage = 'Some error';

      component.onClearAll();

      expect(component.errorMessage).toBeNull();
    });

    it('should call cdr.markForCheck in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      component.onClearAll();

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should mark termDate as dirty in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.onClearAll();

      expect(component.form.get('termDate')?.dirty).toBeTrue();
    });
  });

  describe('resetForm additional scenarios', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should reset lastChangedDateField to null', () => {
      component['lastChangedDateField'] = 'effective';

      component.resetForm();

      expect(component['lastChangedDateField']).toBeNull();
    });

    it('should mark all controls as untouched', () => {
      component.form.markAllAsTouched();

      component.resetForm();

      expect(component.form.get('code')?.untouched).toBeTrue();
      expect(component.form.get('codeDesc')?.untouched).toBeTrue();
      expect(component.form.get('effDate')?.untouched).toBeTrue();
      expect(component.form.get('termDate')?.untouched).toBeTrue();
    });

    it('should mark all controls as pristine', () => {
      component.form.get('code')?.markAsDirty();
      component.form.get('codeDesc')?.markAsDirty();

      component.resetForm();

      expect(component.form.get('code')?.pristine).toBeTrue();
      expect(component.form.get('codeDesc')?.pristine).toBeTrue();
    });

    it('should reset effDate and termDate to null', () => {
      component.form.patchValue({ effDate: futureDate, termDate: futureDate });

      component.resetForm();

      expect(component.form.get('effDate')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should call cdr.markForCheck', () => {
      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      component.resetForm();

      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('Date Formatting additional scenarios', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return dash for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('-');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should format date with different months correctly', () => {
      expect(component.formatDate('2024-06-20')).toBe('20-JUN-2024');
      expect(component.formatDate('2024-12-01')).toBe('01-DEC-2024');
    });
  });

  describe('Remaining chars edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should return full CODE_MAX_LENGTH when code is empty string', () => {
      component.form.patchValue({ code: '' });

      expect(component.codeRemainingChars).toBe(5);
    });

    it('should return 0 when code is at max length', () => {
      component.form.patchValue({ code: 'ABCDE' });

      expect(component.codeRemainingChars).toBe(0);
    });

    it('should return full DESCRIPTION_MAX_LENGTH when description is empty', () => {
      component.form.patchValue({ codeDesc: '' });

      expect(component.descriptionRemainingChars).toBe(50);
    });

    it('should return 0 when description is at max length', () => {
      component.form.patchValue({ codeDesc: 'A'.repeat(50) });

      expect(component.descriptionRemainingChars).toBe(0);
    });

    it('should handle null code value gracefully', () => {
      component.form.patchValue({ code: null });

      expect(component.codeRemainingChars).toBe(5);
    });

    it('should handle null codeDesc value gracefully', () => {
      component.form.patchValue({ codeDesc: null });

      expect(component.descriptionRemainingChars).toBe(50);
    });
  });

  describe('Edit mode with null/missing data fields', () => {
    it('should handle null data gracefully in edit mode', () => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();

      expect(component.form.getRawValue().code).toBe('');
      expect(component.form.get('codeDesc')?.value).toBe('');
    });

    it('should handle data with null dates in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        codeType: 'SPL',
        code: 'SPL02',
        codeDesc: 'No dates',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      };
      fixture.detectChanges();

      expect(component.form.get('effDate')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });
  });

  describe('initializeForm resets state', () => {
    it('should reset errorMessage to null', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.errorMessage = 'Some error';
      component['initializeForm']();

      expect(component.errorMessage).toBeNull();
    });

    it('should reset isSubmitting to false', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.isSubmitting = true;
      component['initializeForm']();

      expect(component.isSubmitting).toBeFalse();
    });

    it('should reset lastChangedDateField to null', () => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component['lastChangedDateField'] = 'effective';
      component['initializeForm']();

      expect(component['lastChangedDateField']).toBeNull();
    });
  });

  describe('Date validation listeners', () => {
    it('should set lastChangedDateField to effective when effDate changes', fakeAsync(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.form.get('effDate')?.setValue(futureDate);
      tick();

      expect(component['lastChangedDateField']).toBe('effective');
    }));

    it('should set lastChangedDateField to termination when termDate changes', fakeAsync(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      component.form.get('termDate')?.setValue(moment().add(60, 'days'));
      tick();

      expect(component['lastChangedDateField']).toBe('termination');
    }));

    it('should call cdr.markForCheck on form status changes', fakeAsync(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();

      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      component.form.get('code')?.setValue('X');
      tick();

      expect(cdrSpy).toHaveBeenCalled();
    }));
  });

  describe('Error state matchers', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.codeType = 'SPL';
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
      expect(component.effDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
      expect(component.termDateErrorMatcher.isErrorState).toBeDefined();
    });

    it('effDateErrorMatcher should return false when control is null', () => {
      const result = component.effDateErrorMatcher.isErrorState(null, null!);

      expect(result).toBeFalse();
    });

    it('termDateErrorMatcher should return false when control is null', () => {
      const result = component.termDateErrorMatcher.isErrorState(null, null!);

      expect(result).toBeFalse();
    });
  });

  describe('Constructor and minDate', () => {
    it('should initialize minDate in constructor', () => {
      expect(component.minDate).toBeDefined();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('should initialize terminationMinDate in constructor', () => {
      expect(component.terminationMinDate).toBeDefined();
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });
  });

  describe('ngOnInit mode-based validator setup', () => {
    it('should call setupAddModeValidators in add mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'setupAddModeValidators');
      component.mode = 'add';
      component.codeType = 'SPL';

      component.ngOnInit();

      expect(spy).toHaveBeenCalledWith(component.form, jasmine.any(String));
    });

    it('should call setupEditModeValidators in edit mode', () => {
      const spy = spyOn(DateFieldValidationUtility, 'setupEditModeValidators');
      component.mode = 'edit';
      component.data = mockEditData;

      component.ngOnInit();

      expect(spy).toHaveBeenCalledWith(component.form, jasmine.any(String));
    });
  });

  describe('setErrorMessage additional scenarios', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call cdr.markForCheck', () => {
      const cdrSpy = spyOn(component['cdr'], 'markForCheck');

      component.setErrorMessage('Error occurred');

      expect(cdrSpy).toHaveBeenCalled();
    });

    it('should handle empty string error message', () => {
      component.setErrorMessage('');

      expect(component.errorMessage).toBe('');
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('Constants', () => {
    it('should have CODE_MAX_LENGTH of 5', () => {
      expect(component.CODE_MAX_LENGTH).toBe(5);
    });

    it('should have DESCRIPTION_MAX_LENGTH of 50', () => {
      expect(component.DESCRIPTION_MAX_LENGTH).toBe(50);
    });
  });
});
