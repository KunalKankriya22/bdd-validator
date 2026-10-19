export interface GenericNotesDialogData {
  title: string;
  contextLabel: string;
  contextValue: string;
  notes: GenericNoteItem[];
}

export interface GenericNoteItem {
  noteId?: string | null;
  noteSequence: number;
  note?: string | null;
  auditKey?: number | null;
  insertDate?: string | null;
  insertUser?: string | null;
  insertUserName?: string | null;
  programId?: string | null;
  chapterId?: string | null;
}
