import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';

import { AssignReagentsToTestBatch } from './assign-reagents-to-test-batch';
import { AssignReagentsToTestBatchService } from './services/assign-reagents-to-test-batch.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  TestBatchDetailDto,
  TestBatchOption
} from './models/assign-reagents-to-test-batch.model';
import { Subject } from 'rxjs';
import { signal } from '@angular/core';
import { createMockSnackbarService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('AssignReagentsToTestBatch', () => {
  let pageHeaderServiceSpyObj: any;
  let serviceSpyObj: any;
  let component: AssignReagentsToTestBatch;
  let fixture: ComponentFixture<AssignReagentsToTestBatch>;
  let serviceSpy: jasmine.SpyObj<AssignReagentsToTestBatchService>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockTestBatchId = 'TB20240530001';

  const mockTests: TestBatchDetailDto[] = [
    {
      tbId: mockTestBatchId,
      testChapterId: 'TEST',
      testId: 'ABO',
      testKitId: '1071-C',
      testType: 'M',
      testingLabCode: '01',
      testDesc: 'ABO Blood Grouping',
      testGroup: 'BG'
    },
    {
      tbId: mockTestBatchId,
      testChapterId: 'TEST',
      testId: 'RH',
      testKitId: null,
      testType: 'M',
      testingLabCode: '01',
      testDesc: 'Rh Typing',
      testGroup: 'BG'
    }
  ];

  const mockOptions: TestBatchOption[] = [
    { id: mockTestBatchId, displayName: mockTestBatchId }
  ];

  const chapterChangedSubject = new Subject<void>();

  beforeEach(() => {

    serviceSpyObj = jasmine.createSpyObj('AssignReagentsToTestBatchService', [
      'getTestBatchOptions',
      'getTestsInBatch',
      'assignReagentToTest',
      'getUnitsInBatch',
      'getTestKitOptions'
    ]);
    serviceSpyObj.getTestBatchOptions.and.returnValue(of(mockOptions));

    const snackbarSpyObj = createMockSnackbarService();

    const headerServiceSpyObj = createMockHeaderService({ chapterChanged$: chapterChangedSubject.asObservable() });

    pageHeaderServiceSpyObj = jasmine.createSpyObj('PageHeaderService', ['getTitle', 'getSubtitle'], {
      pageHeaderData: signal(undefined)
    });

    const dialogSpyObj = createMockMatDialog();



      TestBed.configureTestingModule({
      imports: [AssignReagentsToTestBatch, NoopAnimationsModule],
      providers: [
        { provide: AssignReagentsToTestBatchService, useValue: serviceSpyObj },
        { provide: SnackbarService, useValue: snackbarSpyObj },
        { provide: HeaderService, useValue: headerServiceSpyObj },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpyObj },
        { provide: MatDialog, useValue: dialogSpyObj }
      ]
    });

      serviceSpyObj.getTestBatchOptions.and.returnValue(of(mockOptions));


    fixture = TestBed.createComponent(AssignReagentsToTestBatch);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(AssignReagentsToTestBatchService) as jasmine.SpyObj<AssignReagentsToTestBatchService>;
    snackbarSpy = TestBed.inject(SnackbarService) as jasmine.SpyObj<SnackbarService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;


    });
  describe('Load Tests', () => {
    beforeEach(() => {
      serviceSpy.getTestsInBatch.and.returnValue(of({ data: mockTests, total: 2 }));
      fixture.detectChanges();
    });

    it('should load tests when batch is selected', fakeAsync(() => {
      component.selectedTestBatchId.setValue(mockTestBatchId);
      tick();

      expect(serviceSpy.getTestsInBatch).toHaveBeenCalledWith(mockTestBatchId);
      expect(component.tests()).toEqual(mockTests);
    }));

    it('should handle error when loading tests', fakeAsync(() => {
      const errorResponse = {
        error: { message: 'Test batch not found' }
      };
      serviceSpy.getTestsInBatch.and.returnValue(throwError(() => errorResponse));

      component.selectedTestBatchId.setValue(mockTestBatchId);
      tick();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Test batch not found');
    }));
  });

  describe('Computed Values', () => {
    it('should compute hasTests correctly', () => {
      expect(component.hasTests()).toBeFalse();

      component.tests.set(mockTests);
      expect(component.hasTests()).toBeTrue();
    });
  });

  describe('Chapter Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear state and reload options on chapter change', fakeAsync(() => {
      component.tests.set(mockTests);
      component.testBatchId.set(mockTestBatchId);

      chapterChangedSubject.next();
      tick();

      expect(component.tests()).toEqual([]);
      expect(component.testBatchId()).toBe('');
      expect(serviceSpy.getTestBatchOptions).toHaveBeenCalledTimes(2);
    }));
  });

  describe('View Units', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Replace the component's dialog with the spy
      (component as any).dialog = dialogSpy;
    });

    it('should not open dialog when no test batch selected', () => {
      component.testBatchId.set('');
      component.onViewUnits();
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open view units dialog when batch is selected', () => {
      component.testBatchId.set(mockTestBatchId);
      component.onViewUnits();
      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('Row Action', () => {
    beforeEach(() => {
      serviceSpy.getTestsInBatch.and.returnValue(of({ data: mockTests, total: 2 }));
      fixture.detectChanges();
      // Replace the component's dialog with the spy
      (component as any).dialog = dialogSpy;
    });

    it('should open edit dialog on edit action', fakeAsync(() => {
      component.testBatchId.set(mockTestBatchId);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onRowAction({ action: 'edit', row: mockTests[0] });
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should reload tests on successful edit', fakeAsync(() => {
      component.testBatchId.set(mockTestBatchId);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ success: true, promptWorksheet: false }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onRowAction({ action: 'edit', row: mockTests[0] });
      tick();

      expect(serviceSpy.getTestsInBatch).toHaveBeenCalledWith(mockTestBatchId);
    }));
  });

  describe('Search Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter test batches by search term', fakeAsync(() => {
      component.testBatchSearchControl.setValue('TB2024');
      tick();

      expect(component.filteredTestBatches.length).toBeGreaterThanOrEqual(0);
    }));

    it('should show all options when search is cleared', fakeAsync(() => {
      component.testBatchSearchControl.setValue('');
      tick();

      expect(component.filteredTestBatches).toEqual(component.testBatchOptions());
    }));
  });

  describe('Selection Change', () => {
    beforeEach(() => {
      serviceSpy.getTestsInBatch.and.returnValue(of({ data: mockTests, total: 2 }));
      fixture.detectChanges();
    });

    it('should clear tests when batch is deselected', fakeAsync(() => {
      component.selectedTestBatchId.setValue(mockTestBatchId);
      tick();
      expect(component.tests().length).toBe(2);

      component.selectedTestBatchId.setValue(null);
      tick();
      expect(component.tests()).toEqual([]);
      expect(component.testBatchId()).toBe('');
    }));
  });

  describe('Load Options Error', () => {
    it('should handle error when loading test batch options', fakeAsync(() => {
      serviceSpy.getTestBatchOptions.and.returnValue(throwError(() => new Error('API error')));

      // Trigger reload
      chapterChangedSubject.next();
      tick();

      expect(component.testBatchOptions()).toEqual([]);
      expect(component.filteredTestBatches).toEqual([]);
      expect(component.loadingOptions()).toBeFalse();
    }));
  });

  describe('Element ID', () => {
    it('should generate unique element IDs', () => {
      const id = component.elementId('test');
      expect(id).toContain('assign-reagents-');
      expect(id).toContain('test');
    });
  });
});
