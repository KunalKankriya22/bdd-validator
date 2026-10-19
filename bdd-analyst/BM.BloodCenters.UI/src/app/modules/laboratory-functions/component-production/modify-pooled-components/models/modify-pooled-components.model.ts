export interface ModifyPooledComponentsResponse {
  unitId: string;
  productCode: string;
  productDescription: string | null;
  processCode: string | null;
  processDescription: string | null;
  newBag: string | null;
  catalogNumber: string | null;
  bagLotNumber: string | null;
  filterLotNumber: string | null;
  reagentName: string | null;
  manufacturer: string | null;
  reagentLotNumber: string | null;
  reagentExpirationDate: string | null;
  processDate: string | null;
  newProductCode: string | null;
  newProductDescription: string | null;
  poolWeight: number | null;
  poolVolume: number | null;
  codeScheme: string | null;
  collDate: string | null;
  poolExpiryDate: string | null;
  pooledAboRh: string | null;
  oldProductType: string | null;
  oldBagId: string | null;
  specificGravity: number | null;
  weightRequired: boolean;
  spTestRequired: boolean;
  isExpired: boolean;
}

export interface ModifyPooledComponentsRequest {
  unitId: string;
  productCode: string;
  processCode: string;
  newBag: string;
  catalogNumber: string | null;
  lotNumber: string | null;
  filterLotNumber: string | null;
  reagentName: string | null;
  manufacturer: string | null;
  reagentLotNumber: string | null;
  reagentExpirationDate: string | null;
  processDate: string | null;
  newProductCode: string;
  poolWeight: number | null;
  confirmExpired: boolean;
  verification?: LabelVerification;
}

export interface ProcessCode {
  code: string;
  description: string | null;
}

export interface ValidProductConversion {
  targetProductCode: string;
  productDescription: string | null;
}

export interface ProductCodeOption {
  productCode: string;
  productDescription: string | null;
}

export interface CatalogNumberOption {
  catalogNumber: string;
}

export interface LotNumberOption {
  lotNumber: string;
}

export interface ValidAboOption {
  code: string;
  description: string;
}

export interface LabelVerification {
  scannedUnitId: string;
  scannedAbo: string;
  scannedProductCode: string;
  scannedExpiryDate?: string;
  scannedSpTest?: string;
}
