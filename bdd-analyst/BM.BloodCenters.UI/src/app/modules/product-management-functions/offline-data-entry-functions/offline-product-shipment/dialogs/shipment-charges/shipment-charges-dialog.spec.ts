import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { ShipmentChargesDialog, ShipmentChargesDialogData } from './shipment-charges-dialog';
import { OfflineProductShipmentApiService } from '../../services/offline-product-shipment-api.service';
import { OfflineProductShipmentChargeDto } from '../../models/offline-product-shipment.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ShipmentChargesDialog', () => {
  let component: ShipmentChargesDialog;
  let fixture: ComponentFixture<ShipmentChargesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ShipmentChargesDialog>>;
  let apiServiceSpy: jasmine.SpyObj<OfflineProductShipmentApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: ShipmentChargesDialogData = {
    shipmentNo: 'SHP001',
    orderNo: 'ORD001',
    boxCount: 3,
  };

  const mockChargeCodes = [
    { chargeCode: 'DEL', chargeCodeDesc: 'Delivery', charge: 25.0, chargeCodeType: 'D', crDbDesc: 'Debit' },
    { chargeCode: 'HAN', chargeCodeDesc: 'Handling', charge: 10.0, chargeCodeType: 'D', crDbDesc: 'Debit' },
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('OfflineProductShipmentApiService', [
      'getChargeCodes',
      'getCharges',
      'createCharge',
      'deleteCharge',
    ]);
    apiServiceSpy.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
    apiServiceSpy.getCharges.and.returnValue(of([]));
    apiServiceSpy.createCharge.and.returnValue(of({}));

    snackbarServiceSpy = createMockSnackbarService();

    await TestBed.configureTestingModule({
      imports: [ShipmentChargesDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: OfflineProductShipmentApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipmentChargesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form).toBeTruthy();
    expect(component.form.get('chargeCode')?.value).toBe('');
    expect(component.form.get('quantity')?.value).toBe(1);
  });

  it('should load charge codes on init', () => {
    expect(apiServiceSpy.getChargeCodes).toHaveBeenCalled();
  });

  it('should load existing charges on init', () => {
    expect(apiServiceSpy.getCharges).toHaveBeenCalled();
  });

  it('should not require chargeCode and quantity', () => {
    component.form.get('chargeCode')?.setValue('');
    component.form.get('quantity')?.setValue(null);
    component.form.markAllAsTouched();
    expect(component.form.get('chargeCode')?.hasError('required')).toBeFalse();
    expect(component.form.get('quantity')?.hasError('required')).toBeFalse();
  });

  it('should validate quantity min and max', () => {
    component.form.get('quantity')?.setValue(0);
    expect(component.form.get('quantity')?.hasError('min')).toBeTrue();
    component.form.get('quantity')?.setValue(100);
    expect(component.form.get('quantity')?.hasError('max')).toBeTrue();
    component.form.get('quantity')?.setValue(5);
    expect(component.form.get('quantity')?.valid).toBeTrue();
  });

  it('should close dialog on onClose', () => {
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should clear all charges on onClearAll', () => {
    component.onClearAll();
    expect(component['charges']()).toEqual([]);
  });

  it('should show error when saving with no charges', () => {
    component.onSaveAndPrint();
    expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No charges to save');
  });

  it('should save charges and close dialog on successful saveAndPrint', fakeAsync(() => {
    component['charges'].set([{
      shipmentNo: 'SHP001',
      orderNo: 'ORD001',
      chargeCode: 'DEL',
      chargeCodeDesc: 'Delivery',
      amount: 25.0,
      crDbInd: 'D',
      crDbDesc: 'Debit',
      chapterId: '',
      quantity: 1,
      isNew: true,
    }]);

    component.onSaveAndPrint();
    tick();

    expect(apiServiceSpy.createCharge).toHaveBeenCalled();
    expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ saved: true });
  }));

  it('should handle save error gracefully', fakeAsync(() => {
    apiServiceSpy.createCharge.and.returnValue(throwError(() => new Error('fail')));
    component['charges'].set([{
      shipmentNo: 'SHP001',
      orderNo: 'ORD001',
      chargeCode: 'DEL',
      chargeCodeDesc: 'Delivery',
      amount: 25.0,
      crDbInd: 'D',
      crDbDesc: 'Debit',
      chapterId: '',
      quantity: 1,
      isNew: true,
    }]);

    component.onSaveAndPrint();
    tick();

    expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to save charges');
  }));

  describe('onChargeSelected', () => {
    it('should do nothing if no chargeCode selected', () => {
      component.form.patchValue({ chargeCode: '' });
      const initialCharges = component['charges']().length;
      component.onChargeSelected();
      expect(component['charges']().length).toBe(initialCharges);
    });

    it('should do nothing if chargeCode not found in chargeCodes', () => {
      component.form.patchValue({ chargeCode: 'UNKNOWN' });
      const initialCharges = component['charges']().length;
      component.onChargeSelected();
      expect(component['charges']().length).toBe(initialCharges);
    });

    it('should add charge with correct amount calculation', () => {
      component.form.patchValue({ chargeCode: 'DEL', quantity: 3 });
      component.onChargeSelected();
      const charges = component['charges']();
      const added = charges[charges.length - 1];
      expect(added.chargeCode).toBe('DEL');
      expect(added.amount).toBe(75.0);
      expect(added.quantity).toBe(3);
    });

    it('should reset form after adding charge', () => {
      component.form.patchValue({ chargeCode: 'DEL', quantity: 3 });
      component.onChargeSelected();
      expect(component.form.get('chargeCode')?.value).toBe('');
      expect(component['submitted']()).toBeFalse();
    });
  });

  describe('onAddCharge', () => {
    it('should set submitted true when form is invalid', () => {
      component.form.get('quantity')?.setValue(0);
      component.onAddCharge();
      expect(component['submitted']()).toBeTrue();
    });

    it('should add charge to signal when form is valid', () => {
      component.form.patchValue({ chargeCode: 'DEL', quantity: 1 });
      component['chargeCodes'].set(mockChargeCodes as any);
      const initialLen = component['charges']().length;
      component.onAddCharge();
      expect(component['charges']().length).toBe(initialLen + 1);
    });

    it('should reset form and set submitted false after adding charge', () => {
      component.form.patchValue({ chargeCode: 'DEL', quantity: 2 });
      component.onAddCharge();
      expect(component.form.get('quantity')?.value).toBe(1);
      expect(component['submitted']()).toBeFalse();
    });
  });

  describe('onDeleteCharge', () => {
    it('should remove charge matching composite key', () => {
      const charge: OfflineProductShipmentChargeDto = {
        shipmentNo: 'SHP001', orderNo: 'ORD001', chargeCode: 'DEL',
        chargeCodeDesc: 'Delivery', amount: 25.0, crDbInd: 'D',
        crDbDesc: 'Debit', chapterId: '', quantity: 1
      };
      const otherCharge: OfflineProductShipmentChargeDto = {
        shipmentNo: 'SHP001', orderNo: 'ORD001', chargeCode: 'HAN',
        chargeCodeDesc: 'Handling', amount: 10.0, crDbInd: 'D',
        crDbDesc: 'Debit', chapterId: '', quantity: 1
      };
      component['charges'].set([charge, otherCharge]);

      component.onDeleteCharge(charge);

      expect(component['charges']().length).toBe(1);
      expect(component['charges']()[0].chargeCode).toBe('HAN');
    });
  });

  describe('onClearAll extended', () => {
    it('should reset form with quantity 1 and set submitted false', () => {
      component['charges'].set([{ shipmentNo: 'SHP001' } as any]);
      component['submitted'].set(true);

      component.onClearAll();

      expect(component['charges']()).toEqual([]);
      expect(component.form.get('quantity')?.value).toBe(1);
      expect(component['submitted']()).toBeFalse();
    });
  });

  describe('Charge Code Change', () => {
    it('should populate description and price from found charge code', fakeAsync(() => {
      component.form.get('chargeCode')?.setValue('DEL');
      tick();

      expect(component.form.get('description')?.value).toBe('Delivery');
      expect(component.form.get('price')?.value).toBe('$25.00');
      expect(component.form.get('crDbInd')?.value).toBe('Debit');
    }));

    it('should clear details when chargeCode is cleared', fakeAsync(() => {
      component.form.get('chargeCode')?.setValue('DEL');
      tick();
      component.form.get('chargeCode')?.setValue('');
      tick();

      expect(component.form.get('description')?.value).toBe('');
      expect(component.form.get('price')?.value).toBe('');
    }));
  });

  describe('loadCharges error', () => {
    it('should set error signal and show snackbar on load failure', fakeAsync(() => {
      apiServiceSpy.getCharges.and.returnValue(throwError(() => new Error('fail')));

      fixture = TestBed.createComponent(ShipmentChargesDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component['error']()).toBe('Failed to load charges');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load shipment charges');
    }));
  });

  describe('loadChargeCodes error', () => {
    it('should show error snackbar on charge codes load failure', fakeAsync(() => {
      apiServiceSpy.getChargeCodes.and.returnValue(throwError(() => new Error('fail')));

      fixture = TestBed.createComponent(ShipmentChargesDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load charge codes');
    }));
  });

  describe('Computed Signals', () => {
    it('isEmpty should be true when charges empty', () => {
      component['charges'].set([]);
      expect(component['isEmpty']()).toBeTrue();
    });

    it('isEmpty should be false when charges has data', () => {
      component['charges'].set([{ chargeCode: 'DEL' } as any]);
      expect(component['isEmpty']()).toBeFalse();
    });

    it('isReady should be true when not loading and no error', () => {
      component['loading'].set(false);
      component['error'].set(null);
      expect(component['isReady']()).toBeTrue();
    });

    it('isReady should be false when loading', () => {
      component['loading'].set(true);
      expect(component['isReady']()).toBeFalse();
    });

    it('should expose shipmentNo from data', () => {
      expect(component['shipmentNo']).toBe('SHP001');
    });

    it('should expose orderNo from data', () => {
      expect(component['orderNo']).toBe('ORD001');
    });
  });

  describe('Table Config', () => {
    it('should initialize table config with 5 columns', () => {
      expect(component['tableConfig']).toBeTruthy();
      expect(component['tableConfig'].columns.length).toBe(5);
      expect(component['tableConfig'].columns.map(c => c.key)).toEqual([
        'chargeCode', 'chargeCodeDesc', 'quantity', 'amount', 'crDbDesc'
      ]);
    });

    it('should have delete row action', () => {
      expect(component['tableConfig'].rowActions?.length).toBe(1);
      expect(component['tableConfig'].rowActions?.[0].action).toBe('delete');
    });

    it('amount column valueFormatter should format currency', () => {
      const amountCol = component['tableConfig'].columns.find(c => c.key === 'amount');
      expect(amountCol?.valueFormatter?.(25.5, {} as any)).toBe('$25.50');
      expect(amountCol?.valueFormatter?.(0, {} as any)).toBe('$0.00');
      expect(amountCol?.valueFormatter?.(null, {} as any)).toBe('$0.00');
    });
  });

  describe('ID generation', () => {
    it('should generate element IDs', () => {
      expect(component['elementId']('chargeCode')).toContain('-chargeCode');
    });

    it('should generate error IDs', () => {
      expect(component['errorId']('quantity')).toContain('-quantity-error');
    });

    it('should generate label IDs', () => {
      expect(component['labelId']('price')).toContain('-price-label');
    });
  });

  it('should get form controls via f getter', () => {
    expect(component.f).toBe(component.form.controls);
  });

  it('should complete destroy subject on ngOnDestroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  describe('onSaveAndPrint with no new charges', () => {
    it('should use of([]) when no new charges exist', fakeAsync(() => {
      component['charges'].set([{
        shipmentNo: 'SHP001', orderNo: 'ORD001', chargeCode: 'DEL',
        chargeCodeDesc: 'Delivery', amount: 25.0, crDbInd: 'D',
        crDbDesc: 'Debit', chapterId: '', quantity: 1, isNew: false
      }]);

      component.onSaveAndPrint();
      tick();

      expect(apiServiceSpy.createCharge).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ saved: true });
    }));
  });
});

