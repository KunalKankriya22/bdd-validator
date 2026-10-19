import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { LabMasterCodeTypeApiService } from './lab-master-code-type-api.service';
import {
  CreateLabMasterCodeTypeDto,
  UpdateLabMasterCodeTypeDto,
} from '../models/lab-master-code-type.models';
import { environment } from 'src/environments/environment';

describe('LabMasterCodeTypeApiService - Unit Tests', () => {
  let service: LabMasterCodeTypeApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/v1/lab-master-code-types`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [LabMasterCodeTypeApiService]
    });

    service = TestBed.inject(LabMasterCodeTypeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {

    it('should have correct base URL', () => {
      expect((service as any).baseUrl).toBe(baseUrl);
    });
  });

  describe('createCodeType()', () => {
    const createDto: CreateLabMasterCodeTypeDto = {
      codeType: 'TEST1',
      description: 'Test Description',
      effectiveDate: new Date('2024-01-15'),
      terminationDate: new Date('2024-12-31')
    };

    it('should convert Date objects to ISO strings', (done) => {
      service.createCodeType(createDto).subscribe({
        next: () => done(),
        error: () => fail('Expected success')
      });

      const req = httpMock.expectOne(baseUrl);
      expect(typeof req.request.body.effectiveDate).toBe('string');
      expect(typeof req.request.body.terminationDate).toBe('string');

      req.flush(null);
    });



    it('should handle 400 Bad Request error', (done) => {
      service.createCodeType(createDto).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('Invalid request');
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        { message: 'Invalid request data' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    it('should handle 409 Conflict error (duplicate)', (done) => {
      service.createCodeType(createDto).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('already exists');
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(
        { message: 'Code Type already exists' },
        { status: 409, statusText: 'Conflict' }
      );
    });


    it('should make POST request to correct URL', (done) => {
      const createDto: CreateLabMasterCodeTypeDto = {
        codeType: 'TEST1',
        description: 'Test Description',
        effectiveDate: new Date('2024-01-15')
      };

      service.createCodeType(createDto).subscribe({
        next: () => done(),
        error: () => fail('Expected success')
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.url).toBe(baseUrl);

      req.flush(null);
    });

    it('should send complete request body with all fields', (done) => {
      const createDto: CreateLabMasterCodeTypeDto = {
        codeType: 'TEST1',
        description: 'Test Description',
        effectiveDate: new Date('2024-01-15'),
        terminationDate: new Date('2024-12-31')
      };

      service.createCodeType(createDto).subscribe({
        next: () => done(),
        error: () => fail('Expected success')
      });

      const req = httpMock.expectOne(baseUrl);

      expect(req.request.body.codeType).toBe('TEST1');
      expect(req.request.body.description).toBe('Test Description');
      expect(req.request.body.effectiveDate).toBeTruthy();
      expect(req.request.body.terminationDate).toBeTruthy();

      req.flush(null);
    });

    it('should handle error response without message property', (done) => {
      const createDto: CreateLabMasterCodeTypeDto = {
        codeType: 'TEST1',
        description: 'Test',
        effectiveDate: new Date('2024-01-15')
      };

      service.createCodeType(createDto).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toBe('Invalid request');
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({}, { status: 400, statusText: 'Bad Request' });
    });

    it('should preserve date values through formatting and parsing', (done) => {
      const originalDate = new Date('2024-01-15T10:30:00Z');
      const createDto: CreateLabMasterCodeTypeDto = {
        codeType: 'TEST1',
        description: 'Test',
        effectiveDate: originalDate
      };

      service.createCodeType(createDto).subscribe({
        next: () => done(),
        error: () => fail('Expected success')
      });

      const req = httpMock.expectOne(baseUrl);
      const sentDate = new Date(req.request.body.effectiveDate);
      expect(sentDate.getTime()).toBe(originalDate.getTime());

      req.flush(null);
    });

  });

  describe('updateCodeType()', () => {
    const codeType = 'TEST1';
    const updateDto: UpdateLabMasterCodeTypeDto = {
      codeType: 'TEST1',
      description: 'Updated Description',
      effectiveDate: new Date('2024-02-15'),
      terminationDate: new Date('2024-12-31')
    };

    it('should encode codeType parameter in URL', (done) => {
      const specialCode = 'CODE WITH SPACES';
      const specialDto: UpdateLabMasterCodeTypeDto = {
        codeType: specialCode,
        description: 'Updated Description',
        effectiveDate: new Date('2024-02-15'),
        terminationDate: new Date('2024-12-31')
      };
      service.updateCodeType(specialCode, specialDto).subscribe({
        next: () => done(),
        error: () => fail('Expected success')
      });

      const expectedUrl = `${baseUrl}/${encodeURIComponent(specialCode)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.url).toContain(encodeURIComponent(specialCode));

      req.flush(null);
    });

    it('should convert dates to ISO strings in update', (done) => {
      service.updateCodeType(codeType, updateDto).subscribe({
        next: () => done(),
        error: () => fail('Expected success')
      });

      const req = httpMock.expectOne(`${baseUrl}/${codeType}`);
      expect(typeof req.request.body.effectiveDate).toBe('string');
      expect(typeof req.request.body.terminationDate).toBe('string');

      req.flush(null);
    });


    it('should handle 404 Not Found error', (done) => {
      service.updateCodeType(codeType, updateDto).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${codeType}`);
      req.flush(
        { message: 'Code Type not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should handle 400 error with custom message', (done) => {
      service.updateCodeType(codeType, updateDto).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toBe('Invalid date range');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${codeType}`);
      req.flush(
        { message: 'Invalid date range' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

  });

  describe('getCodeTypeForEdit()', () => {
    const codeType = 'TEST1';
    const apiResponse = {
      code: 'TEST1',
      description: 'Test Description',
      effectiveDate: '2024-01-15T00:00:00Z',
      terminationDate: '2024-12-31T00:00:00Z',
      codeBehavior: 'STANDARD',
      numericalValue: 100,
      modificationDate: '2024-01-20T10:30:00Z'
    };

    it('should get code type for edit successfully', (done) => {
      service.getCodeTypeForEdit(codeType).subscribe({
        next: (response) => {
          expect(response.code).toBe('TEST1');
          expect(response.description).toBe('Test Description');
          expect(response.effectiveDate).toBeInstanceOf(Date);
          expect(response.terminationDate).toBeInstanceOf(Date);
          expect(response.modificationDate).toBeInstanceOf(Date);
          done();
        },
        error: () => fail('Expected success')
      });

      const expectedUrl = `${baseUrl}/${codeType}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');

      req.flush(apiResponse);
    });

    it('should parse ISO date strings to Date objects', (done) => {
      service.getCodeTypeForEdit(codeType).subscribe({
        next: (response) => {
          expect(response.effectiveDate.getFullYear()).toBe(2024);
          expect(response.effectiveDate.getMonth()).toBe(0); // January
          expect(response.effectiveDate.getDate()).toBe(15);

          expect(response.terminationDate?.getFullYear()).toBe(2024);
          expect(response.terminationDate?.getMonth()).toBe(11); // December
          expect(response.terminationDate?.getDate()).toBe(31);

          done();
        },
        error: () => fail('Expected success')
      });

      const req = httpMock.expectOne(`${baseUrl}/${codeType}`);
      req.flush(apiResponse);
    });



    it('should encode special characters in codeType parameter', (done) => {
      const specialCode = 'CODE/WITH/SLASHES';
      service.getCodeTypeForEdit(specialCode).subscribe({
        next: () => done(),
        error: () => fail('Expected success')
      });

      const expectedUrl = `${baseUrl}/${encodeURIComponent(specialCode)}`;
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.url).toContain(encodeURIComponent(specialCode));

      req.flush(apiResponse);
    });

    it('should handle 404 error when code type not found', (done) => {
      service.getCodeTypeForEdit(codeType).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('not found');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${codeType}`);
      req.flush(
        { message: 'Resource not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });

    it('should handle 500 error with custom message', (done) => {
      service.getCodeTypeForEdit(codeType).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toBe('Database query failed');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${codeType}`);
      req.flush(
        { message: 'Database query failed' },
        { status: 500, statusText: 'Internal Server Error' }
      );
    });
  });

  describe('Error Handling', () => {
    const createDto: CreateLabMasterCodeTypeDto = {
      codeType: 'TEST1',
      description: 'Test',
      effectiveDate: new Date('2024-01-15')
    };

    it('should handle unknown status codes', (done) => {
      service.createCodeType(createDto).subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error.message).toContain('code 418');
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({}, { status: 418, statusText: "I'm a teapot" });
    });

    it('should log errors to console', (done) => {
      spyOn(console, 'error');

      service.createCodeType(createDto).subscribe({
        next: () => fail('Expected error'),
        error: () => {
          expect(console.error).toHaveBeenCalledWith(
            'API Error:',
            jasmine.any(String),
            jasmine.any(Object)
          );
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

  });
  describe('Private Methods - Date Parsing', () => {
    it('should parse dates correctly from API', () => {
      const response = {
        effectiveDate: '2024-01-15T00:00:00Z',
        terminationDate: '2024-12-31T00:00:00Z',
        modificationDate: '2024-01-20T10:30:00Z'
      };

      const parsed = (service as any).parseDatesFromApi(response);

      expect(parsed.effectiveDate).toBeInstanceOf(Date);
      expect(parsed.terminationDate).toBeInstanceOf(Date);
      expect(parsed.modificationDate).toBeInstanceOf(Date);
    });

    it('should handle missing dates in parseDatesFromApi', () => {
      const response = {
        codeType: 'TEST1',
        description: 'Test'
      };

      const parsed = (service as any).parseDatesFromApi(response);

      expect(parsed.effectiveDate).toBeUndefined();
      expect(parsed.terminationDate).toBeUndefined();
      expect(parsed.modificationDate).toBeUndefined();
    });
  });
});
});
