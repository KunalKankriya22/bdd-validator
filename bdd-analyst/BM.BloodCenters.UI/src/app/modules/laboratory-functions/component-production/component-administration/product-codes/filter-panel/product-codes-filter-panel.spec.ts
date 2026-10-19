import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ProductCodesFilterPanel, ProductCodeFilterValue } from './product-codes-filter-panel';
import { ProductCodesService } from '../services/product-codes.service';

describe('ProductCodesFilterPanel', () => {
  let component: ProductCodesFilterPanel;
  let fixture: ComponentFixture<ProductCodesFilterPanel>;
  let mockService: jasmine.SpyObj<ProductCodesService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ProductCodesService', ['getProductTypes']);
    mockService.getProductTypes.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [
        ProductCodesFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ProductCodesService, useValue: mockService }
      ]
    });

    fixture = TestBed.createComponent(ProductCodesFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('productType')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
    expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('terminationDate')?.value).toBeNull();
  });

  it('should initialize form with currentFilters when provided', () => {
    component.currentFilters = {
      productType: 'WB',
      effectiveDatePeriod: null,
      effectiveDate: null,
      terminationDatePeriod: null,
      terminationDate: null
    };
    fixture.detectChanges();

    expect(component.filterForm.get('productType')?.value).toBe('WB');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ productType: 'RBC' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith(jasmine.objectContaining({
      productType: 'RBC'
    }));
  });

  it('should not emit apply when isApplyDisabled is true', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    // Form invalid due to date format error
    component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
    component.onApply();

    expect(component.apply.emit).not.toHaveBeenCalled();
  });

  it('should reset form on onClearAll', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ productType: 'PLT' });

    component.onClearAll();

    expect(component.filterForm.get('productType')?.value).toBeFalsy();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should set effectiveDatePeriodError when date is set without period', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({
      effectiveDate: new Date(2025, 0, 1),
      effectiveDatePeriod: null
    });

    expect(component.effectiveDatePeriodError).toBe('Period is required');
  });

  it('should clear effectiveDatePeriodError when both date and period are set', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({
      effectiveDate: new Date(2025, 0, 1),
      effectiveDatePeriod: 'AFTER'
    });

    expect(component.effectiveDatePeriodError).toBe('');
  });

  it('should load product types from service', () => {
    const types = [{ code: 'WB', description: 'Whole Blood' }];
    mockService.getProductTypes.and.returnValue(of(types));
    fixture.detectChanges();

    expect(component.productTypes).toEqual(types);
  });
});
