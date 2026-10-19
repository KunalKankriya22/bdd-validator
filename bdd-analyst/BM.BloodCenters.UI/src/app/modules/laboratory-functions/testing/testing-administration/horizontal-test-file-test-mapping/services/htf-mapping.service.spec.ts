import { TestBed } from '@angular/core/testing';
import { HtfMappingService } from './htf-mapping.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import { API } from 'src/app/core/constants/api.constants';

describe('HtfMappingService', () => {
  let service: HtfMappingService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        HtfMappingService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(HtfMappingService);
  });

  describe('getAll', () => {
    it('should call POST with correct endpoint and return mapped data', () => {
      const mockResponse = {
        data: [{ sequenceNo: 1, headerName: 'HBSAG', startPos: 15, endPos: 18 }],
        total: 1,
      };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.getAll(50, 0, { searchKeyword: 'test' }).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.HORIZONTAL_TEST_FILE_TEST_MAPPING.LIST(50, 0),
        jasmine.objectContaining({ searchKeyword: 'test' })
      );
    });



    it('should pass null for empty query params', () => {
      apiServiceSpy.post.and.returnValue(of({ data: [], total: 0 }));

      service.getAll(50, 0, {}).subscribe();

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.HORIZONTAL_TEST_FILE_TEST_MAPPING.LIST(50, 0),
        jasmine.objectContaining({
          searchKeyword: null,
          sortColumn: null,
          sortOrder: null,
        })
      );
    });
  });

  describe('create', () => {
    it('should call POST with dto', () => {
      const dto = { sequenceNo: 10, headerName: 'HBSAG', startPos: 15, endPos: 18 };
      apiServiceSpy.post.and.returnValue(of({ success: true, message: 'Created' }));

      service.create(dto).subscribe(result => {
        expect(result.success).toBeTrue();
      });

      expect(apiServiceSpy.post).toHaveBeenCalledWith(
        API.HORIZONTAL_TEST_FILE_TEST_MAPPING.CREATE,
        dto
      );
    });

    it('should propagate errors on create', () => {
      const dto = { sequenceNo: 10, headerName: 'HBSAG', startPos: 15, endPos: 18 };
      apiServiceSpy.post.and.returnValue(throwError(() => new Error('fail')));

      service.create(dto).subscribe({
        error: err => expect(err.message).toBe('fail'),
      });
    });
  });

  describe('update', () => {
    it('should call PUT with sequenceNo in URL', () => {
      const dto = { headerName: 'HBSAG', startPos: 20, endPos: 25 };
      apiServiceSpy.put.and.returnValue(of({ success: true, message: 'Updated' }));

      service.update(1, dto).subscribe(result => {
        expect(result.success).toBeTrue();
      });

      expect(apiServiceSpy.put).toHaveBeenCalledWith(
        API.HORIZONTAL_TEST_FILE_TEST_MAPPING.UPDATE(1),
        dto
      );
    });
  });

  describe('delete', () => {
    it('should call DELETE with sequenceNo in URL', () => {
      apiServiceSpy.delete.and.returnValue(of({ success: true, message: 'Deleted' }));

      service.delete(1).subscribe(result => {
        expect(result.success).toBeTrue();
      });

      expect(apiServiceSpy.delete).toHaveBeenCalledWith(
        API.HORIZONTAL_TEST_FILE_TEST_MAPPING.DELETE(1)
      );
    });
  });

  describe('getTestIdsDropdown', () => {
    it('should call GET and return test IDs', () => {
      const mockResponse = [
        { testId: 'HBSAG', testDesc: 'Hepatitis B' },
        { testId: 'HIV-1/2', testDesc: 'HIV Antibody' },
      ];
      apiServiceSpy.get.and.returnValue(of(mockResponse));

      service.getTestIdsDropdown().subscribe(result => {
        expect(result.length).toBe(2);
        expect(result[0].testId).toBe('HBSAG');
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.HORIZONTAL_TEST_FILE_TEST_MAPPING.TEST_IDS_DROPDOWN
      );
    });

    it('should propagate errors on dropdown fetch', () => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getTestIdsDropdown().subscribe({
        error: err => expect(err.message).toBe('fail'),
      });
    });
  });

  describe('getNextSequenceNo', () => {
    it('should call GET and return next sequence number', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [26] }));

      service.getNextSequenceNo().subscribe(result => {
        expect(result).toBe(26);
      });

      expect(apiServiceSpy.get).toHaveBeenCalledWith(
        API.HORIZONTAL_TEST_FILE_TEST_MAPPING.NEXT_SEQUENCE_NO
      );
    });

    it('should default to 1 when data is empty', () => {
      apiServiceSpy.get.and.returnValue(of({ success: true, data: [] }));

      service.getNextSequenceNo().subscribe(result => {
        expect(result).toBe(1);
      });
    });

  });
});
