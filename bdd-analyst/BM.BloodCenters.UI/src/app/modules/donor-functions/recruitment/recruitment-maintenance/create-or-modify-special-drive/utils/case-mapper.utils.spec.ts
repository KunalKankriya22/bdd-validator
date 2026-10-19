import {
  mapToResourceDto,
  mapToSponsorDto,
  mapToNoteDto,
  mapResourceArray,
  mapSponsorArray,
  mapNoteArray
} from './case-mapper.utils';
import { DriveResourceDto, DriveSponsorDto, DriveNoteDto } from '../models/special-drive.model';

describe('case-mapper.utils', () => {
  describe('mapToResourceDto', () => {
    // CRITICAL TEST: Zero value preservation (main bug fix)
    it('should preserve 0 value with camelCase numberRequired', () => {
      // Arrange
      const input = { resourceCode: 'STAFF', numberRequired: 0 };

      // Act
      const result = mapToResourceDto(input);

      // Assert
      expect(result.numberRequired).toBe(0);
    });

    it('should preserve 0 value with PascalCase NumberRequired', () => {
      // Arrange
      const input = { ResourceCode: 'VAN', NumberRequired: 0 };

      // Act
      const result = mapToResourceDto(input);

      // Assert
      expect(result.numberRequired).toBe(0);
    });

    it('should prefer camelCase when both cases present with 0 value', () => {
      // Arrange
      const input = {
        resourceCode: 'TENT',
        ResourceCode: 'TABLE',
        numberRequired: 0,
        NumberRequired: 5
      };

      // Act
      const result = mapToResourceDto(input);

      // Assert - camelCase takes precedence with ??
      expect(result.numberRequired).toBe(0);
    });

    it('should distinguish 0 from null from undefined', () => {
      // Arrange & Act & Assert
      const result1 = mapToResourceDto({ numberRequired: 0 });
      expect(result1.numberRequired).toBe(0);

      const result2 = mapToResourceDto({ numberRequired: null });
      expect(result2.numberRequired).toBe(0); // Falls back to default

      const result3 = mapToResourceDto({});
      expect(result3.numberRequired).toBe(0); // Falls back to default
    });

    it('should map all camelCase properties correctly', () => {
      // Arrange
      const input = {
        driveId: 'D123',
        chapterId: 'C456',
        resourceCode: 'STAFF',
        resourceDescription: 'Staff Member',
        numberRequired: 5,
        sortSeq: 1,
        programId: 'P789',
        insertDate: '2026-05-01',
        insertUser: 'user1',
        auditKey: 100
      };

      // Act
      const result = mapToResourceDto(input);

      // Assert
      expect(result).toEqual(input);
    });

    it('should map all PascalCase properties correctly', () => {
      // Arrange
      const input = {
        DriveId: 'D123',
        ChapterId: 'C456',
        ResourceCode: 'VAN',
        ResourceDescription: 'Van',
        NumberRequired: 2,
        SortSeq: 2,
        ProgramId: 'P789',
        InsertDate: '2026-05-01',
        InsertUser: 'user2',
        AuditKey: 200
      };

      // Act
      const result = mapToResourceDto(input);

      // Assert
      expect(result.driveId).toBe('D123');
      expect(result.chapterId).toBe('C456');
      expect(result.resourceCode).toBe('VAN');
      expect(result.resourceDescription).toBe('Van');
      expect(result.numberRequired).toBe(2);
      expect(result.sortSeq).toBe(2);
      expect(result.programId).toBe('P789');
      expect(result.insertDate).toBe('2026-05-01');
      expect(result.insertUser).toBe('user2');
      expect(result.auditKey).toBe(200);
    });

    it('should throw error when resource is null', () => {
      // Arrange & Act & Assert
      expect(() => mapToResourceDto(null)).toThrowError('Resource object is required');
    });

    it('should throw error when resource is undefined', () => {
      // Arrange & Act & Assert
      expect(() => mapToResourceDto(undefined)).toThrowError('Resource object is required');
    });
  });

  describe('mapToSponsorDto', () => {

    it('should map all camelCase properties correctly', () => {
      // Arrange
      const input = {
        driveId: 'D123',
        chapterId: 'C456',
        sponsorId: 'S789',
        sponsorName: 'Red Cross',
        projectedShow: 100,
        projectedDraw: 80,
        projDeferralRate: 15.5,
        contactId: 'CON123',
        programId: 'P789'
      };

      // Act
      const result = mapToSponsorDto(input);

      // Assert
      expect(result).toEqual(input);
    });

    it('should map all PascalCase properties correctly', () => {
      // Arrange
      const input = {
        DriveId: 'D123',
        ChapterId: 'C456',
        SponsorId: 'S789',
        SponsorName: 'Blood Center',
        ProjectedShow: 50,
        ProjectedDraw: 40,
        ProjDeferralRate: 10.2,
        ContactId: 'CON456',
        ProgramId: 'P789'
      };

      // Act
      const result = mapToSponsorDto(input);

      // Assert
      expect(result.driveId).toBe('D123');
      expect(result.chapterId).toBe('C456');
      expect(result.sponsorId).toBe('S789');
      expect(result.sponsorName).toBe('Blood Center');
      expect(result.projectedShow).toBe(50);
      expect(result.projectedDraw).toBe(40);
      expect(result.projDeferralRate).toBe(10.2);
      expect(result.contactId).toBe('CON456');
      expect(result.programId).toBe('P789');
    });

    it('should throw error when sponsor is null', () => {
      // Arrange & Act & Assert
      expect(() => mapToSponsorDto(null)).toThrowError('Sponsor object is required');
    });
  });

  describe('mapToNoteDto', () => {
    it('should preserve 0 value for noteSequence', () => {
      // Arrange
      const input = { noteId: 'N123', noteSequence: 0, note: 'Test' };

      // Act
      const result = mapToNoteDto(input);

      // Assert
      expect(result.noteSequence).toBe(0);
    });

    it('should map all camelCase properties correctly', () => {
      // Arrange
      const input = {
        noteId: 'N123',
        noteSequence: 1,
        note: 'Important note',
        insertDate: '2026-05-01',
        insertUser: 'user1',
        insertUserName: 'John Doe',
        localInsertDate: '2026-05-01T10:00:00',
        chapterId: 'C456',
        programId: 'P789'
      };

      // Act
      const result = mapToNoteDto(input);

      // Assert
      expect(result).toEqual(input);
    });

    it('should map all PascalCase properties correctly', () => {
      // Arrange
      const input = {
        NoteId: 'N456',
        NoteSequence: 2,
        Note: 'Another note',
        InsertDate: '2026-05-02',
        InsertUser: 'user2',
        InsertUserName: 'Jane Smith',
        LocalInsertDate: '2026-05-02T11:00:00',
        ChapterId: 'C789',
        ProgramId: 'P123'
      };

      // Act
      const result = mapToNoteDto(input);

      // Assert
      expect(result.noteId).toBe('N456');
      expect(result.noteSequence).toBe(2);
      expect(result.note).toBe('Another note');
      expect(result.insertDate).toBe('2026-05-02');
      expect(result.insertUser).toBe('user2');
      expect(result.insertUserName).toBe('Jane Smith');
      expect(result.localInsertDate).toBe('2026-05-02T11:00:00');
      expect(result.chapterId).toBe('C789');
      expect(result.programId).toBe('P123');
    });

    it('should throw error when note is null', () => {
      // Arrange & Act & Assert
      expect(() => mapToNoteDto(null)).toThrowError('Note object is required');
    });
  });

  describe('mapResourceArray', () => {
    it('should map array of resources correctly', () => {
      // Arrange
      const input = [
        { resourceCode: 'STAFF', numberRequired: 0 },
        { ResourceCode: 'VAN', NumberRequired: 2 }
      ];

      // Act
      const result = mapResourceArray(input);

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].numberRequired).toBe(0);
      expect(result[1].numberRequired).toBe(2);
    });

    it('should return empty array when input is null', () => {
      // Arrange & Act
      const result = mapResourceArray(null);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when input is undefined', () => {
      // Arrange & Act
      const result = mapResourceArray(undefined);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when input is not an array', () => {
      // Arrange & Act
      const result = mapResourceArray({} as any);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('mapSponsorArray', () => {
    it('should map array of sponsors correctly', () => {
      // Arrange
      const input = [
        { sponsorId: 'S1', projectedShow: 0, projectedDraw: 0 },
        { SponsorId: 'S2', ProjectedShow: 100, ProjectedDraw: 80 }
      ];

      // Act
      const result = mapSponsorArray(input);

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].projectedShow).toBe(0);
      expect(result[1].projectedShow).toBe(100);
    });

    it('should return empty array when input is null', () => {
      // Arrange & Act
      const result = mapSponsorArray(null);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when input is undefined', () => {
      // Arrange & Act
      const result = mapSponsorArray(undefined);

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('mapNoteArray', () => {
    it('should map array of notes correctly', () => {
      // Arrange
      const input = [
        { noteId: 'N1', noteSequence: 0, note: 'First' },
        { NoteId: 'N2', NoteSequence: 1, Note: 'Second' }
      ];

      // Act
      const result = mapNoteArray(input);

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].noteSequence).toBe(0);
      expect(result[1].noteSequence).toBe(1);
    });

    it('should return empty array when input is null', () => {
      // Arrange & Act
      const result = mapNoteArray(null);

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array when input is undefined', () => {
      // Arrange & Act
      const result = mapNoteArray(undefined);

      // Assert
      expect(result).toEqual([]);
    });
  });
});
