import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { DonationNotesService } from './donation-notes.service';
import { API } from 'src/app/core/constants/api.constants';
import { environment } from '../../../../environments/environment';
import {
  DonationNoteDto,
  DonationNotesApiResponse,
  DonationNotesAccessApiResponse,
  DonationNotesMutationApiResponse,
  DonationNotesDeleteApiResponse,
  DonationNotesAccessItem,
} from './donation-notes.model';

describe('DonationNotesService', () => {
  let service: DonationNotesService;
  let httpMock: HttpTestingController;

  const mockNote: DonationNoteDto = {
    noteId: 'N1',
    noteSequence: 1,
    note: 'Test note',
    auditKey: 100,
    insertDate: '2025-06-01T10:00:00',
    insertUser: 'jdoe',
    insertUserName: 'John Doe',
    programId: 'P1',
    chapterId: 'C1',
  };

  const mockAccess: DonationNotesAccessItem = {
    canAdd: true,
    canEdit: true,
    canDelete: false,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DonationNotesService],
    });

    service = TestBed.inject(DonationNotesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ===========================================================================
  // 1. Service creation
  // ===========================================================================

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ===========================================================================
  // 2. loadNotesAndAccess
  // ===========================================================================

  describe('loadNotesAndAccess', () => {
    it('should fetch notes and access by unitId and collectionDate', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.loadNotesAndAccess(unitId, undefined, collDate).subscribe((result) => {
        expect(result.notes).toEqual([mockNote]);
        expect(result.access).toEqual(mockAccess);
      });

      const notesUrl = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      const accessUrl = `${environment.apiUrl}${API.DONATION_NOTES.ACCESS_BY_UNIT(unitId, collDate)}`;

      const notesReq = httpMock.expectOne(notesUrl);
      expect(notesReq.request.method).toBe('GET');
      notesReq.flush({
        success: true,
        message: '',
        statusCode: 200,
        data: [mockNote],
        total: 1,
        errorResponse: null,
      } as DonationNotesApiResponse);

      const accessReq = httpMock.expectOne(accessUrl);
      expect(accessReq.request.method).toBe('GET');
      accessReq.flush({
        success: true,
        message: '',
        statusCode: 200,
        item: mockAccess,
        errorResponse: null,
      } as DonationNotesAccessApiResponse);
    });

    it('should fetch notes and access by transactionId when unitId is not provided', () => {
      const txId = 'TX-001';

      service.loadNotesAndAccess(undefined, txId, undefined).subscribe((result) => {
        expect(result.notes).toEqual([mockNote]);
        expect(result.access).toEqual(mockAccess);
      });

      const notesUrl = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_TRANSACTION(txId)}`;
      const accessUrl = `${environment.apiUrl}${API.DONATION_NOTES.ACCESS_BY_TRANSACTION(txId)}`;

      const notesReq = httpMock.expectOne(notesUrl);
      notesReq.flush({
        success: true,
        message: '',
        statusCode: 200,
        data: [mockNote],
        total: 1,
        errorResponse: null,
      });

      const accessReq = httpMock.expectOne(accessUrl);
      accessReq.flush({
        success: true,
        message: '',
        statusCode: 200,
        item: mockAccess,
        errorResponse: null,
      });
    });

    it('should throw when notes response is unsuccessful', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.loadNotesAndAccess(unitId, undefined, collDate).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to load donation notes');
        },
      });

      const notesUrl = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      const accessUrl = `${environment.apiUrl}${API.DONATION_NOTES.ACCESS_BY_UNIT(unitId, collDate)}`;

      const notesReq = httpMock.expectOne(notesUrl);
      notesReq.flush({
        success: false,
        message: '',
        statusCode: 400,
        data: [],
        total: 0,
        errorResponse: null,
      });

      const accessReq = httpMock.expectOne(accessUrl);
      accessReq.flush({
        success: true,
        message: '',
        statusCode: 200,
        item: mockAccess,
        errorResponse: null,
      });
    });

    it('should throw when access response is unsuccessful', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.loadNotesAndAccess(unitId, undefined, collDate).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to load access level');
        },
      });

      const notesUrl = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      const accessUrl = `${environment.apiUrl}${API.DONATION_NOTES.ACCESS_BY_UNIT(unitId, collDate)}`;

      const notesReq = httpMock.expectOne(notesUrl);
      notesReq.flush({
        success: true,
        message: '',
        statusCode: 200,
        data: [mockNote],
        total: 1,
        errorResponse: null,
      });

      const accessReq = httpMock.expectOne(accessUrl);
      accessReq.flush({
        success: false,
        message: '',
        statusCode: 403,
        item: null,
        errorResponse: null,
      });
    });

    it('should pass X-Source-Context header when context is provided', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.loadNotesAndAccess(unitId, undefined, collDate, 'DONATION').subscribe();

      const notesUrl = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      const accessUrl = `${environment.apiUrl}${API.DONATION_NOTES.ACCESS_BY_UNIT(unitId, collDate)}`;

      const notesReq = httpMock.expectOne(notesUrl);
      expect(notesReq.request.headers.get('X-Source-Context')).toBe('DONATION');
      notesReq.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });

      const accessReq = httpMock.expectOne(accessUrl);
      expect(accessReq.request.headers.get('X-Source-Context')).toBe('DONATION');
      accessReq.flush({ success: true, item: mockAccess, message: '', statusCode: 200, errorResponse: null });
    });

    it('should return empty notes array when data is null', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.loadNotesAndAccess(unitId, undefined, collDate).subscribe((result) => {
        expect(result.notes).toEqual([]);
      });

      const notesUrl = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      const accessUrl = `${environment.apiUrl}${API.DONATION_NOTES.ACCESS_BY_UNIT(unitId, collDate)}`;

      httpMock.expectOne(notesUrl).flush({
        success: true, data: null, total: 0, message: '', statusCode: 200, errorResponse: null,
      });
      httpMock.expectOne(accessUrl).flush({
        success: true, item: mockAccess, message: '', statusCode: 200, errorResponse: null,
      });
    });
  });

  // ===========================================================================
  // 3. fetchNotes
  // ===========================================================================

  describe('fetchNotes', () => {
    it('should fetch notes by unitId', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.fetchNotes(unitId, undefined, collDate).subscribe((notes) => {
        expect(notes).toEqual([mockNote]);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('GET');
      req.flush({
        success: true,
        data: [mockNote],
        total: 1,
        message: '',
        statusCode: 200,
        errorResponse: null,
      });
    });

    it('should fetch notes by transactionId when unitId is not provided', () => {
      const txId = 'TX-001';

      service.fetchNotes(undefined, txId).subscribe((notes) => {
        expect(notes).toEqual([mockNote]);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_TRANSACTION(txId)}`;
      const req = httpMock.expectOne(url);
      req.flush({
        success: true,
        data: [mockNote],
        total: 1,
        message: '',
        statusCode: 200,
        errorResponse: null,
      });
    });

    it('should throw when response is unsuccessful', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.fetchNotes(unitId, undefined, collDate).subscribe({
        error: (err) => {
          expect(err.message).toBe('Custom error message');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      httpMock.expectOne(url).flush({
        success: false,
        data: [],
        total: 0,
        message: 'Custom error message',
        statusCode: 400,
        errorResponse: null,
      });
    });

    it('should return empty array when data is null', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.fetchNotes(unitId, undefined, collDate).subscribe((notes) => {
        expect(notes).toEqual([]);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      httpMock.expectOne(url).flush({
        success: true, data: null, total: 0, message: '', statusCode: 200, errorResponse: null,
      });
    });

    it('should include X-Source-Context header when context is provided', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.fetchNotes(unitId, undefined, collDate, 'RGITUBES').subscribe();

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.headers.get('X-Source-Context')).toBe('RGITUBES');
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });
  });

  // ===========================================================================
  // 4. addNote
  // ===========================================================================

  describe('addNote', () => {
    it('should post a new note and return updated notes', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';
      const noteText = 'New note content';

      service.addNote(noteText, unitId, undefined, collDate).subscribe((notes) => {
        expect(notes).toEqual([mockNote]);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ note: noteText });
      req.flush({
        success: true,
        data: [mockNote],
        total: 1,
        message: '',
        statusCode: 200,
        errorResponse: null,
      } as DonationNotesMutationApiResponse);
    });

    it('should post by transactionId when unitId is not provided', () => {
      const txId = 'TX-001';
      const noteText = 'Tx note';

      service.addNote(noteText, undefined, txId).subscribe((notes) => {
        expect(notes).toEqual([mockNote]);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_TRANSACTION(txId)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('POST');
      req.flush({
        success: true,
        data: [mockNote],
        total: 1,
        message: '',
        statusCode: 200,
        errorResponse: null,
      });
    });

    it('should throw when add response is unsuccessful', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.addNote('text', unitId, undefined, collDate).subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to add note');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      httpMock.expectOne(url).flush({
        success: false, data: [], total: 0, message: '', statusCode: 400, errorResponse: null,
      });
    });

    it('should use custom error message when provided', () => {
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.addNote('text', unitId, undefined, collDate).subscribe({
        error: (err) => {
          expect(err.message).toBe('Duplicate note');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT(unitId, collDate)}`;
      httpMock.expectOne(url).flush({
        success: false, data: [], total: 0, message: 'Duplicate note', statusCode: 400, errorResponse: null,
      });
    });
  });

  // ===========================================================================
  // 5. updateNote
  // ===========================================================================

  describe('updateNote', () => {
    it('should put an updated note and return updated notes list', () => {
      const auditKey = 100;
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';
      const noteText = 'Updated note content';

      service.updateNote(auditKey, noteText, unitId, collDate).subscribe((notes) => {
        expect(notes).toEqual([mockNote]);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.UPDATE_NOTE_BY_UNIT(unitId, collDate, auditKey)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ note: noteText });
      req.flush({
        success: true,
        data: [mockNote],
        total: 1,
        message: '',
        statusCode: 200,
        errorResponse: null,
      } as DonationNotesMutationApiResponse);
    });

    it('should throw when update response is unsuccessful', () => {
      service.updateNote(100, 'text', 'UNIT-001', '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Update not allowed');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.UPDATE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      httpMock.expectOne(url).flush({
        success: false, data: [], total: 0, message: 'Update not allowed', statusCode: 403, errorResponse: null,
      });
    });

    it('should pass X-Source-Context header when context is provided', () => {
      service.updateNote(100, 'text', 'UNIT-001', '2025-06-01', 'DONATION').subscribe();

      const url = `${environment.apiUrl}${API.DONATION_NOTES.UPDATE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.headers.get('X-Source-Context')).toBe('DONATION');
      req.flush({ success: true, data: [mockNote], total: 1, message: '', statusCode: 200, errorResponse: null });
    });

    it('should format ISO date string to YYYY-MM-DD', () => {
      service.updateNote(100, 'text', 'UNIT-001', '2025-06-01T10:00:00Z').subscribe();

      const url = `${environment.apiUrl}${API.DONATION_NOTES.UPDATE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [mockNote], total: 1, message: '', statusCode: 200, errorResponse: null });
    });
  });

  // ===========================================================================
  // 6. deleteNote
  // ===========================================================================

  describe('deleteNote', () => {
    it('should delete a note and return success boolean', () => {
      const auditKey = 100;
      const unitId = 'UNIT-001';
      const collDate = '2025-06-01';

      service.deleteNote(auditKey, unitId, collDate).subscribe((result) => {
        expect(result).toBe(true);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.DELETE_NOTE_BY_UNIT(unitId, collDate, auditKey)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.method).toBe('DELETE');
      req.flush({
        success: true,
        item: true,
        message: '',
        statusCode: 200,
        errorResponse: null,
      } as DonationNotesDeleteApiResponse);
    });

    it('should throw when delete response is unsuccessful', () => {
      service.deleteNote(100, 'UNIT-001', '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to delete note');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.DELETE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      httpMock.expectOne(url).flush({
        success: false, item: false, message: '', statusCode: 400, errorResponse: null,
      });
    });

    it('should throw with custom error message when provided', () => {
      service.deleteNote(100, 'UNIT-001', '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Note locked');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.DELETE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      httpMock.expectOne(url).flush({
        success: false, item: false, message: 'Note locked', statusCode: 400, errorResponse: null,
      });
    });

    it('should pass X-Source-Context header when context is provided', () => {
      service.deleteNote(100, 'UNIT-001', '2025-06-01', 'DONATION').subscribe();

      const url = `${environment.apiUrl}${API.DONATION_NOTES.DELETE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      const req = httpMock.expectOne(url);
      expect(req.request.headers.get('X-Source-Context')).toBe('DONATION');
      req.flush({ success: true, item: true, message: '', statusCode: 200, errorResponse: null });
    });
  });

  // ===========================================================================
  // 7. formatCollectionDate (tested indirectly)
  // ===========================================================================

  describe('date formatting (via public methods)', () => {
    it('should pass through YYYY-MM-DD dates unchanged', () => {
      service.fetchNotes('UNIT-001', undefined, '2025-06-01').subscribe();
      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });

    it('should handle empty date string', () => {
      service.fetchNotes('UNIT-001', undefined, '').subscribe();
      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });

    it('should handle undefined date string', () => {
      service.fetchNotes('UNIT-001', undefined, undefined).subscribe();
      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });

    it('should format non-ISO date strings via Date parsing', () => {
      // Pass an ISO datetime string which should be parsed to YYYY-MM-DD
      service.fetchNotes('UNIT-001', undefined, 'Jun 1 2025').subscribe();
      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });
  });

  // ===========================================================================
  // 8. buildRequestOptions (tested indirectly)
  // ===========================================================================

  describe('request options', () => {
    it('should not include X-Source-Context header when context is undefined', () => {
      service.fetchNotes('UNIT-001', undefined, '2025-06-01').subscribe();
      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.headers.has('X-Source-Context')).toBe(false);
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });

    it('should include X-Source-Context header when context is provided', () => {
      service.fetchNotes('UNIT-001', undefined, '2025-06-01', 'RGITUBES').subscribe();
      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      const req = httpMock.expectOne(url);
      expect(req.request.headers.get('X-Source-Context')).toBe('RGITUBES');
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });
  });

  // ===========================================================================
  // 9. Error message fallback branches (truthy || paths)
  // ===========================================================================

  describe('error message fallback branches', () => {
    it('should use custom message from notes response when available', () => {
      service.loadNotesAndAccess('UNIT-001', undefined, '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Custom notes error');
        },
      });

      const notesUrl = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      const accessUrl = `${environment.apiUrl}${API.DONATION_NOTES.ACCESS_BY_UNIT('UNIT-001', '2025-06-01')}`;

      httpMock.expectOne(notesUrl).flush({
        success: false, data: [], total: 0, message: 'Custom notes error', statusCode: 400, errorResponse: null,
      });

      httpMock.expectOne(accessUrl).flush({
        success: true, item: mockAccess, message: '', statusCode: 200, errorResponse: null,
      });
    });

    it('should use custom message from access response when available', () => {
      service.loadNotesAndAccess('UNIT-001', undefined, '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Custom access error');
        },
      });

      const notesUrl = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      const accessUrl = `${environment.apiUrl}${API.DONATION_NOTES.ACCESS_BY_UNIT('UNIT-001', '2025-06-01')}`;

      httpMock.expectOne(notesUrl).flush({
        success: true, data: [mockNote], total: 1, message: '', statusCode: 200, errorResponse: null,
      });

      httpMock.expectOne(accessUrl).flush({
        success: false, item: null, message: 'Custom access error', statusCode: 403, errorResponse: null,
      });
    });

    it('should use custom message from fetchNotes when available', () => {
      service.fetchNotes('UNIT-001', undefined, '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Fetch notes custom error');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      httpMock.expectOne(url).flush({
        success: false, data: [], total: 0, message: 'Fetch notes custom error', statusCode: 400, errorResponse: null,
      });
    });

    it('should use default message from fetchNotes when message is empty', () => {
      service.fetchNotes('UNIT-001', undefined, '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to load donation notes');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      httpMock.expectOne(url).flush({
        success: false, data: [], total: 0, message: '', statusCode: 400, errorResponse: null,
      });
    });

    it('should return null data as empty array in addNote', () => {
      service.addNote('text', 'UNIT-001', undefined, '2025-06-01').subscribe((notes) => {
        expect(notes).toEqual([]);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      httpMock.expectOne(url).flush({
        success: true, data: null, total: 0, message: '', statusCode: 200, errorResponse: null,
      });
    });

    it('should return null data as empty array in updateNote', () => {
      service.updateNote(100, 'text', 'UNIT-001', '2025-06-01').subscribe((notes) => {
        expect(notes).toEqual([]);
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.UPDATE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      httpMock.expectOne(url).flush({
        success: true, data: null, total: 0, message: '', statusCode: 200, errorResponse: null,
      });
    });

    it('should use default message from updateNote when message is empty', () => {
      service.updateNote(100, 'text', 'UNIT-001', '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to update note');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.UPDATE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      httpMock.expectOne(url).flush({
        success: false, data: [], total: 0, message: '', statusCode: 400, errorResponse: null,
      });
    });

    it('should use default message from deleteNote when message is empty', () => {
      service.deleteNote(100, 'UNIT-001', '2025-06-01').subscribe({
        error: (err) => {
          expect(err.message).toBe('Failed to delete note');
        },
      });

      const url = `${environment.apiUrl}${API.DONATION_NOTES.DELETE_NOTE_BY_UNIT('UNIT-001', '2025-06-01', 100)}`;
      httpMock.expectOne(url).flush({
        success: false, item: false, message: '', statusCode: 400, errorResponse: null,
      });
    });
  });

  // ===========================================================================
  // 10. URL routing: unitId takes priority over transactionId
  // ===========================================================================

  describe('URL routing priority', () => {
    it('should use unitId URL even when both unitId and transactionId are provided', () => {
      service.fetchNotes('UNIT-001', 'TX-001', '2025-06-01').subscribe();
      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', '2025-06-01')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });

    it('should use unparsable date string as-is', () => {
      service.fetchNotes('UNIT-001', undefined, 'not-a-date').subscribe();
      const url = `${environment.apiUrl}${API.DONATION_NOTES.NOTES_BY_UNIT('UNIT-001', 'not-a-date')}`;
      const req = httpMock.expectOne(url);
      req.flush({ success: true, data: [], total: 0, message: '', statusCode: 200, errorResponse: null });
    });
  });
});
