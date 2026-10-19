import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { AddEditContainerComponent } from './add-edit-container';
import { ContainerDto, ProductTypeDropdownDto, ContainerIdDropdownDto } from '../../models/container.model';

describe('AddEditContainerComponent', () => {
  let component: AddEditContainerComponent;
  let fixture: ComponentFixture<AddEditContainerComponent>;

  const mockProductTypes: ProductTypeDropdownDto[] = [
    { code: 'RBC', description: 'Red Blood Cells' },
    { code: 'PLT', description: 'Platelets' },
    { code: 'FFP', description: 'Fresh Frozen Plasma' },
  ];

  const mockContainerIds: ContainerIdDropdownDto[] = [
    { code: '100', description: 'Container 100' },
    { code: '200', description: 'Container 200' },
  ];

  const mockContainerData: ContainerDto = {
    catalogNumber: '100ABC',
    containerId: '100',
    baseCatalogNo: 'ABC',
    inlineFilterFlag: 'Y',
    productType: 'RBC',
    subProdTypes: 'PLT,FFP',
    effDate: '2024-01-15',
    termDate: '2025-12-31',
    chapterId: 'TST',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEditContainerComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default mode to add', () => {
    // Arrange - component created in beforeEach

    // Act - inspect default

    // Assert
    expect(component.mode).toBe('add');
  });

  it('should return title as "Add New Container" when mode is add', () => {
    // Arrange
    component.mode = 'add';

    // Act
    const title = component.title;

    // Assert
    expect(title).toBe('Add New Container');
  });

  it('should return title as "Edit Container" when mode is edit', () => {
    // Arrange
    component.mode = 'edit';

    // Act
    const title = component.title;

    // Assert
    expect(title).toBe('Edit Container');
  });

  it('should initialize form with required controls in add mode', () => {
    // Arrange - form initialized in beforeEach (add mode by default)

    // Act - inspect form

    // Assert
    expect(component.form).toBeDefined();
    expect(component.form.get('containerId')).toBeTruthy();
    expect(component.form.get('ilfFlag')).toBeTruthy();
    expect(component.form.get('productType')).toBeTruthy();
    expect(component.form.get('otherProductTypes')).toBeTruthy();
    expect(component.form.get('effectiveDate')).toBeTruthy();
    expect(component.form.get('terminationDate')).toBeTruthy();
    expect(component.form.get('catalogNumber')).toBeTruthy();
  });

  it('should mark form as invalid when required fields are empty in add mode', () => {
    // Arrange - form is initialized with null values

    // Act
    const isValid = component.isFormValid;

    // Assert
    expect(isValid).toBeFalse();
    expect(component.form.valid).toBeFalse();
  });

  it('should have catalogNumber field disabled in add mode', () => {
    // Arrange - form initialized in add mode

    // Act
    const catalogControl = component.form.get('catalogNumber');

    // Assert
    expect(catalogControl?.disabled).toBeTrue();
  });

  it('should emit close event when onCancel is called', () => {
    // Arrange
    spyOn(component.close, 'emit');

    // Act
    component.onCancel();

    // Assert
    expect(component.close.emit).toHaveBeenCalledTimes(1);
  });

  it('should not emit save when form is invalid and onSubmit is called', () => {
    // Arrange
    spyOn(component.save, 'emit');
    spyOn(component.saveAndCreateAnother, 'emit');

    // Act
    component.onSubmit(false);

    // Assert
    expect(component.save.emit).not.toHaveBeenCalled();
    expect(component.saveAndCreateAnother.emit).not.toHaveBeenCalled();
  });

  it('should mark all fields as touched when onSubmit is called with invalid form', () => {
    // Arrange
    expect(component.form.get('containerId')?.touched).toBeFalse();

    // Act
    component.onSubmit(false);

    // Assert
    expect(component.form.get('containerId')?.touched).toBeTrue();
    expect(component.form.get('ilfFlag')?.touched).toBeTrue();
    expect(component.form.get('productType')?.touched).toBeTrue();
    expect(component.form.get('effectiveDate')?.touched).toBeTrue();
  });

  it('should set error message and reset submitting flag when setErrorMessage is called', () => {
    // Arrange
    component.isSubmitting = true;
    component.errorMessage = null;

    // Act
    component.setErrorMessage('Something went wrong');

    // Assert
    expect(component.errorMessage).toBe('Something went wrong');
    expect(component.isSubmitting).toBeFalse();
  });

  it('should reset form values and clear error state when resetForm is called', () => {
    // Arrange
    component.errorMessage = 'Previous error';
    component.isSubmitting = true;

    // Act
    component.resetForm();

    // Assert
    expect(component.form.get('containerId')?.value).toBeNull();
    expect(component.form.get('ilfFlag')?.value).toBeNull();
    expect(component.form.get('productType')?.value).toBe('');
    expect(component.form.get('otherProductTypes')?.value).toBe('');
    expect(component.form.get('effectiveDate')?.value).toBeNull();
    expect(component.form.get('terminationDate')?.value).toBeNull();
    expect(component.errorMessage).toBeNull();
    expect(component.isSubmitting).toBeFalse();
  });

  it('should update filteredProductTypes when productTypes input changes via ngOnChanges', () => {
    // Arrange
    component.productTypes = mockProductTypes;

    // Act
    component.ngOnChanges({
      productTypes: { currentValue: mockProductTypes, previousValue: [], firstChange: true, isFirstChange: () => true },
    });

    // Assert
    expect(component.filteredProductTypes).toEqual(mockProductTypes);
    expect(component.filteredProductTypes.length).toBe(3);
  });

  it('should initialize isSubmitting to false', () => {
    // Arrange - component created in beforeEach

    // Act - inspect default

    // Assert
    expect(component.isSubmitting).toBeFalse();
  });

  it('should initialize errorMessage to null', () => {
    // Arrange - component created in beforeEach

    // Act - inspect default

    // Assert
    expect(component.errorMessage).toBeNull();
  });
});
