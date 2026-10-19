/**
 * Carton Models
 * Based on API documentation: imported-blood-checkin-api-documentation.md
 */

/**
 * Carton DTO
 */
export interface CartonDto {
  batchId: string;
  chapterId: string;
  airwayBillNo: string;
  cartonNumber: number;
  seqNo: number;
}

/**
 * Carton display model for grid
 */
export interface CartonGridItem {
  sequence: number; // seqNo
  cartonNo: number; // cartonNumber
}

/**
 * Add cartons request
 */
export interface AddCartonsRequest {
  batchId: string;
  expectedCount: number;
  cartons: CartonDto[];
}
