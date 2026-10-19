import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DonorDecisionCodeModel,
  DonorDecisionCodeParamsDto,
  DonorDecisionCodePanelState,
  DonorDecisionCodeDto,
  UpdateDonorDecisionCodeDto,
  DonorDecisionCodeOption,
  BarcodeOption
} from '../models/donor-decision-codes.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class DonorDecisionCodesService {
  private readonly apiService = inject(ApiService);

  private panelStateSubject = new BehaviorSubject<DonorDecisionCodePanelState>({
    isOpen: false,
    mode: 'add'
  });

  panelState$ = this.panelStateSubject.asObservable();

  /**
   * Get Donor Decision Codes table data with pagination
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters (includes Barcode, DonorDecisionCode, EffectiveDate, TerminationDate, SearchKeyword, Sort)
   * @returns Observable with table data and total count
   */
  getDonorDecisionCodes(
    take: number,
    skip: number,
    params: DonorDecisionCodeParamsDto
  ): Observable<{ data: DonorDecisionCodeModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DONOR_DECISION_CODES(take, skip);

    return this.apiService.post<ReturnResult<DonorDecisionCodeModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching donor decision codes data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct barcodes for dropdown filter
   * @returns Observable with barcode options
   */
  getBarcodes(): Observable<string[]> {
    const endpoint = API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODES_BARCODES;

    return this.apiService.get<ReturnResult<BarcodeOption>>(endpoint).pipe(
      map(response => {
        const barcodes = response.data || [];
        return barcodes.map((item: BarcodeOption) => item.barCodeValue);
      }),
      catchError(error => {
        console.error('Error fetching barcodes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get distinct donor decision codes for dropdown
   * @returns Observable with donor decision code options
   */
  getDonorDecisionCodeOptions(): Observable<DonorDecisionCodeOption[]> {
    const endpoint = API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODES_DISTINCT;

    return this.apiService.get<ReturnResult<DonorDecisionCodeOption>>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Error fetching donor decision codes:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get donor decision code description by code
   * @param code - The donor decision code
   * @returns Observable with code description
   */
  getDonorDecisionCodeByCode(code: string): Observable<{ donorDecisionCode: string; description: string }> {
    const endpoint = API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODE_DESCRIPTION(code);

    return this.apiService.get<ReturnResult<{ donorDecisionCode: string; description: string }>>(endpoint).pipe(
      map(response => {
        if (response.item) {
          return response.item;
        }
        throw new Error('Description not found');
      }),
      catchError(error => {
        console.error('Error fetching donor decision code description:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get Donor Decision Code by Barcode (for edit modal)
   * @param barCodeValue - Barcode value
   * @returns Observable with donor decision code details
   */
  getDonorDecisionCodeByBarcode(barCodeValue: string): Observable<DonorDecisionCodeModel> {
    const endpoint = API.APPLICATION_ADMIN.GET_DONOR_DECISION_CODE_BY_BARCODE(barCodeValue);

    return this.apiService.get<ReturnResult<DonorDecisionCodeModel>>(endpoint).pipe(
      map(response => {
        if (response.item) {
          return response.item;
        }
        throw new Error('Donor decision code record not found');
      }),
      catchError(error => {
        console.error('Error fetching donor decision code by barcode:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Donor Decision Code
   * @param dto - Donor decision code data
   * @returns Observable with result
   */
  addDonorDecisionCode(dto: DonorDecisionCodeDto): Observable<ReturnResult<DonorDecisionCodeModel>> {
    const endpoint = API.APPLICATION_ADMIN.CREATE_DONOR_DECISION_CODE;

    return this.apiService.post<ReturnResult<DonorDecisionCodeModel>>(endpoint, dto).pipe(
      catchError(error => {
        console.error('Error adding donor decision code:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Donor Decision Code
   * @param barCodeValue - Barcode value (sent as URL parameter)
   * @param dto - Update donor decision code data (includes originalDonorDecisionCode)
   * @returns Observable with result
   */
  updateDonorDecisionCode(
    barCodeValue: string,
    dto: UpdateDonorDecisionCodeDto
  ): Observable<ReturnResult<DonorDecisionCodeModel>> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_DONOR_DECISION_CODE(barCodeValue);

    return this.apiService.put<ReturnResult<DonorDecisionCodeModel>>(endpoint, dto).pipe(
      catchError(error => {
        console.error('Error updating donor decision code:', error);
        return throwError(() => error);
      })
    );
  }
}
