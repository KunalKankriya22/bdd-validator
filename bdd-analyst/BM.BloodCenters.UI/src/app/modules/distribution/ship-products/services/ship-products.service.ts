import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  ShipmentDto,
  CreateShipmentDto,
  UpdateShipmentDto,
  ShipmentQueryDto,
  BoxDto,
  BoxProductDto,
  ShipmentChargeDto,
  CreateShipmentChargeRequestDto,
  ChargeCodeLookup,
  ConsigneeInZoneDto,
  LovOption,
  PackedBoxLookupDto,
  ValidateBoxScanRequest,
  ValidateBoxScanResponse
} from '../models/ship-products.model';

@Injectable({
  providedIn: 'root'
})
export class ShipProductsService {
  private readonly apiService = inject(ApiService);

  getAllShipments(
    take: number, skip: number, query?: ShipmentQueryDto
  ): Observable<ApiResponse<ShipmentDto[]>> {
    return this.apiService.post<ApiResponse<ShipmentDto[]>>(
      API.SHIP_PRODUCTS.GET_ALL(take, skip), query || {}
    );
  }

  getShipmentByNumber(shipmentNo: string): Observable<ApiResponse<ShipmentDto[]>> {
    return this.apiService.get<ApiResponse<ShipmentDto[]>>(
      API.SHIP_PRODUCTS.GET_BY_NUMBER(shipmentNo)
    );
  }

  createShipment(shipment: CreateShipmentDto): Observable<ApiResponse<{ shipmentNo: string }[]>> {
    return this.apiService.post<ApiResponse<{ shipmentNo: string }[]>>(
      API.SHIP_PRODUCTS.CREATE, shipment
    );
  }

  updateShipment(shipmentNo: string, shipment: UpdateShipmentDto): Observable<ApiResponse<void>> {
    return this.apiService.put<ApiResponse<void>>(
      API.SHIP_PRODUCTS.UPDATE(shipmentNo), shipment
    );
  }

  getShipmentNumberOptions(): Observable<LovOption[]> {
    return this.getAllShipments(500, 0, { shipmentStatus: 'OP', shipmentType: 'RE', sortColumn: 'ShipmentDate', sortOrder: 'DESC' })
      .pipe(
        map(response => (response.data || []).map(shipment => ({
          value: shipment.shipmentNo,
          label: shipment.shipmentNo,
          description: [
            shipment.consigneeName,
            shipment.shipmentDate ? moment.utc(shipment.shipmentDate).format('MM/DD/YY') : null
          ].filter(Boolean).join(' - ') || undefined
        })))
      );
  }

  getConsigneeOptions(): Observable<LovOption[]> {
    return this.apiService.get<ApiResponse<{ consigneeId: string; name: string; address1: string; city: string; state: string; country: string }[]>>(
      API.SHIP_PRODUCTS.CONSIGNEE_LOV
    ).pipe(
      map(response => (response.data || []).map(c => ({
        value: c.consigneeId,
        label: c.consigneeId,
        description: c.name || undefined
      })))
    );
  }

  getCarrierOptions(): Observable<LovOption[]> {
    return this.apiService.get<ApiResponse<{ code: string; description: string }[]>>(
      API.SHIP_PRODUCTS.CARRIER_LOV
    ).pipe(
      map(response => (response.data || []).map(c => ({
        value: c.code,
        label: c.code,
        description: c.description || undefined
      })))
    );
  }

  getShipmentBoxes(shipmentNo: string): Observable<BoxDto[]> {
    return this.apiService.get<ApiResponse<BoxDto[]>>(
      API.SHIP_PRODUCTS.GET_BOXES(shipmentNo)
    ).pipe(
      map(response => response.data || [])
    );
  }

  addBoxToShipment(shipmentNo: string, boxId: string): Observable<ApiResponse<void>> {
    return this.apiService.post<ApiResponse<void>>(
      API.SHIP_PRODUCTS.ADD_BOX(shipmentNo, boxId), {}
    );
  }

  removeBoxFromShipment(shipmentNo: string, boxId: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      API.SHIP_PRODUCTS.REMOVE_BOX(shipmentNo, boxId)
    );
  }

  getBoxProductsForShipment(shipmentNo: string): Observable<BoxProductDto[]> {
    return this.apiService.get<ApiResponse<BoxProductDto[]>>(
      API.SHIP_PRODUCTS.GET_BOX_PRODUCTS(shipmentNo)
    ).pipe(
      map(response => response.data || [])
    );
  }

  completeShipment(shipmentNo: string): Observable<ApiResponse<void>> {
    return this.apiService.post<ApiResponse<void>>(
      API.SHIP_PRODUCTS.COMPLETE(shipmentNo), {}
    );
  }

  getShipmentCharges(shipmentNo: string): Observable<ShipmentChargeDto[]> {
    return this.apiService.get<ApiResponse<ShipmentChargeDto[]>>(
      API.SHIP_PRODUCTS.GET_CHARGES(shipmentNo)
    ).pipe(
      map(response => response.data || [])
    );
  }

  addShipmentCharge(shipmentNo: string, charge: CreateShipmentChargeRequestDto): Observable<ApiResponse<void>> {
    return this.apiService.post<ApiResponse<void>>(
      API.SHIP_PRODUCTS.ADD_CHARGE(shipmentNo), charge
    );
  }

  deleteShipmentCharge(shipmentNo: string, chargeCode: string, orderNo: string): Observable<ApiResponse<void>> {
    return this.apiService.delete<ApiResponse<void>>(
      API.SHIP_PRODUCTS.DELETE_CHARGE(shipmentNo, chargeCode, orderNo)
    );
  }

  getChargeCodes(): Observable<ChargeCodeLookup[]> {
    return this.apiService.get<ApiResponse<ChargeCodeLookup[]>>(
      API.SHIP_PRODUCTS.CHARGE_CODES_LOV
    ).pipe(
      map(response => response.data || [])
    );
  }

  getConsigneesInSameZone(consigneeId: string): Observable<ConsigneeInZoneDto[]> {
    return this.apiService.get<ApiResponse<ConsigneeInZoneDto[]>>(
      API.SHIP_PRODUCTS.GET_CONSIGNEES_IN_ZONE(consigneeId)
    ).pipe(
      map(response => response.data || [])
    );
  }

  getPackedBoxesForConsignee(consigneeId: string): Observable<PackedBoxLookupDto[]> {
    return this.apiService.get<ApiResponse<PackedBoxLookupDto[]>>(
      API.SHIP_PRODUCTS.PACKED_BOXES_LOV(consigneeId)
    ).pipe(
      map(response => response.data || [])
    );
  }

  printPackList(shipmentNo: string, printerId: string): Observable<ApiResponse<void>> {
    return this.apiService.post<ApiResponse<void>>(
      API.SHIP_PRODUCTS.PRINT_PACKLIST(shipmentNo), { printerId }
    );
  }

  validateBarcodeScan(barcode: string): Observable<ApiResponse<ValidateBoxScanResponse[]>> {
    return this.apiService.post<ApiResponse<ValidateBoxScanResponse[]>>(
      API.SHIP_PRODUCTS.VALIDATE_BARCODE, { barcode }
    );
  }

  getPackListPrinterOptions(): Observable<LovOption[]> {
    return this.apiService.get<{ printerId: string; printerDescription: string }[]>(
      API.SHIP_PRODUCTS.PRINTER_LOV
    ).pipe(
      map(data => (data || []).map(p => ({
        value: p.printerId,
        label: p.printerId,
        description: p.printerDescription
      })))
    );
  }
}
