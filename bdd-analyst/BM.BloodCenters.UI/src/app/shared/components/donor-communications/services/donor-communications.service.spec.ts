import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import moment from 'moment';
import { DonorCommunicationsService } from './donor-communications.service';
import { environment } from '../../../../../environments/environment';
import { API } from '../../../../core/constants/api.constants';
import {
  DonorCommunication,
  CreateDonorCommunicationDto,
  UpdateDonorCommunicationDto,
  CommunicationType,
  CommunicationCode,
  ActionCode,
  CommunicationLetter,
  LetterCode,
  DonorHeader
} from '../models/donor-communications.model';

describe('DonorCommunicationsService', () => {
  let service: DonorCommunicationsService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}${API.DONOR_COMMUNICATIONS.BASE}`;
  const queryUrl = `${environment.apiUrl}${API.DONOR_COMMUNICATIONS.QUERY}`;
  const demographicsUrl = `${environment.apiUrl}/api/v1/donor-demographics`;

  const now = moment();
  const comDate = now.toISOString();
  const twoDaysFromNow = moment().add(2, 'days').format('YYYY-MM-DD');
  const threeDaysFromNow = moment().add(3, 'days').format('YYYY-MM-DD');
  const twoDaysAgo = moment().subtract(2, 'days').format('YYYY-MM-DD');

  const mockCommunication: DonorCommunication = {
    donorId: 'D123456',
    sequenceNumber: 1,
    chapterId: 'CH01',
    comDate: comDate,
    comType: 'MAIL',
    comTypeDesc: 'Mail Communication',
    comCode: 'THK',
    comCodeDesc: 'Thank You',
    comDesc: 'Thank you for donating',
    targetDate: threeDaysFromNow,
    actionCode: 'SEND',
    actionCodeDesc: 'Send Letter',
    actionDate: twoDaysFromNow,
    insertDate: comDate,
    insertUser: 'ADMIN'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DonorCommunicationsService]
    });

    service = TestBed.inject(DonorCommunicationsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ──────────────────────────────────────────────
  // getCommunications
  // ──────────────────────────────────────────────

  describe('getCommunications', () => {
    it('should fetch communications with pagination', () => {
      const donorId = 'D123456';
      const backendResponse = {
        Success: true,
        Data: [{
          DonorId: 'D123456',
          SequenceNumber: 1,
          ChapterId: 'CH01',
          InsertDate: comDate,
          ComType: 'MAIL',
          ComTypeDesc: 'Mail Communication',
          ComCode: 'THK',
          ComCodeDesc: 'Thank You',
          ComDesc: 'Thank you for donating',
          TargetDate: threeDaysFromNow,
          ActionCode: 'SEND',
          ActionCodeDesc: 'Send Letter',
          ActionDate: twoDaysFromNow,
          InsertUser: 'ADMIN'
        }],
        Total: 1,
        StatusCode: 200
      };

      service.getCommunications(donorId).subscribe(response => {
        expect(response.data.length).toBe(1);
        expect(response.totalCount).toBe(1);
        expect(response.pageNumber).toBe(1);
        expect(response.pageSize).toBe(50);
      });

      const req = httpMock.expectOne(
        request => request.url.includes('/donor-communication-query/50/0')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.donorId).toBe(donorId);
      req.flush(backendResponse);
    });

    it('should apply sort parameters', () => {
      const donorId = 'D123456';
      const backendResponse = {
        Success: true,
        Data: [],
        Total: 0,
        StatusCode: 200
      };

      service.getCommunications(donorId, 1, 50, 'comDate', 'desc').subscribe();

      const req = httpMock.expectOne(
        request => request.url.includes('/donor-communication-query/50/0')
      );
      expect(req.request.method).toBe('POST');
      expect(req.request.body.sortColumn).toBe('comDate');
      expect(req.request.body.sortOrder).toBe('desc');
      req.flush(backendResponse);
    });

    it('should calculate correct skip for page 2', () => {
      const backendResponse = { Success: true, Data: [], Total: 0, StatusCode: 200 };

      service.getCommunications('D123456', 2, 25).subscribe(response => {
        expect(response.pageNumber).toBe(2);
        expect(response.pageSize).toBe(25);
      });

      const req = httpMock.expectOne(
        request => request.url.includes('/donor-communication-query/25/25')
      );
      expect(req.request.method).toBe('POST');
      req.flush(backendResponse);
    });
  });

  // ──────────────────────────────────────────────
  // getCommunication
  // ──────────────────────────────────────────────

  describe('getCommunication', () => {
    it('should fetch single communication', () => {
      const donorId = 'D123456';
      const sequenceNumber = 1;

      service.getCommunication(donorId, sequenceNumber).subscribe(comm => {
        expect(comm).toEqual(mockCommunication);
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}/${sequenceNumber}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockCommunication, success: true });
    });
  });

  // ──────────────────────────────────────────────
  // createCommunication
  // ──────────────────────────────────────────────

  describe('createCommunication', () => {
    it('should create new communication', () => {
      const dto: CreateDonorCommunicationDto = {
        donorId: 'D123456',
        comDate: comDate,
        comType: 'MAIL',
        comCode: 'THK',
        comDesc: 'Thank you for donating'
      };

      service.createCommunication(dto).subscribe(comm => {
        expect(comm).toEqual(mockCommunication);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        DonorId: 'D123456',
        ComDate: comDate,
        CommType: 'MAIL',
        CommCode: 'THK',
        ComDesc: 'Thank you for donating',
        ActionCode: undefined,
        TargetDate: undefined,
        ActionDate: undefined
      });
      req.flush({ data: mockCommunication, success: true });
    });
  });

  // ──────────────────────────────────────────────
  // updateCommunication
  // ──────────────────────────────────────────────

  describe('updateCommunication', () => {
    it('should update communication', () => {
      const donorId = 'D123456';
      const sequenceNumber = 1;
      const dto: UpdateDonorCommunicationDto = {
        comDesc: 'Updated comment',
        actionDate: threeDaysFromNow
      };

      service.updateCommunication(donorId, sequenceNumber, dto).subscribe(comm => {
        expect(comm.comDesc).toBe('Updated comment');
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}/${sequenceNumber}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(dto);
      req.flush({ data: { ...mockCommunication, ...dto }, success: true });
    });
  });

  // ──────────────────────────────────────────────
  // deleteCommunication
  // ──────────────────────────────────────────────

  describe('deleteCommunication', () => {
    it('should delete communication', () => {
      const donorId = 'D123456';
      const sequenceNumber = 1;

      service.deleteCommunication(donorId, sequenceNumber).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${baseUrl}/${donorId}/${sequenceNumber}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  // ──────────────────────────────────────────────
  // getCommunicationTypes
  // ──────────────────────────────────────────────

  describe('getCommunicationTypes', () => {
    it('should fetch communication types and map response', () => {
      const backendResponse = {
        success: true,
        data: [
          { commType: 'MAIL', commTypeDesc: 'Mail Communication' },
          { commType: 'PHONE', commTypeDesc: 'Phone Call' }
        ],
        total: 2,
        statusCode: 200
      };

      const expectedTypes: CommunicationType[] = [
        { code: 'MAIL', description: 'Mail Communication' },
        { code: 'PHONE', description: 'Phone Call' }
      ];

      service.getCommunicationTypes().subscribe(types => {
        expect(types).toEqual(expectedTypes);
        expect(types.length).toBe(2);
      });

      const req = httpMock.expectOne(`${baseUrl}/types`);
      expect(req.request.method).toBe('GET');
      req.flush(backendResponse);
    });

    it('should pass donorId as query parameter when provided', () => {
      const backendResponse = {
        success: true,
        data: [{ commType: 'MAIL', commTypeDesc: 'Mail' }],
        total: 1,
        statusCode: 200
      };

      service.getCommunicationTypes('D123456').subscribe();

      const req = httpMock.expectOne(r => r.url === `${baseUrl}/types` && r.params.get('donorId') === 'D123456');
      expect(req.request.method).toBe('GET');
      req.flush(backendResponse);
    });

    it('should return empty array on error', () => {
      service.getCommunicationTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/types`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should return empty array when response data is null', () => {
      service.getCommunicationTypes().subscribe(types => {
        expect(types).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/types`);
      req.flush({ success: true, data: null, total: 0 });
    });
  });

  // ──────────────────────────────────────────────
  // getCommunicationCodes
  // ──────────────────────────────────────────────

  describe('getCommunicationCodes', () => {
    it('should fetch codes for a type', () => {
      const commType = 'MAIL';
      const mockCodes: CommunicationCode[] = [
        { code: 'THK', description: 'Thank You' },
        { code: 'REM', description: 'Reminder' }
      ];

      service.getCommunicationCodes(commType).subscribe(codes => {
        expect(codes).toEqual(mockCodes);
      });

      const req = httpMock.expectOne(`${baseUrl}/codes/${commType}`);
      expect(req.request.method).toBe('GET');
      req.flush({ data: mockCodes, success: true });
    });

    it('should return empty array on error', () => {
      service.getCommunicationCodes('MAIL').subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/codes/MAIL`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  // ──────────────────────────────────────────────
  // getActionCodes
  // ──────────────────────────────────────────────

  describe('getActionCodes', () => {
    it('should fetch action codes and map response', () => {
      const commType = 'MAIL';
      const backendResponse = {
        success: true,
        data: [
          { actionCode: 'SEND', actionCodeDesc: 'Send Letter' },
          { actionCode: 'CALL', actionCodeDesc: 'Follow Up Call' }
        ],
        total: 2,
        statusCode: 200
      };

      const expectedCodes: ActionCode[] = [
        { code: 'SEND', description: 'Send Letter' },
        { code: 'CALL', description: 'Follow Up Call' }
      ];

      service.getActionCodes(commType).subscribe(codes => {
        expect(codes).toEqual(expectedCodes);
      });

      const req = httpMock.expectOne(`${baseUrl}/action-codes/${commType}`);
      expect(req.request.method).toBe('GET');
      req.flush(backendResponse);
    });

    it('should return empty array on error', () => {
      service.getActionCodes('MAIL').subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/action-codes/MAIL`);
      req.error(new ProgressEvent('Network error'));
    });
  });

  // ──────────────────────────────────────────────
  // getLetters
  // ──────────────────────────────────────────────

  describe('getLetters', () => {
    it('should fetch letter history and map backend fields from wrapped response', () => {
      const donorId = 'D123456';
      const backendResponse = {
        success: true,
        data: [
          {
            letterSeqNo: 'L001',
            generateDate: twoDaysAgo,
            comments: 'Thank you letter'
          }
        ],
        total: 1,
        statusCode: 200
      };
      const expectedMappedLetters: CommunicationLetter[] = [
        {
          letterId: 'L001',
          letterDate: twoDaysAgo,
          comments: 'Thank you letter',
          letterText: undefined
        }
      ];

      service.getLetters(donorId).subscribe(letters => {
        expect(letters).toEqual(expectedMappedLetters);
      });

      const req = httpMock.expectOne(`${baseUrl}/letters/${donorId}`);
      expect(req.request.method).toBe('GET');
      req.flush(backendResponse);
    });

    it('should handle unwrapped array response', () => {
      const donorId = 'D123456';
      const rawArray = [
        { LetterSeqNo: 'L002', GenerateDate: twoDaysAgo, Comments: 'Follow up' }
      ];

      service.getLetters(donorId).subscribe(letters => {
        expect(letters.length).toBe(1);
        expect(letters[0].letterId).toBe('L002');
        expect(letters[0].letterDate).toBe(twoDaysAgo);
        expect(letters[0].comments).toBe('Follow up');
      });

      const req = httpMock.expectOne(`${baseUrl}/letters/${donorId}`);
      req.flush(rawArray);
    });

    it('should return empty array on error', () => {
      service.getLetters('D123456').subscribe(letters => {
        expect(letters).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/letters/D123456`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle empty data array', () => {
      service.getLetters('D123456').subscribe(letters => {
        expect(letters).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/letters/D123456`);
      req.flush({ success: true, data: [], total: 0 });
    });

    it('should map PascalCase fields from backend response', () => {
      const donorId = 'D123456';

      service.getLetters(donorId).subscribe(letters => {
        expect(letters[0].letterId).toBe('L003');
        expect(letters[0].letterDate).toBe('2026-01-15');
        expect(letters[0].comments).toBe('PascalCase comment');
      });

      const req = httpMock.expectOne(`${baseUrl}/letters/${donorId}`);
      req.flush({
        success: true,
        data: [
          { LetterSeqNo: 'L003', GenerateDate: '2026-01-15', Comments: 'PascalCase comment' }
        ]
      });
    });
  });

  // ──────────────────────────────────────────────
  // getLetterText
  // ──────────────────────────────────────────────

  describe('getLetterText', () => {
    it('should fetch letter text as plain text', () => {
      const donorId = 'D123456';
      const letterId = 'L001';
      const mockText = 'Dear donor, thank you for your donation.';

      service.getLetterText(donorId, letterId).subscribe(text => {
        expect(text).toBe(mockText);
      });

      const req = httpMock.expectOne(`${baseUrl}/letter-text/${donorId}/${letterId}`);
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('text');
      req.flush(mockText);
    });
  });

  // ──────────────────────────────────────────────
  // getLetterCodes
  // ──────────────────────────────────────────────

  describe('getLetterCodes', () => {
    it('should fetch letter codes and map response', () => {
      const backendResponse = {
        success: true,
        data: [
          { letterCode: 'DEFR', letterTitle: 'Deferral Letter', versionNo: 2, versionDate: '2026-01-01' },
          { letterCode: 'THNK', letterTitle: 'Thank You Letter', versionNo: 1, versionDate: '2025-06-15' }
        ],
        total: 2,
        statusCode: 200
      };

      service.getLetterCodes().subscribe(codes => {
        expect(codes.length).toBe(2);
        expect(codes[0].code).toBe('DEFR');
        expect(codes[0].description).toBe('Deferral Letter');
        expect(codes[0].versionNumber).toBe('2');
        expect(codes[0].versionDate).toBe('2026-01-01');
        expect(codes[1].code).toBe('THNK');
      });

      const req = httpMock.expectOne(`${baseUrl}/letter-codes`);
      expect(req.request.method).toBe('GET');
      req.flush(backendResponse);
    });

    it('should return empty array on error', () => {
      service.getLetterCodes().subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/letter-codes`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle null data in response', () => {
      service.getLetterCodes().subscribe(codes => {
        expect(codes).toEqual([]);
      });

      const req = httpMock.expectOne(`${baseUrl}/letter-codes`);
      req.flush({ success: true, data: null, total: 0 });
    });
  });

  // ──────────────────────────────────────────────
  // retrieveLetterTemplate
  // ──────────────────────────────────────────────

  describe('retrieveLetterTemplate', () => {
    it('should fetch letter template and map response', () => {
      const letterCode = 'DEFR';
      const backendResponse = {
        letterCode: 'DEFR',
        letterTitle: 'Deferral Letter',
        versionNo: 2,
        versionDate: '2026-01-01',
        letterContent: 'Dear {{DonorName}}, you have been deferred...'
      };

      service.retrieveLetterTemplate(letterCode).subscribe(template => {
        expect(template.code).toBe('DEFR');
        expect(template.description).toBe('Deferral Letter');
        expect(template.versionNumber).toBe('2');
        expect(template.versionDate).toBe('2026-01-01');
        expect(template.letterText).toBe('Dear {{DonorName}}, you have been deferred...');
      });

      const req = httpMock.expectOne(`${baseUrl}/letter-template/${letterCode}`);
      expect(req.request.method).toBe('GET');
      req.flush(backendResponse);
    });

    it('should handle null versionNo', () => {
      const backendResponse = {
        letterCode: 'DEFR',
        letterTitle: 'Deferral Letter',
        versionNo: null,
        versionDate: '2026-01-01',
        letterContent: 'Text'
      };

      service.retrieveLetterTemplate('DEFR').subscribe(template => {
        expect(template.versionNumber).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/letter-template/DEFR`);
      req.flush(backendResponse);
    });
  });

  // ──────────────────────────────────────────────
  // generateLetter
  // ──────────────────────────────────────────────

  describe('generateLetter', () => {
    it('should post generate letter request and return merged text', () => {
      const donorId = 'D123456';
      const letterCode = 'DEFR';
      const commType = 'MAIL';
      const commCode = 'THK';
      const templateText = 'Dear {{DonorName}}, thank you.';
      const responseBody = { mergedText: 'Dear John Doe, thank you.', donorId: 'D123456' };

      service.generateLetter(donorId, letterCode, commType, commCode, templateText).subscribe(text => {
        expect(text).toBe('Dear John Doe, thank you.');
      });

      const req = httpMock.expectOne(`${baseUrl}/generate-letter`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.DonorIds).toEqual(['D123456']);
      expect(req.request.body.LetterCode).toBe('DEFR');
      expect(req.request.body.TemplateText).toBe(templateText);
      req.flush(responseBody);
    });

    it('should return empty string when mergedText is null', () => {
      service.generateLetter('D1', 'LC', 'MT', 'MC', 'template').subscribe(text => {
        expect(text).toBe('');
      });

      const req = httpMock.expectOne(`${baseUrl}/generate-letter`);
      req.flush({ mergedText: null, donorId: 'D1' });
    });
  });

  // ──────────────────────────────────────────────
  // saveAndPrintLetter
  // ──────────────────────────────────────────────

  describe('saveAndPrintLetter', () => {
    it('should post save and print request with all fields', () => {
      const donorId = 'D123456';
      const letterCode = 'DEFR';
      const commType = 'MAIL';
      const commCode = 'THK';
      const mergedText = 'Dear John, thank you.';
      const comments = 'Sent via email';

      service.saveAndPrintLetter(donorId, letterCode, commType, commCode, mergedText, comments)
        .subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save-print-letter`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.DonorId).toBe('D123456');
      expect(req.request.body.LetterCode).toBe('DEFR');
      expect(req.request.body.CommType).toBe('MAIL');
      expect(req.request.body.CommCode).toBe('THK');
      expect(req.request.body.MergedText).toBe(mergedText);
      expect(req.request.body.ComDesc).toBe('Sent via email');
      req.flush(null);
    });

    it('should default ComDesc to empty string when not provided', () => {
      service.saveAndPrintLetter('D1', 'LC', 'MT', 'MC', 'text').subscribe();

      const req = httpMock.expectOne(`${baseUrl}/save-print-letter`);
      expect(req.request.body.ComDesc).toBe('');
      req.flush(null);
    });
  });

  // ──────────────────────────────────────────────
  // getDonorHeader
  // ──────────────────────────────────────────────

  describe('getDonorHeader', () => {
    it('should fetch donor header and extract first item from data array', () => {
      const donorId = 'D123456';
      const backendResponse = {
        success: true,
        data: [
          { name: 'John Doe', dateOfBirth: '1990-01-15', sex: 'M', abo: 'O+' }
        ],
        total: 1,
        statusCode: 200
      };

      service.getDonorHeader(donorId).subscribe(header => {
        expect(header.name).toBe('John Doe');
        expect(header.dateOfBirth).toBe('1990-01-15');
        expect(header.sex).toBe('M');
        expect(header.abo).toBe('O+');
      });

      const req = httpMock.expectOne(`${demographicsUrl}/${donorId}/header`);
      expect(req.request.method).toBe('GET');
      req.flush(backendResponse);
    });

    it('should return fallback header when data array is empty', () => {
      service.getDonorHeader('D123456').subscribe(header => {
        expect(header.name).toBe('');
        expect(header.dateOfBirth).toBeUndefined();
        expect(header.sex).toBeUndefined();
        expect(header.abo).toBeUndefined();
      });

      const req = httpMock.expectOne(`${demographicsUrl}/D123456/header`);
      req.flush({ success: true, data: [], total: 0 });
    });

    it('should return fallback header when data is null', () => {
      service.getDonorHeader('D123456').subscribe(header => {
        expect(header.name).toBe('');
      });

      const req = httpMock.expectOne(`${demographicsUrl}/D123456/header`);
      req.flush({ success: true, data: null, total: 0 });
    });

    it('should return fallback header on error', () => {
      service.getDonorHeader('D123456').subscribe(header => {
        expect(header.name).toBe('');
        expect(header.dateOfBirth).toBeUndefined();
      });

      const req = httpMock.expectOne(`${demographicsUrl}/D123456/header`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should map PascalCase header fields', () => {
      service.getDonorHeader('D123456').subscribe(header => {
        expect(header.name).toBe('HARPER, SHIRLEY');
        expect(header.sex).toBe('F');
        expect(header.abo).toBe('A Pos');
      });

      const req = httpMock.expectOne(`${demographicsUrl}/D123456/header`);
      req.flush({
        success: true,
        data: [{ Name: 'HARPER, SHIRLEY', Sex: 'F', Abo: 'A Pos', DateOfBirth: '1972-08-22' }],
        total: 1
      });
    });
  });

  // ──────────────────────────────────────────────
  // getCommunications — camelCase API response
  // ──────────────────────────────────────────────

  describe('getCommunications - camelCase response', () => {
    it('should map camelCase API response fields', () => {
      const camelCaseResponse = {
        data: [{
          donorId: 'DN001',
          comType: 'CALL',
          comCode: 'COMM',
          comTypeDesc: 'Telephone',
          comCodeDesc: 'Communication',
          actionCodeDesc: '',
          insertUser: 'USER1',
          insertDate: '06-08-2000',
          comDate: '06-08-2000',
          actionCode: null,
          targetDate: null,
          actionDate: null,
          comDesc: 'Test note',
          userName: 'Doe, John',
          sequenceNumber: 5,
          chapterId: 'DAL',
          name: 'SMITH, JANE',
          dob: '01-15-1990',
          sex: 'F',
          abo: 'O Pos'
        }],
        total: 1
      };

      service.getCommunications('DN001').subscribe(response => {
        expect(response.data.length).toBe(1);
        const rec = response.data[0];
        expect(rec.donorId).toBe('DN001');
        expect(rec.comDate).toBe('06-08-2000');
        expect(rec.userName).toBe('Doe, John');
        expect(rec.comDesc).toBe('Test note');
        expect(rec.chapterId).toBe('DAL');
        expect(rec.name).toBe('SMITH, JANE');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-communication-query/'));
      req.flush(camelCaseResponse);
    });

    it('should fall back comDate to insertDate when comDate is missing', () => {
      const response = {
        Data: [{
          DonorId: 'DN002',
          ComType: 'MAIL',
          ComCode: 'THK',
          InsertUser: 'ADMIN',
          InsertDate: '09-07-2000',
          ChapterId: 'DAL',
          SequenceNumber: 1
        }],
        Total: 1
      };

      service.getCommunications('DN002').subscribe(resp => {
        expect(resp.data[0].comDate).toBe('09-07-2000');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-communication-query/'));
      req.flush(response);
    });

    it('should map UserName for formatted display name', () => {
      const response = {
        Data: [{
          DonorId: 'DN003',
          ComType: 'CALL',
          ComCode: 'COMM',
          InsertUser: 'DONSYS',
          UserName: 'A. Donsys',
          InsertDate: comDate,
          ChapterId: 'DAL',
          SequenceNumber: 1
        }],
        Total: 1
      };

      service.getCommunications('DN003').subscribe(resp => {
        expect(resp.data[0].userName).toBe('A. Donsys');
        expect(resp.data[0].insertUser).toBe('DONSYS');
      });

      const req = httpMock.expectOne(r => r.url.includes('/donor-communication-query/'));
      req.flush(response);
    });
  });

  // ──────────────────────────────────────────────
  // getActionCodes — targetDays mapping
  // ──────────────────────────────────────────────

  describe('getActionCodes - targetDays', () => {
    it('should map targetDays from API response', () => {
      const backendResponse = {
        success: true,
        data: [
          { actionCode: '1DNLT', actionCodeDesc: 'Mail first time donor letter', targetDays: 7 },
          { actionCode: 'CALL', actionCodeDesc: 'Follow Up Call', targetDays: 0 }
        ],
        total: 2,
        statusCode: 200
      };

      service.getActionCodes('CALL').subscribe(codes => {
        expect(codes[0].targetDays).toBe(7);
        expect(codes[1].targetDays).toBe(0);
      });

      const req = httpMock.expectOne(`${baseUrl}/action-codes/CALL`);
      req.flush(backendResponse);
    });

    it('should handle undefined targetDays', () => {
      const backendResponse = {
        success: true,
        data: [{ actionCode: 'SEND', actionCodeDesc: 'Send' }],
        total: 1,
        statusCode: 200
      };

      service.getActionCodes('MAIL').subscribe(codes => {
        expect(codes[0].targetDays).toBeUndefined();
      });

      const req = httpMock.expectOne(`${baseUrl}/action-codes/MAIL`);
      req.flush(backendResponse);
    });
  });

  // ──────────────────────────────────────────────
  // getUserFullName
  // ──────────────────────────────────────────────

  describe('getUserFullName', () => {
    const usersUrl = `${environment.apiUrl}/api/v1/donor-communication-query/users`;

    it('should return formatted user name when user found', () => {
      service.getUserFullName('NITOR1').subscribe(name => {
        expect(name).toBe('Nitor, User1');
      });

      const req = httpMock.expectOne(usersUrl);
      expect(req.request.method).toBe('GET');
      req.flush({
        Data: [
          { UserId: 'NITOR1', UserName: 'Nitor, User1' },
          { UserId: 'ADMIN', UserName: 'Admin, System' }
        ]
      });
    });

    it('should return userId when user not found', () => {
      service.getUserFullName('UNKNOWN').subscribe(name => {
        expect(name).toBe('UNKNOWN');
      });

      const req = httpMock.expectOne(usersUrl);
      req.flush({ Data: [{ UserId: 'OTHER', UserName: 'Other, User' }] });
    });

    it('should return userId on API error', () => {
      service.getUserFullName('ADMIN').subscribe(name => {
        expect(name).toBe('ADMIN');
      });

      const req = httpMock.expectOne(usersUrl);
      req.error(new ProgressEvent('Network error'));
    });

    it('should handle camelCase response', () => {
      service.getUserFullName('SB1234').subscribe(name => {
        expect(name).toBe('Baker, Sarah');
      });

      const req = httpMock.expectOne(usersUrl);
      req.flush([{ userId: 'SB1234', userName: 'Baker, Sarah' }]);
    });

    it('should match case-insensitively', () => {
      service.getUserFullName('admin').subscribe(name => {
        expect(name).toBe('Admin, System');
      });

      const req = httpMock.expectOne(usersUrl);
      req.flush({ data: [{ UserId: 'ADMIN', UserName: 'Admin, System' }] });
    });
  });

  // ──────────────────────────────────────────────
  // checkDlcomAccess
  // ──────────────────────────────────────────────

  describe('checkDlcomAccess', () => {
    it('should return true when user has DLCOM access', () => {
      service.checkDlcomAccess().subscribe(result => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/check-dlcom-access`);
      expect(req.request.method).toBe('GET');
      req.flush({ hasAccess: true });
    });

    it('should return false when user has no DLCOM access', () => {
      service.checkDlcomAccess().subscribe(result => {
        expect(result).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}/check-dlcom-access`);
      req.flush({ hasAccess: false });
    });

    it('should return false on API error', () => {
      service.checkDlcomAccess().subscribe(result => {
        expect(result).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}/check-dlcom-access`);
      req.error(new ProgressEvent('Network error'));
    });

    it('should return false when response is null', () => {
      service.checkDlcomAccess().subscribe(result => {
        expect(result).toBe(false);
      });

      const req = httpMock.expectOne(`${baseUrl}/check-dlcom-access`);
      req.flush(null);
    });
  });
});
