// ─── Shared ───────────────────────────────────────────────────────────────────

export interface LovOption {
  value: string;
  label: string;
}

/** Raw shape returned by every lookup API: { code, description } */
export interface ApiLovDto {
  code: string;
  description?: string;
}

export interface PhysicianLookupDto {
  phyId: string;
  lastName: string;
  firstName?: string;
}

export interface HospitalLookupDto {
  name: string;
  city?: string;
  phone?: string;
  customerId: string;
  consigneeId: string;
}

// ─── Patient ──────────────────────────────────────────────────────────────────

/** GET /lookup/patients */
export interface PatientSearchResultDto {
  patId: string;
  patLastName: string;
  patFirstName?: string;
  status: string;
}

/** GET /patient/{patId} */
export interface PatientDetailDto {
  patId: string;
  patLastName: string;
  patFirstName?: string;
  sex?: string;
  dob?: string;
  aboType?: string;
  status: string;
  comments?: string;
  hlaAntigens?: HlaAntigensDto;
  hlaAntibodies: HlaAntibodyDto[];
  rbcAntibodies: RbcAntibodyDto[];
  rbcAntigens: RbcAntigenDto[];
}

export interface HlaAntigensDto {
  a1?: string;
  a2?: string;
  b1?: string;
  b2?: string;
}

export interface HlaAntibodyDto {
  locus: string;
  epitopeId: string;
}

export interface RbcAntibodyDto {
  testId: string;
}

export interface RbcAntigenDto {
  testId: string;
  resultCode?: string;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

/** GET /patient/{patId}/requests — one item */
export interface RequestListItemDto {
  requestId: string;
  requestedDate?: string;
  status?: string;
  submitRequest?: string;
}

/** GET /request/{requestId} */
export interface RequestDetailDto {
  requestId: string;
  patientId: string;
  hospitalId?: string;
  hospitalName?: string;
  contactPerson?: string;
  contactPhone?: string;
  intlContactPhone?: string;
  physicianId?: string;
  physicianName?: string;
  diagnosis?: string;
  productType?: string;
  priority?: string;
  requestedDate?: string;
  bloodType?: string;
  hlaPheno: string;   // 'Y' | 'N'
  hlaAnti: string;
  rbcAnti: string;
  rbcPheno: string;
  exactMatch: string; // 'Y' | 'N'
  unitRequest: string;
  status?: string;
  submitRequest?: string; // 'Y' | 'N' | 'E'
  lastSearchDateTime?: string;
  donorCount?: number;
  unitCount?: number;
  expTransfusionDate1?: string; quantity1?: number;
  expTransfusionDate2?: string; quantity2?: number;
  expTransfusionDate3?: string; quantity3?: number;
  expTransfusionDate4?: string; quantity4?: number;
  expTransfusionDate5?: string; quantity5?: number;
  expTransfusionDate6?: string; quantity6?: number;
  expTransfusionDate7?: string; quantity7?: number;
  requestDetails: RequestDetailItemDto[];
}

export interface RequestDetailItemDto {
  attribGroup: string;
  attribCode: string;
}

// ─── Save ─────────────────────────────────────────────────────────────────────

export type MatchType = 'HP' | 'HA' | 'RA' | 'RP';

/** POST /save — request body */
export interface SavePayloadDto {
  patId?: string;
  isNewPatient: boolean;
  patLastName: string;
  patFirstName?: string;
  sex?: string;
  dob?: string;
  aboType?: string;
  status: string;
  comments?: string;
  matchType: MatchType;
  exactMatch: boolean;
  withAbo?: string;
  hlaA1?: string;
  hlaA2?: string;
  hlaB1?: string;
  hlaB2?: string;
  hlaAntibodies?: HlaAntibodyDto[];
  rbcAntibodies?: RbcAntibodyDto[];
  rbcAntigens?: RbcAntigenDto[];
  requestId?: string;
  hospitalName: string;
  contactPerson?: string;
  contactPhone?: string;
  intlContactPhone?: string;
  physicianId?: string;
  physicianName?: string;
  diagnosis?: string;
  productType?: string;
  priority?: string;
  requestDate?: string;
  inventorySearch: boolean;
  submitSearch: boolean;
  scheduledDates?: { targetDate?: string; quantity?: number }[];
  requestDetails?: RequestDetailItemDto[];
}

/** POST /save — response item */
export interface SaveResultDto {
  patId: string;
  requestId: string;
}

// ─── Legacy aliases (used internally by FormArray helpers) ────────────────────

export interface AttribCodeMap {
  [group: string]: LovOption[];
}

export interface HlaEpitopesMap {
  [locus: string]: LovOption[];
}
