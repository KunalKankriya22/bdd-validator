export interface ComponentDto {
  unitId: string;
  collDate: string;
  chapterId: string;
  productCode: string | null;
  abo: string | null;
  rh: string | null;
  status: string | null;
  poolId: string | null;
  expDate: string | null;
  lotNumber: string | null;
  volume: number | null;
  location: string | null;
  modifiedDate: string | null;
  modifiedUser: string | null;
  productDescription: string | null;
  expirationDate: string | null;
  noteId: number | null;
  insertDate: string | null;
  insertUser: string | null;
  componentPrefix: string | null;
  bagId: string | null;
  systemLabelDecision: string | null;
  rejectReasonCode: string | null;
  labelDats: string | null;
  bagsUsed: number | null;
}
