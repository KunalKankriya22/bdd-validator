export interface DiscardProductDto {
  unitId: string;
  chkDigit: string;
  productCode: string;
  productType: string;
  productDesc: string;
  aliquot: string;
  bloodType: string;
  aboDesc: string;
  expDate: Date | string;
  collDate?: Date | string | null;
  boxId?: string | null;
  productStatus: string;
  disCardType?: string | null;
}
