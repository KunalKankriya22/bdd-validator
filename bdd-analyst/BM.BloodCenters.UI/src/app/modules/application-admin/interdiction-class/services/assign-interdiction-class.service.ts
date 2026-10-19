import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  AssignInterdictionClassModel,
  AssignInterdictionClassParamsDto,
  AssignInterdictionClassFilterLov,
  InterdictionDetailDto,
  InterdictionClassPanelState,
  AssignInterdictionClassDto
} from '../models/assign-interdiction-class.model';
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
export class AssignInterdictionClassService {
  private readonly apiService = inject(ApiService);

  private panelStateSubject = new BehaviorSubject<InterdictionClassPanelState>({
    isOpen: false,
    mode: 'add'
  });

  panelState$ = this.panelStateSubject.asObservable();


  /**
   * Get Assign Interdiction Class table data with pagination
   * @param take - Number of records to fetch
   * @param skip - Number of records to skip
   * @param params - Filter and search parameters
   * @returns Observable with table data and total count
   */
  getAssignInterdictionClass(
    take: number,
    skip: number,
    params: AssignInterdictionClassParamsDto
  ): Observable<{ data: AssignInterdictionClassModel[]; totalRecords: number }> {
    const endpoint = API.APPLICATION_ADMIN.ASSIGN_INTERDICTION_CLASS(take, skip);

    return this.apiService.post<ReturnResult<AssignInterdictionClassModel>>(endpoint, params).pipe(
      map(response => ({
        data: response.data || [],
        totalRecords: response.total || 0
      })),
      catchError(error => {
        console.error('Error fetching assign interdiction class data:', error);
        return throwError(() => error);
      })
    );
  }

  /**
  * Get filter dropdown values (LOV)
  * @returns Observable with filter options
  */
  getAssignInterdictionClassFilters(): Observable<ReturnResult<AssignInterdictionClassFilterLov>> {
    const endpoint = API.APPLICATION_ADMIN.ASSIGN_INTERDICTION_CLASS_FILTERS;

    return this.apiService.get<ReturnResult<AssignInterdictionClassFilterLov>>(endpoint).pipe(
      catchError(error => {
        console.error('Error fetching assign interdiction class filters:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new Interdiction Class
   * POST /api/v1/admin/assign-interdiction-class
   * @param dto - Interdiction class data
   * @returns Observable with result
   */
  addInterdictionClass(dto: AssignInterdictionClassDto): Observable<ReturnResult<AssignInterdictionClassModel>> {
    const endpoint = API.APPLICATION_ADMIN.ADD_EDIT_INTERDICTION_CLASS;

    return this.apiService.post<ReturnResult<AssignInterdictionClassModel>>(endpoint, dto).pipe(
      catchError(error => {
        console.error('Error adding interdiction class:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update existing Interdiction Class
   * PUT /api/v1/admin/assign-interdiction-class
   * @param dto - Interdiction class data
   * @returns Observable with result
   */
  updateInterdictionClass(dto: AssignInterdictionClassDto): Observable<ReturnResult<AssignInterdictionClassModel>> {
    const endpoint = API.APPLICATION_ADMIN.ADD_EDIT_INTERDICTION_CLASS;

    return this.apiService.put<ReturnResult<AssignInterdictionClassModel>>(endpoint, dto).pipe(
      catchError(error => {
        console.error('Error updating interdiction class:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Fetch Description & Type for selected Interdiction Code
   * API: GET /api/v1/application-admin/lab-interdictions/{inter_code}
   * @param interCode - The interdiction code to fetch details for
   * @returns Observable with interdiction details
   */
  getInterdictionByCode(interCode: string): Observable<InterdictionDetailDto> {
    return this.apiService.get<InterdictionDetailDto>(
      API.APPLICATION_ADMIN.GET_LAB_INTERDICTION_BY_CODE(interCode)
    ).pipe(
      catchError(error => {
        console.error('Error fetching interdiction details by code:', error);
        return throwError(() => error);
      })
    );
  }
}