describe('ShipmentChargesDialog with finalizeOnSave', () => {
  let component: ShipmentChargesDialog;
  let fixture: ComponentFixture<ShipmentChargesDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ShipmentChargesDialog>>;
  let apiServiceSpy: jasmine.SpyObj<OfflineProductShipmentApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockDialogData: ShipmentChargesDialogData = {
    shipmentNo: 'SHP001',
    orderNo: 'ORD001',
    boxCount: 3,
    finalizeOnSave: true,
    printerId: 'PR1'
  };

  const mockChargeCodes = [
    { chargeCode: 'DEL', chargeCodeDesc: 'Delivery', charge: 25.0, chargeCodeType: 'D', crDbDesc: 'Debit' },
  ];

  const mockDefaultCharges: OfflineProductShipmentChargeDto[] = [
    {
      shipmentNo: 'SHP001', orderNo: 'ORD001', chargeCode: 'SUR',
      chargeCodeDesc: 'Surcharge', amount: 5.0, crDbInd: 'D',
      crDbDesc: 'Debit', chapterId: '', quantity: 1
    }
  ];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('OfflineProductShipmentApiService', [
      'getChargeCodes', 'getCharges', 'createCharge', 'getDefaultCharges', 'finalizeShipment',
    ]);
    apiServiceSpy.getChargeCodes.and.returnValue(of(mockChargeCodes as any));
    apiServiceSpy.getCharges.and.returnValue(of([]));
    apiServiceSpy.createCharge.and.returnValue(of({} as any));
    apiServiceSpy.getDefaultCharges.and.returnValue(of(mockDefaultCharges));
    apiServiceSpy.finalizeShipment.and.returnValue(of({ shipmentNo: 'SHP001', success: true } as any));
    snackbarServiceSpy = createMockSnackbarService();

    await TestBed.configureTestingModule({
      imports: [ShipmentChargesDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: OfflineProductShipmentApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShipmentChargesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load default charges on init when finalizeOnSave is true', fakeAsync(() => {
    tick();
    expect(apiServiceSpy.getDefaultCharges).toHaveBeenCalledWith('SHP001');
    const charges = component['charges']();
    expect(charges.some(c => c.chargeCode === 'SUR' && c.isNew === true)).toBeTrue();
  }));

  it('should allow save with zero charges when finalizing', fakeAsync(() => {
    component['charges'].set([]);
    component.onSaveAndPrint();
    tick();
    expect(apiServiceSpy.finalizeShipment).toHaveBeenCalledWith('SHP001');
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ saved: true, finalized: true });
  }));

  it('should call finalizeShipment after saving new charges', fakeAsync(() => {
    component['charges'].set([{
      shipmentNo: 'SHP001', orderNo: 'ORD001', chargeCode: 'DEL',
      chargeCodeDesc: 'Delivery', amount: 25.0, crDbInd: 'D',
      crDbDesc: 'Debit', chapterId: '', quantity: 1, isNew: true
    }]);

    component.onSaveAndPrint();
    tick();

    expect(apiServiceSpy.createCharge).toHaveBeenCalled();
    expect(apiServiceSpy.finalizeShipment).toHaveBeenCalledWith('SHP001');
    expect(dialogRefSpy.close).toHaveBeenCalledWith({ saved: true, finalized: true });
  }));

  it('should handle finalize error', fakeAsync(() => {
    apiServiceSpy.finalizeShipment.and.returnValue(throwError(() => new Error('fail')));
    component['charges'].set([]);

    component.onSaveAndPrint();
    tick();

    expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to finalize shipment');
    expect(component['loading']()).toBeFalse();
  }));

  it('should handle loadDefaultCharges error silently', fakeAsync(() => {
    apiServiceSpy.getDefaultCharges.and.returnValue(throwError(() => new Error('fail')));

    fixture = TestBed.createComponent(ShipmentChargesDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
    tick();

    expect(component).toBeTruthy();
  }));
});
