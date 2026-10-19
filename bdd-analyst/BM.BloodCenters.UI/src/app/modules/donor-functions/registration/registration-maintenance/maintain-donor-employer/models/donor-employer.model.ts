export interface DonorEmployer {
  employerId: string;
  employerName: string;
  effDate: string;
  termDate: string | null;
  chapterId: string;
  uspsId: number | null;
  intlAddrFlag: string;
  intlCity: string | null;
  intlState: string | null;
  intlPostalCode: string | null;
  intlCountryName: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  address: string;
  internationalAddress: string;
  status: 'Active' | 'Inactive';
}

export interface DonorEmployerSearchRequest {
  SearchType: SearchOption;
  SearchName: string;
  sortColumn?: string;
  sortDirection?: 'A' | 'D';
}

export interface DonorEmployerSearchResponse {
  data: DonorEmployer[];
  totalRecords: number;
}

export interface EmployerInternationalAddress {
  intlCity: string;
  intlState: string;
  intlPostalCode: string;
  intlCountryName: string;
}

export interface CreateDonorEmployerRequest {
  employerName: string;
  effDate: string;
  termDate: string | null;
  uspsId: number;
  city: string;
  zip: string;
  intlAddrFlag: string;
  intlCity: string;
  intlState: string;
  intlPostalCode: string;
  intlCountryName: string;
  insertUser: string;
  insertDate: string;
  currentChapterId: string;
  currentWarehouseId: string;
}

export interface UpdateDonorEmployerRequest {
  employerId: string;
  employerName: string;
  effDate: string;
  termDate: string | null;
  uspsId: number | null;
  city: string | null;
  zip: string | null;
  intlAddrFlag: string;
  intlCity: string | null;
  intlState: string | null;
  intlPostalCode: string | null;
  intlCountryName: string | null;
}

export interface CityState {
  uspsId: number;
  city: string;
  state: string;
  zipCode: string;
}

export interface StateOption {
  codeType: string;
  code: string;
  description: string;
}

export interface CountryOption {
  codeType: string;
  code: string;
  description: string;
}

export interface AutocompleteOption {
  employerId: string;
  employerName: string;
}

export type SearchOption = 'L' | 'M' | 'S';

export const SEARCH_OPTIONS: { value: SearchOption; label: string }[] = [
  { value: 'L', label: 'Like' },
  { value: 'M', label: 'Exact' },
  { value: 'S', label: 'Soundex' }
];
