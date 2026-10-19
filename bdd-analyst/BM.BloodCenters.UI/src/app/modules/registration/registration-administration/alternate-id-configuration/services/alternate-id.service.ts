import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AlternateIdDonorGrade,
  AlternateIdForm,
} from '../models/alternate-id.model';
import { AlternateIdApiService } from './alternate-id-api.service';

@Injectable({
  providedIn: 'root',
})
export class AlternateIdService {
  private apiService = inject(AlternateIdApiService);

  /**
   * Get all records (no server-side filtering — filtering is handled client-side)
   */
  getAll(): Observable<AlternateIdDonorGrade[]> {
    return this.apiService.getAll();
  }

  /**
   * Get single record by audit key
   */
  getByAuditKey(auditKey: number): Observable<AlternateIdDonorGrade | undefined> {
    return this.apiService.getByAuditKey(auditKey);
  }

  /**
   * Create new record
   */
  create(form: AlternateIdForm): Observable<AlternateIdDonorGrade> {
    return this.apiService.create(form);
  }

  /**
   * Update existing record
   */
  update(auditKey: number, form: AlternateIdForm): Observable<AlternateIdDonorGrade> {
    return this.apiService.update(auditKey, form);
  }

  /**
   * Delete record
   */
  delete(auditKey: number): Observable<void> {
    return this.apiService.delete(auditKey);
  }
}
