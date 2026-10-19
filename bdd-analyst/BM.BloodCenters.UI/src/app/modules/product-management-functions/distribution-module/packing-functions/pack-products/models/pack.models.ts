/**
 * Pack Products models — aligned with BM.BloodCenters.API PackProducts module
 * Oracle Form: DSIMANPK   JIRA: MLT-14015
 */

// ── Generic wrapper ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  total?: number;
}

// ── Order search / LOV ─────────────────────────────────────────────────────────

/** Returned by GET /api/pack-products/orders and /orders/search */
export interface OrderSearchDto {
  orderNo: string;
  orderType?: string | null;
  orderClass?: string | null;
  orderStatus?: string | null;
  customerId?: string | null;
  consigneeId?: string | null;
  orderClassDescription?: string | null;
  orderTypeDescription?: string | null;
  consigneeName?: string | null;
  estArrivalTime?: string | null;
}

// ── Order details ──────────────────────────────────────────────────────────────

/** Returned by GET /api/pack-products/orders/{orderNo} */
export interface OrderDetailDto {
  orderNo: string;
  orderType?: string | null;
  orderClass?: string | null;
  orderClassDescription?: string | null;
  customerId?: string | null;
  shipToAddress?: string | null;
  estArrivalTime?: string | null;
  items: OrderItemDto[];
}

/** Returned by GET /api/pack-products/orders/{orderNo}/items */
export interface OrderItemDto {
  itemNo: number;
  productType?: string | null;
  productDescription?: string | null;
  bloodType?: string | null;
  aboRhDescription?: string | null;
  remainingQty?: number | null;
  itemStatus?: string | null;
  itemStatusDescription?: string | null;
  attributes?: string | null;
  unitPrice?: number | null;
}

// ── Pick slips ────────────────────────────────────────────────────────────────

/** Returned by GET /api/pack-products/orders/{orderNo}/pick-slips */
export interface PickSlipDto {
  pickSlipId: string;
  orderNo?: string | null;
  pickSlipStatus?: string | null;
  pickSlipType?: string | null;
  insertDate?: string | null;
}

// ── Boxes ─────────────────────────────────────────────────────────────────────

export interface BoxTypeDto {
  code: string;
  description?: string | null;
}

/** Active boxes returned by GET /api/pack-products/boxes/active */
export interface ActiveBoxDto {
  boxId: string;
  boxType?: string | null;
  boxTypeDescription?: string | null;
  boxStatus?: string | null;
  itemCount?: number;
}

/** POST /api/pack-products/boxes request */
export interface CreateBoxRequestDto {
  boxType: string;
  warehouseId?: string | null;
  boxId?: string | null;
}

/** GET /api/pack-products/boxes/{boxId}/contents — product list */
export interface PackedProductDto {
  pickSlipId?: string | null;
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  boxId?: string | null;
  itemNo?: number;
  expDate?: string | null;
  collDate?: string | null;
  productStatus?: string | null;
  productType?: string | null;
  bloodType?: string | null;
  insertDate?: string | null;
  insertUser?: string | null;
  aboRhDescription?: string | null;
  productDescription?: string | null;
}

/** GET /api/pack-products/boxes/{boxId}/contents wrapper */
export interface BoxContentsDto {
  boxId: string;
  boxType?: string | null;
  boxTypeDescription?: string | null;
  boxStatus?: string | null;
  itemCount?: number;
  products?: PackedProductDto[];
}

// ── Packing ───────────────────────────────────────────────────────────────────

/** POST /api/pack-products/pack — matches BE PackProductRequestDto */
export interface PackProductRequestDto {
  orderNo: string;
  pickSlipId?: string | null;
  boxId: string;
  itemNo: number;
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  bloodType?: string | null;
  expDate?: string | null;
  qcCheck?: string | null;
}

/** POST /api/pack-products/quarantine — QC='N' path (FMB: hold_product / error 3101) */
export interface QuarantineProductRequestDto {
  orderNo: string;
  pickSlipId?: string | null;
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  reason: string;
}

/** POST /api/pack-products/unpack */
export interface UnpackProductRequestDto {
  pickSlipId: string;
  unitId: string;
  productCode: string;
}

/** GET /api/pack-products/pack-status/{pickSlipId} */
export interface PackStatusItemDto {
  unitId: string;
  productCode: string;
  aliquot?: string | null;
  aboRh?: string | null;
  productStatus?: string | null;
}

/** POST /api/pack-products/validate-unit */
export interface ValidateUnitRequestDto {
  scannedValue: string;
  orderNo: string;
  itemNo: number;
  warehouseId?: string | null;
}

// ── UI-only / Dialog ──────────────────────────────────────────────────────────

export interface PackStatusDialogData {
  packedProducts: PackStatusItemDto[];
  allocatedProducts: PackStatusItemDto[];
}

export interface ViewBoxContentsDialogData {
  boxId: string;
  products: PackedProductDto[];
}

export interface CloseBoxDialogData {
  boxId: string;
  productCount: number;
}

export interface CloseBoxDialogResult {
  confirmed: boolean;
}

export const PACK_FIELD_LENGTHS = {
  ORDER_NO: 14,
  UNIT_ID: 15,
  PRODUCT_CODE: 8,
  BOX_ID: 10,
  PICK_SLIP_ID: 13,
} as const;
