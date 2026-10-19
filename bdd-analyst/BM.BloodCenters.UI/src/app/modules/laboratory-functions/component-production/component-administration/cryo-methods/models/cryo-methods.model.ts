export interface CryoMethodModel {
  thawMethod: string;
  methodDesc: string;
  minTemp: number | null;
  maxTemp: number | null;
  minWsFreezeTime: number | null;
  maxWsFreezeTime: number | null;
  minSepFreezeTime: number | null;
  maxSepFreezeTime: number | null;
  effDate: string | null;
  termDate: string | null;
  lastModifiedDate?: string | null;
}

export interface CryoMethodFormValue {
  thawMethod: string | null;
  methodDesc: string | null;
  minTemp: number | null;
  maxTemp: number | null;
  minWsFreezeTime: number | null;
  maxWsFreezeTime: number | null;
  minSepFreezeTime: number | null;
  maxSepFreezeTime: number | null;
  effDate: import('moment').Moment | null;
  termDate: import('moment').Moment | null;
}

export interface CryoMethodQueryParamsDto {
  thawMethod?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface CreateCryoMethodRequestDto {
  thawMethod: string;
  methodDesc: string;
  minTemp: number;
  maxTemp: number;
  minWsFreezeTime: number;
  maxWsFreezeTime: number;
  minSepFreezeTime: number;
  maxSepFreezeTime: number;
  effDate: string;
  termDate: string | null;
}

export interface UpdateCryoMethodRequestDto {
  methodDesc: string;
  minTemp: number;
  maxTemp: number;
  minWsFreezeTime: number;
  maxWsFreezeTime: number;
  minSepFreezeTime: number;
  maxSepFreezeTime: number;
  effDate: string;
  termDate: string | null;
}

export interface CryoMethodDto {
  thawMethod: string;
  methodDesc: string;
  minTemp: number;
  maxTemp: number;
  minWsFreezeTime: number;
  maxWsFreezeTime: number;
  minSepFreezeTime: number;
  maxSepFreezeTime: number;
  effDate: string;
  termDate: string | null;
  lastModifiedDate: string;
}
