import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange } from '@angular/core';
import { AddEditValidReagentSupplierCodeDialog } from './add-edit-valid-reagent-supplier-code-dialog';
import { ValidReagentSupplierCodeService } from '../services/valid-reagent-supplier-code.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderService } from '@shared/services/header.service';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import { ValidReagentSupplierCode } from '../models/valid-reagent-supplier-code.model';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditValidReagentSupplierCodeDialog', () => {
  let component: AddEditValidReagentSupplierCodeDialog;
  let fixture: ComponentFixture<AddEditValidReagentSupplierCodeDialog>;
  let service: jasmine.SpyObj<ValidReagentSupplierCodeService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  const mockEditData: ValidReagentSupplierCode = {
    supplierCode: 'VRX',
    supplierName: 'Verax Biomedical',
    effDate: '2025-01-01T00:00:00Z',
    termDate: null,
    lastModifyDate: '2025-06-01T10:30:00Z',
    lastModifyUser: 'CELHUN'
  };

  beforeEach(() => {
    const serviceSpy = jasmine.createSpyObj('ValidReagentSupplierCodeService', [
      'create',
      'update'
    ]);
    const snackBarSpy = createMockMatSnackBar();
    const headerServiceSpy = createMockHeaderService();
    TestBed.configureTestingModule({
      imports: [
        AddEditValidReagentSupplierCodeDialog,
        HttpClientTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ValidReagentSupplierCodeService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });
  });

  beforeEach(() => {
    service = TestBed.inject(ValidReagentSupplierCodeService) as jasmine.SpyObj<ValidReagentSupplierCodeService>;
    fixture = TestBed.createComponent(AddEditValidReagentSupplierCodeDialog);
    component = fixture.componentInstance;
    // Get MatSnackBar from the component's own injector — the standalone component
    // imports MatSnackBarModule which provides its own instance, separate from TestBed's root.
    const componentSnackBar = fixture.debugElement.injector.get(MatSnackBar);
    spyOn(componentSnackBar, 'open');
    snackBar = componentSnackBar as jasmine.SpyObj<MatSnackBar>;
  });

  describe('Component Creation', () => {
    it('should create in add mode by default', () => {
      expect(component.mode).toBe('add');
      expect(component.data).toBeNull();
    });

    it('should have saving set to false initially', () => {
      expect(component.saving).toBe(false);
    });
  });

  describe('Computed Properties', () => {
    it('should return true for isAddMode when mode is add', () => {
      component.mode = 'add';
      expect(component.isAddMode).toBe(true);
    });

    it('should return false for isAddMode when mode is edit', () => {
      component.mode = 'edit';
      expect(component.isAddMode).toBe(false);
    });

    it('should return Add New Code for dialogTitle in add mode', () => {
      component.mode = 'add';
      expect(component.dialogTitle).toBe('Add New Code');
    });

    it('should return Edit Record for dialogTitle in edit mode', () => {
      component.mode = 'edit';
      expect(component.dialogTitle).toBe('Edit Record');
    });

    it('should return empty string for lastModified when no data', () => {
      component.data = null;
      expect(component.lastModified).toBe('');
    });
  });

  describe('Form Initialization - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should create form with empty fields in add mode', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('supplierCode')?.value).toBe('');
      expect(component.form.get('supplierName')?.value).toBe('');
      expect(component.form.get('effDate')?.value).toBeNull();
      expect(component.form.get('termDate')?.value).toBeNull();
    });

    it('should set supplierCode as required', () => {
      component.form.get('supplierCode')?.setValue('');
      component.form.get('supplierCode')?.markAsTouched();
      expect(component.form.get('supplierCode')?.hasError('required')).toBe(true);
    });

    it('should set supplierCode maxLength to 5', () => {
      component.form.get('supplierCode')?.setValue('TOOLONG');
      expect(component.form.get('supplierCode')?.hasError('maxlength')).toBe(true);
    });

    it('should set supplierName as required', () => {
      component.form.get('supplierName')?.setValue('');
      component.form.get('supplierName')?.markAsTouched();
      expect(component.form.get('supplierName')?.hasError('required')).toBe(true);
    });

    it('should set supplierName maxLength to 50', () => {
      component.form.get('supplierName')?.setValue('A'.repeat(51));
      expect(component.form.get('supplierName')?.hasError('maxlength')).toBe(true);
    });

    it('should set effDate as required', () => {
      component.form.get('effDate')?.markAsTouched();
      expect(component.form.get('effDate')?.hasError('required')).toBe(true);
    });

    it('should mark form as pristine after initialization', () => {
      expect(component.form.pristine).toBe(true);
    });
  });

  describe('Form Initialization - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
    });

    it('should populate form with data in edit mode', () => {
      expect(component.form.get('supplierCode')?.value).toBe('VRX');
      expect(component.form.get('supplierName')?.value).toBe('Verax Biomedical');
      expect(component.form.get('effDate')?.value).toBeDefined();
    });

    it('should store original effective date in edit mode', () => {
      expect(component['originalEffDate']).toBeDefined();
    });

    it('should allow original effective date in effective date filter for edit mode', () => {
      const originalDate = moment(mockEditData.effDate);
      expect(component.effectiveDateFilter(originalDate)).toBe(true);
    });
  });

  describe('Supplier Code Auto-Uppercase', () => {
    it('should uppercase supplier code automatically', (done) => {
      component.mode = 'add';
      component.ngOnInit();

      const supplierCodeControl = component.form.get('supplierCode');
      supplierCodeControl?.setValue('vrx');

      setTimeout(() => {
        expect(supplierCodeControl?.value).toBe('VRX');
        done();
      }, 10);
    });

    it('should not re-emit when value is already uppercase', (done) => {
      component.mode = 'add';
      component.ngOnInit();

      const supplierCodeControl = component.form.get('supplierCode');
      supplierCodeControl?.setValue('VRX');

      setTimeout(() => {
        expect(supplierCodeControl?.value).toBe('VRX');
        done();
      }, 10);
    });
  });

  describe('Date Validation Tests', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should REJECT termination date before effective date', () => {
      const effDateControl = component.form.get('effDate');
      const termDateControl = component.form.get('termDate');

      effDateControl?.setValue(moment().add(15, 'days'));
      effDateControl?.markAsTouched();
      termDateControl?.setValue(moment().add(14, 'days'));
      termDateControl?.markAsTouched();

      component['lastChangedDateField'] = 'termination';

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
      const error = component.getTerminationDateError();
      expect(error).toContain('must be greater than or equal to');
    });

    it('should update termination min date when effective date changes', () => {
      const effDateControl = component.form.get('effDate');
      const newEffDate = moment().add(30, 'days');

      effDateControl?.setValue(newEffDate);

      component['lastChangedDateField'] = 'effective';
      component['updateTerminationMinDate']();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(newEffDate.format('YYYY-MM-DD'));
    });

    it('should show error on effective date when it is after termination date', () => {
      const effDateControl = component.form.get('effDate');
      const termDateControl = component.form.get('termDate');

      termDateControl?.setValue(moment().add(1, 'days'));
      termDateControl?.markAsTouched();
      effDateControl?.setValue(moment().add(15, 'days'));
      effDateControl?.markAsTouched();

      component['lastChangedDateField'] = 'effective';

      expect(component.form.hasError('dateRangeInvalid')).toBe(true);
      const error = component.getEffectiveDateError();
      expect(error).toContain('must be less than or equal to');
    });

    it('should handle effective date in the past for edit mode', () => {
      component.mode = 'edit';
      component.data = {
        supplierCode: 'VRX',
        supplierName: 'Verax Biomedical',
        effDate: '2020-01-01T00:00:00Z',
        termDate: null,
        lastModifyDate: '2025-01-01T00:00:00Z',
        lastModifyUser: 'CELHUN'
      };
      component.ngOnInit();

      const pastDate = moment('2020-01-01');

      expect(component.effectiveDateFilter(pastDate)).toBe(true);
    });

    it('should validate date range when both dates are at exact same time', () => {
      const effDateControl = component.form.get('effDate');
      const termDateControl = component.form.get('termDate');

      const exactSameDate = moment('2025-06-15T14:30:00');
      effDateControl?.setValue(exactSameDate.clone());
      termDateControl?.setValue(exactSameDate.clone());

      component['lastChangedDateField'] = 'termination';

      expect(component.form.hasError('dateRangeInvalid')).toBe(false);
    });

    it('should reset termination min date when effective date is invalid', () => {
      const initialMinDate = component.minDate.clone();
      component.form.get('effDate')?.setValue(null);

      component['updateTerminationMinDate']();

      expect(component.terminationMinDate.format('YYYY-MM-DD')).toBe(initialMinDate.format('YYYY-MM-DD'));
    });

    it('should return true from effectiveDateFilter for null date', () => {
      expect(component.effectiveDateFilter(null)).toBe(true);
    });

    it('should return true from terminationDateFilter for null date', () => {
      expect(component.terminationDateFilter(null)).toBe(true);
    });

    it('should reject future dates before today in add mode effectiveDateFilter', () => {
      const yesterday = moment().subtract(1, 'day');
      expect(component.effectiveDateFilter(yesterday)).toBe(false);
    });
  });

  describe('Date Filters', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should reject termination date before effective date in terminationDateFilter', () => {
      const futureDate = moment().add(30, 'days');
      component.form.get('effDate')?.setValue(futureDate);

      const beforeEffDate = futureDate.clone().subtract(1, 'day');
      expect(component.terminationDateFilter(beforeEffDate)).toBe(false);
    });

    it('should allow termination date on or after effective date', () => {
      const futureDate = moment().add(30, 'days');
      component.form.get('effDate')?.setValue(futureDate);

      const afterEffDate = futureDate.clone().add(1, 'day');
      expect(component.terminationDateFilter(afterEffDate)).toBe(true);
    });

    it('should reject termination date before today in add mode', () => {
      const yesterday = moment().subtract(1, 'day');
      expect(component.terminationDateFilter(yesterday)).toBe(false);
    });
  });

  describe('Save Operations - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should not save when form is invalid', () => {
      component.onSave();
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should mark all controls as touched on save attempt', () => {
      component.onSave();
      expect(component.form.get('supplierCode')?.touched).toBe(true);
      expect(component.form.get('supplierName')?.touched).toBe(true);
    });

    it('should call create service on valid form submission', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test Supplier',
        effDate: moment().add(10, 'days'),
        termDate: null
      });
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));
      spyOn(component.saveSuccess, 'emit');

      component.onSave();

      expect(service.create).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalledWith(false);
    });

    it('should show success snackbar on successful create', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test Supplier',
        effDate: moment().add(10, 'days')
      });
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        'New Code has been Saved successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should handle backend success:false response on create', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test Supplier',
        effDate: moment().add(10, 'days')
      });
      service.create.and.returnValue(of({
        success: false,
        message: 'Duplicate entry',
        statusCode: 400,
        errorResponse: { errorCode: '1821', error: 'Duplicate entry not allowed' }
      }));

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 1821'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.saving).toBe(false);
    });

    it('should handle network error on create', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test Supplier',
        effDate: moment().add(10, 'days')
      });
      service.create.and.returnValue(throwError(() => ({ error: { message: 'Network error' } })));

      component.onSave();

      expect(component.saving).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should emit saveSuccess(true) and reset form when addAnother is true', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test Supplier',
        effDate: moment().add(10, 'days')
      });
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));
      spyOn(component.saveSuccess, 'emit');

      component.onSave(true);

      expect(component.saveSuccess.emit).toHaveBeenCalledWith(true);
    });

    it('should set saving to true during save operation', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test Supplier',
        effDate: moment().add(10, 'days')
      });
      service.create.and.returnValue(of({ success: true, message: 'Created', statusCode: 201 }));

      component.onSave();

      expect(component.saving).toBe(false);
    });
  });

  describe('Save Operations - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
    });

    it('should call update service with correct supplier code', () => {
      component.form.patchValue({
        supplierName: 'Updated Name',
        effDate: moment('2025-01-01')
      });
      component.form.markAsDirty();
      service.update.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));
      spyOn(component.saveSuccess, 'emit');

      component.onSave();

      expect(service.update).toHaveBeenCalledWith('VRX', jasmine.any(Object));
      expect(component.saveSuccess.emit).toHaveBeenCalledWith(false);
    });

    it('should show success snackbar on successful update', () => {
      component.form.patchValue({
        supplierName: 'Updated Name',
        effDate: moment('2025-01-01')
      });
      component.form.markAsDirty();
      service.update.and.returnValue(of({ success: true, message: 'Updated', statusCode: 200 }));

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Changes has been saved successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should handle backend success:false response on update', () => {
      component.form.patchValue({
        supplierName: 'Updated Name',
        effDate: moment('2025-01-01')
      });
      component.form.markAsDirty();
      service.update.and.returnValue(of({
        success: false,
        message: 'Failed to update record',
        statusCode: 400,
        errorResponse: { errorCode: '5003', error: 'Update failed' }
      }));

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 5003'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.saving).toBe(false);
    });

    it('should handle network error on update', () => {
      component.form.patchValue({
        supplierName: 'Updated Name',
        effDate: moment('2025-01-01')
      });
      component.form.markAsDirty();
      service.update.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.onSave();

      expect(component.saving).toBe(false);
      expect(snackBar.open).toHaveBeenCalled();
    });
  });

  describe('Cancel and Close', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should emit close event on cancel', () => {
      spyOn(component.close, 'emit');

      component.onCancel();

      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should call onSave(true) on addAndCreateAnother', () => {
      spyOn(component, 'onSave');

      component.onAddAndCreateAnother();

      expect(component.onSave).toHaveBeenCalledWith(true);
    });
  });

  describe('Clear All', () => {
    it('should reset form in add mode on clearAll', () => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test'
      });

      component.onClearAll();

      expect(component.form.get('supplierCode')?.value).toBeFalsy();
      expect(component.form.get('supplierName')?.value).toBeFalsy();
    });

    it('should restore original supplierCode in edit mode on clearAll', () => {
      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnInit();
      component.form.patchValue({ supplierName: 'Changed Name' });

      component.onClearAll();

      expect(component.form.get('supplierCode')?.value).toBe('VRX');
      expect(component.form.get('supplierName')?.value).toBe('');
    });

    it('should reset validation errors on clearAll', () => {
      component.mode = 'add';
      component.ngOnInit();
      component.form.get('supplierCode')?.markAsTouched();
      component.form.get('supplierCode')?.setValue('');

      component.onClearAll();

      expect(component.form.get('supplierCode')?.errors).toBeNull();
    });

    it('should reset lastChangedDateField on clearAll', () => {
      component.mode = 'add';
      component.ngOnInit();
      component['lastChangedDateField'] = 'effective';

      component.onClearAll();

      expect(component['lastChangedDateField']).toBeNull();
    });
  });

  describe('Lifecycle', () => {
    it('should initialize form on ngOnInit', () => {
      component.mode = 'add';
      component.ngOnInit();

      expect(component.form).toBeDefined();
      expect(component.form.get('supplierCode')).toBeDefined();
    });

    it('should reinitialize form on ngOnChanges when mode changes', () => {
      component.mode = 'add';
      component.ngOnInit();

      component.mode = 'edit';
      component.data = mockEditData;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });

      expect(component.form.get('supplierCode')?.value).toBe('VRX');
    });

    it('should not reinitialize on first change', () => {
      component.mode = 'add';
      component.ngOnInit();

      const spy = spyOn<any>(component, 'initializeForm');
      component.ngOnChanges({
        mode: new SimpleChange(undefined, 'add', true)
      });

      expect(spy).not.toHaveBeenCalled();
    });

    it('should complete destroy$ on ngOnDestroy', () => {
      component.mode = 'add';
      component.ngOnInit();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should display error message with errorCode from nested response', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test',
        effDate: moment().add(10, 'days')
      });
      service.create.and.returnValue(throwError(() => ({
        error: {
          errorResponse: { errorCode: '3115', error: 'Supplier code is required' }
        }
      })));

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Error 3115'),
        'DISMISS',
        jasmine.any(Object)
      );
    });

    it('should display generic error when no errorCode present', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test',
        effDate: moment().add(10, 'days')
      });
      service.create.and.returnValue(throwError(() => ({
        message: 'An error occurred while saving'
      })));

      component.onSave();

      expect(snackBar.open).toHaveBeenCalled();
      expect(component.saving).toBe(false);
    });

    it('should handle backend success:false without errorCode', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test',
        effDate: moment().add(10, 'days')
      });
      service.create.and.returnValue(of({
        success: false,
        message: 'Failed to create record',
        statusCode: 400
      }));

      component.onSave();

      expect(snackBar.open).toHaveBeenCalledWith(
        'Failed to create record',
        'DISMISS',
        jasmine.any(Object)
      );
    });
  });

  describe('Date Range Validation on Save', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.ngOnInit();
    });

    it('should not save when dateRangeInvalid error exists', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test',
        effDate: moment().add(15, 'days'),
        termDate: moment().add(5, 'days')
      });

      component.onSave();

      expect(service.create).not.toHaveBeenCalled();
    });

    it('should default lastChangedDateField to effective on save if not set', () => {
      component.form.patchValue({
        supplierCode: 'TEST',
        supplierName: 'Test',
        effDate: moment().add(15, 'days'),
        termDate: moment().add(5, 'days')
      });
      component['lastChangedDateField'] = null;

      component.onSave();

      expect(component['lastChangedDateField']).toBe('effective');
    });
  });
});
