export interface AttributeCodeModel {
  attributeGroup: string;
  attributeCode: string;
  description: string;
  price?: number | null;
  unitSchemeType: string;
  statusFlag: string;
  interCode?: string | null;
  stopLabelFlag: string;
  assignAfterLabelFlag: string;
  showOnLabelFlag: string;
  deleteAllowed?: string | null;
  attributeCustom: string;
  normalStockFlag: string;
  creditFlag: string;
  serviceCode?: string | null;
  attributeLabel?: string | null;
  attributeAbbrev?: string | null;
  attributePosition?: number | null;
  attributeType: string;
  exclusivityFlag: string;
  eqCode128AttributeGroup?: string | null;
  eqCode128AttributeCode?: string | null;
  effectiveDate?: string | null;
  terminationDate?: string | null;
  programId?: string | null;
  lastModifiedDate?: string | null;
  uniqueRowId?: string; // Unique identifier for row expansion tracking
}

export interface AttributeCodeFormValue {
  attributeCode: string | null;
  description: string | null;
  unitScheme?: string | null;
  statusFlag?: string;
  attributeType: string | null;
  attributeLabel?: string | null;
  attributeAbbrev?: string | null;
  attributePosition?: number | null;
  normalStockFlag: string;
  assignAfterLabelFlag: string;
  effectiveDate: import('moment').Moment | null;
  terminationDate: import('moment').Moment | null;
  interCode?: string | null;
  stopLabelFlag?: string;
  attributeCustom?: string;
  showOnLabelFlag?: string;
  deleteAllowed?: string;
  exclusivityFlag?: string;
  price?: number | null;
  serviceCode?: string | null;
  creditFlag?: string;
}

export interface AttributeCodeQueryParamsDto {
  attributeCode?: string;
  attribGroup?: string;
  searchKeyword?: string;
  sortColumn?: string;
  sortOrder?: string;
  stopLabelFlag?: string;
  exclusivityFlag?: string;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  terminationDateFrom?: string;
  terminationDateTo?: string;
}

export interface AttributeGroupDropdownItem {
  code: string;
  description: string;
}
