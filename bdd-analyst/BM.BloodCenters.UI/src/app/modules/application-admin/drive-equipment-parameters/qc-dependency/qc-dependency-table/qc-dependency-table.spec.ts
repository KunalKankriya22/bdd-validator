import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { signal } from '@angular/core';
import { QcDependencyTable } from './qc-dependency-table';
import { DriveEquipmentParametersService } from '../../services/drive-equipment-parameters.service';
import { HeaderService } from '@shared/services/header.service';
import { QcDependencyModel } from '../../models/drive-equipment-parameters.model';

describe('QcDependencyTable', () => {
  let component: QcDependencyTable;
  let fixture: ComponentFixture<QcDependencyTable>;
  let mockService: jasmine.SpyObj<DriveEquipmentParametersService>;
  let mockHeaderService: any;

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DriveEquipmentParametersService', [
      'getQcDependencies',
      'createQcDependency',
      'updateQcDependency',
      'getEquipmentSupplyCodes'
    ]);

    mockHeaderService = {
      chapterTimeZone: signal('America/Los_Angeles'),
      chapterChanged$: new Subject()
    };

    // Setup default return values
    mockService.getQcDependencies.and.returnValue(of({ data: [], totalRecords: 0 }));
    mockService.getEquipmentSupplyCodes.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [
        QcDependencyTable,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: DriveEquipmentParametersService, useValue: mockService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockService.getQcDependencies.calls.reset();


      mockService.createQcDependency.calls.reset();


      mockService.updateQcDependency.calls.reset();


      mockService.getEquipmentSupplyCodes.calls.reset();


      mockService.getQcDependencies.and.returnValue(of({ data: [], totalRecords: 0 }));


      mockService.getEquipmentSupplyCodes.and.returnValue(of([]));


    fixture = TestBed.createComponent(QcDependencyTable);
    component = fixture.componentInstance;


    });
  describe('formatDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format date string to DD-MMM-YYYY format', () => {
      const result = component.formatDate('2026-04-18');

      expect(result).toBe('18-APR-2026');
    });

    it('should format Date object to DD-MMM-YYYY format', () => {
      const date = new Date('2026-04-18');
      const result = component.formatDate(date);

      expect(result).toMatch(/18-APR-2026/);
    });







    it('should format modificationDate from QC Dependency model', () => {
      const qcDep: Partial<QcDependencyModel> = {
        modificationDate: '2026-04-18T10:30:00Z'
      };

      const result = component.formatDate(qcDep.modificationDate);

      expect(result).toMatch(/18-APR-2026/);
    });

    it('should handle null modificationDate from QC Dependency model', () => {
      const qcDep: Partial<QcDependencyModel> = {
        modificationDate: null
      };

      const result = component.formatDate(qcDep.modificationDate);

      expect(result).toBe('');
    });
  });

  describe('Table Column Formatting', () => {
    it('should apply date formatter to effectiveDate column', () => {
      fixture.detectChanges();

      const effectiveDateColumn = component.tableConfig.columns.find(col => col.key === 'effectiveDate');

      expect(effectiveDateColumn?.valueFormatter).toBeDefined();
      if (effectiveDateColumn?.valueFormatter) {
        const formatted = effectiveDateColumn.valueFormatter('2026-04-18', {} as QcDependencyModel);
        expect(formatted).toBe('18-APR-2026');
      }
    });

    it('should apply date formatter to terminationDate column', () => {
      fixture.detectChanges();

      const terminationDateColumn = component.tableConfig.columns.find(col => col.key === 'terminationDate');

      expect(terminationDateColumn?.valueFormatter).toBeDefined();
      if (terminationDateColumn?.valueFormatter) {
        const formatted = terminationDateColumn.valueFormatter('2026-12-31', {} as QcDependencyModel);
        expect(formatted).toBe('31-DEC-2026');
      }
    });

    it('should apply date formatter to modificationDate column', () => {
      fixture.detectChanges();

      const modificationDateColumn = component.tableConfig.columns.find(col => col.key === 'modificationDate');

      expect(modificationDateColumn?.valueFormatter).toBeDefined();
      if (modificationDateColumn?.valueFormatter) {
        const formatted = modificationDateColumn.valueFormatter('2026-04-18T10:30:00Z', {} as QcDependencyModel);
        expect(formatted).toMatch(/18-APR-2026/);
      }
    });
  });

  describe('Row Highlighting', () => {
    const mockRecord: QcDependencyModel = {
      auditKey: 1,
      deviceType: 'EQUIP',
      equipmentSupplyCode: 'ES001',
      sourceParamCode: 'SRC001',
      sourceParamDescription: 'Source Parameter',
      dependentCode: 'DEP001',
      dependentDescription: 'Dependent Parameter',
      effectiveDate: '2026-01-01',
      terminationDate: '2026-12-31',
      modificationDate: '2026-04-18'
    };

    it('should return true when row is being edited', () => {
      component['panelData'].set({ mode: 'edit', record: mockRecord });
      fixture.detectChanges();

      const result = component.isRowHighlighted(mockRecord);

      expect(result).toBeTrue();
    });

    it('should return false when different row is being edited', () => {
      const differentRecord: QcDependencyModel = {
        ...mockRecord,
        auditKey: 2,
        sourceParamCode: 'SRC002'
      };

      component['panelData'].set({ mode: 'edit', record: mockRecord });
      fixture.detectChanges();

      const result = component.isRowHighlighted(differentRecord);

      expect(result).toBeFalse();
    });

    it('should return false when no row is being edited', () => {
      component['panelData'].set(null);
      fixture.detectChanges();

      const result = component.isRowHighlighted(mockRecord);

      expect(result).toBeFalse();
    });

    it('should highlight row when edit data is set', () => {
      component['panelData'].set({ mode: 'edit', record: mockRecord });
      component['panelMode'].set('edit');
      component['panelOpen'].set(true);

      expect(component.sidePanelData()?.record).toBe(mockRecord);
      expect(component.sidePanelMode()).toBe('edit');
      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.isRowHighlighted(mockRecord)).toBeTrue();
    });

    it('should clear highlight when panel is closed', () => {
      component['panelData'].set({ mode: 'edit', record: mockRecord });
      component['panelMode'].set('edit');
      component['panelOpen'].set(true);
      // Don't call detectChanges to avoid rendering side panel component

      component.closeSidePanel();

      expect(component.sidePanelData()).toBeNull();
      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.isRowHighlighted(mockRecord)).toBeFalse();
    });

    it('should not highlight any row in Add mode', () => {
      component['panelData'].set({
        mode: 'add',
        deviceType: 'EQUIP',
        equipmentSupplyCode: 'ES001',
        existingRecords: []
      });
      component['panelMode'].set('add');
      component['panelOpen'].set(true);
      // Don't call detectChanges to avoid rendering side panel component

      const result = component.isRowHighlighted(mockRecord);

      expect(result).toBeFalse();
    });

    it('should switch highlight when editing different row', () => {
      const record1 = mockRecord;
      const record2: QcDependencyModel = {
        ...mockRecord,
        auditKey: 2,
        sourceParamCode: 'SRC002'
      };

      component['panelData'].set({ mode: 'edit', record: record1 });
      component['panelMode'].set('edit');

      expect(component.isRowHighlighted(record1)).toBeTrue();
      expect(component.isRowHighlighted(record2)).toBeFalse();

      component['panelData'].set({ mode: 'edit', record: record2 });

      expect(component.isRowHighlighted(record1)).toBeFalse();
      expect(component.isRowHighlighted(record2)).toBeTrue();
    });

    it('should maintain highlight during save until panel closes', () => {
      mockService.getQcDependencies.and.returnValue(of({
        data: [mockRecord],
        totalRecords: 1
      }));

      component['panelData'].set({ mode: 'edit', record: mockRecord });
      component['panelMode'].set('edit');
      component['panelOpen'].set(true);
      // Don't call detectChanges to avoid rendering side panel component

      expect(component.isRowHighlighted(mockRecord)).toBeTrue();

      component.onSaveSuccess();

      // Data reloads but panel data remains set until explicitly closed
      expect(component.isRowHighlighted(mockRecord)).toBeTrue();
    });
  });

  describe('Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('validateType', () => {
      it('should set error when type is empty', () => {
        component.selectedType.set('');

        component.validateType();

        expect(component.typeError()).toBe('Type is required');
      });

      it('should clear error when type is selected', () => {
        component.selectedType.set('EQUIP');

        component.validateType();

        expect(component.typeError()).toBe('');
      });


    });

    describe('validateEquipmentSupply', () => {
      it('should set error when equipment supply is empty', () => {
        component.selectedEquipmentSupply.set('');

        component.validateEquipmentSupply();

        expect(component.equipmentSupplyError()).toBe('Search is required');
      });

      it('should clear error when equipment supply is selected', () => {
        component.selectedEquipmentSupply.set('ES001');

        component.validateEquipmentSupply();

        expect(component.equipmentSupplyError()).toBe('');
      });


    });

    describe('onRetrieve', () => {
      it('should show both errors when type and equipment supply are empty', () => {
        component.selectedType.set('');
        component.selectedEquipmentSupply.set('');

        component.onRetrieve();

        expect(component.typeError()).toBe('Type is required');
        expect(component.equipmentSupplyError()).toBe('Search is required');
        expect(mockService.getQcDependencies).not.toHaveBeenCalled();
      });

      it('should show type error when only type is empty', () => {
        component.selectedType.set('');
        component.selectedEquipmentSupply.set('ES001');

        component.onRetrieve();

        expect(component.typeError()).toBe('Type is required');
        expect(component.equipmentSupplyError()).toBe('');
        expect(mockService.getQcDependencies).not.toHaveBeenCalled();
      });

      it('should show equipment supply error when only equipment supply is empty', () => {
        component.selectedType.set('EQUIP');
        component.selectedEquipmentSupply.set('');

        component.onRetrieve();

        expect(component.typeError()).toBe('');
        expect(component.equipmentSupplyError()).toBe('Search is required');
        expect(mockService.getQcDependencies).not.toHaveBeenCalled();
      });

      it('should clear errors and load data when both fields are valid', () => {
        mockService.getQcDependencies.and.returnValue(of({ data: [], totalRecords: 0 }));
        component.selectedType.set('EQUIP');
        component.selectedEquipmentSupply.set('ES001');

        component.onRetrieve();

        expect(component.typeError()).toBe('');
        expect(component.equipmentSupplyError()).toBe('');
        expect(mockService.getQcDependencies).toHaveBeenCalled();
      });
    });

    describe('onTypeChange', () => {
      it('should clear type error when type is selected', () => {
        component.typeError.set('Type is required');

        component.onTypeChange('EQUIP');

        expect(component.typeError()).toBe('');
      });

      it('should not clear error when empty type is selected', () => {
        component.typeError.set('Type is required');

        component.onTypeChange('');

        expect(component.typeError()).toBe('Type is required');
      });
    });

    describe('onEquipmentSupplyChange', () => {


      it('should not clear error when empty value is selected', () => {
        component.equipmentSupplyError.set('Search is required');

        component.onEquipmentSupplyChange('');

        expect(component.equipmentSupplyError()).toBe('Search is required');
      });
    });
  });
});
