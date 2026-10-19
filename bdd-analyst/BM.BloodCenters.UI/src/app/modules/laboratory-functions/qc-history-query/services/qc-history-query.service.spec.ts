import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { QcHistoryQueryService } from './qc-history-query.service';
import {
  QcHistoryQueryDto,
  QcHistoryDto,
  EquipmentTypeDropdownDto,
  EquipmentIdDropdownDto,
  EquipmentRefDropdownDto,
  QcStatusDropdownDto,
} from '../models/qc-history-query.model';
import { environment } from '../../../../../environments/environment';

describe('QcHistoryQueryService', () => {
  let service: QcHistoryQueryService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  const mockQcHistoryData: QcHistoryDto[] = [
    {
      equipType: 'CENTRIFUGE',
      equipId: 'CENT-001',
      equipReference: 'REF-001',
      equipStatus: 'Active',
      qcReference: 'QC-001',
      qcType: 'Daily',
      qcDate: '2024-06-01T10:00:00.000Z',
      qcTech1: 'TECH1',
      qcTech2: 'TECH2',
      qcStatus: 'PASS',
      qcStatusDesc: 'Passed',
    },
    {
      equipType: 'CENTRIFUGE',
      equipId: 'CENT-002',
      equipReference: 'REF-002',
      equipStatus: null,
      qcReference: 'QC-002',
      qcType: 'Weekly',
      qcDate: '2024-06-02T14:30:00.000Z',
      qcTech1: null,
      qcTech2: null,
      qcStatus: 'FAIL',
      qcStatusDesc: 'Failed',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [QcHistoryQueryService],
    });

    service = TestBed.inject(QcHistoryQueryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getList', () => {
    it('should fetch QC history list successfully', (done) => {
      const queryDto: QcHistoryQueryDto = {
        equipmentType: 'CENTRIFUGE',
        sortColumn: null,
        sortOrder: null,
      };
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockQcHistoryData,
        total: 2,
        errorResponse: { errorCode: '', error: '' },
      };

      service.getList(25, 0, queryDto).subscribe({
        next: (response) => {
          expect(response.data).toEqual(mockQcHistoryData);
          expect(response.totalRecords).toBe(2);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/list/25/0`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryDto);
      req.flush(mockResponse);
    });


    it('should use correct endpoint with pagination parameters', (done) => {
      const queryDto: QcHistoryQueryDto = { sortColumn: null, sortOrder: null };

      service.getList(50, 100, queryDto).subscribe({
        next: () => done(),
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/list/50/100`);
      expect(req.request.method).toBe('POST');
      req.flush({ data: [], total: 0 });
    });

    it('should handle error when fetching data fails', (done) => {
      const queryDto: QcHistoryQueryDto = { sortColumn: null, sortOrder: null };

      service.getList(10, 0, queryDto).subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/list/10/0`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getEquipmentTypes', () => {
    it('should fetch equipment types successfully', (done) => {
      const mockTypes: EquipmentTypeDropdownDto[] = [
        { equipType: 'CENTRIFUGE', description: 'Centrifuge Equipment' },
        { equipType: 'SCALE', description: 'Scale Equipment' },
      ];
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockTypes,
        errorResponse: { errorCode: '', error: '' },
      };

      service.getEquipmentTypes().subscribe({
        next: (data) => {
          expect(data).toEqual(mockTypes);
          expect(data.length).toBe(2);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/equipment-types`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty equipment types response', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: undefined,
        errorResponse: { errorCode: '', error: '' },
      };

      service.getEquipmentTypes().subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/equipment-types`);
      req.flush(mockResponse);
    });

    it('should handle error when fetching equipment types fails', (done) => {
      service.getEquipmentTypes().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to load equipment types');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/equipment-types`);
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getEquipmentIds', () => {
    it('should fetch equipment IDs for a given type', (done) => {
      const mockIds: EquipmentIdDropdownDto[] = [
        { equipId: 'CENT-001', equipReference: 'REF-001', serviceDates: '01-JAN-2024' },
      ];
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockIds,
        errorResponse: { errorCode: '', error: '' },
      };

      service.getEquipmentIds('CENTRIFUGE').subscribe({
        next: (data) => {
          expect(data).toEqual(mockIds);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/equipment-ids/CENTRIFUGE`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when fetching equipment IDs fails', (done) => {
      service.getEquipmentIds('CENTRIFUGE').subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to load equipment IDs');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/equipment-ids/CENTRIFUGE`);
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should encode equipment type in URL', (done) => {
      service.getEquipmentIds('TYPE WITH SPACE').subscribe({
        next: () => done(),
        error: done.fail,
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/qc-history-query/equipment-ids/TYPE%20WITH%20SPACE`
      );
      req.flush({ data: [] });
    });
  });

  describe('getEquipmentReferences', () => {
    it('should fetch equipment references for a given type and ID', (done) => {
      const mockRefs: EquipmentRefDropdownDto[] = [
        { equipReference: 'REF-001', serviceDates: '01-JAN-2024' },
      ];
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockRefs,
        errorResponse: { errorCode: '', error: '' },
      };

      service.getEquipmentReferences('CENTRIFUGE', 'CENT-001').subscribe({
        next: (data) => {
          expect(data).toEqual(mockRefs);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/qc-history-query/equipment-references/CENTRIFUGE/CENT-001`
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle error when fetching equipment references fails', (done) => {
      service.getEquipmentReferences('CENTRIFUGE', 'CENT-001').subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to load equipment references');
          done();
        },
      });

      const req = httpMock.expectOne(
        `${baseUrl}/api/v1/qc-history-query/equipment-references/CENTRIFUGE/CENT-001`
      );
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getQcStatuses', () => {
    it('should fetch QC statuses successfully', (done) => {
      const mockStatuses: QcStatusDropdownDto[] = [
        { code: 'PASS', codeDesc: 'Passed' },
        { code: 'FAIL', codeDesc: 'Failed' },
      ];
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: mockStatuses,
        errorResponse: { errorCode: '', error: '' },
      };

      service.getQcStatuses().subscribe({
        next: (data) => {
          expect(data).toEqual(mockStatuses);
          expect(data.length).toBe(2);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/qc-statuses`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty QC statuses response', (done) => {
      const mockResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: undefined,
        errorResponse: { errorCode: '', error: '' },
      };

      service.getQcStatuses().subscribe({
        next: (data) => {
          expect(data).toEqual([]);
          done();
        },
        error: done.fail,
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/qc-statuses`);
      req.flush(mockResponse);
    });

    it('should handle error when fetching QC statuses fails', (done) => {
      service.getQcStatuses().subscribe({
        next: () => done.fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('Failed to load QC statuses');
          done();
        },
      });

      const req = httpMock.expectOne(`${baseUrl}/api/v1/qc-history-query/qc-statuses`);
      req.flush('Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
