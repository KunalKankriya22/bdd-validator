import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { ViewAdditionalShipmentDetailsComponent } from './view-additional-shipment-details';
import { DeliveredShipmentDto } from '../../models/delivered-shipments.model';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('ViewAdditionalShipmentDetailsComponent', () => {
  let component: ViewAdditionalShipmentDetailsComponent;
  let fixture: ComponentFixture<ViewAdditionalShipmentDetailsComponent>;

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
    note: 'Handle with care, deliver to back door, ring twice, and leave package by the plants.',
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
        pickSlipId: 'PA17-00000093',
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
        pickSlipId: 'PA17-00000094',
        productType: 'RBC',
      },
      {
        boxId: 'BOX001',
        unitId: '0123456789014',
        checkDigit: '47',
        collDate: '2026-05-22T00:00:00Z',
        productCode: 'RBC003',
        productDesc: 'Red Blood Cells',
        aliquot: '03',
        bloodType: 'B+',
        bloodTypeDesc: 'B Positive',
        expDate: '2026-06-22T00:00:00Z',
        pickSlipId: 'PA17-00000093',
        productType: 'RBC',
      },
    ],
  };

  function setShipmentInput(
    comp: ViewAdditionalShipmentDetailsComponent,
    shipment: DeliveredShipmentDto | null
  ): void {
    comp.shipment = shipment;
    comp.ngOnChanges();
  }

  beforeEach(() => {

    const translateServiceSpy = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [ViewAdditionalShipmentDetailsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
    });


    



    fixture = TestBed.createComponent(ViewAdditionalShipmentDetailsComponent);
    component = fixture.componentInstance;
    setShipmentInput(component, mockShipment);
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should initialize with shipment data', () => {
      expect(component.shipment).toEqual(mockShipment);
    });

    it('should extract unique pick slip IDs into pickSlipData', () => {
      const pickSlipData = component.pickSlipData();
      expect(pickSlipData.length).toBe(2);
      expect(pickSlipData.map((p) => p.pickSlipId)).toContain('PA17-00000093');
      expect(pickSlipData.map((p) => p.pickSlipId)).toContain('PA17-00000094');
    });

    it('should compute pick slip count', () => {
      expect(component.pickSlipData().length).toBe(2);
    });
  });

  describe('Display Fields', () => {
    it('should display receive date', () => {
      const values = fixture.debugElement.queryAll(By.css('.details-row .field-label .value'));
      expect(values[0].nativeElement.textContent.trim()).toMatch(/25-MAY-2026 \d{2}:\d{2}/);
    });

    it('should display received by', () => {
      const values = fixture.debugElement.queryAll(By.css('.details-row .field-label .value'));
      expect(values[1].nativeElement.textContent.trim()).toBe('John Doe');
    });

    it('should display tracking number', () => {
      const values = fixture.debugElement.queryAll(By.css('.details-row .field-label .value'));
      expect(values[2].nativeElement.textContent.trim()).toBe('1234567890');
    });

    it('should display flight number', () => {
      const values = fixture.debugElement.queryAll(By.css('.details-row .field-label .value'));
      expect(values[3].nativeElement.textContent.trim()).toBe('FL123');
    });

    it('should display delivery comments', () => {
      const comments = fixture.debugElement.query(By.css('.comments-section .comments-text'));
      expect(comments.nativeElement.textContent.trim()).toBe(mockShipment.note);
    });

    it('should display "-" for null fields', () => {
      const shipmentWithNulls: DeliveredShipmentDto = {
        ...mockShipment,
        receivedBy: null,
        trackingNo: null,
        flightNo: null,
        note: null,
      };

      setShipmentInput(component, shipmentWithNulls);
      fixture.detectChanges();

      const values = fixture.debugElement.queryAll(By.css('.details-row .field-label .value'));
      expect(values[1].nativeElement.textContent.trim()).toBe('-');
      expect(values[2].nativeElement.textContent.trim()).toBe('-');
      expect(values[3].nativeElement.textContent.trim()).toBe('-');

      const comments = fixture.debugElement.query(By.css('.comments-section .comments-text'));
      expect(comments.nativeElement.textContent.trim()).toBe('-');
    });
  });

  describe('Pick Slip Data', () => {
    it('should compute pick slip data with unique IDs', () => {
      const pickSlipData = component.pickSlipData();
      expect(pickSlipData.length).toBe(2);
      expect(pickSlipData[0].pickSlipId).toBe('PA17-00000093');
      expect(pickSlipData[1].pickSlipId).toBe('PA17-00000094');
    });




  });
  describe('Date Formatting', () => {
    it('should format datetime to DD-MMM-YYYY HH:mm', () => {
      const formatted = component.formatDateTime('2026-05-25T14:30:00Z');
      expect(formatted).toMatch(/25-MAY-2026 \d{2}:\d{2}/);
    });

    it('should return "-" for null datetime', () => {
      expect(component.formatDateTime(null)).toBe('-');
    });


  });
  describe('Panel Header', () => {
    it('should display panel title', () => {
      const title = fixture.debugElement.query(By.css('h2.panel-title'));
      expect(title.nativeElement.textContent.trim()).toBe('View Additional Shipment Details');
    });

    it('should have close icon button', () => {
      const closeIconButton = fixture.debugElement.query(By.css('button[mat-icon-button]'));
      expect(closeIconButton).toBeTruthy();
      const icon = closeIconButton.query(By.css('mat-icon'));
      expect(icon.nativeElement.textContent.trim()).toBe('close');
    });
  });
});
