import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { MatchingProductsStateService, MatchingProductsResult, ParentFormState } from './matching-products-state.service';

describe('MatchingProductsStateService', () => {
  let service: MatchingProductsStateService;
  let routerEvents$: Subject<any>;

  beforeEach(() => {
    routerEvents$ = new Subject();
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: routerEvents$.asObservable() });

    TestBed.configureTestingModule({
      providers: [
        MatchingProductsStateService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(MatchingProductsStateService);
  });

  describe('saveState', () => {
    it('should store input data and parent state', () => {
      const data = { orderItem: {} } as any;
      const parentState = { typeCode: 'TC', orderNo: '1' } as ParentFormState;

      service.saveState(data, parentState);

      expect(service.restoreInputData()).toEqual(data);
      expect(service.getParentFormState()).toEqual(parentState);
    });
  });

  describe('restoreInputData', () => {
    it('should return null when no state saved', () => {
      expect(service.restoreInputData()).toBeNull();
    });
  });

  describe('getParentFormState', () => {
    it('should return null when no state saved', () => {
      expect(service.getParentFormState()).toBeNull();
    });
  });

  describe('setResult / consumeResult', () => {
    it('should store result and clear on consume', () => {
      const result: MatchingProductsResult = { allocated: true, count: 5 };

      service.setResult(result);
      const consumed = service.consumeResult();

      expect(consumed).toEqual(result);
      expect(service.consumeResult()).toBeNull();
    });
  });

  describe('consumeResult', () => {
    it('should return null when no result set', () => {
      expect(service.consumeResult()).toBeNull();
    });
  });

  describe('clear', () => {
    it('should reset all stored state', () => {
      service.saveState({} as any, {} as ParentFormState);
      service.setResult({ allocated: true });

      service.clear();

      expect(service.restoreInputData()).toBeNull();
      expect(service.getParentFormState()).toBeNull();
      expect(service.consumeResult()).toBeNull();
    });
  });
});
