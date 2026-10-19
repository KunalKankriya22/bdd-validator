import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { DeliveredShipmentsComponent } from './delivered-shipments';
import { DeliveredShipmentsService } from './services/delivered-shipments.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  DeliveredShipmentDto,
  ShipmentNumberOption,
  BoxIdOption,
} from './models/delivered-shipments.model';

describe('DeliveredShipmentsComponent', () => {
  let component: DeliveredShipmentsComponent;
  let comp: any;
  let fixture: ComponentFixture<DeliveredShipmentsComponent>;
  let deliveredShipmentsServiceSpy: jasmine.SpyObj<DeliveredShipmentsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockShipmentNumbers: ShipmentNumberOption[] = [
    { shipmentNo: 'SH001', receiptDate: '2026-05-25T14:30:00Z', consigneeName: 'General Hospital' },
    { shipmentNo: 'SH002', receiptDate: '2026-05-26T10:00:00Z', consigneeName: 'City Clinic' },
  ];

  const mockBoxIds: BoxIdOption[] = [{ boxId: 'BOX001' }, { boxId: 'BOX002' }];

  const mockShipment: DeliveredShipmentDto = {
    shipmentNo: 'SH001',
    receiptDate: '2026-05-25T14:30:00Z',
    carrier: 'FedEx',
    consigneeName: 'General Hospital',
    address: '123 Main St',
    city: 'Dallas',
    state: 'Texas',
    zip: '75201',
    country: 'USA',
    orderType: 'Regular',
    orderClass: 'Priority',
    totalBoxes: 2,
    receivedBy: 'John Doe',
    trackingNo: '1234567890',
    flightNo: 'FL123',
    note: 'Handle with care',
    products: [
      {
        boxId: 'BOX001',
        unitId: '0123456789012',
        checkDigit: '45',
        collDate: '2026-05-20T00:00:00Z',
        productCode: 'RBC001',
        productDesc: 'Red Blood Cells',
        aliquot: '01',
        bloodType: 'O+',
        bloodTypeDesc: 'O Positive',
        expDate: '2026-06-20T00:00:00Z',
        pickSlipId: 'PS001',
        productType: 'RBC',
      },
      {
        boxId: 'BOX002',
        unitId: '0123456789013',
        checkDigit: '46',
        collDate: '2026-05-21T00:00:00Z',
        productCode: 'RBC002',
        productDesc: 'Red Blood Cells',
        aliquot: '02',
        bloodType: 'A+',
        bloodTypeDesc: 'A Positive',
        expDate: '2026-06-21T00:00:00Z',
        pickSlipId: 'PS002',
        productType: 'RBC',
      },
    ],
  };

  beforeEach(() => {

    deliveredShipmentsServiceSpy = jasmine.createSpyObj('DeliveredShipmentsService', [
      'getShipmentNumbers',
      'getShipmentHeader',
      'getBoxIdsByShipment',
      'getShipmentByNumber',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    const translateServiceSpy = createMockTranslateService();
    deliveredShipmentsServiceSpy.getShipmentNumbers.and.returnValue(of(mockShipmentNumbers));
    deliveredShipmentsServiceSpy.getShipmentHeader.and.returnValue(of(mockShipment));
    deliveredShipmentsServiceSpy.getBoxIdsByShipment.and.returnValue(of(mockBoxIds));
    deliveredShipmentsServiceSpy.getShipmentByNumber.and.returnValue(of(mockShipment));



      TestBed.configureTestingModule({
      imports: [DeliveredShipmentsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: DeliveredShipmentsService, useValue: deliveredShipmentsServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
    });


    


      deliveredShipmentsServiceSpy.getShipmentNumbers.calls.reset();


      deliveredShipmentsServiceSpy.getShipmentHeader.calls.reset();


      deliveredShipmentsServiceSpy.getBoxIdsByShipment.calls.reset();


      deliveredShipmentsServiceSpy.getShipmentByNumber.calls.reset();


      deliveredShipmentsServiceSpy.getShipmentNumbers.and.returnValue(of(mockShipmentNumbers));


      deliveredShipmentsServiceSpy.getShipmentHeader.and.returnValue(of(mockShipment));


      deliveredShipmentsServiceSpy.getBoxIdsByShipment.and.returnValue(of(mockBoxIds));


      deliveredShipmentsServiceSpy.getShipmentByNumber.and.returnValue(of(mockShipment));


    fixture = TestBed.createComponent(DeliveredShipmentsComponent);
    component = fixture.componentInstance;
    comp = component;


    });

  describe('Initialization', () => {




    it('should load shipment numbers on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(deliveredShipmentsServiceSpy.getShipmentNumbers).toHaveBeenCalled();
      expect(comp.shipmentNumbers()).toEqual(mockShipmentNumbers);
    }));

    it('should handle error when loading shipment numbers', fakeAsync(() => {
      deliveredShipmentsServiceSpy.getShipmentNumbers.and.returnValue(
        throwError(() => new Error('API error'))
      );

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load shipment numbers. Please try again.'
      );
      expect(comp.loadingShipments()).toBeFalse();
    }));
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load box IDs when shipment number is selected', fakeAsync(() => {
      component.form.get('shipmentNo')?.setValue('SH001');
      tick();

      expect(deliveredShipmentsServiceSpy.getBoxIdsByShipment).toHaveBeenCalledWith('SH001');
      expect(comp.boxIds()).toEqual(mockBoxIds);
    }));

    it('should clear box IDs when shipment number is cleared', fakeAsync(() => {
      component.form.get('shipmentNo')?.setValue('SH001');
      tick();

      component.form.get('shipmentNo')?.setValue(null);
      tick();

      expect(comp.boxIds()).toEqual([]);
      expect(component.form.get('boxId')?.value).toBeFalsy();
    }));


  });

  describe('Retrieve Shipment', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should retrieve shipment when RETRIEVE is clicked', fakeAsync(() => {
      component.form.get('shipmentNo')?.setValue('SH001');
      tick();

      comp.onRetrieve();
      tick();

      const callArgs = deliveredShipmentsServiceSpy.getShipmentByNumber.calls.mostRecent().args;
      expect(callArgs[0]).toBe('SH001');
      expect(callArgs[1]).toBeFalsy();
      expect(comp.selectedShipment()).toEqual(mockShipment);
      expect(comp.products()).toEqual(mockShipment.products);
    }));

    it('should retrieve shipment with box filter', fakeAsync(() => {
      component.form.get('shipmentNo')?.setValue('SH001');
      component.form.get('boxId')?.setValue('BOX001');
      tick();

      comp.onRetrieve();
      tick();

      expect(deliveredShipmentsServiceSpy.getShipmentByNumber).toHaveBeenCalledWith('SH001', 'BOX001');
    }));



    it('should handle shipment not found', fakeAsync(() => {
      deliveredShipmentsServiceSpy.getShipmentByNumber.and.returnValue(of(null));

      component.form.get('shipmentNo')?.setValue('INVALID');
      tick();

      comp.onRetrieve();
      tick();

      expect(comp.products()).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Shipment not found or not delivered.');
    }));






  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form and state when CLEAR ALL is clicked', fakeAsync(() => {
      component.form.get('shipmentNo')?.setValue('SH001');
      component.form.get('boxId')?.setValue('BOX001');
      comp.selectedShipment.set(mockShipment);
      comp.products.set(mockShipment.products);
      tick();

      comp.onClearAll();

      expect(component.form.get('shipmentNo')?.value).toBeNull();
      expect(component.form.get('boxId')?.value).toBeNull();
      expect(comp.selectedShipment()).toBeNull();
      expect(comp.products()).toEqual([]);
      expect(comp.boxIds()).toEqual([]);
    }));
  });

  describe('View Additional Details', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open side panel when shipment is selected', () => {
      comp.selectedShipment.set(mockShipment);

      comp.onViewAdditionalDetails();

      expect(comp.sidePanelOpen()).toBeTrue();
    });


  });



  describe('Computed Values', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute hasProducts correctly', () => {
      comp.products.set([]);
      expect(comp.hasProducts()).toBeFalse();

      comp.products.set(mockShipment.products);
      expect(comp.hasProducts()).toBeTrue();
    });

    it('should compute isRetrieveDisabled correctly', fakeAsync(() => {
      component.form.get('shipmentNo')?.setValue(null);
      tick();
      expect(comp.isRetrieveDisabled()).toBeTrue();

      component.form.get('shipmentNo')?.setValue('SH001');
      tick();
      expect(comp.isRetrieveDisabled()).toBeFalse();

      comp.loading.set(true);
      expect(comp.isRetrieveDisabled()).toBeTrue();
    }));

    it('should compute unique pick slip IDs', () => {
      comp.selectedShipment.set(mockShipment);
      const pickSlipIds = comp.uniquePickSlipIds();

      expect(pickSlipIds.length).toBe(2);
      expect(pickSlipIds).toContain('PS001');
      expect(pickSlipIds).toContain('PS002');
    });
  });

  describe('Date Formatting', () => {


    it('should format datetime to DD-MMM-YYYY HH:mm', () => {
      const formatted = comp['formatDateTime']('2026-05-25T14:30:00Z');
      expect(formatted).toMatch(/25-MAY-2026 \d{2}:\d{2}/);
    });




  });





  describe('Empty State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show empty state when no shipment selected', () => {
      comp.loading.set(false);
      comp.selectedShipment.set(null);
      comp.products.set([]);
      fixture.detectChanges();

      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No Results to Display');
      expect(emptyState.nativeElement.textContent).toContain('Enter Shipment Number to begin.');
    });




  });
});
