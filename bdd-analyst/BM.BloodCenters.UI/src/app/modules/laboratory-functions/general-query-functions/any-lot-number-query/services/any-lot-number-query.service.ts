import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  LotTypeLov,
  LotNumberLov,
  AnyLotNumberQueryRequest,
  LotUnitRow,
  LotComponentRow
} from '../models/any-lot-number-query.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  statusCode?: number;
  data?: T;
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnyLotNumberQueryService {
  private readonly apiService = inject(ApiService);

  getLotTypes(): Observable<LotTypeLov[]> {
    return this.apiService.get<ApiResponse<LotTypeLov[]>>(API.LOT_NUMBER_QUERY.LOT_TYPES).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  getLotNumbers(lotType: string): Observable<LotNumberLov[]> {
    return this.apiService.get<ApiResponse<LotNumberLov[]>>(API.LOT_NUMBER_QUERY.LOT_NUMBERS(lotType)).pipe(
      map(response => response.data || []),
      catchError(error => throwError(() => error))
    );
  }

  queryByLotNumber(request: AnyLotNumberQueryRequest): Observable<{ units: LotUnitRow[]; totalUnits: number }> {
    return this.apiService.post<ApiResponse<any[]>>(API.LOT_NUMBER_QUERY.QUERY, {
      lotType: request.lotType,
      lotNumber: request.lotNumber
    }).pipe(
      map(response => {
        const rawUnits: any[] = response.data || [];
        const totalUnits: number = response.total || 0;

        const units: LotUnitRow[] = rawUnits.map((unit: any) => ({
          unitId: unit.unitId,
          collDate: unit.collDate,
          sourceTable: unit.sourceTable,
          components: (unit.components || []).map((comp: any) => ({
            productCode: comp.productCode ?? null,
            componentStatus: comp.componentStatus ?? null,
            systemLabelDecision: comp.systemLabelDecision ?? null,
            aboLabel: comp.aboLabel ?? null,
            destination: comp.destination ?? null
          }))
        }));

        return { units, totalUnits };
      }),
      catchError(error => throwError(() => error))
    );
  }
}
