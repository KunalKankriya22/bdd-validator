import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { LoggingService } from '../../../shared/services/logging.service';
import { API } from '../../../core/constants/api.constants';
import {
  AbbreviatedQuestionnaireSetup,
  AbbreviatedQuestionnaireSetupApiResponse,
  DonationTypeLookup,
  DonationTypeLookupApiResponse,
  UpdateAbbreviatedQuestionnaireSetupPayload,
} from './abbreviated-questionnaire-setup.interface';

@Injectable({
  providedIn: 'root',
})
export class AbbreviatedQuestionnaireSetupService {
  private apiService = inject(ApiService);
  private loggingService = inject(LoggingService);

  getSetup(): Observable<AbbreviatedQuestionnaireSetup> {
    this.loggingService.log('Fetching abbreviated questionnaire setup');

    return this.apiService
      .get<AbbreviatedQuestionnaireSetupApiResponse>(
        API.ABBREVIATED_QUESTIONNAIRE.GET
      )
      .pipe(
        map((response) => {
          this.loggingService.log(
            'Successfully fetched abbreviated questionnaire setup'
          );
          const item = response.item || response.data?.[0];
          if (!item) {
            throw new Error('No abbreviated questionnaire setup data found');
          }
          return item;
        }),
        catchError((error) => {
          this.loggingService.error(
            'Error fetching abbreviated questionnaire setup',
            error
          );
          return throwError(() => error);
        })
      );
  }

  getDonationTypes(): Observable<DonationTypeLookup[]> {
    this.loggingService.log('Fetching donation types');

    return this.apiService
      .get<DonationTypeLookupApiResponse>(
        API.ABBREVIATED_QUESTIONNAIRE.DONATION_TYPES
      )
      .pipe(
        map((response) => {
          const types = response.data || [];
          this.loggingService.log('Successfully fetched donation types', {
            count: types.length,
          });
          return types;
        }),
        catchError((error) => {
          this.loggingService.error('Error fetching donation types', error);
          return throwError(() => error);
        })
      );
  }

  updateSetup(
    payload: UpdateAbbreviatedQuestionnaireSetupPayload
  ): Observable<AbbreviatedQuestionnaireSetupApiResponse> {
    this.loggingService.log('Updating abbreviated questionnaire setup');

    return this.apiService
      .put<AbbreviatedQuestionnaireSetupApiResponse>(
        API.ABBREVIATED_QUESTIONNAIRE.UPDATE,
        payload
      )
      .pipe(
        map((response) => {
          if (response.success === false) {
            throw new Error(
              response.error || response.message || 'Failed to update setup'
            );
          }
          this.loggingService.log(
            'Successfully updated abbreviated questionnaire setup'
          );
          return response;
        }),
        catchError((error) => {
          this.loggingService.error(
            'Error updating abbreviated questionnaire setup',
            error
          );
          return throwError(() => error);
        })
      );
  }
}
