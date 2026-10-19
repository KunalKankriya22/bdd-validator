export interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface PlasmaFileTypeDto {
  code: string;
  description: string;
}

export interface XmlErrorLogEntryDto {
  logDescription: string;
}

export interface SearchXmlErrorLogRequest {
  plasmaFileType: string;
  logDate: string | null;
  searchText: string | null;
  pageNumber: number;
  pageSize: number;
}

export interface XmlErrorLogFilterValue {
  plasmaFileType: string | null;
  logDate: string | null;
}
