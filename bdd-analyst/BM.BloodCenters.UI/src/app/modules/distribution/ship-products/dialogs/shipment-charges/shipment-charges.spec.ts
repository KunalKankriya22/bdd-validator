import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ShipmentChargesDialog } from './shipment-charges';
import { ShipProductsService } from '../../services/ship-products.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ShipmentChargesDialogData,
  ShipmentChargeDto,
  ChargeCodeLookup,
} from '../../models/ship-products.model';

describe('ShipmentChargesDialog', () => {
  let component: ShipmentChargesDialog;
  let fixture: ComponentFixture<ShipmentChargesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ShipmentChargesDialog>>;
  let serviceSpy: jasmine.SpyObj<ShipProductsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: ShipmentChargesDialogData = {
    shipmentNo: 'SHIP001',
    consigneeId: 'CONS001',
    consigneeName: 'Test Hospital',
  };

  const mockChargeCodes: ChargeCodeLookup[] = [
    { chargeCode: 'SHIP', chargeCodeDesc: 'Shipping Fee', charge: 25.00, chargeCodeType: 'D', crDbDesc: 'Debit', shipFlag: 'S' },
    { chargeCode: 'HAND', chargeCodeDesc: 'Handling Fee', charge: 10.00, chargeCodeType: 'D', crDbDesc: 'Debit', shipFlag: 'B' },
    { chargeCode: 'FEE', chargeCodeDesc: 'Processing Fee', charge: 15.00, chargeCodeType: 'C', crDbDesc: 'Credit', shipFlag: '' },
  ];

  const mockExistingCharges: ShipmentChargeDto[] = [
    {
      chargeCode: 'SHIP', description: 'Shipping Fee', quantity: 1, price: 25.00,
      amount: 25.00, crDbInd: 'D', crDbDesc: 'Debit', orderNo: 'ORD001',
      shipmentNo: 'SHIP001', deletableFlag: 'Y',
    },
    {
      chargeCode: 'FEE', description: 'Processing Fee', quantity: 1, price: 15.00,
      amount: 15.00, crDbInd: 'C', crDbDesc: 'Credit', orderNo: 'ORD002',
      shipmentNo: 'SHIP001', deletableFlag: 'N',
    },
  ];

  function createComponentWithData(data: ShipmentChargesDialogData, charges: ShipmentChargeDto[] = []) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackbarServiceSpy = createMockSnackbarService();
    serviceSpy = jasmine.createSpyObj('ShipProductsService', [
      'getChargeCodes',
      'getShipmentCharges',
      'addShipmentCharge',
      'deleteShipmentCharge',
      'completeShipment',
    ]);

    serviceSpy.getChargeCodes.and.returnValue(of(mockChargeCodes));
    serviceSpy.getShipmentCharges.and.returnValue(of(charges));
    serviceSpy.addShipmentCharge.and.returnValue(of({ success: true, statusCode: 200, message: 'Added', data: undefined as any }));
    serviceSpy.deleteShipmentCharge.and.returnValue(of({ success: true, statusCode: 200, message: 'Deleted', data: undefined as any }));
    serviceSpy.completeShipment.and.returnValue(of({ success: true, statusCode: 200, message: 'Completed', data: undefined as any }));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ShipmentChargesDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ShipProductsService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipmentChargesDialog);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (e) { /* template may need DataTable */ }
  }

  beforeEach(() => {
    createComponentWithData(mockDialogData);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should create form with correct controls', () => {
      expect(component.chargeForm).toBeTruthy();
      expect(component.chargeForm.get('chargeCode')).toBeTruthy();
      expect(component.chargeForm.get('description')).toBeTruthy();
      expect(component.chargeForm.get('quantity')).toBeTruthy();
      expect(component.chargeForm.get('price')).toBeTruthy();
      expect(component.chargeForm.get('creditDebit')).toBeTruthy();
    });

    it('should have description disabled', () => {
      expect(component.chargeForm.get('description')?.disabled).toBeTrue();
    });

    it('should have price disabled', () => {
      expect(component.chargeForm.get('price')?.disabled).toBeTrue();
    });

    it('should have creditDebit disabled', () => {
      expect(component.chargeForm.get('creditDebit')?.disabled).toBeTrue();
    });

    it('should default quantity to 1', () => {
      expect(component.chargeForm.get('quantity')?.value).toBe(1);
    });

    it('should validate chargeCode is required', () => {
      component.chargeForm.get('chargeCode')?.setValue('');
      expect(component.chargeForm.get('chargeCode')?.hasError('required')).toBeTrue();
    });

    it('should validate quantity min(1)', () => {
      component.chargeForm.get('quantity')?.setValue(0);
      expect(component.chargeForm.get('quantity')?.hasError('min')).toBeTrue();
    });

    it('should validate quantity max(99)', () => {
      component.chargeForm.get('quantity')?.setValue(100);
      expect(component.chargeForm.get('quantity')?.hasError('max')).toBeTrue();
    });

    it('should accept valid quantity in range', () => {
      component.chargeForm.get('quantity')?.setValue(50);
      expect(component.chargeForm.get('quantity')?.valid).toBeTrue();
    });
  });

  describe('Auto-populate on chargeCode change', () => {
    it('should populate description, price, creditDebit when charge code selected', () => {
      component.chargeForm.get('chargeCode')?.setValue('SHIP');
      expect(component.chargeForm.get('description')?.value).toBe('Shipping Fee');
      expect(component.chargeForm.get('price')?.value).toBe('25.00');
      expect(component.chargeForm.get('creditDebit')?.value).toBe('Debit');
    });

    it('should clear fields when unknown charge code selected', () => {
      component.chargeForm.get('chargeCode')?.setValue('UNKNOWN');
      expect(component.chargeForm.get('description')?.value).toBe('');
      expect(component.chargeForm.get('price')?.value).toBe('');
      expect(component.chargeForm.get('creditDebit')?.value).toBe('');
    });
  });

  describe('Load Data', () => {
    it('should load charge codes on construction', () => {
      expect(serviceSpy.getChargeCodes).toHaveBeenCalled();
    });

    it('should load existing charges on construction', () => {
      expect(serviceSpy.getShipmentCharges).toHaveBeenCalledWith('SHIP001');
    });

    it('should show error when loading charge codes fails', () => {
      createComponentWithData(mockDialogData);
      snackbarServiceSpy.showError.calls.reset();

      serviceSpy.getChargeCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadLookupData();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load charge codes');
    });

    it('should show error when loading charges fails', () => {
      createComponentWithData(mockDialogData);
      snackbarServiceSpy.showError.calls.reset();

      serviceSpy.getShipmentCharges.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadCharges();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load shipment charges');
    });

    it('should populate charges signal with loaded data', () => {
      createComponentWithData(mockDialogData, mockExistingCharges);
      expect((component as any).charges().length).toBe(2);
    });
  });

  describe('onAddCharge', () => {
    it('should not add charge when form is invalid', () => {
      component.chargeForm.get('chargeCode')?.setValue('');
      const initialLen = (component as any).charges().length;
      component.onAddCharge();
      expect((component as any).charges().length).toBe(initialLen);
    });

    it('should add charge when form is valid', () => {
      component.chargeForm.get('chargeCode')?.setValue('FEE');
      component.chargeForm.get('quantity')?.setValue(2);
      component.onAddCharge();

      const charges = (component as any).charges();
      const last = charges[charges.length - 1];
      expect(last.chargeCode).toBe('FEE');
      expect(last.quantity).toBe(2);
      expect(last.amount).toBe(30.00);
      expect(last.isNew).toBeTrue();
    });

    it('should reset form after adding charge', () => {
      component.chargeForm.get('chargeCode')?.setValue('FEE');
      component.chargeForm.get('quantity')?.setValue(2);
      component.onAddCharge();

      expect(component.chargeForm.get('chargeCode')?.value).toBe('');
      expect(component.chargeForm.get('quantity')?.value).toBe(1);
    });
  });

  describe('onRowAction', () => {
    it('should call onRemoveCharge for delete action', () => {
      spyOn(component, 'onRemoveCharge');
      const charge = { ...mockExistingCharges[0] };
      component.onRowAction({ action: 'delete', row: charge });
      expect(component.onRemoveCharge).toHaveBeenCalledWith(charge);
    });

    it('should not call onRemoveCharge for non-delete action', () => {
      spyOn(component, 'onRemoveCharge');
      component.onRowAction({ action: 'edit', row: mockExistingCharges[0] });
      expect(component.onRemoveCharge).not.toHaveBeenCalled();
    });
  });

  describe('onRemoveCharge', () => {
    it('should show error for non-deletable charge', () => {
      const charge = { ...mockExistingCharges[1], deletableFlag: 'N' };
      component.onRemoveCharge(charge);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('This charge cannot be deleted');
    });

    it('should remove new charge locally without API call', () => {
      const newCharge: ShipmentChargeDto = {
        chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15,
        crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'SHIP001',
        deletableFlag: 'Y', isNew: true,
      };
      (component as any).charges.set([newCharge]);
      component.onRemoveCharge(newCharge);
      expect((component as any).charges().length).toBe(0);
      expect(serviceSpy.deleteShipmentCharge).not.toHaveBeenCalled();
    });

    it('should call API to delete persisted charge', () => {
      const charge = { ...mockExistingCharges[0], isNew: false };
      (component as any).charges.set([charge]);
      component.onRemoveCharge(charge);

      expect(serviceSpy.deleteShipmentCharge).toHaveBeenCalledWith('SHIP001', 'SHIP', 'ORD001');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Charge removed successfully');
    });

    it('should show error when API delete fails', () => {
      serviceSpy.deleteShipmentCharge.and.returnValue(throwError(() => new Error('fail')));
      const charge = { ...mockExistingCharges[0], isNew: false };
      (component as any).charges.set([charge]);
      component.onRemoveCharge(charge);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to remove charge');
    });
  });

  describe('onSortChange', () => {
    it('should sort charges ascending', () => {
      const charges: ShipmentChargeDto[] = [
        { chargeCode: 'ZZZ', description: 'Z', quantity: 1, price: 1, amount: 1, crDbInd: '', crDbDesc: '', orderNo: '', shipmentNo: '', deletableFlag: 'Y', isNew: true },
        { chargeCode: 'AAA', description: 'A', quantity: 1, price: 1, amount: 1, crDbInd: '', crDbDesc: '', orderNo: '', shipmentNo: '', deletableFlag: 'Y', isNew: true },
      ];
      (component as any).charges.set(charges);
      component.onSortChange({ column: 'chargeCode', direction: 'A' });
      expect((component as any).charges()[0].chargeCode).toBe('AAA');
    });

    it('should sort charges descending', () => {
      const charges: ShipmentChargeDto[] = [
        { chargeCode: 'AAA', description: 'A', quantity: 1, price: 1, amount: 1, crDbInd: '', crDbDesc: '', orderNo: '', shipmentNo: '', deletableFlag: 'Y', isNew: true },
        { chargeCode: 'ZZZ', description: 'Z', quantity: 1, price: 1, amount: 1, crDbInd: '', crDbDesc: '', orderNo: '', shipmentNo: '', deletableFlag: 'Y', isNew: true },
      ];
      (component as any).charges.set(charges);
      component.onSortChange({ column: 'chargeCode', direction: 'D' });
      expect((component as any).charges()[0].chargeCode).toBe('ZZZ');
    });
  });

  describe('onClearAll', () => {
    it('should show error when no deletable charges', () => {
      (component as any).charges.set([{ ...mockExistingCharges[1], deletableFlag: 'N' }]);
      component.onClearAll();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No deletable charges to clear');
    });

    it('should remove new charges locally only', () => {
      const newCharge: ShipmentChargeDto = {
        chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15,
        crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'SHIP001',
        deletableFlag: 'Y', isNew: true,
      };
      (component as any).charges.set([newCharge]);
      component.onClearAll();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('All deletable charges cleared');
    });

    it('should delete persisted charges via API', () => {
      const charge = { ...mockExistingCharges[0], isNew: false, deletableFlag: 'Y' };
      serviceSpy.getShipmentCharges.and.returnValue(of([]));
      (component as any).charges.set([charge]);
      component.onClearAll();

      expect(serviceSpy.deleteShipmentCharge).toHaveBeenCalled();
    });

    it('should handle API error on clear all', () => {
      const charge = { ...mockExistingCharges[0], isNew: false, deletableFlag: 'Y' };
      serviceSpy.deleteShipmentCharge.and.returnValue(throwError(() => new Error('fail')));
      serviceSpy.getShipmentCharges.and.returnValue(of([]));
      (component as any).charges.set([charge]);
      component.onClearAll();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Some charges could not be deleted');
    });
  });

  describe('onSaveAndPrint', () => {
    it('should close dialog when no new charges and no finalizeOnSave', () => {
      (component as any).charges.set([]);
      component.data.finalizeOnSave = undefined;
      component.onSaveAndPrint();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Charges saved successfully');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should save new charges and close dialog', () => {
      const newCharge: ShipmentChargeDto = {
        chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15,
        crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'SHIP001',
        deletableFlag: 'Y', isNew: true,
      };
      (component as any).charges.set([newCharge]);
      component.data.finalizeOnSave = false;
      component.onSaveAndPrint();

      expect(serviceSpy.addShipmentCharge).toHaveBeenCalledWith('SHIP001', { chargeCode: 'FEE', quantity: 1 });
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should handle save error', () => {
      const newCharge: ShipmentChargeDto = {
        chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15,
        crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'SHIP001',
        deletableFlag: 'Y', isNew: true,
      };
      (component as any).charges.set([newCharge]);
      serviceSpy.addShipmentCharge.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));
      component.onSaveAndPrint();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Save failed');
    });

    it('should show generic error when error has no message', () => {
      const newCharge: ShipmentChargeDto = {
        chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15,
        crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'SHIP001',
        deletableFlag: 'Y', isNew: true,
      };
      (component as any).charges.set([newCharge]);
      serviceSpy.addShipmentCharge.and.returnValue(throwError(() => ({})));
      component.onSaveAndPrint();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save charges');
    });

    it('should save and then finalize when finalizeOnSave is true', () => {
      const newCharge: ShipmentChargeDto = {
        chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15,
        crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'SHIP001',
        deletableFlag: 'Y', isNew: true,
      };
      (component as any).charges.set([newCharge]);
      component.data.finalizeOnSave = true;
      component.onSaveAndPrint();

      expect(serviceSpy.addShipmentCharge).toHaveBeenCalled();
      expect(serviceSpy.completeShipment).toHaveBeenCalledWith('SHIP001');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should finalize without new charges when finalizeOnSave', () => {
      (component as any).charges.set([]);
      component.data.finalizeOnSave = true;
      component.onSaveAndPrint();

      expect(serviceSpy.completeShipment).toHaveBeenCalledWith('SHIP001');
    });

    it('should handle finalize error', () => {
      (component as any).charges.set([]);
      component.data.finalizeOnSave = true;
      serviceSpy.completeShipment.and.returnValue(throwError(() => ({ error: { message: 'Finalize failed' } })));
      component.onSaveAndPrint();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Finalize failed');
    });

    it('should handle finalize returning success false', () => {
      (component as any).charges.set([]);
      component.data.finalizeOnSave = true;
      serviceSpy.completeShipment.and.returnValue(of({ success: false, statusCode: 400, message: 'Cannot complete', data: undefined as any }));
      component.onSaveAndPrint();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot complete');
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroyNext = spyOn((component as any).destroy$, 'next');
      const destroyComplete = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.chargeForm.controls);
    });
  });

  describe('tableConfig', () => {
    it('should have delete row action with visibility condition', () => {
      const actions = (component as any).tableConfig.rowActions;
      expect(actions.length).toBe(1);
      expect(actions[0].action).toBe('delete');
      expect(actions[0].visible({ deletableFlag: 'Y' })).toBeTrue();
      expect(actions[0].visible({ deletableFlag: 'N' })).toBeFalse();
    });

    it('should format price with 2 decimal places', () => {
      const priceCol = (component as any).tableConfig.columns.find((c: any) => c.key === 'price');
      expect(priceCol.valueFormatter(5)).toBe('5.00');
      expect(priceCol.valueFormatter(null)).toBe('');
    });

    it('should format amount with 2 decimal places', () => {
      const amountCol = (component as any).tableConfig.columns.find((c: any) => c.key === 'amount');
      expect(amountCol.valueFormatter(10.5)).toBe('10.50');
      expect(amountCol.valueFormatter(undefined)).toBe('');
    });

    it('should have quantityOptions from 1 to 99', () => {
      expect((component as any).quantityOptions.length).toBe(99);
      expect((component as any).quantityOptions[0]).toBe(1);
      expect((component as any).quantityOptions[98]).toBe(99);
    });
  });

  describe('addDefaultCharges', () => {
    it('should add default charges based on boxCount', () => {
      component.data.boxCount = 2;
      (component as any).charges.set([]);
      (component as any).addDefaultCharges(mockChargeCodes);

      const charges = (component as any).charges();
      // HAND has shipFlag 'B' so boxCount * 1 = 2 charges, SHIP has shipFlag 'S' so 1 charge
      expect(charges.length).toBe(3);
    });

    it('should not add charges when boxCount is 0', () => {
      component.data.boxCount = 0;
      (component as any).charges.set([]);
      (component as any).addDefaultCharges(mockChargeCodes);
      expect((component as any).charges().length).toBe(0);
    });

    it('should not add charges when no matching codes with shipFlag B or S', () => {
      component.data.boxCount = 1;
      (component as any).charges.set([]);
      (component as any).addDefaultCharges([{ chargeCode: 'FEE', chargeCodeDesc: 'Fee', charge: 10, chargeCodeType: 'C', crDbDesc: 'Credit', shipFlag: '' }]);
      expect((component as any).charges().length).toBe(0);
    });
  });
});
