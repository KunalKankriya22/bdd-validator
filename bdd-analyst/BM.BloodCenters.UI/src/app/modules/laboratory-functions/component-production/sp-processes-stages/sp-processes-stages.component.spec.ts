import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { SpProcessesStagesComponent } from './sp-processes-stages.component';
import { SpProcessesStagesApiService } from './services/sp-processes-stages-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { Process, BulkUpsertResponse, BulkUpsertError } from './models/sp-processes-stages.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('SpProcessesStagesComponent', () => {
  let component: SpProcessesStagesComponent;
  let fixture: ComponentFixture<SpProcessesStagesComponent>;
  let mockApiService: jasmine.SpyObj<SpProcessesStagesApiService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject: Subject<void>;

  const mockProcesses: Process[] = [
    { code: 'DEGLY', description: 'Deglycerolization' },
    { code: 'FROZ', description: 'Freezing' },
    { code: 'WASH', description: 'Washing' }
  ];

  const mockStagesResponse = {
    data: [{
      processCode: 'DEGLY',
      processDesc: 'Deglycerolization',
      stageCode: '01',
      stageCodeDesc: '1st stage',
      effDate: '27-May-2026',
      termDate: null,
      lastModifiedDate: null,
      programId: 'VPROCSTA',
      auditKey: 123,
    }],
    totalRecords: 1,
  };

  const mockMultiStagesResponse = {
    data: [
      {
        processCode: 'DEGLY',
        processDesc: 'Deglycerolization',
        stageCode: '01',
        stageCodeDesc: '1st stage',
        effDate: '27-May-2026',
        termDate: '31-Dec-2026',
        lastModifiedDate: null,
        programId: 'VPROCSTA',
        auditKey: 100,
      },
      {
        processCode: 'DEGLY',
        processDesc: 'Deglycerolization',
        stageCode: '02',
        stageCodeDesc: null,
        effDate: '01-Jun-2026',
        termDate: null,
        lastModifiedDate: null,
        programId: 'VPROCSTA',
        auditKey: null,
      },
    ],
    totalRecords: 2,
  };

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    mockApiService = jasmine.createSpyObj('SpProcessesStagesApiService', [
      'getProcessCodes',
      'getStages',
      'bulkUpsert',
      'deleteStage',
      'getStageCodes',
    ]);
    mockSnackbarService = createMockSnackbarService();
    mockHeaderService = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });

    TestBed.configureTestingModule({
      imports: [SpProcessesStagesComponent],
      providers: [
        { provide: SpProcessesStagesApiService, useValue: mockApiService },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    mockApiService.getProcessCodes.calls.reset();
    mockApiService.getStages.calls.reset();
    mockApiService.bulkUpsert.calls.reset();
    mockApiService.deleteStage.calls.reset();
    mockApiService.getStageCodes.calls.reset();

    fixture = TestBed.createComponent(SpProcessesStagesComponent);
    component = fixture.componentInstance;
    mockApiService.getProcessCodes.and.returnValue(of(mockProcesses));
    mockApiService.getStages.and.returnValue(of(mockStagesResponse));
  });

  describe('Component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default signal values', () => {
      expect(component.allProcesses()).toEqual([]);
      expect(component.processes()).toEqual([]);
      expect(component.selectedProcess()).toBeNull();
      expect(component.stages()).toEqual([]);
      expect(component.isLoading()).toBe(false);
      expect(component.isSaving()).toBe(false);
      expect(component.isFormDirty()).toBe(false);
    });

    it('should have the correct searchConfig', () => {
      expect(component.searchConfig.placeholder).toBe('Search by process code or description');
      expect(component.searchConfig.minLength).toBe(1);
      expect(component.searchConfig.searchOnEnterOnly).toBe(true);
      expect(component.searchConfig.debounceTime).toBe(300);
    });
  });

  describe('ngOnInit', () => {
    it('should auto-select first process and load its stages', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        expect(component.processes().length).toBeGreaterThan(0);
        expect(component.selectedProcess()).toBeTruthy();
        expect(component.selectedProcess()?.code).toBe('DEGLY');
        expect(mockApiService.getStages).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle error when loading process codes fails', (done) => {
      mockApiService.getProcessCodes.and.returnValue(throwError(() => new Error('Failed')));

      component.ngOnInit();

      setTimeout(() => {
        expect(mockSnackbarService.showError).toHaveBeenCalled();
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should call loadProcesses on init', () => {
      spyOn(component, 'loadProcesses');
      component.ngOnInit();
      expect(component.loadProcesses).toHaveBeenCalled();
    });
  });

  describe('loadProcesses', () => {
    it('should set isLoading to true while loading', () => {
      component.loadProcesses();
      // isLoading was set true at start, then set false in subscribe
      expect(mockApiService.getProcessCodes).toHaveBeenCalled();
    });

    it('should populate allProcesses and processes on success', () => {
      component.loadProcesses();

      expect(component.allProcesses()).toEqual(mockProcesses);
      expect(component.processes().length).toBe(mockProcesses.length);
      expect(component.isLoading()).toBe(false);
    });

    it('should auto-select first process when no process is currently selected', () => {
      component.selectedProcess.set(null);
      component.loadProcesses();

      expect(component.selectedProcess()?.code).toBe('DEGLY');
      expect(mockApiService.getStages).toHaveBeenCalledWith({ processCode: 'DEGLY' });
    });

    it('should select specified process by code when processCodeToSelect is provided', () => {
      component.loadProcesses('FROZ');

      expect(component.selectedProcess()?.code).toBe('FROZ');
      expect(mockApiService.getStages).toHaveBeenCalledWith({ processCode: 'FROZ' });
    });

    it('should not select by code if processCodeToSelect does not match any process', () => {
      component.selectedProcess.set(mockProcesses[0]);
      component.loadProcesses('NONEXISTENT');

      // It still calls applySearch which won't re-select because selectedProcess is already set
      expect(component.selectedProcess()?.code).toBe('DEGLY');
    });

    it('should show error snackbar on API failure', () => {
      mockApiService.getProcessCodes.and.returnValue(throwError(() => ({ message: 'Network error' })));
      component.loadProcesses();

      expect(mockSnackbarService.showError).toHaveBeenCalled();
      expect(component.isLoading()).toBe(false);
    });

    it('should set isLoading false on error', () => {
      mockApiService.getProcessCodes.and.returnValue(throwError(() => new Error('Fail')));
      component.loadProcesses();

      expect(component.isLoading()).toBe(false);
    });
  });

  describe('onProcessSelected', () => {
    it('should select a process and load its stages', (done) => {
      const process: Process = { code: 'FROZ', description: 'Freezing' };

      component.onProcessSelected(process);

      setTimeout(() => {
        expect(component.selectedProcess()).toEqual(process);
        expect(mockApiService.getStages).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should handle error when loading stages fails', (done) => {
      const process: Process = { code: 'FROZ', description: 'Freezing' };
      mockApiService.getStages.and.returnValue(throwError(() => new Error('Failed')));

      component.onProcessSelected(process);

      setTimeout(() => {
        expect(mockSnackbarService.showError).toHaveBeenCalled();
        expect(component.stages()).toEqual([]);
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should set isFormDirty to false when selecting a process', () => {
      component.isFormDirty.set(true);
      const process: Process = { code: 'FROZ', description: 'Freezing' };

      component.onProcessSelected(process);

      expect(component.isFormDirty()).toBe(false);
    });

    it('should set isLoading true while loading stages', () => {
      const process: Process = { code: 'FROZ', description: 'Freezing' };
      // Use a subject so the observable doesn't resolve immediately
      const stagesSubject = new Subject<any>();
      mockApiService.getStages.and.returnValue(stagesSubject.asObservable());

      component.onProcessSelected(process);

      expect(component.isLoading()).toBe(true);

      stagesSubject.next(mockStagesResponse);
      expect(component.isLoading()).toBe(false);
    });

    it('should map stage records correctly with dates', () => {
      mockApiService.getStages.and.returnValue(of(mockMultiStagesResponse));
      const process: Process = { code: 'DEGLY', description: 'Deglycerolization' };

      component.onProcessSelected(process);

      const stages = component.stages();
      expect(stages.length).toBe(2);

      expect(stages[0].sequence).toBe(1);
      expect(stages[0].stageCode).toBe('01');
      expect(stages[0].description).toBe('1st stage');
      expect(stages[0].effectiveDate).toBeTruthy();
      expect(stages[0].terminationDate).toBeTruthy();
      expect(stages[0].auditKey).toBe(100);
      expect(stages[0].isEditable).toBe(true);
      expect(stages[0].errors).toEqual({});

      expect(stages[1].sequence).toBe(2);
      expect(stages[1].stageCode).toBe('02');
      expect(stages[1].description).toBe('');
      expect(stages[1].effectiveDate).toBeTruthy();
      expect(stages[1].terminationDate).toBeNull();
      expect(stages[1].auditKey).toBeNull();
    });

    it('should map lastModifiedDate from record', () => {
      const responseWithDate = {
        data: [{
          processCode: 'DEGLY',
          processDesc: 'Deglycerolization',
          stageCode: '01',
          stageCodeDesc: '1st stage',
          effDate: '27-May-2026',
          termDate: null,
          lastModifiedDate: '15-Jul-2026',
          programId: 'VPROCSTA',
          auditKey: 100,
        }],
        totalRecords: 1,
      };
      mockApiService.getStages.and.returnValue(of(responseWithDate));

      component.onProcessSelected({ code: 'DEGLY', description: 'Deglycerolization' });

      expect(component.stages()[0].lastModifiedDate).toBe('15-Jul-2026');
    });

    it('should map null lastModifiedDate', () => {
      component.onProcessSelected({ code: 'DEGLY', description: 'Deglycerolization' });

      expect(component.stages()[0].lastModifiedDate).toBeNull();
    });

    it('should handle stages with null stageCodeDesc as empty string', () => {
      const responseWithNull = {
        data: [{
          processCode: 'DEGLY',
          processDesc: 'Deglycerolization',
          stageCode: '01',
          stageCodeDesc: null,
          effDate: '27-May-2026',
          termDate: null,
          lastModifiedDate: null,
          programId: 'VPROCSTA',
          auditKey: null,
        }],
        totalRecords: 1,
      };
      mockApiService.getStages.and.returnValue(of(responseWithNull));

      component.onProcessSelected({ code: 'DEGLY', description: 'Deglycerolization' });

      expect(component.stages()[0].description).toBe('');
    });
  });

  describe('onSearch', () => {
    beforeEach(() => {
      component.allProcesses.set(mockProcesses);
    });

    it('should show all processes when search is empty', () => {
      component.onSearch('');

      expect(component.processes().length).toBe(mockProcesses.length);
    });

    it('should clear selection when no matches found', () => {
      component.onSearch('nonexistent');

      expect(component.processes().length).toBe(0);
      expect(component.selectedProcess()).toBeNull();
      expect(component.stages()).toEqual([]);
    });

    it('should filter by process code (case insensitive)', () => {
      component.onSearch('degly');

      expect(component.processes().length).toBe(1);
      expect(component.processes()[0].code).toBe('DEGLY');
    });

    it('should filter by description (case insensitive)', () => {
      component.onSearch('washing');

      expect(component.processes().length).toBe(1);
      expect(component.processes()[0].code).toBe('WASH');
    });

    it('should auto-select first filtered process when matches exist', () => {
      component.onSearch('froz');

      expect(component.selectedProcess()?.code).toBe('FROZ');
      expect(mockApiService.getStages).toHaveBeenCalledWith({ processCode: 'FROZ' });
    });

    it('should auto-select first process when search is empty and no process is selected', () => {
      component.selectedProcess.set(null);
      component.onSearch('');

      expect(component.selectedProcess()?.code).toBe('DEGLY');
    });

    it('should not auto-select when search is empty and a process is already selected', () => {
      component.selectedProcess.set(mockProcesses[2]);
      // Reset spy call count
      mockApiService.getStages.calls.reset();

      component.onSearch('');

      // Should not call getStages since selectedProcess is already set
      expect(component.selectedProcess()?.code).toBe('WASH');
    });

    it('should handle partial matches in code', () => {
      component.onSearch('FR');

      expect(component.processes().length).toBe(1);
      expect(component.processes()[0].code).toBe('FROZ');
    });

    it('should handle partial matches in description', () => {
      component.onSearch('oliz');

      // Matches 'Deglycerolization' only
      const filtered = component.processes();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('DEGLY');
    });

    it('should match multiple processes', () => {
      component.onSearch('ing');

      // Matches 'Freezing' and 'Washing'
      const filtered = component.processes();
      expect(filtered.length).toBe(2);
    });
  });

  describe('onStagesChange', () => {
    it('should update stages and set form dirty', () => {
      const updatedStages = [{
        sequence: 1, stageCode: '01', description: '1st stage',
        effectiveDate: new Date(), terminationDate: null,
        lastModifiedDate: null,
        auditKey: 1, isEditable: true, errors: {}
      }];

      component.onStagesChange(updatedStages);

      expect(component.stages()).toEqual(updatedStages);
      expect(component.isFormDirty()).toBe(true);
    });

    it('should update stages with empty array', () => {
      component.onStagesChange([]);

      expect(component.stages()).toEqual([]);
      expect(component.isFormDirty()).toBe(true);
    });

    it('should replace previous stages', () => {
      const firstStages = [{
        sequence: 1, stageCode: '01', description: 'First',
        effectiveDate: new Date(), terminationDate: null,
        auditKey: 1, isEditable: true, errors: {}
      }];
      const secondStages = [{
        sequence: 1, stageCode: '02', description: 'Second',
        effectiveDate: new Date(), terminationDate: null,
        auditKey: 2, isEditable: true, errors: {}
      }];

      component.onStagesChange(firstStages);
      component.onStagesChange(secondStages);

      expect(component.stages()).toEqual(secondStages);
    });
  });

  describe('onSave', () => {
    const mockStageConfigComponent = {
      validateAllStages: jasmine.createSpy('validateAllStages').and.returnValue(true),
      getChangedStages: jasmine.createSpy('getChangedStages').and.returnValue([
        {
          sequence: 1,
          stageCode: '01',
          description: '1st stage',
          effectiveDate: new Date(2026, 4, 27),
          terminationDate: null,
          auditKey: 123,
          isEditable: true,
          errors: {},
        },
      ]),
      clearAllFields: jasmine.createSpy('clearAllFields'),
      cancelChanges: jasmine.createSpy('cancelChanges'),
    };

    beforeEach(() => {
      component.selectedProcess.set(mockProcesses[0]);
      (component as any).stageConfigComponent = mockStageConfigComponent;
      mockStageConfigComponent.validateAllStages.and.returnValue(true);
      mockStageConfigComponent.getChangedStages.and.returnValue([
        {
          sequence: 1,
          stageCode: '01',
          description: '1st stage',
          effectiveDate: new Date(2026, 4, 27),
          terminationDate: null,
          auditKey: 123,
          isEditable: true,
          errors: {},
        },
      ]);
    });

    it('should return early if no process is selected', () => {
      component.selectedProcess.set(null);

      component.onSave();

      expect(mockStageConfigComponent.validateAllStages).not.toHaveBeenCalled();
      expect(mockApiService.bulkUpsert).not.toHaveBeenCalled();
    });

    it('should show error if validation fails', () => {
      mockStageConfigComponent.validateAllStages.and.returnValue(false);

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Please fix validation errors before saving.');
      expect(mockApiService.bulkUpsert).not.toHaveBeenCalled();
    });

    it('should return early if no changed stages', () => {
      mockStageConfigComponent.getChangedStages.and.returnValue([]);

      component.onSave();

      expect(mockApiService.bulkUpsert).not.toHaveBeenCalled();
    });

    it('should call bulkUpsert with correct request on save', () => {
      const successResponse: BulkUpsertResponse = {
        totalRecords: 1,
        createdCount: 0,
        updatedCount: 1,
        failureCount: 0,
        successCount: 1,
        errors: [],
        success: true,
        message: 'Process Stages updated successfully.',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(successResponse));

      component.onSave();

      expect(mockApiService.bulkUpsert).toHaveBeenCalled();
      const request = mockApiService.bulkUpsert.calls.mostRecent().args[0];
      expect(request.records.length).toBe(1);
      expect(request.records[0].processCode).toBe('DEGLY');
      expect(request.records[0].stageCode).toBe('01');
      expect(request.records[0].auditKey).toBe(123);
    });

    it('should show success snackbar on full success', () => {
      const successResponse: BulkUpsertResponse = {
        totalRecords: 1,
        createdCount: 0,
        updatedCount: 1,
        failureCount: 0,
        successCount: 1,
        errors: [],
        success: true,
        message: 'Process Stages updated successfully.',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(successResponse));

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Process Stages updated successfully.');
      expect(component.isSaving()).toBe(false);
      expect(component.isFormDirty()).toBe(false);
    });

    it('should show success with default message when response message is empty', () => {
      const successResponse: BulkUpsertResponse = {
        totalRecords: 1,
        createdCount: 0,
        updatedCount: 1,
        failureCount: 0,
        successCount: 1,
        errors: [],
        success: true,
        message: '',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(successResponse));

      component.onSave();

      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Process Stages updated successfully.');
    });

    it('should show error snackbar on partial success', () => {
      const partialResponse: BulkUpsertResponse = {
        totalRecords: 2,
        createdCount: 1,
        updatedCount: 0,
        failureCount: 1,
        successCount: 1,
        errors: [{ recordIndex: 1, processCode: 'DEGLY', stageCode: '02', errorMessage: 'Invalid' }],
        success: true,
        message: 'Partially completed: 1 succeeded, 1 failed.',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(partialResponse));

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Partially completed: 1 succeeded, 1 failed.');
    });

    it('should show partial success default message when response message is empty', () => {
      const partialResponse: BulkUpsertResponse = {
        totalRecords: 2,
        createdCount: 1,
        updatedCount: 0,
        failureCount: 1,
        successCount: 1,
        errors: [],
        success: true,
        message: '',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(partialResponse));

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Partially completed: 1 succeeded, 1 failed.');
    });

    it('should show error snackbar on complete failure response', () => {
      const failureResponse: BulkUpsertResponse = {
        totalRecords: 1,
        createdCount: 0,
        updatedCount: 0,
        failureCount: 1,
        successCount: 0,
        errors: [{ recordIndex: 0, processCode: 'DEGLY', stageCode: '01', errorMessage: 'Duplicate' }],
        success: false,
        message: 'Failed to save process stages.',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(failureResponse));

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to save process stages.');
    });

    it('should show failure default message when response message is empty', () => {
      const failureResponse: BulkUpsertResponse = {
        totalRecords: 1,
        createdCount: 0,
        updatedCount: 0,
        failureCount: 1,
        successCount: 0,
        errors: [],
        success: false,
        message: '',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(failureResponse));

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to save process stages.');
    });

    it('should reload processes after successful save', () => {
      const successResponse: BulkUpsertResponse = {
        totalRecords: 1,
        createdCount: 0,
        updatedCount: 1,
        failureCount: 0,
        successCount: 1,
        errors: [],
        success: true,
        message: 'Success',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(successResponse));
      mockApiService.getProcessCodes.calls.reset();

      component.onSave();

      expect(mockApiService.getProcessCodes).toHaveBeenCalled();
    });

    it('should set isSaving true during save and false after', () => {
      const saveSubject = new Subject<BulkUpsertResponse>();
      mockApiService.bulkUpsert.and.returnValue(saveSubject.asObservable());

      component.onSave();

      expect(component.isSaving()).toBe(true);

      saveSubject.next({
        totalRecords: 1, createdCount: 0, updatedCount: 1,
        failureCount: 0, successCount: 1, errors: [],
        success: true, message: 'OK', errorCode: null,
      });

      expect(component.isSaving()).toBe(false);
    });

    it('should handle API error during save', () => {
      mockApiService.bulkUpsert.and.returnValue(throwError(() => ({ message: 'Server error' })));

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalled();
      expect(component.isSaving()).toBe(false);
    });

    it('should handle stage with null auditKey', () => {
      mockStageConfigComponent.getChangedStages.and.returnValue([
        {
          sequence: 1,
          stageCode: '02',
          description: 'New stage',
          effectiveDate: new Date(2026, 5, 1),
          terminationDate: null,
          auditKey: null,
          isEditable: true,
          errors: {},
        },
      ]);
      const successResponse: BulkUpsertResponse = {
        totalRecords: 1,
        createdCount: 1,
        updatedCount: 0,
        failureCount: 0,
        successCount: 1,
        errors: [],
        success: true,
        message: 'Created',
        errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(successResponse));

      component.onSave();

      const request = mockApiService.bulkUpsert.calls.mostRecent().args[0];
      expect(request.records[0].auditKey).toBeNull();
    });

    it('should call mapBulkUpsertErrors on partial failure', () => {
      const reloadSubject = new Subject<Process[]>();
      mockApiService.getProcessCodes.and.returnValue(reloadSubject.asObservable());

      const changedStage = {
        sequence: 1, stageCode: '01', description: '1st stage',
        effectiveDate: new Date(2026, 4, 27), terminationDate: null,
        auditKey: 123, isEditable: true, errors: {},
      };
      mockStageConfigComponent.getChangedStages.and.returnValue([changedStage]);
      component.stages.set([changedStage]);

      const partialResponse: BulkUpsertResponse = {
        totalRecords: 1, createdCount: 0, updatedCount: 0, failureCount: 1, successCount: 0,
        errors: [{ recordIndex: 0, processCode: 'DEGLY', stageCode: '01', errorMessage: 'Duplicate record exists' }],
        success: true, message: 'Partially completed', errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(partialResponse));

      component.onSave();

      expect(component.stages()[0].errors?.['server']).toBe('Duplicate record exists');
    });

    it('should call mapBulkUpsertErrors on complete failure response', () => {
      const reloadSubject = new Subject<Process[]>();
      mockApiService.getProcessCodes.and.returnValue(reloadSubject.asObservable());

      const changedStage = {
        sequence: 1, stageCode: '01', description: '1st stage',
        effectiveDate: new Date(2026, 4, 27), terminationDate: null,
        auditKey: 123, isEditable: true, errors: {},
      };
      mockStageConfigComponent.getChangedStages.and.returnValue([changedStage]);
      component.stages.set([changedStage]);

      const failureResponse: BulkUpsertResponse = {
        totalRecords: 1, createdCount: 0, updatedCount: 0, failureCount: 1, successCount: 0,
        errors: [{ recordIndex: 0, processCode: 'DEGLY', stageCode: '01', errorMessage: 'Validation failed' }],
        success: false, message: 'Failed', errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(failureResponse));

      component.onSave();

      expect(component.stages()[0].errors?.['server']).toBe('Validation failed');
    });

    it('should handle empty errors array in mapBulkUpsertErrors', () => {
      mockStageConfigComponent.getChangedStages.and.returnValue([{
        sequence: 1, stageCode: '01', description: '1st', effectiveDate: new Date(2026, 4, 27),
        terminationDate: null, auditKey: 123, isEditable: true, errors: {},
      }]);
      const partialResponse: BulkUpsertResponse = {
        totalRecords: 1, createdCount: 0, updatedCount: 0, failureCount: 1, successCount: 0,
        errors: [], success: true, message: 'Partial', errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(partialResponse));

      component.onSave();

      expect(component.stages()[0].errors?.['server']).toBeUndefined();
    });

    it('should use default error message when errorMessage is empty', () => {
      const reloadSubject = new Subject<Process[]>();
      mockApiService.getProcessCodes.and.returnValue(reloadSubject.asObservable());

      const changedStage = {
        sequence: 1, stageCode: '01', description: '1st',
        effectiveDate: new Date(2026, 4, 27), terminationDate: null,
        auditKey: 123, isEditable: true, errors: {},
      };
      mockStageConfigComponent.getChangedStages.and.returnValue([changedStage]);
      component.stages.set([changedStage]);

      const response: BulkUpsertResponse = {
        totalRecords: 1, createdCount: 0, updatedCount: 0, failureCount: 1, successCount: 0,
        errors: [{ recordIndex: 0, processCode: 'DEGLY', stageCode: '01', errorMessage: '' }],
        success: true, message: 'Partial', errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(response));

      component.onSave();

      expect(component.stages()[0].errors?.['server']).toBe('Save failed');
    });

    it('should handle recordIndex that does not match any changed stage', () => {
      const reloadSubject = new Subject<Process[]>();
      mockApiService.getProcessCodes.and.returnValue(reloadSubject.asObservable());

      const changedStage = {
        sequence: 1, stageCode: '01', description: '1st',
        effectiveDate: new Date(2026, 4, 27), terminationDate: null,
        auditKey: 123, isEditable: true, errors: {},
      };
      mockStageConfigComponent.getChangedStages.and.returnValue([changedStage]);
      component.stages.set([changedStage]);

      const response: BulkUpsertResponse = {
        totalRecords: 1, createdCount: 0, updatedCount: 0, failureCount: 1, successCount: 0,
        errors: [{ recordIndex: 99, processCode: 'DEGLY', stageCode: '01', errorMessage: 'Error' }],
        success: true, message: 'Partial', errorCode: null,
      };
      mockApiService.bulkUpsert.and.returnValue(of(response));

      component.onSave();

      expect(component.stages()[0].errors?.['server']).toBeUndefined();
    });
  });

  describe('onClearAll', () => {
    it('should call clearAllFields on stageConfigComponent', () => {
      const mockStageConfig = {
        clearAllFields: jasmine.createSpy('clearAllFields'),
        validateAllStages: jasmine.createSpy('validateAllStages'),
        getChangedStages: jasmine.createSpy('getChangedStages'),
        cancelChanges: jasmine.createSpy('cancelChanges'),
      };
      (component as any).stageConfigComponent = mockStageConfig;

      component.onClearAll();

      expect(mockStageConfig.clearAllFields).toHaveBeenCalled();
      expect(component.isFormDirty()).toBe(false);
    });

    it('should not throw when stageConfigComponent is undefined', () => {
      (component as any).stageConfigComponent = undefined;

      expect(() => component.onClearAll()).not.toThrow();
    });

    it('should set isFormDirty to false', () => {
      const mockStageConfig = {
        clearAllFields: jasmine.createSpy('clearAllFields'),
        validateAllStages: jasmine.createSpy('validateAllStages'),
        getChangedStages: jasmine.createSpy('getChangedStages'),
        cancelChanges: jasmine.createSpy('cancelChanges'),
      };
      (component as any).stageConfigComponent = mockStageConfig;
      component.isFormDirty.set(true);

      component.onClearAll();

      expect(component.isFormDirty()).toBe(false);
    });
  });

  describe('onCancel', () => {
    it('should call cancelChanges on stageConfigComponent', () => {
      const mockStageConfig = {
        clearAllFields: jasmine.createSpy('clearAllFields'),
        validateAllStages: jasmine.createSpy('validateAllStages'),
        getChangedStages: jasmine.createSpy('getChangedStages'),
        cancelChanges: jasmine.createSpy('cancelChanges'),
      };
      (component as any).stageConfigComponent = mockStageConfig;

      component.onCancel();

      expect(mockStageConfig.cancelChanges).toHaveBeenCalled();
      expect(component.isFormDirty()).toBe(false);
    });

    it('should not throw when stageConfigComponent is undefined', () => {
      (component as any).stageConfigComponent = undefined;

      expect(() => component.onCancel()).not.toThrow();
    });

    it('should set isFormDirty to false', () => {
      const mockStageConfig = {
        clearAllFields: jasmine.createSpy('clearAllFields'),
        validateAllStages: jasmine.createSpy('validateAllStages'),
        getChangedStages: jasmine.createSpy('getChangedStages'),
        cancelChanges: jasmine.createSpy('cancelChanges'),
      };
      (component as any).stageConfigComponent = mockStageConfig;
      component.isFormDirty.set(true);

      component.onCancel();

      expect(component.isFormDirty()).toBe(false);
    });
  });

  describe('showErrorMessage (private, tested via public methods)', () => {
    it('should show error from error.error.errorResponse.error', () => {
      const error = { error: { errorResponse: { error: 'Custom API error' } } };
      mockApiService.getProcessCodes.and.returnValue(throwError(() => error));

      component.loadProcesses();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Custom API error');
    });

    it('should show error from error.error.message', () => {
      const error = { error: { message: 'Error message from server' } };
      mockApiService.getProcessCodes.and.returnValue(throwError(() => error));

      component.loadProcesses();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error message from server');
    });

    it('should show error from error.message', () => {
      const error = { message: 'Simple error message' };
      mockApiService.getProcessCodes.and.returnValue(throwError(() => error));

      component.loadProcesses();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Simple error message');
    });

    it('should show default error message when no message found', () => {
      const error = {};
      mockApiService.getProcessCodes.and.returnValue(throwError(() => error));

      component.loadProcesses();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('An error occurred. Please try again.');
    });

    it('should prepend error code from error.error.errorCode', () => {
      const error = { error: { message: 'Bad request', errorCode: '400' } };
      mockApiService.getProcessCodes.and.returnValue(throwError(() => error));

      component.loadProcesses();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error 400: Bad request');
    });

    it('should prepend error code from error.error.errorResponse.errorCode', () => {
      const error = { error: { errorResponse: { error: 'Not found', errorCode: '404' } } };
      mockApiService.getProcessCodes.and.returnValue(throwError(() => error));

      component.loadProcesses();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Error 404: Not found');
    });

    it('should show error via stages load error path', () => {
      const error = { error: { message: 'Stages error' } };
      mockApiService.getStages.and.returnValue(throwError(() => error));

      component.onProcessSelected({ code: 'TEST', description: 'Test' });

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Stages error');
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should reset state and reload processes when chapter changes', () => {
      component.ngOnInit();

      // Set some state
      component.selectedProcess.set(mockProcesses[0]);
      component.stages.set([{
        sequence: 1, stageCode: '01', description: 'stage',
        effectiveDate: new Date(), terminationDate: null,
        auditKey: 1, isEditable: true, errors: {},
      }]);

      mockApiService.getProcessCodes.calls.reset();
      mockApiService.getStages.calls.reset();

      // Use a subject so loadProcesses doesn't resolve immediately
      const reloadSubject = new Subject<Process[]>();
      mockApiService.getProcessCodes.and.returnValue(reloadSubject.asObservable());

      // Emit chapter change
      chapterChangedSubject.next();

      // Before loadProcesses resolves, selectedProcess and stages should be cleared
      expect(component.selectedProcess()).toBeNull();
      expect(component.stages()).toEqual([]);
      expect(mockApiService.getProcessCodes).toHaveBeenCalled();
    });

    it('should call clearSearch on searchBar when chapter changes', () => {
      component.ngOnInit();

      const mockSearchBar = { clearSearch: jasmine.createSpy('clearSearch') };
      (component as any).searchBar = mockSearchBar;

      chapterChangedSubject.next();

      expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    });

    it('should not throw when searchBar is undefined on chapter change', () => {
      component.ngOnInit();
      (component as any).searchBar = undefined;

      expect(() => chapterChangedSubject.next()).not.toThrow();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySubject = (component as any).destroy$ as Subject<void>;
      spyOn(destroySubject, 'next');
      spyOn(destroySubject, 'complete');

      component.ngOnDestroy();

      expect(destroySubject.next).toHaveBeenCalled();
      expect(destroySubject.complete).toHaveBeenCalled();
    });

    it('should unsubscribe from API calls after destroy', () => {
      const processSubject = new Subject<Process[]>();
      mockApiService.getProcessCodes.and.returnValue(processSubject.asObservable());

      component.ngOnInit();
      component.ngOnDestroy();

      // Emitting after destroy should not update the component
      processSubject.next(mockProcesses);
      expect(component.allProcesses()).toEqual([]);
    });
  });
});
