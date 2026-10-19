import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TransferDonorDataToLabApiService } from './transfer-donor-data-to-lab-api.service';
import { ApiService } from '@shared/services/api.service';

describe('TransferDonorDataToLabApiService', () => {
  let service: TransferDonorDataToLabApiService;
  let apiSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        TransferDonorDataToLabApiService,
        { provide: ApiService, useValue: apiSpy },
      ],
    });

    service = TestBed.inject(TransferDonorDataToLabApiService);
  });

  describe('getBatches', () => {
    it('should return mapped batch options from response data', (done) => {
      // Arrange
      const mockBatches = [{ batchId: 'B1' }];
      apiSpy.get.and.returnValue(of({ data: mockBatches }));

      // Act
      service.getBatches().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockBatches as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getDrives', () => {
    it('should return mapped drive options for a collection date', (done) => {
      // Arrange
      const mockDrives = [{ driveId: 'D1' }];
      apiSpy.get.and.returnValue(of({ data: mockDrives }));

      // Act
      service.getDrives('2024-01-01').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockDrives as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getShippers', () => {
    it('should return mapped shipper options for drive and checkin type', (done) => {
      // Arrange
      const mockShippers = [{ shipperId: 'S1' }];
      apiSpy.get.and.returnValue(of({ data: mockShippers }));

      // Act
      service.getShippers('D1', 'TYPE1').subscribe((result) => {
        // Assert
        expect(result).toEqual(mockShippers as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getUnits', () => {
    it('should return units response', (done) => {
      // Arrange
      const mockResponse = { data: [{ unitId: 'U1' }] };
      apiSpy.get.and.returnValue(of(mockResponse));

      // Act
      service.getUnits({ batchId: 'B1' } as any).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('validateHeader', () => {
    it('should post header validation request', (done) => {
      // Arrange
      const mockResponse = { success: true };
      apiSpy.post.and.returnValue(of(mockResponse));
      const request = { driveId: 'D1' } as any;

      // Act
      service.validateHeader(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('validateUnit', () => {
    it('should post unit validation request', (done) => {
      // Arrange
      const mockResponse = { valid: true };
      apiSpy.post.and.returnValue(of(mockResponse));
      const request = { unitId: 'U1' } as any;

      // Act
      service.validateUnit(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('validateTransfer', () => {
    it('should post transfer validation request', (done) => {
      // Arrange
      const mockResponse = { valid: true };
      apiSpy.post.and.returnValue(of(mockResponse));
      const request = { unitId: 'U1' } as any;

      // Act
      service.validateTransfer(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('getDonationDetails', () => {
    it('should return mapped donation details with attributes defaulted', (done) => {
      // Arrange
      const detail = { donorId: 'DN1', attributes: null };
      apiSpy.get.and.returnValue(of({ data: [detail] }));

      // Act
      service.getDonationDetails('U1', '2024-01-01').subscribe((result) => {
        // Assert
        expect(result).toEqual({ donorId: 'DN1', attributes: [] } as any);
        expect(apiSpy.get).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });

  describe('transfer', () => {
    it('should post transfer request', (done) => {
      // Arrange
      const mockResponse = { success: true };
      apiSpy.post.and.returnValue(of(mockResponse));
      const request = { unitId: 'U1' } as any;

      // Act
      service.transfer(request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockResponse as any);
        expect(apiSpy.post).toHaveBeenCalledTimes(1);
        done();
      });
    });
  });
});
