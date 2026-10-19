import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { HttpContext, HttpHeaders } from '@angular/common/http';

import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';

import {
  DonationNoteDto,
  DonationNotesApiResponse,
  DonationNotesAccessApiResponse,
  DonationNotesMutationApiResponse,
  DonationNotesDeleteApiResponse,
  DonationNotesLoadResult,
} from './donation-notes.model';

const SILENT = { context: new HttpContext().set(SKIP_ERROR_TOAST, true) };

@Injectable({ providedIn: 'root' })
export class DonationNotesService {
  private readonly apiService = inject(ApiService);

  loadNotesAndAccess(
    unitId?: string,
    transactionId?: string,
    collectionDate?: string,
    context?: string,
  ): Observable<DonationNotesLoadResult> {
    const notesUrl = this.getNotesUrl(unitId, transactionId, collectionDate);
    const accessUrl = this.getAccessUrl(unitId, transactionId, collectionDate);
    const options = this.buildRequestOptions(context);

    return forkJoin({
      notesResponse: this.apiService.get<DonationNotesApiResponse>(notesUrl, options),
      accessResponse: this.apiService.get<DonationNotesAccessApiResponse>(accessUrl, options),
    }).pipe(
      map(({ notesResponse, accessResponse }) => {
        if (!notesResponse.success) {
          throw new Error(notesResponse.message || 'Failed to load donation notes');
        }
        if (!accessResponse.success) {
          throw new Error(accessResponse.message || 'Failed to load access level');
        }
        return {
          notes: notesResponse.data ?? [],
          access: accessResponse.item,
        };
      }),
    );
  }

  fetchNotes(
    unitId?: string,
    transactionId?: string,
    collectionDate?: string,
    context?: string,
  ): Observable<DonationNoteDto[]> {
    const url = this.getNotesUrl(unitId, transactionId, collectionDate);
    const options = this.buildRequestOptions(context);
    return this.apiService.get<DonationNotesApiResponse>(url, options).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to load donation notes');
        }
        return response.data ?? [];
      }),
    );
  }

  addNote(
    noteText: string,
    unitId?: string,
    transactionId?: string,
    collectionDate?: string,
    context?: string,
  ): Observable<DonationNoteDto[]> {
    const url = this.getNotesUrl(unitId, transactionId, collectionDate);
    const options = this.buildRequestOptions(context);
    return this.apiService
      .post<DonationNotesMutationApiResponse>(url, { note: noteText }, options)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to add note');
          }
          return response.data ?? [];
        }),
      );
  }

  updateNote(
    auditKey: number,
    noteText: string,
    unitId: string,
    collectionDate: string,
    context?: string,
  ): Observable<DonationNoteDto[]> {
    const collDate = this.formatCollectionDate(collectionDate);
    const url = API.DONATION_NOTES.UPDATE_NOTE_BY_UNIT(unitId, collDate, auditKey);
    const options = this.buildRequestOptions(context);
    return this.apiService
      .put<DonationNotesMutationApiResponse>(url, { note: noteText }, options)
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update note');
          }
          return response.data ?? [];
        }),
      );
  }

  deleteNote(
    auditKey: number,
    unitId: string,
    collectionDate: string,
    context?: string,
  ): Observable<boolean> {
    const collDate = this.formatCollectionDate(collectionDate);
    const url = API.DONATION_NOTES.DELETE_NOTE_BY_UNIT(unitId, collDate, auditKey);
    const options = this.buildRequestOptions(context);
    return this.apiService.delete<DonationNotesDeleteApiResponse>(url, options).pipe(
      map((response) => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to delete note');
        }
        return response.item;
      }),
    );
  }

  private getNotesUrl(unitId?: string, transactionId?: string, collectionDate?: string): string {
    if (transactionId && !unitId) {
      return API.DONATION_NOTES.NOTES_BY_TRANSACTION(transactionId);
    }
    const collDate = this.formatCollectionDate(collectionDate);
    return API.DONATION_NOTES.NOTES_BY_UNIT(unitId!, collDate);
  }

  private getAccessUrl(unitId?: string, transactionId?: string, collectionDate?: string): string {
    if (transactionId && !unitId) {
      return API.DONATION_NOTES.ACCESS_BY_TRANSACTION(transactionId);
    }
    const collDate = this.formatCollectionDate(collectionDate);
    return API.DONATION_NOTES.ACCESS_BY_UNIT(unitId!, collDate);
  }

  private formatCollectionDate(dateStr?: string): string {
    if (!dateStr) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  private buildRequestOptions(context?: string): { context: HttpContext; headers?: HttpHeaders } {
    const options: { context: HttpContext; headers?: HttpHeaders } = {
      context: new HttpContext().set(SKIP_ERROR_TOAST, true)
    };
    if (context) {
      options.headers = new HttpHeaders({ 'X-Source-Context': context });
    }
    return options;
  }
}
