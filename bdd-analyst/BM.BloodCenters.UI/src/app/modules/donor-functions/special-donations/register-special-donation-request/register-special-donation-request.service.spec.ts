import { TestBed } from '@angular/core/testing';
import { RegisterSpecialDonationRequestService } from './register-special-donation-request.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { of } from 'rxjs';

describe('RegisterSpecialDonationRequestService', () => {
  let service: RegisterSpecialDonationRequestService;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    TestBed.configureTestingModule({
      providers: [
        RegisterSpecialDonationRequestService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });
    service = TestBed.inject(RegisterSpecialDonationRequestService);
    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('search', () => {
    it('should POST to search endpoint with request body', (done) => {
      const request = { searchText: 'Smith', pageNumber: 1, pageSize: 25 } as any;
      const mockResponse = { data: [], total: 0 };
      apiService.post.and.returnValue(of(mockResponse));

      service.search(request).subscribe((result) => {
        expect(apiService.post).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.SEARCH, request);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('getPatientDetail', () => {
    it('should GET patient detail by patId', (done) => {
      const mockResponse = { item: { patId: 'PAT001' } };
      apiService.get.and.returnValue(of(mockResponse));

      service.getPatientDetail('PAT001').subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.GET_DETAIL('PAT001'));
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('createPatient', () => {
    it('should POST to create patient endpoint', (done) => {
      const request = { patLastName: 'Doe', patFirstName: 'John', sex: 'M', patType: 'SDI', status: 'A' } as any;
      const mockResponse = { data: ['PAT002'] };
      apiService.post.and.returnValue(of(mockResponse));

      service.createPatient(request).subscribe((result) => {
        expect(apiService.post).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.CREATE_PATIENT, request);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('updatePatient', () => {
    it('should PUT to update patient endpoint with patId', (done) => {
      const request = { patLastName: 'Doe', patFirstName: 'Jane' } as any;
      const mockResponse = { success: true };
      apiService.put.and.returnValue(of(mockResponse));

      service.updatePatient('PAT001', request).subscribe((result) => {
        expect(apiService.put).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.UPDATE_PATIENT('PAT001'), request);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('createSurgery', () => {
    it('should POST to create surgery endpoint', (done) => {
      const request = { patId: 'PAT001', surgDate: '2028-06-01', phyId: 'PHY001', shipId: 'SHIP01', unitsRequired: '2' } as any;
      const mockResponse = { data: ['SURG001'] };
      apiService.post.and.returnValue(of(mockResponse));

      service.createSurgery(request).subscribe((result) => {
        expect(apiService.post).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.CREATE_SURGERY, request);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('updateSurgery', () => {
    it('should PUT to update surgery endpoint with surgId', (done) => {
      const request = { surgDate: '2028-06-01', phyId: 'PHY001', shipId: 'SHIP01', unitsRequired: '3' } as any;
      const mockResponse = { success: true };
      apiService.put.and.returnValue(of(mockResponse));

      service.updateSurgery('SURG001', request).subscribe((result) => {
        expect(apiService.put).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.UPDATE_SURGERY('SURG001'), request);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('addDonor', () => {
    it('should POST to add donor endpoint', (done) => {
      const request = { surgId: 'SURG001', lastName: 'Smith', firstName: 'Jane' } as any;
      const mockResponse = { success: true };
      apiService.post.and.returnValue(of(mockResponse));

      service.addDonor(request).subscribe((result) => {
        expect(apiService.post).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.ADD_DONOR, request);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('deleteDonor', () => {
    it('should DELETE donor with surgId and seqNo', (done) => {
      const mockResponse = { success: true };
      apiService.delete.and.returnValue(of(mockResponse));

      service.deleteDonor('SURG001', 3).subscribe((result) => {
        expect(apiService.delete).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.DELETE_DONOR('SURG001', 3));
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('getHospitals', () => {
    it('should GET hospitals without search param', (done) => {
      const mockResponse = { data: [{ code: 'H001', description: 'Hospital A' }] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getHospitals().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.LOOKUP_HOSPITALS);
        expect(result).toEqual(mockResponse);
        done();
      });
    });

    it('should GET hospitals with search param', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getHospitals('test').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          `${API.SPECIAL_DONATION_REQUEST.LOOKUP_HOSPITALS}?search=test`
        );
        done();
      });
    });

    it('should encode search param', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getHospitals('a & b').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          `${API.SPECIAL_DONATION_REQUEST.LOOKUP_HOSPITALS}?search=a%20%26%20b`
        );
        done();
      });
    });
  });

  describe('getConsignees', () => {
    it('should GET consignees without params', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getConsignees().subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.LOOKUP_CONSIGNEES);
        done();
      });
    });

    it('should GET consignees with hospitalId', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getConsignees('H001').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          `${API.SPECIAL_DONATION_REQUEST.LOOKUP_CONSIGNEES}?hospitalId=H001`
        );
        done();
      });
    });

    it('should GET consignees with hospitalId and search', (done) => {
      apiService.get.and.returnValue(of({ data: [] }));

      service.getConsignees('H001', 'test').subscribe(() => {
        expect(apiService.get).toHaveBeenCalledWith(
          `${API.SPECIAL_DONATION_REQUEST.LOOKUP_CONSIGNEES}?hospitalId=H001&search=test`
        );
        done();
      });
    });
  });

  describe('getSurgeryTypes', () => {
    it('should GET surgery types', (done) => {
      const mockResponse = { data: [{ code: 'ST1', description: 'Type 1' }] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getSurgeryTypes().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.LOOKUP_SURGERY_TYPES);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('getPatientTypes', () => {
    it('should GET patient types', (done) => {
      const mockResponse = { data: [{ code: 'PT1', description: 'Type 1' }] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getPatientTypes().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.LOOKUP_PATIENT_TYPES);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('getProductTypes', () => {
    it('should GET product types', (done) => {
      const mockResponse = { data: [{ code: 'PR1', description: 'Product 1' }] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getProductTypes().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.LOOKUP_PRODUCT_TYPES);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('getShipLocations', () => {
    it('should GET ship locations from consignees endpoint', (done) => {
      const mockResponse = { data: [{ code: 'SH1', description: 'Ship 1' }] };
      apiService.get.and.returnValue(of(mockResponse));

      service.getShipLocations().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.LOOKUP_CONSIGNEES);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('getPhysicians', () => {
    it('should POST to physician search with ActiveOnly flag', (done) => {
      const mockResponse = { data: [{ phyId: 'PHY001', lastName: 'Smith' }] };
      apiService.post.and.returnValue(of(mockResponse));

      service.getPhysicians().subscribe((result) => {
        expect(apiService.post).toHaveBeenCalledWith(API.PHYSICIAN.SEARCH, { ActiveOnly: true });
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('generatePatientId', () => {
    it('should GET generated patient ID', (done) => {
      const mockResponse = { data: ['PAT999'] };
      apiService.get.and.returnValue(of(mockResponse));

      service.generatePatientId().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.GENERATE_PAT_ID);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });

  describe('generateSurgeryId', () => {
    it('should GET generated surgery ID', (done) => {
      const mockResponse = { data: ['SURG999'] };
      apiService.get.and.returnValue(of(mockResponse));

      service.generateSurgeryId().subscribe((result) => {
        expect(apiService.get).toHaveBeenCalledWith(API.SPECIAL_DONATION_REQUEST.GENERATE_SURG_ID);
        expect(result).toEqual(mockResponse);
        done();
      });
    });
  });
});
