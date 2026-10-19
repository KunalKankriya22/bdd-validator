import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import {
  RegistrationHoldsMappingModel,
  RegistrationHoldsMappingParamsDto,
  CreateRegistrationHoldsMappingRequestDto,
  UpdateRegistrationHoldsMappingRequestDto,
  DropdownRowDto
} from '../models/registration-holds-mapping.model';
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

/**
 * Service for managing Registration Holds Mapping operations
 * Using REAL API endpoints
 */
@Injectable({
  providedIn: 'root'
})
export class RegistrationHoldsMappingService {
  private readonly apiService = inject(ApiService);
  private readonly USE_MOCK_DATA = false; // Using real API endpoints

  /**
   * Format date to YYYY-MM-DD without timezone conversion
   */
  private formatDateWithoutTimezone(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Mock data storage
  private mockData: RegistrationHoldsMappingModel[] = [
    {
      id: 1,
      interdictionReason: 'ABOPPCUE',
      code: 'RH001',
      description: 'ABO Discrepancy - Positive Antibody Screen',
      effectiveDate: new Date('2024-01-15'),
      terminationDate: null,
      modificationDate: new Date('2024-11-20'),
      createdBy: 'admin',
      createdDate: new Date('2024-01-15'),
      modifiedBy: 'jsmith'
    },
    {
      id: 2,
      interdictionReason: 'NOLOOKUP',
      code: 'RH002',
      description: 'No Lookup Available for Donor',
      effectiveDate: new Date('2024-02-10'),
      terminationDate: new Date('2025-12-31'),
      modificationDate: new Date('2024-12-05'),
      createdBy: 'admin',
      createdDate: new Date('2024-02-10'),
      modifiedBy: 'admin'
    },
    {
      id: 3,
      interdictionReason: 'NODFREASON',
      code: 'RH003',
      description: 'No Deferral Reason Specified',
      effectiveDate: new Date('2024-03-22'),
      terminationDate: null,
      modificationDate: new Date('2024-10-15'),
      createdBy: 'manager',
      createdDate: new Date('2024-03-22'),
      modifiedBy: 'manager'
    },
    {
      id: 4,
      interdictionReason: 'PLTDEFER',
      code: 'RH004',
      description: 'Platelet Deferral - Low Count',
      effectiveDate: new Date('2024-04-18'),
      terminationDate: null,
      modificationDate: new Date('2024-11-28'),
      createdBy: 'admin',
      createdDate: new Date('2024-04-18'),
      modifiedBy: 'kparker'
    },
    {
      id: 5,
      interdictionReason: 'REGHOLD',
      code: 'RH005',
      description: 'Registration Hold - Pending Verification',
      effectiveDate: new Date('2024-05-05'),
      terminationDate: new Date('2025-06-30'),
      modificationDate: new Date('2024-12-10'),
      createdBy: 'supervisor',
      createdDate: new Date('2024-05-05'),
      modifiedBy: 'supervisor'
    },
    {
      id: 6,
      interdictionReason: 'ABOPPCUE',
      code: 'RH006',
      description: 'Blood Type Mismatch Detected',
      effectiveDate: new Date('2024-06-12'),
      terminationDate: null,
      modificationDate: new Date('2024-11-22'),
      createdBy: 'admin',
      createdDate: new Date('2024-06-12'),
      modifiedBy: 'admin'
    },
    {
      id: 7,
      interdictionReason: 'NOLOOKUP',
      code: 'RH007',
      description: 'System Lookup Error - Contact IT',
      effectiveDate: new Date('2024-07-08'),
      terminationDate: new Date('2025-08-15'),
      modificationDate: new Date('2024-12-01'),
      createdBy: 'admin',
      createdDate: new Date('2024-07-08'),
      modifiedBy: 'jdoe'
    },
    {
      id: 8,
      interdictionReason: 'PLTDEFER',
      code: 'RH008',
      description: 'Temporary Platelet Restriction',
      effectiveDate: new Date('2024-08-20'),
      terminationDate: null,
      modificationDate: new Date('2024-11-18'),
      createdBy: 'manager',
      createdDate: new Date('2024-08-20'),
      modifiedBy: 'manager'
    },
    {
      id: 9,
      interdictionReason: 'NODFREASON',
      code: 'RH009',
      description: 'Incomplete Deferral Documentation',
      effectiveDate: new Date('2024-09-14'),
      terminationDate: null,
      modificationDate: new Date('2024-12-03'),
      createdBy: 'admin',
      createdDate: new Date('2024-09-14'),
      modifiedBy: 'admin'
    },
    {
      id: 10,
      interdictionReason: 'REGHOLD',
      code: 'RH010',
      description: 'Awaiting Medical Clearance',
      effectiveDate: new Date('2024-10-25'),
      terminationDate: new Date('2025-10-25'),
      modificationDate: new Date('2024-11-30'),
      createdBy: 'supervisor',
      createdDate: new Date('2024-10-25'),
      modifiedBy: 'mjohnson'
    },
    {
      id: 11,
      interdictionReason: 'ABOPPCUE',
      code: 'RH011',
      description: 'Rh Factor Discrepancy Found',
      effectiveDate: new Date('2024-11-02'),
      terminationDate: null,
      modificationDate: new Date('2024-12-08'),
      createdBy: 'admin',
      createdDate: new Date('2024-11-02'),
      modifiedBy: 'admin'
    },
    {
      id: 12,
      interdictionReason: 'PLTDEFER',
      code: 'RH012',
      description: 'Platelet Donation Frequency Exceeded',
      effectiveDate: new Date('2024-11-15'),
      terminationDate: null,
      modificationDate: new Date('2024-12-12'),
      createdBy: 'manager',
      createdDate: new Date('2024-11-15'),
      modifiedBy: 'manager'
    }
  ];

  private nextId = 13;

  /**
   * Get Registration Holds Mapping table data with pagination
   * POST /api/v1/application-admin/registration-holds-mapping/get-by-code/{take}/{skip}
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getRegistrationHoldsMapping(
    take: number,
    skip: number,
    params: RegistrationHoldsMappingParamsDto
  ): Observable<{ data: RegistrationHoldsMappingModel[]; totalRecords: number }> {
    if (this.USE_MOCK_DATA) {
      return this.getMockData(take, skip, params);
    }

    const endpoint = API.APPLICATION_ADMIN.REGISTRATION_HOLDS_MAPPING_GET_BY_CODE(take, skip);

    // Map frontend column names to backend column names
    const columnMap: { [key: string]: string } = {
      'interdictionReason': 'INTERREASON',
      'code': 'CODE',
      'description': 'DESCRIPTION',
      'effectiveDate': 'EFFDATE',
      'terminationDate': 'TERMDATE',
      'modificationDate': 'MODIFICATIONDATE',
      'changeControlFlag': 'CHANGECONTROLFLAG'
    };

    // Build request body matching RegistrationHoldsMappingSearchParams
    const body: any = {
      sortBy: params.SortColumn ? columnMap[params.SortColumn] || 'INTERREASON' : 'INTERREASON',
      sortDirection: params.Sort ? params.Sort.toUpperCase() : 'ASC'
    };

    if (params.SearchKeyword) {
      body.search = params.SearchKeyword;
    }
    if (params.InterdictionReason) {
      body.interReason = params.InterdictionReason;
    }
    if (params.Code) {
      body.interCode = params.Code;
    }
    if (params.EffectiveDate) {
      body.effectiveDate = params.EffectiveDate;
    }
    if (params.EffectiveDatePeriod) {
      body.effectiveDatePeriod = params.EffectiveDatePeriod;
    }
    if (params.TerminationDate) {
      body.terminationDate = params.TerminationDate;
    }
    if (params.TerminationDatePeriod) {
      body.terminationDatePeriod = params.TerminationDatePeriod;
    }

    return this.apiService.post<any>(endpoint, body).pipe(
      map(response => {
        // Map backend camelCase response to frontend model
        const mappedData = (response.data || []).map((item: any) => ({
          interdictionReason: item.interReason,
          code: item.code,
          description: item.description,
          effectiveDate: item.effDate ? new Date(item.effDate) : null,
          terminationDate: item.termDate && item.termDate.trim() ? new Date(item.termDate) : null,
          modificationDate: item.modificationDate ? new Date(item.modificationDate) : null
        }));

        return {
          data: mappedData,
          totalRecords: response.totalCount || response.total || mappedData.length
        };
      }),
      catchError(error => {
        console.error('Error fetching registration holds mapping data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Mock data implementation
   */
  private getMockData(
    take: number,
    skip: number,
    params: RegistrationHoldsMappingParamsDto
  ): Observable<{ data: RegistrationHoldsMappingModel[]; totalRecords: number }> {
    // Filter data based on search keyword
    let filteredData = [...this.mockData];

    if (params.SearchKeyword) {
      const keyword = params.SearchKeyword.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.interdictionReason.toLowerCase().includes(keyword) ||
        item.code.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword)
      );
    }

