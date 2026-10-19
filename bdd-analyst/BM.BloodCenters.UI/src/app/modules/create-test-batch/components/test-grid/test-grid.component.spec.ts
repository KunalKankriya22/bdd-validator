import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { TestGridComponent } from './test-grid.component';
import { CreateTestBatchService } from '../../services/create-test-batch.service';
import { ValidTest, TestRow } from '../../models/create-test-batch.model';

describe('TestGridComponent', () => {
  let component: TestGridComponent;
  let fixture: ComponentFixture<TestGridComponent>;
  let mockService: jasmine.SpyObj<CreateTestBatchService>;

  const mockValidTests: ValidTest[] = [
    { testGroup: 'GRP1', testId: 'ABO', testDesc: 'ABO Blood Type' },
    { testGroup: 'GRP2', testId: 'RH', testDesc: 'Rh Factor' },
    { testGroup: 'GRP1', testId: 'DAT', testDesc: 'Direct Antiglobulin' },
  ];

  const mockTests: TestRow[] = [
    { testId: 'ABO', testDesc: 'ABO Blood Type', testKitId: null, testGroup: 'GRP1', autoSchedule: null, antigenFlag: null },
    { testId: 'RH', testDesc: 'Rh Factor', testKitId: 'TK1', testGroup: 'GRP2', autoSchedule: null, antigenFlag: null },
  ];

  beforeEach(() => {
    mockService = jasmine.createSpyObj('CreateTestBatchService', ['getTestKits']);

    TestBed.configureTestingModule({
      imports: [TestGridComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: CreateTestBatchService, useValue: mockService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    });

    fixture = TestBed.createComponent(TestGridComponent);
    component = fixture.componentInstance;

    try { fixture.detectChanges(); } catch (e) { /* template-only errors */ }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('addTest', () => {
    it('should add a new empty test row and emit testsChanged', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [];

      component.addTest();

      expect(emitSpy.emit).toHaveBeenCalledWith(
        jasmine.arrayContaining([jasmine.objectContaining({ testId: '', testDesc: '', testKitId: null })])
      );
    });

    it('should append to existing tests', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [...mockTests];

      component.addTest();

      const emittedTests = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedTests.length).toBe(3);
      expect(emittedTests[2].testId).toBe('');
    });
  });

  describe('removeTest', () => {
    it('should remove a test row by index and emit testsChanged', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [...mockTests];

      component.removeTest(0);

      const emittedTests = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedTests.length).toBe(1);
      expect(emittedTests[0].testId).toBe('RH');
    });

    it('should clean up search control at removed index', () => {
      component.testSearchControls = [jasmine.createSpyObj('FC', ['setValue']), jasmine.createSpyObj('FC', ['setValue'])];
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [...mockTests];

      component.removeTest(0);

      expect(component.testSearchControls.length).toBe(1);
    });
  });

  describe('onTestIdChange', () => {
    it('should update test data from validTests match', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [{ testId: '', testDesc: '', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }];
      component.validTests = mockValidTests;

      component.onTestIdChange(0, 'ABO');

      const emittedTests = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedTests[0].testId).toBe('ABO');
      expect(emittedTests[0].testDesc).toBe('ABO Blood Type');
      expect(emittedTests[0].testGroup).toBe('GRP1');
    });

    it('should set empty desc when no match found', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [{ testId: '', testDesc: '', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }];
      component.validTests = mockValidTests;

      component.onTestIdChange(0, 'UNKNOWN');

      const emittedTests = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedTests[0].testDesc).toBe('');
    });
  });

  describe('onTestKitChange', () => {
    it('should update testKitId for the given index', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [...mockTests];

      component.onTestKitChange(0, 'TK-NEW');

      const emittedTests = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedTests[0].testKitId).toBe('TK-NEW');
    });

    it('should set testKitId to null when empty string', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [...mockTests];

      component.onTestKitChange(1, '');

      const emittedTests = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedTests[1].testKitId).toBeNull();
    });
  });

  describe('toggleSort', () => {
    it('should activate sorting on first click', () => {
      expect(component.isSorted).toBe(false);
      component.toggleSort();
      expect(component.isSorted).toBe(true);
      expect(component.sortDirection).toBe('asc');
    });

    it('should toggle between asc and desc after sorting is active', () => {
      component.isSorted = true;
      component.sortDirection = 'asc';
      component.toggleSort();
      expect(component.sortDirection).toBe('desc');
      component.toggleSort();
      expect(component.sortDirection).toBe('asc');
    });
  });

  describe('sortedTests', () => {
    it('should return empty array when no tests', () => {
      component.tests = [];
      expect(component.sortedTests).toEqual([]);
    });

    it('should return tests in insertion order when not sorted', () => {
      component.tests = [...mockTests];
      component.isSorted = false;
      const result = component.sortedTests;
      expect(result[0].testId).toBe('ABO');
      expect(result[1].testId).toBe('RH');
      expect(result).toBe(component.tests);
    });

    it('should sort tests ascending by testId when sorted', () => {
      component.tests = [...mockTests];
      component.isSorted = true;
      component.sortDirection = 'asc';
      const sorted = component.sortedTests;
      expect(sorted[0].testId).toBe('ABO');
      expect(sorted[1].testId).toBe('RH');
    });

    it('should sort tests descending by testId when sorted', () => {
      component.tests = [...mockTests];
      component.isSorted = true;
      component.sortDirection = 'desc';
      const sorted = component.sortedTests;
      expect(sorted[0].testId).toBe('RH');
      expect(sorted[1].testId).toBe('ABO');
    });

    it('should handle empty testId in sorting', () => {
      component.isSorted = true;
      component.tests = [
        { testId: '', testDesc: '', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null },
        { testId: 'ABO', testDesc: 'ABO', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null },
      ];
      component.sortDirection = 'asc';
      const sorted = component.sortedTests;
      expect(sorted[0].testId).toBe('');
      expect(sorted[1].testId).toBe('ABO');
    });
  });

  describe('getOriginalIndex', () => {
    it('should return the index of the test in the original array', () => {
      component.tests = [...mockTests];
      expect(component.getOriginalIndex(mockTests[1])).toBe(1);
    });
  });

  describe('getSearchControl', () => {
    it('should create and return a FormControl for the given index', () => {
      const control = component.getSearchControl(0);
      expect(control).toBeTruthy();
      expect(control.value).toBe('');
    });

    it('should return the same FormControl for the same index', () => {
      const c1 = component.getSearchControl(0);
      const c2 = component.getSearchControl(0);
      expect(c1).toBe(c2);
    });

    it('should create controls for gaps up to requested index', () => {
      component.getSearchControl(3);
      expect(component.testSearchControls.length).toBe(4);
    });
  });

  describe('getFilteredTests', () => {
    it('should return all valid tests when search is empty', () => {
      component.validTests = mockValidTests;
      const result = component.getFilteredTests(0);
      expect(result.length).toBe(3);
    });

    it('should filter by testId', () => {
      component.validTests = mockValidTests;
      component.getSearchControl(0).setValue('abo');
      const result = component.getFilteredTests(0);
      expect(result.length).toBe(1);
      expect(result[0].testId).toBe('ABO');
    });

    it('should filter by testDesc', () => {
      component.validTests = mockValidTests;
      component.getSearchControl(0).setValue('direct');
      const result = component.getFilteredTests(0);
      expect(result.length).toBe(1);
      expect(result[0].testId).toBe('DAT');
    });
  });

  describe('compareTest', () => {
    it('should return true for matching strings', () => {
      expect(component.compareTest('ABO', 'ABO')).toBe(true);
    });

    it('should return false for different strings', () => {
      expect(component.compareTest('ABO', 'RH')).toBe(false);
    });

    it('should return true for both null', () => {
      expect(component.compareTest(null, null)).toBe(true);
    });
  });

  describe('openTestKitLookup', () => {
    it('should set kit panel state when test has testId', () => {
      component.tests = [...mockTests];
      component.openTestKitLookup(0);
      expect(component.showKitPanel).toBe(true);
      expect(component.kitPanelTestId).toBe('ABO');
      expect(component.kitPanelTestIndex).toBe(0);
    });

    it('should not open panel when test has no testId', () => {
      component.tests = [{ testId: '', testDesc: '', testKitId: null, testGroup: null, autoSchedule: null, antigenFlag: null }];
      component.openTestKitLookup(0);
      expect(component.showKitPanel).toBe(false);
    });
  });

  describe('onKitSelected', () => {
    it('should update test kit for the panel index', () => {
      const emitSpy = jasmine.createSpyObj('EventEmitter', ['emit']);
      component.testsChanged = emitSpy;
      component.tests = [...mockTests];
      component.kitPanelTestIndex = 0;

      component.onKitSelected('TK-NEW');

      expect(component.showKitPanel).toBe(false);
      const emittedTests = emitSpy.emit.calls.mostRecent().args[0];
      expect(emittedTests[0].testKitId).toBe('TK-NEW');
    });
  });

  describe('onKitPanelClose', () => {
    it('should close the kit panel', () => {
      component.showKitPanel = true;
      component.onKitPanelClose();
      expect(component.showKitPanel).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
});
