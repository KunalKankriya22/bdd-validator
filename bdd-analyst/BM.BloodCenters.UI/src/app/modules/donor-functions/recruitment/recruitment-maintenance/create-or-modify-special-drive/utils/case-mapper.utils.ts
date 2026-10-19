import { DriveResourceDto, DriveSponsorDto, DriveNoteDto } from '../models/special-drive.model';

/**
 * Maps backend response (PascalCase or camelCase) to DriveResourceDto (camelCase)
 * Uses nullish coalescing (??) to preserve falsy values like 0
 * @param resource - Resource object from backend (may have PascalCase or camelCase properties)
 * @returns DriveResourceDto with camelCase properties
 */
export function mapToResourceDto(resource: any): DriveResourceDto {
  if (!resource) {
    throw new Error('Resource object is required');
  }

  return {
    driveId: resource.driveId ?? resource.DriveId ?? '',
    chapterId: resource.chapterId ?? resource.ChapterId ?? '',
    resourceCode: resource.resourceCode ?? resource.ResourceCode ?? '',
    resourceDescription: resource.resourceDescription ?? resource.ResourceDescription,
    // CRITICAL: Use ?? instead of || to preserve 0 values
    numberRequired: resource.numberRequired ?? resource.NumberRequired ?? 0,
    sortSeq: resource.sortSeq ?? resource.SortSeq,
    programId: resource.programId ?? resource.ProgramId,
    insertDate: resource.insertDate ?? resource.InsertDate,
    insertUser: resource.insertUser ?? resource.InsertUser,
    auditKey: resource.auditKey ?? resource.AuditKey
  };
}

/**
 * Maps backend response (PascalCase or camelCase) to DriveSponsorDto (camelCase)
 * @param sponsor - Sponsor object from backend
 * @returns DriveSponsorDto with camelCase properties
 */
export function mapToSponsorDto(sponsor: any): DriveSponsorDto {
  if (!sponsor) {
    throw new Error('Sponsor object is required');
  }

  return {
    driveId: sponsor.driveId ?? sponsor.DriveId ?? '',
    chapterId: sponsor.chapterId ?? sponsor.ChapterId ?? '',
    sponsorId: sponsor.sponsorId ?? sponsor.SponsorId ?? '',
    sponsorName: sponsor.sponsorName ?? sponsor.SponsorName,
    // Use ?? to preserve 0 values for projections
    projectedShow: sponsor.projectedShow ?? sponsor.ProjectedShow ?? 0,
    projectedDraw: sponsor.projectedDraw ?? sponsor.ProjectedDraw ?? 0,
    projDeferralRate: sponsor.projDeferralRate ?? sponsor.ProjDeferralRate,
    contactId: sponsor.contactId ?? sponsor.ContactId,
    programId: sponsor.programId ?? sponsor.ProgramId
  };
}

/**
 * Maps backend response (PascalCase or camelCase) to DriveNoteDto (camelCase)
 * @param note - Note object from backend
 * @returns DriveNoteDto with camelCase properties
 */
export function mapToNoteDto(note: any): DriveNoteDto {
  if (!note) {
    throw new Error('Note object is required');
  }

  return {
    noteId: note.noteId ?? note.NoteId ?? '',
    noteSequence: note.noteSequence ?? note.NoteSequence ?? 0,
    note: note.note ?? note.Note ?? '',
    insertDate: note.insertDate ?? note.InsertDate,
    insertUser: note.insertUser ?? note.InsertUser,
    insertUserName: note.insertUserName ?? note.InsertUserName,
    localInsertDate: note.localInsertDate ?? note.LocalInsertDate,
    chapterId: note.chapterId ?? note.ChapterId,
    programId: note.programId ?? note.ProgramId
  };
}

/**
 * Maps an array of resources from backend to DriveResourceDto array
 * Returns empty array if input is null/undefined
 * @param resources - Array of resource objects (may be undefined, null, or array)
 * @returns Array of DriveResourceDto
 */
export function mapResourceArray(resources: any[] | undefined | null): DriveResourceDto[] {
  if (!resources || !Array.isArray(resources)) {
    return [];
  }

  return resources.map(r => mapToResourceDto(r));
}

/**
 * Maps an array of sponsors from backend to DriveSponsorDto array
 * Returns empty array if input is null/undefined
 * @param sponsors - Array of sponsor objects (may be undefined, null, or array)
 * @returns Array of DriveSponsorDto
 */
export function mapSponsorArray(sponsors: any[] | undefined | null): DriveSponsorDto[] {
  if (!sponsors || !Array.isArray(sponsors)) {
    return [];
  }

  return sponsors.map(s => mapToSponsorDto(s));
}

/**
 * Maps an array of notes from backend to DriveNoteDto array
 * Returns empty array if input is null/undefined
 * @param notes - Array of note objects (may be undefined, null, or array)
 * @returns Array of DriveNoteDto
 */
export function mapNoteArray(notes: any[] | undefined | null): DriveNoteDto[] {
  if (!notes || !Array.isArray(notes)) {
    return [];
  }

  return notes.map(n => mapToNoteDto(n));
}
