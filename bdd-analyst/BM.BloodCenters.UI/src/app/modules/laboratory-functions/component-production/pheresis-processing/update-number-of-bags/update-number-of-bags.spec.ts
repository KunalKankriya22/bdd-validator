import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UpdateNumberOfBagsComponent } from './update-number-of-bags';
import { UpdateNumberOfBagsService } from './services/update-number-of-bags.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ValidateUnitData,
  ProductCode,
  ComponentPrefixItem,
  ReturnResult,
} from './models/update-number-of-bags.model';

describe('UpdateNumberOfBagsComponent', () => {
  let translateSpyObj: any;
  let pageHeaderSpyObj: any;
  let serviceSpyObj: any;
  let component: UpdateNumberOfBagsComponent;
  let fixture: ComponentFixture<UpdateNumberOfBagsComponent>;
  let serviceSpy: jasmine.SpyObj<UpdateNumberOfBagsService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockUnitDataISBT: ValidateUnitData = {
    unitId: 'W035211051822AB',
    collDate: '2026-05-25',
    codeScheme: 'I',
  };

  const mockUnitDataCodabar: ValidateUnitData = {
    unitId: 'TEST12345',
    collDate: '2026-05-25',
    codeScheme: 'C',
  };

  const mockValidateResponseISBT: ReturnResult<ValidateUnitData> = {
    success: true, message: 'Unit validated', error: null, errorCode: null,
    statusCode: 200, data: [mockUnitDataISBT], item: null, total: 1, errorResponse: {},
  };

  const mockValidateResponseCodabar: ReturnResult<ValidateUnitData> = {
    success: true, message: 'Unit validated', error: null, errorCode: null,
    statusCode: 200, data: [mockUnitDataCodabar], item: null, total: 1, errorResponse: {},
  };

  const mockProductCodes: ProductCode[] = [
    { productCode: 'E3087V00', productDesc: 'PLATELETS PHERESIS LR', productType: 'PLT' },
    { productCode: 'E0001AA', productDesc: 'RED BLOOD CELLS', productType: 'RBC' },
  ];

  const mockPrefixes: ComponentPrefixItem[] = [
    { componentPrefix: '01' },
    { componentPrefix: '02' },
  ];

  const mockSinglePrefix: ComponentPrefixItem[] = [
    { componentPrefix: '01' },
  ];

  const mockUpdateResponse: ReturnResult<boolean> = {
    success: true, message: 'Record saved successfully', error: null, errorCode: '8010',
    statusCode: 200, data: [true], item: null, total: null, errorResponse: {},
  };

  beforeEach(() => {

    serviceSpyObj = jasmine.createSpyObj('UpdateNumberOfBagsService', [
      'validateUnit', 'getProductCodes', 'getComponentPrefixes', 'updateBags',
    ]);
    const snackbarSpyObj = createMockSnackbarService();
    const headerSpyObj = createMockHeaderService();
    pageHeaderSpyObj = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal({ title: 'Update Number of Bags', subtitle: '' }),
    });
    translateSpyObj = jasmine.createSpyObj('TranslateService', ['instant', 'get', 'use'], {
      currentLang: 'en',
      onLangChange: of(),
      onTranslationChange: of(),
      onDefaultLangChange: of(),
    });
    translateSpyObj.instant.and.callFake((key: string) => key);
    translateSpyObj.get.and.callFake((key: string) => of(key));



      TestBed.configureTestingModule({
      imports: [UpdateNumberOfBagsComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: UpdateNumberOfBagsService, useValue: serviceSpyObj },
        { provide: SnackbarService, useValue: snackbarSpyObj },
        { provide: HeaderService, useValue: headerSpyObj },
        { provide: PageHeaderService, useValue: pageHeaderSpyObj },
        { provide: TranslateService, useValue: translateSpyObj },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) },
        },
      ],
    });


    


      serviceSpyObj.validateUnit.calls.reset();


      serviceSpyObj.getProductCodes.calls.reset();


      serviceSpyObj.getComponentPrefixes.calls.reset();


      serviceSpyObj.updateBags.calls.reset();


      pageHeaderSpyObj.getTitle.calls.reset();


      pageHeaderSpyObj.getSubtitle.calls.reset();


      translateSpyObj.instant.calls.reset();


      translateSpyObj.get.calls.reset();


      translateSpyObj.use.calls.reset();


      translateSpyObj.instant.and.callFake((key: string) => key);


      translateSpyObj.get.and.callFake((key: string) => of(key));


    fixture = TestBed.createComponent(UpdateNumberOfBagsComponent);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(UpdateNumberOfBagsService) as jasmine.SpyObj<UpdateNumberOfBagsService>;
    snackbarSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    serviceSpy.validateUnit.and.returnValue(of(mockValidateResponseCodabar));
    serviceSpy.getProductCodes.and.returnValue(of(mockProductCodes));
    serviceSpy.getComponentPrefixes.and.returnValue(of(mockPrefixes));
    serviceSpy.updateBags.and.returnValue(of(mockUpdateResponse));


    });

  describe('Component Initialization', () => {


    it('should initialize form with productCode, componentPrefix, and bagsUsed', () => {
      fixture.detectChanges();
      expect(component.form.get('productCode')).toBeTruthy();
      expect(component.form.get('componentPrefix')).toBeTruthy();
      expect(component.form.get('bagsUsed')).toBeTruthy();
    });

    it('should initialize with empty table data', () => {
      expect(component.tableData()).toEqual([]);
    });
  });

  describe('ISBT Code Scheme', () => {
    beforeEach(() => {
      serviceSpy.validateUnit.and.returnValue(of(mockValidateResponseISBT));
      fixture.detectChanges();
    });

    it('should auto-derive prefix from product code chars 7-8 for ISBT', fakeAsync(() => {
      const mockEvent = {
        data: { parsedUnitId: 'W035211051822AB', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(component.isISBT()).toBeTrue();

      component.form.patchValue({ productCode: 'E3087V00' });
      component.onProductCodeChange();
      tick();

      expect(component.form.get('componentPrefix')?.value).toBe('00');
      expect(serviceSpy.getComponentPrefixes).not.toHaveBeenCalled();
    }));

    it('should mark prefix as not navigable for ISBT', fakeAsync(() => {
      const mockEvent = {
        data: { parsedUnitId: 'W035211051822AB', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(component.isPrefixNavigable()).toBeFalse();
    }));
  });

  describe('Codabar Code Scheme', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should fetch prefixes from API for Codabar', fakeAsync(() => {
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(component.isPrefixNavigable()).toBeTrue();

      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();

      expect(serviceSpy.getComponentPrefixes).toHaveBeenCalled();
      expect(component.componentPrefixes().length).toBe(2);
    }));

    it('should auto-select prefix when only 1 exists', fakeAsync(() => {
      serviceSpy.getComponentPrefixes.and.returnValue(of(mockSinglePrefix));

      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();

      expect(component.form.get('componentPrefix')?.value).toBe('01');
    }));
  });

  describe('Submit on Bags Enter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();

      serviceSpy.getComponentPrefixes.and.returnValue(of(mockSinglePrefix));
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();
    }));

    it('should submit when Enter pressed on bags field with valid value', fakeAsync(() => {
      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(serviceSpy.updateBags).toHaveBeenCalledWith({
        unitId: 'TEST12345',
        productCode: 'E0001AA',
        componentPrefix: '01',
        bagsUsed: 3,
      });
      expect(component.tableData().length).toBe(1);
    }));




  });

  describe('Error Handling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();

      serviceSpy.getComponentPrefixes.and.returnValue(of(mockSinglePrefix));
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();
    }));

    it('should clear form and focus unit ID on failure', fakeAsync(() => {
      serviceSpy.updateBags.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed', errorCode: '0230' } }))
      );

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();
      tick(100);

      expect(snackbarSpy.showError).toHaveBeenCalled();
      expect(mockUnitIdField.clear).toHaveBeenCalled();
      expect(component.unitValidated()).toBeFalse();
    }));

    it('should clear form on unsuccessful API response', fakeAsync(() => {
      const failResponse: ReturnResult<boolean> = {
        success: false, message: 'Component not found', error: null, errorCode: '0151',
        statusCode: 400, data: null, item: null, total: null, errorResponse: {},
      };
      serviceSpy.updateBags.and.returnValue(of(failResponse));

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();
      tick(100);

      expect(snackbarSpy.showError).toHaveBeenCalled();
      expect(mockUnitIdField.clear).toHaveBeenCalled();
    }));
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate unit scans', fakeAsync(() => {
      fixture.detectChanges();
      serviceSpy.getComponentPrefixes.and.returnValue(of(mockSinglePrefix));

      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();

      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();

      component.form.patchValue({ bagsUsed: '2' });
      component.onBagsSubmit();
      tick();

      expect(component.tableData().length).toBe(1);

      component.unitValidated.set(true);
      component.validatedUnitData.set(mockUnitDataCodabar);
      component.form.patchValue({ productCode: 'E0001AA', componentPrefix: '01', bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(component.unitAlreadyScanned()).toBeTrue();
      expect(component.tableData().length).toBe(1);
    }));
  });

  describe('elementId', () => {
    it('should return a prefixed element id', () => {
      fixture.detectChanges();
      const id = component.elementId('test-field');
      expect(id).toContain('update-number-of-bags-');
      expect(id).toContain('-test-field');
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      fixture.detectChanges();
      expect(component.f).toBe(component.form.controls);
      expect(component.f['productCode']).toBeTruthy();
      expect(component.f['componentPrefix']).toBeTruthy();
      expect(component.f['bagsUsed']).toBeTruthy();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySub = (component as any).destroy$;
      const completeSpy = spyOn(destroySub, 'complete');
      const nextSpy = spyOn(destroySub, 'next');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require productCode', () => {
      component.form.patchValue({ productCode: '' });
      expect(component.form.get('productCode')?.hasError('required')).toBeTrue();
    });

    it('should require componentPrefix', () => {
      component.form.patchValue({ componentPrefix: '' });
      expect(component.form.get('componentPrefix')?.hasError('required')).toBeTrue();
    });

    it('should reject bagsUsed less than 1', () => {
      component.form.get('bagsUsed')?.setValue(0);
      expect(component.form.get('bagsUsed')?.hasError('min')).toBeTrue();
    });

    it('should reject bagsUsed greater than 9', () => {
      component.form.get('bagsUsed')?.setValue(10);
      expect(component.form.get('bagsUsed')?.hasError('max')).toBeTrue();
    });

    it('should accept bagsUsed value of 5', () => {
      component.form.get('bagsUsed')?.setValue(5);
      expect(component.form.get('bagsUsed')?.errors).toBeNull();
    });
  });

  describe('onUnitIdTab', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early if unit is already validated', () => {
      component.unitValidated.set(true);
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onUnitIdTab(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should return early if unit value is empty', () => {
      component.unitValidated.set(false);
      component.unitIdField = {
        unitIdControl: { value: '' },
        unitIdInput: { nativeElement: { blur: jasmine.createSpy('blur') } },
      } as any;
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onUnitIdTab(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should return early if unit value is only whitespace', () => {
      component.unitValidated.set(false);
      component.unitIdField = {
        unitIdControl: { value: '   ' },
        unitIdInput: { nativeElement: { blur: jasmine.createSpy('blur') } },
      } as any;
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onUnitIdTab(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent default and blur when unit value is present and not yet validated', () => {
      component.unitValidated.set(false);
      const blurSpy = jasmine.createSpy('blur');
      component.unitIdField = {
        unitIdControl: { value: 'TEST123' },
        unitIdInput: { nativeElement: { blur: blurSpy } },
      } as any;
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onUnitIdTab(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(blurSpy).toHaveBeenCalled();
    });
  });

  describe('onUnitPostValidate - error scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reject with errorCode message when response has errorCode', fakeAsync(() => {
      const failResponse: ReturnResult<ValidateUnitData> = {
        success: false, message: 'Unit not found', error: null, errorCode: '0063',
        statusCode: 400, data: null, item: null, total: 0, errorResponse: {},
      };
      serviceSpy.validateUnit.and.returnValue(of(failResponse));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID123', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Error:0063: Unit not found');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should reject with default message when response has no errorCode and no message', fakeAsync(() => {
      const failResponse: ReturnResult<ValidateUnitData> = {
        success: false, message: null, error: null, errorCode: null,
        statusCode: 400, data: null, item: null, total: 0, errorResponse: {},
      };
      serviceSpy.validateUnit.and.returnValue(of(failResponse));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID123', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Unit validation failed.');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should reject with message when response has message but no errorCode', fakeAsync(() => {
      const failResponse: ReturnResult<ValidateUnitData> = {
        success: false, message: 'Custom failure', error: null, errorCode: null,
        statusCode: 400, data: null, item: null, total: 0, errorResponse: {},
      };
      serviceSpy.validateUnit.and.returnValue(of(failResponse));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID123', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Custom failure');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should reject with errorCode and default message when errorCode present but message null', fakeAsync(() => {
      const failResponse: ReturnResult<ValidateUnitData> = {
        success: false, message: null, error: null, errorCode: '0188',
        statusCode: 400, data: null, item: null, total: 0, errorResponse: {},
      };
      serviceSpy.validateUnit.and.returnValue(of(failResponse));

      const mockEvent = {
        data: { parsedUnitId: 'INVALID123', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Error:0188: Unit validation failed.');
    }));

    it('should reject when response data is empty array', fakeAsync(() => {
      const failResponse: ReturnResult<ValidateUnitData> = {
        success: true, message: 'No data', error: null, errorCode: null,
        statusCode: 200, data: [], item: null, total: 0, errorResponse: {},
      };
      serviceSpy.validateUnit.and.returnValue(of(failResponse));

      const mockEvent = {
        data: { parsedUnitId: 'NODATA123', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalled();
      expect(component.isLoading()).toBeFalse();
    }));

    it('should reject with error message on HTTP error', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      const mockEvent = {
        data: { parsedUnitId: 'ERROR123', entryMode: 'M' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Server error');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should reject with default message on HTTP error without message', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      const mockEvent = {
        data: { parsedUnitId: 'ERROR123', entryMode: 'M' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Failed to validate unit.');
      expect(component.isLoading()).toBeFalse();
    }));

    it('should set isManualEntry true for entryMode M', fakeAsync(() => {
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'M' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(serviceSpy.validateUnit).toHaveBeenCalledWith({
        unitId: 'TEST12345',
        processCode: '',
        isManualEntry: true,
      });
    }));

    it('should format collection date as DD-MMM-YYYY uppercase', fakeAsync(() => {
      const responseWithDate: ReturnResult<ValidateUnitData> = {
        success: true, message: '', error: null, errorCode: null,
        statusCode: 200, data: [{ unitId: 'TEST123', collDate: '2026-01-15', codeScheme: 'C' }],
        item: null, total: 1, errorResponse: {},
      };
      serviceSpy.validateUnit.and.returnValue(of(responseWithDate));

      const mockEvent = {
        data: { parsedUnitId: 'TEST123', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(component.selectedCollectionDate()).toBe('15-JAN-2026');
    }));

    it('should set empty collection date when collDate is null', fakeAsync(() => {
      const responseNoDate: ReturnResult<ValidateUnitData> = {
        success: true, message: '', error: null, errorCode: null,
        statusCode: 200, data: [{ unitId: 'TEST123', collDate: '', codeScheme: 'C' }],
        item: null, total: 1, errorResponse: {},
      };
      serviceSpy.validateUnit.and.returnValue(of(responseNoDate));

      const mockEvent = {
        data: { parsedUnitId: 'TEST123', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(component.selectedCollectionDate()).toBe('');
    }));
  });

  describe('loadProductCodes - edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reject when product codes are empty', fakeAsync(() => {
      serviceSpy.getProductCodes.and.returnValue(of([]));
      serviceSpy.validateUnit.and.returnValue(of(mockValidateResponseCodabar));

      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('No product codes found for this unit.');
      expect(component.isLoading()).toBeFalse();
      expect(component.loadingProducts()).toBeFalse();
    }));

    it('should reject on product codes API error', fakeAsync(() => {
      serviceSpy.getProductCodes.and.returnValue(
        throwError(() => ({ error: { message: 'Product API error' } }))
      );
      serviceSpy.validateUnit.and.returnValue(of(mockValidateResponseCodabar));

      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Product API error');
      expect(component.isLoading()).toBeFalse();
      expect(component.loadingProducts()).toBeFalse();
    }));

    it('should reject with default message on product codes error without message', fakeAsync(() => {
      serviceSpy.getProductCodes.and.returnValue(
        throwError(() => ({ error: {} }))
      );
      serviceSpy.validateUnit.and.returnValue(of(mockValidateResponseCodabar));

      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      component.onUnitPostValidate(mockEvent);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Failed to load product codes.');
    }));

    it('should focus product code select when pendingProductFocus is true', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of(mockValidateResponseCodabar));

      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;

      const focusSpy = jasmine.createSpy('focus');
      component.productCodeSelect = { focus: focusSpy } as any;
      (component as any).pendingProductFocus = true;

      component.onUnitPostValidate(mockEvent);
      tick();
      tick(100);

      expect(focusSpy).toHaveBeenCalled();
    }));
  });

  describe('onUnitValidated', () => {
    it('should call detectChanges', () => {
      fixture.detectChanges();
      const cdrSpy = spyOn((component as any).cdr, 'detectChanges');
      component.onUnitValidated({} as any);
      expect(cdrSpy).toHaveBeenCalled();
    });
  });

  describe('onUnitCleared', () => {
    it('should reset all form fields', () => {
      fixture.detectChanges();
      component.unitValidated.set(true);
      component.validatedUnitData.set(mockUnitDataCodabar);
      component.productCodes.set(mockProductCodes);
      component.filteredProducts = [...mockProductCodes];
      component.selectedDescription.set('Some Description');
      component.selectedCollectionDate.set('25-MAY-2026');

      component.onUnitCleared();

      expect(component.unitValidated()).toBeFalse();
      expect(component.validatedUnitData()).toBeNull();
      expect(component.productCodes()).toEqual([]);
      expect(component.filteredProducts).toEqual([]);
      expect(component.selectedDescription()).toBe('');
      expect(component.selectedCollectionDate()).toBe('');
      expect(component.selectedProduct()).toBe('');
      expect(component.unitAlreadyScanned()).toBeFalse();
    });
  });

  describe('onProductCodeChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
    }));

    it('should clear description when productCode is empty', () => {
      component.selectedDescription.set('Some Description');
      component.form.patchValue({ productCode: '' });
      component.onProductCodeChange();
      expect(component.selectedDescription()).toBe('');
    });

    it('should set description from matched product', () => {
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      expect(component.selectedDescription()).toBe('RED BLOOD CELLS');
    });

    it('should set empty description when product not found', () => {
      component.form.patchValue({ productCode: 'NOTFOUND' });
      component.onProductCodeChange();
      expect(component.selectedDescription()).toBe('');
    });

    it('should reset componentPrefix and bagsUsed on product change', () => {
      component.form.patchValue({ componentPrefix: '01', bagsUsed: '3' });
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      expect(component.form.get('componentPrefix')?.value).toBe('');
      expect(component.form.get('bagsUsed')?.value).toBeNull();
    });

    it('should call getComponentPrefixes and repopulate prefixes for Codabar', fakeAsync(() => {
      component.componentPrefixes.set(mockPrefixes);
      component.filteredPrefixes = [...mockPrefixes];
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();
      // Codabar path re-loads prefixes from API
      expect(serviceSpy.getComponentPrefixes).toHaveBeenCalled();
      expect(component.componentPrefixes().length).toBe(2);
    }));

    it('should return early when no validatedUnitData and product is set', () => {
      component.validatedUnitData.set(null);
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      expect(serviceSpy.getComponentPrefixes).not.toHaveBeenCalled();
    });
  });

  describe('onProductCodeChange - ISBT with short product code', () => {
    beforeEach(fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(of(mockValidateResponseISBT));
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'W035211051822AB', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
    }));

    it('should set empty prefix for ISBT product code shorter than 8 chars', () => {
      component.form.patchValue({ productCode: 'SHORT' });
      component.onProductCodeChange();
      expect(component.form.get('componentPrefix')?.value).toBe('');
    });
  });

  describe('loadComponentPrefixes - error case', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
    }));

    it('should show error snackbar and clear prefixes on prefix load error', fakeAsync(() => {
      serviceSpy.getComponentPrefixes.and.returnValue(
        throwError(() => new Error('Prefix API error'))
      );

      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();

      expect(component.componentPrefixes()).toEqual([]);
      expect(component.filteredPrefixes).toEqual([]);
      expect(component.loadingPrefixes()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load component prefixes.');
    }));
  });

  describe('onTabSubmit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
      serviceSpy.getComponentPrefixes.and.returnValue(of(mockSinglePrefix));
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();
    }));

    it('should prevent default and submit when form is valid', fakeAsync(() => {
      component.form.patchValue({ bagsUsed: '3' });
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onTabSubmit(event);
      tick();
      expect(event.preventDefault).toHaveBeenCalled();
      expect(serviceSpy.updateBags).toHaveBeenCalled();
    }));

    it('should not prevent default when bags value is empty', () => {
      component.form.patchValue({ bagsUsed: null });
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onTabSubmit(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(serviceSpy.updateBags).not.toHaveBeenCalled();
    });

    it('should not submit when form is invalid', () => {
      component.form.patchValue({ bagsUsed: '3', productCode: '' });
      const event = { preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onTabSubmit(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('onBagsSubmit - early return scenarios', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return early when bagsUsed is null', () => {
      component.form.patchValue({ bagsUsed: null, productCode: 'E0001AA', componentPrefix: '01' });
      component.onBagsSubmit();
      expect(serviceSpy.updateBags).not.toHaveBeenCalled();
    });

    it('should return early when form is invalid', () => {
      component.form.patchValue({ bagsUsed: '3', productCode: '', componentPrefix: '01' });
      component.onBagsSubmit();
      expect(serviceSpy.updateBags).not.toHaveBeenCalled();
    });

    it('should return early when no validatedUnitData', () => {
      component.validatedUnitData.set(null);
      component.form.patchValue({ bagsUsed: '3', productCode: 'E0001AA', componentPrefix: '01' });
      component.onBagsSubmit();
      expect(serviceSpy.updateBags).not.toHaveBeenCalled();
    });

    it('should return early when productCode is empty', fakeAsync(() => {
      component.validatedUnitData.set(mockUnitDataCodabar);
      component.unitValidated.set(true);
      component.form.patchValue({ bagsUsed: '3', productCode: '', componentPrefix: '01' });
      component.onBagsSubmit();
      tick();
      expect(serviceSpy.updateBags).not.toHaveBeenCalled();
    }));

    it('should return early when componentPrefix is empty', fakeAsync(() => {
      component.validatedUnitData.set(mockUnitDataCodabar);
      component.unitValidated.set(true);
      component.form.patchValue({ bagsUsed: '3', productCode: 'E0001AA', componentPrefix: '' });
      component.onBagsSubmit();
      tick();
      expect(serviceSpy.updateBags).not.toHaveBeenCalled();
    }));
  });

  describe('submitEntry - success response', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
      serviceSpy.getComponentPrefixes.and.returnValue(of(mockSinglePrefix));
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();
    }));

    it('should add entry to table data on success', fakeAsync(() => {
      component.selectedDescription.set('RED BLOOD CELLS');
      component.selectedCollectionDate.set('25-MAY-2026');
      component.form.patchValue({ bagsUsed: '5' });
      component.onBagsSubmit();
      tick();

      expect(component.tableData().length).toBe(1);
      const entry = component.tableData()[0];
      expect(entry.unitId).toBe('TEST12345');
      expect(entry.productCode).toBe('E0001AA');
      expect(entry.description).toBe('RED BLOOD CELLS');
      expect(entry.collectionDate).toBe('25-MAY-2026');
      expect(entry.bags).toBe(5);
    }));

    it('should show success snackbar with response message', fakeAsync(() => {
      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Record saved successfully');
    }));

    it('should show default success message when response message is null', fakeAsync(() => {
      const noMsgResponse: ReturnResult<boolean> = {
        ...mockUpdateResponse, message: null,
      };
      serviceSpy.updateBags.and.returnValue(of(noMsgResponse));

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Record saved successfully.');
    }));

    it('should reset form and clear unit after successful submit', fakeAsync(() => {
      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();
      tick(100);

      expect(mockUnitIdField.clear).toHaveBeenCalled();
      expect(component.unitValidated()).toBeFalse();
      expect(mockUnitIdField.unitIdInput.nativeElement.focus).toHaveBeenCalled();
    }));

    it('should set isSaving to false after success', fakeAsync(() => {
      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(component.isSaving()).toBeFalse();
    }));
  });

  describe('submitEntry - unsuccessful response', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
      serviceSpy.getComponentPrefixes.and.returnValue(of(mockSinglePrefix));
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();
    }));

    it('should show error with errorCode when response is unsuccessful with errorCode', fakeAsync(() => {
      const failResponse: ReturnResult<boolean> = {
        success: false, message: 'Component not found', error: null, errorCode: '0151',
        statusCode: 400, data: null, item: null, total: null, errorResponse: {},
      };
      serviceSpy.updateBags.and.returnValue(of(failResponse));

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error:0151: Component not found');
    }));

    it('should show error with default message when response has errorCode but no message', fakeAsync(() => {
      const failResponse: ReturnResult<boolean> = {
        success: false, message: null, error: null, errorCode: '0230',
        statusCode: 400, data: null, item: null, total: null, errorResponse: {},
      };
      serviceSpy.updateBags.and.returnValue(of(failResponse));

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error:0230: Failed to update bags.');
    }));

    it('should show message only when response has no errorCode', fakeAsync(() => {
      const failResponse: ReturnResult<boolean> = {
        success: false, message: 'General failure', error: null, errorCode: null,
        statusCode: 400, data: null, item: null, total: null, errorResponse: {},
      };
      serviceSpy.updateBags.and.returnValue(of(failResponse));

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('General failure');
    }));

    it('should not add entry to table on unsuccessful response', fakeAsync(() => {
      const failResponse: ReturnResult<boolean> = {
        success: false, message: 'Fail', error: null, errorCode: null,
        statusCode: 400, data: null, item: null, total: null, errorResponse: {},
      };
      serviceSpy.updateBags.and.returnValue(of(failResponse));

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(component.tableData().length).toBe(0);
    }));
  });

  describe('submitEntry - HTTP error scenarios', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
      serviceSpy.getComponentPrefixes.and.returnValue(of(mockSinglePrefix));
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();
    }));

    it('should show error with errorCode on HTTP error with errorCode', fakeAsync(() => {
      serviceSpy.updateBags.and.returnValue(
        throwError(() => ({ error: { message: 'Server error', errorCode: '0262' } }))
      );

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Error:0262: Server error');
      expect(component.isSaving()).toBeFalse();
    }));

    it('should show error without errorCode on HTTP error without errorCode', fakeAsync(() => {
      serviceSpy.updateBags.and.returnValue(
        throwError(() => ({ error: { message: 'Generic error' } }))
      );

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Generic error');
    }));

    it('should show default error message on HTTP error without message', fakeAsync(() => {
      serviceSpy.updateBags.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to update bags.');
    }));

    it('should reset form and clear unit on HTTP error', fakeAsync(() => {
      serviceSpy.updateBags.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );

      const mockUnitIdField = {
        clear: jasmine.createSpy('clear'),
        unitIdInput: { nativeElement: { focus: jasmine.createSpy('focus') } },
      } as any;
      component.unitIdField = mockUnitIdField;

      component.form.patchValue({ bagsUsed: '3' });
      component.onBagsSubmit();
      tick();
      tick(100);

      expect(mockUnitIdField.clear).toHaveBeenCalled();
      expect(component.unitValidated()).toBeFalse();
      expect(mockUnitIdField.unitIdInput.nativeElement.focus).toHaveBeenCalled();
    }));
  });

  describe('onlyDigits', () => {
    it('should allow digits 1-9', () => {
      fixture.detectChanges();
      for (let i = 1; i <= 9; i++) {
        const event = {
          which: String(i).charCodeAt(0),
          keyCode: String(i).charCodeAt(0),
          preventDefault: jasmine.createSpy('preventDefault'),
        } as any;
        const result = component.onlyDigits(event);
        expect(result).toBeTrue();
        expect(event.preventDefault).not.toHaveBeenCalled();
      }
    });

    it('should block digit 0', () => {
      fixture.detectChanges();
      const event = {
        which: '0'.charCodeAt(0),
        keyCode: '0'.charCodeAt(0),
        preventDefault: jasmine.createSpy('preventDefault'),
      } as any;
      const result = component.onlyDigits(event);
      expect(result).toBeFalse();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should block non-digit characters', () => {
      fixture.detectChanges();
      const chars = ['a', 'z', '@', ' ', '-', '.'];
      for (const char of chars) {
        const event = {
          which: char.charCodeAt(0),
          keyCode: char.charCodeAt(0),
          preventDefault: jasmine.createSpy('preventDefault'),
        } as any;
        const result = component.onlyDigits(event);
        expect(result).toBeFalse();
        expect(event.preventDefault).toHaveBeenCalled();
      }
    });
  });

  describe('onPasteDigit', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set first valid digit from pasted text', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '3abc' },
      } as any;
      component.onPasteDigit(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('bagsUsed')?.value).toBe('3');
    });

    it('should ignore paste with only zeros', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '000' },
      } as any;
      component.onPasteDigit(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('bagsUsed')?.value).toBeNull();
    });

    it('should ignore paste with only non-digit characters', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc' },
      } as any;
      component.onPasteDigit(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('bagsUsed')?.value).toBeNull();
    });

    it('should handle empty paste data', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '' },
      } as any;
      component.onPasteDigit(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('bagsUsed')?.value).toBeNull();
    });

    it('should handle null clipboardData', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null,
      } as any;
      component.onPasteDigit(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('bagsUsed')?.value).toBeNull();
    });

    it('should take only the first valid digit when multiple present', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '57' },
      } as any;
      component.onPasteDigit(event);
      expect(component.form.get('bagsUsed')?.value).toBe('5');
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.tableData.set([
        { unitId: 'B001', productCode: 'P2', description: 'Beta', collectionDate: '01-JAN-2026', bags: 2 },
        { unitId: 'A001', productCode: 'P1', description: 'Alpha', collectionDate: '15-FEB-2026', bags: 5 },
        { unitId: 'C001', productCode: 'P3', description: 'Gamma', collectionDate: '20-MAR-2026', bags: 1 },
      ]);
    });

    it('should sort ascending by unitId', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.dataSource[0].unitId).toBe('A001');
      expect(component.dataSource[1].unitId).toBe('B001');
      expect(component.dataSource[2].unitId).toBe('C001');
    });

    it('should sort descending by unitId', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component.dataSource[0].unitId).toBe('C001');
      expect(component.dataSource[1].unitId).toBe('B001');
      expect(component.dataSource[2].unitId).toBe('A001');
    });

    it('should return to default order when direction is default', () => {
      component.onSortChange({ column: 'unitId', direction: 'default' });
      expect(component.dataSource[0].unitId).toBe('B001');
      expect(component.dataSource[1].unitId).toBe('A001');
      expect(component.dataSource[2].unitId).toBe('C001');
    });

    it('should update sortConfig column and direction', () => {
      component.onSortChange({ column: 'productCode', direction: 'A' });
      expect(component.tableConfig.sortConfig?.column).toBe('productCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reset form and clear table on chapter change', fakeAsync(() => {
      const chapterSubject = new Subject<void>();
      const headerSpyLocal = createMockHeaderService({ chapterChanged$: chapterSubject.asObservable() });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [UpdateNumberOfBagsComponent, NoopAnimationsModule, HttpClientTestingModule],
        providers: [
          { provide: UpdateNumberOfBagsService, useValue: serviceSpyObj },
          { provide: SnackbarService, useValue: createMockSnackbarService() },
          { provide: HeaderService, useValue: headerSpyLocal },
          { provide: PageHeaderService, useValue: pageHeaderSpyObj },
          { provide: TranslateService, useValue: translateSpyObj },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) },
          },
        ],
      });

      const localFixture = TestBed.createComponent(UpdateNumberOfBagsComponent);
      const localComponent = localFixture.componentInstance;
      localFixture.detectChanges();

      localComponent.tableData.set([
        { unitId: 'U1', productCode: 'P1', description: 'D1', collectionDate: '01-JAN-2026', bags: 1 },
      ]);
      localComponent.unitValidated.set(true);
      localComponent.unitIdField = {
        clear: jasmine.createSpy('clear'),
      } as any;

      chapterSubject.next();
      tick();

      expect(localComponent.tableData()).toEqual([]);
      expect(localComponent.unitValidated()).toBeFalse();
      expect(localComponent.unitIdField.clear).toHaveBeenCalled();
    }));
  });

  describe('product search filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
    }));

    it('should filter products by code', fakeAsync(() => {
      component.productSearchControl.setValue('E3087');
      tick();
      expect(component.filteredProducts.length).toBe(1);
      expect(component.filteredProducts[0].productCode).toBe('E3087V00');
    }));

    it('should filter products by description (case insensitive)', fakeAsync(() => {
      component.productSearchControl.setValue('platelets');
      tick();
      expect(component.filteredProducts.length).toBe(1);
      expect(component.filteredProducts[0].productDesc).toBe('PLATELETS PHERESIS LR');
    }));

    it('should show all products when search is empty', fakeAsync(() => {
      component.productSearchControl.setValue('');
      tick();
      expect(component.filteredProducts.length).toBe(2);
    }));

    it('should show no products when search has no match', fakeAsync(() => {
      component.productSearchControl.setValue('ZZZZZ');
      tick();
      expect(component.filteredProducts.length).toBe(0);
    }));
  });

  describe('prefix search filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const mockEvent = {
        data: { parsedUnitId: 'TEST12345', entryMode: 'S' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      } as any;
      component.onUnitPostValidate(mockEvent);
      tick();
      component.form.patchValue({ productCode: 'E0001AA' });
      component.onProductCodeChange();
      tick();
    }));

    it('should filter prefixes by value', fakeAsync(() => {
      component.prefixSearchControl.setValue('01');
      tick();
      expect(component.filteredPrefixes.length).toBe(1);
      expect(component.filteredPrefixes[0].componentPrefix).toBe('01');
    }));

    it('should show all prefixes when search is empty', fakeAsync(() => {
      component.prefixSearchControl.setValue('');
      tick();
      expect(component.filteredPrefixes.length).toBe(2);
    }));

    it('should show no prefixes when search has no match', fakeAsync(() => {
      component.prefixSearchControl.setValue('99');
      tick();
      expect(component.filteredPrefixes.length).toBe(0);
    }));
  });

  describe('computed signals', () => {
    it('should return true for isISBT when codeScheme is I', () => {
      fixture.detectChanges();
      component.validatedUnitData.set({ unitId: 'U1', collDate: '', codeScheme: 'I' });
      expect(component.isISBT()).toBeTrue();
      expect(component.isPrefixNavigable()).toBeFalse();
    });

    it('should return false for isISBT when codeScheme is C', () => {
      fixture.detectChanges();
      component.validatedUnitData.set({ unitId: 'U1', collDate: '', codeScheme: 'C' });
      expect(component.isISBT()).toBeFalse();
      expect(component.isPrefixNavigable()).toBeTrue();
    });

    it('should return false for isISBT when validatedUnitData is null', () => {
      fixture.detectChanges();
      component.validatedUnitData.set(null);
      expect(component.isISBT()).toBeFalsy();
    });
  });

  describe('resetFormFields', () => {
    it('should reset all state when called via onUnitCleared', () => {
      fixture.detectChanges();
      component.unitValidated.set(true);
      component.unitAlreadyScanned.set(true);
      component.validatedUnitData.set(mockUnitDataCodabar);
      component.productCodes.set(mockProductCodes);
      component.filteredProducts = [...mockProductCodes];
      component.componentPrefixes.set(mockPrefixes);
      component.filteredPrefixes = [...mockPrefixes];
      component.selectedProduct.set('E0001AA');
      component.selectedDescription.set('RED BLOOD CELLS');
      component.selectedCollectionDate.set('25-MAY-2026');
      component.productSearchControl.setValue('search');
      component.prefixSearchControl.setValue('prefix');
      component.form.patchValue({ productCode: 'E0001AA', componentPrefix: '01', bagsUsed: '3' });

      component.onUnitCleared();

      expect(component.unitValidated()).toBeFalse();
      expect(component.unitAlreadyScanned()).toBeFalse();
      expect(component.validatedUnitData()).toBeNull();
      expect(component.productCodes()).toEqual([]);
      expect(component.filteredProducts).toEqual([]);
      expect(component.componentPrefixes()).toEqual([]);
      expect(component.filteredPrefixes).toEqual([]);
      expect(component.selectedProduct()).toBe('');
      expect(component.selectedDescription()).toBe('');
      expect(component.selectedCollectionDate()).toBe('');
      expect(component.productSearchControl.value).toBe('');
      expect(component.prefixSearchControl.value).toBe('');
    });
  });

  describe('table config initialization', () => {
    it('should define 5 columns with correct keys', () => {
      fixture.detectChanges();
      expect(component.tableConfig.columns.length).toBe(5);
      expect(component.tableConfig.columns[0].key).toBe('unitId');
      expect(component.tableConfig.columns[1].key).toBe('productCode');
      expect(component.tableConfig.columns[2].key).toBe('description');
      expect(component.tableConfig.columns[3].key).toBe('collectionDate');
      expect(component.tableConfig.columns[4].key).toBe('bags');
    });

    it('should only make unitId column sortable', () => {
      fixture.detectChanges();
      expect(component.tableConfig.columns[0].sortable).toBeTrue();
      expect(component.tableConfig.columns[1].sortable).toBeFalse();
      expect(component.tableConfig.columns[2].sortable).toBeFalse();
      expect(component.tableConfig.columns[3].sortable).toBeFalse();
      expect(component.tableConfig.columns[4].sortable).toBeFalse();
    });

    it('should have showPagination false', () => {
      fixture.detectChanges();
      expect(component.tableConfig.showPagination).toBeFalse();
    });

    it('should have sticky header', () => {
      fixture.detectChanges();
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });
  });
});
