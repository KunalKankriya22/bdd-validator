import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpParams } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { AccessClassByInterCodeService } from './access-class-by-inter-code.service';
import {
  AccessClass,
  AccessClassSearchParams,
  AccessClassResponse,
  AccessClassUsersResponse,
  AccessClassInterdictionsResponse,
  AccessClassUser,
  AccessClassInterdiction
} from '../models/access-class-by-inter-code.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('AccessClassByInterCodeService', () => {
  let service: AccessClassByInterCodeService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockAccessClasses: AccessClass[] = [
    {
      class: 'AC01',
      description: 'Access Class 01',
      insUser: 'user1',
      insDate: '2026-01-10'
    },
    {
      class: 'AC02',
      description: 'Access Class 02',
      insUser: 'user2',
      insDate: '2026-01-11'
    }
  ];

  const mockAccessClassResponse: AccessClassResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: mockAccessClasses,
    total: 2
  };

  const mockUsers: AccessClassUser[] = [
    {
      userId: 'USER001',
      name: 'John Doe',
      level: 'Level 1'
    },
    {
      userId: 'USER002',
      name: 'Jane Smith',
      level: 'Level 2'
    }
  ];

  const mockUsersResponse: AccessClassUsersResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: mockUsers
  };

  const mockInterdictions: AccessClassInterdiction[] = [
    {
      accessClass: 'AC01',
      accessClassDescription: 'Access Class 01',
      code: 'INT001',
      type: 'Type 1',
      description: 'Interdiction 001',
      level: 'Level 1',
      insertDate: '2026-01-10'
    },
    {
      accessClass: 'AC01',
      accessClassDescription: 'Access Class 01',
      code: 'INT002',
      type: 'Type 2',
      description: 'Interdiction 002',
      level: 'Level 2',
      insertDate: '2026-01-11'
    }
  ];

  const mockInterdictionsResponse: AccessClassInterdictionsResponse = {
    success: true,
    message: 'Success',
    statusCode: 200,
    data: mockInterdictions
  };

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AccessClassByInterCodeService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(AccessClassByInterCodeService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getAccessClassesByInterCode', () => {
    it('should call ApiService.get with correct endpoint', (done) => {
      // Arrange
      const params: AccessClassSearchParams = {
        interCode: 'INT001',
        sortOrder: 'ASC'
      };
      apiService.get.and.returnValue(of(mockAccessClassResponse));

      // Act
      service.getAccessClassesByInterCode(params).subscribe(() => {
        // Assert
        expect(apiService.get).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.ACCESS_CLASS_BY_INTER_CODE,
          jasmine.objectContaining({ params: jasmine.any(HttpParams) })
        );
        done();
      });
    });

    it('should return mapped data with totalRecords', (done) => {
      // Arrange
      const params: AccessClassSearchParams = {
        interCode: 'INT001',
        sortOrder: 'ASC'
      };
      apiService.get.and.returnValue(of(mockAccessClassResponse));

      // Act
      service.getAccessClassesByInterCode(params).subscribe({
        next: (result) => {
          // Assert
          expect(result.data).toEqual(mockAccessClasses);
          expect(result.totalRecords).toBe(2);
          done();
        }
      });
    });


    it('should include interCode in HttpParams when provided', (done) => {
      // Arrange
      const params: AccessClassSearchParams = {
        interCode: 'INT001',
        sortOrder: 'ASC'
      };
      apiService.get.and.returnValue(of(mockAccessClassResponse));

      // Act
      service.getAccessClassesByInterCode(params).subscribe(() => {
        // Assert
        const callArgs = apiService.get.calls.mostRecent().args;
        const httpParams = callArgs[1]?.params as HttpParams;
        expect(httpParams.get('interCode')).toBe('INT001');
        done();
      });
    });

    it('should include sortDir in HttpParams when sortOrder is provided', (done) => {
      // Arrange
      const params: AccessClassSearchParams = {
        interCode: 'INT001',
        sortOrder: 'DESC'
      };
      apiService.get.and.returnValue(of(mockAccessClassResponse));

      // Act
      service.getAccessClassesByInterCode(params).subscribe(() => {
        // Assert
        const callArgs = apiService.get.calls.mostRecent().args;
        const httpParams = callArgs[1]?.params as HttpParams;
        expect(httpParams.get('sortDir')).toBe('DESC');
        done();
      });
    });


  });

  describe('getAttachedUsers', () => {
    it('should call ApiService.get with correct endpoint', (done) => {
      // Arrange
      const accessClass = 'AC01';
      apiService.get.and.returnValue(of(mockUsersResponse));

      // Act
      service.getAttachedUsers(accessClass).subscribe(() => {
        // Assert
        expect(apiService.get).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.ACCESS_CLASS_BY_INTER_CODE_USERS(accessClass),
          jasmine.objectContaining({ params: jasmine.any(HttpParams) })
        );
        done();
      });
    });

    it('should return users response', (done) => {
      // Arrange
      const accessClass = 'AC01';
      apiService.get.and.returnValue(of(mockUsersResponse));

      // Act
      service.getAttachedUsers(accessClass).subscribe({
        next: (response) => {
          // Assert
          expect(response).toEqual(mockUsersResponse);
          expect(response.data.length).toBe(2);
          done();
        }
      });
    });

    it('should use ASC as default sortDir', (done) => {
      // Arrange
      const accessClass = 'AC01';
      apiService.get.and.returnValue(of(mockUsersResponse));

      // Act
      service.getAttachedUsers(accessClass).subscribe(() => {
        // Assert
        const callArgs = apiService.get.calls.mostRecent().args;
        const httpParams = callArgs[1]?.params as HttpParams;
        expect(httpParams.get('sortDir')).toBe('ASC');
        done();
      });
    });

    it('should use provided sortDir parameter', (done) => {
      // Arrange
      const accessClass = 'AC01';
      const sortDir = 'DESC';
      apiService.get.and.returnValue(of(mockUsersResponse));

      // Act
      service.getAttachedUsers(accessClass, sortDir).subscribe(() => {
        // Assert
        const callArgs = apiService.get.calls.mostRecent().args;
        const httpParams = callArgs[1]?.params as HttpParams;
        expect(httpParams.get('sortDir')).toBe('DESC');
        done();
      });
    });


  });

  describe('getInterdictions', () => {
    it('should call ApiService.get with correct endpoint', (done) => {
      // Arrange
      const accessClass = 'AC01';
      apiService.get.and.returnValue(of(mockInterdictionsResponse));

      // Act
      service.getInterdictions(accessClass).subscribe(() => {
        // Assert
        expect(apiService.get).toHaveBeenCalledWith(
          API.SYSTEM_ADMIN.ACCESS_CLASS_BY_INTER_CODE_INTERDICTIONS(accessClass),
          jasmine.objectContaining({ params: jasmine.any(HttpParams) })
        );
        done();
      });
    });

    it('should return interdictions response', (done) => {
      // Arrange
      const accessClass = 'AC01';
      apiService.get.and.returnValue(of(mockInterdictionsResponse));

      // Act
      service.getInterdictions(accessClass).subscribe({
        next: (response) => {
          // Assert
          expect(response).toEqual(mockInterdictionsResponse);
          expect(response.data.length).toBe(2);
          done();
        }
      });
    });

    it('should use ASC as default sortDir', (done) => {
      // Arrange
      const accessClass = 'AC01';
      apiService.get.and.returnValue(of(mockInterdictionsResponse));

      // Act
      service.getInterdictions(accessClass).subscribe(() => {
        // Assert
        const callArgs = apiService.get.calls.mostRecent().args;
        const httpParams = callArgs[1]?.params as HttpParams;
        expect(httpParams.get('sortDir')).toBe('ASC');
        done();
      });
    });

    it('should use provided sortDir parameter', (done) => {
      // Arrange
      const accessClass = 'AC01';
      const sortDir = 'DESC';
      apiService.get.and.returnValue(of(mockInterdictionsResponse));

      // Act
      service.getInterdictions(accessClass, sortDir).subscribe(() => {
        // Assert
        const callArgs = apiService.get.calls.mostRecent().args;
        const httpParams = callArgs[1]?.params as HttpParams;
        expect(httpParams.get('sortDir')).toBe('DESC');
        done();
      });
    });


  });
});
