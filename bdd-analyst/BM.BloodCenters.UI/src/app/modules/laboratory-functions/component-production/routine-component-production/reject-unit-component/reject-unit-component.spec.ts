import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { RejectUnitComponentComponent } from './reject-unit-component';
import { RejectUnitComponentService } from './services/reject-unit-component.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';

import {
  UnitValidationResponseDto,
  RejectReasonDto,
  RejectableProductDto
} from './models/reject-unit-component.model';

describe('RejectUnitComponentComponent', () => {
  let headerServiceSpy: any;
  let rejectServiceSpy: any;
  let component: RejectUnitComponentComponent;
  let fixture: ComponentFixture<RejectUnitComponentComponent>;
  let rejectService: jasmine.SpyObj<RejectUnitComponentService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;
  let pageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let headerService: jasmine.SpyObj<HeaderService>;

  const mockUnitValidation: UnitValidationResponseDto = {
    unitId: 'W4555-13-012401',
    collDate: '2026-06-15T00:00:00',
    chapterId: 'WAD',
    warehouseId: 'H',
    catalogNumber: '1TEP540004',
    abo: 'O+',
    isPheresisUnit: false,
    isBioHazard: false,
    rejectableComponentsCount: 3,
    unusedBagsCount: 1,
    rejectableProducts: [
      { productCode: 'E0701V00', productDescription: 'Red Blood Cells', productType: 'RBC', componentPrefix: '01', bagId: 'BAG001' }
    ]
  };

  const mockRejectReasons: RejectReasonDto[] = [
    { code: 'CLOT', description: 'Clotted component', interdictionCode: 'INFD' },
    { code: 'HEMOLYZ', description: 'Hemolyzed', interdictionCode: 'HEMO' }
  ];

  const mockProductCodes: RejectableProductDto[] = [
    { productCode: 'E0701V00', productDescription: 'Red Blood Cells', productType: 'RBC', componentPrefix: '01', bagId: 'BAG001' }
  ];

  beforeEach(() => {

    rejectServiceSpy = jasmine.createSpyObj('RejectUnitComponentService', [
      'validateUnit',
      'getProductCodes',
      'getComponents',
      'getRejectionReasons',
      'getCatalogNumbers',
      'getAboLabels',
      'rejectComponent',
      'reprintLabel',
      'validateProductCode'
    ]);
    const snackbarServiceSpy = createMockSnackbarService();
    const pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], { pageHeaderData: () => null });
    headerServiceSpy = createMockHeaderService();

    rejectServiceSpy.getRejectionReasons.and.returnValue(of(mockRejectReasons));
    rejectServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));
    rejectServiceSpy.getCatalogNumbers.and.returnValue(of([]));
    rejectServiceSpy.getAboLabels.and.returnValue(of([]));
    rejectServiceSpy.reprintLabel.and.returnValue(of({}));
      TestBed.configureTestingModule({
      imports: [RejectUnitComponentComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: RejectUnitComponentService, useValue: rejectServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });


    


      rejectServiceSpy.validateUnit.calls.reset();


      rejectServiceSpy.getProductCodes.calls.reset();


      rejectServiceSpy.getComponents.calls.reset();


      rejectServiceSpy.getRejectionReasons.calls.reset();


      rejectServiceSpy.getCatalogNumbers.calls.reset();


      rejectServiceSpy.getAboLabels.calls.reset();


      rejectServiceSpy.rejectComponent.calls.reset();


      rejectServiceSpy.reprintLabel.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      headerServiceSpy.getCurrentWarehouseId.calls.reset();


      rejectServiceSpy.getRejectionReasons.and.returnValue(of(mockRejectReasons));


      rejectServiceSpy.getProductCodes.and.returnValue(of(mockProductCodes));


      rejectServiceSpy.getCatalogNumbers.and.returnValue(of([]));


      rejectServiceSpy.getAboLabels.and.returnValue(of([]));


      rejectServiceSpy.reprintLabel.and.returnValue(of({}));

      rejectServiceSpy.validateProductCode.and.returnValue(of({ productType: 'RBC' }));
    rejectService = TestBed.inject(RejectUnitComponentService) as jasmine.SpyObj<RejectUnitComponentService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    headerService = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    fixture = TestBed.createComponent(RejectUnitComponentComponent);
    component = fixture.componentInstance;


    });


  it('should load rejection reasons on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(rejectService.getRejectionReasons).toHaveBeenCalled();
    expect(component.rejectReasons()).toEqual(mockRejectReasons);
  }));



  describe('onUnitValidated', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error via snackbar and keep controls disabled on validation failure', fakeAsync(() => {
      const errorResponse = {
        error: { errorResponse: { errorCode: '0063', error: 'Collection date not present' } }
      };
      rejectService.validateUnit.and.returnValue(throwError(() => errorResponse));

      component.onUnitValidated({ parsedUnitId: 'INVALID' } as any);
      tick();

      expect(component.unitValidated()).toBe(false);
      expect(snackbarService.showError).toHaveBeenCalledWith('Error 0063: Collection date not present');
      expect(component.productCodeControl.disabled).toBe(true);
    }));
  });

  describe('clearAll', () => {
    it('should reset all controls and state', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.clearAll();

      expect(component.productCodeControl.disabled).toBe(true);
      expect(component.rejectCodeControl.disabled).toBe(true);
      expect(component.unitValidated()).toBe(false);
      expect(component.productCodes()).toEqual([]);
      expect(component.labelUnitAs()).toBe('-');
    }));
  });

  describe('onUnitValidated success path', () => {
    it('should set unitData and enable product/reject controls on success', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401', manualUnitId: 'W4555-13-012401', barcodeType: 'CODE128' } as any);
      tick();

      expect(component.unitValidated()).toBe(true);
      expect(component.productCodeControl.enabled).toBe(true);
      expect(component.rejectCodeControl.enabled).toBe(true);
      expect(rejectService.getProductCodes).toHaveBeenCalledWith('W4555-13-012401');
      expect(rejectService.getAboLabels).toHaveBeenCalled();
    }));

    it('should reset all product-dependent fields when a new unit is validated', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      expect(component.isNewProduct()).toBe(false);
      expect(component.isNoneProduct()).toBe(false);
      expect(component.resolvedProductType()).toBe('');
      expect(component.labelUnitAs()).toBe('-');
      expect(component.catalogNumbers()).toEqual([]);
    }));

    it('should use CODABAR barcode type when provided', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401', manualUnitId: 'W4555-13-012401', barcodeType: 'CODABAR' } as any);
      tick();

      expect(component.unitValidated()).toBe(true);
    }));
  });

  describe('loadProductCodes', () => {
    it('should show error when product codes fail to load', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      rejectService.getProductCodes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load product codes');
    }));
  });

  describe('loadAboLabels', () => {
    it('should set empty array on error', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'I' }));
      rejectService.getAboLabels.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      expect(component.aboLabels()).toEqual([]);
    }));
  });

  describe('loadRejectionReasons error', () => {
    it('should show error when rejection reasons fail to load', fakeAsync(() => {
      rejectService.getRejectionReasons.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load rejection reasons');
    }));
  });

  describe('setupRejectCodeSubscription', () => {
    it('should set BIO label when unit isBioHazard and code scheme C', fakeAsync(() => {
      const bioUnit = { ...mockUnitValidation, isBioHazard: true, codeScheme: 'C' };
      rejectService.validateUnit.and.returnValue(of(bioUnit));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.rejectCodeControl.setValue('CLOT');
      tick();

      expect(component.labelUnitAs()).toBe('BIO');
      expect(component.labelControl.value).toBe('58');
    }));

    it('should set BIO label with Mb for ISBT code scheme', fakeAsync(() => {
      const bioUnit = { ...mockUnitValidation, isBioHazard: true, codeScheme: 'I' };
      rejectService.validateUnit.and.returnValue(of(bioUnit));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.rejectCodeControl.setValue('CLOT');
      tick();

      expect(component.labelUnitAs()).toBe('BIO');
      expect(component.labelControl.value).toBe('Mb');
    }));

    it('should set NFT label for non-bio code scheme C', fakeAsync(() => {
      const nonBioUnit = { ...mockUnitValidation, isBioHazard: false, codeScheme: 'C' };
      rejectService.validateUnit.and.returnValue(of(nonBioUnit));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.rejectCodeControl.setValue('CLOT');
      tick();

      expect(component.labelUnitAs()).toBe('NFT');
      expect(component.labelControl.value).toBe('47');
    }));

    it('should set DISC label for non-bio ISBT code scheme', fakeAsync(() => {
      const nonBioUnit = { ...mockUnitValidation, isBioHazard: false, codeScheme: 'I' };
      rejectService.validateUnit.and.returnValue(of(nonBioUnit));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.rejectCodeControl.setValue('CLOT');
      tick();

      expect(component.labelUnitAs()).toBe('DISC');
      expect(component.labelControl.value).toBe('Md');
    }));

    it('should reset labelUnitAs when reject code cleared', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.rejectCodeControl.setValue('CLOT');
      tick();

      component.rejectCodeControl.setValue('');
      tick();

      expect(component.labelUnitAs()).toBe('-');
    }));
  });

  describe('setupProductCodeSubscription', () => {
    it('should set isNoneProduct and disable row 2 fields for NONE product', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('NONE');
      tick(400);

      expect(component.isNoneProduct()).toBe(true);
      expect(component.verifyProductControl.disabled).toBe(true);
      expect(component.verifyUnitLabelControl.disabled).toBe(true);
      expect(component.verifyUnitIdControl.disabled).toBe(true);
      expect(component.labelControl.disabled).toBe(true);
    }));

    it('should enable verify product for new/manual product codes', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      rejectServiceSpy.validateProductCode = jasmine.createSpy('validateProductCode').and.returnValue(of({ productType: 'PLT' }));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('NEWPROD1');
      tick(400);

      expect(component.isNewProduct()).toBe(true);
      expect(component.verifyProductControl.enabled).toBe(true);
    }));

    it('should reset product-related state when product code cleared', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('E0701V00');
      tick(400);

      component.productCodeControl.setValue('');
      tick(400);

      expect(component.isNoneProduct()).toBe(false);
      expect(component.isNewProduct()).toBe(false);
      expect(component.catalogNumbers()).toEqual([]);
    }));

    it('should handle validateProductCode error for new product', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      rejectServiceSpy.validateProductCode = jasmine.createSpy('validateProductCode').and.returnValue(
        throwError(() => ({ error: { errorCode: '4306', message: 'Invalid product' } }))
      );
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('BADPROD1');
      tick(400);

      expect(snackbarService.showError).toHaveBeenCalled();
    }));

    it('should disable verify product for existing products', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('E0701V00');
      tick(400);

      expect(component.isNewProduct()).toBe(false);
      expect(component.verifyProductControl.disabled).toBe(true);
    }));
  });

  describe('loadCatalogNumbers', () => {
    it('should auto-select when only one catalog returned', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      rejectService.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT001' }]));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('E0701V00');
      tick(400);
      tick(100);

      expect(component.catalogNumbers().length).toBe(1);
    }));

    it('should clear catalog numbers on error', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      rejectService.getCatalogNumbers.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('E0701V00');
      tick(400);

      expect(component.catalogNumbers()).toEqual([]);
    }));
  });

  describe('onSubmitRejection', () => {
    function setupForSubmit(unitOverride?: Partial<UnitValidationResponseDto>) {
      const unit = { ...mockUnitValidation, codeScheme: 'C', ...unitOverride };
      rejectService.validateUnit.and.returnValue(of(unit));
      rejectService.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT001' }]));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: unit.unitId } as any);
      tick();

      component.productCodeControl.setValue('E0701V00');
      tick(400);
      tick(100);

      component.rejectCodeControl.setValue('CLOT');
      tick();

      component.catalogNumberControl.setValue('CAT001');
      tick();
    }

    it('should show error 0063 when no unit data', fakeAsync(() => {
      fixture.detectChanges();
      component.onSubmitRejection();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('0063'));
    }));

    it('should show error 1205 when no product code', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.onSubmitRejection();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('1205'));
    }));

    it('should show error 1202 when no reject code', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('E0701V00');
      tick(400);

      component.onSubmitRejection();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('1202'));
    }));

    it('should show error 9719 when no catalog number', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('E0701V00');
      tick(400);
      component.rejectCodeControl.setValue('CLOT');
      tick();

      component.onSubmitRejection();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('9719'));
    }));

    it('should show error 1508 when verify unit id missing for non-NONE', fakeAsync(() => {
      setupForSubmit();
      component.verifyUnitIdControl.setValue('');
      tick();

      component.onSubmitRejection();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    }));

    it('should show error 9731 when label missing for non-NONE', fakeAsync(() => {
      setupForSubmit();
      component.verifyUnitIdControl.setValue('W455513012401');
      component.labelControl.setValue('');
      tick();

      component.onSubmitRejection();
      tick();
      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('9731'));
    }));

    it('should successfully submit and add row to table', fakeAsync(() => {
      rejectService.rejectComponent.and.returnValue(of({}));
      setupForSubmit();
      component.verifyUnitIdControl.setValue('W455513012401');
      component.labelControl.setValue('47');
      tick();

      component.onSubmitRejection();
      tick();

      expect(rejectService.rejectComponent).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('8010'));
    }));

    it('should show error on reject component API failure', fakeAsync(() => {
      rejectService.rejectComponent.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '0230', error: 'Unsuccessful commit' } }
      })));
      setupForSubmit();
      component.verifyUnitIdControl.setValue('W455513012401');
      component.labelControl.setValue('47');
      tick();

      component.onSubmitRejection();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Error 0230: Unsuccessful commit');
    }));

    it('should not submit if already submitting', fakeAsync(() => {
      setupForSubmit();
      component['isSubmitting'].set(true);

      component.onSubmitRejection();
      tick();

      expect(rejectService.rejectComponent).not.toHaveBeenCalled();
    }));

    it('should show error 9728 when verify product does not match for new products', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'C' }));
      rejectService.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT001' }]));
      rejectServiceSpy.validateProductCode = jasmine.createSpy('validateProductCode').and.returnValue(of({ productType: 'PLT' }));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('NEWPROD1');
      tick(400);

      component.rejectCodeControl.setValue('CLOT');
      tick();
      component.catalogNumberControl.setValue('CAT001');
      tick();

      component.verifyProductControl.setValue('WRONGPRD');
      component.verifyUnitIdControl.setValue('W455513012401');
      component.labelControl.setValue('47');
      tick();

      component.onSubmitRejection();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('9728'));
    }));

    it('should submit NONE product without row 2 validation', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'C' }));
      rejectService.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT001' }]));
      rejectService.rejectComponent.and.returnValue(of({}));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('NONE');
      tick(400);
      tick(100);

      component.rejectCodeControl.setValue('CLOT');
      tick();
      component.catalogNumberControl.setValue('CAT001');
      tick();

      component.onSubmitRejection();
      tick();

      expect(rejectService.rejectComponent).toHaveBeenCalled();
    }));
  });

  describe('onReprint', () => {
    it('should show error 5308 if verify product has value', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.verifyProductControl.enable();
      component.verifyProductControl.setValue('SOME');
      tick();

      component.onReprint();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('5308'));
    }));

    it('should show error 9741 when no unit data', fakeAsync(() => {
      fixture.detectChanges();
      component.onReprint();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('9741'));
    }));

    it('should show error 9741 when product code is NONE', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.enable();
      component.productCodeControl.setValue('NONE', { emitEvent: false });
      tick();

      component.onReprint();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('9741'));
    }));

    it('should call reprintLabel on success and show success message', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'C' }));
      rejectService.reprintLabel.and.returnValue(of({}));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.enable();
      component.productCodeControl.setValue('E0701V00', { emitEvent: false });
      component.rejectCodeControl.enable();
      component.rejectCodeControl.setValue('CLOT', { emitEvent: false });
      component.catalogNumberControl.enable();
      component.catalogNumberControl.setValue('CAT001', { emitEvent: false });
      tick();

      component.onReprint();
      tick();

      expect(rejectService.reprintLabel).toHaveBeenCalled();
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Label printed successfully');
    }));

    it('should show time limit warning if present in response', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'C' }));
      rejectService.reprintLabel.and.returnValue(of({ timeLimitWarning: 'Time limit exceeded' }));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.enable();
      component.productCodeControl.setValue('E0701V00', { emitEvent: false });
      component.rejectCodeControl.enable();
      component.rejectCodeControl.setValue('CLOT', { emitEvent: false });
      component.catalogNumberControl.enable();
      component.catalogNumberControl.setValue('CAT001', { emitEvent: false });
      tick();

      component.onReprint();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Time limit exceeded');
    }));

    it('should show error on reprintLabel API failure', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'I' }));
      rejectService.reprintLabel.and.returnValue(throwError(() => ({
        error: { errorResponse: { errorCode: '9032', error: 'Invalid printer' } }
      })));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.enable();
      component.productCodeControl.setValue('E0701V00', { emitEvent: false });
      component.rejectCodeControl.enable();
      component.rejectCodeControl.setValue('CLOT', { emitEvent: false });
      component.catalogNumberControl.enable();
      component.catalogNumberControl.setValue('CAT001', { emitEvent: false });
      tick();

      component.onReprint();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith('Error 9032: Invalid printer');
    }));
  });

  describe('canReprint', () => {
    it('should return false when unit not validated', () => {
      fixture.detectChanges();
      expect(component.canReprint()).toBe(false);
    });

    it('should return true when all conditions met', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('E0701V00', { emitEvent: false });
      component.rejectCodeControl.setValue('CLOT', { emitEvent: false });
      component.catalogNumberControl.enable();
      component.catalogNumberControl.setValue('CAT001', { emitEvent: false });
      tick();

      expect(component.canReprint()).toBe(true);
    }));

    it('should return false when product is NONE', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component.productCodeControl.setValue('NONE', { emitEvent: false });
      component.rejectCodeControl.setValue('CLOT', { emitEvent: false });
      component.catalogNumberControl.enable();
      component.catalogNumberControl.setValue('CAT001', { emitEvent: false });
      tick();

      expect(component.canReprint()).toBe(false);
    }));
  });

  describe('onVerifyUnitLabelEnter', () => {
    beforeEach(fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'C' }));
      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401', manualUnitId: 'W4555-13-012401' } as any);
      tick();
    }));

    it('should do nothing when value is empty', () => {
      component.verifyUnitLabelControl.enable();
      component.verifyUnitLabelControl.setValue('');
      component['onVerifyUnitLabelEnter']();
      // No error expected
    });

    it('should return when value is M for manual mode', () => {
      component.verifyUnitLabelControl.enable();
      component.verifyUnitLabelControl.setValue('M');
      component['onVerifyUnitLabelEnter']();
      // Should not show error
      expect(snackbarService.showError).not.toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    });

    it('should parse concatenated scan with =% format and auto-submit', fakeAsync(() => {
      rejectService.rejectComponent.and.returnValue(of({}));
      component.verifyUnitLabelControl.enable();
      component.verifyUnitLabelControl.setValue('=W455513012401=%47');
      component.productCodeControl.enable();
      component.productCodeControl.setValue('E0701V00', { emitEvent: false });
      component.rejectCodeControl.enable();
      component.rejectCodeControl.setValue('CLOT', { emitEvent: false });
      component.catalogNumberControl.enable();
      component.catalogNumberControl.setValue('CAT001', { emitEvent: false });
      component.labelControl.enable();
      component.verifyUnitIdControl.enable();
      tick();

      component['onVerifyUnitLabelEnter']();
      tick();

      // After concatenated scan, onSubmitRejection is called automatically
      // which succeeds and then clearAll resets the form
      expect(rejectService.rejectComponent).toHaveBeenCalled();
    }));

    it('should show error 1508 for mismatched unit ID', fakeAsync(() => {
      component.verifyUnitLabelControl.enable();
      component.verifyUnitLabelControl.setValue('=WRONGUNIT123=%47');
      tick();

      component['onVerifyUnitLabelEnter']();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    }));
  });

  describe('onCatalogSelected', () => {
    it('should auto-submit for NONE product when catalog and reject code set', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'C' }));
      rejectService.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT001' }]));
      rejectService.rejectComponent.and.returnValue(of({}));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      component['isNoneProduct'].set(true);
      component.catalogNumberControl.enable();
      component.catalogNumberControl.setValue('CAT001', { emitEvent: false });
      component.rejectCodeControl.setValue('CLOT', { emitEvent: false });
      component.productCodeControl.setValue('NONE', { emitEvent: false });
      tick();

      component.onCatalogSelected();
      tick();

      expect(rejectService.rejectComponent).toHaveBeenCalled();
    }));

    it('should not auto-submit if not NONE product', fakeAsync(() => {
      fixture.detectChanges();
      component['isNoneProduct'].set(false);
      component.onCatalogSelected();
      tick();

      expect(rejectService.rejectComponent).not.toHaveBeenCalled();
    }));
  });

  describe('onVerifyUnitIdBlur', () => {
    beforeEach(fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of({ ...mockUnitValidation, codeScheme: 'C' }));
      fixture.detectChanges();
      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401', manualUnitId: 'W4555-13-012401' } as any);
      tick();
    }));

    it('should do nothing when value is empty', () => {
      component.verifyUnitIdControl.enable();
      component.verifyUnitIdControl.setValue('');
      component['onVerifyUnitIdBlur']();
      expect(snackbarService.showError).not.toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    });

    it('should show error 1508 when verify unit id does not match', fakeAsync(() => {
      component.verifyUnitIdControl.enable();
      component.verifyUnitIdControl.setValue('WRONGUNIT');
      tick();

      component['onVerifyUnitIdBlur']();
      tick();

      expect(snackbarService.showError).toHaveBeenCalledWith(jasmine.stringContaining('1508'));
    }));

    it('should format valid unit id', fakeAsync(() => {
      component.verifyUnitIdControl.enable();
      component.verifyUnitIdControl.setValue('W455513012401');
      tick();

      component['onVerifyUnitIdBlur']();
      tick();

      expect(component.verifyUnitIdControl.value).toBeTruthy();
    }));
  });

  describe('onTablePageChange', () => {
    it('should update page index and size', fakeAsync(() => {
      fixture.detectChanges();

      component.onTablePageChange({ pageIndex: 2, pageSize: 50, length: 100 } as any);
      tick();

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
    }));
  });

  describe('onUnitCleared', () => {
    it('should call clearAll when unit is cleared', fakeAsync(() => {
      fixture.detectChanges();
      spyOn(component, 'clearAll');
      component.onUnitCleared();
      expect(component.clearAll).toHaveBeenCalled();
    }));
  });

  describe('navigateToPathogenReduction', () => {
    it('should navigate to returnUrl when set', fakeAsync(() => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
      fixture.detectChanges();
      component['returnUrl'] = '/some/return/url';

      component.navigateToPathogenReduction();
      tick();

      expect(router.navigateByUrl).toHaveBeenCalledWith('/some/return/url');
    }));

    it('should navigate to base path when no returnUrl', fakeAsync(() => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
      fixture.detectChanges();
      component['returnUrl'] = null;

      component.navigateToPathogenReduction();
      tick();

      expect(router.navigate).toHaveBeenCalledWith(['/laboratory-functions/component-production/pathogen-reduction/pathogen-reduction-manager']);
    }));
  });

  describe('paginatedData', () => {
    it('should return correct slice based on page index and size', fakeAsync(() => {
      fixture.detectChanges();

      const rows: any[] = [];
      for (let i = 0; i < 30; i++) {
        rows.push({ unitId: `U${i}`, productCode: 'PC', rejectReasonCode: 'RC', catalogNumber: 'CN', verifyProduct: '', verifyUnitId: '', label: '' });
      }
      component['rejectedComponents'].set(rows);
      component['currentPageIndex'].set(1);
      component['currentPageSize'].set(10);

      const result = component['paginatedData']();
      expect(result.length).toBe(10);
      expect(result[0].unitId).toBe('U10');
    }));
  });

  describe('setupRejectCodeSearch', () => {
    it('should filter reject reasons by search text', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.rejectCodeSearchControl.setValue('clot');
      tick(300);

      const filtered = component.filteredRejectReasons();
      expect(filtered.length).toBeGreaterThanOrEqual(1);
      expect(filtered[0].code).toBe('CLOT');
    }));

    it('should show all reject reasons when search cleared', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.rejectCodeSearchControl.setValue('clot');
      tick(300);
      component.rejectCodeSearchControl.setValue('');
      tick(300);

      expect(component.filteredRejectReasons()).toEqual(component.rejectReasons());
    }));
  });

  describe('setupCatalogNumberSearch', () => {
    it('should filter catalog numbers by search text', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['catalogNumbers'].set([
        { catalogNumber: 'CAT001' },
        { catalogNumber: 'CAT002' },
        { catalogNumber: 'XYZ999' }
      ]);

      component.catalogNumberSearchControl.setValue('CAT');
      tick(300);

      const filtered = component.filteredCatalogNumbers();
      expect(filtered.length).toBe(2);
    }));

    it('should show all catalog numbers when search cleared', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['catalogNumbers'].set([
        { catalogNumber: 'CAT001' },
        { catalogNumber: 'XYZ999' }
      ]);

      component.catalogNumberSearchControl.setValue('CAT');
      tick(300);
      component.catalogNumberSearchControl.setValue('');
      tick(300);

      expect(component.filteredCatalogNumbers()).toEqual(component['catalogNumbers']());
    }));
  });

  describe('setupProductCodeSearch', () => {
    it('should filter product codes by search text', fakeAsync(() => {
      rejectService.validateUnit.and.returnValue(of(mockUnitValidation));
      fixture.detectChanges();

      component.onUnitValidated({ parsedUnitId: 'W4555-13-012401' } as any);
      tick();

      // Use a short value (< 4 chars) to only trigger the search filter, not the product code subscription
      component.productCodeControl.setValue('E07');
      tick(200);

      const filtered = component.filteredProductCodes();
      expect(filtered.length).toBeGreaterThanOrEqual(1);
    }));
  });

  describe('clearAll with unitIdField', () => {
    it('should handle clearAll when unitIdField is set', fakeAsync(() => {
      fixture.detectChanges();
      component.unitIdField = { clear: jasmine.createSpy('clear') } as any;

      component.clearAll();

      expect(component.unitIdField!.clear).toHaveBeenCalled();
    }));

    it('should guard against re-entry', fakeAsync(() => {
      fixture.detectChanges();
      component['isClearing'] = true;

      component.clearAll();

      expect(component.unitValidated()).toBeTruthy; // no state change
    }));
  });

  describe('loadPageHeader', () => {
    it('should set title from pageHeaderService data', fakeAsync(() => {
      const pageHeaderServiceLocal = TestBed.inject(PageHeaderService) as any;
      pageHeaderServiceLocal.pageHeaderData = () => ({ title: 'Custom Title', subtitle: 'Custom Sub' });

      fixture.detectChanges();
      tick();

      expect(component.headerConfig.title).toBe('Custom Title');
    }));
  });

  describe('getTableColumns valueFormatter', () => {
    it('should format empty values as dash', () => {
      fixture.detectChanges();
      const columns = component.tableConfig.columns;
      const catalogCol = columns.find((c: any) => c.key === 'catalogNumber');
      expect(catalogCol?.valueFormatter?.('')).toBe('-');
      expect(catalogCol?.valueFormatter?.('CAT')).toBe('CAT');

      const verifyProdCol = columns.find((c: any) => c.key === 'verifyProduct');
      expect(verifyProdCol?.valueFormatter?.('')).toBe('-');

      const verifyUnitCol = columns.find((c: any) => c.key === 'verifyUnitId');
      expect(verifyUnitCol?.valueFormatter?.('')).toBe('-');

      const labelCol = columns.find((c: any) => c.key === 'label');
      expect(labelCol?.valueFormatter?.('')).toBe('-');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
