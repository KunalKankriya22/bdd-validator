import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import { API } from '@core/constants/api.constants';
import {
  OfflineProductShipmentChargeDto,
  CreateOfflineProductShipmentChargeDto,
  UpdateOfflineProductShipmentChargeDto,
  OfflineProductShipmentQueryDto,
  ShipmentHeaderDto,
  BoxDataDto,
  ProductInBoxDto,
  ConsigneeInZoneDto,
  ShipmentNumberLookupDto,
  ConsigneeLookupDto,
  ConsigneeDetailDto,
  CarrierLookupDto,
  ChargeCodeLookupDto,
  PrintPackListResponseDto,
  PrinterLookupDto,
  CompleteBoxEntryRequestDto,
  CompleteBoxEntryResponseDto,
  BoxValidateRequestDto,
  BoxValidationResultDto,
  FinalizeShipmentResponseDto,
  ApiResponse
} from '../models/offline-product-shipment.model';

/**
 * API Service for Offline Product Shipment functionality
 * Handles all HTTP requests for shipment management, charges, and related data
 */
@Injectable({
  providedIn: 'root'
})
export class OfflineProductShipmentApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.BASE}`;

  // ==================== IMPLEMENTED ENDPOINTS (from API documentation) ====================

  /**
   * Get all shipment charges with pagination and filtering
   * POST /api/v1/offline-product-shipment/{take}/{skip}
   * @param take Number of records to retrieve
   * @param skip Number of records to skip
   * @param query Filter criteria
   */
  getCharges(
    take: number,
    skip: number,
    query: OfflineProductShipmentQueryDto = {}
  ): Observable<OfflineProductShipmentChargeDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_ALL(take, skip)}`;
    return this.http.post<ApiResponse<OfflineProductShipmentChargeDto[]>>(url, query)
      .pipe(map(response => response.data));
  }

  /**
   * Get a single shipment charge by composite key
   * GET /api/v1/offline-product-shipment/{shipmentNo}/{orderNo}
   * @param shipmentNo Shipment number
   * @param orderNo Order number
   */
  getChargeById(shipmentNo: string, orderNo: string): Observable<OfflineProductShipmentChargeDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_BY_ID(shipmentNo, orderNo)}`;
    return this.http.get<ApiResponse<OfflineProductShipmentChargeDto[]>>(url)
      .pipe(map(response => response.data?.[0] ?? ({} as OfflineProductShipmentChargeDto)));
  }

  /**
   * Create a new shipment charge
   * POST /api/v1/offline-product-shipment
   * @param dto Charge creation data
   */
  createCharge(dto: CreateOfflineProductShipmentChargeDto): Observable<OfflineProductShipmentChargeDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.CREATE}`;
    return this.http.post<ApiResponse<OfflineProductShipmentChargeDto[]>>(url, dto)
      .pipe(map(response => response.data?.[0] ?? ({} as OfflineProductShipmentChargeDto)));
  }

  /**
   * Update an existing shipment charge
   * PUT /api/v1/offline-product-shipment/{shipmentNo}/{orderNo}
   * @param shipmentNo Shipment number
   * @param orderNo Order number
   * @param dto Charge update data
   */
  updateCharge(
    shipmentNo: string,
    orderNo: string,
    dto: UpdateOfflineProductShipmentChargeDto
  ): Observable<OfflineProductShipmentChargeDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.UPDATE(shipmentNo, orderNo)}`;
    return this.http.put<ApiResponse<OfflineProductShipmentChargeDto[]>>(url, dto)
      .pipe(map(response => response.data?.[0] ?? ({} as OfflineProductShipmentChargeDto)));
  }

  /**
   * Delete a shipment charge
   * DELETE /api/v1/offline-product-shipment/{shipmentNo}/{orderNo}
   * @param shipmentNo Shipment number
   * @param orderNo Order number
   */
  deleteCharge(shipmentNo: string, orderNo: string): Observable<boolean> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.DELETE(shipmentNo, orderNo)}`;
    return this.http.delete<ApiResponse<boolean>>(url)
      .pipe(map(response => response.data));
  }

  // ==================== TODO: PENDING BACKEND IMPLEMENTATION ====================

  /**
   * Get shipment header by shipment number
   * Endpoint: GET /api/v1/offline-product-shipment/header/{shipmentNo}
   * @param shipmentNo Shipment number
   */
  getShipmentHeader(shipmentNo: string): Observable<ShipmentHeaderDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_HEADER(shipmentNo)}`;
    return this.http.get<ApiResponse<ShipmentHeaderDto[]>>(url)
      .pipe(map(response => response.data?.[0] ?? ({} as ShipmentHeaderDto)));
  }

  /**
   * Create or update shipment header
   * Endpoint: POST /api/v1/offline-product-shipment/header
   * @param dto Shipment header data
   */
  saveShipmentHeader(dto: ShipmentHeaderDto): Observable<ShipmentHeaderDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.CREATE_HEADER}`;
    return this.http.post<ApiResponse<ShipmentHeaderDto[]>>(url, dto)
      .pipe(map(response => response.data?.[0] ?? ({} as ShipmentHeaderDto)));
  }

  /**
   * Get box list for a shipment
   * Endpoint: GET /api/v1/offline-product-shipment/{shipmentNo}/boxes
   * @param shipmentNo Shipment number
   */
  getBoxList(shipmentNo: string): Observable<BoxDataDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_BOXES(shipmentNo)}`;
    return this.http.get<ApiResponse<BoxDataDto[]>>(url)
      .pipe(map(response => response.data));
  }

  getAvailableBoxes(consigneeId: string): Observable<BoxDataDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_BOXES('available')}?consigneeId=${encodeURIComponent(consigneeId)}`;
    return this.http.get<ApiResponse<BoxDataDto[]>>(url)
      .pipe(map(response => response.data));
  }

  /**
   * Get products in a specific box
   * Endpoint: GET /api/v1/offline-product-shipment/box/{shipmentNo}/products
   * @param shipmentNo Shipment number (used as box identifier)
   */
  getProductsInBox(shipmentNo: string): Observable<ProductInBoxDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_PRODUCTS_IN_BOX(shipmentNo)}`;
    return this.http.get<ApiResponse<ProductInBoxDto[]>>(url)
      .pipe(map(response => response.data));
  }

  /**
   * Get consignees in the same zone as the selected consignee
   * Endpoint: GET /api/v1/offline-product-shipment/consignee/{consigneeId}/same-zone?zone={zone}
   * @param consigneeId Consignee identifier
   * @param zone Zone code
   */
  getConsigneesInSameZone(consigneeId: string, zone: string): Observable<ConsigneeInZoneDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_ZONE_CONSIGNEES(consigneeId, zone)}`;
    return this.http.get<ApiResponse<ConsigneeInZoneDto[]>>(url)
      .pipe(map(response => response.data));
  }

  /**
   * Complete box entry and mark shipment as complete
   * Endpoint: POST /api/v1/offline-product-shipment/{shipmentNo}/complete
   * @param shipmentNo Shipment number
   */
  completeBoxEntry(shipmentNo: string, dto?: CompleteBoxEntryRequestDto): Observable<CompleteBoxEntryResponseDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.COMPLETE_BOX_ENTRY(shipmentNo)}`;
    return this.http.post<ApiResponse<CompleteBoxEntryResponseDto[]>>(url, dto || {})
      .pipe(map(response => response.data?.[0] ?? ({} as CompleteBoxEntryResponseDto)));
  }

  /**
   * Get default charges for a shipment
   * Endpoint: GET /api/v1/offline-product-shipment/{shipmentNo}/default-charges
   * @param shipmentNo Shipment number
   */
  getDefaultCharges(shipmentNo: string): Observable<OfflineProductShipmentChargeDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.DEFAULT_CHARGES(shipmentNo)}`;
    return this.http.get<ApiResponse<OfflineProductShipmentChargeDto[]>>(url)
      .pipe(map(response => response.data));
  }

  // ==================== TODO: LOOKUP ENDPOINTS ====================

  /**
   * Search shipment numbers (autocomplete)
   * Endpoint: GET /api/v1/offline-product-shipment/lookup/shipments?search={term}
   * @param searchTerm Search term for autocomplete
   */
  searchShipmentNumbers(searchTerm: string = ''): Observable<ShipmentNumberLookupDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_SHIPMENTS}`;
    const params = searchTerm ? new HttpParams().set('search', searchTerm) : new HttpParams();
    return this.http.get<ApiResponse<ShipmentNumberLookupDto[]>>(url, { params })
      .pipe(map(response => response.data));
  }

  /**
   * Get all consignees for dropdown
   * Endpoint: GET /api/v1/offline-product-shipment/lookup/consignees
   */
  getConsignees(): Observable<ConsigneeLookupDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_CONSIGNEES}`;
    return this.http.get<ApiResponse<ConsigneeLookupDto[]>>(url)
      .pipe(map(response => response.data));
  }

  /**
   * Get consignee details by ID
   * Endpoint: GET /api/v1/offline-product-shipment/lookup/consignee/{consigneeId}
   * @param consigneeId Consignee identifier
   */
  getConsigneeById(consigneeId: string): Observable<ConsigneeDetailDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.GET_CONSIGNEE_DETAIL(consigneeId)}`;
    return this.http.get<ApiResponse<ConsigneeDetailDto[]>>(url)
      .pipe(map(response => response.data?.[0] ?? ({} as ConsigneeDetailDto)));
  }

  /**
   * Get all carriers for dropdown
   * Endpoint: GET /api/v1/offline-product-shipment/lookup/carriers
   */
  getCarriers(): Observable<CarrierLookupDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_CARRIERS}`;
    return this.http.get<ApiResponse<CarrierLookupDto[]>>(url)
      .pipe(map(response => response.data));
  }

  /**
   * Get all charge codes for dropdown
   * Endpoint: GET /api/v1/offline-product-shipment/lookup/charge-codes
   */
  getChargeCodes(): Observable<ChargeCodeLookupDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_CHARGE_CODES}`;
    return this.http.get<ApiResponse<ChargeCodeLookupDto[]>>(url)
      .pipe(map(response => response.data));
  }

  /**
   * Get all printers for dropdown
   * Endpoint: GET /api/v1/offline-product-shipment/lookup/printers
   */
  getPrinters(): Observable<PrinterLookupDto[]> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.LOOKUP_PRINTERS}`;
    return this.http.get<{ printerId: string; printerDescription: string }[]>(url)
      .pipe(map(data => (data || []).map(p => ({ code: p.printerId, codeDesc: p.printerDescription }))));
  }

  /**
   * Validate box data before saving
   * Endpoint: POST /api/v1/offline-product-shipment/box/validate
   * @param boxData Box validation data
   */
  validateBox(boxData: BoxValidateRequestDto): Observable<BoxValidationResultDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.VALIDATE_BOX}`;
    return this.http.post<ApiResponse<BoxValidationResultDto[]>>(url, boxData)
      .pipe(map(response => response.data?.[0] ?? ({} as BoxValidationResultDto)));
  }

  /**
   * Finalize shipment
   * Endpoint: POST /api/v1/offline-product-shipment/{shipmentNo}/finalize
   * @param shipmentNo Shipment number
   */
  finalizeShipment(shipmentNo: string): Observable<FinalizeShipmentResponseDto> {
    const url = `${environment.apiUrl}${API.OFFLINE_PRODUCT_SHIPMENT.FINALIZE_SHIPMENT(shipmentNo)}`;
    return this.http.post<ApiResponse<FinalizeShipmentResponseDto[]>>(url, {})
      .pipe(map(response => response.data?.[0] ?? ({} as FinalizeShipmentResponseDto)));
  }
}
