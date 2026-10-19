import { Injectable, inject } from '@angular/core';
import { Observable, throwError, of, delay, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpContext, HttpParams } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../../core/constants/api.constants';
import { SKIP_ERROR_TOAST } from '../../../../../../core/constants/http-context.constants';
import {
  RegisteredDeferralsLookups,
  RegisteredDeferralsLookupsResponse,
  RegisteredDeferralsQueryRequest,
  RegisteredDeferralsQueryResponse,
  RegisteredDeferralRow,
  LookupOption,
} from '../models/registered-deferrals-query.model';

// Set to false to use real backend API
const USE_MOCK_DATA = false;

const MOCK_LOOKUPS: RegisteredDeferralsLookups = {
  driveIds: [
    { code: 'DRV0164777', description: 'DRV0164777' },
    { code: 'DRV0164778', description: 'DRV0164778' },
    { code: 'DRV0164779', description: 'DRV0164779' },
    { code: 'DRV0164780', description: 'DRV0164780' },
    { code: 'DRV0164781', description: 'DRV0164781' },
    { code: 'DRV0164782', description: 'DRV0164782' },
    { code: 'DRV0164783', description: 'DRV0164783' },
    { code: 'DRV0164784', description: 'DRV0164784' },
  ],
  users: [
    { code: 'CELHUN', description: 'CELHUN' },
    { code: 'CYNCUL', description: 'CYNCUL' },
  ],
  deferralIds: [
    { code: '01012018', description: '01012018' },
    { code: '02022018', description: '02022018' },
    { code: '03032018', description: '03032018' },
    { code: '04042018', description: '04042018' },
    { code: '05052018', description: '05052018' },
    { code: '06062018', description: '06062018' },
    { code: '07072018', description: '07072018' },
    { code: '07072019', description: '07072019' },
  ],
  transactionIds: [
    { code: 'TR02866892', description: 'TR02866892' },
    { code: 'TR02866893', description: 'TR02866893' },
    { code: 'TR02866894', description: 'TR02866894' },
    { code: 'TR02866895', description: 'TR02866895' },
    { code: 'TR02866896', description: 'TR02866896' },
    { code: 'TR02866897', description: 'TR02866897' },
    { code: 'TR02866898', description: 'TR02866898' },
    { code: 'TR02866899', description: 'TR02866899' },
  ],
  setIds: [],
};

const MOCK_RESULTS: RegisteredDeferralRow[] = [
  { deferralId: '01012018', transactionId: 'TR02866892', setId: 'BAT001', driveId: 'DRV0164777', donorId: 'DN30120470', donationType: 'AL', procedureCode: 'WB', user: 'CELHUN', dateTimeOfRegistration: '2025-01-11T09:05:00', auditComplete: '--' },
  { deferralId: '02022018', transactionId: 'TR02866893', setId: 'BAT001', driveId: 'DRV0164778', donorId: 'DN30120471', donationType: 'AL', procedureCode: 'WB', user: 'CYNCUL', dateTimeOfRegistration: '2025-01-12T10:15:00', auditComplete: '--' },
  { deferralId: '03032018', transactionId: 'TR02866894', setId: 'BAT002', driveId: 'DRV0164779', donorId: 'DN30120472', donationType: 'AL', procedureCode: 'WB', user: 'CELHUN', dateTimeOfRegistration: '2025-01-13T11:30:00', auditComplete: 'Yes' },
  { deferralId: '04042018', transactionId: 'TR02866895', setId: 'BAT002', driveId: 'DRV0164780', donorId: 'DN30120473', donationType: 'AL', procedureCode: 'WB', user: 'CELHUN', dateTimeOfRegistration: '2025-01-14T13:00:00', auditComplete: 'Yes' },
  { deferralId: '05052018', transactionId: 'TR02866896', setId: 'BAT003', driveId: 'DRV0164781', donorId: 'DN30120474', donationType: 'AL', procedureCode: 'WB', user: 'CELHUN', dateTimeOfRegistration: '2025-01-15T14:45:00', auditComplete: '--' },
  { deferralId: '06062018', transactionId: 'TR02866897', setId: 'BAT003', driveId: 'DRV0164782', donorId: 'DN30120475', donationType: 'AL', procedureCode: 'WB', user: 'CELHUN', dateTimeOfRegistration: '2025-01-16T15:30:00', auditComplete: '--' },
  { deferralId: '07072018', transactionId: 'TR02866898', setId: 'ONSITE', driveId: 'DRV0164783', donorId: 'DN30120476', donationType: 'AL', procedureCode: 'WB', user: 'CYNCUL', dateTimeOfRegistration: '2025-01-17T16:20:00', auditComplete: 'Yes' },
  { deferralId: '07072019', transactionId: 'TR02866899', setId: 'ONSITE', driveId: 'DRV0164784', donorId: 'DN30120477', donationType: 'AL', procedureCode: 'WB', user: 'CYNCUL', dateTimeOfRegistration: '2025-01-18T17:10:00', auditComplete: '--' },
];

