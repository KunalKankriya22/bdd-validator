import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { NotationCodeApiService } from './notation-code-api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  NotationCode,
  CreateNotationCodeDto,
  UpdateNotationCodeDto,
  NotationCodeQueryDto,
  ApiResponseWrapper,
  NotationCodeLookupItem
} from '../models/notation-code.model';

describe('NotationCodeApiService', () => {
  let service: NotationCodeApiService;
  let httpMock: HttpTestingController;

  const mockNotationCode: NotationCode = {
    notationCode: 'TEST01',
    notationDesc: 'Test Notation Description',
    notationType: 'S',
    testId: null,
    shortDesc: null,
    effDate: '2024-01-01T00:00:00Z',
    termDate: null,
    insertDate: '2024-01-01T00:00:00Z',
    insertUser: 'SYSTEM',
    programId: 'VCONFCFG',
    auditKey: 12345
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NotationCodeApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(NotationCodeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchNotationCodes', () => {
    it('should retrieve notation codes with filters and pagination', (done) => {
      const take = 25;
      const skip = 0;
      const queryDto: NotationCodeQueryDto = {
        notationType: 'S',
        sortColumn: 'NotationCode',
        sortOrder: 'ASC'
      };

      const mockResponse: ApiResponseWrapper<NotationCode[]> = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: [mockNotationCode],
        total: 1
      };

      service.searchNotationCodes(take, skip, queryDto).subscribe({
        next: (response) => {
          expect(response.data.length).toBe(1);
          expect(response.data[0].notationCode).toBe('TEST01');
          expect(response.total).toBe(1);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API.NOTATION_CODE.SEARCH(take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(queryDto);
      req.flush(mockResponse);
    });


  });

  describe('getNotationCodeByCode', () => {
    it('should retrieve a single notation code by code value', (done) => {
      const notationCode = 'TEST01';

      const mockResponse: ApiResponseWrapper<NotationCode[]> = {
        success: true,
        message: 'Record retrieved successfully',
        statusCode: 200,
        data: [mockNotationCode],
        total: 1
      };

      service.getNotationCodeByCode(notationCode).subscribe({
        next: (result) => {
          expect(result.notationCode).toBe('TEST01');
          expect(result.notationType).toBe('S');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API.NOTATION_CODE.GET_BY_CODE(notationCode));
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

  });

  describe('createNotationCode', () => {
    it('should create a new notation code', (done) => {
      const createDto: CreateNotationCodeDto = {
        notationCode: 'TEST01',
        notationType: 'S',
        testId: null,
        shortDesc: null,
        notationDesc: 'Test Notation Description',
        effDate: '2024-06-01'
      };

      const mockResponse: ApiResponseWrapper<null> = {
        success: true,
        message: 'Record created successfully',
        statusCode: 201,
        data: null
      };

      service.createNotationCode(createDto).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.message).toBe('Record created successfully');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API.NOTATION_CODE.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createDto);
      req.flush(mockResponse);
    });

  });

  describe('updateNotationCode', () => {
    it('should update an existing notation code', (done) => {
      const notationCode = 'TEST01';
      const updateDto: UpdateNotationCodeDto = {
        notationType: 'S',
        testId: null,
        shortDesc: null,
        notationDesc: 'Updated Description',
        effDate: '2024-06-01',
        termDate: '2024-12-31'
      };

      const mockResponse: ApiResponseWrapper<null> = {
        success: true,
        message: 'Record updated successfully',
        statusCode: 200,
        data: null
      };

      service.updateNotationCode(notationCode, updateDto).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.message).toBe('Record updated successfully');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API.NOTATION_CODE.UPDATE(notationCode));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateDto);
      req.flush(mockResponse);
    });

    it('should handle not found error on update', (done) => {
      const notationCode = 'NOTFOUND';
      const updateDto: UpdateNotationCodeDto = {
        notationType: 'S',
        testId: null,
        shortDesc: null,
        notationDesc: 'Updated',
        effDate: '2024-06-01'
      };

      const errorResponse = {
        success: false,
        statusCode: 404,
        message: 'Record not found'
      };

      service.updateNotationCode(notationCode, updateDto).subscribe({
        next: () => done.fail('Should have failed'),
        error: (error) => {
          expect(error.error.statusCode).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(API.NOTATION_CODE.UPDATE(notationCode));
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getNotationCodeLookup', () => {
    it('should retrieve notation code LOV items', (done) => {
      const mockLovItems: NotationCodeLookupItem[] = [
        { notationCode: 'HEM001', notationDesc: 'Hemoglobin level notation' },
        { notationCode: 'PLT002', notationDesc: 'Platelet count notation' }
      ];

      const mockResponse: ApiResponseWrapper<NotationCodeLookupItem[]> = {
        success: true,
        message: 'Data retrieved successfully',
        statusCode: 200,
        data: mockLovItems
      };

      service.getNotationCodeLookup().subscribe({
        next: (items) => {
          expect(items.length).toBe(2);
          expect(items[0].notationCode).toBe('HEM001');
          expect(items[1].notationCode).toBe('PLT002');
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API.NOTATION_CODE.NOTATION_CODE_LOV);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('deleteNotationCode', () => {
    it('should soft delete a notation code', (done) => {
      const notationCode = 'TEST01';

      const mockResponse: ApiResponseWrapper<boolean[]> = {
        success: true,
        message: 'Record deleted successfully',
        statusCode: 200,
        data: [true]
      };

      service.deleteNotationCode(notationCode).subscribe({
        next: (response) => {
          expect(response.success).toBe(true);
          expect(response.data[0]).toBe(true);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API.NOTATION_CODE.DELETE(notationCode));
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle delete failure for non-existent record', (done) => {
      const notationCode = 'NOTFOUND';

      const mockResponse: ApiResponseWrapper<boolean[]> = {
        success: false,
        message: 'Record not found or already deleted',
        statusCode: 404,
        data: [false]
      };

      service.deleteNotationCode(notationCode).subscribe({
        next: (response) => {
          expect(response.data[0]).toBe(false);
          done();
        },
        error: done.fail
      });

      const req = httpMock.expectOne(API.NOTATION_CODE.DELETE(notationCode));
      req.flush(mockResponse);
    });
  });
});
