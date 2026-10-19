import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { PortalModule } from '@angular/cdk/portal';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { QcParametersTable } from './qc-parameters-table';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { HeaderService } from '@shared/services/header.service';
import { QcParametersFilterParams, QcParametersModel } from '../../models/drive-equipment-parameters.model';

describe('QcParametersTable', () => {
  let component: QcParametersTable;
  let fixture: ComponentFixture<QcParametersTable>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;
  let mockHeaderService: any;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getQcParameters',
      'createQcParameters',
      'updateQcParameters',
      'deleteQcParameters',
      'getDeviceTypes',
      'getEquipmentSupplyCodes'
    ]);

    mockHeaderService = {
      chapterTimeZone: signal('America/Los_Angeles'),
      chapterChanged$: new Subject()
    };

    // Setup default return values
    mockService.getQcParameters.and.returnValue(of({ data: [], totalRecords: 0 }));
    mockService.getDeviceTypes.and.returnValue(of(['EQUIP', 'SUPLY']));
    mockService.getEquipmentSupplyCodes.and.returnValue(of([]));

      TestBed.configureTestingModule({
      imports: [
        QcParametersTable,
        NoopAnimationsModule,
        PortalModule,
        MatSnackBarModule
      ],
      providers: [
        provideHttpClient(),
        { provide: DriveEquipmentParametersService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    

      mockService.getQcParameters.calls.reset();

      mockService.createQcParameters.calls.reset();

      mockService.updateQcParameters.calls.reset();

      mockService.deleteQcParameters.calls.reset();

      mockService.getDeviceTypes.calls.reset();

      mockService.getEquipmentSupplyCodes.calls.reset();

      mockService.getQcParameters.and.returnValue(of({ data: [], totalRecords: 0 }));

      mockService.getDeviceTypes.and.returnValue(of(['EQUIP', 'SUPLY']));

      mockService.getEquipmentSupplyCodes.and.returnValue(of([]));

    fixture = TestBed.createComponent(QcParametersTable);
    component = fixture.componentInstance;

    });

  describe('Component Initialization', () => {

    it('should initialize appliedFilters signal as empty object', () => {
      fixture.detectChanges();

      expect(component['appliedFilters']()).toEqual({});
    });

    it('should initialize with correct type options', () => {
      fixture.detectChanges();

      expect(component.typeOptions()).toEqual(['EQUIP', 'SUPLY']);
    });
  });


  describe('applyFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Setup initial request state
      component['requestState'] = {
        deviceType: 'EQUIP',
        equipmentSupply: 'TEST123',
        searchKeyword: 'SEARCH',
        sort: 'sortSequence,asc'
      };
    });

    it('should update appliedFilters signal with new filters', () => {
      const filters: QcParametersFilterParams = {
        qcParameterCode: 'PARAM1',
        dataType: 'C'
      };

      component.applyFilters(filters);

      expect(component['appliedFilters']()).toEqual(filters);
    });

    it('should merge filters into requestState', () => {
      const filters: QcParametersFilterParams = {
        qcParameterCode: 'PARAM1',
        dataType: 'C'
      };

      component.applyFilters(filters);

      expect(component['requestState']).toEqual(jasmine.objectContaining({
        deviceType: 'EQUIP',
        equipmentSupply: 'TEST123',
        searchKeyword: 'SEARCH',
        sort: 'sortSequence,asc',
        qcParameterCode: 'PARAM1',
        dataType: 'C'
      }));
    });

    it('should reset pagination to page 0', () => {
      const filters: QcParametersFilterParams = { qcParameterCode: 'PARAM1' };
      component.tableConfig.pagination = { pageIndex: 5, pageSize: 25, totalRecords: 100, pageSizeOptions: [25, 50] };

      component.applyFilters(filters);

      expect(component.tableConfig.pagination.pageIndex).toBe(0);
    });

    it('should handle partial filter updates', () => {
      // Apply first filter
      component.applyFilters({ qcParameterCode: 'PARAM1' });
      expect(component['appliedFilters']().qcParameterCode).toBe('PARAM1');

      // Apply second filter - should replace completely
      component.applyFilters({ dataType: 'C' });
      expect(component['appliedFilters']()).toEqual({ dataType: 'C' });
      expect(component['appliedFilters']().qcParameterCode).toBeUndefined();
    });

    it('should handle empty filters', () => {
      component.applyFilters({});

      expect(component['appliedFilters']()).toEqual({});
      expect(component['requestState'].qcParameterCode).toBeUndefined();
    });
  });

  describe('filterChips computed signal', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate chip for equipmentSupply filter', () => {
      component['appliedFilters'].set({ equipmentSupply: 'TEST123' });

      const chips = component.filterChips();

      expect(chips.length).toBe(1);
      expect(chips[0]).toEqual({
        key: 'equipmentSupply',
        label: 'Equipment/Supply: TEST123',
        value: 'TEST123',
        removable: true
      });
    });

    it('should generate chip for qcParameterCode filter', () => {
      component['appliedFilters'].set({ qcParameterCode: 'PARAM1' });

      const chips = component.filterChips();

      expect(chips.length).toBe(1);
      expect(chips[0].key).toBe('qcParameterCode');
      expect(chips[0].label).toBe('QC Parameter Code: PARAM1');
    });

    it('should handle multiple filters simultaneously', () => {
      component['appliedFilters'].set({
        qcParameterCode: 'PARAM1',
        dataType: 'C',
        effDateFrom: '2028-01-01'
      });

      const chips = component.filterChips();

      expect(chips.length).toBe(3);
      expect(chips.map(c => c.key)).toContain('qcParameterCode');
      expect(chips.map(c => c.key)).toContain('dataType');
      expect(chips.map(c => c.key)).toContain('effDateFrom');
    });

    it('should mark all chips as removable', () => {
      component['appliedFilters'].set({
        qcParameterCode: 'PARAM1',
        dataType: 'C'
      });

      const chips = component.filterChips();

      expect(chips.every(chip => chip.removable === true)).toBe(true);
    });
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(() => {
      fixture.detectChanges();
      spyOn<any>(component, 'loadData');
    });

    it('should remove specific filter from appliedFilters', () => {
      component['appliedFilters'].set({
        qcParameterCode: 'PARAM1',
        dataType: 'C',
        effDateFrom: '2028-01-01'
      });

      component.onRemoveFilterChip('dataType');

      const filters = component['appliedFilters']();
      expect(filters.qcParameterCode).toBe('PARAM1');
      expect(filters.dataType).toBeUndefined();
      expect(filters.effDateFrom).toBe('2028-01-01');
    });

    it('should update requestState to remove filter', () => {
      component['requestState'] = {
        deviceType: 'EQUIP',
        qcParameterCode: 'PARAM1',
        dataType: 'C'
      };
      component['appliedFilters'].set({ qcParameterCode: 'PARAM1', dataType: 'C' });

      component.onRemoveFilterChip('dataType');

      expect(component['requestState'].dataType).toBeUndefined();
      expect(component['requestState'].qcParameterCode).toBe('PARAM1');
    });

    it('should not affect other filters when removing one', () => {
      component['appliedFilters'].set({
        qcParameterCode: 'PARAM1',
        dataType: 'C',
        qcCheckCode: 'CHECK1'
      });

      component.onRemoveFilterChip('dataType');

      const filters = component['appliedFilters']();
      expect(filters.qcParameterCode).toBe('PARAM1');
      expect(filters.qcCheckCode).toBe('CHECK1');
      expect(filters.dataType).toBeUndefined();
    });

    it('should handle removing non-existent filter gracefully', () => {
      component['appliedFilters'].set({ qcParameterCode: 'PARAM1' });

      expect(() => {
        component.onRemoveFilterChip('nonExistentKey');
      }).not.toThrow();

      expect(component['appliedFilters']().qcParameterCode).toBe('PARAM1');
    });
  });

  describe('clearAllFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
      spyOn<any>(component, 'loadData');
    });

    it('should remove all filter properties from requestState', () => {
      component['requestState'] = {
        deviceType: 'EQUIP',
        equipmentSupply: 'TEST123',
        searchKeyword: 'SEARCH',
        sort: 'sortSequence,asc',
        qcParameterCode: 'PARAM1',
        dataType: 'C',
        effDateFrom: '2028-01-01'
      };

      component.clearAllFilters();

      expect(component['requestState']).toEqual({
        deviceType: 'EQUIP',
        equipmentSupply: 'TEST123',
        searchKeyword: 'SEARCH',
        sort: 'sortSequence,asc'
      });
      expect(component['requestState'].qcParameterCode).toBeUndefined();
      expect(component['requestState'].dataType).toBeUndefined();
      expect(component['requestState'].effDateFrom).toBeUndefined();
    });

    it('should reset pagination to page 0', () => {
      component.tableConfig.pagination = { pageIndex: 5, pageSize: 25, totalRecords: 100, pageSizeOptions: [25, 50] };

      component.clearAllFilters();

      expect(component.tableConfig.pagination.pageIndex).toBe(0);
    });

    it('should handle clearing when no filters applied', () => {
      component['appliedFilters'].set({});
      component['requestState'] = {
        deviceType: 'EQUIP',
        equipmentSupply: 'TEST123'
      };

      expect(() => {
        component.clearAllFilters();
      }).not.toThrow();

      expect(component['appliedFilters']()).toEqual({});
    });

    it('should preserve core request parameters (deviceType, equipmentSupply, searchKeyword, sort)', () => {
      component['requestState'] = {
        deviceType: 'EQUIP',
        equipmentSupply: 'TEST123',
        searchKeyword: 'SEARCH',
        sort: 'sortSequence,asc',
        qcParameterCode: 'PARAM1'
      };

      component.clearAllFilters();

      expect(component['requestState'].deviceType).toBe('EQUIP');
      expect(component['requestState'].equipmentSupply).toBe('TEST123');
      expect(component['requestState'].searchKeyword).toBe('SEARCH');
      expect(component['requestState'].sort).toBe('sortSequence,asc');
    });
  });

  describe('hasActiveFilters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when appliedFilters is empty', () => {
      component['appliedFilters'].set({});

      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when any filter is applied', () => {
      component['appliedFilters'].set({ qcParameterCode: 'PARAM1' });

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should ignore empty string values', () => {
      component['appliedFilters'].set({ qcParameterCode: '' });

      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should ignore undefined values', () => {
      component['appliedFilters'].set({ qcParameterCode: undefined });

      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true for multiple filters', () => {
      component['appliedFilters'].set({
        qcParameterCode: 'PARAM1',
        dataType: 'C'
      });

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true for date filters', () => {
      component['appliedFilters'].set({ effDateFrom: '2028-01-01' });

      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should handle mixed valid and invalid values correctly', () => {
      component['appliedFilters'].set({
        qcParameterCode: '',
        dataType: 'C',
        qcCheckCode: undefined
      });

      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('formatDateForChip', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format "2028-01-15" to "15-JAN-2028"', () => {
      const result = component['formatDateForChip']('2028-01-15');

      expect(result).toBe('15-JAN-2028');
    });

    it('should format "2028-12-31" to "31-DEC-2028"', () => {
      const result = component['formatDateForChip']('2028-12-31');

      expect(result).toBe('31-DEC-2028');
    });

    it('should handle single-digit days correctly', () => {
      const result = component['formatDateForChip']('2028-03-05');

      expect(result).toBe('05-MAR-2028');
    });

    it('should handle all months correctly', () => {
      const months = [
        ['2028-01-01', '01-JAN-2028'],
        ['2028-02-01', '01-FEB-2028'],
        ['2028-03-01', '01-MAR-2028'],
        ['2028-04-01', '01-APR-2028'],
        ['2028-05-01', '01-MAY-2028'],
        ['2028-06-01', '01-JUN-2028'],
        ['2028-07-01', '01-JUL-2028'],
        ['2028-08-01', '01-AUG-2028'],
        ['2028-09-01', '01-SEP-2028'],
        ['2028-10-01', '01-OCT-2028'],
        ['2028-11-01', '01-NOV-2028'],
        ['2028-12-01', '01-DEC-2028']
      ];

      months.forEach(([input, expected]) => {
        expect(component['formatDateForChip'](input)).toBe(expected);
      });
    });

    it('should handle ISO 8601 date format', () => {
      const result = component['formatDateForChip']('2028-06-15T00:00:00.000Z');

      // Depending on timezone, the date might shift, so we check for the expected month
      expect(result).toMatch(/\d{2}-(JUN|MAY)-2028/);
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format date string to DD-MMM-YYYY format', () => {
      const result = component.formatDate('2028-04-18');

      expect(result).toBe('18-APR-2028');
    });

    it('should format Date object to DD-MMM-YYYY format', () => {
      const date = new Date('2028-04-18');
      const result = component.formatDate(date);

      expect(result).toMatch(/18-APR-2028/);
    });

    it('should format modificationDate from QC Parameter model', () => {
      const qcParam: Partial<QcParametersModel> = {
        modificationDate: '2028-04-18T10:30:00Z'
      };

      const result = component.formatDate(qcParam.modificationDate);

      expect(result).toMatch(/18-APR-2028/);
    });

    it('should handle null modificationDate from QC Parameter model', () => {
      const qcParam: Partial<QcParametersModel> = {
        modificationDate: null
      };

      const result = component.formatDate(qcParam.modificationDate);

      expect(result).toBe('');
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('validateType', () => {
      it('should set error when type is empty', () => {
        component.selectedType = '';

        component.validateType();

        expect(component.typeError).toBe('Type is required');
      });

      it('should clear error when type is selected', () => {
        component.selectedType = 'EQUIP';

        component.validateType();

        expect(component.typeError).toBe('');
      });
    });

    describe('validateEquipmentSupply', () => {
      it('should set error when equipment supply is empty', () => {
        component.selectedEquipmentSupply = '';

        component.validateEquipmentSupply();

        expect(component.equipmentSupplyError).toBe('Search is required');
      });

      it('should clear error when equipment supply is selected', () => {
        component.selectedEquipmentSupply = 'ES001';

        component.validateEquipmentSupply();

        expect(component.equipmentSupplyError).toBe('');
      });
    });

    describe('onRetrieve', () => {
      it('should show both errors when type and equipment supply are empty', () => {
        component.selectedType = '';
        component.selectedEquipmentSupply = '';

        component.onRetrieve();

        expect(component.typeError).toBe('Type is required');
        expect(component.equipmentSupplyError).toBe('Search is required');
        expect(mockService.getQcParameters).not.toHaveBeenCalled();
      });

      it('should show type error when only type is empty', () => {
        component.selectedType = '';
        component.selectedEquipmentSupply = 'ES001';

        component.onRetrieve();

        expect(component.typeError).toBe('Type is required');
        expect(component.equipmentSupplyError).toBe('');
        expect(mockService.getQcParameters).not.toHaveBeenCalled();
      });

      it('should show equipment supply error when only equipment supply is empty', () => {
        component.selectedType = 'EQUIP';
        component.selectedEquipmentSupply = '';

        component.onRetrieve();

        expect(component.typeError).toBe('');
        expect(component.equipmentSupplyError).toBe('Search is required');
        expect(mockService.getQcParameters).not.toHaveBeenCalled();
      });

      it('should clear errors and load data when both fields are valid', () => {
        mockService.getQcParameters.and.returnValue(of({ data: [], totalRecords: 0 }));
        component.selectedType = 'EQUIP';
        component.selectedEquipmentSupply = 'ES001';

        component.onRetrieve();

        expect(component.typeError).toBe('');
        expect(component.equipmentSupplyError).toBe('');
        expect(mockService.getQcParameters).toHaveBeenCalled();
      });
    });

    describe('onTypeChange', () => {
      it('should clear type error when type is selected', () => {
        component.typeError = 'Type is required';

        component.onTypeChange('EQUIP');

        expect(component.typeError).toBe('');
      });

      it('should not clear error when empty type is selected', () => {
        component.typeError = 'Type is required';

        component.onTypeChange('');

        expect(component.typeError).toBe('Type is required');
      });
    });

    describe('onEquipmentSupplyChange', () => {
      it('should not clear error when empty value is selected', () => {
        component.equipmentSupplyError = 'Search is required';

        component.onEquipmentSupplyChange('');

        expect(component.equipmentSupplyError).toBe('Search is required');
      });
    });
  });
  describe('Row Highlighting', () => {
    const mockRecord: QcParametersModel = {
      deviceType: 'EQUIP',
      equipmentSupply: 'ES001',
      sortSequence: 1,
      qcParameterCode: 'QC001',
      qcParameterDescription: 'Test Parameter',
      qcCheckCode: 'CHK001',
      qcCheckDescription: 'Test Check',
      dataType: 'N',
      qcTargetValue: '100',
      qcTargetValueDescription: 'Target',
      childSequence: undefined,
      rangeFlag: 'Y',
      rangeDetailsValue: 5,
      scanRequest: 'Y',
      scanWhat: 'BAR',
      equipmentType: 'EQUIP',
      effectiveDate: '2028-01-01',
      terminationDate: '2028-12-31',
      modificationDate: '2028-04-18'
    };

    it('should return true when row is being edited', () => {
      component.sidePanelData = mockRecord;
      component.sidePanelMode = 'edit';
      fixture.detectChanges();

      const result = component.isRowHighlighted(mockRecord);

      expect(result).toBeTrue();
    });

    it('should return false when different row is being edited', () => {
      const differentRecord: QcParametersModel = {
        ...mockRecord,
        auditKey: 2,
        qcParameterCode: 'QC002'
      };

      component.sidePanelData = mockRecord;
      fixture.detectChanges();

      const result = component.isRowHighlighted(differentRecord);

      expect(result).toBeFalse();
    });

    it('should return false when no row is being edited', () => {
      component.sidePanelData = null;
      fixture.detectChanges();

      const result = component.isRowHighlighted(mockRecord);

      expect(result).toBeFalse();
    });

    it('should highlight row when edit data is set', () => {
      component.sidePanelData = null;

      component.sidePanelData = mockRecord;
      component.sidePanelMode = 'edit';
      component.sidePanelOpen = true;
      // Don't call detectChanges to avoid rendering side panel component

      expect(component.sidePanelData).toBeDefined();
      expect(component.sidePanelData).not.toBeNull();
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelOpen).toBeTrue();
      expect(component.isRowHighlighted(mockRecord)).toBeTrue();
    });

    it('should clear highlight when panel is closed', () => {
      component.sidePanelData = mockRecord;
      component.sidePanelMode = 'edit';
      component.sidePanelOpen = true;
      // Don't call detectChanges to avoid rendering side panel component

      component.closeSidePanel();

      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.isRowHighlighted(mockRecord)).toBeFalse();
    });

    it('should not highlight any row in Add mode', () => {
      component.sidePanelData = {
        deviceType: 'EQUIP',
        equipmentSupply: 'ES001'
      };
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      // Don't call detectChanges to avoid rendering side panel component

      const result = component.isRowHighlighted(mockRecord);

      expect(result).toBeFalse();
    });

    it('should switch highlight when editing different row', () => {
      const record1 = mockRecord;
      const record2: QcParametersModel = {
        ...mockRecord,
        qcParameterCode: 'QC002'
      };

      component.sidePanelData = record1;
      component.sidePanelMode = 'edit';
      // Don't call detectChanges to avoid rendering side panel component

      expect(component.isRowHighlighted(record1)).toBeTrue();
      expect(component.isRowHighlighted(record2)).toBeFalse();

      component.sidePanelData = record2;

      expect(component.isRowHighlighted(record1)).toBeFalse();
      expect(component.isRowHighlighted(record2)).toBeTrue();
    });

    it('should maintain highlight during save until panel closes', () => {
      mockService.getQcParameters.and.returnValue(of({
        data: [mockRecord],
        totalRecords: 1
      }));

      component.sidePanelData = mockRecord;
      component.sidePanelMode = 'edit';
      component.sidePanelOpen = true;
      // Don't call detectChanges to avoid rendering side panel component

      expect(component.isRowHighlighted(mockRecord)).toBeTrue();

      component.onSaveSuccess();

      // Data reloads but panel data remains set until explicitly closed
      expect(component.isRowHighlighted(mockRecord)).toBeTrue();
    });
  });
});
