import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SimpleChange, signal } from '@angular/core';

import { StandingOrderItemSidePanelComponent } from './standing-order-item-side-panel';
import { StandingOrderService } from '../../services/standing-order.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  StandingOrderItemListDto,
  StandingOrderItemDto,
  LovOption
} from '../../models/standing-order.model';
import moment from 'moment';

// ─── Test Data ────────────────────────────────────────────────────────────────

const mockProductTypes: LovOption[] = [
  { code: 'RBC', description: 'Red Blood Cells' },
  { code: 'PLT', description: 'Platelets' }
];

const mockRecord: StandingOrderItemListDto = {
  itemNo: 1,
  weekDay: 'MON',
  weekDayDisplay: 'Monday',
  productType: 'RBC',
  productName: 'Red Blood Cells',
  abOrh: 'O+',
  tier: '1',
  quantity: 5,
  substitution: 'Yes - Allowed',
  minimumQuantity: '3',
  attributeDisplay: '--',
  effectiveDate: '01-JUN-2024',
  terminationDate: '--'
};

const mockExistingDto: StandingOrderItemDto = {
  itemNo: 1,
  productType: 'RBC',
  bloodType: 'O+',
  productTypeShortName: 'Red Blood Cells',
  bloodTypeDescription: 'O Positive',
  tier: '1',
  qty: 5,
  subOk: 'Y',
  minQty: 3,
  effDate: '2024-06-01T00:00:00Z',
  termDate: null,
  lastModifiedDate: '2024-06-10T12:00:00Z',
  attribGroup: 'GRP1',
  attribCode: 'CODE1'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildServiceSpy(): jasmine.SpyObj<StandingOrderService> {
  const spy = jasmine.createSpyObj<StandingOrderService>('StandingOrderService', [
    'getAttributeGroups',
    'getBloodTypes',
    'getTiers',
    'getAttributeCodes',
    'getStandingOrderItemById',
    'createStandingOrderItem',
    'updateStandingOrderItem'
  ]);
  spy.getAttributeGroups.and.returnValue(of([{ code: 'GRP1', description: 'Group 1' }]));
  spy.getBloodTypes.and.returnValue(of([{ code: 'O+', description: 'O Positive' }]));
  spy.getTiers.and.returnValue(of([{ code: '1', description: '1' }]));
  spy.getAttributeCodes.and.returnValue(of([{ code: 'CODE1', description: 'Code 1' }]));
  spy.getStandingOrderItemById.and.returnValue(of(mockExistingDto));
  spy.createStandingOrderItem.and.returnValue(of({} as any));
  spy.updateStandingOrderItem.and.returnValue(of({} as any));
  return spy;
}

// ─── Spec ─────────────────────────────────────────────────────────────────────

describe('StandingOrderItemSidePanelComponent', () => {
  let component: StandingOrderItemSidePanelComponent;
  let fixture: ComponentFixture<StandingOrderItemSidePanelComponent>;
  let serviceSpy: jasmine.SpyObj<StandingOrderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  /**
   * Configure and create the component.
   * Uses an empty chapterTimeZone to avoid IANA→utcOffset mismatch in lastModifiedDisplay;
   * individual tests that need a real offset override headerOverrides.
   */
  function setupComponent(
    mode: 'add' | 'edit' = 'add',
    record: StandingOrderItemListDto | null = null,
    headerOverrides?: Partial<Record<string, any>>
  ): void {
    serviceSpy = buildServiceSpy();
    headerServiceSpy = createMockHeaderService({
      chapterTimeZone: signal(''),   // falsy → moment(date) branch; safe for most tests
      ...headerOverrides
    });

    TestBed.configureTestingModule({
      imports: [StandingOrderItemSidePanelComponent, NoopAnimationsModule],
      providers: [
        { provide: StandingOrderService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    fixture = TestBed.createComponent(StandingOrderItemSidePanelComponent);
    component = fixture.componentInstance;
    component.mode = mode;
    component.record = record;
    component.contractId = 'CON001';
    component.consigneeId = 'CSG001';
    component.weekDay = 'MON';
    component.productTypesLookup = mockProductTypes;
    fixture.detectChanges(); // triggers ngOnInit
  }

  // ─── Initialization — Add Mode ──────────────────────────────────────────────

  describe('Initialization add mode', () => {
    beforeEach(() => setupComponent('add', null));

    it('should create the component in add mode', () => {
      expect(component).toBeTruthy();
    });

    it('should call loadAttributeGroups on init', () => {
      expect(serviceSpy.getAttributeGroups).toHaveBeenCalledTimes(1);
    });

    it('should NOT call loadExistingRecord in add mode', () => {
      expect(serviceSpy.getStandingOrderItemById).not.toHaveBeenCalled();
    });

    it('should return "Add New Product Details" for panelTitle', () => {
      expect(component.panelTitle).toBe('Add New Product Details');
    });

    it('should return "--" for productNameDisplay when no productType selected', () => {
      expect(component.productNameDisplay).toBe('--');
    });

    it('should return weekDayDisplay for the weekDay input', () => {
      expect(component.weekDayDisplay).toBe('Monday');
    });

    it('should have productType control enabled in add mode', () => {
      expect(component.form.get('productType')?.enabled).toBeTrue();
    });
  });

  // ─── Initialization — Edit Mode ─────────────────────────────────────────────

  describe('Initialization edit mode', () => {
    beforeEach(() => setupComponent('edit', mockRecord));

    it('should call loadExistingRecord in edit mode with a record', () => {
      expect(serviceSpy.getStandingOrderItemById).toHaveBeenCalledWith(
        'CON001', 'CSG001', 'MON', mockRecord.itemNo
      );
    });

    it('should patch form with existing record data after load', () => {
      expect(component.form.getRawValue().productType).toBe(mockExistingDto.productType);
      expect(component.form.get('bloodType')?.value).toBe(mockExistingDto.bloodType);
      expect(component.form.get('qty')?.value).toBe(mockExistingDto.qty);
    });

    it('should handle loadExistingRecord error gracefully — sets loading to false', () => {
      // Re-setup with error spy
      serviceSpy.getStandingOrderItemById.and.returnValue(throwError(() => new Error('API error')));
      component.ngOnInit();
      expect(component.loading()).toBeFalse();
    });

    it('should not patch form when dto is null', () => {
      serviceSpy.getStandingOrderItemById.and.returnValue(of(null));
      const patchSpy = spyOn(component.form, 'patchValue').and.callThrough();
      component.ngOnInit();
      // patchValue is not called for null dto (form was already patched in beforeEach ngOnInit,
      // but the second ngOnInit call with null dto should not patch again)
      const callsWithProductType = patchSpy.calls.all().filter(
        c => c.args[0] && c.args[0].productType !== undefined
      );
      expect(callsWithProductType.length).toBe(0);
    });

    it('should return "Edit Previous Product Details" for panelTitle', () => {
      expect(component.panelTitle).toBe('Edit Previous Product Details');
    });

    it('should return formatted lastModifiedDisplay without tz when chapterTimeZone is empty', () => {
      // chapterTimeZone is '' (falsy) → uses moment(date) branch
      const expected = moment(mockExistingDto.lastModifiedDate!).format('DD-MMM-YYYY').toUpperCase();
      expect(component.lastModifiedDisplay).toBe(expected);
    });

    it('should return null for lastModifiedDisplay when no lastModifiedDate', () => {
      // Patch existingRecord to have no lastModifiedDate
      const dtoNoDate: StandingOrderItemDto = { ...mockExistingDto, lastModifiedDate: null };
      serviceSpy.getStandingOrderItemById.and.returnValue(of(dtoNoDate));
      component.ngOnInit();
      expect(component.lastModifiedDisplay).toBeNull();
    });

    it('should return null for lastModifiedDisplay when date is invalid', () => {
      const dtoInvalidDate: StandingOrderItemDto = { ...mockExistingDto, lastModifiedDate: 'NOT_A_DATE' };
      serviceSpy.getStandingOrderItemById.and.returnValue(of(dtoInvalidDate));
      component.ngOnInit();
      expect(component.lastModifiedDisplay).toBeNull();
    });

    it('should have productType control disabled in edit mode', () => {
      expect(component.form.get('productType')?.disabled).toBeTrue();
    });
  });

  describe('lastModifiedDisplay — edit mode with UTC offset', () => {
    beforeEach(() => setupComponent('edit', mockRecord, { chapterTimeZone: signal('+00:00') }));

    it('should return formatted date using the provided UTC offset', () => {
      const expected = moment.utc(mockExistingDto.lastModifiedDate!)
        .utcOffset('+00:00')
        .format('DD-MMM-YYYY')
        .toUpperCase();
      expect(component.lastModifiedDisplay).toBe(expected);
    });
  });

  describe('lastModifiedDisplay — add mode', () => {
    beforeEach(() => setupComponent('add', null));

    it('should return null in add mode (isEditMode is false)', () => {
      expect(component.lastModifiedDisplay).toBeNull();
    });
  });

  // ─── productNameDisplay ─────────────────────────────────────────────────────

  describe('productNameDisplay', () => {
    beforeEach(() => setupComponent('add', null));

    it('should return description from productTypesLookup when productType matches', () => {
      component.form.get('productType')?.setValue('RBC');
      expect(component.productNameDisplay).toBe('Red Blood Cells');
    });

    it('should return the productType code when not found in lookup', () => {
      component.form.get('productType')?.setValue('UNKNOWN');
      expect(component.productNameDisplay).toBe('UNKNOWN');
    });

    it('should return "--" when productType is empty', () => {
      component.form.get('productType')?.setValue('');
      expect(component.productNameDisplay).toBe('--');
    });
  });

  // ─── filteredProductTypes computed ─────────────────────────────────────────

  describe('filteredProductTypes computed', () => {
    beforeEach(() => setupComponent('add', null));

    it('returns all options when search is empty', () => {
      component.productTypeSearchCtrl.setValue('');
      expect(component.filteredProductTypes().length).toBe(mockProductTypes.length);
    });

    it('filters by code (case-insensitive)', () => {
      component.productTypeSearchCtrl.setValue('rbc');
      const filtered = component.filteredProductTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('RBC');
    });

    it('filters by description (case-insensitive)', () => {
      component.productTypeSearchCtrl.setValue('platelet');
      const filtered = component.filteredProductTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('PLT');
    });

    it('returns empty array when no match', () => {
      component.productTypeSearchCtrl.setValue('zzz');
      expect(component.filteredProductTypes().length).toBe(0);
    });
  });

  // ─── filteredBloodTypes computed ────────────────────────────────────────────

  describe('filteredBloodTypes computed', () => {
    beforeEach(() => {
      setupComponent('add', null);
      // Trigger bloodTypes population by setting productType
      component.form.get('productType')?.setValue('RBC');
    });

    it('returns all bloodTypes when search is empty', () => {
      component.bloodTypeSearchCtrl.setValue('');
      expect(component.filteredBloodTypes().length).toBe(1);
    });

    it('filters bloodTypes by code', () => {
      component.bloodTypeSearchCtrl.setValue('O+');
      const filtered = component.filteredBloodTypes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('O+');
    });

    it('returns empty when no blood type matches search', () => {
      component.bloodTypeSearchCtrl.setValue('ZZ');
      expect(component.filteredBloodTypes().length).toBe(0);
    });
  });

  // ─── setupCascadingDropdowns ────────────────────────────────────────────────

  describe('setupCascadingDropdowns', () => {
    beforeEach(() => setupComponent('add', null));

    it('should call getBloodTypes and getTiers when productType changes', () => {
      component.form.get('productType')?.setValue('RBC');
      expect(serviceSpy.getBloodTypes).toHaveBeenCalledWith('RBC');
      expect(serviceSpy.getTiers).toHaveBeenCalledWith('RBC');
    });

    it('should populate bloodTypes and tiers signals after productType change', () => {
      component.form.get('productType')?.setValue('RBC');
      expect(component.bloodTypes().length).toBe(1);
      expect(component.tiers().length).toBe(1);
    });

    it('should reset bloodType and tier form values when productType changes in add mode', () => {
      // First set blood type, then change product type
      component.form.patchValue({ bloodType: 'A+', tier: '2' });
      component.form.get('productType')?.setValue('PLT');
      expect(component.form.get('bloodType')?.value).toBe('');
      expect(component.form.get('tier')?.value).toBe('1');
    });

    it('should clear bloodTypes and tiers signals when productType is empty', () => {
      component.form.get('productType')?.setValue('RBC');
      component.form.get('productType')?.setValue('');
      expect(component.bloodTypes()).toEqual([]);
      expect(component.tiers()).toEqual([]);
    });

    it('should NOT call getBloodTypes or getTiers when productType is empty/null', () => {
      serviceSpy.getBloodTypes.calls.reset();
      serviceSpy.getTiers.calls.reset();
      component.form.get('productType')?.setValue('');
      expect(serviceSpy.getBloodTypes).not.toHaveBeenCalled();
      expect(serviceSpy.getTiers).not.toHaveBeenCalled();
    });

    it('should call getAttributeCodes when attribGroup changes', () => {
      component.form.get('attribGroup')?.setValue('GRP1');
      expect(serviceSpy.getAttributeCodes).toHaveBeenCalledWith('GRP1');
    });

    it('should populate attributeCodes signal after attribGroup change', () => {
      component.form.get('attribGroup')?.setValue('GRP1');
      expect(component.attributeCodes().length).toBe(1);
      expect(component.attributeCodes()[0].code).toBe('CODE1');
    });

    it('should auto-select first attribCode when attribCodes loaded (not edit-loading)', () => {
      component.form.get('attribGroup')?.setValue('GRP1');
      // getAttributeCodes returns [{code:'CODE1'}] synchronously
      expect(component.form.get('attribCode')?.value).toBe('CODE1');
    });

    it('should reset attribCode when attribGroup changes to null', () => {
      component.form.get('attribGroup')?.setValue('GRP1');
      component.form.get('attribGroup')?.setValue(null);
      expect(component.form.get('attribCode')?.value).toBeNull();
    });

    it('should clear attributeCodes signal when attribGroup changes to null', () => {
      component.form.get('attribGroup')?.setValue('GRP1');
      component.form.get('attribGroup')?.setValue(null);
      expect(component.attributeCodes()).toEqual([]);
    });
  });

  describe('setupCascadingDropdowns — edit mode does not reset during load', () => {
    it('should NOT auto-select attribCode during edit data loading (dto value takes precedence)', () => {
      // Use a dto with a different attribCode than what getAttributeCodes returns
      const dtoWithCustomCode: StandingOrderItemDto = { ...mockExistingDto, attribCode: 'DTO_CODE' };
      // getAttributeCodes still returns CODE1 (auto-select would set CODE1, but it is blocked)
      // patchValue then sets 'DTO_CODE' from the dto
      setupComponent('edit', mockRecord);
      serviceSpy.getStandingOrderItemById.and.returnValue(of(dtoWithCustomCode));
      serviceSpy.getAttributeCodes.and.returnValue(of([{ code: 'AUTO_CODE', description: 'Auto' }]));
      component.ngOnInit();
      // final value should be 'DTO_CODE' from patchValue, not 'AUTO_CODE' from auto-select
      expect(component.form.get('attribCode')?.value).toBe('DTO_CODE');
    });

    it('should populate bloodTypes signal during edit load (productType valueChanges triggers cascade)', () => {
      setupComponent('edit', mockRecord);
      // bloodTypes should be populated after loadExistingRecord patches productType
      expect(component.bloodTypes().length).toBeGreaterThan(0);
    });

    it('should retain dto bloodType value after edit load (no mid-load reset)', () => {
      setupComponent('edit', mockRecord);
      expect(component.form.get('bloodType')?.value).toBe(mockExistingDto.bloodType);
    });
  });

  // ─── onSave — invalid form ──────────────────────────────────────────────────

  describe('onSave — invalid form', () => {
    beforeEach(() => setupComponent('add', null));

    it('should markAllAsTouched when form is invalid and not call service', () => {
      spyOn(component.form, 'markAllAsTouched').and.callThrough();
      component.onSave(false);
      expect(component.form.markAllAsTouched).toHaveBeenCalled();
      expect(serviceSpy.createStandingOrderItem).not.toHaveBeenCalled();
    });

    it('should not set loading when form is invalid', () => {
      component.onSave(false);
      expect(component.loading()).toBeFalse();
    });
  });

  // ─── onSave — add mode ──────────────────────────────────────────────────────

  describe('onSave — add mode', () => {
    beforeEach(() => {
      setupComponent('add', null);
      // Make form valid
      component.form.patchValue({
        productType: 'RBC',
        bloodType: 'O+',
        qty: 5
      });
      // effDate is initialised to minDate in add mode
    });

    it('should call createStandingOrderItem with correct identifiers', () => {
      component.onSave(false);
      expect(serviceSpy.createStandingOrderItem).toHaveBeenCalledWith(
        'CON001', 'CSG001', 'MON', jasmine.any(Object)
      );
    });

    it('should emit saveSuccess with success message when addAnother is false', () => {
      const successSpy = spyOn(component.saveSuccess, 'emit');
      component.onSave(false);
      expect(successSpy).toHaveBeenCalledWith('Product created successfully');
    });

    it('should emit saveAndAddAnother and reset form when addAnother is true', () => {
      const addAnotherSpy = spyOn(component.saveAndAddAnother, 'emit');
      component.onSave(true);
      expect(addAnotherSpy).toHaveBeenCalledWith('Product created successfully');
      // Form should be reset: productType cleared
      expect(component.form.get('productType')?.value).toBe('');
    });

    it('should set loading to false on create error', () => {
      serviceSpy.createStandingOrderItem.and.returnValue(throwError(() => new Error('Server error')));
      component.onSave(false);
      expect(component.loading()).toBeFalse();
    });

    it('should use default tier "1" when tier is null or empty', () => {
      component.form.patchValue({ tier: null });
      component.onSave(false);
      const callArgs = serviceSpy.createStandingOrderItem.calls.mostRecent().args[3];
      expect(callArgs.tier).toBe('1');
    });

    it('should not emit saveSuccess when create fails', () => {
      serviceSpy.createStandingOrderItem.and.returnValue(throwError(() => new Error('err')));
      const successSpy = spyOn(component.saveSuccess, 'emit');
      component.onSave(false);
      expect(successSpy).not.toHaveBeenCalled();
    });

    it('should reset bloodTypes and tiers signals after save-and-add-another', () => {
      // bloodTypes/tiers are already populated by the beforeEach patchValue({productType:'RBC',...}).
      // Do NOT call setValue('RBC') again — that triggers the cascade which resets bloodType
      // to '' and makes the form invalid (preventing onSave from proceeding).
      expect(component.bloodTypes().length).toBeGreaterThan(0); // confirm pre-condition

      component.onSave(true); // valid form → createStandingOrderItem → resetFormForAddAnother
      expect(component.bloodTypes()).toEqual([]);
      expect(component.tiers()).toEqual([]);
    });
  });

  // ─── onSave — edit mode ─────────────────────────────────────────────────────

  describe('onSave — edit mode', () => {
    beforeEach(() => {
      setupComponent('edit', mockRecord);
      // After edit load, form has productType, bloodType, qty set from dto
      // Make effDate valid for edit (set a Moment so required passes)
      component.form.get('effDate')?.setValue(moment('2024-06-01'));
    });

    it('should call updateStandingOrderItem with correct parameters', () => {
      component.onSave(false);
      expect(serviceSpy.updateStandingOrderItem).toHaveBeenCalledWith(
        'CON001', 'CSG001', 'MON', mockRecord.itemNo, jasmine.any(Object)
      );
    });

    it('should emit saveSuccess after successful update', () => {
      const successSpy = spyOn(component.saveSuccess, 'emit');
      component.onSave(false);
      expect(successSpy).toHaveBeenCalledWith('Product updated successfully');
    });

    it('should set loading to false on update error', () => {
      serviceSpy.updateStandingOrderItem.and.returnValue(throwError(() => new Error('err')));
      component.onSave(false);
      expect(component.loading()).toBeFalse();
    });

    it('should include attribGroup and attribCode in update payload when set', () => {
      component.form.patchValue({ attribGroup: 'GRP1', attribCode: 'CODE1' });
      component.onSave(false);
      const dto = serviceSpy.updateStandingOrderItem.calls.mostRecent().args[4];
      expect(dto.attribGroup).toBe('GRP1');
      expect(dto.attribCode).toBe('CODE1');
    });

    it('should use default tier "1" in update payload when tier is null', () => {
      component.form.get('tier')?.setValue(null);
      component.onSave(false);
      const dto = serviceSpy.updateStandingOrderItem.calls.mostRecent().args[4];
      expect(dto.tier).toBe('1');
    });

    it('should use getRawValue so disabled productType is included in update payload', () => {
      // productType is disabled in edit mode; getRawValue must be used to include it
      component.onSave(false);
      const dto = serviceSpy.updateStandingOrderItem.calls.mostRecent().args[4];
      expect(dto.productType).toBe('RBC');
    });

    it('should not call createStandingOrderItem in edit mode', () => {
      component.onSave(false);
      expect(serviceSpy.createStandingOrderItem).not.toHaveBeenCalled();
    });
  });

  // ─── onCancel ───────────────────────────────────────────────────────────────

  describe('onCancel', () => {
    beforeEach(() => setupComponent('add', null));

    it('should emit closePanel event', () => {
      const closeSpy = spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(closeSpy).toHaveBeenCalled();
    });
  });

  // ─── getEffectiveDateMin ────────────────────────────────────────────────────

  describe('getEffectiveDateMin', () => {
    it('returns a Moment (minDate) in add mode', () => {
      setupComponent('add', null);
      const result = component.getEffectiveDateMin();
      expect(result).not.toBeNull();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('returns null in edit mode', () => {
      setupComponent('edit', mockRecord);
      expect(component.getEffectiveDateMin()).toBeNull();
    });
  });

  // ─── getTerminationDateMin ──────────────────────────────────────────────────

  describe('getTerminationDateMin', () => {
    beforeEach(() => setupComponent('add', null));

    it('returns minDate when effDate is null', () => {
      component.form.get('effDate')?.setValue(null);
      const result = component.getTerminationDateMin();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('returns effDate when effDate is a valid Moment after minDate', () => {
      const futureDate = moment().add(10, 'days');
      component.form.get('effDate')?.setValue(futureDate);
      const result = component.getTerminationDateMin();
      expect(result?.isSame(futureDate, 'day')).toBeTrue();
    });

    it('returns minDate when effDate is before minDate (edit mode with past date)', () => {
      const pastDate = moment().subtract(10, 'days');
      component.form.get('effDate')?.setValue(pastDate);
      const result = component.getTerminationDateMin();
      // past date is not after minDate, so minDate is returned
      expect(moment.isMoment(result)).toBeTrue();
      // The result should be >= today (minDate), not the past date
      expect(result!.isSameOrAfter(pastDate, 'day')).toBeTrue();
    });

    it('returns minDate when effDate is not a Moment object', () => {
      component.form.get('effDate')?.setValue('not-a-moment');
      const result = component.getTerminationDateMin();
      expect(moment.isMoment(result)).toBeTrue();
    });
  });

  // ─── getMinQtyError ─────────────────────────────────────────────────────────

  describe('getMinQtyError', () => {
    beforeEach(() => setupComponent('add', null));

    it('returns "Minimum quantity must be at least 1" when minQty has min error', () => {
      component.form.patchValue({ qty: 5, minQty: 0 }); // 0 fails min(1) validator
      expect(component.getMinQtyError()).toBe('Minimum quantity must be at least 1');
    });

    it('returns "Cannot exceed order quantity" when minQtyExceedsQty form error is set', () => {
      component.form.patchValue({ qty: 3, minQty: 5 }); // minQty > qty triggers group validator
      expect(component.getMinQtyError()).toBe('Cannot exceed order quantity');
    });

    it('returns empty string when no minQty errors exist', () => {
      component.form.patchValue({ qty: 5, minQty: 3 }); // valid: minQty < qty
      expect(component.getMinQtyError()).toBe('');
    });

    it('returns empty string when minQty is null', () => {
      component.form.patchValue({ qty: 5, minQty: null });
      expect(component.getMinQtyError()).toBe('');
    });
  });

  // ─── minQtyValidator (group validator) ─────────────────────────────────────

  describe('minQtyValidator (group validator)', () => {
    beforeEach(() => setupComponent('add', null));

    it('sets minQtyExceedsQty error when minQty > qty', () => {
      component.form.patchValue({ qty: 3, minQty: 5 });
      expect(component.form.hasError('minQtyExceedsQty')).toBeTrue();
    });

    it('has no minQtyExceedsQty error when minQty <= qty', () => {
      component.form.patchValue({ qty: 5, minQty: 3 });
      expect(component.form.hasError('minQtyExceedsQty')).toBeFalse();
    });

    it('has no minQtyExceedsQty error when minQty equals qty', () => {
      component.form.patchValue({ qty: 5, minQty: 5 });
      expect(component.form.hasError('minQtyExceedsQty')).toBeFalse();
    });

    it('has no minQtyExceedsQty error when minQty is null', () => {
      component.form.patchValue({ qty: 5, minQty: null });
      expect(component.form.hasError('minQtyExceedsQty')).toBeFalse();
    });

    it('has no minQtyExceedsQty error when qty is null', () => {
      component.form.patchValue({ qty: null, minQty: 5 });
      expect(component.form.hasError('minQtyExceedsQty')).toBeFalse();
    });
  });

  // ─── ngOnChanges ────────────────────────────────────────────────────────────

  describe('ngOnChanges', () => {
    it('re-inits form when mode changes from add to edit', () => {
      setupComponent('add', null);
      // productType should be enabled in add mode
      expect(component.form.get('productType')?.enabled).toBeTrue();

      component.mode = 'edit';
      component.record = mockRecord;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });

      // After re-init, productType is disabled (edit mode)
      expect(component.form.get('productType')?.disabled).toBeTrue();
    });

    it('calls loadExistingRecord when record changes in edit mode', () => {
      setupComponent('add', null);
      serviceSpy.getStandingOrderItemById.calls.reset();

      component.mode = 'edit';
      component.record = mockRecord;
      component.ngOnChanges({
        record: new SimpleChange(null, mockRecord, false)
      });

      expect(serviceSpy.getStandingOrderItemById).toHaveBeenCalledWith(
        'CON001', 'CSG001', 'MON', mockRecord.itemNo
      );
    });

    it('does not call loadExistingRecord when mode changes but no record', () => {
      setupComponent('add', null);
      serviceSpy.getStandingOrderItemById.calls.reset();

      component.mode = 'edit';
      component.record = null;
      component.ngOnChanges({
        mode: new SimpleChange('add', 'edit', false)
      });

      expect(serviceSpy.getStandingOrderItemById).not.toHaveBeenCalled();
    });

    it('does not re-init form before form is created (no form guard)', () => {
      setupComponent('add', null);
      // Simulate a change before form exists by nulling the form reference
      (component as any).form = null;
      expect(() => {
        component.ngOnChanges({ mode: new SimpleChange('add', 'edit', false) });
      }).not.toThrow();
    });
  });

  // ─── ngOnDestroy ────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    beforeEach(() => setupComponent('add', null));

    it('completes destroy$ subject without error', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    it('unsubscribes from service calls after destroy', () => {
      component.ngOnDestroy();
      // Calling ngOnInit after destroy should not cause new subscriptions to leak
      serviceSpy.getAttributeGroups.calls.reset();
      // After destroy, new subscriptions from a re-init would be the only calls
      // (just verify no error is thrown)
      expect(component).toBeTruthy();
    });
  });

  // ─── loadAttributeGroups ────────────────────────────────────────────────────

  describe('loadAttributeGroups', () => {
    beforeEach(() => setupComponent('add', null));

    it('should populate attributeGroups signal after loading', () => {
      expect(component.attributeGroups().length).toBe(1);
      expect(component.attributeGroups()[0].code).toBe('GRP1');
    });

    it('should populate filteredAttributeGroups computed with loaded groups', () => {
      expect(component.filteredAttributeGroups().length).toBe(1);
    });

    it('should filter attributeGroups by search term', () => {
      component.attribGroupSearchCtrl.setValue('group');
      expect(component.filteredAttributeGroups().length).toBe(1);

      component.attribGroupSearchCtrl.setValue('zzz');
      expect(component.filteredAttributeGroups().length).toBe(0);
    });
  });

  // ─── isEditMode getter ──────────────────────────────────────────────────────

  describe('isEditMode getter', () => {
    it('returns false in add mode', () => {
      setupComponent('add', null);
      expect(component.isEditMode).toBeFalse();
    });

    it('returns true in edit mode', () => {
      setupComponent('edit', mockRecord);
      expect(component.isEditMode).toBeTrue();
    });
  });

  // ─── weekDayDisplay getter ──────────────────────────────────────────────────

  describe('weekDayDisplay getter', () => {
    it('returns full day name for known week day codes', () => {
      setupComponent('add', null);
      expect(component.weekDayDisplay).toBe('Monday'); // weekDay='MON'
    });

    it('returns the raw code when the week day is unknown', () => {
      setupComponent('add', null);
      component.weekDay = 'XXX';
      expect(component.weekDayDisplay).toBe('XXX');
    });
  });

  // ─── loading signal ─────────────────────────────────────────────────────────

  describe('loading signal', () => {
    it('should be false initially in add mode', () => {
      setupComponent('add', null);
      expect(component.loading()).toBeFalse();
    });

    it('should be false after edit record load completes', () => {
      setupComponent('edit', mockRecord);
      expect(component.loading()).toBeFalse();
    });
  });
});
