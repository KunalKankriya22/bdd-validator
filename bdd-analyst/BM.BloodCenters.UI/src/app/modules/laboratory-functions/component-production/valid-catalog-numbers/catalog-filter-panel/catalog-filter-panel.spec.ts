import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { SimpleChange } from '@angular/core';
import { CatalogFilterPanel } from './catalog-filter-panel';
import { CatalogNumberDropdownDto, ManufacturerDropdownDto, ValidCatalogFilterValue } from '../models/valid-catalog-numbers.model';

describe('CatalogFilterPanel', () => {
  let component: CatalogFilterPanel;
  let fixture: ComponentFixture<CatalogFilterPanel>;

  const mockCatalogNumbers: CatalogNumberDropdownDto[] = [
    { code: 'CAT001', description: 'Catalog One' },
    { code: 'CAT002', description: 'Catalog Two' },
    { code: 'CAT003', description: 'Catalog Three' },
  ];

  const mockManufacturers: ManufacturerDropdownDto[] = [
    { code: 'MFR001', description: 'Manufacturer Alpha' },
    { code: 'MFR002', description: 'Manufacturer Beta' },
    { code: '', description: 'No Code Manufacturer' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogFilterPanel, ReactiveFormsModule],
      providers: [provideHttpClient(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize filterForm with null default values on init', () => {
    // Arrange - component already initialized in beforeEach

    // Act - inspect form state

    // Assert
    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('catalogNumber')?.value).toBeNull();
    expect(component.filterForm.get('manufacturerCode')?.value).toBeNull();
    expect(component.filterForm.get('showTerminated')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.filterForm.get('termDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('termDate')?.value).toBeNull();
  });

  it('should initialize filterForm with currentFilters when provided', () => {
    // Arrange
    const filters: ValidCatalogFilterValue = {
      catalogNumber: 'CAT001',
      manufacturerCode: 'MFR001',
      showTerminated: true,
      effDatePeriod: 'after',
      effDate: '2024-06-01T00:00:00Z',
      termDatePeriod: 'before',
      termDate: '2024-12-31T00:00:00Z',
    };

    // Act
    const freshFixture = TestBed.createComponent(CatalogFilterPanel);
    const freshComponent = freshFixture.componentInstance;
    freshComponent.currentFilters = filters;
    freshFixture.detectChanges();

    // Assert
    expect(freshComponent.filterForm.get('catalogNumber')?.value).toBe('CAT001');
    expect(freshComponent.filterForm.get('manufacturerCode')?.value).toBe('MFR001');
    expect(freshComponent.filterForm.get('showTerminated')?.value).toBe(true);
    expect(freshComponent.filterForm.get('effDatePeriod')?.value).toBe('after');
    expect(freshComponent.filterForm.get('termDatePeriod')?.value).toBe('before');
  });

  it('should return isApplyDisabled true when no filter values are set', () => {
    // Arrange - form is empty by default

    // Act
    const disabled = component.isApplyDisabled;

    // Assert
    expect(disabled).toBeTrue();
  });

  it('should return isApplyDisabled false when catalogNumber is set', () => {
    // Arrange
    component.filterForm.patchValue({ catalogNumber: 'CAT001' });

    // Act
    const disabled = component.isApplyDisabled;

    // Assert
    expect(disabled).toBeFalse();
  });

  it('should return isApplyDisabled false when manufacturerCode is set', () => {
    // Arrange
    component.filterForm.patchValue({ manufacturerCode: 'MFR001' });

    // Act
    const disabled = component.isApplyDisabled;

    // Assert
    expect(disabled).toBeFalse();
  });

  it('should return isApplyDisabled false when showTerminated is set', () => {
    // Arrange
    component.filterForm.patchValue({ showTerminated: false });

    // Act
    const disabled = component.isApplyDisabled;

    // Assert
    expect(disabled).toBeFalse();
  });

  it('should return isApplyDisabled true when effectivePeriodRequired flag is set', () => {
    // Arrange
    component.filterForm.patchValue({ catalogNumber: 'CAT001' });
    component.effectivePeriodRequired = true;

    // Act
    const disabled = component.isApplyDisabled;

    // Assert
    expect(disabled).toBeTrue();
  });

  it('should set effectivePeriodRequired when date is set but period is not', () => {
    // Arrange
    component.filterForm.patchValue({ effDate: new Date('2024-06-01'), effDatePeriod: null });

    // Act
    component.validateEffectivePeriod();

    // Assert
    expect(component.effectivePeriodRequired).toBeTrue();
    expect(component.effectiveDateRequired).toBeFalse();
  });

  it('should set effectiveDateRequired when period is set but date is not', () => {
    // Arrange
    component.filterForm.patchValue({ effDatePeriod: 'after', effDate: null });

    // Act
    component.validateEffectivePeriod();

    // Assert
    expect(component.effectiveDateRequired).toBeTrue();
    expect(component.effectivePeriodRequired).toBeFalse();
  });

  it('should clear both effective flags when both date and period are set', () => {
    // Arrange
    component.filterForm.patchValue({ effDate: new Date('2024-06-01'), effDatePeriod: 'after' });

    // Act
    component.validateEffectivePeriod();

    // Assert
    expect(component.effectivePeriodRequired).toBeFalse();
    expect(component.effectiveDateRequired).toBeFalse();
  });

  it('should set terminationPeriodRequired when term date is set but period is not', () => {
    // Arrange
    component.filterForm.patchValue({ termDate: new Date('2024-12-31'), termDatePeriod: null });

    // Act
    component.validateTerminationPeriod();

    // Assert
    expect(component.terminationPeriodRequired).toBeTrue();
    expect(component.terminationDateRequired).toBeFalse();
  });

  it('should set terminationDateRequired when term period is set but date is not', () => {
    // Arrange
    component.filterForm.patchValue({ termDatePeriod: 'before', termDate: null });

    // Act
    component.validateTerminationPeriod();

    // Assert
    expect(component.terminationDateRequired).toBeTrue();
    expect(component.terminationPeriodRequired).toBeFalse();
  });

  it('should emit apply event with filter values when onApply is called', () => {
    // Arrange
    component.manufacturers = mockManufacturers;
    component.filterForm.patchValue({ catalogNumber: 'CAT001', manufacturerCode: null, showTerminated: true });
    spyOn(component.apply, 'emit');

    // Act
    component.onApply();

    // Assert
    expect(component.apply.emit).toHaveBeenCalledTimes(1);
    const emittedValue = (component.apply.emit as jasmine.Spy).calls.mostRecent().args[0] as ValidCatalogFilterValue;
    expect(emittedValue.catalogNumber).toBe('CAT001');
    expect(emittedValue.showTerminated).toBe(true);
  });

  it('should reset form and all flags when onClear is called', () => {
    // Arrange
    component.filterForm.patchValue({
      catalogNumber: 'CAT001',
      manufacturerCode: 'MFR001',
      showTerminated: true,
      effDatePeriod: 'after',
      effDate: new Date(),
    });
    component.effectivePeriodRequired = true;
    component.terminationPeriodRequired = true;
    component.effectiveDateRequired = true;
    component.terminationDateRequired = true;

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.get('catalogNumber')?.value).toBeNull();
    expect(component.filterForm.get('manufacturerCode')?.value).toBeNull();
    expect(component.filterForm.get('showTerminated')?.value).toBeNull();
    expect(component.filterForm.get('effDatePeriod')?.value).toBeNull();
    expect(component.filterForm.get('effDate')?.value).toBeNull();
    expect(component.effectivePeriodRequired).toBeFalse();
    expect(component.terminationPeriodRequired).toBeFalse();
    expect(component.effectiveDateRequired).toBeFalse();
    expect(component.terminationDateRequired).toBeFalse();
  });

  it('should emit close event when onClose is called', () => {
    // Arrange
    spyOn(component.close, 'emit');

    // Act
    component.onClose();

    // Assert
    expect(component.close.emit).toHaveBeenCalledTimes(1);
  });

  it('should update filteredCatalogNumbers when catalogNumbers input changes via ngOnChanges', () => {
    // Arrange
    component.catalogNumbers = mockCatalogNumbers;

    // Act
    component.ngOnChanges({
      catalogNumbers: new SimpleChange([], mockCatalogNumbers, true),
    });

    // Assert
    expect(component.filteredCatalogNumbers).toEqual(mockCatalogNumbers);
    expect(component.filteredCatalogNumbers.length).toBe(3);
  });

  it('should update filteredManufacturers when manufacturers input changes via ngOnChanges', () => {
    // Arrange
    component.manufacturers = mockManufacturers;

    // Act
    component.ngOnChanges({
      manufacturers: new SimpleChange([], mockManufacturers, true),
    });

    // Assert
    expect(component.filteredManufacturers).toEqual(mockManufacturers);
    expect(component.filteredManufacturers.length).toBe(3);
  });
});
