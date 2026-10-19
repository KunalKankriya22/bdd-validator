import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BoxDetailsViewComponent } from './box-details-view';
import { BoxDetailsService } from '../services/box-details.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { BoxDetails } from '../models/box-details.model';
import {
  createMockSnackbarService,
  createMockHeaderService,
} from '@shared/testing/common-mocks';

const mockBoxDetails: BoxDetails = {
  boxId: 'BOX001',
  chapterId: 'CH01',
  boxType: 'DRY',
  boxTypeDescription: 'Dry Ice',
  boxStatus: 'O',
  boxStatusDescription: 'Open',
  packedBy: 'USER1',
  packedDate: '2026-01-01T00:00:00Z',
  temperature: 4,
  minTemp: 2,
  maxTemp: 8,
  shipmentNo: 'SHIP001',
  customerId: 'CUST01',
  customerName: 'Test Hospital',
  consigneeId: 'CONS01',
  consigneeName: 'Test Consignee',
  warehouseId: 'WH01',
  creationDate: '2026-01-01T00:00:00Z',
  closedDate: null,
  productGrouping: null,
  productGroupingDescription: null,
  mfgProductType: null,
  mfgProductVolume: null,
  products: [
    {
      unitId: 'U001',
      collectionDate: '2026-01-15',
      productCode: 'P001',
      aliquot: 'A',
      productType: 'RBC',
      bloodType: 'O+',
      bloodTypeDescription: 'O Positive',
      checkDigit: '5',
      productStatus: 'PK',
      expirationDate: '2026-06-01T00:00:00Z',
      qcFlag: null,
      qcDate: null,
      inspectedBy: null,
      pickSlipId: 'PS001',
      tier: null,
      productPrice: null,
      itemNo: null,
      workOrderNo: null,
    },
  ],
};

