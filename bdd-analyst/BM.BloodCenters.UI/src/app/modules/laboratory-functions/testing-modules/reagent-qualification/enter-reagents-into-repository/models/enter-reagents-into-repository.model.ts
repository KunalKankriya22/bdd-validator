import { Moment } from 'moment';

export interface ReagentStoreDto {
  reagentId: string;
  testId: string;
  reagentType: string;
  reagentDesc?: string;
  reagentCode: string;
  reagentName?: string;
  reagentStatus: string;
  receivedDate: string | null;
  expiryDate: string | null;
  supplierCode: string | null;
  supplierName?: string;
  kitLotNumber: string | null;
  lotNumber: string;
  containerId: string | null;
  containerName?: string;
  controlInd: string | null;
  minStorageTemp: number | null;
  maxStorageTemp: number | null;
  storageLocation: string | null;
  storageLocName?: string;
  noOfTests: number;
  remainingTests?: number;
  visualQcFlag: string;
  rejectReasonCode: string | null;
  rejectReasonDesc?: string;
  disposition: string | null;
  licensedApproved: string | null;
  packageInsertDate: string | null;
  labCode: string | null;
  chapterId: string;
  noteId: number | null;
  note: string | null;
  receivedBy: string | null;
  prepRequired?: string;
  insertDate?: string;
  insertUser?: string;
}

export interface CreateReagentStoreRequestDto {
  testId: string;
  reagentType: string;
  reagentCode: string;
  receivedDate: string | null;
  expiryDate: string | null;
  supplierCode: string | null;
  kitLotNumber: string | null;
  lotNumber: string;
  containerId: string | null;
  controlInd: string | null;
  minStorageTemp: number | null;
  maxStorageTemp: number | null;
  storageLocation: string | null;
  noOfTests: number;
  visualQcFlag: string;
  rejectReasonCode: string | null;
  status: string | null;
  licensedApproved: string | null;
  packageInsertDate: string | null;
  note: string | null;
}

export interface UpdateReagentStoreRequestDto {
  reagentType?: string;
  reagentCode?: string;
  receivedDate: string | null;
  expiryDate: string | null;
  supplierCode: string | null;
  kitLotNumber: string | null;
  lotNumber?: string;
  containerId: string | null;
  controlInd: string | null;
  minStorageTemp: number | null;
  maxStorageTemp: number | null;
  storageLocation: string | null;
  noOfTests?: number;
  visualQcFlag?: string;
  rejectReasonCode: string | null;
  status: string | null;
  licensedApproved: string | null;
  packageInsertDate: string | null;
  note: string | null;
}

export interface ReagentStoreQueryDto {
  testId?: string;
  reagentId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  item?: T;
  message?: string;
  statusCode?: number;
  totalCount?: number;
  errorCode?: string;
  error?: string;
  errorResponse?: { errorCode: string; error: string };
}
