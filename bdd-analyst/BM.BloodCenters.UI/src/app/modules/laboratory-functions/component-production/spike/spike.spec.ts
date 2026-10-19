import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { DebugElement, signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';

import { SpikeComponent } from './spike';
import { SpikeApiService } from './services/spike-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ProcessCodeDto,
  SpikingTypeDto,
  ProductDto,
  LotNumberDto,
  ComponentSpikingResponseDto,
} from './models/spike.model';

describe('SpikeComponent', () => {
  let apiSpy: any;
  let component: SpikeComponent;
  let fixture: ComponentFixture<SpikeComponent>;
  let spikeApiServiceSpy: jasmine.SpyObj<SpikeApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceMock: any;

  const mockProcessCodes: ProcessCodeDto[] = [
    { processCode: 'REG', processCodeDesc: 'Regular Processing' },
    { processCode: 'FR01', processCodeDesc: 'Special Process 1' },
  ];

  const mockSpikingTypes: SpikingTypeDto[] = [
    { spikingType: 'TYPE1', spikingTypeDesc: 'Type 1 Spiking' },
    { spikingType: 'TYPE2', spikingTypeDesc: 'Type 2 Spiking' },
  ];

  const mockProducts: ProductDto[] = [
    { productCode: 'PROD01', productDesc: 'Red Blood Cells', componentPrefix: 'CP001', productType: 'WB' },
    { productCode: 'PROD02', productDesc: 'Plasma', componentPrefix: 'CP002', productType: 'PL' },
  ];

  const mockBagLots: LotNumberDto[] = [
    { lotNumber: 'LOT001' },
    { lotNumber: 'LOT002' },
  ];

  const mockFilterLots: LotNumberDto[] = [
    { lotNumber: 'FLOT001' },
    { lotNumber: 'FLOT002' },
  ];

  const mockUnitValidationResponse = {
    parsedUnitId: 'UNIT001',
    isValid: true,
    message: 'Unit validated successfully',
    checkDigit: null,
    codeScheme: 'I' as const,
    manualUnitId: 'UNIT001',
    codabarUnitScheme: null,
    entryMode: 'S' as const,
    barcodeType: 'CODE128' as const,
    chapterScheme: 'I' as const,
  };

  const mockResponse: ComponentSpikingResponseDto = {
    unitId: 'UNIT001',
    collDate: '2024-01-15T00:00:00Z',
    chapterId: 'CH001',
    productCode: 'PROD01',
    componentPrefix: 'CP001',
    processCode: 'REG',
    spikingType: 'TYPE1',
    bagLotNumber: 'LOT001',
    filterLotNumber: null,
    bagsSpiked: 5,
    bagsForComponents: 3,
    bagsUsed: 0,
    insertDats: '2024-01-15T10:30:00Z',
    insertUserId: 'USER001',
    programId: 'FRISPIKE',
  };

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('SpikeApiService', [
      'getProcessCodes',
      'getSpikingTypes',
      'getBagLots',
      'getFilterLots',
      'getProducts',
      'createComponentSpiking',
      'getUnitCollectionDates',
    ]);

    const snackbarSpy = createMockSnackbarService();

    const pageHeaderServiceMock = {
      pageHeaderData: signal({ title: 'Spike a Component', subtitle: '' }),
      getCurrentMenuItem: () => ({ label: 'Spike a Component', subtitle: '' }),
      getTitle: () => 'Spike a Component',
      getSubtitle: () => '',
    };

    headerServiceMock = {
      chapterId: signal('DAL'),
      chapterTimeZone: () => 'America/Chicago',
      getCurrentChapterId: () => 'DAL',
    };

    apiSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));
    apiSpy.getSpikingTypes.and.returnValue(of(mockSpikingTypes));
    apiSpy.getBagLots.and.returnValue(of(mockBagLots));
    apiSpy.getFilterLots.and.returnValue(of(mockFilterLots));

    TestBed.configureTestingModule({
      imports: [SpikeComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        { provide: SpikeApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: HeaderService, useValue: headerServiceMock },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) },
        },
      ],
    });

    apiSpy.getProcessCodes.calls.reset();
    apiSpy.getSpikingTypes.calls.reset();
    apiSpy.getBagLots.calls.reset();
    apiSpy.getFilterLots.calls.reset();
    apiSpy.getProducts.calls.reset();
    apiSpy.createComponentSpiking.calls.reset();
    apiSpy.getUnitCollectionDates.calls.reset();
    apiSpy.getProcessCodes.and.returnValue(of(mockProcessCodes));
    apiSpy.getSpikingTypes.and.returnValue(of(mockSpikingTypes));
    apiSpy.getBagLots.and.returnValue(of(mockBagLots));
    apiSpy.getFilterLots.and.returnValue(of(mockFilterLots));

    fixture = TestBed.createComponent(SpikeComponent);
    component = fixture.componentInstance;
    spikeApiServiceSpy = TestBed.inject(SpikeApiService) as jasmine.SpyObj<SpikeApiService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize the form with correct controls', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.form).toBeTruthy();
      expect(component.form.get('processCode')).toBeTruthy();
      expect(component.form.get('productCode')).toBeTruthy();
      expect(component.form.get('componentPrefix')).toBeTruthy();
      expect(component.form.get('spikingType')).toBeTruthy();
      expect(component.form.get('bagLotNumber')).toBeTruthy();
      expect(component.form.get('filterLotNumber')).toBeTruthy();
      expect(component.form.get('bagsSpiked')).toBeTruthy();
      expect(component.form.get('bagsForComponents')).toBeTruthy();
    }));

    it('should load dropdown data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(spikeApiServiceSpy.getProcessCodes).toHaveBeenCalled();
      expect(spikeApiServiceSpy.getSpikingTypes).toHaveBeenCalled();
      expect(spikeApiServiceSpy.getBagLots).toHaveBeenCalled();
    }));

    it('should populate filtered arrays after dropdown data loads', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).filteredProcessCodes).toEqual(mockProcessCodes);
      expect((component as any).filteredSpikingTypes).toEqual(mockSpikingTypes);
      expect((component as any).filteredBagLots).toEqual(mockBagLots);
    }));

    it('should set loading to false after dropdown data loads', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).loading()).toBeFalse();
    }));

    it('should handle individual dropdown errors gracefully via catchError', fakeAsync(() => {
      apiSpy.getProcessCodes.and.returnValue(throwError(() => new Error('fail')));
      apiSpy.getSpikingTypes.and.returnValue(throwError(() => new Error('fail')));
      apiSpy.getBagLots.and.returnValue(throwError(() => new Error('fail')));

      fixture.detectChanges();
      tick();

      expect((component as any).loading()).toBeFalse();
    }));

    it('should set initial header config', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.headerConfig).toBeTruthy();
      expect(component.headerConfig.breadcrumbs.length).toBe(2);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    }));

    it('should set default displayedColumns', () => {
      expect(component.displayedColumns).toEqual([
        'unitId', 'productCode', 'type', 'bagLotNumber', 'filterLotNumber', 'bags', 'numberOfComponent',
      ]);
    });

    it('should have default page size of 25', () => {
      expect(component.pageSize).toBe(25);
    });

    it('should have default page index of 0', () => {
      expect(component.pageIndex).toBe(0);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));
  });

  describe('Unit Validation', () => {
    it('should handle unit validated event', fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      spikeApiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'REG' });
      component.onUnitValidated(mockUnitValidationResponse as any);
      tick();

      expect(component.validatedUnitData).toBeTruthy();
      expect(component.validatedUnitData?.parsedUnitId).toBe('UNIT001');
    }));

    it('should clear products and reset form fields when unit is validated', fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      spikeApiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'REG', productCode: 'OLDPROD' });
      component.onUnitValidated(mockUnitValidationResponse as any);
      tick();

      expect(component.form.get('productCode')?.value).toBe('');
      expect(component.form.get('componentPrefix')?.value).toBe('');
    }));

    it('should set unitAlreadyScanned to false for a new unit', fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      spikeApiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      fixture.detectChanges();

      component.form.patchValue({ processCode: 'REG' });
      component.onUnitValidated(mockUnitValidationResponse as any);
      tick();

      expect((component as any).unitAlreadyScanned()).toBeFalse();
    }));

    it('should detect already scanned unit in session', fakeAsync(() => {
      fixture.detectChanges();

      (component as any).tableData.set([{
        unitId: 'UNIT001',
        productCode: 'PROD01',
        type: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '-',
        bags: 5,
        numberOfComponent: 3,
      }]);

      component.onUnitValidated({ parsedUnitId: 'UNIT001', isValid: true } as any);
      tick();

      expect((component as any).unitAlreadyScanned()).toBeTrue();
    }));

    it('should not set validatedUnitData when unit already scanned', fakeAsync(() => {
      fixture.detectChanges();

      (component as any).tableData.set([{
        unitId: 'UNIT001',
        productCode: 'PROD01',
        type: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '-',
        bags: 5,
        numberOfComponent: 3,
      }]);

      component.validatedUnitData = null;
      component.onUnitValidated({ parsedUnitId: 'UNIT001' } as any);
      tick();

      expect(component.validatedUnitData).toBeNull();
    }));
  });

  describe('onUnitCleared', () => {
    it('should clear validated unit data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.validatedUnitData = mockUnitValidationResponse as any;
      component.selectedCollDate = '2024-01-15';

      component.onUnitCleared();

      expect(component.validatedUnitData).toBeNull();
      expect(component.selectedCollDate).toBe('');
    }));

    it('should reset unitAlreadyScanned signal', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).unitAlreadyScanned.set(true);
      component.onUnitCleared();

      expect((component as any).unitAlreadyScanned()).toBeFalse();
    }));

    it('should clear product code and component prefix', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ productCode: 'PROD01', componentPrefix: 'CP001' });
      component.onUnitCleared();

      expect(component.form.get('productCode')?.value).toBe('');
      expect(component.form.get('componentPrefix')?.value).toBe('');
    }));

    it('should clear products, filteredProducts, filterLots, and filteredFilterLots', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).products.set(mockProducts);
      (component as any).filteredProducts = mockProducts;
      (component as any).filterLots.set(mockFilterLots);
      (component as any).filteredFilterLots = mockFilterLots;

      component.onUnitCleared();

      expect((component as any).products()).toEqual([]);
      expect((component as any).filteredProducts).toEqual([]);
      expect((component as any).filterLots()).toEqual([]);
      expect((component as any).filteredFilterLots).toEqual([]);
    }));
  });

  describe('Product Selection', () => {
    it('should auto-populate component prefix when product is selected', fakeAsync(() => {
      spikeApiServiceSpy.getFilterLots.and.returnValue(of(mockFilterLots));
      spikeApiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      fixture.detectChanges();

      component.form.get('processCode')?.setValue('REG');
      (component as any).products.set(mockProducts);
      (component as any).filteredProducts = mockProducts;

      component.form.get('productCode')?.setValue('PROD01');
      tick();

      expect(component.form.get('componentPrefix')?.value).toBe('CP001');
    }));

    it('should load filter lots when product is selected', fakeAsync(() => {
      spikeApiServiceSpy.getFilterLots.and.returnValue(of(mockFilterLots));
      fixture.detectChanges();

      (component as any).products.set(mockProducts);

      component.form.get('productCode')?.setValue('PROD01');
      tick();

      expect(spikeApiServiceSpy.getFilterLots).toHaveBeenCalled();
      expect((component as any).filterLots()).toEqual(mockFilterLots);
      expect((component as any).filteredFilterLots).toEqual(mockFilterLots);
    }));

    it('should handle filter lots load error', fakeAsync(() => {
      spikeApiServiceSpy.getFilterLots.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      (component as any).products.set(mockProducts);

      component.form.get('productCode')?.setValue('PROD01');
      tick();

      expect((component as any).filterLots()).toEqual([]);
      expect((component as any).filteredFilterLots).toEqual([]);
    }));

    it('should clear component prefix when product is cleared', fakeAsync(() => {
      fixture.detectChanges();

      component.form.get('componentPrefix')?.setValue('CP001');

      component.form.get('productCode')?.setValue('');
      tick();

      expect(component.form.get('componentPrefix')?.value).toBe('');
    }));

    it('should clear filter lots when product is cleared', fakeAsync(() => {
      fixture.detectChanges();

      (component as any).filterLots.set(mockFilterLots);
      (component as any).filteredFilterLots = mockFilterLots;

      component.form.get('productCode')?.setValue('');
      tick();

      expect((component as any).filterLots()).toEqual([]);
      expect((component as any).filteredFilterLots).toEqual([]);
    }));
  });

  describe('Process Code Change', () => {
    it('should clear product code and component prefix on process code change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({ productCode: 'PROD01', componentPrefix: 'CP001' }, { emitEvent: false });

      component.form.get('processCode')?.setValue('FR01');
      tick();

      expect(component.form.get('productCode')?.value).toBe('');
      expect(component.form.get('componentPrefix')?.value).toBe('');
    }));

    it('should clear validatedUnitData on process code change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.validatedUnitData = mockUnitValidationResponse as any;

      component.form.get('processCode')?.setValue('FR01');
      tick();

      expect(component.validatedUnitData).toBeNull();
    }));

    it('should clear products and filteredProducts on process code change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).products.set(mockProducts);
      (component as any).filteredProducts = mockProducts;

      component.form.get('processCode')?.setValue('FR01');
      tick();

      expect((component as any).products()).toEqual([]);
      expect((component as any).filteredProducts).toEqual([]);
    }));

    it('should update process description on process code change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('processCode')?.setValue('REG');
      tick();

      expect((component as any).selectedProcessDescription()).toBe('Regular Processing');
    }));

    it('should clear process description when process code is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('processCode')?.setValue('REG');
      tick();
      component.form.get('processCode')?.setValue('');
      tick();

      expect((component as any).selectedProcessDescription()).toBe('');
    }));

    it('should set empty description when process code not found', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('processCode')?.setValue('NONEXISTENT');
      tick();

      expect((component as any).selectedProcessDescription()).toBe('');
    }));
  });

  describe('loadProductCodes', () => {
    it('should not load products when unitId is missing', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.validatedUnitData = null;
      component.form.get('processCode')?.setValue('REG', { emitEvent: false });

      (component as any).loadProductCodes();
      tick();

      expect(spikeApiServiceSpy.getUnitCollectionDates).not.toHaveBeenCalled();
    }));

    it('should not load products when processCode is missing', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.validatedUnitData = mockUnitValidationResponse as any;
      component.form.get('processCode')?.setValue('', { emitEvent: false });

      (component as any).loadProductCodes();
      tick();

      expect(spikeApiServiceSpy.getUnitCollectionDates).not.toHaveBeenCalled();
    }));

    it('should load products with collection dates', fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      spikeApiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      fixture.detectChanges();
      tick();

      component.validatedUnitData = mockUnitValidationResponse as any;
      component.form.get('processCode')?.setValue('REG', { emitEvent: false });

      (component as any).loadProductCodes();
      tick();

      expect(spikeApiServiceSpy.getUnitCollectionDates).toHaveBeenCalledWith('UNIT001', 'DAL');
      expect(spikeApiServiceSpy.getProducts).toHaveBeenCalledWith('UNIT001', '2024-01-15', 'REG', 'DAL');
      expect(component.selectedCollDate).toBe('2024-01-15');
      expect((component as any).products()).toEqual(mockProducts);
    }));

    it('should auto-select product when only one is available', fakeAsync(() => {
      const singleProduct: ProductDto[] = [
        { productCode: 'PROD01', productDesc: 'Red Blood Cells', componentPrefix: 'CP001' },
      ];
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      spikeApiServiceSpy.getProducts.and.returnValue(of(singleProduct));
      spikeApiServiceSpy.getFilterLots.and.returnValue(of(mockFilterLots));
      fixture.detectChanges();
      tick();

      component.validatedUnitData = mockUnitValidationResponse as any;
      component.form.get('processCode')?.setValue('REG', { emitEvent: false });

      (component as any).loadProductCodes();
      tick();

      expect(component.form.get('productCode')?.value).toBe('PROD01');
    }));

    it('should handle empty collection dates', fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([]));
      fixture.detectChanges();
      tick();

      component.validatedUnitData = mockUnitValidationResponse as any;
      component.form.get('processCode')?.setValue('REG', { emitEvent: false });

      (component as any).loadProductCodes();
      tick();

      expect((component as any).products()).toEqual([]);
      expect(component.selectedCollDate).toBe('');
    }));

    it('should handle product loading error', fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      component.validatedUnitData = mockUnitValidationResponse as any;
      component.form.get('processCode')?.setValue('REG', { emitEvent: false });

      (component as any).loadProductCodes();
      tick();

      expect((component as any).products()).toEqual([]);
      expect(component.selectedCollDate).toBe('');
      expect((component as any).loadingProducts()).toBeFalse();
    }));

    it('should set loadingProducts to false after load completes', fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      spikeApiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      fixture.detectChanges();
      tick();

      component.validatedUnitData = mockUnitValidationResponse as any;
      component.form.get('processCode')?.setValue('REG', { emitEvent: false });

      (component as any).loadProductCodes();
      tick();

      expect((component as any).loadingProducts()).toBeFalse();
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require processCode', () => {
      component.form.get('processCode')?.setValue('');
      expect(component.form.get('processCode')?.hasError('required')).toBeTrue();
    });

    it('should require productCode', () => {
      component.form.get('productCode')?.setValue('');
      expect(component.form.get('productCode')?.hasError('required')).toBeTrue();
    });

    it('should require spikingType', () => {
      component.form.get('spikingType')?.setValue('');
      expect(component.form.get('spikingType')?.hasError('required')).toBeTrue();
    });

    it('should require bagLotNumber', () => {
      component.form.get('bagLotNumber')?.setValue('');
      expect(component.form.get('bagLotNumber')?.hasError('required')).toBeTrue();
    });

    it('should require bagsSpiked', () => {
      component.form.get('bagsSpiked')?.setValue(null);
      expect(component.form.get('bagsSpiked')?.hasError('required')).toBeTrue();
    });

    it('should require bagsForComponents', () => {
      component.form.get('bagsForComponents')?.setValue(null);
      expect(component.form.get('bagsForComponents')?.hasError('required')).toBeTrue();
    });

    it('should not require filterLotNumber', () => {
      component.form.get('filterLotNumber')?.setValue('');
      expect(component.form.get('filterLotNumber')?.hasError('required')).toBeFalsy();
    });

    it('should not require componentPrefix', () => {
      component.form.get('componentPrefix')?.setValue('');
      expect(component.form.get('componentPrefix')?.hasError('required')).toBeFalsy();
    });

    it('should validate max length for processCode', () => {
      component.form.get('processCode')?.setValue('12345678901'); // 11 chars, max is 10
      expect(component.form.get('processCode')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate max length for productCode', () => {
      component.form.get('productCode')?.setValue('12345678901');
      expect(component.form.get('productCode')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate max length for spikingType', () => {
      component.form.get('spikingType')?.setValue('12345678901');
      expect(component.form.get('spikingType')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate max length for bagLotNumber (30)', () => {
      component.form.get('bagLotNumber')?.setValue('A'.repeat(31));
      expect(component.form.get('bagLotNumber')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate max length for filterLotNumber (50)', () => {
      component.form.get('filterLotNumber')?.setValue('A'.repeat(51));
      expect(component.form.get('filterLotNumber')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate max length for componentPrefix (10)', () => {
      component.form.get('componentPrefix')?.setValue('12345678901');
      expect(component.form.get('componentPrefix')?.hasError('maxlength')).toBeTrue();
    });

    it('should validate number range for bagsSpiked', () => {
      component.form.get('bagsSpiked')?.setValue(100);
      expect(component.form.get('bagsSpiked')?.hasError('max')).toBeTrue();

      component.form.get('bagsSpiked')?.setValue(-1);
      expect(component.form.get('bagsSpiked')?.hasError('min')).toBeTrue();
    });

    it('should validate number range for bagsForComponents', () => {
      component.form.get('bagsForComponents')?.setValue(100);
      expect(component.form.get('bagsForComponents')?.hasError('max')).toBeTrue();

      component.form.get('bagsForComponents')?.setValue(-1);
      expect(component.form.get('bagsForComponents')?.hasError('min')).toBeTrue();
    });

    it('should accept valid bagsSpiked value of 0', () => {
      component.form.get('bagsSpiked')?.setValue(0);
      expect(component.form.get('bagsSpiked')?.hasError('min')).toBeFalse();
      expect(component.form.get('bagsSpiked')?.hasError('max')).toBeFalse();
    });

    it('should accept valid bagsSpiked value of 99', () => {
      component.form.get('bagsSpiked')?.setValue(99);
      expect(component.form.get('bagsSpiked')?.hasError('max')).toBeFalse();
    });

    it('should validate bagsForComponents does not exceed bagsSpiked', () => {
      component.form.get('bagsSpiked')?.setValue(3);
      component.form.get('bagsForComponents')?.setValue(5);
      component.form.get('bagsForComponents')?.updateValueAndValidity();

      expect(component.form.get('bagsForComponents')?.hasError('exceedsBagsSpiked')).toBeTrue();
    });

    it('should pass validation when bagsForComponents equals bagsSpiked', () => {
      component.form.get('bagsSpiked')?.setValue(5);
      component.form.get('bagsForComponents')?.setValue(5);
      component.form.get('bagsForComponents')?.updateValueAndValidity();

      expect(component.form.get('bagsForComponents')?.hasError('exceedsBagsSpiked')).toBeFalse();
    });

    it('should pass validation when bagsForComponents is less than bagsSpiked', () => {
      component.form.get('bagsSpiked')?.setValue(5);
      component.form.get('bagsForComponents')?.setValue(3);
      component.form.get('bagsForComponents')?.updateValueAndValidity();

      expect(component.form.get('bagsForComponents')?.hasError('exceedsBagsSpiked')).toBeFalse();
    });

    it('should pass custom validation when bagsSpiked is null', () => {
      component.form.get('bagsSpiked')?.setValue(null);
      component.form.get('bagsForComponents')?.setValue(5);
      component.form.get('bagsForComponents')?.updateValueAndValidity();

      expect(component.form.get('bagsForComponents')?.hasError('exceedsBagsSpiked')).toBeFalse();
    });

    it('should pass custom validation when bagsForComponents is null', () => {
      component.form.get('bagsSpiked')?.setValue(5);
      component.form.get('bagsForComponents')?.setValue(null);
      component.form.get('bagsForComponents')?.updateValueAndValidity();

      expect(component.form.get('bagsForComponents')?.hasError('exceedsBagsSpiked')).toBeFalse();
    });
  });

  describe('Form Listeners - bagsSpiked auto-fill', () => {
    it('should auto-fill bagsForComponents when bagsSpiked changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('bagsSpiked')?.setValue(7);
      tick();

      expect(component.form.get('bagsForComponents')?.value).toBe(7);
    }));

    it('should not auto-fill bagsForComponents when bagsSpiked is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('bagsForComponents')?.setValue(3, { emitEvent: false });
      component.form.get('bagsSpiked')?.setValue(null);
      tick();

      expect(component.form.get('bagsForComponents')?.value).toBe(3);
    }));

    it('should re-validate bagsForComponents when bagsSpiked changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.get('bagsForComponents')?.setValue(5, { emitEvent: false });
      component.form.get('bagsSpiked')?.setValue(3);
      tick();

      // bagsForComponents is auto-filled to 3 by the listener
      expect(component.form.get('bagsForComponents')?.value).toBe(3);
    }));
  });

  describe('Search Control Filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter process codes by code', fakeAsync(() => {
      component.processSearchControl.setValue('REG');
      tick();

      expect((component as any).filteredProcessCodes.length).toBe(1);
      expect((component as any).filteredProcessCodes[0].processCode).toBe('REG');
    }));

    it('should filter process codes by description', fakeAsync(() => {
      component.processSearchControl.setValue('Special');
      tick();

      expect((component as any).filteredProcessCodes.length).toBe(1);
      expect((component as any).filteredProcessCodes[0].processCode).toBe('FR01');
    }));

    it('should return all process codes when search is empty', fakeAsync(() => {
      component.processSearchControl.setValue('');
      tick();

      expect((component as any).filteredProcessCodes.length).toBe(2);
    }));

    it('should filter spiking types by type code', fakeAsync(() => {
      component.spikingTypeSearchControl.setValue('TYPE1');
      tick();

      expect((component as any).filteredSpikingTypes.length).toBe(1);
      expect((component as any).filteredSpikingTypes[0].spikingType).toBe('TYPE1');
    }));

    it('should filter spiking types by description', fakeAsync(() => {
      component.spikingTypeSearchControl.setValue('Type 2');
      tick();

      expect((component as any).filteredSpikingTypes.length).toBe(1);
      expect((component as any).filteredSpikingTypes[0].spikingType).toBe('TYPE2');
    }));

    it('should return all spiking types when search is empty', fakeAsync(() => {
      component.spikingTypeSearchControl.setValue('');
      tick();

      expect((component as any).filteredSpikingTypes.length).toBe(2);
    }));

    it('should filter products by product code', fakeAsync(() => {
      (component as any).products.set(mockProducts);
      component.productSearchControl.setValue('PROD01');
      tick();

      expect((component as any).filteredProducts.length).toBe(1);
      expect((component as any).filteredProducts[0].productCode).toBe('PROD01');
    }));

    it('should return all products when search is empty', fakeAsync(() => {
      (component as any).products.set(mockProducts);
      component.productSearchControl.setValue('');
      tick();

      expect((component as any).filteredProducts.length).toBe(2);
    }));

    it('should filter bag lots by lot number', fakeAsync(() => {
      component.bagLotSearchControl.setValue('LOT001');
      tick();

      expect((component as any).filteredBagLots.length).toBe(1);
      expect((component as any).filteredBagLots[0].lotNumber).toBe('LOT001');
    }));

    it('should return all bag lots when search is empty', fakeAsync(() => {
      component.bagLotSearchControl.setValue('');
      tick();

      expect((component as any).filteredBagLots.length).toBe(2);
    }));

    it('should filter filter lots by lot number', fakeAsync(() => {
      (component as any).filterLots.set(mockFilterLots);
      component.filterLotSearchControl.setValue('FLOT001');
      tick();

      expect((component as any).filteredFilterLots.length).toBe(1);
      expect((component as any).filteredFilterLots[0].lotNumber).toBe('FLOT001');
    }));

    it('should return all filter lots when search is empty', fakeAsync(() => {
      (component as any).filterLots.set(mockFilterLots);
      component.filterLotSearchControl.setValue('');
      tick();

      expect((component as any).filteredFilterLots.length).toBe(2);
    }));

    it('should return empty array when no process codes match', fakeAsync(() => {
      component.processSearchControl.setValue('NONEXISTENT');
      tick();

      expect((component as any).filteredProcessCodes.length).toBe(0);
    }));

    it('should be case-insensitive for process code search', fakeAsync(() => {
      component.processSearchControl.setValue('reg');
      tick();

      expect((component as any).filteredProcessCodes.length).toBe(1);
      expect((component as any).filteredProcessCodes[0].processCode).toBe('REG');
    }));

    it('should be case-insensitive for spiking type search', fakeAsync(() => {
      component.spikingTypeSearchControl.setValue('type 1');
      tick();

      expect((component as any).filteredSpikingTypes.length).toBe(1);
    }));

    it('should handle spiking type with null description', fakeAsync(() => {
      (component as any).spikingTypes.set([
        { spikingType: 'TYPE1', spikingTypeDesc: null as any },
      ]);
      component.spikingTypeSearchControl.setValue('something');
      tick();

      expect((component as any).filteredSpikingTypes.length).toBe(0);
    }));
  });

  describe('Form Submission', () => {
    beforeEach(fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      spikeApiServiceSpy.getProducts.and.returnValue(of(mockProducts));

      fixture.detectChanges();

      component.form.get('processCode')?.setValue('REG');
      tick();

      component.onUnitValidated({ parsedUnitId: 'UNIT001', isValid: true } as any);
      tick();

      (component as any).unitIdField = { isValid: true, clear: jasmine.createSpy('clear') };
      component.selectedCollDate = '2024-01-15';
    }));

    it('should set submitted to true on submit', () => {
      component.onSubmit();
      expect(component.submitted).toBeTrue();
    });

    it('should not submit when unit is not validated', () => {
      component.validatedUnitData = null;

      component.form.patchValue({
        processCode: 'REG',
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      expect(spikeApiServiceSpy.createComponentSpiking).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should not submit when unitIdField.isValid is false', () => {
      (component as any).unitIdField = { isValid: false, clear: jasmine.createSpy('clear') };

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      expect(spikeApiServiceSpy.createComponentSpiking).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please validate the unit ID before submitting');
    });

    it('should not submit when no collection date', () => {
      component.selectedCollDate = '';

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      expect(spikeApiServiceSpy.createComponentSpiking).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No collection date found for this unit');
    });

    it('should not submit when form is invalid', fakeAsync(() => {
      component.form.patchValue({
        productCode: '',
        spikingType: '',
        bagLotNumber: '',
        bagsSpiked: null,
        bagsForComponents: null,
      });

      component.onSubmit();
      tick();
      expect(spikeApiServiceSpy.createComponentSpiking).not.toHaveBeenCalled();
    }));

    it('should submit when form is valid and unit is validated', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(spikeApiServiceSpy.createComponentSpiking).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('1 Entry saved');
    }));

    it('should pass correct DTO to createComponentSpiking', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: 'FLOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      const calledDto = spikeApiServiceSpy.createComponentSpiking.calls.mostRecent().args[0];
      expect(calledDto.unitId).toBe('UNIT001');
      expect(calledDto.collDate).toBe('2024-01-15');
      expect(calledDto.productCode).toBe('PROD01');
      expect(calledDto.componentPrefix).toBe('CP001');
      expect(calledDto.processCode).toBe('REG');
      expect(calledDto.spikingType).toBe('TYPE1');
      expect(calledDto.bagLotNumber).toBe('LOT001');
      expect(calledDto.filterLotNumber).toBe('FLOT001');
      expect(calledDto.bagsSpiked).toBe(5);
      expect(calledDto.bagsForComponents).toBe(3);
    }));

    it('should pass null filterLotNumber when empty', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      const calledDto = spikeApiServiceSpy.createComponentSpiking.calls.mostRecent().args[0];
      expect(calledDto.filterLotNumber).toBeNull();
    }));

    it('should add row to table data after successful submission', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      const tableData = (component as any).tableData();
      expect(tableData.length).toBe(1);
      expect(tableData[0].unitId).toBe('UNIT001');
      expect(tableData[0].productCode).toBe('PROD01');
      expect(tableData[0].type).toBe('TYPE1');
      expect(tableData[0].filterLotNumber).toBe('-');
    }));

    it('should show plural message for multiple entries', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      (component as any).tableData.set([{
        unitId: 'UNIT000',
        productCode: 'PROD01',
        type: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '-',
        bags: 5,
        numberOfComponent: 3,
      }]);

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('2 Entries saved');
    }));

    it('should handle submission error', fakeAsync(() => {
      const mockError = { error: { message: 'Invalid bag lot number' } };
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(throwError(() => mockError));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid bag lot number');
    }));

    it('should handle submission error with errorCode', fakeAsync(() => {
      const mockError = { error: { errorCode: 'ERR001', message: 'Duplicate record' } };
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(throwError(() => mockError));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('[ERR001] Duplicate record');
    }));

    it('should handle submission error with nested errorResponse errorCode', fakeAsync(() => {
      const mockError = { error: { errorResponse: { errorCode: 'ERR002' }, error: 'Server error' } };
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(throwError(() => mockError));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('[ERR002] Server error');
    }));

    it('should use default error message when no message in error', fakeAsync(() => {
      const mockError = { error: {} };
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(throwError(() => mockError));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create component spiking record');
    }));

    it('should set submitting to false after error', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(throwError(() => ({ error: {} })));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect((component as any).submitting()).toBeFalse();
    }));

    it('should reset form after successful submission', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(component.form.get('processCode')?.value).toBe('REG');
      expect(component.form.get('productCode')?.value).toBe('');
    }));

    it('should reset submitted flag after successful submission', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(component.submitted).toBeFalse();
    }));

    it('should clear validatedUnitData after successful submission', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(component.validatedUnitData).toBeNull();
    }));

    it('should clear inline fields after successful submission', fakeAsync(() => {
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();

      expect(component.form.get('spikingType')?.value).toBe('');
      expect(component.form.get('bagLotNumber')?.value).toBe('');
      expect(component.form.get('bagsSpiked')?.value).toBeNull();
      expect(component.form.get('bagsForComponents')?.value).toBeNull();
    }));
  });

  describe('onClear', () => {
    it('should reset the entire form', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.form.patchValue({
        processCode: 'REG',
        productCode: 'PROD01',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });
      component.submitted = true;
      component.validatedUnitData = mockUnitValidationResponse as any;
      component.selectedCollDate = '2024-01-15';

      component.onClear();

      expect(component.form.get('processCode')?.value).toBe('');
      expect(component.form.get('productCode')?.value).toBe('');
      expect(component.form.get('spikingType')?.value).toBe('');
      expect(component.submitted).toBeFalse();
      expect(component.validatedUnitData).toBeNull();
      expect(component.selectedCollDate).toBe('');
    }));

    it('should clear table data on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).tableData.set([{
        unitId: 'UNIT001',
        productCode: 'PROD01',
        type: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '-',
        bags: 5,
        numberOfComponent: 3,
      }]);

      component.onClear();

      expect((component as any).tableData()).toEqual([]);
    }));

    it('should reset unitAlreadyScanned on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).unitAlreadyScanned.set(true);
      component.onClear();

      expect((component as any).unitAlreadyScanned()).toBeFalse();
    }));

    it('should clear selectedProcessDescription on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).selectedProcessDescription.set('Regular Processing');
      component.onClear();

      expect((component as any).selectedProcessDescription()).toBe('');
    }));

    it('should mark all controls as untouched and pristine on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      Object.keys(component.form.controls).forEach((key) => {
        component.form.get(key)?.markAsTouched();
        component.form.get(key)?.markAsDirty();
      });

      component.onClear();

      Object.keys(component.form.controls).forEach((key) => {
        expect(component.form.get(key)?.touched).toBeFalse();
        expect(component.form.get(key)?.dirty).toBeFalse();
      });
    }));
  });

  describe('onPageChange', () => {
    it('should update pageSize and pageIndex', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const pageEvent = { pageSize: 50, pageIndex: 2, length: 100 } as any;
      component.onPageChange(pageEvent);

      expect(component.pageSize).toBe(50);
      expect(component.pageIndex).toBe(2);
    }));
  });

  describe('Computed Signals', () => {
    it('isFormReady should be true when not loading and not submitting', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).loading.set(false);
      (component as any).submitting.set(false);

      expect((component as any).isFormReady()).toBeTrue();
    }));

    it('isFormReady should be false when loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).loading.set(true);

      expect((component as any).isFormReady()).toBeFalse();
    }));

    it('isFormReady should be false when submitting', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).submitting.set(true);

      expect((component as any).isFormReady()).toBeFalse();
    }));

    it('canSubmit should be true when form ready, unit validated, and not already scanned', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).loading.set(false);
      (component as any).submitting.set(false);
      component.validatedUnitData = mockUnitValidationResponse as any;
      (component as any).unitAlreadyScanned.set(false);

      expect((component as any).canSubmit()).toBeTrue();
    }));

    it('canSubmit should be false when unit not validated', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).loading.set(false);
      (component as any).submitting.set(false);
      component.validatedUnitData = null;
      (component as any).unitAlreadyScanned.set(false);

      expect((component as any).canSubmit()).toBeFalse();
    }));

    it('canSubmit should be false when unit already scanned', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).loading.set(false);
      (component as any).submitting.set(false);
      component.validatedUnitData = mockUnitValidationResponse as any;
      (component as any).unitAlreadyScanned.set(true);

      expect((component as any).canSubmit()).toBeFalse();
    }));

    it('showEmptyState should be true when no table data and not loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).tableData.set([]);
      (component as any).loading.set(false);

      expect((component as any).showEmptyState()).toBeTrue();
    }));

    it('showEmptyState should be false when table has data', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).tableData.set([{
        unitId: 'UNIT001', productCode: 'PROD01', type: 'TYPE1',
        bagLotNumber: 'LOT001', filterLotNumber: '-', bags: 5, numberOfComponent: 3,
      }]);
      (component as any).loading.set(false);

      expect((component as any).showEmptyState()).toBeFalse();
    }));

    it('showEmptyState should be false when loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).tableData.set([]);
      (component as any).loading.set(true);

      expect((component as any).showEmptyState()).toBeFalse();
    }));
  });

  describe('f getter', () => {
    it('should return form controls', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const controls = component.f;
      expect(controls['processCode']).toBeTruthy();
      expect(controls['productCode']).toBeTruthy();
      expect(controls['bagsSpiked']).toBeTruthy();
    }));
  });

  describe('formatDate', () => {
    it('should format valid date string', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const result = (component as any).formatDate('2024-01-15');
      expect(result).toBe('15-JAN-2024');
    }));

    it('should return original string for invalid date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const result = (component as any).formatDate('not-a-date');
      expect(result).toBe('not-a-date');
    }));
  });

  describe('serializeDateForApi', () => {
    it('should convert DD-MMM-YYYY to YYYY-MM-DD', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const result = (component as any).serializeDateForApi('15-JAN-2024');
      expect(result).toBe('2024-01-15');
    }));

    it('should return empty string for null date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const result = (component as any).serializeDateForApi(null);
      expect(result).toBe('');
    }));

    it('should return empty string for empty date', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const result = (component as any).serializeDateForApi('');
      expect(result).toBe('');
    }));

    it('should return original string for invalid date format', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const result = (component as any).serializeDateForApi('invalid-date');
      expect(result).toBe('invalid-date');
    }));
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have proper form field structure', () => {
      const formFields = fixture.debugElement.queryAll(By.css('mat-form-field'));
      expect(formFields.length).toBeGreaterThan(0);
    });

    it('should generate unique element IDs', () => {
      const id1 = (component as any).elementId('test');
      expect(id1).toContain('spike-');
      expect(id1).toContain('-test');
    });

    it('should generate unique error IDs', () => {
      const id = (component as any).errorId('test');
      expect(id).toContain('spike-');
      expect(id).toContain('-test-error');
    });

    it('should generate unique label IDs', () => {
      const id = (component as any).labelId('test');
      expect(id).toContain('spike-');
      expect(id).toContain('-test-label');
    });
  });

  describe('Unique ID Generation', () => {
    it('should have unique component ID pattern', () => {
      fixture.detectChanges();
      const processCodeSelect = fixture.debugElement.query(By.css('[id*="processCode"]'));
      expect(processCodeSelect?.attributes['id']).toMatch(/spike-\d+-processCode/);
    });
  });

  describe('Number Input Validation', () => {
    it('should only allow numeric input for bags spiked', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      mockInput.selectionStart = 0;
      mockInput.selectionEnd = 0;
      const event = { which: 97, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBeFalse();
    });

    it('should allow numeric input for bags spiked', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      mockInput.selectionStart = 0;
      mockInput.selectionEnd = 0;
      const event = { which: 53, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(result).toBeTrue();
    });

    it('should prevent input when already 2 digits and no selection', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '12';
      mockInput.selectionStart = 2;
      mockInput.selectionEnd = 2;
      const event = { which: 51, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBeFalse();
    });

    it('should allow input when 2 digits but text is selected', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '12';
      mockInput.selectionStart = 0;
      mockInput.selectionEnd = 2;
      const event = { which: 51, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(result).toBeTrue();
    });

    it('should use keyCode when which is 0', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      mockInput.selectionStart = 0;
      mockInput.selectionEnd = 0;
      const event = { which: 0, keyCode: 97, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBeFalse();
    });

    it('should allow digit 0 (charCode 48)', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      mockInput.selectionStart = 0;
      mockInput.selectionEnd = 0;
      const event = { which: 48, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(result).toBeTrue();
    });

    it('should allow digit 9 (charCode 57)', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      mockInput.selectionStart = 0;
      mockInput.selectionEnd = 0;
      const event = { which: 57, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(result).toBeTrue();
    });

    it('should reject charCode 47 (just below digit range)', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      mockInput.selectionStart = 0;
      mockInput.selectionEnd = 0;
      const event = { which: 47, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBeFalse();
    });

    it('should reject charCode 58 (just above digit range)', () => {
      const mockInput = document.createElement('input');
      mockInput.value = '';
      mockInput.selectionStart = 0;
      mockInput.selectionEnd = 0;
      const event = { which: 58, target: mockInput, preventDefault: jasmine.createSpy('preventDefault') } as unknown as KeyboardEvent;

      const result = component.onlyNumbersMaxTwo(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(result).toBeFalse();
    });
  });

  describe('onPasteNumbersMaxTwo', () => {
    it('should strip non-numeric characters and limit to 2 digits', () => {
      const mockInput = document.createElement('input');
      const dispatchSpy = spyOn(mockInput, 'dispatchEvent');
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'abc123def456' },
        target: mockInput,
      } as unknown as ClipboardEvent;

      component.onPasteNumbersMaxTwo(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockInput.value).toBe('12');
      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('should handle empty paste data', () => {
      const mockInput = document.createElement('input');
      const dispatchSpy = spyOn(mockInput, 'dispatchEvent');
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '' },
        target: mockInput,
      } as unknown as ClipboardEvent;

      component.onPasteNumbersMaxTwo(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockInput.value).toBe('');
      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('should handle paste with only numbers', () => {
      const mockInput = document.createElement('input');
      spyOn(mockInput, 'dispatchEvent');
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '99' },
        target: mockInput,
      } as unknown as ClipboardEvent;

      component.onPasteNumbersMaxTwo(event);

      expect(mockInput.value).toBe('99');
    });

    it('should handle null clipboardData', () => {
      const mockInput = document.createElement('input');
      spyOn(mockInput, 'dispatchEvent');
      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null,
        target: mockInput,
      } as unknown as ClipboardEvent;

      component.onPasteNumbersMaxTwo(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockInput.value).toBe('');
    });
  });

  describe('enforceMaxTwo', () => {
    it('should strip non-numeric and limit to 2 digits', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockInput = document.createElement('input');
      mockInput.value = 'abc99xyz';
      const event = { target: mockInput } as unknown as Event;

      component.enforceMaxTwo(event, 'bagsSpiked');

      expect(component.form.get('bagsSpiked')?.value).toBe(99);
    }));

    it('should set null when value is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockInput = document.createElement('input');
      mockInput.value = '';
      const event = { target: mockInput } as unknown as Event;

      component.enforceMaxTwo(event, 'bagsSpiked');

      expect(component.form.get('bagsSpiked')?.value).toBeNull();
    }));

    it('should handle single digit', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockInput = document.createElement('input');
      mockInput.value = '5';
      const event = { target: mockInput } as unknown as Event;

      component.enforceMaxTwo(event, 'bagsSpiked');

      expect(component.form.get('bagsSpiked')?.value).toBe(5);
    }));

    it('should truncate values longer than 2 digits', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockInput = document.createElement('input');
      mockInput.value = '123';
      const event = { target: mockInput } as unknown as Event;

      component.enforceMaxTwo(event, 'bagsSpiked');

      expect(component.form.get('bagsSpiked')?.value).toBe(12);
    }));
  });

  describe('Page Header', () => {
    it('should set header config from menu item label', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.headerConfig.breadcrumbs[1].label).toBe('Spike a Component');
    }));
  });

  describe('Table Data Source', () => {
    it('should update dataSource when tableData changes via submit', fakeAsync(() => {
      spikeApiServiceSpy.getUnitCollectionDates.and.returnValue(of([{ collDate: '2024-01-15' }]));
      spikeApiServiceSpy.getProducts.and.returnValue(of(mockProducts));
      spikeApiServiceSpy.createComponentSpiking.and.returnValue(of(mockResponse));

      fixture.detectChanges();

      component.form.get('processCode')?.setValue('REG');
      tick();

      component.onUnitValidated({ parsedUnitId: 'UNIT001', isValid: true } as any);
      tick();

      (component as any).unitIdField = { isValid: true, clear: jasmine.createSpy('clear') };
      component.selectedCollDate = '2024-01-15';

      component.form.patchValue({
        productCode: 'PROD01',
        componentPrefix: 'CP001',
        spikingType: 'TYPE1',
        bagLotNumber: 'LOT001',
        filterLotNumber: '',
        bagsSpiked: 5,
        bagsForComponents: 3,
      });

      component.onSubmit();
      tick();
      fixture.detectChanges();

      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].unitId).toBe('UNIT001');
    }));
  });
});
