import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ExtAntApprovalRecord,
  ExtAntApprovalSearchDto,
  ExtAntApprovalCreateDto,
  ExtAntApprovalUpdateDto,
  ExtAntApprovalLookup,
  ExtAntApprovalFilterOption,
} from '../models/ext-ant-approval.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T[];
  total: number;
  item?: T;
  errorResponse: { errorCode: string; error: string };
}

@Injectable({ providedIn: 'root' })
export class ExtAntApprovalService {
  private readonly api = inject(ApiService);

  search(take: number, skip: number, params: ExtAntApprovalSearchDto): Observable<ApiResponse<ExtAntApprovalRecord>> {
    return this.api.post<ApiResponse<ExtAntApprovalRecord>>(
      API.APPLICATION_ADMIN.EXT_ANT_APPROVAL_SEARCH(take, skip),
      params,
    );
  }

  create(dtos: ExtAntApprovalCreateDto[]): Observable<ApiResponse<never>> {
    return this.api.post<ApiResponse<never>>(API.APPLICATION_ADMIN.EXT_ANT_APPROVAL_CREATE, dtos);
  }

  update(dtos: ExtAntApprovalUpdateDto[]): Observable<ApiResponse<never>> {
    return this.api.put<ApiResponse<never>>(API.APPLICATION_ADMIN.EXT_ANT_APPROVAL_UPDATE, dtos);
  }

  delete(auditKey: number): Observable<ApiResponse<never>> {
    return this.api.delete<ApiResponse<never>>(API.APPLICATION_ADMIN.EXT_ANT_APPROVAL_DELETE(auditKey));
  }

  getFilterOptions(): Observable<ApiResponse<ExtAntApprovalFilterOption>> {
    return this.api.get<ApiResponse<ExtAntApprovalFilterOption>>(API.APPLICATION_ADMIN.EXT_ANT_APPROVAL_FILTER_OPTIONS);
  }

  getLookupPrefixes(): Observable<ApiResponse<ExtAntApprovalLookup>> {
    return this.api.get<ApiResponse<ExtAntApprovalLookup>>(API.APPLICATION_ADMIN.EXT_ANT_APPROVAL_LOOKUP_PREFIXES);
  }

  getLookupAntigenTests(): Observable<ApiResponse<ExtAntApprovalLookup>> {
    return this.api.get<ApiResponse<ExtAntApprovalLookup>>(API.APPLICATION_ADMIN.EXT_ANT_APPROVAL_LOOKUP_ANTIGEN_TESTS);
  }

  checkPrefixExists(testBatchPrefix: string): Observable<ApiResponse<never>> {
    return this.api.post<ApiResponse<never>>(API.APPLICATION_ADMIN.EXT_ANT_APPROVAL_CHECK_PREFIX_EXISTS, { testBatchPrefix });
  }
}
