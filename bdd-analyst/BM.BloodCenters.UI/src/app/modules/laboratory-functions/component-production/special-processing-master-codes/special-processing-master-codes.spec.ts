import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef, ElementRef, NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError, Subject } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

import { SpecialProcessingMasterCodesComponent } from './special-processing-master-codes';
import { SpecialProcessingMasterCodesService } from './services/special-processing-master-codes.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SpecialProcessingFilterChipsUtils } from './utils/filter-chips.utils';
import { createMockTranslateService, createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SpecialProcessingMasterCodesComponent', () => {
  let component: SpecialProcessingMasterCodesComponent;
  let fixture: ComponentFixture<SpecialProcessingMasterCodesComponent>;
  let serviceSpy: jasmine.SpyObj<SpecialProcessingMasterCodesService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let overlaySpy: jasmine.SpyObj<Overlay>;

  const chapterChanged$ = new Subject<void>();

  const mockMasterResponse = {
    items: [
      {
        codeType: 'SPL',
        codeTypeDesc: 'Special Processing',
        effDate: '2023-01-01',
        termDate: null,
        lastModifiedDate: '2023-06-15',
      },
    ],
    totalRecords: 1,
  };

  const mockDetailResponse = {
    items: [
      {
        codeType: 'SPL',
        code: 'SPL01',
        codeDesc: 'Split Component',
        effDate: '2023-01-01',
        termDate: null,
        lastModifiedDate: '2023-06-15',
      },
    ],
    totalRecords: 1,
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('SpecialProcessingMasterCodesService', [
      'getGroupedList',
      'getList',
      'create',
      'update',
    ]);
    serviceSpy.getGroupedList.and.returnValue(of(mockMasterResponse));
    serviceSpy.getList.and.returnValue(of(mockDetailResponse));

    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getCurrentMenuItem', 'getTitle', 'getSubtitle'], {
      pageHeaderData: () => undefined,
    });
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);
    pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);

    snackBarSpy = createMockMatSnackBar();
    overlaySpy = jasmine.createSpyObj('Overlay', ['position', 'create', 'scrollStrategies']);

      TestBed.configureTestingModule({
      imports: [SpecialProcessingMasterCodesComponent, NoopAnimationsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SpecialProcessingMasterCodesService, useValue: serviceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Overlay, useValue: overlaySpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } },
        { provide: TranslateService, useValue: createMockTranslateService() },
      ],
    });

      serviceSpy.getGroupedList.and.returnValue(of(mockMasterResponse));

      serviceSpy.getList.and.returnValue(of(mockDetailResponse));

      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);

      pageHeaderServiceSpy.getSubtitle.and.returnValue(undefined);

    fixture = TestBed.createComponent(SpecialProcessingMasterCodesComponent);
    component = fixture.componentInstance;

    });

  afterEach(() => {
    if (fixture) fixture.destroy();
  });

  describe('Master View Data Loading', () => {
    it('should load grouped code types on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
      expect(component.masterDataSource.length).toBe(1);
      expect(component.masterDataSource[0].codeType).toBe('SPL');
      expect(component.masterIsLoading).toBeFalse();
    }));

    it('should update totalRecords from master response', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.masterTableConfig.pagination!.totalRecords).toBe(1);
    }));

    it('should clear dataSource on master API error', fakeAsync(() => {
      serviceSpy.getGroupedList.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      tick();

      expect(component.masterDataSource).toEqual([]);
      expect(component.masterIsLoading).toBeFalse();
    }));
  });

  describe('Master Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set search keyword and reload master data', fakeAsync(() => {
      component.onMasterSearch('Special');
      tick();

      expect(component.masterSearchKeyword).toBe('Special');
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
    }));

    it('should ignore search with fewer than 3 chars', fakeAsync(() => {
      serviceSpy.getGroupedList.calls.reset();
      component.onMasterSearch('SP');
      tick();

      expect(serviceSpy.getGroupedList).not.toHaveBeenCalled();
    }));

    it('should allow empty search to clear keyword', fakeAsync(() => {
      component.masterSearchKeyword = 'test';
      component.onMasterSearch('');
      tick();

      expect(component.masterSearchKeyword).toBe('');
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
    }));

    it('should reset page index on master search', fakeAsync(() => {
      component.masterTableConfig.pagination!.pageIndex = 3;
      component.onMasterSearch('Special');
      tick();

      expect(component.masterTableConfig.pagination!.pageIndex).toBe(0);
    }));
  });

  describe('Master Pagination and Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should update pagination and reload on page change', fakeAsync(() => {
      component.onMasterPageChange({ pageIndex: 2, pageSize: 50 });
      tick();

      expect(component.masterTableConfig.pagination!.pageIndex).toBe(2);
      expect(component.masterTableConfig.pagination!.pageSize).toBe(50);
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
    }));

    it('should update sort config and reload on sort change', fakeAsync(() => {
      component.onMasterSortChange({ column: 'codeType', direction: 'A' });
      tick();

      expect(component.masterTableConfig.sortConfig!.column).toBe('codeType');
      expect(component.masterTableConfig.sortConfig!.direction).toBe('A');
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
    }));
  });

  describe('Master Row Action', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should navigate to detail view on view action', fakeAsync(() => {
      const row = { codeType: 'SPL', codeTypeDesc: 'Special Processing', effDate: null, termDate: null, lastModifiedDate: null };

      component.onMasterRowAction({ action: 'view', row });
      tick();

      expect(component.currentView).toBe('detail');
      expect(component.selectedCodeType).toBe('SPL');
      expect(serviceSpy.getList).toHaveBeenCalled();
    }));
  });

  describe('Detail View', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.navigateToDetail({
        codeType: 'SPL',
        codeTypeDesc: 'Special Processing',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      });
      tick();
    }));

    it('should load detail data for selected code type', fakeAsync(() => {
      component.loadDetailData();
      tick();

      expect(serviceSpy.getList).toHaveBeenCalled();
      expect(component.detailDataSource.length).toBe(1);
    }));

    it('should handle detail search with min length 2', fakeAsync(() => {
      component.onDetailSearch('SP');
      tick();

      expect(component.detailSearchKeyword).toBe('SP');
      expect(serviceSpy.getList).toHaveBeenCalled();
    }));

    it('should ignore detail search with fewer than 2 chars', fakeAsync(() => {
      serviceSpy.getList.calls.reset();
      component.onDetailSearch('S');
      tick();

      expect(serviceSpy.getList).not.toHaveBeenCalled();
    }));

    it('should handle detail pagination', fakeAsync(() => {
      component.onDetailPageChange({ pageIndex: 1, pageSize: 25 });
      tick();

      expect(component.detailTableConfig.pagination!.pageIndex).toBe(1);
      expect(serviceSpy.getList).toHaveBeenCalled();
    }));

    it('should handle detail sort change', fakeAsync(() => {
      component.onDetailSortChange({ column: 'code', direction: 'D' });
      tick();

      expect(component.detailTableConfig.sortConfig!.direction).toBe('D');
      expect(serviceSpy.getList).toHaveBeenCalled();
    }));

    it('should open edit drawer on detail edit row action', () => {
      const row = mockDetailResponse.items[0] as any;

      component.onDetailRowAction({ action: 'edit', row });

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(row);
    });
  });

  describe('Navigation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should navigate back to master view and reload data', fakeAsync(() => {
      component.currentView = 'detail';
      component.selectedCodeType = 'SPL';
      component.navigateBackToMaster();
      tick();

      expect(component.currentView).toBe('master');
      expect(component.selectedCodeType).toBe('');
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
    }));
  });

  describe('Side Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open add drawer in add mode', () => {
      component.openAddDrawer();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open edit drawer with data', () => {
      const data = mockDetailResponse.items[0] as any;
      component.openEditDrawer(data);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(data);
    });

    it('should close side drawer and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockDetailResponse.items[0] as any;

      component.closeSideDrawer();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Save Operations', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.navigateToDetail({
        codeType: 'SPL',
        codeTypeDesc: 'Special Processing',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      });
      tick();
    }));

    it('should not save when selectedCodeType is empty', fakeAsync(() => {
      component.selectedCodeType = '';
      component.sidePanelMode = 'add';

      component.onSave({
        codeType: '',
        code: 'X',
        codeDesc: 'test',
        effDate: null,
        termDate: null,
      });
      tick();

      expect(serviceSpy.create).not.toHaveBeenCalled();
    }));

  });

  describe('Filter Management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should apply filters in master view and reload', fakeAsync(() => {
      component.currentView = 'master';
      component.applyFilters({ effDatePeriod: 'after', effDate: '2023-01-01' });
      tick();

      expect(component.masterAppliedFilters).toEqual({ effDatePeriod: 'after', effDate: '2023-01-01' });
      expect(component.masterFilterChips.length).toBeGreaterThan(0);
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
    }));

    it('should apply filters in detail view and reload', fakeAsync(() => {
      component.currentView = 'detail';
      component.selectedCodeType = 'SPL';
      component.applyFilters({ termDatePeriod: 'before', termDate: '2024-12-31' });
      tick();

      expect(component.detailAppliedFilters).toEqual({ termDatePeriod: 'before', termDate: '2024-12-31' });
      expect(serviceSpy.getList).toHaveBeenCalled();
    }));

    it('should clear all master filters and reload', fakeAsync(() => {
      component.currentView = 'master';
      component.masterAppliedFilters = { effDatePeriod: 'after', effDate: '2023-01-01' };

      component.onClearAllFilters();
      tick();

      expect(component.masterAppliedFilters).toBeNull();
      expect(component.masterFilterChips).toEqual([]);
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
    }));
  });

  describe('Filter Active State', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should report isFilterActive false when no overlay is open', () => {
      expect(component.isFilterActive).toBeFalse();
    });

    it('should return master filter chips when in master view', () => {
      component.currentView = 'master';
      component.masterFilterChips = [{ key: 'effDate', label: 'Eff Date: After 01-JAN-2023' }];

      expect(component.activeFilterChips.length).toBe(1);
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open add drawer on Alt+C in detail view', () => {
      component.currentView = 'detail';
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should not open add drawer on Alt+C in master view', () => {
      component.currentView = 'master';

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should close side panel on Escape when open', () => {
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('Chapter Change', () => {
    it('should reset to master view when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.currentView = 'detail';
      component.selectedCodeType = 'SPL';
      chapterChanged$.next();
      tick();

      expect(component.currentView).toBe('master');
      expect(component.selectedCodeType).toBe('');
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ and close filter panel on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component.masterFilterOverlayRef = overlayRefSpy;

      component.ngOnDestroy();

      expect(overlayRefSpy.dispose).toHaveBeenCalled();
      expect(component.masterFilterOverlayRef).toBeNull();
    }));

    it('should dispose detail filter overlay on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component.detailFilterOverlayRef = overlayRefSpy;

      component.ngOnDestroy();

      expect(overlayRefSpy.dispose).toHaveBeenCalled();
      expect(component.detailFilterOverlayRef).toBeNull();
    }));
  });

  describe('Save Operations - Create', () => {
    it('should create a new code successfully in add mode', () => {
      serviceSpy.create.and.returnValue(of({}));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      const createData = {
        codeType: 'SPL',
        code: 'SPL02',
        codeDesc: 'New Code',
        effDate: '2023-01-01',
        termDate: null,
      };
      component.onSave(createData);

      expect(serviceSpy.create).toHaveBeenCalledWith(createData);
      expect(snackBarOpenSpy).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should handle create error and set error message on side drawer', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const errorResponse = {
        status: 400,
        error: { errorResponse: { error: 'Duplicate code found' } },
      };
      serviceSpy.create.and.returnValue(throwError(() => errorResponse));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      const sideDrawerSpy = jasmine.createSpyObj('AddEditSpecialProcessingComponent', ['resetForm', 'setErrorMessage']);
      component.sideDrawerComponent = sideDrawerSpy;

      component.onSave({
        codeType: 'SPL',
        code: 'SPL02',
        codeDesc: 'New Code',
        effDate: null,
        termDate: null,
      });
      tick();

      expect(sideDrawerSpy.setErrorMessage).toHaveBeenCalledWith('Duplicate code found');
    }));
  });

  describe('Save Operations - Update', () => {
    it('should update an existing code successfully in edit mode', () => {
      serviceSpy.update.and.returnValue(of({}));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      component.sidePanelMode = 'edit';
      component.sidePanelData = {
        codeType: 'SPL',
        code: 'SPL01',
        codeDesc: 'Split Component',
        effDate: '2023-01-01',
        termDate: null,
        lastModifiedDate: null,
      };
      component.sidePanelOpen = true;
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      const updateData = {
        codeDesc: 'Updated Desc',
        effDate: '2023-06-01',
        termDate: null,
      };
      component.onSave(updateData);

      expect(serviceSpy.update).toHaveBeenCalledWith('SPL', 'SPL01', updateData);
      expect(snackBarOpenSpy).toHaveBeenCalled();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should handle update error with error.message fallback', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const errorResponse = {
        status: 500,
        error: { message: 'Internal server error' },
      };
      serviceSpy.update.and.returnValue(throwError(() => errorResponse));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      component.sidePanelMode = 'edit';
      component.sidePanelData = {
        codeType: 'SPL',
        code: 'SPL01',
        codeDesc: 'Split Component',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      };
      const sideDrawerSpy = jasmine.createSpyObj('AddEditSpecialProcessingComponent', ['resetForm', 'setErrorMessage']);
      component.sideDrawerComponent = sideDrawerSpy;

      component.onSave({
        codeDesc: 'Updated',
        effDate: null,
        termDate: null,
      });
      tick();

      expect(sideDrawerSpy.setErrorMessage).toHaveBeenCalledWith('Internal server error');
    }));

    it('should handle update error with 404 status fallback', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const errorResponse = { status: 404, error: {} };
      serviceSpy.update.and.returnValue(throwError(() => errorResponse));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      component.sidePanelMode = 'edit';
      component.sidePanelData = {
        codeType: 'SPL',
        code: 'SPL01',
        codeDesc: 'Split Component',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      };
      const sideDrawerSpy = jasmine.createSpyObj('AddEditSpecialProcessingComponent', ['resetForm', 'setErrorMessage']);
      component.sideDrawerComponent = sideDrawerSpy;

      component.onSave({
        codeDesc: 'Updated',
        effDate: null,
        termDate: null,
      });
      tick();

      expect(sideDrawerSpy.setErrorMessage).toHaveBeenCalledWith('SP Master Code not found');
    }));

    it('should handle update error with default fallback message', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const errorResponse = { status: 500, error: {} };
      serviceSpy.update.and.returnValue(throwError(() => errorResponse));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      component.sidePanelMode = 'edit';
      component.sidePanelData = {
        codeType: 'SPL',
        code: 'SPL01',
        codeDesc: 'Split Component',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      };
      const sideDrawerSpy = jasmine.createSpyObj('AddEditSpecialProcessingComponent', ['resetForm', 'setErrorMessage']);
      component.sideDrawerComponent = sideDrawerSpy;

      component.onSave({
        codeDesc: 'Updated',
        effDate: null,
        termDate: null,
      });
      tick();

      expect(sideDrawerSpy.setErrorMessage).toHaveBeenCalledWith('An error occurred while saving. Please try again.');
    }));
  });

  describe('Save and Create Another', () => {
    it('should not call create when selectedCodeType is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.selectedCodeType = '';

      component.onSaveAndCreateAnother({
        codeType: 'SPL',
        code: 'SPL03',
        codeDesc: 'Another Code',
        effDate: null,
        termDate: null,
      });
      tick();

      expect(serviceSpy.create).not.toHaveBeenCalled();
    }));

    it('should create and reset form on success', () => {
      serviceSpy.create.and.returnValue(of({}));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      component.onSaveAndCreateAnother({
        codeType: 'SPL',
        code: 'SPL03',
        codeDesc: 'Another Code',
        effDate: null,
        termDate: null,
      });

      expect(serviceSpy.create).toHaveBeenCalled();
      expect(snackBarOpenSpy).toHaveBeenCalled();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(serviceSpy.getList).toHaveBeenCalled();
    });

    it('should handle error on save and create another', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const errorResponse = {
        status: 400,
        error: { errorResponse: { error: 'Code already exists' } },
      };
      serviceSpy.create.and.returnValue(throwError(() => errorResponse));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      const sideDrawerSpy = jasmine.createSpyObj('AddEditSpecialProcessingComponent', ['resetForm', 'setErrorMessage']);
      component.sideDrawerComponent = sideDrawerSpy;

      component.onSaveAndCreateAnother({
        codeType: 'SPL',
        code: 'SPL03',
        codeDesc: 'Another Code',
        effDate: null,
        termDate: null,
      });
      tick();

      expect(sideDrawerSpy.setErrorMessage).toHaveBeenCalledWith('Code already exists');
    }));
  });

  describe('Detail View - Error and Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not load detail data when selectedCodeType is empty', fakeAsync(() => {
      component.selectedCodeType = '';
      serviceSpy.getList.calls.reset();

      component.loadDetailData();
      tick();

      expect(serviceSpy.getList).not.toHaveBeenCalled();
    }));

    it('should clear detail data on API error', fakeAsync(() => {
      component.selectedCodeType = 'SPL';
      serviceSpy.getList.and.returnValue(throwError(() => new Error('fail')));

      component.loadDetailData();
      tick();

      expect(component.detailDataSource).toEqual([]);
      expect(component.detailIsLoading).toBeFalse();
      expect(component.detailTableConfig.pagination!.totalRecords).toBe(0);
    }));

    it('should format dates in detail data response', fakeAsync(() => {
      component.selectedCodeType = 'SPL';
      serviceSpy.getList.and.returnValue(of({
        items: [
          {
            codeType: 'SPL',
            code: 'SPL01',
            codeDesc: 'Test',
            effDate: '2023-06-15',
            termDate: '2024-12-31',
            lastModifiedDate: '2023-09-01',
          },
        ],
        totalRecords: 1,
      }));

      component.loadDetailData();
      tick();

      expect(component.detailDataSource[0].effDate).toBe('15-JUN-2023');
      expect(component.detailDataSource[0].termDate).toBe('31-DEC-2024');
      expect(component.detailDataSource[0].lastModifiedDate).toBe('01-SEP-2023');
    }));

    it('should handle null dates in detail data response', fakeAsync(() => {
      component.selectedCodeType = 'SPL';
      serviceSpy.getList.and.returnValue(of({
        items: [
          {
            codeType: 'SPL',
            code: 'SPL01',
            codeDesc: 'Test',
            effDate: null,
            termDate: null,
            lastModifiedDate: null,
          },
        ],
        totalRecords: 1,
      }));

      component.loadDetailData();
      tick();

      expect(component.detailDataSource[0].effDate).toBeNull();
      expect(component.detailDataSource[0].termDate).toBeNull();
      expect(component.detailDataSource[0].lastModifiedDate).toBeNull();
    }));
  });

  describe('Master Data Loading - Sort Directions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should pass ASC sort order when direction is A', fakeAsync(() => {
      component.masterTableConfig.sortConfig!.direction = 'A';
      component.masterTableConfig.sortConfig!.column = 'codeType';
      serviceSpy.getGroupedList.calls.reset();

      component.loadMasterData();
      tick();

      const callArgs = serviceSpy.getGroupedList.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('codeType');
      expect(callArgs[2].sortOrder).toBe('ASC');
    }));

    it('should pass DESC sort order when direction is D', fakeAsync(() => {
      component.masterTableConfig.sortConfig!.direction = 'D';
      component.masterTableConfig.sortConfig!.column = 'codeType';
      serviceSpy.getGroupedList.calls.reset();

      component.loadMasterData();
      tick();

      const callArgs = serviceSpy.getGroupedList.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('codeType');
      expect(callArgs[2].sortOrder).toBe('DESC');
    }));

    it('should not pass sort params when direction is default', fakeAsync(() => {
      component.masterTableConfig.sortConfig!.direction = 'default';
      serviceSpy.getGroupedList.calls.reset();

      component.loadMasterData();
      tick();

      const callArgs = serviceSpy.getGroupedList.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBeUndefined();
      expect(callArgs[2].sortOrder).toBeUndefined();
    }));

    it('should pass filter params when master filters are applied', fakeAsync(() => {
      component.masterAppliedFilters = {
        effDatePeriod: 'after',
        effDate: '2023-01-01',
        termDatePeriod: 'before',
        termDate: '2024-12-31',
      };
      serviceSpy.getGroupedList.calls.reset();

      component.loadMasterData();
      tick();

      const callArgs = serviceSpy.getGroupedList.calls.mostRecent().args;
      expect(callArgs[2].effDatePeriod).toBe('after');
      expect(callArgs[2].effDate).toBe('2023-01-01');
      expect(callArgs[2].termDatePeriod).toBe('before');
      expect(callArgs[2].termDate).toBe('2024-12-31');
    }));

    it('should format dates in master data response', fakeAsync(() => {
      serviceSpy.getGroupedList.and.returnValue(of({
        items: [
          {
            codeType: 'SPL',
            codeTypeDesc: 'Special',
            effDate: '2023-01-15',
            termDate: '2024-06-30',
            lastModifiedDate: '2023-12-25',
          },
        ],
        totalRecords: 1,
      }));
      serviceSpy.getGroupedList.calls.reset();

      component.loadMasterData();
      tick();

      expect(component.masterDataSource[0].effDate).toBe('15-JAN-2023');
      expect(component.masterDataSource[0].termDate).toBe('30-JUN-2024');
      expect(component.masterDataSource[0].lastModifiedDate).toBe('25-DEC-2023');
    }));
  });

  describe('Detail Data Loading - Sort Directions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedCodeType = 'SPL';
    }));

    it('should pass ASC sort order for detail when direction is A', fakeAsync(() => {
      component.detailTableConfig.sortConfig!.direction = 'A';
      component.detailTableConfig.sortConfig!.column = 'code';
      serviceSpy.getList.calls.reset();

      component.loadDetailData();
      tick();

      const callArgs = serviceSpy.getList.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('code');
      expect(callArgs[2].sortOrder).toBe('ASC');
    }));

    it('should pass DESC sort order for detail when direction is D', fakeAsync(() => {
      component.detailTableConfig.sortConfig!.direction = 'D';
      component.detailTableConfig.sortConfig!.column = 'code';
      serviceSpy.getList.calls.reset();

      component.loadDetailData();
      tick();

      const callArgs = serviceSpy.getList.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBe('code');
      expect(callArgs[2].sortOrder).toBe('DESC');
    }));

    it('should not pass sort params for detail when direction is default', fakeAsync(() => {
      component.detailTableConfig.sortConfig!.direction = 'default';
      serviceSpy.getList.calls.reset();

      component.loadDetailData();
      tick();

      const callArgs = serviceSpy.getList.calls.mostRecent().args;
      expect(callArgs[2].sortColumn).toBeUndefined();
      expect(callArgs[2].sortOrder).toBeUndefined();
    }));

    it('should pass detail filter params when detail filters are applied', fakeAsync(() => {
      component.detailAppliedFilters = {
        effDatePeriod: 'before',
        effDate: '2023-06-01',
      };
      serviceSpy.getList.calls.reset();

      component.loadDetailData();
      tick();

      const callArgs = serviceSpy.getList.calls.mostRecent().args;
      expect(callArgs[2].effDatePeriod).toBe('before');
      expect(callArgs[2].effDate).toBe('2023-06-01');
    }));
  });

  describe('Close Filter Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should dispose master overlay when it exists', () => {
      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component.masterFilterOverlayRef = overlayRefSpy;

      component.closeFilterPanel();

      expect(overlayRefSpy.dispose).toHaveBeenCalled();
      expect(component.masterFilterOverlayRef).toBeNull();
    });

    it('should dispose detail overlay when it exists', () => {
      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component.detailFilterOverlayRef = overlayRefSpy;

      component.closeFilterPanel();

      expect(overlayRefSpy.dispose).toHaveBeenCalled();
      expect(component.detailFilterOverlayRef).toBeNull();
    });

    it('should dispose both overlays when both exist', () => {
      const masterOverlaySpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      const detailOverlaySpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component.masterFilterOverlayRef = masterOverlaySpy;
      component.detailFilterOverlayRef = detailOverlaySpy;

      component.closeFilterPanel();

      expect(masterOverlaySpy.dispose).toHaveBeenCalled();
      expect(detailOverlaySpy.dispose).toHaveBeenCalled();
      expect(component.masterFilterOverlayRef).toBeNull();
      expect(component.detailFilterOverlayRef).toBeNull();
    });

    it('should do nothing when no overlays exist', () => {
      component.masterFilterOverlayRef = null;
      component.detailFilterOverlayRef = null;

      expect(() => component.closeFilterPanel()).not.toThrow();
    });
  });

  describe('isFilterActive - Detail View', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when detail overlay is open in detail view', () => {
      component.currentView = 'detail';
      component.detailFilterOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);

      expect(component.isFilterActive).toBeTrue();
    });

    it('should return false when no detail overlay in detail view', () => {
      component.currentView = 'detail';
      component.detailFilterOverlayRef = null;

      expect(component.isFilterActive).toBeFalse();
    });

    it('should return true when master overlay is open in master view', () => {
      component.currentView = 'master';
      component.masterFilterOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);

      expect(component.isFilterActive).toBeTrue();
    });
  });

  describe('activeFilterChips - Detail View', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return detail filter chips when in detail view', () => {
      component.currentView = 'detail';
      component.detailFilterChips = [{ key: 'termDate', label: 'Term Date: Before 31-DEC-2024' }];

      expect(component.activeFilterChips.length).toBe(1);
      expect(component.activeFilterChips[0].key).toBe('termDate');
    });

    it('should return empty array when no detail chips', () => {
      component.currentView = 'detail';
      component.detailFilterChips = [];

      expect(component.activeFilterChips).toEqual([]);
    });
  });

  describe('Remove Filter Chip', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should remove filter chip in master view and reload', fakeAsync(() => {
      component.currentView = 'master';
      component.masterAppliedFilters = {
        effDatePeriod: 'after',
        effDate: '2023-01-01',
        termDatePeriod: 'before',
        termDate: '2024-12-31',
      };
      component.masterFilterChips = [
        { key: 'effDate', label: 'Eff Date' },
        { key: 'termDate', label: 'Term Date' },
      ];
      serviceSpy.getGroupedList.calls.reset();

      component.onRemoveFilterChip('effDate');
      tick();

      expect(component.masterAppliedFilters!.effDate).toBeUndefined();
      expect(serviceSpy.getGroupedList).toHaveBeenCalled();
      expect(component.masterTableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should remove filter chip in detail view and reload', fakeAsync(() => {
      component.currentView = 'detail';
      component.selectedCodeType = 'SPL';
      component.detailAppliedFilters = {
        effDatePeriod: 'after',
        effDate: '2023-01-01',
        termDatePeriod: 'before',
        termDate: '2024-12-31',
      };
      component.detailFilterChips = [
        { key: 'effDate', label: 'Eff Date' },
        { key: 'termDate', label: 'Term Date' },
      ];
      serviceSpy.getList.calls.reset();

      component.onRemoveFilterChip('termDate');
      tick();

      expect(component.detailAppliedFilters!.termDate).toBeUndefined();
      expect(serviceSpy.getList).toHaveBeenCalled();
      expect(component.detailTableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should set filters to null when last filter chip is removed in master view', fakeAsync(() => {
      component.currentView = 'master';
      component.masterAppliedFilters = {
        effDatePeriod: 'after',
        effDate: '2023-01-01',
      };
      component.masterFilterChips = [{ key: 'effDate', label: 'Eff Date' }];
      serviceSpy.getGroupedList.calls.reset();

      component.onRemoveFilterChip('effDate');
      tick();

      expect(component.masterAppliedFilters).toBeNull();
      expect(component.masterFilterChips).toEqual([]);
    }));
  });

  describe('Clear All Filters - Detail View', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear all detail filters and reload', fakeAsync(() => {
      component.currentView = 'detail';
      component.selectedCodeType = 'SPL';
      component.detailAppliedFilters = { effDatePeriod: 'after', effDate: '2023-01-01' };
      component.detailFilterChips = [{ key: 'effDate', label: 'Eff Date' }];
      serviceSpy.getList.calls.reset();

      component.onClearAllFilters();
      tick();

      expect(component.detailAppliedFilters).toBeNull();
      expect(component.detailFilterChips).toEqual([]);
      expect(component.detailTableConfig.pagination!.pageIndex).toBe(0);
      expect(serviceSpy.getList).toHaveBeenCalled();
    }));
  });

  describe('Navigate to Detail - Full State Setup', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set all state correctly when navigating to detail', fakeAsync(() => {
      const row = {
        codeType: 'ABC',
        codeTypeDesc: 'ABC Description',
        effDate: '2023-01-01',
        termDate: null,
        lastModifiedDate: null,
      };

      component.navigateToDetail(row);
      tick();

      expect(component.selectedCodeType).toBe('ABC');
      expect(component.selectedCodeTypeDesc).toBe('ABC Description');
      expect(component.currentView).toBe('detail');
      expect(component.detailSearchKeyword).toBe('');
      expect(component.detailAppliedFilters).toBeNull();
      expect(component.detailFilterChips).toEqual([]);
      expect(component.detailTableConfig.pagination!.pageIndex).toBe(0);
      expect(component.detailTableConfig.sortConfig!.column).toBe('code');
      expect(component.detailTableConfig.sortConfig!.direction).toBe('default');
      expect(serviceSpy.getList).toHaveBeenCalled();
      // totalRecords is set to 1 by loadDetailData response (mockDetailResponse)
      expect(component.detailTableConfig.pagination!.totalRecords).toBe(1);
    }));

    it('should update page header config to detail view', fakeAsync(() => {
      const row = {
        codeType: 'SPL',
        codeTypeDesc: 'Special Processing',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      };

      component.navigateToDetail(row);
      tick();

      expect(component.pageHeaderConfig.breadcrumbs!.length).toBe(3);
      expect(component.pageHeaderConfig.showBackButton).toBeTrue();
      expect(component.pageHeaderConfig.title).toBe('Special Processing');
      expect(component.pageHeaderConfig.subtitle).toBe('SPL');
    }));
  });

  describe('Navigate Back to Master', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should close side drawer and filter panel and reset state', fakeAsync(() => {
      component.currentView = 'detail';
      component.selectedCodeType = 'SPL';
      component.selectedCodeTypeDesc = 'Special Processing';
      component.sidePanelOpen = true;
      component.sidePanelData = { codeType: 'SPL', code: 'SPL01', codeDesc: 'Test', effDate: null, termDate: null, lastModifiedDate: null };

      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component.detailFilterOverlayRef = overlayRefSpy;

      component.navigateBackToMaster();
      tick();

      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
      expect(component.currentView).toBe('master');
      expect(component.selectedCodeType).toBe('');
      expect(component.selectedCodeTypeDesc).toBe('');
      expect(component.masterSearchKeyword).toBe('');
      expect(component.masterAppliedFilters).toBeNull();
      expect(component.masterFilterChips).toEqual([]);
      expect(component.detailDataSource).toEqual([]);
      expect(overlayRefSpy.dispose).toHaveBeenCalled();
    }));

    it('should reset master pagination and sort on back navigation', fakeAsync(() => {
      component.currentView = 'detail';
      component.masterTableConfig.pagination!.pageIndex = 5;
      component.masterTableConfig.sortConfig!.column = 'codeTypeDesc';
      component.masterTableConfig.sortConfig!.direction = 'A';

      component.navigateBackToMaster();
      tick();

      expect(component.masterTableConfig.pagination!.pageIndex).toBe(0);
      expect(component.masterTableConfig.sortConfig!.column).toBe('codeType');
      expect(component.masterTableConfig.sortConfig!.direction).toBe('default');
    }));
  });

  describe('Page Header Config', () => {
    it('should use menuItem label when available for master header', fakeAsync(() => {
      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue({ label: 'Custom Title', link: '/custom' });
      fixture.detectChanges();
      tick();

      // Trigger getMasterPageHeaderConfig via reset
      component.navigateBackToMaster();
      tick();

      expect(component.pageHeaderConfig.breadcrumbs![1].label).toBe('Custom Title');
    }));

    it('should use default label when menuItem is not available for master header', fakeAsync(() => {
      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);
      fixture.detectChanges();
      tick();

      component.navigateBackToMaster();
      tick();

      expect(component.pageHeaderConfig.breadcrumbs![1].label).toBe('Special Processing Master codes');
    }));

    it('should use menuItem label for detail header parent breadcrumb', fakeAsync(() => {
      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue({ label: 'Custom Title', link: '/custom' });
      fixture.detectChanges();
      tick();

      component.navigateToDetail({
        codeType: 'SPL',
        codeTypeDesc: 'Special Processing',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      });
      tick();

      expect(component.pageHeaderConfig.breadcrumbs![1].label).toBe('Custom Title');
    }));

    it('should use codeType as fallback title when codeTypeDesc is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.navigateToDetail({
        codeType: 'SPL',
        codeTypeDesc: '',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      });
      tick();

      expect(component.pageHeaderConfig.title).toBe('SPL');
    }));

    it('should include ADD NEW CODE action button in detail header', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.navigateToDetail({
        codeType: 'SPL',
        codeTypeDesc: 'Special Processing',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      });
      tick();

      expect(component.pageHeaderConfig.actions!.length).toBe(1);
      expect(component.pageHeaderConfig.actions![0].label).toBe('ADD NEW CODE');
    }));

    it('should trigger openAddDrawer from detail header action onClick', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.navigateToDetail({
        codeType: 'SPL',
        codeTypeDesc: 'Special Processing',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      });
      tick();

      component.pageHeaderConfig.actions![0].onClick!();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
    }));

    it('should trigger navigateBackToMaster from detail header onBackClick', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.navigateToDetail({
        codeType: 'SPL',
        codeTypeDesc: 'Special Processing',
        effDate: null,
        termDate: null,
        lastModifiedDate: null,
      });
      tick();

      component.pageHeaderConfig.onBackClick!();
      tick();

      expect(component.currentView).toBe('master');
    }));
  });

  describe('Keyboard Shortcuts - Additional', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not open add drawer on Alt+C when side panel is already open', () => {
      component.currentView = 'detail';
      component.sidePanelOpen = true;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardEvent(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should close filter panel on Escape when filter is active and side panel is closed', () => {
      component.currentView = 'master';
      component.sidePanelOpen = false;
      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component.masterFilterOverlayRef = overlayRefSpy;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);

      expect(overlayRefSpy.dispose).toHaveBeenCalled();
    });

    it('should close side panel first on Escape when both panel and filter are active', () => {
      component.sidePanelOpen = true;
      const overlayRefSpy = jasmine.createSpyObj('OverlayRef', ['dispose']);
      component.masterFilterOverlayRef = overlayRefSpy;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      component.handleKeyboardEvent(event);

      expect(component.sidePanelOpen).toBeFalse();
      // Filter should NOT have been closed since side panel took priority
      expect(overlayRefSpy.dispose).not.toHaveBeenCalled();
    });

    it('should do nothing on Escape when nothing is open', () => {
      component.sidePanelOpen = false;
      component.masterFilterOverlayRef = null;
      component.detailFilterOverlayRef = null;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      expect(() => component.handleKeyboardEvent(event)).not.toThrow();
    });

    it('should prevent default on Alt+C in detail view when panel is closed', () => {
      component.currentView = 'detail';
      component.sidePanelOpen = false;

      const event = new KeyboardEvent('keydown', { altKey: true, key: 'c' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardEvent(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Master Row Action - Non-view', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not navigate on non-view master row action', () => {
      const row = { codeType: 'SPL', codeTypeDesc: 'Special Processing', effDate: null, termDate: null, lastModifiedDate: null };

      component.onMasterRowAction({ action: 'edit', row });

      expect(component.currentView).toBe('master');
    });
  });

  describe('Detail Row Action - Non-edit', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not open drawer on non-edit detail row action', () => {
      const row = mockDetailResponse.items[0] as any;

      component.onDetailRowAction({ action: 'view', row });

      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('Detail Search - Empty Clears Keyword', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedCodeType = 'SPL';
    }));

    it('should allow empty search to clear detail keyword', fakeAsync(() => {
      component.detailSearchKeyword = 'test';
      serviceSpy.getList.calls.reset();

      component.onDetailSearch('');
      tick();

      expect(component.detailSearchKeyword).toBe('');
      expect(serviceSpy.getList).toHaveBeenCalled();
    }));
  });

  describe('handleSaveError - no sideDrawerComponent', () => {
    it('should not throw when sideDrawerComponent is undefined', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      serviceSpy.create.and.returnValue(throwError(() => ({ status: 400, error: {} })));
      component.selectedCodeType = 'SPL';
      component.currentView = 'detail';
      component.sidePanelMode = 'add';
      component.sideDrawerComponent = undefined;

      expect(() => {
        component.onSave({
          codeType: 'SPL',
          code: 'SPL02',
          codeDesc: 'New Code',
          effDate: null,
          termDate: null,
        });
      }).not.toThrow();
    }));
  });

  describe('Master Data - Empty Items Array', () => {
    it('should handle response with undefined items', fakeAsync(() => {
      serviceSpy.getGroupedList.and.returnValue(of({ items: undefined as any, totalRecords: 0 }));
      fixture.detectChanges();
      tick();

      expect(component.masterDataSource).toEqual([]);
      expect(component.masterTableConfig.pagination!.totalRecords).toBe(0);
    }));

    it('should handle response with undefined totalRecords', fakeAsync(() => {
      serviceSpy.getGroupedList.and.returnValue(of({ items: [], totalRecords: undefined as any }));
      fixture.detectChanges();
      tick();

      expect(component.masterDataSource).toEqual([]);
      expect(component.masterTableConfig.pagination!.totalRecords).toBe(0);
    }));
  });

  describe('Apply Filters - Page Index Reset', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset master page index when applying filters', fakeAsync(() => {
      component.currentView = 'master';
      component.masterTableConfig.pagination!.pageIndex = 3;

      component.applyFilters({ effDatePeriod: 'after', effDate: '2023-01-01' });
      tick();

      expect(component.masterTableConfig.pagination!.pageIndex).toBe(0);
    }));

    it('should reset detail page index when applying filters', fakeAsync(() => {
      component.currentView = 'detail';
      component.selectedCodeType = 'SPL';
      component.detailTableConfig.pagination!.pageIndex = 3;

      component.applyFilters({ termDatePeriod: 'before', termDate: '2024-12-31' });
      tick();

      expect(component.detailTableConfig.pagination!.pageIndex).toBe(0);
    }));
  });
});
