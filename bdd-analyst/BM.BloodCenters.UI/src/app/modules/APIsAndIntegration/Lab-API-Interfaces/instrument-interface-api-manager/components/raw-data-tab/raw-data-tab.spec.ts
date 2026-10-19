import { ComponentFixture, TestBed, fakeAsync, tick, flushMicrotasks } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { RawDataTab } from './raw-data-tab';
import { InstrumentInterfaceService } from '../../services/instrument-interface.service';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RawData, RawDataApiResponse } from '../../models/instrument-interface.model';
import { PageEvent } from '@angular/material/paginator';

describe('[Unit] RawDataTab', () => {
  let component: RawDataTab;
  let fixture: ComponentFixture<RawDataTab>;
  let mockService: jasmine.SpyObj<InstrumentInterfaceService>;

  const mockRawData: RawData[] = [
    {
      fileId: 'F001',
      recordSequence: 1,
      chapterId: 'DAL',
      machineId: 'S201',
      machineTestId: 'MT001',
      unitId: 'U001',
      collDate: '2024-01-01',
      patientDob: '1990-01-01',
      patientFirstName: 'John',
      patientLastName: 'Doe',
      testId1: 'T1',
      result1: 'POS',
      resultDate: '2024-01-01',
      machineResult: 'POSITIVE',
      plateId: 'P1',
      wellNumber: 'A1',
      absorbance: '0.5',
      ratio: '1.2',
      lowerResultRange: '0.1',
      upperResultRange: '2.0',
      extBatchId: 'B001',
      finalPoolSize: 5,
      siteId: 'SITE1',
      uploadStatus: 'Y',
      resultUserId: 'USER1',
      parsedBy: 'SYSTEM',
      skipRecord: 'N',
      comments: '',
      auditKey: 1,
      insertDate: '2024-01-01',
      insertUser: 'SYSTEM'
    },
    {
      fileId: 'F002',
      recordSequence: 2,
      chapterId: 'DAL',
      machineId: 'S201',
      machineTestId: 'MT002',
      unitId: 'U002',
      collDate: '2024-01-02',
      patientDob: '1985-05-15',
      patientFirstName: 'Jane',
      patientLastName: 'Smith',
      testId1: 'T2',
      result1: 'NEG',
      resultDate: '2024-01-02',
      machineResult: 'NEGATIVE',
      plateId: 'P2',
      wellNumber: 'B2',
      absorbance: '0.2',
      ratio: '0.8',
      lowerResultRange: '0.1',
      upperResultRange: '2.0',
      extBatchId: 'B002',
      finalPoolSize: 3,
      siteId: 'SITE1',
      uploadStatus: 'N',
      resultUserId: 'USER2',
      parsedBy: 'SYSTEM',
      skipRecord: 'N',
      comments: '',
      auditKey: 2,
      insertDate: '2024-01-02',
      insertUser: 'SYSTEM'
    }
  ];

  const mockApiResponse: RawDataApiResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: mockRawData,
    total: 2,
    errorResponse: { errorCode: '', error: '' }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('InstrumentInterfaceService', ['getRawData', 'getPendingFileIds']);

    mockService.getRawData.and.returnValue(of(mockApiResponse));
    mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [], statusCode: 200, message: '', errorResponse: { errorCode: '', error: '' } }));



      TestBed.configureTestingModule({
      imports: [RawDataTab, NoopAnimationsModule],
      providers: [
        { provide: InstrumentInterfaceService, useValue: mockService }
      ],
    });


    


      mockService.getRawData.calls.reset();


      mockService.getPendingFileIds.calls.reset();


      mockService.getRawData.and.returnValue(of(mockApiResponse));


      mockService.getPendingFileIds.and.returnValue(of({ success: true, data: [], statusCode: 200, message: '', errorResponse: { errorCode: '', error: '' } }));


    fixture = TestBed.createComponent(RawDataTab);
    component = fixture.componentInstance;
    component.chapterId = 'DAL';
    component.instrumentId = 'S201';
    fixture.detectChanges();


    });


  describe('ngOnChanges', () => {
    it('should clear all data when chapterId changes', () => {
      component.rawDataList.set(mockRawData);
      component.totalItems.set(10);
      component.hasLoadedData.set(true);
      component.expandedRows.set(new Set(['1']));

      component.ngOnChanges({
        chapterId: new SimpleChange('DAL', 'HOU', false)
      });

      expect(component.rawDataList()).toEqual([]);
      expect(component.filteredData()).toEqual([]);
      expect(component.paginatedData()).toEqual([]);
      expect(component.totalItems()).toBe(0);
      expect(component.hasLoadedData()).toBe(false);
      expect(component.loading()).toBe(false);
      expect(component.pageIndex()).toBe(0);
      expect(component.expandedRows()).toEqual(new Set());
    });

    it('should clear all data when instrumentId changes', () => {
      component.rawDataList.set(mockRawData);

      component.ngOnChanges({
        instrumentId: new SimpleChange('S201', 'S202', false)
      });

      expect(component.rawDataList()).toEqual([]);
      expect(component.searchText()).toBe('');
      expect(component.sortDirection()).toBe('DESC');
    });


  });

  describe('loadRawData', () => {
    it('should load raw data successfully', fakeAsync(() => {
      component.loadRawData();
      tick();

      expect(component.loading()).toBe(false);
      expect(component.rawDataList()).toEqual(mockRawData);
      expect(component.totalItems()).toBe(2);
      expect(component.hasLoadedData()).toBe(true);
    }));











    it('should handle empty response data', fakeAsync(() => {
      const emptyResponse: RawDataApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0,
        errorResponse: { errorCode: '', error: '' }
      };
      mockService.getRawData.and.returnValue(of(emptyResponse));

      component.loadRawData();
      tick();

      expect(component.rawDataList()).toEqual([]);
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
      mockService.getRawData.and.returnValue(of(invalidResponse));

      component.loadRawData();
      tick();

      expect(component.rawDataList()).toEqual([]);
    }));

    it('should use data length as total when data is empty', fakeAsync(() => {
      const emptyResponse: RawDataApiResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 100,
        errorResponse: { errorCode: '', error: '' }
      };
      mockService.getRawData.and.returnValue(of(emptyResponse));

      component.loadRawData();
      tick();

      expect(component.totalItems()).toBe(0);
    }));
  });

  describe('onSearch', () => {
    it('should update search text and reload data', fakeAsync(() => {
      spyOn(component, 'loadRawData');

      component.onSearch('U001');
      tick();

      expect(component.searchText()).toBe('U001');
      expect(component.pageIndex()).toBe(0);
      expect(component.loadRawData).toHaveBeenCalled();
    }));


  });
  describe('toggleRow', () => {
    it('should expand row when collapsed', () => {
      component.toggleRow(mockRawData[0]);

      const expanded = component.expandedRows();
      expect(expanded.has('1')).toBe(true);
    });

    it('should collapse row when expanded', () => {
      component.expandedRows.set(new Set(['1']));

      component.toggleRow(mockRawData[0]);

      const expanded = component.expandedRows();
      expect(expanded.has('1')).toBe(false);
    });


  });

  describe('isExpanded', () => {
    it('should return true when row is expanded', () => {
      component.expandedRows.set(new Set(['1']));

      expect(component.isExpanded(mockRawData[0])).toBe(true);
    });

    it('should return false when row is collapsed', () => {
      component.expandedRows.set(new Set());

      expect(component.isExpanded(mockRawData[0])).toBe(false);
    });
  });
  describe('getStatusClass', () => {






    it('should return default class for unknown status', () => {
      expect(component.getStatusClass('X')).toBe('status-pending');
    });
  });

  describe('getStatusIcon', () => {


    it('should return correct icon for pending/error status', () => {
      expect(component.getStatusIcon('N')).toBe('cancel');
      expect(component.getStatusIcon('P')).toBe('cancel');
      expect(component.getStatusIcon('E')).toBe('cancel');
      expect(component.getStatusIcon('A')).toBe('cancel');
    });

    it('should return default icon for unknown status', () => {
      expect(component.getStatusIcon('X')).toBe('cancel');
    });
  });

  describe('getStatusLabel', () => {
    it('should return correct label for each status', () => {
      expect(component.getStatusLabel('Y')).toBe('Processed');
      expect(component.getStatusLabel('N')).toBe('Not Uploaded');
      expect(component.getStatusLabel('P')).toBe('Pending');
      expect(component.getStatusLabel('S')).toBe('Processed');
      expect(component.getStatusLabel('E')).toBe('Error');
      expect(component.getStatusLabel('A')).toBe('Aborted');
    });

    it('should return default label for unknown status', () => {
      expect(component.getStatusLabel('X')).toBe('Pending');
    });
  });

  describe('toggleSort', () => {
    it('should toggle from ASC to DESC', fakeAsync(() => {
      spyOn(component, 'loadRawData');
      component.sortDirection.set('ASC');

      component.toggleSort();
      tick();

      expect(component.sortDirection()).toBe('DESC');
      expect(component.pageIndex()).toBe(0);
      expect(component.loadRawData).toHaveBeenCalled();
    }));

    it('should toggle from DESC to ASC', fakeAsync(() => {
      spyOn(component, 'loadRawData');
      component.sortDirection.set('DESC');

      component.toggleSort();
      tick();

      expect(component.sortDirection()).toBe('ASC');
    }));
  });

  describe('toggleFilter', () => {
    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBe(false);

      component.toggleFilter();
      expect(component.isFilterOpen).toBe(true);

      component.toggleFilter();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('onFilterApply', () => {
    it('should apply filters and close panel', fakeAsync(() => {
      spyOn(component, 'loadRawData');
      const filters = { fileId: 'F001' };
      component.isFilterOpen = true;

      component.onFilterApply(filters);
      tick();

      expect(component.currentFilters).toEqual(filters);
      expect(component.filterChips.length).toBe(1);
      expect(component.isFilterOpen).toBe(false);
      expect(component.pageIndex()).toBe(0);
      expect(component.loadRawData).toHaveBeenCalled();
    }));
  });
  describe('removeFilterChip', () => {
    it('should remove fileId filter and reload', fakeAsync(() => {
      spyOn(component, 'loadRawData');
      component.currentFilters = { fileId: 'F001' };
      component.filterChips = [{ key: 'fileId', label: 'File ID: F001', value: 'F001' }];

      component.removeFilterChip('fileId');
      tick();

      expect(component.currentFilters.fileId).toBeNull();
      expect(component.filterChips.length).toBe(0);
      expect(component.pageIndex()).toBe(0);
      expect(component.loadRawData).toHaveBeenCalled();
    }));
  });

  describe('clearAllFilters', () => {
    it('should clear all filters and reload', fakeAsync(() => {
      spyOn(component, 'loadRawData');
      component.currentFilters = { fileId: 'F001' };
      component.filterChips = [{ key: 'fileId', label: 'File ID: F001', value: 'F001' }];

      component.clearAllFilters();
      tick();

      expect(component.currentFilters).toEqual({ fileId: null });
      expect(component.filterChips.length).toBe(0);
      expect(component.pageIndex()).toBe(0);
      expect(component.loadRawData).toHaveBeenCalled();
    }));
  });

  describe('updatePagination', () => {
    it('should set paginated data from filtered data', () => {
      component.filteredData.set(mockRawData);

      component.updatePagination();

      expect(component.paginatedData()).toEqual(mockRawData);
    });
  });
  describe('signal updates with effect', () => {
    it('should update filteredData when rawDataList changes', fakeAsync(() => {
      component.rawDataList.set(mockRawData);
      fixture.detectChanges();
      flushMicrotasks();
      tick();

      expect(component.filteredData()).toEqual(mockRawData);
    }));

    it('should update paginatedData when filteredData changes', fakeAsync(() => {
      component.rawDataList.set(mockRawData);
      fixture.detectChanges();
      flushMicrotasks();
      tick();

      expect(component.paginatedData()).toEqual(mockRawData);
    }));
  });
});
