import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { EquipmentQcDataService } from './equipment-qc-data.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  EquipmentQcDataRequest,
  EquipmentQcDataResponse,
  EquipmentType,
  QcType,
  SaveEquipmentQcDataRequest,
  ReturnResult
} from '../models/equipment-qc-data.model';

describe('EquipmentQcDataService', () => {
  let service: EquipmentQcDataService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'delete']);
    headerServiceSpy = createMockHeaderService({ chapterId: signal('TEST_CHAPTER') });
    TestBed.configureTestingModule({
      providers: [
        EquipmentQcDataService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
      ],
    });

    service = TestBed.inject(EquipmentQcDataService);
  });

  describe('retrieveEquipmentQcData', () => {
    it('should retrieve equipment QC data', (done) => {
      const request: EquipmentQcDataRequest = {
        equipmentType: 'EQ1',
        qcType: 'QC1',
        pageNumber: 1,
        pageSize: 10
      };

      const mockData: EquipmentQcDataResponse = {
        masterData: {
          qcId: 'QC001',
          reviewRequired: '1',
          reviewRequiredDescription: 'No review',
          frequency: null,
          qcPeriod: 'V',
          qcPeriodDesc: 'Variable',
          effectiveDate: '2025-01-01',
          terminationDate: null,
          requiredForClarification: 'N',
          createWorksheet: 'Y'
        },
        rows: [{
          seqNo: '100',
          description: 'Test QC',
          units: 'CHAR',
          targetValue: '100',
          minAccept: '90',
          maxAccept: '110',
          effectiveDate: '2025-01-01',
          terminationDate: null
        }],
        totalRecords: 1
      };

      const mockResponse: ReturnResult<EquipmentQcDataResponse> = {
        success: true,
        message: null,
        data: mockData,
        item: mockData,
        errors: null
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.retrieveEquipmentQcData(request).subscribe(response => {
        expect(response.rows.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(response.masterData.reviewRequired).toBe('1');
        done();
      });
    });


  });

  describe('saveEquipmentQcData', () => {
    it('should save equipment QC data', (done) => {
      const request: SaveEquipmentQcDataRequest = {
        equipmentType: 'EQ1',
        qcType: 'QC1',
        qcId: 'QC001',
        reviewRequired: '1',
        frequency: null,
        qcPeriod: 'V',
        effectiveDate: '2025-01-01',
        terminationDate: null,
        requiredForClarification: 'N',
        createWorksheet: 'Y',
        isNew: false,
        rows: [{
          seqNo: '100',
          description: 'Updated QC',
          units: 'CHAR',
          targetValue: '100',
          minAccept: '90',
          maxAccept: '110',
          effectiveDate: '2025-01-01',
          terminationDate: null
        }]
      };

      const mockResponse: ReturnResult<boolean> = {
        success: true,
        message: 'Data saved',
        data: true,
        item: true,
        errors: null
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.saveEquipmentQcData(request).subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });


  });

  describe('deleteEquipmentQcRow', () => {
    it('should delete equipment QC row', (done) => {
      const mockResponse: ReturnResult<boolean> = {
        success: true,
        message: 'Deleted',
        data: true,
        item: true,
        errors: null
      };
      apiServiceSpy.delete.and.returnValue(of(mockResponse));

      service.deleteEquipmentQcRow('123', 'EQ1', 'QC1').subscribe(result => {
        expect(result).toBe(true);
        done();
      });
    });


  });

  describe('chapter header', () => {
    it('should include X-Chapter-Id header in API calls', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getEquipmentTypes().subscribe(() => {
        const options = apiServiceSpy.get.calls.mostRecent().args[1]!;
        expect(options.headers!.get('X-Chapter-Id')).toBe('TEST_CHAPTER');
        done();
      });
    });
  });
});
