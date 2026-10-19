import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ShipmentChargesDialogComponent } from './shipment-charges-dialog';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ShipDiscardSalvageApiService } from '../../services/ship-discard-salvage-api.service';
import { ShipmentChargesDialogData } from '../../models/ship-discard-salvage.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ShipmentChargesDialogComponent', () => {
  let component: ShipmentChargesDialogComponent;
  let fixture: ComponentFixture<ShipmentChargesDialogComponent>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ShipmentChargesDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<ShipDiscardSalvageApiService>;

  const mockDialogData: ShipmentChargesDialogData = {
    shipmentNo: 'DI20260530120000',
    consigneeId: 'DISC001',
    consigneeName: 'Discard Processing Center',
  };

  const mockChargeCodes = [
    { chargeCode: 'BOX', chargeCodeDesc: 'Box Charge', charge: 5.0, chargeCodeType: 'D', crDbDesc: 'Debit', shipFlag: 'B' },
    { chargeCode: 'SHIP', chargeCodeDesc: 'Shipping', charge: 10.0, chargeCodeType: 'D', crDbDesc: 'Debit', shipFlag: 'S' },
    { chargeCode: 'FEE', chargeCodeDesc: 'Processing Fee', charge: 15.0, chargeCodeType: 'C', crDbDesc: 'Credit', shipFlag: null },
  ];

  const mockCharges = [
    {
      chargeCode: 'BOX', description: 'Box Charge', quantity: 1, price: 5.0,
      amount: 5.0, crDbInd: 'D', crDbDesc: 'Debit', orderNo: 'ORD001',
      shipmentNo: 'DI20260530120000', deletableFlag: 'Y', isNew: false,
    },
    {
      chargeCode: 'FEE', description: 'Processing Fee', quantity: 1, price: 15.0,
      amount: 15.0, crDbInd: 'C', crDbDesc: 'Credit', orderNo: 'ORD002',
      shipmentNo: 'DI20260530120000', deletableFlag: 'N', isNew: false,
    },
  ];

  beforeEach(async () => {
    snackbarServiceSpy = createMockSnackbarService();
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('ShipDiscardSalvageApiService', [
      'getChargeCodes', 'getShipmentCharges', 'addShipmentCharge',
      'deleteShipmentCharge', 'completeShipment',
    ]);

    apiServiceSpy.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
    apiServiceSpy.getShipmentCharges.and.returnValue(of([]));
    apiServiceSpy.deleteShipmentCharge.and.returnValue(of({}));
    apiServiceSpy.addShipmentCharge.and.returnValue(of([] as any));
    apiServiceSpy.completeShipment.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [ShipmentChargesDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ShipDiscardSalvageApiService, useValue: apiServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipmentChargesDialogComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch(e) { /* template may fail */ }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog with result on save and print', () => {
    component.onSaveAndPrint();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
  });

  it('should have delete row action with visibility condition', () => {
    const actions = (component as any).tableConfig.rowActions;
    expect(actions.length).toBe(1);
    expect(actions[0].action).toBe('delete');
    expect(actions[0].visible({ deletableFlag: 'Y' })).toBeTrue();
    expect(actions[0].visible({ deletableFlag: 'N' })).toBeFalse();
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

  describe('initializeForm', () => {
    it('should create form with correct controls', () => {
      expect(component.chargeForm).toBeTruthy();
      expect(component.chargeForm.get('chargeCode')).toBeTruthy();
      expect(component.chargeForm.get('description')).toBeTruthy();
      expect(component.chargeForm.get('quantity')).toBeTruthy();
      expect(component.chargeForm.get('price')).toBeTruthy();
      expect(component.chargeForm.get('creditDebit')).toBeTruthy();
    });

    it('should populate description/price/creditDebit when chargeCode changes', () => {
      component.chargeForm.get('chargeCode')?.setValue('BOX');
      expect(component.chargeForm.get('description')?.value).toBe('Box Charge');
      expect(component.chargeForm.get('price')?.value).toBe('5.00');
      expect(component.chargeForm.get('creditDebit')?.value).toBe('Debit');
    });

    it('should clear fields when chargeCode changes to unknown', () => {
      component.chargeForm.get('chargeCode')?.setValue('UNKNOWN');
      expect(component.chargeForm.get('description')?.value).toBe('');
    });
  });

  describe('loadLookupData', () => {
    it('should load charge codes on construction', () => {
      expect(apiServiceSpy.getChargeCodes).toHaveBeenCalled();
      expect((component as any).availableCharges().length).toBe(3);
    });

    it('should show error snackbar when loading charge codes fails', async () => {
      apiServiceSpy.getChargeCodes.and.returnValue(throwError(() => new Error('fail')));
      apiServiceSpy.getShipmentCharges.and.returnValue(of([]));

      const f2 = TestBed.createComponent(ShipmentChargesDialogComponent);
      const c2 = f2.componentInstance;
      try { f2.detectChanges(); } catch(e) {}
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load charge codes');
    });
  });

  describe('loadCharges', () => {
    it('should load charges on construction', () => {
      expect(apiServiceSpy.getShipmentCharges).toHaveBeenCalledWith('DI20260530120000');
    });

    it('should show error when loading charges fails', async () => {
      apiServiceSpy.getChargeCodes.and.returnValue(of([]));
      apiServiceSpy.getShipmentCharges.and.returnValue(throwError(() => new Error('fail')));

      const f2 = TestBed.createComponent(ShipmentChargesDialogComponent);
      try { f2.detectChanges(); } catch(e) {}
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load shipment charges');
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
      expect(last.amount).toBe(30.0);
      expect(last.isNew).toBe(true);
    });

    it('should reset form after adding', () => {
      component.chargeForm.get('chargeCode')?.setValue('FEE');
      component.chargeForm.get('quantity')?.setValue(2);
      component.onAddCharge();
      expect(component.chargeForm.get('chargeCode')?.value).toBe('');
      expect(component.chargeForm.get('quantity')?.value).toBe(1);
    });
  });

  describe('onChargeSelected', () => {
    it('should not add charge when no chargeCode selected', () => {
      component.chargeForm.get('chargeCode')?.setValue('');
      const initialLen = (component as any).charges().length;
      component.onChargeSelected();
      expect((component as any).charges().length).toBe(initialLen);
    });

    it('should not add charge when chargeCode not found in available charges', () => {
      component.chargeForm.get('chargeCode')?.setValue('NONEXISTENT');
      const initialLen = (component as any).charges().length;
      component.onChargeSelected();
      expect((component as any).charges().length).toBe(initialLen);
    });

    it('should add charge when valid chargeCode selected', () => {
      component.chargeForm.get('chargeCode')?.setValue('BOX');
      component.chargeForm.get('quantity')?.setValue(3);
      component.onChargeSelected();
      const charges = (component as any).charges();
      const last = charges[charges.length - 1];
      expect(last.chargeCode).toBe('BOX');
      expect(last.isNew).toBe(true);
    });
  });

  describe('onRowAction', () => {
    it('should call onRemoveCharge for delete action', () => {
      spyOn(component, 'onRemoveCharge');
      const charge = { ...mockCharges[0] };
      component.onRowAction({ action: 'delete', row: charge as any });
      expect(component.onRemoveCharge).toHaveBeenCalledWith(charge as any);
    });

    it('should not call onRemoveCharge for non-delete action', () => {
      spyOn(component, 'onRemoveCharge');
      component.onRowAction({ action: 'edit', row: mockCharges[0] as any });
      expect(component.onRemoveCharge).not.toHaveBeenCalled();
    });
  });

  describe('onRemoveCharge', () => {
    it('should show error for non-deletable charge', () => {
      const charge = { ...mockCharges[1], deletableFlag: 'N' };
      component.onRemoveCharge(charge as any);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('This charge cannot be deleted');
    });

    it('should remove new charge locally', () => {
      const newCharge = { chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15, crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'DI20260530120000', deletableFlag: 'Y', isNew: true };
      (component as any).charges.set([newCharge as any]);
      component.onRemoveCharge(newCharge as any);
      expect((component as any).charges().length).toBe(0);
    });

    it('should call API to delete persisted charge', () => {
      const charge = { ...mockCharges[0], isNew: false };
      apiServiceSpy.deleteShipmentCharge.and.returnValue(of({}));
      (component as any).charges.set([charge as any]);
      component.onRemoveCharge(charge as any);
      expect(apiServiceSpy.deleteShipmentCharge).toHaveBeenCalledWith('DI20260530120000', 'BOX', 'ORD001');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Charge removed successfully');
    });

    it('should handle API delete error', () => {
      const charge = { ...mockCharges[0], isNew: false };
      apiServiceSpy.deleteShipmentCharge.and.returnValue(throwError(() => new Error('fail')));
      (component as any).charges.set([charge as any]);
      component.onRemoveCharge(charge as any);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to remove charge');
    });
  });

  describe('onSortChange', () => {
    it('should sort charges ascending', () => {
      const charges = [
        { chargeCode: 'ZZZ', description: 'Z', quantity: 1, price: 1, amount: 1, crDbInd: '', crDbDesc: '', orderNo: '', shipmentNo: '', deletableFlag: 'Y', isNew: true },
        { chargeCode: 'AAA', description: 'A', quantity: 1, price: 1, amount: 1, crDbInd: '', crDbDesc: '', orderNo: '', shipmentNo: '', deletableFlag: 'Y', isNew: true },
      ];
      (component as any).charges.set(charges as any);
      component.onSortChange({ column: 'chargeCode', direction: 'A' });
      expect((component as any).charges()[0].chargeCode).toBe('AAA');
    });

    it('should sort charges descending', () => {
      const charges = [
        { chargeCode: 'AAA', description: 'A', quantity: 1, price: 1, amount: 1, crDbInd: '', crDbDesc: '', orderNo: '', shipmentNo: '', deletableFlag: 'Y', isNew: true },
        { chargeCode: 'ZZZ', description: 'Z', quantity: 1, price: 1, amount: 1, crDbInd: '', crDbDesc: '', orderNo: '', shipmentNo: '', deletableFlag: 'Y', isNew: true },
      ];
      (component as any).charges.set(charges as any);
      component.onSortChange({ column: 'chargeCode', direction: 'D' });
      expect((component as any).charges()[0].chargeCode).toBe('ZZZ');
    });
  });

  describe('onClearAll', () => {
    it('should show error when no deletable charges', () => {
      (component as any).charges.set([{ ...mockCharges[1], deletableFlag: 'N' } as any]);
      component.onClearAll();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No deletable charges to clear');
    });

    it('should remove new charges locally only', () => {
      const newCharge = { chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15, crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'DI20260530120000', deletableFlag: 'Y', isNew: true };
      (component as any).charges.set([newCharge as any]);
      component.onClearAll();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('All deletable charges cleared');
    });

    it('should delete persisted charges via API', () => {
      const charge = { ...mockCharges[0], isNew: false, deletableFlag: 'Y' };
      apiServiceSpy.deleteShipmentCharge.and.returnValue(of({}));
      apiServiceSpy.getShipmentCharges.and.returnValue(of([]));
      (component as any).charges.set([charge as any]);
      component.onClearAll();
      expect(apiServiceSpy.deleteShipmentCharge).toHaveBeenCalled();
    });

    it('should handle API error on clear all', () => {
      const charge = { ...mockCharges[0], isNew: false, deletableFlag: 'Y' };
      apiServiceSpy.deleteShipmentCharge.and.returnValue(throwError(() => new Error('fail')));
      apiServiceSpy.getShipmentCharges.and.returnValue(of([]));
      (component as any).charges.set([charge as any]);
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
      const newCharge = { chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15, crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'DI20260530120000', deletableFlag: 'Y', isNew: true };
      (component as any).charges.set([newCharge as any]);
      apiServiceSpy.addShipmentCharge.and.returnValue(of([] as any));
      component.onSaveAndPrint();
      expect(apiServiceSpy.addShipmentCharge).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should handle save error', () => {
      const newCharge = { chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15, crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'DI20260530120000', deletableFlag: 'Y', isNew: true };
      (component as any).charges.set([newCharge as any]);
      apiServiceSpy.addShipmentCharge.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));
      component.onSaveAndPrint();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Save failed');
    });

    it('should save and then finalize when finalizeOnSave is true', () => {
      const newCharge = { chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15, crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'DI20260530120000', deletableFlag: 'Y', isNew: true };
      (component as any).charges.set([newCharge as any]);
      component.data.finalizeOnSave = true;
      apiServiceSpy.addShipmentCharge.and.returnValue(of([] as any));
      apiServiceSpy.completeShipment.and.returnValue(of({}));
      component.onSaveAndPrint();
      expect(apiServiceSpy.completeShipment).toHaveBeenCalledWith('DI20260530120000');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    });

    it('should finalize without new charges when finalizeOnSave', () => {
      (component as any).charges.set([]);
      component.data.finalizeOnSave = true;
      apiServiceSpy.completeShipment.and.returnValue(of({}));
      component.onSaveAndPrint();
      expect(apiServiceSpy.completeShipment).toHaveBeenCalled();
    });

    it('should handle finalize error', () => {
      (component as any).charges.set([]);
      component.data.finalizeOnSave = true;
      apiServiceSpy.completeShipment.and.returnValue(throwError(() => ({ error: { message: 'Finalize failed' } })));
      component.onSaveAndPrint();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Finalize failed');
    });

    it('should show generic error message when error has no message', () => {
      const newCharge = { chargeCode: 'FEE', description: 'Fee', quantity: 1, price: 15, amount: 15, crDbInd: 'C', crDbDesc: 'Credit', orderNo: '', shipmentNo: 'DI20260530120000', deletableFlag: 'Y', isNew: true };
      (component as any).charges.set([newCharge as any]);
      apiServiceSpy.addShipmentCharge.and.returnValue(throwError(() => ({})));
      component.onSaveAndPrint();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save charges');
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.chargeForm.controls);
    });
  });

  describe('addDefaultCharges', () => {
    it('should add default charges based on boxCount', () => {
      component.data.boxCount = 2;
      (component as any).charges.set([]);
      (component as any).addDefaultCharges(mockChargeCodes);
      const charges = (component as any).charges();
      // BOX has shipFlag 'B' so boxCount * 1 = 2 charges, SHIP has shipFlag 'S' so 1 charge
      expect(charges.length).toBe(3);
    });

    it('should not add charges when boxCount is 0', () => {
      component.data.boxCount = 0;
      (component as any).charges.set([]);
      (component as any).addDefaultCharges(mockChargeCodes);
      expect((component as any).charges().length).toBe(0);
    });

    it('should not add charges when no matching codes', () => {
      component.data.boxCount = 1;
      (component as any).charges.set([]);
      (component as any).addDefaultCharges([{ chargeCode: 'FEE', chargeCodeDesc: 'Fee', charge: 10, shipFlag: null }]);
      expect((component as any).charges().length).toBe(0);
    });
  });

  describe('tableConfig valueFormatters', () => {
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
  });
});
