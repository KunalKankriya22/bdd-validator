export interface LabelPrinter {
  code: string;
  description: string | null;
  sequence: number;
}

export interface ProcessingFacility {
  auditKey: number;
  collectionId: string | null;
  registrationNo: string | null;
  name: string | null;
  licenseNo: string | null;
  licenseDetails: string | null;
}

export interface ProcessingFacilityDetail {
  name: string | null;
  address1: string | null;
  cityStateZip: string | null;
}

export interface SaveSettingsRequest {
  labelPrinterCode: string | null;
  tieTagPrinterCode?: string | null;
  processingFacilityAuditKey?: number | null;
}

export interface CurrentSettings {
  labelPrinterCode: string | null;
  tieTagPrinterCode: string | null;
  processingFacilityAuditKey: number | null;
  serverTimeUtc: string;
}

export interface LabelPrinterContext {
  labelPrinterCode: string | null;
  tieTagPrinterCode: string | null;
  processingFacilityAuditKey: number | null;
}
