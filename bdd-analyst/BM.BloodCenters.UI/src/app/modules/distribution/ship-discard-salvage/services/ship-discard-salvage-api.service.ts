import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ShipDiscardSalvageShipmentDto,
  BoxDto,
  CreateShipDiscardSalvageShipmentRequestDto,
  AddBoxToShipmentRequestDto,
  ApiResponse,
  ShipDiscardSalvageShipment,
  ShipDiscardSalvageBox,
  CarrierLookup,
  ConsigneeLookup,
  ShipmentCharge,
  ChargeCodeLookup,
  CreditDebitType,
  CreateShipmentChargeRequestDto,
  ShippedBoxProduct,
  ConsigneeInSameZone,
} from '../models/ship-discard-salvage.model';

@Injectable({
  providedIn: 'root',
})
export class ShipDiscardSalvageApiService {
  private apiService = inject(ApiService);

  /**
   * Transform shipment DTO from API to frontend model
   */
  private transformShipmentDto(dto: ShipDiscardSalvageShipmentDto): ShipDiscardSalvageShipment {
    // Build full address string
    const addressParts = [
      dto.address1,
      dto.address2,
      dto.city,
      dto.state,
      dto.zip,
    ].filter(part => part && part.trim() !== '');

    const fullAddress = addressParts.join(', ');

    return {
      shipmentNo: dto.shipmentNo,
      chapterId: dto.chapterId,
      consigneeId: dto.consigneeId,
      consigneeName: dto.consigneeName,
      address1: dto.address1 || '',
      address2: dto.address2 || '',
      city: dto.city || '',
      state: dto.state || '',
      zip: dto.zip || '',
      country: dto.country || '',
      shipmentDate: new Date(dto.shipmentDate),
      shipmentStatus: dto.shipmentStatus as 'OP' | 'CL',
      carrier: dto.carrier || '',
      carrierDescription: dto.carrierDescription || '',
      trackingNo: dto.trackingNo || '',
      flightNo: dto.flightNo || '',
      boxCount: dto.boxCount,
      invoicePrintedDate: dto.invoicePrintedDate ? new Date(dto.invoicePrintedDate) : null,
      fullAddress,
    };
  }

  /**
   * Transform box DTO from API to frontend model
   */
  private transformBoxDto(dto: BoxDto): ShipDiscardSalvageBox {
    return {
      boxId: dto.boxId,
      boxStatus: dto.boxStatus,
      boxType: dto.boxType || '',
      boxTypeDescription: dto.boxTypeDescription || '',
      packedByUserId: dto.packedByUserId || '',
      packedByUserName: dto.packedByUserName || '',
      packedDate: dto.packedDate ? new Date(dto.packedDate) : null,
    };
  }

  /**
   * GET /api/ship-discard-salvage/shipments
   * Retrieve all open discard/salvage shipments for the current chapter
   *
   * @returns Observable of shipments array
   */
  getOpenShipments(): Observable<ShipDiscardSalvageShipment[]> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENTS;

