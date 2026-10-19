import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DonorAntigensApiService } from './donor-antigens-api.service';
import { DonorAntigensQueryResponse } from '../models/donor-antigens.model';

describe('DonorAntigensApiService', () => {
  let service: DonorAntigensApiService;
  let httpMock: HttpTestingController;
  const baseUrl = `/api/v1/donor-antigens-query`;

  const mockResponse: DonorAntigensQueryResponse = {
    success: true,
    statusCode: 200,
    message: 'Donor antigens retrieved successfully',
    item: {
      donorInfo: {
        donorId: '12345',
        donorName: 'Doe , John M',
        dateOfBirth: '1980-01-15',
        gender: 'M',
        aboType: 'O Positive'
      },
      rbcAntigens: [
        {
          testId: 'D',
          resultCode: '+',
          isPositive: true
        },
        {
          testId: 'C',
          resultCode: '-',
          isPositive: false
        }
      ],
      hlaAntigens: {
        a1: '02',
        a2: '24',
        b1: '07',
        b2: '35',
        c1: '04',
        c2: '07',
        d1: null,
        d2: null,
        dr: '15'
      }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DonorAntigensApiService]
    });

    service = TestBed.inject(DonorAntigensApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getDonorAntigens', () => {
    it('should retrieve donor antigens data for valid donor ID', (done) => {
      const donorId = '12345';

      service.getDonorAntigens(donorId).subscribe({
        next: (data) => {
          expect(data).toEqual(mockResponse.item);
          expect(data.donorInfo.donorId).toBe('12345');
          expect(data.rbcAntigens.length).toBe(2);
          expect(data.hlaAntigens.a1).toBe('02');
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle donor with no RBC antigens', (done) => {
      const donorId = '67890';
      const responseWithNoRbc = {
        ...mockResponse,
        item: {
          ...mockResponse.item,
          rbcAntigens: []
        }
      };

      service.getDonorAntigens(donorId).subscribe({
        next: (data) => {
          expect(data.rbcAntigens.length).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      req.flush(responseWithNoRbc);
    });

    it('should handle donor with no HLA antigens', (done) => {
      const donorId = '11111';
      const responseWithNoHla = {
        ...mockResponse,
        item: {
          ...mockResponse.item,
          hlaAntigens: {
            a1: null,
            a2: null,
            b1: null,
            b2: null,
            c1: null,
            c2: null,
            d1: null,
            d2: null,
            dr: null
          }
        }
      };

      service.getDonorAntigens(donorId).subscribe({
        next: (data) => {
          expect(data.hlaAntigens.a1).toBeNull();
          expect(data.hlaAntigens.dr).toBeNull();
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      req.flush(responseWithNoHla);
    });

    it('should handle 404 error for donor not found', (done) => {
      const donorId = 'INVALID';
      const errorResponse = {
        success: false,
        statusCode: 404,
        message: 'Donor not found'
      };

      service.getDonorAntigens(donorId).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}`);
      req.flush(errorResponse, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 400 error for invalid donor ID', (done) => {
      const donorId = '';
      const errorResponse = {
        success: false,
        statusCode: 400,
        message: 'Donor ID is required'
      };

      service.getDonorAntigens(donorId).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(baseUrl);
      req.flush(errorResponse, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('getDonorInterdictions', () => {
    it('should return empty array (temporary implementation)', (done) => {
      const donorId = '12345';

      service.getDonorInterdictions(donorId).subscribe({
        next: (data) => {
          expect(data).toBeDefined();
          expect(Array.isArray(data)).toBe(true);
          expect(data.length).toBe(0);
          done();
        }
      });
    });
  });
});
