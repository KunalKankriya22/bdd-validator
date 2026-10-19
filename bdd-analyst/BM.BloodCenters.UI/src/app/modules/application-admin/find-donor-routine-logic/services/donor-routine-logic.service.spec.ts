import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { DonorRoutineLogicService } from './donor-routine-logic.service';
import { DonorSearchRequest, DonorSearchResult, MatchGradeSummary, SessionResult } from '../models/donor-routine-logic.model';
import { ApiService } from '@shared/services/api.service';

describe('DonorRoutineLogicService', () => {
  let service: DonorRoutineLogicService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  const mockDonors: DonorSearchResult[] = [
    {
      sessionId: 'SESSION001',
      donorId: 'D001',
      ssn: 123456789,
      lastName: 'Doe',
      firstName: 'John',
      dateOfBirth: '1990-01-01',
      gender: 'M',
      soundexKey: 'D000',
      grade: 1,
      dgmId: 10,
      insertDate: '2024-01-01',
      chapterId: 'CH001',
      programId: 'PR001'
    }
  ];

  const mockSessionResults: SessionResult[] = [
    {
      sessionId: 'SESSION001',
      donorId: 'D001',
      dgmId: 10,
      lastName: 'Doe',
      firstName: 'John',
      dateOfBirth: '1990-01-01',
      gender: 'M',
      grade: 1,
      insertDate: '2024-01-01',
      ssn: 123456789,
      soundexKey: 'D000',
      chapterId: 'CH001',
      programId: 'PR001'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DonorRoutineLogicService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DonorRoutineLogicService);
    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should search donors with valid request', (done) => {
    const searchRequest: DonorSearchRequest = {
      lastName: 'DOE',
      insertUser: 'NITOR3'
    };

    const apiResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: [{
        sessionId: 'SESSION001',
        totalDonors: 1,
        grade1Count: 1,
        grade2Count: 0,
        grade3Count: 0,
        grade4Count: 0,
        grade5Count: 0,
        searchCriteria: searchRequest,
        donors: mockDonors
      }],
      total: 1
    };

    service.searchDonors(searchRequest).subscribe(response => {
      expect(response.donors).toEqual(mockDonors);
      expect(response.totalDonors).toBe(1);
      done();
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('api/v1/donor-routine-logic/search')
    );
    expect(req.request.method).toBe('POST');
    req.flush(apiResponse);
  });

  it('should get donor routine logic with pagination', (done) => {
    const apiResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: mockSessionResults,
      total: 1
    };

    service.getDonorRoutineLogic(50, 0).subscribe(response => {
      expect(response.data).toEqual(mockSessionResults);
      expect(response.total).toBe(1);
      done();
    });

    const req = httpMock.expectOne(request =>
      request.url.includes('api/v1/donor-routine-logic/50/0')
    );
    expect(req.request.method).toBe('POST');
    req.flush(apiResponse);
  });

  it('should get session results by session ID', (done) => {
    const sessionId = 'SESSION001';
    const apiResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: mockSessionResults,
      total: 1
    };

    service.getSessionResults(sessionId).subscribe(response => {
      expect(response.sessionId).toBe(sessionId);
      expect(response.results).toEqual(mockSessionResults);
      expect(response.totalDonors).toBe(1);
      done();
    });

    const req = httpMock.expectOne(request =>
      request.url.includes(`api/v1/donor-routine-logic/session/${sessionId}`)
    );
    expect(req.request.method).toBe('GET');
    req.flush(apiResponse);
  });

  it('should get session results array by session ID', (done) => {
    const sessionId = 'SESSION001';
    const apiResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: mockSessionResults,
      total: 1
    };

    service.getSessionResultsBySessionId(sessionId).subscribe(response => {
      expect(response).toEqual(mockSessionResults);
      done();
    });

    const req = httpMock.expectOne(request =>
      request.url.includes(`api/v1/donor-routine-logic/session/${sessionId}`)
    );
    expect(req.request.method).toBe('GET');
    req.flush(apiResponse);
  });




  it('should calculate grade counts correctly', (done) => {
    const sessionId = 'SESSION001';
    const multiGradeResults: SessionResult[] = [
      { ...mockSessionResults[0], grade: 1 },
      { ...mockSessionResults[0], grade: 2, donorId: 'D002' },
      { ...mockSessionResults[0], grade: 3, donorId: 'D003' },
      { ...mockSessionResults[0], grade: 4, donorId: 'D004' },
      { ...mockSessionResults[0], grade: 5, donorId: 'D005' }
    ];

    const apiResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: multiGradeResults,
      total: 5
    };

    service.getSessionResults(sessionId).subscribe(response => {
      expect(response.totalDonors).toBe(5);
      expect(response.grade1Count).toBe(1);
      expect(response.grade2Count).toBe(1);
      expect(response.grade3Count).toBe(1);
      expect(response.grade4Count).toBe(1);
      expect(response.grade5Count).toBe(1);
      done();
    });

    const req = httpMock.expectOne(request =>
      request.url.includes(`api/v1/donor-routine-logic/session/${sessionId}`)
    );
    req.flush(apiResponse);
  });

  it('should handle session with only grade 1 results', (done) => {
    const sessionId = 'SESSION001';
    const apiResponse = {
      success: true,
      message: 'Success',
      statusCode: 200,
      data: mockSessionResults,
      total: 1
    };

    service.getSessionResults(sessionId).subscribe(response => {
      expect(response.grade1Count).toBe(1);
      expect(response.grade2Count).toBe(0);
      expect(response.grade3Count).toBe(0);
      expect(response.grade4Count).toBe(0);
      expect(response.grade5Count).toBe(0);
      done();
    });

    const req = httpMock.expectOne(request =>
      request.url.includes(`api/v1/donor-routine-logic/session/${sessionId}`)
    );
    req.flush(apiResponse);
  });
});
