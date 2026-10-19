/**
 * Interdicted product item from inventory
 */
export interface InterdictedProduct {
  unitId: string;
  collDate: string;
  chapterId: string;
  productType: string;
  productCode: string;
  inventoryClass: string;
  bloodType: string;
  aliquot: string;
  locationId: string;
  stockState: string;
  checkDigit?: string;
  aboRh: string;
  interdictions: ProductInterdiction[];
}

/**
 * A single interdiction record attached to a product
 */
export interface ProductInterdiction {
  interCode: string;
  interDesc: string;
}

/**
 * Inventory class filter option
 */
export interface InventoryClassOption {
  code: string;
  description: string;
}

/**
 * Product type filter option
 */
export interface ProductTypeOption {
  productType: string;
  description: string;
}

/**
 * Filter values for the CDK overlay filter panel
 */
export interface InterdictedFilterValue {
  inventoryClass?: string;
  productType?: string;
}

/**
 * API response wrapper — mirrors pattern in reject-inventory-products.model.ts
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  statusCode: number;
  data?: T;
  item?: T;
  total?: number;
  errorCode?: string | null;
}
