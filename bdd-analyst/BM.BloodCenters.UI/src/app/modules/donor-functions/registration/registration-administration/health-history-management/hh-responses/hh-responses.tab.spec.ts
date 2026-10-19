import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { HHResponsesTab } from './hh-responses.tab';
import { HealthHistoryService } from '../services/health-history.service';
import { HeaderService } from '@shared/services/header.service';
import { HHResponseModel } from '../models/health-history.model';
import { ResponseComments } from './response-comments/response-comments';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('HHResponsesTab', () => {
  let component: HHResponsesTab;
  let fixture: ComponentFixture<HHResponsesTab>;
  let hhServiceSpy: jasmine.SpyObj<HealthHistoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let headerServiceMock: Partial<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockResponses: HHResponseModel[] = [
    {
      questionCode: 'D51', response: 'Y', donorResponse: 'Yes',
      answerCode: 'DRHEA', answerDescription: 'Diarrhea',
      groupCode: '', interdictionCode: 'HDT',
      deferralPeriod: 1, periodType: 'D',
      commentRequired: 'Y', manualAuditFlag: 'N', additionalDateFlag: 'N',
      effectiveDate: '2026-04-29'
    },
    {
      questionCode: 'D51', response: 'N', donorResponse: 'No',
      answerCode: 'GENRL', answerDescription: 'Does not feel better',
      groupCode: '', interdictionCode: 'HDT',
      deferralPeriod: 1, periodType: 'D',
      commentRequired: 'N', manualAuditFlag: 'N', additionalDateFlag: 'N',
      effectiveDate: '2026-04-27'
    }
  ];

  const mockQuestionCodes = [
    { code: 'D51', description: 'Ever had chest pain?' },
    { code: 'D52', description: 'Family history?' }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    hhServiceSpy = jasmine.createSpyObj('HealthHistoryService', [
      'searchQuestions', 'searchAnswers', 'createAnswer', 'updateAnswer',
      'getGroupCodes', 'getPeriodTypes', 'getInterdictionCodes', 'getAnswerByCode'
    ]);
    hhServiceSpy.searchQuestions.and.returnValue(of({
      data: mockQuestionCodes.map(q => ({
        questionCode: q.code, questionDescription: q.description,
        refCode: '', gender: 'A', readMoreFlag: 'N', manualAuditFlag: '',
        manualAuditHistFlag: '', validateLookBackDate: '', periodTypeForLookBack: '',
        periodNumberForLookBack: null, effectiveDate: '2024-01-01'
      })),
      totalRecords: 2
    }));
    hhServiceSpy.searchAnswers.and.returnValue(of({ success: true, data: mockResponses, total: 2 }));

    snackBarSpy = createMockMatSnackBar();
    dialogSpy = createMockMatDialog();

    headerServiceMock = {
      chapterTimeZone: signal('-06:00'),
      chapterChanged$: chapterChanged$.asObservable()
    } as any;



      TestBed.configureTestingModule({
      imports: [HHResponsesTab, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HealthHistoryService, useValue: hhServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceMock }
      ]
    });





      hhServiceSpy.searchQuestions.calls.reset();


      hhServiceSpy.searchAnswers.calls.reset();


      hhServiceSpy.createAnswer.calls.reset();


      hhServiceSpy.updateAnswer.calls.reset();


      hhServiceSpy.getGroupCodes.calls.reset();


      hhServiceSpy.getPeriodTypes.calls.reset();


      hhServiceSpy.getInterdictionCodes.calls.reset();


      hhServiceSpy.getAnswerByCode.calls.reset();


      hhServiceSpy.searchAnswers.and.returnValue(of({ success: true, data: mockResponses, total: 2 }));


    fixture = TestBed.createComponent(HHResponsesTab);
    component = fixture.componentInstance;
    // Override the snackBar and dialog injected via standalone component environment injector
    // so our spies are used instead of the real instances from MatSnackBarModule/MatDialogModule.
    (component as any).snackBar = snackBarSpy;
    (component as any).dialog = dialogSpy;
    fixture.detectChanges();
    // Reset call counts after detectChanges (ngOnInit may have triggered calls)
    snackBarSpy.open.calls.reset();


    });


  describe('initialization', () => {
    it('should load question codes on init', () => {
      expect(hhServiceSpy.searchQuestions).toHaveBeenCalled();
      expect(component.questionCodes().length).toBe(2);
    });

    it('should initialize search form', () => {
      expect(component.searchForm).toBeTruthy();
      expect(component.searchForm.get('questionCode')).toBeTruthy();
      expect(component.searchForm.get('searchFor')).toBeTruthy();
    });

    it('should initialize search form with default values', () => {
      expect(component.searchForm.get('questionCode')?.value).toBeNull();
      expect(component.searchForm.get('searchFor')?.value).toBe('');
    });

    it('should set hasRetrieved to false on init', () => {
      expect(component.hasRetrieved).toBe(false);
    });

    it('should set isLoading to false on init', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should set sidePanelOpen to false on init', () => {
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should set selectedQuestionDescription to empty on init', () => {
      expect(component.selectedQuestionDescription).toBe('');
    });

    it('should sort question codes alphabetically by code', () => {
      const codes = component.questionCodes();
      expect(codes[0].code).toBe('D51');
      expect(codes[1].code).toBe('D52');
    });

    it('should subscribe to questionCodeSearchCtrl value changes', () => {
      component.questionCodeSearchCtrl.setValue('D51');
      expect(component.filteredQuestionCodes().length).toBe(1);
    });

    it('should handle null value from questionCodeSearchCtrl', () => {
      component.questionCodeSearchCtrl.setValue(null);
      expect(component.filteredQuestionCodes().length).toBe(2);
    });
  });

  describe('active input setter', () => {
    it('should load question codes when active is set to true', () => {
      hhServiceSpy.searchQuestions.calls.reset();
      component.active = true;
      expect(hhServiceSpy.searchQuestions).toHaveBeenCalled();
    });

    it('should not load question codes when active is set to false', () => {
      hhServiceSpy.searchQuestions.calls.reset();
      component.active = false;
      expect(hhServiceSpy.searchQuestions).not.toHaveBeenCalled();
    });
  });

  describe('onSelectOpenedChange', () => {
    it('should clear the search control when dropdown closes', () => {
      const ctrl = new FormControl('some search text');
      component.onSelectOpenedChange(ctrl, false);
      expect(ctrl.value).toBe('');
    });

    it('should not clear the search control when dropdown opens', () => {
      const ctrl = new FormControl('some search text');
      component.onSelectOpenedChange(ctrl, true);
      expect(ctrl.value).toBe('some search text');
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reset all state when chapter changes', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.selectedQuestionDescription = 'test';
      component.hasRetrieved = true;
      component.dataSource = mockResponses;
      component.totalRecords = 5;
      component.sidePanelOpen = true;
      component.sidePanelData = mockResponses[0];

      chapterChanged$.next();

      expect(component.searchForm.get('questionCode')?.value).toBeNull();
      expect(component.selectedQuestionDescription).toBe('');
      expect(component.hasRetrieved).toBe(false);
      expect(component.dataSource).toEqual([]);
      expect(component.totalRecords).toBe(0);
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should reset pagination on chapter change', () => {
      chapterChanged$.next();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should reload question codes on chapter change', () => {
      hhServiceSpy.searchQuestions.calls.reset();
      chapterChanged$.next();
      expect(hhServiceSpy.searchQuestions).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('loadQuestionCodes', () => {
    it('should set questionCodes to empty array on error', () => {
      hhServiceSpy.searchQuestions.and.returnValue(throwError(() => new Error('Network error')));
      component['loadQuestionCodes']();
      expect(component.questionCodes()).toEqual([]);
    });
  });

  describe('filteredQuestionCodes', () => {
    it('should return all codes when no search', () => {
      expect(component.filteredQuestionCodes().length).toBe(2);
    });

    it('should filter codes by code value', () => {
      component.questionCodeSearchCtrl.setValue('D51');
      const filtered = component.filteredQuestionCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('D51');
    });

    it('should filter codes by description', () => {
      component.questionCodeSearchCtrl.setValue('family');
      const filtered = component.filteredQuestionCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('D52');
    });

    it('should be case insensitive', () => {
      component.questionCodeSearchCtrl.setValue('CHEST');
      const filtered = component.filteredQuestionCodes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('D51');
    });

    it('should return empty array when no matches', () => {
      component.questionCodeSearchCtrl.setValue('xyz_no_match');
      const filtered = component.filteredQuestionCodes();
      expect(filtered.length).toBe(0);
    });

    it('should return all codes when search is empty string', () => {
      component.questionCodeSearchCtrl.setValue('');
      expect(component.filteredQuestionCodes().length).toBe(2);
    });
  });

  describe('onRetrieve', () => {
    it('should not retrieve when no question code selected', () => {
      component.onRetrieve();
      expect(component.hasRetrieved).toBe(false);
    });

    it('should load data when question code is selected', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.onRetrieve();

      expect(component.hasRetrieved).toBe(true);
      expect(component.selectedQuestionDescription).toBe('Ever had chest pain?');
      expect(hhServiceSpy.searchAnswers).toHaveBeenCalled();
    });

    it('should set empty description when question code not found in list', () => {
      component.searchForm.get('questionCode')?.setValue('UNKNOWN');
      component.onRetrieve();
      expect(component.selectedQuestionDescription).toBe('');
    });

    it('should reset pagination pageIndex to 0 on retrieve', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 3 }
      };
      component.searchForm.get('questionCode')?.setValue('D51');
      component.onRetrieve();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('loadData', () => {
    it('should not call searchAnswers when no question code', () => {
      hhServiceSpy.searchAnswers.calls.reset();
      component['loadData']();
      expect(hhServiceSpy.searchAnswers).not.toHaveBeenCalled();
    });

    it('should set isLoading to true when loading', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      const subject = new Subject<any>();
      hhServiceSpy.searchAnswers.and.returnValue(subject.asObservable());
      component['loadData']();
      expect(component.isLoading).toBe(true);
    });

    it('should set isLoading to false after successful load', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(component.isLoading).toBe(false);
    });

    it('should populate dataSource from successful response', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(component.dataSource).toEqual(mockResponses);
      expect(component.totalRecords).toBe(2);
    });

    it('should include searchFor param when provided', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.searchForm.get('searchFor')?.setValue('test search');
      component['loadData']();
      const callArgs = hhServiceSpy.searchAnswers.calls.mostRecent().args;
      expect(callArgs[2].searchFor).toBe('test search');
    });

    it('should trim searchFor param', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.searchForm.get('searchFor')?.setValue('  test  ');
      component['loadData']();
      const callArgs = hhServiceSpy.searchAnswers.calls.mostRecent().args;
      expect(callArgs[2].searchFor).toBe('test');
    });

    it('should not include searchFor when empty after trim', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.searchForm.get('searchFor')?.setValue('   ');
      component['loadData']();
      const callArgs = hhServiceSpy.searchAnswers.calls.mostRecent().args;
      expect(callArgs[2].searchFor).toBeUndefined();
    });

    it('should include sort params when direction is A', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'response', direction: 'A' }
      };
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      const callArgs = hhServiceSpy.searchAnswers.calls.mostRecent().args;
      expect(callArgs[2].sortBy).toBe('response');
      expect(callArgs[2].sortDir).toBe('asc');
    });

    it('should include sort params with desc when direction is not A', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'answerCode', direction: 'D' }
      };
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      const callArgs = hhServiceSpy.searchAnswers.calls.mostRecent().args;
      expect(callArgs[2].sortBy).toBe('answerCode');
      expect(callArgs[2].sortDir).toBe('desc');
    });

    it('should not include sort params when direction is default', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'response', direction: 'default' }
      };
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      const callArgs = hhServiceSpy.searchAnswers.calls.mostRecent().args;
      expect(callArgs[2].sortBy).toBeUndefined();
      expect(callArgs[2].sortDir).toBeUndefined();
    });

    it('should handle response with success false and errorResponse', () => {
      hhServiceSpy.searchAnswers.and.returnValue(of({
        success: false,
        errorResponse: { errorCode: 'ERR001', error: 'Bad request' },
        data: [], total: 0
      }));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(component.dataSource).toEqual([]);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: ERR001 Bad request', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should handle response with success false and errorCode on response', () => {
      hhServiceSpy.searchAnswers.and.returnValue(of({
        success: false,
        errorCode: 'ERR002',
        message: 'Server error',
        data: [], total: 0
      }));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: ERR002 Server error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should handle response with success false and statusCode', () => {
      hhServiceSpy.searchAnswers.and.returnValue(of({
        success: false,
        statusCode: '500',
        error: 'Internal error',
        data: [], total: 0
      }));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 500 Internal error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should handle response with success false and no error code', () => {
      hhServiceSpy.searchAnswers.and.returnValue(of({
        success: false,
        data: [], total: 0
      }));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error loading responses', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should handle HTTP error with error.error.errorResponse', () => {
      hhServiceSpy.searchAnswers.and.returnValue(throwError(() => ({
        status: 400,
        error: {
          errorResponse: { errorCode: 'ERR003', error: 'Validation failed' }
        }
      })));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(component.isLoading).toBe(false);
      expect(component.dataSource).toEqual([]);
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: ERR003 Validation failed', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
    });

    it('should handle HTTP error with error.error.errorCode', () => {
      hhServiceSpy.searchAnswers.and.returnValue(throwError(() => ({
        status: 500,
        error: { errorCode: 'ERR004', message: 'Something broke' }
      })));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: ERR004 Something broke', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should handle HTTP error with error.error.statusCode', () => {
      hhServiceSpy.searchAnswers.and.returnValue(throwError(() => ({
        error: { statusCode: '503', error: 'Service unavailable' }
      })));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 503 Service unavailable', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should handle HTTP error with error.status only', () => {
      hhServiceSpy.searchAnswers.and.returnValue(throwError(() => ({
        status: 404,
        error: {},
        message: 'Not found'
      })));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 404 Not found', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should handle HTTP error with no identifiers', () => {
      hhServiceSpy.searchAnswers.and.returnValue(throwError(() => ({
        error: {}
      })));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error loading responses', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should handle response with null data and total', () => {
      hhServiceSpy.searchAnswers.and.returnValue(of({
        success: true, data: null, total: null
      } as any));
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(component.dataSource).toEqual([]);
      expect(component.totalRecords).toBe(0);
    });

    it('should update tableConfig totalRecords on successful load', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      expect(component.tableConfig.pagination!.totalRecords).toBe(2);
    });

    it('should pass correct pageSize and skip to searchAnswers', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageSize: 50, pageIndex: 2 }
      };
      component.searchForm.get('questionCode')?.setValue('D51');
      component['loadData']();
      const callArgs = hhServiceSpy.searchAnswers.calls.mostRecent().args;
      expect(callArgs[0]).toBe(50);
      expect(callArgs[1]).toBe(100);
    });
  });

  describe('onPageChange', () => {
    it('should update pagination and load data', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.onPageChange({ pageIndex: 2, pageSize: 50, length: 100, previousPageIndex: 1 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(hhServiceSpy.searchAnswers).toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    it('should update sort config and load data', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.onSortChange({ column: 'answerCode', direction: 'A' });
      expect(component.tableConfig.sortConfig!.column).toBe('answerCode');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(hhServiceSpy.searchAnswers).toHaveBeenCalled();
    });
  });

  describe('side panel', () => {
    it('should open in add mode', () => {
      component.onAddNew();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should open in edit mode with data', () => {
      component.editRecord(mockResponses[0]);
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockResponses[0]);
    });

    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockResponses[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should keep panel open on save success with keepOpen', () => {
      component.onAddNew();
      component.searchForm.get('questionCode')?.setValue('D51');
      component.hasRetrieved = true;

      component.onSaveSuccess({ response: mockResponses[0], keepOpen: true });

      expect(component.sidePanelOpen).toBe(true);
    });

    it('should close panel on save success without keepOpen', () => {
      component.onAddNew();
      component.searchForm.get('questionCode')?.setValue('D51');
      component.hasRetrieved = true;

      component.onSaveSuccess({ response: mockResponses[0], keepOpen: false });

      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should show default success message on save', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.onSaveSuccess({ response: mockResponses[0], keepOpen: false });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Response saved successfully', 'DISMISS',
        jasmine.objectContaining({ duration: 3000, panelClass: ['success-snackbar'] })
      );
    });

    it('should show custom message on save when provided', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      component.onSaveSuccess({ response: mockResponses[0], keepOpen: false, message: 'Custom saved!' });
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Custom saved!', 'DISMISS',
        jasmine.objectContaining({ duration: 3000, panelClass: ['success-snackbar'] })
      );
    });

    it('should reload data on save success', () => {
      component.searchForm.get('questionCode')?.setValue('D51');
      hhServiceSpy.searchAnswers.calls.reset();
      component.onSaveSuccess({ response: mockResponses[0], keepOpen: false });
      expect(hhServiceSpy.searchAnswers).toHaveBeenCalled();
    });
  });

  describe('row actions', () => {
    it('should call editRecord for edit action', () => {
      spyOn(component, 'editRecord').and.stub();
      component.onRowAction({ action: 'edit', row: mockResponses[0] });
      expect(component.editRecord).toHaveBeenCalledWith(mockResponses[0]);
    });

    it('should call openComments for comments action', () => {
      spyOn(component, 'openComments').and.stub();
      component.onRowAction({ action: 'comments', row: mockResponses[0] });
      expect(component.openComments).toHaveBeenCalledWith(mockResponses[0]);
    });

    it('should not throw for unknown action', () => {
      expect(() => {
        component.onRowAction({ action: 'unknown', row: mockResponses[0] });
      }).not.toThrow();
    });
  });

  describe('openComments', () => {
    it('should open ResponseComments dialog with correct config', () => {
      component.openComments(mockResponses[0]);
      expect(dialogSpy.open).toHaveBeenCalledWith(ResponseComments, jasmine.objectContaining({
        width: '750px',
        height: '100vh',
        maxWidth: '750px',
        position: { top: '0', right: '0' },
        autoFocus: false,
        hasBackdrop: true,
        panelClass: ['comments-drawer-panel'],
        data: {
          questionCode: 'D51',
          answerCode: 'DRHEA',
          response: 'Y'
        }
      }));
    });
  });

  describe('table config', () => {
    it('should have correct number of columns', () => {
      expect(component.tableConfig.columns.length).toBe(12);
    });

    it('should have response column as sortable', () => {
      const responseCol = component.tableConfig.columns.find(c => c.key === 'response');
      expect(responseCol?.sortable).toBe(true);
    });

    it('should have correct default pagination', () => {
      expect(component.tableConfig.pagination!.pageSize).toBe(25);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should have correct default sort config', () => {
      expect(component.tableConfig.sortConfig!.column).toBe('response');
      expect(component.tableConfig.sortConfig!.direction).toBe('default');
    });

    it('should hide comment action when commentRequired is N', () => {
      const commentAction = component.tableConfig.rowActions?.find(a => a.action === 'comments');
      expect(commentAction?.visible).toBeTruthy();
      expect(commentAction!.visible!(mockResponses[1])).toBe(false);
    });

    it('should show comment action when commentRequired is Y', () => {
      const commentAction = component.tableConfig.rowActions?.find(a => a.action === 'comments');
      expect(commentAction!.visible!(mockResponses[0])).toBe(true);
    });

    it('should have edit action without visibility condition', () => {
      const editAction = component.tableConfig.rowActions?.find(a => a.action === 'edit');
      expect(editAction).toBeTruthy();
      expect(editAction!.visible).toBeUndefined();
    });
  });

  describe('column valueFormatters', () => {
    it('should format response Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'response');
      expect(col!.valueFormatter!('Y')).toBe('Yes');
    });

    it('should format response N as No', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'response');
      expect(col!.valueFormatter!('N')).toBe('No');
    });

    it('should format response U as Unanswered', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'response');
      expect(col!.valueFormatter!('U')).toBe('Unanswered');
    });

    it('should pass through other response values as-is', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'response');
      expect(col!.valueFormatter!('X')).toBe('X');
    });

    it('should format commentRequired Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'commentRequired');
      expect(col!.valueFormatter!('Y')).toBe('Yes');
    });

    it('should format commentRequired N as No', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'commentRequired');
      expect(col!.valueFormatter!('N')).toBe('No');
    });

    it('should format manualAuditFlag Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'manualAuditFlag');
      expect(col!.valueFormatter!('Y')).toBe('Yes');
    });

    it('should format manualAuditFlag N as No', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'manualAuditFlag');
      expect(col!.valueFormatter!('N')).toBe('No');
    });

    it('should format additionalDateFlag Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'additionalDateFlag');
      expect(col!.valueFormatter!('Y')).toBe('Yes');
    });

    it('should format additionalDateFlag N as No', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'additionalDateFlag');
      expect(col!.valueFormatter!('N')).toBe('No');
    });

    it('should format effectiveDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      const result = col!.valueFormatter!('2026-04-29');
      expect(result).toMatch(/29-APR-2026/);
    });

    it('should format terminationDate when present', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      const result = col!.valueFormatter!('2026-12-31');
      expect(result).toMatch(/31-DEC-2026/);
    });

    it('should return empty string for null terminationDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      expect(col!.valueFormatter!(null)).toBe('');
    });

    it('should return empty string for undefined terminationDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      expect(col!.valueFormatter!(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should return dash for empty string', () => {
      expect(component['formatDate']('')).toBe('-');
    });

    it('should format a valid date string', () => {
      expect(component['formatDate']('2026-01-15')).toBe('15-JAN-2026');
    });

    it('should format date with zero-padded day', () => {
      expect(component['formatDate']('2026-03-05')).toBe('05-MAR-2026');
    });

    it('should format December date', () => {
      expect(component['formatDate']('2026-12-25')).toBe('25-DEC-2026');
    });

    it('should format June date', () => {
      expect(component['formatDate']('2026-06-01')).toBe('01-JUN-2026');
    });
  });
});
