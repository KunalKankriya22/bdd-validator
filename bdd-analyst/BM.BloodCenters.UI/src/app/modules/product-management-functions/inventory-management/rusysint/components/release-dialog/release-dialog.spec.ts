import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { TranslateModule } from '@ngx-translate/core';
import { ReleaseDialog } from './release-dialog';
import { ReleaseProductQuarantineApiService } from '../../services/release-product-quarantine-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { QuarantineProduct } from '../../models/release-product-quarantine.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ReleaseDialog', () => {
  let headerSpy: any;
  let component: ReleaseDialog;
  let fixture: ComponentFixture<ReleaseDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ReleaseDialog>>;
  let apiServiceSpy: jasmine.SpyObj<ReleaseProductQuarantineApiService>;
  const mockProduct: QuarantineProduct = {
    unitId: 'C1234567',
    productCode: 'RBC',
    aliquot: '00',
    chapterId: 'CH01',
    collDate: '2024-04-25T00:00:00Z',
    expDate: '2027-12-25T00:00:00Z',
    bloodType: 'O',
    inventoryClass: 'QU',
    reasonCode: 'R01',
    reasonDesc: 'Quality Control Hold',
    locationId: 'W01-D01-R01-T01',
    productDesc: 'Red Blood Cells',
    aboDesc: 'O Positive'
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('ReleaseProductQuarantineApiService', ['releaseProduct']);
    const snackbarSpy = createMockSnackbarService();
    headerSpy = createMockHeaderService();
      TestBed.configureTestingModule({
      imports: [ReleaseDialog, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useFactory: () => ({ product: { ...mockProduct }, quarantineType: 'QU' }) },
        { provide: ReleaseProductQuarantineApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy }
      ]
    });


    


      dialogRefSpy.close.calls.reset();


      apiServiceSpy.releaseProduct.calls.reset();


      headerSpy.getCurrentWarehouseId.calls.reset();
    fixture = TestBed.createComponent(ReleaseDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should initialize form with restock as default', () => {
    expect(component.form.get('releaseAction')?.value).toBe('restock');
  });



  it('should update validators when release action changes', () => {
    // Switch to reject - rejectCode becomes required, location clears
    component.form.get('releaseAction')?.setValue('reject');

    const rejectCodeControl = component.form.get('rejectCode');
    const locationControl = component.form.get('locationId');

    expect(rejectCodeControl?.hasError('required')).toBeTrue();
    expect(locationControl?.hasError('required')).toBeFalse();

    // Switch back to restock - location becomes required, rejectCode clears
    component.form.get('releaseAction')?.setValue('restock');

    expect(locationControl?.hasError('required')).toBeTrue();
    expect(rejectCodeControl?.hasError('required')).toBeFalse();
  });

  it('should detect expired products', () => {
    const expiredProduct: QuarantineProduct = {
      ...mockProduct,
      expDate: '2020-01-01T00:00:00Z'
    };

    component.data.product = expiredProduct;
    expect(component.isExpired).toBeTrue();
    expect(component.canRestock).toBeFalse();
  });

  it('should allow restocking non-expired products', () => {
    expect(component.isExpired).toBeFalse();
    expect(component.canRestock).toBeTrue();
  });





  it('should prevent release if form is invalid', () => {
    component.form.patchValue({ releaseAction: 'restock', locationId: null });
    component.onRelease();

    expect(component.submitted()).toBeTrue();
    expect(apiServiceSpy.releaseProduct).not.toHaveBeenCalled();
  });



  it('should submit restock request successfully', (done) => {
    const mockLocation = {
      warehouseId: 'W01',
      deviceType: 'FR',
      deviceNumber: 'D01',
      rackNumber: 'R01',
      shelfNumber: '01',
      trayId: 'T01',
      locationId: 'W01-D01-R01-T01',
      warehouseDesc: 'Main Warehouse',
      deviceDesc: 'Freezer 1',
      trayDesc: null,
      trayCapacity: 24,
      currentCount: 10,
      productType: 'RBC',
      bloodType: 'O',
      storageClass: 'A',
      mixAbo: 'N',
      mixProduct: 'N'
    };

    component.selectedLocation = mockLocation;
    component.form.patchValue({
      releaseAction: 'restock',
      locationId: mockLocation.locationId
    });

    apiServiceSpy.releaseProduct.and.returnValue(of({
      unitId: 'C1234567',
      productCode: 'RBC',
      aliquot: '00'
    }));

    component.onRelease();

    setTimeout(() => {
      expect(apiServiceSpy.releaseProduct).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
      done();
    }, 100);
  });

  it('should submit reject request successfully', (done) => {
    component.form.patchValue({
      releaseAction: 'reject',
      rejectCode: 'EXPIRED'
    });

    apiServiceSpy.releaseProduct.and.returnValue(of({
      unitId: 'C1234567',
      productCode: 'RBC',
      aliquot: '00'
    }));

    component.onRelease();

    setTimeout(() => {
      expect(apiServiceSpy.releaseProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({
          restockFlag: 'N',
          rejectCode: 'EXPIRED'
        })
      );
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
      done();
    }, 100);
  });



  it('should handle cancel', () => {
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalledWith(null);
  });

  it('should clear selected location', () => {
    component.selectedLocation = {
      warehouseId: 'W01',
      deviceType: 'FR',
      deviceNumber: 'D01',
      rackNumber: 'R01',
      shelfNumber: '01',
      trayId: 'T01',
      locationId: 'W01-D01-R01-T01',
      warehouseDesc: null,
      deviceDesc: null,
      trayDesc: null,
      trayCapacity: null,
      currentCount: null,
      productType: null,
      bloodType: null,
      storageClass: null,
      mixAbo: null,
      mixProduct: null
    };

    component.onClearLocation();

    expect(component.selectedLocation).toBeNull();
    expect(component.form.get('locationId')?.value).toBeNull();
  });

  it('should format reject codes', () => {
    const formatted = component.formatRejectCode(component.rejectCodes[0]);
    expect(formatted).toContain('EXPIRED');
    expect(formatted).toContain('Product Expired');
  });
});
