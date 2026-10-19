import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ValidFfFlagService } from './valid-ff-flag.service';
import { ValidFfFlagDto, UpdateValidFfFlagDto, ValidFfFlagModel, DropdownOption } from '../models/valid-ff-flag.model';
import { API } from 'src/app/core/constants/api.constants';

describe('ValidFfFlagService', () => {
  let service: ValidFfFlagService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ValidFfFlagService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(ValidFfFlagService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getValidFfFlags', () => {
    it('should fetch valid FF flags with params', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: [
          {
            chapterID: 'ALL',
            collectionFacilityId: 'W0352',
            sourceType: 'DONOR',
            ffFlagValue: '00',
            effectiveDate: '2017-03-22T17:04:05',
            terminationDate: '2027-03-22T17:04:05',
            modificationDate: '2025-03-25T10:00:00'
          }
        ],
        total: 1
      };

      const params = {
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR'
      };

      service.getValidFfFlags(params).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.totalRecords).toBe(1);
        expect(response.data[0].chapterID).toBe('ALL');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockResponse);
    });

  });

  describe('getValidFfFlagFilters', () => {
    it('should fetch filter dropdown values as DropdownOption arrays', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: [
          {
            collectionFacilityId: [
              { key: 'U.S. Naval Hospital', value: 'W0352' },
              { key: 'Army Medical Center', value: 'W0353' }
            ],
            sourceType: [
              { key: 'Donor Source', value: 'DONOR' },
              { key: 'Product Source', value: 'PRODUCT' }
            ],
            ffFlagValue: [
              { key: 'No Flag', value: '00' },
              { key: 'Flag Set', value: '01' }
            ]
          }
        ],
        total: 1
      };

      service.getValidFfFlagFilters().subscribe(response => {
        expect(response.data).toBeDefined();
        const filterData = response.data?.[0];
        expect(filterData?.collectionFacilityId?.length).toBe(2);
        expect(filterData?.collectionFacilityId?.[0].key).toBe('U.S. Naval Hospital');
        expect(filterData?.collectionFacilityId?.[0].value).toBe('W0352');
        expect(filterData?.sourceType?.length).toBe(2);
        expect(filterData?.ffFlagValue?.length).toBe(2);
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG_FILTERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAddDropdownChapters', () => {
    it('should fetch chapter dropdown options', () => {
      const mockOptions: DropdownOption[] = [
        { key: 'All Chapters', value: 'ALL' },
        { key: 'Chapter 01', value: 'CH01' }
      ];
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockOptions,
        total: 2
      };

      service.getAddDropdownChapters().subscribe(response => {
        expect(response.data).toBeDefined();
        expect(response.data?.length).toBe(2);
        expect(response.data?.[0].value).toBe('ALL');
        expect(response.data?.[0].key).toBe('All Chapters');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG_ADD_CHAPTERS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAddDropdownCollectionFacilities', () => {
    it('should fetch collection facilities with chapterId query param', () => {
      const mockOptions: DropdownOption[] = [
        { key: 'U.S. Naval Hospital', value: 'W0352' }
      ];
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockOptions,
        total: 1
      };

      service.getAddDropdownCollectionFacilities('CH01').subscribe(response => {
        expect(response.data).toBeDefined();
        expect(response.data?.length).toBe(1);
        expect(response.data?.[0].value).toBe('W0352');
      });

      const req = httpMock.expectOne(
        r => r.url === API.APPLICATION_ADMIN.VALID_FF_FLAG_ADD_COLLECTION_FACILITIES
          && r.params.get('chapterId') === 'CH01'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should pass different chapterId values correctly', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: [],
        total: 0
      };

      service.getAddDropdownCollectionFacilities('ALL').subscribe(response => {
        expect(response.data).toEqual([]);
      });

      const req = httpMock.expectOne(
        r => r.url === API.APPLICATION_ADMIN.VALID_FF_FLAG_ADD_COLLECTION_FACILITIES
          && r.params.get('chapterId') === 'ALL'
      );
      req.flush(mockResponse);
    });
  });

  describe('getAddDropdownSourceTypes', () => {
    it('should fetch source type dropdown options', () => {
      const mockOptions: DropdownOption[] = [
        { key: 'Donor Source', value: 'DONOR' },
        { key: 'Product Source', value: 'PRODUCT' }
      ];
      const mockResponse = {
        success: true,
        message: 'Success',
        error: null,
        statusCode: 200,
        data: mockOptions,
        total: 2
      };

      service.getAddDropdownSourceTypes().subscribe(response => {
        expect(response.data).toBeDefined();
        expect(response.data?.length).toBe(2);
        expect(response.data?.[0].value).toBe('DONOR');
        expect(response.data?.[1].key).toBe('Product Source');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG_ADD_SOURCE_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('addValidFfFlag', () => {
    it('should create new valid FF flag record', () => {
      const payload: ValidFfFlagDto = {
        chapterID: 'ALL',
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00',
        effectiveDate: '2026-03-25T12:00:00.000Z',
        terminationDate: '2027-03-25T12:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        message: 'Record created successfully',
        error: null,
        statusCode: 200,
        data: [payload as ValidFfFlagModel],
        total: 1
      };

      service.addValidFfFlag(payload).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Record created successfully');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG_CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });
  });

  describe('updateValidFfFlag', () => {
    it('should update existing valid FF flag record', () => {
      const payload: UpdateValidFfFlagDto = {
        originalChapterID: 'ALL',
        originalCollectionFacilityId: 'W0352',
        originalSourceType: 'DONOR',
        originalFFFlagValue: '00',
        collectionFacilityId: 'W0353',
        sourceType: 'PRODUCT',
        ffFlagValue: '01',
        effectiveDate: '2026-03-25T12:00:00.000Z',
        terminationDate: '2027-03-25T12:00:00.000Z'
      };

      const mockResponse = {
        success: true,
        message: 'Record updated successfully',
        error: null,
        statusCode: 200,
        data: [payload as any],
        total: 1
      };

      service.updateValidFfFlag(payload).subscribe(response => {
        expect(response.success).toBeTrue();
        expect(response.message).toBe('Record updated successfully');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG_UPDATE);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

    it('should include original values in update payload', () => {
      const payload: UpdateValidFfFlagDto = {
        originalChapterID: 'ALL',
        originalCollectionFacilityId: 'W0352',
        originalSourceType: 'DONOR',
        originalFFFlagValue: '00',
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00',
        effectiveDate: '2026-03-25T12:00:00.000Z',
        terminationDate: '2027-03-25T12:00:00.000Z'
      };

      service.updateValidFfFlag(payload).subscribe();

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG_UPDATE);
      expect(req.request.body.originalChapterID).toBe('ALL');
      expect(req.request.body.originalCollectionFacilityId).toBe('W0352');
      expect(req.request.body.originalSourceType).toBe('DONOR');
      expect(req.request.body.originalFFFlagValue).toBe('00');
      req.flush({ success: true, data: [], total: 0 });
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors on get valid ff flags', () => {
      service.getValidFfFlags({}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle HTTP errors on add', () => {
      const payload: ValidFfFlagDto = {
        chapterID: 'ALL',
        collectionFacilityId: 'W0352',
        sourceType: 'DONOR',
        ffFlagValue: '00',
        effectiveDate: '2026-03-25T12:00:00.000Z',
        terminationDate: '2027-03-25T12:00:00.000Z'
      };

      service.addValidFfFlag(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG_CREATE);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });

    it('should handle HTTP errors on update', () => {
      const payload: UpdateValidFfFlagDto = {
        originalChapterID: 'ALL',
        originalCollectionFacilityId: 'W0352',
        originalSourceType: 'DONOR',
        originalFFFlagValue: '00',
        collectionFacilityId: 'W0353',
        sourceType: 'PRODUCT',
        ffFlagValue: '01',
        effectiveDate: '2026-03-25T12:00:00.000Z',
        terminationDate: '2027-03-25T12:00:00.000Z'
      };

      service.updateValidFfFlag(payload).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.VALID_FF_FLAG_UPDATE);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });
});
