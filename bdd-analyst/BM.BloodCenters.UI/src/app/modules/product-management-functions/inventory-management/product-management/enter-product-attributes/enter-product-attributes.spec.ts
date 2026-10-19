import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

import { EnterProductAttributesComponent } from './enter-product-attributes';
import { ComponentAttributeApiService } from './services/component-attribute-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  ComponentAttributeDto,
  ApiResponse,
  AttributeCodeDto,
  ProductDto,
} from './models/component-attribute.model';
import moment from 'moment';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('EnterProductAttributesComponent', () => {
  let component: EnterProductAttributesComponent;
  let fixture: ComponentFixture<EnterProductAttributesComponent>;
  let apiServiceSpy: jasmine.SpyObj<ComponentAttributeApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockAttributeData: ComponentAttributeDto[] = [
    {
      unitId: 'UNIT123',
      collDate: '2024-05-28T00:00:00Z',
      chapterId: 'TEST',
      productCode: 'PROD001',
      productDescription: 'Red Blood Cells',
      attribGroup: 'ALERT',
      attribCode: 'AL01',
      attribDescription: 'CMV Negative',
      procDate: '2024-05-28T10:30:00Z',
      newExpDate: null,
      insertDate: '2024-05-28T10:35:00Z',
      insertUser: 'TUSER',
    },
  ];

  const mockProducts: ProductDto[] = [
    { productCode: 'PROD001', productDescription: 'Red Blood Cells' },
    { productCode: 'PROD002', productDescription: 'Platelets' },
  ];

  const mockAttributeGroups = [
    { code: 'ALERT', description: 'Alert Attributes' },
    { code: 'SP', description: 'Special Processing Attributes' },
  ];

  const mockAttributeCodes: AttributeCodeDto[] = [
    { attribCode: 'AL01', attribDescription: 'CMV Negative', attribGroup: 'ALERT', lifeSpan: null },
    { attribCode: 'AL02', attribDescription: 'Irradiated', attribGroup: 'ALERT', lifeSpan: 14, lifeSpanInd: 'D' },
  ];

  function setupValidUnit(): void {
    component.showEntryForm.set(true);
    component.unitCollDate.set('2024-05-28T00:00:00Z');
    component.collectionDate.set('28-MAY-2024');
    component.unitIdField = {
      parsedUnitId: 'UNIT123',
      isValid: true,
      clear: jasmine.createSpy('clear'),
    } as any;
    component.selectedProductCode.set('PROD001');
    component.products.set(mockProducts);
    component.productCodeField = {
      clear: jasmine.createSpy('clear'),
      setValue: jasmine.createSpy('setValue'),
    } as any;
  }

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('ComponentAttributeApiService', [
      'getAll', 'create', 'delete', 'validateUnit',
      'getProductsForUnit', 'getAttributeGroups', 'getAttributeCodes',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });

    apiServiceSpy.getAttributeGroups.and.returnValue(of(mockAttributeGroups));
    apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
    apiServiceSpy.getAll.and.returnValue(
      of({ success: true, statusCode: 200, data: mockAttributeData, totalCount: 1 })
    );
    apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));
    apiServiceSpy.create.and.returnValue(
      of({ success: true, statusCode: 201, message: 'Attribute successfully added', data: mockAttributeData[0] })
    );

    TestBed.configureTestingModule({
      imports: [EnterProductAttributesComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: ComponentAttributeApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        {
          provide: PageHeaderService,
          useValue: {
            pageHeaderData: jasmine.createSpy().and.returnValue(null),
            getTitle: jasmine.createSpy().and.returnValue(undefined),
            getSubtitle: jasmine.createSpy().and.returnValue(undefined),
          },
        },
        {
          provide: ChapterTimezoneService,
          useValue: {
            chapterLocalDate: jasmine.createSpy().and.returnValue(moment('2024-05-28')),
            getChapterLocalDate: jasmine.createSpy().and.returnValue(moment('2024-05-28')),
          },
        },
      ],
    });

    fixture = TestBed.createComponent(EnterProductAttributesComponent);
    component = fixture.componentInstance;
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize with no selected attribute code', () => {
      expect(component.selectedAttributeCode()).toBeNull();
    });

    it('should initialize attribCode control as disabled', () => {
      fixture.detectChanges();
      expect(component.attributeForm.get('attribCode')?.disabled).toBeTrue();
    });

    it('should initialize showEntryForm as false', () => {
      expect(component.showEntryForm()).toBe(false);
    });

    it('should initialize gridData as empty', () => {
      expect(component.gridData().length).toBe(0);
    });

    it('should initialize products as empty', () => {
      expect(component.products().length).toBe(0);
    });

    it('should expose productCodeOptions computed signal', () => {
      fixture.detectChanges();
      expect(component.productCodeOptions).toBeDefined();
      expect(Array.isArray(component.productCodeOptions())).toBeTrue();
    });

    it('should compute productCodeOptions from products', () => {
      component.products.set(mockProducts);
      const options = component.productCodeOptions();
      expect(options.length).toBe(2);
      expect(options[0].code).toBe('PROD001');
      expect(options[0].description).toBe('Red Blood Cells');
    });

    it('should strip pipe-delimited suffixes from product description', () => {
      component.products.set([
        { productCode: 'E0385V00', productDescription: 'RED BLOOD CELLS|AS5/450mL/refg' },
      ]);
      const options = component.productCodeOptions();
      expect(options[0].description).toBe('RED BLOOD CELLS');
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should clear all when chapter changes', () => {
      fixture.detectChanges();
      component.showEntryForm.set(true);
      component.gridData.set(mockAttributeData);
      component.unitIdField = { clear: jasmine.createSpy('clear') } as any;

      chapterChangedSubject.next();

      expect(component.showEntryForm()).toBe(false);
      expect(component.gridData().length).toBe(0);
    });
  });

  describe('Unit ID Validation', () => {
    it('should validate unit and load products on success', fakeAsync(() => {
      const mockValidateResponse: ApiResponse<any> = {
        success: true, statusCode: 200,
        data: { unitId: 'UNIT123', collDate: '2024-05-28T00:00:00Z', isValid: true, hasActiveComponents: true },
      };
      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateResponse));
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith({ unitId: 'UNIT123' });
      expect(event.confirm).toHaveBeenCalled();
      expect(component.showEntryForm()).toBe(true);
      expect(component.collectionDate()).toBe('28-MAY-2024');
    }));

    it('should reject when API returns success false', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        of({ success: false, statusCode: 404, message: 'Unit not found' })
      );
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'NOTFOUND' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit not found');
      expect(event.confirm).not.toHaveBeenCalled();
    }));

    it('should reject when success but data is null', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        of({ success: true, statusCode: 200, data: null })
      );
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit ID not found.');
    }));

    it('should reject unit with no active components', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        success: true, statusCode: 200,
        data: { unitId: 'UNIT123', collDate: '2024-05-28T00:00:00Z', isValid: true, hasActiveComponents: false },
      }));
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit has no active components in stock.');
    }));

    it('should reject unit with isValid false', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        success: true, statusCode: 200,
        data: { unitId: 'UNIT123', collDate: '2024-05-28T00:00:00Z', isValid: false, hasActiveComponents: true },
      }));
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Unit has no active components in stock.');
    }));

    it('should reject on API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => new Error('Network error')));
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect(event.reject).toHaveBeenCalledWith('Failed to validate unit. Please try again.');
    }));

    it('should guard against double validation', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).isValidatingUnit = true;

      const event = {
        data: { parsedUnitId: 'UNIT456' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect(apiServiceSpy.validateUnit).not.toHaveBeenCalled();
      expect(event.confirm).not.toHaveBeenCalled();
      expect(event.reject).not.toHaveBeenCalled();
    }));

    it('should use collDate string as-is when not valid moment', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        success: true, statusCode: 200,
        data: { unitId: 'UNIT123', collDate: 'invalid-date', isValid: true, hasActiveComponents: true },
      }));
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect(component.collectionDate()).toBe('invalid-date');
    }));

    it('should reset isValidatingUnit on success', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        success: true, statusCode: 200,
        data: { unitId: 'UNIT123', collDate: '2024-05-28T00:00:00Z', isValid: true, hasActiveComponents: true },
      }));
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect((component as any).isValidatingUnit).toBe(false);
    }));

    it('should reset isValidatingUnit on error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(event as any);
      tick();

      expect((component as any).isValidatingUnit).toBe(false);
    }));
  });

  describe('Form Subscriptions', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should load attribute codes when attribGroup changes', fakeAsync(() => {
      apiServiceSpy.getAttributeCodes.and.returnValue(of(mockAttributeCodes));
      component.attributeForm.patchValue({ attribGroup: 'ALERT' });
      tick();

      expect(apiServiceSpy.getAttributeCodes).toHaveBeenCalledWith(
        'ALERT', jasmine.any(String), jasmine.any(String), jasmine.any(String)
      );
      expect(component.attributeCodes().length).toBe(2);
    }));

    it('should enable attribCode when group is set', fakeAsync(() => {
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
      component.attributeForm.patchValue({ attribGroup: 'ALERT' });
      tick();

      expect(component.attributeForm.get('attribCode')?.enabled).toBeTrue();
    }));

    it('should disable attribCode when attribGroup is cleared', fakeAsync(() => {
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
      component.attributeForm.patchValue({ attribGroup: 'ALERT' });
      tick();

      component.attributeForm.patchValue({ attribGroup: null });
      tick();

      expect(component.attributeForm.get('attribCode')?.disabled).toBeTrue();
    }));

    it('should set procDate/procTime when attribCode with lifeSpan is selected', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeForm.get('attribCode')?.enable();
      component.attributeForm.patchValue({ attribCode: 'AL02' });
      tick();

      expect(component.procDateRequired()).toBe(true);
      expect(component.attributeForm.get('procDate')?.value).not.toBeNull();
      expect(component.attributeForm.get('procTime')?.value).not.toBeNull();
    }));

    it('should add required validator to procDate when lifeSpan attribute selected', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeForm.get('attribCode')?.enable();
      component.attributeForm.patchValue({ attribCode: 'AL02' });
      tick();

      component.attributeForm.patchValue({ procDate: null }, { emitEvent: false });
      component.attributeForm.get('procDate')?.updateValueAndValidity();
      expect(component.attributeForm.get('procDate')?.hasError('required')).toBeTrue();
    }));

    it('should clear procDate/procTime when attribCode without lifeSpan is selected', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeForm.get('attribCode')?.enable();
      component.attributeForm.patchValue({ attribCode: 'AL01' });
      tick();

      expect(component.procDateRequired()).toBe(false);
      expect(component.attributeForm.get('procDate')?.value).toBeNull();
      expect(component.attributeForm.get('procTime')?.value).toBeNull();
    }));

    it('should clear validators from procDate when no-lifeSpan attribute selected', fakeAsync(() => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attributeForm.get('attribCode')?.enable();
      component.attributeForm.patchValue({ attribCode: 'AL01' });
      tick();

      component.attributeForm.patchValue({ procDate: null }, { emitEvent: false });
      component.attributeForm.get('procDate')?.updateValueAndValidity();
      expect(component.attributeForm.get('procDate')?.hasError('required')).toBeFalse();
    }));

    it('should set selectedAttributeCode to null when code is not found', fakeAsync(() => {
      component.attributeCodes.set([]);
      component.attributeForm.get('attribCode')?.enable();
      component.attributeForm.patchValue({ attribCode: 'UNKNOWN' });
      tick();

      expect(component.selectedAttributeCode()).toBeNull();
    }));

    it('should reset attribCode when attribGroup changes', fakeAsync(() => {
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));
      component.attributeForm.get('attribCode')?.enable();
      component.attributeForm.get('attribCode')?.setValue('AL01', { emitEvent: false });

      component.attributeForm.patchValue({ attribGroup: 'SP' });
      tick();

      expect(component.attributeForm.get('attribCode')?.value).toBeNull();
      expect(component.selectedAttributeCode()).toBeNull();
    }));
  });

  describe('Load Attribute Groups', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should load groups via onProductCodeChanged', () => {
      component.onProductCodeChanged({ code: 'PROD001', description: 'Red Blood Cells' });
      expect(apiServiceSpy.getAttributeGroups).toHaveBeenCalledWith('PROD001', 'C');
    });

    it('should use ISBT code scheme for 8-char product codes', () => {
      component.onProductCodeChanged({ code: 'PROD0001', description: 'Test' });
      expect(apiServiceSpy.getAttributeGroups).toHaveBeenCalledWith('PROD0001', 'I');
    });

    it('should show error when loading groups fails', fakeAsync(() => {
      apiServiceSpy.getAttributeGroups.and.returnValue(throwError(() => new Error('fail')));
      component.onProductCodeChanged({ code: 'PROD001', description: 'Test' });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load attribute groups.');
    }));

    it('should not load groups when product code is null', () => {
      apiServiceSpy.getAttributeGroups.calls.reset();
      component.onProductCodeChanged(null);
      expect(apiServiceSpy.getAttributeGroups).not.toHaveBeenCalled();
    });
  });

  describe('Load Attribute Codes', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should show error when loading codes fails', fakeAsync(() => {
      apiServiceSpy.getAttributeCodes.and.returnValue(throwError(() => new Error('fail')));
      component.attributeForm.patchValue({ attribGroup: 'ALERT' });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load attribute codes.');
      expect(component.isLoadingAttributes()).toBe(false);
    }));

    it('should set isLoadingAttributes during load', fakeAsync(() => {
      const subject = new Subject<AttributeCodeDto[]>();
      apiServiceSpy.getAttributeCodes.and.returnValue(subject.asObservable());

      component.attributeForm.patchValue({ attribGroup: 'ALERT' });
      tick();
      expect(component.isLoadingAttributes()).toBe(true);

      subject.next(mockAttributeCodes);
      subject.complete();
      tick();
      expect(component.isLoadingAttributes()).toBe(false);
    }));

    it('should use ISBT code scheme for 8-char product codes', fakeAsync(() => {
      component.selectedProductCode.set('PROD0001');
      component.unitIdField = { parsedUnitId: 'UNIT123', isValid: true } as any;
      apiServiceSpy.getAttributeCodes.and.returnValue(of([]));

      component.attributeForm.patchValue({ attribGroup: 'ALERT' });
      tick();

      expect(apiServiceSpy.getAttributeCodes).toHaveBeenCalledWith('ALERT', 'UNIT123', 'PROD0001', 'I');
    }));
  });

  describe('Product Code Changed / Cleared', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should reset form state when product code changes', () => {
      component.attributeGroups.set(mockAttributeGroups);
      component.attributeCodes.set(mockAttributeCodes);
      component.selectedAttributeCode.set(mockAttributeCodes[0]);

      component.onProductCodeChanged({ code: 'PROD002', description: 'Platelets' });

      expect(component.selectedProductCode()).toBe('PROD002');
      expect(component.attributeCodes().length).toBe(0);
      expect(component.selectedAttributeCode()).toBeNull();
      expect(component.attributeForm.get('attribGroup')?.value).toBeNull();
      expect(apiServiceSpy.getAttributeGroups).toHaveBeenCalledWith('PROD002', 'C');
    });

    it('should clear everything when product code is cleared', () => {
      component.selectedProductCode.set('PROD001');
      component.attributeGroups.set(mockAttributeGroups);
      component.attributeCodes.set(mockAttributeCodes);

      component.onProductCodeCleared();

      expect(component.selectedProductCode()).toBeNull();
      expect(component.attributeGroups().length).toBe(0);
      expect(component.attributeCodes().length).toBe(0);
      expect(component.selectedAttributeCode()).toBeNull();
      expect(component.attributeForm.get('attribCode')?.disabled).toBeTrue();
    });

    it('should reset search fields when product code changes', () => {
      component.attribGroupSearch.setValue('test');
      component.attribCodeSearch.setValue('test');

      component.onProductCodeChanged({ code: 'PROD001', description: 'Test' });

      expect(component.attribGroupSearch.value).toBe('');
      expect(component.attribCodeSearch.value).toBe('');
    });

    it('should reset search fields when product code is cleared', () => {
      component.attribGroupSearch.setValue('test');
      component.attribCodeSearch.setValue('test');

      component.onProductCodeCleared();

      expect(component.attribGroupSearch.value).toBe('');
      expect(component.attribCodeSearch.value).toBe('');
    });
  });

  describe('Unit Cleared', () => {
    it('should reset all state', () => {
      fixture.detectChanges();
      component.showEntryForm.set(true);
      component.collectionDate.set('28-MAY-2024');
      component.unitCollDate.set('2024-05-28T00:00:00Z');
      component.products.set(mockProducts);
      component.gridData.set(mockAttributeData);
      component.filteredData.set(mockAttributeData);
      component.selectedProductCode.set('PROD001');
      component.gridPageIndex.set(3);
      component.productCodeField = { clear: jasmine.createSpy('clear') } as any;

      component.onUnitCleared();

      expect(component.showEntryForm()).toBe(false);
      expect(component.collectionDate()).toBe('');
      expect(component.unitCollDate()).toBe('');
      expect(component.products().length).toBe(0);
      expect(component.gridData().length).toBe(0);
      expect(component.filteredData().length).toBe(0);
      expect(component.selectedProductCode()).toBeNull();
      expect(component.gridPageIndex()).toBe(0);
      expect(component.attributeForm.get('attribCode')?.disabled).toBeTrue();
    });

    it('should reset isValidatingUnit flag', () => {
      fixture.detectChanges();
      (component as any).isValidatingUnit = true;
      component.productCodeField = { clear: jasmine.createSpy('clear') } as any;

      component.onUnitCleared();

      expect((component as any).isValidatingUnit).toBe(false);
    });
  });

  describe('Load Products for Unit', () => {
    it('should auto-select first product on success', fakeAsync(() => {
      fixture.detectChanges();
      component.productCodeField = {
        setValue: jasmine.createSpy('setValue'),
        clear: jasmine.createSpy('clear'),
      } as any;
      apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));

      (component as any).loadProductsForUnit('UNIT123');
      tick();

      expect(component.products().length).toBe(2);
      expect(component.isLoadingProducts()).toBe(false);
      expect(component.productCodeField.setValue).toHaveBeenCalledWith('PROD001', 'Red Blood Cells');
    }));

    it('should not auto-select when no products returned', fakeAsync(() => {
      fixture.detectChanges();
      component.productCodeField = {
        setValue: jasmine.createSpy('setValue'),
        clear: jasmine.createSpy('clear'),
      } as any;
      apiServiceSpy.getProductsForUnit.and.returnValue(of([]));

      (component as any).loadProductsForUnit('UNIT123');
      tick();

      expect(component.products().length).toBe(0);
      expect(component.productCodeField.setValue).not.toHaveBeenCalled();
    }));

    it('should show error on failure', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getProductsForUnit.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadProductsForUnit('UNIT123');
      tick();

      expect(component.isLoadingProducts()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load products for this unit.');
    }));

    it('should set isLoadingProducts during load', fakeAsync(() => {
      fixture.detectChanges();
      const subject = new Subject<ProductDto[]>();
      apiServiceSpy.getProductsForUnit.and.returnValue(subject.asObservable());
      component.productCodeField = { setValue: jasmine.createSpy('setValue') } as any;

      (component as any).loadProductsForUnit('UNIT123');
      expect(component.isLoadingProducts()).toBe(true);

      subject.next(mockProducts);
      subject.complete();
      tick();
      expect(component.isLoadingProducts()).toBe(false);
    }));
  });

  describe('Load Attributes for Unit (Grid)', () => {
    it('should populate grid on success', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getAll.and.returnValue(
        of({ success: true, statusCode: 200, data: mockAttributeData, totalCount: 1 })
      );

      (component as any).loadAttributesForUnit('UNIT123');
      tick();

      expect(component.gridData().length).toBe(1);
      expect(component.filteredData().length).toBe(1);
      expect(component.isLoadingGrid()).toBe(false);
    }));

    it('should clear grid when response is not successful', fakeAsync(() => {
      fixture.detectChanges();
      component.gridData.set(mockAttributeData);
      component.filteredData.set(mockAttributeData);
      apiServiceSpy.getAll.and.returnValue(
        of({ success: false, statusCode: 500 } as any)
      );

      (component as any).loadAttributesForUnit('UNIT123');
      tick();

      expect(component.gridData().length).toBe(0);
      expect(component.filteredData().length).toBe(0);
    }));

    it('should show error on API failure', fakeAsync(() => {
      fixture.detectChanges();
      apiServiceSpy.getAll.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadAttributesForUnit('UNIT123');
      tick();

      expect(component.isLoadingGrid()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load existing attributes.');
    }));

    it('should pass sort params when sort is active', fakeAsync(() => {
      fixture.detectChanges();
      component.sortColumn.set('unitId');
      component.sortDirection.set('desc');
      apiServiceSpy.getAll.calls.reset();

      (component as any).loadAttributesForUnit('UNIT123');
      tick();

      const callArgs = apiServiceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('UnitId');
      expect(callArgs[2].sortOrder).toBe('DESC');
    }));

    it('should pass null sort params when no sort active', fakeAsync(() => {
      fixture.detectChanges();
      component.sortColumn.set('');
      apiServiceSpy.getAll.calls.reset();

      (component as any).loadAttributesForUnit('UNIT123');
      tick();

      const callArgs = apiServiceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBeNull();
      expect(callArgs[2].sortOrder).toBeNull();
    }));
  });

  describe('Add Attribute', () => {
    beforeEach(() => {
      fixture.detectChanges();
      setupValidUnit();
    });

    it('should create attribute successfully', fakeAsync(() => {
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onAdd();
      tick();

      expect(apiServiceSpy.create).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Attribute added successfully.');
    }));

    it('should reset attribCode after successful add', fakeAsync(() => {
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.selectedAttributeCode.set(mockAttributeCodes[0]);
      component.onAdd();
      tick();

      expect(component.selectedAttributeCode()).toBeNull();
    }));

    it('should reload grid after successful add', fakeAsync(() => {
      apiServiceSpy.getAll.calls.reset();
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onAdd();
      tick();

      expect(apiServiceSpy.getAll).toHaveBeenCalled();
    }));

    it('should show error when no product code selected', () => {
      component.selectedProductCode.set(null);
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onAdd();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a Product Code.');
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should show error when attribGroup is missing', () => {
      component.attributeForm.get('attribCode')?.enable();
      component.attributeForm.patchValue({ attribGroup: null, attribCode: 'AL01' });
      component.onAdd();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please select an Attribute Group and Attribute Code.'
      );
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should show error when attribCode is missing', () => {
      component.attributeForm.patchValue({ attribGroup: 'ALERT' });
      component.onAdd();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please select an Attribute Group and Attribute Code.'
      );
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should require process date when attribute has lifeSpan', () => {
      component.attributeForm.patchValue({
        attribGroup: 'ALERT', attribCode: 'AL02', procDate: null, procTime: null,
      });
      component.selectedAttributeCode.set(mockAttributeCodes[1]);
      component.onAdd();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Process date and time are required for this attribute.'
      );
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should format procDate correctly when present', fakeAsync(() => {
      const procDateMoment = moment('2024-05-28');
      component.attributeForm.patchValue({
        attribGroup: 'ALERT', attribCode: 'AL02',
        procDate: procDateMoment, procTime: '10:30',
      });
      component.selectedAttributeCode.set(mockAttributeCodes[1]);
      component.onAdd();
      tick();

      const createArgs = apiServiceSpy.create.calls.mostRecent().args[0];
      expect(createArgs.procDate).toBe('2024-05-28T10:30:00');
    }));

    it('should show error when API returns success false', fakeAsync(() => {
      apiServiceSpy.create.and.returnValue(
        of({ success: false, statusCode: 400, message: 'Duplicate attribute' } as any)
      );
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onAdd();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Duplicate attribute');
      expect(component.isSaving()).toBe(false);
    }));

    it('should show fallback error when API returns success false without message', fakeAsync(() => {
      apiServiceSpy.create.and.returnValue(
        of({ success: false, statusCode: 400 } as any)
      );
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onAdd();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to add attribute.');
    }));

    it('should show error on API error', fakeAsync(() => {
      apiServiceSpy.create.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onAdd();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
      expect(component.isSaving()).toBe(false);
    }));

    it('should show generic error when API error has no message', fakeAsync(() => {
      apiServiceSpy.create.and.returnValue(throwError(() => ({})));
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onAdd();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to add attribute.');
    }));

    it('should mark controls as touched when unitIdField is invalid', () => {
      component.unitIdField = { parsedUnitId: 'UNIT123', isValid: false } as any;
      component.onAdd();

      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should set isSaving during API call', fakeAsync(() => {
      const subject = new Subject<any>();
      apiServiceSpy.create.and.returnValue(subject.asObservable());
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });

      component.onAdd();
      expect(component.isSaving()).toBe(true);

      subject.next({ success: true, statusCode: 201, data: mockAttributeData[0] });
      subject.complete();
      tick();
      expect(component.isSaving()).toBe(false);
    }));

    it('should pass null procDate when not required', fakeAsync(() => {
      component.selectedAttributeCode.set(null);
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onAdd();
      tick();

      const createArgs = apiServiceSpy.create.calls.mostRecent().args[0];
      expect(createArgs.procDate).toBeNull();
    }));
  });

  describe('Auto-save / Document Click', () => {
    beforeEach(() => {
      fixture.detectChanges();
      setupValidUnit();
      (component as any).queryPanelRef = { nativeElement: document.createElement('div') };
    });

    it('should not auto-save when form is not shown', () => {
      component.showEntryForm.set(false);
      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when saving is in progress', () => {
      component.isSaving.set(true);
      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when validating unit', () => {
      (component as any).isValidatingUnit = true;
      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when click is inside query panel', () => {
      const panelEl = (component as any).queryPanelRef.nativeElement;
      const childEl = document.createElement('span');
      panelEl.appendChild(childEl);

      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onDocumentClick({ target: childEl } as any);

      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when click is inside CDK overlay', fakeAsync(() => {
      const overlayContainer = document.createElement('div');
      overlayContainer.classList.add('cdk-overlay-container');
      const overlayChild = document.createElement('div');
      overlayContainer.appendChild(overlayChild);
      document.body.appendChild(overlayContainer);

      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });
      component.onDocumentClick({ target: overlayChild } as any);
      tick();

      expect(apiServiceSpy.create).not.toHaveBeenCalled();
      overlayContainer.remove();
    }));

    it('should not auto-save when unit is not valid', () => {
      component.unitIdField = { parsedUnitId: 'UNIT123', isValid: false } as any;
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });

      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when no product code selected', () => {
      component.selectedProductCode.set(null);
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });

      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when attribGroup is missing', () => {
      component.attributeForm.patchValue({ attribGroup: null });

      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when attribCode is missing', () => {
      component.attributeForm.patchValue({ attribGroup: 'ALERT' });

      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when procDate is required but missing', () => {
      component.attributeForm.patchValue({
        attribGroup: 'ALERT', attribCode: 'AL02', procDate: null, procTime: null,
      });
      component.selectedAttributeCode.set(mockAttributeCodes[1]);

      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when procTime is missing but procDate required', () => {
      component.attributeForm.patchValue({
        attribGroup: 'ALERT', attribCode: 'AL02',
        procDate: moment('2024-05-28'), procTime: null,
      });
      component.selectedAttributeCode.set(mockAttributeCodes[1]);

      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should not auto-save when procTime is whitespace only', () => {
      component.attributeForm.patchValue({
        attribGroup: 'ALERT', attribCode: 'AL02',
        procDate: moment('2024-05-28'), procTime: '   ',
      });
      component.selectedAttributeCode.set(mockAttributeCodes[1]);

      component.onDocumentClick({ target: document.body } as any);
      expect(apiServiceSpy.create).not.toHaveBeenCalled();
    });

    it('should auto-save when all conditions are met', fakeAsync(() => {
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });

      component.onDocumentClick({ target: document.body } as any);
      tick();

      expect(apiServiceSpy.create).toHaveBeenCalled();
    }));

    it('should auto-save with procDate when required and present', fakeAsync(() => {
      component.attributeForm.patchValue({
        attribGroup: 'ALERT', attribCode: 'AL02',
        procDate: moment('2024-05-28'), procTime: '10:30',
      });
      component.selectedAttributeCode.set(mockAttributeCodes[1]);

      component.onDocumentClick({ target: document.body } as any);
      tick();

      expect(apiServiceSpy.create).toHaveBeenCalled();
    }));

    it('onProcDateBlur should trigger tryAutoSave via setTimeout', fakeAsync(() => {
      component.attributeForm.patchValue({ attribGroup: 'ALERT', attribCode: 'AL01' });

      component.onProcDateBlur();
      tick();

      expect(apiServiceSpy.create).toHaveBeenCalled();
    }));
  });

  describe('Sort and Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
      setupValidUnit();
    });

    it('should update sort state and reload grid on sort change', fakeAsync(() => {
      apiServiceSpy.getAll.calls.reset();
      component.onSortChange({ column: 'unitId', direction: 'A' });
      tick();

      expect(component.sortColumn()).toBe('unitId');
      expect(component.sortDirection()).toBe('asc');
      expect(component.gridPageIndex()).toBe(0);
      expect(apiServiceSpy.getAll).toHaveBeenCalled();
    }));

    it('should set descending sort direction', fakeAsync(() => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      tick();

      expect(component.sortDirection()).toBe('desc');
    }));

    it('should not reload grid when unitId is empty on sort change', fakeAsync(() => {
      component.unitIdField = { parsedUnitId: '', isValid: false } as any;
      apiServiceSpy.getAll.calls.reset();

      component.onSortChange({ column: 'unitId', direction: 'A' });
      tick();

      expect(apiServiceSpy.getAll).not.toHaveBeenCalled();
    }));

    it('should update page size and index on page change', () => {
      component.onPageChange({ pageSize: 50, pageIndex: 2 } as any);

      expect(component.gridPageSize()).toBe(50);
      expect(component.gridPageIndex()).toBe(2);
    });
  });

  describe('Clear Operations', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should clear all including unit', () => {
      component.showEntryForm.set(true);
      component.gridData.set(mockAttributeData);
      component.unitIdField = { clear: jasmine.createSpy('clear') } as any;

      component.clearAll();

      expect(component.unitIdField.clear).toHaveBeenCalled();
      expect(component.showEntryForm()).toBe(false);
      expect(component.gridData().length).toBe(0);
    });

    it('should clear form but preserve unit and products', () => {
      setupValidUnit();
      component.attributeForm.patchValue({ attribGroup: 'ALERT' });
      component.selectedAttributeCode.set(mockAttributeCodes[0]);

      component.clearForm();

      expect(component.attributeForm.get('attribGroup')?.value).toBeNull();
      expect(component.attributeForm.get('attribCode')?.disabled).toBeTrue();
      expect(component.selectedAttributeCode()).toBeNull();
      expect(component.selectedProductCode()).toBe('PROD001');
      expect(component.productCodeField.setValue).toHaveBeenCalled();
    });

    it('should clear product code field when no products available', () => {
      component.products.set([]);
      component.productCodeField = {
        clear: jasmine.createSpy('clear'),
        setValue: jasmine.createSpy('setValue'),
      } as any;

      component.clearForm();

      expect(component.productCodeField.clear).toHaveBeenCalled();
      expect(component.selectedProductCode()).toBeNull();
    });

    it('clearForm should reset procDate and procTime', () => {
      setupValidUnit();
      component.attributeForm.patchValue({
        attribGroup: 'ALERT', procDate: moment(), procTime: '10:30',
      });

      component.clearForm();

      expect(component.attributeForm.get('procDate')?.value).toBeNull();
      expect(component.attributeForm.get('procTime')?.value).toBeNull();
    });
  });

  describe('Expiration Date (expDate getter)', () => {
    it('should return -- when no lifeSpan', () => {
      component.selectedAttributeCode.set({
        attribCode: 'AL01', attribDescription: 'CMV', attribGroup: 'ALERT', lifeSpan: null,
      });
      expect(component.expDate).toBe('--');
    });

    it('should return -- when lifeSpan is 0', () => {
      component.selectedAttributeCode.set({
        attribCode: 'AL01', attribDescription: 'CMV', attribGroup: 'ALERT', lifeSpan: 0,
      });
      expect(component.expDate).toBe('--');
    });

    it('should return -- when selectedAttributeCode is null', () => {
      component.selectedAttributeCode.set(null);
      expect(component.expDate).toBe('--');
    });

    it('should return -- when no procDate', () => {
      component.selectedAttributeCode.set({
        attribCode: 'AL02', attribDescription: 'Irradiated', attribGroup: 'ALERT', lifeSpan: 14,
      });
      component.attributeForm.patchValue({ procDate: null }, { emitEvent: false });
      expect(component.expDate).toBe('--');
    });

    it('should return -- when procDate is not a Moment', () => {
      component.selectedAttributeCode.set({
        attribCode: 'AL02', attribDescription: 'Irradiated', attribGroup: 'ALERT', lifeSpan: 14,
      });
      component.attributeForm.patchValue({ procDate: 'not-a-moment' as any }, { emitEvent: false });
      expect(component.expDate).toBe('--');
    });

    it('should calculate expDate with days (default lifeSpanInd)', () => {
      component.selectedAttributeCode.set({
        attribCode: 'AL02', attribDescription: 'Irradiated', attribGroup: 'ALERT', lifeSpan: 14,
      });
      component.attributeForm.patchValue({ procDate: moment('2024-05-28') }, { emitEvent: false });

      expect(component.expDate).toBe('11-JUN-2024');
    });

    it('should calculate expDate with lifeSpanInd D (days)', () => {
      component.selectedAttributeCode.set({
        attribCode: 'AL02', attribDescription: 'Irradiated', attribGroup: 'ALERT',
        lifeSpan: 7, lifeSpanInd: 'D',
      });
      component.attributeForm.patchValue({ procDate: moment('2024-05-28') }, { emitEvent: false });

      expect(component.expDate).toBe('04-JUN-2024');
    });

    it('should calculate expDate with lifeSpanInd H (hours)', () => {
      component.selectedAttributeCode.set({
        attribCode: 'AL03', attribDescription: 'Test', attribGroup: 'ALERT',
        lifeSpan: 24, lifeSpanInd: 'H',
      });
      component.attributeForm.patchValue({ procDate: moment('2024-05-28') }, { emitEvent: false });

      expect(component.expDate).toBe('29-MAY-2024');
    });

    it('should calculate expDate with lifeSpanInd Y (years)', () => {
      component.selectedAttributeCode.set({
        attribCode: 'AL04', attribDescription: 'Test', attribGroup: 'ALERT',
        lifeSpan: 1, lifeSpanInd: 'Y',
      });
      component.attributeForm.patchValue({ procDate: moment('2024-05-28') }, { emitEvent: false });

      expect(component.expDate).toBe('28-MAY-2025');
    });

    it('should not mutate original procDate moment', () => {
      const procDate = moment('2024-05-28');
      component.selectedAttributeCode.set({
        attribCode: 'AL02', attribDescription: 'Test', attribGroup: 'ALERT', lifeSpan: 14,
      });
      component.attributeForm.patchValue({ procDate }, { emitEvent: false });

      component.expDate; // trigger getter
      expect(procDate.format('YYYY-MM-DD')).toBe('2024-05-28');
    });
  });

  describe('Date Formatting', () => {
    it('formatDate should return - for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('formatDate should return - for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('formatDate should return - for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('formatDate should format valid date', () => {
      expect(component.formatDate('2024-05-28T00:00:00Z')).toContain('28-MAY-2024');
    });

    it('formatDate should return raw value for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('formatDateTime should return - for null', () => {
      expect(component.formatDateTime(null)).toBe('-');
    });

    it('formatDateTime should return - for undefined', () => {
      expect(component.formatDateTime(undefined)).toBe('-');
    });

    it('formatDateTime should format valid datetime with time', () => {
      const formatted = component.formatDateTime('2024-05-28T10:30:00Z');
      expect(formatted).toContain('28-MAY-2024');
      expect(formatted).toContain(':');
    });

    it('formatDateTime should return raw value for invalid date', () => {
      expect(component.formatDateTime('not-a-date')).toBe('not-a-date');
    });
  });

  describe('Computed Signals', () => {
    it('filteredAttributeGroups should return all when no search term', () => {
      component.attributeGroups.set(mockAttributeGroups);
      expect(component.filteredAttributeGroups().length).toBe(2);
    });

    it('filteredAttributeGroups should filter by code', () => {
      component.attributeGroups.set(mockAttributeGroups);
      component.attribGroupSearch.setValue('alert');
      expect(component.filteredAttributeGroups().length).toBe(1);
      expect(component.filteredAttributeGroups()[0].code).toBe('ALERT');
    });

    it('filteredAttributeGroups should filter by description', () => {
      component.attributeGroups.set(mockAttributeGroups);
      component.attribGroupSearch.setValue('special');
      expect(component.filteredAttributeGroups().length).toBe(1);
      expect(component.filteredAttributeGroups()[0].code).toBe('SP');
    });

    it('filteredAttributeGroups should return empty for non-matching search', () => {
      component.attributeGroups.set(mockAttributeGroups);
      component.attribGroupSearch.setValue('xyz');
      expect(component.filteredAttributeGroups().length).toBe(0);
    });

    it('filteredAttributeCodes should return all when no search term', () => {
      component.attributeCodes.set(mockAttributeCodes);
      expect(component.filteredAttributeCodes().length).toBe(2);
    });

    it('filteredAttributeCodes should filter by attribCode', () => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attribCodeSearch.setValue('al02');
      expect(component.filteredAttributeCodes().length).toBe(1);
      expect(component.filteredAttributeCodes()[0].attribCode).toBe('AL02');
    });

    it('filteredAttributeCodes should filter by description', () => {
      component.attributeCodes.set(mockAttributeCodes);
      component.attribCodeSearch.setValue('irradiated');
      expect(component.filteredAttributeCodes().length).toBe(1);
    });

    it('procDateRequired should be false when no selectedAttributeCode', () => {
      component.selectedAttributeCode.set(null);
      expect(component.procDateRequired()).toBe(false);
    });

    it('procDateRequired should be true when selectedAttributeCode has lifeSpan', () => {
      component.selectedAttributeCode.set(mockAttributeCodes[1]);
      expect(component.procDateRequired()).toBe(true);
    });

    it('procDateRequired should be false when lifeSpan is null', () => {
      component.selectedAttributeCode.set(mockAttributeCodes[0]);
      expect(component.procDateRequired()).toBe(false);
    });

    it('minProcDate should use collDate when available', () => {
      component.unitCollDate.set('2024-05-28T00:00:00Z');
      const min = component.minProcDate();
      expect(min.format('YYYY-MM-DD')).toBe('2024-05-28');
    });

    it('minProcDate should fallback to today when no collDate', () => {
      component.unitCollDate.set('');
      const min = component.minProcDate();
      expect(min.format('YYYY-MM-DD')).toBe(moment().format('YYYY-MM-DD'));
    });

    it('pagedData should slice filteredData correctly', () => {
      const manyItems = Array.from({ length: 30 }, (_, i) => ({
        ...mockAttributeData[0],
        attribCode: `AL${String(i).padStart(2, '0')}`,
      }));
      component.filteredData.set(manyItems);
      component.gridPageSize.set(10);
      component.gridPageIndex.set(1);

      const paged = component.pagedData();
      expect(paged.length).toBe(10);
      expect(paged[0].attribCode).toBe('AL10');
    });

    it('pagedData should handle last page with fewer items', () => {
      const items = Array.from({ length: 15 }, (_, i) => ({
        ...mockAttributeData[0],
        attribCode: `AL${String(i).padStart(2, '0')}`,
      }));
      component.filteredData.set(items);
      component.gridPageSize.set(10);
      component.gridPageIndex.set(1);

      const paged = component.pagedData();
      expect(paged.length).toBe(5);
    });

    it('gridTotalCount should return filteredData length', () => {
      component.filteredData.set(mockAttributeData);
      expect(component.gridTotalCount()).toBe(1);
    });

    it('gridTotalCount should return 0 for empty data', () => {
      component.filteredData.set([]);
      expect(component.gridTotalCount()).toBe(0);
    });
  });

  describe('Form Controls', () => {
    it('f getter should return form controls', () => {
      expect(component.f.attribGroup).toBeDefined();
      expect(component.f.attribCode).toBeDefined();
      expect(component.f.procDate).toBeDefined();
      expect(component.f.procTime).toBeDefined();
    });
  });

  describe('parseProductCode', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.products.set(mockProducts);
    });

    it('should return null for empty value', (done) => {
      component.parseProductCode('').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null for whitespace-only value', (done) => {
      component.parseProductCode('   ').subscribe((result) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should match existing product in options', (done) => {
      component.parseProductCode('PROD001').subscribe((result) => {
        expect(result).not.toBeNull();
        expect(result!.code).toBe('PROD001');
        done();
      });
    });

    it('should match case-insensitively', (done) => {
      component.parseProductCode('prod001').subscribe((result) => {
        expect(result).not.toBeNull();
        expect(result!.code).toBe('PROD001');
        done();
      });
    });

    it('should fall through to labelScanService for non-matching codes', (done) => {
      const labelScanService = (component as any).labelScanService;
      spyOn(labelScanService, 'validateProductScan').and.returnValue(
        of({
          success: true,
          item: { productCode: 'NEWCODE', productDescription: 'New Product' },
        })
      );

      component.parseProductCode('NEWCODE').subscribe((result) => {
        expect(result).not.toBeNull();
        expect(result!.code).toBe('NEWCODE');
        done();
      });
    });

    it('should return existing option when labelScanService matches', (done) => {
      const labelScanService = (component as any).labelScanService;
      spyOn(labelScanService, 'validateProductScan').and.returnValue(
        of({
          success: true,
          item: { productCode: 'PROD002', productDescription: 'Platelets' },
        })
      );

      component.parseProductCode('SCANNED_PROD002').subscribe((result) => {
        expect(result).not.toBeNull();
        expect(result!.code).toBe('PROD002');
        done();
      });
    });

    it('should throw when labelScanService returns failure', (done) => {
      const labelScanService = (component as any).labelScanService;
      spyOn(labelScanService, 'validateProductScan').and.returnValue(
        of({ success: false, errorResponse: { error: 'Invalid code' } })
      );

      component.parseProductCode('BADCODE').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Invalid code');
          done();
        },
      });
    });

    it('should use fallback message when no errorResponse', (done) => {
      const labelScanService = (component as any).labelScanService;
      spyOn(labelScanService, 'validateProductScan').and.returnValue(
        of({ success: false, message: 'Not valid' })
      );

      component.parseProductCode('BADCODE').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Not valid');
          done();
        },
      });
    });

    it('should use generic message when no error info', (done) => {
      const labelScanService = (component as any).labelScanService;
      spyOn(labelScanService, 'validateProductScan').and.returnValue(
        of({ success: false })
      );

      component.parseProductCode('BADCODE').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Invalid product code');
          done();
        },
      });
    });
  });

  describe('Table Config', () => {
    it('should generate tableConfig with expected columns', () => {
      fixture.detectChanges();
      const config = component.tableConfig();
      expect(config.columns.length).toBe(7);
      expect(config.columns[0].key).toBe('unitId');
      expect(config.stickyHeader).toBe(true);
    });

    it('should include pagination in tableConfig', () => {
      fixture.detectChanges();
      const config = component.tableConfig();
      expect(config.pagination).toBeDefined();
      expect(config.pagination!.pageSizeOptions).toEqual([10, 25, 50]);
    });

    it('should format procDate column with valueFormatter', () => {
      fixture.detectChanges();
      const config = component.tableConfig();
      const procDateCol = config.columns.find((c) => c.key === 'procDate');
      expect(procDateCol?.valueFormatter).toBeDefined();
      expect(procDateCol!.valueFormatter!('2024-05-28T10:30:00Z')).toContain('28-MAY-2024');
    });

    it('should format newExpDate column with valueFormatter', () => {
      fixture.detectChanges();
      const config = component.tableConfig();
      const expDateCol = config.columns.find((c) => c.key === 'newExpDate');
      expect(expDateCol?.valueFormatter).toBeDefined();
      expect(expDateCol!.valueFormatter!(null)).toBe('-');
    });

    it('should include sort config', () => {
      fixture.detectChanges();
      component.sortColumn.set('unitId');
      component.sortDirection.set('asc');
      const config = component.tableConfig();
      expect(config.sortConfig).toBeDefined();
    });

    it('should show empty message', () => {
      fixture.detectChanges();
      const config = component.tableConfig();
      expect(config.emptyMessage).toBe('No attributes found for this unit.');
    });
  });

  describe('Lifecycle', () => {
    it('should clean up on destroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Empty handlers', () => {
    it('onUnitValidated should be callable', () => {
      expect(() => component.onUnitValidated({} as any)).not.toThrow();
    });

    it('onRowAction should be callable', () => {
      expect(() => component.onRowAction({} as any)).not.toThrow();
    });

    it('onAttribCodeSelected should be callable', () => {
      expect(() => component.onAttribCodeSelected()).not.toThrow();
    });
  });

  describe('parseProductCode - scan pattern validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.products.set(mockProducts);
    });

    it('should throw error for scan prefix with invalid length', (done) => {
      component.parseProductCode('=<SHORT').subscribe({
        error: (err: Error) => {
          expect(err.message).toBe('Invalid scan length');
          done();
        },
      });
    });

    it('should strip scan prefix and match product', (done) => {
      component.products.set([{ productCode: 'E0385V00', productDescription: 'Test' }]);
      component.parseProductCode('=<E0385V00').subscribe((result) => {
        expect(result).not.toBeNull();
        expect(result!.code).toBe('E0385V00');
        done();
      });
    });
  });

  describe('productCodeOptions with null description', () => {
    it('should handle null productDescription gracefully', () => {
      component.products.set([
        { productCode: 'P001', productDescription: null as any },
      ]);
      const options = component.productCodeOptions();
      expect(options[0].description).toBe('');
    });
  });

  describe('maxProcDate computed', () => {
    it('should fallback to today when chapterLocalDate returns null', () => {
      const chapterSvc = TestBed.inject(ChapterTimezoneService);
      (chapterSvc.chapterLocalDate as jasmine.Spy).and.returnValue(null);
      fixture.detectChanges();

      const max = component.maxProcDate();
      expect(max.format('YYYY-MM-DD')).toBe(moment().format('YYYY-MM-DD'));
    });
  });

  describe('loadProductsForUnit passes collDate', () => {
    it('should call API with both unitId and collDate', fakeAsync(() => {
      fixture.detectChanges();
      component.productCodeField = {
        setValue: jasmine.createSpy('setValue'),
        clear: jasmine.createSpy('clear'),
      } as any;
      apiServiceSpy.getProductsForUnit.and.returnValue(of(mockProducts));

      (component as any).loadProductsForUnit('UNIT123', '2024-05-28T00:00:00Z');
      tick();

      expect(apiServiceSpy.getProductsForUnit).toHaveBeenCalledWith('UNIT123', '2024-05-28T00:00:00Z');
    }));
  });

  describe('loadProductsForUnit auto-selects with pipe description', () => {
    it('should strip pipe suffix when auto-selecting first product', fakeAsync(() => {
      fixture.detectChanges();
      component.productCodeField = {
        setValue: jasmine.createSpy('setValue'),
        clear: jasmine.createSpy('clear'),
      } as any;
      apiServiceSpy.getProductsForUnit.and.returnValue(of([
        { productCode: 'E0385V00', productDescription: 'RED BLOOD CELLS|AS5/450mL/refg' },
      ]));

      (component as any).loadProductsForUnit('UNIT123', '2024-05-28');
      tick();

      expect(component.productCodeField.setValue).toHaveBeenCalledWith('E0385V00', 'RED BLOOD CELLS');
    }));

    it('should handle null productDescription when auto-selecting', fakeAsync(() => {
      fixture.detectChanges();
      component.productCodeField = {
        setValue: jasmine.createSpy('setValue'),
        clear: jasmine.createSpy('clear'),
      } as any;
      apiServiceSpy.getProductsForUnit.and.returnValue(of([
        { productCode: 'P001', productDescription: null as any },
      ]));

      (component as any).loadProductsForUnit('UNIT123', '2024-05-28');
      tick();

      expect(component.productCodeField.setValue).toHaveBeenCalledWith('P001', '');
    }));
  });

  describe('sortColumnMap fallback', () => {
    it('should pass null sortColumn for unmapped column keys', fakeAsync(() => {
      fixture.detectChanges();
      setupValidUnit();
      component.sortColumn.set('attribGroup');
      component.sortDirection.set('asc');
      apiServiceSpy.getAll.calls.reset();

      (component as any).loadAttributesForUnit('UNIT123');
      tick();

      const callArgs = apiServiceSpy.getAll.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBeNull();
    }));
  });

  describe('headerConfig', () => {
    it('should have default breadcrumbs with Home', () => {
      const config = component.headerConfig();
      expect(config.breadcrumbs.length).toBe(1);
      expect(config.breadcrumbs[0].label).toBe('Home');
      expect(config.breadcrumbs[0].link).toBe('/home');
    });
  });
});
