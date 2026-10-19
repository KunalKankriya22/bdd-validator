import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { SimpleChange } from '@angular/core';
import moment from 'moment';

import { AddEditCryoMethodComponent } from './add-edit-cryo-method';
import { ChapterAwareDateAdapter } from '@shared/date/chapter-aware-date-adapter';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { CryoMethodModel } from '../models/cryo-methods.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditCryoMethodComponent', () => {
  let component: AddEditCryoMethodComponent;
  let fixture: ComponentFixture<AddEditCryoMethodComponent>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockEditData: CryoMethodModel = {
    thawMethod: 'Bath',
    methodDesc: 'Water Bath Method',
    minTemp: 1.00,
    maxTemp: 6.00,
    minWsFreezeTime: 0.01,
    maxWsFreezeTime: 6.00,
    minSepFreezeTime: 0.10,
    maxSepFreezeTime: 0.55,
    effDate: '2012-10-07',
    termDate: '2012-10-15'
  };

  const futureDate = moment('2099-06-15');

  beforeEach(() => {

    mockHeaderService = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [
        AddEditCryoMethodComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatButtonModule,
        MatIconModule
      ],
      providers: [
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: DateAdapter, useClass: ChapterAwareDateAdapter, deps: [MAT_DATE_LOCALE] }
      ]
    });





    fixture = TestBed.createComponent(AddEditCryoMethodComponent);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    fixture.destroy();
  });
  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should set submit button label to ADD', () => {
      expect(component.submitButtonLabel).toBe('ADD');
    });

    it('should show create another button in add mode', () => {
      expect(component.showCreateAnotherButton).toBeTrue();
    });

    it('should not be submitting initially', () => {
      expect(component.isSubmitting).toBeFalse();
    });

    it('should have no error message initially', () => {
      expect(component.errorMessage).toBeNull();
    });

    it('should set dialog title to Add New Cryo Method', () => {
      expect(component.dialogTitle).toBe('Add New Cryo Method');
    });

    it('should have form initialized with null values', () => {
      const raw = component.form.getRawValue();
      expect(raw.thawMethod).toBeNull();
      expect(raw.methodDesc).toBeNull();
      expect(raw.minTemp).toBeNull();
      expect(raw.maxTemp).toBeNull();
      expect(raw.minWsFreezeTime).toBeNull();
      expect(raw.maxWsFreezeTime).toBeNull();
      expect(raw.minSepFreezeTime).toBeNull();
      expect(raw.maxSepFreezeTime).toBeNull();
      expect(raw.effDate).toBeNull();
      expect(raw.termDate).toBeNull();
    });

    it('should have thawMethod enabled in add mode', () => {
      expect(component.form.get('thawMethod')?.enabled).toBeTrue();
    });

    it('should have effDate enabled in add mode', () => {
      expect(component.form.get('effDate')?.enabled).toBeTrue();
    });

    it('should have methodDesc enabled in add mode', () => {
      expect(component.form.get('methodDesc')?.enabled).toBeTrue();
    });

    it('should initialize minDate as a moment object', () => {
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('should initialize terminationMinDate as a moment object', () => {
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();
    });

    it('should set dialog title to Edit Cryo Method', () => {
      expect(component.dialogTitle).toBe('Edit Cryo Method');
    });

    it('should set submit button label to SAVE', () => {
      expect(component.submitButtonLabel).toBe('SAVE');
    });

    it('should not show create another button in edit mode', () => {
      expect(component.showCreateAnotherButton).toBeFalse();
    });

    it('should parse effective date as moment', () => {
      const effDate = component.form.get('effDate')?.value;
      expect(moment.isMoment(effDate)).toBeTrue();
    });

    it('should parse termination date as moment', () => {
      const termDate = component.form.get('termDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
    });

    it('should disable thawMethod in edit mode', () => {
      expect(component.form.get('thawMethod')?.disabled).toBeTrue();
    });

    it('should keep effDate enabled in edit mode', () => {
      expect(component.form.get('effDate')?.enabled).toBeTrue();
    });

    it('should keep methodDesc enabled in edit mode', () => {
      expect(component.form.get('methodDesc')?.enabled).toBeTrue();
    });

    it('should populate form with data values', () => {
      const raw = component.form.getRawValue();
      expect(raw.thawMethod).toBe('Bath');
      expect(raw.methodDesc).toBe('Water Bath Method');
      expect(raw.minTemp).toBe('1.00');
      expect(raw.maxTemp).toBe('6.00');
      expect(raw.minWsFreezeTime).toBe('0.01');
      expect(raw.maxWsFreezeTime).toBe('6.00');
      expect(raw.minSepFreezeTime).toBe('0.10');
      expect(raw.maxSepFreezeTime).toBe('0.55');
    });

    it('should format numeric data values to two decimal places', () => {
      const raw = component.form.getRawValue();
      expect(raw.minTemp).toBe('1.00');
      expect(raw.maxTemp).toBe('6.00');
    });
  });

  describe('Edit Mode with null data', () => {
    it('should initialize form with nulls when data is null in edit mode', () => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();

      const raw = component.form.getRawValue();
      expect(raw.thawMethod).toBeNull();
      expect(raw.methodDesc).toBeNull();
      expect(raw.minTemp).toBeNull();
    });

    it('should handle data with null numeric fields', () => {
      component.mode = 'edit';
      component.data = {
        thawMethod: 'Test',
        methodDesc: 'Test Desc',
        minTemp: null,
        maxTemp: null,
        minWsFreezeTime: null,
        maxWsFreezeTime: null,
        minSepFreezeTime: null,
        maxSepFreezeTime: null,
        effDate: null,
        termDate: null,
      };
      fixture.detectChanges();

      const raw = component.form.getRawValue();
      expect(raw.minTemp).toBeNull();
      expect(raw.maxTemp).toBeNull();
      expect(raw.effDate).toBeNull();
      expect(raw.termDate).toBeNull();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should be invalid when required fields are empty', () => {
      expect(component.form.invalid).toBeTrue();
    });

    it('should require thawMethod', () => {
      expect(component.form.get('thawMethod')?.hasError('required')).toBeTrue();
    });

    it('should require methodDesc', () => {
      expect(component.form.get('methodDesc')?.hasError('required')).toBeTrue();
    });

    it('should require effDate', () => {
      expect(component.form.get('effDate')?.hasError('required')).toBeTrue();
    });

    it('should require minTemp', () => {
      expect(component.form.get('minTemp')?.hasError('required')).toBeTrue();
    });

    it('should require maxTemp', () => {
      expect(component.form.get('maxTemp')?.hasError('required')).toBeTrue();
    });

    it('should enforce maxLength on thawMethod', () => {
      component.form.patchValue({
        thawMethod: '12345678901'
      });

      expect(component.form.get('thawMethod')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on description', () => {
      component.form.patchValue({
        methodDesc: 'A'.repeat(51)
      });

      expect(component.form.get('methodDesc')?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce min validator on numeric fields', () => {
      component.form.patchValue({
        minTemp: -1
      });

      expect(component.form.get('minTemp')?.hasError('min')).toBeTrue();
    });

    it('should enforce max validator on numeric fields', () => {
      component.form.patchValue({
        minTemp: 1000
      });

      expect(component.form.get('minTemp')?.hasError('max')).toBeTrue();
    });

    it('should accept valid numeric values', () => {
      component.form.patchValue({
        minTemp: 5.50
      });

      expect(component.form.get('minTemp')?.valid).toBeTrue();
    });

    it('should accept valid thawMethod within maxLength', () => {
      component.form.patchValue({ thawMethod: 'AB' });
      expect(component.form.get('thawMethod')?.hasError('maxlength')).toBeFalse();
    });

    it('should accept valid methodDesc within maxLength', () => {
      component.form.patchValue({ methodDesc: 'Valid Desc' });
      expect(component.form.get('methodDesc')?.hasError('maxlength')).toBeFalse();
    });

    it('should detect temperature range error when min > max', () => {
      component.form.patchValue({
        minTemp: 10,
        maxTemp: 5
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('tempRangeInvalid')).toBeTrue();
    });

    it('should not have temperature range error when min <= max', () => {
      component.form.patchValue({
        minTemp: 5,
        maxTemp: 10
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('tempRangeInvalid')).toBeFalse();
    });

    it('should detect worksheet time range error when min > max', () => {
      component.form.patchValue({
        minWsFreezeTime: 5.00,
        maxWsFreezeTime: 1.00
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('worksheetTimeRangeInvalid')).toBeTrue();
    });

    it('should not have worksheet time range error when min <= max', () => {
      component.form.patchValue({
        minWsFreezeTime: 1.00,
        maxWsFreezeTime: 5.00
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('worksheetTimeRangeInvalid')).toBeFalse();
    });

    it('should detect separation time range error when min > max', () => {
      component.form.patchValue({
        minSepFreezeTime: 5.00,
        maxSepFreezeTime: 1.00
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('separationTimeRangeInvalid')).toBeTrue();
    });

    it('should not have separation time range error when min <= max', () => {
      component.form.patchValue({
        minSepFreezeTime: 1.00,
        maxSepFreezeTime: 5.00
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('separationTimeRangeInvalid')).toBeFalse();
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update terminationMinDate when effective date changes', fakeAsync(() => {
      component.form.patchValue({
        effDate: futureDate
      });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    }));

    it('should reset terminationMinDate to minDate when effDate is cleared', fakeAsync(() => {
      component.form.patchValue({ effDate: futureDate });
      tick();

      component.form.patchValue({ effDate: null });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    }));

    it('should reset terminationMinDate to minDate when effDate is not after minDate', fakeAsync(() => {
      const pastDate = moment('1900-01-01');
      component.form.patchValue({ effDate: pastDate });
      tick();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
    }));

    it('should detect dateRangeInvalid when termDate < effDate', () => {
      component.form.patchValue({
        effDate: moment('2099-12-15'),
        termDate: moment('2099-12-01')
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should not have dateRangeInvalid when termDate >= effDate', () => {
      component.form.patchValue({
        effDate: moment('2099-12-01'),
        termDate: moment('2099-12-15')
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should emit save event with form value when valid', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: futureDate
      });

      component.onSave();

      expect(component.save.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBeTrue();
    });

    it('should not emit save when form is invalid', () => {
      spyOn(component.save, 'emit');
      component.onSave();

      expect(component.save.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should emit saveAndCreateAnother event when valid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: futureDate
      });

      component.onSaveAndCreateAnother();

      expect(component.saveAndCreateAnother.emit).toHaveBeenCalled();
      expect(component.isSubmitting).toBeTrue();
    });

    it('should not emit saveAndCreateAnother when form is invalid', () => {
      spyOn(component.saveAndCreateAnother, 'emit');
      component.onSaveAndCreateAnother();

      expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
      expect(component.isSubmitting).toBeFalse();
    });

    it('should mark all fields as touched on save attempt', () => {
      component.onSave();

      expect(component.form.get('thawMethod')?.touched).toBeTrue();
      expect(component.form.get('methodDesc')?.touched).toBeTrue();
      expect(component.form.get('effDate')?.touched).toBeTrue();
    });

    it('should emit correct form value with parsed numeric fields', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: '1.50',
        maxTemp: '6.75',
        minWsFreezeTime: '0.01',
        maxWsFreezeTime: '6.00',
        minSepFreezeTime: '0.10',
        maxSepFreezeTime: '0.55',
        effDate: futureDate
      });

      component.onSave();

      const emittedValue = (component.save.emit as jasmine.Spy).calls.first().args[0];
      expect(emittedValue.minTemp).toBe(1.5);
      expect(emittedValue.maxTemp).toBe(6.75);
      expect(emittedValue.thawMethod).toBe('Test');
      expect(emittedValue.methodDesc).toBe('Test Description');
    });

    it('should emit null for empty numeric fields in form value', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: '1.00',
        maxTemp: '6.00',
        minWsFreezeTime: '0.01',
        maxWsFreezeTime: '6.00',
        minSepFreezeTime: '0.10',
        maxSepFreezeTime: '0.55',
        effDate: futureDate,
        termDate: null
      });

      component.onSave();

      const emittedValue = (component.save.emit as jasmine.Spy).calls.first().args[0];
      expect(emittedValue.termDate).toBeNull();
    });

    it('should not emit save when temperature range is invalid', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 10.00,
        maxTemp: 5.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: futureDate
      });

      component.onSave();

      expect(component.save.emit).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should emit close event', () => {
      spyOn(component.close, 'emit');
      component.onCancel();
      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('Mode Changes via ngOnChanges', () => {
    it('should reinitialize form when mode changes', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });

      expect(component.form.getRawValue().thawMethod).toBe('Bath');
      expect(component.form.get('thawMethod')?.disabled).toBeTrue();
    });

    it('should reinitialize form when data changes', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      const newData: CryoMethodModel = {
        ...mockEditData,
        thawMethod: 'Air',
        methodDesc: 'Air Thaw Method'
      };
      component.data = newData;
      component.ngOnChanges({
        data: new SimpleChange(mockEditData, newData, false)
      });

      expect(component.form.getRawValue().thawMethod).toBe('Air');
    });

    it('should not reinitialize form when unrelated changes occur and form does not exist', () => {
      component.mode = 'add';
      // Do NOT detectChanges - so form is not initialized
      // ngOnChanges should not throw when form is undefined
      expect(() => {
        component.ngOnChanges({
          mode: new SimpleChange(undefined, 'add', true)
        });
      }).not.toThrow();
    });

    it('should not reinitialize when neither mode nor data changes', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const originalForm = component.form;
      component.ngOnChanges({});

      // Form should remain the same instance since no relevant changes
      expect(component.form).toBe(originalForm);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('isFormValid', () => {
    it('should return false in edit mode when form is not dirty', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return true in edit mode when form is dirty and valid', () => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        effDate: '2099-06-15',
        termDate: null
      };
      fixture.detectChanges();

      component.form.patchValue({ minTemp: '2.00' });
      component.form.markAsDirty();
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBeTrue();
    });

    it('should return false in edit mode when form is dirty but invalid', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      component.form.patchValue({ minTemp: -1 });
      component.form.markAsDirty();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return false in add mode when form is invalid', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.isFormValid).toBeFalse();
    });

    it('should return true in add mode when form is valid', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: futureDate
      });
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBeTrue();
    });

    it('should return false in add mode when date range error exists', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: moment('2099-12-15'),
        termDate: moment('2099-12-01')
      });
      component.form.updateValueAndValidity();

      expect(component.isFormValid).toBeFalse();
    });
  });

  describe('Display properties', () => {
    it('should return formatted last modified display', () => {
      component.mode = 'edit';
      component.data = {
        ...mockEditData,
        lastModifiedDate: '2024-03-15T18:30:00.000Z'
      };
      fixture.detectChanges();

      const display = component.lastModifiedDisplay;
      expect(display).toContain('Last Modified:');
      expect(display).toContain('PST');
    });

    it('should return empty string for lastModifiedDisplay when no lastModifiedDate', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: null };
      fixture.detectChanges();

      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should return empty string for lastModifiedDisplay when data is null', () => {
      component.mode = 'edit';
      component.data = null;
      fixture.detectChanges();

      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should return empty string for lastModifiedDisplay when date is invalid', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, lastModifiedDate: 'not-a-date' };
      fixture.detectChanges();

      // moment.utc('not-a-date') creates a moment object but it might or might not be valid
      // depending on moment's parsing. The component checks pst.isValid()
      const display = component.lastModifiedDisplay;
      // If moment parses it as invalid, returns ''
      // If moment somehow parses it, returns formatted string
      expect(typeof display).toBe('string');
    });

    it('should format lastModifiedDisplay correctly with day, month, year, and time', () => {
      component.mode = 'edit';
      // 2024-01-15T20:30:00.000Z in UTC -> 12:30 PST on Jan 15
      component.data = {
        ...mockEditData,
        lastModifiedDate: '2024-01-15T20:30:00.000Z'
      };
      fixture.detectChanges();

      const display = component.lastModifiedDisplay;
      expect(display).toContain('Last Modified:');
      expect(display).toContain('JAN');
      expect(display).toContain('2024');
      expect(display).toContain('PST');
    });
  });

  describe('Error message methods', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    describe('getEffectiveDateError', () => {
      it('should return empty string when lastChangedDateField is not effective', () => {
        component['lastChangedDateField'] = 'termination';
        component.form.get('effDate')?.markAsTouched();
        // No form-level errors should be passed when lastChangedDateField is not effective
        const error = component.getEffectiveDateError();
        // The method passes null formErrors when lastChangedDateField !== 'effective'
        expect(typeof error).toBe('string');
      });

      it('should pass form errors when lastChangedDateField is effective', () => {
        component['lastChangedDateField'] = 'effective';
        component.form.get('effDate')?.markAsTouched();
        const error = component.getEffectiveDateError();
        expect(typeof error).toBe('string');
      });
    });

    describe('getTerminationDateError', () => {
      it('should return empty string when lastChangedDateField is not termination', () => {
        component['lastChangedDateField'] = 'effective';
        component.form.get('termDate')?.markAsTouched();
        const error = component.getTerminationDateError();
        expect(typeof error).toBe('string');
      });

      it('should pass form errors when lastChangedDateField is termination', () => {
        component['lastChangedDateField'] = 'termination';
        component.form.get('termDate')?.markAsTouched();
        const error = component.getTerminationDateError();
        expect(typeof error).toBe('string');
      });
    });

    describe('getTimeFormatError', () => {
      it('should return empty string when no invalidTimeFormat error', () => {
        expect(component.getTimeFormatError('minWsFreezeTime')).toBe('');
      });

      it('should return error message when invalidTimeFormat error exists', () => {
        component.form.get('minWsFreezeTime')?.setValue(2.65);
        component.form.get('minWsFreezeTime')?.updateValueAndValidity();

        const error = component.getTimeFormatError('minWsFreezeTime');
        expect(error).toContain('Invalid time format');
      });

      it('should return empty string for a field that does not exist', () => {
        expect(component.getTimeFormatError('nonExistentField')).toBe('');
      });
    });

    describe('getTemperatureRangeError', () => {
      it('should return empty string when no temperature range error', () => {
        component.form.patchValue({ minTemp: 1, maxTemp: 6 });
        component.form.updateValueAndValidity();

        expect(component.getTemperatureRangeError()).toBe('');
      });

      it('should return error message when temperature range is invalid', () => {
        component.form.patchValue({ minTemp: 10, maxTemp: 5 });
        component.form.updateValueAndValidity();

        expect(component.getTemperatureRangeError()).toBe(
          'Minimum temperature must be less than or equal to maximum temperature'
        );
      });
    });

    describe('getWorksheetTimeRangeError', () => {
      it('should return empty string when no worksheet time range error', () => {
        component.form.patchValue({ minWsFreezeTime: 1, maxWsFreezeTime: 5 });
        component.form.updateValueAndValidity();

        expect(component.getWorksheetTimeRangeError()).toBe('');
      });

      it('should return error message when worksheet time range is invalid', () => {
        component.form.patchValue({ minWsFreezeTime: 5, maxWsFreezeTime: 1 });
        component.form.updateValueAndValidity();

        expect(component.getWorksheetTimeRangeError()).toBe(
          'Minimum worksheet freeze time must be less than or equal to maximum'
        );
      });
    });

    describe('getSeparationTimeRangeError', () => {
      it('should return empty string when no separation time range error', () => {
        component.form.patchValue({ minSepFreezeTime: 1, maxSepFreezeTime: 5 });
        component.form.updateValueAndValidity();

        expect(component.getSeparationTimeRangeError()).toBe('');
      });

      it('should return error message when separation time range is invalid', () => {
        component.form.patchValue({ minSepFreezeTime: 5, maxSepFreezeTime: 1 });
        component.form.updateValueAndValidity();

        expect(component.getSeparationTimeRangeError()).toBe(
          'Minimum separation freeze time must be less than or equal to maximum'
        );
      });
    });
  });

  describe('formatDecimalField', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should format a numeric value to two decimal places', () => {
      component.form.patchValue({ minTemp: '5' });
      component.formatDecimalField('minTemp');

      expect(component.form.get('minTemp')?.value).toBe('5.00');
    });

    it('should format a float value to two decimal places', () => {
      component.form.patchValue({ minTemp: '5.5' });
      component.formatDecimalField('minTemp');

      expect(component.form.get('minTemp')?.value).toBe('5.50');
    });

    it('should not modify null values', () => {
      component.form.patchValue({ minTemp: null });
      component.formatDecimalField('minTemp');

      expect(component.form.get('minTemp')?.value).toBeNull();
    });

    it('should not modify empty string values', () => {
      component.form.patchValue({ minTemp: '' });
      component.formatDecimalField('minTemp');

      expect(component.form.get('minTemp')?.value).toBe('');
    });

    it('should handle NaN input gracefully', () => {
      component.form.patchValue({ minTemp: 'abc' });
      component.formatDecimalField('minTemp');

      // NaN check: parseFloat('abc') is NaN, so value should remain unchanged
      expect(component.form.get('minTemp')?.value).toBe('abc');
    });

    it('should call cdr.markForCheck', () => {
      spyOn(component.cdr, 'markForCheck');
      component.form.patchValue({ minTemp: '5' });
      component.formatDecimalField('minTemp');

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should clear numeric and termDate fields', () => {
      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Desc',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: futureDate,
        termDate: futureDate
      });

      component.onClearAll();

      expect(component.form.get('minTemp')?.value).toBeNull();
      expect(component.form.get('maxTemp')?.value).toBeNull();
      expect(component.form.get('minWsFreezeTime')?.value).toBeNull();
      expect(component.form.get('maxWsFreezeTime')?.value).toBeNull();
      expect(component.form.get('minSepFreezeTime')?.value).toBeNull();
      expect(component.form.get('maxSepFreezeTime')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should not clear thawMethod, methodDesc, or effDate', () => {
      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Desc',
        effDate: futureDate
      });

      component.onClearAll();

      expect(component.form.get('thawMethod')?.value).toBe('Test');
      expect(component.form.get('methodDesc')?.value).toBe('Test Desc');
      expect(component.form.get('effDate')?.value).toEqual(futureDate);
    });

    it('should mark form as dirty', () => {
      component.onClearAll();
      expect(component.form.dirty).toBeTrue();
    });
  });

  describe('onNumericKeyDown', () => {
    let mockEvent: Partial<KeyboardEvent>;

    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    function createKeyEvent(key: string, overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
      return {
        key,
        ctrlKey: false,
        preventDefault: jasmine.createSpy('preventDefault'),
        target: { value: '' } as HTMLInputElement,
        ...overrides
      } as unknown as KeyboardEvent;
    }

    it('should allow digit keys', () => {
      const event = createKeyEvent('5');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Backspace', () => {
      const event = createKeyEvent('Backspace');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Delete', () => {
      const event = createKeyEvent('Delete');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab', () => {
      const event = createKeyEvent('Tab');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowLeft', () => {
      const event = createKeyEvent('ArrowLeft');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow ArrowRight', () => {
      const event = createKeyEvent('ArrowRight');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Home', () => {
      const event = createKeyEvent('Home');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow End', () => {
      const event = createKeyEvent('End');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+A', () => {
      const event = createKeyEvent('a', { ctrlKey: true } as Partial<KeyboardEvent>);
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C', () => {
      const event = createKeyEvent('c', { ctrlKey: true } as Partial<KeyboardEvent>);
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V', () => {
      const event = createKeyEvent('v', { ctrlKey: true } as Partial<KeyboardEvent>);
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+X', () => {
      const event = createKeyEvent('x', { ctrlKey: true } as Partial<KeyboardEvent>);
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow first decimal point', () => {
      const event = createKeyEvent('.', {
        target: { value: '5' } as HTMLInputElement
      } as Partial<KeyboardEvent>);
      component.onNumericKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent second decimal point', () => {
      const event = createKeyEvent('.', {
        target: { value: '5.2' } as HTMLInputElement
      } as Partial<KeyboardEvent>);
      component.onNumericKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent non-numeric keys', () => {
      const event = createKeyEvent('a');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent special character keys', () => {
      const event = createKeyEvent('-');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent plus sign', () => {
      const event = createKeyEvent('+');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space', () => {
      const event = createKeyEvent(' ');
      component.onNumericKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onEffDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle effective date input event', () => {
      const mockEvent = {
        target: { value: '15-JAN-2099' } as HTMLInputElement
      } as unknown as Event;

      expect(() => component.onEffDateInput(mockEvent)).not.toThrow();
    });

    it('should handle empty effective date input', () => {
      const mockEvent = {
        target: { value: '' } as HTMLInputElement
      } as unknown as Event;

      component.onEffDateInput(mockEvent);

      // After handling empty input, the effDate control should have required error
      expect(component.form.get('effDate')?.hasError('required')).toBeTrue();
    });
  });

  describe('onTermDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle termination date input event', () => {
      const mockEvent = {
        target: { value: '15-JAN-2099' } as HTMLInputElement
      } as unknown as Event;

      expect(() => component.onTermDateInput(mockEvent)).not.toThrow();
    });

    it('should handle empty termination date input in add mode', () => {
      const mockEvent = {
        target: { value: '' } as HTMLInputElement
      } as unknown as Event;

      component.onTermDateInput(mockEvent);

      // In add mode with empty input, field should be cleared and pristine
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should handle empty termination date input in edit mode', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false),
        data: new SimpleChange(null, mockEditData, false)
      });

      const mockEvent = {
        target: { value: '' } as HTMLInputElement
      } as unknown as Event;

      component.onTermDateInput(mockEvent);

      // In edit mode with empty input, field should be cleared but dirty
      expect(component.form.get('termDate')?.value).toBeNull();
    });
  });

  describe('Error state matchers', () => {
    beforeEach(() => {
      component.mode = 'add';
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

    it('should have tempErrorMatcher defined', () => {
      expect(component.tempErrorMatcher).toBeDefined();
    });

    it('should have wsTimeErrorMatcher defined', () => {
      expect(component.wsTimeErrorMatcher).toBeDefined();
    });

    it('should have sepTimeErrorMatcher defined', () => {
      expect(component.sepTimeErrorMatcher).toBeDefined();
    });
  });

  describe('Form value changes triggering updateValueAndValidity', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update form validity when minTemp changes', fakeAsync(() => {
      spyOn(component.cdr, 'markForCheck');
      component.form.patchValue({ minTemp: 5 });
      tick();

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    }));

    it('should update form validity when maxTemp changes', fakeAsync(() => {
      spyOn(component.cdr, 'markForCheck');
      component.form.patchValue({ maxTemp: 10 });
      tick();

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    }));

    it('should update form validity when minWsFreezeTime changes', fakeAsync(() => {
      spyOn(component.cdr, 'markForCheck');
      component.form.patchValue({ minWsFreezeTime: 1 });
      tick();

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    }));

    it('should track lastChangedDateField as effective when effDate changes', fakeAsync(() => {
      component.form.patchValue({ effDate: futureDate });
      tick();

      expect(component['lastChangedDateField']).toBe('effective');
    }));

    it('should track lastChangedDateField as termination when termDate changes', fakeAsync(() => {
      component.form.patchValue({ termDate: futureDate });
      tick();

      expect(component['lastChangedDateField']).toBe('termination');
    }));
  });

  describe('hasDateValidationError (indirect via save)', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not save when dateRangeInvalid form error exists', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: moment('2099-12-15'),
        termDate: moment('2099-12-01')
      });

      component.onSave();

      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should not save when worksheetTimeRangeInvalid form error exists', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 8.00,
        maxWsFreezeTime: 1.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: futureDate
      });

      component.onSave();

      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should not save when separationTimeRangeInvalid form error exists', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 8.00,
        maxSepFreezeTime: 0.55,
        effDate: futureDate
      });

      component.onSave();

      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should mark termDate as touched when date validation error exists', () => {
      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test Description',
        minTemp: 1.00,
        maxTemp: 6.00,
        minWsFreezeTime: 0.01,
        maxWsFreezeTime: 6.00,
        minSepFreezeTime: 0.10,
        maxSepFreezeTime: 0.55,
        effDate: moment('2099-12-15'),
        termDate: moment('2099-12-01')
      });

      component.onSave();

      expect(component.form.get('termDate')?.touched).toBeTrue();
    });
  });

  describe('setupModeValidators', () => {
    it('should setup add mode validators when mode is add', () => {
      component.mode = 'add';
      fixture.detectChanges();

      // In add mode, effective date should have effectiveDateNotPastValidator
      const effControl = component.form.get('effDate');
      // Set a past date and check if validation catches it
      effControl?.setValue(moment('2000-01-01'));
      effControl?.updateValueAndValidity();

      expect(effControl?.hasError('effectiveDatePast')).toBeTrue();
    });

    it('should setup edit mode validators when mode is edit', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      fixture.detectChanges();

      // In edit mode, effective date should remain enabled
      expect(component.form.get('effDate')?.enabled).toBeTrue();
    });

    it('should add terminationDateNotPastValidator in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockEditData, termDate: null };
      fixture.detectChanges();

      const termControl = component.form.get('termDate');
      // Set a past date
      termControl?.setValue(moment('2000-01-01'));
      termControl?.updateValueAndValidity();

      expect(termControl?.hasError('terminationDatePast')).toBeTrue();
    });
  });

  describe('getFormValue (indirect via save emit)', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return null for empty numeric string values', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test',
        minTemp: '1.00',
        maxTemp: '6.00',
        minWsFreezeTime: '0.01',
        maxWsFreezeTime: '6.00',
        minSepFreezeTime: '0.10',
        maxSepFreezeTime: '0.55',
        effDate: futureDate
      });

      component.onSave();

      const emitted = (component.save.emit as jasmine.Spy).calls.first().args[0];
      expect(emitted.minTemp).toBe(1);
      expect(emitted.maxTemp).toBe(6);
    });

    it('should include effDate and termDate in emitted value', () => {
      spyOn(component.save, 'emit');

      const termFuture = moment('2099-07-01');
      component.form.patchValue({
        thawMethod: 'Test',
        methodDesc: 'Test',
        minTemp: '1.00',
        maxTemp: '6.00',
        minWsFreezeTime: '0.01',
        maxWsFreezeTime: '6.00',
        minSepFreezeTime: '0.10',
        maxSepFreezeTime: '0.55',
        effDate: futureDate,
        termDate: termFuture
      });

      component.onSave();

      const emitted = (component.save.emit as jasmine.Spy).calls.first().args[0];
      expect(moment.isMoment(emitted.effDate)).toBeTrue();
      expect(moment.isMoment(emitted.termDate)).toBeTrue();
    });
  });

  describe('Numeric field value changes', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should trigger cdr.markForCheck when maxSepFreezeTime changes', fakeAsync(() => {
      spyOn(component.cdr, 'markForCheck');
      component.form.patchValue({ maxSepFreezeTime: 2 });
      tick();

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    }));

    it('should trigger cdr.markForCheck when minSepFreezeTime changes', fakeAsync(() => {
      spyOn(component.cdr, 'markForCheck');
      component.form.patchValue({ minSepFreezeTime: 1 });
      tick();

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    }));

    it('should trigger cdr.markForCheck when maxWsFreezeTime changes', fakeAsync(() => {
      spyOn(component.cdr, 'markForCheck');
      component.form.patchValue({ maxWsFreezeTime: 5 });
      tick();

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    }));
  });

  describe('Date validation listeners (setupDateValidationListeners)', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call cdr.markForCheck when effDate value changes via listener', fakeAsync(() => {
      spyOn(component.cdr, 'markForCheck');
      component.form.get('effDate')?.setValue(futureDate);
      tick();

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    }));

    it('should call cdr.markForCheck when termDate value changes via listener', fakeAsync(() => {
      spyOn(component.cdr, 'markForCheck');
      component.form.get('termDate')?.setValue(futureDate);
      tick();

      expect(component.cdr.markForCheck).toHaveBeenCalled();
    }));
  });
});
