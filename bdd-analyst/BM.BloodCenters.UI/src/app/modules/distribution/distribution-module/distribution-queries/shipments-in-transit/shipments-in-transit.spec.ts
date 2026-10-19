import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';

import { ShipmentsInTransitComponent } from './shipments-in-transit';
import { ShipmentsInTransitApiService } from './services/shipments-in-transit-api.service';
import {
  ShipmentLookupDto,
  BoxLookupDto,
  ShipmentHeaderDto,
  ReturnResult,
} from './models/shipments-in-transit.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ShipmentsInTransitComponent', () => {
  let sorted: any;
  let component: ShipmentsInTransitComponent;
  let fixture: ComponentFixture<ShipmentsInTransitComponent>;
  let apiServiceSpy: jasmine.SpyObj<ShipmentsInTransitApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockShipments: ShipmentLookupDto[] = [
    { shipmentNo: 'SH112417RE0016', consigneeName: 'Parkland Hospital' },
    { shipmentNo: 'SH112821RE0016', consigneeName: 'BCA - Sanquin Format' },
  ];

  const mockBoxes: BoxLookupDto[] = [
    { boxId: '1124170016' },
    { boxId: '1124170017' },
  ];

  const mockSearchResult: ShipmentHeaderDto = {
    shipmentNo: 'SH112417RE0016',
    shipmentDate: '2025-01-11T13:15:00',
    carrierCode: 'BC',
    carrierName: 'Mediware Van',
    customerName: 'Parkland Hospital',
    address: '823 Harry Hines Road',
    city: 'Dallas',
    state: 'Texas',
    zip: '75325',
    country: 'USA',
    totalBoxes: 25,
    defaultBoxId: '1124170016',
    products: [
      {
        unitId: 'W1234-18-031310',
        checkDigit: '-Z',
        productCode: 'E0701V00',
        productDescription: 'Red Blood Cells SIA|S5/450mL/refg',
        aliquot: '00',
        aboRh: 'O Positive',
        expirationDate: '2025-01-11T13:16:00',
      },
      {
        unitId: 'W1234-18-031309',
        checkDigit: '-Z',
        productCode: 'E0701V01',
        productDescription: 'Red Blood Cells SIA|S5/450mL/refg',
        aliquot: '00',
        aboRh: 'O Negative',
        expirationDate: '2025-01-11T13:15:00',
      },
    ],
  };

  const listResponse = <T>(data: T[]): ReturnResult<T> => ({
    success: true, message: '', statusCode: 200, data,
  });

  const itemResponse = <T>(item: T): ReturnResult<T> => ({
    success: true, message: '', statusCode: 200, item,
  });

  const errorResponse = <T>(message: string, errorCode = ''): ReturnResult<T> => ({
    success: false, message, statusCode: 400,
    errorCode,
    errorResponse: { errorCode, error: message },
  });

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('ShipmentsInTransitApiService', [
      'getShipmentLookup', 'getBoxLookup', 'search',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
      headerConfig: signal({ user: { name: 'Test User', id: 'TEST1', role: 'User' } }),
    });

    apiServiceSpy.getShipmentLookup.and.returnValue(of(listResponse(mockShipments)));
    apiServiceSpy.getBoxLookup.and.returnValue(of(listResponse(mockBoxes)));
    apiServiceSpy.search.and.returnValue(of(itemResponse(mockSearchResult)));



      TestBed.configureTestingModule({
      imports: [ShipmentsInTransitComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ShipmentsInTransitApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });

      pageHeaderServiceSpy.getTitle.and.returnValue(undefined);


      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);


      apiServiceSpy.getShipmentLookup.and.returnValue(of(listResponse(mockShipments)));


      apiServiceSpy.getBoxLookup.and.returnValue(of(listResponse(mockBoxes)));


      apiServiceSpy.search.and.returnValue(of(itemResponse(mockSearchResult)));


    fixture = TestBed.createComponent(ShipmentsInTransitComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should load shipment lookup on init', () => {
      fixture.detectChanges();
      expect(apiServiceSpy.getShipmentLookup).toHaveBeenCalledTimes(1);
    });

    it('should have empty results on init', () => {
      fixture.detectChanges();
      expect(component.shipmentHeader()).toBeNull();
      expect(component.products()).toEqual([]);
      expect(component.hasSearched).toBeFalse();
    });



    it('should handle shipment lookup API error gracefully', fakeAsync(() => {
      apiServiceSpy.getShipmentLookup.and.returnValue(throwError(() => ({ status: 500 })));
      fixture.detectChanges();
      tick();
      expect(component.isLoadingShipments).toBeFalse();
      expect(component.shipmentOptions().length).toBe(0);
    }));
  });

  describe('Cascading Dropdowns', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load box lookup when shipment is selected', fakeAsync(() => {
      component.filterForm.get('shipmentNo')?.setValue('SH112417RE0016');
      tick();
      expect(apiServiceSpy.getBoxLookup).toHaveBeenCalledWith('SH112417RE0016');
    }));

    it('should reset box ID when shipment changes', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016', boxId: '1124170016' });
      tick();
      const noDefaultBox = { ...mockSearchResult, defaultBoxId: null };
      apiServiceSpy.search.and.returnValue(of(itemResponse(noDefaultBox)));
      component.filterForm.get('shipmentNo')?.setValue('SH112821RE0016');
      tick();
      expect(component.filterForm.get('boxId')?.value).toBe('');
      expect(apiServiceSpy.getBoxLookup).toHaveBeenCalledWith('SH112821RE0016');
    }));

    it('should clear box options when shipment is cleared', fakeAsync(() => {
      component.filterForm.get('shipmentNo')?.setValue('SH112417RE0016');
      tick();
      component.filterForm.get('shipmentNo')?.setValue('');
      tick();
      expect(component.boxOptions()).toEqual([]);
    }));
  });

  describe('Search / Retrieve', () => {
    beforeEach(() => fixture.detectChanges());



    it('should call search with correct request body', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.search).toHaveBeenCalledWith({ ShipmentNo: 'SH112417RE0016' });
    }));

    it('should include BoxId when provided', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016', boxId: '1124170016' });
      component.onRetrieve();
      tick();
      expect(apiServiceSpy.search).toHaveBeenCalledWith(jasmine.objectContaining({ ShipmentNo: 'SH112417RE0016', BoxId: '1124170016' }));
    }));





    it('should set hasSearched to true after retrieve', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
      expect(component.hasSearched).toBeTrue();
    }));

    it('should show error on search API failure', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(throwError(() => ({ status: 500 })));
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.shipmentHeader()).toBeNull();
      expect(component.products()).toEqual([]);
    }));


  });

  describe('Clear', () => {
    it('should reset all fields and results', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();

      component.onClear();

      expect(component.filterForm.get('shipmentNo')?.value).toBe('');
      expect(component.filterForm.get('boxId')?.value).toBe('');
      expect(component.shipmentHeader()).toBeNull();
      expect(component.products()).toEqual([]);
      expect(component.hasSearched).toBeFalse();
    }));
  });

  describe('displayValue', () => {
    it('should return "-" for null', () => {
      expect(component.displayValue(null)).toBe('-');
    });





    it('should return string for number value', () => {
      expect(component.displayValue(25)).toBe('25');
    });
  });

  describe('formatDateTime', () => {
    it('should format ISO date to DD-MMM-YYYY HH:mm', () => {
      expect(component.formatDateTime('2025-01-11T13:15:00')).toBe('11-JAN-2025 13:15');
    });

    it('should return "-" for null', () => {
      expect(component.formatDateTime(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(component.formatDateTime(undefined)).toBe('-');
    });
  });

  describe('Chapter Changes', () => {
    it('should clear and reload shipments on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getShipmentLookup.calls.reset();
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.hasSearched = true;
      chapterChangedSubject.next();
      tick();

      expect(component.filterForm.get('shipmentNo')?.value).toBe('');
      expect(component.hasSearched).toBeFalse();
      expect(apiServiceSpy.getShipmentLookup).toHaveBeenCalledTimes(1);
    }));
  });

  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
    }));

    it('should sort products ascending by unitId', () => {
      component.onSortChange({ active: 'unitId', direction: 'asc' });
      expect(apiServiceSpy.search).toHaveBeenCalled();
      expect(component.currentSort).toEqual({ active: 'unitId', direction: 'asc' });
      expect(component.products().length).toBe(2);
    });

    it('should sort products descending by unitId', () => {
      component.onSortChange({ active: 'unitId', direction: 'desc' });
      expect(apiServiceSpy.search).toHaveBeenCalled();
      expect(component.currentSort).toEqual({ active: 'unitId', direction: 'desc' });
      expect(component.products().length).toBe(2);
    });

    it('should sort by productCode', () => {
      component.onSortChange({ active: 'productCode', direction: 'asc' });
      expect(component.currentSort).toEqual({ active: 'productCode', direction: 'asc' });
      expect(component.products().length).toBe(2);
    });

    it('should sort by productDescription', () => {
      component.onSortChange({ active: 'productDescription', direction: 'asc' });
      expect(component.products().length).toBe(2);
    });

    it('should sort by aboRh', () => {
      component.onSortChange({ active: 'aboRh', direction: 'asc' });
      expect(component.currentSort).toEqual({ active: 'aboRh', direction: 'asc' });
      expect(component.products().length).toBe(2);
    });

    it('should sort by expirationDate', () => {
      component.onSortChange({ active: 'expirationDate', direction: 'asc' });
      expect(component.products().length).toBe(2);
    });




  });

  describe('Computed Signals - Filtered Dropdowns', () => {
    beforeEach(() => fixture.detectChanges());





    it('should return all shipments when search is empty', fakeAsync(() => {
      component.shipmentSearchCtrl.setValue('');
      tick();
      expect(component.filteredShipments().length).toBe(2);
    }));



    it('should return all boxes when search is empty', fakeAsync(() => {
      component.filterForm.get('shipmentNo')?.setValue('SH112417RE0016');
      tick();
      component.boxSearchCtrl.setValue('');
      tick();
      expect(component.filteredBoxes().length).toBe(2);
    }));
  });

  describe('Enrich Products', () => {
    beforeEach(() => fixture.detectChanges());

    it('should build fullUnitId with checkDigit', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
      expect(component.products()[0].fullUnitId).toBe('W1234-18-031310-Z');
    }));

    it('should build fullUnitId without checkDigit', fakeAsync(() => {
      const noCheckDigit = {
        ...mockSearchResult,
        products: [{
          ...mockSearchResult.products[0],
          checkDigit: null,
        }],
      };
      apiServiceSpy.search.and.returnValue(of(itemResponse(noCheckDigit)));
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
      expect(component.products()[0].fullUnitId).toBe('W1234-18-031310');
    }));

    it('should format expiration date in enriched products', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
      expect(component.products()[0].formattedExpirationDate).toBe('11-JAN-2025 13:16');
    }));

    it('should compute unitCount from products', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
      expect(component.totalRecords()).toBe(2);
    }));
  });

  describe('hasAnyFieldValue', () => {
    beforeEach(() => fixture.detectChanges());

    it('should return false when no fields have values', () => {
      component.filterForm.reset({ shipmentNo: '', boxId: '' });
      expect(component.hasAnyFieldValue()).toBeFalse();
    });

    it('should return true when shipmentNo has value', () => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      expect(component.hasAnyFieldValue()).toBeTrue();
    });

    it('should return true when boxId has value', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      tick();
      component.filterForm.patchValue({ boxId: '1124170016' }, { emitEvent: false });
      expect(component.hasAnyFieldValue()).toBeTrue();
    }));
  });

  describe('Retrieve Disabled State', () => {
    beforeEach(() => fixture.detectChanges());

    it('should start with retrieve disabled', () => {
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should enable retrieve after shipment header loads', fakeAsync(() => {
      component.filterForm.get('shipmentNo')?.setValue('SH112417RE0016');
      tick();
      expect(component.isRetrieveDisabled).toBeFalse();
    }));

    it('should disable retrieve after successful search', fakeAsync(() => {
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      tick();
      component.onRetrieve();
      tick();
      expect(component.isRetrieveDisabled).toBeTrue();
    }));
  });

  describe('Shipment Header Loading', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set defaultBoxId in form when available', fakeAsync(() => {
      component.filterForm.get('shipmentNo')?.setValue('SH112417RE0016');
      tick();
      expect(component.filterForm.get('boxId')?.value).toBe('1124170016');
    }));




  });

  describe('Box Loading', () => {
    beforeEach(() => fixture.detectChanges());

    it('should handle box lookup error gracefully', fakeAsync(() => {
      apiServiceSpy.getBoxLookup.and.returnValue(throwError(() => ({ status: 500 })));
      component.filterForm.get('shipmentNo')?.setValue('SH112417RE0016');
      tick();
      expect(component.isLoadingBoxes).toBeFalse();
    }));
  });

  describe('No Products in Response', () => {
    beforeEach(() => fixture.detectChanges());



    it('should handle response with null data', fakeAsync(() => {
      apiServiceSpy.search.and.returnValue(of({
        success: true, message: '', statusCode: 200,
      }));
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
      expect(component.products()).toEqual([]);
    }));
  });

  describe('Table Configuration', () => {


    it('should have default sort on unitId descending', () => {
      expect(component.currentSort).toEqual({ active: 'unitId', direction: 'desc' });
    });
  });

  describe('Compare Method Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const productsWithNulls = {
        ...mockSearchResult,
        products: [
          { ...mockSearchResult.products[0], aboRh: null as any },
          { ...mockSearchResult.products[1] },
        ],
      };
      apiServiceSpy.search.and.returnValue(of(itemResponse(productsWithNulls)));
      component.filterForm.patchValue({ shipmentNo: 'SH112417RE0016' });
      component.onRetrieve();
      tick();
    }));

    it('should handle null values during sort', () => {
      component.onSortChange({ active: 'aboRh', direction: 'asc' });
      sorted = component.products();
      expect(sorted.length).toBe(2);
    });
  });
});
