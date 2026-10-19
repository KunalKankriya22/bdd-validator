export interface ComponentSpikingDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
  spikingType: string;
  spikingTypeDesc: string;
  bagLotNumber: string;
  filterLotNumber: string | null;
  bagsSpiked: number;
  bagsForComponents: number;
  bagsUsed: number;
}

export interface UpdateComponentSpikingDto {
  spikingType: string;
  bagLotNumber: string;
  filterLotNumber: string | null;
  bagsSpiked: number;
  bagsForComponents: number;
}

export interface ProcessCodeDropdownDto {
  code: string;
  codeDesc: string;
}

export interface SpikingTypeDropdownDto {
  code: string;
  codeDesc: string;
}

export interface ProductCodeDropdownDto {
  productCode: string;
  productDesc: string;
  componentPrefix: string;
}

export interface LotNumberDropdownDto {
  lotNumber: string;
}

export interface ComponentPrefixDropdownDto {
  componentPrefix: string;
}

export interface UnitCollectionDateDto {
  collDate: string;
}

export interface ComponentSpikingQueryParams {
  unitId: string;
  collDate: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
}
