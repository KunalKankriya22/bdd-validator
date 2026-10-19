// Main data model (API response)
export interface DriveLocation {
  locationId: string;
  locationName: string;
  locationType: string;
  locationTypeDescription?: string;
  sponsorId?: string;
  sponsorName?: string;
  city?: string;
  travelTime?: number;
  travelDistance?: number;
  openTime?: string;
  closeTime?: string;
  effDate: string;
  termDate?: string;
  staffFacility?: string;
  siteDirections?: string;
  noteId?: string;
  addressId?: string;
  chapterId: string;
  programId?: string;
  insertDate?: string;
  insertUser?: string;
  // Fields that might be in expanded row or detail API
  hospitalId?: string;
  nearestHospitalId?: string;
  fdaLicenseDate?: string;
  rotationFlag?: string;
  siteManager?: string;
  siteManagerName?: string;
  zone?: string;
  auditKey?: number;
  // Address data from detail API
  address?: {
    addressId: string;
    streetName?: string;
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    zip?: string;
    county?: string;
    uspsId?: number;
    hAreaCode?: string;
    hPhoneNo?: string;
    dAreaCode?: string;
    dPhoneNo?: string;
    fAreaCode?: string;
    fPhoneNo?: string;
    email?: string;
    webAddress?: string;
    intlAddrFlag?: string;
    countryName?: string;
  };
  // Notes from detail API
  notes?: Array<{
    noteId: string;
    noteSequence: number;
    note: string;
    auditKey: number;
    insertDate: string;
    insertUser: string;
    insertUserName: string;
  }>;
}

// Search request parameters
export interface DriveLocationSearchParams {
  searchKeyword?: string | null;
  chapterId?: string | null;
  showTerminated?: boolean;
  effDate?: string | null;
  effDatePeriod?: 'AFTER' | 'BEFORE' | null;
  termDate?: string | null;
  termDatePeriod?: 'AFTER' | 'BEFORE' | null;
  sortField?: string | null;
  sortDirection?: 'ASC' | 'DESC';
}

// Filter form values
export interface DriveLocationFilterFormValue {
  effDate: string | null;
  effDatePeriod: 'AFTER' | 'BEFORE' | null;
  termDate: string | null;
  termDatePeriod: 'AFTER' | 'BEFORE' | null;
  showTerminated: boolean;
}

// Filter chip model
export interface FilterChip {
  key: string;
  label: string;
  value: any;
  removable?: boolean;
}

// API response wrapper
export interface DriveLocationResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: DriveLocation[];
  total: number;
  errorResponse?: {
    errorCode: string;
    error: string;
  };
}
