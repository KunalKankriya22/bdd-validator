import { ChangeDetectorRef, ElementRef, TemplateRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { HeaderService } from '@shared/services/header.service';

import { SurveyTemplateComponent } from './survey-template';
import { SurveyTemplateService } from './services/survey-template.service';
import { SurveyTemplateModel, SurveyTemplateFilterValue } from './models/survey-template.model';
import { SurveyTemplateFilterChipsUtils } from './utils/filter-chips.utils';

describe('SurveyTemplateComponent', () => {
  let component: SurveyTemplateComponent;
  let serviceSpy: jasmine.SpyObj<SurveyTemplateService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let overlaySpy: any;
  let cdrSpy: jasmine.SpyObj<ChangeDetectorRef>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockRows: SurveyTemplateModel[] = [
    {
      templateId: 'TPL-002',
      chapterId: 'CH1',
      typeOfSurvey: 'D',
      surveyTypeDescription: 'Donor',
      effDate: '2026-01-02',
      termDate: null,
      templateStatus: 'Active',
    },
    {
      templateId: 'TPL-001',
      chapterId: 'CH1',
      typeOfSurvey: 'D',
      surveyTypeDescription: 'Donor',
      effDate: '2026-01-01',
      termDate: '2026-02-01',
      templateStatus: 'Inactive',
    },
  ];

  let chapterChangedSubject: Subject<void>;

  beforeEach(() => {
    chapterChangedSubject = new Subject<void>();

    serviceSpy = jasmine.createSpyObj<SurveyTemplateService>('SurveyTemplateService', [
      'getSurveyTemplates',
    ]);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    overlaySpy = jasmine.createSpyObj('Overlay', ['create', 'position'], {
      scrollStrategies: { block: () => ({}) },
    });
    cdrSpy = jasmine.createSpyObj<ChangeDetectorRef>('ChangeDetectorRef', ['detectChanges']);
    headerServiceSpy = jasmine.createSpyObj<HeaderService>(
      'HeaderService',
      ['chapterId', 'warehouseId', 'chapterTimeZone'],
      { chapterChanged$: chapterChangedSubject.asObservable() }
    );
    headerServiceSpy.chapterId.and.returnValue('CH1');
    headerServiceSpy.warehouseId.and.returnValue('W1');
    headerServiceSpy.chapterTimeZone.and.returnValue('+00:00');

    serviceSpy.getSurveyTemplates.and.returnValue(of(mockRows));
    component = new SurveyTemplateComponent(
      serviceSpy,
      overlaySpy,
      snackBarSpy,
      routerSpy,
      cdrSpy,
      headerServiceSpy
    );
  });

  it('should load and sort data on loadData', () => {
    component.loadData();

    expect(serviceSpy.getSurveyTemplates).toHaveBeenCalled();
    expect(component.allData.length).toBe(2);
    expect(component.dataSource.map((x) => x.templateId)).toEqual(['TPL-001', 'TPL-002']);
  });


  it('should sort ascending when sort event is A', () => {
    component.allData = [...mockRows];
    component.onSortChange({ column: 'templateId', direction: 'A' });

    expect(component.dataSource.map((x) => x.templateId)).toEqual(['TPL-001', 'TPL-002']);
  });

  it('should apply and clear filters', () => {
    const filters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };

    component.allData = [...mockRows];
    component.applyFilters(filters);
    expect(component.appliedFilters).toEqual(filters);
    expect(component.filterChips.length).toBe(1);

    component.clearAllFilters();
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
  });

  // --- ngOnInit ---

  it('should call loadData and subscribeToChapterChanges on ngOnInit', () => {
    spyOn(component, 'loadData');
    component.ngOnInit();
    expect(component.loadData).toHaveBeenCalled();
  });

  // --- ngAfterViewInit ---

  it('should set cellTemplate on statusColumn when found', () => {
    const mockTemplate = {} as TemplateRef<unknown>;
    (component as any).statusBadgeTemplate = mockTemplate;
    // Ensure there's a status column
    const statusCol = component.tableConfig.columns.find(c => c.key === 'templateStatus');
    expect(statusCol).toBeTruthy();

    component.ngAfterViewInit();

    expect(statusCol!.cellTemplate).toBe(mockTemplate);
    expect(cdrSpy.detectChanges).toHaveBeenCalled();
  });

  it('should not set cellTemplate when statusColumn is not found', () => {
    (component as any).statusBadgeTemplate = {} as TemplateRef<unknown>;
    // Remove the status column
    component.tableConfig.columns = component.tableConfig.columns.filter(c => c.key !== 'templateStatus');

    component.ngAfterViewInit();

    // detectChanges should not be called since no status column found
    expect(cdrSpy.detectChanges).not.toHaveBeenCalled();
  });

  // --- ngOnDestroy ---

  it('should dispose overlayRef on ngOnDestroy when it exists', () => {
    const mockOverlayRef = jasmine.createSpyObj<OverlayRef>('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;

    component.ngOnDestroy();

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  });

  it('should not throw on ngOnDestroy when overlayRef is null', () => {
    (component as any).overlayRef = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // --- initializeTableConfig / valueFormatters ---

  it('should format templateStatus to value or Inactive via valueFormatter', () => {
    const statusCol = component.tableConfig.columns.find(c => c.key === 'templateStatus');
    expect(statusCol).toBeTruthy();
    expect(statusCol!.valueFormatter!('Active')).toBe('Active');
    expect(statusCol!.valueFormatter!(null as any)).toBe('Inactive');
    expect(statusCol!.valueFormatter!(undefined as any)).toBe('Inactive');
    expect(statusCol!.valueFormatter!('')).toBe('Inactive');
  });

  it('should format effDate via valueFormatter with valid date', () => {
    const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
    expect(effDateCol).toBeTruthy();
    const result = effDateCol!.valueFormatter!('2026-01-15');
    expect(result).toBe('15-JAN-2026');
  });

  it('should format effDate via valueFormatter with null/empty value', () => {
    const effDateCol = component.tableConfig.columns.find(c => c.key === 'effDate');
    expect(effDateCol!.valueFormatter!(null as any)).toBe('-');
    expect(effDateCol!.valueFormatter!('')).toBe('-');
  });

  it('should format termDate via valueFormatter with valid date', () => {
    const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
    expect(termDateCol).toBeTruthy();
    const result = termDateCol!.valueFormatter!('2026-02-01');
    expect(result).toBe('01-FEB-2026');
  });

  it('should format termDate via valueFormatter with null value', () => {
    const termDateCol = component.tableConfig.columns.find(c => c.key === 'termDate');
    expect(termDateCol!.valueFormatter!(null as any)).toBe('-');
  });

  it('should configure 3 row actions', () => {
    expect(component.tableConfig.rowActions!.length).toBe(3);
    expect(component.tableConfig.rowActions![0].action).toBe('linkTemplate');
    expect(component.tableConfig.rowActions![1].action).toBe('viewResponses');
    expect(component.tableConfig.rowActions![2].action).toBe('edit');
  });

  // --- loadData ---

  it('should set isLoading true then false via finalize', () => {
    serviceSpy.getSurveyTemplates.and.returnValue(of([]));
    component.loadData();
    // After subscribe completes and finalize runs, isLoading should be false
    expect(component.isLoading).toBe(false);
  });

  // --- applyClientSideFiltering - search ---

  it('should filter by search text (case insensitive)', () => {
    component.allData = [...mockRows];
    component.searchText = 'tpl-001';
    component.onSearch('tpl-001');

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].templateId).toBe('TPL-001');
  });

  it('should return all data when search text is empty', () => {
    component.allData = [...mockRows];
    component.searchText = '';
    component.onSearchCleared();

    expect(component.dataSource.length).toBe(2);
  });

  // --- applyClientSideFiltering - effDate filter ---

  it('should filter by effDate with after period', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-02'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };
    component.onSearch('');

    // Only TPL-002 has effDate 2026-01-02 which is same or after 2026-01-02
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].templateId).toBe('TPL-002');
  });

  it('should filter by effDate with before period', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: 'before',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };
    component.onSearchCleared();

    // Only TPL-001 has effDate 2026-01-01 which is same or before 2026-01-01
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].templateId).toBe('TPL-001');
  });

  // --- applyClientSideFiltering - termDate filter ---

  it('should filter by termDate with after period', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: 'after',
      termDate: new Date('2026-01-15'),
      status: null,
    };
    component.onSearchCleared();

    // TPL-001 has termDate 2026-02-01 which is after 2026-01-15; TPL-002 has null termDate
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].templateId).toBe('TPL-001');
  });

  it('should filter by termDate with before period', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: 'before',
      termDate: new Date('2026-03-01'),
      status: null,
    };
    component.onSearchCleared();

    // TPL-001 has termDate 2026-02-01 which is before 2026-03-01; TPL-002 has null termDate (excluded)
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].templateId).toBe('TPL-001');
  });

  it('should exclude items with null termDate when termDate filter is applied', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: 'after',
      termDate: new Date('2020-01-01'),
      status: null,
    };
    component.onSearchCleared();

    // TPL-002 has null termDate so it's excluded
    expect(component.dataSource.every(d => d.termDate !== null)).toBeTrue();
  });

  // --- applyClientSideFiltering - status filter ---

  it('should filter by status', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };
    component.onSearchCleared();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].templateStatus).toBe('Active');
  });

  it('should filter by Inactive status', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: 'Inactive',
    };
    component.onSearchCleared();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].templateStatus).toBe('Inactive');
  });

  // --- applyClientSideFiltering - combined filters ---

  it('should apply both effDate and status filters together', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };
    component.onSearchCleared();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].templateId).toBe('TPL-002');
  });

  // --- applyClientSideFiltering - sort direction ---

  it('should sort descending when sort direction is D', () => {
    component.allData = [...mockRows];
    component.onSortChange({ column: 'templateId', direction: 'D' });

    expect(component.dataSource.map(x => x.templateId)).toEqual(['TPL-002', 'TPL-001']);
  });

  it('should not sort when sort direction is default', () => {
    component.allData = [...mockRows];
    component.onSortChange({ column: 'templateId', direction: 'default' });

    // Data stays in original order (no sort applied)
    expect(component.dataSource.map(x => x.templateId)).toEqual(['TPL-002', 'TPL-001']);
  });

  it('should not sort when column is not templateId', () => {
    component.allData = [...mockRows];
    component.onSortChange({ column: 'effDate', direction: 'A' });

    // Data stays in original order because only templateId sorting is implemented
    expect(component.dataSource.map(x => x.templateId)).toEqual(['TPL-002', 'TPL-001']);
  });

  // --- onSearch / onSearchCleared ---

  it('should set searchText on onSearch', () => {
    component.allData = [...mockRows];
    component.onSearch('TPL-002');

    expect(component.searchText).toBe('TPL-002');
    expect(component.dataSource.length).toBe(1);
  });

  it('should clear searchText on onSearchCleared', () => {
    component.allData = [...mockRows];
    component.searchText = 'TPL-002';
    component.onSearchCleared();

    expect(component.searchText).toBe('');
    expect(component.dataSource.length).toBe(2);
  });

  // --- onSortChange ---

  it('should update sortConfig on onSortChange', () => {
    component.onSortChange({ column: 'templateId', direction: 'D' });

    expect(component.tableConfig.sortConfig!.direction).toBe('D');
    expect(component.tableConfig.sortConfig!.column).toBe('templateId');
  });

  it('should handle onSortChange when sortConfig is undefined', () => {
    component.tableConfig.sortConfig = undefined as any;
    component.allData = [...mockRows];

    expect(() => component.onSortChange({ column: 'templateId', direction: 'A' })).not.toThrow();
  });

  // --- onRowAction ---

  it('should navigate to link template on linkTemplate action', () => {
    const template = mockRows[0];
    spyOn(component, 'navigateToLinkTemplate');

    component.onRowAction({ action: 'linkTemplate', row: template });

    expect(component.navigateToLinkTemplate).toHaveBeenCalledWith(template);
  });

  it('should navigate to view responses on viewResponses action', () => {
    const template = mockRows[0];
    spyOn(component, 'navigateToViewResponses');

    component.onRowAction({ action: 'viewResponses', row: template });

    expect(component.navigateToViewResponses).toHaveBeenCalledWith(template);
  });

  it('should open edit dialog on edit action', () => {
    const template = mockRows[0];
    spyOn(component, 'openEditTemplateDialog');

    component.onRowAction({ action: 'edit', row: template });

    expect(component.openEditTemplateDialog).toHaveBeenCalledWith(template);
  });

  it('should do nothing for unknown row action', () => {
    const template = mockRows[0];
    spyOn(component, 'navigateToLinkTemplate');
    spyOn(component, 'navigateToViewResponses');
    spyOn(component, 'openEditTemplateDialog');

    component.onRowAction({ action: 'unknownAction', row: template });

    expect(component.navigateToLinkTemplate).not.toHaveBeenCalled();
    expect(component.navigateToViewResponses).not.toHaveBeenCalled();
    expect(component.openEditTemplateDialog).not.toHaveBeenCalled();
  });

  // --- navigateToLinkTemplate ---

  it('should navigate to link template with correct route and queryParams', () => {
    const template = mockRows[0];
    component.navigateToLinkTemplate(template);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/donor-functions', 'donor-survey-manager', 'link-template'],
      { queryParams: { templateId: 'TPL-002' } }
    );
  });

  // --- navigateToViewResponses ---

  it('should navigate to view responses with correct route', () => {
    const template = mockRows[0];
    component.navigateToViewResponses(template);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/donor-functions', 'donor-survey-manager', 'responses', 'CH1', 'TPL-002']
    );
  });

  // --- navigateToEditTemplate ---

  it('should navigate to edit template with correct route and queryParams', () => {
    const template = mockRows[1];
    component.navigateToEditTemplate(template);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/donor-functions', 'donor-survey-manager', 'add-template'],
      { queryParams: { templateId: 'TPL-001' } }
    );
  });

  // --- openAddTemplateDialog ---

  it('should navigate to add template route', () => {
    component.openAddTemplateDialog();

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/donor-functions', 'donor-survey-manager', 'add-template']
    );
  });

  // --- openEditTemplateDialog ---

  it('should navigate to edit template route with templateId queryParam', () => {
    const template = mockRows[0];
    component.openEditTemplateDialog(template);

    expect(routerSpy.navigate).toHaveBeenCalledWith(
      ['/donor-functions', 'donor-survey-manager', 'add-template'],
      { queryParams: { templateId: 'TPL-002' } }
    );
  });

  // --- openFilter ---

  it('should close filter if already open', () => {
    component.isFilterOpen = true;
    spyOn(component, 'closeFilter');

    component.openFilter();

    expect(component.closeFilter).toHaveBeenCalled();
  });

  it('should open filter overlay when not already open', () => {
    component.isFilterOpen = false;
    const mockBtnEl = { getBoundingClientRect: () => ({ bottom: 100, top: 50, left: 0, right: 100, width: 100, height: 50 }) };
    const mockCardEl = { getBoundingClientRect: () => ({ top: 40, bottom: 500, left: 0, right: 800, width: 800, height: 460 }) };
    (component as any).filterBtn = { nativeElement: mockBtnEl };
    (component as any).tableCard = { nativeElement: mockCardEl };

    const mockPositionStrategy = {
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue({
        withPositions: jasmine.createSpy('withPositions').and.returnValue({})
      })
    };
    overlaySpy.position.and.returnValue(mockPositionStrategy);

    const applySubject = new Subject<any>();
    const closeSubject = new Subject<void>();
    const backdropSubject = new Subject<void>();

    const mockPortalRef = {
      instance: {
        currentFilters: null as any,
        apply: applySubject.asObservable(),
        close: closeSubject.asObservable()
      }
    };

    const mockOverlayRef = {
      attach: jasmine.createSpy('attach').and.returnValue(mockPortalRef),
      backdropClick: jasmine.createSpy('backdropClick').and.returnValue(backdropSubject.asObservable()),
      dispose: jasmine.createSpy('dispose')
    };
    overlaySpy.create.and.returnValue(mockOverlayRef);

    component.openFilter();

    expect(component.isFilterOpen).toBeTrue();
    expect(overlaySpy.create).toHaveBeenCalled();
    expect(mockOverlayRef.attach).toHaveBeenCalled();
    expect(mockPortalRef.instance.currentFilters).toEqual(component.appliedFilters);
  });

  it('should close filter when filter panel emits close', () => {
    component.isFilterOpen = false;
    const mockBtnEl = { getBoundingClientRect: () => ({ bottom: 100, top: 50, left: 0, right: 100, width: 100, height: 50 }) };
    const mockCardEl = { getBoundingClientRect: () => ({ top: 40, bottom: 500, left: 0, right: 800, width: 800, height: 460 }) };
    (component as any).filterBtn = { nativeElement: mockBtnEl };
    (component as any).tableCard = { nativeElement: mockCardEl };

    const mockPositionStrategy = {
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue({
        withPositions: jasmine.createSpy('withPositions').and.returnValue({})
      })
    };
    overlaySpy.position.and.returnValue(mockPositionStrategy);

    const closeSubject = new Subject<void>();
    const applySubject = new Subject<any>();
    const backdropSubject = new Subject<void>();

    const mockPortalRef = {
      instance: {
        currentFilters: null as any,
        apply: applySubject.asObservable(),
        close: closeSubject.asObservable()
      }
    };

    const mockOverlayRef = {
      attach: jasmine.createSpy('attach').and.returnValue(mockPortalRef),
      backdropClick: jasmine.createSpy('backdropClick').and.returnValue(backdropSubject.asObservable()),
      dispose: jasmine.createSpy('dispose')
    };
    overlaySpy.create.and.returnValue(mockOverlayRef);

    component.openFilter();

    // Emit close from filter panel
    closeSubject.next();

    expect(component.isFilterOpen).toBeFalse();
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  });

  it('should apply filters when filter panel emits apply', () => {
    component.isFilterOpen = false;
    component.allData = [...mockRows];
    const mockBtnEl = { getBoundingClientRect: () => ({ bottom: 100, top: 50, left: 0, right: 100, width: 100, height: 50 }) };
    const mockCardEl = { getBoundingClientRect: () => ({ top: 40, bottom: 500, left: 0, right: 800, width: 800, height: 460 }) };
    (component as any).filterBtn = { nativeElement: mockBtnEl };
    (component as any).tableCard = { nativeElement: mockCardEl };

    const mockPositionStrategy = {
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue({
        withPositions: jasmine.createSpy('withPositions').and.returnValue({})
      })
    };
    overlaySpy.position.and.returnValue(mockPositionStrategy);

    const applySubject = new Subject<SurveyTemplateFilterValue>();
    const closeSubject = new Subject<void>();
    const backdropSubject = new Subject<void>();

    const mockPortalRef = {
      instance: {
        currentFilters: null as any,
        apply: applySubject.asObservable(),
        close: closeSubject.asObservable()
      }
    };

    const mockOverlayRef = {
      attach: jasmine.createSpy('attach').and.returnValue(mockPortalRef),
      backdropClick: jasmine.createSpy('backdropClick').and.returnValue(backdropSubject.asObservable()),
      dispose: jasmine.createSpy('dispose')
    };
    overlaySpy.create.and.returnValue(mockOverlayRef);

    component.openFilter();

    const filters: SurveyTemplateFilterValue = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };
    applySubject.next(filters);

    expect(component.appliedFilters).toEqual(filters);
    expect(component.isFilterOpen).toBeFalse();
  });

  it('should close filter on backdrop click', () => {
    component.isFilterOpen = false;
    const mockBtnEl = { getBoundingClientRect: () => ({ bottom: 100, top: 50, left: 0, right: 100, width: 100, height: 50 }) };
    const mockCardEl = { getBoundingClientRect: () => ({ top: 40, bottom: 500, left: 0, right: 800, width: 800, height: 460 }) };
    (component as any).filterBtn = { nativeElement: mockBtnEl };
    (component as any).tableCard = { nativeElement: mockCardEl };

    const mockPositionStrategy = {
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue({
        withPositions: jasmine.createSpy('withPositions').and.returnValue({})
      })
    };
    overlaySpy.position.and.returnValue(mockPositionStrategy);

    const closeSubject = new Subject<void>();
    const applySubject = new Subject<any>();
    const backdropSubject = new Subject<void>();

    const mockPortalRef = {
      instance: {
        currentFilters: null as any,
        apply: applySubject.asObservable(),
        close: closeSubject.asObservable()
      }
    };

    const mockOverlayRef = {
      attach: jasmine.createSpy('attach').and.returnValue(mockPortalRef),
      backdropClick: jasmine.createSpy('backdropClick').and.returnValue(backdropSubject.asObservable()),
      dispose: jasmine.createSpy('dispose')
    };
    overlaySpy.create.and.returnValue(mockOverlayRef);

    component.openFilter();
    backdropSubject.next();

    expect(component.isFilterOpen).toBeFalse();
    expect(mockOverlayRef.dispose).toHaveBeenCalled();
  });

  // --- closeFilter ---

  it('should dispose overlayRef and set isFilterOpen to false', () => {
    const mockOverlayRef = jasmine.createSpyObj<OverlayRef>('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    component.isFilterOpen = true;

    component.closeFilter();

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
    expect(component.isFilterOpen).toBeFalse();
  });

  it('should handle closeFilter when overlayRef is null', () => {
    (component as any).overlayRef = null;
    component.isFilterOpen = true;

    component.closeFilter();

    expect(component.isFilterOpen).toBeFalse();
  });

  // --- applyFilters ---

  it('should set appliedFilters, generate filterChips, close filter, and apply filtering', () => {
    component.allData = [...mockRows];
    spyOn(component, 'closeFilter');

    const filters: SurveyTemplateFilterValue = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };

    component.applyFilters(filters);

    expect(component.appliedFilters).toEqual(filters);
    expect(component.filterChips.length).toBeGreaterThan(0);
    expect(component.closeFilter).toHaveBeenCalled();
  });

  // --- onRemoveFilterChip ---

  it('should remove a filter chip and reapply filtering', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };
    component.filterChips = SurveyTemplateFilterChipsUtils.convertFiltersToChips(component.appliedFilters);

    component.onRemoveFilterChip('status');

    expect(component.appliedFilters!.status).toBeNull();
    // effDate filter should still be present
    expect(component.filterChips.length).toBe(1);
  });

  it('should set appliedFilters to null when removing the last filter', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };
    component.filterChips = SurveyTemplateFilterChipsUtils.convertFiltersToChips(component.appliedFilters);

    component.onRemoveFilterChip('status');

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
  });

  it('should do nothing when appliedFilters is null on onRemoveFilterChip', () => {
    component.appliedFilters = null;
    component.filterChips = [];

    component.onRemoveFilterChip('status');

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
  });

  // --- clearAllFilters ---

  it('should clear all filters and reapply filtering', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };
    component.filterChips = [{ key: 'status', label: 'Status: Active', value: 'Active', removable: true }];

    component.clearAllFilters();

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.dataSource.length).toBe(2);
  });

  // --- hasActiveFilters ---

  it('should return true when there are active filters', () => {
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };
    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should return false when no active filters', () => {
    component.appliedFilters = null;
    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('should return false when filters exist but all values are null', () => {
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: null,
    };
    expect(component.hasActiveFilters()).toBeFalse();
  });

  // --- subscribeToChapterChanges ---

  it('should reset state and reload data when chapter changes', () => {
    spyOn(component, 'loadData');
    spyOn(component, 'closeFilter');
    const mockSearchBar = jasmine.createSpyObj('SearchBar', ['clearSearch']);
    component.searchBarComponent = mockSearchBar;

    component.ngOnInit();

    // Set some state
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };
    component.filterChips = [{ key: 'status', label: 'Status: Active', value: 'Active', removable: true }];
    component.searchText = 'TPL-001';

    // Emit chapter change
    chapterChangedSubject.next();

    expect(component.closeFilter).toHaveBeenCalled();
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.searchText).toBe('');
    expect(mockSearchBar.clearSearch).toHaveBeenCalled();
    // loadData is called once in ngOnInit and once from chapter change
    expect(component.loadData).toHaveBeenCalledTimes(2);
  });

  it('should handle chapter change when searchBarComponent is undefined', () => {
    spyOn(component, 'loadData');
    spyOn(component, 'closeFilter');
    (component as any).searchBarComponent = undefined;

    component.ngOnInit();

    // Should not throw when searchBarComponent is undefined
    expect(() => chapterChangedSubject.next()).not.toThrow();
  });

  // --- handleKeyboardEvent ---

  it('should focus search bar on Alt+S', () => {
    const mockSearchBar = jasmine.createSpyObj('SearchBar', ['focus']);
    component.searchBarComponent = mockSearchBar;

    const event = new KeyboardEvent('keydown', { key: 's', altKey: true });
    spyOn(event, 'preventDefault');

    component.handleKeyboardEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(mockSearchBar.focus).toHaveBeenCalled();
  });

  it('should open filter on Alt+F', () => {
    // Mock filterBtn/tableCard so openFilter doesn't throw
    const mockBtnEl = { getBoundingClientRect: () => ({ bottom: 100, top: 50, left: 0, right: 100, width: 100, height: 50 }) };
    const mockCardEl = { getBoundingClientRect: () => ({ top: 40, bottom: 500, left: 0, right: 800, width: 800, height: 460 }) };
    (component as any).filterBtn = { nativeElement: mockBtnEl };
    (component as any).tableCard = { nativeElement: mockCardEl };

    const mockPositionStrategy = {
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue({
        withPositions: jasmine.createSpy('withPositions').and.returnValue({})
      })
    };
    overlaySpy.position.and.returnValue(mockPositionStrategy);

    const mockOverlayRef = {
      attach: jasmine.createSpy('attach').and.returnValue({
        instance: {
          currentFilters: null,
          apply: of(),
          close: of()
        }
      }),
      backdropClick: jasmine.createSpy('backdropClick').and.returnValue(of()),
      dispose: jasmine.createSpy('dispose')
    };
    overlaySpy.create.and.returnValue(mockOverlayRef);

    const event = new KeyboardEvent('keydown', { key: 'f', altKey: true });
    spyOn(event, 'preventDefault');

    component.handleKeyboardEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.isFilterOpen).toBeTrue();
  });

  it('should close filter on Escape when filter is open', () => {
    component.isFilterOpen = true;
    spyOn(component, 'closeFilter');

    const event = new KeyboardEvent('keydown', { key: 'Escape' });

    component.handleKeyboardEvent(event);

    expect(component.closeFilter).toHaveBeenCalled();
  });

  it('should not close filter on Escape when filter is not open', () => {
    component.isFilterOpen = false;
    spyOn(component, 'closeFilter');

    const event = new KeyboardEvent('keydown', { key: 'Escape' });

    component.handleKeyboardEvent(event);

    expect(component.closeFilter).not.toHaveBeenCalled();
  });

  it('should do nothing for unhandled keyboard events', () => {
    spyOn(component, 'openFilter');
    spyOn(component, 'closeFilter');

    const event = new KeyboardEvent('keydown', { key: 'a' });

    component.handleKeyboardEvent(event);

    expect(component.openFilter).not.toHaveBeenCalled();
    expect(component.closeFilter).not.toHaveBeenCalled();
  });

  // --- Edge cases ---

  it('should handle empty data from service', () => {
    serviceSpy.getSurveyTemplates.and.returnValue(of([]));
    component.loadData();

    expect(component.allData).toEqual([]);
    expect(component.dataSource).toEqual([]);
  });

  it('should handle items with null templateId during search', () => {
    component.allData = [
      { ...mockRows[0], templateId: null as any },
      mockRows[1],
    ];
    component.searchText = 'TPL';

    // Should not throw with null templateId
    expect(() => component.onSearch('TPL')).not.toThrow();
  });

  it('should handle sort with null templateId values', () => {
    component.allData = [
      { ...mockRows[0], templateId: '' },
      mockRows[1],
    ];
    component.onSortChange({ column: 'templateId', direction: 'A' });

    expect(component.dataSource.length).toBe(2);
    expect(component.dataSource[0].templateId).toBe('');
    expect(component.dataSource[1].templateId).toBe('TPL-001');
  });

  // --- Filters with no effDatePeriod or no effDate (partial filter values) ---

  it('should not apply effDate filter when effDate is set but effDatePeriod is null', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };
    component.onSearchCleared();

    // No filtering applied since effDatePeriod is null
    expect(component.dataSource.length).toBe(2);
  });

  it('should not apply termDate filter when termDate is set but termDatePeriod is null', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: new Date('2026-02-01'),
      status: null,
    };
    component.onSearchCleared();

    // No filtering applied since termDatePeriod is null
    expect(component.dataSource.length).toBe(2);
  });

  // --- onRemoveFilterChip with effDate and termDate keys ---

  it('should remove effDate filter chip', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: 'Active',
    };

    component.onRemoveFilterChip('effDate');

    expect(component.appliedFilters!.effDate).toBeNull();
    expect(component.appliedFilters!.effDatePeriod).toBeNull();
    // Status filter should remain
    expect(component.appliedFilters!.status).toBe('Active');
  });

  it('should remove termDate filter chip', () => {
    component.allData = [...mockRows];
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: 'after',
      termDate: new Date('2026-02-01'),
      status: 'Active',
    };

    component.onRemoveFilterChip('termDate');

    expect(component.appliedFilters!.termDate).toBeNull();
    expect(component.appliedFilters!.termDatePeriod).toBeNull();
    expect(component.appliedFilters!.status).toBe('Active');
  });
});
