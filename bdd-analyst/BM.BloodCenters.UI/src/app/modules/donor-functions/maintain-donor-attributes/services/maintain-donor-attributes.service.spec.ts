import { of, throwError } from 'rxjs';

import { MaintainDonorAttributesService } from './maintain-donor-attributes.service';
import { ApiService } from '@shared/services/api.service';
import {
  MaintainDonorAttributeDonorDetails,
  MaintainDonorAttribute,
  MaintainDonorAttributeProperty,
  CreateMaintainDonorAttributeRequest,
  UpdateMaintainDonorAttributeRequest,
  BulkTerminateMaintainDonorAttributeRequest,
} from '../models/maintain-donor-attributes.models';

describe('MaintainDonorAttributesService', () => {
  let service: MaintainDonorAttributesService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDonorDetails: MaintainDonorAttributeDonorDetails = {
    donorId: 'DON12345',
    name: 'Smith, John',
    dateOfBirth: '1985-06-15',
    gender: 'Male',
    street: '123 Main St',
    suiteApt: 'Apt 4B',
    city: 'Boston',
    state: 'MA',
    zip: '02101',
    otherAttributes: 3,
    internationalAddress: null,
  };

  const mockAttributes: MaintainDonorAttribute[] = [
    {
      interCode: 'ATTR01',
      interDesc: 'Test Attribute',
      interType: 'TYPE_A',
      effDate: '2024-01-15',
      termDate: null,
      insertUser: 'USER01',
    },
    {
      interCode: 'ATTR02',
      interDesc: 'Another Attribute',
      interType: 'TYPE_B',
      effDate: '2024-03-20',
      termDate: '2024-12-31',
      insertUser: 'USER02',
    },
  ];

  const mockProperties: MaintainDonorAttributeProperty[] = [
    { interCode: 'PROP01', interDesc: 'Property One', interType: 'TYPE_A' },
    { interCode: 'PROP02', interDesc: 'Property Two', interType: 'TYPE_B' },
  ];

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    service = new MaintainDonorAttributesService(apiServiceSpy as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDonorDetails', () => {
    it('should return donor details from API when response has item wrapper', (done) => {
      apiServiceSpy.get.and.returnValue(of({ item: mockDonorDetails }));

      service.getDonorDetails('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDonorDetails);
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('/maintain-donor-attribute/DON12345/details')
          );
          done();
        },
      });
    });

    it('should handle response without item wrapper', (done) => {
      apiServiceSpy.get.and.returnValue(of(mockDonorDetails));

      service.getDonorDetails('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual(mockDonorDetails);
          done();
        },
      });
    });

    it('should propagate errors on getDonorDetails failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Donor not found')));

      service.getDonorDetails('DON12345').subscribe({
        error: (err) => {
          expect(err.message).toBe('Donor not found');
          done();
        },
      });
    });
  });

  describe('getAttributes', () => {
    it('should return attributes from API', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockAttributes }));

      service.getAttributes('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual(mockAttributes);
          expect(result.length).toBe(2);
          done();
        },
      });
    });

    it('should return empty array when data is null or undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getAttributes('DON12345').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should pass showTerminated param with default value false', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockAttributes }));

      service.getAttributes('DON12345').subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1]?.params;
          expect(params).toBeDefined();
          expect(params.get('showTerminated')).toBe('false');
          done();
        },
      });
    });

    it('should pass showTerminated as true when specified', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockAttributes }));

      service.getAttributes('DON12345', true).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1]?.params;
          expect(params.get('showTerminated')).toBe('true');
          done();
        },
      });
    });

    it('should pass all optional filter params when provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockAttributes }));

      service.getAttributes(
        'DON12345',
        true,
        '2024-01-01',
        '2024-06-30',
        '2024-12-31',
        '2024-07-01',
        'search-term'
      ).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1]?.params;
          expect(params).toBeDefined();
          expect(params.get('showTerminated')).toBe('true');
          expect(params.get('effDateAfter')).toBe('2024-01-01');
          expect(params.get('effDateBefore')).toBe('2024-06-30');
          expect(params.get('termDateBefore')).toBe('2024-12-31');
          expect(params.get('termDateAfter')).toBe('2024-07-01');
          expect(params.get('search')).toBe('search-term');
          done();
        },
      });
    });

    it('should not include optional params when not provided', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockAttributes }));

      service.getAttributes('DON12345', false).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.get.calls.mostRecent().args;
          const params = callArgs[1]?.params;
          expect(params.get('effDateAfter')).toBeNull();
          expect(params.get('effDateBefore')).toBeNull();
          expect(params.get('termDateBefore')).toBeNull();
          expect(params.get('termDateAfter')).toBeNull();
          expect(params.get('search')).toBeNull();
          done();
        },
      });
    });

    it('should call the correct API endpoint with donor ID', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: [] }));

      service.getAttributes('DON12345').subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('/maintain-donor-attribute/DON12345/attributes'),
            jasmine.objectContaining({ params: jasmine.anything() })
          );
          done();
        },
      });
    });

    it('should propagate errors on getAttributes failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Attributes fetch failed')));

      service.getAttributes('DON12345').subscribe({
        error: (err) => {
          expect(err.message).toBe('Attributes fetch failed');
          done();
        },
      });
    });
  });

  describe('getPropertiesDropdown', () => {
    it('should return properties from API', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockProperties }));

      service.getPropertiesDropdown().subscribe({
        next: (result) => {
          expect(result).toEqual(mockProperties);
          expect(result.length).toBe(2);
          done();
        },
      });
    });

    it('should return empty array when data is null or undefined', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: null }));

      service.getPropertiesDropdown().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        },
      });
    });

    it('should call the correct API endpoint', (done) => {
      apiServiceSpy.get.and.returnValue(of({ data: mockProperties }));

      service.getPropertiesDropdown().subscribe({
        next: () => {
          expect(apiServiceSpy.get).toHaveBeenCalledWith(
            jasmine.stringContaining('/maintain-donor-attribute/properties/dropdown')
          );
          done();
        },
      });
    });

    it('should propagate errors on getPropertiesDropdown failure', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Properties fetch failed')));

      service.getPropertiesDropdown().subscribe({
        error: (err) => {
          expect(err.message).toBe('Properties fetch failed');
          done();
        },
      });
    });
  });

  describe('createAttribute', () => {
    it('should create an attribute successfully', (done) => {
      const request: CreateMaintainDonorAttributeRequest = {
        donorId: 'DON12345',
        interCode: 'ATTR01',
        effDate: '2024-01-15',
        termDate: '2024-12-31',
      };

      apiServiceSpy.post.and.returnValue(of(void 0));

      service.createAttribute('DON12345', request).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            jasmine.stringContaining('/maintain-donor-attribute/DON12345/attributes'),
            request
          );
          done();
        },
      });
    });

    it('should create an attribute without optional termDate', (done) => {
      const request: CreateMaintainDonorAttributeRequest = {
        donorId: 'DON12345',
        interCode: 'ATTR01',
        effDate: '2024-01-15',
      };

      apiServiceSpy.post.and.returnValue(of(void 0));

      service.createAttribute('DON12345', request).subscribe({
        next: () => {
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            jasmine.stringContaining('/maintain-donor-attribute/DON12345/attributes'),
            request
          );
          done();
        },
      });
    });

    it('should propagate errors on createAttribute failure', (done) => {
      const request: CreateMaintainDonorAttributeRequest = {
        donorId: 'DON12345',
        interCode: 'ATTR01',
        effDate: '2024-01-15',
      };

      apiServiceSpy.post.and.returnValue(throwError(() => new Error('Create failed')));

      service.createAttribute('DON12345', request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Create failed');
          done();
        },
      });
    });
  });

  describe('updateAttribute', () => {
    it('should update an attribute successfully', (done) => {
      const request: UpdateMaintainDonorAttributeRequest = {
        termDate: '2024-12-31',
      };

      apiServiceSpy.put.and.returnValue(of(void 0));

      service.updateAttribute('DON12345', 'ATTR01', '2024-01-15', request).subscribe({
        next: () => {
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            jasmine.stringContaining('/maintain-donor-attribute/DON12345/attributes/ATTR01/2024-01-15'),
            request
          );
          done();
        },
      });
    });

    it('should propagate errors on updateAttribute failure', (done) => {
      const request: UpdateMaintainDonorAttributeRequest = {
        termDate: '2024-12-31',
      };

      apiServiceSpy.put.and.returnValue(throwError(() => new Error('Update failed')));

      service.updateAttribute('DON12345', 'ATTR01', '2024-01-15', request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Update failed');
          done();
        },
      });
    });
  });

  describe('bulkTerminate', () => {
    it('should bulk terminate attributes successfully', (done) => {
      const request: BulkTerminateMaintainDonorAttributeRequest = {
        items: [
          { interCode: 'ATTR01', effDate: '2024-01-15', interType: 'TYPE_A' },
          { interCode: 'ATTR02', effDate: '2024-03-20' },
        ],
      };

      apiServiceSpy.put.and.returnValue(of(void 0));

      service.bulkTerminate('DON12345', request).subscribe({
        next: () => {
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            jasmine.stringContaining('/maintain-donor-attribute/DON12345/attributes/bulk-terminate'),
            request
          );
          done();
        },
      });
    });

    it('should propagate errors on bulkTerminate failure', (done) => {
      const request: BulkTerminateMaintainDonorAttributeRequest = {
        items: [
          { interCode: 'ATTR01', effDate: '2024-01-15' },
        ],
      };

      apiServiceSpy.put.and.returnValue(throwError(() => new Error('Bulk terminate failed')));

      service.bulkTerminate('DON12345', request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Bulk terminate failed');
          done();
        },
      });
    });
  });
});
