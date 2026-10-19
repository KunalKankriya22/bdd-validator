import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { ReportMasterFilterPanel } from './report-master-filter-panel';
import { ReportMasterTableService } from '../services/report-master-table.service';
import { ReportMasterTableFilterLov } from '../models/report-master-table.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';

interface ReturnResult<T> {
  success?: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  data?: T[];
  item?: T;
  total?: number;
}

describe('ReportMasterFilterPanel', () => {
  let component: ReportMasterFilterPanel;
  let fixture: ComponentFixture<ReportMasterFilterPanel>;
  let mockService: jasmine.SpyObj<ReportMasterTableService>;

  const mockFilterData: ReportMasterTableFilterLov = {
    type: ['Type A', 'Type B', 'Type C'],
    chapterID: ['Chapter 1', 'Chapter 2', 'Chapter 3'],
    warehouse: ['WH-001', 'WH-002', 'WH-003'],
    warehouseName: ['Warehouse 1', 'Warehouse 2', 'Warehouse 3'],
    warehouseDisplay: ['WH-001 - Warehouse 1', 'WH-002 - Warehouse 2', 'WH-003 - Warehouse 3']
  };

  const mockFilterResponse: ReturnResult<ReportMasterTableFilterLov> = {
    success: true,
    data: [mockFilterData]
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('ReportMasterTableService', [
      'getReportMasterTableFilters'
    ]);
    mockService.getReportMasterTableFilters.and.returnValue(of(mockFilterResponse));



      TestBed.configureTestingModule({
      imports: [
        ReportMasterFilterPanel,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        TranslateModule.forRoot()],
      providers: [
        { provide: ReportMasterTableService, useValue: mockService }
      ]
    });


    


      mockService.getReportMasterTableFilters.calls.reset();


      mockService.getReportMasterTableFilters.and.returnValue(of(mockFilterResponse));


    fixture = TestBed.createComponent(ReportMasterFilterPanel);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize the form with null values', () => {
      fixture.detectChanges();

      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('chapterId')?.value).toBeNull();
      expect(component.filterForm.get('warehouse')?.value).toBeNull();
    });



    it('should populate filter options from service response', () => {
      fixture.detectChanges();

      expect(component.typeOptions).toEqual(['Type A', 'Type B', 'Type C']);
      expect(component.chapterOptions).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3']);
      expect(component.warehouseOptions).toEqual([
        { code: 'WH-001', label: 'WH-001 - Warehouse 1' },
        { code: 'WH-002', label: 'WH-002 - Warehouse 2' },
        { code: 'WH-003', label: 'WH-003 - Warehouse 3' }
      ]);
    });

    it('should handle empty data array in response', () => {
      const emptyResponse: ReturnResult<ReportMasterTableFilterLov> = {
        success: true,
        data: []
      };
      mockService.getReportMasterTableFilters.and.returnValue(of(emptyResponse));

      fixture.detectChanges();

      expect(component.typeOptions).toEqual([]);
      expect(component.chapterOptions).toEqual([]);
      expect(component.warehouseOptions).toEqual([]);
    });

    it('should handle undefined data in response', () => {
      const undefinedDataResponse: ReturnResult<ReportMasterTableFilterLov> = {
        success: true,
        data: undefined
      };
      mockService.getReportMasterTableFilters.and.returnValue(of(undefinedDataResponse));

      fixture.detectChanges();

      expect(component.typeOptions).toEqual([]);
      expect(component.chapterOptions).toEqual([]);
      expect(component.warehouseOptions).toEqual([]);
    });

    it('should handle missing properties in data', () => {
      const incompleteData: ReportMasterTableFilterLov = {
        type: [],
        chapterID: [],
        warehouse: [],
        warehouseName: [],
        warehouseDisplay: []
      };
      const incompleteResponse: ReturnResult<ReportMasterTableFilterLov> = {
        success: true,
        data: [incompleteData]
      };
      mockService.getReportMasterTableFilters.and.returnValue(of(incompleteResponse));

      fixture.detectChanges();

      expect(component.typeOptions).toEqual([]);
      expect(component.chapterOptions).toEqual([]);
      expect(component.warehouseOptions).toEqual([]);
    });

    it('should handle partial filter options', () => {
      const partialData: ReportMasterTableFilterLov = {
        type: ['Type A'],
        chapterID: [],
        warehouse: ['WH-001', 'WH-002'],
        warehouseName: ['Warehouse 1', 'Warehouse 2'],
        warehouseDisplay: ['WH-001 - Warehouse 1', 'WH-002 - Warehouse 2']
      };
      const partialResponse: ReturnResult<ReportMasterTableFilterLov> = {
        success: true,
        data: [partialData]
      };
      mockService.getReportMasterTableFilters.and.returnValue(of(partialResponse));

      fixture.detectChanges();

      expect(component.typeOptions).toEqual(['Type A']);
      expect(component.chapterOptions).toEqual([]);
      expect(component.warehouseOptions).toEqual([
        { code: 'WH-001', label: 'WH-001 - Warehouse 1' },
        { code: 'WH-002', label: 'WH-002 - Warehouse 2' }
      ]);
    });
  });

  describe('Form Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update form value when type is selected', () => {
      component.filterForm.get('type')?.setValue('Type A');

      expect(component.filterForm.get('type')?.value).toBe('Type A');
    });

    it('should update form value when chapterId is selected', () => {
      component.filterForm.get('chapterId')?.setValue('Chapter 1');

      expect(component.filterForm.get('chapterId')?.value).toBe('Chapter 1');
    });

    it('should update form value when warehouse is selected', () => {
      component.filterForm.get('warehouse')?.setValue('WH-001');

      expect(component.filterForm.get('warehouse')?.value).toBe('WH-001');
    });

    it('should allow multiple form fields to be set', () => {
      component.filterForm.patchValue({
        type: 'Type B',
        chapterId: 'Chapter 2',
        warehouse: 'WH-002'
      });

      expect(component.filterForm.value).toEqual({
        type: 'Type B',
        chapterId: 'Chapter 2',
        warehouse: 'WH-002',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });
  });




  describe('Template Bindings', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should render all three mat-select fields', () => {
      const selects = fixture.nativeElement.querySelectorAll('mat-select');
      expect(selects.length).toBe(3);
    });


  });



  describe('Edge Cases', () => {
    it('should handle response with success false', () => {
      const failureResponse: ReturnResult<ReportMasterTableFilterLov> = {
        success: false,
        message: 'Failed to load filters',
        data: []
      };
      mockService.getReportMasterTableFilters.and.returnValue(of(failureResponse));

      expect(() => {
        fixture.detectChanges();
      }).not.toThrow();

      expect(component.typeOptions).toEqual([]);
      expect(component.chapterOptions).toEqual([]);
      expect(component.warehouseOptions).toEqual([]);
    });



    it('should handle multiple filter items in data array (use first one)', () => {
      const multipleData: ReportMasterTableFilterLov[] = [
        {
          type: ['Type A', 'Type B'],
          chapterID: ['Chapter 1'],
          warehouse: ['WH-001'],
          warehouseName: ['Warehouse 1'],
          warehouseDisplay: ['WH-001 - Warehouse 1']
        },
        {
          type: ['Type X', 'Type Y'],
          chapterID: ['Chapter 99'],
          warehouse: ['WH-999'],
          warehouseName: ['Warehouse 999'],
          warehouseDisplay: ['WH-999 - Warehouse 999']
        }
      ];
      const multipleResponse: ReturnResult<ReportMasterTableFilterLov> = {
        success: true,
        data: multipleData
      };
      mockService.getReportMasterTableFilters.and.returnValue(of(multipleResponse));

      fixture.detectChanges();

      expect(component.typeOptions).toEqual(['Type A', 'Type B']);
      expect(component.chapterOptions).toEqual(['Chapter 1']);
      expect(component.warehouseOptions).toEqual([
        { code: 'WH-001', label: 'WH-001 - Warehouse 1' }
      ]);
    });

    it('should use warehouse code as label fallback when warehouseDisplay is missing', () => {
      const dataWithMissingDisplay: ReportMasterTableFilterLov = {
        type: [],
        chapterID: [],
        warehouse: ['WH-001', 'WH-002'],
        warehouseName: [],
        warehouseDisplay: ['WH-001 - Warehouse 1']
      };
      const response: ReturnResult<ReportMasterTableFilterLov> = {
        success: true,
        data: [dataWithMissingDisplay]
      };
      mockService.getReportMasterTableFilters.and.returnValue(of(response));

      fixture.detectChanges();

      expect(component.warehouseOptions).toEqual([
        { code: 'WH-001', label: 'WH-001 - Warehouse 1' },
        { code: 'WH-002', label: 'WH-002' }
      ]);
    });
  });

  describe('ngOnDestroy', () => {
    it('should stop search control subscriptions after destroy', () => {
      fixture.detectChanges();

      // Verify search filtering works before destroy
      component.typeSearchControl.setValue('Type A');
      expect(component.filteredTypeOptions).toEqual(['Type A']);

      // Destroy component
      component.ngOnDestroy();

      // Manually reset filtered options to prove subscription is dead
      component.filteredTypeOptions = [...component.typeOptions];

      // After destroy, search control changes should not update filteredTypeOptions
      component.typeSearchControl.setValue('Type B');
      expect(component.filteredTypeOptions).toEqual(['Type A', 'Type B', 'Type C']);
    });

    it('should stop chapter search subscriptions after destroy', () => {
      fixture.detectChanges();

      component.chapterSearchControl.setValue('Chapter 1');
      expect(component.filteredChapterOptions).toEqual(['Chapter 1']);

      component.ngOnDestroy();

      component.filteredChapterOptions = [...component.chapterOptions];
      component.chapterSearchControl.setValue('Chapter 2');
      expect(component.filteredChapterOptions).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3']);
    });

    it('should stop warehouse search subscriptions after destroy', () => {
      fixture.detectChanges();

      component.warehouseSearchControl.setValue('WH-001');
      expect(component.filteredWarehouseOptions.length).toBe(1);

      component.ngOnDestroy();

      component.filteredWarehouseOptions = [...component.warehouseOptions];
      component.warehouseSearchControl.setValue('WH-002');
      expect(component.filteredWarehouseOptions.length).toBe(3);
    });
  });

  describe('Search Controls', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter type options by search term', () => {
      component.typeSearchControl.setValue('Type A');
      expect(component.filteredTypeOptions).toEqual(['Type A']);
    });

    it('should filter type options case-insensitively', () => {
      component.typeSearchControl.setValue('type b');
      expect(component.filteredTypeOptions).toEqual(['Type B']);
    });

    it('should show all type options when search is empty', () => {
      component.typeSearchControl.setValue('Type A');
      component.typeSearchControl.setValue('');
      expect(component.filteredTypeOptions).toEqual(['Type A', 'Type B', 'Type C']);
    });

    it('should return empty when no type options match', () => {
      component.typeSearchControl.setValue('nonexistent');
      expect(component.filteredTypeOptions).toEqual([]);
    });

    it('should handle null search value for type', () => {
      component.typeSearchControl.setValue(null);
      expect(component.filteredTypeOptions).toEqual(['Type A', 'Type B', 'Type C']);
    });

    it('should filter chapter options by search term', () => {
      component.chapterSearchControl.setValue('Chapter 1');
      expect(component.filteredChapterOptions).toEqual(['Chapter 1']);
    });

    it('should filter chapter options case-insensitively', () => {
      component.chapterSearchControl.setValue('chapter 2');
      expect(component.filteredChapterOptions).toEqual(['Chapter 2']);
    });

    it('should show all chapter options when search is empty', () => {
      component.chapterSearchControl.setValue('Chapter 1');
      component.chapterSearchControl.setValue('');
      expect(component.filteredChapterOptions).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3']);
    });

    it('should return empty when no chapter options match', () => {
      component.chapterSearchControl.setValue('nonexistent');
      expect(component.filteredChapterOptions).toEqual([]);
    });

    it('should handle null search value for chapter', () => {
      component.chapterSearchControl.setValue(null);
      expect(component.filteredChapterOptions).toEqual(['Chapter 1', 'Chapter 2', 'Chapter 3']);
    });

    it('should filter warehouse options by code', () => {
      component.warehouseSearchControl.setValue('WH-001');
      expect(component.filteredWarehouseOptions).toEqual([
        { code: 'WH-001', label: 'WH-001 - Warehouse 1' }
      ]);
    });

    it('should filter warehouse options by label', () => {
      component.warehouseSearchControl.setValue('Warehouse 2');
      expect(component.filteredWarehouseOptions).toEqual([
        { code: 'WH-002', label: 'WH-002 - Warehouse 2' }
      ]);
    });

    it('should show all warehouse options when search is empty', () => {
      component.warehouseSearchControl.setValue('WH-001');
      component.warehouseSearchControl.setValue('');
      expect(component.filteredWarehouseOptions.length).toBe(3);
    });

    it('should return empty when no warehouse options match', () => {
      component.warehouseSearchControl.setValue('nonexistent');
      expect(component.filteredWarehouseOptions).toEqual([]);
    });

    it('should handle null search value for warehouse', () => {
      component.warehouseSearchControl.setValue(null);
      expect(component.filteredWarehouseOptions.length).toBe(3);
    });
  });

  describe('loadFilters with currentFilters', () => {
    it('should patch form with currentFilters after loading options', () => {
      const testDate = new Date(2024, 5, 15);
      component.currentFilters = {
        type: 'Type A',
        chapterId: 'Chapter 1',
        warehouse: 'WH-001',
        effectiveDatePeriod: 'After',
        effectiveDate: testDate,
        terminationDatePeriod: 'Before',
        terminationDate: testDate
      };

      fixture.detectChanges();

      expect(component.filterForm.get('type')?.value).toBe('Type A');
      expect(component.filterForm.get('chapterId')?.value).toBe('Chapter 1');
      expect(component.filterForm.get('warehouse')?.value).toBe('WH-001');
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('effectiveDate')?.value).toEqual(testDate);
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
      expect(component.filterForm.get('terminationDate')?.value).toEqual(testDate);
    });

    it('should not patch form when currentFilters is null', () => {
      component.currentFilters = null;
      fixture.detectChanges();

      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('chapterId')?.value).toBeNull();
      expect(component.filterForm.get('warehouse')?.value).toBeNull();
    });

    it('should initialize date period controls from currentFilters during form creation', () => {
      component.currentFilters = {
        type: null,
        chapterId: null,
        warehouse: null,
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(2024, 0, 1),
        terminationDatePeriod: 'Before',
        terminationDate: new Date(2024, 11, 31)
      };

      fixture.detectChanges();

      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBe('After');
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBe('Before');
    });
  });

  describe('Date Period Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set required error on effectiveDatePeriod when date has value but period is null', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date());

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.errors).toEqual({ required: true });
      expect(periodControl?.touched).toBe(true);
    });

    it('should clear effectiveDatePeriod errors when both date and period are set', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date());
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');

      const periodControl = component.filterForm.get('effectiveDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should clear effectiveDatePeriod errors when date is cleared', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date());
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toEqual({ required: true });

      component.filterForm.get('effectiveDate')?.setValue(null);
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
    });

    it('should set required error on terminationDatePeriod when date has value but period is null', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date());

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.errors).toEqual({ required: true });
      expect(periodControl?.touched).toBe(true);
    });

    it('should clear terminationDatePeriod errors when both date and period are set', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date());
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');

      const periodControl = component.filterForm.get('terminationDatePeriod');
      expect(periodControl?.errors).toBeNull();
    });

    it('should clear terminationDatePeriod errors when date is cleared', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date());
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toEqual({ required: true });

      component.filterForm.get('terminationDate')?.setValue(null);
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });

    it('should mark effectiveDate as touched on value change when not already touched', () => {
      const control = component.filterForm.get('effectiveDate');
      expect(control?.touched).toBe(false);

      control?.setValue(new Date());
      expect(control?.touched).toBe(true);
    });

    it('should mark terminationDate as touched on value change when not already touched', () => {
      const control = component.filterForm.get('terminationDate');
      expect(control?.touched).toBe(false);

      control?.setValue(new Date());
      expect(control?.touched).toBe(true);
    });

    it('should trigger effectiveDatePeriod validation when period value changes', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date());
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toEqual({ required: true });

      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
    });

    it('should trigger terminationDatePeriod validation when period value changes', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date());
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toEqual({ required: true });

      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });
  });

  describe('onApply', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit filters when form is valid and has values', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        type: 'Type A',
        chapterId: 'Chapter 1',
        warehouse: 'WH-001'
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        type: 'Type A',
        chapterId: 'Chapter 1',
        warehouse: 'WH-001',
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });

    it('should emit with date values when dates are valid', () => {
      spyOn(component.apply, 'emit');
      const testDate = new Date(2024, 5, 15);

      component.filterForm.patchValue({
        type: 'Type A',
        effectiveDatePeriod: 'After',
        effectiveDate: testDate,
        terminationDatePeriod: 'Before',
        terminationDate: testDate
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        type: 'Type A',
        chapterId: null,
        warehouse: null,
        effectiveDatePeriod: 'After',
        effectiveDate: testDate,
        terminationDatePeriod: 'Before',
        terminationDate: testDate
      });
    });

    it('should not emit when effectiveDate has errors', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when terminationDate has errors', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when effectiveDatePeriod has required error', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('effectiveDate')?.setValue(new Date());
      // This triggers validateEffectiveDatePeriod which sets required error on period

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should not emit when terminationDatePeriod has required error', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.get('terminationDate')?.setValue(new Date());

      component.onApply();

      expect(component.apply.emit).not.toHaveBeenCalled();
    });

    it('should mark all date controls as touched when validation fails', () => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      component.onApply();

      expect(component.filterForm.get('effectiveDate')?.touched).toBe(true);
      expect(component.filterForm.get('terminationDate')?.touched).toBe(true);
      expect(component.filterForm.get('effectiveDatePeriod')?.touched).toBe(true);
      expect(component.filterForm.get('terminationDatePeriod')?.touched).toBe(true);
    });

    it('should convert empty string fields to null in emitted filters', () => {
      spyOn(component.apply, 'emit');

      component.filterForm.patchValue({
        type: '',
        chapterId: '',
        warehouse: '',
        effectiveDatePeriod: '',
        effectiveDate: null,
        terminationDatePeriod: '',
        terminationDate: null
      });

      component.onApply();

      expect(component.apply.emit).toHaveBeenCalledWith({
        type: null,
        chapterId: null,
        warehouse: null,
        effectiveDatePeriod: null,
        effectiveDate: null,
        terminationDatePeriod: null,
        terminationDate: null
      });
    });
  });

  describe('onClear', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form values to null', () => {
      component.filterForm.patchValue({
        type: 'Type A',
        chapterId: 'Chapter 1',
        warehouse: 'WH-001',
        effectiveDatePeriod: 'After',
        effectiveDate: new Date(),
        terminationDatePeriod: 'Before',
        terminationDate: new Date()
      });

      component.onClear();

      expect(component.filterForm.get('type')?.value).toBeNull();
      expect(component.filterForm.get('chapterId')?.value).toBeNull();
      expect(component.filterForm.get('warehouse')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('effectiveDate')?.value).toBeNull();
      expect(component.filterForm.get('terminationDatePeriod')?.value).toBeNull();
      expect(component.filterForm.get('terminationDate')?.value).toBeNull();
    });

    it('should clear effectiveDatePeriod errors', () => {
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });

      component.onClear();

      expect(component.filterForm.get('effectiveDatePeriod')?.errors).toBeNull();
    });

    it('should clear terminationDatePeriod errors', () => {
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });

      component.onClear();

      expect(component.filterForm.get('terminationDatePeriod')?.errors).toBeNull();
    });
  });

  describe('onClose', () => {
    it('should emit close event', () => {
      fixture.detectChanges();
      spyOn(component.close, 'emit');

      component.onClose();

      expect(component.close.emit).toHaveBeenCalled();
    });
  });

  describe('isApplyDisabled', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when no fields have values', () => {
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return false when type has a value', () => {
      component.filterForm.get('type')?.setValue('Type A');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when chapterId has a value', () => {
      component.filterForm.get('chapterId')?.setValue('Chapter 1');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when warehouse has a value', () => {
      component.filterForm.get('warehouse')?.setValue('WH-001');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when effectiveDate has a value with valid period', () => {
      component.filterForm.get('effectiveDate')?.setValue(new Date());
      component.filterForm.get('effectiveDatePeriod')?.setValue('After');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return false when terminationDate has a value with valid period', () => {
      component.filterForm.get('terminationDate')?.setValue(new Date());
      component.filterForm.get('terminationDatePeriod')?.setValue('Before');
      expect(component.isApplyDisabled).toBe(false);
    });

    it('should return true when has value but effectiveDate has errors', () => {
      component.filterForm.get('type')?.setValue('Type A');
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when has value but terminationDate has errors', () => {
      component.filterForm.get('type')?.setValue('Type A');
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when has value but effectiveDatePeriod has errors', () => {
      component.filterForm.get('type')?.setValue('Type A');
      component.filterForm.get('effectiveDatePeriod')?.setErrors({ required: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when has value but terminationDatePeriod has errors', () => {
      component.filterForm.get('type')?.setValue('Type A');
      component.filterForm.get('terminationDatePeriod')?.setErrors({ required: true });
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when type is empty string', () => {
      component.filterForm.get('type')?.setValue('');
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when chapterId is empty string', () => {
      component.filterForm.get('chapterId')?.setValue('');
      expect(component.isApplyDisabled).toBe(true);
    });

    it('should return true when warehouse is empty string', () => {
      component.filterForm.get('warehouse')?.setValue('');
      expect(component.isApplyDisabled).toBe(true);
    });
  });

  describe('onEffectiveDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark control as dirty and touched', () => {
      const event = { target: { value: '15-JUN-2024' } } as unknown as Event;

      component.onEffectiveDateInput(event);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.dirty).toBe(true);
      expect(control?.touched).toBe(true);
    });

    it('should set invalidDateFormat error when input has value but control value is null', fakeAsync(() => {
      const event = { target: { value: 'invalid-date' } } as unknown as Event;

      component.onEffectiveDateInput(event);
      tick(0);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
    }));

    it('should not set invalidDateFormat error when input value is empty', fakeAsync(() => {
      const event = { target: { value: '' } } as unknown as Event;

      component.onEffectiveDateInput(event);
      tick(0);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));

    it('should not set invalidDateFormat error when control has a valid value', fakeAsync(() => {
      const testDate = new Date(2024, 5, 15);
      component.filterForm.get('effectiveDate')?.setValue(testDate);

      const event = { target: { value: '15-JUN-2024' } } as unknown as Event;

      component.onEffectiveDateInput(event);
      tick(0);

      const control = component.filterForm.get('effectiveDate');
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));

    it('should handle input with whitespace only', fakeAsync(() => {
      const event = { target: { value: '   ' } } as unknown as Event;

      component.onEffectiveDateInput(event);
      tick(0);

      const control = component.filterForm.get('effectiveDate');
      // Trimmed value is empty, so no invalidDateFormat error
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format valid date and update input value', fakeAsync(() => {
      const testDate = new Date(2024, 5, 15);
      component.filterForm.get('effectiveDate')?.setValue(testDate);

      const input = { value: '15-JUN-2024' } as HTMLInputElement;
      spyOn(DateFieldValidationUtility, 'formatDateForUI').and.returnValue('15-JUN-2024');

      component.onEffectiveDateBlur(input);
      tick(0);

      expect(DateFieldValidationUtility.formatDateForUI).toHaveBeenCalledWith(testDate);
      expect(input.value).toBe('15-JUN-2024');
      expect(component.filterForm.get('effectiveDate')?.errors).toBeNull();
    }));

    it('should restore raw input and set error for invalid date', fakeAsync(() => {
      // Simulate typing invalid text first
      const inputEvent = { target: { value: 'bad-date' } } as unknown as Event;
      component.onEffectiveDateInput(inputEvent);
      tick(0);

      const input = { value: 'bad-date' } as HTMLInputElement;

      component.onEffectiveDateBlur(input);
      tick(0);

      expect(input.value).toBe('bad-date');
      expect(component.filterForm.get('effectiveDate')?.errors).toEqual({ invalidDateFormat: true });
    }));

    it('should clear errors when input is empty', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      const input = { value: '' } as HTMLInputElement;

      component.onEffectiveDateBlur(input);
      tick(0);

      expect(component.filterForm.get('effectiveDate')?.errors).toBeNull();
    }));

    it('should clear errors when input has only whitespace', fakeAsync(() => {
      component.filterForm.get('effectiveDate')?.setErrors({ invalidDateFormat: true });

      const input = { value: '   ' } as HTMLInputElement;

      component.onEffectiveDateBlur(input);
      tick(0);

      expect(component.filterForm.get('effectiveDate')?.errors).toBeNull();
    }));

    it('should mark control as touched', fakeAsync(() => {
      const input = { value: '' } as HTMLInputElement;

      component.onEffectiveDateBlur(input);
      tick(0);

      expect(component.filterForm.get('effectiveDate')?.touched).toBe(true);
    }));
  });

  describe('onTerminationDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark control as dirty and touched', () => {
      const event = { target: { value: '15-JUN-2024' } } as unknown as Event;

      component.onTerminationDateInput(event);

      const control = component.filterForm.get('terminationDate');
      expect(control?.dirty).toBe(true);
      expect(control?.touched).toBe(true);
    });

    it('should set invalidDateFormat error when input has value but control value is null', fakeAsync(() => {
      const event = { target: { value: 'invalid-date' } } as unknown as Event;

      component.onTerminationDateInput(event);
      tick(0);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(true);
    }));

    it('should not set invalidDateFormat error when input value is empty', fakeAsync(() => {
      const event = { target: { value: '' } } as unknown as Event;

      component.onTerminationDateInput(event);
      tick(0);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));

    it('should not set invalidDateFormat error when control has a valid value', fakeAsync(() => {
      const testDate = new Date(2024, 5, 15);
      component.filterForm.get('terminationDate')?.setValue(testDate);

      const event = { target: { value: '15-JUN-2024' } } as unknown as Event;

      component.onTerminationDateInput(event);
      tick(0);

      const control = component.filterForm.get('terminationDate');
      expect(control?.hasError('invalidDateFormat')).toBe(false);
    }));
  });

  describe('onTerminationDateBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format valid date and update input value', fakeAsync(() => {
      const testDate = new Date(2024, 5, 15);
      component.filterForm.get('terminationDate')?.setValue(testDate);

      const input = { value: '15-JUN-2024' } as HTMLInputElement;
      spyOn(DateFieldValidationUtility, 'formatDateForUI').and.returnValue('15-JUN-2024');

      component.onTerminationDateBlur(input);
      tick(0);

      expect(DateFieldValidationUtility.formatDateForUI).toHaveBeenCalledWith(testDate);
      expect(input.value).toBe('15-JUN-2024');
      expect(component.filterForm.get('terminationDate')?.errors).toBeNull();
    }));

    it('should restore raw input and set error for invalid date', fakeAsync(() => {
      const inputEvent = { target: { value: 'bad-date' } } as unknown as Event;
      component.onTerminationDateInput(inputEvent);
      tick(0);

      const input = { value: 'bad-date' } as HTMLInputElement;

      component.onTerminationDateBlur(input);
      tick(0);

      expect(input.value).toBe('bad-date');
      expect(component.filterForm.get('terminationDate')?.errors).toEqual({ invalidDateFormat: true });
    }));

    it('should clear errors when input is empty', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });

      const input = { value: '' } as HTMLInputElement;

      component.onTerminationDateBlur(input);
      tick(0);

      expect(component.filterForm.get('terminationDate')?.errors).toBeNull();
    }));

    it('should clear errors when input has only whitespace', fakeAsync(() => {
      component.filterForm.get('terminationDate')?.setErrors({ invalidDateFormat: true });

      const input = { value: '   ' } as HTMLInputElement;

      component.onTerminationDateBlur(input);
      tick(0);

      expect(component.filterForm.get('terminationDate')?.errors).toBeNull();
    }));

    it('should mark control as touched', fakeAsync(() => {
      const input = { value: '' } as HTMLInputElement;

      component.onTerminationDateBlur(input);
      tick(0);

      expect(component.filterForm.get('terminationDate')?.touched).toBe(true);
    }));
  });
});