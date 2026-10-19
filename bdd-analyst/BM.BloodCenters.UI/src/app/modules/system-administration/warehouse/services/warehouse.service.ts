import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';

export interface UserDropdownOption {
  userId: string;
  userName: string;
}

/*RESPONSE MODEL*/
export interface WarehouseUserResponse {
  UserId: string;
  WarehouseId: string;
  WarehouseDescription: string | null;
  ChapterId: string;
  ChapterDescription: string | null;
  ChapterName: string;
  EffDate: string;
  TermDate: string | null;
  PrinterId: string | null;
  PrinterDescription: string | null;
  LastModifiedDate: string;
  InsertUser: string | null;
  InsertDate: string | null;
  ProgramId: string | null;
  UserFirstName: string;
  UserLastName: string;
  Status: 'ACTIVE' | 'INACTIVE';
  Department: string;
}

/*FILTER REQUEST MODEL*/
export interface WarehouseFilterRequest {
  chapterIdSearch?: string;
  wareHouseIdSearch?: string;
  chapterIdFilter?: string;
  wareHouseIdFilter?: string;
  startDate?: string;   // ISO
  endDate?: string;     // ISO
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {

  private readonly apiService = inject(ApiService);

  /* GET – /api/v1/valid-warehouse-users/{userId}*/
  getWarehouses(userId: string): Observable<WarehouseUserResponse[]> {
    return this.apiService.get<WarehouseUserResponse[]>(
      API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.GET_BY_USER(userId)
    );
  }

  /* GET – /api/v1/valid-warehouse-users/lov/users */
  getUsersDropdown(): Observable<UserDropdownOption[]> {
    return this.apiService
      .get<{ data: UserDropdownOption[] }>(API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.LOV_USERS)
      .pipe(map(response => response.data || []));
  }

  /*POST – FILTER / SEARCH / SORT /api/v1/valid-warehouse-users/{userId}*/
  filterWarehouses(
    userId: string,
    payload: WarehouseFilterRequest
  ): Observable<WarehouseUserResponse[]> {
    return this.apiService.post<WarehouseUserResponse[]>(
      API.SYSTEM_ADMIN.VALID_WAREHOUSE_USERS.POST_BY_USER(userId),
      payload
    );
  }
}
