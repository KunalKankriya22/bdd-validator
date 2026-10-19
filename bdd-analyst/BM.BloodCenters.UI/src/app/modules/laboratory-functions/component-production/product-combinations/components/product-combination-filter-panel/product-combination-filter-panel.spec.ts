import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ProductCombinationFilterPanel } from './product-combination-filter-panel';

describe('ProductCombinationFilterPanel', () => {
  let component: ProductCombinationFilterPanel;
  let fixture: ComponentFixture<ProductCombinationFilterPanel>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ProductCombinationFilterPanel,
        ReactiveFormsModule,
        NoopAnimationsModule
      ]
    });

    fixture = TestBed.createComponent(ProductCombinationFilterPanel);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize form with null values when no currentFilters', () => {
    fixture.detectChanges();

    expect(component.filterForm.get('bagCount')?.value).toBeNull();
    expect(component.filterForm.get('productType')?.value).toBeNull();
  });

  it('should patch form with currentFilters on ngOnInit', () => {
    component.currentFilters = { bagCount: 3, productType: 'WB' };
    fixture.detectChanges();

    expect(component.filterForm.get('bagCount')?.value).toBe(3);
    expect(component.filterForm.get('productType')?.value).toBe('WB');
  });

  it('should emit apply event with filter values on onApply', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.filterForm.patchValue({ bagCount: 5, productType: 'PLT' });
    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({ bagCount: 5, productType: 'PLT' });
  });

  it('should emit empty object on onApply when no filters set', () => {
    fixture.detectChanges();
    spyOn(component.apply, 'emit');

    component.onApply();

    expect(component.apply.emit).toHaveBeenCalledWith({});
  });

  it('should reset form on onClear', () => {
    fixture.detectChanges();
    component.filterForm.patchValue({ bagCount: 3 });

    component.onClear();

    expect(component.filterForm.get('bagCount')?.value).toBeFalsy();
    expect(component.filterForm.get('productType')?.value).toBeFalsy();
  });

  it('should emit close event on onClose', () => {
    fixture.detectChanges();
    spyOn(component.close, 'emit');
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should have bag count options from 1 to 15', () => {
    expect(component.bagCountOptions.length).toBe(15);
    expect(component.bagCountOptions[0]).toBe(1);
    expect(component.bagCountOptions[14]).toBe(15);
  });

  it('should report hasActiveFilters correctly', () => {
    fixture.detectChanges();
    expect(component.hasActiveFilters()).toBeFalse();

    component.filterForm.patchValue({ bagCount: 2 });
    expect(component.hasActiveFilters()).toBeTrue();
  });
});
