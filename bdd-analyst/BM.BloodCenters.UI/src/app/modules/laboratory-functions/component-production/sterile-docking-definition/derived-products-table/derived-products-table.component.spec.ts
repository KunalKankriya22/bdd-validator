import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DerivedProductsTableComponent } from './derived-products-table.component';
import { DerivedProductDto } from '../models/sterile-docking-definition.model';

describe('DerivedProductsTableComponent', () => {
  let component: DerivedProductsTableComponent;
  let fixture: ComponentFixture<DerivedProductsTableComponent>;

  const mockProducts: DerivedProductDto[] = [
    {
      id: '1',
      unitId: 'W1234-18-031310-Z',
      originalProductCode: 'E0385V00',
      derivedProduct: 'E0701V00',
      shortName: 'RBC',
      weldOk: 'Y',
      verifyProduct: 'N'
    },
    {
      id: '2',
      unitId: 'W1234-18-031304-Z',
      originalProductCode: 'E0385V00',
      derivedProduct: 'E0701V00',
      shortName: 'RBC',
      weldOk: 'N',
      verifyProduct: 'Y'
    },
    {
      id: '3',
      unitId: 'W1234-18-031305-Z',
      originalProductCode: 'E0701V00',
      derivedProduct: 'E0385V00',
      shortName: 'PLT',
      weldOk: 'Y',
      verifyProduct: 'Y'
    }
  ];

  beforeAll(async () => {



      await TestBed.configureTestingModule({


        teardown: { destroyAfterEach: false },
      imports: [
        DerivedProductsTableComponent,
        MatTableModule,
        MatSortModule,
        MatIconModule]
    }).compileComponents();


    });



  beforeEach(() => {



    fixture = TestBed.createComponent(DerivedProductsTableComponent);
    component = fixture.componentInstance;


    });

  describe('Table Initialization', () => {
    it('should display all column headers', () => {
      component.products = mockProducts;
      fixture.detectChanges();

      const headers = fixture.nativeElement.querySelectorAll('th');
      expect(headers.length).toBe(6);
      expect(headers[0].textContent.trim()).toContain('Unit ID');
      expect(headers[1].textContent.trim()).toContain('Original Product Code');
      expect(headers[2].textContent.trim()).toContain('Derived Product');
      expect(headers[3].textContent.trim()).toContain('Short Name');
      expect(headers[4].textContent.trim()).toContain('Weld OK');
      expect(headers[5].textContent.trim()).toContain('Verify Product');
    });


    it('should display product data correctly', () => {
      component.products = [mockProducts[0]];
      component.ngOnChanges({
        products: {
          currentValue: [mockProducts[0]],
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      fixture.detectChanges();

      const cells = fixture.nativeElement.querySelectorAll('td');
      expect(cells[0].textContent.trim()).toBe('W1234-18-031310-Z');
      expect(cells[1].textContent.trim()).toBe('E0385V00');
      expect(cells[2].textContent.trim()).toBe('E0701V00');
      expect(cells[3].textContent.trim()).toBe('RBC');
      expect(cells[4].textContent.trim()).toBe('Yes');
      expect(cells[5].textContent.trim()).toBe('No');
    });

    it('should display section title with count badge', () => {
      component.products = mockProducts;
      fixture.detectChanges();

      const title = fixture.nativeElement.querySelector('.section-title');
      expect(title.textContent).toContain('Derived Product');
      const badge = fixture.nativeElement.querySelector('.count-badge');
      expect(badge).toBeTruthy();
      expect(badge.textContent.trim()).toBe('3');
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no products', () => {
      component.products = [];
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState.textContent).toContain('No derived products yet');
      expect(emptyState.textContent).toContain('Add units to see results');
    });

  });

  describe('New Row Highlight', () => {
    it('should mark new rows for highlight', () => {
      component.products = [mockProducts[0]];
      component.ngOnChanges({
        products: {
          currentValue: [mockProducts[0]],
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.isNewRow(mockProducts[0])).toBe(true);
    });

    it('should not mark existing rows as new', () => {
      component.products = [mockProducts[0]];
      component.ngOnChanges({
        products: {
          currentValue: [mockProducts[0]],
          previousValue: [mockProducts[0]],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.isNewRow(mockProducts[0])).toBe(false);
    });


    it('should only highlight newly added rows when list grows', () => {
      component.products = [mockProducts[0]];
      component.ngOnChanges({
        products: {
          currentValue: [mockProducts[0]],
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      });

      component.products = [mockProducts[0], mockProducts[1]];
      component.ngOnChanges({
        products: {
          currentValue: [mockProducts[0], mockProducts[1]],
          previousValue: [mockProducts[0]],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.isNewRow(mockProducts[1])).toBe(true);
    });
  });


  describe('Y/N Formatting', () => {
    it('should format Y as Yes', () => {
      expect(component.formatYesNo('Y')).toBe('Yes');
    });

    it('should format N as No', () => {
      expect(component.formatYesNo('N')).toBe('No');
    });

    it('should return No for unexpected values', () => {
      expect(component.formatYesNo('X' as any)).toBe('No');
    });
  });

  describe('Product Updates', () => {

    it('should re-sort when products change', () => {
      component.currentSort = { active: 'unitId', direction: 'asc' };
      component.products = mockProducts;

      component.ngOnChanges({
        products: {
          currentValue: mockProducts,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.sortedProducts[0].unitId).toBe('W1234-18-031304-Z');
    });

  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset: DerivedProductDto[] = [];
      for (let i = 0; i < 1000; i++) {
        largeDataset.push({
          id: `${i}`,
          unitId: `UNIT${i}`,
          originalProductCode: `PROD${i}`,
          derivedProduct: `DERV${i}`,
          shortName: `SN${i}`,
          weldOk: i % 2 === 0 ? 'Y' : 'N',
          verifyProduct: i % 2 === 0 ? 'N' : 'Y'
        });
      }

      const startTime = performance.now();
      component.products = largeDataset;
      component.ngOnChanges({
        products: {
          currentValue: largeDataset,
          previousValue: [],
          firstChange: false,
          isFirstChange: () => false
        }
      });
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100);
      expect(component.sortedProducts.length).toBe(1000);
    });
  });
});
