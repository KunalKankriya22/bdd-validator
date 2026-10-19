import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

/**
 * Mock data service for Interdiction Query development
 * This service provides realistic mock data matching the Figma designs
 * Replace with real InterdictionQueryService when API is ready
 */

// Interdiction Type Options
export interface InterdictionTypeOption {
  code: string;
  description: string;
  type: 'Interdiction' | 'Hold';
}

// Donation Type
export type DonationType = 'ALL' | 'WB' | 'PL' | 'RBC' | 'PC';

// Donation Record (for Donations Tab)
export interface DonationRecord {
  unitId: string;
  collectionDate: string;
  donationType: DonationType;
  procedureCode: string;
  interdiction: string;
  effectiveDate: string;
  terminationDate: string;
  releaseDate?: string;
  releaseUser?: string;
  origin: string;
  reason: string;
  // Expandable row details
  interdictionType: string;
  interdictionCustody: string;
  donorId: string;
  name: string;
  dateOfBirth: string;
  gender: string;
}

// Donor Record (for Donors Tab)
export interface DonorRecord {
  unitId: string;
  collectionDate: string;
  driveId: string;
  effectiveDate: string;
  terminationDate: string;
}

// Other Hold
export interface OtherHoldRecord {
  holdCode: string;
  description: string;
  origin?: string;
  reasonCode?: string;
  effectiveDate: string;
  terminationDate?: string;
}

@Injectable({
  providedIn: 'root'
})
export class InterdictionQueryMockService {

  /**
   * Interdiction and Hold type options for the Code dropdown
   */
  private interdictionOptions: InterdictionTypeOption[] = [
    { code: 'PHYTD', description: 'Physical Findings Temporary Deferral', type: 'Interdiction' },
    { code: 'INTER', description: 'Interdiction', type: 'Interdiction' },
    { code: 'CPDF', description: 'Carrier Permanent Deferral', type: 'Interdiction' },
    { code: 'ELPA', description: 'Eligibility Testing 120 Valid Proc Exclusions', type: 'Interdiction' },
    { code: 'ELPZ', description: 'Eligibility Testing 120 Valid Proc Exclusions', type: 'Interdiction' }
  ];

  private holdOptions: InterdictionTypeOption[] = [
    { code: 'HDT', description: 'Health History Deferral', type: 'Hold' },
    { code: '10IB', description: 'TB for Function 1.01', type: 'Hold' },
    { code: 'BLTMN', description: 'Blood times not recorded on donor record', type: 'Hold' },
    { code: 'HDT', description: 'Health History Deferral - Temporary', type: 'Hold' },
    { code: 'ILBTM', description: 'Illegal Blood Time', type: 'Hold' }
  ];

  /**
   * Mock Donation Records (for Donations Tab)
   */
  private donationRecords: DonationRecord[] = [
    {
      unitId: 'W12342402705-Q',
      collectionDate: '01-NOV-2025',
      donationType: 'ALL',
      procedureCode: 'WB',
      interdiction: 'INTER',
      effectiveDate: '01-NOV-2025',
      terminationDate: '01-NOV-2025',
      releaseDate: undefined,
      releaseUser: undefined,
      origin: 'TMPR',
      reason: '102.1',
      interdictionType: 'INTER',
      interdictionCustody: 'Donor',
      donorId: 'DN30133930',
      name: 'Medina Henry',
      dateOfBirth: '01-NOV-2002',
      gender: 'Female'
    },
    {
      unitId: 'W12342402705-D',
      collectionDate: '01-NOV-2025',
      donationType: 'ALL',
      procedureCode: 'WB',
      interdiction: 'INTER',
      effectiveDate: '01-NOV-2025',
      terminationDate: '01-NOV-2025',
      releaseDate: undefined,
      releaseUser: undefined,
      origin: 'TMPR',
      reason: '100.3',
      interdictionType: 'INTER',
      interdictionCustody: 'Donor',
      donorId: 'DN30133930',
      name: 'Medina Henry',
      dateOfBirth: '01-NOV-2002',
      gender: 'Female'
    },
    {
      unitId: 'W12342402705-Y',
      collectionDate: '01-NOV-2025',
      donationType: 'ALL',
      procedureCode: 'WB',
      interdiction: 'INTER',
      effectiveDate: '01-NOV-2025',
      terminationDate: '01-NOV-2025',
      releaseDate: undefined,
      releaseUser: undefined,
      origin: 'TBV',
      reason: '100.2',
      interdictionType: 'INTER',
      interdictionCustody: 'Donor',
      donorId: 'DN30133930',
      name: 'Medina Henry',
      dateOfBirth: '01-NOV-2002',
      gender: 'Female'
    },
    {
      unitId: 'W12342402705-W',
      collectionDate: '01-NOV-2025',
      donationType: 'ALL',
      procedureCode: 'WB',
      interdiction: 'INTER',
      effectiveDate: '01-NOV-2025',
      terminationDate: '01-NOV-2025',
      releaseDate: undefined,
      releaseUser: undefined,
      origin: 'TBV',
      reason: 'UNANS',
      interdictionType: 'INTER',
      interdictionCustody: 'Donor',
      donorId: 'DN30133930',
      name: 'Medina Henry',
      dateOfBirth: '01-NOV-2002',
      gender: 'Female'
    }
  ];

