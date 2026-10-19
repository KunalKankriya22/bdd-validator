import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { signal, TemplateRef } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslateModule } from '@ngx-translate/core';
import moment from 'moment';
import { HHTemplatesTab } from './hh-templates.tab';
import { HealthHistoryService } from '../services/health-history.service';
import { HeaderService } from '@shared/services/header.service';
import { HHTemplateQuestionDto } from '../models/health-history.model';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';
import { ROUTE_REGISTRY } from 'src/app/core/constants/route-registry';
import { RouteKey } from 'src/app/core/constants/route-keys';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('HHTemplatesTab', () => {
  let component: HHTemplatesTab;
  let fixture: ComponentFixture<HHTemplatesTab>;
  let hhServiceSpy: jasmine.SpyObj<HealthHistoryService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let headerServiceMock: Partial<HeaderService>;
  let chapterChanged$: Subject<void>;

  const mockTemplateDto: HHTemplateQuestionDto = {
    donationType: 'AL', questionCode: 'D41', templateId: 'TMPL000005',
    questionDescription: 'Ever had chest pain?', screenerAsk: 'D',
    abbrFlag: 'N', abbrDispSeq: null, repeatHhFlag: '',
    gender: 'A', displayOrder: 1, sortSequence: '1',
    parentQuestionCode: '', subQuestionFlag: 'N', parentRespFlag: 'N',
    gotoNotes: '', effDate: '2025-01-01', termDate: '2026-06-30',
    validCodeType: '', randomizationFlag: 'N',
    programId: '', insertDate: '', insertUser: '', auditKey: 0, chapterId: 'DAL'
  };

  const mockDonationTypes = [
    { code: 'AL', description: 'Allogeneic' },
    { code: 'AU', description: 'Autologous' }
  ];

  beforeEach(() => {
    chapterChanged$ = new Subject<void>();

    hhServiceSpy = jasmine.createSpyObj('HealthHistoryService', [
      'searchTemplates', 'getTemplateQuestions', 'getDonationTypes',
      'getAvailableQuestionsForTemplate', 'createTemplateQuestion'
    ]);
    hhServiceSpy.searchTemplates.and.returnValue(of({
      data: [mockTemplateDto],
      totalRecords: 1
    }));
    hhServiceSpy.getTemplateQuestions.and.returnValue(of([mockTemplateDto]));
    hhServiceSpy.getDonationTypes.and.returnValue(of(mockDonationTypes));
    hhServiceSpy.getAvailableQuestionsForTemplate.and.returnValue(of([]));

    snackBarSpy = createMockMatSnackBar();
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    headerServiceMock = {
      chapterTimeZone: signal('-06:00'),
      chapterChanged$: chapterChanged$.asObservable(),
      getCurrentChapterId: () => 'DAL'
    } as any;

    TestBed.configureTestingModule({
      imports: [HHTemplatesTab, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: HealthHistoryService, useValue: hhServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Router, useValue: routerSpy },
        { provide: HeaderService, useValue: headerServiceMock },
        Overlay
      ]
    });

    fixture = TestBed.createComponent(HHTemplatesTab);
    component = fixture.componentInstance;

    // Standalone components using inject() resolve from their own module imports,
    // not TestBed providers. Override private injected services directly.
    (component as any).snackBar = snackBarSpy;

    fixture.detectChanges();
  });

  describe('initialization', () => {
    it('should load templates on init', () => {
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
      expect(component.dataSource.length).toBe(1);
    });

    it('should derive donation type description from loaded types', () => {
      expect(component.dataSource[0].donationTypeDescription).toBe('Allogeneic');
    });

    it('should load donation types on init', () => {
      expect(hhServiceSpy.getDonationTypes).toHaveBeenCalled();
      expect(component.donationTypes().length).toBe(2);
    });

    it('should set totalRecords from response', () => {
      expect(component.totalRecords).toBe(1);
    });

    it('should set isLoading to false after load', () => {
      expect(component.isLoading).toBe(false);
    });

    it('should map randomizationFlag to randomizeFlag', () => {
      expect(component.dataSource[0].randomizeFlag).toBe('N');
    });

    it('should fall back to donationType code when no matching description', () => {
      hhServiceSpy.searchTemplates.and.returnValue(of({
        data: [{ ...mockTemplateDto, donationType: 'ZZ' }],
        totalRecords: 1
      }));
      component['loadTemplates']();
      expect(component.dataSource[0].donationTypeDescription).toBe('ZZ');
    });
  });

  describe('ngAfterViewInit', () => {
    it('should assign statusCellTemplate to the status column', () => {
      component.ngAfterViewInit();
      const statusCol = component.tableConfig.columns.find(c => c.key === 'status');
      expect(statusCol?.cellTemplate).toBe(component.statusCellTemplate);
    });

    it('should not change other columns', () => {
      component.ngAfterViewInit();
      const templateIdCol = component.tableConfig.columns.find(c => c.key === 'templateId');
      expect(templateIdCol?.cellTemplate).toBeUndefined();
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should dispose overlay if open', () => {
      component['overlayRef'] = { dispose: jasmine.createSpy('dispose') } as any;
      component.ngOnDestroy();
      expect(component['overlayRef']!.dispose).toHaveBeenCalled();
    });

    it('should not error when overlayRef is null', () => {
      component['overlayRef'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('deriveStatus', () => {
    it('should return Active for current dates', () => {
      const status = (component as any).deriveStatus('2020-01-01', null);
      expect(status).toBe('Active');
    });

    it('should return Inactive for past termination date', () => {
      const status = (component as any).deriveStatus('2020-01-01', '2020-06-01');
      expect(status).toBe('Inactive');
    });

    it('should return Future for future effective date', () => {
      const status = (component as any).deriveStatus('2099-01-01', null);
      expect(status).toBe('Future');
    });

    it('should return Active when effective date equals today', () => {
      const chapterToday = DateFieldValidationUtility.getMinDate('-06:00');
      const today = chapterToday.format('YYYY-MM-DD');
      const status = (component as any).deriveStatus(today, null);
      expect(status).toBe('Active');
    });

    it('should return Active when effective date equals today with future termination', () => {
      const chapterToday = DateFieldValidationUtility.getMinDate('-06:00');
      const today = chapterToday.format('YYYY-MM-DD');
      const futureDate = chapterToday.clone().add(30, 'days').format('YYYY-MM-DD');
      const status = (component as any).deriveStatus(today, futureDate);
      expect(status).toBe('Active');
    });

    it('should return Inactive when termination date equals today', () => {
      const chapterToday = DateFieldValidationUtility.getMinDate('-06:00');
      const today = chapterToday.format('YYYY-MM-DD');
      const status = (component as any).deriveStatus('2020-01-01', today);
      expect(status).toBe('Inactive');
    });

    it('should return Active when termDate is empty string', () => {
      const status = (component as any).deriveStatus('2020-01-01', '');
      expect(status).toBe('Active');
    });
  });

  describe('loadTemplates error handling', () => {
    it('should show snackbar on API error with errorResponse', () => {
      hhServiceSpy.searchTemplates.and.returnValue(throwError(() => ({
        error: {
          errorResponse: { errorCode: '1234', error: 'Template not found' }
        }
      })));
      component['loadTemplates']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: 1234 Template not found', 'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
      );
      expect(component.isLoading).toBe(false);
      expect(component.dataSource).toEqual([]);
    });

    it('should show snackbar with error message when no errorResponse', () => {
      hhServiceSpy.searchTemplates.and.returnValue(throwError(() => ({
        error: { message: 'Server error' }
      })));
      component['loadTemplates']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Server error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show snackbar with error.error.error when only that is available', () => {
      hhServiceSpy.searchTemplates.and.returnValue(throwError(() => ({
        error: { error: 'Bad request' }
      })));
      component['loadTemplates']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Bad request', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show fallback error message when no structured error', () => {
      hhServiceSpy.searchTemplates.and.returnValue(throwError(() => ({
        message: 'Network error'
      })));
      component['loadTemplates']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Network error', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show default message when error has no useful info', () => {
      hhServiceSpy.searchTemplates.and.returnValue(throwError(() => ({})));
      component['loadTemplates']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error loading templates', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });

    it('should show errorResponse error without errorCode when code is absent', () => {
      hhServiceSpy.searchTemplates.and.returnValue(throwError(() => ({
        error: {
          errorResponse: { error: 'Something went wrong' }
        }
      })));
      component['loadTemplates']();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Error: Something went wrong', 'DISMISS',
        jasmine.objectContaining({ duration: 5000 })
      );
    });
  });

  describe('loadTemplates with filters and search', () => {
    it('should pass searchText as templateId param', () => {
      component.searchText = 'TMPL001';
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.templateId).toBe('TMPL001');
    });

    it('should pass applied filter donationType', () => {
      component.appliedFilters = { donationType: 'AL' };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.donationType).toBe('AL');
    });

    it('should pass applied filter status', () => {
      component.appliedFilters = { status: 'Active' };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.status).toBe('Active');
    });

    it('should pass applied effectiveDate and period', () => {
      component.appliedFilters = { effectiveDate: '2025-01-01', effectiveDatePeriod: 'After' };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.effectiveDate).toBe('2025-01-01');
      expect(params.effectiveDatePeriod).toBe('After');
    });

    it('should pass applied terminationDate and period', () => {
      component.appliedFilters = { terminationDate: '2026-12-31', terminationDatePeriod: 'Before' };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.terminationDate).toBe('2026-12-31');
      expect(params.terminationDatePeriod).toBe('Before');
    });

    it('should pass sort params when direction is A', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'templateId', direction: 'A' }
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.sortBy).toBe('templateId');
      expect(params.sortDir).toBe('asc');
    });

    it('should pass sort params when direction is D', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'effectiveDate', direction: 'D' }
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.sortBy).toBe('effectiveDate');
      expect(params.sortDir).toBe('desc');
    });

    it('should not pass sort params when direction is default', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'templateId', direction: 'default' }
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.sortBy).toBeUndefined();
      expect(params.sortDir).toBeUndefined();
    });

    it('should not pass filter params when appliedFilters is null', () => {
      component.appliedFilters = null;
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.donationType).toBeUndefined();
      expect(params.status).toBeUndefined();
    });

    it('should update tableConfig pagination totalRecords on success', () => {
      hhServiceSpy.searchTemplates.and.returnValue(of({
        data: [mockTemplateDto, { ...mockTemplateDto, templateId: 'TMPL000006' }],
        totalRecords: 42
      }));
      component['loadTemplates']();
      expect(component.tableConfig.pagination!.totalRecords).toBe(42);
    });
  });

  describe('row actions', () => {
    it('should handle view action', () => {
      spyOn(component, 'viewTemplate');
      component.onRowAction({ action: 'view', row: component.dataSource[0] });
      expect(component.viewTemplate).toHaveBeenCalledWith(component.dataSource[0]);
    });

    it('should not call viewTemplate for unknown actions', () => {
      spyOn(component, 'viewTemplate');
      component.onRowAction({ action: 'delete', row: component.dataSource[0] });
      expect(component.viewTemplate).not.toHaveBeenCalled();
    });
  });

  describe('viewTemplate', () => {
    it('should navigate to view template route with state', () => {
      const template = component.dataSource[0];
      component.viewTemplate(template);
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [ROUTE_REGISTRY[RouteKey.ViewHealthHistoryTemplate].path],
        { state: { data: template } }
      );
    });
  });

  describe('onAddNew', () => {
    it('should navigate to add template route with add mode', () => {
      component.onAddNew();
      expect(routerSpy.navigate).toHaveBeenCalledWith(
        [ROUTE_REGISTRY[RouteKey.AddHealthHistoryTemplate].path],
        { state: { mode: 'add' } }
      );
    });
  });

  describe('onBackToList', () => {
    it('should set viewMode to list and clear selectedTemplate', () => {
      component.viewMode = 'detail';
      component.selectedTemplate = { templateId: 'T1' } as any;
      component.onBackToList();
      expect(component.viewMode).toBe('list');
      expect(component.selectedTemplate).toBeNull();
    });

    it('should emit viewModeChange', () => {
      spyOn(component.viewModeChange, 'emit');
      component.onBackToList();
      expect(component.viewModeChange.emit).toHaveBeenCalledWith({ mode: 'list', templateId: undefined });
    });
  });

  describe('onTemplateSaved', () => {
    it('should show success snackbar', () => {
      component.onTemplateSaved();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'Template saved successfully', 'DISMISS',
        jasmine.objectContaining({ duration: 3000, panelClass: ['success-snackbar'] })
      );
    });

    it('should set viewMode to list and reload templates', () => {
      hhServiceSpy.searchTemplates.calls.reset();
      component.onTemplateSaved();
      expect(component.viewMode).toBe('list');
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
    });
  });

  describe('onPageChange', () => {
    it('should update pagination and reload', () => {
      hhServiceSpy.searchTemplates.calls.reset();
      component.onPageChange({ pageIndex: 2, pageSize: 50, previousPageIndex: 1 });
      expect(component.tableConfig.pagination!.pageIndex).toBe(2);
      expect(component.tableConfig.pagination!.pageSize).toBe(50);
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
    });

    it('should pass correct skip value based on page index', () => {
      hhServiceSpy.searchTemplates.calls.reset();
      component.onPageChange({ pageIndex: 3, pageSize: 10, previousPageIndex: 2 });
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalledWith(10, 30, jasmine.any(Object));
    });
  });

  describe('onSortChange', () => {
    it('should update sortConfig and reload', () => {
      hhServiceSpy.searchTemplates.calls.reset();
      component.onSortChange({ column: 'effectiveDate', direction: 'A' });
      expect(component.tableConfig.sortConfig!.column).toBe('effectiveDate');
      expect(component.tableConfig.sortConfig!.direction).toBe('A');
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should set searchText and reload', () => {
      const callsBefore = hhServiceSpy.searchTemplates.calls.count();
      component.onSearch('TMPL');
      expect(component.searchText).toBe('TMPL');
      expect(hhServiceSpy.searchTemplates.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should reset pageIndex to 0', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 5 }
      };
      component.onSearch('test');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should handle empty search text', () => {
      component.searchText = 'TMPL';
      component.onSearch('');
      expect(component.searchText).toBe('');
    });

    it('should treat null/undefined as empty string', () => {
      component.onSearch(null as any);
      expect(component.searchText).toBe('');
    });
  });

  describe('filter management', () => {
    it('should apply filters and reload', () => {
      const callsBefore = hhServiceSpy.searchTemplates.calls.count();
      component.applyFilters({ status: 'Active' });
      expect(component.appliedFilters?.status).toBe('Active');
      expect(hhServiceSpy.searchTemplates.calls.count()).toBeGreaterThan(callsBefore);
    });

    it('should generate filter chips', () => {
      component.applyFilters({ status: 'Active', donationType: 'AL' });
      expect(component.filterChips.length).toBe(2);
    });

    it('should format status chip label', () => {
      component.applyFilters({ status: 'Active' });
      expect(component.filterChips[0].label).toBe('Status: Active');
    });

    it('should format donation type chip with description', () => {
      component.applyFilters({ donationType: 'AL' });
      expect(component.filterChips[0].label).toContain('Donation Type:');
      expect(component.filterChips[0].label).toContain('Allogeneic');
    });

    it('should format donation type chip with code when no description found', () => {
      component.applyFilters({ donationType: 'ZZ' });
      expect(component.filterChips[0].label).toBe('Donation Type: ZZ');
    });

    it('should format effective date chip with After operator', () => {
      component.applyFilters({ effectiveDatePeriod: 'After', effectiveDate: '2026-01-01' });
      expect(component.filterChips[0].label).toContain('Effective Date ≥');
    });

    it('should format effective date chip with Before operator', () => {
      component.applyFilters({ effectiveDatePeriod: 'Before', effectiveDate: '2026-01-01' });
      expect(component.filterChips[0].label).toContain('Effective Date ≤');
    });

    it('should format termination date chip with Before operator', () => {
      component.applyFilters({ terminationDatePeriod: 'Before', terminationDate: '2026-12-31' });
      expect(component.filterChips[0].label).toContain('Termination Date ≤');
    });

    it('should format termination date chip with After operator', () => {
      component.applyFilters({ terminationDatePeriod: 'After', terminationDate: '2026-12-31' });
      expect(component.filterChips[0].label).toContain('Termination Date ≥');
    });

    it('should reset pageIndex to 0 when applying filters', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 3 }
      };
      component.applyFilters({ status: 'Active' });
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should remove date filter with period', () => {
      component.applyFilters({
        donationType: 'AL',
        effectiveDatePeriod: 'After',
        effectiveDate: '2025-01-01'
      });
      component.onRemoveFilterChip('effectiveDate');
      expect(component.appliedFilters?.effectiveDate).toBeUndefined();
      expect(component.appliedFilters?.effectiveDatePeriod).toBeUndefined();
      expect(component.appliedFilters?.donationType).toBe('AL');
    });

    it('should remove status filter chip', () => {
      component.applyFilters({ status: 'Active', donationType: 'AL' });
      component.onRemoveFilterChip('status');
      expect(component.appliedFilters?.status).toBeUndefined();
      expect(component.appliedFilters?.donationType).toBe('AL');
    });

    it('should remove donationType filter chip', () => {
      component.applyFilters({ status: 'Active', donationType: 'AL' });
      component.onRemoveFilterChip('donationType');
      expect(component.appliedFilters?.donationType).toBeUndefined();
      expect(component.appliedFilters?.status).toBe('Active');
    });

    it('should remove terminationDate filter chip with period', () => {
      component.applyFilters({
        status: 'Active',
        terminationDatePeriod: 'Before',
        terminationDate: '2026-12-31'
      });
      component.onRemoveFilterChip('terminationDate');
      expect(component.appliedFilters?.terminationDate).toBeUndefined();
      expect(component.appliedFilters?.terminationDatePeriod).toBeUndefined();
      expect(component.appliedFilters?.status).toBe('Active');
    });

    it('should set appliedFilters to null when last filter is removed', () => {
      component.applyFilters({ status: 'Active' });
      component.onRemoveFilterChip('status');
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should not error when removing chip with null appliedFilters', () => {
      component.appliedFilters = null;
      expect(() => component.onRemoveFilterChip('status')).not.toThrow();
    });

    it('should reload templates when a filter chip is removed', () => {
      component.applyFilters({ status: 'Active', donationType: 'AL' });
      hhServiceSpy.searchTemplates.calls.reset();
      component.onRemoveFilterChip('status');
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
    });

    it('should reset pageIndex when removing a filter chip', () => {
      component.applyFilters({ status: 'Active' });
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 5 }
      };
      component.onRemoveFilterChip('status');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false when appliedFilters is null', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return true when filters have values', () => {
      component.appliedFilters = { status: 'Active' };
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false when all filter values are empty', () => {
      component.appliedFilters = { status: undefined, donationType: '' } as any;
      expect(component.hasActiveFilters()).toBe(false);
    });

    it('should return false when filter values are null', () => {
      component.appliedFilters = { status: null } as any;
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('clearAllFilters', () => {
    it('should reset filters, chips, pagination, and reload', () => {
      component.applyFilters({ status: 'Active', donationType: 'AL' });
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 3 }
      };
      hhServiceSpy.searchTemplates.calls.reset();

      component.clearAllFilters();

      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
    });
  });

  describe('chapter change', () => {
    it('should reload templates and donation types on chapter change', () => {
      hhServiceSpy.searchTemplates.calls.reset();
      hhServiceSpy.getDonationTypes.calls.reset();

      chapterChanged$.next();

      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
      expect(hhServiceSpy.getDonationTypes).toHaveBeenCalled();
    });

    it('should reset searchText on chapter change', () => {
      component.searchText = 'TMPL';
      chapterChanged$.next();
      expect(component.searchText).toBe('');
    });

    it('should clear appliedFilters and filterChips on chapter change', () => {
      component.applyFilters({ status: 'Active' });
      chapterChanged$.next();
      expect(component.appliedFilters).toBeNull();
      expect(component.filterChips).toEqual([]);
    });

    it('should reset viewMode to list on chapter change', () => {
      component.viewMode = 'detail';
      chapterChanged$.next();
      expect(component.viewMode).toBe('list');
    });

    it('should clear selectedTemplate on chapter change', () => {
      component.selectedTemplate = { templateId: 'T1' } as any;
      chapterChanged$.next();
      expect(component.selectedTemplate).toBeNull();
    });

    it('should reset dataSource and totalRecords on chapter change', () => {
      hhServiceSpy.searchTemplates.and.returnValue(of({ data: [], totalRecords: 0 }));
      chapterChanged$.next();
      expect(component.totalRecords).toBe(0);
    });

    it('should reset isFilterOpen on chapter change', () => {
      component.isFilterOpen = true;
      chapterChanged$.next();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should dispose overlay if open on chapter change', () => {
      const disposeSpy = jasmine.createSpy('dispose');
      component['overlayRef'] = { dispose: disposeSpy } as any;
      chapterChanged$.next();
      expect(disposeSpy).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
    });

    it('should reset pagination pageIndex on chapter change', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 5 }
      };
      chapterChanged$.next();
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
    });

    it('should clear searchBar on chapter change', () => {
      if (component.searchBarComponent) {
        spyOn(component.searchBarComponent, 'clearSearch');
        chapterChanged$.next();
        expect(component.searchBarComponent.clearSearch).toHaveBeenCalled();
      } else {
        chapterChanged$.next();
        expect(component.searchText).toBe('');
      }
    });
  });

  describe('status helpers', () => {
    it('should return lowercase class for status', () => {
      expect(component.getStatusClass('Active')).toBe('active');
      expect(component.getStatusClass('Inactive')).toBe('inactive');
      expect(component.getStatusClass('Future')).toBe('future');
    });

    it('should return correct icon for status', () => {
      expect(component.getStatusIcon('Active')).toBe('check_circle');
      expect(component.getStatusIcon('Future')).toBe('schedule');
      expect(component.getStatusIcon('Inactive')).toBe('cancel');
    });

    it('should return empty string for null/undefined status class', () => {
      expect(component.getStatusClass(null as any)).toBe('');
      expect(component.getStatusClass(undefined as any)).toBe('');
    });

    it('should return cancel icon for unknown status', () => {
      expect(component.getStatusIcon('Unknown')).toBe('cancel');
    });
  });

  describe('formatDate', () => {
    it('should format date as DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2025-01-15')).toBe('15-JAN-2025');
    });

    it('should return dash for empty string', () => {
      expect(component.formatDate('')).toBe('-');
    });

    it('should return dash for null', () => {
      expect(component.formatDate(null as any)).toBe('-');
    });

    it('should format ISO date strings correctly', () => {
      expect(component.formatDate('2026-12-31T00:00:00Z')).toBe('31-DEC-2026');
    });
  });

  describe('openFilter', () => {
    it('should toggle filter open state', () => {
      expect(component.isFilterOpen).toBe(false);
    });

    it('should dispose existing overlay and return on second call', () => {
      const disposeSpy = jasmine.createSpy('dispose');
      component['overlayRef'] = { dispose: disposeSpy } as any;
      component.openFilter();
      expect(disposeSpy).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });
  });

  describe('disposeOverlay', () => {
    it('should dispose overlay and reset state', () => {
      const disposeSpy = jasmine.createSpy('dispose');
      component['overlayRef'] = { dispose: disposeSpy } as any;
      component.isFilterOpen = true;
      component['disposeOverlay']();
      expect(disposeSpy).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should not error when overlayRef is null', () => {
      component['overlayRef'] = null;
      expect(() => component['disposeOverlay']()).not.toThrow();
    });
  });

  describe('setViewMode', () => {
    it('should set viewMode and emit event', () => {
      spyOn(component.viewModeChange, 'emit');
      component['setViewMode']('detail', 'TMPL001');
      expect(component.viewMode).toBe('detail');
      expect(component.viewModeChange.emit).toHaveBeenCalledWith({ mode: 'detail', templateId: 'TMPL001' });
    });

    it('should emit without templateId when not provided', () => {
      spyOn(component.viewModeChange, 'emit');
      component['setViewMode']('add');
      expect(component.viewModeChange.emit).toHaveBeenCalledWith({ mode: 'add', templateId: undefined });
    });
  });

  describe('table column configuration', () => {
    it('should have 6 columns in table config', () => {
      expect(component.tableConfig.columns.length).toBe(6);
    });

    it('should have templateId as first column', () => {
      expect(component.tableConfig.columns[0].key).toBe('templateId');
    });

    it('should format donationTypeDescription with value formatter', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'donationTypeDescription');
      const row = { donationType: 'AL', donationTypeDescription: 'Allogeneic' } as any;
      expect(col?.valueFormatter?.('Allogeneic', row)).toBe('AL - Allogeneic');
    });

    it('should format donationType fallback when description is empty', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'donationTypeDescription');
      const row = { donationType: 'ZZ', donationTypeDescription: '' } as any;
      expect(col?.valueFormatter?.('', row)).toBe('ZZ - ZZ');
    });

    it('should format effectiveDate using formatDate', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'effectiveDate');
      expect(col?.valueFormatter?.('2025-06-15', {} as any)).toBe('15-JUN-2025');
    });

    it('should format terminationDate using formatDate or show dash', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'terminationDate');
      expect(col?.valueFormatter?.('2026-12-31', {} as any)).toBe('31-DEC-2026');
      expect(col?.valueFormatter?.(null as any, {} as any)).toBe('-');
    });

    it('should have view row action with visibility icon', () => {
      const actions = component.tableConfig.rowActions;
      expect(actions?.length).toBe(1);
      expect(actions?.[0].icon).toBe('visibility');
      expect(actions?.[0].action).toBe('view');
    });

    it('should have default sort on templateId', () => {
      expect(component.tableConfig.sortConfig?.column).toBe('templateId');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should have correct pagination defaults', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });

  describe('detail table configuration', () => {
    it('should have 14 columns in detail table config', () => {
      expect(component.detailTableConfig.columns.length).toBe(14);
    });

    it('should format effDate in detail columns', () => {
      const col = component.detailTableConfig.columns.find(c => c.key === 'effDate');
      expect(col?.valueFormatter?.('2025-03-01', {} as any)).toBe('01-MAR-2025');
    });

    it('should format termDate in detail columns or return empty', () => {
      const col = component.detailTableConfig.columns.find(c => c.key === 'termDate');
      expect(col?.valueFormatter?.('2026-06-30', {} as any)).toBe('30-JUN-2026');
      expect(col?.valueFormatter?.(null as any, {} as any)).toBe('');
    });
  });

  describe('search config', () => {
    it('should have searchOnEnterOnly set to true', () => {
      expect(component.searchConfig.searchOnEnterOnly).toBe(true);
    });

    it('should have minLength of 1', () => {
      expect(component.searchConfig.minLength).toBe(1);
    });
  });

  describe('openFilter full overlay creation flow', () => {
    let mockOverlay: any;
    let mockPositionStrategy: any;
    let mockOverlayRef: any;
    let mockInstance: any;
    let applySubject: Subject<any>;
    let clearAllSubject: Subject<void>;
    let closeSubject: Subject<void>;
    let backdropClickSubject: Subject<MouseEvent>;

    beforeEach(() => {
      applySubject = new Subject();
      clearAllSubject = new Subject();
      closeSubject = new Subject();
      backdropClickSubject = new Subject();

      mockPositionStrategy = {
        withPositions: jasmine.createSpy('withPositions'),
        withPush: jasmine.createSpy('withPush'),
        withViewportMargin: jasmine.createSpy('withViewportMargin'),
        withFlexibleDimensions: jasmine.createSpy('withFlexibleDimensions'),
        withGrowAfterOpen: jasmine.createSpy('withGrowAfterOpen')
      };
      mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
      mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);
      mockPositionStrategy.withViewportMargin.and.returnValue(mockPositionStrategy);
      mockPositionStrategy.withFlexibleDimensions.and.returnValue(mockPositionStrategy);
      mockPositionStrategy.withGrowAfterOpen.and.returnValue(mockPositionStrategy);

      mockInstance = {
        currentFilters: null as any,
        donationTypes: [] as any,
        apply: applySubject,
        clearAll: clearAllSubject,
        close: closeSubject
      };

      mockOverlayRef = {
        attach: jasmine.createSpy('attach').and.returnValue({ instance: mockInstance }),
        dispose: jasmine.createSpy('dispose'),
        backdropClick: jasmine.createSpy('backdropClick').and.returnValue(backdropClickSubject.asObservable())
      };

      const positionBuilder = {
        flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
      };

      mockOverlay = {
        position: jasmine.createSpy('position').and.returnValue(positionBuilder),
        create: jasmine.createSpy('create').and.returnValue(mockOverlayRef),
        scrollStrategies: {
          block: jasmine.createSpy('block').and.returnValue({})
        }
      };

      (component as any).overlay = mockOverlay;
      component.filterButton = { nativeElement: document.createElement('button') } as any;
      component['overlayRef'] = null;
    });

    it('should set isFilterOpen to true when creating overlay', () => {
      component.openFilter();
      expect(component.isFilterOpen).toBe(true);
    });

    it('should call overlay.create with correct config', () => {
      component.openFilter();
      expect(mockOverlay.create).toHaveBeenCalledWith(jasmine.objectContaining({
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
        width: '320px',
        minWidth: '320px',
        maxWidth: '320px'
      }));
    });

    it('should configure position strategy chain correctly', () => {
      component.openFilter();
      expect(mockPositionStrategy.withPush).toHaveBeenCalledWith(true);
      expect(mockPositionStrategy.withViewportMargin).toHaveBeenCalledWith(16);
      expect(mockPositionStrategy.withFlexibleDimensions).toHaveBeenCalledWith(false);
      expect(mockPositionStrategy.withGrowAfterOpen).toHaveBeenCalledWith(false);
    });

    it('should attach a portal to the overlay', () => {
      component.openFilter();
      expect(mockOverlayRef.attach).toHaveBeenCalled();
    });

    it('should set overlayRef on the component', () => {
      component.openFilter();
      expect(component['overlayRef']).toBe(mockOverlayRef);
    });

    it('should pass appliedFilters to filter panel instance', () => {
      component.appliedFilters = { status: 'Active' };
      component.openFilter();
      expect(mockInstance.currentFilters).toEqual({ status: 'Active' });
    });

    it('should pass null appliedFilters to filter panel when no filters set', () => {
      component.appliedFilters = null;
      component.openFilter();
      expect(mockInstance.currentFilters).toBeNull();
    });

    it('should pass donationTypes to filter panel instance', () => {
      component.openFilter();
      expect(mockInstance.donationTypes).toEqual(component.donationTypes());
    });

    it('should apply filters and dispose overlay when apply event fires', () => {
      spyOn(component, 'applyFilters');
      component.openFilter();
      const filters = { status: 'Active', donationType: 'AL' };
      applySubject.next(filters);
      expect(component.applyFilters).toHaveBeenCalledWith(filters);
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should clear all filters and dispose overlay when clearAll event fires', () => {
      spyOn(component, 'clearAllFilters');
      component.openFilter();
      clearAllSubject.next();
      expect(component.clearAllFilters).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
    });

    it('should dispose overlay when close event fires', () => {
      component.openFilter();
      closeSubject.next();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should dispose overlay on backdrop click', () => {
      component.openFilter();
      backdropClickSubject.next(new MouseEvent('click'));
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should use scroll block strategy', () => {
      component.openFilter();
      expect(mockOverlay.scrollStrategies.block).toHaveBeenCalled();
    });

    it('should connect position strategy to filterButton element', () => {
      component.openFilter();
      const positionBuilder = mockOverlay.position();
      expect(positionBuilder.flexibleConnectedTo).toHaveBeenCalledWith(component.filterButton);
    });

    it('should configure position with correct origin and overlay alignment', () => {
      component.openFilter();
      expect(mockPositionStrategy.withPositions).toHaveBeenCalledWith([
        jasmine.objectContaining({
          originX: 'start',
          originY: 'bottom',
          overlayX: 'start',
          overlayY: 'top',
          offsetX: 0,
          offsetY: 4
        })
      ]);
    });
  });

  describe('mapDtoToTemplateModel edge cases', () => {
    it('should return empty string for randomizeFlag when randomizationFlag is null', () => {
      const dto = { ...mockTemplateDto, randomizationFlag: null as any };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.randomizeFlag).toBe('');
    });

    it('should return empty string for randomizeFlag when randomizationFlag is undefined', () => {
      const dto = { ...mockTemplateDto, randomizationFlag: undefined as any };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.randomizeFlag).toBe('');
    });

    it('should return empty string for randomizeFlag when randomizationFlag is empty string', () => {
      const dto = { ...mockTemplateDto, randomizationFlag: '' };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.randomizeFlag).toBe('');
    });

    it('should set terminationDate to undefined when termDate is null', () => {
      const dto = { ...mockTemplateDto, termDate: null as any };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.terminationDate).toBeUndefined();
    });

    it('should set terminationDate to undefined when termDate is empty string', () => {
      const dto = { ...mockTemplateDto, termDate: '' };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.terminationDate).toBeUndefined();
    });

    it('should set terminationDate when termDate has a value', () => {
      const dto = { ...mockTemplateDto, termDate: '2026-12-31' };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.terminationDate).toBe('2026-12-31');
    });

    it('should set templateId from dto', () => {
      const result = (component as any).mapDtoToTemplateModel(mockTemplateDto);
      expect(result.templateId).toBe('TMPL000005');
    });

    it('should set donationType from dto', () => {
      const result = (component as any).mapDtoToTemplateModel(mockTemplateDto);
      expect(result.donationType).toBe('AL');
    });

    it('should derive Active status when effDate is past and no termDate', () => {
      const dto = { ...mockTemplateDto, effDate: '2020-01-01', termDate: null as any };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.status).toBe('Active');
    });

    it('should derive Future status when effDate is in the future', () => {
      const dto = { ...mockTemplateDto, effDate: '2099-01-01', termDate: null as any };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.status).toBe('Future');
    });

    it('should use donationType code as description when no matching donation type', () => {
      const dto = { ...mockTemplateDto, donationType: 'XY' };
      const result = (component as any).mapDtoToTemplateModel(dto);
      expect(result.donationTypeDescription).toBe('XY');
    });
  });

  describe('loadTemplates with falsy filter values', () => {
    it('should not pass donationType when filter value is empty string', () => {
      component.appliedFilters = { donationType: '' };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.donationType).toBeUndefined();
    });

    it('should not pass status when filter value is empty string', () => {
      component.appliedFilters = { status: '' };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.status).toBeUndefined();
    });

    it('should not pass effectiveDate when filter value is empty string', () => {
      component.appliedFilters = { effectiveDate: '', effectiveDatePeriod: 'After' };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.effectiveDate).toBeUndefined();
    });

    it('should not pass terminationDate when filter value is empty string', () => {
      component.appliedFilters = { terminationDate: '', terminationDatePeriod: 'Before' };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.terminationDate).toBeUndefined();
    });
  });

  describe('loadTemplates with all filters combined', () => {
    it('should pass all filter params simultaneously', () => {
      component.searchText = 'TMPL001';
      component.appliedFilters = {
        donationType: 'AL',
        status: 'Active',
        effectiveDate: '2025-01-01',
        effectiveDatePeriod: 'After',
        terminationDate: '2026-12-31',
        terminationDatePeriod: 'Before'
      };
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: { column: 'effectiveDate', direction: 'A' }
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.templateId).toBe('TMPL001');
      expect(params.donationType).toBe('AL');
      expect(params.status).toBe('Active');
      expect(params.effectiveDate).toBe('2025-01-01');
      expect(params.effectiveDatePeriod).toBe('After');
      expect(params.terminationDate).toBe('2026-12-31');
      expect(params.terminationDatePeriod).toBe('Before');
      expect(params.sortBy).toBe('effectiveDate');
      expect(params.sortDir).toBe('asc');
    });
  });

  describe('loadTemplates pagination skip calculation', () => {
    it('should pass correct skip for page 0 with pageSize 25', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 0, pageSize: 25 }
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalledWith(25, 0, jasmine.any(Object));
    });

    it('should pass correct skip for page 2 with pageSize 50', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 2, pageSize: 50 }
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalledWith(50, 100, jasmine.any(Object));
    });

    it('should pass correct skip for page 4 with pageSize 10', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 4, pageSize: 10 }
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalledWith(10, 40, jasmine.any(Object));
    });
  });

  describe('onRemoveFilterChip with unknown key', () => {
    it('should not modify other filters when removing unknown chip key', () => {
      component.applyFilters({ status: 'Active', donationType: 'AL' });
      component.onRemoveFilterChip('unknownKey');
      expect(component.appliedFilters?.status).toBe('Active');
      expect(component.appliedFilters?.donationType).toBe('AL');
    });

    it('should still reload templates when removing unknown chip key', () => {
      component.applyFilters({ status: 'Active' });
      hhServiceSpy.searchTemplates.calls.reset();
      component.onRemoveFilterChip('unknownKey');
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
    });
  });

  describe('convertFiltersToChips with empty filters', () => {
    it('should return empty array when no filter properties are set', () => {
      component.applyFilters({});
      expect(component.filterChips).toEqual([]);
    });

    it('should generate chips only for non-falsy filter properties', () => {
      component.applyFilters({ status: 'Active', donationType: undefined } as any);
      expect(component.filterChips.length).toBe(1);
      expect(component.filterChips[0].key).toBe('status');
    });
  });

  describe('loadTemplates sets isLoading correctly', () => {
    it('should set isLoading to true at the start of loading', () => {
      const subject = new Subject<any>();
      hhServiceSpy.searchTemplates.and.returnValue(subject.asObservable());
      component['loadTemplates']();
      expect(component.isLoading).toBe(true);
      subject.next({ data: [], totalRecords: 0 });
      subject.complete();
    });

    it('should set isLoading to false after successful load', () => {
      hhServiceSpy.searchTemplates.and.returnValue(of({ data: [], totalRecords: 0 }));
      component['loadTemplates']();
      expect(component.isLoading).toBe(false);
    });

    it('should set isLoading to false after error', () => {
      hhServiceSpy.searchTemplates.and.returnValue(throwError(() => ({ message: 'fail' })));
      component['loadTemplates']();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('loadTemplates with no sortConfig', () => {
    it('should not pass sort params when sortConfig is undefined', () => {
      component.tableConfig = {
        ...component.tableConfig,
        sortConfig: undefined
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.sortBy).toBeUndefined();
      expect(params.sortDir).toBeUndefined();
    });
  });

  describe('loadTemplates with empty searchText', () => {
    it('should not pass templateId when searchText is empty', () => {
      component.searchText = '';
      hhServiceSpy.searchTemplates.calls.reset();
      component['loadTemplates']();
      const params = hhServiceSpy.searchTemplates.calls.mostRecent().args[2];
      expect(params.templateId).toBeUndefined();
    });
  });

  describe('onTemplateSaved emits viewModeChange', () => {
    it('should emit viewModeChange with list mode', () => {
      spyOn(component.viewModeChange, 'emit');
      component.onTemplateSaved();
      expect(component.viewModeChange.emit).toHaveBeenCalledWith({ mode: 'list', templateId: undefined });
    });
  });

  describe('loadTemplates with multiple data items', () => {
    it('should map all DTOs in response', () => {
      const dto2 = { ...mockTemplateDto, templateId: 'TMPL000006', donationType: 'AU' };
      hhServiceSpy.searchTemplates.and.returnValue(of({
        data: [mockTemplateDto, dto2],
        totalRecords: 2
      }));
      component['loadTemplates']();
      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].templateId).toBe('TMPL000005');
      expect(component.dataSource[1].templateId).toBe('TMPL000006');
      expect(component.dataSource[1].donationTypeDescription).toBe('Autologous');
    });

    it('should set totalRecords from response with multiple items', () => {
      hhServiceSpy.searchTemplates.and.returnValue(of({
        data: [mockTemplateDto, { ...mockTemplateDto, templateId: 'T2' }],
        totalRecords: 100
      }));
      component['loadTemplates']();
      expect(component.totalRecords).toBe(100);
      expect(component.tableConfig.pagination!.totalRecords).toBe(100);
    });
  });

  describe('loadTemplates error clears dataSource', () => {
    it('should clear dataSource on error even if it had data before', () => {
      expect(component.dataSource.length).toBe(1);
      hhServiceSpy.searchTemplates.and.returnValue(throwError(() => ({ message: 'fail' })));
      component['loadTemplates']();
      expect(component.dataSource).toEqual([]);
    });
  });

  describe('chapter change with searchBarComponent', () => {
    it('should call clearSearch on searchBarComponent when it exists', () => {
      const mockSearchBar = { clearSearch: jasmine.createSpy('clearSearch') };
      (component as any).searchBarComponent = mockSearchBar;
      chapterChanged$.next();
      expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    });

    it('should not error when searchBarComponent is undefined', () => {
      (component as any).searchBarComponent = undefined;
      expect(() => chapterChanged$.next()).not.toThrow();
    });
  });

  describe('chapter change disposes overlay and resets pagination totalRecords', () => {
    it('should reset pagination totalRecords to 0 on chapter change', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, totalRecords: 99 }
      };
      hhServiceSpy.searchTemplates.and.returnValue(of({ data: [], totalRecords: 0 }));
      chapterChanged$.next();
      expect(component.tableConfig.pagination!.totalRecords).toBe(0);
    });

    it('should not error when overlayRef is null on chapter change', () => {
      component['overlayRef'] = null;
      expect(() => chapterChanged$.next()).not.toThrow();
    });
  });

  describe('onSearch resets pagination and reloads', () => {
    it('should reset pagination pageIndex and reload for non-empty search', () => {
      component.tableConfig = {
        ...component.tableConfig,
        pagination: { ...component.tableConfig.pagination!, pageIndex: 10 }
      };
      hhServiceSpy.searchTemplates.calls.reset();
      component.onSearch('TMPL999');
      expect(component.tableConfig.pagination!.pageIndex).toBe(0);
      expect(component.searchText).toBe('TMPL999');
      expect(hhServiceSpy.searchTemplates).toHaveBeenCalled();
    });
  });

  describe('getTableColumns donationTypeDescription formatter edge case', () => {
    it('should fall back to donationType when donationTypeDescription is null', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'donationTypeDescription');
      const row = { donationType: 'XX', donationTypeDescription: null } as any;
      expect(col?.valueFormatter?.(null, row)).toBe('XX - XX');
    });
  });
});
