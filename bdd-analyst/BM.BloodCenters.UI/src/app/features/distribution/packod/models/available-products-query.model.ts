/**
 * Available products query model
 * Request parameters for fetching available (unpacked) discard products
 */
export interface AvailableProductsQueryDto {
  /** Selected consignee ID (required) */
  consigneeId: string;

  /** Filter by product type (optional) */
  productType?: string | null;

  /** Filter by box ID (null = unpacked only) */
  boxId?: string | null;

  /** Records per page (default 50, max 100) */
  take?: number;

  /** Records to skip for pagination (default 0) */
  skip?: number;
}
