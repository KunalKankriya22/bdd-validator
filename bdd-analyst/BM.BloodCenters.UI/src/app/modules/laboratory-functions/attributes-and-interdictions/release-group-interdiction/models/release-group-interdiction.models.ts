export type SearchMode = 'DRIVE' | 'BATCH' | 'COLL_DATE' | 'LOT' | 'TB_ID' | 'ITBID';

export interface ReleaseGroupInterdictionDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  interCode: string;
  interDesc: string;
  interType: string;
  sourceTestId: string | null;
  effDate: string | null;
  termDate: string | null;
  driveId: string | null;
  batchId: string | null;
  lotNumber: string | null;
}

export interface ReleaseGroupInterdictionQueryDto {
  driveId?: string | null;
  batchId?: string | null;
  collectionDate?: string | null;
  lotNumber?: string | null;
  tbId?: string | null;
  sourceTestId: string;
  chapterId?: string;
  take?: number;
  skip?: number;
}

export interface ReleaseGroupInterdictionDeleteRequestDto {
  controlMode: string;
  filterValue: string;
  interCodes: string[];
}

export interface ReleaseGroupInterdictionUnitInfoDto {
  unitId: string;
  chkDigit: string | null;
  collDate: string | null;
}

export interface DriveDropdownItem {
  driveId: string;
}

export interface BatchDropdownItem {
  batchId: string;
}

export interface CollectionDateDropdownItem {
  collDate: string;
}

export interface LotNumberDropdownItem {
  lotNumber: string;
}

export interface TbIdDropdownItem {
  tbId: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  totalCount?: number;
  total?: number;
  error?: string;
  errorCode?: string | null;
  errorResponse?: {
    errorCode: string;
    error: string;
  } | null;
}

export interface DropdownApiResponse<T> {
  success: boolean;
  data: T[];
  message: string;
  statusCode: number;
}

export const SEARCH_MODE_OPTIONS: { value: SearchMode; label: string }[] = [
  { value: 'DRIVE', label: 'Drive ID' },
  { value: 'BATCH', label: 'Batch ID' },
  { value: 'COLL_DATE', label: 'Collection Date' },
  { value: 'LOT', label: 'Lot Number' },
  { value: 'TB_ID', label: 'TB ID' },
  { value: 'ITBID', label: 'Instrument TB ID' },
];

export const SEARCH_MODE_TO_SOURCE_TEST_ID: Record<SearchMode, string> = {
  DRIVE: 'DRIVE',
  BATCH: 'BATCH',
  COLL_DATE: 'COLL DATE',
  LOT: 'LOT',
  TB_ID: 'TBID',
  ITBID: 'ITBID',
};

export const VALIDATION = {
  DRIVE_ID_MAX_LENGTH: 6,
  BATCH_ID_MAX_LENGTH: 14,
  LOT_NUMBER_MAX_LENGTH: 15,
  TB_ID_MAX_LENGTH: 15,
  ITBID_MAX_LENGTH: 15,
} as const;
