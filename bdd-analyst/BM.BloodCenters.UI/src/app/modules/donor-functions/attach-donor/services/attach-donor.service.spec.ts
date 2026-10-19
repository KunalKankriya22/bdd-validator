import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AttachDonorService } from './attach-donor.service';
import { ApiService } from '@shared/services/api.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  GradedDonorDto,
  GradedDonationDto,
  SelectDonorRequestDto,
  MarkDuplicateRequestDto,
  MarkFalseDuplicateRequestDto,
  ApiResponse
} from '../models/attach-donor.model';

describe('AttachDonorService', () => {
  let service: AttachDonorService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockGradedDonors: GradedDonorDto[] = [
    {
      transactionId: 'TXN001',
      donorId: 'DON12345',
      dgmId: 101,
      grade: 1,
      potentialDuplicateFlag: null,
      lastName: 'Thompson',
      firstName: 'Marvin',
      dateOfBirth: '1996-03-26T00:00:00Z',
      gender: 'M',
      chapterId: 'CH01',
      programId: 'DRUREHLD',
      lastNameMismatch: false,
      firstNameMismatch: false,
      dateOfBirthMismatch: false,
      genderMismatch: false
    },
    {
      transactionId: 'TXN001',
      donorId: 'DON67890',
      dgmId: 102,
      grade: 4,
      potentialDuplicateFlag: null,
      lastName: 'Thompson',
      firstName: 'Shawn',
      dateOfBirth: '1996-03-26T00:00:00Z',
      gender: 'M',
      chapterId: 'CH01',
      programId: 'DRUREHLD',
      lastNameMismatch: false,
      firstNameMismatch: true,
      dateOfBirthMismatch: false,
      genderMismatch: false
    }
  ];

  const mockTransaction: GradedDonationDto = {
    transactionId: 'TXN001',
    unitId: 'W63332508I210.8',
    lastName: 'Thompson',
    firstName: 'Mark',
    dateOfBirth: '1996-03-26T00:00:00Z',
    gender: 'Male',
    chapterId: 'CH01',
    activeFlag: 'Y',
    programId: 'DRUREHLD',
    collectionDate: '2025-12-09T00:00:00Z',
    enteredBy: 'SIVA TEJA BOODETI'
  };

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put', 'delete']);
    const headerSpy = createMockHeaderService();

    // Set default mock return values
    TestBed.configureTestingModule({
      providers: [
        AttachDonorService,
        { provide: ApiService, useValue: apiSpy },
        { provide: HeaderService, useValue: headerSpy }
      ]
    });

    service = TestBed.inject(AttachDonorService);
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
  });


  describe('getGradedDonors', () => {
    it('should fetch graded donors successfully', (done) => {
      const response: ApiResponse<GradedDonorDto[]> = {
        success: true,
        message: 'Successfully fetched 2 graded donor matches.',
        statusCode: 200,
        data: mockGradedDonors
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getGradedDonors('TXN001').subscribe({
        next: (donors) => {
          expect(donors.length).toBe(2);
          expect(donors[0].donorId).toBe('DON12345');
          expect(donors[1].firstNameMismatch).toBeTrue();
          expect(apiServiceSpy.get).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });




  });

  describe('getTransaction', () => {
    it('should fetch transaction details successfully', (done) => {
      const response: ApiResponse<GradedDonationDto> = {
        success: true,
        message: 'Successfully fetched transaction details.',
        statusCode: 200,
        data: mockTransaction
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getTransaction('TXN001').subscribe({
        next: (transaction) => {
          expect(transaction.transactionId).toBe('TXN001');
          expect(transaction.unitId).toBe('W63332508I210.8');
          expect(transaction.lastName).toBe('Thompson');
          done();
        }
      });
    });


  });

  describe('getTransactionByUnit', () => {
    it('should fetch transaction details by unit ID successfully', (done) => {
      const response: ApiResponse<GradedDonationDto> = {
        success: true,
        message: 'Successfully fetched transaction details.',
        statusCode: 200,
        data: mockTransaction
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getTransactionByUnit('W63332508I210.8').subscribe({
        next: (transaction) => {
          expect(transaction.transactionId).toBe('TXN001');
          expect(transaction.unitId).toBe('W63332508I210.8');
          expect(transaction.lastName).toBe('Thompson');
          done();
        }
      });
    });

    it('should handle error when transaction not found for unit ID', (done) => {
      const response: ApiResponse<GradedDonationDto> = {
        success: false,
        message: 'Transaction not found for this Unit ID',
        statusCode: 404
      };

      apiServiceSpy.get.and.returnValue(of(response));

      service.getTransactionByUnit('INVALID_UNIT').subscribe({
        error: (error) => {
          expect(error).toBeTruthy();
          expect(error.message).toBe('Transaction not found for this Unit ID');
          done();
        }
      });
    });
  });

  describe('selectDonor', () => {
    it('should select donor successfully and include chapterId and selectedBy', (done) => {
      const request = {
        transactionId: 'TXN001',
        donorId: 'DON12345'
      };

      const response: ApiResponse<any> = {
        success: true,
        message: 'Donor selected successfully.',
        statusCode: 200,
        data: {
          transactionId: 'TXN001',
          donorId: 'DON12345'
        }
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.selectDonor(request).subscribe({
        next: (result) => {
          expect(result.data?.transactionId).toBe('TXN001');
          expect(result.data?.donorId).toBe('DON12345');
          // Verify that chapterId and selectedBy were added to the payload
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            '/api/v1/attach-donor/select-donor',
            jasmine.objectContaining({
              transactionId: 'TXN001',
              donorId: 'DON12345',
              chapterId: 'TST',
              selectedBy: 'testuser',
              confirmationScan: undefined
            })
          );
          done();
        }
      });
    });

    it('should handle validation error when transaction ID missing', (done) => {
      const request = {
        transactionId: '',
        donorId: 'DON12345'
      };

      const errorResponse = {
        error: {
          success: false,
          statusCode: 400,
          errorResponse: {
            errorCode: null,
            error: 'Transaction ID is required'
          },
          message: 'Transaction ID is required'
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.selectDonor(request).subscribe({
        error: (error) => {
          expect(error.message).toContain('Transaction ID is required');
          done();
        }
      });
    });

    it('should handle error when donor not found in graded list', (done) => {
      const request = {
        transactionId: 'TXN001',
        donorId: 'DON_INVALID'
      };

      const errorResponse = {
        error: {
          success: false,
          statusCode: 400,
          errorResponse: {
            errorCode: null,
            error: 'Donor not found in graded list'
          },
          message: 'Donor not found in graded list'
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.selectDonor(request).subscribe({
        error: (error) => {
          expect(error.message).toContain('Donor not found in graded list');
          done();
        }
      });
    });

    it('should map error code 16211 to user-friendly message', (done) => {
      const request = {
        transactionId: 'TXN001',
        donorId: 'DON12345'
      };

      const errorResponse = {
        error: {
          errorCode: '16211'
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.selectDonor(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Confirmation scan does not match donor ID');
          done();
        }
      });
    });
  });

  describe('markDuplicates', () => {
    it('should mark duplicates successfully and include chapterId', (done) => {
      const request = {
        primaryDonorId: 'DON12345',
        duplicateDonorIds: ['DON67890'],
        transactionId: 'TXN001'
      };

      const response: ApiResponse<any> = {
        success: true,
        message: 'Marked 2 donors as duplicates.',
        statusCode: 200,
        data: {
          transactionId: 'TXN001',
          donorCount: 2
        }
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.markDuplicates(request).subscribe({
        next: (result) => {
          expect(result.data?.donorCount).toBe(2);
          // Verify that chapterId was added to the payload
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            '/api/v1/attach-donor/mark-duplicates',
            jasmine.objectContaining({
              primaryDonorId: 'DON12345',
              duplicateDonorIds: ['DON67890'],
              transactionId: 'TXN001',
              chapterId: 'TST'
            })
          );
          done();
        }
      });
    });

    it('should validate minimum donors before API call', (done) => {
      const request = {
        primaryDonorId: 'DON12345',
        duplicateDonorIds: [],
        transactionId: 'TXN001'
      };

      service.markDuplicates(request).subscribe({
        error: (error) => {
          expect(error.message).toContain('At least 2 donors total');
          expect(apiServiceSpy.post).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('markFalseDuplicate', () => {
    it('should mark false duplicate successfully and include chapterId', (done) => {
      const request = {
        donorId: 'DON12345',
        transactionId: 'TXN001',
        comments: 'This is not a duplicate donor'
      };

      const response: ApiResponse<void> = {
        success: true,
        message: 'Donor marked as false duplicate.',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.markFalseDuplicate(request).subscribe({
        next: () => {
          // Verify that chapterId was added to the payload
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            '/api/v1/attach-donor/mark-false-duplicate',
            jasmine.objectContaining({
              donorId: 'DON12345',
              transactionId: 'TXN001',
              comments: 'This is not a duplicate donor',
              chapterId: 'TST'
            })
          );
          done();
        }
      });
    });

    it('should validate comments are required before API call', (done) => {
      const request = {
        donorId: 'DON12345',
        transactionId: 'TXN001',
        comments: '   '  // Empty after trim
      };

      service.markFalseDuplicate(request).subscribe({
        error: (error) => {
          expect(error.message).toContain('Comments are required');
          expect(apiServiceSpy.post).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should map error code 16028 to user-friendly message', (done) => {
      const request = {
        donorId: 'DON12345',
        transactionId: 'TXN001',
        comments: 'Valid comment'
      };

      const errorResponse = {
        error: {
          errorCode: '16028'
        }
      };

      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.markFalseDuplicate(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Invalid transaction state - cannot attach donor');
          done();
        }
      });
    });
  });

  describe('putDonorOnHold', () => {
    it('should put donor on hold successfully', (done) => {
      const donorId = 'DON12345';
      const transactionId = 'TXN001';

      const response: ApiResponse<any> = {
        success: true,
        message: 'Donor put on hold successfully',
        statusCode: 200,
        data: {}
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.putDonorOnHold(donorId, transactionId).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          expect(result.message).toBe('Donor put on hold successfully');
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            '/api/v1/attach-donor/put-on-hold',
            jasmine.objectContaining({
              donorId: 'DON12345',
              transactionId: 'TXN001',
              chapterId: 'TST'
            })
          );
          done();
        }
      });
    });



    it('should include chapterId from HeaderService', (done) => {
      const donorId = 'DON12345';
      const transactionId = 'TXN001';

      const response: ApiResponse<any> = {
        success: true,
        message: 'Donor put on hold successfully',
        statusCode: 200
      };

      apiServiceSpy.post.and.returnValue(of(response));

      service.putDonorOnHold(donorId, transactionId).subscribe({
        next: () => {
          const callArgs = apiServiceSpy.post.calls.mostRecent().args;
          expect(callArgs[1].chapterId).toBe('TST');
          done();
        }
      });
    });
  });

  describe('getDonorById', () => {


    it('should return data as-is when not array', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: { donorId: 'DON12345', lastName: 'SMITH' }
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DON12345').subscribe({
        next: (result) => {
          expect(result.donorId).toBe('DON12345');
          done();
        }
      });
    });
  });

  describe('updateDonor', () => {
    it('should call PUT with donor data', (done) => {
      const updateData = { lastName: 'SMITH', address: { streetName: '123 ST' } };
      const response = { success: true, message: '', statusCode: 200 };
      apiServiceSpy.put.and.returnValue(of(response));

      service.updateDonor('DON12345', updateData).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(apiServiceSpy.put).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('createDonor', () => {
    it('should call POST to create donor', (done) => {
      const donorData = { lastName: 'SMITH', firstName: 'JOHN', gender: 'M', dateOfBirth: '2000-01-01', address: {} };
      const response = { success: true, message: '', statusCode: 200, data: [{ donorId: 'DN_NEW' }] };
      apiServiceSpy.post.and.returnValue(of(response));

      service.createDonor(donorData).subscribe({
        next: (result) => {
          expect(result.success).toBe(true);
          expect(apiServiceSpy.post).toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('getLookupEmployers', () => {
    it('should return mapped employer list', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [[{ value: 'EMP01', label: 'ACME Corp' }, { value: 'EMP02', label: 'Tech Inc' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupEmployers().subscribe({
        next: (result) => {
          expect(result.length).toBe(2);
          expect(result[0].value).toBe('EMP01');
          expect(result[0].label).toBe('ACME Corp');
          done();
        }
      });
    });

    it('should pass searchKeyword as query parameter', (done) => {
      const response = { success: true, message: '', statusCode: 200, data: [[]] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupEmployers('ACME').subscribe({
        next: () => {
          const url = apiServiceSpy.get.calls.mostRecent().args[0];
          expect(url).toContain('searchKeyword=ACME');
          done();
        }
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getLookupEmployers().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when success is false', (done) => {
      const response = { success: false, message: '', statusCode: 400 };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupEmployers().subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should handle flat data array (not nested)', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [{ Value: 'EMP', Label: 'Test' }]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupEmployers().subscribe({
        next: (result) => {
          expect(result[0].value).toBe('EMP');
          expect(result[0].label).toBe('Test');
          done();
        }
      });
    });
  });

  describe('getGradedDonors - additional branches', () => {
    it('should return empty array when success but no data', (done) => {
      const response: ApiResponse<GradedDonorDto[]> = { success: true, message: '', statusCode: 200 };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getGradedDonors('TXN001').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should throw when success is false', (done) => {
      const response: ApiResponse<GradedDonorDto[]> = { success: false, message: 'Not found', statusCode: 404 };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getGradedDonors('TXN001').subscribe({
        error: (err) => {
          expect(err.message).toContain('Not found');
          done();
        }
      });
    });

    it('should handle API error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('network')));

      service.getGradedDonors('TXN001').subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });

    it('should use default message when success is false and message is empty', (done) => {
      const response: ApiResponse<GradedDonorDto[]> = { success: false, message: '', statusCode: 500 };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getGradedDonors('TXN001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch graded donors');
          done();
        }
      });
    });
  });

  describe('getTransaction - additional branches', () => {
    it('should throw when success is false', (done) => {
      const response: ApiResponse<GradedDonationDto> = { success: false, message: 'Not found', statusCode: 404 };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getTransaction('TXN001').subscribe({
        error: (err) => {
          expect(err.message).toContain('Not found');
          done();
        }
      });
    });

    it('should handle API error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getTransaction('TXN001').subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });

    it('should throw default message when success is true but data is null', (done) => {
      const response: ApiResponse<GradedDonationDto> = {
        success: true, message: '', statusCode: 200, data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getTransaction('TXN001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Transaction not found');
          done();
        }
      });
    });

    it('should use default message when success is false and message is empty', (done) => {
      const response: ApiResponse<GradedDonationDto> = { success: false, message: '', statusCode: 500 };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getTransaction('TXN001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Transaction not found');
          done();
        }
      });
    });
  });

  describe('getDonorById - additional branches', () => {
    it('should extract first element from array response', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [{ donorId: 'DN1', lastName: 'SMITH' }]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN1').subscribe({
        next: (result) => {
          expect(result.donorId).toBe('DN1');
          done();
        }
      });
    });

    it('should throw when success is false', (done) => {
      const response = { success: false, message: 'Not found', statusCode: 404 };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN1').subscribe({
        error: (err) => {
          expect(err.message).toContain('Not found');
          done();
        }
      });
    });

    it('should handle API error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));

      service.getDonorById('DN1').subscribe({
        error: (err) => {
          expect(err.message).toBeTruthy();
          done();
        }
      });
    });

    it('should use default message when success is false and message is empty', (done) => {
      const response = { success: false, message: '', statusCode: 500 };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getDonorById('DN1').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to fetch donor demographics');
          done();
        }
      });
    });
  });

  describe('getCityStateByZip', () => {
    it('should return city/state results', (done) => {
      const response = { data: [{ city: 'DALLAS', state: 'TX', uspsId: 1, zip: '75001' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getCityStateByZip('75001').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].city).toBe('DALLAS');
          done();
        }
      });
    });

    it('should return empty array when no data', (done) => {
      const response = {};
      apiServiceSpy.get.and.returnValue(of(response));

      service.getCityStateByZip('00000').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getCityStateByZip('99999').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('searchCities', () => {
    it('should return empty array for short search term', (done) => {
      service.searchCities('A').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        }
      });
    });

    it('should return cities for valid search', (done) => {
      const response = { success: true, data: [[{ value: 'DALLAS', label: 'Dallas, TX' }]] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.searchCities('DAL').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        }
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.searchCities('DAL').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array for empty string search', (done) => {
      service.searchCities('').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('getZipsByCity', () => {
    it('should return zips for a city', (done) => {
      const response = { success: true, data: [[{ value: '75001', label: '75001' }]] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('DALLAS').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          done();
        }
      });
    });

    it('should return empty array on error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('fail')));

      service.getZipsByCity('DALLAS').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });
  });

  describe('addGradedDonor', () => {
    it('should post add graded donor request', (done) => {
      const request = { transactionId: 'TXN001', donorId: 'DON123', chapterId: 'CH01' } as any;
      const response = { success: true, message: '', statusCode: 200, data: {} };
      apiServiceSpy.post.and.returnValue(of(response));

      service.addGradedDonor(request).subscribe({
        next: (result) => {
          expect(result.success).toBeTrue();
          done();
        }
      });
    });

    it('should handle error in addGradedDonor', (done) => {
      apiServiceSpy.post.and.returnValue(throwError(() => ({ error: { errorCode: '16022' } })));

      service.addGradedDonor({ transactionId: 'T', donorId: 'D', chapterId: 'C' } as any).subscribe({
        error: (err) => {
          expect(err.message).toBe('Donor is already attached to this transaction');
          done();
        }
      });
    });
  });

  describe('session context', () => {
    afterEach(() => {
      sessionStorage.removeItem('attachDonorContext');
    });

    it('should save and retrieve context', () => {
      service.saveContext({ transactionId: 'TXN001', transactionType: 'DRUREHLD' as any });
      const ctx = service.getContext();
      expect(ctx).toBeTruthy();
      expect(ctx!.transactionId).toBe('TXN001');
    });

    it('should return null when no context stored', () => {
      service.clearContext();
      expect(service.getContext()).toBeNull();
    });

    it('should return null and clear when context is expired', () => {
      const expired = { transactionId: 'T', transactionType: 'DRUREHLD', timestamp: Date.now() - 31 * 60 * 1000 };
      sessionStorage.setItem('attachDonorContext', JSON.stringify(expired));
      const result = service.getContext();
      expect(result).toBeNull();
    });

    it('should handle corrupt JSON in getContext', () => {
      sessionStorage.setItem('attachDonorContext', '{corrupt');
      expect(service.getContext()).toBeNull();
    });
  });

  describe('handleError branches', () => {
    it('should return network error message for status 0', (done) => {
      const request = { transactionId: 'T', donorId: 'D' };
      const error = { status: 0 };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor(request).subscribe({
        error: (err) => {
          expect(err.message).toContain('Cannot connect to server');
          done();
        }
      });
    });

    it('should use error.message as fallback', (done) => {
      const request = { transactionId: 'T', donorId: 'D' };
      const error = { status: 500, message: 'Internal error' };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Internal error');
          done();
        }
      });
    });

    it('should use generic fallback when no message available', (done) => {
      const request = { transactionId: 'T', donorId: 'D' };
      const error = { status: 500 };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('An unexpected error occurred');
          done();
        }
      });
    });

    it('should use errorResponse.errorCode when error.errorCode is missing', (done) => {
      const request = { transactionId: 'T', donorId: 'D' };
      const error = { error: { errorResponse: { errorCode: '16060' } } };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Donor record is locked by another user');
          expect(err.errorCode).toBe('16060');
          done();
        }
      });
    });
  });

  describe('markFalseDuplicate - empty comments', () => {
    it('should reject empty string comments', (done) => {
      const request = { donorId: 'D', transactionId: 'T', comments: '' };

      service.markFalseDuplicate(request).subscribe({
        error: (err) => {
          expect(err.message).toContain('Comments are required');
          done();
        }
      });
    });
  });

  describe('selectDonor with confirmationScan', () => {
    it('should include confirmationScan in payload', (done) => {
      const request = { transactionId: 'TXN001', donorId: 'DON12345' };
      const response = { success: true, message: '', statusCode: 200, data: {} };
      apiServiceSpy.post.and.returnValue(of(response));

      service.selectDonor(request, 'SCAN123').subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1];
          expect(payload.confirmationScan).toBe('SCAN123');
          done();
        }
      });
    });
  });

  describe('getTransactionByUnit - additional branches', () => {
    it('should throw default message when success is true but data is null', (done) => {
      const response: ApiResponse<GradedDonationDto> = {
        success: true, message: '', statusCode: 200, data: null as any
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getTransactionByUnit('UNIT1').subscribe({
        error: (err) => {
          expect(err.message).toBe('Transaction not found for this Unit ID');
          done();
        }
      });
    });

    it('should handle API-level error from server', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => new Error('Server unavailable')));

      service.getTransactionByUnit('UNIT1').subscribe({
        error: (err) => {
          expect(err).toBeTruthy();
          done();
        }
      });
    });
  });

  describe('updateDonor - error path', () => {
    it('should handle API error with business error code', (done) => {
      const errorResponse = { error: { errorCode: '16060' } };
      apiServiceSpy.put.and.returnValue(throwError(() => errorResponse));

      service.updateDonor('DON12345', { lastName: 'SMITH' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Donor record is locked by another user');
          expect(err.errorCode).toBe('16060');
          done();
        }
      });
    });
  });

  describe('createDonor - error path', () => {
    it('should handle API error with error message', (done) => {
      const errorResponse = { error: { message: 'Duplicate donor record' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.createDonor({ lastName: 'SMITH' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Duplicate donor record');
          done();
        }
      });
    });
  });

  describe('putDonorOnHold - error path', () => {
    it('should handle API error with business error code 16206', (done) => {
      const errorResponse = { error: { errorCode: '16206' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.putDonorOnHold('DON12345', 'TXN001').subscribe({
        error: (err) => {
          expect(err.message).toBe('Transaction is in HOLD status and cannot be modified');
          expect(err.errorCode).toBe('16206');
          done();
        }
      });
    });
  });

  describe('markDuplicates - API error path', () => {
    it('should handle API error with business error code 16107', (done) => {
      const request = {
        primaryDonorId: 'DON12345',
        duplicateDonorIds: ['DON67890'],
        transactionId: 'TXN001'
      };

      const errorResponse = { error: { errorCode: '16107' } };
      apiServiceSpy.post.and.returnValue(throwError(() => errorResponse));

      service.markDuplicates(request).subscribe({
        error: (err) => {
          expect(err.message).toBe('Duplicate donor marking failed - donors must be from same transaction');
          expect(err.errorCode).toBe('16107');
          done();
        }
      });
    });
  });

  describe('extractLookupItems - edge cases via searchCities/getZipsByCity', () => {
    it('should return empty array when data is null', (done) => {
      const response = { success: true, data: null };
      apiServiceSpy.get.and.returnValue(of(response));

      service.searchCities('DAL').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should return empty array when data is not an array', (done) => {
      const response = { success: true, data: 'invalid' };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('DALLAS').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          done();
        }
      });
    });

    it('should handle flat array with code/description keys', (done) => {
      const response = { success: true, data: [{ code: 'Z1', description: 'Zip 1' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('DALLAS').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('Z1');
          expect(result[0].description).toBe('Zip 1');
          done();
        }
      });
    });

    it('should default to empty strings when items have no recognized keys', (done) => {
      const response = { success: true, data: [{ foo: 'bar' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('DALLAS').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('');
          expect(result[0].description).toBe('');
          done();
        }
      });
    });

    it('should use Value/Label keys when value/label keys are missing', (done) => {
      const response = { success: true, data: [{ Value: 'V1', Label: 'Label One' }] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getZipsByCity('DALLAS').subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].code).toBe('V1');
          expect(result[0].description).toBe('Label One');
          done();
        }
      });
    });
  });

  describe('getChapterId / getUsername fallback to empty string', () => {
    it('should use empty string when getCurrentChapterId returns null', (done) => {
      headerServiceSpy.getCurrentChapterId.and.returnValue(null as any);
      const response = { success: true, message: '', statusCode: 200, data: {} };
      apiServiceSpy.post.and.returnValue(of(response));

      service.putDonorOnHold('DON1', 'TXN1').subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1];
          expect(payload.chapterId).toBe('');
          done();
        }
      });
    });

    it('should use empty string when getCurrentUsername returns null', (done) => {
      headerServiceSpy.getCurrentUsername.and.returnValue(null as any);
      const response = { success: true, message: '', statusCode: 200, data: {} };
      apiServiceSpy.post.and.returnValue(of(response));

      service.selectDonor({ transactionId: 'TXN1', donorId: 'DON1' }).subscribe({
        next: () => {
          const payload = apiServiceSpy.post.calls.mostRecent().args[1];
          expect(payload.selectedBy).toBe('');
          done();
        }
      });
    });
  });

  describe('saveContext / clearContext error handling', () => {
    it('should silently handle sessionStorage.setItem throwing', () => {
      const original = sessionStorage.setItem.bind(sessionStorage);
      sessionStorage.setItem = () => { throw new Error('QuotaExceeded'); };
      try {
        expect(() => {
          service.saveContext({ transactionId: 'T', unitId: null, transactionType: 'Donation' });
        }).not.toThrow();
      } finally {
        sessionStorage.setItem = original;
      }
    });

    it('should silently handle sessionStorage.removeItem throwing in clearContext', () => {
      const original = sessionStorage.removeItem.bind(sessionStorage);
      sessionStorage.removeItem = () => { throw new Error('SecurityError'); };
      try {
        expect(() => {
          service.clearContext();
        }).not.toThrow();
      } finally {
        sessionStorage.removeItem = original;
      }
    });

    it('should silently handle sessionStorage.getItem throwing in getContext', () => {
      const original = sessionStorage.getItem.bind(sessionStorage);
      sessionStorage.getItem = () => { throw new Error('SecurityError'); };
      try {
        const result = service.getContext();
        expect(result).toBeNull();
      } finally {
        sessionStorage.getItem = original;
      }
    });
  });

  describe('remaining business error code mappings', () => {
    it('should map error code 16023 to user-friendly message', (done) => {
      const error = { error: { errorCode: '16023' } };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor({ transactionId: 'T', donorId: 'D' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Transaction has already been resolved with a different donor');
          expect(err.errorCode).toBe('16023');
          done();
        }
      });
    });

    it('should map error code 16113 to user-friendly message', (done) => {
      const error = { error: { errorCode: '16113' } };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor({ transactionId: 'T', donorId: 'D' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Cannot mark donor as duplicate - donor is already selected');
          expect(err.errorCode).toBe('16113');
          done();
        }
      });
    });

    it('should map error code 16157 to user-friendly message', (done) => {
      const error = { error: { errorCode: '16157' } };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor({ transactionId: 'T', donorId: 'D' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('False duplicate flag cannot be removed once set');
          expect(err.errorCode).toBe('16157');
          done();
        }
      });
    });

    it('should map error code 21138 to user-friendly message', (done) => {
      const error = { error: { errorCode: '21138' } };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor({ transactionId: 'T', donorId: 'D' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Database constraint violation - contact system administrator');
          expect(err.errorCode).toBe('21138');
          done();
        }
      });
    });

    it('should fall through to error.error.message when errorCode is not in the map', (done) => {
      const error = { error: { errorCode: '99999', message: 'Unknown server error' } };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      service.selectDonor({ transactionId: 'T', donorId: 'D' }).subscribe({
        error: (err) => {
          expect(err.message).toBe('Unknown server error');
          expect(err.errorCode).toBe('99999');
          done();
        }
      });
    });
  });

  describe('getLookupEmployers - item key fallbacks', () => {
    it('should default to empty strings when item has no value/Value or label/Label', (done) => {
      const response = {
        success: true, message: '', statusCode: 200,
        data: [[{ unrelated: 'data' }]]
      };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupEmployers().subscribe({
        next: (result) => {
          expect(result.length).toBe(1);
          expect(result[0].value).toBe('');
          expect(result[0].label).toBe('');
          done();
        }
      });
    });

    it('should encode special characters in searchKeyword', (done) => {
      const response = { success: true, message: '', statusCode: 200, data: [[]] };
      apiServiceSpy.get.and.returnValue(of(response));

      service.getLookupEmployers('A&B Corp').subscribe({
        next: () => {
          const url = apiServiceSpy.get.calls.mostRecent().args[0];
          expect(url).toContain('searchKeyword=A%26B%20Corp');
          done();
        }
      });
    });
  });

  describe('searchCities - whitespace-only input', () => {
    it('should return empty array for whitespace-only search term', (done) => {
      service.searchCities('  ').subscribe({
        next: (result) => {
          expect(result).toEqual([]);
          expect(apiServiceSpy.get).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('saveContext / getContext round-trip with unitId', () => {
    afterEach(() => {
      sessionStorage.removeItem('attachDonorContext');
    });

    it('should save and retrieve context with unitId', () => {
      service.saveContext({ transactionId: 'TXN1', unitId: 'UNIT1', transactionType: 'Donation' });
      const ctx = service.getContext();
      expect(ctx).toBeTruthy();
      expect(ctx!.unitId).toBe('UNIT1');
      expect(ctx!.transactionType).toBe('Donation');
      expect(ctx!.timestamp).toBeDefined();
    });

    it('should save and retrieve context with null unitId', () => {
      service.saveContext({ transactionId: 'TXN1', unitId: null, transactionType: 'Deferral' });
      const ctx = service.getContext();
      expect(ctx).toBeTruthy();
      expect(ctx!.unitId).toBeNull();
      expect(ctx!.transactionType).toBe('Deferral');
    });
  });
});
