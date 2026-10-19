import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';

import { PagqComponent } from './pagq.component';
import { ProductsWithAntigensService } from './services/products-with-antigens.service';
import { LoggingService } from '@shared/services/logging.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockPageHeaderService, createMockHeaderService } from '@shared/testing/common-mocks';
import {
  ProductAntigenSearchRequest,
  ProductAntigenSearchResponse,
  ProductAntigenSearchResult
} from './models/products-with-antigens.models';

describe('PagqComponent', () => {
  let component: PagqComponent;
  let fixture: ComponentFixture<PagqComponent>;
  let serviceSpy: jasmine.SpyObj<ProductsWithAntigensService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockSearchRequest: ProductAntigenSearchRequest = {
    productType: 'RBC',
    take: 25,
    skip: 0
  };

  const mockSearchResponse: ProductAntigenSearchResponse = {
    results: [
      {
        unitId: 'UNIT001',
        checkDigit: 'A',
        productCode: 'RBC',
        aboRhType: 'O POS',
        expirationDate: '2026-06-30T00:00:00',
        warehouseId: 'H',
        antigenProfile: []
      }
    ],
    totalCount: 1,
    pageSize: 25,
    offset: 0
  };

  const mockRow: ProductAntigenSearchResult = {
    unitId: 'UNIT001',
    checkDigit: 'A',
    productCode: 'RBC',
    aboRhType: 'O POS',
    expirationDate: '2026-06-30T00:00:00',
    warehouseId: 'H',
    antigenProfile: []
  };

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('ProductsWithAntigensService', [
      'searchProducts',
      'getProductTypes',
      'getAboRhTypes',
      'getInventoryClasses',
      'getAntigenGroups',
      'getWarehouses',
      'getValidAntigens',
      'getAntigenGroupDetail'
    ]);
    serviceSpy.getProductTypes.and.returnValue(of([]));
    serviceSpy.getAboRhTypes.and.returnValue(of([]));
    serviceSpy.getInventoryClasses.and.returnValue(of([]));
    serviceSpy.getAntigenGroups.and.returnValue(of([]));
    serviceSpy.getWarehouses.and.returnValue(of([]));
    serviceSpy.getValidAntigens.and.returnValue(of([]));

    loggingServiceSpy = jasmine.createSpyObj('LoggingService', ['log', 'error']);
    pageHeaderServiceSpy = createMockPageHeaderService();
    pageHeaderServiceSpy.pageHeaderData.and.returnValue(undefined);
    pageHeaderServiceSpy.getTitle.and.returnValue('Products with Antigens');
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);

    TestBed.configureTestingModule({
      imports: [PagqComponent, NoopAnimationsModule],
      providers: [
        { provide: ProductsWithAntigensService, useValue: serviceSpy },
        { provide: LoggingService, useValue: loggingServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: createMockHeaderService() }
      ]
    });

    serviceSpy.searchProducts.calls.reset();
    serviceSpy.getProductTypes.calls.reset();
    serviceSpy.getAboRhTypes.calls.reset();
    serviceSpy.getInventoryClasses.calls.reset();
    serviceSpy.getAntigenGroups.calls.reset();
    serviceSpy.getWarehouses.calls.reset();
    serviceSpy.getValidAntigens.calls.reset();
    serviceSpy.getAntigenGroupDetail.calls.reset();
    loggingServiceSpy.log.calls.reset();
    loggingServiceSpy.error.calls.reset();
    serviceSpy.getProductTypes.and.returnValue(of([]));
    serviceSpy.getAboRhTypes.and.returnValue(of([]));
    serviceSpy.getInventoryClasses.and.returnValue(of([]));
    serviceSpy.getAntigenGroups.and.returnValue(of([]));
    serviceSpy.getWarehouses.and.returnValue(of([]));
    serviceSpy.getValidAntigens.and.returnValue(of([]));
    pageHeaderServiceSpy.pageHeaderData.and.returnValue(undefined);
    pageHeaderServiceSpy.getTitle.and.returnValue('Products with Antigens');
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);

    fixture = TestBed.createComponent(PagqComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should have correct displayed columns', () => {
      expect(component.displayedColumns).toEqual([
        'unitId', 'productCode', 'aboRhType', 'expirationDate', 'warehouseId'
      ]);
    });

    it('should have default header config', () => {
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThanOrEqual(1);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    });

    it('should generate unique element IDs', () => {
      const id = component['elementId']('test');
      expect(id).toContain('pagq-');
      expect(id).toContain('-test');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      serviceSpy.searchProducts.and.returnValue(of(mockSearchResponse));
      fixture.detectChanges();
    });

    it('should set hasSearched to true after search', fakeAsync(() => {
      expect(component['hasSearched']()).toBeFalse();
      component.onSearch(mockSearchRequest);
      tick();

      expect(component['hasSearched']()).toBeTrue();
    }));

    it('should log successful search', fakeAsync(() => {
      component.onSearch(mockSearchRequest);
      tick();

      expect(loggingServiceSpy.log).toHaveBeenCalledWith(
        'Products with Antigens search completed',
        jasmine.any(Object)
      );
    }));

    it('should set results from search response', fakeAsync(() => {
      component.onSearch(mockSearchRequest);
      tick();

      expect(component['results']().length).toBe(1);
      expect(component['totalCount']()).toBe(1);
      expect(component['loading']()).toBeFalse();
    }));

    it('should reset page index on new search', fakeAsync(() => {
      component['pageIndex'].set(3);
      component.onSearch(mockSearchRequest);
      tick();

      expect(component['pageIndex']()).toBe(0);
    }));

    it('should handle null results in response', fakeAsync(() => {
      serviceSpy.searchProducts.and.returnValue(of({
        results: null as any,
        totalCount: 0,
        pageSize: 25,
        offset: 0
      }));

      component.onSearch(mockSearchRequest);
      tick();

      expect(component['results']()).toEqual([]);
    }));

    it('should handle null totalCount in response', fakeAsync(() => {
      serviceSpy.searchProducts.and.returnValue(of({
        results: [],
        totalCount: null as any,
        pageSize: 25,
        offset: 0
      }));

      component.onSearch(mockSearchRequest);
      tick();

      expect(component['totalCount']()).toBe(0);
    }));

    it('should clear selectedRow when executing search', fakeAsync(() => {
      component['selectedRow'].set(mockRow);
      component.onSearch(mockSearchRequest);
      tick();

      expect(component['selectedRow']()).toBeNull();
    }));
  });

  describe('Error Handling', () => {
    it('should map API error codes to user-friendly messages', () => {
      const errorCases = [
        { code: '0322', expected: 'Invalid product type selected.' },
        { code: '0300', expected: 'Invalid blood type for the current chapter.' },
        { code: '5307', expected: 'Invalid inventory class selected.' },
        { code: '2201', expected: 'Duplicate antigen specified. Each antigen can only appear once.' },
        { code: '5340', expected: 'At least one antigen must be specified in the search criteria.' },
        { code: '1105', expected: 'Invalid antigen group selected.' },
        { code: '0350', expected: 'Invalid warehouse ID selected.' },
        { code: '0320', expected: 'Invalid antigen ID selected.' },
        { code: '1316', expected: 'Antigen result must be either Positive (P) or Negative (N).' },
        { code: '5200', expected: 'Result is required for each antigen entered.' }
      ];

      errorCases.forEach(({ code, expected }) => {
        const error = { error: { errorCode: code } };
        const message = component['getErrorMessage'](error);
        expect(message).toBe(expected);
      });
    });

    it('should return generic error message for unknown error codes', () => {
      const error = { message: 'Unknown error' };
      const message = component['getErrorMessage'](error);
      expect(message).toBe('Unknown error');
    });

    it('should return default error message when no message provided', () => {
      const error = {};
      const message = component['getErrorMessage'](error);
      expect(message).toBe('An error occurred while searching. Please try again.');
    });

    it('should use error.error.message when errorCode is unknown', () => {
      const error = { error: { errorCode: '9999', message: 'Custom API error' } };
      const message = component['getErrorMessage'](error);
      expect(message).toBe('Custom API error');
    });

    it('should use root errorCode when error.error.errorCode is not present', () => {
      const error = { errorCode: '0322' };
      const message = component['getErrorMessage'](error);
      expect(message).toBe('Invalid product type selected.');
    });

    it('should set error signal on search failure', fakeAsync(() => {
      const apiError = { error: { errorCode: '0322' } };
      serviceSpy.searchProducts.and.returnValue(throwError(() => apiError));
      fixture.detectChanges();

      component.onSearch(mockSearchRequest);
      tick();

      expect(component['error']()).toBe('Invalid product type selected.');
      expect(component['results']()).toEqual([]);
      expect(component['totalCount']()).toBe(0);
      expect(component['loading']()).toBeFalse();
    }));

    it('should log error on search failure', fakeAsync(() => {
      const apiError = new Error('Server error');
      serviceSpy.searchProducts.and.returnValue(throwError(() => apiError));
      fixture.detectChanges();

      component.onSearch(mockSearchRequest);
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith(
        'Error searching products with antigens',
        apiError
      );
    }));
  });

  describe('Clear Functionality', () => {
    beforeEach(() => {
      serviceSpy.searchProducts.and.returnValue(of(mockSearchResponse));
      fixture.detectChanges();
    });

    it('should clear all results and reset state', fakeAsync(() => {
      component.onSearch(mockSearchRequest);
      tick();

      expect(component['results']().length).toBe(1);

      component.onClear();

      expect(component['results']()).toEqual([]);
      expect(component['totalCount']()).toBe(0);
      expect(component['pageIndex']()).toBe(0);
      expect(component['error']()).toBeNull();
      expect(component['hasSearched']()).toBeFalse();
      expect(component['selectedRow']()).toBeNull();
    }));

    it('should set currentSearchRequest to null', () => {
      component.onClear();
      expect(component['currentSearchRequest']).toBeNull();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      serviceSpy.searchProducts.and.returnValue(of(mockSearchResponse));
      fixture.detectChanges();
    });

    it('should handle page change event', fakeAsync(() => {
      component.onSearch(mockSearchRequest);
      tick();
      serviceSpy.searchProducts.calls.reset();

      const pageEvent: PageEvent = { pageIndex: 1, pageSize: 50, length: 100 };
      component.onPageChange(pageEvent);
      tick();

      expect(component['pageSize']()).toBe(50);
      expect(component['pageIndex']()).toBe(1);
      expect(serviceSpy.searchProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          take: 50,
          skip: 50
        })
      );
    }));

    it('should do nothing on page change if no current search request', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 25, length: 0 });
      expect(serviceSpy.searchProducts).not.toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      serviceSpy.searchProducts.and.returnValue(of(mockSearchResponse));
      fixture.detectChanges();
    });

    it('should handle sort change event', fakeAsync(() => {
      component.onSearch(mockSearchRequest);
      tick();

      const sortEvent: Sort = {
        active: 'unitId',
        direction: 'asc'
      };

      component.onSortChange(sortEvent);
      tick();

      expect(serviceSpy.searchProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortColumn: 'unitId',
          sortOrder: 'ASC'
        })
      );
    }));

    it('should reset page index when sorting', fakeAsync(() => {
      component.onSearch(mockSearchRequest);
      tick();

      component['pageIndex'].set(2);

      const sortEvent: Sort = {
        active: 'productCode',
        direction: 'desc'
      };

      component.onSortChange(sortEvent);
      tick();

      expect(component['pageIndex']()).toBe(0);
    }));

    it('should set sortColumn to null and sortOrder to null when direction is empty', fakeAsync(() => {
      component.onSearch(mockSearchRequest);
      tick();

      const sortEvent: Sort = { active: 'unitId', direction: '' };
      component.onSortChange(sortEvent);
      tick();

      expect(serviceSpy.searchProducts).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortOrder: null
        })
      );
    }));

    it('should do nothing on sort change if no current search request', () => {
      const sortEvent: Sort = { active: 'unitId', direction: 'asc' };
      component.onSortChange(sortEvent);
      expect(serviceSpy.searchProducts).not.toHaveBeenCalled();
    });
  });

  describe('Row Selection', () => {
    it('should select row on click', () => {
      component.onRowSelect(mockRow);
      expect(component.isSelected(mockRow)).toBeTrue();
    });

    it('should deselect row when clicking same row again', () => {
      component.onRowSelect(mockRow);
      component.onRowSelect(mockRow);
      expect(component.isSelected(mockRow)).toBeFalse();
    });

    it('should select different row when clicking another row', () => {
      const anotherRow: ProductAntigenSearchResult = {
        ...mockRow,
        unitId: 'UNIT002'
      };

      component.onRowSelect(mockRow);
      component.onRowSelect(anotherRow);

      expect(component.isSelected(mockRow)).toBeFalse();
      expect(component.isSelected(anotherRow)).toBeTrue();
    });

    it('should return false for isSelected when no row selected', () => {
      expect(component.isSelected(mockRow)).toBeFalse();
    });
  });

  describe('Antigen Result Label', () => {
    it('should return Positive for P', () => {
      expect(component.getAntigenResultLabel('P')).toBe('Positive');
    });

    it('should return Positive for POSITIVE', () => {
      expect(component.getAntigenResultLabel('POSITIVE')).toBe('Positive');
    });

    it('should return Negative for N', () => {
      expect(component.getAntigenResultLabel('N')).toBe('Negative');
    });

    it('should return Negative for NEGATIVE', () => {
      expect(component.getAntigenResultLabel('NEGATIVE')).toBe('Negative');
    });

    it('should return Reactive for R', () => {
      expect(component.getAntigenResultLabel('R')).toBe('Reactive');
    });

    it('should return Reactive for REACTIVE', () => {
      expect(component.getAntigenResultLabel('REACTIVE')).toBe('Reactive');
    });

    it('should return Not Tested for NT', () => {
      expect(component.getAntigenResultLabel('NT')).toBe('Not Tested');
    });

    it('should return original value for unknown', () => {
      expect(component.getAntigenResultLabel('X')).toBe('X');
    });

    it('should return dash for empty string', () => {
      expect(component.getAntigenResultLabel('')).toBe('-');
    });
  });

  describe('Lifecycle', () => {
    it('should clean up on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
