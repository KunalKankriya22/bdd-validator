import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  CustomerConsigneeProductDetailsDto,
  CustomerConsigneeProductQueryDto,
  CreateCustomerConsigneeProductRequestDto,
  UpdateCustomerConsigneeProductRequestDto,
  ReturnResult,
  CustomerLOV,
  ConsigneeLOV,
  ProductCodeLOV,
  ProductTypeLOV
} from '../models/customer-consignee-product-details.model';

@Injectable({
  providedIn: 'root'
})
export class CustomerConsigneeProductDetailsApiService {
  private readonly apiService = inject(ApiService);

  getCustomerConsigneeProductDetails(
    query: CustomerConsigneeProductQueryDto,
    take: number,
    skip: number
  ): Observable<{ data: CustomerConsigneeProductDetailsDto[]; total: number }> {
    return this.apiService
      .post<ReturnResult<CustomerConsigneeProductDetailsDto>>(
        API.CUSTOMER_CONSIGNEE_PRODUCT.LIST(take, skip),
        query
      )
      .pipe(
        map(response => ({
          data: response.data || [],
          total: response.total || 0
        })),
        catchError(error => {
          console.error('Error loading customer consignee product details:', error);
          return throwError(() => error);
        })
      );
  }

  getCustomerConsigneeProductDetail(
    customerId: string,
    consigneeId?: string | null,
    productType?: string | null,
    productCode?: string | null
  ): Observable<CustomerConsigneeProductDetailsDto | null> {
    let httpParams = new HttpParams();
    if (consigneeId) httpParams = httpParams.set('consigneeId', consigneeId);
    if (productType) httpParams = httpParams.set('productType', productType);
    if (productCode) httpParams = httpParams.set('productCode', productCode);

    return this.apiService
      .get<ReturnResult<CustomerConsigneeProductDetailsDto>>(
        API.CUSTOMER_CONSIGNEE_PRODUCT.GET_BY_ID(customerId),
        { params: httpParams }
      )
      .pipe(
        map(response => response.data?.[0] || response.item || null),
        catchError(error => {
          console.error('Error loading customer consignee product detail:', error);
          return throwError(() => error);
        })
      );
  }

  createCustomerConsigneeProduct(
    dto: CreateCustomerConsigneeProductRequestDto
  ): Observable<ReturnResult<void>> {
    return this.apiService
      .post<ReturnResult<void>>(API.CUSTOMER_CONSIGNEE_PRODUCT.CREATE, dto)
      .pipe(
        catchError(error => {
          console.error('Error creating customer consignee product:', error);
          return throwError(() => error);
        })
      );
  }

  updateCustomerConsigneeProduct(
    customerId: string,
    consigneeId: string | null,
    originalProductType: string | null,
    originalProductCode: string | null,
    dto: UpdateCustomerConsigneeProductRequestDto
  ): Observable<ReturnResult<void>> {
    let httpParams = new HttpParams();
    if (consigneeId) httpParams = httpParams.set('consigneeId', consigneeId);
    if (originalProductType) httpParams = httpParams.set('originalProductType', originalProductType);
    if (originalProductCode) httpParams = httpParams.set('originalProductCode', originalProductCode);

    return this.apiService
      .put<ReturnResult<void>>(
        API.CUSTOMER_CONSIGNEE_PRODUCT.UPDATE(customerId),
        dto,
        { params: httpParams }
      )
      .pipe(
        catchError(error => {
          console.error('Error updating customer consignee product:', error);
          return throwError(() => error);
        })
      );
  }

  getCustomers(): Observable<CustomerLOV[]> {
    return this.apiService
      .get<ReturnResult<CustomerLOV>>(API.CUSTOMER_CONSIGNEE_PRODUCT.LOOKUP_CUSTOMERS)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error loading customers:', error);
          return throwError(() => error);
        })
      );
  }

  getConsigneesByCustomer(customerId: string): Observable<ConsigneeLOV[]> {
    return this.apiService
      .get<ReturnResult<ConsigneeLOV>>(
        API.CUSTOMER_CONSIGNEE_PRODUCT.LOOKUP_CONSIGNEES(customerId)
      )
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error loading consignees:', error);
          return throwError(() => error);
        })
      );
  }

  getProductTypes(): Observable<ProductTypeLOV[]> {
    return this.apiService
      .get<ReturnResult<ProductTypeLOV>>(API.CUSTOMER_CONSIGNEE_PRODUCT.LOOKUP_PRODUCT_TYPES)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error loading product types:', error);
          return throwError(() => error);
        })
      );
  }

  getProductCodes(): Observable<ProductCodeLOV[]> {
    return this.apiService
      .get<ReturnResult<ProductCodeLOV>>(API.CUSTOMER_CONSIGNEE_PRODUCT.LOOKUP_PRODUCT_CODES)
      .pipe(
        map(response => response.data || []),
        catchError(error => {
          console.error('Error loading product codes:', error);
          return throwError(() => error);
        })
      );
  }
}
