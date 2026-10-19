import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ValidReagentCodeService } from './valid-reagent-code.service';
import { API } from 'src/app/core/constants/api.constants';
import { environment } from 'src/environments/environment';
import { ValidReagentCodeQueryDto } from '../models/valid-reagent-code.model';

describe('ValidReagentCodeService', () => {
  let service: ValidReagentCodeService;
  let httpClient: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpClient', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        ValidReagentCodeService,
        { provide: HttpClient, useValue: httpSpy }
      ]
    });

    service = TestBed.inject(ValidReagentCodeService);
    httpClient = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  describe('getAll', () => {
    it('should return mapped data and totalRecords with query params', (done) => {
      // Arrange
      const queryDto: ValidReagentCodeQueryDto = {
        TestId: 'ABO',
        ShowTerm: true,
        ReagentType: 'R',
        ControlFlag: 'P',
        EffectiveDatePeriod: '30',
        EffectiveDateAfter: '2026-01-01',
        TerminationDatePeriod: '60',
        TerminationDateAfter: '2026-06-01',
        SearchKeyword: 'test',
        SortColumn: 'testId',
        SortOrder: 'asc',
        Take: 25,
        Skip: 0
      } as any;
      const mockResponse = {
        data: [{ testId: 'ABO', reagentCode: 'R001' }],
        total: 1
      };
      httpClient.get.and.returnValue(of(mockResponse));

      // Act
      service.getAll(queryDto).subscribe({
        next: (result) => {
          // Assert
          expect(result.data.length).toBe(1);
          expect(result.totalRecords).toBe(1);
          expect(httpClient.get).toHaveBeenCalledWith(
            `${environment.apiUrl}${API.VALID_REAGENT_CODES.LIST}`,
            jasmine.objectContaining({ params: jasmine.objectContaining({ testId: 'ABO' }) })
          );
          done();
        }
      });
    });

    it('should handle empty query params and null response data', (done) => {
      // Arrange
      const queryDto: ValidReagentCodeQueryDto = {} as any;
      const mockResponse = { data: null, total: null };
      httpClient.get.and.returnValue(of(mockResponse));

      // Act
      service.getAll(queryDto).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toEqual([]);
          expect(result.totalRecords).toBe(0);
          done();
        }
      });
    });

    it('should propagate error', (done) => {
      // Arrange
      const queryDto: ValidReagentCodeQueryDto = {} as any;
      httpClient.get.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      service.getAll(queryDto).subscribe({
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getById', () => {
    it('should return first item when data exists', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ testId: 'ABO', reagentCode: 'R001', description: 'Test Reagent' }]
      };
      httpClient.get.and.returnValue(of(mockResponse));

      // Act
      service.getById('ABO', 'R001').subscribe({
        next: (result) => {
          // Assert
          expect(result).toBeTruthy();
          expect(result!.testId).toBe('ABO');
          expect(httpClient.get).toHaveBeenCalledWith(
            `${environment.apiUrl}${API.VALID_REAGENT_CODES.GET_BY_ID('ABO', 'R001')}`
          );
          done();
        }
      });
    });

    it('should return null when data is empty', (done) => {
      // Arrange
      const mockResponse = { data: [] };
      httpClient.get.and.returnValue(of(mockResponse));

      // Act
      service.getById('ABO', 'INVALID').subscribe({
        next: (result) => {
          // Assert
          expect(result).toBeNull();
          done();
        }
      });
    });

    it('should return null when data is null', (done) => {
      // Arrange
      const mockResponse = { data: null };
      httpClient.get.and.returnValue(of(mockResponse));

      // Act
      service.getById('ABO', 'INVALID').subscribe({
        next: (result) => {
          // Assert
          expect(result).toBeNull();
          done();
        }
      });
    });

    it('should propagate error on getById', (done) => {
      // Arrange
      httpClient.get.and.returnValue(throwError(() => ({ status: 404 })));

      // Act
      service.getById('ABO', 'INVALID').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });
    });
  });

  describe('create', () => {
    it('should post new reagent code successfully', (done) => {
      // Arrange
      const dto = { testId: 'ABO', reagentCode: 'R002' } as any;
      const mockResponse = { success: true, message: 'Created' };
      httpClient.post.and.returnValue(of(mockResponse));

      // Act
      service.create(dto).subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(httpClient.post).toHaveBeenCalledWith(
            `${environment.apiUrl}${API.VALID_REAGENT_CODES.CREATE}`,
            dto
          );
          done();
        }
      });
    });

    it('should propagate error on create', (done) => {
      // Arrange
      const dto = { testId: 'ABO', reagentCode: 'R002' } as any;
      httpClient.post.and.returnValue(throwError(() => ({ status: 400, error: { message: 'Validation failed' } })));

      // Act
      service.create(dto).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });
    });
  });

  describe('update', () => {
    it('should put updated reagent code successfully', (done) => {
      // Arrange
      const dto = { description: 'Updated' } as any;
      const mockResponse = { success: true, message: 'Updated' };
      httpClient.put.and.returnValue(of(mockResponse));

      // Act
      service.update('ABO', 'R001', dto).subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(httpClient.put).toHaveBeenCalledWith(
            `${environment.apiUrl}${API.VALID_REAGENT_CODES.UPDATE('ABO', 'R001')}`,
            dto
          );
          done();
        }
      });
    });

    it('should propagate error on update', (done) => {
      // Arrange
      const dto = { description: 'Updated' } as any;
      httpClient.put.and.returnValue(throwError(() => ({ status: 409, error: { message: 'Conflict' } })));

      // Act
      service.update('ABO', 'R001', dto).subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });
    });
  });

  describe('delete', () => {
    it('should delete reagent code successfully', (done) => {
      // Arrange
      const mockResponse = { success: true, message: 'Deleted' };
      httpClient.delete.and.returnValue(of(mockResponse));

      // Act
      service.delete('ABO', 'R001').subscribe({
        next: (result) => {
          // Assert
          expect(result.success).toBe(true);
          expect(httpClient.delete).toHaveBeenCalledWith(
            `${environment.apiUrl}${API.VALID_REAGENT_CODES.DELETE('ABO', 'R001')}`
          );
          done();
        }
      });
    });

    it('should propagate error on delete', (done) => {
      // Arrange
      httpClient.delete.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      service.delete('ABO', 'R001').subscribe({
        error: (error) => {
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getValidTestsLov', () => {
    it('should return mapped test LOV data', (done) => {
      // Arrange
      const mockResponse = {
        data: [{ testId: 'ABO', testDescription: 'ABO Test' }]
      };
      httpClient.get.and.returnValue(of(mockResponse));

      // Act
      service.getValidTestsLov().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(1);
          expect(result[0].testId).toBe('ABO');
          done();
        }
      });
    });

    it('should return empty array when data is null', (done) => {
      // Arrange
      const mockResponse = { data: null };
      httpClient.get.and.returnValue(of(mockResponse));

      // Act
      service.getValidTestsLov().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should propagate error on getValidTestsLov', (done) => {
      // Arrange
      httpClient.get.and.returnValue(throwError(() => ({ status: 503 })));

      // Act
      service.getValidTestsLov().subscribe({
        error: (error) => {
          expect(error.status).toBe(503);
          done();
        }
      });
    });
  });

  describe('getReagentTypesLov', () => {
    it('should return hardcoded reagent types', (done) => {
      // Act
      service.getReagentTypesLov().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(3);
          expect(result[0]).toEqual({ code: 'R', description: 'Reagent' });
          expect(result[1]).toEqual({ code: 'C', description: 'Control' });
          expect(result[2]).toEqual({ code: 'S', description: 'Substrate' });
          done();
        }
      });
    });
  });

  describe('getControlFlagsLov', () => {
    it('should return hardcoded control flags', (done) => {
      // Act
      service.getControlFlagsLov().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(2);
          expect(result[0]).toEqual({ code: 'P', description: 'Positive' });
          expect(result[1]).toEqual({ code: 'N', description: 'Negative' });
          done();
        }
      });
    });
  });

  describe('getPreparationFlagsLov', () => {
    it('should return hardcoded preparation flags', (done) => {
      // Act
      service.getPreparationFlagsLov().subscribe({
        next: (result) => {
          // Assert
          expect(result.length).toBe(4);
          expect(result[0]).toEqual({ code: 'P', description: 'Prep necessary' });
          expect(result[3]).toEqual({ code: 'N', description: 'Not required' });
          done();
        }
      });
    });
  });
});
