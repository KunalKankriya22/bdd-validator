import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  ApiResponse,
  OpenTransferSlipDto,
  TransferProductDto,
  CloseTransferRequestDto,
  CloseTransferResponseDto,
  ProductCodeLovDto,
  AliquotLovDto,
  AboRhLovDto,
} from '../models/close-hospital-transfer.model';

@Injectable({ providedIn: 'root' })
export class CloseHospitalTransferApiService {
  private readonly apiService = inject(ApiService);

  getOpenTransferSlips(): Observable<ApiResponse<OpenTransferSlipDto>> {
    return this.apiService
      .get<ApiResponse<OpenTransferSlipDto>>(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.OPEN_SLIPS)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getTransferProducts(pickSlipId: string, sortDirection?: string): Observable<ApiResponse<TransferProductDto>> {
    let params: HttpParams | undefined;
    if (sortDirection) {
      params = new HttpParams().set('sortDirection', sortDirection);
    }
    return this.apiService
      .get<ApiResponse<TransferProductDto>>(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.PRODUCTS(pickSlipId), params ? { params } : undefined)
      .pipe(catchError((error) => throwError(() => error)));
  }

  closeTransfer(request: CloseTransferRequestDto): Observable<ApiResponse<CloseTransferResponseDto>> {
    return this.apiService
      .put<ApiResponse<CloseTransferResponseDto>>(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.CLOSE, request)
      .pipe(catchError((error) => throwError(() => error)));
  }

  getProductCodeLov(
    unitId: string,
    productType: string,
    bloodType: string,
    codeScheme: string,
  ): Observable<ApiResponse<ProductCodeLovDto>> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productType', productType)
      .set('bloodType', bloodType)
      .set('codeScheme', codeScheme);
    return this.apiService
      .get<ApiResponse<ProductCodeLovDto>>(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.PRODUCT_CODE_LOV, { params })
      .pipe(catchError((error) => throwError(() => error)));
  }

  getAliquotLov(
    unitId: string,
    productCode: string,
  ): Observable<ApiResponse<AliquotLovDto>> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productCode', productCode);
    return this.apiService
      .get<ApiResponse<AliquotLovDto>>(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.ALIQUOT_LOV, { params })
      .pipe(catchError((error) => throwError(() => error)));
  }

  getAboRhLov(
    unitId: string,
    productCode: string,
    aliquot: string,
    codeScheme: string,
  ): Observable<ApiResponse<AboRhLovDto>> {
    const params = new HttpParams()
      .set('unitId', unitId)
      .set('productCode', productCode)
      .set('aliquot', aliquot)
      .set('codeScheme', codeScheme);
    return this.apiService
      .get<ApiResponse<AboRhLovDto>>(API.DISTRIBUTION.CLOSE_HOSPITAL_TRANSFER.ABO_LOV, { params })
      .pipe(catchError((error) => throwError(() => error)));
  }
}
