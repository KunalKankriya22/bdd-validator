/**
 * User management models and interfaces
 */

export interface Chapter {
  chapterId: string;
  chapterName: string;
  effectiveDate: string;
  terminationDate: string;
  status: 'Active' | 'Inactive';
  isDefault: boolean;
}

export interface Warehouse {
  warehouse: string;
  chapterName: string;
  defaultPrinter: string;
  status: string;
  isDefault: boolean;
}

export interface UserFormData {
  // Personal Information
  userId: string;
  firstName: string;
  lastName: string;
  nameInitials?: string;
  userClass?: string;
  email: string;
  staffNumber?: string;
  adUserId?: string;

  // System Configuration
  labCode?: string;
  labDescription?: string;
  qcUserId?: string;
  printerId?: string;
  printerDescription?: string;

  // Access Controls and Dates
  effectiveDate: Date | string;
  terminationDate?: Date | string;

  // Warehouse
  assignedWarehouse: string;

  // Group Information
  groupCode: string;
  groupName: string;
  accessLevel: string;
}

export interface AssignChapterDialogData {
  assignedWarehouse: string;
  editMode?: boolean;
  chapter?: Chapter;
}

export interface ChapterDialogResult {
  chapterId: string;
  chapterName: string;
  effectiveDate: Date;
  terminationDate?: Date;
}

export const CHAPTER_TABLE_COLUMNS = [
  'chapterId',
  'chapterName',
  'effectiveDate',
  'terminationDate',
  'status',
  'default',
  'actions'
];

export const WAREHOUSE_TABLE_COLUMNS = [
  'warehouse',
  'chapterName',
  'defaultPrinter',
  'status',
  'default',
  'actions'
];

export const SECTION_IDS = [
  'personal-info',
  'system-config',
  'access-controls',
  'warehouse',
  'group-info'
] as const;

export type SectionId = typeof SECTION_IDS[number];