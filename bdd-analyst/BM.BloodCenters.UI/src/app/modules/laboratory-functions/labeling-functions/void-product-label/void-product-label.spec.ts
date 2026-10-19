import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { Component, Input, Output, EventEmitter } from '@angular/core';

import { VoidProductLabelComponent } from './void-product-label';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { VoidProductLabelApiService } from './services/void-product-label-api.service';
import {
  ComponentDetailsDto,
  VoidProductLabelResponseDto,
  OverrideCodeDto,
  ProductCodeDto,
  UnitComponentDto,
} from './models/void-product-label.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { CommentsDialogResult } from './comments-dialog/comments-dialog';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

@Component({
  selector: 'app-unit-id-field',
  standalone: true,
  template: '<input />',
})
class MockUnitIdFieldComponent {
  @Input() validateFfValue = 'N';
  @Input() label = 'Unit ID';
  @Output() validated = new EventEmitter();
  @Output() cleared = new EventEmitter();
  clear(): void {}
  get isValid(): boolean { return false; }
  get parsedUnitId(): string | null { return null; }
}

@Component({
  selector: 'app-page-header-with-breadcrumb',
  standalone: true,
  template: '<div></div>',
})
class MockPageHeaderComponent {
  @Input() config: any;
}

describe('VoidProductLabelComponent', () => {
  let labelScanService: any;
  let headerService: any;
  let dialog: any;
  let apiService: any;
  let component: VoidProductLabelComponent;
  let fixture: ComponentFixture<VoidProductLabelComponent>;
  let apiServiceSpy: jasmine.SpyObj<VoidProductLabelApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockOverrideCodes: OverrideCodeDto[] = [
    { code: 'MDR', description: 'Medical Director Reviewed' },
    { code: 'LAB', description: 'Lab Error' },
  ];

  const mockProductCodes: ProductCodeDto[] = [
    { code: 'E1100', description: 'Product 1' },
  ];

  const mockComponentDetails: ComponentDetailsDto = {
    unitId: 'W1234567890123',
    productCode: 'E1100',
    productDescription: 'Product 1',
    systemLabelDecision: 'A',
    currentLabel: '62',
    testedAbo: 'A',
    testedAboDescription: 'A Pos Regular',
    expiryDate: '2024-07-15T00:00:00Z',
    collDate: '2024-06-01T00:00:00Z',
    rejectReasonCode: null,
    componentPrefix: '00',
    componentPrefixes: ['00'],
  };

  const mockUnitComponents: UnitComponentDto[] = [
    {
      unitId: 'W1234567890123',
      productCode: 'E1100',
      productDescription: 'Product 1',
      currentLabel: '62',
      testedAbo: 'A',
      testedAboDescription: 'A Pos Regular',
      aboDescription: 'A Pos Regular',
      expiryDate: '2024-07-15T00:00:00Z',
      componentStatus: 'L',
    },
  ];

  const mockVoidedResponse: VoidProductLabelResponseDto = {
    unitId: 'W1234567890123',
    productCode: 'E1100',
    componentPrefix: '00',
    oldAboLabel: 'A',
    newAboLabel: 'Mq',
    expiryDate: '2024-07-15T00:00:00Z',
    voidedDate: '2024-06-10T14:30:00Z',
    voidedBy: 'USER001',
    message: 'Product label voided successfully',
  };

  beforeEach(() => {

    apiService = jasmine.createSpyObj('VoidProductLabelApiService', [
      'voidProductLabel',
      'getComponentDetails',
      'getOverrideCodes',
      'getProductCodes',
      'getUnitComponents',
      'search',
    ]);
    apiService.getOverrideCodes.and.returnValue(of(mockOverrideCodes));
    apiService.getProductCodes.and.returnValue(of(mockProductCodes));

    const snackbarService = createMockSnackbarService();
    dialog = createMockMatDialog();
    headerService = createMockHeaderService();
    const pageHeaderService = {
      pageHeaderData: signal(null),
    };

    labelScanService = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateUnitScan',
      'validateUnitAboScan',
      'validateAboScan',
      'validateProductExpdateScan',
      'validateProductScan',
      'validateExpdateScan',
      'validateExpiryScan',
      'validateProductExpiryScan',
      'validateSpTestScan',
      'validateCatalogScan',
      'validateLotScan',
    ]);



      TestBed.configureTestingModule({
      imports: [VoidProductLabelComponent, NoopAnimationsModule],
      providers: [
        { provide: VoidProductLabelApiService, useValue: apiService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: MatDialog, useValue: dialog },
        { provide: HeaderService, useValue: headerService },
        { provide: PageHeaderService, useValue: pageHeaderService },
        { provide: DonorLibLabelScanService, useValue: labelScanService },
      ],
    })
      .overrideComponent(VoidProductLabelComponent, {
        remove: { imports: [UnitIdFieldComponent, PageHeaderWithBreadcrumb] },
        add: { imports: [MockUnitIdFieldComponent, MockPageHeaderComponent] },
      });


    


      apiService.voidProductLabel.calls.reset();


      apiService.getComponentDetails.calls.reset();


      apiService.getOverrideCodes.calls.reset();


      apiService.getProductCodes.calls.reset();


      apiService.getUnitComponents.calls.reset();


      apiService.search.calls.reset();


      dialog.open.calls.reset();


      headerService.getCurrentChapterId.calls.reset();


      headerService.getCurrentWarehouseId.calls.reset();


      labelScanService.validateUnitScan.calls.reset();


      labelScanService.validateUnitAboScan.calls.reset();


      labelScanService.validateAboScan.calls.reset();


      labelScanService.validateProductExpdateScan.calls.reset();


      labelScanService.validateProductScan.calls.reset();


      labelScanService.validateExpdateScan.calls.reset();


      labelScanService.validateExpiryScan.calls.reset();


      labelScanService.validateProductExpiryScan.calls.reset();


      labelScanService.validateSpTestScan.calls.reset();


      labelScanService.validateCatalogScan.calls.reset();


      labelScanService.validateLotScan.calls.reset();


      apiService.getOverrideCodes.and.returnValue(of(mockOverrideCodes));


      apiService.getProductCodes.and.returnValue(of(mockProductCodes));


    apiServiceSpy = TestBed.inject(VoidProductLabelApiService) as jasmine.SpyObj<VoidProductLabelApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    fixture = TestBed.createComponent(VoidProductLabelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {


    it('should load override codes on init', () => {
      expect(apiServiceSpy.getOverrideCodes).toHaveBeenCalled();
      expect(component.overrideCodeOptions().length).toBe(2);
    });



    it('should have required form controls', () => {
      expect(component.form.get('productCode')).toBeTruthy();
      expect(component.form.get('componentPrefix')).toBeTruthy();
      expect(component.form.get('holdReasonCode')).toBeTruthy();
      expect(component.form.get('note')).toBeTruthy();
      expect(component.form.get('expiryDateScan')).toBeTruthy();
    });

    it('should mark note as required (FMB error 0010)', () => {
      expect(component.form.get('note')?.hasError('required')).toBe(true);
    });

    it('should mark holdReasonCode as required', () => {
      expect(component.form.get('holdReasonCode')?.hasError('required')).toBe(true);
    });
  });

  describe('Unit Validation (FMB Steps 1-2)', () => {






    it('should load unit components after unit validation', fakeAsync(() => {
      apiServiceSpy.getUnitComponents.and.returnValue(of(mockUnitComponents));

      component.onUnitValidated({
        parsedUnitId: 'W1234567890123',
        barcodeType: 'CODE128',
        entryMode: 'S',
      } as any);
      tick();

      expect(apiServiceSpy.getUnitComponents).toHaveBeenCalledWith('W1234567890123');
      expect(component.unitComponents().length).toBe(1);
    }));
  });

  describe('Component Prefix (FMB Step 5)', () => {
    beforeEach(fakeAsync(() => {
      apiServiceSpy.getUnitComponents.and.returnValue(of(mockUnitComponents));
      apiServiceSpy.getComponentDetails.and.returnValue(of(mockComponentDetails));
    }));

    it('should auto-derive component prefix for ISBT from last 2 digits of product code', fakeAsync(() => {
      component.onUnitValidated({
        parsedUnitId: 'W1234567890123',
        barcodeType: 'CODE128',
        entryMode: 'S',
      } as any);
      tick();

      // Prefix derives when product code is selected, not during unit validation
      component.onProductCodeSelected('E1100');
      tick();

      expect(component.form.get('componentPrefix')?.value).toBe('00');
    }));

    it('should populate prefix LOV for Codabar', fakeAsync(() => {
      const detailsWithPrefixes: ComponentDetailsDto = {
        ...mockComponentDetails,
        componentPrefixes: ['00', '01', '02'],
      };
      apiServiceSpy.getComponentDetails.and.returnValue(of(detailsWithPrefixes));

      component.onUnitValidated({
        parsedUnitId: 'W1234567890123',
        barcodeType: 'CODABAR',
        entryMode: 'S',
      } as any);
      tick();

      // Prefix LOV populates when product code is selected
      component.onProductCodeSelected('E1100');
      tick();

      expect(component.componentPrefixOptions().length).toBe(3);
    }));
  });

  describe('Unit ID Match Validation (FMB Step 7, error 1508)', () => {
    let labelScanServiceSpy: jasmine.SpyObj<DonorLibLabelScanService>;

    beforeEach(() => {
      labelScanServiceSpy = TestBed.inject(DonorLibLabelScanService) as jasmine.SpyObj<DonorLibLabelScanService>;
    });



    it('should set confirmationScanned on successful scan', fakeAsync(() => {
      labelScanServiceSpy.validateUnitAboScan.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200, errorCode: null, errorResponse: null,
        item: { isValid: true, parsedUnitId: 'W1234567890123', checkDigit: null, manualUnitId: 'W1234567890123', aboCode: 'A', aboLabel: 'A', aboDescription: null, codeScheme: 'I', entryMode: 'S', barcodeType: 'CODE128' },
      } as any));
      component.validatedUnitId.set('W1234567890123');
      component.form.patchValue({ scanUnitQuarantineLabel: 'W1234567890123' });

      component.onScanUnitQuarantineLabel();
      tick();

      expect(component.confirmationScanned()).toBe(true);
    }));
  });

  describe('REPRINT guard (FMB error 5308)', () => {
    it('should allow reprint before confirmation scan', () => {
      component.componentDetails.set(mockComponentDetails);
      component.confirmationScanned.set(false);

      expect(component.canReprint()).toBe(true);
    });

    it('should block reprint after confirmation scan', () => {
      component.componentDetails.set(mockComponentDetails);
      component.confirmationScanned.set(true);

      expect(component.canReprint()).toBe(false);
    });


  });

  describe('Save (FMB Step 13)', () => {
    beforeEach(() => {
      component.validatedUnitId.set('W1234567890123');
      component.unitValidationData.set({ barcodeType: 'CODE128' } as any);
      component.codeScheme.set('I');
      component.componentDetails.set(mockComponentDetails);
      component.form.patchValue({
        productCode: 'E1100',
        componentPrefix: '00',
        scanUnitQuarantineLabel: 'W1234567890123',
        holdReasonCode: 'MDR',
        note: 'Test override note',
      });
      // Set the confirmed parsed unit ID (private signal) - this is set by the scan flow
      (component as any).confirmedParsedUnitId.set('W1234567890123');
    });







    it('should use Mq as ABO label for ISBT', fakeAsync(() => {
      apiServiceSpy.voidProductLabel.and.returnValue(of(mockVoidedResponse));
      apiServiceSpy.getUnitComponents.and.returnValue(of(mockUnitComponents));

      component.onSave();
      tick();

      const request = apiServiceSpy.voidProductLabel.calls.mostRecent().args[0];
      expect(request.aboLabel).toBe('Mq');
    }));

    it('should use 39 as ABO label for Codabar', fakeAsync(() => {
      component.codeScheme.set('C');
      apiServiceSpy.voidProductLabel.and.returnValue(of(mockVoidedResponse));
      apiServiceSpy.getUnitComponents.and.returnValue(of(mockUnitComponents));

      component.onSave();
      tick();

      const request = apiServiceSpy.voidProductLabel.calls.mostRecent().args[0];
      expect(request.aboLabel).toBe('39');
    }));

    it('should send holdReasonCode in request', fakeAsync(() => {
      apiServiceSpy.voidProductLabel.and.returnValue(of(mockVoidedResponse));
      apiServiceSpy.getUnitComponents.and.returnValue(of(mockUnitComponents));

      component.onSave();
      tick();

      const request = apiServiceSpy.voidProductLabel.calls.mostRecent().args[0];
      expect(request.holdReasonCode).toBe('MDR');
    }));



    it('should load labeled components after successful save', fakeAsync(() => {
      apiServiceSpy.voidProductLabel.and.returnValue(of(mockVoidedResponse));
      apiServiceSpy.getUnitComponents.and.returnValue(of(mockUnitComponents));

      component.onSave();
      tick();

      expect(apiServiceSpy.getUnitComponents).toHaveBeenCalledWith('W1234567890123');
    }));
  });

  describe('Clear All', () => {
    it('should reset all state including confirmationScanned', () => {
      component.validatedUnitId.set('W123');
      component.confirmationScanned.set(true);
      component.componentDetails.set(mockComponentDetails);

      component.onClear();

      expect(component.validatedUnitId()).toBeNull();
      expect(component.confirmationScanned()).toBe(false);
      expect(component.componentDetails()).toBeNull();
      expect(component.componentPrefixOptions().length).toBe(0);
    });
  });
  describe('Error Code Handling', () => {
    it('should extract FMB error codes from backend response', fakeAsync(() => {
      component.validatedUnitId.set('W1234567890123');
      component.componentDetails.set(mockComponentDetails);
      component.form.patchValue({
        productCode: 'E1100',
        componentPrefix: '00',
        holdReasonCode: 'MDR',
        note: 'Test',
      });
      (component as any).confirmedParsedUnitId.set('W1234567890123');

      apiServiceSpy.voidProductLabel.and.returnValue(
        throwError(() => ({ error: { errorCode: '1140', message: 'Invalid ABO' } }))
      );

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        jasmine.stringContaining('1140')
      );
    }));
  });
});
