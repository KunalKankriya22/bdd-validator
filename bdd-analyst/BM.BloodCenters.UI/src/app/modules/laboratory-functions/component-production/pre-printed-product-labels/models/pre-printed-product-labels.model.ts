import { Moment } from 'moment';

export interface PrePrintedProductLabelModel {
  catalogNumber: string;
  productType: string;
  productTypeDesc?: string;
  bagCode: string;
  faceLabel: string;
  effDate: string;
  termDate?: string;
  lastModifiedDate?: string;
  auditKey?: number;
  programId?: string;
}

export interface PrePrintedProductLabelFormValue {
  catalogNumber: string | null;
  productType: string | null;
  bagCode: string | null;
  faceLabel: string | null;
  effDate: Moment | null;
  termDate: Moment | null;
}

export interface PrePrintedProductLabelFilterValue {
  catalogNumber?: string | null;
  productType?: string | null;
  bagCode?: string | null;
  faceLabel?: string | null;
  searchKeyword?: string | null;
  effDatePeriod?: 'before' | 'after' | null;
  effDate?: string | null;
  termDatePeriod?: 'before' | 'after' | null;
  termDate?: string | null;
}

export interface PrePrintedProductLabelQueryParamsDto {
  catalogNumber?: string;
  productType?: string;
  bagCode?: string;
  faceLabel?: string;
  searchKeyword?: string;
  effDate?: string;
  effDatePeriod?: 'before' | 'after';
  termDate?: string;
  termDatePeriod?: 'before' | 'after';
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface LookUp {
  key: string;
  value: string;
}

export interface LookUpWithDescription {
  key: string;
  value: string;
  description: string;
}

export interface FilterDropdownResponse {
  catalogNumbers: LookUp[];
  productTypes: LookUp[];
  bagCodes: LookUp[];
  faceLabels: LookUp[];
}

export interface AddDropdownResponse {
  catalogNumbers: LookUp[];
  productTypes: LookUpWithDescription[];
  bagCodes: LookUpWithDescription[];
}

export interface PrePrintedProductLabelResponseDto {
  data: PrePrintedProductLabelModel[];
  totalCount: number;
}

export interface PrePrintedProductLabelCreateDto {
  catalogNumber: string;
  productType: string;
  bagCode: string;
  faceLabel: string;
  effDate: string;
  termDate?: string;
}

export interface PrePrintedProductLabelUpdateDto {
  bagCode: string;
  faceLabel: string;
  effDate: string;
  termDate?: string;
}

export interface ProductCodeItem {
  key: string;
  value: string;
  description: string;
}
