export interface HlaRetrieveByUnitRequest {
  unitId: string;
  collDate?: string | null;
}

export interface DonorHlaInfo {
  donorId: string;
  collectionDate?: string | null;
  aboType?: string | null;
  lastName?: string | null;
  firstName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  prevA1?: string | null;
  prevA2?: string | null;
  prevB1?: string | null;
  prevB2?: string | null;
  insertUser?: string | null;
}

export interface DonorHlaInfoResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: DonorHlaInfo[];
  total: number;
}

export interface SaveHlaResultsRequest {
  donorId: string;
  unitId?: string | null;
  collDate?: string | null;
  a1: string;
  a2?: string | null;
  b1: string;
  b2?: string | null;
}

export interface SaveHlaResultsResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    donorId: string;
    chapterId: string;
    success: boolean;
    message: string;
  }[];
  total: number;
}

export interface ValidHlaAntigen {
  epitopeId: string;
  locus: string;
}

export interface ValidHlaAntigensResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: ValidHlaAntigen[][];
  total: number;
}
