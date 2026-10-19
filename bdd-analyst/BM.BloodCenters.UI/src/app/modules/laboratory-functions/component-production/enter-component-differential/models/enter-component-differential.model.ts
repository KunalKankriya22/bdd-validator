// --- Dropdown Items (mapped from API field names to FE-friendly names) ---

export interface ProcessCodeItem {
  processCode: string;   // API: code
  description: string;   // API: codeDesc
}

export interface StageCodeItem {
  stageCode: string;     // API: code
  description: string;   // API: description
}

export interface ProductCodeItem {
  productCode: string;      // API: productCode
  productDesc: string;      // API: productDesc
  componentPrefix: string;  // API: componentPrefix
}

export interface CellCodeItem {
  cellCode: string;      // API: code
  description: string;   // API: description
}

// --- Unit Info (GET /unit-info) ---

export interface UnitInfoResponse {
  collDate: string;
}

// --- Component Info (GET /component-info) ---

export interface ComponentInfoResponse {
  aboRh: string;
  expiryDate?: string;
}

// --- Search / GetAll (POST /{take}/{skip}) ---

export interface SearchDifferentialRequest {
  unitId?: string;
  collDate?: string;
  productCode?: string;
  componentPrefix?: string;
  processCode?: string;
  stageCode?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ComponentDiffHdr {
  differentialId: number;
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
  stageCode: string;
  extIntFlag?: string;
  insertDats: string;
  insertUserId: string;
  noteId?: number;
}

// --- GetById (GET /{differentialId}) ---

export interface ComponentDiffDetail {
  differentialId: number;
  cellCode: string;
  cellCodeDesc?: string;
  cellCount: number;
}

export interface ComponentDifferentialHeaderResponse {
  differentialId: number;
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
  stageCode: string;
  insertDats: string;
  insertUserId: string;
  details: ComponentDiffDetail[];
}

// --- Create (POST /create) ---

export interface CreateDifferentialRequest {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
  stageCode: string;
  cellCode: string;
  cellCount: number;
}

// --- Update (PUT /{differentialId}/{cellCode}) ---

export interface UpdateDifferentialRequest {
  cellCode?: string;
  cellCount: number;
}

// --- Table row for UI display ---

export interface CellCountRow {
  differentialId: number;
  cellCode: string;
  cellCodeDesc: string;
  cellCount: number;
  originalCellCode: string;
}

// --- Generic API response wrapper ---

export interface ComponentDifferentialApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T;
  total?: number;
  errorCode?: string;
  errorMessage?: string;
}
