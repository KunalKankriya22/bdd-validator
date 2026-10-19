import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

import { ConfirmatoryReleaseTestResultsComponent } from './confirmatory-release-test-results';
import { ConfirmatoryQcService } from './services/confirmatory-qc.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MatDialog } from '@angular/material/dialog';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ConfirmatoryReleaseTestResultsComponent', () => {
  let component: ConfirmatoryReleaseTestResultsComponent;
  let fixture: ComponentFixture<ConfirmatoryReleaseTestResultsComponent>;
  let qcServiceSpy: jasmine.SpyObj<ConfirmatoryQcService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterChanged$: Subject<void>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockContracts = [
    { contractId: 'C12345', companyName: 'ABC Blood Services' },
    { contractId: 'C67890', companyName: 'XYZ Medical Center' },
  ];

  const mockBatches = [
    { batchId: 'BATCH001', isInUse: false },
    { batchId: 'BATCH002', isInUse: true },
  ];

  const mockTestSeries = [
    { testSeriesId: 'CONF01', description: 'Confirmatory Test Series 1' },
  ];

  const mockTests = [
    { testId: 'HIV12', testDescription: 'HIV 1/2 Antibody Test' },
  ];

  const mockQueryResponse = {
    sessionId: '260530153045001',
    units: [
      {
        unitId: 'W120624120401',
        checkDigit: 'L',
        tubeCheckIn: 'Yes',
        collectionDate: '2026-05-25T00:00:00Z',
        reason: 'OK',
        qcFlag: 'Y',
        redTube1: 'Y',
        redTube2: 'N',
        purpleTube1: 'Y',
        purpleTube2: 'N',
        daysSinceCollection: 5,
        collectionDateColor: 'GREEN',
        hasWarning: false,
      },
    ],
    summaryStats: {
      totalUnits: 1,
      skippedUnits: 0,
      noResultUnits: 0,
      sqcUnits: 0,
    },
  };

  const mockUnitDetail = {
    unitId: 'W120624120401',
    checkDigit: 'L',
    batchId: 'BATCH001',
    profileSetId: 'PROF01',
    chapterId: '0001',
    testSeriesId: 'CONF01',
    testId: null,
    testResults: [
      {
        sequence: 1,
        testId: 'HIV12',
        result: 'NR',
        description: 'Non-Reactive',
        interimResult: null,
        isReactive: false,
      },
    ],
    hasWarning: false,
  };

  beforeEach(() => {

    qcServiceSpy = jasmine.createSpyObj('ConfirmatoryQcService', [
      'queryUnits',
      'getUnits',
      'getUnitDetail',
      'reconcileAll',
      'save',
      'clearSession',
      'getContracts',
      'getBatches',
      'getTestSeries',
      'getTests',
    ]);

    snackbarServiceSpy = createMockSnackbarService();

    dialogSpy = createMockMatDialog();

    chapterChanged$ = new Subject<void>();
    headerServiceSpy = createMockHeaderService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: () => ({ title: 'Confirmatory Release Test Results', subtitle: 'Description goes here' }),
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('Confirmatory Release Test Results');
    pageHeaderServiceSpy.getSubtitle.and.returnValue('Description goes here');

    // Setup default spy returns
    qcServiceSpy.getContracts.and.returnValue(of(mockContracts));
    qcServiceSpy.getBatches.and.returnValue(of(mockBatches));
    qcServiceSpy.getTestSeries.and.returnValue(of(mockTestSeries));
    qcServiceSpy.getTests.and.returnValue(of(mockTests));
    qcServiceSpy.queryUnits.and.returnValue(of(mockQueryResponse));
    qcServiceSpy.getUnitDetail.and.returnValue(of(mockUnitDetail));
    qcServiceSpy.reconcileAll.and.returnValue(of(true));
    qcServiceSpy.save.and.returnValue(of(true));
    qcServiceSpy.clearSession.and.returnValue(of(true));



      TestBed.configureTestingModule({
      imports: [
        ConfirmatoryReleaseTestResultsComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: ConfirmatoryQcService, useValue: qcServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
        { provide: Router, useValue: { url: '/', events: of(), navigate: () => Promise.resolve(true), createUrlTree: () => ({}), serializeUrl: () => '' } },
      ],
    })
    .overrideComponent(ConfirmatoryReleaseTestResultsComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });


    


      qcServiceSpy.queryUnits.calls.reset();


      qcServiceSpy.getUnits.calls.reset();


      qcServiceSpy.getUnitDetail.calls.reset();


      qcServiceSpy.reconcileAll.calls.reset();


      qcServiceSpy.save.calls.reset();


      qcServiceSpy.clearSession.calls.reset();


      qcServiceSpy.getContracts.calls.reset();


      qcServiceSpy.getBatches.calls.reset();


      qcServiceSpy.getTestSeries.calls.reset();


      qcServiceSpy.getTests.calls.reset();


      dialogSpy.open.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getSubtitle.calls.reset();


      pageHeaderServiceSpy.getTitle.and.returnValue('Confirmatory Release Test Results');


      pageHeaderServiceSpy.getSubtitle.and.returnValue('Description goes here');


      qcServiceSpy.getContracts.and.returnValue(of(mockContracts));


      qcServiceSpy.getBatches.and.returnValue(of(mockBatches));


      qcServiceSpy.getTestSeries.and.returnValue(of(mockTestSeries));


      qcServiceSpy.getTests.and.returnValue(of(mockTests));


      qcServiceSpy.queryUnits.and.returnValue(of(mockQueryResponse));


      qcServiceSpy.getUnitDetail.and.returnValue(of(mockUnitDetail));


      qcServiceSpy.reconcileAll.and.returnValue(of(true));


      qcServiceSpy.save.and.returnValue(of(true));


      qcServiceSpy.clearSession.and.returnValue(of(true));


    fixture = TestBed.createComponent(
      ConfirmatoryReleaseTestResultsComponent
    );
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should load dropdown data on init', () => {
      fixture.detectChanges();
      expect(qcServiceSpy.getTestSeries).toHaveBeenCalled();
      expect(qcServiceSpy.getTests).toHaveBeenCalled();
    });
  });

  describe('Query Units', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should query units successfully', () => {
      component.filterForm.patchValue({
        allResults: 'Y',
      });

      (component as any).onRetrieve();

      expect(qcServiceSpy.queryUnits).toHaveBeenCalled();
      expect((component as any).sessionId()).toBe('260530153045001');
      expect((component as any).units().length).toBe(1);
    });





    it('should auto-select first unit after query', () => {
      component.filterForm.patchValue({
        allResults: 'Y',
      });

      (component as any).onRetrieve();

      expect((component as any).selectedUnit()).toBeTruthy();
      expect((component as any).selectedUnit()?.unitId).toBe('W120624120401');
      expect((component as any).currentUnitIndex()).toBe(0);
    });
  });

  describe('Unit Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).sessionId.set('260530153045001');
      (component as any).units.set(mockQueryResponse.units);
    });

    it('should select a unit and load detail', () => {
      const unit = (component as any).units()[0];
      (component as any).selectUnit(unit, 0);

      expect(qcServiceSpy.getUnitDetail).toHaveBeenCalledWith(
        '260530153045001',
        'W120624120401'
      );
      expect((component as any).selectedUnit()).toBe(unit);
      expect((component as any).currentUnitIndex()).toBe(0);
    });

    it('should handle unit detail load error', () => {
      qcServiceSpy.getUnitDetail.and.returnValue(
        throwError(() => ({
          error: { message: 'Failed to load unit detail' },
        }))
      );

      const unit = (component as any).units()[0];
      (component as any).selectUnit(unit, 0);

      expect((component as any).error()).toBe('Failed to load unit detail');
    });
  });



  describe('QC Flag Changes', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).units.set(mockQueryResponse.units);
    });



    it('should update unit QC flag in list', () => {
      (component as any).onQcChange('W120624120401', 'N');

      const unit = (component as any).units().find((u: any) => u.unitId === 'W120624120401');
      expect(unit?.qcFlag).toBe('N');
    });


  });

  describe('Reconcile All', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).sessionId.set('260530153045001');
      (component as any).units.set(mockQueryResponse.units);
    });

    it('should reconcile all units successfully', () => {
      qcServiceSpy.getUnits.and.returnValue(of(mockQueryResponse.units));

      (component as any).onReconcileAll();

      expect(qcServiceSpy.reconcileAll).toHaveBeenCalledWith(
        '260530153045001'
      );
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should handle reconcile error', () => {
      qcServiceSpy.reconcileAll.and.returnValue(
        throwError(() => ({
          error: { message: 'Failed to reconcile units' },
        }))
      );

      (component as any).onReconcileAll();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to reconcile units'
      );
    });
  });

  describe('Save', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).sessionId.set('260530153045001');
      (component as any).units.set(mockQueryResponse.units);
    });

    it('should save directly when all units are approved', () => {
      (component as any).onSave();

      expect(dialogSpy.open).not.toHaveBeenCalled();
      expect(qcServiceSpy.save).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect((component as any).qcChanges().size).toBe(0);
    });

    it('should show confirmation dialog when units are not all approved', () => {
      (component as any).units.set([
        { ...mockQueryResponse.units[0], qcFlag: 'Y', reason: 'OK' },
        { ...mockQueryResponse.units[0], unitId: 'W999', qcFlag: 'N', reason: 'SQC', hasWarning: true },
      ]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      (component as any).onSave();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(qcServiceSpy.save).toHaveBeenCalled();
    });

    it('should not save when confirmation dialog is cancelled', () => {
      (component as any).units.set([
        { ...mockQueryResponse.units[0], qcFlag: 'N', reason: 'SQC', hasWarning: true },
      ]);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      (component as any).onSave();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(qcServiceSpy.save).not.toHaveBeenCalled();
    });




  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).sessionId.set('260530153045001');
      (component as any).units.set(mockQueryResponse.units);
    });

    it('should clear all data and reset form', () => {
      (component as any).onClearAll();

      expect((component as any).units().length).toBe(0);
      expect((component as any).selectedUnit()).toBeNull();
      expect((component as any).unitDetail()).toBeNull();
      expect((component as any).qcChanges().size).toBe(0);
      expect(qcServiceSpy.clearSession).toHaveBeenCalled();
    });
  });



  describe('Helper Methods', () => {
    it('should get correct CSS class for collection date colors', () => {
      expect((component as any).getCollectionDateClass('WHITE')).toBe(
        'collection-date-white'
      );
      expect((component as any).getCollectionDateClass('YELLOW')).toBe(
        'collection-date-yellow'
      );
      expect((component as any).getCollectionDateClass('GREEN')).toBe(
        'collection-date-green'
      );
      expect((component as any).getCollectionDateClass('RED')).toBe(
        'collection-date-red'
      );
      expect((component as any).getCollectionDateClass('BLUE')).toBe(
        'collection-date-blue'
      );
      expect((component as any).getCollectionDateClass(null)).toBe('');
    });

    it('should compute table columns', () => {
      const cols = (component as any).unitsTableColumns();
      expect(cols).toContain('unitId');
      expect(cols).toContain('reason');
      expect(cols).toContain('qc');
    });

    it('should return selected test series description', () => {
      component.ngOnInit();
      component.filterForm.patchValue({ testSeriesId: 'CONF01' });
      expect((component as any).selectedTestSeriesDescription()).toBe('Confirmatory Test Series 1');
    });

    it('should return dash when no test series selected', () => {
      fixture.detectChanges();
      expect((component as any).selectedTestSeriesDescription()).toBe('-');
    });

    it('should return selected test description', () => {
      component.ngOnInit();
      component.filterForm.patchValue({ testId: 'HIV12' });
      expect((component as any).selectedTestDescription()).toBe('HIV 1/2 Antibody Test');
    });

    it('should return dash when no test selected', () => {
      fixture.detectChanges();
      expect((component as any).selectedTestDescription()).toBe('-');
    });

    it('should display unit ID with check digit', () => {
      (component as any).selectedUnit.set({ unitId: 'W120624120401', checkDigit: 'L', hasWarning: false });
      (component as any).unitDetail.set({ checkDigit: 'L' });
      expect((component as any).selectedUnitDisplay()).toBe('W120624120401-L');
    });
  });

  describe('Cleanup', () => {
    it('should clear session on component destroy', () => {
      fixture.detectChanges();
      (component as any).sessionId.set('260530153045001');

      component.ngOnDestroy();

      expect(qcServiceSpy.clearSession).toHaveBeenCalledWith(
        '260530153045001'
      );
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique component IDs', () => {
      const fixture2 = TestBed.createComponent(
        ConfirmatoryReleaseTestResultsComponent
      );
      const component2 = fixture2.componentInstance;

      expect((component as any).componentId).not.toBe((component2 as any).componentId);
    });


  });


});
