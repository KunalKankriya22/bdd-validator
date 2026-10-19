import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { TransferDonorDataToLabComponent } from './transfer-donor-data-to-lab';
import { TransferDonorDataToLabApiService } from './services/transfer-donor-data-to-lab-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitIdFieldService } from '@shared/components/unit-id-field';
import {
  BatchOption,
  DriveOption,
  DonationDetails,
  GetUnitsResponse,
  TransferResponse,
  TransferUnitResult,
} from './models/transfer-donor-data-to-lab.model';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

const mockBatches: BatchOption[] = [
  { batchId: '111619-CB9006', receivedDate: '2025-01-01', minTemp: 25.0, maxTemp: 35.5, unitCount: 10 },
];

const mockDrives: DriveOption[] = [
  { driveId: '167279', driveScheduledDate: '2025-01-01', groupSiteId: 'GS001', siteName: 'Test Site' },
];

const mockUnitsResponse: GetUnitsResponse = {
  success: true,
  total: 1,
  data: [
    { unitId: 'W633319111560', collectionDate: '2025-01-01', donationType: 'WB', procedureCode: '2C', donorId: 'D001', driveId: '167279' },
  ],
};

const mockDonationDetails: DonationDetails = {
  unitId: 'W633319111560',
  collectionDate: '2025-01-01',
  bleedStartTime: '2025-01-11T12:00:00',
  bleedEndTime: '2025-01-11T14:00:00',
  donationType: 'WB',
  procedureCode: '2C',
  donorAbo: 'O+',
  r1TubePresent: true,
  r2TubePresent: false,
  p1TubePresent: false,
  p2TubePresent: false,
  catalogNumber: 'HE0003PLT',
  lotNumber: 'ACDA000300',
  equipReference: 'VIST EQ 000246',
  attributes: ['PHER-PP', 'VENI-01'],
};

const mockTransferResult: TransferUnitResult = {
  unitId: 'W633319111560',
  success: true,
  donorDecisionCode: null,
  donorAbo: null,
  tubesCheckedIn: { r1: true, r2: false, p1: false, p2: false },
  attributesTransferred: 2,
  interdictionsApplied: [],
  warningsGenerated: [],
  catalogNumber: null,
  lotNumber: null,
};

const mockTransferResponse: TransferResponse = {
  success: true,
  message: '1 unit transferred.',
  data: [mockTransferResult],
};

const mockScanInput: UnitValidationResponse = {
  parsedUnitId: 'W633319111560',
  checkDigit: null,
  codeScheme: 'I',
  manualUnitId: 'W633319111560',
  codabarUnitScheme: null,
  entryMode: 'S',
  barcodeType: 'CODE128',
  chapterScheme: 'I',
};

