export interface SpecialProcessingQueryRequestDto {
  unitId: string;
}

export interface SpecialProcessingQueryResultDto {
  unitId: string;
  chapterId: string;
  collDate: string;
  checkDigit: string;
  specialProcessingRecords: SpecialProcessingRecordDto[];
}

export interface SpecialProcessingRecordDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode: string;
  componentPrefix: string;
  processCode: string;
  processCodeDescription: string;
  insertDate: string;
  insertUserId: string;
  linkUnitId?: string;
  differentials: DifferentialHdrDto[];
  reagents: ReagentHdrDto[];
  spiking: SpikingDto[];
}

export interface DifferentialHdrDto {
  differentialId: number;
  stageCode: string;
  insertDate: string;
  insertUserId: string;
  details: DifferentialDetailDto[];
}

export interface DifferentialDetailDto {
  cellCode: string;
  cellCodeDescription: string;
  cellCount: number;
}

export interface ReagentHdrDto {
  kitId: number;
  stageCode: string;
  insertDate: string;
  insertUserId: string;
  details: ReagentDetailDto[];
}

export interface ReagentDetailDto {
  reagentName: string;
  manufacturer: string;
  lotNumber: string;
  expirationDate: string;
}

export interface SpikingDto {
  spikingType: string;
  insertDate: string;
  insertUserId: string;
  bagLotNumber: string;
  filterLotNumber?: string;
  bagsSpiked: number;
  bagsForComponents: number;
  bagsUsed: number;
}

export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error?: string;
  errorCode?: string;
  statusCode: number;
  data: T[] | null;
  item?: T | null;
  total?: number;
  totalCount?: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
