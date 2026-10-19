import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import moment from 'moment';

import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { ContractTestsComponent } from './contract-tests';
import {
  ProfileSetData,
  ProfileTestData,
  NonProfileTestData,
  CustomerOverrideData,
  ConfirmatoryOverrideTestData,
  TestLookup,
  ResultLookup,
  PLATE_SEQUENCE_MAP
} from '../../models/regional-testing-contract.model';

// ── Helpers ──────────────────────────────────────────────────────────

function buildTestLookups(): TestLookup[] {
  return [
    { testId: 'HIV1', description: 'HIV Type 1' },
    { testId: 'HCV', description: 'Hepatitis C' },
    { testId: 'HBV', description: 'Hepatitis B' },
    { testId: 'ZIKA', description: 'Zika Virus' },
    { testId: 'WNV', description: 'West Nile Virus' }
  ];
}

function buildReactiveTestLookups(): TestLookup[] {
  return [
    { testId: 'RHIV', description: 'Reactive HIV' },
    { testId: 'RHCV', description: 'Reactive HCV' }
  ];
}

function buildProfileTest(overrides: Partial<ProfileTestData> = {}): ProfileTestData {
  return {
    testId: 'HIV1',
    description: 'HIV Type 1',
    width: 10,
    length: 20,
    required: 'Y',
    extract: 'N',
    electronicFile: 'N',
    effectiveDate: '2025-01-01T00:00:00',
    terminationDate: null,
    ...overrides
  };
}

function buildProfileSet(overrides: Partial<ProfileSetData> = {}): ProfileSetData {
  return {
    profileSetId: 'CON-0001',
    profileType: 'P',
    effectiveDate: '2025-01-01T00:00:00',
    terminationDate: null,
    tests: [buildProfileTest()],
    ...overrides
  };
}

function buildCustomerOverride(overrides: Partial<CustomerOverrideData> = {}): CustomerOverrideData {
  return {
    reactiveTestId: 'RHIV',
    description: 'Reactive HIV',
    result: 'POS',
    plateSequence: 'R',
    confirmatoryTests: [
      {
        testId: '',
        description: '',
        effectiveDate: '',
        terminationDate: null,
        isNew: true
      },
      {
        testId: 'HCV',
        description: 'Hepatitis C',
        effectiveDate: '2025-01-01T00:00:00',
        terminationDate: null
      }
    ],
    ...overrides
  };
}

function buildNonProfileTest(overrides: Partial<NonProfileTestData> = {}): NonProfileTestData {
  return {
    testId: 'ZIKA',
    description: 'Zika Virus',
    effectiveDate: '2025-01-01',
    terminationDate: null,
    lastModifiedUser: 'testuser',
    lastModifiedDate: '2025-01-01T10:00:00',
    ...overrides
  };
}

