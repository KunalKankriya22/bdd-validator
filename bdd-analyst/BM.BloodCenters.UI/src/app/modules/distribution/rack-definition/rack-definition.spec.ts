import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RackDefinitionComponent } from './rack-definition';
import { RackDefinitionService } from './services/rack-definition.service';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TranslateModule } from '@ngx-translate/core';
import { HeaderService } from '@shared/services/header.service';

describe('RackDefinitionComponent', () => {
  let component: RackDefinitionComponent;
  let fixture: ComponentFixture<RackDefinitionComponent>;
  let mockService: jasmine.SpyObj<RackDefinitionService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let chapterChangedSubject: Subject<void>;
  let backdropClickSubject: Subject<MouseEvent>;

  const lovResponse = { success: true, message: '', error: null, statusCode: 200, data: [], total: 0 };
  const lovWithData = {
    success: true, message: '', error: null, statusCode: 200,
    data: [{ code: 'W1', description: 'Warehouse 1' }], total: 1
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('RackDefinitionService', [
      'getRackDetails', 'getWarehouseLov', 'getDeviceTypeLov',
      'getDeviceNumberLov', 'getStorageTypeLov'
    ]);
    mockService.getWarehouseLov.and.returnValue(of(lovResponse));
    mockService.getDeviceTypeLov.and.returnValue(of(lovResponse));
    mockService.getStorageTypeLov.and.returnValue(of(lovResponse));
    mockService.getDeviceNumberLov.and.returnValue(of(lovResponse));
    mockService.getRackDetails.and.returnValue(of({ data: [], totalRecords: 0 }));

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/', events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    backdropClickSubject = new Subject<MouseEvent>();
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    const mockPositionStrategy = {
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);
    mockOverlay.scrollStrategies = { block: jasmine.createSpy('block').and.returnValue({}) } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);

    chapterChangedSubject = new Subject<void>();



      TestBed.configureTestingModule({
      imports: [RackDefinitionComponent, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: RackDefinitionService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


      mockService.getWarehouseLov.and.returnValue(of(lovResponse));


      mockService.getDeviceTypeLov.and.returnValue(of(lovResponse));


      mockService.getStorageTypeLov.and.returnValue(of(lovResponse));


      mockService.getDeviceNumberLov.and.returnValue(of(lovResponse));


      mockService.getRackDetails.and.returnValue(of({ data: [], totalRecords: 0 }));


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(RackDefinitionComponent);
    component = fixture.componentInstance;


    });


  it('should initialize configurations', () => {
    expect(component.searchConfig.placeholder).toBe('Search by rack description');
    expect(component.tableConfig.columns.length).toBeGreaterThan(0);
  });

  it('should load LOV data on init', () => {
    fixture.detectChanges();
    expect(mockService.getWarehouseLov).toHaveBeenCalled();
    expect(mockService.getDeviceTypeLov).toHaveBeenCalled();
    expect(mockService.getStorageTypeLov).toHaveBeenCalled();
  });

  it('should handle LOV load errors', () => {
    mockService.getWarehouseLov.and.returnValue(throwError(() => new Error('fail')));
    mockService.getDeviceTypeLov.and.returnValue(throwError(() => new Error('fail')));
    mockService.getStorageTypeLov.and.returnValue(throwError(() => new Error('fail')));
    fixture.detectChanges();
    expect(component.warehouseOptions().length).toBe(0);
    expect(component.deviceTypeOptions().length).toBe(0);
    expect(component.storageTypeOptions().length).toBe(0);
  });

  it('should set LOV data on success', () => {
    mockService.getWarehouseLov.and.returnValue(of(lovWithData));
    fixture.detectChanges();
    expect(component.warehouseOptions().length).toBe(1);
  });

  describe('computed filters', () => {
    beforeEach(() => {
      component.warehouseOptions.set([
        { code: 'W1', description: 'Warehouse One' },
        { code: 'W2', description: 'Warehouse Two' }
      ]);
      component.deviceTypeOptions.set([
        { code: 'DT1', description: 'Device Type 1' }
      ]);
      component.deviceNumberOptions.set([
        { code: 'DN1', description: 'Device Number 1' }
      ]);
      component.storageTypeOptions.set([
        { code: 'ST1', description: 'Storage Type 1' }
      ]);
    });



    it('should return all warehouses when search is empty', () => {
      component.warehouseSearch.set('');
      expect(component.filteredWarehouses().length).toBe(2);
    });

    it('should filter device types by search text', () => {
      component.deviceTypeSearch.set('xyz');
      expect(component.filteredDeviceTypes().length).toBe(0);
    });

    it('should filter device numbers by search text', () => {
      component.deviceNumberSearch.set('DN1');
      expect(component.filteredDeviceNumbers().length).toBe(1);
    });

    it('should filter storage types by search text', () => {
      component.storageTypeSearch.set('ST1');
      expect(component.filteredStorageTypes().length).toBe(1);
    });
  });

  describe('onWarehouseChange', () => {
    it('should reset device number on warehouse change', () => {
      component.selectedDeviceNumber = 'N1';
      component.onWarehouseChange();
      expect(component.selectedDeviceNumber).toBeNull();
      expect(component.deviceNumberOptions().length).toBe(0);
    });
  });
  describe('updateDeviceNumberState', () => {
    it('should load device numbers when warehouse and device type selected', () => {
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D1';
      component.onWarehouseChange();
      component.selectedDeviceType = 'D1';
      component.onDeviceTypeChange();

      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D2';
      mockService.getDeviceNumberLov.and.returnValue(of(lovWithData));
      (component as any).updateDeviceNumberState();
      expect(component.isDeviceNumberDisabled).toBe(false);
    });



    it('should handle device number load error', () => {
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D1';
      mockService.getDeviceNumberLov.and.returnValue(throwError(() => new Error('fail')));
      (component as any).updateDeviceNumberState();
      expect(component.deviceNumberOptions().length).toBe(0);
    });
  });

  describe('isRetrieveEnabled', () => {
    it('should return false when not all fields selected', () => {
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = null;
      expect(component.isRetrieveEnabled).toBe(false);
    });

    it('should return true when all fields selected', () => {
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D1';
      component.selectedDeviceNumber = 'N1';
      component.selectedStorageClass = 'S1';
      expect(component.isRetrieveEnabled).toBe(true);
    });
  });

  describe('isClearAllDisabled', () => {
    it('should return true when nothing selected and not retrieved', () => {
      component.selectedWarehouseId = null;
      component.selectedDeviceType = null;
      component.selectedDeviceNumber = null;
      component.selectedStorageClass = null;
      component.isRetrieved = false;
      expect(component.isClearAllDisabled).toBe(true);
    });

    it('should return false when warehouse selected', () => {
      component.selectedWarehouseId = 'W1';
      expect(component.isClearAllDisabled).toBe(false);
    });

    it('should return false when isRetrieved', () => {
      component.isRetrieved = true;
      expect(component.isClearAllDisabled).toBe(false);
    });
  });

  describe('onRetrieve', () => {
    it('should not load data when retrieve is not enabled', () => {
      component.selectedWarehouseId = null;
      component.onRetrieve();
      expect(component.isRetrieved).toBe(false);
    });

    it('should load data when all fields selected', () => {
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D1';
      component.selectedDeviceNumber = 'N1';
      component.selectedStorageClass = 'S1';
      component.onRetrieve();
      expect(component.isRetrieved).toBe(true);
      expect(mockService.getRackDetails).toHaveBeenCalled();
    });
  });
  describe('loadData', () => {
    beforeEach(() => {
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D1';
      component.selectedDeviceNumber = 'N1';
      component.selectedStorageClass = 'S1';
      component.isRetrieved = true;
    });





    it('should handle load error', () => {
      mockService.getRackDetails.and.returnValue(throwError(() => new Error('fail')));
      component.loadData();
      expect(component.hasError).toBe(true);
      expect(component.errorMessage).toBeTruthy();
    });

    it('should build query with filters', fakeAsync(() => {
      component.appliedFilters = {
        rackNumber: 'A1',
        productType: 'RBC',
        effectivePeriod: 'After',
        effectiveDate: '2026-01-01',
        terminationPeriod: 'Before',
        terminationDate: '2026-12-31'
      };
      component.searchText = 'test';
      component.loadData();
      tick();
      const callArgs = mockService.getRackDetails.calls.mostRecent().args;
      const queryDto = callArgs[2];
      expect(queryDto.filterRackNumber).toBe('A1');
      expect(queryDto.filterProductType).toBe('RBC');
      expect(queryDto.filterEffectiveDateAfter).toBe('2026-01-01');
      expect(queryDto.filterTermDateBefore).toBe('2026-12-31');
      expect(queryDto.searchKeyword).toBe('test');
    }));


  });
  describe('onRowAction', () => {


    it('should not open panel for non-edit action', () => {
      component.onRowAction({ action: 'delete', row: {} as any });
      expect(component.sidePanelOpen).toBe(false);
    });
  });

  describe('applyFilters', () => {
    it('should set filters and chips', () => {
      component.isRetrieved = true;
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D1';
      component.selectedDeviceNumber = 'N1';
      component.selectedStorageClass = 'S1';
      const filters = { rackNumber: 'A1', productType: null, effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null };
      component.applyFilters(filters);
      expect(component.appliedFilters).toBe(filters);
      expect(component.filterChips.length).toBe(1);
    });
  });
  describe('side panel', () => {
    it('createRecord should open add panel', () => {
      component.createRecord();
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('editRecord should open edit panel', () => {
      const row = { rackNumber: 'A1' } as any;
      component.editRecord(row);
      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(row);
    });




  });

  describe('retrieveState', () => {
    it('should return current selections', () => {
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D1';
      component.selectedDeviceNumber = 'N1';
      component.selectedStorageClass = 'S1';
      const state = component.retrieveState;
      expect(state.warehouseId).toBe('W1');
      expect(state.deviceType).toBe('D1');
      expect(state.deviceNumber).toBe('N1');
      expect(state.storageClass).toBe('S1');
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when no chips', () => {
      component.filterChips = [];
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when chips exist', () => {
      component.filterChips = [{ key: 'rackNumber', label: 'Rack: A1', value: 'A1' }];
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(() => {
      component.isRetrieved = true;
      component.selectedWarehouseId = 'W1';
      component.selectedDeviceType = 'D1';
      component.selectedDeviceNumber = 'N1';
      component.selectedStorageClass = 'S1';
    });



    it('should update filters when removing one of multiple', () => {
      component.appliedFilters = { rackNumber: 'A1', productType: 'RBC', effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null };
      component.onRemoveFilterChip('rackNumber');
      expect(component.appliedFilters).not.toBeNull();
      expect(component.appliedFilters!.productType).toBe('RBC');
    });
  });
  describe('table column formatters', () => {


    it('should format shelfCount', () => {
      const cols = component.tableConfig.columns;
      const shelfCol = cols.find(c => c.key === 'shelfCount');
      expect(shelfCol?.valueFormatter?.(5, {} as any)).toBe('5');
      expect(shelfCol?.valueFormatter?.(null, {} as any)).toBe('');
      expect(shelfCol?.valueFormatter?.(undefined, {} as any)).toBe('');
    });



    it('should format mixProduct', () => {
      const cols = component.tableConfig.columns;
      const mixCol = cols.find(c => c.key === 'mixProduct');
      expect(mixCol?.valueFormatter?.('Y', {} as any)).toBe('Yes');
      expect(mixCol?.valueFormatter?.('N', {} as any)).toBe('No');
      expect(mixCol?.valueFormatter?.(null, {} as any)).toBe('');
    });

    it('should format mixAbo', () => {
      const cols = component.tableConfig.columns;
      const mixAboCol = cols.find(c => c.key === 'mixAbo');
      expect(mixAboCol?.valueFormatter?.('Y', {} as any)).toBe('Yes');
      expect(mixAboCol?.valueFormatter?.('N', {} as any)).toBe('No');
      expect(mixAboCol?.valueFormatter?.(null, {} as any)).toBe('');
    });


  });

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions', () => {
      fixture.detectChanges();
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
