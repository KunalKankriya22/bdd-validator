import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';

import { TestqComponent } from './testq';
import { TestqApiService } from './services/testq-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { UnitValidationResponse } from '@shared/components/unit-id-field';
import { UnitIdFieldComponent } from '@shared/components/unit-id-field';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { createMockHeaderService, createMockMatDialog, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  AllTestsForUnitResultDto,
  UtrsTestDto,
  UnitTestBaseDto,
} from './models/testq.model';

@Component({ selector: 'app-page-header-with-breadcrumb', standalone: true, template: '' })
class PageHeaderWithBreadcrumbStub {
  @Input() config: unknown;
}

@Component({ selector: 'app-unit-id-field', standalone: true, template: '' })
class UnitIdFieldStub {
  @Input() label: unknown;
  @Input() componentId: unknown;
}

describe('TestqComponent', () => {
  let component: TestqComponent;
  let c: any; // alias for accessing protected members in tests
  let fixture: ComponentFixture<TestqComponent>;
  let apiServiceSpy: jasmine.SpyObj<TestqApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  const mockUtrsTest: UtrsTestDto = {
    unitId: 'W12345678901234567',
    collDate: '2024-05-15T00:00:00Z',
    testId: 'HIV',
    testSeqNo: 1,
    testMode: 'M',
    testModeDesc: 'Man',
    testState: 'C',
    resultStatus1: 'NR',
    resultStatus2: null,
    tbId: 'TB001',
    tbSeqNo: 1,
    absorbance: 0.125,
    ratio: 1.234,
    resultDats: '2024-05-15T14:30:00Z',
    resultUserId: 'JSMITH',
    wellNumber: 'A01',
    editResultFlag: 'N',
    chapterId: 'WAD',
    testChapterId: 'WAD',
    cancelFlag: 'N',
    programId: 'TESTPROG',
  };

  const mockUnitTestBase: UnitTestBaseDto = {
    unitId: 'W12345678901234567',
    testId: 'HBV',
    testSeqNo: 1,
    testMode: 'A',
    testModeDesc: 'Auto',
    testState: 'C',
    resultStatus1: 'NR',
    resultStatus2: null,
    tbId: 'TB002',
    tbSeqNo: 2,
    absorbance: 0.098,
    ratio: 0.987,
    resultDats: '2024-05-15T14:35:00Z',
    resultUserId: 'AUTO',
    wellNumber: 'B02',
    editResultFlag: 'N',
    chapterId: 'WAD',
    testChapterId: 'WAD',
    cancelFlag: 'N',
  };

  const mockApiResponse: AllTestsForUnitResultDto = {
    utrsTests: [mockUtrsTest],
    unitTestBaseTests: [mockUnitTestBase],
    totalCount: 2,
  };

  const mockUnitValidation: UnitValidationResponse = {
    parsedUnitId: 'W12345678901234567',
    checkDigit: null,
    codeScheme: 'I',
    manualUnitId: 'W12345678901234567',
    codabarUnitScheme: null,
    entryMode: 'S',
    barcodeType: 'CODE128',
    chapterScheme: 'I',
  };

  beforeEach(() => {

    apiServiceSpy = jasmine.createSpyObj('TestqApiService', [
      'searchAllTestsForUnit',
      'searchUnscheduledTestsForUnit',
      'getCollectionDates',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService();
    dialogSpy = createMockMatDialog();

    apiServiceSpy.searchAllTestsForUnit.and.returnValue(of(mockApiResponse));
    apiServiceSpy.searchUnscheduledTestsForUnit.and.returnValue(of({ utrsTests: [], unitTestBaseTests: [mockUnitTestBase], totalCount: 1 }));
    apiServiceSpy.getCollectionDates.and.returnValue(of([{ collDate: '2024-05-15T00:00:00Z' }]));
      TestBed.configureTestingModule({
      imports: [TestqComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: TestqApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
      ],
    })
      .overrideComponent(TestqComponent, {
        remove: { imports: [PageHeaderWithBreadcrumb, UnitIdFieldComponent] },
        add: {
          imports: [PageHeaderWithBreadcrumbStub, UnitIdFieldStub],
          providers: [{ provide: MatDialog, useValue: dialogSpy }],
        },
      });


    


      apiServiceSpy.searchAllTestsForUnit.calls.reset();


      apiServiceSpy.searchUnscheduledTestsForUnit.calls.reset();


      apiServiceSpy.getCollectionDates.calls.reset();


      headerServiceSpy.getCurrentChapterId.calls.reset();


      apiServiceSpy.searchAllTestsForUnit.and.returnValue(of(mockApiResponse));


      apiServiceSpy.searchUnscheduledTestsForUnit.and.returnValue(of({ utrsTests: [], unitTestBaseTests: [mockUnitTestBase], totalCount: 1 }));


      apiServiceSpy.getCollectionDates.and.returnValue(of([{ collDate: '2024-05-15T00:00:00Z' }]));
    fixture = TestBed.createComponent(TestqComponent);
    component = fixture.componentInstance;
    c = component as any;


    });
  describe('Unit ID Validation', () => {
    it('should handle unit ID validation', fakeAsync(() => {
      fixture.detectChanges();

      component.onUnitIdValidated(mockUnitValidation);
      tick();

      expect(c.unitId()).toBe('W12345678901234567');
    }));

    it('should fetch collection dates then search', fakeAsync(() => {
      fixture.detectChanges();

      component.onUnitIdValidated(mockUnitValidation);
      tick();

      expect(apiServiceSpy.getCollectionDates).toHaveBeenCalledWith('W12345678901234567');
      expect(apiServiceSpy.searchAllTestsForUnit).toHaveBeenCalled();
    }));
  });

  describe('Search Tests', () => {
    it('should load test data on successful search', fakeAsync(() => {
      fixture.detectChanges();

      component.onUnitIdValidated(mockUnitValidation);
      tick();

      expect(c.scheduledTests().length).toBe(1);
      expect(c.unscheduledTests().length).toBe(1);
      expect(c.hasResults()).toBe(true);
    }));




  });

  describe('Clear Functionality', () => {
    it('should clear all data', fakeAsync(() => {
      fixture.detectChanges();

      component.onUnitIdValidated(mockUnitValidation);
      tick();

      expect(c.hasResults()).toBe(true);

      component.clear();

      expect(c.unitId()).toBe('');
      expect(c.collectionDate()).toBe('');
      expect(c.scheduledTests().length).toBe(0);
      expect(c.unscheduledTests().length).toBe(0);
      expect(c.hasResults()).toBe(false);
      expect(c.collectionDates().length).toBe(0);
    }));


  });
  describe('Result Description', () => {
    it('should return resultDesc1 if available', () => {
      const row = { ...mockUtrsTest, resultStatus1Desc: 'NR - Nonreactive' };
      expect(component.getResultDescription(row)).toBe('NR - Nonreactive');
    });

    it('should fall back to resultStatus1 if no description', () => {
      expect(component.getResultDescription(mockUtrsTest)).toBe('NR');
    });


  });
  describe('Date Formatting', () => {
    it('should format date values', () => {
      const formatted = component.formatDateValue('2024-05-15T00:00:00Z');
      expect(formatted).toContain('2024');
    });

    it('should handle null date values', () => {
      expect(component.formatDateValue(null)).toBe('-');
    });
  });
});
