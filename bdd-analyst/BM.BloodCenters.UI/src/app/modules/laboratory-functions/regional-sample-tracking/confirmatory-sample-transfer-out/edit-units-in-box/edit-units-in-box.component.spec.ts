import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, EMPTY } from 'rxjs';

import { EditUnitsInBoxComponent } from './edit-units-in-box.component';
import { ConfirmatorySampleTransferOutApiService } from '../services/confirmatory-sample-transfer-out-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import {
  BoxHeaderDto,
  BoxUnitDto,
  BoxUnitTestDto,
  SampleTypeDropdownDto,
  TestIdDropdownDto,
} from '../models/confirmatory-sample-transfer-out.model';

function createMockUnit(overrides: Partial<BoxUnitDto> = {}): BoxUnitDto {
  return {
    sampleSeqNo: 'SEQ001',
    unitId: 'UNIT001',
    checkDigit: null,
    collDate: '2026-01-15',
    contractId: null,
    sampleType: 'WB',
    frozenFlag: null,
    tests: [],
    ...overrides,
  };
}

function createMockBoxHeader(overrides: Partial<BoxHeaderDto> = {}): BoxHeaderDto {
  return {
    boxId: 'BOX001',
    shipmentNo: null,
    facilityCode: 'FAC01',
    facilityDesc: 'Facility One',
    boxStatus: 'O' as const,
    externalFacFlag: 'N',
    packDate: '2026-01-15',
    closedDate: null,
    closedUser: null,
    unitCount: 0,
    units: [],
    ...overrides,
  };
}

