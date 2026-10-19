import { DriveResourceDto, DriveSponsorDto, DriveNoteDto } from '../models/special-drive.model';

export function mapToResourceDto(resource: any): DriveResourceDto {
  if (!resource) {
    throw new Error('Resource object is required');
  }

  return {
    driveId: resource.driveId ?? resource.DriveId ?? '',
    chapterId: resource.chapterId ?? resource.ChapterId ?? '',
    resourceCode: resource.resourceCode ?? resource.ResourceCode ?? '',
    resourceDescription: resource.resourceDescription ?? resource.ResourceDescription,
    numberRequired: resource.numberRequired ?? resource.NumberRequired ?? 0,
    sortSeq: resource.sortSeq ?? resource.SortSeq,
    programId: resource.programId ?? resource.ProgramId,
    insertDate: resource.insertDate ?? resource.InsertDate,
    insertUser: resource.insertUser ?? resource.InsertUser,
    auditKey: resource.auditKey ?? resource.AuditKey
  };
}

export function mapToSponsorDto(sponsor: any): DriveSponsorDto {
  if (!sponsor) {
    throw new Error('Sponsor object is required');
  }

  return {
    driveId: sponsor.driveId ?? sponsor.DriveId ?? '',
    chapterId: sponsor.chapterId ?? sponsor.ChapterId ?? '',
    sponsorId: sponsor.sponsorId ?? sponsor.SponsorId ?? '',
    sponsorName: sponsor.sponsorName ?? sponsor.SponsorName,
    projectedShow: sponsor.projectedShow ?? sponsor.ProjectedShow ?? 0,
    projectedDraw: sponsor.projectedDraw ?? sponsor.ProjectedDraw ?? 0,
    projDeferralRate: sponsor.projDeferralRate ?? sponsor.ProjDeferralRate,
    contactId: sponsor.contactId ?? sponsor.ContactId,
    programId: sponsor.programId ?? sponsor.ProgramId
  };
}

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

export function mapResourceArray(resources: any[] | undefined | null): DriveResourceDto[] {
  if (!resources || !Array.isArray(resources)) {
    return [];
  }
  return resources.map(r => mapToResourceDto(r));
}

export function mapSponsorArray(sponsors: any[] | undefined | null): DriveSponsorDto[] {
  if (!sponsors || !Array.isArray(sponsors)) {
    return [];
  }
  return sponsors.map(s => mapToSponsorDto(s));
}

export function mapNoteArray(notes: any[] | undefined | null): DriveNoteDto[] {
  if (!notes || !Array.isArray(notes)) {
    return [];
  }
  return notes.map(n => mapToNoteDto(n));
}
