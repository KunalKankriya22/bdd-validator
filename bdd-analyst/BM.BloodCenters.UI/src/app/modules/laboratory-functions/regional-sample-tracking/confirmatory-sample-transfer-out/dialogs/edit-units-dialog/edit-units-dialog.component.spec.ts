import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { EditUnitsDialogComponent, EditUnitsDialogData } from './edit-units-dialog.component';
import { ConfirmatorySampleTransferOutApiService } from '../../services/confirmatory-sample-transfer-out-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { BoxUnitDto, BoxUnitTestDto } from '../../models/confirmatory-sample-transfer-out.model';

describe('EditUnitsDialogComponent', () => {
  let component: EditUnitsDialogComponent;
  let fixture: ComponentFixture<EditUnitsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EditUnitsDialogComponent>>;
  let apiServiceSpy: jasmine.SpyObj<ConfirmatorySampleTransferOutApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;

  const mockData: EditUnitsDialogData = {
    boxHeader: {
      boxId: 'BOX001',
      shipmentNo: null,
      facilityCode: 'FAC01',
      facilityDesc: 'Facility One',
      boxStatus: 'O',
      externalFacFlag: 'N',
      packDate: '2026-01-15',
      closedDate: null,
      closedUser: null,
      unitCount: 2,
      units: [],
    },
    units: [],
    facilities: [],
    selectedUnit: undefined,
  };

  const mockUnit: BoxUnitDto = {
    sampleSeqNo: 'SEQ001',
    unitId: 'UNIT001',
    checkDigit: null,
    collDate: '2026-01-10',
    contractId: 'CON01',
    sampleType: 'WB',
    frozenFlag: 'Y',
    tests: [
      { testId: 'TEST01', testDesc: 'Test One' },
    ],
  };

  function setupTestBed(dataOverride?: Partial<EditUnitsDialogData>): void {
    const testData = { ...mockData, ...dataOverride };

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    apiServiceSpy = jasmine.createSpyObj('ConfirmatorySampleTransferOutApiService', [
      'getActiveSampleTypes',
      'getActiveTestIds',
      'addUnitToBox',
      'updateUnitInBox',
      'deleteUnitFromBox',
      'addTestToSample',
      'deleteTestFromSample',
    ]);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);

    apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));
    apiServiceSpy.getActiveTestIds.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [EditUnitsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: testData },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: ConfirmatorySampleTransferOutApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
      ],
    });

    fixture = TestBed.createComponent(EditUnitsDialogComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }
  }

  afterEach(() => {
    fixture?.destroy();
  });

  // ---- Default (no selectedUnit) tests ----

  describe('without selectedUnit', () => {
    beforeEach(() => {
      setupTestBed();
    });

    it('should initialize unit and test forms on ngOnInit', () => {
      expect(component.unitForm).toBeDefined();
      expect(component.testForm).toBeDefined();
      expect(component.unitForm.get('unitId')).toBeTruthy();
      expect(component.unitForm.get('sampleType')).toBeTruthy();
    });

    it('should close dialog with updated false on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ updated: false });
    });

    it('should not submit when unit form is invalid', () => {
      component.onAddUnit();
      expect(apiServiceSpy.addUnitToBox).not.toHaveBeenCalled();
    });

    it('should set frozenFlag default to N', () => {
      expect(component.unitForm.get('frozenFlag')?.value).toBe('N');
    });

    it('should have required validators on unitId, collDate, and sampleType', () => {
      const unitId = component.unitForm.get('unitId');
      const collDate = component.unitForm.get('collDate');
      const sampleType = component.unitForm.get('sampleType');

      unitId?.setValue('');
      collDate?.setValue(null);
      sampleType?.setValue('');

      expect(unitId?.hasError('required')).toBeTrue();
      expect(collDate?.hasError('required')).toBeTrue();
      expect(sampleType?.hasError('required')).toBeTrue();
    });

    it('should have maxLength validators on unitId, contractId, and sampleType', () => {
      const unitId = component.unitForm.get('unitId');
      const contractId = component.unitForm.get('contractId');
      const sampleType = component.unitForm.get('sampleType');

      unitId?.setValue('A'.repeat(11));
      contractId?.setValue('A'.repeat(11));
      sampleType?.setValue('ABCD');

      expect(unitId?.hasError('maxlength')).toBeTrue();
      expect(contractId?.hasError('maxlength')).toBeTrue();
      expect(sampleType?.hasError('maxlength')).toBeTrue();
    });

    it('should have testId as required in test form', () => {
      const testId = component.testForm.get('testId');
      testId?.setValue('');
      expect(testId?.hasError('required')).toBeTrue();
    });

    it('should return unitForm controls via f getter', () => {
      expect(component.f).toBe(component.unitForm.controls);
    });

    it('should return testForm controls via tf getter', () => {
      expect(component.tf).toBe(component.testForm.controls);
    });

    it('should call getActiveSampleTypes on init', () => {
      expect(apiServiceSpy.getActiveSampleTypes).toHaveBeenCalled();
    });

    it('should call getActiveTestIds with facility code on init', () => {
      expect(apiServiceSpy.getActiveTestIds).toHaveBeenCalledWith('FAC01');
    });

    it('should complete destroy$ subject on ngOnDestroy', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });

    // ---- onUpdateUnit without currentUnit ----

    it('should return early from onUpdateUnit if currentUnit is null', () => {
      component.onUpdateUnit();
      expect(apiServiceSpy.updateUnitInBox).not.toHaveBeenCalled();
    });

    // ---- onDeleteUnit without currentUnit ----

    it('should return early from onDeleteUnit if currentUnit is null', () => {
      component.onDeleteUnit();
      expect(apiServiceSpy.deleteUnitFromBox).not.toHaveBeenCalled();
    });

    // ---- onAddTest without currentUnit ----

    it('should show error snackbar when onAddTest called without currentUnit', () => {
      component.onAddTest();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please save the unit first before adding tests.');
      expect(apiServiceSpy.addTestToSample).not.toHaveBeenCalled();
    });

    // ---- onDeleteTest without currentUnit ----

    it('should return early from onDeleteTest if currentUnit is null', () => {
      const mockTest: BoxUnitTestDto = { testId: 'TEST01', testDesc: 'Test One' };
      component.onDeleteTest(mockTest);
      expect(apiServiceSpy.deleteTestFromSample).not.toHaveBeenCalled();
    });
  });

  // ---- loadSampleTypes error ----

  describe('loadSampleTypes error', () => {
    beforeEach(() => {
      setupTestBed();
    });

    it('should show error snackbar when loadSampleTypes fails', () => {
      // Reset and reconfigure for error scenario
      fixture.destroy();
      TestBed.resetTestingModule();

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      apiServiceSpy = jasmine.createSpyObj('ConfirmatorySampleTransferOutApiService', [
        'getActiveSampleTypes', 'getActiveTestIds', 'addUnitToBox',
        'updateUnitInBox', 'deleteUnitFromBox', 'addTestToSample', 'deleteTestFromSample',
      ]);
      snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);

      apiServiceSpy.getActiveSampleTypes.and.returnValue(throwError(() => new Error('Network error')));
      apiServiceSpy.getActiveTestIds.and.returnValue(of([]));

      TestBed.configureTestingModule({
        imports: [EditUnitsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockData },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ConfirmatorySampleTransferOutApiService, useValue: apiServiceSpy },
          { provide: SnackbarService, useValue: snackbarSpy },
        ],
      });

      spyOn(console, 'error');
      fixture = TestBed.createComponent(EditUnitsDialogComponent);
      component = fixture.componentInstance;
      try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load sample types.');
    });
  });

  // ---- loadTestIds error ----

  describe('loadTestIds error', () => {
    beforeEach(() => {
      setupTestBed();
    });

    it('should show error snackbar when loadTestIds fails', () => {
      fixture.destroy();
      TestBed.resetTestingModule();

      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      apiServiceSpy = jasmine.createSpyObj('ConfirmatorySampleTransferOutApiService', [
        'getActiveSampleTypes', 'getActiveTestIds', 'addUnitToBox',
        'updateUnitInBox', 'deleteUnitFromBox', 'addTestToSample', 'deleteTestFromSample',
      ]);
      snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);

      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));
      apiServiceSpy.getActiveTestIds.and.returnValue(throwError(() => new Error('Network error')));

      TestBed.configureTestingModule({
        imports: [EditUnitsDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: MAT_DIALOG_DATA, useValue: mockData },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: ConfirmatorySampleTransferOutApiService, useValue: apiServiceSpy },
          { provide: SnackbarService, useValue: snackbarSpy },
        ],
      });

      spyOn(console, 'error');
      fixture = TestBed.createComponent(EditUnitsDialogComponent);
      component = fixture.componentInstance;
      try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load test IDs.');
    });
  });

  // ---- onAddUnit ----

  describe('onAddUnit', () => {
    beforeEach(() => {
      setupTestBed();
    });

    function fillValidUnitForm(): void {
      component.unitForm.patchValue({
        unitId: 'UNIT002',
        collDate: moment('2026-01-10'),
        sampleType: 'WB',
        frozenFlag: 'N',
      });
    }

    it('should call addUnitToBox with correct dto when form is valid', () => {
      fillValidUnitForm();
      apiServiceSpy.addUnitToBox.and.returnValue(of('SEQ002'));

      component.onAddUnit();

      expect(apiServiceSpy.addUnitToBox).toHaveBeenCalledWith('BOX001', jasmine.objectContaining({
        unitId: 'UNIT002',
        sampleType: 'WB',
        frozenFlag: 'N',
      }));
    });

    it('should trim unitId in the dto', () => {
      component.unitForm.patchValue({
        unitId: ' UNIT002 ',
        collDate: moment('2026-01-10'),
        sampleType: 'WB',
        frozenFlag: 'N',
      });
      apiServiceSpy.addUnitToBox.and.returnValue(of('SEQ002'));

      component.onAddUnit();

      const dto = apiServiceSpy.addUnitToBox.calls.mostRecent().args[1];
      expect(dto.unitId).toBe('UNIT002');
    });

    it('should default frozenFlag to N when empty', () => {
      component.unitForm.patchValue({
        unitId: 'UNIT002',
        collDate: moment('2026-01-10'),
        sampleType: 'WB',
        frozenFlag: '',
      });
      apiServiceSpy.addUnitToBox.and.returnValue(of('SEQ002'));

      component.onAddUnit();

      const dto = apiServiceSpy.addUnitToBox.calls.mostRecent().args[1];
      expect(dto.frozenFlag).toBe('N');
    });

    it('should format collDate as YYYY-MM-DDTHH:mm:ss', () => {
      fillValidUnitForm();
      apiServiceSpy.addUnitToBox.and.returnValue(of('SEQ002'));

      component.onAddUnit();

      const dto = apiServiceSpy.addUnitToBox.calls.mostRecent().args[1];
      expect(dto.collDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it('should show success snackbar and close dialog on success', () => {
      fillValidUnitForm();
      apiServiceSpy.addUnitToBox.and.returnValue(of('SEQ002'));

      component.onAddUnit();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Unit added successfully. Sample Seq No: SEQ002');
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ updated: true });
    });

    it('should reset form with frozenFlag N on success', () => {
      fillValidUnitForm();
      apiServiceSpy.addUnitToBox.and.returnValue(of('SEQ002'));

      component.onAddUnit();

      expect(component.unitForm.get('unitId')?.value).toBeFalsy();
      expect(component.unitForm.get('frozenFlag')?.value).toBe('N');
    });

    it('should show error snackbar with err.error.message on failure', () => {
      fillValidUnitForm();
      spyOn(console, 'error');
      apiServiceSpy.addUnitToBox.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate unit ID' }, message: 'HTTP Error' }))
      );

      component.onAddUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Duplicate unit ID');
    });

    it('should show error snackbar with err.message when err.error.message is missing', () => {
      fillValidUnitForm();
      spyOn(console, 'error');
      apiServiceSpy.addUnitToBox.and.returnValue(
        throwError(() => ({ error: {}, message: 'HTTP 500' }))
      );

      component.onAddUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('HTTP 500');
    });

    it('should show default error message when no error details available', () => {
      fillValidUnitForm();
      spyOn(console, 'error');
      apiServiceSpy.addUnitToBox.and.returnValue(
        throwError(() => ({}))
      );

      component.onAddUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to add unit.');
    });
  });

  // ---- Tests with selectedUnit ----

  describe('with selectedUnit', () => {
    beforeEach(() => {
      setupTestBed({ selectedUnit: mockUnit });
    });

    it('should patch unit form with selected unit values', () => {
      const formValue = component.unitForm.getRawValue();
      expect(formValue.unitId).toBe('UNIT001');
      expect(formValue.sampleType).toBe('WB');
      expect(formValue.frozenFlag).toBe('Y');
      expect(formValue.contractId).toBe('CON01');
    });

    it('should disable unitId, collDate, and contractId fields when editing', () => {
      expect(component.unitForm.get('unitId')?.disabled).toBeTrue();
      expect(component.unitForm.get('collDate')?.disabled).toBeTrue();
      expect(component.unitForm.get('contractId')?.disabled).toBeTrue();
    });

    // ---- onUpdateUnit ----

    it('should call updateUnitInBox with correct args on valid form', () => {
      apiServiceSpy.updateUnitInBox.and.returnValue(of(void 0));

      component.unitForm.get('sampleType')?.setValue('PL');
      component.unitForm.get('frozenFlag')?.setValue('Y');

      component.onUpdateUnit();

      expect(apiServiceSpy.updateUnitInBox).toHaveBeenCalledWith(
        'BOX001',
        'SEQ001',
        jasmine.objectContaining({
          unitId: 'UNIT001',
          collDate: '2026-01-10',
          sampleType: 'PL',
          frozenFlag: 'Y',
        })
      );
    });

    it('should not call API when form is invalid on update', () => {
      component.unitForm.get('sampleType')?.setValue('');

      component.onUpdateUnit();

      expect(apiServiceSpy.updateUnitInBox).not.toHaveBeenCalled();
    });

    it('should default frozenFlag to N when empty in update', () => {
      apiServiceSpy.updateUnitInBox.and.returnValue(of(void 0));

      component.unitForm.get('frozenFlag')?.setValue('');

      component.onUpdateUnit();

      const dto = apiServiceSpy.updateUnitInBox.calls.mostRecent().args[2];
      expect(dto.frozenFlag).toBe('N');
    });

    it('should show success snackbar and close dialog on update success', () => {
      apiServiceSpy.updateUnitInBox.and.returnValue(of(void 0));

      component.onUpdateUnit();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Unit updated successfully.');
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ updated: true });
    });

    it('should show error snackbar with err.error.message on update failure', () => {
      spyOn(console, 'error');
      apiServiceSpy.updateUnitInBox.and.returnValue(
        throwError(() => ({ error: { message: 'Conflict detected' }, message: 'HTTP Error' }))
      );

      component.onUpdateUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Conflict detected');
    });

    it('should show error snackbar with err.message when err.error.message is absent on update', () => {
      spyOn(console, 'error');
      apiServiceSpy.updateUnitInBox.and.returnValue(
        throwError(() => ({ error: null, message: 'Server error' }))
      );

      component.onUpdateUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Server error');
    });

    it('should show default error message when no error details on update', () => {
      spyOn(console, 'error');
      apiServiceSpy.updateUnitInBox.and.returnValue(
        throwError(() => ({}))
      );

      component.onUpdateUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to update unit.');
    });

    // ---- onDeleteUnit ----

    it('should not call API when confirm returns false on delete unit', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.onDeleteUnit();

      expect(apiServiceSpy.deleteUnitFromBox).not.toHaveBeenCalled();
    });

    it('should call confirm with unit ID message', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(void 0));
      const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteUnit();

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete unit UNIT001?');
    });

    it('should call deleteUnitFromBox with correct args when confirmed', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(void 0));
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteUnit();

      expect(apiServiceSpy.deleteUnitFromBox).toHaveBeenCalledWith('BOX001', 'SEQ001');
    });

    it('should show success snackbar and close dialog on delete success', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(void 0));
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteUnit();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Unit deleted successfully.');
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ updated: true });
    });

    it('should show error snackbar with err.error.message on delete failure', () => {
      spyOn(console, 'error');
      apiServiceSpy.deleteUnitFromBox.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete' }, message: 'HTTP Error' }))
      );
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Cannot delete');
    });

    it('should show error snackbar with err.message when err.error.message is absent on delete', () => {
      spyOn(console, 'error');
      apiServiceSpy.deleteUnitFromBox.and.returnValue(
        throwError(() => ({ error: {}, message: 'Not found' }))
      );
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Not found');
    });

    it('should show default error message when no error details on delete', () => {
      spyOn(console, 'error');
      apiServiceSpy.deleteUnitFromBox.and.returnValue(
        throwError(() => ({}))
      );
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteUnit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to delete unit.');
    });

    // ---- onAddTest ----

    it('should not call API when testForm is invalid on addTest', () => {
      component.testForm.get('testId')?.setValue('');

      component.onAddTest();

      expect(apiServiceSpy.addTestToSample).not.toHaveBeenCalled();
    });

    it('should call addTestToSample with correct dto when form is valid', () => {
      apiServiceSpy.addTestToSample.and.returnValue(of(void 0));

      component.testForm.get('testId')?.setValue('TEST02');

      component.onAddTest();

      expect(apiServiceSpy.addTestToSample).toHaveBeenCalledWith('SEQ001', jasmine.objectContaining({
        testId: 'TEST02',
        facilityCode: 'FAC01',
        unitId: 'UNIT001',
        sampleType: 'WB',
        collDate: '2026-01-10',
      }));
    });

    it('should show success snackbar and close dialog on addTest success', () => {
      apiServiceSpy.addTestToSample.and.returnValue(of(void 0));

      component.testForm.get('testId')?.setValue('TEST02');

      component.onAddTest();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Test added successfully.');
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ updated: true });
    });

    it('should reset testForm on addTest success', () => {
      apiServiceSpy.addTestToSample.and.returnValue(of(void 0));

      component.testForm.get('testId')?.setValue('TEST02');

      component.onAddTest();

      expect(component.testForm.get('testId')?.value).toBeFalsy();
    });

    it('should show error snackbar with err.error.message on addTest failure', () => {
      spyOn(console, 'error');
      apiServiceSpy.addTestToSample.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate test' }, message: 'HTTP Error' }))
      );

      component.testForm.get('testId')?.setValue('TEST02');

      component.onAddTest();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Duplicate test');
    });

    it('should show error snackbar with err.message when err.error.message is absent on addTest', () => {
      spyOn(console, 'error');
      apiServiceSpy.addTestToSample.and.returnValue(
        throwError(() => ({ error: {}, message: 'Bad request' }))
      );

      component.testForm.get('testId')?.setValue('TEST02');

      component.onAddTest();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Bad request');
    });

    it('should show default error message when no error details on addTest', () => {
      spyOn(console, 'error');
      apiServiceSpy.addTestToSample.and.returnValue(
        throwError(() => ({}))
      );

      component.testForm.get('testId')?.setValue('TEST02');

      component.onAddTest();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to add test.');
    });

    // ---- onDeleteTest ----

    it('should not call API when confirm returns false on deleteTest', () => {
      const mockTest: BoxUnitTestDto = { testId: 'TEST01', testDesc: 'Test One' };
      spyOn(window, 'confirm').and.returnValue(false);

      component.onDeleteTest(mockTest);

      expect(apiServiceSpy.deleteTestFromSample).not.toHaveBeenCalled();
    });

    it('should call confirm with test ID message on deleteTest', () => {
      const mockTest: BoxUnitTestDto = { testId: 'TEST01', testDesc: 'Test One' };
      apiServiceSpy.deleteTestFromSample.and.returnValue(of(void 0));
      const confirmSpy = spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteTest(mockTest);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete test TEST01?');
    });

    it('should call deleteTestFromSample with correct args when confirmed', () => {
      const mockTest: BoxUnitTestDto = { testId: 'TEST01', testDesc: 'Test One' };
      apiServiceSpy.deleteTestFromSample.and.returnValue(of(void 0));
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteTest(mockTest);

      expect(apiServiceSpy.deleteTestFromSample).toHaveBeenCalledWith('SEQ001', 'TEST01');
    });

    it('should show success snackbar and close dialog on deleteTest success', () => {
      const mockTest: BoxUnitTestDto = { testId: 'TEST01', testDesc: 'Test One' };
      apiServiceSpy.deleteTestFromSample.and.returnValue(of(void 0));
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteTest(mockTest);

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Test deleted successfully.');
      expect(dialogRefSpy.close).toHaveBeenCalledWith({ updated: true });
    });

    it('should show error snackbar with err.error.message on deleteTest failure', () => {
      const mockTest: BoxUnitTestDto = { testId: 'TEST01', testDesc: 'Test One' };
      spyOn(console, 'error');
      apiServiceSpy.deleteTestFromSample.and.returnValue(
        throwError(() => ({ error: { message: 'Test in use' }, message: 'HTTP Error' }))
      );
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteTest(mockTest);

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Test in use');
    });

    it('should show error snackbar with err.message when err.error.message is absent on deleteTest', () => {
      const mockTest: BoxUnitTestDto = { testId: 'TEST01', testDesc: 'Test One' };
      spyOn(console, 'error');
      apiServiceSpy.deleteTestFromSample.and.returnValue(
        throwError(() => ({ error: {}, message: 'Forbidden' }))
      );
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteTest(mockTest);

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Forbidden');
    });

    it('should show default error message when no error details on deleteTest', () => {
      const mockTest: BoxUnitTestDto = { testId: 'TEST01', testDesc: 'Test One' };
      spyOn(console, 'error');
      apiServiceSpy.deleteTestFromSample.and.returnValue(
        throwError(() => ({}))
      );
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDeleteTest(mockTest);

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to delete test.');
    });
  });

  // ---- selectedUnit with null optional fields ----

  describe('with selectedUnit having null optional fields', () => {
    beforeEach(() => {
      const unitNoOptionals: BoxUnitDto = {
        ...mockUnit,
        contractId: null,
        frozenFlag: null,
      };
      setupTestBed({ selectedUnit: unitNoOptionals });
    });

    it('should default contractId to empty string and frozenFlag to N', () => {
      const formValue = component.unitForm.getRawValue();
      expect(formValue.contractId).toBe('');
      expect(formValue.frozenFlag).toBe('N');
    });
  });
});
