export interface PackProductRequestDto {
  consigneeId: string;
  customerId: string;
  orderNo?: string | null;
  productType?: string | null;
  boxId?: string | null;
  unitId: string;
  productCode: string;
  aliquot: string;
  bloodType: string;
  expDate: Date | string;
  collDate?: Date | string | null;
  codeScheme: string;
}
