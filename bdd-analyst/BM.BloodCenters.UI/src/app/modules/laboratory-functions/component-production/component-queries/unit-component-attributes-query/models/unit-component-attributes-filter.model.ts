// ============================================
// Unit Attributes Filter Model
// Fields: Attribute Code, Attribute Type (Group), User
// ============================================
export interface UnitAttributesFilterValue {
  attribCode?: string;
  attribGroup?: string;
  insertUserId?: string;
}

// ============================================
// Component Attributes Filter Model
// Fields: Product Code, Attribute Code, User
// ============================================
export interface ComponentAttributesFilterValue {
  productCode?: string;
  attribCode?: string;
  insertUserId?: string;
}