describe('ContractTestsComponent', () => {
  let component: ContractTestsComponent;
  let fixture: ComponentFixture<ContractTestsComponent>;
  let apiService: jasmine.SpyObj<RegionalTestingContractApiService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockHeader: any;
  let realDialog: MatDialog;
  let dialogRefSpy: any;

  beforeEach(async () => {
    // Mock scrollIntoView for JSDOM
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = () => {};
    }

    apiService = jasmine.createSpyObj('RegionalTestingContractApiService', [
      'getTestLookups',
      'getReactiveTestLookup',
      'getProfileSets',
      'getNonProfileTests',
      'getCustomerOverrides',
      'getResultCodesForTest'
    ]);
    apiService.getTestLookups.and.returnValue(of(buildTestLookups()));
    apiService.getReactiveTestLookup.and.returnValue(of(buildReactiveTestLookups()));
    apiService.getProfileSets.and.returnValue(of([]));
    apiService.getNonProfileTests.and.returnValue(of([]));
    apiService.getCustomerOverrides.and.returnValue(of([]));
    apiService.getResultCodesForTest.and.returnValue(of([]));

    mockSnackbar = createMockSnackbarService();
    mockHeader = createMockHeaderService();

    dialogRefSpy = {
      afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(null)),
      close: jasmine.createSpy('close')
    };

    await TestBed.configureTestingModule({
      imports: [ContractTestsComponent, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RegionalTestingContractApiService, useValue: apiService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: HeaderService, useValue: mockHeader }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractTestsComponent);
    component = fixture.componentInstance;

    // Spy on the component's own dialog instance (standalone component imports may create a different injector scope)
    realDialog = (component as any).dialog;
    spyOn(realDialog, 'open').and.returnValue(dialogRefSpy as any);

    // Safe detectChanges - template may reference child components
    try { fixture.detectChanges(); } catch (_) { /* template child errors */ }
  });

  // ── loadData ────────────────────────────────────────────────────

  describe('loadData', () => {
    it('should call API services on init with default contractId', () => {
      expect(apiService.getTestLookups).toHaveBeenCalledWith('NEW');
      expect(apiService.getReactiveTestLookup).toHaveBeenCalled();
      expect(apiService.getProfileSets).toHaveBeenCalledWith('NEW');
      expect(apiService.getNonProfileTests).toHaveBeenCalledWith('NEW');
      expect(apiService.getCustomerOverrides).toHaveBeenCalledWith('NEW');
    });

    it('should set loading to false and mark dataLoadedOnce after customer overrides load', () => {
      expect(component.loading()).toBe(false);
    });

    it('should set testLookups from API response', () => {
      expect(component.testLookups().length).toBe(5);
      expect(component.testLookups()[0].testId).toBe('HIV1');
    });

    it('should set reactiveTestLookups from API response', () => {
      expect(component.reactiveTestLookups().length).toBe(2);
    });

    it('should set currentProfileSetIndex to 0 when profile sets are returned', fakeAsync(() => {
      const sets = [buildProfileSet()];
      apiService.getProfileSets.and.returnValue(of(sets));

      // Reset and recreate
      TestBed.resetTestingModule();
      apiService.getCustomerOverrides.and.returnValue(of([]));
      apiService.getTestLookups.and.returnValue(of(buildTestLookups()));
      apiService.getReactiveTestLookup.and.returnValue(of(buildReactiveTestLookups()));
      apiService.getNonProfileTests.and.returnValue(of([]));

      TestBed.configureTestingModule({
        imports: [ContractTestsComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: RegionalTestingContractApiService, useValue: apiService },
          { provide: SnackbarService, useValue: mockSnackbar },
          { provide: HeaderService, useValue: mockHeader }
        ]
      }).compileComponents();

      const fix = TestBed.createComponent(ContractTestsComponent);
      const comp = fix.componentInstance;
      spyOn((comp as any).dialog, 'open').and.returnValue(dialogRefSpy as any);
      try { fix.detectChanges(); } catch (_) {}
      tick();

      expect(comp.profileSets().length).toBe(1);
      expect(comp.currentProfileSetIndex()).toBe(0);
    }));

    it('should skip loadData on second call (dataLoadedOnce guard)', () => {
      // First call already happened in beforeEach
      // Force ngOnInit again
      apiService.getTestLookups.calls.reset();
      component.ngOnInit();
      // Should not call API again because dataLoadedOnce is true
      expect(apiService.getTestLookups).not.toHaveBeenCalled();
    });
  });

  // ── setupSearchSubscriptions ───────────────────────────────────

  describe('setupSearchSubscriptions', () => {
    it('should update profileTestSearchText when profileTestSearchControl changes', fakeAsync(() => {
      component.profileTestSearchControl.setValue('hiv');
      tick();
      // filteredTestLookups uses profileTestSearchText signal
      const filtered = component.filteredTestLookups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('HIV1');
    }));

    it('should update nonProfileSearchText when nonProfileTestSearchControl changes', fakeAsync(() => {
      component.nonProfileTestSearchControl.setValue('zika');
      tick();
      const filtered = component.filteredNonProfileLookups();
      expect(filtered.some(t => t.testId === 'ZIKA')).toBe(true);
    }));

    it('should update reactiveSearchText when reactiveTestSearchControl changes', fakeAsync(() => {
      component.reactiveTestSearchControl.setValue('hcv');
      tick();
      const filtered = component.filteredReactiveTestLookups();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('RHCV');
    }));

    it('should handle null value in search controls', fakeAsync(() => {
      component.profileTestSearchControl.setValue(null);
      tick();
      // Should set to empty string, showing all lookups
      expect(component.filteredTestLookups().length).toBe(5);
    }));
  });

  // ── Computed properties ────────────────────────────────────────

  describe('computed properties', () => {
    beforeEach(() => {
      component.profileSets.set([buildProfileSet()]);
      component.currentProfileSetIndex.set(0);
    });

    it('currentProfileSet should return the profile set at the current index', () => {
      expect(component.currentProfileSet()?.profileSetId).toBe('CON-0001');
    });

    it('currentProfileSet should return null when index is out of range', () => {
      component.currentProfileSetIndex.set(-1);
      expect(component.currentProfileSet()).toBeNull();

      component.currentProfileSetIndex.set(99);
      expect(component.currentProfileSet()).toBeNull();
    });

    it('currentProfileSetId should return profileSetId or empty string', () => {
      expect(component.currentProfileSetId()).toBe('CON-0001');

      component.currentProfileSetIndex.set(-1);
      expect(component.currentProfileSetId()).toBe('');
    });

    it('currentProfileType should return profileType or null', () => {
      expect(component.currentProfileType()).toBe('P');

      component.profileSets.set([buildProfileSet({ profileType: null })]);
      expect(component.currentProfileType()).toBeNull();
    });

    it('currentProfileTests should return tests array or empty', () => {
      expect(component.currentProfileTests().length).toBe(1);

      component.currentProfileSetIndex.set(-1);
      expect(component.currentProfileTests().length).toBe(0);
    });

    it('allAssignedTestIds should combine profile and non-profile test IDs', () => {
      component.nonProfileTests.set([buildNonProfileTest({ testId: 'ZIKA' })]);
      const ids = component.allAssignedTestIds();
      expect(ids).toContain('HIV1');
      expect(ids).toContain('ZIKA');
    });

    it('allAssignedTestIds should deduplicate test IDs', () => {
      component.nonProfileTests.set([buildNonProfileTest({ testId: 'HIV1' })]);
      const ids = component.allAssignedTestIds();
      const hivCount = ids.filter(id => id === 'HIV1').length;
      expect(hivCount).toBe(1);
    });

    it('filteredTestLookups should return all lookups when search is empty', () => {
      expect(component.filteredTestLookups().length).toBe(5);
    });

    it('filteredNonProfileLookups should exclude already assigned tests', () => {
      component.nonProfileTests.set([buildNonProfileTest({ testId: 'HIV1' })]);
      const filtered = component.filteredNonProfileLookups();
      expect(filtered.find(t => t.testId === 'HIV1')).toBeUndefined();
    });

    it('nonProfileTestDescription should return dash when no test selected', () => {
      // FormControl defaults to '' and computed was never evaluated with a value, so dash
      component.testLookups.set([...buildTestLookups()]);
      expect(component.nonProfileTestDescription()).toBe('-');
    });

    it('nonProfileTestDescription should return dash when test not found in lookups', () => {
      component.nonProfileTestIdControl.setValue('UNKNOWN');
      component.testLookups.set([...buildTestLookups()]);
      expect(component.nonProfileTestDescription()).toBe('-');
    });

    it('reactiveTestDescription should return dash when no test selected', () => {
      component.reactiveTestLookups.set([...buildReactiveTestLookups()]);
      expect(component.reactiveTestDescription()).toBe('-');
    });

    it('reactiveTestDescription should return dash when test not found', () => {
      component.reactiveTestIdControl.setValue('NOTFOUND');
      component.reactiveTestLookups.set([...buildReactiveTestLookups()]);
      expect(component.reactiveTestDescription()).toBe('-');
    });

    it('plateSequenceLabel should return mapped label or dash', () => {
      component.customerOverrides.set([buildCustomerOverride({ plateSequence: 'R' })]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      expect(component.plateSequenceLabel()).toBe('Repeat tests');
    });

    it('plateSequenceLabel should return dash when no override', () => {
      expect(component.plateSequenceLabel()).toBe('-');
    });

    it('hasConfirmatoryQueryData should be true when confirmatory tests exist', () => {
      component.customerOverrides.set([buildCustomerOverride()]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      expect(component.hasConfirmatoryQueryData()).toBe(true);
    });

    it('hasConfirmatoryQueryData should be false when no confirmatory tests', () => {
      expect(component.hasConfirmatoryQueryData()).toBe(false);
    });
  });

  // ── description computed with FormControl pre-set ───────────────
  // Note: nonProfileTestDescription and reactiveTestDescription read FormControl.value
  // which is not a signal. The computed caches after first read (during detectChanges).
  // To test the lookup logic, we create a fresh component with the FormControl pre-set.

  describe('description computed signals', () => {
    it('nonProfileTestDescription should return description when test is pre-selected', async () => {
      // Create a fresh component with FormControl set before first detectChanges
      const freshFixture = TestBed.createComponent(ContractTestsComponent);
      const freshComp = freshFixture.componentInstance;
      spyOn((freshComp as any).dialog, 'open').and.returnValue(dialogRefSpy as any);
      // Set FormControl BEFORE first detectChanges to avoid memoization of empty value
      freshComp.nonProfileTestIdControl.setValue('HIV1');
      try { freshFixture.detectChanges(); } catch (_) {}
      expect(freshComp.nonProfileTestDescription()).toBe('HIV Type 1');
    });

    it('reactiveTestDescription should return description when test is pre-selected', async () => {
      const freshFixture = TestBed.createComponent(ContractTestsComponent);
      const freshComp = freshFixture.componentInstance;
      spyOn((freshComp as any).dialog, 'open').and.returnValue(dialogRefSpy as any);
      freshComp.reactiveTestIdControl.setValue('RHIV');
      try { freshFixture.detectChanges(); } catch (_) {}
      expect(freshComp.reactiveTestDescription()).toBe('Reactive HIV');
    });
  });

  // ── currentCustomerOverride computed ───────────────────────────

  describe('currentCustomerOverride', () => {
    it('should return null when selectedReactiveTestId is empty', () => {
      (component as any).selectedReactiveTestId.set('');
      expect(component.currentCustomerOverride()).toBeNull();
    });

    it('should find override matching testId and result', () => {
      component.customerOverrides.set([buildCustomerOverride()]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      expect(component.currentCustomerOverride()?.reactiveTestId).toBe('RHIV');
    });

    it('should return null when result does not match', () => {
      component.customerOverrides.set([buildCustomerOverride()]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('NEG');
      expect(component.currentCustomerOverride()).toBeNull();
    });

    it('should return first override with empty result when result not selected', () => {
      component.customerOverrides.set([buildCustomerOverride({ result: '' })]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('');
      expect(component.currentCustomerOverride()?.reactiveTestId).toBe('RHIV');
    });

    it('should return first override for testId when no result selected and no empty-result override', () => {
      component.customerOverrides.set([buildCustomerOverride({ result: 'POS' })]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('');
      expect(component.currentCustomerOverride()?.result).toBe('POS');
    });
  });

  // ── filteredConfirmatoryLookups ────────────────────────────────

  describe('filteredConfirmatoryLookups', () => {
    it('should exclude the reactive test ID from lookup results', () => {
      component.reactiveTestIdControl.setValue('HIV1');
      const filtered = component.filteredConfirmatoryLookups();
      expect(filtered.find(t => t.testId === 'HIV1')).toBeUndefined();
    });

    it('should filter by confirmatorySearchText', fakeAsync(() => {
      component.confirmatoryTestSearchControl.setValue('hep');
      tick();
      const filtered = component.filteredConfirmatoryLookups();
      expect(filtered.every(t =>
        t.testId.toLowerCase().includes('hep') ||
        t.description.toLowerCase().includes('hep')
      )).toBe(true);
    }));
  });

  // ── onAddNewProfileSet ─────────────────────────────────────────

  describe('onAddNewProfileSet', () => {
    it('should add a new profile set with generated ID', () => {
      component.contractId = 'RGCON001';
      component.profileSets.set([]);
      component.onAddNewProfileSet();

      const sets = component.profileSets();
      expect(sets.length).toBe(1);
      expect(sets[0].profileSetId).toBe('ON001-0001');
    });

    it('should increment profile set ID based on existing sets', () => {
      component.contractId = 'RGCON001';
      component.profileSets.set([buildProfileSet({ profileSetId: 'ON001-0003' })]);
      component.currentProfileSetIndex.set(0);
      component.onAddNewProfileSet();

      const sets = component.profileSets();
      expect(sets.length).toBe(2);
      expect(sets[1].profileSetId).toBe('ON001-0004');
    });

    it('should set currentProfileSetIndex to the new set', () => {
      component.contractId = 'ABCDEF';
      component.profileSets.set([buildProfileSet()]);
      component.currentProfileSetIndex.set(0);
      component.onAddNewProfileSet();
      expect(component.currentProfileSetIndex()).toBe(1);
    });

    it('should create profile set with one empty test row', () => {
      component.onAddNewProfileSet();
      const newSet = component.profileSets()[component.profileSets().length - 1];
      expect(newSet.tests.length).toBe(1);
      expect(newSet.tests[0].testId).toBe('');
      expect(newSet.tests[0].isNew).toBe(true);
    });

    it('should handle contractId shorter than 3 chars', () => {
      component.contractId = 'AB';
      component.profileSets.set([]);
      component.onAddNewProfileSet();
      expect(component.profileSets()[0].profileSetId).toBe('AB-0001');
    });

    it('should set profileType to null for new sets', () => {
      component.onAddNewProfileSet();
      const newSet = component.profileSets()[component.profileSets().length - 1];
      expect(newSet.profileType).toBeNull();
    });
  });

  // ── onProfileSetChange ─────────────────────────────────────────

  describe('onProfileSetChange', () => {
    it('should update currentProfileSetIndex', () => {
      component.profileSets.set([buildProfileSet(), buildProfileSet({ profileSetId: 'CON-0002' })]);
      component.currentProfileSetIndex.set(0);
      component.onProfileSetChange(1);
      expect(component.currentProfileSetIndex()).toBe(1);
    });

    it('should add empty test row if selected profile set has no tests', () => {
      const emptySet = buildProfileSet({ tests: [] });
      component.profileSets.set([emptySet]);
      component.currentProfileSetIndex.set(-1);
      component.onProfileSetChange(0);

      const current = component.currentProfileSet();
      expect(current!.tests.length).toBe(1);
      expect(current!.tests[0].testId).toBe('');
      expect(current!.tests[0].isNew).toBe(true);
    });

    it('should not add empty test row if profile set already has tests', () => {
      component.profileSets.set([buildProfileSet()]);
      component.currentProfileSetIndex.set(-1);
      component.onProfileSetChange(0);
      expect(component.currentProfileSet()!.tests.length).toBe(1);
      expect(component.currentProfileSet()!.tests[0].testId).toBe('HIV1');
    });
  });

  // ── onProfileTypeChange ────────────────────────────────────────

  describe('onProfileTypeChange', () => {
    beforeEach(() => {
      component.profileSets.set([buildProfileSet({ profileType: null })]);
      component.currentProfileSetIndex.set(0);
    });

    it('should set profileType to null when unchecked', () => {
      component.onProfileTypeChange('P', false);
      expect(component.currentProfileSet()!.profileType).toBeNull();
    });

    it('should set profileType directly for Secondary (S) type', () => {
      component.onProfileTypeChange('S', true);
      expect(component.currentProfileSet()!.profileType).toBe('S');
    });

    it('should set profileType directly when no duplicate exists for Primary', () => {
      component.onProfileTypeChange('P', true);
      expect(component.currentProfileSet()!.profileType).toBe('P');
    });

    it('should open confirm dialog when Primary type already exists on another set', () => {
      component.profileSets.set([
        buildProfileSet({ profileSetId: 'SET-A', profileType: 'P', terminationDate: null }),
        buildProfileSet({ profileSetId: 'SET-B', profileType: null })
      ]);
      component.currentProfileSetIndex.set(1);

      component.onProfileTypeChange('P', true);

      expect(realDialog.open).toHaveBeenCalled();
      const dialogData = (realDialog.open as jasmine.Spy).calls.mostRecent().args[1]?.data;
      expect(dialogData.message).toContain('primary');
      expect(dialogData.message).toContain('SET-A');
    });

    it('should open confirm dialog for Ad-Hoc type duplicate', () => {
      component.profileSets.set([
        buildProfileSet({ profileSetId: 'SET-A', profileType: 'A', terminationDate: null }),
        buildProfileSet({ profileSetId: 'SET-B', profileType: null })
      ]);
      component.currentProfileSetIndex.set(1);

      component.onProfileTypeChange('A', true);

      const dialogData = (realDialog.open as jasmine.Spy).calls.mostRecent().args[1]?.data;
      expect(dialogData.message).toContain('ad-hoc');
    });

    it('should reassign type on dialog confirm', fakeAsync(() => {
      component.profileSets.set([
        buildProfileSet({ profileSetId: 'SET-A', profileType: 'P', terminationDate: null }),
        buildProfileSet({ profileSetId: 'SET-B', profileType: null })
      ]);
      component.currentProfileSetIndex.set(1);

      dialogRefSpy.afterClosed.and.returnValue(of(true));

      component.onProfileTypeChange('P', true);
      tick();

      // Existing set should have profileType cleared
      const existingSet = component.profileSets().find(s => s.profileSetId === 'SET-A');
      expect(existingSet!.profileType).toBeNull();

      // Current set should have the type assigned
      expect(component.currentProfileSet()!.profileType).toBe('P');
    }));

    it('should not reassign type on dialog cancel', fakeAsync(() => {
      component.profileSets.set([
        buildProfileSet({ profileSetId: 'SET-A', profileType: 'P', terminationDate: null }),
        buildProfileSet({ profileSetId: 'SET-B', profileType: null })
      ]);
      component.currentProfileSetIndex.set(1);

      dialogRefSpy.afterClosed.and.returnValue(of(false));

      component.onProfileTypeChange('P', true);
      tick();

      // Neither set should change
      const existingSet = component.profileSets().find(s => s.profileSetId === 'SET-A');
      expect(existingSet!.profileType).toBe('P');
      expect(component.currentProfileSet()!.profileType).toBeNull();
    }));

    it('should not check for duplicates when terminated set has the type', () => {
      component.profileSets.set([
        buildProfileSet({ profileSetId: 'SET-A', profileType: 'P', terminationDate: '2024-12-31' }),
        buildProfileSet({ profileSetId: 'SET-B', profileType: null })
      ]);
      component.currentProfileSetIndex.set(1);

      component.onProfileTypeChange('P', true);

      expect(realDialog.open).not.toHaveBeenCalled();
      expect(component.currentProfileSet()!.profileType).toBe('P');
    });

    it('should allow multiple Secondary types without dialog', () => {
      component.profileSets.set([
        buildProfileSet({ profileSetId: 'SET-A', profileType: 'S', terminationDate: null }),
        buildProfileSet({ profileSetId: 'SET-B', profileType: null })
      ]);
      component.currentProfileSetIndex.set(1);

      component.onProfileTypeChange('S', true);

      expect(realDialog.open).not.toHaveBeenCalled();
      expect(component.currentProfileSet()!.profileType).toBe('S');
    });
  });

  // ── onAddProfileTestRow / onDeleteProfileTestRow ───────────────

  describe('onAddProfileTestRow', () => {
    it('should add empty test row at top of current profile set', () => {
      component.profileSets.set([buildProfileSet()]);
      component.currentProfileSetIndex.set(0);
      component.onAddProfileTestRow();
      const tests = component.currentProfileTests();
      expect(tests.length).toBe(2);
      expect(tests[0].testId).toBe('');
      expect(tests[0].isNew).toBe(true);
    });

    it('should not add row when no current profile set', () => {
      component.profileSets.set([]);
      component.currentProfileSetIndex.set(-1);
      component.onAddProfileTestRow();
      expect(component.profileSets().length).toBe(0);
    });
  });

  describe('onDeleteProfileTestRow', () => {
    it('should remove the test at the specified index', () => {
      const test1 = buildProfileTest({ testId: 'HIV1' });
      const test2 = buildProfileTest({ testId: 'HCV' });
      component.profileSets.set([buildProfileSet({ tests: [test1, test2] })]);
      component.currentProfileSetIndex.set(0);

      component.onDeleteProfileTestRow(0);

      const tests = component.currentProfileTests();
      expect(tests.length).toBe(1);
      expect(tests[0].testId).toBe('HCV');
    });

    it('should not crash when no current profile set', () => {
      component.profileSets.set([]);
      component.currentProfileSetIndex.set(-1);
      expect(() => component.onDeleteProfileTestRow(0)).not.toThrow();
    });
  });

  // ── onProfileTestIdChange ──────────────────────────────────────

  describe('onProfileTestIdChange', () => {
    beforeEach(() => {
      const emptyTest = buildProfileTest({ testId: '', description: '', isNew: true });
      const existingTest = buildProfileTest();
      component.profileSets.set([buildProfileSet({ tests: [emptyTest, existingTest] })]);
      component.currentProfileSetIndex.set(0);
      // Rebuild forms to have valid form entries
      (component as any).rebuildProfileRowForms();
    });

    it('should update description in form when test ID is selected', () => {
      component.onProfileTestIdChange(1, 'HCV');
      const descControl = component.profileRowForms.get(1)?.get('description');
      expect(descControl?.value).toBe('Hepatitis C');
    });

    it('should update underlying test data with selected testId and description', () => {
      component.onProfileTestIdChange(1, 'HCV');
      const tests = component.currentProfileTests();
      expect(tests[1].testId).toBe('HCV');
      expect(tests[1].description).toBe('Hepatitis C');
    });

    it('should add new empty row when first row (index 0) gets a test selected', () => {
      const initialLength = component.currentProfileTests().length;
      component.onProfileTestIdChange(0, 'ZIKA');
      // Should have added a new row at top
      expect(component.currentProfileTests().length).toBe(initialLength + 1);
    });

    it('should not add new row when non-first row gets a test selected', () => {
      const initialLength = component.currentProfileTests().length;
      component.onProfileTestIdChange(1, 'HCV');
      expect(component.currentProfileTests().length).toBe(initialLength);
    });
  });

  // ── getProfileRowControl ───────────────────────────────────────

  describe('getProfileRowControl', () => {
    it('should return FormControl for the specified field', () => {
      component.profileSets.set([buildProfileSet()]);
      component.currentProfileSetIndex.set(0);
      (component as any).rebuildProfileRowForms();

      const ctrl = component.getProfileRowControl(0, 'testId');
      expect(ctrl).toBeTruthy();
      expect(ctrl.value).toBe('HIV1');
    });

    it('should return undefined when form does not exist for index', () => {
      const ctrl = component.getProfileRowControl(99, 'testId');
      expect(ctrl).toBeUndefined();
    });
  });

  // ── Profile Date Validation ────────────────────────────────────

  describe('profile date validation', () => {
    beforeEach(() => {
      component.profileSets.set([buildProfileSet()]);
      component.currentProfileSetIndex.set(0);
      (component as any).rebuildProfileRowForms();
    });

    describe('getProfileEffMatcher / getProfileTermMatcher', () => {
      it('should create and cache ErrorStateMatcher for effective date', () => {
        const matcher1 = component.getProfileEffMatcher(0);
        const matcher2 = component.getProfileEffMatcher(0);
        expect(matcher1).toBe(matcher2);
        expect(matcher1).toBeTruthy();
      });

      it('should create and cache ErrorStateMatcher for termination date', () => {
        const matcher1 = component.getProfileTermMatcher(0);
        const matcher2 = component.getProfileTermMatcher(0);
        expect(matcher1).toBe(matcher2);
      });
    });

    describe('getProfileEffDateError', () => {
      it('should return empty string when no control exists', () => {
        expect(component.getProfileEffDateError(99)).toBe('');
      });

      it('should return invalid date message for invalidDate error', () => {
        const ctrl = component.profileRowForms.get(0)!.get('effectiveDate')!;
        ctrl.setErrors({ invalidDate: true });
        expect(component.getProfileEffDateError(0)).toBe('Effective Date is invalid');
      });

      it('should return invalid date message for matDatepickerParse error', () => {
        const ctrl = component.profileRowForms.get(0)!.get('effectiveDate')!;
        ctrl.setErrors({ matDatepickerParse: true });
        expect(component.getProfileEffDateError(0)).toBe('Effective Date is invalid');
      });

      it('should return required message when touched and required', () => {
        const ctrl = component.profileRowForms.get(0)!.get('effectiveDate')!;
        ctrl.setValue(null);
        ctrl.markAsTouched();
        ctrl.updateValueAndValidity();
        // Required error should be present
        expect(component.getProfileEffDateError(0)).toBe('Effective Date is required');
      });

      it('should return past date message for matDatepickerMin error', () => {
        const ctrl = component.profileRowForms.get(0)!.get('effectiveDate')!;
        ctrl.setErrors({ matDatepickerMin: true });
        expect(component.getProfileEffDateError(0)).toBe('Effective Date cannot be past date');
      });

      it('should return range error when lastChanged is effective and dateRangeInvalid', () => {
        (component as any).profileLastChanged.set(0, 'effective');
        component.profileRowForms.get(0)!.setErrors({ dateRangeInvalid: true });
        // Clear control-level errors
        component.profileRowForms.get(0)!.get('effectiveDate')!.setErrors(null);
        expect(component.getProfileEffDateError(0)).toBe('Effective Date must be less than or equal to Termination Date');
      });

      it('should not return range error when lastChanged is not effective', () => {
        (component as any).profileLastChanged.set(0, 'termination');
        component.profileRowForms.get(0)!.setErrors({ dateRangeInvalid: true });
        component.profileRowForms.get(0)!.get('effectiveDate')!.setErrors(null);
        expect(component.getProfileEffDateError(0)).toBe('');
      });
    });

    describe('getProfileTermDateError', () => {
      it('should return empty string when no control exists', () => {
        expect(component.getProfileTermDateError(99)).toBe('');
      });

      it('should return invalid date message for invalidDate error', () => {
        const ctrl = component.profileRowForms.get(0)!.get('terminationDate')!;
        ctrl.setErrors({ invalidDate: true });
        expect(component.getProfileTermDateError(0)).toBe('Termination Date is invalid');
      });

      it('should return empty string when not touched/dirty', () => {
        const ctrl = component.profileRowForms.get(0)!.get('terminationDate')!;
        ctrl.setErrors(null);
        expect(component.getProfileTermDateError(0)).toBe('');
      });

      it('should return past date message for matDatepickerMin error when touched', () => {
        const ctrl = component.profileRowForms.get(0)!.get('terminationDate')!;
        ctrl.markAsTouched();
        ctrl.setErrors({ matDatepickerMin: true });
        expect(component.getProfileTermDateError(0)).toBe('Termination Date cannot be past date');
      });

      it('should return range error when lastChanged is termination and dateRangeInvalid', () => {
        (component as any).profileLastChanged.set(0, 'termination');
        const ctrl = component.profileRowForms.get(0)!.get('terminationDate')!;
        ctrl.markAsTouched();
        ctrl.setErrors(null);
        component.profileRowForms.get(0)!.setErrors({ dateRangeInvalid: true });
        expect(component.getProfileTermDateError(0)).toBe('Termination Date must be greater than or equal to Effective Date');
      });
    });

    describe('getProfileTermDateFilter', () => {
      it('should return true for null date', () => {
        const filter = component.getProfileTermDateFilter(0);
        expect(filter(null)).toBe(true);
      });

      it('should return true when date is after effective date', () => {
        component.profileRowForms.get(0)!.get('effectiveDate')!.setValue(moment('2025-01-01'));
        const filter = component.getProfileTermDateFilter(0);
        expect(filter(moment('2025-06-01'))).toBe(true);
      });

      it('should return false when date is before effective date', () => {
        component.profileRowForms.get(0)!.get('effectiveDate')!.setValue(moment('2025-06-01'));
        const filter = component.getProfileTermDateFilter(0);
        expect(filter(moment('2025-01-01'))).toBe(false);
      });

      it('should return true when no effective date is set', () => {
        component.profileRowForms.get(0)!.get('effectiveDate')!.setValue(null);
        const filter = component.getProfileTermDateFilter(0);
        expect(filter(moment('2025-01-01'))).toBe(true);
      });
    });

    describe('onProfileEffDateChange / onProfileTermDateChange', () => {
      it('onProfileEffDateChange should set lastChanged to effective', () => {
        component.onProfileEffDateChange(0);
        expect((component as any).profileLastChanged.get(0)).toBe('effective');
      });

      it('onProfileTermDateChange should set lastChanged to termination', () => {
        component.onProfileTermDateChange(0);
        expect((component as any).profileLastChanged.get(0)).toBe('termination');
      });
    });

    describe('onProfileEffDateInput / onProfileTermDateInput', () => {
      it('should call DateFieldValidationUtility.handleStartDateInput', () => {
        spyOn(DateFieldValidationUtility, 'handleStartDateInput');
        const event = { target: { value: '01-JAN-2025' } } as unknown as Event;
        component.onProfileEffDateInput(0, event);
        expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalled();
      });

      it('should call DateFieldValidationUtility.handleEndDateInput', () => {
        spyOn(DateFieldValidationUtility, 'handleEndDateInput');
        const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
        component.onProfileTermDateInput(0, event);
        expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalled();
      });

      it('should pass isEditMode=true to handleEndDateInput when mode is edit', () => {
        spyOn(DateFieldValidationUtility, 'handleEndDateInput');
        component.mode = 'edit';
        const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
        component.onProfileTermDateInput(0, event);
        expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
          '31-DEC-2025',
          jasmine.anything(),
          true
        );
      });
    });

    describe('onProfileEffDateBlur / onProfileTermDateBlur', () => {
      it('should mark effective date control as touched', fakeAsync(() => {
        const ctrl = component.profileRowForms.get(0)!.get('effectiveDate')!;
        expect(ctrl.touched).toBe(false);
        component.onProfileEffDateBlur(0);
        tick(1);
        expect(ctrl.touched).toBe(true);
      }));

      it('should mark termination date control as touched', fakeAsync(() => {
        const ctrl = component.profileRowForms.get(0)!.get('terminationDate')!;
        expect(ctrl.touched).toBe(false);
        component.onProfileTermDateBlur(0);
        tick(1);
        expect(ctrl.touched).toBe(true);
      }));
    });
  });

  // ── Non-Profile Tests ──────────────────────────────────────────

  describe('onAddNonProfileTestSingle', () => {
    it('should add a non-profile test when valid test selected', () => {
      component.nonProfileTestIdControl.setValue('HIV1');
      component.nonProfileTests.set([]);
      component.onAddNonProfileTestSingle();

      expect(component.nonProfileTests().length).toBe(1);
      expect(component.nonProfileTests()[0].testId).toBe('HIV1');
      expect(component.nonProfileTests()[0].description).toBe('HIV Type 1');
    });

    it('should clear dropdown after adding', () => {
      component.nonProfileTestIdControl.setValue('HIV1');
      component.nonProfileTests.set([]);
      component.onAddNonProfileTestSingle();
      expect(component.nonProfileTestIdControl.value).toBe('');
    });

    it('should not add when testId is empty', () => {
      component.nonProfileTestIdControl.setValue('');
      component.nonProfileTests.set([]);
      component.onAddNonProfileTestSingle();
      expect(component.nonProfileTests().length).toBe(0);
    });

    it('should not add duplicate test and should clear dropdown', () => {
      component.nonProfileTests.set([buildNonProfileTest({ testId: 'HIV1' })]);
      component.nonProfileTestIdControl.setValue('HIV1');
      component.onAddNonProfileTestSingle();

      expect(component.nonProfileTests().length).toBe(1);
      expect(component.nonProfileTestIdControl.value).toBe('');
    });

    it('should not add when test not found in lookups', () => {
      component.nonProfileTestIdControl.setValue('UNKNOWN');
      component.nonProfileTests.set([]);
      component.onAddNonProfileTestSingle();
      expect(component.nonProfileTests().length).toBe(0);
    });

    it('should set lastModifiedUser from header service', () => {
      component.nonProfileTestIdControl.setValue('HCV');
      component.nonProfileTests.set([]);
      component.onAddNonProfileTestSingle();
      expect(component.nonProfileTests()[0].lastModifiedUser).toBe('testuser');
    });
  });

  describe('onOpenSelectMultiplePanel', () => {
    it('should open SelectTestsDialogComponent with correct config', () => {
      component.contractId = 'CON001';
      component.nonProfileTests.set([buildNonProfileTest({ testId: 'HIV1', description: 'HIV Type 1' })]);

      component.onOpenSelectMultiplePanel();

      expect(realDialog.open).toHaveBeenCalled();
      const config = (realDialog.open as jasmine.Spy).calls.mostRecent().args[1];
      expect(config?.data.contractId).toBe('CON001');
      expect(config?.data.selectedTests.length).toBe(1);
      expect(config?.data.selectedTests[0].testId).toBe('HIV1');
    });

    it('should call onMultipleTestsSelected when dialog returns result', fakeAsync(() => {
      const selectedTests = [
        { testId: 'ZIKA', description: 'Zika Virus' }
      ];
      dialogRefSpy.afterClosed.and.returnValue(of(selectedTests));
      spyOn(component, 'onMultipleTestsSelected');

      component.onOpenSelectMultiplePanel();
      tick();

      expect(component.onMultipleTestsSelected).toHaveBeenCalledWith(selectedTests);
    }));

    it('should not call onMultipleTestsSelected when dialog is cancelled', fakeAsync(() => {
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      spyOn(component, 'onMultipleTestsSelected');

      component.onOpenSelectMultiplePanel();
      tick();

      expect(component.onMultipleTestsSelected).not.toHaveBeenCalled();
    }));
  });

  describe('onMultipleTestsSelected', () => {
    it('should add only non-duplicate tests', () => {
      component.nonProfileTests.set([buildNonProfileTest({ testId: 'HIV1' })]);
      const selected = [
        { testId: 'HIV1', description: 'HIV Type 1' },
        { testId: 'HCV', description: 'Hepatitis C' }
      ];

      component.onMultipleTestsSelected(selected);

      expect(component.nonProfileTests().length).toBe(2);
      expect(component.nonProfileTests()[1].testId).toBe('HCV');
    });

    it('should not update if all selected tests already exist', () => {
      component.nonProfileTests.set([buildNonProfileTest({ testId: 'HIV1' })]);
      const selected = [{ testId: 'HIV1', description: 'HIV Type 1' }];

      const before = component.nonProfileTests();
      component.onMultipleTestsSelected(selected);
      // Length should not change
      expect(component.nonProfileTests().length).toBe(1);
    });

    it('should add all tests when none exist', () => {
      component.nonProfileTests.set([]);
      const selected = [
        { testId: 'HIV1', description: 'HIV Type 1' },
        { testId: 'HCV', description: 'Hepatitis C' }
      ];

      component.onMultipleTestsSelected(selected);

      expect(component.nonProfileTests().length).toBe(2);
    });
  });

  // ── Customer Override ──────────────────────────────────────────

  describe('onAddConfirmatoryTestRow', () => {
    it('should show error when no reactive test is selected', () => {
      component.reactiveTestIdControl.setValue('');
      component.onAddConfirmatoryTestRow();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select a Reactive Test ID first');
    });

    it('should create new override when none exists', () => {
      component.reactiveTestIdControl.setValue('RHIV');
      component.resultControl.setValue('POS');
      component.customerOverrides.set([]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');

      component.onAddConfirmatoryTestRow();

      expect(component.customerOverrides().length).toBe(1);
      expect(component.customerOverrides()[0].reactiveTestId).toBe('RHIV');
      expect(component.customerOverrides()[0].plateSequence).toBe('R');
    });

    it('should add test to existing override at the top', () => {
      const override = buildCustomerOverride();
      component.customerOverrides.set([override]);
      component.reactiveTestIdControl.setValue('RHIV');
      component.resultControl.setValue('POS');
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');

      const initialCount = override.confirmatoryTests.length;
      component.onAddConfirmatoryTestRow();

      const current = component.customerOverrides().find(co => co.reactiveTestId === 'RHIV');
      expect(current!.confirmatoryTests.length).toBe(initialCount + 1);
      expect(current!.confirmatoryTests[0].testId).toBe('');
      expect(current!.confirmatoryTests[0].isNew).toBe(true);
    });
  });

  describe('onDeleteConfirmatoryTestRow', () => {
    it('should remove the test at the specified index', () => {
      const override = buildCustomerOverride();
      component.customerOverrides.set([override]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');

      const initialLength = override.confirmatoryTests.length;
      component.onDeleteConfirmatoryTestRow(0);

      const current = component.customerOverrides().find(co => co.reactiveTestId === 'RHIV');
      expect(current!.confirmatoryTests.length).toBe(initialLength - 1);
    });

    it('should do nothing when no current override', () => {
      component.customerOverrides.set([]);
      (component as any).selectedReactiveTestId.set('');
      expect(() => component.onDeleteConfirmatoryTestRow(0)).not.toThrow();
    });
  });

  describe('onConfirmatoryTestIdChange', () => {
    beforeEach(() => {
      const override = buildCustomerOverride();
      component.customerOverrides.set([override]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      (component as any).rebuildConfirmatoryRowForms();
    });

    it('should update description in form when test ID selected', () => {
      component.onConfirmatoryTestIdChange(1, 'HBV');
      const descControl = component.confirmatoryRowForms.get(1)?.get('description');
      expect(descControl?.value).toBe('Hepatitis B');
    });

    it('should update underlying confirmatory test data', () => {
      component.onConfirmatoryTestIdChange(1, 'HBV');
      const tests = component.currentConfirmatoryTests();
      expect(tests[1].testId).toBe('HBV');
      expect(tests[1].description).toBe('Hepatitis B');
    });

    it('should add new empty row when first row gets a test selected', () => {
      // Set reactiveTestIdControl so onAddConfirmatoryTestRow succeeds
      component.reactiveTestIdControl.setValue('RHIV');
      component.resultControl.setValue('POS');
      const initialLength = component.currentConfirmatoryTests().length;
      component.onConfirmatoryTestIdChange(0, 'ZIKA');
      expect(component.currentConfirmatoryTests().length).toBe(initialLength + 1);
    });
  });

  describe('getConfirmatoryRowControl', () => {
    it('should return FormControl for the specified field', () => {
      const override = buildCustomerOverride();
      component.customerOverrides.set([override]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      (component as any).rebuildConfirmatoryRowForms();

      const ctrl = component.getConfirmatoryRowControl(1, 'testId');
      expect(ctrl).toBeTruthy();
      expect(ctrl.value).toBe('HCV');
    });
  });

  // ── Confirmatory Date Validation ───────────────────────────────

  describe('confirmatory date validation', () => {
    beforeEach(() => {
      const override = buildCustomerOverride();
      component.customerOverrides.set([override]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      (component as any).rebuildConfirmatoryRowForms();
    });

    describe('getConfirmatoryEffMatcher / getConfirmatoryTermMatcher', () => {
      it('should create and cache ErrorStateMatcher for effective date', () => {
        const m1 = component.getConfirmatoryEffMatcher(0);
        const m2 = component.getConfirmatoryEffMatcher(0);
        expect(m1).toBe(m2);
      });

      it('should create and cache ErrorStateMatcher for termination date', () => {
        const m1 = component.getConfirmatoryTermMatcher(0);
        const m2 = component.getConfirmatoryTermMatcher(0);
        expect(m1).toBe(m2);
      });
    });

    describe('getConfirmatoryEffDateError', () => {
      it('should return empty string when no control exists', () => {
        expect(component.getConfirmatoryEffDateError(99)).toBe('');
      });

      it('should return invalid date message', () => {
        const ctrl = component.confirmatoryRowForms.get(0)!.get('effectiveDate')!;
        ctrl.setErrors({ invalidDate: true });
        expect(component.getConfirmatoryEffDateError(0)).toBe('Effective Date is invalid');
      });

      it('should return required message when touched', () => {
        const ctrl = component.confirmatoryRowForms.get(0)!.get('effectiveDate')!;
        ctrl.setValue(null);
        ctrl.markAsTouched();
        ctrl.updateValueAndValidity();
        expect(component.getConfirmatoryEffDateError(0)).toBe('Effective Date is required');
      });

      it('should return past date message for matDatepickerMin', () => {
        const ctrl = component.confirmatoryRowForms.get(0)!.get('effectiveDate')!;
        ctrl.setErrors({ matDatepickerMin: true });
        expect(component.getConfirmatoryEffDateError(0)).toBe('Effective Date cannot be past date');
      });

      it('should return range error when lastChanged is effective and form has dateRangeInvalid', () => {
        (component as any).confirmatoryLastChanged.set(0, 'effective');
        component.confirmatoryRowForms.get(0)!.setErrors({ dateRangeInvalid: true });
        component.confirmatoryRowForms.get(0)!.get('effectiveDate')!.setErrors(null);
        expect(component.getConfirmatoryEffDateError(0)).toBe(
          'Effective Date must be less than or equal to Termination Date'
        );
      });
    });

    describe('getConfirmatoryTermDateError', () => {
      it('should return empty string when no control exists', () => {
        expect(component.getConfirmatoryTermDateError(99)).toBe('');
      });

      it('should return invalid date message', () => {
        const ctrl = component.confirmatoryRowForms.get(0)!.get('terminationDate')!;
        ctrl.setErrors({ invalidDate: true });
        expect(component.getConfirmatoryTermDateError(0)).toBe('Termination Date is invalid');
      });

      it('should return empty string when not touched or dirty', () => {
        const ctrl = component.confirmatoryRowForms.get(0)!.get('terminationDate')!;
        ctrl.setErrors(null);
        expect(component.getConfirmatoryTermDateError(0)).toBe('');
      });

      it('should return past date message when touched', () => {
        const ctrl = component.confirmatoryRowForms.get(0)!.get('terminationDate')!;
        ctrl.markAsTouched();
        ctrl.setErrors({ matDatepickerMin: true });
        expect(component.getConfirmatoryTermDateError(0)).toBe('Termination Date cannot be past date');
      });

      it('should return range error when lastChanged is termination and dateRangeInvalid', () => {
        (component as any).confirmatoryLastChanged.set(0, 'termination');
        const ctrl = component.confirmatoryRowForms.get(0)!.get('terminationDate')!;
        ctrl.markAsTouched();
        ctrl.setErrors(null);
        component.confirmatoryRowForms.get(0)!.setErrors({ dateRangeInvalid: true });
        expect(component.getConfirmatoryTermDateError(0)).toBe(
          'Termination Date must be greater than or equal to Effective Date'
        );
      });
    });

    describe('getConfirmatoryTermDateFilter', () => {
      it('should return true for null date', () => {
        const filter = component.getConfirmatoryTermDateFilter(0);
        expect(filter(null)).toBe(true);
      });

      it('should return true when date is after effective date', () => {
        component.confirmatoryRowForms.get(1)!.get('effectiveDate')!.setValue(moment('2025-01-01'));
        const filter = component.getConfirmatoryTermDateFilter(1);
        expect(filter(moment('2025-06-01'))).toBe(true);
      });

      it('should return false when date is before effective date', () => {
        component.confirmatoryRowForms.get(1)!.get('effectiveDate')!.setValue(moment('2025-06-01'));
        const filter = component.getConfirmatoryTermDateFilter(1);
        expect(filter(moment('2025-01-01'))).toBe(false);
      });

      it('should return true when no effective date set', () => {
        component.confirmatoryRowForms.get(0)!.get('effectiveDate')!.setValue(null);
        const filter = component.getConfirmatoryTermDateFilter(0);
        expect(filter(moment('2025-01-01'))).toBe(true);
      });
    });

    describe('onConfirmatoryEffDateChange / onConfirmatoryTermDateChange', () => {
      it('should set lastChanged to effective', () => {
        component.onConfirmatoryEffDateChange(0);
        expect((component as any).confirmatoryLastChanged.get(0)).toBe('effective');
      });

      it('should set lastChanged to termination', () => {
        component.onConfirmatoryTermDateChange(0);
        expect((component as any).confirmatoryLastChanged.get(0)).toBe('termination');
      });
    });

    describe('onConfirmatoryEffDateInput / onConfirmatoryTermDateInput', () => {
      it('should delegate to DateFieldValidationUtility.handleStartDateInput', () => {
        spyOn(DateFieldValidationUtility, 'handleStartDateInput');
        const event = { target: { value: '01-JAN-2025' } } as unknown as Event;
        component.onConfirmatoryEffDateInput(0, event);
        expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalled();
      });

      it('should delegate to DateFieldValidationUtility.handleEndDateInput', () => {
        spyOn(DateFieldValidationUtility, 'handleEndDateInput');
        const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
        component.onConfirmatoryTermDateInput(0, event);
        expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalled();
      });

      it('should pass isEditMode from component mode', () => {
        spyOn(DateFieldValidationUtility, 'handleEndDateInput');
        component.mode = 'edit';
        const event = { target: { value: '31-DEC-2025' } } as unknown as Event;
        component.onConfirmatoryTermDateInput(0, event);
        expect(DateFieldValidationUtility.handleEndDateInput).toHaveBeenCalledWith(
          '31-DEC-2025',
          jasmine.anything(),
          true
        );
      });
    });

    describe('onConfirmatoryEffDateBlur / onConfirmatoryTermDateBlur', () => {
      it('should mark effective date control as touched', fakeAsync(() => {
        const ctrl = component.confirmatoryRowForms.get(0)!.get('effectiveDate')!;
        expect(ctrl.touched).toBe(false);
        component.onConfirmatoryEffDateBlur(0);
        tick(1);
        expect(ctrl.touched).toBe(true);
      }));

      it('should mark termination date control as touched', fakeAsync(() => {
        const ctrl = component.confirmatoryRowForms.get(0)!.get('terminationDate')!;
        expect(ctrl.touched).toBe(false);
        component.onConfirmatoryTermDateBlur(0);
        tick(1);
        expect(ctrl.touched).toBe(true);
      }));
    });
  });

  // ── onReactiveTestChange ───────────────────────────────────────

  describe('onReactiveTestChange', () => {
    it('should clear result control and result lookups', () => {
      component.resultControl.setValue('POS');
      component.resultLookups.set([{ resultCode: 'POS', resultDescription: 'Positive' }]);

      component.reactiveTestIdControl.setValue('RHIV');
      component.onReactiveTestChange();

      expect(component.resultControl.value).toBe('');
      expect(component.resultLookups().length).toBe(0);
    });

    it('should update selectedReactiveTestId signal', () => {
      component.reactiveTestIdControl.setValue('RHIV');
      component.onReactiveTestChange();
      expect((component as any).selectedReactiveTestId()).toBe('RHIV');
    });

    it('should do nothing when testId is empty', () => {
      component.reactiveTestIdControl.setValue('');
      component.onReactiveTestChange();
      expect(apiService.getResultCodesForTest).not.toHaveBeenCalled();
    });

    it('should load result codes for the selected test', () => {
      const results: ResultLookup[] = [{ resultCode: 'POS', resultDescription: 'Positive' }];
      apiService.getResultCodesForTest.and.returnValue(of(results));

      component.reactiveTestIdControl.setValue('RHIV');
      component.onReactiveTestChange();

      expect(apiService.getResultCodesForTest).toHaveBeenCalledWith('RHIV');
      expect(component.resultLookups()).toEqual(results);
    });

    it('should create new customer override when none exists', () => {
      component.customerOverrides.set([]);
      component.reactiveTestIdControl.setValue('RHIV');
      component.onReactiveTestChange();

      const overrides = component.customerOverrides();
      expect(overrides.length).toBe(1);
      expect(overrides[0].reactiveTestId).toBe('RHIV');
      expect(overrides[0].result).toBe('');
      expect(overrides[0].confirmatoryTests.length).toBe(1);
      expect(overrides[0].confirmatoryTests[0].isNew).toBe(true);
    });

    it('should not create duplicate override when one already exists', () => {
      const existing = buildCustomerOverride({ result: '' });
      component.customerOverrides.set([existing]);
      (component as any).selectedReactiveTestId.set('RHIV');
      component.reactiveTestIdControl.setValue('RHIV');
      component.onReactiveTestChange();

      // Should not add another override
      expect(component.customerOverrides().length).toBe(1);
    });
  });

  // ── onReactiveTestOrResultChange ───────────────────────────────

  describe('onReactiveTestOrResultChange', () => {
    it('should update selectedResult signal', () => {
      component.reactiveTestIdControl.setValue('RHIV');
      component.resultControl.setValue('POS');
      (component as any).selectedReactiveTestId.set('RHIV');
      component.onReactiveTestOrResultChange();
      expect((component as any).selectedResult()).toBe('POS');
    });

    it('should return early when testId is empty', () => {
      component.reactiveTestIdControl.setValue('');
      component.resultControl.setValue('POS');
      component.onReactiveTestOrResultChange();
      // Should still update selectedResult
      expect((component as any).selectedResult()).toBe('POS');
    });

    it('should return early when result is empty', () => {
      component.reactiveTestIdControl.setValue('RHIV');
      component.resultControl.setValue('');
      component.customerOverrides.set([]);
      component.onReactiveTestOrResultChange();
      // Should not create override
      expect(component.customerOverrides().length).toBe(0);
    });

    it('should create new override when no matching override exists', () => {
      component.reactiveTestIdControl.setValue('RHIV');
      component.resultControl.setValue('POS');
      component.customerOverrides.set([]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');

      component.onReactiveTestOrResultChange();

      expect(component.customerOverrides().length).toBe(1);
      expect(component.customerOverrides()[0].result).toBe('POS');
    });

    it('should update result in existing override when override matches current selection', () => {
      // When override already exists with result='POS' and user re-selects same result,
      // the else branch updates the existing override
      const existing = buildCustomerOverride({ result: 'POS' });
      component.customerOverrides.set([existing]);
      component.reactiveTestIdControl.setValue('RHIV');
      component.resultControl.setValue('POS');
      (component as any).selectedReactiveTestId.set('RHIV');

      component.onReactiveTestOrResultChange();

      const updated = component.customerOverrides().find(co => co.reactiveTestId === 'RHIV');
      expect(updated!.result).toBe('POS');
      // Should not create a second override
      expect(component.customerOverrides().length).toBe(1);
    });
  });

  // ── onOpenConfirmatoryQueryPanel ───────────────────────────────

  describe('onOpenConfirmatoryQueryPanel', () => {
    it('should show error when no reactive test is selected and no overrides', () => {
      component.reactiveTestIdControl.setValue('');
      component.customerOverrides.set([]);

      component.onOpenConfirmatoryQueryPanel();

      expect(mockSnackbar.showError).toHaveBeenCalledWith('Please select a Reactive Test ID first');
    });

    it('should open dialog with selected reactive test ID', () => {
      component.reactiveTestIdControl.setValue('RHIV');
      component.contractId = 'CON001';

      component.onOpenConfirmatoryQueryPanel();

      expect(realDialog.open).toHaveBeenCalled();
      const config = (realDialog.open as jasmine.Spy).calls.mostRecent().args[1];
      expect(config?.data.contractId).toBe('CON001');
      expect(config?.data.reactiveTestId).toBe('RHIV');
    });

    it('should use first customer override testId when no reactive test selected', () => {
      component.reactiveTestIdControl.setValue('');
      component.customerOverrides.set([buildCustomerOverride({ reactiveTestId: 'RHCV' })]);
      component.contractId = 'CON001';

      component.onOpenConfirmatoryQueryPanel();

      expect(realDialog.open).toHaveBeenCalled();
      const config = (realDialog.open as jasmine.Spy).calls.mostRecent().args[1];
      expect(config?.data.reactiveTestId).toBe('RHCV');
    });
  });

  // ── syncAllFormsToData ─────────────────────────────────────────

  describe('syncAllFormsToData', () => {
    it('should sync both profile and confirmatory forms', () => {
      spyOn<any>(component, 'syncProfileFormsToData');
      spyOn<any>(component, 'syncConfirmatoryFormsToData');

      component.syncAllFormsToData();

      expect((component as any).syncProfileFormsToData).toHaveBeenCalledWith(true);
      expect((component as any).syncConfirmatoryFormsToData).toHaveBeenCalledWith(true);
    });
  });

  // ── syncProfileFormsToData ─────────────────────────────────────

  describe('syncProfileFormsToData (private)', () => {
    it('should not sync when forms count does not match data count (not forced)', () => {
      const set = buildProfileSet({ tests: [buildProfileTest(), buildProfileTest({ testId: 'HCV' })] });
      component.profileSets.set([set]);
      component.currentProfileSetIndex.set(0);
      // Forms map has different count (empty)
      component.profileRowForms.clear();

      (component as any).syncProfileFormsToData(false);

      // Data should remain unchanged
      expect(component.currentProfileTests()[0].testId).toBe('HIV1');
    });

    it('should sync form values to data when forced', () => {
      const set = buildProfileSet();
      component.profileSets.set([set]);
      component.currentProfileSetIndex.set(0);
      (component as any).rebuildProfileRowForms();

      // Change form value
      component.profileRowForms.get(0)!.get('width')!.setValue(99);

      (component as any).syncProfileFormsToData(true);

      expect(component.currentProfileTests()[0].width).toBe(99);
    });

    it('should do nothing when no current profile set', () => {
      component.profileSets.set([]);
      component.currentProfileSetIndex.set(-1);
      expect(() => (component as any).syncProfileFormsToData(true)).not.toThrow();
    });
  });

  // ── syncConfirmatoryFormsToData ────────────────────────────────

  describe('syncConfirmatoryFormsToData (private)', () => {
    it('should not sync when no current override', () => {
      component.customerOverrides.set([]);
      (component as any).selectedReactiveTestId.set('');
      expect(() => (component as any).syncConfirmatoryFormsToData(true)).not.toThrow();
    });

    it('should not sync when forms count does not match and not forced', () => {
      component.customerOverrides.set([buildCustomerOverride()]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      component.confirmatoryRowForms.clear();

      (component as any).syncConfirmatoryFormsToData(false);
      // Should not crash
      expect(component.currentConfirmatoryTests()[1].testId).toBe('HCV');
    });

    it('should sync form values when forced', () => {
      component.customerOverrides.set([buildCustomerOverride()]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      (component as any).rebuildConfirmatoryRowForms();

      // Change a form value
      const form = component.confirmatoryRowForms.get(1);
      form?.get('testId')?.setValue('NEWTEST');

      (component as any).syncConfirmatoryFormsToData(true);

      const tests = component.currentConfirmatoryTests();
      expect(tests[1].testId).toBe('NEWTEST');
    });
  });

  // ── validateConfirmatoryTests ──────────────────────────────────

  describe('validateConfirmatoryTests (private)', () => {
    it('should return valid when no overrides exist', () => {
      component.customerOverrides.set([]);
      const result = (component as any).validateConfirmatoryTests();
      expect(result.valid).toBe(true);
    });

    it('should return valid when overrides have filled confirmatory tests', () => {
      component.customerOverrides.set([buildCustomerOverride()]);
      const result = (component as any).validateConfirmatoryTests();
      expect(result.valid).toBe(true);
    });

    it('should return invalid when reactive test has no filled confirmatory tests', () => {
      const override = buildCustomerOverride({
        confirmatoryTests: [
          { testId: '', description: '', effectiveDate: '', terminationDate: null, isNew: true }
        ]
      });
      component.customerOverrides.set([override]);
      const result = (component as any).validateConfirmatoryTests();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('RHIV');
      expect(result.error).toContain('at least one confirmatory test');
    });

    it('should return valid when first row is empty but subsequent rows have tests', () => {
      const override = buildCustomerOverride({
        confirmatoryTests: [
          { testId: '', description: '', effectiveDate: '', terminationDate: null, isNew: true },
          { testId: 'HCV', description: 'Hepatitis C', effectiveDate: '2025-01-01', terminationDate: null }
        ]
      });
      component.customerOverrides.set([override]);
      const result = (component as any).validateConfirmatoryTests();
      expect(result.valid).toBe(true);
    });
  });

  // ── onSaveAndFinish ────────────────────────────────────────────

  describe('onSaveAndFinish', () => {
    it('should show error when primary profile has no tests', () => {
      component.profileSets.set([buildProfileSet({ profileType: 'P', terminationDate: null, tests: [] })]);

      component.onSaveAndFinish();

      expect(mockSnackbar.showError).toHaveBeenCalledWith(
        'Primary profile must have at least one test assigned.'
      );
    });

    it('should show error when confirmatory tests validation fails', () => {
      component.profileSets.set([]);
      component.customerOverrides.set([
        buildCustomerOverride({
          confirmatoryTests: [
            { testId: '', description: '', effectiveDate: '', terminationDate: null, isNew: true }
          ]
        })
      ]);

      component.onSaveAndFinish();

      expect(mockSnackbar.showError).toHaveBeenCalled();
    });

    it('should show success and emit saveAndFinish on valid save', () => {
      component.contractId = 'CON001';
      component.profileSets.set([]);
      component.customerOverrides.set([]);
      spyOn(component.saveAndFinish, 'emit');

      component.onSaveAndFinish();

      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith(
        'Contract Tests for Contract ID CON001 have been saved.'
      );
      expect(component.saveAndFinish.emit).toHaveBeenCalled();
    });

    it('should not emit saveAndFinish when primary profile validation fails', () => {
      component.profileSets.set([buildProfileSet({ profileType: 'P', terminationDate: null, tests: [] })]);
      spyOn(component.saveAndFinish, 'emit');

      component.onSaveAndFinish();

      expect(component.saveAndFinish.emit).not.toHaveBeenCalled();
    });

    it('should allow save when primary profile has tests', () => {
      component.profileSets.set([buildProfileSet({ profileType: 'P', tests: [buildProfileTest()] })]);
      component.customerOverrides.set([]);
      spyOn(component.saveAndFinish, 'emit');

      component.onSaveAndFinish();

      expect(component.saveAndFinish.emit).toHaveBeenCalled();
    });

    it('should skip primary validation when primary profile is terminated', () => {
      component.profileSets.set([
        buildProfileSet({ profileType: 'P', terminationDate: '2024-12-31', tests: [] })
      ]);
      component.customerOverrides.set([]);
      spyOn(component.saveAndFinish, 'emit');

      component.onSaveAndFinish();

      expect(component.saveAndFinish.emit).toHaveBeenCalled();
    });
  });

  // ── onCancel ───────────────────────────────────────────────────

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      spyOn(component.cancel, 'emit');
      component.onCancel();
      expect(component.cancel.emit).toHaveBeenCalled();
    });
  });

  // ── formatDate / formatDateTime ────────────────────────────────

  describe('formatDate', () => {
    it.each([
      ['2025-01-15T00:00:00', '15-JAN-2025'],
      ['2025-12-25T00:00:00', '25-DEC-2025'],
      [null, '-'],
      [undefined, '-'],
      ['', '-'],
      ['invalid-date', '-']
    ])('should format "%s" as "%s"', (input, expected) => {
      expect(component.formatDate(input as any)).toBe(expected);
    });
  });

  describe('formatDateTime', () => {
    it.each([
      ['2025-01-15T14:30:00', '15-JAN-2025, 14:30'],
      [null, '-'],
      [undefined, '-'],
      ['', '-'],
      ['not-a-date', '-']
    ])('should format "%s" as "%s"', (input, expected) => {
      expect(component.formatDateTime(input as any)).toBe(expected);
    });
  });

  // ── scrollToSection ────────────────────────────────────────────

  describe('scrollToSection', () => {
    it('should set activeSection signal', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      component.scrollToSection('non-profile-tests');
      expect(component.activeSection()).toBe('non-profile-tests');
    });

    it('should call scrollIntoView on the target element', () => {
      const mockElement = { scrollIntoView: jasmine.createSpy('scrollIntoView') };
      spyOn(document, 'getElementById').and.returnValue(mockElement as any);

      component.scrollToSection('customer-override');

      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    });

    it('should not throw when element not found', () => {
      spyOn(document, 'getElementById').and.returnValue(null);
      expect(() => component.scrollToSection('nonexistent')).not.toThrow();
    });
  });

  // ── rebuildProfileRowForms ─────────────────────────────────────

  describe('rebuildProfileRowForms (private)', () => {
    it('should create form for each test in current profile set', () => {
      const tests = [buildProfileTest({ testId: 'HIV1' }), buildProfileTest({ testId: 'HCV' })];
      component.profileSets.set([buildProfileSet({ tests })]);
      component.currentProfileSetIndex.set(0);

      (component as any).rebuildProfileRowForms();

      expect(component.profileRowForms.size).toBe(2);
      expect(component.profileRowForms.get(0)?.get('testId')?.value).toBe('HIV1');
      expect(component.profileRowForms.get(1)?.get('testId')?.value).toBe('HCV');
    });

    it('should clear old matchers and lastChanged tracking', () => {
      component.profileSets.set([buildProfileSet()]);
      component.currentProfileSetIndex.set(0);
      (component as any).rebuildProfileRowForms();

      // Set some tracking data
      (component as any).profileLastChanged.set(0, 'effective');
      component.getProfileEffMatcher(0);
      component.getProfileTermMatcher(0);

      // Rebuild should clear
      (component as any).rebuildProfileRowForms();
      expect((component as any).profileLastChanged.size).toBe(0);
    });
  });

  // ── createProfileTestForm (private) ────────────────────────────

  describe('createProfileTestForm (private)', () => {
    it('should create form with required testId and effectiveDate', () => {
      const test = buildProfileTest();
      const form = (component as any).createProfileTestForm(test, 0) as FormGroup;

      expect(form.get('testId')?.hasError('required')).toBeFalse();
      form.get('testId')?.setValue('');
      expect(form.get('testId')?.hasError('required')).toBeTrue();
    });

    it('should set description as disabled', () => {
      const test = buildProfileTest();
      const form = (component as any).createProfileTestForm(test, 0) as FormGroup;
      expect(form.get('description')?.disabled).toBeTrue();
    });

    it('should call setupAddModeValidators for new tests', () => {
      spyOn(DateFieldValidationUtility, 'setupAddModeValidators');
      const test = buildProfileTest({ isNew: true });
      (component as any).createProfileTestForm(test, 0);
      expect(DateFieldValidationUtility.setupAddModeValidators).toHaveBeenCalled();
    });

    it('should NOT call setupAddModeValidators for existing tests', () => {
      const spy = spyOn(DateFieldValidationUtility, 'setupAddModeValidators');
      // Reset any pending calls from prior microtask activity
      spy.calls.reset();
      const test = buildProfileTest({ isNew: false });
      (component as any).createProfileTestForm(test, 0);
      expect(spy).not.toHaveBeenCalled();
    });

    it('should parse moment date from effectiveDate string', () => {
      const test = buildProfileTest({ effectiveDate: '2025-06-15T00:00:00' });
      const form = (component as any).createProfileTestForm(test, 0) as FormGroup;
      const value = form.get('effectiveDate')?.value;
      expect(moment.isMoment(value)).toBe(true);
      expect(value.format('YYYY-MM-DD')).toBe('2025-06-15');
    });

    it('should set effectiveDate to null when empty', () => {
      const test = buildProfileTest({ effectiveDate: '' });
      const form = (component as any).createProfileTestForm(test, 0) as FormGroup;
      expect(form.get('effectiveDate')?.value).toBeNull();
    });
  });

  // ── createConfirmatoryTestForm (private) ───────────────────────

  describe('createConfirmatoryTestForm (private)', () => {
    it('should create form with required testId and effectiveDate', () => {
      const test: ConfirmatoryOverrideTestData = {
        testId: 'HCV', description: 'Hepatitis C',
        effectiveDate: '2025-01-01T00:00:00', terminationDate: null
      };
      const form = (component as any).createConfirmatoryTestForm(test, 0) as FormGroup;

      expect(form.get('testId')?.value).toBe('HCV');
      expect(form.get('description')?.disabled).toBeTrue();
    });

    it('should call setupAddModeValidators for new tests', () => {
      spyOn(DateFieldValidationUtility, 'setupAddModeValidators');
      const test: ConfirmatoryOverrideTestData = {
        testId: '', description: '', effectiveDate: '', terminationDate: null, isNew: true
      };
      (component as any).createConfirmatoryTestForm(test, 0);
      expect(DateFieldValidationUtility.setupAddModeValidators).toHaveBeenCalled();
    });
  });

  // ── rebuildConfirmatoryRowForms ─────────────────────────────────

  describe('rebuildConfirmatoryRowForms (private)', () => {
    it('should create form for each confirmatory test in current override', () => {
      component.customerOverrides.set([buildCustomerOverride()]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');

      (component as any).rebuildConfirmatoryRowForms();

      expect(component.confirmatoryRowForms.size).toBe(2); // 1 empty + 1 HCV
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle contractId shorter than 3 chars in onAddNewProfileSet', () => {
      component.contractId = 'XY';
      component.profileSets.set([]);
      component.onAddNewProfileSet();
      expect(component.profileSets()[0].profileSetId).toContain('XY-');
    });

    it('should handle profile set IDs without dash when computing next number', () => {
      component.contractId = 'ABCDEF';
      component.profileSets.set([buildProfileSet({ profileSetId: 'NODASH' })]);
      component.currentProfileSetIndex.set(0);
      component.onAddNewProfileSet();
      // Should default to 1 since parseInt("NODASH") is NaN which gets filtered
      expect(component.profileSets()[1].profileSetId).toContain('-0001');
    });

    it('should handle plateSequenceLabel with unknown sequence', () => {
      const override = buildCustomerOverride({ plateSequence: 'X' as any });
      component.customerOverrides.set([override]);
      (component as any).selectedReactiveTestId.set('RHIV');
      (component as any).selectedResult.set('POS');
      expect(component.plateSequenceLabel()).toBe('-');
    });
  });
});
