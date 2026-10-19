import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HlaInterimOutputService } from './hla-interim-output.service';
import { HlaInterimOutput, HlaInterimOutputSearchParams } from '../models/hla-interim-output.model';
import { API } from '@core/constants/api.constants';

describe('HlaInterimOutputService', () => {
  let service: HlaInterimOutputService;
  let httpMock: HttpTestingController;

  const mockBackendData = [
    {
      matchA1A1: '01',
      matchA1A1Description: 'HLA-A*01',
      matchA1A2: '02',
      matchA1A2Description: 'HLA-A*02',
      matchA2A1: '03',
      matchA2A1Description: 'HLA-B*03',
      matchA2A2: '07',
      matchA2A2Description: 'HLA-B*07',
      outputA1: '01',
      outputA1Description: 'HLA-A*01',
      outputA2: '02',
      outputA2Description: 'HLA-A*02',
      effDate: '2024-01-01',
      termDate: null,
      insUser: 'testuser',
      insDate: '2024-01-01',
      updUser: 'testuser',
      updDate: '2024-01-01'
    }
  ];

  const mockApiResponse = {
    success: true,
    statusCode: 200,
    message: 'Success',
    data: mockBackendData,
    error: null,
    total: 1
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HlaInterimOutputService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(HlaInterimOutputService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAll', () => {
    it('should fetch HLA interim output data', () => {
      const take = 25;
      const skip = 0;

      service.getAll(take, skip).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.total).toBe(1);
        expect(result.data[0].matchA1A1).toBe('01');
        expect(result.data[0].matchA1A1Description).toBe('HLA-A*01');
      });

      const req = httpMock.expectOne(API.HLA.INTERIM_OUTPUT.SEARCH(take, skip));
      expect(req.request.method).toBe('POST');
      req.flush(mockApiResponse);
    });

    it('should transform backend data to frontend format', () => {
      service.getAll(25, 0).subscribe(result => {
        const item = result.data[0];
        expect(item.matchA1A1).toBe('01');
        expect(item.matchA1A2).toBe('02');
        expect(item.matchA2A1).toBe('03');
        expect(item.matchA2A2).toBe('07');
        expect(item.outcomeAntigenA1).toBe('01');
        expect(item.outcomeAntigenA2).toBe('02');
        expect(item.matchA1A1Description).toBe('HLA-A*01');
        expect(item.matchA1A2Description).toBe('HLA-A*02');
        expect(item.outcomeAntigenA1Description).toBe('HLA-A*01');
      });

      const req = httpMock.expectOne(API.HLA.INTERIM_OUTPUT.SEARCH(25, 0));
      req.flush(mockApiResponse);
    });

    it('should send search parameters correctly', () => {
      const searchParams: HlaInterimOutputSearchParams = {
        matchA1A1: '01',
        matchA1A2: '02',
        searchText: 'test'
      };

      service.getAll(25, 0, searchParams).subscribe();

      const req = httpMock.expectOne(API.HLA.INTERIM_OUTPUT.SEARCH(25, 0));
      expect(req.request.body.matchA1A1).toBe('01');
      expect(req.request.body.matchA1A2).toBe('02');
      expect(req.request.body.searchKeyword).toBe('test');
      req.flush(mockApiResponse);
    });


  });

  describe('getByMatchCodes', () => {
    it('should fetch HLA interim output by match codes', () => {
      service.getByMatchCodes('01', '02', '03', '07').subscribe(result => {
        expect(result).toBeTruthy();
        expect(result?.matchA1A1).toBe('01');
        expect(result?.matchA1A1Description).toBe('HLA-A*01');
      });

      const req = httpMock.expectOne(
        API.HLA.INTERIM_OUTPUT.GET_BY_MATCH('01', '02', '03', '07')
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockApiResponse);
    });

  });

  describe('create', () => {
    it('should create new HLA interim output', () => {
      const newData: Partial<HlaInterimOutput> = {
        matchA1A1: '01',
        matchA1A2: '02',
        matchA2A1: '03',
        matchA2A2: '07',
        outcomeAntigenA1: '01',
        outcomeAntigenA2: '02',
        effectiveDate: '2024-01-01'
      };

      service.create(newData).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(API.HLA.INTERIM_OUTPUT.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.matchA1A1).toBe('01');
      expect(req.request.body.outputA1).toBe('01');
      req.flush(mockApiResponse);
    });

  });

  describe('update', () => {
    it('should update existing HLA interim output', () => {
      const updateData: Partial<HlaInterimOutput> = {
        matchA1A1: '01',
        matchA1A2: '02',
        matchA2A1: '03',
        matchA2A2: '07',
        outcomeAntigenA1: '01',
        outcomeAntigenA2: '02',
        effectiveDate: '2024-01-01'
      };

      service.update('01', '02', '03', '07', updateData).subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(
        API.HLA.INTERIM_OUTPUT.UPDATE('01', '02', '03', '07')
      );
      expect(req.request.method).toBe('PUT');
      req.flush(mockApiResponse);
    });
  });

  describe('getFilterValues', () => {
    it('should fetch filter values', () => {
      const mockFilterResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        item: {
          matchA1A1: [{ match: '01', description: 'HLA-A*01' }],
          matchA1A2: [{ match: '02', description: 'HLA-A*02' }],
          matchA2A1: [{ match: '03', description: 'HLA-B*03' }],
          matchA2A2: [{ match: '07', description: 'HLA-B*07' }],
          outputA1: [{ match: '01', description: 'HLA-A*01' }],
          outputA2: [{ match: '02', description: 'HLA-A*02' }]
        }
      };

      service.getFilterValues().subscribe(result => {
        expect(result).toBeTruthy();
        expect(result?.matchA1A1.length).toBe(1);
      });

      const req = httpMock.expectOne(API.HLA.INTERIM_OUTPUT.GET_FILTER_VALUES);
      expect(req.request.method).toBe('GET');
      req.flush(mockFilterResponse);
    });
  });

  describe('getInterimCodesLov', () => {
    it('should fetch interim codes LOV', () => {
      const mockLovResponse = {
        success: true,
        statusCode: 200,
        message: 'Success',
        data: [
          { interimCode: '01', interimDescription: 'HLA-A*01' },
          { interimCode: '02', interimDescription: 'HLA-A*02' }
        ]
      };

      service.getInterimCodesLov().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].interimCode).toBe('01');
      });

      const req = httpMock.expectOne(API.HLA.INTERIM_OUTPUT.GET_INTERIM_CODES_LOV);
      expect(req.request.method).toBe('GET');
      req.flush(mockLovResponse);
    });

  });
});
