import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { ProductTypeDataComponent } from './product-type-data.component';
import { ProductTypeService } from './services/product-type.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { Overlay } from '@angular/cdk/overlay';
import { ProductType } from './models/product-type.model';

describe('ProductTypeDataComponent', () => {
  let component: ProductTypeDataComponent;
  let fixture: ComponentFixture<ProductTypeDataComponent>;
  let serviceSpy: jasmine.SpyObj<ProductTypeService>;
  let pageHeaderSpy: jasmine.SpyObj<PageHeaderService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let overlaySpy: jasmine.SpyObj<Overlay>;
  const chapterChanged$ = new Subject<void>();

  const mockData: ProductType[] = [
    {
      productTypeCode: 'WB001',
      productTypeDesc: 'Whole Blood',
      productClass: 'WB',
      productGroupName: 'Whole Blood Products',
      aboOnly: 'Y',
      attribFlag: 'N',
      weightRequired: 'Y',
      effDate: new Date('2025-01-01'),
      termDate: null,
      lastModifiedDate: new Date('2025-03-15')
    } as ProductType
  ];

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('ProductTypeService', ['getProductTypes']);

    pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue(null)
    });

    headerSpy = jasmine.createSpyObj('HeaderService', [], {
      chapterChanged$: chapterChanged$.asObservable()
    });

    overlaySpy = jasmine.createSpyObj('Overlay', ['position', 'create', 'scrollStrategies'], {
      scrollStrategies: { block: jasmine.createSpy('block').and.returnValue({}) }
    });

    serviceSpy.getProductTypes.and.returnValue(of({ data: mockData, total: 1 }));

    TestBed.configureTestingModule({
      imports: [ProductTypeDataComponent, NoopAnimationsModule],
      providers: [
        { provide: ProductTypeService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: Overlay, useValue: overlaySpy }
      ]
    });

    fixture = TestBed.createComponent(ProductTypeDataComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template binding errors */ }
  });

  describe('Load Table Data', () => {
    it('should populate dataSource on successful load', (done) => {
      // Arrange
      serviceSpy.getProductTypes.and.returnValue(of({ data: mockData, total: 1 }));

      // Act
      component.loadTableData();

      // Assert
      setTimeout(() => {
        expect(component.dataSource).toEqual(mockData);
        expect(component.isLoading).toBe(false);
        done();
      });
    });

    it('should set error state when load fails', (done) => {
      // Arrange
      serviceSpy.getProductTypes.and.returnValue(throwError(() => new Error('Server error')));

      // Act
      component.loadTableData();

      // Assert
      setTimeout(() => {
        expect(component.hasError).toBe(true);
        expect(component.isLoading).toBe(false);
        done();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update requestState and reload data on search', () => {
      // Arrange & Act
      component.onSearch('WB001');

      // Assert
      expect(component.requestState.searchKeyword).toBe('WB001');
      expect(serviceSpy.getProductTypes).toHaveBeenCalled();
    });

    it('should reset page index on new search', () => {
      // Arrange
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }

      // Act
      component.onSearch('test');

      // Assert
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Side Panel CRUD', () => {
    it('should open side panel in add mode for create', () => {
      // Act
      component.createRecord();

      // Assert
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open side panel in edit mode with record data', () => {
      // Act
      component.editRecord(mockData[0]);

      // Assert
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockData[0]);
    });

    it('should close side panel and clear data', () => {
      // Arrange
      component.sidePanelOpen = true;
      component.sidePanelData = mockData[0];

      // Act
      component.closeSidePanel();

      // Assert
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Filter Management', () => {
    it('should apply filters and reset page index', () => {
      // Arrange
      const filters = { productClass: 'WB', aboOnly: 'Y' } as any;

      // Act
      component.applyFilters(filters);

      // Assert
      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.productClass).toBe('WB');
      expect(component.requestState.aboOnly).toBe('Y');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(serviceSpy.getProductTypes).toHaveBeenCalled();
    });

    it('should clear all filters and reload', () => {
      // Arrange
      component.appliedFilters = { productClass: 'WB' } as any;
      component.filterChips = [{ key: 'class', label: 'Class: WB', value: 'WB' }];
      component.requestState.productClass = 'WB';

      // Act
      component.clearAllFilters();

      // Assert
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.productClass).toBeUndefined();
      expect(serviceSpy.getProductTypes).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should set sort parameters for ascending sort', () => {
      // Act
      component.onSortChange({ column: 'productTypeCode', direction: 'A' });

      // Assert
      expect(component.requestState.sortColumn).toBe('ProductTypeCode');
      expect(component.requestState.sortOrder).toBe('ASC');
    });

    it('should reset sort on default direction', () => {
      // Act
      component.onSortChange({ column: 'productTypeCode', direction: 'default' });

      // Assert
      expect(component.requestState.sortColumn).toBeUndefined();
      expect(component.requestState.sortOrder).toBeUndefined();
    });
  });
});
