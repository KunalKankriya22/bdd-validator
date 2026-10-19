export interface ChapterLookup {
  chapterId: string;
  chapterName: string;
}

export interface WarehouseLookup {
  warehouseID: string;
  warehouseName: string;
}

export interface LabCodeLookup {
  labCode: string;
  labDescription: string;
}

export interface PrinterCodeLookup {
  printerId: string;
  printerDescription: string;
}

export interface GroupLookup {
  applId: string;
  groupId: string;
  description: string;
  userCount: number;
  lastModifiedDate: string;
}

export interface AccessLevelLookup {
  value: number;
  label: string;
}

export interface ChapterAssignment {
  chapterID: string;
  effectiveDate: string; // ISO 8601 format
  terminationDate?: string; // ISO 8601 format
  defaultFlag: string; // "Y" or "N"
}

export interface WarehouseAssignment {
  warehouseID: string;
}

export interface CreateUserRequest {
  userId: string;
  firstName: string;
  lastName: string;
  initials?: string;
  userClass?: string;
  userEmail: string;
  staffNo?: string;
  adUserId?: string;
  labCode?: string;
  labDesciption?: string; // Note: Backend has typo - should be labDescription
  ktUserId?: string;
  printerId?: string;
  printerDescription?: string;
  effectiveDate: string; // ISO 8601 format
  terminationDate?: string; // ISO 8601 format
  warehouseID: string;
  chapters: ChapterAssignment[];
  warehouses: WarehouseAssignment[];
  groupCode: string;
  accessLevel: number; // 0-9
}

export interface UserDetailsResponse {
  userId: string;
  userFirstName: string;
  userLastName: string;
  chapterId?: string;
  warehouseId?: string;
  printHdr?: string;
  // Extended fields (when BE returns full data)
  userInitials?: string;
  userClass?: string;
  userEmail?: string;
  staffNo?: string;
  adUserId?: string;
  labCode?: string;
  labDescription?: string;
  ktUserId?: string;
  printerId?: string;
  printerDescription?: string;
  effectiveDate?: string;
  terminationDate?: string;
  lastModifiedDate?: string;
  lastModifiedBy?: string;
}

export interface UserGroupDetails {
  groupCode: string;
  groupDescription?: string;
  accessLevel: number;
}

export interface UserChapterDetail {
  chapterId: string;
  chapterName?: string;
  effectiveDate: string;
  terminationDate?: string;
  defaultFlag: string;
}

export type UpdateUserRequest = CreateUserRequest;

export interface ApiResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  message?: string;
  data?: T;
  responseCode?: number;
}