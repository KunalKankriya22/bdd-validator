export interface ZipCodeStateLookup {
  code: string;
  description: string;
}

export interface ZipCodeCountyLookup {
  code: string;
  description: string;
}

export interface ZipCodeCityLookup {
  code: string;
  description: string;
}

export interface CreateZipCodeRequest {
  state: string;
  city: string;
  zip: string;
  county: string;
  effDate: string;
  termDate: string | null;
  commonlyUsedFlag: string | null;
}

export type UpdateZipCodeRequest = CreateZipCodeRequest;

export interface ZipCodeRecord {
  uspsId?: number;
  state: string;
  city: string;
  zip: string;
  county?: string | null;
  effectiveDate?: string | null;
  terminationDate?: string | null;
  commonlyUsedFlag?: string | null;
}

export interface ZipCodeApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  total?: number;
  errorResponse: {
    errorCode: string | null;
    error: string | null;
  };
}

export type NewZipCodeDialogResult =
  | { action: 'save'; zipCode: ZipCodeRecord }
  | { action: 'close' }
  | undefined;
