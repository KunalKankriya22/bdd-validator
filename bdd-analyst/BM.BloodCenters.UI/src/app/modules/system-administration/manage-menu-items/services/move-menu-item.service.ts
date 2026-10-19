import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

import { ApiService } from '../../../../shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import {
  MoveMenuItemRequest,
  MoveMenuItemResponse
} from '../models/menu-item.model';

@Injectable({
  providedIn: 'root'
})
export class MoveMenuItemService {
  private apiService = inject(ApiService);

  moveMenuItem(fcnId: number, request: MoveMenuItemRequest): Observable<MoveMenuItemResponse> {
    const endpoint = API.SYSTEM_ADMIN.MENU_ADMIN.MOVE_MENU_ITEM(fcnId);

    return this.apiService.put<MoveMenuItemResponse>(endpoint, request).pipe(
      tap((response) => {
        console.log(`Menu item ${fcnId} moved successfully:`, response);
      }),
      catchError((error) => {
        console.error(`Error moving menu item ${fcnId}:`, error);
        throw error;
      })
    );
  }
}
