import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API } from 'src/app/core/constants/api.constants';
import { ApiService } from '../../../../shared/services/api.service';
import {
  SaveSpecialInstructionsRequest,
  SpecialInstructionDropdownItem,
  SpecialInstructionLine,
  SpecialInstructionsResponse,
} from '../models/maintain-special-instructions.models';

@Injectable({ providedIn: 'root' })
export class MaintainSpecialInstructionsService {
  constructor(private apiService: ApiService) {}

  getDropdownValues(): Observable<SpecialInstructionDropdownItem[]> {
    return this.apiService
      .get<SpecialInstructionDropdownItem[]>(
        API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.DROPDOWN_VALUES,
      )
      .pipe(
        map((res) => res ?? []),
        catchError((err) => {
          console.error('getDropdownValues failed:', err);
          return throwError(() => err);
        }),
      );
  }

  getLinesByLabelCode(labelCode: string): Observable<SpecialInstructionLine[]> {
    return this.apiService
      .get<SpecialInstructionsResponse>(
        API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.GET_BY_LABEL_CODE(labelCode),
      )
      .pipe(
        map((res) => res?.data ?? []),
        catchError((err) => {
          console.error('getLinesByLabelCode failed:', err);
          return throwError(() => err);
        }),
      );
  }

  saveLines(request: SaveSpecialInstructionsRequest): Observable<void> {
    return this.apiService
      .put<void>(API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.SAVE, request)
      .pipe(
        catchError((err) => {
          console.error('saveLines failed:', err);
          return throwError(() => err);
        }),
      );
  }

  saveAll(request: SaveSpecialInstructionsRequest): Observable<void> {
    return this.apiService
      .post<void>(API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.SAVE_ALL, request)
      .pipe(
        catchError((err) => {
          console.error('saveAll failed:', err);
          return throwError(() => err);
        }),
      );
  }

  deleteLine(labelCode: string, lineNumber: number, lineText: string): Observable<void> {
    return this.apiService
      .delete<void>(
        API.DONOR_FUNCTIONS.MAINTAIN_SPECIAL_INSTRUCTIONS.DELETE(labelCode, lineNumber, lineText),
      )
      .pipe(
        catchError((err) => {
          console.error('deleteLine failed:', err);
          return throwError(() => err);
        }),
      );
  }
}
