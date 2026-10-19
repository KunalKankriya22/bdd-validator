import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PhysicalEquipmentTable } from './physical-equipment-table';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { HeaderService } from '@shared/services/header.service';
import { PhysicalEquipmentModel } from '../../models/drive-equipment-parameters.model';

const mockRecord: PhysicalEquipmentModel = {
  physicalCode: 'ARMCK',
  physicalCodeDescription: 'Arm Check',
  equipmentType: 'BPT',
  equipmentTypeDescription: 'BP, Pulse, Temp',
  effectiveDate: '2026-01-01',
  terminationDate: null,
  auditKey: 42
};

describe('PhysicalEquipmentTable', () => {
  let component: PhysicalEquipmentTable;
  let fixture: ComponentFixture<PhysicalEquipmentTable>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;
  let mockHeaderService: any;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getPhysicalEquipment',
      'createPhysicalEquipment',
      'updatePhysicalEquipment'
    ]);
    mockService.getPhysicalEquipment.and.returnValue(of({ data: [], totalRecords: 0 }));

    mockHeaderService = {
      chapterTimeZone: signal('America/Chicago'),
      chapterChanged$: new Subject<void>()
    };



      TestBed.configureTestingModule({
      imports: [PhysicalEquipmentTable, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        { provide: DriveEquipmentParametersService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.getPhysicalEquipment.calls.reset();


      mockService.createPhysicalEquipment.calls.reset();


      mockService.updatePhysicalEquipment.calls.reset();


      mockService.getPhysicalEquipment.and.returnValue(of({ data: [], totalRecords: 0 }));


    fixture = TestBed.createComponent(PhysicalEquipmentTable);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  // ─────────────────────────────────────────────
  // Initialization
  // ─────────────────────────────────────────────
  describe('Initialization', () => {




    it('should start with side panel closed', () => {
      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should start with no data', () => {
      expect(component.data().length).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  // Table configuration
  // ─────────────────────────────────────────────
  describe('Table configuration', () => {






    it('should format effectiveDate column as DD-MON-YYYY', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      expect(col?.valueFormatter?.('2026-04-15', mockRecord)).toBe('15-APR-2026');
    });

    it('should format terminationDate column as DD-MON-YYYY', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      expect(col?.valueFormatter?.('2027-12-31', mockRecord)).toBe('31-DEC-2027');
    });


  });

  // ─────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────
  describe('Data loading', () => {


    it('should map auditKey from response', () => {
      mockService.getPhysicalEquipment.and.returnValue(of({
        data: [mockRecord],
        totalRecords: 1
      }));

      component.loadData();
      expect(component.data()[0].auditKey).toBe(42);
    });





    it('should set empty data on error', () => {
      mockService.getPhysicalEquipment.and.returnValue(throwError(() => ({ status: 500 })));
      component.loadData();
      expect(component.data().length).toBe(0);
      expect(component.loading()).toBeFalse();
    });
  });

  // ─────────────────────────────────────────────
  // Side panel – Add
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // Side panel – Edit
  // ─────────────────────────────────────────────
  describe('Side panel – Edit mode', () => {
    it('should open side panel in edit mode', () => {
      component.editRecord(mockRecord);
      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.sidePanelMode()).toBe('edit');
    });

    it('should pass record to sidePanelData', () => {
      component.editRecord(mockRecord);
      expect(component.sidePanelData()?.record).toBe(mockRecord);
    });

    it('should highlight the edited row', () => {
      component.editRecord(mockRecord);
      expect(component.highlightedRecord()).toBe(mockRecord);
    });
  });

  // ─────────────────────────────────────────────
  // Side panel – Close
  // ─────────────────────────────────────────────
  describe('closeSidePanel', () => {
    it('should close the side panel', () => {
      component.editRecord(mockRecord);
      component.closeSidePanel();
      expect(component.sidePanelOpen()).toBeFalse();
    });



    it('should clear highlightedRecord on close', () => {
      component.editRecord(mockRecord);
      component.closeSidePanel();
      expect(component.highlightedRecord()).toBeNull();
    });
  });

  // ─────────────────────────────────────────────
  // onSaveSuccess
  // ─────────────────────────────────────────────
  describe('onSaveSuccess', () => {
    it('should close side panel and reload data', () => {
      component.editRecord(mockRecord);
      component.onSaveSuccess();
      expect(component.sidePanelOpen()).toBeFalse();
      expect(mockService.getPhysicalEquipment).toHaveBeenCalledTimes(2);
    });

    it('should reset page to 0 after add', () => {
      component['panelMode'].set('add');
      component['panelOpen'].set(true);
      component.tableConfig.pagination!.pageIndex = 3;
      component.onSaveSuccess();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  // Row action dispatch
  // ─────────────────────────────────────────────
  describe('onRowAction', () => {
    it('should call editRecord for edit action', () => {
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row: mockRecord });
      expect(component.editRecord).toHaveBeenCalledWith(mockRecord);
    });

    it('should not throw for unknown action', () => {
      expect(() => component.onRowAction({ action: 'unknown', row: mockRecord })).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────
  // Search
  // ─────────────────────────────────────────────
  describe('onSearch', () => {
    it('should reload data on search', () => {
      component.onSearch('ARMCK');
      expect(mockService.getPhysicalEquipment).toHaveBeenCalledTimes(2);
    });




  });

  // ─────────────────────────────────────────────
  // Pagination
  // ─────────────────────────────────────────────
  // ─────────────────────────────────────────────
  // Filter chips
  // ─────────────────────────────────────────────
  describe('Filter chips', () => {
    it('should show no chips when no filters are applied', () => {
      expect(component.hasActiveFilters()).toBeFalse();
      expect(component.filterChips().length).toBe(0);
    });

    it('should show chips when effective date filter is applied', () => {
      component.applyFilters({ effDateFrom: '2026-01-01' });
      expect(component.hasActiveFilters()).toBeTrue();
      expect(component.filterChips().length).toBe(1);
      expect(component.filterChips()[0].key).toBe('effDateFrom');
    });

    it('should remove chip on onRemoveFilterChip', () => {
      component.applyFilters({ effDateFrom: '2026-01-01', effDateTo: '2026-12-31' });
      component.onRemoveFilterChip('effDateFrom');
      const keys = component.filterChips().map(c => c.key);
      expect(keys).not.toContain('effDateFrom');
      expect(keys).toContain('effDateTo');
    });


  });

  // ─────────────────────────────────────────────
  // Chapter change
  // ─────────────────────────────────────────────
  describe('Chapter change', () => {
    it('should close side panel on chapter change', () => {
      component.editRecord(mockRecord);
      mockHeaderService.chapterChanged$.next();
      expect(component.sidePanelOpen()).toBeFalse();
    });

    it('should reload data on chapter change', () => {
      const callsBefore = mockService.getPhysicalEquipment.calls.count();
      mockHeaderService.chapterChanged$.next();
      expect(mockService.getPhysicalEquipment.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should reset pagination on chapter change', () => {
      component.tableConfig.pagination!.pageIndex = 3;
      mockHeaderService.chapterChanged$.next();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });
});
