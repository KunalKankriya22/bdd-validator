import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { AuthorizeNotificationLetterApiService } from './authorize-notification-letter-api.service';
import { ApiService } from '@shared/services/api.service';
import {
  NotificationLetterDto,
  DonorInfoDto,
  LetterDropdownDto,
  LetterTemplateDto,
  AuthorizeLetterRequestDto,
  RejectLetterRequestDto,
  UpdateLetterTextRequestDto,
  SaveLetterRequestDto,
  SaveLetterResponseDto,
} from './authorize-notification-letter-dialog.model';

describe('AuthorizeNotificationLetterApiService', () => {
  let service: AuthorizeNotificationLetterApiService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDonorInfo: DonorInfoDto = {
    donorId: 'D12345',
    name: 'PLAY, JACK',
    dateOfBirth: '12-JAN-2004',
    sex: 'Male',
    aboType: 'O POS',
    address: '82 KIBBLE DRIVE DALLAS, TX 75235',
    homePhone: '555-123-4567',
    workPhone: '555-987-6543',
    donationType: 'AL',
    procedureCode: 'WB',
  };

  const mockLetterData: NotificationLetterDto = {
    donorId: 'D12345',
    letterSeqNo: '001',
    letterId: '5.07',
    letterCode: '5.07',
    letterText: 'Dear Jack Play,\n\nTest letter content...',
    letterTitle: 'Test for result generation',
    authorizationStatus: 'PENDING',
    isModified: false,
    donorInfo: mockDonorInfo,
  };

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AuthorizeNotificationLetterApiService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(AuthorizeNotificationLetterApiService);
  });

  describe('getExistingLetterForDonor', () => {




    it('should handle other errors', (done) => {
      const genericError = { status: 500 }; // Error without message property
      apiServiceSpy.get.and.returnValue(throwError(() => genericError));

      service.getExistingLetterForDonor('D12345').subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to check for existing letter');
          done();
        },
      });
    });
  });

  describe('getLetterDetails', () => {



    it('should handle 404 error for letter not found', (done) => {
      const error404 = { status: 404, message: 'Not Found' };
      apiServiceSpy.get.and.returnValue(throwError(() => error404));

      service.getLetterDetails('D12345', '999').subscribe({
        error: (error) => {
          expect(error.message).toBe('Letter 999 not found for donor D12345');
          done();
        },
      });
    });

    it('should handle other errors', (done) => {
      const genericError = { status: 500 }; // Error without message property
      apiServiceSpy.get.and.returnValue(throwError(() => genericError));

      service.getLetterDetails('D12345', '001').subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to load letter details');
          done();
        },
      });
    });
  });
  describe('getDonorInfo', () => {



    it('should handle 404 error for donor not found', (done) => {
      const error404 = { status: 404, message: 'Not Found' };
      apiServiceSpy.get.and.returnValue(throwError(() => error404));

      service.getDonorInfo('D99999').subscribe({
        error: (error) => {
          expect(error.message).toBe('Donor ID D99999 not found in database');
          done();
        },
      });
    });

    it('should handle other errors', (done) => {
      const genericError = { status: 500 }; // Error without message property
      apiServiceSpy.get.and.returnValue(throwError(() => genericError));

      service.getDonorInfo('D12345').subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to load donor information');
          done();
        },
      });
    });
  });

  describe('getLetterTemplate', () => {



    it('should handle 404 error for template not found', (done) => {
      const error404 = { status: 404, message: 'Not Found' };
      apiServiceSpy.get.and.returnValue(throwError(() => error404));

      service.getLetterTemplate('99.99', '99.99').subscribe({
        error: (error) => {
          expect(error.message).toBe('Letter template not found for letter code 99.99');
          done();
        },
      });
    });

    it('should handle other errors', (done) => {
      const genericError = { status: 500 }; // Error without message property
      apiServiceSpy.get.and.returnValue(throwError(() => genericError));

      service.getLetterTemplate('5.07', '5.07').subscribe({
        error: (error) => {
          expect(error.message).toBe('Failed to load letter template');
          done();
        },
      });
    });
  });

  describe('saveLetter', () => {
    it('should call API with correct endpoint and payload', (done) => {
      const request: SaveLetterRequestDto = {
        donorId: 'D12345',
        letterCode: '5.07',
        letterText: 'Dear Jack Play,\n\nTest letter content...',
        donationsViewed: true,
        interdictionsViewed: true,
        modifyInd: 'N',
      };

      const mockResponseData: SaveLetterResponseDto = {
        donorId: 'D12345',
        letterSeqNo: '002',
        chapterId: 'CH01',
        insertDate: '2026-05-13T10:30:00Z',
        insertUser: 'USER01',
        programId: 'PROG01',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockResponseData,
        error: null,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.saveLetter('D12345', request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponseData);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            '/api/v1/notification-letter/save',
            request
          );
          done();
        },
      });
    });


    it('should throw error when response is not successful', (done) => {
      const request: SaveLetterRequestDto = {
        donorId: 'D12345',
        letterCode: '5.07',
        letterText: 'Dear Jack Play,\n\nTest letter content...',
        donationsViewed: true,
        interdictionsViewed: true,
        modifyInd: 'N',
      };

      const mockResponse = {
        success: false,
        message: 'Save failed',
        statusCode: 400,
        data: null,
        error: 'Validation error',
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.saveLetter('D12345', request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Save failed');
          done();
        },
      });
    });

    it('should throw error when no data returned', (done) => {
      const request: SaveLetterRequestDto = {
        donorId: 'D12345',
        letterCode: '5.07',
        letterText: 'Dear Jack Play,\n\nTest letter content...',
        donationsViewed: true,
        interdictionsViewed: true,
        modifyInd: 'N',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        error: null,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.saveLetter('D12345', request).subscribe({
        error: (error) => {
          expect(error.message).toBe('No data returned from save');
          done();
        },
      });
    });
  });

  describe('authorizeLetter', () => {
    it('should call API with correct endpoint and payload', (done) => {
      const request: AuthorizeLetterRequestDto = {
        donorId: 'D12345',
        letterSeqNo: '001',
        donationsViewed: true,
        interdictionsViewed: true,
      };

      const mockResponseData = {
        donorId: 'D12345',
        letterSeqNo: '001',
        authorizationStatus: 'AUTHORIZED',
        authorizationDate: '2026-05-13T10:30:00Z',
        authorizationUser: 'USER01',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockResponseData,
        error: null,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.authorizeLetter(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponseData);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            '/api/v1/notification-letter/authorize',
            request
          );
          done();
        },
      });
    });


    it('should throw error when response is not successful', (done) => {
      const request: AuthorizeLetterRequestDto = {
        donorId: 'D12345',
        letterSeqNo: '001',
        donationsViewed: true,
        interdictionsViewed: true,
      };

      const mockResponse = {
        success: false,
        message: 'Authorization failed',
        statusCode: 400,
        data: null,
        error: 'Validation error',
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.authorizeLetter(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Authorization failed');
          done();
        },
      });
    });

    it('should throw error when no data returned', (done) => {
      const request: AuthorizeLetterRequestDto = {
        donorId: 'D12345',
        letterSeqNo: '001',
        donationsViewed: true,
        interdictionsViewed: true,
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        error: null,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.authorizeLetter(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('No data returned from authorization');
          done();
        },
      });
    });
  });

  describe('rejectLetter', () => {
    it('should call API with correct endpoint and payload', (done) => {
      const request: RejectLetterRequestDto = {
        donorId: 'D12345',
        letterSeqNo: '001',
        rejectionReason: 'Duplicate letter sent recently',
      };

      const mockResponseData = {
        donorId: 'D12345',
        letterSeqNo: '001',
        authorizationStatus: 'REJECTED',
        rejectionDate: '2026-05-13T10:35:00Z',
        rejectionUser: 'USER01',
        rejectionReason: 'Duplicate letter sent recently',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockResponseData,
        error: null,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.rejectLetter(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponseData);
          expect(apiServiceSpy.post).toHaveBeenCalledWith(
            '/api/v1/notification-letter/reject',
            request
          );
          done();
        },
      });
    });

    it('should handle rejection without reason', (done) => {
      const request: RejectLetterRequestDto = {
        donorId: 'D12345',
        letterSeqNo: '001',
      };

      const mockResponseData = {
        donorId: 'D12345',
        letterSeqNo: '001',
        authorizationStatus: 'REJECTED',
        rejectionDate: '2026-05-13T10:35:00Z',
        rejectionUser: 'USER01',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockResponseData,
        error: null,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.rejectLetter(request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponseData);
          done();
        },
      });
    });


    it('should throw error when response is not successful', (done) => {
      const request: RejectLetterRequestDto = {
        donorId: 'D12345',
        letterSeqNo: '001',
        rejectionReason: 'Test reason',
      };

      const mockResponse = {
        success: false,
        message: 'Rejection failed',
        statusCode: 400,
        data: null,
        error: 'Validation error',
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.rejectLetter(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Rejection failed');
          done();
        },
      });
    });

    it('should throw error when no data returned', (done) => {
      const request: RejectLetterRequestDto = {
        donorId: 'D12345',
        letterSeqNo: '001',
        rejectionReason: 'Test reason',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        error: null,
      };

      apiServiceSpy.post.and.returnValue(of(mockResponse));

      service.rejectLetter(request).subscribe({
        error: (error) => {
          expect(error.message).toBe('No data returned from rejection');
          done();
        },
      });
    });
  });

  describe('updateLetterText', () => {
    it('should call API with correct endpoint and payload', (done) => {
      const request: UpdateLetterTextRequestDto = {
        letterText: 'Updated letter text content',
      };

      const mockResponseData = {
        donorId: 'D12345',
        letterSeqNo: '001',
        letterText: 'Updated letter text content',
        isModified: true,
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: mockResponseData,
        error: null,
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateLetterText('D12345', '001', request).subscribe({
        next: (result) => {
          expect(result).toEqual(mockResponseData);
          expect(apiServiceSpy.put).toHaveBeenCalledWith(
            '/api/v1/notification-letter/D12345/001/text',
            request
          );
          done();
        },
      });
    });


    it('should throw error when response is not successful', (done) => {
      const request: UpdateLetterTextRequestDto = {
        letterText: 'Updated letter text content',
      };

      const mockResponse = {
        success: false,
        message: 'Update failed',
        statusCode: 400,
        data: null,
        error: 'Letter cannot be modified after authorization',
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateLetterText('D12345', '001', request).subscribe({
        error: (error) => {
          expect(error.message).toBe('Update failed');
          done();
        },
      });
    });

    it('should throw error when no data returned', (done) => {
      const request: UpdateLetterTextRequestDto = {
        letterText: 'Updated letter text content',
      };

      const mockResponse = {
        success: true,
        message: 'Success',
        statusCode: 200,
        data: [],
        error: null,
      };

      apiServiceSpy.put.and.returnValue(of(mockResponse));

      service.updateLetterText('D12345', '001', request).subscribe({
        error: (error) => {
          expect(error.message).toBe('No data returned from update');
          done();
        },
      });
    });
  });

  describe('getDonorInfo success', () => {
    it('should return donor info when data is object', (done) => {
      const mockDonor = { donorId: 'D12345', name: 'Test Donor' };
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockDonor, error: null }));
      service.getDonorInfo('D12345').subscribe(result => {
        expect(result).toEqual(mockDonor as any);
        done();
      });
    });
    it('should return first item when data is array', (done) => {
      const mockDonor = { donorId: 'D12345', name: 'Test Donor' };
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockDonor], error: null }));
      service.getDonorInfo('D12345').subscribe(result => {
        expect(result).toEqual(mockDonor as any);
        done();
      });
    });
    it('should return null when data is empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], error: null }));
      service.getDonorInfo('D12345').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('getLettersDropdown', () => {
    it('should return dropdown array', (done) => {
      const mockData = [{ letterId: '1', letterCode: 'A' }];
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockData, error: null }));
      service.getLettersDropdown().subscribe(result => {
        expect(result.length).toBe(1);
        done();
      });
    });
    it('should return empty array when no data', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: null, error: null }));
      service.getLettersDropdown().subscribe(result => {
        expect(result).toEqual([]);
        done();
      });
    });
    it('should propagate error', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 500 })));
      service.getLettersDropdown().subscribe({ error: (err) => { expect(err.status).toBe(500); done(); } });
    });
  });

  describe('getLetterTemplate success', () => {
    it('should return template when data is object', (done) => {
      const mockTemplate = { letterId: '5.07', letterText: 'Template text' };
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockTemplate, error: null }));
      service.getLetterTemplate('5.07', '5.07').subscribe(result => {
        expect(result).toEqual(mockTemplate as any);
        done();
      });
    });
    it('should return first item when data is array', (done) => {
      const mockTemplate = { letterId: '5.07', letterText: 'Template text' };
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockTemplate], error: null }));
      service.getLetterTemplate('5.07', '5.07').subscribe(result => {
        expect(result).toEqual(mockTemplate as any);
        done();
      });
    });
    it('should return null when data is empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], error: null }));
      service.getLetterTemplate('5.07', '5.07').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('getLetterDetails success', () => {
    it('should return letter when data is object', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockLetterData, error: null }));
      service.getLetterDetails('D12345', '001').subscribe(result => {
        expect(result).toEqual(mockLetterData);
        done();
      });
    });
    it('should return first item when data is array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockLetterData], error: null }));
      service.getLetterDetails('D12345', '001').subscribe(result => {
        expect(result).toEqual(mockLetterData);
        done();
      });
    });
    it('should return null when data is empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], error: null }));
      service.getLetterDetails('D12345', '001').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('getExistingLetterForDonor success', () => {
    it('should return letter when data is object', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockLetterData, error: null }));
      service.getExistingLetterForDonor('D12345').subscribe(result => {
        expect(result).toEqual(mockLetterData);
        done();
      });
    });
    it('should return first item when data is array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockLetterData], error: null }));
      service.getExistingLetterForDonor('D12345').subscribe(result => {
        expect(result).toEqual(mockLetterData);
        done();
      });
    });
    it('should return null when data is empty array', (done) => {
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [], error: null }));
      service.getExistingLetterForDonor('D12345').subscribe(result => {
        expect(result).toBeNull();
        done();
      });
    });
    it('should emit null on 404', (done) => {
      apiServiceSpy.get.and.returnValue(throwError(() => ({ status: 404 })));
      service.getExistingLetterForDonor('D12345').subscribe({
        error: (err) => { expect(err).toBeNull(); done(); }
      });
    });
  });

  describe('saveLetter with array data', () => {
    it('should return first item from array', (done) => {
      const responseData = { donorId: 'D12345', letterSeqNo: '002' };
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [responseData], error: null }));
      service.saveLetter('D12345', { donorId: 'D12345', letterCode: '5.07', letterText: 'text', donationsViewed: true, interdictionsViewed: true, modifyInd: 'N' } as any).subscribe(result => {
        expect(result).toEqual(responseData as any);
        done();
      });
    });
  });

  describe('authorizeLetter with array data', () => {
    it('should return first item from array', (done) => {
      const responseData = { donorId: 'D12345', letterSeqNo: '001', authorizationStatus: 'AUTHORIZED' };
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [responseData], error: null }));
      service.authorizeLetter({ donorId: 'D12345', letterSeqNo: '001', donationsViewed: true, interdictionsViewed: true } as any).subscribe(result => {
        expect(result).toEqual(responseData as any);
        done();
      });
    });
  });

  describe('rejectLetter with array data', () => {
    it('should return first item from array', (done) => {
      const responseData = { donorId: 'D12345', letterSeqNo: '001', authorizationStatus: 'REJECTED' };
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [responseData], error: null }));
      service.rejectLetter({ donorId: 'D12345', letterSeqNo: '001' } as any).subscribe(result => {
        expect(result).toEqual(responseData as any);
        done();
      });
    });
  });

  describe('updateLetterText with array data', () => {
    it('should return first item from array', (done) => {
      const responseData = { donorId: 'D12345', letterSeqNo: '001', letterText: 'Updated' };
      apiServiceSpy.put.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [responseData], error: null }));
      service.updateLetterText('D12345', '001', { letterText: 'Updated' } as any).subscribe(result => {
        expect(result).toEqual(responseData as any);
        done();
      });
    });
  });
});
