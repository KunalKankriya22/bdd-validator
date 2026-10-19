import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductStorageDefinitionFilterPanel } from './product-storage-definition-filter-panel';
import { ProductStorageDefinitionService } from '../services/product-storage-definition.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { ProductStorageFilterValue, LovOption } from '../models/product-storage-definition.model';

const lovResponse = (data: LovOption[] = []) => ({
  success: true, message: '', error: null, statusCode: 200, data, total: data.length
});

const emptyFilters = (): ProductStorageFilterValue => ({
  productType: null, warehouseCode: null, deviceType: null,
  effectivePeriod: null, effectiveDate: null,
  terminationPeriod: null, terminationDate: null
});

describe('ProductStorageDefinitionFilterPanel', () => {
  let component: ProductStorageDefinitionFilterPanel;
  let fixture: ComponentFixture<ProductStorageDefinitionFilterPanel>;
  let mockService: jasmine.SpyObj<ProductStorageDefinitionService>;

  const sampleOptions: LovOption[] = [
    { code: 'RBC', description: 'Red Blood Cells' },
    { code: 'PLT', description: 'Platelets' }
  ];

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('ProductStorageDefinitionService', [
      'getProductTypeLov', 'getWarehouseLov', 'getDeviceTypeLov'
    ]);
    mockService.getProductTypeLov.and.returnValue(of(lovResponse()));
    mockService.getWarehouseLov.and.returnValue(of(lovResponse()));
    mockService.getDeviceTypeLov.and.returnValue(of(lovResponse()));

    await TestBed.configureTestingModule({
      imports: [ProductStorageDefinitionFilterPanel, BrowserAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: ProductStorageDefinitionService, useValue: mockService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductStorageDefinitionFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  // ─── Initialization ─────────────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should initialize form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm.get('productType')?.value).toBeNull();
      expect(component.filterForm.get('warehouseCode')?.value).toBeNull();
      expect(component.filterForm.get('deviceType')?.value).toBeNull();
      expect(component.filterForm.get('effectivePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationPeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should have period options with After and Before', () => {
      fixture.detectChanges();

      expect(component.periodOptions).toEqual([
        { value: 'After', label: 'After' },
        { value: 'Before', label: 'Before' }
      ]);
    });
  });

  // ─── ngOnInit / form initialization ─────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should build filterForm with all expected controls', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('productType')).toBeTruthy();
      expect(component.filterForm.get('warehouseCode')).toBeTruthy();
      expect(component.filterForm.get('deviceType')).toBeTruthy();
      expect(component.filterForm.get('effectivePeriod')).toBeTruthy();
      expect(component.filterForm.get('effectiveDate')).toBeTruthy();
      expect(component.filterForm.get('terminationPeriod')).toBeTruthy();
      expect(component.filterForm.get('terminationDate')).toBeTruthy();
    });

    it('should pre-populate form from currentFilters', () => {
      component.currentFilters = { ...emptyFilters(), productType: 'RBC', warehouseCode: 'A' };
      fixture.detectChanges();
      expect(component.filterForm.get('productType')?.value).toBe('RBC');
      expect(component.filterForm.get('warehouseCode')?.value).toBe('A');
    });

    it('should initialize filtered options from signal values', () => {
      component.productTypeOptions.set(sampleOptions);
      component.warehouseCodeOptions.set([{ code: 'A', description: 'Main' }]);
      fixture.detectChanges();
      expect(component.filteredProductTypeOptions.length).toBe(2);
      expect(component.filteredWarehouseCodeOptions.length).toBe(1);
    });
  });

  // ─── search controls ─────────────────────────────────────────────────────────

  describe('search controls', () => {
    beforeEach(() => {
      component.productTypeOptions.set(sampleOptions);
      component.warehouseCodeOptions.set([
        { code: 'A', description: 'Main Warehouse' },
        { code: 'B', description: 'Secondary Warehouse' }
      ]);
      component.deviceTypeOptions.set([
        { code: 'F', description: 'Freezer' },
        { code: 'R', description: 'Refrigerator' }
      ]);
      fixture.detectChanges();
    });

    it('should filter productTypeOptions by search term', () => {
      component.productTypeSearchControl.setValue('platelet');
      expect(component.filteredProductTypeOptions.length).toBe(1);
      expect(component.filteredProductTypeOptions[0].code).toBe('PLT');
    });

    it('should filter productTypeOptions by code', () => {
      component.productTypeSearchControl.setValue('rbc');
      expect(component.filteredProductTypeOptions.length).toBe(1);
    });

    it('should show all productTypeOptions when search is empty', () => {
      component.productTypeSearchControl.setValue('');
      expect(component.filteredProductTypeOptions.length).toBe(2);
    });

    it('should filter warehouseCodeOptions by description', () => {
      component.warehouseCodeSearchControl.setValue('main');
      expect(component.filteredWarehouseCodeOptions.length).toBe(1);
      expect(component.filteredWarehouseCodeOptions[0].code).toBe('A');
    });

    it('should filter deviceTypeOptions by description', () => {
      component.deviceTypeSearchControl.setValue('freeze');
      expect(component.filteredDeviceTypeOptions.length).toBe(1);
      expect(component.filteredDeviceTypeOptions[0].code).toBe('F');
    });

    it('should filter deviceTypeOptions by partial description', () => {
      component.deviceTypeSearchControl.setValue('refrig');
      expect(component.filteredDeviceTypeOptions.length).toBe(1);
    });
  });

  // ─── onClose ─────────────────────────────────────────────────────────────────

  describe('onClose', () => {
    it('should emit close event', () => {
      fixture.detectChanges();
      let emitted = false;
      component.close.subscribe(() => { emitted = true; });
      component.onClose();
      expect(emitted).toBe(true);
    });
  });

  // ─── onClear ─────────────────────────────────────────────────────────────────

  describe('onClear', () => {
    it('should reset the form', () => {
      fixture.detectChanges();
      component.filterForm.patchValue({ productType: 'RBC', warehouseCode: 'A' });
      component.onClear();
      expect(component.filterForm.get('productType')?.value).toBeFalsy();
      expect(component.filterForm.get('warehouseCode')?.value).toBeFalsy();
    });

    it('should clear period errors on clear', () => {
      fixture.detectChanges();
      component.filterForm.get('effectivePeriod')?.setErrors({ required: true });
      component.onClear();
      expect(component.filterForm.get('effectivePeriod')?.errors).toBeNull();
    });
  });

  // ─── onApply ─────────────────────────────────────────────────────────────────

  describe('onApply', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should emit apply with productType filter when valid', fakeAsync(() => {
      let emittedFilters: ProductStorageFilterValue | null = null;
      component.apply.subscribe(f => { emittedFilters = f; });

      component.filterForm.patchValue({ productType: 'RBC' });
      component.onApply();
      tick(50);

      expect(emittedFilters).not.toBeNull();
      expect(emittedFilters!.productType).toBe('RBC');
    }));

    it('should emit apply with warehouseCode filter', fakeAsync(() => {
      let emittedFilters: ProductStorageFilterValue | null = null;
      component.apply.subscribe(f => { emittedFilters = f; });

      component.filterForm.patchValue({ warehouseCode: 'A' });
      component.onApply();
      tick(50);

      expect(emittedFilters!.warehouseCode).toBe('A');
    }));

    it('should emit apply with deviceType filter', fakeAsync(() => {
      let emittedFilters: ProductStorageFilterValue | null = null;
      component.apply.subscribe(f => { emittedFilters = f; });

      component.filterForm.patchValue({ deviceType: 'F' });
      component.onApply();
      tick(50);

      expect(emittedFilters!.deviceType).toBe('F');
    }));

    it('should not emit when period errors exist', fakeAsync(() => {
      let emitted = false;
      component.apply.subscribe(() => { emitted = true; });

      component.filterForm.get('effectivePeriod')?.setErrors({ required: true });
      component.onApply();
      tick(50);

      expect(emitted).toBe(false);
    }));

    it('should not emit when form has date parse errors', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });
      component.filterForm.get('effectiveDate')?.markAsTouched();
      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should include date period only when date is set', () => {
      spyOn(component.apply, 'emit');

      const testDate = new Date('2025-06-15');
      component.filterForm.patchValue({
        effectivePeriod: 'After',
        effectiveDate: testDate
      });
      component.onApply();

      const emittedFilters = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedFilters.effectivePeriod).toBe('After');
    });

    it('should emit null effectiveDate when no date selected', fakeAsync(() => {
      let emittedFilters: ProductStorageFilterValue | null = null;
      component.apply.subscribe(f => { emittedFilters = f; });

      component.filterForm.patchValue({ productType: 'RBC', effectiveDate: null });
      component.onApply();
      tick(50);

      expect(emittedFilters!.effectiveDate).toBeNull();
      expect(emittedFilters!.effectivePeriod).toBeNull();
    }));
  });

  // ─── isApplyDisabled ─────────────────────────────────────────────────────────

  describe('isApplyDisabled', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should be true when form is empty', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be false when productType is set', () => {
      component.filterForm.patchValue({ productType: 'RBC' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be false when warehouseCode is set', () => {
      component.filterForm.patchValue({ warehouseCode: 'A' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be false when deviceType is set', () => {
      component.filterForm.patchValue({ deviceType: 'F' });
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should be true when period is set but no date', () => {
      component.filterForm.patchValue({ effectivePeriod: 'After' });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when terminationPeriod is set but no date', () => {
      component.filterForm.patchValue({ terminationPeriod: 'Before' });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should be true when date has parse errors', () => {
      component.filterForm.patchValue({ productType: 'RBC' });
      component.filterForm.get('effectiveDate')?.setErrors({ matDatepickerParse: true });

      expect(component.isApplyDisabled).toBe(true);
    });
  });

  // ─── getEffectiveDateError / getTerminationDateError ─────────────────────────

  describe('date error getters', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return empty string for untouched effectiveDate', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string for untouched terminationDate', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return error message when effectiveDate has matDatepickerParse error', () => {
      const ctrl = component.filterForm.get('effectiveDate')!;
      ctrl.setErrors({ matDatepickerParse: true });
      ctrl.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return error message when terminationDate has matDatepickerParse error', () => {
      const ctrl = component.filterForm.get('terminationDate')!;
      ctrl.setErrors({ matDatepickerParse: true });
      ctrl.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination date is invalid');
    });
  });

  // ─── validateEffectiveDatePeriod ─────────────────────────────────────────────

  describe('validateEffectiveDatePeriod', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should set required error on effectivePeriod when date is set but period is not', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date('2026-06-01'), effectivePeriod: null });
      component['validateEffectiveDatePeriod']();
      tick(10);
      expect(component.filterForm.get('effectivePeriod')?.errors).toEqual({ required: true });
    }));

    it('should clear errors on effectivePeriod when both date and period are set', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: new Date('2026-06-01'), effectivePeriod: 'After' });
      component['validateEffectiveDatePeriod']();
      tick(10);
      expect(component.filterForm.get('effectivePeriod')?.errors).toBeNull();
    }));

    it('should clear errors when effectiveDate is null', fakeAsync(() => {
      component.filterForm.patchValue({ effectiveDate: null, effectivePeriod: null });
      component['validateEffectiveDatePeriod']();
      tick(10);
      expect(component.filterForm.get('effectivePeriod')?.errors).toBeNull();
    }));
  });

  // ─── validateTerminationDatePeriod ───────────────────────────────────────────

  describe('validateTerminationDatePeriod', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should set required error on terminationPeriod when date is set but period is not', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date('2026-12-31'), terminationPeriod: null });
      component['validateTerminationDatePeriod']();
      tick(10);
      expect(component.filterForm.get('terminationPeriod')?.errors).toEqual({ required: true });
    }));

    it('should clear errors on terminationPeriod when both date and period are set', fakeAsync(() => {
      component.filterForm.patchValue({ terminationDate: new Date('2026-12-31'), terminationPeriod: 'Before' });
      component['validateTerminationDatePeriod']();
      tick(10);
      expect(component.filterForm.get('terminationPeriod')?.errors).toBeNull();
    }));
  });

  // ─── ngOnDestroy ─────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete without error', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
