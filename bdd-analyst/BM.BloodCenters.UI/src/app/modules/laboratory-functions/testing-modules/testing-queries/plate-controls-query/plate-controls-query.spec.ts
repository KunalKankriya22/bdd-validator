import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Component, Input, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Subject, of, throwError } from 'rxjs';

import { PlateControlsQueryComponent } from './plate-controls-query';
import { PlateControlsQueryService } from './plate-controls-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub {
  @Input() config: any;
}

const MOCK_TEST_IDS = [{ testId: 'HBS', testDesc: 'Hepatitis B Surface' }, { testId: 'HCV', testDesc: 'Hepatitis C Virus' }];
const MOCK_BATCH_IDS = [{ tbId: 'TB20260501001', testDesc: 'Batch One' }, { tbId: 'TB20260501002', testDesc: 'Batch Two' }];
const MOCK_RECORDS = [
  { tbId: 'TB20260501001', refControl: 'CTRL001', refAbsorbance: '0.500', cutOffValue: '0.600', refRatio: '0.833', refResult: 'NEG', insertDats: '05-01-26' },
  { tbId: 'TB20260501002', refControl: 'CTRL002', refAbsorbance: '0.450', cutOffValue: '0.600', refRatio: '0.750', refResult: 'NEG', insertDats: '05-01-26' },
];

