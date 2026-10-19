import { Moment } from 'moment';

export interface AntigenPricingMatrixModel {
  code: string;
  quantity: number;
  price: number;
  description: string;
  effDate: string;
  termDate?: string;
  modificationDate?: string;
}

export interface AntigenPricingMatrixFormValue {
  code: string | null;
  quantity: number | null;
  price: number | null;
  description: string | null;
  effDate: Moment | null;
  termDate: Moment | null;
}

export interface AntigenPricingMatrixFilterValue {
  serviceCode?: string | null;
  antigenQty?: number | null;
  effDatePeriod?: 'before' | 'after' | null;
  effDate?: string | null;
  termDatePeriod?: 'before' | 'after' | null;
  termDate?: string | null;
}

export interface AntigenPricingMatrixQueryParamsDto {
  serviceCode?: string;
  antigenQty?: number;
  searchKeyword?: string;
  effDatePeriod?: string;
  effDate?: string;
  termDatePeriod?: string;
  termDate?: string;
  sortColumn?: string;
  sortOrder?: string;
}

export interface LookUp {
  key: string;
  value: string;
}

export interface AddDropdownResponse {
  codes: LookUp[];
}

export interface AntigenPricingMatrixResponseDto {
  data: AntigenPricingMatrixModel[];
  totalCount: number;
}

export interface AntigenPricingMatrixCreateDto {
  code: string;
  quantity: number;
  price: number;
  description: string;
  effDate: string;
  termDate?: string;
}

export interface AntigenPricingMatrixUpdateDto {
  code: string;
  quantity: number;
  price: number;
  description: string;
  effDate: string;
  termDate?: string;
}

