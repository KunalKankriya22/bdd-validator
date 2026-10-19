import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { DefineHHResponseGroups } from './define-hh-response-groups';
import { HHResponseGroupsService } from './services/hh-response-groups.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { HHResponseGroupModel } from './models/hh-response-groups.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineHHResponseGroups', () => {
  let snackBarSpy: any;
  let component: DefineHHResponseGroups;
  let fixture: ComponentFixture<DefineHHResponseGroups>;
  let mockService: jasmine.SpyObj<HHResponseGroupsService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let chapterChanged$: Subject<void>;

  const mockRecord: HHResponseGroupModel = {
    groupCode: 'TEST',
    description: 'Test Description',
    questionCode: 'HQ0020',
    responseCode: 'Y',
    effectiveDate: '2026-04-01',
    chapterId: 'CH001'
  };

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('HHResponseGroupsService', [
      'getResponseGroups',
      'getQuestionsList'
    ]);

    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });
    mockMenuService = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));

    mockService.getResponseGroups.and.returnValue(of({ data: [], totalRecords: 0 }));
    mockService.getQuestionsList.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [
        DefineHHResponseGroups,
        ReactiveFormsModule,
        FormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: HHResponseGroupsService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService }
      ]
    });

      mockMenuService.getMenuItemsSignal.and.returnValue(signal([]));


      mockService.getResponseGroups.and.returnValue(of({ data: [], totalRecords: 0 }));


      mockService.getQuestionsList.and.returnValue(of([]));


    fixture = TestBed.createComponent(DefineHHResponseGroups);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ─── Creation ────────────────────────────────────────────────────────────


  // ─── Initialisation ──────────────────────────────────────────────────────



  it('should NOT call getFilterDropdowns on init (removed)', () => {
    expect((mockService as any)['getFilterDropdowns']).toBeUndefined();
  });

  it('should initialise header config with title and subtitle', () => {
    expect(component.headerConfig.title).toBe('Define HH Response Groups');
    expect(component.headerConfig.subtitle).toContain('health history');
  });

  it('should initialise table config with columns and no pagination controls', () => {
    expect(component.tableConfig.columns.length).toBeGreaterThan(0);
    expect(component.tableConfig.showPagination).toBe(false);
    expect(component.tableConfig.stickyHeader).toBe(true);
  });





  // ─── Card Response Code ──────────────────────────────────────────────────

  describe('onCardResponseCodeChange', () => {
    it('should set cardResponseCode to selected value', () => {
      component.onCardResponseCodeChange('Y');
      expect(component.cardResponseCode).toBe('Y');
    });





    it('should send the new responseCode in requestState when reloading', () => {
      component.selectedQuestionFromSidebar = 'HQ0020';
      component.onCardResponseCodeChange('N');

      const callArgs = mockService.getResponseGroups.calls.mostRecent().args;
      expect(callArgs[2].responseCode).toBe('N');
    });




  });

  // ─── Question click & data loading ───────────────────────────────────────

  describe('onQuestionClick', () => {
    it('should set selectedQuestionFromSidebar and call API', () => {
      component.onQuestionClick({ questionCode: 'HQ0020', questionText: 'Test?' });

      expect(component.selectedQuestionFromSidebar).toBe('HQ0020');
      expect(mockService.getResponseGroups).toHaveBeenCalled();
    });

    it('should include questionCode in requestState', () => {
      component.onQuestionClick({ questionCode: 'HQ0020', questionText: 'Test?' });
      expect(component.requestState.questionCode).toBe('HQ0020');
    });

    it('should include responseCode in requestState when cardResponseCode is set', () => {
      component.cardResponseCode = 'Y';
      component.onQuestionClick({ questionCode: 'HQ0020', questionText: 'Test?' });
      expect(component.requestState.responseCode).toBe('Y');
    });




  });

  // ─── Side panel ──────────────────────────────────────────────────────────

  describe('createRecord', () => {
    it('should open add panel with selected question and response code', () => {
      component.selectedQuestionFromSidebar = 'HQ0020';
      component.cardResponseCode = 'Y';

      component.createRecord();

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelQuestionCode).toBe('HQ0020');
      expect(component.sidePanelResponseCode).toBe('Y');
      expect(component.sidePanelData).toBeNull();
    });


  });

  describe('editRecord', () => {
    it('should open edit panel with record data and clear prefilled codes', () => {
      component.editRecord(mockRecord);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockRecord);
      expect(component.sidePanelQuestionCode).toBeNull();
      expect(component.sidePanelResponseCode).toBeNull();
    });
  });

  describe('closeSidePanel', () => {
    it('should close panel and clear all panel state', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockRecord;
      component.sidePanelQuestionCode = 'HQ0020';
      component.sidePanelResponseCode = 'Y';

      component.closeSidePanel();

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelQuestionCode).toBeNull();
      expect(component.sidePanelResponseCode).toBeNull();
    });
  });

  // ─── Save success ─────────────────────────────────────────────────────────

  describe('onSaveSuccess', () => {


    it('should keep panel open and reload data when keepOpen is true', () => {
      component.sidePanelOpen = true;
      component.onSaveSuccess({ response: { message: 'Saved' }, keepOpen: true });

      expect(component.sidePanelOpen).toBe(true);
      expect(mockService.getResponseGroups).toHaveBeenCalled();
    });

    it('should show fallback message when response has no message', () => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      component.onSaveSuccess({ response: {}, keepOpen: false });
      expect(snackBarSpy).toHaveBeenCalledWith('Response group saved successfully', 'Close', jasmine.any(Object));
    });
  });

  // ─── Sort ─────────────────────────────────────────────────────────────────

  describe('onSortChange', () => {
    it('should update sort to ascending and reload', () => {
      spyOn(component, 'loadData');
      component.onSortChange({ column: 'groupCode', direction: 'A' });

      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(component.requestState.sort).toBe('A');
      expect(component.loadData).toHaveBeenCalled();
    });




  });

  // ─── Sidebar ──────────────────────────────────────────────────────────────

  describe('toggleSidebar', () => {
    it('should toggle sidebar open state', () => {
      const initial = component.sidebarOpen;
      component.toggleSidebar();
      expect(component.sidebarOpen).toBe(!initial);
      component.toggleSidebar();
      expect(component.sidebarOpen).toBe(initial);
    });
  });

  describe('toggleSidebarFilter', () => {
    it('should toggle sidebar filter open state', () => {
      expect(component.sidebarFilterOpen).toBe(false);
      component.toggleSidebarFilter();
      expect(component.sidebarFilterOpen).toBe(true);
      component.toggleSidebarFilter();
      expect(component.sidebarFilterOpen).toBe(false);
    });
  });

  // ─── Sidebar search ───────────────────────────────────────────────────────

  describe('getFilteredQuestions', () => {
    beforeEach(() => {
      component.questionsList.set([
        { questionCode: 'HQ0020', questionText: 'Are you feeling well?' },
        { questionCode: 'SM0002', questionText: 'What type of cookies?' }
      ]);
    });

    it('should return all questions when search text is empty', () => {
      component.onSidebarSearch('');
      expect(component.getFilteredQuestions().length).toBe(2);
    });






  });

  // ─── Sidebar filter ───────────────────────────────────────────────────────

  describe('onSidebarFilterApply', () => {
    it('should set sidebarFilterResponseCode and reload questions with filter', () => {
      component.onSidebarFilterApply({ responseCode: 'Y' });

      expect(component.sidebarFilterResponseCode).toBe('Y');
      expect(component.sidebarFilterOpen).toBe(false);
      expect(component.selectedQuestionFromSidebar).toBeNull();
      expect(component.dataSource).toEqual([]);
      expect(mockService.getQuestionsList).toHaveBeenCalledWith('Y');
    });

    it('should show Yes chip for Y response code', () => {
      component.onSidebarFilterApply({ responseCode: 'Y' });
      expect(component.sidebarFilterChips[0].label).toBe('Response Code: Yes');
    });

    it('should show No chip for N response code', () => {
      component.onSidebarFilterApply({ responseCode: 'N' });
      expect(component.sidebarFilterChips[0].label).toBe('Response Code: No');
    });

    it('should show Unknown chip for U response code', () => {
      component.onSidebarFilterApply({ responseCode: 'U' });
      expect(component.sidebarFilterChips[0].label).toBe('Response Code: Unknown');
    });

    it('should reload unfiltered questions when null is applied', () => {
      component.onSidebarFilterApply({ responseCode: null });

      expect(component.sidebarFilterResponseCode).toBeNull();
      expect(component.sidebarFilterChips.length).toBe(0);
      expect(mockService.getQuestionsList).toHaveBeenCalledWith(undefined);
    });
  });

  describe('onRemoveSidebarFilterChip', () => {
    it('should clear filter and reload unfiltered questions', () => {
      component.onSidebarFilterApply({ responseCode: 'N' });
      component.onRemoveSidebarFilterChip('sidebarResponseCode');

      expect(component.sidebarFilterResponseCode).toBeNull();
      expect(component.sidebarFilterChips.length).toBe(0);
      expect(mockService.getQuestionsList).toHaveBeenCalled();
    });


  });

  describe('onClearSidebarFilters', () => {
    it('should clear all sidebar filter state and reload questions', () => {
      component.onSidebarFilterApply({ responseCode: 'U' });
      component.onClearSidebarFilters();

      expect(component.sidebarFilterResponseCode).toBeNull();
      expect(component.sidebarFilterChips.length).toBe(0);
      expect(component.selectedQuestionFromSidebar).toBeNull();
      expect(mockService.getQuestionsList).toHaveBeenCalled();
    });
  });

  // ─── Date formatting ──────────────────────────────────────────────────────

  describe('formatDate (private)', () => {
    it('should format ISO date as DD-MON-YYYY', () => {
      const result = component['formatDate']('2026-04-01');
      expect(result).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });


  });

  // ─── loadData error handling ──────────────────────────────────────────────

  describe('loadData error handling', () => {




    it('should show formatted error on 400 with errorCode and message', () => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      mockService.getResponseGroups.and.returnValue(throwError(() => ({
        status: 400,
        error: { errorCode: '0080', message: 'Required field missing' }
      })));

      component.onQuestionClick({ questionCode: 'HQ0020', questionText: 'Test?' });

      expect(snackBarSpy).toHaveBeenCalledWith('Error 0080: Required field missing', 'Close', jasmine.any(Object));
    });

    it('should show first error from errors array on 400', () => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      mockService.getResponseGroups.and.returnValue(throwError(() => ({
        status: 400,
        error: { errors: [{ errorCode: '9740', message: 'Invalid group code' }] }
      })));

      component.onQuestionClick({ questionCode: 'HQ0020', questionText: 'Test?' });

      expect(snackBarSpy).toHaveBeenCalledWith('[9740] Invalid group code', 'Close', jasmine.any(Object));
    });

    it('should show fallback message on 400 with no recognisable error shape', () => {
      snackBarSpy = spyOn(component['snackBar'], 'open');
      mockService.getResponseGroups.and.returnValue(throwError(() => ({
        status: 400,
        error: {}
      })));

      component.onQuestionClick({ questionCode: 'HQ0020', questionText: 'Test?' });

      expect(snackBarSpy).toHaveBeenCalledWith('Validation error occurred', 'Close', jasmine.any(Object));
    });




  });

  // ─── loadData success ─────────────────────────────────────────────────────

  describe('loadData success', () => {


    it('should append data when appendMode is true', () => {
      component.dataSource = [mockRecord];
      const newRecord = { ...mockRecord, groupCode: 'TEST2' };
      mockService.getResponseGroups.and.returnValue(of({ data: [newRecord], totalRecords: 2 }));

      component.loadData(true, true);

      expect(component.dataSource.length).toBe(2);
    });

    it('should set hasMoreData false when all records loaded', () => {
      mockService.getResponseGroups.and.returnValue(of({ data: [mockRecord], totalRecords: 1 }));
      component.onQuestionClick({ questionCode: 'HQ0020', questionText: 'Test?' });

      expect(component.hasMoreData).toBe(false);
    });

    it('should handle null/non-array data gracefully', () => {
      mockService.getResponseGroups.and.returnValue(of({ data: null as any, totalRecords: 0 }));
      component.onQuestionClick({ questionCode: 'HQ0020', questionText: 'Test?' });

      expect(component.dataSource).toEqual([]);
    });
  });

  // ─── Infinite scroll ──────────────────────────────────────────────────────



  // ─── Keyboard shortcuts ───────────────────────────────────────────────────
  // ─── Chapter changes ──────────────────────────────────────────────────────

  describe('Chapter Changes', () => {
    beforeEach(() => {
      component.requestState = { questionCode: 'HQ0020', responseCode: 'Y' };
      component.dataSource = [mockRecord];
      component.hasMoreData = false;
      component.totalRecords = 10;
      component.selectedQuestionFromSidebar = 'HQ0020';
      component.selectedQuestionResponseCode = 'Y';
      component.cardResponseCode = 'Y';
      component.questionSearchText = 'search';
      component.appliedQuestionSearchText = 'search';
      component.sidebarFilterResponseCode = 'Y';
      component.sidebarFilterChips = [{ key: 'sidebar', label: 'Sidebar', value: 'Y' }];
      component.sidebarFilterOpen = true;
      component.questionsList.set([{ questionCode: 'HQ0020', questionText: 'Test' }]);
      component.sidePanelOpen = true;
      component.sidePanelData = mockRecord;
    });









    it('should clear question selection and search state', () => {
      chapterChanged$.next();
      expect(component.selectedQuestionFromSidebar).toBeNull();
      expect(component.selectedQuestionResponseCode).toBeNull();
      expect(component.questionSearchText).toBe('');
      expect(component.appliedQuestionSearchText).toBe('');
    });

    it('should clear sidebar filter state', () => {
      chapterChanged$.next();
      expect(component.sidebarFilterResponseCode).toBeNull();
      expect(component.sidebarFilterChips).toEqual([]);
      expect(component.sidebarFilterOpen).toBe(false);
    });

    it('should clear questions list', () => {
      chapterChanged$.next();
      expect(component.questionsList()).toEqual([]);
    });





    it('should NOT call getFilterDropdowns on chapter change (removed)', () => {
      expect((mockService as any)['getFilterDropdowns']).toBeUndefined();
    });
  });
});
