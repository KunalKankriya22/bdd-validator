import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ProductStorageDefinitionComponent } from './product-storage-definition';
import { ProductStorageDefinitionService } from './services/product-storage-definition.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { provideHttpClient } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router, NavigationEnd } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ProductStorageListDto } from './models/product-storage-definition.model';

describe('ProductStorageDefinitionComponent', () => {
  let component: ProductStorageDefinitionComponent;
  let fixture: ComponentFixture<ProductStorageDefinitionComponent>;
  let mockService: jasmine.SpyObj<ProductStorageDefinitionService>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let chapterChangedSubject: Subject<void>;
  let backdropClickSubject: Subject<MouseEvent>;

  const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [], total: 0 };
  const lovWithData = {
    success: true, message: '', error: null, statusCode: 200,
    data: [{ code: 'RBC', description: 'Red Blood Cells' }], total: 1
  };
  const listResponse = { data: [], totalRecords: 0 };

  const mockRow: ProductStorageListDto = {
    productType: 'RBC',
    warehouseId: 'A',
    warehouseDescription: 'Main Warehouse',
    deviceType: 'F',
    deviceDescription: 'Freezer',
    number: '01',
    trayCapacity: '12',
    effectiveDate: '15-JAN-2026',
    terminationDate: null,
    lastModifiedDate: null
  };

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();
    backdropClickSubject = new Subject<MouseEvent>();

    mockService = jasmine.createSpyObj('ProductStorageDefinitionService', [
      'getProductStorageList', 'getProductTypeLov', 'getWarehouseLov',
      'getDeviceTypeLov'
    ]);
    mockService.getProductStorageList.and.returnValue(of(listResponse));
    mockService.getProductTypeLov.and.returnValue(of(lovResponse));
    mockService.getWarehouseLov.and.returnValue(of(lovResponse));
    mockService.getDeviceTypeLov.and.returnValue(of(lovResponse));

    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    const mockPositionStrategy = {
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withFlexibleDimensions: jasmine.createSpy('withFlexibleDimensions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);
    mockOverlay.scrollStrategies = {
      reposition: jasmine.createSpy('reposition').and.returnValue({})
    } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);

    await TestBed.configureTestingModule({
      imports: [ProductStorageDefinitionComponent, BrowserAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: ProductStorageDefinitionService, useValue: mockService },
        { provide: Overlay, useValue: mockOverlay },
        {
          provide: HeaderService,
          useValue: {
            chapterTimeZone: () => '+00:00',
            chapterChanged$: chapterChangedSubject.asObservable()
          }
        },
        {
          provide: PageHeaderService,
          useValue: {
            pageHeaderData: signal(undefined),
            getTitle: () => undefined,
            getSubtitle: () => undefined
          }
        },
        {
          provide: Router,
          useValue: {
            url: '/',
            navigate: jasmine.createSpy('navigate'),
            events: of(new NavigationEnd(0, '/', '/'))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductStorageDefinitionComponent);
    component = fixture.componentInstance;
  });

  it('should initialize search config with correct placeholder', () => {
    fixture.detectChanges();
    expect(component.searchConfig.placeholder).toBe('Search by product type or warehouse');
  });

  // ─── ngOnInit ────────────────────────────────────────────────────────────────

  describe('ngOnInit', () => {
    it('should load LOV dropdowns', () => {
      fixture.detectChanges();
      expect(mockService.getProductTypeLov).toHaveBeenCalled();
      expect(mockService.getWarehouseLov).toHaveBeenCalled();
      expect(mockService.getDeviceTypeLov).toHaveBeenCalled();
    });

    it('should handle LOV errors gracefully', () => {
      mockService.getProductTypeLov.and.returnValue(throwError(() => new Error('fail')));
      mockService.getWarehouseLov.and.returnValue(throwError(() => new Error('fail')));
      mockService.getDeviceTypeLov.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(component.productTypeLovOptions().length).toBe(0);
      expect(component.warehouseLovOptions().length).toBe(0);
      expect(component.deviceTypeLovOptions().length).toBe(0);
    });
  });

  // ─── loadData ────────────────────────────────────────────────────────────────

  describe('loadData', () => {
    it('should pass searchKeyword in query', fakeAsync(() => {
      fixture.detectChanges();
      component.searchText = 'rbc';
      component['loadData']();
      tick();
      const args = mockService.getProductStorageList.calls.mostRecent().args;
      expect(args[2].searchKeyword).toBe('rbc');
    }));

    it('should pass applied filters in query', fakeAsync(() => {
      fixture.detectChanges();
      component.appliedFilters = {
        productType: 'RBC', warehouseCode: 'A', deviceType: 'F',
        effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null
      };
      component['loadData']();
      tick();
      const args = mockService.getProductStorageList.calls.mostRecent().args;
      expect(args[2].productType).toBe('RBC');
      expect(args[2].warehouseId).toBe('A');
      expect(args[2].deviceType).toBe('F');
    }));
  });

  // ─── onSearch ────────────────────────────────────────────────────────────────

  describe('onSearch', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should call loadData after search', () => {
      const callsBefore = mockService.getProductStorageList.calls.count();
      component.onSearch('test');
      expect(mockService.getProductStorageList.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should set empty string for blank search', () => {
      component.onSearch('   ');
      expect(component.searchText).toBe('');
    });
  });

  // ─── onPageChange ────────────────────────────────────────────────────────────

  describe('onPageChange', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should call loadData after page change', () => {
      const callsBefore = mockService.getProductStorageList.calls.count();
      component.onPageChange({ pageIndex: 1, pageSize: 25, previousPageIndex: 0 });
      expect(mockService.getProductStorageList.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  // ─── onRowAction ─────────────────────────────────────────────────────────────

  describe('onRowAction', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should not crash on unknown action', () => {
      expect(() => component.onRowAction({ action: 'unknown', row: mockRow })).not.toThrow();
    });
  });

  // ─── side panel ──────────────────────────────────────────────────────────────

  describe('openAddPanel', () => {
    it('should set add mode and open panel', () => {
      component.openAddPanel();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('openEditPanel', () => {
    it('should set edit mode with row data and open panel', () => {
      component.openEditPanel(mockRow);
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockRow);
    });
  });

  describe('onSaveSuccess', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should reload data without closing panel', () => {
      component.sidePanelOpen = true;
      const callsBefore = mockService.getProductStorageList.calls.count();
      component.onSaveSuccess();
      expect(component.sidePanelOpen).toBe(true);
      expect(mockService.getProductStorageList.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  // ─── filter chips ─────────────────────────────────────────────────────────────

  describe('onRemoveChip', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.appliedFilters = {
        productType: 'RBC', warehouseCode: null, deviceType: null,
        effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null
      };
      component.filterChips = [{ key: 'productType', label: 'Product Type: RBC', value: 'RBC' }];
    });

    it('should reload data after removing chip', () => {
      const callsBefore = mockService.getProductStorageList.calls.count();
      component.onRemoveChip('productType');
      expect(mockService.getProductStorageList.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  describe('onClearAllChips', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.appliedFilters = {
        productType: 'RBC', warehouseCode: 'A', deviceType: null,
        effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null
      };
      component.filterChips = [
        { key: 'productType', label: 'Product Type: RBC', value: 'RBC' },
        { key: 'warehouseCode', label: 'Warehouse: A', value: 'A' }
      ];
    });

    it('should reload data', () => {
      const callsBefore = mockService.getProductStorageList.calls.count();
      component.onClearAllChips();
      expect(mockService.getProductStorageList.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  // ─── closeSidePanel ────────────────────────────────────────────

  describe('closeSidePanel', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should close the side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockRow;
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });
  });

  // ─── onRowAction - edit ───────────────────────────────────────────

  describe('onRowAction - edit', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should open edit panel for edit action', () => {
      component.onRowAction({ action: 'edit', row: mockRow });
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockRow);
      expect(component.sidePanelOpen).toBe(true);
    });
  });

  // ─── onSortChange ────────────────────────────────────────────────

  describe('onSortChange', () => {
    it('should not throw on sort change', () => {
      fixture.detectChanges();
      expect(() => component.onSortChange({ column: 'productType', direction: 'asc' } as any)).not.toThrow();
    });
  });

  // ─── loadData error path ──────────────────────────────────────────

  describe('loadData error path', () => {
    it('should reset dataSource and isLoading on error', fakeAsync(() => {
      const { throwError } = require('rxjs');
      mockService.getProductStorageList.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBe(false);
    }));
  });

  // ─── updateFilterOptionsFromData ──────────────────────────────────────────

  describe('updateFilterOptionsFromData (via loadData)', () => {
    it('should populate filter options from loaded data', fakeAsync(() => {
      const data = [
        { ...mockRow, productType: 'RBC', warehouseId: 'A', warehouseDescription: 'Main', deviceType: 'F', deviceDescription: 'Freezer' },
        { ...mockRow, productType: 'PLT', warehouseId: 'B', warehouseDescription: 'Secondary', deviceType: 'R', deviceDescription: 'Refrigerator' }
      ];
      mockService.getProductStorageList.and.returnValue(of({ data, totalRecords: 2 }));
      fixture.detectChanges();
      tick();
      expect(component.filterProductTypeOptions().length).toBe(2);
      expect(component.filterWarehouseOptions().length).toBe(2);
      expect(component.filterDeviceTypeOptions().length).toBe(2);
    }));

    it('should deduplicate product types', fakeAsync(() => {
      const data = [
        { ...mockRow, productType: 'RBC', warehouseId: 'A', deviceType: 'F' },
        { ...mockRow, productType: 'RBC', warehouseId: 'B', deviceType: 'R' }
      ];
      mockService.getProductStorageList.and.returnValue(of({ data, totalRecords: 2 }));
      fixture.detectChanges();
      tick();
      expect(component.filterProductTypeOptions().length).toBe(1);
    }));
  });

  // ─── keyboard shortcuts ────────────────────────────────────────────

  describe('handleKeyboardShortcuts', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should open add panel on Alt+C when panel is closed', () => {
      component.sidePanelOpen = false;
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      component.handleKeyboardShortcuts(event);
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
    });

    it('should not open add panel on Alt+C when panel is already open', () => {
      component.sidePanelOpen = true;
      component.sidePanelMode = 'edit';
      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      component.handleKeyboardShortcuts(event);
      expect(component.sidePanelMode).toBe('edit');
    });

    it('should close side panel on Escape when filter panel is not open', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockRow;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardShortcuts(event);
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should not crash on unrelated keys', () => {
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      expect(() => component.handleKeyboardShortcuts(event)).not.toThrow();
    });
  });

  // ─── formatDateTimePST (via column formatter) ────────────────────────────────

  describe('formatDateTimePST', () => {
    it('should format ISO date correctly via column valueFormatter', () => {
      fixture.detectChanges();
      const col = component.tableConfig.columns.find(c => c.key === 'lastModifiedDate');
      expect(col?.valueFormatter).toBeTruthy();
      const result = col!.valueFormatter!('2026-03-15T10:00:00Z');
      expect(result).toMatch(/15-MAR-2026/);
    });

    it('should return "-" for null via column valueFormatter', () => {
      fixture.detectChanges();
      const col = component.tableConfig.columns.find(c => c.key === 'lastModifiedDate');
      const result = col!.valueFormatter!(null as any);
      expect(result).toBe('-');
    });
  });

  // ─── chapter change subscription ─────────────────────────────────────────────

  describe('chapter change subscription', () => {
    it('should reset searchText and reload on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      component.searchText = 'test';
      component.sidePanelOpen = true;
      const callsBefore = mockService.getProductStorageList.calls.count();

      chapterChangedSubject.next();
      tick();

      expect(component.searchText).toBe('');
      expect(component.sidePanelOpen).toBe(false);
      expect(mockService.getProductStorageList.calls.count()).toBeGreaterThan(callsBefore);
    }));

    it('should reset LOV options on chapter change and reload them', fakeAsync(() => {
      fixture.detectChanges();
      component.productTypeLovOptions.set([{ code: 'RBC', description: 'Red Blood Cells' }]);

      chapterChangedSubject.next();
      tick();

      expect(mockService.getProductTypeLov.calls.count()).toBeGreaterThan(1);
    }));
  });

  // ─── ngOnDestroy ─────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions without error', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