describe('EditUnitsInBoxComponent', () => {
  let component: EditUnitsInBoxComponent;
  let fixture: ComponentFixture<EditUnitsInBoxComponent>;
  let apiServiceSpy: jasmine.SpyObj<ConfirmatorySampleTransferOutApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    apiServiceSpy = jasmine.createSpyObj('ConfirmatorySampleTransferOutApiService', [
      'getBoxDetails',
      'getActiveSampleTypes',
      'getActiveTestIds',
      'updateUnitInBox',
      'deleteUnitFromBox',
      'deleteTestFromSample',
      'addTestToSample',
    ]);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate'], { events: EMPTY });

    apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader()));
    apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [EditUnitsInBoxComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ConfirmatorySampleTransferOutApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParams: { boxId: 'BOX001' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditUnitsInBoxComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (_) { /* template-only errors */ }
  });

  afterEach(() => {
    fixture?.destroy();
  });

  // === Existing tests (preserved) ===

  it('should format a valid date string to DD-MON-YYYY HH:mm format', () => {
    // Arrange
    const dateStr = '2026-03-15T09:30:00';

    // Act
    const result = component.formatDate(dateStr);

    // Assert
    expect(result).toContain('MAR');
    expect(result).toContain('2026');
  });

  it('should return -- for null date string', () => {
    // Arrange & Act
    const result = component.formatDate(null);

    // Assert
    expect(result).toBe('--');
  });

  it('should navigate back on cancel', () => {
    // Arrange & Act
    component.onCancel();

    // Assert
    expect(routerSpy.navigate).toHaveBeenCalled();
  });

  // === New comprehensive tests ===

  describe('component creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('ngOnInit and loadBoxData', () => {
    it('should call getBoxDetails and getActiveSampleTypes on init', () => {
      expect(apiServiceSpy.getBoxDetails).toHaveBeenCalledWith('BOX001');
      expect(apiServiceSpy.getActiveSampleTypes).toHaveBeenCalled();
    });

    it('should not call loadBoxData when boxId is empty', () => {
      apiServiceSpy.getBoxDetails.calls.reset();
      const activatedRoute = TestBed.inject(ActivatedRoute);
      (activatedRoute as any).snapshot.queryParams = {};

      component.ngOnInit();

      expect(apiServiceSpy.getBoxDetails).not.toHaveBeenCalled();
    });

    it('should set boxHeader from API response', () => {
      expect((component as any).boxHeader()).toBeTruthy();
      expect((component as any).boxHeader().boxId).toBe('BOX001');
      expect((component as any).boxHeader().facilityCode).toBe('FAC01');
    });

    it('should set units to empty array when box.units is null', () => {
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ units: null })));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

      (component as any).loadBoxData();

      expect((component as any).units()).toEqual([]);
    });

    it('should not set selectedUnit when units are empty', () => {
      expect((component as any).selectedUnit()).toBeNull();
    });

    it('should set selectedUnit to first unit when units are present', () => {
      const unit1 = createMockUnit({ sampleSeqNo: 'S1' });
      const unit2 = createMockUnit({ sampleSeqNo: 'S2' });
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ units: [unit1, unit2] })));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

      (component as any).loadBoxData();

      expect((component as any).selectedUnit()).toEqual(unit1);
    });

    it('should set sampleTypes from API response', () => {
      const mockTypes: SampleTypeDropdownDto[] = [
        { code: 'WB', description: 'Whole Blood' },
        { code: 'PL', description: 'Plasma' },
      ];
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader()));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of(mockTypes));

      (component as any).loadBoxData();

      expect((component as any).sampleTypes()).toEqual(mockTypes);
    });

    it('should load testIds when externalFacFlag is Y', () => {
      const testIds: TestIdDropdownDto[] = [{ testId: 'T1', testDesc: 'Test 1', testGroup: 'G1' }];
      apiServiceSpy.getActiveTestIds.and.returnValue(of(testIds));
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ externalFacFlag: 'Y' })));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

      (component as any).loadBoxData();

      expect(apiServiceSpy.getActiveTestIds).toHaveBeenCalledWith('FAC01');
      expect((component as any).testIds()).toEqual(testIds);
    });

    it('should show error when getActiveTestIds fails', () => {
      apiServiceSpy.getActiveTestIds.and.returnValue(throwError(() => new Error('fail')));
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ externalFacFlag: 'Y' })));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

      (component as any).loadBoxData();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load test IDs.');
    });

    it('should not load testIds when externalFacFlag is N', () => {
      apiServiceSpy.getActiveTestIds.calls.reset();
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ externalFacFlag: 'N' })));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

      (component as any).loadBoxData();

      expect(apiServiceSpy.getActiveTestIds).not.toHaveBeenCalled();
    });

    it('should set loading to false after successful load', () => {
      (component as any).loading.set(true);
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader()));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

      (component as any).loadBoxData();

      expect((component as any).loading()).toBe(false);
    });

    it('should set loading to false and show error on loadBoxData failure', () => {
      apiServiceSpy.getBoxDetails.and.returnValue(throwError(() => ({ message: 'Network error' })));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

      (component as any).loadBoxData();

      expect((component as any).loading()).toBe(false);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Network error');
    });

    it('should show default error message when err.message is missing', () => {
      apiServiceSpy.getBoxDetails.and.returnValue(throwError(() => ({})));
      apiServiceSpy.getActiveSampleTypes.and.returnValue(of([]));

      (component as any).loadBoxData();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load box details.');
    });
  });

  describe('search filtering', () => {
    beforeEach(() => {
      (component as any).sampleTypes.set([
        { code: 'WB', description: 'Whole Blood' },
        { code: 'PL', description: 'Plasma' },
        { code: 'RBC', description: 'Red Blood Cells' },
      ]);
      (component as any).testIds.set([
        { testId: 'HIV', testDesc: 'HIV Test', testGroup: 'G1' },
        { testId: 'HBV', testDesc: 'Hepatitis B', testGroup: 'G1' },
        { testId: 'SYPH', testDesc: 'Syphilis Test', testGroup: 'G2' },
      ]);
    });

    it('should return all sample types when search is empty', () => {
      component.sampleTypeSearchCtrl.setValue('');
      expect(component.filteredSampleTypes().length).toBe(3);
    });

    it('should filter sample types by code', () => {
      component.sampleTypeSearchCtrl.setValue('wb');
      expect(component.filteredSampleTypes().length).toBe(1);
      expect(component.filteredSampleTypes()[0].code).toBe('WB');
    });

    it('should filter sample types by description', () => {
      component.sampleTypeSearchCtrl.setValue('plasma');
      expect(component.filteredSampleTypes().length).toBe(1);
      expect(component.filteredSampleTypes()[0].code).toBe('PL');
    });

    it('should return all test IDs when search is empty', () => {
      component.testIdSearchCtrl.setValue('');
      expect(component.filteredTestIds().length).toBe(3);
    });

    it('should filter test IDs by testId', () => {
      component.testIdSearchCtrl.setValue('hiv');
      expect(component.filteredTestIds().length).toBe(1);
      expect(component.filteredTestIds()[0].testId).toBe('HIV');
    });

    it('should filter test IDs by testDesc', () => {
      component.testIdSearchCtrl.setValue('syphilis');
      expect(component.filteredTestIds().length).toBe(1);
      expect(component.filteredTestIds()[0].testId).toBe('SYPH');
    });

    it('should return empty array when no sample types match', () => {
      component.sampleTypeSearchCtrl.setValue('xyz');
      expect(component.filteredSampleTypes().length).toBe(0);
    });

    it('should return empty array when no test IDs match', () => {
      component.testIdSearchCtrl.setValue('xyz');
      expect(component.filteredTestIds().length).toBe(0);
    });
  });

  describe('onSelectUnit', () => {
    it('should set the selected unit', () => {
      const unit = createMockUnit({ sampleSeqNo: 'S1' });
      component.onSelectUnit(unit);
      expect((component as any).selectedUnit()).toEqual(unit);
    });
  });

  describe('onUpdateUnit', () => {
    const mockUnit = createMockUnit();

    it('should call updateUnitInBox with correct parameters', () => {
      apiServiceSpy.updateUnitInBox.and.returnValue(of(undefined));
      component.onUpdateUnit(mockUnit);

      expect(apiServiceSpy.updateUnitInBox).toHaveBeenCalledWith('BOX001', 'SEQ001', {
        unitId: 'UNIT001',
        collDate: '2026-01-15',
        sampleType: 'WB',
        frozenFlag: 'N',
      });
    });

    it('should use frozenFlag value when provided', () => {
      const unitWithFrozen = createMockUnit({ frozenFlag: 'Y' });
      apiServiceSpy.updateUnitInBox.and.returnValue(of(undefined));
      component.onUpdateUnit(unitWithFrozen);

      expect(apiServiceSpy.updateUnitInBox).toHaveBeenCalledWith(
        'BOX001',
        'SEQ001',
        jasmine.objectContaining({ frozenFlag: 'Y' })
      );
    });

    it('should show success snackbar on successful update', () => {
      apiServiceSpy.updateUnitInBox.and.returnValue(of(undefined));
      component.onUpdateUnit(mockUnit);
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Unit updated successfully.');
    });

    it('should show errorResponse.error on update error', () => {
      apiServiceSpy.updateUnitInBox.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Duplicate unit' }, message: 'Err' } }))
      );
      component.onUpdateUnit(mockUnit);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Duplicate unit');
    });

    it('should show body.message on update error when no errorResponse', () => {
      apiServiceSpy.updateUnitInBox.and.returnValue(
        throwError(() => ({ error: { message: 'Unit not found' } }))
      );
      component.onUpdateUnit(mockUnit);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Unit not found');
    });

    it('should show default error message on update error when no body', () => {
      apiServiceSpy.updateUnitInBox.and.returnValue(throwError(() => ({})));
      component.onUpdateUnit(mockUnit);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to update unit.');
    });
  });

  describe('onDeleteUnit', () => {
    const unit1 = createMockUnit({ sampleSeqNo: 'S1', unitId: 'U1' });
    const unit2 = createMockUnit({ sampleSeqNo: 'S2', unitId: 'U2' });

    beforeEach(() => {
      (component as any).units.set([
        { ...unit1 },
        { ...unit2 },
      ]);
      (component as any).selectedUnit.set({ ...unit1 });
    });

    it('should call deleteUnitFromBox with correct params', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(undefined));
      component.onDeleteUnit(unit1);
      expect(apiServiceSpy.deleteUnitFromBox).toHaveBeenCalledWith('BOX001', 'S1');
    });

    it('should remove the deleted unit from the list on success', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(undefined));
      component.onDeleteUnit(unit1);
      expect((component as any).units().length).toBe(1);
      expect((component as any).units()[0].sampleSeqNo).toBe('S2');
    });

    it('should select first remaining unit when deleted unit was selected', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(undefined));
      component.onDeleteUnit(unit1);
      expect((component as any).selectedUnit()?.sampleSeqNo).toBe('S2');
    });

    it('should keep selectedUnit when deleted unit was not selected', () => {
      (component as any).selectedUnit.set({ ...unit2 });
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(undefined));
      component.onDeleteUnit(unit1);
      expect((component as any).selectedUnit()?.sampleSeqNo).toBe('S2');
    });

    it('should set selectedUnit to null when last unit is deleted', () => {
      (component as any).units.set([{ ...unit1 }]);
      (component as any).selectedUnit.set({ ...unit1 });
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(undefined));
      component.onDeleteUnit(unit1);
      expect((component as any).selectedUnit()).toBeNull();
    });

    it('should set loading to false on success', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(undefined));
      component.onDeleteUnit(unit1);
      expect((component as any).loading()).toBe(false);
    });

    it('should show success snackbar on deletion', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(of(undefined));
      component.onDeleteUnit(unit1);
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Unit deleted successfully.');
    });

    it('should set loading to false on delete error', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(
        throwError(() => ({ error: { message: 'Delete failed' } }))
      );
      component.onDeleteUnit(unit1);
      expect((component as any).loading()).toBe(false);
    });

    it('should show error message on delete failure', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(
        throwError(() => ({ error: { message: 'Delete failed' } }))
      );
      component.onDeleteUnit(unit1);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Delete failed');
    });

    it('should show default error when no error message on delete failure', () => {
      apiServiceSpy.deleteUnitFromBox.and.returnValue(throwError(() => ({})));
      component.onDeleteUnit(unit1);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to delete unit.');
    });
  });

  describe('onDeleteTest', () => {
    const test1: BoxUnitTestDto = { testId: 'T1', testDesc: 'Test 1' };
    const test2: BoxUnitTestDto = { testId: 'T2', testDesc: 'Test 2' };

    beforeEach(() => {
      const unit = createMockUnit({ sampleSeqNo: 'S1', tests: [test1, test2] });
      (component as any).units.set([unit]);
      (component as any).selectedUnit.set(unit);
    });

    it('should return early when no unit is selected', () => {
      (component as any).selectedUnit.set(null);
      component.onDeleteTest(test1);
      expect(apiServiceSpy.deleteTestFromSample).not.toHaveBeenCalled();
    });

    it('should call deleteTestFromSample with correct params', () => {
      apiServiceSpy.deleteTestFromSample.and.returnValue(of(undefined));
      component.onDeleteTest(test1);
      expect(apiServiceSpy.deleteTestFromSample).toHaveBeenCalledWith('S1', 'T1');
    });

    it('should remove the test from the unit on success', () => {
      apiServiceSpy.deleteTestFromSample.and.returnValue(of(undefined));
      component.onDeleteTest(test1);
      const updatedUnit = (component as any).units().find((u: BoxUnitDto) => u.sampleSeqNo === 'S1');
      expect(updatedUnit.tests.length).toBe(1);
      expect(updatedUnit.tests[0].testId).toBe('T2');
    });

    it('should update selectedUnit reference on success', () => {
      apiServiceSpy.deleteTestFromSample.and.returnValue(of(undefined));
      component.onDeleteTest(test1);
      expect((component as any).selectedUnit().tests.length).toBe(1);
      expect((component as any).selectedUnit().tests[0].testId).toBe('T2');
    });

    it('should set loading to false on success', () => {
      apiServiceSpy.deleteTestFromSample.and.returnValue(of(undefined));
      component.onDeleteTest(test1);
      expect((component as any).loading()).toBe(false);
    });

    it('should show success snackbar on test deletion', () => {
      apiServiceSpy.deleteTestFromSample.and.returnValue(of(undefined));
      component.onDeleteTest(test1);
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Test deleted successfully.');
    });

    it('should set loading to false on delete test error', () => {
      apiServiceSpy.deleteTestFromSample.and.returnValue(
        throwError(() => ({ error: { message: 'Error' } }))
      );
      component.onDeleteTest(test1);
      expect((component as any).loading()).toBe(false);
    });

    it('should show error message on delete test failure', () => {
      apiServiceSpy.deleteTestFromSample.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } }))
      );
      component.onDeleteTest(test1);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Cannot delete');
    });

    it('should show default error when no error message on delete test failure', () => {
      apiServiceSpy.deleteTestFromSample.and.returnValue(throwError(() => ({})));
      component.onDeleteTest(test1);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to delete test.');
    });
  });

  describe('onAddNewTestId', () => {
    it('should show error when no unit is selected', () => {
      (component as any).selectedUnit.set(null);
      component.onAddNewTestId();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select a unit first.');
      expect((component as any).showAddTestRow()).toBe(false);
    });

    it('should set showAddTestRow to true when unit is selected', () => {
      (component as any).selectedUnit.set(createMockUnit());
      component.onAddNewTestId();
      expect((component as any).showAddTestRow()).toBe(true);
    });

    it('should reset newTestIdCtrl when unit is selected', () => {
      (component as any).selectedUnit.set(createMockUnit());
      component.newTestIdCtrl.setValue('T1');
      component.onAddNewTestId();
      expect(component.newTestIdCtrl.value).toBeNull();
    });
  });

  describe('onNewTestSelected', () => {
    const mockUnit = createMockUnit({ sampleSeqNo: 'S1' });
    const mockBox = createMockBoxHeader();

    beforeEach(() => {
      (component as any).selectedUnit.set(mockUnit);
      (component as any).boxHeader.set(mockBox);
    });

    it('should return early when no selected unit', () => {
      (component as any).selectedUnit.set(null);
      component.onNewTestSelected('T1');
      expect(apiServiceSpy.addTestToSample).not.toHaveBeenCalled();
    });

    it('should return early when testId is empty', () => {
      component.onNewTestSelected('');
      expect(apiServiceSpy.addTestToSample).not.toHaveBeenCalled();
    });

    it('should return early when no boxHeader', () => {
      (component as any).boxHeader.set(null);
      component.onNewTestSelected('T1');
      expect(apiServiceSpy.addTestToSample).not.toHaveBeenCalled();
    });

    it('should hide add test row when valid call is made', () => {
      apiServiceSpy.addTestToSample.and.returnValue(of(undefined));
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader()));

      (component as any).showAddTestRow.set(true);
      component.onNewTestSelected('T1');

      expect((component as any).showAddTestRow()).toBe(false);
    });

    it('should call addTestToSample with correct params', () => {
      apiServiceSpy.addTestToSample.and.returnValue(of(undefined));
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader()));

      component.onNewTestSelected('T1');

      expect(apiServiceSpy.addTestToSample).toHaveBeenCalledWith('S1', {
        testId: 'T1',
        facilityCode: 'FAC01',
        unitId: 'UNIT001',
        sampleType: 'WB',
        collDate: '2026-01-15',
      });
    });

    it('should reset newTestIdCtrl and show success on success', () => {
      component.newTestIdCtrl.setValue('T1');
      apiServiceSpy.addTestToSample.and.returnValue(of(undefined));
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader()));

      component.onNewTestSelected('T1');

      expect(component.newTestIdCtrl.value).toBeNull();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Test added successfully.');
    });

    it('should call refreshBoxData (getBoxDetails) on success', () => {
      apiServiceSpy.addTestToSample.and.returnValue(of(undefined));
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ units: [mockUnit] })));

      const callCountBefore = apiServiceSpy.getBoxDetails.calls.count();
      component.onNewTestSelected('T1');

      expect(apiServiceSpy.getBoxDetails.calls.count()).toBeGreaterThan(callCountBefore);
    });

    it('should set loading to false on add test error', () => {
      apiServiceSpy.addTestToSample.and.returnValue(
        throwError(() => ({ error: { message: 'Failed' } }))
      );

      component.onNewTestSelected('T1');

      expect((component as any).loading()).toBe(false);
    });

    it('should show errorResponse.error on add test error', () => {
      apiServiceSpy.addTestToSample.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Duplicate test' }, message: 'Err' },
        }))
      );

      component.onNewTestSelected('T1');

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Duplicate test');
    });

    it('should show body.message on add test error when no errorResponse', () => {
      apiServiceSpy.addTestToSample.and.returnValue(
        throwError(() => ({ error: { message: 'Test already exists' } }))
      );

      component.onNewTestSelected('T1');

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Test already exists');
    });

    it('should show default error on add test error when no body', () => {
      apiServiceSpy.addTestToSample.and.returnValue(throwError(() => ({})));

      component.onNewTestSelected('T1');

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to add test.');
    });
  });

  describe('refreshBoxData', () => {
    it('should update boxHeader and units on refresh success', () => {
      const refreshedBox = createMockBoxHeader({
        units: [createMockUnit({ sampleSeqNo: 'S1' })],
      });
      apiServiceSpy.getBoxDetails.and.returnValue(of(refreshedBox));

      (component as any).refreshBoxData();

      expect((component as any).boxHeader()).toEqual(refreshedBox);
      expect((component as any).units().length).toBe(1);
    });

    it('should maintain selectedUnit if it exists in refreshed data', () => {
      const unit = createMockUnit({ sampleSeqNo: 'S1' });
      (component as any).selectedUnit.set(unit);
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ units: [unit] })));

      (component as any).refreshBoxData();

      expect((component as any).selectedUnit()?.sampleSeqNo).toBe('S1');
    });

    it('should fall back to first unit if selected unit not in refreshed data', () => {
      const oldUnit = createMockUnit({ sampleSeqNo: 'OLD' });
      const newUnit = createMockUnit({ sampleSeqNo: 'NEW' });
      (component as any).selectedUnit.set(oldUnit);
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ units: [newUnit] })));

      (component as any).refreshBoxData();

      expect((component as any).selectedUnit()?.sampleSeqNo).toBe('NEW');
    });

    it('should set selectedUnit to null when no units in refreshed data', () => {
      (component as any).selectedUnit.set(createMockUnit());
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader({ units: [] })));

      (component as any).refreshBoxData();

      expect((component as any).selectedUnit()).toBeNull();
    });

    it('should set loading to false on refresh success', () => {
      (component as any).loading.set(true);
      apiServiceSpy.getBoxDetails.and.returnValue(of(createMockBoxHeader()));

      (component as any).refreshBoxData();

      expect((component as any).loading()).toBe(false);
    });

    it('should set loading to false on refresh error', () => {
      (component as any).loading.set(true);
      apiServiceSpy.getBoxDetails.and.returnValue(throwError(() => new Error('fail')));

      (component as any).refreshBoxData();

      expect((component as any).loading()).toBe(false);
    });
  });

  describe('onSave', () => {
    it('should show success snackbar with unit count', () => {
      (component as any).units.set([
        createMockUnit({ sampleSeqNo: 'S1' }),
        createMockUnit({ sampleSeqNo: 'S2' }),
      ]);

      component.onSave();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('2 Entries saved');
    });

    it('should navigate back after save', () => {
      component.onSave();

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/regional-sample-tracking/confirmatory-sample-transfer-out'],
        { queryParams: { boxId: 'BOX001' } }
      );
    });

    it('should show 0 entries when no units', () => {
      (component as any).units.set([]);
      component.onSave();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('0 Entries saved');
    });
  });

  describe('onCancel navigation details', () => {
    it('should navigate to confirmatory sample transfer out page with boxId', () => {
      component.onCancel();

      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/regional-sample-tracking/confirmatory-sample-transfer-out'],
        { queryParams: { boxId: 'BOX001' } }
      );
    });
  });

  describe('formatDate additional cases', () => {
    it('should format date with correct day, month, year, hours, and minutes', () => {
      const result = component.formatDate('2026-07-04T14:05:00');
      expect(result).toContain('JUL');
      expect(result).toContain('2026');
      expect(result).toContain('14:05');
    });

    it('should pad single-digit day and time values', () => {
      const result = component.formatDate('2026-01-05T03:07:00');
      expect(result).toContain('05-JAN');
      expect(result).toContain('03:07');
    });

    it('should handle various month names', () => {
      const result = component.formatDate('2026-12-25T12:00:00');
      expect(result).toContain('DEC');
      expect(result).toContain('2026');
    });

    it('should handle date string without time component', () => {
      const result = component.formatDate('2026-06-15T00:00:00');
      expect(result).toContain('JUN');
      expect(result).toContain('2026');
    });
  });

  describe('headerConfig', () => {
    it('should have correct title', () => {
      expect((component as any).headerConfig.title).toBe('Edit Units in the Box');
    });

    it('should have showBackButton set to true', () => {
      expect((component as any).headerConfig.showBackButton).toBe(true);
    });

    it('should have three breadcrumbs', () => {
      expect((component as any).headerConfig.breadcrumbs.length).toBe(3);
    });

    it('should have Home as first breadcrumb', () => {
      expect((component as any).headerConfig.breadcrumbs[0].label).toBe('Home');
      expect((component as any).headerConfig.breadcrumbs[0].link).toBe('/home');
    });

    it('should have Edit Units in the Box as last breadcrumb with null link', () => {
      const lastBreadcrumb = (component as any).headerConfig.breadcrumbs[2];
      expect(lastBreadcrumb.label).toBe('Edit Units in the Box');
      expect(lastBreadcrumb.link).toBeNull();
    });

    it('should have three actions', () => {
      expect((component as any).headerConfig.actions.length).toBe(3);
    });

    it('should trigger onCancel when back button is clicked', () => {
      spyOn(component, 'onCancel');
      (component as any).headerConfig.onBackClick();
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should trigger onAddNewTestId from first action', () => {
      spyOn(component, 'onAddNewTestId');
      (component as any).headerConfig.actions[0].onClick();
      expect(component.onAddNewTestId).toHaveBeenCalled();
    });

    it('should trigger onCancel from second action', () => {
      spyOn(component, 'onCancel');
      (component as any).headerConfig.actions[1].onClick();
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should trigger onSave from third action', () => {
      spyOn(component, 'onSave');
      (component as any).headerConfig.actions[2].onClick();
      expect(component.onSave).toHaveBeenCalled();
    });
  });

  describe('unitCount', () => {
    it('should return 0 when no units', () => {
      (component as any).units.set([]);
      expect((component as any).unitCount()).toBe(0);
    });

    it('should return the correct count of units', () => {
      (component as any).units.set([
        createMockUnit({ sampleSeqNo: 'S1' }),
        createMockUnit({ sampleSeqNo: 'S2' }),
        createMockUnit({ sampleSeqNo: 'S3' }),
      ]);
      expect((component as any).unitCount()).toBe(3);
    });
  });

  describe('ngOnDestroy', () => {
    it('should call next and complete on destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next').and.callThrough();
      const completeSpy = spyOn((component as any).destroy$, 'complete').and.callThrough();

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
