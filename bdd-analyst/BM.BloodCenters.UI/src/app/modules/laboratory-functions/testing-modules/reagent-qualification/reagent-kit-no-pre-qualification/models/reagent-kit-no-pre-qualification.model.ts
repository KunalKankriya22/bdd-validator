// ── API Response Wrapper ────────────────────────────────────────────────────

export interface ApiResponseWrapper<T> {
  success: boolean;
  statusCode: number;
  message?: string;
  data: T;
  item?: T;
  total?: number;
  errorResponse?: {
    errorCode?: string;
    error: string;
  };
}

// ── LOV / Dropdown DTOs ────────────────────────────────────────────────────

export interface TestIdOption {
  testId: string;
  testDescription: string;
}

export interface ReagentLovDto {
  reagentId: string;
  reagentCode: string;
  reagentName: string;
  supplierCode: string;
  lotNumber: string;
  expiryDate: string;
  kitLotNumber: string;
}

export interface TestGroupDto {
  isAgMag: boolean;
  requiresApprovalLicense?: boolean;
}

// ── GET Test Kits Response ─────────────────────────────────────────────────

export interface TestKitDetailDto {
  testKitId: string;
  qcExpiryDate: string | null;
  apprLicFlag: string;
  insertDate: string;
}

// ── GET Reagent Details Response ───────────────────────────────────────────

export interface ReagentDetailDto {
  reagentType: string;
  reagentName: string;
  supplierCode: string;
  lotNumber: string;
  expiryDate: string | null;
  reagentCode?: string;
}

// ── Create / Update Request DTOs ───────────────────────────────────────────

export interface CreateReagentRequest {
  reagentType: string;
  reagentName: string;
  reagentCode: string;
  reagentId: string;
  supplierCode: string;
  lotNumber: string;
  expiryDate: string;
  kitLotNumber?: string;
  channel?: number;
}

export interface CreateTestKitRequest {
  testId: string;
  showExpired: string;
  qcExpiryDate?: string;
  apprLicFlag?: string;
  allowExpiredReagent?: boolean;
  reagents: CreateReagentRequest[];
}

export interface UpdateTestKitRequest {
  qcExpiryDate?: string;
  apprLicFlag?: string;
  allowExpiredReagent?: boolean;
  reagents?: CreateReagentRequest[];
}

// ── UI State Models ────────────────────────────────────────────────────────

export interface TestKitItem {
  kitId: string;
  qcExpiration: string;
  licenseFlag: string;
}

export interface ReagentDetailRow {
  reagentType: string;
  name: string;
  supplier: string;
  lotNo: string;
  expirationDate: string;
  isNew: boolean;
  reagentCode?: string;
  reagentId?: string;
  kitLotNumber?: string;
}
