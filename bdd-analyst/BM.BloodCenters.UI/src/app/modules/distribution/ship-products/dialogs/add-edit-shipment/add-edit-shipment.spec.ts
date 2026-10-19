import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';

import { AddEditShipmentDialog, AddEditShipmentDialogData } from './add-edit-shipment';
import { ShipProductsService } from '../../services/ship-products.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { SHIPMENT_FIELD_LENGTHS } from '../../models/ship-products.model';

describe('AddEditShipmentDialog', () => {
  let component: AddEditShipmentDialog;
  let fixture: ComponentFixture<AddEditShipmentDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEditShipmentDialog>>;
  let serviceSpy: jasmine.SpyObj<ShipProductsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockConsigneeOptions = [
    { value: 'CONS001', label: 'CONS001', description: 'Test Hospital' },
    { value: 'CONS002', label: 'CONS002', description: 'City Clinic' },
  ];

  const mockCarrierOptions = [
    { value: 'FEDEX', label: 'FEDEX', description: 'Federal Express' },
    { value: 'UPS', label: 'UPS', description: 'United Parcel Service' },
  ];

  const mockShipmentResponse = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [{
      shipmentNo: 'SHIP001',
      chapterId: '0001',
      consigneeId: 'CONS001',
      consigneeName: 'Test Hospital',
      address1: '123 Main St',
      address2: null,
      city: 'Dallas',
      state: 'TX',
      zip: '75235',
      country: 'USA',
      shipmentDate: '2024-05-30T10:30:00Z',
      shipmentStatus: 'OP',
      shippedByUserId: 'USER01',
      shipmentType: 'RE',
      carrier: 'FEDEX',
      carrierDescription: 'Federal Express',
      trackNo: 'TRACK123456',
      flightNo: 'FL001',
      invoicePrintedDate: null,
      programId: 'SHIPMENT',
    }],
  };

  function createComponent(data: AddEditShipmentDialogData) {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    snackbarServiceSpy = createMockSnackbarService();
    serviceSpy = jasmine.createSpyObj('ShipProductsService', [
      'getConsigneeOptions',
      'getCarrierOptions',
      'getShipmentByNumber',
      'updateShipment',
    ]);

    serviceSpy.getConsigneeOptions.and.returnValue(of(mockConsigneeOptions));
    serviceSpy.getCarrierOptions.and.returnValue(of(mockCarrierOptions));
    serviceSpy.getShipmentByNumber.and.returnValue(of(mockShipmentResponse as any));
    serviceSpy.updateShipment.and.returnValue(of({ success: true, statusCode: 200, message: 'Updated', data: undefined as any }));

    TestBed.configureTestingModule({
      imports: [AddEditShipmentDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        importProvidersFrom(TranslateModule.forRoot()),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ShipProductsService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddEditShipmentDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('Add Mode', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
    });

    it('should create in add mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBeFalse();
      expect(component.dialogTitle).toBe('Add New Shipment');
    });

    it('should have correct form structure with all controls', () => {
      expect(component.shipmentForm).toBeTruthy();
      expect(component.f['consigneeId']).toBeTruthy();
      expect(component.f['carrier']).toBeTruthy();
      expect(component.f['trackNo']).toBeTruthy();
      expect(component.f['flightNo']).toBeTruthy();
    });

    it('should have consigneeId enabled in add mode', () => {
      expect(component.f['consigneeId'].disabled).toBeFalse();
    });

    it('should load dropdown options on init', () => {
      expect(serviceSpy.getConsigneeOptions).toHaveBeenCalled();
      expect(serviceSpy.getCarrierOptions).toHaveBeenCalled();
    });

    it('should not load shipment data in add mode', () => {
      expect(serviceSpy.getShipmentByNumber).not.toHaveBeenCalled();
    });

    it('should validate required consigneeId', () => {
      component.f['consigneeId'].setValue('');
      expect(component.f['consigneeId'].hasError('required')).toBeTrue();
    });

    it('should validate required carrier', () => {
      component.f['carrier'].setValue('');
      expect(component.f['carrier'].hasError('required')).toBeTrue();
    });

    it('should validate required trackNo', () => {
      component.f['trackNo'].setValue('');
      expect(component.f['trackNo'].hasError('required')).toBeTrue();
    });

    it('should not require flightNo', () => {
      component.f['flightNo'].setValue('');
      expect(component.f['flightNo'].valid).toBeTrue();
    });

    it('should enforce maxLength for consigneeId', () => {
      const longValue = 'A'.repeat(SHIPMENT_FIELD_LENGTHS.CONSIGNEE_ID + 1);
      component.f['consigneeId'].setValue(longValue);
      expect(component.f['consigneeId'].hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength for carrier', () => {
      const longValue = 'A'.repeat(SHIPMENT_FIELD_LENGTHS.CARRIER + 1);
      component.f['carrier'].setValue(longValue);
      expect(component.f['carrier'].hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength for trackNo', () => {
      const longValue = 'A'.repeat(SHIPMENT_FIELD_LENGTHS.TRACK_NO + 1);
      component.f['trackNo'].setValue(longValue);
      expect(component.f['trackNo'].hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength for flightNo', () => {
      const longValue = 'A'.repeat(SHIPMENT_FIELD_LENGTHS.FLIGHT_NO + 1);
      component.f['flightNo'].setValue(longValue);
      expect(component.f['flightNo'].hasError('maxlength')).toBeTrue();
    });

    it('should not submit when form is invalid', () => {
      component.shipmentForm.patchValue({ consigneeId: '', carrier: '', trackNo: '' });
      component.onSubmit();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('should close dialog with pendingData on create and convert trackNo/flightNo to uppercase', () => {
      component.shipmentForm.patchValue({
        consigneeId: 'CONS001',
        carrier: 'FEDEX',
        trackNo: 'track123',
        flightNo: 'fl001',
      });
      component.onSubmit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith(jasmine.objectContaining({
        pendingData: jasmine.objectContaining({
          consigneeId: 'CONS001',
          carrier: 'FEDEX',
          trackNo: 'TRACK123',
          flightNo: 'FL001',
        }),
      }));
    });

    it('should include consigneeInfo and carrierInfo in result', () => {
      component.shipmentForm.patchValue({
        consigneeId: 'CONS001',
        carrier: 'FEDEX',
        trackNo: 'TRACK123',
        flightNo: '',
      });
      component.onSubmit();

      const callArg = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(callArg.consigneeInfo).toEqual(mockConsigneeOptions[0]);
      expect(callArg.carrierInfo).toEqual(mockCarrierOptions[0]);
    });

    it('should set flightNo to null when empty on create', () => {
      component.shipmentForm.patchValue({
        consigneeId: 'CONS001',
        carrier: 'FEDEX',
        trackNo: 'TRACK123',
        flightNo: '',
      });
      component.onSubmit();

      const callArg = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(callArg.pendingData.flightNo).toBeNull();
    });

    it('should close with null on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      createComponent({ mode: 'edit', shipmentNo: 'SHIP001' });
    });

    it('should create in edit mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBeTrue();
      expect(component.dialogTitle).toBe('Edit Shipment');
    });

    it('should disable consigneeId in edit mode', () => {
      expect(component.f['consigneeId'].disabled).toBeTrue();
    });

    it('should load shipment data in edit mode', () => {
      expect(serviceSpy.getShipmentByNumber).toHaveBeenCalledWith('SHIP001');
    });

    it('should populate form with shipment data', () => {
      const rawValue = component.shipmentForm.getRawValue();
      expect(rawValue.consigneeId).toBe('CONS001');
      expect(rawValue.carrier).toBe('FEDEX');
      expect(rawValue.trackNo).toBe('TRACK123456');
      expect(rawValue.flightNo).toBe('FL001');
    });

    it('should call updateShipment on submit and convert to uppercase', () => {
      component.shipmentForm.patchValue({
        carrier: 'UPS',
        trackNo: 'newtrack',
        flightNo: 'nf002',
      });
      component.onSubmit();

      expect(serviceSpy.updateShipment).toHaveBeenCalledWith('SHIP001', jasmine.objectContaining({
        carrier: 'UPS',
        trackNo: 'NEWTRACK',
        flightNo: 'NF002',
      }));
    });

    it('should close dialog with success on successful update', () => {
      component.shipmentForm.patchValue({
        carrier: 'UPS',
        trackNo: 'NEWTRACK',
        flightNo: '',
      });
      component.onSubmit();

      expect(dialogRefSpy.close).toHaveBeenCalledWith({ success: true, shipmentNo: 'SHIP001' });
    });

    it('should show error on update failure', () => {
      serviceSpy.updateShipment.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to update shipment' } }))
      );

      component.shipmentForm.patchValue({
        carrier: 'UPS',
        trackNo: 'NEWTRACK',
        flightNo: '',
      });
      component.onSubmit();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update shipment');
    });

    it('should show generic error when error has no message', () => {
      serviceSpy.updateShipment.and.returnValue(
        throwError(() => ({}))
      );

      component.shipmentForm.patchValue({
        carrier: 'UPS',
        trackNo: 'NEWTRACK',
        flightNo: '',
      });
      component.onSubmit();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update shipment');
    });
  });

  describe('Edit Mode - load shipment error', () => {
    it('should show error when loading shipment data fails', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      snackbarServiceSpy = createMockSnackbarService();
      serviceSpy = jasmine.createSpyObj('ShipProductsService', [
        'getConsigneeOptions',
        'getCarrierOptions',
        'getShipmentByNumber',
        'updateShipment',
      ]);

      serviceSpy.getConsigneeOptions.and.returnValue(of(mockConsigneeOptions));
      serviceSpy.getCarrierOptions.and.returnValue(of(mockCarrierOptions));
      serviceSpy.getShipmentByNumber.and.returnValue(
        throwError(() => ({ error: { message: 'Shipment not found' } }))
      );

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditShipmentDialog, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          importProvidersFrom(TranslateModule.forRoot()),
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', shipmentNo: 'INVALID' } },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ShipProductsService, useValue: serviceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AddEditShipmentDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Shipment not found');
    });
  });

  describe('Edit Mode - empty response data', () => {
    it('should handle empty response data array', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      snackbarServiceSpy = createMockSnackbarService();
      serviceSpy = jasmine.createSpyObj('ShipProductsService', [
        'getConsigneeOptions',
        'getCarrierOptions',
        'getShipmentByNumber',
        'updateShipment',
      ]);

      serviceSpy.getConsigneeOptions.and.returnValue(of(mockConsigneeOptions));
      serviceSpy.getCarrierOptions.and.returnValue(of(mockCarrierOptions));
      serviceSpy.getShipmentByNumber.and.returnValue(of({ success: true, statusCode: 200, message: 'Success', data: [] }));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditShipmentDialog, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          importProvidersFrom(TranslateModule.forRoot()),
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'edit', shipmentNo: 'SHIP001' } },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ShipProductsService, useValue: serviceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AddEditShipmentDialog);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Should not patch form - form stays empty
      expect(component.shipmentForm.getRawValue().carrier).toBe('');
    });
  });

  describe('Dropdown loading errors', () => {
    it('should handle consignee options loading error', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      snackbarServiceSpy = createMockSnackbarService();
      serviceSpy = jasmine.createSpyObj('ShipProductsService', [
        'getConsigneeOptions',
        'getCarrierOptions',
        'getShipmentByNumber',
        'updateShipment',
      ]);

      serviceSpy.getConsigneeOptions.and.returnValue(throwError(() => new Error('fail')));
      serviceSpy.getCarrierOptions.and.returnValue(of(mockCarrierOptions));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditShipmentDialog, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          importProvidersFrom(TranslateModule.forRoot()),
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ShipProductsService, useValue: serviceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AddEditShipmentDialog);
      component = fixture.componentInstance;

      // Should not throw
      expect(() => fixture.detectChanges()).not.toThrow();
    });

    it('should handle carrier options loading error', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      snackbarServiceSpy = createMockSnackbarService();
      serviceSpy = jasmine.createSpyObj('ShipProductsService', [
        'getConsigneeOptions',
        'getCarrierOptions',
        'getShipmentByNumber',
        'updateShipment',
      ]);

      serviceSpy.getConsigneeOptions.and.returnValue(of(mockConsigneeOptions));
      serviceSpy.getCarrierOptions.and.returnValue(throwError(() => new Error('fail')));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AddEditShipmentDialog, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          importProvidersFrom(TranslateModule.forRoot()),
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ShipProductsService, useValue: serviceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(AddEditShipmentDialog);
      component = fixture.componentInstance;

      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
    });

    it('should complete destroy$ subject', () => {
      const destroyNext = spyOn((component as any).destroy$, 'next');
      const destroyComplete = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroyNext).toHaveBeenCalled();
      expect(destroyComplete).toHaveBeenCalled();
    });
  });

  describe('f getter', () => {
    beforeEach(() => {
      createComponent({ mode: 'add' });
    });

    it('should return form controls', () => {
      expect(component.f).toBe(component.shipmentForm.controls);
    });
  });
});
