import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  VehicleDetails,
  VehicleDetailsFilter,
  CreateVehicleDetails,
  UpdateVehicleDetails,
  VehicleNote,
  ReturnResult,
  SingleReturnResult,
  VehicleTypesResponse,
  VehicleIdsResponse
} from '../models/vehicle-details.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { HeaderService } from '@shared/services/header.service';

@Injectable({
  providedIn: 'root'
})
export class VehicleDetailsService {
  private readonly apiService = inject(ApiService);
  private readonly headerService = inject(HeaderService);

  /**
   * Get paginated, filtered, and sorted list of vehicles
   */
  getVehicles(
    filter: VehicleDetailsFilter,
    pageSize: number,
    pageIndex: number
  ): Observable<{ data: VehicleDetails[]; total: number }> {
    const endpoint = API.APPLICATION_ADMIN.VEHICLE_DETAILS(pageSize, pageIndex * pageSize);

    return this.apiService
      .post<ReturnResult<VehicleDetails>>(endpoint, filter)
      .pipe(
        map(res => ({
          data: res.data ?? [],
          total: res.total ?? 0
        }))
      );
  }

  /**
   * Get a single vehicle by ID
   */
  getVehicleById(vehicleId: string): Observable<VehicleDetails> {
    const endpoint = API.APPLICATION_ADMIN.VEHICLE_DETAILS_BY_ID(vehicleId);

    return this.apiService
      .get<SingleReturnResult<VehicleDetails>>(endpoint)
      .pipe(map(res => res.data!));
  }

  /**
   * Get vehicle types for dropdown
   */
  getVehicleTypes(showTerminated: boolean = false): Observable<{ value: string; label: string }[]> {
    return this.apiService
      .get<VehicleTypesResponse>(`${API.APPLICATION_ADMIN.VEHICLE_TYPES}?showTerminated=${showTerminated}`)
      .pipe(
        map(res => (res.data ?? []).map(item => ({
          value: item.code,
          label: item.code
        })))
      );
  }

  /**
   * Get vehicle IDs for dropdown
   */
  getVehicleIds(showTerminated: boolean = false): Observable<{ value: string; label: string }[]> {
    return this.apiService
      .get<VehicleIdsResponse>(`${API.APPLICATION_ADMIN.VEHICLE_IDS}?showTerminated=${showTerminated}`)
      .pipe(
        map(res => (res.data ?? []).map(item => ({
          value: item.code,
          label: `${item.code} - ${item.description}`
        })))
      );
  }

  /**
   * Create a new vehicle
   */
  createVehicle(vehicle: CreateVehicleDetails): Observable<SingleReturnResult<VehicleDetails>> {
    return this.apiService.post(
      API.APPLICATION_ADMIN.VEHICLE_DETAILS_CREATE,
      vehicle
    );
  }

  /**
   * Update an existing vehicle
   */
  updateVehicle(vehicleId: string, vehicle: UpdateVehicleDetails): Observable<SingleReturnResult<VehicleDetails>> {
    return this.apiService.put(
      API.APPLICATION_ADMIN.VEHICLE_DETAILS_UPDATE(vehicleId),
      vehicle
    );
  }

  /**
   * Get notes for a vehicle
   */
  getNotes(vehicleId: string): Observable<VehicleNote[]> {
    return this.apiService
      .get<ReturnResult<VehicleNote>>(API.APPLICATION_ADMIN.VEHICLE_DETAILS_NOTES(vehicleId))
      .pipe(map(res => res.data ?? []));
  }

  /**
   * Add a note to a vehicle
   */
  addNote(vehicleId: string, note: string): Observable<VehicleNote[]> {
    const chapterId = this.headerService.getCurrentChapterId();
    return this.apiService.post<ReturnResult<VehicleNote>>(
      API.APPLICATION_ADMIN.VEHICLE_DETAILS_NOTES(vehicleId),
      { chapterId, note }
    ).pipe(map(res => res.data ?? []));
  }

  /**
   * Update a note
   */
  updateNote(noteId: string, auditKey: number, note: string): Observable<VehicleNote[]> {
    return this.apiService.put<ReturnResult<VehicleNote>>(
      API.APPLICATION_ADMIN.VEHICLE_DETAILS_NOTE_UPDATE(noteId, auditKey.toString()),
      { note }
    ).pipe(map(res => res.data ?? []));
  }

  /**
   * Delete a note
   */
  deleteNote(vehicleId: string, auditKey: number): Observable<SingleReturnResult<void>> {
    return this.apiService.delete(
      API.APPLICATION_ADMIN.VEHICLE_DETAILS_NOTE_DELETE(vehicleId, auditKey.toString())
    );
  }
}
