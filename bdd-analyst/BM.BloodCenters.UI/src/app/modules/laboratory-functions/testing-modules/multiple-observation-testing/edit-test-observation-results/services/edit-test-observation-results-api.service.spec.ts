import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { EditTestObservationResultsApiService } from './edit-test-observation-results-api.service';
import { API } from 'src/app/core/constants/api.constants';
import { TestObservationDto, SaveAllRequestDto } from '../models/edit-test-observation-results.model';

describe('EditTestObservationResultsApiService', () => {
  let service: EditTestObservationResultsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EditTestObservationResultsApiService],
    });

    service = TestBed.inject(EditTestObservationResultsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getTestObservation', () => {
    it('should retrieve test observation data', () => {
      const mockUnitId = 'W12342402705-Q';
      const mockParams = {
        testChapterId: 'CH01',
        testId: 'TEST001',
        tbId: 'TB12345678901',
        tbSeqNo: 1,
      };

      const mockResponse: TestObservationDto = {
        header: {
          unitId: mockUnitId,
          testChapterId: 'CH01',
          testId: 'TEST001',
          tbId: 'TB12345678901',
          tbSeqNo: 1,
          superIntp: 'POS',
          superUser: 'USER01',
          superDate: new Date('2024-05-26T10:30:00Z'),
          programId: 'VDIEDITOBS',
        },
        details: [
          {
            unitId: mockUnitId,
            testChapterId: 'CH01',
            testId: 'TEST001',
            tbId: 'TB12345678901',
            tbSeqNo: 1,
            bandSeq: 1,
            tech1BandVal: '3+',
            tech2BandVal: '3+',
            superBandVal: '3+',
            programId: 'VDIEDITOBS',
          },
        ],
      };

      service.getTestObservation(mockUnitId, mockParams).subscribe((data) => {
        expect(data).toEqual(mockResponse);
        expect(data.header.unitId).toBe(mockUnitId);
        expect(data.details.length).toBe(1);
      });

      const expectedUrl = API.TEST_OBSERVATION.GET(mockUnitId, mockParams);
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('GET');

      req.flush({
        success: true,
        data: mockResponse,
      });
    });

    it('should handle errors when retrieving test observation', () => {
      const mockUnitId = 'INVALID';
      const mockParams = {
        testChapterId: 'CH01',
        testId: 'TEST001',
        tbId: 'TB12345678901',
        tbSeqNo: 1,
      };

      service.getTestObservation(mockUnitId, mockParams).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const expectedUrl = API.TEST_OBSERVATION.GET(mockUnitId, mockParams);
      const req = httpMock.expectOne(expectedUrl);

      req.flush('Test observation not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('saveAll', () => {
    it('should save all header and detail data', () => {
      const mockUnitId = 'W12342402705-Q';
      const mockTestChapterId = 'CH01';
      const mockTestId = 'TEST001';
      const mockTbId = 'TB12345678901';
      const mockTbSeqNo = 1;
      const mockRequest: SaveAllRequestDto = {
        superIntp: 'POS',
        voidCode: '',
        bandDetails: [
          { bandSeq: 1, bandName: 'Band1', superBandVal: '3+' },
        ],
      };

      const mockResponse = { success: true };

      service
        .saveAll(mockUnitId, mockTestChapterId, mockTestId, mockTbId, mockTbSeqNo, mockRequest)
        .subscribe((data) => {
          expect(data).toEqual(mockResponse);
        });

      const expectedUrl = API.TEST_OBSERVATION.SAVE_ALL(
        mockUnitId,
        mockTestChapterId,
        mockTestId,
        mockTbId,
        mockTbSeqNo
      );
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockRequest);

      req.flush(mockResponse);
    });

    it('should handle validation errors when saving', () => {
      const mockUnitId = 'W12342402705-Q';
      const mockTestChapterId = 'CH01';
      const mockTestId = 'TEST001';
      const mockTbId = 'TB12345678901';
      const mockTbSeqNo = 1;
      const mockRequest: SaveAllRequestDto = {
        superIntp: 'TOOLONGVALUE',
        voidCode: '',
        bandDetails: [],
      };

      service
        .saveAll(mockUnitId, mockTestChapterId, mockTestId, mockTbId, mockTbSeqNo, mockRequest)
        .subscribe({
          next: () => fail('should have failed with validation error'),
          error: (error) => {
            expect(error.status).toBe(400);
          },
        });

      const expectedUrl = API.TEST_OBSERVATION.SAVE_ALL(
        mockUnitId,
        mockTestChapterId,
        mockTestId,
        mockTbId,
        mockTbSeqNo
      );
      const req = httpMock.expectOne(expectedUrl);

      req.flush('Validation error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('API URL Construction', () => {
    it('should correctly encode URL parameters in GET request', () => {
      const mockUnitId = 'W12342402705-Q';
      const mockParams = {
        testChapterId: 'CH01',
        testId: 'HIV-1 WB',
        tbId: 'TB12345678901',
        tbSeqNo: 1,
      };

      service.getTestObservation(mockUnitId, mockParams).subscribe();

      const expectedUrl = API.TEST_OBSERVATION.GET(mockUnitId, mockParams);
      const req = httpMock.expectOne((request) => request.url.includes(encodeURIComponent(mockUnitId)));
      expect(req.request.url).toContain(encodeURIComponent(mockUnitId));

      req.flush({ success: true, data: { header: {}, details: [] } });
    });

    it('should correctly construct SAVE_ALL URL', () => {
      const mockUnitId = 'W12342402705-Q';
      const mockTestChapterId = 'CH01';
      const mockTestId = 'TEST001';
      const mockTbId = 'TB12345678901';
      const mockTbSeqNo = 1;
      const mockRequest: SaveAllRequestDto = {
        superIntp: 'POS',
        voidCode: '',
        bandDetails: [
          { bandSeq: 1, bandName: 'Band1', superBandVal: '3+' },
        ],
      };

      service
        .saveAll(mockUnitId, mockTestChapterId, mockTestId, mockTbId, mockTbSeqNo, mockRequest)
        .subscribe();

      const expectedUrl = API.TEST_OBSERVATION.SAVE_ALL(
        mockUnitId,
        mockTestChapterId,
        mockTestId,
        mockTbId,
        mockTbSeqNo
      );
      const req = httpMock.expectOne(expectedUrl);
      expect(req.request.url).toBe(expectedUrl);

      req.flush({ success: true, data: {} });
    });
  });
});