@Injectable({
  providedIn: 'root',
})
export class RegisteredDeferralsQueryService {
  private readonly apiService = inject(ApiService);

  /**
   * Extract lookup data from various backend response formats
   * Handles: direct array, { data: [] }, { Data: [] }, etc.
   */
  private extractLookupData(response: any): LookupOption[] {
    console.log('=== LOV Response START ===');
    console.log('Response type:', typeof response);
    console.log('Is array?:', Array.isArray(response));
    console.log('Response keys:', response ? Object.keys(response) : 'null');
    console.log('Full response:', JSON.stringify(response).substring(0, 500));

    let rawData: any[] = [];

    try {
      // Direct array response
      if (Array.isArray(response)) {
        console.log('✓ Format: Direct array');
        rawData = response;
      }
      // Wrapped in { data: [] }
      else if (response?.data && Array.isArray(response.data)) {
        console.log('✓ Format: Wrapped in data property');
        rawData = response.data;
      }
      // Wrapped in { Data: [] } (capitalized)
      else if (response?.Data && Array.isArray(response.Data)) {
        console.log('✓ Format: Wrapped in Data property');
        rawData = response.Data;
      }
      // Try to find first array property in response
      else if (response && typeof response === 'object') {
        console.log('⚠ Searching for array in response object...');
        for (const key in response) {
          if (Array.isArray(response[key])) {
            console.log(`✓ Found array at key: "${key}"`);
            rawData = response[key];
            break;
          }
        }
      }

      if (rawData.length === 0) {
        console.error('✗ No array data found in response');
        console.log('=== LOV Response END ===');
        return [];
      }

      console.log(`Found ${rawData.length} raw items`);

      // Map to LookupOption format (handle different field names)
      const mappedData: LookupOption[] = [];

      for (let i = 0; i < rawData.length; i++) {
        const item = rawData[i];

        if (i === 0) {
          console.log('First raw item:', item);
          console.log('First raw item keys:', Object.keys(item));
        }

        // Try all possible field name variations
        let code = '';
        let description = '';

        // Determine which LOV endpoint this is based on field presence
        const isDriveLOV = item.driveId !== undefined || item.DriveId !== undefined;
        const isDeferralLOV = item.deferralId !== undefined || item.DeferralId !== undefined || item.setId !== undefined || item.SetId !== undefined;
        const isTransactionLOV = !isDeferralLOV && (item.transactionId !== undefined || item.TransactionId !== undefined);
        const isUserLOV = item.userId !== undefined || item.UserId !== undefined;

        // Find code field based on LOV type
        if (isDeferralLOV) {
          // For Deferral ID dropdown - use deferralId or setId field
          code = String(item.deferralId || item.DeferralId || item.setId || item.SetId || '');
        } else if (isTransactionLOV) {
          // For Transaction ID dropdown - use transactionId field
          code = String(item.transactionId || item.TransactionId || '');
        } else if (isDriveLOV) {
          // For Drive ID dropdown - use driveId field
          code = String(item.driveId || item.DriveId || '');
        } else if (isUserLOV) {
          // For User dropdown - use userId field
          code = String(item.userId || item.UserId || '');
        } else {
          // Generic fallback
          code = String(
            item.code || item.Code ||
            item.id || item.Id || item.ID ||
            item.value || item.Value ||
            Object.values(item)[0] || ''
          );
        }

        // Find description field based on LOV type
        if (isDeferralLOV) {
          // For Deferral ID - show just the ID
          description = code;
        } else if (isTransactionLOV) {
          // For Transaction ID - show just the ID
          description = code;
        } else if (isDriveLOV) {
          // For Drive ID - show just the ID
          description = code;
        } else if (isUserLOV) {
          // For User - show user name
          description = String(item.userName || item.UserName || code);
        } else {
          // Generic fallback
          description = String(
            item.description || item.Description ||
            item.desc || item.Desc ||
            item.name || item.Name ||
            item.label || item.Label ||
            code
          );
        }

        if (i === 0) {
          console.log('First mapped item:', { code, description });
        }

        mappedData.push({ code, description });
      }

      console.log(`✓ Successfully mapped ${mappedData.length} items`);
      console.log('=== LOV Response END ===');
      return mappedData;

    } catch (error) {
      console.error('✗ Error extracting LOV data:', error);
      console.log('=== LOV Response END ===');
      return [];
    }
  }

