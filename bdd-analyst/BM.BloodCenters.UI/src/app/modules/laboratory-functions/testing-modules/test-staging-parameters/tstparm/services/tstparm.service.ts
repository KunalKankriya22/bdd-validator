import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  DropdownItem,
  ParmCodeDetail,
  AssignedParameter,
  BulkUpsertRequest,
  QueryRequest,
  ApiResponse
} from '../models/tstparm.model';

@Injectable({
  providedIn: 'root'
})
export class TstparmService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/critical-controls-for-test`;

  getTestIdsDropdown(): Observable<DropdownItem[]> {
    return this.http.get<ApiResponse<DropdownItem[]>>(`${this.baseUrl}/test-ids/dropdown`)
      .pipe(map(r => r.data ?? []));
  }

  getParmTypesDropdown(testId: string): Observable<DropdownItem[]> {
    return this.http.get<ApiResponse<DropdownItem[]>>(`${this.baseUrl}/parm-types/dropdown/${testId}`)
      .pipe(map(r => r.data ?? []));
  }

  getAllParmCodes(): Observable<ParmCodeDetail[]> {
    return this.http.get<ApiResponse<ParmCodeDetail[]>>(`${this.baseUrl}/parm-codes/all`)
      .pipe(map(r => r.data ?? []));
  }

  getAssignedParameters(testId: string, parmType: string): Observable<AssignedParameter[]> {
    const body: QueryRequest = { testId, parmType };
    return this.http.post<ApiResponse<AssignedParameter[]>>(`${this.baseUrl}/list`, body)
      .pipe(map(r => r.data ?? []));
  }

  saveTestConfiguration(request: BulkUpsertRequest): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.baseUrl}/save`, request);
  }

  deleteParameter(testId: string, parmType: string, parmCode: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.baseUrl}/${testId}/${parmType}/${parmCode}`);
  }
}
