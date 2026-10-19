// API Response DTOs
import { Moment } from 'moment';

export interface ReportInfoDto {
  reportName?: string | null;
  reportType?: string | null;
  title?: string | null;
  subtitle?: string | null;
  printId?: string | null;
  formsType?: string | null;
  batchQueue?: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
}

export interface ReportParmDefinitionDto {
  parmNo: number;
  parmCode?: string | null;
  parmPrompt?: string | null;
  codeType?: string | null; // DATE, TEXT, NUMBER, LIST
  refTable?: string | null;
  refColumn?: string | null;
  defaultValue?: string | null;
  listEntryFlag?: string | null; // Y/N
  upperCaseFlag?: string | null; // Y/N
  refSql?: string | null;
  lovTitle?: string | null;
  lovCol1Name?: string | null;
  lovCol2Name?: string | null;
  lovLimit?: string | null; // Y = requires search (autocomplete), N/null = dropdown
  lovItems?: ParameterLovItemDto[]; // Pre-loaded LOV items from parm-definitions endpoint
  totalLovCount?: number | null;
}

export interface ParameterLovItemDto {
  code: string;
  description: string;
}

export interface ReportParmIdDto {
  parmId?: string | null;
  submitDate?: string | null;
}

export interface ReportParameterValueDto {
  parmNo: number;
  parmSelect?: string | null;
  parmCode?: string | null;
}

export interface SavedReportParametersDto {
  parmId: string;
  reportName: string;
  submitDate?: string | null;
  reportStatus?: string | null;
  printId?: string | null;
  formsType?: string | null;
  parameters: ReportParameterValueDto[];
}

export interface MasterCodeDto {
  code?: string | null;
  codeDesc?: string | null;
}

export interface SubmitReportRequestDto {
  reportName: string;
  parmId?: string | null;
  printId?: string | null;
  formsType?: string | null;
  submitFlag: string;
  headerAndTrailerFlag: string;
  autoPrintFlag: string;
  deleteAfterPrintFlag: string;
  noOfCopies: number;
  startTime?: string | null;
  parameters?: ReportParameterValueDto[] | null;
}

export interface SubmitReportResponseDto {
  jobId: string;
  parmId: string;
  reportName: string;
  status: string;
  message: string;
}

export interface ReportJobStatusDto {
  parmId: string;
  reportName?: string | null;
  statusCode?: string | null;
  statusMessage?: string | null;
  queued?: Date | null;
  outputFile?: string | null;
  fileName?: string | null;
}

export interface GenerateParmIdResponse {
  parmId: string;
  userId: string;
  sequenceNumber: number;
  generatedAt: Date;
}

export interface ValidateParameterRequest {
  value: string;
  allowWildcard: boolean;
}

export interface ValidateParameterResponse {
  isValid: boolean;
  message: string;
  formattedValue?: string; // Auto-formatted value (e.g., "052326" → "05-23-26")
}

// UI Models

export interface ReportNameOption {
  reportName: string;
  title: string;
}

export interface ReportSubmissionDetail {
  reportName: string;
  reportDescription: string;
  title: string;
  subTitle: string;
  printId?: string | null;
  formsType?: string | null;
  parameters: ReportSubmissionParameter[];
}

export interface ReportSubmissionParameter {
  parmNo: number;
  parmCode: string;
  parmPrompt: string;
  codeType: 'DATE' | 'TEXT' | 'NUMBER' | 'LIST' | 'CHAR' | 'DATETM' | 'ODATE';
  isMultiSelect: boolean;
  listEntryFlag: string; // Y/N - indicates if field supports list entry
  options: ParameterOption[];
  defaultValue: string;
  value: string | string[] | Date | Moment | null;
  refTable?: string | null;
  refColumn?: string | null;
  refSql?: string | null;
  totalLovCount?: number | null;
  selectionMode?: 'individual' | 'all';
}

export interface ParameterOption {
  code: string;
  description: string;
}

export interface SubmitReportPayload {
  reportName: string;
  parmId?: string | null;
  printId?: string | null;
  formsType?: string | null;
  autoPrint: boolean;
  printHeaderTrailer: boolean;
  deleteAfterPrint: boolean;
  noOfCopies: number;
  parameters: { parmNo: number; parmSelect: string; parmCode: string }[];
}

export interface ScheduleReportPayload extends SubmitReportPayload {
  startTime: string;
}

export interface ScheduleDialogData {
  reportTitle: string;
}

export interface ScheduleDialogResult {
  scheduledTime: string; // ISO 8601 datetime string
}

export interface ReportTypeDto {
  reportType: string;
}

// Re-export shared dropdown types
export type { DropdownItem, DropdownPage, DropdownFetchFn, SelectionMode, DropdownSelectionState } from '@shared/components/smart-dropdown/smart-dropdown.model';

export interface PaginatedLovResponse {
  items: ParameterLovItemDto[];
  totalCount: number;
  hasMore: boolean;
  metadata: {
    title: string;
    column1Name: string;
    column2Name: string;
    requiresSearch: boolean;
    minSearchLength: number;
    isPaginated: boolean;
  };
}
