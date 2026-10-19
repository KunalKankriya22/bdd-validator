import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { API } from 'src/app/core/constants/api.constants';
import {
  DriveInterfaceResponse,
  TransferResponse,
  TransferByOption,
  DriveInterfaceFilters
} from '../models/drive-interface-donor-lab.model';

@Injectable({
  providedIn: 'root'
})
export class DriveInterfaceDonorLabApiService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get transfer by options (filter types)
   */
  getTransferByOptions(): Observable<TransferByOption[]> {
    // This endpoint needs to be implemented on backend
    return this.http.get<TransferByOption[]>(`${this.baseUrl}/api/v1/drive-interface/filter-types`);
  }

  /**
   * Get drives list with filters using POST method
   */
  getDrives(filters: DriveInterfaceFilters): Observable<DriveInterfaceResponse> {
    const requestBody = {
      chapterId: filters.chapterId || '',
      filterType: filters.filterType || 'All',
      driveId: filters.driveId || '',
      startDate: filters.startDate ? filters.startDate.toISOString() : null,
      endDate: filters.endDate ? filters.endDate.toISOString() : null,
      sortSequence: filters.sortSequence || 'A'
    };

    return this.http.post<DriveInterfaceResponse>(
      `${this.baseUrl}${API.APPLICATION_ADMIN.DRIVE_INTERFACE_DRIVES}`,
      requestBody
    );
  }

  /**
   * Start drive transfer
   */
  startTransfer(chapterId: string, driveIds: string[]): Observable<TransferResponse> {
    const requestBody = {
      chapterId,
      driveIds
    };

    return this.http.post<TransferResponse>(
      `${this.baseUrl}${API.APPLICATION_ADMIN.DRIVE_INTERFACE_TRANSFER}`,
      requestBody
    );
  }

  /**
   * Transfer a single drive
   */
  transferSingleDrive(chapterId: string, driveId: string): Observable<TransferResponse> {
    const requestBody = {
      chapterId,
      driveIds: [driveId]
    };

    return this.http.post<TransferResponse>(
      `${this.baseUrl}${API.APPLICATION_ADMIN.DRIVE_INTERFACE_TRANSFER}`,
      requestBody
    );
  }
}
