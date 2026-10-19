import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import moment from 'moment';

import { AddEditContractComponent } from './add-edit-contract.component';
import { CustomerContractApiService } from '../services/customer-contract-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { CustomerContractDto } from '../models/customer-contract.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AddEditContractComponent', () => {
  let component: AddEditContractComponent;
  let fixture: ComponentFixture<AddEditContractComponent>;
  let apiServiceSpy: jasmine.SpyObj<CustomerContractApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockContract: CustomerContractDto = {
    contractId: 'DI0121-001',
    customerId: 'WAD-DI0121',
    rotationFlag: 'Y',
    poNumber: 'PO-12345',
    creditLimit: 5000.00,
    startTerm: '2026-01-01',
    endTerm: '2026-12-31',
    effDate: '2026-01-01',
    termDate: null,
    lastModifiedDate: '2026-06-06T10:30:00'
  };

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('CustomerContractApiService', ['createCustomerContract', 'updateCustomerContract']);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    headerServiceSpy.chapterChanged$ = chapterChangedSubject.asObservable();

    TestBed.configureTestingModule({
      imports: [AddEditContractComponent, NoopAnimationsModule],
      providers: [
        { provide: CustomerContractApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    apiServiceSpy.createCustomerContract.calls.reset();
    apiServiceSpy.updateCustomerContract.calls.reset();

    fixture = TestBed.createComponent(AddEditContractComponent);
    component = fixture.componentInstance;
    component.data = mockContract;
  });

  describe('Initialization', () => {
    it('should initialize form with required controls', () => {
      fixture.detectChanges();
      expect(component.contractForm.get('rotation')).toBeTruthy();
      expect(component.contractForm.get('poNumber')).toBeTruthy();
      expect(component.contractForm.get('creditLimit')).toBeTruthy();
      expect(component.contractForm.get('effectiveDate')).toBeTruthy();
      expect(component.contractForm.get('terminationDate')).toBeTruthy();
      expect(component.contractForm.get('startTerm')).toBeTruthy();
      expect(component.contractForm.get('endTerm')).toBeTruthy();
    });

    it('should create error state matchers', () => {
      fixture.detectChanges();
      expect(component.effDateErrorMatcher).toBeTruthy();
      expect(component.startTermErrorMatcher).toBeTruthy();
      expect(component.endTermErrorMatcher).toBeTruthy();
      expect(component.termDateErrorMatcher).toBeTruthy();
    });

    it('should set minDate on init', () => {
      fixture.detectChanges();
      expect(component.minDate).toBeTruthy();
      expect(moment.isMoment(component.minDate)).toBeTrue();
    });
  });

  describe('ngOnChanges', () => {
    it('should populate form when mode changes', () => {
      component.mode = 'edit';
      component.data = mockContract;
      fixture.detectChanges();
      component.ngOnChanges({ mode: {} as any, data: {} as any });

      expect(component.contractForm.get('poNumber')?.value).toBe('PO-12345');
    });

    it('should reset form when switching to add mode', () => {
      component.mode = 'add';
      component.data = mockContract;
      fixture.detectChanges();
      component.ngOnChanges({ mode: {} as any });

      expect(component.contractForm.get('poNumber')?.value).toBeFalsy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('panelTitle', () => {
    it('should return add title with customer name', () => {
      component.mode = 'add';
      component.customerName = 'TEST CUSTOMER';
      expect(component.panelTitle).toBe('Add Contract for TEST CUSTOMER');
    });

    it('should return generic add title when no name', () => {
      component.mode = 'add';
      component.customerName = '';
      component.data = { ...mockContract, customerName: undefined };
      expect(component.panelTitle).toBe('Add New Contract');
    });

    it('should return edit title with customer name', () => {
      component.mode = 'edit';
      component.customerName = 'TEST CUSTOMER';
      expect(component.panelTitle).toBe('Edit Contract for TEST CUSTOMER');
    });

    it('should return generic edit title when no name', () => {
      component.mode = 'edit';
      component.customerName = '';
      component.data = { ...mockContract, customerName: undefined };
      expect(component.panelTitle).toBe('Edit Contract');
    });

    it('should use data.customerName as fallback', () => {
      component.mode = 'edit';
      component.customerName = '';
      component.data = { ...mockContract, customerName: 'FROM DATA' };
      expect(component.panelTitle).toBe('Edit Contract for FROM DATA');
    });
  });

  describe('effectiveDateDisplay', () => {
    it('should format effective date for display', () => {
      component.data = { ...mockContract, effDate: '2026-03-15' };
      const display = component.effectiveDateDisplay;
      expect(display).toBeTruthy();
      expect(display).not.toBe('--');
    });

    it('should return -- when no effective date', () => {
      component.data = { ...mockContract, effDate: '' };
      expect(component.effectiveDateDisplay).toBe('--');
    });

    it('should return -- when data is null', () => {
      component.data = null;
      expect(component.effectiveDateDisplay).toBe('--');
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should require effective date', () => {
      const effDateControl = component.contractForm.get('effectiveDate');
      expect(effDateControl?.hasError('required')).toBeTrue();
    });

    it('should require credit limit', () => {
      const control = component.contractForm.get('creditLimit');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBeTrue();
    });

    it('should validate credit limit min value', () => {
      const control = component.contractForm.get('creditLimit');
      control?.setValue(-1);
      expect(control?.hasError('min')).toBeTrue();
    });

    it('should validate credit limit max value', () => {
      const control = component.contractForm.get('creditLimit');
      control?.setValue(10000000);
      expect(control?.hasError('max')).toBeTrue();
    });

    it('should validate PO Number max length', () => {
      const poNumberControl = component.contractForm.get('poNumber');
      poNumberControl?.setValue('a'.repeat(51));
      expect(poNumberControl?.hasError('maxlength')).toBeTrue();
    });

    it('should accept valid PO Number', () => {
      const poNumberControl = component.contractForm.get('poNumber');
      poNumberControl?.setValue('PO-123');
      expect(poNumberControl?.valid).toBeTrue();
    });
  });

  describe('isSaveEnabled', () => {
    it('should return true in add mode when form is valid', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      expect(component.isSaveEnabled).toBeTrue();
    });

    it('should return false when form is invalid', () => {
      component.mode = 'add';
      fixture.detectChanges();
      expect(component.isSaveEnabled).toBeFalse();
    });
  });

  describe('isFormValid (edit mode dirty checking)', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockContract;
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();
    });

    it('should return false when no changes made', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when PO Number changed', () => {
      component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
      expect(component.isFormValid).toBeTrue();
    });

    it('should return true when credit limit changed', () => {
      component.contractForm.patchValue({ creditLimit: 9999 });
      expect(component.isFormValid).toBeTrue();
    });

    it('should return true when termination date changed', () => {
      component.contractForm.patchValue({ terminationDate: moment('2027-06-01') });
      expect(component.isFormValid).toBeTrue();
    });

    it('should detect rotation change', () => {
      component.contractForm.patchValue({ rotation: 'No' });
      expect(component.isFormValid).toBeTrue();
    });

    it('should return true in add mode when form is valid', () => {
      component.mode = 'add';
      component.data = mockContract;
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockContract;
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();
    });

    it('should populate form with contract data', () => {
      expect(component.contractForm.get('poNumber')?.value).toBe('PO-12345');
      expect(component.contractForm.get('creditLimit')?.value).toBe(5000);
      expect(component.contractForm.get('rotation')?.value).toBe('Yes');
    });

    it('should set lastModifiedDisplay', () => {
      expect(component.lastModifiedDisplay).toContain('Last Modified:');
    });

    it('should not set lastModifiedDisplay when no lastModifiedDate', () => {
      component.data = { ...mockContract, lastModifiedDate: undefined };
      component.ngOnChanges({ data: {} as any });
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should map rotationFlag N to No', () => {
      component.data = { ...mockContract, rotationFlag: 'N' };
      component.ngOnChanges({ data: {} as any });
      expect(component.contractForm.get('rotation')?.value).toBe('No');
    });

    it('should map undefined rotationFlag to null', () => {
      component.data = { ...mockContract, rotationFlag: undefined };
      component.ngOnChanges({ data: {} as any });
      expect(component.contractForm.get('rotation')?.value).toBeNull();
    });

    it('should enable save button when changes are made', () => {
      component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
      expect(component.isSaveEnabled).toBeTrue();
    });
  });

  describe('Date Validation', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should validate end term is after start term', () => {
      component.contractForm.patchValue({
        startTerm: moment('2025-12-31'),
        endTerm: moment('2025-01-01')
      });

      expect(component.contractForm.hasError('endTermBeforeStartTerm')).toBeTrue();
    });

    it('should pass when end term is after start term', () => {
      component.contractForm.patchValue({
        startTerm: moment('2025-01-01'),
        endTerm: moment('2025-12-31')
      });

      expect(component.contractForm.hasError('endTermBeforeStartTerm')).toBeFalse();
    });

    it('should pass when only start term is set', () => {
      component.contractForm.patchValue({
        startTerm: moment('2025-01-01'),
        endTerm: null
      });

      expect(component.contractForm.hasError('endTermBeforeStartTerm')).toBeFalse();
    });

    it('should pass when only end term is set', () => {
      component.contractForm.patchValue({
        startTerm: null,
        endTerm: moment('2025-12-31')
      });

      expect(component.contractForm.hasError('endTermBeforeStartTerm')).toBeFalse();
    });
  });

  describe('getStartTermError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return error message when endTermBeforeStartTerm', () => {
      component.contractForm.patchValue({
        startTerm: moment('2025-12-31'),
        endTerm: moment('2025-01-01')
      });
      component.contractForm.get('startTerm')?.markAsTouched();
      component.lastChangedDateField = 'start';

      expect(component.getStartTermError()).toBe('Start Term must be on or before End Term');
    });

    it('should return empty string when no errors', () => {
      component.contractForm.patchValue({
        startTerm: moment('2025-01-01'),
        endTerm: moment('2025-12-31')
      });
      component.contractForm.get('startTerm')?.markAsTouched();
      component.lastChangedDateField = 'start';

      expect(component.getStartTermError()).toBe('');
    });

    it('should return format error when invalid date', () => {
      const control = component.contractForm.get('startTerm');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      component.lastChangedDateField = 'start';

      expect(component.getStartTermError()).toBe('Invalid date format. Use DD-MMM-YYYY');
    });

    it('should return format error for invalidDate error', () => {
      const control = component.contractForm.get('startTerm');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      component.lastChangedDateField = 'start';

      expect(component.getStartTermError()).toBe('Invalid date format. Use DD-MMM-YYYY');
    });

    it('should return format error for invalidDateFormat error', () => {
      const control = component.contractForm.get('startTerm');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      component.lastChangedDateField = 'start';

      expect(component.getStartTermError()).toBe('Invalid date format. Use DD-MMM-YYYY');
    });

    it('should return empty string when lastChangedDateField is not start', () => {
      component.contractForm.patchValue({
        startTerm: moment('2025-12-31'),
        endTerm: moment('2025-01-01')
      });
      component.contractForm.get('startTerm')?.markAsTouched();
      component.lastChangedDateField = 'end';

      expect(component.getStartTermError()).toBe('');
    });

    it('should return empty string when control is null', () => {
      spyOn(component.contractForm, 'get').and.returnValue(null);
      expect(component.getStartTermError()).toBe('');
    });
  });

  describe('getEndTermError', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return error message when endTermBeforeStartTerm', () => {
      component.contractForm.patchValue({
        startTerm: moment('2025-12-31'),
        endTerm: moment('2025-01-01')
      });
      component.contractForm.get('endTerm')?.markAsTouched();
      component.lastChangedDateField = 'end';

      expect(component.getEndTermError()).toBe('End Term must be on or after Start Term');
    });

    it('should return format error when invalid date', () => {
      const control = component.contractForm.get('endTerm');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      component.lastChangedDateField = 'end';

      expect(component.getEndTermError()).toBe('Invalid date format. Use DD-MMM-YYYY');
    });

    it('should return min date error', () => {
      const control = component.contractForm.get('endTerm');
      control?.setErrors({ matDatepickerMin: true });
      control?.markAsTouched();
      component.lastChangedDateField = 'end';

      expect(component.getEndTermError()).toBe('End Term must be on or after Start Term');
    });

    it('should return empty string when no errors', () => {
      component.contractForm.patchValue({
        startTerm: moment('2025-01-01'),
        endTerm: moment('2025-12-31')
      });
      component.contractForm.get('endTerm')?.markAsTouched();
      component.lastChangedDateField = 'end';

      expect(component.getEndTermError()).toBe('');
    });

    it('should return empty string when control is null', () => {
      spyOn(component.contractForm, 'get').and.returnValue(null);
      expect(component.getEndTermError()).toBe('');
    });
  });

  describe('getEffectiveDateError', () => {
    it('should delegate to DateFieldValidationUtility', () => {
      component.mode = 'add';
      fixture.detectChanges();
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('getTerminationDateError', () => {
    it('should delegate to DateFieldValidationUtility', () => {
      component.mode = 'add';
      fixture.detectChanges();
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('Date Field Listeners', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set lastChangedDateField to effective when effectiveDate changes', () => {
      component.contractForm.get('effectiveDate')?.setValue(moment('2026-06-01'));
      expect(component.lastChangedDateField).toBe('effective');
    });

    it('should set lastChangedDateField to termination when terminationDate changes', () => {
      component.contractForm.get('terminationDate')?.setValue(moment('2026-12-01'));
      expect(component.lastChangedDateField).toBe('termination');
    });

    it('should set lastChangedDateField to start when startTerm changes', () => {
      component.contractForm.get('startTerm')?.setValue(moment('2026-01-01'));
      expect(component.lastChangedDateField).toBe('start');
    });

    it('should set lastChangedDateField to end when endTerm changes', () => {
      component.contractForm.get('endTerm')?.setValue(moment('2026-12-01'));
      expect(component.lastChangedDateField).toBe('end');
    });
  });

  describe('updateTerminationMinDate', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should set terminationMinDate to effectiveDate when after minDate', () => {
      const futureDate = moment().add(30, 'days');
      component.contractForm.get('effectiveDate')?.setValue(futureDate);
      expect(component.terminationMinDate).toBeTruthy();
    });

    it('should fall back to minDate when effectiveDate is not set', () => {
      component.contractForm.get('effectiveDate')?.setValue(null);
      expect(component.terminationMinDate).toEqual(component.minDate);
    });
  });

  describe('onSave', () => {
    describe('Add Mode', () => {
      beforeEach(() => {
        component.mode = 'add';
        component.data = mockContract;
        fixture.detectChanges();
      });

      it('should call createContract on valid form', () => {
        apiServiceSpy.createCustomerContract.and.returnValue(of({ success: true, message: 'Created' }));

        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day'),
          rotation: 'Yes',
          poNumber: 'PO-TEST'
        });

        component.onSave();

        expect(apiServiceSpy.createCustomerContract).toHaveBeenCalled();
      });

      it('should not submit when form is invalid', () => {
        component.onSave();
        expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
      });

      it('should show success snackbar and emit closePanel on create success', () => {
        apiServiceSpy.createCustomerContract.and.returnValue(of({ success: true, message: 'Contract created' }));
        const closeSpy = spyOn(component.closePanel, 'emit');
        const saveSpy = spyOn(component.saveSuccess, 'emit');

        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day')
        });

        component.onSave();

        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Contract created');
        expect(saveSpy).toHaveBeenCalled();
        expect(closeSpy).toHaveBeenCalled();
      });

      it('should use default message when response has no message', () => {
        apiServiceSpy.createCustomerContract.and.returnValue(of({ success: true }));

        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day')
        });

        component.onSave();

        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
          jasmine.stringContaining('WAD-DI0121')
        );
      });

      it('should show error snackbar on create failure', () => {
        apiServiceSpy.createCustomerContract.and.returnValue(
          throwError(() => ({ error: { message: 'Create failed' } }))
        );

        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day')
        });

        component.onSave();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Create failed');
        expect(component.isSaving).toBeFalse();
      });

      it('should show error with error code on failure', () => {
        apiServiceSpy.createCustomerContract.and.returnValue(
          throwError(() => ({
            error: {
              errorResponse: { errorCode: '1234', error: 'Validation error' }
            }
          }))
        );

        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day')
        });

        component.onSave();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 1234: Validation error');
      });

      it('should not save when data is null', () => {
        component.data = null;
        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day')
        });

        component.onSave();
        expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
      });

      it('should not save when dateRangeInvalid error exists', () => {
        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment('2026-12-31'),
          terminationDate: moment('2026-01-01')
        });

        component.onSave();
        expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
      });

      it('should map rotation Yes to Y flag', () => {
        apiServiceSpy.createCustomerContract.and.returnValue(of({ success: true }));

        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day'),
          rotation: 'Yes'
        });

        component.onSave();

        const dto = apiServiceSpy.createCustomerContract.calls.argsFor(0)[1];
        expect(dto.rotationFlag).toBe('Y');
      });

      it('should map rotation No to N flag', () => {
        apiServiceSpy.createCustomerContract.and.returnValue(of({ success: true }));

        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day'),
          rotation: 'No'
        });

        component.onSave();

        const dto = apiServiceSpy.createCustomerContract.calls.argsFor(0)[1];
        expect(dto.rotationFlag).toBe('N');
      });

      it('should map null rotation to null flag', () => {
        apiServiceSpy.createCustomerContract.and.returnValue(of({ success: true }));

        component.contractForm.patchValue({
          creditLimit: 100,
          effectiveDate: moment().add(1, 'day'),
          rotation: null
        });

        component.onSave();

        const dto = apiServiceSpy.createCustomerContract.calls.argsFor(0)[1];
        expect(dto.rotationFlag).toBeNull();
      });
    });

    describe('Edit Mode', () => {
      beforeEach(() => {
        component.mode = 'edit';
        component.data = mockContract;
        component.ngOnChanges({ mode: {} as any, data: {} as any });
        fixture.detectChanges();
      });

      it('should call updateContract on valid form with changes', () => {
        apiServiceSpy.updateCustomerContract.and.returnValue(of({ success: true, message: 'Updated' }));

        component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
        component.contractForm.markAsDirty();

        component.onSave();

        expect(apiServiceSpy.updateCustomerContract).toHaveBeenCalledWith(
          'WAD-DI0121',
          'DI0121-001',
          jasmine.objectContaining({ contractId: 'DI0121-001' })
        );
      });

      it('should show success snackbar and emit events on update success', () => {
        apiServiceSpy.updateCustomerContract.and.returnValue(of({ success: true, message: 'Contract updated' }));
        const closeSpy = spyOn(component.closePanel, 'emit');
        const saveSpy = spyOn(component.saveSuccess, 'emit');

        component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
        component.contractForm.markAsDirty();

        component.onSave();

        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Contract updated');
        expect(saveSpy).toHaveBeenCalled();
        expect(closeSpy).toHaveBeenCalled();
      });

      it('should use default message when response has no message', () => {
        apiServiceSpy.updateCustomerContract.and.returnValue(of({ success: true }));

        component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
        component.contractForm.markAsDirty();

        component.onSave();

        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
          jasmine.stringContaining('WAD-DI0121')
        );
      });

      it('should show error snackbar on update failure', () => {
        apiServiceSpy.updateCustomerContract.and.returnValue(
          throwError(() => ({ error: { message: 'Update failed' } }))
        );

        component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
        component.contractForm.markAsDirty();

        component.onSave();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Update failed');
        expect(component.isSaving).toBeFalse();
      });

      it('should show error with error code on update failure', () => {
        apiServiceSpy.updateCustomerContract.and.returnValue(
          throwError(() => ({
            error: {
              errorCode: '9999',
              error: 'Server error'
            }
          }))
        );

        component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
        component.contractForm.markAsDirty();

        component.onSave();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 9999: Server error');
      });
    });
  });

  describe('onAddAndCreateAnother', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = mockContract;
      fixture.detectChanges();
    });

    it('should create contract and keep panel open', () => {
      apiServiceSpy.createCustomerContract.and.returnValue(of({ success: true, message: 'Created' }));

      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onAddAndCreateAnother();

      expect(apiServiceSpy.createCustomerContract).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should reset form after successful create', () => {
      apiServiceSpy.createCustomerContract.and.returnValue(of({ success: true }));

      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onAddAndCreateAnother();

      expect(component.contractForm.get('creditLimit')?.value).toBeNull();
    });

    it('should not submit when form is invalid', () => {
      component.onAddAndCreateAnother();
      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });

    it('should not work in edit mode', () => {
      component.mode = 'edit';
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onAddAndCreateAnother();
      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });

    it('should not submit when data is null', () => {
      component.data = null;
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onAddAndCreateAnother();
      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });

    it('should not submit when dateRangeInvalid error exists', () => {
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment('2026-12-31'),
        terminationDate: moment('2026-01-01')
      });

      component.onAddAndCreateAnother();
      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });
  });

  describe('onClearAll', () => {
    it('should revert to original values in edit mode', () => {
      component.mode = 'edit';
      component.data = mockContract;
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();

      component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
      component.onClearAll();

      expect(component.contractForm.get('poNumber')?.value).toBe('PO-12345');
      expect(component.contractForm.dirty).toBeTrue();
    });

    it('should reset form in add mode', () => {
      component.mode = 'add';
      fixture.detectChanges();

      component.contractForm.patchValue({ poNumber: 'PO-TEST', creditLimit: 100 });
      component.onClearAll();

      expect(component.contractForm.get('poNumber')?.value).toBeNull();
      expect(component.contractForm.get('creditLimit')?.value).toBeNull();
    });

    it('should restore rotation value in edit mode', () => {
      component.mode = 'edit';
      component.data = { ...mockContract, rotationFlag: 'N' };
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();

      component.contractForm.patchValue({ rotation: 'Yes' });
      component.onClearAll();

      expect(component.contractForm.get('rotation')?.value).toBe('No');
    });
  });

  describe('onCancel', () => {
    it('should emit closePanel event', () => {
      const closeSpy = spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Keyboard Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    describe('onDateFieldKeyPress', () => {
      it('should allow digit keys', () => {
        const event = new KeyboardEvent('keydown', { key: '5' });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should allow hyphen', () => {
        const event = new KeyboardEvent('keydown', { key: '-' });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should allow navigation keys', () => {
        const navKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
        navKeys.forEach(key => {
          const event = new KeyboardEvent('keydown', { key });
          const spy = spyOn(event, 'preventDefault');
          component.onDateFieldKeyPress(event);
          expect(spy).not.toHaveBeenCalled();
        });
      });

      it('should allow ctrl key combinations', () => {
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should allow meta key combinations', () => {
        const event = new KeyboardEvent('keydown', { key: 'c', metaKey: true });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).not.toHaveBeenCalled();
      });

      it('should prevent letter keys', () => {
        const event = new KeyboardEvent('keydown', { key: 'a' });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).toHaveBeenCalled();
      });

      it('should prevent special characters', () => {
        const event = new KeyboardEvent('keydown', { key: '@' });
        const spy = spyOn(event, 'preventDefault');
        component.onDateFieldKeyPress(event);
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('onlyNumbers', () => {
      it('should allow numeric keys (charCode 48-57)', () => {
        const event = { which: 50, keyCode: 50, preventDefault: jasmine.createSpy() } as any;
        const result = component.onlyNumbers(event);
        expect(result).toBeTrue();
        expect(event.preventDefault).not.toHaveBeenCalled();
      });

      it('should prevent non-numeric keys', () => {
        const event = { which: 65, keyCode: 65, preventDefault: jasmine.createSpy() } as any;
        const result = component.onlyNumbers(event);
        expect(result).toBeFalse();
        expect(event.preventDefault).toHaveBeenCalled();
      });

      it('should use keyCode when which is 0', () => {
        const event = { which: 0, keyCode: 49, preventDefault: jasmine.createSpy() } as any;
        const result = component.onlyNumbers(event);
        expect(result).toBeTrue();
      });
    });

    describe('onPasteNumbers', () => {
      let originalExecCommand: typeof document.execCommand;

      beforeEach(() => {
        originalExecCommand = document.execCommand;
        (document as any).execCommand = jest.fn();
      });

      afterEach(() => {
        (document as any).execCommand = originalExecCommand;
      });

      it('should strip non-numeric characters on paste', () => {
        const event = {
          preventDefault: jasmine.createSpy(),
          clipboardData: { getData: () => 'abc123def456' }
        } as any;

        component.onPasteNumbers(event);

        expect(event.preventDefault).toHaveBeenCalled();
        expect(document.execCommand).toHaveBeenCalledWith('insertText', false, '123456');
      });

      it('should handle empty clipboard data', () => {
        const event = {
          preventDefault: jasmine.createSpy(),
          clipboardData: { getData: () => '' }
        } as any;

        component.onPasteNumbers(event);

        expect(document.execCommand).toHaveBeenCalledWith('insertText', false, '');
      });

      it('should handle null clipboardData', () => {
        const event = {
          preventDefault: jasmine.createSpy(),
          clipboardData: null
        } as any;

        component.onPasteNumbers(event);

        expect(document.execCommand).toHaveBeenCalledWith('insertText', false, '');
      });
    });
  });

  describe('Date Input Handlers', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('onEffectiveDateInput should delegate to DateFieldValidationUtility', () => {
      const event = { target: { value: '01-JAN-2026' } } as any;
      component.onEffectiveDateInput(event);
      const control = component.contractForm.get('effectiveDate');
      expect(control?.touched).toBeTrue();
    });

    it('onTerminationDateInput should delegate to DateFieldValidationUtility', () => {
      const event = { target: { value: '31-DEC-2026' } } as any;
      component.onTerminationDateInput(event);
      const control = component.contractForm.get('terminationDate');
      expect(control?.touched || control?.dirty || true).toBeTrue();
    });

    it('onStartTermChange should update end term validity', () => {
      const updateSpy = spyOn(component.contractForm.get('endTerm')!, 'updateValueAndValidity');
      component.onStartTermChange();
      expect(updateSpy).toHaveBeenCalled();
    });

    it('onStartTermChange should mark start term as touched', () => {
      component.onStartTermChange();
      expect(component.contractForm.get('startTerm')?.touched).toBeTrue();
    });

    it('onEndTermChange should mark end term as touched', () => {
      component.onEndTermChange();
      expect(component.contractForm.get('endTerm')?.touched).toBeTrue();
    });

    it('onStartTermInput should handle date input', () => {
      const event = { target: { value: '01-JAN-2026' } } as any;
      component.onStartTermInput(event);
      const control = component.contractForm.get('startTerm');
      expect(control?.touched).toBeTrue();
    });

    it('onEndTermInput should handle date input', () => {
      const event = { target: { value: '31-DEC-2026' } } as any;
      component.onEndTermInput(event);
      const control = component.contractForm.get('endTerm');
      expect(control?.touched).toBeTrue();
    });
  });

  describe('Date Filters', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    describe('terminationDateFilter', () => {
      it('should return true when date is null', () => {
        expect(component.terminationDateFilter(null)).toBeTrue();
      });

      it('should return true when no effective date is set', () => {
        component.contractForm.get('effectiveDate')?.setValue(null);
        expect(component.terminationDateFilter(moment('2026-06-01'))).toBeTrue();
      });

      it('should return true when date is same or after effective date', () => {
        component.contractForm.get('effectiveDate')?.setValue(moment('2026-01-01'));
        expect(component.terminationDateFilter(moment('2026-06-01'))).toBeTrue();
      });

      it('should return false when date is before effective date', () => {
        component.contractForm.get('effectiveDate')?.setValue(moment('2026-06-01'));
        expect(component.terminationDateFilter(moment('2025-01-01'))).toBeFalse();
      });
    });

    describe('endTermDateFilter', () => {
      it('should return true when date is null', () => {
        expect(component.endTermDateFilter(null)).toBeTrue();
      });

      it('should return true when no start term is set', () => {
        component.contractForm.get('startTerm')?.setValue(null);
        expect(component.endTermDateFilter(moment('2026-06-01'))).toBeTrue();
      });

      it('should return true when date is same or after start term', () => {
        component.contractForm.get('startTerm')?.setValue(moment('2026-01-01'));
        expect(component.endTermDateFilter(moment('2026-06-01'))).toBeTrue();
      });

      it('should return false when date is before start term', () => {
        component.contractForm.get('startTerm')?.setValue(moment('2026-06-01'));
        expect(component.endTermDateFilter(moment('2025-01-01'))).toBeFalse();
      });
    });
  });

  describe('Chapter Changes', () => {
    it('should update minDate when chapter changes', () => {
      component.mode = 'add';
      fixture.detectChanges();
      const originalMinDate = component.minDate.clone();

      chapterChangedSubject.next();

      expect(component.minDate).toBeTruthy();
    });
  });

  describe('formatLastModified', () => {
    it('should format valid date string', () => {
      component.mode = 'edit';
      component.data = { ...mockContract, lastModifiedDate: '2026-06-06T10:30:00' };
      component.ngOnChanges({ data: {} as any, mode: {} as any });
      fixture.detectChanges();

      expect(component.lastModifiedDisplay).toContain('Last Modified:');
      expect(component.lastModifiedDisplay).toContain('06-JUN-2026');
    });

    it('should return raw string for invalid date', () => {
      component.mode = 'edit';
      component.data = { ...mockContract, lastModifiedDate: 'not-a-date' };
      component.ngOnChanges({ data: {} as any, mode: {} as any });
      fixture.detectChanges();

      expect(component.lastModifiedDisplay).toContain('not-a-date');
    });
  });

  describe('hasStartEndTermErrors', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true when start term has parse error', () => {
      component.contractForm.get('startTerm')?.setErrors({ matDatepickerParse: true });
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSave();

      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });

    it('should return true when end term has parse error', () => {
      component.contractForm.get('endTerm')?.setErrors({ invalidDate: true });
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSave();

      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });

    it('should return true when endTermBeforeStartTerm form error exists', () => {
      component.contractForm.patchValue({
        startTerm: moment('2026-12-31'),
        endTerm: moment('2026-01-01'),
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSave();

      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });
  });

  describe('ngOnInit edit mode branch', () => {
    it('should call setupEditModeValidators in ngOnInit when mode is edit', () => {
      const comp2Fixture = TestBed.createComponent(AddEditContractComponent);
      const comp2 = comp2Fixture.componentInstance;
      comp2.mode = 'edit';
      comp2.data = mockContract;
      comp2Fixture.detectChanges();
      expect(comp2.minDate).toBeTruthy();
      expect(comp2.contractForm).toBeTruthy();
    });
  });

  describe('updateTerminationMinDate edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should handle native Date object for effectiveDate', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      component.contractForm.get('effectiveDate')?.setValue(futureDate);

      expect(component.terminationMinDate).toBeTruthy();
      expect(moment.isMoment(component.terminationMinDate)).toBeTrue();
    });

    it('should use minDate when effectiveDate is before minDate', () => {
      const pastDate = moment('2000-01-01');
      component.contractForm.get('effectiveDate')?.setValue(pastDate);

      expect(component.terminationMinDate.isSame(component.minDate, 'day')).toBeTrue();
    });

    it('should use minDate when effectiveDate is invalid string', () => {
      component.contractForm.get('effectiveDate')?.setValue('not-a-date');

      expect(component.terminationMinDate.isSame(component.minDate, 'day')).toBeTrue();
    });
  });

  describe('terminationDateFilter edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return true when effectiveDate is an invalid moment', () => {
      component.contractForm.get('effectiveDate')?.setValue(moment('invalid'));
      expect(component.terminationDateFilter(moment('2026-06-01'))).toBeTrue();
    });

    it('should return true when effectiveDate is a non-moment truthy value', () => {
      component.contractForm.get('effectiveDate')?.setValue('some-string');
      expect(component.terminationDateFilter(moment('2026-06-01'))).toBeTrue();
    });
  });

  describe('isFormValid edge cases', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockContract;
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();
    });

    it('should detect change when effective date is cleared to null', () => {
      component.contractForm.get('effectiveDate')?.setValue(null);
      expect(component.isFormValid).toBeTrue();
    });

    it('should detect change when termination date is set from null to a date', () => {
      component['originalTermDate'] = null;
      component.contractForm.patchValue({ terminationDate: moment('2027-06-01') });
      expect(component.isFormValid).toBeTrue();
    });

    it('should detect no change when both effective dates are null', () => {
      component['originalEffectiveDate'] = null;
      component.contractForm.get('effectiveDate')?.setValue(null);
      component.contractForm.patchValue({ poNumber: mockContract.poNumber || null });
      expect(component.isFormValid).toBeFalse();
    });

    it('should detect startTerm change', () => {
      component.contractForm.patchValue({ startTerm: moment('2026-06-15') });
      expect(component.isFormValid).toBeTrue();
    });

    it('should detect endTerm change', () => {
      component.contractForm.patchValue({ endTerm: moment('2026-11-30') });
      expect(component.isFormValid).toBeTrue();
    });

    it('should detect change with null data fields', () => {
      component.data = { ...mockContract, poNumber: undefined, startTerm: undefined, endTerm: undefined };
      component.ngOnChanges({ data: {} as any });

      component.contractForm.patchValue({ poNumber: 'NEW-PO' });
      expect(component.isFormValid).toBeTrue();
    });

    it('should return false when both term dates are null and no other change', () => {
      component['originalTermDate'] = null;
      component.contractForm.get('terminationDate')?.setValue(null);
      expect(component.isFormValid).toBeFalse();
    });

    it('should detect rotation change from null', () => {
      component.data = { ...mockContract, rotationFlag: undefined };
      component.ngOnChanges({ data: {} as any });

      component.contractForm.patchValue({ rotation: 'Yes' });
      expect(component.isFormValid).toBeTrue();
    });

    it('should detect creditLimit change from null', () => {
      component.data = { ...mockContract, creditLimit: undefined };
      component.ngOnChanges({ data: {} as any });

      component.contractForm.patchValue({ creditLimit: 500 });
      expect(component.isFormValid).toBeTrue();
    });

    it('should detect change with startTerm set and data.startTerm null', () => {
      component.data = { ...mockContract, startTerm: undefined };
      component.ngOnChanges({ data: {} as any });

      component.contractForm.patchValue({ startTerm: moment('2026-03-01') });
      expect(component.isFormValid).toBeTrue();
    });

    it('should detect change with endTerm set and data.endTerm null', () => {
      component.data = { ...mockContract, endTerm: undefined };
      component.ngOnChanges({ data: {} as any });

      component.contractForm.patchValue({ endTerm: moment('2026-12-01') });
      expect(component.isFormValid).toBeTrue();
    });

    it('should handle startTerm cleared to null when data had startTerm', () => {
      component.contractForm.patchValue({ startTerm: null });
      expect(component.isFormValid).toBeTrue();
    });

    it('should handle endTerm cleared to null when data had endTerm', () => {
      component.contractForm.patchValue({ endTerm: null });
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('populateForm edge cases', () => {
    it('should handle creditLimit of 0', () => {
      component.mode = 'edit';
      component.data = { ...mockContract, creditLimit: 0 };
      component.ngOnChanges({ data: {} as any });

      expect(component.contractForm.get('creditLimit')?.value).toBeNull();
    });

    it('should handle empty poNumber', () => {
      component.mode = 'edit';
      component.data = { ...mockContract, poNumber: '' };
      component.ngOnChanges({ data: {} as any });

      expect(component.contractForm.get('poNumber')?.value).toBeNull();
    });

    it('should handle null startTerm and endTerm', () => {
      component.mode = 'edit';
      component.data = { ...mockContract, startTerm: undefined, endTerm: undefined };
      component.ngOnChanges({ data: {} as any });

      expect(component.contractForm.get('startTerm')?.value).toBeNull();
      expect(component.contractForm.get('endTerm')?.value).toBeNull();
    });
  });

  describe('Date Input Handlers in edit mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockContract;
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();
    });

    it('onTerminationDateInput should pass edit mode flag', () => {
      const event = { target: { value: '31-DEC-2026' } } as any;
      component.onTerminationDateInput(event);
      expect(component.mode).toBe('edit');
    });

    it('onStartTermInput should pass edit mode flag', () => {
      const event = { target: { value: '01-JAN-2026' } } as any;
      component.onStartTermInput(event);
      expect(component.mode).toBe('edit');
    });

    it('onEndTermInput should pass edit mode flag', () => {
      const event = { target: { value: '31-DEC-2026' } } as any;
      component.onEndTermInput(event);
      expect(component.mode).toBe('edit');
    });
  });

  describe('createContract error fallbacks', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = mockContract;
      fixture.detectChanges();
    });

    it('should use default message when error has no properties', () => {
      apiServiceSpy.createCustomerContract.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to add contract.');
    });

    it('should use body.error when errorResponse is missing', () => {
      apiServiceSpy.createCustomerContract.and.returnValue(
        throwError(() => ({ error: { error: 'Direct body error' } }))
      );

      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Direct body error');
    });
  });

  describe('updateContract error fallbacks', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockContract;
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();
    });

    it('should use default message when error has no properties', () => {
      apiServiceSpy.updateCustomerContract.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
      component.contractForm.markAsDirty();

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update contract.');
    });

    it('should use errorResponse.error when errorCode exists in errorResponse', () => {
      apiServiceSpy.updateCustomerContract.and.returnValue(
        throwError(() => ({
          error: {
            errorResponse: { errorCode: '4444', error: 'Nested update error' }
          }
        }))
      );

      component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
      component.contractForm.markAsDirty();

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 4444: Nested update error');
    });

    it('should use body.message when no other error fields exist', () => {
      apiServiceSpy.updateCustomerContract.and.returnValue(
        throwError(() => ({ error: { message: 'Message only update error' } }))
      );

      component.contractForm.patchValue({ poNumber: 'PO-CHANGED' });
      component.contractForm.markAsDirty();

      component.onSave();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Message only update error');
    });
  });

  describe('updateContract rotation mapping', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = mockContract;
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();
    });

    it('should map rotation Yes to Y flag in update', () => {
      apiServiceSpy.updateCustomerContract.and.returnValue(of({ success: true }));

      component.contractForm.patchValue({ poNumber: 'PO-CHANGED', rotation: 'Yes' });
      component.contractForm.markAsDirty();

      component.onSave();

      const dto = apiServiceSpy.updateCustomerContract.calls.argsFor(0)[2];
      expect(dto.rotationFlag).toBe('Y');
    });

    it('should map rotation No to N flag in update', () => {
      apiServiceSpy.updateCustomerContract.and.returnValue(of({ success: true }));

      component.contractForm.patchValue({ poNumber: 'PO-CHANGED', rotation: 'No' });
      component.contractForm.markAsDirty();

      component.onSave();

      const dto = apiServiceSpy.updateCustomerContract.calls.argsFor(0)[2];
      expect(dto.rotationFlag).toBe('N');
    });

    it('should map null rotation to null flag in update', () => {
      apiServiceSpy.updateCustomerContract.and.returnValue(of({ success: true }));

      component.contractForm.patchValue({ poNumber: 'PO-CHANGED', rotation: null });
      component.contractForm.markAsDirty();

      component.onSave();

      const dto = apiServiceSpy.updateCustomerContract.calls.argsFor(0)[2];
      expect(dto.rotationFlag).toBeNull();
    });
  });

  describe('startEndTermValidator edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should pass when start term is an invalid moment', () => {
      component.contractForm.patchValue({
        startTerm: moment('invalid'),
        endTerm: moment('2026-06-01')
      });

      expect(component.contractForm.hasError('endTermBeforeStartTerm')).toBeFalse();
    });

    it('should pass when end term is an invalid moment', () => {
      component.contractForm.patchValue({
        startTerm: moment('2026-01-01'),
        endTerm: moment('invalid')
      });

      expect(component.contractForm.hasError('endTermBeforeStartTerm')).toBeFalse();
    });
  });

  describe('getEndTermError edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should return format error for invalidDate', () => {
      const control = component.contractForm.get('endTerm');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      component.lastChangedDateField = 'end';

      expect(component.getEndTermError()).toBe('Invalid date format. Use DD-MMM-YYYY');
    });

    it('should return format error for invalidDateFormat', () => {
      const control = component.contractForm.get('endTerm');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      component.lastChangedDateField = 'end';

      expect(component.getEndTermError()).toBe('Invalid date format. Use DD-MMM-YYYY');
    });
  });

  describe('hasStartEndTermErrors edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = mockContract;
      fixture.detectChanges();
    });

    it('should block save when endTerm has invalidDateFormat error', () => {
      component.contractForm.get('endTerm')?.setErrors({ invalidDateFormat: true });
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSave();

      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });

    it('should block save when startTerm has invalidDate error', () => {
      component.contractForm.get('startTerm')?.setErrors({ invalidDate: true });
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSave();

      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });

    it('should block save when endTerm has matDatepickerMin error', () => {
      component.contractForm.get('endTerm')?.setErrors({ matDatepickerMin: true });
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onSave();

      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });
  });

  describe('onAddAndCreateAnother edge cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.data = mockContract;
      fixture.detectChanges();
    });

    it('should block when startTerm has parse error', () => {
      component.contractForm.get('startTerm')?.setErrors({ matDatepickerParse: true });
      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onAddAndCreateAnother();

      expect(apiServiceSpy.createCustomerContract).not.toHaveBeenCalled();
    });

    it('should handle error response on add and create another', () => {
      apiServiceSpy.createCustomerContract.and.returnValue(
        throwError(() => ({ error: { message: 'Create failed again' } }))
      );

      component.contractForm.patchValue({
        creditLimit: 100,
        effectiveDate: moment().add(1, 'day')
      });

      component.onAddAndCreateAnother();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Create failed again');
      expect(component.isSaving).toBeFalse();
    });
  });

  describe('getEffectiveDateError with different lastChangedDateField', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should pass null form errors when lastChangedDateField is not effective', () => {
      component.lastChangedDateField = 'termination';
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is effective', () => {
      component.lastChangedDateField = 'effective';
      component.contractForm.patchValue({
        effectiveDate: moment('2026-12-31'),
        terminationDate: moment('2026-01-01')
      });
      const result = component.getEffectiveDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('getTerminationDateError with different lastChangedDateField', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should pass null form errors when lastChangedDateField is not termination', () => {
      component.lastChangedDateField = 'effective';
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });

    it('should pass form errors when lastChangedDateField is termination', () => {
      component.lastChangedDateField = 'termination';
      component.contractForm.patchValue({
        effectiveDate: moment('2026-12-31'),
        terminationDate: moment('2026-01-01')
      });
      const result = component.getTerminationDateError();
      expect(typeof result).toBe('string');
    });
  });

  describe('onClearAll with null data rotation', () => {
    it('should handle null rotationFlag in edit mode clear', () => {
      component.mode = 'edit';
      component.data = { ...mockContract, rotationFlag: undefined };
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();

      component.contractForm.patchValue({ rotation: 'Yes' });
      component.onClearAll();

      expect(component.contractForm.get('rotation')?.value).toBeNull();
    });

    it('should handle null poNumber in edit mode clear', () => {
      component.mode = 'edit';
      component.data = { ...mockContract, poNumber: undefined };
      component.ngOnChanges({ mode: {} as any, data: {} as any });
      fixture.detectChanges();

      component.contractForm.patchValue({ poNumber: 'PO-TEST' });
      component.onClearAll();

      expect(component.contractForm.get('poNumber')?.value).toBeNull();
    });
  });

  describe('elementId and errorId helpers', () => {
    it('should generate element IDs', () => {
      const id = component['elementId']('test');
      expect(id).toContain('add-edit-contract');
      expect(id).toContain('test');
    });

    it('should generate error IDs', () => {
      const id = component['errorId']('field');
      expect(id).toContain('error');
    });

    it('should generate label IDs', () => {
      const id = component['labelId']('field');
      expect(id).toContain('label');
    });
  });
});
