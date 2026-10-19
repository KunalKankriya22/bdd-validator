import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import {
  ReturnResult,
  ContractOption,
  BatchOption,
  ProfileSetOption,
  TubesCheckinQueryResponse,
  ProfileTest,
  AdditionalTest,
} from '../models/tubes-checkin-query.model';
import { TubeNoteDto, CreateTubeNoteRequest, UpdateTubeNoteRequest } from '../tubes-notes-panel/tubes-notes-panel';

/**
 * Mock service for Tubes Check-In Query
 * Provides realistic test data for development and testing
 */
@Injectable({ providedIn: 'root' })
export class TubesCheckinQueryMockService {
  private readonly DELAY_MS = 800; // Simulate network delay

  /**
   * Mock contracts data (matches ContractDropdownDto from backend)
   */
  private readonly mockContracts: ContractOption[] = [
    { contractId: 'MDWRG0011', company: 'Newnan Blood Center' },
    { contractId: 'MDWRG0015', company: 'Atlanta Regional Medical Center' },
    { contractId: 'MDWRG0022', company: 'Savannah Memorial Hospital' },
    { contractId: 'TXRG001', company: 'Dallas Community Blood Bank' },
    { contractId: 'TXRG002', company: 'Houston Medical Institute' },
    { contractId: 'CARG001', company: 'San Francisco General Hospital' },
    { contractId: 'NYRG001', company: 'New York Presbyterian Medical' },
    { contractId: 'FLRG001', company: 'Miami-Dade Blood Services' },
  ];

  /**
   * Mock batches data (varies by contract) - matches TubesCheckinBatchDropdownDto
   */
  private readonly mockBatches: Record<string, BatchOption[]> = {
    'MDWRG0011': [
      { batchId: '070318-RG1005', checkinDate: '10-MAR-26' },
      { batchId: '070318-RG1004', checkinDate: '10-MAR-26' },
      { batchId: '070219-RG1003', checkinDate: '19-FEB-26' },
      { batchId: '070218-RG1002', checkinDate: '18-FEB-26' },
      { batchId: '070115-RG1001', checkinDate: '15-JAN-26' },
    ],
    'MDWRG0015': [
      { batchId: '031526-AT1050', checkinDate: '15-MAR-26' },
      { batchId: '031226-AT1049', checkinDate: '12-MAR-26' },
    ],
    'TXRG001': [
      { batchId: '032026-DL2001', checkinDate: '20-MAR-26' },
      { batchId: '031826-DL2000', checkinDate: '18-MAR-26' },
    ],
  };

  /**
   * Mock profile sets data
   */
  private readonly mockProfileSets: ProfileSetOption[] = [
    { profileSetId: 'RG0048-0001', profileDesc: 'Primary', profileType: 'P', termDate: null },
    { profileSetId: 'RG0048-0002', profileDesc: 'Secondary', profileType: 'S', termDate: null },
    { profileSetId: 'RG0048-0003', profileDesc: 'Adhoc', profileType: 'A', termDate: '2026-12-31' },
    { profileSetId: 'RG0049-0001', profileDesc: 'Primary', profileType: 'P', termDate: null },
  ];

