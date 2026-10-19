import { TestBed } from '@angular/core/testing';
import { BatchInProgressStateService, BatchInProgressState } from './batch-in-progress-state.service';

describe('BatchInProgressStateService', () => {
  let service: BatchInProgressStateService;

  const createState = (overrides: Partial<BatchInProgressState> = {}): BatchInProgressState => ({
    contractId: 'C001',
    contractName: 'Test Contract',
    timestamp: Date.now(),
    ...overrides,
  });

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(BatchInProgressStateService);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPageState / setPageState', () => {
    it('should return null initially when no state is set', () => {
      expect(service.getPageState()).toBeNull();
    });

    it('should store and retrieve state', () => {
      const state = createState();
      service.setPageState(state);

      const result = service.getPageState();
      expect(result).toBeTruthy();
      expect(result!.contractId).toBe('C001');
      expect(result!.contractName).toBe('Test Contract');
    });

    it('should update timestamp when setting state', () => {
      const state = createState({ timestamp: 1000 });
      service.setPageState(state);

      const result = service.getPageState();
      expect(result!.timestamp).toBeGreaterThan(1000);
    });

    it('should persist to storage when persistToStorage is true', () => {
      const state = createState();
      service.setPageState(state, true);

      const stored = sessionStorage.getItem('batchInProgressQueryState');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.contractId).toBe('C001');
    });

    it('should not persist to storage by default', () => {
      const state = createState();
      service.setPageState(state);

      const stored = sessionStorage.getItem('batchInProgressQueryState');
      expect(stored).toBeNull();
    });

    it('should strip batches array when persisting to storage', () => {
      const state = createState({
        searchState: {
          batches: [{ id: 1 }, { id: 2 }],
          selectedBatchId: 'B1',
          selectedUnitId: null,
          hasSearched: true,
          totalBatches: 2,
          totalUnits: 10,
          unitsWithoutResults: 1,
        },
      });
      service.setPageState(state, true);

      const stored = sessionStorage.getItem('batchInProgressQueryState');
      const parsed = JSON.parse(stored!);
      expect(parsed.searchState.batches).toEqual([]);
      expect(parsed.searchState.selectedBatchId).toBe('B1');
    });
  });

  describe('getPageState$', () => {
    it('should return an observable that emits state changes', (done) => {
      const state = createState();
      service.getPageState$().subscribe(value => {
        if (value !== null) {
          expect(value.contractId).toBe('C001');
          done();
        }
      });
      service.setPageState(state);
    });
  });

  describe('clearPageState', () => {
    it('should clear in-memory state', () => {
      service.setPageState(createState());
      service.clearPageState();
      expect(service.getPageState()).toBeNull();
    });

    it('should clear storage', () => {
      service.setPageState(createState(), true);
      service.clearPageState();
      expect(sessionStorage.getItem('batchInProgressQueryState')).toBeNull();
    });

    it('should clear navigation flag', () => {
      sessionStorage.setItem('bipq_navigating_away', 'true');
      service.clearPageState();
      expect(sessionStorage.getItem('bipq_navigating_away')).toBeNull();
    });
  });

  describe('expired state', () => {
    it('should return null for expired state', () => {
      const expiredTimestamp = Date.now() - (31 * 60 * 1000); // 31 minutes ago
      const state = createState({ timestamp: expiredTimestamp });
      service.setPageState(state);
      // Force the timestamp to be old (setPageState sets Date.now())
      (service as any).pageStateSubject.next({ ...state, timestamp: expiredTimestamp });

      expect(service.getPageState()).toBeNull();
    });
  });

  describe('navigation flags', () => {
    it('setNavigatingAway should set flag in sessionStorage', () => {
      service.setNavigatingAway();
      expect(sessionStorage.getItem('bipq_navigating_away')).toBe('true');
    });

    it('isNavigatingBack should return true when flag is set', () => {
      sessionStorage.setItem('bipq_navigating_away', 'true');
      expect(service.isNavigatingBack()).toBeTrue();
    });

    it('isNavigatingBack should return false when flag is not set', () => {
      expect(service.isNavigatingBack()).toBeFalse();
    });

    it('clearNavigationFlag should remove the flag', () => {
      sessionStorage.setItem('bipq_navigating_away', 'true');
      service.clearNavigationFlag();
      expect(sessionStorage.getItem('bipq_navigating_away')).toBeNull();
    });
  });

  describe('hasPageState', () => {
    it('should return false when no state exists', () => {
      expect(service.hasPageState()).toBeFalse();
    });

    it('should return true when state exists', () => {
      service.setPageState(createState());
      expect(service.hasPageState()).toBeTrue();
    });
  });

  describe('isStateRecent', () => {
    it('should return true for recent state', () => {
      const state = createState({ timestamp: Date.now() });
      expect(service.isStateRecent(state)).toBeTrue();
    });

    it('should return false for old state', () => {
      const state = createState({ timestamp: Date.now() - (6 * 60 * 1000) }); // 6 minutes
      expect(service.isStateRecent(state)).toBeFalse();
    });

    it('should accept custom maxAgeMinutes', () => {
      const state = createState({ timestamp: Date.now() - (6 * 60 * 1000) });
      expect(service.isStateRecent(state, 10)).toBeTrue();
    });
  });

  describe('updateContractContext', () => {
    it('should update contract fields on existing state', () => {
      service.setPageState(createState());
      service.updateContractContext('C002', 'New Contract');

      const result = service.getPageState();
      expect(result!.contractId).toBe('C002');
      expect(result!.contractName).toBe('New Contract');
    });

    it('should create new state if none exists', () => {
      service.updateContractContext('C003', 'Fresh Contract');

      const result = service.getPageState();
      expect(result!.contractId).toBe('C003');
      expect(result!.contractName).toBe('Fresh Contract');
    });
  });

  describe('updateFilterState', () => {
    it('should update filter state on existing state', () => {
      service.setPageState(createState());
      const filterState = {
        selectedChapterFilters: [{ unitId: 'U1', label: 'Unit 1' }],
        selectedBatchFilters: [{ batchId: 'B1', label: 'Batch 1' }],
      };
      service.updateFilterState(filterState);

      const result = service.getPageState();
      expect(result!.filterState).toEqual(filterState);
    });

    it('should do nothing when no existing state', () => {
      service.updateFilterState({
        selectedChapterFilters: [],
        selectedBatchFilters: [],
      });
      expect(service.getPageState()).toBeNull();
    });
  });

  describe('getSearchState / setSearchState', () => {
    it('should return undefined when no state exists', () => {
      expect(service.getSearchState()).toBeUndefined();
    });

    it('should return search state from existing state', () => {
      const searchState = {
        batches: [],
        selectedBatchId: 'B1',
        selectedUnitId: null,
        hasSearched: true,
        totalBatches: 5,
        totalUnits: 10,
        unitsWithoutResults: 2,
      };
      service.setPageState(createState({ searchState }));
      expect(service.getSearchState()).toEqual(jasmine.objectContaining({ selectedBatchId: 'B1' }));
    });

    it('setSearchState should update search state on existing state', () => {
      service.setPageState(createState());
      const searchState = {
        batches: [{ id: 1 }] as any[],
        selectedBatchId: 'B2',
        selectedUnitId: 'U1',
        hasSearched: true,
        totalBatches: 1,
        totalUnits: 5,
        unitsWithoutResults: 0,
      };
      service.setSearchState(searchState);

      const result = service.getSearchState();
      expect(result!.selectedBatchId).toBe('B2');
    });

    it('setSearchState should do nothing when no state exists', () => {
      service.setSearchState({
        batches: [],
        selectedBatchId: null,
        selectedUnitId: null,
        hasSearched: false,
        totalBatches: 0,
        totalUnits: 0,
        unitsWithoutResults: 0,
      });
      expect(service.getPageState()).toBeNull();
    });
  });

  describe('legacy methods', () => {
    it('setSelectedContract should store state', () => {
      service.setSelectedContract(createState());
      expect(service.getSelectedContract()).toBeTruthy();
    });

    it('getSelectedContract should return state', () => {
      service.setPageState(createState());
      expect(service.getSelectedContract()!.contractId).toBe('C001');
    });

    it('clearSelectedContract should clear state', () => {
      service.setPageState(createState());
      service.clearSelectedContract();
      expect(service.getPageState()).toBeNull();
    });

    it('hasSelectedContract should check state existence', () => {
      expect(service.hasSelectedContract()).toBeFalse();
      service.setPageState(createState());
      expect(service.hasSelectedContract()).toBeTrue();
    });
  });
});
