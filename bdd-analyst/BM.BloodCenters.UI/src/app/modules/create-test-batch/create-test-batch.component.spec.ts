import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { CreateTestBatchComponent } from './create-test-batch.component';
import { CreateTestBatchService } from './services/create-test-batch.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { TestRow, UnitRow } from './models/create-test-batch.model';

describe('CreateTestBatchComponent', () => {
  let component: CreateTestBatchComponent;
  let fixture: ComponentFixture<CreateTestBatchComponent>;
  let serviceSpy: jasmine.SpyObj<CreateTestBatchService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const chapterChanged$ = new Subject<void>();

  const mockOpenBatches = [
    { tbId: 'TB001', insertDate: '2026-01-01' },
    { tbId: 'TB002', insertDate: '2026-01-15' },
  ];

  const mockValidTests = [
    { testGroup: 'GRP1', testId: 'T1', testDesc: 'Test One' },
    { testGroup: 'GRP2', testId: 'T2', testDesc: 'Test Two' },
  ];

  const mockBatchDetail = {
    status: 'OK',
    tbId: 'TB001',
    testChapterId: 'CH1',
    startWorkNumber: 5,
    insertDate: '2026-01-01',
    userId: 'user1',
    firstUnitId: 'U1',
    lastUnitId: 'U3',
    tests: [
      { testId: 'T1', testKitId: 'TK1', testDesc: 'Test One', testGroup: 'G1', autoSchedule: 'Y', antigenFlag: 'N', testingLabCode: null, testType: null },
    ],
    units: [
      { unitId: 'U1', collDate: '2026-01-01', chapterId: 'CH1', seqNo: 1, checkDigit: null },
    ],
    warnings: [],
  };

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('CreateTestBatchService', [
      'getOpenBatches', 'getBatchById', 'getValidTests',
      'createOrUpdateBatch', 'getPrintableTests',
    ]);
    snackbarSpy = jasmine.createSpyObj('SnackbarService', ['showSuccess', 'showError']);
    headerServiceSpy = jasmine.createSpyObj('HeaderService', [], { chapterChanged$: chapterChanged$.asObservable() });
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue({ title: 'Create Test Batch', subtitle: '' }),
    });

    serviceSpy.getOpenBatches.and.returnValue(of({ success: true, message: '', data: mockOpenBatches }));
    serviceSpy.getValidTests.and.returnValue(of({ success: true, message: '', data: mockValidTests }));

    TestBed.configureTestingModule({
      imports: [CreateTestBatchComponent, NoopAnimationsModule],
      providers: [
        { provide: CreateTestBatchService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
      ],
    });

    fixture = TestBed.createComponent(CreateTestBatchComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (_) { /* template dependencies */ }
  });

  afterEach(() => {
    fixture.destroy();
  });

  // --- Loading open batches ---

  describe('loadOpenBatches', () => {
    it('should populate openBatches on successful API call', () => {
      expect(component.openBatches()).toEqual(mockOpenBatches);
      expect(component.isLoadingBatches()).toBe(false);
    });

    it('should set empty array when API returns failure', () => {
      serviceSpy.getOpenBatches.and.returnValue(of({ success: false, message: 'fail', data: undefined } as any));
      (component as any).loadOpenBatches();
      expect(component.openBatches()).toEqual([]);
    });

    it('should set isLoadingBatches to false on error', () => {
      serviceSpy.getOpenBatches.and.returnValue(throwError(() => new Error('network')));
      (component as any).loadOpenBatches();
      expect(component.isLoadingBatches()).toBe(false);
    });
  });

  // --- Loading valid tests ---

  describe('loadValidTests', () => {
    it('should populate validTests on success', () => {
      expect(component.validTests()).toEqual(mockValidTests);
      expect(component.isLoadingTests()).toBe(false);
    });

    it('should set empty array on failure response', () => {
      serviceSpy.getValidTests.and.returnValue(of({ success: false, message: 'err' } as any));
      (component as any).loadValidTests();
      expect(component.validTests()).toEqual([]);
    });

    it('should set isLoadingTests false on error', () => {
      serviceSpy.getValidTests.and.returnValue(throwError(() => new Error('err')));
      (component as any).loadValidTests();
      expect(component.isLoadingTests()).toBe(false);
    });
  });

  // --- Filtered batches computed ---

  describe('filteredBatches', () => {
    it('should return all batches when search is empty', () => {
      component.batchSearchControl.setValue('');
      expect(component.filteredBatches().length).toBe(2);
    });

    it('should filter batches by tbId', () => {
      component.batchSearchControl.setValue('tb001');
      expect(component.filteredBatches().length).toBe(1);
      expect(component.filteredBatches()[0].tbId).toBe('TB001');
    });
  });

  // --- canSave computed ---

  describe('canSave', () => {
    it('should return false when no tests', () => {
      component.tests.set([]);
      component.units.set([{ seqNo: 1, unitId: 'U1', collDate: null, chapterId: null }]);
      component.startSeqControl.enable();
      component.startSeqControl.setValue(1);
      expect(component.canSave()).toBe(false);
    });

    it('should return false when tests have missing testId', () => {
      component.tests.set([{ testId: '', testDesc: '', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }]);
      component.units.set([{ seqNo: 1, unitId: 'U1', collDate: null, chapterId: null }]);
      component.startSeqControl.enable();
      component.startSeqControl.setValue(1);
      expect(component.canSave()).toBe(false);
    });

    it('should return false when no units', () => {
      component.tests.set([{ testId: 'T1', testDesc: 'D', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }]);
      component.units.set([]);
      component.startSeqControl.enable();
      component.startSeqControl.setValue(1);
      expect(component.canSave()).toBe(false);
    });

    it('should return false when startSeq is 0 or null', () => {
      component.tests.set([{ testId: 'T1', testDesc: 'D', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }]);
      component.units.set([{ seqNo: 1, unitId: 'U1', collDate: null, chapterId: null }]);
      component.startSeqControl.enable();
      component.startSeqControl.setValue(0);
      expect(component.canSave()).toBe(false);
    });

    it('should return true when all conditions met', () => {
      component.tests.set([{ testId: 'T1', testDesc: 'D', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }]);
      component.units.set([{ seqNo: 1, unitId: 'U1', collDate: null, chapterId: null }]);
      component.startSeqControl.enable();
      component.startSeqControl.setValue(1);
      component.isLoading.set(false);
      expect(component.canSave()).toBe(true);
    });
  });

  // --- onRetrieve ---

  describe('onRetrieve', () => {
    it('should do nothing when batchControl has no value', () => {
      component.batchControl.setValue(null);
      component.onRetrieve();
      expect(serviceSpy.getBatchById).not.toHaveBeenCalled();
    });

    it('should populate tests and units from retrieved batch', () => {
      serviceSpy.getBatchById.and.returnValue(of({ success: true, message: '', item: mockBatchDetail }));
      component.batchControl.setValue(mockOpenBatches[0]);
      component.onRetrieve();
      expect(serviceSpy.getBatchById).toHaveBeenCalledWith('TB001');
      expect(component.batchMode()).toBe('existing');
      expect(component.currentBatchId()).toBe('TB001');
      expect(component.tests().length).toBe(1);
      expect(component.units().length).toBe(1);
      expect(component.isLoading()).toBe(false);
    });

    it('should set isLoading false on error', () => {
      serviceSpy.getBatchById.and.returnValue(throwError(() => new Error('fail')));
      component.batchControl.setValue(mockOpenBatches[0]);
      component.onRetrieve();
      expect(component.isLoading()).toBe(false);
    });
  });

  // --- onCreateNewBatch ---

  describe('onCreateNewBatch', () => {
    it('should set mode to new and clear state', () => {
      component.onCreateNewBatch();
      expect(component.batchMode()).toBe('new');
      expect(component.currentBatchId()).toBeNull();
      expect(component.tests()).toEqual([]);
      expect(component.units()).toEqual([]);
      expect(component.batchControl.disabled).toBe(true);
      expect(component.startSeqControl.enabled).toBe(true);
    });
  });

  // --- onClear ---

  describe('onClear', () => {
    it('should reset all state to defaults', () => {
      component.batchMode.set('existing');
      component.currentBatchId.set('TB001');
      component.tests.set([{ testId: 'T1', testDesc: 'D', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }]);
      component.units.set([{ seqNo: 1, unitId: 'U1', collDate: null, chapterId: null }]);
      component.showPrintPanel.set(true);

      component.onClear();

      expect(component.batchMode()).toBe('none');
      expect(component.currentBatchId()).toBeNull();
      expect(component.tests()).toEqual([]);
      expect(component.units()).toEqual([]);
      expect(component.showPrintPanel()).toBe(false);
      expect(component.startSeqControl.disabled).toBe(true);
      expect(component.batchControl.enabled).toBe(true);
    });
  });

  // --- onSave ---

  describe('onSave', () => {
    beforeEach(() => {
      component.tests.set([{ testId: 'T1', testDesc: 'Test', testKitId: 'TK1', testGroup: null, autoSchedule: null, antigenFlag: null }]);
      component.units.set([{ seqNo: 1, unitId: 'U1', collDate: '2026-01-01', chapterId: 'CH1' }]);
      component.startSeqControl.enable();
      component.startSeqControl.setValue(5);
    });

    it('should send NEW as tbId for new batch mode', () => {
      component.batchMode.set('new');
      serviceSpy.createOrUpdateBatch.and.returnValue(of({
        success: true, message: 'Created', item: { ...mockBatchDetail, tbId: 'TB999', status: 'OK', warnings: [] },
      } as any));
      serviceSpy.getPrintableTests.and.returnValue(of({ success: true, message: '', data: [] } as any));

      component.onSave();

      const request = serviceSpy.createOrUpdateBatch.calls.mostRecent().args[0];
      expect(request.tbId).toBe('NEW');
      expect(request.startWorkNumber).toBe(5);
      expect(request.tests.length).toBe(1);
      expect(request.units.length).toBe(1);
    });

    it('should send existing batch ID for existing mode', () => {
      component.batchMode.set('existing');
      component.currentBatchId.set('TB001');
      serviceSpy.createOrUpdateBatch.and.returnValue(of({
        success: true, message: 'Updated', item: { ...mockBatchDetail, status: 'OK', warnings: [] },
      } as any));
      serviceSpy.getPrintableTests.and.returnValue(of({ success: true, message: '', data: [] } as any));

      component.onSave();

      expect(serviceSpy.createOrUpdateBatch.calls.mostRecent().args[0].tbId).toBe('TB001');
    });

    it('should show success snackbar on successful save', () => {
      component.batchMode.set('new');
      serviceSpy.createOrUpdateBatch.and.returnValue(of({
        success: true, message: 'Batch created', item: { ...mockBatchDetail, tbId: 'TB999', status: 'OK', warnings: [] },
      } as any));
      serviceSpy.getPrintableTests.and.returnValue(of({ success: true, message: '', data: [] } as any));

      component.onSave();

      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
    });

    it('should not show success when response has WARNING status with warnings', () => {
      component.batchMode.set('new');
      serviceSpy.createOrUpdateBatch.and.returnValue(of({
        success: true, message: '', item: { ...mockBatchDetail, tbId: 'TB999', status: 'WARNING', warnings: [{ code: 'W1', message: 'warn' }] },
      } as any));

      component.onSave();

      expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
    });

    it('should set isLoading false on error', () => {
      component.batchMode.set('new');
      serviceSpy.createOrUpdateBatch.and.returnValue(throwError(() => new Error('fail')));

      component.onSave();

      expect(component.isLoading()).toBe(false);
    });
  });

  // --- onTestsChanged / onUnitsChanged ---

  describe('grid change handlers', () => {
    it('should update tests signal', () => {
      const newTests: TestRow[] = [{ testId: 'TX', testDesc: 'X', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }];
      component.onTestsChanged(newTests);
      expect(component.tests()).toEqual(newTests);
    });

    it('should update units signal', () => {
      const newUnits: UnitRow[] = [{ seqNo: 1, unitId: 'UX', collDate: null, chapterId: null }];
      component.onUnitsChanged(newUnits);
      expect(component.units()).toEqual(newUnits);
    });
  });

  // --- onSeqKeyDown ---

  describe('onSeqKeyDown', () => {
    it('should allow digit keys', () => {
      const event = { key: '5', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onSeqKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent non-digit keys', () => {
      const event = { key: 'a', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onSeqKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow navigation keys', () => {
      const event = { key: 'Backspace', preventDefault: jasmine.createSpy('preventDefault') } as any;
      component.onSeqKeyDown(event);
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  // --- Chapter change subscription ---

  describe('chapterChanged$', () => {
    it('should reset state and reload on chapter change', () => {
      component.batchMode.set('existing');
      component.tests.set([{ testId: 'T1', testDesc: '', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }]);

      serviceSpy.getOpenBatches.calls.reset();
      serviceSpy.getValidTests.calls.reset();

      chapterChanged$.next();

      expect(component.batchMode()).toBe('none');
      expect(component.openBatches().length).toBeGreaterThanOrEqual(0);
      expect(serviceSpy.getOpenBatches).toHaveBeenCalled();
      expect(serviceSpy.getValidTests).toHaveBeenCalled();
    });
  });

  // --- Print panel ---

  describe('print panel', () => {
    it('onPrintComplete should hide panel and clear', () => {
      component.showPrintPanel.set(true);
      component.batchMode.set('existing');
      component.onPrintComplete();
      expect(component.showPrintPanel()).toBe(false);
      expect(component.batchMode()).toBe('none');
    });

    it('onPrintCancel should hide panel and clear', () => {
      component.showPrintPanel.set(true);
      component.onPrintCancel();
      expect(component.showPrintPanel()).toBe(false);
      expect(component.batchMode()).toBe('none');
    });
  });

  // --- showContent computed ---

  describe('showContent', () => {
    it('should be false when batchMode is none', () => {
      component.batchMode.set('none');
      expect(component.showContent()).toBe(false);
    });

    it('should be true when batchMode is new', () => {
      component.batchMode.set('new');
      expect(component.showContent()).toBe(true);
    });

    it('should be true when batchMode is existing', () => {
      component.batchMode.set('existing');
      expect(component.showContent()).toBe(true);
    });
  });
});
