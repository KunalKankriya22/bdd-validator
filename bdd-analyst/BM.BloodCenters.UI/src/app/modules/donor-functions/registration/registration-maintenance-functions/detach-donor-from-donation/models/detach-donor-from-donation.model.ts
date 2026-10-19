export interface ReturnResult<T> {
  success: boolean;
  message: string;
  error: string;
  errorCode?: string;
  statusCode: number;
  data: T[];
  item: T;
  total: number;
}

export interface DonationLookupDto {
  unitId: string;
  collDate: string;
  donorId: string;
}

export interface DonationWithDonorDto {
  unitId: string;
  collDate: string;
  donorId: string;
  enteredBy: string;
  lastName: string;
  firstName: string;
  middleInitial: string;
  dob: string;
  sex: string;
  abo: string;
  homeAddress: string;
  apartmentNumber: string;
  city: string;
  state: string;
  zip: string;
  homePhone: string;
  businessPhone: string;
  internationalAddress: string;
  employerSchool: string;
  employerCityState: string;
  employerZip: string;
  ethnicGroup: string;
  employerInternationalAddress: string;
  transactionId?: string;
}

export interface BleedTimeDetailsDto {
  armUsed: string | null;
  collDate: string | null;
  doubleStickId: string | null;
  l1BleedStart: string | null;
  l1BleedEnd: string | null;
  l2BleedStart: string | null;
  l2BleedEnd: string | null;
  r1BleedStart: string | null;
  r1BleedEnd: string | null;
  r2BleedStart: string | null;
  r2BleedEnd: string | null;
  phleb1Id: string | null;
  phleb2Id: string | null;
  phleb3Id: string | null;
  phleb4Id: string | null;
  phlebEnd1Id: string | null;
  phlebEnd2Id: string | null;
  otherPhleb1Id: string | null;
  otherPhleb2Id: string | null;
}

export interface DetachDonorRequest {
  unitId: string;
  firstUnitId: string;
  secondUnitId: string;
  collDate: string;
  entryCheck: string;
  chapterId: string;
  codeScheme: string;
}
