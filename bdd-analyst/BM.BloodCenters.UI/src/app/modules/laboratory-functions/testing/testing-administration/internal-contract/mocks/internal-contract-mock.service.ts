import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  InternalContractParamsDto,
  InternalContractListResponse,
  ContractListItem,
  MasterCode,
  ValidTest,
  State,
  Country,
  ContractWithDetails,
  SaveContractRequest,
  SaveContractResponse,
  Contact,
  ContractTest
} from '../internal-contract.models';

/**
 * Mock service for testing Internal Contract UI without backend
 *
 * To use this mock:
 * 1. In internal-contract.component.ts, change the import:
 *    import { InternalContractService } from './mocks/internal-contract-mock.service';
 * 2. Or use Angular DI to provide this as an override in the component
 *
 * To switch back to real service:
 * 1. Restore the original import
 */
@Injectable({
  providedIn: 'root'
})
export class InternalContractMockService {

  // Mock data storage
  private mockContracts: ContractListItem[] = [
    {
      contractId: 'DAIN0001',
      contractType: 'IN',
      chapterId: 'DAL',
      chapterName: 'Brooke Army Medical Center',
      company: 'Brooke Army Hospital',
      effDate: '2025-01-15',
      termDate: '2030-12-31',
      lastModifiedDate: '2026-01-11T08:32:00',
      testCount: 9,
      contactCount: 2
    },
    {
      contractId: 'DAIN0002',
      contractType: 'IN',
      chapterId: 'DAL',
      chapterName: 'Brooke Army Medical Center',
      company: 'HBC Antibody',
      effDate: '2025-01-15',
      termDate: '2030-08-30',
      lastModifiedDate: '2026-01-15T08:32:00',
      testCount: 8,
      contactCount: 1
    },
    {
      contractId: 'DAIN0003',
      contractType: 'IN',
      chapterId: 'DAL',
      chapterName: 'Brooke Army Medical Center',
      company: 'Hepatitis A Combo Antigen',
      effDate: '2025-01-15',
      termDate: '2030-06-30',
      lastModifiedDate: '2026-01-15T08:32:00',
      testCount: 6,
      contactCount: 1
    },
    {
      contractId: 'NYEIN0001',
      contractType: 'IN',
      chapterId: 'NYE',
      chapterName: 'New York Blood Center',
      company: 'ABC Medical Testing',
      effDate: '2024-06-01',
      termDate: null,
      lastModifiedDate: '2025-12-20T14:15:00',
      testCount: 12,
      contactCount: 3
    },
    {
      contractId: 'NYEIN0002',
      contractType: 'IN',
      chapterId: 'NYE',
      chapterName: 'New York Blood Center',
      company: 'Complete Blood Count (CBC)',
      effDate: '2025-03-01',
      termDate: null,
      lastModifiedDate: '2026-03-05T10:22:00',
      testCount: 5,
      contactCount: 2
    },
    {
      contractId: 'SFOIN0001',
      contractType: 'IN',
      chapterId: 'SFO',
      chapterName: 'San Francisco Blood Bank',
      company: 'DNA Medical Services',
      effDate: '2023-01-01',
      termDate: '2026-12-31',
      lastModifiedDate: '2023-01-10T09:00:00',
      testCount: 15,
      contactCount: 4
    },
    {
      contractId: 'LASIN0001',
      contractType: 'OU',
      chapterId: 'LAS',
      chapterName: 'Los Angeles Blood Bank',
      company: 'External Lab Partners LLC',
      effDate: '2025-05-15',
      termDate: null,
      lastModifiedDate: '2025-05-20T11:30:00',
      testCount: 7,
      contactCount: 1
    }
  ];

  private mockChapters = [
    { chapterId: 'DAL', chapterName: 'Brooke Army Medical Center' },
    { chapterId: 'NYE', chapterName: 'New York Blood Center' },
    { chapterId: 'SFO', chapterName: 'San Francisco Blood Bank' },
    { chapterId: 'LAS', chapterName: 'Los Angeles Blood Bank' },
    { chapterId: 'CHI', chapterName: 'Chicago Blood Center' },
    { chapterId: 'MIA', chapterName: 'Miami Blood Services' }
  ];

