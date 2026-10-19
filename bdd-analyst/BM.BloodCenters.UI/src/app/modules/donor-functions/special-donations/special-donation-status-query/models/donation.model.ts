export interface SpecialDonation {
  id: string;
  sequence: number;
  shipLocation: string;
  patient: string;
  patientId: string;
  unitId: string;
  collectionDate: string;
  donationType: string;
  surgeryId: string;
  surgeryDate: string;
  surgeryDay: string;
  dateNeeded: string;
  components: DonationComponent[];
}

export interface DonationComponent {
  type: string;
  product: string;
  shipDate: string;
  componentsMade?: string;
  componentsRequested?: string;
  unitId?: string;
  productCode?: string;
  shippedDate?: string;
}

export interface FilterCriteria {
  fromDate: string;
  toDate: string;
  shipLocation: string;
  patientId: string;
  details: string;
  option: string;
  unitId: string;
  surgeryId: string;
  needBy: string;
}
