import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  SponsorContactModel,
  SponsorContactParamsDto,
  SponsorContactCreateDto,
  SponsorLookupItem,
  ContactNameLookupItem,
  SponsorContactDetailModel,
  TitleLookupItem,
  ZipCodeLookupItem
} from '../models/maintain-sponsor-contacts.model';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';

interface ReturnResult<T> {
  Success?: boolean;
  Message?: string;
  Error?: string;
  StatusCode?: number;
  Data?: T[];
  Item?: T;
  Total?: number;
}

/**
 * Normalizes API responses to camelCase regardless of backend casing.
 * Handles both PascalCase and camelCase API responses to prevent silent breakage
 * when backend standardizes response format.
 */
class ResponseNormalizer {
  static getData<T>(response: any): T[] {
    return response.data || response.Data || [];
  }

  static getItem<T>(response: any): T | null {
    return response.item || response.Item || null;
  }

  static getTotal(response: any): number {
    return response.total || response.Total || 0;
  }

  static getDataOrItem<T>(response: any): T | null {
    const item = this.getItem<T>(response);
    if (item) return item;
    const data = this.getData<T>(response);
    return data.length > 0 ? data[0] : null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class MaintainSponsorContactsService {
  private readonly apiService = inject(ApiService);

  getSponsorContacts(
    take: number,
    skip: number,
    params: SponsorContactParamsDto
  ): Observable<{ data: SponsorContactModel[]; totalRecords: number }> {
    const endpoint = API.SPONSOR_CONTACTS.GET_ALL(take, skip);

    return this.apiService.post<any>(endpoint, params).pipe(
      map(response => ({
        data: ResponseNormalizer.getData<SponsorContactModel>(response),
        totalRecords: ResponseNormalizer.getTotal(response)
      })),
      catchError(error => throwError(() => error))
    );
  }

  getSponsorIds(chapterId: string): Observable<SponsorLookupItem[]> {
    return this.apiService.get<any>(API.SPONSOR_CONTACTS.SPONSOR_IDS(chapterId)).pipe(
      map(response => {
        return ResponseNormalizer.getData<any>(response).map((item: any) => ({
          sponsorId: item.sponsorId,
          name: item.name
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  getContactNames(chapterId: string): Observable<ContactNameLookupItem[]> {
    return this.apiService.get<any>(API.SPONSOR_CONTACTS.CONTACT_NAMES(chapterId)).pipe(
      map(response => {
        return ResponseNormalizer.getData<any>(response).map((item: any) => ({
          firstName: item.firstName || '',
          lastName: item.lastName || ''
        }));
      }),
      catchError(error => throwError(() => error))
    );
  }

  createContact(payload: SponsorContactCreateDto): Observable<any> {
    return this.apiService.post(API.SPONSOR_CONTACTS.CREATE, payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getContactDetail(sponsorId: string, addressId: string): Observable<SponsorContactDetailModel> {
    return this.apiService.get<any>(API.SPONSOR_CONTACTS.GET_DETAIL(sponsorId, addressId)).pipe(
      map(response => {
        const detail = ResponseNormalizer.getItem<any>(response);
        if (!detail) return detail as SponsorContactDetailModel;

        // Map notes array - same approach as used in maintain-sponsor-contacts/contact-notes.ts
        if (detail.notes || detail.Notes) {
          const notesArray = detail.notes || detail.Notes || [];
          detail.notes = notesArray.map((n: any) => ({
            noteId: String(n.noteId || n.NoteId || ''),
            contactId: detail.contactId || '',
            notes: n.noteText || n.notes || '',
            createdBy: n.createdBy || n.insertUser || '',
            createdDate: n.createdDate || n.insertDate || '',
            version: n.version || '',
            auditKey: n.auditKey || 0
          }));
        }

        return detail as SponsorContactDetailModel;
      }),
      catchError(error => throwError(() => error))
    );
  }

  updateContact(sponsorId: string, addressId: string, chapterId: string, payload: any): Observable<any> {
    return this.apiService.put(API.SPONSOR_CONTACTS.UPDATE(sponsorId, addressId, chapterId), payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  addContactNote(sponsorId: string, addressId: string, chapterId: string, payload: { noteText: string; insertUser: string }): Observable<any> {
    return this.apiService.post(API.SPONSOR_CONTACTS.ADD_NOTE(sponsorId, addressId, chapterId), payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  updateContactNote(noteId: string, auditKey: number, payload: { noteText: string; insertUser?: string }): Observable<any> {
    return this.apiService.put(API.SPONSOR_CONTACTS.UPDATE_NOTE(noteId, auditKey), payload).pipe(
      catchError(error => throwError(() => error))
    );
  }

  deleteContactNote(sponsorId: string, addressId: string, auditKey: number): Observable<any> {
    return this.apiService.delete(API.SPONSOR_CONTACTS.DELETE_NOTE(sponsorId, addressId, auditKey)).pipe(
      catchError(error => throwError(() => error))
    );
  }

  getContactTypes(): Observable<TitleLookupItem[]> {
    return this.apiService.get<any>(API.SPONSOR_CONTACTS.CONTACT_TYPES).pipe(
      map(response => ResponseNormalizer.getData<TitleLookupItem>(response)),
      catchError(error => throwError(() => error))
    );
  }

  getSalutations(): Observable<TitleLookupItem[]> {
    return this.apiService.get<any>(API.SPONSOR_CONTACTS.SALUTATIONS).pipe(
      map(response => ResponseNormalizer.getData<TitleLookupItem>(response)),
      catchError(error => throwError(() => error))
    );
  }

  getTitles(): Observable<TitleLookupItem[]> {
    return this.apiService.get<any>(API.SPONSOR_CONTACTS.TITLES).pipe(
      map(response => ResponseNormalizer.getData<TitleLookupItem>(response)),
      catchError(error => throwError(() => error))
    );
  }

  getZipCodes(zipCode: string): Observable<ZipCodeLookupItem[]> {
    return this.apiService.get<any>(API.SPONSOR_CONTACTS.ZIP_CODES(zipCode)).pipe(
      map(response => ResponseNormalizer.getData<ZipCodeLookupItem>(response)),
      catchError(error => throwError(() => error))
    );
  }

  getCountries(): Observable<TitleLookupItem[]> {
    return this.apiService.get<any>(API.SPONSOR_CONTACTS.COUNTRIES).pipe(
      map(response => ResponseNormalizer.getData<TitleLookupItem>(response)),
      catchError(error => throwError(() => error))
    );
  }

  getLookupValues(lookupType: string): Observable<string[]> {
    return this.apiService.get<ReturnResult<any>>(API.SPONSOR_CONTACTS.LOOKUPS(lookupType)).pipe(
      map(response => ResponseNormalizer.getData<string>(response)),
      catchError(error => throwError(() => error))
    );
  }

}
