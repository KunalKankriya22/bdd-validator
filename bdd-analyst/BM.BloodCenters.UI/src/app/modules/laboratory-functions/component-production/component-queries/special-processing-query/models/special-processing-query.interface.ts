export interface SpecialProcessingQueryRequestDto {
  unitId: string;
}

export interface SpecialProcessingQueryResultDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  checkDigit: string;
  specialProcessingRecords: ComponentSpDto[];
}

export interface ComponentSpDto {
  productCode: string;
  componentPrefix: string;
  processCode: string;
  processCodeDescription: string;
  insertDate: string;
  insertUserId: string;
  linkUnitId: string | null;
  differentials: DifferentialDto[];
  reagents: ReagentDto[];
  spiking: SpikingDto[];
}

export interface DifferentialDto {
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

export interface ReagentDto {
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
  expirationDate: string | null;
}

export interface SpikingDto {
  spikingType: string;
  insertDate: string;
  insertUserId: string;
  bagLotNumber: string;
  filterLotNumber: string | null;
  bagsSpiked: number;
  bagsForComponents: number;
  bagsUsed: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T[];
  totalCount?: number;
  errorCode?: string;
}

export interface StageItem {
  stageCode: string;
  insertDate: string;
  insertUserId: string;
  differentialDetails: DifferentialDetailDto[];
  reagentDetails: ReagentDetailDto[];
}
