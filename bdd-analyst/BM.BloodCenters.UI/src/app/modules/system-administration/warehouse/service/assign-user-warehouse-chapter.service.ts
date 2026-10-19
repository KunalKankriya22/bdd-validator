import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  ValidWarehouseUserDto,
  ApiResponse,
  WarehouseUserLovResponse,
  PrinterLovDto,
  UpdateValidWarehouseUserDto
} from '../interfaces/assign-user-warehouse-chapter.interface';
import { ApiService } from '@shared/services/api.service';
import { LoginService } from '@shared/services/login.service';
import { API } from '../../../../core/constants/api.constants';

@Injectable({ providedIn: 'root' })
export class AssignUserWarehouseChapterService {
  constructor(
    private api: ApiService,
    private loginService: LoginService
  ) { }

  getValidWarehouseUsers(): Observable<ValidWarehouseUserDto[]> {
    return this.api.get<ValidWarehouseUserDto[]>(
      API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.GET
    );
  }

  /**
   * Gets all dropdown data (warehouses + chapters) from master tables.
   * Single API call to load all dropdowns on page load.
   * Printers are loaded separately when warehouse is selected.
   */
  getDropdowns(): Observable<ApiResponse<WarehouseUserLovResponse>> {
    return this.api.get<ApiResponse<WarehouseUserLovResponse>>(
      API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.LOV_DROPDOWNS
    );
  }

  /**
   * Gets printers for a specific warehouse.
   * Called when warehouse is selected.
   * Source: RPT_MASTER_CODES (appl_id = 'DON', code_type = 'LP')
   */
  getPrinters(warehouseId: string): Observable<ApiResponse<PrinterLovDto[]>> {
    return this.api.get<ApiResponse<PrinterLovDto[]>>(
      API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.LOV_PRINTERS(warehouseId)
    );
  }

  createAssignments(
    payload: ValidWarehouseUserDto[]
  ): Observable<ApiResponse<object>> {
    const loggedInUserName = this.loginService.getStoredUsername();
    const params = new HttpParams().set('loggedInUserName', loggedInUserName);

    return this.api.post<ApiResponse<object>>(
      API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.POST,
      payload,
      { params }
    ).pipe(
      catchError(error => {
        console.error('Error creating warehouse assignments:', error);
        return throwError(() => error);
      })
    );
  }

  updateAssignment(
    payload: UpdateValidWarehouseUserDto
  ): Observable<ApiResponse<object>> {
    return this.api.put<ApiResponse<object>>(
      API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.PUT,
      payload
    ).pipe(
      catchError(error => {
        console.error('Error updating warehouse assignment:', error);
        return throwError(() => error);
      })
    );
  }
}