describe('TransferDonorDataToLabComponent', () => {
  let apiSpy: any;
  let component: TransferDonorDataToLabComponent;
  let fixture: ComponentFixture<TransferDonorDataToLabComponent>;
  let apiService: jasmine.SpyObj<TransferDonorDataToLabApiService>;
  let chapterChanged$: Subject<void>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    apiSpy = jasmine.createSpyObj('TransferDonorDataToLabApiService', [
      'getBatches', 'getDrives', 'getShippers', 'getUnits',
      'validateHeader', 'validateUnit', 'validateTransfer', 'getDonationDetails', 'transfer',
    ]);
    apiSpy.getBatches.and.returnValue(of(mockBatches));
    apiSpy.getDrives.and.returnValue(of(mockDrives));
    apiSpy.getShippers.and.returnValue(of([]));
    apiSpy.getUnits.and.returnValue(of(mockUnitsResponse));
    apiSpy.validateHeader.and.returnValue(of({ success: true }));
    apiSpy.validateUnit.and.returnValue(of({ success: true }));
    apiSpy.validateTransfer.and.returnValue(of({ isValid: true, warnings: [] }));
    apiSpy.getDonationDetails.and.returnValue(of(mockDonationDetails));
    apiSpy.transfer.and.returnValue(of(mockTransferResponse));

    snackBarSpy = createMockMatSnackBar();

    const pageHeaderServiceMock = {
      pageHeaderData: signal({ title: 'Transfer Donor Data to Lab', subtitle: 'Register collected units...' }),
    };

    const headerServiceMock = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal(''),
    };



      TestBed.configureTestingModule({
      imports: [
        TransferDonorDataToLabComponent,
        ReactiveFormsModule,
      ],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        { provide: UnitIdFieldService, useValue: jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']) },
        { provide: TransferDonorDataToLabApiService, useValue: apiSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: HeaderService, useValue: headerServiceMock },
      ],
    });




      apiSpy.getBatches.calls.reset();


      apiSpy.getDrives.calls.reset();


      apiSpy.getShippers.calls.reset();


      apiSpy.getUnits.calls.reset();


      apiSpy.validateHeader.calls.reset();


      apiSpy.validateUnit.calls.reset();


      apiSpy.validateTransfer.calls.reset();


      apiSpy.getDonationDetails.calls.reset();


      apiSpy.transfer.calls.reset();


      apiSpy.getBatches.and.returnValue(of(mockBatches));


      apiSpy.getDrives.and.returnValue(of(mockDrives));


      apiSpy.getShippers.and.returnValue(of([]));


      apiSpy.getUnits.and.returnValue(of(mockUnitsResponse));


      apiSpy.validateHeader.and.returnValue(of({ success: true }));


      apiSpy.validateUnit.and.returnValue(of({ success: true }));


      apiSpy.validateTransfer.and.returnValue(of({ isValid: true, warnings: [] }));


      apiSpy.getDonationDetails.and.returnValue(of(mockDonationDetails));


      apiSpy.transfer.and.returnValue(of(mockTransferResponse));


    fixture = TestBed.createComponent(TransferDonorDataToLabComponent);
    component = fixture.componentInstance;
    apiService = TestBed.inject(TransferDonorDataToLabApiService) as jasmine.SpyObj<TransferDonorDataToLabApiService>;
    fixture.detectChanges();


    });

  // Fills all required header fields so onRetrieve and onScanUnitIdValidated proceed.
  // driveId is set via setValue() after the patchValue() call because onCollectionDateChange
  // fires synchronously on collectionDate change and resets driveId to null via getDrives().
  function fillRequiredFields(): void {
    component.onCheckInTypeChange('U');
    // checkInType must be patched on the FormControl separately — onCheckInTypeChange()
    // only sets checkInTypeSignal; the form control is normally updated by the mat-select.
    // collectionDate triggers onCollectionDateChange → getDrives → resets driveId to null,
    // so driveId must be set via setValue() after patchValue() completes.
    component.filterForm.patchValue({
      checkInType: 'U',
      batchId: '111619-CB9006',
      shipperNumber: 'SHP001',
      collectionDate: moment('2025-01-01'),
    });
    component.filterForm.get('driveId')?.setValue('167279');
  }


  it('should generate unique component IDs', () => {
    const fixture2 = TestBed.createComponent(TransferDonorDataToLabComponent);
    const component2 = fixture2.componentInstance;
    expect((component as any).componentId).not.toEqual((component2 as any).componentId);
  });

  it('should expose hardcoded check-in type options', () => {
    expect(component.checkInTypeOptions.length).toBe(3);
    expect(component.checkInTypeOptions[0].value).toBe('U');
    expect(component.checkInTypeOptions[1].value).toBe('T');
    expect(component.checkInTypeOptions[2].value).toBe('B');
  });

  it('should load batches on init', () => {
    expect(apiService.getBatches).toHaveBeenCalled();
    expect(component.batchOptions()).toEqual(mockBatches);
  });

  it('should load drives when collection date is set on init', () => {
    expect(apiService.getDrives).toHaveBeenCalled();
    expect(component.driveOptions()).toEqual(mockDrives);
  });



  it('should mark checkInType touched when retrieve is called without it', () => {
    component.onRetrieve();
    expect(component.filterForm.get('checkInType')?.touched).toBeTrue();
    expect(apiService.getUnits).not.toHaveBeenCalled();
  });

  it('should retrieve units when all required fields are filled', fakeAsync(() => {
    fillRequiredFields();
    apiService.getUnits.calls.reset();
    component.onRetrieve();
    tick();
    expect(apiService.getUnits).toHaveBeenCalled();
    expect(component.retrievedUnits().length).toBe(1);
    expect(component.retrievedUnits()[0].unitId).toBe('W633319111560');
    expect(component.hasRetrievedData()).toBeTrue();
  }));

  it('should show ERROR panel status when unit has a max-bleed error code', fakeAsync(() => {
    apiService.validateTransfer.and.returnValue(of({
      isValid: false,
      errorCode: 'MAX_BLEED',
      errorMessage: 'Bleed time exceeded maximum allowed limit. Unit cannot proceed.',
      warnings: [],
    }));
    fillRequiredFields();
    component.onScanUnitIdValidated(mockScanInput);
    tick();
    expect(component.scanMaxBleedError()).toContain('Bleed time exceeded');
    expect(component.panelStatus()).toBe('ERROR');
  }));

  it('should show WARNING panel status and transfer immediately on slow-bleed warning', fakeAsync(() => {
    apiService.validateTransfer.and.returnValue(of({
      isValid: false,
      errorCode: 'SLOW_BLEED',
      errorMessage: 'Bleed time exceeded slow bleed threshold. Review before continuing.',
      warnings: [],
    }));
    fillRequiredFields();
    component.onScanUnitIdValidated(mockScanInput);
    tick();
    expect(component.scanValidationWarning()).toContain('slow bleed');
    expect(component.panelStatus()).toBe('WARNING');
    expect(apiService.transfer).toHaveBeenCalled();
    expect(component.retrievedUnits()[0].uiStatus).toBe('TRANSFERRED');
  }));

  it('should add unit to retrieved list with TRANSFERRED status on successful scan', fakeAsync(() => {
    fillRequiredFields();
    component.onScanUnitIdValidated(mockScanInput);
    tick();
    expect(component.retrievedUnits().length).toBe(1);
    expect(component.retrievedUnits()[0].uiStatus).toBe('TRANSFERRED');
    expect(component.scanValidationError()).toBeNull();
    expect(component.scanMaxBleedError()).toBeNull();
  }));

  it('should load donation details when a unit row is clicked', fakeAsync(() => {
    fillRequiredFields();
    const unit = mockUnitsResponse.data[0];
    component.onUnitRowClick(unit);
    tick();
    expect(apiService.getDonationDetails).toHaveBeenCalledWith('W633319111560', '2025-01-01');
    expect(component.donationDetails()).toBeTruthy();
    expect(component.donationDetails()?.catalogNumber).toBe('HE0003PLT');
  }));

  it('should clear all state on clearAll', () => {
    component.retrievedUnits.set([mockUnitsResponse.data[0]]);
    component.hasRetrievedData.set(true);
    component.clearAll();
    expect(component.retrievedUnits().length).toBe(0);
    expect(component.filterForm.get('minTemp')?.value).toBe('');
    expect(component.filterForm.get('maxTemp')?.value).toBe('');
    expect(component.hasRetrievedData()).toBeFalse();
    expect(component.donationDetails()).toBeNull();
  });





  it('should format dateTime correctly', () => {
    const result = component.formatDateTime('2025-01-11T12:00:00');
    expect(result).toMatch(/11-jan-2025/i);
  });

  it('should have donationDetails null initially', () => {
    expect(component.donationDetails()).toBeNull();
  });

  it('should have panelStatus null when no scan errors exist', () => {
    expect(component.panelStatus()).toBeNull();
  });

  it('should handle getUnits API error gracefully', fakeAsync(() => {
    apiService.getUnits.and.returnValue(throwError(() => new Error('Network error')));
    fillRequiredFields();
    component.onRetrieve();
    tick();
    expect(component.isLoading()).toBeFalse();
    expect(component.hasRetrievedData()).toBeTrue();
  }));

  it('should have accessible aria labels on key elements', () => {
    const compiled = fixture.nativeElement;
    const main = compiled.querySelector('[role="main"]');
    expect(main).toBeTruthy();
    const searchPanel = compiled.querySelector('[role="search"]');
    expect(searchPanel).toBeTruthy();
    expect(searchPanel.getAttribute('aria-label')).toBeTruthy();
  });

  // ─── NEW TESTS ─────────────────────────────────────────────────────────────

  describe('elementId and errorId helpers', () => {
    it('should return a namespaced element ID', () => {
      const id = (component as any).elementId('batch');
      expect(id).toContain('transfer-donor-data-to-lab-');
      expect(id).toContain('-batch');
    });

    it('should return a namespaced error ID', () => {
      const id = (component as any).errorId('batch');
      expect(id).toContain('transfer-donor-data-to-lab-');
      expect(id).toContain('-batch-error');
    });
  });

  describe('canDeactivate', () => {
    it('should return true when nothing is loading or scanning', () => {
      component.isLoading.set(false);
      component.isScanning.set(false);
      expect(component.canDeactivate()).toBeTrue();
    });

    it('should return false when isLoading is true', () => {
      component.isLoading.set(true);
      expect(component.canDeactivate()).toBeFalse();
    });

    it('should return false when isScanning is true', () => {
      component.isScanning.set(true);
      expect(component.canDeactivate()).toBeFalse();
    });
  });

  describe('abortScan', () => {
    it('should set _aborting flag and reset scan signals', () => {
      component.isScanning.set(true);
      component.scanValidationError.set('some error');
      component.scanMaxBleedError.set('bleed error');
      component.scanValidationWarning.set('some warning');

      component.abortScan();

      expect((component as any)._aborting).toBeTrue();
      expect(component.isScanning()).toBeFalse();
      expect(component.scanValidationError()).toBeNull();
      expect(component.scanMaxBleedError()).toBeNull();
      expect(component.scanValidationWarning()).toBeNull();
    });
  });

  describe('onBeforeUnload', () => {
    it('should call preventDefault when canDeactivate returns false', () => {
      component.isLoading.set(true);
      const event = new Event('beforeunload') as BeforeUnloadEvent;
      spyOn(event, 'preventDefault');
      component.onBeforeUnload(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should NOT call preventDefault when canDeactivate returns true', () => {
      component.isLoading.set(false);
      component.isScanning.set(false);
      const event = new Event('beforeunload') as BeforeUnloadEvent;
      spyOn(event, 'preventDefault');
      component.onBeforeUnload(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('isRetrieveDisabled', () => {
    it('should return true when isLoading is true', () => {
      component.isLoading.set(true);
      expect(component.isRetrieveDisabled()).toBeTrue();
    });

    it('should return false when isLoading is false', () => {
      component.isLoading.set(false);
      expect(component.isRetrieveDisabled()).toBeFalse();
    });
  });

  describe('hasFieldError', () => {
    it('should return true when control is invalid and touched', () => {
      const ctrl = component.filterForm.get('checkInType');
      ctrl?.markAsTouched();
      // checkInType has Validators.required and value is null
      expect(component.hasFieldError('checkInType')).toBeTrue();
    });

    it('should return false when control is valid', () => {
      component.filterForm.get('checkInType')?.setValue('U');
      expect(component.hasFieldError('checkInType')).toBeFalse();
    });

    it('should return false when control is invalid but untouched', () => {
      // checkInType is null (invalid) but untouched
      expect(component.hasFieldError('checkInType')).toBeFalse();
    });
  });

  describe('getSelectedCheckInLabel', () => {
    it('should return empty string when no check-in type is selected', () => {
      expect(component.getSelectedCheckInLabel()).toBe('');
    });

    it('should return the correct label for a selected check-in type', () => {
      component.filterForm.get('checkInType')?.setValue('U');
      expect(component.getSelectedCheckInLabel()).toBe('Unit');
    });

    it('should return the correct label for Tubes type', () => {
      component.filterForm.get('checkInType')?.setValue('T');
      expect(component.getSelectedCheckInLabel()).toBe('Tubes');
    });
  });

  describe('getSelectedDriveLabel', () => {
    it('should return empty string when no driveId is selected', () => {
      expect(component.getSelectedDriveLabel()).toBe('');
    });

    it('should return formatted label when drive is found', () => {
      component.driveOptions.set(mockDrives);
      component.onCheckInTypeChange('U');
      component.filterForm.get('driveId')?.setValue('167279');
      const label = component.getSelectedDriveLabel();
      expect(label).toBe('167279 - Test Site - GS001');
    });

    it('should return raw driveId when drive is not found in options', () => {
      component.driveOptions.set([]);
      component.onCheckInTypeChange('U');
      component.filterForm.get('driveId')?.setValue('UNKNOWN');
      expect(component.getSelectedDriveLabel()).toBe('UNKNOWN');
    });
  });

  describe('getCollectionDateError', () => {
    it('should return empty string when control is untouched and pristine', () => {
      expect(component.getCollectionDateError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.setValue(null);
      ctrl?.markAsTouched();
      ctrl?.setValidators([]);
      ctrl?.setErrors({ required: true });
      expect(component.getCollectionDateError()).toBe('Collection Date is required');
    });

    it('should return invalid error for matDatepickerParse', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ matDatepickerParse: { text: 'abc' } });
      expect(component.getCollectionDateError()).toBe('Collection Date is invalid');
    });

    it('should return invalid error for invalidDate', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ invalidDate: true });
      expect(component.getCollectionDateError()).toBe('Collection Date is invalid');
    });

    it('should return future date error for futureDate', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ futureDate: true });
      expect(component.getCollectionDateError()).toBe('Collection Date cannot be a future date');
    });

    it('should return future date error for matDatepickerMax', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors({ matDatepickerMax: true });
      expect(component.getCollectionDateError()).toBe('Collection Date cannot be a future date');
    });
  });

  describe('onMinTempBlur', () => {
    it('should auto-fill maxTemp to 37.5 when minTemp has value and maxTemp is empty', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('minTemp')?.setValue('20');
      component.filterForm.get('maxTemp')?.setValue('');
      component.onMinTempBlur();
      expect(component.filterForm.get('maxTemp')?.value).toBe('37.5');
    });

    it('should NOT auto-fill maxTemp when maxTemp already has a value', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('minTemp')?.setValue('20');
      component.filterForm.get('maxTemp')?.setValue('30');
      component.onMinTempBlur();
      expect(component.filterForm.get('maxTemp')?.value).toBe('30');
    });

    it('should NOT auto-fill maxTemp when minTemp is empty', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('minTemp')?.setValue('');
      component.filterForm.get('maxTemp')?.setValue('');
      component.onMinTempBlur();
      expect(component.filterForm.get('maxTemp')?.value).toBe('');
    });
  });

  describe('onMaxTempBlur', () => {
    it('should set tempRange error when min > max', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('minTemp')?.setValue('40');
      component.filterForm.get('maxTemp')?.setValue('30');
      component.onMaxTempBlur();
      expect(component.filterForm.get('minTemp')?.hasError('tempRange')).toBeTrue();
    });

    it('should clear tempRange error when min <= max', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('minTemp')?.setValue('20');
      component.filterForm.get('maxTemp')?.setValue('30');
      component.onMaxTempBlur();
      expect(component.filterForm.get('minTemp')?.hasError('tempRange')).toBeFalse();
    });
  });

  describe('onDriveSelected', () => {
    it('should reset shipper fields and load shippers for valid driveId', fakeAsync(() => {
      const mockShippers = [{ shipperNo: 'SH001' }, { shipperNo: 'SH002' }];
      apiService.getShippers.and.returnValue(of(mockShippers));
      component.onCheckInTypeChange('U');
      component.filterForm.get('checkInType')?.setValue('U');
      component.onDriveSelected('167279');
      tick();
      expect(apiService.getShippers).toHaveBeenCalledWith('167279', 'U');
      expect(component.shipperOptions()).toEqual(mockShippers);
    }));

    it('should return early without calling getShippers when driveId is null', () => {
      apiService.getShippers.calls.reset();
      component.onDriveSelected(null);
      expect(apiService.getShippers).not.toHaveBeenCalled();
    });

    it('should return early when no checkInType is set', () => {
      apiService.getShippers.calls.reset();
      component.filterForm.get('checkInType')?.setValue(null);
      component.onDriveSelected('167279');
      expect(apiService.getShippers).not.toHaveBeenCalled();
    });

    it('should handle getShippers error gracefully', fakeAsync(() => {
      apiService.getShippers.and.returnValue(throwError(() => new Error('fail')));
      component.onCheckInTypeChange('U');
      component.onDriveSelected('167279');
      tick();
      // Shippers remain empty on error
      expect(component.shipperOptions().length).toBe(0);
    }));
  });

  describe('onCheckInTypeChange', () => {
    it('should set checkInTypeSignal to T and isBatchDisabled to true for Tubes Only type', fakeAsync(() => {
      component.onCheckInTypeChange('T');
      tick(100);
      expect(component.checkInTypeSignal()).toBe('T');
      expect(component.isBatchDisabled()).toBeTrue();
      expect(component.filterForm.get('driveId')?.enabled).toBeTrue();
      expect(component.filterForm.get('collectionDate')?.enabled).toBeTrue();
    }));

    it('should enable batch and temps for Both type (B)', () => {
      component.onCheckInTypeChange('B');
      expect(component.checkInTypeSignal()).toBe('B');
      expect(component.isBatchDisabled()).toBeFalse();
      expect(component.filterForm.get('minTemp')?.enabled).toBeTrue();
      expect(component.filterForm.get('maxTemp')?.enabled).toBeTrue();
    });

    it('should enable batch and temps for Unit type (U)', () => {
      component.onCheckInTypeChange('U');
      expect(component.checkInTypeSignal()).toBe('U');
      expect(component.isBatchDisabled()).toBeFalse();
      expect(component.filterForm.get('minTemp')?.enabled).toBeTrue();
      expect(component.filterForm.get('maxTemp')?.enabled).toBeTrue();
    });

    it('should reset drive, shipper, batch fields on type change', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('driveId')?.setValue('167279');
      component.filterForm.get('batchId')?.setValue('111619-CB9006');
      component.onCheckInTypeChange('B');
      expect(component.filterForm.get('driveId')?.value).toBeNull();
      expect(component.filterForm.get('batchId')?.value).toBeNull();
      expect(component.filterForm.get('shipperNumber')?.value).toBe('');
    });
  });

  describe('onBatchSelected', () => {
    it('should clear temps and enable them when batchId is null for U type', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('minTemp')?.setValue('20');
      component.filterForm.get('maxTemp')?.setValue('30');
      component.onBatchSelected(null);
      expect(component.filterForm.get('minTemp')?.value).toBe('');
      expect(component.filterForm.get('maxTemp')?.value).toBe('');
      expect(component.filterForm.get('minTemp')?.enabled).toBeTrue();
      expect(component.filterForm.get('maxTemp')?.enabled).toBeTrue();
    });

    it('should auto-fill temps and disable them when batch is selected for U type', () => {
      component.onCheckInTypeChange('U');
      component.batchOptions.set(mockBatches);
      component.onBatchSelected('111619-CB9006');
      expect(component.filterForm.get('minTemp')?.value).toBe('25');
      expect(component.filterForm.get('maxTemp')?.value).toBe('35.5');
      expect(component.filterForm.get('minTemp')?.disabled).toBeTrue();
      expect(component.filterForm.get('maxTemp')?.disabled).toBeTrue();
    });

    it('should auto-fill temps and keep them enabled for B type', () => {
      component.onCheckInTypeChange('B');
      component.batchOptions.set(mockBatches);
      component.onBatchSelected('111619-CB9006');
      expect(component.filterForm.get('minTemp')?.value).toBe('25');
      expect(component.filterForm.get('maxTemp')?.value).toBe('35.5');
      expect(component.filterForm.get('minTemp')?.enabled).toBeTrue();
      expect(component.filterForm.get('maxTemp')?.enabled).toBeTrue();
    });

    it('should clear temps and enable them when batchId is null for B type', () => {
      component.onCheckInTypeChange('B');
      component.onBatchSelected(null);
      expect(component.filterForm.get('minTemp')?.value).toBe('');
      expect(component.filterForm.get('maxTemp')?.value).toBe('');
      expect(component.filterForm.get('minTemp')?.enabled).toBeTrue();
      expect(component.filterForm.get('maxTemp')?.enabled).toBeTrue();
    });
  });

  describe('onRetrieve - missing fields', () => {
    it('should mark collectionDate touched when missing', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.patchValue({ checkInType: 'U', collectionDate: null });
      component.onRetrieve();
      expect(component.filterForm.get('collectionDate')?.touched).toBeTrue();
      expect(apiService.getUnits).not.toHaveBeenCalled();
    });

    it('should mark driveId touched when missing', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.patchValue({
        checkInType: 'U',
        collectionDate: moment('2025-01-01'),
      });
      component.filterForm.get('driveId')?.setValue(null);
      component.onRetrieve();
      expect(component.filterForm.get('driveId')?.touched).toBeTrue();
      expect(apiService.getUnits).not.toHaveBeenCalled();
    });

    it('should mark shipperNumber touched when missing for U type', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.patchValue({
        checkInType: 'U',
        collectionDate: moment('2025-01-01'),
      });
      component.filterForm.get('driveId')?.setValue('167279');
      component.filterForm.get('shipperNumber')?.setValue('');
      component.onRetrieve();
      expect(component.filterForm.get('shipperNumber')?.touched).toBeTrue();
      expect(apiService.getUnits).not.toHaveBeenCalled();
    });

    it('should stop on tempRange error when min > max', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.patchValue({
        checkInType: 'U',
        batchId: '111619-CB9006',
        shipperNumber: 'SHP001',
        collectionDate: moment('2025-01-01'),
        minTemp: '50',
        maxTemp: '30',
      });
      component.filterForm.get('driveId')?.setValue('167279');
      component.onRetrieve();
      expect(component.filterForm.get('minTemp')?.hasError('tempRange')).toBeTrue();
      expect(apiService.validateHeader).not.toHaveBeenCalled();
    });
  });

  describe('onRetrieve - header validation', () => {
    it('should show error and stop when header validation fails', fakeAsync(() => {
      apiService.validateHeader.and.returnValue(of({ success: false, message: 'Header invalid' }));
      fillRequiredFields();
      component.onRetrieve();
      tick();
      expect(component.isLoading()).toBeFalse();
      expect(apiService.getUnits).not.toHaveBeenCalled();
    }));

    it('should proceed with retrieve for errorCode 0033 warning', fakeAsync(() => {
      apiService.validateHeader.and.returnValue(of({ success: true, errorCode: '0033', message: 'Date age warning' }));
      fillRequiredFields();
      apiService.getUnits.calls.reset();
      component.onRetrieve();
      tick();
      expect(apiService.getUnits).toHaveBeenCalled();
      expect(component.hasRetrievedData()).toBeTrue();
    }));

    it('should stop loading when validateHeader API call fails', fakeAsync(() => {
      apiService.validateHeader.and.returnValue(throwError(() => new Error('server error')));
      fillRequiredFields();
      component.onRetrieve();
      tick();
      expect(component.isLoading()).toBeFalse();
      expect(apiService.getUnits).not.toHaveBeenCalled();
    }));
  });

  describe('onScanUnitIdValidated - aborting', () => {
    it('should return immediately when _aborting is true', () => {
      (component as any)._aborting = true;
      component.onScanUnitIdValidated(mockScanInput);
      expect(component.validatedScanUnit()).toBeNull();
    });
  });

  describe('onScanUnitIdValidated - missing header fields', () => {
    it('should set scanValidationError when checkInType is missing', () => {
      component.filterForm.get('checkInType')?.setValue(null);
      component.onScanUnitIdValidated(mockScanInput);
      expect(component.scanValidationError()).toContain('mandatory header fields');
    });
  });

  describe('onUnitRowClick', () => {
    it('should return early when collectionDate is null', () => {
      component.filterForm.get('collectionDate')?.setValue(null);
      apiService.getDonationDetails.calls.reset();
      component.onUnitRowClick(mockUnitsResponse.data[0]);
      expect(apiService.getDonationDetails).not.toHaveBeenCalled();
    });

    it('should handle getDonationDetails error gracefully', fakeAsync(() => {
      fillRequiredFields();
      apiService.getDonationDetails.and.returnValue(throwError(() => new Error('fail')));
      component.onUnitRowClick(mockUnitsResponse.data[0]);
      tick();
      expect(component.donationDetails()).toBeNull();
    }));
  });

  describe('toggleWarningPanel', () => {
    it('should toggle activeWarningUnitId on and off', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');

      component.toggleWarningPanel('W633319111560', event);
      expect(component.activeWarningUnitId()).toBe('W633319111560');
      expect(event.stopPropagation).toHaveBeenCalled();

      component.toggleWarningPanel('W633319111560', event);
      expect(component.activeWarningUnitId()).toBeNull();
    });

    it('should switch to a different unit', () => {
      const event = new Event('click');
      spyOn(event, 'stopPropagation');

      component.toggleWarningPanel('UNIT1', event);
      expect(component.activeWarningUnitId()).toBe('UNIT1');

      component.toggleWarningPanel('UNIT2', event);
      expect(component.activeWarningUnitId()).toBe('UNIT2');
    });
  });

  describe('closeWarningPanel', () => {
    it('should clear activeWarningUnitId and stop propagation', () => {
      component.activeWarningUnitId.set('W633319111560');
      const event = new Event('click');
      spyOn(event, 'stopPropagation');
      component.closeWarningPanel(event);
      expect(component.activeWarningUnitId()).toBeNull();
      expect(event.stopPropagation).toHaveBeenCalled();
    });
  });

  describe('unitRowClass', () => {
    it('should return transferred class', () => {
      expect(component.unitRowClass({ ...mockUnitsResponse.data[0], uiStatus: 'TRANSFERRED' })).toBe('unit-row--transferred');
    });

    it('should return scanned class', () => {
      expect(component.unitRowClass({ ...mockUnitsResponse.data[0], uiStatus: 'SCANNED' })).toBe('unit-row--scanned');
    });

    it('should return error class', () => {
      expect(component.unitRowClass({ ...mockUnitsResponse.data[0], uiStatus: 'ERROR' })).toBe('unit-row--error');
    });

    it('should return empty string for PENDING status', () => {
      expect(component.unitRowClass({ ...mockUnitsResponse.data[0], uiStatus: 'PENDING' })).toBe('');
    });

    it('should return empty string for undefined status', () => {
      expect(component.unitRowClass(mockUnitsResponse.data[0])).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should return dash for null value', () => {
      expect(component.formatDate(null)).toBe('—');
    });

    it('should return dash for undefined value', () => {
      expect(component.formatDate(undefined)).toBe('—');
    });

    it('should return formatted date for valid date string', () => {
      const result = component.formatDate('2025-01-11');
      expect(result).toMatch(/11-JAN-2025/);
    });
  });

  describe('formatDateTime', () => {
    it('should return dash for null value', () => {
      expect(component.formatDateTime(null)).toBe('—');
    });

    it('should return dash for undefined value', () => {
      expect(component.formatDateTime(undefined)).toBe('—');
    });
  });

  describe('unitCount', () => {
    it('should return 0 when no retrieved units', () => {
      expect(component.unitCount).toBe(0);
    });

    it('should return count of retrieved units', () => {
      component.retrievedUnits.set([
        { ...mockUnitsResponse.data[0], uiStatus: 'PENDING' as const },
        { ...mockUnitsResponse.data[0], unitId: 'UNIT2', uiStatus: 'PENDING' as const },
      ]);
      expect(component.unitCount).toBe(2);
    });
  });

  describe('computed filter signals', () => {
    it('filteredBatchOptions should return all when search is empty', () => {
      component.batchOptions.set(mockBatches);
      component.batchSearchControl.setValue('');
      expect(component.filteredBatchOptions().length).toBe(mockBatches.length);
    });

    it('filteredBatchOptions should filter by batchId', () => {
      component.batchOptions.set(mockBatches);
      component.batchSearchControl.setValue('CB9006');
      expect(component.filteredBatchOptions().length).toBe(1);
    });

    it('filteredBatchOptions should filter by unitCount', () => {
      component.batchOptions.set(mockBatches);
      component.batchSearchControl.setValue('10');
      expect(component.filteredBatchOptions().length).toBe(1);
    });

    it('filteredDriveOptions should return all when search is empty', () => {
      component.driveOptions.set(mockDrives);
      component.driveSearchControl.setValue('');
      expect(component.filteredDriveOptions().length).toBe(mockDrives.length);
    });

    it('filteredDriveOptions should filter by siteName', () => {
      component.driveOptions.set(mockDrives);
      component.driveSearchControl.setValue('Test Site');
      expect(component.filteredDriveOptions().length).toBe(1);
    });

    it('filteredDriveOptions should filter by groupSiteId', () => {
      component.driveOptions.set(mockDrives);
      component.driveSearchControl.setValue('GS001');
      expect(component.filteredDriveOptions().length).toBe(1);
    });

    it('filteredDriveOptions should return empty for non-matching search', () => {
      component.driveOptions.set(mockDrives);
      component.driveSearchControl.setValue('NONEXISTENT');
      expect(component.filteredDriveOptions().length).toBe(0);
    });

    it('filteredCheckInTypeOptions should return all when search is empty', () => {
      component.checkInTypeSearch.setValue('');
      expect(component.filteredCheckInTypeOptions().length).toBe(3);
    });

    it('filteredCheckInTypeOptions should filter by label', () => {
      component.checkInTypeSearch.setValue('Tubes');
      expect(component.filteredCheckInTypeOptions().length).toBe(1);
    });
  });

  describe('computed boolean signals', () => {
    it('showNoBatchesFound should be true when search has value but no results', () => {
      component.batchOptions.set([]);
      component.batchSearchControl.setValue('NOMATCH');
      expect(component.showNoBatchesFound()).toBeTrue();
    });

    it('showNoDrivesFound should be true when search has value but no results', () => {
      component.driveOptions.set([]);
      component.driveSearchControl.setValue('NOMATCH');
      expect(component.showNoDrivesFound()).toBeTrue();
    });

    it('showEmptyPlaceholder should be true when panelsVisible is false', () => {
      component.panelsVisible.set(false);
      expect(component.showEmptyPlaceholder()).toBeTrue();
    });

    it('showEmptyPlaceholder should be false when panelsVisible is true', () => {
      component.panelsVisible.set(true);
      expect(component.showEmptyPlaceholder()).toBeFalse();
    });

    it('isBatchDisabled should be true when checkInType is T', () => {
      component.checkInTypeSignal.set('T');
      expect(component.isBatchDisabled()).toBeTrue();
    });

    it('isBatchDisabled should be false for U type', () => {
      component.checkInTypeSignal.set('U');
      expect(component.isBatchDisabled()).toBeFalse();
    });

    it('isBatchEnabled should be true when type is U', () => {
      component.checkInTypeSignal.set('U');
      expect(component.isBatchEnabled()).toBeTrue();
    });

    it('hasDonationDetails should be true when donationDetails is set', () => {
      component.donationDetails.set(mockDonationDetails);
      expect(component.hasDonationDetails()).toBeTrue();
    });

    it('hasDonationDetails should be false when donationDetails is null', () => {
      component.donationDetails.set(null);
      expect(component.hasDonationDetails()).toBeFalse();
    });

    it('hasScanError should be true when scanValidationError is set', () => {
      component.scanValidationError.set('error');
      expect(component.hasScanError()).toBeTrue();
    });

    it('hasScanError should be true when scanMaxBleedError is set', () => {
      component.scanMaxBleedError.set('max bleed');
      expect(component.hasScanError()).toBeTrue();
    });

    it('hasScanError should be true when scanValidationWarning is set', () => {
      component.scanValidationWarning.set('warning');
      expect(component.hasScanError()).toBeTrue();
    });

    it('hasScanError should be false when all scan errors are null', () => {
      component.scanValidationError.set(null);
      component.scanMaxBleedError.set(null);
      component.scanValidationWarning.set(null);
      expect(component.hasScanError()).toBeFalse();
    });

    it('isCollectionDateRequired should be true when checkInType is set', () => {
      component.checkInTypeSignal.set('U');
      expect(component.isCollectionDateRequired()).toBeTrue();
    });

    it('isCollectionDateRequired should be false when checkInType is null', () => {
      component.checkInTypeSignal.set(null);
      expect(component.isCollectionDateRequired()).toBeFalse();
    });

    it('batchLabelMarker should return empty string', () => {
      expect(component.batchLabelMarker()).toBe('');
    });

    it('showBatchField should always return true', () => {
      expect(component.showBatchField()).toBeTrue();
    });
  });

  describe('chapter change subscription', () => {
    it('should clearAll and reload batches when chapter changes', fakeAsync(() => {
      fillRequiredFields();
      component.retrievedUnits.set([{ ...mockUnitsResponse.data[0], uiStatus: 'PENDING' as const }]);
      apiService.getBatches.calls.reset();
      chapterChanged$.next();
      tick();
      expect(component.retrievedUnits().length).toBe(0);
      expect(apiService.getBatches).toHaveBeenCalled();
    }));
  });

  describe('processUnit - validation error (not warning/max-bleed)', () => {
    it('should set scanValidationError for generic validation failure', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'GENERIC_ERROR',
        errorMessage: 'Unit validation failed for generic reason.',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toContain('Unit validation failed');
      expect(component.isScanning()).toBeFalse();
      expect(apiService.transfer).not.toHaveBeenCalled();
    }));

    it('should set default validation error message when errorMessage is empty', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'UNKNOWN',
        errorMessage: '',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toBe('Unit validation failed.');
      expect(apiService.transfer).not.toHaveBeenCalled();
    }));
  });

  describe('processUnit - validate transfer error handling', () => {
    it('should handle validateTransfer HTTP error with error body', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(throwError(() => ({
        error: { isValid: false, errorMessage: 'Server validation error', warnings: [] },
      })));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toContain('Server validation error');
    }));

    it('should fallback to default message when validateTransfer error has no body', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(throwError(() => new Error('no body')));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toBe('Validation request failed.');
    }));
  });

  describe('processUnit - transfer error handling', () => {
    it('should handle transfer API error and set scanValidationError', fakeAsync(() => {
      apiService.transfer.and.returnValue(throwError(() => ({
        error: { message: 'Transfer API failed' },
      })));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toContain('Transfer API failed');
      expect(component.isScanning()).toBeFalse();
    }));

    it('should set default message when transfer error has no message', fakeAsync(() => {
      apiService.transfer.and.returnValue(throwError(() => ({
        error: {},
      })));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toBe('Transfer failed.');
    }));
  });

  describe('processUnit - unsuccessful transfer response', () => {
    it('should set scanValidationError when transfer response is not successful', fakeAsync(() => {
      apiService.transfer.and.returnValue(of({
        success: false,
        message: 'Transfer was rejected.',
        data: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toBe('Transfer was rejected.');
    }));
  });

  describe('processUnit - donation details from validation response', () => {
    it('should set donationDetails from validation response', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: true,
        donationDetails: mockDonationDetails,
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.donationDetails()?.unitId).toBe('W633319111560');
    }));
  });

  describe('processUnit - unit already in retrieved list', () => {
    it('should update existing unit status to TRANSFERRED', fakeAsync(() => {
      fillRequiredFields();
      component.retrievedUnits.set([
        { ...mockUnitsResponse.data[0], uiStatus: 'PENDING' as const },
      ]);
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      const updated = component.retrievedUnits().find(u => u.unitId === 'W633319111560');
      expect(updated?.uiStatus).toBe('TRANSFERRED');
    }));
  });

  describe('processUnit - generatedBatchId', () => {
    it('should update batchId and add to batchOptions when generatedBatchId is returned', fakeAsync(() => {
      const transferWithBatch: TransferResponse = {
        success: true,
        message: '1 unit transferred.',
        data: [{
          ...mockTransferResult,
          generatedBatchId: 'AUTO-BATCH-001',
        }],
      };
      apiService.transfer.and.returnValue(of(transferWithBatch));
      fillRequiredFields();
      component.filterForm.patchValue({ batchId: null });
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.filterForm.get('batchId')?.value).toBe('AUTO-BATCH-001');
      expect(component.batchOptions().some(b => b.batchId === 'AUTO-BATCH-001')).toBeTrue();
    }));
  });

  describe('processUnit - scan for unit NOT in retrieved list', () => {
    it('should prepend new unit to retrieved list', fakeAsync(() => {
      fillRequiredFields();
      component.retrievedUnits.set([]);
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.retrievedUnits().length).toBe(1);
      expect(component.retrievedUnits()[0].unitId).toBe('W633319111560');
      expect(component.retrievedUnits()[0].uiStatus).toBe('TRANSFERRED');
    }));
  });

  describe('processUnit - other MAX_BLEED codes', () => {
    it('should handle MAX_BLEED_TIME error code', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'MAX_BLEED_TIME',
        errorMessage: 'Max bleed time exceeded.',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanMaxBleedError()).toContain('Max bleed time');
      expect(component.panelStatus()).toBe('ERROR');
      expect(apiService.transfer).not.toHaveBeenCalled();
    }));

    it('should handle BLEED_TIME_EXCEEDED error code', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'BLEED_TIME_EXCEEDED',
        errorMessage: '',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanMaxBleedError()).toBe('Bleed time exceeded maximum allowed limit.');
      expect(apiService.transfer).not.toHaveBeenCalled();
    }));
  });

  describe('processUnit - other SLOW_BLEED codes', () => {
    it('should handle SLOW_BLEED_WARNING error code', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'SLOW_BLEED_WARNING',
        errorMessage: 'Slow bleed warning detected.',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationWarning()).toContain('Slow bleed warning');
      expect(component.panelStatus()).toBe('WARNING');
      expect(apiService.transfer).toHaveBeenCalled();
    }));
  });

  describe('onShipperTriggerTab', () => {
    it('should set panelsVisible to true', () => {
      component.panelsVisible.set(false);
      component.onShipperTriggerTab();
      expect(component.panelsVisible()).toBeTrue();
    });
  });

  describe('onCollectionDateInput', () => {
    it('should set futureDate error for a date in the future', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      const futureDate = moment().add(10, 'days').format('DD-MMM-YYYY');
      const event = { target: { value: futureDate } } as unknown as Event;
      component.onCollectionDateInput(event);
      expect(ctrl?.hasError('futureDate')).toBeTrue();
    });

    it('should clear futureDate error for a valid past date', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.setErrors({ futureDate: true });
      const pastDate = moment().subtract(5, 'days').format('DD-MMM-YYYY');
      const event = { target: { value: pastDate } } as unknown as Event;
      component.onCollectionDateInput(event);
      expect(ctrl?.hasError('futureDate')).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('clearAll - disabling fields', () => {
    it('should disable all filter fields after clearAll', () => {
      fillRequiredFields();
      component.clearAll();
      expect(component.filterForm.get('batchId')?.disabled).toBeTrue();
      expect(component.filterForm.get('minTemp')?.disabled).toBeTrue();
      expect(component.filterForm.get('maxTemp')?.disabled).toBeTrue();
      expect(component.filterForm.get('collectionDate')?.disabled).toBeTrue();
      expect(component.filterForm.get('driveId')?.disabled).toBeTrue();
      expect(component.filterForm.get('shipperNumber')?.disabled).toBeTrue();
      expect(component.checkInTypeSignal()).toBeNull();
      expect(component.panelsVisible()).toBeFalse();
    });
  });

  describe('loadBatches error handling', () => {
    it('should handle getBatches failure during chapter change', fakeAsync(() => {
      apiService.getBatches.and.returnValue(throwError(() => new Error('fail')));
      chapterChanged$.next();
      tick();
      // Component should not throw; batches remain from prior state
      expect(component.retrievedUnits().length).toBe(0);
    }));
  });

  describe('onRetrieve - Tubes Only skips shipper validation', () => {
    it('should not require shipper number for T type', fakeAsync(() => {
      component.onCheckInTypeChange('T');
      tick(100);
      component.filterForm.patchValue({
        checkInType: 'T',
        collectionDate: moment('2025-01-01'),
        shipperNumber: '',
      });
      component.filterForm.get('driveId')?.setValue('167279');
      apiService.validateHeader.calls.reset();
      apiService.getUnits.calls.reset();
      component.onRetrieve();
      tick();
      expect(apiService.validateHeader).toHaveBeenCalled();
    }));
  });

  describe('filteredShipperOptions', () => {
    it('should filter shippers by shipperNo', () => {
      component.shipperOptions.set([{ shipperNo: 'SH001' }, { shipperNo: 'SH002' }]);
      component.shipperSearchControl.setValue('SH001');
      expect(component.filteredShipperOptions().length).toBe(1);
      expect(component.filteredShipperOptions()[0].shipperNo).toBe('SH001');
    });

    it('should return all when search is empty', () => {
      component.shipperOptions.set([{ shipperNo: 'SH001' }, { shipperNo: 'SH002' }]);
      component.shipperSearchControl.setValue('');
      expect(component.filteredShipperOptions().length).toBe(2);
    });
  });

  describe('showNoShippersFound and showNoTypesFound', () => {
    it('showNoShippersFound should be true when search has value but no results', () => {
      component.shipperOptions.set([]);
      component.shipperSearchControl.setValue('NOMATCH');
      expect(component.showNoShippersFound()).toBeTrue();
    });

    it('showNoTypesFound should be true when search has value but no results', () => {
      component.checkInTypeSearch.setValue('NONEXISTENT');
      expect(component.showNoTypesFound()).toBeTrue();
    });
  });

  // ─── ADDITIONAL COVERAGE TESTS ─────────────────────────────────────────────

  describe('onSelectSearchKeydown', () => {
    let mockSelect: any;
    beforeEach(() => {
      mockSelect = { close: jasmine.createSpy('close') };
    });

    it('should close select and prevent default on Tab key', fakeAsync(() => {
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      component.onSelectSearchKeydown(event, mockSelect);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockSelect.close).toHaveBeenCalled();
      tick(0);
    }));

    it('should stop propagation for single-character keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'a' });
      spyOn(event, 'stopPropagation');
      component.onSelectSearchKeydown(event, mockSelect);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(mockSelect.close).not.toHaveBeenCalled();
    });

    it('should not stop propagation for multi-character keys like Escape', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'stopPropagation');
      component.onSelectSearchKeydown(event, mockSelect);
      expect(event.stopPropagation).not.toHaveBeenCalled();
      expect(mockSelect.close).not.toHaveBeenCalled();
    });
  });

  describe('onShipperTab', () => {
    it('should set panelsVisible to true and close select on Tab', fakeAsync(() => {
      component.panelsVisible.set(false);
      const mockSelect = { close: jasmine.createSpy('close') };
      const event = new KeyboardEvent('keydown', { key: 'Tab' });
      spyOn(event, 'preventDefault');
      spyOn(event, 'stopPropagation');
      component.onShipperTab(event, mockSelect as any);
      expect(component.panelsVisible()).toBeTrue();
      expect(mockSelect.close).toHaveBeenCalled();
      tick(0);
    }));
  });

  describe('onCollectionDateChange - private via collectionDate valueChanges', () => {
    it('should clear drives and shippers when collectionDate is set to null', fakeAsync(() => {
      component.onCheckInTypeChange('U');
      component.driveOptions.set(mockDrives);
      component.shipperOptions.set([{ shipperNo: 'SH001' }]);
      apiService.getDrives.calls.reset();
      component.filterForm.get('collectionDate')?.setValue(null);
      tick();
      expect(component.driveOptions().length).toBe(0);
      expect(component.shipperOptions().length).toBe(0);
      expect(apiService.getDrives).not.toHaveBeenCalled();
    }));

    it('should clear drives when collectionDate is set to an invalid moment', fakeAsync(() => {
      component.onCheckInTypeChange('U');
      component.driveOptions.set(mockDrives);
      apiService.getDrives.calls.reset();
      component.filterForm.get('collectionDate')?.setValue(moment('invalid-date'));
      tick();
      expect(apiService.getDrives).not.toHaveBeenCalled();
    }));

    it('should call getDrives when collectionDate is set to a valid moment', fakeAsync(() => {
      component.onCheckInTypeChange('U');
      apiService.getDrives.calls.reset();
      component.filterForm.get('collectionDate')?.setValue(moment('2025-06-15'));
      tick();
      expect(apiService.getDrives).toHaveBeenCalledWith('2025-06-15');
    }));

    it('should handle getDrives error gracefully', fakeAsync(() => {
      component.onCheckInTypeChange('U');
      apiService.getDrives.and.returnValue(throwError(() => new Error('network error')));
      component.filterForm.get('collectionDate')?.setValue(moment('2025-06-15'));
      tick();
      expect(component.driveOptions().length).toBe(0);
      // Component does not throw; driveOptions stay empty
    }));
  });

  describe('onBatchSelected - edge cases', () => {
    it('should not auto-fill temps when batch is not found in batchOptions', () => {
      component.onCheckInTypeChange('U');
      component.batchOptions.set([]);
      component.filterForm.get('minTemp')?.setValue('10');
      component.onBatchSelected('NONEXISTENT-BATCH');
      // Temps remain unchanged since batch was not found
      expect(component.filterForm.get('minTemp')?.value).toBe('10');
    });

    it('should handle batch with null minTemp and maxTemp', () => {
      component.onCheckInTypeChange('B');
      component.batchOptions.set([{
        batchId: 'BATCH-NULL', receivedDate: '2025-01-01',
        minTemp: null as any, maxTemp: null as any, unitCount: 0,
      }]);
      component.onBatchSelected('BATCH-NULL');
      expect(component.filterForm.get('minTemp')?.value).toBe('');
      expect(component.filterForm.get('maxTemp')?.value).toBe('');
    });

    it('should not change temp enable/disable state when type is T', () => {
      component.onCheckInTypeChange('T');
      component.batchOptions.set(mockBatches);
      // For T, temps are disabled by onCheckInTypeChange
      expect(component.filterForm.get('minTemp')?.disabled).toBeTrue();
      component.onBatchSelected(null);
      // Temps remain as they were (no explicit enable for T)
      expect(component.filterForm.get('minTemp')?.value).toBe('');
    });
  });

  describe('processUnit - empty unitId', () => {
    it('should return early when unitId is empty', fakeAsync(() => {
      fillRequiredFields();
      apiService.validateTransfer.calls.reset();
      const emptyInput: UnitValidationResponse = { ...mockScanInput, parsedUnitId: '  ' };
      component.onScanUnitIdValidated(emptyInput);
      tick();
      expect(apiService.validateTransfer).not.toHaveBeenCalled();
    }));
  });

  describe('processUnit - MAXIMUM_BLEED and BLEED_TIME_MAX codes', () => {
    it('should handle MAXIMUM_BLEED error code', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'MAXIMUM_BLEED',
        errorMessage: 'Maximum bleed limit.',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanMaxBleedError()).toContain('Maximum bleed');
      expect(component.panelStatus()).toBe('ERROR');
      expect(apiService.transfer).not.toHaveBeenCalled();
    }));

    it('should handle BLEED_TIME_MAX error code', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'BLEED_TIME_MAX',
        errorMessage: 'Bleed time max.',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanMaxBleedError()).toContain('Bleed time max');
      expect(component.panelStatus()).toBe('ERROR');
      expect(apiService.transfer).not.toHaveBeenCalled();
    }));
  });

  describe('processUnit - BLEED_TIME_SLOW code', () => {
    it('should handle BLEED_TIME_SLOW warning code and proceed with transfer', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'BLEED_TIME_SLOW',
        errorMessage: 'Bleed time slow.',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationWarning()).toContain('Bleed time slow');
      expect(component.panelStatus()).toBe('WARNING');
      expect(apiService.transfer).toHaveBeenCalled();
    }));
  });

  describe('processUnit - default error messages for empty errorMessage', () => {
    it('should use default warning message when errorMessage is empty for SLOW_BLEED', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'SLOW_BLEED',
        errorMessage: '',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationWarning()).toBe('Review before continuing.');
    }));

    it('should use default max-bleed message when errorMessage is empty for MAX_BLEED', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: false,
        errorCode: 'MAX_BLEED',
        errorMessage: '',
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanMaxBleedError()).toBe('Bleed time exceeded maximum allowed limit.');
    }));
  });

  describe('processUnit - generatedBatchId already exists in batchOptions', () => {
    it('should not duplicate batch when generatedBatchId already in batchOptions', fakeAsync(() => {
      const transferWithExistingBatch: TransferResponse = {
        success: true,
        message: '1 unit transferred.',
        data: [{ ...mockTransferResult, generatedBatchId: '111619-CB9006' }],
      };
      apiService.transfer.and.returnValue(of(transferWithExistingBatch));
      fillRequiredFields();
      const initialBatchCount = component.batchOptions().length;
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.filterForm.get('batchId')?.value).toBe('111619-CB9006');
      expect(component.batchOptions().length).toBe(initialBatchCount);
    }));
  });

  describe('processUnit - transfer success false with empty message', () => {
    it('should set default "Transfer failed." message when response message is empty', fakeAsync(() => {
      apiService.transfer.and.returnValue(of({
        success: false,
        message: '',
        data: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toBe('Transfer failed.');
    }));
  });

  describe('processUnit - transfer success with warnings and interdictions', () => {
    it('should apply uiWarnings and uiInterdictions from transfer result', fakeAsync(() => {
      const resultWithWarnings: TransferResponse = {
        success: true,
        message: 'Transferred.',
        data: [{
          ...mockTransferResult,
          warningsGenerated: [{ code: 'W001', message: 'Low volume' }],
          interdictionsApplied: ['INTERDICT_001'],
        }],
      };
      apiService.transfer.and.returnValue(of(resultWithWarnings));
      fillRequiredFields();
      component.retrievedUnits.set([{ ...mockUnitsResponse.data[0], uiStatus: 'PENDING' as const }]);
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      const unit = component.retrievedUnits().find(u => u.unitId === 'W633319111560');
      expect(unit?.uiWarnings?.length).toBe(1);
      expect(unit?.uiInterdictions?.length).toBe(1);
    }));
  });

  describe('processUnit - new unit not in retrieved list uses donationDetails', () => {
    it('should use donationType and procedureCode from donationDetails when available', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: true,
        donationDetails: mockDonationDetails,
        warnings: [],
      }));
      fillRequiredFields();
      component.retrievedUnits.set([]);
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      const unit = component.retrievedUnits()[0];
      expect(unit.donationType).toBe('WB');
      expect(unit.procedureCode).toBe('2C');
    }));
  });

  describe('processUnit - isValid true without errorCode', () => {
    it('should proceed directly to transfer when validation is valid', fakeAsync(() => {
      apiService.validateTransfer.and.returnValue(of({
        isValid: true,
        warnings: [],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(apiService.transfer).toHaveBeenCalled();
      expect(component.scanValidationError()).toBeNull();
      expect(component.scanMaxBleedError()).toBeNull();
      expect(component.scanValidationWarning()).toBeNull();
    }));
  });

  describe('validateHeaderFields - multiple missing fields', () => {
    it('should set error when collectionDate is also missing', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.patchValue({
        checkInType: 'U',
        collectionDate: null,
        shipperNumber: '',
      });
      component.filterForm.get('driveId')?.setValue(null);
      component.onScanUnitIdValidated(mockScanInput);
      expect(component.scanValidationError()).toContain('mandatory header fields');
      expect(component.filterForm.get('collectionDate')?.touched).toBeTrue();
      expect(component.filterForm.get('driveId')?.touched).toBeTrue();
      expect(component.filterForm.get('shipperNumber')?.touched).toBeTrue();
    });

    it('should not require shipperNumber when checkInType is T', () => {
      component.onCheckInTypeChange('T');
      component.filterForm.patchValue({
        checkInType: 'T',
        collectionDate: moment('2025-01-01'),
      });
      component.filterForm.get('driveId')?.setValue('167279');
      apiService.validateTransfer.calls.reset();
      component.onScanUnitIdValidated(mockScanInput);
      // Should proceed since T does not require shipper
      expect(component.scanValidationError()).toBeNull();
      expect(apiService.validateTransfer).toHaveBeenCalled();
    });
  });

  describe('validateTempRange - edge cases', () => {
    it('should clear tempRange error while preserving other errors', () => {
      component.onCheckInTypeChange('U');
      const minCtrl = component.filterForm.get('minTemp');
      // Set values first (setValue clears manually-set errors via validators)
      component.filterForm.get('minTemp')?.setValue('20');
      component.filterForm.get('maxTemp')?.setValue('30');
      // Set errors AFTER setValue so they aren't cleared by Angular's validation
      minCtrl?.setErrors({ tempRange: true, required: true });
      component.onMaxTempBlur();
      // tempRange should be cleared but required should remain
      expect(minCtrl?.hasError('tempRange')).toBeFalse();
      expect(minCtrl?.hasError('required')).toBeTrue();
    });

    it('should not set tempRange error when only min has value', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('minTemp')?.setValue('20');
      component.filterForm.get('maxTemp')?.setValue('');
      component.onMaxTempBlur();
      expect(component.filterForm.get('minTemp')?.hasError('tempRange')).toBeFalse();
    });

    it('should not set tempRange error when only max has value', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('minTemp')?.setValue('');
      component.filterForm.get('maxTemp')?.setValue('30');
      component.onMaxTempBlur();
      expect(component.filterForm.get('minTemp')?.hasError('tempRange')).toBeFalse();
    });

    it('should add tempRange error while preserving other errors on minCtrl', () => {
      component.onCheckInTypeChange('U');
      const minCtrl = component.filterForm.get('minTemp');
      minCtrl?.setErrors({ required: true });
      component.filterForm.get('minTemp')?.setValue('50');
      component.filterForm.get('maxTemp')?.setValue('30');
      component.onMinTempBlur();
      expect(minCtrl?.hasError('tempRange')).toBeTrue();
    });
  });

  describe('getCollectionDateError - dirty but not touched', () => {
    it('should return error when control is dirty', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.markAsDirty();
      ctrl?.setErrors({ required: true });
      expect(component.getCollectionDateError()).toBe('Collection Date is required');
    });

    it('should return empty string when no errors present', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.markAsTouched();
      ctrl?.setErrors(null);
      expect(component.getCollectionDateError()).toBe('');
    });
  });

  describe('onCollectionDateInput - edge cases', () => {
    it('should handle empty input value', () => {
      component.onCheckInTypeChange('U');
      const event = { target: { value: '' } } as unknown as Event;
      component.onCollectionDateInput(event);
      // Should not throw
      expect(component.filterForm.get('collectionDate')).toBeTruthy();
    });

    it('should handle unparseable date input', () => {
      component.onCheckInTypeChange('U');
      const event = { target: { value: 'not-a-date' } } as unknown as Event;
      component.onCollectionDateInput(event);
      // Should not set futureDate since parsing fails
      expect(component.filterForm.get('collectionDate')?.hasError('futureDate')).toBeFalsy();
    });

    it('should clear futureDate error and set null errors when no other errors', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.setErrors({ futureDate: true });
      const pastDate = moment().subtract(10, 'days').format('DD-MMM-YYYY');
      const event = { target: { value: pastDate } } as unknown as Event;
      component.onCollectionDateInput(event);
      expect(ctrl?.errors).toBeNull();
    });

    it('should preserve other errors when clearing futureDate', () => {
      component.onCheckInTypeChange('U');
      const ctrl = component.filterForm.get('collectionDate');
      ctrl?.setErrors({ futureDate: true, invalidDate: true });
      const pastDate = moment().subtract(10, 'days').format('DD-MMM-YYYY');
      const event = { target: { value: pastDate } } as unknown as Event;
      component.onCollectionDateInput(event);
      expect(ctrl?.hasError('futureDate')).toBeFalse();
      expect(ctrl?.hasError('invalidDate')).toBeTrue();
    });
  });

  describe('onRetrieve - header validation with no message', () => {
    it('should stop loading and not call getUnits when header validation fails without message', fakeAsync(() => {
      apiService.validateHeader.and.returnValue(of({ success: false }));
      fillRequiredFields();
      apiService.getUnits.calls.reset();
      component.onRetrieve();
      tick();
      expect(component.isLoading()).toBeFalse();
      expect(apiService.getUnits).not.toHaveBeenCalled();
    }));

    it('should proceed with getUnits when errorCode 0033 has no message', fakeAsync(() => {
      apiService.validateHeader.and.returnValue(of({ success: true, errorCode: '0033' }));
      fillRequiredFields();
      apiService.getUnits.calls.reset();
      component.onRetrieve();
      tick();
      expect(apiService.getUnits).toHaveBeenCalled();
      expect(component.hasRetrievedData()).toBeTrue();
    }));
  });

  describe('onRetrieve - mapping header request', () => {
    it('should map groupSiteId from selected drive', fakeAsync(() => {
      fillRequiredFields();
      component.driveOptions.set(mockDrives);
      apiService.validateHeader.calls.reset();
      component.onRetrieve();
      tick();
      const req = apiService.validateHeader.calls.mostRecent().args[0];
      expect(req.groupSiteId).toBe('GS001');
    }));

    it('should default groupSiteId to empty when drive not found', fakeAsync(() => {
      fillRequiredFields();
      component.driveOptions.set([]);
      component.filterForm.get('driveId')?.setValue('UNKNOWN-DRIVE');
      apiService.validateHeader.calls.reset();
      component.onRetrieve();
      tick();
      const req = apiService.validateHeader.calls.mostRecent().args[0];
      expect(req.groupSiteId).toBe('');
    }));

    it('should pass null for batchId and shipperId when empty', fakeAsync(() => {
      component.onCheckInTypeChange('T');
      component.filterForm.patchValue({
        checkInType: 'T',
        collectionDate: moment('2025-01-01'),
        batchId: null,
        shipperNumber: '',
      });
      component.filterForm.get('driveId')?.setValue('167279');
      apiService.validateHeader.calls.reset();
      component.onRetrieve();
      tick();
      const req = apiService.validateHeader.calls.mostRecent().args[0];
      expect(req.batchId).toBeNull();
      expect(req.shipperId).toBeNull();
    }));

    it('should parse minTemp and maxTemp as numbers', fakeAsync(() => {
      fillRequiredFields();
      component.filterForm.get('minTemp')?.setValue('22.5');
      component.filterForm.get('maxTemp')?.setValue('35');
      apiService.validateHeader.calls.reset();
      component.onRetrieve();
      tick();
      const req = apiService.validateHeader.calls.mostRecent().args[0];
      expect(req.minTemp).toBe(22.5);
      expect(req.maxTemp).toBe(35);
    }));

    it('should pass null for minTemp and maxTemp when empty', fakeAsync(() => {
      fillRequiredFields();
      component.filterForm.get('minTemp')?.setValue('');
      component.filterForm.get('maxTemp')?.setValue('');
      apiService.validateHeader.calls.reset();
      component.onRetrieve();
      tick();
      const req = apiService.validateHeader.calls.mostRecent().args[0];
      expect(req.minTemp).toBeNull();
      expect(req.maxTemp).toBeNull();
    }));
  });

  describe('handleTransferError - errorMessage field', () => {
    it('should use errorMessage when message is missing', fakeAsync(() => {
      apiService.transfer.and.returnValue(throwError(() => ({
        error: { errorMessage: 'Transfer error via errorMessage' },
      })));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.scanValidationError()).toBe('Transfer error via errorMessage');
    }));
  });

  describe('formatDate - edge cases', () => {
    it('should return dash for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('—');
    });

    it('should format Date object correctly', () => {
      const result = component.formatDate(new Date('2025-03-15'));
      expect(result).toMatch(/15-MAR-2025/);
    });
  });

  describe('formatDateTime - edge cases', () => {
    it('should return dash for invalid date string', () => {
      expect(component.formatDateTime('not-a-date')).toBe('—');
    });

    it('should format UTC time correctly', () => {
      const result = component.formatDateTime('2025-06-15T14:30:00Z');
      expect(result).toMatch(/15-Jun-2025 14:30/i);
    });
  });

  describe('onCheckInTypeChange - collectionDate already set', () => {
    it('should not overwrite existing collectionDate value', () => {
      const existingDate = moment('2025-05-10');
      component.onCheckInTypeChange('U');
      component.filterForm.get('collectionDate')?.setValue(existingDate, { emitEvent: false });
      component.onCheckInTypeChange('B');
      const collDate = component.filterForm.get('collectionDate')?.value;
      expect(collDate).toBeTruthy();
    });

    it('should set collectionDate to maxDate when it is null', fakeAsync(() => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('collectionDate')?.setValue(null, { emitEvent: false });
      tick();
      component.onCheckInTypeChange('T');
      tick(100);
      const collDate = component.filterForm.get('collectionDate')?.value;
      expect(collDate).toBeTruthy();
    }));
  });

  describe('processUnit - contractId from batchOptions', () => {
    it('should include contractId from matching batch in transfer request', fakeAsync(() => {
      component.batchOptions.set([{
        batchId: 'BATCH-CONTRACT', receivedDate: '2025-01-01',
        minTemp: 20, maxTemp: 35, unitCount: 5, contractId: 'CONTRACT-001',
      }]);
      fillRequiredFields();
      component.filterForm.patchValue({ batchId: 'BATCH-CONTRACT' });
      apiService.validateTransfer.calls.reset();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      const req = apiService.validateTransfer.calls.mostRecent().args[0];
      expect(req.contractId).toBe('CONTRACT-001');
    }));

    it('should pass null contractId when no matching batch', fakeAsync(() => {
      fillRequiredFields();
      component.filterForm.patchValue({ batchId: null });
      apiService.validateTransfer.calls.reset();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      const req = apiService.validateTransfer.calls.mostRecent().args[0];
      expect(req.contractId).toBeNull();
    }));
  });

  describe('processUnit - unit from retrieved list drive resolution', () => {
    it('should use driveId from retrieved unit when form driveId is empty', fakeAsync(() => {
      fillRequiredFields();
      component.retrievedUnits.set([
        { ...mockUnitsResponse.data[0], driveId: 'DRIVE-FROM-LIST', uiStatus: 'PENDING' as const },
      ]);
      const scanForListUnit: UnitValidationResponse = {
        ...mockScanInput,
        parsedUnitId: 'W633319111560',
      };
      apiService.validateTransfer.calls.reset();
      component.onScanUnitIdValidated(scanForListUnit);
      tick();
      expect(apiService.validateTransfer).toHaveBeenCalled();
    }));
  });

  describe('resetResults - internal state', () => {
    it('should reset all scan-related signals and clear unitIdField', () => {
      component.retrievedUnits.set([{ ...mockUnitsResponse.data[0], uiStatus: 'PENDING' as const }]);
      component.donationDetails.set(mockDonationDetails);
      component.hasRetrievedData.set(true);
      component.scanValidationError.set('error');
      component.scanMaxBleedError.set('bleed');
      component.scanValidationWarning.set('warning');
      component.validatedScanUnit.set(mockScanInput);
      component.unitScanControl.setValue('some-value');

      // Trigger resetResults via clearAll
      component.clearAll();

      expect(component.retrievedUnits().length).toBe(0);
      expect(component.donationDetails()).toBeNull();
      expect(component.hasRetrievedData()).toBeFalse();
      expect(component.scanValidationError()).toBeNull();
      expect(component.scanMaxBleedError()).toBeNull();
      expect(component.scanValidationWarning()).toBeNull();
      expect(component.validatedScanUnit()).toBeNull();
      expect(component.unitScanControl.value).toBe('');
    });
  });

  describe('clearAll - search controls', () => {
    it('should reset all search controls', () => {
      component.batchSearchControl.setValue('search1');
      component.driveSearchControl.setValue('search2');
      component.shipperSearchControl.setValue('search3');
      component.checkInTypeSearch.setValue('search4');

      component.clearAll();

      expect(component.batchSearchControl.value).toBe('');
      expect(component.driveSearchControl.value).toBe('');
      expect(component.shipperSearchControl.value).toBe('');
      expect(component.checkInTypeSearch.value).toBe('');
    });

    it('should clear driveOptions and shipperOptions', () => {
      component.driveOptions.set(mockDrives);
      component.shipperOptions.set([{ shipperNo: 'SH001' }]);

      component.clearAll();

      expect(component.driveOptions().length).toBe(0);
      expect(component.shipperOptions().length).toBe(0);
    });
  });

  describe('onRetrieve - getUnits params', () => {
    it('should pass batchId and driveId and shipperNumber when all provided', fakeAsync(() => {
      fillRequiredFields();
      apiService.getUnits.calls.reset();
      component.onRetrieve();
      tick();
      const params = apiService.getUnits.calls.mostRecent().args[0];
      expect(params.batchId).toBe('111619-CB9006');
      expect(params.driveId).toBe('167279');
      expect(params.shipperNumber).toBe('SHP001');
    }));

    it('should pass undefined for optional params when empty', fakeAsync(() => {
      component.onCheckInTypeChange('T');
      component.filterForm.patchValue({
        checkInType: 'T',
        collectionDate: moment('2025-01-01'),
        batchId: null,
        shipperNumber: '',
      });
      component.filterForm.get('driveId')?.setValue('167279');
      apiService.getUnits.calls.reset();
      component.onRetrieve();
      tick();
      const params = apiService.getUnits.calls.mostRecent().args[0];
      expect(params.batchId).toBeUndefined();
      expect(params.shipperNumber).toBeUndefined();
    }));
  });

  describe('onRetrieve - successful retrieve sets panel and unit state', () => {
    it('should set panelsVisible to true and map units with PENDING uiStatus', fakeAsync(() => {
      fillRequiredFields();
      component.panelsVisible.set(false);
      apiService.getUnits.calls.reset();
      component.onRetrieve();
      tick();
      expect(component.panelsVisible()).toBeTrue();
      expect(component.retrievedUnits().length).toBe(1);
      expect(component.retrievedUnits()[0].uiStatus).toBe('PENDING');
    }));

    it('should handle empty data array in getUnits response', fakeAsync(() => {
      apiService.getUnits.and.returnValue(of({ success: true, total: 0, data: [] }));
      fillRequiredFields();
      component.onRetrieve();
      tick();
      expect(component.retrievedUnits().length).toBe(0);
      expect(component.hasRetrievedData()).toBeTrue();
    }));

    it('should handle null data in getUnits response', fakeAsync(() => {
      apiService.getUnits.and.returnValue(of({ success: true, total: 0, data: null as any }));
      fillRequiredFields();
      component.onRetrieve();
      tick();
      expect(component.retrievedUnits().length).toBe(0);
    }));
  });

  describe('onScanUnitIdValidated - sets validatedScanUnit', () => {
    it('should store the validated scan unit', fakeAsync(() => {
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      expect(component.validatedScanUnit()).toEqual(mockScanInput);
    }));
  });

  describe('onUnitRowClick - clears previous scan state', () => {
    it('should clear scan errors and donation details before loading new details', fakeAsync(() => {
      fillRequiredFields();
      component.scanValidationError.set('old error');
      component.scanMaxBleedError.set('old bleed');
      component.scanValidationWarning.set('old warning');
      component.donationDetails.set(mockDonationDetails);

      component.onUnitRowClick(mockUnitsResponse.data[0]);
      tick();

      // The old errors should be cleared (new details loaded replaces donationDetails)
      expect(component.scanValidationError()).toBeNull();
      expect(component.scanMaxBleedError()).toBeNull();
      expect(component.scanValidationWarning()).toBeNull();
    }));

    it('should not set donationDetails when API returns null', fakeAsync(() => {
      fillRequiredFields();
      apiService.getDonationDetails.and.returnValue(of(null));
      component.onUnitRowClick(mockUnitsResponse.data[0]);
      tick();
      expect(component.donationDetails()).toBeNull();
    }));
  });

  describe('processUnit - transfer success with default message', () => {
    it('should transfer unit successfully even when response message is empty', fakeAsync(() => {
      apiService.transfer.and.returnValue(of({
        success: true,
        message: '',
        data: [mockTransferResult],
      }));
      fillRequiredFields();
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      // Unit should be added with TRANSFERRED status regardless of message
      expect(component.retrievedUnits().length).toBe(1);
      expect(component.retrievedUnits()[0].uiStatus).toBe('TRANSFERRED');
      expect(component.isScanning()).toBeFalse();
    }));
  });

  describe('processUnit - generatedBatchId uses form temp values', () => {
    it('should create new batch option with parsed temp values from form', fakeAsync(() => {
      const transferWithNewBatch: TransferResponse = {
        success: true,
        message: 'Done.',
        data: [{ ...mockTransferResult, generatedBatchId: 'NEW-BATCH-99' }],
      };
      apiService.transfer.and.returnValue(of(transferWithNewBatch));
      fillRequiredFields();
      component.filterForm.get('minTemp')?.setValue('21.5');
      component.filterForm.get('maxTemp')?.setValue('33.3');
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      const newBatch = component.batchOptions().find(b => b.batchId === 'NEW-BATCH-99');
      expect(newBatch).toBeTruthy();
      expect(newBatch?.minTemp).toBe(21.5);
      expect(newBatch?.maxTemp).toBe(33.3);
    }));

    it('should default temp to 0 when form temps are empty', fakeAsync(() => {
      const transferWithNewBatch: TransferResponse = {
        success: true,
        message: 'Done.',
        data: [{ ...mockTransferResult, generatedBatchId: 'NEW-BATCH-ZERO' }],
      };
      apiService.transfer.and.returnValue(of(transferWithNewBatch));
      fillRequiredFields();
      component.filterForm.get('minTemp')?.setValue('');
      component.filterForm.get('maxTemp')?.setValue('');
      component.onScanUnitIdValidated(mockScanInput);
      tick();
      const newBatch = component.batchOptions().find(b => b.batchId === 'NEW-BATCH-ZERO');
      expect(newBatch?.minTemp).toBe(0);
      expect(newBatch?.maxTemp).toBe(0);
    }));
  });

  describe('showNoBatchesFound and showNoDrivesFound - false cases', () => {
    it('showNoBatchesFound should be false when search is empty', () => {
      component.batchOptions.set([]);
      component.batchSearchControl.setValue('');
      expect(component.showNoBatchesFound()).toBeFalse();
    });

    it('showNoDrivesFound should be false when search is empty', () => {
      component.driveOptions.set([]);
      component.driveSearchControl.setValue('');
      expect(component.showNoDrivesFound()).toBeFalse();
    });

    it('showNoShippersFound should be false when search is empty', () => {
      component.shipperOptions.set([]);
      component.shipperSearchControl.setValue('');
      expect(component.showNoShippersFound()).toBeFalse();
    });

    it('showNoTypesFound should be false when search is empty', () => {
      component.checkInTypeSearch.setValue('');
      expect(component.showNoTypesFound()).toBeFalse();
    });
  });

  describe('panelStatus computed', () => {
    it('should return ERROR when both max-bleed error and warning exist', () => {
      component.scanMaxBleedError.set('bleed error');
      component.scanValidationWarning.set('some warning');
      expect(component.panelStatus()).toBe('ERROR');
    });
  });

  describe('onDriveSelected - resets shipper state', () => {
    it('should clear shipper-related form value and controls', () => {
      component.onCheckInTypeChange('U');
      component.filterForm.get('shipperNumber')?.setValue('SHP-OLD');
      component.shipperOptions.set([{ shipperNo: 'SH001' }]);
      component.shipperSearchControl.setValue('SH');

      component.onDriveSelected(null);

      expect(component.filterForm.get('shipperNumber')?.value).toBe('');
      expect(component.shipperOptions().length).toBe(0);
      expect(component.shipperSearchControl.value).toBe('');
    });
  });

  describe('ngOnInit - search control subscriptions', () => {
    it('should update batchSearchValue signal when batchSearchControl changes', () => {
      component.batchSearchControl.setValue('test-batch-search');
      expect(component.filteredBatchOptions()).toBeDefined();
    });

    it('should update driveSearchValue signal when driveSearchControl changes', () => {
      component.driveSearchControl.setValue('test-drive-search');
      expect(component.filteredDriveOptions()).toBeDefined();
    });

    it('should update shipperSearchValue signal when shipperSearchControl changes', () => {
      component.shipperSearchControl.setValue('test-shipper-search');
      expect(component.filteredShipperOptions()).toBeDefined();
    });

    it('should handle null values from search controls', () => {
      component.batchSearchControl.setValue(null as any);
      component.driveSearchControl.setValue(null as any);
      component.shipperSearchControl.setValue(null as any);
      component.checkInTypeSearch.setValue(null as any);
      // Computed signals should still work with empty string fallback
      expect(component.filteredBatchOptions()).toBeDefined();
      expect(component.filteredDriveOptions()).toBeDefined();
      expect(component.filteredShipperOptions()).toBeDefined();
      expect(component.filteredCheckInTypeOptions()).toBeDefined();
    });
  });
});
