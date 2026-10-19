import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { UploadStatusTab } from './upload-status-tab';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { of, throwError, delay } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { UploadStatus, UploadStatusApiResponse } from '../../models/instrument-interface.model';
import { PageEvent } from '@angular/material/paginator';

describe('[Unit] UploadStatusTab', () => {
  let component: UploadStatusTab;
  let fixture: ComponentFixture<UploadStatusTab>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;

  const mockUploadStatusData: UploadStatus[] = [
    {
      chapterId: 'DAL',
      machineId: 'S201',
      fileId: 'F001',
      ltTbId: 'TB001',
      uploadStatus: 'S',
      totRecLoaded: 100,
      totRecProcessed: 95,
      totRecRejected: 5,
      processDate: '2024-01-01',
      logFileName: 'log1.txt',
      auditKey: 1
    },
    {
      chapterId: 'DAL',
      machineId: 'S201',
      fileId: 'F002',
      ltTbId: 'TB002',
      uploadStatus: 'E',
      totRecLoaded: 50,
      totRecProcessed: 45,
      totRecRejected: 5,
      processDate: '2024-01-02',
      logFileName: 'log2.txt',
      auditKey: 2
    }
  ];

  const mockApiResponse: UploadStatusApiResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: mockUploadStatusData,
    total: 2,
    errorResponse: { errorCode: '', error: '' }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('InstrumentInterfaceService', ['getUploadStatus', 'getUploadStatuses']);

    mockService.getUploadStatus.and.returnValue(of(mockApiResponse));
    mockService.getUploadStatuses.and.returnValue(of([{ value: 'S', label: 'S - Loaded' }]));



      TestBed.configureTestingModule({
      imports: [UploadStatusTab, NoopAnimationsModule],
      providers: [
        { provide: InstrumentInterfaceService, useValue: mockService }
      ],
    });


    


      mockService.getUploadStatus.calls.reset();


      mockService.getUploadStatuses.calls.reset();


      mockService.getUploadStatus.and.returnValue(of(mockApiResponse));


      mockService.getUploadStatuses.and.returnValue(of([{ value: 'S', label: 'S - Loaded' }]));


    fixture = TestBed.createComponent(UploadStatusTab);
    component = fixture.componentInstance;
    component.chapterId = 'DAL';
    component.instrumentId = 'S201';
    fixture.detectChanges();


    });


  describe('ngOnChanges', () => {
    it('should clear all data when chapterId changes', () => {
      component.uploadStatusList.set(mockUploadStatusData);
      component.totalItems.set(10);
      component.hasLoadedData.set(true);

      component.ngOnChanges({
        chapterId: new SimpleChange('DAL', 'HOU', false)
      });

      expect(component.uploadStatusList()).toEqual([]);
      expect(component.filteredData()).toEqual([]);
      expect(component.paginatedData()).toEqual([]);
      expect(component.totalItems()).toBe(0);
      expect(component.hasLoadedData()).toBe(false);
      expect(component.loading()).toBe(false);
      expect(component.pageIndex()).toBe(0);
    });

    it('should clear all data when instrumentId changes', () => {
      component.uploadStatusList.set(mockUploadStatusData);

      component.ngOnChanges({
        instrumentId: new SimpleChange('S201', 'S202', false)
      });

      expect(component.uploadStatusList()).toEqual([]);
      expect(component.searchText()).toBe('');
      expect(component.currentFilters).toEqual({ fileId: null, testBatchId: null, status: null, period: null, processDate: null });
    });

    it('should not clear data when unrelated inputs change', () => {
      component.uploadStatusList.set(mockUploadStatusData);

      component.ngOnChanges({});

      expect(component.uploadStatusList()).toEqual(mockUploadStatusData);
    });
  });

  describe('loadUploadStatus', () => {
    it('should load upload status successfully', fakeAsync(() => {
      component.loadUploadStatus();
      tick();

      expect(component.loading()).toBe(false);
      expect(component.uploadStatusList()).toEqual(mockUploadStatusData);
      expect(component.totalItems()).toBe(2);
      expect(component.hasLoadedData()).toBe(true);
    }));









    it('should apply fileId filter', fakeAsync(() => {
      component.currentFilters = { fileId: 'F001', testBatchId: null, status: null, period: null, processDate: null };

      component.loadUploadStatus();
      tick();

      expect(mockService.getUploadStatus).toHaveBeenCalledWith(
        'DAL',
        'S201',
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.any(String),
        { fileId: 'F001' },
        'DESC'
      );
    }));

    it('should apply status filter', fakeAsync(() => {
      component.currentFilters = { fileId: null, testBatchId: null, status: 'S', period: null, processDate: null };

      component.loadUploadStatus();
      tick();

      expect(mockService.getUploadStatus).toHaveBeenCalledWith(
        'DAL',
        'S201',
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.any(String),
        { uploadStatus: 'S' },
        'DESC'
      );
    }));

    it('should apply processDateFrom filter', fakeAsync(() => {
      const testDate = new Date('2024-01-01');
      component.currentFilters = {
        fileId: null,
        testBatchId: null,
        status: null,
        processDate: testDate,
        period: 'after'
      };

      component.loadUploadStatus();
      tick();

      const callArgs = mockService.getUploadStatus.calls.mostRecent().args;
      expect(callArgs[5]).toEqual({ processDateFrom: jasmine.any(String) });
      expect(callArgs[6]).toBe('DESC');
    }));

    it('should apply processDateTo filter', fakeAsync(() => {
      const testDate = new Date('2024-12-31');
      component.currentFilters = {
        fileId: null,
        testBatchId: null,
        status: null,
        processDate: testDate,
        period: 'before'
      };

      component.loadUploadStatus();
      tick();

      const callArgs = mockService.getUploadStatus.calls.mostRecent().args;
      expect(callArgs[5]).toEqual({ processDateTo: jasmine.any(String) });
      expect(callArgs[6]).toBe('DESC');
    }));

    it('should handle empty response data', fakeAsync(() => {
      const emptyResponse: UploadStatusApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };
      mockService.getUploadStatus.and.returnValue(of(emptyResponse));

      component.loadUploadStatus();
      tick();

      expect(component.uploadStatusList()).toEqual([]);
      expect(component.totalItems()).toBe(0);
      expect(component.hasLoadedData()).toBe(true);
    }));



    it('should handle non-array data', fakeAsync(() => {
      const invalidResponse: any = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null,
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };
      mockService.getUploadStatus.and.returnValue(of(invalidResponse));

      component.loadUploadStatus();
      tick();

      expect(component.uploadStatusList()).toEqual([]);
    }));
  });

  describe('onSearch', () => {
    it('should update search text and reload data', fakeAsync(() => {
      spyOn(component, 'loadUploadStatus');

      component.onSearch('TB001');
      tick();

      expect(component.searchText()).toBe('TB001');
      expect(component.pageIndex()).toBe(0);
      expect(component.loadUploadStatus).toHaveBeenCalled();
    }));


  });
  describe('filter panel interactions', () => {
    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBe(false);

      component.toggleFilter();
      expect(component.isFilterOpen).toBe(true);

      component.toggleFilter();
      expect(component.isFilterOpen).toBe(false);
    });




  });

  describe('filterChips', () => {
    it('should return empty array when no filters applied', fakeAsync(() => {
      component.onFilterApply({ fileId: null, testBatchId: null, status: null, period: null, processDate: null });
      tick();

      expect(component.filterChips.length).toBe(0);
    }));

    it('should return fileId chip', fakeAsync(() => {
      spyOn(component, 'loadUploadStatus');
      component.onFilterApply({ fileId: 'F001', testBatchId: null, status: null, period: null, processDate: null });
      tick();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0]).toEqual({ key: 'fileId', label: 'File ID: F001', value: 'F001', removable: true });
    }));

    it('should return testBatchId chip', fakeAsync(() => {
      spyOn(component, 'loadUploadStatus');
      component.onFilterApply({ fileId: null, testBatchId: 'TB001', status: null, period: null, processDate: null });
      tick();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0]).toEqual({ key: 'testBatchId', label: 'Test Batch ID: TB001', value: 'TB001', removable: true });
    }));

    it('should return status chip with label', fakeAsync(() => {
      spyOn(component, 'loadUploadStatus');
      component.onFilterApply({ fileId: null, testBatchId: null, status: 'S', period: null, processDate: null });
      tick();

      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0]).toEqual({ key: 'status', label: 'Status: Loaded Successfully', value: 'S', removable: true });
    }));



    it('should return multiple chips', fakeAsync(() => {
      spyOn(component, 'loadUploadStatus');
      component.onFilterApply({
        fileId: 'F001',
        testBatchId: null,
        status: 'S',
        period: 'after',
        processDate: new Date('2024-01-01')
      });
      tick();

      expect(component.filterChips.length).toBe(3);
    }));
  });

  describe('removeFilter', () => {
    it('should remove fileId filter and reload', fakeAsync(() => {
      spyOn(component, 'loadUploadStatus');
      component.currentFilters = { fileId: 'F001', testBatchId: null, status: null, period: null, processDate: null };

      component.removeFilterChip('fileId');
      tick();

      expect(component.currentFilters.fileId).toBeNull();
      expect(component.pageIndex()).toBe(0);
      expect(component.loadUploadStatus).toHaveBeenCalled();
    }));






  });

  describe('clearAllFilters', () => {
    it('should clear all filters and reload', fakeAsync(() => {
      spyOn(component, 'loadUploadStatus');
      component.currentFilters = {
        fileId: 'F001',
        testBatchId: 'TB001',
        status: 'S',
        processDate: new Date('2024-01-01'),
        period: 'after'
      };

      component.clearAllFilters();
      tick();

      expect(component.currentFilters).toEqual({
        fileId: null,
        testBatchId: null,
        status: null,
        period: null,
        processDate: null
      });
      expect(component.pageIndex()).toBe(0);
      expect(component.loadUploadStatus).toHaveBeenCalled();
    }));
  });

  describe('updatePagination', () => {
    it('should set paginated data from filtered data', () => {
      component.filteredData.set(mockUploadStatusData);

      component.updatePagination();

      expect(component.paginatedData()).toEqual(mockUploadStatusData);
    });
  });
  describe('signal updates with effect', () => {
    it('should update filteredData when uploadStatusList changes', fakeAsync(() => {
      component.uploadStatusList.set(mockUploadStatusData);
      fixture.detectChanges();
      flushMicrotasks();
      tick();

      expect(component.filteredData()).toEqual(mockUploadStatusData);
    }));

    it('should update paginatedData when filteredData changes', fakeAsync(() => {
      component.uploadStatusList.set(mockUploadStatusData);
      fixture.detectChanges();
      flushMicrotasks();
      tick();

      expect(component.paginatedData()).toEqual(mockUploadStatusData);
    }));
  });
});
