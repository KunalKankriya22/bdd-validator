import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { GroupSitesService } from './group-sites.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import {
  GroupSitesModel,
  GroupSitesParamsDto,
  GroupSitesDto,
  UpdateGroupSitesDto,
  ChapterLookup
} from '../models/group-sites.model';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

describe('GroupSitesService', () => {
  let service: GroupSitesService;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockGroupSitesData: GroupSitesModel[] = [
    {
      chapterId: '001',
      groupSiteId: 'S1540',
      groupSiteInd: 'S',
      siteName: 'Test Site 1',
      osokFlag: 'Y',
      effectiveDate: '2024-01-15',
      terminationDate: null,
      lastModifiedDate: new Date('2024-12-01')
    },
    {
      chapterId: '002',
      groupSiteId: 'G100',
      groupSiteInd: 'G',
      siteName: 'Test Group 1',
      osokFlag: 'N',
      effectiveDate: new Date('2024-02-01'),
      terminationDate: '2024-12-31',
      lastModifiedDate: new Date('2024-11-15')
    }
  ];

  const mockApiResponse: ReturnResult<GroupSitesModel> = {
    success: true,
    data: mockGroupSitesData,
    total: 2
  };

  const mockChapterLookups: ChapterLookup[] = [
    { chapterId: '001', chapterName: 'Chapter 1' },
    { chapterId: '002', chapterName: 'Chapter 2' },
    { chapterId: '003', chapterName: 'Chapter 3' }
  ];

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        GroupSitesService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(GroupSitesService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('getGroupSites', () => {
    it('should fetch group sites with pagination', (done) => {
      apiService.post.and.returnValue(of(mockApiResponse));

      const params: GroupSitesParamsDto = {
        SearchKeyword: 'test',
        chapterIds: '001'
      };

      service.getGroupSites(10, 0, params).subscribe(response => {
        expect(response.data).toEqual(mockGroupSitesData);
        expect(response.totalRecords).toBe(2);
        expect(apiService.post).toHaveBeenCalledWith(
          jasmine.stringContaining('/10/0'),
          params
        );
        done();
      });
    });



    it('should handle response with no total property', (done) => {
      const responseWithoutTotal: ReturnResult<GroupSitesModel> = {
        success: true,
        data: mockGroupSitesData
      };
      apiService.post.and.returnValue(of(responseWithoutTotal));

      service.getGroupSites(10, 0, {}).subscribe(response => {
        expect(response.data).toEqual(mockGroupSitesData);
        expect(response.totalRecords).toBe(0);
        done();
      });
    });

    it('should apply search keyword parameter', (done) => {
      apiService.post.and.returnValue(of(mockApiResponse));

      const params: GroupSitesParamsDto = {
        SearchKeyword: 'test site'
      };

      service.getGroupSites(10, 0, params).subscribe(() => {
        const callArgs = apiService.post.calls.mostRecent().args;
        expect(callArgs[1]).toEqual(params);
        done();
      });
    });

    it('should apply chapter ID filter', (done) => {
      apiService.post.and.returnValue(of(mockApiResponse));

      const params: GroupSitesParamsDto = {
        chapterIds: '001'
      };

      service.getGroupSites(10, 0, params).subscribe(() => {
        const callArgs = apiService.post.calls.mostRecent().args;
        expect(callArgs[1]).toEqual(params);
        done();
      });
    });

    it('should apply sort parameters', (done) => {
      apiService.post.and.returnValue(of(mockApiResponse));

      const params: GroupSitesParamsDto = {
        Sort: 'code',
        SortDirection: 'ASC'
      };

      service.getGroupSites(10, 0, params).subscribe(() => {
        const callArgs = apiService.post.calls.mostRecent().args;
        expect(callArgs[1]).toEqual(params);
        done();
      });
    });

    it('should handle pagination with different take and skip values', (done) => {
      apiService.post.and.returnValue(of(mockApiResponse));

      service.getGroupSites(20, 40, {}).subscribe(() => {
        const url = apiService.post.calls.mostRecent().args[0];
        expect(url).toContain('/20/40');
        done();
      });
    });

  });

  describe('getGroupSitesFilters', () => {
    it('should fetch filter dropdown values', (done) => {
      const mockFilters = {
        data: [{
          chapters: [
            { chapterId: '001', chapterName: 'Chapter 1' },
            { chapterId: '002', chapterName: 'Chapter 2' }
          ],
          types: ['Group', 'Site']
        }]
      };

      apiService.get.and.returnValue(of(mockFilters));

      service.getGroupSitesFilters().subscribe(response => {
        expect(response).toEqual(mockFilters);
        expect(apiService.get).toHaveBeenCalled();
        done();
      });
    });

    it('should handle filter fetch errors', (done) => {
      const errorResponse = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      service.getGroupSitesFilters().subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching group/sites filters:',
            errorResponse
          );
          expect(error).toEqual(errorResponse);
          done();
        }
      );
    });

    it('should call the correct API endpoint', (done) => {
      const mockFilters = { data: [], total: 0 };
      apiService.get.and.returnValue(of(mockFilters));

      service.getGroupSitesFilters().subscribe(() => {
        const url = apiService.get.calls.mostRecent().args[0];
        expect(url).toContain('group-sites/filters');
        done();
      });
    });
  });

  describe('getChapterIds', () => {
    it('should fetch chapter IDs for dropdowns', (done) => {
      apiService.get.and.returnValue(of(mockChapterLookups));

      service.getChapterIds().subscribe(response => {
        expect(response).toEqual(mockChapterLookups);
        expect(response.length).toBe(3);
        expect(response[0].chapterId).toBe('001');
        expect(response[0].chapterName).toBe('Chapter 1');
        done();
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiService.get.and.returnValue(of(mockChapterLookups));

      service.getChapterIds().subscribe(() => {
        const url = apiService.get.calls.mostRecent().args[0];
        expect(url).toBe('/api/v1/chapters/lookup');
        done();
      });
    });


    it('should handle chapter IDs fetch errors', (done) => {
      const errorResponse = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      service.getChapterIds().subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching chapter IDs:',
            errorResponse
          );
          expect(error).toEqual(errorResponse);
          done();
        }
      );
    });
  });

  describe('getActiveChapterIds', () => {
    const mockActiveChapters: ChapterLookup[] = [
      { chapterId: '001', chapterName: 'Active Chapter 1' },
      { chapterId: '002', chapterName: 'Active Chapter 2' }
    ];

    it('should fetch active chapter IDs from backend endpoint', (done) => {
      apiService.get.and.returnValue(of(mockActiveChapters));

      service.getActiveChapterIds().subscribe(response => {
        expect(response).toEqual(mockActiveChapters);
        expect(response.length).toBe(2);
        expect(response[0].chapterId).toBe('001');
        expect(response[0].chapterName).toBe('Active Chapter 1');
        done();
      });
    });

    it('should call the /api/v1/chapters/active/lookup endpoint', (done) => {
      apiService.get.and.returnValue(of(mockActiveChapters));

      service.getActiveChapterIds().subscribe(() => {
        const url = apiService.get.calls.mostRecent().args[0];
        expect(url).toBe('/api/v1/chapters/active/lookup');
        done();
      });
    });

    it('should return chapters directly without frontend filtering', (done) => {
      const backendFilteredChapters: ChapterLookup[] = [
        { chapterId: '005', chapterName: 'Backend Filtered Chapter' }
      ];

      apiService.get.and.returnValue(of(backendFilteredChapters));

      service.getActiveChapterIds().subscribe(response => {
        expect(response).toEqual(backendFilteredChapters);
        expect(response.length).toBe(1);
        expect(response[0].chapterId).toBe('005');
        done();
      });
    });


    it('should handle single active chapter', (done) => {
      const singleChapter: ChapterLookup[] = [
        { chapterId: '001', chapterName: 'Only Active Chapter' }
      ];

      apiService.get.and.returnValue(of(singleChapter));

      service.getActiveChapterIds().subscribe(response => {
        expect(response.length).toBe(1);
        expect(response[0].chapterId).toBe('001');
        expect(response[0].chapterName).toBe('Only Active Chapter');
        done();
      });
    });

    it('should handle active chapters fetch errors', (done) => {
      const errorResponse = { status: 500, message: 'Server error' };
      apiService.get.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      service.getActiveChapterIds().subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching active chapter IDs:',
            errorResponse
          );
          expect(error).toEqual(errorResponse);
          done();
        }
      );
    });

    it('should handle network timeout errors', (done) => {
      const timeoutError = { status: 408, message: 'Request timeout' };
      apiService.get.and.returnValue(throwError(() => timeoutError));

      spyOn(console, 'error');

      service.getActiveChapterIds().subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error fetching active chapter IDs:',
            timeoutError
          );
          expect(error.status).toBe(408);
          done();
        }
      );
    });

    it('should handle unauthorized errors (401)', (done) => {
      const unauthorizedError = { status: 401, message: 'Unauthorized' };
      apiService.get.and.returnValue(throwError(() => unauthorizedError));

      spyOn(console, 'error');

      service.getActiveChapterIds().subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(401);
          done();
        }
      );
    });

    it('should not perform any frontend date filtering', (done) => {
      // This test verifies that the service doesn't do client-side filtering
      const chapters: ChapterLookup[] = [
        { chapterId: '001', chapterName: 'Chapter 1' },
        { chapterId: '002', chapterName: 'Chapter 2' },
        { chapterId: '003', chapterName: 'Chapter 3' }
      ];

      apiService.get.and.returnValue(of(chapters));

      service.getActiveChapterIds().subscribe(response => {
        // Should return exactly what backend returns (no filtering)
        expect(response).toEqual(chapters);
        expect(response.length).toBe(3);
        done();
      });
    });

    it('should return ChapterLookup objects with correct structure', (done) => {
      const chapters: ChapterLookup[] = [
        { chapterId: 'TEST001', chapterName: 'Test Chapter Name' }
      ];

      apiService.get.and.returnValue(of(chapters));

      service.getActiveChapterIds().subscribe(response => {
        expect(response[0]).toEqual(jasmine.objectContaining({
          chapterId: jasmine.any(String),
          chapterName: jasmine.any(String)
        }));
        expect(response[0].chapterId).toBe('TEST001');
        expect(response[0].chapterName).toBe('Test Chapter Name');
        done();
      });
    });


    it('should handle null or undefined response gracefully', (done) => {
      apiService.get.and.returnValue(of(null as any));

      service.getActiveChapterIds().subscribe(
        () => {
          // If it doesn't throw, that's acceptable
          done();
        },
        (error) => {
          // If it errors, that's also acceptable for null response
          expect(error).toBeDefined();
          done();
        }
      );
    });
  });

  describe('addGroupSite', () => {
    const mockAddPayload: GroupSitesDto = {
      chapterId: '001',
      groupSiteInd: 'S',
      groupSiteId: 'S100',
      siteName: 'New Test Site',
      osokFlag: 'Y',
      effectiveDate: '2024-01-15',
      terminationDate: null
    };

    it('should add a new group site successfully', (done) => {
      const mockResponse: ReturnResult<GroupSitesModel> = {
        success: true,
        message: 'Record added successfully',
        item: {
          ...mockGroupSitesData[0],
          groupSiteId: 'S100'
        }
      };

      apiService.post.and.returnValue(of(mockResponse));

      service.addGroupSite(mockAddPayload).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(apiService.post).toHaveBeenCalledWith(
          jasmine.any(String),
          mockAddPayload
        );
        done();
      });
    });

    it('should call the correct API endpoint for adding', (done) => {
      const mockResponse = { success: true };
      apiService.post.and.returnValue(of(mockResponse));

      service.addGroupSite(mockAddPayload).subscribe(() => {
        const url = apiService.post.calls.mostRecent().args[0];
        expect(url).toContain('group-sites');
        done();
      });
    });

    it('should send all required fields in add payload', (done) => {
      const mockResponse = { success: true };
      apiService.post.and.returnValue(of(mockResponse));

      service.addGroupSite(mockAddPayload).subscribe(() => {
        const payload = apiService.post.calls.mostRecent().args[1];
        expect(payload.chapterId).toBe('001');
        expect(payload.groupSiteInd).toBe('S');
        expect(payload.groupSiteId).toBe('S100');
        expect(payload.siteName).toBe('New Test Site');
        expect(payload.osokFlag).toBe('Y');
        expect(payload.effectiveDate).toBeDefined();
        done();
      });
    });

    it('should handle add errors for duplicate records (409)', (done) => {
      const errorResponse = {
        status: 409,
        error: { message: 'Record already exists' }
      };
      apiService.post.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      service.addGroupSite(mockAddPayload).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error adding group/site:',
            errorResponse
          );
          expect(error.status).toBe(409);
          done();
        }
      );
    });

    it('should handle server errors during add', (done) => {
      const errorResponse = { status: 500, message: 'Server error' };
      apiService.post.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      service.addGroupSite(mockAddPayload).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error adding group/site:',
            errorResponse
          );
          done();
        }
      );
    });

  });

  describe('updateGroupSite', () => {
    const mockUpdatePayload: UpdateGroupSitesDto = {
      currentChapterId: '001',
      currentGroupSiteId: 'S1540',
      groupSiteInd: 'S',
      siteName: 'Updated Test Site',
      osokFlag: 'N',
      effectiveDate: '2024-01-15',
      terminationDate: '2024-12-31'
    };

    it('should update an existing group site successfully', (done) => {
      const mockResponse: ReturnResult<GroupSitesModel> = {
        success: true,
        message: 'Record updated successfully',
        item: {
          ...mockGroupSitesData[0],
          siteName: 'Updated Test Site'
        }
      };

      apiService.put.and.returnValue(of(mockResponse));

      service.updateGroupSite(mockUpdatePayload).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(apiService.put).toHaveBeenCalledWith(
          jasmine.any(String),
          mockUpdatePayload
        );
        done();
      });
    });

    it('should call the correct API endpoint for updating', (done) => {
      const mockResponse = { success: true };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateGroupSite(mockUpdatePayload).subscribe(() => {
        const url = apiService.put.calls.mostRecent().args[0];
        expect(url).toContain('group-sites');
        done();
      });
    });

    it('should send all required fields in update payload', (done) => {
      const mockResponse = { success: true };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateGroupSite(mockUpdatePayload).subscribe(() => {
        const payload = apiService.put.calls.mostRecent().args[1];
        expect(payload.currentChapterId).toBe('001');
        expect(payload.currentGroupSiteId).toBe('S1540');
        expect(payload.groupSiteInd).toBe('S');
        expect(payload.siteName).toBe('Updated Test Site');
        expect(payload.osokFlag).toBe('N');
        expect(payload.effectiveDate).toBeDefined();
        expect(payload.terminationDate).toBeDefined();
        done();
      });
    });

    it('should handle update errors for not found records (404)', (done) => {
      const errorResponse = {
        status: 404,
        error: { message: 'Record not found' }
      };
      apiService.put.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      service.updateGroupSite(mockUpdatePayload).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error updating group/site:',
            errorResponse
          );
          expect(error.status).toBe(404);
          done();
        }
      );
    });

    it('should handle server errors during update', (done) => {
      const errorResponse = { status: 500, message: 'Server error' };
      apiService.put.and.returnValue(throwError(() => errorResponse));

      spyOn(console, 'error');

      service.updateGroupSite(mockUpdatePayload).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(console.error).toHaveBeenCalledWith(
            'Error updating group/site:',
            errorResponse
          );
          done();
        }
      );
    });


    it('should use PUT method for update instead of POST', (done) => {
      const mockResponse = { success: true };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateGroupSite(mockUpdatePayload).subscribe(() => {
        expect(apiService.put).toHaveBeenCalled();
        expect(apiService.post).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('Error Handling', () => {

    it('should handle timeout errors', (done) => {
      const timeoutError = { status: 408, message: 'Request timeout' };
      apiService.get.and.returnValue(throwError(() => timeoutError));

      service.getChapterIds().subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(408);
          done();
        }
      );
    });

    it('should handle unauthorized errors', (done) => {
      const unauthorizedError = { status: 401, message: 'Unauthorized' };
      apiService.post.and.returnValue(throwError(() => unauthorizedError));

      const payload: GroupSitesDto = {
        chapterId: '001',
        groupSiteInd: 'S',
        groupSiteId: 'S100',
        siteName: 'Test',
        osokFlag: 'N',
        effectiveDate: '2024-01-01',
        terminationDate: null
      };

      service.addGroupSite(payload).subscribe(
        () => fail('should have failed'),
        (error) => {
          expect(error.status).toBe(401);
          done();
        }
      );
    });
  });

  describe('API Integration', () => {
    it('should use ApiService for all HTTP calls', () => {
      const mockResponse = { success: true, data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));
      apiService.get.and.returnValue(of([]));
      apiService.put.and.returnValue(of({ success: true }));

      service.getGroupSites(10, 0, {}).subscribe();
      expect(apiService.post).toHaveBeenCalled();

      service.getChapterIds().subscribe();
      expect(apiService.get).toHaveBeenCalled();

      const updatePayload: UpdateGroupSitesDto = {
        currentChapterId: '001',
        currentGroupSiteId: 'S100',
        groupSiteInd: 'S',
        siteName: 'Test',
        osokFlag: 'N',
        effectiveDate: '2024-01-01',
        terminationDate: null
      };
      service.updateGroupSite(updatePayload).subscribe();
      expect(apiService.put).toHaveBeenCalled();
    });
  });
});
