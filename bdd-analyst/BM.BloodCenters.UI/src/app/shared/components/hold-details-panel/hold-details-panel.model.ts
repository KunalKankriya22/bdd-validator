export interface HoldDetailsPanelRecord {
  transactionId: string;
  donorId: string;
  unitId: string;
  collectionDate: string | Date;
}

export interface HoldDetailsFilterValue {
  holds?: string;
  entryDatePeriod?: string;
  entryDate?: string | Date;
  terminationDatePeriod?: string;
  terminationDate?: string | Date;
}

export interface DropdownOption {
  value: string;
  label: string;
}
