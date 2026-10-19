import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { StandingOrderListComponent } from './standing-order-list';
import { StandingOrderService } from '../../services/standing-order.service';
import { StandingOrderStateService } from '../../services/standing-order-state.service';
import { StandingOrderListDto } from '../../models/standing-order.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockRouter, createMockActivatedRoute } from '@shared/testing/page-header-service.mock';
import { TablePageEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';
import { createMockSnackbarService, createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('StandingOrderListComponent', () => {
  let pageHeaderServiceSpy: any;
  let component: StandingOrderListComponent;
  let fixture: ComponentFixture<StandingOrderListComponent>;
  let standingOrderServiceSpy: jasmine.SpyObj<StandingOrderService>;
  let mockRouter: Partial<Router>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let stateServiceSpy: jasmine.SpyObj<StandingOrderStateService>;
  let chapterChanged$: Subject<void>;

  const mockStandingOrders: StandingOrderListDto[] = [
    {
      contractId: 'C001',
      consigneeId: 'CN001',
      weekDay: 'MON',
      weekDayDisplay: 'Monday',
      confirmation: 'Yes',
      timeRequired: '8:00 AM',
      effectiveDate: '01-JUN-2024',
      terminationDate: '--',
      modificationDate: '01-JUN-2024, 10:30 AM'
    },
    {
      contractId: 'C001',
      consigneeId: 'CN001',
      weekDay: 'FRI',
      weekDayDisplay: 'Friday',
      confirmation: 'No',
      timeRequired: '9:00 AM',
      effectiveDate: '01-JUN-2024',
      terminationDate: '--',
      modificationDate: '01-JUN-2024, 11:00 AM'
    }
  ];

  beforeEach(() => {

    chapterChanged$ = new Subject<void>();

    standingOrderServiceSpy = jasmine.createSpyObj('StandingOrderService', [
      'getStandingOrders',
      'getCustomerTypes',
      'getCustomers',
      'getConsignees',
      'deleteStandingOrder'
    ]);
    standingOrderServiceSpy.getCustomerTypes.and.returnValue(of([]));
    standingOrderServiceSpy.getCustomers.and.returnValue(of([]));
    standingOrderServiceSpy.getConsignees.and.returnValue(of([]));

    mockRouter = createMockRouter();
    snackbarServiceSpy = createMockSnackbarService();
    stateServiceSpy = jasmine.createSpyObj('StandingOrderStateService', ['save', 'restore']);
    stateServiceSpy.restore.and.returnValue(null);

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle', 'getCurrentMenuItem'], {
      pageHeaderData: jasmine.createSpy().and.returnValue({})
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('');
    pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);

    const headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChanged$.asObservable()
    });

    const translateServiceSpy = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [StandingOrderListComponent, NoopAnimationsModule],
      providers: [
        { provide: StandingOrderService, useValue: standingOrderServiceSpy },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: StandingOrderStateService, useValue: stateServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy }
      ]
    });


    


      standingOrderServiceSpy.getStandingOrders.calls.reset();


      standingOrderServiceSpy.getCustomerTypes.calls.reset();


      standingOrderServiceSpy.getCustomers.calls.reset();


      standingOrderServiceSpy.getConsignees.calls.reset();


      standingOrderServiceSpy.deleteStandingOrder.calls.reset();


      stateServiceSpy.save.calls.reset();


      stateServiceSpy.restore.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.getCurrentMenuItem.calls.reset();


      standingOrderServiceSpy.getCustomerTypes.and.returnValue(of([]));


      standingOrderServiceSpy.getCustomers.and.returnValue(of([]));


      standingOrderServiceSpy.getConsignees.and.returnValue(of([]));


      stateServiceSpy.restore.and.returnValue(null);


      pageHeaderServiceSpy.getTitle.and.returnValue('');


      pageHeaderServiceSpy.getSubtitle.and.returnValue('');


      pageHeaderServiceSpy.getCurrentMenuItem.and.returnValue(undefined);


    fixture = TestBed.createComponent(StandingOrderListComponent);
    component = fixture.componentInstance;


    });

  describe('Filter Form Behavior', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear contract and consignee when customer type changes', () => {
      component.filterForm.patchValue({
        customerType: 'RG',
        contractId: 'C001',
        consigneeId: 'CN001'
      });

      component.filterForm.patchValue({ customerType: 'SP' });

      expect(component.filterForm.get('contractId')?.value).toBeNull();
      expect(component.filterForm.get('consigneeId')?.value).toBeNull();
    });

    it('should clear consignee when contract changes', () => {
      component.filterForm.patchValue({
        customerType: 'RG',
        contractId: 'C001',
        consigneeId: 'CN001'
      });

      component.filterForm.patchValue({ contractId: 'C002' });

      expect(component.filterForm.get('consigneeId')?.value).toBeNull();
    });
  });

  describe('Retrieve (onRetrieve)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should handle error response from service', () => {
      standingOrderServiceSpy.getStandingOrders.and.returnValue(
        throwError(() => new Error('Server error'))
      );

      component.filterForm.patchValue({
        contractId: 'C001',
        consigneeId: 'CN001'
      });

      component.onRetrieve();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load standing orders. Please try again.'
      );
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form on clear all', () => {
      component.filterForm.patchValue({
        customerType: 'RG',
        contractId: 'C001',
        consigneeId: 'CN001'
      });

      component.onClearAll();

      expect(component.filterForm.get('customerType')?.value).toBeNull();
      expect(component.filterForm.get('contractId')?.value).toBeNull();
      expect(component.filterForm.get('consigneeId')?.value).toBeNull();
    });
  });





  describe('Table Config', () => {


    it('should have row actions for edit and view', () => {
      expect(component.tableConfig.rowActions?.length).toBe(2);
      expect(component.tableConfig.rowActions?.[0].action).toBe('edit');
      expect(component.tableConfig.rowActions?.[1].action).toBe('view');
    });


  });

  describe('Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open add panel when filters are set', () => {
      component.filterForm.patchValue({
        contractId: 'C001',
        consigneeId: 'CN001'
      });

      component.openAddPanel();

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });



    it('should open edit panel with order data', () => {
      const order = mockStandingOrders[0];
      component.openEditPanel(order);

      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(order);
    });


  });

  describe('Computed Filtered Lookups', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('filteredCustomerTypes returns all when search is empty', () => {
      (component as any).customerTypes.set([
        { code: 'RG', description: 'Regular' },
        { code: 'SP', description: 'Special' }
      ]);
      expect(component.filteredCustomerTypes().length).toBe(2);
    });

    it('filteredCustomerTypes filters by code search', () => {
      (component as any).customerTypes.set([
        { code: 'RG', description: 'Regular' },
        { code: 'SP', description: 'Special' }
      ]);
      component.customerTypeSearchCtrl.setValue('rg');
      expect(component.filteredCustomerTypes().length).toBe(1);
      expect(component.filteredCustomerTypes()[0].code).toBe('RG');
    });

    it('filteredContracts filters by description search', () => {
      (component as any).contracts.set([
        { code: 'C001', description: 'Hospital A', customerId: 'H001' },
        { code: 'C002', description: 'Clinic B', customerId: 'H002' }
      ]);
      component.contractSearchCtrl.setValue('hospital');
      expect(component.filteredContracts().length).toBe(1);
      expect(component.filteredContracts()[0].code).toBe('C001');
    });

    it('filteredConsignees filters by code search', () => {
      (component as any).consignees.set([
        { code: 'CN001', description: 'Main' },
        { code: 'CN002', description: 'Branch' }
      ]);
      component.consigneeSearchCtrl.setValue('CN001');
      expect(component.filteredConsignees().length).toBe(1);
    });
  });

  describe('filtersReady Signal', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('sets filtersReady true when contractId and consigneeId are both set', () => {
      component.filterForm.patchValue({ contractId: 'C001', consigneeId: 'CN001' });
      expect((component as any).filtersReady()).toBeTrue();
    });

    it('sets filtersReady false when consigneeId is null', () => {
      component.filterForm.patchValue({ contractId: 'C001', consigneeId: 'CN001' });
      component.filterForm.patchValue({ consigneeId: null });
      expect((component as any).filtersReady()).toBeFalse();
    });
  });

  describe('subscribeToChapterChanges', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('clears data and reloads customer types when chapter changes', () => {
      (component as any).dataSource.set([mockStandingOrders[0]]);
      standingOrderServiceSpy.getCustomerTypes.calls.reset();
      chapterChanged$.next();
      expect((component as any).dataSource()).toEqual([]);
      expect(standingOrderServiceSpy.getCustomerTypes).toHaveBeenCalled();
    });
  });

  describe('loadCustomerTypes', () => {
    it('sets customerTypes signal on success', () => {
      const types = [{ code: 'RG', description: 'Regular' }];
      standingOrderServiceSpy.getCustomerTypes.and.returnValue(of(types));
      fixture.detectChanges();
      expect((component as any).customerTypes()).toEqual(types);
    });

    it('shows snackbar error when getCustomerTypes fails', () => {
      standingOrderServiceSpy.getCustomerTypes.and.returnValue(throwError(() => new Error('fail')));
      fixture.detectChanges();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load customer types');
    });
  });

  describe('loadContracts', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('does not call getCustomers when customerType is null', () => {
      standingOrderServiceSpy.getCustomers.calls.reset();
      component.filterForm.patchValue({ customerType: null });
      expect(standingOrderServiceSpy.getCustomers).not.toHaveBeenCalled();
    });

    it('calls getCustomers with customerType when set', () => {
      standingOrderServiceSpy.getCustomers.calls.reset();
      component.filterForm.patchValue({ customerType: 'RG' });
      expect(standingOrderServiceSpy.getCustomers).toHaveBeenCalledWith('RG');
    });

    it('shows error when getCustomers fails', () => {
      standingOrderServiceSpy.getCustomers.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.patchValue({ customerType: 'RG' });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load contracts');
    });
  });

  describe('loadConsignees', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('does not call getConsignees when contractId is null', () => {
      standingOrderServiceSpy.getConsignees.calls.reset();
      component.filterForm.patchValue({ contractId: null });
      expect(standingOrderServiceSpy.getConsignees).not.toHaveBeenCalled();
    });

    it('does not call getConsignees when no matching contract is found', () => {
      standingOrderServiceSpy.getConsignees.calls.reset();
      component.filterForm.patchValue({ contractId: 'UNKNOWN' });
      expect(standingOrderServiceSpy.getConsignees).not.toHaveBeenCalled();
    });

    it('calls getConsignees with customerId from the matched contract', () => {
      (component as any).contracts.set([{ code: 'C001', description: 'Hospital A', customerId: 'H001' }]);
      standingOrderServiceSpy.getConsignees.calls.reset();
      component.filterForm.patchValue({ contractId: 'C001' });
      expect(standingOrderServiceSpy.getConsignees).toHaveBeenCalledWith('H001');
    });

    it('shows error when getConsignees fails', () => {
      (component as any).contracts.set([{ code: 'C001', description: 'Hospital A', customerId: 'H001' }]);
      standingOrderServiceSpy.getConsignees.and.returnValue(throwError(() => new Error('fail')));
      component.filterForm.patchValue({ contractId: 'C001' });
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load consignees');
    });
  });

  describe('onRetrieve', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('shows error when contractId or consigneeId is missing', () => {
      component.filterForm.patchValue({ contractId: 'C001' });
      component.onRetrieve();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select Contract ID and Consignee');
    });

    it('loads data and updates dataSource when filters are set', () => {
      standingOrderServiceSpy.getStandingOrders.and.returnValue(of({
        data: mockStandingOrders,
        totalRecords: 2
      }));
      component.filterForm.patchValue({ contractId: 'C001', consigneeId: 'CN001' });
      component.onRetrieve();
      expect(standingOrderServiceSpy.getStandingOrders).toHaveBeenCalled();
      expect((component as any).dataSource().length).toBe(2);
      expect((component as any).totalCount()).toBe(2);
    });
  });

  describe('onPageChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      standingOrderServiceSpy.getStandingOrders.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.filterForm.patchValue({ contractId: 'C001', consigneeId: 'CN001' });
    });

    it('updates page index/size and reloads data', () => {
      standingOrderServiceSpy.getStandingOrders.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 10 } as any);
      expect(standingOrderServiceSpy.getStandingOrders).toHaveBeenCalled();
    });
  });

  describe('onSortChange', () => {
    beforeEach(() => {
      fixture.detectChanges();
      standingOrderServiceSpy.getStandingOrders.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.filterForm.patchValue({ contractId: 'C001', consigneeId: 'CN001' });
    });

    it('resets sort for direction "default"', () => {
      standingOrderServiceSpy.getStandingOrders.calls.reset();
      component.onSortChange({ direction: 'default', column: 'weekDay' } as any);
      expect(standingOrderServiceSpy.getStandingOrders).toHaveBeenCalled();
    });

    it('sets sort ASC for direction "A"', () => {
      standingOrderServiceSpy.getStandingOrders.calls.reset();
      component.onSortChange({ direction: 'A', column: 'weekDay' } as any);
      expect(standingOrderServiceSpy.getStandingOrders).toHaveBeenCalled();
    });

    it('sets sort DESC for direction "D"', () => {
      standingOrderServiceSpy.getStandingOrders.calls.reset();
      component.onSortChange({ direction: 'D', column: 'weekDay' } as any);
      expect(standingOrderServiceSpy.getStandingOrders).toHaveBeenCalled();
    });
  });

  describe('onRowAction', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('opens edit panel for "edit" action', () => {
      const order = mockStandingOrders[0];
      component.onRowAction({ action: 'edit', row: order } as any);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
    });

    it('calls onViewItems for "view" action', () => {
      const order = mockStandingOrders[0];
      const navigateSpy = spyOn(mockRouter as any, 'navigate').and.returnValue(Promise.resolve(true));
      component.onRowAction({ action: 'view', row: order } as any);
      expect(stateServiceSpy.save).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalled();
    });
  });

  describe('openAddPanel — no filters', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('shows error and does not open panel when filters are not set', () => {
      component.openAddPanel();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select Contract ID and Consignee first');
      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('closeSidePanel', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('sets sidePanelOpen to false and clears sidePanelData', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockStandingOrders[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('onSaveSuccess', () => {
    beforeEach(() => {
      fixture.detectChanges();
      standingOrderServiceSpy.getStandingOrders.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.filterForm.patchValue({ contractId: 'C001', consigneeId: 'CN001' });
    });

    it('closes panel, shows success and reloads data', () => {
      component.sidePanelOpen = true;
      component.onSaveSuccess('Order saved');
      expect(component.sidePanelOpen).toBeFalse();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Order saved');
      expect(standingOrderServiceSpy.getStandingOrders).toHaveBeenCalled();
    });
  });

  describe('onSaveAndAddAnother', () => {
    beforeEach(() => {
      fixture.detectChanges();
      standingOrderServiceSpy.getStandingOrders.and.returnValue(of({ data: [], totalRecords: 0 }));
      component.filterForm.patchValue({ contractId: 'C001', consigneeId: 'CN001' });
    });

    it('shows success, reloads data and resets to add mode', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockStandingOrders[0];
      component.onSaveAndAddAnother('Order created');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Order created');
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('contractNameDisplay', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('returns "--" when contractId is null', () => {
      expect(component.contractNameDisplay).toBe('--');
    });

    it('returns contract description when contractId matches', () => {
      (component as any).contracts.set([{ code: 'C001', description: 'Hospital A', customerId: 'H001' }]);
      component.filterForm.patchValue({ contractId: 'C001' }, { emitEvent: false });
      expect(component.contractNameDisplay).toBe('Hospital A');
    });

    it('returns "--" when contractId does not match any contract', () => {
      component.filterForm.patchValue({ contractId: 'UNKNOWN' }, { emitEvent: false });
      expect(component.contractNameDisplay).toBe('--');
    });
  });

  describe('onViewItems', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('saves state and navigates with customerId when contract is found', () => {
      (component as any).contracts.set([{ code: 'C001', description: 'Hospital A', customerId: 'H001' }]);
      const navigateSpy = spyOn(mockRouter as any, 'navigate').and.returnValue(Promise.resolve(true));
      component.onViewItems(mockStandingOrders[0]);
      expect(stateServiceSpy.save).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledWith(
        ['/distribution/enter-standing-order/items', 'C001', 'CN001', 'MON'],
        jasmine.objectContaining({ state: jasmine.objectContaining({ customerId: 'H001' }) })
      );
    });

    it('uses empty customerId when contract is not found', () => {
      const navigateSpy = spyOn(mockRouter as any, 'navigate').and.returnValue(Promise.resolve(true));
      component.onViewItems(mockStandingOrders[0]);
      expect(navigateSpy).toHaveBeenCalledWith(
        jasmine.any(Array),
        jasmine.objectContaining({ state: jasmine.objectContaining({ customerId: '' }) })
      );
    });
  });

  describe('restoreState', () => {
    it('restores form values and loads data when saved state has contractId and consigneeId', () => {
      const savedState = {
        customerType: 'RG',
        contractId: 'C001',
        consigneeId: 'CN001',
        contracts: [{ code: 'C001', description: 'Hospital A', customerId: 'H001' }],
        consignees: [{ code: 'CN001', description: 'Main' }]
      };
      stateServiceSpy.restore.and.returnValue(savedState);
      standingOrderServiceSpy.getStandingOrders.and.returnValue(of({ data: [], totalRecords: 0 }));
      fixture.detectChanges();
      expect(component.filterForm.get('contractId')?.value).toBe('C001');
      expect(standingOrderServiceSpy.getStandingOrders).toHaveBeenCalled();
    });

    it('does not call loadData when saved state has no contractId or consigneeId', () => {
      const savedState = {
        customerType: 'RG',
        contractId: null,
        consigneeId: null,
        contracts: [],
        consignees: []
      };
      stateServiceSpy.restore.and.returnValue(savedState);
      standingOrderServiceSpy.getStandingOrders.calls.reset();
      fixture.detectChanges();
      expect(standingOrderServiceSpy.getStandingOrders).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('completes destroy$ without throwing', () => {
      expect(() => fixture.destroy()).not.toThrow();
    });
  });
});
