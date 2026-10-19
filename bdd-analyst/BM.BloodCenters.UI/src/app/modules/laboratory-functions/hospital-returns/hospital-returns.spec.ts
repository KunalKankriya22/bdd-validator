import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { HospitalReturnsComponent } from './hospital-returns';
import { HospitalReturnItemApiService } from './services/hospital-return-item-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { CustomerMismatchDialogComponent } from './customer-mismatch-dialog/customer-mismatch-dialog';
import { PrintReturnSlipDialogComponent } from './print-return-slip-dialog/print-return-slip-dialog';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  HospitalReturnItemDto,
  HospitalReturnItemApiResponse,
  ScanProductResult,
  EvaluateReturnResult,
  CommitReturnResult,
} from './models/hospital-return-item.model';

describe('HospitalReturnsComponent', () => {
  let component: HospitalReturnsComponent;
  let fixture: ComponentFixture<HospitalReturnsComponent>;
  let apiServiceSpy: jasmine.SpyObj<HospitalReturnItemApiService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogOpenSpy: jasmine.Spy;

  const chapterChanged$ = new Subject<void>();

  const mockItem: HospitalReturnItemDto = {
    unitId: 'UNIT001',
    returnAdviceId: 'ADVICE001',
    productCode: 'PROD001',
    aboRh: 'O Pos',
    expDate: '2024-12-31T23:59:00Z',
    returnReasonCode: 'RR001',
    returnReasonDescription: 'No Apparent Reason',
    locationId: 'LOC001',
    chapterId: 'TEST',
    collDate: '2024-06-15',
    customerId: 'CUST001',
    crDbInd: 'CR',
  };

  const mockScanResult: ScanProductResult = {
    unitId: 'UNIT001',
    productCode: '04250',
    productCodeDesc: 'Red Blood Cells',
    bloodType: '51',
    expDate: '2024-12-31T23:59:00Z',
    collDate: '2024-06-15',
    customerId: 'WAD-RG0001',
    customerName: 'BAYLOR UNIV MED CENTER',
    customerType: 'RG',
    inventoryClass: 'RE',
    stockState: 'DL',
    aliquot: '1',
    shipmentNo: 'SH001',
    customerMismatch: false,
  };

  const mockEvaluateResult: EvaluateReturnResult = {
    creditDecision: 'CR',
    routingDecision: 'RE',
    locationId: 'QUARANTINE',
    isExpired: true,
    isBiohazard: false,
    isDirectedDonor: false,
    warnings: [],
  };

  const mockCommitResult: CommitReturnResult = {
    unitId: 'UNIT001',
    returnAdviceId: 'ADVICE001',
    creditDecision: 'CR',
    routingDecision: 'RE',
    locationId: 'QUARANTINE',
    returnItemInserted: true,
    shippedProductUpdated: true,
    pickSlipProductUpdated: true,
    activeProductInserted: false,
    discardProductInserted: false,
  };

  const mockApiResponse: HospitalReturnItemApiResponse<HospitalReturnItemDto> = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: [mockItem],
    total: 1,
  };

  const mockUnitValidationData = {
    parsedUnitId: 'UNIT001',
    checkDigit: null,
    codeScheme: 'I' as const,
    manualUnitId: 'UNIT001',
    codabarUnitScheme: null,
    entryMode: 'M' as const,
    barcodeType: 'CODE128' as const,
    chapterScheme: 'I' as const,
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('HospitalReturnItemApiService', [
      'getAll',
      'getById',
      'getByReturnAdviceId',
      'create',
      'update',
      'delete',
      'deleteMultiple',
      'getReturnIds',
      'getReturnAdviceDetails',
      'getCustomerIds',
      'getContacts',
      'getReturnCodes',
      'getProductCodes',
      'getAboRhOptions',
      'scanProduct',
      'evaluateReturn',
      'commitReturn',
      'getPrinters',
      'closeReturnAdvice',
      'createReturnAdvice',
    ]);
    apiServiceSpy.getByReturnAdviceId.and.returnValue(of(mockApiResponse));
    apiServiceSpy.getAll.and.returnValue(of(mockApiResponse));
    apiServiceSpy.scanProduct.and.returnValue(of({
      success: true, statusCode: 200, message: 'Success',
      data: [mockScanResult], total: 1,
    }));
    apiServiceSpy.evaluateReturn.and.returnValue(of({
      success: true, statusCode: 200, message: 'Success',
      data: [mockEvaluateResult], total: 1,
    }));
    apiServiceSpy.commitReturn.and.returnValue(of({
      success: true, statusCode: 200, message: 'Success',
      data: [mockCommitResult], total: 1,
    }));
    apiServiceSpy.getPrinters.and.returnValue(of([
      { printerId: 'txdevj', printerDescription: 'Dev Printer' },
    ]));
    apiServiceSpy.closeReturnAdvice.and.returnValue(of({
      success: true, statusCode: 200, message: 'Return advice closed successfully',
      data: [], total: 0,
    }));
    apiServiceSpy.getReturnIds.and.returnValue(of([
      { value: 'RET001', label: 'RET001' },
    ]));
    apiServiceSpy.getReturnAdviceDetails.and.returnValue(of({
      returnAdviceId: 'RET001',
      consigneeId: 'CON001',
      customerId: 'CUST001',
      customerName: 'City Hospital',
      returnedBy: 'Smith, John',
      adviceStatus: 'OP',
    }));
    apiServiceSpy.getCustomerIds.and.returnValue(of([
      { value: 'CUST001', label: 'CUST001 - City Hospital' },
    ]));
    apiServiceSpy.getContacts.and.returnValue(of([
      { value: 'Smith, John', label: 'Smith, John' },
    ]));
    apiServiceSpy.getReturnCodes.and.returnValue(of([
      { value: 'NOAPP', label: 'NOAPP - No Apparent Reason' },
      { value: 'RETUR', label: 'RETUR - Return to Inventory' },
    ]));
    apiServiceSpy.getProductCodes.and.returnValue(of([
      { value: '04250', label: '04250 - Red Blood Cells' },
    ]));
    apiServiceSpy.getAboRhOptions.and.returnValue(of([
      { value: '51', label: '51 - O Pos' },
    ]));
    apiServiceSpy.createReturnAdvice.and.returnValue(of({
      success: true, statusCode: 201, message: 'Return advice created successfully',
      data: [{ returnAdviceId: 'NEW001', chapterId: 'TEST', consigneeId: 'CON001',
        customerId: 'CUST001', customerName: 'City Hospital', adviceStatus: 'OP' }],
      total: 1,
    }));

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], {
      pageHeaderData: signal({
        title: 'Hospital Returns',
        subtitle: 'Manage Hospital Return Items (IMIRETN)',
      }),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Hospital Returns');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('Manage Hospital Return Items (IMIRETN)');
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);

    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    snackbarServiceSpy = createMockSnackbarService();

    TestBed.configureTestingModule({
      imports: [HospitalReturnsComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: HospitalReturnItemApiService, useValue: apiServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: ActivatedRoute, useValue: {} },
      ],
    });

    fixture = TestBed.createComponent(HospitalReturnsComponent);
    component = fixture.componentInstance;
    dialogOpenSpy = spyOn((component as any).dialog, 'open');
  });

  describe('Component Initialization', () => {




    it('should initialize By field as disabled', () => {
      expect(component.filterForm.get('by')?.disabled).toBeTrue();
    });



    it('should start with hasSearched false', () => {
      expect((component as any).hasSearched()).toBeFalse();
    });

    it('should have returnCode as required', () => {
      expect(component.detailForm.get('returnCode')?.hasError('required')).toBeTrue();
    });
  });

  describe('Retrieve', () => {
    it('should set hasSearched to true', () => {
      component.filterForm.patchValue({ returnId: 'RET001', customerId: 'CUST001' });
      component.onRetrieveClick();
      expect((component as any).hasSearched()).toBeTrue();
    });



    it('should clear detail card fields when retrieving with a new Return ID', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Simulate a previous retrieval with populated detail fields
      component.filterForm.patchValue({ returnId: 'RET001', customerId: 'CUST001' });
      component.scanResult.set(mockScanResult);
      component.evaluateResult.set(mockEvaluateResult);
      component.detailForm.patchValue({
        productCode: '04250',
        aboRh: '51',
        returnCode: 'NOAPP',
        returnReason: 'No Apparent Reason',
      });
      component.productCodeOptions.set([{ value: '04250', label: '04250 - Red Blood Cells' }]);
      component.aboRhOptions.set([{ value: '51', label: '51 - O Pos' }]);
      (component as any).productCodeValue.set('04250');
      (component as any).aboRhValue.set('51');
      (component as any).returnCodeValue.set('NOAPP');
      (component as any).returnReason.set('No Apparent Reason');
      (component as any).expirationDateDisplay.set('31-DEC-2024 23:59');

      // Change Return ID and retrieve again
      component.filterForm.patchValue({ returnId: 'RET002' });
      component.retrieve();
      tick();

      // All detail card fields must be cleared
      expect(component.detailForm.get('productCode')?.value).toBeNull();
      expect(component.detailForm.get('aboRh')?.value).toBeNull();
      expect(component.detailForm.get('returnCode')?.value).toBeNull();
      expect(component.detailForm.get('returnReason')?.value).toBeNull();
      expect(component.scanResult()).toBeNull();
      expect(component.evaluateResult()).toBeNull();
      expect(component.productCodeOptions()).toEqual([]);
      expect(component.aboRhOptions()).toEqual([]);
      expect((component as any).productCodeValue()).toBeNull();
      expect((component as any).aboRhValue()).toBeNull();
      expect((component as any).returnCodeValue()).toBeNull();
      expect(component.returnReason()).toBe('-');
      expect((component as any).expirationDateDisplay()).toBe('');
      expect((component as any).unitIdValidated()).toBeFalse();
    }));
  });

  describe('Return ID Auto-Population', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should auto-populate customer ID and returned by on return ID selection', fakeAsync(() => {
      component.onReturnIdChange({ value: 'RET001', source: {} } as MatSelectChange);
      tick();

      expect(apiServiceSpy.getReturnAdviceDetails).toHaveBeenCalledWith('RET001');
      expect(component.filterForm.get('customerId')?.value).toBe('CUST001');
      expect(component.filterForm.get('by')?.value).toBe('Smith, John');
    }));

    it('should load contacts for the auto-populated customer', fakeAsync(() => {
      component.onReturnIdChange({ value: 'RET001', source: {} } as MatSelectChange);
      tick();

      expect(apiServiceSpy.getContacts).toHaveBeenCalledWith('CUST001');
    }));

    it('should set customer name from matched option', fakeAsync(() => {
      component.onReturnIdChange({ value: 'RET001', source: {} } as MatSelectChange);
      tick();

      expect(component.customerName()).toBe('City Hospital');
    }));

    it('should trigger retrieve after auto-population', fakeAsync(() => {
      component.filterForm.get('returnId')?.setValue('RET001');
      component.onReturnIdChange({ value: 'RET001', source: {} } as MatSelectChange);
      tick();

      expect(apiServiceSpy.getAll).toHaveBeenCalled();
      expect((component as any).hasSearched()).toBeTrue();
    }));



    it('should handle advice with no returnedBy', fakeAsync(() => {
      apiServiceSpy.getReturnAdviceDetails.and.returnValue(of({
        returnAdviceId: 'RET001',
        consigneeId: 'CON001',
        customerId: 'CUST001',
        customerName: 'City Hospital',
        returnedBy: undefined,
        adviceStatus: 'OP',
      }));

      component.onReturnIdChange({ value: 'RET001', source: {} } as MatSelectChange);
      tick();

      expect(component.filterForm.get('customerId')?.value).toBe('CUST001');
      expect(component.filterForm.get('by')?.value).toBeNull();
    }));
  });

  describe('Unit Scan Flow', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
    }));

    it('should call scanProduct on unit validated', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(apiServiceSpy.scanProduct).toHaveBeenCalledWith({
        scannedUnitId: 'UNIT001',
        returnAdviceId: 'ADVICE001',
        customerId: 'CUST001',
      });
    }));

    it('should populate detail fields from scan result', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(component.scanResult()).toBeTruthy();
      expect(component.scanResult()?.productCode).toBe('04250');
      expect(component.scanResult()?.bloodType).toBe('51');
    }));

    it('should load table items via getByReturnAdviceId', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(apiServiceSpy.getByReturnAdviceId).toHaveBeenCalledWith('ADVICE001');
    }));

    it('should set unitIdValidated to true only after scan result is applied', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect((component as any).unitIdValidated()).toBeTrue();
    }));
  });

  describe('Scan Without Return ID', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: null, customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
      const visualCheckRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      visualCheckRef.afterClosed.and.returnValue(of({ checked: true }));
      dialogOpenSpy.and.returnValue(visualCheckRef);
    }));

    it('should call scanProduct without returnAdviceId', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(apiServiceSpy.scanProduct).toHaveBeenCalledWith({
        scannedUnitId: 'UNIT001',
        returnAdviceId: undefined,
        customerId: 'CUST001',
      });
    }));





    it('should populate dropdown after commit auto-creates advice', fakeAsync(() => {
      apiServiceSpy.commitReturn.and.returnValue(of({
        success: true, statusCode: 201, message: 'Return committed successfully',
        data: [mockCommitResult], total: 1, returnAdviceId: 'RT26-00000001',
      }));
      apiServiceSpy.getByReturnAdviceId.and.returnValue(of(mockApiResponse));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      component.scanResult.set(mockScanResult);
      component.evaluateResult.set(mockEvaluateResult);
      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      const opts = component.returnIdOptions();
      expect(opts.some((o: any) => o.value === 'RT26-00000001')).toBeTrue();
      expect(component.filterForm.get('returnId')?.value).toBe('RT26-00000001');
      expect((component as any).returnIdValue()).toBe('RT26-00000001');
    }));


  });

  describe('Customer Mismatch Dialog', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
    }));



    it('should proceed with scan when dialog returns proceed true', fakeAsync(() => {
      const mismatchScan: ScanProductResult = {
        ...mockScanResult,
        customerMismatch: true,
        returnAdviceCustomerId: 'WAD-RG0051',
        returnAdviceCustomerName: 'PARKLAND MEMORIAL HOSPITAL',
      };
      apiServiceSpy.scanProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'Success',
        data: [mismatchScan], total: 1,
      }));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ proceed: true }));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(component.scanResult()).toBeTruthy();
      expect(component.scanResult()?.unitId).toBe('UNIT001');
    }));

    it('should clear unit when dialog is cancelled', fakeAsync(() => {
      const mismatchScan: ScanProductResult = {
        ...mockScanResult,
        customerMismatch: true,
        returnAdviceCustomerId: 'WAD-RG0051',
        returnAdviceCustomerName: 'PARKLAND MEMORIAL HOSPITAL',
      };
      apiServiceSpy.scanProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'Success',
        data: [mismatchScan], total: 1,
      }));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(component.scanResult()).toBeNull();
    }));

    it('should not show detail field errors while mismatch dialog is open', fakeAsync(() => {
      const mismatchScan: ScanProductResult = {
        ...mockScanResult,
        customerMismatch: true,
        returnAdviceCustomerId: 'WAD-RG0051',
        returnAdviceCustomerName: 'PARKLAND MEMORIAL HOSPITAL',
      };
      apiServiceSpy.scanProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'Success',
        data: [mismatchScan], total: 1,
      }));

      const dialogClosedSubject = new Subject<any>();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(dialogClosedSubject.asObservable());
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect((component as any).unitIdValidated()).toBeFalse();

      dialogClosedSubject.next({ proceed: true });
      tick();

      expect((component as any).unitIdValidated()).toBeTrue();
    }));

    it('should not open dialog when no customer mismatch', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(dialogOpenSpy).not.toHaveBeenCalled();
      expect(component.scanResult()).toBeTruthy();
    }));
  });

  describe('Auto-Commit on Return Code Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      component.scanResult.set(mockScanResult);
      const visualCheckRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      visualCheckRef.afterClosed.and.returnValue(of({ checked: true }));
      dialogOpenSpy.and.returnValue(visualCheckRef);
    }));

    it('should call evaluateReturn when return code changes', fakeAsync(() => {
      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      expect(apiServiceSpy.evaluateReturn).toHaveBeenCalled();
      const request = apiServiceSpy.evaluateReturn.calls.mostRecent().args[0];
      expect(request.returnReasonCode).toBe('NOAPP');
      expect(request.unitId).toBe('UNIT001');
    }));

    it('should auto-commit after evaluate succeeds', fakeAsync(() => {
      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      expect(apiServiceSpy.commitReturn).toHaveBeenCalled();
      const request = apiServiceSpy.commitReturn.calls.mostRecent().args[0];
      expect(request.unitId).toBe('UNIT001');
      expect(request.returnReasonCode).toBe('NOAPP');
      expect(request.creditDecision).toBe('CR');
    }));

    it('should refresh table after auto-commit', fakeAsync(() => {
      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      expect(apiServiceSpy.getByReturnAdviceId).toHaveBeenCalledWith('ADVICE001');
    }));

    it('should clear detail fields after auto-commit', fakeAsync(() => {
      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      expect(component.scanResult()).toBeNull();
      expect(component.evaluateResult()).toBeNull();
      expect((component as any).unitIdValidated()).toBeFalse();
    }));







    it('should keep return code enabled after commit', fakeAsync(() => {
      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      expect(component.detailForm.get('returnCode')?.enabled).toBeTrue();
    }));

    it('should mark detail form as untouched after commit', fakeAsync(() => {
      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick(0);

      expect(component.detailForm.touched).toBeFalse();
    }));
  });

  describe('Print Return Slip', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
      (component as any).tableDataSource = [mockItem];
    }));

    it('should load printers and open dialog on print', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onPrint();
      tick();

      expect(apiServiceSpy.getPrinters).toHaveBeenCalled();
      expect(dialogOpenSpy).toHaveBeenCalledWith(
        PrintReturnSlipDialogComponent,
        jasmine.objectContaining({
          disableClose: true,
          width: '508px',
          data: jasmine.objectContaining({
            printers: [{ printerId: 'txdevj', printerDescription: 'Dev Printer' }],
          }),
        }),
      );
    }));

    it('should call closeReturnAdvice when dialog confirms', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ printerId: 'txdevj', closeAndPrint: true }));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onPrint();
      tick();

      expect(apiServiceSpy.closeReturnAdvice).toHaveBeenCalledWith('ADVICE001', {
        printerId: 'txdevj',
        printPickSlip: true,
      });
    }));




  });
  describe('Chapter Change', () => {
    it('should clear all on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).hasSearched.set(true);
      chapterChanged$.next();
      tick();

      expect((component as any).hasSearched()).toBeFalse();
    }));
  });

  describe('Date Formatting', () => {
    it('should format date in DD-MON-YYYY HH:mm format', () => {
      expect(component.formatDate('2024-06-15')).toBe('15-JUN-2024 00:00');
    });


  });

  describe('Expiration Date Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
    }));

    it('should display formatted expiration date from scan result', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect((component as any).expirationDateDisplay()).toBeTruthy();
    }));

    it('should clear expirationDateDisplay when scan has no expDate', fakeAsync(() => {
      const noExpScan: ScanProductResult = { ...mockScanResult, expDate: undefined };
      apiServiceSpy.scanProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'Success',
        data: [noExpScan], total: 1,
      }));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect((component as any).expirationDateDisplay()).toBe('');
    }));

    it('should clear expirationDateDisplay on unit cleared', fakeAsync(() => {
      (component as any).expirationDateDisplay.set('31-DEC-2024 23:59');

      component.onUnitCleared();

      expect((component as any).expirationDateDisplay()).toBe('');
    }));

    it('should clear expirationDateDisplay on clear all', fakeAsync(() => {
      (component as any).expirationDateDisplay.set('31-DEC-2024 23:59');

      component.clearAll();

      expect((component as any).expirationDateDisplay()).toBe('');
    }));
  });
  describe('Table Column Mapping', () => {
    it('should use returnReasonDescription key for Reason Code column', () => {
      const reasonCol = component.tableConfig.columns.find(c => c.header === 'Reason Code');
      expect(reasonCol).toBeTruthy();
      expect(reasonCol!.key).toBe('returnReasonDescription');
    });

    it('should use aboRh key for ABO/Rh column', () => {
      const aboCol = component.tableConfig.columns.find(c => c.header === 'ABO/Rh');
      expect(aboCol).toBeTruthy();
      expect(aboCol!.key).toBe('aboRh');
    });


  });

  describe('Customer ID Change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should load contacts and enable By field when customer selected', fakeAsync(() => {
      component.customerIdOptions.set([
        { value: 'CUST001', label: 'CUST001 - City Hospital' },
      ]);
      component.onCustomerIdChange({ value: 'CUST001', source: {} } as MatSelectChange);
      tick();

      expect(apiServiceSpy.getContacts).toHaveBeenCalledWith('CUST001');
      expect(component.filterForm.get('by')?.enabled).toBeTrue();
      expect(component.customerName()).toBe('City Hospital');
    }));

    it('should reset By field and customer name when customer cleared', fakeAsync(() => {
      component.filterForm.get('by')?.enable();
      component.filterForm.get('by')?.setValue('Smith, John');
      (component as any).customerName.set('City Hospital');

      component.onCustomerIdChange({ value: null, source: {} } as MatSelectChange);
      tick();

      expect(component.filterForm.get('by')?.disabled).toBeTrue();
      expect(component.customerName()).toBe('-');
    }));
  });

  describe('Product Code Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
      component.scanResult.set(mockScanResult);
    }));

    it('should load ABORh options when product code selected', fakeAsync(() => {
      component.onProductCodeSelected('04250');
      tick();

      expect(apiServiceSpy.getAboRhOptions).toHaveBeenCalled();
    }));

    it('should clear aboRh value when product code changes and multiple options exist', fakeAsync(() => {
      apiServiceSpy.getAboRhOptions.and.returnValue(of([
        { value: '51', label: '51 - O Pos' },
        { value: '52', label: '52 - O Neg' },
      ]));
      component.detailForm.get('aboRh')?.setValue('51');
      component.onProductCodeSelected('04250');
      tick();

      expect(component.detailForm.get('aboRh')?.value).toBeNull();
    }));

    it('should auto-select ABORh when only one option returned', fakeAsync(() => {
      apiServiceSpy.getAboRhOptions.and.returnValue(of([
        { value: '51', label: '51 - O Pos' },
      ]));

      component.onProductCodeSelected('04250');
      tick();

      expect(component.detailForm.get('aboRh')?.value).toBe('51');
    }));

    it('should not call API when product code is empty', fakeAsync(() => {
      apiServiceSpy.getAboRhOptions.calls.reset();
      component.onProductCodeSelected('');
      tick();

      expect(apiServiceSpy.getAboRhOptions).not.toHaveBeenCalled();
    }));
  });

  describe('Clear All', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset filter form and detail state', fakeAsync(() => {
      component.filterForm.patchValue({ returnId: 'RET001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
      component.scanResult.set(mockScanResult);
      component.evaluateResult.set(mockEvaluateResult);

      component.clearAll();
      tick();

      expect(component.filterForm.get('returnId')?.value).toBeNull();
      expect(component.filterForm.get('customerId')?.value).toBeNull();
      expect((component as any).hasSearched()).toBeFalse();
      expect(component.scanResult()).toBeNull();
      expect(component.evaluateResult()).toBeNull();
      expect(component.customerName()).toBe('-');
    }));

    it('should disable By field after clear all', fakeAsync(() => {
      component.filterForm.get('by')?.enable();
      component.clearAll();
      tick();

      expect(component.filterForm.get('by')?.disabled).toBeTrue();
    }));
  });

  describe('Unit Cleared', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
    }));

    it('should reset all detail signals', fakeAsync(() => {
      component.scanResult.set(mockScanResult);
      component.evaluateResult.set(mockEvaluateResult);
      (component as any).unitIdValidated.set(true);
      component.productCodeOptions.set([{ value: '04250', label: 'RBC' }]);
      component.aboRhOptions.set([{ value: '51', label: 'O Pos' }]);
      (component as any).aliquotDisplay.set('01');
      (component as any).orderDateDisplay.set('15-JUN-2024');

      component.onUnitCleared();

      expect(component.scanResult()).toBeNull();
      expect(component.evaluateResult()).toBeNull();
      expect((component as any).unitIdValidated()).toBeFalse();
      expect(component.productCodeOptions()).toEqual([]);
      expect(component.aboRhOptions()).toEqual([]);
      expect((component as any).aliquotDisplay()).toBe('-');
      expect((component as any).orderDateDisplay()).toBe('-');
    }));

    it('should reset detail form controls', () => {
      component.detailForm.patchValue({ productCode: '04250', aboRh: '51', returnCode: 'NOAPP' });

      component.onUnitCleared();

      expect(component.detailForm.get('productCode')?.value).toBeNull();
      expect(component.detailForm.get('aboRh')?.value).toBeNull();
      expect(component.detailForm.get('returnCode')?.value).toBeNull();
    });
  });

  describe('Filter Form Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should require at least returnId or customerId', () => {
      component.filterForm.patchValue({ returnId: null, customerId: null });
      expect(component.filterForm.hasError('atLeastOneRequired')).toBeTrue();
    });

    it('should be valid when returnId is set', () => {
      component.filterForm.patchValue({ returnId: 'RET001', customerId: null });
      expect(component.filterForm.valid).toBeTrue();
    });

    it('should be valid when customerId is set', () => {
      component.filterForm.patchValue({ returnId: null, customerId: 'CUST001' });
      expect(component.filterForm.valid).toBeTrue();
    });
  });

  describe('Scan Error Handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
    }));

    it('should show error on scan API failure', fakeAsync(() => {
      apiServiceSpy.scanProduct.and.returnValue(throwError(() => ({
        error: { message: 'Unit not found' },
      })));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.scanResult()).toBeNull();
    }));

    it('should show error on unsuccessful scan response', fakeAsync(() => {
      apiServiceSpy.scanProduct.and.returnValue(of({
        success: false, statusCode: 404, message: 'Product not shipped',
        data: [], total: 0,
      }));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Evaluate Error Handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      component.scanResult.set(mockScanResult);
    }));

    it('should show error when evaluate API fails', fakeAsync(() => {
      apiServiceSpy.evaluateReturn.and.returnValue(throwError(() => ({
        error: { message: 'Invalid return reason' },
      })));

      component.detailForm.get('returnCode')?.setValue('INVALID');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Commit Error Handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      component.scanResult.set(mockScanResult);
      component.evaluateResult.set(mockEvaluateResult);
      const visualCheckRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      visualCheckRef.afterClosed.and.returnValue(of({ checked: true }));
      dialogOpenSpy.and.returnValue(visualCheckRef);
    }));

    it('should show error when commit API fails', fakeAsync(() => {
      apiServiceSpy.commitReturn.and.returnValue(throwError(() => ({
        error: { message: 'Commit failed' },
      })));

      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should show error on unsuccessful commit response', fakeAsync(() => {
      apiServiceSpy.commitReturn.and.returnValue(of({
        success: false, statusCode: 500, message: 'Database error',
        data: [], total: 0,
      }));

      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Visual Check Dialog - Decline', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      component.scanResult.set(mockScanResult);
      component.evaluateResult.set(mockEvaluateResult);
    }));

    it('should not commit when visual check is declined', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ checked: false }));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.detailForm.get('returnCode')?.setValue('NOAPP');
      tick();

      expect(apiServiceSpy.commitReturn).not.toHaveBeenCalled();
    }));
  });

  describe('Return Code Cleared', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      component.scanResult.set(mockScanResult);
    }));

    it('should reset return reason when return code cleared', fakeAsync(() => {
      component.evaluateResult.set(mockEvaluateResult);
      component.returnReason.set('No Apparent Reason');

      component.detailForm.get('returnCode')?.setValue(null);
      tick();

      expect(component.returnReason()).toBe('-');
      expect(component.evaluateResult()).toBeNull();
    }));
  });

  describe('Remaining Life Display', () => {
    it('should return empty when no scan result', () => {
      component.scanResult.set(null);
      expect((component as any).remainingLifeDisplay()).toBe('');
    });

    it('should show Expired for past expiration date', () => {
      const expiredScan = { ...mockScanResult, expDate: '2020-01-01T00:00:00Z' };
      component.scanResult.set(expiredScan);
      expect((component as any).remainingLifeDisplay()).toBe('Expired');
    });

    it('should show days remaining for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const futureScan = { ...mockScanResult, expDate: futureDate.toISOString() };
      component.scanResult.set(futureScan);
      const display = (component as any).remainingLifeDisplay();
      expect(display).toContain('d remaining');
    });
  });

  describe('Routing Label', () => {
    it('should map QU to Quarantine', () => {
      expect(component.routingLabel('QU')).toBe('Quarantine');
    });

    it('should map RE to Return to Inventory', () => {
      expect(component.routingLabel('RE')).toBe('Return to Inventory');
    });

    it('should map DI to Discard', () => {
      expect(component.routingLabel('DI')).toBe('Discard');
    });

    it('should return raw value for unknown codes', () => {
      expect(component.routingLabel('XX')).toBe('XX');
    });
  });

  describe('Detail Field Error Matcher', () => {
    it('should not show errors before unit is validated', () => {
      (component as any).unitIdValidated.set(false);
      const control = component.detailForm.get('returnCode')!;
      control.markAsTouched();
      expect(component.detailFieldErrorMatcher.isErrorState(control as any, null)).toBeFalse();
    });

    it('should show errors after unit is validated', () => {
      (component as any).unitIdValidated.set(true);
      const control = component.detailForm.get('returnCode')!;
      control.markAsTouched();
      expect(component.detailFieldErrorMatcher.isErrorState(control as any, null)).toBeTrue();
    });
  });

  describe('Print Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not call closeReturnAdvice when print dialog cancelled', fakeAsync(() => {
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
      (component as any).tableDataSource = [mockItem];

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.onPrint();
      tick();

      expect(apiServiceSpy.closeReturnAdvice).not.toHaveBeenCalled();
    }));
  });

  describe('Date Formatting Edge Cases', () => {
    it('should return empty string for null date', () => {
      expect(component.formatDate(null as any)).toBe('');
    });

    it('should return empty string for undefined date', () => {
      expect(component.formatDate(undefined as any)).toBe('');
    });
  });

  describe('Filtered Dropdown Computeds', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter return IDs by search string', () => {
      component.returnIdOptions.set([
        { value: 'RET001', label: 'RET001 - Advice 1' },
        { value: 'RET002', label: 'RET002 - Advice 2' },
      ]);
      (component as any).returnIdSearch.set('002');
      const filtered = (component as any).filteredReturnIds();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('RET002');
    });

    it('should return all return IDs when search is empty', () => {
      component.returnIdOptions.set([
        { value: 'RET001', label: 'RET001' },
        { value: 'RET002', label: 'RET002' },
      ]);
      (component as any).returnIdSearch.set('');
      expect((component as any).filteredReturnIds().length).toBe(2);
    });

    it('should filter customer IDs by search string', () => {
      component.customerIdOptions.set([
        { value: 'CUST001', label: 'CUST001 - Hospital A' },
        { value: 'CUST002', label: 'CUST002 - Hospital B' },
      ]);
      (component as any).customerIdSearch.set('Hospital B');
      const filtered = (component as any).filteredCustomerIds();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('CUST002');
    });

    it('should filter By options by search string', () => {
      (component as any).byOptions.set([
        { value: 'Smith, John', label: 'Smith, John' },
        { value: 'Doe, Jane', label: 'Doe, Jane' },
      ]);
      (component as any).bySearch.set('doe');
      const filtered = (component as any).filteredByOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('Doe, Jane');
    });

    it('should filter product codes by search string', () => {
      component.productCodeOptions.set([
        { value: '04250', label: '04250 - RBC' },
        { value: '12011', label: '12011 - Apheresis PLT' },
      ]);
      (component as any).productCodeFilter.set('rbc');
      const filtered = (component as any).filteredProductCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('04250');
    });

    it('should filter ABORh options by search string', () => {
      component.aboRhOptions.set([
        { value: '51', label: '51 - O Pos' },
        { value: '52', label: '52 - O Neg' },
      ]);
      (component as any).aboRhFilter.set('neg');
      const filtered = (component as any).filteredAboRhOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('52');
    });

    it('should filter return codes by search string', () => {
      component.returnCodeOptions.set([
        { value: 'NOAPP', label: 'NOAPP - No Apparent Reason' } as any,
        { value: 'RETUR', label: 'RETUR - Return to Inventory' } as any,
      ]);
      (component as any).returnCodeSearch.set('invent');
      const filtered = (component as any).filteredReturnCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('RETUR');
    });
  });

  describe('Selected Display Computeds', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display label for selected return ID', () => {
      component.returnIdOptions.set([{ value: 'RET001', label: 'RET001 - PAR' }]);
      (component as any).returnIdValue.set('RET001');
      expect((component as any).selectedReturnIdDisplay()).toBe('RET001 - PAR');
    });

    it('should display raw value when return ID option not found', () => {
      component.returnIdOptions.set([]);
      (component as any).returnIdValue.set('UNKNOWN');
      expect((component as any).selectedReturnIdDisplay()).toBe('UNKNOWN');
    });

    it('should display empty string when no return ID selected', () => {
      (component as any).returnIdValue.set(null);
      expect((component as any).selectedReturnIdDisplay()).toBe('');
    });

    it('should display label for selected customer ID', () => {
      component.customerIdOptions.set([{ value: 'CUST001', label: 'CUST001 - City Hospital' }]);
      (component as any).customerIdValue.set('CUST001');
      expect((component as any).selectedCustomerIdDisplay()).toBe('CUST001 - City Hospital');
    });

    it('should display raw value when customer ID option not found', () => {
      component.customerIdOptions.set([]);
      (component as any).customerIdValue.set('UNKNOWN');
      expect((component as any).selectedCustomerIdDisplay()).toBe('UNKNOWN');
    });

    it('should display empty string when no customer ID selected', () => {
      (component as any).customerIdValue.set(null);
      expect((component as any).selectedCustomerIdDisplay()).toBe('');
    });

    it('should display label for selected By option', () => {
      (component as any).byOptions.set([{ value: 'Smith, John', label: 'Smith, John' }]);
      (component as any).byValue.set('Smith, John');
      expect((component as any).selectedByDisplay()).toBe('Smith, John');
    });

    it('should display empty string when no By selected', () => {
      (component as any).byValue.set(null);
      expect((component as any).selectedByDisplay()).toBe('');
    });

    it('should display label for selected product code', () => {
      component.productCodeOptions.set([{ value: '04250', label: '04250 - RBC' }]);
      (component as any).productCodeValue.set('04250');
      expect((component as any).selectedProductCodeDisplay()).toBe('04250 - RBC');
    });

    it('should display empty string when no product code selected', () => {
      (component as any).productCodeValue.set(null);
      expect((component as any).selectedProductCodeDisplay()).toBe('');
    });

    it('should display label for selected ABORh', () => {
      component.aboRhOptions.set([{ value: '51', label: '51 - O Pos' }]);
      (component as any).aboRhValue.set('51');
      expect((component as any).selectedAboRhDisplay()).toBe('51 - O Pos');
    });

    it('should display empty string when no ABORh selected', () => {
      (component as any).aboRhValue.set(null);
      expect((component as any).selectedAboRhDisplay()).toBe('');
    });

    it('should display label for selected return code', () => {
      component.returnCodeOptions.set([
        { value: 'NOAPP', label: 'NOAPP - No Apparent Reason' } as any,
      ]);
      (component as any).returnCodeValue.set('NOAPP');
      expect((component as any).selectedReturnCodeDisplay()).toBe('NOAPP - No Apparent Reason');
    });

    it('should display empty string when no return code selected', () => {
      (component as any).returnCodeValue.set(null);
      expect((component as any).selectedReturnCodeDisplay()).toBe('');
    });
  });

  describe('Autocomplete Display Functions', () => {
    it('should return label for product code display', () => {
      component.productCodeOptions.set([{ value: '04250', label: '04250 - RBC' }]);
      expect(component.displayProductCode('04250')).toBe('04250 - RBC');
    });

    it('should return raw value when product code not found', () => {
      component.productCodeOptions.set([]);
      expect(component.displayProductCode('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should return empty string for falsy product code', () => {
      expect(component.displayProductCode('')).toBe('');
    });

    it('should return label for ABORh display', () => {
      component.aboRhOptions.set([{ value: '51', label: '51 - O Pos' }]);
      expect(component.displayAboRh('51')).toBe('51 - O Pos');
    });

    it('should return raw value when ABORh not found', () => {
      component.aboRhOptions.set([]);
      expect(component.displayAboRh('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should return empty string for falsy ABORh', () => {
      expect(component.displayAboRh('')).toBe('');
    });
  });

  describe('Search Control Wiring', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update returnIdSearch when search control changes', fakeAsync(() => {
      (component as any).returnIdSearchControl.setValue('RET');
      tick();
      expect((component as any).returnIdSearch()).toBe('RET');
    }));

    it('should update customerIdSearch when search control changes', fakeAsync(() => {
      (component as any).customerIdSearchControl.setValue('CUST');
      tick();
      expect((component as any).customerIdSearch()).toBe('CUST');
    }));

    it('should update bySearch when search control changes', fakeAsync(() => {
      (component as any).bySearchControl.setValue('Smith');
      tick();
      expect((component as any).bySearch()).toBe('Smith');
    }));

    it('should update productCodeFilter when search control changes', fakeAsync(() => {
      (component as any).productCodeSearchControl.setValue('RBC');
      tick();
      expect((component as any).productCodeFilter()).toBe('RBC');
    }));

    it('should update aboRhFilter when search control changes', fakeAsync(() => {
      (component as any).aboRhSearchControl.setValue('O Pos');
      tick();
      expect((component as any).aboRhFilter()).toBe('O Pos');
    }));

    it('should update returnCodeSearch when search control changes', fakeAsync(() => {
      (component as any).returnCodeSearchControl.setValue('NOAPP');
      tick();
      expect((component as any).returnCodeSearch()).toBe('NOAPP');
    }));

    it('should track productCode value changes', fakeAsync(() => {
      component.detailForm.get('productCode')?.setValue('04250');
      tick();
      expect((component as any).productCodeValue()).toBe('04250');
    }));

    it('should track aboRh value changes', fakeAsync(() => {
      component.detailForm.get('aboRh')?.setValue('51');
      tick();
      expect((component as any).aboRhValue()).toBe('51');
    }));
  });

  describe('Retrieve Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not call API when filter form is invalid', fakeAsync(() => {
      component.filterForm.patchValue({ returnId: null, customerId: null });
      component.retrieve();
      tick();

      expect(apiServiceSpy.getAll).not.toHaveBeenCalled();
    }));

    it('should handle getAll API error gracefully', fakeAsync(() => {
      component.filterForm.patchValue({ returnId: 'RET001', customerId: 'CUST001' });
      apiServiceSpy.getAll.and.returnValue(throwError(() => new Error('Network error')));

      component.retrieve();
      tick();

      expect(component.tableDataSource).toEqual([]);
    }));

    it('should set empty table when no returnId', fakeAsync(() => {
      component.filterForm.patchValue({ returnId: null, customerId: 'CUST001' });
      component.retrieve();
      tick();

      expect(component.tableDataSource).toEqual([]);
      expect(apiServiceSpy.getAll).not.toHaveBeenCalled();
    }));
  });

  describe('isRetrieveDisabled', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should be disabled when form is invalid', () => {
      component.filterForm.patchValue({ returnId: null, customerId: null });
      expect(component.isRetrieveDisabled).toBeTrue();
    });

    it('should be enabled when form is valid and not loading', () => {
      component.filterForm.patchValue({ returnId: 'RET001' });
      (component as any).loading.set(false);
      expect(component.isRetrieveDisabled).toBeFalse();
    });
  });

  describe('Lifecycle', () => {
    it('should load dropdowns on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getReturnIds).toHaveBeenCalled();
      expect(apiServiceSpy.getCustomerIds).toHaveBeenCalled();
      expect(apiServiceSpy.getReturnCodes).toHaveBeenCalled();
    }));

    it('should reload dropdowns on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiServiceSpy.getReturnIds.calls.reset();
      apiServiceSpy.getCustomerIds.calls.reset();
      apiServiceSpy.getReturnCodes.calls.reset();

      chapterChanged$.next();
      tick();

      expect(apiServiceSpy.getReturnIds).toHaveBeenCalled();
      expect(apiServiceSpy.getCustomerIds).toHaveBeenCalled();
      expect(apiServiceSpy.getReturnCodes).toHaveBeenCalled();
    }));

    it('should set formDirty when filter form changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.markAsPristine();
      component.formDirty.set(false);
      component.filterForm.get('returnId')?.setValue('RET001');
      component.filterForm.markAsDirty();
      // Trigger a new valueChange emission to fire the subscription
      component.filterForm.get('customerId')?.setValue('X');
      tick();

      expect(component.formDirty()).toBeTrue();
    }));
  });

  describe('Customer Name Parsing', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should extract name after dash separator', () => {
      component.customerIdOptions.set([
        { value: 'CUST001', label: 'CUST001 - City Hospital' },
      ]);
      component.onCustomerIdChange({ value: 'CUST001', source: {} } as MatSelectChange);
      expect(component.customerName()).toBe('City Hospital');
    });

    it('should use full label when no dash separator', () => {
      component.customerIdOptions.set([
        { value: 'CUST001', label: 'City Hospital' },
      ]);
      component.onCustomerIdChange({ value: 'CUST001', source: {} } as MatSelectChange);
      expect(component.customerName()).toBe('City Hospital');
    });
  });

  describe('Manual Expiry Date', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
    }));

    it('should set isManualExpiry true when scan has no expDate', fakeAsync(() => {
      const noExpScan: ScanProductResult = { ...mockScanResult, expDate: undefined };
      apiServiceSpy.scanProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'Success',
        data: [noExpScan], total: 1,
      }));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect((component as any).isManualExpiry()).toBeTrue();
    }));

    it('should set isManualExpiry false when scan has expDate', fakeAsync(() => {
      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect((component as any).isManualExpiry()).toBeFalse();
    }));
  });

  describe('Remaining Life Edge Cases', () => {
    it('should return empty string when scan has no expDate', () => {
      const noExpScan = { ...mockScanResult, expDate: undefined };
      component.scanResult.set(noExpScan);
      expect((component as any).remainingLifeDisplay()).toBe('');
    });

    it('should show hours remaining for same-day expiry', () => {
      const soonDate = new Date();
      soonDate.setHours(soonDate.getHours() + 5);
      const soonScan = { ...mockScanResult, expDate: soonDate.toISOString() };
      component.scanResult.set(soonScan);
      const display = (component as any).remainingLifeDisplay();
      expect(display).toContain('h remaining');
    });
  });

  describe('Selected Display Fallback to Raw Value', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display raw value for product code when option not found', () => {
      component.productCodeOptions.set([]);
      (component as any).productCodeValue.set('UNKNOWN');
      expect((component as any).selectedProductCodeDisplay()).toBe('UNKNOWN');
    });

    it('should display raw value for ABORh when option not found', () => {
      component.aboRhOptions.set([]);
      (component as any).aboRhValue.set('UNKNOWN');
      expect((component as any).selectedAboRhDisplay()).toBe('UNKNOWN');
    });

    it('should display raw value for return code when option not found', () => {
      component.returnCodeOptions.set([]);
      (component as any).returnCodeValue.set('UNKNOWN');
      expect((component as any).selectedReturnCodeDisplay()).toBe('UNKNOWN');
    });

    it('should display raw value for By when option not found', () => {
      (component as any).byOptions.set([]);
      (component as any).byValue.set('Unknown Person');
      expect((component as any).selectedByDisplay()).toBe('Unknown Person');
    });
  });

  describe('Scan getByReturnAdviceId Error', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
    }));

    it('should show error when table refresh fails after scan', fakeAsync(() => {
      apiServiceSpy.getByReturnAdviceId.and.returnValue(throwError(() => ({
        error: { errors: ['Table load error'], message: 'Fallback' },
      })));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.tableDataSource).toEqual([]);
    }));

    it('should extract error from errors array when available', fakeAsync(() => {
      apiServiceSpy.getByReturnAdviceId.and.returnValue(throwError(() => ({
        error: { errors: ['Specific error'] },
      })));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Specific error');
    }));
  });

  describe('Scan Error Message Extraction', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.patchValue({ returnId: 'ADVICE001', customerId: 'CUST001' });
      (component as any).hasSearched.set(true);
    }));

    it('should extract error from errorResponse', fakeAsync(() => {
      apiServiceSpy.scanProduct.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '5706', error: 'Product already returned' } },
      })));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 5706: Product already returned');
    }));

    it('should fallback to message when no errorResponse', fakeAsync(() => {
      apiServiceSpy.scanProduct.and.returnValue(throwError(() => ({
        error: { message: 'Generic error' },
      })));

      component.onUnitValidated(mockUnitValidationData);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Generic error');
    }));
  });

  describe('Form Dirty Tracking', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should track dirty state via valueChanges subscription', fakeAsync(() => {
      component.filterForm.markAsPristine();
      component.filterForm.get('returnId')?.setValue('RET001');
      tick();

      expect(component.formDirty()).toBe(component.filterForm.dirty);
    }));
  });

  describe('onByChange', () => {
    it('should update byValue signal', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onByChange({ value: 'Smith, John', source: {} } as MatSelectChange);
      expect((component as any).byValue()).toBe('Smith, John');
    }));

    it('should set null when value is undefined', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onByChange({ value: undefined, source: {} } as MatSelectChange);
      expect((component as any).byValue()).toBeNull();
    }));
  });

});
