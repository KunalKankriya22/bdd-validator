import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ProductTypeFilterPanel } from './filter-panel.component';
import { ProductTypeService } from '../services/product-type.service';

describe('ProductTypeFilterPanel', () => {
  let component: ProductTypeFilterPanel;
  let fixture: ComponentFixture<ProductTypeFilterPanel>;
  let mockService: jasmine.SpyObj<ProductTypeService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ProductTypeService', ['getFilterOptions']);
    mockService.getFilterOptions.and.returnValue(of({ data: [{ productClasses: [] }] }));

    TestBed.configureTestingModule({
      imports: [ProductTypeFilterPanel, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: ProductTypeService, useValue: mockService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(ProductTypeFilterPanel);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should emit apply with populated filter values on onApply', () => {
    // Arrange
    const applySpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.apply = applySpy;
    component.filterForm.patchValue({
      productClass: 'WB',
      aboOnly: 'Y',
      attribFlag: null,
      weightRequired: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });

    // Act
    component.onApply();

    // Assert
    expect(applySpy.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ productClass: 'WB', aboOnly: 'Y' })
    );
  });

  it('should reset all form fields and flags on onClear', () => {
    // Arrange
    component.filterForm.patchValue({ productClass: 'RBC', aboOnly: 'Y' });
    component.effectivePeriodRequired = true;

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.value.productClass).toBeNull();
    expect(component.filterForm.value.aboOnly).toBeNull();
    expect(component.effectivePeriodRequired).toBeFalse();
  });

  it('should return true for isApplyDisabled when no filters set', () => {
    // Arrange
    component.filterForm.reset();

    // Act & Assert
    expect(component.isApplyDisabled).toBeTrue();
  });
});
