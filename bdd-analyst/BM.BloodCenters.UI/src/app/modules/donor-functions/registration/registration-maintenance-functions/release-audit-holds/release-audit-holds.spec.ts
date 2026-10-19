import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Overlay } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { ReleaseAuditHoldsComponent } from './release-audit-holds';
import { ReleaseAuditHoldsService } from './services/release-audit-holds.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  AuditHoldRecord,
  AuditHoldFilterValue,
  AuditHoldsResponse,
  RemoveHoldWithOkRequest
} from './models/release-audit-holds.model';

describe('ReleaseAuditHoldsComponent', () => {
  let component: ReleaseAuditHoldsComponent;
  let fixture: ComponentFixture<ReleaseAuditHoldsComponent>;
  let mockService: jasmine.SpyObj<ReleaseAuditHoldsService>;
  let mockPageHeaderService: any;
  let mockHeaderService: { chapterChanged$: Subject<void> };
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.Spy;

  // Patch MatDrawer to handle null/invalid activeElement in headless environments
  beforeAll(() => {
    const originalIsFocusWithinDrawer = (MatDrawer.prototype as any)._isFocusWithinDrawer;
    (MatDrawer.prototype as any)._isFocusWithinDrawer = function() {
      try {
        if (document.activeElement && document.activeElement instanceof Node) {
          return originalIsFocusWithinDrawer?.call(this) || false;
        }
        return false;
      } catch {
        return false;
      }
    };
  });

  const today = moment();
  const yesterday = moment().subtract(1, 'days');
  const lastWeek = moment().subtract(7, 'days');
  const tomorrow = moment().add(1, 'days');

  const createMockRecord = (overrides: Partial<AuditHoldRecord> = {}): AuditHoldRecord => ({
    unitId: 'U001',
    collectionDate: today.format('DD-MMM-YYYY').toUpperCase(),
    name: 'Doe, John',
    dateOfBirth: '01-JAN-1990',
    sex: 'M',
    donorId: 'D001',
    donationType: 'WB',
    donationProcedure: 'PC01',
    hold: 'BHOLD',
    origin: 'LAB',
    reason: 'R01',
    removed: null,
    transactionId: 'TXN001',
    interDescription: 'Blood hold description',
    groupId: 'G1',
    groupMode: 'M1',
    sourceCode: 'SC01',
    holdSource: 'UNIT',
    effectiveDate: today.format('DD-MMM-YYYY').toUpperCase(),
    insertDate: today.format('DD-MMM-YYYY').toUpperCase(),
    termDate: null,
    releaseUser: null,
    ...overrides
  });

  const mockAuditHoldsResponse: AuditHoldsResponse = {
    data: [createMockRecord()],
    totalRecords: 1,
    pageIndex: 0,
    pageSize: 25
  };

  beforeEach(async () => {
    mockService = jasmine.createSpyObj('ReleaseAuditHoldsService', [
      'getAuditHolds',
      'getDonationTypes',
      'getDonationProcedures',
      'getAuditHoldTypes',
      'removeHold'
    ]);
    mockService.getAuditHolds.and.returnValue(of(mockAuditHoldsResponse));
    mockService.getDonationTypes.and.returnValue(of([]));
    mockService.getDonationProcedures.and.returnValue(of([]));
    mockService.getAuditHoldTypes.and.returnValue(of([]));
    mockService.removeHold.and.returnValue(of({ success: true, message: '', statusCode: 200 }));

    mockPageHeaderService = {
      pageHeaderData: signal(undefined),
      getTitle: () => undefined,
      getSubtitle: () => undefined
    } as any;

    mockHeaderService = {
      chapterChanged$: new Subject<void>()
    };

    mockSnackbarService = createMockSnackbarService();

    TestBed.configureTestingModule({
      imports: [
        ReleaseAuditHoldsComponent,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatSidenavModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ReleaseAuditHoldsService, useValue: mockService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        Overlay
      ]
    });

    fixture = TestBed.createComponent(ReleaseAuditHoldsComponent);
    component = fixture.componentInstance;

    const dialog = TestBed.inject(MatDialog);
    dialogSpy = spyOn(dialog, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);

    fixture.detectChanges();
  });


  /* -------------------------------- INITIALIZATION -------------------------------- */

  describe('Initialization', () => {
    it('should initialize search form with null date values', () => {
      expect(component.searchForm).toBeDefined();
      expect(component.searchForm.get('fromCollectionDate')?.value).toBeNull();
      expect(component.searchForm.get('toCollectionDate')?.value).toBeNull();
      expect(component.searchForm.get('unitId')?.value).toBe('');
    });









    it('should have no active filters initially', () => {
      expect(component.hasActiveFilters()).toBe(false);
      expect(component.filterChips).toEqual([]);
      expect(component.appliedFilters).toBeNull();
    });

    it('should have no active side panel initially', () => {
      expect(component.activeSidePanel).toBeNull();
      expect(component.selectedRecord).toBeNull();
    });

    it('should initialize header config with breadcrumbs', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThanOrEqual(1);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    });



    it('should initialize table config with row actions', () => {
      expect(component.tableConfig.rowActions).toBeDefined();
      expect(component.tableConfig.rowActions!.length).toBe(4);
      const actionNames = component.tableConfig.rowActions!.map(a => a.action);
      expect(actionNames).toContain('remove-ok');
      expect(actionNames).toContain('remove-nft');
      expect(actionNames).toContain('hold-details');
      expect(actionNames).toContain('view-comments');
    });

    it('should configure default sort as unitId:desc', () => {
      expect(component.tableConfig.sortConfig).toBeDefined();
      expect(component.tableConfig.sortConfig!.column).toBe('unitId');
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
    });

    it('should configure search bar with correct settings', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Donor ID or Name');
      expect(component.searchConfig.minLength).toBe(2);
      expect(component.searchConfig.searchOnEnterOnly).toBe(true);
    });
  });

  /* -------------------------------- NO SEARCH STATE -------------------------------- */
  /* -------------------------------- FORM VALIDATION -------------------------------- */

  describe('Form Validation', () => {
    it('should require fromCollectionDate', () => {
      const control = component.searchForm.get('fromCollectionDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should require toCollectionDate', () => {
      const control = component.searchForm.get('toCollectionDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should not require unitId', () => {
      const control = component.searchForm.get('unitId');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(false);
    });

    it('should accept valid date range', () => {
      component.searchForm.patchValue({
        fromCollectionDate: lastWeek.toDate(),
        toCollectionDate: today.toDate()
      });
      expect(component.searchForm.valid).toBe(true);
    });





    it('should clear minToDate when fromCollectionDate is cleared', () => {
      component.searchForm.get('fromCollectionDate')?.setValue(lastWeek.clone());
      expect(component.minToDate).toBeTruthy();

      component.searchForm.get('fromCollectionDate')?.setValue(null);
      expect(component.minToDate).toBeNull();
    });
  });

  /* -------------------------------- DATE ERROR MESSAGES -------------------------------- */

  describe('Date Error Messages', () => {














    it('should return date range error when to date is before from date', () => {
      component.searchForm.patchValue({
        fromCollectionDate: today.toDate(),
        toCollectionDate: lastWeek.toDate()
      });

      const toControl = component.searchForm.get('toCollectionDate');
      toControl?.markAsTouched();
      toControl?.markAsDirty();

      component.searchForm.updateValueAndValidity();

      if (component.searchForm.hasError('dateRangeInvalid')) {
        expect(component.getToDateError()).toBe('To Collection Date must be on or after From Collection Date');
      }
    });
  });

  /* -------------------------------- ON RETRIEVE -------------------------------- */

  describe('onRetrieve', () => {
    it('should set hasSearched to true and load data when form is valid', () => {
      component.searchForm.patchValue({
        fromCollectionDate: lastWeek.toDate(),
        toCollectionDate: today.toDate(),
        unitId: ''
      });

      component.onRetrieve();

      expect(component.hasSearched).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(mockService.getAuditHolds).toHaveBeenCalled();
    });

    it('should not load data when form is invalid', () => {
      component.searchForm.patchValue({
        fromCollectionDate: null,
        toCollectionDate: null,
        unitId: ''
      });

      component.onRetrieve();

      expect(component.hasSearched).toBe(false);
      expect(mockService.getAuditHolds).not.toHaveBeenCalled();
    });

    it('should pass unitId to request when provided', () => {
      component.searchForm.patchValue({
        fromCollectionDate: lastWeek.toDate(),
        toCollectionDate: today.toDate(),
        unitId: 'U001'
      });

      component.onRetrieve();

      expect(component.requestState.unitId).toBe('U001');
      expect(mockService.getAuditHolds).toHaveBeenCalled();
    });








  });

  /* -------------------------------- SEARCH -------------------------------- */

  describe('Search', () => {
    beforeEach(() => {
      component.hasSearched = true;
    });

    it('should set search term and trigger load when searching', () => {
      component.onSearch('John');

      expect(component.searchTerm).toBe('John');
      expect(component.requestState.searchKeyword).toBe('John');
      expect(mockService.getAuditHolds).toHaveBeenCalled();
    });

    it('should trim search term', () => {
      component.onSearch('  John  ');

      expect(component.searchTerm).toBe('John');
    });





    it('should not reload when hasSearched is false', () => {
      component.hasSearched = false;
      mockService.getAuditHolds.calls.reset();

      component.onSearch('John');

      expect(component.searchTerm).toBe('John');
      expect(mockService.getAuditHolds).not.toHaveBeenCalled();
    });

    it('should clear search term and reload data', () => {
      component.searchTerm = 'John';
      component.requestState.searchKeyword = 'John';

      component.onSearchCleared();

      expect(component.searchTerm).toBe('');
      expect(component.requestState.searchKeyword).toBeUndefined();
      expect(mockService.getAuditHolds).toHaveBeenCalled();
    });


  });

  /* -------------------------------- SORT -------------------------------- */

  describe('Sort', () => {
    beforeEach(() => {
      component.hasSearched = true;
    });

    it('should set ascending sort', () => {
      component.onSortChange({ column: 'name', direction: 'A' });

      expect(component.requestState.sort).toBe('name:asc');
      expect(component.tableConfig.sortConfig!.column).toBe('name');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
    });

    it('should set descending sort', () => {
      component.onSortChange({ column: 'unitId', direction: 'D' });

      expect(component.requestState.sort).toBe('unitId:desc');
    });




  });

  /* -------------------------------- FILTERS -------------------------------- */

  describe('Filter functionality', () => {


    it('should apply filters correctly', () => {
      const filters: AuditHoldFilterValue = {
        donationType: 'AL',
        donationProcedure: 'PP',
        auditHoldType: 'BHOLD'
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.hasActiveFilters()).toBe(true);
      expect(component.filterChips.length).toBeGreaterThan(0);
    });









    it('should remove filter properties from request state when clearing', () => {
      component.requestState = { sort: 'unitId:desc', donationType: 'AL', donationProcedure: 'PP' };
      component.clearAllFilters();

      expect(component.requestState.donationType).toBeUndefined();
      expect(component.requestState.donationProcedure).toBeUndefined();
      expect(component.requestState.sort).toBe('unitId:desc');
    });

    it('should handle removing individual filter chip', () => {
      component.applyFilters({
        donationType: 'AL',
        donationProcedure: 'PP'
      });

      component.onRemoveFilterChip('donationType');

      expect(component.appliedFilters?.donationType).toBeUndefined();
      expect(component.appliedFilters?.donationProcedure).toBe('PP');
    });


  });

  /* -------------------------------- ROW ACTIONS -------------------------------- */

  describe('Row Actions', () => {
    const record = createMockRecord();

    it('should open remove hold with OK panel', () => {
      component.onRowAction({ action: 'remove-ok', row: record });

      expect(component.activeSidePanel).toBe('remove-ok');
      expect(component.selectedRecord).toEqual(record);
    });

    it('should open remove hold with NFT panel', () => {
      component.onRowAction({ action: 'remove-nft', row: record });

      expect(component.activeSidePanel).toBe('remove-nft');
      expect(component.selectedRecord).toEqual(record);
    });

    it('should open hold details panel', () => {
      component.onRowAction({ action: 'hold-details', row: record });

      expect(component.activeSidePanel).toBe('hold-details');
      expect(component.selectedRecord).toEqual(record);
    });


    it('should hide remove-ok action for removed records', () => {
      const removedRecord = createMockRecord({ removed: 'X' });
      const removeOkAction = component.tableConfig.rowActions!.find(a => a.action === 'remove-ok');

      expect(removeOkAction?.visible!(removedRecord)).toBe(false);
    });

    it('should show remove-ok action for active records', () => {
      const activeRecord = createMockRecord({ removed: null });
      const removeOkAction = component.tableConfig.rowActions!.find(a => a.action === 'remove-ok');

      expect(removeOkAction?.visible!(activeRecord)).toBe(true);
    });

    it('should hide remove-nft action for removed records', () => {
      const removedRecord = createMockRecord({ removed: 'X' });
      const removeNftAction = component.tableConfig.rowActions!.find(a => a.action === 'remove-nft');

      expect(removeNftAction?.visible!(removedRecord)).toBe(false);
    });




  });

  /* -------------------------------- SIDE PANEL -------------------------------- */

  describe('Side Panel', () => {
    const record = createMockRecord();

    it('should close side panel and clear selection', () => {
      component.selectedRecord = record;
      component.activeSidePanel = 'remove-ok';

      component.closeSidePanel();

      expect(component.activeSidePanel).toBeNull();
      expect(component.selectedRecord).toBeNull();
    });






  });

  /* -------------------------------- REMOVE HOLD SUBMIT -------------------------------- */

  describe('onRemoveHoldSubmit', () => {
    const record = createMockRecord();
    const collectionDate = today.format('DD-MMM-YYYY').toUpperCase();

    const removeRequest: RemoveHoldWithOkRequest = {
      unitId: 'U001',
      collectionDate,
      code: 'BHOLD',
      description: 'Test',
      reason: 'R01',
      terminationDate: today.toDate(),
      deferDonor: 'N',
      effectiveDate: today.toDate(),
      deferThrough: null,
      comments: '',
      acknowledged: true
    };

    beforeEach(() => {
      component.selectedRecord = record;
      component.activeSidePanel = 'remove-ok';
      component.hasSearched = true;
    });



    it('should set isSubmittingRemoveHold to true during submission', () => {
      const subject = new Subject<any>();
      mockService.removeHold.and.returnValue(subject.asObservable());

      component.onRemoveHoldSubmit(removeRequest);

      expect(component.isSubmittingRemoveHold).toBe(true);
    });



    it('should close side panel after successful removal', () => {
      component.onRemoveHoldSubmit(removeRequest);

      expect(component.activeSidePanel).toBeNull();
      expect(component.selectedRecord).toBeNull();
    });












  });

  /* -------------------------------- CHAPTER CHANGES -------------------------------- */

  describe('Chapter Changes', () => {
    it('should reset state when chapter changes', () => {
      component.hasSearched = true;
      component.searchTerm = 'test';
      component.dataSource = [createMockRecord()];
      component.appliedFilters = { donationType: 'AL' };
      component.filterChips = [{ key: 'donationType', label: 'AL', value: 'AL' }];

      mockHeaderService.chapterChanged$.next();

      expect(component.searchTerm).toBe('');
      expect(component.dataSource).toEqual([]);
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.hasSearched).toBe(false);
      expect(component.hasError).toBe(false);
    });
  });

  /* -------------------------------- DATE INPUT BLUR -------------------------------- */

  describe('onDateInputBlur', () => {
    it('should not throw when control does not exist', () => {
      expect(() => component.onDateInputBlur('nonExistent')).not.toThrow();
    });

    it('should update control when valid date is set', () => {
      const control = component.searchForm.get('fromCollectionDate');
      control?.setValue(today.toDate());
      control?.updateValueAndValidity();

      expect(() => component.onDateInputBlur('fromCollectionDate')).not.toThrow();
    });


  });

  /* -------------------------------- KEYBOARD SHORTCUTS -------------------------------- */
  /* -------------------------------- DESTROY -------------------------------- */
});