  /**
   * Mock tubes check-in records
   */
  private generateMockTubesData(contractId: string, batchId?: string): TubesCheckinQueryResponse {
    const records = [];
    const baseUnitId = contractId === 'MDWRG0011' ? 'W63331108' : 'W74441209';
    const selectedBatch = batchId || '070318-RG1005';

    // Determine check-in date based on batch
    let checkInDate = '2026-03-10T23:16:00Z';
    if (batchId === '070318-RG1004') checkInDate = '2026-03-10T22:45:00Z';
    if (batchId === '070219-RG1003') checkInDate = '2026-02-19T14:30:00Z';
    if (batchId === '070218-RG1002') checkInDate = '2026-02-18T09:15:00Z';
    if (batchId === '070115-RG1001') checkInDate = '2026-01-15T16:20:00Z';

    // Generate 12 sample records
    for (let i = 0; i < 12; i++) {
      const unitNum = 613 + i;
      const checkDigits = ['Z', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L'];

      records.push({
        unitId: `${baseUnitId}${unitNum}`,
        checkDigit: checkDigits[i],
        batchId: selectedBatch,
        tubeCheckInDate: checkInDate,
        red1Flag: i % 3 === 0 ? 'Y' : null,
        red2Flag: i % 5 === 0 ? 'Y' : null,
        purple1Flag: i % 2 === 0 ? 'Y' : null,
        purple2Flag: i % 4 === 0 ? 'Y' : null,
        profileSetId: i % 2 === 0 ? 'RG0048-0001' : null,
        profileSeqNo: i % 2 === 0 ? 1 : null,
        chapterId: 'CH001',
        contractId: contractId,
      });
    }

    const contract = this.mockContracts.find(c => c.contractId === contractId);

    return {
      tubes: records,
      totalCount: records.length,
      unitCount: records.length,
      companyName: contract?.company || '',
      centerId: 'W0702', // Mock centerId - backend returns this from query response
      contractId: contractId,
      batchId: selectedBatch,
      profileSetId: null,
    };
  }

  /**
   * Mock profile tests data
   */
  private readonly mockProfileTests: Record<string, ProfileTest[]> = {
    'RG0048-0001': [
      { testId: 'HBC' },
      { testId: 'HBSAG' },
      { testId: 'HCV' },
      { testId: 'HIV-1/2' },
      { testId: 'WNV' },
    ],
    'RG0048-0002': [
      { testId: 'HTLV' },
      { testId: 'SYPHILIS' },
      { testId: 'CHAGAS' },
    ],
  };

  /**
   * Mock additional tests data
   */
  private readonly mockAdditionalTests: AdditionalTest[] = [
    { testId: 'ALT' },
    { testId: 'CMV' },
    { testId: 'IRRAD' },
  ];

  /**
   * Get contracts
   */
  getContracts(): Observable<ReturnResult<ContractOption[]>> {
    return of({
      success: true,
      message: 'Contracts retrieved successfully',
      statusCode: 200,
      data: this.mockContracts,
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(this.DELAY_MS));
  }

  /**
   * Get batches for a contract
   */
  getBatches(contractId: string, checkinDate?: string): Observable<ReturnResult<BatchOption[]>> {
    const batches = this.mockBatches[contractId] || [];

    return of({
      success: true,
      message: 'Batches retrieved successfully',
      statusCode: 200,
      data: batches,
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(this.DELAY_MS));
  }

  /**
   * Get profile sets
   */
  getProfileSets(contractId: string): Observable<ReturnResult<ProfileSetOption[]>> {
    return of({
      success: true,
      message: 'Profile sets retrieved successfully',
      statusCode: 200,
      data: this.mockProfileSets,
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(this.DELAY_MS));
  }

  /**
   * Execute query
   */
  query(
    contractId: string,
    checkinDate: string | null,
    batchId: string | null,
    take = 100,
    skip = 0,
    sortColumn = 'UnitId',
    sortOrder = 'ASC',
  ): Observable<ReturnResult<TubesCheckinQueryResponse>> {
    const data = this.generateMockTubesData(contractId, batchId || undefined);

    // Apply pagination
    const start = skip;
    const end = skip + take;
    const paginatedRecords = data.tubes.slice(start, end);

    return of({
      success: true,
      message: 'Query executed successfully',
      statusCode: 200,
      data: {
        ...data,
        tubes: paginatedRecords,
      },
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(this.DELAY_MS));
  }

  /**
   * Get profile tests
   */
    getProfileTests(
    contractId: string,
    profileSetId: string,
    profileSeqNo: number,
  ): Observable<ReturnResult<ProfileTest[]>> {
    const tests = this.mockProfileTests[profileSetId] || [];

    return of({
      success: true,
      message: 'Profile tests retrieved successfully',
      statusCode: 200,
      data: tests,
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(500));
  }

  /**
   * Get additional tests
   */
  getAdditionalTests(
    cbcUnitId: string,
    profileSetId?: string,
    tubeProfileSetId?: string,
  ): Observable<ReturnResult<AdditionalTest[]>> {
    // Randomly show or hide additional tests for variety
    const hasAdditionalTests = Math.random() > 0.3;

    return of({
      success: true,
      message: 'Additional tests retrieved successfully',
      statusCode: 200,
      data: hasAdditionalTests ? this.mockAdditionalTests : [],
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(500));
  }

  /**
   * Mock notes data (in-memory storage)
   */
  private mockNotes: Record<string, TubeNoteDto[]> = {};
  private noteIdCounter = 1;

  /**
   * Get notes for a batch
   */
  getBatchNotes(batchId: string, contractId: string): Observable<ReturnResult<TubeNoteDto[]>> {
    const notes = this.mockNotes[batchId] || [];
    return of({
      success: true,
      message: 'Notes retrieved successfully',
      statusCode: 200,
      data: notes,
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(300));
  }

  /**
   * Create a note for a batch
   */
  createBatchNote(batchId: string, contractId: string, request: CreateTubeNoteRequest): Observable<ReturnResult<TubeNoteDto>> {
    if (!this.mockNotes[batchId]) {
      this.mockNotes[batchId] = [];
    }

    const newNote: TubeNoteDto = {
      auditKey: this.noteIdCounter++,
      note: request.note,
      insertUserName: 'John Lee',
      insertDateTime: new Date().toISOString(),
      versionNo: 1,
    };

    this.mockNotes[batchId].unshift(newNote);

    return of({
      success: true,
      message: 'Note created successfully',
      statusCode: 201,
      data: newNote,
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(300));
  }

  /**
   * Update a note for a batch
   */
  updateBatchNote(batchId: string, contractId: string, noteId: string, request: UpdateTubeNoteRequest): Observable<ReturnResult<TubeNoteDto>> {
    const notes = this.mockNotes[batchId] || [];
    const noteIndex = notes.findIndex(n => String(n.auditKey) === noteId);

    if (noteIndex === -1) {
      return of({
        success: false,
        message: 'Note not found',
        statusCode: 404,
        data: null,
        errorCode: 'NOT_FOUND',
        errorResponse: null,
      }).pipe(delay(300));
    }

    const updatedNote: TubeNoteDto = {
      ...notes[noteIndex],
      note: request.note,
      updateUserName: 'John Lee',
      updateDateTime: new Date().toISOString(),
      versionNo: (notes[noteIndex].versionNo ?? 1) + 1,
    };

    notes[noteIndex] = updatedNote;

    return of({
      success: true,
      message: 'Note updated successfully',
      statusCode: 200,
      data: updatedNote,
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(300));
  }

  /**
   * Delete a note for a batch
   */
  deleteBatchNote(batchId: string, contractId: string, noteId: string): Observable<ReturnResult<void>> {
    const notes = this.mockNotes[batchId] || [];
    const noteIndex = notes.findIndex(n => String(n.auditKey) === noteId);

    if (noteIndex === -1) {
      return of({
        success: false,
        message: 'Note not found',
        statusCode: 404,
        data: null,
        errorCode: 'NOT_FOUND',
        errorResponse: null,
      }).pipe(delay(300));
    }

    notes.splice(noteIndex, 1);

    return of({
      success: true,
      message: 'Note deleted successfully',
      statusCode: 200,
      data: undefined as any,
      errorCode: null,
      errorResponse: null,
    }).pipe(delay(300));
  }
}
