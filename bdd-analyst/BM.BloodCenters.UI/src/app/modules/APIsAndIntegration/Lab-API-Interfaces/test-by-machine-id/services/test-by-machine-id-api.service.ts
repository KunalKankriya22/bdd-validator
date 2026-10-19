import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import moment from 'moment';
import { HeaderService } from '@shared/services/header.service';
import {
  InstrumentIdOption,
  InstrumentTestIdOption,
  LifeTrackTestOption,
  TestByMachineIdResponse,
  TestByMachineIdParamsDto,
  TestByMachineIdBulkUpsertDto,
  SaveResponse,
  ApiResponse,
  ValidInstrumentTestScheduleBackendDto,
  ValidInstrumentTestScheduleCreateDto,
  ValidInstrumentTestScheduleUpdateDto,
  InstrumentTestModel,
  ApplicationSchedulingTestModel
} from '../models/test-by-machine-id.model';
import { TestByMachineIdMockService } from './test-by-machine-id-mock.service';

/**
 * ============================================================
 * CONFIGURATION: Toggle between Mock and Real API
 * ============================================================
 * Set USE_MOCK_DATA to:
 *   - true: Use mock data for testing UI without backend
 *   - false: Use real API calls to backend
 * ============================================================
 */
const USE_MOCK_DATA = false; // ✅ Switched to real API

@Injectable({
  providedIn: 'root'
})
export class TestByMachineIdApiService {
  // Updated to match backend API path with /v1 version prefix
  private readonly baseUrl = '/api/v1/valid-instrument-test-schedules';

  // Inject HeaderService to get chapter ID
  private headerService = inject(HeaderService);

  constructor(
    private http: HttpClient,
    private mockService: TestByMachineIdMockService
  ) {}

  /**
   * Get chapter ID from header service (user session)
   */
  private getChapterId(): string {
    return this.headerService.getCurrentChapterId() || '';
  }

