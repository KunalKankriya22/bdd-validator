import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Validators } from '@angular/forms';
import { of, Subject, throwError } from 'rxjs';
import moment from 'moment';

import { HospitalPatientContractProfileTestsComponent } from './hospital-patient-contract-profile-tests';
import { HospitalPatientContractProfileTestsService } from './services/hospital-patient-contract-profile-tests.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  ContractLookup,
  ContractProfileTestTableModel,
  CreateContractTestRequest,
  UpdateContractTestRequest
} from './models/hospital-patient-contract-profile-tests.model';

describe('HospitalPatientContractProfileTestsComponent', () => {
  let component: HospitalPatientContractProfileTestsComponent;
  let fixture: ComponentFixture<HospitalPatientContractProfileTestsComponent>;
  let mockService: jasmine.SpyObj<HospitalPatientContractProfileTestsService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockMenuService: jasmine.SpyObj<MenuService>;
  let chapterChangedSubject: Subject<void>;

  const mockContracts: ContractLookup[] = [
    { contractId: 'HOSP001', description: 'University Medical Center' },
    { contractId: 'HOSP002', description: 'St. Mary\'s Hospital' }
  ];

  const mockContractTests: ContractProfileTestTableModel[] = [
    {
      contractId: 'HOSP001',
      chapterId: 'CHAP001',
      testId: 'HIV1/2',
      profileSetId: 'PS001',
      testDesc: 'HIV 1/2 Antibody Screen',
      stopLabelFlag: 'Y',
      effDate: '2026-01-01',
      termDate: null,
      lastModifiedDate: '2026-06-15',
      programId: 'ADMIN001'
    },
    {
      contractId: 'HOSP001',
      chapterId: 'CHAP001',
      testId: 'HBsAg',
      profileSetId: 'PS001',
      testDesc: 'Hepatitis B Surface Antigen',
      stopLabelFlag: 'N',
      effDate: '2025-06-01',
      termDate: '2026-05-31',
      lastModifiedDate: '2025-06-01',
      programId: 'ADMIN002'
    }
  ];

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    mockService = jasmine.createSpyObj('HospitalPatientContractProfileTestsService', [
      'getActiveContracts',
      'searchContractTests',
      'getContractTestById',
      'getActiveTests',
      'createContractTest',
      'updateContractTest',
      'deleteContractTest',
      'getStopLabelFlagOptions'
    ]);

    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error', 'warn', 'info']);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });
    mockMenuService = jasmine.createSpyObj('MenuService', ['findMenuItemByPath'], {
      getMenuItemsSignal: () => () => []
    });

    // Default mock responses
    mockService.getActiveContracts.and.returnValue(of(mockContracts));
    mockService.searchContractTests.and.returnValue(of({ data: mockContractTests, total: 2 }));
    mockService.createContractTest.and.returnValue(of(void 0));
    mockService.updateContractTest.and.returnValue(of(void 0));
    mockService.deleteContractTest.and.returnValue(of(void 0));



      TestBed.configureTestingModule({
imports: [
        HospitalPatientContractProfileTestsComponent,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HospitalPatientContractProfileTestsService, useValue: mockService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: MenuService, useValue: mockMenuService }
      ]
    });


    });



  beforeEach(() => {
      mockService.getActiveContracts.and.returnValue(of(mockContracts));


      mockService.searchContractTests.and.returnValue(of({ data: mockContractTests, total: 2 }));


      mockService.createContractTest.and.returnValue(of(void 0));


      mockService.updateContractTest.and.returnValue(of(void 0));


      mockService.deleteContractTest.and.returnValue(of(void 0));


    fixture = TestBed.createComponent(HospitalPatientContractProfileTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  afterEach(() => {
    chapterChangedSubject.complete();
  });

  it('should initialize Contract ID control as required (per FMB line 17)', () => {
    expect(component.contractIdControl.hasValidator(Validators.required)).toBe(true);
  });


  it('should show Contract ID as valid when populated', () => {
    component.contractIdControl.setValue('HOSP001');
    expect(component.contractIdControl.valid).toBe(true);
  });


  it('should handle contract loading error', () => {
    const newComponent = TestBed.createComponent(HospitalPatientContractProfileTestsComponent).componentInstance;
    mockService.getActiveContracts.and.returnValue(throwError(() => new Error('API Error')));

    newComponent.ngOnInit();

    expect(mockLoggingService.error).toHaveBeenCalled();
    expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load contracts');
  });



  describe('Contract Selection', () => {
    it('should load data when contract is selected', () => {
      component.contractIdControl.setValue('HOSP001');
      component.onContractChange();

      expect(mockService.searchContractTests).toHaveBeenCalledWith(
        'HOSP001',
        25,
        0,
        jasmine.objectContaining({
          sortColumn: 'TestId',
          sortOrder: 'ASC'
        })
      );
      expect(component.selectedContractDescription).toBe('University Medical Center');
      expect(component.dataSource.length).toBe(2);
    });


    it('should update description when contract changes', () => {
      component.contractIdControl.setValue('HOSP001');
      component.onContractChange();
      expect(component.selectedContractDescription).toBe('University Medical Center');

      component.contractIdControl.setValue('HOSP002');
      component.onContractChange();
      expect(component.selectedContractDescription).toBe('St. Mary\'s Hospital');
    });

    it('should reset page index when contract changes', () => {
      component.currentPageIndex = 5;
      component.contractIdControl.setValue('HOSP001');
      component.onContractChange();

      expect(component.currentPageIndex).toBe(0);
    });
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      component.contractIdControl.setValue('HOSP001');
    });

    it('should search with keyword', () => {
      component.onSearch('HIV');

      expect(component.searchText).toBe('HIV');
      expect(component.currentPageIndex).toBe(0);
      expect(mockService.searchContractTests).toHaveBeenCalledWith(
        'HOSP001',
        25,
        0,
        jasmine.objectContaining({
          searchKeyword: 'HIV'
        })
      );
    });


  });


  describe('Sorting', () => {
    beforeEach(() => {
      component.contractIdControl.setValue('HOSP001');
    });

    it('should handle sort change to ascending', () => {
      component.onSortChange({ column: 'effDate', direction: 'A' });

      expect(component.sortDirection).toBe('ASC');
      expect(mockService.searchContractTests).toHaveBeenCalledWith(
        'HOSP001',
        25,
        0,
        jasmine.objectContaining({
          sortColumn: 'EffDate',
          sortOrder: 'ASC'
        })
      );
    });

    it('should handle sort change to descending', () => {
      component.onSortChange({ column: 'termDate', direction: 'D' });

      expect(component.sortDirection).toBe('DESC');
      expect(mockService.searchContractTests).toHaveBeenCalledWith(
        'HOSP001',
        25,
        0,
        jasmine.objectContaining({
          sortColumn: 'TermDate',
          sortOrder: 'DESC'
        })
      );
    });
  });

  describe('Side Panel', () => {
    it('should open add panel when ADD NEW TEST is clicked', () => {
      component.contractIdControl.setValue('HOSP001');
      component.openAddPanel();

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });


    it('should open edit panel when edit action is clicked', () => {
      const testRow = mockContractTests[0];

      component.openEditPanel(testRow);

      expect(component.sidePanelOpen).toBe(true);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(testRow);
    });


    it('should handle row action for edit', () => {
      spyOn(component, 'openEditPanel');

      component.onRowAction({
        action: 'edit',
        row: mockContractTests[0]
      });

      expect(component.openEditPanel).toHaveBeenCalledWith(mockContractTests[0]);
    });
  });

  describe('Create Test', () => {
    const formValue = {
      testId: 'HIV1/2',
      testDesc: 'HIV 1/2 Antibody Screen',
      stopLabelFlag: 'Y' as const,
      effDate: moment('2026-07-01'),
      termDate: moment('2027-06-30')
    };

    beforeEach(() => {
      component.contractIdControl.setValue('HOSP001');
      component.sidePanelMode = 'add';
    });

    it('should create test successfully', () => {
      component.onSave(formValue);

      const expectedPayload: CreateContractTestRequest = {
        contractId: 'HOSP001',
        testId: 'HIV1/2',
        stopLabelFlag: 'Y',
        effDate: '2026-07-01',
        termDate: '2027-06-30'
      };

      expect(mockService.createContractTest).toHaveBeenCalledWith(expectedPayload);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Contract test created successfully');
      expect(mockService.searchContractTests).toHaveBeenCalled();
    });



    it('should format error with error code when available', () => {
      mockService.createContractTest.and.returnValue(
        throwError(() => ({
          errorCode: '5163',
          error: 'Duplicate record for this test ID',
          errorResponse: {
            errorCode: '5163',
            error: 'Duplicate record for this test ID'
          }
        }))
      );

      component.onSave(formValue);

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error 5163: Duplicate record for this test ID');
    });

    it('should create and keep panel open for "Save and Add New"', (done) => {
      component.sidePanelOpen = true;
      component.onSaveAndCreateAnother(formValue);

      setTimeout(() => {
        expect(mockService.createContractTest).toHaveBeenCalled();
        expect(component.sidePanelMode).toBe('add');
        expect(component.sidePanelData).toBeNull();
        done();
      }, 100);
    });

    it('should handle null termDate', () => {
      const formValueNoTerm = { ...formValue, termDate: null };
      component.onSave(formValueNoTerm);

      expect(mockService.createContractTest).toHaveBeenCalledWith(
        jasmine.objectContaining({
          termDate: undefined
        })
      );
    });
  });

  describe('Update Test', () => {
    const formValue = {
      testId: 'HIV1/2',
      testDesc: 'HIV 1/2 Antibody Screen',
      stopLabelFlag: 'N' as const,
      effDate: moment('2026-07-01'),
      termDate: moment('2027-12-31')
    };

    beforeEach(() => {
      component.contractIdControl.setValue('HOSP001');
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockContractTests[0];
    });

    it('should update test successfully', () => {
      component.onSave(formValue);

      const expectedPayload: UpdateContractTestRequest = {
        stopLabelFlag: 'N',
        effDate: '2026-07-01',
        termDate: '2027-12-31'
      };

      expect(mockService.updateContractTest).toHaveBeenCalledWith(
        'HOSP001',
        'HIV1/2',
        expectedPayload
      );
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Contract test updated successfully');
    });



  });

  describe('Clear All', () => {
    it('should clear all selections and data', () => {
      component.contractIdControl.setValue('HOSP001');
      component.selectedContractDescription = 'Test Contract';
      component.searchText = 'HIV';
      component.dataSource = mockContractTests;
      component.tableConfig.pagination!.totalRecords = 10;
      component.tableConfig.pagination!.pageIndex = 2;

      component.clearAll();

      expect(component.contractIdControl.value).toBe('');
      expect(component.selectedContractDescription).toBe('');
      expect(component.searchText).toBe('');
      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Chapter Change', () => {

    it('should clear contract selection on chapter change', () => {
      component.contractIdControl.setValue('HOSP001');
      component.selectedContractDescription = 'Test Hospital';
      component.dataSource = mockContractTests;

      chapterChangedSubject.next();

      expect(component.contractIdControl.value).toBe('');
      expect(component.selectedContractDescription).toBe('');
      expect(component.dataSource).toEqual([]);
    });

  });

  describe('Loading States', () => {

    it('should handle loading error', () => {
      mockService.searchContractTests.and.returnValue(
        throwError(() => new Error('Network error'))
      );
      component.contractIdControl.setValue('HOSP001');

      component.loadData();

      expect(component.hasError).toBe(true);
      expect(component.isLoading).toBe(false);
      expect(mockLoggingService.error).toHaveBeenCalled();
    });
  });

  describe('Contract Search Filter', () => {
    it('should filter contracts by search term', () => {
      component.contractSearchCtrl.setValue('Mary');
      expect(component.filteredContracts.length).toBe(1);
      expect(component.filteredContracts[0].contractId).toBe('HOSP002');
    });

    it('should show all contracts when search is cleared', () => {
      component.contractSearchCtrl.setValue('Mary');
      component.contractSearchCtrl.setValue('');
      expect(component.filteredContracts.length).toBe(2);
    });

    it('should show all contracts when search is null', () => {
      component.contractSearchCtrl.setValue(null);
      expect(component.filteredContracts.length).toBe(2);
    });
  });

  describe('Contract Change edge cases', () => {
    it('should clear description and data when contract value is empty', () => {
      component.contractIdControl.setValue('HOSP001');
      component.onContractChange();
      expect(component.selectedContractDescription).toBe('University Medical Center');

      component.contractIdControl.setValue('');
      component.onContractChange();
      expect(component.selectedContractDescription).toBe('');
      expect(component.dataSource).toEqual([]);
    });

    it('should set empty description when contract not found in list', () => {
      component.contractIdControl.setValue('UNKNOWN');
      component.onContractChange();
      expect(component.selectedContractDescription).toBe('');
    });
  });

  describe('Tooltip', () => {
    it('should return empty tooltip when no contract selected', () => {
      component.contractIdControl.setValue('');
      expect(component.getSelectedContractTooltip()).toBe('');
    });

    it('should return formatted tooltip when contract is selected', () => {
      component.contractIdControl.setValue('HOSP001');
      expect(component.getSelectedContractTooltip()).toBe('HOSP001 - University Medical Center');
    });

    it('should return contractId when contract not found in list', () => {
      component.contractIdControl.setValue('UNKNOWN');
      expect(component.getSelectedContractTooltip()).toBe('UNKNOWN');
    });
  });

  describe('loadData edge cases', () => {
    it('should not load data when no contract is selected', () => {
      component.contractIdControl.setValue('');
      mockService.searchContractTests.calls.reset();
      component.loadData();
      expect(mockService.searchContractTests).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    it('should update page index and size on page change', () => {
      component.contractIdControl.setValue('HOSP001');
      component.onPageChange({ pageIndex: 2, pageSize: 50 });
      expect(component.currentPageIndex).toBe(2);
      expect(component.currentPageSize).toBe(50);
      expect(mockService.searchContractTests).toHaveBeenCalled();
    });
  });

  describe('Sort column mapping', () => {
    beforeEach(() => {
      component.contractIdControl.setValue('HOSP001');
    });

    it('should default sort direction for unknown direction', () => {
      component.onSortChange({ column: 'testId', direction: 'default' as any });
      expect(component.sortDirection).toBe('ASC');
    });

    it('should map effDate column correctly', () => {
      component.tableConfig.sortConfig!.column = 'effDate';
      component.loadData();
      expect(mockService.searchContractTests).toHaveBeenCalledWith(
        'HOSP001', 25, 0,
        jasmine.objectContaining({ sortColumn: 'EffDate' })
      );
    });

    it('should map termDate column correctly', () => {
      component.tableConfig.sortConfig!.column = 'termDate';
      component.loadData();
      expect(mockService.searchContractTests).toHaveBeenCalledWith(
        'HOSP001', 25, 0,
        jasmine.objectContaining({ sortColumn: 'TermDate' })
      );
    });

    it('should default to TestId for unknown column', () => {
      component.tableConfig.sortConfig!.column = 'stopLabelFlag';
      component.loadData();
      expect(mockService.searchContractTests).toHaveBeenCalledWith(
        'HOSP001', 25, 0,
        jasmine.objectContaining({ sortColumn: 'TestId' })
      );
    });
  });

  describe('Search edge cases', () => {
    it('should not search when no contract is selected', () => {
      component.contractIdControl.setValue('');
      mockService.searchContractTests.calls.reset();
      component.onSearch('test');
      expect(mockService.searchContractTests).not.toHaveBeenCalled();
    });

    it('should reset page index on search', () => {
      component.contractIdControl.setValue('HOSP001');
      component.currentPageIndex = 3;
      component.onSearch('test');
      expect(component.currentPageIndex).toBe(0);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('Side Panel edge cases', () => {
    it('should show error when opening add panel without contract', () => {
      component.contractIdControl.setValue('');
      component.openAddPanel();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a contract first');
      expect(component.sidePanelOpen).toBe(false);
    });

    it('should close side panel and clear data', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockContractTests[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBe(false);
      expect(component.sidePanelData).toBeNull();
    });

    it('should close side panel on chapter change', () => {
      component.sidePanelOpen = true;
      chapterChangedSubject.next();
      expect(component.sidePanelOpen).toBe(false);
    });
  });

  describe('Update edge cases', () => {
    it('should not update when sidePanelData is null', () => {
      component.contractIdControl.setValue('HOSP001');
      component.sidePanelMode = 'edit';
      component.sidePanelData = null;
      component.onSave({
        testId: 'HIV1/2',
        testDesc: 'test',
        stopLabelFlag: 'Y',
        effDate: moment(),
        termDate: null
      });
      expect(mockService.updateContractTest).not.toHaveBeenCalled();
    });

    it('should not update when no contract selected', () => {
      component.contractIdControl.setValue('');
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockContractTests[0];
      component.onSave({
        testId: 'HIV1/2',
        testDesc: 'test',
        stopLabelFlag: 'Y',
        effDate: moment(),
        termDate: null
      });
      expect(mockService.updateContractTest).not.toHaveBeenCalled();
    });

    it('should handle update error', () => {
      component.contractIdControl.setValue('HOSP001');
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockContractTests[0];
      mockService.updateContractTest.and.returnValue(
        throwError(() => ({ message: 'Update failed' }))
      );
      component.onSave({
        testId: 'HIV1/2',
        testDesc: 'test',
        stopLabelFlag: 'Y',
        effDate: moment(),
        termDate: null
      });
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    });
  });

  describe('Create edge cases', () => {
    it('should not create when no contract selected', () => {
      component.contractIdControl.setValue('');
      component.sidePanelMode = 'add';
      component.onSave({
        testId: 'HIV1/2',
        testDesc: 'test',
        stopLabelFlag: 'Y',
        effDate: moment(),
        termDate: null
      });
      expect(mockService.createContractTest).not.toHaveBeenCalled();
    });

    it('should close panel after successful create (not save-and-add-new)', () => {
      component.contractIdControl.setValue('HOSP001');
      component.sidePanelMode = 'add';
      component.sidePanelOpen = true;
      component.onSave({
        testId: 'HIV1/2',
        testDesc: 'test',
        stopLabelFlag: 'Y',
        effDate: moment(),
        termDate: null
      });
      expect(component.sidePanelOpen).toBe(false);
    });
  });

  describe('Error formatting', () => {
    beforeEach(() => {
      component.contractIdControl.setValue('HOSP001');
      component.sidePanelMode = 'add';
    });

    it('should format error with errorResponse.error only (no code)', () => {
      mockService.createContractTest.and.returnValue(
        throwError(() => ({
          errorResponse: { error: 'Something went wrong' }
        }))
      );
      component.onSave({
        testId: 'T1', testDesc: '', stopLabelFlag: 'Y',
        effDate: moment(), termDate: null
      });
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Something went wrong');
    });

    it('should format error with direct errorCode and error', () => {
      mockService.createContractTest.and.returnValue(
        throwError(() => ({
          errorCode: '1234',
          error: 'Direct error'
        }))
      );
      component.onSave({
        testId: 'T1', testDesc: '', stopLabelFlag: 'Y',
        effDate: moment(), termDate: null
      });
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error 1234: Direct error');
    });

    it('should fallback to default message when no details available', () => {
      mockService.createContractTest.and.returnValue(
        throwError(() => ({}))
      );
      component.onSave({
        testId: 'T1', testDesc: '', stopLabelFlag: 'Y',
        effDate: moment(), termDate: null
      });
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('An error occurred. Please try again.');
    });

    it('should use message property as fallback', () => {
      mockService.createContractTest.and.returnValue(
        throwError(() => ({ message: 'Custom message' }))
      );
      component.onSave({
        testId: 'T1', testDesc: '', stopLabelFlag: 'Y',
        effDate: moment(), termDate: null
      });
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Custom message');
    });
  });

  describe('Table column value formatters', () => {
    it('should format stopLabelFlag Y as Yes', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'stopLabelFlag');
      expect(col?.valueFormatter?.('Y')).toBe('Yes');
    });

    it('should format stopLabelFlag N as No', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'stopLabelFlag');
      expect(col?.valueFormatter?.('N')).toBe('No');
    });

    it('should format stopLabelFlag unknown as -', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'stopLabelFlag');
      expect(col?.valueFormatter?.(null)).toBe('-');
    });

    it('should format effDate using formatTableDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effDate');
      expect(col?.valueFormatter).toBeDefined();
      const result = col?.valueFormatter?.('2026-01-01');
      expect(typeof result).toBe('string');
    });

    it('should format termDate using formatTableDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'termDate');
      expect(col?.valueFormatter).toBeDefined();
    });

    it('should format lastModifiedDate using formatTableDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'lastModifiedDate');
      expect(col?.valueFormatter).toBeDefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const dNext = spyOn((component as any).destroy$, 'next');
      const dComplete = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(dNext).toHaveBeenCalled();
      expect(dComplete).toHaveBeenCalled();
    });
  });
});
