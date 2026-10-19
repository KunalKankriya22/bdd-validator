import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AssignUserInterdictionClassService } from './assign-user-interdiction-class.service';
import { ApiService } from '@shared/services/api.service';
import {
  AssignUserInterdictionClassModel,
  AssignUserInterdictionClassParamsDto,
  AssignUserInterdictionClassDto,
  UserOption,
  InterdictionClassOption
} from '../models/assign-user-interdiction-class.model';
import { of, throwError } from 'rxjs';
import { API } from 'src/app/core/constants/api.constants';

describe('AssignUserInterdictionClassService', () => {
  let service: AssignUserInterdictionClassService;
  let apiService: jasmine.SpyObj<ApiService>;
  let httpMock: HttpTestingController;

  const mockTableData: AssignUserInterdictionClassModel[] = [
    {
      userId: 'USER001',
      userName: 'John Doe',
      interClass: 'SYS',
      interClassDesc: 'System Interdictions',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: new Date('2024-12-31'),
      lastModifiedDate: new Date('2024-06-15'),
      isActive: true
    },
    {
      userId: 'USER002',
      userName: 'Jane Smith',
      interClass: 'LAB',
      interClassDesc: 'Lab Interdictions',
      effectiveDate: new Date('2024-02-01'),
      terminationDate: null,
      lastModifiedDate: new Date('2024-07-20'),
      isActive: true
    }
  ];

  const mockApiResponse = {
    success: true,
    message: 'Data retrieved successfully',
    statusCode: 200,
    data: mockTableData,
    total: 2
  };

  const mockInterdictionClassOptions: InterdictionClassOption[] = [
    {
      code: 'SYS',
      description: 'System Interdictions'
    },
    {
      code: 'LAB',
      description: 'Lab Interdictions'
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['post', 'get', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AssignUserInterdictionClassService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(AssignUserInterdictionClassService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Service Initialization', () => {

    it('should have panelState$ observable', (done) => {
      service.panelState$.subscribe(state => {
        expect(state).toBeDefined();
        expect(state.isOpen).toBe(false);
        expect(state.mode).toBe('add');
        done();
      });
    });
  });

  describe('getAssignUserInterdictionClass', () => {
    const take = 10;
    const skip = 0;
    const params: AssignUserInterdictionClassParamsDto = {};

    beforeEach(() => {
      apiService.post.and.returnValue(of(mockApiResponse));
    });

    it('should call apiService.post with correct endpoint', (done) => {
      const expectedEndpoint = API.APPLICATION_ADMIN.ASSIGN_USER_INTERDICTION_CLASS(take, skip);
      service.getAssignUserInterdictionClass(take, skip, params).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(expectedEndpoint, params);
        done();
      });
    });

    it('should return table data and total records', (done) => {
      service.getAssignUserInterdictionClass(take, skip, params).subscribe(response => {
        expect(response.data).toEqual(mockTableData);
        expect(response.totalRecords).toBe(2);
        done();
      });
    });








    it('should propagate API errors to subscribers', (done) => {
      const errorResponse = { message: 'Network error' };
      apiService.post.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.getAssignUserInterdictionClass(take, skip, params).subscribe({
        error: (error) => {
          expect(console.error).toHaveBeenCalled();
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });

    it('should handle 500 server error response', (done) => {
      const serverError = {
        message: 'Internal server error',
        statusCode: 500
      };
      apiService.post.and.returnValue(throwError(() => serverError));
      spyOn(console, 'error');
      service.getAssignUserInterdictionClass(take, skip, params).subscribe({
        error: (error) => {
          expect(console.error).toHaveBeenCalled();
          expect(error.statusCode).toBe(500);
          done();
        }
      });
    });
  });

  describe('getUsers', () => {
    const mockUsersArray = [
      { userId: 'USER001', userName: 'John Doe' },
      { userId: 'USER002', userName: 'Jane Smith' }
    ];

    beforeEach(() => {
      // API returns array directly, not wrapped
      apiService.get.and.returnValue(of(mockUsersArray));
    });


    it('should return user options with displayName', (done) => {
      service.getUsers().subscribe(response => {
        expect(response.length).toBe(2);
        expect(response[0].userId).toBe('USER001');
        expect(response[0].userName).toBe('John Doe');
        expect(response[0].displayName).toBe('USER001 - John Doe');
        done();
      });
    });

    it('should map user data correctly', (done) => {
      service.getUsers().subscribe(response => {
        const firstUser = response[0];
        expect(firstUser.userId).toBe('USER001');
        expect(firstUser.userName).toBe('John Doe');
        expect(firstUser.displayName).toBe('USER001 - John Doe');
        done();
      });
    });

    it('should handle empty users list', (done) => {
      // API returns empty array directly
      apiService.get.and.returnValue(of([]));
      service.getUsers().subscribe(response => {
        expect(response).toEqual([]);
        done();
      });
    });

    it('should handle non-array response', (done) => {
      // Service returns empty array when response is not an array
      const invalidResponse = { success: true };
      apiService.get.and.returnValue(of(invalidResponse as any));
      spyOn(console, 'warn');
      service.getUsers().subscribe(response => {
        expect(response).toEqual([]);
        expect(console.warn).toHaveBeenCalledWith('Expected array but got:', invalidResponse);
        done();
      });
    });

  });

  describe('getInterdictionClasses', () => {
    beforeEach(() => {
      // API returns array directly, not wrapped
      apiService.get.and.returnValue(of(mockInterdictionClassOptions));
    });


    it('should return interdiction class options', (done) => {
      service.getInterdictionClasses().subscribe(response => {
        expect(response).toEqual(mockInterdictionClassOptions);
        expect(response.length).toBe(2);
        done();
      });
    });


    it('should handle empty classes list', (done) => {
      // API returns empty array directly
      apiService.get.and.returnValue(of([]));
      service.getInterdictionClasses().subscribe(response => {
        expect(response).toEqual([]);
        done();
      });
    });

  });

  describe('getInterdictionClassByCode', () => {
    const classCode = 'SYS';
    const mockClassDetail = {
      code: 'SYS',
      description: 'System Interdictions'
    };

    it('should call http.get with correct URL', (done) => {
      service.getInterdictionClassByCode(classCode).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`/interdiction-classes/${classCode}`)
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockClassDetail);
    });

    it('should return class details', (done) => {
      service.getInterdictionClassByCode(classCode).subscribe(response => {
        expect(response).toEqual(mockClassDetail);
        expect(response.code).toBe('SYS');
        expect(response.description).toBe('System Interdictions');
        done();
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`/interdiction-classes/${classCode}`)
      );
      req.flush(mockClassDetail);
    });

    it('should handle 404 error', (done) => {
      spyOn(console, 'error');
      const notFoundError = {
        message: 'Class not found',
        statusCode: 404
      };

      service.getInterdictionClassByCode(classCode).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          expect(console.error).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne((request) =>
        request.url.includes(`/interdiction-classes/${classCode}`)
      );
      req.flush(notFoundError, { status: 404, statusText: 'Not Found' });
    });

  });

  describe('getUserInterdictionClassById', () => {
    const userId = 'USER001';
    const interClass = 'SYS';
    const mockResponse = {
      success: true,
      data: [mockTableData[0]]
    };

    beforeEach(() => {
      apiService.get.and.returnValue(of(mockResponse));
    });


    it('should return user interdiction class model', (done) => {
      service.getUserInterdictionClassById(userId, interClass).subscribe(response => {
        expect(response).toEqual(mockTableData[0]);
        expect(response.userId).toBe('USER001');
        expect(response.interClass).toBe('SYS');
        done();
      });
    });

    it('should extract first item from data array', (done) => {
      const multiItemResponse = {
        success: true,
        data: mockTableData
      };
      apiService.get.and.returnValue(of(multiItemResponse));

      service.getUserInterdictionClassById(userId, interClass).subscribe(response => {
        expect(response).toEqual(mockTableData[0]);
        done();
      });
    });

    it('should throw error when data array is empty', (done) => {
      const emptyResponse = {
        success: true,
        data: []
      };
      apiService.get.and.returnValue(of(emptyResponse));

      service.getUserInterdictionClassById(userId, interClass).subscribe({
        error: (error) => {
          expect(error.message).toBe('User interdiction class record not found');
          done();
        }
      });
    });


  });

  describe('addUserInterdictionClass', () => {
    const mockDto: AssignUserInterdictionClassDto = {
      userId: 'USER001',
      interClass: 'SYS',
      effectiveDate: '2024-01-01T00:00:00.000Z',
      terminationDate: '2024-12-31T00:00:00.000Z'
    };

    const mockSuccessResponse = {
      success: true,
      message: 'User interdiction class added successfully',
      statusCode: 200,
      item: mockTableData[0]
    };

    beforeEach(() => {
      apiService.post.and.returnValue(of(mockSuccessResponse));
    });

    it('should call apiService.post with correct endpoint and dto', (done) => {
      const expectedEndpoint = API.APPLICATION_ADMIN.CREATE_USER_INTERDICTION_CLASS;
      service.addUserInterdictionClass(mockDto).subscribe(() => {
        expect(apiService.post).toHaveBeenCalledWith(expectedEndpoint, mockDto);
        done();
      });
    });




    it('should handle API error and log to console', (done) => {
      const errorResponse = {
        message: 'Failed to add user interdiction class',
        statusCode: 500
      };
      apiService.post.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.addUserInterdictionClass(mockDto).subscribe({
        error: (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error adding user interdiction class:',
            errorResponse
          );
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });


    it('should handle 400 bad request error', (done) => {
      const badRequestError = {
        message: 'Invalid data provided',
        statusCode: 400
      };
      apiService.post.and.returnValue(throwError(() => badRequestError));

      service.addUserInterdictionClass(mockDto).subscribe({
        error: (error) => {
          expect(error.statusCode).toBe(400);
          done();
        }
      });
    });
  });

  describe('updateUserInterdictionClass', () => {
    const userId = 'USER001';
    const interClass = 'SYS';
    const mockDto = {
      effectiveDate: '2024-01-01T00:00:00.000Z',
      terminationDate: '2024-12-31T00:00:00.000Z'
    };

    const mockSuccessResponse = {
      success: true,
      message: 'User interdiction class updated successfully',
      statusCode: 200,
      item: mockTableData[0]
    };

    beforeEach(() => {
      apiService.put.and.returnValue(of(mockSuccessResponse));
    });

    it('should call apiService.put with correct endpoint and dto', (done) => {
      const expectedEndpoint = API.APPLICATION_ADMIN.UPDATE_USER_INTERDICTION_CLASS(userId, interClass);
      service.updateUserInterdictionClass(userId, interClass, mockDto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(expectedEndpoint, mockDto);
        done();
      });
    });



    it('should handle API error and log to console', (done) => {
      const errorResponse = {
        message: 'Failed to update user interdiction class',
        statusCode: 500
      };

      apiService.put.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');

      service.updateUserInterdictionClass(userId, interClass, mockDto).subscribe({
        error: (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error updating user interdiction class:',
            errorResponse
          );
          expect(error).toEqual(errorResponse);
          done();
        }
      });
    });


    it('should handle 400 bad request error', (done) => {
      const badRequestError = {
        message: 'Invalid data provided',
        statusCode: 400
      };

      apiService.put.and.returnValue(throwError(() => badRequestError));

      service.updateUserInterdictionClass(userId, interClass, mockDto).subscribe({
        error: (error) => {
          expect(error.statusCode).toBe(400);
          done();
        }
      });
    });

    it('should handle different user and class combinations', (done) => {
      const differentUserId = 'USER002';
      const differentClass = 'LAB';
      const expectedEndpoint = API.APPLICATION_ADMIN.UPDATE_USER_INTERDICTION_CLASS(differentUserId, differentClass);

      service.updateUserInterdictionClass(differentUserId, differentClass, mockDto).subscribe(() => {
        expect(apiService.put).toHaveBeenCalledWith(expectedEndpoint, mockDto);
        done();
      });
    });
  });

  describe('Service Observable Behavior', () => {
    it('should complete observable after successful response', (done) => {
      apiService.post.and.returnValue(of(mockApiResponse));
      let completed = false;
      service.getAssignUserInterdictionClass(10, 0, {}).subscribe({
        complete: () => {
          completed = true;
          expect(completed).toBe(true);
          done();
        }
      });
    });

    it('should not complete observable on error', (done) => {
      const errorResponse = { message: 'Error' };
      apiService.post.and.returnValue(throwError(() => errorResponse));
      spyOn(console, 'error');
      let completed = false;

      service.getAssignUserInterdictionClass(10, 0, {}).subscribe({
        complete: () => {
          completed = true;
        },
        error: () => {
          expect(completed).toBe(false);
          done();
        }
      });
    });
  });

  describe('Edge Cases and Data Integrity', () => {

    it('should preserve date strings in filter parameters', (done) => {
      const dateParams: AssignUserInterdictionClassParamsDto = {
        effectiveDate: '2024-01-01',
        terminationDate: '2024-12-31'
      };

      apiService.post.and.returnValue(of(mockApiResponse));

      service.getAssignUserInterdictionClass(10, 0, dateParams).subscribe(() => {
        const callArgs = (apiService.post as jasmine.Spy).calls.mostRecent().args[1];
        expect(callArgs.effectiveDate).toEqual(dateParams.effectiveDate);
        expect(callArgs.terminationDate).toEqual(dateParams.terminationDate);
        done();
      });
    });

  });
});
