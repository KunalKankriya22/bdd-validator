import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Distribution } from './distribution';
import { ErrorCodeDialogService } from '../services/error-code-dialog.service';
import { ErrorCodeFacadeService } from '../services/error-code-facade.service';
import { ErrorCodesFilterComponent } from '../error-code-filter/error-code-filter';
import {
  ErrorCode,
  ErrorType,
  AuditFlag,
  ErrorCodeFilter
} from '../models/error-code.model';
import { TablePageEvent, TableSortEvent } from '@shared/interfaces/data-table.interface';
import { createMockTranslateService, createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('Distribution', () => {
  let component: Distribution;
  let fixture: ComponentFixture<Distribution>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogService: jasmine.SpyObj<ErrorCodeDialogService>;
  let mockFacadeService: jasmine.SpyObj<ErrorCodeFacadeService>;

  beforeEach(() => {

    mockDialog = createMockMatDialog();
    mockDialogService = jasmine.createSpyObj('ErrorCodeDialogService', [
      'openEditCodeDialog'
    ]);
    mockFacadeService = jasmine.createSpyObj('ErrorCodeFacadeService', [
      'loadErrorCodes',
      'search',
      'changePagination',
      'changeSort',
      'applyFilters',
      'updateErrorCode'
    ]);

    // Setup signals for the facade service
    const errorCodesSignal = signal<ErrorCode[]>([]);
    const loadingSignal = signal<boolean>(false);
    const totalRecordsSignal = signal<number>(0);
    const sortSignal = signal<string | null>(null);
    const currentFiltersSignal = signal<ErrorCodeFilter>({
      codeFrom: '',
      codeTo: '',
      errorType: null,
      auditFlag: null,
      showEmpty: false
    });
    const searchKeywordSignal = signal<string>('');
    const paginationSignal = signal({ take: 10, skip: 0 });

    Object.defineProperty(mockFacadeService, 'errorCodes$', {
      get: () => errorCodesSignal
    });
    Object.defineProperty(mockFacadeService, 'loading$', {
      get: () => loadingSignal
    });
    Object.defineProperty(mockFacadeService, 'totalRecords$', {
      get: () => totalRecordsSignal
    });
    Object.defineProperty(mockFacadeService, 'sort$', {
      get: () => sortSignal
    });
    Object.defineProperty(mockFacadeService, 'currentFilters$', {
      get: () => currentFiltersSignal
    });
    Object.defineProperty(mockFacadeService, 'searchKeyword$', {
      get: () => searchKeywordSignal
    });
    Object.defineProperty(mockFacadeService, 'pagination$', {
      get: () => paginationSignal
    });

    mockFacadeService.updateErrorCode.and.returnValue(of(undefined));



      TestBed.configureTestingModule({
      imports: [Distribution],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: mockDialog },
        { provide: ErrorCodeDialogService, useValue: mockDialogService },
        { provide: ErrorCodeFacadeService, useValue: mockFacadeService },
        {
          provide: MatSnackBar,
          useValue: createMockMatSnackBar()
        },
        {
          provide: TranslateService,
          useValue: createMockTranslateService()
        }
      ]
    });


    


      mockDialog.open.calls.reset();


      mockDialogService.openEditCodeDialog.calls.reset();


      mockFacadeService.loadErrorCodes.calls.reset();


      mockFacadeService.search.calls.reset();


      mockFacadeService.changePagination.calls.reset();


      mockFacadeService.changeSort.calls.reset();


      mockFacadeService.applyFilters.calls.reset();


      mockFacadeService.updateErrorCode.calls.reset();


      mockFacadeService.updateErrorCode.and.returnValue(of(undefined));


    fixture = TestBed.createComponent(Distribution);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // -------------------------------------------------------
  // Initialization
  // -------------------------------------------------------
  describe('Initialization', () => {


    it('should initialize dataSource with empty array', () => {
      expect(component.dataSource).toEqual([]);
    });



  });

  // -------------------------------------------------------
  // Data Binding
  // -------------------------------------------------------
  describe('Data Binding', () => {
    it('should expose loading$ getter', () => {
      expect(component.loading$).toBeDefined();
      expect(component.loading$()).toBe(false);
    });
  });

  // -------------------------------------------------------
  // Search Functionality
  // -------------------------------------------------------
  describe('Search Functionality', () => {
    it('should call facade search method with keyword', () => {
      const keyword = 'test';

      component.onSearch(keyword);

      expect(mockFacadeService.search).toHaveBeenCalledWith(keyword);
    });


    it('should search for different values', () => {
      component.onSearch('test1');
      expect(mockFacadeService.search).toHaveBeenCalledWith('test1');

      component.onSearch('test2');
      expect(mockFacadeService.search).toHaveBeenCalledWith('test2');
    });
  });

  // -------------------------------------------------------
  // Pagination
  // -------------------------------------------------------
  describe('Pagination', () => {
    it('should handle page change correctly', () => {
      const pageEvent: TablePageEvent = {
        pageIndex: 2,
        pageSize: 25,
        previousPageIndex: 1
      };

      component.onPageChange(pageEvent);

      expect(mockFacadeService.changePagination).toHaveBeenCalledWith({
        take: 25,
        skip: 50
      });
    });

    it('should handle first page correctly', () => {
      const pageEvent: TablePageEvent = {
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0
      };

      component.onPageChange(pageEvent);

      expect(mockFacadeService.changePagination).toHaveBeenCalledWith({
        take: 10,
        skip: 0
      });
    });

    it('should calculate skip correctly for different page sizes', () => {
      const testCases = [
        { pageIndex: 1, pageSize: 10, expectedSkip: 10 },
        { pageIndex: 3, pageSize: 25, expectedSkip: 75 },
        { pageIndex: 5, pageSize: 50, expectedSkip: 250 },
        { pageIndex: 2, pageSize: 100, expectedSkip: 200 }
      ];

      testCases.forEach(testCase => {
        const pageEvent: TablePageEvent = {
          pageIndex: testCase.pageIndex,
          pageSize: testCase.pageSize,
          previousPageIndex: testCase.pageIndex - 1
        };

        component.onPageChange(pageEvent);

        expect(mockFacadeService.changePagination).toHaveBeenCalledWith({
          take: testCase.pageSize,
          skip: testCase.expectedSkip
        });
      });
    });
  });

  // -------------------------------------------------------
  // Sorting
  // -------------------------------------------------------
  describe('Sorting', () => {
    it('should convert ascending direction to "A"', () => {
      const sortEvent: TableSortEvent = {
        column: 'errorCode',
        direction: 'A'
      };

      component.onSortChange(sortEvent);

      expect(mockFacadeService.changeSort).toHaveBeenCalledWith('A');
    });

    it('should convert descending direction to "D"', () => {
      const sortEvent: TableSortEvent = {
        column: 'errorCode',
        direction: 'D'
      };

      component.onSortChange(sortEvent);

      expect(mockFacadeService.changeSort).toHaveBeenCalledWith('D');
    });

    it('should convert "default" direction to null', () => {
      const sortEvent: TableSortEvent = {
        column: 'errorCode',
        direction: 'default'
      };

      component.onSortChange(sortEvent);

      expect(mockFacadeService.changeSort).toHaveBeenCalledWith(null);
    });
  });

  // -------------------------------------------------------
  // Filter Dialog
  // -------------------------------------------------------
  describe('Filter Dialog', () => {

    it('should apply filters when dialog returns filters', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '9999',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: AuditFlag.YES,
        showEmpty: false
      };

      const mockDialogRef = {
        afterClosed: () => of(filters),
        componentInstance: {
          codeFrom: '',
          codeTo: '',
          selectedType: null,
          selectedAudit: null,
          showEmpty: false
        }
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      const mockEvent = {
        currentTarget: document.createElement('button')
      } as any;

      spyOn(mockEvent.currentTarget, 'getBoundingClientRect').and.returnValue({
        left: 100, bottom: 200, top: 150, right: 200,
        width: 100, height: 50, x: 100, y: 150, toJSON: () => ({})
      });

      component.openFilter(mockEvent);

      expect(mockFacadeService.applyFilters).toHaveBeenCalledWith(filters);
    });



    it('should adjust dialog position when near screen edge', () => {
      const mockDialogRef = {
        afterClosed: () => of(null),
        componentInstance: {
          codeFrom: '',
          codeTo: '',
          selectedType: null,
          selectedAudit: null,
          showEmpty: false
        }
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 400
      });

      const mockEvent = {
        currentTarget: document.createElement('button')
      } as any;

      spyOn(mockEvent.currentTarget, 'getBoundingClientRect').and.returnValue({
        left: 350, // Near right edge
        bottom: 200,
        top: 150,
        right: 450,
        width: 100,
        height: 50,
        x: 350,
        y: 150,
        toJSON: () => ({})
      });

      component.openFilter(mockEvent);

      const callArgs = mockDialog.open.calls.mostRecent().args[1];
      const leftPosition = parseInt(callArgs?.position?.left || '0');
      
      // Should be adjusted to fit within window (400 - 300 - 8 = 92)
      expect(leftPosition).toBeLessThan(350);
    });
  });

  // -------------------------------------------------------
  // Edit Dialog
  // -------------------------------------------------------


  // -------------------------------------------------------
  // Component Lifecycle
  // -------------------------------------------------------
  // -------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------
  describe('Edge Cases', () => {
    it('should handle empty search string', () => {
      component.onSearch('');

      expect(mockFacadeService.search).toHaveBeenCalledWith('');
    });

    it('should handle zero page index', () => {
      const pageEvent: TablePageEvent = {
        pageIndex: 0,
        pageSize: 10,
        previousPageIndex: 0
      };

      component.onPageChange(pageEvent);

      expect(mockFacadeService.changePagination).toHaveBeenCalledWith({
        take: 10,
        skip: 0
      });
    });


  });

  // -------------------------------------------------------
  // Filter Chips
  // -------------------------------------------------------
  describe('Filter Chips', () => {
    it('should return true when filter chips exist', () => {
      component.filterChips = [
        { key: 'codeRange', label: 'Code: 0001 - 9999', value: { from: '0001', to: '9999' }, removable: true }
      ];

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false when no filter chips exist', () => {
      component.filterChips = [];

      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should remove a single filter and call applyFilters with updated filters', () => {
      const currentFilters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '9999',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: null,
        showEmpty: false
      };

      const updatedFilters: ErrorCodeFilter = {
        codeFrom: '',
        codeTo: '',
        errorType: ErrorType.SHOW_MESSAGE_ONLY,
        auditFlag: null,
        showEmpty: false
      };

      // Update the signal to return the current filters
      const currentFiltersSignal = fixture.componentRef.injector.get(ErrorCodeFacadeService).currentFilters$ as any;
      currentFiltersSignal.set(currentFilters);

      component.onRemoveFilterChip('codeRange');

      expect(mockFacadeService.applyFilters).toHaveBeenCalledWith(updatedFilters);
    });



    it('should reset all filter values when clearAllFilters is called', () => {
      component.clearAllFilters();

      expect(mockFacadeService.applyFilters).toHaveBeenCalledWith({
        codeFrom: '',
        codeTo: '',
        errorType: null,
        auditFlag: null,
        showEmpty: false
      });
    });

    it('should update filterChips when facade filters change', () => {
      const filters: ErrorCodeFilter = {
        codeFrom: '0001',
        codeTo: '9999',
        errorType: ErrorType.SHOW_WARNING_ONLY,
        auditFlag: AuditFlag.YES,
        showEmpty: true
      };

      // Manually trigger the effect by updating the signal
      const currentFiltersSignal = fixture.componentRef.injector.get(ErrorCodeFacadeService).currentFilters$ as any;
      currentFiltersSignal.set(filters);

      // Wait for effect to run
      fixture.detectChanges();

      expect(component.filterChips.length).toBe(4);
      expect(component.filterChips[0].key).toBe('codeRange');
      expect(component.filterChips[1].key).toBe('errorType');
      expect(component.filterChips[2].key).toBe('auditFlag');
      expect(component.filterChips[3].key).toBe('showEmpty');
    });
  });
});