import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { PackLabDiscardsComponent } from './pack-lab-discards.component';
import { PackLabDiscardsService } from './services/pack-lab-discards.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  Consignee,
  Order,
  ProductType,
  DiscardType,
  Box,
  TestId,
  ApiResponse,
  PackProductResponse,
  UnitProduct,
  BoxContent,
} from './models/pack-lab-discards.model';

describe('PackLabDiscardsComponent', () => {
  let matDialogSpy: any;
  let packLabDiscardsService: any;
  let component: PackLabDiscardsComponent;
  let fixture: ComponentFixture<PackLabDiscardsComponent>;
  let packLabDiscardsServiceSpy: jasmine.SpyObj<PackLabDiscardsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceMock: { chapterChanged$: Subject<void> };

  const mockConsignees: Consignee[] = [
    {
      consigneeId: 'CONS001',
      consigneeName: 'Acme Disposal',
      shortName: 'Acme Disposal',
      address1: '123 Main St',
      city: 'Boston',
      state: 'MA',
      customerId: 'CUST001',
    },
  ];

  const mockOrders: Order[] = [
    { orderNo: 'LD20240601001', orderType: 'LD', orderStatus: 'OP', insertDate: '2024-06-01T12:00:00Z' },
  ];

  const mockProductTypes: ProductType[] = [
    { productType: 'PLT', productDesc: 'Platelets' },
  ];

  const mockDiscardTypes: DiscardType[] = [
    { discardType: 'NFT', discardTypeDesc: 'Not Fit for Transfusion' },
    { discardType: 'BIO', discardTypeDesc: 'Biohazard' },
  ];

  const mockBoxes: Box[] = [
    { boxId: 'BX001', boxStatus: 'Open', consigneeId: 'CONS001' },
  ];

  const mockTestIds: TestId[] = [
    { testId: 'VIRAL001', testDesc: 'Viral Marker Test', testGroup: 'VIRAL' },
  ];

  const mockUnitProducts: UnitProduct[] = [
    {
      unitId: 'UNIT001',
      productCode: 'PROD001',
      productDesc: 'Red Blood Cells',
      productType: 'RBC',
      componentPrefix: 'A',
      systemLabelDecision: 'O+',
      aboDesc: 'O Positive',
      collDate: '2024-06-01',
    },
    {
      unitId: 'UNIT001',
      productCode: 'PROD001',
      productDesc: 'Red Blood Cells',
      productType: 'RBC',
      componentPrefix: 'B',
      systemLabelDecision: 'O+',
      aboDesc: 'O Positive',
      collDate: '2024-06-01',
    },
    {
      unitId: 'UNIT001',
      productCode: 'PROD002',
      productDesc: 'Platelets',
      productType: 'PLT',
      componentPrefix: 'C',
      systemLabelDecision: 'A-',
      aboDesc: 'A Negative',
      collDate: '2024-06-01',
    },
  ];

  beforeEach(() => {

    packLabDiscardsService = jasmine.createSpyObj('PackLabDiscardsService', [
      'getConsignees', 'getOrders', 'getProductTypes', 'getDiscardTypes',
      'getBoxes', 'getTestIds', 'getBoxContents', 'getAvailableProducts',
      'packProduct', 'closeBox', 'unpackProduct', 'getUnitProducts',
    ]);

    const snackbarService = createMockSnackbarService();

    headerServiceMock = { chapterChanged$: new Subject<void>() };

    const pageHeaderServiceMock = {
      pageHeaderData: signal({ title: 'Pack Lab Discards', subtitle: '' }),
      getTitle: () => 'Pack Lab Discards',
      getSubtitle: () => '',
    };

    matDialogSpy = createMockMatDialog();

    packLabDiscardsService.getConsignees.and.returnValue(of(mockConsignees));
    packLabDiscardsService.getOrders.and.returnValue(of(mockOrders));
    packLabDiscardsService.getProductTypes.and.returnValue(of(mockProductTypes));
    packLabDiscardsService.getDiscardTypes.and.returnValue(of(mockDiscardTypes));
    packLabDiscardsService.getBoxes.and.returnValue(of(mockBoxes));
    packLabDiscardsService.getTestIds.and.returnValue(of(mockTestIds));
    packLabDiscardsService.getBoxContents.and.returnValue(of([]));
    packLabDiscardsService.getAvailableProducts.and.returnValue(of([]));
    packLabDiscardsService.getUnitProducts.and.returnValue(of(mockUnitProducts));
    packLabDiscardsService.unpackProduct.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: true }));



      TestBed.configureTestingModule({
      imports: [PackLabDiscardsComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PackLabDiscardsService, useValue: packLabDiscardsService },
        { provide: SnackbarService, useValue: snackbarService },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: PageHeaderService, useValue: pageHeaderServiceMock },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { data: {} } } },
      ],
    })
    .overrideComponent(PackLabDiscardsComponent, {
      add: { providers: [{ provide: MatDialog, useValue: matDialogSpy }] }
    });




      packLabDiscardsService.getConsignees.calls.reset();


      packLabDiscardsService.getOrders.calls.reset();


      packLabDiscardsService.getProductTypes.calls.reset();


      packLabDiscardsService.getDiscardTypes.calls.reset();


      packLabDiscardsService.getBoxes.calls.reset();


      packLabDiscardsService.getTestIds.calls.reset();


      packLabDiscardsService.getBoxContents.calls.reset();


      packLabDiscardsService.getAvailableProducts.calls.reset();


      packLabDiscardsService.packProduct.calls.reset();


      packLabDiscardsService.closeBox.calls.reset();


      packLabDiscardsService.unpackProduct.calls.reset();


      packLabDiscardsService.getUnitProducts.calls.reset();


      matDialogSpy.open.calls.reset();


      packLabDiscardsService.getConsignees.and.returnValue(of(mockConsignees));


      packLabDiscardsService.getOrders.and.returnValue(of(mockOrders));


      packLabDiscardsService.getProductTypes.and.returnValue(of(mockProductTypes));


      packLabDiscardsService.getDiscardTypes.and.returnValue(of(mockDiscardTypes));


      packLabDiscardsService.getBoxes.and.returnValue(of(mockBoxes));


      packLabDiscardsService.getTestIds.and.returnValue(of(mockTestIds));


      packLabDiscardsService.getBoxContents.and.returnValue(of([]));


      packLabDiscardsService.getAvailableProducts.and.returnValue(of([]));


      packLabDiscardsService.getUnitProducts.and.returnValue(of(mockUnitProducts));


      packLabDiscardsService.unpackProduct.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: true }));


    fixture = TestBed.createComponent(PackLabDiscardsComponent);
    component = fixture.componentInstance;
    packLabDiscardsServiceSpy = TestBed.inject(PackLabDiscardsService) as jasmine.SpyObj<PackLabDiscardsService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;


    });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize form on ngOnInit', () => {
      fixture.detectChanges();
      expect(component.packForm).toBeDefined();
      expect(component.packForm.get('consigneeId')).toBeDefined();
      expect(component.packForm.get('discardType')).toBeDefined();
      expect(component.packForm.get('unitId')).toBeDefined();
    });

    it('should load initial data on ngOnInit', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(packLabDiscardsServiceSpy.getConsignees).toHaveBeenCalled();
      expect(packLabDiscardsServiceSpy.getProductTypes).toHaveBeenCalled();
      expect(packLabDiscardsServiceSpy.getDiscardTypes).toHaveBeenCalled();
      expect(packLabDiscardsServiceSpy.getTestIds).toHaveBeenCalled();
      expect(component.consignees()).toEqual(mockConsignees);
      expect(component.productTypes()).toEqual(mockProductTypes);
      expect(component.discardTypes()).toEqual(mockDiscardTypes);
      expect(component.testIds()).toEqual(mockTestIds);
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should mark consigneeId as required', () => {
      const control = component.packForm.get('consigneeId');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should not mark discardType as required', () => {
      const control = component.packForm.get('discardType');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(false);
    });

    it('should initialize validatedUnitId as null', () => {
      expect(component.validatedUnitId()).toBeNull();
    });

    it('should initialize productCode without validation errors', () => {
      const control = component.packForm.get('productCode');
      expect(control).toBeTruthy();
      expect(control?.value).toBe('');
      expect(control?.valid).toBe(true);
    });

    it('should accept valid productCode value', () => {
      component.packForm.patchValue({ productCode: '12345678' });
      expect(component.packForm.get('productCode')?.value).toBe('12345678');
      expect(component.packForm.get('productCode')?.valid).toBe(true);
    });

    it('should show test IDs section when discardType is BIO', () => {
      component.packForm.patchValue({ discardType: 'BIO' });
      expect(component.showTestIds()).toBe(true);
    });

    it('should not require testIds when discardType is NFT', () => {
      component.packForm.patchValue({ discardType: 'NFT', testIds: [] });
      expect(component.packForm.get('testIds')?.hasError('required')).toBeFalsy();
    });
  });

  describe('Form Subscriptions', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should load orders when consigneeId changes', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      expect(packLabDiscardsServiceSpy.getOrders).toHaveBeenCalledWith('CONS001');
    }));

    it('should load boxes when consigneeId changes', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      expect(packLabDiscardsServiceSpy.getBoxes).toHaveBeenCalledWith('CONS001');
    }));

    it('should show testIds field when discardType is BIO', () => {
      component.packForm.patchValue({ discardType: 'BIO' });
      expect(component.showTestIds()).toBe(true);
    });

    it('should hide testIds field when discardType is NFT', () => {
      component.packForm.patchValue({ discardType: 'NFT' });
      expect(component.showTestIds()).toBe(false);
    });
  });

  describe('Chapter Change', () => {
    it('should reload data when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      packLabDiscardsServiceSpy.getConsignees.calls.reset();
      headerServiceMock.chapterChanged$.next();
      tick();
      expect(packLabDiscardsServiceSpy.getConsignees).toHaveBeenCalled();
    }));
  });

  describe('Pack Product Operation', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should not submit when unit ID is not validated', () => {
      component.onPackProduct();
      expect(packLabDiscardsServiceSpy.packProduct).not.toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please scan or enter a valid Unit ID');
    });

    it('should pack product successfully when form is valid', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: 'Product packed successfully',
        data: { boxId: 'BX001', pickSlipId: 'PS001', orderNo: 'LD001', unitId: 'UNIT12345', productCode: 'PROD0001', message: 'Success' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('UNIT12345');
      component.packForm.patchValue({
        consigneeId: 'CONS001', discardType: 'NFT',
        productCode: 'PROD0001', bloodType: 'O+',
      });
      tick();
      component.onPackProduct();
      tick();
      expect(packLabDiscardsServiceSpy.packProduct).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product packed successfully');
    }));

    it('should update pickSlipId after successful pack', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: 'Success',
        data: { boxId: 'BX001', pickSlipId: 'PS001', orderNo: 'LD001', unitId: 'UNIT12345', productCode: 'PROD0001', message: 'Success' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('UNIT12345');
      component.packForm.patchValue({
        consigneeId: 'CONS001', discardType: 'NFT',
        productCode: 'PROD0001', bloodType: 'O+',
      });
      tick();
      component.onPackProduct();
      tick();
      expect(component.pickSlipId()).toBe('PS001');
    }));
  });

  describe('Close Box Operation', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should not open dialog when no box is selected', () => {
      const matDialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
      component.onCloseBox();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('Searchable Dropdowns', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should filter consignees by search text', () => {
      (component as any).consigneeSearchText.set('acme');
      const filtered = component.filteredConsignees();
      expect(filtered.length).toBe(1);
      expect(filtered[0].shortName).toBe('Acme Disposal');
    });

    it('should return all consignees when search text is empty', () => {
      (component as any).consigneeSearchText.set('');
      expect(component.filteredConsignees().length).toBe(mockConsignees.length);
    });

    it('should have test ID search control and loaded test IDs', () => {
      expect(component.testIdSearchCtrl).toBeDefined();
      expect(component.testIds().length).toBe(1);
      expect(component.testIds()[0].testId).toBe('VIRAL001');
    });
  });

  describe('Filter Chips', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should retain form values after patching', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'CONS001', discardType: 'NFT' });
      tick();
      expect(component.packForm.get('consigneeId')?.value).toBe('CONS001');
      expect(component.packForm.get('discardType')?.value).toBe('NFT');
    }));

    it('should clear consignee when form value is reset', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      component.packForm.patchValue({ consigneeId: '' });
      tick();
      expect(component.packForm.get('consigneeId')?.value).toBe('');
    }));
  });

  describe('Clear Form', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should clear entire form and reset state', () => {
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      component.clearForm();
      expect(component.packForm.get('consigneeId')?.value).toBeFalsy();
      expect(component.packForm.get('discardType')?.value).toBeFalsy();
      expect(component.pickSlipId()).toBe('');
      expect(component.packedProducts().length).toBe(0);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return selected consignee address', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      const address = (component as any).getSelectedConsigneeAddress();
      expect(address).toContain('123 Main St');
      expect(address).toContain('Boston');
      expect(address).toContain('MA');
    }));

    it('should return empty string when no consignee selected', () => {
      const address = (component as any).getSelectedConsigneeAddress();
      expect(address).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      spyOn((component as any).destroy$, 'next');
      spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect((component as any).destroy$.next).toHaveBeenCalled();
      expect((component as any).destroy$.complete).toHaveBeenCalled();
    });
  });

  // ===================== NEW TESTS =====================

  describe('onUnitValidated', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return early when parsedUnitId is falsy', () => {
      component.onUnitValidated({ parsedUnitId: '' } as any);
      expect(component.validatedUnitId()).toBeNull();
      expect(packLabDiscardsServiceSpy.getUnitProducts).not.toHaveBeenCalled();
    });

    it('should return early when event has no parsedUnitId', () => {
      component.onUnitValidated({} as any);
      expect(component.validatedUnitId()).toBeNull();
    });

    it('should set validatedUnitId and call getUnitProducts', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'CONS001', productType: 'PLT', discardType: 'NFT' });
      tick();
      packLabDiscardsServiceSpy.getUnitProducts.calls.reset();

      component.onUnitValidated({
        parsedUnitId: 'UNIT001',
        codeScheme: 'I',
        collectionDate: '2024-06-01',
      } as any);
      tick();

      expect(component.validatedUnitId()).toBe('UNIT001');
      expect(component.collectionDateDisplay()).toBe('2024-06-01');
      expect(packLabDiscardsServiceSpy.getUnitProducts).toHaveBeenCalledWith(
        'UNIT001', 'PLT', 'NFT', 'CONS001'
      );
    }));

    it('should set product code options from unique products', fakeAsync(() => {
      packLabDiscardsServiceSpy.getUnitProducts.and.returnValue(of(mockUnitProducts));
      component.onUnitValidated({ parsedUnitId: 'UNIT001', codeScheme: 'I' } as any);
      tick();

      expect(component.unitProducts()).toEqual(mockUnitProducts);
      const options = component.productCodeOptions();
      expect(options.length).toBe(2);
      expect(options[0].code).toBe('PROD001');
      expect(options[1].code).toBe('PROD002');
    }));

    it('should show error when no products found', fakeAsync(() => {
      packLabDiscardsServiceSpy.getUnitProducts.and.returnValue(of([]));
      component.onUnitValidated({ parsedUnitId: 'UNIT999', codeScheme: 'I' } as any);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No discardable products found for unit UNIT999');
      expect(component.loading()).toBe(false);
    }));

    it('should set collectionDate from products when event has no collectionDate', fakeAsync(() => {
      packLabDiscardsServiceSpy.getUnitProducts.and.returnValue(of(mockUnitProducts));
      component.onUnitValidated({ parsedUnitId: 'UNIT001', codeScheme: 'I' } as any);
      tick();

      expect(component.collectionDateDisplay()).toBe('2024-06-01');
    }));

    it('should handle error from getUnitProducts', fakeAsync(() => {
      packLabDiscardsServiceSpy.getUnitProducts.and.returnValue(throwError(() => new Error('Network error')));
      component.onUnitValidated({ parsedUnitId: 'UNIT001', codeScheme: 'I' } as any);
      tick();

      expect(component.loading()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should set unitCodeScheme from event', fakeAsync(() => {
      packLabDiscardsServiceSpy.getUnitProducts.and.returnValue(of(mockUnitProducts));
      component.onUnitValidated({ parsedUnitId: 'UNIT001', codeScheme: 'C' } as any);
      tick();

      expect((component as any).unitCodeScheme()).toBe('C');
    }));

    it('should default unitCodeScheme to I when not provided', fakeAsync(() => {
      packLabDiscardsServiceSpy.getUnitProducts.and.returnValue(of(mockUnitProducts));
      component.onUnitValidated({ parsedUnitId: 'UNIT001' } as any);
      tick();

      expect((component as any).unitCodeScheme()).toBe('I');
    }));
  });

  describe('onProductCodeChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitProducts.set(mockUnitProducts);
    });

    it('should reset state when option is null', () => {
      component.onProductCodeChange(null);
      expect(component.selectedProductCode()).toBe('');
      expect(component.productDescription()).toBe('-');
    });

    it('should reset state when option code is empty', () => {
      component.onProductCodeChange({ code: '', description: '' });
      expect(component.selectedProductCode()).toBe('');
      expect(component.productDescription()).toBe('-');
    });

    it('should set product description and ABO options for matching product', () => {
      component.onProductCodeChange({ code: 'PROD001', description: 'Red Blood Cells' });

      expect(component.selectedProductCode()).toBe('PROD001');
      expect(component.productDescription()).toBe('Red Blood Cells');
      expect(component.aboRhOptions().length).toBe(1);
      expect(component.aboRhOptions()[0].code).toBe('O+');
    });

    it('should set aliquot options from matching products', () => {
      component.onProductCodeChange({ code: 'PROD001', description: 'Red Blood Cells' });

      const aliquots = component.aliquotOptions();
      expect(aliquots.length).toBe(2);
      expect(aliquots).toContain('A');
      expect(aliquots).toContain('B');
    });

    it('should auto-select aliquot when only one prefix exists', () => {
      component.onProductCodeChange({ code: 'PROD002', description: 'Platelets' });

      expect(component.aliquotOptions().length).toBe(1);
      expect(component.packForm.get('aliquot')?.value).toBe('C');
    });

    it('should update form productCode and bloodType', () => {
      component.onProductCodeChange({ code: 'PROD001', description: 'RBC' });
      expect(component.packForm.get('productCode')?.value).toBe('PROD001');
    });

    it('should clear aboRhOptions and aliquotOptions initially', () => {
      component.aboRhOptions.set([{ code: 'X', description: 'Y' }]);
      component.aliquotOptions.set(['Z']);
      component.onProductCodeChange({ code: 'PROD001', description: 'RBC' });
      // They get repopulated from matching products
      expect(component.aboRhOptions().length).toBeGreaterThan(0);
    });
  });

  describe('onAliquotChange', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should clear bloodType when aliquot is empty', () => {
      component.packForm.patchValue({ bloodType: 'O+' });
      component.onAliquotChange('');
      expect(component.packForm.get('bloodType')?.value).toBe('');
    });

    it('should clear bloodType for a valid aliquot and allow re-focus', () => {
      component.packForm.patchValue({ bloodType: 'A+' });
      component.onAliquotChange('B');
      expect(component.packForm.get('bloodType')?.value).toBe('');
    });
  });

  describe('onAboRhChanged', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should set bloodType form value from option', () => {
      component.validatedUnitId.set(null);
      component.onAboRhChanged({ code: 'O+', description: 'O Positive' });
      expect(component.packForm.get('bloodType')?.value).toBe('O+');
    });

    it('should clear bloodType when option is null', () => {
      component.packForm.patchValue({ bloodType: 'A-' });
      component.onAboRhChanged(null);
      expect(component.packForm.get('bloodType')?.value).toBe('');
    });

    it('should trigger onPackProduct when option has a code', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: 'Packed',
        data: { boxId: 'BX001', pickSlipId: 'PS001', orderNo: 'LD001', unitId: 'UNIT001', productCode: 'PROD001', message: 'OK' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('UNIT001');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'PROD001', discardType: 'NFT' });
      tick();

      component.onAboRhChanged({ code: 'O+', description: 'O Positive' });
      tick();

      expect(packLabDiscardsServiceSpy.packProduct).toHaveBeenCalled();
    }));
  });

  describe('onAboRhCleared', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should clear bloodType form value', () => {
      component.packForm.patchValue({ bloodType: 'A+' });
      component.onAboRhCleared();
      expect(component.packForm.get('bloodType')?.value).toBe('');
    });
  });

  describe('onUnitCleared', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should reset unit validation state', () => {
      component.validatedUnitId.set('UNIT001');
      component.collectionDateDisplay.set('2024-06-01');
      component.unitProducts.set(mockUnitProducts);

      component.onUnitCleared();

      expect(component.validatedUnitId()).toBeNull();
      expect(component.collectionDateDisplay()).toBe('-');
      expect(component.unitProducts()).toEqual([]);
      expect(component.productCodeOptions()).toEqual([]);
    });
  });

  describe('onPackedProductAction', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should unpack product on delete action', fakeAsync(() => {
      const mockPacked = { unitId: 'UNIT001', productCode: 'PROD001', aliquot: 'A', productDesc: 'RBC', orderedAboRh: 'O+', boxId: 'BX001' };
      component.packedProducts.set([mockPacked]);
      packLabDiscardsServiceSpy.unpackProduct.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: true }));

      component.onPackedProductAction({ action: 'delete', row: mockPacked } as any);
      tick();

      expect(packLabDiscardsServiceSpy.unpackProduct).toHaveBeenCalledWith('UNIT001', 'PROD001', 'A');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product unpacked successfully.');
      expect(component.packedProducts().length).toBe(0);
    }));

    it('should handle unpack failure response', fakeAsync(() => {
      const mockPacked = { unitId: 'UNIT001', productCode: 'PROD001', aliquot: undefined, productDesc: 'RBC', orderedAboRh: 'O+', boxId: 'BX001' };
      component.packedProducts.set([mockPacked]);
      packLabDiscardsServiceSpy.unpackProduct.and.returnValue(of({
        success: false, statusCode: 400, message: 'Cannot unpack',
        data: false, errorCode: '3704'
      }));

      component.onPackedProductAction({ action: 'delete', row: mockPacked } as any);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Product already packed');
      expect(component.loading()).toBe(false);
    }));

    it('should handle unpack network error', fakeAsync(() => {
      const mockPacked = { unitId: 'UNIT001', productCode: 'PROD001', aliquot: undefined, productDesc: 'RBC', orderedAboRh: 'O+', boxId: 'BX001' };
      packLabDiscardsServiceSpy.unpackProduct.and.returnValue(throwError(() => ({ message: 'Connection refused' })));

      component.onPackedProductAction({ action: 'delete', row: mockPacked } as any);
      tick();

      expect(component.loading()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should not call unpackProduct for non-delete actions', () => {
      const mockPacked = { unitId: 'UNIT001', productCode: 'PROD001', productDesc: 'RBC', orderedAboRh: 'O+', boxId: 'BX001' };
      component.onPackedProductAction({ action: 'edit', row: mockPacked } as any);
      expect(packLabDiscardsServiceSpy.unpackProduct).not.toHaveBeenCalled();
    });

    it('should refresh unit products after successful unpack if same unit', fakeAsync(() => {
      component.validatedUnitId.set('UNIT001');
      const mockPacked = { unitId: 'UNIT001', productCode: 'PROD001', aliquot: 'A', productDesc: 'RBC', orderedAboRh: 'O+', boxId: 'BX001' };
      component.packedProducts.set([mockPacked]);

      packLabDiscardsServiceSpy.unpackProduct.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: true }));
      packLabDiscardsServiceSpy.getUnitProducts.and.returnValue(of(mockUnitProducts));

      component.onPackedProductAction({ action: 'delete', row: mockPacked } as any);
      tick();

      expect(packLabDiscardsServiceSpy.getUnitProducts).toHaveBeenCalled();
    }));

    it('should not refresh unit products after unpack if different unit', fakeAsync(() => {
      component.validatedUnitId.set('DIFFERENT_UNIT');
      const mockPacked = { unitId: 'UNIT001', productCode: 'PROD001', aliquot: 'A', productDesc: 'RBC', orderedAboRh: 'O+', boxId: 'BX001' };
      component.packedProducts.set([mockPacked]);

      packLabDiscardsServiceSpy.unpackProduct.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: true }));
      packLabDiscardsServiceSpy.getUnitProducts.calls.reset();

      component.onPackedProductAction({ action: 'delete', row: mockPacked } as any);
      tick();

      expect(packLabDiscardsServiceSpy.getUnitProducts).not.toHaveBeenCalled();
    }));
  });

  describe('onCloseBox with selected box', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should open dialog when box is selected', fakeAsync(() => {
      component.selectedBoxId.set('BX001');
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCloseBox();
      tick();

      expect(matDialogSpy.open).toHaveBeenCalled();
    }));

    it('should close box when dialog returns close result', fakeAsync(() => {
      component.selectedBoxId.set('BX001');
      component.selectedConsigneeId.set('CONS001');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true, allProperlyPacked: true }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);
      packLabDiscardsServiceSpy.closeBox.and.returnValue(of({ success: true, statusCode: 200, message: 'Closed', data: true }));

      component.onCloseBox();
      tick();

      expect(packLabDiscardsServiceSpy.closeBox).toHaveBeenCalledWith('BX001', 'Y');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('box has been closed successfully.');
      expect(component.packedProducts()).toEqual([]);
    }));

    it('should handle close box API error response', fakeAsync(() => {
      component.selectedBoxId.set('BX001');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true, allProperlyPacked: true }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);
      packLabDiscardsServiceSpy.closeBox.and.returnValue(of({ success: false, statusCode: 400, message: 'Box cannot be closed', data: false }));

      component.onCloseBox();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Box cannot be closed');
      expect(component.loading()).toBe(false);
    }));

    it('should handle close box network error', fakeAsync(() => {
      component.selectedBoxId.set('BX001');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true, allProperlyPacked: true }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);
      packLabDiscardsServiceSpy.closeBox.and.returnValue(throwError(() => new Error('Network failure')));

      component.onCloseBox();
      tick();

      expect(component.loading()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should do nothing when dialog returns null', fakeAsync(() => {
      component.selectedBoxId.set('BX001');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCloseBox();
      tick();

      expect(packLabDiscardsServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should do nothing when closeCurrentBox is false', fakeAsync(() => {
      component.selectedBoxId.set('BX001');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: false, allProperlyPacked: true }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onCloseBox();
      tick();

      expect(packLabDiscardsServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should reload boxes after successful close when consignee is selected', fakeAsync(() => {
      component.selectedBoxId.set('BX001');
      component.selectedConsigneeId.set('CONS001');

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true, allProperlyPacked: true }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);
      packLabDiscardsServiceSpy.closeBox.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: true }));
      packLabDiscardsServiceSpy.getBoxes.calls.reset();

      component.onCloseBox();
      tick();

      expect(packLabDiscardsServiceSpy.getBoxes).toHaveBeenCalledWith('CONS001');
    }));
  });

  describe('onNewBox', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should clear boxId and packed products when no current box', () => {
      component.selectedBoxId.set(null);
      component.packedProducts.set([]);

      component.onNewBox();

      expect(component.packedProducts()).toEqual([]);
    });

    it('should open dialog when current box has packed products', fakeAsync(() => {
      component.selectedBoxId.set('BX001');
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onNewBox();
      tick();

      expect(matDialogSpy.open).toHaveBeenCalled();
    }));

    it('should close current box and create new when dialog result is closeCurrentBox', fakeAsync(() => {
      component.selectedBoxId.set('BX001');
      component.selectedConsigneeId.set('CONS001');
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);
      packLabDiscardsServiceSpy.closeBox.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: true }));
      packLabDiscardsServiceSpy.getBoxes.calls.reset();

      component.onNewBox();
      tick();

      expect(packLabDiscardsServiceSpy.closeBox).toHaveBeenCalledWith('BX001', 'Y');
      expect(component.packedProducts()).toEqual([]);
      expect(packLabDiscardsServiceSpy.getBoxes).toHaveBeenCalledWith('CONS001');
    }));

    it('should not close current box when dialog result says keep it', fakeAsync(() => {
      component.selectedBoxId.set('BX001');
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: false }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onNewBox();
      tick();

      expect(packLabDiscardsServiceSpy.closeBox).not.toHaveBeenCalled();
      expect(component.packedProducts()).toEqual([]);
    }));

    it('should handle close box error during onNewBox', fakeAsync(() => {
      component.selectedBoxId.set('BX001');
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);
      packLabDiscardsServiceSpy.closeBox.and.returnValue(throwError(() => new Error('fail')));

      component.onNewBox();
      tick();

      expect(component.loading()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should do nothing when dialog is cancelled', fakeAsync(() => {
      component.selectedBoxId.set('BX001');
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onNewBox();
      tick();

      expect(packLabDiscardsServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should clear box when no packed products in current box', () => {
      component.selectedBoxId.set('BX001');
      component.packedProducts.set([]);

      component.onNewBox();

      expect(matDialogSpy.open).not.toHaveBeenCalled();
      expect(component.packedProducts()).toEqual([]);
    });
  });

  describe('onViewBoxContents', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should not open dialog when no box is selected', () => {
      component.selectedBoxId.set(null);
      component.onViewBoxContents();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open BoxContentsDialog when box is selected', () => {
      component.selectedBoxId.set('BX001');
      component.onViewBoxContents();
      expect(matDialogSpy.open).toHaveBeenCalled();
      const callArgs = matDialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.boxId).toBe('BX001');
    });
  });

  describe('onViewDiscardProducts', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should open DiscardProductsDialog', () => {
      component.packForm.patchValue({ productType: 'PLT', discardType: 'NFT' });
      component.onViewDiscardProducts();
      expect(matDialogSpy.open).toHaveBeenCalled();
      const callArgs = matDialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.productType).toBe('PLT');
      expect(callArgs[1].data.discardType).toBe('NFT');
    });

    it('should pass undefined when productType and discardType are empty', () => {
      component.packForm.patchValue({ productType: '', discardType: '' });
      component.onViewDiscardProducts();
      const callArgs = matDialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.productType).toBeUndefined();
      expect(callArgs[1].data.discardType).toBeUndefined();
    });
  });

  describe('onAddTest', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should open SelectTestDialog with available tests', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onAddTest();
      tick();

      expect(matDialogSpy.open).toHaveBeenCalled();
      const callArgs = matDialogSpy.open.calls.mostRecent().args;
      expect(callArgs[1].data.availableTests).toEqual(mockTestIds);
    }));

    it('should update selectedTestIds when dialog returns tests', fakeAsync(() => {
      const selectedTests: TestId[] = [
        { testId: 'VIRAL001', testDesc: 'Viral Marker Test', testGroup: 'VIRAL' },
      ];
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(selectedTests));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onAddTest();
      tick();

      expect(component.selectedTestIds()).toEqual(selectedTests);
    }));

    it('should not update selectedTestIds when dialog is cancelled', fakeAsync(() => {
      component.selectedTestIds.set([]);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onAddTest();
      tick();

      expect(component.selectedTestIds()).toEqual([]);
    }));
  });

  describe('onRemoveTest', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should remove test by testId', () => {
      component.selectedTestIds.set([
        { testId: 'T1', testDesc: 'Test 1', testGroup: 'G1' },
        { testId: 'T2', testDesc: 'Test 2', testGroup: 'G1' },
      ]);

      component.onRemoveTest('T1');

      expect(component.selectedTestIds().length).toBe(1);
      expect(component.selectedTestIds()[0].testId).toBe('T2');
    });

    it('should do nothing when testId not found', () => {
      component.selectedTestIds.set([
        { testId: 'T1', testDesc: 'Test 1', testGroup: 'G1' },
      ]);

      component.onRemoveTest('NONEXISTENT');

      expect(component.selectedTestIds().length).toBe(1);
    });
  });

  describe('onCancel', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should call clearForm', () => {
      spyOn(component, 'clearForm');
      component.onCancel();
      expect(component.clearForm).toHaveBeenCalled();
    });
  });

  describe('canDeactivate', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return true when no packed products and not loading', () => {
      component.packedProducts.set([]);
      component.loading.set(false);
      expect(component.canDeactivate()).toBe(true);
    });

    it('should return false when there are packed products', () => {
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);
      component.loading.set(false);
      expect(component.canDeactivate()).toBe(false);
    });

    it('should return false when loading', () => {
      component.packedProducts.set([]);
      component.loading.set(true);
      expect(component.canDeactivate()).toBe(false);
    });
  });

  describe('getSelectedProductTypeDesc', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return product type description when type is selected', () => {
      component.packForm.patchValue({ productType: 'PLT' });
      const desc = (component as any).getSelectedProductTypeDesc();
      expect(desc).toBe('Platelets');
    });

    it('should return empty string when no product type is selected', () => {
      component.packForm.patchValue({ productType: '' });
      const desc = (component as any).getSelectedProductTypeDesc();
      expect(desc).toBe('');
    });

    it('should return empty string when product type not found in list', () => {
      component.packForm.patchValue({ productType: 'UNKNOWN' });
      const desc = (component as any).getSelectedProductTypeDesc();
      expect(desc).toBe('');
    });
  });

  describe('handleApiError (via public methods)', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should display known error code message', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: false, statusCode: 400, message: 'Error occurred',
        data: null as any, errorCode: '0309',
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('UNIT001');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();
      component.onPackProduct();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid product code');
    }));

    it('should display response message when error code is unknown', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: false, statusCode: 400, message: 'Something went wrong',
        data: null as any, errorCode: '9999',
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('UNIT001');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();
      component.onPackProduct();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Something went wrong');
    }));

    it('should display default message when no error code and no message', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: false, statusCode: 400, message: '',
        data: null as any,
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('UNIT001');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();
      component.onPackProduct();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('An error occurred');
    }));
  });

  describe('handleError (via public methods)', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should display err.error.message when available', fakeAsync(() => {
      packLabDiscardsServiceSpy.packProduct.and.returnValue(throwError(() => ({ error: { message: 'Server error detail' } })));
      component.validatedUnitId.set('UNIT001');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();
      component.onPackProduct();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error detail');
    }));

    it('should display err.message when err.error.message is not available', fakeAsync(() => {
      packLabDiscardsServiceSpy.packProduct.and.returnValue(throwError(() => ({ message: 'Connection timeout' })));
      component.validatedUnitId.set('UNIT001');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();
      component.onPackProduct();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Connection timeout');
    }));

    it('should display fallback message when error has no message fields', fakeAsync(() => {
      packLabDiscardsServiceSpy.packProduct.and.returnValue(throwError(() => ({})));
      component.validatedUnitId.set('UNIT001');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();
      component.onPackProduct();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to pack product');
    }));
  });

  describe('Form Subscriptions - additional branches', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should disable orderNo and boxId when consigneeId is cleared', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();

      component.packForm.patchValue({ consigneeId: '' });
      tick();

      expect(component.orders()).toEqual([]);
      expect(component.boxes()).toEqual([]);
      expect(component.packForm.get('orderNo')?.disabled).toBe(true);
      expect(component.packForm.get('boxId')?.disabled).toBe(true);
    }));

    it('should clear selectedTestIds when discardType changes from BIO to NFT', fakeAsync(() => {
      component.selectedTestIds.set([{ testId: 'T1', testDesc: 'Test 1', testGroup: 'G1' }]);
      component.packForm.patchValue({ discardType: 'BIO' });
      tick();
      expect(component.selectedTestIds().length).toBe(1);

      component.packForm.patchValue({ discardType: 'NFT' });
      tick();
      expect(component.selectedTestIds().length).toBe(0);
    }));

    it('should load packed products when boxId changes to a value', fakeAsync(() => {
      const mockContents: BoxContent[] = [{
        unitId: 'U1', collDate: '2024-01-01', productType: 'RBC', productCode: 'P1',
        aliquot: null, bloodType: 'O+', aboDesc: 'O Positive', productDesc: 'RBC Desc',
        expDate: '2024-12-31', productStatus: 'OK', discardType: 'NFT', boxId: 'BX001',
      }];
      packLabDiscardsServiceSpy.getBoxContents.and.returnValue(of(mockContents));

      // First enable boxId by setting consignee
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();

      component.packForm.patchValue({ boxId: 'BX001' });
      tick();

      expect(packLabDiscardsServiceSpy.getBoxContents).toHaveBeenCalledWith('BX001');
      expect(component.packedProducts().length).toBe(1);
      expect(component.packedProducts()[0].unitId).toBe('U1');
      expect(component.packedProducts()[0].productDesc).toBe('RBC Desc');
      expect(component.packedProducts()[0].orderedAboRh).toBe('O Positive');
    }));

    it('should clear packed products when boxId changes to empty', fakeAsync(() => {
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);
      // Enable boxId
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      component.packForm.patchValue({ boxId: '' });
      tick();
      expect(component.packedProducts()).toEqual([]);
    }));

    it('should auto-select orderNo when only one order is returned', fakeAsync(() => {
      const singleOrder: Order[] = [{ orderNo: 'LD001', orderType: 'LD', orderStatus: 'OP', insertDate: '2024-01-01' }];
      packLabDiscardsServiceSpy.getOrders.and.returnValue(of(singleOrder));

      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();

      expect(component.packForm.get('orderNo')?.value).toBe('LD001');
    }));

    it('should not auto-select orderNo when there is already a value', fakeAsync(() => {
      // Set consignee to enable orderNo and trigger first load
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      // LD001 is auto-selected since only one order returned
      expect(component.packForm.get('orderNo')?.value).toBe('LD20240601001');

      // Manually set a different order
      component.packForm.patchValue({ orderNo: 'LD999' });

      // Trigger loadOrders again directly with a single order
      const newOrder: Order[] = [{ orderNo: 'LD002', orderType: 'LD', orderStatus: 'OP', insertDate: '2024-01-01' }];
      packLabDiscardsServiceSpy.getOrders.and.returnValue(of(newOrder));
      (component as any).loadOrders('CONS001');
      tick();

      // Should NOT auto-select LD002 because orderNo already has 'LD999'
      expect(component.packForm.get('orderNo')?.value).toBe('LD999');
    }));

    it('should enable orderNo and boxId when consigneeId is set', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      expect(component.packForm.get('orderNo')?.enabled).toBe(true);
      expect(component.packForm.get('boxId')?.enabled).toBe(true);
    }));
  });

  describe('loadPackedProducts - mapping', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should map box contents with fallback for missing productDesc and aboDesc', fakeAsync(() => {
      const contents: BoxContent[] = [{
        unitId: 'U2', collDate: '2024-01-01', productType: 'PLT', productCode: 'P2',
        aliquot: null, bloodType: 'AB+', aboDesc: '', productDesc: '',
        expDate: '2024-12-31', productStatus: 'OK', discardType: 'NFT', boxId: 'BX002',
      }];
      packLabDiscardsServiceSpy.getBoxContents.and.returnValue(of(contents));

      // Enable boxId
      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      component.packForm.patchValue({ boxId: 'BX002' });
      tick();

      expect(component.packedProducts()[0].productDesc).toBe('-');
      expect(component.packedProducts()[0].orderedAboRh).toBe('-');
    }));

    it('should map box contents using actual productDesc and aboDesc when provided', fakeAsync(() => {
      const contents: BoxContent[] = [{
        unitId: 'U3', collDate: '2024-01-01', productType: 'PLT', productCode: 'P3',
        aliquot: null, bloodType: 'AB+', aboDesc: 'O Positive', productDesc: 'Platelets',
        expDate: '2024-12-31', productStatus: 'OK', discardType: 'NFT', boxId: 'BX003',
      }];
      packLabDiscardsServiceSpy.getBoxContents.and.returnValue(of(contents));

      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      component.packForm.patchValue({ boxId: 'BX003' });
      tick();

      expect(component.packedProducts()[0].productDesc).toBe('Platelets');
      expect(component.packedProducts()[0].orderedAboRh).toBe('O Positive');
    }));

    it('should handle loadPackedProducts error', fakeAsync(() => {
      packLabDiscardsServiceSpy.getBoxContents.and.returnValue(throwError(() => new Error('fail')));

      component.packForm.patchValue({ consigneeId: 'CONS001' });
      tick();
      component.packForm.patchValue({ boxId: 'BX001' });
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Pack product - additional branches', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should mark form as touched when form is invalid', fakeAsync(() => {
      component.validatedUnitId.set('UNIT001');
      component.packForm.patchValue({ consigneeId: '' });
      tick();

      spyOn(component.packForm, 'markAllAsTouched');
      component.onPackProduct();
      tick();

      expect(component.packForm.markAllAsTouched).toHaveBeenCalled();
      expect(packLabDiscardsServiceSpy.packProduct).not.toHaveBeenCalled();
    }));

    it('should add new box to boxes list when box does not exist', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: 'Packed',
        data: { boxId: 'NEW_BOX', pickSlipId: '', orderNo: '', unitId: 'U1', productCode: 'P1', message: 'OK' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('U1');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();

      component.onPackProduct();
      tick();

      const boxIds = component.boxes().map(b => b.boxId);
      expect(boxIds).toContain('NEW_BOX');
    }));

    it('should set boxId when no box was previously selected', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: 'Packed',
        data: { boxId: 'BX_AUTO', pickSlipId: '', orderNo: '', unitId: 'U1', productCode: 'P1', message: 'OK' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('U1');
      component.selectedBoxId.set(null);
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();

      component.onPackProduct();
      tick();

      expect(component.packForm.get('boxId')?.value).toBe('BX_AUTO');
    }));

    it('should add new order to orders list when order does not exist', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: 'Packed',
        data: { boxId: 'BX001', pickSlipId: '', orderNo: 'NEW_ORDER', unitId: 'U1', productCode: 'P1', message: 'OK' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('U1');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();

      component.onPackProduct();
      tick();

      const orderNos = component.orders().map(o => o.orderNo);
      expect(orderNos).toContain('NEW_ORDER');
    }));

    it('should set orderNo when no order was previously set', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: 'Packed',
        data: { boxId: 'BX001', pickSlipId: '', orderNo: 'LD_AUTO', unitId: 'U1', productCode: 'P1', message: 'OK' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('U1');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+', orderNo: '' });
      tick();

      component.onPackProduct();
      tick();

      expect(component.packForm.get('orderNo')?.value).toBe('LD_AUTO');
    }));

    it('should use default success message when response message is empty', fakeAsync(() => {
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: '',
        data: { boxId: 'BX001', pickSlipId: '', orderNo: '', unitId: 'U1', productCode: 'P1', message: '' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('U1');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();

      component.onPackProduct();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product packed successfully.');
    }));

    it('should not add box to list if it already exists', fakeAsync(() => {
      component.boxes.set([{ boxId: 'BX001', boxStatus: 'OP', consigneeId: 'CONS001' }]);
      const mockResponse: ApiResponse<PackProductResponse> = {
        success: true, statusCode: 201, message: 'Packed',
        data: { boxId: 'BX001', pickSlipId: '', orderNo: '', unitId: 'U1', productCode: 'P1', message: 'OK' },
      };
      packLabDiscardsServiceSpy.packProduct.and.returnValue(of(mockResponse));
      component.validatedUnitId.set('U1');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();

      component.onPackProduct();
      tick();

      expect(component.boxes().filter(b => b.boxId === 'BX001').length).toBe(1);
    }));

    it('should handle pack product network error', fakeAsync(() => {
      packLabDiscardsServiceSpy.packProduct.and.returnValue(throwError(() => new Error('Network error')));
      component.validatedUnitId.set('U1');
      component.packForm.patchValue({ consigneeId: 'CONS001', productCode: 'P1', bloodType: 'O+' });
      tick();

      component.onPackProduct();
      tick();

      expect(component.loading()).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Consignee search subscription', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should update consigneeSearchText from search control', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue('test search');
      tick();
      expect((component as any).consigneeSearchText()).toBe('test search');
    }));

    it('should handle null value from search control', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue(null);
      tick();
      expect((component as any).consigneeSearchText()).toBe('');
    }));
  });

  describe('filteredConsignees - additional filters', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should filter by customerId', () => {
      (component as any).consigneeSearchText.set('cust001');
      const filtered = component.filteredConsignees();
      expect(filtered.length).toBe(1);
      expect(filtered[0].customerId).toBe('CUST001');
    });

    it('should filter by consigneeName', () => {
      (component as any).consigneeSearchText.set('acme disposal');
      const filtered = component.filteredConsignees();
      expect(filtered.length).toBe(1);
    });

    it('should return empty when no match', () => {
      (component as any).consigneeSearchText.set('zzz_no_match');
      const filtered = component.filteredConsignees();
      expect(filtered.length).toBe(0);
    });
  });

  describe('headerConfig computed', () => {
    it('should return header config from pageHeaderService data', () => {
      fixture.detectChanges();
      const config = (component as any).headerConfig();
      expect(config.title).toBe('Pack Lab Discards');
      expect(config.breadcrumbs.length).toBe(2);
      expect(config.breadcrumbs[0].label).toBe('Home');
      expect(config.breadcrumbs[0].link).toBe('/home');
      expect(config.breadcrumbs[1].label).toBe('Pack Lab Discards');
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      fixture.detectChanges();
      expect(component.f).toBe(component.packForm.controls);
    });
  });

  describe('elementId helper', () => {
    it('should generate element IDs with component prefix', () => {
      const id = (component as any).elementId('test-field');
      expect(id).toContain('pack-lab-discards-');
      expect(id).toContain('-test-field');
    });
  });

  describe('clearForm - detailed state reset', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should reset all state signals', () => {
      component.validatedUnitId.set('UNIT001');
      component.collectionDateDisplay.set('2024-06-01');
      component.orders.set(mockOrders);
      component.boxes.set(mockBoxes);
      component.selectedTestIds.set(mockTestIds);
      component.pickSlipId.set('PS001');

      component.clearForm();

      expect(component.validatedUnitId()).toBeNull();
      expect(component.collectionDateDisplay()).toBe('-');
      expect(component.orders()).toEqual([]);
      expect(component.boxes()).toEqual([]);
      expect(component.selectedTestIds()).toEqual([]);
      expect(component.pickSlipId()).toBe('');
      expect(component.packForm.get('orderNo')?.disabled).toBe(true);
      expect(component.packForm.get('boxId')?.disabled).toBe(true);
    });
  });

  describe('getSelectedConsigneeAddress - edge cases', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return empty when consignee is not found in list', fakeAsync(() => {
      component.packForm.patchValue({ consigneeId: 'NONEXISTENT' });
      tick();
      const address = (component as any).getSelectedConsigneeAddress();
      expect(address).toBe('');
    }));
  });

  describe('Loading errors for data loading methods', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should handle consignees loading error', fakeAsync(() => {
      packLabDiscardsServiceSpy.getConsignees.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadConsignees();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle orders loading error', fakeAsync(() => {
      packLabDiscardsServiceSpy.getOrders.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadOrders('CONS001');
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle productTypes loading error', fakeAsync(() => {
      packLabDiscardsServiceSpy.getProductTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadProductTypes();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle discardTypes loading error', fakeAsync(() => {
      packLabDiscardsServiceSpy.getDiscardTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadDiscardTypes();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle boxes loading error', fakeAsync(() => {
      packLabDiscardsServiceSpy.getBoxes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadBoxes('CONS001');
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should handle testIds loading error', fakeAsync(() => {
      packLabDiscardsServiceSpy.getTestIds.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadTestIds();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('parseProductCode', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return null for empty string', (done) => {
      component.parseProductCode('').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null for whitespace-only string', (done) => {
      component.parseProductCode('   ').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should match product code from options by exact match', (done) => {
      component.productCodeOptions.set([{ code: 'PROD001', description: 'Red Blood Cells' }]);
      component.parseProductCode('prod001').subscribe(result => {
        expect(result).toEqual({ code: 'PROD001', description: 'Red Blood Cells' });
        done();
      });
    });

    it('should match product code from options by prefix', (done) => {
      component.productCodeOptions.set([{ code: 'PROD001', description: 'Red Blood Cells' }]);
      component.parseProductCode('PROD').subscribe(result => {
        expect(result).toEqual({ code: 'PROD001', description: 'Red Blood Cells' });
        done();
      });
    });
  });

  describe('parseAboRh', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should return null for empty string', (done) => {
      component.parseAboRh('').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null for whitespace-only string', (done) => {
      component.parseAboRh('   ').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });

    it('should match ABO code from options by exact match', (done) => {
      component.aboRhOptions.set([{ code: 'O+', description: 'O Positive' }]);
      component.parseAboRh('o+').subscribe(result => {
        expect(result).toEqual({ code: 'O+', description: 'O Positive' });
        done();
      });
    });
  });

  describe('Chapter change clears form', () => {
    it('should clear form and reload data on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.validatedUnitId.set('UNIT001');
      component.packedProducts.set([{ unitId: 'U1', productCode: 'P1', productDesc: 'D', orderedAboRh: 'O+', boxId: 'BX001' }]);

      packLabDiscardsServiceSpy.getConsignees.calls.reset();
      packLabDiscardsServiceSpy.getProductTypes.calls.reset();
      packLabDiscardsServiceSpy.getDiscardTypes.calls.reset();
      packLabDiscardsServiceSpy.getTestIds.calls.reset();

      headerServiceMock.chapterChanged$.next();
      tick();

      expect(packLabDiscardsServiceSpy.getConsignees).toHaveBeenCalled();
      expect(packLabDiscardsServiceSpy.getProductTypes).toHaveBeenCalled();
      expect(packLabDiscardsServiceSpy.getDiscardTypes).toHaveBeenCalled();
      expect(packLabDiscardsServiceSpy.getTestIds).toHaveBeenCalled();
    }));
  });

  describe('loadPackedProducts - direct call branch coverage', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should map contents with truthy productDesc and aboDesc directly', fakeAsync(() => {
      const contents: BoxContent[] = [{
        unitId: 'U10', collDate: '2024-01-01', productType: 'PLT', productCode: 'P10',
        aliquot: null, bloodType: 'O+', aboDesc: 'O Positive', productDesc: 'Platelets',
        expDate: '2024-12-31', productStatus: 'OK', discardType: 'NFT', boxId: 'BX010',
      }];
      packLabDiscardsServiceSpy.getBoxContents.and.returnValue(of(contents));

      (component as any).loadPackedProducts('BX010');
      tick();

      expect(component.packedProducts()[0].productDesc).toBe('Platelets');
      expect(component.packedProducts()[0].orderedAboRh).toBe('O Positive');
      expect(component.packedProducts()[0].boxId).toBe('BX010');
    }));

    it('should map contents with falsy productDesc and aboDesc directly', fakeAsync(() => {
      const contents: BoxContent[] = [{
        unitId: 'U11', collDate: '2024-01-01', productType: 'RBC', productCode: 'P11',
        aliquot: null, bloodType: 'A-', aboDesc: null as any, productDesc: null as any,
        expDate: '2024-12-31', productStatus: 'OK', discardType: 'NFT', boxId: 'BX011',
      }];
      packLabDiscardsServiceSpy.getBoxContents.and.returnValue(of(contents));

      (component as any).loadPackedProducts('BX011');
      tick();

      expect(component.packedProducts()[0].productDesc).toBe('-');
      expect(component.packedProducts()[0].orderedAboRh).toBe('-');
    }));

    it('should handle loadPackedProducts error directly', fakeAsync(() => {
      packLabDiscardsServiceSpy.getBoxContents.and.returnValue(throwError(() => new Error('load error')));

      (component as any).loadPackedProducts('BX_ERR');
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('onProductCodeChange - no matching products', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.unitProducts.set(mockUnitProducts);
    });

    it('should not update description or options when no products match', () => {
      component.onProductCodeChange({ code: 'UNKNOWN_CODE', description: 'Unknown' });

      expect(component.productDescription()).toBe('-');
      expect(component.aboRhOptions().length).toBe(0);
      expect(component.aliquotOptions().length).toBe(0);
    });
  });

  describe('applyBloodTypeFromAliquot - branch coverage', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should auto-set blood type when exact aliquot match has systemLabelDecision', () => {
      const products: UnitProduct[] = [{
        unitId: 'U1', productCode: 'P1', productDesc: 'RBC', productType: 'RBC',
        componentPrefix: 'A', systemLabelDecision: 'O+', aboDesc: 'O Positive', collDate: '2024-01-01',
      }];
      const aboRhFieldSpy = jasmine.createSpyObj('aboRhField', ['setValue']);
      (component as any).aboRhField = aboRhFieldSpy;

      (component as any).applyBloodTypeFromAliquot('A', products);

      expect(aboRhFieldSpy.setValue).toHaveBeenCalledWith('O+', 'O Positive');
    });

    it('should use first product when no exact aliquot match exists', () => {
      const products: UnitProduct[] = [{
        unitId: 'U1', productCode: 'P1', productDesc: 'RBC', productType: 'RBC',
        componentPrefix: 'B', systemLabelDecision: 'A-', aboDesc: '', collDate: '2024-01-01',
      }];
      const aboRhFieldSpy = jasmine.createSpyObj('aboRhField', ['setValue']);
      (component as any).aboRhField = aboRhFieldSpy;

      (component as any).applyBloodTypeFromAliquot('Z', products);

      expect(aboRhFieldSpy.setValue).toHaveBeenCalledWith('A-', 'A-');
    });

    it('should use systemLabelDecision as description when aboDesc is empty', () => {
      const products: UnitProduct[] = [{
        unitId: 'U1', productCode: 'P1', productDesc: 'RBC', productType: 'RBC',
        componentPrefix: 'A', systemLabelDecision: 'AB+', aboDesc: null as any, collDate: '2024-01-01',
      }];
      const aboRhFieldSpy = jasmine.createSpyObj('aboRhField', ['setValue']);
      (component as any).aboRhField = aboRhFieldSpy;

      (component as any).applyBloodTypeFromAliquot('A', products);

      expect(aboRhFieldSpy.setValue).toHaveBeenCalledWith('AB+', 'AB+');
    });

    it('should not set blood type when product has no systemLabelDecision', () => {
      const products: UnitProduct[] = [{
        unitId: 'U1', productCode: 'P1', productDesc: 'RBC', productType: 'RBC',
        componentPrefix: 'A', systemLabelDecision: null as any, aboDesc: null as any, collDate: '2024-01-01',
      }];
      const aboRhFieldSpy = jasmine.createSpyObj('aboRhField', ['setValue']);
      (component as any).aboRhField = aboRhFieldSpy;

      (component as any).applyBloodTypeFromAliquot('A', products);

      expect(aboRhFieldSpy.setValue).not.toHaveBeenCalled();
    });

    it('should not set blood type when products list is empty and no exact match', () => {
      const aboRhFieldSpy = jasmine.createSpyObj('aboRhField', ['setValue']);
      (component as any).aboRhField = aboRhFieldSpy;

      (component as any).applyBloodTypeFromAliquot('A', []);

      expect(aboRhFieldSpy.setValue).not.toHaveBeenCalled();
    });
  });
});
