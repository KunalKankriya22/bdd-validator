import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { API } from '../../../core/constants/api.constants';
import {
  ReturnResult,
  ContractLovItem,
  ContractResponse,
  CreateContractRequest,
  UpdateContractRequest,
  ContractTest,
  BulkUpsertContractTests,
  ContactModel,
  BulkSaveContacts,
  CodeDescription,
  TestLovItem,
  ContractSearchRequest,
} from './imported-blood-contract.model';

@Injectable({
  providedIn: 'root',
})
export class ImportedBloodContractService {
  private readonly http = inject(HttpClient);

  searchContracts(request: ContractSearchRequest): Observable<ContractLovItem[]> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.SEARCH}`;
    return this.http.post<ReturnResult<ContractLovItem>>(url, request).pipe(
      map(response => response.data ?? []),
      catchError(this.handleError),
    );
  }

  getById(contractId: string, contractType: string): Observable<ContractResponse | null> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.GET_BY_ID(contractId, contractType)}`;
    return this.http.get<ReturnResult<ContractResponse>>(url).pipe(
      map(response => {
        if (response?.success) {
          return response.item ?? response.data?.[0] ?? null;
        }
        return null;
      }),
      catchError(this.handleError),
    );
  }

  create(request: CreateContractRequest): Observable<ReturnResult<object>> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.CREATE}`;
    return this.http.post<ReturnResult<object>>(url, request).pipe(
      catchError(this.handleError),
    );
  }

  update(contractId: string, contractType: string, request: UpdateContractRequest): Observable<ReturnResult<object>> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.UPDATE(contractId, contractType)}`;
    return this.http.put<ReturnResult<object>>(url, request).pipe(
      catchError(this.handleError),
    );
  }

  deleteContract(contractId: string, contractType: string): Observable<ReturnResult<boolean>> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.DELETE(contractId, contractType)}`;
    return this.http.delete<ReturnResult<boolean>>(url).pipe(
      catchError(this.handleError),
    );
  }

  getContractTests(contractId: string): Observable<ContractTest[]> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.TESTS.GET(contractId)}`;
    return this.http.get<ReturnResult<ContractTest>>(url).pipe(
      map(response => response.data ?? []),
      catchError(this.handleError),
    );
  }

  bulkUpsertTests(contractId: string, request: BulkUpsertContractTests): Observable<ReturnResult<object>> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.TESTS.BULK_UPSERT(contractId)}`;
    return this.http.post<ReturnResult<object>>(url, request).pipe(
      catchError(this.handleError),
    );
  }

  deleteTest(contractId: string, testId: string, auditKey: number): Observable<ReturnResult<boolean>> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.TESTS.DELETE(contractId, testId, auditKey)}`;
    return this.http.delete<ReturnResult<boolean>>(url).pipe(
      catchError(this.handleError),
    );
  }

  getContacts(contractId: string): Observable<ContactModel[]> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.CONTACTS.GET(contractId)}`;
    return this.http.get<ReturnResult<ContactModel>>(url).pipe(
      map(response => response.data ?? []),
      catchError(this.handleError),
    );
  }

  bulkSaveContacts(contractId: string, request: BulkSaveContacts): Observable<ReturnResult<object>> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.CONTACTS.BULK_SAVE(contractId)}`;
    return this.http.post<ReturnResult<object>>(url, request).pipe(
      catchError(this.handleError),
    );
  }

  deleteContact(contractId: string, contactId: number): Observable<ReturnResult<boolean>> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.CONTACTS.DELETE(contractId, contactId)}`;
    return this.http.delete<ReturnResult<boolean>>(url).pipe(
      catchError(this.handleError),
    );
  }

  getStateCodes(): Observable<CodeDescription[]> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.LOV.STATE_CODES}`;
    return this.http.get<ReturnResult<CodeDescription>>(url).pipe(
      map(response => response.data ?? []),
      catchError(this.handleError),
    );
  }

  getCountries(): Observable<CodeDescription[]> {
    const url = `${environment.apiUrl}${API.INTERNATIONAL_ADDRESS.COUNTRIES}`;
    return this.http.get<ReturnResult<CodeDescription>>(url).pipe(
      map(response => response.data ?? []),
      catchError(this.handleError),
    );
  }

  getBarcodeProtocols(): Observable<CodeDescription[]> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.LOV.BARCODE_PROTOCOLS}`;
    return this.http.get<ReturnResult<CodeDescription>>(url).pipe(
      map(response => response.data ?? []),
      catchError(this.handleError),
    );
  }

  getTests(): Observable<TestLovItem[]> {
    const url = `${environment.apiUrl}${API.IMPORTED_BLOOD_CONTRACT.LOV.TESTS}`;
    return this.http.get<ReturnResult<TestLovItem>>(url).pipe(
      map(response => response.data ?? []),
      catchError(this.handleError),
    );
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => error);
  }
}
