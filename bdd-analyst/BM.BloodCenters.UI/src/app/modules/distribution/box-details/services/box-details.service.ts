import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  BoxSearchResult,
  BoxDetails,
  BoxSearchParams,
  BoxesReadyForShipmentParams,
  BoxesReadyForShipmentResponse,
  ApiResponse,
  PaginatedResponse,
  OpenBoxSearchResult,
  OpenBoxPaginatedResponse,
} from '../models/box-details.model';

/**
 * Box Details Service
 * JIRA: MLT-14101
 * Oracle Form: SHQBOXDT (BOXDTQ)
 * Provides API access for box details query functionality
 */
@Injectable({
  providedIn: 'root',
})
export class BoxDetailsService {
  private readonly apiService = inject(ApiService);

  /**
   * Search boxes with filters and pagination
   * GET /box-details/search?fromDate=...&toDate=...&status=...&searchTerm=...&showDiscardAndMfgCustomer=...&pageNumber=...&pageSize=...
   */
  searchBoxes(params: BoxSearchParams): Observable<PaginatedResponse<BoxSearchResult>> {
    let httpParams = new HttpParams();

    if (params.fromDate) {
      httpParams = httpParams.set('fromDate', params.fromDate);
    }

    if (params.toDate) {
      httpParams = httpParams.set('toDate', params.toDate);
    }

    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    if (params.searchTerm) {
      httpParams = httpParams.set('searchTerm', params.searchTerm);
    }

    if (params.showDiscardAndMfgCustomer !== undefined) {
      httpParams = httpParams.set('showDiscardAndMfgCustomer', params.showDiscardAndMfgCustomer.toString());
    }

    if (params.pageNumber !== undefined) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }

    if (params.pageSize !== undefined) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    if (params.sortColumn) {
      httpParams = httpParams.set('sortColumn', params.sortColumn);
    }

    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return this.apiService.get<PaginatedResponse<BoxSearchResult>>(
      API.BOX_DETAILS.SEARCH,
      { params: httpParams }
    );
  }

  /**
   * Search Open Boxes — calls dedicated SHQOPBOX endpoint.
   * GET /box-details/open-boxes?fromDate=...&toDate=...&showDiscardAndMfgCustomer=...&searchTerm=...&pageNumber=...&pageSize=...
   */
  searchOpenBoxes(params: BoxSearchParams): Observable<OpenBoxPaginatedResponse> {
    let httpParams = new HttpParams();
    if (params.fromDate)                       httpParams = httpParams.set('fromDate', params.fromDate);
    if (params.toDate)                         httpParams = httpParams.set('toDate', params.toDate);
    if (params.searchTerm)                     httpParams = httpParams.set('searchTerm', params.searchTerm);
    if (params.showDiscardAndMfgCustomer !== undefined)
      httpParams = httpParams.set('showDiscardAndMfgCustomer', params.showDiscardAndMfgCustomer.toString());
    if (params.pageNumber !== undefined)       httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params.pageSize   !== undefined)       httpParams = httpParams.set('pageSize',   params.pageSize.toString());
    if (params.sortColumn)                     httpParams = httpParams.set('sortColumn', params.sortColumn);
    if (params.sortOrder)                      httpParams = httpParams.set('sortOrder',  params.sortOrder);

    return this.apiService.get<ApiResponse<OpenBoxPaginatedResponse>>(
      API.BOX_DETAILS.SEARCH_OPEN,
      { params: httpParams }
    ).pipe(map((response) => response.data));
  }

  /**
   * Get detailed box information including products
   * GET /box-details/{boxId}?productSortColumn=...&productSortOrder=...
   */
  getBoxDetails(
    boxId: string,
    productSortColumn?: string,
    productSortOrder?: 'ASC' | 'DESC'
  ): Observable<BoxDetails> {
    let httpParams = new HttpParams();

    if (productSortColumn) {
      httpParams = httpParams.set('productSortColumn', productSortColumn);
    }

    if (productSortOrder) {
      httpParams = httpParams.set('productSortOrder', productSortOrder);
    }

    return this.apiService
      .get<ApiResponse<BoxDetails>>(API.BOX_DETAILS.GET_BY_ID(boxId), { params: httpParams })
      .pipe(map((response) => response.data));
  }

  /**
   * Get boxes ready for shipment with pagination
   * GET /api/boxes-ready-for-shipment?sortOrder=...&take=...&skip=...
   * JIRA: MLT-14102, Oracle Form: SHQBOXES
   */
  getBoxesReadyForShipment(params: BoxesReadyForShipmentParams): Observable<BoxesReadyForShipmentResponse> {
    let httpParams = new HttpParams();

    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    if (params.take !== undefined) {
      httpParams = httpParams.set('take', params.take.toString());
    }

    if (params.skip !== undefined) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }

    if (params.searchTerm) {
      httpParams = httpParams.set('searchTerm', params.searchTerm);
    }

    if (params.priority) {
      httpParams = httpParams.set('priority', params.priority);
    }

    if (params.consigneeName) {
      httpParams = httpParams.set('consigneeName', params.consigneeName);
    }

    if (params.packedByName) {
      httpParams = httpParams.set('packedByName', params.packedByName);
    }

    return this.apiService.get<BoxesReadyForShipmentResponse>(
      API.BOXES_READY_FOR_SHIPMENT.GET_ALL,
      { params: httpParams }
    );
  }
}
