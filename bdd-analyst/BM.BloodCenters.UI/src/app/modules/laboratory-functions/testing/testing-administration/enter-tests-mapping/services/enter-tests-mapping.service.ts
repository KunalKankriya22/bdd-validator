import { Injectable, inject } from '@angular/core';
import { Observable, of, map, catchError } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  ContractDropdownItem,
  TestDropdownItem,
  TestMappingRow,
  TestMappingSaveRequest,
  SaveResponse,
} from '../models/enter-tests-mapping.model';

interface ReturnResult<T> {
  success: boolean;
  message: string;
  statusCode: number;
  errorCode?: string;
  data: T;
  item: T;
  total?: number;
}

@Injectable({ providedIn: 'root' })
export class EnterTestsMappingService {
  private readonly apiService = inject(ApiService);

  getContractsDropdown(search?: string): Observable<ContractDropdownItem[]> {
    return this.apiService
      .get<ReturnResult<ContractDropdownItem[]>>(
        API.ENTER_TESTS_MAPPING.CONTRACTS_DROPDOWN(search)
      )
      .pipe(
        map((r) => r.data || []),
        catchError(() => of([]))
      );
  }

  getTestsDropdown(contractId: string): Observable<TestDropdownItem[]> {
    return this.apiService
      .get<ReturnResult<TestDropdownItem[]>>(
        API.ENTER_TESTS_MAPPING.TESTS_DROPDOWN(contractId)
      )
      .pipe(
        map((r) => r.data || []),
        catchError(() => of([]))
      );
  }

  getTestMatrix(contractId: string): Observable<TestMappingRow[]> {
    return this.apiService
      .get<ReturnResult<TestMappingRow[]>>(
        API.ENTER_TESTS_MAPPING.GET_MATRIX(contractId)
      )
      .pipe(
        map((r) => r.data || []),
        catchError(() => of([]))
      );
  }

  saveTestMatrix(
    request: TestMappingSaveRequest
  ): Observable<{ message: string; status: string; warnings: { code: string; message: string }[] }> {
    return this.apiService
      .post<ReturnResult<SaveResponse>>(API.ENTER_TESTS_MAPPING.SAVE, request)
      .pipe(
        map((response) => ({
          message: response.message || '',
          status: response.item?.status || 'OK',
          warnings: response.item?.warnings || [],
        }))
      );
  }
}
