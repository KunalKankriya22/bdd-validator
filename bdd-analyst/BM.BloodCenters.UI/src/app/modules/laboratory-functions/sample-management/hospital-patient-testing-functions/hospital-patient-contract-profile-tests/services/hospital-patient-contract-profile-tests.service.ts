import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';
import {
  ContractTest,
  ContractProfileTestTableModel,
  CreateContractTestRequest,
  UpdateContractTestRequest,
  ContractTestQueryDto,
  TestDropdownDto,
  ReturnResult,
  ContractLookup,
  ContractDropdownDto
} from '../models/hospital-patient-contract-profile-tests.model';
import { API } from '@core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class HospitalPatientContractProfileTestsService {
  constructor(private http: HttpClient) {}

  /**
   * Get all contract tests (paginated)
   * POST /contract-tests/{contractId}/{take}/{skip}
   */
  searchContractTests(
    contractId: string,
    take: number,
    skip: number,
    filters?: ContractTestQueryDto
  ): Observable<{ data: ContractProfileTestTableModel[]; total: number }> {
    const url = API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.SEARCH(contractId, take, skip);

    return this.http
      .post<ReturnResult<ContractTest>>(url, filters || {})
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve contract tests');
          }

          // Map API response to table model
          const data = (response.data || []).map(test => this.mapToTableModel(test));
          const total = response.total || 0;

          return { data, total };
        })
      );
  }

  /**
   * Get a specific contract test by ID
   * GET /contract-tests/{contractId}/{testId}
   */
  getContractTestById(contractId: string, testId: string): Observable<ContractProfileTestTableModel> {
    const url = API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.GET_BY_ID(contractId, testId);

    return this.http
      .get<ReturnResult<ContractTest>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve contract test');
          }

          if (!response.data || response.data.length === 0) {
            throw new Error('Contract test not found');
          }

          return this.mapToTableModel(response.data[0]);
        })
      );
  }

  /**
   * Get active tests dropdown
   * GET /contract-tests/tests-dropdown
   */
  getActiveTests(): Observable<TestDropdownDto[]> {
    const url = API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.TESTS_DROPDOWN;

    return this.http
      .get<ReturnResult<TestDropdownDto>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve active tests');
          }

          return response.data || [];
        })
      );
  }

  /**
   * Create a new contract test
   * POST /contract-tests
   */
  createContractTest(payload: CreateContractTestRequest): Observable<void> {
    const url = API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.CREATE;

    return this.http
      .post<ReturnResult<any>>(url, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to create contract test');
          }
        })
      );
  }

  /**
   * Update an existing contract test
   * PUT /contract-tests/{contractId}/{testId}
   */
  updateContractTest(
    contractId: string,
    testId: string,
    payload: UpdateContractTestRequest
  ): Observable<void> {
    const url = API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.UPDATE(contractId, testId);

    return this.http
      .put<ReturnResult<any>>(url, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update contract test');
          }
        })
      );
  }

  /**
   * Delete a contract test
   * DELETE /contract-tests/{contractId}/{testId}
   */
  deleteContractTest(contractId: string, testId: string): Observable<void> {
    const url = API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.DELETE(contractId, testId);

    return this.http
      .delete<ReturnResult<number>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete contract test');
          }

          // Check if record was actually deleted
          if (response.item === 0) {
            throw new Error('Record not found or already deleted');
          }
        })
      );
  }

  /**
   * Get active contracts dropdown
   * GET /contract-tests/contracts-dropdown
   * Returns active contracts for the current user's chapter
   */
  getActiveContracts(): Observable<ContractLookup[]> {
    const url = API.HOSPITAL_PATIENT_CONTRACT_PROFILE_TESTS.CONTRACTS_DROPDOWN;

    return this.http
      .get<ReturnResult<ContractDropdownDto>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve active contracts');
          }

          // Map to UI ContractLookup model
          return (response.data || []).map(contract => ({
            contractId: contract.contractId,
            description: contract.company
          }));
        })
      );
  }

  /**
   * Get Stop Label Flag options (Yes/No)
   * Note: Internal field name is stopLabelFlag but displayed as "Report Results"
   */
  getStopLabelFlagOptions(): Observable<{ code: string; description: string }[]> {
    // Static options
    return new Observable(observer => {
      observer.next([
        { code: 'Y', description: 'Yes - Report results' },
        { code: 'N', description: 'No - Do not report results' }
      ]);
      observer.complete();
    });
  }

  /**
   * Map API ContractTest to table model with formatted dates
   */
  private mapToTableModel(test: ContractTest): ContractProfileTestTableModel {
    return {
      contractId: test.contractId,
      chapterId: test.chapterId,
      testId: test.testId,
      profileSetId: test.profileSetId,
      testDesc: test.testDesc || test.testId,
      stopLabelFlag: test.stopLabelFlag,
      effDate: this.formatDateForDisplay(test.effDate),
      termDate: test.termDate ? this.formatDateForDisplay(test.termDate) : null,
      lastModifiedDate: this.formatDateForDisplay(test.lastModifiedDate),
      programId: test.programId
    };
  }

  /**
   * Format ISO date string to DD-MMM-YYYY
   */
  private formatDateForDisplay(isoDate: string | null): string {
    if (!isoDate) return '-';
    return moment(isoDate).format('DD-MMM-YYYY');
  }
}
