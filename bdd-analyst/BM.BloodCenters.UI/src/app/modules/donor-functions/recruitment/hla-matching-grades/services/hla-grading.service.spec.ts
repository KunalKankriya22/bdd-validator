import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HlaGradingService } from './hla-grading.service';
import { CreateHlaGradingDto, UpdateHlaGradingDto } from '../models/hla-grading.model';
import { API } from 'src/app/core/constants/api.constants';

describe('HlaGradingService', () => {
  let service: HlaGradingService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HlaGradingService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(HlaGradingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getHlaGradingRecords', () => {
    it('should fetch HLA grading records with params', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            gradeId: 1,
            grade: 'C3X',
            a1: 'I',
            a2: 'I',
            b1: 'I',
            b2: 'I',
            gradeLevel: 1,
            effectiveDate: '2024-01-01',
            terminationDate: null,
            totalCount: 10,
            maxGradeId: 5
          }
        ],
        total: 10
      };

      const params = { searchKeyword: 'C3X' };

      service.getHlaGradingRecords(25, 0, params).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.total).toBe(10);
        expect(response.data[0].grade).toBe('C3X');
        expect(response.data[0].gradeId).toBe(1);
      });

      const req = httpMock.expectOne(API.RECRUITMENT.HLA_MATCHING_GRADES.SEARCH(25, 0));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockResponse);
    });


  });

  describe('getDropdowns', () => {
    it('should fetch dropdown values and return first element', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            grades: [{ key: 'C3X', value: 'Grade C3X' }],
            hlaCodes: [{ key: 'I', value: 'Code I' }]
          }
        ],
        total: 1
      };

      service.getDropdowns().subscribe(response => {
        expect(response.grades.length).toBe(1);
        expect(response.grades[0].key).toBe('C3X');
        expect(response.hlaCodes.length).toBe(1);
        expect(response.hlaCodes[0].key).toBe('I');
      });

      const req = httpMock.expectOne(API.RECRUITMENT.HLA_MATCHING_GRADES.DROPDOWNS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });


  });

  describe('createHlaGrading', () => {
    it('should create a new HLA grading record', () => {
      const payload: CreateHlaGradingDto = {
        grade: 'C3X',
        a1: 'I',
        a2: 'I',
        b1: 'I',
        b2: 'I',
        gradeLevel: 1,
        effectiveDate: '2024-01-01',
        terminationDate: null
      };

      const mockResponse = {
        success: true,
        message: 'Record created successfully',
        statusCode: 201,
        data: {},
        total: 0
      };

      service.createHlaGrading(payload).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Record created successfully');
      });

      const req = httpMock.expectOne(API.RECRUITMENT.HLA_MATCHING_GRADES.CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('updateHlaGrading', () => {
    it('should update an existing HLA grading record', () => {
      const payload: UpdateHlaGradingDto = {
        originalGradeId: 1,
        originalGrade: 'C3X',
        originalA1: 'I',
        originalA2: 'I',
        originalB1: 'I',
        originalB2: 'I',
        grade: 'B1U',
        a1: 'U',
        a2: 'U',
        b1: 'I',
        b2: 'I',
        gradeLevel: 2,
        effectiveDate: '2024-01-01',
        terminationDate: '2025-12-31'
      };

      const mockResponse = {
        success: true,
        message: 'Record updated successfully',
        statusCode: 200,
        data: {},
        total: 0
      };

      service.updateHlaGrading(payload).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Record updated successfully');
      });

      const req = httpMock.expectOne(API.RECRUITMENT.HLA_MATCHING_GRADES.UPDATE);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

  });

  describe('Error Handling', () => {
    it('should handle HTTP errors on getHlaGradingRecords', () => {
      service.getHlaGradingRecords(25, 0, {}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.RECRUITMENT.HLA_MATCHING_GRADES.SEARCH(25, 0));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors on createHlaGrading', () => {
      const payload: CreateHlaGradingDto = {
        grade: 'C3X', a1: 'I', a2: 'I', b1: 'I', b2: 'I',
        gradeLevel: 1, effectiveDate: '2024-01-01', terminationDate: null
      };

      service.createHlaGrading(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API.RECRUITMENT.HLA_MATCHING_GRADES.CREATE);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle HTTP errors on updateHlaGrading', () => {
      const payload: UpdateHlaGradingDto = {
        originalGradeId: 1, originalGrade: 'C3X', originalA1: 'I', originalA2: 'I',
        originalB1: 'I', originalB2: 'I', grade: 'C3X', a1: 'I', a2: 'I',
        b1: 'I', b2: 'I', gradeLevel: 1, effectiveDate: '2024-01-01', terminationDate: null
      };

      service.updateHlaGrading(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.RECRUITMENT.HLA_MATCHING_GRADES.UPDATE);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle HTTP errors on getDropdowns', () => {
      service.getDropdowns().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.RECRUITMENT.HLA_MATCHING_GRADES.DROPDOWNS);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
