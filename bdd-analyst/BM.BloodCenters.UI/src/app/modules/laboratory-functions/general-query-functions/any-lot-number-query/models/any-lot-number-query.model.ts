export interface LotTypeLov {
  bagCode: string;
  codeDesc: string;
}

export interface LotNumberLov {
  lotNumber: string;
  vendorName: string | null;
  dateReceived: string | null;
}

export interface AnyLotNumberQueryRequest {
  lotType: string;
  lotNumber: string;
}

export interface LotUnitRow {
  unitId: string;
  collDate: string | null;
  sourceTable: string;
  components: LotComponentRow[];
}

export interface LotComponentRow {
  productCode: string | null;
  componentStatus: string | null;
  systemLabelDecision: string | null;
  aboLabel: string | null;
  destination: string | null;
}
