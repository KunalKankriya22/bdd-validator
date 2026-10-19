import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';
import {
  ApiResponse,
  Contract,
  ContractWithDetails,
  SaveContractRequest,
  SaveContractResponse,
  MasterCode,
  ValidTest,
  State,
  Country,
  Contact,
  ContractTest,
  InternalContractParamsDto,
  InternalContractListResponse,
  ContractListItem
} from './internal-contract.models';

/**
 * Service for Internal Contract API operations
 *
 * TODO: Update API endpoints when backend implementation is available
 * Current endpoints are placeholders following the existing API pattern
 */
@Injectable({
  providedIn: 'root'
})
export class InternalContractService {
  private readonly http = inject(HttpClient);

  // TODO: Add to src/app/core/constants/api.constants.ts
  private readonly baseUrl = `${environment.apiUrl}/api/v1/internal-contracts`;

  /**
   * Get paginated list of contracts with filtering and search
   * @param take - Number of records per page
   * @param skip - Number of records to skip
   * @param params - Filter/search parameters
   */
  getInternalContracts(
    take: number,
    skip: number,
    params: InternalContractParamsDto
  ): Observable<InternalContractListResponse> {
    return this.http.post<ApiResponse<ContractListItem[]>>(
      `${this.baseUrl}/list/${take}/${skip}`,
      params
    ).pipe(
      map(response => ({
        data: response.data || [],
        total: response.total || 0,
        totalRecords: response.total || 0
      }))
    );
  }

