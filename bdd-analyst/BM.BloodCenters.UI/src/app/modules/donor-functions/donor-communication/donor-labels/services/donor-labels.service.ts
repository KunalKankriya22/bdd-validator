import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  DonorLabelDto,
  DonorLabelSearchRequest,
  UpdatePrintFlagsRequest,
  GenerateLabelsRequest,
  PrintLabelsRequest,
  SearchResponse,
  ActionResponse,
  UpdatePrintFlagsResponseData,
  GenerateLabelsResponseData,
  PrintLabelsResponseData,
  PrinterOption,
  SearchTypeOption,
  DropdownValuesResponse
} from '../models/donor-labels.model';
import { HeaderService } from '@shared/services/header.service';

/**
 * Service for Donor Labels API operations
 * Handles all CRUD operations for first-time and gallon donor labels
 */
@Injectable({
  providedIn: 'root'
})
export class DonorLabelsService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Search for donor labels based on criteria
   * @param request - Search criteria including date range and search type
   * @returns Observable with search results
   */
  searchDonorLabels(
    request: DonorLabelSearchRequest
  ): Observable<{ data: DonorLabelDto[]; totalCount: number }> {
    const take = request.take || 100;
    const skip = request.skip || 0;
    const endpoint = API.DONOR_COMMUNICATION.DONOR_LABELS.SEARCH(take, skip);

    return this.apiService.post<SearchResponse<DonorLabelDto>>(endpoint, request).pipe(
      map(response => ({
        data: response.data || [],
        totalCount: response.totalCount || 0
      })),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Bulk update print flags for donor label records
   * @param request - Print flag value and list of records to update
   * @returns Observable with update results
   */
  updatePrintFlags(
    request: UpdatePrintFlagsRequest
  ): Observable<UpdatePrintFlagsResponseData> {
    const endpoint = API.DONOR_COMMUNICATION.DONOR_LABELS.UPDATE_PRINT_FLAGS;

    return this.apiService.put<ActionResponse<UpdatePrintFlagsResponseData[]>>(endpoint, request).pipe(
      map(response => {
        const data = response.data;
        return (Array.isArray(data) && data.length > 0 ? data[0] : data) as UpdatePrintFlagsResponseData;
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Generate communication labels for donors with print_flag='N'
   * Creates entries in DONOR_COMMUNICATIONS table
   * @param request - Search criteria for label generation
   * @returns Observable with generation results
   */
  generateLabels(
    request: GenerateLabelsRequest
  ): Observable<GenerateLabelsResponseData> {
    const endpoint = API.DONOR_COMMUNICATION.DONOR_LABELS.GENERATE;

    return this.apiService.post<ActionResponse<GenerateLabelsResponseData[]>>(endpoint, request).pipe(
      map(response => {
        const data = response.data;
        return (Array.isArray(data) && data.length > 0 ? data[0] : data) as GenerateLabelsResponseData;
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Submit a label print job to the report server
   * @param request - Print job parameters including printer name
   * @returns Observable with print job submission results
   */
  printLabels(
    request: PrintLabelsRequest
  ): Observable<PrintLabelsResponseData> {
    const endpoint = API.DONOR_COMMUNICATION.DONOR_LABELS.PRINT;

    return this.apiService.post<ActionResponse<PrintLabelsResponseData[]>>(endpoint, request).pipe(
      map(response => {
        const data = response.data;
        return (Array.isArray(data) && data.length > 0 ? data[0] : data) as PrintLabelsResponseData;
      }),
      catchError(error => throwError(() => error))
    );
  }

  /**
   * Get list of available printers for the current warehouse
   * @returns Observable with printer options
   */
  getPrinters(): Observable<PrinterOption[]> {
    const warehouseId = this.headerService.getCurrentWarehouseId();
    const endpoint = API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.LOV_PRINTERS(warehouseId);

    return this.apiService.get<{ data?: PrinterOption[] }>(endpoint).pipe(
      map(response => response.data || []),
      catchError(() => throwError(() => new Error('Failed to load printers')))
    );
  }

  /**
   * Get dropdown values for search types and printers
   * @returns Observable with dropdown values (converted to frontend format)
   */
  getDropdownValues(): Observable<{ searchTypes: SearchTypeOption[]; printers: PrinterOption[] }> {
    const endpoint = API.DONOR_COMMUNICATION.DONOR_LABELS.DROPDOWN;

    return this.apiService.get<{ success: boolean; data: DropdownValuesResponse[] }>(endpoint).pipe(
      map(response => {
        // Backend returns data as an array with one item
        const dropdownData = response.data && response.data.length > 0 ? response.data[0] : null;

        if (dropdownData) {
          // Convert backend format to frontend format
          const searchTypes: SearchTypeOption[] = (dropdownData.searchTypes || []).map(item => ({
            value: item.code as any, // 'FirstTimeFixed' or 'GallonDonors'
            label: item.description || item.code
          }));

          const printers: PrinterOption[] = (dropdownData.printers || []).map(item => ({
            printerName: item.code,
            printerDescription: item.description
          }));

          return {
            searchTypes,
            printers
          };
        }
        // Return default values if no data
        return {
          searchTypes: [],
          printers: []
        };
      }),
      catchError(() => throwError(() => new Error('Failed to load dropdown values')))
    );
  }

  /**
   * Validate if a printer exists and is active in RPT_MASTER_CODES
   * @param printerName - Printer name to validate
   * @returns Observable with validation result
   */
  validatePrinter(printerName: string): Observable<boolean> {
    if (!printerName || printerName.trim() === '') {
      return throwError(() => new Error('Printer name is required'));
    }

    const endpoint = API.DONOR_COMMUNICATION.DONOR_LABELS.VALIDATE_PRINTER(printerName);

    return this.apiService.get<{ success: boolean; isValid: boolean }>(endpoint).pipe(
      map(response => response.isValid || false),
      catchError(() => throwError(() => new Error('Failed to validate printer')))
    );
  }
}
