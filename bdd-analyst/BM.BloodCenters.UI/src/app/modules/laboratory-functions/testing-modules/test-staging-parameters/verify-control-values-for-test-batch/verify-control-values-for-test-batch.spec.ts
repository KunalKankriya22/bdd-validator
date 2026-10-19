import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { VerifyControlValuesForTestBatchComponent } from './verify-control-values-for-test-batch';
import { VerifyControlValuesForTestBatchService } from './verify-control-values-for-test-batch.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import moment from 'moment';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('VerifyControlValuesForTestBatchComponent', () => {
  let serviceSpy: any;
  let component: VerifyControlValuesForTestBatchComponent;
  let fixture: ComponentFixture<VerifyControlValuesForTestBatchComponent>;
  let service: jasmine.SpyObj<VerifyControlValuesForTestBatchService>;
  let snackbarService: jasmine.SpyObj<SnackbarService>;

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('VerifyControlValuesForTestBatchService', [
      'getPendingBatches',
      'getBatchTests',
      'getTestRuns',
      'getTestKits',
      'getParmValuesLov',
      'getBatchDetail',
      'getParameters',
      'getReagents',
      'getHoldingTests',
      'saveParameters',
      'confirmBatch',
      'loadTests',
      'loadRuns',
      'loadKits',
      'loadBatchData',
      'lockBatch',
      'unlockBatch',
      'validateBatch',
      'saveBatch',
      'getHistoricalResults',
      'confirmNonAcceptable',
    ]);

    const snackbarSpy = createMockSnackbarService();

      TestBed.configureTestingModule({
imports: [
        VerifyControlValuesForTestBatchComponent,
        MatDialogModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
        { provide: VerifyControlValuesForTestBatchService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        PageHeaderService,
      ],
    });

    });

  beforeEach(() => {

      serviceSpy.getPendingBatches.calls.reset();

      serviceSpy.getBatchTests.calls.reset();

      serviceSpy.getTestRuns.calls.reset();

      serviceSpy.getTestKits.calls.reset();

      serviceSpy.getParmValuesLov.calls.reset();

      serviceSpy.getBatchDetail.calls.reset();

      serviceSpy.getParameters.calls.reset();

      serviceSpy.getReagents.calls.reset();

      serviceSpy.getHoldingTests.calls.reset();

      serviceSpy.saveParameters.calls.reset();

      serviceSpy.confirmBatch.calls.reset();

      serviceSpy.loadTests?.calls?.reset();
      serviceSpy.loadRuns?.calls?.reset();
      serviceSpy.loadKits?.calls?.reset();
      serviceSpy.loadBatchData?.calls?.reset();
      serviceSpy.lockBatch?.calls?.reset();
      serviceSpy.unlockBatch?.calls?.reset();
      serviceSpy.validateBatch?.calls?.reset();
      serviceSpy.saveBatch?.calls?.reset();
      serviceSpy.getHistoricalResults?.calls?.reset();
      serviceSpy.confirmNonAcceptable?.calls?.reset();

    fixture = TestBed.createComponent(VerifyControlValuesForTestBatchComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(VerifyControlValuesForTestBatchService) as jasmine.SpyObj<VerifyControlValuesForTestBatchService>;
    snackbarService = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;

    // Initialize form so filterForm is available for all tests
    component['initForm']();

    });

  it('should load pending test batches on init', async () => {
    const mockBatches = [
      { tbId: '030422-2301P16', testName: 'CMV', unitCount: 10 },
    ];
    service.getPendingBatches.and.returnValue(Promise.resolve(mockBatches));

    await component.ngOnInit();
    await fixture.whenStable();

    expect(service.getPendingBatches).toHaveBeenCalled();
    expect(component.testBatches()).toEqual(mockBatches);
  });

  it('should initialize filter form with required validators', () => {
    expect(component.filterForm).toBeDefined();
    expect(component.filterForm.get('testBatchId')?.hasError('required')).toBeTrue();
    expect(component.filterForm.get('testId')?.hasError('required')).toBeTrue();
  });

  it('should load batch tests when test batch selected', async () => {
    const mockTests = [{ testId: 'CMV', testName: 'Cytomegalovirus' }];
    service.getBatchTests.and.returnValue(Promise.resolve(mockTests));

    component['setupFormListeners']();
    component.filterForm.patchValue({ testBatchId: '030422-2301P16' });
    await fixture.whenStable();

    expect(service.getBatchTests).toHaveBeenCalledWith('030422-2301P16', '2');
    expect(component.tests()).toEqual(mockTests);
  });

  it('should retrieve batch detail and parameters', async () => {
    const mockDetail = {
      tbId: '030422-2301P16',
      testId: 'CMV',
      testName: 'Cytomegalovirus',
      unitCount: 10,
      tech2Reqd: 'Y',
    };
    const mockParams = [
      {
        sequence: 1,
        parmCode: 'DATE',
        description: 'Review Date',
        parmValue: '',
        datatype: 'DATETIME',
      },
    ];

    service.getBatchDetail.and.returnValue(Promise.resolve(mockDetail));
    service.getParameters.and.returnValue(Promise.resolve(mockParams));
    service.getTestRuns.and.returnValue(Promise.resolve([]));
    service.getTestKits.and.returnValue(Promise.resolve([]));

    component.filterForm.patchValue({
      testBatchId: '030422-2301P16',
      testId: 'CMV',
    });

    await component.retrieve();
    await fixture.whenStable();

    expect(service.getBatchDetail).toHaveBeenCalledWith('030422-2301P16', 'CMV');
    expect(service.getParameters).toHaveBeenCalled();
    expect(component.batchDetail()).toEqual(mockDetail);
    expect(component.parameters()).toEqual(mockParams);
    expect(component.parameterForms.size).toBe(1);
  });

  it('should detect Tech2 requirement', async () => {
    const mockDetail = {
      tbId: '030422-2301P16',
      testId: 'CMV',
      tech2Reqd: 'Y',
    };

    service.getBatchDetail.and.returnValue(Promise.resolve(mockDetail));
    service.getParameters.and.returnValue(Promise.resolve([]));
    service.getTestRuns.and.returnValue(Promise.resolve([]));
    service.getTestKits.and.returnValue(Promise.resolve([]));

    component.filterForm.patchValue({
      testBatchId: '030422-2301P16',
      testId: 'CMV',
    });

    await component.retrieve();
    await fixture.whenStable();

    expect(component.requiresTech2()).toBeTrue();
  });

  it('should save parameters successfully', async () => {
    const mockDetail = {
      tbId: '030422-2301P16',
      testId: 'CMV',
    };
    const mockParams = [
      {
        sequence: 1,
        parmCode: 'DATE',
        description: 'Review Date',
        parmValue: '11-JAN-2025',
        datatype: 'DATE',
      },
    ];

    component.batchDetail.set(mockDetail as any);
    component.parameters.set(mockParams as any);
    component.filterForm.patchValue({
      testBatchId: '030422-2301P16',
      testId: 'CMV',
    });

    // Create parameter form and set acceptFlag + value change to satisfy canSave()
    const paramForm = component['createParameterFormGroup'](mockParams[0] as any);
    paramForm.patchValue({
      acceptFlag: 'Y',
      firstTech: 'TESTUSER',
      parmValue: 'new-value',
    }, { emitEvent: false });
    component.parameterForms.set('DATE', paramForm);

    service.saveParameters.and.returnValue(
      Promise.resolve({ success: true, message: 'Success', data: [{ parmCheckFlag: 'Y' }] })
    );

    await component.save();
    await fixture.whenStable();

    expect(service.saveParameters).toHaveBeenCalled();
    expect(snackbarService.showSuccess).toHaveBeenCalledWith(
      jasmine.stringContaining('verified successfully')
    );
  });

  it('should detect not acceptable values', () => {
    const mockParams = [
      {
        sequence: 1,
        parmCode: 'TEMP',
        parmValue: '100',
        acceptFlag: 'N',
      },
    ];

    component.parameters.set(mockParams as any);

    expect(component.hasNotAcceptableValues()).toBeTrue();
  });

  it('should clear all form data', () => {
    component.batchDetail.set({
      tbId: '030422-2301P16',
      testId: 'CMV',
    } as any);
    component.parameters.set([{ sequence: 1, parmCode: 'DATE' }] as any);
    component.filterForm.patchValue({
      testBatchId: '030422-2301P16',
      testId: 'CMV',
    });

    component.clearAll();

    expect(component.batchDetail()).toBeNull();
    expect(component.parameters()).toEqual([]);
    expect(component.filterForm.value.testBatchId).toBeNull();
  });

  it('should handle pagination', () => {
    const mockParams = Array.from({ length: 50 }, (_, i) => ({
      sequence: i + 1,
      parmCode: `PARM${i + 1}`,
      description: `Parameter ${i + 1}`,
    }));

    component.parameters.set(mockParams as any);
    component.pageSize.set(25);
    component.pageIndex.set(0);
    fixture.detectChanges();

    const paginated = component.paginatedParameters();
    expect(paginated.length).toBe(25);
    expect(paginated[0].sequence).toBe(1);

    component.pageIndex.set(1);
    fixture.detectChanges();

    const paginated2 = component.paginatedParameters();
    expect(paginated2.length).toBe(25);
    expect(paginated2[0].sequence).toBe(26);
  });

  // === validateParameterValue ===

  describe('validateParameterValue', () => {
    it('should return empty string for null value', () => {
      expect(component['validateParameterValue'](null, 'NUMBER', 0, 100)).toBe('');
    });

    it('should return Y for NUMBER within range', () => {
      expect(component['validateParameterValue']('50', 'NUMBER', 0, 100)).toBe('Y');
    });

    it('should return N for NUMBER above max', () => {
      expect(component['validateParameterValue']('150', 'NUMBER', 0, 100)).toBe('N');
    });

    it('should return N for NUMBER below min', () => {
      expect(component['validateParameterValue']('-5', 'NUMBER', 0, 100)).toBe('N');
    });

    it('should return N for invalid number string', () => {
      expect(component['validateParameterValue']('abc', 'NUMBER', 0, 100)).toBe('N');
    });

    it('should return Y for NUMBER with no min/max constraints', () => {
      expect(component['validateParameterValue']('999', 'NUMBER', null, null)).toBe('Y');
    });

    it('should return Y for DEVICE datatype', () => {
      expect(component['validateParameterValue']('DEV001', 'DEVICE', null, null)).toBe('Y');
    });

    it('should return Y for REAGENT datatype', () => {
      expect(component['validateParameterValue']('REA001', 'REAGENT', null, null)).toBe('Y');
    });

    it('should return Y for DATETIME with valid date', () => {
      expect(component['validateParameterValue']('2025-01-01T10:00:00', 'DATETIME', null, null)).toBe('Y');
    });

    it('should return N for DATETIME with invalid date', () => {
      expect(component['validateParameterValue']('not-a-date', 'DATETIME', null, null)).toBe('N');
    });

    it('should return Y for unknown datatype', () => {
      expect(component['validateParameterValue']('value', 'UNKNOWN', null, null)).toBe('Y');
    });
  });

  // === Simple accessors and computed properties ===

  it('should get parameter form by parmCode', () => {
    const form = component['fb'].group({ test: ['value'] });
    component.parameterForms.set('CODE1', form);
    expect(component.getParameterForm('CODE1')).toBe(form);
    expect(component.getParameterForm('NONEXIST')).toBeUndefined();
  });

  it('should get parameter value control', () => {
    const form = component['fb'].group({ parmValue: ['testval'] });
    component.parameterForms.set('CODE1', form);
    expect(component.getParameterValueControl('CODE1').value).toBe('testval');
    expect(component.getParameterValueControl('NONEXIST').value).toBe('');
  });

  it('should get parameter confirm control', () => {
    const form = component['fb'].group({ confirmFlag: [true] });
    component.parameterForms.set('CODE1', form);
    expect(component.getParameterConfirmControl('CODE1').value).toBe(true);
    expect(component.getParameterConfirmControl('NONEXIST').value).toBe(false);
  });

  it('should detect Tech2 mode from parameters', () => {
    component.parameters.set([{ techNo: 2, parmCode: 'P1' }] as any[]);
    expect(component['isTech2Mode']()).toBeTrue();

    component.parameters.set([{ techNo: 1, parmCode: 'P1' }] as any[]);
    expect(component['isTech2Mode']()).toBeFalse();

    component.parameters.set([]);
    expect(component['isTech2Mode']()).toBeFalse();
  });

  it('should filter parameters by search term', () => {
    component.parameters.set([
      { parmCode: 'TEMP', description: 'Temperature' },
      { parmCode: 'HUM', description: 'Humidity' },
    ] as any[]);

    component.searchTerm.set('temp');
    expect(component['filteredParameters']().length).toBe(1);
    expect(component['filteredParameters']()[0].parmCode).toBe('TEMP');

    component.searchTerm.set('');
    expect(component['filteredParameters']().length).toBe(2);
  });

  it('should filter by description', () => {
    component.parameters.set([
      { parmCode: 'P1', description: 'Temperature' },
      { parmCode: 'P2', description: 'Humidity' },
    ] as any[]);

    component.searchTerm.set('humid');
    expect(component['filteredParameters']().length).toBe(1);
    expect(component['filteredParameters']()[0].parmCode).toBe('P2');
  });

  // === Simple action methods ===

  it('should handle page change event', () => {
    component.onPageChange({ pageIndex: 2, pageSize: 50 } as any);
    expect(component.pageIndex()).toBe(2);
    expect(component.pageSize()).toBe(50);
  });

  it('should handle selection change', () => {
    const selected = [{ parmCode: 'P1' }] as any[];
    component.onSelectionChange(selected);
    expect(component.selectedParameters()).toEqual(selected);
  });

  it('should cancel and clear all', () => {
    spyOn(component, 'clearAll');
    component.cancel();
    expect(component.clearAll).toHaveBeenCalled();
  });

  it('should clean up on destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });

  it('should update parameter in signal', () => {
    component.parameters.set([
      { parmCode: 'P1', parmValue: 'old', sequence: 1 },
      { parmCode: 'P2', parmValue: 'val', sequence: 2 },
    ] as any[]);

    component['updateParameter']('P1', { parmValue: 'new' } as any);

    expect(component.parameters()[0].parmValue).toBe('new');
    expect(component.parameters()[1].parmValue).toBe('val');
  });

  it('should not update parameter when parmCode not found', () => {
    component.parameters.set([{ parmCode: 'P1', parmValue: 'old' }] as any[]);
    component['updateParameter']('NONEXIST', { parmValue: 'new' } as any);
    expect(component.parameters()[0].parmValue).toBe('old');
  });

  // === onSortChange ===

  it('should set ascending sort', () => {
    service.getParameters.and.returnValue(Promise.resolve([]));
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.onSortChange({ column: 'sequence', direction: 'A' } as any);
    expect(component['sortColumn']).toBe('sequence');
    expect(component['sortDirection']).toBe('ASC');
  });

  it('should set descending sort', () => {
    service.getParameters.and.returnValue(Promise.resolve([]));
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.onSortChange({ column: 'sequence', direction: 'D' } as any);
    expect(component['sortColumn']).toBe('sequence');
    expect(component['sortDirection']).toBe('DESC');
  });

  it('should clear sort on default direction', () => {
    service.getParameters.and.returnValue(Promise.resolve([]));
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.onSortChange({ column: 'sequence', direction: 'default' } as any);
    expect(component['sortColumn']).toBeUndefined();
    expect(component['sortDirection']).toBeUndefined();
  });

  // === validateAndSetFirstTech ===

  it('should validate and set first tech for NUMBER parameter', () => {
    const param = { parmCode: 'TEMP', parmValue: '', datatype: 'NUMBER', acceptMin: 0, acceptMax: 100, sequence: 1 } as any;
    component.parameters.set([param]);
    const form = component['createParameterFormGroup'](param);
    form.patchValue({ parmValue: '50' }, { emitEvent: false });
    component.parameterForms.set('TEMP', form);
    component['userId'] = 'TESTUSER';

    component['validateAndSetFirstTech']('TEMP');

    expect(form.get('firstTech')?.value).toBe('TESTUSER');
    expect(form.get('acceptFlag')?.value).toBe('Y');
  });

  it('should not set first tech when form not found', () => {
    component['validateAndSetFirstTech']('NONEXIST');
    // Should not throw
  });

  it('should not validate when value matches original', () => {
    const param = { parmCode: 'TEMP', parmValue: '50', datatype: 'NUMBER', sequence: 1 } as any;
    component.parameters.set([param]);
    const form = component['createParameterFormGroup'](param);
    component.parameterForms.set('TEMP', form);
    component['userId'] = 'TESTUSER';

    component['validateAndSetFirstTech']('TEMP');
    // firstTech should remain empty since value hasn't changed
    expect(form.get('firstTech')?.value).toBe('');
  });

  it('should trigger validation on date change', () => {
    spyOn(component as any, 'validateAndSetFirstTech');
    component.onDateChange('PARM1');
    expect(component['validateAndSetFirstTech']).toHaveBeenCalledWith('PARM1');
  });

  it('should trigger validation on date blur', () => {
    spyOn(component as any, 'validateAndSetFirstTech');
    component.onDateBlur('PARM1');
    expect(component['validateAndSetFirstTech']).toHaveBeenCalledWith('PARM1');
  });

  // === dateFilter ===

  it('should allow null date in dateFilter', () => {
    expect(component.dateFilter(null)).toBeTrue();
  });

  // === createParameterFormGroup ===

  it('should create parameter form for DATE type with valid date', () => {
    const param = { sequence: 1, parmCode: 'DATE1', parmValue: '06-23-26', datatype: 'DATE', acceptFlag: 'Y', firstTech: 'USER1' } as any;
    const form = component['createParameterFormGroup'](param);
    expect(form.get('parmCode')?.value).toBe('DATE1');
    expect(form.get('datatype')?.value).toBe('DATE');
  });

  it('should create parameter form for DATE type with invalid date', () => {
    const param = { sequence: 1, parmCode: 'DATE2', parmValue: 'invalid-date-format', datatype: 'DATE' } as any;
    const form = component['createParameterFormGroup'](param);
    expect(form.get('parmValue')?.value).toBe('');
  });

  it('should create parameter form for NUMBER type with min/max validators', () => {
    const param = { sequence: 1, parmCode: 'NUM1', parmValue: '50', datatype: 'NUMBER', acceptMin: 0, acceptMax: 100 } as any;
    const form = component['createParameterFormGroup'](param);
    expect(form.get('parmCode')?.value).toBe('NUM1');
    form.get('parmValue')?.setValue('200');
    expect(form.get('parmValue')?.hasError('max')).toBeTrue();
  });

  // === save error paths ===

  it('should not save when canSave is false', async () => {
    await component.save();
    expect(snackbarService.showError).toHaveBeenCalledWith('Cannot save: invalid form state');
    expect(service.saveParameters).not.toHaveBeenCalled();
  });

  it('should handle save with parmCheckFlag N', async () => {
    component.batchDetail.set({ tbId: 'TB1', testId: 'T1' } as any);
    component.parameters.set([{ parmCode: 'P1', parmValue: 'old' }] as any[]);
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    const paramForm = component['createParameterFormGroup']({ parmCode: 'P1', parmValue: 'old', datatype: 'NUMBER' } as any);
    paramForm.patchValue({ acceptFlag: 'Y', firstTech: 'USER', parmValue: 'new' }, { emitEvent: false });
    component.parameterForms.set('P1', paramForm);

    service.saveParameters.and.returnValue(Promise.resolve({ success: true, message: 'OK', data: [{ parmCheckFlag: 'N' }] }));
    service.getParameters.and.returnValue(Promise.resolve([{ parmCode: 'P1', parmValue: 'new', acceptFlag: 'N' }]));

    await component.save();

    expect(component.batchSaved()).toBeTrue();
    expect(snackbarService.showSuccess).toHaveBeenCalledWith('Parameters are saved successfully for verification');
  });

  it('should handle save with unknown parmCheckFlag', async () => {
    component.batchDetail.set({ tbId: 'TB1', testId: 'T1' } as any);
    component.parameters.set([{ parmCode: 'P1', parmValue: 'old' }] as any[]);
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    const paramForm = component['createParameterFormGroup']({ parmCode: 'P1', parmValue: 'old', datatype: 'NUMBER' } as any);
    paramForm.patchValue({ acceptFlag: 'Y', firstTech: 'USER', parmValue: 'new' }, { emitEvent: false });
    component.parameterForms.set('P1', paramForm);

    service.saveParameters.and.returnValue(Promise.resolve({ success: true, message: 'OK', data: [{ parmCheckFlag: 'X' }] }));
    service.getParameters.and.returnValue(Promise.resolve([]));

    await component.save();

    expect(component.batchSaved()).toBeTrue();
  });

  it('should handle save failure response with error code', async () => {
    component.batchDetail.set({ tbId: 'TB1', testId: 'T1' } as any);
    component.parameters.set([{ parmCode: 'P1', parmValue: 'old' }] as any[]);
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' }, { emitEvent: false });
    const paramForm = component['createParameterFormGroup']({ parmCode: 'P1', parmValue: 'old', datatype: 'NUMBER' } as any);
    paramForm.patchValue({ acceptFlag: 'Y', firstTech: 'USER', parmValue: 'new' }, { emitEvent: false });
    component.parameterForms.set('P1', paramForm);

    service.saveParameters.and.returnValue(Promise.resolve({ success: false, message: 'Value invalid', errorCode: '9005' }));

    await component.save();

    expect(snackbarService.showError).toHaveBeenCalledWith('Error 9005: Value invalid');
  }, 15000);

  it('should handle save failure response without error code', async () => {
    component.batchDetail.set({ tbId: 'TB1', testId: 'T1' } as any);
    component.parameters.set([{ parmCode: 'P1', parmValue: 'old' }] as any[]);
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' }, { emitEvent: false });
    const paramForm = component['createParameterFormGroup']({ parmCode: 'P1', parmValue: 'old', datatype: 'NUMBER' } as any);
    paramForm.patchValue({ acceptFlag: 'Y', firstTech: 'USER', parmValue: 'new' }, { emitEvent: false });
    component.parameterForms.set('P1', paramForm);

    service.saveParameters.and.returnValue(Promise.resolve({ success: false, message: 'Validation failed' }));

    await component.save();

    expect(snackbarService.showError).toHaveBeenCalledWith('Validation failed');
  }, 15000);

  it('should handle save exception with error code', async () => {
    component.batchDetail.set({ tbId: 'TB1', testId: 'T1' } as any);
    component.parameters.set([{ parmCode: 'P1', parmValue: 'old' }] as any[]);
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' }, { emitEvent: false });
    const paramForm = component['createParameterFormGroup']({ parmCode: 'P1', parmValue: 'old', datatype: 'NUMBER' } as any);
    paramForm.patchValue({ acceptFlag: 'Y', firstTech: 'USER', parmValue: 'new' }, { emitEvent: false });
    component.parameterForms.set('P1', paramForm);

    service.saveParameters.and.returnValue(Promise.reject({ error: { errorCode: '9005', message: 'Server error' } }));

    await component.save();

    expect(snackbarService.showError).toHaveBeenCalledWith('Error 9005: Server error');
    expect(component.saving()).toBeFalse();
  }, 15000);

  it('should handle save exception without error code', async () => {
    component.batchDetail.set({ tbId: 'TB1', testId: 'T1' } as any);
    component.parameters.set([{ parmCode: 'P1', parmValue: 'old' }] as any[]);
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' }, { emitEvent: false });
    const paramForm = component['createParameterFormGroup']({ parmCode: 'P1', parmValue: 'old', datatype: 'NUMBER' } as any);
    paramForm.patchValue({ acceptFlag: 'Y', firstTech: 'USER', parmValue: 'new' }, { emitEvent: false });
    component.parameterForms.set('P1', paramForm);

    service.saveParameters.and.returnValue(Promise.reject({ error: { error: 'Generic error' } }));

    await component.save();

    expect(snackbarService.showError).toHaveBeenCalledWith('Generic error');
    expect(component.saving()).toBeFalse();
  }, 15000);

  // === confirmBatch ===

  it('should show error when confirming without batch selection', async () => {
    component.filterForm.patchValue({ testBatchId: '', testId: '' });
    await component.confirmBatch();
    expect(snackbarService.showError).toHaveBeenCalledWith('Test batch and test must be selected');
  });

  it('should confirm batch successfully without non-acceptable values', async () => {
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.parameters.set([]);
    service.confirmBatch.and.returnValue(Promise.resolve({ success: true, message: 'OK' }));

    await component.confirmBatch();

    expect(service.confirmBatch).toHaveBeenCalledWith('TB1', 'T1');
    expect(snackbarService.showSuccess).toHaveBeenCalledWith(jasmine.stringContaining('verified successfully'));
  });

  it('should handle confirmBatch failure with error code', async () => {
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.parameters.set([]);
    service.confirmBatch.and.returnValue(Promise.resolve({ success: false, message: 'Error', errorCode: '4001' }));

    await component.confirmBatch();

    expect(snackbarService.showError).toHaveBeenCalledWith('Error 4001: Error');
    expect(component.confirmingBatch()).toBeFalse();
  });

  it('should handle confirmBatch failure without error code', async () => {
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.parameters.set([]);
    service.confirmBatch.and.returnValue(Promise.resolve({ success: false, message: 'Confirmation failed' }));

    await component.confirmBatch();

    expect(snackbarService.showError).toHaveBeenCalledWith('Confirmation failed');
  });

  it('should handle confirmBatch exception with error code', async () => {
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.parameters.set([]);
    service.confirmBatch.and.returnValue(Promise.reject({ error: { errorCode: '5001', message: 'DB error' } }));

    await component.confirmBatch();

    expect(snackbarService.showError).toHaveBeenCalledWith('Error 5001: DB error');
    expect(component.confirmingBatch()).toBeFalse();
  });

  it('should handle confirmBatch exception without error code', async () => {
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.parameters.set([]);
    service.confirmBatch.and.returnValue(Promise.reject({ error: {} }));

    await component.confirmBatch();

    expect(snackbarService.showError).toHaveBeenCalledWith('Failed to confirm batch');
    expect(component.confirmingBatch()).toBeFalse();
  });

  it('should show dialog when confirming with non-acceptable values', async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' }, { emitEvent: false });
    component.parameters.set([{ parmCode: 'P1', acceptFlag: 'N' }] as any[]);
    service.confirmBatch.and.returnValue(Promise.resolve({ success: true, message: 'OK' }));

    await component.confirmBatch();

    expect(component['dialog'].open).toHaveBeenCalled();
    expect(service.confirmBatch).toHaveBeenCalled();
  }, 15000);

  it('should not confirm when dialog is cancelled', async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(false));
    spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);

    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' }, { emitEvent: false });
    component.parameters.set([{ parmCode: 'P1', acceptFlag: 'N' }] as any[]);

    await component.confirmBatch();

    expect(component['dialog'].open).toHaveBeenCalled();
    expect(service.confirmBatch).not.toHaveBeenCalled();
  }, 15000);

  // === placeGroupInterdiction ===

  it('should navigate to place group interdiction', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate');

    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.placeGroupInterdiction();

    expect(router.navigate).toHaveBeenCalledWith(
      ['/laboratory-functions/place-group-interdiction'],
      jasmine.objectContaining({
        queryParams: jasmine.objectContaining({ mode: 'TBID', value: 'TB1' }),
      })
    );
  });

  it('should show error when placing group interdiction without batch', () => {
    component.filterForm.patchValue({ testBatchId: '' });
    component.placeGroupInterdiction();
    expect(snackbarService.showError).toHaveBeenCalledWith('Please select a test batch first');
  });

  // === viewReagents / viewUnits ===

  it('should open reagents dialog when kit selected', async () => {
    const dialogOpenSpy = spyOn(component['dialog'], 'open').and.returnValue({} as any);

    component.filterForm.get('testBatchId')?.setValue('TB1', { emitEvent: false });
    component.filterForm.get('testId')?.setValue('T1', { emitEvent: false });
    component.filterForm.get('testKitId')?.setValue('KIT1', { emitEvent: false });
    await component.viewReagents();

    expect(dialogOpenSpy).toHaveBeenCalled();
  });

  it('should show error when viewing reagents without kit', async () => {
    component.filterForm.get('testKitId')?.setValue('', { emitEvent: false });
    await component.viewReagents();
    expect(snackbarService.showError).toHaveBeenCalledWith('Please select a test kit first');
  });

  it('should open units dialog', async () => {
    const dialogOpenSpy = spyOn(component['dialog'], 'open').and.returnValue({} as any);

    component.filterForm.get('testBatchId')?.setValue('TB1', { emitEvent: false });
    component.filterForm.get('testId')?.setValue('T1', { emitEvent: false });
    await component.viewUnits();

    expect(dialogOpenSpy).toHaveBeenCalled();
  });

  it('should show error when viewing units without selection', async () => {
    component.filterForm.get('testBatchId')?.setValue('', { emitEvent: false });
    component.filterForm.get('testId')?.setValue('', { emitEvent: false });
    await component.viewUnits();
    expect(snackbarService.showError).toHaveBeenCalledWith('Please select a test batch and test first');
  });

  // === onSearch ===

  it('should search parameters when data is loaded', async () => {
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.batchDetail.set({ tbId: 'TB1' } as any);
    component.parameters.set([{ parmCode: 'P1' }] as any[]);
    service.getParameters.and.returnValue(Promise.resolve([{ parmCode: 'P1', description: 'Test', datatype: 'NUMBER' }]));

    await component.onSearch('test');

    expect(component.searchTerm()).toBe('test');
    expect(component.pageIndex()).toBe(0);
    expect(service.getParameters).toHaveBeenCalled();
  });

  it('should not search when no data loaded', async () => {
    component.filterForm.patchValue({ testBatchId: '', testId: '' });
    service.getParameters.calls.reset();

    await component.onSearch('test');

    expect(component.searchTerm()).toBe('test');
    expect(service.getParameters).not.toHaveBeenCalled();
  });

  it('should handle search error', async () => {
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    component.batchDetail.set({ tbId: 'TB1' } as any);
    component.parameters.set([{ parmCode: 'P1' }] as any[]);
    service.getParameters.and.returnValue(Promise.reject(new Error('Search failed')));

    await component.onSearch('test');

    expect(snackbarService.showError).toHaveBeenCalledWith('Failed to search parameters');
    expect(component.loading()).toBeFalse();
  });

  // === retrieve error paths ===

  it('should not retrieve when form is invalid', async () => {
    component.filterForm.patchValue({ testBatchId: '', testId: '' });
    await component.retrieve();
    expect(snackbarService.showError).toHaveBeenCalledWith('Please select Test Batch and Test');
    expect(service.getBatchDetail).not.toHaveBeenCalled();
  });

  it('should handle retrieve error', async () => {
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    service.getBatchDetail.and.returnValue(Promise.reject({ error: { message: 'Not found' } }));

    await component.retrieve();

    expect(snackbarService.showError).toHaveBeenCalled();
    expect(component.batchDetail()).toBeNull();
    expect(component.loading()).toBeFalse();
  });

  it('should load reagents during retrieve when kit is specified', async () => {
    const mockDetail = { tbId: 'TB1', testId: 'T1', testKitId: 'KIT1', tech2Reqd: 'N' } as any;
    service.getBatchDetail.and.returnValue(Promise.resolve(mockDetail));
    service.getParameters.and.returnValue(Promise.resolve([]));
    service.getTestRuns.and.returnValue(Promise.resolve([]));
    service.getTestKits.and.returnValue(Promise.resolve([]));
    service.getReagents.and.returnValue(Promise.resolve([{ reagentId: 'R1' }]));

    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    await component.retrieve();

    expect(service.getReagents).toHaveBeenCalledWith('TB1', 'T1', 'KIT1');
  });

  // === loadInitialData error ===

  it('should handle loadInitialData error', async () => {
    service.getPendingBatches.and.returnValue(Promise.reject(new Error('Load failed')));
    await component['loadInitialData']();
    expect(snackbarService.showError).toHaveBeenCalledWith('Failed to load test batches');
    expect(component.loading()).toBeFalse();
  });

  // === filter dropdown methods ===

  it('should filter test batch options by search text', () => {
    component.testBatches.set([{ tbId: 'BATCH1' }, { tbId: 'OTHER' }] as any[]);
    component.testBatchSearchControl.setValue('batch');
    component['filterTestBatchOptions']();
    expect(component['filteredTestBatches']().length).toBe(1);
  });

  it('should show all test batches when search is empty', () => {
    component.testBatches.set([{ tbId: 'A' }, { tbId: 'B' }] as any[]);
    component.testBatchSearchControl.setValue('');
    component['filterTestBatchOptions']();
    expect(component['filteredTestBatches']().length).toBe(2);
  });

  it('should filter test options', () => {
    component.tests.set([{ testId: 'CMV' }, { testId: 'HIV' }] as any[]);
    component.testSearchControl.setValue('cmv');
    component['filterTestOptions']();
    expect(component['filteredTests']().length).toBe(1);
  });

  it('should show all tests when search is empty', () => {
    component.tests.set([{ testId: 'CMV' }, { testId: 'HIV' }] as any[]);
    component.testSearchControl.setValue('');
    component['filterTestOptions']();
    expect(component['filteredTests']().length).toBe(2);
  });

  it('should filter run options', () => {
    component.runs.set([{ runId: 'RUN1' }, { runId: 'RUN2' }] as any[]);
    component.runSearchControl.setValue('run1');
    component['filterRunOptions']();
    expect(component['filteredRuns']().length).toBe(1);
  });

  it('should show all runs when search is empty', () => {
    component.runs.set([{ runId: 'RUN1' }, { runId: 'RUN2' }] as any[]);
    component.runSearchControl.setValue('');
    component['filterRunOptions']();
    expect(component['filteredRuns']().length).toBe(2);
  });

  it('should filter kit options by testKitId', () => {
    component.kits.set([
      { testKitId: 'KIT1', kitLotNumber: 'LOT1' },
      { testKitId: 'KIT2', kitLotNumber: 'LOT2' },
    ] as any[]);
    component.kitSearchControl.setValue('kit1');
    component['filterKitOptions']();
    expect(component['filteredKits']().length).toBe(1);
  });

  it('should filter kit options by lotNumber', () => {
    component.kits.set([
      { testKitId: 'KIT1', kitLotNumber: 'LOT1' },
      { testKitId: 'KIT2', kitLotNumber: 'LOT2' },
    ] as any[]);
    component.kitSearchControl.setValue('lot2');
    component['filterKitOptions']();
    expect(component['filteredKits']().length).toBe(1);
  });

  it('should show all kits when search is empty', () => {
    component.kits.set([{ testKitId: 'K1', kitLotNumber: 'L1' }, { testKitId: 'K2', kitLotNumber: 'L2' }] as any[]);
    component.kitSearchControl.setValue('');
    component['filterKitOptions']();
    expect(component['filteredKits']().length).toBe(2);
  });

  // === canConfirmBatch computed ===

  it('should return false for canConfirmBatch when no batch data', () => {
    expect(component['canConfirmBatch']()).toBeFalse();
  });

  it('should return true for canConfirmBatch when all conditions met', () => {
    component.batchDetail.set({ tbId: 'TB1' } as any);
    component.parameters.set([{ parmCode: 'P1', acceptFlag: 'Y' }] as any[]);
    component.selectedParameters.set([{ parmCode: 'P1', acceptFlag: 'Y' }] as any[]);
    const form = component['fb'].group({ acceptFlag: ['Y'] });
    component.parameterForms.set('P1', form);

    expect(component['canConfirmBatch']()).toBeTrue();
  });

  it('should return false for canConfirmBatch when parameters are pending', () => {
    component.batchDetail.set({ tbId: 'TB1' } as any);
    component.parameters.set([{ parmCode: 'P1', acceptFlag: '' }] as any[]);
    component.selectedParameters.set([{ parmCode: 'P1', acceptFlag: '' }] as any[]);
    const form = component['fb'].group({ acceptFlag: [''] });
    component.parameterForms.set('P1', form);

    expect(component['canConfirmBatch']()).toBeFalse();
  });

  // === canSave computed ===

  it('should return false for canSave when no changes made', () => {
    component.batchDetail.set({ tbId: 'TB1' } as any);
    component.parameters.set([{ parmCode: 'P1', parmValue: 'val', acceptFlag: 'Y', firstTech: 'USER' }] as any[]);
    component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
    const form = component['createParameterFormGroup']({ parmCode: 'P1', parmValue: 'val', datatype: 'NUMBER', acceptFlag: 'Y', firstTech: 'USER' } as any);
    component.parameterForms.set('P1', form);

    expect(component['canSave']()).toBeFalse();
  });

  // === onDateInput ===

  it('should handle date input event', () => {
    const param = { parmCode: 'DATE1', parmValue: '', datatype: 'DATE', sequence: 1 } as any;
    const form = component['createParameterFormGroup'](param);
    component.parameterForms.set('DATE1', form);

    const event = { target: { value: '01-JAN-2025' } } as any;
    component['onDateInput'](event, 'DATE1');
    // Should not throw
  });

  it('should handle date input when form not found', () => {
    const event = { target: { value: '01-JAN-2025' } } as any;
    component['onDateInput'](event, 'NONEXIST');
    // Should not throw
  });

  // === getDateError ===

  it('should return empty string for getDateError when form not found', () => {
    expect(component['getDateError']('NONEXIST')).toBe('');
  });

  it('should return empty string for getDateError when control has no error', () => {
    const param = { parmCode: 'DATE1', parmValue: '', datatype: 'DATE', sequence: 1 } as any;
    const form = component['createParameterFormGroup'](param);
    component.parameterForms.set('DATE1', form);

    expect(component['getDateError']('DATE1')).toBe('');
  });

  // === getDateErrorMatcher ===

  it('should return an ErrorStateMatcher', () => {
    const matcher = component['getDateErrorMatcher']('DATE1');
    expect(matcher).toBeDefined();
    expect(matcher.isErrorState).toBeDefined();
  });

  // === State Preservation ===

  describe('State Preservation', () => {
    beforeEach(() => {
      // Clear sessionStorage before each test
      sessionStorage.clear();
    });

    it('should save state to sessionStorage', () => {
      const mockDetail = { tbId: 'TB1', testId: 'T1' };
      const mockParams = [{ parmCode: 'P1', parmValue: 'val1' }];

      component.batchDetail.set(mockDetail as any);
      component.parameters.set(mockParams as any);
      component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
      component.pageIndex.set(2);
      component.pageSize.set(50);
      component.searchTerm.set('test');

      component['saveState']();

      const savedState = sessionStorage.getItem('TSIENTPM_state');
      expect(savedState).toBeTruthy();

      const state = JSON.parse(savedState!);
      expect(state.filterForm.testBatchId).toBe('TB1');
      expect(state.filterForm.testId).toBe('T1');
      expect(state.pageIndex).toBe(2);
      expect(state.pageSize).toBe(50);
      expect(state.searchTerm).toBe('test');
      expect(state.batchDetail).toEqual(mockDetail);
      expect(state.parameters).toEqual(mockParams);
      expect(state.timestamp).toBeDefined();
    });

    it('should save state before navigating to Place Interdiction', () => {
      spyOn<any>(component, 'saveState');
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');

      component.filterForm.patchValue({ testBatchId: 'TB1', testId: 'T1' });
      component.placeGroupInterdiction();

      expect(component['saveState']).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalled();
    });

    it('should restore state from sessionStorage on init', async () => {
      const savedState = {
        filterForm: { testBatchId: 'TB1', testId: 'T1', runId: 'R1', testKitId: 'K1' },
        pageIndex: 1,
        pageSize: 50,
        searchTerm: 'search',
        batchDetail: { tbId: 'TB1', testId: 'T1' },
        parameters: [{ parmCode: 'P1', parmValue: 'val' }],
        selectedParameters: [],
        parameterForms: [],
        timestamp: new Date().getTime()
      };

      sessionStorage.setItem('TSIENTPM_state', JSON.stringify(savedState));

      service.getBatchTests.and.returnValue(Promise.resolve([{ testId: 'T1', testName: 'Test 1' }]));
      service.getTestRuns.and.returnValue(Promise.resolve([{ runId: 'R1', runName: 'Run 1' }]));
      service.getTestKits.and.returnValue(Promise.resolve([{ testKitId: 'K1', kitName: 'Kit 1' }]));
      service.getBatchDetail.and.returnValue(Promise.resolve({
        tbId: 'TB1',
        testId: 'T1',
        tech2Reqd: 'N',
        parmType: 'STD',
        runId: 'R1',
        testKitId: 'K1'
      } as any));
      service.getParameters.and.returnValue(Promise.resolve([{ parmCode: 'P1', parmValue: 'val' }]));
      service.lockBatch.and.returnValue(Promise.resolve({ success: true, data: { lockedBy: 'USER' } }));
      service.validateBatch.and.returnValue(Promise.resolve({ success: true }));

      await component['restoreState']();
      await fixture.whenStable();

      // State should be cleared after restoration
      expect(sessionStorage.getItem('TSIENTPM_state')).toBeNull();

      // Check restored values
      expect(component.filterForm.value.testBatchId).toBe('TB1');
      expect(component.filterForm.value.testId).toBe('T1');
      expect(component.filterForm.value.runId).toBe('R1');
      expect(component.filterForm.value.testKitId).toBe('K1');
      expect(component.pageIndex()).toBe(1);
      expect(component.pageSize()).toBe(50);
      expect(component.searchTerm()).toBe('search');

      // Verify all LOVs were loaded
      expect(service.getBatchTests).toHaveBeenCalledWith('TB1', '2');
      expect(service.getBatchDetail).toHaveBeenCalled();
      expect(service.getTestRuns).toHaveBeenCalledWith('T1', 'STD');
      expect(service.getTestKits).toHaveBeenCalledWith('T1');
    });

    it('should not restore stale state (older than 30 minutes)', async () => {
      const oldTimestamp = new Date().getTime() - (31 * 60 * 1000); // 31 minutes ago
      const savedState = {
        filterForm: { testBatchId: 'TB1', testId: 'T1', runId: '', testKitId: '' },
        pageIndex: 1,
        pageSize: 50,
        searchTerm: 'search',
        timestamp: oldTimestamp
      };

      sessionStorage.setItem('TSIENTPM_state', JSON.stringify(savedState));

      await component['restoreState']();

      // Form should not be restored
      expect(component.filterForm.value.testBatchId).toBe('');
      expect(component.filterForm.value.testId).toBe('');
    });

    it('should handle restore state error gracefully', async () => {
      sessionStorage.setItem('TSIENTPM_state', 'invalid-json');

      // Should not throw
      await component['restoreState']();

      expect(component.filterForm.value.testBatchId).toBe('');
    });

    it('should not restore when no saved state exists', async () => {
      await component['restoreState']();

      // Form should remain empty
      expect(component.filterForm.value.testBatchId).toBe('');
      expect(component.filterForm.value.testId).toBe('');
    });

    it('should handle save state error gracefully', () => {
      // Force an error by making the state un-serializable
      const circularRef: any = {};
      circularRef.self = circularRef;
      component.batchDetail.set(circularRef);

      // Should not throw
      expect(() => component['saveState']()).not.toThrow();
    });
  });
});
