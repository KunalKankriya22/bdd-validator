import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ChangeDetectorRef, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditDriveProfile } from './add-edit-drive-profile';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditDriveProfile', () => {
  const tomorrow = moment().add(1, 'day').startOf('day');

  let component: AddEditDriveProfile;
  let fixture: ComponentFixture<AddEditDriveProfile>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  const mockRecord = {
    deviceType: 'EQUIP',
    driveProfileType: 'ALYX',
    driveProfileTypeDescription: 'ALYX Description',
    code: '500',
    codeDescription: '500gm weight',
    effectiveDate: '2026-03-14T00:00:00',
    terminationDate: '2026-12-31T00:00:00'
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getDeviceTypes',
      'getDriveProfileTypes',
      'getCodes',
      'createDriveProfile',
      'updateDriveProfile'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = { chapterTimeZone: signal('America/Los_Angeles') };

    mockService.getDeviceTypes.and.returnValue(of(['EQUIP', 'SUPLY']));
    mockService.getDriveProfileTypes.and.returnValue(of([
      { code: 'ALYX', description: 'ALYX Desc' },
      { code: 'BP', description: 'Blood Pressure' }
    ]));
    mockService.getCodes.and.returnValue(of([
      { code: '500', description: '500gm weight' },
      { code: '1000', description: '1000gm weight' }
    ]));



      TestBed.configureTestingModule({
      imports: [AddEditDriveProfile, NoopAnimationsModule, ReactiveFormsModule],
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


      mockService.getDriveProfileTypes.calls.reset();


      mockService.getCodes.calls.reset();


      mockService.createDriveProfile.calls.reset();


      mockService.updateDriveProfile.calls.reset();


      mockService.getDeviceTypes.and.returnValue(of(['EQUIP', 'SUPLY']));


    fixture = TestBed.createComponent(AddEditDriveProfile);
    component = fixture.componentInstance;


    });
  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have deviceType and driveProfileType enabled', () => {
      expect(component.form.get('deviceType')?.enabled).toBeTrue();
      expect(component.form.get('driveProfileType')?.enabled).toBeTrue();
    });

    it('should have effectiveDate enabled', () => {
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should mark required fields as invalid when empty', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('deviceType')?.valid).toBeFalse();
      expect(component.form.get('driveProfileType')?.valid).toBeFalse();
      expect(component.form.get('code')?.valid).toBeFalse();
      expect(component.form.get('effectiveDate')?.valid).toBeFalse();
    });

    it('should validate effective date cannot be past date in add mode', () => {
      const pastDate = moment().subtract(5, 'days');
      component.form.patchValue({ effectiveDate: pastDate });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeTrue();
    });




  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { record: mockRecord };
      fixture.detectChanges();
    });







    it('should keep terminationDate enabled', () => {
      expect(component.form.get('terminationDate')?.enabled).toBeTrue();
    });

    it('should display effective date in edit mode', () => {
      expect(component.editEffectiveDateDisplay).toBeTruthy();
      expect(component.editEffectiveDateDisplay).not.toBe('-');
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



    it('should validate date range - termination before effective', () => {
      component.form.patchValue({
        effectiveDate: moment('2026-12-15'),
        terminationDate: tomorrow.clone()
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });

    it('should allow same effective and termination date', () => {
      const sameDate = moment('2026-12-15');
      component.form.patchValue({
        effectiveDate: sameDate,
        terminationDate: sameDate.clone()
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

        // Explicitly set lastChangedDateField for test - simulates user changing effective date
        (component as any).lastChangedDateField = 'effective';

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

        // Explicitly set lastChangedDateField for test - simulates user changing effective date
        (component as any).lastChangedDateField = 'effective';

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

        // Explicitly set lastChangedDateField for test - simulates user changing effective date last
        (component as any).lastChangedDateField = 'effective';

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
      expect(component.deviceTypeSearchCtrl).toBeDefined();
      expect(component.driveProfileTypeSearchCtrl).toBeDefined();
      expect(component.codeSearchCtrl).toBeDefined();
    });





    it('should return all items when search is empty', () => {
      component.deviceTypeSearchCtrl.setValue('');

      const filtered = component.filteredDeviceTypes();
      expect(filtered.length).toBe(2);
    });


  });


  describe('Original Values Storage (OriginalCode and OriginalEffectiveDate Fix)', () => {
    it('should store original values when initialized in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'TEST123',
          effectiveDate: '2026-01-01',
          terminationDate: null
        }
      };

      component.ngOnInit();

      expect(component['originalValues']).toEqual({
        deviceType: 'EQUIP',
        driveProfileType: 'AMIC',
        code: 'TEST123',
        effectiveDate: '2026-01-01',
        terminationDate: null
      });
    });

    it('should not store original values in add mode', () => {
      component.mode = 'add';
      component.data = { record: {} };

      component.ngOnInit();

      expect(component['originalValues']).toEqual({
        deviceType: '',
        driveProfileType: '',
        code: '',
        effectiveDate: '',
        terminationDate: null
      });
    });

    it('should handle missing record data gracefully', () => {
      component.mode = 'edit';
      component.data = { record: {} };

      component.ngOnInit();

      expect(component['originalValues']).toEqual({
        deviceType: '',
        driveProfileType: '',
        code: '',
        effectiveDate: '',
        terminationDate: null
      });
    });

    it('should handle null values in record data', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: null,
          driveProfileType: null,
          code: null,
          effectiveDate: null
        }
      };

      component.ngOnInit();

      expect(component['originalValues']).toEqual({
        deviceType: '',
        driveProfileType: '',
        code: '',
        effectiveDate: '',
        terminationDate: null
      });
    });
  });

  describe('Create Payload (Add Mode - No OriginalCode)', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = { record: {} };
      mockService.createDriveProfile.and.returnValue(of({ message: 'Success' }));
      fixture.detectChanges();
    });

    it('should send DriveProfileCreateDto without OriginalCode in add mode', () => {
      const futureDate = moment().add(1, 'day');
      component.form.patchValue({
        deviceType: 'EQUIP',
        driveProfileType: 'AMIC',
        code: 'TEST123',
        effectiveDate: futureDate,
        terminationDate: null
      });

      component.onSave();

      expect(mockService.createDriveProfile).toHaveBeenCalledTimes(1);

      const callArgs = mockService.createDriveProfile.calls.mostRecent().args[0];
      expect(Object.keys(callArgs)).not.toContain('OriginalCode');
      expect(callArgs.deviceType).toBe('EQUIP');
      expect(callArgs.driveProfileType).toBe('AMIC');
      expect(callArgs.code).toBe('TEST123');
      expect(callArgs.effectiveDate).toBe(futureDate.format('YYYY-MM-DD'));
      expect(callArgs.terminationDate).toBeNull();
    });


  });

  describe('Update Payload (Edit Mode - With OriginalCode)', () => {
    beforeEach(() => {
      mockService.updateDriveProfile.and.returnValue(of({ message: 'Success' }));
    });

    it('should send DriveProfileUpdateDto with OriginalCode in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'ORIGINAL123',
          effectiveDate: '2026-01-01',
          terminationDate: null
        }
      };
      fixture.detectChanges();

      // Simulate user changing the code
      component.form.patchValue({
        code: 'UPDATED456',
        terminationDate: moment('2026-12-31')
      });

      component.onSave();

      expect(mockService.updateDriveProfile).toHaveBeenCalledTimes(1);

      const callArgs = mockService.updateDriveProfile.calls.mostRecent().args[0];
      expect(callArgs.OriginalCode).toBe('ORIGINAL123'); // Original value
      expect(callArgs.code).toBe('UPDATED456'); // Updated value
      expect(callArgs.deviceType).toBe('EQUIP');
      expect(callArgs.driveProfileType).toBe('AMIC');
      expect(callArgs.terminationDate).toBe('2026-12-31');
    });

    it('should use original values for disabled fields (deviceType, driveProfileType)', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'TEST123',
          effectiveDate: '2026-01-01',
          terminationDate: null
        }
      };
      fixture.detectChanges();

      // Update only termination date
      component.form.patchValue({
        terminationDate: moment('2026-12-31')
      });

      component.onSave();

      const callArgs = mockService.updateDriveProfile.calls.mostRecent().args[0];

      // Should use ORIGINAL values for disabled fields, not form values
      expect(callArgs.deviceType).toBe('EQUIP');
      expect(callArgs.driveProfileType).toBe('AMIC');
      expect(callArgs.OriginalCode).toBe('TEST123');
    });





    it('should include originalEffectiveDate in update payload (CRITICAL BUG FIX)', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'TEST123',
          effectiveDate: '2026-01-01',
          terminationDate: null
        }
      };
      fixture.detectChanges();

      // Update termination date
      component.form.patchValue({
        terminationDate: moment('2026-12-31')
      });

      component.onSave();

      const callArgs = mockService.updateDriveProfile.calls.mostRecent().args[0];
      expect(callArgs.originalEffectiveDate).toBe('2026-01-01');
      expect(callArgs.effectiveDate).toMatch(/2026-01-01/); // May have time component
    });

    it('should include originalEffectiveDate even when effective date is disabled', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'TEST123',
          effectiveDate: '2025-03-15',
          terminationDate: null
        }
      };
      fixture.detectChanges();

      // Verify effective date field is disabled in edit mode
      expect(component.form.get('effectiveDate')?.disabled).toBeTrue();

      // Update only termination date
      component.form.patchValue({
        terminationDate: moment('2026-12-31')
      });

      component.onSave();

      const callArgs = mockService.updateDriveProfile.calls.mostRecent().args[0];
      // Should still include originalEffectiveDate from stored original values
      expect(callArgs.originalEffectiveDate).toBe('2025-03-15');
    });

    it('should send complete composite key (deviceType, driveProfileType, code, originalEffectiveDate) for backend lookup', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'DPT26',
          effectiveDate: '2024-01-15',
          terminationDate: '2026-06-30'
        }
      };
      fixture.detectChanges();

      // Change termination date (the bug scenario from QA)
      component.form.patchValue({
        terminationDate: moment('2026-12-31')
      });

      component.onSave();

      const callArgs = mockService.updateDriveProfile.calls.mostRecent().args[0];

      // Verify all 4 composite key fields are present
      expect(callArgs.deviceType).toBe('EQUIP');
      expect(callArgs.driveProfileType).toBe('AMIC');
      expect(callArgs.OriginalCode).toBe('DPT26');
      expect(callArgs.originalEffectiveDate).toBe('2024-01-15');

      // Verify updated termination date
      expect(callArgs.terminationDate).toBe('2026-12-31');
    });
  });

  describe('Min Date (Chapter Date Based)', () => {
    it('should use chapter-aware minDate', () => {
      component.mode = 'add';
      fixture.detectChanges();

      expect(component.minDate).toBeDefined();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });

    it('should enforce termination date >= effective date via dateRangeInvalid', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const effectiveDate = moment(component.minDate).add(10, 'days');
      component.form.patchValue({ effectiveDate });

      // A termination date before effective date should fail validation
      component.form.patchValue({ terminationDate: moment(effectiveDate).subtract(1, 'day') });
      expect(component.form.errors).toBeTruthy();
      expect(component.form.errors?.['dateRangeInvalid']).toBeTrue();

      // A termination date equal to or after effective date should pass
      component.form.patchValue({ terminationDate: effectiveDate });
      expect(component.form.errors).toBeNull();
    });

    it('should allow termination date >= effective date in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      const effectiveDate = moment(component.minDate).add(5, 'days');
      component.form.patchValue({
        effectiveDate,
        terminationDate: moment(effectiveDate).add(3, 'days')
      });
      component.form.updateValueAndValidity();

      expect(component.form.hasError('dateRangeInvalid')).toBeFalse();
    });
  });

  describe('Edge Cases (OriginalCode Fix)', () => {
    beforeEach(() => {
      mockService.updateDriveProfile.and.returnValue(of({ message: 'Success' }));
    });



    it('should serialize dates correctly for API in update payload', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'TEST123',
          effectiveDate: '2026-01-01',
          terminationDate: null
        }
      };
      fixture.detectChanges();

      component.form.patchValue({
        terminationDate: moment('2026-12-31')
      });

      component.onSave();

      const callArgs = mockService.updateDriveProfile.calls.mostRecent().args[0];
      expect(callArgs.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/); // YYYY-MM-DD format
      expect(callArgs.terminationDate).toBe('2026-12-31'); // YYYY-MM-DD format
    });



    it('should preserve original values throughout form interactions', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'ORIGINAL',
          effectiveDate: '2026-01-01',
          terminationDate: null
        }
      };
      fixture.detectChanges();

      // Store initial original values
      const initialOriginalValues = { ...component['originalValues'] };

      // Change code multiple times
      component.form.patchValue({ code: 'CHANGE1' });
      component.form.patchValue({ code: 'CHANGE2' });
      component.form.patchValue({ code: 'FINAL' });

      // Original values should remain unchanged
      expect(component['originalValues']).toEqual(initialOriginalValues);
      expect(component['originalValues'].code).toBe('ORIGINAL');
      expect(component['originalValues'].effectiveDate).toBe('2026-01-01');
    });

    it('should preserve originalEffectiveDate throughout termination date changes', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          deviceType: 'EQUIP',
          driveProfileType: 'AMIC',
          code: 'DPT26',
          effectiveDate: '2024-03-14',
          terminationDate: '2026-06-30'
        }
      };
      fixture.detectChanges();

      const initialEffectiveDate = component['originalValues'].effectiveDate;

      // Change termination date multiple times (the typical edit scenario)
      component.form.patchValue({ terminationDate: moment('2026-09-30') });
      component.form.patchValue({ terminationDate: moment('2026-12-31') });

      // Original effective date should remain unchanged
      expect(component['originalValues'].effectiveDate).toBe(initialEffectiveDate);
      expect(component['originalValues'].effectiveDate).toBe('2024-03-14');
    });
  });

  describe('Date Field Tracking with distinctUntilChanged', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });









    it('should handle null to date transitions', (done) => {
      const date = moment('2026-04-21').toDate();

      component.form.get('effectiveDate')?.setValue(null);

      setTimeout(() => {
        component.form.get('effectiveDate')?.setValue(date);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('effective');
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
});
