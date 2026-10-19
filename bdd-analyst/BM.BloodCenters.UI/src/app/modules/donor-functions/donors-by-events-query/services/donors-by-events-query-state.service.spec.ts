import { TestBed } from '@angular/core/testing';
import { DonorsByEventsQueryStateService, DeqSavedState } from './donors-by-events-query-state.service';

describe('DonorsByEventsQueryStateService', () => {
  let service: DonorsByEventsQueryStateService;

  const mockState: DeqSavedState = {
    filterFormValues: {
      searchType: 'code', startDate: '2024-01-01', endDate: '2024-12-31',
      code: 'C1', driveId: '', includePinMailed: false,
    },
    dataSource: [], totalCount: 0, pageSize: 25, pageIndex: 0,
    donorIdSortDir: 'ASC', expandedRows: {}, valueCodes: [],
    drivesLov: [], codeDescription: null, reopenDonorId: null,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [DonorsByEventsQueryStateService] });
    service = TestBed.inject(DonorsByEventsQueryStateService);
  });

  it('hasSavedState returns false when no state has been saved', () => {
    expect(service.hasSavedState()).toBe(false);
  });

  it('save stores state and hasSavedState returns true', () => {
    service.save(mockState);
    expect(service.hasSavedState()).toBe(true);
  });

  it('restore returns saved state and clears it (one-time read)', () => {
    service.save(mockState);

    const restored = service.restore();
    expect(restored).toEqual(mockState);
    expect(service.hasSavedState()).toBe(false);
  });

  it('restore returns null when no state is saved', () => {
    expect(service.restore()).toBeNull();
  });
});
