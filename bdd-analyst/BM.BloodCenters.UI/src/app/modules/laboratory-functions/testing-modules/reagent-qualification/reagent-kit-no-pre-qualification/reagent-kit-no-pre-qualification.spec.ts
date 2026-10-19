import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import moment from 'moment';

import { ReagentKitNoPreQualificationComponent } from './reagent-kit-no-pre-qualification';
import { ReagentKitNoPreQualificationService } from './services/reagent-kit-no-pre-qualification.service';
import { TestIdOption, TestKitDetailDto, ReagentDetailDto, ReagentLovDto, TestGroupDto } from './models/reagent-kit-no-pre-qualification.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { LoginService } from '@shared/services/login.service';
import { ApiService } from '@shared/services/api.service';
import { MatDialog } from '@angular/material/dialog';
import { createMockSnackbarService, createMockHeaderService } from '@shared/testing/common-mocks';

describe('ReagentKitNoPreQualificationComponent', () => {
  let component: ReagentKitNoPreQualificationComponent;
  let c: any;
  let fixture: ComponentFixture<ReagentKitNoPreQualificationComponent>;
  let serviceSpy: jasmine.SpyObj<ReagentKitNoPreQualificationService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let headerServiceSpy: any;
  let pageHeaderServiceSpy: any;
  let loginServiceSpy: jasmine.SpyObj<LoginService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let chapterSubject: Subject<void>;

  const mockTestIds: TestIdOption[] = [
    { testId: 'Jsa', testDescription: 'Sutter a (Jsa) Antigen' },
    { testId: 'A01', testDescription: 'ABO Group' },
    { testId: 'B01', testDescription: '' },
  ];

  const mockTestKits: TestKitDetailDto[] = [
    { testKitId: '9109-JSA', qcExpiryDate: '2031-12-31T23:59:00', apprLicFlag: 'L', insertDate: '2025-01-15T10:30:00' },
    { testKitId: '9141-JSA', qcExpiryDate: '2031-12-31T23:59:00', apprLicFlag: 'A', insertDate: '2025-01-16T11:00:00' },
  ];

  const mockReagents: ReagentDetailDto[] = [
    { reagentType: 'R', reagentName: 'Jsa Bottle', supplierCode: 'ORTHO', lotNumber: 'JSAL', expiryDate: '2031-12-31T23:59:00' },
    { reagentType: 'C', reagentName: 'Cell JSA negative', supplierCode: 'IMMUC', lotNumber: 'JSAN_U', expiryDate: '2031-12-31T23:59:00' },
  ];

  const mockReagentLov: ReagentLovDto[] = [
    { reagentId: 'R001', reagentCode: 'RC1', reagentName: 'Jsa Bottle', supplierCode: 'ORTHO', lotNumber: 'JSAL', expiryDate: '2031-12-31T23:59:00', kitLotNumber: 'KL1' },
    { reagentId: 'R002', reagentCode: 'RC2', reagentName: 'Anti-D', supplierCode: 'IMMUC', lotNumber: 'AD01', expiryDate: '2020-01-01T00:00:00', kitLotNumber: 'KL2' },
  ];

  const mockTestGroup: TestGroupDto = { isAgMag: false };
  const mockAgMagGroup: TestGroupDto = { isAgMag: true, requiresApprovalLicense: true };

  function setupComponent(): void {
    fixture = TestBed.createComponent(ReagentKitNoPreQualificationComponent);
    component = fixture.componentInstance;
    c = component as any;
  }

  function initAndRetrieve(): void {
    fixture.detectChanges();
    component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
    component.onRetrieve();
    tick();
    fixture.detectChanges();
  }

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj('ReagentKitNoPreQualificationService', [
      'getValidTests', 'getTestKits', 'getReagents', 'getReagentLov', 'getTestGroup', 'createTestKit', 'updateTestKit',
    ]);
    snackbarServiceSpy = createMockSnackbarService();
    chapterSubject = new Subject<void>();
    headerServiceSpy = createMockHeaderService({ chapterChanged$: chapterSubject.asObservable() });
    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getStoredUsername']);
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    pageHeaderServiceSpy = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({
        title: 'Reagent Kit (No Pre-Qualification)',
        subtitle: 'Create reagent kit IDs for tests that do not require reagent pre-qualification before use.',
      }),
    });

    loginServiceSpy.getStoredUsername.and.returnValue('testuser');
    apiServiceSpy.get.and.returnValue(of({ item: { labCode: '01' } }));
    serviceSpy.getValidTests.and.returnValue(of(mockTestIds));
    serviceSpy.getTestKits.and.returnValue(of(mockTestKits));
    serviceSpy.getReagents.and.returnValue(of(mockReagents));
    serviceSpy.getTestGroup.and.returnValue(of(mockTestGroup));
    serviceSpy.getReagentLov.and.returnValue(of(mockReagentLov));

    TestBed.configureTestingModule({
      imports: [ReagentKitNoPreQualificationComponent, NoopAnimationsModule],
      providers: [
        { provide: ReagentKitNoPreQualificationService, useValue: serviceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: HeaderService, useValue: headerServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } },
      ],
    });

    setupComponent();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. COMPONENT CREATION & INITIALIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Component Creation', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should have page header config with Home breadcrumb', () => {
      expect(component.pageHeaderConfig.breadcrumbs).toBeDefined();
      expect(component.pageHeaderConfig.breadcrumbs![0].label).toBe('Home');
    });
  });

  describe('Initialization', () => {
    it('should load test IDs on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(serviceSpy.getValidTests).toHaveBeenCalled();
      expect(c.testIds()).toEqual(mockTestIds);
    }));

    it('should call loadUserLabCode on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(loginServiceSpy.getStoredUsername).toHaveBeenCalled();
      expect(apiServiceSpy.get).toHaveBeenCalled();
    }));

    it('should initialize filter form with required validators', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('showExpired')).toBeTruthy();
      expect(component.filterForm.get('testId')).toBeTruthy();
      component.filterForm.get('showExpired')!.setValue('');
      component.filterForm.get('testId')!.setValue('');
      expect(component.filterForm.invalid).toBeTrue();
    });

    it('should default showExpired to empty string', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('showExpired')!.value).toBe('');
    });

    it('should default testId to empty string', () => {
      fixture.detectChanges();
      expect(component.filterForm.get('testId')!.value).toBe('');
    });

    it('should set formDirty when filter form value changes', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.markAsDirty();
      component.filterForm.patchValue({ showExpired: 'Y' });
      tick();
      expect(c.formDirty()).toBeTrue();
    }));

    it('should handle test IDs loading error', fakeAsync(() => {
      serviceSpy.getValidTests.and.returnValue(throwError(() => new Error('API Error')));
      setupComponent();
      fixture.detectChanges();
      tick();
      expect(c.testIds()).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load test IDs.');
    }));

    it('should set loadingTestIds during data load', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(c.loadingTestIds()).toBeFalse();
    }));

    it('should expose form controls via f getter', () => {
      fixture.detectChanges();
      expect(component.f['showExpired']).toBe(component.filterForm.controls['showExpired']);
      expect(component.f['testId']).toBe(component.filterForm.controls['testId']);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2a. CHAPTER CHANGE HANDLING
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Chapter Change Handling', () => {
    it('should clear and reload test IDs when chapter changes', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      serviceSpy.getValidTests.calls.reset();
      chapterSubject.next();
      tick();
      expect(serviceSpy.getValidTests).toHaveBeenCalled();
      expect(c.testKitList()).toEqual([]);
      expect(c.hasSearched()).toBeFalse();
    }));

    it('should reset form dirty state on chapter change', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      c.formDirty.set(true);
      chapterSubject.next();
      tick();
      expect(c.formDirty()).toBeFalse();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 2b. LAB CODE 99 RESTRICTION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Lab Code 99 Restriction', () => {
    it('should deny access when lab code is 99', fakeAsync(() => {
      apiServiceSpy.get.and.returnValue(of({ item: { labCode: '99' } }));
      setupComponent();
      fixture.detectChanges();
      tick();
      expect(c.formAccessDenied()).toBeTrue();
      expect(component.filterForm.disabled).toBeTrue();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Access denied: Users with testing lab code 99 cannot access this form.');
    }));

    it('should allow access when lab code is not 99', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(c.formAccessDenied()).toBeFalse();
      expect(component.filterForm.disabled).toBeFalse();
    }));

    it('should handle testinG_LAB_CODE field name', fakeAsync(() => {
      apiServiceSpy.get.and.returnValue(of({ item: { testinG_LAB_CODE: '99' } }));
      setupComponent();
      fixture.detectChanges();
      tick();
      expect(c.formAccessDenied()).toBeTrue();
    }));

    it('should handle missing username gracefully', fakeAsync(() => {
      loginServiceSpy.getStoredUsername.and.returnValue(null as any);
      setupComponent();
      fixture.detectChanges();
      tick();
      expect(c.formAccessDenied()).toBeFalse();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. DROPDOWN OPTIONS & DISPLAY VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Dropdown Options', () => {
    it('should have showExpiredOptions with Y and N', () => {
      expect(component.showExpiredOptions).toEqual([
        { value: 'N', label: 'No' },
        { value: 'Y', label: 'Yes' },
      ]);
    });

    it('should have reagentTypeOptions with R, C, K', () => {
      expect(component.reagentTypeOptions.length).toBe(3);
      expect(component.reagentTypeOptions[0].value).toBe('R');
      expect(component.reagentTypeOptions[1].value).toBe('C');
      expect(component.reagentTypeOptions[2].value).toBe('K');
    });

    it('should have licenseFlagOptions with L, A, U', () => {
      expect(component.licenseFlagOptions.length).toBe(3);
      expect(component.licenseFlagOptions[0].value).toBe('L');
      expect(component.licenseFlagOptions[1].value).toBe('A');
      expect(component.licenseFlagOptions[2].value).toBe('U');
    });
  });

  describe('Display Computed Values', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should display selected expired label', fakeAsync(() => {
      component.filterForm.patchValue({ showExpired: 'N' });
      tick();
      expect(c.selectedExpiredDisplay()).toBe('No');
    }));

    it('should display empty when no expired selected', () => {
      expect(c.selectedExpiredDisplay()).toBe('');
    });

    it('should display selected test ID with description', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'Jsa' });
      tick();
      expect(c.selectedTestIdDisplay()).toBe('Jsa - Sutter a (Jsa) Antigen');
    }));

    it('should display test ID only when no description', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'B01' });
      tick();
      expect(c.selectedTestIdDisplay()).toBe('B01');
    }));

    it('should display empty when no test ID selected', () => {
      expect(c.selectedTestIdDisplay()).toBe('');
    });
  });

  describe('Test Description Auto-Population', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should auto-populate test description when test ID is selected', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'Jsa' });
      tick();
      expect(c.selectedTestDescription()).toBe('Sutter a (Jsa) Antigen');
    }));

    it('should show empty description when no test ID is selected', () => {
      expect(c.selectedTestDescription()).toBe('');
    });

    it('should show empty description for unknown test ID', fakeAsync(() => {
      component.filterForm.patchValue({ testId: 'UNKNOWN' });
      tick();
      expect(c.selectedTestDescription()).toBe('');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. SEARCH FILTERING
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Search Filtering', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should filter test IDs by search text', fakeAsync(() => {
      c.testIdSearch.set('abo');
      tick();
      const filtered = c.filteredTestIds();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('A01');
    }));

    it('should return all test IDs when search is empty', () => {
      expect(c.filteredTestIds().length).toBe(3);
    });

    it('should filter expired options by search text', fakeAsync(() => {
      c.expiredSearch.set('yes');
      tick();
      const filtered = c.filteredExpiredOptions();
      expect(filtered.length).toBe(1);
      expect(filtered[0].value).toBe('Y');
    }));

    it('should return all expired options when search is empty', () => {
      expect(c.filteredExpiredOptions().length).toBe(2);
    });

    it('should filter test IDs case-insensitively', fakeAsync(() => {
      c.testIdSearch.set('JSA');
      tick();
      const filtered = c.filteredTestIds();
      expect(filtered.length).toBe(1);
      expect(filtered[0].testId).toBe('Jsa');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. TRUNCATION CHECKS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Truncation Checks', () => {
    it('should detect expired text truncation', () => {
      const el = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;
      component.checkExpiredTruncation(el);
      expect(component.isExpiredTruncated).toBeTrue();
    });

    it('should detect non-truncated expired text', () => {
      const el = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      component.checkExpiredTruncation(el);
      expect(component.isExpiredTruncated).toBeFalse();
    });

    it('should detect test ID text truncation', () => {
      const el = { scrollWidth: 300, clientWidth: 100 } as HTMLElement;
      component.checkTestIdTruncation(el);
      expect(component.isTestIdTruncated).toBeTrue();
    });

    it('should detect non-truncated test ID text', () => {
      const el = { scrollWidth: 50, clientWidth: 100 } as HTMLElement;
      component.checkTestIdTruncation(el);
      expect(component.isTestIdTruncated).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. RETRIEVE FUNCTIONALITY
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Retrieve Functionality', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should retrieve test kits when form is valid', fakeAsync(() => {
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(serviceSpy.getTestKits).toHaveBeenCalledWith('Jsa', 'N');
      expect(c.testKitList().length).toBe(2);
      expect(c.hasSearched()).toBeTrue();
    }));

    it('should not retrieve when form is invalid', fakeAsync(() => {
      component.onRetrieve();
      tick();
      expect(serviceSpy.getTestKits).not.toHaveBeenCalled();
    }));

    it('should mark form as touched when retrieve called with invalid form', () => {
      component.onRetrieve();
      expect(component.filterForm.touched).toBeTrue();
    });

    it('should set loading state during retrieve', fakeAsync(() => {
      const kitsSubject = new Subject<TestKitDetailDto[]>();
      serviceSpy.getTestKits.and.returnValue(kitsSubject.asObservable());
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      expect(c.loading()).toBeTrue();
      kitsSubject.next(mockTestKits);
      kitsSubject.complete();
      tick();
      expect(c.loading()).toBeFalse();
    }));

    it('should auto-select first kit after retrieve', fakeAsync(() => {
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(c.selectedKitId()).toBe('9109-JSA');
    }));

    it('should clear error on new retrieve', fakeAsync(() => {
      c.error.set('old error');
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(c.error()).toBeNull();
    }));

    it('should reset create mode on retrieve', fakeAsync(() => {
      c.isCreateMode.set(true);
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(c.isCreateMode()).toBeFalse();
    }));

    it('should handle retrieve errors', fakeAsync(() => {
      serviceSpy.getTestKits.and.returnValue(throwError(() => new Error('API Error')));
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(c.testKitList().length).toBe(0);
      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should use showExpired Y value', fakeAsync(() => {
      component.filterForm.patchValue({ showExpired: 'Y', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(serviceSpy.getTestKits).toHaveBeenCalledWith('Jsa', 'Y');
    }));

    it('should not auto-select when no kits returned', fakeAsync(() => {
      serviceSpy.getTestKits.and.returnValue(of([]));
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(c.selectedKitId()).toBeNull();
    }));

    it('should reset detailDirty on retrieve', fakeAsync(() => {
      c.detailDirty.set(true);
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(c.detailDirty()).toBeFalse();
    }));

    it('should use default error message when error object is empty', fakeAsync(() => {
      serviceSpy.getTestKits.and.returnValue(throwError(() => ({})));
      component.filterForm.patchValue({ showExpired: 'N', testId: 'Jsa' });
      component.onRetrieve();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve reagent kits.');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. TEST GROUP (AG/MAG)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Test Group Check', () => {
    it('should check test group when test ID changes', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ testId: 'Jsa' });
      tick();
      expect(serviceSpy.getTestGroup).toHaveBeenCalledWith('Jsa');
    }));

    it('should set isAgMagTest for AG/MAG tests', fakeAsync(() => {
      serviceSpy.getTestGroup.and.returnValue(of(mockAgMagGroup));
      fixture.detectChanges();
      component.filterForm.patchValue({ testId: 'Jsa' });
      tick();
      expect(c.isAgMagTest()).toBeTrue();
    }));

    it('should set isAgMagTest false for non-AG tests', fakeAsync(() => {
      fixture.detectChanges();
      component.filterForm.patchValue({ testId: 'Jsa' });
      tick();
      expect(c.isAgMagTest()).toBeFalse();
    }));

    it('should handle test group API error', fakeAsync(() => {
      serviceSpy.getTestGroup.and.returnValue(throwError(() => new Error('err')));
      fixture.detectChanges();
      component.filterForm.patchValue({ testId: 'Jsa' });
      tick();
      expect(c.isAgMagTest()).toBeFalse();
    }));

    it('should set isAgMagTest true when only requiresApprovalLicense is true', fakeAsync(() => {
      serviceSpy.getTestGroup.and.returnValue(of({ isAgMag: false, requiresApprovalLicense: true }));
      fixture.detectChanges();
      component.filterForm.patchValue({ testId: 'Jsa' });
      tick();
      expect(c.isAgMagTest()).toBeTrue();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 8. CLEAR ALL
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Clear All Functionality', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should clear test kit list', () => {
      c.testKitList.set(mockTestKits);
      component.onClearAll();
      expect(c.testKitList()).toEqual([]);
    });

    it('should reset hasSearched', () => {
      c.hasSearched.set(true);
      component.onClearAll();
      expect(c.hasSearched()).toBeFalse();
    });

    it('should clear error', () => {
      c.error.set('Some error');
      component.onClearAll();
      expect(c.error()).toBeNull();
    });

    it('should reset formDirty', () => {
      c.formDirty.set(true);
      component.onClearAll();
      expect(c.formDirty()).toBeFalse();
    });

    it('should reset selectedKitId', () => {
      c.selectedKitId.set('9109-JSA');
      component.onClearAll();
      expect(c.selectedKitId()).toBeNull();
    });

    it('should reset isCreateMode', () => {
      c.isCreateMode.set(true);
      component.onClearAll();
      expect(c.isCreateMode()).toBeFalse();
    });

    it('should clear reagent rows', () => {
      c.reagentRows.set([{ reagentType: 'R', name: 'test', supplier: '', lotNo: '', expirationDate: '', isNew: true }]);
      component.onClearAll();
      expect(c.reagentRows()).toEqual([]);
    });

    it('should reset isAgMagTest', () => {
      c.isAgMagTest.set(true);
      component.onClearAll();
      expect(c.isAgMagTest()).toBeFalse();
    });

    it('should reset detailDirty', () => {
      c.detailDirty.set(true);
      component.onClearAll();
      expect(c.detailDirty()).toBeFalse();
    });

    it('should reset search controls', () => {
      c.expiredSearchControl.setValue('test');
      c.testIdSearchControl.setValue('search');
      component.onClearAll();
      expect(c.expiredSearchControl.value).toBe('');
      expect(c.testIdSearchControl.value).toBe('');
    });

    it('should reset kitSearchText', () => {
      c.kitSearchText.set('test');
      component.onClearAll();
      expect(c.kitSearchText()).toBe('');
    });

    it('should reset truncation flags', () => {
      component.isExpiredTruncated = true;
      component.isTestIdTruncated = true;
      component.onClearAll();
      expect(component.isExpiredTruncated).toBeFalse();
      expect(component.isTestIdTruncated).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 9. MASTER-DETAIL INTERACTION
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Master-Detail Interaction', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should auto-select first kit after retrieve', () => {
      expect(c.selectedKitId()).toBe('9109-JSA');
    });

    it('should load reagents when kit is selected', () => {
      expect(serviceSpy.getReagents).toHaveBeenCalledWith('9109-JSA', 'Jsa');
    });

    it('should map reagent details to rows', () => {
      const rows = c.reagentRows();
      expect(rows.length).toBe(2);
      expect(rows[0].reagentType).toBe('R');
      expect(rows[0].name).toBe('Jsa Bottle');
      expect(rows[0].isNew).toBeFalse();
    });

    it('should handle reagent loading error', fakeAsync(() => {
      serviceSpy.getReagents.and.returnValue(throwError(() => new Error('err')));
      c.selectKit('9141-JSA');
      tick();
      expect(c.reagentRows()).toEqual([]);
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load reagent details.');
    }));

    it('should select different kit on click', fakeAsync(() => {
      component.onKitSelected({ kitId: '9141-JSA', qcExpiration: '', licenseFlag: 'A' });
      tick();
      expect(c.selectedKitId()).toBe('9141-JSA');
    }));

    it('should exit create mode when kit is selected', fakeAsync(() => {
      c.isCreateMode.set(true);
      component.onKitSelected({ kitId: '9109-JSA', qcExpiration: '', licenseFlag: 'L' });
      tick();
      expect(c.isCreateMode()).toBeFalse();
    }));

    it('should reset detailDirty when kit is selected', fakeAsync(() => {
      c.detailDirty.set(true);
      component.onKitSelected({ kitId: '9141-JSA', qcExpiration: '', licenseFlag: 'A' });
      tick();
      expect(c.detailDirty()).toBeFalse();
    }));

    it('should identify selected kit', () => {
      expect(component.isKitSelected({ kitId: '9109-JSA', qcExpiration: '', licenseFlag: 'L' })).toBeTrue();
      expect(component.isKitSelected({ kitId: '9141-JSA', qcExpiration: '', licenseFlag: 'A' })).toBeFalse();
    });

    it('should not mark kit as selected in create mode', () => {
      c.isCreateMode.set(true);
      expect(component.isKitSelected({ kitId: '9109-JSA', qcExpiration: '', licenseFlag: 'L' })).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 10. TEST KIT ITEMS COMPUTED
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Test Kit Items Computed', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should derive kit items from test kit list', () => {
      const items = c.testKitItems();
      expect(items.length).toBe(2);
      expect(items[0].kitId).toBe('9109-JSA');
      expect(items[0].licenseFlag).toBe('L');
    });

    it('should filter kit items by search text', () => {
      c.kitSearchText.set('9141');
      const items = c.testKitItems();
      expect(items.length).toBe(1);
      expect(items[0].kitId).toBe('9141-JSA');
    });

    it('should return empty when no kits match search', () => {
      c.kitSearchText.set('NONEXISTENT');
      expect(c.testKitItems().length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 11. KIT SEARCH
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Kit Search', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should set search text on kit search', () => {
      component.onKitSearch('9141');
      expect(c.kitSearchText()).toBe('9141');
    });

    it('should auto-select first visible kit when current is filtered out', fakeAsync(() => {
      c.selectedKitId.set('9109-JSA');
      component.onKitSearch('9141');
      tick();
      expect(c.selectedKitId()).toBe('9141-JSA');
    }));

    it('should clear selection when no kits match search', fakeAsync(() => {
      component.onKitSearch('NONEXISTENT');
      tick();
      expect(c.selectedKitId()).toBeNull();
    }));

    it('should keep current selection when kit is still visible in results', fakeAsync(() => {
      c.selectedKitId.set('9109-JSA');
      component.onKitSearch('9109');
      tick();
      expect(c.selectedKitId()).toBe('9109-JSA');
    }));

    it('should clear reagent rows when no kits match search', fakeAsync(() => {
      component.onKitSearch('NONEXISTENT');
      tick();
      expect(c.reagentRows()).toEqual([]);
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 12. CREATE MODE
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Create New Test Kit', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should enter create mode', () => {
      component.onCreateNewTestKit();
      expect(c.isCreateMode()).toBeTrue();
    });

    it('should set selectedKitId to null', () => {
      component.onCreateNewTestKit();
      expect(c.selectedKitId()).toBeNull();
    });

    it('should initialize with one empty reagent row', () => {
      component.onCreateNewTestKit();
      expect(c.reagentRows().length).toBe(1);
      expect(c.reagentRows()[0].isNew).toBeTrue();
      expect(c.reagentRows()[0].reagentType).toBe('');
    });

    it('should reset QC expiration control', () => {
      c.newKitQcExpiration.setValue(new Date());
      component.onCreateNewTestKit();
      expect(c.newKitQcExpiration.value).toBeNull();
    });

    it('should reset license flag control', () => {
      c.newKitLicenseFlag.setValue('L');
      component.onCreateNewTestKit();
      expect(c.newKitLicenseFlag.value).toBeNull();
    });

    it('should reset reagent LOV map', () => {
      const map = new Map();
      map.set(0, mockReagentLov);
      c.reagentLovMap.set(map);
      component.onCreateNewTestKit();
      expect(c.reagentLovMap().size).toBe(0);
    });

    it('should reset detailDirty', () => {
      c.detailDirty.set(true);
      component.onCreateNewTestKit();
      expect(c.detailDirty()).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 13. ADD NEW REAGENT ROW
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Add New Reagent', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should add new reagent row', () => {
      component.onCreateNewTestKit();
      const before = c.reagentRows().length;
      component.onAddNewReagent();
      expect(c.reagentRows().length).toBe(before + 1);
      expect(c.reagentRows()[c.reagentRows().length - 1].isNew).toBeTrue();
    });

    it('should mark detail as dirty when adding reagent', () => {
      component.onCreateNewTestKit();
      c.detailDirty.set(false);
      component.onAddNewReagent();
      expect(c.detailDirty()).toBeTrue();
    });

    it('should add multiple reagent rows', () => {
      component.onCreateNewTestKit();
      component.onAddNewReagent();
      component.onAddNewReagent();
      expect(c.reagentRows().length).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 14. REAGENT TYPE CHANGE
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Reagent Type Change', () => {
    beforeEach(fakeAsync(() => {
      initAndRetrieve();
      component.onCreateNewTestKit();
      tick();
    }));

    it('should update reagent type for row', fakeAsync(() => {
      component.onReagentTypeChange(0, 'R');
      tick();
      expect(c.reagentRows()[0].reagentType).toBe('R');
    }));

    it('should clear name/supplier/lot/expiry on type change', fakeAsync(() => {
      component.onReagentTypeChange(0, 'R');
      tick();
      expect(c.reagentRows()[0].name).toBe('');
      expect(c.reagentRows()[0].supplier).toBe('');
      expect(c.reagentRows()[0].lotNo).toBe('');
    }));

    it('should load reagent LOV for selected type', fakeAsync(() => {
      component.onReagentTypeChange(0, 'R');
      tick();
      expect(serviceSpy.getReagentLov).toHaveBeenCalledWith('Jsa', 'R');
    }));

    it('should mark detail as dirty on type change', fakeAsync(() => {
      c.detailDirty.set(false);
      component.onReagentTypeChange(0, 'R');
      tick();
      expect(c.detailDirty()).toBeTrue();
    }));

    it('should handle LOV loading error', fakeAsync(() => {
      serviceSpy.getReagentLov.and.returnValue(throwError(() => new Error('err')));
      component.onReagentTypeChange(0, 'R');
      tick();
      expect(c.reagentLovMap().get(0)).toEqual([]);
    }));

    it('should store LOV data in reagentLovMap', fakeAsync(() => {
      component.onReagentTypeChange(0, 'R');
      tick();
      expect(c.reagentLovMap().get(0)).toEqual(mockReagentLov);
    }));

    it('should not load LOV when reagent type is empty', fakeAsync(() => {
      serviceSpy.getReagentLov.calls.reset();
      component.onReagentTypeChange(0, '');
      tick();
      expect(serviceSpy.getReagentLov).not.toHaveBeenCalled();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 15. REAGENT NAME CHANGE
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Reagent Name Change', () => {
    beforeEach(fakeAsync(() => {
      initAndRetrieve();
      component.onCreateNewTestKit();
      tick();
      const map = new Map();
      map.set(0, mockReagentLov);
      c.reagentLovMap.set(map);
    }));

    it('should auto-populate supplier/lot/expiry from LOV', () => {
      component.onReagentNameChange(0, 'R001');
      const row = c.reagentRows()[0];
      expect(row.name).toBe('Jsa Bottle');
      expect(row.supplier).toBe('ORTHO');
      expect(row.lotNo).toBe('JSAL');
      expect(row.reagentCode).toBe('RC1');
    });

    it('should mark detail dirty on name change', () => {
      c.detailDirty.set(false);
      component.onReagentNameChange(0, 'R001');
      expect(c.detailDirty()).toBeTrue();
    });

    it('should warn if selected reagent is expired', () => {
      component.onReagentNameChange(0, 'R002');
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Warning: Selected reagent is expired.');
    });

    it('should not warn if reagent is not expired', () => {
      snackbarServiceSpy.showError.calls.reset();
      component.onReagentNameChange(0, 'R001');
      expect(snackbarServiceSpy.showError).not.toHaveBeenCalled();
    });

    it('should handle reagent not found in LOV', () => {
      component.onReagentNameChange(0, 'UNKNOWN');
      expect(c.reagentRows()[0].reagentId).toBe('UNKNOWN');
    });

    it('should preserve isNew flag after name change', () => {
      component.onReagentNameChange(0, 'R001');
      expect(c.reagentRows()[0].isNew).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 16. REAGENT LOV HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Reagent LOV Helpers', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should get LOV for specific row', () => {
      const map = new Map();
      map.set(0, mockReagentLov);
      c.reagentLovMap.set(map);
      expect(c.getReagentLovForRow(0)).toEqual(mockReagentLov);
    });

    it('should return empty array when no LOV for row', () => {
      expect(c.getReagentLovForRow(99)).toEqual([]);
    });

    it('should create search control for row', () => {
      const ctrl = c.getReagentNameSearchControl(0);
      expect(ctrl).toBeTruthy();
      expect(ctrl.value).toBe('');
    });

    it('should reuse existing search control for same row', () => {
      const ctrl1 = c.getReagentNameSearchControl(0);
      const ctrl2 = c.getReagentNameSearchControl(0);
      expect(ctrl1).toBe(ctrl2);
    });

    it('should filter reagent names by search text', fakeAsync(() => {
      const map = new Map();
      map.set(0, mockReagentLov);
      c.reagentLovMap.set(map);
      const searchMap = new Map();
      searchMap.set(0, 'anti');
      c.reagentNameSearchText.set(searchMap);
      tick();
      const filtered = c.getFilteredReagentNamesForRow(0);
      expect(filtered.length).toBe(1);
      expect(filtered[0].reagentName).toBe('Anti-D');
    }));

    it('should return all LOV when search is empty', () => {
      const map = new Map();
      map.set(0, mockReagentLov);
      c.reagentLovMap.set(map);
      expect(c.getFilteredReagentNamesForRow(0).length).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 17. SAVE — NEW TEST KIT
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Save New Test Kit', () => {
    beforeEach(fakeAsync(() => {
      initAndRetrieve();
      component.onCreateNewTestKit();
      tick();
      serviceSpy.createTestKit.and.returnValue(of({} as any));
    }));

    it('should validate all reagent rows have required fields', fakeAsync(() => {
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('All reagent rows must have Type, Name, and Expiration Date.');
      expect(serviceSpy.createTestKit).not.toHaveBeenCalled();
    }));

    it('should validate license flag for AG/MAG tests', fakeAsync(() => {
      c.isAgMagTest.set(true);
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('License Flag is required for AG/MAG tests.');
    }));

    it('should reject invalid date format on save', fakeAsync(() => {
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      c.newKitQcExpiration.setErrors({ invalidDate: true });
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid date format.');
    }));

    it('should reject past QC expiration date', fakeAsync(() => {
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      c.newKitQcExpiration.setValue(new Date('2020-01-01'));
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('QC Expiration Date cannot be in the past.');
    }));

    it('should save successfully with valid data', fakeAsync(() => {
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true, reagentCode: 'RC1', reagentId: 'R001' }]);
      component.onSave();
      tick();
      expect(serviceSpy.createTestKit).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Test kit created successfully.');
    }));

    it('should include QC expiry date when set', fakeAsync(() => {
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      c.newKitQcExpiration.setValue(new Date('2031-12-31'));
      component.onSave();
      tick();
      const req = serviceSpy.createTestKit.calls.mostRecent().args[0];
      expect(req.qcExpiryDate).toBeTruthy();
    }));

    it('should include license flag when set', fakeAsync(() => {
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      c.newKitLicenseFlag.setValue('L');
      component.onSave();
      tick();
      const req = serviceSpy.createTestKit.calls.mostRecent().args[0];
      expect(req.apprLicFlag).toBe('L');
    }));

    it('should handle save error', fakeAsync(() => {
      serviceSpy.createTestKit.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Custom Error' } } })));
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Custom Error');
    }));

    it('should set saving state during save', fakeAsync(() => {
      const saveSubject = new Subject<any>();
      serviceSpy.createTestKit.and.returnValue(saveSubject.asObservable());
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      component.onSave();
      expect(c.saving()).toBeTrue();
      saveSubject.next({});
      saveSubject.complete();
      tick();
      expect(c.saving()).toBeFalse();
    }));

    it('should not save if already saving', fakeAsync(() => {
      c.saving.set(true);
      component.onSave();
      tick();
      expect(serviceSpy.createTestKit).not.toHaveBeenCalled();
    }));

    it('should allow null QC expiration date', fakeAsync(() => {
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      component.onSave();
      tick();
      const req = serviceSpy.createTestKit.calls.mostRecent().args[0];
      expect(req.qcExpiryDate).toBeUndefined();
    }));

    it('should validate matDatepickerParse error on save', fakeAsync(() => {
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      c.newKitQcExpiration.setErrors({ matDatepickerParse: true });
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Invalid date format.');
      expect(serviceSpy.createTestKit).not.toHaveBeenCalled();
    }));

    it('should use default error message when create error has no nested error', fakeAsync(() => {
      serviceSpy.createTestKit.and.returnValue(throwError(() => ({})));
      c.reagentRows.set([{ reagentType: 'R', name: 'Test', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true }]);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create test kit.');
    }));

    it('should do nothing on save when not in create mode and no kit selected', fakeAsync(() => {
      c.isCreateMode.set(false);
      c.selectedKitId.set(null);
      component.onSave();
      tick();
      expect(serviceSpy.createTestKit).not.toHaveBeenCalled();
      expect(serviceSpy.updateTestKit).not.toHaveBeenCalled();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 18. SAVE — UPDATE EXISTING TEST KIT
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Update Existing Test Kit', () => {
    beforeEach(fakeAsync(() => {
      initAndRetrieve();
      serviceSpy.updateTestKit.and.returnValue(of({ success: true, statusCode: 200, data: null }));
    }));

    it('should update existing kit with no new rows', fakeAsync(() => {
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(serviceSpy.updateTestKit).toHaveBeenCalledWith('9109-JSA', { allowExpiredReagent: false });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Test kit updated successfully.');
    }));

    it('should validate new reagent rows on update', fakeAsync(() => {
      c.reagentRows.set([
        ...c.reagentRows(),
        { reagentType: '', name: '', supplier: '', lotNo: '', expirationDate: '', isNew: true },
      ]);
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('All new reagent rows must have Type, Name, and Expiration Date.');
    }));

    it('should handle expired reagent warning (error code 0224)', fakeAsync(() => {
      serviceSpy.updateTestKit.and.returnValue(of({
        success: false, statusCode: 200, data: null,
        errorResponse: { errorCode: '0224', error: 'Expired reagent' },
      }));
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(false));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should retry with allowExpiredReagent when user confirms', fakeAsync(() => {
      let callCount = 0;
      serviceSpy.updateTestKit.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return of({ success: false, statusCode: 200, data: null, errorResponse: { errorCode: '0224', error: 'Expired' } });
        }
        return of({ success: true, statusCode: 200, data: null });
      });
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true));
      dialogSpy.open.and.returnValue(dialogRefSpy);
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(serviceSpy.updateTestKit).toHaveBeenCalledTimes(2);
      const secondCall = serviceSpy.updateTestKit.calls.argsFor(1);
      expect(secondCall[1].allowExpiredReagent).toBeTrue();
    }));

    it('should handle non-success response without 0224', fakeAsync(() => {
      serviceSpy.updateTestKit.and.returnValue(of({
        success: false, statusCode: 200, data: null,
        errorResponse: { errorCode: '0001', error: 'Some other error' },
      }));
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Some other error');
    }));

    it('should handle update API error', fakeAsync(() => {
      serviceSpy.updateTestKit.and.returnValue(throwError(() => ({ error: { errorResponse: { error: 'Network Error' } } })));
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Network Error');
    }));

    it('should send only new reagent rows in update', fakeAsync(() => {
      const existing = c.reagentRows();
      c.reagentRows.set([
        ...existing,
        { reagentType: 'R', name: 'New', supplier: 'S', lotNo: 'L', expirationDate: '2031-12-31', isNew: true, reagentCode: 'R1', reagentId: 'RI1' },
      ]);
      c.detailDirty.set(true);
      component.onSave();
      tick();
      const req = serviceSpy.updateTestKit.calls.mostRecent().args[1];
      expect(req.reagents!.length).toBe(1);
      expect(req.reagents![0].reagentName).toBe('New');
    }));

    it('should reload reagents after successful update', fakeAsync(() => {
      serviceSpy.getReagents.calls.reset();
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(serviceSpy.getReagents).toHaveBeenCalledWith('9109-JSA', 'Jsa');
    }));

    it('should use default error message when update error has no nested error', fakeAsync(() => {
      serviceSpy.updateTestKit.and.returnValue(throwError(() => ({})));
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update test kit.');
    }));

    it('should use response message when errorResponse has no error field', fakeAsync(() => {
      serviceSpy.updateTestKit.and.returnValue(of({
        success: false, statusCode: 200, data: null,
        message: 'Validation failed',
      }));
      c.detailDirty.set(true);
      component.onSave();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Validation failed');
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 19. CANCEL
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Cancel', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should exit create mode on cancel', () => {
      component.onCreateNewTestKit();
      component.onCancel();
      expect(c.isCreateMode()).toBeFalse();
    });

    it('should reset detailDirty on cancel', () => {
      c.detailDirty.set(true);
      component.onCancel();
      expect(c.detailDirty()).toBeFalse();
    });

    it('should select first kit after canceling create mode', fakeAsync(() => {
      component.onCreateNewTestKit();
      component.onCancel();
      tick();
      expect(c.selectedKitId()).toBe('9109-JSA');
    }));

    it('should reload reagents on cancel in view mode', fakeAsync(() => {
      serviceSpy.getReagents.calls.reset();
      c.detailDirty.set(true);
      component.onCancel();
      tick();
      expect(serviceSpy.getReagents).toHaveBeenCalledWith('9109-JSA', 'Jsa');
    }));

    it('should do nothing on cancel when no selection and not in create mode', () => {
      c.selectedKitId.set(null);
      c.isCreateMode.set(false);
      serviceSpy.getReagents.calls.reset();
      component.onCancel();
      expect(serviceSpy.getReagents).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 20. DETAIL CLEAR ALL
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Detail Clear All', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should reset create mode fields on detail clear all', fakeAsync(() => {
      component.onCreateNewTestKit();
      c.newKitQcExpiration.setValue(new Date());
      c.newKitLicenseFlag.setValue('L');
      component.onAddNewReagent();
      component.onDetailClearAll();
      tick();
      expect(c.newKitQcExpiration.value).toBeNull();
      expect(c.newKitLicenseFlag.value).toBeNull();
      expect(c.reagentRows().length).toBe(1);
      expect(c.reagentRows()[0].reagentType).toBe('');
    }));

    it('should clear selection on detail clear all in view mode', () => {
      component.onDetailClearAll();
      expect(c.selectedKitId()).toBeNull();
      expect(c.reagentRows()).toEqual([]);
    });

    it('should reset detailDirty on detail clear all', () => {
      c.detailDirty.set(true);
      component.onDetailClearAll();
      expect(c.detailDirty()).toBeFalse();
    });

    it('should clear reagent LOV map on create mode detail clear', fakeAsync(() => {
      component.onCreateNewTestKit();
      const map = new Map();
      map.set(0, mockReagentLov);
      c.reagentLovMap.set(map);
      component.onDetailClearAll();
      tick();
      expect(c.reagentLovMap().size).toBe(0);
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 21. UNSAVED CHANGES GUARD
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Unsaved Changes Guard', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should allow deactivation when no unsaved changes', () => {
      expect(component.canDeactivate()).toBeTrue();
    });

    it('should prevent deactivation when detail is dirty', () => {
      c.detailDirty.set(true);
      expect(component.canDeactivate()).toBeFalse();
    });

    it('should prevent deactivation when form is dirty', () => {
      c.formDirty.set(true);
      expect(component.canDeactivate()).toBeFalse();
    });

    it('should report no unsaved changes when clean', () => {
      expect(component.hasUnsavedChangesCheck()).toBeFalse();
    });

    it('should report unsaved changes when detail dirty', () => {
      c.detailDirty.set(true);
      expect(component.hasUnsavedChangesCheck()).toBeTrue();
    });

    it('should report unsaved changes when form dirty', () => {
      c.formDirty.set(true);
      expect(component.hasUnsavedChangesCheck()).toBeTrue();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 22. QC DATE HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('QC Date Handlers', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should mark QC control as touched on blur', () => {
      c.onQcDateBlur();
      expect(c.newKitQcExpiration.touched).toBeTrue();
    });

    it('should clear errors on empty QC date input', fakeAsync(() => {
      c.newKitQcExpiration.setErrors({ invalidDate: true });
      c.onQcDateInput({ target: { value: '' } } as any);
      tick();
      expect(c.newKitQcExpiration.errors).toBeNull();
    }));

    it('should set invalidDate error for unparseable QC input', fakeAsync(() => {
      c.onQcDateInput({ target: { value: 'abc' } } as any);
      tick();
      expect(c.newKitQcExpiration.hasError('invalidDate')).toBeTrue();
    }));

    it('should mark touched and dirty for valid non-empty QC input', fakeAsync(() => {
      c.newKitQcExpiration.setValue(new Date('2031-12-31'));
      c.onQcDateInput({ target: { value: '31-DEC-2031' } } as any);
      tick();
      expect(c.newKitQcExpiration.touched).toBeTrue();
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 23. FORMAT & DISPLAY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Format and Display Helpers', () => {
    beforeEach(() => { fixture.detectChanges(); });

    it('should format valid date time', () => {
      const result = c.formatDateTime('2031-12-31T23:59:00');
      expect(result).toBe('31-DEC-2031 23:59');
    });

    it('should return dash for empty date', () => {
      expect(c.formatDateTime('')).toBe('-');
    });

    it('should return dash for null date', () => {
      expect(c.formatDateTime(null as any)).toBe('-');
    });

    it('should return original value for invalid date string', () => {
      expect(c.formatDateTime('not-a-date')).toBe('not-a-date');
    });

    it('should display license flag L as Licensed', () => {
      expect(component.getLicenseFlagDisplay('L')).toBe('Licensed');
    });

    it('should display license flag A as Approved', () => {
      expect(component.getLicenseFlagDisplay('A')).toBe('Approved');
    });

    it('should display license flag U as Unapproved', () => {
      expect(component.getLicenseFlagDisplay('U')).toBe('Unapproved');
    });

    it('should return dash for empty license flag', () => {
      expect(component.getLicenseFlagDisplay('')).toBe('-');
    });

    it('should return raw value for unknown license flag', () => {
      expect(component.getLicenseFlagDisplay('X')).toBe('X');
    });

    it('should handle lowercase license flag', () => {
      expect(component.getLicenseFlagDisplay('l')).toBe('Licensed');
    });

    it('should display reagent type R correctly', () => {
      expect(c.getReagentTypeDisplay('R')).toBe('R- Reagent');
    });

    it('should display reagent type C correctly', () => {
      expect(c.getReagentTypeDisplay('C')).toBe('C - Control');
    });

    it('should display reagent type K correctly', () => {
      expect(c.getReagentTypeDisplay('K')).toBe('K - Kit');
    });

    it('should return raw value for unknown reagent type', () => {
      expect(c.getReagentTypeDisplay('Z')).toBe('Z');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 24. SEARCH BAR CONFIG
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Search Bar Config', () => {
    it('should have correct search bar config', () => {
      expect(component.searchConfig.placeholder).toBe('Search');
      expect(component.searchConfig.minLength).toBe(1);
      expect(component.searchConfig.ariaLabel).toBe('Search test kits');
      expect(component.searchConfig.debounceTime).toBe(300);
      expect(component.searchConfig.searchOnEnterOnly).toBeFalse();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 25. WCAG ACCESSIBILITY (DOM)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('WCAG Accessibility', () => {
    beforeEach(fakeAsync(() => { initAndRetrieve(); }));

    it('should have scope="col" on kit list table headers (WCAG 1.3.1)', () => {
      const headers = fixture.debugElement.queryAll(By.css('.kit-list-table th'));
      headers.forEach(th => { expect(th.nativeElement.getAttribute('scope')).toBe('col'); });
    });

    it('should have scope="col" on reagent table headers (WCAG 1.3.1)', () => {
      const headers = fixture.debugElement.queryAll(By.css('.reagent-table th'));
      headers.forEach(th => { expect(th.nativeElement.getAttribute('scope')).toBe('col'); });
    });

    it('should have aria-label on aside landmark (WCAG 4.1.2)', () => {
      const aside = fixture.debugElement.query(By.css('aside.kit-sidebar'));
      expect(aside.nativeElement.getAttribute('aria-label')).toBe('Test kit list panel');
    });

    it('should have aria-label on main landmark (WCAG 4.1.2)', () => {
      const main = fixture.debugElement.query(By.css('main.kit-detail-panel'));
      expect(main.nativeElement.getAttribute('aria-label')).toBe('Test kit details');
    });

    it('should have aria-live="polite" on detail panel (WCAG 4.1.3)', () => {
      const main = fixture.debugElement.query(By.css('main.kit-detail-panel'));
      expect(main.nativeElement.getAttribute('aria-live')).toBe('polite');
    });

    it('should have role="region" on kit list container (WCAG 4.1.2)', () => {
      const container = fixture.debugElement.query(By.css('.kit-list-container'));
      expect(container.nativeElement.getAttribute('role')).toBe('region');
    });

    it('should have visually-hidden caption on kit list table (WCAG 1.3.1)', () => {
      const caption = fixture.debugElement.query(By.css('.kit-list-table caption'));
      expect(caption).toBeTruthy();
      expect(caption.nativeElement.classList.contains('sr-only')).toBeTrue();
    });

    it('should have visually-hidden caption on reagent table (WCAG 1.3.1)', () => {
      const caption = fixture.debugElement.query(By.css('.reagent-table caption'));
      expect(caption).toBeTruthy();
      expect(caption.nativeElement.classList.contains('sr-only')).toBeTrue();
    });

    it('should have tabindex="0" on kit list rows (WCAG 2.1.1)', () => {
      const rows = fixture.debugElement.queryAll(By.css('.kit-list-table tbody tr[tabindex]'));
      expect(rows.length).toBeGreaterThan(0);
      rows.forEach(row => { expect(row.nativeElement.getAttribute('tabindex')).toBe('0'); });
    });

    it('should have aria-selected on kit list rows (WCAG 4.1.2)', () => {
      const rows = fixture.debugElement.queryAll(By.css('.kit-list-table tbody tr[tabindex]'));
      const selectedRow = rows.find(row => row.nativeElement.getAttribute('aria-selected') === 'true');
      expect(selectedRow).toBeTruthy();
    });

    it('should have aria-label on all action buttons (WCAG 4.1.2)', () => {
      const buttons = fixture.debugElement.queryAll(By.css('button[aria-label]'));
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(btn => { expect(btn.nativeElement.getAttribute('aria-label')).toBeTruthy(); });
    });

    it('should have role="group" on test description (WCAG 1.3.1)', () => {
      const dayLabel = fixture.debugElement.query(By.css('.day-label'));
      expect(dayLabel.nativeElement.getAttribute('role')).toBe('group');
      expect(dayLabel.nativeElement.getAttribute('aria-label')).toBe('Test Description');
    });

    it('should show sr-only text in new kit row (WCAG 1.3.1)', fakeAsync(() => {
      component.onCreateNewTestKit();
      tick();
      fixture.detectChanges();
      const srOnly = fixture.debugElement.query(By.css('.new-kit-row .sr-only'));
      expect(srOnly).toBeTruthy();
      expect(srOnly.nativeElement.textContent.trim()).toBe('New kit');
    }));

    it('should have aria-label on QC expiration input (WCAG 3.3.2)', fakeAsync(() => {
      component.onCreateNewTestKit();
      tick();
      fixture.detectChanges();
      const dateInput = fixture.debugElement.query(By.css('.inline-date-field input[matInput]'));
      if (dateInput) {
        expect(dateInput.nativeElement.getAttribute('aria-label')).toBe('QC Expiration Date');
      }
    }));

    it('should have DD-MMM-YYYY placeholder on QC date field', fakeAsync(() => {
      component.onCreateNewTestKit();
      tick();
      fixture.detectChanges();
      const dateInput = fixture.debugElement.query(By.css('.inline-date-field input[matInput]'));
      if (dateInput) {
        expect(dateInput.nativeElement.getAttribute('placeholder')).toBe('DD-MMM-YYYY');
      }
    }));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // 26. COMPONENT CLEANUP
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Component Cleanup', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      spyOn(c.destroy$, 'next');
      spyOn(c.destroy$, 'complete');
      component.ngOnDestroy();
      expect(c.destroy$.next).toHaveBeenCalled();
      expect(c.destroy$.complete).toHaveBeenCalled();
    });
  });
});
