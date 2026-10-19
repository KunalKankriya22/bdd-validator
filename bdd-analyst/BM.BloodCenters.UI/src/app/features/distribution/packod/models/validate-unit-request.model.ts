/**
 * Validate unit request model
 * Request to validate a unit ID before packing
 */
export interface ValidateUnitRequestDto {
  /** Unit identifier (required) */
  unitId: string;

  /** Selected consignee ID (required) */
  consigneeId: string;

  /** Product type filter (optional) */
  productType?: string | null;
}
