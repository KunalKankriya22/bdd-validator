import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { ReLabelCodabarIsbtComponent } from './re-label-codabar-isbt';
import { ReLabelCodabarIsbtService } from './re-label-codabar-isbt.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { UnitIdFieldService, UnitValidationResponse } from '@shared/components/unit-id-field';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

const mockUnit = {
  unitId: 'W123426000001',
  osUnitId: 'CODBAR1',
  collectionDate: '2026-06-01T00:00:00',
  productCode: '12345',
  productDescription: 'Red Blood Cells',
  componentPrefix: '01',
  componentStatus: 'L',
  relabelProductCode: null,
  isCodabarUnit: true,
  firstIsbtUnitId: null,
  donorId: 'D001234',
  donorFirstName: 'John',
  donorLastName: 'Doe',
  donorDateOfBirth: '1990-01-15T00:00:00',
  donorBloodType: 'O+',
  systemLabelDecision: 'OP',
  expiryDate: '2026-07-01T23:59:00',
  contractId: 'INTERNAL',
  catalogNumber: 'CAT001',
  lotNumber: 'LOT001',
};

const successResponse = { success: true, message: 'OK', statusCode: 200, data: [] };

describe('ReLabelCodabarIsbtComponent', () => {
  let pageHeaderServiceSpy: any;
  let component: ReLabelCodabarIsbtComponent;
  let fixture: ComponentFixture<ReLabelCodabarIsbtComponent>;
  let serviceSpy: jasmine.SpyObj<ReLabelCodabarIsbtService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('ReLabelCodabarIsbtService', [
      'validateUnit',
      'getComponents',
      'validateComponent',
      'getUnitAttributes',
      'validateIsbtDetails',
      'getAboMapping',
      'getIsbtProductCodeMapping',
      'checkUserAccess',
      'verifyLabel',
      'relabel',
      'relabelCommit',
      'getAboValues',
      'getCatalogNumbers',
      'getLotNumbers',
      'getFacilityCodes',
      'getSpecialTestingCodes',
      'getProductCodes',
      'addUnitNote',
      'getUnitNotes',
      'getProductCodeDropdown',
      'printLabel',
    ]);

    serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [mockUnit] }));
    serviceSpy.getComponents.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ componentPrefix: '01', productCode: '12345', productDescription: 'Red Blood Cells', componentStatus: 'L', isAlreadyRelabeled: false, systemLabelDecision: 'OP', expiryDate: '2026-07-01', componentWeight: 250, bagId: 'CAT001' }] }));
    serviceSpy.getUnitAttributes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ attribGroup: 'DON', attribCode: 'V', attribType: 'U' }] }));
    serviceSpy.getAboMapping.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ aboLabel: 'OP', aboShortName: 'O Rh Positive', testedAbo: '51' }] }));
    serviceSpy.getIsbtProductCodeMapping.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ codabarProductCode: '12345', mappedProductCodes: 'E0280', intendedUse: 'V', fullIsbtProductCode: 'E0280V00' }] }));
    serviceSpy.getFacilityCodes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
    serviceSpy.getCatalogNumbers.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ catalogNumber: 'CAT001', description: 'Catalog 001' }] }));
    serviceSpy.getLotNumbers.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ lotNumber: 'LOT001', description: 'Lot 001' }] }));
    serviceSpy.getSpecialTestingCodes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
    serviceSpy.getProductCodes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
    serviceSpy.getAboValues.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ aboLabel: 'OP', aboShortName: 'O Rh Positive' }] }));
    serviceSpy.checkUserAccess.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, hasAccess: true }));
    serviceSpy.validateIsbtDetails.and.returnValue(of(successResponse));
    serviceSpy.verifyLabel.and.returnValue(of(successResponse));
    serviceSpy.relabel.and.returnValue(of(successResponse));
    serviceSpy.relabelCommit.and.returnValue(of({ success: true, message: 'Relabeled', statusCode: 200, data: [] }));
    serviceSpy.validateComponent.and.returnValue(of(successResponse));
    serviceSpy.addUnitNote.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
    serviceSpy.getUnitNotes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
    serviceSpy.getProductCodeDropdown.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
    serviceSpy.printLabel.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));

    snackBarSpy = createMockMatSnackBar();

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [
      'getTitle', 'getSubtitle', 'getCurrentMenuItem',
    ], {
      pageHeaderData: signal({ title: 'Re-Label Codabar units to ISBT Schema', subtitle: 'Re-label Codabar barcoded blood units to the ISBT 128 standard.' }),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Re-Label Codabar units to ISBT Schema');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('Re-label Codabar barcoded blood units to the ISBT 128 standard.');
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);



      TestBed.configureTestingModule({
      imports: [ReLabelCodabarIsbtComponent],
      providers: [
        provideAnimationsAsync(),
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideRouter([]),
        { provide: ReLabelCodabarIsbtService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });


    


      serviceSpy.validateUnit.calls.reset();


      serviceSpy.getComponents.calls.reset();


      serviceSpy.validateComponent.calls.reset();


      serviceSpy.getUnitAttributes.calls.reset();


      serviceSpy.validateIsbtDetails.calls.reset();


      serviceSpy.getAboMapping.calls.reset();


      serviceSpy.getIsbtProductCodeMapping.calls.reset();


      serviceSpy.checkUserAccess.calls.reset();


      serviceSpy.verifyLabel.calls.reset();


      serviceSpy.relabel.calls.reset();


      serviceSpy.relabelCommit.calls.reset();


      serviceSpy.getAboValues.calls.reset();


      serviceSpy.getCatalogNumbers.calls.reset();


      serviceSpy.getLotNumbers.calls.reset();


      serviceSpy.getFacilityCodes.calls.reset();


      serviceSpy.getSpecialTestingCodes.calls.reset();


      serviceSpy.getProductCodes.calls.reset();


      serviceSpy.addUnitNote.calls.reset();


      serviceSpy.getUnitNotes.calls.reset();


      serviceSpy.getProductCodeDropdown.calls.reset();


      serviceSpy.printLabel.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();


      serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [mockUnit] }));


      serviceSpy.getComponents.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ componentPrefix: '01', productCode: '12345', productDescription: 'Red Blood Cells', componentStatus: 'L', isAlreadyRelabeled: false, systemLabelDecision: 'OP', expiryDate: '2026-07-01', componentWeight: 250, bagId: 'CAT001' }] }));


      serviceSpy.getUnitAttributes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ attribGroup: 'DON', attribCode: 'V', attribType: 'U' }] }));


      serviceSpy.getAboMapping.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ aboLabel: 'OP', aboShortName: 'O Rh Positive', testedAbo: '51' }] }));


      serviceSpy.getIsbtProductCodeMapping.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ codabarProductCode: '12345', mappedProductCodes: 'E0280', intendedUse: 'V', fullIsbtProductCode: 'E0280V00' }] }));


      serviceSpy.getFacilityCodes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));


      serviceSpy.getCatalogNumbers.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ catalogNumber: 'CAT001', description: 'Catalog 001' }] }));


      serviceSpy.getLotNumbers.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ lotNumber: 'LOT001', description: 'Lot 001' }] }));


      serviceSpy.getSpecialTestingCodes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));


      serviceSpy.getProductCodes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));


      serviceSpy.getAboValues.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [{ aboLabel: 'OP', aboShortName: 'O Rh Positive' }] }));


      serviceSpy.checkUserAccess.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, hasAccess: true }));


      serviceSpy.validateIsbtDetails.and.returnValue(of(successResponse));


      serviceSpy.verifyLabel.and.returnValue(of(successResponse));


      serviceSpy.relabel.and.returnValue(of(successResponse));


      serviceSpy.relabelCommit.and.returnValue(of({ success: true, message: 'Relabeled', statusCode: 200, data: [] }));


      serviceSpy.validateComponent.and.returnValue(of(successResponse));


      serviceSpy.addUnitNote.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));


      serviceSpy.getUnitNotes.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));


      serviceSpy.getProductCodeDropdown.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));


      serviceSpy.printLabel.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));


      pageHeaderServiceSpy.getTitle.and.returnValue('Re-Label Codabar units to ISBT Schema');


      pageHeaderServiceSpy.getSubtitle.and.returnValue('Re-label Codabar barcoded blood units to the ISBT 128 standard.');


      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);


    fixture = TestBed.createComponent(ReLabelCodabarIsbtComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    // MatSnackBarModule provides its own MatSnackBar instance at component level,
    // shadowing the root spy. Replace after init to ensure spy is used.
    (component as any).snackBar = snackBarSpy;


    });


  it('should initialize with default header config', () => {
    expect(component.headerConfig.title).toBe('Re-Label Codabar units to ISBT Schema');
  });

  it('should load initial dropdowns on init', () => {
    expect(serviceSpy.getCatalogNumbers).toHaveBeenCalled();
    expect(serviceSpy.getSpecialTestingCodes).toHaveBeenCalled();
    expect(serviceSpy.getAboValues).toHaveBeenCalled();
    expect(serviceSpy.checkUserAccess).toHaveBeenCalledWith('UPEXP');
  });

  it('should start with unitValidated = false', () => {
    expect(component.unitValidated()).toBeFalse();
  });

  it('should populate unit data after successful unit validation', () => {
    const data: UnitValidationResponse = {
      parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
      codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
    };

    component.onUnitValidated(data);

    expect(serviceSpy.validateUnit).toHaveBeenCalledWith('CODBAR1');
    expect(component.unitValidated()).toBeTrue();
    expect(component.unitData()?.unitId).toBe('W123426000001');
  });

  it('should show error for non-Codabar units', () => {
    const nonCodabarUnit = { ...mockUnit, isCodabarUnit: false };
    serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [nonCodabarUnit] }));

    const data: UnitValidationResponse = {
      parsedUnitId: 'ISBT001', checkDigit: null, codeScheme: 'I', manualUnitId: 'ISBT001',
      codabarUnitScheme: null, entryMode: 'S', barcodeType: 'CODE128', chapterScheme: 'I',
    };

    component.onUnitValidated(data);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'This unit is not a Codabar unit and cannot be relabeled.', 'DISMISS',
      jasmine.objectContaining({ verticalPosition: 'top' }),
    );
    expect(component.unitValidated()).toBeFalse();
  });

  it('should show error on validation API error', () => {
    serviceSpy.validateUnit.and.returnValue(throwError(() => new Error('Network error')));

    const data: UnitValidationResponse = {
      parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
      codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
    };

    component.onUnitValidated(data);

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Failed to validate unit. Please try again.', 'DISMISS',
      jasmine.objectContaining({ verticalPosition: 'top' }),
    );
  });

  it('should clear all state when unit is cleared', () => {
    component.unitValidated.set(true);
    component.unitData.set(mockUnit as any);
    component.components.set([{ componentPrefix: '01' } as any]);
    component.unitAttributes.set([{ attribGroup: 'DON', attribCode: 'V', attribType: 'U' }]);

    component.onUnitCleared();

    expect(component.unitValidated()).toBeFalse();
    expect(component.unitData()).toBeNull();
    expect(component.components().length).toBe(0);
    expect(component.unitAttributes().length).toBe(0);
  });

  it('should show error when reprinting without ISBT Unit ID', () => {
    component.unitValidated.set(true);
    component.unitData.set(mockUnit as any);

    component.onReprint();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'ISBT Unit ID is required.', 'DISMISS',
      jasmine.objectContaining({ verticalPosition: 'top', horizontalPosition: 'end' }),
    );
  });



  it('should set showLabelVerification to true when opening verification dialog', () => {
    component.unitValidated.set(true);
    component.unitData.set(mockUnit as any);

    component.openLabelVerificationDialog();

    expect(component.showLabelVerification()).toBeTrue();
  });







  it('should display UPEXP access as true after checkUserAccess succeeds', () => {
    expect(component.userHasUpexpAccess()).toBeTrue();
  });

  it('should set userHasUpexpAccess to false when access denied', () => {
    serviceSpy.checkUserAccess.and.returnValue(of({ success: true, message: 'No access', statusCode: 200, hasAccess: false }));

    const newFixture = TestBed.createComponent(ReLabelCodabarIsbtComponent);
    newFixture.detectChanges();

    expect(newFixture.componentInstance.userHasUpexpAccess()).toBeFalse();
  });

  it('should compute ABO label from mapping', () => {
    component.aboMappingData.set({ aboLabel: 'OP', aboShortName: 'O Rh Positive', testedAbo: '51' });
    expect(component.aboLabel()).toBe('OP');
    expect(component.aboDescription()).toBe('O Rh Positive');
  });

  it('should compute testedAbo from mapping', () => {
    component.aboMappingData.set({ aboLabel: 'OP', aboShortName: 'O Rh Positive', testedAbo: '51' });
    expect(component.testedAbo()).toBe('51');
  });

  it('should return dash for testedAbo when mapping has no testedAbo', () => {
    component.aboMappingData.set({ aboLabel: 'OP', aboShortName: 'O Rh Positive' });
    expect(component.testedAbo()).toBe('-');
  });

  it('should store fullIsbtProductCode from product code mapping', () => {
    const data: any = {
      parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
      codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
    };
    component.onUnitValidated(data);
    expect(component.fullIsbtProductCode()).toBe('E0280V00');
  });

  it('should pass unitId and collectionDate to getAboMapping', () => {
    const data: any = {
      parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
      codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
    };
    serviceSpy.getAboMapping.calls.reset();
    component.onUnitValidated(data);
    expect(serviceSpy.getAboMapping).toHaveBeenCalledWith('OP', 'W123426000001', jasmine.any(String));
  });

  it('should clear fullIsbtProductCode on clearAll', () => {
    component.fullIsbtProductCode.set('E0280V00');
    (component as any).clearAll();
    expect(component.fullIsbtProductCode()).toBe('');
  });



  it('should return dash for null/undefined/empty dates', () => {
    expect(component.formatDate(null)).toBe('-');
    expect(component.formatDate(undefined)).toBe('-');
    expect(component.formatDate('')).toBe('-');
  });

  it('should load lot numbers for the unit catalog number after unit validation', () => {
    const data: UnitValidationResponse = {
      parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
      codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
    };

    component.onUnitValidated(data);

    expect(serviceSpy.getLotNumbers).toHaveBeenCalledWith('CAT001');
  });

  it('should call validateComponent with correct params on aliquot change', () => {
    component.unitData.set(mockUnit as any);
    component.onAliquotChange('02');
    expect(serviceSpy.validateComponent).toHaveBeenCalledWith(
      jasmine.objectContaining({ componentPrefix: '02', productCode: '12345' }),
    );
    expect(component.selectedComponentPrefix()).toBe('02');
  });

  it('should update verificationUnitId signal on scan input', () => {
    const fakeEvent = { target: { value: 'W123426000001' } } as unknown as Event;
    component.onVerificationUnitIdInput(fakeEvent);
    expect(component.verificationUnitId()).toBe('W123426000001');
  });

  it('should update verificationAbo signal on ABO change', () => {
    component.onVerificationAboChange('OP');
    expect(component.verificationAbo()).toBe('OP');
  });





  it('should keep expiration date enabled when user lacks UPEXP access', () => {
    const data: UnitValidationResponse = {
      parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
      codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
    };

    component.userHasUpexpAccess.set(false);
    component.onUnitValidated(data);

    // Component currently enables expiration date regardless of UPEXP access
    expect(component.isbtForm.get('expirationDate')?.enabled).toBeTrue();
  });

  it('should call getIsbtProductCodeMapping after unit validation', () => {
    const data: UnitValidationResponse = {
      parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
      codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
    };

    component.onUnitValidated(data);

    expect(serviceSpy.getIsbtProductCodeMapping).toHaveBeenCalledWith('12345', 'W123426000001');
  });

  it('should update product description when product code changes', () => {
    component.unitData.set(mockUnit as any);
    component.unitValidated.set(true);
    component.currentProductDescription.set('Red Blood Cells');

    serviceSpy.getComponents.and.returnValue(of({
      success: true, message: 'OK', statusCode: 200,
      data: [{ componentPrefix: '01', productCode: '18201', productDescription: 'Fresh Frozen Plasma',
        componentStatus: 'L', isAlreadyRelabeled: false, systemLabelDecision: null,
        expiryDate: null, componentWeight: 250, bagId: '02' }],
    }));

    component.productCodeValue.set('18201');
    component.onProductCodeEnter();

    expect(component.currentProductDescription()).toBe('Fresh Frozen Plasma');
  });

  it('should use unitId when osUnitId is null for components call', () => {
    const unitWithoutOsId = { ...mockUnit, osUnitId: null as any };
    component.unitData.set(unitWithoutOsId as any);
    component.unitValidated.set(true);

    component.productCodeValue.set('04250');
    component.onProductCodeEnter();

    expect(serviceSpy.getComponents).toHaveBeenCalledWith(
      'W123426000001', jasmine.any(String), '04250',
    );
  });

  it('should cascade lot numbers when catalog number changes', () => {
    component.onCatalogNumberChange('CAT001');

    expect(serviceSpy.getLotNumbers).toHaveBeenCalledWith('CAT001');
  });

  it('should clear lot numbers when catalog number is cleared', () => {
    component.lotNumbers.set([{ lotNumber: 'LOT001' } as any]);

    component.onCatalogNumberChange(null);

    expect(component.lotNumbers().length).toBe(0);
    expect(component.isbtForm.get('lotNumber')?.value).toBeNull();
  });

  // ── Helper to set up a validated unit with ISBT state ready ──────────────
  function setupValidatedUnit(): void {
    const futureDate = moment.utc().add(30, 'days');
    component.unitData.set(mockUnit as any);
    component.unitValidated.set(true);
    component.isbtUnitIdState.set('valid');
    component.rawIsbtUnitId.set('W999988877766655');
    component.parsedIsbtUnitId.set('W999988877766655');
    component.isbtForm.patchValue({
      isbtUnitId: 'W99 998 887 776 6655',
      expirationDate: futureDate,
      expirationTime: '23:59',
      isbtProductCode: 'E0280',
      aboLabel: 'OP',
    });
  }

  // ── Computed signals ─────────────────────────────────────────────────────

  describe('computed signals', () => {
    it('should compute donorFullName from unit data', () => {
      component.unitData.set({ donorFirstName: 'Jane', donorLastName: 'Smith' } as any);
      expect(component.donorFullName()).toBe('Jane Smith');
    });

    it('should return dash when unitData is null for donorFullName', () => {
      component.unitData.set(null);
      expect(component.donorFullName()).toBe('-');
    });

    it('should return dash when donor names are empty', () => {
      component.unitData.set({ donorFirstName: '', donorLastName: '' } as any);
      expect(component.donorFullName()).toBe('-');
    });

    it('should compute specialTestDescription from form and codes', () => {
      component.specialTestingCodes.set([{ productCode: 'CMV', description: 'CMV Negative' } as any]);
      component.isbtForm.patchValue({ specialTestingCode: 'CMV' });
      expect(component.specialTestDescription()).toBe('CMV Negative');
    });

    it('should return dash for specialTestDescription when no code selected', () => {
      component.isbtForm.patchValue({ specialTestingCode: null });
      expect(component.specialTestDescription()).toBe('-');
    });

    it('should return dash for specialTestDescription when code not found', () => {
      component.specialTestingCodes.set([]);
      component.isbtForm.patchValue({ specialTestingCode: 'NOTFOUND' });
      expect(component.specialTestDescription()).toBe('-');
    });

    it('should compute verificationAboDesc from aboValues', () => {
      component.aboValues.set([{ aboLabel: 'AN', aboShortName: 'A Rh Negative' } as any]);
      component.verificationAbo.set('AN');
      expect(component.verificationAboDesc()).toBe('A Rh Negative');
    });

    it('should fall back to aboMappingData for verificationAboDesc', () => {
      component.aboValues.set([]);
      component.aboMappingData.set({ aboLabel: 'OP', aboShortName: 'O Rh Positive' });
      component.verificationAbo.set('XX');
      expect(component.verificationAboDesc()).toBe('O Rh Positive');
    });

    it('should compute collectionDateDisplay as formatted date', () => {
      component.unitData.set({ collectionDate: '2026-06-01T00:00:00' } as any);
      expect(component.collectionDateDisplay()).toBe('01-JUN-2026');
    });

    it('should return dash for collectionDateDisplay when no unit data', () => {
      component.unitData.set(null);
      expect(component.collectionDateDisplay()).toBe('-');
    });

    it('should compute productCodeOptions from unitProductCodes', () => {
      component.unitProductCodes.set([{ productCode: 'PC1', productDesc: 'Desc 1' }] as any);
      const opts = component.productCodeOptions();
      expect(opts.length).toBe(1);
      expect(opts[0].code).toBe('PC1');
      expect(opts[0].description).toBe('Desc 1');
    });
  });

  // ── Format helpers ───────────────────────────────────────────────────────

  describe('format helpers', () => {
    it('should format valid datetime string', () => {
      expect(component.formatDateTime('2026-06-01T14:30:00')).toBe('01-JUN-2026 14:30');
    });

    it('should return dash for null/undefined/empty datetime', () => {
      expect(component.formatDateTime(null)).toBe('-');
      expect(component.formatDateTime(undefined)).toBe('-');
      expect(component.formatDateTime('')).toBe('-');
    });

    it('should format valid date string', () => {
      expect(component.formatDate('2026-06-01T00:00:00')).toContain('2026');
    });
  });

  // ── ISBT Unit ID validation ──────────────────────────────────────────────

  describe('ISBT Unit ID validation', () => {
    let unitIdFieldServiceSpy: jasmine.SpyObj<UnitIdFieldService>;

    beforeEach(() => {
      unitIdFieldServiceSpy = jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']);
      component['unitIdFieldService'] = unitIdFieldServiceSpy;
    });

    it('should reset isbt state on onIsbtUnitIdChange when not idle', () => {
      component.isbtUnitIdState.set('valid');
      component.isbtUnitIdError.set('some error');
      component.isbtForm.get('isbtUnitId')?.setErrors({ isbtFormat: true });

      component.onIsbtUnitIdChange();

      expect(component.isbtUnitIdState()).toBe('idle');
      expect(component.isbtUnitIdError()).toBeNull();
      expect(component.isbtForm.get('isbtUnitId')?.errors).toBeNull();
    });

    it('should not reset isbt state on onIsbtUnitIdChange when already idle', () => {
      component.isbtUnitIdState.set('idle');
      component.isbtUnitIdError.set(null);

      component.onIsbtUnitIdChange();

      expect(component.isbtUnitIdState()).toBe('idle');
    });

    it('should set idle state when isbt unit id is empty on blur', () => {
      component.isbtForm.patchValue({ isbtUnitId: '' });
      component.isbtUnitIdState.set('validating');

      component.onIsbtUnitIdBlur();

      expect(component.isbtUnitIdState()).toBe('idle');
      expect(component.isbtUnitIdError()).toBeNull();
    });

    it('should not re-validate when already valid on blur', () => {
      component.isbtForm.patchValue({ isbtUnitId: 'W99 998 887 776 6655' });
      component.isbtUnitIdState.set('valid');

      component.onIsbtUnitIdBlur();

      expect(unitIdFieldServiceSpy.validateUnitId).not.toHaveBeenCalled();
    });

    it('should validate CODE128 unit id successfully on blur', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(of({
        success: true,
        message: 'OK',
        item: {
          barcodeType: 'CODE128',
          manualUnitId: 'W999988877766655',
          parsedUnitId: 'W999988877766655',
        },
      } as any));

      component.isbtForm.patchValue({ isbtUnitId: 'W999988877766655' });
      component.isbtUnitIdState.set('idle');

      component.onIsbtUnitIdBlur();

      expect(component.isbtUnitIdState()).toBe('valid');
      expect(component.isbtUnitIdError()).toBeNull();
      expect(component.rawIsbtUnitId()).toBe('W999988877766655');
      expect(component.parsedIsbtUnitId()).toBe('W999988877766655');
    });

    it('should reject CODABAR unit id on blur', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(of({
        success: true,
        message: 'OK',
        item: {
          barcodeType: 'CODABAR',
          manualUnitId: 'CODBAR1',
          parsedUnitId: 'CODBAR1',
        },
      } as any));

      component.isbtForm.patchValue({ isbtUnitId: 'CODBAR1' });
      component.isbtUnitIdState.set('idle');

      component.onIsbtUnitIdBlur();

      expect(component.isbtUnitIdState()).toBe('invalid');
      expect(component.isbtUnitIdError()).toContain('ISBT 128');
      expect(component.isbtForm.get('isbtUnitId')?.hasError('isbtFormat')).toBeTrue();
    });

    it('should handle unknown barcode type on blur', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(of({
        success: false,
        message: 'Unknown format',
        item: {
          barcodeType: 'UNKNOWN',
          manualUnitId: 'XYZ',
          parsedUnitId: 'XYZ',
        },
      } as any));

      component.isbtForm.patchValue({ isbtUnitId: 'XYZ' });
      component.isbtUnitIdState.set('idle');

      component.onIsbtUnitIdBlur();

      expect(component.isbtUnitIdState()).toBe('invalid');
      expect(component.isbtUnitIdError()).toBe('Unknown format');
    });

    it('should handle validation API error on blur', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(throwError(() => new Error('Network error')));

      component.isbtForm.patchValue({ isbtUnitId: 'W999988877766655' });
      component.isbtUnitIdState.set('idle');

      component.onIsbtUnitIdBlur();

      expect(component.isbtUnitIdState()).toBe('invalid');
      expect(component.isbtUnitIdError()).toBe('ISBT Unit ID validation failed.');
    });
  });

  // ── validateIsbtFields error paths ───────────────────────────────────────

  describe('validateIsbtFields', () => {
    it('should show error when ISBT unit ID state is not valid', () => {
      component.unitData.set(mockUnit as any);
      component.isbtForm.patchValue({ isbtUnitId: 'W999' });
      component.isbtUnitIdState.set('invalid');

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please enter a valid ISBT Unit ID before proceeding.', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should show error when expiration date is missing', () => {
      component.unitData.set(mockUnit as any);
      component.isbtUnitIdState.set('valid');
      component.isbtForm.patchValue({
        isbtUnitId: 'W999',
        expirationDate: null,
        expirationTime: '23:59',
      });

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Expiration Date is required.', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should show error when expiration time is missing', () => {
      component.unitData.set(mockUnit as any);
      component.isbtUnitIdState.set('valid');
      component.isbtForm.patchValue({
        isbtUnitId: 'W999',
        expirationDate: moment.utc().add(30, 'days'),
        expirationTime: '',
      });

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Expiration Time is required.', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should show error when expiration time is invalid', () => {
      component.unitData.set(mockUnit as any);
      component.isbtUnitIdState.set('valid');
      component.isbtForm.patchValue({
        isbtUnitId: 'W999',
        expirationDate: moment.utc().add(30, 'days'),
        expirationTime: 'abc',
      });
      component.isbtForm.get('expirationTime')?.setErrors({ invalidTime: true });

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Expiration Time is invalid. Use HH:MM (24-hour format).', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });
  });

  // ── onReprint with valid fields ──────────────────────────────────────────

  describe('onReprint', () => {
    it('should call printLabel when ISBT fields are valid', () => {
      setupValidatedUnit();

      component.onReprint();

      expect(component.isSaving()).toBeFalse(); // already resolved
      expect(serviceSpy.printLabel).toHaveBeenCalled();
    });

    it('should show non-verification toast on successful reprint', () => {
      setupValidatedUnit();

      component.onReprint();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        '(Re)Printing label in the non verification mode.', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should handle printLabel error on reprint without opening verification', () => {
      setupValidatedUnit();
      serviceSpy.printLabel.and.returnValue(throwError(() => new Error('Print error')));

      component.onReprint();

      expect(component.isSaving()).toBeFalse();
    });
  });

  // ── onConfirmPrintChange / onConfirmPrint ────────────────────────────────

  describe('onConfirmPrintChange', () => {
    it('should trigger onConfirmPrint when value is Y', () => {
      setupValidatedUnit();

      component.onConfirmPrintChange('Y');

      expect(serviceSpy.validateIsbtDetails).toHaveBeenCalled();
    });

    it('should not trigger onConfirmPrint when value is N', () => {
      setupValidatedUnit();

      component.onConfirmPrintChange('N');

      expect(serviceSpy.validateIsbtDetails).not.toHaveBeenCalled();
    });

    it('should call printLabel after successful ISBT details validation', () => {
      setupValidatedUnit();
      serviceSpy.validateIsbtDetails.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));

      component.onConfirmPrintChange('Y');

      expect(serviceSpy.printLabel).toHaveBeenCalled();
    });

    it('should show error when ISBT details validation fails', () => {
      setupValidatedUnit();
      serviceSpy.validateIsbtDetails.and.returnValue(of({ success: false, message: 'Validation failed', statusCode: 400, data: [] }));

      component.onConfirmPrintChange('Y');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Validation failed', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
      expect(component.isSaving()).toBeFalse();
    });

    it('should show error when ISBT details validation API errors', () => {
      setupValidatedUnit();
      serviceSpy.validateIsbtDetails.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.onConfirmPrintChange('Y');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Server error', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
      expect(component.isSaving()).toBeFalse();
    });

    it('should open verification dialog after printLabel success when confirmPrint', () => {
      setupValidatedUnit();
      serviceSpy.validateIsbtDetails.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
      serviceSpy.printLabel.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));

      component.onConfirmPrintChange('Y');

      expect(component.showLabelVerification()).toBeTrue();
    });

    it('should open verification dialog even on printLabel error when confirmPrint', () => {
      setupValidatedUnit();
      serviceSpy.validateIsbtDetails.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
      serviceSpy.printLabel.and.returnValue(throwError(() => new Error('Print error')));

      component.onConfirmPrintChange('Y');

      expect(component.showLabelVerification()).toBeTrue();
    });
  });

  // ── Label Verification dialog ────────────────────────────────────────────

  describe('label verification dialog', () => {
    it('should close label verification dialog', () => {
      component.showLabelVerification.set(true);
      component.closeLabelVerification();
      expect(component.showLabelVerification()).toBeFalse();
    });

    it('should update verificationScanUnitAbo on scan input', () => {
      const fakeEvent = { target: { value: 'SCANNED123' } } as unknown as Event;
      component.onScanUnitAbo(fakeEvent);
      expect(component.verificationScanUnitAbo()).toBe('SCANNED123');
    });

    it('should update verificationScanProductExp on scan input', () => {
      const fakeEvent = { target: { value: 'PROD123' } } as unknown as Event;
      component.onScanProductExp(fakeEvent);
      expect(component.verificationScanProductExp()).toBe('PROD123');
    });

    it('should update verificationProductCode on input', () => {
      const fakeEvent = { target: { value: 'E0280' } } as unknown as Event;
      component.onVerificationProductCodeInput(fakeEvent);
      expect(component.verificationProductCode()).toBe('E0280');
    });

    it('should update verificationExpDate on change', () => {
      const date = moment.utc('2026-07-01');
      component.onVerificationExpDateChange(date);
      expect(component.verificationExpDate()).toBe(date);
    });

    it('should update verificationExpTime on input', () => {
      const fakeEvent = { target: { value: '14:30' } } as unknown as Event;
      component.onVerificationExpTimeInput(fakeEvent);
      expect(component.verificationExpTime()).toBe('14:30');
    });

    it('should update verificationSpecialTesting on input', () => {
      const fakeEvent = { target: { value: 'CMV' } } as unknown as Event;
      component.onVerificationSpecialTestInput(fakeEvent);
      expect(component.verificationSpecialTesting()).toBe('CMV');
    });
  });

  // ── onScanUnitAboEnter / onScanProductExpEnter ───────────────────────────

  describe('scan enter handlers', () => {
    let unitIdFieldServiceSpy: jasmine.SpyObj<UnitIdFieldService>;

    beforeEach(() => {
      unitIdFieldServiceSpy = jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']);
      component['unitIdFieldService'] = unitIdFieldServiceSpy;
    });

    it('should parse scanned unit abo on enter with item', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(of({
        success: true,
        message: 'OK',
        item: { parsedUnitId: 'PARSED123', manualUnitId: 'SCANNED123', barcodeType: 'CODE128' },
      } as any));

      component.verificationScanUnitAbo.set('SCANNED123');
      component.onScanUnitAboEnter();

      expect(component.verificationUnitId()).toBe('PARSED123');
      expect(component.verificationScanUnitAbo()).toBe('');
    });

    it('should use scanned value when item is null on unit abo enter', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(of({
        success: false,
        message: 'Not found',
        item: null,
      } as any));

      component.verificationScanUnitAbo.set('RAW123');
      component.onScanUnitAboEnter();

      expect(component.verificationUnitId()).toBe('RAW123');
      expect(component.verificationScanUnitAbo()).toBe('');
    });

    it('should use scanned value on unit abo enter API error', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(throwError(() => new Error('err')));

      component.verificationScanUnitAbo.set('ERRVAL');
      component.onScanUnitAboEnter();

      expect(component.verificationUnitId()).toBe('ERRVAL');
      expect(component.verificationScanUnitAbo()).toBe('');
    });

    it('should not scan when verificationScanUnitAbo is empty', () => {
      component.verificationScanUnitAbo.set('');
      component.onScanUnitAboEnter();
      expect(unitIdFieldServiceSpy.validateUnitId).not.toHaveBeenCalled();
    });

    it('should set verificationProductCode on product/exp enter', () => {
      component.verificationScanProductExp.set('E0280');
      component.onScanProductExpEnter();

      expect(component.verificationProductCode()).toBe('E0280');
      expect(component.verificationScanProductExp()).toBe('');
    });

    it('should not set product code when scan is empty', () => {
      component.verificationScanProductExp.set('');
      component.onScanProductExpEnter();
      expect(component.verificationProductCode()).toBe('');
    });
  });

  // ── onVerificationUnitIdBlur ─────────────────────────────────────────────

  describe('onVerificationUnitIdBlur', () => {
    let unitIdFieldServiceSpy: jasmine.SpyObj<UnitIdFieldService>;

    beforeEach(() => {
      unitIdFieldServiceSpy = jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']);
      component['unitIdFieldService'] = unitIdFieldServiceSpy;
    });

    it('should update verificationUnitId when item exists', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(of({
        success: true,
        message: 'OK',
        item: { parsedUnitId: 'PARSED456' },
      } as any));

      component.verificationUnitId.set('RAW456');
      component.onVerificationUnitIdBlur();

      expect(component.verificationUnitId()).toBe('PARSED456');
    });

    it('should not call validate when value is empty', () => {
      component.verificationUnitId.set('');
      component.onVerificationUnitIdBlur();
      expect(unitIdFieldServiceSpy.validateUnitId).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', () => {
      unitIdFieldServiceSpy.validateUnitId.and.returnValue(throwError(() => new Error('err')));
      component.verificationUnitId.set('RAW789');
      component.onVerificationUnitIdBlur();
      // Should not throw, keeps original value
      expect(component.verificationUnitId()).toBe('RAW789');
    });
  });

  // ── checkAutoVerify / onVerificationExpTimeBlur / onVerificationSpecialTestBlur ─

  describe('auto verify', () => {
    it('should call checkAutoVerify on exp time blur when no special testing code', () => {
      component.isbtForm.patchValue({ specialTestingCode: null });
      component.showLabelVerification.set(true);
      // Leave verificationUnitId empty to prevent auto-verify
      component.verificationUnitId.set('');

      component.onVerificationExpTimeBlur();
      // checkAutoVerify exits early because verificationUnitId is empty
      expect(component.isVerifying()).toBeFalse();
    });

    it('should not call checkAutoVerify on exp time blur when special testing code set', () => {
      component.isbtForm.patchValue({ specialTestingCode: 'CMV' });
      component.showLabelVerification.set(false);

      component.onVerificationExpTimeBlur();
      // When specialTestingCode is set, checkAutoVerify is not called
      expect(component.isVerifying()).toBeFalse();
    });

    it('should call checkAutoVerify on special test blur', () => {
      component.showLabelVerification.set(true);
      component.verificationUnitId.set('');

      component.onVerificationSpecialTestBlur();
      // checkAutoVerify exits early because verificationUnitId is empty
      expect(component.isVerifying()).toBeFalse();
    });
  });

  // ── onVerifyAndCommit + commitRelabel ────────────────────────────────────

  describe('onVerifyAndCommit', () => {
    beforeEach(() => {
      setupValidatedUnit();
      component.verificationUnitId.set('W999988877766655');
      component.verificationAbo.set('OP');
      component.verificationProductCode.set('E0280');
      component.verificationExpDate.set(moment.utc('2026-07-01'));
      component.verificationExpTime.set('23:59');
      component.showLabelVerification.set(true);
    });

    it('should verify and commit successfully', () => {
      serviceSpy.verifyLabel.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
      serviceSpy.relabelCommit.and.returnValue(of({ success: true, message: 'Relabeled', statusCode: 200, data: [] }));

      component.onVerifyAndCommit();

      expect(serviceSpy.verifyLabel).toHaveBeenCalled();
      expect(serviceSpy.relabelCommit).toHaveBeenCalled();
      expect(component.showLabelVerification()).toBeFalse();
    });

    it('should show error when verify returns success false', () => {
      serviceSpy.verifyLabel.and.returnValue(of({ success: false, message: 'Mismatch', statusCode: 400, data: [] }));

      component.onVerifyAndCommit();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Mismatch', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
      expect(component.isVerifying()).toBeFalse();
      expect(serviceSpy.relabelCommit).not.toHaveBeenCalled();
    });

    it('should show error when verify API errors', () => {
      serviceSpy.verifyLabel.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.onVerifyAndCommit();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Server error', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
      expect(component.isVerifying()).toBeFalse();
    });

    it('should show error when commit fails', () => {
      serviceSpy.verifyLabel.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
      serviceSpy.relabelCommit.and.returnValue(of({ success: false, message: 'Commit failed', statusCode: 500, data: [] }));

      component.onVerifyAndCommit();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Commit failed', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should show error when commit API errors', () => {
      serviceSpy.verifyLabel.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
      serviceSpy.relabelCommit.and.returnValue(throwError(() => ({ error: { message: 'Commit server error' } })));

      component.onVerifyAndCommit();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Commit server error', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
      expect(component.isVerifying()).toBeFalse();
    });

    it('should not call verify when unitData is null', () => {
      component.unitData.set(null);

      component.onVerifyAndCommit();

      expect(serviceSpy.verifyLabel).not.toHaveBeenCalled();
    });

    it('should not call verify when isbtUnitId is empty', () => {
      component.isbtForm.patchValue({ isbtUnitId: '' });

      component.onVerifyAndCommit();

      expect(serviceSpy.verifyLabel).not.toHaveBeenCalled();
    });

    it('should include specialTestingCode in verify request', () => {
      component.isbtForm.patchValue({ specialTestingCode: 'CMV' });
      component.verificationSpecialTesting.set('CMV');
      serviceSpy.verifyLabel.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
      serviceSpy.relabelCommit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));

      component.onVerifyAndCommit();

      const verifyCall = serviceSpy.verifyLabel.calls.mostRecent().args[0];
      expect(verifyCall.scannedSpecialTestingCode).toBe('CMV');
      expect(verifyCall.expectedSpecialTestingCode).toBe('CMV');
    });
  });

  // ── clearAll ─────────────────────────────────────────────────────────────

  describe('clearAll', () => {
    it('should reset all unit state when clearAll is called', () => {
      component.unitValidated.set(true);
      component.unitData.set(mockUnit as any);
      component.productCodeValue.set('12345');
      component.components.set([{ componentPrefix: '01' } as any]);
      component.unitAttributes.set([{ attribGroup: 'DON' } as any]);

      component.clearAll();

      expect(component.unitValidated()).toBeFalse();
      expect(component.unitData()).toBeNull();
      expect(component.productCodeValue()).toBe('');
      expect(component.components().length).toBe(0);
      expect(component.unitAttributes().length).toBe(0);
    });
  });

  // ── openNotesDialog ──────────────────────────────────────────────────────

  describe('openNotesDialog', () => {
    it('should not open dialog when unit data is null', () => {
      component.unitData.set(null);
      const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
      component['dialog'] = dialogSpy;

      component.openNotesDialog();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should show error when collection date is missing', () => {
      component.unitData.set({ ...mockUnit, collectionDate: null } as any);

      component.openNotesDialog();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Collection Date is required to view notes', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should open dialog with correct data when unit has collection date', () => {
      component.unitData.set(mockUnit as any);
      const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
      component['dialog'] = dialogSpy;

      component.openNotesDialog();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1].data;
      expect(dialogData.collectionDate).toBe('2026-06-01T00:00:00');
    });

    it('should use ISBT unit ID when available for notes dialog', () => {
      component.unitData.set(mockUnit as any);
      component.isbtForm.patchValue({ isbtUnitId: 'ISBT999' });
      const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
      component['dialog'] = dialogSpy;

      component.openNotesDialog();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1].data;
      expect(dialogData.unitId).toBe('ISBT999');
    });

    it('should fall back to unit.unitId when ISBT unit ID is empty', () => {
      component.unitData.set(mockUnit as any);
      component.isbtForm.patchValue({ isbtUnitId: '' });
      const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
      component['dialog'] = dialogSpy;

      component.openNotesDialog();

      const dialogData = dialogSpy.open.calls.mostRecent().args[1].data;
      expect(dialogData.unitId).toBe('W123426000001');
    });
  });

  // ── onExpirationDateInput ────────────────────────────────────────────────

  describe('onExpirationDateInput', () => {
    it('should handle expiration date input event', () => {
      const fakeEvent = { target: { value: '01-JUL-2026' } } as unknown as Event;
      component.onExpirationDateInput(fakeEvent);
      // Should not throw - validates internally
    });
  });

  // ── onProductCodeSelect ──────────────────────────────────────────────────

  describe('onProductCodeSelect', () => {
    it('should set product code value and trigger onProductCodeEnter', () => {
      component.unitData.set(mockUnit as any);
      component.unitValidated.set(true);

      component.onProductCodeSelect('abc');

      expect(component.productCodeValue()).toBe('ABC');
    });
  });

  // ── onAliquotChange error paths ──────────────────────────────────────────

  describe('onAliquotChange error paths', () => {
    it('should show error when validateComponent returns failure', () => {
      component.unitData.set(mockUnit as any);
      serviceSpy.validateComponent.and.returnValue(of({ success: false, message: 'Comp validation failed', statusCode: 400, data: [] }));

      component.onAliquotChange('03');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Comp validation failed', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should show error when validateComponent API errors', () => {
      component.unitData.set(mockUnit as any);
      serviceSpy.validateComponent.and.returnValue(throwError(() => new Error('API error')));

      component.onAliquotChange('03');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Component validation failed.', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should not call validateComponent when unitData is null', () => {
      component.unitData.set(null);
      component.onAliquotChange('03');
      expect(serviceSpy.validateComponent).not.toHaveBeenCalled();
    });
  });

  // ── onUnitValidated edge cases ───────────────────────────────────────────

  describe('onUnitValidated edge cases', () => {
    it('should show error when API returns success false', () => {
      serviceSpy.validateUnit.and.returnValue(of({ success: false, message: 'Not found', statusCode: 404, data: [] }));
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Not found', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });

    it('should show error when API returns empty data', () => {
      serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [] }));
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(component.unitValidated()).toBeFalse();
    });

    it('should load facility codes when unit has contractId', () => {
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(serviceSpy.getFacilityCodes).toHaveBeenCalledWith('INTERNAL');
    });

    it('should prefill ISBT form with first ISBT unit ID when available', () => {
      const unitWithIsbt = { ...mockUnit, firstIsbtUnitId: 'W555444333222111' };
      serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [unitWithIsbt] }));
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(component.isbtForm.get('isbtUnitId')?.value).toBe('W555444333222111');
    });

    it('should handle error message from API error response', () => {
      serviceSpy.validateUnit.and.returnValue(throwError(() => ({ error: { message: 'Custom error' } })));
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Custom error', 'DISMISS',
        jasmine.objectContaining({ verticalPosition: 'top' }),
      );
    });
  });

  // ── loadIsbtProductCodeMapping / loadAboMapping / loadFacilityCodes edge cases ─

  describe('load data edge cases', () => {
    it('should skip ISBT product code mapping when no productCode', () => {
      const unitNoProduct = { ...mockUnit, productCode: null as any };
      serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [unitNoProduct] }));
      serviceSpy.getIsbtProductCodeMapping.calls.reset();
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(serviceSpy.getIsbtProductCodeMapping).not.toHaveBeenCalled();
    });

    it('should skip ABO mapping when no systemLabelDecision', () => {
      const unitNoLabel = { ...mockUnit, systemLabelDecision: null as any };
      serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [unitNoLabel] }));
      serviceSpy.getAboMapping.calls.reset();
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(serviceSpy.getAboMapping).not.toHaveBeenCalled();
    });

    it('should skip facility codes when no contractId', () => {
      const unitNoContract = { ...mockUnit, contractId: null as any };
      serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [unitNoContract] }));
      serviceSpy.getFacilityCodes.calls.reset();
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(serviceSpy.getFacilityCodes).toHaveBeenCalledTimes(0);
    });

    it('should not load lot numbers when unit has no catalogNumber', () => {
      const unitNoCatalog = { ...mockUnit, catalogNumber: null as any };
      serviceSpy.validateUnit.and.returnValue(of({ success: true, message: 'OK', statusCode: 200, data: [unitNoCatalog] }));
      serviceSpy.getLotNumbers.calls.reset();
      const data: UnitValidationResponse = {
        parsedUnitId: 'CODBAR1', checkDigit: null, codeScheme: 'C', manualUnitId: 'CODBAR1',
        codabarUnitScheme: null, entryMode: 'M', barcodeType: 'CODABAR', chapterScheme: 'C',
      };

      component.onUnitValidated(data);

      expect(serviceSpy.getLotNumbers).not.toHaveBeenCalled();
    });
  });

  // ── onProductCodeEnter edge cases ────────────────────────────────────────

  describe('onProductCodeEnter edge cases', () => {
    it('should not process when code is empty', () => {
      component.unitData.set(mockUnit as any);
      component.productCodeValue.set('');
      serviceSpy.getComponents.calls.reset();

      component.onProductCodeEnter();

      expect(serviceSpy.getComponents).not.toHaveBeenCalled();
    });

    it('should not process when code equals lastValidatedProductCode', () => {
      component.unitData.set(mockUnit as any);
      component.productCodeValue.set('12345');
      component.lastValidatedProductCode.set('12345');
      serviceSpy.getComponents.calls.reset();

      component.onProductCodeEnter();

      expect(serviceSpy.getComponents).not.toHaveBeenCalled();
    });

    it('should not process when unitData is null', () => {
      component.unitData.set(null);
      component.productCodeValue.set('12345');
      serviceSpy.getComponents.calls.reset();

      component.onProductCodeEnter();

      expect(serviceSpy.getComponents).not.toHaveBeenCalled();
    });

    it('should reset ISBT unit ID state when product code changes', () => {
      component.unitData.set(mockUnit as any);
      component.productCodeValue.set('NEWCODE');
      component.isbtUnitIdState.set('valid');

      component.onProductCodeEnter();

      expect(component.isbtUnitIdState()).toBe('idle');
      expect(component.isbtUnitIdError()).toBeNull();
    });
  });

  // ── getExpirationDateError / expDateErrorMatcher ─────────────────────────

  describe('expiration date error', () => {
    it('should return error string from getExpirationDateError', () => {
      const error = component.getExpirationDateError();
      // returns an empty string or error depending on form state
      expect(typeof error).toBe('string');
    });
  });
});
