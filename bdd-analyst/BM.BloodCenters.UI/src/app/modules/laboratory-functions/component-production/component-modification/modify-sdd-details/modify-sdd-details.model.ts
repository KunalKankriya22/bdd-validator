/** Item indicator codes from UNIT_ADD_ON_BAGS.ITEM_IND */
export const ItemInd = {
  FiltersOnly:       'FI',
  SegmentsOnly:      'SE',
  BagsOnly:          'BA',
  FiltersWithBags:   'FB',
} as const;
export type ItemInd = typeof ItemInd[keyof typeof ItemInd];

export interface ProductCodeOption {
  productCode: string;
  productDescription: string;
  sdcWsNumber: string;
  itemInd: string;
  itemIndDescription: string;
}

export interface LotNumberOption {
  lotNumber: string;
  numberOfItems: number | null;
}

export interface WaferLotOption {
  lotNumber: string;
}

export interface MachineOption {
  code: string;
  codeDescription: string;
}

export interface SddFormData {
  // Current record values (from UNIT_ADD_ON_BAGS)
  sdcWsNumber: string;
  productCode: string;
  productDescription: string;
  itemInd: string;
  lotNumber: string;
  waferLotNumber: string;
  sterileMachine: string;
  numberOfBags: number | null;
  numberOfItems: number | null;
  weldFlag: string;
  bagsUsed?: number;
  segmentRemFlag?: string;
  segmentNumber?: string;
  isLotNumberValid: boolean;
  isWaferLotValid: boolean;
  // LOV dropdown options
  lotNumbers?: LotNumberOption[];
  waferLots?: WaferLotOption[];
  machines?: MachineOption[];
}

export interface SaveSddPayload {
  unitId: string;
  productCode: string;
  sdcWsNumber: string;
  itemInd: string;
  lotNumber: string;
  numberOfItems: number | null;
  waferLotNumber: string;
  sterileMachine: string;
  weldFlag: string;
  numberOfBags: number | null;
  segmentRemFlag?: string;
  segmentNumber?: string;
}
