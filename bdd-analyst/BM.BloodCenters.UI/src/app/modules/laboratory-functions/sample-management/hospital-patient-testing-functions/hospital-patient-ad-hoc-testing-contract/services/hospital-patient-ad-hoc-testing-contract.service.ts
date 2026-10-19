import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import moment from 'moment';
import {
  AdHocTestingContract,
  AdHocTestingContractTableModel,
  CreateAdHocTestingContractRequest,
  UpdateAdHocTestingContractRequest,
  AdHocTestingContractQueryDto,
  TestDropdownDto,
  ReturnResult,
  ContractLookup,
  ContractDropdownDto,
  TestingContractTableModel,
  TestingContractDetail,
  ContractContact,
  ContractSearchCriteria,
  DropdownOption,
  ContactInfoFormValue,
  CustomerContactInfoFormValue,
  ContractInfoFormValue,
  ContractFilterModel
} from '../models/hospital-patient-ad-hoc-testing-contract.model';
import { API } from '@core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class HospitalPatientAdHocTestingContractService {
  constructor(private http: HttpClient) {}

  // ============================================================================
  // CONTRACT LISTING (Main Table)
  // ============================================================================

  searchContracts(
    take: number,
    skip: number,
    criteria: ContractSearchCriteria,
    filters?: ContractFilterModel
  ): Observable<{ data: TestingContractTableModel[]; total: number }> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LIST(take, skip);
    const body: any = {
      contractType: 'CU',
      showTerminated: criteria.showTerminated,
      searchKeyword: criteria.searchKeyword,
      sortColumn: criteria.sortColumn || 'ContractId',
      sortOrder: criteria.sortOrder || 'ASC'
    };

    if (criteria.contractId) body.contractId = criteria.contractId;
    if (criteria.company) body.company = criteria.company;

    if (filters) {
      if (filters.contractId) body.contractId = filters.contractId;
      if (filters.contractType) body.contractType = filters.contractType;
      if (filters.effDate) {
        const effDateStr = filters.effDate.format('YYYY-MM-DD');
        if (filters.effDatePeriod === 'After') body.effDateFrom = effDateStr;
        else body.effDateTo = effDateStr;
      }
      if (filters.termDate) {
        const termDateStr = filters.termDate.format('YYYY-MM-DD');
        if (filters.termDatePeriod === 'After') body.termDateFrom = termDateStr;
        else body.termDateTo = termDateStr;
      }
    }

    return this.http
      .post<ReturnResult<any>>(url, body)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve contracts');
          }
          const data = (response.data || []).map((item: any) => this.mapToContractTableModel(item));
          return { data, total: response.total || 0 };
        })
      );
  }

  // ============================================================================
  // CONTRACT DETAIL
  // ============================================================================

  getContractDetail(contractId: string): Observable<TestingContractDetail> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.GET_BY_ID(contractId);

    return this.http
      .get<any>(url)
      .pipe(
        map(response => {
          const item = response?.item || response?.data?.[0] || response;
          if (!item) throw new Error('Contract not found');
          return this.mapToContractDetail(item);
        })
      );
  }

  updateContractDetail(contractId: string, payload: any): Observable<void> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE(contractId);

    return this.http
      .put<ReturnResult<any>>(url, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update contract detail');
          }
        })
      );
  }

  createContract(payload: any): Observable<any> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE;

    return this.http
      .post<ReturnResult<any>>(url, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to create contract');
          }
          return response.item || (response.data && response.data[0]);
        })
      );
  }

  // ============================================================================
  // CONTACTS (LabDistribution - LTICNTRT CONTACTS table)
  // ============================================================================

  getContractContacts(contractId: string): Observable<ContractContact[]> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS(contractId);

    return this.http
      .get<any>(url)
      .pipe(
        map(response => {
          const data = Array.isArray(response) ? response : (response?.data || []);
          return data.map((item: any) => this.mapToContractContact(item));
        })
      );
  }

  createContractContact(contractId: string, payload: any): Observable<void> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.CREATE_CONTACT(contractId);

    return this.http
      .post<ReturnResult<any>>(url, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to create contact');
          }
        })
      );
  }

  updateContractContact(contractId: string, contactId: string, payload: any): Observable<void> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE_CONTACT(contractId, Number(contactId));

    return this.http
      .put<ReturnResult<any>>(url, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update contact');
          }
        })
      );
  }

  // ============================================================================
  // DROPDOWNS
  // ============================================================================

  getActiveContracts(showTerminated = false, contractId?: string | null, company?: string | null): Observable<ContractLookup[]> {
    let url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(showTerminated) + '&contractType=CU';
    if (contractId) url += `&contractId=${encodeURIComponent(contractId)}`;
    if (company) url += `&company=${encodeURIComponent(company)}`;

    return this.http
      .get<ReturnResult<any>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve active contracts');
          }
          return (response.data || []).map((contract: any) => ({
            contractId: contract.contractId,
            description: contract.company,
            contractType: contract.contractType || ''
          }));
        })
      );
  }

  getCompanies(showTerminated = false, contractId?: string | null, company?: string | null): Observable<DropdownOption[]> {
    let url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(showTerminated) + '&contractType=CU';
    if (contractId) url += `&contractId=${encodeURIComponent(contractId)}`;
    if (company) url += `&company=${encodeURIComponent(company)}`;

    return this.http
      .get<ReturnResult<any>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve companies');
          }
          return (response.data || []).map((item: any) => ({
            code: item.company,
            description: item.company
          }));
        })
      );
  }

  getCustomerTypes(showTerminated = false, contractId?: string | null, company?: string | null): Observable<DropdownOption[]> {
    let url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(showTerminated) + '&contractType=CU';
    if (contractId) url += `&contractId=${encodeURIComponent(contractId)}`;
    if (company) url += `&company=${encodeURIComponent(company)}`;

    return this.http
      .get<ReturnResult<any>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve contract types');
          }
          return (response.data || []).map((item: any) => ({
            code: item.code,
            description: item.description
          }));
        })
      );
  }

  getStateOptions(): Observable<DropdownOption[]> {
    return this.http
      .get<ReturnResult<any>>(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_STATE_CODES)
      .pipe(
        map(response => {
          const items = response?.data || [];
          return items.map((item: any) => ({
            code: item.code || item.stateCode,
            description: item.description || item.code
          }));
        })
      );
  }

  getContactTypes(): Observable<DropdownOption[]> {
    return of([
      { code: 'C', description: 'Contract' },
      { code: 'I', description: 'Institution' }
    ]);
  }

  getStopLabelFlagOptions(): Observable<DropdownOption[]> {
    return of([
      { code: 'Y', description: 'Yes - Report results' },
      { code: 'N', description: 'No - Do not report results' }
    ]);
  }

  getShowTerminatedOptions(): Observable<DropdownOption[]> {
    return of([
      { code: 'No', description: 'No' },
      { code: 'Yes', description: 'Yes' }
    ]);
  }

  getUnitSchemeOptions(): Observable<DropdownOption[]> {
    return of([
      { code: 'N', description: 'N - Codabar numeric' },
      { code: 'I', description: 'I - ISBT 128' }
    ]);
  }

  getEdiInputOptions(): Observable<DropdownOption[]> {
    return of([
      { code: 'Y', description: 'Y - Yes' },
      { code: '', description: 'No' }
    ]);
  }

  getResultsIndOptions(): Observable<DropdownOption[]> {
    return of([
      { code: 'R', description: 'R - Reports' },
      { code: 'E', description: 'E - Electronic Mail' },
      { code: 'B', description: 'B - Both' }
    ]);
  }

  getConfirmTestOptions(): Observable<DropdownOption[]> {
    return of([
      { code: 'Y', description: 'Y - Yes' },
      { code: '', description: 'No' }
    ]);
  }

  // ============================================================================
  // LEGACY METHODS (kept for backward compatibility)
  // ============================================================================

  searchAdHocTestingContracts(
    contractId: string,
    take: number,
    skip: number,
    filters?: AdHocTestingContractQueryDto
  ): Observable<{ data: AdHocTestingContractTableModel[]; total: number }> {
    const url = API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.SEARCH(contractId, take, skip);

    return this.http
      .post<ReturnResult<AdHocTestingContract>>(url, filters || {})
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve ad hoc testing contracts');
          }
          const data = (response.data || []).map(contract => this.mapToAdHocTableModel(contract));
          return { data, total: response.total || 0 };
        })
      );
  }

  getAdHocTestingContractById(contractId: string, testId: string): Observable<AdHocTestingContractTableModel> {
    const url = API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.GET_BY_ID(contractId, testId);

    return this.http
      .get<ReturnResult<AdHocTestingContract>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to retrieve ad hoc testing contract');
          }
          if (!response.data || response.data.length === 0) {
            throw new Error('Ad hoc testing contract not found');
          }
          return this.mapToAdHocTableModel(response.data[0]);
        })
      );
  }

  getActiveTests(): Observable<TestDropdownDto[]> {
    const url = API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.TESTS_DROPDOWN;

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

  createAdHocTestingContract(payload: CreateAdHocTestingContractRequest): Observable<void> {
    const url = API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.CREATE;

    return this.http
      .post<ReturnResult<any>>(url, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to create ad hoc testing contract');
          }
        })
      );
  }

  updateAdHocTestingContract(
    contractId: string,
    testId: string,
    payload: UpdateAdHocTestingContractRequest
  ): Observable<void> {
    const url = API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.UPDATE(contractId, testId);

    return this.http
      .put<ReturnResult<any>>(url, payload)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update ad hoc testing contract');
          }
        })
      );
  }

  deleteAdHocTestingContract(contractId: string, testId: string): Observable<void> {
    const url = API.HOSPITAL_PATIENT_AD_HOC_TESTING_CONTRACT.DELETE(contractId, testId);

    return this.http
      .delete<ReturnResult<number>>(url)
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to delete ad hoc testing contract');
          }
          if (response.item === 0) {
            throw new Error('Record not found or already deleted');
          }
        })
      );
  }

  // ============================================================================
  // MAPPERS
  // ============================================================================

  private mapToContractTableModel(item: any): TestingContractTableModel {
    return {
      contractId: item.contractId || '',
      customerType: item.contractType || '',
      chapterId: item.chapterId || '',
      description: item.company || '',
      unitScheme: item.barCodeProtocol || '-',
      effDate: this.formatDateForDisplay(item.effDate),
      termDate: item.termDate ? this.formatDateForDisplay(item.termDate) : null
    };
  }

  private static readonly UNIT_SCHEME_MAP: Record<string, string> = { 'N': 'N - Codabar numeric', 'I': 'I - ISBT 128' };
  private static readonly EDI_INPUT_MAP: Record<string, string> = { 'Y': 'Y - Yes' };
  private static readonly RESULTS_IND_MAP: Record<string, string> = { 'R': 'R - Reports', 'E': 'E - Electronic Mail', 'B': 'B - Both' };
  private static readonly CONFIRM_TEST_MAP: Record<string, string> = { 'Y': 'Y - Yes' };

  private mapToContractDetail(item: any): TestingContractDetail {
    const addr1 = item.address1 || item.addr1 || '';
    const addr2 = item.address2 || item.addr2 || '';
    const addr3 = item.address3 || item.addr3 || '';
    const city = item.city || '';
    const stateCode = item.state || item.stateCode || '';
    const zip = item.zip || '';
    const country = item.country || '';
    const addressParts = [addr1, addr2, addr3, city, stateCode, zip, country]
      .filter(Boolean);

    const barCode = item.barCodeProtocol || '';
    const ediInd = item.ediInputInd || '';
    const resInd = item.resultOutputInd || '';
    const confFlag = item.confirmTestFlag || '';

    return {
      contractId: item.contractId || '',
      company: item.company || item.name || '-',
      address: addressParts.join(', ') || '-',
      addr1,
      addr2,
      addr3,
      city,
      stateCode,
      zip,
      country,
      phoneNumber: item.phoneNo || item.phoneNumber || '-',
      fax: item.faxNo || item.faxNumber || '-',
      internationalPhoneNumber: item.intPhone || item.intPhoneNumber || '-',
      internationalFax: item.telexNo || item.telexNumber || '-',
      chapterId: item.chapterId || '-',
      chapterDescription: item.chapterName || '-',
      taxIdForm: item.taxIdForm || '-',
      unitScheme: HospitalPatientAdHocTestingContractService.UNIT_SCHEME_MAP[barCode] || barCode || '-',
      centerId: item.centerId || '-',
      unitIdPattern: item.unitIdPattern || '-',
      ediInput: HospitalPatientAdHocTestingContractService.EDI_INPUT_MAP[ediInd] || (ediInd ? ediInd : '-'),
      resultsInd: HospitalPatientAdHocTestingContractService.RESULTS_IND_MAP[resInd] || (resInd ? resInd : '-'),
      confirmTest: HospitalPatientAdHocTestingContractService.CONFIRM_TEST_MAP[confFlag] || (confFlag ? confFlag : '-'),
      redTubeCount: item.redTubeCount ?? 0,
      purpleTubeCount: item.purpleTubeCount ?? 0,
      intFlag: item.intFlag || 'N',
      effDate: this.formatDateForDisplay(item.effDate),
      termDate: item.termDate ? this.formatDateForDisplay(item.termDate) : null,
      lastModifiedDate: item.lastModifiedDate ? this.formatDateForDisplay(item.lastModifiedDate) : null
    };
  }

  private mapToContractContact(item: any): ContractContact {
    return {
      customerId: item.contactId?.toString() || item.customerId || '',
      instId: item.instId || '',
      contactType: item.contactType || '',
      contactTypeDesc: item.contactTypeDesc || item.contactType || '',
      lastName: item.contactLastName || item.lastName || '',
      firstName: item.contactFirstName || item.firstName || '',
      title: item.contactTitle || item.title || '--',
      phoneNumber: item.phoneNumber || item.dayPhoneNo || '-',
      faxNumber: item.faxNumber || item.faxNo || '-',
      emailId: item.emailId || '-',
      lastModifiedDate: item.lastModifiedDate ? this.formatDateForDisplay(item.lastModifiedDate) : null
    };
  }

  private mapToAdHocTableModel(contract: AdHocTestingContract): AdHocTestingContractTableModel {
    return {
      contractId: contract.contractId,
      chapterId: contract.chapterId,
      testId: contract.testId,
      testDesc: contract.testDesc || contract.testId,
      stopLabelFlag: contract.stopLabelFlag,
      effDate: this.formatDateForDisplay(contract.effDate),
      termDate: contract.termDate ? this.formatDateForDisplay(contract.termDate) : null,
      lastModifiedDate: this.formatDateForDisplay(contract.lastModifiedDate || contract.effDate),
      programId: contract.programId
    };
  }

  private formatDateForDisplay(isoDate: string | null): string {
    if (!isoDate) return '-';
    return moment(isoDate).format('DD-MMM-YYYY');
  }
}
