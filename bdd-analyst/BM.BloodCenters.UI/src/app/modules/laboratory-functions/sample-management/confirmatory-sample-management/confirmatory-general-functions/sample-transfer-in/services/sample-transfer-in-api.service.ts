import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { SKIP_ERROR_TOAST, SKIP_AUTH_REDIRECT } from '@core/constants/http-context.constants';
import {
  ApiResponse,
  BoxDropdownItem,
  BoxValidationResult,
  SampleTransferInDetail,
  ContractDropdownItem,
  ProfileSetDropdownItem,
  BatchDropdownItem,
  SampleTypeDropdownItem,
  TestDropdownItem,
  OverrideCodeItem,
  CheckInRequest,
  ContractValidationResult,
  BarcodeSchemeResult,
  DuplicateSampleResult,
  SampleDataResult,
  CopyUnitsResult,
  SampleNotationItem,
  UpdateSampleDetailRequest,
  NotationAccessResult,
} from '../models/sample-transfer-in.model';

@Injectable({ providedIn: 'root' })
export class SampleTransferInApiService {
  private readonly api = inject(ApiService);

  getBoxes(mode: string): Observable<BoxDropdownItem[]> {
    return this.api
      .get<ApiResponse<BoxDropdownItem[]>>(API.SAMPLE_TRANSFER_IN.GET_BOXES(mode))
      .pipe(map(r => r.data ?? []));
  }

  validateBox(boxId: string, mode: string): Observable<BoxValidationResult | null> {
    return this.api
      .get<ApiResponse<BoxValidationResult>>(API.SAMPLE_TRANSFER_IN.VALIDATE_BOX(boxId, mode))
      .pipe(map(r => r.data ?? null));
  }

  getBoxSamples(boxId: string, mode: string): Observable<SampleTransferInDetail[]> {
    return this.api
      .get<ApiResponse<SampleTransferInDetail[]>>(API.SAMPLE_TRANSFER_IN.GET_BOX_SAMPLES(boxId, mode))
      .pipe(map(r => r.data ?? []));
  }

  getContracts(searchTerm?: string): Observable<ContractDropdownItem[]> {
    return this.api
      .get<ApiResponse<ContractDropdownItem[]>>(API.SAMPLE_TRANSFER_IN.GET_CONTRACTS(searchTerm))
      .pipe(map(r => r.data ?? []));
  }

  getProfiles(contractId: string): Observable<ProfileSetDropdownItem[]> {
    return this.api
      .get<ApiResponse<ProfileSetDropdownItem[]>>(API.SAMPLE_TRANSFER_IN.GET_PROFILES(contractId))
      .pipe(map(r => r.data ?? []));
  }

  getBatches(contractId: string): Observable<BatchDropdownItem[]> {
    return this.api
      .get<ApiResponse<BatchDropdownItem[]>>(API.SAMPLE_TRANSFER_IN.GET_BATCHES(contractId))
      .pipe(map(r => r.data ?? []));
  }

  generateBatch(contractId?: string, receivedDate?: string): Observable<string> {
    return this.api
      .post<ApiResponse<{ batchId: string }>>(API.SAMPLE_TRANSFER_IN.GENERATE_BATCH, { contractId, receivedDate })
      .pipe(map(r => r.data?.batchId ?? ''));
  }

  getSampleTypes(): Observable<SampleTypeDropdownItem[]> {
    return this.api
      .get<ApiResponse<SampleTypeDropdownItem[]>>(API.SAMPLE_TRANSFER_IN.GET_SAMPLE_TYPES)
      .pipe(map(r => r.data ?? []));
  }

  getTests(): Observable<TestDropdownItem[]> {
    return this.api
      .get<ApiResponse<TestDropdownItem[]>>(API.SAMPLE_TRANSFER_IN.GET_TESTS)
      .pipe(map(r => r.data ?? []));
  }

  getOverrideReasons(): Observable<OverrideCodeItem[]> {
    return this.api
      .get<ApiResponse<OverrideCodeItem[]>>(API.SAMPLE_TRANSFER_IN.OVERRIDE_REASONS)
      .pipe(map(r => r.data ?? []));
  }

  getOverrideHolds(): Observable<OverrideCodeItem[]> {
    return this.api
      .get<ApiResponse<OverrideCodeItem[]>>(API.SAMPLE_TRANSFER_IN.OVERRIDE_HOLDS)
      .pipe(map(r => r.data ?? []));
  }

