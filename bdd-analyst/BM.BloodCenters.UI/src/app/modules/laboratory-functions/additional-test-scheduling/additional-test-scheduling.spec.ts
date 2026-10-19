import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';

import { AdditionalTestSchedulingComponent } from './additional-test-scheduling';
import { AdditionalTestSchedulingApiService } from './services/additional-test-scheduling-api.service';
import { HeaderService } from '@shared/services/header.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { TestLookupDialogComponent } from './components/test-lookup-dialog/test-lookup-dialog';
import {
  ValidTestDto,
  ValidateUnitResponseDto,
  ExistingTestDto,
  ScannedUnit,
  ScheduleTestResponseDto
} from './models/additional-test-scheduling.model';
import { UnitIdPostValidateEvent } from '@shared/components/unit-id-field/unit-id-field.component';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('AdditionalTestSchedulingComponent', () => {
  let component: AdditionalTestSchedulingComponent;
  let fixture: ComponentFixture<AdditionalTestSchedulingComponent>;
  let apiServiceSpy: jasmine.SpyObj<AdditionalTestSchedulingApiService>;
  let headerServiceMock: { getCurrentChapterId: jasmine.Spy; chapterChanged$: Subject<void> };
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: any;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockTests: ValidTestDto[] = [
    {
      testId: 'COVID01',
      testDesc: 'COVID-19 Antibody Test',
      testGroup: 'TSTGRP1',
      testGroupDesc: 'Test Group 1',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      isActive: true
    },
    {
      testId: 'HCV001',
      testDesc: 'Hepatitis C Virus Test',
      testGroup: 'TSTGRP1',
      testGroupDesc: 'Test Group 1',
      effDate: '2024-01-01T00:00:00Z',
      termDate: null,
      isActive: true
    }
  ];

  const mockValidateUnitResponse: ValidateUnitResponseDto = {
    unitId: 'W633319111560',
    catalogNumber: null,
    collectionDate: '2024-01-15T00:00:00Z',
    chapterId: 'TEST',
    isValid: true,
    errorMessage: null,
    collDate: '2024-01-15T00:00:00Z',
    hasComponents: false,
    componentCount: 0
  };

  const mockExistingTests: ExistingTestDto[] = [
    {
      testId: 'COVID01',
      testSeqNo: 1,
      status: 'Scheduled',
      result: null,
      testBatchId: null
    }
  ];

  /**
   * Helper to simulate the UnitIdFieldComponent's postValidate event.
   * The component's onPostValidate receives an event with data, confirm, and reject callbacks.
   */
  function simulatePostValidate(unitId: string): { confirmSpy: jasmine.Spy; rejectSpy: jasmine.Spy } {
    const confirmSpy = jasmine.createSpy('confirm');
    const rejectSpy = jasmine.createSpy('reject');
    const event: UnitIdPostValidateEvent = {
      data: { parsedUnitId: unitId } as any,
      confirm: confirmSpy,
      reject: rejectSpy
    };
    component.onPostValidate(event);
    return { confirmSpy, rejectSpy };
  }

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('AdditionalTestSchedulingApiService', [
      'validateUnit',
      'getExistingTests',
      'scheduleTest',
      'getSccStatus'
    ]);
    headerServiceMock = {
      getCurrentChapterId: jasmine.createSpy('getCurrentChapterId').and.returnValue('TEST'),
      getCurrentChapterTimezone: jasmine.createSpy('getCurrentChapterTimezone').and.returnValue('America/New_York'),
      chapterChanged$: new Subject<void>()
    };
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = {
      pageHeaderData: () => undefined,
      getTitle: () => undefined,
      getSubtitle: () => undefined
    };
    dialogSpy = createMockMatDialog();

    apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));
    apiServiceSpy.getExistingTests.and.returnValue(of(mockExistingTests));
    apiServiceSpy.scheduleTest.and.returnValue(of({ scheduled: true, message: null } as ScheduleTestResponseDto));
    apiServiceSpy.getSccStatus.and.returnValue(of({ sccRecords: [] }));



      TestBed.configureTestingModule({
      imports: [AdditionalTestSchedulingComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdditionalTestSchedulingApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })
    .overrideComponent(AdditionalTestSchedulingComponent, {
      add: { providers: [{ provide: MatDialog, useValue: dialogSpy }] }
    });


    


      apiServiceSpy.validateUnit.calls.reset();


      apiServiceSpy.getExistingTests.calls.reset();


      apiServiceSpy.scheduleTest.calls.reset();


      apiServiceSpy.getSccStatus.calls.reset();


      dialogSpy.open.calls.reset();


      apiServiceSpy.validateUnit.and.returnValue(of(mockValidateUnitResponse));


      apiServiceSpy.getExistingTests.and.returnValue(of(mockExistingTests));


      apiServiceSpy.scheduleTest.and.returnValue(of({ scheduled: true, message: null } as ScheduleTestResponseDto));


      apiServiceSpy.getSccStatus.and.returnValue(of({ sccRecords: [] }));


    fixture = TestBed.createComponent(AdditionalTestSchedulingComponent);
    component = fixture.componentInstance;


    });

  describe('Initialization', () => {




    it('should start with empty selected tests', () => {
      fixture.detectChanges();
      expect((component as any).selectedTests().length).toBe(0);
    });
  });

  describe('Test Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should not update selected tests when dialog is cancelled', fakeAsync(() => {
      const dialogRefSpyObj = jasmine.createSpyObj('dialogRef', { afterClosed: of(null) });
      dialogSpy.open.and.returnValue(dialogRefSpyObj);

      (component as any).selectedTests.set(mockTests);
      component.onLookupTests();
      tick();

      expect((component as any).selectedTests().length).toBe(2);
    }));



    it('should clear all tests on CLEAR ALL button click', () => {
      (component as any).selectedTests.set(mockTests);

      component.onClearAllTests();

      expect((component as any).selectedTests().length).toBe(0);
    });

    it('should show selected tests as chips', () => {
      (component as any).selectedTests.set(mockTests);
      fixture.detectChanges();

      const chips = fixture.debugElement.queryAll(By.css('mat-chip-row'));
      expect(chips.length).toBe(2);
    });
  });

  describe('Unit Scanning (via onPostValidate)', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
    });

    it('should reject when no tests selected', () => {
      (component as any).selectedTests.set([]);
      const { rejectSpy } = simulatePostValidate('W633319111560');

      expect(rejectSpy).toHaveBeenCalledWith('Please select tests before scanning units');
    });

    it('should reject when unitId is empty/invalid', () => {
      const confirmSpy = jasmine.createSpy('confirm');
      const rejectSpy = jasmine.createSpy('reject');
      const event: UnitIdPostValidateEvent = {
        data: { parsedUnitId: '' } as any,
        confirm: confirmSpy,
        reject: rejectSpy
      };
      component.onPostValidate(event);

      expect(rejectSpy).toHaveBeenCalledWith('Invalid unit ID');
    });

    it('should call API to validate unit on post-validate', fakeAsync(() => {
      simulatePostValidate('W633319111560');
      tick();

      expect(apiServiceSpy.validateUnit).toHaveBeenCalledWith('W633319111560');
    }));



    it('should auto-select newly scanned unit', fakeAsync(() => {
      simulatePostValidate('W633319111560');
      tick();

      expect((component as any).selectedUnitId()).toBe('W633319111560');
    }));



    it('should confirm and select existing unit when already scanned', fakeAsync(() => {
      // First scan
      simulatePostValidate('W633319111560');
      tick();

      // Scan same unit again
      const { confirmSpy } = simulatePostValidate('W633319111560');

      expect(confirmSpy).toHaveBeenCalled();
      expect((component as any).selectedUnitId()).toBe('W633319111560');
    }));

    it('should reject with error message on validation failure', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(
        throwError(() => ({ message: 'Unit not found' }))
      );

      const { rejectSpy } = simulatePostValidate('INVALID');
      tick();

      expect(rejectSpy).toHaveBeenCalledWith('Unit not found');
    }));
  });

  describe('Unit Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
      simulatePostValidate('W633319111560');
      tick();
    }));

    it('should select unit and load its tests', fakeAsync(() => {
      component.onSelectUnit('W633319111560');
      tick();

      expect((component as any).selectedUnitId()).toBe('W633319111560');
      expect(apiServiceSpy.getExistingTests).toHaveBeenCalledWith(
        'W633319111560',
        'TEST',
        ['COVID01', 'HCV001']
      );
    }));



    it('should merge selected tests with existing/scheduled tests', fakeAsync(() => {
      component.onSelectUnit('W633319111560');
      tick();

      const unitTests = (component as any).selectedUnitTests();
      expect(unitTests.length).toBe(2); // 2 selected tests
      expect(unitTests[0].status).toBe('Scheduled'); // COVID01 is in mockExistingTests as Scheduled
      expect(unitTests[1].status).toBe('Unscheduled'); // HCV001 is not in existing tests
    }));




  });

  describe('Test Scheduling', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
      simulatePostValidate('W633319111560');
      tick();
      component.onSelectUnit('W633319111560');
      tick();
    }));

    it('should toggle test selection for scheduling', () => {
      component.onTestToggle('HCV001', false);
      expect(component.isTestSelectedForScheduling('HCV001')).toBeTrue();

      component.onTestToggle('HCV001', false);
      expect(component.isTestSelectedForScheduling('HCV001')).toBeFalse();
    });

    it('should not select already scheduled tests', () => {
      component.onTestToggle('COVID01', true); // Already scheduled
      expect(component.isTestSelectedForScheduling('COVID01')).toBeFalse();
    });

    it('should indicate schedule capability when unscheduled tests are selected', () => {
      (component as any).selectedTestsForScheduling.set(new Set(['HCV001']));
      expect((component as any).canScheduleTests()).toBeTrue();
    });

    it('should not indicate schedule capability when no tests selected', () => {
      (component as any).selectedTestsForScheduling.set(new Set());
      expect((component as any).canScheduleTests()).toBeFalse();
    });



    it('should call scheduleTest for each selected test after confirmation', fakeAsync(() => {
      const dialogRefSpyObj = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpyObj);

      (component as any).selectedTestsForScheduling.set(new Set(['HCV001']));
      component.onScheduleTests();
      tick();

      expect(apiServiceSpy.scheduleTest).toHaveBeenCalledWith(
        'W633319111560',
        'TEST',
        'HCV001'
      );
    }));

    it('should not schedule when canScheduleTests is false', () => {
      (component as any).selectedTestsForScheduling.set(new Set());
      component.onScheduleTests();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should not schedule when dialog is cancelled', fakeAsync(() => {
      const dialogRefSpyObj = jasmine.createSpyObj('dialogRef', { afterClosed: of(false) });
      dialogSpy.open.and.returnValue(dialogRefSpyObj);

      (component as any).selectedTestsForScheduling.set(new Set(['HCV001']));
      component.onScheduleTests();
      tick();

      expect(apiServiceSpy.scheduleTest).not.toHaveBeenCalled();
    }));

    it('should show error for partially failed schedule requests', fakeAsync(() => {
      const dialogRefSpyObj = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpyObj);
      apiServiceSpy.scheduleTest.and.returnValue(of({ scheduled: false, message: 'Failed' } as ScheduleTestResponseDto));

      (component as any).selectedTestsForScheduling.set(new Set(['HCV001']));
      component.onScheduleTests();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should report failed test IDs when individual schedule fails', fakeAsync(() => {
      const dialogRefSpyObj = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpyObj);
      apiServiceSpy.scheduleTest.and.returnValue(of({ scheduled: false, message: 'Failed to schedule HCV001' } as ScheduleTestResponseDto));

      (component as any).selectedTestsForScheduling.set(new Set(['HCV001']));
      component.onScheduleTests();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to schedule: HCV001');
      expect((component as any).schedulingTests()).toBeFalse();
    }));

    it('should clear selection and reload tests after successful scheduling', fakeAsync(() => {
      const dialogRefSpyObj = jasmine.createSpyObj('dialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpyObj);

      (component as any).selectedTestsForScheduling.set(new Set(['HCV001']));
      component.onScheduleTests();
      tick();

      expect((component as any).selectedTestsForScheduling().size).toBe(0);
      expect(apiServiceSpy.getExistingTests).toHaveBeenCalled();
    }));
  });

  describe('Load Unit Tests Edge Cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
      simulatePostValidate('W633319111560');
      tick();
    }));

    it('should handle getExistingTests API error gracefully', fakeAsync(() => {
      apiServiceSpy.getExistingTests.and.returnValue(throwError(() => new Error('API error')));
      component.onSelectUnit('W633319111560');
      tick();
      const unitTests = (component as any).selectedUnitTests();
      expect(unitTests.length).toBe(2);
      expect(unitTests.every((t) => t.status === 'Unscheduled')).toBeTrue();
      expect((component as any).loadingTests()).toBeFalse();
    }));

    it('should set empty unit tests when no tests selected', fakeAsync(() => {
      (component as any).selectedTests.set([]);
      component.onSelectUnit('W633319111560');
      tick();
      expect((component as any).selectedUnitTests().length).toBe(0);
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
      simulatePostValidate('W633319111560');
      tick();
      component.onSelectUnit('W633319111560');
      tick();
    }));



    it('should show all tests when search is empty', () => {
      (component as any).searchKeyword.set('');

      const filtered = (component as any).filteredTests();
      expect(filtered.length).toBe(2);
    });

    it('should filter tests by test ID keyword', () => {
      (component as any).onTestSearch('COVID');
      const filtered = (component as any).filteredTests();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('COVID01');
    });

    it('should filter tests by result keyword', () => {
      (component as any).searchKeyword.set('nr');
      const filtered = (component as any).filteredTests();
      expect(filtered.every((t: any) => !t.isScheduled || (t.result || 'NR').toLowerCase().includes('nr'))).toBeTrue();
    });

    it('should filter tests by test description keyword', () => {
      (component as any).searchKeyword.set('hepatitis');
      const filtered = (component as any).filteredTests();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('HCV001');
    });
  });

  describe('Status Sort', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
      simulatePostValidate('W633319111560');
      tick();
      component.onSelectUnit('W633319111560');
      tick();
    }));

    it('should cycle sort direction: null -> ASC -> DESC -> null', () => {
      expect((component as any).statusSortDirection()).toBeNull();

      (component as any).onSortByStatus();
      expect((component as any).statusSortDirection()).toBe('ASC');

      (component as any).onSortByStatus();
      expect((component as any).statusSortDirection()).toBe('DESC');

      (component as any).onSortByStatus();
      expect((component as any).statusSortDirection()).toBeNull();
    });

    it('should sort filtered tests by status ASC', () => {
      (component as any).statusSortDirection.set('ASC');
      const filtered = (component as any).filteredTests();
      if (filtered.length >= 2) {
        expect(filtered[0].status.localeCompare(filtered[1].status)).toBeLessThanOrEqual(0);
      }
    });

    it('should sort filtered tests by status DESC', () => {
      (component as any).statusSortDirection.set('DESC');
      const filtered = (component as any).filteredTests();
      if (filtered.length >= 2) {
        expect(filtered[0].status.localeCompare(filtered[1].status)).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Date Formatting', () => {
    it('should format date string as DD-MMM-YYYY', () => {
      const formatted = component.formatDate('2024-01-15T00:00:00Z');
      expect(formatted).toMatch(/\d{2}-[A-Z]{3}-\d{4}/);
    });

    it('should return N/A for null date', () => {
      expect(component.formatDate(null)).toBe('N/A');
    });

    it('should return N/A for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('N/A');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should track error state via signal', () => {
      (component as any).error.set('Test error');
      expect((component as any).error()).toBe('Test error');

      (component as any).error.set(null);
      expect((component as any).error()).toBeNull();
    });
  });

  describe('Chapter Change', () => {
    it('should reset all state on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
      (component as any).scannedUnits.set([{
        unitId: 'W633319111560',
        chapterId: 'TEST',
        collectionDate: '2024-01-15T00:00:00Z',
        isValid: true,
        scannedAt: new Date()
      } as ScannedUnit]);

      headerServiceMock.chapterChanged$.next();
      tick();

      expect((component as any).selectedTests().length).toBe(0);
      expect((component as any).scannedUnits().length).toBe(0);
      expect((component as any).selectedUnitId()).toBeNull();
    }));
  });

  describe('Test Removal', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set([...mockTests]);
    });

    it('should remove a single test by ID', () => {
      component.removeTest('COVID01');
      const remaining = (component as any).selectedTests();
      expect(remaining.length).toBe(1);
      expect(remaining[0].testId).toBe('HCV001');
    });

    it('should keep other tests when removing one', () => {
      component.removeTest('HCV001');
      expect((component as any).selectedTests().length).toBe(1);
      expect((component as any).selectedTests()[0].testId).toBe('COVID01');
    });
  });

  describe('Toggle All Unscheduled', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
      simulatePostValidate('W633319111560');
      tick();
      component.onSelectUnit('W633319111560');
      tick();
    }));

    it('should select all unscheduled tests when checked=true', () => {
      component.onToggleAllUnscheduled(true);
      const unscheduled = (component as any).unscheduledTests();
      unscheduled.forEach((t: any) => {
        expect(component.isTestSelectedForScheduling(t.testId)).toBeTrue();
      });
    });

    it('should deselect all unscheduled tests when checked=false', () => {
      component.onToggleAllUnscheduled(true);
      component.onToggleAllUnscheduled(false);
      const unscheduled = (component as any).unscheduledTests();
      unscheduled.forEach((t: any) => {
        expect(component.isTestSelectedForScheduling(t.testId)).toBeFalse();
      });
    });

    it('should compute isAllUnscheduledSelected correctly', () => {
      expect((component as any).isAllUnscheduledSelected()).toBeFalse();
      component.onToggleAllUnscheduled(true);
      expect((component as any).isAllUnscheduledSelected()).toBeTrue();
    });

    it('should compute isSomeUnscheduledSelected correctly', () => {
      expect((component as any).isSomeUnscheduledSelected()).toBeFalse();
    });
  });

  describe('Scanned Units Table Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
      simulatePostValidate('W633319111560');
      tick();
    }));

    it('should handle row click on scanned unit', () => {
      const unit = (component as any).scannedUnits()[0];
      (component as any).onScannedUnitRowClick(unit);
      expect((component as any).selectedUnitId()).toBe('W633319111560');
    });

    it('should handle delete row action', () => {
      const unit = (component as any).scannedUnits()[0];
      (component as any).onScannedUnitRowAction({ action: 'delete', row: unit });
      expect((component as any).scannedUnits().length).toBe(0);
    });

    it('should clear selected unit when deleting the selected unit', fakeAsync(() => {
      component.onSelectUnit('W633319111560');
      tick();

      component.onRemoveUnit('W633319111560');
      expect((component as any).selectedUnitId()).toBeNull();
      expect((component as any).selectedUnitTests().length).toBe(0);
      expect((component as any).selectedTestsForScheduling().size).toBe(0);
    }));

    it('should not clear selected unit when deleting a different unit', fakeAsync(() => {
      apiServiceSpy.validateUnit.and.returnValue(of({
        ...mockValidateUnitResponse,
        unitId: 'W633319222222'
      }));
      simulatePostValidate('W633319222222');
      tick();

      component.onSelectUnit('W633319111560');
      tick();

      component.onRemoveUnit('W633319222222');
      expect((component as any).selectedUnitId()).toBe('W633319111560');
      expect((component as any).scannedUnits().length).toBe(1);
    }));

    it('should update search keyword via onTestSearch', () => {
      (component as any).onTestSearch('COVID');
      expect((component as any).searchKeyword()).toBe('COVID');
    });

    it('should clear error on onUnitIdCleared', () => {
      (component as any).error.set('some error');
      component.onUnitIdCleared();
      expect((component as any).error()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
      (component as any).selectedTests.set(mockTests);
    });

    it('should display error message', () => {
      (component as any).error.set('Test error message');
      expect((component as any).error()).toBe('Test error message');
    });

    it('should clear error on successful unit scan', fakeAsync(() => {
      (component as any).error.set('Previous error');
      simulatePostValidate('W633319111560');
      tick();

      expect((component as any).error()).toBeNull();
    }));
  });
});
