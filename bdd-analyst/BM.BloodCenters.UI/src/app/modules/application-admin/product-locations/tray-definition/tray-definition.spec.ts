import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { TrayDefinitionComponent } from './tray-definition';
import { TrayDefinitionService } from './services/tray-definition.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { TrayDefinitionFilterValue, TrayDto } from './models/tray-definition.model';
import { signal } from '@angular/core';
import { createMockSnackbarService, createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('TrayDefinitionComponent', () => {
  let component: TrayDefinitionComponent;
  let fixture: ComponentFixture<TrayDefinitionComponent>;
  let trayDefinitionServiceSpy: jasmine.SpyObj<TrayDefinitionService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let translateServiceSpy: jasmine.SpyObj<TranslateService>;

  // Subjects for controllable async behavior
  let chapterChangedSubject: Subject<void>;
  let applySubject: Subject<TrayDefinitionFilterValue>;
  let closeSubject: Subject<void>;
  let backdropSubject: Subject<MouseEvent>;

  // Mock overlay and overlayRef
  let mockOverlayRef: jasmine.SpyObj<any>;
  let mockOverlayService: any;

  const mockTrays: TrayDto[] = [
    {
      chapterId: '0001',
      trayNumber: '0001',
      trayDescription: 'Rbc tray',
      itemCount: 0,
      trayStatus: 'AV',
      productType: 'Whole Blood',
      effectiveDate: new Date('2025-01-11'),
      termDate: null,
      lastModifiedDate: new Date('2025-01-11T10:00:00Z')
    },
    {
      chapterId: '0001',
      trayNumber: '001',
      trayDescription: '001',
      itemCount: 0,
      trayStatus: 'IU',
      productType: 'Whole Blood',
      effectiveDate: new Date('2025-01-12'),
      termDate: null,
      lastModifiedDate: new Date('2025-01-12T10:00:00Z')
    }
  ];

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();
    applySubject = new Subject<TrayDefinitionFilterValue>();
    closeSubject = new Subject<void>();
    backdropSubject = new Subject<MouseEvent>();

    trayDefinitionServiceSpy = jasmine.createSpyObj('TrayDefinitionService', [
      'getAllTrays',
      'getTrayStatusLov'
    ]);
    headerServiceSpy = createMockHeaderService();
    // Add chapterChanged$ observable needed by incoming feature tests
    (headerServiceSpy as any).chapterChanged$ = chapterChangedSubject.asObservable();
    menuServiceSpy = jasmine.createSpyObj('MenuService', [
      'getMenuItemsSignal',
      'findMenuItemByPath'
    ]);
    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    menuServiceSpy.findMenuItemByPath.and.returnValue(undefined);

    snackbarServiceSpy = createMockSnackbarService();
    translateServiceSpy = createMockTranslateService();
    translateServiceSpy.instant.and.callFake((key: string) => key);

    trayDefinitionServiceSpy.getAllTrays.and.returnValue(
      of({ data: mockTrays, totalRecords: 2 })
    );
    trayDefinitionServiceSpy.getTrayStatusLov.and.returnValue(
      of([
        { code: 'AV', description: 'Available' },
        { code: 'IU', description: 'In Use' }
      ])
    );
    headerServiceSpy.getCurrentChapterId.and.returnValue('0001');
    headerServiceSpy.getCurrentChapterTimezone.and.returnValue('America/New_York');

    // Build overlay ref mock -- the Overlay service itself will be spied on
    // AFTER component creation (to target the actual injected instance).
    const mockComponentRef = {
      instance: {
        currentFilters: null,
        apply: applySubject,
        close: closeSubject
      },
      location: {
        nativeElement: document.createElement('div')
      }
    };

    mockOverlayRef = jasmine.createSpyObj('OverlayRef', [
      'attach', 'backdropClick', 'dispose'
    ]);
    mockOverlayRef.attach.and.returnValue(mockComponentRef);
    mockOverlayRef.backdropClick.and.returnValue(backdropSubject);

    // mockOverlayService is populated after component init in filter-panel beforeEach
    mockOverlayService = null;

    await TestBed.configureTestingModule({
      imports: [TrayDefinitionComponent, NoopAnimationsModule],
      providers: [
        { provide: TrayDefinitionService, useValue: trayDefinitionServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrayDefinitionComponent);
    component = fixture.componentInstance;
  });

  describe('Data Loading', () => {

    it('should update data source on successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.dataSource).toEqual(mockTrays);
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
    }));

    it('should handle load error', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      trayDefinitionServiceSpy.getAllTrays.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadData();
      tick();
      fixture.detectChanges();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should include errorCode in error message when present', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      trayDefinitionServiceSpy.getAllTrays.and.returnValue(
        throwError(() => ({ errorCode: '0500', message: 'Internal error' }))
      );

      component.loadData();
      tick();

      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBe('Error 0500: Internal error');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Error 0500: Internal error');
    }));

    it('should set isLoading to false after data loads', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.isLoading).toBe(false);
    }));
  });

  describe('Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should add search keyword to request state', () => {
      component.onSearch('test');

      expect(component.requestState.searchKeyword).toBe('test');
    });

    it('should delete search keyword when search text is empty', () => {
      component.requestState.searchKeyword = 'previous';
      component.onSearch('');

      expect(component.requestState.searchKeyword).toBeUndefined();
    });

    it('should delete search keyword when search text is whitespace only', () => {
      component.requestState.searchKeyword = 'previous';
      component.onSearch('   ');

      expect(component.requestState.searchKeyword).toBeUndefined();
    });

    it('should reset pagination to page 0 on search', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      component.onSearch('hello');

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should reload data after search', () => {
      const callsBefore = trayDefinitionServiceSpy.getAllTrays.calls.count();
      component.onSearch('test');
      expect(trayDefinitionServiceSpy.getAllTrays.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  describe('Pagination and Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should update pagination settings on page change', () => {
      component.onPageChange({ pageSize: 10, pageIndex: 2, previousPageIndex: 1 });

      expect(component.tableConfig.pagination?.pageSize).toBe(10);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
    });

    it('should reload data after page change', () => {
      const callsBefore = trayDefinitionServiceSpy.getAllTrays.calls.count();
      component.onPageChange({ pageSize: 10, pageIndex: 1, previousPageIndex: 0 });
      expect(trayDefinitionServiceSpy.getAllTrays.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should update requestState sort column and order ascending', () => {
      component.onSort({ column: 'trayNumber', direction: 'A' });

      expect(component.requestState.sortColumn).toBe('trayNumber');
      expect(component.requestState.sortOrder).toBe('asc');
    });

    it('should update requestState sort column and order descending', () => {
      component.onSort({ column: 'trayDescription', direction: 'D' });

      expect(component.requestState.sortColumn).toBe('trayDescription');
      expect(component.requestState.sortOrder).toBe('desc');
    });

    it('should reload data after sort', () => {
      const callsBefore = trayDefinitionServiceSpy.getAllTrays.calls.count();
      component.onSort({ column: 'trayNumber', direction: 'A' });
      expect(trayDefinitionServiceSpy.getAllTrays.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  describe('Row Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should open edit panel on row action edit', () => {
      const tray = mockTrays[0];
      component.onRowAction({ action: 'edit', row: tray });

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(tray);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should not open panel for unknown action', () => {
      component.sidePanelOpen = false;
      component.onRowAction({ action: 'delete', row: mockTrays[0] });

      expect(component.sidePanelOpen).toBe(false);
    });
  });

  describe('Side Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should open add panel on onAddNew', () => {
      component.onAddNew();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should open edit panel on openEditPanel', () => {
      const tray = mockTrays[1];
      component.openEditPanel(tray);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(tray);
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should close side panel and clear data on onSidePanelClose', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockTrays[0];

      component.onSidePanelClose();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should reload data on onSaveSuccess', () => {
      const callsBefore = trayDefinitionServiceSpy.getAllTrays.calls.count();
      component.onSaveSuccess();
      expect(trayDefinitionServiceSpy.getAllTrays.calls.count()).toBeGreaterThan(callsBefore);
    });
  });

  describe('Status Description', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should return description for known status code', () => {
      expect(component.getStatusDescription('AV')).toBe('Available');
      expect(component.getStatusDescription('IU')).toBe('In Use');
    });

    it('should return the code itself for unknown status code', () => {
      expect(component.getStatusDescription('XX')).toBe('XX');
    });

    it('should return empty string when code is empty', () => {
      expect(component.getStatusDescription('')).toBe('');
    });
  });

  describe('Filter Chips', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should clear all filters on onClearFilters', () => {
      component.appliedFilters = {
        trayStatus: 'AV',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'trayStatus', label: 'Status: AV', value: 'AV' }];
      component.requestState.trayStatus = 'AV';

      component.onClearFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.trayStatus).toBeUndefined();
    });

    it('should reset pagination to page 0 on clear filters', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 5;
      }
      component.onClearFilters();
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should call clearFilters when onRemoveFilterChip results in null filters', () => {
      component.appliedFilters = {
        trayStatus: 'AV',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      spyOn(component as any, 'clearFilters').and.callThrough();
      component.onRemoveFilterChip('trayStatus');

      expect((component as any).clearFilters).toHaveBeenCalled();
      expect(component.appliedFilters).toBeNull();
    });

    it('should call applyFilters when onRemoveFilterChip results in non-null filters', () => {
      component.appliedFilters = {
        trayStatus: 'AV',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-01-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };

      spyOn(component as any, 'applyFilters').and.callThrough();
      component.onRemoveFilterChip('trayStatus');

      expect((component as any).applyFilters).toHaveBeenCalled();
      // trayStatus removed, effectiveDate remains
      expect(component.appliedFilters?.effectiveDate).toBeTruthy();
    });
  });

  describe('Apply Filters (private)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should set trayStatus in requestState when filter has trayStatus', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'AV',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      (component as any).applyFilters(filters);

      expect(component.requestState.trayStatus).toBe('AV');
    });

    it('should delete trayStatus from requestState when filter has no trayStatus', () => {
      component.requestState.trayStatus = 'AV';
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      (component as any).applyFilters(filters);

      expect(component.requestState.trayStatus).toBeUndefined();
    });

    it('should set effectiveDateTo when effectiveDate + Before period', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: 'Before',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      (component as any).applyFilters(filters);

      expect(component.requestState.effectiveDateTo).toBe('2024-06-01');
      expect(component.requestState.effectiveDateFrom).toBeUndefined();
    });

    it('should set effectiveDateFrom when effectiveDate + After period', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date('2024-06-01'),
        terminationDatePeriod: null,
        terminationDate: null
      };
      (component as any).applyFilters(filters);

      expect(component.requestState.effectiveDateFrom).toBe('2024-06-01');
      expect(component.requestState.effectiveDateTo).toBeUndefined();
    });

    it('should delete effectiveDate params when no effectiveDate filter', () => {
      component.requestState.effectiveDateFrom = '2024-01-01';
      component.requestState.effectiveDateTo = '2024-12-31';
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      (component as any).applyFilters(filters);

      expect(component.requestState.effectiveDateFrom).toBeUndefined();
      expect(component.requestState.effectiveDateTo).toBeUndefined();
    });

    it('should set terminationDateTo when terminationDate + Before period', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'Before',
        terminationDate: new Date('2024-12-31')
      };
      (component as any).applyFilters(filters);

      expect(component.requestState.terminationDateTo).toBe('2024-12-31');
      expect(component.requestState.terminationDateFrom).toBeUndefined();
    });

    it('should set terminationDateFrom when terminationDate + After period', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: 'After',
        terminationDate: new Date('2024-12-31')
      };
      (component as any).applyFilters(filters);

      expect(component.requestState.terminationDateFrom).toBe('2024-12-31');
      expect(component.requestState.terminationDateTo).toBeUndefined();
    });

    it('should delete terminationDate params when no terminationDate filter', () => {
      component.requestState.terminationDateFrom = '2024-01-01';
      component.requestState.terminationDateTo = '2024-12-31';
      const filters: TrayDefinitionFilterValue = {
        trayStatus: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      (component as any).applyFilters(filters);

      expect(component.requestState.terminationDateFrom).toBeUndefined();
      expect(component.requestState.terminationDateTo).toBeUndefined();
    });

    it('should update filterChips when applyFilters is called', () => {
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'AV',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      (component as any).applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
      expect(component.filterChips[0].key).toBe('trayStatus');
    });

    it('should reset to page 0 when applyFilters is called', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 3;
      }
      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'AV',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      (component as any).applyFilters(filters);

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('loadStatusOptions error', () => {
    it('should log error when getTrayStatusLov fails', fakeAsync(() => {
      trayDefinitionServiceSpy.getTrayStatusLov.and.returnValue(
        throwError(() => new Error('Status LOV Error'))
      );
      spyOn(console, 'error');

      fixture.detectChanges();
      tick();

      expect(console.error).toHaveBeenCalled();
    }));
  });

  describe('Chapter Change Handling', () => {
    it('should clear search, filters, and reload on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // Set some state before chapter change
      component.requestState.searchKeyword = 'test search';
      component.appliedFilters = {
        trayStatus: 'AV',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'trayStatus', label: 'Status: AV', value: 'AV' }];

      const loadCountBefore = trayDefinitionServiceSpy.getAllTrays.calls.count();

      // Trigger chapter change via Subject (no TestBed.resetTestingModule needed)
      chapterChangedSubject.next();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(trayDefinitionServiceSpy.getAllTrays.calls.count()).toBeGreaterThan(loadCountBefore);
    }));

    it('should call handleChapterChange directly and reset state', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState.searchKeyword = 'hello';
      component.appliedFilters = {
        trayStatus: 'IU',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };

      (component as any).handleChapterChange();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.requestState.searchKeyword).toBeUndefined();
    }));
  });

  describe('Filter Panel (onOpenFilter)', () => {
    // Spies installed on the component's actual overlay instance each test.
    let overlayCreateSpy: jasmine.Spy;
    let overlayPositionSpy: jasmine.Spy;

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // Get the ACTUAL Overlay instance the component injected (it may differ from
      // TestBed.inject(Overlay) when CDK is provided transitively by imported modules).
      const componentOverlay = (component as any).overlay;

      const mockPositionStrategy = {
        flexibleConnectedTo: function() { return this; },
        withPositions: function() { return this; },
        withFlexibleDimensions: function() { return this; },
        withPush: function() { return this; }
      };

      // Directly assign spy functions on the instance to shadow any prototype methods.
      overlayPositionSpy = jasmine.createSpy('position').and.returnValue({
        flexibleConnectedTo: () => mockPositionStrategy
      });
      overlayCreateSpy = jasmine.createSpy('create').and.returnValue(mockOverlayRef);

      componentOverlay.position = overlayPositionSpy;
      componentOverlay.create = overlayCreateSpy;
      componentOverlay.scrollStrategies = {
        reposition: jasmine.createSpy('reposition').and.returnValue({})
      };

      // Reset overlayRef spies for clean state
      mockOverlayRef.attach.calls.reset();
      mockOverlayRef.backdropClick.calls.reset();
    }));

    it('should open filter panel and set isFilterOpen to true', () => {
      component.onOpenFilter();

      expect(component.isFilterOpen).toBe(true);
      expect(overlayCreateSpy).toHaveBeenCalled();
      expect(mockOverlayRef.attach).toHaveBeenCalled();
    });

    it('should call position() and create() with scrollStrategy config', () => {
      component.onOpenFilter();

      expect(overlayPositionSpy).toHaveBeenCalled();
      expect(overlayCreateSpy).toHaveBeenCalledWith(
        jasmine.objectContaining({ hasBackdrop: true })
      );
    });

    it('should close filter panel when already open (toggle)', () => {
      // Pre-set open state
      component.isFilterOpen = true;
      (component as any).overlayRef = { dispose: jasmine.createSpy('dispose') };

      component.onOpenFilter();

      expect(component.isFilterOpen).toBe(false);
    });

    it('should apply filters and close panel when apply event emitted', () => {
      component.onOpenFilter();

      const filters: TrayDefinitionFilterValue = {
        trayStatus: 'AV',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      };
      applySubject.next(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.isFilterOpen).toBe(false);
    });

    it('should close filter panel when close event emitted', () => {
      component.onOpenFilter();

      closeSubject.next();

      expect(component.isFilterOpen).toBe(false);
    });

    it('should close filter panel when backdrop is clicked', () => {
      component.onOpenFilter();

      backdropSubject.next(new MouseEvent('click'));

      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('MenuService integration', () => {
    it('should update header config when menu items are available', fakeAsync(() => {
      menuServiceSpy.getMenuItemsSignal.and.returnValue(
        signal([{ label: 'Tray Definition', remarks: 'Manage trays', path: '/tray-definition' }])
      );
      menuServiceSpy.findMenuItemByPath.and.returnValue({
        label: 'Tray Definition',
        remarks: 'Manage trays',
        path: '/tray-definition'
      });

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component.headerConfig.title).toBe('Tray Definition');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should dispose overlay ref if open on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const mockRef = { dispose: jasmine.createSpy('dispose') };
      (component as any).overlayRef = mockRef;

      fixture.destroy();

      expect(mockRef.dispose).toHaveBeenCalled();
    }));

    it('should not throw when no overlay ref exists on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      (component as any).overlayRef = null;
      expect(() => fixture.destroy()).not.toThrow();
    }));
  });
});
