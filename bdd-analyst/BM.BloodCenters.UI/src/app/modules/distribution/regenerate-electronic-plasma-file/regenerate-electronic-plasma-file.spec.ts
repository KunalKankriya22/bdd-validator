import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';

import { RegenerateElectronicPlasmaFileComponent } from './regenerate-electronic-plasma-file';
import { RegenerateElectronicPlasmaFileService } from './services/regenerate-electronic-plasma-file.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  PendingShipment,
  RegeneratePlasmaFileShipmentDto,
  RegeneratePlasmaFileResponseDto,
} from './models/regenerate-electronic-plasma-file.model';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('RegenerateElectronicPlasmaFileComponent', () => {
  let component: RegenerateElectronicPlasmaFileComponent;
  let fixture: ComponentFixture<RegenerateElectronicPlasmaFileComponent>;
  let serviceSpy: jasmine.SpyObj<RegenerateElectronicPlasmaFileService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockPendingShipments: PendingShipment[] = [
    {
      shipmentNo: 'SHP001',
      consigneeId: 'CONS001',
      consigneeName: 'ABC Plasma Center',
      customerId: 'CUST001',
      shipmentDate: '2024-03-15T00:00:00Z',
      shipmentStatus: 'P',
      shipmentType: 'PLASMA',
      chapterId: 'CH001',
    },
    {
      shipmentNo: 'SHP002',
      consigneeId: 'CONS002',
      consigneeName: 'XYZ Medical',
      customerId: 'CUST002',
      shipmentDate: '2024-03-16T00:00:00Z',
      shipmentStatus: 'P',
      shipmentType: 'PLASMA',
      chapterId: 'CH001',
    },
  ];

  const mockShipmentDetails: RegeneratePlasmaFileShipmentDto = {
    shipmentNo: 'SHP001',
    consigneeId: 'CONS001',
    consigneeName: 'ABC Plasma Center',
    customerId: 'CUST001',
    address1: '123 Main Street',
    address2: 'Suite 100',
    address3: null,
    city: 'Springfield',
    state: 'IL',
    zip: '62701',
    country: 'USA',
    zone: 'Z1',
    carrier: 'FEDEX',
    carrierDescription: 'Federal Express',
    trackNo: 'TRACK123456',
    flightNo: 'FL789',
    shipmentDate: '2024-03-15T00:00:00Z',
    shipmentStatus: 'P',
    shipmentType: 'PLASMA',
    plasmaFileType: 'XML',
    chapterId: 'CH001',
  };

  const mockRegenerateResponse: RegeneratePlasmaFileResponseDto = {
    success: true,
    message: 'Electronic Plasma File generated successfully',
    shipmentNo: 'SHP001',
    fileType: 'XML',
    fileName: 'SHP001.xml',
    statusCode: '4016',
  };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('RegenerateElectronicPlasmaFileService', [
      'getPendingShipments',
      'getShipmentDetails',
      'getActiveCarriers',
      'regeneratePlasmaFile',
    ]);
    headerServiceSpy = createMockHeaderService();
    snackbarServiceSpy = createMockSnackbarService();
    dialogSpy = createMockMatDialog();

    serviceSpy.getPendingShipments.and.returnValue(of(mockPendingShipments));
    serviceSpy.getShipmentDetails.and.returnValue(of(mockShipmentDetails));
    serviceSpy.regeneratePlasmaFile.and.returnValue(of(mockRegenerateResponse));

    const pageHeaderServiceMock = {
      pageHeaderData: signal({ title: 'Regenerate Electronic Plasma File', subtitle: 'Test subtitle' }),
    };



      TestBed.configureTestingModule({
      imports: [RegenerateElectronicPlasmaFileComponent, NoopAnimationsModule, MatDialogModule],
      providers: [
        { provide: RegenerateElectronicPlasmaFileService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
      ],
    })
    .overrideProvider(MatDialog, { useValue: dialogSpy });


    


      serviceSpy.getPendingShipments.calls.reset();


      serviceSpy.getShipmentDetails.calls.reset();


      serviceSpy.getActiveCarriers.calls.reset();


      serviceSpy.regeneratePlasmaFile.calls.reset();


      serviceSpy.getPendingShipments.and.returnValue(of(mockPendingShipments));


      serviceSpy.getShipmentDetails.and.returnValue(of(mockShipmentDetails));


      serviceSpy.regeneratePlasmaFile.and.returnValue(of(mockRegenerateResponse));


    fixture = TestBed.createComponent(RegenerateElectronicPlasmaFileComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should load pending shipments on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getPendingShipments).toHaveBeenCalled();
      expect(component.pendingShipments()).toEqual(mockPendingShipments);
    }));

  });
  describe('Shipment Selection', () => {
    it('should load shipment details when shipment is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ shipmentNo: 'SHP001' });
      tick();

      expect(serviceSpy.getShipmentDetails).toHaveBeenCalledWith('SHP001');
      expect(component.selectedShipment()).toEqual(mockShipmentDetails);
    }));



    it('should display shipment details as read-only labels', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ shipmentNo: 'SHP001' });
      fixture.detectChanges();
      tick();

      const labels = fixture.debugElement.queryAll(By.css('.field-label'));
      expect(labels.length).toBeGreaterThan(0);

      const consigneeIdLabel = labels.find((label) =>
        label.nativeElement.textContent.includes('Consignee ID')
      );
      expect(consigneeIdLabel).toBeTruthy();
      expect(consigneeIdLabel?.nativeElement.textContent).toContain('CONS001');
    }));
  });

  describe('Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should require shipment number', () => {
      component.form.patchValue({ shipmentNo: '' });
      expect(component.form.get('shipmentNo')?.hasError('required')).toBeTrue();
    });

    it('should require track number', () => {
      component.form.patchValue({ trackNo: '' });
      expect(component.form.get('trackNo')?.hasError('required')).toBeTrue();
    });

    it('should validate track number max length', () => {
      const longTrackNo = 'A'.repeat(31);
      component.form.patchValue({ trackNo: longTrackNo });
      expect(component.form.get('trackNo')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate flight number max length', () => {
      const longFlightNo = 'F'.repeat(7);
      component.form.patchValue({ flightNo: longFlightNo });
      expect(component.form.get('flightNo')?.hasError('maxlength')).toBeTrue();
    });


  });

  describe('CLEAR ALL Button', () => {
    it('should reset form when CLEAR ALL is clicked', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ shipmentNo: 'SHP001' });
      tick();
      component.form.patchValue({ trackNo: 'TRACK123456' });

      component.onClearAll();
      fixture.detectChanges();

      expect(component.form.get('shipmentNo')?.value).toBeNull();
      expect(component.form.get('trackNo')?.value).toBeNull();
      expect(component.selectedShipment()).toBeNull();
    }));




  });

});
