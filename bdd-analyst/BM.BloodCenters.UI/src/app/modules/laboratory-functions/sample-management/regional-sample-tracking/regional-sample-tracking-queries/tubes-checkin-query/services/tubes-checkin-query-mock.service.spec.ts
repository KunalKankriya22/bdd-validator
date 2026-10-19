import { TestBed } from '@angular/core/testing';

import { TubesCheckinQueryMockService } from './tubes-checkin-query-mock.service';
import { CreateTubeNoteRequest, UpdateTubeNoteRequest } from '../tubes-notes-panel/tubes-notes-panel';

describe('TubesCheckinQueryMockService', () => {
  let service: TubesCheckinQueryMockService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TubesCheckinQueryMockService],
    });

    service = TestBed.inject(TubesCheckinQueryMockService);
  });

  describe('Notes CRUD operations', () => {
    const batchId = 'TEST-BATCH-001';
    const contractId = 'CONTRACT-001';


    it('should create a note and return it', (done) => {
      const request: CreateTubeNoteRequest = { note: 'Test note' };

      service.createBatchNote(batchId, contractId, request).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.data?.note).toBe('Test note');
        expect(response.data?.auditKey).toBeDefined();
        expect(response.data?.versionNo).toBe(1);
        done();
      });
    });

    it('should retrieve created notes', (done) => {
      const request: CreateTubeNoteRequest = { note: 'Test note' };

      service.createBatchNote(batchId, contractId, request).subscribe(() => {
        service.getBatchNotes(batchId, contractId).subscribe(response => {
          expect(response.success).toBe(true);
          expect(response.data).toBeTruthy();
          expect(response.data!.length).toBe(1);
          expect(response.data![0].note).toBe('Test note');
          done();
        });
      });
    });

    it('should update an existing note', (done) => {
      const createRequest: CreateTubeNoteRequest = { note: 'Original note' };
      const updateRequest: UpdateTubeNoteRequest = { note: 'Updated note' };

      service.createBatchNote(batchId, contractId, createRequest).subscribe(createResponse => {
        const noteId = String(createResponse.data?.auditKey);

        service.updateBatchNote(batchId, contractId, noteId, updateRequest).subscribe(updateResponse => {
          expect(updateResponse.success).toBe(true);
          expect(updateResponse.data?.note).toBe('Updated note');
          expect(updateResponse.data?.versionNo).toBe(2);
          expect(updateResponse.data?.updateUserName).toBeDefined();
          expect(updateResponse.data?.updateDateTime).toBeDefined();
          done();
        });
      });
    });

    it('should return error when updating non-existent note', (done) => {
      const updateRequest: UpdateTubeNoteRequest = { note: 'Updated note' };

      service.updateBatchNote(batchId, contractId, '999', updateRequest).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(404);
        expect(response.message).toBe('Note not found');
        done();
      });
    });

    it('should delete an existing note', (done) => {
      const createRequest: CreateTubeNoteRequest = { note: 'Note to delete' };

      service.createBatchNote(batchId, contractId, createRequest).subscribe(createResponse => {
        const noteId = String(createResponse.data?.auditKey);

        service.deleteBatchNote(batchId, contractId, noteId).subscribe(deleteResponse => {
          expect(deleteResponse.success).toBe(true);
          expect(deleteResponse.statusCode).toBe(200);

          // Verify note was deleted
          service.getBatchNotes(batchId, contractId).subscribe(response => {
            expect(response.data).toBeTruthy();
            expect(response.data!.length).toBe(0);
            done();
          });
        });
      });
    });

    it('should return error when deleting non-existent note', (done) => {
      service.deleteBatchNote(batchId, contractId, '999').subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(404);
        expect(response.message).toBe('Note not found');
        done();
      });
    });

    it('should handle multiple notes for same batch', (done) => {
      const request1: CreateTubeNoteRequest = { note: 'First note' };
      const request2: CreateTubeNoteRequest = { note: 'Second note' };

      service.createBatchNote(batchId, contractId, request1).subscribe(() => {
        service.createBatchNote(batchId, contractId, request2).subscribe(() => {
          service.getBatchNotes(batchId, contractId).subscribe(response => {
            expect(response.data).toBeTruthy();
            expect(response.data!.length).toBe(2);
            // Most recent note should be first (unshift)
            expect(response.data![0].note).toBe('Second note');
            expect(response.data![1].note).toBe('First note');
            done();
          });
        });
      });
    });

    it('should increment auditKey for each new note', (done) => {
      const request1: CreateTubeNoteRequest = { note: 'First note' };
      const request2: CreateTubeNoteRequest = { note: 'Second note' };

      service.createBatchNote(batchId, contractId, request1).subscribe(response1 => {
        const auditKey1 = response1.data?.auditKey;

        service.createBatchNote(batchId, contractId, request2).subscribe(response2 => {
          const auditKey2 = response2.data?.auditKey;

          expect(auditKey2).toBeGreaterThan(auditKey1!);
          done();
        });
      });
    });
  });
});
