import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import moment from 'moment';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CdkDragDrop } from '@angular/cdk/drag-drop';

import { MultipleObservationFieldsComponent } from './multiple-observation-fields';
import { MofApiService } from './services/multiple-observation-fields-api.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility';
import { createMockHeaderService, createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  MofTestDto,
  MofTestTypeDto,
  MofBandDto,
  MofBandRow,
  MofTestItem,
} from './models/multiple-observation-fields.model';

describe('MultipleObservationFieldsComponent', () => {
  let component: MultipleObservationFieldsComponent;
  let fixture: ComponentFixture<MultipleObservationFieldsComponent>;
  let apiServiceSpy: jasmine.SpyObj<MofApiService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let pageHeaderServiceSpy: any;
  let liveAnnouncerSpy: jasmine.SpyObj<LiveAnnouncer>;
  let chapterChangedSubject: Subject<void>;
  let getMinDateSpy: jasmine.Spy;
  let serializeDateSpy: jasmine.Spy;

  const mockTests: MofTestDto[] = [
    { testId: 'TEST1', testDesc: 'First Test' },
    { testId: 'TEST2', testDesc: 'Second Test' },
    { testId: 'ABC', testDesc: 'Another Test' },
  ];

  const mockTestTypes: MofTestTypeDto[] = [
    { testType: 'TYPE1', testTypeDesc: 'Type One' },
    { testType: 'TYPE2', testTypeDesc: 'Type Two' },
  ];

  const mockBands: MofBandDto[] = [
    {
      testId: 'TEST1',
      testType: 'TYPE1',
      bandSeq: 1,
      bandName: 'Band One',
      effDate: '2026-01-01',
      termDate: null,
      lastModifiedDate: '2026-01-15',
    },
    {
      testId: 'TEST1',
      testType: 'TYPE1',
      bandSeq: 2,
      bandName: 'Band Two',
      effDate: '2026-02-01',
      termDate: '2026-12-31',
      lastModifiedDate: '2026-02-10',
    },
  ];

  beforeEach(async () => {
    chapterChangedSubject = new Subject<void>();

    apiServiceSpy = jasmine.createSpyObj('MofApiService', [
      'getTests',
      'getTestTypes',
      'getBands',
      'createBand',
      'updateBand',
      'deleteBand',
      'resequence',
    ]);

    snackbarServiceSpy = createMockSnackbarService();
    headerServiceSpy = createMockHeaderService({
      chapterChanged$: chapterChangedSubject.asObservable(),
    });

    const pageHeaderDataSignal = signal(null as any);
    pageHeaderServiceSpy = {
      pageHeaderData: pageHeaderDataSignal,
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem'),
      getTitle: jasmine.createSpy('getTitle'),
      getSubtitle: jasmine.createSpy('getSubtitle'),
    };

    liveAnnouncerSpy = jasmine.createSpyObj('LiveAnnouncer', ['announce']);

    // Set default return values
    apiServiceSpy.getTests.and.returnValue(of(mockTests));
    apiServiceSpy.getTestTypes.and.returnValue(of(mockTestTypes));
    apiServiceSpy.getBands.and.returnValue(of(mockBands));
    apiServiceSpy.createBand.and.returnValue(of({} as any));
    apiServiceSpy.updateBand.and.returnValue(of({} as any));
    apiServiceSpy.resequence.and.returnValue(of({} as any));

    await TestBed.configureTestingModule({
      imports: [MultipleObservationFieldsComponent, NoopAnimationsModule],
      providers: [
        { provide: MofApiService, useValue: apiServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: LiveAnnouncer, useValue: liveAnnouncerSpy },
        provideRouter([]),
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    getMinDateSpy = spyOn(DateFieldValidationUtility, 'getMinDate').and.returnValue(
      moment('2026-08-03')
    );
    serializeDateSpy = spyOn(DateFieldValidationUtility, 'serializeDateForApi').and.callFake(
      (m: any) => (m?.format('YYYY-MM-DD') ?? null)
    );

    fixture = TestBed.createComponent(MultipleObservationFieldsComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.destroy();
  });

  // ============================================================================
  // 1. Component Creation (2)
  // ============================================================================
  describe('Component Creation', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have correct displayedColumns', () => {
      expect(component.displayedColumns).toEqual([
        'drag',
        'sequence',
        'bandName',
        'effDate',
        'termDate',
        'modDate',
      ]);
    });
  });

  // ============================================================================
  // 2. Lifecycle - ngOnInit (4)
  // ============================================================================
  describe('Lifecycle - ngOnInit', () => {
    it('should call loadTests on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(apiServiceSpy.getTests).toHaveBeenCalled();
    }));

    it('should populate allTests and filteredTests from API', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.allTests.length).toBe(3);
      expect(component.filteredTests.length).toBe(3);
      expect(component.allTests[0].testId).toBe('TEST1');
      expect(component.allTests[0].description).toBe('First Test');
    }));

    it('should auto-select first test', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.selectedTest).toBeTruthy();
      expect(component.selectedTest?.testId).toBe('TEST1');
    }));

    it('should handle testsLoading states', fakeAsync(() => {
      const testsSubject = new Subject<MofTestDto[]>();
      apiServiceSpy.getTests.and.returnValue(testsSubject);

      expect(component.testsLoading).toBe(false);

      fixture.detectChanges();
      expect(component.testsLoading).toBe(true);

      testsSubject.next(mockTests);
      testsSubject.complete();
      tick();
      expect(component.testsLoading).toBe(false);
    }));
  });

  // ============================================================================
  // 3. Lifecycle - ngOnDestroy (2)
  // ============================================================================
  describe('Lifecycle - ngOnDestroy', () => {
    it('should complete destroy$ subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });

    it('should call next on destroy$', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 4. Page Header Config (2)
  // ============================================================================
  describe('Page Header Config', () => {
    it('should have default empty config', () => {
      expect(component.pageHeaderConfig).toEqual({
        breadcrumbs: [],
        title: '',
        subtitle: '',
        actions: [],
      });
    });

    it('should update when pageHeaderData signal changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      pageHeaderServiceSpy.pageHeaderData.set({
        title: 'Multiple Observation Fields',
        subtitle: 'Manage test bands',
      });

      tick();
      fixture.detectChanges();

      expect(component.pageHeaderConfig.title).toBe('Multiple Observation Fields');
      expect(component.pageHeaderConfig.subtitle).toBe('Manage test bands');
      expect(component.pageHeaderConfig.breadcrumbs.length).toBe(2);
      expect(component.pageHeaderConfig.breadcrumbs[0].label).toBe('Home');
    }));
  });

  // ============================================================================
  // 5. Left Panel - Test Search (5)
  // ============================================================================
  describe('Left Panel - Test Search', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter tests by testId (case insensitive)', () => {
      component.searchText = 'test1';
      component.onSearch();

      expect(component.filteredTests.length).toBe(1);
      expect(component.filteredTests[0].testId).toBe('TEST1');
    });

    it('should filter tests by description', () => {
      component.searchText = 'another';
      component.onSearch();

      expect(component.filteredTests.length).toBe(1);
      expect(component.filteredTests[0].testId).toBe('ABC');
    });

    it('should show all tests when search text is empty', () => {
      component.searchText = '';
      component.onSearch();

      expect(component.filteredTests.length).toBe(3);
    });

    it('should show all tests when search cleared', () => {
      component.searchText = 'test1';
      component.onSearch();
      expect(component.filteredTests.length).toBe(1);

      component.searchText = '';
      component.onSearch();
      expect(component.filteredTests.length).toBe(3);
    });

    it('should return empty when no match', () => {
      component.searchText = 'nonexistent';
      component.onSearch();

      expect(component.filteredTests.length).toBe(0);
    });
  });

  // ============================================================================
  // 6. Left Panel - Test Select (4)
  // ============================================================================
  describe('Left Panel - Test Select', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set selectedTest', () => {
      const test: MofTestItem = { testId: 'TEST2', description: 'Second Test' };
      component.selectTest(test);

      expect(component.selectedTest).toBe(test);
    });

    it('should not re-select same test', fakeAsync(() => {
      apiServiceSpy.getTestTypes.calls.reset();

      const test = component.selectedTest!;
      component.selectTest(test);

      tick();
      expect(apiServiceSpy.getTestTypes).not.toHaveBeenCalled();
    }));

    it('should reset state on new test selection', fakeAsync(() => {
      component.selectedTestType = 'TYPE1';
      component.rows = [
        {
          bandSeq: 1,
          bandName: 'Test',
          effDate: '2026-01-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
      ];
      component.isDirty = true;

      const test: MofTestItem = { testId: 'TEST2', description: 'Second Test' };
      component.selectTest(test);
      tick();

      expect(component.selectedTestType).toBeNull();
      expect(component.rows.length).toBe(0);
      expect(component.isDirty).toBe(false);
    }));

    it('should call loadTestTypes', fakeAsync(() => {
      apiServiceSpy.getTestTypes.calls.reset();

      const test: MofTestItem = { testId: 'TEST2', description: 'Second Test' };
      component.selectTest(test);
      tick();

      expect(apiServiceSpy.getTestTypes).toHaveBeenCalledWith('TEST2');
    }));
  });

  // ============================================================================
  // 7. Test Kit Dropdown (8)
  // ============================================================================
  describe('Test Kit Dropdown', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should populate testTypes from API', fakeAsync(() => {
      expect(component.testTypes.length).toBe(2);
      expect(component.testTypes[0].testType).toBe('TYPE1');
    }));

    it('should handle testTypesLoading states', fakeAsync(() => {
      const typesSubject = new Subject<MofTestTypeDto[]>();
      apiServiceSpy.getTestTypes.and.returnValue(typesSubject);

      expect(component.testTypesLoading).toBe(false);

      (component as any).loadTestTypes('TEST2');
      expect(component.testTypesLoading).toBe(true);

      typesSubject.next(mockTestTypes);
      typesSubject.complete();
      tick();
      expect(component.testTypesLoading).toBe(false);
    }));

    it('should auto-select when only one testType', fakeAsync(() => {
      const singleType: MofTestTypeDto[] = [{ testType: 'SINGLE', testTypeDesc: 'Only One' }];
      apiServiceSpy.getTestTypes.and.returnValue(of(singleType));

      const test: MofTestItem = { testId: 'TEST2', description: 'Second Test' };
      component.selectTest(test);
      tick();

      expect(component.selectedTestType).toBe('SINGLE');
    }));

    it('should call onTestTypeChange after auto-select', fakeAsync(() => {
      const singleType: MofTestTypeDto[] = [{ testType: 'SINGLE', testTypeDesc: 'Only One' }];
      apiServiceSpy.getTestTypes.and.returnValue(of(singleType));
      spyOn(component, 'onTestTypeChange');

      const test: MofTestItem = { testId: 'TEST2', description: 'Second Test' };
      component.selectTest(test);
      tick();

      expect(component.onTestTypeChange).toHaveBeenCalled();
    }));

    it('should clear state when selectedTestType is null', () => {
      component.rows = [
        {
          bandSeq: 1,
          bandName: 'Test',
          effDate: '2026-01-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
      ];
      component.isDirty = true;

      component.selectedTestType = null;
      component.onTestTypeChange();

      expect(component.rows.length).toBe(0);
      expect(component.isDirty).toBe(false);
    });

    it('should clear state when selectedTest is null', () => {
      component.selectedTest = null;
      component.rows = [
        {
          bandSeq: 1,
          bandName: 'Test',
          effDate: '2026-01-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
      ];

      component.onTestTypeChange();

      expect(component.rows.length).toBe(0);
    });

    it('should call loadBands when both set', fakeAsync(() => {
      apiServiceSpy.getBands.calls.reset();

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();

      expect(apiServiceSpy.getBands).toHaveBeenCalledWith('TEST1', 'TYPE1');
    }));

    it('should handle testTypes loading error', fakeAsync(() => {
      apiServiceSpy.getTestTypes.and.returnValue(throwError(() => new Error('API Error')));

      const test: MofTestItem = { testId: 'TEST2', description: 'Second Test' };
      component.selectTest(test);
      tick();

      expect(component.testTypesLoading).toBe(false);
    }));
  });

  // ============================================================================
  // 8. Bands Table - Loading (6)
  // ============================================================================
  describe('Bands Table - Loading', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call getBands with correct params', fakeAsync(() => {
      apiServiceSpy.getBands.calls.reset();

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();

      expect(apiServiceSpy.getBands).toHaveBeenCalledWith('TEST1', 'TYPE1');
    }));

    it('should handle bandsLoading states', fakeAsync(() => {
      const bandsSubject = new Subject<MofBandDto[]>();
      apiServiceSpy.getBands.and.returnValue(bandsSubject);

      expect(component.bandsLoading).toBe(false);

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      (component as any).loadBands();

      expect(component.bandsLoading).toBe(true);

      bandsSubject.next(mockBands);
      bandsSubject.complete();
      tick();
      expect(component.bandsLoading).toBe(false);
    }));

    it('should map and sort bands by bandSeq', fakeAsync(() => {
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();

      expect(component.rows.length).toBe(2);
      expect(component.rows[0].bandSeq).toBe(1);
      expect(component.rows[1].bandSeq).toBe(2);
      expect(component.rows[0].bandName).toBe('Band One');
    }));

    it('should store originalRows as deep copies', fakeAsync(() => {
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();

      expect(component.originalRows.length).toBe(2);
      expect(component.originalRows[0]).not.toBe(component.rows[0]);
      expect(component.originalRows[0].bandName).toBe(component.rows[0].bandName);
    }));

    it('should reset isDirty after load', fakeAsync(() => {
      component.isDirty = true;

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();

      expect(component.isDirty).toBe(false);
    }));

    it('should show error snackbar on load failure', fakeAsync(() => {
      apiServiceSpy.getBands.and.returnValue(throwError(() => new Error('Load failed')));

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      expect(component.bandsLoading).toBe(false);
    }));
  });

  // ============================================================================
  // 9. Bands Table - Add New Band (5)
  // ============================================================================
  describe('Bands Table - Add New Band', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();
    }));

    it('should append new row with isNew=true', () => {
      const initialLength = component.rows.length;
      component.addNewBand();

      expect(component.rows.length).toBe(initialLength + 1);
      expect(component.rows[component.rows.length - 1].isNew).toBe(true);
    });

    it('should set bandSeq to max+1', () => {
      component.addNewBand();

      expect(component.rows[component.rows.length - 1].bandSeq).toBe(3);
    });

    it('should set bandSeq to 1 when empty', () => {
      component.rows = [];
      component.addNewBand();

      expect(component.rows[0].bandSeq).toBe(1);
    });

    it('should mark isDirty', () => {
      component.isDirty = false;
      component.addNewBand();

      expect(component.isDirty).toBe(true);
    });

    it('should set empty bandName and effDate', () => {
      component.addNewBand();

      const newRow = component.rows[component.rows.length - 1];
      expect(newRow.bandName).toBe('');
      expect(newRow.effDate).toBe('');
      expect(newRow.termDate).toBeNull();
    });
  });

  // ============================================================================
  // 10. Bands Table - Delete Row (3)
  // ============================================================================
  describe('Bands Table - Delete Row', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();
    }));

    it('should remove the row', () => {
      const initialLength = component.rows.length;
      component.deleteRow(component.rows[0]);

      expect(component.rows.length).toBe(initialLength - 1);
    });

    it('should resequence remaining rows', () => {
      component.deleteRow(component.rows[0]);

      expect(component.rows[0].bandSeq).toBe(1);
      expect(component.rows[0].bandName).toBe('Band Two');
    });

    it('should mark isDirty', () => {
      component.isDirty = false;
      component.deleteRow(component.rows[0]);

      expect(component.isDirty).toBe(true);
    });
  });

  // ============================================================================
  // 11. Date Validation - getEffDateError (8)
  // ============================================================================
  describe('Date Validation - getEffDateError', () => {
    let newRow: MofBandRow;
    let existingRow: MofBandRow;

    beforeEach(() => {
      newRow = {
        bandSeq: 1,
        bandName: 'Test Band',
        effDate: '2026-08-10',
        termDate: null,
        lastModifiedDate: null,
        isNew: true,
      };

      existingRow = {
        bandSeq: 2,
        bandName: 'Existing Band',
        effDate: '2025-01-01',
        termDate: null,
        lastModifiedDate: '2025-01-15',
        isNew: false,
      };
    });

    it('should return null when effDate is valid', () => {
      newRow.effDate = '2026-08-10';
      const error = component.getEffDateError(newRow);

      expect(error).toBeNull();
    });

    it('should return null when effDate empty and bandName empty', () => {
      newRow.effDate = '';
      newRow.bandName = '';
      const error = component.getEffDateError(newRow);

      expect(error).toBeNull();
    });

    it('should return null when effDate empty and not touched', () => {
      newRow.effDate = '';
      newRow.bandName = 'Test';
      (component as any).touchedEffDates.clear();

      const error = component.getEffDateError(newRow);

      expect(error).toBeNull();
    });

    it('should return "Effective date is required" when empty, bandName set, and touched', () => {
      newRow.effDate = '';
      newRow.bandName = 'Test';
      (component as any).touchedEffDates.add(newRow);

      const error = component.getEffDateError(newRow);

      expect(error).toBe('Effective date is required');
    });

    it('should return "Effective date must be today or later" for new row with past date', () => {
      newRow.effDate = '2026-08-01';
      const error = component.getEffDateError(newRow);

      expect(error).toBe('Effective date must be today or later');
    });

    it('should return null for new row with today\'s date', () => {
      newRow.effDate = '2026-08-03';
      const error = component.getEffDateError(newRow);

      expect(error).toBeNull();
    });

    it('should return null for new row with future date', () => {
      newRow.effDate = '2026-08-10';
      const error = component.getEffDateError(newRow);

      expect(error).toBeNull();
    });

    it('should return null for existing row with past date', () => {
      existingRow.effDate = '2025-01-01';
      const error = component.getEffDateError(existingRow);

      expect(error).toBeNull();
    });
  });

  // ============================================================================
  // 12. Date Validation - getTermDateError (8)
  // ============================================================================
  describe('Date Validation - getTermDateError', () => {
    let row: MofBandRow;

    beforeEach(() => {
      row = {
        bandSeq: 1,
        bandName: 'Test Band',
        effDate: '2026-08-10',
        termDate: null,
        lastModifiedDate: null,
        isNew: true,
      };
      component.originalRows = [];
    });

    it('should return null when termDate is null', () => {
      row.termDate = null;
      const error = component.getTermDateError(row);

      expect(error).toBeNull();
    });

    it('should return null for valid termDate after effDate', () => {
      row.effDate = '2026-08-10';
      row.termDate = '2026-08-15';
      const error = component.getTermDateError(row);

      expect(error).toBeNull();
    });

    it('should return null for invalid moment', () => {
      row.termDate = 'invalid-date';
      const error = component.getTermDateError(row);

      expect(error).toBeNull();
    });

    it('should return "Termination date must be on or after effective date" when before eff', () => {
      row.effDate = '2026-08-10';
      row.termDate = '2026-08-05';
      const error = component.getTermDateError(row);

      expect(error).toBe('Termination date must be on or after effective date');
    });

    it('should return null when term equals eff', () => {
      row.effDate = '2026-08-10';
      row.termDate = '2026-08-10';
      const error = component.getTermDateError(row);

      expect(error).toBeNull();
    });

    it('should return "Termination date must be today or later" for new row with past date', () => {
      row.isNew = true;
      row.effDate = '2026-07-01';
      row.termDate = '2026-07-15';
      const error = component.getTermDateError(row);

      expect(error).toBe('Termination date must be today or later');
    });

    it('should return "Termination date must be today or later" for changed existing with past date', () => {
      row.isNew = false;
      row.bandSeq = 1;
      row.effDate = '2026-07-01';
      row.termDate = '2026-07-15';

      component.originalRows = [
        {
          bandSeq: 1,
          bandName: 'Test',
          effDate: '2026-07-01',
          termDate: '2026-09-01',
          lastModifiedDate: null,
          isNew: false,
        },
      ];

      const error = component.getTermDateError(row);

      expect(error).toBe('Termination date must be today or later');
    });

    it('should return null for unchanged existing with past date', () => {
      row.isNew = false;
      row.bandSeq = 1;
      row.effDate = '2026-07-01';
      row.termDate = '2026-07-15';

      component.originalRows = [
        {
          bandSeq: 1,
          bandName: 'Test',
          effDate: '2026-07-01',
          termDate: '2026-07-15',
          lastModifiedDate: null,
          isNew: false,
        },
      ];

      const error = component.getTermDateError(row);

      expect(error).toBeNull();
    });
  });

  // ============================================================================
  // 13. ErrorStateMatcher (6)
  // ============================================================================
  describe('ErrorStateMatcher', () => {
    let row: MofBandRow;

    beforeEach(() => {
      row = {
        bandSeq: 1,
        bandName: 'Test',
        effDate: '',
        termDate: null,
        lastModifiedDate: null,
        isNew: true,
      };
    });

    it('getEffDateMatcher should return ErrorStateMatcher', () => {
      const matcher = component.getEffDateMatcher(row);
      expect(matcher).toBeDefined();
      expect(typeof matcher.isErrorState).toBe('function');
    });

    it('getEffDateMatcher should cache per row', () => {
      const matcher1 = component.getEffDateMatcher(row);
      const matcher2 = component.getEffDateMatcher(row);

      expect(matcher1).toBe(matcher2);
    });

    it('getEffDateMatcher isErrorState true when error exists', () => {
      row.bandName = 'Test';
      (component as any).touchedEffDates.add(row);
      spyOn(component, 'getEffDateError').and.returnValue('Error message');

      const matcher = component.getEffDateMatcher(row);
      const hasError = matcher.isErrorState(null as any, null as any);

      expect(hasError).toBe(true);
    });

    it('getEffDateMatcher isErrorState false when no error', () => {
      spyOn(component, 'getEffDateError').and.returnValue(null);

      const matcher = component.getEffDateMatcher(row);
      const hasError = matcher.isErrorState(null as any, null as any);

      expect(hasError).toBe(false);
    });

    it('getTermDateMatcher should return ErrorStateMatcher', () => {
      const matcher = component.getTermDateMatcher(row);
      expect(matcher).toBeDefined();
      expect(typeof matcher.isErrorState).toBe('function');
    });

    it('getTermDateMatcher should cache per row', () => {
      const matcher1 = component.getTermDateMatcher(row);
      const matcher2 = component.getTermDateMatcher(row);

      expect(matcher1).toBe(matcher2);
    });
  });

  // ============================================================================
  // 14. Date Input Blur (8)
  // ============================================================================
  describe('Date Input Blur', () => {
    let row: MofBandRow;

    beforeEach(() => {
      row = {
        bandSeq: 1,
        bandName: 'Test',
        effDate: '2026-08-10',
        termDate: null,
        lastModifiedDate: null,
        isNew: true,
      };
    });

    it('should add row to touchedEffDates for effDate field', () => {
      const event = { target: { value: '12-AUG-2026' } } as any;
      component.onDateInputBlur(row, event, 'effDate');

      expect((component as any).touchedEffDates.has(row)).toBe(true);
    });

    it('should not add for termDate field', () => {
      (component as any).touchedEffDates.clear();
      const event = { target: { value: '12-AUG-2026' } } as any;
      component.onDateInputBlur(row, event, 'termDate');

      expect((component as any).touchedEffDates.has(row)).toBe(false);
    });

    it('should clear effDate for invalid input', () => {
      const event = { target: { value: 'invalid-date' } } as any;
      component.onDateInputBlur(row, event, 'effDate');

      expect(row.effDate).toBe('');
    });

    it('should clear termDate for invalid input', () => {
      row.termDate = '2026-08-15';
      const event = { target: { value: 'invalid-date' } } as any;
      component.onDateInputBlur(row, event, 'termDate');

      expect(row.termDate).toBeNull();
    });

    it('should not change for valid DD-MMM-YYYY', () => {
      row.effDate = '2026-08-10';
      const event = { target: { value: '10-AUG-2026' } } as any;
      component.onDateInputBlur(row, event, 'effDate');

      expect(row.effDate).toBe('2026-08-10');
    });

    it('should not change for valid YYYY-MM-DD', () => {
      row.effDate = '2026-08-10';
      const event = { target: { value: '2026-08-10' } } as any;
      component.onDateInputBlur(row, event, 'effDate');

      expect(row.effDate).toBe('2026-08-10');
    });

    it('should mark isDirty when clearing', () => {
      component.isDirty = false;
      const event = { target: { value: 'invalid' } } as any;
      component.onDateInputBlur(row, event, 'effDate');

      expect(component.isDirty).toBe(true);
    });

    it('should create new rows array reference', () => {
      const originalRows = component.rows;
      const event = { target: { value: '10-AUG-2026' } } as any;
      component.onDateInputBlur(row, event, 'effDate');

      expect(component.rows).not.toBe(originalRows);
    });
  });

  // ============================================================================
  // 15. Date Change Handlers (6)
  // ============================================================================
  describe('Date Change Handlers', () => {
    let row: MofBandRow;

    beforeEach(() => {
      row = {
        bandSeq: 1,
        bandName: 'Test',
        effDate: '',
        termDate: null,
        lastModifiedDate: null,
        isNew: true,
      };
      component.isDirty = false;
    });

    it('onEffDateChange should set effDate from moment', () => {
      const date = moment('2026-08-10');
      serializeDateSpy.and.returnValue('2026-08-10');

      component.onEffDateChange(row, date);

      expect(row.effDate).toBe('2026-08-10');
    });

    it('onEffDateChange should set empty when null', () => {
      row.effDate = '2026-08-10';
      serializeDateSpy.and.returnValue(null);

      component.onEffDateChange(row, null);

      expect(row.effDate).toBe('');
    });

    it('onEffDateChange should mark isDirty', () => {
      const date = moment('2026-08-10');
      component.onEffDateChange(row, date);

      expect(component.isDirty).toBe(true);
    });

    it('onTermDateChange should set termDate from moment', () => {
      const date = moment('2026-08-15');
      serializeDateSpy.and.returnValue('2026-08-15');

      component.onTermDateChange(row, date);

      expect(row.termDate).toBe('2026-08-15');
    });

    it('onTermDateChange should set null when null', () => {
      row.termDate = '2026-08-15';
      serializeDateSpy.and.returnValue(null);

      component.onTermDateChange(row, null);

      expect(row.termDate).toBeNull();
    });

    it('onTermDateChange should mark isDirty', () => {
      const date = moment('2026-08-15');
      component.onTermDateChange(row, date);

      expect(component.isDirty).toBe(true);
    });
  });

  // ============================================================================
  // 16. Drag and Drop (5)
  // ============================================================================
  describe('Drag and Drop', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();
      component.isDirty = false;
    }));

    it('should reorder rows when different index', () => {
      const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<MofBandRow[]>;
      const firstBand = component.rows[0].bandName;

      component.onDrop(event);

      expect(component.rows[1].bandName).toBe(firstBand);
    });

    it('should resequence after reorder', () => {
      const event = { previousIndex: 1, currentIndex: 0 } as CdkDragDrop<MofBandRow[]>;

      component.onDrop(event);

      expect(component.rows[0].bandSeq).toBe(1);
      expect(component.rows[1].bandSeq).toBe(2);
    });

    it('should mark isDirty', () => {
      const event = { previousIndex: 0, currentIndex: 1 } as CdkDragDrop<MofBandRow[]>;

      component.onDrop(event);

      expect(component.isDirty).toBe(true);
    });

    it('should not change when same index', () => {
      const event = { previousIndex: 0, currentIndex: 0 } as CdkDragDrop<MofBandRow[]>;
      const originalRows = [...component.rows];

      component.onDrop(event);

      expect(component.rows).toEqual(originalRows);
    });

    it('should not mark isDirty when same index', () => {
      const event = { previousIndex: 0, currentIndex: 0 } as CdkDragDrop<MofBandRow[]>;

      component.onDrop(event);

      expect(component.isDirty).toBe(false);
    });
  });

  // ============================================================================
  // 17. Save Flow (16)
  // ============================================================================
  describe('Save Flow', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();
    }));

    it('should not save when selectedTest is null', fakeAsync(() => {
      component.selectedTest = null;
      component.save();
      tick();

      expect(apiServiceSpy.createBand).not.toHaveBeenCalled();
    }));

    it('should not save when selectedTestType is null', fakeAsync(() => {
      component.selectedTestType = null;
      component.save();
      tick();

      expect(apiServiceSpy.createBand).not.toHaveBeenCalled();
    }));

    it('should not save when hasInvalidRows', fakeAsync(() => {
      component.rows[0].bandName = '';
      component.save();
      tick();

      expect(apiServiceSpy.createBand).not.toHaveBeenCalled();
    }));

    it('should not save when isSaving', fakeAsync(() => {
      component.isSaving = true;
      component.save();
      tick();

      expect(apiServiceSpy.createBand).not.toHaveBeenCalled();
    }));

    it('should set isSaving true', fakeAsync(() => {
      component.save();

      expect(component.isSaving).toBe(true);
      tick();
    }));

    it('should call createBand for new rows', fakeAsync(() => {
      component.addNewBand();
      component.rows[component.rows.length - 1].bandName = 'New Band';
      component.rows[component.rows.length - 1].effDate = '2026-08-10';

      component.save();
      tick();

      expect(apiServiceSpy.createBand).toHaveBeenCalled();
    }));

    it('should call updateBand for changed rows', fakeAsync(() => {
      component.originalRows = [
        {
          bandSeq: 1,
          bandName: 'Original',
          effDate: '2026-01-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
      ];
      component.rows = [
        {
          bandSeq: 1,
          bandName: 'Modified',
          effDate: '2026-01-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
      ];

      component.save();
      tick();

      expect(apiServiceSpy.updateBand).toHaveBeenCalled();
    }));

    it('should not call updateBand for unchanged rows', fakeAsync(() => {
      apiServiceSpy.updateBand.calls.reset();

      component.save();
      tick();

      expect(apiServiceSpy.updateBand).not.toHaveBeenCalled();
    }));

    it('should call resequence when reordered', async () => {
      component.originalRows = [
        {
          bandSeq: 1,
          bandName: 'Band One',
          effDate: '2026-01-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
        {
          bandSeq: 2,
          bandName: 'Band Two',
          effDate: '2026-02-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
      ];
      component.rows = [
        {
          bandSeq: 2,
          bandName: 'Band Two',
          effDate: '2026-02-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
        {
          bandSeq: 1,
          bandName: 'Band One',
          effDate: '2026-01-01',
          termDate: null,
          lastModifiedDate: null,
          isNew: false,
        },
      ];

      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(apiServiceSpy.resequence).toHaveBeenCalled();
    });

    it('should not call resequence when order unchanged', async () => {
      apiServiceSpy.resequence.calls.reset();

      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(apiServiceSpy.resequence).not.toHaveBeenCalled();
    });

    it('should show success snackbar', async () => {
      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should include testId in success message', async () => {
      component.save();
      await new Promise(r => setTimeout(r, 0));

      const message = snackbarServiceSpy.showSuccess.calls.mostRecent().args[0];
      expect(message).toContain('TEST1');
    });

    it('should reload bands after success', async () => {
      apiServiceSpy.getBands.calls.reset();

      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(apiServiceSpy.getBands).toHaveBeenCalledWith('TEST1', 'TYPE1');
    });

    it('should set isSaving false after success', async () => {
      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(component.isSaving).toBe(false);
    });

    it('should show error snackbar on failure', async () => {
      apiServiceSpy.createBand.and.returnValue(throwError(() => new Error('Save failed')));

      component.addNewBand();
      component.rows[component.rows.length - 1].bandName = 'New Band';
      component.rows[component.rows.length - 1].effDate = '2026-08-10';

      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    });

    it('should set isSaving false after error', async () => {
      apiServiceSpy.createBand.and.returnValue(throwError(() => new Error('Save failed')));

      component.addNewBand();
      component.rows[component.rows.length - 1].bandName = 'New Band';
      component.rows[component.rows.length - 1].effDate = '2026-08-10';

      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(component.isSaving).toBe(false);
    });
  });

  // ============================================================================
  // 18. Cancel and Clear All (5)
  // ============================================================================
  describe('Cancel and Clear All', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();
    }));

    it('clearAll should restore originalRows', () => {
      component.rows[0].bandName = 'Modified';
      component.clearAll();

      expect(component.rows[0].bandName).toBe('Band One');
    });

    it('clearAll should resequence', () => {
      component.rows = component.rows.reverse();
      component.clearAll();

      expect(component.rows[0].bandSeq).toBe(1);
      expect(component.rows[1].bandSeq).toBe(2);
    });

    it('clearAll should set isDirty false', () => {
      component.isDirty = true;
      component.clearAll();

      expect(component.isDirty).toBe(false);
    });

    it('cancel should restore originalRows', () => {
      component.rows[0].bandName = 'Modified';
      component.cancel();

      expect(component.rows[0].bandName).toBe('Band One');
    });

    it('cancel should set isDirty false', () => {
      component.isDirty = true;
      component.cancel();

      expect(component.isDirty).toBe(false);
    });
  });

  // ============================================================================
  // 19. hasInvalidRows (6)
  // ============================================================================
  describe('hasInvalidRows', () => {
    let row: MofBandRow;

    beforeEach(() => {
      row = {
        bandSeq: 1,
        bandName: 'Test',
        effDate: '2026-08-10',
        termDate: null,
        lastModifiedDate: null,
        isNew: true,
      };
      component.rows = [row];
    });

    it('should return false when all valid', () => {
      expect(component.hasInvalidRows).toBe(false);
    });

    it('should return true for empty bandName', () => {
      row.bandName = '';
      expect(component.hasInvalidRows).toBe(true);
    });

    it('should return true for whitespace bandName', () => {
      row.bandName = '   ';
      expect(component.hasInvalidRows).toBe(true);
    });

    it('should return true for empty effDate', () => {
      row.effDate = '';
      expect(component.hasInvalidRows).toBe(true);
    });

    it('should return true when effDate error exists', () => {
      spyOn(component, 'getEffDateError').and.returnValue('Error');
      expect(component.hasInvalidRows).toBe(true);
    });

    it('should return true when termDate error exists', () => {
      spyOn(component, 'getTermDateError').and.returnValue('Error');
      expect(component.hasInvalidRows).toBe(true);
    });
  });

  // ============================================================================
  // 20. Date Helpers (6)
  // ============================================================================
  describe('Date Helpers', () => {
    describe('parseDateForPicker', () => {
      it('valid date returns moment', () => {
        const result = component.parseDateForPicker('2026-08-10');
        expect(moment.isMoment(result)).toBe(true);
        expect(result?.format('YYYY-MM-DD')).toBe('2026-08-10');
      });

      it('null returns null', () => {
        const result = component.parseDateForPicker(null);
        expect(result).toBeNull();
      });

      it('empty returns null', () => {
        const result = component.parseDateForPicker('');
        expect(result).toBeNull();
      });
    });

    describe('formatDate', () => {
      it('valid returns DD-MMM-YYYY uppercase', () => {
        const result = component.formatDate('2026-08-10');
        expect(result).toBe('10-AUG-2026');
      });

      it('null returns empty', () => {
        const result = component.formatDate(null);
        expect(result).toBe('');
      });

      it('empty returns empty', () => {
        const result = component.formatDate('');
        expect(result).toBe('');
      });
    });
  });

  // ============================================================================
  // 21. Chapter Change (8)
  // ============================================================================
  describe('Chapter Change', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.searchText = 'test';
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();
      component.rows[0].bandName = 'Modified';
      component.isDirty = true;

      apiServiceSpy.getTests.calls.reset();
    }));

    it('should reset searchText', fakeAsync(() => {
      chapterChangedSubject.next();
      tick();

      expect(component.searchText).toBe('');
    }));

    it('should reset selectedTest', fakeAsync(() => {
      const testsSubject = new Subject<MofTestDto[]>();
      apiServiceSpy.getTests.and.returnValue(testsSubject);

      chapterChangedSubject.next();

      expect(component.selectedTest).toBeNull();

      testsSubject.next(mockTests);
      testsSubject.complete();
      tick();
    }));

    it('should reset selectedTestType', fakeAsync(() => {
      chapterChangedSubject.next();
      tick();

      expect(component.selectedTestType).toBeNull();
    }));

    it('should reset testTypes', fakeAsync(() => {
      const testsSubject = new Subject<MofTestDto[]>();
      apiServiceSpy.getTests.and.returnValue(testsSubject);

      chapterChangedSubject.next();

      expect(component.testTypes.length).toBe(0);

      testsSubject.next(mockTests);
      testsSubject.complete();
      tick();
    }));

    it('should reset rows', fakeAsync(() => {
      chapterChangedSubject.next();
      tick();

      expect(component.rows.length).toBe(0);
    }));

    it('should reset originalRows', fakeAsync(() => {
      chapterChangedSubject.next();
      tick();

      expect(component.originalRows.length).toBe(0);
    }));

    it('should reset isDirty', fakeAsync(() => {
      chapterChangedSubject.next();
      tick();

      expect(component.isDirty).toBe(false);
    }));

    it('should call loadTests', fakeAsync(() => {
      chapterChangedSubject.next();
      tick();

      expect(apiServiceSpy.getTests).toHaveBeenCalled();
    }));
  });

  // ============================================================================
  // 22. Keyboard Navigation (4)
  // ============================================================================
  describe('Keyboard Navigation', () => {
    it('focusNextListItem should focus next option sibling', () => {
      const container = document.createElement('ul');
      const current = document.createElement('li');
      current.setAttribute('role', 'option');
      const next = document.createElement('li');
      next.setAttribute('role', 'option');
      container.appendChild(current);
      container.appendChild(next);
      spyOn(next, 'focus');

      component.focusNextListItem({ target: current } as any);

      expect(next.focus).toHaveBeenCalled();
    });

    it('focusNextListItem should not focus non-option element', () => {
      const container = document.createElement('ul');
      const current = document.createElement('li');
      current.setAttribute('role', 'option');
      const next = document.createElement('li');
      container.appendChild(current);
      container.appendChild(next);
      spyOn(next, 'focus');

      component.focusNextListItem({ target: current } as any);

      expect(next.focus).not.toHaveBeenCalled();
    });

    it('focusPreviousListItem should focus prev option sibling', () => {
      const container = document.createElement('ul');
      const prev = document.createElement('li');
      prev.setAttribute('role', 'option');
      const current = document.createElement('li');
      current.setAttribute('role', 'option');
      container.appendChild(prev);
      container.appendChild(current);
      spyOn(prev, 'focus');

      component.focusPreviousListItem({ target: current } as any);

      expect(prev.focus).toHaveBeenCalled();
    });

    it('focusPreviousListItem should not focus non-option element', () => {
      const container = document.createElement('ul');
      const prev = document.createElement('li');
      const current = document.createElement('li');
      current.setAttribute('role', 'option');
      container.appendChild(prev);
      container.appendChild(current);
      spyOn(prev, 'focus');

      component.focusPreviousListItem({ target: current } as any);

      expect(prev.focus).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // 23. LiveAnnouncer (6)
  // ============================================================================
  describe('LiveAnnouncer', () => {
    beforeEach(fakeAsync(() => {
      liveAnnouncerSpy.announce.calls.reset();
    }));

    it('should announce loading tests', fakeAsync(() => {
      fixture.detectChanges();

      expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Loading tests');
      tick();
    }));

    it('should announce tests loaded count', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith(
        jasmine.stringContaining('3 tests loaded')
      );
    }));

    it('should announce loading bands', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      liveAnnouncerSpy.announce.calls.reset();

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();

      expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith('Loading bands');

      tick();
    }));

    it('should announce bands loaded count', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      liveAnnouncerSpy.announce.calls.reset();

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();

      expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith(
        jasmine.stringContaining('2 bands loaded')
      );
    }));

    it('should announce save success', async () => {
      fixture.detectChanges();
      await fixture.whenStable();

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();

      liveAnnouncerSpy.announce.calls.reset();

      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith(
        jasmine.stringContaining('saved successfully')
      );
    });

    it('should announce save failure', async () => {
      apiServiceSpy.createBand.and.returnValue(throwError(() => new Error('Save failed')));

      fixture.detectChanges();
      await fixture.whenStable();

      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();

      component.addNewBand();
      component.rows[component.rows.length - 1].bandName = 'New Band';
      component.rows[component.rows.length - 1].effDate = '2026-08-10';

      liveAnnouncerSpy.announce.calls.reset();

      component.save();
      await new Promise(r => setTimeout(r, 0));

      expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith(
        jasmine.stringContaining('failed')
      );
    });
  });

  // ============================================================================
  // 24. onRowChange (2)
  // ============================================================================
  describe('onRowChange', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.selectedTest = { testId: 'TEST1', description: 'First Test' };
      component.selectedTestType = 'TYPE1';
      component.onTestTypeChange();
      tick();
      component.isDirty = false;
    }));

    it('should set isDirty true', () => {
      component.onRowChange();
      expect(component.isDirty).toBe(true);
    });

    it('should create new rows reference', () => {
      const originalRows = component.rows;
      component.onRowChange();

      expect(component.rows).not.toBe(originalRows);
    });
  });

  // ============================================================================
  // 25. minDate getter (2)
  // ============================================================================
  describe('minDate getter', () => {
    it('should return moment object', () => {
      const result = component.minDate;
      expect(moment.isMoment(result)).toBe(true);
    });

    it('should call DateFieldValidationUtility.getMinDate', () => {
      getMinDateSpy.calls.reset();

      const result = component.minDate;

      expect(getMinDateSpy).toHaveBeenCalledWith('America/New_York');
    });
  });
});
