import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../../core/constants/api.constants';
import {
  DriveSheetPrintStatusRequest,
  DriveSheetPrintStatusResponse
} from '../models/drive-sheet-print-status.model';

@Injectable({
  providedIn: 'root'
})
export class DriveSheetPrintStatusService {
  private readonly apiService = inject(ApiService);

  searchDrives(request: DriveSheetPrintStatusRequest): Observable<DriveSheetPrintStatusResponse> {
    return this.apiService.post<DriveSheetPrintStatusResponse>(
      API.RECRUITMENT.DRIVE_SHEET_PRINT_STATUS,
      request
    );
  }
}
