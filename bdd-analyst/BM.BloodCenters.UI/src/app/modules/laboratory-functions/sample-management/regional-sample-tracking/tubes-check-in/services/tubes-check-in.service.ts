import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API } from '@core/constants/api.constants';
import {
  TubesContract,
  ProfileSet,
  CheckInRequestDto,
  CheckInResponseDto,
  ValidateUnitRequestDto,
  ValidateUnitResponseDto,
  ContractLookupDto,
  BatchLookupDto,
  ProfileSetDto,
  BatchUnitDto,
  DuplicateUnitDto,
  TestLookupDto,
  TubeFormatDto,
  DuplicateReasonDto,
  CheckInOption,
  ReturnResult,
} from '../models/tubes-check-in.model';

/**
 * Service for Regional Tubes Check-In functionality
 * Handles API calls for contract selection, batch management, and tube check-in operations
 * API Documentation: D:\BC-WellSky\mdfile\tubescheckin.md
 */
@Injectable({
  providedIn: 'root'
})
export class TubesCheckInService {
  private readonly http = inject(HttpClient);

  // ────────────────────────── Primary Check-In Operation ────────────────────────

  /**
   * Submit tube check-in data (POST /regional-tubes/check-in)
   * Executes complete check-in workflow for a batch of tubes
   */
  checkIn(request: CheckInRequestDto): Observable<ReturnResult<CheckInResponseDto>> {
    return this.http.post<ReturnResult<CheckInResponseDto>>(
      API.REGIONAL_TUBES.CHECK_IN,
      request
    );
  }

  // ────────────────────────── Real-Time Validation ───────────────────────────────

  /**
   * Validate individual unit fields during barcode scanning
   * POST /regional-tubes/validate-unit
   * Provides instant feedback (green checkmark / red error)
   */
  validateUnit(request: ValidateUnitRequestDto): Observable<ReturnResult<ValidateUnitResponseDto>> {
    return this.http.post<ReturnResult<ValidateUnitResponseDto>>(
      API.REGIONAL_TUBES.VALIDATE_UNIT,
      request
    );
  }

  // ────────────────────────── Contract & Profile Lookups ─────────────────────────

  /**
   * Get available contracts for the chapter
   * GET /regional-tubes/contracts?searchString=...
   */
  getContracts(searchString?: string): Observable<TubesContract[]> {
    let params = new HttpParams();
    if (searchString) {
      params = params.set('searchString', searchString);
    }

    return this.http.get<ReturnResult<ContractLookupDto[]>>(
      API.REGIONAL_TUBES.CONTRACTS,
      { params }
    ).pipe(
      map(response => this.mapContracts(response.data || []))
    );
  }

  /**
   * Get profile sets for a contract
   * GET /regional-tubes/profile-sets/{contractId}
   */
  getProfileSets(contractId: string): Observable<ProfileSet[]> {
    return this.http.get<ReturnResult<ProfileSetDto[]>>(
      API.REGIONAL_TUBES.PROFILE_SETS(contractId)
    ).pipe(
      map(response => response.data || [])
    );
  }

  // ────────────────────────── Batch Management ───────────────────────────────────

