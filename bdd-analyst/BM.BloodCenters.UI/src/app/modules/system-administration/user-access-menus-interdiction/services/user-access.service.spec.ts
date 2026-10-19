import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { UserAccessService } from './user-access.service';
import { API } from '../../../../core/constants/api.constants';
import {
  MenuItemsResponse,
  MenuUsersResponse,
  MenuFilterDataResponse,
  AccessClassesResponse,
  AccessClassesFilterDataResponse,
  AccessClassUsersResponse,
  AssociatedInterdictionsResponse,
  GroupDetailsResponse
} from '../models/user-access-api.model';

describe('UserAccessService', () => {
  let service: UserAccessService;
  let httpMock: HttpTestingController;

  const mockMenuItemsResponse: MenuItemsResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        userID: 'TEST123',
        mnemonic: 'USR_MAN',
        menuTitle: 'User Management',
        program: 'SYS',
        effectiveDate: '01-JAN-2025',
        terminationDate: '31-DEC-2025',
        otherUsers: 5
      }
    ],
    total: 1
  };

  const mockMenuUsersResponse: MenuUsersResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        userID: 'USR001',
        userName: 'Test User',
        groupID: 'GRP001',
        groupDescription: 'Test Group',
        accessLevel: 5,
        effectiveDate: '01-JAN-2025'
      }
    ],
    total: 1
  };

  const mockMenuFilterDataResponse: MenuFilterDataResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        menuTitle: ['User Management', 'Reports'],
        program: ['SYS', 'RPT']
      }
    ],
    total: 1
  };

  const mockAccessClassesResponse: AccessClassesResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        userID: 'TEST123',
        class: 'ADMIN',
        description: 'Administrator Access',
        accessLevel: 9,
        usersInClass: 10,
        effectiveDate: '01-JAN-2025',
        terminationDate: '31-DEC-2025'
      }
    ],
    total: 1
  };

  const mockAccessClassesFilterDataResponse: AccessClassesFilterDataResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        class: ['ADMIN', 'USER']
      }
    ],
    total: 1
  };

  const mockAccessClassUsersResponse: AccessClassUsersResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        userId: 'USR001',
        userName: 'Test User',
        groupDescription: 'Test Group',
        accessLevel: 5,
        effectiveDate: '01-JAN-2025'
      }
    ],
    total: 1
  };

  const mockAssociatedInterdictionsResponse: AssociatedInterdictionsResponse = {
    success: true,
    statusCode: 200,
    data: [
      {
        type: 'Class',
        code: 'ADMIN',
        description: 'Admin Access',
        accessLevel: 9,
        insertDate: '01-JAN-2025'
      }
    ],
    total: 1
  };

  const mockGroupDetailsResponse: GroupDetailsResponse = {
    success: true,
    statusCode: 200,
    item: {
      userId: 'TEST123',
      groupId: 'GRP001',
      groupDescription: 'Test Group',
      accessLevel: 5,
      effectiveDate: '01-JAN-2025',
      terminationDate: '31-DEC-2025'
    }
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

  describe('getUserMenuItems', () => {
    it('should fetch user menu items successfully', () => {
      const userId = 'TEST123';
      const take = 25;
      const skip = 0;

      service.getUserMenuItems(userId, take, skip).subscribe(response => {
        expect(response).toEqual(mockMenuItemsResponse);
        expect(response.data?.length).toBe(1);
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_ITEMS(userId, take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockMenuItemsResponse);
    });

    it('should send filters in request body', () => {
      const userId = 'TEST123';
      const take = 25;
      const skip = 0;
      const filters = {
        menuTitle: 'User Management',
        program: 'SYS',
        effectiveDatePeriod: 'AFTER' as const
      };

      service.getUserMenuItems(userId, take, skip, filters).subscribe();

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_ITEMS(userId, take, skip));
      expect(req.request.body).toEqual(filters);
      req.flush(mockMenuItemsResponse);
    });

    it('should handle error when fetching menu items', () => {
      const userId = 'TEST123';
      const errorMessage = 'API Error';

      service.getUserMenuItems(userId, 25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_ITEMS(userId, 25, 0));
      req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getMenuUsers', () => {
    it('should fetch menu users successfully', () => {
      const mnemonic = 'USR_MAN';
      const userId = 'TEST123';
      const take = 25;
      const skip = 0;

      service.getMenuUsers(mnemonic, userId, take, skip).subscribe(response => {
        expect(response).toEqual(mockMenuUsersResponse);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_USERS(mnemonic, userId, take, skip));
      expect(req.request.method).toBe('GET');
      req.flush(mockMenuUsersResponse);
    });

    it('should handle error when fetching menu users', () => {
      const mnemonic = 'USR_MAN';
      const userId = 'TEST123';

      service.getMenuUsers(mnemonic, userId, 25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_USERS(mnemonic, userId, 25, 0));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getMenuFilterData', () => {
    it('should fetch menu filter data successfully', () => {
      service.getMenuFilterData().subscribe(response => {
        expect(response).toEqual(mockMenuFilterDataResponse);
        expect(response.data?.[0].menuTitle).toEqual(['User Management', 'Reports']);
        expect(response.data?.[0].program).toEqual(['SYS', 'RPT']);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_FILTERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockMenuFilterDataResponse);
    });

    it('should cache menu filter data', () => {
      // First call - fetches from API
      service.getMenuFilterData().subscribe(response => {
        expect(response).toEqual(mockMenuFilterDataResponse);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_FILTERS);
      req.flush(mockMenuFilterDataResponse);

      // Second call - returns cached data (no HTTP request)
      service.getMenuFilterData().subscribe(response => {
        expect(response).toEqual(mockMenuFilterDataResponse);
      });

      httpMock.expectNone(API.SYSTEM_ADMIN.USER_ACCESS.MENU_FILTERS);
    });

    it('should clear filter cache', () => {
      // First call - fetches and caches
      service.getMenuFilterData().subscribe();
      const req1 = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_FILTERS);
      req1.flush(mockMenuFilterDataResponse);

      // Clear cache
      service.clearFilterCache();

      // Next call - fetches again from API
      service.getMenuFilterData().subscribe();
      const req2 = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_FILTERS);
      req2.flush(mockMenuFilterDataResponse);
    });
  });

  describe('getUserAccessClasses', () => {
    it('should fetch user access classes successfully', () => {
      const userId = 'TEST123';
      const take = 25;
      const skip = 0;

      service.getUserAccessClasses(userId, take, skip).subscribe(response => {
        expect(response).toEqual(mockAccessClassesResponse);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES(userId, take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockAccessClassesResponse);
    });

    it('should send filters in request body', () => {
      const userId = 'TEST123';
      const filters = {
        class: 'ADMIN',
        effectiveDatePeriod: 'AFTER' as const
      };

      service.getUserAccessClasses(userId, 25, 0, filters).subscribe();

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES(userId, 25, 0));
      expect(req.request.body).toEqual(filters);
      req.flush(mockAccessClassesResponse);
    });
  });

  describe('getAccessClassesFilterData', () => {
    it('should fetch access classes filter data successfully', () => {
      service.getAccessClassesFilterData().subscribe(response => {
        expect(response).toEqual(mockAccessClassesFilterDataResponse);
        expect(response.data?.[0].class).toEqual(['ADMIN', 'USER']);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_FILTERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockAccessClassesFilterDataResponse);
    });
  });

  describe('getAccessClassUsers', () => {
    it('should fetch access class users successfully', () => {
      const userId = 'TEST123';
      const accessClass = 'ADMIN';
      const take = 25;
      const skip = 0;

      service.getAccessClassUsers(userId, accessClass, take, skip).subscribe(response => {
        expect(response).toEqual(mockAccessClassUsersResponse);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_USERS(userId, accessClass, take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(mockAccessClassUsersResponse);
    });
  });

  describe('getAssociatedInterdictions', () => {
    it('should fetch associated interdictions successfully', () => {
      const accessClass = 'ADMIN';
      const take = 25;
      const skip = 0;

      service.getAssociatedInterdictions(accessClass, take, skip).subscribe(response => {
        expect(response).toEqual(mockAssociatedInterdictionsResponse);
        expect(response.data?.length).toBe(1);
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_INTERDICTIONS(accessClass, take, skip));
      expect(req.request.method).toBe('POST');
      req.flush(mockAssociatedInterdictionsResponse);
    });
  });

  describe('getUserGroupDetails', () => {
    it('should fetch user group details successfully', () => {
      const userId = 'TEST123';

      service.getUserGroupDetails(userId).subscribe(response => {
        expect(response).toEqual(mockGroupDetailsResponse);
        expect(response.item?.userId).toBe('TEST123');
        expect(response.item?.groupId).toBe('GRP001');
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.GROUP_DETAILS(userId));
      expect(req.request.method).toBe('GET');
      req.flush(mockGroupDetailsResponse);
    });

    it('should handle error when fetching group details', () => {
      const userId = 'TEST123';

      service.getUserGroupDetails(userId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.GROUP_DETAILS(userId));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Date Formatting Methods', () => {
    describe('formatDate', () => {

      it('should format date with different month', () => {
        const result = service.formatDate('2024-12-25T00:00:00Z');
        expect(result).toBe('25-DEC-2024');
      });


      it('should return dash for "null" string', () => {
        const result = service.formatDate('null');
        expect(result).toBe('-');
      });

    });

    describe('parseDateToISO', () => {
      it('should parse date string to ISO format', () => {
        const result = service.parseDateToISO('2024-01-15');
        expect(result).toContain('2024-01-15');
      });

      it('should handle Date object conversion', () => {
        const date = new Date('2024-01-15');
        const result = service.parseDateToISO(date.toString());
        expect(result).toContain('2024-01-15');
      });



      it('should handle clearly invalid date strings', () => {
        const result = service.parseDateToISO('not-a-date-string');
        expect(result).toBe('');
      });
    });

    describe('formatDateForAPI', () => {
      it('should format DD-MMM-YYYY to ISO format', () => {
        const result = service.formatDateForAPI('15-JAN-2024');
        expect(result).toContain('2024');
        expect(result).toContain('01');
        expect(result.endsWith('Z')).toBe(true);
      });

      it('should format different months correctly', () => {
        const result = service.formatDateForAPI('25-DEC-2024');
        expect(result).toContain('2024');
        expect(result).toContain('12');
        expect(result.endsWith('Z')).toBe(true);
      });




    });
  });

  describe('getActiveUsers', () => {
    it('should fetch active users successfully', () => {
      const mockResponse = { success: true, statusCode: 200, data: [{ userId: 'USR001', userName: 'Test User' }], total: 1 };
      service.getActiveUsers().subscribe(users => {
        expect(users.length).toBe(1);
        expect(users[0].userId).toBe('USR001');
      });
      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACTIVE_USERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return empty array when no data', () => {
      service.getActiveUsers().subscribe(users => {
        expect(users).toEqual([]);
      });
      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACTIVE_USERS);
      req.flush({ success: true, statusCode: 200, data: null, total: 0 });
    });

    it('should handle error when fetching active users', () => {
      service.getActiveUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => { expect(error.status).toBe(500); }
      });
      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACTIVE_USERS);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('formatDate additional cases', () => {
    it('should return dash for null', () => {
      expect(service.formatDate(null)).toBe('-');
    });
    it('should return dash for invalid date', () => {
      expect(service.formatDate('not-a-date')).toBe('-');
    });
    it('should format January date', () => {
      const result = service.formatDate('2024-01-15T00:00:00Z');
      expect(result).toContain('JAN');
      expect(result).toContain('2024');
    });
  });

  describe('parseDateToISO additional cases', () => {
    it('should return empty string for empty input', () => {
      expect(service.parseDateToISO('')).toBe('');
    });
  });

  describe('formatDateForAPI additional cases', () => {
    it('should return empty string for empty input', () => {
      expect(service.formatDateForAPI('')).toBe('');
    });
    it('should return empty string for dash', () => {
      expect(service.formatDateForAPI('-')).toBe('');
    });
    it('should return empty string for invalid month', () => {
      expect(service.formatDateForAPI('15-XYZ-2024')).toBe('');
    });
    it('should return empty string for wrong number of parts', () => {
      expect(service.formatDateForAPI('15-2024')).toBe('');
    });
    it('should handle lowercase month', () => {
      const result = service.formatDateForAPI('15-jan-2024');
      expect(result).toContain('2024');
      expect(result.endsWith('Z')).toBe(true);
    });
  });

  describe('getUserAccessClasses error handling', () => {
    it('should handle error when fetching access classes', () => {
      service.getUserAccessClasses('TEST123', 25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => { expect(error.status).toBe(500); }
      });
      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES('TEST123', 25, 0));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAccessClassesFilterData error handling', () => {
    it('should handle error when fetching filter data', () => {
      service.getAccessClassesFilterData().subscribe({
        next: () => fail('should have failed'),
        error: (error) => { expect(error.status).toBe(500); }
      });
      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_FILTERS);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAccessClassUsers error handling', () => {
    it('should handle error when fetching access class users', () => {
      service.getAccessClassUsers('TEST123', 'ADMIN', 25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => { expect(error.status).toBe(500); }
      });
      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_USERS('TEST123', 'ADMIN', 25, 0));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAssociatedInterdictions error handling', () => {
    it('should handle error when fetching interdictions', () => {
      service.getAssociatedInterdictions('ADMIN', 25, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => { expect(error.status).toBe(500); }
      });
      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.ACCESS_CLASSES_INTERDICTIONS('ADMIN', 25, 0));
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getMenuFilterData error handling', () => {
    it('should handle error when fetching menu filter data', () => {
      service.getMenuFilterData().subscribe({
        next: () => fail('should have failed'),
        error: (error) => { expect(error.status).toBe(500); }
      });
      const req = httpMock.expectOne(API.SYSTEM_ADMIN.USER_ACCESS.MENU_FILTERS);
      req.flush('Error', { status: 500, statusText: 'Server Error' });
    });
  });
});