describe('PlateControlsQueryComponent', () => {
  let component: PlateControlsQueryComponent;
  let fixture: ComponentFixture<PlateControlsQueryComponent>;
  let chapterChanged$: Subject<void>;
  let serviceSpy: jasmine.SpyObj<PlateControlsQueryService>;

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    serviceSpy = jasmine.createSpyObj('PlateControlsQueryService', [
      'getTestIds', 'getTestBatchIds', 'query',
    ]);
    serviceSpy.getTestIds.and.returnValue(of({ success: true, message: '', data: MOCK_TEST_IDS }));
    serviceSpy.getTestBatchIds.and.returnValue(of({ success: true, message: '', data: MOCK_BATCH_IDS }));
    serviceSpy.query.and.returnValue(of({ success: true, message: '', data: MOCK_RECORDS, total: 2 }));



      TestBed.configureTestingModule({
      imports: [
        PlateControlsQueryComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule,
        MatPaginatorModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
      ],
      providers: [
        { provide: PlateControlsQueryService, useValue: serviceSpy },
        { provide: PageHeaderService, useValue: { pageHeaderData: signal(null) } },
        { provide: HeaderService, useValue: { chapterChanged$: chapterChanged$.asObservable() } },
      ],
    })
      .overrideComponent(PlateControlsQueryComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb] },
        add: { imports: [PageHeaderStub] },
      });





      serviceSpy.getTestIds.calls.reset();


      serviceSpy.getTestBatchIds.calls.reset();


      serviceSpy.query.calls.reset();


      serviceSpy.getTestIds.and.returnValue(of({ success: true, message: '', data: MOCK_TEST_IDS }));


      serviceSpy.getTestBatchIds.and.returnValue(of({ success: true, message: '', data: MOCK_BATCH_IDS }));


      serviceSpy.query.and.returnValue(of({ success: true, message: '', data: MOCK_RECORDS, total: 2 }));


    fixture = TestBed.createComponent(PlateControlsQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  it('should load test IDs from API on init', () => {
    expect(serviceSpy.getTestIds).toHaveBeenCalled();
    expect(component.testIdOptions.length).toBe(2);
    expect(component.testIdOptions[0].testId).toBe('HBS');
  });



  it('should load batch IDs from API when test ID changes', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();
    expect(serviceSpy.getTestBatchIds).toHaveBeenCalledWith('HBS');
    expect(component.batchIdOptions.length).toBe(2);
    expect(component.batchIdOptions[0].tbId).toBe('TB20260501001');
  });

  it('should clear batch IDs when test ID is cleared', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    component.filterForm.get('testId')!.setValue(null);
    fixture.detectChanges();
    expect(component.batchIdOptions.length).toBe(0);
  });

  it('should reset testBatchId when testId changes', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    component.filterForm.get('testBatchId')!.setValue('TB20260501001', { emitEvent: false });
    component.filterForm.get('testId')!.setValue('HCV');
    expect(component.filterForm.get('testBatchId')!.value).toBeNull();
  });

  it('should auto-fetch with correct payload when testId is selected', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();

    expect(serviceSpy.query).toHaveBeenCalledWith(jasmine.objectContaining({
      testId: 'HBS',
      tbId: null,
      take: 25,
      skip: 0,
      sortColumn: 'TbId',
      sortOrder: 'DESC',
    }));
  });

  it('should set data and totalCount after testId selection', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();

    expect(component.hasRetrieved).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(component.totalCount).toBe(2);
    expect(component.pagedData.length).toBe(2);
    expect(component.pagedData[0].tbId).toBe('TB20260501001');
  });

  it('should reset pageIndex to 0 on testId selection', () => {
    component.pageIndex = 3;
    component.filterForm.get('testId')!.setValue('HBS');
    expect(component.pageIndex).toBe(0);
  });

  it('should auto-fetch with tbId filter when batch ID is selected', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    serviceSpy.query.calls.reset();
    component.filterForm.get('testBatchId')!.setValue('TB20260501001');

    expect(serviceSpy.query).toHaveBeenCalledWith(jasmine.objectContaining({
      tbId: 'TB20260501001',
    }));
  });

  // --- Search filtering (computed signals) ---

  it('should return all test IDs when search term is empty', () => {
    expect(component.filteredTestIds().length).toBe(2);
  });

  it('should filter test IDs by testId match', () => {
    component.testIdSearchCtrl.setValue('HBS');
    fixture.detectChanges();
    expect(component.filteredTestIds().length).toBe(1);
    expect(component.filteredTestIds()[0].testId).toBe('HBS');
  });

  it('should filter test IDs by testDesc match', () => {
    component.testIdSearchCtrl.setValue('Hepatitis C');
    fixture.detectChanges();
    expect(component.filteredTestIds().length).toBe(1);
    expect(component.filteredTestIds()[0].testId).toBe('HCV');
  });

  it('should return empty array when no test IDs match search', () => {
    component.testIdSearchCtrl.setValue('NONEXISTENT');
    fixture.detectChanges();
    expect(component.filteredTestIds().length).toBe(0);
  });

  it('should filter test IDs case-insensitively', () => {
    component.testIdSearchCtrl.setValue('hbs');
    fixture.detectChanges();
    expect(component.filteredTestIds().length).toBe(1);
  });

  it('should return all batch IDs when search term is empty', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();
    expect(component.filteredBatchIds().length).toBe(2);
  });

  it('should filter batch IDs by tbId match', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();
    component.batchIdSearchCtrl.setValue('001');
    fixture.detectChanges();
    expect(component.filteredBatchIds().length).toBe(1);
    expect(component.filteredBatchIds()[0].tbId).toBe('TB20260501001');
  });

  it('should filter batch IDs by testDesc match', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();
    component.batchIdSearchCtrl.setValue('Batch Two');
    fixture.detectChanges();
    expect(component.filteredBatchIds().length).toBe(1);
    expect(component.filteredBatchIds()[0].tbId).toBe('TB20260501002');
  });

  // --- Pagination ---

  it('should update pageSize and pageIndex on page change and fetch', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    serviceSpy.query.calls.reset();

    const pageEvent: PageEvent = { pageIndex: 2, pageSize: 50, length: 100, previousPageIndex: 1 };
    component.onPageChange(pageEvent);

    expect(component.pageSize).toBe(50);
    expect(component.pageIndex).toBe(2);
    expect(serviceSpy.query).toHaveBeenCalledWith(jasmine.objectContaining({
      take: 50,
      skip: 100,
    }));
  });

  it('should calculate correct skip value based on pageIndex and pageSize', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    serviceSpy.query.calls.reset();

    const pageEvent: PageEvent = { pageIndex: 1, pageSize: 10, length: 50, previousPageIndex: 0 };
    component.onPageChange(pageEvent);

    expect(serviceSpy.query).toHaveBeenCalledWith(jasmine.objectContaining({
      skip: 10,
      take: 10,
    }));
  });

  it('should have default pageSizeOptions of [10, 25, 50, 100]', () => {
    expect(component.pageSizeOptions).toEqual([10, 25, 50, 100]);
  });

  it('should have default pageSize of 25', () => {
    expect(component.pageSize).toBe(25);
  });

  // --- Sort cycle ---

  it('should default to descending sort on tbId', () => {
    expect(component.sortColumn).toBe('tbId');
    expect(component.sortDir).toBe('desc');
  });

  it('should cycle sort direction desc -> asc -> default on same column', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    component.hasRetrieved = true;

    expect(component.sortDir).toBe('desc');

    component.toggleSort('tbId');
    expect(component.sortDir).toBe('asc');

    component.toggleSort('tbId');
    expect(component.sortDir).toBe('default');
  });

  it('should pass ASC sortOrder when sortDir is asc', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    component.hasRetrieved = true;
    serviceSpy.query.calls.reset();
    component.toggleSort('tbId');

    expect(serviceSpy.query).toHaveBeenCalledWith(jasmine.objectContaining({
      sortOrder: 'ASC',
    }));
  });

  it('should pass DESC sortOrder on initial auto-fetch', () => {
    component.filterForm.get('testId')!.setValue('HBS');

    expect(serviceSpy.query).toHaveBeenCalledWith(jasmine.objectContaining({
      sortOrder: 'DESC',
    }));
  });

  // --- getSortIcon ---

  it('should return arrow_downward for default-sorted tbId column', () => {
    expect(component.getSortIcon('tbId')).toBe('arrow_downward');
  });

  it('should return unfold_more when sortDir is default', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'default';
    expect(component.getSortIcon('tbId')).toBe('unfold_more');
  });

  it('should return arrow_upward when sortDir is asc', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'asc';
    expect(component.getSortIcon('tbId')).toBe('arrow_upward');
  });

  it('should return arrow_downward when sortDir is desc', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'desc';
    expect(component.getSortIcon('tbId')).toBe('arrow_downward');
  });

  it('should return unfold_more for a different column than the sorted one', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'asc';
    expect(component.getSortIcon('refControl')).toBe('unfold_more');
  });

  // --- isSortActive ---

  it('should return true for default-sorted tbId column', () => {
    expect(component.isSortActive('tbId')).toBeTrue();
  });

  it('should return false when sortDir is default', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'default';
    expect(component.isSortActive('tbId')).toBeFalse();
  });

  it('should return true when column is actively sorted asc', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'asc';
    expect(component.isSortActive('tbId')).toBeTrue();
  });

  it('should return true when column is actively sorted desc', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'desc';
    expect(component.isSortActive('tbId')).toBeTrue();
  });

  it('should return false for a different column', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'asc';
    expect(component.isSortActive('refControl')).toBeFalse();
  });

  // --- isClearDisabled ---

  it('should return true when no filters are set and no data retrieved', () => {
    component.filterForm.reset();
    component.hasRetrieved = false;
    expect(component.isClearDisabled).toBeTrue();
  });

  it('should return false when testId is set', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    expect(component.isClearDisabled).toBeFalse();
  });

  it('should return false when testBatchId is set', () => {
    component.filterForm.get('testBatchId')!.setValue('TB001', { emitEvent: false });
    expect(component.isClearDisabled).toBeFalse();
  });

  it('should return false when data has been retrieved', () => {
    component.hasRetrieved = true;
    expect(component.isClearDisabled).toBeFalse();
  });

  // --- Loading states ---

  it('should load test IDs from API', () => {
    expect(serviceSpy.getTestIds).toHaveBeenCalled();
    expect(component.testIdOptions.length).toBe(2);
  });

  it('should load batch IDs from API when test ID is set', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();
    expect(serviceSpy.getTestBatchIds).toHaveBeenCalledWith('HBS');
    expect(component.batchIdOptions.length).toBe(2);
  });

  it('should handle getTestIds error gracefully', () => {
    serviceSpy.getTestIds.and.returnValue(throwError(() => new Error('Test IDs error')));

    fixture = TestBed.createComponent(PlateControlsQueryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.testIdOptions.length).toBe(0);
  });

  it('should handle getTestBatchIds error gracefully', () => {
    serviceSpy.getTestBatchIds.and.returnValue(throwError(() => new Error('Batch IDs error')));

    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();

    expect(component.batchIdOptions.length).toBe(0);
  });

  // --- Chapter changes ---

  it('should clear all and reload test IDs on chapter change', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    component.hasRetrieved = true;
    component.totalCount = 5;
    serviceSpy.getTestIds.calls.reset();

    chapterChanged$.next();
    fixture.detectChanges();

    expect(component.filterForm.get('testId')!.value).toBeNull();
    expect(component.hasRetrieved).toBeFalse();
    expect(component.totalCount).toBe(0);
    expect(component.pagedData.length).toBe(0);
    expect(serviceSpy.getTestIds).toHaveBeenCalled();
  });

  // --- ngOnDestroy ---

  it('should complete destroy$ subject on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  // --- clearAll resets search controls ---

  it('should reset search controls on clearAll', () => {
    component.testIdSearchCtrl.setValue('HBS');
    component.batchIdSearchCtrl.setValue('TB001');
    component.clearAll();

    expect(component.testIdSearchCtrl.value).toBe('');
    expect(component.batchIdSearchCtrl.value).toBe('');
  });

  // --- clearAll resets sort column ---

  it('should reset sort to default descending on clearAll', () => {
    component.sortColumn = 'tbId';
    component.sortDir = 'asc';
    component.clearAll();
    expect(component.sortColumn).toBe('tbId');
    expect(component.sortDir).toBe('desc');
  });

  // --- clearAll resets pageIndex ---

  it('should reset pageIndex to 0 on clearAll', () => {
    component.pageIndex = 5;
    component.clearAll();
    expect(component.pageIndex).toBe(0);
  });





  it('should reset pageIndex to 0 on sort toggle', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    component.hasRetrieved = true;
    component.pageIndex = 2;
    component.toggleSort('TbId');

    expect(component.pageIndex).toBe(0);
  });

  it('should not fetch when toggleSort is called before retrieve', () => {
    const callsBefore = serviceSpy.query.calls.count();
    component.toggleSort('TbId');
    expect(serviceSpy.query.calls.count()).toBe(callsBefore);
  });

  it('should handle query API error gracefully', () => {
    serviceSpy.query.and.returnValue(throwError(() => new Error('Server error')));
    component.filterForm.get('testId')!.setValue('HBS');
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.pagedData.length).toBe(0);
    expect(component.totalCount).toBe(0);
  });

  it('should clear all filters, data, and reset sort on clearAll', () => {
    component.filterForm.get('testId')!.setValue('HBS');
    component.hasRetrieved = true;
    component.totalCount = 5;
    component.sortDir = 'asc';
    component.clearAll();

    expect(component.filterForm.get('testId')!.value).toBeNull();
    expect(component.hasRetrieved).toBeFalse();
    expect(component.totalCount).toBe(0);
    expect(component.pagedData.length).toBe(0);
    expect(component.sortDir).toBe('desc');
  });





  it('should not auto-fetch when testId is cleared', () => {
    component.filterForm.get('testId')!.setValue(null);
    expect(component.hasRetrieved).toBeFalse();
    expect(serviceSpy.query).not.toHaveBeenCalled();
  });
});
