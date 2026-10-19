export interface DonorDetails {
  donorId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  street: string;
  suiteApt: string;
  city: string;
  state: string;
  zip: string;
  bloodType: string;
  otherInters: number;
  internationalAddress: string | null;
}

export interface DonorInterdiction {
  interCode: string;
  interType: string;
  interDesc: string;
  unitId: string | null;
  effDate: string;
  termDate: string | null;
  releaseDate: string | null;
  insertUser: string;
  releaseUser: string | null;
  originatedFrom: string | null;
  reasonCode: string | null;
  termReason: string | null;
  groupMode: string | null;
  groupId: string | null;
  chapterId: string;
  donorId: string;
  collDate: string | null;
  notes: string | null;
}

export interface ValidInterdictionCode {
  interCode: string;
  interType: string;
  interDesc: string;
  periodType: string | null;
  periodNumber: number | null;
  minimumPeriod: number | null;
}

export interface CollectionDate {
  collDate: string;
}

export interface TerminationReason {
  code: string;
  description: string;
}

export interface PlaceInterdictionRequest {
  donorId: string;
  interCode: string;
  unitId?: string;
  collDate?: string;
  effDate: string;
  termDate?: string;
  notes?: string;
}

export interface ReleaseInterdictionRequest {
  donorId: string;
  interCode: string;
  unitId?: string;
  effDate: string;
  originatedFrom?: string;
  groupMode?: string;
  groupId?: string;
  reasonCode?: string;
  termDate?: string;
}

export interface TerminateInterdictionRequest {
  donorId: string;
  interCode: string;
  unitId?: string;
  effDate: string;
  termDate: string;
  termReason: string;
  notes?: string;
}

export interface InterdictionFilters {
  showTerminated: boolean;
  userId?: string;
  originated?: string;
  groupMode?: string;
  groupId?: string;
  search?: string;
  effectiveDatePeriod?: string;
  effectiveDate?: string;
  terminationDatePeriod?: string;
  terminationDate?: string;
}
