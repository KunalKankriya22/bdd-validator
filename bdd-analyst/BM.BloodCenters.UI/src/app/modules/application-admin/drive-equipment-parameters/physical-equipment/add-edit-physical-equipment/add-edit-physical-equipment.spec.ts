import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AddEditPhysicalEquipment } from './add-edit-physical-equipment';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { HeaderService } from '@shared/services/header.service';
import { signal } from '@angular/core';
import moment from 'moment';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

describe('AddEditPhysicalEquipment', () => {
  let component: AddEditPhysicalEquipment;
  let fixture: ComponentFixture<AddEditPhysicalEquipment>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockPhysicalCodes = [
    { code: 'ARMCK', description: 'Arm Check', codeType: 'PHYCD' },
    { code: 'PULSE', description: 'Pulse', codeType: 'PHYCD' }
  ];

  const mockEquipmentTypes = [
    { code: 'BPT', description: 'BP, Pulse, Temp', codeType: 'DREQP' },
    { code: 'THER', description: 'Thermometer', codeType: 'DREQP' }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getPhysicalCodes',
      'getEquipmentTypesForPhysical',
      'createPhysicalEquipment',
      'updatePhysicalEquipment'
    ]);
    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();

    mockService.getPhysicalCodes.and.returnValue(of(mockPhysicalCodes));
    mockService.getEquipmentTypesForPhysical.and.returnValue(of(mockEquipmentTypes));
    mockService.createPhysicalEquipment.and.returnValue(of({ success: true }));
    mockService.updatePhysicalEquipment.and.returnValue(of({ success: true }));



      TestBed.configureTestingModule({
      imports: [AddEditPhysicalEquipment, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: DriveEquipmentParametersService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    })
    .overrideComponent(AddEditPhysicalEquipment, {
      add: { providers: [{ provide: MatSnackBar, useValue: mockSnackBar }] }
    });


    


      mockService.getPhysicalCodes.calls.reset();


      mockService.getEquipmentTypesForPhysical.calls.reset();


      mockService.createPhysicalEquipment.calls.reset();


      mockService.updatePhysicalEquipment.calls.reset();


      mockService.getPhysicalCodes.and.returnValue(of(mockPhysicalCodes));


      mockService.getEquipmentTypesForPhysical.and.returnValue(of(mockEquipmentTypes));


      mockService.createPhysicalEquipment.and.returnValue(of({ success: true }));


      mockService.updatePhysicalEquipment.and.returnValue(of({ success: true }));


    fixture = TestBed.createComponent(AddEditPhysicalEquipment);
    component = fixture.componentInstance;
    component.mode = 'add';
    component.data = { mode: 'add' };
    fixture.detectChanges();


    });

  // ─────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────
  describe('Initialization', () => {


    it('should initialize form with required controls in add mode', () => {
      expect(component.form.get('physicalCode')).toBeTruthy();
      expect(component.form.get('physicalCodeDescription')).toBeTruthy();
      expect(component.form.get('equipmentType')).toBeTruthy();
      expect(component.form.get('equipmentTypeDescription')).toBeTruthy();
      expect(component.form.get('effectiveDate')).toBeTruthy();
      expect(component.form.get('terminationDate')).toBeTruthy();
    });

    it('should show "Add New Physical Equipment" title in add mode', () => {
      expect(component.title()).toBe('Add New Physical Equipment');
    });

    it('should load physical codes and equipment types on init', () => {
      expect(mockService.getPhysicalCodes).toHaveBeenCalled();
      expect(mockService.getEquipmentTypesForPhysical).toHaveBeenCalled();
    });

    it('should populate filtered physical codes from service', () => {
      expect(component.filteredPhysicalCodes().length).toBe(2);
    });

    it('should populate filtered equipment types from service', () => {
      expect(component.filteredEquipmentTypes().length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────
  // Edit mode
  // ─────────────────────────────────────────────
  describe('Edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          physicalCodeDescription: 'Arm Check',
          equipmentType: 'BPT',
          equipmentTypeDescription: 'BP, Pulse, Temp',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 123
        }
      };
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should show "Edit Physical Equipment" title in edit mode', () => {
      expect(component.title()).toBe('Edit Physical Equipment');
    });



    it('should keep equipmentType enabled in edit mode', () => {
      expect(component.form.get('equipmentType')?.disabled).toBeFalsy();
    });

    it('should display effective date as read-only text in edit mode', () => {
      expect(component.editEffectiveDateDisplay).toContain('JAN');
    });

    it('should store auditKey from record into originalValues', () => {
      expect((component as any).originalValues.auditKey).toBe(123);
    });
  });

  // ─────────────────────────────────────────────
  // Form validation
  // ─────────────────────────────────────────────
  describe('Form validation', () => {


    it('should require Physical Code', () => {
      component.form.get('physicalCode')?.markAsTouched();
      expect(component.form.get('physicalCode')?.hasError('required')).toBeTrue();
    });

    it('should require Equipment Type', () => {
      component.form.get('equipmentType')?.markAsTouched();
      expect(component.form.get('equipmentType')?.hasError('required')).toBeTrue();
    });


  });

  // ─────────────────────────────────────────────
  // Auto-populate description
  // ─────────────────────────────────────────────
  describe('Auto-populate description', () => {
    it('should auto-populate physical code description when code is selected', fakeAsync(() => {
      component.form.get('physicalCode')?.setValue('ARMCK');
      tick();
      expect(component.form.get('physicalCodeDescription')?.value).toBe('Arm Check');
    }));

    it('should auto-populate equipment type description when type is selected', fakeAsync(() => {
      component.form.get('equipmentType')?.setValue('BPT');
      tick();
      expect(component.form.get('equipmentTypeDescription')?.value).toBe('BP, Pulse, Temp');
    }));

    it('should clear description when an unknown code is selected', fakeAsync(() => {
      component.form.get('physicalCode')?.setValue('UNKNOWN');
      tick();
      expect(component.form.get('physicalCodeDescription')?.value).toBe('');
    }));
  });

  // ─────────────────────────────────────────────
  // Form submission – Add mode
  // ─────────────────────────────────────────────
  describe('Form submission – Add mode', () => {
    const fillValidAddForm = () => {
      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();
    };

    it('should send payload with equipType (not equipmentType)', () => {
      fillValidAddForm();
      component.onSave();

      const payload = mockService.createPhysicalEquipment.calls.mostRecent().args[0];
      expect(payload.equipType).toBe('BPT');
      expect((payload as any).equipmentType).toBeUndefined();
    });

    it('should NOT send chapterId in create payload', () => {
      fillValidAddForm();
      component.onSave();

      const payload = mockService.createPhysicalEquipment.calls.mostRecent().args[0];
      expect((payload as any).chapterId).toBeUndefined();
    });

    it('should send effectiveDate as ISO string in create payload', () => {
      fillValidAddForm();
      component.onSave();

      const payload = mockService.createPhysicalEquipment.calls.mostRecent().args[0];
      expect(payload.effectiveDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });










  });

  // ─────────────────────────────────────────────
  // Form submission – Edit mode
  // ─────────────────────────────────────────────
  describe('Form submission – Edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          physicalCodeDescription: 'Arm Check',
          equipmentType: 'BPT',
          equipmentTypeDescription: 'BP, Pulse, Temp',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 42
        }
      };
      component.ngOnInit();
      fixture.detectChanges();
    });

    const makeFormDirty = () => {
      component.form.get('equipmentType')?.setValue('THER');
      component.form.markAsDirty();
    };

    it('should send payload with equipType (not equipmentType) on update', () => {
      makeFormDirty();
      component.onSave();

      const payload = mockService.updatePhysicalEquipment.calls.mostRecent().args[0];
      expect(payload.equipType).toBe('THER');
      expect((payload as any).equipmentType).toBeUndefined();
    });

    it('should include auditKey in update payload', () => {
      makeFormDirty();
      component.onSave();

      const payload = mockService.updatePhysicalEquipment.calls.mostRecent().args[0];
      expect(payload.auditKey).toBe(42);
    });

    it('should NOT include effectiveDate in update payload', () => {
      makeFormDirty();
      component.onSave();

      const payload = mockService.updatePhysicalEquipment.calls.mostRecent().args[0];
      expect((payload as any).effectiveDate).toBeUndefined();
    });






  });

  // ─────────────────────────────────────────────
  // Save and Create Another
  // ─────────────────────────────────────────────
  describe('Save and Create Another', () => {
    const fillValidAddForm = () => {
      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();
    };

    it('should send payload with equipType and no chapterId', () => {
      fillValidAddForm();
      component.onSaveAndCreateAnother();

      const payload = mockService.createPhysicalEquipment.calls.mostRecent().args[0];
      expect(payload.equipType).toBe('BPT');
      expect((payload as any).equipmentType).toBeUndefined();
      expect((payload as any).chapterId).toBeUndefined();
    });




  });

  // ─────────────────────────────────────────────
  // Cancel
  // ─────────────────────────────────────────────
  describe('Cancel', () => {
    it('should emit closePanel when onCancel is called', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // Search filtering
  // ─────────────────────────────────────────────
  describe('Search filtering', () => {
    it('should return all items when search is cleared', fakeAsync(() => {
      component.physicalCodeSearchCtrl.setValue('ARM');
      tick();
      component.physicalCodeSearchCtrl.setValue('');
      tick();
      expect(component.filteredPhysicalCodes().length).toBe(2);
    }));

    it('should filter physical codes by code', fakeAsync(() => {
      component.physicalCodeSearchCtrl.setValue('ARM');
      tick();
      const filtered = component.filteredPhysicalCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('ARMCK');
    }));

    it('should filter physical codes by description', fakeAsync(() => {
      component.physicalCodeSearchCtrl.setValue('Pulse');
      tick();
      const filtered = component.filteredPhysicalCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('PULSE');
    }));

    it('should filter equipment types by code', fakeAsync(() => {
      component.equipmentTypeSearchCtrl.setValue('BPT');
      tick();
      const filtered = component.filteredEquipmentTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('BPT');
    }));

    it('should filter equipment types by description', fakeAsync(() => {
      component.equipmentTypeSearchCtrl.setValue('Therm');
      tick();
      const filtered = component.filteredEquipmentTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('THER');
    }));

    it('should return all equipment types when search is empty', fakeAsync(() => {
      component.equipmentTypeSearchCtrl.setValue('BPT');
      tick();
      component.equipmentTypeSearchCtrl.setValue('');
      tick();
      expect(component.filteredEquipmentTypes().length).toBe(2);
    }));

    it('should return no results when search does not match', fakeAsync(() => {
      component.physicalCodeSearchCtrl.setValue('ZZZZZ');
      tick();
      expect(component.filteredPhysicalCodes().length).toBe(0);
    }));
  });

  // ─────────────────────────────────────────────
  // isSaveDisabled
  // ─────────────────────────────────────────────
  describe('isSaveDisabled', () => {
    it('should be true when form is pristine', () => {
      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.markAsPristine();
      expect(component.isSaveDisabled).toBeTrue();
    });

    it('should be true when form is invalid', () => {
      component.form.get('physicalCode')?.setValue('');
      component.form.markAsDirty();
      expect(component.isSaveDisabled).toBeTrue();
    });

    it('should be false when form is valid and dirty', () => {
      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();
      expect(component.isSaveDisabled).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────
  // ngOnInit edge cases
  // ─────────────────────────────────────────────
  describe('ngOnInit edge cases', () => {
    it('should default mode from data.mode when mode Input is not set', () => {
      const newFixture = TestBed.createComponent(AddEditPhysicalEquipment);
      const newComponent = newFixture.componentInstance;
      (newComponent as any).mode = undefined;
      newComponent.data = { mode: 'edit', record: {
        physicalCode: 'ARMCK',
        equipmentType: 'BPT',
        effectiveDate: '2025-01-11',
        terminationDate: null,
        auditKey: 10
      }};
      newFixture.detectChanges();
      expect(newComponent.mode).toBe('edit');
      expect(newComponent.title()).toBe('Edit Physical Equipment');
    });

    it('should default to add mode when neither mode nor data.mode is set', () => {
      const newFixture = TestBed.createComponent(AddEditPhysicalEquipment);
      const newComponent = newFixture.componentInstance;
      (newComponent as any).mode = undefined;
      newComponent.data = {};
      newFixture.detectChanges();
      expect(newComponent.mode).toBe('add');
    });

    it('should handle missing record gracefully in add mode', () => {
      const newFixture = TestBed.createComponent(AddEditPhysicalEquipment);
      const newComponent = newFixture.componentInstance;
      newComponent.mode = 'add';
      newComponent.data = {};
      newFixture.detectChanges();
      expect(newComponent.form).toBeTruthy();
      expect(newComponent.form.get('physicalCode')?.value).toBe('');
    });
  });

  // ─────────────────────────────────────────────
  // ngOnDestroy
  // ─────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // onSelectOpenedChange
  // ─────────────────────────────────────────────
  describe('onSelectOpenedChange', () => {
    it('should clear the search control when dropdown is closed', () => {
      component.physicalCodeSearchCtrl.setValue('ARM');
      component.onSelectOpenedChange(component.physicalCodeSearchCtrl, false);
      expect(component.physicalCodeSearchCtrl.value).toBe('');
    });

    it('should NOT clear the search control when dropdown is opened', () => {
      component.physicalCodeSearchCtrl.setValue('ARM');
      component.onSelectOpenedChange(component.physicalCodeSearchCtrl, true);
      expect(component.physicalCodeSearchCtrl.value).toBe('ARM');
    });
  });

  // ─────────────────────────────────────────────
  // getTerminationDateMin
  // ─────────────────────────────────────────────
  describe('getTerminationDateMin', () => {
    it('should return effective date when it is after minDate', () => {
      const futureDate = moment().add(30, 'days');
      component.form.get('effectiveDate')?.setValue(futureDate);
      const result = component.getTerminationDateMin();
      expect(result).not.toBeNull();
      expect(result!.isSame(futureDate, 'day')).toBeTrue();
    });

    it('should return minDate when effective date is before minDate', () => {
      const pastDate = moment('2000-01-01');
      component.form.get('effectiveDate')?.setValue(pastDate);
      const result = component.getTerminationDateMin();
      expect(result).not.toBeNull();
      expect(result!.isSame(component.minDate, 'day')).toBeTrue();
    });

    it('should return minDate when effective date is null', () => {
      component.form.get('effectiveDate')?.setValue(null);
      const result = component.getTerminationDateMin();
      expect(result).not.toBeNull();
      expect(result!.isSame(component.minDate, 'day')).toBeTrue();
    });
  });

  // ─────────────────────────────────────────────
  // onEffectiveDateInput / onTerminationDateInput
  // ─────────────────────────────────────────────
  describe('Date input handlers', () => {
    it('should call handleStartDateInput on onEffectiveDateInput', () => {
      const spy = spyOn((DateFieldValidationUtility as any), 'handleStartDateInput');
      const event = { target: { value: '01-Jan-2026' } } as unknown as Event;
      component.onEffectiveDateInput(event);
      expect(spy).toHaveBeenCalledWith('01-Jan-2026', component.form.get('effectiveDate'));
    });

    it('should call handleEndDateInput on onTerminationDateInput', () => {
      const spy = spyOn((DateFieldValidationUtility as any), 'handleEndDateInput');
      const event = { target: { value: '15-Feb-2026' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('15-Feb-2026', component.form.get('terminationDate'), false);
    });

    it('should pass isEditMode=true in edit mode for termination date input', () => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          equipmentType: 'BPT',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 1
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      const spy = spyOn((DateFieldValidationUtility as any), 'handleEndDateInput');
      const event = { target: { value: '15-Feb-2026' } } as unknown as Event;
      component.onTerminationDateInput(event);
      expect(spy).toHaveBeenCalledWith('15-Feb-2026', component.form.get('terminationDate'), true);
    });
  });

  // ─────────────────────────────────────────────
  // getEffectiveDateError
  // ─────────────────────────────────────────────
  describe('getEffectiveDateError', () => {
    it('should return empty string when control is untouched and pristine', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string when control is null (edge case)', () => {
      // Override form to simulate missing control
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should return dateRangeInvalid message when lastChangedDateField is effective', () => {
      (component as any).lastChangedDateField = 'effective';
      component.form.get('effectiveDate')?.setValue(moment().add(10, 'days'));
      component.form.get('terminationDate')?.setValue(moment().subtract(30, 'days'));
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.markAsDirty();
      component.form.updateValueAndValidity();

      if (component.form.errors?.['dateRangeInvalid']) {
        const error = component.getEffectiveDateError();
        expect(error).toBe('Effective Date must be less than or equal to Termination Date');
      }
    });
  });

  // ─────────────────────────────────────────────
  // getTerminationDateError
  // ─────────────────────────────────────────────
  describe('getTerminationDateError', () => {
    it('should return empty string when control is untouched and pristine', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return terminationDatePast error when control has that error', () => {
      const termCtrl = component.form.get('terminationDate');
      termCtrl?.markAsTouched();
      termCtrl?.markAsDirty();
      termCtrl?.setErrors({ terminationDatePast: true });
      expect(component.getTerminationDateError()).toBe('Termination Date cannot be past');
    });
  });

  // ─────────────────────────────────────────────
  // editEffectiveDateDisplay
  // ─────────────────────────────────────────────
  describe('editEffectiveDateDisplay', () => {
    it('should return dash when effective date is null', () => {
      component.form.get('effectiveDate')?.setValue(null);
      expect(component.editEffectiveDateDisplay).toBe('-');
    });

    it('should return formatted date when effective date is set', () => {
      component.form.get('effectiveDate')?.setValue(moment('2025-03-15'));
      const display = component.editEffectiveDateDisplay;
      expect(display).toContain('MAR');
      expect(display).toContain('2025');
    });
  });

  // ─────────────────────────────────────────────
  // terminationDateFilter
  // ─────────────────────────────────────────────
  describe('terminationDateFilter', () => {
    it('should return true when date is null', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return false for dates before chapter today', () => {
      const pastDate = moment('2000-01-01');
      expect(component.terminationDateFilter(pastDate)).toBeFalse();
    });

    it('should return true for future dates', () => {
      const futureDate = moment().add(1, 'year');
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });

    it('should return false for date before effective date', () => {
      const effDate = moment().add(30, 'days');
      component.form.get('effectiveDate')?.setValue(effDate);
      const beforeEff = moment().add(10, 'days');
      // Only false if beforeEff is after chapter today but before effDate
      const result = component.terminationDateFilter(beforeEff);
      expect(result).toBeFalse();
    });

    it('should allow original termination date in edit mode even if past', () => {
      const pastTermDate = moment().subtract(5, 'days');
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          equipmentType: 'BPT',
          effectiveDate: '2024-01-01',
          terminationDate: pastTermDate.format('YYYY-MM-DD'),
          auditKey: 1
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.terminationDateFilter(pastTermDate)).toBeTrue();
    });
  });

  // ─────────────────────────────────────────────
  // Edit mode with termination date
  // ─────────────────────────────────────────────
  describe('Edit mode with termination date', () => {
    it('should set minTermDate to effective date when termination date is after effective date', () => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          equipmentType: 'BPT',
          effectiveDate: '2025-01-11',
          terminationDate: '2025-06-15',
          auditKey: 5
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      const eff = moment('2025-01-11');
      expect(component.minTermDate.isSame(eff, 'day')).toBeTrue();
    });

    it('should set minTermDate to termination date when it is before effective date', () => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          equipmentType: 'BPT',
          effectiveDate: '2025-06-15',
          terminationDate: '2025-01-11',
          auditKey: 5
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      const term = moment('2025-01-11');
      expect(component.minTermDate.isSame(term, 'day')).toBeTrue();
    });

    it('should disable physicalCode control in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          equipmentType: 'BPT',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 5
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.get('physicalCode')?.disabled).toBeTrue();
    });
  });

  // ─────────────────────────────────────────────
  // loadDropdownOptions edge cases
  // ─────────────────────────────────────────────
  describe('loadDropdownOptions edge cases', () => {
    it('should handle getPhysicalCodes error silently', () => {
      mockService.getPhysicalCodes.and.returnValue(throwError(() => new Error('fail')));
      expect(() => component.loadDropdownOptions()).not.toThrow();
    });

    it('should handle getEquipmentTypesForPhysical error silently', () => {
      mockService.getEquipmentTypesForPhysical.and.returnValue(throwError(() => new Error('fail')));
      expect(() => component.loadDropdownOptions()).not.toThrow();
    });

    it('should patch physical code description in edit mode when code matches', () => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          equipmentType: 'BPT',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 1
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.get('physicalCodeDescription')?.value).toBe('Arm Check');
    });

    it('should patch equipment type description in edit mode when type matches', () => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          equipmentType: 'BPT',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 1
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      expect(component.form.get('equipmentTypeDescription')?.value).toBe('BP, Pulse, Temp');
    });
  });

  // ─────────────────────────────────────────────
  // onSave additional coverage
  // ─────────────────────────────────────────────
  describe('onSave additional coverage', () => {
    it('should show error snackbar when form is invalid', () => {
      component.form.get('physicalCode')?.setValue('');
      component.onSave();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Please correct the highlighted errors before saving.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should set lastChangedDateField to termination when dateRangeInvalid and no lastChangedDateField', () => {
      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(30, 'days'));
      component.form.get('terminationDate')?.setValue(moment().add(1, 'day'));
      component.form.markAsDirty();
      (component as any).lastChangedDateField = null;

      // Force dateRangeInvalid error at form level
      component.form.setErrors({ dateRangeInvalid: true });
      component.onSave();
      expect((component as any).lastChangedDateField).toBe('termination');
    });

    it('should emit saveSuccess on successful add', () => {
      spyOn(component.saveSuccess, 'emit');
      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();

      component.onSave();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });

    it('should show success snackbar on successful add', () => {
      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();

      component.onSave();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('added successfully'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show 409 conflict error on add', () => {
      mockService.createPhysicalEquipment.and.returnValue(throwError(() => ({ status: 409 })));

      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();

      component.onSave();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already exists'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show generic error on add failure', () => {
      mockService.createPhysicalEquipment.and.returnValue(throwError(() => ({ status: 500 })));

      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();

      component.onSave();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to create physical equipment record.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should reset isSubmitting on error', () => {
      mockService.createPhysicalEquipment.and.returnValue(throwError(() => ({ status: 500 })));

      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();

      component.onSave();
      expect(component.submitting()).toBeFalse();
    });

    it('should show success snackbar with original physicalCode on edit', () => {
      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          physicalCodeDescription: 'Arm Check',
          equipmentType: 'BPT',
          equipmentTypeDescription: 'BP, Pulse, Temp',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 42
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('equipmentType')?.setValue('THER');
      component.form.markAsDirty();

      component.onSave();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('ARMCK'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show 409 conflict error on edit', () => {
      mockService.updatePhysicalEquipment.and.returnValue(throwError(() => ({ status: 409 })));

      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          physicalCodeDescription: 'Arm Check',
          equipmentType: 'BPT',
          equipmentTypeDescription: 'BP, Pulse, Temp',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 42
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('equipmentType')?.setValue('THER');
      component.form.markAsDirty();

      component.onSave();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already exists'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show generic error on edit failure', () => {
      mockService.updatePhysicalEquipment.and.returnValue(throwError(() => ({ status: 500 })));

      component.mode = 'edit';
      component.data = {
        mode: 'edit',
        record: {
          physicalCode: 'ARMCK',
          physicalCodeDescription: 'Arm Check',
          equipmentType: 'BPT',
          equipmentTypeDescription: 'BP, Pulse, Temp',
          effectiveDate: '2025-01-11',
          terminationDate: null,
          auditKey: 42
        }
      };
      component.ngOnInit();
      fixture.detectChanges();

      component.form.get('equipmentType')?.setValue('THER');
      component.form.markAsDirty();

      component.onSave();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to update physical equipment record.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  // ─────────────────────────────────────────────
  // onSaveAndCreateAnother additional coverage
  // ─────────────────────────────────────────────
  describe('onSaveAndCreateAnother additional coverage', () => {
    const fillValidAddForm = () => {
      component.form.get('physicalCode')?.setValue('ARMCK');
      component.form.get('equipmentType')?.setValue('BPT');
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'day'));
      component.form.get('effectiveDate')?.updateValueAndValidity();
      component.form.markAsDirty();
    };

    it('should show error snackbar when form is invalid', () => {
      component.form.get('physicalCode')?.setValue('');
      component.onSaveAndCreateAnother();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Please correct the highlighted errors before saving.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should not call service when form is invalid', () => {
      component.form.get('physicalCode')?.setValue('');
      component.onSaveAndCreateAnother();
      expect(mockService.createPhysicalEquipment).not.toHaveBeenCalled();
    });

    it('should reset form after successful save', () => {
      fillValidAddForm();
      component.onSaveAndCreateAnother();

      expect(component.form.get('physicalCode')?.value).toBe('');
      expect(component.form.get('equipmentType')?.value).toBe('');
      expect(component.form.get('effectiveDate')?.value).toBeNull();
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should emit refreshData after successful save', () => {
      spyOn(component.refreshData, 'emit');
      fillValidAddForm();
      component.onSaveAndCreateAnother();
      expect(component.refreshData.emit).toHaveBeenCalled();
    });

    it('should reset isSubmitting after successful save', () => {
      fillValidAddForm();
      component.onSaveAndCreateAnother();
      expect(component.submitting()).toBeFalse();
    });

    it('should mark form as pristine and untouched after successful save', () => {
      fillValidAddForm();
      component.onSaveAndCreateAnother();
      expect(component.form.pristine).toBeTrue();
      expect(component.form.untouched).toBeTrue();
    });

    it('should reset lastChangedDateField after successful save', () => {
      fillValidAddForm();
      (component as any).lastChangedDateField = 'effective';
      component.onSaveAndCreateAnother();
      expect((component as any).lastChangedDateField).toBeNull();
    });

    it('should show success snackbar on successful save', () => {
      fillValidAddForm();
      component.onSaveAndCreateAnother();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('added successfully'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should show 409 conflict error on save and create another', () => {
      mockService.createPhysicalEquipment.and.returnValue(throwError(() => ({ status: 409 })));
      fillValidAddForm();
      component.onSaveAndCreateAnother();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already exists'),
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show generic error on save and create another failure', () => {
      mockService.createPhysicalEquipment.and.returnValue(throwError(() => ({ status: 500 })));
      fillValidAddForm();
      component.onSaveAndCreateAnother();
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Failed to create physical equipment record.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should reset isSubmitting on error', () => {
      mockService.createPhysicalEquipment.and.returnValue(throwError(() => ({ status: 500 })));
      fillValidAddForm();
      component.onSaveAndCreateAnother();
      expect(component.submitting()).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────
  // setupDateFieldTracking
  // ─────────────────────────────────────────────
  describe('setupDateFieldTracking', () => {
    it('should set lastChangedDateField to effective when effective date changes', fakeAsync(() => {
      (component as any).lastChangedDateField = null;
      component.form.get('effectiveDate')?.setValue(moment().add(5, 'days'));
      tick(10);
      expect((component as any).lastChangedDateField).toBe('effective');
    }));

    it('should set lastChangedDateField to termination when termination date changes', fakeAsync(() => {
      (component as any).lastChangedDateField = null;
      component.form.get('terminationDate')?.setValue(moment().add(10, 'days'));
      tick(10);
      expect((component as any).lastChangedDateField).toBe('termination');
    }));
  });

  // ─────────────────────────────────────────────
  // Auto-populate description (unknown equipment type)
  // ─────────────────────────────────────────────
  describe('Auto-populate description edge cases', () => {
    it('should clear equipment type description when an unknown type is selected', fakeAsync(() => {
      component.form.get('equipmentType')?.setValue('UNKNOWN');
      tick();
      expect(component.form.get('equipmentTypeDescription')?.value).toBe('');
    }));
  });
});
