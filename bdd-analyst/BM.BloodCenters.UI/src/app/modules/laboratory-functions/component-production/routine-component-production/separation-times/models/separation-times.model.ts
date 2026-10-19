export interface CentrifugeDto {
  equipId: string;
  description?: string;
}

export interface RecordSeparationRequestDto {
  unitId: string;
  centrifugeId: string;
  collDate?: string;
}

export interface RecordSeparationResponseDto {
  unitId: string;
  collDate: string;
  bleedStartTime: string;
  firstSepTime: string;
  secondSepTime: string;
  firstSepCentrifugeId?: string;
  secondSepCentrifugeId?: string;
  firstSepDuration?: string;
  secondSepDuration?: string;
}

export interface SeparationTimeDisplay {
  unitId: string;
  collectionDate: string;
  centrifugeId: string;
  bleedStartTime: string;
  firstSeparationTime: string;
  secondSeparationTime: string;
  firstSepDuration: string;
  secondSepDuration: string;
  separationRecorded?: 'FIRST' | 'SECOND';
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  total?: number;
}
