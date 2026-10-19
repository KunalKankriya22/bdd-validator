import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { InternationalAddressService } from './international-address.service';
import { ApiService } from './api.service';
import { ValidMasterCodesService } from './valid-master-codes.service';
import { API } from '../../core/constants/api.constants';
import {
  InternationalAddressModel,
  CountryModel,
  SaveInternationalAddressRequest,
  ValidateInternationalAddressRequest
} from '../models/international-address.model';

describe('InternationalAddressService', () => {
  let service: InternationalAddressService;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockValidMasterCodesService: jasmine.SpyObj<ValidMasterCodesService>;

  /** Helper: builds an InternationalAddressModel with all fields null/empty
   *  except the ones supplied in the partial override. */
  function buildAddress(overrides: Partial<InternationalAddressModel> = {}): InternationalAddressModel {
    return {
      streetName: '',
      addr1: null,
      addr2: null,
      addr3: null,
      country: '',
      postalCode: null,
      homePhoneNo: null,
      workPhoneNo: null,
      workPhoneExt: null,
      mobilePhoneNo: null,
      faxNo: null,
      email: null,
      intlAddrFlag: 'N',
      modifiedFlag: 'N',
      ...overrides
    };
  }

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post']);
    mockValidMasterCodesService = jasmine.createSpyObj('ValidMasterCodesService', ['getCountries', 'clearCache']);

    TestBed.configureTestingModule({
      providers: [
        InternationalAddressService,
        { provide: ApiService, useValue: mockApiService },
        { provide: ValidMasterCodesService, useValue: mockValidMasterCodesService }
      ]
    });

    service = TestBed.inject(InternationalAddressService);
  });

  // ===== getCountries =====

  describe('getCountries', () => {
    it('should delegate to ValidMasterCodesService.getCountries', () => {
      const mockCountries: CountryModel[] = [
        { code: 'USA', description: 'United States' },
        { code: 'CAN', description: 'Canada' }
      ];
      mockValidMasterCodesService.getCountries.and.returnValue(of(mockCountries));

      service.getCountries().subscribe(countries => {
        expect(countries).toEqual(mockCountries);
        expect(countries.length).toBe(2);
      });

      expect(mockValidMasterCodesService.getCountries).toHaveBeenCalledOnceWith();
    });

    it('should propagate errors from ValidMasterCodesService', (done: jest.DoneCallback) => {
      const error = new Error('Network error');
      mockValidMasterCodesService.getCountries.and.returnValue(throwError(() => error));

      service.getCountries().subscribe({
        next: () => fail('Expected error'),
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  // ===== validate =====

  describe('validate', () => {
    it('should call apiService.post with the correct URL and request body', (done: jest.DoneCallback) => {
      const request: ValidateInternationalAddressRequest = {
        streetName: '123 Main St',
        addr1: 'Suite 100',
        addr2: null,
        addr3: null,
        addr4: null,
        country: 'United States',
        postalCode: '12345',
        homePhoneNo: '1234567890',
        workPhoneNo: null,
        workPhoneExt: null,
        mobilePhoneNo: null,
        faxNo: null,
        email: 'test@example.com'
      };
      mockApiService.post.and.returnValue(of({ success: true, message: 'Validation passed' }));

      service.validate(request).subscribe(result => {
        expect(result).toEqual({ success: true, message: 'Validation passed' });
        expect(mockApiService.post).toHaveBeenCalledOnceWith(
          API.INTERNATIONAL_ADDRESS.VALIDATE,
          request
        );
        done();
      });
    });

    it('should propagate errors from the API', (done: jest.DoneCallback) => {
      const request: ValidateInternationalAddressRequest = {
        streetName: '',
        country: '',
      };
      const apiError = { status: 400, message: 'Validation failed' };
      mockApiService.post.and.returnValue(throwError(() => apiError));

      service.validate(request).subscribe({
        next: () => fail('Expected error'),
        error: (err) => {
          expect(err).toEqual(apiError);
          expect(mockApiService.post).toHaveBeenCalledOnceWith(
            API.INTERNATIONAL_ADDRESS.VALIDATE,
            request
          );
          done();
        }
      });
    });
  });

  // ===== saveAddress =====

  describe('saveAddress', () => {
    const buildSaveRequest = (overrides: Partial<SaveInternationalAddressRequest> = {}): SaveInternationalAddressRequest => ({
      address: buildAddress({
        streetName: '123 Main St',
        country: 'United States',
        postalCode: '12345',
        email: 'test@example.com',
        intlAddrFlag: 'Y',
        modifiedFlag: 'Y'
      }),
      targetTable: 'SPONSOR_CONTACT',
      recordKeyValues: ['1', '2'],
      chapterId: 'CH01',
      existingAddressId: null,
      ...overrides
    });

    it('should call apiService.post with the correct URL and request body', (done: jest.DoneCallback) => {
      const request = buildSaveRequest();
      mockApiService.post.and.returnValue(of({ success: true }));

      service.saveAddress(request).subscribe(result => {
        expect(result).toEqual({ success: true });
        expect(mockApiService.post).toHaveBeenCalledOnceWith(API.INTERNATIONAL_ADDRESS.SAVE, request);
        done();
      });
    });

    it('should propagate errors from the API', (done: jest.DoneCallback) => {
      const request = buildSaveRequest();
      const apiError = { status: 500, message: 'Internal server error' };
      mockApiService.post.and.returnValue(throwError(() => apiError));

      service.saveAddress(request).subscribe({
        next: () => fail('Expected error'),
        error: (err) => {
          expect(err).toEqual(apiError);
          expect(mockApiService.post).toHaveBeenCalledOnceWith(API.INTERNATIONAL_ADDRESS.SAVE, request);
          done();
        }
      });
    });
  });

  // ===== getInternationalAddress / setInternationalAddress =====

  describe('setInternationalAddress / getInternationalAddress', () => {
    it('should store and return the address via the signal', () => {
      const address = buildAddress({ streetName: '123 Main St', country: 'United States', intlAddrFlag: 'Y', modifiedFlag: 'Y' });

      service.setInternationalAddress(address);

      expect(service.getInternationalAddress()).toEqual(address);
    });

    it('should emit the address on the observable', (done: jest.DoneCallback) => {
      const address = buildAddress({ streetName: '456 Oak Ave', country: 'Canada', postalCode: 'A1B 2C3', intlAddrFlag: 'Y', modifiedFlag: 'Y' });

      service.setInternationalAddress(address);

      service.getInternationalAddress$().subscribe(value => {
        expect(value).toEqual(address);
        done();
      });
    });

    it('should return null when no address has been set', () => {
      expect(service.getInternationalAddress()).toBeNull();
    });

    it('should overwrite a previously set address', () => {
      const first = buildAddress({ streetName: 'First', country: 'US' });
      const second = buildAddress({ streetName: 'Second', country: 'CA' });

      service.setInternationalAddress(first);
      service.setInternationalAddress(second);

      expect(service.getInternationalAddress()).toEqual(second);
    });
  });

  // ===== getInternationalAddress$ =====

  describe('getInternationalAddress$', () => {
    it('should emit null as the initial value', (done: jest.DoneCallback) => {
      service.getInternationalAddress$().subscribe(value => {
        expect(value).toBeNull();
        done();
      });
    });

    it('should emit each address set in sequence', () => {
      const emissions: (InternationalAddressModel | null)[] = [];

      service.getInternationalAddress$().subscribe(value => {
        emissions.push(value);
      });

      const addr1 = buildAddress({ streetName: 'First' });
      const addr2 = buildAddress({ streetName: 'Second' });

      service.setInternationalAddress(addr1);
      service.setInternationalAddress(addr2);
      service.setInternationalAddress(null);

      // Initial null + 3 updates
      expect(emissions.length).toBe(4);
      expect(emissions[0]).toBeNull();
      expect(emissions[1]).toEqual(addr1);
      expect(emissions[2]).toEqual(addr2);
      expect(emissions[3]).toBeNull();
    });
  });

  // ===== isModified =====

  describe('isModified', () => {
    it('should return false initially', () => {
      expect(service.isModified()).toBeFalse();
    });

    it('should return true after setting an address with values', () => {
      const address = buildAddress({ streetName: '123 Main St', country: 'United States', intlAddrFlag: 'Y', modifiedFlag: 'Y' });

      service.setInternationalAddress(address);

      expect(service.isModified()).toBeTrue();
    });

    it('should return false after setting null', () => {
      service.setInternationalAddress(buildAddress({ streetName: 'Test', country: 'Test', intlAddrFlag: 'Y', modifiedFlag: 'Y' }));
      expect(service.isModified()).toBeTrue();

      service.setInternationalAddress(null);

      expect(service.isModified()).toBeFalse();
    });

    it('should return false when address has all empty/null values', () => {
      const emptyAddress = buildAddress();

      service.setInternationalAddress(emptyAddress);

      expect(service.isModified()).toBeFalse();
    });

    // ---- hasAnyValue branch coverage: each individual field ----

    it('should return true when only streetName has a value', () => {
      service.setInternationalAddress(buildAddress({ streetName: 'Main St' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only addr1 has a value', () => {
      service.setInternationalAddress(buildAddress({ addr1: 'Suite 100' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only addr2 has a value', () => {
      service.setInternationalAddress(buildAddress({ addr2: 'Floor 2' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only addr3 has a value', () => {
      service.setInternationalAddress(buildAddress({ addr3: 'Building C' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only country has a value', () => {
      service.setInternationalAddress(buildAddress({ country: 'Canada' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only postalCode has a value', () => {
      service.setInternationalAddress(buildAddress({ postalCode: '12345' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only homePhoneNo has a value', () => {
      service.setInternationalAddress(buildAddress({ homePhoneNo: '5551234567' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only workPhoneNo has a value', () => {
      service.setInternationalAddress(buildAddress({ workPhoneNo: '5559876543' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only workPhoneExt has a value', () => {
      service.setInternationalAddress(buildAddress({ workPhoneExt: '1234' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only mobilePhoneNo has a value', () => {
      service.setInternationalAddress(buildAddress({ mobilePhoneNo: '5550001111' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only faxNo has a value', () => {
      service.setInternationalAddress(buildAddress({ faxNo: '5552223333' }));
      expect(service.isModified()).toBeTrue();
    });

    it('should return true when only email has a value', () => {
      service.setInternationalAddress(buildAddress({ email: 'test@example.com' }));
      expect(service.isModified()).toBeTrue();
    });
  });

  // ===== clearInternationalAddress =====

  describe('clearInternationalAddress', () => {
    it('should reset the address signal to null', () => {
      service.setInternationalAddress(buildAddress({ streetName: '123 Main St', country: 'US', intlAddrFlag: 'Y', modifiedFlag: 'Y' }));

      service.clearInternationalAddress();

      expect(service.getInternationalAddress()).toBeNull();
    });

    it('should reset the modified flag to false', () => {
      service.setInternationalAddress(buildAddress({ streetName: '123 Main St', country: 'US', intlAddrFlag: 'Y', modifiedFlag: 'Y' }));
      expect(service.isModified()).toBeTrue();

      service.clearInternationalAddress();

      expect(service.isModified()).toBeFalse();
    });

    it('should emit null on the observable', (done: jest.DoneCallback) => {
      const address = buildAddress({ streetName: 'To be cleared', country: 'US' });
      service.setInternationalAddress(address);

      service.clearInternationalAddress();

      service.getInternationalAddress$().subscribe(value => {
        expect(value).toBeNull();
        done();
      });
    });

    it('should be safe to call when already cleared', () => {
      service.clearInternationalAddress();

      expect(service.getInternationalAddress()).toBeNull();
      expect(service.isModified()).toBeFalse();
    });
  });

  // ===== createEmptyAddress =====

  describe('createEmptyAddress', () => {
    it('should return a model with empty/null defaults', () => {
      const empty = service.createEmptyAddress();

      expect(empty.streetName).toBe('');
      expect(empty.addr1).toBeNull();
      expect(empty.addr2).toBeNull();
      expect(empty.addr3).toBeNull();
      expect(empty.country).toBe('');
      expect(empty.postalCode).toBeNull();
      expect(empty.homePhoneNo).toBeNull();
      expect(empty.workPhoneNo).toBeNull();
      expect(empty.workPhoneExt).toBeNull();
      expect(empty.mobilePhoneNo).toBeNull();
      expect(empty.faxNo).toBeNull();
      expect(empty.email).toBeNull();
      expect(empty.intlAddrFlag).toBe('N');
      expect(empty.modifiedFlag).toBe('N');
    });

    it('should return a new object each time', () => {
      const empty1 = service.createEmptyAddress();
      const empty2 = service.createEmptyAddress();

      expect(empty1).toEqual(empty2);
      expect(empty1).not.toBe(empty2);
    });
  });
});
