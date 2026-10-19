/**
 * Component Attribute Models
 * Based on API guide: IMCHKIN-API-Integration-Guide
 */

/**
 * Attribute create/update request DTO
 */
export interface ComponentAttributeDto {
  unitId: string;
  productCode: string;
  attribGroup: string;
  attribCode: string;
  chapterId: string;
}

/**
 * Attribute display model for grid - matches GET /components/{unitId}/attributes response
 */
export interface AttributeGridItem {
  unitId: string;
  chapterId: string;
  productCode: string;
  attribGroup: string;
  attribCode: string;
  attributeGroupDesc: string;
  attributeCodeDesc: string;
  insertDate?: string;
  insertUserId?: string;
}

/**
 * @deprecated Internal types no longer used.
 */
export interface AddComponentAttributesRequest {
  unitId: string;
  productCode: string;
  productType: 'PHER' | 'DON';
  attributes: ComponentAttributeDto[];
}

export interface AttributeGroupLookup {
  attribGroup: string;
  description: string;
  productType: 'PHER' | 'DON';
}

export interface AttributeCodeLookup {
  attribCode: string;
  description: string;
  attribGroup: string;
}

/**
 * LOV DTO for attribute group and code dropdowns (from /lov/attribute-groups, /lov/attribute-codes)
 */
export interface AttributeLovDto {
  code: string;
  description: string;
}
