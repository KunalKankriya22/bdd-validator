import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ContainerFilterPanel } from './container-filter-panel';
import { ContainerService } from '../../services/container.service';
import { ContainerIdDropdownDto } from '../../models/container.model';

describe('ContainerFilterPanel', () => {
  let component: ContainerFilterPanel;
  let fixture: ComponentFixture<ContainerFilterPanel>;
  let containerServiceSpy: jasmine.SpyObj<ContainerService>;

  const mockContainerIds: ContainerIdDropdownDto[] = [
    { code: 'CAT001', description: 'Catalog One' },
    { code: 'CAT002', description: 'Catalog Two' },
    { code: 'XCAT003', description: 'Extra Catalog Three' },
  ];

  beforeEach(async () => {
    containerServiceSpy = jasmine.createSpyObj('ContainerService', [
      'getFilterCatalogNumbers',
      'getContainers',
      'getProductTypes',
      'getContainerIds',
      'createContainer',
      'updateContainer',
    ]);
    containerServiceSpy.getFilterCatalogNumbers.and.returnValue(of(mockContainerIds));

    await TestBed.configureTestingModule({
      imports: [ContainerFilterPanel, ReactiveFormsModule],
      providers: [
        provideNoopAnimations(),
        { provide: ContainerService, useValue: containerServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContainerFilterPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the filter form with null values when no currentFilters provided', () => {
    // Arrange - component created with default null currentFilters

    // Act
    const formValues = component.filterForm.value;

    // Assert
    expect(formValues.catalogNumber).toBeNull();
    expect(formValues.showTerminated).toBeNull();
  });

  it('should initialize the filter form with currentFilters values when provided', async () => {
    // Arrange
    const filtersFixture = TestBed.createComponent(ContainerFilterPanel);
    const comp = filtersFixture.componentInstance;
    comp.currentFilters = { catalogNumber: 'CAT001', showTerminated: true };

    // Act
    filtersFixture.detectChanges();

    // Assert
    expect(comp.filterForm.value.catalogNumber).toBe('CAT001');
    expect(comp.filterForm.value.showTerminated).toBeTrue();
  });

  it('should load dropdown data from ContainerService on init', () => {
    // Arrange - already initialized in beforeEach

    // Act - ngOnInit already called via detectChanges

    // Assert
    expect(containerServiceSpy.getFilterCatalogNumbers).toHaveBeenCalledWith('');
    expect(component.containerIds).toEqual(mockContainerIds);
    expect(component.filteredContainerIds).toEqual(mockContainerIds);
  });

  it('should pass baseCatalogNo to getFilterCatalogNumbers', async () => {
    // Arrange
    containerServiceSpy.getFilterCatalogNumbers.calls.reset();
    const comp2Fixture = TestBed.createComponent(ContainerFilterPanel);
    const comp2 = comp2Fixture.componentInstance;
    comp2.baseCatalogNo = 'BASE-99';

    // Act
    comp2Fixture.detectChanges();

    // Assert
    expect(containerServiceSpy.getFilterCatalogNumbers).toHaveBeenCalledWith('BASE-99');
  });

  it('should set containerIds to empty arrays when getFilterCatalogNumbers errors', async () => {
    // Arrange
    containerServiceSpy.getFilterCatalogNumbers.and.returnValue(throwError(() => new Error('API error')));
    const errFixture = TestBed.createComponent(ContainerFilterPanel);
    const errComp = errFixture.componentInstance;

    // Act
    errFixture.detectChanges();

    // Assert
    expect(errComp.containerIds).toEqual([]);
    expect(errComp.filteredContainerIds).toEqual([]);
  });

  it('should filter containerIds by code when search value changes', () => {
    // Arrange - dropdown data loaded in beforeEach

    // Act
    component.containerIdSearchCtrl.setValue('CAT00');

    // Assert
    expect(component.filteredContainerIds.length).toBe(3);
  });

  it('should filter containerIds by description case-insensitively', () => {
    // Arrange - dropdown data loaded in beforeEach

    // Act
    component.containerIdSearchCtrl.setValue('extra');

    // Assert
    expect(component.filteredContainerIds.length).toBe(1);
    expect(component.filteredContainerIds[0].code).toBe('XCAT003');
  });

  it('should return all containerIds when search is cleared', () => {
    // Arrange
    component.containerIdSearchCtrl.setValue('extra');
    expect(component.filteredContainerIds.length).toBe(1);

    // Act
    component.containerIdSearchCtrl.setValue('');

    // Assert
    expect(component.filteredContainerIds.length).toBe(mockContainerIds.length);
  });

  it('should return true for isApplyDisabled when no filter value is selected', () => {
    // Arrange
    component.filterForm.patchValue({ catalogNumber: null, showTerminated: null });

    // Act
    const result = component.isApplyDisabled;

    // Assert
    expect(result).toBeTrue();
  });

  it('should return false for isApplyDisabled when catalogNumber is set', () => {
    // Arrange
    component.filterForm.patchValue({ catalogNumber: 'CAT001' });

    // Act
    const result = component.isApplyDisabled;

    // Assert
    expect(result).toBeFalse();
  });

  it('should return false for isApplyDisabled when showTerminated is set to false', () => {
    // Arrange
    component.filterForm.patchValue({ showTerminated: false });

    // Act
    const result = component.isApplyDisabled;

    // Assert
    expect(result).toBeFalse();
  });

  it('should emit apply event with filter values when onApply is called', () => {
    // Arrange
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({ catalogNumber: 'CAT001', showTerminated: true });

    // Act
    component.onApply();

    // Assert
    expect(component.apply.emit).toHaveBeenCalledWith({
      catalogNumber: 'CAT001',
      showTerminated: true,
    });
  });

  it('should emit apply with undefined values when form fields are empty', () => {
    // Arrange
    spyOn(component.apply, 'emit');
    component.filterForm.patchValue({ catalogNumber: null, showTerminated: null });

    // Act
    component.onApply();

    // Assert
    expect(component.apply.emit).toHaveBeenCalledWith({
      catalogNumber: undefined,
      showTerminated: undefined,
    });
  });

  it('should reset form values to null when onClear is called', () => {
    // Arrange
    component.filterForm.patchValue({ catalogNumber: 'CAT001', showTerminated: true });

    // Act
    component.onClear();

    // Assert
    expect(component.filterForm.value.catalogNumber).toBeNull();
    expect(component.filterForm.value.showTerminated).toBeNull();
  });

  it('should emit close event when onClose is called', () => {
    // Arrange
    spyOn(component.close, 'emit');

    // Act
    component.onClose();

    // Assert
    expect(component.close.emit).toHaveBeenCalled();
  });

  it('should have the correct showTerminatedOptions', () => {
    // Arrange & Act - options are defined as a class property

    // Assert
    expect(component.showTerminatedOptions).toEqual([
      { value: true, label: 'Yes' },
      { value: false, label: 'No' },
    ]);
  });
});
