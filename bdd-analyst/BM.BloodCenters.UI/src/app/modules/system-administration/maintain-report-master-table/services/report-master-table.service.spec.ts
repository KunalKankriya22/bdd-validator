import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ReportMasterTableService } from './report-master-table.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ReportMasterTableModel,
  ReportMasterTableParamsDto,
  ReportMasterTableFilterLov,
  WarehouseChapterLovResponse
} from '../models/report-master-table.model';
import { of, throwError } from 'rxjs';

describe('ReportMasterTableService', () => {
  let service: ReportMasterTableService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockReportData: ReportMasterTableModel[] = [
    {
      chapterID: 'CH001',
      type: 'LAB',
      code: 'RPT001',
      description: 'Lab Report 1',
      command: '192.168.1.100',
      port: '9100',
      sequence: 1,
      warehouse: 'WH001',
      warehouseDescrription: 'Warehouse 1',
      clientHostName: 'LAB-PC-01'
    },
    {
      chapterID: 'CH002',
      type: 'DIST',
      code: 'RPT002',
      description: 'Distribution Report 1',
      command: '192.168.1.101',
      port: '9101',
      sequence: 2,
      warehouse: 'WH002',
      warehouseDescrription: 'Warehouse 2',
      clientHostName: 'DIST-PC-01'
    }
  ];

  const mockFilterLovData: ReportMasterTableFilterLov = {
    type: ['LAB', 'DIST', 'DONOR'],
    chapterID: ['CH001', 'CH002', 'CH003'],
    warehouse: ['WH001', 'WH002', 'WH003'],
    warehouseName: ['Warehouse 1', 'Warehouse 2', 'Warehouse 3'],
    warehouseDisplay: ['WH001 - Warehouse 1', 'WH002 - Warehouse 2', 'WH003 - Warehouse 3']
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ReportMasterTableService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ReportMasterTableService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getReportMasterTable', () => {
    it('should fetch report master table data successfully', (done) => {
      const take = 10;
      const skip = 0;
      const params: ReportMasterTableParamsDto = {
        SearchKeyword: 'test'
      };

      const mockResponse = {
        success: true,
        data: mockReportData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getReportMasterTable(take, skip, params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockReportData);
          expect(result.totalRecords).toBe(2);
          expect(apiService.post).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.REPORT_MASTER_TABLE(take, skip),
            params
          );
          done();
        }
      });
    });



    it('should fetch data with filters', (done) => {
      const take = 25;
      const skip = 25;
      const params: ReportMasterTableParamsDto = {
        CodeType: 'LAB',
        ChapterID: 'CH001',
        Warehouse: 'WH001'
      };

      const mockResponse = {
        success: true,
        data: [mockReportData[0]],
        total: 1
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getReportMasterTable(take, skip, params).subscribe({
        next: (result) => {
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          expect(apiService.post).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.REPORT_MASTER_TABLE(take, skip),
            params
          );
          done();
        }
      });
    });


    it('should fetch data with sort parameter', (done) => {
      const take = 10;
      const skip = 0;
      const params: ReportMasterTableParamsDto = {
        Sort: 'A'
      };

      const mockResponse = {
        success: true,
        data: mockReportData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getReportMasterTable(take, skip, params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockReportData);
          expect(apiService.post).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.REPORT_MASTER_TABLE(take, skip),
            params
          );
          done();
        }
      });
    });


  });

  describe('getReportMasterTableFilters', () => {
    it('should fetch filter LOV data successfully', (done) => {
      const mockResponse = {
        success: true,
        data: [mockFilterLovData]
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getReportMasterTableFilters().subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponse);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.REPORT_MASTER_TABLE_FILTERS
          );
          done();
        }
      });
    });

    it('should handle empty filter LOV response', (done) => {
      const mockResponse = {
        success: true,
        data: []
      };

      apiService.get.and.returnValue(of(mockResponse));

      service.getReportMasterTableFilters().subscribe({
        next: (result) => {
          expect(result.data).toEqual([]);
          done();
        }
      });
    });

    it('should handle filter LOV API error', (done) => {
      const errorResponse = { status: 404, statusText: 'Not Found' };

      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getReportMasterTableFilters().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  describe('getWarehouseChapterDropdowns', () => {
    const mockLovData: WarehouseChapterLovResponse = {
      warehouses: [
        { id: 'B', description: 'Blood Center Technologies' },
        { id: 'H', description: 'Home Warehouse' }
      ],
      chapters: [
        { id: 'DAL', name: 'Dallas Chapter' },
        { id: 'OBK', name: 'Dallas Chapter' }
      ]
    };

    it('should call apiService.get with the LOV_DROPDOWNS endpoint', (done) => {
      apiService.get.and.returnValue(of({ data: mockLovData }));

      service.getWarehouseChapterDropdowns().subscribe({
        next: () => {
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.LOV_DROPDOWNS
          );
          done();
        }
      });
    });

    it('should unwrap the data envelope and return WarehouseChapterLovResponse', (done) => {
      apiService.get.and.returnValue(of({ data: mockLovData }));

      service.getWarehouseChapterDropdowns().subscribe({
        next: (result) => {
          expect(result).toEqual(mockLovData);
          done();
        }
      });
    });

    it('should return warehouses with id and description', (done) => {
      apiService.get.and.returnValue(of({ data: mockLovData }));

      service.getWarehouseChapterDropdowns().subscribe({
        next: (result) => {
          expect(result.warehouses.length).toBe(2);
          expect(result.warehouses[0].id).toBe('B');
          expect(result.warehouses[0].description).toBe('Blood Center Technologies');
          expect(result.warehouses[1].id).toBe('H');
          expect(result.warehouses[1].description).toBe('Home Warehouse');
          done();
        }
      });
    });

    it('should return chapters with id and name', (done) => {
      apiService.get.and.returnValue(of({ data: mockLovData }));

      service.getWarehouseChapterDropdowns().subscribe({
        next: (result) => {
          expect(result.chapters.length).toBe(2);
          expect(result.chapters[0].id).toBe('DAL');
          expect(result.chapters[0].name).toBe('Dallas Chapter');
          expect(result.chapters[1].id).toBe('OBK');
          done();
        }
      });
    });


    it('should propagate API error', (done) => {
      const errorResponse = { status: 500, statusText: 'Internal Server Error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      service.getWarehouseChapterDropdowns().subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle large pagination values', (done) => {
      const take = 100;
      const skip = 500;
      const params: ReportMasterTableParamsDto = {};

      const mockResponse = {
        success: true,
        data: mockReportData,
        total: 1000
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getReportMasterTable(take, skip, params).subscribe({
        next: (result) => {
          expect(result.totalRecords).toBe(1000);
          expect(apiService.post).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.REPORT_MASTER_TABLE(take, skip),
            params
          );
          done();
        }
      });
    });

    it('should handle all filter parameters together', (done) => {
      const take = 10;
      const skip = 0;
      const params: ReportMasterTableParamsDto = {
        CodeType: 'LAB',
        ChapterID: 'CH001',
        Warehouse: 'WH001',
        SearchKeyword: 'test',
        Sort: 'D'
      };

      const mockResponse = {
        success: true,
        data: mockReportData,
        total: 2
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.getReportMasterTable(take, skip, params).subscribe({
        next: (result) => {
          expect(result.data).toEqual(mockReportData);
          expect(apiService.post).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.REPORT_MASTER_TABLE(take, skip),
            params
          );
          done();
        }
      });
    });
  });
});