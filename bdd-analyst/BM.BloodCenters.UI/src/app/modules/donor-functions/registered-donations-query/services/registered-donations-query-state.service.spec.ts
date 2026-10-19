import { RegisteredDonationsQueryStateService, RdqSavedState } from './registered-donations-query-state.service';

describe('RegisteredDonationsQueryStateService', () => {
  let service: RegisteredDonationsQueryStateService;

  const mockState: RdqSavedState = {
    filterFormValues: {
      driveDateFrom: null,
      driveDateTo: null,
      driveId: 'D001',
      userId: null,
    },
    unitIdRaw: 'W001',
    allData: [],
    dataSource: [],
    totalFound: 0,
    hasRetrievedData: true,
    showEmptyState: false,
    currentSortColumn: '',
    currentSortDirection: 'A',
    driveOptions: [],
    userOptions: [],
  };

  beforeEach(() => {
    service = new RegisteredDonationsQueryStateService();
  });


  it('should save and restore state', () => {
    service.save(mockState);
    expect(service.hasSavedState()).toBeTrue();

    const restored = service.restore();
    expect(restored).toEqual(mockState);
  });


  it('should overwrite previous state on save', () => {
    service.save(mockState);

    const newState: RdqSavedState = {
      ...mockState,
      totalFound: 10,
      hasRetrievedData: false,
    };
    service.save(newState);

    const restored = service.restore();
    expect(restored?.totalFound).toBe(10);
    expect(restored?.hasRetrievedData).toBeFalse();
  });

  it('should return null when restore is called without any save', () => {
    const restored = service.restore();
    expect(restored).toBeNull();
  });

  it('should clear state after restore (one-shot)', () => {
    service.save(mockState);
    const first = service.restore();
    expect(first).toEqual(mockState);

    const second = service.restore();
    expect(second).toBeNull();
  });

  it('should return false for hasSavedState initially', () => {
    expect(service.hasSavedState()).toBeFalse();
  });
});