  getOverrideComments(): Observable<OverrideCodeItem[]> {
    return this.api
      .get<ApiResponse<OverrideCodeItem[]>>(API.SAMPLE_TRANSFER_IN.OVERRIDE_COMMENTS)
      .pipe(map(r => r.data ?? []));
  }

  checkIn(dto: CheckInRequest): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(API.SAMPLE_TRANSFER_IN.CHECK_IN, dto, {
      context: new HttpContext().set(SKIP_ERROR_TOAST, [409]),
    });
  }

  validateOverrideUser(userId: string, password: string): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(API.SAMPLE_TRANSFER_IN.VALIDATE_OVERRIDE_USER, { userId, password }, {
      context: new HttpContext().set(SKIP_AUTH_REDIRECT, true).set(SKIP_ERROR_TOAST, true),
    });
  }

  validateContract(contractId: string): Observable<ContractValidationResult | null> {
    return this.api
      .get<ApiResponse<ContractValidationResult>>(API.SAMPLE_TRANSFER_IN.VALIDATE_CONTRACT(contractId))
      .pipe(map(r => r.data ?? null));
  }

  getBarcodeScheme(contractId: string): Observable<BarcodeSchemeResult | null> {
    return this.api
      .get<ApiResponse<BarcodeSchemeResult>>(API.SAMPLE_TRANSFER_IN.BARCODE_SCHEME(contractId))
      .pipe(map(r => r.data ?? null));
  }

  checkDuplicateSample(boxId: string, unitId: string, sampleType: string): Observable<DuplicateSampleResult | null> {
    return this.api
      .get<ApiResponse<DuplicateSampleResult>>(API.SAMPLE_TRANSFER_IN.CHECK_DUPLICATE_SAMPLE(boxId, unitId, sampleType))
      .pipe(map(r => r.data ?? null));
  }

  validateUnit(unitId: string): Observable<ApiResponse<any>> {
    return this.api.get<ApiResponse<any>>(API.SAMPLE_TRANSFER_IN.VALIDATE_UNIT(unitId));
  }

  getSampleData(unitId: string, boxId: string): Observable<SampleDataResult | null> {
    return this.api
      .get<ApiResponse<SampleDataResult>>(API.SAMPLE_TRANSFER_IN.SAMPLE_DATA(unitId, boxId))
      .pipe(map(r => r.data ?? null));
  }

  copyUnits(boxId: string, extUnitId: string): Observable<CopyUnitsResult | null> {
    return this.api
      .post<ApiResponse<CopyUnitsResult>>(API.SAMPLE_TRANSFER_IN.COPY_UNITS, { boxId, extUnitId })
      .pipe(map(r => r.data ?? null));
  }

  saveAdhocTests(contractId: string, profileSetId: string, testIds: string[]): Observable<ApiResponse<any>> {
    return this.api.post<ApiResponse<any>>(API.SAMPLE_TRANSFER_IN.ADHOC_TESTS, { contractId, profileSetId, testIds });
  }

  getNotations(unitId: string, showTerminated = 'N'): Observable<SampleNotationItem[]> {
    return this.api
      .get<ApiResponse<SampleNotationItem[]>>(API.SAMPLE_TRANSFER_IN.GET_NOTATIONS(unitId, showTerminated))
      .pipe(map(r => r.data ?? []));
  }

  deleteNotation(notationCode: string, unitId: string): Observable<ApiResponse<any>> {
    return this.api.delete<ApiResponse<any>>(API.SAMPLE_TRANSFER_IN.DELETE_NOTATION(notationCode, unitId));
  }

  updateNotation(dto: { notationCode: string; unitId: string; effDate: string; termDate?: string | null }): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(API.SAMPLE_TRANSFER_IN.UPDATE_NOTATION, dto);
  }

  updateSampleDetail(dto: UpdateSampleDetailRequest): Observable<ApiResponse<any>> {
    return this.api.put<ApiResponse<any>>(API.SAMPLE_TRANSFER_IN.UPDATE_SAMPLE_DETAIL, dto);
  }

  getNotationAccess(): Observable<NotationAccessResult> {
    return this.api
      .get<ApiResponse<NotationAccessResult>>(API.SAMPLE_TRANSFER_IN.NOTATION_ACCESS)
      .pipe(map(r => r.data ?? { canAdd: false, canDelete: false, message: '' }));
  }
}
