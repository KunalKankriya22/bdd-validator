export interface TestBatchLovItem {
  tbId: string;
  insertDate: string;
}

export interface TestBatchOption {
  id: string;
  displayName: string;
}

export interface TestBatchDetailDto {
  tbId: string;
  testChapterId: string;
  testId: string;
  testKitId: string | null;
  testType: string;
  testingLabCode: string;
  testDesc: string | null;
  testGroup: string | null;
}

export interface AssignReagentRequestDto {
  testKitId: string;
}

export interface TestBatchUnitDto {
  tbSeqNo: number;
  unitId: string;
  chkDigit: string | null;
  collDate: string | null;
}

export interface TestKitLovItem {
  testKitId: string;
  testKitClass: string | null;
  qcExpiryDate: string | null;
}

export interface TestKitOption {
  testKitId: string;
  displayName: string;
}

export interface PrintableTestDto {
  testId: string;
  testDesc: string | null;
  testGroup: string | null;
  isAntigen: boolean;
}

export interface GenerateWorksheetRequestDto {
  testIds: string[];
  printerId?: string;
}

export interface PrinterOption {
  printerId: string;
  printerDescription?: string;
}

export interface WorksheetGenerationResultDto {
  success: boolean;
  generatedReports: string[];
  message: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  item?: T;
  total?: number;
  totalCount?: number;
  errorCode?: string;
}

export interface TestBatchTestsResponseDto {
  data: TestBatchDetailDto[];
  total: number;
}

export interface TestBatchUnitsResponseDto {
  data: TestBatchUnitDto[];
  total: number;
}

export interface EditTestKitDialogData {
  testBatchId: string;
  test: TestBatchDetailDto;
}

export interface EditTestKitDialogResult {
  success: boolean;
  promptWorksheet?: boolean;
}

export interface ViewUnitsDialogData {
  testBatchId: string;
}

export interface GenerateWorksheetDialogData {
  testBatchId: string;
  printableTests: PrintableTestDto[];
  printers: PrinterOption[];
}

export interface GenerateWorksheetDialogResult {
  success: boolean;
}