  private mockContractTypes: MasterCode[] = [
    { codeType: 'CONTR', codeValue: 'IN', codeDescription: 'In Use' },
    { codeType: 'CONTR', codeValue: 'OU', codeDescription: 'Out of Use' },
    { codeType: 'CONTR', codeValue: 'PE', codeDescription: 'Pending' },
    { codeType: 'CONTR', codeValue: 'EX', codeDescription: 'Expired' }
  ];

  private mockBarcodeProtocols: MasterCode[] = [
    { codeType: 'BARCD', codeValue: '1', codeDescription: 'Code 39' },
    { codeType: 'BARCD', codeValue: '2', codeDescription: 'Code 128' },
    { codeType: 'BARCD', codeValue: '8', codeDescription: 'ISBT 128' },
    { codeType: 'BARCD', codeValue: 'Q', codeDescription: 'QR Code' }
  ];

  private mockValidTests: ValidTest[] = [
    { testId: 'ABORH', testDescription: 'ABO and RH Blood Groupings' },
    { testId: 'HBC', testDescription: 'HBC Antibody' },
    { testId: 'HIVA', testDescription: 'Hepatitis A Combo Antigen' },
    { testId: 'HIV12', testDescription: 'HIV 1/2 Combo Test' },
    { testId: 'DEM', testDescription: 'Syphilis Screening (RPR)' },
    { testId: 'VDRL', testDescription: 'Complete Blood Count (CBC)' },
    { testId: 'HTLV', testDescription: 'Thyroid Stimulating Hormone (TSH)' },
    { testId: 'ERY', testDescription: 'Vitamin B-12 RIA/Elisa' },
    { testId: 'C-RES', testDescription: 'C-Reactive Protein (CRP)' }
  ];

  private mockStates: State[] = [
    { stateCode: 'AL', stateName: 'Alabama' },
    { stateCode: 'CA', stateName: 'California' },
    { stateCode: 'FL', stateName: 'Florida' },
    { stateCode: 'IL', stateName: 'Illinois' },
    { stateCode: 'NY', stateName: 'New York' },
    { stateCode: 'TX', stateName: 'Texas' }
  ];

  private mockCountries: Country[] = [
    { countryCode: 'US', countryName: 'United States' },
    { countryCode: 'CA', countryName: 'Canada' },
    { countryCode: 'MX', countryName: 'Mexico' },
    { countryCode: 'UK', countryName: 'United Kingdom' }
  ];

  /**
   * Get paginated list of contracts with filtering and search
   */
  getInternalContracts(
    take: number,
    skip: number,
    params: InternalContractParamsDto
  ): Observable<InternalContractListResponse> {
    console.log('[MOCK] getInternalContracts called with:', { take, skip, params });

    let filtered = [...this.mockContracts];

    // Apply filters
    if (params.searchKeyword) {
      const keyword = params.searchKeyword.toLowerCase();
      filtered = filtered.filter(c =>
        c.company.toLowerCase().includes(keyword) ||
        c.contractId.toLowerCase().includes(keyword)
      );
    }

    if (params.chapterId) {
      filtered = filtered.filter(c => c.chapterId === params.chapterId);
    }

    if (params.contractType) {
      filtered = filtered.filter(c => c.contractType === params.contractType);
    }

    if (params.effectiveDate && params.effectivePeriod) {
      const filterDate = new Date(params.effectiveDate);
      filtered = filtered.filter(c => {
        const effDate = new Date(c.effDate);
        return params.effectivePeriod === 'After'
          ? effDate >= filterDate
          : effDate <= filterDate;
      });
    }

    if (params.terminationDate && params.terminationPeriod) {
      const filterDate = new Date(params.terminationDate);
      filtered = filtered.filter(c => {
        if (!c.termDate) return false;
        const termDate = new Date(c.termDate);
        return params.terminationPeriod === 'After'
          ? termDate >= filterDate
          : termDate <= filterDate;
      });
    }

    // Apply sorting
    if (params.sort === 'D') {
      filtered.reverse();
    }

    // Apply pagination
    const total = filtered.length;
    const paginated = filtered.slice(skip, skip + take);

    return of({
      data: paginated,
      total,
      totalRecords: total
    }).pipe(delay(500)); // Simulate network delay
  }

