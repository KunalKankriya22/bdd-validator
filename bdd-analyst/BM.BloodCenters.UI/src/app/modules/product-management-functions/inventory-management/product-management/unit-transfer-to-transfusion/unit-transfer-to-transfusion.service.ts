import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';

export interface Facility {
  code: string;
  description: string;
}

export interface TransferToTransfusionResult {
  facilityName: string;
  processStartTime: string;
  processEndTime: string;
  status: string;
  message: string;
}

export interface TransferToTransfusionResponse {
  success: boolean;
  message: string;
  statusCode: number;
  data: TransferToTransfusionResult[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class UnitTransferToTransfusionService {
  private readonly apiService = inject(ApiService);

  getFacilities(): Observable<Facility[]> {
    return this.apiService.get<Facility[]>(API.UNIT_TRANSFER_TO_TRANSFUSION.FACILITIES);
  }

  executeTransfer(facilityId: string): Observable<TransferToTransfusionResponse> {
    return this.apiService.post<TransferToTransfusionResponse>(
      API.UNIT_TRANSFER_TO_TRANSFUSION.EXECUTE,
      { facilityId },
      { context: new HttpContext().set(SKIP_ERROR_TOAST, true) }
    );
  }
}
