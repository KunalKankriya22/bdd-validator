import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { AccessClassService } from './access-class.service';
import { ApiService } from '../../../../shared/services/api.service';
import { AttachedUser } from '../models/access-class.model';

describe('AccessClassService', () => {
  let service: AccessClassService;
  let httpMock: HttpTestingController;
  let apiService: ApiService;

  const BASE_URL = '/api/v1/define-access-class';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AccessClassService,
        ApiService
      ]
    });

    service = TestBed.inject(AccessClassService);
    apiService = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /* ============================
     BASIC CREATION
  ============================ */

  /* ============================
     SUCCESS CASE
  ============================ */

  it('should call GET attached users API with correct URL', () => {
    const mockUsers: AttachedUser[] = [
      {
        userId: 'ADH',
        name: 'Test User',
        level: 1,
        effectiveDate: '01-JAN-2020',
        terminationDate: '01-JAN-2025'
      }
    ];

    service.getAttachedUsers('00ISU').subscribe(users => {
      expect(Array.isArray(users)).toBe(true);
      if (Array.isArray(users)) {
        expect(users.length).toBe(1);
        expect(users[0].userId).toBe('ADH');
      }
    });

    const req = httpMock.expectOne(
      `${BASE_URL}/00ISU/attached-users`
    );

    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });

  /* ============================
     EMPTY RESPONSE
  ============================ */


  /* ============================
     WRAPPED RESPONSES
  ============================ */

  it('should handle wrapped response with items', () => {
    const wrappedResponse = {
      items: [
        {
          userId: 'DBM',
          name: 'Wrapped User',
          level: 2,
          effectiveDate: '01-JAN-2019',
          terminationDate: '01-JAN-2024'
        }
      ]
    };

    service.getAttachedUsers('00ISU').subscribe(response => {
      expect(Array.isArray(response)).toBe(false);
      if (!Array.isArray(response)) {
        expect(response.items).toBeDefined();
        expect(response.items?.length).toBe(1);
        expect(response.items?.[0].userId).toBe('DBM');
      }
    });

    const req = httpMock.expectOne(
      `${BASE_URL}/00ISU/attached-users`
    );

    expect(req.request.method).toBe('GET');
    req.flush(wrappedResponse);
  });

  it('should handle wrapped response with data', () => {
    const wrappedResponse = {
      data: [
        {
          userId: 'XYZ',
          name: 'Data Wrapper User',
          level: 3,
          effectiveDate: '01-JAN-2018',
          terminationDate: '01-JAN-2023'
        }
      ]
    };

    service.getAttachedUsers('00ISU').subscribe(response => {
      expect(Array.isArray(response)).toBe(false);
      if (!Array.isArray(response)) {
        expect(response.data).toBeDefined();
        expect(response.data?.length).toBe(1);
        expect(response.data?.[0].userId).toBe('XYZ');
      }
    });

    const req = httpMock.expectOne(
      `${BASE_URL}/00ISU/attached-users`
    );

    expect(req.request.method).toBe('GET');
    req.flush(wrappedResponse);
  });

  /* ============================
     API ERROR
  ============================ */

  it('should propagate error when API returns error', () => {
    service.getAttachedUsers('00ISU').subscribe({
      next: () => {
        fail('Expected an error, but got success response');
      },
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne(
      `${BASE_URL}/00ISU/attached-users`
    );

    req.flush(
      { message: 'Internal Server Error' },
      { status: 500, statusText: 'Internal Server Error' }
    );
  });
});
