import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { API } from '@core/constants/api.constants';
import { TestqApiService } from './testq-api.service';
import { AllTestsForUnitQueryDto, UtrsTestDto } from '../models/testq.model';

describe('TestqApiService', () => {
  let service: TestqApiService;
  let httpMock: HttpTestingController;

  const mockUtrsTest: UtrsTestDto = {
    unitId: 'W12345678901234567',
    collDate: '2024-05-15T00:00:00Z',
    testId: 'HIV',
    testSeqNo: 1,
    testMode: 'M',
    testModeDesc: 'Man',
    testState: 'C',
    resultStatus1: 'NR',
    resultStatus2: null,
    tbId: 'TB001',
    tbSeqNo: 1,
    absorbance: 0.125,
    ratio: 1.234,
    resultDats: '2024-05-15T14:30:00Z',
    resultUserId: 'JSMITH',
    wellNumber: 'A01',
    editResultFlag: 'N',
    chapterId: 'WAD',
    testChapterId: 'WAD',
    cancelFlag: 'N',
    programId: 'TESTPROG',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TestqApiService],
    });
    service = TestBed.inject(TestqApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('searchAllTestsForUnit', () => {
    it('should send POST request to search endpoint', () => {
      const request: AllTestsForUnitQueryDto = {
        unitId: 'W12345678901234567',
        collDate: '2024-05-15',
        chapterId: 'WAD',
      };

      service.searchAllTestsForUnit(request).subscribe((result) => {
        expect(result.utrsTests.length).toBe(1);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${API.ALL_TESTS_FOR_UNIT.SEARCH}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush({ data: [mockUtrsTest], success: true, message: '' });
    });


  });

  describe('getCollectionDates', () => {
    it('should send GET request for collection dates', () => {
      const unitId = 'W12345678901234567';

      service.getCollectionDates(unitId).subscribe((result) => {
        expect(result.length).toBe(2);
        expect(result[0].collDate).toBe('2024-05-15');
      });

      const req = httpMock.expectOne(
        `${environment.apiUrl}/api/v1/unit-test-results/${encodeURIComponent(unitId)}/collection-dates`
      );
      expect(req.request.method).toBe('GET');
      req.flush({
        data: [{ collDate: '2024-05-15' }, { collDate: '2024-06-01' }],
        success: true,
        message: '',
      });
    });

  });
});
