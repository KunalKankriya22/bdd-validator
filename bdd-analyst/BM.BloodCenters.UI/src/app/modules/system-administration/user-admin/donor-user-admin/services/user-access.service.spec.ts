import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';

import { UserAccessService } from './user-access.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  DefineUserAccessListDto,
  ApiResponse,
  AccessClassDropdownDto,
  UserDropdownOption,
  OverlappingInterdictionDto,
  AssignUserAccessDto,
  UpdateUserAccessDto
} from '../models/user-access.model';

describe('UserAccessService', () => {
  let service: UserAccessService;
  let httpMock: HttpTestingController;

  const mockApiResponse: ApiResponse<DefineUserAccessListDto[]> = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: [
      {
        userId: 'USER001',
        userName: 'John Doe',
        department: 'IT Department',
        accessClass: 'ADMIN',
        description: 'Administrator Access',
        level: 1,
        effectiveDate: '2024-01-01',
        terminationDate: '2024-12-31'
      },
      {
        userId: 'USER001',
        userName: 'John Doe',
        department: 'IT Department',
        accessClass: 'USER',
        description: 'Standard User Access',
        level: 2,
        effectiveDate: '2024-01-01',
        terminationDate: ''
      }
    ]
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserAccessService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UserAccessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUserAccessClasses', () => {

    it('should trim userId before sending request', () => {
      const userId = '  USER001  ';

      service.getUserAccessClasses(userId).subscribe();

      const req = httpMock.expectOne(
        `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=ASC`
      );
      expect(req.request.params.get('userId')).toBe('USER001');

      req.flush(mockApiResponse);
    });

    it('should return data array from API response', () => {
      const userId = 'USER001';

      service.getUserAccessClasses(userId).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].userId).toBe('USER001');
        expect(result[0].accessClass).toBe('ADMIN');
        expect(result[1].accessClass).toBe('USER');
      });

      const req = httpMock.expectOne(
        `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=ASC`
      );
      req.flush(mockApiResponse);
    });

    it('should use ASC as default sort direction', () => {
      service.getUserAccessClasses('USER001').subscribe();

      const req = httpMock.expectOne(
        `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=ASC`
      );
      expect(req.request.params.get('sortDir')).toBe('ASC');
      req.flush(mockApiResponse);
    });

    it('should pass DESC sort direction when specified', () => {
      service.getUserAccessClasses('USER001', 'DESC').subscribe(result => {
        expect(result.length).toBe(2);
      });

      const req = httpMock.expectOne(
        `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=DESC`
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('sortDir')).toBe('DESC');
      req.flush(mockApiResponse);
    });

    it('should handle 404 error', () => {
      const userId = 'USER001';

      service.getUserAccessClasses(userId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(
        `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=ASC`
      );
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 401 unauthorized error', () => {
      const userId = 'USER001';

      service.getUserAccessClasses(userId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(
        `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=ASC`
      );
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 500 server error', () => {
      service.getUserAccessClasses('USER001').subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(
        `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=ASC`
      );
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should map all fields correctly from API response', () => {
      const userId = 'USER001';

      service.getUserAccessClasses(userId).subscribe(result => {
        const firstItem = result[0];
        expect(firstItem.userId).toBe('USER001');
        expect(firstItem.userName).toBe('John Doe');
        expect(firstItem.department).toBe('IT Department');
        expect(firstItem.accessClass).toBe('ADMIN');
        expect(firstItem.description).toBe('Administrator Access');
        expect(firstItem.level).toBe(1);
        expect(firstItem.effectiveDate).toBe('2024-01-01');
        expect(firstItem.terminationDate).toBe('2024-12-31');
      });

      const req = httpMock.expectOne(
        `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=ASC`
      );
      req.flush(mockApiResponse);
    });
  });

  describe('getUsersDropdown', () => {
    const mockUsersDropdownResponse: ApiResponse<UserDropdownOption[]> = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [
        { userId: 'USER001', userName: 'John Doe' },
        { userId: 'USER002', userName: 'Jane Smith' }
      ]
    };

    it('should call API with correct URL and GET method', () => {
      service.getUsersDropdown().subscribe();

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.USERS_DROPDOWN);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsersDropdownResponse);
    });

    it('should return users dropdown data', () => {
      service.getUsersDropdown().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].userId).toBe('USER001');
        expect(result[0].userName).toBe('John Doe');
        expect(result[1].userId).toBe('USER002');
        expect(result[1].userName).toBe('Jane Smith');
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.USERS_DROPDOWN);
      req.flush(mockUsersDropdownResponse);
    });

    it('should return empty array when response data is null', () => {
      const nullDataResponse: ApiResponse<UserDropdownOption[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any
      };

      service.getUsersDropdown().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.USERS_DROPDOWN);
      req.flush(nullDataResponse);
    });

    it('should return empty array when response data is undefined', () => {
      const undefinedDataResponse = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      service.getUsersDropdown().subscribe(result => {
        expect(result).toEqual([]);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.USERS_DROPDOWN);
      req.flush(undefinedDataResponse);
    });

    it('should handle HTTP error', () => {
      service.getUsersDropdown().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.USERS_DROPDOWN);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 401 unauthorized error', () => {
      service.getUsersDropdown().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.USERS_DROPDOWN);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('getActiveAccessClasses', () => {
    const mockAccessClassesResponse: ApiResponse<AccessClassDropdownDto[]> = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [
        { code: 'ADMIN', description: 'Administrator Access' },
        { code: 'USER', description: 'Standard User' },
        { code: 'VIEWER', description: 'Read-Only Viewer' }
      ]
    };

    it('should call API with correct URL', () => {
      service.getActiveAccessClasses().subscribe(result => {
        expect(result).toEqual(mockAccessClassesResponse);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ACCESS_CLASSES);
      expect(req.request.method).toBe('GET');
      req.flush(mockAccessClassesResponse);
    });

    it('should return access classes data', () => {
      service.getActiveAccessClasses().subscribe(result => {
        expect(result.success).toBeTrue();
        expect(result.data.length).toBe(3);
        expect(result.data[0].code).toBe('ADMIN');
        expect(result.data[1].code).toBe('USER');
        expect(result.data[2].code).toBe('VIEWER');
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ACCESS_CLASSES);
      req.flush(mockAccessClassesResponse);
    });

    it('should handle 401 unauthorized error', () => {
      service.getActiveAccessClasses().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ACCESS_CLASSES);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 500 server error', () => {
      service.getActiveAccessClasses().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ACCESS_CLASSES);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('assignAccessClass', () => {
    const mockSuccessResponse: ApiResponse<object> = {
      success: true,
      message: 'Access class assigned successfully',
      statusCode: 200,
      data: {}
    };

    const mockAssignDto: AssignUserAccessDto = {
      userId: 'USER001',
      accessClass: 'ADMIN',
      interLevel: 1,
      effDate: '2024-06-01T00:00:00.000Z',
      termDate: '2024-12-31T00:00:00.000Z'
    };

    const mockLoggedInUserName = 'TESTUSER';
    const mockChapterId = '001';

    it('should call API with correct URL and payload', () => {
      service.assignAccessClass(mockAssignDto, mockLoggedInUserName, mockChapterId).subscribe(result => {
        expect(result).toEqual(mockSuccessResponse);
      });

      const req = httpMock.expectOne(req => req.url === API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ASSIGN);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockAssignDto);
      expect(req.request.params.get('loggedInUserName')).toBe('TESTUSER');
      expect(req.request.params.get('chapterId')).toBe('001');
      req.flush(mockSuccessResponse);
    });

    it('should send correct payload with all fields and query params', () => {
      service.assignAccessClass(mockAssignDto, mockLoggedInUserName, mockChapterId).subscribe();

      const req = httpMock.expectOne(req => req.url === API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ASSIGN);
      expect(req.request.body.userId).toBe('USER001');
      expect(req.request.body.accessClass).toBe('ADMIN');
      expect(req.request.body.interLevel).toBe(1);
      expect(req.request.body.effDate).toBe('2024-06-01T00:00:00.000Z');
      expect(req.request.body.termDate).toBe('2024-12-31T00:00:00.000Z');
      req.flush(mockSuccessResponse);
    });

    it('should handle API failure response', () => {
      const failureResponse: ApiResponse<object> = {
        success: false,
        message: 'Access class already exists for user',
        statusCode: 400,
        data: {}
      };

      service.assignAccessClass(mockAssignDto, mockLoggedInUserName, mockChapterId).subscribe(result => {
        expect(result.success).toBeFalse();
        expect(result.message).toBe('Access class already exists for user');
      });

      const req = httpMock.expectOne(req => req.url === API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ASSIGN);
      req.flush(failureResponse);
    });

    it('should handle 400 bad request error', () => {
      service.assignAccessClass(mockAssignDto, mockLoggedInUserName, mockChapterId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(req => req.url === API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ASSIGN);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle 401 unauthorized error', () => {
      service.assignAccessClass(mockAssignDto, mockLoggedInUserName, mockChapterId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne(req => req.url === API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ASSIGN);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 500 server error', () => {
      service.assignAccessClass(mockAssignDto, mockLoggedInUserName, mockChapterId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(req => req.url === API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.ASSIGN);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('updateAccessClass', () => {
    const mockSuccessResponse: ApiResponse<object> = {
      success: true,
      message: 'Access class updated successfully',
      statusCode: 200,
      data: {}
    };

    const mockUpdateDto: UpdateUserAccessDto = {
      interLevel: 3,
      effDate: '2024-06-01T00:00:00.000Z',
      termDate: '2024-12-31T00:00:00.000Z'
    };

    const userId = 'USER001';
    const accessClass = 'ADMIN';

    it('should call API with correct URL and payload', () => {
      service.updateAccessClass(userId, accessClass, mockUpdateDto).subscribe(result => {
        expect(result).toEqual(mockSuccessResponse);
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.UPDATE(userId, accessClass);
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdateDto);
      req.flush(mockSuccessResponse);
    });

    it('should send correct payload with all fields', () => {
      service.updateAccessClass(userId, accessClass, mockUpdateDto).subscribe();

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.UPDATE(userId, accessClass);
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.body.interLevel).toBe(3);
      expect(req.request.body.effDate).toBe('2024-06-01T00:00:00.000Z');
      expect(req.request.body.termDate).toBe('2024-12-31T00:00:00.000Z');
      req.flush(mockSuccessResponse);
    });

    it('should handle API failure response', () => {
      const failureResponse: ApiResponse<object> = {
        success: false,
        message: 'Failed to update access class',
        statusCode: 400,
        data: {}
      };

      service.updateAccessClass(userId, accessClass, mockUpdateDto).subscribe(result => {
        expect(result.success).toBeFalse();
        expect(result.message).toBe('Failed to update access class');
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.UPDATE(userId, accessClass);
      const req = httpMock.expectOne(expectedUrl);
      req.flush(failureResponse);
    });

    it('should handle 401 unauthorized error', () => {
      service.updateAccessClass(userId, accessClass, mockUpdateDto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.UPDATE(userId, accessClass);
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 500 server error', () => {
      service.updateAccessClass(userId, accessClass, mockUpdateDto).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.UPDATE(userId, accessClass);
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getOverlappingInterdictions', () => {
    const mockOverlappingResponse: ApiResponse<OverlappingInterdictionDto[]> = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [
        { code: 'INT001', description: 'Interdiction 1', accessClasses: ['ADMIN', 'USER'] },
        { code: 'INT002', description: 'Interdiction 2', accessClasses: ['VIEWER'] }
      ]
    };

    it('should call API with correct URL and GET method', () => {
      const userId = 'USER001';

      service.getOverlappingInterdictions(userId).subscribe();

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.OVERLAPPING_INTERDICTIONS(userId);
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockOverlappingResponse);
    });

    it('should return overlapping interdictions data', () => {
      const userId = 'USER001';

      service.getOverlappingInterdictions(userId).subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('INT001');
        expect(result[0].description).toBe('Interdiction 1');
        expect(result[0].accessClasses).toEqual(['ADMIN', 'USER']);
        expect(result[1].code).toBe('INT002');
        expect(result[1].accessClasses).toEqual(['VIEWER']);
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.OVERLAPPING_INTERDICTIONS(userId);
      const req = httpMock.expectOne(expectedUrl);
      req.flush(mockOverlappingResponse);
    });

    it('should return empty array when response data is null', () => {
      const userId = 'USER001';
      const nullDataResponse: ApiResponse<OverlappingInterdictionDto[]> = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: null as any
      };

      service.getOverlappingInterdictions(userId).subscribe(result => {
        expect(result).toEqual([]);
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.OVERLAPPING_INTERDICTIONS(userId);
      const req = httpMock.expectOne(expectedUrl);
      req.flush(nullDataResponse);
    });

    it('should return empty array when response data is undefined', () => {
      const userId = 'USER001';
      const undefinedDataResponse = {
        success: true,
        message: 'Success',
        statusCode: 200
      };

      service.getOverlappingInterdictions(userId).subscribe(result => {
        expect(result).toEqual([]);
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.OVERLAPPING_INTERDICTIONS(userId);
      const req = httpMock.expectOne(expectedUrl);
      req.flush(undefinedDataResponse);
    });

    it('should handle 404 error', () => {
      const userId = 'NONEXISTENT';

      service.getOverlappingInterdictions(userId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.OVERLAPPING_INTERDICTIONS(userId);
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle 500 server error', () => {
      const userId = 'USER001';

      service.getOverlappingInterdictions(userId).subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const expectedUrl = API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.OVERLAPPING_INTERDICTIONS(userId);
      const req = httpMock.expectOne(expectedUrl);
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getAccessLevelLimit', () => {
    it('should call API with correct URL and GET method', () => {
      service.getAccessLevelLimit().subscribe();

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      expect(req.request.method).toBe('GET');
      req.flush({ item: { Viewlimit: '10' } });
    });

    it('should parse Viewlimit (capital V) from response.item', () => {
      service.getAccessLevelLimit().subscribe(result => {
        expect(result).toBe(10);
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush({ item: { Viewlimit: '10' } });
    });

    it('should parse viewlimit (lowercase v) from response.item', () => {
      service.getAccessLevelLimit().subscribe(result => {
        expect(result).toBe(5);
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush({ item: { viewlimit: '5' } });
    });

    it('should parse viewlimit from response.data', () => {
      service.getAccessLevelLimit().subscribe(result => {
        expect(result).toBe(15);
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush({ data: { viewlimit: '15' } });
    });

    it('should prefer item.Viewlimit over item.viewlimit', () => {
      service.getAccessLevelLimit().subscribe(result => {
        expect(result).toBe(20);
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush({ item: { Viewlimit: '20', viewlimit: '30' } });
    });

    it('should prefer item.Viewlimit over data.viewlimit', () => {
      service.getAccessLevelLimit().subscribe(result => {
        expect(result).toBe(25);
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush({ item: { Viewlimit: '25' }, data: { viewlimit: '99' } });
    });

    it('should return 0 when no limit fields are present', () => {
      service.getAccessLevelLimit().subscribe(result => {
        expect(result).toBe(0);
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush({});
    });

    it('should return 0 for non-numeric limit string', () => {
      service.getAccessLevelLimit().subscribe(result => {
        expect(result).toBe(0);
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush({ item: { Viewlimit: 'abc' } });
    });

    it('should return 0 when limit is "0"', () => {
      service.getAccessLevelLimit().subscribe(result => {
        expect(result).toBe(0);
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush({ item: { Viewlimit: '0' } });
    });

    it('should handle 500 server error', () => {
      service.getAccessLevelLimit().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush('Internal Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle 401 unauthorized error', () => {
      service.getAccessLevelLimit().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.status).toBe(401);
        }
      });

      const req = httpMock.expectOne('/api/v1/donor-interdictions/view-limit');
      req.flush('Unauthorized', { status: 401, statusText: 'Unauthorized' });
    });
  });
});

describe('UserAccessService Integration Tests', () => {
  let service: UserAccessService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        UserAccessService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(UserAccessService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should handle multiple concurrent requests', () => {
    const response1: ApiResponse<DefineUserAccessListDto[]> = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [{ userId: 'USER001', userName: 'User 1', department: 'Dept 1', accessClass: 'CLASS1', description: 'Desc 1', level: 1, effectiveDate: '2024-01-01', terminationDate: '' }]
    };
    const response2: ApiResponse<DefineUserAccessListDto[]> = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [{ userId: 'USER002', userName: 'User 2', department: 'Dept 2', accessClass: 'CLASS2', description: 'Desc 2', level: 2, effectiveDate: '2024-02-01', terminationDate: '' }]
    };

    let result1: DefineUserAccessListDto[] = [];
    let result2: DefineUserAccessListDto[] = [];

    service.getUserAccessClasses('USER001').subscribe(data => result1 = data);
    service.getUserAccessClasses('USER002').subscribe(data => result2 = data);

    // Use function matcher to find requests by URL (ignoring query params)
    const requests = httpMock.match(request =>
      request.url === API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL
    );
    expect(requests.length).toBe(2);

    // Find and flush the correct request for each user
    const req1 = requests.find(r => r.request.params.get('userId') === 'USER001');
    const req2 = requests.find(r => r.request.params.get('userId') === 'USER002');

    expect(req1).toBeTruthy();
    expect(req2).toBeTruthy();

    req1!.flush(response1);
    req2!.flush(response2);

    expect(result1[0].userId).toBe('USER001');
    expect(result2[0].userId).toBe('USER002');
  });


  it('should handle response with special characters in userId', () => {
    const userId = 'USER@123';
    const response: ApiResponse<DefineUserAccessListDto[]> = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: []
    };

    service.getUserAccessClasses(userId).subscribe(result => {
      expect(result).toEqual([]);
    });

    const req = httpMock.expectOne(request =>
      request.params.get('userId') === 'USER@123'
    );
    req.flush(response);
  });

  it('should handle large response data', () => {
    const largeData: DefineUserAccessListDto[] = Array.from({ length: 100 }, (_, i) => ({
      userId: 'USER001',
      userName: 'John Doe',
      department: 'IT Department',
      accessClass: `CLASS_${i}`,
      description: `Description ${i}`,
      level: i,
      effectiveDate: '2024-01-01',
      terminationDate: ''
    }));

    const response: ApiResponse<DefineUserAccessListDto[]> = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: largeData
    };

    service.getUserAccessClasses('USER001').subscribe(result => {
      expect(result.length).toBe(100);
      expect(result[0].accessClass).toBe('CLASS_0');
      expect(result[99].accessClass).toBe('CLASS_99');
    });

    const req = httpMock.expectOne(
      `${API.SYSTEM_ADMIN.DEFINE_USER_ACCESS.GET_ALL}?userId=USER001&sortDir=ASC`
    );
    req.flush(response);
  });
});
