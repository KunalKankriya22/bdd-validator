import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import {
  TestBatchDetailDto,
  TestBatchUnitDto,
  TestBatchLovItem,
  TestBatchOption,
  TestKitLovItem,
  TestKitOption,
  PrintableTestDto,
  PrinterOption,
  AssignReagentRequestDto,
  GenerateWorksheetRequestDto,
  WorksheetGenerationResultDto,
  ApiResponse,
  TestBatchTestsResponseDto,
  TestBatchUnitsResponseDto
} from '../models/assign-reagents-to-test-batch.model';

@Injectable({
  providedIn: 'root',
})
export class AssignReagentsToTestBatchService {
  private readonly apiService = inject(ApiService);

  getTestBatchOptions(): Observable<TestBatchOption[]> {
    const url = API.REAGENT_ASSIGNMENT.LOV_TEST_BATCHES;
    return this.apiService
      .get<ApiResponse<TestBatchLovItem[]>>(url)
      .pipe(
        map((response) => {
          const items = response?.data || [];
          return items.map((item) => ({
            id: item.tbId,
            displayName: `${item.tbId} - ${item.insertDate}`,
          }));
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getTestsInBatch(tbId: string): Observable<TestBatchTestsResponseDto> {
    const url = API.REAGENT_ASSIGNMENT.GET_TESTS(tbId);
    return this.apiService
      .get<ApiResponse<TestBatchDetailDto[]>>(url)
      .pipe(
        map((response) => ({
          data: response?.data || [],
          total: response?.total ?? 0
        })),
        catchError((error) => throwError(() => error))
      );
  }

  assignReagentToTest(
    tbId: string,
    testId: string,
    request: AssignReagentRequestDto
  ): Observable<ApiResponse<boolean>> {
    const url = API.REAGENT_ASSIGNMENT.ASSIGN_REAGENT(tbId, testId);
    return this.apiService
      .put<ApiResponse<boolean>>(url, request)
      .pipe(
        catchError((error) => throwError(() => error))
      );
  }

  getUnitsInBatch(tbId: string): Observable<TestBatchUnitsResponseDto> {
    const url = API.REAGENT_ASSIGNMENT.GET_UNITS(tbId);
    return this.apiService
      .get<ApiResponse<TestBatchUnitDto[]>>(url)
      .pipe(
        map((response) => ({
          data: response?.data || [],
          total: response?.total ?? 0
        })),
        catchError((error) => throwError(() => error))
      );
  }

  getTestKitOptions(tbId: string, testId: string): Observable<TestKitOption[]> {
    const url = API.REAGENT_ASSIGNMENT.LOV_TEST_KITS(tbId, testId);
    return this.apiService
      .get<ApiResponse<TestKitLovItem[]>>(url)
      .pipe(
        map((response) => {
          const items = response?.data || [];
          return items.map((item) => ({
            testKitId: item.testKitId,
            displayName: item.testKitClass
              ? `${item.testKitId} (${item.testKitClass})`
              : item.testKitId,
          }));
        }),
        catchError((error) => throwError(() => error))
      );
  }

  getPrinters(): Observable<PrinterOption[]> {
    const url = API.REPORTS.PRINTERS;
    return this.apiService
      .get<ApiResponse<any[]>>(url)
      .pipe(
        map((response) =>
          (response?.data || []).map((item) => ({
            printerId: item.code,
            printerDescription: `${item.code} - ${item.codeDesc}`,
          }))
        ),
        catchError(() => of([]))
      );
  }

  getPrintableTests(tbId: string): Observable<PrintableTestDto[]> {
    const url = API.REAGENT_ASSIGNMENT.PRINTABLE_TESTS(tbId);
    return this.apiService
      .get<ApiResponse<PrintableTestDto[]>>(url)
      .pipe(
        map((response) => response?.data || []),
        catchError((error) => throwError(() => error))
      );
  }

  generateWorksheet(
    tbId: string,
    request: GenerateWorksheetRequestDto
  ): Observable<ApiResponse<WorksheetGenerationResultDto>> {
    const url = API.REAGENT_ASSIGNMENT.GENERATE_WORKSHEET(tbId);
    return this.apiService
      .post<ApiResponse<WorksheetGenerationResultDto>>(url, request)
      .pipe(
        catchError((error) => throwError(() => error))
      );
  }
}
