import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { LabQcSummaryDto, TestBatchDropdown, BatchUnitsResponse, SaveQcLabelRequest } from '../models/lab-qc-summary.model';
import { ComponentDto } from '../models/component.model';

interface ReturnResult<T = void> {
  success: boolean;
  message: string;
  statusCode: number;
  item?: T;
  data?: T[];
  total?: number;
  errorCode?: string;
  errorResponse?: { errorCode: string; error: string };
}

@Injectable({
  providedIn: 'root'
})
export class LabQcService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/api/v1/lab-qc`;

  getTestBatches(): Observable<TestBatchDropdown[]> {
    return this.http
      .get<ReturnResult<TestBatchDropdown[]>>(`${this.baseUrl}/test-batches`)
      .pipe(map(response => response.item ?? []));
  }

  getBatchUnits(tbId: string): Observable<BatchUnitsResponse> {
    const params = new HttpParams().set('tbId', tbId);

    return this.http
      .get<ReturnResult<BatchUnitsResponse>>(`${this.baseUrl}/batch-units`, { params })
      .pipe(map(response => response.item!));
  }

  getQcSummary(unitId: string, collDate: string): Observable<LabQcSummaryDto> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate);

    return this.http
      .get<ReturnResult<LabQcSummaryDto>>(`${this.baseUrl}/summary`, { params })
      .pipe(map(response => response.item!));
  }

  getComponentDetails(unitId: string, collDate: string): Observable<ComponentDto[]> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('collDate', collDate);

    return this.http
      .get<ReturnResult<LabQcSummaryDto>>(`${this.baseUrl}/component`, { params })
      .pipe(map(response => response.item?.components ?? []));
  }

  saveQcLabels(request: SaveQcLabelRequest): Observable<ReturnResult> {
    return this.http.put<ReturnResult>(`${this.baseUrl}/save`, request);
  }
}
