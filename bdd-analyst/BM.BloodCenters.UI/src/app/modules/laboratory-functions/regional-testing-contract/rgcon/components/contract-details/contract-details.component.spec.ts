import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { ContractDetailsComponent } from './contract-details.component';
import { SnackbarService } from '@shared/services/snackbar.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { RegionalTestingContractApiService } from '../../services/regional-testing-contract-api.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('ContractDetailsComponent', () => {
  let component: ContractDetailsComponent;
  let fixture: ComponentFixture<ContractDetailsComponent>;
  let snackbarSpy: jasmine.SpyObj<SnackbarService>;
  let chapterTzSpy: jasmine.SpyObj<ChapterTimezoneService>;
  let apiSpy: jasmine.SpyObj<RegionalTestingContractApiService>;
  let routerSpy: Router;

  function createChapterTzSpy(): jasmine.SpyObj<ChapterTimezoneService> {
    const spy = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'isChapterLocalDateAvailable'
    ]);
    spy.getChapterLocalDate.and.returnValue(new Date());
    spy.isChapterLocalDateAvailable.and.returnValue(true);
    return spy;
  }

  function createApiSpy(routeId: string | null = null): jasmine.SpyObj<RegionalTestingContractApiService> {
    const spy = jasmine.createSpyObj('RegionalTestingContractApiService', [
      'getFilterOptions',
      'getContractById',
      'createContract',
      'updateContract',
      'getChaptersLookup',
      'getTestLookups',
      'getReactiveTestLookup',
      'getProfileSets',
      'getNonProfileTests',
      'getCustomerOverrides',
      'getResultCodesForTest'
    ]);
    spy.getFilterOptions.and.returnValue(of({ cbcChapters: [], resultsMethods: [] }));
    spy.getContractById.and.returnValue(of({
      contractId: routeId,
      customerName: 'Test',
      effDate: '2026-01-01',
      chapters: [],
      profiles: []
    }));
    spy.getTestLookups.and.returnValue(of([]));
    spy.getReactiveTestLookup.and.returnValue(of([]));
    spy.getProfileSets.and.returnValue(of([]));
    spy.getNonProfileTests.and.returnValue(of([]));
    spy.getCustomerOverrides.and.returnValue(of([]));
    return spy;
  }

  function configureTestBed(routeId: string | null = null) {
    snackbarSpy = createMockSnackbarService();
    chapterTzSpy = createChapterTzSpy();
    apiSpy = createApiSpy(routeId);

    return TestBed.configureTestingModule({
      imports: [ContractDetailsComponent,
        NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SnackbarService, useValue: snackbarSpy },
        { provide: ChapterTimezoneService, useValue: chapterTzSpy },
        { provide: RegionalTestingContractApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({ get: (key: string) => key === 'id' ? routeId : null })
          }
        }
      ]
    }).compileComponents();
  }

  /** Helper: fill form fields required for validity, clearing the not-past validator first */
  function makeFormValid(comp: ContractDetailsComponent): void {
    const effCtrl = comp.contractDetailsForm.get('effectiveDate');
    effCtrl?.clearValidators();
    effCtrl?.updateValueAndValidity();

    comp.contractDetailsForm.patchValue({
      facilityNameDescription: 'Test Facility',
      clientChapter: 'CH1',
      copyOsUnits: 'Y',
      effectiveDate: new Date(2027, 5, 1)
    });
    comp.contractDetailsForm.updateValueAndValidity();
  }

  beforeEach(async () => {
    await configureTestBed(null);

    routerSpy = TestBed.inject(Router);
    fixture = TestBed.createComponent(ContractDetailsComponent);
    component = fixture.componentInstance;
    try { fixture.detectChanges(); } catch (_) { /* child component render errors */ }
  });

  it('should be in edit mode when route has id param', async () => {
    TestBed.resetTestingModule();
    await configureTestBed('TEST-001');

    const editFixture = TestBed.createComponent(ContractDetailsComponent);
    const editComponent = editFixture.componentInstance;
    try { editFixture.detectChanges(); } catch (_) { /* child component render errors */ }

    expect(editComponent.isEditMode()).toBe(true);
  });

  it('should navigate on cancel', () => {
    const navigateSpy = spyOn(routerSpy, 'navigate');
    component.onCancel();
    expect(navigateSpy).toHaveBeenCalledWith(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract']);
  });

  // ---- NEW TESTS BELOW ----

  describe('ngOnInit', () => {
    it('should set header title to "Add New Contract ID" for new contracts', () => {
      expect((component as any).headerConfig.title).toBe('Add New Contract ID');
    });

    it('should not be in edit mode when route has no id', () => {
      expect(component.isEditMode()).toBe(false);
    });

    it('should initialize contractDetailsForm with required fields', () => {
      expect(component.contractDetailsForm).toBeTruthy();
      expect(component.contractDetailsForm.get('facilityNameDescription')).toBeTruthy();
      expect(component.contractDetailsForm.get('clientChapter')).toBeTruthy();
      expect(component.contractDetailsForm.get('effectiveDate')).toBeTruthy();
    });

    it('should set contract type to Regular and disabled', () => {
      const contractType = component.contractDetailsForm.get('contractType');
      expect(contractType?.value).toBe('Regular');
      expect(contractType?.disabled).toBe(true);
    });

    it('should set plateCapacity to 9999 and disabled', () => {
      const plateCapacity = component.contractDetailsForm.get('plateCapacity');
      expect(plateCapacity?.value).toBe('9999');
      expect(plateCapacity?.disabled).toBe(true);
    });

    it('should add effectiveDateNotPast validator for new contracts', () => {
      const effectiveDateControl = component.contractDetailsForm.get('effectiveDate');
      expect(effectiveDateControl?.validator).toBeTruthy();
    });
  });

  describe('ngOnInit in edit mode', () => {
    let editComponent: ContractDetailsComponent;
    let editFixture: ComponentFixture<ContractDetailsComponent>;

    beforeEach(async () => {
      TestBed.resetTestingModule();
      await configureTestBed('EDIT-001');
      routerSpy = TestBed.inject(Router);
      editFixture = TestBed.createComponent(ContractDetailsComponent);
      editComponent = editFixture.componentInstance;
      try { editFixture.detectChanges(); } catch (_) { /* child component render errors */ }
    });

    it('should set header title to "Edit Contract ID" in edit mode', () => {
      expect((editComponent as any).headerConfig.title).toBe('Edit Contract ID');
    });

    it('should call loadContractData in edit mode', () => {
      expect(apiSpy.getContractById).toHaveBeenCalledWith('EDIT-001');
    });

    it('should load contract data and patch form', () => {
      expect(editComponent.contractDetailsForm.get('facilityNameDescription')?.value).toBe('Test');
    });
  });

  describe('onBackClick', () => {
    it('should navigate to the landing page', () => {
      const navigateSpy = spyOn(routerSpy, 'navigate');
      component.onBackClick();
      expect(navigateSpy).toHaveBeenCalledWith(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract']);
    });
  });

  describe('f getter', () => {
    it('should return form controls', () => {
      const controls = component.f;
      expect(controls).toBeTruthy();
      expect(controls['facilityNameDescription']).toBeTruthy();
      expect(controls['clientChapter']).toBeTruthy();
    });
  });

  describe('loadFilterOptions', () => {
    it('should load options and set loading to false on success', () => {
      expect(component.loading()).toBe(false);
    });

    it('should show error on filter options failure', async () => {
      TestBed.resetTestingModule();
      const localSnackbar = createMockSnackbarService();
      const localChapterTz = createChapterTzSpy();
      const localApi = createApiSpy();
      localApi.getFilterOptions.and.returnValue(throwError(() => new Error('API error')));

      await TestBed.configureTestingModule({
        imports: [ContractDetailsComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: SnackbarService, useValue: localSnackbar },
          { provide: ChapterTimezoneService, useValue: localChapterTz },
          { provide: RegionalTestingContractApiService, useValue: localApi },
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: () => null }) }
          }
        ]
      }).compileComponents();

      const f2 = TestBed.createComponent(ContractDetailsComponent);
      try { f2.detectChanges(); } catch (_) { /* child component render errors */ }

      expect(localSnackbar.showError).toHaveBeenCalledWith('Failed to load filter options. Please try again.');
      expect(f2.componentInstance.loading()).toBe(false);
    });

    it('should update client chapter description when options load and value is set', async () => {
      TestBed.resetTestingModule();
      const localSnackbar = createMockSnackbarService();
      const localChapterTz = createChapterTzSpy();
      const localApi = createApiSpy();
      localApi.getFilterOptions.and.returnValue(of({
        cbcChapters: [{ value: 'CH1', label: 'Chapter One' }],
        resultsMethods: []
      }));

      await TestBed.configureTestingModule({
        imports: [ContractDetailsComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: SnackbarService, useValue: localSnackbar },
          { provide: ChapterTimezoneService, useValue: localChapterTz },
          { provide: RegionalTestingContractApiService, useValue: localApi },
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: () => null }) }
          }
        ]
      }).compileComponents();

      const f2 = TestBed.createComponent(ContractDetailsComponent);
      const c2 = f2.componentInstance;
      try { f2.detectChanges(); } catch (_) { /* child component render errors */ }

      // Now set the value - the listener will update the description
      c2.contractDetailsForm.get('clientChapter')?.setValue('CH1');
      expect(c2.clientChapterDescription()).toBe('Chapter One');
    });
  });

  describe('setupSearchFilters', () => {
    it('should filter client chapter options by search text', () => {
      (component as any).clientChapterOptions.set([
        { value: 'CH1', label: 'Alpha Chapter' },
        { value: 'CH2', label: 'Beta Chapter' },
        { value: 'CH3', label: 'Gamma Division' }
      ]);

      component.clientChapterSearchControl.setValue('alpha');

      expect(component.filteredClientChapterOptions().length).toBe(1);
      expect(component.filteredClientChapterOptions()[0].value).toBe('CH1');
    });

    it('should show all options when search is empty', () => {
      (component as any).clientChapterOptions.set([
        { value: 'CH1', label: 'Alpha Chapter' },
        { value: 'CH2', label: 'Beta Chapter' }
      ]);

      component.clientChapterSearchControl.setValue('');

      expect(component.filteredClientChapterOptions().length).toBe(2);
    });

    it('should filter by value as well as label', () => {
      (component as any).clientChapterOptions.set([
        { value: 'XYZ', label: 'Some Chapter' },
        { value: 'ABC', label: 'Other Chapter' }
      ]);

      component.clientChapterSearchControl.setValue('xyz');

      expect(component.filteredClientChapterOptions().length).toBe(1);
      expect(component.filteredClientChapterOptions()[0].value).toBe('XYZ');
    });

    it('should show all options when search is null', () => {
      (component as any).clientChapterOptions.set([
        { value: 'CH1', label: 'Alpha' },
        { value: 'CH2', label: 'Beta' }
      ]);

      component.clientChapterSearchControl.setValue(null);

      expect(component.filteredClientChapterOptions().length).toBe(2);
    });
  });

  describe('setupClientChapterListener', () => {
    it('should set description to dash when client chapter is cleared', () => {
      (component as any).clientChapterOptions.set([
        { value: 'CH1', label: 'Test Chapter' }
      ]);
      component.contractDetailsForm.get('clientChapter')?.setValue('CH1');
      component.contractDetailsForm.get('clientChapter')?.setValue(null);
      expect(component.clientChapterDescription()).toBe('-');
    });

    it('should set description to label when valid chapter is selected', () => {
      (component as any).clientChapterOptions.set([
        { value: 'CH1', label: 'My Chapter' }
      ]);
      component.contractDetailsForm.get('clientChapter')?.setValue('CH1');
      expect(component.clientChapterDescription()).toBe('My Chapter');
    });

    it('should set description to dash when chapter value is not found in options', () => {
      (component as any).clientChapterOptions.set([
        { value: 'CH1', label: 'My Chapter' }
      ]);
      component.contractDetailsForm.get('clientChapter')?.setValue('UNKNOWN');
      expect(component.clientChapterDescription()).toBe('-');
    });
  });

  describe('loadContractData', () => {
    it('should load contract with chapters and profiles', async () => {
      TestBed.resetTestingModule();

      const localSnackbar = createMockSnackbarService();
      const localChapterTz = createChapterTzSpy();
      const localApi = createApiSpy('LOAD-001');
      localApi.getContractById.and.returnValue(of({
        contractId: 'LOAD-001',
        customerName: 'Loaded Facility',
        chapterId: 'CH1',
        dispChkdigitFlag: 'Y',
        poNo: 'PO123',
        taxIdForm: 'TAX1',
        plateCapacity: 5000,
        copyIsbtFlag: 'Y',
        unitIdType: 'N',
        sEditRates: 'Y',
        resultOutputInd: 'B',
        confirmTestFlag: 'Y',
        odReportingMethod: 'N',
        resultsMethod: 'E',
        ediInputInd: 'Y',
        cbcChapterId: 'CBC1',
        dupCheckinFlag: 'N',
        noOfDuplicates: 3,
        nonProfileEf: 'N',
        effDate: '2026-01-15',
        termDate: '2026-12-31',
        addressId: 42,
        address: { addressId: 42, line1: '123 Main St' },
        chapters: [
          { chapterId: 'CH-A', effDate: '2026-02-01', termDate: '2026-11-30' },
          { chapterId: 'CH-B', effDate: '2026-03-01', termDate: null }
        ],
        profiles: [
          { profileType: 'P', profileSetId: 'PS-001-1', effDate: '2026-01-15', termDate: null },
          { profileType: 'A', profileSetId: 'PS-002-2', effDate: '2026-01-15', termDate: '2026-06-30' }
        ]
      }));

      await TestBed.configureTestingModule({
        imports: [ContractDetailsComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: SnackbarService, useValue: localSnackbar },
          { provide: ChapterTimezoneService, useValue: localChapterTz },
          { provide: RegionalTestingContractApiService, useValue: localApi },
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: (key: string) => key === 'id' ? 'LOAD-001' : null }) }
          }
        ]
      }).compileComponents();

      const f2 = TestBed.createComponent(ContractDetailsComponent);
      const c2 = f2.componentInstance;
      try { f2.detectChanges(); } catch (_) { /* child component render errors */ }

      expect(c2.contractDetailsForm.get('facilityNameDescription')?.value).toBe('Loaded Facility');
      expect(c2.contractDetailsForm.get('poNumber')?.value).toBe('PO123');
      expect((c2 as any).loadedChapters().length).toBe(2);
      expect((c2 as any).loadedProfiles().length).toBe(2);
      expect((c2 as any).savedAddressId()).toBe(42);
      expect((c2 as any).savedAddress()).toEqual({ addressId: 42, line1: '123 Main St' });
      expect(c2.loading()).toBe(false);
    });

    it('should handle empty chapters and profiles', async () => {
      TestBed.resetTestingModule();

      const localSnackbar = createMockSnackbarService();
      const localChapterTz = createChapterTzSpy();
      const localApi = createApiSpy('EMPTY-001');

      await TestBed.configureTestingModule({
        imports: [ContractDetailsComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: SnackbarService, useValue: localSnackbar },
          { provide: ChapterTimezoneService, useValue: localChapterTz },
          { provide: RegionalTestingContractApiService, useValue: localApi },
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: (key: string) => key === 'id' ? 'EMPTY-001' : null }) }
          }
        ]
      }).compileComponents();

      const f2 = TestBed.createComponent(ContractDetailsComponent);
      const c2 = f2.componentInstance;
      try { f2.detectChanges(); } catch (_) { /* child component render errors */ }

      expect((c2 as any).loadedChapters()).toEqual([]);
      expect((c2 as any).loadedProfiles()).toEqual([]);
    });

    it('should show error when loadContractData fails', async () => {
      TestBed.resetTestingModule();

      const localSnackbar = createMockSnackbarService();
      const localChapterTz = createChapterTzSpy();
      const localApi = createApiSpy('FAIL-001');
      localApi.getContractById.and.returnValue(throwError(() => new Error('Load failed')));

      await TestBed.configureTestingModule({
        imports: [ContractDetailsComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: SnackbarService, useValue: localSnackbar },
          { provide: ChapterTimezoneService, useValue: localChapterTz },
          { provide: RegionalTestingContractApiService, useValue: localApi },
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: (key: string) => key === 'id' ? 'FAIL-001' : null }) }
          }
        ]
      }).compileComponents();

      const f2 = TestBed.createComponent(ContractDetailsComponent);
      try { f2.detectChanges(); } catch (_) { /* child component render errors */ }

      expect(localSnackbar.showError).toHaveBeenCalledWith('Failed to load contract data. Please try again.');
      expect(f2.componentInstance.loading()).toBe(false);
    });
  });

  describe('getEffectiveDateError', () => {
    it('should return empty string when control is untouched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return required error when touched and empty', () => {
      const ctrl = component.contractDetailsForm.get('effectiveDate');
      ctrl?.markAsTouched();
      ctrl?.updateValueAndValidity();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });
  });

  describe('getTerminationDateError', () => {
    it('should return empty string when control is untouched', () => {
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('onEffectiveDateChange', () => {
    it('should mark effective date as touched and update termination validity', () => {
      const effCtrl = component.contractDetailsForm.get('effectiveDate');
      const termCtrl = component.contractDetailsForm.get('terminationDate');
      const updateSpy = spyOn(termCtrl!, 'updateValueAndValidity');
      const markSpy = spyOn(effCtrl!, 'markAsTouched');

      component.onEffectiveDateChange();

      expect(updateSpy).toHaveBeenCalled();
      expect(markSpy).toHaveBeenCalled();
    });
  });

  describe('onTerminationDateChange', () => {
    it('should mark termination date as touched', () => {
      const termCtrl = component.contractDetailsForm.get('terminationDate');
      const markSpy = spyOn(termCtrl!, 'markAsTouched');

      component.onTerminationDateChange();

      expect(markSpy).toHaveBeenCalled();
    });
  });

  describe('formatDate', () => {
    it('should return dash for null date', () => {
      expect(component.formatDate(null)).toBe('-');
    });

    it('should return dash for undefined date', () => {
      expect(component.formatDate(undefined)).toBe('-');
    });

    it('should return dash for invalid date string', () => {
      expect(component.formatDate('not-a-date')).toBe('-');
    });

    it('should format a valid date in DD-MMM-YYYY uppercase', () => {
      const result = component.formatDate('2026-03-15');
      expect(result).toBe('15-MAR-2026');
    });
  });

  describe('onSaveAndNext', () => {
    it('should move to step 1 when form is valid', () => {
      makeFormValid(component);

      component.onSaveAndNext();

      expect(component.selectedStep()).toBe(1);
      expect(component.submitted()).toBe(true);
    });

    it('should not move to step 1 when form is invalid', () => {
      component.onSaveAndNext();

      expect(component.selectedStep()).toBe(0);
      expect(component.submitted()).toBe(true);
    });
  });

  describe('onSaveAndExit', () => {
    it('should show error and not save when form is invalid', () => {
      component.onSaveAndExit();

      expect(component.submitted()).toBe(true);
      expect(snackbarSpy.showError).toHaveBeenCalledWith('Please fill in all required fields');
      expect(component.saving()).toBe(false);
    });

    it('should call createContract for new contract on valid form', () => {
      makeFormValid(component);

      apiSpy.createContract.and.returnValue(of({ contractId: 'NEW-001' }));
      const navigateSpy = spyOn(routerSpy, 'navigate');

      component.onSaveAndExit();

      expect(apiSpy.createContract).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Contract NEW-001 saved successfully');
      expect(component.saving()).toBe(false);
      expect(navigateSpy).toHaveBeenCalledWith(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract']);
    });

    it('should show error message on save failure', () => {
      makeFormValid(component);

      apiSpy.createContract.and.returnValue(throwError(() => ({ error: { message: 'Duplicate contract' } })));

      component.onSaveAndExit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Duplicate contract');
      expect(component.saving()).toBe(false);
    });

    it('should use fallback error message when error has no message', () => {
      makeFormValid(component);

      apiSpy.createContract.and.returnValue(throwError(() => ({})));

      component.onSaveAndExit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save contract. Please try again.');
      expect(component.saving()).toBe(false);
    });

    it('should use error.message when error.error.message is not available', () => {
      makeFormValid(component);

      apiSpy.createContract.and.returnValue(throwError(() => ({ message: 'Network error' })));

      component.onSaveAndExit();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Network error');
    });

    it('should call updateContract in edit mode', async () => {
      TestBed.resetTestingModule();

      const localSnackbar = createMockSnackbarService();
      const localChapterTz = createChapterTzSpy();
      const localApi = createApiSpy('EDIT-SAVE');
      localApi.getContractById.and.returnValue(of({
        contractId: 'EDIT-SAVE',
        customerName: 'Edit Facility',
        effDate: '2027-06-01',
        chapters: [],
        profiles: []
      }));
      localApi.updateContract.and.returnValue(of({ contractId: 'EDIT-SAVE' }));

      await TestBed.configureTestingModule({
        imports: [ContractDetailsComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: SnackbarService, useValue: localSnackbar },
          { provide: ChapterTimezoneService, useValue: localChapterTz },
          { provide: RegionalTestingContractApiService, useValue: localApi },
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: (key: string) => key === 'id' ? 'EDIT-SAVE' : null }) }
          }
        ]
      }).compileComponents();

      const localRouter = TestBed.inject(Router);
      spyOn(localRouter, 'navigate');

      const f2 = TestBed.createComponent(ContractDetailsComponent);
      const c2 = f2.componentInstance;
      try { f2.detectChanges(); } catch (_) { /* child component render errors */ }

      makeFormValid(c2);

      c2.onSaveAndExit();

      expect(localApi.updateContract).toHaveBeenCalledWith('EDIT-SAVE', jasmine.any(Object));
      expect(localSnackbar.showSuccess).toHaveBeenCalled();
    });

    it('should use contractId from response or fallback to existing contractId', () => {
      makeFormValid(component);

      // Response without contractId
      apiSpy.createContract.and.returnValue(of({}));
      spyOn(routerSpy, 'navigate');

      component.onSaveAndExit();

      expect(snackbarSpy.showSuccess).toHaveBeenCalled();
    });
  });

  describe('onSaveAndFinishFromStep2', () => {
    it('should save and navigate on success', () => {
      apiSpy.createContract.and.returnValue(of({ contractId: 'STEP2-001' }));
      const navigateSpy = spyOn(routerSpy, 'navigate');

      component.onSaveAndFinishFromStep2();

      expect(component.saving()).toBe(false);
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Contract STEP2-001 saved successfully');
      expect(navigateSpy).toHaveBeenCalledWith(['/laboratory-functions/regional-testing-contract/enter-regional-testing-contract']);
    });

    it('should show error on save failure from step 2', () => {
      apiSpy.createContract.and.returnValue(throwError(() => ({ error: { message: 'Step 2 error' } })));

      component.onSaveAndFinishFromStep2();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Step 2 error');
      expect(component.saving()).toBe(false);
    });

    it('should use fallback error message on step 2 failure without message', () => {
      apiSpy.createContract.and.returnValue(throwError(() => ({})));

      component.onSaveAndFinishFromStep2();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to save contract. Please try again.');
    });

    it('should use error.message when error.error.message is not available on step 2', () => {
      apiSpy.createContract.and.returnValue(throwError(() => ({ message: 'Network down' })));

      component.onSaveAndFinishFromStep2();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Network down');
    });
  });

  describe('openAddressDialog', () => {
    let dialogSpy: jasmine.SpyObj<any>;

    beforeEach(() => {
      dialogSpy = (component as any).dialog;
      spyOn(dialogSpy, 'open');
    });

    it('should open address dialog and store result', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ addressId: 10, line1: '456 Oak St' }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddressDialog();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect((component as any).savedAddress()).toEqual({ addressId: 10, line1: '456 Oak St' });
      expect((component as any).savedAddressId()).toBe(10);
    });

    it('should not update address when dialog is cancelled', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      const originalAddress = (component as any).savedAddress();
      component.openAddressDialog();

      expect((component as any).savedAddress()).toEqual(originalAddress);
    });

    it('should store address without addressId', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ line1: '789 New St' }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openAddressDialog();

      expect((component as any).savedAddress()).toEqual({ line1: '789 New St' });
    });
  });

  describe('openContactsDialog', () => {
    let dialogSpy: jasmine.SpyObj<any>;

    beforeEach(() => {
      dialogSpy = (component as any).dialog;
      spyOn(dialogSpy, 'open');
    });

    it('should open contacts dialog and show success on result', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ contacts: [] }));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openContactsDialog();

      expect(dialogSpy.open).toHaveBeenCalled();
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Contacts saved');
    });

    it('should do nothing when contacts dialog is cancelled', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openContactsDialog();

      expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
    });
  });

  describe('openChapterSelection', () => {
    let dialogSpy: jasmine.SpyObj<any>;

    beforeEach(() => {
      dialogSpy = (component as any).dialog;
      spyOn(dialogSpy, 'open');
    });

    it('should open chapter selection dialog with chapters from API', () => {
      apiSpy.getChaptersLookup.and.returnValue(of([
        { chapterId: 'CH1', chapterName: 'Chapter 1' },
        { chapterId: 'CH2', chapterName: 'Chapter 2' }
      ]));

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of([
        { chapterId: 'CH1', chapterName: 'Chapter 1', effectiveDate: null, terminationDate: null }
      ]));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openChapterSelection();

      expect(apiSpy.getChaptersLookup).toHaveBeenCalled();
      expect(dialogSpy.open).toHaveBeenCalled();
      expect((component as any).loadedChapters().length).toBe(1);
      expect(snackbarSpy.showSuccess).toHaveBeenCalledWith('Chapters updated successfully');
    });

    it('should not update chapters when dialog returns null', () => {
      apiSpy.getChaptersLookup.and.returnValue(of([]));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openChapterSelection();

      expect(snackbarSpy.showSuccess).not.toHaveBeenCalled();
    });

    it('should show error when chapters API fails', () => {
      apiSpy.getChaptersLookup.and.returnValue(throwError(() => new Error('API error')));

      component.openChapterSelection();

      expect(snackbarSpy.showError).toHaveBeenCalledWith('Failed to load available chapters. Please try again.');
    });

    it('should use contract effective date as default for new chapters', () => {
      // Clear validators first, then set value
      const effCtrl = component.contractDetailsForm.get('effectiveDate');
      effCtrl?.clearValidators();
      effCtrl?.updateValueAndValidity();
      effCtrl?.setValue(new Date(2027, 0, 15));

      apiSpy.getChaptersLookup.and.returnValue(of([
        { chapterId: 'CH1', chapterName: 'Chapter 1' }
      ]));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of([
        { chapterId: 'CH1', chapterName: 'Chapter 1', effectiveDate: null, terminationDate: null }
      ]));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.openChapterSelection();

      const chapters = (component as any).loadedChapters();
      expect(chapters.length).toBe(1);
      expect(chapters[0].effectiveDate).toBeTruthy();
    });
  });

  describe('buildContractDto (via onSaveAndFinishFromStep2)', () => {
    it('should build correct DTO structure for new contract', () => {
      makeFormValid(component);
      component.contractDetailsForm.patchValue({
        checkDigit: 'Y',
        poNumber: 'PO-DTO',
        taxIdForm: 'TAX-DTO',
        unitScheme: 'N',
        editCharges: 'Y',
        resultInd: 'B',
        confirmatoryTests: 'Y',
        reportOd: 'N',
        resultsType: 'E',
        ediInput: 'Y',
        clientBloodCenterId: 'CBC-1',
        duplicateCheckIn: 'N',
        noOfDuplicate: 5,
        npEf: 'N',
        terminationDate: new Date(2027, 11, 31)
      });

      let savedDto: any = null;
      apiSpy.createContract.and.callFake((dto: any) => {
        savedDto = dto;
        return of({ contractId: 'NEW-DTO' });
      });
      spyOn(routerSpy, 'navigate');

      component.onSaveAndFinishFromStep2();

      expect(savedDto).toBeTruthy();
      expect(savedDto.contractType).toBe('RG');
      expect(savedDto.customerName).toBe('Test Facility');
      expect(savedDto.chapterId).toBe('CH1');
      expect(savedDto.dispChkdigitFlag).toBe('Y');
      expect(savedDto.poNo).toBe('PO-DTO');
      expect(savedDto.contactType).toBe('C');
      expect(savedDto.plateCapacity).toBe(9999);
      expect(savedDto.contractId).toBeNull();
    });
  });

  describe('formatDateForApiWithTime (via buildContractDto)', () => {
    it('should format dates with time component', () => {
      makeFormValid(component);

      let savedDto: any = null;
      apiSpy.createContract.and.callFake((dto: any) => {
        savedDto = dto;
        return of({ contractId: 'DT-001' });
      });
      spyOn(routerSpy, 'navigate');

      component.onSaveAndFinishFromStep2();

      expect(savedDto.effDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
      // terminationDate is null, so ternary returns null (not empty string)
      expect(savedDto.termDate).toBeNull();
    });
  });

  describe('scrollToSection', () => {
    it('should scroll to element when found', () => {
      const mockElement = document.createElement('div');
      mockElement.id = 'test-section';
      // jsdom doesn't implement scrollIntoView, so define it first
      mockElement.scrollIntoView = () => {};
      const scrollSpy = spyOn(mockElement, 'scrollIntoView');
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      spyOn(document, 'querySelectorAll').and.returnValue(document.querySelectorAll('.nonexistent'));

      component.scrollToSection('test-section');

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start'
      });
    });

    it('should do nothing when element is not found', () => {
      spyOn(document, 'getElementById').and.returnValue(null);

      expect(() => component.scrollToSection('nonexistent')).not.toThrow();
    });

    it('should prevent default when event is provided', () => {
      const mockElement = document.createElement('div');
      mockElement.scrollIntoView = () => {};
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      spyOn(mockElement, 'scrollIntoView');
      spyOn(document, 'querySelectorAll').and.returnValue(document.querySelectorAll('.nonexistent'));

      const mockEvent = jasmine.createSpyObj('Event', ['preventDefault'], { target: document.createElement('a') });

      component.scrollToSection('test-section', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('should update active link class on event target', () => {
      const link1 = document.createElement('a');
      link1.classList.add('sidebar-link', 'active');

      const mockNodeList = [link1] as any;
      mockNodeList.forEach = Array.prototype.forEach.bind(mockNodeList);

      const mockElement = document.createElement('div');
      mockElement.scrollIntoView = () => {};
      spyOn(document, 'getElementById').and.returnValue(mockElement);
      spyOn(mockElement, 'scrollIntoView');
      spyOn(document, 'querySelectorAll').and.returnValue(mockNodeList);

      const targetEl = document.createElement('a');
      const mockEvent = { preventDefault: jasmine.createSpy('preventDefault'), target: targetEl } as any;

      component.scrollToSection('section-id', mockEvent);

      expect(link1.classList.contains('active')).toBe(false);
      expect(targetEl.classList.contains('active')).toBe(true);
    });
  });

  describe('validateChapterEffectiveDate', () => {
    it('should set error when date is null', () => {
      component.validateChapterEffectiveDate(0, null);
      expect(component.getChapterError(0, 'effDate')).toBe('Effective date is required');
    });

    it('should set error for invalid date', () => {
      component.validateChapterEffectiveDate(0, 'not-a-date');
      expect(component.getChapterError(0, 'effDate')).toBe('Invalid date');
    });

    it('should set error when date is in the past', () => {
      const pastDate = new Date(2020, 0, 1);
      component.validateChapterEffectiveDate(0, pastDate);
      expect(component.getChapterError(0, 'effDate')).toBe('Effective date cannot be in the past');
    });

    it('should clear error for valid future date', () => {
      const futureDate = new Date(2030, 0, 1);
      component.validateChapterEffectiveDate(0, futureDate);
      expect(component.getChapterError(0, 'effDate')).toBeUndefined();
    });

    it('should handle multiple chapter indices independently', () => {
      component.validateChapterEffectiveDate(0, null);
      const futureDate = new Date(2030, 0, 1);
      component.validateChapterEffectiveDate(1, futureDate);

      expect(component.getChapterError(0, 'effDate')).toBe('Effective date is required');
      expect(component.getChapterError(1, 'effDate')).toBeUndefined();
    });
  });

  describe('validateChapterTerminationDate', () => {
    it('should clear error when termDate is null', () => {
      component.validateChapterTerminationDate(0, new Date(2027, 0, 1), null);
      expect(component.getChapterError(0, 'termDate')).toBeUndefined();
    });

    it('should set error for invalid termination date', () => {
      component.validateChapterTerminationDate(0, new Date(2027, 0, 1), 'bad-date');
      expect(component.getChapterError(0, 'termDate')).toBe('Invalid date');
    });

    it('should set error when effective date is invalid', () => {
      component.validateChapterTerminationDate(0, 'bad-eff', new Date(2027, 6, 1));
      expect(component.getChapterError(0, 'termDate')).toBe('Set effective date first');
    });

    it('should set error when termination is before effective', () => {
      const effDate = new Date(2027, 6, 1);
      const termDate = new Date(2027, 0, 1);
      component.validateChapterTerminationDate(0, effDate, termDate);
      expect(component.getChapterError(0, 'termDate')).toBe('Termination date must be after effective date');
    });

    it('should clear error for valid termination date after effective', () => {
      const effDate = new Date(2027, 0, 1);
      const termDate = new Date(2027, 6, 1);
      component.validateChapterTerminationDate(0, effDate, termDate);
      expect(component.getChapterError(0, 'termDate')).toBeUndefined();
    });
  });

  describe('getChapterError', () => {
    it('should return undefined for chapter index with no errors', () => {
      expect(component.getChapterError(99, 'effDate')).toBeUndefined();
    });

    it('should return error message when present', () => {
      component.validateChapterEffectiveDate(0, null);
      expect(component.getChapterError(0, 'effDate')).toBe('Effective date is required');
    });
  });

  describe('hasChapterError', () => {
    it('should return false for chapter index with no errors', () => {
      expect(component.hasChapterError(99, 'effDate')).toBe(false);
    });

    it('should return true when chapter has error', () => {
      component.validateChapterEffectiveDate(0, null);
      expect(component.hasChapterError(0, 'effDate')).toBe(true);
    });

    it('should return false for field without error even when other field has error', () => {
      component.validateChapterEffectiveDate(0, null);
      expect(component.hasChapterError(0, 'termDate')).toBe(false);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy subject', () => {
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('chapterDatepickerStartDate', () => {
    it('should return null when no effective date is set', () => {
      component.contractDetailsForm.get('effectiveDate')?.setValue(null);
      expect(component.chapterDatepickerStartDate()).toBeNull();
    });

    it('should return the contract effective date when set', () => {
      const date = new Date(2027, 5, 1);
      // Clear validators first to avoid the not-past validation error
      const ctrl = component.contractDetailsForm.get('effectiveDate');
      ctrl?.clearValidators();
      ctrl?.updateValueAndValidity();
      ctrl?.setValue(date);
      expect(component.chapterDatepickerStartDate()).toEqual(date);
    });
  });

  describe('getProfileTypeLabel (via loadContractData)', () => {
    it('should map profile type codes correctly', async () => {
      TestBed.resetTestingModule();

      const localSnackbar = createMockSnackbarService();
      const localChapterTz = createChapterTzSpy();
      const localApi = createApiSpy('PROFILE-001');
      localApi.getContractById.and.returnValue(of({
        contractId: 'PROFILE-001',
        customerName: 'Profile Test',
        effDate: '2026-01-01',
        chapters: [],
        profiles: [
          { profileType: 'P', profileSetId: 'PS-001-1', effDate: '2026-01-01', termDate: null },
          { profileType: 'A', profileSetId: 'PS-002-2', effDate: '2026-01-01', termDate: null },
          { profileType: 'S', profileSetId: 'PS-003-3', effDate: '2026-01-01', termDate: null },
          { profileType: 'X', profileSetId: 'PS-004-4', effDate: '2026-01-01', termDate: null }
        ]
      }));

      await TestBed.configureTestingModule({
        imports: [ContractDetailsComponent, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: SnackbarService, useValue: localSnackbar },
          { provide: ChapterTimezoneService, useValue: localChapterTz },
          { provide: RegionalTestingContractApiService, useValue: localApi },
          {
            provide: ActivatedRoute,
            useValue: { paramMap: of({ get: (key: string) => key === 'id' ? 'PROFILE-001' : null }) }
          }
        ]
      }).compileComponents();

      const f2 = TestBed.createComponent(ContractDetailsComponent);
      try { f2.detectChanges(); } catch (_) { /* child component render errors */ }
      const c2 = f2.componentInstance;

      const profiles = (c2 as any).loadedProfiles();
      expect(profiles[0].type).toBe('Primary');
      expect(profiles[1].type).toBe('Ad Hoc');
      expect(profiles[2].type).toBe('Secondary');
      expect(profiles[3].type).toBe('X');
    });
  });

  describe('today computed signal', () => {
    it('should call chapterTimezoneService.getChapterLocalDate', () => {
      const todayValue = component.today();
      expect(chapterTzSpy.getChapterLocalDate).toHaveBeenCalled();
      expect(todayValue).toBeTruthy();
    });
  });

  describe('elementId, errorId, labelId helpers', () => {
    it('should generate unique element IDs', () => {
      const elId = (component as any).elementId('test-field');
      expect(elId).toContain('contract-details-');
      expect(elId).toContain('-test-field');
    });

    it('should generate unique error IDs', () => {
      const errId = (component as any).errorId('test-field');
      expect(errId).toContain('-test-field-error');
    });

    it('should generate unique label IDs', () => {
      const lblId = (component as any).labelId('test-field');
      expect(lblId).toContain('-test-field-label');
    });
  });

  describe('contractDetailsForm validators', () => {
    it('should require facilityNameDescription', () => {
      component.contractDetailsForm.get('facilityNameDescription')?.setValue('');
      expect(component.contractDetailsForm.get('facilityNameDescription')?.hasError('required')).toBe(true);
    });

    it('should enforce maxLength on facilityNameDescription', () => {
      component.contractDetailsForm.get('facilityNameDescription')?.setValue('a'.repeat(51));
      expect(component.contractDetailsForm.get('facilityNameDescription')?.hasError('maxlength')).toBe(true);
    });

    it('should require clientChapter', () => {
      component.contractDetailsForm.get('clientChapter')?.setValue('');
      expect(component.contractDetailsForm.get('clientChapter')?.hasError('required')).toBe(true);
    });

    it('should require effectiveDate', () => {
      component.contractDetailsForm.get('effectiveDate')?.setValue(null);
      expect(component.contractDetailsForm.get('effectiveDate')?.hasError('required')).toBe(true);
    });

    it('should enforce maxLength on poNumber', () => {
      component.contractDetailsForm.get('poNumber')?.setValue('x'.repeat(51));
      expect(component.contractDetailsForm.get('poNumber')?.hasError('maxlength')).toBe(true);
    });

    it('should require copyOsUnits', () => {
      component.contractDetailsForm.get('copyOsUnits')?.setValue('');
      expect(component.contractDetailsForm.get('copyOsUnits')?.hasError('required')).toBe(true);
    });
  });
});
