import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  Component, Input, Output, EventEmitter, signal,
  NO_ERRORS_SCHEMA
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OverlayModule } from '@angular/cdk/overlay';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { CustomerProfileListComponent } from './customer-profile-list';
import { CustomerProfileApiService } from '../services/customer-profile-api.service';
import { CustomerProfileListStateService } from '../services/customer-profile-list-state.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { CustomerProfileDto } from '../models/customer-profile.model';

// ── Stubs for complex child components ──────────────────────────────────────

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub { @Input() config: any; }

@Component({ selector: 'app-data-table', template: '', standalone: true })
class DataTableStub {
  @Input() config: any;
  @Input() data: any;
  @Output() pageChange = new EventEmitter<any>();
  @Output() sortChange = new EventEmitter<any>();
  @Output() rowAction = new EventEmitter<any>();
}

@Component({ selector: 'app-search-bar', template: '', standalone: true })
class SearchBarStub {
  @Input() config: any;
  @Input() value: any;
  @Output() search = new EventEmitter<string>();
}

@Component({ selector: 'app-filter-chips', template: '', standalone: true })
class FilterChipsStub {
  @Input() chips: any[] = [];
  @Output() removeChip = new EventEmitter<any>();
}

@Component({ selector: 'app-loading-spinner', template: '', standalone: true })
class LoadingSpinnerStub { @Input() isLoading = false; }

// ── Mock data ────────────────────────────────────────────────────────────────

const mockCustomer: CustomerProfileDto = {
  customerId: '001-H-0001',
  chapterId: '001',
  name: 'Test Hospital',
  customerType: 'H',
  customerTypeDesc: 'Hospital',
  customerTypeDescription: 'H- Hospital',
  shortName: 'TEST HOSP',
  alphaKey: 'TESTHOSP',
  intFlag: 'N',
  address1: '123 Main St',
  address2: null,
  address3: null,
  city: 'Dallas',
  state: 'TX',
  zip: '75001',
  country: 'USA',
  phoneNo: '2145551234',
  phoneExt: null,
  faxNo: null,
  intPhone: null,
  telexNo: null,
  codFlag: 'N',
  returnAcceptedFlag: 'Y',
  arAccount: 'AR001',
  fiPriceSchNo: '1',
  priceChangeFlag: null,
  ednGenFlag: 'N',
  plasmaFileType: null,
  phApprFlag: null,
  insApprFlag: null,
  effDate: '2024-01-01',
  termDate: null,
  lastModifiedDate: '2024-01-01T00:00:00Z',
  payeeId: null,
  payeeName: null
};

const mockApiResponse = {
  data: [mockCustomer],
  total: 1,
  totalCount: 1,
  success: true,
  statusCode: 200,
  message: 'Success'
};

