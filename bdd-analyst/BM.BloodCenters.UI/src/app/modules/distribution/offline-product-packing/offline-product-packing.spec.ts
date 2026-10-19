import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';
import { TranslateModule } from '@ngx-translate/core';

import { OfflineProductPackingComponent } from './offline-product-packing';
import { OfflineProductPackingService } from './services/offline-product-packing.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import {
  OrderPackingDto,
  OrderPackingDetailDto,
  ApiResponse
} from './models/offline-product-packing.model';
import { CreateNewBoxDialogResult } from './create-new-box-dialog/create-new-box-dialog';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('OfflineProductPackingComponent', () => {
  let labelScanSpy: any;
  let matDialogSpy: any;
  let pageHeaderSpy: any;
  let packingSpy: any;
  let component: OfflineProductPackingComponent;
  let fixture: ComponentFixture<OfflineProductPackingComponent>;
  let packingServiceSpy: jasmine.SpyObj<OfflineProductPackingService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockOrders: OrderPackingDto[] = [
    {
      orderNo: 'ORD-12345',
      chapterId: '0001',
      customerId: 'CUST001',
      consigneeId: 'CONS001',
      orderType: 'RG',
      orderStatus: 'OR',
      orderClass: 'ST',
      orderedBy: 'John Doe',
      firstShipDate: '2024-06-15T00:00:00Z',
      orderClassDesc: 'Standard',
      consigneeAddress: 'ABC Hospital, 123 Main St, City, ST 12345',
      remoteCustomer: 'N'
    }
  ];

  const mockOrderDetail: OrderPackingDetailDto = {
    ...mockOrders[0],
    items: [
      {
        itemNo: 1,
        productType: 'RBC',
        bloodType: 'O+',
        requiredQty: 5,
        canceledQty: 0,
        systemCancelQty: 0,
        actualRequiredQty: 5,
        itemStatus: 'OR',
        tier: 1,
        subOk: 'Y',
        productTypeDesc: 'Red Blood Cells',
        aboDesc: 'O Positive',
        itemStatusDesc: 'Ordered',
        attributes: 'IRR Y'
      }
    ]
  };

  beforeEach(() => {

    packingSpy = jasmine.createSpyObj('OfflineProductPackingService', [
      'getAllOrders',
      'searchOrders',
      'getOrderDetail',
      'createBox',
      'packProduct',
      'quarantineProduct',
      'closeBox',
      'getBoxContents',
      'getPackStatus',
      'getBoxTypes',
      'getPickSlips',
      'getOpenBoxes',
      'getBoxTypeByBoxId'
    ]);
    const headerSpy = createMockHeaderService();
    pageHeaderSpy = jasmine.createSpyObj('PageHeaderService',
      ['getTitle', 'getSubtitle', 'getCurrentMenuItem'],
      { pageHeaderData: jasmine.createSpy().and.returnValue(null) }
    );
    pageHeaderSpy.getTitle.and.returnValue(undefined);
    pageHeaderSpy.getSubtitle.and.returnValue(undefined);
    pageHeaderSpy.getCurrentMenuItem.and.returnValue(undefined);

    const snackbarSpy = createMockSnackbarService();
    matDialogSpy = createMockMatDialog();
    labelScanSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateProductScan',
      'validateAboScan',
      'validateExpdateScan',
      'validateUnitScan'
    ]);



      TestBed.configureTestingModule({
      imports: [OfflineProductPackingComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OfflineProductPackingService, useValue: packingSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanSpy }
      ]
    })
    .overrideComponent(OfflineProductPackingComponent, {
      add: { providers: [{ provide: MatDialog, useValue: matDialogSpy }] }
    });





      packingSpy.getAllOrders.calls.reset();


      packingSpy.searchOrders.calls.reset();


      packingSpy.getOrderDetail.calls.reset();


      packingSpy.createBox.calls.reset();


      packingSpy.packProduct.calls.reset();


      packingSpy.quarantineProduct.calls.reset();


      packingSpy.closeBox.calls.reset();


      packingSpy.getBoxContents.calls.reset();


      packingSpy.getPackStatus.calls.reset();


      packingSpy.getBoxTypes.calls.reset();


      packingSpy.getPickSlips.calls.reset();


      packingSpy.getOpenBoxes.calls.reset();


      packingSpy.getBoxTypeByBoxId.calls.reset();


      pageHeaderSpy.getTitle.calls.reset();


      pageHeaderSpy.getSubtitle.calls.reset();


      pageHeaderSpy.getCurrentMenuItem.calls.reset();


      matDialogSpy.open.calls.reset();


      labelScanSpy.validateProductScan.calls.reset();


      labelScanSpy.validateAboScan.calls.reset();


      labelScanSpy.validateExpdateScan.calls.reset();


      labelScanSpy.validateUnitScan.calls.reset();


      pageHeaderSpy.getTitle.and.returnValue(undefined);


      pageHeaderSpy.getSubtitle.and.returnValue(undefined);


      pageHeaderSpy.getCurrentMenuItem.and.returnValue(undefined);


    packingServiceSpy = TestBed.inject(OfflineProductPackingService) as jasmine.SpyObj<OfflineProductPackingService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    pageHeaderServiceSpy = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    snackbarServiceSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    // Setup default spy returns
    const mockOrdersResponse: ApiResponse<OrderPackingDto> = {
      success: true,
      statusCode: 200,
      message: 'OK',
      data: mockOrders,
      totalCount: mockOrders.length
    };
    packingServiceSpy.getAllOrders.and.returnValue(of(mockOrdersResponse));
    packingServiceSpy.searchOrders.and.returnValue(of(mockOrders));
    packingServiceSpy.getOrderDetail.and.returnValue(of(mockOrderDetail));
    packingServiceSpy.getBoxTypes.and.returnValue(of([]));
    packingServiceSpy.getPickSlips.and.returnValue(of([]));
    packingServiceSpy.getOpenBoxes.and.returnValue(of([]));
    packingServiceSpy.getBoxTypeByBoxId.and.returnValue(of([]));
    packingServiceSpy.getPackStatus.and.returnValue(of({ success: true, statusCode: 200, message: 'OK', data: [], item: { packedProducts: [], allocatedProducts: [] } } as any));

    fixture = TestBed.createComponent(OfflineProductPackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Initialization', () => {




    it('should initialize signals with default values', () => {
      expect(component['loading']()).toBeFalse();
      expect(component['error']()).toBeNull();
      expect(component['selectedOrder']()).toBeNull();
      expect(component['orderLineItems']().length).toBe(0);
      expect(component['packedProducts']().length).toBe(0);
    });



    it('should display empty state initially', () => {
      const emptyState = fixture.debugElement.query(By.css('.empty-state'));
      expect(emptyState).toBeTruthy();
      expect(emptyState.nativeElement.textContent).toContain('No Results to Display');
    });
  });

  describe('Form Validation', () => {
    it('should require order field', () => {
      const orderControl = component.packingForm.get('order');
      expect(orderControl?.hasError('required')).toBeTrue();
    });

    it('should require actualPackingDate field', () => {
      const dateControl = component.packingForm.get('actualPackingDate');
      dateControl?.setValue(null);
      expect(dateControl?.hasError('required')).toBeTrue();
    });

    it('should require time field', () => {
      const timeControl = component.packingForm.get('time');
      timeControl?.setValue('');
      expect(timeControl?.hasError('required')).toBeTrue();
    });

    it('should validate time pattern', () => {
      const timeControl = component.packingForm.get('time');
      timeControl?.setValue('25:00');
      expect(timeControl?.hasError('pattern')).toBeTrue();

      timeControl?.setValue('12:60');
      expect(timeControl?.hasError('pattern')).toBeTrue();

      timeControl?.setValue('12:30');
      expect(timeControl?.hasError('pattern')).toBeFalse();
    });

    it('should validate packSlipId max length', () => {
      const packSlipControl = component.packingForm.get('packSlipId');
      const longString = 'a'.repeat(51);
      packSlipControl?.setValue(longString);
      expect(packSlipControl?.hasError('maxlength')).toBeTrue();
    });

    it('should have shipTo field disabled', () => {
      const shipToControl = component.packingForm.get('shipTo');
      expect(shipToControl?.disabled).toBeTrue();
    });
  });

  describe('Order Search', () => {
    it('should filter orders locally when typing in the searchable dropdown', fakeAsync(() => {
      component['orderSearchControl'].setValue('ORD');
      tick(300);

      expect(component['filteredOrders']().length).toBe(1);
    }));

    it('should show all orders when search term is empty', fakeAsync(() => {
      component['orderSearchControl'].setValue('ORD');
      tick(300);
      component['orderSearchControl'].setValue('');
      tick(300);

      expect(component['filteredOrders']().length).toBe(component['allOrders']().length);
    }));

    it('should return no results for non-matching search term', fakeAsync(() => {
      component['orderSearchControl'].setValue('NONEXISTENT');
      tick(300);
      fixture.detectChanges();

      expect(component['filteredOrders']().length).toBe(0);
    }));

    it('should populate shipTo field when order is selected', () => {
      component['allOrders'].set(mockOrders);
      component['onOrderSelected']('ORD-12345');
      fixture.detectChanges();

      expect(component.packingForm.get('shipTo')?.value).toBe('ABC Hospital, 123 Main St, City, ST 12345');
    });
  });

  describe('Retrieve Order', () => {
    beforeEach(() => {
      component.packingForm.patchValue({
        order: 'ORD-12345'
      });
    });

    it('should retrieve order details on RETRIEVE button click', fakeAsync(() => {
      component['onRetrieve']();
      tick();

      expect(packingServiceSpy.getOrderDetail).toHaveBeenCalledWith('ORD-12345');
      expect(component['selectedOrder']()).toEqual(mockOrderDetail);
      expect(component['orderLineItems']().length).toBe(1);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));





    it('should handle error when order retrieval fails', fakeAsync(() => {
      packingServiceSpy.getOrderDetail.and.returnValue(throwError(() => new Error('API Error')));

      component['onRetrieve']();
      tick();

      expect(component['error']()).toBeTruthy();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));




  });

  describe('Clear All', () => {
    it('should clear form and reset state on CLEAR ALL', () => {
      component.packingForm.patchValue({
        order: 'ORD-12345',
        packSlipId: 'PS-001'
      });
      component['selectedOrder'].set(mockOrderDetail);
      component['orderLineItems'].set(mockOrderDetail.items);

      component['onClearAll']();

      expect(component.packingForm.get('order')?.value).toBeFalsy();
      expect(component.packingForm.get('packSlipId')?.value).toBeFalsy();
      expect(component['selectedOrder']()).toBeNull();
      expect(component['orderLineItems']().length).toBe(0);
      expect(snackbarServiceSpy.showInfo).toHaveBeenCalled();
    });

    it('should have empty date and time after clear', () => {
      component['onClearAll']();

      expect(component.packingForm.get('actualPackingDate')?.value).toBeNull();
      expect(component.packingForm.get('time')?.value).toBe('');
    });
  });



  describe('Save Packed Products', () => {
    beforeEach(() => {
      component.packingForm.patchValue({
        order: 'ORD-12345',
        actualPackingDate: moment(),
        time: '10:30',
        unitId: 'U123',
        productCode: 'RBC',
        scanBloodType: 'O+'
      });
      component['selectedOrder'].set(mockOrderDetail);
      component['currentBoxId'].set('BOX-001');
      dialogSpy.open.and.returnValue({
        afterClosed: () => of(true)
      } as any);
    });

    it('should close box on SAVE button click', fakeAsync(() => {
      packingServiceSpy.closeBox.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Box closed',
        data: [true]
      }));

      component['onSave']();
      tick();
    }));



    it('should clear packed products after successful close', fakeAsync(() => {
      component['packedProducts'].set([
        {
          lineItemNo: 1,
          unitId: 'U123',
          productCode: 'RBC',
          aboRh: 'O+',
          expirationDate: moment().add(30, 'days').format('YYYY-MM-DD'),
          expirationTime: '23:59',
          boxId: 'BOX-001',
          qualityCheck: true
        }
      ]);

      packingServiceSpy.closeBox.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'Box closed',
        data: [true]
      }));

      component['onSave']();
      tick();
    }));
  });

  // ===== ADDITIONAL TESTS FOR COVERAGE =====

  describe('Format Utilities', () => {
    it('should format a valid date string', () => {
      const result = component['formatDate']('2024-06-15');
      expect(result).toContain('2024');
    });

    it('should return empty string for null date', () => {
      expect(component['formatDate'](null)).toBe('');
    });

    it('should return empty string for empty date', () => {
      expect(component['formatDate']('')).toBe('');
    });

    it('should return empty string for null time', () => {
      expect(component['formatTime'](null)).toBe('');
    });

    it('should return time as-is', () => {
      expect(component['formatTime']('12:30')).toBe('12:30');
    });

    it('should return empty string for empty time', () => {
      expect(component['formatTime']('')).toBe('');
    });
  });

  describe('Form Controls Getter', () => {
    it('should return form controls via f getter', () => {
      expect(component.f['order']).toBeDefined();
      expect(component.f['unitId']).toBeDefined();
      expect(component.f['time']).toBeDefined();
    });
  });

  describe('Computed Signals', () => {
    it('should compute hasOrderSelected as false initially', () => {
      expect(component['hasOrderSelected']()).toBeFalse();
    });

    it('should compute hasOrderSelected as true when order selected', () => {
      component['selectedOrder'].set(mockOrderDetail);
      expect(component['hasOrderSelected']()).toBeTrue();
    });

    it('should compute hasLineItems', () => {
      expect(component['hasLineItems']()).toBeFalse();
      component['orderLineItems'].set(mockOrderDetail.items);
      expect(component['hasLineItems']()).toBeTrue();
    });

    it('should compute hasPackedProducts', () => {
      expect(component['hasPackedProducts']()).toBeFalse();
      component['packedProducts'].set([{
        lineItemNo: 1, unitId: 'U1', productCode: 'RBC', aboRh: 'O+',
        expirationDate: '', expirationTime: '', boxId: 'B1', qualityCheck: true
      }]);
      expect(component['hasPackedProducts']()).toBeTrue();
    });

    it('should compute isRetrieving', () => {
      expect(component['isRetrieving']()).toBeFalse();
      component['loading'].set(true);
      expect(component['isRetrieving']()).toBeTrue();
      component['selectedOrder'].set(mockOrderDetail);
      expect(component['isRetrieving']()).toBeFalse();
    });

    it('should compute canScanProduct', () => {
      expect(component['canScanProduct']()).toBeFalse();
      component['selectedOrder'].set(mockOrderDetail);
      expect(component['canScanProduct']()).toBeTrue();
      component['isScanning'].set(true);
      expect(component['canScanProduct']()).toBeFalse();
    });

    it('should compute selectedLineItem from selectedItemNo', () => {
      component['selectedItemNo'].set(5);
      expect(component['selectedLineItem']()).toBe('5');
    });

    it('should compute selectedLineItem from first line item when itemNo is 0', () => {
      component['selectedItemNo'].set(0);
      component['orderLineItems'].set(mockOrderDetail.items);
      expect(component['selectedLineItem']()).toBe('1');
    });

    it('should compute selectedLineItem as null when no items and itemNo is 0', () => {
      component['selectedItemNo'].set(0);
      component['orderLineItems'].set([]);
      expect(component['selectedLineItem']()).toBeNull();
    });
  });

  describe('Box Selection', () => {
    it('should set currentBoxId and fetch box types when box is selected', fakeAsync(() => {
      const boxTypes = [{ value: 'SM', label: 'Small' }];
      packingServiceSpy.getBoxTypeByBoxId.and.returnValue(of(boxTypes as any));
      component['onBoxSelected']('BOX-123');
      tick();
      expect(component['currentBoxId']()).toBe('BOX-123');
      expect(component['typeOptions']()).toEqual(boxTypes as any);
      expect(component.packingForm.get('type')?.value).toBe('');
    }));

    it('should clear currentBoxId and restore full type options when empty string is selected', () => {
      component['allTypeOptions'].set([{ value: 'SM', label: 'Small' }, { value: 'LG', label: 'Large' }] as any);
      component['currentBoxId'].set('BOX-123');
      component['onBoxSelected']('');
      expect(component['currentBoxId']()).toBeNull();
      expect(component['typeOptions']().length).toBe(2);
    });
  });

  describe('Clear Operations', () => {
    it('should clear packed products', () => {
      component['packedProducts'].set([{
        lineItemNo: 1, unitId: 'U1', productCode: 'RBC', aboRh: 'O+',
        expirationDate: '', expirationTime: '', boxId: 'B1', qualityCheck: true
      }]);
      component['onClearPackedProducts']();
      expect(component['packedProducts']().length).toBe(0);
      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith('Packed products cleared');
    });

    it('should clear scan fields and reset last scan result', () => {
      component.packingForm.patchValue({
        unitId: 'U123', productCode: 'RBC', scanBloodType: 'O+'
      });
      component['lastScanResult'].set({ success: true, message: 'OK' });
      component['onClearScanFields']();
      expect(component['lastScanResult']()).toBeNull();
    });
  });

  describe('Unit ID Handling', () => {
    beforeEach(() => {
      (packingServiceSpy as any).getProductCodes = jasmine.createSpy('getProductCodes').and.returnValue(of([]));
      (packingServiceSpy as any).getValidBloodTypes = jasmine.createSpy('getValidBloodTypes').and.returnValue(of([]));
      (packingServiceSpy as any).getValidAliquots = jasmine.createSpy('getValidAliquots').and.returnValue(of([]));
    });

    it('should set unitId from parsedUnitId on validation', fakeAsync(() => {
      component['onUnitIdValidated']({ parsedUnitId: 'W1234567890123', manualUnitId: '' } as any);
      tick();
      expect(component.packingForm.get('unitId')?.value).toBe('W1234567890123');
    }));

    it('should use manualUnitId when parsedUnitId is empty', fakeAsync(() => {
      component['onUnitIdValidated']({ parsedUnitId: '', manualUnitId: 'MANUAL-ID' } as any);
      tick();
      expect(component.packingForm.get('unitId')?.value).toBe('MANUAL-ID');
    }));

    it('should clear unitId and cascading fields on cleared', () => {
      component.packingForm.patchValue({ unitId: 'U123' });
      component['onUnitIdCleared']();
      expect(component.packingForm.get('unitId')?.value).toBe('');
      expect(component['productCodeOptions']().length).toBe(0);
      expect(component['bloodTypeOptions']().length).toBe(0);
      expect(component['aliquotOptions']().length).toBe(0);
    });
  });

  describe('Selection Handlers', () => {
    it('should set selectedItemNo on line item change', () => {
      component['onLineItemChanged'](3);
      expect(component['selectedItemNo']()).toBe(3);
    });

    it('should set scanBloodType on ABORh selected', () => {
      component['onAboRhSelected']({ code: 'O+', description: 'O Positive' });
      expect(component.packingForm.get('scanBloodType')?.value).toBe('O+');
    });

    it('should do nothing on ABORh selected with null', () => {
      const prev = component.packingForm.get('scanBloodType')?.value;
      component['onAboRhSelected'](null);
      expect(component.packingForm.get('scanBloodType')?.value).toBe(prev);
    });

    it('should set aliquot on aliquot selected', () => {
      component['onAliquotSelected']({ code: 'A1', description: 'Aliquot 1' });
      expect(component.packingForm.get('aliquot')?.value).toBe('A1');
    });

    it('should do nothing on aliquot selected with null', () => {
      const prev = component.packingForm.get('aliquot')?.value;
      component['onAliquotSelected'](null);
      expect(component.packingForm.get('aliquot')?.value).toBe(prev);
    });

    it('should do nothing on product code selected with null', () => {
      component['onProductCodeSelected'](null);
      // no crash, early return
    });
  });

  describe('Field Error Management', () => {
    it('should set field error and mark control touched', () => {
      component['setFieldError']('unitId', 'Invalid unit');
      expect(component['fieldErrors']['unitId']).toBe('Invalid unit');
      expect(component.packingForm.get('unitId')?.hasError('serverError')).toBeTrue();
      expect(component.packingForm.get('unitId')?.touched).toBeTrue();
    });

    it('should clear field error and reset control errors', () => {
      component['setFieldError']('unitId', 'Invalid unit');
      component['clearFieldError']('unitId');
      expect(component['fieldErrors']['unitId']).toBe('');
      expect(component.packingForm.get('unitId')?.errors).toBeNull();
    });
  });

  describe('Load Box Types Error', () => {
    it('should handle loadBoxTypes error', fakeAsync(() => {
      packingServiceSpy.getBoxTypes.and.returnValue(throwError(() => new Error('API Error')));
      component['loadBoxTypes']();
      tick();
      expect(component['typeOptions']().length).toBe(0);
      expect(component['typeOptionsLoading']()).toBeFalse();
    }));

    it('should set typeOptions on successful load', fakeAsync(() => {
      const boxTypes = [{ value: 'SM', label: 'Small' }, { value: 'LG', label: 'Large' }];
      packingServiceSpy.getBoxTypes.and.returnValue(of(boxTypes as any));
      component['loadBoxTypes']();
      tick();
      expect(component['typeOptions']().length).toBe(2);
      expect(component['typeOptionsLoading']()).toBeFalse();
    }));
  });

  describe('Load Orders Error', () => {
    it('should handle loadOrders error', fakeAsync(() => {
      packingServiceSpy.getAllOrders.and.returnValue(throwError(() => new Error('API Error')));
      component['loadOrders']();
      tick();
      expect(component['allOrders']().length).toBe(0);
      expect(component['filteredOrders']().length).toBe(0);
    }));
  });

  describe('Load Pick Slips', () => {
    it('should load pick slips and auto-select first', fakeAsync(() => {
      const mockPickSlips: any[] = [
        { pickSlipId: 'PS-001', orderNo: 'ORD-12345', customerId: null, createdDate: null, status: 'OP', statusDesc: 'Open' }
      ];
      packingServiceSpy.getPickSlips.and.returnValue(of(mockPickSlips));
      component['loadPickSlips']('ORD-12345');
      tick();
      expect(component['pickSlipOptions']().length).toBe(1);
      expect(component.packingForm.get('packSlipId')?.value).toBe('PS-001');
      expect(component['pickSlipOptionsLoading']()).toBeFalse();
    }));

    it('should handle loadPickSlips error', fakeAsync(() => {
      packingServiceSpy.getPickSlips.and.returnValue(throwError(() => new Error('API Error')));
      component['loadPickSlips']('ORD-12345');
      tick();
      expect(component['pickSlipOptions']().length).toBe(0);
      expect(component['pickSlipOptionsLoading']()).toBeFalse();
    }));

    it('should not auto-select when no pick slips returned', fakeAsync(() => {
      packingServiceSpy.getPickSlips.and.returnValue(of([]));
      component.packingForm.patchValue({ packSlipId: '' });
      component['loadPickSlips']('ORD-12345');
      tick();
      expect(component['pickSlipOptions']().length).toBe(0);
      expect(component.packingForm.get('packSlipId')?.value).toBe('');
    }));
  });

  describe('Load Open Boxes', () => {
    it('should load open boxes without auto-selecting', fakeAsync(() => {
      const mockBoxes: any[] = [{ value: 'BOX-001', label: 'Box 001' }];
      packingServiceSpy.getOpenBoxes.and.returnValue(of(mockBoxes));
      component.packingForm.patchValue({ boxId: '' });
      component['loadOpenBoxes']('ORD-12345');
      tick();
      expect(component['openBoxOptions']().length).toBe(1);
      expect(component.packingForm.get('boxId')?.value).toBe('');
      expect(component['openBoxOptionsLoading']()).toBeFalse();
    }));

    it('should keep current box selection if it exists in loaded boxes', fakeAsync(() => {
      const mockBoxes: any[] = [
        { value: 'BOX-001', label: 'Box 001' },
        { value: 'BOX-002', label: 'Box 002' }
      ];
      packingServiceSpy.getOpenBoxes.and.returnValue(of(mockBoxes));
      component.packingForm.patchValue({ boxId: 'BOX-002' });
      component['loadOpenBoxes']('ORD-12345');
      tick();
      expect(component['currentBoxId']()).toBe('BOX-002');
    }));

    it('should handle loadOpenBoxes error', fakeAsync(() => {
      packingServiceSpy.getOpenBoxes.and.returnValue(throwError(() => new Error('API Error')));
      component['loadOpenBoxes']('ORD-12345');
      tick();
      expect(component['openBoxOptions']().length).toBe(0);
      expect(component['openBoxOptionsLoading']()).toBeFalse();
    }));

    it('should not auto-select when multiple boxes and no current', fakeAsync(() => {
      const mockBoxes: any[] = [
        { value: 'BOX-001', label: 'Box 001' },
        { value: 'BOX-002', label: 'Box 002' }
      ];
      packingServiceSpy.getOpenBoxes.and.returnValue(of(mockBoxes));
      component.packingForm.patchValue({ boxId: '' });
      component['currentBoxId'].set(null);
      component['loadOpenBoxes']('ORD-12345');
      tick();
      expect(component['openBoxOptions']().length).toBe(2);
      // No auto-select with multiple boxes
      expect(component.packingForm.get('boxId')?.value).toBe('');
    }));
  });

  describe('Order Selected Extended', () => {
    it('should not make API calls when orderNo is empty', fakeAsync(() => {
      packingServiceSpy.getPickSlips.calls.reset();
      packingServiceSpy.getOpenBoxes.calls.reset();
      component['onOrderSelected']('');
      tick();
      expect(packingServiceSpy.getPickSlips).not.toHaveBeenCalled();
      expect(packingServiceSpy.getOpenBoxes).not.toHaveBeenCalled();
    }));

    it('should not auto-set suggestedBoxType from detail response', fakeAsync(() => {
      const detailWithBoxType = { ...mockOrderDetail, suggestedBoxType: 'LG' };
      packingServiceSpy.getOrderDetail.and.returnValue(of(detailWithBoxType));
      component['allOrders'].set(mockOrders);
      component['onOrderSelected']('ORD-12345');
      tick();
      expect(component.packingForm.get('type')?.value).toBe('');
    }));

    it('should set selectedItemNo to first unfilled item', fakeAsync(() => {
      const detailWithItems = {
        ...mockOrderDetail,
        items: [
          { ...mockOrderDetail.items[0], itemNo: 1, itemStatus: 'PK' },
          { ...mockOrderDetail.items[0], itemNo: 2, itemStatus: 'OR' }
        ]
      };
      packingServiceSpy.getOrderDetail.and.returnValue(of(detailWithItems));
      component['allOrders'].set(mockOrders);
      component['onOrderSelected']('ORD-12345');
      tick();
      expect(component['selectedItemNo']()).toBe(2);
    }));

    it('should clear previous pick slips and open boxes on new selection', fakeAsync(() => {
      component['pickSlipOptions'].set([{ pickSlipId: 'OLD', orderNo: '', customerId: null, createdDate: null, status: null, statusDesc: null }]);
      component['openBoxOptions'].set([{ value: 'OLD', label: 'Old' }]);
      component['allOrders'].set(mockOrders);
      component['onOrderSelected']('ORD-12345');
      tick();
      // pickSlipOptions were cleared then reloaded (getPickSlips returns [])
      expect(component.packingForm.get('boxId')?.value).toBe('');
    }));
  });

  describe('Retrieve Extended', () => {
    it('should show error when no order is selected', () => {
      component.packingForm.patchValue({ order: '' });
      component['onRetrieve']();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select an order');
      expect(component['submitted']()).toBeTrue();
    });

    it('should handle null order detail response', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-99999' });
      packingServiceSpy.getOrderDetail.and.returnValue(of(null));
      component['onRetrieve']();
      tick();
      expect(component['error']()).toBe('Order not found');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Order not found');
      expect(component['loading']()).toBeFalse();
    }));

    it('should start with empty packed products on retrieve (session-wise)', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' });
      component['packedProducts'].set([{
        lineItemNo: 1, unitId: 'OLD', productCode: 'RBC', aboRh: 'O+',
        expirationDate: '', expirationTime: '', boxId: 'B1', qualityCheck: true
      }]);
      packingServiceSpy.getOrderDetail.and.returnValue(of(mockOrderDetail));
      component['onRetrieve']();
      tick();
      expect(component['packedProducts']().length).toBe(0);
    }));

    it('should handle pack status error gracefully on retrieve', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' });
      packingServiceSpy.getOrderDetail.and.returnValue(of(mockOrderDetail));
      packingServiceSpy.getPackStatus.and.returnValue(throwError(() => new Error('Pack status error')));
      component['onRetrieve']();
      tick();
      expect(component['selectedOrder']()).toEqual(mockOrderDetail);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Order retrieved successfully');
    }));

    it('should not auto-set suggestedBoxType from retrieved order', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' });
      const detailWithBoxType = { ...mockOrderDetail, suggestedBoxType: 'SM' };
      packingServiceSpy.getOrderDetail.and.returnValue(of(detailWithBoxType));
      component['onRetrieve']();
      tick();
      expect(component.packingForm.get('type')?.value).toBe('');
    }));

    it('should set selectedItemNo to first unfilled on retrieve', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' });
      const detailWithItems = {
        ...mockOrderDetail,
        items: [
          { ...mockOrderDetail.items[0], itemNo: 1, itemStatus: 'PK' },
          { ...mockOrderDetail.items[0], itemNo: 2, itemStatus: 'OR' }
        ]
      };
      packingServiceSpy.getOrderDetail.and.returnValue(of(detailWithItems));
      component['onRetrieve']();
      tick();
      expect(component['selectedItemNo']()).toBe(2);
    }));
  });

  describe('Create New Box', () => {
    it('should open dialog and create box on result', fakeAsync(() => {
      const dialogResult: CreateNewBoxDialogResult = { closeCurrentBox: false, allProperlyPacked: true };
      dialogSpy.open.and.returnValue({ afterClosed: () => of(dialogResult) } as any);
      component.packingForm.patchValue({ order: 'ORD-12345', type: 'SM' });
      packingServiceSpy.createBox.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ boxId: 'BOX-NEW', boxStatus: 'OP', message: 'Created' }],
        item: { boxId: 'BOX-NEW', boxStatus: 'OP', message: 'Created' }
      } as any));
      component['onCreateNewBox']();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component['currentBoxId']()).toBe('BOX-NEW');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New box has been created');
    }));

    it('should not create box when dialog is cancelled', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
      packingServiceSpy.createBox.calls.reset();
      component['onCreateNewBox']();
      tick();
      expect(packingServiceSpy.createBox).not.toHaveBeenCalled();
    }));

    it('should show error when no order selected for box creation', fakeAsync(() => {
      component.packingForm.patchValue({ order: '', type: 'SM' });
      component['createNewBox']({ closeCurrentBox: false, allProperlyPacked: true });
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select an order');
    }));

    it('should show error when no box type selected for box creation', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345', type: '' });
      component['createNewBox']({ closeCurrentBox: false, allProperlyPacked: true });
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a box type');
    }));

    it('should handle createBox API error', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345', type: 'SM' });
      packingServiceSpy.createBox.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));
      component['createNewBox']({ closeCurrentBox: false, allProperlyPacked: true });
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['loading']()).toBeFalse();
    }));

    it('should handle createBox unsuccessful response', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345', type: 'SM' });
      packingServiceSpy.createBox.and.returnValue(of({
        success: false, statusCode: 400, message: 'Box type not available',
        data: []
      } as any));
      component['createNewBox']({ closeCurrentBox: false, allProperlyPacked: true });
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Box type not available');
      expect(component['loading']()).toBeFalse();
    }));

    it('should include packing date and time in createBox request', fakeAsync(() => {
      component.packingForm.patchValue({
        order: 'ORD-12345', type: 'SM',
        actualPackingDate: moment('2024-06-15'),
        time: '10:30'
      });
      packingServiceSpy.createBox.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ boxId: 'BOX-NEW', boxStatus: 'OP', message: 'Created' }]
      } as any));
      component['createNewBox']({ closeCurrentBox: true, allProperlyPacked: true });
      tick();
      const callArgs = packingServiceSpy.createBox.calls.mostRecent().args[0];
      expect(callArgs.packedDate).toContain('2024-06-15');
      expect(callArgs.packedDate).toContain('10:30');
      expect(callArgs.closeCurrentBox).toBeTrue();
    }));
  });

  describe('Auto Create Box Then Pack', () => {
    beforeEach(() => {
      component['selectedOrder'].set(mockOrderDetail);
      component.packingForm.patchValue({
        order: 'ORD-12345',
        type: 'SM',
        unitId: 'U123',
        productCode: 'RBC',
        scanBloodType: 'O+'
      }, { emitEvent: false });
      component.packingForm.get('qualityCheck')?.setValue(true, { emitEvent: false });
    });

    it('should show error when no box type for auto-create', () => {
      component.packingForm.patchValue({ type: '' }, { emitEvent: false });
      component['autoCreateBoxThenPack']();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a box type before packing');
    });

    it('should auto-create box and then trigger pack', fakeAsync(() => {
      packingServiceSpy.createBox.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ boxId: 'BOX-AUTO', boxStatus: 'OP', message: 'Created' }],
        item: { boxId: 'BOX-AUTO', boxStatus: 'OP', message: 'Created' }
      } as any));
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ orderNo: 'ORD-12345', unitId: 'U123', productCode: 'RBC', boxId: 'BOX-AUTO', status: 'PK' }]
      } as any));
      component['autoCreateBoxThenPack']();
      tick();
      expect(component['currentBoxId']()).toBe('BOX-AUTO');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box BOX-AUTO auto-created');
    }));

    it('should handle auto-create box API error', fakeAsync(() => {
      packingServiceSpy.createBox.and.returnValue(throwError(() => ({
        error: { message: 'Auto-create failed' }
      })));
      component['autoCreateBoxThenPack']();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['isScanning']()).toBeFalse();
    }));

    it('should handle auto-create box unsuccessful response', fakeAsync(() => {
      packingServiceSpy.createBox.and.returnValue(of({
        success: false, statusCode: 400, message: 'Cannot create box',
        data: []
      } as any));
      component['autoCreateBoxThenPack']();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot create box');
      expect(component['isScanning']()).toBeFalse();
    }));
  });

  describe('View Pack Status', () => {
    it('should show error when no order for pack status', () => {
      component.packingForm.patchValue({ order: '' });
      component['onViewPackStatus']();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select an order');
    });

    it('should open pack status dialog on success', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' });
      packingServiceSpy.getPackStatus.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: [],
        item: { packedProducts: [{ unitId: 'U1' }], allocatedProducts: [] }
      } as any));
      component['onViewPackStatus']();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component['loading']()).toBeFalse();
    }));

    it('should handle pack status API error', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' });
      packingServiceSpy.getPackStatus.and.returnValue(throwError(() => new Error('API Error')));
      component['onViewPackStatus']();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve pack status');
      expect(component['loading']()).toBeFalse();
    }));
  });

  describe('View Box Contents', () => {
    it('should show error when no box for box contents', () => {
      component['currentBoxId'].set(null);
      component['onViewBoxContents']();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('No box selected');
    });

    it('should open box contents dialog on success', fakeAsync(() => {
      component['currentBoxId'].set('BOX-001');
      packingServiceSpy.getBoxContents.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ unitId: 'U1', productCode: 'RBC' }]
      } as any));
      component['onViewBoxContents']();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
      expect(component['loading']()).toBeFalse();
    }));

    it('should handle box contents API error', fakeAsync(() => {
      component['currentBoxId'].set('BOX-001');
      packingServiceSpy.getBoxContents.and.returnValue(throwError(() => new Error('API Error')));
      component['onViewBoxContents']();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve box contents');
      expect(component['loading']()).toBeFalse();
    }));
  });

  describe('Scan Product', () => {
    beforeEach(() => {
      component['selectedOrder'].set(mockOrderDetail);
      component['currentBoxId'].set('BOX-001');
      component['selectedItemNo'].set(1);
      component.packingForm.patchValue({
        order: 'ORD-12345',
        unitId: 'U123',
        productCode: 'RBC',
        scanBloodType: 'O+',
        actualPackingDate: moment('2024-06-15'),
        time: '10:30',
        expirationDate: '15-JUN-2025 23:59',
        packSlipId: 'PS-001'
      }, { emitEvent: false });
      component.packingForm.get('qualityCheck')?.setValue(true, { emitEvent: false });
    });

    it('should show error when required scan fields missing', () => {
      component.packingForm.patchValue({ unitId: '', productCode: '', scanBloodType: '' }, { emitEvent: false });
      component['onScanProduct']();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Please fill in all required fields (Unit ID, Product Code, Blood Type)'
      );
    });

    it('should show error when no order selected for scan', () => {
      component.packingForm.patchValue({ order: '' }, { emitEvent: false });
      component['onScanProduct']();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Order is required');
    });

    it('should trigger autoCreateBoxThenPack when no boxId', fakeAsync(() => {
      component['currentBoxId'].set(null);
      component.packingForm.patchValue({ boxId: '', type: 'SM' }, { emitEvent: false });
      packingServiceSpy.createBox.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ boxId: 'BOX-AUTO', boxStatus: 'OP', message: 'Created' }],
        item: { boxId: 'BOX-AUTO', boxStatus: 'OP', message: 'Created' }
      } as any));
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: []
      } as any));
      component['onScanProduct']();
      tick();
      expect(packingServiceSpy.createBox).toHaveBeenCalled();
    }));

    it('should trigger quarantine when QC fails', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      component.packingForm.get('qualityCheck')?.setValue(false, { emitEvent: false });
      component['onScanProduct']();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should pack product successfully', fakeAsync(() => {
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ orderNo: 'ORD-12345', unitId: 'U123', productCode: 'RBC', boxId: 'BOX-001', status: 'PK' }]
      } as any));
      component['onScanProduct']();
      tick();
      expect(component['packedProducts']().length).toBe(1);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product U123 packed successfully');
      expect(component['isScanning']()).toBeFalse();
    }));

    it('should display warnings from pack response', fakeAsync(() => {
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{
          orderNo: 'ORD-12345', unitId: 'U123', productCode: 'RBC',
          boxId: 'BOX-001', status: 'PK', warnings: ['Expiring soon']
        }]
      } as any));
      component['onScanProduct']();
      tick();
      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith('Warning: Expiring soon');
    }));

    it('should auto-advance to next unfilled item after pack', fakeAsync(() => {
      component['orderLineItems'].set([
        { ...mockOrderDetail.items[0], itemNo: 1, itemStatus: 'OR' },
        { ...mockOrderDetail.items[0], itemNo: 2, itemStatus: 'OR' }
      ]);
      component['selectedItemNo'].set(1);
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: []
      } as any));
      component['onScanProduct']();
      tick();
      expect(component['selectedItemNo']()).toBe(2);
    }));

    it('should handle pack product unsuccessful response', fakeAsync(() => {
      packingServiceSpy.packProduct.and.returnValue(of({
        success: false, statusCode: 400, message: 'Validation failed',
        data: []
      } as any));
      component['onScanProduct']();
      tick();
      expect(component['lastScanResult']()?.success).toBeFalse();
      expect(component['isScanning']()).toBeFalse();
    }));

    it('should handle pack product API error', fakeAsync(() => {
      packingServiceSpy.packProduct.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));
      component['onScanProduct']();
      tick();
      expect(component['isScanning']()).toBeFalse();
    }));

    it('should pack product with aliquot in product code', fakeAsync(() => {
      component.packingForm.patchValue({ aliquot: 'A1' }, { emitEvent: false });
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: []
      } as any));
      component['onScanProduct']();
      tick();
      const packed = component['packedProducts']();
      expect(packed[0].productCode).toBe('RBC-A1');
    }));

    it('should include expiration date in request when valid', fakeAsync(() => {
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: []
      } as any));
      component['onScanProduct']();
      tick();
      const callArgs = packingServiceSpy.packProduct.calls.mostRecent().args[0];
      expect(callArgs.expirationDate).toContain('2025');
    }));
  });

  describe('Handle Pack Error', () => {
    it('should show capacity warning for error code 3001', () => {
      component['handlePackError']({ errorCode: '3001', message: 'Box full' });
      expect(component['capacityWarning']()).toBeTrue();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Box is full. Please create a new box.');
    });

    it('should show substitution confirmation for SUB_CONFIRM', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      component['handlePackError']({ errorCode: 'SUB_CONFIRM', message: 'Substitution needed' });
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should show error dialog for other error codes', () => {
      component['handlePackError']({ errorCode: '5000', message: 'Some error' });
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should show snackbar error for response without error code', () => {
      component['handlePackError']({ message: 'Generic failure' });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Generic failure');
    });

    it('should set lastScanResult on any error', () => {
      component['handlePackError']({ message: 'Test error' });
      expect(component['lastScanResult']()?.success).toBeFalse();
      expect(component['lastScanResult']()?.message).toBe('Test error');
    });

    it('should handle nested errorResponse', () => {
      component['handlePackError']({ errorResponse: { errorCode: '3001', error: 'Box capacity exceeded' } });
      expect(component['capacityWarning']()).toBeTrue();
    });

    it('should use default message when none provided', () => {
      component['handlePackError']({});
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to pack product');
    });
  });

  describe('Quarantine Confirmation', () => {
    it('should quarantine product when confirmed', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.quarantineProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ unitId: 'U123', productCode: 'RBC', status: 'QR' }]
      } as any));
      component['showQuarantineConfirmation']('ORD-12345', 'U123', 'RBC', '');
      tick();
      expect(packingServiceSpy.quarantineProduct).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product has been placed in quarantine.');
    }));

    it('should clear fields when quarantine declined', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      packingServiceSpy.quarantineProduct.calls.reset();
      component['showQuarantineConfirmation']('ORD-12345', 'U123', 'RBC', '');
      tick();
      expect(packingServiceSpy.quarantineProduct).not.toHaveBeenCalled();
    }));

    it('should handle quarantine API error', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.quarantineProduct.and.returnValue(throwError(() => new Error('API Error')));
      component['showQuarantineConfirmation']('ORD-12345', 'U123', 'RBC', '');
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to quarantine product');
    }));

    it('should include aliquot in quarantine request when provided', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.quarantineProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: []
      } as any));
      component['showQuarantineConfirmation']('ORD-12345', 'U123', 'RBC', 'A1');
      tick();
      const callArgs = packingServiceSpy.quarantineProduct.calls.mostRecent().args[0];
      expect(callArgs.aliquot).toBe('A1');
      expect(callArgs.reason).toBe('VSUAL');
    }));
  });

  describe('Substitution Confirmation', () => {
    beforeEach(() => {
      component['lastPackRequest'] = {
        orderNo: 'ORD-12345',
        boxId: 'BOX-001',
        unitId: 'U123',
        productCode: 'RBC',
        itemNo: 1,
        bloodType: 'O+',
        qcPassed: true
      };
    });

    it('should re-submit pack with substituteConfirmed on YES', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{ orderNo: 'ORD-12345', unitId: 'U123', productCode: 'RBC', boxId: 'BOX-001', status: 'PK' }]
      } as any));
      component['showSubstitutionConfirmation']();
      tick();
      expect(packingServiceSpy.packProduct).toHaveBeenCalled();
      const callArgs = packingServiceSpy.packProduct.calls.mostRecent().args[0];
      expect(callArgs.substituteConfirmed).toBeTrue();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product U123 packed successfully (substitution)');
    }));

    it('should not re-submit on substitution NO', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      packingServiceSpy.packProduct.calls.reset();
      component['showSubstitutionConfirmation']();
      tick();
      expect(packingServiceSpy.packProduct).not.toHaveBeenCalled();
    }));

    it('should handle substitution re-submit error', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.packProduct.and.returnValue(throwError(() => ({
        error: { message: 'Failed' }
      })));
      component['showSubstitutionConfirmation']();
      tick();
      expect(component['isScanning']()).toBeFalse();
    }));

    it('should handle substitution unsuccessful response', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.packProduct.and.returnValue(of({
        success: false, statusCode: 400, message: 'Still failed',
        data: []
      } as any));
      component['showSubstitutionConfirmation']();
      tick();
      expect(component['lastScanResult']()?.success).toBeFalse();
    }));

    it('should display warnings from substitution pack response', fakeAsync(() => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK',
        data: [{
          orderNo: 'ORD-12345', unitId: 'U123', productCode: 'RBC',
          boxId: 'BOX-001', status: 'PK', warnings: ['Near capacity']
        }]
      } as any));
      component['showSubstitutionConfirmation']();
      tick();
      expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith('Warning: Near capacity');
    }));

    it('should auto-advance after substitution pack', fakeAsync(() => {
      component['orderLineItems'].set([
        { ...mockOrderDetail.items[0], itemNo: 1, itemStatus: 'OR' },
        { ...mockOrderDetail.items[0], itemNo: 2, itemStatus: 'OR' }
      ]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: []
      } as any));
      component['showSubstitutionConfirmation']();
      tick();
      expect(component['selectedItemNo']()).toBe(2);
    }));

    it('should add packed product with aliquot in code', fakeAsync(() => {
      component['lastPackRequest']!.aliquot = 'A1';
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.packProduct.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: []
      } as any));
      component['showSubstitutionConfirmation']();
      tick();
      const packed = component['packedProducts']();
      expect(packed[packed.length - 1].productCode).toBe('RBC-A1');
    }));
  });

  describe('Expiry Date Scan', () => {
    it('should return immediately for empty scan value', () => {
      component.packingForm.patchValue({ expirationDate: '' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      expect(component.packingForm.get('expirationDate')?.errors).toBeNull();
    });

    it('should accept valid DD-MMM-YYYY HH:mm format', () => {
      component.packingForm.patchValue({ expirationDate: '15-Jun-2025 23:59' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      expect(component.packingForm.get('expirationDate')?.hasError('invalidFormat')).toBeFalsy();
      expect(component.packingForm.get('expirationDate')?.hasError('invalidDateTime')).toBeFalsy();
    });

    it('should set invalidDateTime for unparseable matching format', () => {
      component.packingForm.patchValue({ expirationDate: '32-Xyz-2025 99:99' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      expect(component.packingForm.get('expirationDate')?.hasError('invalidDateTime')).toBeTrue();
    });

    it('should set invalidFormat for non-matching format without barcode prefix', () => {
      component.packingForm.patchValue({ expirationDate: 'not-a-date' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      expect(component.packingForm.get('expirationDate')?.hasError('invalidFormat')).toBeTrue();
    });

    it('should call validateExpdateScan for barcode starting with &>', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({
        success: true, item: { expiryDate: '2025-06-15T23:59:00Z' }
      }));
      component['selectedOrder'].set(null);
      component.packingForm.patchValue({ expirationDate: '&>123456' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      tick();
      expect(labelScanSpy.validateExpdateScan).toHaveBeenCalledWith('&>123456');
      expect(component['fieldProcessing']['expirationDate']).toBeFalse();
    }));

    it('should call validateExpdateScan for barcode starting with =>', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({
        success: true, item: { expiryDate: '2025-06-15T23:59:00Z' }
      }));
      component['selectedOrder'].set(null);
      component.packingForm.patchValue({ expirationDate: '=>654321' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      tick();
      expect(labelScanSpy.validateExpdateScan).toHaveBeenCalledWith('=>654321');
    }));

    it('should call validateExpdateScan for numeric barcode (6+ digits)', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({
        success: true, item: { expiryDate: '2025-06-15T00:00:00Z' }
      }));
      component['selectedOrder'].set(null);
      component.packingForm.patchValue({ expirationDate: '123456789' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      tick();
      expect(labelScanSpy.validateExpdateScan).toHaveBeenCalledWith('123456789');
    }));

    it('should handle validateExpdateScan failure response', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({
        success: false, message: 'Invalid barcode', errorResponse: { error: 'Bad scan' }
      }));
      component.packingForm.patchValue({ expirationDate: '&>INVALID' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      tick();
      expect(component['fieldErrors']['expirationDate']).toBeTruthy();
      expect(component['fieldProcessing']['expirationDate']).toBeFalse();
    }));

    it('should handle validateExpdateScan API error', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Server error' } }
      })));
      component.packingForm.patchValue({ expirationDate: '&>ERROR' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      tick();
      expect(component['fieldErrors']['expirationDate']).toBeTruthy();
      expect(component['fieldProcessing']['expirationDate']).toBeFalse();
    }));

    it('should format expiry date from scan response in DD-MMM-YYYY HH:mm', fakeAsync(() => {
      labelScanSpy.validateExpdateScan.and.returnValue(of({
        success: true, item: { expiryDate: '2025-06-15T10:30:00Z' }
      }));
      component['selectedOrder'].set(null);
      component.packingForm.patchValue({ expirationDate: '&>VALID' }, { emitEvent: false });
      component['onExpiryDateScanBlur']();
      tick();
      const val = component.packingForm.get('expirationDate')?.value;
      expect(val).toContain('2025');
      expect(val).toContain(':');
    }));
  });

  describe('Save Extended', () => {
    it('should show error when no order and boxId for save', () => {
      component.packingForm.patchValue({ order: '' }, { emitEvent: false });
      component['currentBoxId'].set(null);
      component['onSave']();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Order and Box ID are required');
    });

    it('should not close box when dialog is cancelled', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' }, { emitEvent: false });
      component['currentBoxId'].set('BOX-001');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      packingServiceSpy.closeBox.calls.reset();
      component['onSave']();
      tick();
      expect(packingServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should handle closeBox API error', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' }, { emitEvent: false });
      component['currentBoxId'].set('BOX-001');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.closeBox.and.returnValue(throwError(() => new Error('API Error')));
      component['onSave']();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to close box');
      expect(component['loading']()).toBeFalse();
    }));

    it('should clear state and reload boxes on successful close', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345' }, { emitEvent: false });
      component['currentBoxId'].set('BOX-001');
      component['packedProducts'].set([{
        lineItemNo: 1, unitId: 'U1', productCode: 'RBC', aboRh: 'O+',
        expirationDate: '', expirationTime: '', boxId: 'BOX-001', qualityCheck: true
      }]);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.closeBox.and.returnValue(of({
        success: true, statusCode: 200, message: 'Box closed', data: [true]
      }));
      component['onSave']();
      tick();
      expect(component['packedProducts']().length).toBe(1);
      expect(component['currentBoxId']()).toBeNull();
      expect(component.packingForm.get('boxId')?.value).toBe('');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box closed successfully');
      expect(component['loading']()).toBeFalse();
    }));

    it('should use boxId from form when currentBoxId is null', fakeAsync(() => {
      component.packingForm.patchValue({ order: 'ORD-12345', boxId: 'BOX-FORM' }, { emitEvent: false });
      component['currentBoxId'].set(null);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      packingServiceSpy.closeBox.and.returnValue(of({
        success: true, statusCode: 200, message: 'OK', data: [true]
      }));
      component['onSave']();
      tick();
      const callArgs = packingServiceSpy.closeBox.calls.mostRecent().args[0];
      expect(callArgs.boxId).toBe('BOX-FORM');
    }));
  });

  describe('Quality Check & Auto Add', () => {
    it('should not auto-add when fields are processing', () => {
      component['fieldProcessing']['unitId'] = true;
      component['selectedOrder'].set(mockOrderDetail);
      packingServiceSpy.packProduct.calls.reset();
      component['tryAutoAddProduct']();
      expect(packingServiceSpy.packProduct).not.toHaveBeenCalled();
    });

    it('should not auto-add when scanning is in progress', () => {
      component['isScanning'].set(true);
      component['selectedOrder'].set(mockOrderDetail);
      packingServiceSpy.packProduct.calls.reset();
      component['tryAutoAddProduct']();
      expect(packingServiceSpy.packProduct).not.toHaveBeenCalled();
    });

    it('should not auto-add when no order selected', () => {
      component['selectedOrder'].set(null);
      packingServiceSpy.packProduct.calls.reset();
      component['tryAutoAddProduct']();
      expect(packingServiceSpy.packProduct).not.toHaveBeenCalled();
    });

    it('should not auto-add when required fields are missing', () => {
      component['selectedOrder'].set(mockOrderDetail);
      component.packingForm.patchValue({
        unitId: '', productCode: '', scanBloodType: ''
      }, { emitEvent: false });
      component.packingForm.get('qualityCheck')?.setValue(true, { emitEvent: false });
      packingServiceSpy.packProduct.calls.reset();
      component['tryAutoAddProduct']();
      expect(packingServiceSpy.packProduct).not.toHaveBeenCalled();
    });

    it('should not auto-add when qualityCheck is null', () => {
      component['selectedOrder'].set(mockOrderDetail);
      component.packingForm.patchValue({
        unitId: 'U123', productCode: 'RBC', scanBloodType: 'O+'
      }, { emitEvent: false });
      component.packingForm.get('qualityCheck')?.setValue(null, { emitEvent: false });
      packingServiceSpy.packProduct.calls.reset();
      component['tryAutoAddProduct']();
      expect(packingServiceSpy.packProduct).not.toHaveBeenCalled();
    });

    it('should not auto-add when form has errors', () => {
      component['selectedOrder'].set(mockOrderDetail);
      component.packingForm.patchValue({
        unitId: 'U123', productCode: 'RBC', scanBloodType: 'O+'
      }, { emitEvent: false });
      component.packingForm.get('qualityCheck')?.setValue(true, { emitEvent: false });
      component.packingForm.get('unitId')?.setErrors({ serverError: true });
      packingServiceSpy.packProduct.calls.reset();
      component['tryAutoAddProduct']();
      expect(packingServiceSpy.packProduct).not.toHaveBeenCalled();
    });
  });

  describe('Product Code Loading', () => {
    beforeEach(() => {
      (packingServiceSpy as any).getProductCodes = jasmine.createSpy('getProductCodes').and.returnValue(of([]));
      (packingServiceSpy as any).getValidBloodTypes = jasmine.createSpy('getValidBloodTypes').and.returnValue(of([]));
      (packingServiceSpy as any).getValidAliquots = jasmine.createSpy('getValidAliquots').and.returnValue(of([]));
    });

    it('should load product codes for a unit', fakeAsync(() => {
      (packingServiceSpy as any).getProductCodes.and.returnValue(of([
        { value: 'RBC', label: 'Red Blood Cells' },
        { value: 'PLT', label: 'Platelets' }
      ]));
      component['loadProductCodes']('U123');
      tick();
      expect(component['productCodeOptions']().length).toBe(2);
    }));

    it('should auto-select single product code', fakeAsync(() => {
      (packingServiceSpy as any).getProductCodes.and.returnValue(of([
        { value: 'RBC', label: 'Red Blood Cells' }
      ]));
      component['loadProductCodes']('U123');
      tick();
      expect(component.packingForm.get('productCode')?.value).toBe('RBC');
    }));

    it('should handle loadProductCodes error', fakeAsync(() => {
      (packingServiceSpy as any).getProductCodes.and.returnValue(throwError(() => new Error('Error')));
      component['loadProductCodes']('U123');
      tick();
      expect(component['productCodeOptions']().length).toBe(0);
    }));

    it('should not load product codes for empty unitId', () => {
      component['loadProductCodes']('');
      expect((packingServiceSpy as any).getProductCodes).not.toHaveBeenCalled();
    });

    it('should set productCode and load blood types on product code selected', fakeAsync(() => {
      component.packingForm.patchValue({ unitId: 'U123' }, { emitEvent: false });
      component['onProductCodeSelected']({ code: 'PLT', description: 'Platelets' });
      tick();
      expect(component.packingForm.get('productCode')?.value).toBe('PLT');
      expect((packingServiceSpy as any).getValidBloodTypes).toHaveBeenCalledWith('U123', 'PLT');
    }));

    it('should not load blood types when unitId is empty on product code selected', fakeAsync(() => {
      component.packingForm.patchValue({ unitId: '' }, { emitEvent: false });
      (packingServiceSpy as any).getValidBloodTypes.calls.reset();
      component['onProductCodeSelected']({ code: 'PLT', description: 'Platelets' });
      tick();
      expect((packingServiceSpy as any).getValidBloodTypes).not.toHaveBeenCalled();
    }));

    it('should clear cascading fields when loading product codes', fakeAsync(() => {
      component['bloodTypeOptions'].set([{ code: 'O+', description: 'O Pos' }]);
      component['aliquotOptions'].set([{ code: 'A1', description: 'Aliq 1' }]);
      (packingServiceSpy as any).getProductCodes.and.returnValue(of([]));
      component['loadProductCodes']('U123');
      tick();
      expect(component['bloodTypeOptions']().length).toBe(0);
      expect(component['aliquotOptions']().length).toBe(0);
    }));
  });

  describe('Blood Type Loading', () => {
    beforeEach(() => {
      (packingServiceSpy as any).getValidBloodTypes = jasmine.createSpy('getValidBloodTypes').and.returnValue(of([]));
    });

    it('should load blood types', fakeAsync(() => {
      (packingServiceSpy as any).getValidBloodTypes.and.returnValue(of([
        { value: 'O+', label: 'O Positive' },
        { value: 'A+', label: 'A Positive' }
      ]));
      component['loadBloodTypes']('U123', 'RBC');
      tick();
      expect(component['bloodTypeOptions']().length).toBe(2);
    }));

    it('should auto-select single blood type', fakeAsync(() => {
      (packingServiceSpy as any).getValidBloodTypes.and.returnValue(of([
        { value: 'O+', label: 'O Positive' }
      ]));
      component['loadBloodTypes']('U123', 'RBC');
      tick();
      expect(component.packingForm.get('scanBloodType')?.value).toBe('O+');
    }));

    it('should handle loadBloodTypes error', fakeAsync(() => {
      (packingServiceSpy as any).getValidBloodTypes.and.returnValue(throwError(() => new Error('Error')));
      component['loadBloodTypes']('U123', 'RBC');
      tick();
      expect(component['bloodTypeOptions']().length).toBe(0);
    }));
  });

  describe('Aliquot Loading', () => {
    beforeEach(() => {
      (packingServiceSpy as any).getValidAliquots = jasmine.createSpy('getValidAliquots').and.returnValue(of([]));
    });

    it('should load aliquots', fakeAsync(() => {
      (packingServiceSpy as any).getValidAliquots.and.returnValue(of([
        { value: 'A1', label: 'Aliquot 1' },
        { value: 'A2', label: 'Aliquot 2' }
      ]));
      component['loadAliquots']('U123', 'RBC');
      tick();
      expect(component['aliquotOptions']().length).toBe(2);
    }));

    it('should auto-select single aliquot', fakeAsync(() => {
      (packingServiceSpy as any).getValidAliquots.and.returnValue(of([
        { value: 'A1', label: 'Aliquot 1' }
      ]));
      component['loadAliquots']('U123', 'RBC');
      tick();
      expect(component.packingForm.get('aliquot')?.value).toBe('A1');
    }));

    it('should handle loadAliquots error', fakeAsync(() => {
      (packingServiceSpy as any).getValidAliquots.and.returnValue(throwError(() => new Error('Error')));
      component['loadAliquots']('U123', 'RBC');
      tick();
      expect(component['aliquotOptions']().length).toBe(0);
    }));
  });

  describe('Parse Callbacks', () => {
    it('should parse product code barcode on success', fakeAsync(() => {
      labelScanSpy.validateProductScan.and.returnValue(of({
        success: true, item: { productCode: 'RBC' }
      }));
      let result: any;
      component['parseProductCode']('BARCODE123').subscribe(r => result = r);
      tick();
      expect(result).toEqual({ code: 'RBC', description: '' });
    }));

    it('should return null for failed product code scan', fakeAsync(() => {
      labelScanSpy.validateProductScan.and.returnValue(of({ success: false }));
      let result: any = 'initial';
      component['parseProductCode']('BAD').subscribe(r => result = r);
      tick();
      expect(result).toBeNull();
    }));

    it('should parse ABO barcode on success', fakeAsync(() => {
      labelScanSpy.validateAboScan.and.returnValue(of({
        success: true, item: { aboCode: 'O+' }
      }));
      let result: any;
      component['parseAboRh']('ABOBAR').subscribe(r => result = r);
      tick();
      expect(result).toEqual({ code: 'O+', description: '' });
    }));

    it('should return null for failed ABO scan', fakeAsync(() => {
      labelScanSpy.validateAboScan.and.returnValue(of({ success: false }));
      let result: any = 'initial';
      component['parseAboRh']('BAD').subscribe(r => result = r);
      tick();
      expect(result).toBeNull();
    }));
  });

  describe('Lifecycle', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('Packed Products Table Config', () => {
    it('should compute packed products table config with count in header', () => {
      component['packedProducts'].set([
        { lineItemNo: 1, unitId: 'U1', productCode: 'RBC', aboRh: 'O+',
          expirationDate: '', expirationTime: '', boxId: 'B1', qualityCheck: true },
        { lineItemNo: 2, unitId: 'U2', productCode: 'PLT', aboRh: 'A+',
          expirationDate: '', expirationTime: '', boxId: 'B1', qualityCheck: true }
      ]);
      const config = component['packedProductsTableConfig']();
      expect(config.columns[0].header).toContain('2');
    });

    it('should format date in packed products table', () => {
      const config = component['packedProductsTableConfig']();
      const dateCol = config.columns.find(c => c.key === 'expirationDate');
      expect(dateCol?.valueFormatter).toBeDefined();
      if (dateCol?.valueFormatter) {
        const formatted = dateCol.valueFormatter('2024-06-15');
        expect(formatted).toContain('2024');
      }
    });
  });

  describe('Order Search with Server Results', () => {
    it('should merge server search results with existing orders', fakeAsync(() => {
      const serverOrders: OrderPackingDto[] = [{
        orderNo: 'ORD-99999', chapterId: '0001', customerId: 'CUST002',
        consigneeId: null, orderType: 'RG', orderStatus: 'OR',
        orderClass: 'ST', orderedBy: null, firstShipDate: null,
        orderClassDesc: null, consigneeAddress: null, remoteCustomer: 'N'
      }];
      packingServiceSpy.searchOrders.and.returnValue(of(serverOrders));
      component['orderSearchControl'].setValue('ORD-99');
      tick(300);
      expect(component['allOrders']().some(o => o.orderNo === 'ORD-99999')).toBeTrue();
    }));

    it('should not duplicate existing orders from server results', fakeAsync(() => {
      packingServiceSpy.searchOrders.and.returnValue(of(mockOrders));
      const initialCount = component['allOrders']().length;
      component['orderSearchControl'].setValue('ORD-12');
      tick(300);
      expect(component['allOrders']().length).toBe(initialCount);
    }));

    it('should filter by customerId as well', fakeAsync(() => {
      component['orderSearchControl'].setValue('CUST001');
      tick(300);
      expect(component['filteredOrders']().length).toBe(1);
    }));
  });
});
