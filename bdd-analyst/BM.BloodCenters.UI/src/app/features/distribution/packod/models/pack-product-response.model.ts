/**
 * Pack product response model
 * Response after successfully packing a product
 */
export interface PackProductResponseDto {
  /** Packed unit ID */
  unitId: string;

  /** Box ID (generated or provided) */
  boxId: string;

  /** Order number (generated or provided) */
  orderNo: string;

  /** Pick slip ID (generated) */
  pickSlipId: string;

  /** Success message */
  message: string;
}
