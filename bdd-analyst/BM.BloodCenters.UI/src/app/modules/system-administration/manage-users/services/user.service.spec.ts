import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UserApiService } from './user.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { of, throwError } from 'rxjs';

describe('UserApiService', () => {
  let service: UserApiService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserApiService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(UserApiService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getChapters', () => {
    it('should append chapterId query parameter when provided', (done) => {
      // Arrange
      const mockData = [{ chapterId: 'CH01', chapterName: 'Chapter 1' }];
      apiService.get.and.returnValue(of(mockData));

      // Act
      service.getChapters('CH01').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('chapterId=CH01')
          );
          done();
        }
      });
    });

    it('should use base endpoint when chapterId not provided', (done) => {
      // Arrange
      const mockData = [{ chapterId: 'CH01', chapterName: 'Chapter 1' }];
      apiService.get.and.returnValue(of(mockData));

      // Act
      service.getChapters().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.CHAPTER_LOOKUP
          );
          done();
        }
      });
    });

    it('should propagate error through catchError', (done) => {
      // Arrange
      apiService.get.and.returnValue(throwError(() => ({ status: 500 })));

      // Act
      service.getChapters().subscribe({
        error: (error) => {
          // Assert
          expect(error.status).toBe(500);
          done();
        }
      });
    });
  });

  describe('getWarehouses', () => {
    it('should append chapterId query parameter when provided', (done) => {
      // Arrange
      apiService.get.and.returnValue(of([]));

      // Act
      service.getWarehouses('CH01').subscribe({
        next: () => {
          // Assert
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('chapterId=CH01')
          );
          done();
        }
      });
    });

    it('should use base endpoint when chapterId not provided', (done) => {
      // Arrange
      apiService.get.and.returnValue(of([]));

      // Act
      service.getWarehouses().subscribe({
        next: () => {
          // Assert
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.WAREHOUSE_LOOKUP
          );
          done();
        }
      });
    });
  });

  describe('getLabCodes', () => {
    it('should append chapterId query parameter when provided', (done) => {
      // Arrange
      apiService.get.and.returnValue(of([]));

      // Act
      service.getLabCodes('CH01').subscribe({
        next: () => {
          // Assert
          expect(apiService.get).toHaveBeenCalledWith(
            jasmine.stringContaining('chapterId=CH01')
          );
          done();
        }
      });
    });

    it('should use base endpoint when chapterId not provided', (done) => {
      // Arrange
      apiService.get.and.returnValue(of([]));

      // Act
      service.getLabCodes().subscribe({
        next: () => {
          // Assert
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.LABCODE_LOOKUP
          );
          done();
        }
      });
    });
  });

  describe('getPrinterCodes', () => {
    it('should fetch printer codes successfully', (done) => {
      // Arrange
      const mockData = [{ printerCode: 'P1', printerDescription: 'Printer 1' }];
      apiService.get.and.returnValue(of(mockData));

      // Act
      service.getPrinterCodes().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.PRINTER_LOOKUP
          );
          done();
        }
      });
    });
  });

  describe('getGroups', () => {
    it('should fetch groups successfully', (done) => {
      // Arrange
      const mockData = [{ groupId: 'G1', groupName: 'Admin' }];
      apiService.get.and.returnValue(of(mockData));

      // Act
      service.getGroups().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.GROUP_LOOKUP
          );
          done();
        }
      });
    });
  });

  describe('getAccessLevels', () => {
    it('should fetch access levels successfully', (done) => {
      // Arrange
      const mockData = [{ accessLevel: 'ADMIN', description: 'Administrator' }];
      apiService.get.and.returnValue(of(mockData));

      // Act
      service.getAccessLevels().subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.ACCESS_LEVEL_LOOKUP
          );
          done();
        }
      });
    });
  });

  describe('createUser', () => {
    it('should return response when response.success is true', (done) => {
      // Arrange
      const request = { userId: 'user1' } as any;
      const mockResponse = { success: true, message: 'Created' };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createUser(request).subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockResponse as any);
          expect(apiService.post).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.ADD_NEW_USER.CREATEUSER,
            request
          );
          done();
        }
      });
    });

    it('should return response when response.isSuccess is true', (done) => {
      // Arrange
      const request = { userId: 'user1' } as any;
      const mockResponse = { success: false, isSuccess: true, message: 'Created' };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createUser(request).subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockResponse as any);
          done();
        }
      });
    });

    it('should throw when neither success nor isSuccess is true', (done) => {
      // Arrange
      const request = { userId: 'user1' } as any;
      const mockResponse = { success: false, isSuccess: false, message: 'Duplicate user' };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createUser(request).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Duplicate user');
          done();
        }
      });
    });

    it('should throw default message when failure has no message', (done) => {
      // Arrange
      const request = { userId: 'user1' } as any;
      const mockResponse = { success: false, isSuccess: false, message: '' };
      apiService.post.and.returnValue(of(mockResponse));

      // Act
      service.createUser(request).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Failed to create user');
          done();
        }
      });
    });
  });

  describe('getUser', () => {
    it('should fetch user details by ID', (done) => {
      // Arrange
      const mockData = { userId: 'user1', userName: 'Test User' };
      apiService.get.and.returnValue(of(mockData));

      // Act
      service.getUser('user1').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.GET_USER('user1')
          );
          done();
        }
      });
    });
  });

  describe('getUserGroupDetails', () => {
    it('should fetch user group details by ID', (done) => {
      // Arrange
      const mockData = { userId: 'user1', groups: [{ groupId: 'G1' }] };
      apiService.get.and.returnValue(of(mockData));

      // Act
      service.getUserGroupDetails('user1').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.GET_USER_GROUP('user1')
          );
          done();
        }
      });
    });
  });

  describe('getUserChapters', () => {
    it('should fetch user chapters by ID', (done) => {
      // Arrange
      const mockData = [{ chapterId: 'CH01', chapterName: 'Chapter 1' }];
      apiService.get.and.returnValue(of(mockData));

      // Act
      service.getUserChapters('user1').subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockData as any);
          expect(apiService.get).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.GET_USER_CHAPTERS('user1')
          );
          done();
        }
      });
    });
  });

  describe('updateUser', () => {
    it('should return response when update is successful', (done) => {
      // Arrange
      const request = { userName: 'Updated User' } as any;
      const mockResponse = { success: true, message: 'Updated' };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateUser('user1', request).subscribe({
        next: (result) => {
          // Assert
          expect(result).toEqual(mockResponse as any);
          expect(apiService.put).toHaveBeenCalledWith(
            API.SYSTEM_ADMIN.MANAGE_USERS.UPDATE_USER('user1'),
            request
          );
          done();
        }
      });
    });

    it('should throw when update response is not successful', (done) => {
      // Arrange
      const request = { userName: 'Updated User' } as any;
      const mockResponse = { success: false, isSuccess: false, message: 'Update failed' };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateUser('user1', request).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Update failed');
          done();
        }
      });
    });

    it('should throw default message when update fails without message', (done) => {
      // Arrange
      const request = { userName: 'Updated User' } as any;
      const mockResponse = { success: false, isSuccess: false, message: '' };
      apiService.put.and.returnValue(of(mockResponse));

      // Act
      service.updateUser('user1', request).subscribe({
        error: (error) => {
          // Assert
          expect(error.message).toBe('Failed to update user');
          done();
        }
      });
    });
  });

  describe('formatDateToISO', () => {
    it('should format Date to YYYY-MM-DD string', () => {
      // Arrange
      const date = new Date(2026, 3, 15); // April 15, 2026

      // Act
      const result = service.formatDateToISO(date);

      // Assert
      expect(result).toBe('2026-04-15');
    });

    it('should return undefined for null input', () => {
      // Act & Assert
      expect(service.formatDateToISO(null)).toBeUndefined();
    });

    it('should return undefined for undefined input', () => {
      // Act & Assert
      expect(service.formatDateToISO(undefined)).toBeUndefined();
    });
  });

  describe('parseDateToISO', () => {
    it('should parse DD-MMM-YYYY format to ISO', () => {
      // Act
      const result = service.parseDateToISO('15-APR-2026');

      // Assert
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });

    it('should return empty string for empty input', () => {
      // Act & Assert
      expect(service.parseDateToISO('')).toBe('');
    });

    it('should return original string when parsing fails', () => {
      // Act & Assert
      expect(service.parseDateToISO('not-a-date')).toBe('not-a-date');
    });
  });
});
