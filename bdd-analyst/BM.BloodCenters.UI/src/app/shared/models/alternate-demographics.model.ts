export interface AlternateDemographicsModel {
  addressType: 'L' | 'I';
  streetName: string | null;
  suiteApt: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  uspsId: number | null;
  intlAddress1: string | null;
  intlAddress2: string | null;
  intlAddress3: string | null;
  intlAddress4: string | null;
  countryName: string | null;
  intlCity: string | null;
  intlPostalCode: string | null;
  intlAddrFlag: string | null;
  mobilePhoneNumber: string | null;
  otherContactNumber: string | null;
  altIntlPhoneNumber: string | null;
  preferredContactPhone: string | null;
  preferredContactAddress: string | null;
}

export interface AlternateDemographicsDialogData {
  donorId?: string;
  readOnly?: boolean;
  existingData?: AlternateDemographicsModel;
}

export interface CityStateResult {
  city: string;
  state: string;
  zip: string;
  uspsId: number;
}

export interface ValidateAlternateDemographicsRequest {
  addressType: string;
  streetName?: string | null;
  suiteApt?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  uspsId?: number | null;
  intlAddress1?: string | null;
  intlAddress2?: string | null;
  intlAddress3?: string | null;
  intlAddress4?: string | null;
  countryName?: string | null;
  intlCity?: string | null;
  intlPostalCode?: string | null;
  mobilePhoneNumber?: string | null;
  otherContactNumber?: string | null;
  altIntlPhoneNumber?: string | null;
  preferredContactPhone?: string | null;
  preferredContactAddress?: string | null;
}

export const PREFERRED_CONTACT_PHONE_OPTIONS = [
  { value: 'H', label: 'Home Phone' },
  { value: 'M', label: 'Mobile Phone' },
  { value: 'W', label: 'Work Phone' },
  { value: 'O', label: 'Other' },
  { value: 'D', label: 'Day Phone' },
  { value: 'A', label: 'Alternate' }
];

export const PREFERRED_CONTACT_ADDRESS_OPTIONS = [
  { value: 'H', label: 'Home Address' },
  { value: 'A', label: 'Alternate Address' }
];

export function createEmptyAlternateDemographics(): AlternateDemographicsModel {
  return {
    addressType: 'L',
    streetName: null,
    suiteApt: null,
    city: null,
    state: null,
    zip: null,
    uspsId: null,
    intlAddress1: null,
    intlAddress2: null,
    intlAddress3: null,
    intlAddress4: null,
    countryName: null,
    intlCity: null,
    intlPostalCode: null,
    intlAddrFlag: null,
    mobilePhoneNumber: null,
    otherContactNumber: null,
    altIntlPhoneNumber: null,
    preferredContactPhone: null,
    preferredContactAddress: null
  };
}
