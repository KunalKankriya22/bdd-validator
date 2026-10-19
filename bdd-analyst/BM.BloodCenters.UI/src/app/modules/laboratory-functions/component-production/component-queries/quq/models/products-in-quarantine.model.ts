export interface ProductInQuarantineDto {
  unitId: string;
  checkDigit: string | null;
  productCode: string;
  aliquot: string | null;
  aboDescription: string | null;
  expirationDate: string | null;
  customer: string | null;
  reasonCode: string | null;
  reason: string | null;
  userId: string | null;
}

export interface QuarantineTypeDto {
  code: string;
  description: string;
}

export interface QuarantineTypesResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: QuarantineTypeDto[];
}

export interface ProductsInQuarantineResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: ProductInQuarantineDto[];
  totalCount: number;
  pagination: {
    take: number;
    skip: number;
    hasMore: boolean;
  };
}

export interface ProductsInQuarantineQueryParams {
  quarantineType?: string | null;
  take?: number;
  skip?: number;
}