describe('BoxDetailsViewComponent', () => {
  let component: BoxDetailsViewComponent;
  let fixture: ComponentFixture<BoxDetailsViewComponent>;
  let boxDetailsServiceSpy: jasmine.SpyObj<BoxDetailsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChanged$: Subject<void>;

  function setup(boxId: string | null = 'BOX001', serviceReturn: any = of(mockBoxDetails)) {
    TestBed.resetTestingModule();

    boxDetailsServiceSpy = jasmine.createSpyObj('BoxDetailsService', ['getBoxDetails']);
    boxDetailsServiceSpy.getBoxDetails.and.returnValue(serviceReturn);

    snackbarServiceSpy = createMockSnackbarService();
    chapterChanged$ = new Subject<void>();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', {}, {
      pageHeaderData: signal({ title: 'Box Details', subtitle: '' }),
    });

    TestBed.configureTestingModule({
      imports: [BoxDetailsViewComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BoxDetailsService, useValue: boxDetailsServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap(boxId ? { boxId } : {}) },
          },
        },
      ],
    });

    fixture = TestBed.createComponent(BoxDetailsViewComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization', () => {
    it('should create the component', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(component).toBeTruthy();
    }));

    it('should load box details on ngOnInit', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(boxDetailsServiceSpy.getBoxDetails).toHaveBeenCalledWith('BOX001', 'UnitId', 'DESC');
      expect(component['boxDetails']()).toEqual(mockBoxDetails);
      expect(component['loading']()).toBeFalse();
    }));

    it('should initialize productsTableConfig on ngOnInit', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(component.productsTableConfig).toBeDefined();
      expect(component.productsTableConfig.columns.length).toBeGreaterThan(0);
    }));

    it('should set error and stop loading when boxId is missing', fakeAsync(() => {
      setup(null);
      fixture.detectChanges();
      tick();
      expect(component['error']()).toBe('Box ID is required.');
      expect(component['loading']()).toBeFalse();
      expect(boxDetailsServiceSpy.getBoxDetails).not.toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ on destroy', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      fixture.destroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    }));
  });

  describe('loadBoxDetails - error handling', () => {
    it('should set 404 error message on 404 response', fakeAsync(() => {
      setup('BOX999', throwError(() => ({ status: 404 })));
      fixture.detectChanges();
      tick();
      expect(component['error']()).toContain("Box 'BOX999' not found.");
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['loading']()).toBeFalse();
    }));

    it('should set generic error on non-404 response', fakeAsync(() => {
      setup('BOX001', throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      tick();
      expect(component['error']()).toBe('Failed to load box details. Please try again.');
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['loading']()).toBeFalse();
    }));
  });

  describe('onSortChange', () => {
    beforeEach(fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      boxDetailsServiceSpy.getBoxDetails.calls.reset();
    }));

    it('should set ASC sort and reload', fakeAsync(() => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      tick();
      expect(component['productSortColumn']).toBe('UnitId');
      expect(component['productSortOrder']).toBe('ASC');
      expect(boxDetailsServiceSpy.getBoxDetails).toHaveBeenCalled();
    }));

    it('should set DESC sort', fakeAsync(() => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      tick();
      expect(component['productSortOrder']).toBe('DESC');
    }));

    it('should clear sort on default direction', fakeAsync(() => {
      component.onSortChange({ column: 'unitId', direction: 'default' });
      tick();
      expect(component['productSortColumn']).toBeUndefined();
      expect(component['productSortOrder']).toBeUndefined();
    }));

    it('should update sortConfig on tableConfig', fakeAsync(() => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      tick();
      expect(component.productsTableConfig.sortConfig?.direction).toBe('A');
    }));
  });

  describe('onProductSearch', () => {
    beforeEach(fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
    }));

    it('should filter products by search text', () => {
      component.onProductSearch('U001');
      expect(component['searchText']).toBe('U001');
      expect(component['paginatedProducts']().length).toBe(1);
    });

    it('should filter out non-matching products', () => {
      component.onProductSearch('NOMATCH');
      expect(component['paginatedProducts']().length).toBe(0);
    });

    it('should return all products when search is empty string', () => {
      component.onProductSearch('U001');
      component.onProductSearch('');
      expect(component['searchText']).toBe('');
      expect(component['paginatedProducts']().length).toBe(1);
    });

    it('should handle null search text', () => {
      component.onProductSearch(null as any);
      expect(component['searchText']).toBe('');
    });
  });

  describe('updatePaginatedProducts', () => {
    beforeEach(fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
    }));

    it('should set empty array when boxDetails is null', () => {
      component['boxDetails'].set(null);
      (component as any).updatePaginatedProducts();
      expect(component['paginatedProducts']()).toEqual([]);
    });

    it('should filter case-insensitively by unitId', () => {
      component['searchText'] = 'u001';
      (component as any).updatePaginatedProducts();
      expect(component['paginatedProducts']()[0].unitId).toBe('U001');
    });

    it('should return all products when no search text', () => {
      component['searchText'] = '';
      (component as any).updatePaginatedProducts();
      expect(component['paginatedProducts']().length).toBe(1);
    });
  });

  describe('formatDate', () => {
    beforeEach(fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
    }));

    it('should return "-" for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should format a valid date string', () => {
      expect(component.formatDate('2026-01-15T10:30:00Z')).toContain('15-JAN-2026');
    });
  });

  describe('formatTemperature', () => {
    beforeEach(fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
    }));

    it('should return "-" for null', () => {
      expect(component.formatTemperature(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(component.formatTemperature(undefined)).toBe('-');
    });

    it('should format with °C suffix', () => {
      expect(component.formatTemperature(4)).toBe('4°C');
    });

    it('should format 0 correctly', () => {
      expect(component.formatTemperature(0)).toBe('0°C');
    });
  });

  describe('formatValue', () => {
    beforeEach(fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
    }));

    it('should return "-" for null', () => {
      expect(component.formatValue(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(component.formatValue(undefined)).toBe('-');
    });

    it('should return "-" for empty string', () => {
      expect(component.formatValue('')).toBe('-');
    });

    it('should return string value', () => {
      expect(component.formatValue('HELLO')).toBe('HELLO');
    });

    it('should convert number to string', () => {
      expect(component.formatValue(42)).toBe('42');
    });
  });

  describe('formatProductStatus (private)', () => {
    beforeEach(fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
    }));

    it('should return "" for null', () => {
      expect((component as any).formatProductStatus(null)).toBe('');
    });

    it('should map PK → Packed', () => {
      expect((component as any).formatProductStatus('PK')).toBe('Packed');
    });

    it('should map AV → Available', () => {
      expect((component as any).formatProductStatus('AV')).toBe('Available');
    });

    it('should map O → Open', () => {
      expect((component as any).formatProductStatus('O')).toBe('Open');
    });

    it('should map CL → Closed', () => {
      expect((component as any).formatProductStatus('CL')).toBe('Closed');
    });

    it('should map RD → Ready', () => {
      expect((component as any).formatProductStatus('RD')).toBe('Ready');
    });

    it('should return unknown status as-is', () => {
      expect((component as any).formatProductStatus('XX')).toBe('XX');
    });
  });

  describe('goBack', () => {
    it('should navigate to /distribution/box-details', fakeAsync(() => {
      setup();
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      fixture.detectChanges();
      tick();
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/distribution/box-details']);
    }));
  });

  describe('parentTitle computed', () => {
    it('should return title from pageHeaderService', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(component['parentTitle']()).toBe('Box Details');
    }));

    it('should return default title when pageHeaderData is null', fakeAsync(() => {
      setup('BOX001', of(mockBoxDetails));
      // Override pageHeaderData after setup but before detectChanges
      Object.defineProperty(pageHeaderServiceSpy, 'pageHeaderData', {
        get: () => signal(null),
        configurable: true,
      });
      fixture.detectChanges();
      tick();
      expect(component['parentTitle']()).toBe('Distribution Box Management');
    }));
  });

  describe('chapter change subscription', () => {
    it('should call goBack on chapter change', fakeAsync(() => {
      setup();
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      fixture.detectChanges();
      tick();
      chapterChanged$.next();
      tick();
      expect(router.navigate).toHaveBeenCalledWith(['/distribution/box-details']);
    }));
  });

  describe('productsTableConfig valueFormatters', () => {
    beforeEach(fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
    }));

    it('unitId formatter: should append checkDigit when present', () => {
      const col = component.productsTableConfig.columns[0];
      const product = { ...mockBoxDetails.products[0], checkDigit: '5' };
      expect(col.valueFormatter?.('U001', product as any)).toBe('U001 5');
    });

    it('unitId formatter: should return value only when checkDigit is null', () => {
      const col = component.productsTableConfig.columns[0];
      const product = { ...mockBoxDetails.products[0], checkDigit: null };
      expect(col.valueFormatter?.('U001', product as any)).toBe('U001');
    });

    it('collectionDate formatter: should format valid date', () => {
      const col = component.productsTableConfig.columns[1];
      const result = col.valueFormatter?.('2026-01-15', {} as any);
      expect(result).toContain('JAN');
    });

    it('collectionDate formatter: should return "" for empty value', () => {
      const col = component.productsTableConfig.columns[1];
      expect(col.valueFormatter?.('', {} as any)).toBe('');
    });

    it('expirationDate formatter: should format valid date', () => {
      const col = component.productsTableConfig.columns[4];
      const result = col.valueFormatter?.('2026-06-01T00:00:00Z', {} as any);
      expect(result).toContain('JUN');
    });

    it('expirationDate formatter: should return "" for empty value', () => {
      const col = component.productsTableConfig.columns[4];
      expect(col.valueFormatter?.('', {} as any)).toBe('');
    });

    it('productStatus formatter: should map known status code', () => {
      const col = component.productsTableConfig.columns[6];
      expect(col.valueFormatter?.('PK', {} as any)).toBe('Packed');
    });

    it('productStatus formatter: should return "" for null', () => {
      const col = component.productsTableConfig.columns[6];
      expect(col.valueFormatter?.(null as any, {} as any)).toBe('');
    });
  });

  describe('updateUnitIdHeader (private)', () => {
    it('should update first column header with count', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      expect(component.productsTableConfig.columns[0].header).toBe('Unit ID (1)');
    }));

    it('should not throw when columns array is empty', fakeAsync(() => {
      setup();
      fixture.detectChanges();
      tick();
      component.productsTableConfig = { ...component.productsTableConfig, columns: [] };
      expect(() => (component as any).updateUnitIdHeader(5)).not.toThrow();
    }));
  });
});
