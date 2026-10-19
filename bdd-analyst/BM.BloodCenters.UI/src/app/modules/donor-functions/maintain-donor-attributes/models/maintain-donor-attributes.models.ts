export interface MaintainDonorAttributeDonorDetails {
  donorId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  street: string | null;
  suiteApt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  otherAttributes: number;
  internationalAddress: string | null;
  bloodTypeDescription: string | null;
}

export interface MaintainDonorAttribute {
  interCode: string;
  interDesc: string | null;
  interType: string | null;
  effDate: string;
  termDate: string | null;
  insertUser: string | null;
}

export interface MaintainDonorAttributeProperty {
  interCode: string;
  interDesc: string | null;
  interType: string | null;
}

export interface CreateMaintainDonorAttributeRequest {
  donorId: string;
  interCode: string;
  effDate: string;
  termDate?: string;
}

export interface UpdateMaintainDonorAttributeRequest {
  termDate: string;
}

export interface BulkTerminateMaintainDonorAttributeRequest {
  items: BulkTerminateItem[];
}

export interface BulkTerminateItem {
  interCode: string;
  effDate: string;
  interType?: string;
}

export interface AttributeFilters {
  showTerminated?: boolean;
  effDate?: string;
  effDatePeriod?: 'after' | 'before';
  termDate?: string;
  termDatePeriod?: 'after' | 'before';
}