  /**
   * Get all available instrument IDs
   * GET /api/v1/valid-instrument-test-schedules/instruments?chapterId={chapterId}
   */
  getInstrumentIds(): Observable<InstrumentIdOption[]> {
    if (USE_MOCK_DATA) {
      return this.mockService.getInstrumentIds();
    }

    const chapterId = this.getChapterId();
    const params = new HttpParams().set('chapterId', chapterId);

    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/instruments`, { params }).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((item: any) => ({
          instrumentId: this.str(item.code || item.instrumentId),
          description: this.str(item.codeDesc || item.description)
        }));
      }),
      catchError(error => {
        console.error('Error loading instrument IDs:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all available instrument test IDs for a specific instrument
   * GET /api/v1/valid-instrument-test-schedules/instrument-tests/{instrumentId}?chapterId={chapterId}
   * @param instrumentId - The instrument ID to get tests for (optional for mock mode)
   */
  getInstrumentTestIds(instrumentId?: string): Observable<InstrumentTestIdOption[]> {
    if (USE_MOCK_DATA) {
      return this.mockService.getInstrumentTestIds();
    }

    if (!instrumentId) {
      console.warn('Instrument ID is required for loading test IDs');
      return of([]);
    }

    const chapterId = this.getChapterId();
    const params = new HttpParams().set('chapterId', chapterId);

    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/instrument-tests/${encodeURIComponent(instrumentId)}`, { params }).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((item: any) => ({
          testId: this.str(item.machineTestId || item.testId),
          description: this.str(item.description)
        }));
      }),
      catchError(error => {
        console.error('Error loading instrument test IDs:', error);
        return of([]);
      })
    );
  }

  /**
   * Retrieve test data by instrument ID and optional test ID
   * GET /api/v1/valid-instrument-test-schedules/{machineId}?chapterId={chapterId}&machineTestId={machineTestId}
   * Note: machineTestId is optional - if not provided, returns all tests for the instrument
   */
  getTestData(params: TestByMachineIdParamsDto): Observable<TestByMachineIdResponse> {
    if (USE_MOCK_DATA) {
      return this.mockService.getTestData(params);
    }

    if (!params.instrumentId) {
      console.warn('instrumentId is required for retrieving test data');
      return of({
        instrumentTests: [],
        applicationSchedulingTests: [],
        totalRecords: 0
      });
    }

    const chapterId = this.getChapterId();
    let httpParams = new HttpParams().set('chapterId', chapterId);

    // Add machineTestId only if provided (optional parameter)
    if (params.testId) {
      httpParams = httpParams.set('machineTestId', params.testId);
    }

    const url = `${this.baseUrl}/${encodeURIComponent(params.instrumentId)}`;

    return this.http.get<ApiResponse<ValidInstrumentTestScheduleBackendDto[]>>(url, { params: httpParams }).pipe(
      map(response => {
        const data = response.data || [];
        return this.transformBackendToFrontend(data);
      }),
      catchError(error => {
        console.error('Error retrieving test data:', error);
        return of({
          instrumentTests: [],
          applicationSchedulingTests: [],
          totalRecords: 0
        });
      })
    );
  }

  /**
   * Save bulk test data (both instrument tests and application scheduling tests)
   * Oracle Forms Pattern: Uses /save endpoint which auto-detects INSERT vs UPDATE
   */
  saveBulkTestData(dto: TestByMachineIdBulkUpsertDto, originalEffDate?: Date | string | null): Observable<SaveResponse> {
    if (USE_MOCK_DATA) {
      return this.mockService.saveBulkTestData(dto);
    }

    // Oracle Forms Pattern: Use /save endpoint for UPSERT
    // Backend will check if record exists and decide INSERT or UPDATE automatically
    const createDto = this.transformFrontendToBackendCreate(dto, originalEffDate);

    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/save`, createDto).pipe(
      map(response => ({
        success: response.success || true,
        message: response.message || 'Test data saved successfully',
        data: response.data
      })),
      catchError(error => {
        console.error('Error saving test data:', error);
        throw error;
      })
    );
  }

  /**
   * Get dropdown options for test fields (if needed for inline editing)
   */
  getTestOptions(): Observable<{ tests: LifeTrackTestOption[]; results: string[] }> {
    if (USE_MOCK_DATA) {
      return this.mockService.getTestOptions();
    }

    const chapterId = this.getChapterId();
    const params = new HttpParams().set('chapterId', chapterId);

    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/lifetrack-tests`, { params }).pipe(
      map(response => {
        const data = response.data || [];
        const tests: LifeTrackTestOption[] = Array.isArray(data)
          ? data.map((item: any) => ({
              testId: this.str(typeof item === 'string' ? item : (item.testId || item.code || item.name || String(item))),
              description: this.str(item.testDesc || item.description),
              testShortId: this.str(item.testShortId),
              testGroup: this.str(item.testGroup)
            }))
          : [];
        return {
          tests,
          results: ['R', 'N', 'NR']
        };
      }),
      catchError(error => {
        console.error('Error loading test options:', error);
        return of({ tests: [], results: [] });
      })
    );
  }

  /**
   * Get test results for a specific test ID
   * GET /api/v1/valid-instrument-test-schedules/test-results/{testId}?chapterId={chapterId}
   */
  getTestResults(testId: string): Observable<string[]> {
    if (USE_MOCK_DATA) {
      return of(['R', 'NR', 'I', 'NT']);
    }

    const chapterId = this.getChapterId();
    const params = new HttpParams().set('chapterId', chapterId);

    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/test-results/${encodeURIComponent(testId)}`, { params }).pipe(
      map(response => {
        const data = response.data || [];
        return data.map((item: any) => this.str(item.resultStatus || item));
      }),
      catchError(error => {
        console.error('Error loading test results:', error);
        return of([]);
      })
    );
  }

  /* ================================ TRANSFORMATION FUNCTIONS ================================ */

  /**
   * Transform backend DTO to frontend models
   * Backend returns a single flat DTO with all fields combined
   * Frontend uses two separate models (Instrument Tests + Application Scheduling Tests)
   */
  private str(value: any): string {
    return (value || '').toString().trim();
  }

  private transformBackendToFrontend(data: any[]): TestByMachineIdResponse {
    const instrumentTests: InstrumentTestModel[] = [];
    const applicationSchedulingTests: ApplicationSchedulingTestModel[] = [];

    data.forEach((item: any) => {
      // Handle both PascalCase and camelCase field names from backend
      const machineId = this.str(item.MachineId || item.machineId);
      const machineTestId = this.str(item.MachineTestId || item.machineTestId);
      const auditKey = item.AuditKey || item.auditKey || 0;

      // Instrument Tests (first 5 tests from backend)
      instrumentTests.push({
        instrumentId: machineId,
        testId: machineTestId,
        test1: this.str(item.TestId1 || item.testId1),
        result1: this.str(item.TestId1Res || item.testId1Res),
        test2: this.str(item.TestId2 || item.testId2),
        result2: this.str(item.TestId2Res || item.testId2Res),
        test3: this.str(item.TestId3 || item.testId3),
        result3: this.str(item.TestId3Res || item.testId3Res),
        test4: this.str(item.TestId4 || item.testId4),
        result4: this.str(item.TestId4Res || item.testId4Res),
        test5: this.str(item.TestId5 || item.testId5),
        result5: this.str(item.TestId5Res || item.testId5Res),
        poolSize: this.parsePoolSize(item.PoolSize || item.poolSize),
        auditKey: Number(auditKey)
      });

      // Application Scheduling Tests
      applicationSchedulingTests.push({
        instrumentId: machineId,
        testId: machineTestId,
        test1: this.str(item.LtSchTestId1 || item.ltSchTestId1),
        result1: this.str(item.LtSchRes1 || item.ltSchRes1),
        test2: this.str(item.LtSchTestId2 || item.ltSchTestId2),
        result2: this.str(item.LtSchRes2 || item.ltSchRes2),
        test3: this.str(item.LtSchTestId3 || item.ltSchTestId3),
        result3: this.str(item.LtSchRes3 || item.ltSchRes3),
        defTest4: this.str(item.LtSchDfltTest4 || item.ltSchDfltTest4),
        result4: this.str(item.LtSchDfltRes4 || item.ltSchDfltRes4),
        defTest5: this.str(item.LtSchDfltTest5 || item.ltSchDfltTest5),
        result5: this.str(item.LtSchDfltRes5 || item.ltSchDfltRes5),
        defTest6: this.str(item.LtSchDfltTest6 || item.ltSchDfltTest6),
        result6: this.str(item.LtSchDfltRes6 || item.ltSchDfltRes6),
        effectiveDate: (item.EffDate || item.effDate) ? this.parseDateFromApi(item.EffDate || item.effDate) : null,
        terminationDate: (item.TermDate || item.termDate) ? this.parseDateFromApi(item.TermDate || item.termDate) : null,
        auditKey: Number(auditKey)
      });
    });

    return {
      instrumentTests,
      applicationSchedulingTests,
      totalRecords: data.length
    };
  }

  /**
   * Transform frontend models to backend CREATE DTO (POST)
   * Uses camelCase and includes all fields including IDs, effDate, and termDate
   */
  private transformFrontendToBackendCreate(dto: TestByMachineIdBulkUpsertDto, originalEffDate?: Date | string | null): ValidInstrumentTestScheduleCreateDto {
    const instTest = dto.InstrumentTests[0]; // Single row
    const appTest = dto.ApplicationSchedulingTests[0];

    return {
      machineId: dto.InstrumentId,
      chapterId: this.getChapterId(),
      machineTestId: dto.TestId,

      // Instrument tests (camelCase)
      testId1: instTest.Test1 || '',
      testId1Res: instTest.Result1 || '',
      testId2: instTest.Test2 || '',
      testId2Res: instTest.Result2 || '',
      testId3: instTest.Test3 || '',
      testId3Res: instTest.Result3 || '',
      testId4: instTest.Test4 || '',
      testId4Res: instTest.Result4 || '',
      testId5: instTest.Test5 || '',
      testId5Res: instTest.Result5 || '',
      testId6: '',
      testId6Res: '',
      poolSize: this.formatPoolSize(instTest.PoolSize) || '',

      // Application tests (camelCase)
      ltSchTestId1: appTest.Test1 || '',
      ltSchRes1: appTest.Result1 || '',
      ltSchTestId2: appTest.Test2 || '',
      ltSchRes2: appTest.Result2 || '',
      ltSchTestId3: appTest.Test3 || '',
      ltSchRes3: appTest.Result3 || '',
      ltSchDfltTest4: appTest.DefTest4 || '',
      ltSchDfltRes4: appTest.Result4 || '',
      ltSchDfltTest5: appTest.DefTest5 || '',
      ltSchDfltRes5: appTest.Result5 || '',
      ltSchDfltTest6: appTest.DefTest6 || '',
      ltSchDfltRes6: appTest.Result6 || '',

      // Dates - already formatted by the component's formatDateForApi; pass through to avoid double conversion
      effDate: appTest.EffectiveDate || null,
      termDate: appTest.TerminationDate || null,
      originalEffDate: originalEffDate ? this.formatDateForApi(originalEffDate) : null
    };
  }

  /**
   * Transform frontend models to backend UPDATE DTO (PUT)
   * Uses camelCase and includes only test fields and termDate
   * IDs (machineId, chapterId, machineTestId) are sent in the URL path
   */
  private transformFrontendToBackendUpdate(dto: TestByMachineIdBulkUpsertDto): ValidInstrumentTestScheduleUpdateDto {
    const instTest = dto.InstrumentTests[0]; // Single row
    const appTest = dto.ApplicationSchedulingTests[0];

    return {
      // Instrument tests (camelCase)
      testId1: instTest.Test1 || '',
      testId1Res: instTest.Result1 || '',
      testId2: instTest.Test2 || '',
      testId2Res: instTest.Result2 || '',
      testId3: instTest.Test3 || '',
      testId3Res: instTest.Result3 || '',
      testId4: instTest.Test4 || '',
      testId4Res: instTest.Result4 || '',
      testId5: instTest.Test5 || '',
      testId5Res: instTest.Result5 || '',
      testId6: '',
      testId6Res: '',
      poolSize: this.formatPoolSize(instTest.PoolSize) || '',

      // Application tests (camelCase)
      ltSchTestId1: appTest.Test1 || '',
      ltSchRes1: appTest.Result1 || '',
      ltSchTestId2: appTest.Test2 || '',
      ltSchRes2: appTest.Result2 || '',
      ltSchTestId3: appTest.Test3 || '',
      ltSchRes3: appTest.Result3 || '',
      ltSchDfltTest4: appTest.DefTest4 || '',
      ltSchDfltRes4: appTest.Result4 || '',
      ltSchDfltTest5: appTest.DefTest5 || '',
      ltSchDfltRes5: appTest.Result5 || '',
      ltSchDfltTest6: appTest.DefTest6 || '',
      ltSchDfltRes6: appTest.Result6 || '',

      // Dates - already formatted by the component's formatDateForApi; pass through to avoid double conversion
      effDate: appTest.EffectiveDate || null,
      termDate: appTest.TerminationDate || null
    };
  }

  /**
   * Parse pool size from string to number (or undefined for special values)
   */
  private parsePoolSize(poolSize: string | null | undefined): number | string | undefined {
    if (!poolSize) return undefined;
    if (poolSize === '>1') return '>1';
    const parsed = parseInt(poolSize, 10);
    return isNaN(parsed) ? undefined : parsed;
  }

  /**
   * Format pool size from number to string for backend
   */
  private formatPoolSize(poolSize: number | string | undefined): string | undefined {
    if (poolSize === undefined || poolSize === null) return undefined;
    if (poolSize === '>1') return '>1';
    return poolSize.toString();
  }

  /**
   * Parse a UTC date string from the API into a local-midnight Date,
   * preventing the off-by-one-day shift in timezones behind UTC.
   */
  private parseDateFromApi(dateStr: string | Date): Date | null {
    if (!dateStr) return null;
    const m = moment.utc(dateStr);
    if (!m.isValid()) return null;
    return new Date(m.year(), m.month(), m.date());
  }

  /**
   * Format date for API (ISO 8601 format)
   */
  private formatDateForApi(date: any): string {
    const m = moment.isMoment(date) ? date : moment(date);
    // Create a UTC date using the local date's year, month, and day to prevent timezone shift
    return moment.utc([m.year(), m.month(), m.date()]).toISOString();
  }
}
