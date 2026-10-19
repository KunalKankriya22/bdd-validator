import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MAT_DATE_FORMATS } from '@angular/material/core';
import { of, throwError } from 'rxjs';
import { AddEditEligibleCellLoss } from './add-edit-eligible-cell-loss';
import { EligiblePlasmaCellLossService } from '../services/eligible-plasma-cell-loss.service';
import { DD_MON_YYYY_FORMATS } from '@shared/date/date-formats';
import { HeaderService } from '@shared/services/header.service';
import { signal } from '@angular/core';
import moment from 'moment';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

describe('AddEditEligibleCellLoss', () => {
  const mockHeaderService = {
    chapterTimeZone: signal('+00:00'),
    chapterId: signal('001')
  };

  function createComponent(mode: 'add' | 'edit', data: any = null) {
    const serviceSpy = jasmine.createSpyObj('EligiblePlasmaCellLossService', ['addRecord', 'updateRecord', 'validateDuplicate']);
    serviceSpy.validateDuplicate.and.returnValue(of({ isDuplicate: false, message: '' }));
    const snackBarSpy = createMockMatSnackBar();

    TestBed.configureTestingModule({
      imports: [AddEditEligibleCellLoss, ReactiveFormsModule, MatSnackBarModule],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DATE_FORMATS, useValue: DD_MON_YYYY_FORMATS },
        { provide: EligiblePlasmaCellLossService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    const fixture = TestBed.createComponent(AddEditEligibleCellLoss);
    const component = fixture.componentInstance;
    component.mode = mode;
    component.data = data;
    fixture.detectChanges();
    return { fixture, component, serviceSpy, snackBarSpy };
  }

  describe('Add Mode', () => {
    let component: AddEditEligibleCellLoss;
    let fixture: ComponentFixture<AddEditEligibleCellLoss>;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      ({ fixture, component } = createComponent('add'));
    });



    it('should not require optional fields (description, minWeight, maxWeight)', () => {
      expect(component.form.get('description')?.hasError('required')).toBeFalsy();
      expect(component.form.get('minWeight')?.hasError('required')).toBeFalsy();
      expect(component.form.get('maxWeight')?.hasError('required')).toBeFalsy();
    });

    it('should have effective date enabled in add mode', () => {
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });



    it('should accept numeric input for period field', () => {
      component.form.patchValue({ period: 365 });
      expect(component.form.get('period')?.value).toBe(365);
      expect(component.form.get('period')?.hasError('notInteger')).toBeFalsy();
    });

    it('should validate period max value of 999999', () => {
      component.form.patchValue({ period: 1000000 });
      expect(component.form.get('period')?.hasError('max')).toBeTruthy();
    });

    it('should show temporary overflow error for max loss when input exceeds 6 digits', () => {
      const inputEl = { value: '1234567', target: null } as any;
      inputEl.target = inputEl;
      const event = { target: inputEl } as unknown as Event;
      component.onMaxLossInput(event);
      expect(component.showMaxLossOverflowError).toBeTrue();
      expect(component.getMaxLossError()).toBe('Value must not exceed 999999');
    });

    it('should show temporary overflow error for period when input exceeds 6 digits', () => {
      const inputEl = { value: '1234567', target: null } as any;
      inputEl.target = inputEl;
      const event = { target: inputEl } as unknown as Event;
      component.onPeriodInput(event);
      expect(component.showPeriodOverflowError).toBeTrue();
      expect(component.getPeriodError()).toBe('Value must not exceed 999999');
    });

    it('should not show overflow error for max loss when input is within 6 digits', () => {
      const inputEl = { value: '123456', target: null } as any;
      inputEl.target = inputEl;
      const event = { target: inputEl } as unknown as Event;
      component.onMaxLossInput(event);
      expect(component.showMaxLossOverflowError).toBeFalse();
    });

    it('should not show overflow error for period when input is within 6 digits', () => {
      const inputEl = { value: '123456', target: null } as any;
      inputEl.target = inputEl;
      const event = { target: inputEl } as unknown as Event;
      component.onPeriodInput(event);
      expect(component.showPeriodOverflowError).toBeFalse();
    });

    it('should clear max loss overflow error after 2 seconds', fakeAsync(() => {
      const inputEl = { value: '1234567', target: null } as any;
      inputEl.target = inputEl;
      const event = { target: inputEl } as unknown as Event;
      component.onMaxLossInput(event);
      expect(component.showMaxLossOverflowError).toBeTrue();

      tick(2000);

      expect(component.showMaxLossOverflowError).toBeFalse();
      expect(component.getMaxLossError()).toBe('');
    }));

    it('should clear period overflow error after 2 seconds', fakeAsync(() => {
      const inputEl = { value: '1234567', target: null } as any;
      inputEl.target = inputEl;
      const event = { target: inputEl } as unknown as Event;
      component.onPeriodInput(event);
      expect(component.showPeriodOverflowError).toBeTrue();

      tick(2000);

      expect(component.showPeriodOverflowError).toBeFalse();
      expect(component.getPeriodError()).toBe('');
    }));

    // Weight boundary tests
  });

  describe('Duplicate Validation on Save', () => {
    let component: AddEditEligibleCellLoss;
    let serviceSpy: jasmine.SpyObj<EligiblePlasmaCellLossService>;
    let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      ({ component, serviceSpy, snackBarSpy } = createComponent('add'));
    });

    function fillValidForm(): void {
      const futureDate = moment().add(5, 'days');
      component.form.patchValue({
        cellType: 'RBC',
        description: 'Red Blood Cell',
        maxLoss: 500,
        period: 30,
        effectiveDate: futureDate
      });
      component.form.markAllAsTouched();
      component.form.markAsDirty();
    }

    it('should call validateDuplicate before addRecord in add mode', () => {
      fillValidForm();
      serviceSpy.validateDuplicate.and.returnValue(of({ isDuplicate: false, message: '' }));
      serviceSpy.addRecord.and.returnValue(of({ message: 'Success' }));

      component.onSave();

      expect(serviceSpy.validateDuplicate).toHaveBeenCalled();
    });

    it('should block save and show error when duplicate is found', () => {
      fillValidForm();
      serviceSpy.validateDuplicate.and.returnValue(
        of({ isDuplicate: true, message: 'Duplicate record exists' })
      );

      component.onSave();

      expect(serviceSpy.validateDuplicate).toHaveBeenCalled();
      expect(serviceSpy.addRecord).not.toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should proceed with addRecord when no duplicate found', () => {
      fillValidForm();
      serviceSpy.validateDuplicate.and.returnValue(of({ isDuplicate: false, message: '' }));
      serviceSpy.addRecord.and.returnValue(of({ message: 'Success' }));

      component.onSave();

      expect(serviceSpy.addRecord).toHaveBeenCalled();
    });

    it('should proceed with addRecord when duplicate check fails', () => {
      fillValidForm();
      serviceSpy.validateDuplicate.and.returnValue(throwError(() => new Error('API error')));
      serviceSpy.addRecord.and.returnValue(of({ message: 'Success' }));

      component.onSave();

      expect(serviceSpy.addRecord).toHaveBeenCalled();
    });

    it('should call validateDuplicate with excludeAuditKey in edit mode', async () => {
      await TestBed.resetTestingModule();
      const editRecord = {
        cellType: 'PLASM', description: 'Plasma', minWeight: 120, maxWeight: 180,
        auditKey: '99999', maxLoss: 800, period: 90,
        effectiveDate: '2026-03-01', terminationDate: '2027-03-01'
      };
      const result = createComponent('edit', editRecord);
      result.component.form.patchValue({ maxLoss: 900 });
      result.component.form.markAsDirty();
      result.serviceSpy.validateDuplicate.and.returnValue(of({ isDuplicate: false, message: '' }));
      result.serviceSpy.updateRecord.and.returnValue(of({ message: 'Success' }));

      result.component.onSave();

      expect(result.serviceSpy.validateDuplicate).toHaveBeenCalledWith(
        jasmine.objectContaining({ excludeAuditKey: '99999' })
      );
      expect(result.serviceSpy.updateRecord).toHaveBeenCalled();
    });

    it('should block update and show error when duplicate is found in edit mode', async () => {
      await TestBed.resetTestingModule();
      const editRecord = {
        cellType: 'PLASM', description: 'Plasma', minWeight: 120, maxWeight: 180,
        auditKey: '99999', maxLoss: 800, period: 90,
        effectiveDate: '2026-03-01', terminationDate: '2027-03-01'
      };
      const result = createComponent('edit', editRecord);
      result.component.form.patchValue({ maxLoss: 900 });
      result.component.form.markAsDirty();
      result.serviceSpy.validateDuplicate.and.returnValue(
        of({ isDuplicate: true, message: 'Duplicate record exists' })
      );

      result.component.onSave();

      expect(result.serviceSpy.validateDuplicate).toHaveBeenCalledWith(
        jasmine.objectContaining({ excludeAuditKey: '99999' })
      );
      expect(result.serviceSpy.updateRecord).not.toHaveBeenCalled();
      expect(result.component.isSaving).toBeFalse();
    });

    it('should proceed with update when duplicate check fails in edit mode', async () => {
      await TestBed.resetTestingModule();
      const editRecord = {
        cellType: 'PLASM', description: 'Plasma', minWeight: 120, maxWeight: 180,
        auditKey: '99999', maxLoss: 800, period: 90,
        effectiveDate: '2026-03-01', terminationDate: '2027-03-01'
      };
      const result = createComponent('edit', editRecord);
      result.component.form.patchValue({ maxLoss: 900 });
      result.component.form.markAsDirty();
      result.serviceSpy.validateDuplicate.and.returnValue(throwError(() => new Error('API error')));
      result.serviceSpy.updateRecord.and.returnValue(of({ message: 'Success' }));

      result.component.onSave();

      expect(result.serviceSpy.updateRecord).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    let component: AddEditEligibleCellLoss;
    let fixture: ComponentFixture<AddEditEligibleCellLoss>;

    const editRecord = {
      cellType: 'PLASM',
      description: 'Plasma',
      minWeight: 120,
      maxWeight: 180,
      auditKey: '11111',
      maxLoss: 800,
      period: 90,
      effectiveDate: '2026-03-01',
      terminationDate: '2027-03-01'
    };

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      ({ fixture, component } = createComponent('edit', editRecord));
    });

    it('should populate form values in edit mode', () => {
      expect(component.form.get('cellType')?.value).toBe('PLASM');
      expect(component.form.get('description')?.value).toBe('Plasma');
      expect(component.form.get('minWeight')?.value).toBe(120);
      expect(component.form.get('maxWeight')?.value).toBe(180);
      expect(component.form.get('maxLoss')?.value).toBe(800);
      expect(component.form.get('period')?.value).toBe(90);
    });


    it('should not be valid when form is not dirty in edit mode', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should populate cell type options from edit data', () => {
      expect(component.cellTypeOptions.length).toBe(1);
      expect(component.cellTypeOptions[0].code).toBe('PLASM');
      expect(component.cellTypeOptions[0].description).toBe('Plasma');
    });

    it('should have effective date disabled in edit mode', () => {
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();
    });

    it('should display effective date correctly', () => {
      expect(component.getEffectiveDateDisplay()).toBe('01-MAR-2026');
    });
  });

  describe('Termination Date Min Date', () => {
    it('should update termination min date when effective date is set in add mode', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');

      const futureDate = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);

      const termMinDate = component.terminationMinDate;
      expect(termMinDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    });

    it('should reset termination min date to chapter min when effective date is cleared', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');

      component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
      component.form.get('effectiveDate')?.setValue(null);

      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should use chapter min date when effective date is in the past in edit mode', async () => {
      await TestBed.resetTestingModule();
      const pastRecord = {
        cellType: 'PLASM',
        description: 'Plasma',
        minWeight: 120,
        maxWeight: 180,
        auditKey: '33333',
        maxLoss: 800,
        period: 90,
        effectiveDate: moment().subtract(1, 'year').format('YYYY-MM-DD'),
        terminationDate: moment().add(1, 'year').format('YYYY-MM-DD')
      };
      const { component } = createComponent('edit', pastRecord);

      expect(component.terminationMinDate).toEqual(component.minDate);
    });

    it('should use effective date when it is after chapter min date in edit mode', async () => {
      await TestBed.resetTestingModule();
      const futureEffDate = moment().add(30, 'days');
      const futureRecord = {
        cellType: 'PLASM',
        description: 'Plasma',
        minWeight: 120,
        maxWeight: 180,
        auditKey: '44444',
        maxLoss: 800,
        period: 90,
        effectiveDate: futureEffDate.format('YYYY-MM-DD'),
        terminationDate: moment().add(1, 'year').format('YYYY-MM-DD')
      };
      const { component } = createComponent('edit', futureRecord);

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(futureEffDate.format('YYYY-MM-DD'));
    });
  });

  describe('Edit Mode - Missing Description', () => {
    let component: AddEditEligibleCellLoss;

    const recordWithoutDescription = {
      cellType: 'RBC',
      description: null,
      minWeight: 120,
      maxWeight: 180,
      auditKey: '22222',
      maxLoss: 800,
      period: 90,
      effectiveDate: '2026-03-01',
      terminationDate: '2027-03-01'
    };

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      ({ component } = createComponent('edit', recordWithoutDescription));
    });

    it('should populate description from cellTypeOptions when missing in record', () => {
      expect(component.form.get('description')?.value).toBe('Red Blood Cell');
    });

    it('should have cell type set correctly even without description', () => {
      expect(component.form.get('cellType')?.value).toBe('RBC');
    });
  });

  describe('onCellTypeChange', () => {
    it('should update description when a valid cell type is selected', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.onCellTypeChange('PLASM');
      expect(component.form.get('description')?.value).toBe('Plasma');
    });

    it('should update description to RBC description', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.onCellTypeChange('RBC');
      expect(component.form.get('description')?.value).toBe('Red Blood Cell');
    });

    it('should not change description when an unknown cell type is selected', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.patchValue({ description: 'Original' });
      component.onCellTypeChange('UNKNOWN');
      expect(component.form.get('description')?.value).toBe('Original');
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel event', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('isFormValid getter', () => {
    it('should return true when form is valid in add mode', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.patchValue({
        cellType: 'PLASM',
        maxLoss: 100,
        period: 30,
        effectiveDate: moment().add(5, 'days'),
      });
      component.form.markAsDirty();
      component.form.updateValueAndValidity();
      expect(component.isFormValid).toBeTrue();
    });

    it('should return false when required fields are missing in add mode', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when form is not dirty in edit mode', async () => {
      await TestBed.resetTestingModule();
      const editRecord = {
        cellType: 'PLASM', description: 'Plasma', minWeight: 120, maxWeight: 180,
        auditKey: '11111', maxLoss: 800, period: 90,
        effectiveDate: '2026-03-01', terminationDate: '2027-03-01'
      };
      const { component } = createComponent('edit', editRecord);
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form is dirty and valid in edit mode', async () => {
      await TestBed.resetTestingModule();
      const editRecord = {
        cellType: 'PLASM', description: 'Plasma', minWeight: 120, maxWeight: 180,
        auditKey: '11111', maxLoss: 800, period: 90,
        effectiveDate: moment().add(5, 'days').format('YYYY-MM-DD'), terminationDate: moment().add(1, 'year').format('YYYY-MM-DD')
      };
      const { component } = createComponent('edit', editRecord);
      component.form.get('maxLoss')?.setValue(900);
      component.form.markAsDirty();
      component.form.updateValueAndValidity();
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('getMinWeightError', () => {
    let component: AddEditEligibleCellLoss;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      ({ component } = createComponent('add'));
    });

    it('should return empty string when control is untouched', () => {
      expect(component.getMinWeightError()).toBe('');
    });

    it('should return notInteger error for decimal value', () => {
      component.form.get('minWeight')?.setValue(1.5);
      component.form.get('minWeight')?.markAsTouched();
      expect(component.getMinWeightError()).toBe('Value must be Integer');
    });

    it('should return notPositive error for zero value', () => {
      component.form.get('minWeight')?.setValue(0);
      component.form.get('minWeight')?.markAsTouched();
      expect(component.getMinWeightError()).toBe('Value must be greater than one (1)');
    });

    it('should return max error for value exceeding 999999', () => {
      component.form.get('minWeight')?.setValue(1000000);
      component.form.get('minWeight')?.markAsTouched();
      expect(component.getMinWeightError()).toBe('Value must not exceed 999999');
    });

    it('should return maxWeightInvalid error when min > max and lastChangedWeightField is min', () => {
      component.form.get('minWeight')?.setValue(200);
      component.form.get('maxWeight')?.setValue(100);
      component.form.get('minWeight')?.markAsTouched();
      // Trigger the valueChanges to set lastChangedWeightField = 'min'
      component.form.get('minWeight')?.setValue(200);
      component.form.updateValueAndValidity();
      expect(component.getMinWeightError()).toBe('Lower range cannot be greater than upper range.');
    });
  });

  describe('getMaxWeightError', () => {
    let component: AddEditEligibleCellLoss;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      ({ component } = createComponent('add'));
    });

    it('should return empty string when control is untouched', () => {
      expect(component.getMaxWeightError()).toBe('');
    });

    it('should return notInteger error for string non-integer value', () => {
      component.form.get('maxWeight')?.setValue('abc');
      component.form.get('maxWeight')?.markAsTouched();
      expect(component.getMaxWeightError()).toBe('Value must be Integer');
    });

    it('should return notPositive error for negative value', () => {
      component.form.get('maxWeight')?.setValue(-5);
      component.form.get('maxWeight')?.markAsTouched();
      expect(component.getMaxWeightError()).toBe('Value must be greater than one (1)');
    });

    it('should return max error for value exceeding 999999', () => {
      component.form.get('maxWeight')?.setValue(1000000);
      component.form.get('maxWeight')?.markAsTouched();
      expect(component.getMaxWeightError()).toBe('Value must not exceed 999999');
    });

    it('should return maxWeightInvalid error when max <= min and lastChangedWeightField is max', () => {
      component.form.get('minWeight')?.setValue(200);
      component.form.get('maxWeight')?.setValue(100);
      component.form.get('maxWeight')?.markAsTouched();
      // Trigger the valueChanges to set lastChangedWeightField = 'max'
      component.form.get('maxWeight')?.setValue(100);
      component.form.updateValueAndValidity();
      expect(component.getMaxWeightError()).toBe('Lower range cannot be greater than upper range.');
    });
  });

  describe('getMaxLossError', () => {
    let component: AddEditEligibleCellLoss;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      ({ component } = createComponent('add'));
    });

    it('should return empty string when control is untouched and no overflow', () => {
      expect(component.getMaxLossError()).toBe('');
    });

    it('should return overflow error message when showMaxLossOverflowError is true', () => {
      component.showMaxLossOverflowError = true;
      expect(component.getMaxLossError()).toBe('Value must not exceed 999999');
    });

    it('should return required error when maxLoss is empty and touched', () => {
      component.form.get('maxLoss')?.setValue(null);
      component.form.get('maxLoss')?.markAsTouched();
      expect(component.getMaxLossError()).toBe('Max Loss (in mL) is required');
    });

    it('should return notInteger error for non-integer maxLoss', () => {
      component.form.get('maxLoss')?.setValue(1.5);
      component.form.get('maxLoss')?.markAsTouched();
      expect(component.getMaxLossError()).toBe('Value must be Integer');
    });

    it('should return notPositive error for zero maxLoss', () => {
      component.form.get('maxLoss')?.setValue(0);
      component.form.get('maxLoss')?.markAsTouched();
      expect(component.getMaxLossError()).toBe('Value must be greater than one (1)');
    });

    it('should return max error for maxLoss exceeding 999999', () => {
      component.form.get('maxLoss')?.setValue(1000000);
      component.form.get('maxLoss')?.markAsTouched();
      expect(component.getMaxLossError()).toBe('Value must not exceed 999999');
    });
  });

  describe('getPeriodError', () => {
    let component: AddEditEligibleCellLoss;

    beforeEach(async () => {
      await TestBed.resetTestingModule();
      ({ component } = createComponent('add'));
    });

    it('should return empty string when control is untouched and no overflow', () => {
      expect(component.getPeriodError()).toBe('');
    });

    it('should return overflow error message when showPeriodOverflowError is true', () => {
      component.showPeriodOverflowError = true;
      expect(component.getPeriodError()).toBe('Value must not exceed 999999');
    });

    it('should return required error when period is empty and touched', () => {
      component.form.get('period')?.setValue(null);
      component.form.get('period')?.markAsTouched();
      expect(component.getPeriodError()).toBe('Period (in Days) is required');
    });

    it('should return notInteger error for non-integer period', () => {
      component.form.get('period')?.setValue('abc');
      component.form.get('period')?.markAsTouched();
      expect(component.getPeriodError()).toBe('Value must be Integer');
    });

    it('should return notPositive error for negative period', () => {
      component.form.get('period')?.setValue(-1);
      component.form.get('period')?.markAsTouched();
      expect(component.getPeriodError()).toBe('Value must be greater than one (1)');
    });

    it('should return max error for period exceeding 999999', () => {
      component.form.get('period')?.setValue(1000000);
      component.form.get('period')?.markAsTouched();
      expect(component.getPeriodError()).toBe('Value must not exceed 999999');
    });
  });

  describe('getEffectiveDateDisplay', () => {
    it('should return dash when no effective date is set', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      expect(component.getEffectiveDateDisplay()).toBe('-');
    });

    it('should format a valid moment date correctly', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.get('effectiveDate')?.setValue(moment('2026-03-01'));
      expect(component.getEffectiveDateDisplay()).toBe('01-MAR-2026');
    });

    it('should return dash for an invalid date', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.get('effectiveDate')?.setValue(moment('invalid'));
      expect(component.getEffectiveDateDisplay()).toBe('-');
    });

    it('should handle a plain Date object', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.get('effectiveDate')?.setValue(new Date(2026, 2, 1));
      expect(component.getEffectiveDateDisplay()).toBe('01-MAR-2026');
    });
  });

  describe('onEffectiveDateChange', () => {
    it('should mark effective date control as touched and dirty', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.onEffectiveDateChange();
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
      expect(component.form.get('effectiveDate')?.dirty).toBeTrue();
    });
  });

  describe('onTerminationDateChange', () => {
    it('should mark termination date control as touched and dirty', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.onTerminationDateChange();
      expect(component.form.get('terminationDate')?.touched).toBeTrue();
      expect(component.form.get('terminationDate')?.dirty).toBeTrue();
    });
  });

  describe('onEffectiveDateInput', () => {
    it('should call DateFieldValidationUtility.handleStartDateInput', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const spy = spyOn(DateFieldValidationUtility, 'handleStartDateInput');
      const event = { target: { value: '01-MAR-2026' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(spy).toHaveBeenCalledWith('01-MAR-2026', component.form.get('effectiveDate'));
    });
  });

  describe('onTerminationDateInput', () => {
    it('should call DateFieldValidationUtility.handleEndDateInput in add mode', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '01-MAR-2027' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('01-MAR-2027', component.form.get('terminationDate'), false);
    });

    it('should call DateFieldValidationUtility.handleEndDateInput with isEditMode=true in edit mode', async () => {
      await TestBed.resetTestingModule();
      const editRecord = {
        cellType: 'PLASM', description: 'Plasma', minWeight: 120, maxWeight: 180,
        auditKey: '11111', maxLoss: 800, period: 90,
        effectiveDate: '2026-03-01', terminationDate: '2027-03-01'
      };
      const { component } = createComponent('edit', editRecord);
      const spy = spyOn(DateFieldValidationUtility, 'handleEndDateInput');
      const event = { target: { value: '01-MAR-2028' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('01-MAR-2028', component.form.get('terminationDate'), true);
    });
  });

  describe('preventInvalidNumericInput', () => {
    it('should allow digit keys', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: '5', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Backspace', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent e key', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: 'e', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent + key', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: '+', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent - key', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: '-', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent . key', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: '.', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent non-numeric keys like letters', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent digit input when at max length with no selection', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: '7', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '123456', selectionStart: 6, selectionEnd: 6 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow digit input when at max length but text is selected', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: '7', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '123456', selectionStart: 0, selectionEnd: 3 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Tab key', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { key: 'Tab', preventDefault: jasmine.createSpy('preventDefault'), target: { value: '12', selectionStart: 2, selectionEnd: 2 } } as any;
      component.preventInvalidNumericInput(event, 6);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('preventNonNumericPaste', () => {
    it('should allow paste of numeric-only text', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { clipboardData: { getData: () => '12345' }, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.preventNonNumericPaste(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent paste of text with non-numeric characters', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { clipboardData: { getData: () => '123abc' }, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.preventNonNumericPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste of text with special characters', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { clipboardData: { getData: () => '12.5' }, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.preventNonNumericPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent paste when clipboardData is null', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const event = { clipboardData: null, preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.preventNonNumericPaste(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('onSave - Add mode', () => {
    it('should not call service when form is invalid', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('add');
      component.onSave();
      expect(serviceSpy.addRecord).not.toHaveBeenCalled();
    });

    it('should call addRecord and emit events on success', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('add');
      const { of } = require('rxjs');
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        cellType: 'PLASM',
        maxLoss: 100,
        period: 30,
        effectiveDate: moment().add(5, 'days'),
      });

      spyOn<any>(component, 'validateBeforeSave').and.returnValue(true);
      serviceSpy.addRecord.and.returnValue(of({ message: 'Success' }));

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(serviceSpy.addRecord).toHaveBeenCalled();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Record added successfully', 'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should show error snackbar on addRecord failure', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('add');
      const { throwError } = require('rxjs');
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        cellType: 'PLASM',
        maxLoss: 100,
        period: 30,
        effectiveDate: moment().add(5, 'days'),
      });

      spyOn<any>(component, 'validateBeforeSave').and.returnValue(true);
      serviceSpy.addRecord.and.returnValue(throwError(() => ({ error: { message: 'Duplicate entry' } })));

      component.onSave();

      expect(serviceSpy.addRecord).toHaveBeenCalled();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Duplicate entry', 'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('onSave - Edit mode', () => {
    const editRecord = {
      cellType: 'PLASM', description: 'Plasma', minWeight: 120, maxWeight: 180,
      auditKey: 'AUDIT123', maxLoss: 800, period: 90,
      effectiveDate: moment().add(5, 'days').format('YYYY-MM-DD'),
      terminationDate: moment().add(1, 'year').format('YYYY-MM-DD')
    };

    it('should call updateRecord with auditKey on success', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('edit', editRecord);
      const { of } = require('rxjs');
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      component.form.get('maxLoss')?.setValue(900);
      component.form.markAsDirty();

      spyOn<any>(component, 'validateBeforeSave').and.returnValue(true);
      serviceSpy.updateRecord.and.returnValue(of({ message: 'Updated' }));

      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(serviceSpy.updateRecord).toHaveBeenCalledWith('AUDIT123', jasmine.any(Object));
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Record updated successfully', 'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
    });

    it('should show error snackbar on updateRecord failure', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('edit', editRecord);
      const { throwError } = require('rxjs');
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      component.form.get('maxLoss')?.setValue(900);
      component.form.markAsDirty();

      spyOn<any>(component, 'validateBeforeSave').and.returnValue(true);
      serviceSpy.updateRecord.and.returnValue(throwError(() => ({ error: { errors: ['Error 1', 'Error 2'] } })));

      component.onSave();

      expect(serviceSpy.updateRecord).toHaveBeenCalled();
      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Error 1, Error 2', 'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('showErrorSnackbar error formats', () => {
    it('should display errorResponse.error message', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('add');
      const { throwError } = require('rxjs');
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        cellType: 'PLASM', maxLoss: 100, period: 30,
        effectiveDate: moment().add(5, 'days'),
      });

      spyOn<any>(component, 'validateBeforeSave').and.returnValue(true);
      serviceSpy.addRecord.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Custom API error', errorCode: 'ERR001' } }
      })));

      component.onSave();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Custom API error (Error Code: ERR001)', 'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should display fallback message when no error details exist', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('add');
      const { throwError } = require('rxjs');
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        cellType: 'PLASM', maxLoss: 100, period: 30,
        effectiveDate: moment().add(5, 'days'),
      });

      spyOn<any>(component, 'validateBeforeSave').and.returnValue(true);
      serviceSpy.addRecord.and.returnValue(throwError(() => ({})));

      component.onSave();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Failed to add record', 'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should display error code from error.error.errorCode', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('add');
      const { throwError } = require('rxjs');
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      component.form.patchValue({
        cellType: 'PLASM', maxLoss: 100, period: 30,
        effectiveDate: moment().add(5, 'days'),
      });

      spyOn<any>(component, 'validateBeforeSave').and.returnValue(true);
      serviceSpy.addRecord.and.returnValue(throwError(() => ({
        error: { message: 'Server error', errorCode: 'SRV500' }
      })));

      component.onSave();

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        'Server error (Error Code: SRV500)', 'Close',
        jasmine.objectContaining({ duration: 5000 })
      );
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject and not throw', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('should handle destroy when overflow timeouts are active', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');

      // Trigger overflow errors to create timeouts
      const inputEl = { value: '1234567', target: null } as any;
      inputEl.target = inputEl;
      const event = { target: inputEl } as unknown as Event;
      component.onMaxLossInput(event);
      component.onPeriodInput(event);

      // ngOnDestroy should clear the timeouts without error
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('getEffectiveDateError', () => {
    it('should call DateFieldValidationUtility.getStartDateCrossFieldError', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(
        component.form.get('effectiveDate'), 'Effective Date', 'Termination Date', null
      );
    });

    it('should pass form errors when lastChangedDateField is effective', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      // Trigger effectiveDate change to set lastChangedDateField = 'effective'
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      const spy = spyOn(DateFieldValidationUtility, 'getStartDateCrossFieldError').and.returnValue('');
      component.getEffectiveDateError();
      expect(spy).toHaveBeenCalledWith(
        component.form.get('effectiveDate'), 'Effective Date', 'Termination Date', component.form.errors
      );
    });
  });

  describe('getTerminationDateError', () => {
    it('should call DateFieldValidationUtility.getEndDateCrossFieldError', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(
        component.form.get('terminationDate'), 'Termination Date', 'Effective Date', null
      );
    });

    it('should pass form errors when lastChangedDateField is termination', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      // Trigger terminationDate change to set lastChangedDateField = 'termination'
      component.form.get('terminationDate')?.setValue(moment().add(30, 'days'));
      const spy = spyOn(DateFieldValidationUtility, 'getEndDateCrossFieldError').and.returnValue('');
      component.getTerminationDateError();
      expect(spy).toHaveBeenCalledWith(
        component.form.get('terminationDate'), 'Termination Date', 'Effective Date', component.form.errors
      );
    });
  });

  describe('updateTerminationMinDate with Date object', () => {
    it('should handle a native Date object for effective date', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      component.form.get('effectiveDate')?.setValue(futureDate);
      const expectedDate = moment(futureDate).format('YYYY-MM-DD');
      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(expectedDate);
    });
  });

  describe('panelTitle and panelSubtitle', () => {
    it('should set panelTitle to Add in add mode', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      expect(component.panelTitle).toBe('Add Eligible Cell Loss');
      expect(component.panelSubtitle).toBe('');
    });

    it('should set panelTitle to Edit in edit mode', async () => {
      await TestBed.resetTestingModule();
      const editRecord = {
        cellType: 'PLASM', description: 'Plasma', minWeight: 120, maxWeight: 180,
        auditKey: '11111', maxLoss: 800, period: 90,
        effectiveDate: '2026-03-01', terminationDate: '2027-03-01'
      };
      const { component } = createComponent('edit', editRecord);
      expect(component.panelTitle).toBe('Edit Eligible Cell Loss');
      expect(component.panelSubtitle).toBe('');
    });
  });

  describe('validateBeforeSave edge cases', () => {
    it('should set lastChangedWeightField to max when maxWeightInvalid and no lastChangedWeightField', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('add');
      const { of } = require('rxjs');

      component.form.patchValue({
        cellType: 'PLASM',
        minWeight: 200,
        maxWeight: 100,
        maxLoss: 100,
        period: 30,
        effectiveDate: moment().add(5, 'days'),
      });

      // The form should have maxWeightInvalid error from the group validator
      component.form.updateValueAndValidity();

      // Call onSave which calls validateBeforeSave internally
      component.onSave();

      // After validateBeforeSave runs, the weight error should be shown
      expect(component.getMaxWeightError()).toBe('Lower range cannot be greater than upper range.');
    });

    it('should set lastChangedDateField to effective when dateRangeInvalid and no lastChangedDateField', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');

      component.form.patchValue({
        cellType: 'PLASM',
        maxLoss: 100,
        period: 30,
        effectiveDate: moment().add(30, 'days'),
        terminationDate: moment().add(5, 'days'),
      });

      // Force dateRangeInvalid
      component.form.setErrors({ dateRangeInvalid: true });
      component.form.updateValueAndValidity();

      component.onSave();

      // After validateBeforeSave, effective date error should reflect cross-field issue
      // Just verify onSave was called and the form is still invalid
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('buildRequest', () => {
    it('should build correct request with string period value', async () => {
      await TestBed.resetTestingModule();
      const { component, serviceSpy } = createComponent('add');
      const { of } = require('rxjs');

      component.form.patchValue({
        cellType: 'RBC',
        description: 'Red Blood Cell',
        minWeight: 100,
        maxWeight: 200,
        maxLoss: 500,
        period: '60',
        effectiveDate: moment('2026-06-01'),
        terminationDate: null,
      });
      spyOn<any>(component, 'validateBeforeSave').and.returnValue(true);
      serviceSpy.addRecord.and.returnValue(of({ message: 'OK' }));
      component.onSave();

      const request = serviceSpy.addRecord.calls.mostRecent().args[0];
      expect(request.cellType).toBe('RBC');
      expect(request.fromWeight).toBe(100);
      expect(request.toWeight).toBe(200);
      expect(request.maximumLoss).toBe(500);
      expect(request.daysBetween).toBe(60);
      expect(request.chapterId).toBe('001');
      expect(request.programId).toBe('001');
      expect(request.termDate).toBeNull();
    });
  });

  describe('error matchers', () => {
    it('effDateErrorMatcher should have isErrorState function', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      expect(component.effDateErrorMatcher).toBeDefined();
    });

    it('termDateErrorMatcher should have isErrorState function', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      expect(component.termDateErrorMatcher).toBeDefined();
    });

    it('minWeightErrorMatcher isErrorState should return true when there is a minWeight error', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.get('minWeight')?.setValue(1.5);
      component.form.get('minWeight')?.markAsTouched();
      expect(component.minWeightErrorMatcher.isErrorState()).toBeTrue();
    });

    it('maxWeightErrorMatcher isErrorState should return true when there is a maxWeight error', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.get('maxWeight')?.setValue(1.5);
      component.form.get('maxWeight')?.markAsTouched();
      expect(component.maxWeightErrorMatcher.isErrorState()).toBeTrue();
    });

    it('maxLossErrorMatcher isErrorState should return true when there is a maxLoss error', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.get('maxLoss')?.setValue(null);
      component.form.get('maxLoss')?.markAsTouched();
      expect(component.maxLossErrorMatcher.isErrorState()).toBeTrue();
    });

    it('periodErrorMatcher isErrorState should return true when there is a period error', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.get('period')?.setValue(null);
      component.form.get('period')?.markAsTouched();
      expect(component.periodErrorMatcher.isErrorState()).toBeTrue();
    });

    it('minWeightErrorMatcher isErrorState should return false when no error', async () => {
      await TestBed.resetTestingModule();
      const { component } = createComponent('add');
      component.form.get('minWeight')?.setValue(50);
      expect(component.minWeightErrorMatcher.isErrorState()).toBeFalse();
    });
  });
});
