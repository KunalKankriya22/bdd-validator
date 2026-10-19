import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DefineMaxDonationsService } from './define-max-donations.service';
import { LoginService } from '@shared/services/login.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DefineMaxDonationsModel,
  DefineMaxDonationsDto,
  UpdateDefineMaxDonationsDto,
  DefineMaxDonationsParamsDto
} from '../models/define-max-donations.model';

describe('DefineMaxDonationsService', () => {
  let service: DefineMaxDonationsService;
  let httpMock: HttpTestingController;
  let loginService: jasmine.SpyObj<LoginService>;

  beforeEach(() => {
    const loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DefineMaxDonationsService,
        { provide: LoginService, useValue: loginServiceSpy }
      ]
    });
    service = TestBed.inject(DefineMaxDonationsService);
    httpMock = TestBed.inject(HttpTestingController);
    loginService = TestBed.inject(LoginService) as jasmine.SpyObj<LoginService>;

    // Default mock return value for getStoredUsername
    loginService.getStoredUsername.and.returnValue('TEST_USER');
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getDefineMaxDonations', () => {
    it('should fetch max donations data with pagination', () => {
      const take = 10;
      const skip = 0;
      const params: DefineMaxDonationsParamsDto = {
        searchKeyword: 'AL'
      };

      const mockResponse = {
        success: true,
        message: 'Successfully fetched the define max donations records',
        statusCode: 200,
        data: [
          {
            donationType: 'AL',
            donationDescription: 'Allogeneic',
            procedureGroup: 'PLATE',
            procedureDescription: 'Platelets',
            maxDonations: 2,
            interval: 7,
            effDate: '1997-01-01T00:00:00',
            programId: 'VDIEGPRD',
            chapterId: 'ALL'
          }
        ],
        total: 1
      };

      service.getDefineMaxDonations(take, skip, params).subscribe(result => {
        expect(result.data.length).toBe(1);
        expect(result.totalRecords).toBe(1);
        expect(result.data[0].donationType).toBe('AL');
        expect(result.data[0].maxDonations).toBe(2);
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.DEFINE_MAX_DONATIONS(take, skip));
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(params);
      req.flush(mockResponse);
    });


  });

  describe('addMaxDonation', () => {
    it('should add new max donation configuration with loggedInUserName param', () => {
      const payload: DefineMaxDonationsDto = {
        donationType: 'AL',
        procedureGroup: 'PLATE',
        maxDonations: 2,
        interval: 7,
        effDate: '2024-01-01T12:00:00.000Z',
        termDate: ''
      };

      const mockResponse = {
        success: true,
        message: 'Max donation added successfully',
        statusCode: 201
      };

      service.addMaxDonation(payload).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(201);
      });

      const req = httpMock.expectOne(request => {
        return request.url.includes(API.APPLICATION_ADMIN.ADD_MAX_DONATION) &&
               request.params.has('loggedInUserName');
      });
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.params.get('loggedInUserName')).toBe('TEST_USER');
      expect(loginService.getStoredUsername).toHaveBeenCalled();
      req.flush(mockResponse);
    });

  });

  describe('updateMaxDonation', () => {
    it('should update existing max donation configuration', () => {
      const payload: UpdateDefineMaxDonationsDto = {
        donationType: 'AL',
        procedureGroup: 'PLATE',
        maxDonations: 3,
        originalInterval: 7,
        interval: 14,
        effDate: '2024-01-01T12:00:00.000Z',
        termDate: ''
      };

      const mockResponse = {
        success: true,
        message: 'Max donation updated successfully',
        statusCode: 200
      };

      service.updateMaxDonation(payload).subscribe(result => {
        expect(result.success).toBe(true);
        expect(result.statusCode).toBe(200);
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.UPDATE_MAX_DONATION);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush(mockResponse);
    });

  });

  describe('getDonationTypes', () => {
    it('should fetch donation types', () => {
      const mockResponse = {
        success: true,
        data: [
          { donationType: 'AL', donationTypeDescription: 'Allogeneic' },
          { donationType: 'AU', donationTypeDescription: 'Autologous' },
          { donationType: 'DI', donationTypeDescription: 'Directed' }
        ],
        total: 3
      };

      service.getDonationTypes().subscribe(result => {
        expect(result.length).toBe(3);
        expect(result[0].donationType).toBe('AL');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.MAX_DONATIONS_DONATION_TYPES);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty donation types', () => {
      const mockResponse = {
        success: true,
        data: [],
        total: 0
      };

      service.getDonationTypes().subscribe(result => {
        expect(result.length).toBe(0);
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.MAX_DONATIONS_DONATION_TYPES);
      req.flush(mockResponse);
    });
  });

  describe('getDonationTypesFilter', () => {
    it('should fetch donation types for filter dropdown', () => {
      const mockResponse = {
        success: true,
        data: [
          { donationType: '99' },
          { donationType: 'AL' },
          { donationType: 'AU' }
        ],
        total: 3
      };

      service.getDonationTypesFilter().subscribe(result => {
        expect(result.length).toBe(3);
        expect(result[0].donationType).toBe('99');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.MAX_DONATIONS_DONATION_TYPES_FILTER);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty donation types filter', () => {
      const mockResponse = {
        success: true,
        data: [],
        total: 0
      };

      service.getDonationTypesFilter().subscribe(result => {
        expect(result.length).toBe(0);
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.MAX_DONATIONS_DONATION_TYPES_FILTER);
      req.flush(mockResponse);
    });
  });

  describe('getProcedureGroups', () => {
    it('should fetch procedure groups', () => {
      const mockResponse = {
        success: true,
        data: [
          { procedureGroup: 'PLASM' },
          { procedureGroup: 'WHTCL' },
          { procedureGroup: 'REDCL' },
          { procedureGroup: 'PLATE' }
        ],
        total: 4
      };

      service.getProcedureGroups().subscribe(result => {
        expect(result.length).toBe(4);
        expect(result[0].procedureGroup).toBe('PLASM');
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.MAX_DONATIONS_PROCEDURE_GROUPS);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty procedure groups', () => {
      const mockResponse = {
        success: true,
        data: [],
        total: 0
      };

      service.getProcedureGroups().subscribe(result => {
        expect(result.length).toBe(0);
      });

      const req = httpMock.expectOne(API.APPLICATION_ADMIN.MAX_DONATIONS_PROCEDURE_GROUPS);
      req.flush(mockResponse);
    });
  });
});
