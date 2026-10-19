export interface InstitutionForm {
  institutionId: string;

  // Auto-set by backend to ProgramIDConstant.Institutions ('VDIINST')
  // Frontend value is ignored/overridden by backend
  programId: string;

  institutionName: string;
  contractPrefix: string;
  facilityShortName: string;
  printHeader: string;
  systemName: string;

  registrationInfo: RegistrationInfo;
  contactInfo: ContactInfo;
}

export interface RegistrationInfo {
  registrationNumber?: string;
  licenseNumber?: string;
  codabarScheme: string | null;
  effectiveDate: Date | null;
}

export interface ContactInfo {
  isInternational: boolean;

  addr_1: string;
  addr_2?: string;
  addr_3?: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;

  phoneNumber?: string;
  internationalPhoneNumber?: string;
  fax?: string;
  internationalFax?: string;
}

