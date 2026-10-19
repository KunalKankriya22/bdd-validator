import { TestBed } from '@angular/core/testing';
import { SamplesQueryStateService, SamplesQuerySavedState } from './samples-query-state.service';

describe('SamplesQueryStateService', () => {
  let service: SamplesQueryStateService;

  const mockState: SamplesQuerySavedState = {
    filterFormValues: { osUnitId: '', collDate: null, receivedDate: null, batchId: '' },
    validatedUnitId: null,
    selectedBatchId: null,
    batchOptions: [],
    units: [],
    totalRecords: 0,
    pageSize: 10,
    pageIndex: 0,
    sortColumn: '',
    sortOrder: 'asc',
    hasSearched: false,
    selectedUnit: null,
    unitDetails: null,
    testResults: [],
    attributes: [],
    interdictions: [],
    contractExpanded: false,
    testSortDir: 'asc',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SamplesQueryStateService],
    });

    service = TestBed.inject(SamplesQueryStateService);
  });

  it('should report no saved state initially', () => {
    expect(service.hasSavedState()).toBeFalse();
  });

  it('should save and restore state, then clear it', () => {
    // Arrange
    service.save(mockState);

    // Act
    const restored = service.restore();

    // Assert
    expect(restored).toEqual(mockState);
    expect(service.hasSavedState()).toBeFalse();
  });

  it('should return null when restore is called without a saved state', () => {
    expect(service.restore()).toBeNull();
  });
});
