import { Injectable, inject } from '@angular/core';
import { Observable, of, map, catchError, throwError, forkJoin } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  AccessManagementModel,
  AccessManagementParamsDto,
  AccessManagementDto,
  UpdateAccessManagementDto,
  AddAccessManagementApiDto,
  UpdateAccessManagementApiDto
} from '../models/access-management.model';

@Injectable({
  providedIn: 'root'
})
export class AccessManagementService {

  private readonly apiService = inject(ApiService);

  // Hardcoded dropdown options (FE)
  private readonly TYPE_OPTIONS = [
    { code: 'R', label: 'Regular donor' },
    { code: 'F', label: 'FastTrak donor' }
  ];

  private readonly ALERT_REQUIRED_OPTIONS = [
    { code: 'Y', label: 'Yes' },
    { code: 'N', label: 'No' }
  ];

  // Cache for loaded data (used for client-side filtering/searching)
  private cachedData: AccessManagementModel[] = [];

  /**
   * Get access management records with filtering and pagination
   * Filter/Search is done client-side on loaded data
   */
  getAccessManagement(
    take: number,
    skip: number,
    params: AccessManagementParamsDto
  ): Observable<{ data: AccessManagementModel[]; totalRecords: number }> {

    // Load data from backend if not cached
    if (this.cachedData.length === 0) {
      return this.apiService.get<any>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG).pipe(
        map(response => {
          // Map API response to UI model
          this.cachedData = this.mapApiResponseToUi(response);
          return this.filterAndPaginateData(this.cachedData, take, skip, params);
        }),
        catchError(error => {
          console.error('Error loading access management data:', error);
          return throwError(() => error);
        })
      );
    }

