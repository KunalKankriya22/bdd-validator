import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SpProductsTableComponent } from './sp-products-table.component';
import { SpProductModel, ProductType } from '../../models/sp-products-special-processes.model';
import { TableSortEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('SpProductsTableComponent', () => {
  let component: SpProductsTableComponent;
  let fixture: ComponentFixture<SpProductsTableComponent>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockProductType: ProductType = {
    code: 'DEGLY',
    description: 'Deglycerolization'
  };

  const mockProducts: SpProductModel[] = [
    {
      processCode: 'DEGLY',
      processDesc: 'Deglycerolization',
      productCode: 'E3102',
      productDesc: 'APHERESIS PLATELETS | A1234',
      attribGroup: 'VBD14',
      attribGroupDesc: 'VBD14 Group',
      attribCode: 'V001:4006',
      attribCodeDesc: 'APHERESIS PLATELETS | A1234',
      effDate: '2024-11-20',
      termDate: null,
      lastModifiedDate: null,
      programId: null
    },
    {
      processCode: 'DEGLY',
      processDesc: 'Deglycerolization',
      productCode: 'E0471',
      productDesc: 'Washed Red blood cells',
      attribGroup: '+',
      attribGroupDesc: '+',
      attribCode: '+02',
      attribCodeDesc: 'Washed Red blood cells',
      effDate: '2024-11-20',
      termDate: null,
      lastModifiedDate: null,
      programId: null
    }
  ];

  beforeAll(async () => {

    mockTranslateService = createMockTranslateService();



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [SpProductsTableComponent],
      providers: [
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(SpProductsTableComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {
    it('should initialize table config on products change', () => {
      // Arrange
      component.products = mockProducts;
      component.selectedProductType = mockProductType;

      // Act
      component.ngOnChanges({
        products: {
          currentValue: mockProducts,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Assert
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
      expect(component.tableConfig.rowActions).toBeDefined();
      expect(component.tableConfig.rowActions?.length).toBeGreaterThan(0);
    });

    it('should initialize table config on selectedProductType change', () => {
      // Arrange
      component.selectedProductType = mockProductType;

      // Act
      component.ngOnChanges({
        selectedProductType: {
          currentValue: mockProductType,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      // Assert
      expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    });
  });
  describe('Input Properties', () => {
    it('should accept products input', () => {
      // Arrange & Act
      component.products = mockProducts;

      // Assert
      expect(component.products).toEqual(mockProducts);
      expect(component.products.length).toBe(2);
    });

    it('should accept selectedProductType input', () => {
      // Arrange & Act
      component.selectedProductType = mockProductType;

      // Assert
      expect(component.selectedProductType).toEqual(mockProductType);
    });

    it('should accept isLoading input', () => {
      // Arrange & Act
      component.isLoading = true;

      // Assert
      expect(component.isLoading).toBe(true);
    });

  });
});
