export interface PooledComponentDto {
  poolId: string;
  patientId?: string;
  patientLastName?: string;
  patientFirstName?: string;
  facility?: string;
  productCode?: string;
  productDescription?: string;
  catalogNumber?: string;
  lotNumber?: string;
  filterLotNumber?: string;
  poolDate?: string;
  poolExpiryDate?: string;
  totalComponentCount: number;
}

export interface PooledComponentUnitDto {
  unitId: string;
  checkDigit: string;
  productCode: string;
  productDescription?: string;
  componentPrefix: string;
  expiryDate?: string;
  aboRhDescription?: string;
}

export interface PooledComponentQueryDto {
  searchKeyword?: string;
  fromDate?: string;
  toDate?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface PooledComponentLookupDto {
  poolId: string;
  poolDate?: string;
  patientLastName?: string;
  patientFirstName?: string;
}

export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error?: string;
  errorCode?: string;
  statusCode: number;
  data: T[] | null;
  item?: T | null;
  total: number;
}
