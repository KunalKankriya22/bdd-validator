import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

import {
  ApiResponse,
  PendingShipment,
  RegeneratePlasmaFileShipmentDto,
  RegeneratePlasmaFileRequestDto,
  RegeneratePlasmaFileResponseDto,
  PlasmaFileCarrierDto,
} from '../models/regenerate-electronic-plasma-file.model';

/**
 * Service for Regenerate Electronic Plasma File API operations
 * Base URL: /api/plasma-file-regeneration
 * JIRA: MLT-14005
 */
@Injectable({
  providedIn: 'root',
})
export class RegenerateElectronicPlasmaFileService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/plasma-file-regeneration`;

  /**
   * Get list of pending shipments eligible for plasma file regeneration
   * Endpoint: GET /plasma-file-regeneration/pending-shipments
   * Returns shipments with status 'P' (Pending) within current chapter
   */
  getPendingShipments(): Observable<PendingShipment[]> {
    return this.http
      .get<ApiResponse<PendingShipment[]>>(`${this.baseUrl}/pending-shipments`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Get detailed information for a specific shipment
   * Endpoint: GET /plasma-file-regeneration/shipment/{shipmentNo}
   *
   * @param shipmentNo - Shipment number (max 12 characters)
   * @returns Shipment details including consignee address, carrier info, and plasma file type
   */
  getShipmentDetails(shipmentNo: string): Observable<RegeneratePlasmaFileShipmentDto> {
    return this.http
      .get<ApiResponse<RegeneratePlasmaFileShipmentDto>>(
        `${this.baseUrl}/shipment/${encodeURIComponent(shipmentNo)}`
      )
      .pipe(map((response) => response.data));
  }

  /**
   * Get list of active carriers
   * Endpoint: GET /plasma-file-regeneration/carriers
   * Returns carriers with active effective dates
   */
  getActiveCarriers(): Observable<PlasmaFileCarrierDto[]> {
    return this.http
      .get<ApiResponse<PlasmaFileCarrierDto[]>>(`${this.baseUrl}/carriers`)
      .pipe(map((response) => response.data || []));
  }

  /**
   * Regenerate electronic plasma file (EDN) for a specific shipment
   * Endpoint: POST /plasma-file-regeneration/regenerate
   * Generates file in XML or CSL format based on customer configuration
   *
   * @param request - Regeneration request with shipment details
   * @returns Regeneration result with file information
   */
  regeneratePlasmaFile(
    request: RegeneratePlasmaFileRequestDto
  ): Observable<RegeneratePlasmaFileResponseDto> {
    return this.http.post<RegeneratePlasmaFileResponseDto>(
      `${this.baseUrl}/regenerate`,
      request
    );
  }
}
