import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '@core/constants/http-context.constants';

export interface UnitAboScanResult {
  isValid: boolean;
  parsedUnitId: string | null;
  checkDigit: string | null;
  manualUnitId: string | null;
  aboCode: string | null;
  aboLabel: string | null;
  aboDescription: string | null;
  codeScheme: string | null;
  entryMode: string | null;
  barcodeType: string | null;
}

export interface AboScanResult {
  isValid: boolean;
  aboCode: string | null;
  aboLabel: string | null;
  aboShortName: string | null;
  entryMode: string | null;
}

export interface ProductExpdateScanResult {
  isValid: boolean;
  productCode: string | null;
  productDescription: string | null;
  expiryDate: string | null;
  expiryHasTime: boolean;
  entryMode: string | null;
}

export interface ProductScanResult {
  isValid: boolean;
  productCode: string | null;
  productDescription: string | null;
  entryMode: string | null;
}

export interface ExpdateScanResult {
  isValid: boolean;
  expiryDate: string | null;
  hasTime: boolean;
  entryMode: string | null;
}

export interface ExpiryScanResult {
  isValid: boolean;
  expiryDate: string | null;
  expiryDisplay: string | null;
  hasTime: boolean;
  entryMode: string | null;
}

export interface ProductExpiryScanResult {
  isValid: boolean;
  productCode: string | null;
  productDescription: string | null;
  expiryDate: string | null;
  expiryDisplay: string | null;
  hasTime: boolean;
  entryMode: string | null;
}

export interface SpTestScanResult {
  isValid: boolean;
  spTestCode: string | null;
  description: string | null;
  entryMode: string | null;
}

export interface UnitValidationResult {
  isValid: boolean;
  parsedUnitId: string | null;
  checkDigit: string | null;
  manualUnitId: string | null;
  codeScheme: string | null;
}

export interface CatalogScanResult {
  isValid: boolean;
  catalogNumber: string | null;
  lotScanPortion: string | null;
  autoPopulatedLot: string | null;
  entryMode: string | null;
}

export interface LotScanResult {
  isValid: boolean;
  lotNumber: string | null;
  entryMode: string | null;
}

export interface LabelScanApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode: string | null;
  item: T | null;
  errorResponse: {
    errorCode: string;
    error: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class DonorLibLabelScanService {
  private readonly apiService = inject(ApiService);
  private readonly skipToastContext = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

  private handleError<T>(err: any): Observable<LabelScanApiResponse<T>> {
    const errorBody = err?.error;
    return of({
      success: false,
      message: errorBody?.message || errorBody?.error || err?.message || 'Validation failed',
      statusCode: err?.status || 500,
      errorCode: errorBody?.errorCode || errorBody?.errorResponse?.errorCode || null,
      item: null,
      errorResponse: errorBody?.errorResponse || { errorCode: '', error: errorBody?.message || 'Validation failed' },
    });
  }

  validateUnitScan(unitId: string): Observable<LabelScanApiResponse<UnitValidationResult>> {
    return this.apiService.post<LabelScanApiResponse<UnitValidationResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT,
      { unitId, validateFfValue: 'N' },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<UnitValidationResult>(err)));
  }

  validateUnitAboScan(scan: string, codeScheme?: string): Observable<LabelScanApiResponse<UnitAboScanResult>> {
    return this.apiService.post<LabelScanApiResponse<UnitAboScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_UNIT_ABO_SCAN,
      { scan, codeScheme },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<UnitAboScanResult>(err)));
  }

  validateAboScan(scan: string, codeScheme?: string): Observable<LabelScanApiResponse<AboScanResult>> {
    return this.apiService.post<LabelScanApiResponse<AboScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_ABO_SCAN,
      { scan, codeScheme },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<AboScanResult>(err)));
  }

  validateProductExpdateScan(scan: string): Observable<LabelScanApiResponse<ProductExpdateScanResult>> {
    return this.apiService.post<LabelScanApiResponse<ProductExpdateScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_PRODUCT_EXPDATE_SCAN,
      { scan },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<ProductExpdateScanResult>(err)));
  }

  validateProductScan(scan: string, codeScheme?: string): Observable<LabelScanApiResponse<ProductScanResult>> {
    return this.apiService.post<LabelScanApiResponse<ProductScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_PRODUCT_SCAN,
      { scan, codeScheme },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<ProductScanResult>(err)));
  }

  validateExpdateScan(scan: string, codeScheme?: string): Observable<LabelScanApiResponse<ExpdateScanResult>> {
    return this.apiService.post<LabelScanApiResponse<ExpdateScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_EXPDATE_SCAN,
      { scan, codeScheme },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<ExpdateScanResult>(err)));
  }

  validateExpiryScan(scan: string, codeScheme?: string): Observable<LabelScanApiResponse<ExpiryScanResult>> {
    return this.apiService.post<LabelScanApiResponse<ExpiryScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_EXPIRY_SCAN,
      { scan, codeScheme },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<ExpiryScanResult>(err)));
  }

  validateProductExpiryScan(scan: string): Observable<LabelScanApiResponse<ProductExpiryScanResult>> {
    return this.apiService.post<LabelScanApiResponse<ProductExpiryScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_PRODUCT_EXPIRY_SCAN,
      { scan },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<ProductExpiryScanResult>(err)));
  }

  validateSpTestScan(scan: string): Observable<LabelScanApiResponse<SpTestScanResult>> {
    return this.apiService.post<LabelScanApiResponse<SpTestScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_SP_TEST_SCAN,
      { scan },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<SpTestScanResult>(err)));
  }

  validateCatalogScan(scan: string, programName?: string): Observable<LabelScanApiResponse<CatalogScanResult>> {
    return this.apiService.post<LabelScanApiResponse<CatalogScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_CATALOG_SCAN,
      { scan, programName },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<CatalogScanResult>(err)));
  }

  validateLotScan(scan: string, catalogNumber: string): Observable<LabelScanApiResponse<LotScanResult>> {
    return this.apiService.post<LabelScanApiResponse<LotScanResult>>(
      API.APPLICATION_ADMIN.DONOR_LIB_VALIDATE_LOT_SCAN,
      { scan, catalogNumber },
      this.skipToastContext
    ).pipe(catchError(err => this.handleError<LotScanResult>(err)));
  }
}