  /**
   * Get all contracts (simplified)
   */
  getAll(): Observable<any[]> {
    return of(this.mockContracts).pipe(delay(300));
  }

  /**
   * Get contract by ID with all related data
   */
  getById(contractId: string): Observable<ContractWithDetails> {
    console.log('[MOCK] getById called with:', contractId);

    const contract = this.mockContracts.find(c => c.contractId === contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Mock detailed contract data
    const details: ContractWithDetails = {
      contract: {
        contractType: contract.contractType,
        contractId: contract.contractId,
        chapterId: contract.chapterId,
        company: contract.company,
        addressId: 123,
        taxIdForm: '123456789',
        barCodeProtocol: '8',
        unitIdPattern: '=',
        ediInputInd: 'Y',
        resultOutputInd: 'B',
        confirmTestFlag: 'Y',
        effDate: contract.effDate,
        termDate: contract.termDate,
        lastModifiedDate: contract.lastModifiedDate,
        programId: 'CONTR'
      },
      address: {
        addressId: 123,
        addressLine1: '1234 Medical Plaza',
        addressLine2: 'Suite 100',
        city: 'San Antonio',
        stateCode: 'TX',
        zipCode: '78234',
        country: 'US',
        intFlag: null
      },
      contacts: [
        {
          contactId: 1,
          contractId: contract.contractId,
          chapterId: contract.chapterId,
          contactType: 'C',
          contactLastName: 'Smith',
          contactFirstName: 'Ann',
          contactTitle: 'CIO',
          phoneNumber: '855-524-3874',
          faxNumber: '855-524-3874'
        }
      ],
      tests: [
        {
          contractId: contract.contractId,
          chapterId: contract.chapterId,
          testId: 'ABORH',
          stopLabelFlag: 'Y',
          effDate: '2025-01-15',
          termDate: '2030-12-31',
          testDescription: 'ABO and RH Blood Groupings'
        }
      ]
    };

    return of(details).pipe(delay(400));
  }

  /**
   * Create a new contract
   */
  create(request: SaveContractRequest): Observable<SaveContractResponse> {
    console.log('[MOCK] create called with:', request);

    const newId = `${request.contract.chapterId}${request.contract.contractType}${String(this.mockContracts.length + 1).padStart(4, '0')}`;

    return of({
      contractId: newId,
      message: 'Contract created successfully'
    }).pipe(delay(600));
  }

  /**
   * Update existing contract
   */
  update(contractId: string, request: SaveContractRequest): Observable<SaveContractResponse> {
    console.log('[MOCK] update called with:', contractId, request);

    return of({
      contractId,
      message: 'Contract updated successfully'
    }).pipe(delay(600));
  }

  /**
   * Delete a contract
   */
  delete(contractId: string): Observable<void> {
    console.log('[MOCK] delete called with:', contractId);
    return of(undefined).pipe(delay(400));
  }

  // ===== Lookup Methods =====

  getContractTypes(): Observable<MasterCode[]> {
    console.log('[MOCK] getContractTypes called');
    return of(this.mockContractTypes).pipe(delay(200));
  }

  getBarcodeProtocols(): Observable<MasterCode[]> {
    console.log('[MOCK] getBarcodeProtocols called');
    return of(this.mockBarcodeProtocols).pipe(delay(200));
  }

  getValidTests(): Observable<ValidTest[]> {
    console.log('[MOCK] getValidTests called');
    return of(this.mockValidTests).pipe(delay(200));
  }

  getStates(): Observable<State[]> {
    console.log('[MOCK] getStates called');
    return of(this.mockStates).pipe(delay(200));
  }

  getCountries(): Observable<Country[]> {
    console.log('[MOCK] getCountries called');
    return of(this.mockCountries).pipe(delay(200));
  }

  getChapters(): Observable<Array<{chapterId: string; chapterName: string}>> {
    console.log('[MOCK] getChapters called');
    return of(this.mockChapters).pipe(delay(200));
  }

  getActiveChapters(): Observable<Array<{chapterId: string; chapterName: string}>> {
    console.log('[MOCK] getActiveChapters called');
    // Return only active chapters (exclude one for demo)
    return of(this.mockChapters.filter(c => c.chapterId !== 'MIA')).pipe(delay(200));
  }
}
