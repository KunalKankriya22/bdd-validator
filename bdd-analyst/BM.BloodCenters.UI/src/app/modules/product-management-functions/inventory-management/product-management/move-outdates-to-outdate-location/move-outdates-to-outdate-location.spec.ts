import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

import { MoveOutdatesToOutdateLocationComponent } from './move-outdates-to-outdate-location';
import { MoveOutdatesToOutdateLocationService } from './move-outdates-to-outdate-location.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import moment from 'moment';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('MoveOutdatesToOutdateLocationComponent', () => {
  let component: MoveOutdatesToOutdateLocationComponent;
  let fixture: ComponentFixture<MoveOutdatesToOutdateLocationComponent>;
  let serviceSpy: jasmine.SpyObj<MoveOutdatesToOutdateLocationService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterTimezoneServiceSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let chapterChanged$: Subject<any>;

  const mockPickSlips = [
    { pickSlipId: 'PO0000001234', dateTime: '2026-06-01T08:30:00', totalProducts: 15 },
    { pickSlipId: 'PO0000001235', dateTime: '2026-06-03T14:45:00', totalProducts: 8 },
  ];

  const mockProductDropdown = [
    { productId: 'E0701V00', productType: 'WB' },
    { productId: 'E0702V00', productType: 'PRBCS' },
  ];

  const mockProduct = {
    productId: 'W12345678901234',
    productCode: 'E0701V00',
    productType: 'WB',
    expirationDate: '2026-05-25T14:30:00',
    discardCode: 'OD',
    discardDescription: 'Outdate',
    warehouseId: '1',
    warehouseName: 'Main Warehouse',
    pickSlipId: 'PO0000001234',
    moveDate: '2026-06-01T00:00:00',
    status: 'A',
    insertDate: '2026-06-01T08:30:00',
    insertUser: 'JSMITH',
    aboRh: 'O POS',
  };

  const mockPickSlipProductApi = {
    productId: 'E0701V00',
    productType: 'WB',
    aboRh: 'O POS',
    expirationDateTime: '2026-05-25T14:30:00',
  };

  beforeEach(() => {

    chapterChanged$ = new Subject();

    serviceSpy = jasmine.createSpyObj('MoveOutdatesToOutdateLocationService', [
      'getPickSlips',
      'getProductById',
      'moveProductToOutdate',
      'getProductsOnPickSlip',
      'getProductDropdown',
      'validateUnit',
    ]);
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    snackBarSpy = createMockMatSnackBar();
    dialogSpy = createMockMatDialog();
    chapterTimezoneServiceSpy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
    ]);

    mockTranslateService = jasmine.createSpyObj('TranslateService', ['instant', 'get'], {
      currentLang: 'en',
      onLangChange: of({ lang: 'en', translations: {} }),
    });
    mockTranslateService.instant.and.returnValue('');
    mockTranslateService.get.and.returnValue(of(''));

    serviceSpy.getPickSlips.and.returnValue(of(mockPickSlips));
    serviceSpy.getProductDropdown.and.returnValue(of(mockProductDropdown));
    serviceSpy.getProductById.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: mockProduct })
    );
    serviceSpy.validateUnit.and.returnValue(
      of({ success: true, message: '', statusCode: 200, data: [mockPickSlipProductApi] })
    );
    serviceSpy.moveProductToOutdate.and.returnValue(
      of({
        success: true,
        message: 'Product moved to outdate location successfully.',
        statusCode: 201,
        data: {
          productId: mockProduct.productId,
          productCode: mockProduct.productCode,
          warehouseId: '1',
          discardCode: 'OD',
          moveDate: '2026-06-01T00:00:00',
        },
      })
    );
    chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-06-01'));



      TestBed.configureTestingModule({
imports: [MoveOutdatesToOutdateLocationComponent, NoopAnimationsModule],
      providers: [
        { provide: MoveOutdatesToOutdateLocationService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTimezoneServiceSpy },
        { provide: TranslateService, useValue: mockTranslateService },
        {
          provide: PageHeaderService,
          useValue: {
            pageHeaderData: signal(undefined),
            getTitle: () => 'Move Outdates to Outdate Location',
            getSubtitle: () => '',
          },
        },
      ],
    })
    .overrideComponent(MoveOutdatesToOutdateLocationComponent, {
      add: {
        providers: [
          { provide: MatSnackBar, useValue: snackBarSpy },
          { provide: MatDialog, useValue: dialogSpy },
        ],
      },
    });


    });



  beforeEach(() => {

      mockTranslateService.instant.and.returnValue('');


      mockTranslateService.get.and.returnValue(of(''));


      serviceSpy.getPickSlips.and.returnValue(of(mockPickSlips));


      serviceSpy.getProductDropdown.and.returnValue(of(mockProductDropdown));









      chapterTimezoneServiceSpy.getChapterLocalDate.and.returnValue(moment('2026-06-01'));


    fixture = TestBed.createComponent(MoveOutdatesToOutdateLocationComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {

    it('should initialize pick slip form with null value', () => {
      fixture.detectChanges();
      expect(component.pickSlipForm.get('pickSlipId')?.value).toBeNull();
    });

    it('should initialize scan form with empty values', () => {
      fixture.detectChanges();
      expect(component.scanForm.get('productCode')?.value).toBe('');
    });

    it('should load pick slips on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getPickSlips).toHaveBeenCalled();
      expect(component.pickSlips()).toEqual(mockPickSlips);
    }));


    it('should have VIEW ITEMS ON PICK SLIP button enabled on page load', () => {
      fixture.detectChanges();
      const action = component.headerConfig.actions?.[0];
      expect(action).toBeTruthy();
      expect(action!.label).toBe('VIEW ITEMS ON PICK SLIP');
      expect(action!.disabled).toBeFalse();
    });

    it('should set empty scanned products on init', () => {
      fixture.detectChanges();
      expect(component.scannedProducts()).toEqual([]);
      expect(component.isEmpty()).toBeTrue();
    });

    it('should handle pick slips load error', fakeAsync(() => {
      serviceSpy.getPickSlips.and.returnValue(throwError(() => new Error('API error')));
      fixture.detectChanges();
      tick();

      expect(component.pickSlips()).toEqual([]);
    }));
  });

  describe('Pick Slip Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update display fields when pick slip is selected', fakeAsync(() => {
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();

      expect(component.selectedPickSlipTotalProducts()).toBe(15);
      expect(component.selectedPickSlipDateTime()).toContain('JUN');
    }));


    it('should load product dropdown when pick slip is selected', fakeAsync(() => {
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();

      expect(serviceSpy.getProductDropdown).toHaveBeenCalledWith('PO0000001234');
      expect(component.productOptions().length).toBe(2);
      expect(component.productOptions()[0].code).toBe('E0701V00');
      expect(component.productOptions()[0].description).toBe('WB');
    }));

    it('should clear product options when pick slip is deselected', fakeAsync(() => {
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: null });
      tick();

      expect(component.productOptions()).toEqual([]);
    }));

    it('should handle product dropdown load error', fakeAsync(() => {
      serviceSpy.getProductDropdown.and.returnValue(throwError(() => new Error('API error')));
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();

      expect(component.productOptions()).toEqual([]);
    }));
  });

  describe('Unit Scan Validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should call validateUnit on post-validate event', fakeAsync(() => {
      const mockEvent = {
        data: { parsedUnitId: 'W12345678901234', manualUnitId: 'W12345678901234' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(serviceSpy.validateUnit).toHaveBeenCalledWith('W12345678901234', 'PO0000001234');
      expect(mockEvent.confirm).toHaveBeenCalled();
    }));

    it('should reject on validate unit failure', fakeAsync(() => {
      serviceSpy.validateUnit.and.returnValue(
        of({ success: false, message: 'Unit validation failed', statusCode: 400, data: null as any })
      );

      const mockEvent = {
        data: { parsedUnitId: 'INVALID', manualUnitId: 'INVALID' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };

      component.onUnitPostValidate(mockEvent as any);
      tick();

      expect(mockEvent.reject).toHaveBeenCalledWith('Unit validation failed');
      expect(mockEvent.confirm).not.toHaveBeenCalled();
    }));


    it('should detect duplicate unit ID on validated event', fakeAsync(() => {
      component.scannedProducts.set([
        {
          unitId: 'W12345678901234',
          productCode: 'E0701V00',
          productType: 'WB',
          aboRh: 'O POS',
          expirationDate: '25-MAY-2026 14:30',
          scannedAt: new Date(),
        },
      ]);

      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      expect(component.duplicateError()).toBe('This Unit ID has been scanned');
    }));

    it('should auto-populate scan form and save on validated event', fakeAsync(() => {
      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = 'W12345678901234';

      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      // Select product to trigger save flow
      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(serviceSpy.moveProductToOutdate).toHaveBeenCalled();
      expect(component.scannedProducts().length).toBe(1);
    }));

    it('should show error when product not found on validated event', fakeAsync(() => {
      // unitPickSlipProducts is empty by default, triggering the "not available" error
      component.onUnitValidated({
        parsedUnitId: 'INVALID',
        manualUnitId: 'INVALID',
      } as any);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Product details not available',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should clear duplicate error on unit cleared', () => {
      component['duplicateError'].set('This Unit ID has been scanned');
      component.onUnitCleared();
      expect(component.duplicateError()).toBeNull();
    });
  });

  describe('Save Scanned Product', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should save product and add to scanned products grid', fakeAsync(() => {
      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = 'W12345678901234';

      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(serviceSpy.moveProductToOutdate).toHaveBeenCalled();
      const callArgs = serviceSpy.moveProductToOutdate.calls.mostRecent().args[0];
      expect(callArgs.productId).toBe('W12345678901234');
      expect(callArgs.warehouseId).toBe('WH01');
      expect(component.scannedProducts().length).toBe(1);
    }));


    it('should show error when no warehouse is selected', fakeAsync(() => {
      headerServiceSpy.getCurrentWarehouseId.and.returnValue('');
      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = 'W12345678901234';

      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('No warehouse selected'),
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle save API errors', fakeAsync(() => {
      serviceSpy.moveProductToOutdate.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to save product' } }))
      );

      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = 'W12345678901234';

      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Failed to save product',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should handle move API returning failure', fakeAsync(() => {
      serviceSpy.moveProductToOutdate.and.returnValue(
        of({
          success: false,
          message: 'Product has already been moved to outdate location',
          statusCode: 409,
          data: null as any,
        })
      );

      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = 'W12345678901234';

      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Product has already been moved to outdate location',
        'DISMISS',
        jasmine.any(Object)
      );
      expect(component.scannedProducts().length).toBe(0);
    }));
  });

  describe('View Items on Pick Slip Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should show error when no pick slip is selected', () => {
      component.pickSlipForm.patchValue({ pickSlipId: null });
      component.onViewItemsOnPickSlip();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Please select an Outdate Pickslip first',
        'DISMISS',
        jasmine.any(Object)
      );
    });

  });

  describe('Empty State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should hide empty state when products exist', () => {
      component.scannedProducts.set([
        {
          unitId: 'W12345678901234',
          productCode: 'E0701V00',
          productType: 'WB',
          aboRh: 'O POS',
          expirationDate: '25-MAY-2026 14:30',
          scannedAt: new Date(),
        },
      ]);

      expect(component.isEmpty()).toBeFalse();
    });
  });

  describe('Clear All Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
      component.scannedProducts.set([
        {
          unitId: 'W12345678901234',
          productCode: 'E0701V00',
          productType: 'WB',
          aboRh: 'O POS',
          expirationDate: '25-MAY-2026 14:30',
          scannedAt: new Date(),
        },
      ]);
    }));

    it('should clear all data when clearAll is called', () => {
      component.clearAll();

      expect(component.pickSlipForm.get('pickSlipId')?.value).toBeNull();
      expect(component.scannedProducts().length).toBe(0);
      expect(component.dataSource.length).toBe(0);
      expect(component.selectedPickSlipDateTime()).toBe('--');
      expect(component.selectedPickSlipTotalProducts()).toBe(0);
      expect(component.duplicateError()).toBeNull();
    });
  });

  describe('Sort Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.scannedProducts.set([
        { unitId: 'B-UNIT', productCode: 'P2', productType: 'WB', aboRh: 'A NEG', expirationDate: '01-JUN-2026', scannedAt: new Date() },
        { unitId: 'A-UNIT', productCode: 'P1', productType: 'RBC', aboRh: 'O POS', expirationDate: '02-JUN-2026', scannedAt: new Date() },
      ]);
      component.dataSource = [...component.scannedProducts()];
    });




    it('should ignore sort on non-unitId columns', () => {
      const originalDataSource = [...component.dataSource];
      component.onSortChange({ column: 'productCode', direction: 'A' });

      expect(component.dataSource).toEqual(originalDataSource);
    });
  });

  describe('Chapter Change Subscription', () => {
    it('should clear data and reload on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      spyOn(component, 'clearAll');

      chapterChanged$.next(null);
      tick();

      expect(component.clearAll).toHaveBeenCalled();
      expect(serviceSpy.getPickSlips).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Unique ID Generation', () => {
    it('should have different IDs for multiple component instances', () => {
      const fixture2 = TestBed.createComponent(MoveOutdatesToOutdateLocationComponent);
      const component2 = fixture2.componentInstance;

      expect(component['componentId']).not.toBe(component2['componentId']);
    });
  });

  describe('Product Scan Auto-Select (scan-into-dropdown)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should auto-select product when barcode exactly matches a product code', fakeAsync(() => {
      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      component.productSearchControl.setValue('E0701V00');
      tick();

      expect(component.scanForm.get('productCode')?.value).toBe('E0701V00');
      expect(component.productSearchControl.value).toBe('');
    }));

    it('should auto-select case-insensitively', fakeAsync(() => {
      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      component.productSearchControl.setValue('e0701v00');
      tick();

      expect(component.scanForm.get('productCode')?.value).toBe('E0701V00');
    }));

    it('should not auto-select when search term is partial (no exact match)', fakeAsync(() => {
      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      component.productSearchControl.setValue('E070');
      tick();

      expect(component.scanForm.get('productCode')?.value).toBe('');
    }));

    it('should clear productSearchControl after exact match auto-select', fakeAsync(() => {
      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
      } as any);
      tick();

      component.productSearchControl.setValue('E0702V00');
      tick();

      expect(component.productSearchControl.value).toBe('');
    }));
  });

  describe('Header Action Button State', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should keep VIEW ITEMS button enabled when pick slip is selected', fakeAsync(() => {
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();

      const action = component.headerConfig.actions?.[0];
      expect(action?.disabled).toBeFalse();
    }));

  });

  describe('onUnitPostValidate edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reject immediately when no pick slip is selected', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: null });
      const mockEvent = {
        data: { parsedUnitId: 'W123', manualUnitId: 'W123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(mockEvent as any);
      tick();
      expect(mockEvent.reject).toHaveBeenCalledWith('Please select a pick slip first');
      expect(serviceSpy.validateUnit).not.toHaveBeenCalled();
    }));

    it('should reject with error message when validateUnit throws with message', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
      serviceSpy.validateUnit.and.returnValue(throwError(() => ({ error: { message: 'Network error' } })));
      const mockEvent = {
        data: { parsedUnitId: 'W123', manualUnitId: 'W123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(mockEvent as any);
      tick();
      expect(mockEvent.reject).toHaveBeenCalledWith('Network error');
    }));

    it('should reject with fallback message when error has no message', fakeAsync(() => {
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
      serviceSpy.validateUnit.and.returnValue(throwError(() => ({})));
      const mockEvent = {
        data: { parsedUnitId: 'W123', manualUnitId: 'W123' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject'),
      };
      component.onUnitPostValidate(mockEvent as any);
      tick();
      expect(mockEvent.reject).toHaveBeenCalledWith('Failed to validate Unit ID');
    }));
  });

  describe('Sort by unitId column', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.scannedProducts.set([
        { unitId: 'C-UNIT', productCode: 'P3', productType: 'WB', aboRh: 'A NEG', expirationDate: '01-JUN-2026 00:00', scannedAt: new Date() },
        { unitId: 'A-UNIT', productCode: 'P1', productType: 'RBC', aboRh: 'O POS', expirationDate: '02-JUN-2026 00:00', scannedAt: new Date() },
        { unitId: 'B-UNIT', productCode: 'P2', productType: 'PRBCS', aboRh: 'B POS', expirationDate: '03-JUN-2026 00:00', scannedAt: new Date() },
      ]);
      component.dataSource = [...component.scannedProducts()];
    });

    it('should sort ascending by unitId when direction is A', () => {
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.dataSource[0].unitId).toBe('A-UNIT');
      expect(component.dataSource[1].unitId).toBe('B-UNIT');
      expect(component.dataSource[2].unitId).toBe('C-UNIT');
    });

    it('should sort descending by unitId when direction is D', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component.dataSource[0].unitId).toBe('C-UNIT');
      expect(component.dataSource[2].unitId).toBe('A-UNIT');
    });
  });

  describe('Truncation helpers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set isPickSlipTruncated=true when scrollWidth > clientWidth', () => {
      (component as any).checkPickSlipTruncation({ scrollWidth: 200, clientWidth: 100 } as HTMLElement);
      expect((component as any).isPickSlipTruncated).toBeTrue();
    });

    it('should set isPickSlipTruncated=false when scrollWidth <= clientWidth', () => {
      (component as any).checkPickSlipTruncation({ scrollWidth: 80, clientWidth: 100 } as HTMLElement);
      expect((component as any).isPickSlipTruncated).toBeFalse();
    });

    it('should clear pick slip truncation when dropdown closes', () => {
      (component as any).isPickSlipTruncated = true;
      (component as any).onDropdownOpened(false);
      expect((component as any).isPickSlipTruncated).toBeFalse();
    });

    it('should not clear pick slip truncation when dropdown opens', () => {
      (component as any).isPickSlipTruncated = true;
      (component as any).onDropdownOpened(true);
      expect((component as any).isPickSlipTruncated).toBeTrue();
    });

    it('should set isProductTruncated=true when scrollWidth > clientWidth', () => {
      (component as any).checkProductTruncation({ scrollWidth: 300, clientWidth: 150 } as HTMLElement);
      expect((component as any).isProductTruncated).toBeTrue();
    });

    it('should clear product truncation when dropdown closes', () => {
      (component as any).isProductTruncated = true;
      (component as any).onProductDropdownOpened(false);
      expect((component as any).isProductTruncated).toBeFalse();
    });

    it('should not clear product truncation when dropdown opens', () => {
      (component as any).isProductTruncated = true;
      (component as any).onProductDropdownOpened(true);
      expect((component as any).isProductTruncated).toBeTrue();
    });

    it('should generate elementId, errorId and labelId for a given name', () => {
      expect((component as any).elementId('field')).toContain('field');
      expect((component as any).errorId('field')).toContain('field');
      expect((component as any).labelId('field')).toContain('field');
    });
  });

  describe('View Items on Pick Slip — with pick slip selected', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should open dialog when pick slip is selected', () => {
      component.onViewItemsOnPickSlip();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should invoke onClick header action to open dialog', () => {
      const action = component.headerConfig.actions?.[0];
      action?.onClick?.();
      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('Pick Slip Closed auto-reset', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should reload pick slips and show closed message when pickSlipClosed is true', fakeAsync(() => {
      serviceSpy.moveProductToOutdate.and.returnValue(
        of({
          success: true,
          message: '1 Entries saved',
          statusCode: 201,
          data: {
            productId: 'W12345678901234',
            productCode: 'E0701V00',
            warehouseId: '1',
            discardCode: 'OD',
            moveDate: '2026-06-01',
            pickSlipClosed: true,
          },
        })
      );

      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = 'W12345678901234';

      component.onUnitValidated({ parsedUnitId: 'W12345678901234', manualUnitId: 'W12345678901234' } as any);
      tick();
      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Pick slip closed'),
        'DISMISS',
        jasmine.any(Object)
      );
      expect(serviceSpy.getPickSlips).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Null product fields — ?? branch coverage', () => {
    const nullFieldProduct = {
      productId: 'E0701V00',
      productType: null as any,
      aboRh: null as any,
      expirationDateTime: null as any,
    };

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should use empty string fallbacks in productOptions when product fields are null', fakeAsync(() => {
      (component as any).unitPickSlipProducts = [nullFieldProduct];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = 'W12345678901234';

      component.onUnitValidated({ parsedUnitId: 'W12345678901234', manualUnitId: 'W12345678901234' } as any);
      tick();

      const opts = component.productOptions();
      expect(opts[0].productType).toBe('');
      expect(opts[0].aboRh).toBe('');
      expect(opts[0].expirationDate).toBe('');
    }));

    it('should use dash fallbacks in scanned product when fields are null', fakeAsync(() => {
      serviceSpy.moveProductToOutdate.and.returnValue(
        of({
          success: true,
          message: '1 Entries saved',
          statusCode: 201,
          data: {
            productId: 'W12345678901234',
            productCode: 'E0701V00',
            warehouseId: '1',
            discardCode: 'OD',
            moveDate: '2026-06-01',
            pickSlipClosed: false,
          },
        })
      );

      (component as any).unitPickSlipProducts = [nullFieldProduct];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = 'W12345678901234';

      component.onUnitValidated({ parsedUnitId: 'W12345678901234', manualUnitId: 'W12345678901234' } as any);
      tick();
      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      const saved = component.scannedProducts()[0];
      expect(saved.productType).toBe('-');
      expect(saved.aboRh).toBe('-');
      expect(saved.expirationDate).toBe('-');
    }));
  });

  describe('onProductSelected edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should not save when parsedUnitId is null', fakeAsync(() => {
      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = null;

      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(serviceSpy.moveProductToOutdate).not.toHaveBeenCalled();
    }));

    it('should not save when product code does not match any unitPickSlipProduct', fakeAsync(() => {
      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';

      component.scanForm.patchValue({ productCode: 'UNKNOWN_CODE' });
      tick();

      expect(serviceSpy.moveProductToOutdate).not.toHaveBeenCalled();
    }));

    it('should not save when unitPickSlipProducts is empty', fakeAsync(() => {
      (component as any).unitPickSlipProducts = [];
      (component as any).currentParsedUnitId = 'W12345678901234';

      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(serviceSpy.moveProductToOutdate).not.toHaveBeenCalled();
    }));

    it('should use parsedUnitId as displayUnitId when currentManualUnitId is null', fakeAsync(() => {
      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';
      (component as any).currentManualUnitId = null;

      component.scanForm.patchValue({ productCode: 'E0701V00' });
      tick();

      expect(serviceSpy.moveProductToOutdate).toHaveBeenCalled();
      const callArgs = serviceSpy.moveProductToOutdate.calls.mostRecent().args[0];
      expect(callArgs.productId).toBe('W12345678901234');
    }));
  });

  describe('Pick Slip search filtering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter pick slips when search term is entered', fakeAsync(() => {
      (component as any).pickSlipSearchControl.setValue('PO0000001234');
      tick();
      expect((component as any).filteredPickSlips().length).toBe(1);
      expect((component as any).filteredPickSlips()[0].pickSlipId).toBe('PO0000001234');
    }));

    it('should return empty array when no pick slips match search', fakeAsync(() => {
      (component as any).pickSlipSearchControl.setValue('NOMATCH99999');
      tick();
      expect((component as any).filteredPickSlips().length).toBe(0);
    }));
  });

  describe('productSearchControl null value branch', () => {
    it('should set productSearch to empty string when productSearchControl emits null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).productSearchControl.setValue(null);
      tick();
      expect((component as any).productSearch()).toBe('');
    }));
  });

  describe('ngOnDestroy and form control getters', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const nextSpy = spyOn((component as any).destroy$, 'next').and.callThrough();
      const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should expose pickSlipFormControls getter', () => {
      fixture.detectChanges();
      expect(component.pickSlipFormControls).toBeTruthy();
      expect(component.pickSlipFormControls.pickSlipId).toBeDefined();
    });

    it('should expose scanFormControls getter', () => {
      fixture.detectChanges();
      expect(component.scanFormControls).toBeTruthy();
      expect(component.scanFormControls.productCode).toBeDefined();
    });
  });

  describe('headerConfig.actions optional chaining', () => {
    it('should handle undefined actions in updateHeaderActions gracefully', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.headerConfig = { ...component.headerConfig, actions: undefined };
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
      expect(component.headerConfig.actions).toBeUndefined();
    }));
  });

  describe('pickSlipSearchControl null value branch', () => {
    it('should set pickSlipSearch to empty string when control emits null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      (component as any).pickSlipSearchControl.setValue(null);
      tick();
      expect((component as any).pickSlipSearch()).toBe('');
    }));
  });

  describe('formatDateDisplay — null and invalid date branches', () => {
    it('should display dash when selected pick slip dateTime is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlips.set([{ pickSlipId: 'PS-NULL', dateTime: null as any, totalProducts: 5 }]);
      component.pickSlipForm.patchValue({ pickSlipId: 'PS-NULL' });
      tick();
      expect(component.selectedPickSlipDateTime()).toBe('-');
    }));

    it('should display raw string when dateTime is not a valid ISO date', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlips.set([{ pickSlipId: 'PS-BAD', dateTime: 'NOT_A_DATE', totalProducts: 5 }]);
      component.pickSlipForm.patchValue({ pickSlipId: 'PS-BAD' });
      tick();
      expect(component.selectedPickSlipDateTime()).toBe('NOT_A_DATE');
    }));
  });

  describe('selectedProductDisplay computed branches', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should return empty string when no product code is selected', () => {
      (component as any).productValue.set(null);
      expect((component as any).selectedProductDisplay()).toBe('');
    });

    it('should return raw code when selected code does not match any option', () => {
      component.productOptions.set([{ code: 'E0701V00', description: 'WB', productType: 'WB', aboRh: '', expirationDate: '' }]);
      (component as any).productValue.set('UNKNOWN_CODE');
      expect((component as any).selectedProductDisplay()).toBe('UNKNOWN_CODE');
    });

    it('should return code without description when description is empty', () => {
      component.productOptions.set([{ code: 'E0701V00', description: '', productType: 'WB', aboRh: '', expirationDate: '' }]);
      (component as any).productValue.set('E0701V00');
      expect((component as any).selectedProductDisplay()).toBe('E0701V00');
    });

    it('should return code with description when both are present', () => {
      component.productOptions.set([{ code: 'E0701V00', description: 'WB', productType: 'WB', aboRh: '', expirationDate: '' }]);
      (component as any).productValue.set('E0701V00');
      expect((component as any).selectedProductDisplay()).toBe('E0701V00 - WB');
    });
  });

  describe('filteredProducts computed — search branch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should filter products by description when search term is entered', fakeAsync(() => {
      component.productOptions.set([
        { code: 'E0701V00', description: 'WB', productType: 'WB', aboRh: '', expirationDate: '' },
        { code: 'E0702V00', description: 'PRBCS', productType: 'PRBCS', aboRh: '', expirationDate: '' },
      ]);
      (component as any).productSearchControl.setValue('WB');
      tick();
      expect((component as any).filteredProducts().length).toBe(1);
      expect((component as any).filteredProducts()[0].code).toBe('E0701V00');
    }));

    it('should filter products with empty description using code match', fakeAsync(() => {
      component.productOptions.set([
        { code: 'E0701V00', description: '', productType: 'WB', aboRh: '', expirationDate: '' },
        { code: 'E0702V00', description: '', productType: 'PRBCS', aboRh: '', expirationDate: '' },
      ]);
      (component as any).productSearchControl.setValue('E0701');
      tick();
      expect((component as any).filteredProducts().length).toBe(1);
    }));
  });

  describe('filteredPickSlips — null pickSlipId branch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should handle null pickSlipId entries when filtering', fakeAsync(() => {
      component.pickSlips.set([
        { pickSlipId: null as any, dateTime: '2026-06-01T08:30:00', totalProducts: 0 },
        { pickSlipId: 'PO0000001234', dateTime: '2026-06-01T08:30:00', totalProducts: 5 },
      ]);
      (component as any).pickSlipSearchControl.setValue('PO');
      tick();
      expect((component as any).filteredPickSlips().some((ps: any) => ps.pickSlipId === 'PO0000001234')).toBeTrue();
    }));
  });

  describe('onUnitValidated — checkDigit branch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should set checkDigit from data when provided', fakeAsync(() => {
      (component as any).unitPickSlipProducts = [mockPickSlipProductApi];
      (component as any).currentParsedUnitId = 'W12345678901234';

      component.onUnitValidated({
        parsedUnitId: 'W12345678901234',
        manualUnitId: 'W12345678901234',
        checkDigit: '5',
      } as any);
      tick();

      expect(component.scanForm.get('checkDigit')?.value).toBe('5');
    }));
  });

  describe('displayUnitId ?? productId branch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.pickSlipForm.patchValue({ pickSlipId: 'PO0000001234' });
      tick();
    }));

    it('should use productId as unitId when displayUnitId is undefined', fakeAsync(() => {
      const product = {
        productId: 'W-FALLBACK',
        productCode: 'E0701V00',
        productType: 'WB',
        expirationDate: null,
        discardCode: 'OD',
        discardDescription: null,
        warehouseId: null,
        warehouseName: null,
        pickSlipId: null,
        moveDate: null,
        status: null,
        insertDate: '',
        insertUser: '',
        aboRh: null,
      } as any;

      serviceSpy.moveProductToOutdate.and.returnValue(
        of({ success: true, message: '1 Entries saved', statusCode: 201, data: { productId: 'W-FALLBACK', pickSlipClosed: false } })
      );

      (component as any).saveScannedProduct(product, undefined);
      tick();

      expect(component.scannedProducts()[0].unitId).toBe('W-FALLBACK');
    }));
  });

});
