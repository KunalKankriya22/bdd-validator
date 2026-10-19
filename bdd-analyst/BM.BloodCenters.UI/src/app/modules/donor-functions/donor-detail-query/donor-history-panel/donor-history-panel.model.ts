export interface DonorHistoryPanelData {
  donorId: string;
}

export interface DonorHistoryRecord {
  collDate: string;
  unitId: string;
  cholLevel: string;
  bp: string;
}

export interface DonorHistoryHeaderInfo {
  name: string;
  dateOfBirth: string;
  sex: string;
  abo: string;
  eligibleOn: string;
  eligibleFor: string;
  lifetimeDonations: number;
  printerId: string;
}
