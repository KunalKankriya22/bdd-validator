import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { Router, provideRouter } from '@angular/router';

import { PreparePooledComponentsComponent } from './prepare-pooled-components.component';
import { PreparePooledComponentsService } from './services/prepare-pooled-components.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  PoolHeader,
  PoolUnit,
  CommitPoolResponse,
  ApiResponse,
  UnitValidationResponse,
  ValidProduct,
  ValidAbo,
  ValidCatalog,
  ValidLot,
  AttributeLookup,
  UnitProduct,
  WeightInfo,
} from './models/prepare-pooled-components.model';
import moment from 'moment';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('PreparePooledComponentsComponent', () => {
  let serviceSpyObj: any;
  let labelScanSpyObj: jasmine.SpyObj<DonorLibLabelScanService>;
  let component: PreparePooledComponentsComponent;
  let fixture: ComponentFixture<PreparePooledComponentsComponent>;
  let serviceSpy: jasmine.SpyObj<PreparePooledComponentsService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let router: Router;
  let chapterChangedSubject: Subject<void>;

  const mockPoolHeader: PoolHeader = {
    poolId: 'POOL123',
    chapterId: '1',
    patientId: 'PAT001',
    patientFirstName: 'John',
    patientLastName: 'Doe',
    facility: 'Test Facility',
    productCode: 'E2897V00',
    productDescription: 'POOLAND',
    bagId: '1BATRDSEF1',
    lotNumber: 'TRANSFFIR1',
    pooledAboRh: 'OPOS',
    aboDescription: 'O POS POOL',
    poolDats: '2024-07-14T22:15:00',
    poolExpiryDats: '2024-03-07T03:15:00',
    poolInsertDats: '2024-07-14T14:30:00',
    poolWeight: 165,
    numberOfUnits: 4,
    catalogNumber: '1BATRDSEF1',
  };

  const mockPoolUnits: PoolUnit[] = [
    {
      unitId: 'W6333-26-123457-X',
      productCode: 'E2897V00',
      productDescription: 'PLATELETS(PQ7S)/PLAS(N)/L/20',
      expiryDate: '2024-07-07T22:50:00',
      systemLabelDecision: 'Discard',
    },
  ];

  const mockProducts: ValidProduct[] = [
    { code: 'E2897V00', description: 'POOLAND' },
    { code: 'E2898V00', description: 'PLATELET POOL' },
  ];

  const mockAbo: ValidAbo[] = [
    { code: 'OPOS', label: 'O+', description: 'O POS POOL' },
    { code: 'APOS', label: 'A+', description: 'A POS POOL' },
  ];

  const mockCatalogs: ValidCatalog[] = [
    { code: '1BATRDSEF1' },
    { code: 'CAT002' },
  ];

  const mockLots: ValidLot[] = [
    { code: 'TRANSFFIR1' },
    { code: 'LOT002' },
  ];

  const mockAttribGroups: AttributeLookup[] = [
    { code: 'CMV', description: 'CMV Status' },
    { code: 'IRR', description: 'Irradiated' },
  ];

  const mockAttribCodes: AttributeLookup[] = [
    { code: 'CMVN', description: 'CMV Negative' },
    { code: 'CMVP', description: 'CMV Positive' },
  ];

  const mockUnitProducts: UnitProduct[] = [
    { code: 'E2897V00', description: 'POOLAND', expiryDate: '2024-07-07T22:50:00', sldDescription: 'Acceptable' },
    { code: 'E2898V00', description: 'PLATELET POOL', expiryDate: '2024-08-01T00:00:00', systemLabelDecision: 'Discard' },
  ];

  function formatMoment(m: moment.Moment): string {
    const formatted = m.format('DD-MMM-YYYY HH:mm');
    const parts = formatted.split('-');
    parts[1] = parts[1].toUpperCase();
    return parts.join('-');
  }

  function mockPoolIdFieldValid(): void {
    (component as any).poolIdField = { isValid: true, parsedUnitId: 'POOL123', clear: jasmine.createSpy('clear') };
  }

  function mockPoolIdFieldInvalid(): void {
    (component as any).poolIdField = { isValid: false, parsedUnitId: null, clear: jasmine.createSpy('clear') };
  }

  function mockComponentUnitIdField(parsedUnitId: string | null = null, isValid = false): void {
    (component as any).componentUnitIdField = {
      isValid,
      parsedUnitId,
      clear: jasmine.createSpy('clear'),
    };
  }

  function setValidPoolForm(): void {
    const yesterday = moment().subtract(1, 'day').hours(10).minutes(30);
    const poolingStr = formatMoment(yesterday);
    component.poolForm.patchValue({
      poolId: 'POOL123',
      poolProductCode: 'E2897V00',
      pooledAboRh: 'OPOS',
      poolingTime: poolingStr,
      catalogNumber: '1BATRDSEF1',
      lotNumber: 'TRANSFFIR1',
    });
  }

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    serviceSpyObj = jasmine.createSpyObj('PreparePooledComponentsService', [
      'getPoolById',
      'getUnitsInPool',
      'createPool',
      'updatePool',
      'deletePool',
      'commitPool',
      'validateUnit',
      'getValidProducts',
      'getValidAbo',
      'getValidLots',
      'getValidCatalogs',
      'getAttribGroups',
      'getAttribCodes',
      'getWeightInfo',
      'removeUnitFromPool',
      'calculateExpiry',
      'getValidProductsForUnit',
    ]);

    labelScanSpyObj = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateProductScan',
      'validateCatalogScan',
      'validateLotScan',
    ]);

    const snackBarSpyObj = createMockMatSnackBar();
    const pageHeaderSpyObj = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });
    const headerSpyObj = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });

    TestBed.configureTestingModule({
      imports: [PreparePooledComponentsComponent, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        { provide: PreparePooledComponentsService, useValue: serviceSpyObj },
        { provide: DonorLibLabelScanService, useValue: labelScanSpyObj },
        { provide: MatSnackBar, useValue: snackBarSpyObj },
        { provide: MatDialog, useValue: createMockMatDialog() },
        { provide: PageHeaderService, useValue: pageHeaderSpyObj },
        { provide: HeaderService, useValue: headerSpyObj },
      ],
    });

    serviceSpy = TestBed.inject(PreparePooledComponentsService) as jasmine.SpyObj<PreparePooledComponentsService>;
    pageHeaderServiceSpy = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    router = TestBed.inject(Router);

    // Setup default spy returns
    serviceSpy.getValidProducts.and.returnValue(of(mockProducts));
    serviceSpy.getValidAbo.and.returnValue(of(mockAbo));
    serviceSpy.getValidLots.and.returnValue(of(mockLots));
    serviceSpy.getValidCatalogs.and.returnValue(of(mockCatalogs));
    serviceSpy.getAttribGroups.and.returnValue(of([]));
    serviceSpy.getAttribCodes.and.returnValue(of([]));
    serviceSpy.getWeightInfo.and.returnValue(of({ weightRequired: 'N', specificGravity: null, freezeTimeRequired: 'N' }));
    serviceSpy.removeUnitFromPool.and.returnValue(of(undefined));
    serviceSpy.calculateExpiry.and.returnValue(of({ expiryDate: undefined, lifeSpan: undefined, lifeSpanUnit: undefined }));
    serviceSpy.getValidProductsForUnit.and.returnValue(of([]));

    fixture = TestBed.createComponent(PreparePooledComponentsComponent);
    component = fixture.componentInstance;

    snackBarSpy = (component as any).snackBar;
    spyOn(snackBarSpy, 'open');

    dialogSpy = (component as any).dialog;
  });

  // ───────────────────────────────────────────────────────────
  // Form Validation
  // ───────────────────────────────────────────────────────────
  describe('Form Validation', () => {
    it('should require Pool Product Code', () => {
      component.ngOnInit();
      const productCodeControl = component.poolForm.get('poolProductCode');
      productCodeControl?.setValue('');
      expect(productCodeControl?.hasError('required')).toBeTrue();

      productCodeControl?.setValue('E2897V00');
      expect(productCodeControl?.hasError('required')).toBeFalse();
    });

    it('should enforce number range on Number of Units (1-999)', () => {
      component.ngOnInit();
      const unitsControl = component.poolForm.get('numberOfUnits');
      unitsControl?.setValue(0);
      expect(unitsControl?.hasError('min')).toBeTrue();

      unitsControl?.setValue(1000);
      expect(unitsControl?.hasError('max')).toBeTrue();

      unitsControl?.setValue(500);
      expect(unitsControl?.hasError('min')).toBeFalse();
      expect(unitsControl?.hasError('max')).toBeFalse();
    });

    it('should enforce maxLength on patientId (10)', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('patientId');
      ctrl?.setValue('A'.repeat(11));
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should enforce maxLength on patientLastName (50)', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('patientLastName');
      ctrl?.setValue('A'.repeat(51));
      expect(ctrl?.hasError('maxlength')).toBeTrue();
    });

    it('should require catalogNumber', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('catalogNumber');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should require lotNumber', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('lotNumber');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should require pooledAboRh', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('pooledAboRh');
      ctrl?.setValue('');
      ctrl?.markAsTouched();
      expect(ctrl?.hasError('required')).toBeTrue();
    });

    it('should enforce poolWeight range (1-999.99)', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('poolWeight');
      ctrl?.setValue(0);
      expect(ctrl?.hasError('min')).toBeTrue();
      ctrl?.setValue(1000);
      expect(ctrl?.hasError('max')).toBeTrue();
      ctrl?.setValue(500);
      expect(ctrl?.valid).toBeTrue();
    });

    it('should reject non-numeric numberOfUnits', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('numberOfUnits');
      ctrl?.setValue('abc');
      expect(ctrl?.hasError('pattern')).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // DateTime Validation
  // ───────────────────────────────────────────────────────────
  describe('DateTime Validation', () => {
    it('should reject invalid datetime format', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('poolingTime');
      ctrl?.setValue('not-a-date');
      expect(ctrl?.hasError('invalidFormat')).toBeTrue();
    });

    it('should accept valid datetime format', () => {
      component.ngOnInit();
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      const ctrl = component.poolForm.get('poolingTime');
      ctrl?.setValue(yesterday);
      expect(ctrl?.hasError('invalidFormat')).toBeFalse();
      expect(ctrl?.hasError('invalidDateTime')).toBeFalsy();
    });

    it('should reject midnight pooling time', () => {
      component.ngOnInit();
      const todayMidnight = formatMoment(moment().hours(0).minutes(0));
      component.poolForm.patchValue({ poolingTime: todayMidnight });
      component.validatePoolingTime();
      expect(component.poolForm.get('poolingTime')?.hasError('midnightNotAllowed')).toBeTrue();
    });

    it('should reject future pooling datetime', () => {
      component.ngOnInit();
      const tomorrow = formatMoment(moment().add(1, 'day').hours(10).minutes(0));
      component.poolForm.patchValue({ poolingTime: tomorrow });
      component.validatePoolingTime();
      expect(component.poolForm.get('poolingTime')?.hasError('poolingTimeFuture')).toBeTrue();
    });

    it('should reject pooling datetime older than 3 days', () => {
      component.ngOnInit();
      const fiveDaysAgo = formatMoment(moment().subtract(5, 'days').hours(10).minutes(0));
      component.poolForm.patchValue({ poolingTime: fiveDaysAgo });
      component.validatePoolingTime();
      expect(component.poolForm.get('poolingTime')?.hasError('poolingTimeRange')).toBeTrue();
    });

    it('should accept valid pooling datetime', () => {
      component.ngOnInit();
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ poolingTime: yesterday });
      component.validatePoolingTime();
      expect(component.poolForm.get('poolingTime')?.errors).toBeNull();
    });

    it('should reject freeze time before pooling time', () => {
      component.ngOnInit();
      const yesterday = moment().subtract(1, 'day');
      const poolStr = formatMoment(yesterday.clone().hours(14).minutes(30));
      const freezeStr = formatMoment(yesterday.clone().hours(14).minutes(0));

      component.poolForm.patchValue({ poolingTime: poolStr, freezeTime: freezeStr });
      component.validateFreezeTime();
      expect(component.poolForm.get('freezeTime')?.hasError('freezeBeforePool')).toBeTrue();
    });

    it('should accept freeze time equal to pooling time', () => {
      component.ngOnInit();
      const yesterday = moment().subtract(1, 'day');
      const dateStr = formatMoment(yesterday.clone().hours(14).minutes(30));

      component.poolForm.patchValue({ poolingTime: dateStr, freezeTime: dateStr });
      component.validateFreezeTime();
      expect(component.poolForm.get('freezeTime')?.errors).toBeNull();
    });

    it('should accept freeze time after pooling time', () => {
      component.ngOnInit();
      const yesterday = moment().subtract(1, 'day');
      const poolStr = formatMoment(yesterday.clone().hours(14).minutes(30));
      const freezeStr = formatMoment(yesterday.clone().hours(15).minutes(0));

      component.poolForm.patchValue({ poolingTime: poolStr, freezeTime: freezeStr });
      component.validateFreezeTime();
      expect(component.poolForm.get('freezeTime')?.errors).toBeNull();
    });

    it('should not add custom errors when pooling time is empty', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolingTime: '' });
      component.validatePoolingTime();
      // validatePoolingTime returns early when empty - no midnightNotAllowed/poolingTimeFuture/poolingTimeRange
      const ctrl = component.poolForm.get('poolingTime');
      expect(ctrl?.hasError('midnightNotAllowed')).toBeFalse();
      expect(ctrl?.hasError('poolingTimeFuture')).toBeFalse();
      expect(ctrl?.hasError('poolingTimeRange')).toBeFalse();
    });

    it('should not set errors when freeze time is empty', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ freezeTime: '' });
      component.validateFreezeTime();
      expect(component.poolForm.get('freezeTime')?.errors).toBeFalsy();
    });

    it('should not validate freeze time when pooling time value is empty', () => {
      component.ngOnInit();
      const yesterday = moment().subtract(1, 'day');
      const freezeStr = formatMoment(yesterday.clone().hours(14).minutes(0));
      component.poolForm.patchValue({ poolingTime: '', freezeTime: freezeStr });
      component.validateFreezeTime();
      // No freezeBeforePool error since pooling time is empty
      expect(component.poolForm.get('freezeTime')?.hasError('freezeBeforePool')).toBeFalse();
    });

    it('should reject invalid month abbreviation in dateTimeFormatValidator', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('freezeTime');
      ctrl?.setValue('14-XYZ-2024 10:30');
      expect(ctrl?.hasError('invalidDateTime')).toBeTrue();
    });

    it('should reject invalid day values that form invalid date', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('freezeTime');
      ctrl?.setValue('32-JAN-2024 10:30');
      expect(ctrl?.hasError('invalidDateTime')).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Pooling/Freeze time error messages
  // ───────────────────────────────────────────────────────────
  describe('getPoolingTimeError', () => {
    beforeEach(() => component.ngOnInit());

    it('should return empty string when no errors', () => {
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ poolingTime: yesterday });
      expect(component.getPoolingTimeError()).toBe('');
    });

    it('should return required message', () => {
      component.poolForm.get('poolingTime')?.setValue('');
      component.poolForm.get('poolingTime')?.markAsTouched();
      component.poolForm.get('poolingTime')?.setErrors({ required: true });
      expect(component.getPoolingTimeError()).toBe('Pooling time is required');
    });

    it('should return invalidFormat message', () => {
      component.poolForm.get('poolingTime')?.setErrors({ invalidFormat: true });
      expect(component.getPoolingTimeError()).toBe('Invalid format. Use DD-MMM-YYYY HH:mm');
    });

    it('should return invalidDateTime message', () => {
      component.poolForm.get('poolingTime')?.setErrors({ invalidDateTime: true });
      expect(component.getPoolingTimeError()).toBe('Invalid date or time value');
    });

    it('should return midnightNotAllowed message', () => {
      component.poolForm.get('poolingTime')?.setErrors({ midnightNotAllowed: true });
      expect(component.getPoolingTimeError()).toBe('Time cannot be exactly midnight (00:00)');
    });

    it('should return poolingTimeFuture message', () => {
      component.poolForm.get('poolingTime')?.setErrors({ poolingTimeFuture: true });
      expect(component.getPoolingTimeError()).toBe('Pooling time cannot be in the future');
    });

    it('should return poolingTimeRange message', () => {
      component.poolForm.get('poolingTime')?.setErrors({ poolingTimeRange: true });
      expect(component.getPoolingTimeError()).toBe('Pooling time must be within the last 3 days');
    });
  });

  describe('getFreezeTimeError', () => {
    beforeEach(() => component.ngOnInit());

    it('should return empty string when no errors', () => {
      expect(component.getFreezeTimeError()).toBe('');
    });

    it('should return invalidFormat message', () => {
      component.poolForm.get('freezeTime')?.setErrors({ invalidFormat: true });
      expect(component.getFreezeTimeError()).toBe('Invalid format. Use DD-MMM-YYYY HH:mm');
    });

    it('should return invalidDateTime message', () => {
      component.poolForm.get('freezeTime')?.setErrors({ invalidDateTime: true });
      expect(component.getFreezeTimeError()).toBe('Invalid date or time value');
    });

    it('should return freezeBeforePool message', () => {
      component.poolForm.get('freezeTime')?.setErrors({ freezeBeforePool: true });
      expect(component.getFreezeTimeError()).toBe('Freeze time cannot be before pooling time');
    });
  });

  // ───────────────────────────────────────────────────────────
  // onPoolingTimeInput / onFreezeTimeInput
  // ───────────────────────────────────────────────────────────
  describe('onPoolingTimeInput', () => {
    it('should mark poolingTime as touched and dirty', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('poolingTime')!;
      expect(ctrl.touched).toBeFalse();
      expect(ctrl.dirty).toBeFalse();
      component.onPoolingTimeInput();
      expect(ctrl.touched).toBeTrue();
      expect(ctrl.dirty).toBeTrue();
    });
  });

  describe('onFreezeTimeInput', () => {
    it('should mark freezeTime as touched and dirty', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('freezeTime')!;
      expect(ctrl.touched).toBeFalse();
      expect(ctrl.dirty).toBeFalse();
      component.onFreezeTimeInput();
      expect(ctrl.touched).toBeTrue();
      expect(ctrl.dirty).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Error matchers
  // ───────────────────────────────────────────────────────────
  describe('freezeTimeErrorMatcher', () => {
    it('should return false when control is null', () => {
      expect(component.freezeTimeErrorMatcher.isErrorState(null)).toBeFalse();
    });

    it('should return true when control is invalid and touched', () => {
      expect(component.freezeTimeErrorMatcher.isErrorState({ invalid: true, touched: true, dirty: false })).toBeTrue();
    });

    it('should return true when control is invalid and dirty', () => {
      expect(component.freezeTimeErrorMatcher.isErrorState({ invalid: true, touched: false, dirty: true })).toBeTrue();
    });

    it('should return false when control is valid', () => {
      expect(component.freezeTimeErrorMatcher.isErrorState({ invalid: false, touched: true, dirty: true })).toBeFalse();
    });

    it('should return false when control is invalid but pristine and untouched', () => {
      expect(component.freezeTimeErrorMatcher.isErrorState({ invalid: true, touched: false, dirty: false })).toBeFalse();
    });
  });

  describe('poolingTimeErrorMatcher', () => {
    it('should return false when control is null', () => {
      expect(component.poolingTimeErrorMatcher.isErrorState(null)).toBeFalse();
    });

    it('should return true when control is invalid and touched', () => {
      expect(component.poolingTimeErrorMatcher.isErrorState({ invalid: true, touched: true, dirty: false })).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // loadLookups
  // ───────────────────────────────────────────────────────────
  describe('loadLookups', () => {
    it('should populate validProducts and filteredProducts on success', () => {
      component.ngOnInit();
      expect(component.validProducts()).toEqual(mockProducts);
      expect(component.filteredProducts()).toEqual(mockProducts);
    });

    it('should populate validAbo and filteredAbo on success', () => {
      component.ngOnInit();
      expect(component.validAbo()).toEqual(mockAbo);
      expect(component.filteredAbo()).toEqual(mockAbo);
    });

    it('should populate validCatalogs and filteredCatalogs on success', () => {
      component.ngOnInit();
      expect(component.validCatalogs()).toEqual(mockCatalogs);
      expect(component.filteredCatalogs()).toEqual(mockCatalogs);
    });

    it('should show snackbar on getValidProducts error', () => {
      serviceSpy.getValidProducts.and.returnValue(throwError(() => ({ error: { message: 'Products failed' } })));
      component.ngOnInit();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Products failed', 'Close', jasmine.any(Object));
    });

    it('should show snackbar on getValidAbo error', () => {
      serviceSpy.getValidAbo.and.returnValue(throwError(() => ({ error: { message: 'ABO failed' } })));
      component.ngOnInit();
      expect(snackBarSpy.open).toHaveBeenCalledWith('ABO failed', 'Close', jasmine.any(Object));
    });

    it('should show snackbar on getValidCatalogs error', () => {
      serviceSpy.getValidCatalogs.and.returnValue(throwError(() => ({ error: { message: 'Catalogs failed' } })));
      component.ngOnInit();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Catalogs failed', 'Close', jasmine.any(Object));
    });
  });

  // ───────────────────────────────────────────────────────────
  // Chapter changes
  // ───────────────────────────────────────────────────────────
  describe('subscribeToChapterChanges', () => {
    it('should call clearAll and loadLookups on chapter change', () => {
      component.ngOnInit();
      component.currentPool.set(mockPoolHeader);
      component.unitsInPool.set(mockPoolUnits);

      serviceSpy.getValidProducts.calls.reset();
      serviceSpy.getValidAbo.calls.reset();
      serviceSpy.getValidCatalogs.calls.reset();

      chapterChangedSubject.next();

      expect(component.currentPool()).toBeNull();
      expect(component.unitsInPool().length).toBe(0);
      expect(serviceSpy.getValidProducts).toHaveBeenCalled();
      expect(serviceSpy.getValidAbo).toHaveBeenCalled();
      expect(serviceSpy.getValidCatalogs).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Search filters
  // ───────────────────────────────────────────────────────────
  describe('setupSearchFilters', () => {
    it('should filter products by code when productCodeSearchControl changes', fakeAsync(() => {
      component.ngOnInit();
      component.productCodeSearchControl.setValue('E2898');
      tick(250);
      const filtered = component.filteredProducts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('E2898V00');
    }));

    it('should filter products by description when productCodeSearchControl changes', fakeAsync(() => {
      component.ngOnInit();
      component.productCodeSearchControl.setValue('pooland');
      tick(250);
      const filtered = component.filteredProducts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('E2897V00');
    }));

    it('should filter ABO when aboSearchControl changes', fakeAsync(() => {
      component.ngOnInit();
      component.aboSearchControl.setValue('APOS');
      tick(250);
      const filtered = component.filteredAbo();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('APOS');
    }));

    it('should filter catalogs when catalogNumber value changes', fakeAsync(() => {
      component.ngOnInit();
      component.poolForm.get('catalogNumber')?.setValue('CAT');
      tick(250);
      const filtered = component.filteredCatalogs();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CAT002');
    }));

    it('should filter lots when lotNumber value changes', fakeAsync(() => {
      component.ngOnInit();
      component.validLots.set(mockLots);
      component.filteredLots.set(mockLots);
      component.poolForm.get('lotNumber')?.setValue('LOT');
      tick(250);
      const filtered = component.filteredLots();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('LOT002');
    }));

    it('should filter attrib groups when attribGroupSearchControl changes', fakeAsync(() => {
      component.ngOnInit();
      component.validAttribGroups.set(mockAttribGroups);
      component.filteredAttribGroups.set(mockAttribGroups);
      component.attribGroupSearchControl.setValue('irr');
      tick(250);
      const filtered = component.filteredAttribGroups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('IRR');
    }));

    it('should filter unit products when productLineForm productCode changes', fakeAsync(() => {
      component.ngOnInit();
      component.unitProducts.set(mockUnitProducts);
      component.filteredUnitProducts.set(mockUnitProducts);
      component.productLineForm.get('productCode')?.setValue('platelet');
      tick(250);
      const filtered = component.filteredUnitProducts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('E2898V00');
    }));

    it('should show all items when search term is empty', fakeAsync(() => {
      component.ngOnInit();
      component.productCodeSearchControl.setValue('E2898');
      tick(250);
      expect(component.filteredProducts().length).toBe(1);
      component.productCodeSearchControl.setValue('');
      tick(250);
      expect(component.filteredProducts().length).toBe(2);
    }));
  });

  // ───────────────────────────────────────────────────────────
  // Attribute code search control
  // ───────────────────────────────────────────────────────────
  describe('getAttribCodeSearchControl', () => {
    it('should create a new control for a new index', () => {
      component.ngOnInit();
      const ctrl = component.getAttribCodeSearchControl(0);
      expect(ctrl).toBeTruthy();
    });

    it('should return the same control for the same index', () => {
      component.ngOnInit();
      const ctrl1 = component.getAttribCodeSearchControl(0);
      const ctrl2 = component.getAttribCodeSearchControl(0);
      expect(ctrl1).toBe(ctrl2);
    });

    it('should filter attrib codes when the control value changes', fakeAsync(() => {
      component.ngOnInit();
      const codesMap = new Map<number, AttributeLookup[]>();
      codesMap.set(0, mockAttribCodes);
      component.attribCodesByIndex.set(codesMap);

      const ctrl = component.getAttribCodeSearchControl(0);
      ctrl.setValue('neg');
      tick(250);

      const filtered = component.filteredAttribCodesByIndex().get(0);
      expect(filtered?.length).toBe(1);
      expect(filtered?.[0].code).toBe('CMVN');
    }));
  });

  describe('getFilteredAttribCodesForRow', () => {
    it('should return filtered codes when available', () => {
      component.ngOnInit();
      const filteredMap = new Map<number, AttributeLookup[]>();
      filteredMap.set(0, [mockAttribCodes[0]]);
      component.filteredAttribCodesByIndex.set(filteredMap);

      const result = component.getFilteredAttribCodesForRow(0);
      expect(result.length).toBe(1);
      expect(result[0].code).toBe('CMVN');
    });

    it('should fall back to unfiltered codes when no filtered data exists', () => {
      component.ngOnInit();
      const codesMap = new Map<number, AttributeLookup[]>();
      codesMap.set(0, mockAttribCodes);
      component.attribCodesByIndex.set(codesMap);

      const result = component.getFilteredAttribCodesForRow(0);
      expect(result.length).toBe(2);
    });

    it('should return empty array when no codes exist at index', () => {
      component.ngOnInit();
      const result = component.getFilteredAttribCodesForRow(99);
      expect(result.length).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────
  // Product code changes (watches in initializeForms)
  // ───────────────────────────────────────────────────────────
  describe('poolProductCode valueChanges', () => {
    it('should update productDescription when product code changes', () => {
      component.ngOnInit();
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.poolForm.get('productDescription')?.value).toBe('POOLAND');
    });

    it('should clear productDescription when product not found', () => {
      component.ngOnInit();
      component.poolForm.get('poolProductCode')?.setValue('UNKNOWN');
      expect(component.poolForm.get('productDescription')?.value).toBe('');
    });

    it('should load attrib groups when product code is set', () => {
      component.ngOnInit();
      serviceSpy.getAttribGroups.calls.reset();
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(serviceSpy.getAttribGroups).toHaveBeenCalledWith('E2897V00');
    });

    it('should load weight info when product code is set', () => {
      component.ngOnInit();
      serviceSpy.getWeightInfo.calls.reset();
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(serviceSpy.getWeightInfo).toHaveBeenCalledWith('E2897V00');
    });

    it('should clear attrib groups and reset weight when product code is cleared', () => {
      component.ngOnInit();
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      component.validAttribGroups.set(mockAttribGroups);

      component.poolForm.get('poolProductCode')?.setValue('');
      expect(component.validAttribGroups().length).toBe(0);
      expect(component.weightRequired()).toBe('N');
    });
  });

  describe('pooledAboRh valueChanges', () => {
    it('should update aboDescription when ABO code changes', () => {
      component.ngOnInit();
      component.poolForm.get('pooledAboRh')?.setValue('OPOS');
      expect(component.poolForm.get('aboDescription')?.value).toBe('O POS POOL');
    });

    it('should clear aboDescription when ABO code not found', () => {
      component.ngOnInit();
      component.poolForm.get('pooledAboRh')?.setValue('UNKNOWN');
      expect(component.poolForm.get('aboDescription')?.value).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // loadWeightInfo
  // ───────────────────────────────────────────────────────────
  describe('loadWeightInfo', () => {
    it('should set weight required validators when weightRequired is Y', () => {
      component.ngOnInit();
      serviceSpy.getWeightInfo.and.returnValue(of({ weightRequired: 'Y', specificGravity: 1.03, freezeTimeRequired: 'N' }));
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.weightRequired()).toBe('Y');
      expect(component.specificGravity()).toBe(1.03);

      const weightCtrl = component.poolForm.get('poolWeight');
      weightCtrl?.setValue('');
      expect(weightCtrl?.hasError('required')).toBeTrue();
    });

    it('should set freeze time required validators when freezeTimeRequired is Y', () => {
      component.ngOnInit();
      serviceSpy.getWeightInfo.and.returnValue(of({ weightRequired: 'N', specificGravity: null, freezeTimeRequired: 'Y' }));
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.freezeTimeRequired()).toBe('Y');

      const freezeCtrl = component.poolForm.get('freezeTime');
      freezeCtrl?.setValue('');
      expect(freezeCtrl?.hasError('required')).toBeTrue();
    });

    it('should clear freeze time and validators when freezeTimeRequired is N', () => {
      component.ngOnInit();
      serviceSpy.getWeightInfo.and.returnValue(of({ weightRequired: 'N', specificGravity: null, freezeTimeRequired: 'N' }));
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.freezeTimeRequired()).toBe('N');
    });

    it('should reset weight state on error', () => {
      component.ngOnInit();
      serviceSpy.getWeightInfo.and.returnValue(throwError(() => new Error('fail')));
      component.weightRequired.set('Y');
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.weightRequired()).toBe('N');
    });
  });

  // ───────────────────────────────────────────────────────────
  // loadProductExpiry
  // ───────────────────────────────────────────────────────────
  describe('loadProductExpiry', () => {
    it('should set productExpiryDate when expiry is returned', () => {
      component.ngOnInit();
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ poolingTime: yesterday });

      serviceSpy.calculateExpiry.and.returnValue(of({ expiryDate: '2025-01-01T00:00:00' }));
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');

      expect(component.productExpiryDate()).toBeTruthy();
      expect(component.productExpiryDate()!.format('YYYY-MM-DD')).toBe('2025-01-01');
    });

    it('should set productExpiryDate to null when no expiry returned', () => {
      component.ngOnInit();
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ poolingTime: yesterday });

      serviceSpy.calculateExpiry.and.returnValue(of({ expiryDate: undefined }));
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.productExpiryDate()).toBeNull();
    });

    it('should set productExpiryDate to null on error', () => {
      component.ngOnInit();
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ poolingTime: yesterday });

      serviceSpy.calculateExpiry.and.returnValue(throwError(() => new Error('fail')));
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.productExpiryDate()).toBeNull();
    });

    it('should not call calculateExpiry when poolingTime is empty', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolingTime: '' });
      serviceSpy.calculateExpiry.calls.reset();
      (component as any).loadProductExpiry('E2897V00');
      expect(serviceSpy.calculateExpiry).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // loadAttribGroups
  // ───────────────────────────────────────────────────────────
  describe('loadAttribGroups', () => {
    it('should populate attrib groups on success', () => {
      component.ngOnInit();
      serviceSpy.getAttribGroups.and.returnValue(of(mockAttribGroups));
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.validAttribGroups()).toEqual(mockAttribGroups);
      expect(component.filteredAttribGroups()).toEqual(mockAttribGroups);
    });

    it('should clear attrib groups on error', () => {
      component.ngOnInit();
      serviceSpy.getAttribGroups.and.returnValue(throwError(() => new Error('fail')));
      component.validAttribGroups.set(mockAttribGroups);
      component.poolForm.get('poolProductCode')?.setValue('E2897V00');
      expect(component.validAttribGroups().length).toBe(0);
      expect(component.filteredAttribGroups().length).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────
  // Attributes Management
  // ───────────────────────────────────────────────────────────
  describe('Attributes Management', () => {
    it('should add attribute row', () => {
      component.ngOnInit();
      expect(component.attributes.length).toBe(0);
      component.addAttribute();
      expect(component.attributes.length).toBe(1);
      component.addAttribute();
      expect(component.attributes.length).toBe(2);
    });

    it('should remove attribute and reindex maps', () => {
      component.ngOnInit();
      component.addAttribute();
      component.addAttribute();
      component.addAttribute();

      const codesMap = new Map<number, AttributeLookup[]>();
      codesMap.set(0, [{ code: 'A', description: 'A' }]);
      codesMap.set(1, [{ code: 'B', description: 'B' }]);
      codesMap.set(2, [{ code: 'C', description: 'C' }]);
      component.attribCodesByIndex.set(codesMap);

      component.removeAttribute(1);

      expect(component.attributes.length).toBe(2);
      // After removing index 1: {0: A, 2: C} reindexes to {0: A, 1: C}
      expect(component.attribCodesByIndex().get(0)?.[0].code).toBe('A');
      expect(component.attribCodesByIndex().get(1)?.[0].code).toBe('C');
      expect(component.attribCodesByIndex().size).toBe(2);
    });

    it('should detect duplicate attributes', () => {
      component.ngOnInit();
      component.addAttribute();
      component.addAttribute();

      component.attributes.at(0).patchValue({ attributeGroup: 'CMV', attributeCode: 'CMVN' });
      component.attributes.at(1).patchValue({ attributeGroup: 'CMV', attributeCode: 'CMVN' });

      expect(component.hasDuplicateAttributes()).toBeTrue();
    });

    it('should not flag duplicates when groups/codes differ', () => {
      component.ngOnInit();
      component.addAttribute();
      component.addAttribute();

      component.attributes.at(0).patchValue({ attributeGroup: 'CMV', attributeCode: 'CMVN' });
      component.attributes.at(1).patchValue({ attributeGroup: 'CMV', attributeCode: 'CMVP' });

      expect(component.hasDuplicateAttributes()).toBeFalse();
    });

    it('should ignore incomplete attribute rows in duplicate check', () => {
      component.ngOnInit();
      component.addAttribute();
      component.addAttribute();

      component.attributes.at(0).patchValue({ attributeGroup: 'CMV', attributeCode: '' });
      component.attributes.at(1).patchValue({ attributeGroup: 'CMV', attributeCode: '' });

      expect(component.hasDuplicateAttributes()).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // onAttribGroupChange
  // ───────────────────────────────────────────────────────────
  describe('onAttribGroupChange', () => {
    it('should load attrib codes when group and product code are set', () => {
      component.ngOnInit();
      serviceSpy.getAttribCodes.and.returnValue(of(mockAttribCodes));
      component.poolForm.patchValue({ poolProductCode: 'E2897V00' });
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'CMV' });

      component.onAttribGroupChange(0);

      expect(serviceSpy.getAttribCodes).toHaveBeenCalledWith('E2897V00', 'CMV');
      expect(component.attribCodesByIndex().get(0)).toEqual(mockAttribCodes);
    });

    it('should clear attribute code when group changes', () => {
      component.ngOnInit();
      serviceSpy.getAttribCodes.and.returnValue(of(mockAttribCodes));
      component.poolForm.patchValue({ poolProductCode: 'E2897V00' });
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'CMV', attributeCode: 'CMVN' });

      component.onAttribGroupChange(0);
      expect(component.attributes.at(0).get('attributeCode')?.value).toBe('');
    });

    it('should clear codes on getAttribCodes error', () => {
      component.ngOnInit();
      serviceSpy.getAttribCodes.and.returnValue(throwError(() => new Error('fail')));
      component.poolForm.patchValue({ poolProductCode: 'E2897V00' });
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'CMV' });

      component.onAttribGroupChange(0);
      expect(component.attribCodesByIndex().get(0)).toEqual([]);
    });

    it('should not call service when group is empty', () => {
      component.ngOnInit();
      serviceSpy.getAttribCodes.calls.reset();
      component.poolForm.patchValue({ poolProductCode: 'E2897V00' });
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: '' });

      component.onAttribGroupChange(0);
      expect(serviceSpy.getAttribCodes).not.toHaveBeenCalled();
    });
  });

  describe('getAttribCodesForRow', () => {
    it('should return codes for existing index', () => {
      component.ngOnInit();
      const codesMap = new Map<number, AttributeLookup[]>();
      codesMap.set(0, mockAttribCodes);
      component.attribCodesByIndex.set(codesMap);
      expect(component.getAttribCodesForRow(0)).toEqual(mockAttribCodes);
    });

    it('should return empty array for missing index', () => {
      component.ngOnInit();
      expect(component.getAttribCodesForRow(99)).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────
  // CMV detection
  // ───────────────────────────────────────────────────────────
  describe('hasCmvNegativeAttribute', () => {
    it('should return false when no attributes', () => {
      component.ngOnInit();
      expect(component.hasCmvNegativeAttribute()).toBeFalse();
    });

    it('should detect CMV group', () => {
      component.ngOnInit();
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'CMV', attributeCode: 'OTHER' });
      expect(component.hasCmvNegativeAttribute()).toBeTrue();
    });

    it.each([
      ['CMVN'],
      ['CMV-'],
      ['CMVNEG'],
    ])('should detect CMV attribute code %s', (code) => {
      component.ngOnInit();
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'OTHER', attributeCode: code });
      expect(component.hasCmvNegativeAttribute()).toBeTrue();
    });

    it('should return false when no CMV codes', () => {
      component.ngOnInit();
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'IRR', attributeCode: 'IRRD' });
      expect(component.hasCmvNegativeAttribute()).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Save Pool
  // ───────────────────────────────────────────────────────────
  describe('Save Pool', () => {
    it('should not save when Pool ID is not validated', () => {
      component.ngOnInit();
      mockPoolIdFieldInvalid();
      spyOn(dialogSpy, 'open');
      component.onSave();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please enter and validate a Pool ID first', 'Close', jasmine.any(Object),
      );
    });

    it('should not save when duplicate attributes exist', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      spyOn(dialogSpy, 'open');

      component.addAttribute();
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'CMV', attributeCode: 'CMVN' });
      component.attributes.at(1).patchValue({ attributeGroup: 'CMV', attributeCode: 'CMVN' });

      component.onSave();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Duplicate attribute group/code pairs are not allowed', 'Close', jasmine.any(Object),
      );
    });

    it('should not save when pool form is invalid', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      spyOn(dialogSpy, 'open');

      // Leave required fields empty
      component.poolForm.patchValue({ poolProductCode: '' });
      component.unitsInPool.set(mockPoolUnits);
      component.onSave();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please correct the errors before saving', 'Close', jasmine.any(Object),
      );
    });

    it('should not save when no units are present', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      spyOn(dialogSpy, 'open');
      setValidPoolForm();
      component.unitsInPool.set([]);
      component.onSave();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'At least one unit must be added before saving', 'Close', jasmine.any(Object),
      );
    });

    it('should show form error when freeze time has errors (form becomes invalid)', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      spyOn(dialogSpy, 'open');
      setValidPoolForm();
      component.unitsInPool.set(mockPoolUnits);
      // Setting error on a form control makes the entire form invalid
      component.poolForm.get('freezeTime')?.setErrors({ freezeBeforePool: true });

      component.onSave();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please correct the errors before saving', 'Close', jasmine.any(Object),
      );
    });

    it('should open label verification dialog when all validations pass', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      spyOn(dialogSpy, 'open').and.returnValue({ afterClosed: () => of(null) } as any);

      setValidPoolForm();
      component.unitsInPool.set(mockPoolUnits);

      component.onSave();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should call onVerified when dialog returns result', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      const verification = { scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' };
      spyOn(dialogSpy, 'open').and.returnValue({ afterClosed: () => of(verification) } as any);
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      setValidPoolForm();
      component.unitsInPool.set(mockPoolUnits);

      component.onSave();

      expect(serviceSpy.createPool).toHaveBeenCalled();
    });

    it('should not call onVerified when dialog is cancelled', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      spyOn(dialogSpy, 'open').and.returnValue({ afterClosed: () => of(null) } as any);

      setValidPoolForm();
      component.unitsInPool.set(mockPoolUnits);

      component.onSave();

      expect(serviceSpy.createPool).not.toHaveBeenCalled();
    });

    it('should create pool and commit on verification for new pool', () => {
      component.ngOnInit();
      const mockCommitResponse = {
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', expiryDate: '2025-07-14', unitCount: 1, interdictionsPlaced: [],
      };
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of(mockCommitResponse));

      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      expect(serviceSpy.createPool).toHaveBeenCalled();
      expect(serviceSpy.commitPool).toHaveBeenCalledWith('POOL123', jasmine.any(Object));
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Pool saved and committed successfully'), 'DISMISS', jasmine.any(Object),
      );
    });

    it('should update pool and commit on verification for existing pool', () => {
      component.ngOnInit();
      const mockCommitResponse = {
        poolId: 'POOL123', systemLabelDecision: 'Discard', expiryDate: '2025-07-14', unitCount: 1, interdictionsPlaced: ['CMW'],
      };
      serviceSpy.updatePool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of(mockCommitResponse));

      component.currentPool.set(mockPoolHeader);
      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      expect(serviceSpy.updatePool).toHaveBeenCalledWith('POOL123', jasmine.any(Object));
      expect(serviceSpy.commitPool).toHaveBeenCalledWith('POOL123', jasmine.any(Object));
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Interdictions placed: CMW'), 'DISMISS', jasmine.any(Object),
      );
    });

    it('should show error on save/commit failure', () => {
      component.ngOnInit();
      serviceSpy.createPool.and.returnValue(throwError(() => ({ error: { message: 'Save failed' } })));

      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      expect(snackBarSpy.open).toHaveBeenCalledWith('Save failed', 'Close', jasmine.any(Object));
      expect(component.loading()).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // onVerified
  // ───────────────────────────────────────────────────────────
  describe('onVerified', () => {
    it('should normalize scannedUnitId by removing trailing dash-segment', () => {
      component.ngOnInit();
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123-X', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      const commitArg = serviceSpy.commitPool.calls.mostRecent().args[1];
      expect(commitArg.verification.scannedUnitId).toBe('POOL123');
    });

    it('should not modify scannedUnitId without dashes', () => {
      component.ngOnInit();
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      const commitArg = serviceSpy.commitPool.calls.mostRecent().args[1];
      expect(commitArg.verification.scannedUnitId).toBe('POOL123');
    });

    it('should include attributes in commit request filtering out incomplete ones', () => {
      component.ngOnInit();
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.unitsInPool.set([...mockPoolUnits]);
      component.addAttribute();
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'CMV', attributeCode: 'CMVN' });
      component.attributes.at(1).patchValue({ attributeGroup: '', attributeCode: '' });

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      const commitArg = serviceSpy.commitPool.calls.mostRecent().args[1];
      expect(commitArg.attributes.length).toBe(1);
      expect(commitArg.attributes[0]).toEqual({ attribGroup: 'CMV', attribCode: 'CMVN' });
    });

    it('should include poolWeight and freezeTime in commit request when set', () => {
      component.ngOnInit();
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      const freezeTime = formatMoment(moment().subtract(1, 'day').hours(11).minutes(0));
      component.poolForm.patchValue({
        poolId: 'POOL123', poolProductCode: 'E2897V00',
        poolWeight: '250', freezeTime, poolingTime: yesterday,
      });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      const commitArg = serviceSpy.commitPool.calls.mostRecent().args[1];
      expect(commitArg.poolWeight).toBe(250);
      expect(commitArg.freezeTime).toBeTruthy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Pool ID handlers
  // ───────────────────────────────────────────────────────────
  describe('onPoolIdValidated', () => {
    it('should set poolCodeScheme and poolUnitId', () => {
      component.ngOnInit();
      component.onPoolIdValidated({ parsedUnitId: 'POOL123', codeScheme: 'I' } as any);
      expect(component.poolCodeScheme()).toBe('I');
      expect(component.poolForm.get('poolUnitId')?.value).toBe('POOL123');
    });
  });

  describe('onPoolIdCleared', () => {
    it('should call clearAll', () => {
      component.ngOnInit();
      component.currentPool.set(mockPoolHeader);
      component.onPoolIdCleared();
      expect(component.currentPool()).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // onPoolIdPostValidate
  // ───────────────────────────────────────────────────────────
  describe('onPoolIdPostValidate', () => {
    it('should populate form when pool is found', () => {
      component.ngOnInit();
      // Mock getWeightInfo to return Y so the product code change subscription preserves it
      serviceSpy.getWeightInfo.and.returnValue(of({ weightRequired: 'Y', specificGravity: 1.03, freezeTimeRequired: 'N' }));
      const apiResponse: ApiResponse<PoolHeader> = {
        success: true,
        data: mockPoolHeader,
        weightRequired: 'Y',
        specificGravity: 1.03,
        freezeTimeRequired: 'N',
        attributes: [],
      };
      serviceSpy.getPoolById.and.returnValue(of(apiResponse));
      serviceSpy.getUnitsInPool.and.returnValue(of(mockPoolUnits));

      const confirmSpy = jasmine.createSpy('confirm');
      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);

      expect(component.currentPool()).toEqual(mockPoolHeader);
      expect(component.poolForm.get('patientId')?.value).toBe('PAT001');
      expect(component.weightRequired()).toBe('Y');
      expect(confirmSpy).toHaveBeenCalled();
    });

    it('should show snackbar and auto-populate pooling time when pool not found', () => {
      component.ngOnInit();
      serviceSpy.getPoolById.and.returnValue(of({ success: false, data: null, message: 'Not found' }));

      const confirmSpy = jasmine.createSpy('confirm');
      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);

      expect(component.currentPool()).toBeNull();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Not found', 'Close', jasmine.any(Object),
      );
      expect(confirmSpy).toHaveBeenCalled();
      // Pooling time should be auto-populated
      expect(component.poolForm.get('poolingTime')?.value).toBeTruthy();
    });

    it('should reject event on error', () => {
      component.ngOnInit();
      serviceSpy.getPoolById.and.returnValue(throwError(() => ({
        error: { message: 'Server error' },
      })));

      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy,
      };

      component.onPoolIdPostValidate(event as any);

      expect(rejectSpy).toHaveBeenCalledWith('Server error');
    });

    it('should populate attributes from API response', () => {
      component.ngOnInit();
      serviceSpy.getAttribCodes.and.returnValue(of(mockAttribCodes));
      const apiResponse: ApiResponse<PoolHeader> = {
        success: true,
        data: mockPoolHeader,
        attributes: [
          { attribGroup: 'CMV', attribCode: 'CMVN' },
        ],
      };
      serviceSpy.getPoolById.and.returnValue(of(apiResponse));
      serviceSpy.getUnitsInPool.and.returnValue(of([]));

      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);

      expect(component.attributes.length).toBe(1);
      expect(component.attributes.at(0).get('attributeGroup')?.value).toBe('CMV');
      expect(component.attributes.at(0).get('attributeCode')?.value).toBe('CMVN');
    });

    it('should use errorResponse.error when error.message is absent', () => {
      component.ngOnInit();
      serviceSpy.getPoolById.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Detailed error' } },
      })));

      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy,
      };

      component.onPoolIdPostValidate(event as any);
      expect(rejectSpy).toHaveBeenCalledWith('Detailed error');
    });

    it('should use default message when no error details', () => {
      component.ngOnInit();
      serviceSpy.getPoolById.and.returnValue(throwError(() => ({ error: {} })));

      const rejectSpy = jasmine.createSpy('reject');
      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: jasmine.createSpy('confirm'),
        reject: rejectSpy,
      };

      component.onPoolIdPostValidate(event as any);
      expect(rejectSpy).toHaveBeenCalledWith('Error loading pool');
    });

    it('should load lots for catalog when pool has catalogNumber', () => {
      component.ngOnInit();
      serviceSpy.getPoolById.and.returnValue(of({
        success: true,
        data: mockPoolHeader,
        attributes: [],
      }));
      serviceSpy.getUnitsInPool.and.returnValue(of([]));
      serviceSpy.getValidLots.calls.reset();

      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);
      expect(serviceSpy.getValidLots).toHaveBeenCalledWith('1BATRDSEF1');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Component unit handlers
  // ───────────────────────────────────────────────────────────
  describe('onComponentUnitValidated', () => {
    it('should load products for unit on success', () => {
      component.ngOnInit();
      serviceSpy.getValidProductsForUnit.and.returnValue(of(mockUnitProducts));

      component.onComponentUnitValidated({ parsedUnitId: 'UNIT001', codeScheme: 'I' } as any);

      expect(component.unitProducts()).toEqual(mockUnitProducts);
      expect(component.filteredUnitProducts()).toEqual(mockUnitProducts);
    });

    it('should clear products on error', () => {
      component.ngOnInit();
      serviceSpy.getValidProductsForUnit.and.returnValue(throwError(() => new Error('fail')));

      component.onComponentUnitValidated({ parsedUnitId: 'UNIT001', codeScheme: 'I' } as any);

      expect(component.unitProducts().length).toBe(0);
    });

    it('should return early when parsedUnitId is empty', () => {
      component.ngOnInit();
      serviceSpy.getValidProductsForUnit.calls.reset();

      component.onComponentUnitValidated({ parsedUnitId: '', codeScheme: 'I' } as any);
      expect(serviceSpy.getValidProductsForUnit).not.toHaveBeenCalled();
    });
  });

  describe('onComponentUnitCleared', () => {
    it('should clear product line form and unit products', () => {
      component.ngOnInit();
      component.unitProducts.set(mockUnitProducts);
      component.filteredUnitProducts.set(mockUnitProducts);
      component.productLineForm.patchValue({ productCode: 'E2897V00', description: 'test' });

      component.onComponentUnitCleared();

      expect(component.productLineForm.get('productCode')?.value).toBe('');
      expect(component.unitProducts().length).toBe(0);
      expect(component.filteredUnitProducts().length).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────
  // onUnitProductSelected
  // ───────────────────────────────────────────────────────────
  describe('onUnitProductSelected', () => {
    it('should populate product line form with selected product', () => {
      component.ngOnInit();
      component.unitProducts.set(mockUnitProducts);

      component.onUnitProductSelected('E2897V00');

      expect(component.productLineForm.get('productCode')?.value).toBe('E2897V00');
      expect(component.productLineForm.get('description')?.value).toBe('POOLAND');
      expect(component.productLineForm.get('systemLabelDecision')?.value).toBe('Acceptable');
    });

    it('should use systemLabelDecision when sldDescription is not available', () => {
      component.ngOnInit();
      component.unitProducts.set(mockUnitProducts);

      component.onUnitProductSelected('E2898V00');

      expect(component.productLineForm.get('systemLabelDecision')?.value).toBe('Discard');
    });

    it('should do nothing when product is not found', () => {
      component.ngOnInit();
      component.unitProducts.set(mockUnitProducts);

      component.onUnitProductSelected('UNKNOWN');

      expect(component.productLineForm.get('productCode')?.value).toBeFalsy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // onUnitProductScanBlur
  // ───────────────────────────────────────────────────────────
  describe('onUnitProductScanBlur', () => {
    let triggerMock: any;

    beforeEach(() => {
      component.ngOnInit();
      triggerMock = { panelOpen: false };
    });

    it('should return early when autocomplete panel is open', () => {
      triggerMock.panelOpen = true;
      component.onUnitProductScanBlur(triggerMock);
      expect(labelScanSpyObj.validateProductScan).not.toHaveBeenCalled();
    });

    it('should clear error when scan value is empty', () => {
      component.productLineForm.patchValue({ productCode: '' });
      component.fieldErrors['unitProductCode'] = 'some error';
      component.onUnitProductScanBlur(triggerMock);
      expect(component.fieldErrors['unitProductCode']).toBe('');
    });

    it('should populate form when scanned value matches a unit product', () => {
      component.unitProducts.set(mockUnitProducts);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });

      component.onUnitProductScanBlur(triggerMock);

      expect(component.productLineForm.get('description')?.value).toBe('POOLAND');
    });

    it('should call validateProductScan when value does not match any product', () => {
      component.unitProducts.set(mockUnitProducts);
      component.productLineForm.patchValue({ productCode: '=E2897V00' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, productCode: 'E2897V00', productDescription: null, entryMode: null },
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      expect(labelScanSpyObj.validateProductScan).toHaveBeenCalled();
      expect(component.productLineForm.get('productCode')?.value).toBe('E2897V00');
    });

    it('should set error when product scan resolves to product not in list', () => {
      component.unitProducts.set(mockUnitProducts);
      component.productLineForm.patchValue({ productCode: '=UNKNOWN' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, productCode: 'NOTINLIST', productDescription: null, entryMode: null },
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.fieldErrors['unitProductCode']).toBe('Product not available for this unit');
    });

    it('should set error when product scan fails', () => {
      component.unitProducts.set([]);
      component.productLineForm.patchValue({ productCode: 'BADSCAN' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: false,
        message: 'Bad scan',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.fieldErrors['unitProductCode']).toBe('Bad scan');
    });

    it('should set error on HTTP error from validateProductScan', () => {
      component.unitProducts.set([]);
      component.productLineForm.patchValue({ productCode: 'BADSCAN' });

      labelScanSpyObj.validateProductScan.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'HTTP error' } },
      })));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.fieldErrors['unitProductCode']).toBe('HTTP error');
      expect(component.fieldProcessing['unitProductCode']).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // onAddUnit
  // ───────────────────────────────────────────────────────────
  describe('onAddUnit', () => {
    it('should return early when loading', () => {
      component.ngOnInit();
      component.loading.set(true);
      component.onAddUnit();
      expect(serviceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should show error when unit ID not validated', () => {
      component.ngOnInit();
      mockComponentUnitIdField(null, false);
      component.onAddUnit();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please enter and validate a Unit ID first', 'Close', jasmine.any(Object),
      );
    });

    it('should show error when product code is missing', () => {
      component.ngOnInit();
      mockComponentUnitIdField('UNIT001', true);
      component.productLineForm.patchValue({ productCode: '' });
      component.onAddUnit();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Product Code is required', 'Close', jasmine.any(Object),
      );
    });

    it('should show error when unit is already in pool', () => {
      component.ngOnInit();
      mockComponentUnitIdField('W6333-26-123457-X', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onAddUnit();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'This unit has already been added to the pool', 'Close', jasmine.any(Object),
      );
    });

    it('should return early when poolId is empty', () => {
      component.ngOnInit();
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: '' });

      component.onAddUnit();

      expect(serviceSpy.validateUnit).not.toHaveBeenCalled();
    });

    it('should validate unit and add to pool on success', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        expiryDate: '2025-01-01T00:00:00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      expect(component.loading()).toBeFalse();
      expect(component.unitsInPool().length).toBe(1);
      expect(component.unitsInPool()[0].unitId).toBe('NEWUNIT001');
    });

    it('should derive componentPrefix for ISBT units with 13-char unitId', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: '1234567890123',
        productCode: 'E2897V00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      mockComponentUnitIdField('1234567890123', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      const callArgs = serviceSpy.validateUnit.calls.mostRecent().args[1];
      // substring(6, 8) of 'E2897V00' = '00'
      expect(callArgs.componentPrefix).toBe('00');
    });

    it('should show expiry warning dialog when unit expires before pool', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        expiryDate: '2024-01-01T00:00:00',
        poolExpiryDate: '2025-01-01T00:00:00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      spyOn(dialogSpy, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component.unitsInPool().length).toBe(1);
    });

    it('should not add unit when expiry warning dialog is cancelled', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        expiryDate: '2024-01-01T00:00:00',
        poolExpiryDate: '2025-01-01T00:00:00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      spyOn(dialogSpy, 'open').and.returnValue({ afterClosed: () => of(false) } as any);
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      expect(component.unitsInPool().length).toBe(0);
    });

    it('should handle validation error', () => {
      component.ngOnInit();
      serviceSpy.validateUnit.and.returnValue(throwError(() => ({ error: { message: 'Validation failed' } })));
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      expect(component.loading()).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalledWith('Validation failed', 'Close', jasmine.any(Object));
    });
  });

  // ───────────────────────────────────────────────────────────
  // removeUnitFromPool / removeUnit / onRowAction
  // ───────────────────────────────────────────────────────────
  describe('removeUnitFromPool', () => {
    it('should call service and remove unit when pool exists', () => {
      component.ngOnInit();
      component.currentPool.set(mockPoolHeader);
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.unitsInPool.set([...mockPoolUnits]);

      serviceSpy.removeUnitFromPool.and.returnValue(of(undefined));

      component.onRowAction({ action: 'delete', row: mockPoolUnits[0] } as any);

      expect(serviceSpy.removeUnitFromPool).toHaveBeenCalledWith('POOL123', jasmine.objectContaining({
        unitId: 'W6333-26-123457-X',
        productCode: 'E2897V00',
      }));
      expect(component.unitsInPool().length).toBe(0);
      expect(component.loading()).toBeFalse();
    });

    it('should show error on service failure', () => {
      component.ngOnInit();
      component.currentPool.set(mockPoolHeader);
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.unitsInPool.set([...mockPoolUnits]);

      serviceSpy.removeUnitFromPool.and.returnValue(throwError(() => ({ error: { message: 'Remove failed' } })));

      component.onRowAction({ action: 'delete', row: mockPoolUnits[0] } as any);

      expect(snackBarSpy.open).toHaveBeenCalledWith('Remove failed', 'Close', jasmine.any(Object));
      expect(component.loading()).toBeFalse();
    });

    it('should remove unit locally when pool does not exist', () => {
      component.ngOnInit();
      component.currentPool.set(null);
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onRowAction({ action: 'delete', row: mockPoolUnits[0] } as any);

      expect(serviceSpy.removeUnitFromPool).not.toHaveBeenCalled();
      expect(component.unitsInPool().length).toBe(0);
    });

    it('should return early when poolId is empty', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: '' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onRowAction({ action: 'delete', row: mockPoolUnits[0] } as any);

      expect(component.unitsInPool().length).toBe(1);
    });

    it('should clear poolWeight after removing a unit', () => {
      component.ngOnInit();
      component.currentPool.set(null);
      component.poolForm.patchValue({ poolId: 'POOL123', poolWeight: '250' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onRowAction({ action: 'delete', row: mockPoolUnits[0] } as any);

      expect(component.poolForm.get('poolWeight')?.value).toBe('');
    });
  });

  describe('removeUnit', () => {
    it('should remove unit by index', () => {
      component.ngOnInit();
      component.currentPool.set(null);
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.removeUnit(0);
      expect(component.unitsInPool().length).toBe(0);
    });

    it('should do nothing for invalid index', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.removeUnit(99);
      expect(component.unitsInPool().length).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────
  // recalculatePoolExpiry
  // ───────────────────────────────────────────────────────────
  describe('recalculatePoolExpiry', () => {
    it('should set pool expiry to the minimum unit expiry', () => {
      component.ngOnInit();
      component.productExpiryDate.set(moment('2025-06-01'));
      component.unitsInPool.set([
        { unitId: 'U1', productCode: 'P1', expiryDate: '2025-03-01T00:00:00' } as PoolUnit,
        { unitId: 'U2', productCode: 'P2', expiryDate: '2025-01-15T00:00:00' } as PoolUnit,
      ]);

      (component as any).recalculatePoolExpiry();

      const expiryVal = component.poolForm.get('expirationDate')?.value;
      expect(expiryVal).toContain('15-JAN-2025');
    });

    it('should use productExpiryDate when no units have expiry', () => {
      component.ngOnInit();
      component.productExpiryDate.set(moment('2025-06-01'));
      component.unitsInPool.set([
        { unitId: 'U1', productCode: 'P1' } as PoolUnit,
      ]);

      (component as any).recalculatePoolExpiry();

      const expiryVal = component.poolForm.get('expirationDate')?.value;
      expect(expiryVal).toContain('01-JUN-2025');
    });

    it('should not update when no productExpiryDate and no unit expiries', () => {
      component.ngOnInit();
      component.productExpiryDate.set(null);
      component.unitsInPool.set([
        { unitId: 'U1', productCode: 'P1' } as PoolUnit,
      ]);

      (component as any).recalculatePoolExpiry();

      expect(component.poolForm.get('expirationDate')?.value).toBeFalsy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Reprint
  // ───────────────────────────────────────────────────────────
  describe('onReprint', () => {
    it('should show error when pool ID is missing', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: '', poolProductCode: 'E2897V00' });
      component.currentPool.set(mockPoolHeader);

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Pool ID and Product Code are required for reprint', 'Close', jasmine.any(Object),
      );
    });

    it('should show error when product code is missing', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: '' });
      component.currentPool.set(mockPoolHeader);

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Pool ID and Product Code are required for reprint', 'Close', jasmine.any(Object),
      );
    });

    it('should show error when no pool is loaded', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.currentPool.set(null);

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Pool ID and Product Code are required for reprint', 'Close', jasmine.any(Object),
      );
    });

    it('should show success snackbar on valid reprint', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.currentPool.set(mockPoolHeader);

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Label reprint has been queued.', 'DISMISS', jasmine.any(Object),
      );
    });
  });

  // ───────────────────────────────────────────────────────────
  // onDelete
  // ───────────────────────────────────────────────────────────
  describe('onDelete', () => {
    it('should navigate to delete page when pool is loaded', () => {
      component.ngOnInit();
      spyOn(router, 'navigate');
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.currentPool.set(mockPoolHeader);

      component.onDelete();

      expect(router.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/component-production/delete-pooled-components'],
        { queryParams: { poolId: 'POOL123' } },
      );
    });

    it('should do nothing when pool ID is empty', () => {
      component.ngOnInit();
      spyOn(router, 'navigate');
      component.poolForm.patchValue({ poolId: '' });
      component.currentPool.set(mockPoolHeader);

      component.onDelete();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should do nothing when no pool is loaded', () => {
      component.ngOnInit();
      spyOn(router, 'navigate');
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.currentPool.set(null);

      component.onDelete();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Catalog/Lot handlers
  // ───────────────────────────────────────────────────────────
  describe('onCatalogSelected', () => {
    it('should set catalog value and load lots', () => {
      component.ngOnInit();
      serviceSpy.getValidLots.calls.reset();
      component.onCatalogSelected('CAT002');

      expect(component.poolForm.get('catalogNumber')?.value).toBe('CAT002');
      expect(component.catalogSelected()).toBeTrue();
      expect(serviceSpy.getValidLots).toHaveBeenCalledWith('CAT002');
    });

    it('should clear lot number when catalog is selected', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ lotNumber: 'OLD' });
      component.onCatalogSelected('CAT002');
      expect(component.poolForm.get('lotNumber')?.value).toBe('');
    });
  });

  describe('onLotSelected', () => {
    it('should set lot value', () => {
      component.ngOnInit();
      component.onLotSelected('LOT002');
      expect(component.poolForm.get('lotNumber')?.value).toBe('LOT002');
    });
  });

  describe('onCatalogScanBlur', () => {
    let triggerMock: any;

    beforeEach(() => {
      component.ngOnInit();
      triggerMock = { panelOpen: false };
    });

    it('should return early when panel is open', fakeAsync(() => {
      triggerMock.panelOpen = true;
      component.onCatalogScanBlur(triggerMock);
      tick(100);
      expect(labelScanSpyObj.validateCatalogScan).not.toHaveBeenCalled();
    }));

    it('should clear catalog and lots when scan value is empty', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: '' });
      component.catalogSelected.set(true);

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.catalogSelected()).toBeFalse();
      expect(component.validLots().length).toBe(0);
    }));

    it('should match exact catalog without scan validation', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: '1BATRDSEF1' });
      serviceSpy.getValidLots.calls.reset();

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.catalogSelected()).toBeTrue();
      expect(labelScanSpyObj.validateCatalogScan).not.toHaveBeenCalled();
      expect(serviceSpy.getValidLots).toHaveBeenCalledWith('1BATRDSEF1');
    }));

    it('should call validateCatalogScan when no exact match', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'SCANNEDCAT' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, catalogNumber: 'CAT002', lotScanPortion: null, autoPopulatedLot: null, entryMode: null },
        errorResponse: null,
      }));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(labelScanSpyObj.validateCatalogScan).toHaveBeenCalledWith('SCANNEDCAT', 'CPIPOOL2');
      expect(component.poolForm.get('catalogNumber')?.value).toBe('CAT002');
    }));

    it('should auto-populate lot from combined scan', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'COMBINED' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, catalogNumber: 'CAT002', lotScanPortion: 'LOT123', autoPopulatedLot: null, entryMode: null },
        errorResponse: null,
      }));
      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, lotNumber: 'LOT123', entryMode: null },
        errorResponse: null,
      }));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(labelScanSpyObj.validateLotScan).toHaveBeenCalledWith('&)LOT123', 'CAT002');
      expect(component.poolForm.get('lotNumber')?.value).toBe('LOT123');
    }));

    it('should auto-populate lot from autoPopulatedLot', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'AUTOPOP' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, catalogNumber: 'CAT002', lotScanPortion: null, autoPopulatedLot: 'AUTOLOT', entryMode: null },
        errorResponse: null,
      }));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.poolForm.get('lotNumber')?.value).toBe('AUTOLOT');
    }));

    it('should set error on catalog scan failure', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'BADCAT' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(of({
        success: false,
        message: 'Invalid catalog',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['catalogNumber']).toBe('Invalid catalog');
    }));

    it('should set error on catalog scan HTTP error', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'BADCAT' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(throwError(() => ({
        error: { message: 'HTTP fail' },
      })));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['catalogNumber']).toBe('HTTP fail');
      expect(component.fieldProcessing['catalogNumber']).toBeFalse();
    }));
  });

  describe('onLotScanBlur', () => {
    let triggerMock: any;

    beforeEach(() => {
      component.ngOnInit();
      triggerMock = { panelOpen: false };
    });

    it('should return early when panel is open', fakeAsync(() => {
      triggerMock.panelOpen = true;
      component.onLotScanBlur(triggerMock);
      tick(100);
      expect(labelScanSpyObj.validateLotScan).not.toHaveBeenCalled();
    }));

    it('should clear error when scan value is empty', fakeAsync(() => {
      component.poolForm.patchValue({ lotNumber: '' });
      component.fieldErrors['lotNumber'] = 'some error';

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['lotNumber']).toBe('');
    }));

    it('should set error when catalog number is not selected', fakeAsync(() => {
      component.poolForm.patchValue({ lotNumber: 'LOT123', catalogNumber: '' });

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['lotNumber']).toBe('Select a catalog number first.');
    }));

    it('should not call scan service when exact match exists', fakeAsync(() => {
      component.validLots.set(mockLots);
      component.poolForm.patchValue({ lotNumber: 'TRANSFFIR1', catalogNumber: 'CAT001' });

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(labelScanSpyObj.validateLotScan).not.toHaveBeenCalled();
    }));

    it('should call validateLotScan when no exact match', fakeAsync(() => {
      component.validLots.set(mockLots);
      component.poolForm.patchValue({ lotNumber: 'SCANNED', catalogNumber: '1BATRDSEF1' });

      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, lotNumber: 'TRANSFFIR1', entryMode: null },
        errorResponse: null,
      }));

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(labelScanSpyObj.validateLotScan).toHaveBeenCalledWith('SCANNED', '1BATRDSEF1');
      expect(component.poolForm.get('lotNumber')?.value).toBe('TRANSFFIR1');
    }));

    it('should set error on lot scan failure', fakeAsync(() => {
      component.validLots.set([]);
      component.poolForm.patchValue({ lotNumber: 'BADLOT', catalogNumber: '1BATRDSEF1' });

      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: false,
        message: 'Invalid lot',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['lotNumber']).toBe('Invalid lot');
    }));

    it('should set error on lot scan HTTP error', fakeAsync(() => {
      component.validLots.set([]);
      component.poolForm.patchValue({ lotNumber: 'BADLOT', catalogNumber: '1BATRDSEF1' });

      labelScanSpyObj.validateLotScan.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Lot HTTP fail' } },
      })));

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['lotNumber']).toBe('Lot HTTP fail');
      expect(component.fieldProcessing['lotNumber']).toBeFalse();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // loadLotsForCatalog
  // ───────────────────────────────────────────────────────────
  describe('loadLotsForCatalog', () => {
    it('should load lots on success', () => {
      component.ngOnInit();
      serviceSpy.getValidLots.and.returnValue(of(mockLots));
      (component as any).loadLotsForCatalog('CAT001');
      expect(component.validLots()).toEqual(mockLots);
      expect(component.filteredLots()).toEqual(mockLots);
    });

    it('should clear and not call service when catalog is empty', () => {
      component.ngOnInit();
      component.validLots.set(mockLots);
      serviceSpy.getValidLots.calls.reset();
      (component as any).loadLotsForCatalog('');
      expect(serviceSpy.getValidLots).not.toHaveBeenCalled();
      expect(component.validLots().length).toBe(0);
    });

    it('should show error on failure', () => {
      component.ngOnInit();
      serviceSpy.getValidLots.and.returnValue(throwError(() => ({ error: { message: 'Lots failed' } })));
      (component as any).loadLotsForCatalog('CAT001');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Lots failed', 'Close', jasmine.any(Object));
    });
  });

  // ───────────────────────────────────────────────────────────
  // loadUnitsInPool
  // ───────────────────────────────────────────────────────────
  describe('loadUnitsInPool', () => {
    it('should load and assign sequence numbers', () => {
      component.ngOnInit();
      serviceSpy.getUnitsInPool.and.returnValue(of(mockPoolUnits));
      (component as any).loadUnitsInPool('POOL123');
      expect(component.unitsInPool().length).toBe(1);
      expect((component.unitsInPool()[0] as any).sequenceNumber).toBe(1);
    });

    it('should show error on failure', () => {
      component.ngOnInit();
      serviceSpy.getUnitsInPool.and.returnValue(throwError(() => ({ error: { message: 'Load units failed' } })));
      (component as any).loadUnitsInPool('POOL123');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Load units failed', 'Close', jasmine.any(Object));
    });
  });

  // ───────────────────────────────────────────────────────────
  // clearAllProductLine
  // ───────────────────────────────────────────────────────────
  describe('clearAllProductLine', () => {
    it('should clear product line form and related signals', () => {
      component.ngOnInit();
      mockComponentUnitIdField('UNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00', description: 'Test' });
      component.unitProducts.set(mockUnitProducts);
      component.filteredUnitProducts.set(mockUnitProducts);
      component.fieldErrors['unitProductCode'] = 'error';

      component.clearAllProductLine();

      expect(component.unitProducts().length).toBe(0);
      expect(component.filteredUnitProducts().length).toBe(0);
      expect(component.fieldErrors['unitProductCode']).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Clear All
  // ───────────────────────────────────────────────────────────
  describe('Clear All', () => {
    it('should reset form and clear data', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: 'POOL123', patientId: 'PAT001' });
      component.currentPool.set(mockPoolHeader);
      component.unitsInPool.set(mockPoolUnits);
      component.addAttribute();

      component.clearAll();

      expect(component.poolForm.get('poolId')?.value).toBe(null);
      expect(component.poolForm.get('patientId')?.value).toBe(null);
      expect(component.currentPool()).toBeNull();
      expect(component.unitsInPool().length).toBe(0);
      expect(component.attributes.length).toBe(0);
    });

    it('should reset all signals and search controls', () => {
      component.ngOnInit();
      component.poolCodeScheme.set('I');
      component.productExpiryDate.set(moment());
      component.catalogSelected.set(true);
      component.fieldErrors = { test: 'error' };
      component.fieldProcessing = { test: true };
      component.validAttribGroups.set(mockAttribGroups);
      component.unitProducts.set(mockUnitProducts);

      component.clearAll();

      expect(component.poolCodeScheme()).toBeNull();
      expect(component.productExpiryDate()).toBeNull();
      expect(component.catalogSelected()).toBeFalse();
      expect(component.fieldErrors).toEqual({});
      expect(component.fieldProcessing).toEqual({});
      expect(component.validAttribGroups().length).toBe(0);
      expect(component.unitProducts().length).toBe(0);
    });

    it('should prevent re-entrance via clearing flag', () => {
      component.ngOnInit();
      (component as any).clearing = true;
      component.currentPool.set(mockPoolHeader);
      component.clearAll();
      // Should not have cleared because clearing flag was already set
      expect(component.currentPool()).toEqual(mockPoolHeader);
      (component as any).clearing = false;
    });
  });

  // ───────────────────────────────────────────────────────────
  // Code Scheme Detection
  // ───────────────────────────────────────────────────────────
  describe('Code Scheme Detection', () => {
    it('should detect ISBT when poolCodeScheme is I', () => {
      component.ngOnInit();
      component.poolCodeScheme.set('I');
      expect(component.isPoolIsbt()).toBeTrue();
    });

    it('should detect Codabar when poolCodeScheme is C', () => {
      component.ngOnInit();
      component.poolCodeScheme.set('C');
      expect(component.isPoolIsbt()).toBeFalse();
    });

    it('should return false when poolCodeScheme is null', () => {
      component.ngOnInit();
      component.poolCodeScheme.set(null);
      expect(component.isPoolIsbt()).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // onlyNumbers / onPasteNumbers
  // ───────────────────────────────────────────────────────────
  describe('onlyNumbers', () => {
    it.each([
      [48, true],  // '0'
      [57, true],  // '9'
      [65, false], // 'A'
      [47, false], // '/'
      [58, false], // ':'
    ])('should return %s for charCode %i', (charCode, expected) => {
      const event = { which: charCode, keyCode: charCode, preventDefault: jasmine.createSpy('preventDefault') } as any;
      const result = component.onlyNumbers(event);
      expect(result).toBe(expected);
      if (!expected) {
        expect(event.preventDefault).toHaveBeenCalled();
      }
    });

    it('should use keyCode when which is 0', () => {
      const event = { which: 0, keyCode: 50, preventDefault: jasmine.createSpy('preventDefault') } as any;
      expect(component.onlyNumbers(event)).toBeTrue();
    });
  });

  describe('onPasteNumbers', () => {
    it('should strip non-numeric characters from pasted text', () => {
      component.ngOnInit();
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc123def456' },
      } as any;

      component.onPasteNumbers(event, 'numberOfUnits');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.poolForm.get('numberOfUnits')?.value).toBe('123456');
    });

    it('should handle empty clipboard data', () => {
      component.ngOnInit();
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '' },
      } as any;

      component.onPasteNumbers(event, 'numberOfUnits');
      expect(component.poolForm.get('numberOfUnits')?.value).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Computed properties / getters
  // ───────────────────────────────────────────────────────────
  describe('computed properties', () => {
    it('should reflect hasPool', () => {
      component.ngOnInit();
      expect(component.hasPool()).toBeFalse();
      component.currentPool.set(mockPoolHeader);
      expect(component.hasPool()).toBeTrue();
    });

    it('should reflect poolIdReadonly', () => {
      component.ngOnInit();
      expect(component.poolIdReadonly()).toBeFalse();
      component.currentPool.set(mockPoolHeader);
      expect(component.poolIdReadonly()).toBeTrue();
    });

    it('should reflect unitsTableEmpty', () => {
      component.ngOnInit();
      expect(component.unitsTableEmpty()).toBeTrue();
      component.unitsInPool.set(mockPoolUnits);
      expect(component.unitsTableEmpty()).toBeFalse();
    });
  });

  describe('poolWeightDisplay', () => {
    it('should return empty string when no weight', () => {
      component.ngOnInit();
      expect(component.poolWeightDisplay).toBe('');
    });

    it('should return weight as string when set', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolWeight: '250' });
      expect(component.poolWeightDisplay).toBe('250');
    });
  });

  describe('volDisplay', () => {
    it('should return calculated volume when weight and gravity are set', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolWeight: '103' });
      component.specificGravity.set(1.03);
      expect(component.volDisplay).toBe('100.00');
    });

    it('should return N/A when weight exists but gravity is zero', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolWeight: '100' });
      component.specificGravity.set(0);
      expect(component.volDisplay).toBe('N/A');
    });

    it('should return N/A when weight exists but gravity is null', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolWeight: '100' });
      component.specificGravity.set(null);
      expect(component.volDisplay).toBe('N/A');
    });

    it('should return empty string when no weight', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolWeight: '' });
      expect(component.volDisplay).toBe('');
    });
  });

  describe('getRemainingCharacters', () => {
    it('should return correct remaining count', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ patientId: 'ABC' });
      expect(component.getRemainingCharacters('patientId', 10)).toBe('Characters Remaining: 7/10');
    });

    it('should return full count when field is empty', () => {
      component.ngOnInit();
      expect(component.getRemainingCharacters('patientId', 10)).toBe('Characters Remaining: 10/10');
    });
  });

  // ───────────────────────────────────────────────────────────
  // handleError
  // ───────────────────────────────────────────────────────────
  describe('handleError', () => {
    beforeEach(() => component.ngOnInit());

    it('should use error.message when available', () => {
      (component as any).handleError({ error: { message: 'Custom error' } }, 'Default');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Custom error', 'Close', jasmine.any(Object));
    });

    it('should use errorResponse.error when message is absent', () => {
      (component as any).handleError({ error: { errorResponse: { error: 'Response error' } } }, 'Default');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Response error', 'Close', jasmine.any(Object));
    });

    it('should use default message when no error details', () => {
      (component as any).handleError({}, 'Default message');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Default message', 'Close', jasmine.any(Object));
    });

    it('should use default message for null error', () => {
      (component as any).handleError(null, 'Default message');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Default message', 'Close', jasmine.any(Object));
    });
  });

  // ───────────────────────────────────────────────────────────
  // formatDateTimeForInput / parseDateTimeString
  // ───────────────────────────────────────────────────────────
  describe('formatDateTimeForInput', () => {
    it('should return empty string for null', () => {
      expect((component as any).formatDateTimeForInput(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect((component as any).formatDateTimeForInput(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect((component as any).formatDateTimeForInput('not-a-date')).toBe('');
    });

    it('should format valid ISO date with uppercase month', () => {
      const result = (component as any).formatDateTimeForInput('2024-07-14T10:30:00');
      expect(result).toContain('14-JUL-2024');
      expect(result).toContain('10:30');
    });
  });

  describe('parseDateTimeString', () => {
    it('should return null for empty string', () => {
      expect((component as any).parseDateTimeString('')).toBeNull();
    });

    it('should return null for null', () => {
      expect((component as any).parseDateTimeString(null)).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect((component as any).parseDateTimeString('not-valid')).toBeNull();
    });

    it('should parse valid DD-MMM-YYYY HH:mm format', () => {
      const result = (component as any).parseDateTimeString('14-JUL-2024 10:30');
      expect(result).toBeTruthy();
      expect(result.format('YYYY-MM-DD')).toBe('2024-07-14');
    });
  });

  // ───────────────────────────────────────────────────────────
  // getChapterNow
  // ───────────────────────────────────────────────────────────
  describe('getChapterNow', () => {
    it('should return moment() when timezone is UTC', () => {
      (headerServiceSpy as any).chapterTimeZone = jasmine.createSpy().and.returnValue('UTC');
      const result = (component as any).getChapterNow();
      expect(result).toBeTruthy();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('should return moment() when timezone is null', () => {
      (headerServiceSpy as any).chapterTimeZone = jasmine.createSpy().and.returnValue(null);
      const result = (component as any).getChapterNow();
      expect(result).toBeTruthy();
    });

    it('should return moment with chapter timezone when valid', () => {
      (headerServiceSpy as any).chapterTimeZone = jasmine.createSpy().and.returnValue('America/New_York');
      const result = (component as any).getChapterNow();
      expect(result).toBeTruthy();
      expect(moment.isMoment(result)).toBeTrue();
    });

    it('should fall back to moment() when timezone is invalid', () => {
      (headerServiceSpy as any).chapterTimeZone = jasmine.createSpy().and.returnValue('Invalid/TimeZone');
      const result = (component as any).getChapterNow();
      expect(result).toBeTruthy();
      expect(moment.isMoment(result)).toBeTrue();
    });
  });

  // ───────────────────────────────────────────────────────────
  // autoPopulatePoolingTime
  // ───────────────────────────────────────────────────────────
  describe('autoPopulatePoolingTime', () => {
    it('should populate pooling time when empty', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolingTime: '' });
      (component as any).autoPopulatePoolingTime();
      expect(component.poolForm.get('poolingTime')?.value).toBeTruthy();
    });

    it('should not overwrite existing pooling time', () => {
      component.ngOnInit();
      const existing = '14-JUL-2024 10:30';
      component.poolForm.patchValue({ poolingTime: existing });
      (component as any).autoPopulatePoolingTime();
      expect(component.poolForm.get('poolingTime')?.value).toBe(existing);
    });
  });

  // ───────────────────────────────────────────────────────────
  // setFieldError / clearFieldError
  // ───────────────────────────────────────────────────────────
  describe('setFieldError / clearFieldError', () => {
    it('should set field error on pool form control', () => {
      component.ngOnInit();
      (component as any).setFieldError('catalogNumber', 'Test error');
      expect(component.fieldErrors['catalogNumber']).toBe('Test error');
      expect(component.poolForm.get('catalogNumber')?.hasError('serverError')).toBeTrue();
    });

    it('should clear field error on pool form control', () => {
      component.ngOnInit();
      (component as any).setFieldError('catalogNumber', 'Test error');
      (component as any).clearFieldError('catalogNumber');
      expect(component.fieldErrors['catalogNumber']).toBe('');
      expect(component.poolForm.get('catalogNumber')?.errors).toBeNull();
    });

    it('should set error on product line form for unitProductCode', () => {
      component.ngOnInit();
      (component as any).setFieldError('unitProductCode', 'Product error');
      expect(component.fieldErrors['unitProductCode']).toBe('Product error');
      expect(component.productLineForm.get('productCode')?.hasError('serverError')).toBeTrue();
    });

    it('should clear error on product line form for unitProductCode', () => {
      component.ngOnInit();
      (component as any).setFieldError('unitProductCode', 'Product error');
      (component as any).clearFieldError('unitProductCode');
      expect(component.fieldErrors['unitProductCode']).toBe('');
      expect(component.productLineForm.get('productCode')?.errors).toBeNull();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Data table config
  // ───────────────────────────────────────────────────────────
  describe('unitsTableConfig', () => {
    it('should format expiryDate column correctly', () => {
      const formatter = component.unitsTableConfig.columns.find(c => c.key === 'expiryDate')?.valueFormatter;
      expect(formatter).toBeTruthy();
      const result = formatter!('2024-07-14T10:30:00', {} as any);
      expect(result).toContain('14-JUL-2024');
      expect(result).toContain('10:30');
    });

    it('should return empty string for null expiryDate', () => {
      const formatter = component.unitsTableConfig.columns.find(c => c.key === 'expiryDate')?.valueFormatter;
      expect(formatter!('', {} as any)).toBe('');
    });

    it('should format sldDescription column using row fallback', () => {
      const formatter = component.unitsTableConfig.columns.find(c => c.key === 'sldDescription')?.valueFormatter;
      expect(formatter).toBeTruthy();
      expect(formatter!('', { systemLabelDecision: 'Discard' } as PoolUnit)).toBe('Discard');
      expect(formatter!('Acceptable', {} as PoolUnit)).toBe('Acceptable');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Unique ID Generation
  // ───────────────────────────────────────────────────────────
  describe('Unique ID Generation Across Multiple Instances', () => {
    it('should have unique IDs across multiple component instances', () => {
      const fixture2 = TestBed.createComponent(PreparePooledComponentsComponent);
      const component2 = fixture2.componentInstance;

      expect((component as any).componentId).not.toBe((component2 as any).componentId);
      expect((component as any).elementId('poolId')).not.toBe((component2 as any).elementId('poolId'));
    });
  });

  // ───────────────────────────────────────────────────────────
  // elementId / errorId / labelId helpers
  // ───────────────────────────────────────────────────────────
  describe('ID helpers', () => {
    it('should generate correct elementId', () => {
      const id = (component as any).elementId('poolId');
      expect(id).toContain('prepare-pooled-components-');
      expect(id).toContain('-poolId');
    });

    it('should generate correct errorId', () => {
      const id = (component as any).errorId('poolId');
      expect(id).toContain('-poolId-error');
    });

    it('should generate correct labelId', () => {
      const id = (component as any).labelId('poolId');
      expect(id).toContain('-poolId-label');
    });
  });

  // ───────────────────────────────────────────────────────────
  // poolingTime valueChanges side effects
  // ───────────────────────────────────────────────────────────
  describe('poolingTime valueChanges', () => {
    it('should revalidate freeze time when pooling time changes and freeze time has value', () => {
      component.ngOnInit();
      const yesterday = moment().subtract(1, 'day');
      const poolStr = formatMoment(yesterday.clone().hours(15).minutes(0));
      const freezeStr = formatMoment(yesterday.clone().hours(14).minutes(0));

      component.poolForm.patchValue({ freezeTime: freezeStr });
      component.poolForm.patchValue({ poolingTime: poolStr });

      // Freeze time should get freezeBeforePool error because it is before pooling time
      expect(component.poolForm.get('freezeTime')?.hasError('freezeBeforePool')).toBeTrue();
    });

    it('should recalculate expiry when pooling time changes and product code is set', () => {
      component.ngOnInit();
      serviceSpy.calculateExpiry.calls.reset();
      component.poolForm.patchValue({ poolProductCode: 'E2897V00' });

      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ poolingTime: yesterday });

      expect(serviceSpy.calculateExpiry).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Accessibility (form controls)
  // ───────────────────────────────────────────────────────────
  describe('Accessibility', () => {
    it('should have form controls for required fields', () => {
      component.ngOnInit();
      expect(component.poolForm.get('poolId')).toBeTruthy();
      expect(component.poolForm.get('poolProductCode')).toBeTruthy();
      expect(component.poolForm.get('poolingTime')).toBeTruthy();
      expect(component.poolForm.get('freezeTime')).toBeTruthy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // patchPoolForm
  // ───────────────────────────────────────────────────────────
  describe('patchPoolForm', () => {
    it('should populate all form fields from pool header', () => {
      component.ngOnInit();
      serviceSpy.getValidLots.calls.reset();

      (component as any).patchPoolForm(mockPoolHeader);

      expect(component.poolForm.get('patientId')?.value).toBe('PAT001');
      expect(component.poolForm.get('patientFirstName')?.value).toBe('John');
      expect(component.poolForm.get('patientLastName')?.value).toBe('Doe');
      expect(component.poolForm.get('facility')?.value).toBe('Test Facility');
      expect(component.poolForm.get('poolProductCode')?.value).toBe('E2897V00');
      expect(component.poolForm.get('numberOfUnits')?.value).toBe(4);
      expect(component.poolForm.get('poolWeight')?.value).toBe(165);
      expect(component.catalogSelected()).toBeTrue();
      expect(serviceSpy.getValidLots).toHaveBeenCalledWith('1BATRDSEF1');
    });

    it('should set productExpiryDate when pool has expiry', () => {
      component.ngOnInit();
      (component as any).patchPoolForm(mockPoolHeader);
      expect(component.productExpiryDate()).toBeTruthy();
    });

    it('should not set productExpiryDate when pool has no expiry', () => {
      component.ngOnInit();
      const poolNoExpiry = { ...mockPoolHeader, poolExpiryDats: undefined };
      (component as any).patchPoolForm(poolNoExpiry);
      // productExpiryDate not explicitly set (depends on previous state)
      expect(component.poolForm.get('expirationDate')?.value).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // validateAndSetLotFromCombinedScan
  // ───────────────────────────────────────────────────────────
  describe('validateAndSetLotFromCombinedScan', () => {
    it('should return early when catalogNumber is empty', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ catalogNumber: '' });
      (component as any).validateAndSetLotFromCombinedScan('LOT123');
      expect(labelScanSpyObj.validateLotScan).not.toHaveBeenCalled();
    });

    it('should set lot on success', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ catalogNumber: 'CAT001' });
      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, lotNumber: 'LOT123', entryMode: null },
        errorResponse: null,
      }));

      (component as any).validateAndSetLotFromCombinedScan('LOT123');

      expect(labelScanSpyObj.validateLotScan).toHaveBeenCalledWith('&)LOT123', 'CAT001');
      expect(component.poolForm.get('lotNumber')?.value).toBe('LOT123');
    });

    it('should set error on failure', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ catalogNumber: 'CAT001' });
      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: false,
        message: 'Lot invalid',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      (component as any).validateAndSetLotFromCombinedScan('LOT123');

      expect(component.fieldErrors['lotNumber']).toBe('Lot invalid');
    });

    it('should set error on HTTP error', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ catalogNumber: 'CAT001' });
      labelScanSpyObj.validateLotScan.and.returnValue(throwError(() => ({
        error: { message: 'Server error' },
      })));

      (component as any).validateAndSetLotFromCombinedScan('LOT123');

      expect(component.fieldErrors['lotNumber']).toBe('Server error');
      expect(component.fieldProcessing['lotNumber']).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // resetWeightState
  // ───────────────────────────────────────────────────────────
  describe('resetWeightState', () => {
    it('should reset weight signals and remove required validator from poolWeight', () => {
      component.ngOnInit();
      component.weightRequired.set('Y');
      component.specificGravity.set(1.03);
      component.freezeTimeRequired.set('Y');

      (component as any).resetWeightState();

      expect(component.weightRequired()).toBe('N');
      expect(component.specificGravity()).toBeNull();
      expect(component.freezeTimeRequired()).toBe('N');

      // Confirm weight is not required after reset
      component.poolForm.get('poolWeight')?.setValue('');
      expect(component.poolForm.get('poolWeight')?.hasError('required')).toBeFalsy();
    });
  });

  // ───────────────────────────────────────────────────────────
  // dateTimeFormatValidator edge cases
  // ───────────────────────────────────────────────────────────
  describe('dateTimeFormatValidator edge cases', () => {
    it('should return null for empty value', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('freezeTime');
      ctrl?.setValue('');
      expect(ctrl?.errors).toBeNull();
    });

    it('should return invalidDateTime for non-leap year Feb 29', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('freezeTime');
      ctrl?.setValue('29-FEB-2023 10:30');
      expect(ctrl?.hasError('invalidDateTime')).toBeTrue();
    });

    it('should normalize lowercase month to uppercase', fakeAsync(() => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('freezeTime');
      ctrl?.setValue('14-jul-2024 10:30');
      // After the setTimeout fires, value should be normalized
      tick(10);
      expect(ctrl?.value).toBe('14-JUL-2024 10:30');
    }));

    it('should handle product with no expiryDate in onUnitProductSelected', () => {
      component.ngOnInit();
      const productsNoExpiry: UnitProduct[] = [
        { code: 'NOEXP', description: 'No Expiry Product' },
      ];
      component.unitProducts.set(productsNoExpiry);

      component.onUnitProductSelected('NOEXP');

      expect(component.productLineForm.get('expirationDate')?.value).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Additional branch coverage for patchPoolForm
  // ───────────────────────────────────────────────────────────
  describe('patchPoolForm edge cases', () => {
    it('should handle null poolWeight with nullish coalescing', () => {
      component.ngOnInit();
      const poolNoWeight = { ...mockPoolHeader, poolWeight: undefined, catalogNumber: undefined };
      (component as any).patchPoolForm(poolNoWeight);
      expect(component.poolForm.get('poolWeight')?.value).toBe('');
      expect(component.catalogSelected()).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Additional branch coverage for removeUnitFromPool multi-unit filtering
  // ───────────────────────────────────────────────────────────
  describe('removeUnitFromPool filtering', () => {
    it('should resequence remaining units after removal (with pool)', () => {
      component.ngOnInit();
      component.currentPool.set(mockPoolHeader);
      component.poolForm.patchValue({ poolId: 'POOL123' });
      const twoUnits: PoolUnit[] = [
        { unitId: 'U1', productCode: 'P1', productDescription: 'D1' },
        { unitId: 'U2', productCode: 'P2', productDescription: 'D2' },
      ];
      component.unitsInPool.set(twoUnits);
      serviceSpy.removeUnitFromPool.and.returnValue(of(undefined));

      component.onRowAction({ action: 'delete', row: twoUnits[0] } as any);

      expect(component.unitsInPool().length).toBe(1);
      expect((component.unitsInPool()[0] as any).sequenceNumber).toBe(1);
      expect(component.unitsInPool()[0].unitId).toBe('U2');
    });

    it('should filter by both unitId and productCode', () => {
      component.ngOnInit();
      component.currentPool.set(null);
      component.poolForm.patchValue({ poolId: 'POOL123' });
      const units: PoolUnit[] = [
        { unitId: 'U1', productCode: 'P1' },
        { unitId: 'U1', productCode: 'P2' },
      ];
      component.unitsInPool.set(units);

      component.onRowAction({ action: 'delete', row: { unitId: 'U1', productCode: 'P1' } } as any);

      expect(component.unitsInPool().length).toBe(1);
      expect(component.unitsInPool()[0].productCode).toBe('P2');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Additional branch coverage for onAddUnit expiry comparison
  // ───────────────────────────────────────────────────────────
  describe('onAddUnit expiry edge cases', () => {
    it('should add unit without warning when unit expiry is after pool expiry', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        expiryDate: '2026-01-01T00:00:00',
        poolExpiryDate: '2025-01-01T00:00:00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      expect(component.unitsInPool().length).toBe(1);
    });

    it('should add unit without warning when unit has no expiry date', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      expect(component.unitsInPool().length).toBe(1);
    });

    it('should use form expirationDate as pool expiry when poolExpiryDate is not in response', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: 'POOL123', expirationDate: '01-JAN-2026 00:00' });

      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        expiryDate: '2025-06-01T00:00:00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      spyOn(dialogSpy, 'open').and.returnValue({ afterClosed: () => of(true) } as any);
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });

      component.onAddUnit();

      // Should show expiry warning because unit expires before form expiration date
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should pass poolDats in validation request when poolingTime is set', () => {
      component.ngOnInit();
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ poolId: 'POOL123', poolingTime: yesterday });

      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });

      component.onAddUnit();

      const callArgs = serviceSpy.validateUnit.calls.mostRecent().args[1];
      expect(callArgs.poolDats).toBeTruthy();
    });

    it('should not derive componentPrefix for non-ISBT units', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'SHORT',
        productCode: 'E2897V00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      mockComponentUnitIdField('SHORT', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      const callArgs = serviceSpy.validateUnit.calls.mostRecent().args[1];
      expect(callArgs.componentPrefix).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────
  // Additional branch: addUnitToPool using validatedUnit.productCode vs provided
  // ───────────────────────────────────────────────────────────
  describe('addUnitToPool', () => {
    it('should use validatedUnit.productCode when available', () => {
      component.ngOnInit();
      component.unitProducts.set(mockUnitProducts);
      const validatedUnit: UnitValidationResponse = {
        unitId: 'UNIT1',
        productCode: 'E2897V00',
        sldDescription: 'Acceptable',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };

      (component as any).addUnitToPool(validatedUnit, 'DIFFERENT');

      expect(component.unitsInPool().length).toBe(1);
      expect(component.unitsInPool()[0].productCode).toBe('E2897V00');
    });

    it('should fall back to provided productCode when validatedUnit has none', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'UNIT1',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };

      (component as any).addUnitToPool(validatedUnit, 'E2897V00');

      expect(component.unitsInPool().length).toBe(1);
      expect(component.unitsInPool()[0].productCode).toBe('E2897V00');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Additional branches: onVerified request building
  // ───────────────────────────────────────────────────────────
  describe('onVerified request building', () => {
    it('should handle missing numberOfUnits and poolWeight', () => {
      component.ngOnInit();
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      component.poolForm.patchValue({
        poolId: 'POOL123', poolProductCode: 'E2897V00',
        numberOfUnits: '', poolWeight: '', freezeTime: '', poolingTime: '',
      });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      const createArg = serviceSpy.createPool.calls.mostRecent().args[0];
      expect(createArg.numberOfUnits).toBeUndefined();
      expect(createArg.poolWeight).toBeUndefined();

      const commitArg = serviceSpy.commitPool.calls.mostRecent().args[1];
      expect(commitArg.freezeTime).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────
  // getExpectedAboLabel
  // ───────────────────────────────────────────────────────────
  describe('getExpectedAboLabel', () => {
    it('should return label for matching ABO code', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ pooledAboRh: 'OPOS' });
      expect((component as any).getExpectedAboLabel()).toBe('O+');
    });

    it('should return empty string when ABO not set', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ pooledAboRh: '' });
      expect((component as any).getExpectedAboLabel()).toBe('');
    });

    it('should return empty string when ABO not found in validAbo', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ pooledAboRh: 'UNKNOWN' });
      expect((component as any).getExpectedAboLabel()).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // ngOnDestroy
  // ───────────────────────────────────────────────────────────
  describe('ngOnDestroy', () => {
    it('should emit and complete destroy$ subject', () => {
      component.ngOnInit();
      const destroy$ = (component as any).destroy$;
      const nextSpy = spyOn(destroy$, 'next');
      const completeSpy = spyOn(destroy$, 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // headerConfig initial state
  // ───────────────────────────────────────────────────────────
  describe('headerConfig initial state', () => {
    it('should have default breadcrumbs, title, and subtitle', () => {
      expect(component.headerConfig.title).toBe('Prepare Pooled Components');
      expect(component.headerConfig.subtitle).toContain('Create, update and manage');
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
      expect(component.headerConfig.breadcrumbs[1].label).toBe('Prepare Pooled Components');
      expect(component.headerConfig.breadcrumbs[1].link).toBeNull();
    });

    it('should have empty actions array', () => {
      expect(component.headerConfig.actions).toEqual([]);
    });
  });

  // ───────────────────────────────────────────────────────────
  // onCatalogScanBlur catalogOptionJustSelected flag
  // ───────────────────────────────────────────────────────────
  describe('onCatalogScanBlur catalogOptionJustSelected', () => {
    it('should return early and reset flag when catalogOptionJustSelected is true', fakeAsync(() => {
      component.ngOnInit();
      (component as any).catalogOptionJustSelected = true;
      component.poolForm.patchValue({ catalogNumber: 'SOMEVAL' });
      const triggerMock = { panelOpen: false };

      component.onCatalogScanBlur(triggerMock as any);
      tick(100);

      expect((component as any).catalogOptionJustSelected).toBeFalse();
      expect(labelScanSpyObj.validateCatalogScan).not.toHaveBeenCalled();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // onLotScanBlur lotOptionJustSelected flag
  // ───────────────────────────────────────────────────────────
  describe('onLotScanBlur lotOptionJustSelected', () => {
    it('should return early and reset flag when lotOptionJustSelected is true', fakeAsync(() => {
      component.ngOnInit();
      (component as any).lotOptionJustSelected = true;
      component.poolForm.patchValue({ lotNumber: 'SOMEVAL', catalogNumber: 'CAT' });
      const triggerMock = { panelOpen: false };

      component.onLotScanBlur(triggerMock as any);
      tick(100);

      expect((component as any).lotOptionJustSelected).toBeFalse();
      expect(labelScanSpyObj.validateLotScan).not.toHaveBeenCalled();
    }));
  });

  // ───────────────────────────────────────────────────────────
  // validatePoolingTime / validateFreezeTime edge cases
  // ───────────────────────────────────────────────────────────
  describe('validatePoolingTime edge cases', () => {
    it('should return early when parseDateTimeString returns null for non-empty value', () => {
      component.ngOnInit();
      const ctrl = component.poolForm.get('poolingTime');
      // Set value that passes the empty check but does not parse
      ctrl?.setValue('invalid-but-not-empty', { emitEvent: false });
      ctrl?.setErrors(null);

      component.validatePoolingTime();

      expect(ctrl?.hasError('midnightNotAllowed')).toBeFalse();
      expect(ctrl?.hasError('poolingTimeFuture')).toBeFalse();
      expect(ctrl?.hasError('poolingTimeRange')).toBeFalse();
    });
  });

  describe('validateFreezeTime edge cases', () => {
    it('should not set freezeBeforePool when pooling time value exists but does not parse', () => {
      component.ngOnInit();
      const yesterday = moment().subtract(1, 'day');
      const freezeStr = formatMoment(yesterday.clone().hours(14).minutes(0));
      component.poolForm.patchValue({ poolingTime: 'unparseable', freezeTime: freezeStr }, { emitEvent: false });
      component.poolForm.get('poolingTime')?.setErrors(null);
      component.poolForm.get('freezeTime')?.setErrors(null);

      component.validateFreezeTime();

      expect(component.poolForm.get('freezeTime')?.hasError('freezeBeforePool')).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // unitsTableConfig expiryDate formatter edge cases
  // ───────────────────────────────────────────────────────────
  describe('unitsTableConfig expiryDate formatter edge cases', () => {
    it('should return raw value when moment cannot parse the date string', () => {
      const formatter = component.unitsTableConfig.columns.find(c => c.key === 'expiryDate')?.valueFormatter;
      expect(formatter).toBeTruthy();
      const result = formatter!('not-a-valid-date', {} as any);
      expect(result).toBe('not-a-valid-date');
    });
  });

  // ───────────────────────────────────────────────────────────
  // onUnitProductScanBlur additional branches
  // ───────────────────────────────────────────────────────────
  describe('onUnitProductScanBlur additional branches', () => {
    let triggerMock: any;

    beforeEach(() => {
      component.ngOnInit();
      triggerMock = { panelOpen: false };
    });

    it('should set error when scan succeeds but item is not valid', () => {
      component.unitProducts.set(mockUnitProducts);
      component.productLineForm.patchValue({ productCode: '=INVALID' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: false, productCode: null, productDescription: null, entryMode: null },
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.fieldErrors['unitProductCode']).toBe('Invalid product scan');
      expect(component.fieldProcessing['unitProductCode']).toBeFalse();
    });

    it('should use default message when scan fails without message', () => {
      component.unitProducts.set([]);
      component.productLineForm.patchValue({ productCode: 'BADSCAN' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.fieldErrors['unitProductCode']).toBe('Invalid product scan');
    });

    it('should use default error message on HTTP error without details', () => {
      component.unitProducts.set([]);
      component.productLineForm.patchValue({ productCode: 'BADSCAN' });

      labelScanSpyObj.validateProductScan.and.returnValue(throwError(() => ({
        error: {},
      })));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.fieldErrors['unitProductCode']).toBe('Failed to validate product scan.');
    });

    it('should use body.message when errorResponse.error is absent', () => {
      component.unitProducts.set([]);
      component.productLineForm.patchValue({ productCode: 'BADSCAN' });

      labelScanSpyObj.validateProductScan.and.returnValue(throwError(() => ({
        error: { message: 'body message' },
      })));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.fieldErrors['unitProductCode']).toBe('body message');
    });

    it('should clear description and error when scan value is whitespace-only', () => {
      component.productLineForm.patchValue({ productCode: '   ', description: 'Old desc' });
      component.fieldErrors['unitProductCode'] = 'some error';

      component.onUnitProductScanBlur(triggerMock);

      expect(component.fieldErrors['unitProductCode']).toBe('');
      expect(component.productLineForm.get('description')?.value).toBe('');
    });

    it('should use default code scheme I when poolCodeScheme is null', () => {
      component.poolCodeScheme.set(null);
      component.unitProducts.set([]);
      component.productLineForm.patchValue({ productCode: 'SCAN123' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, productCode: 'SCAN123', productDescription: null, entryMode: null },
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      expect(labelScanSpyObj.validateProductScan).toHaveBeenCalledWith('SCAN123', 'I');
    });

    it('should set SLD from matched product sldDescription when scan parses to product in list', () => {
      component.unitProducts.set(mockUnitProducts);
      component.productLineForm.patchValue({ productCode: '=E2897V00' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, productCode: 'E2897V00', productDescription: null, entryMode: null },
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.productLineForm.get('systemLabelDecision')?.value).toBe('Acceptable');
    });

    it('should format expiryDate when matched product has expiryDate via scan', () => {
      component.unitProducts.set(mockUnitProducts);
      component.productLineForm.patchValue({ productCode: '=E2898V00' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, productCode: 'E2898V00', productDescription: null, entryMode: null },
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      const expiryVal = component.productLineForm.get('expirationDate')?.value;
      expect(expiryVal).toContain('01-AUG-2024');
    });

    it('should use systemLabelDecision fallback when sldDescription is absent via scan', () => {
      component.unitProducts.set(mockUnitProducts);
      component.productLineForm.patchValue({ productCode: '=E2898V00' });

      labelScanSpyObj.validateProductScan.and.returnValue(of({
        success: true,
        message: '',
        statusCode: 200,
        errorCode: null,
        item: { isValid: true, productCode: 'E2898V00', productDescription: null, entryMode: null },
        errorResponse: null,
      }));

      component.onUnitProductScanBlur(triggerMock);

      expect(component.productLineForm.get('systemLabelDecision')?.value).toBe('Discard');
    });

    it('should handle matched product with no expiryDate on direct match', () => {
      const productsNoExpiry: UnitProduct[] = [
        { code: 'NOEXP', description: 'No Expiry' },
      ];
      component.unitProducts.set(productsNoExpiry);
      component.productLineForm.patchValue({ productCode: 'NOEXP' });

      component.onUnitProductScanBlur(triggerMock);

      expect(component.productLineForm.get('expirationDate')?.value).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // onPasteNumbers edge cases
  // ───────────────────────────────────────────────────────────
  describe('onPasteNumbers edge cases', () => {
    it('should handle null clipboardData gracefully', () => {
      component.ngOnInit();
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null,
      } as any;

      component.onPasteNumbers(event, 'numberOfUnits');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.poolForm.get('numberOfUnits')?.value).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // onCatalogScanBlur error response branches
  // ───────────────────────────────────────────────────────────
  describe('onCatalogScanBlur error response branches', () => {
    let triggerMock: any;

    beforeEach(() => {
      component.ngOnInit();
      triggerMock = { panelOpen: false };
    });

    it('should use errorResponse.error when available on scan failure', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'BADCAT' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: { error: 'Catalog error from errorResponse' },
      }));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['catalogNumber']).toBe('Catalog error from errorResponse');
    }));

    it('should use errorResponse.error from HTTP error when available', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'BADCAT' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Catalog HTTP errorResponse' } },
      })));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['catalogNumber']).toBe('Catalog HTTP errorResponse');
    }));

    it('should use default message when no error details in HTTP error', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'BADCAT' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(throwError(() => ({
        error: {},
      })));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['catalogNumber']).toBe('Failed to validate catalog scan.');
    }));

    it('should use default message when scan failure has no message or errorResponse', fakeAsync(() => {
      component.poolForm.patchValue({ catalogNumber: 'BADCAT' });

      labelScanSpyObj.validateCatalogScan.and.returnValue(of({
        success: false,
        message: null,
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.onCatalogScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['catalogNumber']).toBe('Invalid catalog number.');
    }));
  });

  // ───────────────────────────────────────────────────────────
  // onLotScanBlur error response branches
  // ───────────────────────────────────────────────────────────
  describe('onLotScanBlur error response branches', () => {
    let triggerMock: any;

    beforeEach(() => {
      component.ngOnInit();
      triggerMock = { panelOpen: false };
    });

    it('should use errorResponse.error when available on scan failure', fakeAsync(() => {
      component.validLots.set([]);
      component.poolForm.patchValue({ lotNumber: 'BADLOT', catalogNumber: '1BATRDSEF1' });

      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: { error: 'Lot error from errorResponse' },
      }));

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['lotNumber']).toBe('Lot error from errorResponse');
    }));

    it('should use body.message from HTTP error when errorResponse.error is absent', fakeAsync(() => {
      component.validLots.set([]);
      component.poolForm.patchValue({ lotNumber: 'BADLOT', catalogNumber: '1BATRDSEF1' });

      labelScanSpyObj.validateLotScan.and.returnValue(throwError(() => ({
        error: { message: 'Lot HTTP message' },
      })));

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['lotNumber']).toBe('Lot HTTP message');
    }));

    it('should use default message when no error details in HTTP error', fakeAsync(() => {
      component.validLots.set([]);
      component.poolForm.patchValue({ lotNumber: 'BADLOT', catalogNumber: '1BATRDSEF1' });

      labelScanSpyObj.validateLotScan.and.returnValue(throwError(() => ({
        error: {},
      })));

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['lotNumber']).toBe('Failed to validate lot scan.');
    }));

    it('should use default message when scan failure has no message or errorResponse', fakeAsync(() => {
      component.validLots.set([]);
      component.poolForm.patchValue({ lotNumber: 'BADLOT', catalogNumber: '1BATRDSEF1' });

      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: false,
        message: null,
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      component.onLotScanBlur(triggerMock);
      tick(100);

      expect(component.fieldErrors['lotNumber']).toBe('Invalid lot number.');
    }));
  });

  // ───────────────────────────────────────────────────────────
  // validateAndSetLotFromCombinedScan error response branches
  // ───────────────────────────────────────────────────────────
  describe('validateAndSetLotFromCombinedScan error response branches', () => {
    it('should use errorResponse.error from failure response when message is empty', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ catalogNumber: 'CAT001' });
      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: false,
        message: '',
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: { error: 'Combined lot errorResponse' },
      }));

      (component as any).validateAndSetLotFromCombinedScan('LOT123');

      expect(component.fieldErrors['lotNumber']).toBe('Combined lot errorResponse');
    });

    it('should use errorResponse.error from HTTP error when available', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ catalogNumber: 'CAT001' });
      labelScanSpyObj.validateLotScan.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Combined lot HTTP errorResponse' } },
      })));

      (component as any).validateAndSetLotFromCombinedScan('LOT123');

      expect(component.fieldErrors['lotNumber']).toBe('Combined lot HTTP errorResponse');
    });

    it('should use default message when HTTP error has no details', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ catalogNumber: 'CAT001' });
      labelScanSpyObj.validateLotScan.and.returnValue(throwError(() => ({
        error: {},
      })));

      (component as any).validateAndSetLotFromCombinedScan('LOT123');

      expect(component.fieldErrors['lotNumber']).toBe('Failed to validate lot from combined scan.');
    });

    it('should use default message when failure response has no message or errorResponse', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ catalogNumber: 'CAT001' });
      labelScanSpyObj.validateLotScan.and.returnValue(of({
        success: false,
        message: null,
        statusCode: 400,
        errorCode: null,
        item: null,
        errorResponse: null,
      }));

      (component as any).validateAndSetLotFromCombinedScan('LOT123');

      expect(component.fieldErrors['lotNumber']).toBe('Lot from combined scan not valid.');
    });
  });

  // ───────────────────────────────────────────────────────────
  // onPoolIdPostValidate additional edge cases
  // ───────────────────────────────────────────────────────────
  describe('onPoolIdPostValidate additional edge cases', () => {
    it('should use default message when pool not found and response has no message', () => {
      component.ngOnInit();
      serviceSpy.getPoolById.and.returnValue(of({ success: true, data: null }));

      const confirmSpy = jasmine.createSpy('confirm');
      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Pool not found. Enter details to create a new pool.', 'Close', jasmine.any(Object),
      );
      expect(confirmSpy).toHaveBeenCalled();
    });

    it('should set catalogSelected to false when pool has no catalogNumber', () => {
      component.ngOnInit();
      const poolNoCatalog = { ...mockPoolHeader, catalogNumber: undefined };
      serviceSpy.getPoolById.and.returnValue(of({
        success: true,
        data: poolNoCatalog,
        attributes: [],
      }));
      serviceSpy.getUnitsInPool.and.returnValue(of([]));

      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);

      expect(component.catalogSelected()).toBeFalse();
    });

    it('should handle response with success false (not just data null)', () => {
      component.ngOnInit();
      serviceSpy.getPoolById.and.returnValue(of({
        success: false,
        data: undefined,
        message: 'Custom error msg',
      }));

      const confirmSpy = jasmine.createSpy('confirm');
      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Custom error msg', 'Close', jasmine.any(Object),
      );
    });

    it('should use default weightRequired and freezeTimeRequired when response does not provide them', () => {
      component.ngOnInit();
      serviceSpy.getPoolById.and.returnValue(of({
        success: true,
        data: mockPoolHeader,
        attributes: [],
      }));
      serviceSpy.getUnitsInPool.and.returnValue(of([]));

      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);

      expect(component.weightRequired()).toBe('N');
      expect(component.freezeTimeRequired()).toBe('N');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Loading signal during operations
  // ───────────────────────────────────────────────────────────
  describe('loading signal during operations', () => {
    it('should set loading to true during removeUnitFromPool service call', () => {
      component.ngOnInit();
      component.currentPool.set(mockPoolHeader);
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.unitsInPool.set([...mockPoolUnits]);

      let capturedLoading = false;
      serviceSpy.removeUnitFromPool.and.callFake(() => {
        capturedLoading = component.loading();
        return of(undefined);
      });

      component.onRowAction({ action: 'delete', row: mockPoolUnits[0] } as any);

      expect(capturedLoading).toBeTrue();
      expect(component.loading()).toBeFalse();
    });

    it('should set loading to true during onVerified', () => {
      component.ngOnInit();
      let capturedLoading = false;
      serviceSpy.createPool.and.callFake(() => {
        capturedLoading = component.loading();
        return of(mockPoolHeader);
      });
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      expect(capturedLoading).toBeTrue();
      expect(component.loading()).toBeFalse();
    });

    it('should set loading to true during onAddUnit validation', () => {
      component.ngOnInit();
      let capturedLoading = false;
      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.callFake(() => {
        capturedLoading = component.loading();
        return of(validatedUnit);
      });
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });

      component.onAddUnit();

      expect(capturedLoading).toBeTrue();
      expect(component.loading()).toBeFalse();
    });
  });

  // ───────────────────────────────────────────────────────────
  // onAddUnit poolDats handling
  // ───────────────────────────────────────────────────────────
  describe('onAddUnit poolDats handling', () => {
    it('should not include poolDats when poolingTime is empty', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123', poolingTime: '' });

      component.onAddUnit();

      const callArgs = serviceSpy.validateUnit.calls.mostRecent().args[1];
      expect(callArgs.poolDats).toBeUndefined();
    });

    it('should not include poolDats when poolingTime does not parse', () => {
      component.ngOnInit();
      const validatedUnit: UnitValidationResponse = {
        unitId: 'NEWUNIT001',
        productCode: 'E2897V00',
        unitInterdictionCount: 0,
        compInterdictionCount: 0,
      };
      serviceSpy.validateUnit.and.returnValue(of(validatedUnit));
      mockComponentUnitIdField('NEWUNIT001', true);
      component.productLineForm.patchValue({ productCode: 'E2897V00' });
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.poolForm.get('poolingTime')?.setValue('unparseable', { emitEvent: false });

      component.onAddUnit();

      const callArgs = serviceSpy.validateUnit.calls.mostRecent().args[1];
      expect(callArgs.poolDats).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────
  // onAttribGroupChange search control reset
  // ───────────────────────────────────────────────────────────
  describe('onAttribGroupChange search control reset', () => {
    it('should reset existing search control when group changes', () => {
      component.ngOnInit();
      serviceSpy.getAttribCodes.and.returnValue(of(mockAttribCodes));
      component.poolForm.patchValue({ poolProductCode: 'E2897V00' });
      component.addAttribute();

      const searchCtrl = component.getAttribCodeSearchControl(0);
      searchCtrl.setValue('some search');

      component.attributes.at(0).patchValue({ attributeGroup: 'CMV' });
      component.onAttribGroupChange(0);

      expect(searchCtrl.value).toBe('');
    });

    it('should not call service when productCode is empty', () => {
      component.ngOnInit();
      serviceSpy.getAttribCodes.calls.reset();
      component.poolForm.patchValue({ poolProductCode: '' });
      component.addAttribute();
      component.attributes.at(0).patchValue({ attributeGroup: 'CMV' });

      component.onAttribGroupChange(0);

      expect(serviceSpy.getAttribCodes).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // sldDescription column formatter edge case
  // ───────────────────────────────────────────────────────────
  describe('sldDescription column formatter additional cases', () => {
    it('should return empty string when both value and row fallbacks are empty', () => {
      const formatter = component.unitsTableConfig.columns.find(c => c.key === 'sldDescription')?.valueFormatter;
      expect(formatter!('', {} as PoolUnit)).toBe('');
    });

    it('should return empty string when both value and systemLabelDecision are undefined', () => {
      const formatter = component.unitsTableConfig.columns.find(c => c.key === 'sldDescription')?.valueFormatter;
      expect(formatter!(undefined as any, { systemLabelDecision: undefined } as any)).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // onRowAction with non-delete action
  // ───────────────────────────────────────────────────────────
  describe('onRowAction with non-delete action', () => {
    it('should not remove unit for unknown actions', () => {
      component.ngOnInit();
      component.poolForm.patchValue({ poolId: 'POOL123' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onRowAction({ action: 'unknown', row: mockPoolUnits[0] } as any);

      expect(component.unitsInPool().length).toBe(1);
    });
  });

  // ───────────────────────────────────────────────────────────
  // onSave date error defensive branch
  // ───────────────────────────────────────────────────────────
  describe('onSave date validation', () => {
    it('should not save when pooling time has future date error', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      spyOn(dialogSpy, 'open');
      setValidPoolForm();
      component.unitsInPool.set(mockPoolUnits);

      const tomorrow = formatMoment(moment().add(1, 'day').hours(10).minutes(0));
      component.poolForm.patchValue({ poolingTime: tomorrow });

      component.onSave();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should not save when pooling time has range error (older than 3 days)', () => {
      component.ngOnInit();
      mockPoolIdFieldValid();
      spyOn(dialogSpy, 'open');
      setValidPoolForm();
      component.unitsInPool.set(mockPoolUnits);

      const fiveDaysAgo = formatMoment(moment().subtract(5, 'days').hours(10).minutes(0));
      component.poolForm.patchValue({ poolingTime: fiveDaysAgo });

      component.onSave();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // handleError additional branches
  // ───────────────────────────────────────────────────────────
  describe('handleError additional branches', () => {
    beforeEach(() => component.ngOnInit());

    it('should use default message for non-object error', () => {
      (component as any).handleError('string error', 'Default');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Default', 'Close', jasmine.any(Object));
    });

    it('should use default message for undefined error', () => {
      (component as any).handleError(undefined, 'Default msg');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Default msg', 'Close', jasmine.any(Object));
    });

    it('should use default message when error has empty nested objects', () => {
      (component as any).handleError({ error: { message: '', errorResponse: { error: '' } } }, 'Default msg');
      expect(snackBarSpy.open).toHaveBeenCalledWith('Default msg', 'Close', jasmine.any(Object));
    });
  });

  // ───────────────────────────────────────────────────────────
  // onVerified with poolingTime and expirationDate formatting
  // ───────────────────────────────────────────────────────────
  describe('onVerified date formatting', () => {
    it('should pass undefined poolDats when poolingTime is empty', () => {
      component.ngOnInit();
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      component.poolForm.patchValue({ poolId: 'POOL123', poolProductCode: 'E2897V00', poolingTime: '' });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      const createArg = serviceSpy.createPool.calls.mostRecent().args[0];
      expect(createArg.poolDats).toBeUndefined();
    });

    it('should pass undefined poolExpiryDats when expirationDate is empty', () => {
      component.ngOnInit();
      serviceSpy.createPool.and.returnValue(of(mockPoolHeader));
      serviceSpy.commitPool.and.returnValue(of({
        poolId: 'POOL123', systemLabelDecision: 'Acceptable', unitCount: 1, interdictionsPlaced: [],
      }));

      component.poolForm.patchValue({
        poolId: 'POOL123', poolProductCode: 'E2897V00',
        expirationDate: '', poolingTime: '',
      });
      component.unitsInPool.set([...mockPoolUnits]);

      component.onVerified({ scannedUnitId: 'POOL123', scannedAbo: 'OPOS', scannedProductCode: 'E2897V00' });

      const createArg = serviceSpy.createPool.calls.mostRecent().args[0];
      expect(createArg.poolExpiryDats).toBeUndefined();
    });
  });

  // ───────────────────────────────────────────────────────────
  // clearAll resets filtered signals to match current lookup data
  // ───────────────────────────────────────────────────────────
  describe('clearAll filtered signals reset', () => {
    it('should reset filtered signals to match current lookup data', () => {
      component.ngOnInit();
      component.filteredProducts.set([]);
      component.filteredCatalogs.set([]);
      component.filteredAbo.set([]);

      component.clearAll();

      expect(component.filteredProducts().length).toBe(mockProducts.length);
      expect(component.filteredCatalogs().length).toBe(mockCatalogs.length);
      expect(component.filteredAbo().length).toBe(mockAbo.length);
    });
  });

  // ───────────────────────────────────────────────────────────
  // poolingTime valueChanges - no freeze time revalidation when freeze is empty
  // ───────────────────────────────────────────────────────────
  describe('poolingTime valueChanges additional cases', () => {
    it('should not revalidate freeze time when freeze time is empty', () => {
      component.ngOnInit();
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ freezeTime: '' });
      component.poolForm.patchValue({ poolingTime: yesterday });

      expect(component.poolForm.get('freezeTime')?.errors).toBeNull();
    });

    it('should not call calculateExpiry when product code is empty', () => {
      component.ngOnInit();
      serviceSpy.calculateExpiry.calls.reset();
      component.poolForm.patchValue({ poolProductCode: '' });
      const yesterday = formatMoment(moment().subtract(1, 'day').hours(10).minutes(30));
      component.poolForm.patchValue({ poolingTime: yesterday });

      expect(serviceSpy.calculateExpiry).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────
  // removeAttribute edge case: delete search controls for removed index
  // ───────────────────────────────────────────────────────────
  describe('removeAttribute search control cleanup', () => {
    it('should clean up attrib code search controls on removal', () => {
      component.ngOnInit();
      component.addAttribute();
      component.addAttribute();

      component.getAttribCodeSearchControl(0);
      component.getAttribCodeSearchControl(1);
      expect(component.attribCodeSearchControls.size).toBe(2);

      component.removeAttribute(0);

      // After removal of index 0, the control for old index 1 should be re-indexed to 0
      expect(component.attribCodeSearchControls.size).toBe(1);
    });

    it('should clean up filtered attrib codes on removal', () => {
      component.ngOnInit();
      component.addAttribute();
      component.addAttribute();

      const filteredMap = new Map<number, AttributeLookup[]>();
      filteredMap.set(0, [{ code: 'A', description: 'A' }]);
      filteredMap.set(1, [{ code: 'B', description: 'B' }]);
      component.filteredAttribCodesByIndex.set(filteredMap);

      component.removeAttribute(0);

      expect(component.filteredAttribCodesByIndex().size).toBe(1);
      expect(component.filteredAttribCodesByIndex().get(0)?.[0].code).toBe('B');
    });
  });

  // ───────────────────────────────────────────────────────────
  // onPoolIdPostValidate attributes loading with attrib codes
  // ───────────────────────────────────────────────────────────
  describe('onPoolIdPostValidate attrib codes loading', () => {
    it('should load attrib codes for each attribute with group and product code', () => {
      component.ngOnInit();
      serviceSpy.getAttribCodes.and.returnValue(of(mockAttribCodes));
      const apiResponse: ApiResponse<PoolHeader> = {
        success: true,
        data: mockPoolHeader,
        attributes: [
          { attribGroup: 'CMV', attribCode: 'CMVN' },
          { attribGroup: 'IRR', attribCode: 'IRRD' },
        ],
      };
      serviceSpy.getPoolById.and.returnValue(of(apiResponse));
      serviceSpy.getUnitsInPool.and.returnValue(of([]));

      const event = {
        data: { parsedUnitId: 'POOL123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onPoolIdPostValidate(event as any);

      expect(component.attributes.length).toBe(2);
      expect(serviceSpy.getAttribCodes).toHaveBeenCalledWith('E2897V00', 'CMV');
      expect(serviceSpy.getAttribCodes).toHaveBeenCalledWith('E2897V00', 'IRR');
    });
  });

  // ───────────────────────────────────────────────────────────
  // formatDateTimeForInput edge case
  // ───────────────────────────────────────────────────────────
  describe('formatDateTimeForInput edge cases', () => {
    it('should handle date string without dashes in formatted output', () => {
      // A date that formats with dashes should split into 3 parts
      const result = (component as any).formatDateTimeForInput('2024-07-14T10:30:00');
      expect(result).toBe('14-JUL-2024 10:30');
    });

    it('should return empty string for empty string input', () => {
      const result = (component as any).formatDateTimeForInput('');
      expect(result).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────
  // Computed signals
  // ───────────────────────────────────────────────────────────
  describe('computed signals initial values', () => {
    it('should have loading initially false', () => {
      expect(component.loading()).toBeFalse();
    });

    it('should have currentPool initially null', () => {
      expect(component.currentPool()).toBeNull();
    });

    it('should have empty unitsInPool initially', () => {
      expect(component.unitsInPool().length).toBe(0);
    });

    it('should have poolCodeScheme initially null', () => {
      expect(component.poolCodeScheme()).toBeNull();
    });

    it('should have productExpiryDate initially null', () => {
      expect(component.productExpiryDate()).toBeNull();
    });

    it('should have weightRequired initially N', () => {
      expect(component.weightRequired()).toBe('N');
    });

    it('should have freezeTimeRequired initially N', () => {
      expect(component.freezeTimeRequired()).toBe('N');
    });

    it('should have catalogSelected initially false', () => {
      expect(component.catalogSelected()).toBeFalse();
    });
  });
});