    // Use cached data for filtering/searching
    return of(this.filterAndPaginateData(this.cachedData, take, skip, params));
  }

  /**
   * Filter and paginate data (client-side)
   */
  private filterAndPaginateData(
    data: AccessManagementModel[],
    take: number,
    skip: number,
    params: AccessManagementParamsDto
  ): { data: AccessManagementModel[]; totalRecords: number } {
    let filteredData = [...data];

    // Apply search filter - only search by function name
    if (params.SearchKeyword) {
      const keyword = params.SearchKeyword.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.functionName?.toLowerCase().includes(keyword)
      );
    }

    // Apply ChapterId filter
    if (params.ChapterId) {
      filteredData = filteredData.filter(item => item.chapterId === params.ChapterId);
    }

    // Apply AlertRequired filter
    if (params.AlertRequired) {
      filteredData = filteredData.filter(item => item.alertRequired === params.AlertRequired);
    }

    // Apply date filters
    if (params.EffectiveDate && params.EffectiveDatePeriod) {
      const filterDate = this.normalizeToDateOnly(params.EffectiveDate);
      if (filterDate) {
        filteredData = filteredData.filter(item => {
          if (!item.effectiveDate) return false;
          const itemDate = this.normalizeToDateOnly(item.effectiveDate);
          if (!itemDate) return false;
          return params.EffectiveDatePeriod === 'After'
            ? itemDate >= filterDate
            : itemDate <= filterDate;
        });
      }
    }

    if (params.TerminationDate && params.TerminationDatePeriod) {
      const filterDate = this.normalizeToDateOnly(params.TerminationDate);
      if (filterDate) {
        filteredData = filteredData.filter(item => {
          if (!item.terminationDate) return false;
          const itemDate = this.normalizeToDateOnly(item.terminationDate);
          if (!itemDate) return false;
          return params.TerminationDatePeriod === 'After'
            ? itemDate >= filterDate
            : itemDate <= filterDate;
        });
      }
    }

    // Apply sorting
    if (params.Sort) {
      filteredData.sort((a, b) => {
        const direction = params.Sort === 'A' ? 1 : -1;
        const aVal = a.chapterId || '';
        const bVal = b.chapterId || '';
        return direction * aVal.localeCompare(bVal);
      });
    }

    const totalRecords = filteredData.length;
    const paginatedData = filteredData.slice(skip, skip + take);

    return {
      data: paginatedData,
      totalRecords
    };
  }

  /**
   * Get filter options for the filter panel (Chapter ID dropdown)
   */
  getAccessManagementFilters(): Observable<any> {
    return this.apiService.get<any>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_CHAPTERS).pipe(
      map(response => {
        // Map API response to filter LOV format
        // API returns: { data: [{ chapterId: "001", chapterName: "Mumbai South Chapter" }, ...] }
        const chaptersData = response.data || response.item || [];
        const chapterIds = chaptersData.map((chapter: any) => chapter.chapterId);

        return {
          item: {
            chapterIds: chapterIds,
            alertRequiredOptions: this.ALERT_REQUIRED_OPTIONS.map(opt => opt.label)
          }
        };
      }),
      catchError(error => {
        console.error('Error loading filter options:', error);
        // Return default values on error
        return of({
          item: {
            chapterIds: [],
            alertRequiredOptions: this.ALERT_REQUIRED_OPTIONS.map(opt => opt.label)
          }
        });
      })
    );
  }

  /**
   * Get dropdown options for the form
   */
  getFormOptions(): Observable<any> {
    return forkJoin({
      functionNames: this.apiService.get<any>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_FUNCTION_NAMES),
      chapters: this.apiService.get<any>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_CHAPTERS)
    }).pipe(
      map(({ functionNames, chapters }) => {
        // API returns: { data: [{ funcName: "ONPDNCON", funcDesc: "Donor Consents" }, ...] }
        const functionNamesData = functionNames.data || functionNames.item || [];
        const functionNamesList = functionNamesData.map((fn: any) => fn.funcName);

        // API returns: { data: [{ chapterId: "001", chapterName: "Mumbai South Chapter" }, ...] }
        const chaptersData = chapters.data || chapters.item || [];
        const chapterIdsList = chaptersData.map((chapter: any) => chapter.chapterId);

        return {
          chapterIds: chapterIdsList,
          types: this.TYPE_OPTIONS.map(opt => opt.label),
          functionNames: functionNamesList,
          alertRequiredOptions: this.ALERT_REQUIRED_OPTIONS.map(opt => opt.label)
        };
      }),
      catchError(error => {
        console.error('Error loading form options:', error);
        return of({
          chapterIds: [],
          types: this.TYPE_OPTIONS.map(opt => opt.label),
          functionNames: [],
          alertRequiredOptions: this.ALERT_REQUIRED_OPTIONS.map(opt => opt.label)
        });
      })
    );
  }

  /**
   * Add a new access management record
   */
  addAccessManagement(dto: AccessManagementDto): Observable<any> {
    // Map UI DTO to API DTO
    const payload: AddAccessManagementApiDto = this.mapToAddApiDto(dto);

    return this.apiService.post<any>(API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG, payload).pipe(
      map(response => {
        // Clear cache to force reload on next getAccessManagement call
        this.cachedData = [];
        return response;
      }),
      catchError(error => {
        console.error('Error adding access management record:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update an existing access management record
   */
  updateAccessManagement(dto: UpdateAccessManagementDto): Observable<any> {
    // Map UI DTO to API DTO
    const payload: UpdateAccessManagementApiDto = this.mapToUpdateApiDto(dto);

    // Get donor type code from current type label
    const donorTypeCode = this.mapTypeToCode(dto.currentType);

    // PUT /donor-survey-manager/access-config/{chapterId}/{donorType}
    return this.apiService.put<any>(
      API.DONOR_FUNCTIONS.DONOR_SURVEY_MANAGER.ACCESS_CONFIG_UPDATE(dto.currentChapterId, donorTypeCode),
      payload
    ).pipe(
      map(response => {
        // Clear cache to force reload on next getAccessManagement call
        this.cachedData = [];
        return response;
      }),
      catchError(error => {
        console.error('Error updating access management record:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Clear cached data (useful when adding/editing records)
   */
  clearCache(): void {
    this.cachedData = [];
  }

  /**
   * Map API response to UI model
   */
  private mapApiResponseToUi(response: any): AccessManagementModel[] {
    const dataArray = Array.isArray(response) ? response : (response.data || response.item || []);

    return dataArray.map((item: any) => ({
      chapterId: item.chapterId || '',
      type: this.mapCodeToType(item.donorType || ''),
      functionName: item.funcName || '',  // Backend returns funcName
      alertRequired: this.mapCodeToAlertRequired(item.alertReq || ''),  // Backend returns alertReq
      effectiveDate: item.effDate ? new Date(item.effDate) : null,  // Backend returns effDate
      terminationDate: item.termDate ? new Date(item.termDate) : null  // Backend returns termDate
    }));
  }

  /**
   * Map UI DTO to Add API DTO
   */
  private mapToAddApiDto(dto: AccessManagementDto): AddAccessManagementApiDto {
    return {
      chapterId: dto.chapterId,
      donorType: this.mapTypeToCode(dto.type),
      funcName: dto.functionName,
      alertReq: this.mapAlertRequiredToCode(dto.alertRequired),
      effDate: dto.effectiveDate ? this.formatDateWithoutTimezone(dto.effectiveDate) : null,
      termDate: dto.terminationDate ? this.formatDateWithoutTimezone(dto.terminationDate) : null
    };
  }

  /**
   * Map UI DTO to Update API DTO (excludes chapterId and effDate)
   */
  private mapToUpdateApiDto(dto: UpdateAccessManagementDto): UpdateAccessManagementApiDto {
    return {
      donorType: this.mapTypeToCode(dto.type),
      funcName: dto.functionName,
      alertReq: this.mapAlertRequiredToCode(dto.alertRequired),
      termDate: dto.terminationDate ? this.formatDateWithoutTimezone(dto.terminationDate) : null
    };
  }

  /**
   * Format date as YYYY-MM-DDTHH:mm:ss.SSS without timezone
   * Parse date string as local date to avoid timezone conversion
   */
  private formatDateWithoutTimezone(dateValue: string | Date): string {
    let date: Date;

    // If dateValue is a string in YYYY-MM-DD format, parse as local date
    if (typeof dateValue === 'string') {
      const [year, month, day] = dateValue.split('-').map(Number);
      date = new Date(year, month - 1, day, 0, 0, 0, 0);
    } else {
      date = new Date(dateValue);
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}T00:00:00.000`;
  }

  /**
   * Map backend code to UI label for Type
   */
  private mapCodeToType(code: string): string {
    const option = this.TYPE_OPTIONS.find(opt => opt.code === code);
    return option ? option.label : code;
  }

  /**
   * Map UI label to backend code for Type
   */
  private mapTypeToCode(label: string): string {
    const option = this.TYPE_OPTIONS.find(opt => opt.label === label);
    return option ? option.code : label;
  }

  /**
   * Map backend code to UI label for Alert Required
   */
  private mapCodeToAlertRequired(code: string): string {
    const option = this.ALERT_REQUIRED_OPTIONS.find(opt => opt.code === code);
    return option ? option.label : code;
  }

  /**
   * Normalize a Date or date-string to a date-only Date (midnight local).
   * Strips the time component so >= / <= comparisons work on date boundaries
   * the same way qa-library compares effective/termination dates.
   */
  private normalizeToDateOnly(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /**
   * Map UI label to backend code for Alert Required
   */
  private mapAlertRequiredToCode(label: string): string | null {
    if (!label || label === 'No') return null;
    const option = this.ALERT_REQUIRED_OPTIONS.find(opt => opt.label === label);
    return option ? option.code : null;
  }
}
