import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  DeliveredShipmentDto,
  DeliveredShipmentQueryDto,
  ApiResponse,
  ShipmentNumberOption,
  BoxIdOption,
} from '../models/delivered-shipments.model';

/**
 * Service for Delivered Shipments API operations
 * API Base URL: /api/delivered-shipments
 * Documentation: MLT-14099
 */
@Injectable({
  providedIn: 'root',
})
export class DeliveredShipmentsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/delivered-shipments`;

  /**
   * Get a single delivered shipment by shipment number
   * Endpoint: GET /delivered-shipments/{shipmentNo}
   *
   * @param shipmentNo Shipment number (max 14 chars)
   * @param boxId Optional box ID filter (max 10 chars)
   * @returns Observable of shipment data
   */
  getShipmentByNumber(
    shipmentNo: string,
    boxId?: string
  ): Observable<DeliveredShipmentDto | null> {
    let params = new HttpParams();
    if (boxId) {
      params = params.set('boxId', boxId);
    }

    return this.http
      .get<ApiResponse<DeliveredShipmentDto[]>>(`${this.baseUrl}/${encodeURIComponent(shipmentNo)}`, {
        params,
      })
      .pipe(
        map((response) => {
          if (response.success && response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        })
      );
  }

  /**
   * Search delivered shipments with advanced filtering
   * Endpoint: POST /delivered-shipments/{take}/{skip}
   *
   * @param query Search criteria
   * @param take Number of records to return
   * @param skip Number of records to skip
   * @returns Observable of shipment list with total count
   */
  searchShipments(
    query: DeliveredShipmentQueryDto,
    take: number = 10,
    skip: number = 0
  ): Observable<{ data: DeliveredShipmentDto[]; total: number }> {
    return this.http
      .post<ApiResponse<DeliveredShipmentDto[]>>(`${this.baseUrl}/${take}/${skip}`, query)
      .pipe(
        map((response) => ({
          data: response.data || [],
          total: response.total || 0,
        }))
      );
  }

  /**
   * Get delivered shipments with simple query parameters
   * Endpoint: GET /delivered-shipments
   *
   * @param params Query parameters
   * @returns Observable of shipment list with total count
   */
  getAllShipments(
    params: DeliveredShipmentQueryDto & { take?: number; skip?: number } = {}
  ): Observable<{ data: DeliveredShipmentDto[]; total: number }> {
    let httpParams = new HttpParams();

    if (params.shipmentNo) {
      httpParams = httpParams.set('shipmentNo', params.shipmentNo);
    }
    if (params.boxId) {
      httpParams = httpParams.set('boxId', params.boxId);
    }
    if (params.consigneeId) {
      httpParams = httpParams.set('consigneeId', params.consigneeId);
    }
    if (params.fromDate) {
      httpParams = httpParams.set('fromDate', params.fromDate);
    }
    if (params.toDate) {
      httpParams = httpParams.set('toDate', params.toDate);
    }
    if (params.take !== undefined) {
      httpParams = httpParams.set('take', params.take.toString());
    }
    if (params.skip !== undefined) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }

    return this.http.get<ApiResponse<DeliveredShipmentDto[]>>(this.baseUrl, { params: httpParams }).pipe(
      map((response) => ({
        data: response.data || [],
        total: response.total || 0,
      }))
    );
  }

  /**
   * Get available shipment numbers for dropdown
   * Uses GET /delivered-shipments with minimal data
   *
   * @returns Observable of shipment number options
   */
  getShipmentNumbers(): Observable<ShipmentNumberOption[]> {
    const params = new HttpParams().set('take', '1000').set('skip', '0');

    return this.http.get<ApiResponse<DeliveredShipmentDto[]>>(this.baseUrl, { params }).pipe(
      map((response) => {
        if (response.success && response.data) {
          return response.data.map((shipment) => ({
            shipmentNo: shipment.shipmentNo,
            receiptDate: shipment.receiptDate,
            consigneeName: shipment.consigneeName || null,
          }));
        }
        return [];
      })
    );
  }

  /**
   * Get shipment header only (no products)
   * Endpoint: GET /delivered-shipments/{shipmentNo}/header
   */
  getShipmentHeader(shipmentNo: string): Observable<DeliveredShipmentDto | null> {
    return this.http
      .get<ApiResponse<DeliveredShipmentDto[]>>(
        `${this.baseUrl}/${encodeURIComponent(shipmentNo)}/header`
      )
      .pipe(
        map((response) => {
          if (response.success && response.data && response.data.length > 0) {
            return response.data[0];
          }
          return null;
        })
      );
  }

  /**
   * Get box IDs for a specific shipment
   * Endpoint: GET /delivered-shipments/{shipmentNo}/boxes
   */
  getBoxIdsByShipment(shipmentNo: string): Observable<BoxIdOption[]> {
    return this.http
      .get<ApiResponse<string[]>>(
        `${this.baseUrl}/${encodeURIComponent(shipmentNo)}/boxes`
      )
      .pipe(
        map((response) => {
          if (response.success && response.data) {
            return response.data.map((boxId) => ({ boxId }));
          }
          return [];
        })
      );
  }
}
