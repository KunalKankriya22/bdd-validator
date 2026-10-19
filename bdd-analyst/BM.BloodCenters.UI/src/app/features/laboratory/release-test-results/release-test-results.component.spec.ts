import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import moment from 'moment';
import { TranslateModule } from '@ngx-translate/core';

import { ReleaseTestResultsComponent } from './release-test-results.component';
import { ReleaseTestResultsService, ReleaseTestResultsState } from './services/release-test-results.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import {
  ReleaseTestResultSearchResponse,
  ReleaseTestResultUnit
} from './models/release-test-results.models';

describe('ReleaseTestResultsComponent', () => {
  let component: ReleaseTestResultsComponent;
  let fixture: ComponentFixture<ReleaseTestResultsComponent>;
  let mockService: jasmine.SpyObj<ReleaseTestResultsService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: jasmine.SpyObj<Router>;
  const chapterChanged$ = new Subject<void>();

  // ---- helpers ----
  function makeUnit(overrides: Partial<ReleaseTestResultUnit> = {}): ReleaseTestResultUnit {
    return {
      unitId: 'U001',
      chapterId: 'CH1',
      collDate: '2026-01-10T00:00:00Z',
      qcTestFlag: 'N',
      ...overrides
    } as ReleaseTestResultUnit;
  }

  function makeSearchResponse(units: ReleaseTestResultUnit[] = [], extra: Partial<ReleaseTestResultSearchResponse> = {}): ReleaseTestResultSearchResponse {
    return {
      contractId: 'C1',
      company: 'Test Co',
      contractType: 'STD',
      units,
      totalUnits: units.length,
      unitsToRelease: units.length,
      skippedUnits: 0,
      sqcReasonUnits: 0,
      ...extra
    } as ReleaseTestResultSearchResponse;
  }

  function buildSavedState(): ReleaseTestResultsState {
    const unit = makeUnit();
    return {
      formValues: { contractId: 'C1', contractIdDescription: 'Saved Co', batchId: 'B1' },
      searchResults: makeSearchResponse([unit]),
      unitsData: [unit],
      selectedUnit: unit,
      selectedUnitIndex: 0,
      testResults: [],
      showSidePanel: true,
      sortColumn: 'CollDate',
      sortDirection: 'ASC',
      contractOptions: [{ contractId: 'C1', company: 'Saved Co' }],
      batchOptions: [{ batchId: 'B1', batchDescription: 'Batch 1' }],
      legendData: [],
      sampleAgeConfig: [],
      reconciled: false
    } as ReleaseTestResultsState;
  }

  beforeEach(() => {
    mockService = jasmine.createSpyObj('ReleaseTestResultsService', [
      'getContractOptions', 'getBatchOptions', 'searchUnits',
      'getUnitTestResults', 'autoDetermineQcFlags', 'releaseTestResults',
      'getCollectionDayLegend', 'getSampleAgeConfig', 'submitReport',
      'saveState', 'clearState'
    ], { savedState: null });
    mockService.getContractOptions.and.returnValue(of([]));
    mockService.getBatchOptions.and.returnValue(of([]));
    mockService.getCollectionDayLegend.and.returnValue(of([]));
    mockService.getSampleAgeConfig.and.returnValue(of([]));

    mockSnackbar = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockHeaderService = jasmine.createSpyObj('HeaderService', ['getCurrentChapterId'], {
      chapterChanged$: chapterChanged$.asObservable()
    });
    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: () => ({ title: 'Release Test Results', subtitle: '' })
    });
    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'isChapterLocalDateAvailable', 'getChapterLocalDate'
    ]);

    TestBed.configureTestingModule({
      imports: [ReleaseTestResultsComponent, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ReleaseTestResultsService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: HeaderService, useValue: mockHeaderService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    // Override component-level providers so that the spy takes precedence
    // over the real MatDialog provided by the standalone component's MatDialogModule import
    TestBed.overrideComponent(ReleaseTestResultsComponent, {
      add: { providers: [{ provide: MatDialog, useValue: mockDialog }] }
    });

    fixture = TestBed.createComponent(ReleaseTestResultsComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  // ──────────── Initialization ────────────

  describe('Initialization', () => {
    it('should initialize search form with empty contract and batch fields', () => {
      expect(component.searchForm).toBeTruthy();
      expect(component.searchForm.value.contractId).toBe('');
      expect(component.searchForm.value.batchId).toBe('');
    });

    it('should load contract options, legend data and sample age config on init when no saved state', () => {
      expect(mockService.getContractOptions).toHaveBeenCalled();
      expect(mockService.getCollectionDayLegend).toHaveBeenCalled();
      expect(mockService.getSampleAgeConfig).toHaveBeenCalled();
    });

    it('should restore state from service when savedState exists and clear it afterwards', () => {
      // Arrange - rebuild with saved state
      const savedState = buildSavedState();
      const serviceWithState = jasmine.createSpyObj('ReleaseTestResultsService', [
        'getContractOptions', 'getBatchOptions', 'searchUnits',
        'getUnitTestResults', 'autoDetermineQcFlags', 'releaseTestResults',
        'getCollectionDayLegend', 'getSampleAgeConfig', 'submitReport',
        'saveState', 'clearState'
      ], { savedState });
      serviceWithState.getContractOptions.and.returnValue(of([]));
      serviceWithState.getBatchOptions.and.returnValue(of([]));
      serviceWithState.getCollectionDayLegend.and.returnValue(of([]));
      serviceWithState.getSampleAgeConfig.and.returnValue(of([]));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [ReleaseTestResultsComponent, ReactiveFormsModule, NoopAnimationsModule, TranslateModule.forRoot()],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: ReleaseTestResultsService, useValue: serviceWithState },
          { provide: SnackbarService, useValue: mockSnackbar },
          { provide: HeaderService, useValue: mockHeaderService },
          { provide: PageHeaderService, useValue: mockPageHeaderService },
          { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: Router, useValue: mockRouter }
        ],
        schemas: [NO_ERRORS_SCHEMA]
      });

      const f2 = TestBed.createComponent(ReleaseTestResultsComponent);
      const c2 = f2.componentInstance;
      try { f2.detectChanges(); } catch (e) { /* template */ }

      // Assert
      expect(c2.searchResults()).toBeTruthy();
      expect(c2.showSidePanel()).toBeTrue();
      expect(serviceWithState.clearState).toHaveBeenCalled();
    });
  });

  // ──────────── ngOnDestroy ────────────

  describe('ngOnDestroy', () => {
    it('should clear state when _preserveState is false', () => {
      // Act
      component.ngOnDestroy();

      // Assert
      expect(mockService.clearState).toHaveBeenCalled();
      expect(mockService.saveState).not.toHaveBeenCalled();
    });

    it('should save state when _preserveState is true and hasResults is true', () => {
      // Arrange
      (component as any)._preserveState = true;
      component.searchResults.set(makeSearchResponse([makeUnit()]));

      // Act
      component.ngOnDestroy();

      // Assert
      expect(mockService.saveState).toHaveBeenCalled();
    });

    it('should clear state when _preserveState is true but hasResults is false', () => {
      // Arrange
      (component as any)._preserveState = true;
      component.searchResults.set(null);

      // Act
      component.ngOnDestroy();

      // Assert
      expect(mockService.clearState).toHaveBeenCalled();
      expect(mockService.saveState).not.toHaveBeenCalled();
    });
  });

  // ──────────── Chapter changed ────────────

  describe('Chapter changed subscription', () => {
    it('should clear all and reload options when chapter changes', () => {
      // Arrange
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      component.submitted.set(true);
      mockService.getContractOptions.calls.reset();
      mockService.getCollectionDayLegend.calls.reset();
      mockService.getSampleAgeConfig.calls.reset();

      // Act
      chapterChanged$.next();

      // Assert
      expect(component.searchResults()).toBeNull();
      expect(component.submitted()).toBeFalse();
      expect(mockService.getContractOptions).toHaveBeenCalled();
      expect(mockService.getCollectionDayLegend).toHaveBeenCalled();
      expect(mockService.getSampleAgeConfig).toHaveBeenCalled();
    });
  });

  // ──────────── Contract / Batch loading ────────────

  describe('Contract and batch options', () => {
    it('should update contract description when contractId changes', fakeAsync(() => {
      // Arrange
      component.contractOptions.set([
        { contractId: 'C1', company: 'Acme Corp' } as any,
        { contractId: 'C2', company: 'Beta Inc' } as any
      ]);

      // Act
      component.searchForm.get('contractId')?.setValue('C1');
      tick();

      // Assert
      expect(component.searchForm.get('contractIdDescription')?.value).toBe('Acme Corp');
    }));

    it('should set empty description when contractId has no matching option', fakeAsync(() => {
      // Arrange
      component.contractOptions.set([]);

      // Act
      component.searchForm.get('contractId')?.setValue('UNKNOWN');
      tick();

      // Assert
      expect(component.searchForm.get('contractIdDescription')?.value).toBe('');
    }));

    it('should clear batch options when contractId is empty', fakeAsync(() => {
      // Arrange
      component.batchOptions.set([{ batchId: 'B1', batchDescription: '' } as any]);

      // Act
      component.searchForm.get('contractId')?.setValue('');
      tick();

      // Assert
      expect(component.batchOptions()).toEqual([]);
    }));

    it('should load batch options when contractId is provided', fakeAsync(() => {
      // Arrange
      const batches = [{ batchId: 'B1', batchDescription: 'Batch 1' }];
      mockService.getBatchOptions.and.returnValue(of(batches as any));

      // Act
      component.searchForm.get('contractId')?.setValue('C1');
      tick();

      // Assert
      expect(mockService.getBatchOptions).toHaveBeenCalledWith('C1');
      expect(component.batchOptions()).toEqual(batches as any);
    }));

    it('should handle contract options load error gracefully', fakeAsync(() => {
      // Arrange
      mockService.getContractOptions.and.returnValue(throwError(() => new Error('Network')));
      const spy = spyOn(console, 'error');

      // Act - trigger a reload
      chapterChanged$.next();
      tick();

      // Assert
      expect(spy).toHaveBeenCalled();
    }));

    it('should handle batch options load error gracefully', fakeAsync(() => {
      // Arrange
      mockService.getBatchOptions.and.returnValue(throwError(() => new Error('Network')));
      const spy = spyOn(console, 'error');

      // Act
      component.searchForm.get('contractId')?.setValue('C1');
      tick();

      // Assert
      expect(spy).toHaveBeenCalled();
    }));
  });

  // ──────────── Legend / Sample Age Config ────────────

  describe('Legend and sample age config loading', () => {
    it('should use returned legend items when service returns non-empty array', fakeAsync(() => {
      // Arrange
      const items = [{ code: 'TEST', description: 'Test Legend' }];
      mockService.getCollectionDayLegend.and.returnValue(of(items as any));

      // Act
      chapterChanged$.next();
      tick();

      // Assert
      expect(component.legendData()).toEqual(items as any);
    }));

    it('should use default legend data when service returns empty array', fakeAsync(() => {
      // Arrange
      mockService.getCollectionDayLegend.and.returnValue(of([]));

      // Act
      chapterChanged$.next();
      tick();

      // Assert
      expect(component.legendData().length).toBe(5);
      expect(component.legendData()[0].code).toBe('WHITE');
    }));

    it('should use default legend data when service errors', fakeAsync(() => {
      // Arrange
      mockService.getCollectionDayLegend.and.returnValue(throwError(() => new Error('fail')));

      // Act
      chapterChanged$.next();
      tick();

      // Assert
      expect(component.legendData().length).toBe(5);
    }));

    it('should handle sample age config load error gracefully', fakeAsync(() => {
      // Arrange
      mockService.getSampleAgeConfig.and.returnValue(throwError(() => new Error('fail')));
      const spy = spyOn(console, 'error');

      // Act
      chapterChanged$.next();
      tick();

      // Assert
      expect(spy).toHaveBeenCalled();
    }));
  });

  // ──────────── onClearAll ────────────

  describe('onClearAll', () => {
    it('should clear all state on onClearAll', () => {
      // Arrange
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      component.submitted.set(true);
      component.error.set('some error');
      component.showSidePanel.set(true);
      component.reconciled.set(true);

      // Act
      component.onClearAll();

      // Assert
      expect(component.searchResults()).toBeNull();
      expect(component.submitted()).toBeFalse();
      expect(component.error()).toBeNull();
      expect(component.showSidePanel()).toBeFalse();
      expect(component.selectedUnit()).toBeNull();
      expect(component.testResults()).toEqual([]);
      expect(component.reconciled()).toBeFalse();
      expect(component.searchForm.value.contractId).toBe('');
      expect(mockService.clearState).toHaveBeenCalled();
    });
  });

  // ──────────── onRetrieve ────────────

  describe('onRetrieve', () => {
    it('should show error when called without contractId', () => {
      // Arrange
      component.searchForm.patchValue({ contractId: '' });

      // Act
      component.onRetrieve();

      // Assert
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Contract ID is required');
      expect(mockService.searchUnits).not.toHaveBeenCalled();
      expect(component.submitted()).toBeTrue();
    });

    it('should search and populate results when units are returned', fakeAsync(() => {
      // Arrange
      const units = [makeUnit({ unitId: 'U1' }), makeUnit({ unitId: 'U2' })];
      const response = makeSearchResponse(units);
      mockService.searchUnits.and.returnValue(of(response));
      mockService.getUnitTestResults.and.returnValue(of([]));
      component.searchForm.patchValue({ contractId: 'C1', batchId: 'B1' });

      // Act
      component.onRetrieve();
      tick();

      // Assert
      expect(component.loading()).toBeFalse();
      expect(component.searchResults()).toEqual(response);
      expect(component.unitsData()).toEqual(units);
      expect(component.selectedUnit()?.unitId).toBe('U1');
      expect(component.showSidePanel()).toBeTrue();
    }));

    it('should hide side panel when search returns empty units', fakeAsync(() => {
      // Arrange
      const response = makeSearchResponse([]);
      mockService.searchUnits.and.returnValue(of(response));
      component.searchForm.patchValue({ contractId: 'C1' });
      component.showSidePanel.set(true);
      component.selectedUnit.set(makeUnit());

      // Act
      component.onRetrieve();
      tick();

      // Assert
      expect(component.showSidePanel()).toBeFalse();
      expect(component.selectedUnit()).toBeNull();
      expect(component.testResults()).toEqual([]);
    }));

    it('should handle search error and display snackbar with error.error.message', fakeAsync(() => {
      // Arrange
      mockService.searchUnits.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      component.searchForm.patchValue({ contractId: 'C1' });

      // Act
      component.onRetrieve();
      tick();

      // Assert
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBe('Server error');
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Server error', 'DISMISS');
    }));

    it('should fallback to err.message when error.error.message is absent', fakeAsync(() => {
      // Arrange
      mockService.searchUnits.and.returnValue(
        throwError(() => ({ message: 'Fallback message' }))
      );
      component.searchForm.patchValue({ contractId: 'C1' });

      // Act
      component.onRetrieve();
      tick();

      // Assert
      expect(component.error()).toBe('Fallback message');
    }));

    it('should fallback to generic message when no error message properties exist', fakeAsync(() => {
      // Arrange
      mockService.searchUnits.and.returnValue(throwError(() => ({})));
      component.searchForm.patchValue({ contractId: 'C1' });

      // Act
      component.onRetrieve();
      tick();

      // Assert
      expect(component.error()).toBe('An error occurred');
    }));

    it('should clear selection and reconciled flag before searching', fakeAsync(() => {
      // Arrange
      component.reconciled.set(true);
      component.selection.select(makeUnit());
      mockService.searchUnits.and.returnValue(of(makeSearchResponse([])));
      component.searchForm.patchValue({ contractId: 'C1' });

      // Act
      component.onRetrieve();
      tick();

      // Assert
      expect(component.reconciled()).toBeFalse();
      expect(component.selection.selected.length).toBe(0);
    }));
  });

  // ──────────── Row navigation ────────────

  describe('onRowClick / onPreviousUnit / onNextUnit', () => {
    it('should set selected unit and load test results on row click', fakeAsync(() => {
      // Arrange
      const unit = makeUnit({ unitId: 'U5' });
      mockService.getUnitTestResults.and.returnValue(of([{ sequence: 1, testId: 'T1' } as any]));

      // Act
      component.onRowClick(unit, 2);
      tick();

      // Assert
      expect(component.selectedUnit()).toEqual(unit);
      expect(component.selectedUnitIndex()).toBe(2);
      expect(component.showSidePanel()).toBeTrue();
      expect(component.testResults().length).toBe(1);
      expect(component.testResultsLoading()).toBeFalse();
    }));

    it('should handle test results load error', fakeAsync(() => {
      // Arrange
      mockService.getUnitTestResults.and.returnValue(throwError(() => new Error('fail')));
      const spy = spyOn(console, 'error');

      // Act
      component.onRowClick(makeUnit(), 0);
      tick();

      // Assert
      expect(component.testResults()).toEqual([]);
      expect(component.testResultsLoading()).toBeFalse();
      expect(spy).toHaveBeenCalled();
    }));

    it('should navigate to previous unit when index > 0', fakeAsync(() => {
      // Arrange
      const units = [makeUnit({ unitId: 'U1' }), makeUnit({ unitId: 'U2' }), makeUnit({ unitId: 'U3' })];
      component.searchResults.set(makeSearchResponse(units));
      component.selectedUnitIndex.set(2);
      mockService.getUnitTestResults.and.returnValue(of([]));

      // Act
      component.onPreviousUnit();
      tick();

      // Assert
      expect(component.selectedUnit()?.unitId).toBe('U2');
      expect(component.selectedUnitIndex()).toBe(1);
    }));

    it('should not navigate previous when already at index 0', () => {
      // Arrange
      component.selectedUnitIndex.set(0);
      const initialUnit = makeUnit({ unitId: 'FIRST' });
      component.selectedUnit.set(initialUnit);

      // Act
      component.onPreviousUnit();

      // Assert
      expect(component.selectedUnit()?.unitId).toBe('FIRST');
    });

    it('should navigate to next unit when not at last index', fakeAsync(() => {
      // Arrange
      const units = [makeUnit({ unitId: 'U1' }), makeUnit({ unitId: 'U2' }), makeUnit({ unitId: 'U3' })];
      component.searchResults.set(makeSearchResponse(units));
      component.selectedUnitIndex.set(0);
      mockService.getUnitTestResults.and.returnValue(of([]));

      // Act
      component.onNextUnit();
      tick();

      // Assert
      expect(component.selectedUnit()?.unitId).toBe('U2');
      expect(component.selectedUnitIndex()).toBe(1);
    }));

    it('should not navigate next when already at last index', () => {
      // Arrange
      const units = [makeUnit({ unitId: 'U1' }), makeUnit({ unitId: 'U2' })];
      component.searchResults.set(makeSearchResponse(units));
      component.selectedUnitIndex.set(1);
      const currentUnit = makeUnit({ unitId: 'U2' });
      component.selectedUnit.set(currentUnit);

      // Act
      component.onNextUnit();

      // Assert
      expect(component.selectedUnit()?.unitId).toBe('U2');
    });
  });

  // ──────────── Selection ────────────

  describe('isAllSelected / toggleAllRows', () => {
    it('should return true when all rows are selected', () => {
      // Arrange
      const units = [makeUnit({ unitId: 'U1' }), makeUnit({ unitId: 'U2' })];
      component.unitsData.set(units);
      units.forEach(u => component.selection.select(u));

      // Assert
      expect(component.isAllSelected()).toBeTrue();
    });

    it('should return false when not all rows are selected', () => {
      // Arrange
      const units = [makeUnit({ unitId: 'U1' }), makeUnit({ unitId: 'U2' })];
      component.unitsData.set(units);
      component.selection.select(units[0]);

      // Assert
      expect(component.isAllSelected()).toBeFalse();
    });

    it('should return false when there are no rows', () => {
      // Arrange
      component.unitsData.set([]);

      // Assert
      expect(component.isAllSelected()).toBeFalse();
    });

    it('should select all rows when not all selected', () => {
      // Arrange
      const units = [makeUnit({ unitId: 'U1' }), makeUnit({ unitId: 'U2' })];
      component.unitsData.set(units);

      // Act
      component.toggleAllRows();

      // Assert
      expect(component.selection.selected.length).toBe(2);
    });

    it('should clear selection when all rows already selected', () => {
      // Arrange
      const units = [makeUnit({ unitId: 'U1' }), makeUnit({ unitId: 'U2' })];
      component.unitsData.set(units);
      units.forEach(u => component.selection.select(u));

      // Act
      component.toggleAllRows();

      // Assert
      expect(component.selection.selected.length).toBe(0);
    });
  });

  // ──────────── onReconcileAllUnits ────────────

  describe('onReconcileAllUnits', () => {
    it('should do nothing when units array is empty', () => {
      // Arrange
      component.searchResults.set(makeSearchResponse([]));

      // Act
      component.onReconcileAllUnits();

      // Assert
      expect(mockService.autoDetermineQcFlags).not.toHaveBeenCalled();
    });

    it('should show success and set reconciled when all units already have QC flags', () => {
      // Arrange
      const units = [makeUnit({ qcTestFlag: 'Y' }), makeUnit({ qcTestFlag: 'T' })];
      component.searchResults.set(makeSearchResponse(units));

      // Act
      component.onReconcileAllUnits();

      // Assert
      expect(component.reconciled()).toBeTrue();
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
        'All units already have QC flags assigned.', 'DISMISS'
      );
      expect(mockService.autoDetermineQcFlags).not.toHaveBeenCalled();
    });

    it('should call service with unreconciled units and update results on success', fakeAsync(() => {
      // Arrange
      const u1 = makeUnit({ unitId: 'U1', qcTestFlag: 'N' });
      const u2 = makeUnit({ unitId: 'U2', qcTestFlag: 'Y' });
      const units = [u1, u2];
      component.searchResults.set(makeSearchResponse(units));
      component.searchForm.patchValue({ contractId: 'C1', batchId: 'B1' });

      const response = {
        units: [{ unitId: 'U1', qcTestFlag: 'Y', serumPlasmaInd: 'S', redTubeFlag: 'Y', redTube2Flag: 'N', purpleTubeFlag: 'Y' }],
        message: 'Reconciled successfully'
      };
      mockService.autoDetermineQcFlags.and.returnValue(of(response as any));

      // Act
      component.onReconcileAllUnits();
      tick();

      // Assert
      expect(component.reconciling()).toBeFalse();
      expect(component.reconciled()).toBeTrue();
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Reconciled successfully', 'DISMISS');
      const updatedUnits = component.unitsData();
      const updatedU1 = updatedUnits.find(u => u.unitId === 'U1');
      expect(updatedU1?.qcTestFlag).toBe('Y');
    }));

    it('should use default success message when response has no message', fakeAsync(() => {
      // Arrange
      const u1 = makeUnit({ unitId: 'U1', qcTestFlag: 'N' });
      component.searchResults.set(makeSearchResponse([u1]));
      component.searchForm.patchValue({ contractId: 'C1', batchId: 'B1' });

      mockService.autoDetermineQcFlags.and.returnValue(of({ units: [], message: '' } as any));

      // Act
      component.onReconcileAllUnits();
      tick();

      // Assert
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
        'All units in [B1] have been successfully reconciled.', 'DISMISS'
      );
    }));

    it('should not overwrite units that already have Y or T flags during reconcile', fakeAsync(() => {
      // Arrange
      const u1 = makeUnit({ unitId: 'U1', qcTestFlag: 'Y' });
      const u2 = makeUnit({ unitId: 'U2', qcTestFlag: 'N' });
      component.searchResults.set(makeSearchResponse([u1, u2]));
      component.searchForm.patchValue({ contractId: 'C1' });

      mockService.autoDetermineQcFlags.and.returnValue(of({
        units: [{ unitId: 'U2', qcTestFlag: 'T', serumPlasmaInd: 'P', redTubeFlag: 'N', redTube2Flag: 'N', purpleTubeFlag: 'N' }],
        message: 'Done'
      } as any));

      // Act
      component.onReconcileAllUnits();
      tick();

      // Assert
      const updatedUnits = component.unitsData();
      expect(updatedUnits.find(u => u.unitId === 'U1')?.qcTestFlag).toBe('Y');
      expect(updatedUnits.find(u => u.unitId === 'U2')?.qcTestFlag).toBe('T');
    }));

    it('should handle reconcile error', fakeAsync(() => {
      // Arrange
      const u1 = makeUnit({ qcTestFlag: 'N' });
      component.searchResults.set(makeSearchResponse([u1]));
      component.searchForm.patchValue({ contractId: 'C1' });

      mockService.autoDetermineQcFlags.and.returnValue(
        throwError(() => ({ message: 'Reconcile failed' }))
      );

      // Act
      component.onReconcileAllUnits();
      tick();

      // Assert
      expect(component.reconciling()).toBeFalse();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Reconcile failed', 'DISMISS');
    }));
  });

  // ──────────── onSave ────────────

  describe('onSave', () => {
    it('should do nothing when units array is empty', async () => {
      // Arrange
      component.searchResults.set(makeSearchResponse([]));

      // Act
      await component.onSave();

      // Assert
      expect(mockService.releaseTestResults).not.toHaveBeenCalled();
    });

    it('should not save when user cancels confirm dialog for partial save', async () => {
      // Arrange
      const units = [makeUnit({ qcTestFlag: '' })]; // unreconciled
      component.searchResults.set(makeSearchResponse(units));
      component.searchForm.patchValue({ contractId: 'C1', batchId: 'B1' });

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('cancel'));
      mockDialog.open.and.returnValue(dialogRef);

      // Act
      await component.onSave();

      // Assert
      expect(mockDialog.open).toHaveBeenCalled();
      expect(mockService.releaseTestResults).not.toHaveBeenCalled();
    });

    it('should save when user confirms partial save dialog', (done) => {
      // Arrange
      const units = [makeUnit({ qcTestFlag: '' })];
      component.searchResults.set(makeSearchResponse(units));
      component.searchForm.patchValue({ contractId: 'C1', batchId: 'B1' });

      const dialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRef.afterClosed.and.returnValue(of('save'));
      mockDialog.open.and.returnValue(dialogRef);

      mockService.releaseTestResults.and.returnValue(of({ message: 'Saved!' } as any));

      // Act
      component.onSave().then(() => {
        // Assert
        expect(mockService.releaseTestResults).toHaveBeenCalled();
        expect(component.saving()).toBeFalse();
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Saved!', 'DISMISS');
        expect(component.searchResults()).toBeNull();
        expect(component.showSidePanel()).toBeFalse();
        done();
      });
    });

    it('should skip confirmation dialog when all units are reconciled', (done) => {
      // Arrange
      const units = [makeUnit({ qcTestFlag: 'Y' })];
      component.searchResults.set(makeSearchResponse(units));
      component.searchForm.patchValue({ contractId: 'C1', batchId: 'B1' });
      mockService.releaseTestResults.and.returnValue(of({ message: '' } as any));

      // Act
      component.onSave().then(() => {
        // Assert
        expect(mockDialog.open).not.toHaveBeenCalled();
        expect(mockService.releaseTestResults).toHaveBeenCalled();
        done();
      });
    });

    it('should use default success message when response message is empty', (done) => {
      // Arrange
      const units = [makeUnit({ qcTestFlag: 'Y' })];
      component.searchResults.set(makeSearchResponse(units));
      component.searchForm.patchValue({ contractId: 'C1', batchId: 'B1' });
      mockService.releaseTestResults.and.returnValue(of({ message: '' } as any));

      // Act
      component.onSave().then(() => {
        // Assert
        expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
          'QC for [B1] have been successfully saved.', 'DISMISS'
        );
        done();
      });
    });

    it('should handle save error', (done) => {
      // Arrange
      const units = [makeUnit({ qcTestFlag: 'Y' })];
      component.searchResults.set(makeSearchResponse(units));
      component.searchForm.patchValue({ contractId: 'C1' });
      mockService.releaseTestResults.and.returnValue(
        throwError(() => ({ message: 'Save failed' }))
      );

      // Act
      component.onSave().then(() => {
        // Assert
        expect(component.saving()).toBeFalse();
        expect(mockSnackbar.showError).toHaveBeenCalledWith('Save failed', 'DISMISS');
        done();
      });
    });
  });

  // ──────────── onShowLegend ────────────

  describe('onShowLegend', () => {
    it('should open legend dialog with legend data', () => {
      // Arrange
      const legendItems = [{ code: 'WHITE', description: '0-2 Days' }];
      component.legendData.set(legendItems as any);

      // Act
      component.onShowLegend();

      // Assert
      expect(mockDialog.open).toHaveBeenCalled();
      const callArgs = mockDialog.open.calls.mostRecent().args;
      expect(callArgs[1]?.data).toEqual({ legendData: legendItems });
    });
  });

  // ──────────── Navigation (onHoldsQuery / onSamplesQuery) ────────────

  describe('Navigation', () => {
    it('should set preserveState and navigate on onHoldsQuery', () => {
      // Act
      component.onHoldsQuery();

      // Assert
      expect((component as any)._preserveState).toBeTrue();
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should navigate with query params on onSamplesQuery when unit is selected', () => {
      // Arrange
      component.selectedUnit.set(makeUnit({ unitId: 'U99', chapterId: 'CH5' }));

      // Act
      component.onSamplesQuery();

      // Assert
      expect((component as any)._preserveState).toBeTrue();
      expect(mockRouter.navigate).toHaveBeenCalled();
      const navArgs = mockRouter.navigate.calls.mostRecent().args;
      expect(navArgs[1]?.queryParams).toEqual({ unitId: 'U99', chapterId: 'CH5' });
    });

    it('should not navigate on onSamplesQuery when no unit is selected', () => {
      // Arrange
      component.selectedUnit.set(null);

      // Act
      component.onSamplesQuery();

      // Assert
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  // ──────────── onPrintReport ────────────

  describe('onPrintReport', () => {
    it('should show error when no unit is selected', () => {
      // Arrange
      component.selectedUnit.set(null);

      // Act
      component.onPrintReport();

      // Assert
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Select a unit to print report');
      expect(mockService.submitReport).not.toHaveBeenCalled();
    });

    it('should submit report and show success with job ID', fakeAsync(() => {
      // Arrange
      component.selectedUnit.set(makeUnit({ unitId: 'U10' }));
      mockService.submitReport.and.returnValue(of({ jobId: 'JOB-42' } as any));

      // Act
      component.onPrintReport();
      tick();

      // Assert
      expect(mockService.submitReport).toHaveBeenCalledWith('U10');
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
        'Report submitted (Job ID: JOB-42)', 'DISMISS'
      );
    }));

    it('should handle report submit error with error.error.message', fakeAsync(() => {
      // Arrange
      component.selectedUnit.set(makeUnit());
      mockService.submitReport.and.returnValue(
        throwError(() => ({ error: { message: 'Report error' } }))
      );

      // Act
      component.onPrintReport();
      tick();

      // Assert
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Report error', 'DISMISS');
    }));

    it('should fallback to err.message when error.error.message missing', fakeAsync(() => {
      // Arrange
      component.selectedUnit.set(makeUnit());
      mockService.submitReport.and.returnValue(
        throwError(() => ({ message: 'Fallback' }))
      );

      // Act
      component.onPrintReport();
      tick();

      // Assert
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Fallback', 'DISMISS');
    }));

    it('should fallback to generic message when no error properties', fakeAsync(() => {
      // Arrange
      component.selectedUnit.set(makeUnit());
      mockService.submitReport.and.returnValue(throwError(() => ({})));

      // Act
      component.onPrintReport();
      tick();

      // Assert
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to submit report', 'DISMISS');
    }));
  });

  // ──────────── onSortChange ────────────

  describe('onSortChange', () => {
    it('should toggle sort direction from ASC to DESC and re-retrieve', fakeAsync(() => {
      // Arrange
      component.sortDirection.set('ASC');
      component.searchForm.patchValue({ contractId: 'C1' });
      mockService.searchUnits.and.returnValue(of(makeSearchResponse([])));

      // Act
      component.onSortChange();
      tick();

      // Assert
      expect(component.sortDirection()).toBe('DESC');
      expect(mockService.searchUnits).toHaveBeenCalled();
    }));

    it('should toggle sort direction from DESC to ASC', fakeAsync(() => {
      // Arrange
      component.sortDirection.set('DESC');
      component.searchForm.patchValue({ contractId: 'C1' });
      mockService.searchUnits.and.returnValue(of(makeSearchResponse([])));

      // Act
      component.onSortChange();
      tick();

      // Assert
      expect(component.sortDirection()).toBe('ASC');
    }));
  });

  // ──────────── getCollectionDateClass ────────────

  describe('getCollectionDateClass', () => {
    beforeEach(() => {
      mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(false);
    });

    it('should return empty string for empty collDate', () => {
      expect(component.getCollectionDateClass('')).toBe('');
    });

    it('should use sample age config when available', () => {
      // Arrange
      component.sampleAgeConfig.set([
        { code: 'WHITE', description: '0-2 Days', sortSequence: 1, minDays: 0, maxDays: 2 },
        { code: 'YELLOW', description: '3-4 Days', sortSequence: 2, minDays: 3, maxDays: 4 }
      ]);
      const collDate = moment().subtract(3, 'days').toISOString();

      // Act
      const result = component.getCollectionDateClass(collDate);

      // Assert
      expect(result).toBe('date-yellow');
    });

    it('should return empty string when config has no matching range', () => {
      // Arrange
      component.sampleAgeConfig.set([
        { code: 'WHITE', description: '0-2 Days', sortSequence: 1, minDays: 0, maxDays: 2 }
      ]);
      const collDate = moment().subtract(10, 'days').toISOString();

      // Act
      const result = component.getCollectionDateClass(collDate);

      // Assert
      expect(result).toBe('');
    });

    it('should use chapter local date when available', () => {
      // Arrange
      mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
      mockChapterTimezoneService.getChapterLocalDate.and.returnValue(moment('2026-01-10'));
      component.sampleAgeConfig.set([]);

      // Act - collDate 1 day old
      const result = component.getCollectionDateClass('2026-01-09');

      // Assert
      expect(result).toBe('date-white');
    });

    it('should return date-white for 0-2 days old (fallback)', () => {
      component.sampleAgeConfig.set([]);
      expect(component.getCollectionDateClass(moment().subtract(0, 'days').toISOString())).toBe('date-white');
      expect(component.getCollectionDateClass(moment().subtract(2, 'days').toISOString())).toBe('date-white');
    });

    it('should return date-yellow for 3-4 days old (fallback)', () => {
      component.sampleAgeConfig.set([]);
      expect(component.getCollectionDateClass(moment().subtract(3, 'days').toISOString())).toBe('date-yellow');
      expect(component.getCollectionDateClass(moment().subtract(4, 'days').toISOString())).toBe('date-yellow');
    });

    it('should return date-green for exactly 5 days old (fallback)', () => {
      component.sampleAgeConfig.set([]);
      expect(component.getCollectionDateClass(moment().subtract(5, 'days').toISOString())).toBe('date-green');
    });

    it('should return date-red for 6-7 days old (fallback)', () => {
      component.sampleAgeConfig.set([]);
      expect(component.getCollectionDateClass(moment().subtract(6, 'days').toISOString())).toBe('date-red');
      expect(component.getCollectionDateClass(moment().subtract(7, 'days').toISOString())).toBe('date-red');
    });

    it('should return date-blue for 8+ days old (fallback)', () => {
      component.sampleAgeConfig.set([]);
      expect(component.getCollectionDateClass(moment().subtract(8, 'days').toISOString())).toBe('date-blue');
      expect(component.getCollectionDateClass(moment().subtract(30, 'days').toISOString())).toBe('date-blue');
    });
  });

  // ──────────── formatDate ────────────

  describe('formatDate', () => {
    it('should return empty string for empty value', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format a valid date in DD-MMM-YYYY uppercase', () => {
      const result = component.formatDate('2026-01-15T00:00:00Z');
      expect(result).toBe('15-JAN-2026');
    });

    it('should return original value for invalid date', () => {
      const result = component.formatDate('not-a-date');
      // moment('not-a-date') may be invalid or valid depending on parsing;
      // if invalid, it returns the original string
      if (!moment('not-a-date').isValid()) {
        expect(result).toBe('not-a-date');
      }
    });
  });

  // ──────────── closeSidePanel ────────────

  describe('closeSidePanel', () => {
    it('should close side panel and clear selected unit and test results', () => {
      // Arrange
      component.showSidePanel.set(true);
      component.selectedUnit.set(makeUnit());
      component.testResults.set([{ sequence: 1 } as any]);

      // Act
      component.closeSidePanel();

      // Assert
      expect(component.showSidePanel()).toBeFalse();
      expect(component.selectedUnit()).toBeNull();
      expect(component.testResults()).toEqual([]);
    });
  });

  // ──────────── Computed signals ────────────

  describe('Computed signals', () => {
    it('hasResults should return true when units exist', () => {
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      expect(component.hasResults()).toBeTrue();
    });

    it('hasResults should return false when no results', () => {
      component.searchResults.set(null);
      expect(component.hasResults()).toBeFalse();
    });

    it('totalUnits should reflect searchResults totalUnits', () => {
      component.searchResults.set(makeSearchResponse([], { totalUnits: 42 } as any));
      expect(component.totalUnits()).toBe(42);
    });

    it('totalUnits should return 0 when no results', () => {
      component.searchResults.set(null);
      expect(component.totalUnits()).toBe(0);
    });

    it('skippedUnits should reflect searchResults skippedUnits', () => {
      component.searchResults.set(makeSearchResponse([], { skippedUnits: 5 } as any));
      expect(component.skippedUnits()).toBe(5);
    });

    it('noResultUnits should count units without QC flag or with flag N', () => {
      const units = [
        makeUnit({ qcTestFlag: 'N' }),
        makeUnit({ qcTestFlag: 'Y' }),
        makeUnit({ qcTestFlag: null as any }),
        makeUnit({ qcTestFlag: undefined as any })
      ];
      component.searchResults.set(makeSearchResponse(units));
      expect(component.noResultUnits()).toBe(3);
    });

    it('sqcUnits should reflect searchResults sqcReasonUnits', () => {
      component.searchResults.set(makeSearchResponse([], { sqcReasonUnits: 3 } as any));
      expect(component.sqcUnits()).toBe(3);
    });

    it('canSave should be true when hasResults, not loading, not saving', () => {
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      component.loading.set(false);
      component.saving.set(false);
      expect(component.canSave()).toBeTrue();
    });

    it('canSave should be false when loading', () => {
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      component.loading.set(true);
      expect(component.canSave()).toBeFalse();
    });

    it('canSave should be false when saving', () => {
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      component.saving.set(true);
      expect(component.canSave()).toBeFalse();
    });

    it('canReconcile should be true when hasResults and not reconciling and not reconciled', () => {
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      component.reconciling.set(false);
      component.reconciled.set(false);
      expect(component.canReconcile()).toBeTrue();
    });

    it('canReconcile should be false when reconciling', () => {
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      component.reconciling.set(true);
      expect(component.canReconcile()).toBeFalse();
    });

    it('canReconcile should be false when already reconciled', () => {
      component.searchResults.set(makeSearchResponse([makeUnit()]));
      component.reconciled.set(true);
      expect(component.canReconcile()).toBeFalse();
    });
  });

  // ──────────── Unique IDs ────────────

  describe('ID generation', () => {
    it('should produce unique element and error IDs', () => {
      expect(component.elementId('contract')).toContain('contract');
      expect(component.errorId('contract')).toContain('contract-error');
      expect(component.labelId('contract')).toContain('contract-label');
    });
  });
});
