import { ProductCodeLov } from './product-code-lov.model';

/**
 * Component Init Data Model
 * Combined response containing collection date and product codes
 * Returned by /init-data endpoint to reduce API calls
 */
export interface ComponentInitData {
  collectionDate: string; // ISO date string from API
  productCodes: ProductCodeLov[];
}
