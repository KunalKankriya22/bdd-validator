import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ViewDonorsInListService } from './view-donors-in-list.service';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

describe('ViewDonorsInListService', () => {
  let service: ViewDonorsInListService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockMetadataResponse = {
    success: true,
    message: null,
    error: null,
    errorCode: null,
    statusCode: 200,
    data: null,
    item: {
      listId: 'L1',
      listName: 'Test List',
      listType: 'DONOR',
      priority: 'HIGH',
      eligibilityCheck: 'Y',
      donorOverride: 'N',
      maxSize: 100,
      actualSize: 2,
    },
    total: null,
    errorResponse: null as any,
  };

  const mockDonorsResponse = {
    success: true,
    message: null,
    error: null,
    errorCode: null,
    statusCode: 200,
    data: [
      {
        donorId: 'D1',
        lastName: 'Smith',
        firstName: 'John',
        gender: 'M',
        homePhone: '555-1234',
        businessPhone: null,
        lockedBy: null,
        status: 'Active',
      },
    ],
    item: null,
    total: 1,
    errorResponse: null as any,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        ViewDonorsInListService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(ViewDonorsInListService);
  });

  describe('getDonorsByListId', () => {
    it('should combine metadata and donors into ViewDonorsInListResponse', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockMetadataResponse));
      apiServiceSpy.post.and.returnValue(of(mockDonorsResponse));

      service.getDonorsByListId('L1').subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.DONOR_LIST_VIEWER.METADATA('L1'));
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_LIST_VIEWER.DONORS('L1', 1000, 0),
          jasmine.any(Object)
        );
        expect(result.data.listInfo.listId).toBe('L1');
        expect(result.data.donors.length).toBe(1);
        expect(result.data.donors[0].sex).toBe('Male');
        done();
      });
    });
  });

  describe('getAvailableListIds', () => {
    it('should return array of list IDs', (done) => {
      const mockLookupResponse = {
        success: true,
        message: null,
        error: null,
        errorCode: null,
        statusCode: 200,
        data: [{ listId: 'L1', listName: 'List 1' }, { listId: 'L2', listName: 'List 2' }],
        item: null,
        total: 2,
        errorResponse: null as any,
      };
      apiServiceSpy.get.and.returnValue(of(mockLookupResponse));

      service.getAvailableListIds().subscribe((result) => {
        expect(apiServiceSpy.get).toHaveBeenCalledWith(API.DONOR_LIST_VIEWER.LOOKUP(10000));
        expect(result).toEqual(['L1', 'L2']);
        done();
      });
    });
  });
});
