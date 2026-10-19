import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { HlaAntigensService } from './hla-antigens.service';
import {
  HlaAntigenModel,
  HlaAntigenParamsDto,
  CreateHlaAntigenDto,
  HlaAntigenResponse,
  HlaAntigenItemResponse
} from '../models/hla-antigens.model';

describe('HlaAntigensService', () => {
  let service: HlaAntigensService;
  let httpMock: HttpTestingController;

  const mockAntigens: HlaAntigenModel[] = [
    {
      locus: 'A',
      locusDescription: 'HLA-A',
      epitopeId: '1',
      epitopeSuperI: null,
      effDate: '2024-01-01',
      termDate: null
    },
    {
      locus: 'B',
      locusDescription: 'HLA-B',
      epitopeId: '7',
      epitopeSuperI: '8',
      effDate: '2024-02-01',
      termDate: '2025-12-31'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HlaAntigensService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(HlaAntigensService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getHlaAntigens', () => {
    it('should return HLA antigens from API', (done) => {
      const take = 25;
      const skip = 0;
      const params: HlaAntigenParamsDto = {};

      service.getHlaAntigens(take, skip, params).subscribe({
        next: (response) => {
          expect(response.data.length).toBe(2);
          expect(response.total).toBe(2);
          expect(response.data[0].locus).toBe('A');
          expect(response.data[0].epitopeId).toBe('1');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-locus/${take}/${skip}`);
      expect(req.request.method).toBe('POST');

      const mockResponse: HlaAntigenResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockAntigens,
        total: 2
      };
      req.flush(mockResponse);
    });

    it('should include filter params in request', (done) => {
      const take = 25;
      const skip = 0;
      const params: HlaAntigenParamsDto = {
        epitopeId: '1',
        searchKeyword: 'test',
        sortOrder: 'DESC'
      };

      service.getHlaAntigens(take, skip, params).subscribe({
        next: () => done()
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-locus/${take}/${skip}`);
      expect(req.request.body).toEqual(params);

      const mockResponse: HlaAntigenResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };
      req.flush(mockResponse);
    });

  });

  describe('getHlaAntigenById', () => {
    it('should return single HLA antigen by composite key', (done) => {
      const locus = 'A';
      const epitopeId = '1';

      service.getHlaAntigenById(locus, epitopeId).subscribe({
        next: (item) => {
          expect(item).toBeTruthy();
          expect(item?.locus).toBe('A');
          expect(item?.epitopeId).toBe('1');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-locus/${locus}/${epitopeId}`);
      expect(req.request.method).toBe('GET');

      const mockResponse: HlaAntigenItemResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: mockAntigens[0]
      };
      req.flush(mockResponse);
    });

  });

  describe('addHlaAntigen', () => {
    it('should create new HLA antigen', (done) => {
      const newAntigen: CreateHlaAntigenDto = {
        locus: 'A',
        epitopeId: '1',
        epitopeSuperI: null,
        effDate: '2024-01-01',
        termDate: null
      };

      service.addHlaAntigen(newAntigen).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.item.locus).toBe('A');
          done();
        }
      });

      const req = httpMock.expectOne(`/api/v1/valid-hla-locus`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newAntigen);

      const mockResponse: HlaAntigenItemResponse = {
        success: true,
        message: 'Created',
        statusCode: 201,
        item: mockAntigens[0]
      };
      req.flush(mockResponse);
    });

  });
});
