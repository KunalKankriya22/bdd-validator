import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { EnterNtResultsComponent } from './enter-nt-results';
import { NtResultsService } from './services/nt-results.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { signal } from '@angular/core';
import { Subject } from 'rxjs';

import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  NtBatchDto,
  ValidTestDto,
  TestGroupDto,
  AddUnitResponseDto
} from './models/nt-results.model';

describe('EnterNtResultsComponent', () => {
  let component: EnterNtResultsComponent;
  let fixture: ComponentFixture<EnterNtResultsComponent>;
  let ntResultsServiceSpy: jasmine.SpyObj<NtResultsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: any;

  const mockBatch: NtBatchDto = {
    tbId: '062126-NT1001',
    testChapterId: '0001',
    groupTestId: null,
    userId: 'USER01',
    insertDats: '2026-06-21T14:30:00Z',
    firstUnitId: null,
    lastUnitId: null,
    repeatFlag: 'N',
    startWorkNumber: '5000',
    details: [
      { tbId: '062126-NT1001', testChapterId: '0001', testId: 'ABORH', testType: 'A', testingLabCode: null },
      { tbId: '062126-NT1001', testChapterId: '0001', testId: 'HBC', testType: 'A', testingLabCode: null }
    ]
  };

  const mockValidTests: ValidTestDto[] = [
    { testId: 'ABORH', testDesc: 'ABO/Rh Blood Type', testGroup: 'CHEM', antigenFlag: 'N', autoSchedule: 'Y', effDate: '2020-01-01', termDate: null },
    { testId: 'HBC', testDesc: 'Hepatitis B Core', testGroup: 'VIRAL', antigenFlag: 'N', autoSchedule: 'N', effDate: '2020-01-01', termDate: null },
    { testId: 'HBSAG', testDesc: 'Hepatitis B Surface Antigen', testGroup: 'VIRAL', antigenFlag: 'N', autoSchedule: 'N', effDate: '2020-01-01', termDate: null }
  ];

  const mockTestGroups: TestGroupDto[] = [
    { code: 'CHEM', codeDesc: 'Chemistry Tests', effDate: '2020-01-01', termDate: null },
    { code: 'VIRAL', codeDesc: 'Viral Marker Tests', effDate: '2020-01-01', termDate: null }
  ];

  const mockAddUnitResponse: AddUnitResponseDto = {
    unitId: 'W123418031302',
    tbId: '062126-NT1001',
    collDate: '2026-06-20',
    testsProcessed: 2,
    testsAutoScheduled: 0
  };

  beforeEach(() => {

    const chapterChanged$ = new Subject<void>();

    ntResultsServiceSpy = jasmine.createSpyObj('NtResultsService', [
      'createBatch', 'addUnitToBatch', 'getValidTests', 'getTestGroups',
      'validateTestGroup', 'getTestById'
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', ['getTitle'], {
      pageHeaderData: signal({ title: "Enter 'NT' Results", subtitle: '' })
    });
    headerServiceSpy = {
      chapterChanged$: chapterChanged$.asObservable(),
      chapterTimeZone: signal(''),
      getCurrentChapterId: () => '0001'
    };

    ntResultsServiceSpy.getTestGroups.and.returnValue(of(mockTestGroups));
    ntResultsServiceSpy.getValidTests.and.returnValue(of(mockValidTests));
    ntResultsServiceSpy.createBatch.and.returnValue(of(mockBatch));
    ntResultsServiceSpy.addUnitToBatch.and.returnValue(of(mockAddUnitResponse));
    ntResultsServiceSpy.validateTestGroup.and.returnValue(of({ code: 'VIRAL', codeDesc: 'Viral Marker Tests' }));

      TestBed.configureTestingModule({
      imports: [EnterNtResultsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: NtResultsService, useValue: ntResultsServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy }
      ]
    });

    

      ntResultsServiceSpy.createBatch.calls.reset();

      ntResultsServiceSpy.addUnitToBatch.calls.reset();

      ntResultsServiceSpy.getValidTests.calls.reset();

      ntResultsServiceSpy.getTestGroups.calls.reset();

      ntResultsServiceSpy.validateTestGroup.calls.reset();

      ntResultsServiceSpy.getTestById.calls.reset();

      pageHeaderServiceSpy.getTitle.calls.reset();

      ntResultsServiceSpy.getTestGroups.and.returnValue(of(mockTestGroups));

      ntResultsServiceSpy.getValidTests.and.returnValue(of(mockValidTests));

      ntResultsServiceSpy.createBatch.and.returnValue(of(mockBatch));

      ntResultsServiceSpy.addUnitToBatch.and.returnValue(of(mockAddUnitResponse));

      ntResultsServiceSpy.validateTestGroup.and.returnValue(of({ code: 'VIRAL', codeDesc: 'Viral Marker Tests' }));

    fixture = TestBed.createComponent(EnterNtResultsComponent);
    component = fixture.componentInstance;

    });

  it('should load test groups and valid tests on init', fakeAsync(() => {
    fixture.detectChanges();
    tick();

    expect(ntResultsServiceSpy.getTestGroups).toHaveBeenCalled();
    expect(ntResultsServiceSpy.getValidTests).toHaveBeenCalled();
  }));

  describe('Test Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle test selection', () => {
      (component as any).openSelectTestsDialog();
      (component as any).toggleTestSelection(mockValidTests[0]);
      expect((component as any).isTestSelected('ABORH')).toBeTrue();

      (component as any).toggleTestSelection(mockValidTests[0]);
      expect((component as any).isTestSelected('ABORH')).toBeFalse();
    });

    it('should confirm test selection and update selected tests', fakeAsync(() => {
      (component as any).openSelectTestsDialog();
      (component as any).toggleTestSelection(mockValidTests[0]);
      (component as any).toggleTestSelection(mockValidTests[1]);
      (component as any).confirmTestSelection();
      tick();

      expect((component as any).selectedTests().length).toBe(2);
      expect((component as any).showSelectTestsDialog()).toBeFalse();
    }));

    it('should remove individual test chip', fakeAsync(() => {
      (component as any).selectedTests.set([...mockValidTests]);
      (component as any).removeTest('ABORH');
      expect((component as any).selectedTests().length).toBe(2);
      expect((component as any).selectedTests().find((t: any) => t.testId === 'ABORH')).toBeUndefined();
    }));

    it('should clear all tests', () => {
      (component as any).selectedTests.set([...mockValidTests]);
      (component as any).currentBatch.set(mockBatch);
      (component as any).clearAllTests();

      expect((component as any).selectedTests().length).toBe(0);
      expect((component as any).currentBatch()).toBeNull();
    });
  });

  describe('Unit Processing', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      (component as any).currentBatch.set(mockBatch);
      (component as any).selectedTests.set(mockValidTests.slice(0, 2));
      tick();
    }));

    it('should process unit via onUnitValidated', fakeAsync(() => {
      (component as any).onUnitValidated({
        parsedUnitId: 'W123418031302',
        checkDigit: null,
        codeScheme: 'I',
        manualUnitId: 'W123418031302',
        codabarUnitScheme: null,
        entryMode: 'S',
        barcodeType: 'CODE128',
        chapterScheme: 'I'
      });
      tick();

      expect(ntResultsServiceSpy.addUnitToBatch).toHaveBeenCalledWith(
        '062126-NT1001',
        { unitId: 'W123418031302', tbId: '062126-NT1001' }
      );
      expect((component as any).processedUnits().length).toBe(1);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));
  });

  describe('Search and Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load filtered tests when group changes', fakeAsync(() => {
      ntResultsServiceSpy.getValidTests.calls.reset();
      (component as any).onGroupFilterChange('VIRAL');
      tick();

      expect(ntResultsServiceSpy.validateTestGroup).toHaveBeenCalledWith('VIRAL');
      expect(ntResultsServiceSpy.getValidTests).toHaveBeenCalledWith('VIRAL');
    }));
  });
});
