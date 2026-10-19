import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import { InterdictionCodeApiResponse } from '../interfaces/view-interdiction-code.interface';
import { InterdictionCodePayload } from '../models/view-interdiction-codes.model';

@Injectable({
  providedIn: 'root',
})
export class ViewInterdictionCodeService {

  constructor(private apiService: ApiService) {}

  /**
   * POST-based GET API for Lab Interdiction Codes
   * Count is derived from the same response
   */
  getInterdictionCodes(
  payload: InterdictionCodePayload
): Observable<{ data: InterdictionCodeApiResponse[]; totalCount: number }> {

  return this.apiService.post<{
    data: InterdictionCodeApiResponse[];
    totalCount: number;
  }>(
    API.LAB_INTERDICTION_CODES.GET,
    payload
  );
}

}
