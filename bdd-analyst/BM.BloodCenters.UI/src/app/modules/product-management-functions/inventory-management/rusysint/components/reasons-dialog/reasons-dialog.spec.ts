import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { TranslateModule } from '@ngx-translate/core';
import { ReasonsDialog, ReasonsDialogData } from './reasons-dialog';
import { ReleaseProductQuarantineApiService } from '../../services/release-product-quarantine-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { QuarantineProduct, QuarantineReason } from '../../models/release-product-quarantine.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ReasonsDialog', () => {
  let component: any;
  let fixture: ComponentFixture<ReasonsDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ReasonsDialog>>;
  let apiServiceSpy: jasmine.SpyObj<ReleaseProductQuarantineApiService>;

  const mockProduct: QuarantineProduct = {
    unitId: 'C1234567',
    productCode: 'RBC',
    aliquot: '00',
    chapterId: 'CH01',
    collDate: '2024-04-25T00:00:00Z',
    expDate: '2024-12-25T00:00:00Z',
    bloodType: 'O',
    inventoryClass: 'QU',
    reasonCode: 'R01',
    reasonDesc: 'Quality Control Hold',
    locationId: 'W01-D01-R01-T01',
    productDesc: 'Red Blood Cells',
    aboDesc: 'O Positive'
  };

  const mockReasons: QuarantineReason[] = [
    {
      unitId: 'C1234567',
      productCode: 'RBC',
      aliquot: '00',
      chapterId: 'CH01',
      reasonCode: 'R01',
      reasonDesc: 'Quality Control Hold',
      createdDate: '2024-05-01T10:30:00Z'
    },
    {
      unitId: 'C1234567',
      productCode: 'RBC',
      aliquot: '00',
      chapterId: 'CH01',
      reasonCode: 'R02',
      reasonDesc: 'Pending Test Results',
      createdDate: '2024-05-02T14:15:00Z'
    }
  ];

  const mockDialogData: ReasonsDialogData = {
    product: mockProduct
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('ReleaseProductQuarantineApiService', [
      'getQuarantineReasons',
      'removeQuarantineReason'
    ]);
    const snackbarSpy = createMockSnackbarService();

    apiServiceSpy.getQuarantineReasons.and.returnValue(of(mockReasons));



      TestBed.configureTestingModule({
      imports: [ReasonsDialog, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: ReleaseProductQuarantineApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy }
      ]
    });


    


      dialogRefSpy.close.calls.reset();


      apiServiceSpy.getQuarantineReasons.calls.reset();


      apiServiceSpy.removeQuarantineReason.calls.reset();


      apiServiceSpy.getQuarantineReasons.and.returnValue(of(mockReasons));


    fixture = TestBed.createComponent(ReasonsDialog);
    component = fixture.componentInstance;


    });


  it('should load reasons on init', (done) => {
    fixture.detectChanges();

    setTimeout(() => {
      expect(apiServiceSpy.getQuarantineReasons).toHaveBeenCalledWith(
        'C1234567',
        'RBC',
        '00'
      );
      expect(component.reasons().length).toBe(2);
      expect(component.loading()).toBeFalse();
      done();
    }, 100);
  });

  it('should handle error loading reasons', (done) => {
    apiServiceSpy.getQuarantineReasons.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    fixture.detectChanges();

    setTimeout(() => {
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeTruthy();
      done();
    }, 100);
  });





  it('should detect if has reasons', () => {
    component.reasons.set(mockReasons);
    expect(component.hasReasons).toBeTrue();

    component.reasons.set([]);
    expect(component.hasReasons).toBeFalse();
  });



  it('should remove reason when confirmed', (done) => {
    const confirmDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    confirmDialogRef.afterClosed.and.returnValue(of(true));
    spyOn(component['matDialog'], 'open').and.returnValue(confirmDialogRef);
    apiServiceSpy.removeQuarantineReason.and.returnValue(of(true));
    apiServiceSpy.getQuarantineReasons.and.returnValue(of([mockReasons[1]]));

    component.onRemoveReason(mockReasons[0]);

    setTimeout(() => {
      expect(apiServiceSpy.removeQuarantineReason).toHaveBeenCalledWith(
        'C1234567',
        'RBC',
        '00',
        'R01'
      );
      done();
    }, 100);
  });



  it('should track removing state', () => {
    component.removingReasonCode.set('R01');
    expect(component.isRemoving('R01')).toBeTrue();
    expect(component.isRemoving('R02')).toBeFalse();
  });





  it('should display table columns correctly', () => {
    expect(component.displayedColumns).toEqual([
      'reasonCode',
      'reasonDesc',
      'createdDate',
      'actions'
    ]);
  });
});
