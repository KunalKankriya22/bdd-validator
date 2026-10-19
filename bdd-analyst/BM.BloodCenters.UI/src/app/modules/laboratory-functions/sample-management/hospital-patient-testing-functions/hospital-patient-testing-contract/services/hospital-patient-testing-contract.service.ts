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
} from '../models/hospital-patient-testing-contract.model';
import { API } from '@core/constants/api.constants';

@Injectable({
  providedIn: 'root'
})
export class HospitalPatientTestingContractService {
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
      contractType: 'TS',
      showTerminated: criteria.showTerminated || false,
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
        map(item => {
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
  // CONTACTS
  // ============================================================================

  getContractContacts(contractId: string, _includeTerminated = false): Observable<ContractContact[]> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.CONTACTS(contractId);

    return this.http
      .get<any[]>(url)
      .pipe(
        map(data => {
          return (data || []).map((item: any) => this.mapToContractContact(item));
        })
      );
  }

  createContact(contractId: string, payload: any): Observable<void> {
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

  updateContact(contractId: string, contactId: number, payload: any): Observable<void> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.UPDATE_CONTACT(contractId, contactId);

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

  getActiveContracts(showTerminated = false): Observable<ContractLookup[]> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACTS(showTerminated) + '&contractType=TS';

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

  getCompanies(showTerminated = false): Observable<DropdownOption[]> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_COMPANIES(showTerminated) + '&contractType=TS';

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

  getCustomerTypes(showTerminated = false): Observable<DropdownOption[]> {
    const url = API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_CONTRACT_TYPES(showTerminated) + '&contractType=TS';

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
      { code: 'C', description: 'C - Contract' },
      { code: 'I', description: 'I - Institution' }
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
    return this.http
      .get<ReturnResult<any>>(API.HOSPITAL_PATIENT_TESTING_CONTRACT.LOV_BARCODE_PROTOCOLS)
      .pipe(
        map(response => {
          const items = response?.data || [];
          return items.map((item: any) => ({
            code: item.code,
            description: item.description
          }));
        })
      );
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

  getContractTypeOptions(): Observable<DropdownOption[]> {
    return this.getCustomerTypes();
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

    return {
      contractId: item.contractId || '',
      company: item.company || item.name || '-',
      addressId: item.addressId || 0,
      address: addressParts.length > 0 ? addressParts.join(', ') : '-',
      addr1,
      addr2,
      addr3,
      city,
      stateCode,
      zip,
      country,
      intFlag: item.intFlag || 'N',
      phoneNumber: item.phoneNo || item.phoneNumber || '-',
      fax: item.faxNo || item.faxNumber || '-',
      internationalPhoneNumber: item.intPhone || item.intPhoneNumber || '-',
      internationalFax: item.telexNo || item.telexNumber || '-',
      chapterId: item.chapterId || '-',
      chapterDescription: item.chapterName || '-',
      taxIdForm: item.taxIdForm || '-',
      unitScheme: item.barCodeProtocol || '-',
      centerId: item.centerId || '-',
      unitIdPattern: item.unitIdPattern || '-',
      ediInput: item.ediInputInd || '',
      resultsInd: item.resultOutputInd || '',
      confirmTest: item.confirmTestFlag || '',
      redTubeCount: item.redTubeCount ?? 0,
      purpleTubeCount: item.purpleTubeCount ?? 0,
      effDate: this.formatDateForDisplay(item.effDate),
      termDate: item.termDate ? this.formatDateForDisplay(item.termDate) : null,
      lastModifiedDate: item.lastModifiedDate ? this.formatDateForDisplay(item.lastModifiedDate) : null
    };
  }

  private mapToContractContact(item: any): ContractContact {
    return {
      contactId: item.contactId || 0,
      customerId: item.contractId || '',
      instId: '',
      contactType: item.contactType || '',
      contactTypeDesc: item.contactType === 'C' ? 'Contract' : item.contactType === 'I' ? 'Institution' : item.contactType || '',
      lastName: item.contactLastName || '',
      firstName: item.contactFirstName || '',
      title: item.contactTitle || '--',
      phoneNumber: item.phoneNumber || '-',
      faxNumber: item.faxNumber || '-',
      emailId: item.emailId || '-',
      lastModifiedDate: null
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
