export interface CreateNewBoxRequestDto {
  currentBoxId?: string | null;
  closeCurrentBox: boolean;
  allProductsProperlyPacked: boolean;
  consigneeId: string;
}
