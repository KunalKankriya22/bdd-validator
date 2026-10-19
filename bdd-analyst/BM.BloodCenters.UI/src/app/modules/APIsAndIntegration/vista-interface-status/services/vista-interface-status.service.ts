import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  VistaInterfaceStatusDto,
  VistaInterfaceStatusQueryDto,
  UpdateVistaInterfaceStatusDto,
  VistaInterfaceStatusListResponse,
  VistaInterfaceStatusSingleResponse,
  VistaInterfaceStatusUpdateResponse,
  StatusOption,
  DriveOption,
  IdpTargetChangeDto
} from '../models/vista-interface-status.model';

@Injectable({
  providedIn: 'root'
})
export class VistaInterfaceStatusService {
  private readonly apiService = inject(ApiService);

  getAll(
    take: number,
    skip: number,
    filters: VistaInterfaceStatusQueryDto
  ): Observable<VistaInterfaceStatusListResponse> {
    return this.apiService.post<VistaInterfaceStatusListResponse>(
      API.VISTA_INTERFACE_STATUS.GET_ALL(take, skip),
      filters
    );
  }

  getById(transactionId: string): Observable<VistaInterfaceStatusDto> {
    return this.apiService.get<VistaInterfaceStatusSingleResponse>(
      API.VISTA_INTERFACE_STATUS.GET_BY_ID(transactionId)
    ).pipe(
      map(response => response.data)
    );
  }

  updateStatus(
    transactionId: string,
    updateDto: UpdateVistaInterfaceStatusDto
  ): Observable<VistaInterfaceStatusUpdateResponse> {
    return this.apiService.put<VistaInterfaceStatusUpdateResponse>(
      API.VISTA_INTERFACE_STATUS.UPDATE_STATUS(transactionId),
      { status: updateDto.idpProcStatus }
    );
  }

  bulkUpdateStatus(
    updates: Map<string, 'P' | 'X'>
  ): Observable<VistaInterfaceStatusUpdateResponse[]> {
    const updateObservables: Observable<VistaInterfaceStatusUpdateResponse>[] = [];

    updates.forEach((newStatus, transactionId) => {
      updateObservables.push(
        this.updateStatus(transactionId, { idpProcStatus: newStatus })
      );
    });

    return new Observable(observer => {
      const results: VistaInterfaceStatusUpdateResponse[] = [];
      let completed = 0;
      const total = updateObservables.length;

      if (total === 0) {
        observer.next([]);
        observer.complete();
        return;
      }

      updateObservables.forEach(obs => {
        obs.subscribe({
          next: (response) => {
            results.push(response);
            completed++;
            if (completed === total) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            observer.error(error);
          }
        });
      });
    });
  }

  getUploadedData(transactionId: string): Observable<IdpTargetChangeDto[]> {
    return this.apiService.get<{ data: IdpTargetChangeDto[] }>(
      API.VISTA_INTERFACE_STATUS.UPLOADED_DATA(transactionId)
    ).pipe(
      map(response => response.data || [])
    );
  }

  getDrivesLov(
    fromDate?: string | null,
    toDate?: string | null
  ): Observable<DriveOption[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);

    return this.apiService.get<{ data: DriveOption[] }>(
      API.VISTA_INTERFACE_STATUS.DRIVES_LOV,
      { params }
    ).pipe(
      map(response => response.data || [])
    );
  }

  getStatusOptions(): StatusOption[] {
    return [
      { value: '', label: 'All' },
      { value: 'P', label: 'Pending' },
      { value: 'C', label: 'Completed' },
      { value: 'R', label: 'Registered' },
      { value: 'W', label: 'Working' },
      { value: 'S', label: 'Sent' },
      { value: 'ER', label: 'Error in Receiving' },
      { value: 'NR', label: 'Never Received' },
      { value: 'X', label: 'Cancel' }
    ];
  }

  getEditableStatusOptions(currentStatus: string | null): StatusOption[] {
    const allOptions = this.getStatusOptions().filter(o => o.value !== '');
    const currentOption = allOptions.find(o => o.value === currentStatus);

    if (currentStatus === 'R') {
      return [
        ...(currentOption ? [currentOption] : []),
        { value: 'X', label: 'Cancel' }
      ];
    }

    const transitions: StatusOption[] = [
      { value: 'P', label: 'Pending' },
      { value: 'X', label: 'Cancel' }
    ];

    if (currentOption && !transitions.some(t => t.value === currentStatus)) {
      return [currentOption, ...transitions];
    }

    return transitions;
  }

  isValidStatusTransition(currentStatus: string | null, newStatus: string): boolean {
    if (!currentStatus) return true;

    if (currentStatus === 'R' && newStatus === 'P') {
      return false;
    }

    return true;
  }
}
