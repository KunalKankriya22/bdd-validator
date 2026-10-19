export interface SpecialDonationSearchRequest {
  searchText?: string;
  status?: string;
  shipTo?: string;
  surgeryDate?: string;
  surgeryDatePeriod?: string;
  neededByDate?: string;
  neededByPeriod?: string;
  sortColumn?: string;
  sortDirection?: string;
  pageNumber: number;
  pageSize: number;
}

export interface SpecialDonationFilterValue {
  status: string | null;
  shipTo: string | null;
  surgeryDate: string | null;
  surgeryDatePeriod: 'before' | 'after' | null;
  neededBy: string | null;
  neededByPeriod: 'before' | 'after' | null;
}

export interface SpecialPatientListItem {
  patId: string;
  patLastName: string;
  patFirstName: string;
  dob?: string;
  sex?: string;
  surgId?: string;
  surgDate?: string;
  dateNeededBy?: string;
  shipLocnName?: string;
  status?: string;
}

export interface SpecialPatientDetail {
  patId: string;
  patLastName: string;
  patFirstName: string;
  patInitials?: string;
  dob?: string;
  sex?: string;
  aboType?: string;
  patType: string;
  patTypeDescription?: string;
  contactAreaCode?: string;
  contactPhoneNo?: string;
  intlContactPhoneNo?: string;
  status?: string;
  comments?: string;
  unitsTotal?: number;
  surgeries: SpecialSurgeryDetail[];
}

export interface SpecialSurgeryDetail {
  surgId: string;
  surgDate?: string;
  surgeryDay?: string;
  phyId?: string;
  phyName?: string;
  phyAuthDate?: string;
  hospitalId?: string;
  hospitalName?: string;
  shipId?: string;
  shipLocnName?: string;
  shipAddress?: string;
  unitsRequired?: string;
  surgType?: string;
  surgTypeDesc?: string;
  dateNeededBy?: string;
  closedDate?: string;
  comments?: string;
  donors: SpecialDonorItem[];
}

export interface SpecialDonorItem {
  seqNo: number;
  lastName?: string;
  firstName?: string;
  contactAreaCode?: string;
  contactPhoneNo?: string;
  intlContactPhoneNo?: string;
  prodType1?: string;
  prodType2?: string;
  prodType3?: string;
}

export interface CreateSpecialPatientRequest {
  patLastName: string;
  patFirstName: string;
  patInitials?: string;
  dob?: string;
  sex: string;
  aboType?: string;
  patType: string;
  contactAreaCode?: string;
  contactPhoneNo?: string;
  intlContactPhoneNo?: string;
  status: string;
  comments?: string;
}

export interface CreateSpecialSurgeryRequest {
  patId: string;
  surgDate: string;
  phyId: string;
  phyAuthDate?: string;
  hospitalId?: string;
  shipId: string;
  unitsRequired: string;
  surgType?: string;
  dateNeededBy?: string;
  closedDate?: string;
  comments?: string;
}

export interface UpdateSpecialSurgeryRequest {
  surgDate: string;
  phyId: string;
  phyAuthDate?: string;
  hospitalId?: string;
  shipId: string;
  unitsRequired: string;
  surgType?: string;
  dateNeededBy?: string;
  closedDate?: string;
  comments?: string;
}

export interface AddSpecialDonorRequest {
  surgId: string;
  lastName: string;
  firstName: string;
  phone?: string;
  intlContactPhoneNo?: string;
  prodType1?: string;
  prodType2?: string;
  prodType3?: string;
}

export interface LookupItem {
  code: string;
  description: string;
}
