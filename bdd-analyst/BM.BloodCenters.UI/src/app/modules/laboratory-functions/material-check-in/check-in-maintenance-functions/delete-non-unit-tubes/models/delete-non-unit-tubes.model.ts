export interface NonUnitTubeDto {
  unitId: string;
  chapterId: string;
  tubeCheckinDats: string; // Changed to match API response property name
  chkDigit?: string;
}

export interface DeleteNonUnitTubesRequest {
  startDate: string;
  endDate: string;
}

export interface DeleteNonUnitTubesResponse {
  data: NonUnitTubeDto[];
  totalCount: number;
  success?: boolean;
  message?: string;
  errorCode?: string | null;
}

export interface DeleteNonUnitTubesDeleteRequest {
  unitIds: string[];
}
