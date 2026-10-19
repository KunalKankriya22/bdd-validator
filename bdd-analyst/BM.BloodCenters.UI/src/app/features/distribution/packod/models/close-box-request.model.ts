/**
 * Close box request model
 * Request to close a box and mark all products as QC'd
 */
export interface CloseBoxRequestDto {
  /** Box ID to close (max 10 chars, required) */
  boxId: string;
}
