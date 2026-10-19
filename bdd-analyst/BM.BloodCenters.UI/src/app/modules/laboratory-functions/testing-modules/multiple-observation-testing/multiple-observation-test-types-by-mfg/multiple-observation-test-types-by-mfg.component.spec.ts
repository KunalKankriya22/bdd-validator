import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, Subject, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MultipleObservationTestTypesByMfgComponent } from './multiple-observation-test-types-by-mfg.component';
import { TestTypesApiService } from './services/test-types-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  MultipleObservationTestTypeDto,
  TestLookupDto,
  DefaultControlValueLookupDto
} from './models/test-types.model';

describe('MultipleObservationTestTypesByMfgComponent', () => {
  let createSubject: any;
  let component: MultipleObservationTestTypesByMfgComponent;
  let fixture: ComponentFixture<MultipleObservationTestTypesByMfgComponent>;
  let testTypesApiServiceSpy: jasmine.SpyObj<TestTypesApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: any;

  const mockTestLookup: TestLookupDto = {
    testId: 'ABORH',
    testDesc: 'ABO and Rh Blood Grouping'
  };

  const mockTestType: MultipleObservationTestTypeDto = {
    testId: 'ABORH',
    testType: 'GAMMA',
    testTypeDesc: 'Gamma',
    defaultControlValue: 'Yes',
    resUpdate: 'N',
    othBnd: 'N',
    fullTechTwo: 'N',
    effDate: '2025-01-11T00:00:00Z',
    termDate: null,
    lastModifiedDate: '2025-01-11T10:30:00Z'
  };

  const mockControlValues: DefaultControlValueLookupDto[] = [
    { result: 'POS', resultDesc: 'Positive' },
    { result: 'NEG', resultDesc: 'Negative' }
  ];

  beforeEach(() => {

    testTypesApiServiceSpy = jasmine.createSpyObj('TestTypesApiService', [
      'getTestTypes',
      'getTestsLookup',
      'getControlValues',
      'createTestType',
      'updateTestType',
      'deleteTestType'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = {
      pageHeaderData: signal({ title: 'Multiple Observation Test Types by Mfg', subtitle: '' }),
      getTitle: jasmine.createSpy('getTitle')
    };

    testTypesApiServiceSpy.getTestTypes.and.returnValue(of([mockTestType]));
    testTypesApiServiceSpy.getTestsLookup.and.returnValue(of([mockTestLookup]));
    testTypesApiServiceSpy.getControlValues.and.returnValue(of(mockControlValues));
    testTypesApiServiceSpy.createTestType.and.returnValue(
      of({ success: true, statusCode: 201, data: [] })
    );
    testTypesApiServiceSpy.updateTestType.and.returnValue(
      of({ success: true, statusCode: 200 })
    );
    testTypesApiServiceSpy.deleteTestType.and.returnValue(
      of({ success: true, statusCode: 200 })
    );

      TestBed.configureTestingModule({
imports: [MultipleObservationTestTypesByMfgComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: TestTypesApiService, useValue: testTypesApiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });

    });

  beforeEach(() => {

      testTypesApiServiceSpy.getTestTypes.and.returnValue(of([mockTestType]));

      testTypesApiServiceSpy.getTestsLookup.and.returnValue(of([mockTestLookup]));

      testTypesApiServiceSpy.getControlValues.and.returnValue(of(mockControlValues));

    fixture = TestBed.createComponent(MultipleObservationTestTypesByMfgComponent);
    component = fixture.componentInstance;

    });

  describe('Component Initialization', () => {

    it('should have no test selected initially', () => {
      // Return empty test list so child panel does not auto-select
      testTypesApiServiceSpy.getTestsLookup.and.returnValue(of([]));
      fixture.detectChanges();
      expect(component['selectedTest']()).toBeNull();
      expect(component['hasSelection']()).toBeFalse();
    });
  });

  describe('Test Selection', () => {
    it('should load test types when test is selected', () => {
      fixture.detectChanges();
      component.onTestSelected(mockTestLookup);

      expect(testTypesApiServiceSpy.getTestTypes).toHaveBeenCalledWith('ABORH', {
        includeInactive: true, take: 9999
      });
      expect(component['selectedTest']()).toEqual(mockTestLookup);
      expect(component['selectedTestId']()).toBe('ABORH');
      expect(component['selectedTestDesc']()).toBe('ABO and Rh Blood Grouping');
    });

    it('should load control values when test is selected', () => {
      fixture.detectChanges();
      component.onTestSelected(mockTestLookup);

      expect(testTypesApiServiceSpy.getControlValues).toHaveBeenCalledWith('ABORH');
      expect(component['controlValues']()).toEqual(mockControlValues);
    });

    it('should set loading state while fetching test types', (done) => {
      fixture.detectChanges();

      expect(component['loading']()).toBeFalse();
      component.onTestSelected(mockTestLookup);

      // Since spy returns synchronous of(), loading goes true then immediately false
      // Verify it's false after completion
      setTimeout(() => {
        expect(component['loading']()).toBeFalse();
        done();
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading test types fails', () => {
      testTypesApiServiceSpy.getTestTypes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();
      component.onTestSelected(mockTestLookup);

      expect(component['error']()).toBe('API Error');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith(
        'Failed to load test types. Please try again.'
      );
    });

    it('should not show error when control values fail to load', () => {
      testTypesApiServiceSpy.getControlValues.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      spyOn(console, 'error');
      fixture.detectChanges();
      component.onTestSelected(mockTestLookup);

      expect(console.error).toHaveBeenCalled();
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
    });
  });

  describe('Save Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.onTestSelected(mockTestLookup);
      fixture.detectChanges();
    });

    it('should not save if no test is selected', () => {
      component['selectedTest'].set(null);
      component.onSave({ modified: [mockTestType], deleted: [] });

      expect(testTypesApiServiceSpy.createTestType).not.toHaveBeenCalled();
      expect(testTypesApiServiceSpy.updateTestType).not.toHaveBeenCalled();
    });

    it('should create new test type for new records', (done) => {
      const newTestType: MultipleObservationTestTypeDto = {
        ...mockTestType,
        testType: 'NEWTYPE'
      };

      component['originalTestTypes'].set([]);
      component.onSave({ modified: [newTestType], deleted: [] });

      setTimeout(() => {
        expect(testTypesApiServiceSpy.createTestType).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith(
          'Test Types updated successfully for test ABORH.'
        );
        done();
      }, 100);
    });

    it('should update existing test type for modified records', (done) => {
      component['originalTestTypes'].set([mockTestType]);

      const modifiedTestType: MultipleObservationTestTypeDto = {
        ...mockTestType,
        testTypeDesc: 'Modified Description'
      };

      component.onSave({ modified: [modifiedTestType], deleted: [] });

      setTimeout(() => {
        expect(testTypesApiServiceSpy.updateTestType).toHaveBeenCalledWith(
          'ABORH',
          'GAMMA',
          jasmine.objectContaining({
            testTypeDesc: 'Modified Description'
          })
        );
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should set saving state during save operation', () => {
      createSubject = new Subject<any>();
      testTypesApiServiceSpy.createTestType.and.returnValue(createSubject.asObservable());

      component['originalTestTypes'].set([]);
      component.onSave({ modified: [mockTestType], deleted: [] });
      expect(component['saving']()).toBeTrue();

      // Complete the operation so it doesn't leak
      createSubject.next({ success: true, statusCode: 201 });
      createSubject.complete();
    });
  });

  describe('Cancel Functionality', () => {
    it('should reload original data on cancel', () => {
      fixture.detectChanges();
      component.onTestSelected(mockTestLookup);
      fixture.detectChanges();

      const originalData = JSON.parse(JSON.stringify([mockTestType]));
      component['originalTestTypes'].set(originalData);

      // Modify current data
      component['testTypes'].set([]);

      component.onCancel();

      expect(component['testTypes']()).toEqual(originalData);
    });
  });
  describe('Computed Signals', () => {
    it('should compute selectedTestId from selectedTest', () => {
      component['selectedTest'].set(mockTestLookup);
      expect(component['selectedTestId']()).toBe('ABORH');

      component['selectedTest'].set(null);
      expect(component['selectedTestId']()).toBeNull();
    });

    it('should compute selectedTestDesc from selectedTest', () => {
      component['selectedTest'].set(mockTestLookup);
      expect(component['selectedTestDesc']()).toBe('ABO and Rh Blood Grouping');

      component['selectedTest'].set(null);
      expect(component['selectedTestDesc']()).toBe('');
    });

    it('should compute hasSelection based on selectedTest', () => {
      component['selectedTest'].set(mockTestLookup);
      expect(component['hasSelection']()).toBeTrue();

      component['selectedTest'].set(null);
      expect(component['hasSelection']()).toBeFalse();
    });
  });
  describe('Error Message Extraction', () => {
    it('should extract error message from error response', () => {
      const error = {
        error: {
          errorResponse: {
            error: 'Custom error message'
          }
        }
      };

      const message = component['extractErrorMessage'](error);
      expect(message).toBe('Custom error message');
    });

    it('should extract error message from message field', () => {
      const error = {
        error: {
          message: 'Error message'
        }
      };

      const message = component['extractErrorMessage'](error);
      expect(message).toBe('Error message');
    });

    it('should return default message for unknown error format', () => {
      const error = {};

      const message = component['extractErrorMessage'](error);
      expect(message).toBe('Failed to save test types. Please try again.');
    });
  });
});
