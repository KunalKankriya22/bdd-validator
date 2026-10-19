import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { Component, Input, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import moment from 'moment';

import { BloodProductCredit } from './blood-product-credit';
import { BloodProductCreditService } from './services/blood-product-credit.service';
import { TranslateService } from '@ngx-translate/core';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field/unit-id-field.component';
import { createMockTranslateService } from '@shared/testing/common-mocks';

@Component({ selector: 'app-page-header-with-breadcrumb', template: '', standalone: true })
class PageHeaderStub { @Input() config: any; }

@Component({ selector: 'app-unit-id-field', template: '', standalone: true })
class UnitIdFieldStub {
  @Input() validateFfValue: any;
  @Input() required: any;
  @Input() label: any;
  @Input() requirePostValidation: any;
  @Input() disabled: any;
  @Input() showBarcodeIcon: any;
  clear(): void {}
  focus(): void {}
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const MOCK_CUSTOMERS = [
  { code: 'CUST1', description: 'Hospital A' },
  { code: 'CUST2', description: 'Hospital B' },
];

const MOCK_REASON_CODES = [
  { reasonCode: 'R01', reasonDescription: 'Expired', tranType: 'CR' },
  { reasonCode: 'R02', reasonDescription: 'Damaged', tranType: 'CR' },
  { reasonCode: 'R03', reasonDescription: 'Wrong product', tranType: 'DB' },
];

const MOCK_VALIDATE_UNIT = {
  unitId: 'W0001234567',
  productCode: 'RBC001',
  aliquot: null,
  bloodType: 'O+',
  collectionDate: '2026-07-01',
  shippedDate: '2026-07-15',
  expirationDate: '2026-08-15',
  stockState: 'SH',
  customerId: 'CUST1',
  orderNo: 'ORD100',
};

const MOCK_SAVED_RECORD = {
  unitId: 'W0001234567',
  productCode: 'RBC001',
  requestedBy: 'John',
  requestDate: '2026-07-20',
  reasonCode: 'R01',
  reasonDescription: null,
  tranType: 'CR',
  customerId: 'CUST1',
  aliquot: null,
  amount: null,
  noteId: null,
};

const MOCK_RECORDS_PAGE = {
  data: [MOCK_SAVED_RECORD],
  totalCount: 1,
};

function mockPostValidateEvent(parsedUnitId = 'W0001234567') {
  return {
    data: { parsedUnitId },
    confirm: jasmine.createSpy('confirm'),
    reject: jasmine.createSpy('reject'),
  };
}

// ── Test suite ─────────────────────────────────────────────────────────────────

describe('BloodProductCredit', () => {
  let component: BloodProductCredit;
  let fixture: ComponentFixture<BloodProductCredit>;

  let serviceSpy: jasmine.SpyObj<BloodProductCreditService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTzSpy: jasmine.SpyObj<ChapterTimezoneService>;

  let chapterChanged$: Subject<void>;
  let routeUrl$: Subject<any>;

  const TODAY = moment('2026-08-03');

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('BloodProductCreditService', [
      'getCustomers', 'getReasonCodes', 'validateUnit', 'getAll',
      'create', 'update', 'delete', 'getNote', 'addNote', 'getProductHistory',
    ]);
    serviceSpy.getCustomers.and.returnValue(of(MOCK_CUSTOMERS as any));
    serviceSpy.getReasonCodes.and.returnValue(of(MOCK_REASON_CODES as any));
    serviceSpy.validateUnit.and.returnValue(of(MOCK_VALIDATE_UNIT as any));
    serviceSpy.getAll.and.returnValue(of(MOCK_RECORDS_PAGE as any));
    serviceSpy.create.and.returnValue(of(MOCK_SAVED_RECORD as any));
    serviceSpy.getNote.and.returnValue(of('existing note'));
    serviceSpy.addNote.and.returnValue(of(undefined as any));

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);

    chapterTzSpy = jasmine.createSpyObj('ChapterTimezoneService', ['getChapterLocalDate', 'getChapterLocalDateTime']);
    chapterTzSpy.getChapterLocalDate.and.returnValue(TODAY);

    chapterChanged$ = new Subject<void>();
    routeUrl$ = new Subject<any>();

    TestBed.configureTestingModule({
      imports: [BloodProductCredit, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: BloodProductCreditService, useValue: serviceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { url: routeUrl$.asObservable() } },
        { provide: PageHeaderService, useValue: { pageHeaderData: signal(null), getTitle: () => '', getSubtitle: () => '' } },
        { provide: HeaderService, useValue: { chapterChanged$ } },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ChapterTimezoneService, useValue: chapterTzSpy },
        { provide: TranslateService, useValue: createMockTranslateService() },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
    .overrideComponent(BloodProductCredit, {
      remove: { imports: [PageHeaderWithBreadcrumb, UnitIdFieldComponent] },
      add: {
        imports: [PageHeaderStub, UnitIdFieldStub],
        providers: [
          { provide: MatDialog, useValue: dialogSpy },
        ],
      },
    });

    fixture = TestBed.createComponent(BloodProductCredit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Creation & Init ──────────────────────────────────────────────────────────

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should load customers on init', () => {
    expect(serviceSpy.getCustomers).toHaveBeenCalled();
    expect(component.customers().length).toBe(2);
    expect(component.filteredCustomers().length).toBe(2);
  });

  it('should load reason codes on init', () => {
    expect(serviceSpy.getReasonCodes).toHaveBeenCalled();
    expect(component.reasonCodes().length).toBe(3);
  });

  it('should handle loadCustomers error gracefully', () => {
    serviceSpy.getCustomers.and.returnValue(throwError(() => new Error('fail')));
    component['loadCustomers']();
    expect(component.customers().length).toBe(2);
  });

  it('should handle loadReasonCodes error gracefully', () => {
    serviceSpy.getReasonCodes.and.returnValue(throwError(() => new Error('fail')));
    component['loadReasonCodes']();
    expect(component.reasonCodes().length).toBe(3);
  });

  it('should create filter and entry forms', () => {
    expect(component.filterForm).toBeTruthy();
    expect(component.entryForm).toBeTruthy();
    expect(component.filterForm.get('customerId')).toBeTruthy();
    expect(component.filterForm.get('tranType')).toBeTruthy();
    expect(component.entryForm.get('productCode')).toBeTruthy();
    expect(component.entryForm.get('requestedBy')).toBeTruthy();
    expect(component.entryForm.get('requestDate')).toBeTruthy();
    expect(component.entryForm.get('reasonCode')).toBeTruthy();
  });

  it('should set maxDate to chapter local date', () => {
    expect(component.maxDate().isSame(TODAY)).toBeTrue();
  });

  // ── Page header effect ───────────────────────────────────────────────────────

  it('should update page header when pageHeaderData changes', () => {
    const pageHeaderService = TestBed.inject(PageHeaderService);
    (pageHeaderService.pageHeaderData as any).set({ title: 'Test Title', subtitle: 'Sub' });
    fixture.detectChanges();
    expect(component.pageHeaderConfig.title).toBe('Test Title');
    expect(component.pageHeaderConfig.breadcrumbs[1].label).toBe('Test Title');
  });

  // ── fullReset ────────────────────────────────────────────────────────────────

  it('should not reset when loading is true', () => {
    component.loading.set(true);
    component.records.set([MOCK_SAVED_RECORD as any]);
    component['fullReset']();
    expect(component.records().length).toBe(1);
  });

  it('should reset all state when loading is false', () => {
    component.records.set([MOCK_SAVED_RECORD as any]);
    component.tableConfig.pagination!.totalRecords = 5;
    component.showEntrySection.set(true);
    component['fullReset']();
    expect(component.records().length).toBe(0);
    expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    expect(component.showEntrySection()).toBeFalse();
  });

  // ── Route activation ────────────────────────────────────────────────────────

  it('should reset on route activation', () => {
    component.records.set([MOCK_SAVED_RECORD as any]);
    routeUrl$.next([]);
    expect(component.records().length).toBe(0);
  });

  // ── Chapter change ───────────────────────────────────────────────────────────

  it('should reload customers and reason codes on chapter change', () => {
    serviceSpy.getCustomers.calls.reset();
    serviceSpy.getReasonCodes.calls.reset();
    chapterChanged$.next();
    expect(serviceSpy.getCustomers).toHaveBeenCalled();
    expect(serviceSpy.getReasonCodes).toHaveBeenCalled();
  });

  // ── showEntrySection via filterForm ──────────────────────────────────────────

  it('should show entry section when both customerId and tranType are set', () => {
    component.filterForm.patchValue({ customerId: 'CUST1', tranType: 'CR' });
    expect(component.showEntrySection()).toBeTrue();
  });

  it('should hide entry section when customerId is null', () => {
    component.filterForm.patchValue({ customerId: null, tranType: 'CR' });
    expect(component.showEntrySection()).toBeFalse();
  });

  // ── Filter section handlers ──────────────────────────────────────────────────

  describe('onCustomerChange', () => {
    it('should set selected customer name', () => {
      component.filterForm.get('customerId')?.setValue('CUST1');
      component.onCustomerChange();
      expect(component.selectedCustomerName()).toBe('Hospital A');
    });

    it('should set null when customer not found', () => {
      component.filterForm.get('customerId')?.setValue('UNKNOWN');
      component.onCustomerChange();
      expect(component.selectedCustomerName()).toBeNull();
    });

    it('should reset tranType and clear records', () => {
      component.filterForm.patchValue({ customerId: 'CUST1', tranType: 'CR' });
      component.records.set([MOCK_SAVED_RECORD as any]);
      component.tableConfig.pagination!.totalRecords = 5;
      component.onCustomerChange();
      expect(component.filterForm.get('tranType')?.value).toBeNull();
      expect(component.showEntrySection()).toBeFalse();
      expect(component.records().length).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });
  });

  describe('onTranTypeChange', () => {
    it('should filter reason codes by tranType', () => {
      component.filterForm.patchValue({ tranType: 'CR' });
      component.onTranTypeChange();
      expect(component.filteredReasonCodes().length).toBe(2);
      expect(component.filteredReasonCodes().every(r => r.tranType === 'CR')).toBeTrue();
    });

    it('should clear current reason code if not in filtered list', () => {
      component.entryForm.get('reasonCode')?.setValue('R03');
      component.filterForm.patchValue({ tranType: 'CR' });
      component.onTranTypeChange();
      expect(component.entryForm.get('reasonCode')?.value).toBeNull();
    });

    it('should reset reason code even if it exists in filtered list (resets entry section)', () => {
      component.entryForm.get('reasonCode')?.setValue('R01');
      component.filterForm.patchValue({ tranType: 'CR' });
      component.onTranTypeChange();
      expect(component.entryForm.get('reasonCode')?.value).toBeNull();
    });

    it('should reset records and pagination', () => {
      component.records.set([MOCK_SAVED_RECORD as any]);
      component.tableConfig.pagination!.totalRecords = 10;
      component.tableConfig.pagination!.pageIndex = 2;
      component.onTranTypeChange();
      expect(component.records().length).toBe(0);
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  // ── Search filters ───────────────────────────────────────────────────────────

  describe('search filters', () => {
    it('should filter customers by search term', fakeAsync(() => {
      component.customerSearchCtrl.setValue('hosp');
      tick(250);
      expect(component.filteredCustomers().length).toBe(2);

      component.customerSearchCtrl.setValue('hospital a');
      tick(250);
      expect(component.filteredCustomers().length).toBe(1);
      expect(component.filteredCustomers()[0].code).toBe('CUST1');
    }));

    it('should reset customer filter when search is empty', fakeAsync(() => {
      component.customerSearchCtrl.setValue('xyz');
      tick(250);
      component.customerSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredCustomers().length).toBe(2);
    }));

    it('should filter tran types by search term', fakeAsync(() => {
      component.tranTypeSearchCtrl.setValue('cred');
      tick(250);
      expect(component.filteredTranTypes().length).toBe(1);
      expect(component.filteredTranTypes()[0].code).toBe('CR');
    }));

    it('should reset tran type filter when search is empty', fakeAsync(() => {
      component.tranTypeSearchCtrl.setValue('cred');
      tick(250);
      component.tranTypeSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredTranTypes().length).toBe(2);
    }));

    it('should filter product codes by search term', fakeAsync(() => {
      component.productCodes.set([
        { productCode: 'RBC001', productDescription: 'Red Blood Cells' },
        { productCode: 'PLT001', productDescription: 'Platelets' },
      ]);
      component.filteredProductCodes.set(component.productCodes());
      component.productCodeSearchCtrl.setValue('red');
      tick(250);
      expect(component.filteredProductCodes().length).toBe(1);
    }));

    it('should reset product code filter when search is empty', fakeAsync(() => {
      component.productCodes.set([
        { productCode: 'RBC001', productDescription: 'Red Blood Cells' },
      ]);
      component.productCodeSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredProductCodes().length).toBe(1);
    }));

    it('should filter reason codes by search term and tranType', fakeAsync(() => {
      component.filterForm.patchValue({ tranType: 'CR' });
      component.reasonCodeSearchCtrl.setValue('expir');
      tick(250);
      expect(component.filteredReasonCodes().length).toBe(1);
      expect(component.filteredReasonCodes()[0].reasonCode).toBe('R01');
    }));

    it('should show all reason codes when no tranType filter', fakeAsync(() => {
      component.filterForm.patchValue({ tranType: null });
      component.reasonCodeSearchCtrl.setValue('');
      tick(250);
      expect(component.filteredReasonCodes().length).toBe(3);
    }));
  });

  // ── In-memory records (no loadRecords — insert-only form) ────────────────────

  // ── Pagination & Sort ────────────────────────────────────────────────────────

  describe('onPageChange', () => {
    it('should update page index and size without calling backend', () => {
      serviceSpy.getAll.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 50, previousPageIndex: 1 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(serviceSpy.getAll).not.toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    it('should update sortConfig without calling backend', () => {
      serviceSpy.getAll.calls.reset();
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(serviceSpy.getAll).not.toHaveBeenCalled();
    });

    it('should sort records in-memory ascending', () => {
      component.records.set([
        { ...MOCK_SAVED_RECORD, unitId: 'W003' } as any,
        { ...MOCK_SAVED_RECORD, unitId: 'W001' } as any,
        { ...MOCK_SAVED_RECORD, unitId: 'W002' } as any,
      ]);
      component.onSortChange({ column: 'unitId', direction: 'A' });
      expect(component.records().map(r => r.unitId)).toEqual(['W001', 'W002', 'W003']);
    });

    it('should sort records in-memory descending', () => {
      component.records.set([
        { ...MOCK_SAVED_RECORD, unitId: 'W001' } as any,
        { ...MOCK_SAVED_RECORD, unitId: 'W003' } as any,
        { ...MOCK_SAVED_RECORD, unitId: 'W002' } as any,
      ]);
      component.onSortChange({ column: 'unitId', direction: 'D' });
      expect(component.records().map(r => r.unitId)).toEqual(['W003', 'W002', 'W001']);
    });

    it('should not reorder records when direction is default', () => {
      component.records.set([
        { ...MOCK_SAVED_RECORD, unitId: 'W003' } as any,
        { ...MOCK_SAVED_RECORD, unitId: 'W001' } as any,
      ]);
      component.onSortChange({ column: 'unitId', direction: 'default' });
      expect(component.records().map(r => r.unitId)).toEqual(['W003', 'W001']);
    });
  });

  describe('onRowAction', () => {
    it('should call onEnterNotes for enter-notes action', () => {
      spyOn(component, 'onEnterNotes');
      component.onRowAction({ action: 'enter-notes', row: MOCK_SAVED_RECORD as any });
      expect(component.onEnterNotes).toHaveBeenCalledWith(MOCK_SAVED_RECORD as any);
    });

    it('should call onProductHistory for product-history action', () => {
      spyOn(component, 'onProductHistory');
      component.onRowAction({ action: 'product-history', row: MOCK_SAVED_RECORD as any });
      expect(component.onProductHistory).toHaveBeenCalledWith(MOCK_SAVED_RECORD as any);
    });
  });

  // ── Unit ID handlers ─────────────────────────────────────────────────────────

  describe('onUnitPostValidate', () => {
    it('should reject when no customerId is selected', () => {
      component.filterForm.get('customerId')?.setValue(null);
      const event = mockPostValidateEvent();
      component.onUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Please select a Customer ID first');
    });

    it('should set state and confirm on successful validation', () => {
      component.filterForm.get('customerId')?.setValue('CUST1');
      const event = mockPostValidateEvent();
      component.onUnitPostValidate(event as any);
      expect(component.parsedUnitId()).toBe('W0001234567');
      expect(component.parsedOrderNo()).toBe('ORD100');
      expect(component.unitValidated()).toBeTrue();
      expect(component.entryForm.get('productCode')?.value).toBe('RBC001');
      expect(component.productCodes().length).toBe(1);
      expect(event.confirm).toHaveBeenCalled();
    });

    it('should set orderNo to null when not present', () => {
      serviceSpy.validateUnit.and.returnValue(of({ ...MOCK_VALIDATE_UNIT, orderNo: null } as any));
      component.filterForm.get('customerId')?.setValue('CUST1');
      const event = mockPostValidateEvent();
      component.onUnitPostValidate(event as any);
      expect(component.parsedOrderNo()).toBeNull();
    });

    it('should reject and reset state on validation error', () => {
      serviceSpy.validateUnit.and.returnValue(throwError(() => new Error('Not eligible')));
      component.filterForm.get('customerId')?.setValue('CUST1');
      const event = mockPostValidateEvent();
      component.onUnitPostValidate(event as any);
      expect(component.unitValidated()).toBeFalse();
      expect(component.parsedUnitId()).toBeNull();
      expect(component.productCodes().length).toBe(0);
      expect(event.reject).toHaveBeenCalledWith('Not eligible');
    });

    it('should use fallback message when error has no message', () => {
      serviceSpy.validateUnit.and.returnValue(throwError(() => ({})));
      component.filterForm.get('customerId')?.setValue('CUST1');
      const event = mockPostValidateEvent();
      component.onUnitPostValidate(event as any);
      expect(event.reject).toHaveBeenCalledWith('Unit not found or not eligible for this customer');
    });
  });

  describe('onUnitIdValidated', () => {
    it('should be a no-op', () => {
      expect(() => component.onUnitIdValidated({} as any)).not.toThrow();
    });
  });

  describe('onUnitIdCleared', () => {
    it('should reset all unit-related state', () => {
      component.parsedUnitId.set('W123');
      component.parsedOrderNo.set('ORD1');
      component.unitValidated.set(true);
      component.productCodes.set([{ productCode: 'X', productDescription: 'X' }]);
      component.filteredProductCodes.set([{ productCode: 'X', productDescription: 'X' }]);
      component.entryForm.get('productCode')?.setValue('X');

      component.onUnitIdCleared();

      expect(component.parsedUnitId()).toBeNull();
      expect(component.parsedOrderNo()).toBeNull();
      expect(component.unitValidated()).toBeFalse();
      expect(component.productCodes().length).toBe(0);
      expect(component.filteredProductCodes().length).toBe(0);
      expect(component.entryForm.get('productCode')?.value).toBeNull();
    });
  });

  // ── Entry form handlers ──────────────────────────────────────────────────────

  describe('onReasonCodeChange', () => {
    it('should set reason description when reason found', () => {
      component.entryForm.get('reasonCode')?.setValue('R01');
      component.onReasonCodeChange();
      expect(component.selectedReasonDesc()).toBe('Expired');
    });

    it('should set null when reason not found', () => {
      component.entryForm.get('reasonCode')?.setValue('UNKNOWN');
      component.onReasonCodeChange();
      expect(component.selectedReasonDesc()).toBeNull();
    });

    it('should set null when reason code is null', () => {
      component.entryForm.get('reasonCode')?.setValue(null);
      component.onReasonCodeChange();
      expect(component.selectedReasonDesc()).toBeNull();
    });
  });

  describe('onReasonKeydown', () => {
    it('should call onSave on Tab when panel is closed', () => {
      spyOn(component, 'onSave');
      component.reasonCodeSelectRef = { panelOpen: false } as any;
      component.onReasonKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(component.onSave).toHaveBeenCalled();
    });

    it('should not call onSave on Tab when panel is open', () => {
      spyOn(component, 'onSave');
      component.reasonCodeSelectRef = { panelOpen: true } as any;
      component.onReasonKeydown(new KeyboardEvent('keydown', { key: 'Tab' }));
      expect(component.onSave).not.toHaveBeenCalled();
    });

    it('should not call onSave on non-Tab key', () => {
      spyOn(component, 'onSave');
      component.reasonCodeSelectRef = { panelOpen: false } as any;
      component.onReasonKeydown(new KeyboardEvent('keydown', { key: 'Enter' }));
      expect(component.onSave).not.toHaveBeenCalled();
    });
  });

  // ── onSave & executeSave ─────────────────────────────────────────────────────

  describe('onSave', () => {
    it('should show error when unit not validated', () => {
      component.unitValidated.set(false);
      component.parsedUnitId.set(null);
      component.onSave();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please scan or enter a valid Unit ID');
    });

    it('should mark form touched when invalid', () => {
      component.parsedUnitId.set('W123');
      component.unitValidated.set(true);
      component.entryForm.get('productCode')?.setValue(null);
      component.onSave();
      expect(component.entryForm.get('productCode')?.touched).toBeTrue();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open confirmation dialog with Credit label', () => {
      setupValidEntry('CR');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      component.onSave();
      expect(dialogSpy.open).toHaveBeenCalled();
      const data = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(data.message).toContain('Credited');
      expect(data.message).toContain('Hospital A');
    });

    it('should open confirmation dialog with Debit label', () => {
      setupValidEntry('DB');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      component.onSave();
      const data = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(data.message).toContain('Debited');
    });

    it('should call executeSave when user confirms', () => {
      setupValidEntry('CR');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(serviceSpy.create).toHaveBeenCalled();
    });

    it('should not call executeSave when user cancels', () => {
      setupValidEntry('CR');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      component.onSave();
      expect(serviceSpy.create).not.toHaveBeenCalled();
    });
  });

  describe('executeSave', () => {
    it('should add record to grid and show success on save', () => {
      setupValidEntry('CR');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(component.records().length).toBe(1);
      expect(component.tableConfig.pagination!.totalRecords).toBe(1);
      expect(component.loading()).toBeFalse();
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
    });

    it('should show error snackbar on save failure', () => {
      setupValidEntry('CR');
      serviceSpy.create.and.returnValue(throwError(() => new Error('Duplicate')));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(component.loading()).toBeFalse();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Duplicate');
    });

    it('should show fallback error message when error has no message', () => {
      setupValidEntry('CR');
      serviceSpy.create.and.returnValue(throwError(() => ({})));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save record');
    });

    it('should pass correct DTO to create service', () => {
      setupValidEntry('CR');
      component.entryForm.get('requestedBy')?.setValue('Jane');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      const dto = serviceSpy.create.calls.mostRecent().args[0];
      expect(dto.customerId).toBe('CUST1');
      expect(dto.tranType).toBe('CR');
      expect(dto.unitId).toBe('W0001234567');
      expect(dto.productCode).toBe('RBC001');
      expect(dto.requestedBy).toBe('Jane');
      expect(dto.reasonCode).toBe('R01');
      expect(dto.aliquot).toBeNull();
      expect(dto.orderNo).toBe('ORD100');
    });
  });

  // ── Clear / Reset ────────────────────────────────────────────────────────────

  describe('onClearEntry', () => {
    it('should reset entry form', () => {
      component.entryForm.get('requestedBy')?.setValue('SomeUser');
      component.onClearEntry();
      expect(component.entryForm.get('requestedBy')?.value).toBe('');
    });
  });

  describe('clearAll', () => {
    it('should call fullReset', () => {
      component.records.set([MOCK_SAVED_RECORD as any]);
      component.clearAll();
      expect(component.records().length).toBe(0);
    });
  });

  // ── Row actions ──────────────────────────────────────────────────────────────

  describe('onEnterNotes', () => {
    const row = MOCK_SAVED_RECORD as any;

    it('should load existing note and open dialog on success', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.onEnterNotes(row);
      expect(serviceSpy.getNote).toHaveBeenCalledWith('W0001234567');
      expect(component.loading()).toBeFalse();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should open dialog with null note on getNote error', () => {
      serviceSpy.getNote.and.returnValue(throwError(() => new Error('fail')));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.onEnterNotes(row);
      expect(component.loading()).toBeFalse();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should save note when dialog returns a note', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ note: 'New note' }) } as any);
      component.onEnterNotes(row);
      expect(serviceSpy.addNote).toHaveBeenCalledWith('W0001234567', 'New note');
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Note saved successfully');
    });

    it('should not save when dialog returns null', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.onEnterNotes(row);
      expect(serviceSpy.addNote).not.toHaveBeenCalled();
    });

    it('should not save when dialog result has no note', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ note: '' }) } as any);
      component.onEnterNotes(row);
      expect(serviceSpy.addNote).not.toHaveBeenCalled();
    });

    it('should show error when addNote fails', () => {
      serviceSpy.addNote.and.returnValue(throwError(() => new Error('Save failed')));
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ note: 'Note' }) } as any);
      component.onEnterNotes(row);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Save failed');
    });

    it('should show fallback error when addNote fails without message', () => {
      serviceSpy.addNote.and.returnValue(throwError(() => ({})));
      dialogSpy.open.and.returnValue({ afterClosed: () => of({ note: 'Note' }) } as any);
      component.onEnterNotes(row);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save note');
    });
  });

  describe('onProductHistory', () => {
    it('should navigate to product history with unit ID', () => {
      component.onProductHistory(MOCK_SAVED_RECORD as any);
      expect(routerSpy.navigate).toHaveBeenCalled();
      const navArgs = routerSpy.navigate.calls.mostRecent().args;
      expect(navArgs[1]).toEqual({ queryParams: { unitId: 'W0001234567' } });
    });
  });

  // ── formatDate ───────────────────────────────────────────────────────────────

  describe('formatDate', () => {
    it('should format valid ISO date', () => {
      expect(component.formatDate('2026-08-03')).toBe('03-AUG-2026');
    });

    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component.formatDate(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should return raw value for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('not-a-date');
    });

    it('should format date with single digit day', () => {
      expect(component.formatDate('2026-01-05')).toBe('05-JAN-2026');
    });
  });

  // ── toIsoDate (private but tested via executeSave) ───────────────────────────

  describe('toIsoDate coverage', () => {
    it('should handle string date', () => {
      setupValidEntry('CR');
      component.entryForm.get('requestDate')?.setValue('2026-07-20');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(serviceSpy.create.calls.mostRecent().args[0].requestDate).toBe('2026-07-20');
    });

    it('should handle Moment date', () => {
      setupValidEntry('CR');
      component.entryForm.get('requestDate')?.setValue(moment('2026-07-20'));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(serviceSpy.create.calls.mostRecent().args[0].requestDate).toBe('2026-07-20');
    });

    it('should handle native Date', () => {
      setupValidEntry('CR');
      component.entryForm.get('requestDate')?.setValue(new Date(2026, 6, 20));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(serviceSpy.create.calls.mostRecent().args[0].requestDate).toBe('2026-07-20');
    });

    it('should handle null requestDate', () => {
      setupValidEntry('CR');
      component.entryForm.get('requestDate')?.clearValidators();
      component.entryForm.get('requestDate')?.updateValueAndValidity();
      component.entryForm.get('requestDate')?.setValue(null);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(serviceSpy.create.calls.mostRecent().args[0].requestDate).toBeNull();
    });
  });

  // ── ngOnDestroy ──────────────────────────────────────────────────────────────

  describe('ngOnDestroy', () => {
    it('should emit next and complete on destroy subject', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  // ── elementId helper ─────────────────────────────────────────────────────────

  it('should generate unique element IDs', () => {
    const id = component.elementId('test');
    expect(id).toContain('blood-product-credit-');
    expect(id).toContain('-test');
  });

  // ── resetEntrySection / resetEntryForm ─────────────────────────────────────

  describe('resetEntrySection', () => {
    it('should clear unit field and reset all unit signals', () => {
      component.parsedUnitId.set('W999');
      component.parsedOrderNo.set('ORD99');
      component.unitValidated.set(true);
      component.productCodes.set([{ productCode: 'P1', productDescription: 'P1' }]);
      component.filteredProductCodes.set([{ productCode: 'P1', productDescription: 'P1' }]);

      component['resetEntrySection']();

      expect(component.parsedUnitId()).toBeNull();
      expect(component.parsedOrderNo()).toBeNull();
      expect(component.unitValidated()).toBeFalse();
      expect(component.productCodes().length).toBe(0);
      expect(component.filteredProductCodes().length).toBe(0);
    });
  });

  describe('resetEntrySection with unitIdField', () => {
    it('should call unitIdField.clear when ViewChild is available', () => {
      const mockUnitIdField = { clear: jasmine.createSpy('clear'), focus: jasmine.createSpy('focus') };
      component.unitIdField = mockUnitIdField as any;
      component['resetEntrySection']();
      expect(mockUnitIdField.clear).toHaveBeenCalled();
    });
  });

  describe('resetEntryForm', () => {
    it('should reset request date to chapter local date', () => {
      component.entryForm.get('requestDate')?.setValue('2020-01-01');
      component['resetEntryForm']();
      const resetDate = component.entryForm.get('requestDate')?.value;
      expect(resetDate).toBeTruthy();
      expect(moment.isMoment(resetDate)).toBeTrue();
    });

    it('should clear selected reason description', () => {
      component.selectedReasonDesc.set('Something');
      component['resetEntryForm']();
      expect(component.selectedReasonDesc()).toBeNull();
    });

    it('should mark form as pristine and untouched', () => {
      component.entryForm.markAsDirty();
      component.entryForm.markAsTouched();
      component['resetEntryForm']();
      expect(component.entryForm.pristine).toBeTrue();
      expect(component.entryForm.untouched).toBeTrue();
    });

    it('should reset unit signals', () => {
      component.parsedUnitId.set('X');
      component.parsedOrderNo.set('Y');
      component.unitValidated.set(true);
      component['resetEntryForm']();
      expect(component.parsedUnitId()).toBeNull();
      expect(component.parsedOrderNo()).toBeNull();
      expect(component.unitValidated()).toBeFalse();
    });

    it('should call unitIdField.clear and schedule focus when ViewChild is available', fakeAsync(() => {
      const mockUnitIdField = { clear: jasmine.createSpy('clear'), focus: jasmine.createSpy('focus') };
      component.unitIdField = mockUnitIdField as any;
      component['resetEntryForm']();
      expect(mockUnitIdField.clear).toHaveBeenCalled();
      tick(0);
      expect(mockUnitIdField.focus).toHaveBeenCalled();
    }));

    it('should not show reasonCode validation error after reset', () => {
      component.entryForm.get('reasonCode')?.setValue('R01');
      component.entryForm.get('reasonCode')?.markAsTouched();
      component['resetEntryForm']();
      const reasonCtrl = component.entryForm.get('reasonCode');
      expect(reasonCtrl?.errors).toBeNull();
      expect(reasonCtrl?.untouched).toBeTrue();
      expect(reasonCtrl?.pristine).toBeTrue();
    });
  });

  // ── fullReset additional coverage ────────────────────────────────────────────

  describe('fullReset', () => {
    it('should handle reset when filterForm is not initialized', () => {
      const tempForm = component.filterForm;
      (component as any).filterForm = undefined;
      component['fullReset']();
      (component as any).filterForm = tempForm;
      expect(component.records().length).toBe(0);
    });

    it('should reset filter form values', () => {
      component.filterForm.patchValue({ customerId: 'CUST1', tranType: 'CR' });
      component['fullReset']();
      expect(component.filterForm.get('customerId')?.value).toBeNull();
      expect(component.filterForm.get('tranType')?.value).toBeNull();
    });

    it('should reset selectedCustomerName', () => {
      component.selectedCustomerName.set('Hospital A');
      component['fullReset']();
      expect(component.selectedCustomerName()).toBeNull();
    });

    it('should reset sortConfig to descending', () => {
      component.tableConfig = { ...component.tableConfig, sortConfig: { column: 'unitId', direction: 'A' } };
      component['fullReset']();
      expect(component.tableConfig.sortConfig!.direction).toBe('D');
    });
  });

  // ── Additional onSave / executeSave branch coverage ──────────────────────────

  describe('onSave edge cases', () => {
    it('should show error when parsedUnitId is set but unitValidated is false', () => {
      component.parsedUnitId.set('W123');
      component.unitValidated.set(false);
      component.onSave();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please scan or enter a valid Unit ID');
    });

    it('should use empty string when selectedCustomerName is null', () => {
      setupValidEntry('CR');
      component.selectedCustomerName.set(null);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
      component.onSave();
      const data = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(data.message).toContain('Credited to .');
    });
  });

  describe('executeSave edge cases', () => {
    it('should send null for empty requestedBy', () => {
      setupValidEntry('CR');
      component.entryForm.get('requestedBy')?.setValue('');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      const dto = serviceSpy.create.calls.mostRecent().args[0];
      expect(dto.requestedBy).toBeNull();
    });

    it('should enrich saved record with reason description', () => {
      setupValidEntry('CR');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(component.records()[0].reasonDescription).toBe('Expired');
    });

    it('should format success message with count and customer ID', () => {
      setupValidEntry('CR');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        '1 Product credit for Customer ID CUST1 has been saved.'
      );
    });

    it('should reset entry form after successful save', () => {
      setupValidEntry('CR');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(component.entryForm.get('productCode')?.value).toBeNull();
      expect(component.entryForm.get('reasonCode')?.value).toBeNull();
    });
  });

  // ── toIsoDate fallback branch ────────────────────────────────────────────────

  describe('toIsoDate additional coverage', () => {
    it('should return empty string for non-string, non-Moment, non-Date value', () => {
      setupValidEntry('CR');
      component.entryForm.get('requestDate')?.clearValidators();
      component.entryForm.get('requestDate')?.updateValueAndValidity();
      component.entryForm.get('requestDate')?.setValue(12345);
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
      component.onSave();
      expect(serviceSpy.create.calls.mostRecent().args[0].requestDate).toBe('');
    });
  });

  // ── updateReasonCodesFilter additional branches ──────────────────────────────

  describe('updateReasonCodesFilter', () => {
    it('should show all reason codes when tranType is null', () => {
      component.filterForm.get('tranType')?.setValue(null);
      component['updateReasonCodesFilter']();
      expect(component.filteredReasonCodes().length).toBe(3);
    });

    it('should clear selectedReasonDesc when reason code is removed', () => {
      component.entryForm.get('reasonCode')?.setValue('R03');
      component.selectedReasonDesc.set('Wrong product');
      component.filterForm.get('tranType')?.setValue('CR');
      component['updateReasonCodesFilter']();
      expect(component.entryForm.get('reasonCode')?.value).toBeNull();
      expect(component.selectedReasonDesc()).toBeNull();
    });

    it('should keep reason code when it exists in filtered list', () => {
      component.entryForm.get('reasonCode')?.setValue('R01');
      component.filterForm.get('tranType')?.setValue('CR');
      component['updateReasonCodesFilter']();
      expect(component.entryForm.get('reasonCode')?.value).toBe('R01');
    });
  });

  // ── showEntrySection additional branch ────────────────────────────────────────

  it('should hide entry section when tranType is null', () => {
    component.filterForm.patchValue({ customerId: 'CUST1', tranType: null });
    expect(component.showEntrySection()).toBeFalse();
  });

  // ── onClearEntry resets unit state ────────────────────────────────────────────

  describe('onClearEntry', () => {
    it('should reset product codes and unit validated state', () => {
      component.parsedUnitId.set('W999');
      component.unitValidated.set(true);
      component.productCodes.set([{ productCode: 'X', productDescription: 'X' }]);
      component.onClearEntry();
      expect(component.parsedUnitId()).toBeNull();
      expect(component.unitValidated()).toBeFalse();
      expect(component.productCodes().length).toBe(0);
    });
  });

  // ── openNotesDialog with existing note ───────────────────────────────────────

  describe('openNotesDialog', () => {
    it('should pass existing note to dialog data', () => {
      serviceSpy.getNote.and.returnValue(of('Pre-existing note'));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.onEnterNotes(MOCK_SAVED_RECORD as any);
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.existingNote).toBe('Pre-existing note');
    });

    it('should pass undefined existingNote when note is null', () => {
      serviceSpy.getNote.and.returnValue(of(null));
      dialogSpy.open.and.returnValue({ afterClosed: () => of(null) } as any);
      component.onEnterNotes(MOCK_SAVED_RECORD as any);
      const dialogData = dialogSpy.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.existingNote).toBeUndefined();
    });
  });

  // ── Chapter change clears all ────────────────────────────────────────────────

  it('should clearAll before reloading on chapter change', () => {
    component.records.set([MOCK_SAVED_RECORD as any]);
    component.filterForm.patchValue({ customerId: 'CUST1', tranType: 'CR' });
    chapterChanged$.next();
    expect(component.records().length).toBe(0);
    expect(component.filterForm.get('customerId')?.value).toBeNull();
  });

  // ── Helper ───────────────────────────────────────────────────────────────────

  function setupValidEntry(tranType: string): void {
    component.customers.set(MOCK_CUSTOMERS as any);
    component.filterForm.patchValue({ customerId: 'CUST1', tranType });
    component.selectedCustomerName.set('Hospital A');
    component.parsedUnitId.set('W0001234567');
    component.parsedOrderNo.set('ORD100');
    component.unitValidated.set(true);
    component.entryForm.patchValue({
      productCode: 'RBC001',
      requestedBy: 'John',
      requestDate: TODAY,
      reasonCode: 'R01',
    });
    component.selectedReasonDesc.set('Expired');
  }
});
