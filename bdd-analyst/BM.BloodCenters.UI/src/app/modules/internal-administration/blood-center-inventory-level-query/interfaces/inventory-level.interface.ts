/**
 * Blood Center Inventory Level Query - TypeScript Interfaces
 * Generated from API Documentation: blood-center-inventory-level-api-documentation.md
 */

/**
 * Request DTO for querying inventory levels
 * POST /api/v1/blood-center-inventory-levels/query
 */
export interface InventoryLevelQueryDto {
  inventoryClass: string;      // REQUIRED: Max 10 chars
  productType?: string | null;  // OPTIONAL: Max 10 chars
  bloodType?: string | null;    // OPTIONAL: Max 10 chars
  attributeGroup?: string | null; // OPTIONAL: Max 10 chars
  attributeCode?: string | null;  // OPTIONAL: Max 10 chars (requires attributeGroup)
}

/**
 * Response DTO for inventory level query results
 */
export interface InventoryLevelResultDto {
  productType: string;
  productDescription: string;
  bloodType: string;
  bloodTypeDescription: string;
  actualCount: number;
  minLevel: number;
  optimalLevel: number;
  customerAlphaKey: string;
}

/**
 * Inventory Class lookup item
 * GET /api/v1/blood-center-inventory-levels/inventory-classes
 */
export interface InventoryClassDto {
  code: string;
  description: string;
}

/**
 * Product Type lookup item
 * GET /api/v1/blood-center-inventory-levels/product-types
 */
export interface ProductTypeDto {
  code: string;
  description: string;
}

/**
 * Blood Type lookup item
 * GET /api/v1/blood-center-inventory-levels/blood-types
 */
export interface BloodTypeDto {
  code: string;
  description: string;
}

/**
 * Attribute Group lookup item
 * GET /api/v1/blood-center-inventory-levels/attribute-groups
 */
export interface AttributeGroupDto {
  code: string;
}

/**
 * Attribute Code lookup item
 * GET /api/v1/blood-center-inventory-levels/attribute-codes/{attributeGroup}
 */
export interface AttributeCodeDto {
  code: string;
  description: string;
}

/**
 * Standard API Response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  total?: number;
}
