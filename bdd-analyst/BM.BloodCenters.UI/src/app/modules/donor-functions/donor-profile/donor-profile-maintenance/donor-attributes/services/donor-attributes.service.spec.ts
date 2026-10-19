import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';
import moment from 'moment';

import { DonorAttributesService } from './donor-attributes.service';
import { environment } from '../../../../../../../environments/environment';
import { API } from '../../../../../../core/constants/api.constants';
import { HeaderService } from '../../../../../../shared/services/header.service';
import { LoginService } from '../../../../../../shared/services/login.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  DonorDemographics,
  DonorInterdiction,
  PropertyLookup,
  BulkUpsertRequest,
  BulkUpsertResponse
} from '../models/donor-attributes.model';

describe('DonorAttributesService', () => {
  let service: DonorAttributesService;
  let httpMock: HttpTestingController;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;

  const mockDonorId = '1234567890';

  const mockDemographics: DonorDemographics = {
    donorId: mockDonorId,
    firstName: 'John',
    lastName: 'Doe',
    middleName: 'M',
    dateOfBirth: '1990-01-15',
    ssn: '123-45-6789',
    bloodType: 'O+',
    gender: 'M'
  };

  const mockActiveAttributes: DonorInterdiction[] = [
    {
      donorId: mockDonorId,
      interCode: 'ATTR1',
      interDesc: 'Test Attribute 1',
      effDate: '2024-01-01',
      chapterId: 'CH01',
      interType: 'PROPR',
      termDate: null,
      insertUser: 'USER01',
      isActive: true
    }
  ];

  const mockAllAttributes: DonorInterdiction[] = [
    ...mockActiveAttributes,
    {
      donorId: mockDonorId,
      interCode: 'ATTR2',
      interDesc: 'Test Attribute 2',
      effDate: '2024-02-01',
      chapterId: 'CH01',
      interType: 'PROPR',
      termDate: '2024-06-01',
      insertUser: 'USER02',
      isActive: false
    }
  ];

  const mockProperties: PropertyLookup[] = [
    { interCode: 'ATTR1', interDesc: 'Test Attribute 1', interType: 'PROPR', viewLevel: 1 },
    { interCode: 'ATTR2', interDesc: 'Test Attribute 2', interType: 'PROPR', viewLevel: 2 }
  ];

  beforeEach(() => {
    headerServiceSpy = createMockHeaderService();
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    loginServiceSpy.getStoredUsername.and.returnValue('testuser');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        DonorAttributesService,
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy }
      ]
    });

    service = TestBed.inject(DonorAttributesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });


  describe('getDonorDemographics', () => {
    it('should fetch donor demographics', () => {
      service.getDonorDemographics(mockDonorId).subscribe((demographics) => {
        expect(demographics).toEqual(mockDemographics);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, item: mockDemographics, data: null, statusCode: 200, message: '' });
    });

    it('should parse header-based demographics with name parts', () => {
      service.getDonorDemographics(mockDonorId).subscribe((demographics) => {
        expect(demographics.lastName).toBe('Doe');
        expect(demographics.firstName).toBe('John');
        expect(demographics.dateOfBirth).toBe('1990-01-15');
        expect(demographics.gender).toBe('M');
        expect(demographics.bloodType).toBe('O+');
        expect(demographics.donorId).toBe(mockDonorId);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        item: {
          donorId: mockDonorId,
          header: {
            name: 'Doe, John',
            dateOfBirth: '1990-01-15',
            sex: 'M',
            abo: 'O+'
          }
        },
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should handle header name with no comma (last name only)', () => {
      service.getDonorDemographics(mockDonorId).subscribe((demographics) => {
        expect(demographics.lastName).toBe('Smith');
        expect(demographics.firstName).toBe('');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        item: {
          donorId: mockDonorId,
          header: {
            name: 'Smith',
            dateOfBirth: '1985-06-15',
            sex: 'F',
            abo: 'A-'
          }
        },
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should handle header with empty name string', () => {
      service.getDonorDemographics(mockDonorId).subscribe((demographics) => {
        expect(demographics.lastName).toBe('');
        expect(demographics.firstName).toBe('');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        item: {
          donorId: mockDonorId,
          header: {
            name: '',
            dateOfBirth: '1985-06-15',
            sex: 'F',
            abo: 'A-'
          }
        },
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should handle header with null name', () => {
      service.getDonorDemographics(mockDonorId).subscribe((demographics) => {
        expect(demographics.lastName).toBe('');
        expect(demographics.firstName).toBe('');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        item: {
          donorId: mockDonorId,
          header: {
            name: null,
            dateOfBirth: '1985-06-15',
            sex: 'F',
            abo: 'A-'
          }
        },
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should use data field when item is null', () => {
      service.getDonorDemographics(mockDonorId).subscribe((demographics) => {
        expect(demographics).toEqual(mockDemographics);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, item: null, data: mockDemographics, statusCode: 200, message: '' });
    });

    it('should handle array raw data by using first element', () => {
      service.getDonorDemographics(mockDonorId).subscribe((demographics) => {
        expect(demographics.donorId).toBe(mockDonorId);
        expect(demographics.lastName).toBe('Doe');
        expect(demographics.firstName).toBe('John');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        item: [{
          donorId: mockDonorId,
          header: {
            name: 'Doe, John',
            dateOfBirth: '1990-01-15',
            sex: 'M',
            abo: 'O+'
          }
        }],
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should return record as-is when no header is present', () => {
      const recordWithoutHeader = { donorId: mockDonorId, firstName: 'Jane', lastName: 'Smith', dateOfBirth: '1992-03-20', gender: 'F' };
      service.getDonorDemographics(mockDonorId).subscribe((demographics) => {
        expect(demographics).toEqual(recordWithoutHeader as any);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, item: recordWithoutHeader, data: null, statusCode: 200, message: '' });
    });

    it('should throw error when response success is false with message', () => {
      service.getDonorDemographics(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Donor not found');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, item: null, data: null, statusCode: 404, message: 'Donor not found' });
    });

    it('should throw default error when response success is false with no message', () => {
      service.getDonorDemographics(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Failed to load donor demographics');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, item: null, data: null, statusCode: 500, message: '' });
    });

    it('should handle HTTP error', () => {
      service.getDonorDemographics(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBeTruthy();
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_DONOR_DEMOGRAPHICS(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getAllAttributes', () => {
    it('should fetch all attributes successfully', () => {
      service.getAllAttributes(mockDonorId).subscribe((attributes) => {
        expect(attributes).toEqual(mockAllAttributes);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockAllAttributes, statusCode: 200, message: '' });
    });

    it('should flatten nested array data', () => {
      const nestedData = [[mockActiveAttributes[0]], [mockAllAttributes[1]]];
      service.getAllAttributes(mockDonorId).subscribe((attributes) => {
        expect(attributes.length).toBe(2);
        expect(attributes[0].interCode).toBe('ATTR1');
        expect(attributes[1].interCode).toBe('ATTR2');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: nestedData, statusCode: 200, message: '' });
    });

    it('should return empty array when data is null', () => {
      service.getAllAttributes(mockDonorId).subscribe((attributes) => {
        expect(attributes).toEqual([]);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: null, statusCode: 200, message: '' });
    });

    it('should return empty array when data is not an array', () => {
      service.getAllAttributes(mockDonorId).subscribe((attributes) => {
        expect(attributes).toEqual([]);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: 'not-an-array', statusCode: 200, message: '' });
    });

    it('should throw error when response success is false with message', () => {
      service.getAllAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Access denied');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, data: null, statusCode: 403, message: 'Access denied' });
    });

    it('should throw default error when response success is false with no message', () => {
      service.getAllAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Failed to load attributes');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, data: null, statusCode: 500, message: '' });
    });

    it('should handle HTTP error', () => {
      service.getAllAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Server error occurred');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('getActiveAttributes', () => {
    it('should fetch active attributes', () => {
      service.getActiveAttributes(mockDonorId).subscribe((result) => {
        expect(result.attributes).toEqual(mockActiveAttributes);
        expect(result.hasOtherAttributes).toBe(true);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockActiveAttributes, statusCode: 200, message: '', hasOtherAttributes: true });
    });

    it('should return hasOtherAttributes as false when explicitly false', () => {
      service.getActiveAttributes(mockDonorId).subscribe((result) => {
        expect(result.attributes).toEqual(mockActiveAttributes);
        expect(result.hasOtherAttributes).toBe(false);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: mockActiveAttributes, statusCode: 200, message: '', hasOtherAttributes: false });
    });

    it('should infer hasOtherAttributes from attributes length when not a boolean', () => {
      service.getActiveAttributes(mockDonorId).subscribe((result) => {
        expect(result.attributes).toEqual(mockActiveAttributes);
        expect(result.hasOtherAttributes).toBe(true);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: mockActiveAttributes, statusCode: 200, message: '' });
    });

    it('should infer hasOtherAttributes as false when attributes are empty and field is missing', () => {
      service.getActiveAttributes(mockDonorId).subscribe((result) => {
        expect(result.attributes).toEqual([]);
        expect(result.hasOtherAttributes).toBe(false);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [], statusCode: 200, message: '' });
    });

    it('should throw error when response success is false with message', () => {
      service.getActiveAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Donor not found');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, data: null, statusCode: 404, message: 'Donor not found' });
    });

    it('should throw default error when response success is false with no message', () => {
      service.getActiveAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Failed to load active attributes');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, data: null, statusCode: 500, message: '' });
    });

    it('should handle HTTP error', () => {
      service.getActiveAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBeTruthy();
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });

    it('should handle nested array data in active attributes', () => {
      const nestedData = [[mockActiveAttributes[0]]];
      service.getActiveAttributes(mockDonorId).subscribe((result) => {
        expect(result.attributes.length).toBe(1);
        expect(result.attributes[0].interCode).toBe('ATTR1');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ACTIVE_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: nestedData, statusCode: 200, message: '', hasOtherAttributes: true });
    });
  });

  describe('getTerminatedAttributes', () => {
    it('should fetch all attributes and filter terminated', () => {
      service.getTerminatedAttributes(mockDonorId).subscribe((attributes) => {
        expect(attributes.length).toBe(1);
        expect(attributes[0].interCode).toBe('ATTR2');
        expect(attributes[0].isActive).toBeFalse();
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockAllAttributes, statusCode: 200, message: '' });
    });

    it('should return empty array when all attributes are active', () => {
      service.getTerminatedAttributes(mockDonorId).subscribe((attributes) => {
        expect(attributes.length).toBe(0);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: mockActiveAttributes, statusCode: 200, message: '' });
    });

    it('should return empty array when no attributes exist', () => {
      service.getTerminatedAttributes(mockDonorId).subscribe((attributes) => {
        expect(attributes.length).toBe(0);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [], statusCode: 200, message: '' });
    });

    it('should propagate error from getAllAttributes', () => {
      service.getTerminatedAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Failed to load attributes');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, data: null, statusCode: 500, message: '' });
    });
  });

  describe('getValidProperties', () => {
    it('should fetch valid property codes', () => {
      service.getValidProperties().subscribe((properties) => {
        expect(properties).toEqual(mockProperties);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_VALID_PROPERTIES}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({ success: true, data: mockProperties, statusCode: 200, message: '' });
    });

    it('should throw error when response success is false with message', () => {
      service.getValidProperties().subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Unauthorized');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_VALID_PROPERTIES}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, data: null, statusCode: 401, message: 'Unauthorized' });
    });

    it('should throw default error when response success is false with no message', () => {
      service.getValidProperties().subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Failed to load valid properties');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_VALID_PROPERTIES}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, data: null, statusCode: 500, message: '' });
    });

    it('should handle HTTP error', () => {
      service.getValidProperties().subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBeTruthy();
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_VALID_PROPERTIES}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });

    it('should return empty array when data is null', () => {
      service.getValidProperties().subscribe((properties) => {
        expect(properties).toEqual([]);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_VALID_PROPERTIES}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: null, statusCode: 200, message: '' });
    });
  });

  describe('addAttribute', () => {
    it('should add a new attribute', () => {
      const newAttribute: Partial<DonorInterdiction> = {
        interCode: 'ATTR3',
        effDate: '2024-03-01',
        interType: 'PROPR'
      };

      service.addAttribute(mockDonorId, newAttribute).subscribe((result) => {
        expect(result.interCode).toBe('ATTR3');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.donorId).toBe(mockDonorId);
      expect(req.request.body.interCode).toBe('ATTR3');
      expect(req.request.body.effDate).toBe('2024-03-01');
      req.flush({
        success: true,
        item: { donorId: mockDonorId, interCode: 'ATTR3', effDate: '2024-03-01', isActive: true },
        data: null,
        statusCode: 201,
        message: ''
      });
    });

    it('should add attribute with termDate', () => {
      const newAttribute: Partial<DonorInterdiction> = {
        interCode: 'ATTR4',
        effDate: '2024-03-01',
        termDate: '2024-12-31',
        interType: 'PROPR'
      };

      service.addAttribute(mockDonorId, newAttribute).subscribe((result) => {
        expect(result.interCode).toBe('ATTR4');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`;
      const req = httpMock.expectOne(url);
      expect(req.request.body.termDate).toBe('2024-12-31');
      req.flush({
        success: true,
        item: { donorId: mockDonorId, interCode: 'ATTR4', effDate: '2024-03-01', termDate: '2024-12-31', isActive: false },
        data: null,
        statusCode: 201,
        message: ''
      });
    });

    it('should set termDate to null when not provided', () => {
      const newAttribute: Partial<DonorInterdiction> = {
        interCode: 'ATTR5',
        effDate: '2024-03-01',
        interType: 'PROPR'
      };

      service.addAttribute(mockDonorId, newAttribute).subscribe();

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`;
      const req = httpMock.expectOne(url);
      expect(req.request.body.termDate).toBeNull();
      req.flush({
        success: true,
        item: { donorId: mockDonorId, interCode: 'ATTR5', effDate: '2024-03-01', isActive: true },
        data: null,
        statusCode: 201,
        message: ''
      });
    });

    it('should set interType to null when not provided', () => {
      const newAttribute: Partial<DonorInterdiction> = {
        interCode: 'ATTR5',
        effDate: '2024-03-01'
      };

      service.addAttribute(mockDonorId, newAttribute).subscribe();

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`;
      const req = httpMock.expectOne(url);
      expect(req.request.body.interType).toBeNull();
      req.flush({
        success: true,
        item: { donorId: mockDonorId, interCode: 'ATTR5', effDate: '2024-03-01', isActive: true },
        data: null,
        statusCode: 201,
        message: ''
      });
    });

    it('should use data field when item is null', () => {
      const newAttribute: Partial<DonorInterdiction> = {
        interCode: 'ATTR3',
        effDate: '2024-03-01',
        interType: 'PROPR'
      };

      const returnedData = { donorId: mockDonorId, interCode: 'ATTR3', effDate: '2024-03-01', isActive: true };

      service.addAttribute(mockDonorId, newAttribute).subscribe((result) => {
        expect(result).toEqual(returnedData as any);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        item: null,
        data: returnedData,
        statusCode: 201,
        message: ''
      });
    });

    it('should throw error when response success is false with message', () => {
      const newAttribute: Partial<DonorInterdiction> = {
        interCode: 'ATTR3',
        effDate: '2024-03-01',
        interType: 'PROPR'
      };

      service.addAttribute(mockDonorId, newAttribute).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Duplicate attribute');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, item: null, data: null, statusCode: 409, message: 'Duplicate attribute' });
    });

    it('should throw default error when response success is false with no message', () => {
      const newAttribute: Partial<DonorInterdiction> = {
        interCode: 'ATTR3',
        effDate: '2024-03-01',
        interType: 'PROPR'
      };

      service.addAttribute(mockDonorId, newAttribute).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Failed to add attribute');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, item: null, data: null, statusCode: 500, message: '' });
    });

    it('should handle HTTP error', () => {
      const newAttribute: Partial<DonorInterdiction> = {
        interCode: 'ATTR3',
        effDate: '2024-03-01',
        interType: 'PROPR'
      };

      service.addAttribute(mockDonorId, newAttribute).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBeTruthy();
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.ADD_ATTRIBUTE}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('updateAttribute', () => {
    it('should update an existing attribute', () => {
      const updates: Partial<DonorInterdiction> = {
        termDate: '2024-06-01'
      };

      service.updateAttribute(mockDonorId, 'ATTR1', '2024-01-01', updates).subscribe((result) => {
        expect(result.termDate).toBe('2024-06-01');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.UPDATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.termDate).toBe('2024-06-01');
      req.flush({
        success: true,
        item: { ...mockActiveAttributes[0], termDate: '2024-06-01' },
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should set termDate to null when not provided in attribute', () => {
      const updates: Partial<DonorInterdiction> = {};

      service.updateAttribute(mockDonorId, 'ATTR1', '2024-01-01', updates).subscribe((result) => {
        expect(result).toBeTruthy();
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.UPDATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.body.termDate).toBeNull();
      req.flush({
        success: true,
        item: mockActiveAttributes[0],
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should format effDate for the API', () => {
      const updates: Partial<DonorInterdiction> = { termDate: '2024-06-15' };

      service.updateAttribute(mockDonorId, 'ATTR1', '2024-01-15', updates).subscribe();

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.UPDATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.body.effDate).toBe('2024-01-15');
      req.flush({
        success: true,
        item: mockActiveAttributes[0],
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should use data field when item is null', () => {
      const updates: Partial<DonorInterdiction> = { termDate: '2024-06-01' };
      const returnedData = { ...mockActiveAttributes[0], termDate: '2024-06-01' };

      service.updateAttribute(mockDonorId, 'ATTR1', '2024-01-01', updates).subscribe((result) => {
        expect(result).toEqual(returnedData);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.UPDATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        item: null,
        data: returnedData,
        statusCode: 200,
        message: ''
      });
    });

    it('should throw error when response success is false with message', () => {
      const updates: Partial<DonorInterdiction> = { termDate: '2024-06-01' };

      service.updateAttribute(mockDonorId, 'ATTR1', '2024-01-01', updates).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Attribute not found');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.UPDATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, item: null, data: null, statusCode: 404, message: 'Attribute not found' });
    });

    it('should throw default error when response success is false with no message', () => {
      const updates: Partial<DonorInterdiction> = { termDate: '2024-06-01' };

      service.updateAttribute(mockDonorId, 'ATTR1', '2024-01-01', updates).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Failed to update attribute');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.UPDATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, item: null, data: null, statusCode: 500, message: '' });
    });

    it('should handle HTTP error', () => {
      const updates: Partial<DonorInterdiction> = { termDate: '2024-06-01' };

      service.updateAttribute(mockDonorId, 'ATTR1', '2024-01-01', updates).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBeTruthy();
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.UPDATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });
  });

  describe('terminateAttribute', () => {
    it('should terminate an attribute successfully', () => {
      service.terminateAttribute(mockDonorId, 'ATTR1', '2024-01-01', '2024-07-01').subscribe((result) => {
        expect(result.termDate).toBe('2024-07-01');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.TERMINATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.termDate).toBe('2024-07-01');
      req.flush({
        success: true,
        item: { ...mockActiveAttributes[0], termDate: '2024-07-01', isActive: false },
        data: null,
        statusCode: 200,
        message: ''
      });
    });

    it('should use data field when item is null', () => {
      const returnedData = { ...mockActiveAttributes[0], termDate: '2024-07-01', isActive: false };

      service.terminateAttribute(mockDonorId, 'ATTR1', '2024-01-01', '2024-07-01').subscribe((result) => {
        expect(result).toEqual(returnedData);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.TERMINATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        item: null,
        data: returnedData,
        statusCode: 200,
        message: ''
      });
    });

    it('should throw error when response success is false with message', () => {
      service.terminateAttribute(mockDonorId, 'ATTR1', '2024-01-01', '2024-07-01').subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Cannot terminate this attribute');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.TERMINATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, item: null, data: null, statusCode: 400, message: 'Cannot terminate this attribute' });
    });

    it('should throw default error when response success is false with no message', () => {
      service.terminateAttribute(mockDonorId, 'ATTR1', '2024-01-01', '2024-07-01').subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Failed to terminate attribute');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.TERMINATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: false, item: null, data: null, statusCode: 500, message: '' });
    });

    it('should handle HTTP error', () => {
      service.terminateAttribute(mockDonorId, 'ATTR1', '2024-01-01', '2024-07-01').subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBeTruthy();
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.TERMINATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });

    it('should format termDate using moment', () => {
      service.terminateAttribute(mockDonorId, 'ATTR1', '2024-01-01', '2024-07-15').subscribe();

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.TERMINATE_ATTRIBUTE(mockDonorId, 'ATTR1')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.body.termDate).toBe('2024-07-15');
      req.flush({
        success: true,
        item: { ...mockActiveAttributes[0], termDate: '2024-07-15', isActive: false },
        data: null,
        statusCode: 200,
        message: ''
      });
    });
  });

  describe('bulkUpsert', () => {
    const mockBulkRequest: BulkUpsertRequest = {
      records: [
        { auditKey: null, interCode: 'ATTR1', effDate: '2024-01-01', termDate: null, interType: 'PROPR' },
        { auditKey: 1, interCode: 'ATTR2', effDate: '2024-02-01', termDate: '2024-06-01', interType: 'PROPR' }
      ]
    };

    const mockBulkResponse: BulkUpsertResponse = {
      totalRecords: 2,
      createdCount: 1,
      updatedCount: 1,
      failureCount: 0,
      successCount: 2,
      errors: [],
      success: true,
      message: null,
      errorCode: null
    };

    it('should perform bulk upsert successfully', () => {
      service.bulkUpsert(mockDonorId, mockBulkRequest).subscribe((result) => {
        expect(result.totalRecords).toBe(2);
        expect(result.createdCount).toBe(1);
        expect(result.updatedCount).toBe(1);
        expect(result.failureCount).toBe(0);
        expect(result.successCount).toBe(2);
        expect(result.errors).toEqual([]);
        expect(result.success).toBe(true);
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.BULK_UPSERT(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockBulkRequest);
      req.flush(mockBulkResponse);
    });

    it('should handle bulk upsert with partial failures', () => {
      const responseWithErrors: BulkUpsertResponse = {
        totalRecords: 2,
        createdCount: 1,
        updatedCount: 0,
        failureCount: 1,
        successCount: 1,
        errors: [{ recordIndex: 1, donorId: mockDonorId, interCode: 'ATTR2', errorMessage: 'Invalid date' }],
        success: false,
        message: 'Partial failure',
        errorCode: null
      };

      service.bulkUpsert(mockDonorId, mockBulkRequest).subscribe((result) => {
        expect(result.failureCount).toBe(1);
        expect(result.errors.length).toBe(1);
        expect(result.errors[0].errorMessage).toBe('Invalid date');
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.BULK_UPSERT(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(responseWithErrors);
    });

    it('should handle HTTP error on bulk upsert', () => {
      service.bulkUpsert(mockDonorId, mockBulkRequest).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Server error occurred');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.BULK_UPSERT(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });

    it('should handle 400 validation error on bulk upsert', () => {
      service.bulkUpsert(mockDonorId, mockBulkRequest).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Validation failed');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.BULK_UPSERT(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('handleError', () => {
    it('should return error.error.message when present', () => {
      service.getAllAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Custom server error message');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush({ message: 'Custom server error message' }, { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should return "Validation failed" for status 400', () => {
      service.getAllAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Validation failed');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 400, statusText: 'Bad Request' });
    });

    it('should return "Resource not found" for status 404', () => {
      service.getAllAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Resource not found');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 404, statusText: 'Not Found' });
    });

    it('should return "Server error occurred" for status 500', () => {
      service.getAllAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBe('Server error occurred');
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 500, statusText: 'Server Error' });
    });

    it('should return error.message for other statuses without error.error.message', () => {
      service.getAllAttributes(mockDonorId).subscribe({
        next: () => fail('should have errored'),
        error: (err: Error) => {
          expect(err.message).toBeTruthy();
        }
      });

      const url = `${environment.apiUrl}${API.DONOR_FUNCTIONS.DONOR_ATTRIBUTES.GET_ALL_ATTRIBUTES(mockDonorId)}`;
      const req = httpMock.expectOne(url);
      req.flush(null, { status: 503, statusText: 'Service Unavailable' });
    });
  });
});
