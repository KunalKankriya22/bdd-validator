/**
 * Close box response model
 * Response after successfully closing a box
 */
export interface CloseBoxResponseDto {
  /** Box ID that was closed */
  boxId: string;

  /** Number of products affected */
  productsAffected: number;

  /** Box status after closing (should be 'CL') */
  boxStatus: string;
}