  /**
   * Map backend field names to frontend model
   * Handles PascalCase, camelCase, snake_case variations
   */
  private mapDeferralRow(item: any, index: number): RegisteredDeferralRow {
    if (index === 0) {
      console.log('First query item keys:', Object.keys(item));
    }

    const mapped = {
      deferralId: item.deferralId || item.DeferralId || item.deferral_id || '',
      transactionId: item.transactionId || item.TransactionId || item.transaction_id || '',
      setId: item.setId || item.SetId || item.set_id || '',
      driveId: item.driveId || item.DriveId || item.drive_id || '',
      donorId: item.donorId || item.DonorId || item.donor_id || '',
      donationType: item.donationType || item.DonationType || item.donation_type || '',
      procedureCode: item.procedureCode || item.ProcedureCode || item.procedure_code || '',
      user: item.insertUser || item.InsertUser || item.userName || item.UserName || item.user || item.User || item.user_name || item.userId || item.UserId || '',
      dateTimeOfRegistration: item.insertDate || item.InsertDate || item.dateTimeOfRegistration || item.DateTimeOfRegistration || item.date_time_of_registration || item.regDateTime || item.RegDateTime || '',
      auditComplete: (() => {
        const raw = item.auditFlag || item.AuditFlag || item.auditComplete || item.AuditComplete || item.audit_complete || item.isAuditComplete || '';
        return raw === 'Y' ? 'Yes' : raw === 'N' ? 'No' : raw;
      })(),
      driveDate: item.driveDate || item.DriveDate || item.drive_date || item.collDate || item.CollDate || ''
    };

    if (index === 0) {
      console.log('First mapped query item:', mapped);
    }

    return mapped;
  }

  getLookups(fromDate?: string, toDate?: string): Observable<RegisteredDeferralsLookups> {
    if (USE_MOCK_DATA) {
      return of(MOCK_LOOKUPS).pipe(delay(300));
    }

    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    const opts = { context, params };

    return forkJoin({
      drives: this.apiService.get<any>(
        API.DONOR_FUNCTIONS.REGISTERED_DEFERRALS_QUERY.DRIVES_LOV, opts
      ).pipe(
        map(response => this.extractLookupData(response)),
        catchError(() => of([]))
      ),

      users: this.apiService.get<any>(
        API.DONOR_FUNCTIONS.REGISTERED_DEFERRALS_QUERY.USERS_LOV, opts
      ).pipe(
        map(response => this.extractLookupData(response)),
        catchError(() => of([]))
      ),

      deferrals: this.apiService.get<any>(
        API.DONOR_FUNCTIONS.REGISTERED_DEFERRALS_QUERY.DEFERRALS_LOV, opts
      ).pipe(
        map(response => this.extractLookupData(response)),
        catchError(() => of([]))
      ),

      transactions: this.apiService.get<any>(
        API.DONOR_FUNCTIONS.REGISTERED_DEFERRALS_QUERY.TRANSACTIONS_LOV, opts
      ).pipe(
        map(response => this.extractLookupData(response)),
        catchError(() => of([]))
      ),

      sets: this.apiService.get<any>(
        API.DONOR_FUNCTIONS.REGISTERED_DEFERRALS_QUERY.SETS_LOV, opts
      ).pipe(
        map(response => this.extractLookupData(response)),
        catchError(() => of([]))
      )
    }).pipe(
      map((responses) => ({
        driveIds: responses.drives || [],
        users: responses.users || [],
        deferralIds: responses.deferrals || [],
        transactionIds: responses.transactions || [],
        setIds: responses.sets || []
      }))
    );
  }

