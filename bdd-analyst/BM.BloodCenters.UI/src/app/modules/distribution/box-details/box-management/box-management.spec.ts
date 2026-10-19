import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { of, Subject, throwError } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { BoxManagementComponent } from './box-management';
import { BoxDetailsService } from '../services/box-details.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import {
  PaginatedResponse,
  BoxSearchResult,
  BoxesReadyForShipmentResponse,
  BoxReadyForShipment,
  OpenBoxPaginatedResponse,
} from '../models/box-details.model';
import { provideRouter } from '@angular/router';
import { createMockSnackbarService, createMockTranslateService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('BoxManagementComponent', () => {
  let component: BoxManagementComponent;
  let fixture: ComponentFixture<BoxManagementComponent>;
  let boxDetailsServiceSpy: jasmine.SpyObj<BoxDetailsService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockPaginatedResponse: PaginatedResponse<BoxSearchResult> = {
    success: true,
    message: 'OK',
    statusCode: 200,
    data: { items: [], totalCount: 0, pageNumber: 1, pageSize: 25, totalPages: 0 },
  };

  const mockReadyResponse: BoxesReadyForShipmentResponse = {
    success: true,
    message: 'OK',
    statusCode: 200,
    data: [],
    totalCount: 0,
  };

  beforeEach(() => {

    boxDetailsServiceSpy = jasmine.createSpyObj('BoxDetailsService', [
      'searchBoxes',
      'searchOpenBoxes',
      'getBoxesReadyForShipment',
    ]);
    boxDetailsServiceSpy.searchBoxes.and.returnValue(of(mockPaginatedResponse));
    boxDetailsServiceSpy.searchOpenBoxes.and.returnValue(of({
      items: [], totalCount: 0, totalOpenBoxes: 0, pageNumber: 1, pageSize: 25, totalPages: 0,
    }));
    boxDetailsServiceSpy.getBoxesReadyForShipment.and.returnValue(of(mockReadyResponse));

    const chapterChanged$ = new Subject<void>();
    headerServiceSpy = createMockHeaderService();

    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Box Management', subtitle: '' }),
    });

    snackbarServiceSpy = createMockSnackbarService();

    const translateServiceSpy = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [BoxManagementComponent,
        NoopAnimationsModule,
        HttpClientTestingModule],
      providers: [
        provideRouter([]),
        { provide: BoxDetailsService, useValue: boxDetailsServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
      ],
    });


    


      boxDetailsServiceSpy.searchBoxes.calls.reset();


      boxDetailsServiceSpy.searchOpenBoxes.calls.reset();


      boxDetailsServiceSpy.getBoxesReadyForShipment.calls.reset();


      boxDetailsServiceSpy.searchBoxes.and.returnValue(of(mockPaginatedResponse));


      boxDetailsServiceSpy.getBoxesReadyForShipment.and.returnValue(of(mockReadyResponse));


    fixture = TestBed.createComponent(BoxManagementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });




  it('should initialize with All Boxes tab active (index 0)', () => {
    expect(component['activeTabIndex']()).toBe(0);
  });

  it('should switch to Open Boxes tab and call searchOpenBoxes', fakeAsync(() => {
    component.onTabChange(1);
    tick();
    expect(component['activeTabIndex']()).toBe(1);
    expect(boxDetailsServiceSpy.searchOpenBoxes).toHaveBeenCalled();
  }));

  it('should switch to Ready for Shipment tab and call getBoxesReadyForShipment', fakeAsync(() => {
    component.onTabChange(2);
    tick();
    expect(component['activeTabIndex']()).toBe(2);
    expect(boxDetailsServiceSpy.getBoxesReadyForShipment).toHaveBeenCalled();
  }));

  it('should update searchText and reload on search', fakeAsync(() => {
    boxDetailsServiceSpy.searchBoxes.calls.reset();
    component.onSearch('BOX123');
    tick();
    expect(component['searchText']).toBe('BOX123');
    expect(boxDetailsServiceSpy.searchBoxes).toHaveBeenCalled();
  }));

  it('should trim searchText on search', fakeAsync(() => {
    component.onSearch('  BOX456  ');
    tick();
    expect(component['searchText']).toBe('BOX456');
  }));

  it('should update readySearchText on ready search', fakeAsync(() => {
    component.onTabChange(2);
    tick();
    boxDetailsServiceSpy.getBoxesReadyForShipment.calls.reset();
    component.onReadySearch('BOX789');
    tick();
    expect(component['readySearchText']).toBe('BOX789');
    expect(boxDetailsServiceSpy.getBoxesReadyForShipment).toHaveBeenCalled();
  }));









  it('hasActiveFilters should return false when no filters applied', () => {
    component['appliedFilters'] = null;
    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('hasActiveFilters should return true when priority filter applied', () => {
    component['appliedFilters'] = { priority: 'HIGH', consignee: null, packedBy: null };
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('hasActiveFilters should return true when consignee filter applied', () => {
    component['appliedFilters'] = { priority: null, consignee: 'Hospital A', packedBy: null };
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('hasActiveFilters should return true when packedBy filter applied', () => {
    component['appliedFilters'] = { priority: null, consignee: null, packedBy: 'User1' };
    expect(component.hasActiveFilters()).toBeTrue();
  });

  describe('formatStatus (private)', () => {
    it('should map O → Open', () => {
      expect((component as any).formatStatus('O')).toBe('Open');
    });

    it('should map OP → Open', () => {
      expect((component as any).formatStatus('OP')).toBe('Open');
    });

    it('should map CL → Closed', () => {
      expect((component as any).formatStatus('CL')).toBe('Closed');
    });

    it('should map RD → Ready', () => {
      expect((component as any).formatStatus('RD')).toBe('Ready');
    });

    it('should map PK → Packed', () => {
      expect((component as any).formatStatus('PK')).toBe('Packed');
    });

    it('should map AV → Available', () => {
      expect((component as any).formatStatus('AV')).toBe('Available');
    });

    it('should map SH → Shipped', () => {
      expect((component as any).formatStatus('SH')).toBe('Shipped');
    });

    it('should map DL → Delivered', () => {
      expect((component as any).formatStatus('DL')).toBe('Delivered');
    });

    it('should return unknown code as-is', () => {
      expect((component as any).formatStatus('XX')).toBe('XX');
    });

    it('should return "" for null', () => {
      expect((component as any).formatStatus(null)).toBe('');
    });
  });

  describe('loadData - error branches', () => {
    it('should show error snackbar on searchBoxes failure', fakeAsync(() => {
      boxDetailsServiceSpy.searchBoxes.and.returnValue(throwError(() => new Error('Network error')));
      component.loadData();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['boxes']()).toEqual([]);
      expect(component['loading']()).toBeFalse();
    }));

    it('should show error snackbar on searchOpenBoxes failure', fakeAsync(() => {
      boxDetailsServiceSpy.searchOpenBoxes.and.returnValue(throwError(() => new Error('Network error')));
      component.onTabChange(1);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['boxes']()).toEqual([]);
    }));

    it('should map Open Boxes response items correctly', fakeAsync(() => {
      const openBoxResponse: OpenBoxPaginatedResponse = {
        items: [{
          boxId: 'OB001', warehouseId: 'WH1', warehouseDescription: 'Warehouse 1',
          customerName: 'Cust A', customerType: 'Hospital', orderClass: 'URGENT',
          orderDate: '2026-01-01', packedDate: '2026-01-02', packedBy: 'USER1',
        }],
        totalCount: 1,
        totalOpenBoxes: 5,
        pageNumber: 1,
        pageSize: 25,
        totalPages: 1,
      };
      boxDetailsServiceSpy.searchOpenBoxes.and.returnValue(of(openBoxResponse));
      component.onTabChange(1);
      tick();
      expect(component['boxes']().length).toBe(1);
      expect(component['boxes']()[0].boxId).toBe('OB001');
      expect(component['totalOpenBoxes']()).toBe(5);
    }));
  });

  describe('loadReadyForShipmentData - error branch', () => {
    it('should handle error when loading ready-for-shipment data', fakeAsync(() => {
      boxDetailsServiceSpy.getBoxesReadyForShipment.and.returnValue(throwError(() => new Error('error')));
      component.onTabChange(2);
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component['readyBoxes']()).toEqual([]);
      expect(component['readyTotalRecords']()).toBe(0);
    }));

    it('should set readyBoxes and totalRecords on success', fakeAsync(() => {
      const readyBox: BoxReadyForShipment = {
        boxId: 'RB001', priority: 'HIGH', consigneeName: 'Hospital A',
        estArrivalTime: '2026-01-01T10:00:00Z', orderNo: 'ORD001', boxType: 'DRY',
        packedByName: 'User1', closedDate: '2026-01-01T08:00:00Z',
      };
      const response: BoxesReadyForShipmentResponse = {
        success: true, message: 'OK', statusCode: 200,
        data: [readyBox], totalCount: 1,
      };
      boxDetailsServiceSpy.getBoxesReadyForShipment.and.returnValue(of(response));
      component.onTabChange(2);
      tick();
      expect(component['readyBoxes']().length).toBe(1);
      expect(component['readyTotalRecords']()).toBe(1);
    }));
  });

  describe('onFilterChange', () => {
    it('should reset pageNumber and reload data', fakeAsync(() => {
      component['pageNumber'] = 3;
      boxDetailsServiceSpy.searchBoxes.calls.reset();
      component.onFilterChange();
      tick();
      expect(component['pageNumber']).toBe(1);
      expect(boxDetailsServiceSpy.searchBoxes).toHaveBeenCalled();
    }));
  });

  describe('onSearch', () => {
    it('should trim whitespace and reload', fakeAsync(() => {
      component.onSearch('  BOX  ');
      tick();
      expect(component['searchText']).toBe('BOX');
    }));

    it('should handle empty search', fakeAsync(() => {
      component.onSearch('');
      tick();
      expect(component['searchText']).toBe('');
    }));
  });

  describe('onClearFilters', () => {
    it('should reset form and reload', fakeAsync(() => {
      component['searchText'] = 'BOX001';
      component['pageNumber'] = 3;
      boxDetailsServiceSpy.searchBoxes.calls.reset();
      component.onClearFilters();
      tick();
      expect(component['searchText']).toBe('');
      expect(component['pageNumber']).toBe(1);
      expect(boxDetailsServiceSpy.searchBoxes).toHaveBeenCalled();
    }));
  });

  describe('onRetrieve', () => {
    it('should reset pageNumber and call loadData', fakeAsync(() => {
      component['pageNumber'] = 5;
      boxDetailsServiceSpy.searchBoxes.calls.reset();
      component.onRetrieve();
      tick();
      expect(component['pageNumber']).toBe(1);
      expect(boxDetailsServiceSpy.searchBoxes).toHaveBeenCalled();
    }));
  });

  describe('onPageChange', () => {
    it('should update page and reload', fakeAsync(() => {
      boxDetailsServiceSpy.searchBoxes.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 50 });
      tick();
      expect(component['pageSize']).toBe(50);
      expect(component['pageNumber']).toBe(3);
      expect(boxDetailsServiceSpy.searchBoxes).toHaveBeenCalled();
    }));
  });

  describe('onOpenBoxesSortChange', () => {
    it('should set active sort when direction is A', fakeAsync(() => {
      component.onTabChange(1);
      tick();
      boxDetailsServiceSpy.searchOpenBoxes.calls.reset();
      component.onOpenBoxesSortChange({ column: 'boxId', direction: 'A' });
      tick();
      expect(component['openBoxesSortColumn']).toBe('BoxId');
      expect(component['openBoxesSortOrder']).toBe('A');
      expect(boxDetailsServiceSpy.searchOpenBoxes).toHaveBeenCalled();
    }));

    it('should clear sort when direction is default', fakeAsync(() => {
      component.onTabChange(1);
      tick();
      component.onOpenBoxesSortChange({ column: 'boxId', direction: 'default' });
      tick();
      expect(component.tableConfig.sortConfig).toBeUndefined();
    }));
  });

  describe('onReadySearch', () => {
    it('should update readySearchText and reload', fakeAsync(() => {
      component.onTabChange(2);
      tick();
      boxDetailsServiceSpy.getBoxesReadyForShipment.calls.reset();
      component.onReadySearch('  B  ');
      tick();
      expect(component['readySearchText']).toBe('B');
      expect(boxDetailsServiceSpy.getBoxesReadyForShipment).toHaveBeenCalled();
    }));
  });

  describe('onReadyPageChange', () => {
    it('should update skip and pageSize and reload', fakeAsync(() => {
      component.onTabChange(2);
      tick();
      boxDetailsServiceSpy.getBoxesReadyForShipment.calls.reset();
      component.onReadyPageChange({ pageIndex: 2, pageSize: 10 });
      tick();
      expect(component['readyPageSize']).toBe(10);
      expect(component['readySkip']).toBe(20);
      expect(boxDetailsServiceSpy.getBoxesReadyForShipment).toHaveBeenCalled();
    }));
  });

  describe('onReadySortChange', () => {
    it('should set DESC sort order', fakeAsync(() => {
      component.onTabChange(2);
      tick();
      boxDetailsServiceSpy.getBoxesReadyForShipment.calls.reset();
      component.onReadySortChange({ column: 'boxId', direction: 'D' });
      tick();
      expect(component['readySortOrder']).toBe('DESC');
      expect(boxDetailsServiceSpy.getBoxesReadyForShipment).toHaveBeenCalled();
    }));

    it('should set ASC sort order for non-D direction', fakeAsync(() => {
      component.onTabChange(2);
      tick();
      component.onReadySortChange({ column: 'boxId', direction: 'A' });
      tick();
      expect(component['readySortOrder']).toBe('ASC');
    }));
  });

  describe('onRowAction', () => {
    it('should navigate to box details on view action', fakeAsync(() => {
      const row: BoxSearchResult = {
        boxId: 'BOX001', status: 'O', consigneeId: null, consigneeName: null,
        boxType: null, boxTypeDescription: null, packedBy: null, packedDate: null,
        warehouseId: null, warehouseDescription: null, customerId: null,
        customerName: null, customerType: null, orderClass: null, orderDate: null,
        creationDate: '2026-01-01',
      };
      spyOn(component['router'], 'navigate').and.returnValue(Promise.resolve(true));
      component.onRowAction({ action: 'view', row });
      tick();
      expect(component['router'].navigate).toHaveBeenCalledWith(['/distribution/box-details', 'BOX001']);
    }));
  });

  describe('onRemoveFilterChip', () => {
    it('should do nothing when appliedFilters is null', () => {
      component['appliedFilters'] = null;
      expect(() => component.onRemoveFilterChip('priority')).not.toThrow();
    });

    it('should remove a single filter chip and reload', fakeAsync(() => {
      component['activeTabIndex'].set(2);
      component['appliedFilters'] = { priority: 'HIGH', consignee: 'Hospital A', packedBy: null };
      component['filterChips'] = [
        { key: 'priority', label: 'Priority: HIGH', value: 'HIGH' },
        { key: 'consignee', label: 'Consignee: Hospital A', value: 'Hospital A' },
      ];
      boxDetailsServiceSpy.getBoxesReadyForShipment.calls.reset();
      component.onRemoveFilterChip('priority');
      tick();
      expect(component['appliedFilters']?.priority).toBeNull();
      expect(component['appliedFilters']?.consignee).toBe('Hospital A');
      expect(boxDetailsServiceSpy.getBoxesReadyForShipment).toHaveBeenCalled();
    }));

    it('should set appliedFilters to null when all chips removed', fakeAsync(() => {
      component['appliedFilters'] = { priority: 'HIGH', consignee: null, packedBy: null };
      component.onTabChange(2);
      tick();
      component.onRemoveFilterChip('priority');
      tick();
      expect(component['appliedFilters']).toBeNull();
      expect(component['filterChips']).toEqual([]);
    }));
  });

  describe('clearAllFilters', () => {
    it('should clear all ready-for-shipment filters and reload', fakeAsync(() => {
      component.onTabChange(2);
      tick();
      component['appliedFilters'] = { priority: 'HIGH', consignee: 'Hosp', packedBy: null };
      component['filterChips'] = [{ key: 'priority', label: 'Priority: HIGH', value: 'HIGH' }];
      boxDetailsServiceSpy.getBoxesReadyForShipment.calls.reset();
      component.clearAllFilters();
      tick();
      expect(component['appliedFilters']).toBeNull();
      expect(component['filterChips']).toEqual([]);
      expect(boxDetailsServiceSpy.getBoxesReadyForShipment).toHaveBeenCalled();
    }));
  });

  describe('resetAndReload', () => {
    it('should reload ready-for-shipment data when on ready tab', fakeAsync(() => {
      component.onTabChange(2);
      tick();
      boxDetailsServiceSpy.getBoxesReadyForShipment.calls.reset();
      (component as any).resetAndReload();
      tick();
      expect(boxDetailsServiceSpy.getBoxesReadyForShipment).toHaveBeenCalled();
    }));

    it('should call loadData when not on ready tab', fakeAsync(() => {
      boxDetailsServiceSpy.searchBoxes.calls.reset();
      (component as any).resetAndReload();
      tick();
      expect(boxDetailsServiceSpy.searchBoxes).toHaveBeenCalled();
    }));
  });

  describe('isRetrieveDisabled getter', () => {
    it('should return false when no errors', fakeAsync(() => {
      tick();
      expect(component.isRetrieveDisabled).toBeFalsy();
    }));

    it('should return true when fromDate has invalidDateFormat error', fakeAsync(() => {
      tick();
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.setErrors({ invalidDateFormat: true });
      expect(component.isRetrieveDisabled).toBeTrue();
    }));

    it('should return true when toDate has invalidDateFormat error', fakeAsync(() => {
      tick();
      const ctrl = component.filterForm.get('toDate')!;
      ctrl.setErrors({ invalidDateFormat: true });
      expect(component.isRetrieveDisabled).toBeTrue();
    }));
  });

  describe('getFromDateError', () => {
    it('should return "" when control is not touched', () => {
      expect(component.getFromDateError()).toBe('');
    });

    it('should return invalid date error when control has invalidDateFormat', () => {
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDateFormat: true });
      expect(component.getFromDateError()).toBe('From Date is invalid');
    });

    it('should return range error when dateRangeInvalid and lastModified is fromDate', () => {
      component['lastModifiedDateField'].set('fromDate');
      component.filterForm.setErrors({ dateRangeInvalid: true });
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.markAsTouched();
      expect(component.getFromDateError()).toBe('From Date cannot be after To Date');
    });

    it('should return "" when touched but no relevant errors', () => {
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.markAsTouched();
      expect(component.getFromDateError()).toBe('');
    });
  });

  describe('getToDateError', () => {
    it('should return "" when control is not touched', () => {
      expect(component.getToDateError()).toBe('');
    });

    it('should return invalid date error when control has invalidDateFormat', () => {
      const ctrl = component.filterForm.get('toDate')!;
      ctrl.markAsTouched();
      ctrl.setErrors({ invalidDateFormat: true });
      expect(component.getToDateError()).toBe('To Date is invalid');
    });

    it('should return range error when dateRangeInvalid and lastModified is not fromDate', () => {
      component['lastModifiedDateField'].set('toDate');
      component.filterForm.setErrors({ dateRangeInvalid: true });
      const ctrl = component.filterForm.get('toDate')!;
      ctrl.markAsTouched();
      expect(component.getToDateError()).toBe('To Date must be on or after From Date');
    });
  });

  describe('onDateInputChange', () => {
    it('should clear value when input is empty', () => {
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.setValue('2026-01-01');
      const event = { target: { value: '' } } as unknown as Event;
      component.onDateInputChange(event, 'fromDate');
      expect(ctrl.value).toBeNull();
    });

    it('should set error for invalid date format', () => {
      const event = { target: { value: 'not-a-date' } } as unknown as Event;
      component.onDateInputChange(event, 'fromDate');
      const ctrl = component.filterForm.get('fromDate')!;
      expect(ctrl.hasError('invalidDateFormat')).toBeTrue();
    });

    it('should do nothing when control not found', () => {
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      expect(() => component.onDateInputChange(event, 'nonExistentControl')).not.toThrow();
    });
  });

  describe('onDateBlur', () => {
    it('should set invalidDateFormat error when trimmed input has value but no control value', () => {
      const event = { target: { value: '01-JAN-2026' } } as unknown as Event;
      const ctrl = component.filterForm.get('fromDate')!;
      ctrl.setValue(null);
      component.onDateBlur(event, 'fromDate');
      expect(ctrl.hasError('invalidDateFormat')).toBeTrue();
    });

    it('should do nothing when trimmed input is empty', () => {
      const event = { target: { value: '' } } as unknown as Event;
      const ctrl = component.filterForm.get('fromDate')!;
      expect(() => component.onDateBlur(event, 'fromDate')).not.toThrow();
      expect(ctrl.errors).toBeNull();
    });

    it('should do nothing when control not found', () => {
      const event = { target: { value: 'text' } } as unknown as Event;
      expect(() => component.onDateBlur(event, 'nonExistentControl')).not.toThrow();
    });
  });

  describe('computed signals', () => {
    it('dataLoadAnnouncement should return "" when not searched', () => {
      component['hasSearched'].set(false);
      expect(component['dataLoadAnnouncement']()).toBe('');
    });

    it('dataLoadAnnouncement should return "" when loading', () => {
      component['hasSearched'].set(true);
      component['loading'].set(true);
      expect(component['dataLoadAnnouncement']()).toBe('');
    });

    it('dataLoadAnnouncement should use singular "box" for count 1', fakeAsync(() => {
      const resp: PaginatedResponse<BoxSearchResult> = {
        success: true, message: 'OK', statusCode: 200,
        data: {
          items: [{ boxId: 'B1', status: null, consigneeId: null, consigneeName: null,
            boxType: null, boxTypeDescription: null, packedBy: null, packedDate: null,
            warehouseId: null, warehouseDescription: null, customerId: null,
            customerName: null, customerType: null, orderClass: null, orderDate: null,
            creationDate: '2026-01-01' }],
          totalCount: 1, pageNumber: 1, pageSize: 25, totalPages: 1,
        },
      };
      boxDetailsServiceSpy.searchBoxes.and.returnValue(of(resp));
      component.onSearch('B1');
      tick();
      expect(component['dataLoadAnnouncement']()).toBe('1 box found');
    }));

    it('dataLoadAnnouncement should use plural "boxes" for count > 1', fakeAsync(() => {
      const resp: PaginatedResponse<BoxSearchResult> = {
        success: true, message: 'OK', statusCode: 200,
        data: { items: [], totalCount: 3, pageNumber: 1, pageSize: 25, totalPages: 1 },
      };
      boxDetailsServiceSpy.searchBoxes.and.returnValue(of(resp));
      component.onSearch('B');
      tick();
      expect(component['dataLoadAnnouncement']()).toBe('3 boxes found');
    }));

    it('readyLoadAnnouncement should return "" when loading', fakeAsync(() => {
      component['readyLoading'].set(true);
      expect(component['readyLoadAnnouncement']()).toBe('');
    }));

    it('readyLoadAnnouncement should return singular "box" for count 1', fakeAsync(() => {
      const response: BoxesReadyForShipmentResponse = {
        success: true, message: 'OK', statusCode: 200, data: [], totalCount: 1,
      };
      boxDetailsServiceSpy.getBoxesReadyForShipment.and.returnValue(of(response));
      component.onTabChange(2);
      tick();
      expect(component['readyLoadAnnouncement']()).toBe('1 box ready for shipment');
    }));

    it('readyLoadAnnouncement should return "" when count is 0', fakeAsync(() => {
      component.onTabChange(2);
      tick();
      expect(component['readyLoadAnnouncement']()).toBe('');
    }));

    it('readyLoadAnnouncement should return plural "boxes" for count > 1', fakeAsync(() => {
      const response: BoxesReadyForShipmentResponse = {
        success: true, message: 'OK', statusCode: 200, data: [], totalCount: 5,
      };
      boxDetailsServiceSpy.getBoxesReadyForShipment.and.returnValue(of(response));
      component.onTabChange(2);
      tick();
      expect(component['readyLoadAnnouncement']()).toBe('5 boxes ready for shipment');
    }));

    it('headerConfig should return title from pageHeaderService', () => {
      const config = component['headerConfig']();
      expect(config.title).toBe('Box Management');
    });

    it('isReadyTab should be true when activeTabIndex is 2', fakeAsync(() => {
      component.onTabChange(2);
      tick();
      expect(component['isReadyTab']()).toBeTrue();
    }));

    it('isReadyTab should be false when activeTabIndex is 0', () => {
      expect(component['isReadyTab']()).toBeFalse();
    });
  });

  describe('loadData - sortOrder branch coverage', () => {
    it('should pass undefined sortOrder when openBoxesSortOrder is null', fakeAsync(() => {
      component['openBoxesSortOrder'] = null;
      component['openBoxesSortColumn'] = null;
      boxDetailsServiceSpy.searchBoxes.calls.reset();
      component.loadData();
      tick();
      const callArgs = boxDetailsServiceSpy.searchBoxes.calls.mostRecent().args[0];
      expect(callArgs.sortOrder).toBeUndefined();
    }));

    it('should include fromDate and toDate when set in form', fakeAsync(() => {
      const moment = require('moment');
      component.filterForm.patchValue({
        fromDate: moment('2026-01-01'),
        toDate: moment('2026-01-31'),
      });
      boxDetailsServiceSpy.searchBoxes.calls.reset();
      component.loadData();
      tick();
      const callArgs = boxDetailsServiceSpy.searchBoxes.calls.mostRecent().args[0];
      expect(callArgs.fromDate).toBe('2026-01-01');
      expect(callArgs.toDate).toBe('2026-01-31');
    }));
  });

  describe('readyTableConfig valueFormatters', () => {
    it('estArrivalTime formatter: should format non-null date', () => {
      const col = component['readyTableConfig'].columns[3];
      const result = col.valueFormatter?.('2026-01-15T10:30:00Z', {} as any);
      expect(result).toContain('JAN');
    });

    it('estArrivalTime formatter: should return "" for null', () => {
      const col = component['readyTableConfig'].columns[3];
      expect(col.valueFormatter?.(null as any, {} as any)).toBe('');
    });

    it('closedDate formatter: should format non-null date', () => {
      const col = component['readyTableConfig'].columns[7];
      const result = col.valueFormatter?.('2026-06-01T12:00:00Z', {} as any);
      expect(result).toContain('JUN');
    });

    it('closedDate formatter: should return "" for null', () => {
      const col = component['readyTableConfig'].columns[7];
      expect(col.valueFormatter?.(null as any, {} as any)).toBe('');
    });
  });

  describe('applyReadyFilters (private)', () => {
    it('should set all filters and convert to chips when all fields are set', fakeAsync(() => {
      component['activeTabIndex'].set(2);
      component['filterOptionsLoaded'] = true;
      (component as any).applyReadyFilters({ priority: 'HIGH', consignee: 'Hospital A', packedBy: 'User1' });
      tick();
      expect(component['appliedFilters']).toEqual({ priority: 'HIGH', consignee: 'Hospital A', packedBy: 'User1' });
      expect(component['filterChips'].length).toBe(3);
    }));

    it('should set appliedFilters to null when no filter values', fakeAsync(() => {
      component['activeTabIndex'].set(2);
      component['filterOptionsLoaded'] = true;
      (component as any).applyReadyFilters({ priority: null, consignee: null, packedBy: null });
      tick();
      expect(component['appliedFilters']).toBeNull();
      expect(component['filterChips']).toEqual([]);
    }));
  });

  describe('onSearch with null', () => {
    it('should treat null search text as empty string', fakeAsync(() => {
      component.onSearch(null as any);
      tick();
      expect(component['searchText']).toBe('');
    }));
  });

  describe('onReadySearch with null', () => {
    it('should treat null search text as empty string', fakeAsync(() => {
      component['activeTabIndex'].set(2);
      component['filterOptionsLoaded'] = true;
      component.onReadySearch(null as any);
      tick();
      expect(component['readySearchText']).toBe('');
    }));
  });

  describe('loadData with non-empty searchText', () => {
    it('should pass searchText as searchTerm when set', fakeAsync(() => {
      component['searchText'] = 'BOX001';
      boxDetailsServiceSpy.searchBoxes.calls.reset();
      component.loadData();
      tick();
      const callArgs = boxDetailsServiceSpy.searchBoxes.calls.mostRecent().args[0];
      expect(callArgs.searchTerm).toBe('BOX001');
    }));
  });

  describe('Open Boxes data mapping', () => {
    it('should map null orderDate to empty string for creationDate', fakeAsync(() => {
      const openBoxResponse: OpenBoxPaginatedResponse = {
        items: [{
          boxId: 'BOX001', warehouseId: 'WH1', warehouseDescription: 'Warehouse 1',
          customerName: 'Hospital', customerType: 'H', orderClass: 'STD',
          orderDate: null, packedDate: null, packedBy: 'User1',
        }],
        totalCount: 1, totalOpenBoxes: 1, pageNumber: 1, pageSize: 25, totalPages: 1,
      };
      boxDetailsServiceSpy.searchOpenBoxes.and.returnValue(of(openBoxResponse));
      component.onTabChange(1);
      tick();
      expect(component['boxes']()[0].creationDate).toBe('');
    }));

    it('should map non-null orderDate to creationDate', fakeAsync(() => {
      const openBoxResponse: OpenBoxPaginatedResponse = {
        items: [{
          boxId: 'BOX001', warehouseId: 'WH1', warehouseDescription: 'Warehouse 1',
          customerName: 'Hospital', customerType: 'H', orderClass: 'STD',
          orderDate: '2026-01-01', packedDate: null, packedBy: 'User1',
        }],
        totalCount: 1, totalOpenBoxes: 1, pageNumber: 1, pageSize: 25, totalPages: 1,
      };
      boxDetailsServiceSpy.searchOpenBoxes.and.returnValue(of(openBoxResponse));
      component.onTabChange(1);
      tick();
      expect(component['boxes']()[0].creationDate).toBe('2026-01-01');
    }));
  });

  describe('updateTablePagination on Open Boxes tab', () => {
    it('should update open boxes column header when on tab index 1', fakeAsync(() => {
      const openBoxResponse: OpenBoxPaginatedResponse = {
        items: [], totalCount: 5, totalOpenBoxes: 5, pageNumber: 1, pageSize: 25, totalPages: 1,
      };
      boxDetailsServiceSpy.searchOpenBoxes.and.returnValue(of(openBoxResponse));
      component.onTabChange(1);
      tick();
      const boxIdCol = component.tableConfig.columns.find((c: any) => c.key === 'boxId');
      expect(boxIdCol?.header).toContain('5');
    }));
  });

  describe('loadFilterOptions with populated data', () => {
    it('should collect priority, consignee and packedBy when response has items', fakeAsync(() => {
      const readyWithData: BoxesReadyForShipmentResponse = {
        success: true, message: 'OK', statusCode: 200,
        totalCount: 1,
        data: [{
          boxId: 'BOX001', priority: 'HIGH', consigneeName: 'Hospital A',
          packedByName: 'User1', closedDate: null, estArrivalTime: null,
          orderNo: null, boxType: null,
        }],
      };
      boxDetailsServiceSpy.getBoxesReadyForShipment.and.returnValue(of(readyWithData));
      component.onTabChange(2);
      tick();
      expect(component['availablePriorities']).toContain('HIGH');
      expect(component['availableConsignees']).toContain('Hospital A');
      expect(component['availablePackedByUsers']).toContain('User1');
    }));
  });

  describe('ngOnDestroy', () => {
    it('should complete subjects on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');
      fixture.destroy();
      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    }));
  });
});
