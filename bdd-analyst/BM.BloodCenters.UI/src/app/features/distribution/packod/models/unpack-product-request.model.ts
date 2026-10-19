/**
 * Unpack product request model
 * Request to remove a product from a box
 */
export interface UnpackProductRequestDto {
  /** Unit identifier (required) */
  unitId: string;

  /** Product code (required) */
  productCode: string;

  /** Aliquot number (required) */
  aliquot: string;
}
