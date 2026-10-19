export interface DiscardProductsParamsDto {
  consigneeId: string;
  customerId: string;
  productType?: string | null;
  searchKeyword?: string | null;
  sort?: string | null;
}
