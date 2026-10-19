export interface CheckInExceptionQueryResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: CheckInExceptionResult;
  errorCode?: string;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}

export interface CheckInExceptionResult {
  tubesOnlyCheckedIn: TubeOnlyUnit[];
  noBagCheckedIn: NoBagUnit[];
  totalTubesOnly: number;
  totalNoBag: number;
}

export interface TubeOnlyUnit {
  unitId: string;
  tubeCheckInDate: string;
  tubeCheckInDateFormatted: string;
}

export interface NoBagUnit {
  unitId: string;
  collectionDate: string;
  collectionDateFormatted: string;
}

export interface CheckInExceptionQueryRequest {
  fromDate: string;
  toDate: string;
}
