export interface TestIdOption {
  testId: string;
  testDesc: string;
}

export interface ReagentCodeOption {
  reagentCode: string;
  reagentName: string;
}

export interface LotNumberOption {
  lotNumber: string;
}

export interface ReagentIdOption {
  reagentId: string;
}

export interface CodeDescOption {
  code: string;
  description: string;
}

export interface SupplierOption {
  supplierCode: string;
  supplierName: string;
}

export interface ReagentCodeDetailOption {
  reagentCode: string;
  reagentName: string;
  preparationFlag?: string;
  masterLotRequired?: string;
  controlFlag?: string;
}

export interface ReagentSearchRequest {
  testId: string;
  reagentCode?: string;
  lotNumber?: string;
  reagentId?: string;
  dateStart?: string;
  dateEnd?: string;
  skip: number;
  take: number;
}

export interface ReagentDto {
  reagent: string;
  reagentDescription: string;
  reagentId: string;
  receivedDate: string;
  supplier: string;
  supplierDescription: string;
  expirationDate: string;
  disposition: string;
  kitLotNo: string;
  lotNo: string;
  receivedBy: string;
  containerId: string;
  controlIndicator: string;
  storageLocation: string;
  minimumTemperature: string;
  maximumTemperature: string;
  noOfTests: string;
  reagentAcceptability: string;
  packageInsertDate: string;
  reagentRejectReason: string;
  rejectionDescription: string;
  reagentType: string;
  remaining: string;
  noteId?: number | null;
  preparationFlag?: string | null;
}

export interface ReagentSearchResponse {
  reagents: ReagentDto[];
  totalRecords: number;
}

export interface TestKitDto {
  kitId: string;
  qcStatus: string;
}

export interface TestKitsResponse {
  reagentId: string;
  kits: TestKitDto[];
}

export interface PreparationDetailDto {
  reagentId: string;
  reagentName: string;
  reagentType: string;
  expiryDate: string;
  lotNumber: string;
  quantity: string;
}
