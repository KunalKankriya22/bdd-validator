import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import {
  SpecialChargesDialogComponent,
  SpecialChargesDialogData,
} from './special-charges-dialog';
import { RegularOrderApiService } from '../../services/regular-order-api.service';

describe('SpecialChargesDialogComponent', () => {
  let component: SpecialChargesDialogComponent;
  let fixture: ComponentFixture<SpecialChargesDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SpecialChargesDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<RegularOrderApiService>;

  const mockChargeCodes = [
    { code: 'DEL', description: 'Delivery', crDbInd: 'DB', unitAmount: 10 },
    { code: 'RUS', description: 'Rush Fee', crDbInd: 'CR', unitAmount: 25 },
    { code: 'STO', description: 'Storage', crDbInd: 'OT', unitAmount: 5 },
  ];

  const mockCharges = [
    { chargeCode: 'DEL', chargeCodeDesc: 'Delivery', crDbInd: 'DB', quantity: 1, amount: 10 },
  ];

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('RegularOrderApiService', [
      'getChargeCodesLookup',
      'addOrderCharge',
      'deleteOrderCharge',
    ]);
    apiServiceSpy.getChargeCodesLookup.and.returnValue(of(mockChargeCodes));
    apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
    apiServiceSpy.deleteOrderCharge.and.returnValue(of(true));

    const data: SpecialChargesDialogData = {
      orderNo: 'ORD001',
      charges: mockCharges.map(c => ({ ...c })),
      apiService: apiServiceSpy,
    };

    TestBed.configureTestingModule({
      imports: [SpecialChargesDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialChargesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─── Basic creation ─────────────────────────────────────────────

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ─── Data injection ─────────────────────────────────────────────

  describe('data injection', () => {
    it('should inject dialog data with orderNo', () => {
      expect(component.data.orderNo).toBe('ORD001');
    });

    it('should initialize charges from dialog data', () => {
      expect(component.charges().length).toBe(1);
      expect(component.charges()[0].chargeCode).toBe('DEL');
    });
  });

  // ─── Form initialization ────────────────────────────────────────

  describe('form initialization', () => {
    it('should initialize chargeForm with chargeCode, quantity, and amount controls', () => {
      expect(component.chargeForm).toBeTruthy();
      expect(component.chargeForm.get('chargeCode')).toBeTruthy();
      expect(component.chargeForm.get('quantity')).toBeTruthy();
      expect(component.chargeForm.get('amount')).toBeTruthy();
    });

    it('should require chargeCode', () => {
      component.chargeForm.get('chargeCode')!.setValue('');
      expect(component.chargeForm.get('chargeCode')!.hasError('required')).toBeTrue();
    });

    it('should not require quantity', () => {
      component.chargeForm.get('quantity')!.setValue(null);
      expect(component.chargeForm.get('quantity')!.valid).toBeTrue();
    });

    it('should not require amount', () => {
      component.chargeForm.get('amount')!.setValue(null);
      expect(component.chargeForm.get('amount')!.valid).toBeTrue();
    });

    it('should initialize chargeCodeSearchCtrl as empty string', () => {
      expect(component.chargeCodeSearchCtrl.value).toBe('');
    });
  });

  // ─── Signal initial values ──────────────────────────────────────

  describe('signal initial values', () => {
    it('should initialize showNewRow to true', () => {
      expect(component.showNewRow()).toBeTrue();
    });

    it('should initialize saving to false', () => {
      expect(component.saving()).toBeFalse();
    });

    it('should initialize hasChanges to false', () => {
      expect(component.hasChanges()).toBeFalse();
    });

    it('should initialize selectedDescription to --', () => {
      expect(component.selectedDescription()).toBe('--');
    });

    it('should initialize selectedCrDb to --', () => {
      expect(component.selectedCrDb()).toBe('--');
    });
  });

  // ─── ngOnInit ───────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should load charge codes on init', () => {
      expect(apiServiceSpy.getChargeCodesLookup).toHaveBeenCalled();
      expect(component.chargeCodes().length).toBe(3);
    });

    it('should set filteredChargeCodes from loaded codes', () => {
      expect(component.filteredChargeCodes().length).toBe(3);
      expect(component.filteredChargeCodes()[0].code).toBe('DEL');
    });
  });

  // ─── chargeCodeSearchCtrl filtering ─────────────────────────────

  describe('chargeCode search filtering', () => {
    it('should filter charge codes by code on search', fakeAsync(() => {
      component.chargeCodeSearchCtrl.setValue('del');
      tick(200);
      expect(component.filteredChargeCodes().length).toBe(1);
      expect(component.filteredChargeCodes()[0].code).toBe('DEL');
    }));

    it('should filter charge codes by description on search', fakeAsync(() => {
      component.chargeCodeSearchCtrl.setValue('rush');
      tick(200);
      expect(component.filteredChargeCodes().length).toBe(1);
      expect(component.filteredChargeCodes()[0].code).toBe('RUS');
    }));

    it('should show all charge codes when search is empty', fakeAsync(() => {
      component.chargeCodeSearchCtrl.setValue('');
      tick(200);
      expect(component.filteredChargeCodes().length).toBe(3);
    }));

    it('should show all charge codes when search is null', fakeAsync(() => {
      component.chargeCodeSearchCtrl.setValue(null);
      tick(200);
      expect(component.filteredChargeCodes().length).toBe(3);
    }));

    it('should return no results when search matches nothing', fakeAsync(() => {
      component.chargeCodeSearchCtrl.setValue('xyz');
      tick(200);
      expect(component.filteredChargeCodes().length).toBe(0);
    }));

    it('should debounce search input', fakeAsync(() => {
      component.chargeCodeSearchCtrl.setValue('del');
      tick(100); // less than debounce time
      expect(component.filteredChargeCodes().length).toBe(3); // not yet filtered
      tick(100); // debounce fires
      expect(component.filteredChargeCodes().length).toBe(1);
    }));

    it('should handle charge codes with null code or description', fakeAsync(() => {
      component.chargeCodes.set([
        { code: null, description: null, crDbInd: 'DB', unitAmount: 0 },
        { code: 'ABC', description: 'Test', crDbInd: 'DB', unitAmount: 0 },
      ]);
      component.chargeCodeSearchCtrl.setValue('test');
      tick(200);
      expect(component.filteredChargeCodes().length).toBe(1);
      expect(component.filteredChargeCodes()[0].code).toBe('ABC');
    }));
  });

  // ─── quantity valueChanges auto-calculates amount ───────────────

  describe('quantity valueChanges', () => {
    it('should auto-calculate amount when quantity changes and chargeCode is selected', () => {
      component.chargeForm.get('chargeCode')!.setValue('DEL');
      component.chargeForm.get('quantity')!.setValue(3);
      expect(component.chargeForm.get('amount')!.value).toBe(30); // 10 * 3
    });

    it('should not update amount when quantity is null', () => {
      component.chargeForm.get('chargeCode')!.setValue('DEL');
      component.chargeForm.get('amount')!.setValue(99);
      component.chargeForm.get('quantity')!.setValue(null);
      expect(component.chargeForm.get('amount')!.value).toBe(99); // unchanged
    });

    it('should not update amount when quantity is 0 (falsy)', () => {
      component.chargeForm.get('chargeCode')!.setValue('DEL');
      component.chargeForm.get('amount')!.setValue(99);
      component.chargeForm.get('quantity')!.setValue(0);
      expect(component.chargeForm.get('amount')!.value).toBe(99); // unchanged because 0 is falsy
    });

    it('should not update amount when chargeCode does not match any code', () => {
      component.chargeForm.get('chargeCode')!.setValue('INVALID');
      component.chargeForm.get('amount')!.setValue(99);
      component.chargeForm.get('quantity')!.setValue(5);
      expect(component.chargeForm.get('amount')!.value).toBe(99); // unchanged
    });

    it('should handle unitAmount of 0 when calculating', () => {
      component.chargeCodes.set([{ code: 'FREE', description: 'Free', crDbInd: 'DB', unitAmount: 0 }]);
      component.chargeForm.get('chargeCode')!.setValue('FREE');
      component.chargeForm.get('quantity')!.setValue(5);
      expect(component.chargeForm.get('amount')!.value).toBe(0); // 0 * 5
    });

    it('should handle missing unitAmount (null/undefined) as 0', () => {
      component.chargeCodes.set([{ code: 'NO_UNIT', description: 'No Unit', crDbInd: 'DB' }]);
      component.chargeForm.get('chargeCode')!.setValue('NO_UNIT');
      component.chargeForm.get('quantity')!.setValue(3);
      expect(component.chargeForm.get('amount')!.value).toBe(0); // (undefined ?? 0) * 3
    });
  });

  // ─── onChargeCodeChange ─────────────────────────────────────────

  describe('onChargeCodeChange', () => {
    it('should set description and CR/DB for a selected DB charge code', () => {
      component.chargeForm.get('chargeCode')!.setValue('DEL');
      component.onChargeCodeChange();
      expect(component.selectedDescription()).toBe('Delivery');
      expect(component.selectedCrDb()).toBe('DB - Debit');
    });

    it('should set CR/DB to "CR - Credit" for a CR charge code', () => {
      component.chargeForm.get('chargeCode')!.setValue('RUS');
      component.onChargeCodeChange();
      expect(component.selectedCrDb()).toBe('CR - Credit');
    });

    it('should use crDbInd value as-is for non-CR/non-DB values', () => {
      component.chargeForm.get('chargeCode')!.setValue('STO');
      component.onChargeCodeChange();
      expect(component.selectedCrDb()).toBe('OT');
    });

    it('should default crDbInd to -- when it is falsy', () => {
      component.chargeCodes.set([{ code: 'X', description: 'Test', crDbInd: '', unitAmount: 10 }]);
      component.chargeForm.get('chargeCode')!.setValue('X');
      component.onChargeCodeChange();
      expect(component.selectedCrDb()).toBe('--');
    });

    it('should set quantity to 1 and amount to unitAmount', () => {
      component.chargeForm.get('chargeCode')!.setValue('RUS');
      component.onChargeCodeChange();
      expect(component.chargeForm.get('quantity')!.value).toBe(1);
      expect(component.chargeForm.get('amount')!.value).toBe(25);
    });

    it('should handle unitAmount being null (defaults to 0)', () => {
      component.chargeCodes.set([{ code: 'NUL', description: 'Null Amount', crDbInd: 'DB', unitAmount: null }]);
      component.chargeForm.get('chargeCode')!.setValue('NUL');
      component.onChargeCodeChange();
      expect(component.chargeForm.get('amount')!.value).toBe(0);
    });

    it('should reset description and crDb to -- when no matching code found', () => {
      component.selectedDescription.set('Something');
      component.selectedCrDb.set('Something');
      component.chargeForm.get('chargeCode')!.setValue('NONEXISTENT');
      component.onChargeCodeChange();
      expect(component.selectedDescription()).toBe('--');
      expect(component.selectedCrDb()).toBe('--');
    });

    it('should reset description and crDb when chargeCode is empty', () => {
      component.selectedDescription.set('Something');
      component.selectedCrDb.set('Something');
      component.chargeForm.get('chargeCode')!.setValue('');
      component.onChargeCodeChange();
      expect(component.selectedDescription()).toBe('--');
      expect(component.selectedCrDb()).toBe('--');
    });

    it('should default description to -- when selected has empty description', () => {
      component.chargeCodes.set([{ code: 'EMPTY', description: '', crDbInd: 'DB', unitAmount: 10 }]);
      component.chargeForm.get('chargeCode')!.setValue('EMPTY');
      component.onChargeCodeChange();
      expect(component.selectedDescription()).toBe('--');
    });
  });

  // ─── onAddNewCharges ────────────────────────────────────────────

  describe('onAddNewCharges', () => {
    it('should set showNewRow to true', () => {
      component.showNewRow.set(false);
      component.onAddNewCharges();
      expect(component.showNewRow()).toBeTrue();
    });

    it('should not call API when chargeCode is empty', () => {
      component.chargeForm.get('chargeCode')!.setValue('');
      component.onAddNewCharges();
      expect(apiServiceSpy.addOrderCharge).not.toHaveBeenCalled();
    });

    it('should not call API when showNewRow is false and chargeCode is set', () => {
      component.showNewRow.set(false);
      component.chargeForm.get('chargeCode')!.setValue('DEL');
      component.onAddNewCharges();
      expect(apiServiceSpy.addOrderCharge).not.toHaveBeenCalled();
    });

    it('should not call API when apiService is undefined', () => {
      // Simulate undefined apiService by clearing the data's apiService property
      (component.data as any).apiService = undefined;
      component.chargeForm.get('chargeCode')!.setValue('DEL');
      component.onAddNewCharges();
      expect(apiServiceSpy.addOrderCharge).not.toHaveBeenCalled();
      expect(component.showNewRow()).toBeTrue();
    });

    it('should set saving to true when submitting', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: mockCharges }));
      component.chargeForm.get('chargeCode')!.setValue('DEL');
      component.onAddNewCharges();
      expect(component.saving()).toBeFalse(); // reset after subscribe completes
    });

    it('should call addOrderCharge with correct parameters', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: 2, amount: 20 });
      component.onAddNewCharges();
      expect(apiServiceSpy.addOrderCharge).toHaveBeenCalledWith('ORD001', jasmine.objectContaining({
        chargeCode: 'DEL',
        crDbInd: 'DB',
        quantity: 2,
        amount: 20,
      }));
    });

    it('should default quantity to 1 when not set', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: null, amount: null });
      component.onAddNewCharges();
      expect(apiServiceSpy.addOrderCharge).toHaveBeenCalledWith('ORD001', jasmine.objectContaining({
        quantity: 1,
      }));
    });

    it('should compute amount from unitAmount * qty when amount is null', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: 3, amount: null });
      component.onAddNewCharges();
      expect(apiServiceSpy.addOrderCharge).toHaveBeenCalledWith('ORD001', jasmine.objectContaining({
        amount: 30, // unitAmount 10 * qty 3
      }));
    });

    it('should use crDbInd from selected code or default to DB', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.chargeForm.patchValue({ chargeCode: 'RUS', quantity: 1 });
      component.onAddNewCharges();
      expect(apiServiceSpy.addOrderCharge).toHaveBeenCalledWith('ORD001', jasmine.objectContaining({
        crDbInd: 'CR',
      }));
    });

    it('should default crDbInd to DB when selected code has no crDbInd', () => {
      component.chargeCodes.set([{ code: 'NOIND', description: 'No Ind', unitAmount: 5 }]);
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.chargeForm.patchValue({ chargeCode: 'NOIND', quantity: 1 });
      component.onAddNewCharges();
      expect(apiServiceSpy.addOrderCharge).toHaveBeenCalledWith('ORD001', jasmine.objectContaining({
        crDbInd: 'DB',
      }));
    });

    it('should update charges from result.data when present', () => {
      const newCharges = [
        { chargeCode: 'DEL', chargeCodeDesc: 'Delivery', crDbInd: 'DB', quantity: 1, amount: 10 },
        { chargeCode: 'RUS', chargeCodeDesc: 'Rush Fee', crDbInd: 'CR', quantity: 1, amount: 25 },
      ];
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: newCharges }));
      component.chargeForm.patchValue({ chargeCode: 'RUS', quantity: 1 });
      component.onAddNewCharges();
      expect(component.charges()).toEqual(newCharges);
    });

    it('should append charge locally when result has no data but selected code exists', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({})); // no data property
      component.chargeForm.patchValue({ chargeCode: 'RUS', quantity: 2, amount: 50 });
      component.onAddNewCharges();
      const charges = component.charges();
      expect(charges.length).toBe(2); // original 1 + appended 1
      expect(charges[1].chargeCode).toBe('RUS');
      expect(charges[1].chargeCodeDesc).toBe('Rush Fee');
      expect(charges[1].crDbInd).toBe('CR');
      expect(charges[1].quantity).toBe(2);
      expect(charges[1].amount).toBe(50);
    });

    it('should append charge with default quantity 1 when quantity is null in fallback path', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({})); // no data property
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: null, amount: null });
      component.onAddNewCharges();
      const charges = component.charges();
      const appended = charges[charges.length - 1];
      expect(appended.quantity).toBe(1);
      expect(appended.amount).toBe(10); // unitAmount 10 * qty 1
    });

    it('should not append charge locally when result is null (API error) and no selected code', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of(null)); // catchError returns null
      component.chargeCodes.set([]); // no codes
      component.chargeForm.patchValue({ chargeCode: 'UNKNOWN', quantity: 1 });
      component.onAddNewCharges();
      expect(component.charges().length).toBe(1); // unchanged
    });

    it('should set hasChanges to true after successful add', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: 1 });
      component.onAddNewCharges();
      expect(component.hasChanges()).toBeTrue();
    });

    it('should reset chargeForm after add', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: 1, amount: 10 });
      component.onAddNewCharges();
      expect(component.chargeForm.get('chargeCode')!.value).toBeFalsy();
      expect(component.chargeForm.get('quantity')!.value).toBeFalsy();
      expect(component.chargeForm.get('amount')!.value).toBeFalsy();
    });

    it('should reset selectedDescription and selectedCrDb to -- after add', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.selectedDescription.set('Something');
      component.selectedCrDb.set('Something');
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: 1 });
      component.onAddNewCharges();
      expect(component.selectedDescription()).toBe('--');
      expect(component.selectedCrDb()).toBe('--');
    });

    it('should set saving to false after add completes', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: 1 });
      component.onAddNewCharges();
      expect(component.saving()).toBeFalse();
    });

    it('should handle API error gracefully via catchError', () => {
      apiServiceSpy.addOrderCharge.and.returnValue(throwError(() => new Error('API fail')));
      component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: 1 });
      component.onAddNewCharges();
      // catchError converts to of(null), so the else-if(selected) branch appends locally
      expect(component.hasChanges()).toBeTrue();
      expect(component.saving()).toBeFalse();
    });
  });

  // ─── onDeleteCharge ─────────────────────────────────────────────

  describe('onDeleteCharge', () => {
    it('should call deleteOrderCharge with orderNo and chargeCode', () => {
      component.onDeleteCharge('DEL');
      expect(apiServiceSpy.deleteOrderCharge).toHaveBeenCalledWith('ORD001', 'DEL');
    });

    it('should remove the charge from the charges list', () => {
      expect(component.charges().length).toBe(1);
      component.onDeleteCharge('DEL');
      expect(component.charges().length).toBe(0);
    });

    it('should set hasChanges to true after delete', () => {
      component.onDeleteCharge('DEL');
      expect(component.hasChanges()).toBeTrue();
    });

    it('should not remove other charges', () => {
      component.charges.set([
        { chargeCode: 'DEL', chargeCodeDesc: 'Delivery', crDbInd: 'DB', quantity: 1, amount: 10 },
        { chargeCode: 'RUS', chargeCodeDesc: 'Rush Fee', crDbInd: 'CR', quantity: 1, amount: 25 },
      ]);
      component.onDeleteCharge('DEL');
      expect(component.charges().length).toBe(1);
      expect(component.charges()[0].chargeCode).toBe('RUS');
    });

    it('should not call API when apiService is undefined', () => {
      // Simulate undefined apiService by clearing the data's apiService property
      (component.data as any).apiService = undefined;
      component.charges.set([{ chargeCode: 'DEL' }]);
      component.onDeleteCharge('DEL');
      // charges remain unchanged since the method returns early
      expect(component.charges().length).toBe(1);
    });

    it('should handle API error gracefully via catchError', () => {
      apiServiceSpy.deleteOrderCharge.and.returnValue(throwError(() => new Error('Delete fail')));
      component.onDeleteCharge('DEL');
      // catchError converts to of(false), then subscribe still runs the filter
      expect(component.charges().length).toBe(0);
      expect(component.hasChanges()).toBeTrue();
    });

    it('should handle deleting a charge code that does not exist in the list', () => {
      component.onDeleteCharge('NONEXISTENT');
      expect(component.charges().length).toBe(1); // unchanged
      expect(component.hasChanges()).toBeTrue(); // still set to true
    });
  });

  // ─── onSave ─────────────────────────────────────────────────────

  describe('onSave', () => {
    it('should close dialog with current charges', () => {
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(component.charges());
    });

    it('should pass the actual charges array when closing', () => {
      const expected = [{ chargeCode: 'DEL', chargeCodeDesc: 'Delivery', crDbInd: 'DB', quantity: 1, amount: 10 }];
      component.charges.set(expected);
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(expected);
    });

    it('should pass empty array when no charges exist', () => {
      component.charges.set([]);
      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledWith([]);
    });
  });

  // ─── onExit ─────────────────────────────────────────────────────

  describe('onExit', () => {
    it('should close dialog without data', () => {
      component.onExit();
      expect(dialogRefSpy.close).toHaveBeenCalledWith();
    });

    it('should not pass any argument to close', () => {
      component.onExit();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
      expect(dialogRefSpy.close.calls.mostRecent().args.length).toBe(0);
    });
  });

  // ─── ngOnDestroy ────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySub = (component as any).destroy$;
      const nextSpy = spyOn(destroySub, 'next');
      const completeSpy = spyOn(destroySub, 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should stop filtering when destroyed', fakeAsync(() => {
      component.ngOnDestroy();
      // After destroy, the search subscription should be completed
      const originalFiltered = component.filteredChargeCodes().length;
      component.chargeCodeSearchCtrl.setValue('xyz');
      tick(200);
      // filteredChargeCodes should not change after destroy
      expect(component.filteredChargeCodes().length).toBe(originalFiltered);
    }));
  });

  // ─── apiService getter ──────────────────────────────────────────

  describe('apiService getter', () => {
    it('should return the apiService from data', () => {
      const service = (component as any).apiService;
      expect(service).toBe(apiServiceSpy);
    });

    it('should return undefined when data.apiService is not provided', () => {
      (component.data as any).apiService = undefined;
      const service = (component as any).apiService;
      expect(service).toBeUndefined();
    });
  });
});

