import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpProductListComponent } from './sp-product-list.component';
import { ProductType } from '../../models/sp-products-special-processes.model';

describe('SpProductListComponent', () => {
  let component: SpProductListComponent;
  let fixture: ComponentFixture<SpProductListComponent>;

  const mockProductTypes: ProductType[] = [
    { code: 'DEGLY', description: 'Deglycerolization' },
    { code: 'FROZ', description: 'Freezing' },
    { code: 'REJUV', description: 'Rejuvenation' }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpProductListComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SpProductListComponent);
    component = fixture.componentInstance;
  });

  describe('Product Type Selection', () => {

    it('should identify selected product type correctly', () => {
      // Arrange
      component.selectedProductTypeCode = 'DEGLY';

      // Act
      const isSelected = component.isSelected(mockProductTypes[0]);

      // Assert
      expect(isSelected).toBe(true);
    });

    it('should return false for non-selected product type', () => {
      // Arrange
      component.selectedProductTypeCode = 'DEGLY';

      // Act
      const isSelected = component.isSelected(mockProductTypes[1]);

      // Assert
      expect(isSelected).toBe(false);
    });

    it('should return false when no product type is selected', () => {
      // Arrange
      component.selectedProductTypeCode = null;

      // Act
      const isSelected = component.isSelected(mockProductTypes[0]);

      // Assert
      expect(isSelected).toBe(false);
    });
  });
  describe('Input/Output Properties', () => {
    it('should accept productTypes input', () => {
      // Arrange & Act
      component.productTypes = mockProductTypes;

      // Assert
      expect(component.productTypes).toEqual(mockProductTypes);
      expect(component.productTypes.length).toBe(3);
    });

    it('should accept selectedProductTypeCode input', () => {
      // Arrange & Act
      component.selectedProductTypeCode = 'DEGLY';

      // Assert
      expect(component.selectedProductTypeCode).toBe('DEGLY');
    });

    it('should accept isLoading input', () => {
      // Arrange & Act
      component.isLoading = true;

      // Assert
      expect(component.isLoading).toBe(true);
    });
  });
});
