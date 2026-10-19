import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { SnackbarService } from '@shared/services/snackbar.service';

import { AddEditChargeDialogComponent } from './add-edit-charge-dialog';
import { EnterOrderChargesApiService } from '../../services/enter-order-charges-api.service';
import { AddEditChargeDialogData, ServiceCodeDto, CrDbIndicatorDto } from '../../models/enter-order-charges.model';

describe('AddEditChargeDialogComponent', () => {
  let component: AddEditChargeDialogComponent;
  let fixture: ComponentFixture<AddEditChargeDialogComponent>;
  let mockApiService: jasmine.SpyObj<EnterOrderChargesApiService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddEditChargeDialogComponent>>;

  const serviceCodes: ServiceCodeDto[] = [
    { code: 'SVC1', description: 'Service One', defaultAmount: 50, isAmountEditable: true },
    { code: 'SVC2', description: 'Service Two', defaultAmount: 100, isAmountEditable: false },
    { code: 'SVC3', description: 'Service Three', defaultAmount: 75 },
  ];

  const crDbIndicators: CrDbIndicatorDto[] = [
    { code: 'CR', description: 'Credit' },
    { code: 'DB', description: 'Debit' },
  ];

  const addModeData: AddEditChargeDialogData = {
    mode: 'add',
    orderNo: 'ORD001',
    serviceCodes,
    crDbIndicators,
  };

  const editModeData: AddEditChargeDialogData = {
    mode: 'edit',
    orderNo: 'ORD001',
    charge: {
      orderChargeRowId: 'AAARxYAAEAAAARzAAA',
      chargeId: 'SVC1',
      serviceCode: 'SVC1',
      serviceDescription: 'Service One',
      creditDebit: 'Credit',
      quantity: 2,
      amount: 100,
      isAmountEditable: true,
      lastModified: '2024-01-15 10:00',
    },
    serviceCodes,
    crDbIndicators,
  };

  function createComponent(data: AddEditChargeDialogData): void {
    mockApiService = jasmine.createSpyObj('EnterOrderChargesApiService', [
      'addCharge', 'updateCharge',
    ]);
    mockSnackbar = createMockSnackbarService();
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: EnterOrderChargesApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbar },
      ],
    }).overrideComponent(AddEditChargeDialogComponent, {
      set: {
        imports: [CommonModule, ReactiveFormsModule],
        template: '',
      },
    });

    fixture = TestBed.createComponent(AddEditChargeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Add mode', () => {
    beforeEach(() => createComponent(addModeData));

    it('should create in add mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBeFalse();
    });

    it('should set panelTitle to "Add New Charges"', () => {
      expect(component.panelTitle).toBe('Add New Charges');
    });

    it('should return empty lastModifiedDisplay', () => {
      expect(component.lastModifiedDisplay).toBe('');
    });

    it('should initialize form with default values', () => {
      expect(component.form.get('serviceCode')?.value).toBe('');
      expect(component.form.get('creditDebit')?.value).toBe('');
      expect(component.form.get('quantity')?.value).toBe(1);
      expect(component.form.get('amount')?.value).toBe('');
    });

    it('should mark form as invalid when required fields are empty', () => {
      expect(component.form.invalid).toBeTrue();
    });

    it('should invalidate quantity exceeding 99999', () => {
      component.form.get('quantity')?.setValue(100000);
      expect(component.form.get('quantity')?.hasError('max')).toBeTrue();
    });

    it('should allow quantity at max boundary 99999', () => {
      component.form.get('quantity')?.setValue(99999);
      expect(component.form.get('quantity')?.hasError('max')).toBeFalse();
    });

    it('should invalidate amount exceeding 99999999.99', () => {
      component.form.get('amount')?.setValue(100000000);
      expect(component.form.get('amount')?.hasError('max')).toBeTrue();
    });

    it('should allow amount at max boundary 99999999.99', () => {
      component.form.get('amount')?.setValue(99999999.99);
      expect(component.form.get('amount')?.hasError('max')).toBeFalse();
    });

    it('should mark all fields as touched when saving invalid form', () => {
      component.onSave();
      expect(component.form.get('serviceCode')?.touched).toBeTrue();
      expect(component.form.get('creditDebit')?.touched).toBeTrue();
    });

    it('should update service description when service code changes', () => {
      component.form.get('serviceCode')?.setValue('SVC1');
      expect(component.serviceDescription()).toBe('Service One');
    });

    it('should recalculate amount when service code changes', () => {
      component.form.get('serviceCode')?.setValue('SVC1');
      expect(component.form.get('amount')?.value).toBe(50);
    });

    it('should recalculate amount when quantity changes', () => {
      component.form.get('serviceCode')?.setValue('SVC1');
      component.form.get('quantity')?.setValue(3);
      expect(component.form.get('amount')?.value).toBe(150);
    });

    it('should disable amount field for non-editable service codes', () => {
      component.form.get('serviceCode')?.setValue('SVC2');
      expect(component.form.get('amount')?.disabled).toBeTrue();
      expect(component.amountEditable()).toBeFalse();
    });

    it('should enable amount field for editable service codes', () => {
      component.form.get('serviceCode')?.setValue('SVC1');
      expect(component.form.get('amount')?.enabled).toBeTrue();
      expect(component.amountEditable()).toBeTrue();
    });

    it('should default isAmountEditable to true when not specified', () => {
      component.form.get('serviceCode')?.setValue('SVC3');
      expect(component.amountEditable()).toBeTrue();
    });

    it('should clear service description for unknown code', () => {
      component.form.get('serviceCode')?.setValue('UNKNOWN');
      expect(component.serviceDescription()).toBe('');
    });

    describe('onSave - add', () => {
      beforeEach(() => {
        component.form.patchValue({
          serviceCode: 'SVC1',
          creditDebit: 'Credit',
          quantity: 2,
          amount: 100,
        });
      });

      it('should call addCharge API on save with mapped CR/DB code', () => {
        mockApiService.addCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
        component.onSave();
        expect(mockApiService.addCharge).toHaveBeenCalledWith('ORD001', jasmine.objectContaining({
          serviceCode: 'SVC1',
          creditDebit: 'CR',
          quantity: 2,
          amount: 100,
        }));
      });

      it('should not include rowId in add mode', () => {
        mockApiService.addCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
        component.onSave();
        const request = mockApiService.addCharge.calls.mostRecent().args[1];
        expect(request.rowId).toBeUndefined();
      });

      it('should show success snackbar and close dialog on success', () => {
        mockApiService.addCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
        component.onSave();
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Charge added successfully.');
        expect(mockDialogRef.close).toHaveBeenCalledWith(true);
      });

      it('should show error snackbar when API returns unsuccessful', () => {
        mockApiService.addCharge.and.returnValue(of({
          success: false,
          message: 'Duplicate charge',
          statusCode: 400,
        }));
        component.onSave();
        expect(mockSnackbar.showError).toHaveBeenCalledWith('Duplicate charge');
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });

      it('should show error snackbar on API failure', () => {
        mockApiService.addCharge.and.returnValue(throwError(() => new Error('Server error')));
        component.onSave();
        expect(mockSnackbar.showError).toHaveBeenCalled();
        expect(component.isSaving).toBeFalse();
      });

      it('should not save when form is invalid', () => {
        component.form.get('serviceCode')?.setValue('');
        component.onSave();
        expect(mockApiService.addCharge).not.toHaveBeenCalled();
      });

      it('should not save when already saving', () => {
        mockApiService.addCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
        component.isSaving = true;
        component.onSave();
        expect(mockApiService.addCharge).not.toHaveBeenCalled();
      });

      it('should set isSaving during save operation', () => {
        mockApiService.addCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
        component.onSave();
        expect(component.isSaving).toBeFalse();
      });
    });

    it('should close dialog on cancel', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('Edit mode', () => {
    beforeEach(() => createComponent(editModeData));

    it('should create in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should set panelTitle to "Edit Order Charges"', () => {
      expect(component.panelTitle).toBe('Edit Order Charges');
    });

    it('should display last modified info', () => {
      expect(component.lastModifiedDisplay).toBe('Last Modified: 2024-01-15 10:00');
    });

    it('should initialize form with charge values', () => {
      expect(component.form.get('serviceCode')?.value).toBe('SVC1');
      expect(component.form.get('creditDebit')?.value).toBe('Credit');
      expect(component.form.get('quantity')?.value).toBe(2);
      expect(component.form.get('amount')?.value).toBe(100);
    });

    it('should set service description from charge data', () => {
      expect(component.serviceDescription()).toBe('Service One');
    });

    it('should set selectedServiceCode from charge data', () => {
      expect(component.selectedServiceCode()?.code).toBe('SVC1');
    });

    it('should disable save when no values have changed', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should enable save when a value changes', () => {
      component.form.get('quantity')?.setValue(5);
      expect(component.isFormValid).toBeTrue();
    });

    it('should not call API when save is attempted without changes', () => {
      mockApiService.updateCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
      component.onSave();
      expect(mockApiService.updateCharge).not.toHaveBeenCalled();
    });

    it('should call updateCharge API on save after value change with mapped code', () => {
      component.form.get('quantity')?.setValue(5);
      mockApiService.updateCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
      component.onSave();
      expect(mockApiService.updateCharge).toHaveBeenCalledWith(
        jasmine.objectContaining({ serviceCode: 'SVC1', creditDebit: 'CR', rowId: 'AAARxYAAEAAAARzAAA' }),
      );
    });

    it('should include rowId from original charge data', () => {
      component.form.get('quantity')?.setValue(5);
      mockApiService.updateCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
      component.onSave();
      const request = mockApiService.updateCharge.calls.mostRecent().args[0];
      expect(request.rowId).toBe('AAARxYAAEAAAARzAAA');
    });

    it('should show success snackbar with update message', () => {
      component.form.get('quantity')?.setValue(5);
      mockApiService.updateCharge.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
      component.onSave();
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Charge updated successfully.');
    });

    it('should show error from errorResponse on update failure', () => {
      component.form.get('quantity')?.setValue(5);
      mockApiService.updateCharge.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 500,
        errorResponse: { errorCode: 'ERR', error: 'Update failed' },
      }));
      component.onSave();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Update failed');
    });
  });

  describe('Service code search filtering', () => {
    beforeEach(() => createComponent(addModeData));

    it('should return all service codes when search is empty', () => {
      expect(component.filteredServiceCodes().length).toBe(3);
    });

    it('should filter service codes by code', () => {
      component.serviceCodeSearchCtrl.setValue('SVC1');
      expect(component.filteredServiceCodes().length).toBe(1);
      expect(component.filteredServiceCodes()[0].code).toBe('SVC1');
    });

    it('should filter service codes by description', () => {
      component.serviceCodeSearchCtrl.setValue('Three');
      expect(component.filteredServiceCodes().length).toBe(1);
      expect(component.filteredServiceCodes()[0].code).toBe('SVC3');
    });

    it('should return empty when no match', () => {
      component.serviceCodeSearchCtrl.setValue('XYZ');
      expect(component.filteredServiceCodes().length).toBe(0);
    });

    it('should be case insensitive', () => {
      component.serviceCodeSearchCtrl.setValue('service two');
      expect(component.filteredServiceCodes().length).toBe(1);
      expect(component.filteredServiceCodes()[0].code).toBe('SVC2');
    });
  });

  describe('Edit mode - charge without lastModified', () => {
    it('should return empty lastModifiedDisplay', () => {
      createComponent({
        ...editModeData,
        charge: { ...editModeData.charge!, lastModified: undefined },
      });
      expect(component.lastModifiedDisplay).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => createComponent(addModeData));

    it('should complete the destroy subject', () => {
      component.ngOnDestroy();
      expect(component['destroy$'].isStopped).toBeTrue();
    });
  });
});
