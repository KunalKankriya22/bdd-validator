import { Moment } from 'moment';

export interface AttributeExpirationDateOverrideModel {
  attributeCode: string;
  attributeDescription: string;
  overrideAttribute: string;
  overrideDescription: string;
  effDate: string;
  termDate?: string;
  lastModifiedDate?: string;
  auditKey?: number;
  programId?: string;
}

export interface AttributeExpirationDateOverrideFormValue {
  attributeCode: string | null;
  attributeDescription: string | null;
  overrideAttribute: string | null;
  overrideDescription: string | null;
  effDate: Moment | null;
  termDate: Moment | null;
}

export interface AttributeExpirationDateOverrideFilterValue {
  overrideAttribute?: string | null;
  searchKeyword?: string | null;
  effDatePeriod?: 'before' | 'after' | null;
  effDate?: string | null;
  termDatePeriod?: 'before' | 'after' | null;
  termDate?: string | null;
}

export interface AttributeExpirationDateOverrideQueryParamsDto {
  overrideAttribute?: string;
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
  overrideAttributes: LookUp[];
}

export interface AddDropdownResponse {
  attributeCodes: LookUpWithDescription[];
  overrideAttributes: LookUpWithDescription[];
}

export interface AttributeExpirationDateOverrideResponseDto {
  data: AttributeExpirationDateOverrideModel[];
  totalCount: number;
}

export interface AttributeExpirationDateOverrideCreateDto {
  attributeCode: string;
  overrideAttribute: string;
  effDate?: string;
  termDate?: string;
}

export interface AttributeExpirationDateOverrideUpdateDto {
  effDate?: string;
  termDate?: string;
}

export interface AttributeDropdown {
  attribCode: string;
  attribDesc: string;
}
