import { TestBed } from '@angular/core/testing';
import { AutoDirProductsStateService, AutoDirProductsState } from './auto-dir-products-state.service';

describe('AutoDirProductsStateService', () => {
  let service: AutoDirProductsStateService;
  let sessionStorageSpy: jasmine.SpyObj<Storage>;

  const mockState: AutoDirProductsState = {
    filters: null,
    units: [],
    totalRecords: 0,
    pageIndex: 0,
    pageSize: 10,
    selectedUnitId: null,
    filterChips: [],
    searched: false,
  };

  beforeEach(() => {
    sessionStorageSpy = jasmine.createSpyObj('sessionStorage', ['getItem', 'setItem', 'removeItem']);
    spyOnProperty(window, 'sessionStorage', 'get').and.returnValue(sessionStorageSpy);

    TestBed.configureTestingModule({
      providers: [AutoDirProductsStateService],
    });

    service = TestBed.inject(AutoDirProductsStateService);
  });

  describe('saveState', () => {
    it('should save state to sessionStorage', (done) => {
      service.saveState(mockState);

      expect(sessionStorageSpy.setItem).toHaveBeenCalledWith(
        'auto-dir-products-state',
        JSON.stringify(mockState)
      );
      done();
    });
  });

  describe('restoreState', () => {
    it('should return null when no state exists', (done) => {
      sessionStorageSpy.getItem.and.returnValue(null);

      const result = service.restoreState();

      expect(result).toBeNull();
      done();
    });
  });

  describe('clearState', () => {
    it('should remove state from sessionStorage', (done) => {
      service.clearState();

      expect(sessionStorageSpy.removeItem).toHaveBeenCalledWith('auto-dir-products-state');
      done();
    });
  });

  describe('hasState', () => {
    it('should return true when state exists', (done) => {
      sessionStorageSpy.getItem.and.returnValue(JSON.stringify(mockState));

      const result = service.hasState();

      expect(result).toBeTrue();
      done();
    });
  });
});
