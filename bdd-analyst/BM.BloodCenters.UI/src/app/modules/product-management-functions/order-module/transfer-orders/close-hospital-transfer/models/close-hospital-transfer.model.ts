export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data?: T[];
  item?: T;
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

export interface OpenTransferSlipDto {
  pickSlipId: string;
  insertDate: string;
  pickSlipType: string;
  sourceHospitalName: string;
  destinationHospitalName: string;
  transferType: string;
  productCount: number;
}

export interface TransferProductDto {
  pickSlipId: string;
  chapterId: string;
  pickSlipType: string;
  pickSlipStatus: string;
  orderNo: string;
  itemNo: number;
  sourceHospital: string;
  unitId: string;
  displayUnitId: string | null;
  productCode: string;
  aliquot: string;
  collDate: string;
  productType: string;
  bloodType: string;
  expDate: string;
  tier: number | null;
  qcFlag: string | null;
  insertDate: string | null;
  sourceHospitalName: string | null;
  sourceHospitalAddress: string | null;
  sourceCityStateZip: string | null;
  destinationHospitalName: string | null;
  destinationHospitalAddress: string | null;
  destCityStateZip: string | null;
  productDescription: string | null;
  aboDescription: string | null;
}

export interface TransferProductQcDto {
  unitId: string;
  productCode: string;
  aliquot: string;
  collDate: string;
  qcFlag: string;
  bloodType?: string | null;
  expDate?: string | null;
  originalUnitId?: string | null;
  originalProductCode?: string | null;
  originalAliquot?: string | null;
}

export interface CloseTransferRequestDto {
  pickSlipId: string;
  products: TransferProductQcDto[];
}

export interface CloseTransferResponseDto {
  pickSlipId: string;
  status: string;
  productsProcessed: number;
  productsDiscarded: number;
  orderStatus: string | null;
  message: string;
}

export interface ProductCodeLovDto {
  productCode: string;
  productDescription: string;
}

export interface AliquotLovDto {
  aliquot: string;
}

export interface AboRhLovDto {
  bloodType: string;
  aboDescription: string;
}

export interface SelectTransferSlipDialogData {
  slips: OpenTransferSlipDto[];
  selectedPickSlipId?: string;
}

export type ActionTakenValue = 'O' | 'M' | 'D' | '';

export interface ActionTakenOption {
  value: ActionTakenValue;
  label: string;
}

export const ACTION_TAKEN_OPTIONS: ActionTakenOption[] = [
  { value: 'O', label: 'Transferred' },
  { value: 'M', label: 'Modify' },
  { value: 'D', label: 'Deallocate' },
];

export interface TransferProductRow extends TransferProductDto {
  actionTaken: ActionTakenValue;
  modifiedUnitId: string;
  modifiedProductCode: string;
  modifiedProductDescription: string;
  modifiedAliquot: string;
  modifiedBloodType: string;
  modifiedAboDescription: string;
  modifiedExpDate: string;
  productCodeOptions: ProductCodeLovDto[];
  aliquotOptions: AliquotLovDto[];
  aboRhOptions: AboRhLovDto[];
  isLoadingProductCodes: boolean;
  isLoadingAliquots: boolean;
  isLoadingAboRh: boolean;
  codeScheme: string;
  expDateError: string;
}
