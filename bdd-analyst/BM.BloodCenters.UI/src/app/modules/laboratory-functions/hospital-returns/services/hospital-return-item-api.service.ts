import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { API } from 'src/app/core/constants/api.constants';
import { ApiService } from 'src/app/shared/services/api.service';
import {
  HospitalReturnItemDto,
  HospitalReturnItemQueryDto,
  CreateHospitalReturnItemDto,
  UpdateHospitalReturnItemDto,
  HospitalReturnItemApiResponse,
  DropdownOption,
  ReturnCodeOption,
  OpenReturnAdviceResult,
  ReturnAdviceDetail,
  CustomerSearchResult,
  ReturnReasonListResult,
  ProductCodeListResult,
  BloodTypeListResult,
  ContactListResult,
  ScanProductRequest,
  ScanProductResult,
  EvaluateReturnRequest,
  EvaluateReturnResult,
  CommitReturnRequest,
  CommitReturnResult,
  PrinterResult,
  CloseReturnAdviceRequest,
  ReturnAdviceQueryDto,
  CreateReturnAdviceDto,
  UpdateReturnAdviceDto,
} from '../models/hospital-return-item.model';

@Injectable({
  providedIn: 'root',
})
export class HospitalReturnItemApiService {
  private readonly apiService = inject(ApiService);