    return this.apiService.get<ApiResponse<ShipDiscardSalvageShipmentDto>>(endpoint).pipe(
      map((response) => {
        const shipments = (response.data || []).map(dto => this.transformShipmentDto(dto));
        return shipments;
      }),
      catchError((error) => {
        console.error('Error fetching open shipments:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/shipments/{shipmentNo}
   * Retrieve details of a specific shipment
   *
   * @param shipmentNo - Shipment number (14 characters)
   * @returns Observable of shipment
   */
  getShipmentById(shipmentNo: string): Observable<ShipDiscardSalvageShipment | null> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_BY_ID(shipmentNo);

    return this.apiService.get<ApiResponse<ShipDiscardSalvageShipmentDto>>(endpoint).pipe(
      map((response) => {
        if (response.data && response.data.length > 0) {
          return this.transformShipmentDto(response.data[0]);
        }
        return null;
      }),
      catchError((error) => {
        console.error('Error fetching shipment by ID:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/ship-discard-salvage/shipments
   * Create a new discard/salvage shipment
   *
   * Business Rules:
   * - Consignee must have at least one closed box available (Error 4309)
   * - Carrier must be active on current date (Error 4307)
   * - Shipment type automatically set to 'DI' (discard)
   * - Shipment status automatically set to 'OP' (open)
   *
   * @param request - Create shipment request
   * @returns Observable of created shipment
   */
  createShipment(
    request: CreateShipDiscardSalvageShipmentRequestDto
  ): Observable<ShipDiscardSalvageShipment> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.CREATE_SHIPMENT;

    return this.apiService.post<ApiResponse<ShipDiscardSalvageShipmentDto>>(endpoint, request).pipe(
      map((response) => {
        if (response.data && response.data.length > 0) {
          return this.transformShipmentDto(response.data[0]);
        }
        throw new Error('No shipment data returned from create operation');
      }),
      catchError((error) => {
        console.error('Error creating shipment:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/ship-discard-salvage/shipments/{shipmentNo}/boxes
   * Add a box to an existing shipment
   *
   * Business Rules:
   * - Shipment must exist and be type 'DI' (Error 4306)
   * - Shipment must be open (status 'OP') and not invoiced (Error 4003)
   * - Box must exist in warehouse (Error 0334)
   * - Box must belong to shipment's consignee (Error 4004)
   * - Box must be closed (status 'CL') (Error 4013)
   * - Products in box updated from 'PK' (Packed) to 'SH' (Shipped) automatically
   *
   * @param shipmentNo - Shipment number
   * @param request - Add box request
   * @returns Observable of added box
   */
  addBoxToShipment(
    shipmentNo: string,
    request: AddBoxToShipmentRequestDto
  ): Observable<ShipDiscardSalvageBox> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_BOX_TO_SHIPMENT(shipmentNo);

    return this.apiService.post<ApiResponse<BoxDto>>(endpoint, request).pipe(
      map((response) => {
        if (response.data && response.data.length > 0) {
          return this.transformBoxDto(response.data[0]);
        }
        throw new Error('No box data returned from add operation');
      }),
      catchError((error) => {
        console.error('Error adding box to shipment:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/consignees/{consigneeId}/boxes
   * Retrieve available boxes for a specific consignee
   *
   * @param consigneeId - Consignee/discard destination ID
   * @returns Observable of boxes array
   */
  getBoxesForConsignee(consigneeId: string): Observable<ShipDiscardSalvageBox[]> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_BOXES_FOR_CONSIGNEE(consigneeId);

    return this.apiService.get<ApiResponse<BoxDto>>(endpoint).pipe(
      map((response) => {
        const boxes = (response.data || []).map(dto => this.transformBoxDto(dto));
        return boxes;
      }),
      catchError((error) => {
        console.error('Error fetching boxes for consignee:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/ship-discard-salvage/shipments/{shipmentNo}/finalize
   * Complete shipment (finalize box entry)
   * Closes the shipment and updates status from 'OP' to 'CL'
   *
   * @param shipmentNo - Shipment number to complete
   * @returns Observable of success response
   */
  completeShipment(shipmentNo: string): Observable<any> {
    const endpoint = `${API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.BASE}/shipments/${encodeURIComponent(shipmentNo)}/finalize`;

    return this.apiService.post<any>(endpoint, {}).pipe(
      catchError((error) => {
        console.error('Error finalizing shipment:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * DELETE /api/ship-discard-salvage/shipments/{shipmentNo}/boxes/{boxId}
   * Remove a box from a shipment
   */
  removeBoxFromShipment(shipmentNo: string, boxId: string): Observable<any> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.REMOVE_BOX(shipmentNo, boxId);

    return this.apiService.delete<any>(endpoint).pipe(
      catchError((error) => {
        console.error('Error removing box from shipment:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/shipments/{shipmentNo}/products
   * Retrieve products in a shipment (grouped by box)
   */
  getShipmentProducts(shipmentNo: string): Observable<ShippedBoxProduct[]> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_PRODUCTS(shipmentNo);

    return this.apiService.get<ApiResponse<ShippedBoxProduct>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching shipment products:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/consignees/{consigneeId}/zone-peers
   * Retrieve consignees in the same zone
   */
  getZoneConsignees(consigneeId: string): Observable<ConsigneeInSameZone[]> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_ZONE_CONSIGNEES(consigneeId);

    return this.apiService.get<ApiResponse<ConsigneeInSameZone>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching zone consignees:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/shipments/{shipmentNo}/charges
   * Retrieve charges for a shipment
   */
  getShipmentCharges(shipmentNo: string): Observable<ShipmentCharge[]> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_SHIPMENT_CHARGES(shipmentNo);

    return this.apiService.get<ApiResponse<ShipmentCharge>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching shipment charges:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * POST /api/ship-discard-salvage/shipments/{shipmentNo}/charges
   * Add a charge to a shipment
   */
  addShipmentCharge(shipmentNo: string, request: CreateShipmentChargeRequestDto): Observable<ShipmentCharge[]> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.ADD_SHIPMENT_CHARGE(shipmentNo);

    return this.apiService.post<ApiResponse<ShipmentCharge>>(endpoint, request).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error adding shipment charge:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * DELETE /api/ship-discard-salvage/shipments/{shipmentNo}/charges/{chargeCode}/{orderNo}
   * Remove a charge from a shipment
   */
  deleteShipmentCharge(shipmentNo: string, chargeCode: string, orderNo: string): Observable<any> {
    const endpoint = API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.DELETE_SHIPMENT_CHARGE(shipmentNo, chargeCode, orderNo);

    return this.apiService.delete<any>(endpoint).pipe(
      catchError(error => {
        console.error('Error deleting shipment charge:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/charge-codes
   * Retrieve available charge codes (from vserv_charge_codes with ship_flag)
   */
  getChargeCodes(): Observable<ChargeCodeLookup[]> {
    return this.apiService.get<ApiResponse<ChargeCodeLookup>>(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CHARGE_CODES).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching charge codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/credit-debit-types
   * Retrieve credit/debit types (from vserv_master code_type='CRDBI')
   */
  getCreditDebitTypes(): Observable<CreditDebitType[]> {
    return this.apiService.get<ApiResponse<CreditDebitType>>(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CREDIT_DEBIT_TYPES).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching credit/debit types:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/carriers
   * Retrieve all active carriers
   *
   * @returns Observable of carriers array
   */
  getActiveCarriers(): Observable<CarrierLookup[]> {
    return this.apiService.get<ApiResponse<any>>(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CARRIERS).pipe(
      map(response => (response.data || []).map((d: any) => ({
        carrierCode: d.carrierCode || d.CarrierCode,
        carrierName: d.carrierName || d.CarrierName,
        description: `${d.carrierCode || d.CarrierCode} - ${d.carrierName || d.CarrierName}`,
        isActive: true,
      }))),
      catchError(error => {
        console.error('Error fetching carriers:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * GET /api/ship-discard-salvage/consignees
   * Retrieve all consignees with boxes
   *
   * @returns Observable of consignees array
   */
  getConsigneesWithBoxes(): Observable<ConsigneeLookup[]> {
    return this.apiService.get<ApiResponse<any>>(API.DISTRIBUTION.SHIP_DISCARD_SALVAGE.GET_CONSIGNEES).pipe(
      map(response => (response.data || []).map((d: any) => ({
        consigneeId: d.consigneeId || d.ConsigneeId,
        consigneeName: d.consigneeName || d.ConsigneeName,
        description: `${d.consigneeId || d.ConsigneeId} - ${d.consigneeName || d.ConsigneeName}`,
        address1: d.address1 || d.Address1 || '',
        state: d.state || d.State || '',
        country: d.country || d.Country || '',
      }))),
      catchError(error => {
        console.error('Error fetching consignees:', error);
        return throwError(() => error);
      })
    );
  }
}
