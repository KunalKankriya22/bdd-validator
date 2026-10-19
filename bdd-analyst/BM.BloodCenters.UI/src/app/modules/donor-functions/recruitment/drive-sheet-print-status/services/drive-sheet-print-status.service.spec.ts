import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DriveSheetPrintStatusService } from './drive-sheet-print-status.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';

describe('DriveSheetPrintStatusService', () => {
  let service: DriveSheetPrintStatusService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('ApiService', ['post']);

    TestBed.configureTestingModule({
      providers: [
        DriveSheetPrintStatusService,
        { provide: ApiService, useValue: spy }
      ]
    });

    service = TestBed.inject(DriveSheetPrintStatusService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('searchDrives', () => {
    it('should POST drive search request and return print status response', (done) => {
      const request = { driveDate: '2024-01-15' } as any;
      const mockResponse = { data: [{ driveId: 'DR-1', printed: true }] };
      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.searchDrives(request).subscribe(result => {
        expect(result).toEqual(mockResponse as any);
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.RECRUITMENT.DRIVE_SHEET_PRINT_STATUS,
          request
        );
        done();
      });
    });
  });
});
