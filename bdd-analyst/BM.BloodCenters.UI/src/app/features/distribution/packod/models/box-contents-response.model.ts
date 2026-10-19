export interface BoxContentItemDto {
  unitId: string;
  chkDigit: string;
  expDate: Date | string;
  productType: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  aboDesc: string;
  collDate?: Date | string | null;
}
