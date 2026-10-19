import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { GroupService } from './group.service';
import { Group } from '../models/group.model';
import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

describe('GroupService', () => {
  let service: GroupService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockGroups: Group[] = [
    {
      applId: 'APP1',
      groupId: 'GRP01',
      description: 'Blood Center Admin Group',
      userCount: 5,
    },
    {
      applId: 'APP2',
      groupId: 'GRP02',
      description: 'System Admin Group',
      userCount: 3,
    },
    {
      applId: 'APP1',
      groupId: 'GRP03',
      description: 'Laboratory Staff',
      userCount: 12,
    }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GroupService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(GroupService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getGroups', () => {
    it('should call ApiService.get with correct endpoint', (done) => {
      // Arrange
      apiService.get.and.returnValue(of(mockGroups));

      // Act
      service.getGroups().subscribe(() => {
        // Assert
        expect(apiService.get).toHaveBeenCalledWith(API.SYSTEM_ADMIN.GROUPS);
        done();
      });
    });

    it('should return an array of groups', (done) => {
      // Arrange
      apiService.get.and.returnValue(of(mockGroups));

      // Act
      service.getGroups().subscribe({
        next: (groups) => {
          // Assert
          expect(groups).toEqual(mockGroups);
          expect(groups.length).toBe(3);
          done();
        }
      });
    });

    it('should return groups with all required properties', (done) => {
      // Arrange
      apiService.get.and.returnValue(of(mockGroups));

      // Act
      service.getGroups().subscribe({
        next: (groups) => {
          // Assert
          const firstGroup = groups[0];
          expect(firstGroup.applId).toBeDefined();
          expect(firstGroup.groupId).toBeDefined();
          expect(firstGroup.description).toBeDefined();
          expect(firstGroup.userCount).toBeDefined();
          done();
        }
      });
    });




    it('should use correct endpoint constant', () => {
      // Arrange
      apiService.get.and.returnValue(of([]));

      // Act
      service.getGroups().subscribe();

      // Assert
      expect(apiService.get).toHaveBeenCalledWith(API.SYSTEM_ADMIN.GROUPS);
    });
  });
});
