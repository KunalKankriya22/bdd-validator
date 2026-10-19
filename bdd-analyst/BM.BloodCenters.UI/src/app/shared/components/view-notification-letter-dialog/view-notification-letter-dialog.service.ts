import { Injectable, inject } from '@angular/core';
import { HttpContext, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  NotificationLetter,
  NotificationLetterListResponse,
  NotificationLetterTextResponse,
} from './view-notification-letter-dialog.model';

const SILENT = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class ViewNotificationLetterDialogService {
  private readonly apiService = inject(ApiService);

  getLettersForDonor(donorId: string): Observable<NotificationLetter[]> {
    return this.apiService
      .get<NotificationLetterListResponse>(API.NOTIFICATION_LETTERS.GET_ALL(donorId), SILENT)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load notification letters');
          }
          return response.data?.[0]?.letters ?? [];
        }),
      );
  }

  getLetterText(donorId: string, letterSeqNo: string, chapterId: string): Observable<string | null> {
    const params = new HttpParams().set('chapterId', chapterId);
    return this.apiService
      .get<NotificationLetterTextResponse>(
        API.NOTIFICATION_LETTERS.GET_LETTER_TEXT(donorId, letterSeqNo),
        { params, ...SILENT },
      )
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load letter text');
          }
          return response.data?.[0]?.letterText ?? null;
        }),
      );
  }
}
