import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '../../../../core/constants/api.constants';
import { AddInterdictionCodeModel, EditInterdictionCodeModel } from '../models/view-interdiction-codes.model';
import { InterdictionCodeApiResponse } from '../interfaces/view-interdiction-code.interface';

@Injectable({
  providedIn: 'root',
})
export class AddInterdictionCodeService {

  constructor(private apiService: ApiService) {}

  /**
   * Add a new Lab Interdiction Code
   */
  addInterdictionCode(
    payload: AddInterdictionCodeModel
  ): Observable<InterdictionCodeApiResponse> {
    return this.apiService.post<InterdictionCodeApiResponse>(
      API.LAB_INTERDICTION_CODES.POST,
      payload
    );
  }

  /**
   * Edit/Update an existing Lab Interdiction Code
   */
  updateInterdictionCode(
  interCode: string,
  payload: EditInterdictionCodeModel
): Observable<InterdictionCodeApiResponse> {
  return this.apiService.put<InterdictionCodeApiResponse>(
    `${API.LAB_INTERDICTION_CODES.PUT}/${interCode}`,
    payload
  );
}

}
