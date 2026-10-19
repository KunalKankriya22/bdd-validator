import { TestBed } from '@angular/core/testing';
import { DefineDonationProceduresService } from './define-donation-procedures.service';
import { ApiService } from '@shared/services/api.service';
import { of, throwError } from 'rxjs';
import moment from 'moment';
import {
  DefineDonationProceduresModel,
  DefineDonationProceduresParamsDto,
  CreateDonationProcedureDto,
  UpdateDonationProcedureDto
} from '../models/define-donation-procedures.model';

describe('DefineDonationProceduresService', () => {
  let service: DefineDonationProceduresService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  // Use relative dates for test stability
  const tomorrow = moment().add(1, 'days').toDate();
  const nextMonth = moment().add(1, 'month').toDate();
  const nextYear = moment().add(1, 'year').toDate();

  const mockDonationProceduresData: DefineDonationProceduresModel[] = [
    {
      donationType: 'WB',
      donationTypeDescription: 'Whole Blood',
      procedureCode: 'P001',
      procedureCodeDescription: 'Standard Collection',
      effectiveDate: tomorrow,
      terminationDate: null
    },
    {
      donationType: 'PL',
      donationTypeDescription: 'Platelets',
      procedureCode: 'P002',
      procedureCodeDescription: 'Apheresis Collection',
      effectiveDate: nextMonth,
      terminationDate: nextYear
    }
  ];

  const mockResponse = {
    success: true,
    data: mockDonationProceduresData,
    total: 2
  };

  beforeEach(() => {
    mockApiService = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        DefineDonationProceduresService,
        { provide: ApiService, useValue: mockApiService }
      ]
    });

    service = TestBed.inject(DefineDonationProceduresService);
  });

  describe('getDefineDonationProcedures', () => {





    it('should work with different take and skip values', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));
      const params: DefineDonationProceduresParamsDto = {};

      service.getDefineDonationProcedures(50, 100, params).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure\/50\/100/),
          params
        );
        done();
      });
    });

  });

  describe('getFilterDropdownValues', () => {
    const mockFilterResponse = {
      data: [{
        donationTypes: [
          { key: 'WB', value: 'Whole Blood' },
          { key: 'PL', value: 'Platelets' }
        ],
        procedureCodes: [
          { key: 'P001', value: 'Standard Collection' },
          { key: 'P002', value: 'Apheresis Collection' }
        ]
      }]
    };


    it('should return filter dropdown values', (done) => {
      mockApiService.get.and.returnValue(of(mockFilterResponse));

      service.getFilterDropdownValues().subscribe(result => {
        expect(result.donationTypes.length).toBe(2);
        expect(result.procedureCodes.length).toBe(2);
        expect(result.donationTypes[0].key).toBe('WB');
        expect(result.procedureCodes[0].key).toBe('P001');
        done();
      });
    });


    it('should handle error when fetching filter dropdown values', (done) => {
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getFilterDropdownValues().subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should log error to console when fetching filter values fails', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getFilterDropdownValues().subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching filter dropdown values:',
            error
          );
          done();
        }
      });
    });
  });

  describe('getLookupDropdownValues', () => {
    const mockLookupResponse = {
      data: [{
        donationTypes: [
          { key: 'WB', value: 'Whole Blood' },
          { key: 'PL', value: 'Platelets' }
        ],
        procedureCodes: [
          { key: 'P001', value: 'Standard Collection' },
          { key: 'P002', value: 'Apheresis Collection' }
        ]
      }]
    };




    it('should handle error when fetching lookup dropdown values', (done) => {
      const error = new Error('API Error');
      mockApiService.get.and.returnValue(throwError(() => error));

      service.getLookupDropdownValues('TST').subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should log error to console for getDefineDonationProcedures', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.getDefineDonationProcedures(25, 0, {}).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith(
            'Error fetching define donation procedures data:',
            error
          );
          done();
        }
      });
    });
  });

  describe('API Endpoint Construction', () => {
    it('should construct correct endpoint for getDefineDonationProcedures', (done) => {
      mockApiService.post.and.returnValue(of(mockResponse));

      service.getDefineDonationProcedures(10, 5, {}).subscribe(() => {
        const calledEndpoint = mockApiService.post.calls.mostRecent().args[0];
        expect(calledEndpoint).toContain('10');
        expect(calledEndpoint).toContain('5');
        done();
      });
    });

  });

  describe('addDonationProcedure', () => {
    const effectiveDate = moment().add(2, 'days').toISOString();
    const addPayload: CreateDonationProcedureDto = {
      donationType: 'WB',
      procedureCodes: ['P001', 'P002'],
      effectiveDate: effectiveDate,
      terminationDate: null
    };

    it('should call apiService.post with correct endpoint and payload', (done) => {
      const mockAddResponse = { success: true, message: 'Added successfully' };
      mockApiService.post.and.returnValue(of(mockAddResponse));

      service.addDonationProcedure(addPayload).subscribe(() => {
        expect(mockApiService.post).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure$/),
          addPayload
        );
        done();
      });
    });


    it('should handle error when adding donation procedure', (done) => {
      const error = new Error('Conflict: Donation procedure already exists');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addDonationProcedure(addPayload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should log error to console when adding fails', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.post.and.returnValue(throwError(() => error));

      service.addDonationProcedure(addPayload).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith('Error adding donation procedure:', error);
          done();
        }
      });
    });


  });

  describe('updateDonationProcedure', () => {
    const effectiveDate = moment().add(2, 'days').toISOString();
    const terminationDate = moment().add(1, 'year').toISOString();
    const updatePayload: UpdateDonationProcedureDto = {
      donationType: 'WB',
      procedureCode: 'P001',
      effectiveDate: effectiveDate,
      terminationDate: terminationDate
    };

    it('should call apiService.put with correct endpoint and payload', (done) => {
      const mockUpdateResponse = { success: true, message: 'Updated successfully' };
      mockApiService.put.and.returnValue(of(mockUpdateResponse));

      service.updateDonationProcedure(updatePayload).subscribe(() => {
        expect(mockApiService.put).toHaveBeenCalledWith(
          jasmine.stringMatching(/donation-procedure$/),
          updatePayload
        );
        done();
      });
    });


    it('should handle error when updating donation procedure', (done) => {
      const error = new Error('Not Found: Donation procedure does not exist');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateDonationProcedure(updatePayload).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          done();
        }
      });
    });

    it('should log error to console when updating fails', (done) => {
      const consoleSpy = spyOn(console, 'error');
      const error = new Error('API Error');
      mockApiService.put.and.returnValue(throwError(() => error));

      service.updateDonationProcedure(updatePayload).subscribe({
        error: () => {
          expect(consoleSpy).toHaveBeenCalledWith('Error updating donation procedure:', error);
          done();
        }
      });
    });


  });
});
