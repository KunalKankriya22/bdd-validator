import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EditTestResultsComponent } from './edit-test-results.component';
import { EditTestResultsApiService } from './services/edit-test-results-api.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { createMockHeaderService } from '@shared/testing/common-mocks';
import {
  UnitValidationDto,
  UnitTestResultDto,
  ValidationWithTestsResponse,
  EditTestResultFormValue,
  UpdateTestResultDto
} from './models/edit-test-results.model';

describe('EditTestResultsComponent', () => {
  let component: EditTestResultsComponent;
  let fixture: ComponentFixture<EditTestResultsComponent>;
  let apiServiceSpy: jasmine.SpyObj<EditTestResultsApiService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let chapterChangedSubject: Subject<void>;

  const mockUnitValidation: UnitValidationDto = {
    unitId: 'TEST001',
    chapterId: '0001',
    collDate: '2024-01-15T00:00:00Z',
    recordCount: 1,
    exists: true,
    isLabeled: false,
    isExtracted: false
  };

  const mockTests: UnitTestResultDto[] = [
    {
      unitId: 'TEST001',
      testId: 'TST01',
      testSeqNo: 1,
      resultStatus1: 'POS',
      resultStatus2: undefined,
      testDesc: 'HIV Antibody Test',
      tbId: 'TB12345',
      absorbance: '0.06',
      ratio: '2.0',
      voidReason: 'BCMR'
    },
    {
      unitId: 'TEST001',
      testId: 'TST02',
      testSeqNo: 1,
      resultStatus1: 'NEG',
      testDesc: 'HCV Antibody Test',
      tbId: 'TB12346'
    }
  ];

  const mockValidationResponse: ValidationWithTestsResponse = {
    success: true,
    message: 'Unit validated successfully',
    statusCode: 200,
    validation: [mockUnitValidation],
    tests: mockTests,
    shiftedTests: mockTests,
    unshiftedTests: [],
    shiftedCount: 2,
    unshiftedCount: 0,
    total: 2
  };

  beforeEach(() => {

    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('EditTestResultsApiService', [
      'validateUnitAndGetTests',
      'getEditableTests',
      'getEditableTestsDropdown',
      'updateTestResult',
      'getEditReasonCodes',
      'getValidTestResults'
    ]);

    headerServiceSpy = createMockHeaderService();

    menuServiceSpy = jasmine.createSpyObj('MenuService', [
      'getMenuItemsSignal',
      'findMenuItemByPath'
    ]);

    menuServiceSpy.getMenuItemsSignal.and.returnValue(() => []);

    apiServiceSpy.validateUnitAndGetTests.and.returnValue(of(mockValidationResponse));
    apiServiceSpy.getEditableTests.and.returnValue(of(mockTests));
    apiServiceSpy.getEditReasonCodes.and.returnValue(of([]));
    apiServiceSpy.getValidTestResults.and.returnValue(of([]));

      TestBed.configureTestingModule({
      imports: [EditTestResultsComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: EditTestResultsApiService, useValue: apiServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MenuService, useValue: menuServiceSpy }
      ]
    });

    

      apiServiceSpy.validateUnitAndGetTests.calls.reset();

      apiServiceSpy.getEditableTests.calls.reset();

      apiServiceSpy.getEditableTestsDropdown.calls.reset();

      apiServiceSpy.updateTestResult.calls.reset();

      apiServiceSpy.getEditReasonCodes.calls.reset();

      apiServiceSpy.getValidTestResults.calls.reset();

      headerServiceSpy.getCurrentChapterId.calls.reset();

      menuServiceSpy.getMenuItemsSignal.calls.reset();

      menuServiceSpy.findMenuItemByPath.calls.reset();

      menuServiceSpy.getMenuItemsSignal.and.returnValue(() => []);

      apiServiceSpy.validateUnitAndGetTests.and.returnValue(of(mockValidationResponse));

      apiServiceSpy.getEditableTests.and.returnValue(of(mockTests));

      apiServiceSpy.getEditReasonCodes.and.returnValue(of([]));

      apiServiceSpy.getValidTestResults.and.returnValue(of([]));

    fixture = TestBed.createComponent(EditTestResultsComponent);
    component = fixture.componentInstance;

    });

  describe('Initialization', () => {

    it('should initialize table configurations', () => {
      fixture.detectChanges();
      expect(component.scheduledTableConfig).toBeTruthy();
      expect(component.unscheduledTableConfig).toBeTruthy();
    });

    it('should initialize signals', () => {
      fixture.detectChanges();
      expect(component.unitValidation()).toBeNull();
      expect(component.scheduledTests()).toEqual([]);
      expect(component.unscheduledTests()).toEqual([]);
      expect(component.loading()).toBeFalse();
      expect(component.error()).toBeNull();
    });
  });

  describe('Unit Validation via API', () => {
    it('should validate unit and load tests on unit validated event', fakeAsync(() => {
      fixture.detectChanges();

      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(apiServiceSpy.validateUnitAndGetTests).toHaveBeenCalledWith('TEST001');
      expect(component.unitValidation()).toEqual(mockUnitValidation);
    }));

    it('should handle unit not found', fakeAsync(() => {
      const notFoundResponse: ValidationWithTestsResponse = {
        ...mockValidationResponse,
        validation: [{
          ...mockUnitValidation,
          exists: false
        }]
      };
      apiServiceSpy.validateUnitAndGetTests.and.returnValue(of(notFoundResponse));

      fixture.detectChanges();
      component.onUnitValidated({
        parsedUnitId: 'NOTFOUND',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'NOTFOUND',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(component.error()).toBe('Unit not found in chapter');
    }));

    it('should handle extracted unit error', fakeAsync(() => {
      const extractedResponse: ValidationWithTestsResponse = {
        ...mockValidationResponse,
        validation: [{
          ...mockUnitValidation,
          isExtracted: true
        }]
      };
      apiServiceSpy.validateUnitAndGetTests.and.returnValue(of(extractedResponse));

      fixture.detectChanges();
      component.onUnitValidated({
        parsedUnitId: 'EXTRACTED001',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'EXTRACTED001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(component.error()).toContain('2188');
      expect(component.error()).toContain('Unit is extracted');
    }));

    it('should handle API error during validation', fakeAsync(() => {
      const error = new Error('Error 0179: Unit not found in chapter');
      apiServiceSpy.validateUnitAndGetTests.and.returnValue(throwError(() => error));

      fixture.detectChanges();
      component.onUnitValidated({
        parsedUnitId: 'ERROR001',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'ERROR001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(component.error()).toBe('Error 0179: Unit not found in chapter');
    }));
  });

  describe('Load Tests', () => {
    it('should load scheduled tests after successful validation', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(apiServiceSpy.validateUnitAndGetTests).toHaveBeenCalledWith('TEST001');
      expect(component.scheduledTests()).toEqual(mockTests);
    }));

    it('should handle error loading tests', fakeAsync(() => {
      apiServiceSpy.validateUnitAndGetTests.and.returnValue(
        throwError(() => new Error('Failed to load tests'))
      );

      fixture.detectChanges();
      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(component.error()).toContain('Failed to load');
    }));
  });

  describe('Collection Date Formatting', () => {
    it('should format collection date as DD-MMM-YYYY', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(component.collectionDate()).toBe('15-JAN-2024');
    }));
  });

  describe('CLEAR Button', () => {
    it('should clear all data', fakeAsync(() => {
      fixture.detectChanges();
      component.onUnitValidated({
        parsedUnitId: 'TEST001',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'TEST001',
        codabarUnitScheme: null,
        entryMode: 'M',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      component.onClear();

      expect(component.unitValidation()).toBeNull();
      expect(component.scheduledTests()).toEqual([]);
      expect(component.unscheduledTests()).toEqual([]);
      expect(component.error()).toBeNull();
    }));
  });

  describe('Edit Side Panel', () => {
    it('should open side panel on edit action', () => {
      fixture.detectChanges();
      const test = mockTests[0];

      component.openEditPanel(test);

      expect(component.sidePanelOpen()).toBeTrue();
      expect(component.selectedTest()).toEqual(test);
    });

    it('should update test result on save', fakeAsync(() => {
      apiServiceSpy.updateTestResult.and.returnValue(of(true));

      fixture.detectChanges();
      component.unitValidation.set(mockUnitValidation);
      component.scheduledTests.set(mockTests);
      component.selectedTest.set(mockTests[0]);

      const formValue: EditTestResultFormValue = {
        resultStatus1: 'NEG',
        voidReason: 'LAB_ERROR',
        testSeqNo: 1
      };

      component.onSidePanelSave(formValue);
      tick();

      expect(apiServiceSpy.updateTestResult).toHaveBeenCalledWith(
        'TEST001',
        'TST01',
        jasmine.objectContaining({
          resultStatus1: 'NEG',
          voidReason: 'LAB_ERROR',
          testSeqNo: 1
        })
      );
    }));

    it('should show success message after save', fakeAsync(() => {
      apiServiceSpy.updateTestResult.and.returnValue(of(true));
      spyOn(component['snackBar'], 'open');

      fixture.detectChanges();
      component.unitValidation.set(mockUnitValidation);
      component.scheduledTests.set(mockTests);
      component.selectedTest.set(mockTests[0]);

      const formValue: EditTestResultFormValue = {
        resultStatus1: 'NEG',
        voidReason: 'LAB_ERROR',
        testSeqNo: 1
      };

      component.onSidePanelSave(formValue);
      tick();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Test result updated successfully',
        'Close',
        jasmine.objectContaining({
          duration: 8000,
          horizontalPosition: 'end',
          verticalPosition: 'top'
        })
      );
    }));

    it('should handle error during save', fakeAsync(() => {
      const error = new Error('Failed to update');
      apiServiceSpy.updateTestResult.and.returnValue(throwError(() => error));
      spyOn(component['snackBar'], 'open');

      fixture.detectChanges();
      component.unitValidation.set(mockUnitValidation);
      component.scheduledTests.set(mockTests);
      component.selectedTest.set(mockTests[0]);

      const formValue: EditTestResultFormValue = {
        resultStatus1: 'NEG',
        voidReason: 'LAB_ERROR',
        testSeqNo: 1
      };

      component.onSidePanelSave(formValue);
      tick();

      expect(component['snackBar'].open).toHaveBeenCalledWith(
        'Failed to update',
        'DISMISS',
        jasmine.objectContaining({
          horizontalPosition: 'end',
          verticalPosition: 'top'
        })
      );
    }));
  });
});
