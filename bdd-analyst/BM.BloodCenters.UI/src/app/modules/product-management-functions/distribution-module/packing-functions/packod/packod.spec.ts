import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';

import { PackodComponent } from './packod';
import { PackodApiService } from './services/packod-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DonorLibLabelScanService } from '@shared/services/donor-lib-label-scan.service';
import { DiscardProductDto, ApiResponse, ConsigneeDto, OrderLookupDto, ProductTypeLookupDto, OpenBoxDto, BloodTypeLookupDto, ProductCodeLookupDto } from './models/packod.model';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('PackodComponent', () => {
  let component: PackodComponent;
  let fixture: ComponentFixture<PackodComponent>;
  let packodServiceSpy: jasmine.SpyObj<PackodApiService>;
  let headerServiceSpy: any;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: any;
  let labelScanServiceSpy: jasmine.SpyObj<DonorLibLabelScanService>;
  let chapterChangedSubject: Subject<void>;

  const mockProduct: DiscardProductDto = {
    unitId: 'UNIT123456789',
    collDate: '2026-06-10T00:00:00Z',
    productCode: 'PRBC',
    productType: 'RBC',
    bloodType: 'OP',
    productStatus: 'CK',
    expDate: '2026-07-15T23:59:00Z',
    aliquot: '001',
    boxId: null,
    aboDesc: 'O Positive',
    productDesc: 'Packed RBC',
    pickSlipId: null,
    chkDigit: '12',
  };

  const mockProduct2: DiscardProductDto = {
    unitId: 'UNIT987654321',
    collDate: '2026-06-11T00:00:00Z',
    productCode: 'PLT',
    productType: 'PLT',
    bloodType: 'AP',
    productStatus: 'CK',
    expDate: '2026-06-25T23:59:00Z',
    aliquot: '001',
    boxId: null,
    aboDesc: 'A Positive',
    productDesc: 'Platelets',
    pickSlipId: null,
    chkDigit: null,
  };

  const mockConsignees: ConsigneeDto[] = [
    { consigneeId: 'CONS01', name: 'Test Consignee', address: '123 Main St, City, ST', customerId: 'CUST01', customerType: 'DI' },
    { consigneeId: 'CONS02', name: 'Another One', address: '456 Oak Ave', customerId: 'CUST02', customerType: 'DI' },
  ];

  const mockOrders: OrderLookupDto[] = [
    { orderNo: 'ORD001' },
    { orderNo: 'ORD002' },
  ];

  const mockProductTypes: ProductTypeLookupDto[] = [
    { productType: 'RBC', productTypeDesc: 'Red Blood Cells' },
    { productType: 'PLT', productTypeDesc: 'Platelets' },
  ];

  const mockBoxes: OpenBoxDto[] = [
    { boxId: 'BOX0001', productCount: 3, createdDate: '2026-07-01T10:00:00Z' },
    { boxId: 'BOX0002', productCount: 0, createdDate: '2026-07-01T12:00:00Z' },
  ];

  const mockProductCodes: ProductCodeLookupDto[] = [
    { productCode: 'PRBC', productDesc: 'Packed RBC' },
    { productCode: 'PLT01', productDesc: 'Platelets' },
  ];

  const mockBloodTypes: BloodTypeLookupDto[] = [
    { bloodType: 'OP', aboDesc: 'O Positive', expDate: '2026-07-15T23:59:00Z' },
    { bloodType: 'AP', aboDesc: 'A Positive', expDate: null },
  ];

  const successRes = <T>(data: T, total?: number): ApiResponse<T> => ({
    success: true, statusCode: 200, data, total,
  });

  const emptyRes = (): ApiResponse<any[]> => ({ success: true, statusCode: 200, data: [] });

  function setupDefaultSpies(): void {
    packodServiceSpy.getAvailableProducts.and.returnValue(of(successRes([mockProduct, mockProduct2], 2)));
    packodServiceSpy.getBoxContents.and.returnValue(of(emptyRes()));
    packodServiceSpy.getConsignees.and.returnValue(of(emptyRes()));
    packodServiceSpy.addProductToBox.and.returnValue(of(successRes({ boxId: 'BOX0001', orderNo: 'ORD001', pickSlipId: 'PA26-00000001' })));
    packodServiceSpy.closeBox.and.returnValue(of(successRes({ boxId: 'BOX0001', closedDate: '2026-06-18T14:30:00Z' })));
    packodServiceSpy.getOrders.and.returnValue(of(emptyRes()));
    packodServiceSpy.getProductTypes.and.returnValue(of(emptyRes()));
    packodServiceSpy.getBoxes.and.returnValue(of(emptyRes()));
    packodServiceSpy.getProductCodesForUnit.and.returnValue(of(emptyRes()));
    packodServiceSpy.getBloodTypesForProduct.and.returnValue(of(emptyRes()));
    packodServiceSpy.getCheckDigit.and.returnValue(of(successRes('12')));
  }

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    packodServiceSpy = jasmine.createSpyObj('PackodApiService', [
      'getAvailableProducts', 'getBoxContents', 'addProductToBox', 'closeBox', 'getConsignees',
      'getOrders', 'getProductTypes', 'getBoxes', 'getProductCodesForUnit',
      'getBloodTypesForProduct', 'getCheckDigit',
    ]);

    headerServiceSpy = {
      chapterChanged$: chapterChangedSubject.asObservable(),
      warehouseId: signal('WH01'),
      getCurrentChapterTimezone: jasmine.createSpy('getCurrentChapterTimezone').and.returnValue('America/New_York'),
    };
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = {
      pageHeaderData: signal({ title: 'Pack Inv Rejects To Discard', subtitle: 'Test subtitle' }),
    };
    labelScanServiceSpy = jasmine.createSpyObj('DonorLibLabelScanService', [
      'validateProductScan', 'validateAboScan', 'validateExpiryScan',
    ]);
    labelScanServiceSpy.validateProductScan.and.returnValue(of({ success: false, message: 'Not found' }));
    labelScanServiceSpy.validateAboScan.and.returnValue(of({ success: false, message: 'Not found' }));
    labelScanServiceSpy.validateExpiryScan.and.returnValue(of({ success: false, message: 'Not found' }));

    setupDefaultSpies();

    TestBed.configureTestingModule({
      imports: [PackodComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: PackodApiService, useValue: packodServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: DonorLibLabelScanService, useValue: labelScanServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(PackodComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should initialize forms with default values', () => {
      fixture.detectChanges();
      expect(component.form.get('consigneeId')?.value).toBeNull();
      expect(component.form.get('orderId')?.value).toBeNull();
      expect(component.form.get('productType')?.value).toBeNull();
      expect(component.form.get('boxId')?.value).toBeNull();
    });

    it('should have orderId and productType disabled by default', () => {
      fixture.detectChanges();
      expect(component.form.get('orderId')?.disabled).toBeTrue();
      expect(component.form.get('productType')?.disabled).toBeTrue();
    });

    it('should load consignees on init', () => {
      fixture.detectChanges();
      expect(packodServiceSpy.getConsignees).toHaveBeenCalled();
    });

    it('should subscribe to chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      packodServiceSpy.getConsignees.calls.reset();
      chapterChangedSubject.next();
      tick();
      expect(packodServiceSpy.getConsignees).toHaveBeenCalled();
      expect(component.form.get('consigneeId')?.value).toBeNull();
    }));

    it('should handle consignees load error', fakeAsync(() => {
      packodServiceSpy.getConsignees.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load consignees');
    }));
  });

  describe('Form Validation', () => {
    beforeEach(() => fixture.detectChanges());

    it('should require consigneeId', () => {
      component.form.patchValue({ consigneeId: null });
      expect(component.form.get('consigneeId')?.hasError('required')).toBeTrue();
    });

    it('should be valid when consigneeId is set', () => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      expect(component.form.get('consigneeId')?.valid).toBeTrue();
    });
  });

  describe('Page Header', () => {
    it('should have computed headerConfig with breadcrumbs', () => {
      fixture.detectChanges();
      const config = component.headerConfig();
      expect(config.breadcrumbs.length).toBe(3);
      expect(config.breadcrumbs[0].label).toBe('Distribution');
      expect(config.breadcrumbs[1].label).toBe('Packing Function');
      expect(config.title).toBe('Pack Inv Rejects To Discard');
    });

    it('should use default title when pageHeaderData is empty', () => {
      pageHeaderServiceSpy.pageHeaderData.set(null);
      fixture.detectChanges();
      const config = component.headerConfig();
      expect(config.title).toBe('Pack Inv Rejects To Discard');
    });
  });

  describe('Consignee Change (Cascading)', () => {
    beforeEach(() => {
      packodServiceSpy.getConsignees.and.returnValue(of(successRes(mockConsignees)));
      fixture.detectChanges();
    });

    it('should load orders on consignee selection', fakeAsync(() => {
      packodServiceSpy.getOrders.and.returnValue(of(successRes(mockOrders)));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      expect(packodServiceSpy.getOrders).toHaveBeenCalledWith('CONS01', 'CUST01');
    }));

    it('should set address on consignee selection', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      expect((component as any).selectedConsigneeAddress()).toBe('123 Main St, City, ST');
    }));

    it('should enable orderId when orders loaded', fakeAsync(() => {
      packodServiceSpy.getOrders.and.returnValue(of(successRes(mockOrders)));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      expect(component.form.get('orderId')?.disabled).toBeFalse();
    }));

    it('should auto-select single order', fakeAsync(() => {
      packodServiceSpy.getOrders.and.returnValue(of(successRes([mockOrders[0]])));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      expect(component.form.get('orderId')?.value).toBe('ORD001');
    }));

    it('should clear downstream on consignee change', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      expect((component as any).orders()).toEqual([]);
      expect((component as any).productTypes()).toEqual([]);
      expect((component as any).boxes()).toEqual([]);
    }));

    it('should clear address when consignee cleared', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.patchValue({ consigneeId: '' });
      tick();
      expect((component as any).selectedConsigneeAddress()).toBe('');
    }));

    it('should handle orders load error', fakeAsync(() => {
      packodServiceSpy.getOrders.and.returnValue(throwError(() => new Error('fail')));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      expect((component as any).orders()).toEqual([]);
    }));
  });

  describe('Order Change', () => {
    beforeEach(() => {
      packodServiceSpy.getConsignees.and.returnValue(of(successRes(mockConsignees)));
      packodServiceSpy.getOrders.and.returnValue(of(successRes(mockOrders)));
      fixture.detectChanges();
    });

    it('should load product types on order selection', fakeAsync(() => {
      packodServiceSpy.getProductTypes.and.returnValue(of(successRes(mockProductTypes)));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      expect(packodServiceSpy.getProductTypes).toHaveBeenCalledWith('CONS01', 'CUST01');
    }));

    it('should auto-select single product type', fakeAsync(() => {
      packodServiceSpy.getProductTypes.and.returnValue(of(successRes([mockProductTypes[0]])));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      expect(component.form.get('productType')?.value).toBe('RBC');
    }));

    it('should handle product types load error', fakeAsync(() => {
      packodServiceSpy.getProductTypes.and.returnValue(throwError(() => new Error('fail')));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load product types');
    }));
  });

  describe('Product Type Change', () => {
    beforeEach(() => {
      packodServiceSpy.getConsignees.and.returnValue(of(successRes(mockConsignees)));
      packodServiceSpy.getOrders.and.returnValue(of(successRes(mockOrders)));
      packodServiceSpy.getProductTypes.and.returnValue(of(successRes(mockProductTypes)));
      fixture.detectChanges();
    });

    it('should load boxes on product type change', fakeAsync(() => {
      packodServiceSpy.getBoxes.and.returnValue(of(successRes(mockBoxes)));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      component.form.get('productType')?.setValue('RBC');
      tick();
      expect(packodServiceSpy.getBoxes).toHaveBeenCalledWith('CONS01', 'RBC', 'WH01');
    }));

    it('should set product type description', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      component.form.get('productType')?.setValue('RBC');
      tick();
      expect(component.getProductTypeDesc()).toBe('Red Blood Cells');
    }));

    it('should auto-select single box', fakeAsync(() => {
      packodServiceSpy.getBoxes.and.returnValue(of(successRes([mockBoxes[0]])));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      component.form.get('productType')?.setValue('RBC');
      tick();
      expect(component.form.get('boxId')?.value).toBe('BOX0001');
    }));

    it('should handle boxes load error', fakeAsync(() => {
      packodServiceSpy.getBoxes.and.returnValue(throwError(() => new Error('fail')));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      component.form.get('productType')?.setValue('RBC');
      tick();
      expect((component as any).boxes()).toEqual([]);
    }));
  });

  describe('Box Selection', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load box contents when boxId set', fakeAsync(() => {
      const contentsRes = successRes([{ ...mockProduct, boxId: 'BOX0001', pickSlipId: 'PA26-00000001' }]);
      packodServiceSpy.getBoxContents.and.returnValue(of(contentsRes));
      component.form.patchValue({ boxId: 'BOX0001' });
      tick();
      expect(packodServiceSpy.getBoxContents).toHaveBeenCalledWith('BOX0001');
    }));

    it('should set pickSlipId from box contents', fakeAsync(() => {
      const contentsRes = successRes([{ ...mockProduct, boxId: 'BOX0001', pickSlipId: 'PA26-00000001' }]);
      packodServiceSpy.getBoxContents.and.returnValue(of(contentsRes));
      component.form.patchValue({ boxId: 'BOX0001' });
      tick();
      expect((component as any).pickSlipId()).toBe('PA26-00000001');
    }));

    it('should clear box contents when boxId cleared', fakeAsync(() => {
      component.form.patchValue({ boxId: 'BOX0001' });
      tick();
      component.form.patchValue({ boxId: '' });
      tick();
      expect((component as any).boxContents()).toEqual([]);
      expect((component as any).packedProducts()).toEqual([]);
    }));
  });

  describe('Consignee Search Filter', () => {
    beforeEach(() => {
      packodServiceSpy.getConsignees.and.returnValue(of(successRes(mockConsignees)));
      fixture.detectChanges();
    });

    it('should return all consignees when search empty', () => {
      expect(component.filteredConsignees().length).toBe(2);
    });

    it('should filter consignees by name', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue('Another');
      tick();
      expect(component.filteredConsignees().length).toBe(1);
      expect(component.filteredConsignees()[0].consigneeId).toBe('CONS02');
    }));

    it('should filter consignees case-insensitively', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue('test');
      tick();
      expect(component.filteredConsignees().length).toBe(1);
    }));
  });

  describe('Product Type Search Filter', () => {
    it('should filter product types by type code', fakeAsync(() => {
      (component as any).productTypes.set(mockProductTypes);
      fixture.detectChanges();
      component.productTypeSearchCtrl.setValue('rbc');
      tick();
      expect(component.filteredProductTypes().length).toBe(1);
    }));

    it('should filter product types by description', fakeAsync(() => {
      (component as any).productTypes.set(mockProductTypes);
      fixture.detectChanges();
      component.productTypeSearchCtrl.setValue('plate');
      tick();
      expect(component.filteredProductTypes().length).toBe(1);
    }));
  });

  describe('Box Search Filter', () => {
    it('should filter boxes by boxId', fakeAsync(() => {
      (component as any).boxes.set(mockBoxes);
      fixture.detectChanges();
      component.boxSearchCtrl.setValue('0001');
      tick();
      expect(component.filteredBoxes().length).toBe(1);
    }));
  });

  describe('Unit ID Events', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set currentUnitId on postValidate', () => {
      const event = {
        data: { parsedUnitId: 'UNIT123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      packodServiceSpy.getProductCodesForUnit.and.returnValue(of(successRes(mockProductCodes)));
      component.onPostValidate(event as any);
      expect((component as any).currentUnitId()).toBe('UNIT123');
      expect(event.confirm).toHaveBeenCalled();
    });

    it('should reject invalid unit ID', () => {
      const event = {
        data: { parsedUnitId: '' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Invalid unit ID');
    });

    it('should load product codes after unit validation', () => {
      packodServiceSpy.getConsignees.and.returnValue(of(successRes(mockConsignees)));
      fixture.detectChanges();
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      (component as any).consignees.set(mockConsignees);
      packodServiceSpy.getProductCodesForUnit.and.returnValue(of(successRes(mockProductCodes)));

      const event = { data: { parsedUnitId: 'UNIT123' }, confirm: jasmine.createSpy(), reject: jasmine.createSpy() };
      component.onPostValidate(event as any);
      expect(packodServiceSpy.getProductCodesForUnit).toHaveBeenCalledWith('UNIT123', 'CUST01', 'CONS01');
    });

    it('should handle product codes load error', fakeAsync(() => {
      packodServiceSpy.getProductCodesForUnit.and.returnValue(throwError(() => new Error('fail')));
      const event = { data: { parsedUnitId: 'UNIT123' }, confirm: jasmine.createSpy(), reject: jasmine.createSpy() };
      component.onPostValidate(event as any);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load product codes');
    }));

    it('should clear all downstream on unit ID cleared', () => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.onUnitIdCleared();
      expect((component as any).currentUnitId()).toBeNull();
      expect((component as any).selectedProductCode()).toBe('');
      expect((component as any).selectedAboRh()).toBe('');
      expect((component as any).productCodeOptions()).toEqual([]);
      expect((component as any).aboRhOptions()).toEqual([]);
    });
  });

  describe('Product Code Change', () => {
    beforeEach(() => fixture.detectChanges());

    it('should load blood types on product code selection', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      packodServiceSpy.getBloodTypesForProduct.and.returnValue(of(successRes(mockBloodTypes)));
      component.onProductCodeChanged({ code: 'PRBC', description: 'Packed RBC' });
      tick();
      expect(packodServiceSpy.getBloodTypesForProduct).toHaveBeenCalledWith('UNIT123', 'PRBC');
    }));

    it('should set selectedProductCode', () => {
      component.onProductCodeChanged({ code: 'PRBC', description: 'Packed RBC' });
      expect((component as any).selectedProductCode()).toBe('PRBC');
    });

    it('should clear ABO on product code change', () => {
      (component as any).selectedAboRh.set('OP');
      component.onProductCodeChanged({ code: 'PRBC', description: '' });
      expect((component as any).selectedAboRh()).toBe('');
    });

    it('should clear product code and ABO on cleared', () => {
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.onProductCodeCleared();
      expect((component as any).selectedProductCode()).toBe('');
      expect((component as any).selectedAboRh()).toBe('');
    });

    it('should handle null option', () => {
      component.onProductCodeChanged(null);
      expect((component as any).selectedProductCode()).toBe('');
    });
  });

  describe('Blood Type Change and Exp Date Auto-Population', () => {
    beforeEach(() => fixture.detectChanges());

    it('should store blood type exp date map from loadBloodTypes', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      packodServiceSpy.getBloodTypesForProduct.and.returnValue(of(successRes(mockBloodTypes)));
      component.onProductCodeChanged({ code: 'PRBC', description: '' });
      tick();
      const map = (component as any).bloodTypeExpDateMap();
      expect(map.get('OP')).toBe('2026-07-15T23:59:00Z');
      expect(map.has('AP')).toBeFalse();
    }));

    it('should auto-populate expiry display when blood type has exp date', fakeAsync(() => {
      const expMap = new Map<string, string>();
      expMap.set('OP', '2026-07-15T12:00:00Z');
      (component as any).bloodTypeExpDateMap.set(expMap);

      component.onAboRhChanged({ code: 'OP', description: 'O Positive' });
      tick();

      expect((component as any).resolvedExpiryIso).toBe('2026-07-15T12:00:00Z');
      expect((component as any).expiryDisplay()).toBeTruthy();
    }));

    it('should not auto-save on ABO selection', fakeAsync(() => {
      (component as any).bloodTypeExpDateMap.set(new Map());
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');

      component.onAboRhChanged({ code: 'AP', description: 'A Positive' });
      tick();

      expect(packodServiceSpy.addProductToBox).not.toHaveBeenCalled();
    }));

    it('should clear ABO on cleared', () => {
      (component as any).selectedAboRh.set('OP');
      component.onAboRhCleared();
      expect((component as any).selectedAboRh()).toBe('');
    });

    it('should handle blood types load error', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      packodServiceSpy.getBloodTypesForProduct.and.returnValue(throwError(() => new Error('fail')));
      component.onProductCodeChanged({ code: 'PRBC', description: '' });
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load blood types');
    }));
  });

  describe('Save / Pack Product', () => {
    beforeEach(() => fixture.detectChanges());

    it('should call addProductToBox on valid save', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.form.patchValue({ consigneeId: 'CONS01', orderId: 'ORD001', productType: 'RBC' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');

      component['onSave']();
      tick();

      expect(packodServiceSpy.addProductToBox).toHaveBeenCalled();
      const args = packodServiceSpy.addProductToBox.calls.mostRecent().args[0];
      expect(args.unitId).toBe('UNIT123');
      expect(args.productCode).toBe('PRBC');
      expect(args.bloodType).toBe('OP');
      expect(args.consigneeId).toBe('CONS01');
      expect(args.orderNo).toBe('ORD001');
      expect(args.productType).toBe('RBC');
    }));

    it('should show success message on save', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      component['onSave']();
      tick();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Product packed successfully');
    }));

    it('should clear entry after successful save', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      component['onSave']();
      tick();
      expect((component as any).currentUnitId()).toBeNull();
      expect((component as any).selectedProductCode()).toBe('');
    }));

    it('should not save without unit ID', () => {
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      component['onSave']();
      expect(packodServiceSpy.addProductToBox).not.toHaveBeenCalled();
    });

    it('should not save without consignee', () => {
      (component as any).currentUnitId.set('UNIT123');
      component['onSave']();
      expect(packodServiceSpy.addProductToBox).not.toHaveBeenCalled();
    });

    it('should not save while loading', () => {
      (component as any).currentUnitId.set('UNIT123');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      (component as any).loading.set(true);
      component['onSave']();
      expect(packodServiceSpy.addProductToBox).not.toHaveBeenCalled();
    });

    it('should handle save error', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      packodServiceSpy.addProductToBox.and.returnValue(throwError(() => ({ error: { message: 'Product not found' } })));
      component['onSave']();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Product not found');
      expect((component as any).loading()).toBeFalse();
    }));

    it('should handle unsuccessful response', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      packodServiceSpy.addProductToBox.and.returnValue(of({ success: false, statusCode: 400, message: 'Restricted product' }));
      component['onSave']();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Restricted product');
    }));

    it('should set pickSlipId from response', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      component['onSave']();
      tick();
      expect((component as any).pickSlipId()).toBe('PA26-00000001');
    }));

    it('should reload orders when new order created', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      (component as any).consignees.set(mockConsignees);
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      packodServiceSpy.getOrders.and.returnValue(of(successRes(mockOrders)));
      component['onSave']();
      tick();
      expect(packodServiceSpy.getOrders).toHaveBeenCalled();
    }));
  });

  describe('Close Box', () => {
    beforeEach(() => fixture.detectChanges());

    it('should open dialog and close box when confirmed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true, allProperlyPacked: true }));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

      (component as any).currentBoxId.set('BOX0001');
      component.form.patchValue({ consigneeId: 'CONS01', productType: 'RBC' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      component.onCloseBox();
      tick();
      expect(packodServiceSpy.closeBox).toHaveBeenCalledWith('BOX0001', { allProperlyPacked: true, qcFlag: 'Y' });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Box has been closed successfully.');
    }));

    it('should not close box when dialog cancelled', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

      (component as any).currentBoxId.set('BOX0001');
      component.onCloseBox();
      tick();
      expect(packodServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should not close box when not properly packed', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true, allProperlyPacked: false }));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

      (component as any).currentBoxId.set('BOX0001');
      component.onCloseBox();
      tick();
      expect(packodServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should not call close if no box selected', () => {
      (component as any).currentBoxId.set('');
      component.onCloseBox();
      expect(packodServiceSpy.closeBox).not.toHaveBeenCalled();
    });

    it('should handle close box error', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true, allProperlyPacked: true }));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
      packodServiceSpy.closeBox.and.returnValue(throwError(() => ({ error: { message: 'Close failed' } })));

      (component as any).currentBoxId.set('BOX0001');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      component.onCloseBox();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Close failed');
      expect((component as any).loading()).toBeFalse();
    }));
  });

  describe('Create New Box', () => {
    beforeEach(() => fixture.detectChanges());

    it('should close current box when requested', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true, closeCurrent: true, allProperlyPacked: true }));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

      (component as any).currentBoxId.set('BOX0001');
      component.form.patchValue({ consigneeId: 'CONS01', productType: 'RBC' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      component.onCreateNewBox();
      tick();
      expect(packodServiceSpy.closeBox).toHaveBeenCalled();
    }));

    it('should reset for new box without closing', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true, closeCurrent: false, allProperlyPacked: true }));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

      (component as any).currentBoxId.set('BOX0001');
      component.onCreateNewBox();
      tick();
      expect((component as any).currentBoxId()).toBe('');
      expect(packodServiceSpy.closeBox).not.toHaveBeenCalled();
    }));

    it('should not act when dialog cancelled', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

      component.onCreateNewBox();
      tick();
      expect(packodServiceSpy.closeBox).not.toHaveBeenCalled();
    }));
  });

  describe('Pagination', () => {
    beforeEach(() => fixture.detectChanges());

    it('should update page size and index on page change', fakeAsync(() => {
      packodServiceSpy.getAvailableProducts.calls.reset();
      component.onPageChange({ pageSize: 25, pageIndex: 2 } as any);
      tick();
      expect((component as any).pageSize()).toBe(25);
      expect((component as any).pageIndex()).toBe(2);
    }));
  });

  describe('View Box Contents', () => {
    beforeEach(() => fixture.detectChanges());

    it('should open side panel when box selected', () => {
      (component as any).currentBoxId.set('BOX0001');
      component.onViewBoxContents();
      expect((component as any).boxContentsPanelOpen()).toBeTrue();
    });

    it('should not open when no box selected', () => {
      (component as any).currentBoxId.set('');
      component.onViewBoxContents();
      expect((component as any).boxContentsPanelOpen()).toBeFalse();
    });

    it('should close side panel', () => {
      (component as any).boxContentsPanelOpen.set(true);
      component.onBoxContentsPanelClosed();
      expect((component as any).boxContentsPanelOpen()).toBeFalse();
    });
  });

  describe('Clear All', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset all state and reload consignees', fakeAsync(() => {
      (component as any).currentBoxId.set('BOX0001');
      (component as any).selectedConsigneeAddress.set('123 Main St');
      (component as any).selectedProductTypeDesc.set('RBC');
      (component as any).pickSlipId.set('PA26-0001');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      packodServiceSpy.getConsignees.calls.reset();

      component.clearAll();
      tick();

      expect(component.form.get('consigneeId')?.value).toBeNull();
      expect((component as any).currentBoxId()).toBe('');
      expect((component as any).selectedConsigneeAddress()).toBe('');
      expect((component as any).selectedProductTypeDesc()).toBe('');
      expect((component as any).pickSlipId()).toBe('-');
      expect((component as any).packedProducts()).toEqual([]);
      expect((component as any).orders()).toEqual([]);
      expect((component as any).boxes()).toEqual([]);
      expect(packodServiceSpy.getConsignees).toHaveBeenCalled();
    }));
  });

  describe('Clear Entry', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset entry state', () => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.clearEntry();
      expect((component as any).currentUnitId()).toBeNull();
      expect((component as any).selectedProductCode()).toBe('');
      expect((component as any).selectedAboRh()).toBe('');
      expect((component as any).productCodeOptions()).toEqual([]);
      expect((component as any).aboRhOptions()).toEqual([]);
    });
  });

  describe('Table Config', () => {
    beforeEach(() => fixture.detectChanges());

    it('should include productDesc column', () => {
      const config = (component as any).tableConfig();
      const keys = config.columns.map((c: any) => c.key);
      expect(keys).toContain('productDesc');
    });

    it('should format unitId with check digit', () => {
      const config = (component as any).tableConfig();
      const unitIdCol = config.columns.find((c: any) => c.key === 'unitId');
      expect(unitIdCol.valueFormatter(null, mockProduct)).toBe('UNIT123456789 (12)');
    });

    it('should format unitId without check digit', () => {
      const config = (component as any).tableConfig();
      const unitIdCol = config.columns.find((c: any) => c.key === 'unitId');
      expect(unitIdCol.valueFormatter(null, mockProduct2)).toBe('UNIT987654321');
    });

    it('should format expDate column', () => {
      const config = (component as any).tableConfig();
      const expCol = config.columns.find((c: any) => c.key === 'expDate');
      const result = expCol.valueFormatter(null, mockProduct);
      expect(result).toContain('2026');
    });

    it('should show dash for missing expDate', () => {
      const config = (component as any).tableConfig();
      const expCol = config.columns.find((c: any) => c.key === 'expDate');
      expect(expCol.valueFormatter(null, { ...mockProduct, expDate: null })).toBe('-');
    });

    it('should format ABO column with fallback', () => {
      const config = (component as any).tableConfig();
      const aboCol = config.columns.find((c: any) => c.key === 'aboDesc');
      expect(aboCol.valueFormatter(null, { ...mockProduct, aboDesc: null, bloodType: 'OP' })).toBe('OP');
      expect(aboCol.valueFormatter(null, { ...mockProduct, aboDesc: null, bloodType: null })).toBe('-');
    });

    it('should not have row actions', () => {
      const config = (component as any).tableConfig();
      expect(config.rowActions).toBeUndefined();
    });

    it('should have pagination with default pageSize 25', () => {
      const config = (component as any).tableConfig();
      expect(config.pagination).toBeTruthy();
      expect(config.pagination.pageSize).toBe(25);
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => fixture.detectChanges());

    it('hasPackedProducts should reflect data', () => {
      expect((component as any).hasPackedProducts()).toBeFalse();
      (component as any).packedProducts.set([mockProduct]);
      expect((component as any).hasPackedProducts()).toBeTrue();
    });

    it('canCloseBox should require box and products', () => {
      expect((component as any).canCloseBox()).toBeFalse();
      (component as any).currentBoxId.set('BOX0001');
      expect((component as any).canCloseBox()).toBeFalse();
      (component as any).packedProducts.set([mockProduct]);
      expect((component as any).canCloseBox()).toBeTrue();
    });
  });

  describe('LoadOrdersAndSelect', () => {
    beforeEach(() => fixture.detectChanges());

    it('should select specific order after loading', fakeAsync(() => {
      packodServiceSpy.getOrders.and.returnValue(of(successRes(mockOrders)));
      (component as any).loadOrdersAndSelect('CONS01', 'CUST01', 'ORD002');
      tick();
      expect(component.form.get('orderId')?.value).toBe('ORD002');
    }));

    it('should fall back to single order if target not found', fakeAsync(() => {
      packodServiceSpy.getOrders.and.returnValue(of(successRes([mockOrders[0]])));
      (component as any).loadOrdersAndSelect('CONS01', 'CUST01', 'NONEXISTENT');
      tick();
      expect(component.form.get('orderId')?.value).toBe('ORD001');
    }));
  });

  describe('Manual Save via SAVE button', () => {
    beforeEach(() => fixture.detectChanges());

    it('should only pack when onSave is called explicitly', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      expect(packodServiceSpy.addProductToBox).not.toHaveBeenCalled();

      component['onSave']();
      tick();
      expect(packodServiceSpy.addProductToBox).toHaveBeenCalled();
    }));
  });

  describe('Expiry Auto-Population', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set resolvedExpiryIso from populateExpDate', () => {
      (component as any).populateExpDate('2026-07-15T12:00:00Z');
      expect((component as any).resolvedExpiryIso).toBe('2026-07-15T12:00:00Z');
    });

    it('should clear resolvedExpiryIso on clearEntry', () => {
      (component as any).resolvedExpiryIso = '2026-07-15T00:00:00Z';
      component.clearEntry();
      expect((component as any).resolvedExpiryIso).toBe('');
    });
  });

  describe('loadBoxes with pending auto-select', () => {
    beforeEach(() => fixture.detectChanges());

    it('should auto-select pending box ID', fakeAsync(() => {
      (component as any).pendingAutoSelectBoxId.set('BOX0002');
      packodServiceSpy.getBoxes.and.returnValue(of(successRes(mockBoxes)));
      (component as any).loadBoxes('CONS01', 'RBC');
      tick();
      expect(component.form.get('boxId')?.value).toBe('BOX0002');
      expect((component as any).pendingAutoSelectBoxId()).toBeNull();
    }));

    it('should use selectBoxId parameter over pending', fakeAsync(() => {
      (component as any).pendingAutoSelectBoxId.set('BOX9999');
      packodServiceSpy.getBoxes.and.returnValue(of(successRes(mockBoxes)));
      (component as any).loadBoxes('CONS01', 'RBC', 'BOX0001');
      tick();
      expect(component.form.get('boxId')?.value).toBe('BOX0001');
    }));
  });

  describe('Close box with unsuccessful response', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show error on unsuccessful close response', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ confirmed: true, allProperlyPacked: true }));
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
      packodServiceSpy.closeBox.and.returnValue(of({ success: false, statusCode: 400, message: 'Already closed' }));

      (component as any).currentBoxId.set('BOX0001');
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      component.onCloseBox();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Already closed');
    }));
  });

  describe('suppressTableRefresh behavior', () => {
    beforeEach(() => fixture.detectChanges());

    it('should not load packed products when suppressed', fakeAsync(() => {
      (component as any).suppressTableRefresh.set(true);
      packodServiceSpy.getAvailableProducts.calls.reset();
      packodServiceSpy.getBoxContents.and.returnValue(of(emptyRes()));
      component.form.patchValue({ boxId: 'BOX0001' });
      tick();
      expect(packodServiceSpy.getAvailableProducts).not.toHaveBeenCalled();
    }));
  });

  describe('Consignee search edge cases', () => {
    beforeEach(() => {
      packodServiceSpy.getConsignees.and.returnValue(of(successRes(mockConsignees)));
      fixture.detectChanges();
    });

    it('should match by customerId', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue('CUST02');
      tick();
      expect(component.filteredConsignees().length).toBe(1);
      expect(component.filteredConsignees()[0].consigneeId).toBe('CONS02');
    }));

    it('should match by address', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue('Oak');
      tick();
      expect(component.filteredConsignees().length).toBe(1);
    }));

    it('should return empty for non-matching search', fakeAsync(() => {
      component.consigneeSearchCtrl.setValue('ZZZZZ');
      tick();
      expect(component.filteredConsignees().length).toBe(0);
    }));
  });

  describe('expDate value in onSave', () => {
    beforeEach(() => fixture.detectChanges());

    it('should use resolvedExpiryIso when available', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      (component as any).resolvedExpiryIso = '2026-07-15T12:00:00Z';
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');

      component['onSave']();
      tick();

      const args = packodServiceSpy.addProductToBox.calls.mostRecent().args[0];
      expect(args.expDate).toBe('2026-07-15T12:00:00Z');
    }));

    it('should send undefined expDate when no expiry resolved', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      (component as any).resolvedExpiryIso = '';
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');

      component['onSave']();
      tick();

      const args = packodServiceSpy.addProductToBox.calls.mostRecent().args[0];
      expect(args.expDate).toBeUndefined();
    }));
  });

  describe('loadConsignees response normalization', () => {
    it('should not set consignees on unsuccessful response', fakeAsync(() => {
      packodServiceSpy.getConsignees.and.returnValue(of({ success: false, statusCode: 500, data: mockConsignees }));
      fixture.detectChanges();
      tick();
      expect((component as any).consignees()).toEqual([]);
    }));

    it('should not set consignees when data is null', fakeAsync(() => {
      packodServiceSpy.getConsignees.and.returnValue(of({ success: true, statusCode: 200, data: null } as any));
      fixture.detectChanges();
      tick();
      expect((component as any).consignees()).toEqual([]);
    }));
  });

  describe('loadProductTypes multiple items enable', () => {
    beforeEach(() => {
      packodServiceSpy.getConsignees.and.returnValue(of(successRes(mockConsignees)));
      packodServiceSpy.getOrders.and.returnValue(of(successRes(mockOrders)));
      fixture.detectChanges();
    });

    it('should enable productType for multiple types without auto-select', fakeAsync(() => {
      packodServiceSpy.getProductTypes.and.returnValue(of(successRes(mockProductTypes)));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      expect(component.form.get('productType')?.disabled).toBeFalse();
      expect(component.form.get('productType')?.value).toBeNull();
    }));

    it('should disable productType when no types returned', fakeAsync(() => {
      packodServiceSpy.getProductTypes.and.returnValue(of(successRes([])));
      component.form.patchValue({ consigneeId: 'CONS01' });
      tick();
      component.form.get('orderId')?.setValue('ORD001');
      tick();
      expect(component.form.get('productType')?.disabled).toBeTrue();
    }));
  });

  describe('onConsigneeChange without consignee match', () => {
    beforeEach(() => fixture.detectChanges());

    it('should not load orders if consignee not found in list', fakeAsync(() => {
      (component as any).consignees.set([]);
      packodServiceSpy.getOrders.calls.reset();
      component.form.patchValue({ consigneeId: 'UNKNOWN' });
      tick();
      expect(packodServiceSpy.getOrders).not.toHaveBeenCalled();
    }));
  });

  describe('onOrderChange without consignee or order', () => {
    beforeEach(() => fixture.detectChanges());

    it('should not load product types when order is null', fakeAsync(() => {
      component.form.patchValue({ consigneeId: 'CONS01' }, { emitEvent: false });
      (component as any).selectedConsigneeId.set('CONS01');
      packodServiceSpy.getProductTypes.calls.reset();
      component.form.get('orderId')?.enable({ emitEvent: false });
      component.form.get('orderId')?.setValue(null);
      tick();
      expect(packodServiceSpy.getProductTypes).not.toHaveBeenCalled();
    }));
  });

  describe('onProductTypeChange without consignee', () => {
    beforeEach(() => fixture.detectChanges());

    it('should not load boxes when consignee is null', fakeAsync(() => {
      (component as any).productTypes.set(mockProductTypes);
      packodServiceSpy.getBoxes.calls.reset();
      component.form.get('productType')?.enable({ emitEvent: false });
      component.form.patchValue({ consigneeId: null }, { emitEvent: false });
      component.form.get('productType')?.setValue('RBC');
      tick();
      expect(packodServiceSpy.getBoxes).not.toHaveBeenCalled();
    }));
  });

  describe('Save with boxId trimmed to empty', () => {
    beforeEach(() => fixture.detectChanges());

    it('should send empty boxId when box field is whitespace', fakeAsync(() => {
      (component as any).currentUnitId.set('UNIT123');
      (component as any).selectedProductCode.set('PRBC');
      (component as any).selectedAboRh.set('OP');
      (component as any).selectedConsigneeId.set('CONS01');
      component.form.patchValue({ consigneeId: 'CONS01', boxId: '   ' }, { emitEvent: false });
      component['onSave']();
      tick();
      const args = packodServiceSpy.addProductToBox.calls.mostRecent().args[0];
      expect(args.boxId).toBe('');
    }));
  });

  describe('loadBoxContents error handling', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set empty box contents on error', fakeAsync(() => {
      packodServiceSpy.getBoxContents.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadBoxContents('BOX0001');
      tick();
      expect((component as any).boxContents()).toEqual([]);
    }));
  });

  describe('loadPackedProducts error handling', () => {
    beforeEach(() => fixture.detectChanges());

    it('should show error on load failure', fakeAsync(() => {
      packodServiceSpy.getAvailableProducts.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadPackedProducts();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load packed products');
      expect((component as any).loading()).toBeFalse();
    }));

    it('should clear data on unsuccessful response', fakeAsync(() => {
      packodServiceSpy.getAvailableProducts.and.returnValue(of({ success: false, statusCode: 500 }));
      (component as any).loadPackedProducts();
      tick();
      expect((component as any).packedProducts()).toEqual([]);
      expect((component as any).totalRecords()).toBe(0);
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      fixture.detectChanges();
      const spy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(spy).toHaveBeenCalled();
    });
  });
});
