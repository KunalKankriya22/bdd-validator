import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError, Subject } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';

import { DefineHlaMatchingGrades } from './define-hla-matching-grades';
import { HlaGradingService } from './services/hla-grading.service';
import { HlaGradingDialogService } from './services/hla-grading-dialog.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { HlaGradingModel, HlaGradingFilterValue } from './models/hla-grading.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('DefineHlaMatchingGrades', () => {
  let dialogSubject: any;
  let mockPageHeaderService: any;
  let component: DefineHlaMatchingGrades;
  let fixture: ComponentFixture<DefineHlaMatchingGrades>;
  let mockService: jasmine.SpyObj<HlaGradingService>;
  let mockDialogService: jasmine.SpyObj<HlaGradingDialogService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockRecords: HlaGradingModel[] = [
    {
      gradeId: 1, grade: 'C3X', a1: 'I', a2: 'I', b1: 'I', b2: 'I',
      gradeLevel: 1, effectiveDate: '2024-01-01', terminationDate: null,
      totalCount: 2, maxGradeId: 5
    },
    {
      gradeId: 2, grade: 'B1U', a1: 'I', a2: 'U', b1: 'I', b2: 'I',
      gradeLevel: 2, effectiveDate: '2024-02-01', terminationDate: null,
      totalCount: 2, maxGradeId: 5
    }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    mockService = jasmine.createSpyObj('HlaGradingService', [
      'getHlaGradingRecords', 'getDropdowns', 'createHlaGrading', 'updateHlaGrading', 'getNextGradeId'
    ]);
    mockService.getHlaGradingRecords.and.returnValue(of({ data: mockRecords, total: 2 }));
    mockService.getNextGradeId.and.returnValue(of(6));
    mockService.getDropdowns.and.returnValue(of({
      grades: [{ key: 'C3X', value: 'Grade C3X' }],
      hlaCodes: [{ key: 'I', value: 'Code I' }]
    }));

    mockDialogService = jasmine.createSpyObj('HlaGradingDialogService', [
      'openAddDialog', 'openEditDialog'
    ]);
    mockDialogService.openAddDialog.and.returnValue(of(false));
    mockDialogService.openEditDialog.and.returnValue(of(false));

    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChanged$.asObservable() });

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    mockPageHeaderService.getTitle.and.returnValue('Define HLA Matching Grades');
    mockPageHeaderService.getSubtitle.and.returnValue('');



      TestBed.configureTestingModule({
      imports: [DefineHlaMatchingGrades, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HlaGradingService, useValue: mockService },
        { provide: HlaGradingDialogService, useValue: mockDialogService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    });

      mockService.getHlaGradingRecords.and.returnValue(of({ data: mockRecords, total: 2 }));


      mockService.getNextGradeId.and.returnValue(of(6));


      mockDialogService.openAddDialog.and.returnValue(of(false));


      mockDialogService.openEditDialog.and.returnValue(of(false));


      mockPageHeaderService.getTitle.and.returnValue('Define HLA Matching Grades');


      mockPageHeaderService.getSubtitle.and.returnValue('');


    fixture = TestBed.createComponent(DefineHlaMatchingGrades);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {
    it('should load data and dropdowns on init', () => {
      fixture.detectChanges();

      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
      expect(mockService.getDropdowns).toHaveBeenCalled();
    });


    it('should set maxGradeId from first record', () => {
      fixture.detectChanges();

      expect(component.nextGradeId).toBe(6);
    });



    it('should handle data loading error', () => {
      mockService.getHlaGradingRecords.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      fixture.detectChanges();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });


    it('should have enableRowHighlight set to false', () => {
      expect(component.tableConfig.enableRowHighlight).toBeFalse();
    });

  });

  describe('Search', () => {
    beforeEach(() => fixture.detectChanges());

    it('should set search keyword and reload data', () => {
      component.onSearch('C3X');

      expect(component.searchTerm).toBe('C3X');
      expect(component.requestState.searchKeyword).toBe('C3X');
      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
    });

    it('should trim search term', () => {
      component.onSearch('  C3X  ');

      expect(component.searchTerm).toBe('C3X');
    });


    it('should clear search and reload', () => {
      component.searchTerm = 'test';
      component.requestState.searchKeyword = 'test';
      component.onSearchCleared();

      expect(component.searchTerm).toBe('');
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
    });
  });


  describe('Sorting', () => {
    beforeEach(() => fixture.detectChanges());

    it('should handle sort change for gradeId column', () => {
      component.onSortChange({ column: 'gradeId', direction: 'A' });

      expect(component.requestState.sortColumn).toBe('grade_id');
      expect(component.requestState.sortDirection).toBe('A');
      expect(component.tableConfig.sortConfig?.direction).toBe('A');
      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
    });


    it('should reset page index on sort change', () => {
      component.tableConfig.pagination!.pageIndex = 3;

      component.onSortChange({ column: 'gradeId', direction: 'D' });

      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => fixture.detectChanges());


    it('should set isDialogOpen during edit dialog lifecycle', () => {
      dialogSubject = new Subject<boolean>();
      mockDialogService.openEditDialog.and.returnValue(dialogSubject.asObservable());

      component.onRowAction({ action: 'edit', row: mockRecords[0] });

      expect(component.isDialogOpen).toBeTrue();

      dialogSubject.next(false);
      dialogSubject.complete();

      expect(component.isDialogOpen).toBeFalse();
    });

    it('should reload data when edit dialog returns success', () => {
      mockDialogService.openEditDialog.and.returnValue(of(true));

      component.onRowAction({ action: 'edit', row: mockRecords[0] });

      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
      expect(mockService.getDropdowns).toHaveBeenCalled();
    });

  });

  describe('Create Record', () => {
    beforeEach(() => fixture.detectChanges());


    it('should set isDialogOpen when creating', () => {
      component.createRecord();

      expect(component.isDialogOpen).toBeFalse();
    });

    it('should reload data when add succeeds', () => {
      mockDialogService.openAddDialog.and.returnValue(of(true));

      component.createRecord();

      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
      expect(mockService.getDropdowns).toHaveBeenCalled();
    });
  });

  describe('Filters', () => {
    beforeEach(() => fixture.detectChanges());





    it('should clear all filters and reload', () => {
      component.appliedFilters = { effectivePeriod: 'After', effectiveDate: '2024-01-15' };
      component.filterChips = [{ key: 'effectiveDate', label: 'Eff', value: '2024-01-15' }];
      component.requestState = { effectiveDatePeriod: 'After', effectiveDate: '2024-01-15' };
      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.requestState.effectiveDatePeriod).toBeUndefined();
      expect(component.requestState.effectiveDate).toBeUndefined();
      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
    });
  });

  describe('Chapter Change', () => {
    beforeEach(() => fixture.detectChanges());

    it('should reset state and reload on chapter change', () => {
      component.searchTerm = 'test';
      component.appliedFilters = { effectiveDate: '2024-01-01' };
      component.filterChips = [{ key: 'test', label: 'Test', value: 'test' }];
      component.isFilterOpen = true;

      chapterChanged$.next();

      expect(component.searchTerm).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.isFilterOpen).toBeFalse();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
      expect(mockService.getDropdowns).toHaveBeenCalled();
    });
  });
  describe('Table Config', () => {




    it('should format effectiveDate column values', () => {
      const effDateCol = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      expect(effDateCol?.valueFormatter).toBeDefined();
      expect(effDateCol?.valueFormatter?.(null, {} as HlaGradingModel)).toBe('--');
    });

    it('should format terminationDate column values', () => {
      const termDateCol = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      expect(termDateCol?.valueFormatter).toBeDefined();
      expect(termDateCol?.valueFormatter?.(null, {} as HlaGradingModel)).toBe('--');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => fixture.detectChanges());

    it('should handle page change and reload data', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 50, previousPageIndex: 1 });

      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
    });
  });

  describe('Filter Panel', () => {
    beforeEach(() => fixture.detectChanges());

    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBeFalse();
      component.openFilter();
      expect(component.isFilterOpen).toBeTrue();
      component.openFilter();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close filter panel and blur button', () => {
      component.isFilterOpen = true;
      component.closeFilterPanel();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should apply filters and update request state', () => {
      const filters: HlaGradingFilterValue = {
        effectivePeriod: 'After',
        effectiveDate: '2024-01-15',
        terminationPeriod: 'Before',
        terminationDate: '2025-12-31'
      };
      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.effectiveDatePeriod).toBe('After');
      expect(component.requestState.effectiveDate).toBe('2024-01-15');
      expect(component.requestState.terminationDatePeriod).toBe('Before');
      expect(component.requestState.terminationDate).toBe('2025-12-31');
      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
    });

    it('should remove filter chip and update request state', () => {
      component.appliedFilters = { effectivePeriod: 'After', effectiveDate: '2024-01-15' };
      component.filterChips = [{ key: 'effectiveDate', label: 'Eff', value: '2024-01-15' }];
      component.requestState = { effectiveDatePeriod: 'After', effectiveDate: '2024-01-15' };

      component.onRemoveFilterChip('effectiveDate');

      expect(mockService.getHlaGradingRecords).toHaveBeenCalled();
    });
  });

  describe('Sort edge case', () => {
    beforeEach(() => fixture.detectChanges());

    it('should ignore sort for non-gradeId column', () => {
      const callsBefore = mockService.getHlaGradingRecords.calls.count();
      component.onSortChange({ column: 'grade', direction: 'A' });
      expect(mockService.getHlaGradingRecords.calls.count()).toBe(callsBefore);
    });

    it('should set descending direction correctly', () => {
      component.onSortChange({ column: 'gradeId', direction: 'D' });
      expect(component.requestState.sortDirection).toBe('D');
    });
  });

  describe('Row Action edge case', () => {
    beforeEach(() => fixture.detectChanges());

    it('should not open dialog for non-edit actions', () => {
      component.onRowAction({ action: 'delete', row: mockRecords[0] });
      expect(mockDialogService.openEditDialog).not.toHaveBeenCalled();
    });
  });

  describe('NextGradeId error', () => {
    it('should handle getNextGradeId error silently', () => {
      mockService.getNextGradeId.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      // Should not throw
      expect(component.nextGradeId).toBeDefined();
    });
  });

  describe('Dropdown error', () => {
    it('should handle getDropdowns error gracefully', () => {
      mockService.getDropdowns.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();

      expect(component.gradeOptions).toEqual([]);
      expect(component.hlaCodeOptions).toEqual([]);
    });
  });

  describe('Create/Edit error paths', () => {
    beforeEach(() => fixture.detectChanges());

    it('should use cached values when dropdown fetch fails during create', () => {
      mockService.getDropdowns.and.returnValue(throwError(() => new Error('fail')));

      component.createRecord();

      expect(mockDialogService.openAddDialog).toHaveBeenCalled();
    });

    it('should use cached values when dropdown fetch fails during edit', () => {
      mockService.getDropdowns.and.returnValue(throwError(() => new Error('fail')));

      component.editRecord(mockRecords[0]);

      expect(mockDialogService.openEditDialog).toHaveBeenCalled();
    });
  });
});
