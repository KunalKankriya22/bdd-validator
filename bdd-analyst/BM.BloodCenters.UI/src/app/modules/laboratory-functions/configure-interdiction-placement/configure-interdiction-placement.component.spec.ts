import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';

import { ConfigureInterdictionPlacementComponent } from './configure-interdiction-placement.component';
import { ConfigureInterdictionPlacementService } from './configure-interdiction-placement.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockActivatedRoute, createMockHeaderService, createMockMatDialog, createMockPageHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  InterdictionPlacement,
  ActionFunctionNameLookup,
  ProductCodeLookup,
  ActionCodeLookup,
} from './configure-interdiction-placement.model';

describe('ConfigureInterdictionPlacementComponent', () => {
  let component: ConfigureInterdictionPlacementComponent;
  let fixture: ComponentFixture<ConfigureInterdictionPlacementComponent>;
  let serviceSpy: jasmine.SpyObj<ConfigureInterdictionPlacementService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderSpy: jasmine.SpyObj<PageHeaderService>;
  let headerSpy: jasmine.SpyObj<HeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChangedSubject: Subject<void>;

  const mockFunctionNames: ActionFunctionNameLookup[] = [
    { code: 'CPIREJ', description: 'CPI Rejection' },
    { code: 'CPICOM2', description: 'CPI Component 2' },
  ];

  const mockProductCodes: ProductCodeLookup[] = [
    { productCode: 'E0009', productDesc: 'Product 9' },
    { productCode: 'FFP', productDesc: 'Fresh Frozen Plasma' },
  ];

  const mockActionCodes: ActionCodeLookup[] = [
    { code: 'R01', codeDesc: 'Reject Code 1' },
  ];

  const mockFilterOptions = {
    productCodes: ['E0009', 'FFP'],
    otherProductCodes: ['CRYO', 'PLT'],
    actionCodes: ['R01', 'R02'],
  };

  const mockData: InterdictionPlacement[] = [
    {
      chapterId: 'CH01',
      actionFunctionName: 'CPIREJ',
      actionType: 'REJECT',
      actionProductCode: 'E0009',
      actionCode: null,
      interOnCurrentProd: 'Y',
      interOnOtherProds: null,
      interOnOtherProdTypes: null,
      interOnUnitLevel: 'Y',
      interAllProdButCurr: null,
      interCode: 'H001',
      effDate: '2025-01-01',
      termDate: null,
      insertDate: '2025-01-01',
      insertUser: 'testuser',
    },
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('ConfigureInterdictionPlacementService', [
      'getAll',
      'getActionFunctionNames',
      'getActionCodes',
      'getProductCodes',
      'getInterdictionCodes',
      'getProductTypes',
      'getFilterOptions',
      'create',
      'update',
      'delete',
    ]);
    snackbarSpy = createMockSnackbarService();
    pageHeaderSpy = createMockPageHeaderService();
    headerSpy = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    dialogSpy = createMockMatDialog();

    serviceSpy.getActionFunctionNames.and.returnValue(of(mockFunctionNames));
    serviceSpy.getAll.and.returnValue(of({ data: mockData, totalRecords: 1 }));
    serviceSpy.getProductCodes.and.returnValue(of(mockProductCodes));
    serviceSpy.getActionCodes.and.returnValue(of(mockActionCodes));
    serviceSpy.getInterdictionCodes.and.returnValue(of([]));
    serviceSpy.getProductTypes.and.returnValue(of([]));
    serviceSpy.getFilterOptions.and.returnValue(of(mockFilterOptions));
    (pageHeaderSpy as any).pageHeaderData = signal({
      title: 'Configure Interdiction Placement',
      subtitle: 'Manage interdiction placement',
    });



      TestBed.configureTestingModule({
      imports: [ConfigureInterdictionPlacementComponent, NoopAnimationsModule, MatDialogModule, TranslateModule.forRoot()],
      providers: [
        { provide: ConfigureInterdictionPlacementService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
      ],
    });
      serviceSpy.getActionFunctionNames.and.returnValue(of(mockFunctionNames));


      serviceSpy.getAll.and.returnValue(of({ data: mockData, totalRecords: 1 }));


      serviceSpy.getProductCodes.and.returnValue(of(mockProductCodes));


      serviceSpy.getActionCodes.and.returnValue(of(mockActionCodes));


      serviceSpy.getInterdictionCodes.and.returnValue(of([]));


      serviceSpy.getProductTypes.and.returnValue(of([]));


      serviceSpy.getFilterOptions.and.returnValue(of(mockFilterOptions));


    fixture = TestBed.createComponent(ConfigureInterdictionPlacementComponent);
    component = fixture.componentInstance;


    });


  describe('ngOnInit', () => {
    it('should load function names', () => {
      fixture.detectChanges();
      expect(serviceSpy.getActionFunctionNames).toHaveBeenCalled();
      expect((component as any).actionFunctionNames().length).toBe(2);
    });

    it('should not load data initially when no function selected', () => {
      fixture.detectChanges();
      expect(serviceSpy.getAll).not.toHaveBeenCalled();
      expect((component as any).dataSource.length).toBe(0);
    });
  });

  describe('loadData', () => {
    it('should return early when no function selected', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('');
      (component as any).loadData();
      tick();

      expect(serviceSpy.getAll).not.toHaveBeenCalled();
      expect((component as any).dataSource.length).toBe(0);
      expect((component as any).totalCount()).toBe(0);
    }));


  });

  describe('Function name selection', () => {
    it('should trigger data load when function name is selected', fakeAsync(() => {
      fixture.detectChanges();
      component.functionForm.patchValue({ functionName: 'CPICOM2' });
      tick();

      expect((component as any).selectedFunction()).toBe('CPICOM2');
      expect(serviceSpy.getAll).toHaveBeenCalled();
    }));

    it('should reset page index when function changes', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).currentPageIndex = 2;

      component.functionForm.patchValue({ functionName: 'CPIREJ' });
      tick();

      expect((component as any).currentPageIndex).toBe(0);
    }));
  });

  describe('Search functionality', () => {


    it('should load data for each search invocation when function selected', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).onSearch('FFP');
      tick();
      expect(serviceSpy.getAll).toHaveBeenCalledTimes(1);

      (component as any).onSearch('CRYO');
      tick();
      expect(serviceSpy.getAll).toHaveBeenCalledTimes(2);
    }));




  });

  describe('Chapter change', () => {
    it('should reset state and reload on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).currentPageIndex = 2;
      chapterChangedSubject.next();
      tick();

      expect((component as any).selectedFunction()).toBe('');
      expect((component as any).currentPageIndex).toBe(0);
      expect(serviceSpy.getActionFunctionNames).toHaveBeenCalledTimes(2);
    }));
  });

  describe('Side panel operations', () => {
    it('should open side panel in add mode and load lookups', () => {
      (component as any).openAddPanel();
      expect((component as any).sidePanelMode).toBe('add');
      expect((component as any).sidePanelData).toBeNull();
      expect((component as any).sidePanelOpen).toBe(true);
      expect(serviceSpy.getActionCodes).toHaveBeenCalled();
      expect(serviceSpy.getProductCodes).toHaveBeenCalled();
      expect(serviceSpy.getInterdictionCodes).toHaveBeenCalled();
      expect(serviceSpy.getProductTypes).toHaveBeenCalled();
    });

    it('should open side panel in edit mode with correct data and load lookups', () => {
      const record = mockData[0];

      (component as any).openEditPanel(record);

      expect((component as any).sidePanelMode).toBe('edit');
      expect((component as any).sidePanelData).toBe(record);
      expect((component as any).sidePanelOpen).toBe(true);
      expect(serviceSpy.getActionCodes).toHaveBeenCalled();
      expect(serviceSpy.getProductCodes).toHaveBeenCalled();
    });

    it('should reload side panel lookups on every open', () => {
      (component as any).openAddPanel();
      expect(serviceSpy.getActionCodes).toHaveBeenCalledTimes(1);

      (component as any).closeSidePanel();
      (component as any).openAddPanel();
      expect(serviceSpy.getActionCodes).toHaveBeenCalledTimes(2);
    });

    it('should load side panel lookups when opening panel', () => {
      fixture.detectChanges();

      (component as any).openAddPanel();

      expect(serviceSpy.getActionCodes).toHaveBeenCalled();
      expect(serviceSpy.getProductCodes).toHaveBeenCalled();
      expect(serviceSpy.getInterdictionCodes).toHaveBeenCalled();
      expect(serviceSpy.getProductTypes).toHaveBeenCalled();
    });



    it('should close side panel and reload data on save success but not filter options', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).sidePanelOpen = true;

      (component as any).onSaveSuccess('Record saved');
      tick();

      expect((component as any).sidePanelOpen).toBe(false);
      expect(serviceSpy.getAll).toHaveBeenCalled();
      expect(serviceSpy.getFilterOptions).not.toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Record saved');
    }));
  });

  describe('Filter operations', () => {
    it('should load filter options when opening filter panel', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).openFilter();
      tick();

      expect(serviceSpy.getFilterOptions).toHaveBeenCalledWith('CPIREJ');
      expect((component as any).filterOtherProductCodes().length).toBe(2);
      expect((component as any).filterActionCodes().length).toBe(2);
    }));








  });

  describe('Pagination', () => {
    it('should change page and reload data when function selected', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).onPageChange({ pageIndex: 1, pageSize: 25, length: 50 });
      tick();

      expect((component as any).currentPageIndex).toBe(1);
      expect((component as any).currentPageSize).toBe(25);
      expect(serviceSpy.getAll).toHaveBeenCalled();
    }));
  });

  describe('Sorting', () => {
    it('should set sort parameters and reload data when function selected', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).onSortChange({ column: 'actionFunctionName', direction: 'A' });
      tick();

      expect((component as any).sortColumn).toBe('actionFunctionName');
      expect((component as any).sortDirection).toBe('ASC');
      expect(serviceSpy.getAll).toHaveBeenCalled();
    }));


  });
  describe('Computed properties', () => {
    it('should compute hasActiveFilters as false when no filters', () => {
      (component as any).appliedFilters.set({});
      expect((component as any).hasActiveFilters()).toBe(false);
    });

    it('should compute hasActiveFilters as true when filters are set', () => {
      (component as any).appliedFilters.set({ currentProduct: 'E0009' });
      expect((component as any).hasActiveFilters()).toBe(true);
    });

    it('should compute hasActiveFilters for date filters', () => {
      (component as any).appliedFilters.set({ effectiveDate: '2025-01-01' });
      expect((component as any).hasActiveFilters()).toBe(true);
    });
  });

  describe('loadData error path', () => {
    it('should show snackbar error when getAll fails', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      serviceSpy.getAll.and.returnValue(throwError(() => ({ message: 'Server error' })));
      (component as any).loadData();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load interdiction placement data');
      expect((component as any).loading()).toBe(false);
      expect((component as any).error()).toBe('Server error');
    }));
  });

  describe('onSortChange default direction', () => {
    it('should reset sortColumn and sortDirection when direction is default', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).sortColumn = 'actionFunctionName';
      (component as any).sortDirection = 'DESC';

      (component as any).onSortChange({ column: 'actionFunctionName', direction: 'default' });
      tick();

      expect((component as any).sortColumn).toBe('');
      expect((component as any).sortDirection).toBe('ASC');
    }));
  });

  describe('onRowAction', () => {
    it('should open edit panel when action is edit', () => {
      fixture.detectChanges();
      const record = mockData[0];
      (component as any).onRowAction({ action: 'edit', row: record });

      expect((component as any).sidePanelMode).toBe('edit');
      expect((component as any).sidePanelData).toBe(record);
      expect((component as any).sidePanelOpen).toBe(true);
    });
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
    });

    it('should remove currentProduct filter', fakeAsync(() => {
      (component as any).appliedFilters.set({ currentProduct: 'Y', rejectCode: 'R01' });
      (component as any).onRemoveFilterChip('currentProduct');
      tick();

      const filters = (component as any).appliedFilters();
      expect(filters.currentProduct).toBeUndefined();
      expect(filters.rejectCode).toBe('R01');
    }));

    it('should remove otherProduct filter', fakeAsync(() => {
      (component as any).appliedFilters.set({ otherProduct: 'CRYO' });
      (component as any).onRemoveFilterChip('otherProduct');
      tick();

      expect((component as any).appliedFilters().otherProduct).toBeUndefined();
    }));

    it('should remove rejectCode filter', fakeAsync(() => {
      (component as any).appliedFilters.set({ rejectCode: 'R01' });
      (component as any).onRemoveFilterChip('rejectCode');
      tick();

      expect((component as any).appliedFilters().rejectCode).toBeUndefined();
    }));

    it('should remove effectiveDate and effectivePeriod filters', fakeAsync(() => {
      (component as any).appliedFilters.set({ effectiveDate: '2025-01-01', effectivePeriod: 'After' });
      (component as any).onRemoveFilterChip('effectiveDate');
      tick();

      const filters = (component as any).appliedFilters();
      expect(filters.effectiveDate).toBeUndefined();
      expect(filters.effectivePeriod).toBeUndefined();
    }));

    it('should remove terminationDate and terminationPeriod filters', fakeAsync(() => {
      (component as any).appliedFilters.set({ terminationDate: '2025-12-31', terminationPeriod: 'Before' });
      (component as any).onRemoveFilterChip('terminationDate');
      tick();

      const filters = (component as any).appliedFilters();
      expect(filters.terminationDate).toBeUndefined();
      expect(filters.terminationPeriod).toBeUndefined();
    }));
  });

  describe('clearAllFilters', () => {
    it('should clear all filters and reload data', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).appliedFilters.set({ currentProduct: 'Y', rejectCode: 'R01' });
      (component as any).filterChips = [{ key: 'currentProduct', label: 'Current Product: Yes', value: 'Y' }];
      (component as any).currentPageIndex = 3;

      (component as any).clearAllFilters();
      tick();

      expect((component as any).appliedFilters()).toEqual({});
      expect((component as any).filterChips.length).toBe(0);
      expect((component as any).currentPageIndex).toBe(0);
      expect(serviceSpy.getAll).toHaveBeenCalled();
    }));
  });

  describe('onFiltersApplied', () => {
    it('should set filters, generate chips, reset page and reload', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).currentPageIndex = 5;

      const filters = { currentProduct: 'Y', rejectCode: 'R01' };
      (component as any).onFiltersApplied(filters);
      tick();

      expect((component as any).appliedFilters()).toEqual(filters);
      expect((component as any).filterChips.length).toBe(2);
      expect((component as any).currentPageIndex).toBe(0);
      expect(serviceSpy.getAll).toHaveBeenCalled();
    }));

    it('should generate date filter chips with correct symbols', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');

      const filters = {
        effectiveDate: '2025-06-15',
        effectivePeriod: 'After',
        terminationDate: '2025-12-31',
        terminationPeriod: 'Before',
      };
      (component as any).onFiltersApplied(filters);
      tick();

      expect((component as any).filterChips.length).toBe(2);
      const effChip = (component as any).filterChips.find((c: any) => c.key === 'effectiveDate');
      expect(effChip.label).toContain('≥');
      const termChip = (component as any).filterChips.find((c: any) => c.key === 'terminationDate');
      expect(termChip.label).toContain('≤');
    }));

    it('should generate otherProduct chip', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');

      (component as any).onFiltersApplied({ otherProduct: 'CRYO' });
      tick();

      expect((component as any).filterChips.length).toBe(1);
      expect((component as any).filterChips[0].label).toContain('Other Product: CRYO');
    }));
  });

  describe('formatDate', () => {
    it('should return empty string for null or empty input', () => {
      expect((component as any).formatDate(null)).toBe('');
      expect((component as any).formatDate('')).toBe('');
    });

    it('should format a valid date string', () => {
      const result = (component as any).formatDate('2025-01-15');
      expect(result).toBe('15-JAN-2025');
    });
  });

  describe('loadActionFunctionNames error path', () => {
    it('should show snackbar error when getActionFunctionNames fails', fakeAsync(() => {
      serviceSpy.getActionFunctionNames.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadActionFunctionNames();
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load function names');
    }));
  });

  describe('loadFilterOptions with empty functionName', () => {
    it('should clear filter options when functionName is empty', () => {
      fixture.detectChanges();
      (component as any).filterOtherProductCodes.set([{ productCode: 'X', productDesc: '' }]);
      (component as any).filterActionCodes.set([{ code: 'Y', codeDesc: '' }]);

      (component as any).loadFilterOptions('');

      expect((component as any).filterOtherProductCodes()).toEqual([]);
      expect((component as any).filterActionCodes()).toEqual([]);
      expect(serviceSpy.getFilterOptions).not.toHaveBeenCalled();
    });
  });

  describe('onSaveAndCreateAnother', () => {
    it('should reload data and show success without closing panel', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).sidePanelOpen = true;

      (component as any).onSaveAndCreateAnother('Record created');
      tick();

      expect(serviceSpy.getAll).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Record created');
      expect((component as any).sidePanelOpen).toBe(true);
    }));
  });

  describe('loadData with date filters', () => {
    it('should include effDateFrom when effectivePeriod is After', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).appliedFilters.set({ effectiveDate: '2025-06-01', effectivePeriod: 'After' });
      (component as any).loadData();
      tick();

      const callArgs = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(callArgs.effDateFrom).toBe('2025-06-01');
      expect(callArgs.effDateTo).toBeUndefined();
    }));

    it('should include effDateTo when effectivePeriod is Before', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).appliedFilters.set({ effectiveDate: '2025-06-01', effectivePeriod: 'Before' });
      (component as any).loadData();
      tick();

      const callArgs = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(callArgs.effDateTo).toBe('2025-06-01');
      expect(callArgs.effDateFrom).toBeUndefined();
    }));

    it('should include termDateFrom when terminationPeriod is After', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).appliedFilters.set({ terminationDate: '2025-12-31', terminationPeriod: 'After' });
      (component as any).loadData();
      tick();

      const callArgs = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(callArgs.termDateFrom).toBe('2025-12-31');
      expect(callArgs.termDateTo).toBeUndefined();
    }));

    it('should include termDateTo when terminationPeriod is Before', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedFunction.set('CPIREJ');
      (component as any).appliedFilters.set({ terminationDate: '2025-12-31', terminationPeriod: 'Before' });
      (component as any).loadData();
      tick();

      const callArgs = serviceSpy.getAll.calls.mostRecent().args[2];
      expect(callArgs.termDateTo).toBe('2025-12-31');
      expect(callArgs.termDateFrom).toBeUndefined();
    }));
  });

  describe('loadSidePanelLookups error paths', () => {
    it('should handle error from getActionCodes gracefully', fakeAsync(() => {
      serviceSpy.getActionCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadSidePanelLookups();
      tick();

      expect((component as any).sidePanelLookupsLoading()).toBe(false);
    }));

    it('should handle error from getProductCodes gracefully', fakeAsync(() => {
      serviceSpy.getProductCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadSidePanelLookups();
      tick();

      expect((component as any).sidePanelLookupsLoading()).toBe(false);
    }));

    it('should handle error from getInterdictionCodes gracefully', fakeAsync(() => {
      serviceSpy.getInterdictionCodes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadSidePanelLookups();
      tick();

      expect((component as any).sidePanelLookupsLoading()).toBe(false);
    }));

    it('should handle error from getProductTypes gracefully', fakeAsync(() => {
      serviceSpy.getProductTypes.and.returnValue(throwError(() => new Error('fail')));
      (component as any).loadSidePanelLookups();
      tick();

      expect((component as any).sidePanelLookupsLoading()).toBe(false);
    }));
  });
});
