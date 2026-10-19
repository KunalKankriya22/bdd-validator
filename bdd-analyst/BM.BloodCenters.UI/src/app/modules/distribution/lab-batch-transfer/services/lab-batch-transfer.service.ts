import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReturnResult, BatchTransferResult } from '../models/lab-batch-transfer.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class LabBatchTransferService {
  private readonly apiService = inject(ApiService);

  executeBatchTransfer(): Observable<ReturnResult<BatchTransferResult>> {
    return this.apiService.post<ReturnResult<BatchTransferResult>>(
      API.LAB_BATCH_TRANSFER.EXECUTE,
      null
    );
  }
}
