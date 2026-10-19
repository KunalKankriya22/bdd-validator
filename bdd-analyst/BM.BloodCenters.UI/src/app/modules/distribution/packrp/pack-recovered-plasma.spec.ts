import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

import { PackRecoveredPlasmaComponent } from './pack-recovered-plasma';
import { PackRecoveredPlasmaService } from './services/pack-recovered-plasma.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  PickSlipDto,
  BoxDto,
  PackedProductDto,
  PackProductResponseDto
} from './models/pack-recovered-plasma.model';

describe('PackRecoveredPlasmaComponent', () => {
  let component: PackRecoveredPlasmaComponent;
  let fixture: ComponentFixture<PackRecoveredPlasmaComponent>;
  let packServiceSpy: jasmine.SpyObj<PackRecoveredPlasmaService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockPickSlip: PickSlipDto = {
    pickSlipId: 'PA-001',
    orderId: 'ORD-001',
    customerId: 'CUST001',
    customerName: 'Test Hospital',
    consigneeId: 'CONS001',
    consigneeName: 'Test Lab',
    productCode: 'RPL',
    aboType: 'O+',
    quantityOrdered: 100,
    quantityPacked: 50,
    status: 'OPEN'
  };

  const mockBox: BoxDto = {
    boxId: 'BOX-001',
    pickSlipId: 'PA-001',
    maxCapacity: 50,
    currentCount: 35,
    remainingCapacity: 15,
    percentageFull: 70.0,
    isAtCapacity: false,
    status: 'OPEN'
  };

  const mockPackedProducts: PackedProductDto[] = [
    {
      dinNumber: '=<E123456789012',
      pickSlipId: 'PA-001',
      boxId: 'BOX-001',
      productCode: 'RPL',
      aboRh: 'O+',
      expirationDate: '2025-12-31T00:00:00Z',
      collectionDate: '2024-05-20T00:00:00Z',
      componentWeight: 300,
      componentVolume: 310
    }
  ];

  beforeEach(() => {

    packServiceSpy = jasmine.createSpyObj('PackRecoveredPlasmaService', [
      'packProduct',
      'unpackProduct',
      'getPackedProductsByBox',
      'getPackedProductsByPickSlip',
      'getCustomers',
      'getOrders',
      'queryPickSlips',
      'getPickSlipById',
      'createPickSlip',
      'getBoxesByPickSlip',
      'getBoxById',
      'createBox',
      'getAvailableProducts',
      'searchBoxes'
    ]);
    dialogSpy = createMockMatDialog();
    headerServiceSpy = createMockHeaderService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({
        title: 'Pack Recovered Plasma',
        subtitle: 'Test subtitle'
      })
    });
    snackbarServiceSpy = createMockSnackbarService();

    const translateServiceSpy = createMockTranslateService();
    packServiceSpy.getPackedProductsByBox.and.returnValue(of(mockPackedProducts));
    packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of([]));
    packServiceSpy.getCustomers.and.returnValue(of([]));
    packServiceSpy.getOrders.and.returnValue(of([]));
    packServiceSpy.queryPickSlips.and.returnValue(of({ data: [], totalCount: 0 }));
    packServiceSpy.getPickSlipById.and.returnValue(of(mockPickSlip));
    packServiceSpy.createPickSlip.and.returnValue(of({ pickSlipId: 'PA-001' }));
    packServiceSpy.getBoxesByPickSlip.and.returnValue(of([]));
    packServiceSpy.getBoxById.and.returnValue(of(mockBox));
    packServiceSpy.createBox.and.returnValue(of({ boxId: 'BOX-001' }));
    packServiceSpy.getAvailableProducts.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [PackRecoveredPlasmaComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PackRecoveredPlasmaService, useValue: packServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    })
    .overrideComponent(PackRecoveredPlasmaComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });


    


      packServiceSpy.packProduct.calls.reset();


      packServiceSpy.unpackProduct.calls.reset();


      packServiceSpy.getPackedProductsByBox.calls.reset();


      packServiceSpy.getPackedProductsByPickSlip.calls.reset();


      packServiceSpy.getCustomers.calls.reset();


      packServiceSpy.getOrders.calls.reset();


      packServiceSpy.queryPickSlips.calls.reset();


      packServiceSpy.getPickSlipById.calls.reset();


      packServiceSpy.createPickSlip.calls.reset();


      packServiceSpy.getBoxesByPickSlip.calls.reset();


      packServiceSpy.getBoxById.calls.reset();


      packServiceSpy.createBox.calls.reset();


      packServiceSpy.getAvailableProducts.calls.reset();


      packServiceSpy.searchBoxes.calls.reset();


      packServiceSpy.getPackedProductsByBox.and.returnValue(of(mockPackedProducts));


      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of([]));


      packServiceSpy.getCustomers.and.returnValue(of([]));


      packServiceSpy.getOrders.and.returnValue(of([]));


      packServiceSpy.queryPickSlips.and.returnValue(of({ data: [], totalCount: 0 }));


      packServiceSpy.getPickSlipById.and.returnValue(of(mockPickSlip));


      packServiceSpy.createPickSlip.and.returnValue(of({ pickSlipId: 'PA-001' }));


      packServiceSpy.getBoxesByPickSlip.and.returnValue(of([]));


      packServiceSpy.getBoxById.and.returnValue(of(mockBox));


      packServiceSpy.createBox.and.returnValue(of({ boxId: 'BOX-001' }));


      packServiceSpy.getAvailableProducts.and.returnValue(of([]));


    fixture = TestBed.createComponent(PackRecoveredPlasmaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {




    it('should initialize with no pick slip or box selected', () => {
      expect(component.selectedPickSlip()).toBeNull();
      expect(component.selectedBox()).toBeNull();
    });

    it('should have canPack computed as false initially', () => {
      expect(component.canPack()).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    it('should require product code', () => {
      const productCodeControl = component.productForm.get('productCode');
      productCodeControl?.setValue('');
      expect(productCodeControl?.hasError('required')).toBeTrue();
    });
  });



  describe('Unpack Product', () => {
    beforeEach(() => {
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);
    });



    it('should unpack product when confirmed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const mockResponse = {
        dinNumber: '=<E123456789012',
        boxId: 'BOX-001',
        currentCount: 34,
        remainingCapacity: 16
      };

      packServiceSpy.unpackProduct.and.returnValue(of(mockResponse));

      component.onUnpackProduct(mockPackedProducts[0]);
      tick();

      expect(packServiceSpy.unpackProduct).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
        'Product removed successfully'
      );
    }));


  });

  describe('Volume Summary', () => {
    it('should calculate volume summary correctly', () => {
      component.packedProducts.set(mockPackedProducts);

      const summary = component.volumeSummary();

      expect(summary.currentVolume).toBe(310);
      expect(summary.totalVolume).toBe(310);
    });

    it('should calculate summary for multiple products', () => {
      const products: PackedProductDto[] = [
        { ...mockPackedProducts[0], componentVolume: 300 },
        { ...mockPackedProducts[0], componentVolume: 250 },
        { ...mockPackedProducts[0], componentVolume: 320 }
      ];

      component.packedProducts.set(products);

      const summary = component.volumeSummary();

      expect(summary.currentVolume).toBe(870);
      expect(summary.totalVolume).toBe(870);
    });
  });
  describe('Cancel Action', () => {


    it('should clear submitted flag on cancel', () => {
      component.submitted.set(true);

      component.onCancel();

      expect(component.submitted()).toBeFalse();
    });
  });

  describe('loadCustomers', () => {
    it('should load customers successfully and set options', () => {
      const mockCustomers = [
        { customerId: 'C1', customerName: 'Hospital A', consigneeId: 'CON1', consigneeName: 'Lab A', contractNumber: null, contractEffDate: null, contractTermDate: null, hasValidContract: true },
        { customerId: 'C2', customerName: 'Hospital B', consigneeId: 'CON2', consigneeName: 'Lab B', contractNumber: null, contractEffDate: null, contractTermDate: null, hasValidContract: true }
      ];
      packServiceSpy.getCustomers.and.returnValue(of(mockCustomers));

      (component as any).loadCustomers();

      expect(packServiceSpy.getCustomers).toHaveBeenCalled();
      expect(component['customerOptions']().length).toBe(2);
      expect(component['filteredCustomerOptions']().length).toBe(2);
      expect(component['loading']()).toBeFalse();
    });

    it('should handle error when loading customers', () => {
      packServiceSpy.getCustomers.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadCustomers();

      expect(component['customerOptions']().length).toBe(0);
      expect(component['loading']()).toBeFalse();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load customers');
    });
  });

  describe('loadOrders', () => {
    it('should load orders and auto-select single order', () => {
      const mockOrders = [{ orderId: 'ORD1', customerId: 'C1', customerName: 'H', consigneeId: 'CO1', consigneeName: 'L', orderDate: '', status: 'OP', totalItems: 10, packedItems: 0, remainingItems: 10 }];
      packServiceSpy.getOrders.and.returnValue(of(mockOrders));

      (component as any).loadOrders('C1', 'CO1');

      expect(packServiceSpy.getOrders).toHaveBeenCalledWith('C1', 'CO1');
      expect(component['orderOptions']().length).toBe(1);
      expect(component['selectedOrderNo']).toBe('ORD1');
    });

    it('should load multiple orders without auto-selecting', () => {
      const mockOrders = [
        { orderId: 'ORD1', customerId: 'C1', customerName: 'H', consigneeId: 'CO1', consigneeName: 'L', orderDate: '', status: 'OP', totalItems: 10, packedItems: 0, remainingItems: 10 },
        { orderId: 'ORD2', customerId: 'C1', customerName: 'H', consigneeId: 'CO1', consigneeName: 'L', orderDate: '', status: 'OP', totalItems: 5, packedItems: 0, remainingItems: 5 }
      ];
      packServiceSpy.getOrders.and.returnValue(of(mockOrders));
      component['selectedOrderNo'] = '';

      (component as any).loadOrders('C1', 'CO1');

      expect(component['orderOptions']().length).toBe(2);
      expect(component['selectedOrderNo']).toBe('');
    });

    it('should handle error when loading orders', () => {
      packServiceSpy.getOrders.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadOrders('C1', 'CO1');

      expect(component['orderOptions']().length).toBe(0);
    });
  });

  describe('loadBoxesByPickSlip', () => {
    it('should load boxes and auto-select open box', () => {
      const mockBoxes: BoxDto[] = [
        { boxId: 'B1', pickSlipId: 'PA-001', maxCapacity: 50, currentCount: 10, remainingCapacity: 40, percentageFull: 20, isAtCapacity: false, status: 'OP' },
        { boxId: 'B2', pickSlipId: 'PA-001', maxCapacity: 50, currentCount: 50, remainingCapacity: 0, percentageFull: 100, isAtCapacity: true, status: 'CL' }
      ];
      packServiceSpy.getBoxesByPickSlip.and.returnValue(of(mockBoxes));

      (component as any).loadBoxesByPickSlip('PA-001');

      expect(packServiceSpy.getBoxesByPickSlip).toHaveBeenCalledWith('PA-001');
      expect(component['boxOptions']().length).toBe(2);
      expect(component['selectedBox']()?.boxId).toBe('B1');
    });

    it('should load boxes without open box', () => {
      const mockBoxes: BoxDto[] = [
        { boxId: 'B2', pickSlipId: 'PA-001', maxCapacity: 50, currentCount: 50, remainingCapacity: 0, percentageFull: 100, isAtCapacity: true, status: 'CL' }
      ];
      packServiceSpy.getBoxesByPickSlip.and.returnValue(of(mockBoxes));

      (component as any).loadBoxesByPickSlip('PA-001');

      expect(component['boxOptions']().length).toBe(1);
    });

    it('should handle error loading boxes', () => {
      packServiceSpy.getBoxesByPickSlip.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadBoxesByPickSlip('PA-001');

      expect(component['boxOptions']().length).toBe(0);
      expect(component['filteredBoxOptions']().length).toBe(0);
    });
  });

  describe('loadAvailableProducts', () => {
    it('should load products and set unique product code options', () => {
      const mockProducts = [
        { dinNumber: 'D1', productCode: 'RPL', productDescription: 'Recovered Plasma', aboRh: 'O+', expirationDate: '', stockState: '', barcodeScheme: '' },
        { dinNumber: 'D2', productCode: 'RPL', productDescription: 'Recovered Plasma', aboRh: 'A+', expirationDate: '', stockState: '', barcodeScheme: '' },
        { dinNumber: 'D3', productCode: 'RPFF', productDescription: 'Fresh Frozen', aboRh: 'B+', expirationDate: '', stockState: '', barcodeScheme: '' }
      ];
      packServiceSpy.getAvailableProducts.and.returnValue(of(mockProducts));

      (component as any).loadAvailableProducts('RPL');

      expect(component['productCodeOptions']().length).toBe(2);
      expect(component['filteredProductCodeOptions']().length).toBe(2);
    });

    it('should handle error loading available products', () => {
      packServiceSpy.getAvailableProducts.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadAvailableProducts('RPL');

      expect(component['productCodeOptions']().length).toBe(0);
      expect(component['filteredProductCodeOptions']().length).toBe(0);
    });
  });

  describe('loadPickSlips', () => {
    it('should return early if required fields are missing', () => {
      component['selectedCustomerId'] = '';
      component['selectedConsigneeId'] = '';
      component['selectedProductType'] = '';
      packServiceSpy.queryPickSlips.calls.reset();

      (component as any).loadPickSlips();

      expect(packServiceSpy.queryPickSlips).not.toHaveBeenCalled();
    });

    it('should load pick slips and auto-select single result', () => {
      component['selectedCustomerId'] = 'C1';
      component['selectedConsigneeId'] = 'CO1';
      component['selectedProductType'] = 'RPL';

      packServiceSpy.queryPickSlips.and.returnValue(of({ data: [mockPickSlip], totalCount: 1 }));
      packServiceSpy.getBoxesByPickSlip.and.returnValue(of([]));
      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of([]));

      (component as any).loadPickSlips();

      expect(packServiceSpy.queryPickSlips).toHaveBeenCalled();
      expect(component['selectedPickSlip']()?.pickSlipId).toBe('PA-001');
    });

    it('should load multiple pick slips without auto-selecting', () => {
      component['selectedCustomerId'] = 'C1';
      component['selectedConsigneeId'] = 'CO1';
      component['selectedProductType'] = 'RPL';

      const secondPickSlip = { ...mockPickSlip, pickSlipId: 'PA-002' };
      packServiceSpy.queryPickSlips.and.returnValue(of({ data: [mockPickSlip, secondPickSlip], totalCount: 2 }));

      (component as any).loadPickSlips();

      expect(component['pickSlipOptions']().length).toBe(2);
    });

    it('should handle error loading pick slips', () => {
      component['selectedCustomerId'] = 'C1';
      component['selectedConsigneeId'] = 'CO1';
      component['selectedProductType'] = 'RPL';

      packServiceSpy.queryPickSlips.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadPickSlips();

      expect(component['pickSlipOptions']().length).toBe(0);
    });
  });

  describe('loadPreviousVolume', () => {
    it('should calculate previous volume excluding current box', () => {
      component.selectedBox.set(mockBox);
      const products: PackedProductDto[] = [
        { ...mockPackedProducts[0], boxId: 'BOX-001', componentVolume: 100 },
        { ...mockPackedProducts[0], boxId: 'BOX-002', componentVolume: 200 },
        { ...mockPackedProducts[0], boxId: 'BOX-003', componentVolume: 150 }
      ];
      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of(products));

      (component as any).loadPreviousVolume('PA-001');

      expect(component['previousVolume']()).toBe(350);
    });

    it('should handle error loading previous volume', () => {
      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadPreviousVolume('PA-001');

      expect(component['previousVolume']()).toBe(0);
    });
  });

  describe('loadPackedProducts', () => {
    it('should load packed products and update total count', () => {
      packServiceSpy.getPackedProductsByBox.and.returnValue(of(mockPackedProducts));

      (component as any).loadPackedProducts('BOX-001');

      expect(component['packedProducts']().length).toBe(1);
      expect(component.totalCount).toBe(1);
      expect(component['loading']()).toBeFalse();
    });

    it('should handle error loading packed products', () => {
      packServiceSpy.getPackedProductsByBox.and.returnValue(throwError(() => new Error('fail')));

      (component as any).loadPackedProducts('BOX-001');

      expect(component['loading']()).toBeFalse();
    });
  });

  describe('onUnitIdValidated', () => {
    beforeEach(() => {
      (packServiceSpy as any).getProductByDin = jasmine.createSpy('getProductByDin');
    });

    it('should return early if parsed unit id is missing', () => {
      component['onUnitIdValidated']({ parsedUnitId: '', codeScheme: 'I' } as any);
      expect((packServiceSpy as any).getProductByDin).not.toHaveBeenCalled();
    });

    it('should fetch product by DIN and populate form on success', () => {
      const mockDetail = { dinNumber: 'DIN1', productCode: 'RPL', barcodeScheme: 'Mf', componentWeight: 300, componentVolume: 310 };
      (packServiceSpy as any).getProductByDin.and.returnValue(of(mockDetail));

      component['onUnitIdValidated']({ parsedUnitId: 'DIN1', codeScheme: 'I' } as any);

      expect((packServiceSpy as any).getProductByDin).toHaveBeenCalledWith('DIN1');
      expect(component['productDetail']()?.productCode).toBe('RPL');
      expect(component['fetchingProduct']()).toBeFalse();
    });

    it('should set label to 49 when codeScheme is not I', () => {
      const mockDetail = { dinNumber: 'DIN1', productCode: 'RPL' };
      (packServiceSpy as any).getProductByDin.and.returnValue(of(mockDetail));

      component['onUnitIdValidated']({ parsedUnitId: 'DIN1', codeScheme: 'E' } as any);

      // Initial label is '49' for non-I codeScheme; no barcodeScheme in detail so it stays '49'
      expect(component['labelCtrl'].value).toBe('49');
    });

    it('should show 404 error message', () => {
      (packServiceSpy as any).getProductByDin.and.returnValue(throwError(() => ({ status: 404 })));

      component['onUnitIdValidated']({ parsedUnitId: 'DIN1', codeScheme: 'I' } as any);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('No available product'));
      expect(component['fetchingProduct']()).toBeFalse();
    });

    it('should show 400 error message', () => {
      (packServiceSpy as any).getProductByDin.and.returnValue(throwError(() => ({ status: 400, error: { message: 'Bad DIN' } })));

      component['onUnitIdValidated']({ parsedUnitId: 'DIN1', codeScheme: 'I' } as any);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Bad DIN');
    });

    it('should show generic error message for other errors', () => {
      (packServiceSpy as any).getProductByDin.and.returnValue(throwError(() => ({ status: 500 })));

      component['onUnitIdValidated']({ parsedUnitId: 'DIN1', codeScheme: 'I' } as any);

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Unable to look up product. Please try again.');
    });
  });

  describe('onUnitIdCleared', () => {
    it('should clear product detail and form values', () => {
      component['productDetail'].set({ dinNumber: 'D1', productCode: 'RPL' });
      component['labelCtrl'].setValue('Mf');
      component.productForm.patchValue({ productCode: 'RPL' }, { emitEvent: false });

      component['onUnitIdCleared']();

      expect(component['productDetail']()).toBeNull();
      expect(component['labelCtrl'].value).toBe('');
      expect(component.productForm.get('productCode')?.value).toBe('');
    });
  });

  describe('ensureProductCodeOption', () => {
    it('should not add duplicate product code option', () => {
      component['productCodeOptions'].set([{ productCode: 'RPL', description: 'Recovered Plasma' }]);

      (component as any).ensureProductCodeOption('RPL');

      expect(component['productCodeOptions']().length).toBe(1);
    });

    it('should add new product code option when not present', () => {
      component['productCodeOptions'].set([{ productCode: 'RPL', description: 'Recovered Plasma' }]);

      (component as any).ensureProductCodeOption('RPFF');

      expect(component['productCodeOptions']().length).toBe(2);
      expect(component['filteredProductCodeOptions']().length).toBe(2);
    });
  });

  describe('onCustomerChange', () => {
    beforeEach(() => {
      component['customerOptions'].set([
        { customerId: 'C1', customerName: 'Hospital A', consigneeId: 'CO1', consigneeName: 'Lab A' },
        { customerId: 'C2', customerName: 'Hospital B', consigneeId: 'CO2', consigneeName: 'Lab B' }
      ]);
      packServiceSpy.getOrders.and.returnValue(of([]));
      packServiceSpy.queryPickSlips.and.returnValue(of({ data: [], totalCount: 0 }));
    });

    it('should return early if customer not found', () => {
      packServiceSpy.getOrders.calls.reset();

      component['onCustomerChange']('INVALID');

      expect(packServiceSpy.getOrders).not.toHaveBeenCalled();
    });

    it('should set consignee and clear downstream state', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);
      component['packedProducts'].set(mockPackedProducts);

      component['onCustomerChange']('C1');

      expect(component['selectedConsigneeId']).toBe('CO1');
      expect(component['orderOptions']().length).toBe(0);
      expect(component['boxOptions']().length).toBe(0);
      expect(component['packedProducts']().length).toBe(0);
    });

    it('should load orders for selected customer', () => {
      component['onCustomerChange']('C1');

      expect(packServiceSpy.getOrders).toHaveBeenCalledWith('C1', 'CO1');
    });

    it('should load pick slips when product type is already selected', () => {
      component['selectedProductType'] = 'RPL';
      component['selectedCustomerId'] = 'C1';

      component['onCustomerChange']('C1');

      expect(packServiceSpy.queryPickSlips).toHaveBeenCalled();
    });

    it('should not load pick slips when product type is not selected', () => {
      component['selectedProductType'] = '';
      packServiceSpy.queryPickSlips.calls.reset();

      component['onCustomerChange']('C1');

      expect(packServiceSpy.queryPickSlips).not.toHaveBeenCalled();
    });
  });

  describe('onBoxChange', () => {
    it('should return early for empty boxId', () => {
      packServiceSpy.getBoxById.calls.reset();

      component['onBoxChange']('');

      expect(packServiceSpy.getBoxById).not.toHaveBeenCalled();
    });

    it('should load box details and packed products', () => {
      component.selectedPickSlip.set(mockPickSlip);
      packServiceSpy.getBoxById.and.returnValue(of(mockBox));
      packServiceSpy.getPackedProductsByBox.and.returnValue(of(mockPackedProducts));
      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of([]));

      component['onBoxChange']('BOX-001');

      expect(packServiceSpy.getBoxById).toHaveBeenCalledWith('BOX-001');
      expect(component['selectedBox']()?.boxId).toBe('BOX-001');
    });

    it('should auto-populate from box pick slip when no pick slip selected (Flow B)', () => {
      component.selectedPickSlip.set(null);
      const boxWithPickSlip = { ...mockBox, pickSlipId: 'PA-001' };
      packServiceSpy.getBoxById.and.returnValue(of(boxWithPickSlip));
      packServiceSpy.getPickSlipById.and.returnValue(of(mockPickSlip));
      packServiceSpy.getPackedProductsByBox.and.returnValue(of([]));
      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of([]));
      packServiceSpy.getAvailableProducts.and.returnValue(of([]));

      component['onBoxChange']('BOX-001');

      expect(packServiceSpy.getPickSlipById).toHaveBeenCalledWith('PA-001');
    });

    it('should handle error loading box details', () => {
      packServiceSpy.getBoxById.and.returnValue(throwError(() => new Error('fail')));

      component['onBoxChange']('BOX-001');

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load box details');
    });

    it('should load previous volume when pick slip already selected', () => {
      component.selectedPickSlip.set(mockPickSlip);
      packServiceSpy.getBoxById.and.returnValue(of(mockBox));
      packServiceSpy.getPackedProductsByBox.and.returnValue(of(mockPackedProducts));
      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of([]));

      component['onBoxChange']('BOX-001');

      expect(packServiceSpy.getPackedProductsByPickSlip).toHaveBeenCalled();
    });
  });

  describe('onDirectBoxIdEntry', () => {
    it('should return early for empty or whitespace string', () => {
      packServiceSpy.getBoxById.calls.reset();

      component['onDirectBoxIdEntry']('');
      component['onDirectBoxIdEntry']('   ');

      expect(packServiceSpy.getBoxById).not.toHaveBeenCalled();
    });

    it('should call onBoxChange with trimmed boxId', () => {
      packServiceSpy.getBoxById.and.returnValue(of(mockBox));
      packServiceSpy.getPackedProductsByBox.and.returnValue(of([]));
      component.selectedPickSlip.set(mockPickSlip);
      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of([]));

      component['onDirectBoxIdEntry']('  BOX-001  ');

      expect(packServiceSpy.getBoxById).toHaveBeenCalledWith('BOX-001');
    });
  });

  describe('onProductTypeChange', () => {
    beforeEach(() => {
      component['productTypeOptions'].set([
        { productCode: 'RPL', description: 'Recovered Plasma Liquid' },
        { productCode: 'RPFF', description: 'Recovered Plasma Fresh Frozen' }
      ]);
      packServiceSpy.getAvailableProducts.and.returnValue(of([]));
    });

    it('should return early if product not found', () => {
      packServiceSpy.getAvailableProducts.calls.reset();

      component['onProductTypeChange']('INVALID');

      expect(packServiceSpy.getAvailableProducts).not.toHaveBeenCalled();
    });

    it('should update pick slip product code if pick slip exists', () => {
      component.selectedPickSlip.set(mockPickSlip);

      component['onProductTypeChange']('RPFF');

      expect(component['selectedPickSlip']()?.productCode).toBe('RPFF');
    });

    it('should load available products', () => {
      component['onProductTypeChange']('RPL');

      expect(packServiceSpy.getAvailableProducts).toHaveBeenCalledWith('RPL');
    });

    it('should load pick slips when customer and consignee are selected', () => {
      component['selectedCustomerId'] = 'C1';
      component['selectedConsigneeId'] = 'CO1';
      component['selectedProductType'] = 'RPL';
      packServiceSpy.queryPickSlips.and.returnValue(of({ data: [], totalCount: 0 }));

      component['onProductTypeChange']('RPL');

      expect(packServiceSpy.queryPickSlips).toHaveBeenCalled();
    });

    it('should not load pick slips when customer is not selected', () => {
      component['selectedCustomerId'] = '';
      component['selectedConsigneeId'] = '';
      packServiceSpy.queryPickSlips.calls.reset();

      component['onProductTypeChange']('RPL');

      expect(packServiceSpy.queryPickSlips).not.toHaveBeenCalled();
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      expect(component.f['productCode']).toBeDefined();
    });
  });

  describe('onTableRowAction', () => {
    it('should call onUnpackProduct on remove action', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onTableRowAction({ action: 'remove', row: mockPackedProducts[0] });

      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('onUnpackProduct - additional cases', () => {
    it('should return early if no box selected', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(null);
      dialogSpy.open.calls.reset();

      component.onUnpackProduct(mockPackedProducts[0]);

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return early if no pick slip selected', () => {
      component.selectedPickSlip.set(null);
      component.selectedBox.set(mockBox);
      dialogSpy.open.calls.reset();

      component.onUnpackProduct(mockPackedProducts[0]);

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should not unpack when dialog cancelled', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      packServiceSpy.unpackProduct.calls.reset();

      component.onUnpackProduct(mockPackedProducts[0]);

      expect(packServiceSpy.unpackProduct).not.toHaveBeenCalled();
    });
  });

  describe('onCloseBox', () => {
    it('should return early when no pick slip is selected', () => {
      component.selectedPickSlip.set(null);
      dialogSpy.open.calls.reset();

      component.onCloseBox();

      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open new box dialog and create box on action new', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component['selectedProductType'] = 'RPL';
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ action: 'new', maxCapacity: 50 }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const newBox = { ...mockBox, boxId: 'BOX-NEW' };
      packServiceSpy.createBox.and.returnValue(of({ boxId: 'BOX-NEW' }));
      packServiceSpy.getBoxById.and.returnValue(of(newBox));
      packServiceSpy.getBoxesByPickSlip.and.returnValue(of([newBox]));

      component.onCloseBox();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(packServiceSpy.createBox).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New box BOX-NEW created');
    });

    it('should not create box when dialog is dismissed without new action', () => {
      component.selectedPickSlip.set(mockPickSlip);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      packServiceSpy.createBox.calls.reset();

      component.onCloseBox();

      expect(packServiceSpy.createBox).not.toHaveBeenCalled();
    });

    it('should handle error creating new box', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component['selectedProductType'] = 'RPL';
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ action: 'new', maxCapacity: 50 }));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      packServiceSpy.createBox.and.returnValue(throwError(() => new Error('fail')));

      component.onCloseBox();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create new box');
    });
  });

  describe('promptCloseBox', () => {
    it('should open close box dialog and call onCloseBox when result says closeCurrentBox', () => {
      component.selectedBox.set(mockBox);
      component['packedProducts'].set(mockPackedProducts);
      component.selectedPickSlip.set(mockPickSlip);

      const closeDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      closeDialogRefSpy.afterClosed.and.returnValue(of({ closeCurrentBox: true }));

      const newBoxDialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      newBoxDialogRefSpy.afterClosed.and.returnValue(of(null));

      dialogSpy.open.and.returnValues(closeDialogRefSpy, newBoxDialogRefSpy);

      (component as any).promptCloseBox();

      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should do nothing when close box dialog returns null', () => {
      component.selectedBox.set(mockBox);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      packServiceSpy.createBox.calls.reset();

      (component as any).promptCloseBox();

      expect(packServiceSpy.createBox).not.toHaveBeenCalled();
    });
  });

  describe('clearAll', () => {
    it('should reset all state to initial values', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);
      component['packedProducts'].set(mockPackedProducts);
      component['selectedCustomerId'] = 'C1';
      component['selectedBoxId'] = 'B1';
      component['selectedProductType'] = 'RPL';
      component['selectedConsigneeId'] = 'CO1';
      component['selectedOrderNo'] = 'ORD1';
      component['productDetail'].set({ dinNumber: 'D1', productCode: 'RPL' });
      component['labelCtrl'].setValue('Mf');
      component['previousVolume'].set(100);
      component['submitted'].set(true);

      (component as any).clearAll();

      expect(component.selectedPickSlip()).toBeNull();
      expect(component.selectedBox()).toBeNull();
      expect(component['packedProducts']().length).toBe(0);
      expect(component['selectedCustomerId']).toBe('');
      expect(component['selectedBoxId']).toBe('');
      expect(component['selectedProductType']).toBe('');
      expect(component['selectedConsigneeId']).toBe('');
      expect(component['selectedOrderNo']).toBe('');
      expect(component['productDetail']()).toBeNull();
      expect(component['labelCtrl'].value).toBe('');
      expect(component['previousVolume']()).toBe(0);
      expect(component['submitted']()).toBeFalse();
    });
  });

  describe('setupDropdownSearch', () => {
    it('should filter customer options by search term', () => {
      component['customerOptions'].set([
        { customerId: 'C1', customerName: 'Alpha Hospital', consigneeId: 'CO1', consigneeName: 'Lab A' },
        { customerId: 'C2', customerName: 'Beta Hospital', consigneeId: 'CO2', consigneeName: 'Lab B' }
      ]);

      component['customerSearchCtrl'].setValue('alpha');

      expect(component['filteredCustomerOptions']().length).toBe(1);
      expect(component['filteredCustomerOptions']()[0].customerId).toBe('C1');
    });

    it('should reset customer filter when search term is empty', () => {
      component['customerOptions'].set([
        { customerId: 'C1', customerName: 'Alpha', consigneeId: 'CO1', consigneeName: 'Lab A' },
        { customerId: 'C2', customerName: 'Beta', consigneeId: 'CO2', consigneeName: 'Lab B' }
      ]);

      component['customerSearchCtrl'].setValue('');

      expect(component['filteredCustomerOptions']().length).toBe(2);
    });

    it('should filter box options by search term', () => {
      component['boxOptions'].set([
        { ...mockBox, boxId: 'BOX-001' },
        { ...mockBox, boxId: 'BOX-002' }
      ]);

      component['boxSearchCtrl'].setValue('002');

      expect(component['filteredBoxOptions']().length).toBe(1);
      expect(component['filteredBoxOptions']()[0].boxId).toBe('BOX-002');
    });

    it('should reset box filter when search term is empty', () => {
      component['boxOptions'].set([
        { ...mockBox, boxId: 'BOX-001' },
        { ...mockBox, boxId: 'BOX-002' }
      ]);

      component['boxSearchCtrl'].setValue('');

      expect(component['filteredBoxOptions']().length).toBe(2);
    });

    it('should filter product code options by search term', () => {
      component['productCodeOptions'].set([
        { productCode: 'RPL', description: 'Recovered Plasma Liquid' },
        { productCode: 'RPFF', description: 'Fresh Frozen' }
      ]);

      component['productCodeSearchCtrl'].setValue('frozen');

      expect(component['filteredProductCodeOptions']().length).toBe(1);
      expect(component['filteredProductCodeOptions']()[0].productCode).toBe('RPFF');
    });

    it('should reset product code filter when search term is empty', () => {
      component['productCodeOptions'].set([
        { productCode: 'RPL', description: 'Recovered Plasma Liquid' },
        { productCode: 'RPFF', description: 'Fresh Frozen' }
      ]);

      component['productCodeSearchCtrl'].setValue('');

      expect(component['filteredProductCodeOptions']().length).toBe(2);
    });
  });

  describe('onUpdatePack', () => {
    beforeEach(() => {
      (packServiceSpy as any).getProductByDin = jasmine.createSpy('getProductByDin').and.returnValue(of({ dinNumber: 'D1', productCode: 'RPL' }));
    });

    it('should return early when unitIdField is invalid', () => {
      component['unitIdField'] = { isValid: false, focus: jasmine.createSpy('focus') } as any;
      packServiceSpy.packProduct.calls.reset();

      component.onUpdatePack();

      expect(component['submitted']()).toBeTrue();
      expect(component['unitIdField']?.focus).toHaveBeenCalled();
      expect(packServiceSpy.packProduct).not.toHaveBeenCalled();
    });

    it('should return early when form is invalid', () => {
      component['unitIdField'] = { isValid: true, focus: jasmine.createSpy('focus'), parsedUnitId: 'DIN1', parsedUnitData: {} } as any;
      component.productForm.patchValue({ productCode: '' }, { emitEvent: false });
      packServiceSpy.packProduct.calls.reset();

      component.onUpdatePack();

      expect(component['submitted']()).toBeTrue();
      expect(packServiceSpy.packProduct).not.toHaveBeenCalled();
    });

    it('should return early when customer or product type not selected', () => {
      component['unitIdField'] = { isValid: true, focus: jasmine.createSpy('focus'), parsedUnitId: 'DIN1', parsedUnitData: {} } as any;
      component.productForm.patchValue({ productCode: 'RPL' }, { emitEvent: false });
      component['selectedCustomerId'] = '';
      component['selectedProductType'] = '';
      packServiceSpy.packProduct.calls.reset();

      component.onUpdatePack();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Customer and product type must be selected');
      expect(packServiceSpy.packProduct).not.toHaveBeenCalled();
    });

    it('should pack product successfully when not at capacity', fakeAsync(() => {
      component['unitIdField'] = {
        isValid: true,
        focus: jasmine.createSpy('focus'),
        clear: jasmine.createSpy('clear'),
        parsedUnitId: 'DIN1',
        parsedUnitData: { codeScheme: 'I' }
      } as any;
      component.productForm.patchValue({ productCode: 'RPL' }, { emitEvent: false });
      component['selectedCustomerId'] = 'C1';
      component['selectedProductType'] = 'RPL';
      component['selectedConsigneeId'] = 'CO1';
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);

      const packResponse: PackProductResponseDto = {
        dinNumber: 'DIN1',
        boxId: 'BOX-001',
        currentCount: 36,
        remainingCapacity: 14
      };
      packServiceSpy.packProduct.and.returnValue(of(packResponse));
      packServiceSpy.getPackedProductsByBox.and.returnValue(of(mockPackedProducts));

      component.onUpdatePack();
      tick(200);

      expect(packServiceSpy.packProduct).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product packed successfully');
      expect(component['packingProduct']()).toBeFalse();
    }), 15000);

    it('should clear all when box reaches capacity after packing', fakeAsync(() => {
      component['unitIdField'] = {
        isValid: true,
        focus: jasmine.createSpy('focus'),
        clear: jasmine.createSpy('clear'),
        parsedUnitId: 'DIN1',
        parsedUnitData: { codeScheme: 'I' }
      } as any;
      component.productForm.patchValue({ productCode: 'RPL' }, { emitEvent: false });
      component['selectedCustomerId'] = 'C1';
      component['selectedProductType'] = 'RPL';
      component['selectedConsigneeId'] = 'CO1';
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);

      const packResponse: PackProductResponseDto = {
        dinNumber: 'DIN1',
        boxId: 'BOX-001',
        currentCount: 50,
        remainingCapacity: 0
      };
      packServiceSpy.packProduct.and.returnValue(of(packResponse));

      component.onUpdatePack();
      tick(200);

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Maximum Capacity Reached. Box closed.');
    }), 15000);

    it('should handle pack error', fakeAsync(() => {
      component['unitIdField'] = {
        isValid: true,
        focus: jasmine.createSpy('focus'),
        clear: jasmine.createSpy('clear'),
        parsedUnitId: 'DIN1',
        parsedUnitData: { codeScheme: 'I' }
      } as any;
      component.productForm.patchValue({ productCode: 'RPL' }, { emitEvent: false });
      component['selectedCustomerId'] = 'C1';
      component['selectedProductType'] = 'RPL';
      component['selectedConsigneeId'] = 'CO1';
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);

      packServiceSpy.packProduct.and.returnValue(throwError(() => new Error('pack failed')));

      component.onUpdatePack();
      tick(200);

      expect(component['packingProduct']()).toBeFalse();
    }), 15000);
  });

  describe('ensurePickSlipExists', () => {
    it('should return existing pick slip when it has an id', () => {
      component.selectedPickSlip.set(mockPickSlip);
      let result: any;

      (component as any).ensurePickSlipExists().subscribe((ps: any) => result = ps);

      expect(result.pickSlipId).toBe('PA-001');
      expect(packServiceSpy.createPickSlip).not.toHaveBeenCalled();
    });

    it('should create new pick slip when none exists', () => {
      component.selectedPickSlip.set(null);
      component['selectedOrderNo'] = 'ORD1';
      component['selectedCustomerId'] = 'C1';
      component['selectedConsigneeId'] = 'CO1';
      component['selectedProductType'] = 'RPL';

      packServiceSpy.createPickSlip.and.returnValue(of({ pickSlipId: 'PA-NEW' }));
      const newPickSlip = { ...mockPickSlip, pickSlipId: 'PA-NEW' };
      packServiceSpy.getPickSlipById.and.returnValue(of(newPickSlip));

      let result: any;
      (component as any).ensurePickSlipExists().subscribe((ps: any) => result = ps);

      expect(packServiceSpy.createPickSlip).toHaveBeenCalled();
      expect(result.pickSlipId).toBe('PA-NEW');
      expect(component['selectedPickSlip']()?.pickSlipId).toBe('PA-NEW');
    });
  });

  describe('ensureBoxExists', () => {
    it('should return existing box when it has an id', () => {
      component.selectedBox.set(mockBox);
      let result: any;

      (component as any).ensureBoxExists('PA-001').subscribe((b: any) => result = b);

      expect(result.boxId).toBe('BOX-001');
      expect(packServiceSpy.createBox).not.toHaveBeenCalled();
    });

    it('should create new box when none exists', () => {
      component.selectedBox.set(null);
      component['selectedProductType'] = 'RPL';

      packServiceSpy.createBox.and.returnValue(of({ boxId: 'BOX-NEW' }));
      const newBox = { ...mockBox, boxId: 'BOX-NEW' };
      packServiceSpy.getBoxById.and.returnValue(of(newBox));

      let result: any;
      (component as any).ensureBoxExists('PA-001').subscribe((b: any) => result = b);

      expect(packServiceSpy.createBox).toHaveBeenCalled();
      expect(result.boxId).toBe('BOX-NEW');
      expect(component['selectedBox']()?.boxId).toBe('BOX-NEW');
      expect(component['selectedBoxId']).toBe('BOX-NEW');
    });
  });

  describe('selectPickSlip', () => {
    it('should set pick slip and load boxes and previous volume', () => {
      packServiceSpy.getBoxesByPickSlip.and.returnValue(of([]));
      packServiceSpy.getPackedProductsByPickSlip.and.returnValue(of([]));

      (component as any).selectPickSlip(mockPickSlip);

      expect(component['selectedPickSlip']()?.pickSlipId).toBe('PA-001');
      expect(component['selectedOrderNo']).toBe('ORD-001');
      expect(packServiceSpy.getBoxesByPickSlip).toHaveBeenCalledWith('PA-001');
      expect(packServiceSpy.getPackedProductsByPickSlip).toHaveBeenCalledWith('PA-001');
    });
  });

  describe('Computed Properties', () => {
    it('should compute numberOfProducts based on packed products length', () => {
      component['packedProducts'].set([]);
      expect(component['numberOfProducts']()).toBe(0);

      component['packedProducts'].set(mockPackedProducts);
      expect(component['numberOfProducts']()).toBe(1);
    });

    it('should compute hasPickSlip correctly', () => {
      component.selectedPickSlip.set(null);
      expect(component['hasPickSlip']()).toBeFalse();

      component.selectedPickSlip.set(mockPickSlip);
      expect(component['hasPickSlip']()).toBeTrue();
    });

    it('should compute hasBox correctly', () => {
      component.selectedBox.set(null);
      expect(component['hasBox']()).toBeFalse();

      component.selectedBox.set(mockBox);
      expect(component['hasBox']()).toBeTrue();
    });

    it('should compute canPack based on pickSlip, box, packing state, and capacity', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set(mockBox);
      component['packingProduct'].set(false);

      expect(component.canPack()).toBeTrue();
    });

    it('should compute canPack as false when box is at capacity', () => {
      component.selectedPickSlip.set(mockPickSlip);
      component.selectedBox.set({ ...mockBox, isAtCapacity: true });
      component['packingProduct'].set(false);

      expect(component.canPack()).toBeFalse();
    });

    it('should compute volume summary with previous volume', () => {
      component['previousVolume'].set(500);
      component['packedProducts'].set([
        { ...mockPackedProducts[0], componentVolume: 200 }
      ]);

      const summary = component.volumeSummary();
      expect(summary.previousVolume).toBe(500);
      expect(summary.currentVolume).toBe(200);
      expect(summary.totalVolume).toBe(700);
    });
  });

  describe('onCancel - additional', () => {
    it('should reset form and clear product detail', () => {
      component.productForm.patchValue({ productCode: 'RPL' }, { emitEvent: false });
      component['productDetail'].set({ dinNumber: 'D1', productCode: 'RPL' });
      component['labelCtrl'].setValue('Mf');

      component.onCancel();

      expect(component['productDetail']()).toBeNull();
      expect(component['labelCtrl'].value).toBe('');
    });
  });

  describe('elementId helpers', () => {
    it('should generate element IDs with component prefix', () => {
      const elId = component['elementId']('test');
      expect(elId).toContain('pack-recovered-plasma-');
      expect(elId).toContain('-test');
    });

    it('should generate error IDs with component prefix', () => {
      const errId = component['errorId']('field');
      expect(errId).toContain('-field-error');
    });

    it('should generate label IDs with component prefix', () => {
      const lblId = component['labelId']('input');
      expect(lblId).toContain('-input-label');
    });
  });

  describe('onUpdatePack with lazy creation', () => {
    beforeEach(() => {
      (packServiceSpy as any).getProductByDin = jasmine.createSpy('getProductByDin').and.returnValue(of({ dinNumber: 'D1', productCode: 'RPL' }));
    });

    it('should create pick slip and box lazily when none exist', fakeAsync(() => {
      component['unitIdField'] = {
        isValid: true,
        focus: jasmine.createSpy('focus'),
        clear: jasmine.createSpy('clear'),
        parsedUnitId: 'DIN1',
        parsedUnitData: { codeScheme: 'E' }
      } as any;
      component.productForm.patchValue({ productCode: 'RPL' }, { emitEvent: false });
      component['selectedCustomerId'] = 'C1';
      component['selectedProductType'] = 'RPL';
      component['selectedConsigneeId'] = 'CO1';
      component.selectedPickSlip.set(null);
      component.selectedBox.set(null);

      packServiceSpy.createPickSlip.and.returnValue(of({ pickSlipId: 'PA-NEW' }));
      packServiceSpy.getPickSlipById.and.returnValue(of({ ...mockPickSlip, pickSlipId: 'PA-NEW' }));
      packServiceSpy.createBox.and.returnValue(of({ boxId: 'BOX-NEW' }));
      packServiceSpy.getBoxById.and.returnValue(of({ ...mockBox, boxId: 'BOX-NEW' }));
      const packResponse: PackProductResponseDto = {
        dinNumber: 'DIN1',
        boxId: 'BOX-NEW',
        currentCount: 1,
        remainingCapacity: 49
      };
      packServiceSpy.packProduct.and.returnValue(of(packResponse));
      packServiceSpy.getPackedProductsByBox.and.returnValue(of([]));

      component.onUpdatePack();
      tick(200);

      expect(packServiceSpy.createPickSlip).toHaveBeenCalled();
      expect(packServiceSpy.createBox).toHaveBeenCalled();
      expect(packServiceSpy.packProduct).toHaveBeenCalled();
    }), 15000);
  });
});
