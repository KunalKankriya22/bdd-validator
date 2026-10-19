import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { DefineAccessClassComponent } from './define-access-class';
import { DefineAccessClassService, DefineAccessClassRow } from '../services/define-access-class.service';
import { DefineClassFilter } from '../filter/define-class-filter';
import { createMockMatSnackBar, createMockMatDialog } from '@shared/testing/common-mocks';

describe('DefineAccessClassComponent', () => {
  let component: DefineAccessClassComponent;
  let fixture: ComponentFixture<DefineAccessClassComponent>;
  let mockDefineAccessClassService: jasmine.SpyObj<DefineAccessClassService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockTableData: DefineAccessClassRow[] = [
    {
      class: '00ISU',
      classDescription: 'Test Class',
      type: 'INTER',
      code: '101A',
      description: 'Test Description 1',
      effectiveDate: '01-Jan-2026',
      terminationDate: '-'
    },
    {
      class: '00ISU',
      classDescription: 'Test Class',
      type: 'PROPR',
      code: '102B',
      description: 'Test Description 2',
      effectiveDate: '15-Jan-2026',
      terminationDate: '31-Dec-2026'
    }
  ];

  beforeEach(() => {

    mockDefineAccessClassService = jasmine.createSpyObj('DefineAccessClassService', [
      'getDefineAccessClass',
      'getAccessClassesDropdown'
    ]);
    mockDefineAccessClassService.getAccessClassesDropdown.and.returnValue(of([]));
    
    const mockDialogRef = {
      afterClosed: () => of(null)
    };
    
    mockDialog = createMockMatDialog();
    mockDialog.open.and.returnValue(mockDialogRef as any);
    
    mockSnackBar = createMockMatSnackBar();
    mockSnackBar.open.and.returnValue({} as any);
    
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);



      TestBed.configureTestingModule({
      imports: [
        DefineAccessClassComponent,
        ReactiveFormsModule,
        HttpClientTestingModule
      ],
      providers: [
        provideRouter([])
      ]
    })
    .overrideComponent(DefineAccessClassComponent, {
      set: {
        providers: [
          { provide: DefineAccessClassService, useValue: mockDefineAccessClassService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: MatSnackBar, useValue: mockSnackBar }
        ]
      }
    });


    


      mockDefineAccessClassService.getDefineAccessClass.calls.reset();


      mockDefineAccessClassService.getAccessClassesDropdown.calls.reset();


      mockDialog.open.calls.reset();


      mockRouter.navigate.calls.reset();


      mockDefineAccessClassService.getAccessClassesDropdown.and.returnValue(of([]));


      mockDialog.open.and.returnValue(mockDialogRef as any);


      mockSnackBar.open.and.returnValue({} as any);


    fixture = TestBed.createComponent(DefineAccessClassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });


  describe('Component Initialization', () => {
    it('should initialize form with classCode field', () => {
      expect(component.form).toBeDefined();
      expect(component.form.get('classCode')).toBeDefined();
    });


  });

  describe('onRetrieve', () => {


    it('should retrieve data successfully', () => {
      mockDefineAccessClassService.getDefineAccessClass.and.returnValue(of(mockTableData));
      component.form.patchValue({ classCode: '00ISU' });
      
      component.onRetrieve();
      
      expect(component.hasSearched).toBeTrue();
      expect(component.classCode).toBe('00ISU');
      expect(component.isLoading).toBeFalse();
      expect(mockDefineAccessClassService.getDefineAccessClass).toHaveBeenCalledWith('00ISU', 'ASC');
    });

    it('should trim classCode before retrieving', () => {
      mockDefineAccessClassService.getDefineAccessClass.and.returnValue(of(mockTableData));
      component.form.patchValue({ classCode: '  00ISU  ' });
      
      component.onRetrieve();
      
      expect(mockDefineAccessClassService.getDefineAccessClass).toHaveBeenCalledWith('00ISU', 'ASC');
    });






  });

  describe('clear', () => {
    it('should reset all component state', () => {
      component.form.patchValue({ classCode: '00ISU' });
      component.hasSearched = true;
      component.selectedClassCode = '00ISU';
      component.selectedClassDescription = 'Test';
      component.tableData = mockTableData;
      component.filteredAssignments = mockTableData;
      
      component.clear();
      
      expect(component.form.value.classCode).toBeNull();
      expect(component.classCode).toBe('');
      expect(component.hasSearched).toBeFalse();
      expect(component.selectedClassCode).toBe('');
      expect(component.selectedClassDescription).toBe('');
      expect(component.tableData).toEqual([]);
      expect(component.filteredAssignments).toEqual([]);
    });
  });



  describe('applyTableSearch', () => {
    beforeEach(() => {
      component.tableData = [...mockTableData];
    });

    it('should show all data when search is empty', () => {
      component.tableSearch = '';
      component.applyTableSearch();
      
      expect(component.filteredAssignments.length).toBe(2);
    });



    it('should not filter when search query is less than 2 characters', () => {
      component.filteredAssignments = [...mockTableData];
      component.tableSearch = 'I';
      component.applyTableSearch();
      
      expect(component.filteredAssignments.length).toBe(2);
    });





    it('should trim search query', () => {
      component.tableSearch = '  INTER  ';
      component.applyTableSearch();
      
      expect(component.filteredAssignments.length).toBe(1);
    });
  });

  describe('clearTableSearch', () => {
    beforeEach(() => {
      component.tableData = [...mockTableData];
    });

    it('should clear table search and show all data', () => {
      component.tableSearch = 'INTER';
      component.applyTableSearch();
      expect(component.filteredAssignments.length).toBe(1);

      component.clearTableSearch();

      expect(component.tableSearch).toBe('');
      expect(component.filteredAssignments.length).toBe(2);
    });
  });

  describe('Filter Overlay', () => {
    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBeFalse();
      component.toggleFilter();
      expect(component.isFilterOpen).toBeTrue();
      component.toggleFilter();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should close filter', () => {
      component.isFilterOpen = true;
      component.closeFilter();
      expect(component.isFilterOpen).toBeFalse();
    });

    it('should apply filters and close overlay', () => {
      const mockFilters: DefineClassFilter = {
        type: null,
        code: null,
        effectiveDate: new Date('2026-01-01'),
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null,
        status: null
      };

      component.isFilterOpen = true;
      component.tableData = [...mockTableData];
      component.applyFilters(mockFilters);

      expect(component.appliedClassFilters).toEqual(mockFilters);
      expect(component.isFilterOpen).toBeFalse();
    });
  });

  describe('openCreateRecord', () => {
    it('should open create record dialog', () => {
      component.selectedClassCode = '00ISU';
      const mockDialogRef = {
        afterClosed: () => of(null)
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      
      component.openCreateRecord();
      
      expect(mockDialog.open).toHaveBeenCalled();
      const dialogConfig: any = mockDialog.open.calls.argsFor(0)[1];
      expect(dialogConfig?.data?.mode).toBe('add');
      expect(dialogConfig?.data?.classname).toBe('00ISU');
    });


  });

  describe('openEditRecord', () => {
    it('should open edit record dialog with row data', () => {
      component.classCode = '00ISU';
      component.selectedClassCode = '00ISU';
      const row = mockTableData[0];
      const mockDialogRef = {
        afterClosed: () => of(null)
      };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      
      component.openEditRecord(row);
      
      expect(mockDialog.open).toHaveBeenCalled();
      const dialogConfig: any = mockDialog.open.calls.argsFor(0)[1];
      expect(dialogConfig?.data?.mode).toBe('edit');
      expect(dialogConfig?.data?.codeType).toBe('INTER');
      expect(dialogConfig?.data?.codeValue).toBe('101A');
    });


  });

  describe('openAttachedUsers', () => {
    it('should show error if no class is selected', () => {
      component.selectedClassCode = '';
      mockSnackBar.open.and.returnValue({} as any);
      
      component.openAttachedUsers();
      
      expect(mockSnackBar.open).toHaveBeenCalledWith(
        'Please retrieve a class first',
        'Close',
        { duration: 3000 }
      );
      expect(mockDialog.open).not.toHaveBeenCalled();
    });


  });

  describe('Associated Interdictions Panel', () => {
    it('should open panel with row data', () => {
      const row = mockTableData[0];
      component.openAssociatedInterdictions(row);
      
      expect(component.isPanelOpen).toBeTrue();
      expect(component.selectedAccessClassCode).toBe('00ISU');
      expect(component.selectedAccessClassDescription).toBe('Test Class');
    });

    it('should close panel', () => {
      component.isPanelOpen = true;
      component.closeInterdictionPanel();
      
      expect(component.isPanelOpen).toBeFalse();
    });
  });

  describe('Date Filter Logic', () => {
    let testData: DefineAccessClassRow[];

    beforeEach(() => {
      testData = [
        {
          class: '00ISU',
          classDescription: 'Test',
          type: 'INTER',
          code: '101',
          description: 'Desc 1',
          effectiveDate: '01-Jan-2026',
          terminationDate: '31-Dec-2026'
        },
        {
          class: '00ISU',
          classDescription: 'Test',
          type: 'PROPR',
          code: '102',
          description: 'Desc 2',
          effectiveDate: '15-Feb-2026',
          terminationDate: '-'
        }
      ];
      component.tableData = testData;
    });



    it('should filter by termination date BEFORE', () => {      testData[1].terminationDate = '15-Feb-2026'; // Give it a valid date
      component.tableData = testData;
      component.appliedClassFilters = {
        type: null,
        code: null,
        effectiveDate: null,
        effectiveDatePeriod: 'AFTER',
        terminationDate: new Date('2026-12-31'),
        terminationDatePeriod: 'BEFORE',
        status: null
      };
      
      component['applyDefineClassFilters']();
      
      // Both rows with valid termination dates <= 31-Dec-2026 pass
      expect(component.filteredAssignments.length).toBe(2);
    });


  });
});
