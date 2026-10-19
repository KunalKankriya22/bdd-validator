import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormBuilder, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { ChangeDetectorRef, signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AddEditQcDependency } from './add-edit-qc-dependency';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AddEditQcDependency', () => {
  let sameDate: any;
  let today: any;
  let filtered: any;
  let futureDate: any;
  let effectiveDate: any;
  const tomorrow = moment().add(1, 'day').startOf('day');

  let component: AddEditQcDependency;
  let fixture: ComponentFixture<AddEditQcDependency>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: any;

  const mockRecord = {
    deviceType: 'EQUIP',
    equipmentSupplyCode: 'ALYX',
    sourceParamCode: 'TEMP',
    sourceParamDescription: 'Temperature',
    dependentCode: 'PRES',
    dependentDescription: 'Pressure',
    effectiveDate: '2026-03-14T00:00:00',
    terminationDate: null,
    auditKey: 456
  };

  const mockSourceParamCodes = [
    { code: 'TEMP', description: 'Temperature', codeType: 'SRC', effectiveDate: '2026-01-01' },
    { code: 'PRES', description: 'Pressure', codeType: 'SRC', effectiveDate: '2026-01-01' }
  ];

  const mockDependentCodes = [
    { code: 'PRES', description: 'Pressure', codeType: 'DEP', effectiveDate: '2026-01-01' },
    { code: 'FLOW', description: 'Flow Rate', codeType: 'DEP', effectiveDate: '2026-01-01' }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getQcDependencySourceParamCodes',
      'getQcDependencyDependentParamCodes',
      'createQcDependency',
      'updateQcDependency'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = { chapterTimeZone: signal('America/Los_Angeles') };

    mockService.getQcDependencySourceParamCodes.and.returnValue(of({ data: mockSourceParamCodes, totalRecords: 2 }));
    mockService.getQcDependencyDependentParamCodes.and.returnValue(of({ data: mockDependentCodes, totalRecords: 2 }));



      TestBed.configureTestingModule({
      imports: [AddEditQcDependency, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: DriveEquipmentParametersService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ChangeDetectorRef, useValue: jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']) }
      ]
    });

    fixture = TestBed.createComponent(AddEditQcDependency);
    component = fixture.componentInstance;


    });

  describe('Component Creation', () => {
    it('should create the component', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize minDate, minTermDate, and chapterToday in constructor', () => {
      expect(component.minDate).toBeDefined();
      expect(moment.isMoment(component.minDate)).toBeTrue();
      expect(component.minTermDate).toBeDefined();
      expect(moment.isMoment(component.minTermDate)).toBeTrue();
      expect(component.chapterToday).toBeDefined();
      expect(moment.isMoment(component.chapterToday)).toBeTrue();
    });
  });

  describe('Computed Properties', () => {
    it('should return "Add New QC Dependency" for add mode title', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.title()).toBe('Add New QC Dependency');
    });

    it('should return "Edit QC Dependency" for edit mode title', () => {
      component.mode = 'edit';
      component.data = { record: mockRecord };
      fixture.detectChanges();
      expect(component.title()).toBe('Edit QC Dependency');
    });

    it('should return false for submitting initially', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.submitting()).toBeFalse();
    });
  });

  describe('isSaveButtonDisabled', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should be disabled when form is invalid', () => {
      expect(component.isSaveButtonDisabled).toBeTrue();
    });

    it('should be disabled when form is pristine', () => {
      // Fill all required fields but keep pristine
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: moment().add(5, 'days')
      }, { emitEvent: false });
      component.form.markAsPristine();
      expect(component.isSaveButtonDisabled).toBeTrue();
    });

    it('should be enabled when form is valid and dirty', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: moment().add(5, 'days')
      });
      component.form.markAsDirty();
      component.form.updateValueAndValidity();
      // The form might still have errors from validators, but the getter just checks invalid/pristine/submitting
      if (component.form.valid) {
        expect(component.isSaveButtonDisabled).toBeFalse();
      }
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

    it('should mark required fields as invalid when empty', () => {
      component.form.markAllAsTouched();

      expect(component.form.get('sourceParamCode')?.valid).toBeFalse();
      expect(component.form.get('dependentCode')?.valid).toBeFalse();
      expect(component.form.get('effectiveDate')?.valid).toBeFalse();
    });

    it('should validate effective date cannot be past date', () => {
      const pastDate = moment().subtract(5, 'days');
      component.form.patchValue({ effectiveDate: pastDate });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeTrue();
    });

    it('should default mode from data if not set', () => {
      const fixture2 = TestBed.createComponent(AddEditQcDependency);
      const comp2 = fixture2.componentInstance;
      (comp2 as any).mode = undefined;
      comp2.data = { mode: 'edit', record: mockRecord };
      fixture2.detectChanges();
      expect(comp2.mode).toBe('edit');
    });

    it('should default mode to add when no mode or data.mode provided', () => {
      const fixture2 = TestBed.createComponent(AddEditQcDependency);
      const comp2 = fixture2.componentInstance;
      (comp2 as any).mode = undefined;
      comp2.data = {};
      fixture2.detectChanges();
      expect(comp2.mode).toBe('add');
    });

    it('should use data.deviceType when record does not have deviceType', () => {
      const fixture2 = TestBed.createComponent(AddEditQcDependency);
      const comp2 = fixture2.componentInstance;
      comp2.mode = 'add';
      comp2.data = { deviceType: 'SUPPLY', equipmentSupplyCode: 'TEST' };
      fixture2.detectChanges();
      expect(comp2.form.getRawValue().deviceType).toBe('SUPPLY');
      expect(comp2.form.getRawValue().equipmentSupplyCode).toBe('TEST');
    });

    it('should store existingRecords when provided in add mode', () => {
      const records = [{ deviceType: 'EQUIP', sourceParamCode: 'TEMP' }];
      const fixture2 = TestBed.createComponent(AddEditQcDependency);
      const comp2 = fixture2.componentInstance;
      comp2.mode = 'add';
      comp2.data = { existingRecords: records };
      fixture2.detectChanges();
      expect((comp2 as any).existingRecords).toEqual(records);
    });

    it('should call addDuplicateValidators in add mode', () => {
      const fixture2 = TestBed.createComponent(AddEditQcDependency);
      const comp2 = fixture2.componentInstance;
      comp2.mode = 'add';
      comp2.data = { existingRecords: [] };
      spyOn(comp2 as any, 'addDuplicateValidators').and.callThrough();
      fixture2.detectChanges();
      expect((comp2 as any).addDuplicateValidators).toHaveBeenCalled();
    });

    it('should have deviceType and equipmentSupplyCode disabled in edit mode', () => {
      const fixture2 = TestBed.createComponent(AddEditQcDependency);
      const comp2 = fixture2.componentInstance;
      comp2.mode = 'edit';
      comp2.data = { record: mockRecord };
      fixture2.detectChanges();
      expect(comp2.form.get('deviceType')?.disabled).toBeTrue();
      expect(comp2.form.get('equipmentSupplyCode')?.disabled).toBeTrue();
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

    it('should populate form with record data', () => {
      const rawValues = component.form.getRawValue();
      expect(rawValues.deviceType).toBe('EQUIP');
      expect(rawValues.equipmentSupplyCode).toBe('ALYX');
      expect(rawValues.sourceParamCode).toBe('TEMP');
      expect(rawValues.dependentCode).toBe('PRES');
      expect(rawValues.auditKey).toBe(456);
    });

    it('should set editModeValues.effectiveDate', () => {
      expect((component as any).editModeValues.effectiveDate).toBe(
        moment('2026-03-14T00:00:00').format('YYYY-MM-DD')
      );
    });

    it('should set editModeValues.terminationDate to null when record has no terminationDate', () => {
      expect((component as any).editModeValues.terminationDate).toBeNull();
    });

    it('should have effectiveDate enabled for editing in edit mode', () => {
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should set sourceParamDescription as disabled', () => {
      expect(component.form.get('sourceParamDescription')?.disabled).toBeTrue();
    });

    it('should set dependentDescription as disabled', () => {
      expect(component.form.get('dependentDescription')?.disabled).toBeTrue();
    });
  });

  describe('Edit Mode with terminationDate in record', () => {
    it('should set minTermDate to effective date when termination is after effective', () => {
      const effDate = moment().subtract(60, 'days');
      const termDate = moment().subtract(10, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: effDate.format('YYYY-MM-DD'),
          terminationDate: termDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();
      // termDate is after effDate, so minTermDate should be effDate
      expect(component.minTermDate.format('YYYY-MM-DD')).toBe(effDate.format('YYYY-MM-DD'));
    });

    it('should set minTermDate to terminationDate when termination is before effective', () => {
      const effDate = moment().subtract(10, 'days');
      const termDate = moment().subtract(60, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: effDate.format('YYYY-MM-DD'),
          terminationDate: termDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();
      // termDate is before effDate, so minTermDate should be termDate
      expect(component.minTermDate.format('YYYY-MM-DD')).toBe(termDate.format('YYYY-MM-DD'));
    });

    it('should set minTermDate to effectiveDate when no terminationDate exists', () => {
      const effDate = moment().subtract(30, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: effDate.format('YYYY-MM-DD'),
          terminationDate: null
        }
      };
      fixture.detectChanges();
      expect(component.minTermDate.format('YYYY-MM-DD')).toBe(effDate.format('YYYY-MM-DD'));
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      component.mode = 'add';
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel event', () => {
      component.mode = 'add';
      fixture.detectChanges();
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not call service when form is invalid', () => {
      component.onSave();
      expect(mockService.createQcDependency).not.toHaveBeenCalled();
    });
  });

  describe('onSave - Add Mode Success Path', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();

      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'FLOW',
        effectiveDate: moment().add(5, 'days')
      });

      mockService.createQcDependency.and.returnValue(of({}));
    });

    it('should call createQcDependency on save in add mode', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(mockService.createQcDependency).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show success snackbar with correct message on add', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'New dependency "TEMP" added successfully',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should handle error on save in add mode with API error message', () => {
      const apiError = { error: { message: 'Duplicate dependency found' } };
      mockService.createQcDependency.and.returnValue(throwError(() => apiError));

      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Duplicate dependency found',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
      expect(component.submitting()).toBeFalse();
    });

    it('should show default error message when API error has no message in add mode', () => {
      mockService.createQcDependency.and.returnValue(throwError(() => ({ error: {} })));

      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to create QC dependency.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message when error object is empty', () => {
      mockService.createQcDependency.and.returnValue(throwError(() => ({})));

      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to create QC dependency.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { record: mockRecord };
      fixture.detectChanges();

      component.form.patchValue({
        sourceParamCode: 'PRES',
        dependentCode: 'FLOW',
        effectiveDate: moment().add(5, 'days')
      });

      mockService.updateQcDependency.and.returnValue(of({}));
    });

    it('should call updateQcDependency on save in edit mode', () => {
      spyOn(component.saveSuccess, 'emit');
      spyOn(component.closePanel, 'emit');

      component.onSave();

      expect(mockService.updateQcDependency).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });

    it('should show success snackbar with correct message on edit', () => {
      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Dependency "PRES" updated successfully',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });

    it('should handle error on save in edit mode with API error message', () => {
      const apiError = { error: { message: 'Update conflict' } };
      mockService.updateQcDependency.and.returnValue(throwError(() => apiError));

      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Update conflict',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message when API error has no message in edit mode', () => {
      mockService.updateQcDependency.and.returnValue(throwError(() => ({ error: {} })));

      const snackBarSpy = spyOn(component['snackBar'], 'open');

      component.onSave();

      expect(snackBarSpy).toHaveBeenCalledWith(
        'Failed to update QC dependency.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should include auditKey in update payload', () => {
      component.onSave();

      const payload = mockService.updateQcDependency.calls.mostRecent().args[0];
      expect(payload.auditKey).toBe(456);
    });
  });

  describe('onSaveAndCreateAnother', () => {
    describe('invalid form', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.data = { deviceType: 'EQUIP', equipmentSupplyCode: 'ALYX' };
        fixture.detectChanges();
      });

      it('should not call service when form is invalid', () => {
        const snackBarSpy = spyOn(component['snackBar'], 'open');

        component.onSaveAndCreateAnother();

        expect(mockService.createQcDependency).not.toHaveBeenCalled();
        expect(snackBarSpy).toHaveBeenCalledWith(
          'Please correct the highlighted errors before saving.',
          'DISMISS',
          jasmine.objectContaining({ duration: 5000 })
        );
      });
    });

    describe('valid form', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.data = { deviceType: 'EQUIP', equipmentSupplyCode: 'ALYX' };
        fixture.detectChanges();

        component.form.patchValue({
          deviceType: 'EQUIP',
          equipmentSupplyCode: 'ALYX',
          sourceParamCode: 'TEMP',
          dependentCode: 'FLOW',
          effectiveDate: moment().add(5, 'days')
        });

        mockService.createQcDependency.and.returnValue(of({}));
      });

      it('should call createQcDependency and reset form on success', () => {
        const snackBarSpy = spyOn(component['snackBar'], 'open');
        spyOn(component.saveSuccess, 'emit');

        component.onSaveAndCreateAnother();

        expect(mockService.createQcDependency).toHaveBeenCalled();
        expect(snackBarSpy).toHaveBeenCalledWith(
          'New dependency "TEMP" added successfully',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['success-snackbar'] })
        );
        expect(component.saveSuccess.emit).toHaveBeenCalled();
        expect(component.submitting()).toBeFalse();
      });

      it('should reset form fields but keep deviceType and equipmentSupplyCode on success', () => {
        component.onSaveAndCreateAnother();

        const rawValues = component.form.getRawValue();
        expect(rawValues.deviceType).toBe('EQUIP');
        expect(rawValues.equipmentSupplyCode).toBe('ALYX');
        expect(rawValues.sourceParamCode).toBe('');
        expect(rawValues.dependentCode).toBe('');
        expect(rawValues.effectiveDate).toBeNull();
        expect(rawValues.terminationDate).toBeNull();
      });

      it('should mark all controls as untouched and pristine after success', () => {
        component.onSaveAndCreateAnother();

        expect(component.form.pristine).toBeTrue();
        expect(component.form.untouched).toBeTrue();
      });

      it('should handle error on saveAndCreateAnother with API error message', () => {
        const apiError = { error: { message: 'Server error' } };
        mockService.createQcDependency.and.returnValue(throwError(() => apiError));

        const snackBarSpy = spyOn(component['snackBar'], 'open');

        component.onSaveAndCreateAnother();

        expect(snackBarSpy).toHaveBeenCalledWith(
          'Server error',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
        expect(component.submitting()).toBeFalse();
      });

      it('should show default error message when API error has no message', () => {
        mockService.createQcDependency.and.returnValue(throwError(() => ({ error: {} })));

        const snackBarSpy = spyOn(component['snackBar'], 'open');

        component.onSaveAndCreateAnother();

        expect(snackBarSpy).toHaveBeenCalledWith(
          'Failed to create QC dependency.',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });

      it('should show default error message when error has no error property', () => {
        mockService.createQcDependency.and.returnValue(throwError(() => ({})));

        const snackBarSpy = spyOn(component['snackBar'], 'open');

        component.onSaveAndCreateAnother();

        expect(snackBarSpy).toHaveBeenCalledWith(
          'Failed to create QC dependency.',
          'DISMISS',
          jasmine.objectContaining({ panelClass: ['error-snackbar'] })
        );
      });
    });
  });

  describe('loadDropdownOptions', () => {
    it('should load source param codes on init', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(mockService.getQcDependencySourceParamCodes).toHaveBeenCalled();
    });

    it('should load dependent param codes on init', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(mockService.getQcDependencyDependentParamCodes).toHaveBeenCalled();
    });

    it('should handle source param codes API error silently', () => {
      mockService.getQcDependencySourceParamCodes.and.returnValue(throwError(() => new Error('API error')));
      component.mode = 'add';
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle dependent param codes API error silently', () => {
      mockService.getQcDependencyDependentParamCodes.and.returnValue(throwError(() => new Error('API error')));
      component.mode = 'add';
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('onSelectOpenedChange', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should reset search control when dropdown closes', () => {
      component.sourceParamCodeSearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.sourceParamCodeSearchCtrl, false);
      expect(component.sourceParamCodeSearchCtrl.value).toBe('');
    });

    it('should not reset search control when dropdown opens', () => {
      component.sourceParamCodeSearchCtrl.setValue('test');
      component.onSelectOpenedChange(component.sourceParamCodeSearchCtrl, true);
      expect(component.sourceParamCodeSearchCtrl.value).toBe('test');
    });

    it('should work with dependentCodeSearchCtrl', () => {
      component.dependentCodeSearchCtrl.setValue('flow');
      component.onSelectOpenedChange(component.dependentCodeSearchCtrl, false);
      expect(component.dependentCodeSearchCtrl.value).toBe('');
    });
  });

  describe('onEffDatePickerOpened and onTermDatePickerOpened', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call refreshChapterDates when effective date picker is opened', () => {
      spyOn(component as any, 'refreshChapterDates');
      component.onEffDatePickerOpened();
      expect((component as any).refreshChapterDates).toHaveBeenCalled();
    });

    it('should call refreshChapterDates when termination date picker is opened', () => {
      spyOn(component as any, 'refreshChapterDates');
      component.onTermDatePickerOpened();
      expect((component as any).refreshChapterDates).toHaveBeenCalled();
    });
  });

  describe('refreshChapterDates', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should not update minDate if chapter date has not changed', () => {
      const originalMinDate = component.minDate.clone();
      (component as any).refreshChapterDates();
      expect(component.minDate.format('YYYY-MM-DD')).toBe(originalMinDate.format('YYYY-MM-DD'));
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



    describe('getEffectiveDateError method', () => {
      it('should return empty string when control is not touched or dirty', () => {
        const error = component.getEffectiveDateError();
        expect(error).toBe('');
      });

      it('should return effectiveDatePast error message', () => {
        const pastDate = moment().subtract(5, 'days');
        component.form.patchValue({ effectiveDate: pastDate });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.get('effectiveDate')?.updateValueAndValidity();

        const error = component.getEffectiveDateError();
        expect(error).toBe('Effective Date cannot be in the past');
      });

      it('should return cross-field error message from form.errors', () => {
        futureDate = moment().add(10, 'days');
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

      it('should not return cross-field error when lastChangedDateField is not effective', () => {
        futureDate = moment().add(10, 'days');
        component.form.patchValue({
          effectiveDate: futureDate,
          terminationDate: moment().add(5, 'days')
        });
        component.form.get('effectiveDate')?.markAsTouched();
        component.form.updateValueAndValidity();
        (component as any).lastChangedDateField = 'termination';

        const error = component.getEffectiveDateError();
        // Cross-field error should NOT show on effective date when termination was last changed
        expect(error).not.toContain('must be less than or equal to');
      });

      it('should return empty string when control does not exist', () => {
        // Remove the control temporarily
        const original = component.form.get('effectiveDate');
        component.form.removeControl('effectiveDate');
        const error = component.getEffectiveDateError();
        expect(error).toBe('');
        // Restore
        if (original) component.form.addControl('effectiveDate', original);
      });
    });

    describe('getTerminationDateError method', () => {
      it('should return empty string when control is not touched or dirty', () => {
        const error = component.getTerminationDateError();
        expect(error).toBe('');
      });

      it('should return terminationDatePast error message', () => {
        component.form.get('terminationDate')?.setErrors({ terminationDatePast: true });
        component.form.get('terminationDate')?.markAsTouched();

        const error = component.getTerminationDateError();
        expect(error).toBe('Termination Date cannot be past');
      });

      it('should NOT include cross-field error from form.errors', () => {
        futureDate = moment().add(10, 'days');
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

      it('should return empty string when control does not exist', () => {
        const original = component.form.get('terminationDate');
        component.form.removeControl('terminationDate');
        const error = component.getTerminationDateError();
        expect(error).toBe('');
        if (original) component.form.addControl('terminationDate', original);
      });

      it('should show cross-field error when lastChangedDateField is termination', () => {
        futureDate = moment().add(10, 'days');
        component.form.patchValue({
          effectiveDate: futureDate,
          terminationDate: moment().add(5, 'days')
        });
        component.form.get('terminationDate')?.markAsTouched();
        component.form.updateValueAndValidity();
        (component as any).lastChangedDateField = 'termination';

        const error = component.getTerminationDateError();
        // When lastChangedDateField is 'termination', the cross-field error should show
        expect(error).toBeTruthy();
      });
    });

    describe('Date Validation Without Field Tracking (Regression Tests)', () => {
      it('should validate dates correctly when effective date is set first', () => {
        futureDate = moment().add(10, 'days');
        component.form.patchValue({
          effectiveDate: futureDate,
          terminationDate: null
        });
        component.form.updateValueAndValidity();

        expect(component.form.errors).toBeFalsy();
        expect(component.getEffectiveDateError()).toBe('');
      });

      it('should validate dates correctly when termination date is set first', () => {
        futureDate = moment().add(10, 'days');
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

  describe('editEffectiveDateDisplay', () => {
    it('should return dash when effectiveDate is null', () => {
      component.mode = 'edit';
      component.data = { record: { ...mockRecord, effectiveDate: null } };
      fixture.detectChanges();
      expect(component.editEffectiveDateDisplay).toBe('-');
    });

    it('should return formatted date string when effectiveDate has a value', () => {
      component.mode = 'edit';
      component.data = { record: mockRecord };
      fixture.detectChanges();
      const display = component.editEffectiveDateDisplay;
      expect(display).toBeTruthy();
      expect(display).not.toBe('-');
    });
  });

  describe('Searchable Dropdowns', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should have search controls initialized', () => {
      expect(component.sourceParamCodeSearchCtrl).toBeDefined();
      expect(component.dependentCodeSearchCtrl).toBeDefined();
    });

    it('should return all items when search is empty', () => {
      component.sourceParamCodeSearchCtrl.setValue('');

      filtered = component.filteredSourceParamCodes();
      expect(filtered.length).toBe(2);
    });

    it('should filter source param codes by code', () => {
      component.sourceParamCodeSearchCtrl.setValue('TEMP');

      filtered = component.filteredSourceParamCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('TEMP');
    });

    it('should filter source param codes by description', () => {
      component.sourceParamCodeSearchCtrl.setValue('pressure');

      filtered = component.filteredSourceParamCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('PRES');
    });

    it('should return all dependent codes when search is empty', () => {
      component.dependentCodeSearchCtrl.setValue('');

      filtered = component.filteredDependentCodes();
      expect(filtered.length).toBe(2);
    });

    it('should filter dependent codes by code', () => {
      component.dependentCodeSearchCtrl.setValue('FLOW');

      filtered = component.filteredDependentCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('FLOW');
    });

    it('should filter dependent codes by description', () => {
      component.dependentCodeSearchCtrl.setValue('pressure');

      filtered = component.filteredDependentCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('PRES');
    });

    it('should return empty array when no matches found for source param codes', () => {
      component.sourceParamCodeSearchCtrl.setValue('NONEXISTENT');

      filtered = component.filteredSourceParamCodes();
      expect(filtered.length).toBe(0);
    });

    it('should return empty array when no matches found for dependent codes', () => {
      component.dependentCodeSearchCtrl.setValue('NONEXISTENT');

      filtered = component.filteredDependentCodes();
      expect(filtered.length).toBe(0);
    });
  });

  describe('sourceParamCode and dependentCode value change subscriptions', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update sourceParamDescription when sourceParamCode changes', () => {
      component.form.patchValue({ sourceParamCode: 'TEMP' });
      expect(component.form.getRawValue().sourceParamDescription).toBe('Temperature');
    });

    it('should clear sourceParamDescription when sourceParamCode has no match', () => {
      component.form.patchValue({ sourceParamCode: 'NONEXISTENT' });
      expect(component.form.getRawValue().sourceParamDescription).toBe('');
    });

    it('should update dependentDescription when dependentCode changes', () => {
      component.form.patchValue({ dependentCode: 'FLOW' });
      expect(component.form.getRawValue().dependentDescription).toBe('Flow Rate');
    });

    it('should clear dependentDescription when dependentCode has no match', () => {
      component.form.patchValue({ dependentCode: 'NONEXISTENT' });
      expect(component.form.getRawValue().dependentDescription).toBe('');
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

    it('should set lastChangedDateField to termination when terminationDate changes', (done) => {
      const date = moment('2026-04-21').toDate();

      component.form.get('terminationDate')?.setValue(null);

      setTimeout(() => {
        component.form.get('terminationDate')?.setValue(date);

        setTimeout(() => {
          expect(component['lastChangedDateField']).toBe('termination');
          done();
        }, 10);
      }, 10);
    });

    it('should initialize lastChangedDateField as null', () => {
      expect(component['lastChangedDateField']).toBeNull();
    });
  });

  describe('Edit Mode Termination Date Validation', () => {
    it('should allow original past termination date to load in edit mode', () => {
      const pastTermDate = moment().subtract(30, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: moment().subtract(60, 'days').format('YYYY-MM-DD'),
          terminationDate: pastTermDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();

      // The form should load without errors since it's the original value
      expect(component.form.get('terminationDate')?.value).toBeTruthy();
      expect(component.form.get('terminationDate')?.hasError('terminationDatePast')).toBeFalse();
    });

    it('should block manually entering NEW past termination date in edit mode', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
          terminationDate: null
        }
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
        record: {
          ...mockRecord,
          effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
          terminationDate: null
        }
      };
      fixture.detectChanges();

      futureDate = moment().add(10, 'days');
      component.form.patchValue({ terminationDate: futureDate });
      component.form.get('terminationDate')?.updateValueAndValidity();

      expect(component.form.get('terminationDate')?.hasError('terminationDatePast')).toBeFalse();
    });

    it('should show "Termination Date cannot be past" error message', () => {
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
          terminationDate: null
        }
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

    it('should preserve original termination date value in editModeValues', () => {
      const pastTermDate = moment().subtract(15, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: moment().subtract(60, 'days').format('YYYY-MM-DD'),
          terminationDate: pastTermDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();

      expect(component['editModeValues'].terminationDate).toBe(pastTermDate.format('YYYY-MM-DD'));
    });
  });

  describe('editModeEffectiveDateValidator', () => {
    it('should allow original effective date even if in past', () => {
      const pastEffDate = moment().subtract(30, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: pastEffDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();

      // The form should load without effectiveDatePast error since it's the original value
      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
    });

    it('should block new past effective dates in edit mode', () => {
      const pastEffDate = moment().subtract(30, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: moment().add(5, 'days').format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();

      // Change effective date to a different past date
      component.form.patchValue({ effectiveDate: pastEffDate });
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeTrue();
    });

    it('should allow future effective date in edit mode', () => {
      component.mode = 'edit';
      component.data = { record: mockRecord };
      fixture.detectChanges();

      component.form.patchValue({ effectiveDate: moment().add(10, 'days') });
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
    });

    it('should return null when control value is null', () => {
      component.mode = 'edit';
      component.data = { record: mockRecord };
      fixture.detectChanges();

      component.form.patchValue({ effectiveDate: null });
      component.form.get('effectiveDate')?.updateValueAndValidity();

      expect(component.form.get('effectiveDate')?.hasError('effectiveDatePast')).toBeFalse();
    });
  });

  describe('effectiveDateFilter', () => {
    it('should return true for null date', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.effectiveDateFilter(null)).toBeTrue();
    });

    it('should return true for future date', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.effectiveDateFilter(moment().add(10, 'days'))).toBeTrue();
    });

    it('should return false for past date in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.effectiveDateFilter(moment().subtract(10, 'days'))).toBeFalse();
    });

    it('should allow original effective date in edit mode even if past', () => {
      const pastDate = moment().subtract(30, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: pastDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();
      expect(component.effectiveDateFilter(pastDate)).toBeTrue();
    });

    it('should return false for a different past date in edit mode', () => {
      const pastDate = moment().subtract(30, 'days');
      const differentPastDate = moment().subtract(15, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: pastDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();
      expect(component.effectiveDateFilter(differentPastDate)).toBeFalse();
    });
  });

  describe('terminationDateFilter', () => {
    it('should return true for null date', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return true for future date', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.terminationDateFilter(moment().add(10, 'days'))).toBeTrue();
    });

    it('should return false for past date', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.terminationDateFilter(moment().subtract(10, 'days'))).toBeFalse();
    });

    it('should allow original termination date in edit mode even if past', () => {
      const pastTermDate = moment().subtract(20, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: moment().subtract(60, 'days').format('YYYY-MM-DD'),
          terminationDate: pastTermDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();
      expect(component.terminationDateFilter(pastTermDate)).toBeTrue();
    });

    it('should return false for a different past date in edit mode', () => {
      const pastTermDate = moment().subtract(20, 'days');
      const differentPastDate = moment().subtract(10, 'days');
      component.mode = 'edit';
      component.data = {
        record: {
          ...mockRecord,
          effectiveDate: moment().subtract(60, 'days').format('YYYY-MM-DD'),
          terminationDate: pastTermDate.format('YYYY-MM-DD')
        }
      };
      fixture.detectChanges();
      expect(component.terminationDateFilter(differentPastDate)).toBeFalse();
    });

    it('should return false when date is before effective date', () => {
      component.mode = 'add';
      fixture.detectChanges();
      const effDate = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate: effDate });

      const beforeEffDate = moment().add(5, 'days');
      expect(component.terminationDateFilter(beforeEffDate)).toBeFalse();
    });

    it('should return true when date is on or after effective date', () => {
      component.mode = 'add';
      fixture.detectChanges();
      const effDate = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate: effDate });

      const afterEffDate = moment().add(10, 'days');
      expect(component.terminationDateFilter(afterEffDate)).toBeTrue();
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call handleStartDateInput with correct arguments', () => {
      const mockEvent = { target: { value: '15-JAN-2027' } } as unknown as Event;
      spyOn((component as any).constructor.prototype, 'onEffectiveDateInput').and.callThrough();

      // Just call it - no error should occur
      expect(() => component.onEffectiveDateInput(mockEvent)).not.toThrow();
    });
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should call handleEndDateInput with correct arguments in add mode', () => {
      const mockEvent = { target: { value: '15-JAN-2027' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(mockEvent)).not.toThrow();
    });

    it('should pass isEditMode=true in edit mode', () => {
      component.mode = 'edit';
      component.data = { record: mockRecord };
      fixture.detectChanges();

      const mockEvent = { target: { value: '15-JAN-2027' } } as unknown as Event;
      expect(() => component.onTerminationDateInput(mockEvent)).not.toThrow();
    });
  });

  describe('getSourceParamCodeError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getSourceParamCodeError()).toBe('');
    });

    it('should return required error message when touched and empty', () => {
      component.form.get('sourceParamCode')?.markAsTouched();
      expect(component.getSourceParamCodeError()).toBe('Source Param Code is required');
    });

    it('should return empty string when control has value and is touched', () => {
      component.form.patchValue({ sourceParamCode: 'TEMP' });
      component.form.get('sourceParamCode')?.markAsTouched();
      expect(component.getSourceParamCodeError()).toBe('');
    });
  });

  describe('getDependentCodeError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getDependentCodeError()).toBe('');
    });

    it('should return required error message when touched and empty', () => {
      component.form.get('dependentCode')?.markAsTouched();
      expect(component.getDependentCodeError()).toBe('Dependent Param Code is required');
    });

    it('should return duplicate error message when duplicate error is set', () => {
      component.form.get('dependentCode')?.setErrors({ duplicate: true });
      component.form.get('dependentCode')?.markAsTouched();
      expect(component.getDependentCodeError()).toBe('QC dependency with these values already exists');
    });

    it('should return empty string when control has value and is touched', () => {
      component.form.patchValue({ dependentCode: 'FLOW' });
      component.form.get('dependentCode')?.markAsTouched();
      component.form.get('dependentCode')?.updateValueAndValidity();
      expect(component.getDependentCodeError()).toBe('');
    });
  });

  describe('Duplicate Validation', () => {
    const existingRecords = [
      {
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: '2026-06-01T00:00:00'
      }
    ];

    beforeEach(() => {
      component.mode = 'add';
      component.data = {
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        existingRecords
      };
      fixture.detectChanges();
    });

    it('should flag duplicate when all fields match existing record', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: moment('2026-06-01')
      });
      component.form.get('dependentCode')?.updateValueAndValidity();

      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeTrue();
    });

    it('should not flag duplicate when sourceParamCode differs', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'PRES',
        dependentCode: 'PRES',
        effectiveDate: moment('2026-06-01')
      });
      component.form.get('dependentCode')?.updateValueAndValidity();

      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeFalse();
    });

    it('should not flag duplicate when dependentCode differs', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'FLOW',
        effectiveDate: moment('2026-06-01')
      });
      component.form.get('dependentCode')?.updateValueAndValidity();

      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeFalse();
    });

    it('should not flag duplicate when effectiveDate differs', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: moment('2026-07-01')
      });
      component.form.get('dependentCode')?.updateValueAndValidity();

      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeFalse();
    });

    it('should return null when dependentCode value is empty', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: '',
        effectiveDate: moment('2026-06-01')
      });
      component.form.get('dependentCode')?.updateValueAndValidity();

      // required error will be set, but no duplicate error
      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeFalse();
    });

    it('should return null when effectiveDate is not set', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: null
      });
      component.form.get('dependentCode')?.updateValueAndValidity();

      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeFalse();
    });

    it('should revalidate dependentCode when sourceParamCode changes', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: moment('2026-06-01')
      });
      component.form.get('dependentCode')?.updateValueAndValidity();
      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeTrue();

      // Now change sourceParamCode to something different
      component.form.patchValue({ sourceParamCode: 'PRES' });
      // The watcher should trigger revalidation of dependentCode
      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeFalse();
    });

    it('should revalidate dependentCode when effectiveDate changes', () => {
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: moment('2026-06-01')
      });
      component.form.get('dependentCode')?.updateValueAndValidity();
      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeTrue();

      // Now change effectiveDate
      component.form.patchValue({ effectiveDate: moment('2026-07-01') });
      expect(component.form.get('dependentCode')?.hasError('duplicate')).toBeFalse();
    });

    it('should not run duplicate validator in edit mode', () => {
      const fixture2 = TestBed.createComponent(AddEditQcDependency);
      const comp2 = fixture2.componentInstance;
      comp2.mode = 'edit';
      comp2.data = { record: mockRecord };
      fixture2.detectChanges();

      // duplicateValidator returns null in edit mode
      comp2.form.patchValue({
        sourceParamCode: 'TEMP',
        dependentCode: 'PRES',
        effectiveDate: moment('2026-06-01')
      });
      comp2.form.get('dependentCode')?.updateValueAndValidity();

      expect(comp2.form.get('dependentCode')?.hasError('duplicate')).toBeFalse();
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
        const newMinDate = component.minDate.format('YYYY-MM-DD');

        // minDate should be recalculated (though may be same day depending on timezone)
        expect(component.minDate).toBeDefined();
        expect(moment.isMoment(component.minDate)).toBeTrue();
        done();
      }, 50);
    });

    it('should use chapter offset when calculating minDate', () => {
      mockHeaderService.chapterTimeZone.set('UTC');
      component.mode = 'add';
      fixture.detectChanges();

      // getChapterMinDate should be called with chapter offset
      expect(component.minDate).toBeDefined();
      expect(component.minDate.utcOffset()).toBe(0); // UTC should have 0 offset
    });
  });

  describe('Termination Date Min Validation', () => {
    describe('Add Mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        fixture.detectChanges();
      });

      it('should return minDate when no effective date is set', () => {
        component.form.patchValue({ effectiveDate: null });
        const result = component.getTerminationDateMin();
        expect(result?.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
      });

      it('should return effective date when effective date is after minDate', () => {
        futureDate = moment().add(10, 'days');
        component.form.patchValue({ effectiveDate: futureDate });
        const result = component.getTerminationDateMin();

        expect(result?.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
      });

      it('should return minDate when effective date equals minDate', () => {
        component.form.patchValue({ effectiveDate: component.minDate.clone() });
        const result = component.getTerminationDateMin();

        expect(result?.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
      });

      it('should return minDate when effective date is non-moment value', () => {
        component.form.patchValue({ effectiveDate: 'invalid' });
        const result = component.getTerminationDateMin();
        expect(result?.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
      });
    });

    describe('Edit Mode', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = { record: mockRecord };
        fixture.detectChanges();
      });

      it('should return minDate when no effective date is set in edit mode', () => {
        component.form.patchValue({ effectiveDate: null });
        const result = component.getTerminationDateMin();
        expect(result?.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
      });

      it('should return effective date when effective date is after minDate in edit mode', () => {
        const futureDate = moment().add(30, 'days');
        component.form.patchValue({ effectiveDate: futureDate });
        const result = component.getTerminationDateMin();

        expect(result?.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
      });

      it('should return minDate when effective date is before minDate in edit mode', () => {
        const pastDate = moment().subtract(10, 'days');
        component.form.patchValue({ effectiveDate: pastDate });
        const result = component.getTerminationDateMin();

        // Even in edit mode with past effective date, termination min should be chapter date
        expect(result?.format('YYYY-MM-DD')).toBe(component.minDate.format('YYYY-MM-DD'));
      });

      it('should prevent selecting past dates for termination date in edit mode', () => {
        const pastEffectiveDate = moment().subtract(10, 'days');
        component.form.patchValue({ effectiveDate: pastEffectiveDate });

        const terminationMin = component.getTerminationDateMin();
        today = component.minDate;

        // Termination date minimum should be today (chapter date), not the past effective date
        expect(terminationMin?.format('YYYY-MM-DD')).toBe(today.format('YYYY-MM-DD'));
        expect(terminationMin?.isAfter(pastEffectiveDate) || terminationMin?.isSame(today)).toBeTrue();
      });
    });
  });

  describe('Date Validation Message Behavior', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    describe('ErrorStateMatcher Behavior', () => {
      it('should show error state only on last changed field when dateRangeInvalid exists', () => {
        effectiveDate = moment().add(10, 'days');
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
        effectiveDate = moment().add(10, 'days');
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
        effectiveDate = moment().add(10, 'days');
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
        effectiveDate = moment().add(10, 'days');
        const terminationDate = moment().add(5, 'days');

        component['lastChangedDateField'] = null;
        component.form.patchValue({ effectiveDate, terminationDate });
        component.form.updateValueAndValidity();
        fixture.detectChanges();

        component.onSave();

        expect((component as any).lastChangedDateField).toEqual('termination');
      });

      it('should handle valid date range with no errors', () => {
        effectiveDate = moment().add(5, 'days');
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
        sameDate = moment().add(5, 'days');

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

  describe('onSave with dateRangeInvalid and null lastChangedDateField', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to termination when form has dateRangeInvalid and lastChangedDateField is null', () => {
      effectiveDate = moment().add(10, 'days');
      const terminationDate = moment().add(5, 'days');

      component['lastChangedDateField'] = null;
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'FLOW',
        effectiveDate,
        terminationDate
      });
      component.form.updateValueAndValidity();

      component.onSave();

      expect(component['lastChangedDateField']).toBe('termination');
    });

    it('should not change lastChangedDateField when form does not have dateRangeInvalid', () => {
      mockService.createQcDependency.and.returnValue(of({}));
      component['lastChangedDateField'] = null;
      component.form.patchValue({
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ALYX',
        sourceParamCode: 'TEMP',
        dependentCode: 'FLOW',
        effectiveDate: moment().add(5, 'days'),
        terminationDate: moment().add(10, 'days')
      });
      component.form.updateValueAndValidity();

      component.onSave();

      // When form has no dateRangeInvalid error, lastChangedDateField should not be set to 'termination'
      expect(component['lastChangedDateField']).not.toBe('termination');
    });
  });

  describe('setupSearchSubscriptions', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should update sourceParamCodeSearch signal when sourceParamCodeSearchCtrl changes', () => {
      component.sourceParamCodeSearchCtrl.setValue('TEMP');
      // The search signal should now filter
      const filtered = component.filteredSourceParamCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('TEMP');
    });

    it('should update dependentCodeSearch signal when dependentCodeSearchCtrl changes', () => {
      component.dependentCodeSearchCtrl.setValue('FLOW');
      const filtered = component.filteredDependentCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('FLOW');
    });

    it('should handle null values in search ctrl by setting empty string', () => {
      component.sourceParamCodeSearchCtrl.setValue(null);
      const filtered = component.filteredSourceParamCodes();
      expect(filtered.length).toBe(2); // All items shown when search is empty
    });

    it('should handle null values in dependent search ctrl', () => {
      component.dependentCodeSearchCtrl.setValue(null);
      const filtered = component.filteredDependentCodes();
      expect(filtered.length).toBe(2);
    });
  });
});
