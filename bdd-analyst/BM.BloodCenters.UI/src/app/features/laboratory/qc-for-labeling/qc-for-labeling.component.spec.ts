import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateModule } from '@ngx-translate/core';

import { QcForLabelingComponent } from './qc-for-labeling.component';
import { LabQcService } from './services/lab-qc.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { MenuService } from '@shared/services/menu.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { UnitQcStatus, TestBatchDropdown, BatchUnitsResponse, LabQcSummaryDto } from './models/lab-qc-summary.model';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('QcForLabelingComponent', () => {
  let component: QcForLabelingComponent;
  let fixture: ComponentFixture<QcForLabelingComponent>;
  let labQcServiceSpy: jasmine.SpyObj<LabQcService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;

  const mockBatches: TestBatchDropdown[] = [
    {
      tbId: '030418-TB101',
      testChapterId: 'DAL',
      insertDate: '2026-05-27T00:00:00'
    }
  ];

  const mockQcRecords: UnitQcStatus[] = [
    {
      sequenceNumber: 1,
      unitId: 'W123417070471-F',
      displayUnitId: null,
      collDate: '2026-05-27',
      chapterId: 'DAL',
      checkDigit: null,
      donorInterface: 'Y',
      testingFlag: 'Y',
      nursingAuditFlag: 'Y',
      componentReview: 'Y',
      qcLabelFlag: 'Y'
    }
  ];

  const mockBatchUnitsResponse: BatchUnitsResponse = {
    tbId: '030418-TB101',
    testChapterId: 'DAL',
    unscheduledUnitCount: 0,
    units: mockQcRecords
  };

  const mockSummary: LabQcSummaryDto = {
    components: [{
      unitId: 'W123417070471-F',
      collDate: '2026-05-27',
      chapterId: 'DAL',
      productCode: 'RBC',
      abo: 'A',
      rh: 'POS',
      status: null,
      poolId: null,
      expDate: '2026-06-15T00:00:00',
      lotNumber: null,
      volume: 450,
      location: null,
      modifiedDate: null,
      modifiedUser: null,
      productDescription: 'Red Blood Cells',
      expirationDate: '2026-06-15T00:00:00',
      noteId: null,
      insertDate: '2026-05-27T14:30:00',
      insertUser: null,
      componentPrefix: 'RBC',
      bagId: 'AHEO',
      systemLabelDecision: 'PASS',
      rejectReasonCode: null,
      labelDats: '2026-05-27T15:00:00',
      bagsUsed: 1
    }],
    testResults: [
      {
        unitId: 'W123417070471-F',
        collDate: '2026-05-27',
        chapterId: 'DAL',
        testId: 'ABORH',
        testSeqNo: 1,
        testResult: '51',
        testDate: null,
        performedBy: null,
        comments: null,
        resultCode: null,
        cancelFlag: null,
        absorbance: null,
        resultStatus: null,
        testDescription: null,
        resultStatusDescription: null,
        tbId: '030418-TB1001',
        ratio: null,
        resultStatus1: null
      }
    ],
    testBase: [
      {
        unitId: 'W123417070471-F',
        collDate: '2026-05-27',
        chapterId: 'DAL',
        testId: 'HCV',
        testSeqNo: 1,
        testDescription: 'HCV Test',
        testType: 'REQUIRED',
        requiredFlag: 'Y',
        cancelFlag: null
      }
    ]
  };

  beforeEach(() => {

    labQcServiceSpy = jasmine.createSpyObj('LabQcService', [
      'getTestBatches', 'getBatchUnits', 'getQcSummary', 'getComponentDetails', 'saveQcLabels'
    ]);
    headerServiceSpy = createMockHeaderService();
    menuServiceSpy = jasmine.createSpyObj('MenuService', ['getMenuItemsSignal', 'findMenuItemByPath']);
    snackbarServiceSpy = createMockSnackbarService();

    menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));
    (headerServiceSpy as any).warehouseName = signal('DAL');
    labQcServiceSpy.getTestBatches.and.returnValue(of(mockBatches));
    labQcServiceSpy.getBatchUnits.and.returnValue(of(mockBatchUnitsResponse));
    labQcServiceSpy.getQcSummary.and.returnValue(of(mockSummary));
    labQcServiceSpy.saveQcLabels.and.returnValue(of({ success: true, message: 'QC labels saved successfully. 1 units updated.', statusCode: 200, data: undefined as any }));



      TestBed.configureTestingModule({
      imports: [QcForLabelingComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: LabQcService, useValue: labQcServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: { getTitle: () => 'QC for Labeling' } },
        { provide: MenuService, useValue: menuServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy }
      ]
    });


    


      labQcServiceSpy.getTestBatches.calls.reset();


      labQcServiceSpy.getBatchUnits.calls.reset();


      labQcServiceSpy.getQcSummary.calls.reset();


      labQcServiceSpy.getComponentDetails.calls.reset();


      labQcServiceSpy.saveQcLabels.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      headerServiceSpy.getCurrentWarehouseId.calls.reset();


      menuServiceSpy.getMenuItemsSignal.calls.reset();


      menuServiceSpy.findMenuItemByPath.calls.reset();


      menuServiceSpy.getMenuItemsSignal.and.returnValue(signal([]));


      labQcServiceSpy.getTestBatches.and.returnValue(of(mockBatches));


      labQcServiceSpy.getBatchUnits.and.returnValue(of(mockBatchUnitsResponse));


      labQcServiceSpy.getQcSummary.and.returnValue(of(mockSummary));


      labQcServiceSpy.saveQcLabels.and.returnValue(of({ success: true, message: 'QC labels saved successfully. 1 units updated.', statusCode: 200, data: undefined as any }));


    fixture = TestBed.createComponent(QcForLabelingComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {


    it('should initialize filter form with null batch', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('aboRhBatch')?.value).toBeNull();
    });



    it('should load batches on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(labQcServiceSpy.getTestBatches).toHaveBeenCalled();
      expect(component['batches']().length).toBe(1);
    }));


  });
  describe('Data Table', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['loading'].set(false);
      component['error'].set(null);
      component['filteredData'].set(mockQcRecords);
      fixture.detectChanges();
    }));





    it('should configure table with no pagination', () => {
      expect(component.tableConfig.showPagination).toBeFalse();
    });

    it('should configure table with actions as menu', () => {
      expect(component.tableConfig.showActionsAsMenu).toBeTrue();
    });

    it('should have View Test as first action and View Components as second', () => {
      const actions = component.tableConfig.rowActions!;
      expect(actions[0].label).toBe('View Test');
      expect(actions[0].action).toBe('viewUnitTests');
      expect(actions[1].label).toBe('View Components');
      expect(actions[1].action).toBe('viewComponents');
    });
  });

  describe('Side Panel - View Components', () => {
    it('should open side panel and call API on View Components', fakeAsync(() => {
      component.onViewComponents(mockQcRecords[0]);

      expect(component['sidePanelOpen']()).toBeTrue();
      expect(component['currentPanelSection']()).toBe('components');
      expect(component['sidePanelRow']()).toEqual(mockQcRecords[0]);
      expect(labQcServiceSpy.getQcSummary).toHaveBeenCalledWith('W123417070471-F', '2026-05-27');

      tick();

      expect(component['panelLoading']()).toBeFalse();
      expect(component['componentRows']().length).toBe(1);
      expect(component['componentRows']()[0].productCode).toBe('RBC');
    }));

    it('should display components panel title with unit ID', fakeAsync(() => {
      component.onViewComponents(mockQcRecords[0]);
      tick();
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.side-panel-title'));
      expect(title.nativeElement.textContent).toContain('Components Defined for Unit ID');
      expect(title.nativeElement.textContent).toContain('W123417070471-F');
    }));


  });

  describe('Side Panel - View Tests', () => {
    it('should open side panel and call API on View Tests', fakeAsync(() => {
      component.onViewUnitTests(mockQcRecords[0]);

      expect(component['sidePanelOpen']()).toBeTrue();
      expect(component['currentPanelSection']()).toBe('tests');
      expect(component['sidePanelRow']()).toEqual(mockQcRecords[0]);
      expect(labQcServiceSpy.getQcSummary).toHaveBeenCalledWith('W123417070471-F', '2026-05-27');

      tick();

      expect(component['panelLoading']()).toBeFalse();
      expect(component['scheduledTests']().length).toBe(1);
      expect(component['unscheduledTests']().length).toBe(1);
    }));

    it('should display tests panel title with unit ID', fakeAsync(() => {
      component.onViewUnitTests(mockQcRecords[0]);
      tick();
      fixture.detectChanges();

      const title = fixture.debugElement.query(By.css('.side-panel-title'));
      expect(title.nativeElement.textContent).toContain('Scheduled / Unscheduled Tests for');
      expect(title.nativeElement.textContent).toContain('W123417070471-F');
    }));

    it('should display both scheduled and unscheduled sections', fakeAsync(() => {
      component.onViewUnitTests(mockQcRecords[0]);
      tick();
      fixture.detectChanges();

      const sectionTitles = fixture.debugElement.queryAll(By.css('.test-section-title'));
      expect(sectionTitles.length).toBe(2);
      expect(sectionTitles[0].nativeElement.textContent).toContain('Unit Tests Scheduled');
      expect(sectionTitles[1].nativeElement.textContent).toContain('Unit Tests Unscheduled');
    }));


  });

  describe('Side Panel - Close', () => {
    it('should close side panel and reset state', fakeAsync(() => {
      component.onViewComponents(mockQcRecords[0]);
      tick();

      component.onPanelClose();

      expect(component['sidePanelOpen']()).toBeFalse();
      expect(component['sidePanelRow']()).toBeNull();
      expect(component['currentPanelSection']()).toBeNull();
      expect(component['componentRows']()).toEqual([]);
      expect(component['scheduledTests']()).toEqual([]);
      expect(component['unscheduledTests']()).toEqual([]);
    }));

    it('should render close button with outline style', fakeAsync(() => {
      component.onViewComponents(mockQcRecords[0]);
      tick();
      fixture.detectChanges();

      const closeBtn = fixture.debugElement.query(By.css('.btn-close-outline'));
      expect(closeBtn).toBeTruthy();
      expect(closeBtn.nativeElement.textContent.trim()).toBe('CLOSE');
    }));




  });
  describe('Component Review', () => {
    it('should update component review value immutably', () => {
      component['filteredData'].set([...mockQcRecords]);
      component['qcData'].set([...mockQcRecords]);

      component.onComponentReviewChange(mockQcRecords[0], 'N');

      const updated = component['filteredData']();
      expect(updated[0].componentReview).toBe('N');
    });

    it('should have Y and N as review options', () => {
      expect(component['componentReviewOptions']).toEqual([
        { value: 'Y', label: 'Yes' },
        { value: 'N', label: 'No' }
      ]);
    });
  });

  describe('Clear', () => {
    it('should reset all state on clear', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component['qcData'].set(mockQcRecords);
      component['filteredData'].set(mockQcRecords);
      component['selectedBatch'].set('030418-TB101');
      component['unscheduledCount'].set(5);

      component.onClear();

      expect(component.filterForm.get('aboRhBatch')?.value).toBeNull();
      expect(component['qcData']()).toEqual([]);
      expect(component['filteredData']()).toEqual([]);
      expect(component['selectedBatch']()).toBeNull();
      expect(component['unscheduledCount']()).toBe(0);
      expect(component['error']()).toBeNull();
    }));
  });

  describe('Save', () => {
    it('should call saveQcLabels API on save', fakeAsync(() => {
      component['filteredData'].set(mockQcRecords);
      component.onSave();
      tick();

      expect(labQcServiceSpy.saveQcLabels).toHaveBeenCalledWith({
        items: [{
          unitId: 'W123417070471-F',
          collDate: '2026-05-27',
          chapterId: 'DAL',
          componentReview: 'Y',
          qcLabelFlag: 'Y'
        }]
      });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));




  });

  describe('Computed Values', () => {
    it('should compute hasData correctly', () => {
      component['filteredData'].set([]);
      expect(component['hasData']()).toBeFalse();

      component['filteredData'].set(mockQcRecords);
      expect(component['hasData']()).toBeTrue();
    });

    it('should compute isReady correctly', () => {
      component['loading'].set(false);
      component['error'].set(null);
      expect(component['isReady']()).toBeTrue();

      component['loading'].set(true);
      expect(component['isReady']()).toBeFalse();

      component['loading'].set(false);
      component['error'].set('err');
      expect(component['isReady']()).toBeFalse();
    });
  });
});
