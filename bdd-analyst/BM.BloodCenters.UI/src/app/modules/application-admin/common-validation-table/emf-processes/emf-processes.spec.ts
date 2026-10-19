import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, ChangeDetectorRef, signal } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { DefineProcessCodesComponent, ProcessCode, ProcessCodesFilterValue } from './emf-processes';
import { EmfProcessesService } from './services/emf-processes.service';
import { PageHeaderService } from '@shared/services/page-header.service';

describe('DefineProcessCodesComponent', () => {
  let component: DefineProcessCodesComponent;
  let fixture: ComponentFixture<DefineProcessCodesComponent>;

  const mockProcessCodes: ProcessCode[] = [
    { procCode: 'PROC1', procDesc: 'Process One', effDate: '2025-01-01', termDate: '2026-12-31' },
    { procCode: 'PROC2', procDesc: 'Process Two', effDate: '2025-06-01' }
  ];

  // PageHeaderService needs a real signal for the effect() in constructor
  const pageHeaderDataSignal = signal(null);
  const mockPageHeaderService = { pageHeaderData: pageHeaderDataSignal };

  let mockEmfProcessesService: jasmine.SpyObj<EmfProcessesService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockCdr: jasmine.SpyObj<ChangeDetectorRef>;

  // Overlay mocks
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockPositionStrategy: any;
  let mockPosition: any;
  let mockOverlay: any;

  beforeEach(async () => {
    mockEmfProcessesService = jasmine.createSpyObj('EmfProcessesService', ['getProcessCodes', 'getProcessCodeById']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockCdr = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges', 'markForCheck']);

    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(of());
    mockOverlayRef.attach.and.returnValue({ instance: { currentFilters: null, apply: of(), close: of() } } as any);

    mockPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy', ['withPositions', 'withPush']);
    mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);

    mockPosition = jasmine.createSpyObj('OverlayPositionBuilder', ['flexibleConnectedTo']);
    mockPosition.flexibleConnectedTo.and.returnValue(mockPositionStrategy);

    mockOverlay = jasmine.createSpyObj('Overlay', ['position', 'create', 'scrollStrategies']);
    mockOverlay.position.and.returnValue(mockPosition);
    mockOverlay.create.and.returnValue(mockOverlayRef);
    mockOverlay.scrollStrategies = { block: () => ({}) };

    mockEmfProcessesService.getProcessCodes.and.returnValue(of({ data: mockProcessCodes, totalRecords: 2 }));
    mockEmfProcessesService.getProcessCodeById.and.returnValue(of(mockProcessCodes[0]));

    await TestBed.configureTestingModule({
      imports: [DefineProcessCodesComponent, BrowserAnimationsModule],
      providers: [
        { provide: Overlay, useValue: mockOverlay },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: EmfProcessesService, useValue: mockEmfProcessesService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Router, useValue: mockRouter },
        { provide: ChangeDetectorRef, useValue: mockCdr }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(DefineProcessCodesComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(DefineProcessCodesComponent);
    component = fixture.componentInstance;
  });

  // ── Initialization ────────────────────────────────────────────────

  describe('Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should call loadData on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(mockEmfProcessesService.getProcessCodes).toHaveBeenCalled();
    }));
  });

  // ── loadData ──────────────────────────────────────────────────────

  describe('loadData', () => {
    it('should call getProcessCodes with correct pagination params', fakeAsync(() => {
      component.pageSize = 25;
      component.pageIndex = 2;
      fixture.detectChanges();
      tick();
      expect(mockEmfProcessesService.getProcessCodes).toHaveBeenCalledWith(25, 50, jasmine.any(Object));
    }));

    it('should set filteredProcessCodes and totalRecords from response', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.filteredProcessCodes).toEqual(mockProcessCodes);
      expect(component.totalRecords).toBe(2);
    }));

    it('should clear expandedRows after load', fakeAsync(() => {
      component.expandedRows.add('PROC1');
      fixture.detectChanges();
      tick();
      expect(component.expandedRows.size).toBe(0);
    }));

    it('should handle API error by setting empty array', fakeAsync(() => {
      mockEmfProcessesService.getProcessCodes.and.returnValue(throwError(() => new Error('Server error')));
      fixture.detectChanges();
      tick();
      expect(component.filteredProcessCodes).toEqual([]);
      expect(component.totalRecords).toBe(0);
    }));
  });

  // ── Search ────────────────────────────────────────────────────────

  describe('Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockEmfProcessesService.getProcessCodes.calls.reset();
    }));

    it('should set searchText, reset pageIndex, and call loadData', fakeAsync(() => {
      component.pageIndex = 3;
      component.onSearch('test query');
      tick();
      expect(component.searchText).toBe('test query');
      expect(component.pageIndex).toBe(0);
      expect(mockEmfProcessesService.getProcessCodes).toHaveBeenCalled();
    }));

    it('should clear searchText and reload on onSearchCleared', fakeAsync(() => {
      component.searchText = 'old query';
      component.onSearchCleared();
      tick();
      expect(component.searchText).toBe('');
      expect(component.pageIndex).toBe(0);
      expect(mockEmfProcessesService.getProcessCodes).toHaveBeenCalled();
    }));

    it('should pass searchText in API params', fakeAsync(() => {
      component.onSearch('PROC1');
      tick();
      const callArgs = mockEmfProcessesService.getProcessCodes.calls.mostRecent().args;
      expect(callArgs[2].searchText).toBe('PROC1');
    }));
  });

  // ── Pagination ────────────────────────────────────────────────────

  describe('Pagination', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockEmfProcessesService.getProcessCodes.calls.reset();
    }));

    it('should update pageIndex and pageSize from page event', fakeAsync(() => {
      component.onPageChange({ pageIndex: 3, pageSize: 50, length: 100 });
      tick();
      expect(component.pageIndex).toBe(3);
      expect(component.pageSize).toBe(50);
    }));

    it('should trigger loadData after page change', fakeAsync(() => {
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 100 });
      tick();
      expect(mockEmfProcessesService.getProcessCodes).toHaveBeenCalledWith(10, 10, jasmine.any(Object));
    }));
  });

  // ── Sorting ───────────────────────────────────────────────────────

  describe('Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockEmfProcessesService.getProcessCodes.calls.reset();
    }));

    it('should cycle sort direction: A -> D -> A', fakeAsync(() => {
      expect(component.sortDirection).toBe('A');
      component.onSort();
      tick();
      expect(component.sortDirection).toBe('D');
      component.onSort();
      tick();
      expect(component.sortDirection).toBe('A');
    }));

    it('should return arrow_downward icon for D sort', () => {
      component.sortDirection = 'D';
      expect(component.getSortIcon()).toBe('arrow_downward');
    });

    it('should return arrow_upward icon for A sort', () => {
      component.sortDirection = 'A';
      expect(component.getSortIcon()).toBe('arrow_upward');
    });
  });

  // ── Expand / Collapse ─────────────────────────────────────────────

  describe('Expand / Collapse', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should add procCode to expandedRows on toggleExpand', () => {
      component.toggleExpand('PROC1');
      expect(component.expandedRows.has('PROC1')).toBeTrue();
    });

    it('should remove procCode from expandedRows on second toggleExpand', () => {
      component.expandedRows.add('PROC1');
      component.toggleExpand('PROC1');
      expect(component.expandedRows.has('PROC1')).toBeFalse();
    });

    it('should expand all rows on toggleExpandAll', () => {
      component.toggleExpandAll();
      expect(component.allExpanded).toBeTrue();
      expect(component.expandedRows.size).toBe(mockProcessCodes.length);
      mockProcessCodes.forEach(item => {
        expect(component.expandedRows.has(item.procCode)).toBeTrue();
      });
    });

    it('should collapse all rows when toggleExpandAll called while already expanded', () => {
      component.allExpanded = true;
      component.filteredProcessCodes.forEach(item => component.expandedRows.add(item.procCode));

      component.toggleExpandAll();
      expect(component.allExpanded).toBeFalse();
      expect(component.expandedRows.size).toBe(0);
    });
  });

  // ── Filters ───────────────────────────────────────────────────────

  describe('Filters', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockEmfProcessesService.getProcessCodes.calls.reset();
    }));

    it('should clear effectiveDate filter pair on removeFilterChip', fakeAsync(() => {
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2026-12-31')
      };
      component.removeFilterChip('effectiveDate');
      tick();
      expect(component.appliedFilters!.effectiveDate).toBeNull();
      expect(component.appliedFilters!.effectiveDatePeriod).toBeNull();
      // terminationDate should remain
      expect(component.appliedFilters!.terminationDate).not.toBeNull();
    }));

    it('should clear terminationDate filter pair on removeFilterChip', fakeAsync(() => {
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2026-12-31')
      };
      component.removeFilterChip('terminationDate');
      tick();
      expect(component.appliedFilters!.terminationDate).toBeNull();
      expect(component.appliedFilters!.terminationDatePeriod).toBeNull();
      // effectiveDate should remain
      expect(component.appliedFilters!.effectiveDate).not.toBeNull();
    }));

    it('should reset all filters on clearAllFilters', fakeAsync(() => {
      component.appliedFilters = {
        effectiveDatePeriod: 'after',
        effectiveDate: new Date('2025-01-01'),
        terminationDatePeriod: 'before',
        terminationDate: new Date('2026-12-31')
      };
      component.filterChips = [{ key: 'effectiveDate', label: 'Effective Date', value: new Date(), removable: true }];

      component.clearAllFilters();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(mockEmfProcessesService.getProcessCodes).toHaveBeenCalled();
    }));

    it('should close filter panel on Escape keydown', fakeAsync(() => {
      // Simulate having an open overlay by setting the private overlayRef
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    }));
  });

  // ── Side Panel ────────────────────────────────────────────────────

  describe('Side Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      mockEmfProcessesService.getProcessCodes.calls.reset();
    }));

    it('should open panel in add mode on onAddNewProcessCode', () => {
      component.onAddNewProcessCode();
      expect(component.addPanelMode).toBe('add');
      expect(component.editData).toBeNull();
      expect(component.isAddPanelOpen).toBeTrue();
    });

    it('should open panel in edit mode with row data on onEditDetails', fakeAsync(() => {
      const item = mockProcessCodes[0];
      component.onEditDetails(item);
      tick();

      expect(component.addPanelMode).toBe('edit');
      expect(component.isAddPanelOpen).toBeTrue();
      expect(component.selectedProcCode).toBe('PROC1');
      expect(component.editData).toEqual(jasmine.objectContaining({
        code: 'PROC1',
        description: 'Process One'
      }));
    }));

    it('should close panel and clear state on onAddPanelCancel', () => {
      component.isAddPanelOpen = true;
      component.editData = { code: 'X', description: 'Y', rulesText: '', effectiveDate: '2025-01-01' };
      component.selectedProcCode = 'X';

      component.onAddPanelCancel();

      expect(component.isAddPanelOpen).toBeFalse();
      expect(component.editData).toBeNull();
      expect(component.selectedProcCode).toBeNull();
    });

    it('should reload data on onSaveSuccess', fakeAsync(() => {
      component.selectedProcCode = 'PROC1';
      component.onSaveSuccess();
      tick();
      expect(mockEmfProcessesService.getProcessCodes).toHaveBeenCalled();
    }));

    it('should force recreation when panel is already open on onAddNewProcessCode', () => {
      component.isAddPanelOpen = true;
      const cdrSpy = spyOn((component as any).cdr, 'detectChanges');
      component.onAddNewProcessCode();
      expect(cdrSpy).toHaveBeenCalled();
      expect(component.isAddPanelOpen).toBeTrue();
      expect(component.addPanelMode).toBe('add');
    });
  });

  // ── Menu and Navigation ───────────────────────────────────────────

  describe('Menu and Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should navigate to define-process route with queryParams on onDefineProcess', () => {
      const item = mockProcessCodes[0];
      component.onDefineProcess(item);
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        ['/application-administration/common-validation/emf-processes/define-process'],
        { queryParams: { code: 'PROC1' } }
      );
    });

    it('should navigate to mappings route on onViewEditMappings', () => {
      const item = mockProcessCodes[0];
      component.onViewEditMappings(item);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/mappings', 'PROC1']);
    });

    it('should clear selectedProcCode on onMenuClosed when no action triggered', () => {
      component.onMenuOpened(mockProcessCodes[0]);
      expect(component.selectedProcCode).toBe('PROC1');

      component.onMenuClosed();
      expect(component.selectedProcCode).toBeNull();
    });
  });

  // ── getTerminationDate ────────────────────────────────────────────

  describe('getTerminationDate', () => {
    it('should return dash for empty or whitespace termDate', () => {
      expect(component.getTerminationDate(undefined)).toBe('-');
      expect(component.getTerminationDate('')).toBe('-');
      expect(component.getTerminationDate('   ')).toBe('-');
    });

    it('should format valid date as DD-MMM-YYYY uppercase', () => {
      const result = component.getTerminationDate('2026-12-31');
      expect(result).toBe('31-DEC-2026');
    });
  });
});
