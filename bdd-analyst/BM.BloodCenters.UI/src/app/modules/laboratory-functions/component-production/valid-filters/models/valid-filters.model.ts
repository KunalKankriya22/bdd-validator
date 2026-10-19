import { Moment } from 'moment';

export interface ValidFilterModel {
  vendorName: string;
  catalogNumber: string;
  productType: string;
  numberOfDays: number;
  effDate: string;
  termDate?: string | null;
  programId?: string;
  chapterId?: string;
  lastModifiedDate?: string;
}

export interface ValidFilterFormValue {
  vendorName: string | null;
  catalogNumber: string | null;
  productType: string | null;
  numberOfDays: number | null;
  effDate: Moment | null;
  termDate: Moment | null;
}

export interface ValidFilterFilterValue {
  catalogNumber?: string | null;
  productType?: string | null;
  days?: number | null;
}

export interface ValidFilterQueryParamsDto {
  vendorName?: string;
  catalogNumber?: string;
  productType?: string;
  numberOfDays?: number;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ValidFilterResponseDto {
  data: ValidFilterModel[];
  totalCount: number;
}

export interface ValidFilterCreateDto {
  vendorName: string;
  catalogNumber: string;
  productType: string;
  numberOfDays: number;
  effDate: string;
  termDate?: string;
}

export interface ValidFilterUpdateDto {
  vendorName: string;
  productType: string;
  numberOfDays?: number;
  effDate?: string;
  termDate?: string | null;
}

export interface DropdownItem {
  code: string;
  description: string;
}

export interface CatalogDropdownItem {
  vendorName: string;
  catalogNumber: string;
  description: string;
}

export interface FilterDropdownResponse {
  manufacturerNames: DropdownItem[];
  catalogs: DropdownItem[];
  productTypes: DropdownItem[];
}

export interface AddDropdownResponse {
  catalogs: CatalogDropdownItem[];
  productTypes: DropdownItem[];
}
