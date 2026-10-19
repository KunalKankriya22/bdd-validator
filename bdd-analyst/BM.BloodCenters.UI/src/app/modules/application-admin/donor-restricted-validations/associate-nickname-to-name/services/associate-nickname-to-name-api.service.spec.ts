import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AssociateNicknameToNameApiService } from './associate-nickname-to-name-api.service';
import { API } from '../../../../../core/constants/api.constants';

describe('AssociateNicknameToNameApiService', () => {
  let service: AssociateNicknameToNameApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AssociateNicknameToNameApiService]
    });
    service = TestBed.inject(AssociateNicknameToNameApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getAssociateNicknames', () => {
    it('should retrieve associate nicknames with filters', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [
          {
            nickName: 'BOB',
            firstName: 'ROBERT',
            effDate: '2024-01-01',
            termDate: null,
            programId: 'TEST',
            insertDate: '2024-01-01',
            insertUser: 'admin',
            auditKey: 1
          }
        ],
        total: 1
      };

      const filter = { searchItem: 'BOB' };

      service.getAssociateNicknames(10, 0, filter).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.data[0].nickName).toBe('BOB');
        expect(response.total).toBe(1);
      });

      const req = httpMock.expectOne('/api/v1/associate-nickname-to-name/10/0');
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should send filters with new date structure', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const filter = {
        effectiveDate: '2024-01-01T00:00:00.000Z',
        effectivePeriod: 'AFTER',
        terminationDate: '2024-12-31T00:00:00.000Z',
        terminationPeriod: 'BEFORE'
      };

      service.getAssociateNicknames(25, 0, filter).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne('/api/v1/associate-nickname-to-name/25/0');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.effectiveDate).toBe('2024-01-01T00:00:00.000Z');
      expect(req.request.body.effectivePeriod).toBe('AFTER');
      expect(req.request.body.terminationDate).toBe('2024-12-31T00:00:00.000Z');
      expect(req.request.body.terminationPeriod).toBe('BEFORE');
      req.flush(mockResponse);
    });

    it('should send sort parameter A for ascending', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const filter = { sort: 'A' };

      service.getAssociateNicknames(25, 0, filter).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne('/api/v1/associate-nickname-to-name/25/0');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.sort).toBe('A');
      req.flush(mockResponse);
    });

    it('should send sort parameter D for descending', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        total: 0
      };

      const filter = { sort: 'D' };

      service.getAssociateNicknames(25, 0, filter).subscribe(response => {
        expect(response).toBeDefined();
      });

      const req = httpMock.expectOne('/api/v1/associate-nickname-to-name/25/0');
      expect(req.request.method).toBe('POST');
      expect(req.request.body.sort).toBe('D');
      req.flush(mockResponse);
    });
  });

  describe('getAssociateNicknameByKey', () => {
    it('should retrieve a single associate nickname by composite key', () => {
      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        item: {
          nickName: 'BOB',
          firstName: 'ROBERT',
          effDate: '2024-01-01',
          termDate: null,
          programId: 'TEST',
          insertDate: '2024-01-01',
          insertUser: 'admin',
          auditKey: 1
        },
        total: 1
      };

      service.getAssociateNicknameByKey('BOB', 'ROBERT').subscribe(data => {
        expect(data.nickName).toBe('BOB');
        expect(data.firstName).toBe('ROBERT');
      });

      const req = httpMock.expectOne('/api/v1/associate-nickname-to-name/BOB/ROBERT');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createAssociateNickname', () => {
    it('should create a new associate nickname', () => {
      const mockResponse = {
        success: true,
        message: 'Created successfully',
        statusCode: 201,
        total: 1
      };

      const createRequest = {
        nickName: 'BOB',
        firstName: 'ROBERT',
        effDate: '2024-01-01T00:00:00',
        termDate: null
      };

      service.createAssociateNickname(createRequest).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Created successfully');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.ASSOCIATE_NICKNAME_TO_NAME_CREATE);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(createRequest);
      req.flush(mockResponse);
    });
  });

  describe('updateAssociateNickname', () => {
    it('should update an existing associate nickname', () => {
      const mockResponse = {
        success: true,
        message: 'Updated successfully',
        statusCode: 200,
        total: 1
      };

      const updateRequest = {
        nickName: 'BOB',
        firstName: 'ROBERT',
        effDate: '2024-01-01T00:00:00',
        termDate: '2024-12-31T00:00:00'
      };

      service.updateAssociateNickname('BOB', 'ROBERT', updateRequest).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Updated successfully');
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/associate-nickname-to-name/BOB/ROBERT'));
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(updateRequest);
      req.flush(mockResponse);
    });
  });
});
