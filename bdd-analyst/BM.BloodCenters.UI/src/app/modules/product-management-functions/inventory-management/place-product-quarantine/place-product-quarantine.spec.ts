import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';

import { PlaceProductQuarantineComponent } from './place-product-quarantine';
import { PlaceProductQuarantineApiService } from './services/place-product-quarantine-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';

import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';
import {
  PlaceQuarantineRequestDto,
  UnitInfoDto,
  QuarantineReasonDto,
  QuarantineProductCodeDto,
  ApiResponse
} from './models/place-product-quarantine.model';

describe('PlaceProductQuarantineComponent', () => {
  let error: any;
  let matDialogSpy: any;
  let headerSpy: any;
  let loggingSpy: any;
  let apiSpy: any;
  let component: PlaceProductQuarantineComponent;
  let fixture: ComponentFixture<PlaceProductQuarantineComponent>;
  let apiServiceSpy: jasmine.SpyObj<PlaceProductQuarantineApiService>;
  let loggingServiceSpy: jasmine.SpyObj<LoggingService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let mockPageHeaderService: any;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockQuarantineReasons: QuarantineReasonDto[] = [
    { code: 'QR001', description: 'Product contamination' },
    { code: 'QR002', description: 'Quality control failure' },
    { code: 'QR003', description: 'Donor interdiction' }
  ];

  const mockProducts: QuarantineProductCodeDto[] = [
    { code: 'PROD001', description: 'Whole Blood' },
    { code: 'PROD002', description: 'Red Blood Cells' }
  ];

  const mockAliquots: string[] = ['01', '02'];

  const mockUnitInfo: UnitInfoDto = {
    aboDescription: 'A Positive',
    expirationDate: '2024-07-15T00:00:00Z',
    bloodType: 'A+'
  };

  const mockSuccessResponse: ApiResponse<any> = {
    success: true,
    message: 'Product successfully placed in quarantine',
    statusCode: 201
  };

  beforeEach(() => {

    apiSpy = jasmine.createSpyObj('PlaceProductQuarantineApiService', [
      'placeQuarantine',
      'getUnitInfo',
      'getQuarantineReasons',
      'getAliquots',
      'getProductCodes'
    ]);

    loggingSpy = jasmine.createSpyObj('LoggingService', ['error', 'info', 'warn']);
    const snackbarSpy = createMockSnackbarService();
    headerSpy = createMockHeaderService();
    matDialogSpy = createMockMatDialog();
    matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);

    mockPageHeaderService = {
      pageHeaderData: signal({
        title: 'Place Product Quarantine',
        subtitle: 'Place products in quarantine for further investigation'
      })
    };

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get'], {
      currentLang: 'en',
      onLangChange: of({ lang: 'en', translations: {} })
    });
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    apiSpy.getQuarantineReasons.and.returnValue(of(mockQuarantineReasons));
    apiSpy.getProductCodes.and.returnValue(of(mockProducts));
    apiSpy.getAliquots.and.returnValue(of(mockAliquots));
    apiSpy.getUnitInfo.and.returnValue(of(mockUnitInfo));
    apiSpy.placeQuarantine.and.returnValue(of(mockSuccessResponse));



      TestBed.configureTestingModule({
      imports: [PlaceProductQuarantineComponent,
        NoopAnimationsModule,
        ReactiveFormsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: PlaceProductQuarantineApiService, useValue: apiSpy },
        { provide: LoggingService, useValue: loggingSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });

      matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);


      mockTranslateService.instant.and.returnValue('');


      mockTranslateService.get.and.returnValue(of(''));


      apiSpy.getQuarantineReasons.and.returnValue(of(mockQuarantineReasons));


      apiSpy.getProductCodes.and.returnValue(of(mockProducts));


      apiSpy.getAliquots.and.returnValue(of(mockAliquots));


      apiSpy.getUnitInfo.and.returnValue(of(mockUnitInfo));


      apiSpy.placeQuarantine.and.returnValue(of(mockSuccessResponse));


    apiServiceSpy = TestBed.inject(PlaceProductQuarantineApiService) as jasmine.SpyObj<PlaceProductQuarantineApiService>;
    loggingServiceSpy = TestBed.inject(LoggingService) as jasmine.SpyObj<LoggingService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(PlaceProductQuarantineComponent);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    if (fixture) {
      fixture.destroy();
    }
  });

  describe('Initialization', () => {


    it('should load quarantine reasons on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getQuarantineReasons).toHaveBeenCalled();
      expect(component.quarantineReasons()).toEqual(mockQuarantineReasons);
    }));

    it('should initialize form with productCode and reasonCode controls', () => {
      expect(component.quarantineForm.get('productCode')).toBeTruthy();
      expect(component.quarantineForm.get('reasonCode')).toBeTruthy();
    });

    it('should start with empty grid data', () => {
      expect(component.gridData()).toEqual([]);
    });

    it('should start with showEntryForm as false', () => {
      expect(component.showEntryForm()).toBe(false);
    });
  });
  describe('Unit Validation', () => {
    it('should set parsedUnitId and show entry form on unit validated', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(component.parsedUnitId()).toBe('TEST001');
      expect(component.showEntryForm()).toBe(true);
      expect(apiServiceSpy.getProductCodes).toHaveBeenCalledWith('TEST001', 'I');
    }));

    it('should reset state on unit cleared', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.onUnitCleared();

      expect(component.parsedUnitId()).toBe('');
      expect(component.showEntryForm()).toBe(false);
      expect(component.aliquots()).toEqual([]);
      expect(component.selectedAliquot()).toBeNull();
      expect(component.unitInfo()).toBeNull();
    }));
  });

  describe('Product Code Selection', () => {
    it('should load aliquots when product code is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      expect(apiServiceSpy.getAliquots).toHaveBeenCalledWith('TEST001', 'PROD001');
    }));

    it('should auto-select aliquot and load unit info when only one aliquot', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      expect(component.selectedAliquot()).toBe('01');
      expect(apiServiceSpy.getUnitInfo).toHaveBeenCalledWith('TEST001', 'PROD001', '01');
    }));

    it('should reset aliquot and unit info when product code changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedAliquot.set('01');
      component.unitInfo.set(mockUnitInfo);

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD002');
      tick();

      expect(component.unitInfo()).toBeNull();
    }));
  });

  describe('Aliquot Selection', () => {
    it('should load unit info when aliquot is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      component.onAliquotSelected('02');
      tick();

      expect(component.selectedAliquot()).toBe('02');
      expect(apiServiceSpy.getUnitInfo).toHaveBeenCalledWith('TEST001', 'PROD001', '02');
    }));

    it('should show aliquot select when multiple aliquots exist', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.aliquots.set(['01', '02', '03']);
      expect(component.showAliquotSelect()).toBe(true);
    }));


  });

  describe('Quarantine Placement', () => {
    it('should place quarantine and add row to grid on success', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      component.quarantineForm.get('reasonCode')?.setValue('QR001');
      tick();

      expect(apiServiceSpy.placeQuarantine).toHaveBeenCalled();
      expect(component.gridData().length).toBe(1);
      expect(component.gridData()[0].unitId).toBe('TEST001');
      expect(component.gridData()[0].productCode).toBe('PROD001');
      expect(component.gridData()[0].reasonCode).toBe('QR001');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should show alert dialog on API error', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));
      apiServiceSpy.placeQuarantine.and.returnValue(of({
        success: false,
        error: 'Product quarantined with this reason',
        statusCode: 400
      }));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      component.quarantineForm.get('reasonCode')?.setValue('QR001');
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.gridData().length).toBe(0);
    }));
  });

  describe('Filtered Dropdowns', () => {
    it('should filter products by search term', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.products.set(mockProducts);
      expect(component.filteredProducts().length).toBe(2);

      component.productCodeSearch.setValue('Whole');
      tick();

      expect(component.filteredProducts().length).toBe(1);
      expect(component.filteredProducts()[0].description).toBe('Whole Blood');
    }));

    it('should filter reasons by search term', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.filteredReasons().length).toBe(3);

      component.reasonCodeSearch.setValue('contamination');
      tick();

      expect(component.filteredReasons().length).toBe(1);
      expect(component.filteredReasons()[0].code).toBe('QR001');
    }));
  });

  describe('Reason Description', () => {
    it('should show dash when no reason selected', () => {
      expect(component.selectedReasonDescription()).toBe('-');
    });

    it('should show description when reason is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedReasonCode.set('QR002');

      expect(component.selectedReasonDescription()).toBe('Quality control failure');
    }));
  });
  describe('Clear All', () => {
    it('should reset all state when clearAll is called', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.parsedUnitId.set('TEST001');
      component.showEntryForm.set(true);
      component.aliquots.set(['01']);
      component.selectedAliquot.set('01');
      component.unitInfo.set(mockUnitInfo);

      component.clearAll();

      expect(component.parsedUnitId()).toBe('');
      expect(component.showEntryForm()).toBe(false);
      expect(component.aliquots()).toEqual([]);
      expect(component.selectedAliquot()).toBeNull();
      expect(component.unitInfo()).toBeNull();
      expect(component.gridData()).toEqual([]);
    }));
  });

  describe('Error Handling', () => {
    it('should log error when product codes fail to load', fakeAsync(() => {
      error = new Error('Network error');
      apiServiceSpy.getProductCodes.and.returnValue(
        throwError(() => error)
      );

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load product codes', error);
    }));

    it('should log error when quarantine reasons fail to load', fakeAsync(() => {
      error = new Error('Network error');
      apiServiceSpy.getQuarantineReasons.and.returnValue(
        throwError(() => error)
      );

      fixture.detectChanges();
      tick();

      expect(loggingServiceSpy.error).toHaveBeenCalledWith('Failed to load quarantine reasons', error);
    }));
  });

  describe('ABORh and Expiration Date Display', () => {
    it('should display ABORh when unitInfo is set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.unitInfo.set({ aboDescription: 'O Positive', expirationDate: null, bloodType: 'O+' });
      fixture.detectChanges();

      const fields = fixture.nativeElement.querySelectorAll('.plain-info-field');
      const aborhField = Array.from(fields).find((el: any) =>
        el.querySelector('.plain-info-label')?.textContent?.trim() === 'ABORh'
      ) as HTMLElement;
      const value = aborhField?.querySelector('.plain-info-value')?.textContent?.trim();
      expect(value).toBe('O Positive');
    }));

    it('should display formatted expiration date when unitInfo is set', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.unitInfo.set({ aboDescription: 'A Positive', expirationDate: '2024-12-25T14:30:00', bloodType: 'A+' });
      fixture.detectChanges();

      const fields = fixture.nativeElement.querySelectorAll('.plain-info-field');
      const expField = Array.from(fields).find((el: any) =>
        el.querySelector('.plain-info-label')?.textContent?.trim() === 'Expiration Date'
      ) as HTMLElement;
      const value = expField?.querySelector('.plain-info-value')?.textContent?.trim();
      expect(value).toBe('25-DEC-2024 14:30');
    }));

    it('should display dash for ABORh when unitInfo is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.unitInfo.set(null);
      fixture.detectChanges();

      const fields = fixture.nativeElement.querySelectorAll('.plain-info-field');
      const aborhField = Array.from(fields).find((el: any) =>
        el.querySelector('.plain-info-label')?.textContent?.trim() === 'ABORh'
      ) as HTMLElement;
      const value = aborhField?.querySelector('.plain-info-value')?.textContent?.trim();
      expect(value).toBe('-');
    }));

    it('should display dash for expiration date when unitInfo is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.unitInfo.set(null);
      fixture.detectChanges();

      const fields = fixture.nativeElement.querySelectorAll('.plain-info-field');
      const expField = Array.from(fields).find((el: any) =>
        el.querySelector('.plain-info-label')?.textContent?.trim() === 'Expiration Date'
      ) as HTMLElement;
      const value = expField?.querySelector('.plain-info-value')?.textContent?.trim();
      expect(value).toBe('-');
    }));
  });

  describe('formatDateTime', () => {
    it('should return dash for null', () => {
      expect(component.formatDateTime(null)).toBe('-');
    });

    it('should return dash for undefined', () => {
      expect(component.formatDateTime(undefined)).toBe('-');
    });

    it('should return original value for invalid date', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });

    it('should format valid date correctly', () => {
      expect(component.formatDateTime('2024-07-15T10:30:00')).toBe('15-JUL-2024 10:30');
    });

    it('should strip trailing Z to prevent timezone shift', () => {
      expect(component.formatDateTime('2024-07-15T10:30:00Z')).toContain('10:30');
    });

    it('should handle lowercase z', () => {
      expect(component.formatDateTime('2024-07-15T10:30:00z')).toContain('10:30');
    });
  });

  describe('Validation Alert Dialog', () => {
    it('should open dialog with OK button only', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of([]));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.confirmText).toBe('OK');
      expect(config.data.cancelText).toBeUndefined();
    }));

    it('should include error code in dialog title', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));
      apiServiceSpy.getUnitInfo.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '1727', error: 'Product not available' } }
      })));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.title).toBe('1727: Product not available');
    }));

    it('should use message only when no error code', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of([]));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.title).toBe('No aliquots available for this product.');
    }));
  });

  describe('Results Grid Columns', () => {
    it('should include aliquot column in table config', () => {
      expect(component.tableConfig().columns.find(c => c.key === 'aliquot')).toBeTruthy();
    });

    it('should include productDescription column in table config', () => {
      expect(component.tableConfig().columns.find(c => c.key === 'productDescription')).toBeTruthy();
    });

    it('should populate aliquot in grid row on successful quarantine', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      component.quarantineForm.get('reasonCode')?.setValue('QR001');
      tick();

      expect(component.gridData().length).toBe(1);
      expect(component.gridData()[0].aliquot).toBe('01');
    }));

    it('should populate productDescription in grid row on successful quarantine', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      component.quarantineForm.get('reasonCode')?.setValue('QR001');
      tick();

      expect(component.gridData().length).toBe(1);
      expect(component.gridData()[0].productDescription).toBe('Whole Blood');
    }));
  });

  describe('Stock State Error', () => {
    it('should show alert when getUnitInfo returns error 1727', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));
      apiServiceSpy.getUnitInfo.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '1727', error: 'Product not available' } }
      })));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.unitInfo()).toBeNull();
    }));

    it('should prevent quarantine when unitInfo is null', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));
      apiServiceSpy.getUnitInfo.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '1727', error: 'Product not available' } }
      })));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      apiServiceSpy.placeQuarantine.calls.reset();
      component.quarantineForm.get('reasonCode')?.setValue('QR001');
      tick();

      expect(apiServiceSpy.placeQuarantine).not.toHaveBeenCalled();
    }));
  });

  describe('Chapter Change', () => {
    let chapterSubject: Subject<void>;

    beforeEach(() => {
      chapterSubject = new Subject<void>();
      (headerServiceSpy as any).chapterChanged$ = chapterSubject.asObservable();
    });

    it('should reload quarantine reasons on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      apiServiceSpy.getQuarantineReasons.calls.reset();
      chapterSubject.next();
      tick();

      expect(apiServiceSpy.getQuarantineReasons).toHaveBeenCalled();
    }));

    it('should clear form state on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.parsedUnitId.set('TEST001');
      component.showEntryForm.set(true);
      component.aliquots.set(['01']);
      component.selectedAliquot.set('01');
      component.unitInfo.set(mockUnitInfo);

      chapterSubject.next();
      tick();

      expect(component.showEntryForm()).toBe(false);
      expect(component.aliquots()).toEqual([]);
      expect(component.selectedAliquot()).toBeNull();
      expect(component.unitInfo()).toBeNull();
    }));
  });

  describe('Edge Cases', () => {
    it('should show alert when no aliquots available', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of([]));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      const config = dialogSpy.open.calls.mostRecent().args[1];
      expect(config.data.title).toBe('No aliquots available for this product.');
    }));

    it('should handle placeQuarantine HTTP error', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(of(['01']));
      apiServiceSpy.placeQuarantine.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '5900', error: 'Product quarantined with this reason' } }
      })));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      component.quarantineForm.get('reasonCode')?.setValue('QR001');
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.isPlacing()).toBe(false);
    }));

    it('should reset loading state on aliquot load failure', fakeAsync(() => {
      apiServiceSpy.getAliquots.and.returnValue(throwError(() => new Error('Network error')));

      fixture.detectChanges();
      tick();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        codeScheme: 'I',
        checkDigit: null,
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.quarantineForm.get('productCode')?.setValue('PROD001');
      tick();

      expect(component.isLoadingAliquots()).toBe(false);
    }));
  });
});
