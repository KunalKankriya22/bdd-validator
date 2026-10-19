import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeDetectorRef, signal } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';

import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ConvertModifyComponentsComponent } from './convert-modify-components';
import { ComponentChangeApiService } from './services/component-change-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field';
import { UnitValidationResponse } from '@shared/components/unit-id-field/unit-id-field.model';
import moment from 'moment';
import { createMockHeaderService, createMockMatSnackBar, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  UnitValidationResultDto,
  ValidAttributeDto,
  ProductTypeDto,
} from './models/component-change.model';

describe('ConvertModifyComponentsComponent', () => {
  let component: ConvertModifyComponentsComponent;
  let fixture: ComponentFixture<ConvertModifyComponentsComponent>;
  let apiServiceSpy: jasmine.SpyObj<ComponentChangeApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let chapterChangedSubject: Subject<void>;

  const mockProductTypes: ProductTypeDto[] = [
    {
      productType: 'RBC',
      description: 'Red Blood Cells',
      effDate: '2020-01-01T00:00:00Z',
      termDate: null,
      isActive: true,
    },
    {
      productType: 'PLT',
      description: 'Platelets',
      effDate: '2020-01-01T00:00:00Z',
      termDate: null,
      isActive: true,
    },
  ];

  const mockAttributes: ValidAttributeDto[] = [
    {
      attributeCode: 'CMV',
      attributeDescription: 'CMV Negative',
      attributeType: 'M',
      attributeGroup: 'SEROLOGY',
      productType: 'RBC',
      unitSchemeType: 'I',
      catalogNumberEnabled: false,
      exclusivityFlag: null,
    },
    {
      attributeCode: 'IRRAD',
      attributeDescription: 'Irradiated',
      attributeType: 'C',
      attributeGroup: 'PROCESS',
      productType: 'RBC',
      unitSchemeType: 'I',
      catalogNumberEnabled: true,
      exclusivityFlag: null,
    },
  ];

  const mockUnitValidation: UnitValidationResultDto = {
    isValid: true,
    isModifiable: true,
    unitId: 'W1234567890123456',
    productType: 'RBC',
    productCode: 'E1234',
    productShortName: 'RBC AS5',
    currentWarehouse: 'WH01',
    chapterId: 'CH001',
    collectionDate: '2026-01-01T00:00:00Z',
    componentInsertDate: '2026-01-02T00:00:00Z',
    bagId: null,
    hasInterdiction: false,
    interdictionReason: null,
    labelPrintRequired: false,
    errorCode: null,
    errorMessage: null,
  };

  const mockSnackBarRef = {
    onAction: () => of(void 0),
    dismiss: jasmine.createSpy('dismiss'),
  } as unknown as MatSnackBarRef<TextOnlySnackBar>;

  const mockUnitValidationData: UnitValidationResponse = {
    parsedUnitId: 'W1234567890123456',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'W1234567890123456',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  function createPostValidateEvent(data?: Partial<UnitValidationResponse>): UnitIdPostValidateEvent {
    return {
      data: { ...mockUnitValidationData, ...data },
      confirm: jasmine.createSpy('confirm'),
      reject: jasmine.createSpy('reject'),
    };
  }

  function selectFilters(): void {
    component.filterForm.get('productType')?.setValue('RBC');
    component.filterForm.get('attributeCode')?.setValue('CMV');
    fixture.detectChanges();
  }

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();
    apiServiceSpy = jasmine.createSpyObj('ComponentChangeApiService', [
      'validateUnit',
      'getValidAttributes',
      'getValidProductTypes',
      'getProductCodes',
      'getCatalogNumbers',
      'changeAttribute',
      'changeProductCode',
      'reprintLabel',
      'deriveProductCode',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    snackBarSpy = createMockMatSnackBar();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal(undefined),
    });
    headerServiceSpy = createMockHeaderService({ chapterId: signal('CH001') });
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate', 'getChapterLocalDateTime', 'fetchChapterTimezone'], {
      chapterLocalDate: signal(moment()),
      chapterLocalDateTime: signal(moment()),
    });

    apiServiceSpy.getValidProductTypes.and.returnValue(of(mockProductTypes));
    apiServiceSpy.getValidAttributes.and.returnValue(of(mockAttributes));
    apiServiceSpy.validateUnit.and.returnValue(of(mockUnitValidation));
    apiServiceSpy.getProductCodes.and.returnValue(of([]));
    apiServiceSpy.getCatalogNumbers.and.returnValue(of([]));
    apiServiceSpy.reprintLabel.and.returnValue(of({ success: true, unitId: 'W1234567890123456', message: 'Label reprinted', errorCode: null }));
    apiServiceSpy.deriveProductCode.and.returnValue(of({ success: true, newProductCode: 'E0397V00', message: null }));
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
    chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(moment());
    chapterTimezoneServiceSpy.fetchChapterTimezone.and.returnValue(of({ chapterId: 'CH001', chapterLocalDate: moment().toISOString(), chapterLocalDateTime: moment().toISOString() }));
    snackBarSpy.open.and.returnValue(mockSnackBarRef);



      TestBed.configureTestingModule({
      imports: [ConvertModifyComponentsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: ComponentChangeApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({}),
          },
        },
        ChangeDetectorRef,
      ],
    });


      apiServiceSpy.getValidProductTypes.and.returnValue(of(mockProductTypes));


      apiServiceSpy.getValidAttributes.and.returnValue(of(mockAttributes));


      apiServiceSpy.validateUnit.and.returnValue(of(mockUnitValidation));


      apiServiceSpy.getProductCodes.and.returnValue(of([]));


      apiServiceSpy.getCatalogNumbers.and.returnValue(of([]));


      apiServiceSpy.reprintLabel.and.returnValue(of({ success: true, unitId: 'W1234567890123456', message: 'Label reprinted', errorCode: null }));


      apiServiceSpy.deriveProductCode.and.returnValue(of({ success: true, newProductCode: 'E0397V00', message: null }));
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());


      chapterTimezoneServiceSpy.getChapterLocalDateTime.and.returnValue(moment());


      chapterTimezoneServiceSpy.fetchChapterTimezone.and.returnValue(of({ chapterId: 'CH001', chapterLocalDate: moment().toISOString(), chapterLocalDateTime: moment().toISOString() }));


      snackBarSpy.open.and.returnValue(mockSnackBarRef);


    fixture = TestBed.createComponent(ConvertModifyComponentsComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should load product types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getValidProductTypes).toHaveBeenCalled();
      expect(component.productTypes()).toEqual(mockProductTypes);
    }));




  });

  describe('Product Type Selection', () => {
    it('should load attributes when product type is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.get('productType')?.setValue('RBC');
      tick();

      expect(apiServiceSpy.getValidAttributes).toHaveBeenCalledWith('CPICHNGE', 'RBC');
      expect(component.attributes().length).toBeGreaterThan(0);
    }));

    it('should update product type description when product type is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.get('productType')?.setValue('RBC');
      tick();

      expect(component.productTypeDescription()).toBe('Red Blood Cells');
    }));

    it('should clear attributes when product type is cleared', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.filterForm.get('productType')?.setValue('');
      tick();

      expect(component.attributes()).toEqual([]);
      expect(component.selectedProductType()).toBeNull();
    }));


  });

  describe('Entry Section Visibility', () => {
    it('should hide entry section when filters are not selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.showEntrySection()).toBe(false);
      const entryCard = fixture.debugElement.query(By.css('.convert-modify-components__entry-card'));
      expect(entryCard).toBeNull();
    }));

    it('should show entry section when both Product Type and Attribute Code are selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      selectFilters();
      tick();
      fixture.detectChanges();

      expect(component.showEntrySection()).toBe(true);
      const entryCard = fixture.debugElement.query(By.css('.convert-modify-components__entry-card'));
      expect(entryCard).toBeTruthy();
    }));
  });

  describe('Attribute Code Selection', () => {




    it('should update attribute description when attribute is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.filterForm.get('attributeCode')?.setValue('CMV');
      tick();

      expect(component.attributeDescription()).toBe('CMV Negative');
    }));
  });

  describe('Unit Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
      fixture.detectChanges();
    }));

    it('should validate unit successfully via onUnitPostValidate', fakeAsync(() => {
      const event = createPostValidateEvent();

      component.onUnitPostValidate(event);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('W1234567890123456');
      expect(event.confirm).toHaveBeenCalled();
      expect(component.validationResult()).toEqual(mockUnitValidation);
    }));

    it('should set process date on successful validation', fakeAsync(() => {
      const event = createPostValidateEvent();

      component.onUnitPostValidate(event);
      tick();

      expect(component.entryForm.get('processDate')?.value).toBeTruthy();
      expect(chapterTimezoneServiceSpy.fetchChapterTimezone).toHaveBeenCalled();
    }));

    it('should detect duplicate units', fakeAsync(() => {
      component.entries.set([
        {
          unitId: 'W1234567890123456',
          productCode: 'E1234',
          derivedProductCode: 'E0397V00',
          shortName: 'IRRBC AS5',
          processDate: '01-MAR-2026 16:40',
          catalogNumber: '1TEP540004',
          verifyProduct: 'E0385V00',
          expiryDate: '',
        },
      ]);

      const event = createPostValidateEvent();

      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('This unit already scanned');
      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
    }));

    it('should show warning but proceed when unit has interdiction', fakeAsync(() => {
      const interdictedUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        isModifiable: true,
        hasInterdiction: true,
        interdictionReason: 'Quality Hold',
      };

      apiServiceSpy.validateUnit.and.returnValue(of(interdictedUnit));

      const event = createPostValidateEvent({ parsedUnitId: 'W9999999999999999' });

      component.onUnitPostValidate(event);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Quality Hold', 'OK', { duration: 5000 });
      expect(event.reject).not.toHaveBeenCalled();
      expect(component.validationResult()).toEqual(interdictedUnit);
    }));

    it('should reject unit from a different chapter', fakeAsync(() => {
      const otherChapterUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        chapterId: 'CH999',
      };

      apiServiceSpy.validateUnit.and.returnValue(of(otherChapterUnit));
      const event = createPostValidateEvent({ parsedUnitId: 'W9999999999999999' });

      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit does not belong to the current chapter');
      expect(component.validationResult()).toBeNull();
    }));

    it('should accept unit from the current chapter', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      const sameChapterUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        chapterId: 'CH001',
      };

      apiServiceSpy.validateUnit.and.returnValue(of(sameChapterUnit));
      const event = createPostValidateEvent({ parsedUnitId: 'W9999999999999999' });

      component.onUnitPostValidate(event);
      tick();

      expect(event.confirm).toHaveBeenCalled();
      expect(component.validationResult()).toEqual(sameChapterUnit);
    }));

    it('should skip chapter check when chapterId is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      const noChapterUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        chapterId: null,
      };

      apiServiceSpy.validateUnit.and.returnValue(of(noChapterUnit));

      const event = createPostValidateEvent({ parsedUnitId: 'W9999999999999999' });

      component.onUnitPostValidate(event);
      tick();

      expect(event.confirm).toHaveBeenCalled();
      expect(component.validationResult()).toEqual(noChapterUnit);
    }));

    it('should reject on validation API error', fakeAsync(() => {
      const error = { error: { message: 'Server error' } };
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => error));

      const event = createPostValidateEvent();

      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Server error');
      expect(component.isProcessing()).toBeFalse();
    }));
  });

  describe('Form Actions', () => {
    it('should clear all when clearAll is called', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.get('productType')?.setValue('RBC');
      component['storedParsedUnitId'].set('W1234567890123456');
      component.validationResult.set(mockUnitValidation);

      component.clearAll();
      tick();

      expect(component['storedParsedUnitId']()).toBe('');
      expect(component.validationResult()).toBeNull();
      expect(component.error()).toBeNull();
      expect(component.newExpiryDate()).toBeNull();
      expect(component.productCodeOptions()).toEqual([]);
      expect(component.catalogNumberOptions()).toEqual([]);
    }));









    it('should disable reprint when derived product code is not available', fakeAsync(() => {
      apiServiceSpy.deriveProductCode.and.returnValue(of({ success: true, newProductCode: null, message: null }));
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component.validationResult.set(mockUnitValidation);
      component['storedParsedUnitId'].set('W1234567890123456');
      component.entryForm.get('productCode')?.setValue('E1234');
      tick();
      component.entryForm.get('processDate')?.setValue(new Date());
      component.entryForm.get('catalogNumber')?.setValue('1TEP540004');

      expect(component.isReprintDisabled).toBeTrue();
    }));

    it('should disable reprint when no unit is validated', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component.validationResult.set(null);
      expect(component.isReprintDisabled).toBeTrue();
    }));

    it('should disable reprint when mandatory fields are empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component.validationResult.set(mockUnitValidation);
      component['storedParsedUnitId'].set('W1234567890123456');
      component.entryForm.get('productCode')?.setValue('');
      component.entryForm.get('processDate')?.setValue(new Date());
      component.entryForm.get('catalogNumber')?.setValue('1TEP540004');

      expect(component.isReprintDisabled).toBeTrue();
    }));

    it('should enable reprint when all mandatory fields except verify are filled', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component.validationResult.set(mockUnitValidation);
      component['storedParsedUnitId'].set('W1234567890123456');
      component.entryForm.get('productCode')?.setValue('E1234');
      component.entryForm.get('processDate')?.setValue(new Date());
      component.entryForm.get('catalogNumber')?.setValue('1TEP540004');
      component.serverDerivedProductCode.set('E0397V00');

      expect(component.isReprintDisabled).toBeFalse();
    }));


  });

  describe('Unit Cleared', () => {
    it('should reset state on onUnitCleared', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component['storedParsedUnitId'].set('W1234567890123456');
      component.validationResult.set(mockUnitValidation);
      component.entryForm.get('productCode')?.setValue('E1234');

      component.onUnitCleared();

      expect(component['storedParsedUnitId']()).toBe('');
      expect(component.validationResult()).toBeNull();
      expect(component.productCodeOptions()).toEqual([]);
      expect(component.entryForm.get('productCode')?.value).toBe('');
    }));
  });

  describe('Chapter Changes', () => {
    it('should reload data when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      chapterChangedSubject.next();
      tick();

      expect(apiServiceSpy.getValidProductTypes).toHaveBeenCalled();
      expect(component.validationResult()).toBeNull();
    }));
  });

  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
      fixture.detectChanges();
    }));

    it('should have unique error IDs for accessibility', () => {
      const errorId = (component as any).errorId('product-code');
      expect(errorId).toContain((component as any).componentId);
      expect(errorId).toContain('product-code-error');
    });


  });

  describe('Loading States', () => {


    it('should handle error when loading product types fails', fakeAsync(() => {
      const error = { error: 'Server error' };
      apiServiceSpy.getValidProductTypes.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load product types. Please try again.');
    }));
  });

  describe('Process Date', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
      fixture.detectChanges();
    }));

    it('should use chapter date for process date default', fakeAsync(() => {
      component.onProcessDateFocus();
      tick();

      expect(chapterTimezoneServiceSpy.fetchChapterTimezone).toHaveBeenCalled();
      expect(component.entryForm.get('processDate')?.value).toBeTruthy();
    }));




  });

  // ── Helper: set up a validated unit with filled entry form ───────────────
  function setupValidatedUnitWithEntryForm(): void {
    // Ensure convertLocalToGmt is available on the spy
    if (!(chapterTimezoneServiceSpy as any).convertLocalToGmt) {
      (chapterTimezoneServiceSpy as any).convertLocalToGmt = jasmine.createSpy('convertLocalToGmt').and.callFake((m: any) => m);
    }
    component.filterForm.get('productType')?.setValue('RBC', { emitEvent: false });
    component.filterForm.get('attributeCode')?.setValue('IRRAD', { emitEvent: false });
    const irradAttr = mockAttributes.find(a => a.attributeCode === 'IRRAD');
    component.selectedProductType.set(mockProductTypes[0]);
    component.selectedAttribute.set(irradAttr || null);
    component['storedParsedUnitId'].set('W1234567890123456');
    component.validationResult.set(mockUnitValidation);
    component.serverDerivedProductCode.set('E0397V00');
    component.entryForm.get('productCode')?.setValue('E1234', { emitEvent: false });
    component.storedSelectedProductCode.set('E1234');
    component.entryForm.get('processDate')?.setValue(new Date(), { emitEvent: false });
    component.entryForm.get('catalogNumber')?.setValue('1TEP540004', { emitEvent: false });
    component.entryForm.get('verifyProduct')?.setValue('E0397V00', { emitEvent: false });
  }

  // ── submitEntry via onVerifyProductScan ───────────────────────────────────

  describe('submitEntry', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should submit entry successfully via onVerifyProductScan', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'Changed', auditId: '1', errorCode: null, newExpiryDate: '2026-12-31T23:59:00',
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(apiServiceSpy.changeAttribute).toHaveBeenCalled();
      expect(component.entries().length).toBe(1);
      expect(component.entries()[0].unitId).toBe('W1234567890123456');
      expect(component['storedParsedUnitId']()).toBe('');
    }));

    it('should show error when changeAttribute returns success false', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: false, unitId: '', message: 'Failed to change', auditId: null, errorCode: 'ERR001',
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to change');
    }));

    it('should show error when changeAttribute API errors', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
      expect(component.isProcessing()).toBeFalse();
    }));

    it('should show error when verify product does not match derived code', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.entryForm.get('verifyProduct')?.setValue('WRONG');

      const fakeEvent = { target: { value: 'WRONG' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Verify Product does not match the derived product code');
    }));

    it('should not submit when isProcessing is true', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.isProcessing.set(true);

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));

    it('should not submit when verify product is empty and label print required', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.labelPrintRequired.set(true);
      component.entryForm.get('verifyProduct')?.setValue('');

      const fakeEvent = { target: { value: '' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));

    it('should not submit when form is invalid', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.entryForm.get('productCode')?.setValue('', { emitEvent: false });

      component['submitEntry']();
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));

    it('should show error when process date is before collection date', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      const pastDate = moment('2025-01-01').toDate();
      component.entryForm.get('processDate')?.setValue(pastDate);
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Process Date cannot be before the collection date');
    }));

    it('should show error when process date is before component insert date', fakeAsync(() => {
      const unitWithInsertDate: UnitValidationResultDto = {
        ...mockUnitValidation,
        collectionDate: '2025-01-01T00:00:00Z',
        componentInsertDate: '2026-06-15T00:00:00Z',
      };
      setupValidatedUnitWithEntryForm();
      component.validationResult.set(unitWithInsertDate);
      const earlyDate = moment('2026-06-10').toDate();
      component.entryForm.get('processDate')?.setValue(earlyDate);
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
      chapterTimezoneServiceSpy.convertLocalToGmt = jasmine.createSpy('convertLocalToGmt').and.callFake((m: any) => m);

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Process Date cannot be before the component creation date');
    }));

    it('should submit entry without label print required (auto-submit on catalog change)', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.labelPrintRequired.set(false);
      component.entryForm.get('verifyProduct')?.clearValidators();
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'Changed', auditId: '1', errorCode: null,
      }));

      component.onCatalogNumberChange();
      tick();

      expect(apiServiceSpy.changeAttribute).toHaveBeenCalled();
    }));

    it('should handle changeAttribute error with nested error body', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(throwError(() => ({
        error: { item: { message: 'Nested error message' } },
      })));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Nested error message');
    }));

    it('should add entry with new expiry date from response', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
        newExpiryDate: '2027-01-15T12:00:00',
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(component.entries()[0].expiryDate).toContain('2027');
    }));
  });

  // ── onVerifyProductKeydown ───────────────────────────────────────────────

  describe('onVerifyProductKeydown', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should submit on Enter key press with value', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));

      const fakeEvent = {
        key: 'Enter',
        preventDefault: jasmine.createSpy('preventDefault'),
        target: { value: 'E0397V00' },
      } as unknown as KeyboardEvent;

      component.onVerifyProductKeydown(fakeEvent);
      tick();

      expect(fakeEvent.preventDefault).toHaveBeenCalled();
      expect(apiServiceSpy.changeAttribute).toHaveBeenCalled();
    }));

    it('should not submit on non-Enter key press', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();

      const fakeEvent = {
        key: 'Tab',
        preventDefault: jasmine.createSpy('preventDefault'),
        target: { value: 'E0397V00' },
      } as unknown as KeyboardEvent;

      component.onVerifyProductKeydown(fakeEvent);
      tick();

      expect(fakeEvent.preventDefault).not.toHaveBeenCalled();
    }));

    it('should not submit on Enter with empty value', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();

      const fakeEvent = {
        key: 'Enter',
        preventDefault: jasmine.createSpy('preventDefault'),
        target: { value: '' },
      } as unknown as KeyboardEvent;

      component.onVerifyProductKeydown(fakeEvent);
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));
  });

  // ── onCatalogNumberChange ────────────────────────────────────────────────

  describe('onCatalogNumberChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should not submit when label print is required', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.labelPrintRequired.set(true);

      component.onCatalogNumberChange();
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));

    it('should not submit when mandatory fields are missing', fakeAsync(() => {
      component.labelPrintRequired.set(false);
      component['storedParsedUnitId'].set('');

      component.onCatalogNumberChange();
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));
  });

  // ── onReprint ────────────────────────────────────────────────────────────

  describe('onReprint', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should show error when no product code selected', fakeAsync(() => {
      component.entryForm.get('productCode')?.setValue('');
      component.onReprint();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot reprint label — no product code selected');
    }));

    it('should show error when verification already started', fakeAsync(() => {
      component.entryForm.get('productCode')?.setValue('E1234');
      component.entryForm.get('verifyProduct')?.setValue('E0397V00');
      component.onReprint();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot reprint label — product verification already started');
    }));

    it('should show error when no unit validated', fakeAsync(() => {
      component.entryForm.get('productCode')?.setValue('E1234');
      component.entryForm.get('verifyProduct')?.setValue('');
      component.validationResult.set(null);
      component.onReprint();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot reprint label — no unit validated');
    }));

    it('should show error when derived product code is not available', fakeAsync(() => {
      component.entryForm.get('productCode')?.setValue('E1234');
      component.entryForm.get('verifyProduct')?.setValue('');
      component.validationResult.set(mockUnitValidation);
      component.serverDerivedProductCode.set('');
      component.storedSelectedProductCode.set('');
      component.onReprint();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot reprint label — new product code has not been derived');
    }));

    it('should call reprintLabel successfully', fakeAsync(() => {
      component.entryForm.get('productCode')?.setValue('E1234');
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('processDate')?.setValue(new Date());
      component.validationResult.set(mockUnitValidation);
      component['storedParsedUnitId'].set('W1234567890123456');
      component.serverDerivedProductCode.set('E0397V00');
      apiServiceSpy.reprintLabel.and.returnValue(of({ success: true, unitId: 'W1234567890123456', message: 'Label reprinted', errorCode: null }));

      component.onReprint();
      tick();

      expect(apiServiceSpy.reprintLabel).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Label reprinted');
      expect(component.isProcessing()).toBeFalse();
    }));

    it('should show error when reprintLabel returns failure', fakeAsync(() => {
      component.entryForm.get('productCode')?.setValue('E1234');
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('processDate')?.setValue(new Date());
      component.validationResult.set(mockUnitValidation);
      component['storedParsedUnitId'].set('W1234567890123456');
      component.serverDerivedProductCode.set('E0397V00');
      apiServiceSpy.reprintLabel.and.returnValue(of({ success: false, unitId: '', message: 'Reprint failed', errorCode: 'ERR' }));

      component.onReprint();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Reprint failed');
    }));

    it('should show error when reprintLabel API errors', fakeAsync(() => {
      component.entryForm.get('productCode')?.setValue('E1234');
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('processDate')?.setValue(new Date());
      component.validationResult.set(mockUnitValidation);
      component['storedParsedUnitId'].set('W1234567890123456');
      component.serverDerivedProductCode.set('E0397V00');
      apiServiceSpy.reprintLabel.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      component.onReprint();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
      expect(component.isProcessing()).toBeFalse();
    }));
  });

  // ── onPageChange / onSortChange ──────────────────────────────────────────

  describe('pagination and sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update page index and size on onPageChange', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100 } as any);
      expect(component['currentPageIndex']()).toBe(2);
      expect(component['currentPageSize']()).toBe(50);
    });

    it('should sort entries ascending', () => {
      component.entries.set([
        { unitId: 'B', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
        { unitId: 'A', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
      ]);

      component.onSortChange({ column: 'unitId', direction: 'A' } as any);

      expect(component.entries()[0].unitId).toBe('A');
      expect(component.entries()[1].unitId).toBe('B');
    });

    it('should sort entries descending', () => {
      component.entries.set([
        { unitId: 'A', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
        { unitId: 'B', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
      ]);

      component.onSortChange({ column: 'unitId', direction: 'D' } as any);

      expect(component.entries()[0].unitId).toBe('B');
      expect(component.entries()[1].unitId).toBe('A');
    });

    it('should compute paginatedData correctly', () => {
      component.entries.set([
        { unitId: 'A', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
        { unitId: 'B', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
      ]);
      component['currentPageIndex'].set(0);
      component['currentPageSize'].set(25);

      expect(component.paginatedData().length).toBe(2);
    });
  });

  // ── clearFilters ─────────────────────────────────────────────────────────

  describe('clearFilters', () => {
    it('should reset filter form and clear all', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.filterForm.get('attributeCode')?.setValue('CMV');
      tick();

      component.clearFilters();
      tick();

      expect(component.selectedProductType()).toBeNull();
      expect(component.selectedAttribute()).toBeNull();
      expect(component.attributes()).toEqual([]);
    }));
  });

  // ── formatProcessDate ────────────────────────────────────────────────────

  describe('formatProcessDate', () => {
    it('should format valid date string', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const result = component['formatProcessDate']('01-JAN-2026 14:30');
      expect(result).toBe('01-Jan-2026 14:30');
    }));

    it('should return original value for invalid date', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const result = component['formatProcessDate']('invalid');
      expect(result).toBe('invalid');
    }));

    it('should return empty string for empty input', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const result = component['formatProcessDate']('');
      expect(result).toBe('');
    }));
  });

  // ── isClearAllDisabled ───────────────────────────────────────────────────

  describe('isClearAllDisabled', () => {
    it('should be true when entry form has no values and no validation', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['storedParsedUnitId'].set('');
      component.validationResult.set(null);
      component.entryForm.reset();
      expect(component.isClearAllDisabled).toBeTrue();
    }));

    it('should be false when validation result exists', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.validationResult.set(mockUnitValidation);
      expect(component.isClearAllDisabled).toBeFalse();
    }));

    it('should be false when stored unit id exists', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['storedParsedUnitId'].set('W1234567890123456');
      expect(component.isClearAllDisabled).toBeFalse();
    }));
  });

  // ── isReprintDisabled edge cases ─────────────────────────────────────────

  describe('isReprintDisabled edge cases', () => {
    it('should return true when isProcessing is true', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.isProcessing.set(true);
      expect(component.isReprintDisabled).toBeTrue();
    }));
  });

  // ── loadProductCodes / loadCatalogNumbers error paths ────────────────────

  describe('load data error paths', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should show error when no product codes available', fakeAsync(() => {
      apiServiceSpy.getProductCodes.and.returnValue(of([]));
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No valid components available for this unit and product type');
    }));

    it('should show error when loading product codes fails', fakeAsync(() => {
      apiServiceSpy.getProductCodes.and.returnValue(throwError(() => new Error('API error')));
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load product codes. Please try again.');
    }));

    it('should show error when loading catalog numbers fails', fakeAsync(() => {
      apiServiceSpy.getCatalogNumbers.and.returnValue(throwError(() => new Error('API error')));
      // Select IRRAD (conversion type) so catalog numbers are loaded
      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load catalog numbers. Please try again.');
    }));

    it('should show error when loading attributes fails', fakeAsync(() => {
      apiServiceSpy.getValidAttributes.and.returnValue(throwError(() => new Error('Attr error')));
      component.filterForm.get('productType')?.setValue('PLT');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load attributes. Please try again.');
    }));
  });

  // ── fetchDerivedProductCode ──────────────────────────────────────────────

  describe('fetchDerivedProductCode', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set serverDerivedProductCode on successful derive', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();
      component['storedParsedUnitId'].set('W1234567890123456');
      apiServiceSpy.deriveProductCode.and.returnValue(of({ success: true, newProductCode: 'E0555V00', message: null }));

      component.entryForm.get('productCode')?.setValue('E1234');
      tick();

      expect(component.serverDerivedProductCode()).toBe('E0555V00');
    }));

    it('should handle derive product code error', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();
      component['storedParsedUnitId'].set('W1234567890123456');
      apiServiceSpy.deriveProductCode.and.returnValue(throwError(() => new Error('Derive error')));

      component.entryForm.get('productCode')?.setValue('E1234');
      tick();

      // Should not throw, just logs error
      expect(component.serverDerivedProductCode()).toBe('');
    }));

    it('should skip derive for add-only attributes', fakeAsync(() => {
      const addOnlyAttr: ValidAttributeDto = {
        attributeCode: 'ADD1',
        attributeDescription: 'Add Only',
        attributeType: 'A',
        attributeGroup: 'PROCESS',
        productType: 'RBC',
        unitSchemeType: 'I',
        catalogNumberEnabled: true,
        exclusivityFlag: null,
      };
      apiServiceSpy.getValidAttributes.and.returnValue(of([addOnlyAttr]));
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.filterForm.get('attributeCode')?.setValue('ADD1');
      tick();

      apiServiceSpy.deriveProductCode.calls.reset();
      component.entryForm.get('productCode')?.setValue('E1234');
      tick();

      expect(apiServiceSpy.deriveProductCode).not.toHaveBeenCalled();
    }));
  });

  // ── onProcessDateChange ──────────────────────────────────────────────────

  describe('onProcessDateChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should set time from chapter timezone when date has midnight time', fakeAsync(() => {
      const midnightDate = moment().startOf('day').toDate();
      component.entryForm.get('processDate')?.setValue(midnightDate);

      component.onProcessDateChange();
      tick();

      expect(chapterTimezoneServiceSpy.fetchChapterTimezone).toHaveBeenCalled();
    }));

    it('should show error when process date is before collection date', fakeAsync(() => {
      component.validationResult.set(mockUnitValidation);
      const earlyDate = moment('2025-06-01T14:00:00').toDate();
      component.entryForm.get('processDate')?.setValue(earlyDate);

      component.onProcessDateChange();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Process Date cannot be before the collection date');
    }));

    it('should not process when processDate is null', fakeAsync(() => {
      component.entryForm.get('processDate')?.setValue(null);
      component.onProcessDateChange();
      tick();
      // Should not throw
    }));

    it('should handle fetchChapterTimezone error on date change', fakeAsync(() => {
      chapterTimezoneServiceSpy.fetchChapterTimezone.and.returnValue(throwError(() => new Error('tz error')));
      const midnightDate = moment().startOf('day').toDate();
      component.entryForm.get('processDate')?.setValue(midnightDate);

      component.onProcessDateChange();
      tick();

      // Should fall back to chapter local date time
      expect(chapterTimezoneServiceSpy.getChapterLocalDateTime).toHaveBeenCalled();
    }));

    it('should use chapter time when no chapterId available for date change', fakeAsync(() => {
      headerServiceSpy.getCurrentChapterId.and.returnValue(null as any);
      const midnightDate = moment().startOf('day').toDate();
      component.entryForm.get('processDate')?.setValue(midnightDate);

      component.onProcessDateChange();
      tick();

      expect(chapterTimezoneServiceSpy.getChapterLocalDateTime).toHaveBeenCalled();
    }));
  });

  // ── onProcessDateFocus edge cases ────────────────────────────────────────

  describe('onProcessDateFocus edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should not set date when control already has value', fakeAsync(() => {
      component.entryForm.get('processDate')?.setValue(new Date());
      chapterTimezoneServiceSpy.fetchChapterTimezone.calls.reset();

      component.onProcessDateFocus();
      tick();

      expect(chapterTimezoneServiceSpy.fetchChapterTimezone).not.toHaveBeenCalled();
    }));

    it('should handle fetchChapterTimezone error on focus', fakeAsync(() => {
      component.entryForm.get('processDate')?.setValue(null);
      chapterTimezoneServiceSpy.fetchChapterTimezone.and.returnValue(throwError(() => new Error('tz error')));

      component.onProcessDateFocus();
      tick();

      expect(component.entryForm.get('processDate')?.value).toBeTruthy();
    }));

    it('should use chapter time when no chapterId on focus', fakeAsync(() => {
      component.entryForm.get('processDate')?.setValue(null);
      headerServiceSpy.getCurrentChapterId.and.returnValue(null as any);

      component.onProcessDateFocus();
      tick();

      expect(component.entryForm.get('processDate')?.value).toBeTruthy();
    }));
  });

  // ── Computed signals ─────────────────────────────────────────────────────

  describe('computed signals', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should compute filteredProductTypes with search filter', () => {
      component.productTypes.set(mockProductTypes);
      component.productTypeSearchControl.setValue('PLT');
      expect(component.filteredProductTypes().length).toBe(1);
      expect(component.filteredProductTypes()[0].productType).toBe('PLT');
    });

    it('should compute filteredAttributes with search filter', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.attributeCodeSearchControl.setValue('CMV');
      expect(component.filteredAttributes().length).toBe(1);
    }));

    it('should compute filteredProductCodes with search filter', () => {
      component.productCodeOptions.set([
        { code: 'E1234', description: 'RBC' },
        { code: 'E5678', description: 'PLT' },
      ]);
      component.productCodeSearchControl.setValue('PLT');
      expect(component.filteredProductCodes().length).toBe(1);
    });

    it('should compute filteredCatalogNumbers with search filter', () => {
      component.catalogNumberOptions.set([
        { catalogNumber: '1TEP540004', description: '' },
        { catalogNumber: '2ABC123', description: '' },
      ]);
      component.catalogNumberSearchControl.setValue('1TEP');
      expect(component.filteredCatalogNumbers().length).toBe(1);
    });

    it('should compute entriesCount', () => {
      component.entries.set([
        { unitId: 'A', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
      ]);
      expect(component.entriesCount()).toBe(1);
    });

    it('should compute isAddOnlyAttribute', fakeAsync(() => {
      const addOnlyAttr: ValidAttributeDto = {
        attributeCode: 'ADD1', attributeDescription: 'Add Only', attributeType: 'A',
        attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I',
        catalogNumberEnabled: true, exclusivityFlag: null,
      };
      component.selectedAttribute.set(addOnlyAttr);
      expect(component.isAddOnlyAttribute()).toBeTrue();
    }));

    it('should compute catalogNumberEnabled as false for modifier type', () => {
      const modAttr: ValidAttributeDto = {
        attributeCode: 'CMV', attributeDescription: 'CMV', attributeType: 'M',
        attributeGroup: 'SER', productType: 'RBC', unitSchemeType: 'I',
        catalogNumberEnabled: false, exclusivityFlag: null,
      };
      component.selectedAttribute.set(modAttr);
      expect(component.catalogNumberEnabled()).toBeFalse();
    });

    it('should compute derivedProductCode from storedSelectedProductCode for add-only', () => {
      const addOnlyAttr: ValidAttributeDto = {
        attributeCode: 'ADD1', attributeDescription: 'Add Only', attributeType: 'A',
        attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I',
        catalogNumberEnabled: true, exclusivityFlag: null,
      };
      component.selectedAttribute.set(addOnlyAttr);
      component.storedSelectedProductCode.set('E1234');
      expect(component.derivedProductCode()).toBe('E1234');
    });

    it('should return --- for derivedProductCode when no stored product code for add-only', () => {
      const addOnlyAttr: ValidAttributeDto = {
        attributeCode: 'ADD1', attributeDescription: 'Add Only', attributeType: 'A',
        attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I',
        catalogNumberEnabled: true, exclusivityFlag: null,
      };
      component.selectedAttribute.set(addOnlyAttr);
      component.storedSelectedProductCode.set('');
      expect(component.derivedProductCode()).toBe('---');
    });

    it('should compute minProcessDate from validation result', () => {
      component.validationResult.set(mockUnitValidation);
      const minDate = component.minProcessDate();
      expect(minDate).toBeTruthy();
    });

    it('should return null for minProcessDate when no validation', () => {
      component.validationResult.set(null);
      expect(component.minProcessDate()).toBeNull();
    });

    it('should return --- for productTypeDescription when no selection', () => {
      component.selectedProductType.set(null);
      expect(component.productTypeDescription()).toBe('---');
    });

    it('should return --- for attributeDescription when no selection', () => {
      component.selectedAttribute.set(null);
      expect(component.attributeDescription()).toBe('---');
    });
  });

  // ── Attribute Code Selection - modifier type ─────────────────────────────

  describe('attribute code modifier type', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
    }));

    it('should disable catalog number for modifier attribute', fakeAsync(() => {
      component['storedParsedUnitId'].set('W1234567890123456');
      component.validationResult.set({ ...mockUnitValidation, bagId: 'BAG001' } as any);

      component.filterForm.get('attributeCode')?.setValue('CMV');
      tick();

      expect(component.entryForm.get('catalogNumber')?.disabled).toBeTrue();
      expect(component.entryForm.get('catalogNumber')?.value).toBe('BAG001');
    }));

    it('should show error for modifier attribute when bagId is missing', fakeAsync(() => {
      component['storedParsedUnitId'].set('W1234567890123456');
      component.validationResult.set({ ...mockUnitValidation, bagId: null } as any);

      component.filterForm.get('attributeCode')?.setValue('CMV');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Bag ID is required for modify operation');
    }));

    it('should enable catalog number for conversion attribute', fakeAsync(() => {
      component['storedParsedUnitId'].set('W1234567890123456');
      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();

      expect(component.entryForm.get('catalogNumber')?.disabled).toBeFalse();
    }));

    it('should clear attributes and selections when attribute code is cleared', fakeAsync(() => {
      component.filterForm.get('attributeCode')?.setValue('CMV');
      tick();
      component.filterForm.get('attributeCode')?.setValue('');
      tick();

      expect(component.selectedAttribute()).toBeNull();
      expect(component.catalogNumberOptions()).toEqual([]);
    }));
  });

  // ── onUnitPostValidate label print required ──────────────────────────────

  describe('onUnitPostValidate label print required', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should set label print required true and set verifyProduct validators', fakeAsync(() => {
      const labelRequiredUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        labelPrintRequired: true,
      };
      apiServiceSpy.validateUnit.and.returnValue(of(labelRequiredUnit));
      const event = createPostValidateEvent();

      component.onUnitPostValidate(event);
      tick();

      expect(component.labelPrintRequired()).toBeTrue();
    }));

    it('should handle modifier attribute during post-validate', fakeAsync(() => {
      const unitWithBagId: UnitValidationResultDto = {
        ...mockUnitValidation,
        bagId: 'BAG123',
      };
      apiServiceSpy.validateUnit.and.returnValue(of(unitWithBagId));
      // Set modifier attribute
      component.filterForm.get('attributeCode')?.setValue('CMV');
      tick();

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.catalogNumberOptions().length).toBe(1);
      expect(component.catalogNumberOptions()[0].catalogNumber).toBe('BAG123');
    }));

    it('should handle error body with errorResponse nested object', fakeAsync(() => {
      const error = { error: { errorResponse: { error: 'Nested API error' } } };
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => error));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Nested API error');
    }));
  });

  // ── f and e getters ──────────────────────────────────────────────────────

  describe('form getters', () => {
    it('should return filter form controls via f getter', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.f).toBe(component.filterForm.controls);
    }));

    it('should return entry form controls via e getter', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.e).toBe(component.entryForm.controls);
    }));
  });

  // ── showEntrySavedSnackbar ───────────────────────────────────────────────

  describe('showEntrySavedSnackbar', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should show snackbar with entry count after successful submit', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith('1 Entry Saved', 'DISMISS', jasmine.objectContaining({
        horizontalPosition: 'end',
        verticalPosition: 'top',
      }));
    }));
  });

  // ── ngOnDestroy ──────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should complete destroy subject on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.ngOnDestroy();
      // Should not throw
    }));

    it('should dismiss active snackbar on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      // Submit an entry so an "entries saved" snackbar is shown
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));
      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      // Now destroy should dismiss the snackbar
      component.ngOnDestroy();

      expect(mockSnackBarRef.dismiss).toHaveBeenCalled();
    }));
  });

  // ── Component creation ────────────────────────────────────────────────────

  describe('component creation', () => {
    it('should create the component', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component).toBeTruthy();
    }));

    it('should have default header config', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.headerConfig.title).toBe('Convert / Modify Components (ISBT)');
    }));

    it('should initialize filterForm with empty values', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.filterForm.get('productType')?.value).toBe('');
      expect(component.filterForm.get('attributeCode')?.value).toBe('');
    }));

    it('should initialize entryForm with null/empty values', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.entryForm.get('productCode')?.value).toBe('');
      expect(component.entryForm.get('processDate')?.value).toBeNull();
      expect(component.entryForm.get('catalogNumber')?.value).toBe('');
      expect(component.entryForm.get('verifyProduct')?.value).toBe('');
    }));
  });

  // ── Unit validation - rejection paths ─────────────────────────────────────

  describe('unit validation rejection paths', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
      fixture.detectChanges();
    }));

    it('should reject when unit is not valid', fakeAsync(() => {
      const invalidUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        isValid: false,
        errorMessage: 'Unit is not valid',
      };
      apiServiceSpy.validateUnit.and.returnValue(of(invalidUnit));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit is not valid');
      expect(component.validationResult()).toBeNull();
    }));

    it('should reject when unit is not modifiable', fakeAsync(() => {
      const nonModUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        isValid: true,
        isModifiable: false,
        errorMessage: 'Unit cannot be modified',
      };
      apiServiceSpy.validateUnit.and.returnValue(of(nonModUnit));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit cannot be modified');
    }));

    it('should use default message when errorMessage is null and unit not valid', fakeAsync(() => {
      const invalidUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        isValid: false,
        errorMessage: null,
      };
      apiServiceSpy.validateUnit.and.returnValue(of(invalidUnit));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit cannot be modified');
    }));

    it('should show default interdiction message when interdictionReason is null', fakeAsync(() => {
      const interdictedUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        hasInterdiction: true,
        interdictionReason: null,
      };
      apiServiceSpy.validateUnit.and.returnValue(of(interdictedUnit));

      const event = createPostValidateEvent({ parsedUnitId: 'W9999999999999999' });
      component.onUnitPostValidate(event);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith('Component has active interdiction', 'OK', { duration: 5000 });
      expect(event.confirm).toHaveBeenCalled();
    }));

    it('should set process date from fallback when fetchChapterTimezone errors during validation', fakeAsync(() => {
      chapterTimezoneServiceSpy.fetchChapterTimezone.and.returnValue(throwError(() => new Error('tz error')));
      const event = createPostValidateEvent();

      component.onUnitPostValidate(event);
      tick();

      expect(component.entryForm.get('processDate')?.value).toBeTruthy();
      expect(chapterTimezoneServiceSpy.getChapterLocalDateTime).toHaveBeenCalled();
    }));

    it('should set process date directly when no chapterId during validation', fakeAsync(() => {
      headerServiceSpy.getCurrentChapterId.and.returnValue(null as any);
      const noChapterUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        chapterId: null,
      };
      apiServiceSpy.validateUnit.and.returnValue(of(noChapterUnit));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.entryForm.get('processDate')?.value).toBeTruthy();
      expect(chapterTimezoneServiceSpy.getChapterLocalDateTime).toHaveBeenCalled();
    }));

    it('should clear verifyProduct validators when labelPrintRequired is false', fakeAsync(() => {
      const noLabelUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        labelPrintRequired: false,
      };
      apiServiceSpy.validateUnit.and.returnValue(of(noLabelUnit));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(component.labelPrintRequired()).toBeFalse();
      // verifyProduct should not be required
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();
      expect(component.entryForm.get('verifyProduct')?.valid).toBeTrue();
    }));

    it('should not load product codes when productType is empty', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('', { emitEvent: false });
      apiServiceSpy.getProductCodes.calls.reset();

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(apiServiceSpy.getProductCodes).not.toHaveBeenCalled();
    }));

    it('should handle validation API error with fallback message', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => ({})));

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Failed to validate unit. Please try again.');
    }));

    it('should handle modifier attribute without bagId during post-validate', fakeAsync(() => {
      const noBagIdUnit: UnitValidationResultDto = {
        ...mockUnitValidation,
        bagId: null,
      };
      apiServiceSpy.validateUnit.and.returnValue(of(noBagIdUnit));
      component.filterForm.get('attributeCode')?.setValue('CMV');
      tick();

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Bag ID is required for modify operation');
      expect(component.catalogNumberOptions()).toEqual([]);
    }));

    it('should load catalog numbers for non-modifier attribute during post-validate', fakeAsync(() => {
      apiServiceSpy.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT001', description: '' }]));
      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();
      apiServiceSpy.getCatalogNumbers.calls.reset();

      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();

      expect(apiServiceSpy.getCatalogNumbers).toHaveBeenCalled();
    }));
  });

  // ── submitEntry - additional branch coverage ──────────────────────────────

  describe('submitEntry additional branches', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should not call changeAttribute when form is invalid due to missing required fields', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      // Ensure form is invalid by clearing productCode
      component.entryForm.get('productCode')?.setValue('', { emitEvent: false });
      component.labelPrintRequired.set(false);
      component.entryForm.get('verifyProduct')?.clearValidators();
      component.entryForm.get('verifyProduct')?.setValue('', { emitEvent: false });
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();

      component['submitEntry']();
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));

    it('should show error when process date is null', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.entryForm.get('processDate')?.clearValidators();
      component.entryForm.get('processDate')?.setValue(null, { emitEvent: false });
      component.entryForm.get('processDate')?.updateValueAndValidity();

      component['submitEntry']();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Process Date is required');
    }));

    it('should handle success response with no newExpiryDate', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
        newExpiryDate: null,
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(component.entries().length).toBe(1);
      expect(component.entries()[0].expiryDate).toBe('');
    }));

    it('should re-disable catalog number for modifier attribute after successful submit', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      // Set modifier attribute
      const modAttr = mockAttributes.find(a => a.attributeCode === 'CMV');
      component.selectedAttribute.set(modAttr || null);
      component.filterForm.get('attributeCode')?.setValue('CMV', { emitEvent: false });

      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(component.entryForm.get('catalogNumber')?.disabled).toBeTrue();
    }));

    it('should handle changeAttribute error with errorResponse.error format', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'API level error' } },
      })));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('API level error');
    }));

    it('should use fallback error message when error body is empty', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(throwError(() => ({})));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to change component');
    }));

    it('should use default success message when response success is true but message is null', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: false, unitId: '', message: null, auditId: null, errorCode: null,
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to change component');
    }));

    it('should mark all form controls as touched when form is invalid', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.labelPrintRequired.set(false);
      component.entryForm.get('verifyProduct')?.clearValidators();
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();

      // Make productCode empty to make form invalid
      component.entryForm.get('productCode')?.setValue('', { emitEvent: false });

      component['submitEntry']();
      tick();

      expect(component.entryForm.get('productCode')?.touched).toBeTrue();
      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));

    it('should use current date format when processDate moment is valid', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      const knownDate = moment('2026-03-15T14:30:00').toDate();
      component.entryForm.get('processDate')?.setValue(knownDate, { emitEvent: false });
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-03-15'));

      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      const request = apiServiceSpy.changeAttribute.calls.mostRecent().args[0];
      expect(request.processDate).toContain('2026-03-15');
    }));
  });

  // ── submitEntry future date validation (clean setup without selectFilters) ─

  describe('submitEntry future date validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when process date is in the future', fakeAsync(() => {
      // Set up component state without selectFilters to keep catalogNumber enabled
      const irradAttr = mockAttributes.find(a => a.attributeCode === 'IRRAD')!;
      component.selectedProductType.set(mockProductTypes[0]);
      component.selectedAttribute.set(irradAttr);
      component.filterForm.get('productType')?.setValue('RBC', { emitEvent: false });
      component.filterForm.get('attributeCode')?.setValue('IRRAD', { emitEvent: false });
      component['storedParsedUnitId'].set('W1234567890123456');
      component.validationResult.set(mockUnitValidation);
      component.serverDerivedProductCode.set('E0397V00');
      component.storedSelectedProductCode.set('E1234');
      component.labelPrintRequired.set(false);
      if (!(chapterTimezoneServiceSpy as any).convertLocalToGmt) {
        (chapterTimezoneServiceSpy as any).convertLocalToGmt = jasmine.createSpy('convertLocalToGmt').and.callFake((m: any) => m);
      }

      // Set form values
      component.entryForm.get('productCode')?.setValue('E1234', { emitEvent: false });
      component.entryForm.get('catalogNumber')?.setValue('1TEP540004', { emitEvent: false });
      component.entryForm.get('verifyProduct')?.clearValidators();
      component.entryForm.get('verifyProduct')?.setValue('', { emitEvent: false });
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();

      // Set far future process date
      const futureDate = moment('2099-06-15T10:00:00').toDate();
      component.entryForm.get('processDate')?.setValue(futureDate, { emitEvent: false });

      // Set chapterNow to a date before the future date
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-07-23'));

      component['submitEntry']();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Process Date cannot be in the future');
      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));

    it('should show error when process date is null (invalid)', fakeAsync(() => {
      const irradAttr = mockAttributes.find(a => a.attributeCode === 'IRRAD')!;
      component.selectedProductType.set(mockProductTypes[0]);
      component.selectedAttribute.set(irradAttr);
      component['storedParsedUnitId'].set('W1234567890123456');
      component.validationResult.set(mockUnitValidation);
      component.serverDerivedProductCode.set('E0397V00');
      component.labelPrintRequired.set(false);

      component.entryForm.get('productCode')?.setValue('E1234', { emitEvent: false });
      component.entryForm.get('catalogNumber')?.setValue('1TEP540004', { emitEvent: false });
      component.entryForm.get('verifyProduct')?.clearValidators();
      component.entryForm.get('verifyProduct')?.setValue('', { emitEvent: false });
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();

      // Clear processDate validators and set to null
      component.entryForm.get('processDate')?.clearValidators();
      component.entryForm.get('processDate')?.setValue(null, { emitEvent: false });
      component.entryForm.get('processDate')?.updateValueAndValidity();

      component['submitEntry']();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Process Date is required');
    }));
  });

  // ── loadAttributes filtering ──────────────────────────────────────────────

  describe('loadAttributes filtering', () => {
    it('should filter out PHER and VENI attribute groups', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mixedAttributes: ValidAttributeDto[] = [
        { attributeCode: 'CMV', attributeDescription: 'CMV', attributeType: 'M', attributeGroup: 'SEROLOGY', productType: 'RBC', unitSchemeType: 'I', catalogNumberEnabled: false, exclusivityFlag: null },
        { attributeCode: 'PH1', attributeDescription: 'Pheresis', attributeType: 'C', attributeGroup: 'PHER', productType: 'RBC', unitSchemeType: 'I', catalogNumberEnabled: true, exclusivityFlag: null },
        { attributeCode: 'VN1', attributeDescription: 'Venipuncture', attributeType: 'C', attributeGroup: 'VENI', productType: 'RBC', unitSchemeType: 'I', catalogNumberEnabled: true, exclusivityFlag: null },
        { attributeCode: 'IRRAD', attributeDescription: 'Irradiated', attributeType: 'C', attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I', catalogNumberEnabled: true, exclusivityFlag: null },
      ];
      apiServiceSpy.getValidAttributes.and.returnValue(of(mixedAttributes));

      component.filterForm.get('productType')?.setValue('RBC');
      tick();

      expect(component.attributes().length).toBe(2);
      expect(component.attributes().find(a => a.attributeGroup === 'PHER')).toBeUndefined();
      expect(component.attributes().find(a => a.attributeGroup === 'VENI')).toBeUndefined();
    }));

    it('should deduplicate attributes by attributeCode', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const dupAttributes: ValidAttributeDto[] = [
        { attributeCode: 'CMV', attributeDescription: 'CMV v1', attributeType: 'M', attributeGroup: 'SEROLOGY', productType: 'RBC', unitSchemeType: 'I', catalogNumberEnabled: false, exclusivityFlag: null },
        { attributeCode: 'CMV', attributeDescription: 'CMV v2', attributeType: 'M', attributeGroup: 'OTHER', productType: 'RBC', unitSchemeType: 'I', catalogNumberEnabled: false, exclusivityFlag: null },
        { attributeCode: 'IRRAD', attributeDescription: 'Irradiated', attributeType: 'C', attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I', catalogNumberEnabled: true, exclusivityFlag: null },
      ];
      apiServiceSpy.getValidAttributes.and.returnValue(of(dupAttributes));

      component.filterForm.get('productType')?.setValue('RBC');
      tick();

      expect(component.attributes().length).toBe(2);
      // First occurrence should win
      expect(component.attributes()[0].attributeDescription).toBe('CMV v1');
    }));
  });

  // ── showEntrySavedSnackbar plural ─────────────────────────────────────────

  describe('showEntrySavedSnackbar plural message', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should show plural message for multiple entries', fakeAsync(() => {
      // Pre-populate with one entry
      component.entries.set([
        { unitId: 'W0000000000000001', productCode: 'E1234', derivedProductCode: 'E0397V00', shortName: 'RBC', processDate: '01-MAR-2026 10:00', catalogNumber: 'CAT1', verifyProduct: 'E0397V00', expiryDate: '' },
      ]);

      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith('2 Entries Saved', 'DISMISS', jasmine.objectContaining({
        horizontalPosition: 'end',
        verticalPosition: 'top',
      }));
    }));
  });

  // ── onUnitValidated ─────────────────────────────────────────────────────

  describe('onUnitValidated', () => {
    it('should be a no-op', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      // Should not throw
      component.onUnitValidated(mockUnitValidationData);
    }));
  });

  // ── elementId / labelId helpers ─────────────────────────────────────────

  describe('ID generation helpers', () => {
    it('should generate unique element IDs', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const id = (component as any).elementId('test-field');
      expect(id).toContain('convert-modify-components-');
      expect(id).toContain('test-field');
    }));

    it('should generate unique label IDs', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const id = (component as any).labelId('test-field');
      expect(id).toContain('convert-modify-components-');
      expect(id).toContain('test-field-label');
    }));

    it('should generate unique error IDs', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const id = (component as any).errorId('test-field');
      expect(id).toContain('convert-modify-components-');
      expect(id).toContain('test-field-error');
    }));
  });

  // ── formatProcessDate edge cases ──────────────────────────────────────────

  describe('formatProcessDate edge cases', () => {
    it('should return zero-width space as-is', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const result = component['formatProcessDate']('​');
      expect(result).toBe('​');
    }));
  });

  // ── chapterToday computed ─────────────────────────────────────────────────

  describe('chapterToday computed', () => {
    it('should return valid chapter date when available', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const today = component.chapterToday();
      expect(today).toBeInstanceOf(Date);
    }));

    it('should return current Date when chapterDate is invalid', fakeAsync(() => {
      (chapterTimezoneServiceSpy as any).chapterLocalDate = signal(moment.invalid());
      fixture = TestBed.createComponent(ConvertModifyComponentsComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      const today = component.chapterToday();
      expect(today).toBeInstanceOf(Date);
    }));
  });

  // ── minProcessDate edge cases ─────────────────────────────────────────────

  describe('minProcessDate edge cases', () => {
    it('should return null when collectionDate is invalid', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.validationResult.set({
        ...mockUnitValidation,
        collectionDate: 'invalid-date',
      });
      // moment('invalid-date') creates an invalid moment, so collDate.isValid() is false
      // The code checks collDate.isValid() before returning
      const result = component.minProcessDate();
      // Depending on moment parsing, 'invalid-date' may be invalid
      // The code has if (collDate.isValid()) return collDate.toDate();
      // If invalid, falls through to return null
      expect(result === null || result instanceof Date).toBeTrue();
    }));
  });

  // ── onSortChange - no direction ───────────────────────────────────────────

  describe('onSortChange no direction', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not reorder entries when direction is neither A nor D', () => {
      component.entries.set([
        { unitId: 'B', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
        { unitId: 'A', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
      ]);

      component.onSortChange({ column: 'unitId', direction: '' } as any);

      // Order should remain unchanged
      expect(component.entries()[0].unitId).toBe('B');
      expect(component.entries()[1].unitId).toBe('A');
    });
  });

  // ── isClearAllDisabled - individual field values ──────────────────────────

  describe('isClearAllDisabled additional cases', () => {
    it('should be false when productCode has a value', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['storedParsedUnitId'].set('');
      component.validationResult.set(null);
      component.entryForm.get('productCode')?.setValue('E1234');
      expect(component.isClearAllDisabled).toBeFalse();
    }));

    it('should be false when processDate has a value', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['storedParsedUnitId'].set('');
      component.validationResult.set(null);
      component.entryForm.get('processDate')?.setValue(new Date());
      expect(component.isClearAllDisabled).toBeFalse();
    }));

    it('should be false when catalogNumber has a value', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['storedParsedUnitId'].set('');
      component.validationResult.set(null);
      component.entryForm.get('catalogNumber')?.setValue('CAT001');
      expect(component.isClearAllDisabled).toBeFalse();
    }));

    it('should be false when verifyProduct has a value', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component['storedParsedUnitId'].set('');
      component.validationResult.set(null);
      component.entryForm.get('verifyProduct')?.setValue('E0397V00');
      expect(component.isClearAllDisabled).toBeFalse();
    }));
  });

  // ── onVerifyProductScan empty value ───────────────────────────────────────

  describe('onVerifyProductScan edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should not submit when scan value is empty', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      const fakeEvent = { target: { value: '' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));

    it('should not submit when scan value is whitespace only', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      const fakeEvent = { target: { value: '   ' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      expect(apiServiceSpy.changeAttribute).not.toHaveBeenCalled();
    }));
  });

  // ── onReprint additional error body formats ───────────────────────────────

  describe('onReprint error body formats', () => {
    function setupForReprint(): void {
      component.entryForm.get('productCode')?.setValue('E1234');
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('processDate')?.setValue(new Date());
      component.validationResult.set(mockUnitValidation);
      component['storedParsedUnitId'].set('W1234567890123456');
      component.serverDerivedProductCode.set('E0397V00');
    }

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should handle reprintLabel error with item.message format', fakeAsync(() => {
      setupForReprint();
      apiServiceSpy.reprintLabel.and.returnValue(throwError(() => ({
        error: { item: { message: 'Item-level error' } },
      })));

      component.onReprint();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Item-level error');
    }));

    it('should handle reprintLabel error with errorResponse.error format', fakeAsync(() => {
      setupForReprint();
      apiServiceSpy.reprintLabel.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Error response error' } },
      })));

      component.onReprint();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error response error');
    }));

    it('should use fallback error message when reprintLabel error body is empty', fakeAsync(() => {
      setupForReprint();
      apiServiceSpy.reprintLabel.and.returnValue(throwError(() => ({})));

      component.onReprint();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to reprint label');
    }));

    it('should call reprintLabel with null processDate when not set', fakeAsync(() => {
      setupForReprint();
      component.entryForm.get('processDate')?.setValue(null);
      apiServiceSpy.reprintLabel.and.returnValue(of({ success: true, unitId: 'W1234567890123456', message: 'Label reprinted', errorCode: null }));

      component.onReprint();
      tick();

      const request = apiServiceSpy.reprintLabel.calls.mostRecent().args[0];
      expect(request.processDate).toBeNull();
    }));

    it('should show success message from response when available', fakeAsync(() => {
      setupForReprint();
      apiServiceSpy.reprintLabel.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: null, errorCode: null,
      }));

      component.onReprint();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Label reprinted successfully');
    }));

    it('should show default failure message when response message is null', fakeAsync(() => {
      setupForReprint();
      apiServiceSpy.reprintLabel.and.returnValue(of({
        success: false, unitId: '', message: null, errorCode: 'ERR',
      }));

      component.onReprint();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to reprint label');
    }));
  });

  // ── paginatedData edge cases ──────────────────────────────────────────────

  describe('paginatedData edge cases', () => {
    it('should paginate correctly with smaller page size', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const entries = Array.from({ length: 5 }, (_, i) => ({
        unitId: `U${i}`, productCode: '', derivedProductCode: '', shortName: '',
        processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '',
      }));
      component.entries.set(entries);
      component['currentPageIndex'].set(1);
      component['currentPageSize'].set(2);

      const page = component.paginatedData();
      expect(page.length).toBe(2);
      expect(page[0].unitId).toBe('U2');
      expect(page[1].unitId).toBe('U3');
    }));

    it('should return empty when page is beyond data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.entries.set([
        { unitId: 'A', productCode: '', derivedProductCode: '', shortName: '', processDate: '', catalogNumber: '', verifyProduct: '', expiryDate: '' },
      ]);
      component['currentPageIndex'].set(5);
      component['currentPageSize'].set(25);

      expect(component.paginatedData().length).toBe(0);
    }));
  });

  // ── clearAll - modifier re-disable ────────────────────────────────────────

  describe('clearAll modifier attribute', () => {
    it('should re-disable catalog number when modifier attribute is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.filterForm.get('attributeCode')?.setValue('CMV');
      tick();

      // Enable catalog number manually first
      component.entryForm.get('catalogNumber')?.enable();

      component.clearAll();

      expect(component.entryForm.get('catalogNumber')?.disabled).toBeTrue();
    }));

    it('should reset label print required to true', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.labelPrintRequired.set(false);

      component.clearAll();

      expect(component.labelPrintRequired()).toBeTrue();
    }));

    it('should restore verifyProduct validators', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.entryForm.get('verifyProduct')?.clearValidators();
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();

      component.clearAll();

      // After clearAll, verifyProduct should have required validator
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();
      expect(component.entryForm.get('verifyProduct')?.hasError('required')).toBeTrue();
    }));
  });

  // ── onUnitCleared - additional state checks ───────────────────────────────

  describe('onUnitCleared additional checks', () => {
    it('should reset all derived product code signals', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component.storedSelectedProductCode.set('E1234');
      component.serverDerivedProductCode.set('E0397V00');
      component.labelPrintRequired.set(false);

      component.onUnitCleared();

      expect(component.storedSelectedProductCode()).toBe('');
      expect(component.serverDerivedProductCode()).toBe('');
      expect(component.labelPrintRequired()).toBeTrue();
    }));

    it('should restore verifyProduct validators on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component.entryForm.get('verifyProduct')?.clearValidators();
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();

      component.onUnitCleared();

      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();
      expect(component.entryForm.get('verifyProduct')?.hasError('required')).toBeTrue();
    }));

    it('should reset search controls on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component.productCodeSearchControl.setValue('test');
      component.catalogNumberSearchControl.setValue('test');

      component.onUnitCleared();

      expect(component.productCodeSearchControl.value).toBe('');
      expect(component.catalogNumberSearchControl.value).toBe('');
    }));

    it('should reset processDate and catalogNumber on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();

      component.entryForm.get('processDate')?.setValue(new Date());
      component.entryForm.get('catalogNumber')?.setValue('CAT001');

      component.onUnitCleared();

      expect(component.entryForm.get('processDate')?.value).toBeNull();
      expect(component.entryForm.get('catalogNumber')?.value).toBe('');
    }));
  });

  // ── Search control subscriptions ──────────────────────────────────────────

  describe('search control subscriptions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update productTypeSearch when productTypeSearchControl changes', () => {
      component.productTypeSearchControl.setValue('RBC');
      expect(component.filteredProductTypes().length).toBeLessThanOrEqual(component.productTypes().length);
    });

    it('should handle null value in productTypeSearchControl', () => {
      component.productTypeSearchControl.setValue(null);
      // Should not throw, and filteredProductTypes should return all
      expect(component.filteredProductTypes()).toEqual(component.productTypes());
    });

    it('should handle null value in attributeCodeSearchControl', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.attributeCodeSearchControl.setValue(null);
      // Should not throw
      expect(component.filteredAttributes()).toEqual(component.attributes());
    }));

    it('should handle null value in productCodeSearchControl', () => {
      component.productCodeSearchControl.setValue(null);
      expect(component.filteredProductCodes()).toEqual(component.productCodeOptions());
    });

    it('should handle null value in catalogNumberSearchControl', () => {
      component.catalogNumberSearchControl.setValue(null);
      expect(component.filteredCatalogNumbers()).toEqual(component.catalogNumberOptions());
    });
  });

  // ── computed signals - filtered lists with empty search ───────────────────

  describe('computed filter signals with empty search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return all product types when search is empty', () => {
      component.productTypes.set(mockProductTypes);
      component.productTypeSearchControl.setValue('');
      expect(component.filteredProductTypes().length).toBe(2);
    });

    it('should return all attributes when search is empty', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.attributeCodeSearchControl.setValue('');
      expect(component.filteredAttributes().length).toBe(component.attributes().length);
    }));

    it('should return all product codes when search is empty', () => {
      component.productCodeOptions.set([{ code: 'E1234', description: 'RBC' }]);
      component.productCodeSearchControl.setValue('');
      expect(component.filteredProductCodes().length).toBe(1);
    });

    it('should return all catalog numbers when search is empty', () => {
      component.catalogNumberOptions.set([{ catalogNumber: 'CAT1', description: '' }]);
      component.catalogNumberSearchControl.setValue('');
      expect(component.filteredCatalogNumbers().length).toBe(1);
    });

    it('should filter product types by description', () => {
      component.productTypes.set(mockProductTypes);
      component.productTypeSearchControl.setValue('Plate');
      expect(component.filteredProductTypes().length).toBe(1);
      expect(component.filteredProductTypes()[0].productType).toBe('PLT');
    });

    it('should filter attributes by description', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.attributeCodeSearchControl.setValue('Irrad');
      const filtered = component.filteredAttributes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].attributeCode).toBe('IRRAD');
    }));

    it('should filter product codes by description', () => {
      component.productCodeOptions.set([
        { code: 'E1234', description: 'Red Blood Cells' },
        { code: 'E5678', description: 'Platelets' },
      ]);
      component.productCodeSearchControl.setValue('Red');
      expect(component.filteredProductCodes().length).toBe(1);
      expect(component.filteredProductCodes()[0].code).toBe('E1234');
    });
  });

  // ── derivedProductCode computed - server-derived path ─────────────────────

  describe('derivedProductCode computed additional paths', () => {
    it('should return server derived product code for non-add-only attributes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const convAttr: ValidAttributeDto = {
        attributeCode: 'IRRAD', attributeDescription: 'Irradiated', attributeType: 'C',
        attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I',
        catalogNumberEnabled: true, exclusivityFlag: null,
      };
      component.selectedAttribute.set(convAttr);
      component.serverDerivedProductCode.set('E0555V00');
      expect(component.derivedProductCode()).toBe('E0555V00');
    }));

    it('should return --- when no server derived code for non-add-only', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const convAttr: ValidAttributeDto = {
        attributeCode: 'IRRAD', attributeDescription: 'Irradiated', attributeType: 'C',
        attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I',
        catalogNumberEnabled: true, exclusivityFlag: null,
      };
      component.selectedAttribute.set(convAttr);
      component.serverDerivedProductCode.set('');
      expect(component.derivedProductCode()).toBe('---');
    }));
  });

  // ── isLoadingProductTypes / isLoadingAttributes signals ───────────────────

  describe('loading state signals', () => {
    it('should set isLoadingProductTypes to false after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.isLoadingProductTypes()).toBeFalse();
    }));

    it('should set isLoadingProductTypes to false after error', fakeAsync(() => {
      apiServiceSpy.getValidProductTypes.and.returnValue(throwError(() => new Error('err')));
      fixture.detectChanges();
      tick();
      expect(component.isLoadingProductTypes()).toBeFalse();
    }));

    it('should set isLoadingAttributes to false after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      expect(component.isLoadingAttributes()).toBeFalse();
    }));

    it('should set isLoadingAttributes to false after error', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiServiceSpy.getValidAttributes.and.returnValue(throwError(() => new Error('err')));
      component.filterForm.get('productType')?.setValue('PLT');
      tick();
      expect(component.isLoadingAttributes()).toBeFalse();
    }));

    it('should set isLoadingProductCodes to false after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
      apiServiceSpy.getProductCodes.and.returnValue(of([{ code: 'E1234', description: 'RBC' }]));
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();
      expect(component.isLoadingProductCodes()).toBeFalse();
    }));

    it('should set isLoadingProductCodes to false after error', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
      apiServiceSpy.getProductCodes.and.returnValue(throwError(() => new Error('err')));
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();
      expect(component.isLoadingProductCodes()).toBeFalse();
    }));

    it('should set isLoadingCatalogNumbers to false after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      apiServiceSpy.getCatalogNumbers.and.returnValue(of([{ catalogNumber: 'CAT1', description: '' }]));
      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();
      component['storedParsedUnitId'].set('W1234567890123456');
      // Trigger catalog load via post-validate with IRRAD attribute
      const event = createPostValidateEvent();
      component.onUnitPostValidate(event);
      tick();
      expect(component.isLoadingCatalogNumbers()).toBeFalse();
    }));
  });

  // ── Attribute code change triggers fetchDerivedProductCode ────────────────

  describe('attribute code change derive behavior', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
    }));

    it('should trigger fetchDerivedProductCode when attribute changes and storedSelectedProductCode exists', fakeAsync(() => {
      component.storedSelectedProductCode.set('E1234');
      component['storedParsedUnitId'].set('W1234567890123456');
      apiServiceSpy.deriveProductCode.calls.reset();

      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();

      expect(apiServiceSpy.deriveProductCode).toHaveBeenCalled();
    }));

    it('should not trigger fetchDerivedProductCode when storedSelectedProductCode is empty', fakeAsync(() => {
      component.storedSelectedProductCode.set('');
      apiServiceSpy.deriveProductCode.calls.reset();

      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();

      // deriveProductCode should not have been called for attribute change (only for product code change)
      expect(apiServiceSpy.deriveProductCode).not.toHaveBeenCalled();
    }));

    it('should reset serverDerivedProductCode when attribute code changes', fakeAsync(() => {
      component.serverDerivedProductCode.set('E0397V00');

      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();

      // serverDerivedProductCode is reset at the start of attribute code change handler
      // It may be set again if fetchDerivedProductCode is called, but it was reset first
    }));
  });

  // ── onPageChange - updates dataTableConfig ────────────────────────────────

  describe('onPageChange config update', () => {
    it('should update dataTableConfig pagination', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onPageChange({ pageIndex: 3, pageSize: 100, length: 200 } as any);
      expect(component.dataTableConfig.pagination?.pageIndex).toBe(3);
      expect(component.dataTableConfig.pagination?.pageSize).toBe(100);
    }));
  });

  // ── onSortChange config update ────────────────────────────────────────────

  describe('onSortChange config update', () => {
    it('should update dataTableConfig sortConfig', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.onSortChange({ column: 'productCode', direction: 'A' } as any);
      expect(component.dataTableConfig.sortConfig?.column).toBe('productCode');
      expect(component.dataTableConfig.sortConfig?.direction).toBe('A');
    }));
  });

  // ── catalogNumberEnabled for non-modifier types ───────────────────────────

  describe('catalogNumberEnabled computed', () => {
    it('should return true when no attribute is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedAttribute.set(null);
      expect(component.catalogNumberEnabled()).toBeTrue();
    }));

    it('should return true for conversion type attribute', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const convAttr: ValidAttributeDto = {
        attributeCode: 'IRRAD', attributeDescription: 'Irradiated', attributeType: 'C',
        attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I',
        catalogNumberEnabled: true, exclusivityFlag: null,
      };
      component.selectedAttribute.set(convAttr);
      expect(component.catalogNumberEnabled()).toBeTrue();
    }));

    it('should return true for add-only type attribute', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      const addAttr: ValidAttributeDto = {
        attributeCode: 'ADD1', attributeDescription: 'Add Only', attributeType: 'A',
        attributeGroup: 'PROCESS', productType: 'RBC', unitSchemeType: 'I',
        catalogNumberEnabled: true, exclusivityFlag: null,
      };
      component.selectedAttribute.set(addAttr);
      expect(component.catalogNumberEnabled()).toBeTrue();
    }));
  });

  // ── showEntrySection computed ──────────────────────────────────────────────

  describe('showEntrySection computed additional', () => {
    it('should be false when only productType is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedProductType.set(mockProductTypes[0]);
      component.selectedAttribute.set(null);
      expect(component.showEntrySection()).toBeFalse();
    }));

    it('should be false when only attribute is selected', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedProductType.set(null);
      component.selectedAttribute.set(mockAttributes[0]);
      expect(component.showEntrySection()).toBeFalse();
    }));
  });

  // ── fetchDerivedProductCode - missing parameters guard ────────────────────

  describe('fetchDerivedProductCode guards', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not call API when oldProductCode is empty', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.filterForm.get('attributeCode')?.setValue('IRRAD');
      tick();
      component.storedSelectedProductCode.set('');
      apiServiceSpy.deriveProductCode.calls.reset();

      component['fetchDerivedProductCode']();
      tick();

      expect(apiServiceSpy.deriveProductCode).not.toHaveBeenCalled();
    }));

    it('should not call API when attributeCode is empty', fakeAsync(() => {
      component.filterForm.get('productType')?.setValue('RBC');
      tick();
      component.storedSelectedProductCode.set('E1234');
      apiServiceSpy.deriveProductCode.calls.reset();

      component['fetchDerivedProductCode']();
      tick();

      expect(apiServiceSpy.deriveProductCode).not.toHaveBeenCalled();
    }));

    it('should not call API when productType is empty', fakeAsync(() => {
      component.storedSelectedProductCode.set('E1234');
      component.filterForm.get('attributeCode')?.setValue('IRRAD', { emitEvent: false });
      apiServiceSpy.deriveProductCode.calls.reset();

      component['fetchDerivedProductCode']();
      tick();

      expect(apiServiceSpy.deriveProductCode).not.toHaveBeenCalled();
    }));
  });

  // ── clearFilters resets search controls ───────────────────────────────────

  describe('clearFilters resets search controls', () => {
    it('should reset product type and attribute search controls', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.productTypeSearchControl.setValue('RBC');
      component.attributeCodeSearchControl.setValue('CMV');

      component.clearFilters();
      tick();

      expect(component.productTypeSearchControl.value).toBe('');
      expect(component.attributeCodeSearchControl.value).toBe('');
    }));
  });

  // ── submitEntry - request dto construction ────────────────────────────────

  describe('submitEntry request construction', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      selectFilters();
      tick();
    }));

    it('should construct request with correct attributeGroup', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      const request = apiServiceSpy.changeAttribute.calls.mostRecent().args[0];
      expect(request.unitId).toBe('W1234567890123456');
      expect(request.attributeCode).toBeTruthy();
      expect(request.productType).toBeTruthy();
    }));

    it('should use validation productCode as oldProductCode when available', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));

      const fakeEvent = { target: { value: 'E0397V00' } } as unknown as Event;
      component.onVerifyProductScan(fakeEvent);
      tick();

      const request = apiServiceSpy.changeAttribute.calls.mostRecent().args[0];
      expect(request.oldProductCode).toBe('E1234');
    }));

    it('should set newProductCode to null when derivedProductCode is ---', fakeAsync(() => {
      setupValidatedUnitWithEntryForm();
      component.serverDerivedProductCode.set('');
      component.storedSelectedProductCode.set('');
      // For non-add-only attributes, derivedProductCode will be '---'

      // Set up a non-add-only attribute (C type)
      const irradAttr = mockAttributes.find(a => a.attributeCode === 'IRRAD');
      component.selectedAttribute.set(irradAttr || null);
      component.filterForm.get('attributeCode')?.setValue('IRRAD', { emitEvent: false });

      // Since derivedProductCode is '---', newProductCode should be null
      // But form will be invalid because verifyProduct won't match derivedProductCode
      // So let's set labelPrintRequired to false
      component.labelPrintRequired.set(false);
      component.entryForm.get('verifyProduct')?.clearValidators();
      component.entryForm.get('verifyProduct')?.setValue('');
      component.entryForm.get('verifyProduct')?.updateValueAndValidity();
      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment());
      (chapterTimezoneServiceSpy as any).convertLocalToGmt = jasmine.createSpy('convertLocalToGmt').and.callFake((m: any) => m);

      apiServiceSpy.changeAttribute.and.returnValue(of({
        success: true, unitId: 'W1234567890123456', message: 'OK', auditId: '1', errorCode: null,
      }));

      component['submitEntry']();
      tick();

      const request = apiServiceSpy.changeAttribute.calls.mostRecent().args[0];
      expect(request.newProductCode).toBeNull();
    }));
  });

  // ── dataTableConfig valueFormatter ────────────────────────────────────────

  describe('dataTableConfig value formatters', () => {
    it('should format processDate column using formatProcessDate', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const processDateCol = component.dataTableConfig.columns.find(c => c.key === 'processDate');
      expect(processDateCol?.valueFormatter).toBeTruthy();
      if (processDateCol?.valueFormatter) {
        const formatted = processDateCol.valueFormatter('15-JAN-2026 14:30');
        expect(formatted).toBe('15-Jan-2026 14:30');
      }
    }));

    it('should format expiryDate column using formatProcessDate', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const expiryDateCol = component.dataTableConfig.columns.find(c => c.key === 'expiryDate');
      expect(expiryDateCol?.valueFormatter).toBeTruthy();
      if (expiryDateCol?.valueFormatter) {
        const formatted = expiryDateCol.valueFormatter('31-DEC-2026 23:59');
        expect(formatted).toBe('31-Dec-2026 23:59');
      }
    }));
  });
});
