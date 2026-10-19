export type CodeScheme = 'I' | 'C';

export interface ProcessCodeDropdownDto {
  code: string;
  description: string;
}

export interface StageCodeDropdownDto {
  code: string;
  description: string;
}

export interface UnitInfoDto {
  collDate: string;
}

export interface UnitProductDto {
  productCode: string;
  productDesc: string;
  componentPrefix: string;
}

export interface ComponentInfoDto {
  aboRh: string;
  expiryDate: string;
}

export interface ReagentRowDto {
  reagentName: string;
  manufacturer: string;
  lotNumber: string;
  expDate: string;
}

export interface KitDto {
  kitId: string;
  reagents: ReagentRowDto[];
}

export interface CreateKitDto {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
  stageCode: string;
  reagents: ReagentRowDto[];
}

export interface UpdateKitDto {
  reagents: ReagentRowDto[];
}

export interface ReagentFilterValue {
  period: string;
  expirationDate: string | null;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}

export interface CreateKitResponseDto {
  kitId: number;
}
