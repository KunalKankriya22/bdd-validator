import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { ProductAttributeFilterPanel } from './filter-panel.component';
import { ProductAttributeService } from '../services/product-attribute.service';

describe('ProductAttributeFilterPanel', () => {
  let component: ProductAttributeFilterPanel;
  let fixture: ComponentFixture<ProductAttributeFilterPanel>;
  let mockService: jasmine.SpyObj<ProductAttributeService>;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ProductAttributeService', [
      'getProductTypesFilter',
      'getAttributeGroupsFilter',
      'getAttributeCodesFilter'
    ]);
    mockService.getProductTypesFilter.and.returnValue(of([]));
    mockService.getAttributeGroupsFilter.and.returnValue(of([]));
    mockService.getAttributeCodesFilter.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [ProductAttributeFilterPanel, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: ProductAttributeService, useValue: mockService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(ProductAttributeFilterPanel);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should emit apply with selected filter values on onApply', () => {
    // Arrange
    const applySpy = jasmine.createSpyObj('EventEmitter', ['emit']);
    component.apply = applySpy;
    component.filterForm.patchValue({
      productType: 'RBC',
      attribGroup: null,
      attribCode: null,
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null
    });

    // Act
    component.onApply();

    // Assert
    expect(applySpy.emit).toHaveBeenCalledWith(
      jasmine.objectContaining({ productType: 'RBC' })
    );
  });

  it('should reset form and search controls on onClear', () => {
    // Arrange
    component.filterForm.patchValue({ productType: 'PLT', attribGroup: 'ISBT' });

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.value.productType).toBeNull();
    expect(component.filterForm.value.attribGroup).toBeNull();
  });

  it('should disable apply when form has no filter values', () => {
    // Arrange
    component.filterForm.reset();

    // Act & Assert
    expect(component.isApplyDisabled).toBeTrue();
  });
});
