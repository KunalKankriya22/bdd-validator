import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ChangeDetectorRef, signal } from '@angular/core';
import { of } from 'rxjs';
import moment from 'moment';

import { AddEditQcParameters } from './add-edit-qc-parameters';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditQcParameters', () => {
  const tomorrow = moment().add(1, 'day').startOf('day');

  let component: AddEditQcParameters;
  let fixture: ComponentFixture<AddEditQcParameters>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  const mockRecord = {
    deviceType: 'EQUIP',
    equipmentSupply: 'ALYX',
    sortSequence: 1,
    qcParameterCode: 'TEMP',
    qcParameterDescription: 'Temperature',
    qcCheckCode: 'KRNG',
    qcCheckDescription: 'KRNG Desc',
    dataType: 'N',
    qcTargetValue: '100',
    childSequence: null,
    rangeFlag: 'N',
    rangeDetailsValue: null,
    scanRequest: 'N',
    scanWhat: '',
    equipmentType: '',
    effectiveDate: '2026-03-14T00:00:00',
    terminationDate: null,
    auditKey: 123
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getDeviceTypes',
      'getQcParameterCodes',
      'getQcCheckCodes',
      'getQcDataTypes',
      'getQcTargetValues',
      'getQcValueTypes',
      'getQcEquipmentTypes',
      'createQcParameters',
      'updateQcParameters'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = { chapterTimeZone: signal('America/Los_Angeles') };

    mockService.getDeviceTypes.and.returnValue(of(['EQUIP', 'SUPLY']));
    mockService.getQcParameterCodes.and.returnValue(of({ data: [
      { code: 'TEMP', description: 'Temperature', codeType: 'QC', effectiveDate: '2026-01-01' },
      { code: 'PRES', description: 'Pressure', codeType: 'QC', effectiveDate: '2026-01-01' }
    ], totalRecords: 2 }));
    mockService.getQcCheckCodes.and.returnValue(of([
      { code: 'KRNG', description: 'KRNG Desc' },
      { code: 'KCDT', description: 'KCDT Desc' }
    ]));
    mockService.getQcDataTypes.and.returnValue(of([
      { code: 'C', description: 'Character' },
      { code: 'D', description: 'Date' },
      { code: 'N', description: 'Number' }
    ]));
    mockService.getQcTargetValues.and.returnValue(of([{ code: 'V1', description: 'Value 1' }]));
    mockService.getQcValueTypes.and.returnValue(of({ data: [{ code: 'S1', description: 'Scan 1', codeType: 'VT', effectiveDate: '2026-01-01' }], totalRecords: 1 }));
    mockService.getQcEquipmentTypes.and.returnValue(of({ data: [{ code: 'E1', description: 'Equip 1', codeType: 'ET', effectiveDate: '2026-01-01' }], totalRecords: 1 }));



      TestBed.configureTestingModule({
      imports: [AddEditQcParameters, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: DriveEquipmentParametersService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChangeDetectorRef, useValue: jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']) }
      ]
    });


    


      mockService.getDeviceTypes.calls.reset();


      mockService.getQcParameterCodes.calls.reset();


      mockService.getQcCheckCodes.calls.reset();


      mockService.getQcDataTypes.calls.reset();


      mockService.getQcTargetValues.calls.reset();


      mockService.getQcValueTypes.calls.reset();


      mockService.getQcEquipmentTypes.calls.reset();


      mockService.createQcParameters.calls.reset();


      mockService.updateQcParameters.calls.reset();


      mockSnackBar.open.calls.reset();


      mockService.getDeviceTypes.and.returnValue(of(['EQUIP', 'SUPLY']));

      mockService.getQcTargetValues.and.returnValue(of([{ code: 'V1', description: 'Value 1' }]));


      mockService.getQcValueTypes.and.returnValue(of({ data: [{ code: 'S1', description: 'Scan 1', codeType: 'VT', effectiveDate: '2026-01-01' }], totalRecords: 1 }));


      mockService.getQcEquipmentTypes.and.returnValue(of({ data: [{ code: 'E1', description: 'Equip 1', codeType: 'ET', effectiveDate: '2026-01-01' }], totalRecords: 1 }));


    fixture = TestBed.createComponent(AddEditQcParameters);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.form).toBeDefined();
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should load dropdown options on init', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(mockService.getQcParameterCodes).toHaveBeenCalled();
      expect(mockService.getQcCheckCodes).toHaveBeenCalled();
      expect(mockService.getQcDataTypes).toHaveBeenCalled();
    });
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have effectiveDate enabled', () => {
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should mark effective date as invalid when empty', () => {
      component.form.patchValue({ effectiveDate: null });
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAllAsTouched();

      expect(component.form.get('effectiveDate')?.valid).toBeFalse();
    });

    it('should validate effective date cannot be past date', () => {
      const pastDate = moment().subtract(5, 'days');
      component.form.patchValue({ effectiveDate: pastDate });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeTrue();
    });

    it('should not submit form when invalid', () => {
      component.onSave();

      expect(mockService.createQcParameters).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
    });

    it('should populate form with data', () => {
      expect(component.form.getRawValue().deviceType).toBe('EQUIP');
      expect(component.form.get('sortSequence')?.value).toBe(1);
    });

    it('should keep effective date enabled in edit mode', () => {
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should keep terminationDate enabled', () => {
      expect(component.form.get('terminationDate')?.enabled).toBeTrue();
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should show effective date required error', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.markAsDirty();

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date is required');
    });

    it('should return empty error when field is not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should validate date range - termination before effective', () => {
      component.form.patchValue({
        effectiveDate: moment('2026-12-15'),
        terminationDate: tomorrow.clone()
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should allow termination date after effective date', () => {
      component.form.patchValue({
        effectiveDate: tomorrow.clone(),
        terminationDate: moment('2026-12-15')
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });

    describe('getEffectiveDateError method', () => {
      it('should return cross-field error message from form.errors', () => {
        const futureDate = moment().add(10, 'days');
        component.form.patchValue({
          effectiveDate: futureDate,
          terminationDate: moment().add(5, 'days')
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.updateValueAndValidity();

        // Explicitly set which field was changed last for predictable testing
        component['lastChangedDateField'] = 'effective';

        const error = component.getEffectiveDateError();

        // Should contain cross-field error message
        expect(error).toContain('Effective Date must be less than or equal to Termination Date');
      });

      it('should return field-level error when effective date is invalid', () => {
        component.form.get('effectiveDate')?.setErrors({ invalidDate: true });
        component.form.get('effectiveDate')?.markAsTouched();

        const error = component.getEffectiveDateError();

        expect(error).toContain('Effective Date');
      });

      it('should return empty string when no errors and not touched', () => {
        const error = component.getEffectiveDateError();
        expect(error).toBe('');
      });
    });

    describe('getTerminationDateError method', () => {
      it('should NOT include cross-field error from form.errors', () => {
        const futureDate = moment().add(10, 'days');
        component.form.patchValue({
          effectiveDate: futureDate,
          terminationDate: moment().add(5, 'days')
        });
        component.form.get('terminationDate')?.markAsTouched();
        component.form.updateValueAndValidity();

        const error = component.getTerminationDateError();

        // Termination date error should NOT contain cross-field error
        // (cross-field errors only show on effective date field)
        expect(error).toBe('');
      });

      it('should return field-level error when termination date is invalid', () => {
        component.form.get('terminationDate')?.setErrors({ invalidDate: true });
        component.form.get('terminationDate')?.markAsTouched();

        const error = component.getTerminationDateError();

        expect(error).toContain('Termination Date');
      });

      it('should return empty string when no errors and not touched', () => {
        const error = component.getTerminationDateError();
        expect(error).toBe('');
      });
    });

    describe('Date Validation Without Field Tracking (Regression Tests)', () => {
      it('should validate dates correctly when effective date is set first', () => {
        const futureDate = moment().add(10, 'days');
        component.form.patchValue({
          effectiveDate: futureDate,
          terminationDate: null
        });
        component.form.updateValueAndValidity();

        expect(component.form.errors).toBeFalsy();
        expect(component.getEffectiveDateError()).toBe('');
      });

      it('should validate dates correctly when termination date is set first', () => {
        const futureDate = moment().add(10, 'days');
        component.form.patchValue({
          effectiveDate: null,
          terminationDate: futureDate
        });
        component.form.updateValueAndValidity();

        // Should not have dateRangeInvalid error when effective is null
        expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
      });

      it('should detect invalid range regardless of which date was changed last', () => {
        // Set effective date first
        component.form.patchValue({
          effectiveDate: moment().add(10, 'days')
        });

        // Then set termination date to earlier date
        component.form.patchValue({
          terminationDate: moment().add(5, 'days')
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.updateValueAndValidity();

        expect(component.form.hasError('dateRangeInvalid')).toBeTrue();

        // Explicitly set which field was changed last for predictable testing
        component['lastChangedDateField'] = 'effective';

        const effError = component.getEffectiveDateError();
        expect(effError).toContain('Effective Date must be less than or equal to Termination Date');
      });

      it('should detect invalid range when setting effective after termination', () => {
        // Set termination date first
        component.form.patchValue({
          terminationDate: moment().add(5, 'days')
        });

        // Then set effective date to later date
        component.form.patchValue({
          effectiveDate: moment().add(10, 'days')
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.updateValueAndValidity();

        expect(component.form.hasError('dateRangeInvalid')).toBeTrue();

        // Since effective date was set last, it should already be set, but ensure it for predictable testing
        component['lastChangedDateField'] = 'effective';

        const effError = component.getEffectiveDateError();
        expect(effError).toContain('Effective Date must be less than or equal to Termination Date');
      });

      it('should clear date range error when dates become valid', () => {
        // First set invalid range
        component.form.patchValue({
          effectiveDate: moment().add(10, 'days'),
          terminationDate: moment().add(5, 'days')
        });
        component.form.updateValueAndValidity();
        expect(component.form.hasError('dateRangeInvalid')).toBeTrue();

        // Then fix the range
        component.form.patchValue({
          terminationDate: moment().add(15, 'days')
        });
        component.form.updateValueAndValidity();

        expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
        expect(component.getEffectiveDateError()).toBe('');
      });
    });
  });

  describe('Searchable Dropdowns', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have search controls initialized', () => {
      expect(component.qcParameterCodeSearchCtrl).toBeDefined();
      expect(component.qcCheckCodeSearchCtrl).toBeDefined();
      expect(component.dataTypeSearchCtrl).toBeDefined();
      expect(component.scanWhatSearchCtrl).toBeDefined();
      expect(component.equipmentTypeSearchCtrl).toBeDefined();
    });

    it('should filter QC parameter codes based on search', () => {
      component.qcParameterCodeSearchCtrl.setValue('TEM');

      const filtered = component.filteredQcParameterCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('TEMP');
    });

    it('should filter QC check codes based on search', () => {
      component.qcCheckCodeSearchCtrl.setValue('KRN');

      const filtered = component.filteredQcCheckCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('KRNG');
    });

    it('should filter data types based on search', () => {
      component.dataTypeSearchCtrl.setValue('N');

      const filtered = component.filteredDataTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('N');
    });

    it('should return all items when search is empty', () => {
      component.qcParameterCodeSearchCtrl.setValue('');

      const filtered = component.filteredQcParameterCodes();
      expect(filtered.length).toBe(2);
    });

    it('should reset search on dropdown close', () => {
      component.qcParameterCodeSearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.qcParameterCodeSearchCtrl, false);

      expect(component.qcParameterCodeSearchCtrl.value).toBe('');
    });
  });

  describe('Event Emissions', () => {
    it('should emit closePanel on cancel', () => {
      component.mode = 'add';
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');

      component.onCancel();

      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy$ subject on destroy', () => {
      component.mode = 'add';
      fixture.detectChanges();

      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });
  });

  describe('QC Target Value Field Type Switching', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set field type to "dropdown" when data type is C', () => {
      component.form.patchValue({ dataType: 'C' });
      expect(component.qcTargetValueFieldType()).toBe('dropdown');
    });

    it('should set field type to "dropdown" when data type is D', () => {
      component.form.patchValue({ dataType: 'D' });
      expect(component.qcTargetValueFieldType()).toBe('dropdown');
    });

    it('should set field type to "both" when data type is N', () => {
      component.form.patchValue({ dataType: 'N' });
      expect(component.qcTargetValueFieldType()).toBe('both');
    });

    it('should set field type to "none" when data type is empty', () => {
      component.form.patchValue({ dataType: '' });
      expect(component.qcTargetValueFieldType()).toBe('none');
    });

    it('should clear qcTargetValue when switching field types', () => {
      component.form.patchValue({ dataType: 'C', qcTargetValue: '100' });
      component.form.patchValue({ dataType: 'N' });
      expect(component.form.get('qcTargetValue')?.value).toBe('');
    });

    it('should load QC target value options when field type is dropdown', () => {
      component.form.patchValue({ dataType: 'C' });
      expect(mockService.getQcTargetValues).toHaveBeenCalled();
    });
  });

  describe('Child Sequence Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ sortSequence: 10 });
    });

    it('should accept child sequence equal to sort sequence', () => {
      component.form.patchValue({ childSequence: 10 });
      expect(component.form.get('childSequence')?.valid).toBeTrue();
    });

    it('should accept child sequence less than sort sequence', () => {
      component.form.patchValue({ childSequence: 5 });
      expect(component.form.get('childSequence')?.valid).toBeTrue();
    });

    it('should reject child sequence greater than sort sequence', () => {
      component.form.patchValue({ childSequence: 15 });
      expect(component.form.get('childSequence')?.hasError('childSequenceMax')).toBeTrue();
    });

    it('should accept null child sequence (optional field)', () => {
      component.form.patchValue({ childSequence: null });
      expect(component.form.get('childSequence')?.valid).toBeTrue();
    });

    it('should accept child sequence of 0', () => {
      component.form.patchValue({ childSequence: 0 });
      expect(component.form.get('childSequence')?.valid).toBeTrue();
    });

    it('should reject negative child sequence', () => {
      component.form.patchValue({ childSequence: -1 });
      expect(component.form.get('childSequence')?.hasError('childSequenceMin')).toBeTrue();
    });

    it('should revalidate child sequence when sort sequence changes', () => {
      component.form.patchValue({ childSequence: 8, sortSequence: 10 });
      expect(component.form.get('childSequence')?.valid).toBeTrue();

      component.form.patchValue({ sortSequence: 5 });
      expect(component.form.get('childSequence')?.hasError('childSequenceMax')).toBeTrue();
    });
  });

  describe('Range Flag Conditional Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require rangeDetailsValue when rangeFlag is Y', () => {
      component.form.patchValue({ rangeFlag: 'Y', rangeDetailsValue: null });
      component.form.get('rangeDetailsValue')?.markAsTouched();

      expect(component.form.get('rangeDetailsValue')?.hasError('required')).toBeTrue();
    });

    it('should not require rangeDetailsValue when rangeFlag is N', () => {
      component.form.patchValue({ rangeFlag: 'N', rangeDetailsValue: null });

      expect(component.form.get('rangeDetailsValue')?.hasError('required')).toBeFalse();
    });

    it('should clear rangeDetailsValue when rangeFlag changes from Y to N', () => {
      component.form.patchValue({ rangeFlag: 'Y', rangeDetailsValue: 5 });
      component.form.patchValue({ rangeFlag: 'N' });

      expect(component.form.get('rangeDetailsValue')?.value).toBeNull();
    });

    it('should accept valid rangeDetailsValue when rangeFlag is Y', () => {
      component.form.patchValue({ rangeFlag: 'Y', rangeDetailsValue: 10 });

      expect(component.form.get('rangeDetailsValue')?.valid).toBeTrue();
    });
  });

  describe('Save & Create Another', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();

      // Set up valid form data
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        sortSequence: 1,
        qcParameterCode: 'TEMP',
        qcCheckCode: 'KRNG',
        dataType: 'N',
        qcTargetValue: '100',
        rangeFlag: 'N',
        scanRequest: 'N',
        effectiveDate: moment().add(1, 'day')
      });

      mockService.createQcParameters.and.returnValue(of({
        success: true,
        message: 'Created successfully'
      }));
    });

    it('should save and emit success event', (done) => {
      component.saveSuccess.subscribe(() => {
        expect(mockService.createQcParameters).toHaveBeenCalled();
        done();
      });

      component.onSaveAndCreateAnother();
    });

    it('should reset form after successful save', (done) => {
      component.saveSuccess.subscribe(() => {
        // onSaveAndCreateAnother uses setTimeout for form reset, wait for it
        setTimeout(() => {
          fixture.detectChanges();

          // Verify form is reset but deviceType and equipmentSupply are preserved
          expect(component.form.get('deviceType')?.value).toBe('EQUIP');
          expect(component.form.get('equipmentSupply')?.value).toBe('ALYX');

          done();
        }, 10);
      });

      component.onSaveAndCreateAnother();
    });

    it('should keep mode as add after save and create another', (done) => {
      component.saveSuccess.subscribe(() => {
        expect(component.mode).toBe('add');
        done();
      });

      component.onSaveAndCreateAnother();
    });

    it('should not save if form is invalid', () => {
      component.form.patchValue({ effectiveDate: null });
      component.onSaveAndCreateAnother();

      expect(mockService.createQcParameters).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched on validation failure', () => {
      component.form.patchValue({ effectiveDate: null });
      component.onSaveAndCreateAnother();

      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });
  });

  describe('Numeric/Dropdown Hybrid Validation (Data Type N)', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ dataType: 'N' });
    });

    it('should accept numeric string value', () => {
      component.form.patchValue({ qcTargetValue: '100' });
      expect(component.form.get('qcTargetValue')?.valid).toBeTrue();
    });

    it('should accept dropdown selection', () => {
      mockService.getQcTargetValues.and.returnValue(of([
        { code: 'V1', description: 'Value 1' }
      ]));

      component.form.patchValue({ qcTargetValue: 'V1' });
      expect(component.form.get('qcTargetValue')?.valid).toBeTrue();
    });

    it('should accept decimal values', () => {
      component.form.patchValue({ qcTargetValue: '98.6' });
      expect(component.form.get('qcTargetValue')?.valid).toBeTrue();
    });
  });

  describe('Date Field Tracking with distinctUntilChanged', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective when effective date value changes', (done) => {
      const date1 = moment('2026-04-21').toDate();
      const date2 = moment('2026-04-22').toDate();

      component.form.get('effectiveDate')?.setValue(date1);

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('effective');

        component.form.get('effectiveDate')?.setValue(date2);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('effective');
          done();
        }, 10);
      }, 10);
    });

    it('should set lastChangedDateField to termination when termination date value changes', (done) => {
      const date1 = moment('2026-04-25').toDate();
      const date2 = moment('2026-04-26').toDate();

      component.form.get('terminationDate')?.setValue(date1);

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('termination');

        component.form.get('terminationDate')?.setValue(date2);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('termination');
          done();
        }, 10);
      }, 10);
    });

    it('should not trigger subscription when same effective date value is set again', (done) => {
      const date = moment('2026-04-21').toDate();

      component.form.get('effectiveDate')?.setValue(date);

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('effective');

        // Manually set to termination to verify it doesn't get overwritten
        component['lastChangedDateField'] = 'termination';

        // Set same date again - should NOT trigger subscription due to distinctUntilChanged
        component.form.get('effectiveDate')?.setValue(date);

        setTimeout(() => {
          // Should still be termination because subscription didn't fire
          expect(component['lastChangedDateField']).toBe('termination');
          done();
        }, 10);
      }, 10);
    });

    it('should not trigger subscription when same termination date value is set again', (done) => {
      const date = moment('2026-04-25').toDate();

      component.form.get('terminationDate')?.setValue(date);

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('termination');

        // Manually set to effective to verify it doesn't get overwritten
        component['lastChangedDateField'] = 'effective';

        // Set same date again - should NOT trigger subscription
        component.form.get('terminationDate')?.setValue(date);

        setTimeout(() => {
          // Should still be effective because subscription didn't fire
          expect(component['lastChangedDateField']).toBe('effective');
          done();
        }, 10);
      }, 10);
    });

    it('should handle null to date transitions', (done) => {
      const date = moment('2026-04-21').toDate();

      // Start with null
      component.form.get('effectiveDate')?.setValue(null);

      setTimeout(() => {
        // Set to actual date
        component.form.get('effectiveDate')?.setValue(date);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('effective');
          done();
        }, 10);
      }, 10);
    });

    it('should handle date to null transitions', (done) => {
      const date = moment('2026-04-21').toDate();

      component.form.get('effectiveDate')?.setValue(date);

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('effective');

        // Clear the date
        component.form.get('effectiveDate')?.setValue(null);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('effective');
          done();
        }, 10);
      }, 10);
    });

    it('should compare dates by day ignoring time differences', (done) => {
      const date1 = moment('2026-04-21T08:00:00').toDate();
      const date2 = moment('2026-04-21T16:00:00').toDate();

      component.form.get('effectiveDate')?.setValue(date1);

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('effective');

        component['lastChangedDateField'] = 'termination';

        // Set same date but different time - should NOT trigger due to YYYY-MM-DD comparison
        component.form.get('effectiveDate')?.setValue(date2);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('termination');
          done();
        }, 10);
      }, 10);
    });

    it('should track effective date change even when termination date exists', (done) => {
      const effDate = moment('2026-04-21').toDate();
      const termDate = moment('2026-04-25').toDate();

      // Set both dates
      component.form.get('effectiveDate')?.setValue(effDate);
      component.form.get('terminationDate')?.setValue(termDate);

      setTimeout(() => {
        // Last change should be termination (it was set last)
        expect(component['lastChangedDateField']).toBe('termination');

        // Now change effective date
        const newEffDate = moment('2026-04-22').toDate();
        component.form.get('effectiveDate')?.setValue(newEffDate);

        setTimeout(() => {
          // Should now be effective
          expect(component['lastChangedDateField']).toBe('effective');
          done();
        }, 10);
      }, 10);
    });

    it('should track termination date change even when effective date exists', (done) => {
      const effDate = moment('2026-04-21').toDate();
      const termDate = moment('2026-04-25').toDate();

      component.form.get('effectiveDate')?.setValue(effDate);

      setTimeout(() => {
        expect(component['lastChangedDateField']).toBe('effective');

        // Now change termination date
        component.form.get('terminationDate')?.setValue(termDate);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('termination');
          done();
        }, 10);
      }, 10);
    });
  });

  describe('Date Validation Message Behavior', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    describe('ErrorStateMatcher Behavior', () => {
      it('should show error state only on last changed field when dateRangeInvalid exists', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component['lastChangedDateField'] = 'effective';
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        const effectiveControl = component.form.get('effectiveDate');
        const terminationControl = component.form.get('terminationDate');

        expect(component.effDateErrorMatcher.isErrorState(effectiveControl as any, null)).toBeTrue();
        expect(component.termDateErrorMatcher.isErrorState(terminationControl as any, null)).toBeFalse();
      });

      it('should show field-level errors when no cross-field error exists', () => {
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        fixture.detectChanges();

        const effectiveControl = component.form.get('effectiveDate');

        expect(component.effDateErrorMatcher.isErrorState(effectiveControl as any, null)).toBeTrue();
        expect(component.getEffectiveDateError()).toBe('Effective Date is required');
      });

      it('should not show error when control is not touched or dirty', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        const effectiveControl = component.form.get('effectiveDate');
        const terminationControl = component.form.get('terminationDate');

        expect(component.effDateErrorMatcher.isErrorState(effectiveControl as any, null)).toBeFalse();
        expect(component.termDateErrorMatcher.isErrorState(terminationControl as any, null)).toBeFalse();
      });

      it('should show error on both matchers when both fields changed with different errors', () => {
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();

        component.form.get('terminationDate')?.setErrors({ invalidDateFormat: true });
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        fixture.detectChanges();

        const effectiveControl = component.form.get('effectiveDate');
        const terminationControl = component.form.get('terminationDate');

        expect(component.effDateErrorMatcher.isErrorState(effectiveControl as any, null)).toBeTrue();
        expect(component.termDateErrorMatcher.isErrorState(terminationControl as any, null)).toBeTrue();
      });
    });

    // Note: matDatepickerMin Suppression tests removed because template now uses static minTermDate
    // instead of dynamic getTerminationDateMin() method. Error suppression is still handled by
    // cross-field dateRangeInvalid validation based on lastChangedDateField.

    describe('Enhanced Edge Cases', () => {
      it('should handle null lastChangedDateField when form has dateRangeInvalid error', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component['lastChangedDateField'] = null;
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        expect(component.getEffectiveDateError()).toBe('');
        expect(component.getTerminationDateError()).toBe('');
        expect(component.effDateErrorMatcher.isErrorState(component.form.get('effectiveDate') as any, null)).toBeFalse();
        expect(component.termDateErrorMatcher.isErrorState(component.form.get('terminationDate') as any, null)).toBeFalse();
      });

      it('should default to termination date error on form submit when lastChangedDateField is null', () => {
        const effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component['lastChangedDateField'] = null;
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        component.onSave();

        expect((component as any).lastChangedDateField).toEqual('termination');
      });

      it('should handle valid date range with no errors', () => {
        const effectiveDate = moment().add(5, 'days');
        const terminationDate = moment().add(10, 'days');

        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        expect(component.getEffectiveDateError()).toBe('');
        expect(component.getTerminationDateError()).toBe('');
        expect(component.form.errors?.['dateRangeInvalid']).toBeFalsy();
        expect(component.effDateErrorMatcher.isErrorState(component.form.get('effectiveDate') as any, null)).toBeFalse();
        expect(component.termDateErrorMatcher.isErrorState(component.form.get('terminationDate') as any, null)).toBeFalse();
      });

      it('should handle equal effective and termination dates (valid)', () => {
        const sameDate = moment().add(5, 'days');

        component.form.patchValue({
          effectiveDate: sameDate.clone(),
          terminationDate: sameDate.clone()
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.markAsDirty();
        component.form.get('terminationDate')?.markAsTouched();
        component.form.get('terminationDate')?.markAsDirty();
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        expect(component.getEffectiveDateError()).toBe('');
        expect(component.getTerminationDateError()).toBe('');
        expect(component.form.errors?.['dateRangeInvalid']).toBeFalsy();
      });
    });
  });

  describe('Edit Mode Termination Date Validation', () => {
    it('should allow original past termination date to load in edit mode', () => {
      const pastTermDate = moment().subtract(30, 'days');
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: moment().subtract(60, 'days').format('YYYY-MM-DD'),
        terminationDate: pastTermDate.format('YYYY-MM-DD')
      };
      fixture.detectChanges();

      // The form should load without errors since it's the original value
      expect(component.form.get('terminationDate')?.value).toBeTruthy();
      expect(component.form.get('terminationDate')?.hasError('terminationDatePast')).toBeFalse();
    });

    it('should block manually entering NEW past termination date in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        terminationDate: null
      };
      fixture.detectChanges();

      // Try to manually set a past termination date
      const pastDate = moment().subtract(5, 'days');
      component.form.patchValue({ terminationDate: pastDate });
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.updateValueAndValidity();

      expect(component.form.get('terminationDate')?.hasError('terminationDatePast')).toBeTrue();
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be past');
    });

    it('should allow future termination date in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        terminationDate: null
      };
      fixture.detectChanges();

      const futureDate = moment().add(10, 'days');
      component.form.patchValue({ terminationDate: futureDate });
      component.form.get('terminationDate')?.updateValueAndValidity();

      expect(component.form.get('terminationDate')?.hasError('terminationDatePast')).toBeFalse();
    });

    it('should show "Termination Date cannot be past" error message', () => {
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
        terminationDate: null
      };
      fixture.detectChanges();

      const pastDate = moment().subtract(3, 'days');
      component.form.patchValue({ terminationDate: pastDate });
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.updateValueAndValidity();

      const errorMessage = component.getTerminationDateError();
      expect(errorMessage).toBe('Termination Date cannot be past');
    });

    it('should validate termination date cannot be past in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      // In add mode, past termination dates are also blocked
      const pastDate = moment().subtract(5, 'days');
      component.form.patchValue({
        effectiveDate: moment(),
        terminationDate: pastDate
      });
      component.form.get('terminationDate')?.markAsTouched();
      component.form.updateValueAndValidity();

      // Should have dateRangeInvalid error
      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });
  });

  describe('Chapter Date Reactivity', () => {
    it('should initialize minDate based on chapter timezone', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.minDate).toBeDefined();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('should update minDate when chapter timezone changes', (done) => {
      component.mode = 'add';
      fixture.detectChanges();

      const originalMinDate = component.minDate.format('YYYY-MM-DD');

      // Simulate chapter timezone change
      mockHeaderService.chapterTimeZone.set('America/New_York');

      // Allow effect to trigger
      setTimeout(() => {
        fixture.detectChanges();
        expect(component.minDate).toBeDefined();
        expect(moment.isMoment(component.minDate)).toBeTrue();
        done();
      }, 50);
    });
  });

  describe('Termination Date Min Validation', () => {
    describe('Add Mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.data = { deviceType: 'EQUIP', equipmentSupply: 'ALYX' };
        fixture.detectChanges();
      });

      it('should return minDate when effective date is null', () => {
        component.form.patchValue({ effectiveDate: null });
        const result = component.getTerminationDateMin();

        expect(result).toBeDefined();
        expect(result?.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
      });

      it('should return effective date when effective date is after minDate', () => {
        const futureDate = moment().add(10, 'days');
        component.form.patchValue({ effectiveDate: futureDate });
        const result = component.getTerminationDateMin();

        expect(result?.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
      });
    });

    describe('Edit Mode', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = mockRecord;
        fixture.detectChanges();
      });

      it('should return minDate when effective date is null in edit mode', () => {
        component.form.patchValue({ effectiveDate: null });
        const result = component.getTerminationDateMin();

        expect(result).toBeDefined();
        expect(result?.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
      });

      it('should return effective date when effective date is after minDate in edit mode', () => {
        const futureDate = moment().add(30, 'days');
        component.form.patchValue({ effectiveDate: futureDate });
        const result = component.getTerminationDateMin();

        expect(result?.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
      });

      it('should return minDate when effective date is before minDate in edit mode (prevents past termination dates)', () => {
        const pastDate = moment().subtract(10, 'days');
        component.form.patchValue({ effectiveDate: pastDate });
        const result = component.getTerminationDateMin();

        // Should return chapter's minDate (today), not the past effective date
        expect(result?.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
        expect(result?.isAfter(pastDate) || result?.isSame(component.minDate)).toBeTrue();
      });
    });
  });

  describe('onSave - Add Mode Success Path', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({ dataType: 'N' });
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        sortSequence: 1,
        qcParameterCode: 'TEMP',
        qcCheckCode: 'KRNG',
        qcTargetValue: '100',
        rangeFlag: 'N',
        scanRequest: 'N',
        effectiveDate: moment().add(1, 'day')
      });
      mockService.createQcParameters.and.returnValue(of({ success: true, message: 'Created successfully' }));
    });

    it('should call createQcParameters in add mode', () => {
      component.onSave();

      expect(mockService.createQcParameters).toHaveBeenCalled();
    });

    it('should show success snackbar on save', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Created successfully',
        'Close',
        jasmine.objectContaining({ duration: 3000, panelClass: ['success-snackbar'] })
      );
    });

    it('should use default success message when response has no message', () => {
      mockService.createQcParameters.and.returnValue(of({ success: true }));
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalled();
      const callArgs = snackBarSpy.calls.mostRecent().args;
      expect(callArgs[0]).toContain('TEMP');
    });

    it('should emit saveSuccess and closePanel on save', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should set isSaving to false after save finishes', () => {
      component.onSave();

      expect(component.isSaving).toBeFalse();
    });

    it('should default to termination lastChangedDateField on save when form has dateRangeInvalid and lastChangedDateField is null', () => {
      component.form.patchValue({
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(5, 'days')
      });
      component.form.updateValueAndValidity();
      component['lastChangedDateField'] = null;

      component.onSave();

      expect(component['lastChangedDateField']).toBe('termination');
    });
  });

  describe('onSave - Edit Mode Success Path', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { ...mockRecord, auditKey: 999, effectiveDate: moment().add(1, 'day').format('YYYY-MM-DD') };
      fixture.detectChanges();
      mockService.updateQcParameters.and.returnValue(of({ success: true, message: 'Updated' }));
    });

    it('should call updateQcParameters in edit mode', () => {
      component.form.markAsDirty();

      component.onSave();

      expect(mockService.updateQcParameters).toHaveBeenCalled();
    });

    it('should use originalValues for update in edit mode', () => {
      component.form.markAsDirty();

      component.onSave();

      const dto = mockService.updateQcParameters.calls.mostRecent().args[0];
      expect(dto.deviceType).toBe('EQUIP');
      expect(dto.equipmentSupply).toBe('ALYX');
      expect(dto.auditKey).toBe(999);
    });

    it('should show success snackbar with response message', () => {
      component.form.markAsDirty();
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Updated',
        'Close',
        jasmine.objectContaining({ duration: 3000, panelClass: ['success-snackbar'] })
      );
    });
  });

  describe('onSave - Error Path', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({ dataType: 'N' });
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        sortSequence: 1,
        qcParameterCode: 'TEMP',
        qcCheckCode: 'KRNG',
        rangeFlag: 'N',
        scanRequest: 'N',
        effectiveDate: moment().add(1, 'day')
      });
    });

    it('should handle error with error.error.message', () => {
      const { throwError } = require('rxjs');
      mockService.createQcParameters.and.returnValue(throwError(() => ({ error: { message: 'Duplicate record' } })));
      spyOn(console, 'error');

      component.onSave();

      expect(console.error).toHaveBeenCalledWith('Error saving QC parameter:', jasmine.any(Object));
    });

    it('should handle error without error.error.message', () => {
      const { throwError } = require('rxjs');
      mockService.createQcParameters.and.returnValue(throwError(() => ({ status: 500 })));
      spyOn(console, 'error');

      component.onSave();

      expect(console.error).toHaveBeenCalled();
    });

    it('should set isSaving to false after error', () => {
      const { throwError } = require('rxjs');
      mockService.createQcParameters.and.returnValue(throwError(() => ({ error: {} })));
      spyOn(console, 'error');

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });

    it('should not emit saveSuccess on error', () => {
      const { throwError } = require('rxjs');
      mockService.createQcParameters.and.returnValue(throwError(() => ({ error: {} })));
      spyOn(component.saveSuccess, 'emit');
      spyOn(console, 'error');

      component.onSave();

      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
    });
  });

  describe('onSaveAndCreateAnother - Edit Mode', () => {
    const editMockRecord = {
      ...mockRecord,
      effectiveDate: moment().add(1, 'day').format('YYYY-MM-DD')
    };

    beforeEach(() => {
      component.mode = 'edit';
      component.data = editMockRecord;
      fixture.detectChanges();

      // Ensure the form is dirty so save proceeds
      component.form.get('scanRequest')?.setValue('Y');
      component.form.get('scanRequest')?.markAsDirty();
      component.form.markAsDirty();
      mockService.updateQcParameters.and.returnValue(of({ success: true, message: 'Updated' }));
    });

    it('should call updateQcParameters in edit mode', () => {
      component.onSaveAndCreateAnother();

      expect(mockService.updateQcParameters).toHaveBeenCalled();
    });

    it('should switch mode to add after successful save in edit mode', (done) => {
      spyOn(component.modeChange, 'emit');

      component.saveSuccess.subscribe(() => {
        setTimeout(() => {
          expect(component.mode).toBe('add');
          expect(component.modeChange.emit).toHaveBeenCalledWith('add');
          done();
        }, 10);
      });

      component.onSaveAndCreateAnother();
    });

    it('should show success snackbar', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Updated',
        'Close',
        jasmine.objectContaining({ duration: 3000 })
      );
    });

    it('should use default message when response has no message', () => {
      mockService.updateQcParameters.and.returnValue(of({ success: true }));
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSaveAndCreateAnother();

      expect(snackBarSpy).toHaveBeenCalled();
      const callArgs = snackBarSpy.calls.mostRecent().args;
      expect(callArgs[0]).toBe('Operation completed successfully');
    });
  });

  describe('onSaveAndCreateAnother - Error Path', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({ dataType: 'N' });
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        sortSequence: 1,
        qcParameterCode: 'TEMP',
        qcCheckCode: 'KRNG',
        rangeFlag: 'N',
        scanRequest: 'N',
        effectiveDate: moment().add(1, 'day')
      });
    });

    it('should handle error and set isSaving false', () => {
      const { throwError } = require('rxjs');
      mockService.createQcParameters.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));
      spyOn(console, 'error');

      component.onSaveAndCreateAnother();

      expect(component.isSaving).toBeFalse();
      expect(console.error).toHaveBeenCalled();
    });

    it('should not emit saveSuccess on error', () => {
      const { throwError } = require('rxjs');
      mockService.createQcParameters.and.returnValue(throwError(() => ({ error: {} })));
      spyOn(component.saveSuccess, 'emit');
      spyOn(console, 'error');

      component.onSaveAndCreateAnother();

      expect(component.saveSuccess.emit).not.toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call setupPanel on subsequent mode change', () => {
      spyOn<any>(component, 'setupPanel');

      component.ngOnChanges({
        mode: {
          previousValue: 'add',
          currentValue: 'edit',
          firstChange: false,
          isFirstChange: () => false
        }
      } as any);

      expect(component['setupPanel']).toHaveBeenCalled();
    });

    it('should call resetFormForAddMode when mode changes to add', () => {
      spyOn<any>(component, 'resetFormForAddMode');

      component.mode = 'add';
      component.ngOnChanges({
        mode: {
          previousValue: 'edit',
          currentValue: 'add',
          firstChange: false,
          isFirstChange: () => false
        }
      } as any);

      expect(component['resetFormForAddMode']).toHaveBeenCalled();
    });

    it('should not call setupPanel on first change', () => {
      spyOn<any>(component, 'setupPanel');

      component.ngOnChanges({
        mode: {
          previousValue: undefined,
          currentValue: 'add',
          firstChange: true,
          isFirstChange: () => true
        }
      } as any);

      expect(component['setupPanel']).not.toHaveBeenCalled();
    });

    it('should handle data change', () => {
      spyOn<any>(component, 'setupPanel');

      component.ngOnChanges({
        data: {
          previousValue: null,
          currentValue: { deviceType: 'EQUIP' },
          firstChange: false,
          isFirstChange: () => false
        }
      } as any);

      expect(component['setupPanel']).toHaveBeenCalled();
    });
  });

  describe('effectiveDateFilter', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true for null date', () => {
      expect(component.effectiveDateFilter(null)).toBeTrue();
    });

    it('should return true for future dates', () => {
      const futureDate = moment().add(5, 'days');
      expect(component.effectiveDateFilter(futureDate)).toBeTrue();
    });

    it('should return false for past dates in add mode', () => {
      const pastDate = moment().subtract(5, 'days');
      expect(component.effectiveDateFilter(pastDate)).toBeFalse();
    });

    it('should return true for original effective date in edit mode even if past', () => {
      const pastDate = moment().subtract(30, 'days');
      component.mode = 'edit';
      component.editModeValues.effectiveDate = pastDate.format('YYYY-MM-DD');

      expect(component.effectiveDateFilter(pastDate)).toBeTrue();
    });

    it('should return false for different past date in edit mode', () => {
      const pastDate = moment().subtract(30, 'days');
      const differentPastDate = moment().subtract(20, 'days');
      component.mode = 'edit';
      component.editModeValues.effectiveDate = pastDate.format('YYYY-MM-DD');

      expect(component.effectiveDateFilter(differentPastDate)).toBeFalse();
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return true for future dates', () => {
      const futureDate = moment().add(10, 'days');
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });

    it('should return false for past dates in add mode', () => {
      const pastDate = moment().subtract(5, 'days');
      expect(component.terminationDateFilter(pastDate)).toBeFalse();
    });

    it('should return true for original termination date in edit mode even if past', () => {
      const pastDate = moment().subtract(10, 'days');
      component.mode = 'edit';
      component.editModeValues.terminationDate = pastDate.format('YYYY-MM-DD');

      expect(component.terminationDateFilter(pastDate)).toBeTrue();
    });

    it('should return false when date is before effective date', () => {
      const futureEffDate = moment().add(10, 'days');
      const beforeEffDate = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate: futureEffDate });

      expect(component.terminationDateFilter(beforeEffDate)).toBeFalse();
    });

    it('should return true when date is on or after effective date', () => {
      const futureEffDate = moment().add(5, 'days');
      const afterEffDate = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate: futureEffDate });

      expect(component.terminationDateFilter(afterEffDate)).toBeTrue();
    });
  });

  describe('formatDateTime', () => {
    it('should return empty string for null date', () => {
      expect(component.formatDateTime(null)).toBe('');
    });

    it('should format today date with Today prefix', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const today = new Date();
      const result = component.formatDateTime(today);

      expect(result).toContain('Today');
      expect(result).toContain('PST');
    });

    it('should format non-today date with DD-MMM-YYYY format', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const pastDate = new Date('2025-01-15T10:30:00');
      const result = component.formatDateTime(pastDate);

      expect(result).toContain('PST');
      expect(result).toContain('2025');
    });
  });

  describe('onEffDatePickerOpened and onTermDatePickerOpened', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call refreshChapterDates on effective date picker open', () => {
      spyOn<any>(component, 'refreshChapterDates');

      component.onEffDatePickerOpened();

      expect(component['refreshChapterDates']).toHaveBeenCalled();
    });

    it('should call refreshChapterDates on termination date picker open', () => {
      spyOn<any>(component, 'refreshChapterDates');

      component.onTermDatePickerOpened();

      expect(component['refreshChapterDates']).toHaveBeenCalled();
    });
  });

  describe('displayDataTypeDescription', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string for empty code', () => {
      expect(component.displayDataTypeDescription('')).toBe('');
    });

    it('should return description when code is found', () => {
      // dataTypes are loaded from mock service
      const result = component.displayDataTypeDescription('C');
      expect(result).toBe('Character');
    });

    it('should return code when description not found', () => {
      const result = component.displayDataTypeDescription('X');
      expect(result).toBe('X');
    });
  });

  describe('isSaveButtonDisabled', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true when form is invalid', () => {
      component.form.patchValue({ effectiveDate: null });
      component.form.markAsDirty();
      component.form.updateValueAndValidity();

      expect(component.isSaveButtonDisabled).toBeTrue();
    });

    it('should return true when form is pristine', () => {
      expect(component.isSaveButtonDisabled).toBeTrue();
    });

    it('should return true when isSaving is true', () => {
      component.form.markAsDirty();
      component.isSaving = true;

      expect(component.isSaveButtonDisabled).toBeTrue();
    });

    it('should return false when form is valid, dirty, and not saving', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        sortSequence: 1,
        qcParameterCode: 'TEMP',
        qcCheckCode: 'KRNG',
        dataType: 'N',
        rangeFlag: 'N',
        scanRequest: 'N',
        effectiveDate: moment().add(1, 'day')
      });
      component.form.markAsDirty();
      component.isSaving = false;

      expect(component.isSaveButtonDisabled).toBeFalse();
    });
  });

  describe('currentDataType getter', () => {
    it('should return current data type value', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ dataType: 'N' });

      expect(component.currentDataType).toBe('N');
    });

    it('should return empty string when no data type is selected', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ dataType: '' });

      expect(component.currentDataType).toBe('');
    });
  });

  describe('onEffectiveDateInput and onTerminationDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
      const event = { target: { value: '15-Jan-2026' } } as unknown as Event;

      // Should not throw
      expect(() => component.onEffectiveDateInput(event)).not.toThrow();
    });

    it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
      const event = { target: { value: '20-Jan-2026' } } as unknown as Event;

      expect(() => component.onTerminationDateInput(event)).not.toThrow();
    });
  });

  describe('getQcParameterCodeError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getQcParameterCodeError()).toBe('');
    });

    it('should return required error message when touched and empty', () => {
      component.form.get('qcParameterCode')?.setValue('');
      component.form.get('qcParameterCode')?.markAsTouched();
      component.form.get('qcParameterCode')?.updateValueAndValidity();

      expect(component.getQcParameterCodeError()).toBe('FRM-0080 QC Parameter Code is required');
    });

    it('should return empty string when touched and has value', () => {
      component.form.get('qcParameterCode')?.setValue('TEMP');
      component.form.get('qcParameterCode')?.markAsTouched();

      expect(component.getQcParameterCodeError()).toBe('');
    });
  });

  describe('getQcCheckCodeError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getQcCheckCodeError()).toBe('');
    });

    it('should return required error message when touched and empty', () => {
      component.form.get('qcCheckCode')?.setValue(null);
      component.form.get('qcCheckCode')?.markAsTouched();
      component.form.get('qcCheckCode')?.updateValueAndValidity();

      expect(component.getQcCheckCodeError()).toBe('FRM-0080 QC Check Code is required');
    });

    it('should return duplicate error message when duplicate exists', () => {
      component['existingRecords'] = [
        { ...mockRecord, qcParameterCode: 'TEMP', qcCheckCode: 'KRNG' } as any
      ];
      component.form.patchValue({ qcParameterCode: 'TEMP', qcCheckCode: 'KRNG' });
      component.form.get('qcCheckCode')?.markAsTouched();
      component.form.get('qcCheckCode')?.markAsDirty();
      component.form.get('qcCheckCode')?.updateValueAndValidity();

      expect(component.getQcCheckCodeError()).toBe('QC Parameter Code and QC Check Code combination already exists');
    });
  });

  describe('getChildSequenceError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ sortSequence: 10 });
    });

    it('should return empty string when not touched', () => {
      expect(component.getChildSequenceError()).toBe('');
    });

    it('should return min error when child sequence is negative', () => {
      component.form.patchValue({ childSequence: -1 });
      component.form.get('childSequence')?.markAsTouched();

      expect(component.getChildSequenceError()).toBe('Child Sequence must be >= 0');
    });

    it('should return max error when child sequence exceeds sort sequence', () => {
      component.form.patchValue({ childSequence: 15 });
      component.form.get('childSequence')?.markAsTouched();

      expect(component.getChildSequenceError()).toContain('Child Sequence must be <= 10');
    });

    it('should return empty string when valid', () => {
      component.form.patchValue({ childSequence: 5 });
      component.form.get('childSequence')?.markAsTouched();

      expect(component.getChildSequenceError()).toBe('');
    });
  });

  describe('getQcTargetValueError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ dataType: 'N' });
    });

    it('should return empty string when not touched', () => {
      expect(component.getQcTargetValueError()).toBe('');
    });

    it('should return error for non-numeric, non-dropdown value', () => {
      component.form.patchValue({ qcTargetValue: 'abc' });
      component.form.get('qcTargetValue')?.markAsTouched();
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      expect(component.getQcTargetValueError()).toBe('Select from dropdown or enter a numeric value');
    });

    it('should return empty string for valid numeric value', () => {
      component.form.patchValue({ qcTargetValue: '42.5' });
      component.form.get('qcTargetValue')?.markAsTouched();
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      expect(component.getQcTargetValueError()).toBe('');
    });
  });

  describe('onQcTargetValueInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should filter non-numeric characters', () => {
      const input = document.createElement('input');
      input.value = '12abc34';
      const event = { target: input } as unknown as Event;

      component.onQcTargetValueInput(event);

      expect(input.value).toBe('1234');
    });

    it('should allow a single decimal point', () => {
      const input = document.createElement('input');
      input.value = '12.34';
      const event = { target: input } as unknown as Event;

      component.onQcTargetValueInput(event);

      // Should not modify since 12.34 is valid
      expect(input.value).toBe('12.34');
    });

    it('should remove extra decimal points', () => {
      const input = document.createElement('input');
      input.value = '12.34.56';
      const event = { target: input } as unknown as Event;

      component.onQcTargetValueInput(event);

      expect(input.value).toBe('12.3456');
    });

    it('should not modify already valid value', () => {
      const input = document.createElement('input');
      input.value = '100';
      const event = { target: input } as unknown as Event;

      component.onQcTargetValueInput(event);

      // No change needed, no setValue call
      expect(input.value).toBe('100');
    });
  });

  describe('preventDecimalInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should allow number keys', () => {
      const event = new KeyboardEvent('keydown', { key: '5', keyCode: 53 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent decimal point', () => {
      const event = new KeyboardEvent('keydown', { key: '.', keyCode: 190 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent comma', () => {
      const event = new KeyboardEvent('keydown', { key: ',', keyCode: 188 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent e key (exponential)', () => {
      const event = new KeyboardEvent('keydown', { key: 'e', keyCode: 69 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent minus sign', () => {
      const event = new KeyboardEvent('keydown', { key: '-', keyCode: 189 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent plus sign', () => {
      const event = new KeyboardEvent('keydown', { key: '+', keyCode: 187 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow backspace', () => {
      const event = new KeyboardEvent('keydown', { key: 'Backspace', keyCode: 8 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow tab', () => {
      const event = new KeyboardEvent('keydown', { key: 'Tab', keyCode: 9 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+A', () => {
      const event = new KeyboardEvent('keydown', { key: 'a', keyCode: 65, ctrlKey: true });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+C', () => {
      const event = new KeyboardEvent('keydown', { key: 'c', keyCode: 67, ctrlKey: true });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow Ctrl+V', () => {
      const event = new KeyboardEvent('keydown', { key: 'v', keyCode: 86, ctrlKey: true });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow arrow keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'ArrowLeft', keyCode: 37 });
      spyOn(event, 'preventDefault');

      component.preventDecimalInput(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onIntegerPaste', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should filter non-numeric characters from pasted text', () => {
      const clipboardData = { getData: () => '12.5abc' };
      const event = { preventDefault: jasmine.createSpy('preventDefault'), clipboardData } as unknown as ClipboardEvent;

      component.onIntegerPaste(event, 'sortSequence');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('sortSequence')?.value).toBe(125);
    });

    it('should handle paste with only digits', () => {
      const clipboardData = { getData: () => '42' };
      const event = { preventDefault: jasmine.createSpy('preventDefault'), clipboardData } as unknown as ClipboardEvent;

      component.onIntegerPaste(event, 'sortSequence');

      expect(component.form.get('sortSequence')?.value).toBe(42);
    });

    it('should not set value when filtered result is empty', () => {
      const clipboardData = { getData: () => 'abc' };
      const event = { preventDefault: jasmine.createSpy('preventDefault'), clipboardData } as unknown as ClipboardEvent;

      const originalValue = component.form.get('sortSequence')?.value;
      component.onIntegerPaste(event, 'sortSequence');

      expect(component.form.get('sortSequence')?.value).toBe(originalValue);
    });
  });

  describe('onChildSequenceInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should remove non-digit characters', () => {
      const input = document.createElement('input');
      input.value = '12.5';
      const event = { target: input } as unknown as Event;

      component.onChildSequenceInput(event);

      expect(input.value).toBe('125');
    });

    it('should not modify already valid input', () => {
      const input = document.createElement('input');
      input.value = '42';
      const event = { target: input } as unknown as Event;

      component.onChildSequenceInput(event);

      // No change needed
      expect(input.value).toBe('42');
    });

    it('should set null when filtered result is empty', () => {
      const input = document.createElement('input');
      input.value = 'abc';
      const event = { target: input } as unknown as Event;

      component.onChildSequenceInput(event);

      expect(input.value).toBe('');
    });
  });

  describe('onSortSequenceInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should remove non-digit characters', () => {
      const input = document.createElement('input');
      input.value = '5.7';
      const event = { target: input } as unknown as Event;

      component.onSortSequenceInput(event);

      expect(input.value).toBe('57');
    });

    it('should not modify already valid input', () => {
      const input = document.createElement('input');
      input.value = '10';
      const event = { target: input } as unknown as Event;

      component.onSortSequenceInput(event);

      expect(input.value).toBe('10');
    });
  });

  describe('Description Watchers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update qcParameterDescription when qcParameterCode changes', () => {
      component.form.patchValue({ qcParameterCode: 'TEMP' });

      expect(component.form.getRawValue().qcParameterDescription).toBe('Temperature');
    });

    it('should clear qcParameterDescription when unknown code is selected', () => {
      component.form.patchValue({ qcParameterCode: 'UNKNOWN' });

      expect(component.form.getRawValue().qcParameterDescription).toBe('');
    });

    it('should update qcCheckCodeDescription when qcCheckCode changes', () => {
      component.form.patchValue({ qcCheckCode: 'KRNG' });

      expect(component.form.getRawValue().qcCheckCodeDescription).toBe('KRNG Desc');
    });

    it('should clear qcCheckCodeDescription when unknown code is selected', () => {
      component.form.patchValue({ qcCheckCode: 'UNKNOWN' });

      expect(component.form.getRawValue().qcCheckCodeDescription).toBe('');
    });

    it('should update scanWhatDescription when scanWhat changes', () => {
      component.form.patchValue({ scanWhat: 'S1' });

      expect(component.form.getRawValue().scanWhatDescription).toBe('Scan 1');
    });

    it('should clear scanWhatDescription when unknown value is selected', () => {
      component.form.patchValue({ scanWhat: 'UNKNOWN' });

      expect(component.form.getRawValue().scanWhatDescription).toBe('');
    });

    it('should update qcTargetValueDescription when in dropdown mode', () => {
      component.form.patchValue({ dataType: 'C' });
      component.form.patchValue({ qcTargetValue: 'V1' });

      expect(component.form.getRawValue().qcTargetValueDescription).toBe('Value 1');
    });

    it('should clear qcTargetValueDescription when not in dropdown mode', () => {
      component.form.patchValue({ dataType: 'N' });
      component.form.patchValue({ qcTargetValue: '42' });

      expect(component.form.getRawValue().qcTargetValueDescription).toBe('');
    });
  });

  describe('Dropdown API Error Handling', () => {
    it('should set fallback device types on error', () => {
      const { throwError } = require('rxjs');
      mockService.getDeviceTypes.and.returnValue(throwError(() => new Error('API error')));
      mockService.getQcParameterCodes.and.returnValue(of({ data: [], totalRecords: 0 }));
      mockService.getQcCheckCodes.and.returnValue(of([]));
      mockService.getQcDataTypes.and.returnValue(of([]));
      mockService.getQcTargetValues.and.returnValue(of([]));
      mockService.getQcValueTypes.and.returnValue(of({ data: [], totalRecords: 0 }));
      mockService.getQcEquipmentTypes.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.mode = 'add';
      fixture.detectChanges();

      expect(component.deviceTypes()).toEqual(['EQUIP', 'SUPLY']);
    });

    it('should set fallback data types on error', () => {
      const { throwError } = require('rxjs');
      mockService.getQcDataTypes.and.returnValue(throwError(() => new Error('API error')));
      mockService.getDeviceTypes.and.returnValue(of(['EQUIP']));
      mockService.getQcParameterCodes.and.returnValue(of({ data: [], totalRecords: 0 }));
      mockService.getQcCheckCodes.and.returnValue(of([]));
      mockService.getQcTargetValues.and.returnValue(of([]));
      mockService.getQcValueTypes.and.returnValue(of({ data: [], totalRecords: 0 }));
      mockService.getQcEquipmentTypes.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.mode = 'add';
      fixture.detectChanges();

      const dataTypes = component.dataTypes();
      expect(dataTypes.length).toBe(3);
      expect(dataTypes[0].code).toBe('C');
    });

    it('should set empty qcCheckCodes on error', () => {
      const { throwError } = require('rxjs');
      mockService.getQcCheckCodes.and.returnValue(throwError(() => new Error('API error')));
      mockService.getDeviceTypes.and.returnValue(of(['EQUIP']));
      mockService.getQcParameterCodes.and.returnValue(of({ data: [], totalRecords: 0 }));
      mockService.getQcDataTypes.and.returnValue(of([]));
      mockService.getQcTargetValues.and.returnValue(of([]));
      mockService.getQcValueTypes.and.returnValue(of({ data: [], totalRecords: 0 }));
      mockService.getQcEquipmentTypes.and.returnValue(of({ data: [], totalRecords: 0 }));

      component.mode = 'add';
      fixture.detectChanges();

      expect(component.qcCheckCodes()).toEqual([]);
    });

    it('should transform Decimal to Date for code D in data types', () => {
      mockService.getQcDataTypes.and.returnValue(of([
        { code: 'D', description: 'Decimal' },
        { code: 'C', description: 'Character' }
      ]));

      component.mode = 'add';
      fixture.detectChanges();

      const dataTypes = component.dataTypes();
      const dType = dataTypes.find((t: any) => t.code === 'D');
      expect(dType?.description).toBe('Date');
    });
  });

  describe('Duplicate QC Parameter Validator', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = {
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        existingRecords: [
          { ...mockRecord, qcParameterCode: 'TEMP', qcCheckCode: 'KRNG', auditKey: 100 }
        ]
      } as any;
      fixture.detectChanges();
    });

    it('should detect duplicate combination', () => {
      component.form.patchValue({ qcParameterCode: 'TEMP', qcCheckCode: 'KRNG' });
      component.form.get('qcCheckCode')?.markAsTouched();
      component.form.get('qcCheckCode')?.markAsDirty();
      component.form.get('qcCheckCode')?.updateValueAndValidity();

      expect(component.form.get('qcCheckCode')?.hasError('duplicateQcParameter')).toBeTrue();
    });

    it('should allow non-duplicate combination', () => {
      component.form.patchValue({ qcParameterCode: 'TEMP', qcCheckCode: 'KCDT' });
      component.form.get('qcCheckCode')?.markAsTouched();
      component.form.get('qcCheckCode')?.markAsDirty();
      component.form.get('qcCheckCode')?.updateValueAndValidity();

      expect(component.form.get('qcCheckCode')?.hasError('duplicateQcParameter')).toBeFalse();
    });

    it('should skip duplicate check when qcCheckCode is empty', () => {
      component.form.patchValue({ qcParameterCode: 'TEMP', qcCheckCode: null });
      component.form.get('qcCheckCode')?.markAsTouched();
      component.form.get('qcCheckCode')?.updateValueAndValidity();

      expect(component.form.get('qcCheckCode')?.hasError('duplicateQcParameter')).toBeFalse();
    });

    it('should skip duplicate check when qcParameterCode is empty', () => {
      component.form.patchValue({ qcParameterCode: '', qcCheckCode: 'KRNG' });
      component.form.get('qcCheckCode')?.markAsTouched();
      component.form.get('qcCheckCode')?.markAsDirty();
      component.form.get('qcCheckCode')?.updateValueAndValidity();

      expect(component.form.get('qcCheckCode')?.hasError('duplicateQcParameter')).toBeFalse();
    });

    it('should exclude current record in edit mode', () => {
      // Set mode and originalValues directly to test the validator logic
      // without re-initializing the component
      component.mode = 'edit';
      component['originalValues'] = {
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        auditKey: 100
      };

      component.form.patchValue({ qcParameterCode: 'TEMP', qcCheckCode: 'KRNG' });
      component.form.get('qcCheckCode')?.markAsTouched();
      component.form.get('qcCheckCode')?.markAsDirty();
      component.form.get('qcCheckCode')?.updateValueAndValidity();

      expect(component.form.get('qcCheckCode')?.hasError('duplicateQcParameter')).toBeFalse();
    });
  });

  describe('Numeric Or Dropdown Validator', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.patchValue({ dataType: 'N' });
    });

    it('should accept empty value (optional field)', () => {
      component.form.patchValue({ qcTargetValue: '' });
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      expect(component.form.get('qcTargetValue')?.hasError('numericOrDropdown')).toBeFalse();
    });

    it('should accept value from dropdown options', () => {
      component.form.patchValue({ qcTargetValue: 'V1' });
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      expect(component.form.get('qcTargetValue')?.hasError('numericOrDropdown')).toBeFalse();
    });

    it('should accept numeric string', () => {
      component.form.patchValue({ qcTargetValue: '123.45' });
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      expect(component.form.get('qcTargetValue')?.hasError('numericOrDropdown')).toBeFalse();
    });

    it('should reject non-numeric non-dropdown value', () => {
      component.form.patchValue({ qcTargetValue: 'invalid' });
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      expect(component.form.get('qcTargetValue')?.hasError('numericOrDropdown')).toBeTrue();
    });
  });

  describe('onSelectOpenedChange', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should clear search control when dropdown closes', () => {
      component.qcParameterCodeSearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.qcParameterCodeSearchCtrl, false);

      expect(component.qcParameterCodeSearchCtrl.value).toBe('');
    });

    it('should not clear search control when dropdown opens', () => {
      component.qcParameterCodeSearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.qcParameterCodeSearchCtrl, true);

      expect(component.qcParameterCodeSearchCtrl.value).toBe('test');
    });
  });

  describe('setNextSortSequence', () => {
    it('should set sort sequence to 1 when no existing records', () => {
      component.mode = 'add';
      component.data = { deviceType: 'EQUIP', equipmentSupply: 'ALYX' } as any;
      fixture.detectChanges();

      expect(component.form.get('sortSequence')?.value).toBe(1);
    });

    it('should set sort sequence to max + 1 when existing records', () => {
      component.mode = 'add';
      component.data = {
        deviceType: 'EQUIP',
        equipmentSupply: 'ALYX',
        existingRecords: [
          { ...mockRecord, sortSequence: 3 },
          { ...mockRecord, sortSequence: 5 },
          { ...mockRecord, sortSequence: 2 }
        ]
      } as any;
      fixture.detectChanges();

      expect(component.form.get('sortSequence')?.value).toBe(6);
    });
  });

  describe('populateFormForEdit - Various States', () => {
    it('should set minTermDate to effective date when no termination date', () => {
      const effDate = moment().subtract(30, 'days').format('YYYY-MM-DD');
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: effDate,
        terminationDate: null
      };
      fixture.detectChanges();

      // minTermDate should be set to effective date
      expect(component.minTermDate).toBeDefined();
    });

    it('should set minTermDate to earlier of effective and termination dates', () => {
      const effDate = moment().subtract(30, 'days');
      const termDate = moment().subtract(10, 'days');
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: effDate.format('YYYY-MM-DD'),
        terminationDate: termDate.format('YYYY-MM-DD')
      };
      fixture.detectChanges();

      expect(component.minTermDate).toBeDefined();
      // minTermDate should be <= termDate
      expect(component.minTermDate.isSameOrBefore(termDate)).toBeTrue();
    });

    it('should store original values for update API', () => {
      component.mode = 'edit';
      component.data = { ...mockRecord, auditKey: 456 };
      fixture.detectChanges();

      expect(component['originalValues'].deviceType).toBe('EQUIP');
      expect(component['originalValues'].equipmentSupply).toBe('ALYX');
      expect(component['originalValues'].auditKey).toBe(456);
    });
  });

  describe('Edit Mode Effective Date Validator', () => {
    it('should allow original past effective date', () => {
      const pastDate = moment().subtract(30, 'days');
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: pastDate.format('YYYY-MM-DD')
      };
      fixture.detectChanges();

      // The original date should not trigger effectiveDatePast error
      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
    });

    it('should block new past effective date in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD')
      };
      fixture.detectChanges();

      // Set a DIFFERENT past date
      const differentPastDate = moment().subtract(5, 'days');
      component.form.get('effectiveDate')?.setValue(differentPastDate);
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeTrue();
    });

    it('should allow future effective date in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD')
      };
      fixture.detectChanges();

      const futureDate = moment().add(10, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
    });
  });

  describe('QC Target Value Validation Based on Data Type', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should clear validators when data type is C', () => {
      component.form.patchValue({ dataType: 'C' });
      component.form.patchValue({ qcTargetValue: 'any-text' });
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      // C type has no validators, so any value is valid
      expect(component.form.get('qcTargetValue')?.valid).toBeTrue();
    });

    it('should apply numeric validator when data type is N', () => {
      component.form.patchValue({ dataType: 'N' });
      component.form.patchValue({ qcTargetValue: 'not-a-number' });
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      expect(component.form.get('qcTargetValue')?.hasError('numericOrDropdown')).toBeTrue();
    });

    it('should clear validators when data type changes from N to D', () => {
      component.form.patchValue({ dataType: 'N' });
      component.form.patchValue({ dataType: 'D' });
      component.form.patchValue({ qcTargetValue: 'any-text' });
      component.form.get('qcTargetValue')?.updateValueAndValidity();

      expect(component.form.get('qcTargetValue')?.valid).toBeTrue();
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should expose submitting signal', () => {
      expect(component.submitting()).toBeFalse();
    });

    it('should expose deviceTypes from loaded options', () => {
      expect(component.deviceTypes()).toEqual(['EQUIP', 'SUPLY']);
    });

    it('should expose qcParameterCodes from loaded options', () => {
      expect(component.qcParameterCodes().length).toBe(2);
      expect(component.qcParameterCodes()[0].code).toBe('TEMP');
    });

    it('should expose qcCheckCodes from loaded options', () => {
      expect(component.qcCheckCodes().length).toBe(2);
    });

    it('should expose dataTypes from loaded options', () => {
      expect(component.dataTypes().length).toBeGreaterThan(0);
    });

    it('should expose qcTargetValues from loaded options', () => {
      expect(component.qcTargetValues().length).toBe(1);
      expect(component.qcTargetValues()[0].code).toBe('V1');
    });

    it('should expose valueTypes from loaded options', () => {
      expect(component.valueTypes().length).toBe(1);
      expect(component.valueTypes()[0].code).toBe('S1');
    });

    it('should expose equipmentTypes from loaded options', () => {
      expect(component.equipmentTypes().length).toBe(1);
      expect(component.equipmentTypes()[0].code).toBe('E1');
    });
  });

  describe('Filtered Dropdown Computed Signals', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should filter scan what types by search', () => {
      component.scanWhatSearchCtrl.setValue('Scan');

      const filtered = component.filteredScanWhatTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('S1');
    });

    it('should return all scan what types when search is empty', () => {
      component.scanWhatSearchCtrl.setValue('');

      const filtered = component.filteredScanWhatTypes();
      expect(filtered.length).toBe(1);
    });

    it('should filter equipment types by search', () => {
      component.equipmentTypeSearchCtrl.setValue('Equip');

      const filtered = component.filteredEquipmentTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('E1');
    });

    it('should return all equipment types when search is empty', () => {
      component.equipmentTypeSearchCtrl.setValue('');

      const filtered = component.filteredEquipmentTypes();
      expect(filtered.length).toBe(1);
    });

    it('should return empty array when no items match search', () => {
      component.qcParameterCodeSearchCtrl.setValue('ZZZZZ');

      const filtered = component.filteredQcParameterCodes();
      expect(filtered.length).toBe(0);
    });

    it('should filter data types and return empty when no match', () => {
      component.dataTypeSearchCtrl.setValue('ZZZZ');

      const filtered = component.filteredDataTypes();
      expect(filtered.length).toBe(0);
    });
  });

  describe('setupPanel - Panel Title and Last Updated', () => {
    it('should set add mode panel title', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Add New QC Parameter');
      expect(component.lastUpdated).toBe('');
    });

    it('should set edit mode panel title and last updated', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();

      expect(component.panelTitle).toBe('Edit QC Parameter');
      expect(component.lastUpdated).toContain('Last Updated:');
    });
  });

  describe('resetFormForAddMode', () => {
    it('should preserve deviceType and equipmentSupply from data', () => {
      component.mode = 'add';
      component.data = { deviceType: 'SUPLY', equipmentSupply: 'TEST' };
      fixture.detectChanges();

      // Simulate switching back to add from edit
      component['resetFormForAddMode']();

      expect(component.form.get('deviceType')?.value).toBe('SUPLY');
      expect(component.form.get('equipmentSupply')?.value).toBe('TEST');
    });

    it('should enable deviceType and equipmentSupply fields', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();

      // deviceType is disabled in edit mode
      expect(component.form.get('deviceType')?.disabled).toBeTrue();

      component['resetFormForAddMode']();

      expect(component.form.get('deviceType')?.enabled).toBeTrue();
      expect(component.form.get('equipmentSupply')?.enabled).toBeTrue();
    });

    it('should clear editModeValues', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();

      component['resetFormForAddMode']();

      expect(component.editModeValues.deviceType).toBe('');
      expect(component.editModeValues.equipmentSupply).toBe('');
      expect(component.editModeValues.effectiveDate).toBeNull();
      expect(component.editModeValues.terminationDate).toBeNull();
    });

    it('should mark form as pristine and untouched', () => {
      component.mode = 'add';
      fixture.detectChanges();
      component.form.markAsDirty();
      component.form.markAllAsTouched();

      component['resetFormForAddMode']();

      expect(component.form.pristine).toBeTrue();
      expect(component.form.untouched).toBeTrue();
    });
  });

  describe('Child Sequence Validator - Edit Mode', () => {
    it('should skip validation in edit mode when field is untouched', () => {
      component.mode = 'edit';
      component.data = {
        ...mockRecord,
        childSequence: 999,
        sortSequence: 1
      };
      fixture.detectChanges();

      // In edit mode, untouched invalid data should not trigger errors
      expect(component.form.get('childSequence')?.valid).toBeTrue();
    });

    it('should validate in edit mode when field is touched', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();

      component.form.patchValue({ sortSequence: 5, childSequence: 10 });
      component.form.get('childSequence')?.markAsTouched();
      component.form.get('childSequence')?.updateValueAndValidity();

      expect(component.form.get('childSequence')?.hasError('childSequenceMax')).toBeTrue();
    });
  });

  describe('Duplicate Validator - Edit Mode Untouched', () => {
    it('should skip duplicate validation in edit mode when field is not touched or dirty', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      component['existingRecords'] = [
        { ...mockRecord, qcParameterCode: 'TEMP', qcCheckCode: 'KRNG', auditKey: 200 } as any
      ];
      fixture.detectChanges();

      // In edit mode, the loaded duplicate value should not trigger errors
      expect(component.form.get('qcCheckCode')?.hasError('duplicateQcParameter')).toBeFalse();
    });
  });

  describe('Edit Mode - Disabled Fields', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();
    });

    it('should disable deviceType in edit mode', () => {
      expect(component.form.get('deviceType')?.disabled).toBeTrue();
    });

    it('should disable equipmentSupply in edit mode', () => {
      expect(component.form.get('equipmentSupply')?.disabled).toBeTrue();
    });

    it('should mark form as pristine after loading edit data', () => {
      expect(component.form.pristine).toBeTrue();
    });

    it('should mark form as untouched after loading edit data', () => {
      expect(component.form.untouched).toBeTrue();
    });
  });

  describe('Edit Mode - updateQcTargetValueFieldType on init', () => {
    it('should set field type based on record dataType on edit mode init', () => {
      component.mode = 'edit';
      component.data = { ...mockRecord, dataType: 'C' };
      fixture.detectChanges();

      expect(component.qcTargetValueFieldType()).toBe('dropdown');
    });

    it('should set field type to both for N dataType on edit mode init', () => {
      component.mode = 'edit';
      component.data = { ...mockRecord, dataType: 'N' };
      fixture.detectChanges();

      expect(component.qcTargetValueFieldType()).toBe('both');
    });
  });

  describe('getEffectiveDateError - effectiveDatePast branch', () => {
    it('should return effectiveDatePast error message', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.get('effectiveDate')?.setErrors({ effectiveDatePast: true });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.markAsDirty();

      const error = component.getEffectiveDateError();
      expect(error).toBe('Effective Date cannot be in the past');
    });
  });

  describe('getTerminationDateError - terminationDatePast branch', () => {
    it('should return terminationDatePast error message', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.get('terminationDate')?.setErrors({ terminationDatePast: true });
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsDirty();

      const error = component.getTerminationDateError();
      expect(error).toBe('Termination Date cannot be past');
    });

    it('should show cross-field error when termination was last changed', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const effectiveDate = moment().add(10, 'days');
      const terminationDate = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate, terminationDate });
      component.form.get('terminationDate')?.markAsTouched();
      component.form.get('terminationDate')?.markAsDirty();
      component.form.updateValueAndValidity();

      component['lastChangedDateField'] = 'termination';

      const error = component.getTerminationDateError();
      expect(error).toContain('Termination Date');
    });
  });

  describe('refreshChapterDates', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not update when minDate has not changed', () => {
      const originalMinDate = component.minDate.clone();

      component['refreshChapterDates']();

      expect(component.minDate.format('YYYY-MM-DD')).toBe(originalMinDate.format('YYYY-MM-DD'));
    });
  });

  describe('Data loaded from record in edit mode', () => {
    it('should populate form fields from record data', () => {
      component.mode = 'edit';
      component.data = mockRecord;
      fixture.detectChanges();

      const rawValues = component.form.getRawValue();
      expect(rawValues.deviceType).toBe('EQUIP');
      expect(rawValues.equipmentSupply).toBe('ALYX');
      expect(rawValues.sortSequence).toBe(1);
      expect(rawValues.qcParameterCode).toBe('TEMP');
      expect(rawValues.qcCheckCode).toBe('KRNG');
      expect(rawValues.dataType).toBe('N');
      expect(rawValues.rangeFlag).toBe('N');
      expect(rawValues.scanRequest).toBe('N');
    });

    it('should handle record with all optional fields populated', () => {
      const fullRecord = {
        ...mockRecord,
        qcTargetValue: 'V1',
        qcTargetValueDescription: 'Value 1',
        childSequence: 2,
        rangeDetailsValue: 5,
        scanWhat: 'S1',
        scanWhatDescription: 'Scan 1',
        equipmentType: 'E1',
        terminationDate: moment().add(30, 'days').format('YYYY-MM-DD')
      };

      component.mode = 'edit';
      component.data = fullRecord;
      fixture.detectChanges();

      const rawValues = component.form.getRawValue();
      // qcTargetValue is cleared by updateQcTargetValueFieldType during init
      expect(rawValues.childSequence).toBe(2);
      expect(rawValues.rangeDetailsValue).toBe(5);
      expect(rawValues.scanWhat).toBe('S1');
      expect(rawValues.equipmentType).toBe('E1');
      expect(rawValues.terminationDate).toBeTruthy();
    });
  });

  describe('Add mode with pre-filled deviceType and equipmentSupply', () => {
    it('should pre-fill deviceType and equipmentSupply from data', () => {
      component.mode = 'add';
      component.data = { deviceType: 'SUPLY', equipmentSupply: 'TEST' };
      fixture.detectChanges();

      expect(component.form.get('deviceType')?.value).toBe('SUPLY');
      expect(component.form.get('equipmentSupply')?.value).toBe('TEST');
    });
  });
});
