import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DriveInterfaceDonorLabApiService } from './drive-interface-donor-lab-api.service';
import { environment } from 'src/environments/environment';
import { DriveInterfaceFilters } from '../models/drive-interface-donor-lab.model';

describe('DriveInterfaceDonorLabApiService', () => {
  let service: DriveInterfaceDonorLabApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DriveInterfaceDonorLabApiService]
    });
    service = TestBed.inject(DriveInterfaceDonorLabApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should get transfer by options', () => {
    const mockOptions = [
      { code: 'All', description: 'All Drives' },
      { code: 'Specific', description: 'Specific' },
      { code: 'DateRange', description: 'Date Range' }
    ];

    service.getTransferByOptions().subscribe(options => {
      expect(options).toEqual(mockOptions);
      expect(options.length).toBe(3);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/drive-interface/filter-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockOptions);
  });

  it('should start transfer', () => {
    const chapterId = 'DAL';
    const driveIds = ['D001', 'D002'];

    const mockResponse = {
      success: true,
      message: 'Transfer completed successfully',
      processStartTime: '2024-01-01T10:00:00Z',
      processEndTime: '2024-01-01T10:05:00Z'
    };

    service.startTransfer(chapterId, driveIds).subscribe(response => {
      expect(response).toEqual(mockResponse);
      expect(response.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/api/v1/drive-interface/drives/transfer`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ chapterId, driveIds });
    req.flush(mockResponse);
  });
});
