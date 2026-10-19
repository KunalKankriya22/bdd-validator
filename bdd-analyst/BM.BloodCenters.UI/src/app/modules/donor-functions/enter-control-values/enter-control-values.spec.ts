import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import moment from 'moment';

import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { EnterControlValuesService } from './services/enter-control-values.service';
import { EnterControlValuesComponent } from './enter-control-values';
import { ControlBatchParameter } from './models/enter-control-values.model';

function makeParm(overrides: Partial<ControlBatchParameter> = {}): ControlBatchParameter {
  return {
    sequence: 1, parmCode: 'P1', description: 'Parm 1', parmValue: null,
    datatype: 'NUMBER', relatedCode: null, voidCode: null,
    acceptMin: null, acceptMax: null, firstTech: null, firstDate: null,
    secondTech: null, secondDate: null, acceptFlag: null, techNo: 1,
    confirmFlag: null, tech1Reqd: 'Y', tech2Reqd: 'Y',
    parmValueDisplay: null, ...overrides,
  };
}

describe('EnterControlValuesComponent', () => {
  let component: EnterControlValuesComponent;
  let fixture: ComponentFixture<EnterControlValuesComponent>;
  let serviceSpy: jest.Mocked<EnterControlValuesService>;
  let snackbarSpy: jest.Mocked<SnackbarService>;
  let headerServiceSpy: any;
  let routerSpy: jest.Mocked<Router>;
  let dialogSpy: any;
  let chapterChanged$: Subject<void>;

  beforeEach(async () => {
    chapterChanged$ = new Subject<void>();

    serviceSpy = {
      getTestBatchOptions: jest.fn().mockReturnValue(of([])),
      getTestOptions: jest.fn().mockReturnValue(of([])),
      getBatchDetail: jest.fn().mockReturnValue(of({})),
      getRunOptions: jest.fn().mockReturnValue(of([])),
      getKitOptions: jest.fn().mockReturnValue(of([])),
      getDeviceOptions: jest.fn().mockReturnValue(of([])),
      getReagentLovOptions: jest.fn().mockReturnValue(of([])),
      retrieve: jest.fn().mockReturnValue(of({ parameters: [], reagents: [], unitCount: 0, configMessage: null, parmCheckFlag: null, voidCode: null })),
      validateParameter: jest.fn().mockReturnValue(of({ acceptFlag: 'Y', status: 'OK', convertedValue: null, warnings: null })),
      save: jest.fn().mockReturnValue(of({ status: 'OK', message: 'Saved', warnings: null })),
      getReagents: jest.fn().mockReturnValue(of([])),
      getUnits: jest.fn().mockReturnValue(of([])),
    } as any;

    snackbarSpy = { showSuccess: jest.fn(), showInfo: jest.fn(), showError: jest.fn() } as any;

    headerServiceSpy = {
      getCurrentUsername: jest.fn().mockReturnValue('TECH1'),
      getCurrentChapterId: jest.fn().mockReturnValue('CH1'),
      chapterChanged$,
    };

    routerSpy = { navigate: jest.fn() } as any;

    dialogSpy = { open: jest.fn() };

    const pageHeaderServiceSpy = { pageHeaderData: jest.fn().mockReturnValue(undefined) };

    const chapterTzSpy = {
      isChapterLocalDateAvailable: jest.fn().mockReturnValue(false),
      getChapterLocalDate: jest.fn().mockReturnValue(moment()),
    };

    await TestBed.configureTestingModule({
      imports: [EnterControlValuesComponent, NoopAnimationsModule],
      providers: [
        { provide: EnterControlValuesService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ChapterTimezoneService, useValue: chapterTzSpy },
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EnterControlValuesComponent);
    component = fixture.componentInstance;
    // Skip initial detectChanges — template rendering requires full Router bootstrap.
    // Component logic is fully testable without rendering the template.
    component.ngOnInit();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads test batch options', () => {
    expect(serviceSpy.getTestBatchOptions).toHaveBeenCalled();
  });

  // ───── Screen Mode ─────

  describe('screenMode computed', () => {
    it('returns NONE when no parameters', () => {
      component.parameters.set([]);
      expect(component.screenMode()).toBe('NONE');
    });

    it('returns READ_ONLY when all techNo=0', () => {
      component.parameters.set([makeParm({ techNo: 0 }), makeParm({ parmCode: 'P2', techNo: 0 })]);
      expect(component.screenMode()).toBe('READ_ONLY');
    });

    it('returns FINALIZE when all have both techs', () => {
      component.parameters.set([makeParm({ firstTech: 'T1', secondTech: 'T2' })]);
      expect(component.screenMode()).toBe('FINALIZE');
    });

    it('returns TECH2_CONFIRM when any has techNo=2', () => {
      component.parameters.set([makeParm({ techNo: 2 })]);
      expect(component.screenMode()).toBe('TECH2_CONFIRM');
    });

    it('returns TECH1_SELF_CONFIRM when all tech1=Y, tech2=X', () => {
      component.parameters.set([makeParm({ techNo: 1, tech1Reqd: 'Y', tech2Reqd: 'X' })]);
      expect(component.screenMode()).toBe('TECH1_SELF_CONFIRM');
    });

    it('returns TECH1_ENTRY as default', () => {
      component.parameters.set([makeParm({ techNo: 1 })]);
      expect(component.screenMode()).toBe('TECH1_ENTRY');
    });
  });

  // ───── Computed Properties ─────

  describe('computed properties', () => {
    it('techColumnHeader returns Confirmed by for TECH2_CONFIRM', () => {
      component.parameters.set([makeParm({ techNo: 2 })]);
      expect(component.techColumnHeader()).toBe('Confirmed by');
    });

    it('techColumnHeader returns Confirmed by for FINALIZE', () => {
      component.parameters.set([makeParm({ firstTech: 'T1', secondTech: 'T2' })]);
      expect(component.techColumnHeader()).toBe('Confirmed by');
    });

    it('techColumnHeader returns First Tech for TECH1_ENTRY', () => {
      component.parameters.set([makeParm({ techNo: 1 })]);
      expect(component.techColumnHeader()).toBe('First Tech');
    });

    it('showConfirmBatchBtn true for TECH2_CONFIRM', () => {
      component.parameters.set([makeParm({ techNo: 2 })]);
      expect(component.showConfirmBatchBtn()).toBe(true);
    });

    it('showConfirmBatchBtn true for TECH1_SELF_CONFIRM', () => {
      component.parameters.set([makeParm({ techNo: 1, tech1Reqd: 'Y', tech2Reqd: 'X' })]);
      expect(component.showConfirmBatchBtn()).toBe(true);
    });

    it('showConfirmBatchBtn false for TECH1_ENTRY', () => {
      component.parameters.set([makeParm()]);
      expect(component.showConfirmBatchBtn()).toBe(false);
    });

    it('showFinalizeBatchBtn true only for FINALIZE', () => {
      component.parameters.set([makeParm({ firstTech: 'T1', secondTech: 'T2' })]);
      expect(component.showFinalizeBatchBtn()).toBe(true);
    });

    it('isConfirmBatchEnabled false when no parameters', () => {
      component.parameters.set([]);
      expect(component.isConfirmBatchEnabled()).toBe(false);
    });

    it('isConfirmBatchEnabled true when all have Y or N confirmFlag', () => {
      component.parameters.set([
        makeParm({ confirmFlag: 'Y' }),
        makeParm({ parmCode: 'P2', confirmFlag: 'N' }),
      ]);
      expect(component.isConfirmBatchEnabled()).toBe(true);
    });

    it('isConfirmBatchEnabled false when confirmFlag is null', () => {
      component.parameters.set([makeParm({ confirmFlag: null })]);
      expect(component.isConfirmBatchEnabled()).toBe(false);
    });

    it('isSaveEnabled false when no parameters', () => {
      component.parameters.set([]);
      expect(component.isSaveEnabled()).toBe(false);
    });

    it('isSaveEnabled false in READ_ONLY', () => {
      component.parameters.set([makeParm({ techNo: 0 })]);
      expect(component.isSaveEnabled()).toBe(false);
    });

    it('isSaveEnabled true in TECH1_ENTRY when parmValue exists', () => {
      component.parameters.set([makeParm({ parmValue: '5' })]);
      expect(component.isSaveEnabled()).toBe(true);
    });

    it('isSaveEnabled false in TECH1_ENTRY when no parmValue', () => {
      component.parameters.set([makeParm({ parmValue: null })]);
      expect(component.isSaveEnabled()).toBe(false);
    });

    it('isSaveEnabled true in TECH2_CONFIRM', () => {
      component.parameters.set([makeParm({ techNo: 2 })]);
      expect(component.isSaveEnabled()).toBe(true);
    });

    it('isValueEditable for TECH1_ENTRY and TECH1_SELF_CONFIRM', () => {
      component.parameters.set([makeParm()]);
      expect(component.isValueEditable()).toBe(true);
      component.parameters.set([makeParm({ techNo: 1, tech1Reqd: 'Y', tech2Reqd: 'X' })]);
      expect(component.isValueEditable()).toBe(true);
    });

    it('isConfirmEditable for TECH2_CONFIRM and TECH1_SELF_CONFIRM', () => {
      component.parameters.set([makeParm({ techNo: 2 })]);
      expect(component.isConfirmEditable()).toBe(true);
    });
  });

  // ───── displayedParameters ─────

  describe('displayedParameters', () => {
    it('returns all when searchText is empty', () => {
      component.parameters.set([makeParm(), makeParm({ parmCode: 'P2' })]);
      component.searchText = '';
      expect(component.displayedParameters().length).toBe(2);
    });

    it('filters by parmCode', () => {
      component.parameters.set([makeParm({ parmCode: 'ABC' }), makeParm({ parmCode: 'XYZ' })]);
      component.searchText = 'abc';
      expect(component.displayedParameters().length).toBe(1);
    });

    it('filters by description', () => {
      component.parameters.set([makeParm({ description: 'Temperature' }), makeParm({ parmCode: 'P2', description: 'Pressure' })]);
      component.searchText = 'temp';
      expect(component.displayedParameters().length).toBe(1);
    });
  });

  // ───── isRetrieveDisabled ─────

  describe('isRetrieveDisabled', () => {
    it('true when loading', () => {
      component.isLoading.set(true);
      expect(component.isRetrieveDisabled()).toBe(true);
    });

    it('true when testBatch is null', () => {
      component.testBatchControl.setValue(null);
      expect(component.isRetrieveDisabled()).toBe(true);
    });

    it('true when test is null', () => {
      component.testBatchControl.setValue('TB1');
      component.testControl.setValue(null);
      expect(component.isRetrieveDisabled()).toBe(true);
    });

    it('true when kit is null', () => {
      component.testBatchControl.setValue('TB1');
      component.testControl.setValue('T1');
      component.kitControl.setValue(null);
      expect(component.isRetrieveDisabled()).toBe(true);
    });

    it('false when all required set and not loading', () => {
      component.testBatchControl.setValue('TB1');
      component.testControl.setValue('T1');
      component.kitControl.setValue('K1');
      component.isLoading.set(false);
      expect(component.isRetrieveDisabled()).toBe(false);
    });
  });

  // ───── Keyboard Shortcuts ─────

  describe('onKeyDown', () => {
    it('Alt+S triggers retrieve when not disabled', () => {
      component.testBatchControl.setValue('TB1');
      component.testControl.setValue('T1');
      component.kitControl.setValue('K1');
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      jest.spyOn(event, 'preventDefault');
      component.onKeyDown(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(serviceSpy.retrieve).toHaveBeenCalled();
    });

    it('Alt+S does not retrieve when disabled', () => {
      component.testBatchControl.setValue(null);
      const event = new KeyboardEvent('keydown', { altKey: true, key: 's' });
      jest.spyOn(event, 'preventDefault');
      component.onKeyDown(event);
      expect(serviceSpy.retrieve).not.toHaveBeenCalled();
    });

    it('Escape closes reagent panel', () => {
      component.reagentPanelOpen.set(true);
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.reagentPanelOpen()).toBe(false);
    });

    it('Escape closes units panel', () => {
      component.unitsPanelOpen.set(true);
      component.onKeyDown(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(component.unitsPanelOpen()).toBe(false);
    });
  });

  // ───── LOV Loading ─────

  describe('loadTestBatchOptions', () => {
    it('sets options on success', () => {
      const data = [{ tbId: 'TB1', testId: 'T1', statusMessage: 'OK' }];
      serviceSpy.getTestBatchOptions.mockReturnValue(of(data));
      component.loadTestBatchOptions();
      expect(component.testBatchOptions()).toEqual(data);
      expect(component.isLoadingBatches).toBe(false);
    });

    it('resets loading on error', () => {
      serviceSpy.getTestBatchOptions.mockReturnValue(throwError(() => new Error()));
      component.loadTestBatchOptions();
      expect(component.isLoadingBatches).toBe(false);
    });
  });

  describe('onTestBatchChange', () => {
    it('resets dependent controls and loads test options', () => {
      const tests = [{ testId: 'T1', testDesc: 'Test 1', statusMessage: '' }];
      serviceSpy.getTestOptions.mockReturnValue(of(tests));
      component.onTestBatchChange('TB1');
      expect(component.testControl.value).toBeNull();
      expect(component.testOptions()).toEqual(tests);
    });

    it('does not load test options when tbId is empty', () => {
      component.onTestBatchChange('');
      expect(serviceSpy.getTestOptions).not.toHaveBeenCalled();
    });

    it('handles test options error', () => {
      serviceSpy.getTestOptions.mockReturnValue(throwError(() => new Error()));
      component.onTestBatchChange('TB1');
      expect(component.isLoadingTests).toBe(false);
    });
  });

  describe('onTestChange', () => {
    it('returns early when testId is empty', () => {
      component.onTestChange('');
      expect(serviceSpy.getBatchDetail).not.toHaveBeenCalled();
    });

    it('returns early when tbId is null', () => {
      component.testBatchControl.setValue(null);
      component.onTestChange('T1');
      expect(serviceSpy.getBatchDetail).not.toHaveBeenCalled();
    });

    it('loads batch detail and dependent LOVs', () => {
      const detail = { testKitId: 'K1', parmType: 'P', runId: null, kitLotNumber: null, testingLabCode: null };
      serviceSpy.getBatchDetail.mockReturnValue(of(detail));
      serviceSpy.getRunOptions.mockReturnValue(of([]));
      serviceSpy.getKitOptions.mockReturnValue(of([]));
      component.testBatchControl.setValue('TB1');
      component.onTestChange('T1');
      expect(component.batchDetail()).toEqual(detail);
      expect(component.isLoadingBatchDetail).toBe(false);
    });

    it('handles batch detail error', () => {
      serviceSpy.getBatchDetail.mockReturnValue(throwError(() => new Error()));
      component.testBatchControl.setValue('TB1');
      component.onTestChange('T1');
      expect(component.batchDetail()).toBeNull();
      expect(component.isLoadingBatchDetail).toBe(false);
    });
  });

  // ───── Retrieve ─────

  describe('onRetrieve', () => {
    beforeEach(() => {
      component.testBatchControl.setValue('TB1');
      component.testControl.setValue('T1');
      component.kitControl.setValue('K1');
    });

    it('does nothing when disabled', () => {
      component.testBatchControl.setValue(null);
      component.onRetrieve();
      expect(serviceSpy.retrieve).not.toHaveBeenCalled();
    });

    it('sets parameters and batch info on success', () => {
      const parms = [makeParm()];
      serviceSpy.retrieve.mockReturnValue(of({
        parameters: parms, reagents: [], unitCount: 5,
        configMessage: 'msg', parmCheckFlag: null, voidCode: null,
        tech1Reqd: 'Y', tech2Reqd: 'Y',
      }));
      component.testOptions.set([{ testId: 'T1', testDesc: 'Test 1', statusMessage: '' }]);
      component.onRetrieve();
      expect(component.parameters()).toEqual(parms);
      expect(component.batchInfo()!.unitCount).toBe(5);
      expect(component.batchInfo()!.testDesc).toBe('Test 1');
      expect(component.isLoading()).toBe(false);
    });

    it('shows info snackbar on expired kit', () => {
      serviceSpy.retrieve.mockReturnValue(of({
        parameters: [], reagents: [], unitCount: 0,
        configMessage: null, parmCheckFlag: 'N', voidCode: 'REAG',
        tech1Reqd: null, tech2Reqd: null,
      }));
      component.onRetrieve();
      expect(component.expiryVoidCode).toBe('REAG');
      expect(snackbarSpy.showInfo).toHaveBeenCalledWith('Kit/reagent is expired. Batch will be voided.');
    });

    it('defaults voidCode to REAG when not provided', () => {
      serviceSpy.retrieve.mockReturnValue(of({
        parameters: [], reagents: [], unitCount: 0,
        configMessage: null, parmCheckFlag: 'N', voidCode: null,
        tech1Reqd: null, tech2Reqd: null,
      }));
      component.onRetrieve();
      expect(component.expiryVoidCode).toBe('REAG');
    });

    it('clears expiryVoidCode when parmCheckFlag is not N', () => {
      component.expiryVoidCode = 'REAG';
      serviceSpy.retrieve.mockReturnValue(of({
        parameters: [], reagents: [], unitCount: 0,
        configMessage: null, parmCheckFlag: 'Y', voidCode: null,
        tech1Reqd: null, tech2Reqd: null,
      }));
      component.onRetrieve();
      expect(component.expiryVoidCode).toBeNull();
    });

    it('handles retrieve error', () => {
      serviceSpy.retrieve.mockReturnValue(throwError(() => new Error()));
      component.onRetrieve();
      expect(component.parameters()).toEqual([]);
      expect(component.batchInfo()).toBeNull();
      expect(component.isLoading()).toBe(false);
    });
  });

  // ───── Clear / Cancel ─────

  describe('onClearAll', () => {
    it('resets all controls and signals', () => {
      component.testBatchControl.setValue('TB1');
      component.testControl.setValue('T1');
      component.parameters.set([makeParm()]);
      component.hasSearched.set(true);
      component.onClearAll();
      expect(component.testBatchControl.value).toBeNull();
      expect(component.testControl.value).toBeNull();
      expect(component.parameters()).toEqual([]);
      expect(component.hasSearched()).toBe(false);
    });
  });

  it('onCancel calls onClearAll', () => {
    const spy = jest.spyOn(component, 'onClearAll');
    component.onCancel();
    expect(spy).toHaveBeenCalled();
  });

  // ───── Search ─────

  it('onSearchChange sets searchText', () => {
    component.onSearchChange('test');
    expect(component.searchText).toBe('test');
  });

  it('onDropdownOpened does nothing when not opened', () => {
    expect(() => component.onDropdownOpened(false)).not.toThrow();
  });

  // ───── Placeholder ─────

  describe('getValuePlaceholder', () => {
    it('returns MMDDYY for DATE', () => {
      expect(component.getValuePlaceholder(makeParm({ datatype: 'DATE' }))).toBe('MMDDYY');
    });
    it('returns MMDDYYHHMM for DATETIME', () => {
      expect(component.getValuePlaceholder(makeParm({ datatype: 'DATETIME' }))).toBe('MMDDYYHHMM');
    });
    it('returns Enter value for NUMBER', () => {
      expect(component.getValuePlaceholder(makeParm({ datatype: 'NUMBER' }))).toBe('Enter value');
    });
    it('returns Device ID for DEVICE', () => {
      expect(component.getValuePlaceholder(makeParm({ datatype: 'DEVICE' }))).toBe('Device ID');
    });
    it('returns Reagent ID for REAGENT', () => {
      expect(component.getValuePlaceholder(makeParm({ datatype: 'REAGENT' }))).toBe('Reagent ID');
    });
    it('returns Enter value for unknown', () => {
      expect(component.getValuePlaceholder(makeParm({ datatype: 'OTHER' }))).toBe('Enter value');
    });
  });

  // ───── Status / Accept Display ─────

  describe('getStatus / getAcceptDisplay', () => {
    it('getStatus returns Acceptable for Y', () => {
      expect(component.getStatus(makeParm({ acceptFlag: 'Y' }))).toBe('Acceptable');
    });
    it('getStatus returns Not Acceptable for N', () => {
      expect(component.getStatus(makeParm({ acceptFlag: 'N' }))).toBe('Not Acceptable');
    });
    it('getStatus returns Pending for null', () => {
      expect(component.getStatus(makeParm({ acceptFlag: null }))).toBe('Pending');
    });
    it('getAcceptDisplay returns Yes/No/-', () => {
      expect(component.getAcceptDisplay(makeParm({ acceptFlag: 'Y' }))).toBe('Yes');
      expect(component.getAcceptDisplay(makeParm({ acceptFlag: 'N' }))).toBe('No');
      expect(component.getAcceptDisplay(makeParm({ acceptFlag: null }))).toBe('-');
    });
  });

  // ───── Side Panels ─────

  describe('side panels', () => {
    it('openReagentPanel closes units panel and opens reagent', () => {
      component.unitsPanelOpen.set(true);
      component.openReagentPanel();
      expect(component.unitsPanelOpen()).toBe(false);
      expect(component.reagentPanelOpen()).toBe(true);
    });

    it('closeReagentPanel sets false', () => {
      component.reagentPanelOpen.set(true);
      component.closeReagentPanel();
      expect(component.reagentPanelOpen()).toBe(false);
    });

    it('openUnitsPanel closes reagent panel and loads units', () => {
      component.reagentPanelOpen.set(true);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      const units = [{ sequence: 1, unitId: 'U1', testId: 'T1', resultStatus: 'OK', absorbance: null, ratio: null }];
      serviceSpy.getUnits.mockReturnValue(of(units));
      component.openUnitsPanel();
      expect(component.reagentPanelOpen()).toBe(false);
      expect(component.unitsPanelOpen()).toBe(true);
      expect(component.units()).toEqual(units);
    });

    it('openUnitsPanel handles error', () => {
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      serviceSpy.getUnits.mockReturnValue(throwError(() => new Error()));
      component.openUnitsPanel();
      expect(component.units()).toEqual([]);
    });

    it('openUnitsPanel skips load when no batchInfo', () => {
      component.batchInfo.set(null);
      component.openUnitsPanel();
      expect(serviceSpy.getUnits).not.toHaveBeenCalled();
    });

    it('closeUnitsPanel sets false', () => {
      component.unitsPanelOpen.set(true);
      component.closeUnitsPanel();
      expect(component.unitsPanelOpen()).toBe(false);
    });
  });

  // ───── Place Group Hold ─────

  describe('onPlaceGroupHold', () => {
    it('does nothing when no batchInfo', () => {
      component.batchInfo.set(null);
      component.onPlaceGroupHold();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('navigates with TBID mode for TB-pattern batch IDs', () => {
      component.batchInfo.set({ tbId: '1234567TB99', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.onPlaceGroupHold();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/place-group-interdiction'],
        { queryParams: { mode: 'TBID', value: '1234567TB99' } }
      );
    });

    it('navigates with ITBID mode for non-TB batch IDs', () => {
      component.batchInfo.set({ tbId: 'SHORT', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.onPlaceGroupHold();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        ['/laboratory-functions/place-group-interdiction'],
        { queryParams: { mode: 'ITBID', value: 'SHORT' } }
      );
    });
  });

  // ───── Value Blur ─────

  describe('onValueBlur', () => {
    it('does nothing when value unchanged', () => {
      const row = makeParm({ parmValue: 'hello' });
      component.parameters.set([row]);
      const event = { target: { value: 'hello' } } as any;
      component.onValueBlur(event, row);
      expect(serviceSpy.validateParameter).not.toHaveBeenCalled();
    });

    it('clears acceptFlag when new value is empty', () => {
      const row = makeParm({ parmValue: 'old' });
      component.parameters.set([row]);
      const event = { target: { value: '' } } as any;
      component.onValueBlur(event, row);
      expect(component.parameters()[0].parmValue).toBeNull();
      expect(component.parameters()[0].acceptFlag).toBeNull();
    });

    it('calls validateParameter and updates on success', () => {
      const row = makeParm({ parmValue: null });
      component.parameters.set([row]);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      serviceSpy.validateParameter.mockReturnValue(of({ acceptFlag: 'Y', status: 'OK', convertedValue: null, warnings: null }));
      const event = { target: { value: '42' } } as any;
      component.onValueBlur(event, row);
      expect(component.parameters()[0].acceptFlag).toBe('Y');
      expect(component.parameters()[0].firstTech).toBe('TECH1');
    });

    it('sets acceptFlag to N on validation error', () => {
      const row = makeParm({ parmValue: null });
      component.parameters.set([row]);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      serviceSpy.validateParameter.mockReturnValue(throwError(() => new Error()));
      const event = { target: { value: 'bad' } } as any;
      component.onValueBlur(event, row);
      expect(component.parameters()[0].acceptFlag).toBe('N');
    });
  });

  // ───── Date Parsing ─────

  describe('date/time parsing', () => {
    it('parseDateValue returns null for null', () => {
      expect(component.parseDateValue(null)).toBeNull();
    });

    it('parseDateValue parses MM-DD-YY', () => {
      const m = component.parseDateValue('01-15-24');
      expect(m).not.toBeNull();
      expect(m!.isValid()).toBe(true);
    });

    it('parseDateValue returns null for invalid format', () => {
      expect(component.parseDateValue('not-a-date')).toBeNull();
    });

    it('parseDatePart returns null for null', () => {
      expect(component.parseDatePart(null)).toBeNull();
    });

    it('parseDatePart extracts date from datetime string', () => {
      const m = component.parseDatePart('01-15-24 14:30');
      expect(m).not.toBeNull();
    });

    it('parseTimePart returns empty for null', () => {
      expect(component.parseTimePart(null)).toBe('');
    });

    it('parseTimePart returns empty when no space', () => {
      expect(component.parseTimePart('01-15-24')).toBe('');
    });

    it('parseTimePart extracts time part', () => {
      expect(component.parseTimePart('01-15-24 14:30')).toBe('14:30');
    });
  });

  // ───── Date/DateTime Handlers ─────

  describe('onDateInput', () => {
    it('clears parmValue when input is empty', () => {
      const row = makeParm({ parmValue: '01-15-24' });
      component.parameters.set([row]);
      component.onDateInput({ target: { value: '' } } as any, row);
      expect(component.parameters()[0].parmValue).toBeNull();
    });
  });

  describe('onDateChange', () => {
    it('calls updateParmAndValidate with formatted date', () => {
      const row = makeParm();
      component.parameters.set([row]);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      const m = moment('2024-01-15');
      component.onDateChange({ value: m }, row);
      expect(serviceSpy.validateParameter).toHaveBeenCalled();
    });

    it('does nothing for invalid date', () => {
      component.onDateChange({ value: null }, makeParm());
      expect(serviceSpy.validateParameter).not.toHaveBeenCalled();
    });
  });

  describe('onDatetimeDateChange', () => {
    it('validates when time part exists', () => {
      const row = makeParm({ parmValue: '01-15-24 10:00' });
      component.parameters.set([row]);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.onDatetimeDateChange({ value: moment('2024-01-15') }, row);
      expect(serviceSpy.validateParameter).toHaveBeenCalled();
    });

    it('does not validate when no time part', () => {
      const row = makeParm({ parmValue: null });
      component.parameters.set([row]);
      component.onDatetimeDateChange({ value: moment('2024-01-15') }, row);
      expect(serviceSpy.validateParameter).not.toHaveBeenCalled();
    });
  });

  describe('onDatetimeTimeBlur', () => {
    it('validates when date part and time part both present', () => {
      const row = makeParm({ parmValue: '01-15-24 10:00' });
      component.parameters.set([row]);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.onDatetimeTimeBlur({ target: { value: '14:30' } } as any, row);
      expect(serviceSpy.validateParameter).toHaveBeenCalled();
    });

    it('does nothing when time is empty', () => {
      component.onDatetimeTimeBlur({ target: { value: '' } } as any, makeParm());
      expect(serviceSpy.validateParameter).not.toHaveBeenCalled();
    });

    it('does nothing when no date part available', () => {
      const row = makeParm({ parmValue: null });
      component.parameters.set([row]);
      component.onDatetimeTimeBlur({ target: { value: '14:30' } } as any, row);
      expect(serviceSpy.validateParameter).not.toHaveBeenCalled();
    });
  });

  // ───── Device / Reagent LOV ─────

  describe('onDeviceLovOpen', () => {
    it('loads devices when opened with relatedCode', () => {
      const devices = [{ equipId: 'E1', serialNumber: 'SN1' }];
      serviceSpy.getDeviceOptions.mockReturnValue(of(devices));
      component.onDeviceLovOpen(true, makeParm({ relatedCode: 'RC1' }));
      expect(component.deviceOptions()).toEqual(devices);
    });

    it('does nothing when not opened', () => {
      component.onDeviceLovOpen(false, makeParm({ relatedCode: 'RC1' }));
      expect(serviceSpy.getDeviceOptions).not.toHaveBeenCalled();
    });

    it('does nothing when no relatedCode', () => {
      component.onDeviceLovOpen(true, makeParm({ relatedCode: null }));
      expect(serviceSpy.getDeviceOptions).not.toHaveBeenCalled();
    });

    it('handles error', () => {
      serviceSpy.getDeviceOptions.mockReturnValue(throwError(() => new Error()));
      component.onDeviceLovOpen(true, makeParm({ relatedCode: 'RC1' }));
      expect(component.isLoadingDeviceLov).toBe(false);
    });
  });

  describe('onDeviceSelect', () => {
    it('calls updateParmAndValidate', () => {
      const row = makeParm({ datatype: 'DEVICE' });
      component.parameters.set([row]);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.onDeviceSelect('E1', row);
      expect(serviceSpy.validateParameter).toHaveBeenCalled();
    });
  });

  describe('onReagentLovOpen', () => {
    it('loads reagents when opened with relatedCode and batchInfo', () => {
      const reagents = [{ reagentId: 'R1', expiryDate: '2025-01-01' }];
      serviceSpy.getReagentLovOptions.mockReturnValue(of(reagents));
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.onReagentLovOpen(true, makeParm({ relatedCode: 'RC1' }));
      expect(component.reagentLovOptions()).toEqual(reagents);
    });

    it('does nothing when not opened', () => {
      component.onReagentLovOpen(false, makeParm({ relatedCode: 'RC1' }));
      expect(serviceSpy.getReagentLovOptions).not.toHaveBeenCalled();
    });

    it('does nothing when no batchInfo', () => {
      component.batchInfo.set(null);
      component.onReagentLovOpen(true, makeParm({ relatedCode: 'RC1' }));
      expect(serviceSpy.getReagentLovOptions).not.toHaveBeenCalled();
    });

    it('handles error', () => {
      serviceSpy.getReagentLovOptions.mockReturnValue(throwError(() => new Error()));
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.onReagentLovOpen(true, makeParm({ relatedCode: 'RC1' }));
      expect(component.isLoadingReagentLov).toBe(false);
    });
  });

  describe('onReagentSelect', () => {
    it('calls updateParmAndValidate', () => {
      const row = makeParm({ datatype: 'REAGENT' });
      component.parameters.set([row]);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.onReagentSelect('R1', row);
      expect(serviceSpy.validateParameter).toHaveBeenCalled();
    });
  });

  // ───── Dynamic Form Controls ─────

  describe('getDateControl / getTimeControl', () => {
    it('getDateControl creates and caches control', () => {
      const ctrl1 = component.getDateControl('P1', null);
      const ctrl2 = component.getDateControl('P1', null);
      expect(ctrl1).toBe(ctrl2);
    });

    it('getDateControl initializes with parsed date', () => {
      const ctrl = component.getDateControl('P1', '01-15-24');
      expect(ctrl.value).not.toBeNull();
    });

    it('getTimeControl creates and caches control', () => {
      const ctrl1 = component.getTimeControl('P1', null);
      const ctrl2 = component.getTimeControl('P1', null);
      expect(ctrl1).toBe(ctrl2);
    });

    it('getTimeControl initializes with parsed time', () => {
      const ctrl = component.getTimeControl('P1', '01-15-24 14:30');
      expect(ctrl.value).toBe('14:30');
    });
  });

  // ───── Save ─────

  describe('onSave', () => {
    beforeEach(() => {
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.testBatchControl.setValue('TB1');
      component.testControl.setValue('T1');
      component.kitControl.setValue('K1');
      component.parameters.set([makeParm({ parmValue: '5', acceptFlag: 'Y' })]);
    });

    it('does nothing when no batchInfo', () => {
      component.batchInfo.set(null);
      component.onSave();
      expect(serviceSpy.save).not.toHaveBeenCalled();
    });

    it('calls save with SAVE mode and re-retrieves on success', () => {
      serviceSpy.save.mockReturnValue(of({ status: 'OK', message: 'Saved', warnings: null }));
      component.onSave();
      expect(serviceSpy.save).toHaveBeenCalledWith(expect.objectContaining({ saveMode: 'SAVE' }));
      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
    });

    it('sets confirmFlag=Y in TECH1_SELF_CONFIRM mode', () => {
      component.parameters.set([makeParm({ techNo: 1, tech1Reqd: 'Y', tech2Reqd: 'X', parmValue: '5' })]);
      serviceSpy.save.mockReturnValue(of({ status: 'OK', message: 'Saved', warnings: null }));
      component.onSave();
      const call = serviceSpy.save.mock.calls[0][0];
      expect(call.parameters[0].confirmFlag).toBe('Y');
    });

    it('handles save error', () => {
      serviceSpy.save.mockReturnValue(throwError(() => new Error()));
      component.onSave();
      expect(component.isLoading()).toBe(false);
    });
  });

  // ───── Confirm ─────

  describe('onConfirmBatch', () => {
    beforeEach(() => {
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.testBatchControl.setValue('TB1');
      component.testControl.setValue('T1');
      component.kitControl.setValue('K1');
      component.parameters.set([makeParm({ parmValue: '5' })]);
    });

    it('does nothing when no batchInfo', () => {
      component.batchInfo.set(null);
      component.onConfirmBatch();
      expect(serviceSpy.save).not.toHaveBeenCalled();
    });

    it('sends CONFIRM mode with confirmFlag=Y', () => {
      serviceSpy.save.mockReturnValue(of({ status: 'OK', message: 'Confirmed', warnings: null }));
      component.onConfirmBatch();
      const call = serviceSpy.save.mock.calls[0][0];
      expect(call.saveMode).toBe('CONFIRM');
      expect(call.parameters[0].confirmFlag).toBe('Y');
    });

    it('handles confirm error', () => {
      serviceSpy.save.mockReturnValue(throwError(() => new Error()));
      component.onConfirmBatch();
      expect(component.isLoading()).toBe(false);
    });
  });

  // ───── Finalize ─────

  describe('onFinalizeBatch', () => {
    it('does nothing when no batchInfo', () => {
      component.batchInfo.set(null);
      component.onFinalizeBatch();
      expect(serviceSpy.save).not.toHaveBeenCalled();
    });

    it('clears state on successful finalize', () => {
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.parameters.set([makeParm({ parmValue: '5', firstTech: 'T1', secondTech: 'T2' })]);
      serviceSpy.save.mockReturnValue(of({ status: 'OK', message: 'Committed', warnings: null }));
      component.onFinalizeBatch();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Committed');
      expect(component.isLoading()).toBe(false);
    });

    it('opens void dialog on VOID_REQUIRED', () => {
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.parameters.set([makeParm({ parmValue: '5', firstTech: 'T1', secondTech: 'T2' })]);
      const afterClosed$ = new Subject<boolean>();
      const openFn = jest.fn().mockReturnValue({ afterClosed: () => afterClosed$ });
      (component as any).dialog = { open: openFn };
      serviceSpy.save.mockReturnValue(of({ status: 'VOID_REQUIRED', message: 'Void needed', warnings: null }));
      component.onFinalizeBatch();
      expect(component.isLoading()).toBe(false);
      expect(openFn).toHaveBeenCalled();
    });

    it('handles finalize error', () => {
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.parameters.set([makeParm({ parmValue: '5', firstTech: 'T1', secondTech: 'T2' })]);
      serviceSpy.save.mockReturnValue(throwError(() => new Error()));
      component.onFinalizeBatch();
      expect(component.isLoading()).toBe(false);
    });
  });

  // ───── Void Dialog ─────

  describe('void dialog (via finalize)', () => {
    function setupFinalize() {
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      component.parameters.set([makeParm({ parmValue: '5' })]);
      const afterClosed$ = new Subject<boolean>();
      const openFn = jest.fn().mockReturnValue({ afterClosed: () => afterClosed$ });
      (component as any).dialog = { open: openFn };
      return { afterClosed$, openFn };
    }

    it('sends save with VOID_CONFIRMED when user confirms', () => {
      const { afterClosed$ } = setupFinalize();
      serviceSpy.save
        .mockReturnValueOnce(of({ status: 'VOID_REQUIRED', message: '', warnings: null }))
        .mockReturnValueOnce(of({ status: 'OK', message: 'Voided', warnings: null }));

      component.onFinalizeBatch();
      afterClosed$.next(true);

      expect(serviceSpy.save).toHaveBeenCalledTimes(2);
      const secondCall = serviceSpy.save.mock.calls[1][0];
      expect(secondCall.overrides).toEqual(['VOID_CONFIRMED']);
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Voided');
    });

    it('does nothing when user cancels void dialog', () => {
      const { afterClosed$ } = setupFinalize();
      serviceSpy.save.mockReturnValue(of({ status: 'VOID_REQUIRED', message: '', warnings: null }));

      component.onFinalizeBatch();
      afterClosed$.next(false);

      expect(serviceSpy.save).toHaveBeenCalledTimes(1);
    });

    it('handles error on void-confirmed save', () => {
      const { afterClosed$ } = setupFinalize();
      serviceSpy.save
        .mockReturnValueOnce(of({ status: 'VOID_REQUIRED', message: '', warnings: null }))
        .mockReturnValueOnce(throwError(() => new Error()));

      component.onFinalizeBatch();
      afterClosed$.next(true);

      expect(component.isLoading()).toBe(false);
    });
  });

  // ───── Related Parm Value ─────

  describe('getRelatedParmValue (via onValueBlur)', () => {
    it('finds related parameter value', () => {
      const p1 = makeParm({ parmCode: 'BASELINE', parmValue: '10' });
      const p2 = makeParm({ parmCode: 'DELTA', parmValue: null, relatedCode: 'BASELINE' });
      component.parameters.set([p1, p2]);
      component.batchInfo.set({ tbId: 'TB1', testId: 'T1', testDesc: '', unitCount: 0, configMessage: null, testKitId: 'K1' });
      serviceSpy.validateParameter.mockReturnValue(of({ acceptFlag: 'Y', status: 'OK', convertedValue: null, warnings: null }));

      component.onValueBlur({ target: { value: '5' } } as any, p2);

      const call = serviceSpy.validateParameter.mock.calls[0][0];
      expect(call.relatedParmValue).toBe('10');
    });
  });

  // ───── Chapter Change ─────

  describe('chapter change', () => {
    it('resets state and reloads test batch options', () => {
      component.testBatchControl.setValue('TB1');
      component.parameters.set([makeParm()]);
      serviceSpy.getTestBatchOptions.mockReturnValue(of([]));

      chapterChanged$.next();

      expect(component.testBatchControl.value).toBeNull();
      expect(component.parameters()).toEqual([]);
      expect(serviceSpy.getTestBatchOptions).toHaveBeenCalled();
    });
  });

  // ───── Filtered LOVs ─────

  describe('filtered LOV computeds', () => {
    it('filteredTestBatches returns all when no search', () => {
      const opts = [{ tbId: 'TB1', testId: 'T1', statusMessage: '' }];
      component.testBatchOptions.set(opts);
      component.tbSearchControl.setValue('');
      expect(component.filteredTestBatches()).toEqual(opts);
    });

    it('filteredTestBatches filters by tbId', () => {
      component.testBatchOptions.set([
        { tbId: 'ABC', testId: 'T1', statusMessage: '' },
        { tbId: 'XYZ', testId: 'T2', statusMessage: '' },
      ]);
      component.tbSearchControl.setValue('abc');
      component.testBatchOptions.update(v => [...v]);
      expect(component.filteredTestBatches().length).toBe(1);
    });

    it('filteredTests filters by testDesc', () => {
      component.testOptions.set([
        { testId: 'T1', testDesc: 'Alpha Test', statusMessage: '' },
        { testId: 'T2', testDesc: 'Beta Test', statusMessage: '' },
      ]);
      component.testSearchControl.setValue('alpha');
      component.testOptions.update(v => [...v]);
      expect(component.filteredTests().length).toBe(1);
    });

    it('filteredRuns filters by runId', () => {
      component.runOptions.set([
        { runId: 'R1', insertDate: '' },
        { runId: 'R2', insertDate: '' },
      ]);
      component.runSearchControl.setValue('r1');
      component.runOptions.update(v => [...v]);
      expect(component.filteredRuns().length).toBe(1);
    });

    it('filteredKits filters by testKitId', () => {
      component.kitOptions.set([
        { testKitId: 'KIT-A', testKitClass: '', insertDate: '' },
        { testKitId: 'KIT-B', testKitClass: '', insertDate: '' },
      ]);
      component.kitSearchControl.setValue('kit-a');
      component.kitOptions.update(v => [...v]);
      expect(component.filteredKits().length).toBe(1);
    });
  });

  // ───── loadDependentLovs ─────

  describe('loadDependentLovs (via onTestChange)', () => {
    it('auto-selects runId from batch detail', () => {
      const detail = { testKitId: 'K1', parmType: 'P', runId: 'R1', kitLotNumber: null, testingLabCode: null };
      serviceSpy.getBatchDetail.mockReturnValue(of(detail));
      serviceSpy.getRunOptions.mockReturnValue(of([{ runId: 'R1', insertDate: '' }]));
      serviceSpy.getKitOptions.mockReturnValue(of([]));
      component.testBatchControl.setValue('TB1');
      component.onTestChange('T1');
      expect(component.runControl.value).toBe('R1');
    });

    it('auto-selects testKitId from batch detail', () => {
      const detail = { testKitId: 'K1', parmType: null, runId: null, kitLotNumber: 'LOT1', testingLabCode: null };
      serviceSpy.getBatchDetail.mockReturnValue(of(detail));
      serviceSpy.getKitOptions.mockReturnValue(of([{ testKitId: 'K1', testKitClass: '', insertDate: '' }]));
      component.testBatchControl.setValue('TB1');
      component.onTestChange('T1');
      expect(component.kitControl.value).toBe('K1');
    });

    it('does not load runs when no parmType', () => {
      const detail = { testKitId: null, parmType: null, runId: null, kitLotNumber: null, testingLabCode: null };
      serviceSpy.getBatchDetail.mockReturnValue(of(detail));
      serviceSpy.getKitOptions.mockReturnValue(of([]));
      component.testBatchControl.setValue('TB1');
      component.onTestChange('T1');
      expect(serviceSpy.getRunOptions).not.toHaveBeenCalled();
    });

    it('handles run options error', () => {
      const detail = { testKitId: null, parmType: 'P', runId: null, kitLotNumber: null, testingLabCode: null };
      serviceSpy.getBatchDetail.mockReturnValue(of(detail));
      serviceSpy.getRunOptions.mockReturnValue(throwError(() => new Error()));
      serviceSpy.getKitOptions.mockReturnValue(of([]));
      component.testBatchControl.setValue('TB1');
      component.onTestChange('T1');
      expect(component.isLoadingRuns).toBe(false);
    });

    it('handles kit options error', () => {
      const detail = { testKitId: null, parmType: null, runId: null, kitLotNumber: null, testingLabCode: null };
      serviceSpy.getBatchDetail.mockReturnValue(of(detail));
      serviceSpy.getKitOptions.mockReturnValue(throwError(() => new Error()));
      component.testBatchControl.setValue('TB1');
      component.onTestChange('T1');
      expect(component.isLoadingKits).toBe(false);
    });
  });

  // ───── ngOnDestroy ─────

  it('ngOnDestroy completes destroy$', () => {
    const spy = jest.spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
