import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { TestByMachineIdComponent } from './test-by-machine-id';
import { TestByMachineIdApiService } from './services/test-by-machine-id-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockActivatedRoute, createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  InstrumentIdOption,
  InstrumentTestIdOption,
  TestByMachineIdResponse
} from './models/test-by-machine-id.model';

describe('TestByMachineIdComponent', () => {
  let component: TestByMachineIdComponent;
  let fixture: ComponentFixture<TestByMachineIdComponent>;
  let mockApiService: jasmine.SpyObj<TestByMachineIdApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockInstrumentIds: InstrumentIdOption[] = [
    { instrumentId: 'INSTR1', description: 'Instrument 1' },
    { instrumentId: 'INSTR2', description: 'Instrument 2' }
  ];

  const mockTestIds: InstrumentTestIdOption[] = [
    { testId: 'TEST1', description: 'Test 1' },
    { testId: 'TEST2', description: 'Test 2' }
  ];

  const mockTestOptions = {
    tests: [
      { testId: 'LT001', description: 'LifeTrack Test 001' },
      { testId: 'LT002', description: 'LifeTrack Test 002' },
      { testId: 'LT003', description: 'LifeTrack Test 003' }
    ],
    results: ['R', 'N', 'NR']
  };

  const mockTestData: TestByMachineIdResponse = {
    instrumentTests: [
      {
        instrumentId: 'INSTR1',
        testId: 'TEST1',
        test1: 'TEST1',
        result1: 'R',
        test2: 'TEST2',
        result2: 'N',
        test3: '',
        result3: '',
        test4: '',
        result4: '',
        test5: '',
        result5: '',
        poolSize: 5,
        auditKey: 123
      }
    ],
    applicationSchedulingTests: [
      {
        instrumentId: 'INSTR1',
        testId: 'TEST1',
        test1: 'LT001',
        result1: 'R',
        test2: 'LT002',
        result2: 'N',
        test3: '',
        result3: '',
        defTest4: '',
        result4: '',
        defTest5: '',
        result5: '',
        defTest6: '',
        result6: '',
        effectiveDate: new Date(2025, 0, 1),
        terminationDate: null,
        auditKey: 123
      }
    ],
    totalRecords: 1
  };

  beforeEach(() => {
    const pageHeaderDataSignal = signal({ title: 'Test By Machine ID', subtitle: 'Manage test schedules' });

    mockApiService = jasmine.createSpyObj('TestByMachineIdApiService', [
      'getInstrumentIds',
      'getInstrumentTestIds',
      'getTestOptions',
      'getTestResults',
      'getTestData',
      'saveBulkTestData'
    ]);

    mockSnackbarService = createMockSnackbarService();

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: pageHeaderDataSignal
    });

    mockHeaderService = createMockHeaderService();

    // Default mock returns
    mockApiService.getInstrumentIds.and.returnValue(of(mockInstrumentIds));
    mockApiService.getInstrumentTestIds.and.returnValue(of(mockTestIds));
    mockApiService.getTestOptions.and.returnValue(of(mockTestOptions));
    mockApiService.getTestResults.and.returnValue(of(['R', 'N', 'NR']));
    mockApiService.getTestData.and.returnValue(of(mockTestData));
    mockApiService.saveBulkTestData.and.returnValue(of({ success: true, message: 'Saved' }));

    TestBed.configureTestingModule({
      imports: [
        TestByMachineIdComponent,
        HttpClientTestingModule
      ],
      providers: [
        { provide: TestByMachineIdApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: ActivatedRoute, useValue: createMockActivatedRoute() }
      ]
    });

    mockApiService.getInstrumentIds.calls.reset();
    mockApiService.getInstrumentTestIds.calls.reset();
    mockApiService.getTestOptions.calls.reset();
    mockApiService.getTestResults.calls.reset();
    mockApiService.getTestData.calls.reset();
    mockApiService.saveBulkTestData.calls.reset();

    mockApiService.getInstrumentIds.and.returnValue(of(mockInstrumentIds));
    mockApiService.getInstrumentTestIds.and.returnValue(of(mockTestIds));
    mockApiService.getTestOptions.and.returnValue(of(mockTestOptions));
    mockApiService.getTestResults.and.returnValue(of(['R', 'N', 'NR']));
    mockApiService.getTestData.and.returnValue(of(mockTestData));
    mockApiService.saveBulkTestData.and.returnValue(of({ success: true, message: 'Saved' }));

    fixture = TestBed.createComponent(TestByMachineIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should have instrument ID and test ID controls', () => {
      expect(component.instrumentIdControl).toBeDefined();
      expect(component.testIdControl).toBeDefined();
    });

    it('should load instrument IDs on init', () => {
      expect(mockApiService.getInstrumentIds).toHaveBeenCalled();
      expect(component.instrumentIdOptions().length).toBe(2);
    });

    it('should load test options on init', () => {
      expect(mockApiService.getTestOptions).toHaveBeenCalled();
      expect(component.testOptions().length).toBe(3);
    });

    it('should set minDate from chapter timezone', () => {
      expect(component.minDate).toBeDefined();
      expect(moment.isMoment(component.minDate)).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    it('should require instrument ID but test ID is optional', () => {
      component.instrumentIdControl.setValue('');
      component.testIdControl.setValue('');

      expect(component.instrumentIdControl.invalid).toBeTruthy();
      expect(component.instrumentIdControl.hasError('required')).toBeTruthy();
      expect(component.testIdControl.valid).toBeTruthy();
    });

    it('should be valid when instrument ID is provided and test ID is empty', () => {
      component.instrumentIdControl.setValue('INST-001');
      component.testIdControl.setValue('');

      expect(component.instrumentIdControl.valid).toBeTruthy();
      expect(component.testIdControl.valid).toBeTruthy();
    });
  });

  describe('Dropdown Cascading', () => {
    it('should load test IDs when instrument ID is selected', () => {
      component.onInstrumentIdChange('INSTR1');

      expect(mockApiService.getInstrumentTestIds).toHaveBeenCalledWith('INSTR1');
      expect(component.testIdOptions().length).toBe(2);
    });

    it('should load result options when test is selected', fakeAsync(() => {
      const resultSignal = component.instrumentResult1Options;
      component['loadResultOptionsForTest']('LT001', resultSignal);
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT001');
      expect(resultSignal().length).toBe(3);
    }));
  });

  describe('Data Retrieval', () => {
    it('should retrieve data successfully', fakeAsync(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');

      component.onRetrieve();
      tick();

      expect(mockApiService.getTestData).toHaveBeenCalledWith({
        instrumentId: 'INSTR1',
        testId: 'TEST1'
      });
      expect(component.instrumentTestsData.length).toBe(1);
      expect(component.applicationSchedulingTestsData.length).toBe(1);
      expect(component.isRetrieving).toBeFalsy();
    }));

    it('should retrieve data with only instrument ID (test ID optional)', fakeAsync(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('');

      component.onRetrieve();
      tick();

      expect(mockApiService.getTestData).toHaveBeenCalledWith({
        instrumentId: 'INSTR1',
        testId: undefined
      });
    }));

    it('should not retrieve when instrument ID is invalid', () => {
      component.instrumentIdControl.setValue('');
      component.onRetrieve();

      expect(mockApiService.getTestData).not.toHaveBeenCalled();
      expect(component.instrumentIdControl.touched).toBeTruthy();
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      component.instrumentTestsData = [
        { ...mockTestData.instrumentTests[0], test1: 'ZZZ' },
        { ...mockTestData.instrumentTests[0], test1: 'AAA' }
      ];
      component.applicationSchedulingTestsData = [
        { ...mockTestData.applicationSchedulingTests[0], test1: 'ZZZ' },
        { ...mockTestData.applicationSchedulingTests[0], test1: 'AAA' }
      ];
    });

    it('should sort instrument tests ascending', () => {
      component.instrumentTestsSortDirection = 'desc';
      component.sortInstrumentTests();

      expect(component.instrumentTestsData[0].test1).toBe('AAA');
      expect(component.instrumentTestsData[1].test1).toBe('ZZZ');
      expect(component.instrumentTestsSortDirection).toBe('asc');
    });

    it('should sort instrument tests descending', () => {
      component.instrumentTestsSortDirection = 'asc';
      component.sortInstrumentTests();

      expect(component.instrumentTestsData[0].test1).toBe('ZZZ');
      expect(component.instrumentTestsData[1].test1).toBe('AAA');
      expect(component.instrumentTestsSortDirection).toBe('desc');
    });

    it('should sort application tests ascending', () => {
      component.applicationTestsSortDirection = 'desc';
      component.sortApplicationTests();

      expect(component.applicationSchedulingTestsData[0].test1).toBe('AAA');
      expect(component.applicationSchedulingTestsData[1].test1).toBe('ZZZ');
      expect(component.applicationTestsSortDirection).toBe('asc');
    });

    it('should sort application tests descending', () => {
      component.applicationTestsSortDirection = 'asc';
      component.sortApplicationTests();

      expect(component.applicationSchedulingTestsData[0].test1).toBe('ZZZ');
      expect(component.applicationSchedulingTestsData[1].test1).toBe('AAA');
      expect(component.applicationTestsSortDirection).toBe('desc');
    });
  });

  describe('Row Selection', () => {
    beforeEach(() => {
      component.instrumentTestsData = [mockTestData.instrumentTests[0]];
      component.applicationSchedulingTestsData = [mockTestData.applicationSchedulingTests[0]];
    });

    it('should not allow row selection when in edit mode', () => {
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.editingRowIndex = 0;
      component.onInstrumentRowClick(1);

      expect(component.selectedInstrumentRowIndex).toBe(0); // Still at original
    });
  });

  describe('Edit Mode - Add New Combination', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1'); // Add test ID
      component.instrumentTestsData = [mockTestData.instrumentTests[0]];
      component.applicationSchedulingTestsData = [mockTestData.applicationSchedulingTests[0]];
    });

    it('should enter add mode when Add New Combination is clicked', () => {
      component.onAddNewCombination();

      expect(component.isEditMode).toBeTruthy();
      expect(component.isAddingNewCombination).toBeTruthy();
      expect(component.editingRowIndex).toBe(0);
    });

    it('should create new empty rows for adding', () => {
      component.onAddNewCombination();

      expect(component.editableInstrumentRow).toBeDefined();
      expect(component.editableApplicationRow).toBeDefined();
      expect(component.editableInstrumentRow?.test1).toBe('');
    });

    it('should not allow add when instrument ID is not selected', () => {
      component.instrumentIdControl.setValue('');
      component.onAddNewCombination();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select an Instrument ID');
      expect(component.isEditMode).toBeFalsy();
    });
  });

  describe('Edit Mode - Edit Combination', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.instrumentTestsData = [mockTestData.instrumentTests[0]];
      component.applicationSchedulingTestsData = [mockTestData.applicationSchedulingTests[0]];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
    });

    it('should enter edit mode when Edit Combination is clicked', () => {
      component.onEditCombination();

      expect(component.isEditMode).toBeTruthy();
      expect(component.isAddingNewCombination).toBeFalsy();
      expect(component.editingRowIndex).toBe(0);
    });

    it('should not allow edit when no row is selected', () => {
      component.selectedInstrumentRowIndex = null;
      component.onEditCombination();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select a row to edit');
      expect(component.isEditMode).toBeFalsy();
    });

    it('should not allow edit when instrument ID is not selected', () => {
      component.instrumentIdControl.setValue('');
      component.onEditCombination();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please select an Instrument ID');
      expect(component.isEditMode).toBeFalsy();
    });
  });

  describe('Edit Mode - Cancel', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [mockTestData.instrumentTests[0]];
      component.applicationSchedulingTestsData = [mockTestData.applicationSchedulingTests[0]];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
    });

    it('should exit edit mode when cancel is clicked', () => {
      component.onCancelEdit();

      expect(component.isEditMode).toBeFalsy();
      expect(component.editingRowIndex).toBeNull();
      expect(component.editableInstrumentRow).toBeNull();
      expect(component.editableApplicationRow).toBeNull();
    });

    it('should restore original data when cancel is clicked after changes', () => {
      const originalTest1 = component.instrumentTestsData[0].test1;
      component.editableInstrumentRow!.test1 = 'CHANGED';
      component.onCancelEdit();

      expect(component.instrumentTestsData[0].test1).toBe(originalTest1);
    });
  });

  describe('Field Changes', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [mockTestData.instrumentTests[0]];
      component.applicationSchedulingTestsData = [mockTestData.applicationSchedulingTests[0]];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
      mockApiService.getTestResults.calls.reset();
    });

    it('should load result options when instrument test field changes', fakeAsync(() => {
      component.onInstrumentRowFieldChange('test1', 'LT001');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT001');
      expect(component.instrumentResult1Options().length).toBe(3);
    }));

    it('should load result options when application test field changes', fakeAsync(() => {
      component.onApplicationRowFieldChange('test1', 'LT002');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT002');
      expect(component.appResult1Options().length).toBe(3);
    }));

    it('should update pool size when changed', () => {
      component.onInstrumentRowFieldChange('poolSize', 10);

      expect(component.editableInstrumentRow?.poolSize).toBe(10);
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading instrument IDs fails', fakeAsync(() => {
      // Clear existing data first
      component.instrumentIdOptions.set([]);
      mockApiService.getInstrumentIds.and.returnValue(throwError(() => new Error('API Error')));
      component['loadInstrumentIds']();
      tick();

      expect(component.instrumentIdOptions().length).toBe(0);
    }));
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      // Reset mock to default successful response
      mockApiService.saveBulkTestData.and.returnValue(of({ success: true, message: 'Saved' }));
    });

    it('should save successfully when editing existing combination', fakeAsync(() => {
      component.onEditCombination();
      component.onInstrumentRowFieldChange('test1', 'UPDATED');
      component.onInstrumentRowFieldChange('result1', 'R');
      component.onSave();
      tick();

      expect(mockApiService.saveBulkTestData).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Saved');
      expect(component.isEditMode).toBeFalsy();
    }));

    it('should save successfully when adding new combination', fakeAsync(() => {
      component.onAddNewCombination();
      // Set required effective date before field changes to avoid preserved validation errors
      component.editableApplicationRow!.effectiveDate = new Date(2025, 0, 15);
      component.onInstrumentRowFieldChange('test1', 'NEW');
      component.onInstrumentRowFieldChange('result1', 'R');
      component.onSave();
      tick();

      expect(mockApiService.saveBulkTestData).toHaveBeenCalled();
      expect(mockSnackbarService.showSuccess).toHaveBeenCalled();
    }));

    it('should send correct DTO structure when saving', fakeAsync(() => {
      component.onEditCombination();
      component.editableInstrumentRow!.test1 = 'TEST_A';
      component.editableInstrumentRow!.result1 = 'R';
      component.editableInstrumentRow!.poolSize = 10;
      component.onSave();
      tick();

      const saveCall = mockApiService.saveBulkTestData.calls.mostRecent().args[0];
      expect(saveCall.InstrumentId).toBe('INSTR1');
      expect(saveCall.TestId).toBe('TEST1');
      expect(saveCall.InstrumentTests[0].Test1).toBe('TEST_A');
      expect(saveCall.InstrumentTests[0].Result1).toBe('R');
      expect(saveCall.InstrumentTests[0].PoolSize).toBe(10);
    }));

    it('should clear edit state after successful save', fakeAsync(() => {
      component.onEditCombination();
      component.onSave();
      tick();

      expect(component.editingRowIndex).toBeNull();
      expect(component.editableInstrumentRow).toBeNull();
      expect(component.editableApplicationRow).toBeNull();
      expect(component.isAddingNewCombination).toBeFalsy();
      expect(component.duplicateCombinationError).toBeFalsy();
    }));
  });

  describe('Pool Size Validation', () => {
    it('should handle empty pool size input', () => {
      const event = {
        target: { value: '' }
      } as any;

      component.editableInstrumentRow = { poolSize: 10 } as any;
      component.onPoolSizeInput(event);

      expect(event.target.value).toBe('');
      expect(component.editableInstrumentRow!.poolSize).toBeUndefined();
    });
  });

  describe('Date Formatting', () => {
    it('should format date for display correctly', () => {
      const date = new Date('2025-06-15');
      const formatted = component.formatDate(date);

      expect(formatted).toBeDefined();
      expect(formatted).not.toBe('-');
    });

    it('should format string date correctly', () => {
      const dateStr = '2025-06-15T00:00:00.000Z';
      const formatted = component.formatDate(dateStr);

      expect(formatted).toBeDefined();
      expect(formatted).not.toBe('-');
    });
  });

  describe('Chapter Change Handling', () => {
    it('should clear all data when chapter changes', () => {
      component.instrumentTestsData = [mockTestData.instrumentTests[0]];
      component.applicationSchedulingTestsData = [mockTestData.applicationSchedulingTests[0]];
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');

      component['clearAllData']();

      expect(component.instrumentTestsData.length).toBe(0);
      expect(component.applicationSchedulingTestsData.length).toBe(0);
      expect(component.instrumentIdControl.value).toBeNull();
      expect(component.testIdControl.value).toBeNull();
    });

    it('should reset edit mode when clearing data', () => {
      component.editingRowIndex = 0;
      component.isAddingNewCombination = true;

      component['clearAllData']();

      expect(component.editingRowIndex).toBeNull();
      expect(component.isAddingNewCombination).toBeFalsy();
      expect(component.editableInstrumentRow).toBeNull();
      expect(component.editableApplicationRow).toBeNull();
    });

    it('should reload data when chapter changes', () => {
      spyOn(component as any, 'clearAllData');
      spyOn(component as any, 'loadInstrumentIds');
      spyOn(component as any, 'loadTestOptions');

      component['reloadPageData']();

      expect(component['clearAllData']).toHaveBeenCalled();
      expect(component['loadInstrumentIds']).toHaveBeenCalled();
      expect(component['loadTestOptions']).toHaveBeenCalled();
    });
  });

  describe('Delete Row Functionality', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [mockTestData.instrumentTests[0]];
      component.applicationSchedulingTestsData = [mockTestData.applicationSchedulingTests[0]];
      component.onAddNewCombination();
    });

    it('should delete new row when onDeleteEditingRow is called', () => {
      const initialLength = component.instrumentTestsData.length;
      component.onDeleteEditingRow();

      expect(component.instrumentTestsData.length).toBe(initialLength - 1);
      expect(component.applicationSchedulingTestsData.length).toBe(initialLength - 1);
    });

    it('should clear edit state after deleting row', () => {
      component.onDeleteEditingRow();

      expect(component.editingRowIndex).toBeNull();
      expect(component.editableInstrumentRow).toBeNull();
      expect(component.editableApplicationRow).toBeNull();
      expect(component.isAddingNewCombination).toBeFalsy();
    });
  });

  describe('isNewRow Method', () => {
    it('should return true for new row with auditKey 0', () => {
      component.editableInstrumentRow = { auditKey: 0 } as any;
      expect(component.isNewRow()).toBeTruthy();
    });

    it('should return false for existing row with non-zero auditKey', () => {
      component.editableInstrumentRow = { auditKey: 123 } as any;
      expect(component.isNewRow()).toBeFalsy();
    });

    it('should return false when editableInstrumentRow is null', () => {
      component.editableInstrumentRow = null;
      expect(component.isNewRow()).toBeFalsy();
    });
  });

  describe('Row Selection Toggle', () => {
    beforeEach(() => {
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
    });

    it('should deselect instrument row when same row is clicked again', () => {
      component.onInstrumentRowClick(0);
      expect(component.selectedInstrumentRowIndex).toBe(0);

      component.onInstrumentRowClick(0);
      expect(component.selectedInstrumentRowIndex).toBeNull();
      expect(component.selectedApplicationRowIndex).toBeNull();
    });

    it('should deselect application row when same row is clicked again', () => {
      component.onApplicationRowClick(0);
      expect(component.selectedApplicationRowIndex).toBe(0);

      component.onApplicationRowClick(0);
      expect(component.selectedApplicationRowIndex).toBeNull();
      expect(component.selectedInstrumentRowIndex).toBeNull();
    });

    it('should synchronize row selection between tables', () => {
      component.onInstrumentRowClick(0);
      expect(component.selectedInstrumentRowIndex).toBe(0);
      expect(component.selectedApplicationRowIndex).toBe(0);

      component.instrumentTestsData.push(JSON.parse(JSON.stringify(mockTestData.instrumentTests[0])));
      component.applicationSchedulingTestsData.push(JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0])));

      component.onApplicationRowClick(1);
      expect(component.selectedApplicationRowIndex).toBe(1);
      expect(component.selectedInstrumentRowIndex).toBe(1);
    });
  });

  describe('Add New Combination - Test ID Scenarios', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      // Make sure we have initial data
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
    });

    it('should add new row to beginning of data arrays', () => {
      component.testIdControl.setValue('NEW_TEST');
      const initialLength = component.instrumentTestsData.length;

      component.onAddNewCombination();

      expect(component.instrumentTestsData.length).toBe(initialLength + 1);
      expect(component.instrumentTestsData[0].testId).toBe('NEW_TEST');
    });
  });

  describe('Cancel Edit - Different Scenarios', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
    });

    it('should restore data when canceling edit mode', () => {
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;

      component.onEditCombination();
      const originalTest1 = component.instrumentTestsData[0].test1;
      component.editableInstrumentRow!.test1 = 'MODIFIED';

      component.onCancelEdit();

      expect(component.instrumentTestsData[0].test1).toBe(originalTest1);
    });
  });

  describe('Cascading Dropdowns - All Test Fields', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
      mockApiService.getTestResults.calls.reset();
    });

    it('should load result options for test2 when changed', fakeAsync(() => {
      component.onInstrumentRowFieldChange('test2', 'LT002');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT002');
    }));

    it('should load result options for test3 when changed', fakeAsync(() => {
      component.onInstrumentRowFieldChange('test3', 'LT003');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT003');
    }));

    it('should load result options for test4 when changed', fakeAsync(() => {
      component.onInstrumentRowFieldChange('test4', 'LT004');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT004');
    }));

    it('should load result options for test5 when changed', fakeAsync(() => {
      component.onInstrumentRowFieldChange('test5', 'LT005');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT005');
    }));

    it('should load result options for application defTest4 when changed', fakeAsync(() => {
      component.onApplicationRowFieldChange('defTest4', 'LT004');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT004');
    }));

    it('should load result options for application defTest5 when changed', fakeAsync(() => {
      component.onApplicationRowFieldChange('defTest5', 'LT005');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT005');
    }));

    it('should load result options for application defTest6 when changed', fakeAsync(() => {
      component.onApplicationRowFieldChange('defTest6', 'LT006');
      tick();

      expect(mockApiService.getTestResults).toHaveBeenCalledWith('LT006');
    }));
  });

  describe('validateAllFields', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
    });

    it('should set error when effective date is missing', () => {
      component.editableApplicationRow!.effectiveDate = null;
      component.validateAllFields();

      expect(component.editableApplicationRow!.errors!['effectiveDate']).toBe('Effective date is required');
    });

    it('should set error when Test1 is empty (required)', () => {
      component.editableInstrumentRow!.test1 = '';
      component.validateAllFields();

      expect(component.editableInstrumentRow!.errors!['test1']).toBe('Test 1 is required');
    });

    it('should set error when Result1 is empty (required)', () => {
      component.editableInstrumentRow!.result1 = '';
      component.validateAllFields();

      expect(component.editableInstrumentRow!.errors!['result1']).toBe('Result 1 is required');
    });

    it('should set error when pool size is zero', () => {
      component.editableInstrumentRow!.poolSize = '0';
      component.validateAllFields();

      expect(component.editableInstrumentRow!.errors!['poolSize']).toBe('Pool size must be at least 1');
    });

    it('should set error when pool size is non-numeric', () => {
      component.editableInstrumentRow!.poolSize = 'abc';
      component.validateAllFields();

      expect(component.editableInstrumentRow!.errors!['poolSize']).toBe('Invalid number format');
    });

    it('should allow pool size ">1"', () => {
      component.editableInstrumentRow!.poolSize = '>1';
      component.validateAllFields();

      expect(component.editableInstrumentRow!.errors!['poolSize']).toBeUndefined();
    });

    it('should set error when result exists without test ID (cross-field)', () => {
      component.editableInstrumentRow!.test2 = '';
      component.editableInstrumentRow!.result2 = 'R';
      component.validateAllFields();

      expect(component.editableInstrumentRow!.errors!['result2']).toBe('Result entered without test ID');
    });

    it('should set error when test ID exists without result (cross-field)', () => {
      component.editableInstrumentRow!.test2 = 'LT001';
      component.editableInstrumentRow!.result2 = '';
      component.validateAllFields();

      expect(component.editableInstrumentRow!.errors!['result2']).toBe('Test ID entered without result');
    });

    it('should clear errors when all fields valid', () => {
      component.editableInstrumentRow!.test1 = 'TEST1';
      component.editableInstrumentRow!.result1 = 'R';
      component.editableInstrumentRow!.test2 = '';
      component.editableInstrumentRow!.result2 = '';
      component.editableInstrumentRow!.poolSize = undefined;
      component.editableApplicationRow!.effectiveDate = new Date(2025, 0, 1);
      component.validateAllFields();

      expect(Object.keys(component.editableInstrumentRow!.errors || {}).length).toBe(0);
    });
  });

  describe('hasValidationErrors', () => {
    it('should return true when application row has errors', () => {
      component.editableApplicationRow = { errors: { effectiveDate: 'Required' } } as any;
      expect(component.hasValidationErrors()).toBeTruthy();
    });

    it('should return true when instrument row has errors', () => {
      component.editableInstrumentRow = { errors: { test1: 'Required' } } as any;
      component.editableApplicationRow = { errors: {} } as any;
      expect(component.hasValidationErrors()).toBeTruthy();
    });

    it('should return false when no errors exist', () => {
      component.editableInstrumentRow = { errors: {} } as any;
      component.editableApplicationRow = { errors: {} } as any;
      expect(component.hasValidationErrors()).toBeFalsy();
    });

    it('should return false when editable rows are null', () => {
      component.editableInstrumentRow = null;
      component.editableApplicationRow = null;
      expect(component.hasValidationErrors()).toBeFalsy();
    });
  });

  describe('onEffectiveDateChange', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
    });

    it('should set error when input is empty', () => {
      const event = {
        value: null,
        targetElement: { value: '' }
      } as any;

      component.onEffectiveDateChange(event);

      expect(component.editableApplicationRow!.errors!['effectiveDate']).toBe('Effective date is required');
    });

    it('should set error when date format is invalid', () => {
      const event = {
        value: null,
        targetElement: { value: 'not-a-date' }
      } as any;

      component.onEffectiveDateChange(event);

      expect(component.editableApplicationRow!.errors!['effectiveDate']).toContain('Invalid date format');
    });

    it('should set error when date is in the past for new records', () => {
      component.isAddingNewCombination = true;
      const pastDate = moment().subtract(30, 'days');
      const event = {
        value: pastDate,
        targetElement: { value: pastDate.format('DD-MMM-YYYY') }
      } as any;

      component.onEffectiveDateChange(event);

      expect(component.editableApplicationRow!.errors!['effectiveDate']).toContain('Date cannot be before');
    });
  });

  describe('onTerminationDateChange', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
    });

    it('should allow empty termination date', () => {
      const event = {
        value: null,
        targetElement: { value: '' }
      } as any;

      component.onTerminationDateChange(event);

      expect(component.editableApplicationRow!.errors?.['terminationDate']).toBeUndefined();
    });

    it('should set error when date format is invalid', () => {
      const event = {
        value: null,
        targetElement: { value: 'bad-date' }
      } as any;

      component.onTerminationDateChange(event);

      expect(component.editableApplicationRow!.errors!['terminationDate']).toContain('Invalid date format');
    });

    it('should set error when term date is before effective date', () => {
      component.editableApplicationRow!.effectiveDate = moment('2026-06-01');
      const pastDate = moment('2026-05-01');
      const event = {
        value: pastDate,
        targetElement: { value: pastDate.format('DD-MMM-YYYY') }
      } as any;

      component.onTerminationDateChange(event);

      expect(component.editableApplicationRow!.errors!['terminationDate']).toContain('Termination date cannot be before effective date');
    });
  });

  describe('onEffectiveDateBlur', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
    });

    it('should set required error when input is empty', () => {
      const event = { target: { value: '' } } as any;
      component.onEffectiveDateBlur(event);

      expect(component.editableApplicationRow!.errors!['effectiveDate']).toBe('Effective date is required');
    });

    it('should parse valid date and clear error', () => {
      component.editableApplicationRow!.errors = { effectiveDate: 'some error' };
      const futureDate = moment().add(30, 'days').format('DD-MMM-YYYY');
      const event = { target: { value: futureDate } } as any;
      component.onEffectiveDateBlur(event);

      expect(component.editableApplicationRow!.errors?.['effectiveDate']).toBeUndefined();
    });

    it('should set error on invalid date string', () => {
      const event = { target: { value: 'invalid' } } as any;
      component.onEffectiveDateBlur(event);

      expect(component.editableApplicationRow!.errors!['effectiveDate']).toContain('Invalid date format');
    });
  });

  describe('onTerminationDateBlur', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
    });

    it('should clear error when input is empty (optional field)', () => {
      component.editableApplicationRow!.errors = { terminationDate: 'some error' };
      const event = { target: { value: '' } } as any;
      component.onTerminationDateBlur(event);

      expect(component.editableApplicationRow!.errors?.['terminationDate']).toBeUndefined();
    });

    it('should set error on invalid date string', () => {
      const event = { target: { value: 'bad-date' } } as any;
      component.onTerminationDateBlur(event);

      expect(component.editableApplicationRow!.errors!['terminationDate']).toContain('Invalid date format');
    });

    it('should set error when term date is before effective date', () => {
      component.editableApplicationRow!.effectiveDate = moment('2026-06-01');
      const event = { target: { value: '01-May-2026' } } as any;
      component.onTerminationDateBlur(event);

      expect(component.editableApplicationRow!.errors!['terminationDate']).toContain('Termination date cannot be before effective date');
    });
  });

  describe('onPoolSizeInput - character filtering', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
    });

    it('should filter non-numeric characters', () => {
      const event = { target: { value: '1a2b' } } as any;
      component.onPoolSizeInput(event);

      expect(event.target.value).toBe('12');
      expect(component.editableInstrumentRow!.poolSize).toBe('12');
    });

    it('should allow valid numeric input', () => {
      const event = { target: { value: '123' } } as any;
      component.onPoolSizeInput(event);

      expect(event.target.value).toBe('123');
      expect(component.editableInstrumentRow!.poolSize).toBe('123');
    });

    it('should allow ">" character for ">1" value', () => {
      const event = { target: { value: '>1' } } as any;
      component.onPoolSizeInput(event);

      expect(event.target.value).toBe('>1');
      expect(component.editableInstrumentRow!.poolSize).toBe('>1');
    });

    it('should truncate to 4 characters max', () => {
      const event = { target: { value: '12345' } } as any;
      component.onPoolSizeInput(event);

      expect(event.target.value).toBe('1234');
    });
  });

  describe('onInstrumentIdChange - clearing behavior', () => {
    it('should reset test ID control when instrument changes', () => {
      component.testIdControl.setValue('TEST1');

      component.onInstrumentIdChange('INSTR2');

      expect(component.testIdControl.value).toBeNull();
    });

    it('should load new test IDs when valid instrument selected', () => {
      component.onInstrumentIdChange('INSTR2');

      expect(mockApiService.getInstrumentTestIds).toHaveBeenCalledWith('INSTR2');
    });

    it('should not load test IDs when empty instrument', () => {
      mockApiService.getInstrumentTestIds.calls.reset();
      component.onInstrumentIdChange('');

      expect(mockApiService.getInstrumentTestIds).not.toHaveBeenCalled();
    });
  });

  describe('Save blocked by validation errors', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();
      mockApiService.saveBulkTestData.calls.reset();
    });

    it('should not call API when validation errors exist', () => {
      component.editableInstrumentRow!.test1 = '';
      component.editableInstrumentRow!.result1 = '';
      component.onSave();

      expect(mockApiService.saveBulkTestData).not.toHaveBeenCalled();
    });

    it('should show error snackbar when validation fails', () => {
      component.editableInstrumentRow!.test1 = '';
      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please fix all validation errors before saving');
    });
  });

  describe('API Error Handling - Additional', () => {
    it('should handle error when retrieving test data', fakeAsync(() => {
      mockApiService.getTestData.and.returnValue(throwError(() => new Error('Server Error')));
      component.instrumentIdControl.setValue('INSTR1');
      component.onRetrieve();
      tick();

      expect(component.isRetrieving).toBeFalsy();
    }));
  });

  describe('Cancel Edit - Add mode removes new row', () => {
    it('should remove added row when canceling add mode', () => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];

      const initialLength = component.instrumentTestsData.length;
      component.onAddNewCombination();
      expect(component.instrumentTestsData.length).toBe(initialLength + 1);

      component.onCancelEdit();
      expect(component.instrumentTestsData.length).toBe(initialLength);
      expect(component.applicationSchedulingTestsData.length).toBe(initialLength);
      expect(component.isAddingNewCombination).toBeFalsy();
    });
  });

  describe('onDeleteEditingRow - non-new row', () => {
    it('should not delete existing rows (non-zero auditKey)', () => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('TEST1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
      component.onEditCombination();

      const initialLength = component.instrumentTestsData.length;
      component.onDeleteEditingRow();

      expect(component.instrumentTestsData.length).toBe(initialLength);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('formatDate - edge cases', () => {
    it('should return "-" for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return "-" for undefined', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });
  });

  describe('Edit Combination - Test ID Sync', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.testIdControl.setValue('DIFFERENT_TEST');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
    });

    it('should sync testIdControl with selected row testId when different', () => {
      component.onEditCombination();

      expect(component.testIdControl.value).toBe('TEST1');
    });

    it('should store original row data when entering edit mode', () => {
      component.onEditCombination();

      expect(component.originalInstrumentRow).toBeDefined();
      expect(component.originalApplicationRow).toBeDefined();
      expect(component.originalInstrumentRow?.test1).toBe('TEST1');
    });

    it('should convert dates to Moment objects for editing', () => {
      component.onEditCombination();

      expect(moment.isMoment(component.editableApplicationRow?.effectiveDate)).toBeTrue();
    });
  });

  describe('clearAllResultOptions', () => {
    it('should clear all instrument result option signals', () => {
      component.instrumentResult1Options.set(['R', 'N']);
      component.instrumentResult2Options.set(['R']);
      component.instrumentResult3Options.set(['N']);
      component.instrumentResult4Options.set(['NR']);
      component.instrumentResult5Options.set(['R', 'NR']);

      component['clearAllResultOptions']();

      expect(component.instrumentResult1Options()).toEqual([]);
      expect(component.instrumentResult2Options()).toEqual([]);
      expect(component.instrumentResult3Options()).toEqual([]);
      expect(component.instrumentResult4Options()).toEqual([]);
      expect(component.instrumentResult5Options()).toEqual([]);
    });

    it('should clear all application result option signals', () => {
      component.appResult1Options.set(['R']);
      component.appResult2Options.set(['N']);
      component.appResult3Options.set(['NR']);
      component.appResult4Options.set(['R', 'N']);
      component.appResult5Options.set(['R']);
      component.appResult6Options.set(['NR']);

      component['clearAllResultOptions']();

      expect(component.appResult1Options()).toEqual([]);
      expect(component.appResult2Options()).toEqual([]);
      expect(component.appResult3Options()).toEqual([]);
      expect(component.appResult4Options()).toEqual([]);
      expect(component.appResult5Options()).toEqual([]);
      expect(component.appResult6Options()).toEqual([]);
    });
  });

  describe('onEditCombination - result options clearing', () => {
    beforeEach(() => {
      component.instrumentIdControl.setValue('INSTR1');
      component.instrumentTestsData = [JSON.parse(JSON.stringify(mockTestData.instrumentTests[0]))];
      component.applicationSchedulingTestsData = [JSON.parse(JSON.stringify(mockTestData.applicationSchedulingTests[0]))];
      component.selectedInstrumentRowIndex = 0;
      component.selectedApplicationRowIndex = 0;
    });

    it('should clear stale result options before loading new ones', () => {
      component.instrumentResult1Options.set(['OLD_R', 'OLD_N']);
      component.appResult1Options.set(['OLD_R']);

      component.onEditCombination();

      expect(mockApiService.getTestResults).toHaveBeenCalled();
    });

    it('should load result options for all non-empty test slots', fakeAsync(() => {
      mockApiService.getTestResults.calls.reset();

      component.onEditCombination();
      tick();

      const calls = mockApiService.getTestResults.calls.allArgs();
      const calledTestIds = calls.map((args: any[]) => args[0]);
      expect(calledTestIds).toContain('TEST1');
      expect(calledTestIds).toContain('LT001');
    }));

    it('should clear result options for empty test slots', fakeAsync(() => {
      component.instrumentTestsData[0].test3 = '';
      component.instrumentTestsData[0].test4 = '';
      component.instrumentTestsData[0].test5 = '';
      component.instrumentResult3Options.set(['STALE']);

      component.onEditCombination();
      tick();

      expect(component.instrumentResult3Options()).toEqual([]);
    }));
  });

  describe('Instrument Test inline dropdowns use testOptions', () => {
    it('should use testOptions for filteredInstrTest1 (not testIdOptions)', () => {
      const testOpts = component.testOptions();
      const filtered = component.filteredInstrTest1();

      expect(filtered.length).toBe(testOpts.length);
      if (testOpts.length > 0) {
        expect(filtered[0].testId).toBe(testOpts[0].testId);
      }
    });

    it('should filter instrument test options by search term', () => {
      component.instrTest1Search.set('LT001');

      const filtered = component.filteredInstrTest1();

      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('LT001');
    });

    it('should return all testOptions when search is empty', () => {
      component.instrTest1Search.set('');

      const filtered = component.filteredInstrTest1();

      expect(filtered.length).toBe(component.testOptions().length);
    });
  });
});
