export interface ValidateUnitRequest {
  unitId: string;
  processCode: string;
  isManualEntry: boolean;
}

export interface ValidateUnitData {
  unitId: string;
  collDate: string;
  codeScheme: string;
}

export interface ProductCode {
  productCode: string;
  productDesc: string;
  productType: string;
}

export interface ComponentPrefixItem {
  componentPrefix: string;
}

export interface UpdateBagsRequest {
  unitId: string;
  productCode: string;
  componentPrefix: string;
  bagsUsed: number;
}

export interface BagUpdateEntry {
  unitId: string;
  productCode: string;
  description: string;
  collectionDate: string;
  bags: number;
}

export interface ReturnResult<T = any> {
  success: boolean | null;
  message: string | null;
  error: string | null;
  errorCode: string | null;
  statusCode: number | null;
  data: T[] | null;
  item: T | null;
  total: number | null;
  errorResponse: Record<string, any>;
}

export enum UpdateBagsErrorCode {
  UNIT_NOT_FOUND = '0063',
  NO_VALID_COMPONENTS = '0131',
  COMPONENT_NOT_FOUND = '0151',
  UNIT_IS_INTERNAL = '0188',
  UPDATE_FAILED = '0230',
  ACTIVE_INTERDICTION = '0239',
  DIFFERENT_WAREHOUSE = '0241',
  EXCEEDS_AVAILABLE_BAGS = '0262',
  IMPORT_UNIT = '0400',
  INVALID_KEY = '1180',
  INVALID_PRODUCT_CODE = '1205',
  BAGS_MUST_BE_GREATER_THAN_ZERO = '5219',
  SUCCESS = '8010',
}

export const ERROR_MESSAGES: Record<string, string> = {
  [UpdateBagsErrorCode.UNIT_NOT_FOUND]: 'Unit not found in the system.',
  [UpdateBagsErrorCode.NO_VALID_COMPONENTS]: 'No valid components found for this unit.',
  [UpdateBagsErrorCode.COMPONENT_NOT_FOUND]: 'Component not found for the specified unit, product, and aliquot combination.',
  [UpdateBagsErrorCode.UNIT_IS_INTERNAL]: 'This unit is internal (non-pheresis) and cannot be updated.',
  [UpdateBagsErrorCode.UPDATE_FAILED]: 'Update failed.',
  [UpdateBagsErrorCode.ACTIVE_INTERDICTION]: 'Component has an active in-transit interdiction.',
  [UpdateBagsErrorCode.DIFFERENT_WAREHOUSE]: 'Component is in a different warehouse.',
  [UpdateBagsErrorCode.EXCEEDS_AVAILABLE_BAGS]: 'Requested bags exceed available count.',
  [UpdateBagsErrorCode.IMPORT_UNIT]: 'Cannot update bags for import units.',
  [UpdateBagsErrorCode.INVALID_PRODUCT_CODE]: 'Product code not found or invalid for this unit.',
  [UpdateBagsErrorCode.BAGS_MUST_BE_GREATER_THAN_ZERO]: 'Number of bags must be greater than zero.',
  [UpdateBagsErrorCode.SUCCESS]: 'Record saved successfully.',
};
