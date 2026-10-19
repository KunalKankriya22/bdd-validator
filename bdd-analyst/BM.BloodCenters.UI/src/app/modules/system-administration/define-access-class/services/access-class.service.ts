import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../../shared/services/api.service';
import { AttachedUser, AttachedUsersResponse } from '../models/access-class.model';

@Injectable({
  providedIn: 'root'
})
export class AccessClassService {

  /** BASE URL */
  private readonly base = '/api/v1/define-access-class';

  constructor(private api: ApiService) {}

  /* ===============================
   * ATTACHED USERS
   * GET /api/v1/define-access-class/{accessClass}/attached-users
   * =============================== */
  getAttachedUsers(accessClass: string): Observable<AttachedUser[] | AttachedUsersResponse> {
    return this.api.get<AttachedUser[] | AttachedUsersResponse>(
      `${this.base}/${accessClass}/attached-users`
    );
  }
}