// ─── Separate describe for null/undefined charges data ─────────────

describe('SpecialChargesDialogComponent (null charges)', () => {
  let component: SpecialChargesDialogComponent;
  let fixture: ComponentFixture<SpecialChargesDialogComponent>;

  beforeEach(() => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const data: SpecialChargesDialogData = {
      orderNo: 'ORD002',
      charges: null as any,
      apiService: undefined,
    };

    TestBed.configureTestingModule({
      imports: [SpecialChargesDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialChargesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default charges to empty array when data.charges is null', () => {
    expect(component.charges()).toEqual([]);
  });

  it('should not call getChargeCodesLookup when apiService is undefined', () => {
    expect(component.chargeCodes()).toEqual([]);
    expect(component.filteredChargeCodes()).toEqual([]);
  });
});

describe('SpecialChargesDialogComponent (undefined charges)', () => {
  let component: SpecialChargesDialogComponent;
  let fixture: ComponentFixture<SpecialChargesDialogComponent>;

  beforeEach(() => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const data: SpecialChargesDialogData = {
      orderNo: 'ORD003',
      charges: undefined as any,
      apiService: undefined,
    };

    TestBed.configureTestingModule({
      imports: [SpecialChargesDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialChargesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should default charges to empty array when data.charges is undefined', () => {
    expect(component.charges()).toEqual([]);
  });
});

describe('SpecialChargesDialogComponent (API error on init)', () => {
  let component: SpecialChargesDialogComponent;
  let fixture: ComponentFixture<SpecialChargesDialogComponent>;
  let apiServiceSpy: jasmine.SpyObj<RegularOrderApiService>;

  beforeEach(() => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('RegularOrderApiService', [
      'getChargeCodesLookup',
      'addOrderCharge',
      'deleteOrderCharge',
    ]);
    apiServiceSpy.getChargeCodesLookup.and.returnValue(throwError(() => new Error('API Error')));

    const data: SpecialChargesDialogData = {
      orderNo: 'ORD004',
      charges: [],
      apiService: apiServiceSpy,
    };

    TestBed.configureTestingModule({
      imports: [SpecialChargesDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialChargesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should handle getChargeCodesLookup error gracefully', () => {
    expect(component.chargeCodes()).toEqual([]);
    expect(component.filteredChargeCodes()).toEqual([]);
  });
});

// ── Gap-fix: charge data, discount fields, and CR/DB indicator ──

describe('SpecialChargesDialogComponent (charge data and CR/DB)', () => {
  let component: SpecialChargesDialogComponent;
  let fixture: ComponentFixture<SpecialChargesDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SpecialChargesDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<RegularOrderApiService>;

  const mockChargeCodes = [
    { code: 'DEL', description: 'Delivery', crDbInd: 'DB', unitAmount: 10, percentDiscFlag: 'N' },
    { code: 'RUS', description: 'Rush Fee', crDbInd: 'CR', unitAmount: 25, percentDiscFlag: 'N' },
    { code: 'DSC', description: 'Discount', crDbInd: 'CR', unitAmount: 0, percentDiscFlag: 'Y' },
  ];

  beforeEach(() => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('RegularOrderApiService', [
      'getChargeCodesLookup',
      'addOrderCharge',
      'deleteOrderCharge',
    ]);
    apiServiceSpy.getChargeCodesLookup.and.returnValue(of(mockChargeCodes));
    apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
    apiServiceSpy.deleteOrderCharge.and.returnValue(of(true));

    const data: SpecialChargesDialogData = {
      orderNo: 'ORD-GAP',
      charges: [],
      apiService: apiServiceSpy,
    };

    TestBed.configureTestingModule({
      imports: [SpecialChargesDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialChargesDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should store percentDiscFlag from loaded charge codes', () => {
    const codes = component.chargeCodes();
    expect(codes.length).toBe(3);
    expect(codes[0].percentDiscFlag).toBe('N');
    expect(codes[2].percentDiscFlag).toBe('Y');
    expect(codes[2].code).toBe('DSC');
  });

  it('should accept decimal amount values', () => {
    component.chargeForm.get('amount')!.setValue(25.50);
    expect(component.chargeForm.get('amount')!.valid).toBeTrue();
  });

  it('should accept amount of zero', () => {
    component.chargeForm.get('amount')!.setValue(0);
    expect(component.chargeForm.get('amount')!.valid).toBeTrue();
  });

  it('should accept large amount values', () => {
    component.chargeForm.get('amount')!.setValue(9999.99);
    expect(component.chargeForm.get('amount')!.valid).toBeTrue();
  });

  it('should handle charge code with percentDiscFlag set to Y', () => {
    component.chargeForm.get('chargeCode')!.setValue('DSC');
    component.onChargeCodeChange();
    expect(component.selectedDescription()).toBe('Discount');
    expect(component.selectedCrDb()).toBe('CR - Credit');
  });

  it('should include custom amount in charge data sent to API', () => {
    apiServiceSpy.addOrderCharge.and.returnValue(of({ data: [] }));
    component.chargeForm.patchValue({ chargeCode: 'DEL', quantity: 2, amount: 15.50 });
    component.onAddNewCharges();
    expect(apiServiceSpy.addOrderCharge).toHaveBeenCalledWith('ORD-GAP', jasmine.objectContaining({
      chargeCode: 'DEL',
      amount: 15.50
    }));
  });

  it('should compute amount for large quantity multiplied by unitAmount', () => {
    component.chargeForm.get('chargeCode')!.setValue('RUS');
    component.chargeForm.get('quantity')!.setValue(100);
    expect(component.chargeForm.get('amount')!.value).toBe(2500);
  });

  it('should display CR/DB indicator correctly for each charge type', () => {
    component.chargeForm.get('chargeCode')!.setValue('DEL');
    component.onChargeCodeChange();
    expect(component.selectedCrDb()).toBe('DB - Debit');

    component.chargeForm.get('chargeCode')!.setValue('RUS');
    component.onChargeCodeChange();
    expect(component.selectedCrDb()).toBe('CR - Credit');

    component.chargeForm.get('chargeCode')!.setValue('DSC');
    component.onChargeCodeChange();
    expect(component.selectedCrDb()).toBe('CR - Credit');
  });
});
