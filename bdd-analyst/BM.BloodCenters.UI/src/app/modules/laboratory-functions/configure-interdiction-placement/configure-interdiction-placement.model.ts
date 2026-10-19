export interface InterdictionPlacement {
  chapterId: string;
  actionFunctionName: string;
  actionType: string;
  actionProductCode: string;
  actionCode: string | null;
  interOnCurrentProd: string | null;
  interOnOtherProds: string | null;
  interOnOtherProdTypes: string | null;
  interOnUnitLevel: string | null;
  interAllProdButCurr: string | null;
  interCode: string | null;
  effDate: string | null;
  termDate: string | null;
  insertDate: string | null;
  insertUser: string | null;
}

export interface CreateInterdictionPlacementRequest {
  actionFunctionName: string;
  actionType: string;
  actionProductCode: string;
  actionCode: string | null;
  interOnCurrentProd: string | null;
  interOnOtherProds: string | null;
  interOnOtherProdTypes: string | null;
  interOnUnitLevel: string | null;
  interAllProdButCurr: string | null;
  interCode: string | null;
  effDate: string | null;
  termDate: string | null;
}

export interface UpdateInterdictionPlacementRequest {
  actionCode: string | null;
  interOnCurrentProd: string | null;
  interOnOtherProds: string | null;
  interOnOtherProdTypes: string | null;
  interOnUnitLevel: string | null;
  interAllProdButCurr: string | null;
  interCode: string | null;
  effDate: string | null;
  termDate: string | null;
}

export interface InterdictionPlacementQuery {
  actionFunctionName?: string;
  actionType?: string;
  actionProductCode?: string;
  actionCode?: string;
  interCode?: string;
  interOnCurrentProd?: string;
  interOnOtherProds?: string;
  searchKeyword?: string;
  effDateFrom?: string;
  effDateTo?: string;
  termDateFrom?: string;
  termDateTo?: string;
  sortColumn?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ActionFunctionNameLookup {
  code: string;
  description: string;
}

export interface ActionTypeLookup {
  code: string;
  description: string;
}

export interface ActionCodeLookup {
  code: string;
  codeDesc: string;
}

export interface ProductCodeLookup {
  productCode: string;
  productDesc: string;
}

export interface InterdictionCodeLookup {
  interCode: string;
  interDesc: string;
  interType: string;
}

export interface ProductTypeLookup {
  productType: string;
}

export interface InterdictionPlacementFilterState {
  currentProduct?: string;
  otherProduct?: string;
  rejectCode?: string;
  effectivePeriod?: string;
  effectiveDate?: string;
  terminationPeriod?: string;
  terminationDate?: string;
}
