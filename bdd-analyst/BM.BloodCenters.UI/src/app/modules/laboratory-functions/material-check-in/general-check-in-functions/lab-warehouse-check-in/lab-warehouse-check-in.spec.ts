import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';

import { LabWarehouseCheckInComponent } from './lab-warehouse-check-in';
import { LabWarehouseCheckInApiService } from './services/lab-warehouse-check-in-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { createMockHeaderService, createMockMatDialog } from '@shared/testing/common-mocks';
import {
  ValidateCheckinUnitResponseDto,
  ValidateCheckinProductResponseDto,
  CheckinResponseDto,
  ProductInfoDto,
  CheckinHistoryItemDto,
} from './models/lab-warehouse-check-in.model';

describe('LabWarehouseCheckInComponent', () => {
  let dialogRefSpy: any;
  let defaultDialogRef: any;
  let dialogSpy: any;
  let pageHeaderServiceSpy: any;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let component: LabWarehouseCheckInComponent;
  let fixture: ComponentFixture<LabWarehouseCheckInComponent>;
  let mockApiService: jasmine.SpyObj<LabWarehouseCheckInApiService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;

  const mockUnitValidationResponseOK: ValidateCheckinUnitResponseDto = {
    status: 'OK',
    collDate: '2025-01-15',
    hasComponents: true,
    batchId: 'BATCH001',
    needsNitb: false,
    products: [
      {
        productCode: 'RBC',
        aliquot: '01',
        productDesc: 'Red Blood Cells',
      },
      {
        productCode: 'FFP',
        aliquot: '02',
        productDesc: 'Fresh Frozen Plasma',
      },
    ],
    warnings: [],
  };

  const mockProductValidationResponseOK: ValidateCheckinProductResponseDto = {
    status: 'OK',
    productDescription: 'Red Blood Cells',
    temperatureOk: true,
    needsCmtInterdiction: false,
    needsNitb: false,
    otherAliquotsPending: true,
    warnings: [],
  };

  const mockCheckinResponse: CheckinResponseDto = {
    success: true,
    batchReconciled: false,
    message: 'Product RBC-01 checked in successfully.',
  };

  const mockHistoryItems: CheckinHistoryItemDto[] = [
    {
      sequence: 1,
      unitId: 'W12345678901-01',
      collDate: '2025-01-15',
      productCode: 'RBC',
      productDesc: 'Red Blood Cells',
    },
  ];

  function createMockEvent(overrides?: Partial<{ parsedUnitId: string; barcodeType: string; manualUnitId: string }>) {
    return {
      data: { parsedUnitId: 'W12345678901', barcodeType: 'CODE128', ...overrides },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };
  }

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('LabWarehouseCheckInApiService', [
      'validateUnit',
      'validateProduct',
      'checkin',
    ]);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Lab Warehouse Check-In');
    chapterChanged$ = new Subject<void>();
    const headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChanged$.asObservable(),
      chapterId: () => 'CH001',
      warehouseId: () => 'H',
      warehouseName: () => 'Home Warehouse',
      chapterTimeZone: () => 'America/Chicago',
    });
    dialogSpy = createMockMatDialog();
    snackbarServiceSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    const labelScanServiceSpy = jasmine.createSpyObj('DonorLibLabelScanService', ['validateProductScan']);

    TestBed.configureTestingModule({
      imports: [
        LabWarehouseCheckInComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: LabWarehouseCheckInApiService, useValue: apiServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanServiceSpy },
      ],
    })
      .overrideComponent(LabWarehouseCheckInComponent, {
        remove: { imports: [MatDialogModule, MatSnackBarModule] },
      });

    mockApiService = TestBed.inject(LabWarehouseCheckInApiService) as jasmine.SpyObj<LabWarehouseCheckInApiService>;
    mockPageHeaderService = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    mockHeaderService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    defaultDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    defaultDialogRef.afterClosed.and.returnValue(of(null));
    mockDialog.open.and.returnValue(defaultDialogRef);

    fixture = TestBed.createComponent(LabWarehouseCheckInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });


  describe('Component Initialization', () => {

    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have temperature field required', () => {
      const temperatureControl = component.filterForm.get('temperature');
      expect(temperatureControl?.hasError('required')).toBe(true);
    });

    it('should initialize warehouse location', () => {
      expect(component.warehouseLocation()).toBe('H - Home Warehouse');
    });

    it('should have productCodeDisabled initially true', () => {
      expect(component.productCodeDisabled()).toBe(true);
    });

    it('should have isLoading initially false', () => {
      expect(component.isLoading()).toBe(false);
    });

    it('should have currentUnitId initially null', () => {
      expect(component.currentUnitId()).toBeNull();
    });

    it('should have collectionDate initially null', () => {
      expect(component.collectionDate()).toBeNull();
    });

    it('should have unitValidation initially null', () => {
      expect(component.unitValidation()).toBeNull();
    });

    it('should have empty productOptions initially', () => {
      expect(component.productOptions().length).toBe(0);
    });

    it('should have empty sessionCheckins initially', () => {
      expect(component.sessionCheckins().length).toBe(0);
    });

    it('should build table config on init', () => {
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.columns.length).toBe(5);
      expect(component.tableConfig.columns[0].key).toBe('sequence');
      expect(component.tableConfig.columns[1].key).toBe('displayUnitId');
      expect(component.tableConfig.columns[2].key).toBe('collDate');
      expect(component.tableConfig.columns[3].key).toBe('productCode');
      expect(component.tableConfig.columns[4].key).toBe('productDesc');
    });

    it('should set default pagination values', () => {
      expect(component.pageSize).toBe(25);
      expect(component.pageIndex).toBe(0);
    });

    it('should set tableConfig pagination options', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(component.tableConfig.pagination?.showFirstLastButtons).toBe(true);
    });

    it('should set default sort config on table', () => {
      expect(component.tableConfig.sortConfig).toEqual({ column: 'sequence', direction: 'A' });
    });

    it('should have productCodeDisabled true initially', () => {
      expect(component.productCodeDisabled()).toBe(true);
    });

    it('should set header breadcrumbs with Home', () => {
      expect(component.headerConfig.breadcrumbs[0]).toEqual({ label: 'Home', link: '/home' });
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject on destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Temperature Field Validation', () => {

    it('should allow numeric input', () => {
      const event = new KeyboardEvent('keypress', { key: '5' });
      const result = component.onlyNumbers(event);

      expect(result).toBe(true);
    });

    it('should allow decimal point', () => {
      const event = new KeyboardEvent('keypress', { key: '.' });
      const result = component.onlyNumbers(event);

      expect(result).toBe(true);
    });

    it('should allow minus sign', () => {
      const event = new KeyboardEvent('keypress', { key: '-' });
      const result = component.onlyNumbers(event);
      expect(result).toBe(true);
    });

    it('should allow Backspace key', () => {
      const event = new KeyboardEvent('keypress', { key: 'Backspace' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Delete key', () => {
      const event = new KeyboardEvent('keypress', { key: 'Delete' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Tab key', () => {
      const event = new KeyboardEvent('keypress', { key: 'Tab' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Escape key', () => {
      const event = new KeyboardEvent('keypress', { key: 'Escape' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Enter key', () => {
      const event = new KeyboardEvent('keypress', { key: 'Enter' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow ArrowLeft key', () => {
      const event = new KeyboardEvent('keypress', { key: 'ArrowLeft' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow ArrowRight key', () => {
      const event = new KeyboardEvent('keypress', { key: 'ArrowRight' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Home key', () => {
      const event = new KeyboardEvent('keypress', { key: 'Home' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow End key', () => {
      const event = new KeyboardEvent('keypress', { key: 'End' });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Ctrl+A', () => {
      const event = new KeyboardEvent('keypress', { key: 'a', ctrlKey: true });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Ctrl+C', () => {
      const event = new KeyboardEvent('keypress', { key: 'c', ctrlKey: true });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Ctrl+V', () => {
      const event = new KeyboardEvent('keypress', { key: 'v', ctrlKey: true });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should allow Ctrl+X', () => {
      const event = new KeyboardEvent('keypress', { key: 'x', ctrlKey: true });
      expect(component.onlyNumbers(event)).toBe(true);
    });

    it('should block alphabetic characters', () => {
      const event = new KeyboardEvent('keypress', { key: 'a' });
      spyOn(event, 'preventDefault');
      const result = component.onlyNumbers(event);
      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block special characters like @', () => {
      const event = new KeyboardEvent('keypress', { key: '@' });
      spyOn(event, 'preventDefault');
      const result = component.onlyNumbers(event);
      expect(result).toBe(false);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block special characters like #', () => {
      const event = new KeyboardEvent('keypress', { key: '#' });
      spyOn(event, 'preventDefault');
      const result = component.onlyNumbers(event);
      expect(result).toBe(false);
    });

    it('should format temperature to 2 decimal places', () => {
      component.filterForm.get('temperature')?.setValue('5');

      component.formatTemperature();

      expect(component.filterForm.get('temperature')?.value).toBe('5.00');
    });

    it('should format negative temperature to 2 decimal places', () => {
      component.filterForm.get('temperature')?.setValue('-3.5');
      component.formatTemperature();
      expect(component.filterForm.get('temperature')?.value).toBe('-3.50');
    });

    it('should not format empty temperature value', () => {
      component.filterForm.get('temperature')?.setValue('');
      component.formatTemperature();
      expect(component.filterForm.get('temperature')?.value).toBe('');
    });

    it('should not format null temperature value', () => {
      component.filterForm.get('temperature')?.setValue(null);
      component.formatTemperature();
      expect(component.filterForm.get('temperature')?.value).toBeNull();
    });

    it('should not format whitespace-only temperature value', () => {
      component.filterForm.get('temperature')?.setValue('   ');
      component.formatTemperature();
      expect(component.filterForm.get('temperature')?.value).toBe('   ');
    });

    it('should handle non-numeric string in temperature gracefully', () => {
      component.filterForm.get('temperature')?.setValue('abc');
      component.formatTemperature();
      expect(component.filterForm.get('temperature')?.value).toBe('abc');
    });

    it('should show error when temperature is not provided', () => {
      const temperatureControl = component.filterForm.get('temperature');
      temperatureControl?.markAsTouched();
      temperatureControl?.setValue(null);

      expect(component.getTemperatureError()).toBe('Temperature is required');
    });

    it('should return empty string for temperature error when not touched', () => {
      const temperatureControl = component.filterForm.get('temperature');
      temperatureControl?.markAsUntouched();
      expect(component.getTemperatureError()).toBe('');
    });

    it('should return empty string for temperature error when value is valid', () => {
      const temperatureControl = component.filterForm.get('temperature');
      temperatureControl?.setValue('4.50');
      temperatureControl?.markAsTouched();
      expect(component.getTemperatureError()).toBe('');
    });
  });

  describe('productCodeDisabled computed', () => {
    it('should return true when unitValidation is null', () => {
      component.unitValidation.set(null);
      expect(component.productCodeDisabled()).toBe(true);
    });

    it('should return false when hasComponents and products exist', () => {
      component.unitValidation.set(mockUnitValidationResponseOK);
      component.productOptions.set(mockUnitValidationResponseOK.products);
      expect(component.productCodeDisabled()).toBe(false);
    });

    it('should return true when hasComponents but no products', () => {
      component.unitValidation.set({ ...mockUnitValidationResponseOK, hasComponents: true });
      component.productOptions.set([]);
      expect(component.productCodeDisabled()).toBe(true);
    });

    it('should return true when not hasComponents even with products', () => {
      component.unitValidation.set({ ...mockUnitValidationResponseOK, hasComponents: false });
      component.productOptions.set(mockUnitValidationResponseOK.products);
      expect(component.productCodeDisabled()).toBe(true);
    });
  });

  describe('Unit Validation - Auto-save Flow', () => {
    it('should not process if already loading', () => {
      const mockEvent = createMockEvent();
      component.isLoading.set(true);

      component.onPostValidate(mockEvent as any);

      expect(mockApiService.validateUnit).not.toHaveBeenCalled();
    });

    it('should set currentUnitId from event', () => {
      const mockEvent = createMockEvent({ parsedUnitId: 'W99999999999' });
      mockApiService.validateUnit.and.returnValue(of(mockUnitValidationResponseOK));
      component.filterForm.get('temperature')?.setValue('4.50');

      component.onPostValidate(mockEvent as any);

      expect(component.currentUnitId()).toBe('W99999999999');
    });

    it('should reset product code on new unit scan', () => {
      component.productOptions.set(mockUnitValidationResponseOK.products);
      component.selectedProduct.set(mockUnitValidationResponseOK.products[0]);

      const mockEvent = createMockEvent();
      mockApiService.validateUnit.and.returnValue(of(mockUnitValidationResponseOK));

      component.onPostValidate(mockEvent as any);

      expect(component.selectedProduct()).toBeNull();
    });

    it('should store pending event', () => {
      const mockEvent = createMockEvent();
      mockApiService.validateUnit.and.returnValue(of(mockUnitValidationResponseOK));

      component.onPostValidate(mockEvent as any);

      expect(component.pendingUnitValidateEvent).toBe(mockEvent as any);
    });

    it('should set isLoading true during validation', () => {
      const mockEvent = createMockEvent();
      const subject = new Subject<ValidateCheckinUnitResponseDto>();
      mockApiService.validateUnit.and.returnValue(subject.asObservable());

      component.onPostValidate(mockEvent as any);

      expect(component.isLoading()).toBe(true);

      subject.next(mockUnitValidationResponseOK);
      subject.complete();
    });

    it('should handle OK status without components (auto-save)', (done) => {
      const mockEvent = createMockEvent();

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };

      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));
      component.filterForm.get('temperature')?.setValue('4.50');

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.confirm).toHaveBeenCalled();
        expect(mockApiService.checkin).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle OK status with components (populate products)', (done) => {
      const mockEvent = createMockEvent();

      mockApiService.validateUnit.and.returnValue(of(mockUnitValidationResponseOK));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.confirm).toHaveBeenCalled();
        expect(component.productOptions().length).toBe(2);
        expect(component.productCodeDisabled()).toBe(false);
        expect(component.collectionDate()).toBe('2025-01-15');
        done();
      }, 100);
    });

    it('should set productCodeDisabled false when hasComponents', (done) => {
      const mockEvent = createMockEvent();
      mockApiService.validateUnit.and.returnValue(of(mockUnitValidationResponseOK));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.productCodeDisabled()).toBe(false);
        done();
      }, 100);
    });

    it('should set collDate from validation response when hasComponents', (done) => {
      const mockEvent = createMockEvent();
      const responseWithDate: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        collDate: '2025-06-20',
        hasComponents: true,
        products: [{ productCode: 'RBC', aliquot: '01', productDesc: 'Red Blood Cells' }],
      };
      mockApiService.validateUnit.and.returnValue(of(responseWithDate));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.collectionDate()).toBe('2025-06-20');
        done();
      }, 100);
    });

    it('should set collDate to null when response has no collDate', (done) => {
      const mockEvent = createMockEvent();
      const responseNoDate: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        collDate: undefined,
        hasComponents: true,
        products: [{ productCode: 'RBC', aliquot: '01', productDesc: 'Red Blood Cells' }],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoDate));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.collectionDate()).toBeNull();
        done();
      }, 100);
    });

    it('should handle ERROR status', (done) => {
      const mockEvent = createMockEvent();

      const errorResponse: ValidateCheckinUnitResponseDto = {
        status: 'ERROR',
        collDate: undefined,
        hasComponents: false,
        batchId: undefined,
        needsNitb: false,
        products: [],
        warnings: [{ code: '0001', message: 'Unit expired' }],
      };

      mockApiService.validateUnit.and.returnValue(of(errorResponse));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Unit expired');
        expect(mockEvent.confirm).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should use default error message when ERROR has no warnings', (done) => {
      const mockEvent = createMockEvent();
      const errorResponse: ValidateCheckinUnitResponseDto = {
        status: 'ERROR',
        collDate: undefined,
        hasComponents: false,
        batchId: undefined,
        needsNitb: false,
        products: [],
        warnings: [],
      };

      mockApiService.validateUnit.and.returnValue(of(errorResponse));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Unit validation failed');
        done();
      }, 100);
    });

    it('should handle WARNING status with dialog - reject override', fakeAsync(() => {
      const mockEvent = createMockEvent();

      const warningResponse: ValidateCheckinUnitResponseDto = {
        status: 'WARNING',
        collDate: '2025-01-15',
        hasComponents: false,
        batchId: 'BATCH001',
        needsNitb: false,
        products: [],
        warnings: [{ code: '0232', message: 'Temperature out of range' }],
      };

      mockApiService.validateUnit.and.returnValue(of(warningResponse));

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: false, codes: [] }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onPostValidate(mockEvent as any);
      tick();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockDialog.open).toHaveBeenCalledWith(
        jasmine.any(Function),
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            title: 'Unit Validation Warnings',
            warnings: warningResponse.warnings,
            allowOverride: true,
          }),
        })
      );
      expect(mockEvent.reject).toHaveBeenCalledWith('Validation canceled');
      expect(mockEvent.confirm).not.toHaveBeenCalled();
    }));

    it('should handle WARNING status with dialog - accept override and retry', fakeAsync(() => {
      const mockEvent = createMockEvent();

      const warningResponse: ValidateCheckinUnitResponseDto = {
        status: 'WARNING',
        collDate: '2025-01-15',
        hasComponents: false,
        batchId: 'BATCH001',
        needsNitb: false,
        products: [],
        warnings: [{ code: '0232', message: 'Temperature out of range' }],
      };

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };

      let callCount = 0;
      mockApiService.validateUnit.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return of(warningResponse);
        }
        return of(responseNoComponents);
      });
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));
      component.filterForm.get('temperature')?.setValue('4.50');

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['0232'] }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onPostValidate(mockEvent as any);
      tick();

      expect(mockApiService.validateUnit).toHaveBeenCalledTimes(2);
      const secondCallArgs = mockApiService.validateUnit.calls.argsFor(1);
      expect(secondCallArgs[0].overrides).toContain('0232');
    }));

    it('should handle WARNING dialog returning null result', fakeAsync(() => {
      const mockEvent = createMockEvent();

      const warningResponse: ValidateCheckinUnitResponseDto = {
        status: 'WARNING',
        collDate: '2025-01-15',
        hasComponents: false,
        batchId: 'BATCH001',
        needsNitb: false,
        products: [],
        warnings: [{ code: '0232', message: 'Temperature out of range' }],
      };

      mockApiService.validateUnit.and.returnValue(of(warningResponse));

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Validation canceled');
    }));

    it('should avoid duplicate overrides when retrying', fakeAsync(() => {
      const mockEvent = createMockEvent();
      component.unitOverrides.set(['0232']);

      const warningResponse: ValidateCheckinUnitResponseDto = {
        status: 'WARNING',
        collDate: '2025-01-15',
        hasComponents: false,
        batchId: 'BATCH001',
        needsNitb: false,
        products: [],
        warnings: [{ code: '0232', message: 'Temperature out of range' }],
      };
      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };

      let callCount = 0;
      mockApiService.validateUnit.and.callFake(() => {
        callCount++;
        if (callCount === 1) return of(warningResponse);
        return of(responseNoComponents);
      });
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));
      component.filterForm.get('temperature')?.setValue('4.50');

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['0232'] }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onPostValidate(mockEvent as any);
      tick();

      expect(mockApiService.validateUnit).toHaveBeenCalledTimes(2);
      const secondCallArgs = mockApiService.validateUnit.calls.argsFor(1);
      const count = secondCallArgs[0].overrides.filter((o: string) => o === '0232').length;
      expect(count).toBe(1);
    }));

    it('should handle validation API error', (done) => {
      const mockEvent = createMockEvent();

      const error = { error: { message: 'Unit not found' } };
      mockApiService.validateUnit.and.returnValue(throwError(() => error));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Unit not found');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should handle validation API error with error.message fallback', (done) => {
      const mockEvent = createMockEvent();
      const error = { message: 'Server error' };
      mockApiService.validateUnit.and.returnValue(throwError(() => error));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Server error');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should use default message when API error has no message', (done) => {
      const mockEvent = createMockEvent();
      const error = {};
      mockApiService.validateUnit.and.returnValue(throwError(() => error));

      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(mockEvent.reject).toHaveBeenCalledWith('Validation failed');
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should pass unitOverrides in validateUnit request', () => {
      const mockEvent = createMockEvent();
      component.unitOverrides.set(['CODE1', 'CODE2']);
      mockApiService.validateUnit.and.returnValue(of(mockUnitValidationResponseOK));

      component.onPostValidate(mockEvent as any);

      expect(mockApiService.validateUnit).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W12345678901',
          overrides: ['CODE1', 'CODE2'],
        })
      );
    });
  });

  describe('Product Selection and Validation', () => {
    beforeEach(() => {
      component.currentUnitId.set('W12345678901');
      component.unitValidation.set(mockUnitValidationResponseOK);
      component.productOptions.set(mockUnitValidationResponseOK.products);
      component.filterForm.get('temperature')?.setValue('4.50');
    });

    it('should validate product when selected via onProductCodeChanged', () => {
      mockApiService.validateProduct.and.returnValue(of(mockProductValidationResponseOK));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });

      expect(mockApiService.validateProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({
          unitId: 'W12345678901',
          productCode: 'RBC',
          aliquot: '01',
          temperature: 4.5,
        })
      );
    });

    it('should store selectedProduct when product code changed', () => {
      mockApiService.validateProduct.and.returnValue(of(mockProductValidationResponseOK));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });

      expect(mockApiService.validateProduct).toHaveBeenCalled();
    });

    it('should not process null option', () => {
      component.onProductCodeChanged(null);

      expect(mockApiService.validateProduct).not.toHaveBeenCalled();
    });

    it('should not process if no currentUnitId', () => {
      component.currentUnitId.set(null);

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });

      expect(mockApiService.validateProduct).not.toHaveBeenCalled();
    });

    it('should show error if no validation data', () => {
      component.unitValidation.set(null);

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Missing validation data. Please scan unit ID again.'
      );
      expect(mockApiService.validateProduct).not.toHaveBeenCalled();
    });

    it('should show error if no temperature value', () => {
      component.filterForm.get('temperature')?.setValue(null);

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Temperature is required. Please enter temperature.'
      );
      expect(mockApiService.validateProduct).not.toHaveBeenCalled();
    });

    it('should pass productOverrides in validateProduct request', () => {
      component.productOverrides.set(['OVR1']);

      mockApiService.validateProduct.and.returnValue(of(mockProductValidationResponseOK));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });

      expect(mockApiService.validateProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({
          overrides: ['OVR1'],
        })
      );
    });

    it('should pass batchId from unit validation in product validate request', () => {
      mockApiService.validateProduct.and.returnValue(of(mockProductValidationResponseOK));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });

      expect(mockApiService.validateProduct).toHaveBeenCalledWith(
        jasmine.objectContaining({
          batchId: 'BATCH001',
        })
      );
    });

    it('should handle product validation API error', () => {
      mockApiService.validateProduct.and.returnValue(throwError(() => new Error('Network error')));

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });

      expect(component.isLoading()).toBe(false);
    });

    it('should handle product WARNING and accept override', fakeAsync(() => {
      const warningResponse: ValidateCheckinProductResponseDto = {
        status: 'WARNING',
        productDescription: 'Red Blood Cells',
        temperatureOk: false,
        needsCmtInterdiction: false,
        needsNitb: false,
        otherAliquotsPending: false,
        warnings: [{ code: 'TEMP01', message: 'Temperature too high' }],
      };

      let callCount = 0;
      mockApiService.validateProduct.and.callFake(() => {
        callCount++;
        if (callCount === 1) return of(warningResponse);
        return of(mockProductValidationResponseOK);
      });
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: true, codes: ['TEMP01'] }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });
      tick();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockApiService.validateProduct).toHaveBeenCalledTimes(2);
      const secondCallArgs = mockApiService.validateProduct.calls.argsFor(1);
      expect(secondCallArgs[0].overrides).toContain('TEMP01');
      expect(mockApiService.checkin).toHaveBeenCalled();
    }));

    it('should handle product WARNING and user does not override', fakeAsync(() => {
      const warningResponse: ValidateCheckinProductResponseDto = {
        status: 'WARNING',
        productDescription: 'Red Blood Cells',
        temperatureOk: false,
        needsCmtInterdiction: false,
        needsNitb: false,
        otherAliquotsPending: false,
        warnings: [{ code: 'TEMP01', message: 'Temperature too high' }],
      };

      mockApiService.validateProduct.and.returnValue(of(warningResponse));

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ override: false, codes: [] }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });
      tick();

      expect(mockApiService.validateProduct).toHaveBeenCalledTimes(1);
      expect(mockApiService.checkin).not.toHaveBeenCalled();
    }));

    it('should auto-save after successful product validation', fakeAsync(() => {
      mockApiService.validateProduct.and.returnValue(of(mockProductValidationResponseOK));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });
      tick();

      expect(mockApiService.checkin).toHaveBeenCalled();
      expect(component.productValidation()).toBeNull();
    }));

    it('should show error when product code not found in options', () => {
      component.onProductCodeChanged({ code: 'UNKNOWN', description: 'Unknown' });

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Product code not found in available products for this unit.'
      );
      expect(mockApiService.validateProduct).not.toHaveBeenCalled();
    });
  });

  describe('performCheckin (through auto-save)', () => {
    beforeEach(() => {
      component.currentUnitId.set('W12345678901');
      component.unitValidation.set(mockUnitValidationResponseOK);
      component.filterForm.get('temperature')?.setValue('4.50');
    });

    it('should not perform checkin if no validation data', () => {
      component.unitValidation.set(null);
      (component as any).performCheckin();
      expect(mockApiService.checkin).not.toHaveBeenCalled();
    });

    it('should include unit overrides in checkin request', (done) => {
      component.unitOverrides.set(['UNIT_OVR']);

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        const checkinCall = mockApiService.checkin.calls.mostRecent();
        expect(checkinCall.args[0].confirmedOverrides).toContain('UNIT_OVR');
        done();
      }, 100);
    });

    it('should show success message with batch reconciled', (done) => {
      const reconciledResponse: CheckinResponseDto = {
        success: true,
        batchReconciled: true,
        message: 'Check-in successful',
      };

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(reconciledResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
          'Check-in successful Batch reconciled.'
        );
        done();
      }, 100);
    });

    it('should show default success message when response has no message', (done) => {
      const noMessageResponse: CheckinResponseDto = {
        success: true,
        batchReconciled: false,
        message: '',
      };

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(noMessageResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
          'Check-in successful'
        );
        done();
      }, 100);
    });

    it('should show error message on checkin failure', (done) => {
      const failureResponse: CheckinResponseDto = {
        success: false,
        batchReconciled: false,
        message: 'Duplicate check-in',
      };

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(failureResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate check-in');
        done();
      }, 100);
    });

    it('should show default error message on checkin failure with no message', (done) => {
      const failureResponse: CheckinResponseDto = {
        success: false,
        batchReconciled: false,
        message: '',
      };

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(failureResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Check-in failed');
        done();
      }, 100);
    });

    it('should handle checkin API error gracefully', (done) => {
      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(throwError(() => new Error('Server error')));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should add to sessionCheckins after successful checkin', (done) => {
      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.sessionCheckins().length).toBe(1);
        expect(component.sessionCheckins()[0].unitId).toBe('W12345678901');
        done();
      }, 100);
    });

    it('should clear entry fields after successful checkin', (done) => {
      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.currentUnitId()).toBeNull();
        expect(component.unitValidation()).toBeNull();
        expect(component.selectedProduct()).toBeNull();
        expect(component.productValidation()).toBeNull();
        expect(component.productOptions().length).toBe(0);
        expect(component.unitOverrides().length).toBe(0);
        expect(component.productOverrides().length).toBe(0);
        expect(component.pendingUnitValidateEvent).toBeNull();
        done();
      }, 100);
    });

    it('should include hasComponents in checkin request', (done) => {
      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        const checkinCall = mockApiService.checkin.calls.mostRecent();
        expect(checkinCall.args[0].hasComponents).toBe(false);
        done();
      }, 100);
    });

    it('should include needsNitb from unit validation in checkin request', (done) => {
      const responseWithNitb: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        needsNitb: true,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseWithNitb));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        const checkinCall = mockApiService.checkin.calls.mostRecent();
        expect(checkinCall.args[0].needsNitb).toBe(true);
        done();
      }, 100);
    });

    it('should handle temperature as undefined when not set', (done) => {
      component.filterForm.get('temperature')?.setValue(null);

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        const checkinCall = mockApiService.checkin.calls.mostRecent();
        expect(checkinCall.args[0].temperature).toBeUndefined();
        done();
      }, 100);
    });
  });

  describe('clearEntryFields (via unitIdField)', () => {
    it('should call unitIdField.clear when unitIdField exists', (done) => {
      component.unitIdField = { clear: jasmine.createSpy('clear') } as any;

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));
      component.filterForm.get('temperature')?.setValue('4.50');

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.unitIdField.clear).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle missing unitIdField gracefully', (done) => {
      (component as any).unitIdField = undefined;

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));
      component.filterForm.get('temperature')?.setValue('4.50');

      const mockEvent = createMockEvent();

      expect(() => component.onPostValidate(mockEvent as any)).not.toThrow();

      setTimeout(() => {
        expect(component.currentUnitId()).toBeNull();
        done();
      }, 200);
    });
  });

  describe('CLEAR ALL Button', () => {
    beforeEach(() => {
      component.filterForm.get('temperature')?.setValue('4.50');
      component.currentUnitId.set('W12345678901');
      component.unitValidation.set(mockUnitValidationResponseOK);
      component.productOptions.set(mockUnitValidationResponseOK.products);
    });

    it('should reset all form fields and state', () => {
      component.clearAll();

      expect(component.filterForm.get('temperature')?.value).toBeNull();
      expect(component.currentUnitId()).toBeNull();
      expect(component.unitValidation()).toBeNull();
      expect(component.productOptions().length).toBe(0);
    });

    it('should reset pageIndex to 0', () => {
      component.pageIndex = 5;
      component.clearAll();
      expect(component.pageIndex).toBe(0);
    });

    it('should clear sessionCheckins', () => {
      component.sessionCheckins.set(mockHistoryItems);
      component.clearAll();
      expect(component.sessionCheckins().length).toBe(0);
    });

    it('should clear selectedProduct', () => {
      component.selectedProduct.set({ productCode: 'RBC', aliquot: '01', productDesc: 'Test' });
      component.clearAll();
      expect(component.selectedProduct()).toBeNull();
    });

    it('should clear productValidation', () => {
      component.productValidation.set(mockProductValidationResponseOK);
      component.clearAll();
      expect(component.productValidation()).toBeNull();
    });

    it('should clear unitOverrides', () => {
      component.unitOverrides.set(['OVR1']);
      component.clearAll();
      expect(component.unitOverrides().length).toBe(0);
    });

    it('should clear productOverrides', () => {
      component.productOverrides.set(['OVR1']);
      component.clearAll();
      expect(component.productOverrides().length).toBe(0);
    });

    it('should clear pendingUnitValidateEvent', () => {
      component.pendingUnitValidateEvent = { data: {} } as any;
      component.clearAll();
      expect(component.pendingUnitValidateEvent).toBeNull();
    });

    it('should update pagination after clearing', () => {
      component.clearAll();
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Chapter Changes', () => {
    it('should clear all on chapter change', () => {
      spyOn(component, 'clearAll');

      chapterChanged$.next();

      expect(component.clearAll).toHaveBeenCalled();
    });
  });

  describe('Date Formatting', () => {
    it('should format date to DD-MON-YYYY uppercase', () => {
      const formatted = component.formatDate('2025-01-15');

      expect(formatted).toBe('15-JAN-2025');
    });

    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('-');
    });

    it('should format Date object', () => {
      const date = new Date(2025, 5, 20);
      const formatted = component.formatDate(date);
      expect(formatted).toBe('20-JUN-2025');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });
  });

  describe('Session Check-in History', () => {
    it('should accumulate session checkins after successful checkins', (done) => {
      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));
      component.filterForm.get('temperature')?.setValue('4.50');

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.sessionCheckins().length).toBe(1);
        expect(component.sessionCheckins()[0].sequence).toBe(1);
        done();
      }, 100);
    });

    it('should update pagination totalRecords after adding to session', (done) => {
      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));
      component.filterForm.get('temperature')?.setValue('4.50');

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.tableConfig.pagination?.totalRecords).toBe(1);
        done();
      }, 100);
    });

    it('should prepend new checkins (newest first)', (done) => {
      component.sessionCheckins.set([{ sequence: 1, unitId: 'OLD' }]);

      const responseNoComponents: ValidateCheckinUnitResponseDto = {
        ...mockUnitValidationResponseOK,
        hasComponents: false,
        products: [],
      };
      mockApiService.validateUnit.and.returnValue(of(responseNoComponents));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));
      component.filterForm.get('temperature')?.setValue('4.50');

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);

      setTimeout(() => {
        expect(component.sessionCheckins().length).toBe(2);
        expect(component.sessionCheckins()[0].unitId).toBe('W12345678901');
        expect(component.sessionCheckins()[1].unitId).toBe('OLD');
        done();
      }, 100);
    });
  });

  describe('Table Pagination', () => {
    it('should update pageIndex and pageSize on page change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 50 });

      expect(component.pageIndex).toBe(2);
      expect(component.pageSize).toBe(50);
    });

    it('should update tableConfig pagination on page change', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 10 });

      expect(component.tableConfig.pagination?.pageIndex).toBe(1);
      expect(component.tableConfig.pagination?.pageSize).toBe(10);
    });
  });

  describe('Table Sorting', () => {
    beforeEach(() => {
      component.sessionCheckins.set([
        {
          sequence: 2,
          unitId: 'W12345678901-02',
          collDate: '2025-01-15',
          productCode: 'FFP',
          productDesc: 'Fresh Frozen Plasma',
        },
        {
          sequence: 1,
          unitId: 'W12345678901-01',
          collDate: '2025-01-15',
          productCode: 'RBC',
          productDesc: 'Red Blood Cells',
        },
      ]);
    });

    it('should sort ascending by sequence', () => {
      component.onSortChange({ column: 'sequence', direction: 'A' });

      expect(component.sessionCheckins()[0].sequence).toBe(1);
      expect(component.sessionCheckins()[1].sequence).toBe(2);
    });

    it('should sort descending by sequence', () => {
      component.onSortChange({ column: 'sequence', direction: 'D' });

      expect(component.sessionCheckins()[0].sequence).toBe(2);
      expect(component.sessionCheckins()[1].sequence).toBe(1);
    });

    it('should not re-sort for default direction', () => {
      component.onSortChange({ column: 'sequence', direction: 'default' });

      expect(component.sessionCheckins()[0].sequence).toBe(2);
    });

    it('should not re-sort when column is empty', () => {
      component.onSortChange({ column: '', direction: 'A' });

      expect(component.sessionCheckins()[0].sequence).toBe(2);
    });

    it('should return 0 for non-sequence column sort', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });

      expect(component.sessionCheckins().length).toBe(2);
    });

    it('should reset pageIndex to 0 on sort change', () => {
      component.pageIndex = 3;
      component.onSortChange({ column: 'sequence', direction: 'A' });

      expect(component.pageIndex).toBe(0);
    });

    it('should update sortConfig in tableConfig on sort change', () => {
      component.onSortChange({ column: 'sequence', direction: 'A' });

      expect(component.tableConfig.sortConfig).toEqual({ column: 'sequence', direction: 'A' });
    });

    it('should update pagination pageIndex to 0 in tableConfig on sort change', () => {
      component.pageIndex = 5;
      component.onSortChange({ column: 'sequence', direction: 'A' });

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('trackBySequence', () => {
    it('should return sequence number from item', () => {
      const item: CheckinHistoryItemDto = {
        sequence: 42,
        unitId: 'W12345678901-01',
        collDate: '2025-01-15',
        productCode: 'RBC',
        productDesc: 'Red Blood Cells',
      };

      expect(component.trackBySequence(0, item)).toBe(42);
    });

    it('should return different values for different items', () => {
      const item1: CheckinHistoryItemDto = { sequence: 1, unitId: 'U1' };
      const item2: CheckinHistoryItemDto = { sequence: 2, unitId: 'U2' };

      expect(component.trackBySequence(0, item1)).not.toBe(component.trackBySequence(1, item2));
    });
  });

  describe('buildTableConfig', () => {
    it('should configure collDate column with valueFormatter', () => {
      const collDateCol = component.tableConfig.columns.find(c => c.key === 'collDate');
      expect(collDateCol).toBeDefined();
      expect(collDateCol!.valueFormatter).toBeDefined();

      const formatted = collDateCol!.valueFormatter!('2025-03-10');
      expect(formatted).toBe('10-MAR-2025');
    });

    it('should set stickyHeader to true', () => {
      expect(component.tableConfig.stickyHeader).toBe(true);
    });

    it('should set emptyMessage', () => {
      expect(component.tableConfig.emptyMessage).toBe('No Check-In History');
    });

    it('should set emptySubMessage', () => {
      expect(component.tableConfig.emptySubMessage).toBe('Check-in history for today will appear here');
    });

    it('should set noDataIcon', () => {
      expect(component.tableConfig.noDataIcon).toBe('history');
    });

    it('should set enableRowHighlight to false', () => {
      expect(component.tableConfig.enableRowHighlight).toBe(false);
    });

    it('should show pagination', () => {
      expect(component.tableConfig.showPagination).toBe(true);
    });

    it('should set sequence column as sortable', () => {
      const seqCol = component.tableConfig.columns.find(c => c.key === 'sequence');
      expect(seqCol?.sortable).toBe(true);
    });

    it('should set displayUnitId column as not sortable', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'displayUnitId');
      expect(col?.sortable).toBe(false);
    });
  });

  describe('Full auto-save flow with components', () => {
    it('should complete the full flow: scan -> validate unit -> select product -> validate product -> checkin', fakeAsync(() => {
      component.filterForm.get('temperature')?.setValue('4.50');

      mockApiService.validateUnit.and.returnValue(of(mockUnitValidationResponseOK));

      const mockEvent = createMockEvent();
      component.onPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.confirm).toHaveBeenCalled();
      expect(component.productOptions().length).toBe(2);

      mockApiService.validateProduct.and.returnValue(of(mockProductValidationResponseOK));
      mockApiService.checkin.and.returnValue(of(mockCheckinResponse));

      component.onProductCodeChanged({ code: 'RBC', description: 'Red Blood Cells' });
      tick();

      expect(mockApiService.checkin).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('checked in successfully')
      );

      expect(component.currentUnitId()).toBeNull();
      expect(component.unitValidation()).toBeNull();
    }));
  });

  describe('onProductCodeCleared', () => {
    it('should reset product-related state', () => {
      component.selectedProduct.set({ productCode: 'RBC', aliquot: '01', productDesc: 'Test' });
      component.productValidation.set(mockProductValidationResponseOK);
      component.productOverrides.set(['OVR1']);

      component.onProductCodeCleared();

      expect(component.selectedProduct()).toBeNull();
      expect(component.productValidation()).toBeNull();
      expect(component.productOverrides().length).toBe(0);
    });
  });
});
