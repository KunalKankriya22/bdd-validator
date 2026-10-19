import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';
import {
  BatchOption,
  GetBatchesResponse,
  ShipperOption,
  GetShippersResponse,
  DriveOption,
  GetDrivesResponse,
  GetUnitsParams,
  RetrievedUnit,
  GetUnitsResponse,
  ValidateUnitRequest,
  ValidateUnitResponse,
  ValidateTransferResponse,
  DonationDetails,
  GetDonationDetailsResponse,
  TransferRequest,
  TransferResponse,
  ValidateHeaderRequest,
  ValidateHeaderResponse,
} from '../models/transfer-donor-data-to-lab.model';

@Injectable({ providedIn: 'root' })
export class TransferDonorDataToLabApiService {
  private readonly apiService = inject(ApiService);

  // Step 1 — Page Load: populate Batch ID dropdown
  getBatches(): Observable<BatchOption[]> {
    return this.apiService
      .get<GetBatchesResponse>(API.TRANSFER_DONOR_TO_LAB.GET_BATCHES)
      .pipe(map(res => res.data ?? []));
  }

  // Drives dropdown — loaded when user selects a Collection Date
  getDrives(collectionDate: string): Observable<DriveOption[]> {
    return this.apiService
      .get<GetDrivesResponse>(API.TRANSFER_DONOR_TO_LAB.GET_DRIVES(collectionDate))
      .pipe(map(res => res.data ?? []));
  }

  // Shippers dropdown — loaded when Drive ID is selected
  getShippers(driveId: string, checkinType: string): Observable<ShipperOption[]> {
    return this.apiService
      .get<GetShippersResponse>(API.TRANSFER_DONOR_TO_LAB.GET_SHIPPERS(driveId, checkinType))
      .pipe(map(res => res.data ?? []));
  }

  // Step 4 — RETRIEVE: get list of eligible units
  getUnits(params: GetUnitsParams): Observable<GetUnitsResponse> {
    return this.apiService
      .get<GetUnitsResponse>(API.TRANSFER_DONOR_TO_LAB.GET_UNITS(params));
  }

  // Pre-RETRIEVE — validate header fields (drive, site, batch, shipper, date age)
  validateHeader(request: ValidateHeaderRequest): Observable<ValidateHeaderResponse> {
    return this.apiService
      .post<ValidateHeaderResponse>(API.TRANSFER_DONOR_TO_LAB.VALIDATE_HEADER, request, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true)
      });
  }

  // Step 5 — validate unit before transfer
  validateUnit(request: ValidateUnitRequest): Observable<ValidateUnitResponse> {
    return this.apiService
      .post<ValidateUnitResponse>(API.TRANSFER_DONOR_TO_LAB.VALIDATE_UNIT, request);
  }

  // Step 5b — run ALL per-unit validations before transfer
  validateTransfer(request: TransferRequest): Observable<ValidateTransferResponse> {
    return this.apiService
      .post<ValidateTransferResponse>(API.TRANSFER_DONOR_TO_LAB.VALIDATE_TRANSFER, request, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true)
      });
  }

  // Step 6 — load donation details for the selected unit
  getDonationDetails(unitId: string, collectionDate: string): Observable<DonationDetails | null> {
    return this.apiService
      .get<GetDonationDetailsResponse>(
        API.TRANSFER_DONOR_TO_LAB.GET_DONATION_DETAILS(unitId, collectionDate)
      )
      .pipe(map(res => {
        const detail = res.data?.[0] ?? null;
        if (!detail) return null;
        return { ...detail, attributes: detail.attributes ?? [] };
      }));
  }

  // Step 7 — execute the transfer
  transfer(request: TransferRequest): Observable<TransferResponse> {
    return this.apiService
      .post<TransferResponse>(API.TRANSFER_DONOR_TO_LAB.TRANSFER, request, {
        context: new HttpContext().set(SKIP_ERROR_TOAST, true)
      });
  }
}