  getLovLimit(): Observable<number> {
    return this.apiService.get<{ item?: number }>(
      API.DONOR_FUNCTIONS.REGISTERED_DEFERRALS_QUERY.LOV_LIMIT
    ).pipe(
      map(response => response.item || 21),
      catchError(() => of(21))
    );
  }

  query(request: RegisteredDeferralsQueryRequest): Observable<RegisteredDeferralRow[]> {
    if (USE_MOCK_DATA) {
      let filtered = [...MOCK_RESULTS];
      if (request.driveId) {
        filtered = filtered.filter(r => r.driveId === request.driveId);
      }
      if (request.user) {
        filtered = filtered.filter(r => r.user === request.user);
      }
      if (request.deferralId) {
        filtered = filtered.filter(r => r.deferralId === request.deferralId);
      }
      if (request.transactionId) {
        filtered = filtered.filter(r => r.transactionId === request.transactionId);
      }
      return of(filtered).pipe(delay(500));
    }

    // Skip error toasts from interceptor - component will show the error
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);

    // Map UI request to backend DTO
    const backendRequest = {
      fromDate: request.driveDateFrom || null,
      toDate: request.driveDateTo || null,
      driveId: request.driveId || null,
      deferralId: request.deferralId || null,
      transactionId: request.transactionId || null,
      userId: request.user || null,
      setId: request.setId || null,
      sortColumn: request.sortField || null,
      sortOrder: request.sortDirection || null
    };

    // Use pagination: fetch first 1000 records (adjust as needed)
    const take = 1000;
    const skip = 0;

    return this.apiService
      .post<RegisteredDeferralRow[]>(
        API.DONOR_FUNCTIONS.REGISTERED_DEFERRALS_QUERY.QUERY(take, skip),
        backendRequest,
        { context }
      )
      .pipe(
        map((response: any) => {
          console.log('Query Response (full):', response);
          console.log('Query Response type:', typeof response);
          console.log('Query Response keys:', response ? Object.keys(response) : 'null');

          // Handle various response formats
          let data: RegisteredDeferralRow[] = [];

          // Direct array response
          if (Array.isArray(response)) {
            console.log('✓ Direct array format, items:', response.length);
            data = response;
          }
          // Wrapped in { data: [] }
          else if (response?.data && Array.isArray(response.data)) {
            console.log('✓ Wrapped in data property, items:', response.data.length);
            data = response.data;
          }
          // Wrapped in { Data: [] } (capitalized)
          else if (response?.Data && Array.isArray(response.Data)) {
            console.log('✓ Wrapped in Data property, items:', response.Data.length);
            data = response.Data;
          }
          // Check for other common wrappers
          else if (response?.items && Array.isArray(response.items)) {
            console.log('✓ Wrapped in items property, items:', response.items.length);
            data = response.items;
          }
          else if (response?.results && Array.isArray(response.results)) {
            console.log('✓ Wrapped in results property, items:', response.results.length);
            data = response.results;
          }
          else {
            console.error('✗ Unexpected query response format:', response);
            data = [];
          }

          console.log('Final extracted data:', data.length, 'items');
          if (data.length > 0) {
            console.log('First item (raw):', data[0]);
          }

          // Map backend field names to frontend model
          const mappedData = data.map((item, index) => this.mapDeferralRow(item, index));

          console.log(`✓ Mapped ${mappedData.length} query items`);

          return mappedData;
        }),
        catchError((error) => {
          console.error('Error querying registered deferrals:', error);
          return throwError(() => error);
        })
      );
  }
}