  /**
   * Mock Donor Records (for Donors Tab) - Empty for now
   */
  private donorRecords: DonorRecord[] = [];

  /**
   * Donation Type options for filter
   */
  private donationTypeOptions: string[] = ['ALL', 'WB', 'PL', 'RBC', 'PC', 'PLT', 'GRN'];

  /**
   * Show Released options for filter
   */
  private showReleasedOptions: string[] = ['Yes', 'No'];

  /**
   * Period options for date filters
   */
  private periodOptions: string[] = ['After', 'Before'];

  /**
   * User Inactive Class options for filter
   */
  private userInactiveClassOptions: string[] = [
    'Class A',
    'Class B',
    'Class C',
    'Class D',
    'Class E'
  ];

  /**
   * Mock Other Holds data for dialog
   */
  private otherHoldsData: { [unitId: string]: OtherHoldRecord[] } = {
    'W12342402705-Q': [
      {
        holdCode: '10IB',
        description: 'TB for Function 1.01',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      },
      {
        holdCode: 'BLTMN',
        description: 'Blood times not recorded on donor record',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      },
      {
        holdCode: 'HDT',
        description: 'Health History Deferral - Temporary',
        origin: '15',
        reasonCode: 'CMV',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      },
      {
        holdCode: 'ILBTM',
        description: 'Illegal Blood Time',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      }
    ],
    'W12342402705-D': [
      {
        holdCode: 'HDT',
        description: 'Health History Deferral',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      }
    ],
    'W12342402705-Y': [
      {
        holdCode: '10IB',
        description: 'TB for Function 1.01',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      }
    ],
    'W12342402705-W': [
      {
        holdCode: 'BLTMN',
        description: 'Blood times not recorded on donor record',
        effectiveDate: '11-JAN-2025',
        terminationDate: undefined
      }
    ]
  };

  /**
   * Get interdiction codes by option type
   */
  getInterdictionCodes(optionType: 'Interdiction' | 'Hold'): Observable<InterdictionTypeOption[]> {
    const options = optionType === 'Interdiction' ? this.interdictionOptions : this.holdOptions;
    return of(options).pipe(delay(300));
  }

  /**
   * Get all interdiction and hold codes
   */
  getAllCodes(): Observable<InterdictionTypeOption[]> {
    return of([...this.interdictionOptions, ...this.holdOptions]).pipe(delay(300));
  }

  /**
   * Retrieve donation records based on query parameters
   */
  retrieveDonations(params: {
    option: 'Interdiction' | 'Hold';
    code: string;
    fromCollectionDate?: string;
    toCollectionDate?: string;
  }): Observable<DonationRecord[]> {
    // Filter mock data based on params (simplified filtering for mock)
    let filtered = [...this.donationRecords];

    // In real implementation, filter by params
    // For mock, return all data
    return of(filtered).pipe(delay(500));
  }

  /**
   * Retrieve donor records based on query parameters
   */
  retrieveDonors(params: {
    option: 'Interdiction' | 'Hold';
    code: string;
    fromCollectionDate?: string;
    toCollectionDate?: string;
  }): Observable<DonorRecord[]> {
    // Filter mock data based on params
    let filtered = [...this.donorRecords];

    // In real implementation, filter by params
    return of(filtered).pipe(delay(500));
  }

  /**
   * Get other holds for a specific unit ID
   */
  getOtherHolds(unitId: string): Observable<OtherHoldRecord[]> {
    const holds = this.otherHoldsData[unitId] || [];
    return of(holds).pipe(delay(300));
  }

  /**
   * Get donation types for filter dropdown
   */
  getDonationTypes(): string[] {
    return this.donationTypeOptions;
  }

  /**
   * Get show released options
   */
  getShowReleasedOptions(): string[] {
    return this.showReleasedOptions;
  }

  /**
   * Get period options for date filters
   */
  getPeriodOptions(): string[] {
    return this.periodOptions;
  }

  /**
   * Get user inactive class options for filter
   */
  getUserInactiveClassOptions(): Observable<string[]> {
    return of(this.userInactiveClassOptions).pipe(delay(300));
  }

  /**
   * Get operation options for ADD button
   */
  getOperationOptions(): string[] {
    return ['-', 'ADD'];
  }

  /**
   * Get donor interdiction codes for filter dropdown
   */
  getDonorInterdictionCodes(): Observable<InterdictionTypeOption[]> {
    // Return all codes (both interdictions and holds)
    return of([...this.interdictionOptions, ...this.holdOptions]).pipe(delay(300));
  }

  /**
   * Get user inactive classes for filter dropdown
   */
  getUserInactiveClasses(): Observable<string[]> {
    return this.getUserInactiveClassOptions();
  }

  /**
   * Add interdictions with AND logic (mock)
   */
  addInterdictionsAnd(payload: any): Observable<{ success: boolean }> {
    console.log('Mock: Adding interdictions with AND logic', payload);
    return of({ success: true }).pipe(delay(500));
  }

  /**
   * Add interdictions with OR logic (mock)
   */
  addInterdictionsOr(payload: any): Observable<{ success: boolean }> {
    console.log('Mock: Adding interdictions with OR logic', payload);
    return of({ success: true }).pipe(delay(500));
  }
}