    // Sort data
    if (params.Sort) {
      filteredData.sort((a, b) => {
        const aValue = a.interdictionReason || '';
        const bValue = b.interdictionReason || '';
        return params.Sort === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      });
    }

    // Pagination
    const totalRecords = filteredData.length;
    const paginatedData = filteredData.slice(skip, skip + take);

    // Simulate API delay
    return of({
      data: paginatedData,
      totalRecords
    }).pipe(delay(300));
  }

  /**
   * Get interdiction reasons for add/edit form dropdowns
   * GET /api/v1/application-admin/registration-holds-mapping/dropdowns/interdiction-reasons
   * @returns Observable with list of interdiction reasons
   */
  getRegistrationHolds(): Observable<{ data: { interdictionReason: string }[] }> {
    if (this.USE_MOCK_DATA) {
      const mockHolds = [
        { interdictionReason: 'ABOPPCUE' },
        { interdictionReason: 'NOLOOKUP' },
        { interdictionReason: 'NODFREASON' },
        { interdictionReason: 'PLTDEFER' },
        { interdictionReason: 'REGHOLD' }
      ];
      return of({ data: mockHolds }).pipe(delay(200));
    }

    const endpoint = '/api/v1/application-admin/registration-holds-mapping/dropdowns/interdiction-reasons';
    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        // Handle different response formats
        let dataArray: any[] = [];

        if (Array.isArray(response)) {
          // Direct array response
          dataArray = response;
        } else if (response && Array.isArray(response.data)) {
          // Wrapped in data property
          dataArray = response.data;
        } else if (response && response.item) {
          // Single item response
          dataArray = [response.item];
        } else {
          console.warn('Unexpected response format for interdiction reasons:', response);
          dataArray = [];
        }

        return {
          data: dataArray.map((item: any) => ({
            interdictionReason: item.interdictionReason || item.interReason || ''
          }))
        };
      }),
      catchError(error => {
        console.error('Error fetching interdiction reasons:', error);
        // Return empty array instead of throwing error to prevent UI crash
        return of({ data: [] });
      })
    );
  }

  /**
   * Add new Registration Hold Mapping
   * POST /api/v1/application-admin/registration-holds-mapping
   * @param data - Registration hold mapping data
   * @returns Observable with result
   */
  addRegistrationHoldMapping(
    data: CreateRegistrationHoldsMappingRequestDto
  ): Observable<ReturnResult<RegistrationHoldsMappingModel>> {
    if (this.USE_MOCK_DATA) {
      const newRecord: RegistrationHoldsMappingModel = {
        id: this.nextId++,
        interdictionReason: data.InterReason,
        code: data.Code,
        description: '', // Description is not sent, will be populated by backend
        effectiveDate: data.EffectiveDate ? new Date(data.EffectiveDate) : null,
        terminationDate: data.TerminationDate ? new Date(data.TerminationDate) : null,
        modificationDate: new Date(),
        createdBy: 'currentUser',
        createdDate: new Date(),
        modifiedBy: 'currentUser'
      };

      this.mockData.push(newRecord);

      return of({
        success: true,
        message: 'Registration Hold added successfully',
        item: newRecord
      }).pipe(delay(500));
    }

    const payload = data;

    const endpoint = API.APPLICATION_ADMIN.REGISTRATION_HOLDS_MAPPING_CREATE;
    return this.apiService.post<ReturnResult<RegistrationHoldsMappingModel>>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error adding registration hold mapping:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Registration Hold Mapping
   * PUT /api/v1/application-admin/registration-holds-mapping
   * @param data - Registration hold mapping data with original values for identification
   * @returns Observable with result
   */
  updateRegistrationHoldMapping(
    data: UpdateRegistrationHoldsMappingRequestDto
  ): Observable<ReturnResult<RegistrationHoldsMappingModel>> {
    if (this.USE_MOCK_DATA) {
      const index = this.mockData.findIndex(
        item => item.interdictionReason === data.OriginalInterReason && item.code === data.OriginalCode
      );

      if (index === -1) {
        return throwError(() => ({
          status: 404,
          error: { message: 'Record not found' }
        }));
      }

      const updatedRecord: RegistrationHoldsMappingModel = {
        ...this.mockData[index],
        code: data.Code,
        effectiveDate: data.EffectiveDate ? new Date(data.EffectiveDate) : null,
        terminationDate: data.TerminationDate ? new Date(data.TerminationDate) : null,
        modificationDate: new Date(),
        modifiedBy: 'currentUser'
      };

      this.mockData[index] = updatedRecord;

      return of({
        success: true,
        message: 'Registration Hold updated successfully',
        item: updatedRecord
      }).pipe(delay(500));
    }

    const payload = data;

    const endpoint = API.APPLICATION_ADMIN.REGISTRATION_HOLDS_MAPPING_UPDATE;
    return this.apiService.put<ReturnResult<RegistrationHoldsMappingModel>>(endpoint, payload).pipe(
      catchError(error => {
        console.error('Error updating registration hold mapping:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get interdiction codes with descriptions from API
   * GET /api/v1/application-admin/registration-holds-mapping/dropdowns/interdiction-codes
   * @returns Observable with list of code options
   */
  getCodeDropdowns(): Observable<{ data: { code: string; description?: string }[] }> {
    if (this.USE_MOCK_DATA) {
      const mockCodeOptions = [
        { code: '0008', description: 'test' },
        { code: '00088' },
        { code: '00090', description: '12' }
      ];
      return of({ data: mockCodeOptions }).pipe(delay(200));
    }

    const endpoint = '/api/v1/application-admin/registration-holds-mapping/dropdowns/interdiction-codes';
    return this.apiService.get<any>(endpoint).pipe(
      map(response => {
        // Handle different response formats
        let dataArray: any[] = [];

        if (Array.isArray(response)) {
          // Direct array response
          dataArray = response;
        } else if (response && Array.isArray(response.data)) {
          // Wrapped in data property
          dataArray = response.data;
        } else if (response && response.item) {
          // Single item response
          dataArray = [response.item];
        } else {
          console.warn('Unexpected response format for interdiction codes:', response);
          dataArray = [];
        }

        return {
          data: dataArray.map((item: any) => ({
            code: item.code || '',
            description: item.description || ''
          }))
        };
      }),
      catchError(error => {
        console.error('Error fetching interdiction codes:', error);
        // Return empty array instead of throwing error to prevent UI crash
        return of({ data: [] });
      })
    );
  }

  /**
   * Get description by code from API
   * GET /api/v1/application-admin/registration-holds-mapping/description/{code}
   * @param code - Code to get description for
   * @returns Observable with description
   */
  getDescriptionByCode(code: string): Observable<{ success: boolean; code: string; description: string }> {
    if (this.USE_MOCK_DATA) {
      const mockCodeOptions: { [key: string]: string } = {
        'ABO001': 'ABO Blood Type Incompatibility',
        'DEF001': 'Permanent Deferral',
        'DEF002': 'Temporary Deferral',
        'MED001': 'Medical Condition Hold',
        'MED002': 'Medication Restriction',
        'TRV001': 'Travel History Hold',
        'TST001': 'Test Results Pending',
        'TST002': 'Failed Screening Test'
      };
      return of({ success: true, code: code, description: mockCodeOptions[code] || '' }).pipe(delay(200));
    }

    const endpoint = API.APPLICATION_ADMIN.REGISTRATION_HOLDS_MAPPING_DESCRIPTION(code);
    return this.apiService.get<{ success: boolean; code: string; description: string }>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching description by code:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Registration Hold (wrapper method for add/edit component)
   */
  addRegistrationHold(data: CreateRegistrationHoldsMappingRequestDto): Observable<ReturnResult<RegistrationHoldsMappingModel>> {
    return this.addRegistrationHoldMapping(data);
  }

  /**
   * Update Registration Hold (wrapper method for add/edit component)
   */
  updateRegistrationHold(data: UpdateRegistrationHoldsMappingRequestDto): Observable<ReturnResult<RegistrationHoldsMappingModel>> {
    return this.updateRegistrationHoldMapping(data);
  }
}
