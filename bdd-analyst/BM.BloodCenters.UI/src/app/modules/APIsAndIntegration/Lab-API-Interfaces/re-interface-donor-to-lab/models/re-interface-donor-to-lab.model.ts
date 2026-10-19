export interface ReInterfaceDonorToLabUnit {
  sequence: number;
  unitId: string;
  checkDigit?: string;
  collectionDate: string;
  interdictionExist: string;
  interfaceId: string;
  interdictionState: string;
}

export interface ReInterfaceDonorToLabExecuteRequest {
  unitId: string;
  collectionDate: string;
}

export interface ReInterfaceDonorToLabResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data?: ReInterfaceDonorToLabUnit[];
  item?: ReInterfaceDonorToLabUnit;
  total?: number;
  error?: string;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