  /**
   * Get all contracts for the current chapter
   */
  getAll(): Observable<Contract[]> {
    return this.http.get<ApiResponse<Contract[]>>(this.baseUrl)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get contract by ID with all related data
   * @param contractId - Contract ID to retrieve
   */
  getById(contractId: string): Observable<ContractWithDetails> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/${contractId}`)
      .pipe(map(response => {
        const data = response.data!;
        // Map backend response (modifiedDate) to frontend interface (lastModifiedDate) for tests
        if (data.tests && Array.isArray(data.tests)) {
          data.tests = data.tests.map((test: any) => ({
            ...test,
            lastModifiedDate: test.modifiedDate || test.lastModifiedDate
          }));
        }
        return data;
      }));
  }

  /**
   * Create a new contract
   * @param request - Contract data with contacts and tests
   */
  create(request: SaveContractRequest): Observable<SaveContractResponse> {
    const flatDto = this.flattenRequest(request);
    return this.http.post<ApiResponse<SaveContractResponse>>(this.baseUrl, flatDto)
      .pipe(map(response => response.data!));
  }

  /**
   * Update existing contract
   * @param contractId - Contract ID to update
   * @param request - Updated contract data (nested or already flat)
   */
  update(contractId: string, request: SaveContractRequest | Record<string, any>): Observable<SaveContractResponse> {
    const isNested = typeof request === 'object' && request !== null && 'contract' in request && request.contract != null;
    const flatDto = isNested ? this.flattenRequest(request as SaveContractRequest) : request;
    return this.http.put<ApiResponse<SaveContractResponse>>(`${this.baseUrl}/${contractId}`, flatDto)
      .pipe(map(response => response.data!));
  }

  /**
   * Flatten nested SaveContractRequest into flat DTO matching backend Create/UpdateContractRequestDto
   */
  private flattenRequest(request: SaveContractRequest): Record<string, any> {
    const c = request.contract;
    const a = request.address;
    return {
      contractType: c.contractType,
      contractId: c.contractId,
      company: c.company,
      addressId: c.addressId ?? null,
      taxIdForm: c.taxIdForm ?? null,
      barCodeProtocol: c.barCodeProtocol,
      unitIdPattern: c.unitIdPattern ?? null,
      ediInputInd: c.ediInputInd ?? null,
      resultOutputInd: c.resultOutputInd,
      confirmTestFlag: c.confirmTestFlag ?? null,
      effDate: c.effDate,
      termDate: c.termDate ?? null,
      addr1: a?.addr1 ?? a?.addressLine1 ?? null,
      addr2: a?.addr2 ?? a?.addressLine2 ?? null,
      addr3: a?.addr3 ?? null,
      city: a?.city ?? null,
      stateCode: a?.stateCode ?? null,
      zip: a?.zip ?? a?.zipCode ?? null,
      country: a?.country ?? null,
      intFlag: a?.intFlag ?? null,
    };
  }

  /**
   * Delete a contract
   * @param contractId - Contract ID to delete
   */
  delete(contractId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${contractId}`)
      .pipe(map(() => undefined));
  }

  // ===== Lookup Methods =====

  /**
   * Get contract types from MASTER_CODES (CONTR)
   */
  getContractTypes(): Observable<MasterCode[]> {
    return this.http.get<ApiResponse<MasterCode[]>>(`${this.baseUrl}/lookups/contract-types`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get barcode protocols from MASTER_CODES (BARCD)
   */
  getBarcodeProtocols(): Observable<MasterCode[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/lookups/barcode-protocols`)
      .pipe(map(response => {
        const data = response.data || response.item || [];
        // Map backend response (code, description) to frontend interface (codeValue, codeDescription)
        return data.map((item: any) => ({
          codeType: 'BARCD',
          codeValue: item.code,
          codeDescription: item.description
        }));
      }));
  }

  /**
   * Get valid tests for the current chapter
   */
  getValidTests(): Observable<ValidTest[]> {
    return this.http.get<ApiResponse<ValidTest[]>>(`${this.baseUrl}/lookups/valid-tests`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get states lookup
   */
  getStates(): Observable<State[]> {
    // TODO: Use centralized states endpoint if available
    return this.http.get<ApiResponse<State[]>>(`${this.baseUrl}/lookups/states`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get chapters for filter dropdown
   */
  getChapters(): Observable<Array<{chapterId: string; chapterName: string}>> {
    return this.http.get<ApiResponse<Array<{chapterId: string; chapterName: string}>>>(
      `${this.baseUrl}/lookups/chapters`
    ).pipe(map(response => response.data || []));
  }

  /**
   * Get active chapters for add/edit dropdown
   */
  getActiveChapters(): Observable<Array<{chapterId: string; chapterName: string}>> {
    return this.http.get<ApiResponse<Array<{chapterId: string; chapterName: string}>>>(
      `${this.baseUrl}/lookups/active-chapters`
    ).pipe(map(response => response.data || []));
  }

  /**
   * Get countries lookup
   */
  getCountries(): Observable<Country[]> {
    // TODO: Use centralized countries endpoint if available
    return this.http.get<ApiResponse<Country[]>>(`${this.baseUrl}/lookups/countries`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Get contracts LOV (simple list with contractId and company) for dropdown.
   * Automatically filtered by user's chapter via X-ChapterId header.
   * Matches FMB LOV behavior.
   */
  getContractsLov(): Observable<Array<{contractId: string; company: string}>> {
    return this.http.get<ApiResponse<Array<{contractId: string; company: string}>>>(
      `${this.baseUrl}/lookups/contracts`
    ).pipe(map(response => response.data || []));
  }

  // ===== Contact Operations =====

  /**
   * Get all contacts for a contract
   * @param contractId - Contract ID
   */
  getContacts(contractId: string): Observable<Contact[]> {
    return this.http.get<ApiResponse<Contact[]>>(`${this.baseUrl}/${contractId}/contacts`)
      .pipe(map(response => response.data || []));
  }

  /**
   * Create a contact
   * @param contractId - Contract ID
   * @param contact - Contact data
   */
  createContact(contractId: string, contact: Contact): Observable<Contact> {
    return this.http.post<ApiResponse<Contact>>(`${this.baseUrl}/${contractId}/contacts`, contact)
      .pipe(map(response => response.data!));
  }

  /**
   * Update a contact
   * @param contractId - Contract ID
   * @param contactId - Contact ID
   * @param contact - Updated contact data
   */
  updateContact(contractId: string, contactId: number, contact: Contact): Observable<Contact> {
    return this.http.put<ApiResponse<Contact>>(`${this.baseUrl}/${contractId}/contacts/${contactId}`, contact)
      .pipe(map(response => response.data!));
  }

  /**
   * Update contact along with contract information in a single call
   * Used by contact dialog to update both contract and contact fields
   * @param contractId - Contract ID
   * @param contactId - Contact ID
   * @param chapterId - Chapter ID
   * @param payload - Flattened payload with contract and contact fields
   */
  updateContactWithContract(
    contractId: string,
    contactId: number,
    chapterId: string,
    payload: {
      // Contract fields
      company: string;
      contractType?: string;
      addressId?: number;
      taxIdForm?: string;
      barCodeProtocol: string;
      unitIdPattern?: string;
      ediInputInd?: string;
      resultOutputInd?: string;
      confirmTestFlag?: string;
      effDate?: Date | string;
      termDate?: Date | string;
      // Address fields
      addr1?: string;
      addr2?: string;
      addr3?: string;
      city?: string;
      stateCode?: string;
      zip?: string;
      country?: string;
      intPhoneNumber?: string;
      telexNumber?: string;
      // Contact fields
      contactType: string;
      contactFirstName: string;
      contactLastName: string;
      contactTitle?: string;
      phoneNumber?: string;
      faxNumber?: string;
    }
  ): Observable<any> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/${contractId}/contacts/${contactId}/with-contract?chapterId=${chapterId}`,
      payload
    ).pipe(map(response => response.data!));
  }

  /**
   * Delete a contact
   * @param contractId - Contract ID
   * @param contactId - Contact ID
   */
  deleteContact(contractId: string, contactId: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${contractId}/contacts/${contactId}`)
      .pipe(map(() => undefined));
  }

  // ===== Test Operations =====

  /**
   * Get all tests for a contract
   * @param contractId - Contract ID
   * @param chapterId - Chapter ID (required for backend)
   */
  getContractTests(contractId: string, chapterId: string): Observable<ContractTest[]> {
    return this.http.get<ApiResponse<any[]>>(
      `${this.baseUrl}/${contractId}/tests?chapterId=${chapterId}`
    ).pipe(map(response => {
      const tests = response.data || [];
      // Map backend response (modifiedDate) to frontend interface (lastModifiedDate)
      return tests.map((test: any) => ({
        ...test,
        lastModifiedDate: test.modifiedDate || test.lastModifiedDate
      }));
    }));
  }

  /**
   * Create a contract test
   * @param contractId - Contract ID
   * @param chapterId - Chapter ID
   * @param test - Test data
   */
  createContractTest(contractId: string, chapterId: string, test: ContractTest): Observable<ContractTest> {
    // Backend expects Pascal case DTO
    const dto = {
      TestId: test.testId,
      StopLabelFlag: test.stopLabelFlag,
      EffDate: test.effDate,
      TermDate: test.termDate
    };

    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/${contractId}/tests?chapterId=${chapterId}`,
      dto
    ).pipe(map(response => {
      const item = response.item!;
      // Map backend response (modifiedDate) to frontend interface (lastModifiedDate)
      return {
        ...item,
        lastModifiedDate: item.modifiedDate || item.lastModifiedDate
      };
    }));
  }

  /**
   * Update a contract test
   * @param contractId - Contract ID
   * @param testId - Test ID
   * @param chapterId - Chapter ID
   * @param test - Updated test data
   */
  updateContractTest(contractId: string, testId: string, chapterId: string, test: ContractTest): Observable<ContractTest> {
    // Backend expects Pascal case DTO
    const dto = {
      StopLabelFlag: test.stopLabelFlag,
      EffDate: test.effDate,
      TermDate: test.termDate
    };

    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/${contractId}/tests/${testId}?chapterId=${chapterId}`,
      dto
    ).pipe(map(response => {
      const item = response.item!;
      // Map backend response (modifiedDate) to frontend interface (lastModifiedDate)
      return {
        ...item,
        lastModifiedDate: item.modifiedDate || item.lastModifiedDate
      };
    }));
  }

  /**
   * Delete a contract test
   * @param contractId - Contract ID
   * @param testId - Test ID
   * @param chapterId - Chapter ID
   */
  deleteContractTest(contractId: string, testId: string, chapterId: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(
      `${this.baseUrl}/${contractId}/tests/${testId}?chapterId=${chapterId}`
    ).pipe(map(() => undefined));
  }
}
