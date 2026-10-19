import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageDeviceDetailsComponent } from './storage-device-details';
import { StorageDeviceService } from './services/storage-device.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StorageDeviceListDto } from './models/storage-device.model';
import { TablePageEvent, TableRowActionEvent } from '@shared/interfaces/data-table.interface';

describe('StorageDeviceDetailsComponent', () => {
  let serviceSpy: any;
  let component: StorageDeviceDetailsComponent;
  let fixture: ComponentFixture<StorageDeviceDetailsComponent>;
  let service: jasmine.SpyObj<StorageDeviceService>;

  const mockDevices: StorageDeviceListDto[] = [
    {
      deviceType: 'FRIDGE',
      deviceDescription: 'Main Fridge',
      deviceNumber: '01',
      deviceStatus: 'A',
      deviceStatusDescription: 'Active',
      rackCount: 5,
      installDate: '01-JAN-2024',
      lastServiceDate: null,
      nextServiceDate: null,
      lastTemperature: 4.5,
      tempReadDate: null,
      effectiveDate: '01-JAN-2024',
      terminationDate: null,
      lastModifiedDate: null
    },
    {
      deviceType: 'FREEZER',
      deviceDescription: 'Deep Freezer',
      deviceNumber: '02',
      deviceStatus: 'I',
      deviceStatusDescription: 'Inactive',
      rackCount: 3,
      installDate: '15-MAR-2023',
      lastServiceDate: '01-DEC-2023',
      nextServiceDate: '01-JUN-2024',
      lastTemperature: -20,
      tempReadDate: '01-DEC-2023',
      effectiveDate: '15-MAR-2023',
      terminationDate: '31-DEC-2024',
      lastModifiedDate: '01-DEC-2023 10:30 AM'
    }
  ];

  const mockLovResponse = {
    success: true,
    message: '',
    error: null,
    statusCode: 200,
    data: [{ code: 'WH01', description: 'Warehouse 1' }],
    total: 1
  };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('StorageDeviceService', [
      'getStorageDevices',
      'createStorageDevice',
      'updateStorageDevice',
      'getWarehouseLov',
      'getDeviceTypeLov',
      'getDeviceStatusLov',
      'getFilterDeviceTypes',
      'getFilterStatusCodes'
    ]);



      TestBed.configureTestingModule({
      imports: [StorageDeviceDetailsComponent, NoopAnimationsModule, HttpClientTestingModule, TranslateModule.forRoot()],
      providers: [
        { provide: StorageDeviceService, useValue: serviceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { params: {}, queryParams: {} },
            params: of({}),
            queryParams: of({})
          }
        }
      ]
    });


    


      serviceSpy.getStorageDevices.calls.reset();


      serviceSpy.createStorageDevice.calls.reset();


      serviceSpy.updateStorageDevice.calls.reset();


      serviceSpy.getWarehouseLov.calls.reset();


      serviceSpy.getDeviceTypeLov.calls.reset();


      serviceSpy.getDeviceStatusLov.calls.reset();


      serviceSpy.getFilterDeviceTypes.calls.reset();


      serviceSpy.getFilterStatusCodes.calls.reset();


    service = TestBed.inject(StorageDeviceService) as jasmine.SpyObj<StorageDeviceService>;
    service.getWarehouseLov.and.returnValue(of(mockLovResponse));
    service.getDeviceTypeLov.and.returnValue(of({ ...mockLovResponse, data: [{ code: 'FRIDGE', description: 'Fridge' }] }));
    service.getDeviceStatusLov.and.returnValue(of({ ...mockLovResponse, data: [{ code: 'A', description: 'Active' }] }));
    service.getStorageDevices.and.returnValue(of({ data: mockDevices, totalRecords: 2 }));
    service.getFilterDeviceTypes.and.returnValue(of({ ...mockLovResponse, data: [{ code: 'FRIDGE', description: 'Fridge' }] }));
    service.getFilterStatusCodes.and.returnValue(of({ ...mockLovResponse, data: [{ code: 'A', description: 'Active' }] }));

    fixture = TestBed.createComponent(StorageDeviceDetailsComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize header configuration with breadcrumbs', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThanOrEqual(1);
    });

    it('should initialize search configuration', () => {
      fixture.detectChanges();
      expect(component.searchConfig).toBeDefined();
      expect(component.searchConfig.placeholder).toBe('Search by device type or description');
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
    });

    it('should initialize table configuration with correct columns', () => {
      fixture.detectChanges();
      expect(component.tableConfig).toBeDefined();
      expect(component.tableConfig.columns.length).toBe(13);
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
    });

    it('should load warehouse LOV on init', () => {
      fixture.detectChanges();
      expect(service.getWarehouseLov).toHaveBeenCalled();
      expect(component.warehouseOptions().length).toBe(1);
    });

    it('should load device type and status LOVs on init', () => {
      fixture.detectChanges();
      expect(service.getDeviceTypeLov).toHaveBeenCalled();
      expect(service.getDeviceStatusLov).toHaveBeenCalled();
    });

    it('should start with no warehouse selected', () => {
      expect(component.selectedWarehouse).toBeNull();
      expect(component.hasSearched).toBeFalse();
    });

    it('should start with empty data source', () => {
      expect(component.dataSource).toEqual([]);
    });
  });

  describe('Warehouse Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load data when warehouse is selected', () => {
      component.onWarehouseChange('WH01');
      expect(component.selectedWarehouse).toBe('WH01');
      expect(component.hasSearched).toBeTrue();
      expect(service.getStorageDevices).toHaveBeenCalled();
    });

    it('should reset state when warehouse changes', () => {
      component.searchText = 'test';
      component.appliedFilters = { deviceType: 'FRIDGE', statusCode: null, effectivePeriod: null, effectiveDate: null, terminationPeriod: null, terminationDate: null };
      component.filterChips = [{ key: 'deviceType', label: 'test', value: 'test' }];
      component.onWarehouseChange('WH02');
      expect(component.searchText).toBe('');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should clear warehouse and reset all state', () => {
      component.onWarehouseChange('WH01');
      component.clearWarehouse();
      expect(component.selectedWarehouse).toBeNull();
      expect(component.hasSearched).toBeFalse();
      expect(component.dataSource).toEqual([]);
    });

    it('should set warehouseTouched on dropdown close without selection', () => {
      component.onWarehouseDropdownToggle(false);
      expect(component.warehouseTouched).toBeTrue();
    });

    it('should not set warehouseTouched on dropdown open', () => {
      component.onWarehouseDropdownToggle(true);
      expect(component.warehouseTouched).toBeFalse();
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should populate dataSource after loading', () => {
      component.onWarehouseChange('WH01');
      expect(component.dataSource.length).toBe(2);
    });

    it('should handle error and set empty data', () => {
      service.getStorageDevices.and.returnValue(throwError(() => new Error('fail')));
      component.onWarehouseChange('WH01');
      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBeFalse();
    });

    it('should handle warehouse LOV error gracefully', () => {
      service.getWarehouseLov.and.returnValue(throwError(() => new Error('fail')));
      component['loadWarehouseLov']();
      expect(component.warehouseOptions()).toEqual([]);
      expect(component.isLoadingWarehouses).toBeFalse();
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onWarehouseChange('WH01');
      service.getStorageDevices.calls.reset();
    });

    it('should set searchText and reload data', () => {
      component.onSearch('FRIDGE');
      expect(component.searchText).toBe('FRIDGE');
      expect(service.getStorageDevices).toHaveBeenCalled();
    });

    it('should trim search text', () => {
      component.onSearch('  FRIDGE  ');
      expect(component.searchText).toBe('FRIDGE');
    });

    it('should handle empty search text', () => {
      component.onSearch('');
      expect(component.searchText).toBe('');
      expect(service.getStorageDevices).toHaveBeenCalled();
    });


  });



  describe('Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onWarehouseChange('WH01');
    });



    it('should open edit panel with row data', () => {
      component.openEditPanel(mockDevices[0]);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockDevices[0]);
    });




  });

  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onWarehouseChange('WH01');
    });

    it('should open edit panel on edit row action', () => {
      const event: TableRowActionEvent<StorageDeviceListDto> = { action: 'edit', row: mockDevices[0] };
      component.onRowAction(event);
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.sidePanelMode).toBe('edit');
    });

    it('should not open panel for unknown actions', () => {
      const event: TableRowActionEvent<StorageDeviceListDto> = { action: 'unknown', row: mockDevices[0] };
      component.onRowAction(event);
      expect(component.sidePanelOpen).toBeFalse();
    });
  });

  describe('Filter Chips', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onWarehouseChange('WH01');
      service.getStorageDevices.calls.reset();
    });



    it('should clear all chips and reload data', () => {
      component.appliedFilters = {
        deviceType: 'FRIDGE',
        statusCode: null,
        effectivePeriod: null,
        effectiveDate: null,
        terminationPeriod: null,
        terminationDate: null
      };
      component.filterChips = [{ key: 'deviceType', label: 'test', value: 'test' }];
      component.onClearAllChips();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(service.getStorageDevices).toHaveBeenCalled();
    });
  });



  describe('Filtered Warehouse Options', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return all options when no search term', () => {
      expect(component.filteredWarehouseOptions().length).toBe(1);
    });




  });

  describe('Sorting', () => {
    it('should handle sort change (no-op)', () => {
      expect(() => component.onSortChange({ column: 'deviceType', direction: 'A' })).not.toThrow();
    });
  });
});