  getAll(
    queryDto?: HospitalReturnItemQueryDto,
  ): Observable<HospitalReturnItemApiResponse<HospitalReturnItemDto>> {
    return this.apiService.post<HospitalReturnItemApiResponse<HospitalReturnItemDto>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_ALL,
      queryDto || {},
    );
  }

  getById(
    unitId: string,
    returnAdviceId: string,
  ): Observable<HospitalReturnItemApiResponse<HospitalReturnItemDto>> {
    return this.apiService.get<HospitalReturnItemApiResponse<HospitalReturnItemDto>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ID(unitId, returnAdviceId),
    );
  }

  create(
    dto: CreateHospitalReturnItemDto,
  ): Observable<HospitalReturnItemApiResponse<HospitalReturnItemDto>> {
    return this.apiService.post<HospitalReturnItemApiResponse<HospitalReturnItemDto>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_CREATE,
      dto,
    );
  }

  update(
    unitId: string,
    returnAdviceId: string,
    dto: UpdateHospitalReturnItemDto,
  ): Observable<HospitalReturnItemApiResponse<HospitalReturnItemDto>> {
    return this.apiService.put<HospitalReturnItemApiResponse<HospitalReturnItemDto>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_UPDATE(unitId, returnAdviceId),
      dto,
    );
  }

  delete(
    unitId: string,
    returnAdviceId: string,
  ): Observable<HospitalReturnItemApiResponse<boolean>> {
    return this.apiService.delete<HospitalReturnItemApiResponse<boolean>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_DELETE(unitId, returnAdviceId),
    );
  }

  getByReturnAdviceId(
    returnAdviceId?: string | null,
  ): Observable<HospitalReturnItemApiResponse<HospitalReturnItemDto>> {
    let params = new HttpParams();
    if (returnAdviceId) params = params.set('returnAdviceId', returnAdviceId);
    return this.apiService.get<HospitalReturnItemApiResponse<HospitalReturnItemDto>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_GET_BY_ADVICE,
      { params },
    );
  }

  scanProduct(
    request: ScanProductRequest,
  ): Observable<HospitalReturnItemApiResponse<ScanProductResult>> {
    return this.apiService.post<HospitalReturnItemApiResponse<ScanProductResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_SCAN_PRODUCT,
      request,
    );
  }

  evaluateReturn(
    request: EvaluateReturnRequest,
  ): Observable<HospitalReturnItemApiResponse<EvaluateReturnResult>> {
    return this.apiService.post<HospitalReturnItemApiResponse<EvaluateReturnResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_EVALUATE_RETURN,
      request,
    );
  }

  commitReturn(
    request: CommitReturnRequest,
  ): Observable<HospitalReturnItemApiResponse<CommitReturnResult>> {
    return this.apiService.post<HospitalReturnItemApiResponse<CommitReturnResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_COMMIT_RETURN,
      request,
    );
  }

  deleteMultiple(items: HospitalReturnItemDto[]): Observable<boolean> {
    if (items.length === 0) {
      return of(true);
    }
    const deleteObservables = items.map((item) =>
      this.delete(item.unitId, item.returnAdviceId).pipe(
        map((response) => response.success),
      ),
    );
    return forkJoin(deleteObservables).pipe(
      map((results) => results.every((result) => result === true)),
    );
  }

  getPrinters(): Observable<PrinterResult[]> {
    return this.apiService.get<HospitalReturnItemApiResponse<PrinterResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_PRINTERS,
    ).pipe(
      map((response) => response.data || []),
      catchError(() => of([])),
    );
  }

  closeReturnAdvice(
    returnAdviceId: string,
    request: CloseReturnAdviceRequest,
  ): Observable<HospitalReturnItemApiResponse<any>> {
    return this.apiService.put<HospitalReturnItemApiResponse<any>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CLOSE(returnAdviceId),
      request,
    );
  }

  getReturnIds(): Observable<DropdownOption[]> {
    return this.apiService.get<HospitalReturnItemApiResponse<OpenReturnAdviceResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_OPEN,
    ).pipe(
      map((response) =>
        (response.data || []).map((item) => {
          const parts = [item.returnAdviceId];
          if (item.consigneeId) parts.push(item.consigneeId);
          if (item.returnDate) {
            const d = new Date(item.returnDate);
            if (!isNaN(d.getTime())) {
              parts.push(d.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' }));
            }
          }
          return { value: item.returnAdviceId, label: parts.join(' · ') };
        }),
      ),
      catchError(() => of([])),
    );
  }

  getReturnAdviceDetails(returnAdviceId: string): Observable<ReturnAdviceDetail | null> {
    return this.apiService.get<HospitalReturnItemApiResponse<ReturnAdviceDetail>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_GET_BY_ID(returnAdviceId),
    ).pipe(
      map((response) => (response.data && response.data.length > 0) ? response.data[0] : null),
      catchError(() => of(null)),
    );
  }

  getCustomerIds(searchText?: string): Observable<DropdownOption[]> {
    let params = new HttpParams();
    if (searchText) {
      params = params.set('searchText', searchText);
    }
    return this.apiService.get<HospitalReturnItemApiResponse<CustomerSearchResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CUSTOMERS,
      { params },
    ).pipe(
      map((response) =>
        (response.data || []).map((item) => ({
          value: item.customerId,
          label: item.customerName
            ? `${item.customerId} - ${item.customerName}`
            : item.customerId,
        })),
      ),
      catchError(() => of([])),
    );
  }

  getContacts(customerId: string): Observable<DropdownOption[]> {
    const params = new HttpParams().set('customerId', customerId);
    return this.apiService.get<HospitalReturnItemApiResponse<ContactListResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CONTACTS,
      { params },
    ).pipe(
      map((response) =>
        (response.data || []).map((item) => ({
          value: item.returnedBy,
          label: item.returnedBy,
        })),
      ),
      catchError(() => of([])),
    );
  }

  getProductCodes(unitId: string, codeScheme?: string): Observable<DropdownOption[]> {
    let params = new HttpParams().set('unitId', unitId);
    if (codeScheme) {
      params = params.set('codeScheme', codeScheme);
    }
    return this.apiService.get<HospitalReturnItemApiResponse<ProductCodeListResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_PRODUCT_CODES,
      { params },
    ).pipe(
      map((response) =>
        (response.data || []).map((item) => ({
          value: item.productCode,
          label: item.productDescription
            ? `${item.productCode} - ${item.productDescription}`
            : item.productCode,
        })),
      ),
      catchError(() => of([])),
    );
  }

  getAboRhOptions(unitId: string, productCode: string, aliquot?: string, codeScheme?: string, collDate?: string, shipmentNo?: string): Observable<DropdownOption[]> {
    let params = new HttpParams()
      .set('unitId', unitId)
      .set('productCode', productCode);
    if (aliquot) {
      params = params.set('aliquot', aliquot);
    }
    if (codeScheme) {
      params = params.set('codeScheme', codeScheme);
    }
    if (collDate) {
      params = params.set('collDate', collDate);
    }
    if (shipmentNo) {
      params = params.set('shipmentNo', shipmentNo);
    }
    return this.apiService.get<HospitalReturnItemApiResponse<BloodTypeListResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_BLOOD_TYPES,
      { params },
    ).pipe(
      map((response) =>
        (response.data || []).map((item) => ({
          value: item.aboCode,
          label: item.aboDescription
            ? `${item.aboCode} - ${item.aboDescription}`
            : item.aboCode,
        })),
      ),
      catchError(() => of([])),
    );
  }

  getAllReturnAdvices(
    take: number,
    skip: number,
    queryDto?: ReturnAdviceQueryDto,
  ): Observable<HospitalReturnItemApiResponse<ReturnAdviceDetail>> {
    return this.apiService.post<HospitalReturnItemApiResponse<ReturnAdviceDetail>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_GET_ALL(take, skip),
      queryDto || {},
    );
  }

  createReturnAdvice(
    dto: CreateReturnAdviceDto,
  ): Observable<HospitalReturnItemApiResponse<ReturnAdviceDetail>> {
    return this.apiService.post<HospitalReturnItemApiResponse<ReturnAdviceDetail>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_CREATE,
      dto,
    );
  }

  updateReturnAdvice(
    returnAdviceId: string,
    dto: UpdateReturnAdviceDto,
  ): Observable<HospitalReturnItemApiResponse<ReturnAdviceDetail>> {
    return this.apiService.put<HospitalReturnItemApiResponse<ReturnAdviceDetail>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_UPDATE(returnAdviceId),
      dto,
    );
  }

  deleteReturnAdvice(
    returnAdviceId: string,
  ): Observable<HospitalReturnItemApiResponse<boolean>> {
    return this.apiService.delete<HospitalReturnItemApiResponse<boolean>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_DELETE(returnAdviceId),
    );
  }

  getReturnCodes(): Observable<ReturnCodeOption[]> {
    return this.apiService.get<HospitalReturnItemApiResponse<ReturnReasonListResult>>(
      API.APPLICATION_ADMIN.HOSPITAL_RETURNS_ADVICES_RETURN_REASONS,
    ).pipe(
      map((response) =>
        (response.data || []).map((item) => ({
          value: item.code,
          label: item.codeDescription
            ? `${item.code} - ${item.codeDescription}`
            : item.code,
          destination: item.destination ?? '',
          creditNoCredit: item.creditNoCredit ?? '',
        })),
      ),
      catchError(() => of([])),
    );
  }
}