describe('CustomerProfileListComponent', () => {
  let component: CustomerProfileListComponent;
  let fixture: ComponentFixture<CustomerProfileListComponent>;
  let apiSpy: jasmine.SpyObj<CustomerProfileApiService>;
  let stateSpy: jasmine.SpyObj<CustomerProfileListStateService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let chapterChanged$: Subject<void>;

  beforeEach(async () => {
    chapterChanged$ = new Subject<void>();

    apiSpy = jasmine.createSpyObj('CustomerProfileApiService', ['getCustomerProfiles']);
    apiSpy.getCustomerProfiles.and.returnValue(of(mockApiResponse));

    stateSpy = jasmine.createSpyObj('CustomerProfileListStateService', ['restore', 'save', 'clear']);
    stateSpy.restore.and.returnValue(null);

    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showError', 'showSuccess']);
    snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['dismiss']);

    const headerSpy = jasmine.createSpyObj('HeaderService', ['chapterTimeZone'], {
      chapterChanged$: chapterChanged$.asObservable()
    });
    const pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', ['setTitle']);

    await TestBed.configureTestingModule({
      imports: [
        CustomerProfileListComponent,
        NoopAnimationsModule,
        MatSnackBarModule,
        OverlayModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CustomerProfileApiService, useValue: apiSpy },
        { provide: CustomerProfileListStateService, useValue: stateSpy },
        { provide: Router, useValue: routerSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .overrideComponent(CustomerProfileListComponent, {
        set: {
          schemas: [CUSTOM_ELEMENTS_SCHEMA],
          imports: [
            CommonModule,
            ReactiveFormsModule,
            MatButtonModule,
            MatIconModule,
            MatFormFieldModule,
            MatInputModule,
            MatSelectModule,
            MatProgressSpinnerModule,
            PageHeaderStub,
            DataTableStub,
            SearchBarStub,
            FilterChipsStub,
            LoadingSpinnerStub
          ]
        }
      })
      .compileComponents();

    fixture = TestBed.createComponent(CustomerProfileListComponent);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {

    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should default showTerminatedControl to N', () => {
      fixture.detectChanges();
      expect(component.showTerminatedControl.value).toBe('N');
    });

    it('should auto-load on init when no saved state', fakeAsync(() => {
      stateSpy.restore.and.returnValue(null);
      fixture.detectChanges();
      tick();

      expect(component.hasSearched()).toBe(true);
      expect(apiSpy.getCustomerProfiles).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({ includeTerminated: false })
      );
    }));

    it('should not call getCustomerProfiles when state is restored without hasSearched', fakeAsync(() => {
      stateSpy.restore.and.returnValue({
        showTerminated: 'N',
        dataSource: [],
        totalRecords: 0,
        searchKeyword: '',
        pageSize: 25,
        pageIndex: 0,
        sortColumn: 'customerId',
        sortOrder: 'ASC',
        appliedFilters: null,
        filterChips: [],
        hasSearched: false
      });

      fixture.detectChanges();
      tick();

      expect(apiSpy.getCustomerProfiles).not.toHaveBeenCalled();
    }));

    it('should call getCustomerProfiles when state is restored with hasSearched=true', fakeAsync(() => {
      stateSpy.restore.and.returnValue({
        showTerminated: 'Y',
        dataSource: [mockCustomer],
        totalRecords: 1,
        searchKeyword: '',
        pageSize: 25,
        pageIndex: 0,
        sortColumn: 'customerId',
        sortOrder: 'ASC',
        appliedFilters: null,
        filterChips: [],
        hasSearched: true
      });

      fixture.detectChanges();
      tick();

      expect(apiSpy.getCustomerProfiles).toHaveBeenCalled();
    }));

    it('should populate dataSource on successful load', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.dataSource()).toEqual([mockCustomer]);
    }));

    it('should set hasError on API failure', fakeAsync(() => {
      apiSpy.getCustomerProfiles.and.returnValue(throwError(() => ({ error: { message: 'API error' } })));
      fixture.detectChanges();
      tick();

      expect(component.hasError()).toBe(true);
      expect(snackbarSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Table Columns', () => {

    beforeEach(() => fixture.detectChanges());

    it('should include customerType column with valueFormatter', () => {
      const cols = component.tableConfig.columns;
      const col = cols.find(c => c.key === 'customerType');
      expect(col).toBeTruthy();
      expect(col?.valueFormatter).toBeTruthy();
    });

    it('customerType formatter shows "code - description" when description present', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'customerType');
      const result = col?.valueFormatter?.('H', { customerType: 'H', customerTypeDescription: 'Hospital' } as any);
      expect(result).toBe('H - Hospital');
    });

    it('customerType formatter shows just code when no description', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'customerType');
      const result = col?.valueFormatter?.('H', { customerType: 'H', customerTypeDescription: null } as any);
      expect(result).toBe('H');
    });

    it('should have customerId as first column', () => {
      expect(component.tableConfig.columns[0].key).toBe('customerId');
    });
  });

  describe('Search', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiSpy.getCustomerProfiles.calls.reset();
    }));

    it('should reload with search keyword when hasSearched is true', fakeAsync(() => {
      component.onSearch('Test Hospital');
      tick();

      expect(apiSpy.getCustomerProfiles).toHaveBeenCalledWith(
        jasmine.any(Number),
        jasmine.any(Number),
        jasmine.objectContaining({ searchKeyword: 'Test Hospital' })
      );
    }));

    it('should not reload when hasSearched is false', fakeAsync(() => {
      component.hasSearched.set(false);
      component.onSearch('Test');
      tick();

      expect(apiSpy.getCustomerProfiles).not.toHaveBeenCalled();
    }));
  });

  describe('Pagination and Sorting', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiSpy.getCustomerProfiles.calls.reset();
    }));

    it('should reload on page change', fakeAsync(() => {
      component.onPageChange({ pageIndex: 1, pageSize: 25 });
      tick();
      expect(apiSpy.getCustomerProfiles).toHaveBeenCalled();
    }));

    it('should reload on sort change', fakeAsync(() => {
      component.onSortChange({ column: 'name', direction: 'A' });
      tick();
      expect(apiSpy.getCustomerProfiles).toHaveBeenCalled();
    }));

    it('should send ASC when sort direction is A', fakeAsync(() => {
      component.onSortChange({ column: 'name', direction: 'A' });
      tick();

      expect(apiSpy.getCustomerProfiles).toHaveBeenCalledWith(
        jasmine.any(Number), jasmine.any(Number),
        jasmine.objectContaining({ sortOrder: 'ASC' })
      );
    }));

    it('should send DESC when sort direction is not A', fakeAsync(() => {
      component.onSortChange({ column: 'name', direction: 'D' });
      tick();

      expect(apiSpy.getCustomerProfiles).toHaveBeenCalledWith(
        jasmine.any(Number), jasmine.any(Number),
        jasmine.objectContaining({ sortOrder: 'DESC' })
      );
    }));
  });

  describe('Show Terminated', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiSpy.getCustomerProfiles.calls.reset();
    }));

    it('should pass includeTerminated=true when value is Y', fakeAsync(() => {
      component.showTerminatedControl.setValue('Y');
      tick();

      expect(apiSpy.getCustomerProfiles).toHaveBeenCalledWith(
        jasmine.any(Number), jasmine.any(Number),
        jasmine.objectContaining({ includeTerminated: true })
      );
    }));

    it('should pass includeTerminated=false when value is N', fakeAsync(() => {
      component.showTerminatedControl.setValue('Y');
      tick();
      apiSpy.getCustomerProfiles.calls.reset();

      component.showTerminatedControl.setValue('N');
      tick();

      expect(apiSpy.getCustomerProfiles).toHaveBeenCalledWith(
        jasmine.any(Number), jasmine.any(Number),
        jasmine.objectContaining({ includeTerminated: false })
      );
    }));
  });

  describe('Row Actions', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should navigate on view action', () => {
      component.onRowAction({ action: 'view', row: mockCustomer });
      expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should save state before navigating', () => {
      component.onRowAction({ action: 'view', row: mockCustomer });
      expect(stateSpy.save).toHaveBeenCalled();
    });
  });

  describe('Clear Show Terminated', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reset hasSearched to false when clearShowTerminated is called', () => {
      component.clearShowTerminated();
      expect(component.hasSearched()).toBe(false);
    });

    it('should clear dataSource when clearShowTerminated is called', () => {
      component.clearShowTerminated();
      expect(component.dataSource()).toEqual([]);
    });
  });

  describe('Open Add Customer', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should navigate when openAddCustomer is called', () => {
      component.openAddCustomer();
      expect(routerSpy.navigate).toHaveBeenCalled();
    });

    it('should save state when opening add customer', () => {
      component.openAddCustomer();
      expect(stateSpy.save).toHaveBeenCalled();
    });
  });

  describe('Retry Load', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiSpy.getCustomerProfiles.calls.reset();
    }));

    it('should call getCustomerProfiles when retryLoad is called', fakeAsync(() => {
      component.retryLoad();
      tick();
      expect(apiSpy.getCustomerProfiles).toHaveBeenCalled();
    }));
  });

  describe('Column Formatters', () => {

    beforeEach(() => fixture.detectChanges());

    it('effDate column should format date', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effDate');
      const result = col?.valueFormatter?.('', { effDate: '2024-01-11' } as any);
      expect(result).toBe('11-JAN-2024');
    });

    it('termDate column should return empty for null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'termDate');
      const result = col?.valueFormatter?.('', { termDate: null } as any);
      expect(result).toBe('');
    });

    it('termDate column should format non-null termDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'termDate');
      const result = col?.valueFormatter?.('', { termDate: '2024-12-31' } as any);
      expect(result).toBe('31-DEC-2024');
    });

    it('consigneeCount column should default to 0 when null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'consigneeCount');
      const result = col?.valueFormatter?.('', { consigneeCount: null } as any);
      expect(result).toBe('0');
    });
  });

  describe('Filters', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      apiSpy.getCustomerProfiles.calls.reset();
    }));

    it('closeFilterPanel should set isFilterOpen to false', () => {
      component.isFilterOpen = true;
      component.closeFilterPanel();
      expect(component.isFilterOpen).toBe(false);
    });

    it('closeFilterPanel should dispose overlayRef when present', () => {
      const mockOverlayRef = { dispose: jasmine.createSpy('dispose') };
      component['overlayRef'] = mockOverlayRef as any;
      component.closeFilterPanel();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
    });

    it('applyFilters should store filters and reload', fakeAsync(() => {
      const filters = { customerType: 'H' };
      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(apiSpy.getCustomerProfiles).toHaveBeenCalled();
    }));

    it('applyFilters should build customerType filter chip', fakeAsync(() => {
      component.applyFilters({ customerType: 'H' });
      tick();

      const chip = component.filterChips.find(c => c.key === 'customerType');
      expect(chip).toBeTruthy();
      expect(chip?.label).toBe('Type: H');
      expect(chip?.value).toBe('H');
    }));

    it('applyFilters should build effDateAfter filter chip with formatted label', fakeAsync(() => {
      component.applyFilters({ effDateAfter: '2024-01-01' });
      tick();

      const chip = component.filterChips.find(c => c.key === 'effDateAfter');
      expect(chip).toBeTruthy();
      expect(chip?.label).toBe('Effective Date ≥ 01-JAN-2024');
    }));

    it('applyFilters should build effDateBefore filter chip with formatted label', fakeAsync(() => {
      component.applyFilters({ effDateBefore: '2024-12-31' });
      tick();

      const chip = component.filterChips.find(c => c.key === 'effDateBefore');
      expect(chip).toBeTruthy();
      expect(chip?.label).toBe('Effective Date ≤ 31-DEC-2024');
    }));

    it('applyFilters should build termDateAfter filter chip with formatted label', fakeAsync(() => {
      component.applyFilters({ termDateAfter: '2024-01-01' });
      tick();

      const chip = component.filterChips.find(c => c.key === 'termDateAfter');
      expect(chip).toBeTruthy();
      expect(chip?.label).toBe('Termination Date ≥ 01-JAN-2024');
    }));

    it('applyFilters should build termDateBefore filter chip with formatted label', fakeAsync(() => {
      component.applyFilters({ termDateBefore: '2024-12-31' });
      tick();

      const chip = component.filterChips.find(c => c.key === 'termDateBefore');
      expect(chip).toBeTruthy();
      expect(chip?.label).toBe('Termination Date ≤ 31-DEC-2024');
    }));

    it('clearFilters should clear chips and reload', fakeAsync(() => {
      component.applyFilters({ customerType: 'H' });
      tick();
      apiSpy.getCustomerProfiles.calls.reset();

      component.clearFilters();
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(apiSpy.getCustomerProfiles).toHaveBeenCalled();
    }));

    it('removeFilterChip should clear all filters when only one remains', fakeAsync(() => {
      component.applyFilters({ customerType: 'H' });
      tick();
      apiSpy.getCustomerProfiles.calls.reset();

      component.removeFilterChip('customerType');
      tick();

      expect(component.appliedFilters).toBeNull();
      expect(apiSpy.getCustomerProfiles).toHaveBeenCalled();
    }));

    it('removeFilterChip should remove only the specified chip when multiple exist', fakeAsync(() => {
      component.applyFilters({ customerType: 'H', effDateAfter: '2024-01-01' });
      tick();
      apiSpy.getCustomerProfiles.calls.reset();

      component.removeFilterChip('customerType');
      tick();

      expect(component.appliedFilters).not.toEqual(jasmine.objectContaining({ customerType: jasmine.anything() }));
      expect(component.appliedFilters).toEqual(jasmine.objectContaining({ effDateAfter: '2024-01-01' }));
    }));

    it('removeFilterChip should do nothing when no filters applied', () => {
      component.appliedFilters = null;
      expect(() => component.removeFilterChip('customerType')).not.toThrow();
    });
  });

  describe('Chapter Change', () => {

    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear state and reset on chapter change', fakeAsync(() => {
      chapterChanged$.next();
      tick();

      expect(stateSpy.clear).toHaveBeenCalled();
      expect(component.hasSearched()).toBe(false);
    }));
  });
});
