/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[] | null;
  total: number;
}

/**
 * Request DTO for creating an adjustment
 */
export interface CreateAdjustmentDto {
  customerId: string;
  tranType: string;
  patientName?: string | null;
  orderNo?: string | null;
  serviceCode: string;
  quantity: number;
  requestedBy?: string | null;
  requestDate: string;
  amount: number;
  reasonCode?: string | null;
}

/**
 * LOV option for searchable dropdowns
 */
export interface LovOption {
  code: string;
  description: string;
  charge?: number | null;
  editCharge?: boolean;
}

export interface PatientLovDto {
  patientName: string;
  orderNo?: string | null;
}

export interface RequestedByLovDto {
  contactName: string;
}
