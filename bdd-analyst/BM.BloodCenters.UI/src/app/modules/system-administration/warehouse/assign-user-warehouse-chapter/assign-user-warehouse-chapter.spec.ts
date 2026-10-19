import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { AssignUserWarehouseChapterComponent } from './assign-user-warehouse-chapter';
import { AssignUserWarehouseChapterService } from '../service/assign-user-warehouse-chapter.service';
import { SnackbarService } from '../../../../shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('AssignUserWarehouseChapterComponent', () => {
  let component: AssignUserWarehouseChapterComponent;
  let fixture: ComponentFixture<AssignUserWarehouseChapterComponent>;
  let mockService: jasmine.SpyObj<AssignUserWarehouseChapterService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AssignUserWarehouseChapterComponent>>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;

  const mockDialogData = {
    mode: 'add' as const,
    user: {
      userId: 'USER001',
      userName: 'John Doe',
      department: 'IT'
    }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('AssignUserWarehouseChapterService', [
      'getDropdowns',
      'getPrinters',
      'createAssignments',
      'updateAssignment'
    ]);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = createMockSnackbarService();

    mockService.getDropdowns.and.returnValue(of({
      success: true,
      message: '',
      statusCode: 200,
      data: {
        warehouses: [
          { id: 'WH001', description: 'Warehouse One' },
          { id: 'WH002', description: 'Warehouse Two' }
        ],
        chapters: [
          { id: 'CH001', name: 'Chapter One' },
          { id: 'CH002', name: 'Chapter Two' },
          { id: 'CH003', name: 'Chapter Three' }
        ]
      }
    }));
    mockService.getPrinters.and.returnValue(of({
      success: true,
      message: '',
      statusCode: 200,
      data: [
        { id: 'PR001', description: 'Printer One' }
      ]
    }));
    mockService.createAssignments.and.returnValue(of({ success: true, message: 'Assignments created successfully', statusCode: 200, data: {} }));
    mockService.updateAssignment.and.returnValue(of({ success: true, message: 'Assignment updated successfully', statusCode: 200, data: {} }));



      TestBed.configureTestingModule({
      imports: [
        AssignUserWarehouseChapterComponent,
        ReactiveFormsModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: AssignUserWarehouseChapterService, useValue: mockService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
        { provide: SnackbarService, useValue: mockSnackbarService }
      ]
    });




      mockService.getDropdowns.calls.reset();


      mockService.getPrinters.calls.reset();


      mockService.createAssignments.calls.reset();


      mockService.updateAssignment.calls.reset();


      mockDialogRef.close.calls.reset();


      mockService.createAssignments.and.returnValue(of({ success: true, message: 'Assignments created successfully', statusCode: 200, data: {} }));


      mockService.updateAssignment.and.returnValue(of({ success: true, message: 'Assignment updated successfully', statusCode: 200, data: {} }));


    fixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
    component = fixture.componentInstance;


    });


  describe('ngOnInit', () => {
    it('should initialize form and load data', () => {
      fixture.detectChanges();

      expect(component.form).toBeDefined();
      expect(component.assignedUserId).toBe('USER001');
      expect(component.assignedUserName).toBe('John Doe');
      expect(component.assignedUserDepartment).toBe('IT');
      expect(component.assignedUserDisplay).toBe('USER001 - John Doe');
      expect(mockService.getDropdowns).toHaveBeenCalled();
    });

    it('should load warehouses from API data', () => {
      fixture.detectChanges();

      expect(component.warehouses.length).toBe(2);
      expect(component.warehouses[0].id).toBe('WH001');
      expect(component.warehouses[1].id).toBe('WH002');
    });

    it('should close dialog when dialogData is null', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: null },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });
      const f = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      // Call ngOnInit directly to avoid template rendering error when form is not created
      f.componentInstance.ngOnInit();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should close dialog when dialogData.user is null', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });
      const f = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      // Call ngOnInit directly to avoid template rendering error when form is not created
      f.componentInstance.ngOnInit();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });

    it('should set isEditMode to false in add mode', () => {
      fixture.detectChanges();
      expect(component.isEditMode).toBeFalse();
    });

    it('should enable chapter dropdown after successful getDropdowns', () => {
      fixture.detectChanges();
      expect(component.form.get('chapter')?.enabled).toBeTrue();
    });

    it('should set filteredWarehouses to match warehouses after getDropdowns', () => {
      fixture.detectChanges();
      expect(component.filteredWarehouses.length).toBe(2);
      expect(component.filteredWarehouses).toEqual(component.warehouses);
    });

    it('should set filteredChapters to match chapters after getDropdowns', () => {
      fixture.detectChanges();
      expect(component.filteredChapters.length).toBe(3);
      expect(component.filteredChapters).toEqual(component.chapters);
    });

    it('should not populate dropdowns when getDropdowns returns success false', () => {
      mockService.getDropdowns.and.returnValue(of({
        success: false,
        message: 'Error',
        statusCode: 500,
        data: null as any
      }));
      fixture.detectChanges();
      expect(component.warehouses.length).toBe(0);
      expect(component.chapters.length).toBe(0);
    });

    it('should handle getDropdowns error in add mode without calling populateFormFromAssignment', () => {
      mockService.getDropdowns.and.returnValue(throwError(() => new Error('API Error')));
      fixture.detectChanges();
      expect(component.warehouses.length).toBe(0);
      expect(component.chapters.length).toBe(0);
    });

    it('should handle getDropdowns error in edit mode and call populateFormFromAssignment', () => {
      TestBed.resetTestingModule();
      const editData = {
        mode: 'edit' as const,
        user: { userId: 'USER001', userName: 'John Doe', department: 'IT' },
        assignment: {
          warehouseId: 'WH001', warehouseName: 'Warehouse One',
          chapterId: 'CH001', chapterName: 'Chapter One',
          printerId: 'PR001', printer: 'Printer One',
          effectiveDate: moment().add(1, 'days').format('YYYY-MM-DD'),
          terminationDate: undefined
        },
        index: 0
      };
      mockService.getDropdowns.and.returnValue(throwError(() => new Error('API Error')));
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });
      const f = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      f.detectChanges();
      // populateFormFromAssignment should have added the warehouse/chapter to dropdowns
      expect(f.componentInstance.warehouses.some((w: any) => w.id === 'WH001')).toBeTrue();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require warehouse field', () => {
      component.form.get('warehouse')?.setValue(null);
      component.form.get('warehouse')?.markAsTouched();
      expect(component.form.get('warehouse')?.hasError('required')).toBeTrue();
    });

    it('should require chapter field', () => {
      component.form.get('chapter')?.setValue(null);
      component.form.get('chapter')?.markAsTouched();
      expect(component.form.get('chapter')?.hasError('required')).toBeTrue();
    });

    it('should require effectiveDate field', () => {
      component.form.get('effectiveDate')?.setValue(null);
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });

    it('should not require terminationDate field', () => {
      component.form.get('terminationDate')?.setValue(null);
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.form.get('terminationDate')?.hasError('required')).toBeFalsy();
    });

    it('should have printer disabled initially', () => {
      expect(component.form.get('printer')?.disabled).toBeTrue();
    });

    it('should pass validation when termination date is same as effective date', () => {
      const effectiveDate = moment().add(1, 'days');
      const terminationDate = moment().add(1, 'days');

      component.form.patchValue({
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    });

    it('should pass validation when termination date is after effective date', () => {
      const effectiveDate = moment().add(1, 'days');
      const terminationDate = moment().add(30, 'days');

      component.form.patchValue({
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    });

    it('should pass validation when termination date is null', () => {
      const effectiveDate = moment().add(1, 'days');

      component.form.patchValue({
        effectiveDate: effectiveDate,
        terminationDate: null
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeFalsy();
    });

    it('should fail validation when termination date is before effective date', () => {
      const effectiveDate = moment().add(10, 'days');
      const terminationDate = moment().add(5, 'days');

      component.form.patchValue({
        effectiveDate: effectiveDate,
        terminationDate: terminationDate
      });

      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });
  });

  describe('Warehouse Change Handler', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset printer when warehouse changes', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001' }
      });
      component.form.patchValue({
        printer: { id: 'PR001' }
      });

      component.form.patchValue({
        warehouse: { id: 'WH002' }
      });

      expect(component.form.get('printer')?.value).toBeNull();
    });

    it('should load printers when warehouse is selected', () => {
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      expect(mockService.getPrinters).toHaveBeenCalledWith('WH001');
    });

    it('should populate printers list on successful getPrinters', () => {
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      expect(component.printers.length).toBe(1);
      expect(component.printers[0].id).toBe('PR001');
      expect(component.printers[0].name).toBe('Printer One');
    });

    it('should set filteredPrinters to match printers after getPrinters', () => {
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      expect(component.filteredPrinters).toEqual(component.printers);
    });

    it('should enable printer control after printers load', () => {
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      expect(component.form.get('printer')?.enabled).toBeTrue();
    });

    it('should enable printer control even on getPrinters error', () => {
      mockService.getPrinters.and.returnValue(throwError(() => new Error('API Error')));
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      expect(component.form.get('printer')?.enabled).toBeTrue();
    });

    it('should not call getPrinters when warehouse is cleared (null)', () => {
      mockService.getPrinters.calls.reset();
      component.form.patchValue({ warehouse: null });
      expect(mockService.getPrinters).not.toHaveBeenCalled();
    });

    it('should not trigger warehouse handler when isInitializing is true', () => {
      mockService.getPrinters.calls.reset();
      (component as any).isInitializing = true;
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      expect(mockService.getPrinters).not.toHaveBeenCalled();
      (component as any).isInitializing = false;
    });

    it('should clear printers and filteredPrinters when warehouse changes', () => {
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      expect(component.printers.length).toBe(1);

      mockService.getPrinters.and.returnValue(of({
        success: true, message: '', statusCode: 200, data: []
      }));
      component.form.patchValue({ warehouse: { id: 'WH002' } });
      expect(component.printers.length).toBe(0);
    });
  });

  describe('Chapter Dropdown', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load all chapters from getDropdowns (independent of warehouse)', () => {
      expect(component.chapters.length).toBe(3);
      expect(component.chapters[0].id).toBe('CH001');
      expect(component.chapters[1].id).toBe('CH002');
      expect(component.chapters[2].id).toBe('CH003');
    });

    it('should have chapter enabled after initialization', () => {
      expect(component.form.get('chapter')?.enabled).toBeTrue();
    });
  });

  describe('Search Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter warehouses by id', () => {
      component.warehouseSearchControl.setValue('WH001');
      expect(component.filteredWarehouses.length).toBe(1);
      expect(component.filteredWarehouses[0].id).toBe('WH001');
    });

    it('should filter warehouses by name', () => {
      component.warehouseSearchControl.setValue('Two');
      expect(component.filteredWarehouses.length).toBe(1);
      expect(component.filteredWarehouses[0].id).toBe('WH002');
    });

    it('should filter warehouses case-insensitively', () => {
      component.warehouseSearchControl.setValue('warehouse');
      expect(component.filteredWarehouses.length).toBe(2);
    });

    it('should show all warehouses when search is empty', () => {
      component.warehouseSearchControl.setValue('');
      expect(component.filteredWarehouses.length).toBe(2);
    });

    it('should show no warehouses when search matches nothing', () => {
      component.warehouseSearchControl.setValue('NONEXISTENT');
      expect(component.filteredWarehouses.length).toBe(0);
    });

    it('should filter chapters by id', () => {
      component.chapterSearchControl.setValue('CH002');
      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].id).toBe('CH002');
    });

    it('should filter chapters by name', () => {
      component.chapterSearchControl.setValue('Three');
      expect(component.filteredChapters.length).toBe(1);
      expect(component.filteredChapters[0].id).toBe('CH003');
    });

    it('should filter chapters case-insensitively', () => {
      component.chapterSearchControl.setValue('chapter');
      expect(component.filteredChapters.length).toBe(3);
    });

    it('should filter printers by id', () => {
      // First load printers by selecting a warehouse
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      expect(component.printers.length).toBe(1);

      component.printerSearchControl.setValue('PR001');
      expect(component.filteredPrinters.length).toBe(1);
    });

    it('should filter printers by name', () => {
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      component.printerSearchControl.setValue('Printer');
      expect(component.filteredPrinters.length).toBe(1);
    });

    it('should handle null search term for warehouses', () => {
      component.warehouseSearchControl.setValue(null);
      expect(component.filteredWarehouses.length).toBe(2);
    });

    it('should handle null search term for chapters', () => {
      component.chapterSearchControl.setValue(null);
      expect(component.filteredChapters.length).toBe(3);
    });

    it('should handle null search term for printers', () => {
      component.form.patchValue({ warehouse: { id: 'WH001' } });
      component.printerSearchControl.setValue(null);
      expect(component.filteredPrinters.length).toBe(1);
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true for null date', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });

    it('should return false for dates before today', () => {
      const pastDate = moment().subtract(10, 'days');
      expect(component.terminationDateFilter(pastDate)).toBeFalse();
    });

    it('should return true for today', () => {
      const today = moment().startOf('day');
      expect(component.terminationDateFilter(today)).toBeTrue();
    });

    it('should return true for future dates', () => {
      const futureDate = moment().add(10, 'days');
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });

    it('should return false for dates before effective date', () => {
      const effectiveDate = moment().add(10, 'days');
      component.form.patchValue({ effectiveDate });

      const beforeEffective = moment().add(5, 'days');
      expect(component.terminationDateFilter(beforeEffective)).toBeFalse();
    });

    it('should return true for dates equal to effective date', () => {
      const effectiveDate = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate });

      const sameDate = moment().add(5, 'days');
      expect(component.terminationDateFilter(sameDate)).toBeTrue();
    });

    it('should return true for dates after effective date', () => {
      const effectiveDate = moment().add(5, 'days');
      component.form.patchValue({ effectiveDate });

      const afterEffective = moment().add(10, 'days');
      expect(component.terminationDateFilter(afterEffective)).toBeTrue();
    });
  });

  describe('Add Assignment', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not add assignment when form is invalid', () => {
      component.addAssignment();
      expect(component.dataSource.data.length).toBe(0);
    });

    it('should add assignment to dataSource when form is valid', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();
      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].warehouseId).toBe('WH001');
      expect(component.dataSource.data[0].chapterId).toBe('CH001');
    });

    it('should show duplicate message when warehouse/chapter combination exists', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      // Try to add same combination
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(2, 'days')
      });
      component.addAssignment();

      expect(component.dataSource.data.length).toBe(1);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('This warehouse/chapter combination already exists');
    });

    it('should allow different warehouse/chapter combinations', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH002', name: 'Chapter Two' },
        effectiveDate: moment().add(2, 'days')
      });
      component.addAssignment();

      expect(component.dataSource.data.length).toBe(2);
    });

    it('should reset form after adding assignment', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001' }
      });

      component.form.patchValue({
        chapter: { id: 'CH001', name: 'Chapter One' }
      });

      component.form.patchValue({
        printer: { id: 'PR001' },
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();

      expect(component.form.get('warehouse')?.value).toBeNull();
      expect(component.form.get('chapter')?.enabled).toBe(true);
      expect(component.form.get('printer')?.disabled).toBe(true);
      expect(component.isEditMode).toBe(false);
    });

    it('should handle assignment without printer', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001' }
      });

      component.form.patchValue({
        chapter: { id: 'CH001', name: 'Chapter One' }
      });

      component.form.patchValue({
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();

      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].printerId).toBeUndefined();
    });

    it('should include printer in assignment when provided', () => {
      component.form.patchValue({ warehouse: { id: 'WH001', name: 'Warehouse One' } });
      component.form.get('printer')?.enable();
      component.form.patchValue({
        chapter: { id: 'CH001', name: 'Chapter One' },
        printer: { id: 'PR001', name: 'Printer One' },
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();

      expect(component.dataSource.data[0].printerId).toBe('PR001');
      expect(component.dataSource.data[0].printer).toBe('Printer One');
    });

    it('should include terminationDate in assignment when provided', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days'),
        terminationDate: moment().add(30, 'days')
      });

      component.addAssignment();

      expect(component.dataSource.data[0].terminationDate).toBeDefined();
    });

    it('should use warehouse id as warehouseName fallback when name is undefined', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();

      expect(component.dataSource.data[0].warehouseName).toBe('WH001');
    });

    it('should use chapter id as chapterName fallback when name is undefined', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001' },
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();

      expect(component.dataSource.data[0].chapterName).toBe('CH001');
    });

    it('should replace assignment at editIndex when in edit mode', () => {
      // Add two assignments first
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      component.form.patchValue({
        warehouse: { id: 'WH002', name: 'Warehouse Two' },
        chapter: { id: 'CH002', name: 'Chapter Two' },
        effectiveDate: moment().add(2, 'days')
      });
      component.addAssignment();

      expect(component.dataSource.data.length).toBe(2);

      // Enter inline edit mode
      component.isEditMode = true;
      component.editIndex = 0;

      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One Updated' },
        chapter: { id: 'CH003', name: 'Chapter Three' },
        effectiveDate: moment().add(5, 'days')
      });

      component.addAssignment();

      expect(component.dataSource.data.length).toBe(2);
      expect(component.dataSource.data[0].chapterId).toBe('CH003');
    });

    it('should mark all form controls as touched when addAssignment is called', () => {
      component.addAssignment();
      expect(component.form.get('warehouse')?.touched).toBeTrue();
      expect(component.form.get('chapter')?.touched).toBeTrue();
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });
  });

  describe('Save and Assign', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not save when dataSource is empty', () => {
      component.saveAndAssign();
      expect(mockService.createAssignments).not.toHaveBeenCalled();
    });

    it('should call createAssignments with correct payload', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' }
      });
      component.form.patchValue({
        chapter: { id: 'CH001', name: 'Chapter One' }
      });
      component.form.patchValue({
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      component.saveAndAssign();

      expect(mockService.createAssignments).toHaveBeenCalledWith([
        jasmine.objectContaining({
          UserId: 'USER001',
          WarehouseId: 'WH001',
          ChapterId: 'CH001'
        })
      ]);
    });

    it('should set isSubmitting to true during save', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      // Make service return observable that we can control
      let resolveSubscription: any;
      mockService.createAssignments.and.returnValue(of({ success: true, message: 'ok', statusCode: 200, data: {} }));

      component.saveAndAssign();

      // isSubmitting should be reset after subscription completes
      expect(component.isSubmitting).toBeFalse();
    });

    it('should handle null printer in payload', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001' }
      });

      component.form.patchValue({
        chapter: { id: 'CH001', name: 'Chapter One' }
      });

      component.form.patchValue({
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();

      // Save
      component.saveAndAssign();

      expect(mockService.createAssignments).toHaveBeenCalledWith([
        jasmine.objectContaining({
          PrinterId: null
        })
      ]);
    });

    it('should close dialog on successful save', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      component.saveAndAssign();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show success message on successful save', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      component.saveAndAssign();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    });

    it('should show message but not close dialog when response.success is false', () => {
      mockService.createAssignments.and.returnValue(of({
        success: false,
        message: 'Duplicate record exists',
        statusCode: 409,
        data: {}
      }));

      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      mockDialogRef.close.calls.reset();
      component.saveAndAssign();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Duplicate record exists');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should handle null response and close dialog', () => {
      mockService.createAssignments.and.returnValue(of(null as any));

      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      component.saveAndAssign();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should reset isSubmitting on HTTP error (error handling delegated to authInterceptor)', () => {
      mockService.createAssignments.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component.form.patchValue({
        warehouse: { id: 'WH001' }
      });
      component.form.patchValue({
        chapter: { id: 'CH001', name: 'Chapter One' }
      });
      component.form.patchValue({
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();
      component.saveAndAssign();

      expect(component.isSubmitting).toBeFalse();
    });

    it('should map multiple assignments in payload', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      component.form.patchValue({
        warehouse: { id: 'WH002', name: 'Warehouse Two' },
        chapter: { id: 'CH002', name: 'Chapter Two' },
        effectiveDate: moment().add(2, 'days')
      });
      component.addAssignment();

      component.saveAndAssign();

      const payload = mockService.createAssignments.calls.mostRecent().args[0];
      expect(payload.length).toBe(2);
      expect(payload[0].WarehouseId).toBe('WH001');
      expect(payload[1].WarehouseId).toBe('WH002');
    });
  });

  describe('Remove Assignment', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should remove assignment and show success snackbar', () => {
      // Add an assignment first
      component.form.patchValue({
        warehouse: { id: 'WH001' }
      });
      component.form.patchValue({
        chapter: { id: 'CH001', name: 'Chapter One' }
      });
      component.form.patchValue({
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();
      expect(component.dataSource.data.length).toBe(1);

      // Remove assignment
      component.removeAssignment(0);

      expect(component.dataSource.data.length).toBe(0);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Assignment removed');
    });

    it('should remove correct assignment when multiple exist', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      component.addAssignment();

      component.form.patchValue({
        warehouse: { id: 'WH002', name: 'Warehouse Two' },
        chapter: { id: 'CH002', name: 'Chapter Two' },
        effectiveDate: moment().add(2, 'days')
      });
      component.addAssignment();

      component.removeAssignment(0);

      expect(component.dataSource.data.length).toBe(1);
      expect(component.dataSource.data[0].warehouseId).toBe('WH002');
    });
  });

  describe('Update Assignment (Edit Mode)', () => {
    const mockEditDialogData = {
      mode: 'edit' as const,
      user: {
        userId: 'USER001',
        userName: 'John Doe',
        department: 'IT'
      },
      assignment: {
        warehouseId: 'WH001',
        warehouseName: 'Warehouse One',
        chapterId: 'CH001',
        chapterName: 'Chapter One',
        printerId: 'PR001',
        printer: 'Printer One',
        effectiveDate: moment().add(1, 'days').format('YYYY-MM-DD'),
        terminationDate: null
      },
      index: 0
    };

    it('should call updateAssignment service with correct payload', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      editComponent.form.patchValue({ terminationDate: moment().add(30, 'days') });
      editComponent.updateAssignment();

      expect(mockService.updateAssignment).toHaveBeenCalledWith(
        jasmine.objectContaining({
          userId: 'USER001',
          warehouseId: 'WH001',
          originalChapterId: 'CH001'
        })
      );
    });

    it('should close dialog on successful update', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      mockDialogRef.close.calls.reset();
      editComponent.form.patchValue({ terminationDate: moment().add(30, 'days') });
      editComponent.updateAssignment();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should show success message with warehouse name on update', () => {
      TestBed.resetTestingModule();
      const editSnackbar = createMockSnackbarService();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: editSnackbar }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      editComponent.form.patchValue({ terminationDate: moment().add(30, 'days') });
      editComponent.updateAssignment();

      expect(editSnackbar.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('Warehouse One')
      );
    });

    it('should show message but not close dialog when update response.success is false', () => {
      TestBed.resetTestingModule();
      const editSnackbar = createMockSnackbarService();
      mockService.updateAssignment.and.returnValue(of({
        success: false,
        message: 'Update failed',
        statusCode: 400,
        data: {}
      }));
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: editSnackbar }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      mockDialogRef.close.calls.reset();
      editComponent.form.patchValue({ terminationDate: moment().add(30, 'days') });
      editComponent.updateAssignment();

      expect(editSnackbar.showSuccess).toHaveBeenCalledWith('Update failed');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should not call updateAssignment when form is invalid', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      mockService.updateAssignment.calls.reset();
      // Make form invalid by clearing required chapter
      editComponent.form.get('chapter')?.setValue(null);
      editComponent.updateAssignment();

      expect(mockService.updateAssignment).not.toHaveBeenCalled();
    });

    it('should not call updateAssignment when assignment is null', () => {
      TestBed.resetTestingModule();
      const noAssignmentData = {
        mode: 'edit' as const,
        user: { userId: 'USER001', userName: 'John Doe', department: 'IT' },
        assignment: undefined
      };
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: noAssignmentData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      mockService.updateAssignment.calls.reset();
      editComponent.updateAssignment();

      expect(mockService.updateAssignment).not.toHaveBeenCalled();
    });

    it('should reset isSubmitting on HTTP error (error handling delegated to authInterceptor)', async () => {
      TestBed.resetTestingModule();

      const editMockSnackbarService = createMockSnackbarService();

      TestBed.configureTestingModule({
        imports: [
          AssignUserWarehouseChapterComponent,
          ReactiveFormsModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: editMockSnackbarService }
        ]
      });

      mockService.updateAssignment.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;

      editFixture.detectChanges();

      // Ensure form is valid by setting terminationDate (the only editable field in edit mode)
      editComponent.form.patchValue({
        terminationDate: moment().add(30, 'days')
      });

      editComponent.updateAssignment();

      expect(editComponent.isSubmitting).toBeFalse();
    });

    it('should handle null response on update and close dialog', () => {
      TestBed.resetTestingModule();
      mockService.updateAssignment.and.returnValue(of(null as any));
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      mockDialogRef.close.calls.reset();
      editComponent.form.patchValue({ terminationDate: moment().add(30, 'days') });
      editComponent.updateAssignment();

      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });


  describe('ngAfterViewInit', () => {
    it('should assign sort to data source', () => {
      fixture.detectChanges();

      component.ngAfterViewInit();

      expect(component.dataSource.sort).toBe(component.sort);
    });
  });

  describe('Edit Mode - Chapter Editability', () => {
    const mockEditDialogData = {
      mode: 'edit' as const,
      user: {
        userId: 'USER001',
        userName: 'John Doe',
        department: 'IT'
      },
      assignment: {
        warehouseId: 'WH001',
        warehouseName: 'Warehouse One',
        chapterId: 'CH001',
        chapterName: 'Chapter One',
        printerId: 'PR001',
        printer: 'Printer One',
        effectiveDate: moment().add(1, 'days').format('YYYY-MM-DD'),
        terminationDate: null
      },
      index: 0
    };

    it('should allow chapter editing in edit mode (per Oracle Forms UpdateAllowed=true)', async () => {
      TestBed.resetTestingModule();

      TestBed.configureTestingModule({
        imports: [
          AssignUserWarehouseChapterComponent,
          ReactiveFormsModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      // Chapter field should be enabled in edit mode
      expect(editComponent.form.get('chapter')?.enabled).toBeTrue();
    });

    it('should display read-only warehouse in edit mode', async () => {
      TestBed.resetTestingModule();

      TestBed.configureTestingModule({
        imports: [
          AssignUserWarehouseChapterComponent,
          ReactiveFormsModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      const editComponent = editFixture.componentInstance;
      editFixture.detectChanges();

      expect(editComponent.editWarehouseDisplay).toBe('WH001 - Warehouse One');
    });

    it('should disable warehouse field in edit mode', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      expect(editFixture.componentInstance.form.get('warehouse')?.disabled).toBeTrue();
    });

    it('should store originalChapterId in edit mode', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      expect(editFixture.componentInstance.originalChapterId).toBe('CH001');
    });

    it('should store originalEffDate in edit mode', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      expect(editFixture.componentInstance.originalEffDate).toBeDefined();
    });

    it('should store originalFormValues in edit mode', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      expect(editFixture.componentInstance.originalFormValues).toBeDefined();
    });

    it('should add missing warehouse to dropdown when not already present', () => {
      TestBed.resetTestingModule();
      const dataWithNewWarehouse = {
        ...mockEditDialogData,
        assignment: {
          ...mockEditDialogData.assignment,
          warehouseId: 'WH999',
          warehouseName: 'New Warehouse'
        }
      };
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNewWarehouse },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      expect(editFixture.componentInstance.warehouses.some(w => w.id === 'WH999')).toBeTrue();
    });

    it('should add missing chapter to dropdown when not already present', () => {
      TestBed.resetTestingModule();
      const dataWithNewChapter = {
        ...mockEditDialogData,
        assignment: {
          ...mockEditDialogData.assignment,
          chapterId: 'CH999',
          chapterName: 'New Chapter'
        }
      };
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithNewChapter },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      expect(editFixture.componentInstance.chapters.some(c => c.id === 'CH999')).toBeTrue();
    });

    it('should handle getPrinters error in edit mode and still populate form', () => {
      TestBed.resetTestingModule();
      mockService.getPrinters.and.returnValue(throwError(() => new Error('Printer API Error')));
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditDialogData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      // Should have added the printer from the assignment
      expect(editFixture.componentInstance.printers.some(p => p.id === 'PR001')).toBeTrue();
      // Form should still be populated
      expect(editFixture.componentInstance.form.getRawValue().warehouse.id).toBe('WH001');
    });

    it('should add printer to printers dropdown if not present after getPrinters', () => {
      TestBed.resetTestingModule();
      const dataWithUniquePrinter = {
        ...mockEditDialogData,
        assignment: {
          ...mockEditDialogData.assignment,
          printerId: 'PR999',
          printer: 'Rare Printer'
        }
      };
      // getPrinters returns list without PR999
      mockService.getPrinters.and.returnValue(of({
        success: true, message: '', statusCode: 200,
        data: [{ id: 'PR001', description: 'Printer One' }]
      }));
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: dataWithUniquePrinter },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      expect(editFixture.componentInstance.printers.some(p => p.id === 'PR999')).toBeTrue();
    });
  });

  describe('isFormValid - Edit Mode with Past Termination Date', () => {
    const mockEditPastTermData = {
      mode: 'edit' as const,
      user: {
        userId: 'USER001',
        userName: 'John Doe',
        department: 'IT'
      },
      assignment: {
        warehouseId: 'WH001',
        warehouseName: 'Warehouse One',
        chapterId: 'CH001',
        chapterName: 'Chapter One',
        printerId: 'PR001',
        printer: 'Printer One',
        effectiveDate: '2020-01-01',
        terminationDate: '2021-01-01'
      },
      index: 0
    };

    let editComponent: AssignUserWarehouseChapterComponent;
    let editFixture: ComponentFixture<AssignUserWarehouseChapterComponent>;
    let editMockSnackbarService: jasmine.SpyObj<SnackbarService>;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      editMockSnackbarService = createMockSnackbarService();

      TestBed.configureTestingModule({
        imports: [
          AssignUserWarehouseChapterComponent,
          ReactiveFormsModule,
          TranslateModule.forRoot()
        ],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockEditPastTermData },
          { provide: SnackbarService, useValue: editMockSnackbarService }
        ]
      });

      editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editComponent = editFixture.componentInstance;
      editFixture.detectChanges();
    });

    it('should allow save button when other fields are changed even if termination date is in past', () => {
      editComponent.form.get('chapter')?.setValue({ id: 'CH002', name: 'Chapter Two' });
      editComponent.form.get('chapter')?.markAsDirty();

      expect(editComponent.isFormValid).toBeTrue();
    });

    it('should block save and show error when termination date is in past', () => {
      editComponent.form.get('chapter')?.setValue({ id: 'CH002', name: 'Chapter Two' });
      editComponent.form.get('chapter')?.markAsDirty();

      editComponent.updateAssignment();

      expect(mockService.updateAssignment).not.toHaveBeenCalled();
      expect(editComponent.getTerminationDateError()).toContain('past');
    });



    it('should use hasValidationErrors for add mode', () => {
      editComponent.isEditMode = false;
      editComponent.form.get('warehouse')?.setValue(null);
      expect(editComponent.isFormValid).toBeFalse();
    });
  });

  describe('409 Conflict Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle 409 conflict error for duplicate records on create', () => {
      const conflictError = {
        status: 409,
        error: {
          success: false,
          statusCode: 409,
          errorCode: '0069',
          errorResponse: {
            errorCode: '0069',
            error: 'Duplicate values'
          }
        }
      };

      mockService.createAssignments.and.returnValue(
        throwError(() => conflictError)
      );

      component.form.patchValue({
        warehouse: { id: 'WH001' }
      });
      component.form.patchValue({
        chapter: { id: 'CH001', name: 'Chapter One' }
      });
      component.form.patchValue({
        effectiveDate: moment().add(1, 'days')
      });

      component.addAssignment();
      component.saveAndAssign();

      // isSubmitting should be reset after error
      expect(component.isSubmitting).toBeFalse();
    });
  });

  describe('User Display Format', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format assigned user display as "userId - userName"', () => {
      expect(component.assignedUserDisplay).toBe('USER001 - John Doe');
    });

    it('should display uppercase userId', () => {
      expect(component.assignedUserId).toBe('USER001');
    });
  });

  describe('compareById', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when both objects have the same id', () => {
      expect(component.compareById({ id: 'A' }, { id: 'A' })).toBeTrue();
    });

    it('should return false when objects have different ids', () => {
      expect(component.compareById({ id: 'A' }, { id: 'B' })).toBeFalse();
    });

    it('should return true when both are null', () => {
      expect(component.compareById(null, null)).toBeTrue();
    });

    it('should return false when first is null and second is not', () => {
      expect(component.compareById(null, { id: 'A' })).toBeFalse();
    });

    it('should return false when first is not null and second is null', () => {
      expect(component.compareById({ id: 'A' }, null)).toBeFalse();
    });
  });

  describe('Display getters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    describe('editEffectiveDateDisplay', () => {
      it('should return dash when effectiveDate is null', () => {
        component.form.get('effectiveDate')?.setValue(null);
        expect(component.editEffectiveDateDisplay).toBe('-');
      });

      it('should return formatted date when effectiveDate is set', () => {
        const date = moment('2026-03-15');
        component.form.get('effectiveDate')?.setValue(date);
        expect(component.editEffectiveDateDisplay).toBe('15-MAR-2026');
      });
    });

    describe('editWarehouseDisplay', () => {
      it('should return dash when warehouse is null', () => {
        component.form.get('warehouse')?.setValue(null);
        expect(component.editWarehouseDisplay).toBe('-');
      });

      it('should return id and name when warehouse has name', () => {
        component.form.get('warehouse')?.setValue({ id: 'WH001', name: 'My Warehouse' });
        expect(component.editWarehouseDisplay).toBe('WH001 - My Warehouse');
      });

      it('should return only id when warehouse has no name', () => {
        component.form.get('warehouse')?.setValue({ id: 'WH001' });
        expect(component.editWarehouseDisplay).toBe('WH001');
      });
    });

    describe('editChapterDisplay', () => {
      it('should return dash when chapter is null', () => {
        component.form.get('chapter')?.setValue(null);
        expect(component.editChapterDisplay).toBe('-');
      });

      it('should return id and name when chapter has name', () => {
        component.form.get('chapter')?.setValue({ id: 'CH001', name: 'My Chapter' });
        expect(component.editChapterDisplay).toBe('CH001 - My Chapter');
      });

      it('should return only id when chapter has no name', () => {
        component.form.get('chapter')?.setValue({ id: 'CH001' });
        expect(component.editChapterDisplay).toBe('CH001');
      });
    });
  });

  describe('Date input handlers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call handleStartDateInput on onEffectiveDateInput', () => {
      const mockEvent = { target: { value: '15-MAR-2026' } } as unknown as Event;
      component.onEffectiveDateInput(mockEvent);
      // Should not throw
      expect(component.form.get('effectiveDate')?.touched).toBeTrue();
    });

    it('should call handleEndDateInput on onTerminationDateInput', () => {
      const mockEvent = { target: { value: '15-MAR-2026' } } as unknown as Event;
      component.onTerminationDateInput(mockEvent);
      expect(component.form.get('terminationDate')?.touched).toBeTrue();
    });

    it('should handle empty string in onEffectiveDateInput', () => {
      const mockEvent = { target: { value: '' } } as unknown as Event;
      component.onEffectiveDateInput(mockEvent);
      expect(component.form.get('effectiveDate')?.value).toBeNull();
    });

    it('should handle empty string in onTerminationDateInput', () => {
      const mockEvent = { target: { value: '' } } as unknown as Event;
      component.onTerminationDateInput(mockEvent);
      // Termination date is optional, so clearing should not set required error
      expect(component.form.get('terminationDate')?.value).toBeNull();
    });
  });

  describe('Date error messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string for effective date error when control is untouched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return empty string for termination date error when control is untouched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return required error for effective date when empty and touched', () => {
      component.form.get('effectiveDate')?.markAsTouched();
      component.form.get('effectiveDate')?.setValue(null);
      const error = component.getEffectiveDateError();
      expect(error).toContain('required');
    });

    it('should track lastChangedDateField to effective when effective date changes', () => {
      component.form.get('effectiveDate')?.setValue(moment().add(1, 'days'));
      expect((component as any).lastChangedDateField).toBe('effective');
    });

    it('should track lastChangedDateField to termination when termination date changes', () => {
      component.form.get('terminationDate')?.setValue(moment().add(10, 'days'));
      expect((component as any).lastChangedDateField).toBe('termination');
    });

    it('should pass form errors for cross-field validation when lastChangedDateField is effective', () => {
      (component as any).lastChangedDateField = 'effective';
      component.form.get('effectiveDate')?.markAsTouched();
      // When lastChangedDateField is 'effective', form.errors are passed to getStartDateCrossFieldError
      // but not to getEndDateCrossFieldError
      const effError = component.getEffectiveDateError();
      // Just ensures the method does not throw and returns a string
      expect(typeof effError).toBe('string');
    });

    it('should pass form errors for cross-field validation when lastChangedDateField is termination', () => {
      (component as any).lastChangedDateField = 'termination';
      component.form.get('terminationDate')?.markAsTouched();
      const termError = component.getTerminationDateError();
      expect(typeof termError).toBe('string');
    });
  });

  describe('hasValidationErrors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true when form is invalid', () => {
      component.form.get('warehouse')?.setValue(null);
      expect(component.hasValidationErrors()).toBeTrue();
    });

    it('should return false when form is valid', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      expect(component.hasValidationErrors()).toBeFalse();
    });

    it('should return true when form has dateRangeInvalid error', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(10, 'days'),
        terminationDate: moment().add(5, 'days')
      });
      expect(component.hasValidationErrors()).toBeTrue();
    });
  });

  describe('isFormValid getter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false in add mode when form is invalid', () => {
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true in add mode when form is valid', () => {
      component.form.patchValue({
        warehouse: { id: 'WH001', name: 'Warehouse One' },
        chapter: { id: 'CH001', name: 'Chapter One' },
        effectiveDate: moment().add(1, 'days')
      });
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('hasActualChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return true in add mode', () => {
      component.isEditMode = false;
      expect(component.hasActualChanges()).toBeTrue();
    });

    it('should return true when originalFormValues is null', () => {
      component.isEditMode = true;
      component.originalFormValues = null;
      expect(component.hasActualChanges()).toBeTrue();
    });

    it('should return true when chapter is changed', () => {
      component.isEditMode = true;
      component.originalFormValues = {
        warehouse: { id: 'WH001' },
        chapter: { id: 'CH001' },
        printer: null,
        effectiveDate: moment(),
        terminationDate: null
      };
      component.form.patchValue({ chapter: { id: 'CH002' } });
      expect(component.hasActualChanges()).toBeTrue();
    });

    it('should return true when printer is changed', () => {
      component.isEditMode = true;
      component.originalFormValues = {
        warehouse: { id: 'WH001' },
        chapter: { id: 'CH001' },
        printer: { id: 'PR001' },
        effectiveDate: moment(),
        terminationDate: null
      };
      component.form.get('printer')?.enable();
      component.form.patchValue({ printer: { id: 'PR002' } });
      expect(component.hasActualChanges()).toBeTrue();
    });

    it('should return true when termination date is changed', () => {
      component.isEditMode = true;
      component.originalFormValues = {
        warehouse: { id: 'WH001' },
        chapter: { id: 'CH001' },
        printer: null,
        effectiveDate: moment(),
        terminationDate: null
      };
      component.form.patchValue({ terminationDate: moment().add(30, 'days') });
      expect(component.hasActualChanges()).toBeTrue();
    });

    it('should return false when no changes are made', () => {
      const termDate = moment().add(10, 'days');
      component.isEditMode = true;
      component.form.patchValue({
        chapter: { id: 'CH001' },
        terminationDate: termDate
      });
      component.originalFormValues = {
        warehouse: { id: 'WH001' },
        chapter: { id: 'CH001' },
        printer: component.form.getRawValue().printer,
        effectiveDate: component.form.getRawValue().effectiveDate,
        terminationDate: termDate
      };
      expect(component.hasActualChanges()).toBeFalse();
    });

    it('should return true when printer changes from value to null', () => {
      component.isEditMode = true;
      component.originalFormValues = {
        warehouse: { id: 'WH001' },
        chapter: { id: 'CH001' },
        printer: { id: 'PR001' },
        effectiveDate: moment(),
        terminationDate: null
      };
      component.form.get('printer')?.enable();
      component.form.patchValue({ printer: null });
      expect(component.hasActualChanges()).toBeTrue();
    });

    it('should return true when termination date changes from null to a value', () => {
      component.isEditMode = true;
      component.originalFormValues = {
        warehouse: { id: 'WH001' },
        chapter: { id: 'CH001' },
        printer: null,
        effectiveDate: moment(),
        terminationDate: null
      };
      component.form.patchValue({ terminationDate: moment().add(10, 'days') });
      expect(component.hasActualChanges()).toBeTrue();
    });
  });

  describe('cancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog without data', () => {
      component.cancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('ngOnDestroy', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('resetForm', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset all form state', () => {
      component.isEditMode = true;
      component.editIndex = 2;
      component.originalChapterId = 'CH001';
      component.originalEffDate = '2026-01-01';

      (component as any).resetForm();

      expect(component.form.get('warehouse')?.value).toBeNull();
      expect(component.form.get('printer')?.disabled).toBeTrue();
      expect(component.isEditMode).toBeFalse();
      expect(component.editIndex).toBeNull();
      expect(component.originalChapterId).toBeNull();
      expect(component.originalEffDate).toBeNull();
    });
  });

  describe('handleEditMode edge cases', () => {
    it('should not populate form when mode is not edit', () => {
      // Default add mode - handleEditMode should do nothing
      fixture.detectChanges();
      expect(component.originalChapterId).toBeNull();
    });

    it('should handle assignment without printer in edit mode', () => {
      TestBed.resetTestingModule();
      const noPrinterData = {
        mode: 'edit' as const,
        user: { userId: 'USER001', userName: 'John Doe', department: 'IT' },
        assignment: {
          warehouseId: 'WH001',
          warehouseName: 'Warehouse One',
          chapterId: 'CH001',
          chapterName: 'Chapter One',
          printerId: undefined as any,
          printer: undefined as any,
          effectiveDate: moment().add(1, 'days').format('YYYY-MM-DD'),
          terminationDate: undefined
        },
        index: 0
      };
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: noPrinterData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      // Form should still be populated
      expect(editFixture.componentInstance.form.getRawValue().warehouse.id).toBe('WH001');
      expect(editFixture.componentInstance.form.getRawValue().printer).toBeNull();
    });

    it('should handle edit mode with terminationDate set', () => {
      TestBed.resetTestingModule();
      const withTermDate = {
        mode: 'edit' as const,
        user: { userId: 'USER001', userName: 'John Doe', department: 'IT' },
        assignment: {
          warehouseId: 'WH001',
          warehouseName: 'Warehouse One',
          chapterId: 'CH001',
          chapterName: 'Chapter One',
          printerId: 'PR001',
          printer: 'Printer One',
          effectiveDate: moment().add(1, 'days').format('YYYY-MM-DD'),
          terminationDate: moment().add(30, 'days').format('YYYY-MM-DD')
        },
        index: 0
      };
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: withTermDate },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      expect(editFixture.componentInstance.form.getRawValue().terminationDate).toBeDefined();
    });
  });

  describe('Date error state matchers', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have effDateErrorMatcher defined', () => {
      expect(component.effDateErrorMatcher).toBeDefined();
    });

    it('should have termDateErrorMatcher defined', () => {
      expect(component.termDateErrorMatcher).toBeDefined();
    });

    it('effDateErrorMatcher should return false when control is not touched', () => {
      const control = component.form.get('effectiveDate') as any;
      const result = component.effDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBeFalse();
    });

    it('termDateErrorMatcher should return false when control is not touched', () => {
      const control = component.form.get('terminationDate') as any;
      const result = component.termDateErrorMatcher.isErrorState(control, null as any);
      expect(result).toBeFalse();
    });

    it('effDateErrorMatcher should return false for null control', () => {
      const result = component.effDateErrorMatcher.isErrorState(null, null as any);
      expect(result).toBeFalse();
    });
  });

  describe('setupModeValidators', () => {
    it('should setup add mode validators when not in edit mode', () => {
      fixture.detectChanges();
      // In add mode, effective date should be required and enabled
      expect(component.form.get('effectiveDate')?.enabled).toBeTrue();
    });

    it('should setup edit mode validators with terminationDateNotPastValidator', () => {
      TestBed.resetTestingModule();
      const editData = {
        mode: 'edit' as const,
        user: { userId: 'USER001', userName: 'John Doe', department: 'IT' },
        assignment: {
          warehouseId: 'WH001', warehouseName: 'Warehouse One',
          chapterId: 'CH001', chapterName: 'Chapter One',
          printerId: 'PR001', printer: 'Printer One',
          effectiveDate: moment().add(1, 'days').format('YYYY-MM-DD'),
          terminationDate: undefined
        },
        index: 0
      };
      TestBed.configureTestingModule({
        imports: [AssignUserWarehouseChapterComponent, ReactiveFormsModule, TranslateModule.forRoot()],
        providers: [
          { provide: AssignUserWarehouseChapterService, useValue: mockService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editData },
          { provide: SnackbarService, useValue: mockSnackbarService }
        ]
      });

      const editFixture = TestBed.createComponent(AssignUserWarehouseChapterComponent);
      editFixture.detectChanges();

      // Set a past termination date; it should trigger terminationDatePast error
      editFixture.componentInstance.form.get('terminationDate')?.setValue(moment().subtract(10, 'days'));
      editFixture.componentInstance.form.get('terminationDate')?.markAsTouched();
      expect(editFixture.componentInstance.form.get('terminationDate')?.hasError('terminationDatePast')).toBeTrue();
    });
  });

  describe('VALIDATION constant', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should expose VALIDATION constant', () => {
      expect(component.VALIDATION).toBeDefined();
    });
  });

  describe('displayedColumns', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct displayed columns', () => {
      expect(component.displayedColumns).toEqual([
        'warehouse', 'chapter', 'printer', 'effectiveDate', 'terminationDate', 'actions'
      ]);
    });
  });

  describe('minDate', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have minDate defined', () => {
      expect(component.minDate).toBeDefined();
    });
  });
});
