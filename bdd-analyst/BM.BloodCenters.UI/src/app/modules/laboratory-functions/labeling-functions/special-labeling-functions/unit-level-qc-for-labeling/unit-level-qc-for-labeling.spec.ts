import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { of, throwError, delay } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { UnitLevelQcForLabelingComponent } from './unit-level-qc-for-labeling';
import { UnitLevelQcApiService } from './services/unit-level-qc-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  QcStatusResponse,
  CommitQcResponse,
  ComponentsResponse,
  TestsResponse,
  UnitLevelQCValidateResponse
} from './models/unit-level-qc.model';

describe('UnitLevelQcForLabelingComponent', () => {
  let component: any;
  let fixture: ComponentFixture<UnitLevelQcForLabelingComponent>;
  let apiServiceSpy: jasmine.SpyObj<UnitLevelQcApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;

  const mockQcStatusResponse: QcStatusResponse = {
    success: true,
    statusCode: 200,
    message: 'Unit is eligible for QC labeling',
    item: {
      unitId: 'W1234567890',
      collDate: '2024-01-15T00:00:00',
      chapterId: 'CH01',
      contractId: 'INTERNAL',
      contractType: 'INTERNAL',
      donorInterface: 'Y',
      testingFlag: 'Y',
      nursingAuditFlag: 'Y',
      componentReview: 'Y',
      qcLabelFlag: 'N',
      qcLabelDate: null,
      expectedBagCount: 3,
      actualComponentCount: 3,
      isEligibleForQc: true
    }
  };

  const mockComponentsResponse: ComponentsResponse = {
    success: true,
    statusCode: 200,
    message: 'Components retrieved successfully',
    data: [
      {
        unitId: 'W1234567890',
        collDate: '2024-01-15T00:00:00',
        chapterId: 'CH01',
        productCode: 'E0791',
        componentPrefix: '01',
        bagId: 'BAG001',
        expiryDate: '2024-02-14T00:00:00',
        systemLabelDecision: 'PASS',
        rejectReasonCode: null,
        insertDats: '2024-01-15T10:30:00',
        labelDats: '2024-01-15T11:00:00'
      },
      {
        unitId: 'W1234567890',
        collDate: '2024-01-15T00:00:00',
        chapterId: 'CH01',
        productCode: 'E0792',
        componentPrefix: '02',
        bagId: 'BAG002',
        expiryDate: '2024-02-14T00:00:00',
        systemLabelDecision: null,
        rejectReasonCode: 'RJ01',
        insertDats: '2024-01-15T10:30:00',
        labelDats: null
      }
    ],
    total: 2
  };

  const mockScheduledTestsResponse: TestsResponse = {
    success: true,
    statusCode: 200,
    message: 'Scheduled tests retrieved successfully',
    data: [
      {
        unitId: 'W1234567890',
        collDate: '2024-01-15T00:00:00',
        chapterId: 'CH01',
        testId: 'ABO',
        testSeqNo: 1,
        resultStatus1: 'PASS',
        tbId: 'TB20240115001',
        absorbance: '0.125',
        ratio: '1.5'
      }
    ],
    total: 1
  };

  const mockUnscheduledTestsResponse: TestsResponse = {
    success: true,
    statusCode: 200,
    message: 'Unscheduled tests retrieved successfully',
    data: [
      {
        unitId: 'W1234567890',
        collDate: '2024-01-15T00:00:00',
        chapterId: 'CH01',
        testId: 'HCV',
        testSeqNo: 1,
        resultStatus1: 'PASS',
        tbId: 'TB20240115002',
        absorbance: '0.200',
        ratio: '2.0'
      }
    ],
    total: 1
  };

  const mockCommitQcSuccess: CommitQcResponse = {
    success: true,
    statusCode: 200,
    message: 'QC results committed successfully',
    item: true
  };

  const mockValidateResponse: UnitLevelQCValidateResponse = {
    success: true,
    statusCode: 200,
    message: 'Valid',
    isValid: true
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('UnitLevelQcApiService', [
      'validateUnit',
      'getQcStatus',
      'commitQc',
      'getComponents',
      'getScheduledTests',
      'getUnscheduledTests'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: signal(undefined)
    });
    pageHeaderServiceSpy.getTitle.and.returnValue('');

    apiServiceSpy.validateUnit.and.returnValue(of(mockValidateResponse));
    apiServiceSpy.getQcStatus.and.returnValue(of(mockQcStatusResponse));
    apiServiceSpy.getComponents.and.returnValue(of(mockComponentsResponse));
    apiServiceSpy.getScheduledTests.and.returnValue(of(mockScheduledTestsResponse));
    apiServiceSpy.getUnscheduledTests.and.returnValue(of(mockUnscheduledTestsResponse));
    apiServiceSpy.commitQc.and.returnValue(of(mockCommitQcSuccess));

    const mockTranslateService = createMockTranslateService();



      TestBed.configureTestingModule({
      imports: [UnitLevelQcForLabelingComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UnitLevelQcApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });


    


      apiServiceSpy.validateUnit.calls.reset();


      apiServiceSpy.getQcStatus.calls.reset();


      apiServiceSpy.commitQc.calls.reset();


      apiServiceSpy.getComponents.calls.reset();


      apiServiceSpy.getScheduledTests.calls.reset();


      apiServiceSpy.getUnscheduledTests.calls.reset();


      pageHeaderServiceSpy.getTitle.calls.reset();


      pageHeaderServiceSpy.getTitle.and.returnValue('');


      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateResponse));


      apiServiceSpy.getQcStatus.and.returnValue(of(mockQcStatusResponse));


      apiServiceSpy.getComponents.and.returnValue(of(mockComponentsResponse));


      apiServiceSpy.getScheduledTests.and.returnValue(of(mockScheduledTestsResponse));


      apiServiceSpy.getUnscheduledTests.and.returnValue(of(mockUnscheduledTestsResponse));


      apiServiceSpy.commitQc.and.returnValue(of(mockCommitQcSuccess));


    fixture = TestBed.createComponent(UnitLevelQcForLabelingComponent);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {
    it('should initialize the search form with default values', () => {
      fixture.detectChanges();

      expect(component.searchForm).toBeDefined();
      expect(component.componentReviewControl.value).toBeNull();
      expect(component.qcForLabelingControl.value).toBeNull();
    });

    it('should have qcForLabeling field enabled by default', () => {
      fixture.detectChanges();

      expect(component.qcForLabelingControl.enabled).toBeTrue();
    });

    it('should set default signal values', () => {
      fixture.detectChanges();

      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
      expect(component.hasSearched()).toBeFalse();
      expect(component.displayUnitId()).toBe('');
      expect(component.donorInterface()).toBe('—');
      expect(component.testingOk()).toBe('—');
      expect(component.nursingAudit()).toBe('—');
      expect(component.tableData()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
    });

    it('should configure table columns', () => {
      fixture.detectChanges();

      const columns = component.tableConfig.columns;
      expect(columns.length).toBe(7);
      expect(columns[0].key).toBe('productCode');
      expect(columns[1].key).toBe('catalogNumber');
      expect(columns[2].key).toBe('expirationDate');
      expect(columns[3].key).toBe('rejectReasonCode');
      expect(columns[4].key).toBe('rejectDateTime');
      expect(columns[5].key).toBe('systemLabelDecision');
      expect(columns[6].key).toBe('labelDate');
    });



    it('should set component review dropdown options with Yes/No labels', () => {
      fixture.detectChanges();

      expect(component.componentReviewOptions()).toEqual([
        { value: '', label: '—' },
        { value: 'Y', label: 'Yes' },
        { value: 'N', label: 'No' }
      ]);
    });

    it('should set QC For Labeling dropdown options with Yes/No labels', () => {
      fixture.detectChanges();

      expect(component.qcForLabelingOptions()).toEqual([
        { value: '', label: '—' },
        { value: 'Y', label: 'Yes' },
        { value: 'N', label: 'No' }
      ]);
    });
  });

  describe('Unit Validation (onUnitPostValidate)', () => {
    it('should call validateUnit and confirm on success', fakeAsync(() => {
      fixture.detectChanges();

      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event: any = {
        data: {
          manualUnitId: 'W1234567890',
          codeScheme: 'I',
          parsedUnitId: 'W1234567890'
        },
        confirm: confirmSpy,
        reject: rejectSpy
      };

      component.onUnitPostValidate(event);
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('W1234567890');
      expect(confirmSpy).toHaveBeenCalled();
      expect(rejectSpy).not.toHaveBeenCalled();
      expect(component.displayUnitId()).toBe('W1234567890');
    }));

    it('should reject when validation fails', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        success: false,
        statusCode: 400,
        message: 'Unit not eligible for labeling QC',
        isValid: false
      }));
      fixture.detectChanges();

      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event: any = {
        data: {
          manualUnitId: 'INVALID',
          codeScheme: 'I',
          parsedUnitId: 'INVALID'
        },
        confirm: confirmSpy,
        reject: rejectSpy
      };

      component.onUnitPostValidate(event);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit not eligible for labeling QC');
      expect(confirmSpy).not.toHaveBeenCalled();
    }));

    it('should reject on API error', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );
      fixture.detectChanges();

      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event: any = {
        data: {
          manualUnitId: 'W1234567890',
          codeScheme: 'I',
          parsedUnitId: 'W1234567890'
        },
        confirm: confirmSpy,
        reject: rejectSpy
      };

      component.onUnitPostValidate(event);
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Server error');
      expect(confirmSpy).not.toHaveBeenCalled();
    }));
  });

  describe('Retrieve Unit Data (QC Status + Components)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should populate info cards from QC status response', fakeAsync(() => {
      // Simulate setting parsedUnitId then triggering retrieve
      const confirmSpy = jasmine.createSpy('confirm');
      const event: any = {
        data: {
          manualUnitId: 'W1234567890',
          codeScheme: 'I',
          parsedUnitId: 'W1234567890'
        },
        confirm: confirmSpy,
        reject: jasmine.createSpy('reject')
      };

      component.onUnitPostValidate(event);
      tick();

      // Now trigger retrieve via onUnitValidated
      component.onUnitValidated({} as any);
      tick();

      expect(component.donorInterface()).toBe('Yes');
      expect(component.testingOk()).toBe('Yes');
      expect(component.nursingAudit()).toBe('Pass');
    }));

    it('should map nursingAuditFlag "*" to "N/A"', fakeAsync(() => {
      apiServiceSpy.getQcStatus.and.returnValue(of({
        ...mockQcStatusResponse,
        item: { ...mockQcStatusResponse.item, nursingAuditFlag: '*' }
      }));

      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();

      expect(component.nursingAudit()).toBe('N/A');
    }));

    it('should map nursingAuditFlag "N" to "Fail"', fakeAsync(() => {
      apiServiceSpy.getQcStatus.and.returnValue(of({
        ...mockQcStatusResponse,
        item: { ...mockQcStatusResponse.item, nursingAuditFlag: 'N' }
      }));

      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();

      expect(component.nursingAudit()).toBe('Fail');
    }));

    it('should populate table data from components response', fakeAsync(() => {
      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();

      expect(component.tableData().length).toBe(2);
      expect(component.tableData()[0].productCode).toBe('E0791');
      expect(component.tableData()[0].catalogNumber).toBe('BAG001');
      expect(component.tableData()[1].rejectReasonCode).toBe('RJ01');
      expect(component.totalRecords()).toBe(2);
    }));



    it('should set error on API failure', fakeAsync(() => {
      apiServiceSpy.getQcStatus.and.returnValue(
        throwError(() => ({ error: { message: 'Unit not found' } }))
      );

      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();

      expect(component.error()).toBe('Unit not found');
      expect(component.loading()).toBeFalse();
    }));

    it('should set loading state during retrieval', fakeAsync(() => {
      apiServiceSpy.getQcStatus.and.returnValue(of(mockQcStatusResponse).pipe(delay(100)));
      apiServiceSpy.getComponents.and.returnValue(of(mockComponentsResponse).pipe(delay(100)));

      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();

      expect(component.hasSearched()).toBeFalse();

      component.onUnitValidated({} as any);

      expect(component.loading()).toBeTrue();
      expect(component.hasSearched()).toBeTrue();

      tick(100);

      expect(component.loading()).toBeFalse();
    }));
  });

  describe('VIEW TEST Button Disabled State', () => {
    it('should have VIEW TEST button disabled initially before unit validation', () => {
      fixture.detectChanges();

      const viewTestBtn = fixture.debugElement.query(By.css('.btn-retrieve'));
      expect(viewTestBtn.nativeElement.disabled).toBeTrue();
    });




  });

  describe('View Test Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
    }));

    it('should open side panel and load tests', fakeAsync(() => {
      component.onViewTest();
      tick();

      expect(component.sidePanelOpen()).toBeTrue();
      expect(apiServiceSpy.getScheduledTests).toHaveBeenCalledWith('W1234567890');
      expect(apiServiceSpy.getUnscheduledTests).toHaveBeenCalledWith('W1234567890');
    }));

    it('should map scheduled test data to ViewTestRow format', fakeAsync(() => {
      component.onViewTest();
      tick();

      const scheduled = component.scheduledTests();
      expect(scheduled.length).toBe(1);
      expect(scheduled[0].testId).toBe('ABO');
      expect(scheduled[0].ts).toBe(1);
      expect(scheduled[0].result).toBe('PASS');
      expect(scheduled[0].tbId).toBe('TB20240115001');
      expect(scheduled[0].absorbance).toBe('0.125');
      expect(scheduled[0].ratio).toBe('1.5');
    }));

    it('should map unscheduled test data to ViewTestRow format', fakeAsync(() => {
      component.onViewTest();
      tick();

      const unscheduled = component.unscheduledTests();
      expect(unscheduled.length).toBe(1);
      expect(unscheduled[0].testId).toBe('HCV');
      expect(unscheduled[0].absorbance).toBe('0.200');
    }));

    it('should show error snackbar on test load failure', fakeAsync(() => {
      apiServiceSpy.getScheduledTests.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to load tests' } }))
      );
      apiServiceSpy.getUnscheduledTests.and.returnValue(
        throwError(() => ({ error: { message: 'No unscheduled tests' } }))
      );

      component.onViewTest();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load tests');
      expect(component.sidePanelOpen()).toBeFalse();
      expect(component.sidePanelLoading()).toBeFalse();
    }));




  });

  describe('QC Label Auto-Set (Validation #8)', () => {
    function setupWithStatus(overrides: Partial<typeof mockQcStatusResponse.item>) {
      apiServiceSpy.getQcStatus.and.returnValue(of({
        ...mockQcStatusResponse,
        item: { ...mockQcStatusResponse.item, ...overrides }
      }));
    }

    function validateAndLoad() {
      fixture.detectChanges();
      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();
    }



    it('should NOT auto-set qcForLabeling when donorInterface is No', fakeAsync(() => {
      setupWithStatus({ donorInterface: 'N', componentReview: 'N', qcLabelFlag: 'N' });
      validateAndLoad();

      component.componentReviewControl.setValue('Y');

      expect(component.qcForLabelingControl.value).toBe('N');
    }));

    it('should NOT auto-set qcForLabeling when testingFlag is N', fakeAsync(() => {
      setupWithStatus({ testingFlag: 'N', componentReview: 'N', qcLabelFlag: 'N' });
      validateAndLoad();

      component.componentReviewControl.setValue('Y');

      expect(component.qcForLabelingControl.value).toBe('N');
    }));

    it('should NOT auto-set qcForLabeling when nursingAudit is Fail', fakeAsync(() => {
      setupWithStatus({ nursingAuditFlag: 'N', componentReview: 'N', qcLabelFlag: 'N' });
      validateAndLoad();

      component.componentReviewControl.setValue('Y');

      expect(component.qcForLabelingControl.value).toBe('N');
    }));

    it('should auto-set qcForLabeling when nursingAudit is N/A (*)', fakeAsync(() => {
      setupWithStatus({ nursingAuditFlag: '*', componentReview: 'N', qcLabelFlag: 'N' });
      validateAndLoad();

      component.componentReviewControl.setValue('Y');

      expect(component.qcForLabelingControl.value).toBe('Y');
    }));

    it('should NOT auto-set when componentReview changes to N', fakeAsync(() => {
      setupWithStatus({ componentReview: 'Y', qcLabelFlag: 'N' });
      validateAndLoad();

      component.componentReviewControl.setValue('N');

      expect(component.qcForLabelingControl.value).toBe('N');
    }));

    it('should not auto-set on initial data load (emitEvent: false)', fakeAsync(() => {
      setupWithStatus({ componentReview: 'Y', qcLabelFlag: 'N' });
      validateAndLoad();

      expect(component.qcForLabelingControl.value).toBe('N');
    }));
  });

  describe('QC Label Prerequisite Guard (Validation #9)', () => {
    function setupWithStatus(overrides: Partial<typeof mockQcStatusResponse.item>) {
      apiServiceSpy.getQcStatus.and.returnValue(of({
        ...mockQcStatusResponse,
        item: { ...mockQcStatusResponse.item, ...overrides }
      }));
    }

    function validateAndLoad() {
      fixture.detectChanges();
      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();
    }

    it('should revert qcForLabeling to empty and show error when prereqs not met', fakeAsync(() => {
      setupWithStatus({ donorInterface: 'N', qcLabelFlag: 'N' });
      validateAndLoad();

      component.qcForLabelingControl.setValue('Y');

      expect(component.qcForLabelingControl.value).toBeNull();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Cannot QC label — prerequisites not met'
      );
    }));

    it('should allow setting qcForLabeling to Y when all prereqs are met', fakeAsync(() => {
      setupWithStatus({ qcLabelFlag: 'N' });
      validateAndLoad();

      component.qcForLabelingControl.setValue('Y');

      expect(component.qcForLabelingControl.value).toBe('Y');
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
    }));

    it('should allow setting qcForLabeling to N without prereq check', fakeAsync(() => {
      setupWithStatus({ donorInterface: 'N', qcLabelFlag: 'Y' });
      validateAndLoad();

      component.qcForLabelingControl.setValue('N');

      expect(component.qcForLabelingControl.value).toBe('N');
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
    }));

    it('should block Y when testingFlag is N', fakeAsync(() => {
      setupWithStatus({ testingFlag: 'N', qcLabelFlag: 'N' });
      validateAndLoad();

      component.qcForLabelingControl.setValue('Y');

      expect(component.qcForLabelingControl.value).toBeNull();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Cannot QC label — prerequisites not met'
      );
    }));

    it('should block Y when nursingAudit is Fail', fakeAsync(() => {
      setupWithStatus({ nursingAuditFlag: 'N', qcLabelFlag: 'N' });
      validateAndLoad();

      component.qcForLabelingControl.setValue('Y');

      expect(component.qcForLabelingControl.value).toBeNull();
    }));
  });

  describe('Save (Commit QC)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();
    }));

    it('should call commitQc with form values', fakeAsync(() => {
      component.componentReviewControl.setValue('Y');

      component.onSave();
      tick();

      expect(apiServiceSpy.commitQc).toHaveBeenCalledWith('W1234567890', {
        componentReview: 'Y',
        qcLabelFlag: 'Y'
      });
    }));







    it('should set saving state during commit', fakeAsync(() => {
      apiServiceSpy.commitQc.and.returnValue(of(mockCommitQcSuccess).pipe(delay(100)));

      component.onSave();

      expect(component.saving()).toBeTrue();

      tick(100);

      expect(component.saving()).toBeFalse();
    }));

    it('should not call commitQc when parsedUnitId is empty', fakeAsync(() => {
      component.onUnitCleared();
      component.onSave();
      tick();

      expect(apiServiceSpy.commitQc).not.toHaveBeenCalled();
    }));

    it('should clear form and reset state after successful save', fakeAsync(() => {
      component.componentReviewControl.setValue('Y');
      component.qcForLabelingControl.setValue('Y');

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('QC results committed successfully');
      expect(component.displayUnitId()).toBe('');
      expect(component.donorInterface()).toBe('—');
      expect(component.testingOk()).toBe('—');
      expect(component.nursingAudit()).toBe('—');
      expect(component.tableData()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
      expect(component.hasSearched()).toBeFalse();
      expect(component.componentReviewControl.value).toBeNull();
      expect(component.qcForLabelingControl.value).toBeNull();
    }));

    it('should NOT clear form after failed save', fakeAsync(() => {
      apiServiceSpy.commitQc.and.returnValue(of({
        success: false,
        statusCode: 400,
        message: 'Failed to commit',
        item: false
      }));

      component.componentReviewControl.setValue('Y');
      component.qcForLabelingControl.setValue('Y');

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to commit');
      expect(component.tableData().length).toBe(2);
      expect(component.hasSearched()).toBeTrue();
    }));

    it('should NOT clear form on API error', fakeAsync(() => {
      apiServiceSpy.commitQc.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component.componentReviewControl.setValue('Y');
      component.qcForLabelingControl.setValue('Y');

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server error');
      expect(component.tableData().length).toBe(2);
    }));
  });

  describe('SAVE Button Disabled State', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();
      fixture.detectChanges();
    }));

    it('should disable SAVE button when QC For Labeling has no value', fakeAsync(() => {
      component.qcForLabelingControl.setValue('');
      fixture.detectChanges();

      const saveBtn = fixture.debugElement.query(By.css('.btn-save'));
      expect(saveBtn.nativeElement.disabled).toBeTrue();
    }));

    it('should disable SAVE button when QC For Labeling is null', fakeAsync(() => {
      component.qcForLabelingControl.setValue(null);
      fixture.detectChanges();

      const saveBtn = fixture.debugElement.query(By.css('.btn-save'));
      expect(saveBtn.nativeElement.disabled).toBeTrue();
    }));

    it('should enable SAVE button when QC For Labeling is set to Y', fakeAsync(() => {
      component.qcForLabelingControl.setValue('Y');
      fixture.detectChanges();

      const saveBtn = fixture.debugElement.query(By.css('.btn-save'));
      expect(saveBtn.nativeElement.disabled).toBeFalse();
    }));

    it('should enable SAVE button when QC For Labeling is set to N', fakeAsync(() => {
      component.qcForLabelingControl.setValue('N');
      fixture.detectChanges();

      const saveBtn = fixture.debugElement.query(By.css('.btn-save'));
      expect(saveBtn.nativeElement.disabled).toBeFalse();
    }));

    it('should disable SAVE button while saving is in progress', fakeAsync(() => {
      apiServiceSpy.commitQc.and.returnValue(of(mockCommitQcSuccess).pipe(delay(100)));
      component.qcForLabelingControl.setValue('Y');
      fixture.detectChanges();

      component.onSave();
      fixture.detectChanges();

      const saveBtn = fixture.debugElement.query(By.css('.btn-save'));
      expect(saveBtn.nativeElement.disabled).toBeTrue();

      tick(100);
    }));
  });

  describe('Unit Cleared / Reset', () => {
    it('should reset all state when unit is cleared', fakeAsync(() => {
      fixture.detectChanges();
      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();

      // Verify data is loaded
      expect(component.tableData().length).toBe(2);
      expect(component.donorInterface()).toBe('Yes');

      // Clear unit
      component.onUnitCleared();

      expect(component.displayUnitId()).toBe('');
      expect(component.donorInterface()).toBe('—');
      expect(component.testingOk()).toBe('—');
      expect(component.nursingAudit()).toBe('—');
      expect(component.tableData()).toEqual([]);
      expect(component.totalRecords()).toBe(0);
      expect(component.error()).toBeNull();
      expect(component.hasSearched()).toBeFalse();
      expect(component.componentReviewControl.value).toBeNull();
    }));
  });
  describe('Retry', () => {
    it('should re-trigger data retrieval on retry', fakeAsync(() => {
      fixture.detectChanges();
      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();

      component.onRetry();
      tick();

      expect(apiServiceSpy.getQcStatus).toHaveBeenCalledWith('W1234567890');
      expect(apiServiceSpy.getComponents).toHaveBeenCalledWith('W1234567890');
    }));
  });
  describe('Error State', () => {
    it('should display error message when error is set', () => {
      fixture.detectChanges();
      component.error.set('Something went wrong');
      component.loading.set(false);
      component.hasSearched.set(true);
      fixture.detectChanges();

      const errorContainer = fixture.debugElement.query(By.css('.error-container'));
      expect(errorContainer).toBeTruthy();
      expect(errorContainer.nativeElement.textContent).toContain('Something went wrong');
    });
  });

  describe('Empty State', () => {


    it('should show "no data found" when search returns empty', fakeAsync(() => {
      apiServiceSpy.getComponents.and.returnValue(of({
        success: true,
        statusCode: 200,
        message: 'No components',
        data: [],
        total: 0
      }));
      fixture.detectChanges();

      const event: any = {
        data: { manualUnitId: 'W1234567890', codeScheme: 'I', parsedUnitId: 'W1234567890' },
        confirm: jasmine.createSpy('confirm'),
        reject: jasmine.createSpy('reject')
      };
      component.onUnitPostValidate(event);
      tick();
      component.onUnitValidated({} as any);
      tick();
      fixture.detectChanges();

      expect(component.hasSearched()).toBeTrue();
      expect(component.tableData().length).toBe(0);
    }));
  });

  describe('Accessibility', () => {


    it('should generate unique component IDs for multiple instances', () => {
      const fixture2 = TestBed.createComponent(UnitLevelQcForLabelingComponent);
      const component2 = fixture2.componentInstance as any;

      expect(component.componentId).not.toBe(component2.componentId);
    });
  });
});
