import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AssignInterdictionClassService } from './assign-interdiction-class.service';
import { ApiService } from '@shared/services/api.service';
import {
  AssignInterdictionClassModel,
  AssignInterdictionClassParamsDto,
  AssignInterdictionClassDto,
  InterdictionDetailDto
} from '../models/assign-interdiction-class.model';
import { of, throwError } from 'rxjs';

describe('AssignInterdictionClassService', () => {
  let service: AssignInterdictionClassService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockTableData: AssignInterdictionClassModel[] = [
    {
      interdictionCode: 'INT001',
      description: 'Test Interdiction 1',
      type: 'Type A',
      class: 'Class 1',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: new Date('2024-12-31'),
      modificationDate: new Date('2024-06-15')
    },
    {
      interdictionCode: 'INT002',
      description: 'Test Interdiction 2',
      type: 'Type B',
      class: 'Class 2',
      effectiveDate: new Date('2024-02-01'),
      terminationDate: null,
      modificationDate: new Date('2024-07-20')
    }
  ];

  const mockApiResponse = {
    success: true,
    message: 'Data retrieved successfully',
    statusCode: 200,
    data: mockTableData,
    total: 2
  };

  const mockFilterResponse = {
    success: true,
    message: 'Filters retrieved successfully',
    statusCode: 200,
    data: [
      {
        interdictionCode: ['INT001', 'INT002', 'INT003'],
        type: ['Type A', 'Type B', 'Type C'],
        class: ['Class 1', 'Class 2', 'Class 3']
      }
    ]
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['post', 'get', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AssignInterdictionClassService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(AssignInterdictionClassService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAssignInterdictionClass', () => {
    const take = 10;
    const skip = 0;
    const params: AssignInterdictionClassParamsDto = {};

    beforeEach(() => {
      apiService.post.and.returnValue(of(mockApiResponse));
    });


    it('should return table data and total records', (done) => {
      service.getAssignInterdictionClass(take, skip, params).subscribe(response => {
        expect(response.data).toEqual(mockTableData);
        expect(response.totalRecords).toBe(2);
        done();
      });
    });







    it('should propagate API errors to subscribers', (done) => {
      const errorResponse = { message: 'Network error' };
      apiService.post.and.returnValue(throwError(() => errorResponse));

      service.getAssignInterdictionClass(take, skip, params).subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });


    it('should map response data correctly with all fields', (done) => {
      service.getAssignInterdictionClass(take, skip, params).subscribe(response => {
        const firstItem = response.data[0];

        expect(firstItem.interdictionCode).toBe('INT001');
        expect(firstItem.description).toBe('Test Interdiction 1');
        expect(firstItem.type).toBe('Type A');
        expect(firstItem.class).toBe('Class 1');
        expect(firstItem.effectiveDate).toEqual(new Date('2024-01-01'));
        expect(firstItem.terminationDate).toEqual(new Date('2024-12-31'));
        expect(firstItem.modificationDate).toEqual(new Date('2024-06-15'));
        done();
      });
    });
  });

  describe('getAssignInterdictionClassFilters', () => {
    beforeEach(() => {
      apiService.get.and.returnValue(of(mockFilterResponse));
    });


    it('should return filter options', (done) => {
      service.getAssignInterdictionClassFilters().subscribe(response => {
        expect(response).toEqual(mockFilterResponse);
        expect(response.data?.[0].interdictionCode).toBeDefined();
        expect(response.data?.[0].type).toBeDefined();
        expect(response.data?.[0].class).toBeDefined();
        done();
      });
    });

    it('should return interdiction code options', (done) => {
      service.getAssignInterdictionClassFilters().subscribe(response => {
        const filterData = response.data?.[0];
        expect(filterData?.interdictionCode).toEqual(['INT001', 'INT002', 'INT003']);
        done();
      });
    });

    it('should return type options', (done) => {
      service.getAssignInterdictionClassFilters().subscribe(response => {
        const filterData = response.data?.[0];
        expect(filterData?.type).toEqual(['Type A', 'Type B', 'Type C']);
        done();
      });
    });

    it('should return class options', (done) => {
      service.getAssignInterdictionClassFilters().subscribe(response => {
        const filterData = response.data?.[0];
        expect(filterData?.class).toEqual(['Class 1', 'Class 2', 'Class 3']);
        done();
      });
    });

    it('should handle empty filter response', (done) => {
      const emptyFilterResponse = {
        success: true,
        data: []
      };
      apiService.get.and.returnValue(of(emptyFilterResponse));
      service.getAssignInterdictionClassFilters().subscribe(response => {
        expect(response.data).toEqual([]);
        done();
      });
    });


    it('should handle partial filter data', (done) => {
      const partialFilterResponse = {
        success: true,
        data: [
          {
            interdictionCode: ['INT001']
          }
        ]
      };
      apiService.get.and.returnValue(of(partialFilterResponse as any));
      service.getAssignInterdictionClassFilters().subscribe(response => {
        const filterData = response.data?.[0] as any;
        expect(filterData?.interdictionCode).toBeDefined();
        expect(filterData?.type).toBeUndefined();
        expect(filterData?.class).toBeUndefined();
        done();
      });
    });

    it('should handle API error and log to console', (done) => {
      const errorResponse = {
        message: 'Server error',
        statusCode: 500
      };
      apiService.get.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');
      service.getAssignInterdictionClassFilters().subscribe({
        error: (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching assign interdiction class filters:',
            errorResponse
          );
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should propagate API errors to subscribers', (done) => {
      const errorResponse = { message: 'Network error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));
      service.getAssignInterdictionClassFilters().subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });


    it('should maintain response structure with success flag', (done) => {
      service.getAssignInterdictionClassFilters().subscribe(response => {
        expect(response.success).toBe(true);
        done();
      });
    });

    it('should maintain response structure with message', (done) => {
      service.getAssignInterdictionClassFilters().subscribe(response => {
        expect(response.message).toBe('Filters retrieved successfully');
        done();
      });
    });

    it('should maintain response structure with statusCode', (done) => {
      service.getAssignInterdictionClassFilters().subscribe(response => {
        expect(response.statusCode).toBe(200);
        done();
      });
    });
  });

  describe('Service Observable Behavior', () => {
    it('should complete observable after successful response', (done) => {
      apiService.post.and.returnValue(of(mockApiResponse));
      let completed = false;
      service.getAssignInterdictionClass(10, 0, {}).subscribe({
        complete: () => {
          completed = true;
          expect(completed).toBe(true);
          done();
        }
      });
    });
  });

  describe('Edge Cases and Data Integrity', () => {

    it('should preserve date objects in parameters', (done) => {
      const dateParams: AssignInterdictionClassParamsDto = {
        EffectiveDate: '2024-01-01',
        TerminationDate: '2024-12-31'
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      service.getAssignInterdictionClass(10, 0, dateParams).subscribe(() => {
        const callArgs = (apiService.post as jasmine.Spy).calls.mostRecent().args[1];
        expect(callArgs.EffectiveDate).toEqual(dateParams.EffectiveDate);
        expect(callArgs.TerminationDate).toEqual(dateParams.TerminationDate);
        done();
      });
    });
  });

  describe('addInterdictionClass', () => {
    const mockInterdictionClassDto: AssignInterdictionClassDto = {
      InterdictionCode: 'INT001',
      Class: 'Class 1',
      EffectiveDate: '2024-01-01T00:00:00',
      TerminationDate: '2024-12-31T00:00:00'
    };

    const mockSuccessResponse = {
      success: true,
      message: 'Operation successful',
      statusCode: 200,
      item: mockTableData[0]
    };

    beforeEach(() => {
      apiService.post.and.returnValue(of(mockSuccessResponse));
    });


    it('should return success response with item', (done) => {
      service.addInterdictionClass(mockInterdictionClassDto).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item).toBeDefined();
        expect(response.message).toBe('Operation successful');
        done();
      });
    });


    it('should handle API error and log to console', (done) => {
      const errorResponse = {
        message: 'Failed to add interdiction class',
        statusCode: 500
      };
      apiService.post.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.addInterdictionClass(mockInterdictionClassDto).subscribe({
        error: (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error adding interdiction class:',
            errorResponse
          );
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should propagate validation errors', (done) => {
      const validationError = {
        message: 'Validation failed',
        statusCode: 400,
        errors: ['Interdiction code is required', 'Class is required']
      };
      apiService.post.and.returnValue(throwError(() => validationError));

      service.addInterdictionClass(mockInterdictionClassDto).subscribe({
        error: (error) => {
          expect(error.statusCode).toBe(400);
          expect(error.errors).toBeDefined();
          done();
        }
      });
    });

  });

  describe('updateInterdictionClass', () => {
    const mockInterdictionClassDto: AssignInterdictionClassDto = {
      InterdictionCode: 'INT001',
      Class: 'Class 1',
      EffectiveDate: '2024-01-01T00:00:00',
      TerminationDate: '2024-12-31T00:00:00'
    };

    const mockSuccessResponse = {
      success: true,
      message: 'Interdiction class updated successfully',
      statusCode: 200,
      item: mockTableData[0]
    };


    it('should return success response with updated item', (done) => {
      apiService.put.and.returnValue(of(mockSuccessResponse));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item).toBeDefined();
        expect(response.item).toEqual(mockTableData[0]);
        expect(response.message).toBe('Interdiction class updated successfully');
        expect(response.statusCode).toBe(200);
        done();
      });
    });

    it('should handle dto with null termination date', (done) => {
      const dtoWithNullTermDate: AssignInterdictionClassDto = {
        InterdictionCode: 'INT001',
        Class: 'Class 1',
        EffectiveDate: '2024-01-01T00:00:00',
        TerminationDate: null
      };

      apiService.put.and.returnValue(of(mockSuccessResponse));

      service.updateInterdictionClass(dtoWithNullTermDate).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          jasmine.any(String),
          dtoWithNullTermDate
        );
        const callArgs = (apiService.put as jasmine.Spy).calls.mostRecent().args[1];
        expect(callArgs.TerminationDate).toBeNull();
        done();
      });
    });

    it('should handle dto without termination date property', (done) => {
      const dtoWithoutTermDate: AssignInterdictionClassDto = {
        InterdictionCode: 'INT002',
        Class: 'Class 2',
        EffectiveDate: '2024-02-01T00:00:00'
      };

      apiService.put.and.returnValue(of(mockSuccessResponse));

      service.updateInterdictionClass(dtoWithoutTermDate).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(
          jasmine.any(String),
          dtoWithoutTermDate
        );
        const callArgs = (apiService.put as jasmine.Spy).calls.mostRecent().args[1];
        expect(callArgs.InterdictionCode).toBe('INT002');
        expect(callArgs.Class).toBe('Class 2');
        done();
      });
    });

    it('should handle API error and log to console', (done) => {
      const errorResponse = {
        message: 'Failed to update interdiction class',
        statusCode: 500,
        error: 'Internal Server Error'
      };

      apiService.put.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error updating interdiction class:',
            errorResponse
          );
          expect(error).toEqual(errorResponse);
          expect(error.statusCode).toBe(500);
          done();
        }
      });
    });

    it('should propagate validation errors', (done) => {
      const validationError = {
        message: 'Validation failed',
        statusCode: 400,
        errors: ['Class is required', 'Effective date is required']
      };

      apiService.put.and.returnValue(throwError(() => validationError));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.statusCode).toBe(400);
          expect(error.message).toBe('Validation failed');
          expect(error.errors).toBeDefined();
          expect(error.errors.length).toBe(2);
          done();
        }
      });
    });


    it('should handle 401 unauthorized error', (done) => {
      const unauthorizedError = {
        message: 'Unauthorized',
        statusCode: 401,
        error: 'Unauthorized access'
      };

      apiService.put.and.returnValue(throwError(() => unauthorizedError));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.statusCode).toBe(401);
          expect(error.message).toBe('Unauthorized');
          done();
        }
      });
    });

    it('should handle 403 forbidden error', (done) => {
      const forbiddenError = {
        message: 'You do not have permission to update this resource',
        statusCode: 403,
        error: 'Forbidden'
      };

      apiService.put.and.returnValue(throwError(() => forbiddenError));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.statusCode).toBe(403);
          done();
        }
      });
    });

    it('should complete observable after successful response', (done) => {
      apiService.put.and.returnValue(of(mockSuccessResponse));
      let completed = false;

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe({
        next: () => {
          // Successfully received data
        },
        complete: () => {
          completed = true;
          expect(completed).toBe(true);
          done();
        }
      });
    });

    it('should pass all dto properties correctly', (done) => {
      const fullDto: AssignInterdictionClassDto = {
        InterdictionCode: 'INT999',
        Class: 'Class 99',
        EffectiveDate: '2024-05-15T00:00:00',
        TerminationDate: '2025-05-15T00:00:00'
      };

      apiService.put.and.returnValue(of(mockSuccessResponse));

      service.updateInterdictionClass(fullDto).subscribe(() => {
        const callArgs = (apiService.put as jasmine.Spy).calls.mostRecent().args[1];
        expect(callArgs.InterdictionCode).toBe('INT999');
        expect(callArgs.Class).toBe('Class 99');
        expect(callArgs.EffectiveDate).toEqual('2024-05-15T00:00:00');
        expect(callArgs.TerminationDate).toEqual('2025-05-15T00:00:00');
        done();
      });
    });

    it('should handle network timeout error', (done) => {
      const timeoutError = {
        message: 'Request timeout',
        statusCode: 408,
        error: 'Request Timeout'
      };

      apiService.put.and.returnValue(throwError(() => timeoutError));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.statusCode).toBe(408);
          done();
        }
      });
    });

    it('should handle empty response from server', (done) => {
      const emptyResponse = {
        success: true,
        message: 'Updated successfully',
        statusCode: 200
      };

      apiService.put.and.returnValue(of(emptyResponse as any));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.item).toBeUndefined();
        done();
      });
    });

    it('should preserve date strings in dto', (done) => {
      const effectiveDate = '2024-03-15T10:30:00';
      const terminationDate = '2025-03-15T10:30:00';

      const dtoWithDates: AssignInterdictionClassDto = {
        InterdictionCode: 'INT003',
        Class: 'Class 3',
        EffectiveDate: effectiveDate,
        TerminationDate: terminationDate
      };

      apiService.put.and.returnValue(of(mockSuccessResponse));

      service.updateInterdictionClass(dtoWithDates).subscribe(() => {
        const callArgs = (apiService.put as jasmine.Spy).calls.mostRecent().args[1];
        expect(callArgs.EffectiveDate).toEqual(effectiveDate);
        expect(callArgs.TerminationDate).toEqual(terminationDate);
        expect(typeof callArgs.EffectiveDate).toBe('string');
        expect(typeof callArgs.TerminationDate).toBe('string');
        done();
      });
    });

    it('should handle special characters in class name', (done) => {
      const dtoWithSpecialChars: AssignInterdictionClassDto = {
        InterdictionCode: 'INT004',
        Class: "Class & Special <> Characters",
        EffectiveDate: '2024-01-01T00:00:00',
        TerminationDate: '2024-12-31T00:00:00'
      };

      apiService.put.and.returnValue(of(mockSuccessResponse));

      service.updateInterdictionClass(dtoWithSpecialChars).subscribe(() => {
        const callArgs = (apiService.put as jasmine.Spy).calls.mostRecent().args[1];
        expect(callArgs.Class).toBe("Class & Special <> Characters");
        done();
      });
    });

    it('should handle concurrent update conflicts (409)', (done) => {
      const conflictError = {
        message: 'The record has been modified by another user',
        statusCode: 409,
        error: 'Conflict'
      };

      apiService.put.and.returnValue(throwError(() => conflictError));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.statusCode).toBe(409);
          expect(error.message).toContain('modified');
          done();
        }
      });
    });


    it('should handle update with only required fields', (done) => {
      const minimalDto: AssignInterdictionClassDto = {
        InterdictionCode: 'INT005',
        Class: 'Minimal Class',
        EffectiveDate: '2024-01-01T00:00:00'
      };

      apiService.put.and.returnValue(of(mockSuccessResponse));

      service.updateInterdictionClass(minimalDto).subscribe(response => {
        expect(response.success).toBe(true);
        const callArgs = (apiService.put as jasmine.Spy).calls.mostRecent().args[1];
        expect(callArgs.InterdictionCode).toBe('INT005');
        expect(callArgs.TerminationDate).toBeUndefined();
        done();
      });
    });

    it('should handle server returning different item than sent', (done) => {
      const differentItemResponse = {
        success: true,
        message: 'Updated',
        statusCode: 200,
        item: mockTableData[1]
      };

      apiService.put.and.returnValue(of(differentItemResponse));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe(response => {
        expect(response.item).toEqual(mockTableData[1]);
        expect(response.item?.interdictionCode).toBe('INT002');
        done();
      });
    });

    it('should propagate custom error properties', (done) => {
      const customError = {
        message: 'Update failed',
        statusCode: 422,
        error: 'Unprocessable Entity',
        details: {
          field: 'effectiveDate',
          reason: 'Date must be in the future'
        }
      };

      apiService.put.and.returnValue(throwError(() => customError));

      service.updateInterdictionClass(mockInterdictionClassDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.statusCode).toBe(422);
          expect(error.details).toBeDefined();
          expect(error.details.field).toBe('effectiveDate');
          done();
        }
      });
    });
  });

  describe('getInterdictionByCode', () => {
    const interCode = 'INT001';

    const mockInterdictionDetail: InterdictionDetailDto = {
      interCode: 'INT001',
      interType: 'Type A',
      interDesc: 'Test Interdiction Description',
      systemInterCode: 'SYS001',
      systemInterFlag: 'Y',
      effDate: '2024-01-01',
      termDate: '2024-12-31',
      lastModifiedDate: '2024-06-15',
      auditKey: 12345,
      programId: 'PROG001',
      changeControlFlag: 'N'
    };

    beforeEach(() => {
      apiService.get.and.returnValue(of(mockInterdictionDetail));
    });

    it('should call apiService.get with correct URL', (done) => {
      service.getInterdictionByCode(interCode).subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(jasmine.stringContaining(`/lab-interdictions/${encodeURIComponent(interCode)}`));
        done();
      });
    });

    it('should return interdiction details', (done) => {
      service.getInterdictionByCode(interCode).subscribe(response => {
        expect(response).toEqual(mockInterdictionDetail);
        expect(response.interCode).toBe('INT001');
        expect(response.interType).toBe('Type A');
        expect(response.interDesc).toBe('Test Interdiction Description');
        done();
      });
    });


    it('should handle interdiction with optional fields undefined', (done) => {
      const minimalDetail: InterdictionDetailDto = {
        interCode: 'INT002',
        interType: 'Type B',
        interDesc: 'Minimal Description',
        systemInterCode: '',
        systemInterFlag: '',
        effDate: '2024-01-01',
        lastModifiedDate: '2024-06-15',
        auditKey: 12345,
        programId: '',
        changeControlFlag: ''
      };

      apiService.get.and.returnValue(of(minimalDetail));

      service.getInterdictionByCode('INT002').subscribe(response => {
        expect(response.systemInterCode).toBe('');
        expect(response.systemInterFlag).toBe('');
        expect(response.programId).toBe('');
        expect(response.changeControlFlag).toBe('');
        done();
      });
    });

    it('should handle 500 server error', (done) => {
      const serverError = {
        message: 'Internal server error',
        statusCode: 500
      };

      apiService.get.and.returnValue(throwError(() => serverError));

      service.getInterdictionByCode(interCode).subscribe({
        error: (error) => {
          expect(error.statusCode).toBe(500);
          done();
        }
      });
    });

    it('should handle special characters in interdiction code', (done) => {
      const specialCode = "INT'001";

      service.getInterdictionByCode(specialCode).subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(jasmine.stringContaining(`/lab-interdictions/${encodeURIComponent(specialCode)}`));
        done();
      });
    });
  });

});