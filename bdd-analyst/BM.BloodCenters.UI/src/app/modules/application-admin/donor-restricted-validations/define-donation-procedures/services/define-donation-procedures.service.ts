import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  DefineDonationProceduresModel,
  DefineDonationProceduresParamsDto,
  CreateDonationProcedureDto,
  UpdateDonationProcedureDto,
  DonationProcedureFilterModel,
  DonationProcedureLookupModel
} from '../models/define-donation-procedures.model';
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
export class DefineDonationProceduresService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Define Donation Procedures list with pagination, sorting, and filtering
   * POST /admin/donation-procedure/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getDefineDonationProcedures(
    take: number,
    skip: number,
    params: DefineDonationProceduresParamsDto
  ): Observable<{ data: DefineDonationProceduresModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.DEFINE_DONATION_PROCEDURES(take, skip);

    return this.apiService.post<ReturnResult<DefineDonationProceduresModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching define donation procedures data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get filter dropdown values
   * GET /admin/donation-procedure/filters
   * @returns Observable with filter dropdown options
   */
  getFilterDropdownValues(): Observable<DonationProcedureFilterModel> {
    const endpoint = API.APPLICATION_ADMIN.DONATION_PROCEDURE_FILTERS;

    return this.apiService.get<ReturnResult<DonationProcedureFilterModel>>(endpoint).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        return {
          donationTypes: [],
          procedureCodes: []
        };
      }),
      catchError(error => {
        console.error('Error fetching filter dropdown values:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get lookup dropdown values (for Add/Edit forms)
   * GET /admin/donation-procedure/lookups
   * @returns Observable with lookup dropdown options
   */
  getLookupDropdownValues(chapterId: string): Observable<DonationProcedureLookupModel> {
    const endpoint = `${API.APPLICATION_ADMIN.DONATION_PROCEDURE_LOOKUPS}?chapterId=${encodeURIComponent(chapterId)}`;

    return this.apiService.get<ReturnResult<DonationProcedureLookupModel>>(endpoint).pipe(
      map(response => {
        if (response.data && response.data.length > 0) {
          return response.data[0];
        }
        return {
          donationTypes: [],
          procedureCodes: []
        };
      }),
      catchError(error => {
        console.error('Error fetching lookup dropdown values:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new donation procedure
   * POST /admin/donation-procedure
   * @param payload - Donation procedure data to add
   * @returns Observable with API response
   */
  addDonationProcedure(payload: CreateDonationProcedureDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.ADD_DONATION_PROCEDURE;

    return this.apiService.post<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding donation procedure:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing donation procedure
   * PUT /admin/donation-procedure
   * @param payload - Updated donation procedure data
   * @returns Observable with API response
   */
  updateDonationProcedure(payload: UpdateDonationProcedureDto): Observable<any> {
    const endpoint = API.APPLICATION_ADMIN.UPDATE_DONATION_PROCEDURE;

    return this.apiService.put<any>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating donation procedure:', error);
        return throwError(() => error);
      })
    );
  }
}
