import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { HttpContext } from '@angular/common/http';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import { SKIP_ERROR_TOAST } from 'src/app/core/constants/http-context.constants';
import {
  BoxHeaderDto,
  BoxUnitDto,
  FacilityDropdownDto,
  SampleTypeDropdownDto,
  TestIdDropdownDto,
  CreateBoxDto,
  UpdateBoxDto,
  AddUnitToBoxDto,
  UpdateUnitInBoxDto,
  AddTestToSampleDto,
  ValidateUnitDto,
  ValidateUnitResponseDto,
  ReturnResult,
} from '../models/confirmatory-sample-transfer-out.model';

@Injectable({
  providedIn: 'root',
})
export class ConfirmatorySampleTransferOutApiService {
  private readonly apiService = inject(ApiService);

  getOpenBoxes(): Observable<BoxHeaderDto[]> {
    return this.apiService
      .get<ReturnResult<BoxHeaderDto[]>>(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_OPEN_BOXES)
      .pipe(map((response) => response.data || []));
  }

  getBoxDetails(boxId: string): Observable<BoxHeaderDto> {
    return this.apiService
      .get<ReturnResult<BoxHeaderDto[]>>(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_BOX_DETAILS(boxId))
      .pipe(
        map((response) => {
          if (!response.data || response.data.length === 0) {
            throw new Error('Box not found');
          }
          return response.data[0];
        })
      );
  }

  createBox(dto: CreateBoxDto): Observable<string> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ReturnResult<string[]>>(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.CREATE_BOX, dto, { context })
      .pipe(
        map((response) => {
          if (response.success === false) {
            throw {
              error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode },
              message: response.message,
              status: response.statusCode || 400,
            };
          }
          return response.data[0];
        })
      );
  }

  updateBox(boxId: string, dto: UpdateBoxDto): Observable<void> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .put<ReturnResult<void>>(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.UPDATE_BOX(boxId), dto, { context })
      .pipe(
        map((response) => {
          if (response.success === false) {
            throw {
              error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode },
              message: response.message,
              status: response.statusCode || 404,
            };
          }
        })
      );
  }

  closeBox(boxId: string): Observable<void> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ReturnResult<void>>(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.CLOSE_BOX(boxId), {}, { context })
      .pipe(
        map((response) => {
          if (response.success === false) {
            throw {
              error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode },
              message: response.message,
              status: response.statusCode || 404,
            };
          }
        })
      );
  }

  addUnitToBox(boxId: string, dto: AddUnitToBoxDto): Observable<ReturnResult<string[]>> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ReturnResult<string[]>>(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.ADD_UNIT_TO_BOX(boxId), dto, { context });
  }

  updateUnitInBox(boxId: string, sampleSeqNo: string, dto: UpdateUnitInBoxDto): Observable<void> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .put<ReturnResult<void>>(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.UPDATE_UNIT_IN_BOX(boxId, sampleSeqNo), dto, { context }
      )
      .pipe(
        map((response) => {
          if (response.success === false) {
            throw {
              error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode },
              message: response.message,
              status: response.statusCode || 404,
            };
          }
        })
      );
  }

  deleteUnitFromBox(boxId: string, sampleSeqNo: string): Observable<void> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .delete<ReturnResult<void>>(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.DELETE_UNIT_FROM_BOX(boxId, sampleSeqNo), { context }
      )
      .pipe(
        map((response) => {
          if (response.success === false) {
            throw {
              error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode },
              message: response.message,
              status: response.statusCode || 404,
            };
          }
        })
      );
  }

  addTestToSample(sampleSeqNo: string, dto: AddTestToSampleDto): Observable<void> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<ReturnResult<void>>(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.ADD_TEST_TO_SAMPLE(sampleSeqNo), dto, { context }
      )
      .pipe(
        map((response) => {
          if (response.success === false) {
            throw {
              error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode },
              message: response.message,
              status: response.statusCode || 400,
            };
          }
        })
      );
  }

  deleteTestFromSample(sampleSeqNo: string, testId: string): Observable<void> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .delete<ReturnResult<void>>(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.DELETE_TEST_FROM_SAMPLE(sampleSeqNo, testId), { context }
      )
      .pipe(
        map((response) => {
          if (response.success === false) {
            throw {
              error: { message: response.message, statusCode: response.statusCode, errorCode: response.errorCode },
              message: response.message,
              status: response.statusCode || 404,
            };
          }
        })
      );
  }

  validateUnit(dto: ValidateUnitDto): Observable<ValidateUnitResponseDto> {
    const context = new HttpContext().set(SKIP_ERROR_TOAST, true);
    return this.apiService
      .post<any>(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.VALIDATE_UNIT, dto, { context }
      )
      .pipe(
        map((response) => {
          if (response.item) {
            return response.item as ValidateUnitResponseDto;
          }
          if (response.data && response.data.length > 0) {
            return response.data[0] as ValidateUnitResponseDto;
          }
          throw new Error('Invalid validation response');
        })
      );
  }

  getActiveFacilities(): Observable<FacilityDropdownDto[]> {
    return this.apiService
      .get<ReturnResult<FacilityDropdownDto[]>>(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_FACILITIES)
      .pipe(map((response) => response.data || []));
  }

  getActiveSampleTypes(): Observable<SampleTypeDropdownDto[]> {
    return this.apiService
      .get<ReturnResult<SampleTypeDropdownDto[]>>(API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_SAMPLE_TYPES)
      .pipe(map((response) => response.data || []));
  }

  getActiveTestIds(facilityCode: string): Observable<TestIdDropdownDto[]> {
    return this.apiService
      .get<ReturnResult<TestIdDropdownDto[]>>(
        API.CONFIRMATORY_SAMPLE_TRANSFER_OUT.GET_FACILITY_TESTS(facilityCode)
      )
      .pipe(map((response) => response.data || []));
  }
}
