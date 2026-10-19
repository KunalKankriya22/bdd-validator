export interface SponsorContactModel {
  sponsorId: string;
  contactId: string;
  addressId: string;
  contactType: string;
  contactTypeDescription: string;
  salutation: string;
  salutationDescription: string;
  firstName: string;
  lastName: string;
  title: string;
  titleDescription: string;
  effDate: string;
  termDate: string | null;
  sponsorName: string;
  chapterId: string;
  programId: string;
  insertDate: string;
  insertUser: string;
  auditKey: number;
}

export interface SponsorContactParamsDto {
  chapterId?: string;
  sponsorId?: string;
  contactName?: string;
  matchType?: string;
  showTerminated?: boolean;
  searchKeyword?: string;
  sort?: string;
}

export interface SponsorContactResponse {
  data: SponsorContactModel[];
  totalRecords: number;
}

export interface SponsorContactCreateDto {
  sponsorId: string;
  contactType: string;
  lastName: string;
  effDate: string;
  chapterId: string;
  salutation?: string;
  firstName?: string;
  middleName?: string;
  title?: string;
  termDate?: string;
  address?: {
    address1?: string;
    address2?: string;
    address3?: string;
    streetName?: string;
    suiteApt?: string;
    zip?: string;
    uspsId?: number;
    mapsco?: string;
    dAreaCode?: string;
    dPhoneNo?: string;
    extension?: number;
    dCountryCode?: string;
    fAreaCode?: string;
    fPhoneNo?: string;
    fCountryCode?: string;
    hAreaCode?: string;
    hPhoneNo?: string;
    hCountryCode?: string;
    mAreaCode?: string;
    mPhoneNo?: string;
    pager?: string;
    email?: string;
    webAddress?: string;
    intlAddrFlag?: string;
    intlAddress1?: string;
    intlAddress2?: string;
    intlAddress3?: string;
    intlAddress4?: string;
    countryName?: string;
    intlPostalCode?: string;
    intlHomePhoneNo?: string;
    intlWorkPhoneNo?: string;
    intlWorkPhoneExt?: string;
    intlMobilePhoneNo?: string;
    intlFaxNo?: string;
  };
  notes?: { noteText: string }[];
}

export interface ContactNoteModel {
  noteId: string;
  contactId: string;
  notes: string;
  createdBy: string;
  createdDate: string;
  version: string;
  auditKey?: number;
}

export interface SponsorLookupItem {
  sponsorId: string;
  name: string;
}

export interface ContactNameLookupItem {
  firstName?: string;
  lastName: string;
}

export interface TitleLookupItem {
  code: string;
  description: string;
}

export interface ZipCodeLookupItem {
  zip: string;
  city: string;
  state: string;
  uspsId: number;
}

export interface SponsorContactAddress {
  addressId?: string;
  chapterId?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  streetName?: string;
  suiteApt?: string;
  zip?: string;
  uspsId?: number;
  mapsco?: string;
  city?: string;
  state?: string;
  dAreaCode?: string;
  dPhoneNo?: string;
  extension?: number;
  dCountryCode?: string;
  fAreaCode?: string;
  fPhoneNo?: string;
  fCountryCode?: string;
  hAreaCode?: string;
  hPhoneNo?: string;
  hCountryCode?: string;
  mAreaCode?: string;
  mPhoneNo?: string;
  pager?: string;
  email?: string;
  webAddress?: string;
  intlAddrFlag?: string;
  intlAddress1?: string;
  intlAddress2?: string;
  intlAddress3?: string;
  intlAddress4?: string;
  countryName?: string;
  intlPostalCode?: string;
  intlHomePhoneNo?: string;
  intlWorkPhoneNo?: string;
  intlWorkPhoneExt?: string;
  intlMobilePhoneNo?: string;
  intlFaxNo?: string;
}

export interface SponsorContactDetailModel {
  sponsorId: string;
  contactId: string;
  addressId: string;
  contactType: string;
  contactTypeDescription?: string;
  salutation?: string;
  salutationDescription?: string;
  firstName?: string;
  lastName: string;
  title?: string;
  titleDescription?: string;
  effDate: string;
  termDate?: string;
  sponsorName: string;
  notes: ContactNoteModel[];
  address: SponsorContactAddress;
  chapterId: string;
  programId: string;
  insertDate: string;
  insertUser: string;
}
