import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { CustomerProfileListStateService, CustomerProfileListSavedState } from './customer-profile-list-state.service';

describe('CustomerProfileListStateService', () => {
  let service: CustomerProfileListStateService;
  let routerEvents$: Subject<any>;

  const mockState: CustomerProfileListSavedState = {
    showTerminated: 'N',
    dataSource: [],
    totalRecords: 0,
    searchKeyword: '',
    pageSize: 10,
    pageIndex: 0,
    sortColumn: '',
    sortOrder: 'asc',
    appliedFilters: null,
    filterChips: [],
    hasSearched: false,
  };

  beforeEach(() => {
    routerEvents$ = new Subject();
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: routerEvents$.asObservable() });

    TestBed.configureTestingModule({
      providers: [
        CustomerProfileListStateService,
        { provide: Router, useValue: routerSpy },
      ],
    });

    service = TestBed.inject(CustomerProfileListStateService);
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

  it('should clear saved state when navigating away from create-customer-profile', () => {
    // Arrange
    service.save(mockState);

    // Act - navigate to a route that is NOT create-customer-profile
    routerEvents$.next(new NavigationEnd(1, '/some-other-route', '/some-other-route'));

    // Assert
    expect(service.hasSavedState()).toBeFalse();
  });

  it('should keep saved state when navigating to create-customer-profile', () => {
    // Arrange
    service.save(mockState);

    // Act
    routerEvents$.next(new NavigationEnd(1, '/create-customer-profile', '/create-customer-profile'));

    // Assert
    expect(service.hasSavedState()).toBeTrue();
  });
});
