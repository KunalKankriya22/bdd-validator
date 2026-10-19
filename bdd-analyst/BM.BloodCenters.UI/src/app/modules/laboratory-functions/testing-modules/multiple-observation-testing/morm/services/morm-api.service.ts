import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from 'src/app/core/constants/api.constants';
import {
  MultipleObservationResultMatrixDto,
  SaveMultipleObservationResultMatrixRequestDto,
  ApiResponseWrapper,
  TestLovDto,
  TestTypeLovDto,
  ResultInterpretationLovDto,
  ResultValueLovDto
} from '../models/morm.model';

@Injectable({
  providedIn: 'root',
})
export class MormApiService {
  private readonly apiService = inject(ApiService);

  /**
   * Get Multiple Observation Result Matrix by Test ID and Test Type
   * GET /multiple-observation-result-matrix?testId=X&testType=Y
   * @param testId Test ID (required)
   * @param testType Test Type code (required)
   * @returns Observable with matrix data including test bands and results
   */
  getMatrix(
    testId: string,
    testType: string
  ): Observable<MultipleObservationResultMatrixDto> {
    return this.apiService
      .get<ApiResponseWrapper<MultipleObservationResultMatrixDto>>(
        API.MULTIPLE_OBSERVATION_RESULT_MATRIX.GET_MATRIX(testId, testType)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('getMatrix failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Save Multiple Observation Result Matrix data
   * POST /multiple-observation-result-matrix
   * @param request Matrix data to save
   * @returns Observable with save result
   */
  saveMatrix(
    request: SaveMultipleObservationResultMatrixRequestDto
  ): Observable<ApiResponseWrapper<{ insertedCount: number; updatedCount: number }>> {
    return this.apiService
      .post<ApiResponseWrapper<{ insertedCount: number; updatedCount: number }>>(
        API.MULTIPLE_OBSERVATION_RESULT_MATRIX.SAVE_MATRIX,
        request
      )
      .pipe(
        catchError((error) => {
          console.error('saveMatrix failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get list of valid tests with active bands for LOV dropdown
   * GET /multiple-observation-result-matrix/lov/tests
   * @returns Observable with list of tests
   */
  getTestsLov(): Observable<TestLovDto[]> {
    return this.apiService
      .get<ApiResponseWrapper<TestLovDto[]>>(
        API.MULTIPLE_OBSERVATION_RESULT_MATRIX.LOV_TESTS
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('getTestsLov failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get list of valid test types for a specific test ID
   * GET /multiple-observation-result-matrix/lov/test-types?testId=X
   * @param testId Test ID
   * @returns Observable with list of test types
   */
  getTestTypesLov(testId: string): Observable<TestTypeLovDto[]> {
    return this.apiService
      .get<ApiResponseWrapper<TestTypeLovDto[]>>(
        API.MULTIPLE_OBSERVATION_RESULT_MATRIX.LOV_TEST_TYPES(testId)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('getTestTypesLov failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get list of valid result interpretations for a specific test ID
   * GET /multiple-observation-result-matrix/lov/result-interpretations?testId=X
   * @param testId Test ID
   * @returns Observable with list of result interpretations
   */
  getResultInterpretationsLov(testId: string): Observable<ResultInterpretationLovDto[]> {
    return this.apiService
      .get<ApiResponseWrapper<ResultInterpretationLovDto[]>>(
        API.MULTIPLE_OBSERVATION_RESULT_MATRIX.LOV_RESULT_INTERPRETATIONS(testId)
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('getResultInterpretationsLov failed:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get static list of result values (P/N/I/?/blank)
   * GET /multiple-observation-result-matrix/lov/result-values
   * @returns Observable with list of result values
   */
  getResultValuesLov(): Observable<ResultValueLovDto[]> {
    return this.apiService
      .get<ApiResponseWrapper<ResultValueLovDto[]>>(
        API.MULTIPLE_OBSERVATION_RESULT_MATRIX.LOV_RESULT_VALUES
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('getResultValuesLov failed:', error);
          return throwError(() => error);
        })
      );
  }
}
