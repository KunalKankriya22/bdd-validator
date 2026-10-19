export interface ReturnResult<T> {
  success: boolean;
  message?: string;
  data?: T[];
  item?: T;
  statusCode?: number;
  total?: number;
  error?: string;
  errorCode?: string;
}

export interface VoidProductLabelRequestDto {
  unitId: string;
  productCode: string;
  componentPrefix: string;
  confirmUnitId: string;
  aboLabel: string;
  expiryDate: string;
  collDate: string;
  overrideCode: string;
  holdReasonCode: string;
  note: string;
}

export interface VoidProductLabelResponseDto {
  unitId: string;
  productCode: string;
  componentPrefix: string;
  oldAboLabel: string;
  newAboLabel: string;
  expiryDate: string;
  voidedDate: string;
  voidedBy: string;
  message: string;
}

export interface ComponentDetailsDto {
  unitId: string;
  productCode: string;
  productDescription: string;
  systemLabelDecision: string;
  currentLabel: string;
  testedAbo: string;
  testedAboDescription: string;
  expiryDate?: string | null;
  collDate: string;
  rejectReasonCode?: string | null;
  componentPrefix?: string;
  componentPrefixes?: string[];
  warehouseId?: string;
  contractId?: string;
  bleedStartTime?: string | null;
}

export interface UnitComponentDto {
  unitId: string;
  productCode: string;
  productDescription: string;
  currentLabel: string;
  testedAbo: string;
  testedAboDescription: string;
  aboDescription: string;
  expiryDate?: string | null;
  componentStatus?: string;
}

export interface OverrideCodeDto {
  code: string;
  description: string;
}

export interface ProductCodeDto {
  code: string;
  description: string;
}

export interface VoidProductLabelSearchRequest {
  unitId?: string;
  productCode?: string;
}

export interface DropdownOption {
  value: string;
  label: string;
  description?: string;
}

export interface LabeledComponentInfo {
  productCode: string;
  aboDescription: string;
  expiryDate: string;
  location: string;
}

export type CodeScheme = 'I' | 'C';

export const NFT_LABEL: Record<CodeScheme, string> = {
  I: 'Mq',
  C: '39',
};

export const FMB_ERRORS: Record<string, string> = {
  '0010': 'Required fields missing: confirmation unit ID, ABO label, note, and override code are all required.',
  '0043': 'Product has hour-based lifespan and cannot be overridden for non-INTERNAL contracts.',
  '0063': 'Unit ID not found for this chapter.',
  '0151': 'Component not found with valid label decision, or reject reason is POOL.',
  '0176': 'Unit does not have an INTERNAL or IM contract type.',
  '0178': 'No distinct ABO test result found, or multiple conflicting results exist.',
  '0230': 'Commit failed. Please try again.',
  '0241': 'Product/component is not in the current warehouse.',
  '1140': 'Invalid ABO label — must be NFT label (Mq for ISBT, 39 for Codabar).',
  '1170': 'Scanned expiry date does not match the calculated actual expiry date.',
  '1205': 'Product code not found in valid products.',
  '1229': 'Override code not found in master codes.',
  '1508': 'Confirmation Unit ID does not match the original Unit ID.',
  '1516': 'No labelable components found (all already NFT, pooled, or not in lab).',
  '1528': 'No component available with valid label in current warehouse.',
  '4303': 'Component has a reject reason code that prevents this operation.',
  '5308': 'Reprint is not allowed after the confirmation scan.',
  '8010': 'Label override completed successfully.',
};
