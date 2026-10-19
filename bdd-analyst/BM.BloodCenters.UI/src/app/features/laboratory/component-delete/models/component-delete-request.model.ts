/**
 * Component Delete Request Model
 * Composite key for DELETE operation
 */
export interface ComponentDeleteRequest {
  unitId: string;
  collDate: string; // YYYY-MM-DD format for API
  productCode: string;
  note?: string; // Optional deletion note
  confirm?: string; // 'Y' when user confirms deletion after warning (e.g., component is labeled)
}
