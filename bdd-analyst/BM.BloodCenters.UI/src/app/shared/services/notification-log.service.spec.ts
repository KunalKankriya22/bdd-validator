import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NotificationLogService } from './notification-log.service';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../core/constants/api.constants';
import {
  DonorInfo,
  LookupItem,
  DonorCommunication,
  LetterDetails,
  AddDropdownValues,
  CreateCommunicationRequest,
} from '../models/notification-log.interface';

describe('NotificationLogService', () => {
  let service: NotificationLogService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);

    TestBed.configureTestingModule({
      providers: [
        NotificationLogService,
        { provide: ApiService, useValue: apiServiceSpy },
      ],
    });

    service = TestBed.inject(NotificationLogService);
    spyOn(console, 'error');
  });

  // =============================================
  // getDonorInfo
  // =============================================
  describe('getDonorInfo', () => {
    const donorId = 'DN30109699';
    const mockDonor: DonorInfo = {
      donorName: 'New, Lady L',
      dateOfBirth: '11-13-1974',
      sex: 'Female',
      abo: 'No Abo',
      address: '900 LAZY HOLLOW DR, 504 YOUR CITY, AK 00000',
      homePhone: '214-234 2344',
      businessPhone: '214-345 3455',
    };

    it('should call ApiService.get with the correct URL', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockDonor] }));

      // Act
      service.getDonorInfo(donorId).subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_DONOR_INFO(donorId)
        );
        done();
      });
    });

    it('should return the first item from response.data', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockDonor] }));

      // Act
      service.getDonorInfo(donorId).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockDonor);
        expect(result?.donorName).toBe('New, Lady L');
        expect(result?.dateOfBirth).toBe('11-13-1974');
        expect(result?.sex).toBe('Female');
        expect(result?.abo).toBe('No Abo');
        done();
      });
    });

    it('should return null when data array is empty', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));

      // Act
      service.getDonorInfo(donorId).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when data is undefined', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      // Act
      service.getDonorInfo(donorId).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null as any));

      // Act
      service.getDonorInfo(donorId).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response is undefined', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(undefined as any));

      // Act
      service.getDonorInfo(donorId).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate error and log to console.error', (done) => {
      // Arrange
      const error = new Error('Network error');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      // Act
      service.getDonorInfo(donorId).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to load donor info:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // =============================================
  // getCommunicationTypes
  // =============================================
  describe('getCommunicationTypes', () => {
    const donorId = 'DN30109699';
    const mockTypes: LookupItem[] = [
      { code: 'NOTFY', description: 'Donor Notification' },
      { code: 'INSTR', description: 'Instructions' },
    ];

    it('should call ApiService.get with the correct URL', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockTypes }));

      // Act
      service.getCommunicationTypes(donorId).subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_COMMUNICATION_TYPES(donorId)
        );
        done();
      });
    });

    it('should return the data array from response', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockTypes }));

      // Act
      service.getCommunicationTypes(donorId).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockTypes);
        expect(result.length).toBe(2);
        expect(result[0].code).toBe('NOTFY');
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      // Act
      service.getCommunicationTypes(donorId).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null as any));

      // Act
      service.getCommunicationTypes(donorId).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error and log to console.error', (done) => {
      // Arrange
      const error = { status: 500, message: 'Server error' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      // Act
      service.getCommunicationTypes(donorId).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to load communication types:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // =============================================
  // getCommunicationCodes
  // =============================================
  describe('getCommunicationCodes', () => {
    const donorId = 'DN30109699';
    const comType = 'NOTFY';
    const mockCodes: LookupItem[] = [
      { code: 'MIS09', description: '' },
      { code: 'NOTE', description: 'Notes From Dmis (Prev Donor Sys)' },
      { code: 'RJRSN', description: 'Reject Reasons From Dmis' },
    ];

    it('should call ApiService.get with the correct URL', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockCodes }));

      // Act
      service.getCommunicationCodes(donorId, comType).subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_COMMUNICATION_CODES(donorId, comType)
        );
        done();
      });
    });

    it('should return the data array from response', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockCodes }));

      // Act
      service.getCommunicationCodes(donorId, comType).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockCodes);
        expect(result.length).toBe(3);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      // Act
      service.getCommunicationCodes(donorId, comType).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null as any));

      // Act
      service.getCommunicationCodes(donorId, comType).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error and log to console.error', (done) => {
      // Arrange
      const error = new Error('Connection refused');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      // Act
      service.getCommunicationCodes(donorId, comType).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to load communication codes:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // =============================================
  // getNotificationLogs
  // =============================================
  describe('getNotificationLogs', () => {
    const donorId = 'DN30109699';
    const comType = 'NOTFY';
    const comCode = 'NOTE';
    const mockLogs: DonorCommunication[] = [
      {
        dateAndTime: '1996-01-25T10:22:30',
        communicationType: 'NOTFY',
        communicationTypeDescription: 'Donor Notification',
        communicationCode: 'NOTE',
        communicationCodeDescription: 'Notes From Dmis',
        actionCode: '',
        actionCodeDescription: '',
        comments: 'Procedure is also double platelets..',
        staffId: '',
        staffName: '',
        insertUserName: 'A. Donsys',
        letterId: '',
      },
    ];

    it('should call ApiService.get with donorId, comType, and comCode', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockLogs }));

      // Act
      service.getNotificationLogs(donorId, comType, comCode).subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_NOTIFICATION_LOGS(donorId, comType, comCode)
        );
        done();
      });
    });

    it('should call ApiService.get without optional comType and comCode', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockLogs }));

      // Act
      service.getNotificationLogs(donorId).subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_NOTIFICATION_LOGS(donorId, undefined, undefined)
        );
        done();
      });
    });

    it('should call ApiService.get with comType but without comCode', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockLogs }));

      // Act
      service.getNotificationLogs(donorId, comType).subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_NOTIFICATION_LOGS(donorId, comType, undefined)
        );
        done();
      });
    });

    it('should return the data array from response', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockLogs }));

      // Act
      service.getNotificationLogs(donorId, comType, comCode).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockLogs);
        expect(result.length).toBe(1);
        expect(result[0].communicationType).toBe('NOTFY');
        expect(result[0].insertUserName).toBe('A. Donsys');
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      // Act
      service.getNotificationLogs(donorId).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null as any));

      // Act
      service.getNotificationLogs(donorId).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error and log to console.error', (done) => {
      // Arrange
      const error = new Error('Timeout');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      // Act
      service.getNotificationLogs(donorId, comType, comCode).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to load notification logs:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // =============================================
  // getLetterDetails
  // =============================================
  describe('getLetterDetails', () => {
    const donorId = 'DN30109699';
    const letterSeqNo = 'LSQ0545603';
    const mockLetter: LetterDetails = {
      letterCode: 'WB1LTR',
      description: 'Whole Blood 1st Time Letter',
      generatedBy: 'ADS',
      generatedName: 'SMITH, JOHN',
      generatedOn: '2026-04-15T10:30:00',
      authorizedBy: 'MGR',
      authorizedName: 'JONES, MARY',
      authorizedOn: '2026-04-15T11:00:00',
      letterText: 'Dear Donor...',
      modifyIndicator: 'N',
      reprintBy: 'USR1',
      reprintName: 'DOE, JANE',
      reprintOn: '2026-05-05T14:22:00',
    };

    it('should call ApiService.get with the correct URL', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockLetter] }));

      // Act
      service.getLetterDetails(donorId, letterSeqNo).subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_LETTER_DETAILS(donorId, letterSeqNo)
        );
        done();
      });
    });

    it('should return the first item from response.data', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockLetter] }));

      // Act
      service.getLetterDetails(donorId, letterSeqNo).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockLetter);
        expect(result?.letterCode).toBe('WB1LTR');
        expect(result?.description).toBe('Whole Blood 1st Time Letter');
        expect(result?.reprintBy).toBe('USR1');
        done();
      });
    });

    it('should return null when data array is empty', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));

      // Act
      service.getLetterDetails(donorId, letterSeqNo).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when data is undefined', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      // Act
      service.getLetterDetails(donorId, letterSeqNo).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null as any));

      // Act
      service.getLetterDetails(donorId, letterSeqNo).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate error and log to console.error', (done) => {
      // Arrange
      const error = { status: 404, message: 'Not found' };
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      // Act
      service.getLetterDetails(donorId, letterSeqNo).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to load letter details:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // =============================================
  // reprintLetter
  // =============================================
  describe('reprintLetter', () => {
    const donorId = 'DN30109699';
    const letterSeqNo = 'LSQ0545603';
    const mockLetter: LetterDetails = {
      letterCode: 'WB1LTR',
      description: 'Whole Blood 1st Time Letter',
      generatedBy: 'ADS',
      generatedName: 'SMITH, JOHN',
      generatedOn: '2026-04-15T10:30:00',
      authorizedBy: 'MGR',
      authorizedName: 'JONES, MARY',
      authorizedOn: '2026-04-15T11:00:00',
      letterText: 'Dear Donor...',
      modifyIndicator: 'N',
      reprintBy: 'USR1',
      reprintName: 'DOE, JANE',
      reprintOn: '2026-05-05T14:22:00',
    };

    it('should call ApiService.post with the correct URL and empty body', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockLetter] }));

      // Act
      service.reprintLetter(donorId, letterSeqNo).subscribe(() => {
        // Assert
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.REPRINT_LETTER(donorId, letterSeqNo),
          {}
        );
        done();
      });
    });

    it('should return the first item from response.data on success', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockLetter] }));

      // Act
      service.reprintLetter(donorId, letterSeqNo).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockLetter);
        expect(result?.reprintBy).toBe('USR1');
        expect(result?.reprintName).toBe('DOE, JANE');
        done();
      });
    });

    it('should return null when data array is empty', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ success: true, message: 'No letter found', statusCode: 200, data: [] }));

      // Act
      service.reprintLetter(donorId, letterSeqNo).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when data is undefined', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      // Act
      service.reprintLetter(donorId, letterSeqNo).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response is null', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of(null as any));

      // Act
      service.reprintLetter(donorId, letterSeqNo).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate error and log to console.error on HTTP 404', (done) => {
      // Arrange
      const error = { status: 404, message: 'No letter found to reprint.' };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      // Act
      service.reprintLetter(donorId, letterSeqNo).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to reprint letter:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });

    it('should propagate error and log to console.error on HTTP 500', (done) => {
      // Arrange
      const error = { status: 500, message: 'Internal server error' };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      // Act
      service.reprintLetter(donorId, letterSeqNo).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to reprint letter:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // =============================================
  // getAddDropdownValues
  // =============================================
  describe('getAddDropdownValues', () => {
    const mockValues: AddDropdownValues = {
      communicationTypes: [{ code: 'NOTFY', description: 'Donor Notification' }],
      staffList: [{ staffId: 'S1', name: 'Staff One' }],
      actionCodes: [{ code: 'ACT1', description: 'Action 1' }],
    };

    it('should call ApiService.get with the correct URL', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(mockValues));

      // Act
      service.getAddDropdownValues().subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_ADD_DROPDOWN_VALUES
        );
        done();
      });
    });

    it('should return the response directly without mapping', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(mockValues));

      // Act
      service.getAddDropdownValues().subscribe((result) => {
        // Assert
        expect(result).toEqual(mockValues);
        expect(result.communicationTypes.length).toBe(1);
        expect(result.staffList.length).toBe(1);
        expect(result.actionCodes.length).toBe(1);
        done();
      });
    });

    it('should propagate error and log to console.error', (done) => {
      // Arrange
      const error = new Error('Server unavailable');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      // Act
      service.getAddDropdownValues().subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to load add dropdown values:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // =============================================
  // getAddCommunicationCodes
  // =============================================
  describe('getAddCommunicationCodes', () => {
    const comType = 'NOTFY';
    const mockCodes: LookupItem[] = [
      { code: 'NOTE', description: 'Notes' },
      { code: 'LTR', description: 'Letter' },
    ];

    it('should call ApiService.get with the correct URL', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockCodes }));

      // Act
      service.getAddCommunicationCodes(comType).subscribe(() => {
        // Assert
        expect(apiServiceSpy.get).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.GET_ADD_COMMUNICATION_CODES(comType)
        );
        done();
      });
    });

    it('should return the data array from response', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200, data: mockCodes }));

      // Act
      service.getAddCommunicationCodes(comType).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockCodes);
        expect(result.length).toBe(2);
        done();
      });
    });

    it('should return empty array when data is undefined', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      // Act
      service.getAddCommunicationCodes(comType).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should return empty array when response is null', (done) => {
      // Arrange
      apiServiceSpy.get.and.returnValue(of(null as any));

      // Act
      service.getAddCommunicationCodes(comType).subscribe((result) => {
        // Assert
        expect(result).toEqual([]);
        done();
      });
    });

    it('should propagate error and log to console.error', (done) => {
      // Arrange
      const error = new Error('Network timeout');
      apiServiceSpy.get.and.returnValue(throwError(() => error));

      // Act
      service.getAddCommunicationCodes(comType).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to load add communication codes:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });

  // =============================================
  // createCommunication
  // =============================================
  describe('createCommunication', () => {
    const donorId = 'DN30109699';
    const request: CreateCommunicationRequest = {
      communicationType: 'NOTFY',
      communicationCode: 'NOTE',
      comments: 'Test communication',
      staffId: 'S1',
      actionCode: 'ACT1',
    };
    const mockCommunication: DonorCommunication = {
      dateAndTime: '2026-05-05T10:00:00',
      communicationType: 'NOTFY',
      communicationTypeDescription: 'Donor Notification',
      communicationCode: 'NOTE',
      communicationCodeDescription: 'Notes',
      actionCode: 'ACT1',
      actionCodeDescription: 'Action 1',
      comments: 'Test communication',
      staffId: 'S1',
      staffName: 'Staff One',
      insertUserName: 'admin',
      letterId: '',
    };

    it('should call ApiService.post with the correct URL and request body', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockCommunication] }));

      // Act
      service.createCommunication(donorId, request).subscribe(() => {
        // Assert
        expect(apiServiceSpy.post).toHaveBeenCalledWith(
          API.DONOR_FUNCTIONS.NOTIFICATION_LOG.CREATE_COMMUNICATION(donorId),
          request
        );
        done();
      });
    });

    it('should return the first item from response.data on success', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [mockCommunication] }));

      // Act
      service.createCommunication(donorId, request).subscribe((result) => {
        // Assert
        expect(result).toEqual(mockCommunication);
        expect(result?.communicationType).toBe('NOTFY');
        expect(result?.comments).toBe('Test communication');
        done();
      });
    });

    it('should return null when data array is empty', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [] }));

      // Act
      service.createCommunication(donorId, request).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when data is undefined', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

      // Act
      service.createCommunication(donorId, request).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should return null when response is null', (done) => {
      // Arrange
      apiServiceSpy.post.and.returnValue(of(null as any));

      // Act
      service.createCommunication(donorId, request).subscribe((result) => {
        // Assert
        expect(result).toBeNull();
        done();
      });
    });

    it('should propagate error and log to console.error', (done) => {
      // Arrange
      const error = { status: 400, message: 'Bad request' };
      apiServiceSpy.post.and.returnValue(throwError(() => error));

      // Act
      service.createCommunication(donorId, request).subscribe({
        error: (err) => {
          // Assert
          expect(console.error).toHaveBeenCalledWith('Failed to create communication:', error);
          expect(err).toBe(error);
          done();
        },
      });
    });
  });
});
