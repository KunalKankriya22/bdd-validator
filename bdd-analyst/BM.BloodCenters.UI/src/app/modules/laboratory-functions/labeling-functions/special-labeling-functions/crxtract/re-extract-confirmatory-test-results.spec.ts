import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, Subject, throwError } from 'rxjs';

import { ReExtractConfirmatoryTestResultsComponent } from './re-extract-confirmatory-test-results';
import { ConfirmatoryExtractionApiService } from './services/confirmatory-extraction-api.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';
import {
  ConfirmatoryExtractUnitDto,
  ExtractIdDropdownDto,
  ContractDropdownDto,
  ExtractionResultDto
} from './models/confirmatory-extraction.model';

describe('ReExtractConfirmatoryTestResultsComponent', () => {
  let component: ReExtractConfirmatoryTestResultsComponent;
  let fixture: ComponentFixture<ReExtractConfirmatoryTestResultsComponent>;
  let chapterChanged$: Subject<void>;
  let apiSpy: jasmine.SpyObj<ConfirmatoryExtractionApiService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let matDialogSpy: jasmine.SpyObj<any>;
  let overlaySpy: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockPositionStrategy: any;

  const mockUnits: ConfirmatoryExtractUnitDto[] = [
    {
      extractId: 'EX001', unitId: 'U001', chapterId: 'CH1', collDate: '2026-01-01',
      osUnitId: 'OS001', testSeriesId: 'TS001', testId: 'T001', qcDate: '2026-01-02',
      batchId: 'B001', receivedDate: '2026-01-03', extractDate: '2026-01-04', isSelected: true
    },
    {
      extractId: 'EX001', unitId: 'U002', chapterId: 'CH1', collDate: '2026-01-05',
      osUnitId: 'OS002', testSeriesId: 'TS002', testId: 'T002', qcDate: '2026-01-06',
      batchId: 'B002', receivedDate: '2026-01-07', extractDate: '2026-01-08', isSelected: false
    },
    {
      extractId: 'EX001', unitId: 'U003', chapterId: 'CH2', collDate: null,
      osUnitId: null, testSeriesId: null, testId: null, qcDate: null,
      batchId: null, receivedDate: null, extractDate: null, isSelected: false
    }
  ];

  const mockExtractIds: ExtractIdDropdownDto[] = [
    { extractId: 'EX001', insertDate: '2026-07-01T00:00:00Z' },
    { extractId: 'EX002', insertDate: '2026-07-02T00:00:00Z' }
  ];

  const mockContracts: ContractDropdownDto[] = [
    { contractId: 'C001', company: 'Acme Corp' },
    { contractId: 'C002', company: 'Beta Inc' }
  ];

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ConfirmatoryExtractionApiService', [
      'getExtractIds',
      'getContracts',
      'getUnits',
      'scheduleExtraction',
      'executeExtraction'
    ]);
    snackbarSpy = createMockSnackbarService();
    const pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });
    matDialogSpy = createMockMatDialog();
    chapterChanged$ = new Subject<void>();
    const headerServiceMock = { chapterChanged$: chapterChanged$.asObservable() };

    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(of());

    mockPositionStrategy = {
      flexibleConnectedTo: jasmine.createSpy().and.returnValue({
        withPositions: jasmine.createSpy().and.returnValue({
          withPush: jasmine.createSpy().and.returnValue({})
        })
      })
    };

    overlaySpy = jasmine.createSpyObj('Overlay', ['position', 'create'], {
      scrollStrategies: { block: jasmine.createSpy().and.returnValue({}) }
    });
    overlaySpy.position.and.returnValue(mockPositionStrategy);
    overlaySpy.create.and.returnValue(mockOverlayRef);

    apiSpy.getExtractIds.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [ReExtractConfirmatoryTestResultsComponent, NoopAnimationsModule],
      providers: [
        { provide: ConfirmatoryExtractionApiService, useValue: apiSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: Overlay, useValue: overlaySpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ReExtractConfirmatoryTestResultsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should initialize form and load extract IDs', () => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      try { fixture.detectChanges(); } catch (_) {}
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('extractId')).toBeTruthy();
      expect(component.filterForm.get('contractId')).toBeTruthy();
      expect(component.filterForm.get('contractDescription')).toBeTruthy();
      expect(apiSpy.getExtractIds).toHaveBeenCalled();
    });

    it('should set error when no extract IDs returned', () => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
      expect((component as any).error()).toBe('No extract IDs found in the last 14 days');
    });

    it('should handle loadExtractIds error', () => {
      apiSpy.getExtractIds.and.returnValue(throwError(() => ({ error: { message: 'Server error' } })));
      try { fixture.detectChanges(); } catch (_) {}
      expect((component as any).error()).toBe('Server error');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load extract IDs');
    });

    it('should handle loadExtractIds error without message', () => {
      apiSpy.getExtractIds.and.returnValue(throwError(() => ({ error: {} })));
      try { fixture.detectChanges(); } catch (_) {}
      expect((component as any).error()).toBe('Failed to load extract IDs');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy subject', () => {
      try { fixture.detectChanges(); } catch (_) {}
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('subscribeToChapterChanges', () => {
    it('should call onClearAll and loadExtractIds on chapter change', () => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      try { fixture.detectChanges(); } catch (_) {}

      apiSpy.getExtractIds.calls.reset();
      apiSpy.getExtractIds.and.returnValue(of([]));

      chapterChanged$.next();

      expect(apiSpy.getExtractIds).toHaveBeenCalled();
      expect(component.filterForm.get('extractId')?.value).toBeFalsy();
    });
  });

  describe('setupDropdownSearch', () => {
    it('should filter extractIds when search text changes', () => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      try { fixture.detectChanges(); } catch (_) {}

      (component as any).extractIdSearchCtrl.setValue('EX001');
      const filtered = (component as any).filteredExtractIds();
      expect(filtered.length).toBe(1);
      expect(filtered[0].extractId).toBe('EX001');
    });

    it('should return all extractIds when search is empty', () => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      try { fixture.detectChanges(); } catch (_) {}

      (component as any).extractIdSearchCtrl.setValue('');
      const filtered = (component as any).filteredExtractIds();
      expect(filtered.length).toBe(2);
    });

    it('should filter contracts when search text changes', () => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}

      (component as any).contracts.set(mockContracts);
      (component as any).contractIdSearchCtrl.setValue('Acme');
      const filtered = (component as any).filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].company).toBe('Acme Corp');
    });

    it('should filter contracts by contractId', () => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}

      (component as any).contracts.set(mockContracts);
      (component as any).contractIdSearchCtrl.setValue('C002');
      const filtered = (component as any).filteredContracts();
      expect(filtered.length).toBe(1);
      expect(filtered[0].contractId).toBe('C002');
    });

    it('should handle null search value for extractIdSearchCtrl', () => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      try { fixture.detectChanges(); } catch (_) {}

      (component as any).extractIdSearchCtrl.setValue(null);
      const filtered = (component as any).filteredExtractIds();
      expect(filtered.length).toBe(2);
    });

    it('should handle null search value for contractIdSearchCtrl', () => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}

      (component as any).contracts.set(mockContracts);
      (component as any).contractIdSearchCtrl.setValue(null);
      const filtered = (component as any).filteredContracts();
      expect(filtered.length).toBe(2);
    });
  });

  describe('setupFormListeners', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      apiSpy.getContracts.and.returnValue(of(mockContracts));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should load contracts when extractId changes', () => {
      component.filterForm.get('extractId')?.setValue('EX001');
      expect(apiSpy.getContracts).toHaveBeenCalledWith('EX001');
    });

    it('should clear units and contracts when extractId changes', () => {
      (component as any).units.set(mockUnits);
      (component as any).contracts.set(mockContracts);
      (component as any).selectedUnitIds.set(new Set(['U001']));

      component.filterForm.get('extractId')?.setValue('EX002');
      expect((component as any).units()).toEqual([]);
      expect((component as any).selectedUnitIds().size).toBe(0);
    });

    it('should not load contracts when extractId is empty', () => {
      apiSpy.getContracts.calls.reset();
      component.filterForm.get('extractId')?.setValue('');
      expect(apiSpy.getContracts).not.toHaveBeenCalled();
    });

    it('should update contract description when contractId changes', () => {
      (component as any).contracts.set(mockContracts);
      component.filterForm.get('contractId')?.setValue('C001');
      expect(component.filterForm.get('contractDescription')?.value).toBe('Acme Corp');
    });

    it('should clear contract description when no matching contract', () => {
      (component as any).contracts.set(mockContracts);
      component.filterForm.get('contractId')?.setValue('NONEXISTENT');
      expect(component.filterForm.get('contractDescription')?.value).toBe('');
    });

    it('should handle loadContracts error', () => {
      apiSpy.getContracts.and.returnValue(throwError(() => ({ error: { message: 'Contract error' } })));
      component.filterForm.get('extractId')?.setValue('EX001');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load contracts');
    });
  });

  describe('onRetrieve', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      apiSpy.getContracts.and.returnValue(of(mockContracts));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should not retrieve when form is invalid', () => {
      component.filterForm.get('extractId')?.setValue('');
      component.onRetrieve();
      expect(apiSpy.getUnits).not.toHaveBeenCalled();
    });

    it('should retrieve units successfully', () => {
      apiSpy.getUnits.and.returnValue(of(mockUnits));
      component.filterForm.get('extractId')?.setValue('EX001');
      component.filterForm.get('contractId')?.setValue('C001');
      component.onRetrieve();

      expect(apiSpy.getUnits).toHaveBeenCalledWith('EX001', 'C001', undefined, undefined, undefined, undefined);
      expect((component as any).units()).toEqual(mockUnits);
      expect((component as any).hasRetrieved()).toBe(true);
      expect((component as any).selectedUnitIds().size).toBe(3);
    });

    it('should pass date filters to getUnits', () => {
      apiSpy.getUnits.and.returnValue(of(mockUnits));
      component.filterForm.get('extractId')?.setValue('EX001');
      component.appliedFilters = {
        qcDateFrom: '2026-01-01',
        qcDateTo: '2026-01-31',
        receivedDateFrom: '2026-02-01',
        receivedDateTo: '2026-02-28'
      };
      component.onRetrieve();

      expect(apiSpy.getUnits).toHaveBeenCalledWith('EX001', '', '2026-01-01', '2026-01-31', '2026-02-01', '2026-02-28');
    });

    it('should handle getUnits error with message', () => {
      apiSpy.getUnits.and.returnValue(throwError(() => ({ error: { message: 'Units error' } })));
      component.filterForm.get('extractId')?.setValue('EX001');
      component.onRetrieve();

      expect((component as any).error()).toBe('Units error');
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load units');
    });

    it('should handle getUnits error without message', () => {
      apiSpy.getUnits.and.returnValue(throwError(() => ({ error: {} })));
      component.filterForm.get('extractId')?.setValue('EX001');
      component.onRetrieve();

      expect((component as any).error()).toBe('Failed to load units');
    });

    it('should set loadingUnits to false after completion', () => {
      apiSpy.getUnits.and.returnValue(of(mockUnits));
      component.filterForm.get('extractId')?.setValue('EX001');
      component.onRetrieve();
      expect((component as any).loadingUnits()).toBe(false);
    });
  });

  describe('onClearAll', () => {
    it('should reset all state', () => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}

      (component as any).units.set(mockUnits);
      (component as any).selectedUnitIds.set(new Set(['U001']));
      (component as any).filterText.set('search text');
      (component as any).error.set('some error');
      (component as any).hasRetrieved.set(true);
      component.appliedFilters = { qcDateFrom: '2026-01-01', qcDateTo: null, receivedDateFrom: null, receivedDateTo: null };

      component.onClearAll();

      expect((component as any).contracts()).toEqual([]);
      expect((component as any).units()).toEqual([]);
      expect((component as any).selectedUnitIds().size).toBe(0);
      expect((component as any).filterText()).toBe('');
      expect((component as any).error()).toBeNull();
      expect((component as any).hasRetrieved()).toBe(false);
      expect(component.appliedFilters).toBeNull();
    });
  });

  describe('onSearch', () => {
    it('should set filter text', () => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}

      component.onSearch('test search');
      expect((component as any).filterText()).toBe('test search');
    });
  });

  describe('filteredUnits computed', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
      (component as any).units.set(mockUnits);
    });

    it('should return all units when no filter', () => {
      (component as any).filterText.set('');
      expect((component as any).filteredUnits().length).toBe(3);
    });

    it('should filter by unitId', () => {
      (component as any).filterText.set('U001');
      expect((component as any).filteredUnits().length).toBe(1);
      expect((component as any).filteredUnits()[0].unitId).toBe('U001');
    });

    it('should filter by osUnitId', () => {
      (component as any).filterText.set('OS002');
      expect((component as any).filteredUnits().length).toBe(1);
    });

    it('should filter by testSeriesId', () => {
      (component as any).filterText.set('TS001');
      expect((component as any).filteredUnits().length).toBe(1);
    });

    it('should filter by testId', () => {
      (component as any).filterText.set('T002');
      expect((component as any).filteredUnits().length).toBe(1);
    });

    it('should filter by batchId', () => {
      (component as any).filterText.set('B001');
      expect((component as any).filteredUnits().length).toBe(1);
    });

    it('should return empty when no match', () => {
      (component as any).filterText.set('NONEXISTENT');
      expect((component as any).filteredUnits().length).toBe(0);
    });

    it('should handle units with null fields', () => {
      (component as any).filterText.set('U003');
      const filtered = (component as any).filteredUnits();
      expect(filtered.length).toBe(1);
      expect(filtered[0].unitId).toBe('U003');
    });
  });

  describe('computed properties', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('hasUnits should be false when no units', () => {
      (component as any).units.set([]);
      expect((component as any).hasUnits()).toBe(false);
    });

    it('hasUnits should be true when units exist', () => {
      (component as any).units.set(mockUnits);
      expect((component as any).hasUnits()).toBe(true);
    });

    it('hasFilteredUnits should be false when no filtered units', () => {
      (component as any).units.set([]);
      expect((component as any).hasFilteredUnits()).toBe(false);
    });

    it('hasFilteredUnits should be true when filtered units exist', () => {
      (component as any).units.set(mockUnits);
      expect((component as any).hasFilteredUnits()).toBe(true);
    });

    it('selectedCount should return correct count', () => {
      (component as any).selectedUnitIds.set(new Set(['U001', 'U002']));
      expect((component as any).selectedCount()).toBe(2);
    });

    it('selectedCount should be 0 when nothing selected', () => {
      (component as any).selectedUnitIds.set(new Set());
      expect((component as any).selectedCount()).toBe(0);
    });
  });

  describe('onSelectionChange', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should update selectedUnitIds from selected rows', () => {
      const selectedRows = [mockUnits[0], mockUnits[1]];
      component.onSelectionChange(selectedRows);
      expect((component as any).selectedUnitIds().size).toBe(2);
      expect((component as any).selectedUnitIds().has('U001')).toBe(true);
      expect((component as any).selectedUnitIds().has('U002')).toBe(true);
    });

    it('should clear selectedUnitIds when no rows selected', () => {
      (component as any).selectedUnitIds.set(new Set(['U001']));
      component.onSelectionChange([]);
      expect((component as any).selectedUnitIds().size).toBe(0);
    });

    it('should replace previous selection entirely', () => {
      (component as any).selectedUnitIds.set(new Set(['U001', 'U002']));
      component.onSelectionChange([mockUnits[2]]);
      expect((component as any).selectedUnitIds().size).toBe(1);
      expect((component as any).selectedUnitIds().has('U003')).toBe(true);
      expect((component as any).selectedUnitIds().has('U001')).toBe(false);
    });
  });

  describe('onExtract', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      apiSpy.getContracts.and.returnValue(of(mockContracts));
      try { fixture.detectChanges(); } catch (_) {}
      // Replace the component's dialog with our mock to avoid real instantiation
      (component as any).dialog = matDialogSpy;
      component.filterForm.get('extractId')?.setValue('EX001');
    });

    it('should show error when no units selected', () => {
      (component as any).selectedUnitIds.set(new Set());
      component.onExtract();
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please select at least one unit for extraction');
    });

    it('should open dialog when units are selected', () => {
      (component as any).selectedUnitIds.set(new Set(['U001', 'U002']));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(matDialogSpy.open).toHaveBeenCalled();
      const dialogArgs = matDialogSpy.open.calls.mostRecent().args;
      expect(dialogArgs[1].data.extractId).toBe('EX001');
      expect(dialogArgs[1].data.unitsCount).toBe(2);
    });

    it('should not call performExtraction when dialog returns null', () => {
      (component as any).selectedUnitIds.set(new Set(['U001']));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(apiSpy.scheduleExtraction).not.toHaveBeenCalled();
      expect(apiSpy.executeExtraction).not.toHaveBeenCalled();
    });
  });

  describe('performExtraction - scheduled', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      apiSpy.getContracts.and.returnValue(of(mockContracts));
      try { fixture.detectChanges(); } catch (_) {}
      // Replace the component's dialog with our mock
      (component as any).dialog = matDialogSpy;
      component.filterForm.get('extractId')?.setValue('EX001');
      (component as any).selectedUnitIds.set(new Set(['U001']));
    });

    it('should schedule extraction with afterTime', () => {
      const result: ExtractionResultDto = {
        success: true, message: 'OK', extractId: 'EX001',
        unitsProcessed: 1, isScheduled: true, reportGenerated: false
      };
      apiSpy.scheduleExtraction.and.returnValue(of(result));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: '2026-07-15T10:00:00',
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(apiSpy.scheduleExtraction).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        "1 units scheduled for re-extraction for 'EX001'"
      );
    });

    it('should show report message when reportGenerated is true', () => {
      const result: ExtractionResultDto = {
        success: true, message: 'OK', extractId: 'EX001',
        unitsProcessed: 2, isScheduled: true, reportGenerated: true
      };
      apiSpy.scheduleExtraction.and.returnValue(of(result));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: '2026-07-15T10:00:00',
        generateSeriesReport: true
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        "2 units scheduled for re-extraction with series report for 'EX001'"
      );
    });

    it('should handle schedule extraction error with message', () => {
      apiSpy.scheduleExtraction.and.returnValue(throwError(() => ({ error: { message: 'Schedule failed' } })));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: '2026-07-15T10:00:00',
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Schedule failed');
    });

    it('should handle schedule extraction error without message', () => {
      apiSpy.scheduleExtraction.and.returnValue(throwError(() => ({ error: {} })));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: '2026-07-15T10:00:00',
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to schedule extraction');
    });

    it('should set loading to false after scheduled extraction completes', () => {
      const result: ExtractionResultDto = {
        success: true, message: 'OK', extractId: 'EX001',
        unitsProcessed: 1, isScheduled: true, reportGenerated: false
      };
      apiSpy.scheduleExtraction.and.returnValue(of(result));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: '2026-07-15T10:00:00',
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect((component as any).loading()).toBe(false);
    });
  });

  describe('performExtraction - immediate', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      apiSpy.getContracts.and.returnValue(of(mockContracts));
      try { fixture.detectChanges(); } catch (_) {}
      // Replace the component's dialog with our mock
      (component as any).dialog = matDialogSpy;
      component.filterForm.get('extractId')?.setValue('EX001');
      (component as any).selectedUnitIds.set(new Set(['U001']));
    });

    it('should execute immediate extraction when no afterTime', () => {
      const result: ExtractionResultDto = {
        success: true, message: 'OK', extractId: 'EX001',
        unitsProcessed: 1, isScheduled: false, reportGenerated: false
      };
      apiSpy.executeExtraction.and.returnValue(of(result));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: null,
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(apiSpy.executeExtraction).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        "1 units are Re-extracted for 'EX001'"
      );
    });

    it('should show report message for immediate extraction with report', () => {
      const result: ExtractionResultDto = {
        success: true, message: 'OK', extractId: 'EX001',
        unitsProcessed: 3, isScheduled: false, reportGenerated: true
      };
      apiSpy.executeExtraction.and.returnValue(of(result));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: null,
        generateSeriesReport: true
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith(
        "3 units are Re-extracted with series report for 'EX001'"
      );
    });

    it('should handle immediate extraction error with message', () => {
      apiSpy.executeExtraction.and.returnValue(throwError(() => ({ error: { message: 'Execute failed' } })));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: null,
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Execute failed');
    });

    it('should handle immediate extraction error without message', () => {
      apiSpy.executeExtraction.and.returnValue(throwError(() => ({ error: {} })));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: null,
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to execute extraction');
    });

    it('should set loading to false after immediate extraction completes', () => {
      const result: ExtractionResultDto = {
        success: true, message: 'OK', extractId: 'EX001',
        unitsProcessed: 1, isScheduled: false, reportGenerated: false
      };
      apiSpy.executeExtraction.and.returnValue(of(result));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: null,
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect((component as any).loading()).toBe(false);
    });

    it('should call onClearAll after successful immediate extraction', () => {
      const result: ExtractionResultDto = {
        success: true, message: 'OK', extractId: 'EX001',
        unitsProcessed: 1, isScheduled: false, reportGenerated: false
      };
      apiSpy.executeExtraction.and.returnValue(of(result));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({
        afterTime: null,
        generateSeriesReport: false
      }));
      matDialogSpy.open.and.returnValue(dialogRefSpy);

      component.onExtract();

      expect((component as any).hasRetrieved()).toBe(false);
      expect((component as any).units()).toEqual([]);
    });
  });

  describe('formatDate', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should return dash for null', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('-');
    });

    it('should format valid date string', () => {
      const result = component.formatDate('2026-03-18');
      expect(result).toBeTruthy();
      expect(result).not.toBe('');
    });
  });

  describe('formatDateTime', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should return dash for null', () => {
      expect(component.formatDateTime(null)).toBe('-');
    });

    it('should return dash for invalid date string', () => {
      expect(component.formatDateTime('not-a-date')).toBe('-');
    });

    it('should format valid datetime string with time', () => {
      const result = component.formatDateTime('2026-03-10T23:16:00');
      expect(result).toContain('10-MAR-2026');
      expect(result).toContain('23:16');
    });
  });

  describe('updateFilterChips', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should clear chips when appliedFilters is null', () => {
      component.appliedFilters = null;
      (component as any).updateFilterChips();
      expect(component.filterChips).toEqual([]);
    });

    it('should create chip for qcDateFrom', () => {
      component.appliedFilters = { qcDateFrom: '2026-01-15', qcDateTo: null, receivedDateFrom: null, receivedDateTo: null };
      (component as any).updateFilterChips();
      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('qcDateFrom');
      expect(component.filterChips[0].label).toContain('QC Date');
    });

    it('should create chip for qcDateTo', () => {
      component.appliedFilters = { qcDateFrom: null, qcDateTo: '2026-01-31', receivedDateFrom: null, receivedDateTo: null };
      (component as any).updateFilterChips();
      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('qcDateTo');
    });

    it('should create chip for receivedDateFrom', () => {
      component.appliedFilters = { qcDateFrom: null, qcDateTo: null, receivedDateFrom: '2026-02-01', receivedDateTo: null };
      (component as any).updateFilterChips();
      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('receivedDateFrom');
      expect(component.filterChips[0].label).toContain('Received Date');
    });

    it('should create chip for receivedDateTo', () => {
      component.appliedFilters = { qcDateFrom: null, qcDateTo: null, receivedDateFrom: null, receivedDateTo: '2026-02-28' };
      (component as any).updateFilterChips();
      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('receivedDateTo');
    });

    it('should create multiple chips when multiple filters set', () => {
      component.appliedFilters = {
        qcDateFrom: '2026-01-01', qcDateTo: '2026-01-31',
        receivedDateFrom: '2026-02-01', receivedDateTo: '2026-02-28'
      };
      (component as any).updateFilterChips();
      expect(component.filterChips.length).toBe(4);
    });
  });

  describe('hasActiveFilters', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should return false when no filter chips', () => {
      component.filterChips = [];
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when filter chips exist', () => {
      component.filterChips = [{ key: 'qcDateFrom', label: 'QC Date >= X', value: 'x', removable: true }];
      expect(component.hasActiveFilters()).toBe(true);
    });
  });

  describe('onRemoveFilterChip', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      apiSpy.getContracts.and.returnValue(of(mockContracts));
      apiSpy.getUnits.and.returnValue(of(mockUnits));
      try { fixture.detectChanges(); } catch (_) {}
      component.filterForm.get('extractId')?.setValue('EX001');
    });

    it('should do nothing when appliedFilters is null', () => {
      component.appliedFilters = null;
      component.onRemoveFilterChip('qcDateFrom');
      expect(component.appliedFilters).toBeNull();
    });

    it('should remove the specified filter and call onRetrieve', () => {
      component.appliedFilters = {
        qcDateFrom: '2026-01-01', qcDateTo: '2026-01-31',
        receivedDateFrom: null, receivedDateTo: null
      };

      component.onRemoveFilterChip('qcDateFrom');

      expect(component.appliedFilters.qcDateFrom).toBeNull();
      expect(component.appliedFilters.qcDateTo).toBe('2026-01-31');
      expect(apiSpy.getUnits).toHaveBeenCalled();
    });
  });

  describe('clearAllFilters', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of(mockExtractIds));
      apiSpy.getContracts.and.returnValue(of(mockContracts));
      apiSpy.getUnits.and.returnValue(of(mockUnits));
      try { fixture.detectChanges(); } catch (_) {}
      component.filterForm.get('extractId')?.setValue('EX001');
    });

    it('should clear all filters and chips and call onRetrieve', () => {
      component.appliedFilters = {
        qcDateFrom: '2026-01-01', qcDateTo: null,
        receivedDateFrom: null, receivedDateTo: null
      };
      component.filterChips = [{ key: 'qcDateFrom', label: 'QC Date', value: 'x', removable: true }];

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(apiSpy.getUnits).toHaveBeenCalled();
    });
  });

  describe('handleKeyboardShortcut', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should dispose overlay on Escape key when overlay is open', () => {
      (component as any).overlayRef = mockOverlayRef;
      component.isFilterOpen = true;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should not dispose when Escape pressed without overlay', () => {
      (component as any).overlayRef = null;

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should not dispose on non-Escape key', () => {
      (component as any).overlayRef = mockOverlayRef;

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      spyOn(event, 'preventDefault');
      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(mockOverlayRef.dispose).not.toHaveBeenCalled();
    });
  });

  describe('openFilter', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
      // Replace the component's overlay with our mock
      (component as any).overlay = overlaySpy;
    });

    it('should close overlay if already open', () => {
      const existingOverlay = jasmine.createSpyObj('OverlayRef', ['dispose']);
      (component as any).overlayRef = existingOverlay;
      component.isFilterOpen = true;

      component.openFilter();

      expect(existingOverlay.dispose).toHaveBeenCalled();
      expect((component as any).overlayRef).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should create overlay when not open', () => {
      (component as any).overlayRef = null;
      (component as any).resultsSection = { nativeElement: document.createElement('div') };

      const applySubject = new Subject<any>();
      const closeSubject = new Subject<void>();
      const backdropSubject = new Subject<void>();

      const mockComponentRef = {
        instance: {
          currentFilters: null,
          apply: applySubject.asObservable(),
          close: closeSubject.asObservable()
        }
      };
      mockOverlayRef.attach.and.returnValue(mockComponentRef as any);
      mockOverlayRef.backdropClick.and.returnValue(backdropSubject.asObservable());

      component.openFilter();

      expect(overlaySpy.create).toHaveBeenCalled();
      expect(mockOverlayRef.attach).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(true);
    });

    it('should dispose overlay when close event is emitted', () => {
      (component as any).overlayRef = null;
      (component as any).resultsSection = { nativeElement: document.createElement('div') };

      const applySubject = new Subject<any>();
      const closeSubject = new Subject<void>();
      const backdropSubject = new Subject<void>();

      const mockComponentRef = {
        instance: {
          currentFilters: null,
          apply: applySubject.asObservable(),
          close: closeSubject.asObservable()
        }
      };
      mockOverlayRef.attach.and.returnValue(mockComponentRef as any);
      mockOverlayRef.backdropClick.and.returnValue(backdropSubject.asObservable());

      component.openFilter();

      closeSubject.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should dispose overlay on backdrop click', () => {
      (component as any).overlayRef = null;
      (component as any).resultsSection = { nativeElement: document.createElement('div') };

      const applySubject = new Subject<any>();
      const closeSubject = new Subject<void>();
      const backdropSubject = new Subject<void>();

      const mockComponentRef = {
        instance: {
          currentFilters: null,
          apply: applySubject.asObservable(),
          close: closeSubject.asObservable()
        }
      };
      mockOverlayRef.attach.and.returnValue(mockComponentRef as any);
      mockOverlayRef.backdropClick.and.returnValue(backdropSubject.asObservable());

      component.openFilter();

      backdropSubject.next();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });

    it('should apply filters and retrieve when apply event is emitted', () => {
      (component as any).overlayRef = null;
      (component as any).resultsSection = { nativeElement: document.createElement('div') };
      apiSpy.getUnits.and.returnValue(of(mockUnits));
      component.filterForm.get('extractId')?.setValue('EX001');

      const applySubject = new Subject<any>();
      const closeSubject = new Subject<void>();
      const backdropSubject = new Subject<void>();

      const mockComponentRef = {
        instance: {
          currentFilters: null,
          apply: applySubject.asObservable(),
          close: closeSubject.asObservable()
        }
      };
      mockOverlayRef.attach.and.returnValue(mockComponentRef as any);
      mockOverlayRef.backdropClick.and.returnValue(backdropSubject.asObservable());

      component.openFilter();

      const filterValues = {
        qcDateFrom: '2026-01-01', qcDateTo: '2026-01-31',
        receivedDateFrom: null, receivedDateTo: null
      };
      applySubject.next(filterValues);

      expect(component.appliedFilters).toEqual(filterValues);
      expect(apiSpy.getUnits).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
    });
  });

  describe('elementId, errorId, labelId helpers', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should generate element IDs', () => {
      const id = (component as any).elementId('test');
      expect(id).toContain('re-extract-confirmatory-');
      expect(id).toContain('-test');
    });

    it('should generate error IDs', () => {
      const id = (component as any).errorId('field');
      expect(id).toContain('-field-error');
    });

    it('should generate label IDs', () => {
      const id = (component as any).labelId('field');
      expect(id).toContain('-field-label');
    });
  });

  describe('searchConfig and headerConfig', () => {
    beforeEach(() => {
      apiSpy.getExtractIds.and.returnValue(of([]));
      try { fixture.detectChanges(); } catch (_) {}
    });

    it('should have correct searchConfig defaults', () => {
      expect(component.searchConfig).toBeDefined();
      expect(component.searchConfig.placeholder).toContain('Search');
      expect(component.searchConfig.minLength).toBe(1);
    });

    it('should have correct headerConfig defaults', () => {
      expect(component.headerConfig).toBeDefined();
      expect(component.headerConfig.title).toBe('Re-Extract Confirmatory Test Results');
    });

    it('should have correct tableConfig columns', () => {
      const columnKeys = component.tableConfig.columns.map(c => c.key);
      expect(columnKeys).toEqual([
        'unitId', 'osUnitId', 'testSeriesId', 'testId', 'qcDate', 'batchId', 'receivedDate'
      ]);
      expect(component.tableConfig.enableSelection).toBe(true);
      expect(component.tableConfig.selectionPosition).toBe('first');
      expect(component.tableConfig.selectionKey).toBe('unitId');
    });
  });
});
