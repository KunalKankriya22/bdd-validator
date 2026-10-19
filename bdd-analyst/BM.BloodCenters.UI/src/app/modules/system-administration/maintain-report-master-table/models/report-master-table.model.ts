export interface ReportMasterTableModel {
  chapterID: string;
  type: string;
  code: string;
  description: string;
  command: string;
  port: string;
  sequence: number | null;
  warehouse: string;
  warehouseDescrription: string;
  clientHostName: string;
}

export interface ReportMasterTableParamsDto {
  CodeType?: string;
  ChapterID?: string;
  Warehouse?: string;
  EffectiveDatePeriod?: string;
  EffectiveDate?: string;
  TerminationDatePeriod?: string;
  TerminationDate?: string;
  SearchKeyword?: string;
  Sort?: string;
}

export interface ReportMasterTableResponse {
  data: ReportMasterTableModel[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
}

export type SortDirection = 'A' | 'D' | 'default';

export interface SortConfig {
  column: string;
  direction: SortDirection;
}

export interface PaginationConfig {
  pageIndex: number;
  pageSize: number;
  pageSizeOptions: number[];
  totalRecords: number;
}

export interface ReportMasterTableFilterLov {
  type: string[];
  chapterID: string[];
  warehouse: string[];
  warehouseName: string[];
  warehouseDisplay: string[];
}

export interface WarehouseChapterLovResponse {
  warehouses: Array<{ id: string; description: string }>;
  chapters: Array<{ id: string; name: string }>;
}

export interface ReportMasterTableFilterValue {
  type: string | null;
  chapterId: string | null;
  warehouse: string | null;
  effectiveDatePeriod: string | null;
  effectiveDate: Date | null;
  terminationDatePeriod: string | null;
  terminationDate: Date | null;
}