  /**
   * Get open batches for a contract
   * GET /regional-tubes/batches?contractId=...
   * Returns only open batches (QC not completed: qcDate IS NULL)
   */
  getBatches(contractId: string): Observable<BatchLookupDto[]> {
    const params = new HttpParams().set('contractId', contractId);

    return this.http.get<ReturnResult<BatchLookupDto[]>>(
      API.REGIONAL_TUBES.BATCHES,
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get all units already checked into a batch
   * GET /regional-tubes/batch-units/{batchId}
   */
  getBatchUnits(batchId: string): Observable<BatchUnitDto[]> {
    const url = API.REGIONAL_TUBES.BATCH_UNITS(batchId);
    console.log('🌐 Calling API:', url);
    console.log('📦 Batch ID:', batchId);

    return this.http.get<ReturnResult<BatchUnitDto[]>>(url).pipe(
      map(response => {
        console.log('📥 API Response:', response);
        return response.data || [];
      })
    );
  }

  // ────────────────────────── Duplicate Unit Handling ────────────────────────────

  /**
   * Get history of a duplicate unit ID across batches
   * GET /regional-tubes/duplicate-units/{osUnitId}
   * Used for duplicate unit modal dialog
   */
  getDuplicateUnits(osUnitId: string): Observable<DuplicateUnitDto[]> {
    return this.http.get<ReturnResult<DuplicateUnitDto[]>>(
      API.REGIONAL_TUBES.DUPLICATE_UNITS(osUnitId)
    ).pipe(
      map(response => response.data || [])
    );
  }

  // ────────────────────────── Test Profile Management ────────────────────────────

  /**
   * Get additional tests available for a contract
   * GET /regional-tubes/additional-tests/{contractId}
   */
  getAdditionalTests(contractId: string): Observable<TestLookupDto[]> {
    return this.http.get<ReturnResult<TestLookupDto[]>>(
      API.REGIONAL_TUBES.ADDITIONAL_TESTS(contractId)
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get base test profile for a contract
   * GET /regional-tubes/contract-tests/{contractId}?profileSetId=...
   * Read-only display of tests that will be scheduled
   */
  getContractTests(contractId: string, profileSetId?: string): Observable<TestLookupDto[]> {
    return this.http.get<ReturnResult<TestLookupDto[]>>(
      API.REGIONAL_TUBES.CONTRACT_TESTS(contractId, profileSetId)
    ).pipe(
      map(response => response.data || [])
    );
  }

  // ────────────────────────── Static Lookups ─────────────────────────────────────

  /**
   * Get valid tube format codes
   * GET /regional-tubes/lookups/tube-formats
   * Returns: R, RP, RPS, R2
   */
  getTubeFormats(): Observable<TubeFormatDto[]> {
    return this.http.get<ReturnResult<TubeFormatDto[]>>(
      API.REGIONAL_TUBES.TUBE_FORMATS
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Get valid reason codes for duplicate tubes
   * GET /regional-tubes/lookups/duplicate-reasons
   * Required when isDuplicate=true from validation endpoint
   */
  getDuplicateReasons(): Observable<DuplicateReasonDto[]> {
    return this.http.get<ReturnResult<DuplicateReasonDto[]>>(
      API.REGIONAL_TUBES.DUPLICATE_REASONS
    ).pipe(
      map(response => response.data || [])
    );
  }

  /**
   * Generate a new batch ID (called when user selects "NEW")
   * POST /regional-tubes/generate-batch-id
   * Maps to Oracle Forms GEN_BATCH_ID procedure
   * Returns generated batch ID in format MMDDYY-RGnnnn (e.g., 062526-RG1001)
   */
  generateBatchId(): Observable<string> {
    return this.http.post<ReturnResult<{ batchId: string }>>(
      API.REGIONAL_TUBES.GENERATE_BATCH_ID,
      {}
    ).pipe(
      map(response => response.item?.batchId || '')
    );
  }

  /**
   * Get check-in option codes (A, B, C)
   * GET /regional-tubes/lookups/options
   * Returns available check-in modes: A = All Tubes, B = By Batch, C = By Units
   */
  getCheckInOptions(): Observable<CheckInOption[]> {
    return this.http.get<ReturnResult<CheckInOption[]>>(
      API.REGIONAL_TUBES.OPTIONS
    ).pipe(
      map(response => response.data || [])
    );
  }

  // ────────────────────────── Helper Methods ─────────────────────────────────────

  /**
   * Map ContractLookupDto[] to TubesContract[] for UI
   */
  private mapContracts(dtos: ContractLookupDto[]): TubesContract[] {
    return dtos.map(dto => ({
      contractId: dto.contractId,
      company: dto.company,
      description: dto.company, // Keep for backward compatibility
      centerId: dto.centerId,
      copyIsbtFlag: dto.copyIsbtFlag,
      allowsDuplicates: dto.dupCheckinFlag === 'Y',
      maxDuplicates: dto.noOfDuplicates,
    }));
  }

  /**
   * Format ISO DateTime to DD-MMM-YYYY format
   * Example: "2026-06-12T10:30:00Z" → "12-JUN-2026"
   */
  formatDateForDisplay(isoDate: string | null): string | null {
    if (!isoDate) return null;

    const date = new Date(isoDate);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  }

  /**
   * Format ISO DateTime to HH:mm format
   * Example: "2026-06-12T14:30:00Z" → "14:30"
   */
  formatTimeForDisplay(isoDate: string | null): string | null {
    if (!isoDate) return null;

    const date = new Date(isoDate);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  /**
   * Convert DD-MMM-YYYY + HH:mm to ISO DateTime string
   * Example: "12-JUN-2026" + "14:30" → "2026-06-12T14:30:00Z"
   */
  convertToIsoDateTime(date: string, time: string): string {
    // Parse DD-MMM-YYYY
    const [day, month, year] = date.split('-');
    const months: Record<string, string> = {
      'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
      'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
      'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12',
    };
    const monthNum = months[month.toUpperCase()];

    // Parse HH:mm
    const [hours, minutes] = time.split(':');

    // Construct ISO string (using local timezone, backend will handle UTC conversion)
    return `${year}-${monthNum}-${day}T${hours}:${minutes}:00`;
  }
}
