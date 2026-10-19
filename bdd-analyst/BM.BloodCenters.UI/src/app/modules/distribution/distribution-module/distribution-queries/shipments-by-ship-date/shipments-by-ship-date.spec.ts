import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

import { ShipmentsByShipDateComponent } from './shipments-by-ship-date';
import { ShipmentsByShipDateService } from './services/shipments-by-ship-date.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ShipmentDto } from './models/shipments-by-ship-date.model';
import moment from 'moment';
import { createMockSnackbarService, createMockTranslateService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('ShipmentsByShipDateComponent', () => {
  let component: ShipmentsByShipDateComponent;
  let comp: any;
  let fixture: ComponentFixture<ShipmentsByShipDateComponent>;
  let apiServiceSpy: jasmine.SpyObj<ShipmentsByShipDateService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockShipments: ShipmentDto[] = [
    {
      shipmentNo: 'W1234-18-031310-Z',
      shipmentDate: '2025-01-10T00:00:00Z',
      consigneeId: 'PAR-CS0001',
      consigneeName: 'Parkland',
      statusDesc: 'Delivered',
      typeDesc: 'Inbound',
      receiptDate: '2025-01-10T00:00:00Z',
      temperature: 70,
      carrierDesc: 'WellSky Van',
      flightNo: '245',
      trackNo: '1000123121',
      noteId: 1,
    },
    {
      shipmentNo: 'W1234-18-031311-Z',
      shipmentDate: '2025-01-10T00:00:00Z',
      consigneeId: 'PAR-CS0001',
      consigneeName: 'Parkland',
      statusDesc: 'Delivered',
      typeDesc: 'Inbound',
      receiptDate: '2025-01-10T00:00:00Z',
      temperature: 35,
      carrierDesc: 'WellSky Van',
      flightNo: '6883',
      trackNo: '1000123122',
      noteId: 2,
    },
  ];

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('ShipmentsByShipDateService', [
      'searchShipments',
      'getBoxDetails',
      'getOrderDetails',
      'getShippedProducts',
      'getDeliveryNotes',
      'getFilterOptions',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    const translateServiceSpy = createMockTranslateService();
    apiServiceSpy.getFilterOptions.and.returnValue(of({ statuses: [], types: [] }));
    apiServiceSpy.searchShipments.and.returnValue(
      of({ data: mockShipments, totalCount: 2 })
    );



      TestBed.configureTestingModule({
      imports: [ShipmentsByShipDateComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ShipmentsByShipDateService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: PageHeaderService, useValue: { pageHeaderData: signal(undefined), getTitle: () => '', getSubtitle: () => '' } },
        { provide: HeaderService, useValue: { chapterChanged$: new Subject<void>() } },
      ],
    })
      .overrideComponent(ShipmentsByShipDateComponent, {
        add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] },
      });


    


      apiServiceSpy.searchShipments.calls.reset();


      apiServiceSpy.getBoxDetails.calls.reset();


      apiServiceSpy.getOrderDetails.calls.reset();


      apiServiceSpy.getShippedProducts.calls.reset();


      apiServiceSpy.getDeliveryNotes.calls.reset();


      apiServiceSpy.getFilterOptions.calls.reset();


      apiServiceSpy.getFilterOptions.and.returnValue(of({ statuses: [], types: [] }));


    fixture = TestBed.createComponent(ShipmentsByShipDateComponent);
    component = fixture.componentInstance;
    comp = component;


    });

  describe('Initialization', () => {




    it('should have retrieve disabled when no from date', () => {
      fixture.detectChanges();
      expect(comp.isRetrieveDisabled()).toBeTruthy();
    });



    it('should generate unique component IDs', () => {
      fixture.detectChanges();
      expect(comp.componentId).toContain('shipments-by-ship-date-');
    });
  });

  describe('Search / Retrieve', () => {
    it('should mark fromDate as touched when from date is not provided', () => {
      fixture.detectChanges();
      comp.onRetrieve();
      expect(comp.form.get('fromDate')?.touched).toBeTrue();
    });

    it('should call API with correct parameters on retrieve', fakeAsync(() => {
      fixture.detectChanges();
      comp.form.get('fromDate')?.setValue(moment('2025-01-10'));
      comp.onRetrieve();
      tick();

      expect(apiServiceSpy.searchShipments).toHaveBeenCalled();
      const args = apiServiceSpy.searchShipments.calls.mostRecent().args;
      expect(args[0].startDate).toBe('2025-01-10');
    }));

    it('should set shipments on successful search', fakeAsync(() => {
      fixture.detectChanges();
      comp.form.get('fromDate')?.setValue(moment('2025-01-10'));
      comp.onRetrieve();
      tick();

      expect(comp.shipments().length).toBe(2);
      expect(comp.totalCount()).toBe(2);
      expect(comp.hasSearched()).toBeTrue();
    }));

    it('should handle API error on search', fakeAsync(() => {
      apiServiceSpy.searchShipments.and.returnValue(
        throwError(() => new Error('API error'))
      );
      fixture.detectChanges();
      comp.form.get('fromDate')?.setValue(moment('2025-01-10'));
      comp.onRetrieve();
      tick();

      expect(comp.shipments().length).toBe(0);
      expect(comp.loading()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));



    it('should include shipment number in query when provided', fakeAsync(() => {
      fixture.detectChanges();
      comp.form.get('fromDate')?.setValue(moment('2025-01-10'));
      comp.form.get('shipmentNo')?.setValue('SHP001');
      comp.onRetrieve();
      tick();

      const args = apiServiceSpy.searchShipments.calls.mostRecent().args;
      expect(args[0].shipmentNo).toBe('SHP001');
    }));

    it('should include to date in query when provided', fakeAsync(() => {
      fixture.detectChanges();
      comp.form.get('fromDate')?.setValue(moment('2025-01-10'));
      comp.form.get('toDate')?.setValue(moment('2025-01-31'));
      comp.onRetrieve();
      tick();

      const args = apiServiceSpy.searchShipments.calls.mostRecent().args;
      expect(args[0].endDate).toBe('2025-01-31');
    }));
  });

  describe('Clear All', () => {
    it('should reset form and clear results', fakeAsync(() => {
      fixture.detectChanges();
      comp.form.get('fromDate')?.setValue(moment('2025-01-10'));
      comp.onRetrieve();
      tick();

      comp.onClearAll();
      expect(comp.form.get('fromDate')?.value).toBeNull();
      expect(comp.shipments().length).toBe(0);
      expect(comp.totalCount()).toBe(0);
      expect(comp.hasSearched()).toBeFalse();
      expect(comp.selectedShipment()).toBeNull();
    }));
  });

  describe('Row Selection', () => {
    it('should set selected shipment on row click', fakeAsync(() => {
      fixture.detectChanges();
      comp.form.get('fromDate')?.setValue(moment('2025-01-10'));
      comp.onRetrieve();
      tick();

      comp.onRowClick(mockShipments[0]);
      expect(comp.selectedShipment()).toEqual(mockShipments[0]);
    }));
  });
  describe('Action Buttons', () => {


















    it('should show info when shipment has no noteId for delivery notes', () => {
      fixture.detectChanges();
      const shipmentWithoutNote = { ...mockShipments[0], noteId: null };
      comp.selectedShipment.set(shipmentWithoutNote);

      comp.onViewDeliveryNotes();

      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith(
        'No delivery notes available for this shipment.'
      );
    });
  });

  describe('Date Formatting', () => {
    it('should format valid date to DD-MMM-YYYY', () => {
      fixture.detectChanges();
      expect(comp.formatDate('2025-01-10T00:00:00Z')).toBe('10-JAN-2025');
    });


  });

  describe('Table Configuration', () => {
    it('should have correct columns matching API DTO field names', () => {
      fixture.detectChanges();
      const config = comp.tableConfig;
      expect(config.columns.length).toBe(11);
      expect(config.columns[0].key).toBe('shipmentNo');
      expect(config.columns[1].key).toBe('shipmentDate');
      expect(config.columns[2].key).toBe('consigneeId');
      expect(config.columns[3].key).toBe('consigneeName');
      expect(config.columns[4].key).toBe('statusDesc');
      expect(config.columns[5].key).toBe('typeDesc');
      expect(config.columns[6].key).toBe('receiptDate');
      expect(config.columns[7].key).toBe('temperature');
      expect(config.columns[8].key).toBe('carrierDesc');
      expect(config.columns[9].key).toBe('flightNo');
      expect(config.columns[10].key).toBe('trackNo');
    });


  });
});
