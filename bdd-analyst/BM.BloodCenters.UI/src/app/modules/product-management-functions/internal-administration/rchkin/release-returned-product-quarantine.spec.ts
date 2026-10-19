import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { of, throwError, Subject } from 'rxjs';

import { ReleaseReturnedProductQuarantine } from './release-returned-product-quarantine';
import { ReleaseReturnedProductQuarantineService } from './services/release-returned-product-quarantine.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { FormControl, Validators } from '@angular/forms';
import { signal } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';

import { provideRouter } from '@angular/router';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ReturnAdviceHeaderDto,
  ReturnItemDto,
  ReturnItemRow,
  RejectCodeDto,
  ProcessReturnItemsResponseDto
} from './models/release-returned-product-quarantine.model';

describe('ReleaseReturnedProductQuarantine', () => {
  let component: ReleaseReturnedProductQuarantine;
  let fixture: ComponentFixture<ReleaseReturnedProductQuarantine>;
  let serviceSpy: jasmine.SpyObj<ReleaseReturnedProductQuarantineService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: any;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChangedSubject: Subject<void>;

  const mockReturnAdviceHeader: ReturnAdviceHeaderDto = {
    returnAdviceId: 'RA001234567',
    customerName: 'ABC Hospital',
    returnUserId: 'USER01',
    returnDate: '2026-05-15T14:30:00Z',
    adviceStatus: 'OP',
    unmovedItemCount: 2
  };

  const mockReturnItems: ReturnItemDto[] = [
    {
      unitId: 'W1234567890123',
      displayUnitId: 'W123456789012345',
      collDate: '2026-05-01T00:00:00Z',
      productCode: 'RBC01',
      aliquot: '00',
      returnAdviceId: 'RA001234567',
      returnReasonCode: 'EXP01',
      returnReasonDescription: 'Expired product',
      expDate: '2026-06-01T12:00:00Z',
      locationId: null,
      moveDate: null,
      checkDigit: '45',
      bloodType: 'O+',
      aboDescription: 'O Positive',
      productType: 'RBC',
      inventoryClass: 'DI',
      warehouseId: 'A'
    },
    {
      unitId: 'W9876543210987',
      displayUnitId: 'W987654321098789',
      collDate: '2026-05-02T00:00:00Z',
      productCode: 'PLT01',
      aliquot: '00',
      returnAdviceId: 'RA001234567',
      returnReasonCode: 'DMG01',
      returnReasonDescription: 'Product damaged',
      expDate: '2026-06-02T12:00:00Z',
      locationId: null,
      moveDate: null,
      checkDigit: '89',
      bloodType: 'A+',
      aboDescription: 'A Positive',
      productType: 'PLT',
      inventoryClass: 'DI',
      warehouseId: 'A'
    }
  ];

  const mockRejectCodes: RejectCodeDto[] = [
    { code: 'EXP01', description: 'Expired product' },
    { code: 'DMG01', description: 'Product damaged' },
    { code: 'QC001', description: 'Failed quality control' }
  ];

  const mockProcessResponse: ProcessReturnItemsResponseDto = {
    totalProcessed: 2,
    restockedCount: 1,
    discardedCount: 1,
    failedCount: 0,
    processedItems: [
      { unitId: 'W1234567890123', action: 'RESTOCK', success: true, locationId: 'AF010101T12345' },
      { unitId: 'W9876543210987', action: 'DISCARD', success: true, locationId: 'DISCARD-BIN' }
    ]
  };

  function createRow(overrides: Partial<ReturnItemRow> = {}): ReturnItemRow {
    return {
      ...mockReturnItems[0],
      selectRestock: null,
      selectedWarehouseId: null,
      selectedDeviceType: null,
      selectedDeviceNumber: null,
      selectedRackNumber: null,
      selectedShelfNumber: null,
      selectedTrayId: null,
      selectedRejectCode: null,
      isValidForRestock: false,
      validationError: null,
      isProcessing: false,
      ...overrides
    } as ReturnItemRow;
  }

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('ReleaseReturnedProductQuarantineService', [
      'getReturnAdviceHeader', 'getReturnItems', 'getRejectCodes',
      'validateProductForRestock', 'processReturnItems',
      'getDevices', 'getRacks', 'getTrays', 'searchReturnAdvices'
    ]);

    snackbarSpy = createMockSnackbarService();

    headerServiceSpy = jasmine.createSpyObj('HeaderService', [
      'getCurrentChapterId', 'getCurrentWarehouseId', 'getCurrentChapterName',
      'getCurrentChapterTimezone', 'getCurrentUsername',
      'fetchSystemUser', 'fetchSystemUserByEmail', 'loadUserData',
      'updateChapterAndWarehouse', 'updateHeaderConfig',
      'updateHeaderFromApiResponse', 'loadInstitutionLogo',
      'clearCookies', 'clearSession', 'loadFromCookies'
    ]);
    headerServiceSpy.chapterChanged$ = chapterChangedSubject.asObservable();
    headerServiceSpy.getCurrentWarehouseId.and.returnValue('WH01');
    headerServiceSpy.getCurrentChapterId.and.returnValue('TST');

    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal({ title: 'Release Returned Product Quarantine', subtitle: 'Test subtitle' })
    });

    serviceSpy.getRejectCodes.and.returnValue(of(mockRejectCodes));
    serviceSpy.getReturnAdviceHeader.and.returnValue(of(mockReturnAdviceHeader));
    serviceSpy.getReturnItems.and.returnValue(of({ items: mockReturnItems, totalCount: 2 }));
    serviceSpy.processReturnItems.and.returnValue(of(mockProcessResponse));
    serviceSpy.getDevices.and.returnValue(of([
      { deviceNumber: '01', deviceType: 'F', description: 'Freezer 01' },
      { deviceNumber: '02', deviceType: 'R', description: 'Refrigerator 02' }
    ]));
    serviceSpy.getRacks.and.returnValue(of([
      { rackNumber: 'R01', description: 'Rack 01' }
    ]));
    serviceSpy.getTrays.and.returnValue(of([
      { trayNumber: 'T001', shelfNumber: 'S01', description: 'Tray 1', isFull: 'N' },
      { trayNumber: 'T002', shelfNumber: 'S02', description: 'Tray 2', isFull: 'Y' }
    ]));
    serviceSpy.searchReturnAdvices.and.returnValue(of([
      { returnAdviceId: 'RA001234567', customerName: 'ABC Hospital', unmovedItemCount: 2 }
    ]));
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [ReleaseReturnedProductQuarantine, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: ReleaseReturnedProductQuarantineService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    });

    fixture = TestBed.createComponent(ReleaseReturnedProductQuarantine);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load reject codes on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(serviceSpy.getRejectCodes).toHaveBeenCalled();
      expect((component as any).rejectCodes()).toEqual(mockRejectCodes);
    }));

    it('should load return advices on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(serviceSpy.searchReturnAdvices).toHaveBeenCalledWith('', 'WH01');
    }));

    it('should handle reject codes load error', fakeAsync(() => {
      serviceSpy.getRejectCodes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();
      expect((component as any).error()).toBe('Failed to load rejection codes');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load rejection codes');
    }));

    it('should handle return advices load error', fakeAsync(() => {
      serviceSpy.searchReturnAdvices.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();
      expect((component as any).returnAdvices().length).toBe(0);
    }));
  });

  describe('Chapter changes', () => {
    it('should reset state and reload data on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.returnIdControl.setValue('RA001234567');
      (component as any).returnAdviceHeader.set(mockReturnAdviceHeader);
      (component as any).returnItems.set([createRow()]);
      (component as any).error.set('Some error');

      serviceSpy.getRejectCodes.calls.reset();
      serviceSpy.searchReturnAdvices.calls.reset();

      chapterChangedSubject.next();
      tick();

      expect(component.returnIdControl.value).toBeNull();
      expect((component as any).returnAdviceHeader()).toBeNull();
      expect((component as any).returnItems().length).toBe(0);
      expect((component as any).error()).toBeNull();
      expect(serviceSpy.getRejectCodes).toHaveBeenCalled();
      expect(serviceSpy.searchReturnAdvices).toHaveBeenCalled();
    }));
  });

  describe('RETRIEVE functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark control as touched and not call API if Return ID is empty', () => {
      component.returnIdControl.setValue('');
      component.onRetrieve();
      expect(component.returnIdControl.touched).toBe(true);
      expect(component.returnIdControl.invalid).toBe(true);
    });

    it('should not call API if trimmed value is empty', () => {
      component.returnIdControl.setValue('   ');
      component.returnIdControl.setErrors(null);
      component.onRetrieve();
      expect(serviceSpy.getReturnAdviceHeader).not.toHaveBeenCalled();
    });

    it('should fetch return advice header and items on valid retrieve', fakeAsync(() => {
      component.returnIdControl.setValue('RA001234567');
      component.onRetrieve();
      tick();

      expect(serviceSpy.getReturnAdviceHeader).toHaveBeenCalledWith('RA001234567', 'WH01');
      expect(serviceSpy.getReturnItems).toHaveBeenCalled();
      expect((component as any).returnAdviceHeader()).toEqual(mockReturnAdviceHeader);
      expect((component as any).returnItems().length).toBe(2);
    }));

    it('should handle header fetch error', fakeAsync(() => {
      serviceSpy.getReturnAdviceHeader.and.returnValue(throwError(() => ({
        error: { errorResponse: { error: 'Return slip not found' }, errorCode: '5712' }
      })));

      component.returnIdControl.setValue('RA999');
      component.onRetrieve();
      tick();

      expect((component as any).retrieving()).toBe(false);
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));

    it('should handle return items fetch error', fakeAsync(() => {
      serviceSpy.getReturnItems.and.returnValue(throwError(() => ({
        message: 'Network error'
      })));

      component.returnIdControl.setValue('RA001234567');
      component.onRetrieve();
      tick();

      expect((component as any).retrieving()).toBe(false);
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('CLEAR functionality', () => {
    it('should reset all form fields and state', () => {
      component.returnIdControl.setValue('RA001234567');
      (component as any).returnAdviceHeader.set(mockReturnAdviceHeader);
      (component as any).returnItems.set([createRow()]);
      (component as any).error.set('Some error');

      component.onClear();

      expect(component.returnIdControl.value).toBe(null);
      expect((component as any).returnAdviceHeader()).toBe(null);
      expect((component as any).returnItems().length).toBe(0);
      expect((component as any).error()).toBe(null);
    });
  });

  describe('CANCEL functionality', () => {
    it('should call onClear', () => {
      spyOn(component, 'onClear');
      component.onCancel();
      expect(component.onClear).toHaveBeenCalled();
    });
  });

  describe('Restock Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set restock Y, clear reject code, set warehouse, and load devices', () => {
      const row = createRow({ productType: 'RBC' });
      component.onRestockChange(row, 'Y');

      expect(row.selectRestock).toBe('Y');
      expect(row.selectedRejectCode).toBeNull();
      expect(row.selectedWarehouseId).toBe('WH01');
      expect(serviceSpy.getDevices).toHaveBeenCalledWith('RBC');
    });

    it('should set restock N and clear all location fields', () => {
      const row = createRow({
        selectRestock: 'Y',
        selectedWarehouseId: 'A',
        selectedDeviceType: 'F',
        selectedDeviceNumber: '01',
        selectedRackNumber: 'R01',
        selectedShelfNumber: 'S01',
        selectedTrayId: 'T001'
      });

      component.onRestockChange(row, 'N');

      expect(row.selectRestock).toBe('N');
      expect(row.selectedWarehouseId).toBeNull();
      expect(row.selectedDeviceType).toBeNull();
      expect(row.selectedDeviceNumber).toBeNull();
      expect(row.selectedRackNumber).toBeNull();
      expect(row.selectedShelfNumber).toBeNull();
      expect(row.selectedTrayId).toBeNull();
    });

    it('should not load devices when productType is empty', () => {
      const row = createRow({ productType: '' });
      serviceSpy.getDevices.calls.reset();
      component.onRestockChange(row, 'Y');
      expect(serviceSpy.getDevices).not.toHaveBeenCalled();
    });

    it('should handle device load error gracefully', fakeAsync(() => {
      serviceSpy.getDevices.and.returnValue(throwError(() => new Error('fail')));
      const row = createRow({ productType: 'RBC' });
      component.onRestockChange(row, 'Y');
      tick();
      expect(row.selectRestock).toBe('Y');
    }));
  });

  describe('onRejectCodeChange', () => {
    it('should set reject code on row', () => {
      fixture.detectChanges();
      const row = createRow({ selectRestock: 'N' });
      component.onRejectCodeChange(row, 'DMG01');
      expect(row.selectedRejectCode).toBe('DMG01');
    });
  });

  describe('onDeviceChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set device, clear rack/tray, find device type, and load racks', fakeAsync(() => {
      const row = createRow({
        selectRestock: 'Y',
        selectedWarehouseId: 'WH01',
        productType: 'RBC',
        bloodType: 'O+',
        inventoryClass: 'DI'
      });

      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const deviceMap = new Map();
      deviceMap.set(rowKey, [
        { deviceNumber: '01', deviceType: 'F', description: 'Freezer 01' }
      ]);
      (component as any).deviceOptionsMap.set(deviceMap);

      component.onDeviceChange(row, '01');
      tick();

      expect(row.selectedDeviceNumber).toBe('01');
      expect(row.selectedDeviceType).toBe('F');
      expect(row.selectedRackNumber).toBeNull();
      expect(row.selectedTrayId).toBeNull();
      expect(serviceSpy.getRacks).toHaveBeenCalled();
    }));

    it('should not load racks if device not found in options', () => {
      const row = createRow({ selectRestock: 'Y' });
      serviceSpy.getRacks.calls.reset();
      component.onDeviceChange(row, 'UNKNOWN');
      expect(serviceSpy.getRacks).not.toHaveBeenCalled();
    });
  });

  describe('onRackChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set rack, clear tray, and load trays', fakeAsync(() => {
      const row = createRow({
        selectRestock: 'Y',
        selectedDeviceType: 'F',
        selectedDeviceNumber: '01',
        productType: 'RBC',
        bloodType: 'O+',
        inventoryClass: 'DI'
      });

      component.onRackChange(row, 'R01');
      tick();

      expect(row.selectedRackNumber).toBe('R01');
      expect(row.selectedTrayId).toBeNull();
      expect(serviceSpy.getTrays).toHaveBeenCalled();
    }));

    it('should not load trays if device info is missing', () => {
      const row = createRow({ selectRestock: 'Y', selectedDeviceType: '', selectedDeviceNumber: '' });
      serviceSpy.getTrays.calls.reset();
      component.onRackChange(row, 'R01');
      expect(serviceSpy.getTrays).not.toHaveBeenCalled();
    });
  });

  describe('onTrayChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set tray and shelf from matched non-full tray option', () => {
      const row = createRow({
        selectRestock: 'Y',
        selectedDeviceType: 'F',
        selectedDeviceNumber: '01',
        selectedRackNumber: 'R01'
      });

      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const trayMap = new Map();
      trayMap.set(rowKey, [
        { trayNumber: 'T001', shelfNumber: 'S01', description: 'Tray 1', isFull: 'N' }
      ]);
      (component as any).trayOptionsMap.set(trayMap);

      component.onTrayChange(row, 'T001');

      expect(row.selectedTrayId).toBe('T001');
      expect(row.selectedShelfNumber).toBe('S01');
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should not set shelf when tray not found in options', () => {
      const row = createRow({ selectRestock: 'Y' });
      component.onTrayChange(row, 'UNKNOWN');
      expect(row.selectedTrayId).toBe('UNKNOWN');
      expect(row.selectedShelfNumber).toBeNull();
    });

    it('should open confirmation dialog when selecting a full tray', fakeAsync(() => {
      const dialogClosedSubject = new Subject<boolean>();
      dialogSpy.open.and.returnValue({ afterClosed: () => dialogClosedSubject.asObservable() } as any);

      const row = createRow({ selectRestock: 'Y' });
      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const trayMap = new Map();
      trayMap.set(rowKey, [
        { trayNumber: 'T001', shelfNumber: 'S01', description: 'Tray 1', isFull: 'Y' }
      ]);
      (component as any).trayOptionsMap.set(trayMap);

      component.onTrayChange(row, 'T001');

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.title).toBe('Tray Full');
      expect(dialogData.message).toBe('Tray is full. Use the same tray?');

      dialogClosedSubject.next(true);
      tick();

      expect(row.selectedTrayId).toBe('T001');
      expect(row.selectedShelfNumber).toBe('S01');
    }));

    it('should clear tray when user declines full tray confirmation', fakeAsync(() => {
      const dialogClosedSubject = new Subject<boolean>();
      dialogSpy.open.and.returnValue({ afterClosed: () => dialogClosedSubject.asObservable() } as any);

      const row = createRow({ selectRestock: 'Y' });
      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const trayMap = new Map();
      trayMap.set(rowKey, [
        { trayNumber: 'T001', shelfNumber: 'S01', description: 'Tray 1', isFull: 'Y' }
      ]);
      (component as any).trayOptionsMap.set(trayMap);

      component.onTrayChange(row, 'T001');

      dialogClosedSubject.next(false);
      tick();

      expect(row.selectedTrayId).toBeNull();
      expect(row.selectedShelfNumber).toBeNull();
    }));
  });

  describe('onSelectOpenedChange', () => {
    it('should clear search control when dropdown closes', () => {
      const ctrl = new FormControl('search text');
      component.onSelectOpenedChange(ctrl, false);
      expect(ctrl.value).toBe('');
    });

    it('should not clear search control when dropdown opens', () => {
      const ctrl = new FormControl('search text');
      component.onSelectOpenedChange(ctrl, true);
      expect(ctrl.value).toBe('search text');
    });
  });

  describe('onPageChange', () => {
    it('should update page and reload items', fakeAsync(() => {
      fixture.detectChanges();
      component.returnIdControl.setValue('RA001234567');

      const event: PageEvent = { pageIndex: 2, pageSize: 25, length: 100 };
      component.onPageChange(event);
      tick();

      expect((component as any).currentPage()).toBe(2);
      expect((component as any).pageSize()).toBe(25);
      expect(serviceSpy.getReturnItems).toHaveBeenCalled();
    }));

    it('should not reload if returnId is empty', fakeAsync(() => {
      fixture.detectChanges();
      serviceSpy.getReturnItems.calls.reset();

      component.returnIdControl.setValue('');
      const event: PageEvent = { pageIndex: 1, pageSize: 10, length: 0 };
      component.onPageChange(event);
      tick();

      expect(serviceSpy.getReturnItems).not.toHaveBeenCalled();
    }));
  });

  describe('Column Visibility', () => {
    it('should show warehouse columns when restock is Yes', () => {
      const row = createRow({ selectRestock: 'Y' });
      expect(component.isColumnVisible('warehouseId', row)).toBe(true);
      expect(component.isColumnVisible('deviceNumber', row)).toBe(true);
      expect(component.isColumnVisible('rackNumber', row)).toBe(true);
      expect(component.isColumnVisible('trayNumber', row)).toBe(true);
      expect(component.isColumnVisible('rejectionCode', row)).toBe(false);
    });

    it('should show rejection code column when restock is No', () => {
      const row = createRow({ selectRestock: 'N' });
      expect(component.isColumnVisible('rejectionCode', row)).toBe(true);
      expect(component.isColumnVisible('warehouseId', row)).toBe(false);
      expect(component.isColumnVisible('deviceNumber', row)).toBe(false);
    });

    it('should always show default columns', () => {
      const row = createRow({ selectRestock: 'Y' });
      expect(component.isColumnVisible('unitId', row)).toBe(true);
      expect(component.isColumnVisible('productCode', row)).toBe(true);
    });
  });

  describe('canSave computed', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no items', () => {
      (component as any).returnItems.set([]);
      expect((component as any).canSave()).toBe(false);
    });

    it('should return false when no items have restock selection', () => {
      (component as any).returnItems.set([createRow()]);
      (component as any).selectionVersion.update((v: number) => v + 1);
      expect((component as any).canSave()).toBe(false);
    });

    it('should return false when restock=N and no reject code', () => {
      const row = createRow({ selectRestock: 'N', selectedRejectCode: null });
      (component as any).returnItems.set([row]);
      (component as any).selectionVersion.update((v: number) => v + 1);
      expect((component as any).canSave()).toBe(false);
    });

    it('should return true when restock=N and reject code is set', () => {
      const row = createRow({ selectRestock: 'N', selectedRejectCode: 'DMG01' });
      (component as any).returnItems.set([row]);
      (component as any).selectionVersion.update((v: number) => v + 1);
      expect((component as any).canSave()).toBe(true);
    });

    it('should return false when restock=Y and no device selected', () => {
      const row = createRow({ selectRestock: 'Y', selectedDeviceNumber: null });
      (component as any).returnItems.set([row]);
      (component as any).selectionVersion.update((v: number) => v + 1);
      expect((component as any).canSave()).toBe(false);
    });

    it('should return true when restock=Y and device is selected', () => {
      const row = createRow({ selectRestock: 'Y', selectedDeviceNumber: '01' });
      (component as any).returnItems.set([row]);
      (component as any).selectionVersion.update((v: number) => v + 1);
      expect((component as any).canSave()).toBe(true);
    });

    it('should return false when mixed items and one is incomplete', () => {
      const row1 = createRow({ selectRestock: 'Y', selectedDeviceNumber: '01' });
      const row2 = createRow({ selectRestock: 'N', selectedRejectCode: null, unitId: 'W999' });
      (component as any).returnItems.set([row1, row2]);
      (component as any).selectionVersion.update((v: number) => v + 1);
      expect((component as any).canSave()).toBe(false);
    });
  });

  describe('SAVE functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when no items', () => {
      (component as any).returnItems.set([]);
      component.onSave();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('No items to process');
    });

    it('should show error when items have no restock selection', () => {
      (component as any).returnItems.set([createRow()]);
      component.onSave();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select Restock option for all items');
    });

    it('should process items successfully', fakeAsync(() => {
      const items = [
        createRow({ selectRestock: 'Y', selectedWarehouseId: 'A', selectedDeviceType: 'F', selectedDeviceNumber: '01', selectedRackNumber: 'R01', selectedShelfNumber: 'S01', selectedTrayId: 'T001' }),
        createRow({ selectRestock: 'N', selectedRejectCode: 'DMG01', unitId: 'W999', productCode: 'PLT01' })
      ];
      (component as any).returnItems.set(items);
      component.returnIdControl.setValue('RA001234567');

      component.onSave();
      tick();

      expect(serviceSpy.processReturnItems).toHaveBeenCalled();
      const callArgs = serviceSpy.processReturnItems.calls.mostRecent().args[0];
      expect(callArgs.items[0].restockFlag).toBe('Y');
      expect(callArgs.items[0].warehouseId).toBe('A');
      expect(callArgs.items[1].restockFlag).toBe('N');
      expect(callArgs.items[1].rejectCode).toBe('DMG01');
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should show error on partial failure', fakeAsync(() => {
      const partialResponse: ProcessReturnItemsResponseDto = {
        totalProcessed: 2, restockedCount: 1, discardedCount: 0, failedCount: 1,
        processedItems: []
      };
      serviceSpy.processReturnItems.and.returnValue(of(partialResponse));

      const items = [createRow({ selectRestock: 'Y', selectedDeviceNumber: '01' })];
      (component as any).returnItems.set(items);
      component.returnIdControl.setValue('RA001234567');

      component.onSave();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith(jasmine.stringContaining('Failed: 1'));
    }));

    it('should handle process error', fakeAsync(() => {
      serviceSpy.processReturnItems.and.returnValue(throwError(() => ({
        error: { errorCode: '0600', errorResponse: { errorCode: '0600', error: 'Commit failed' } }
      })));

      const items = [createRow({ selectRestock: 'N', selectedRejectCode: 'DMG01' })];
      (component as any).returnItems.set(items);
      component.returnIdControl.setValue('RA001234567');

      component.onSave();
      tick();

      expect((component as any).processing()).toBe(false);
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('getErrorMessage', () => {
    it('should extract errorResponse.error', () => {
      const err = { error: { errorResponse: { error: 'Specific error', errorCode: '1234' } } };
      const msg = (component as any).getErrorMessage(err);
      expect(msg).toContain('Specific error');
      expect(msg).toContain('1234');
    });

    it('should use ERROR_CODES mapping for known errorCode', () => {
      const err = { error: { errorCode: '5712' } };
      const msg = (component as any).getErrorMessage(err);
      expect(msg).toContain('5712');
    });

    it('should extract failedItems error message', () => {
      const err = { error: { failedItems: [{ errorMessage: 'Item failed' }] } };
      const msg = (component as any).getErrorMessage(err);
      expect(msg).toBe('Item failed');
    });

    it('should use error.message as fallback', () => {
      const err = { message: 'Generic error' };
      const msg = (component as any).getErrorMessage(err);
      expect(msg).toBe('Generic error');
    });

    it('should return default message when no details available', () => {
      const msg = (component as any).getErrorMessage({});
      expect(msg).toBe('An unexpected error occurred');
    });
  });

  describe('Dropdown row helpers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('getDevicesForRow should return devices for the row key', () => {
      const row = createRow();
      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const devices = [{ deviceNumber: '01', deviceType: 'F', description: 'Freezer' }];
      const map = new Map();
      map.set(rowKey, devices);
      (component as any).deviceOptionsMap.set(map);

      expect(component.getDevicesForRow(row as any)).toEqual(devices);
    });

    it('getDevicesForRow should filter by search term', () => {
      const row = createRow();
      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const devices = [
        { deviceNumber: '01', deviceType: 'F', description: 'Freezer' },
        { deviceNumber: '02', deviceType: 'R', description: 'Refrigerator' }
      ];
      const map = new Map();
      map.set(rowKey, devices);
      (component as any).deviceOptionsMap.set(map);

      component.deviceSearchCtrl.setValue('freez');
      const result = component.getDevicesForRow(row as any);
      expect(result.length).toBe(1);
      expect(result[0].deviceNumber).toBe('01');
    });

    it('getDevicesForRow should return empty array for unknown row', () => {
      const row = createRow({ unitId: 'UNKNOWN' });
      expect(component.getDevicesForRow(row as any)).toEqual([]);
    });

    it('getRacksForRow should return racks for the row key', () => {
      const row = createRow();
      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const racks = [{ rackNumber: 'R01', description: 'Rack 01' }];
      const map = new Map();
      map.set(rowKey, racks);
      (component as any).rackOptionsMap.set(map);

      expect(component.getRacksForRow(row as any)).toEqual(racks);
    });

    it('getRacksForRow should filter by search term', () => {
      const row = createRow();
      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const racks = [
        { rackNumber: 'R01', description: 'Top rack' },
        { rackNumber: 'R02', description: 'Bottom rack' }
      ];
      const map = new Map();
      map.set(rowKey, racks);
      (component as any).rackOptionsMap.set(map);

      component.rackSearchCtrl.setValue('top');
      const result = component.getRacksForRow(row as any);
      expect(result.length).toBe(1);
      expect(result[0].rackNumber).toBe('R01');
    });

    it('getTraysForRow should return trays for the row key', () => {
      const row = createRow();
      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const trays = [{ trayNumber: 'T001', shelfNumber: 'S01', description: 'Tray 1', isFull: 'N' }];
      const map = new Map();
      map.set(rowKey, trays);
      (component as any).trayOptionsMap.set(map);

      expect(component.getTraysForRow(row as any)).toEqual(trays);
    });

    it('getTraysForRow should filter by search term', () => {
      const row = createRow();
      const rowKey = `${row.unitId}-${row.productCode}-${row.aliquot}`;
      const trays = [
        { trayNumber: 'T001', shelfNumber: 'S01', description: 'Tray 1', isFull: 'N' },
        { trayNumber: 'T002', shelfNumber: 'S02', description: 'Tray 2', isFull: 'N' }
      ];
      const map = new Map();
      map.set(rowKey, trays);
      (component as any).trayOptionsMap.set(map);

      component.traySearchCtrl.setValue('T002');
      const result = component.getTraysForRow(row as any);
      expect(result.length).toBe(1);
      expect(result[0].trayNumber).toBe('T002');
    });
  });

  describe('Computed signals', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('filteredRejectCodes should filter by search term', fakeAsync(() => {
      tick();
      component.rejectCodeSearchCtrl.setValue('expired');
      tick();

      const filtered = (component as any).filteredRejectCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('EXP01');
    }));

    it('filteredRejectCodes should return all when no search term', fakeAsync(() => {
      tick();
      component.rejectCodeSearchCtrl.setValue('');
      tick();

      expect((component as any).filteredRejectCodes().length).toBe(3);
    }));

    it('filteredReturnAdvices should filter by search term', fakeAsync(() => {
      tick();
      component.returnIdSearchCtrl.setValue('ABC');
      tick();

      const filtered = (component as any).filteredReturnAdvices();
      expect(filtered.length).toBe(1);
    }));

    it('filteredReturnAdvices should return all when no search term', fakeAsync(() => {
      tick();
      component.returnIdSearchCtrl.setValue('');
      tick();

      expect((component as any).filteredReturnAdvices().length).toBe(1);
    }));

    it('isEmpty should return true when no items and not loading', () => {
      (component as any).returnItems.set([]);
      (component as any).loading.set(false);
      expect((component as any).isEmpty()).toBe(true);
    });

    it('isEmpty should return false when loading', () => {
      (component as any).returnItems.set([]);
      (component as any).loading.set(true);
      expect((component as any).isEmpty()).toBe(false);
    });

    it('hasData should reflect item count', () => {
      (component as any).returnItems.set([]);
      expect((component as any).hasData()).toBe(false);

      (component as any).returnItems.set([createRow()]);
      expect((component as any).hasData()).toBe(true);
    });

    it('hasReturnAdvice should reflect header presence', () => {
      (component as any).returnAdviceHeader.set(null);
      expect((component as any).hasReturnAdvice()).toBe(false);

      (component as any).returnAdviceHeader.set(mockReturnAdviceHeader);
      expect((component as any).hasReturnAdvice()).toBe(true);
    });
  });

  describe('Date Formatting', () => {
    it('should format date correctly in DD-MMM-YYYY format', () => {
      expect(component.formatDate('2026-05-15T14:30:00Z')).toBe('15-MAY-2026');
    });

    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return original string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should format datetime correctly in DD-MMM-YYYY HH:mm format', () => {
      const result = component.formatDateTime('2026-05-15T14:30:00Z');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4} \d{2}:\d{2}$/);
    });

    it('should return dash for null datetime', () => {
      expect(component.formatDateTime(null)).toBe('-');
    });

    it('should return dash for undefined datetime', () => {
      expect(component.formatDateTime(undefined)).toBe('-');
    });

    it('should return original string for invalid datetime', () => {
      expect(component.formatDateTime('invalid')).toBe('invalid');
    });
  });

  describe('getReturnReasonDisplay', () => {
    it('should return reason code and description from first item', () => {
      (component as any).returnItems.set([
        createRow({ returnReasonCode: 'EXP01', returnReasonDescription: 'Expired product' })
      ]);
      expect(component.getReturnReasonDisplay()).toBe('EXP01 - Expired product');
    });

    it('should return just code when description is empty', () => {
      (component as any).returnItems.set([
        createRow({ returnReasonCode: 'EXP01', returnReasonDescription: '' })
      ]);
      expect(component.getReturnReasonDisplay()).toBe('EXP01');
    });

    it('should return dash when no items', () => {
      (component as any).returnItems.set([]);
      expect(component.getReturnReasonDisplay()).toBe('-');
    });

    it('should return dash when first item has no reason code', () => {
      (component as any).returnItems.set([
        createRow({ returnReasonCode: null })
      ]);
      expect(component.getReturnReasonDisplay()).toBe('-');
    });
  });
});
