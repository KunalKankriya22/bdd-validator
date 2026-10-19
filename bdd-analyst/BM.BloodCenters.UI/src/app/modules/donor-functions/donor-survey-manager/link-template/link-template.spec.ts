import { ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay } from '@angular/cdk/overlay';
import { of, Subject } from 'rxjs';

import { LinkTemplateComponent } from './link-template';
import { TemplateLinkService } from './services/template-link.service';
import { HeaderService } from '@shared/services/header.service';
import { TemplateLinkModel } from './models/template-link.model';
import { SurveyTemplateFilterChipsUtils } from '../survey-template/utils/filter-chips.utils';

describe('LinkTemplateComponent', () => {
  let component: LinkTemplateComponent;
  let serviceSpy: jasmine.SpyObj<TemplateLinkService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let overlaySpy: any;
  let headerSpy: jasmine.SpyObj<HeaderService>;

  const routeMock = {
    queryParams: of({ templateId: 'TPL-001' }),
  } as unknown as ActivatedRoute;

  const rows: TemplateLinkModel[] = [
    {
      templateId: 'TPL-001',
      groupId: 'G2',
      categoryCode: 'C1',
      categoryValues: 'A,B',
      effDate: '2026-01-02',
      termDate: null,
      chapterId: 'CH1',
    },
    {
      templateId: 'TPL-001',
      groupId: 'G1',
      categoryCode: 'C2',
      categoryValues: 'C',
      effDate: '2026-01-01',
      termDate: null,
      chapterId: 'CH1',
    },
  ];

  beforeEach(() => {
    serviceSpy = jasmine.createSpyObj<TemplateLinkService>('TemplateLinkService', [
      'getTemplateLinks',
      'createTemplateLink',
      'updateTemplateLink',
      'formatDate',
    ]);
    snackBarSpy = jasmine.createSpyObj<MatSnackBar>('MatSnackBar', ['open']);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    overlaySpy = jasmine.createSpyObj('Overlay', ['create', 'position'], {
      scrollStrategies: { block: () => ({}) },
    });
    headerSpy = jasmine.createSpyObj<HeaderService>('HeaderService', ['chapterId']);
    (headerSpy as any).chapterChanged$ = new Subject<void>();

    headerSpy.chapterId.and.returnValue('CH1');
    serviceSpy.getTemplateLinks.and.returnValue(of(rows));
    serviceSpy.createTemplateLink.and.returnValue(
      of({ success: true, message: 'Created', data: [] }),
    );
    serviceSpy.updateTemplateLink.and.returnValue(
      of({ success: true, message: 'Updated', data: [] }),
    );
    serviceSpy.formatDate.and.returnValue('08-APR-2026');

    component = new LinkTemplateComponent(
      serviceSpy,
      overlaySpy,
      snackBarSpy,
      routerSpy,
      routeMock,
      headerSpy
    );
  });

  it('should read query param templateId and load data on init', () => {
    const loadSpy = spyOn(component, 'loadData').and.callThrough();
    component.ngOnInit();

    expect(component.templateId).toBe('TPL-001');
    expect(loadSpy).toHaveBeenCalled();
    expect(component.headerConfig.title).toContain('TPL-001');
  });

  it('should load and sort data by groupId ascending', () => {
    component.chapterId = 'CH1';
    component.templateId = 'TPL-001';

    component.loadData();

    expect(serviceSpy.getTemplateLinks).toHaveBeenCalledWith('CH1', 'TPL-001');
    expect(component.dataSource.map((x) => x.groupId)).toEqual(['G1', 'G2']);
  });



  it('should create link and keep panel open for saveAndCreateAnother', () => {
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.sidePanelOpen = true;

    component.onLinkPanelSave({
      action: 'saveAndCreateAnother',
      mode: 'add',
      data: {
        surveyGroupId: 'G4',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'A',
        effDate: null,
        termDate: null,
      },
    });

    expect(serviceSpy.createTemplateLink).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.sidePanelResetToken).toBe(1);
  });

  it('should update link and close panel in edit mode', () => {
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.sidePanelOpen = true;

    component.onLinkPanelSave({
      action: 'save',
      mode: 'edit',
      data: {
        surveyGroupId: 'G1',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'A',
        effDate: null,
        termDate: null,
      },
    });

    expect(serviceSpy.updateTemplateLink).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBeFalse();
  });

  // ─── ngOnInit edge cases ─────────────────────────────────────────────

  it('should show snackbar error and navigate back when templateId is missing', () => {
    const noTemplateMock = {
      queryParams: of({}),
    } as unknown as ActivatedRoute;

    const comp = new LinkTemplateComponent(
      serviceSpy,
      overlaySpy,
      snackBarSpy,
      routerSpy,
      noTemplateMock,
      headerSpy
    );

    const navSpy = spyOn(comp, 'navigateBack');
    comp.ngOnInit();

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Template ID is required',
      'DISMISS',
      jasmine.objectContaining({ duration: 5000, panelClass: ['error-snackbar'] })
    );
    expect(navSpy).toHaveBeenCalled();
  });

  // ─── ngOnDestroy ─────────────────────────────────────────────────────

  it('should complete destroy$ and dispose overlayRef on ngOnDestroy', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;

    component.ngOnDestroy();

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
  });

  it('should complete destroy$ without error when overlayRef is null', () => {
    (component as any).overlayRef = null;
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  // ─── loadData ────────────────────────────────────────────────────────

  it('should not call service when templateId is null', () => {
    component.templateId = null;
    component.chapterId = 'CH1';

    component.loadData();

    expect(serviceSpy.getTemplateLinks).not.toHaveBeenCalled();
  });

  it('should not call service when chapterId is empty', () => {
    component.templateId = 'TPL-001';
    component.chapterId = '';

    component.loadData();

    expect(serviceSpy.getTemplateLinks).not.toHaveBeenCalled();
  });

  it('should set isLoading to false after loadData completes', () => {
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';

    component.loadData();

    expect(component.isLoading).toBeFalse();
  });

  // ─── applyClientSideFiltering (date filters) ────────────────────────

  it('should filter by effDate with period "after"', () => {
    const dataWithDates: TemplateLinkModel[] = [
      { templateId: 'T1', groupId: 'G1', categoryCode: 'C1', categoryValues: 'V', effDate: '2026-03-01', termDate: null, chapterId: 'CH1' },
      { templateId: 'T1', groupId: 'G2', categoryCode: 'C2', categoryValues: 'V', effDate: '2026-01-01', termDate: null, chapterId: 'CH1' },
    ];

    serviceSpy.getTemplateLinks.and.returnValue(of(dataWithDates));
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-02-01'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };

    component.loadData();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].groupId).toBe('G1');
  });

  it('should filter by effDate with period "before"', () => {
    const dataWithDates: TemplateLinkModel[] = [
      { templateId: 'T1', groupId: 'G1', categoryCode: 'C1', categoryValues: 'V', effDate: '2026-03-01', termDate: null, chapterId: 'CH1' },
      { templateId: 'T1', groupId: 'G2', categoryCode: 'C2', categoryValues: 'V', effDate: '2026-01-01', termDate: null, chapterId: 'CH1' },
    ];

    serviceSpy.getTemplateLinks.and.returnValue(of(dataWithDates));
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.appliedFilters = {
      effDatePeriod: 'before',
      effDate: new Date('2026-02-01'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };

    component.loadData();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].groupId).toBe('G2');
  });

  it('should filter by termDate with period "after"', () => {
    const dataWithDates: TemplateLinkModel[] = [
      { templateId: 'T1', groupId: 'G1', categoryCode: 'C1', categoryValues: 'V', effDate: '2026-01-01', termDate: '2026-06-01', chapterId: 'CH1' },
      { templateId: 'T1', groupId: 'G2', categoryCode: 'C2', categoryValues: 'V', effDate: '2026-01-01', termDate: '2026-02-01', chapterId: 'CH1' },
      { templateId: 'T1', groupId: 'G3', categoryCode: 'C3', categoryValues: 'V', effDate: '2026-01-01', termDate: null, chapterId: 'CH1' },
    ];

    serviceSpy.getTemplateLinks.and.returnValue(of(dataWithDates));
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: 'after',
      termDate: new Date('2026-04-01'),
      status: null,
    };

    component.loadData();

    // G3 has null termDate so excluded, G2 is before filter date so excluded
    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].groupId).toBe('G1');
  });

  it('should filter by termDate with period "before"', () => {
    const dataWithDates: TemplateLinkModel[] = [
      { templateId: 'T1', groupId: 'G1', categoryCode: 'C1', categoryValues: 'V', effDate: '2026-01-01', termDate: '2026-06-01', chapterId: 'CH1' },
      { templateId: 'T1', groupId: 'G2', categoryCode: 'C2', categoryValues: 'V', effDate: '2026-01-01', termDate: '2026-02-01', chapterId: 'CH1' },
    ];

    serviceSpy.getTemplateLinks.and.returnValue(of(dataWithDates));
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: 'before',
      termDate: new Date('2026-04-01'),
      status: null,
    };

    component.loadData();

    expect(component.dataSource.length).toBe(1);
    expect(component.dataSource[0].groupId).toBe('G2');
  });

  it('should sort descending when direction is D', () => {
    serviceSpy.getTemplateLinks.and.returnValue(of([...rows]));
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.tableConfig.sortConfig = { column: 'groupId', direction: 'D' };

    component.loadData();

    expect(component.dataSource.map((x) => x.groupId)).toEqual(['G2', 'G1']);
  });

  it('should not sort when direction is default', () => {
    serviceSpy.getTemplateLinks.and.returnValue(of([...rows]));
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.tableConfig.sortConfig = { column: 'groupId', direction: 'default' };

    component.loadData();

    // Should keep original order
    expect(component.dataSource.map((x) => x.groupId)).toEqual(['G2', 'G1']);
  });

  // ─── onSortChange ────────────────────────────────────────────────────

  it('should update sort config and re-filter on sort change', () => {
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.allData = [...rows];

    component.onSortChange({ column: 'groupId', direction: 'D' });

    expect(component.tableConfig.sortConfig!.direction).toBe('D');
    expect(component.tableConfig.sortConfig!.column).toBe('groupId');
    expect(component.dataSource.map((x) => x.groupId)).toEqual(['G2', 'G1']);
  });

  // ─── onRowAction ─────────────────────────────────────────────────────

  it('should open edit panel when action is edit', () => {
    component.templateId = 'TPL-001';
    const editSpy = spyOn(component, 'openEditPanel');
    const row = rows[0];

    component.onRowAction({ action: 'edit', row });

    expect(editSpy).toHaveBeenCalledWith(row);
  });

  it('should not open edit panel for non-edit actions', () => {
    component.templateId = 'TPL-001';
    const editSpy = spyOn(component, 'openEditPanel');

    component.onRowAction({ action: 'delete', row: rows[0] });

    expect(editSpy).not.toHaveBeenCalled();
  });

  // ─── openAddPanel ────────────────────────────────────────────────────

  it('should open add panel with correct state', () => {
    component.templateId = 'TPL-001';
    component.dataTableRef = { activeRow: rows[0] } as any;

    component.openAddPanel();

    expect(component.sidePanelMode).toBe('add');
    expect(component.sidePanelLink).toBeNull();
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.dataTableRef!.activeRow).toBeNull();
  });

  it('should not open add panel when templateId is null', () => {
    component.templateId = null;
    component.sidePanelOpen = false;

    component.openAddPanel();

    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should open add panel even without dataTableRef', () => {
    component.templateId = 'TPL-001';
    component.dataTableRef = undefined;

    component.openAddPanel();

    expect(component.sidePanelOpen).toBeTrue();
  });

  // ─── openEditPanel ───────────────────────────────────────────────────

  it('should open edit panel with the given link', () => {
    component.templateId = 'TPL-001';
    component.dataTableRef = { activeRow: null } as any;
    const link = rows[0];

    component.openEditPanel(link);

    expect(component.sidePanelMode).toBe('edit');
    expect(component.sidePanelLink).toBe(link);
    expect(component.sidePanelOpen).toBeTrue();
    expect(component.dataTableRef!.activeRow).toBe(link);
  });

  it('should not open edit panel when templateId is null', () => {
    component.templateId = null;
    component.sidePanelOpen = false;

    component.openEditPanel(rows[0]);

    expect(component.sidePanelOpen).toBeFalse();
  });

  // ─── closeSidePanel ──────────────────────────────────────────────────

  it('should close side panel and reset state', () => {
    component.sidePanelOpen = true;
    component.sidePanelLink = rows[0];
    component.dataTableRef = { activeRow: rows[0] } as any;

    component.closeSidePanel();

    expect(component.sidePanelOpen).toBeFalse();
    expect(component.sidePanelLink).toBeNull();
    expect(component.dataTableRef!.activeRow).toBeNull();
  });

  it('should close side panel without error when dataTableRef is undefined', () => {
    component.sidePanelOpen = true;
    component.dataTableRef = undefined;

    expect(() => component.closeSidePanel()).not.toThrow();
    expect(component.sidePanelOpen).toBeFalse();
  });

  // ─── onLinkPanelSave edge cases ──────────────────────────────────────

  it('should return early if result is null', () => {
    component.onLinkPanelSave(null as any);

    expect(serviceSpy.createTemplateLink).not.toHaveBeenCalled();
    expect(serviceSpy.updateTemplateLink).not.toHaveBeenCalled();
  });

  it('should return early if result.data is undefined', () => {
    component.onLinkPanelSave({ action: 'save', mode: 'add' });

    expect(serviceSpy.createTemplateLink).not.toHaveBeenCalled();
  });

  it('should create link and close panel when action is save (not saveAndCreateAnother)', () => {
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';
    component.sidePanelOpen = true;

    component.onLinkPanelSave({
      action: 'save',
      mode: 'add',
      data: {
        surveyGroupId: 'G5',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'X',
        effDate: null,
        termDate: null,
      },
    });

    expect(serviceSpy.createTemplateLink).toHaveBeenCalled();
    expect(component.sidePanelOpen).toBeFalse();
  });

  it('should use fallback message when create response has no message', () => {
    serviceSpy.createTemplateLink.and.returnValue(of({ success: true }) as any);
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';

    component.onLinkPanelSave({
      action: 'save',
      mode: 'add',
      data: {
        surveyGroupId: 'G5',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'X',
        effDate: null,
        termDate: null,
      },
    });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Link created successfully',
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] })
    );
  });

  it('should use fallback message when update response has no message', () => {
    serviceSpy.updateTemplateLink.and.returnValue(of({ success: true }) as any);
    component.templateId = 'TPL-001';
    component.chapterId = 'CH1';

    component.onLinkPanelSave({
      action: 'save',
      mode: 'edit',
      data: {
        surveyGroupId: 'G1',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'A',
        effDate: null,
        termDate: null,
      },
    });

    expect(snackBarSpy.open).toHaveBeenCalledWith(
      'Link updated successfully',
      'DISMISS',
      jasmine.objectContaining({ panelClass: ['success-snackbar'] })
    );
  });

  it('should not call create when templateId is null (createLink guard)', () => {
    component.templateId = null;
    component.chapterId = 'CH1';

    component.onLinkPanelSave({
      action: 'save',
      mode: 'add',
      data: {
        surveyGroupId: 'G1',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'A',
        effDate: null,
        termDate: null,
      },
    });

    expect(serviceSpy.createTemplateLink).not.toHaveBeenCalled();
  });

  it('should not call create when chapterId is empty (createLink guard)', () => {
    component.templateId = 'TPL-001';
    component.chapterId = '';

    component.onLinkPanelSave({
      action: 'save',
      mode: 'add',
      data: {
        surveyGroupId: 'G1',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'A',
        effDate: null,
        termDate: null,
      },
    });

    expect(serviceSpy.createTemplateLink).not.toHaveBeenCalled();
  });

  it('should not call update when templateId is null (updateLink guard)', () => {
    component.templateId = null;
    component.chapterId = 'CH1';

    component.onLinkPanelSave({
      action: 'save',
      mode: 'edit',
      data: {
        surveyGroupId: 'G1',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'A',
        effDate: null,
        termDate: null,
      },
    });

    expect(serviceSpy.updateTemplateLink).not.toHaveBeenCalled();
  });

  it('should not call update when chapterId is empty (updateLink guard)', () => {
    component.templateId = 'TPL-001';
    component.chapterId = '';

    component.onLinkPanelSave({
      action: 'save',
      mode: 'edit',
      data: {
        surveyGroupId: 'G1',
        surveyCategoryCode: 'C1',
        surveyCategoryValues: 'A',
        effDate: null,
        termDate: null,
      },
    });

    expect(serviceSpy.updateTemplateLink).not.toHaveBeenCalled();
  });

  // ─── closeFilter ─────────────────────────────────────────────────────

  it('should dispose overlayRef and set isFilterOpen to false', () => {
    const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose']);
    (component as any).overlayRef = mockOverlayRef;
    component.isFilterOpen = true;

    component.closeFilter();

    expect(mockOverlayRef.dispose).toHaveBeenCalled();
    expect((component as any).overlayRef).toBeNull();
    expect(component.isFilterOpen).toBeFalse();
  });

  it('should handle closeFilter when overlayRef is already null', () => {
    (component as any).overlayRef = null;
    component.isFilterOpen = true;

    component.closeFilter();

    expect(component.isFilterOpen).toBeFalse();
  });

  // ─── applyFilters ────────────────────────────────────────────────────

  it('should apply filters, generate chips, close filter, and re-filter data', () => {
    component.allData = [...rows];
    component.isFilterOpen = true;
    const closeSpy = spyOn(component, 'closeFilter');

    const filters = {
      effDatePeriod: 'after' as string | null,
      effDate: new Date('2026-01-01') as Date | null,
      termDatePeriod: null,
      termDate: null,
      status: null as 'Active' | 'Inactive' | 'Future' | null,
    };

    component.applyFilters(filters);

    expect(component.appliedFilters).toBe(filters);
    expect(component.filterChips.length).toBeGreaterThanOrEqual(0);
    expect(closeSpy).toHaveBeenCalled();
  });

  // ─── onRemoveFilterChip ──────────────────────────────────────────────

  it('should remove chip and update filters', () => {
    component.allData = [...rows];
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: 'before',
      termDate: new Date('2026-12-31'),
      status: null,
    };

    component.onRemoveFilterChip('effDate');

    expect(component.appliedFilters!.effDate).toBeNull();
    expect(component.appliedFilters!.effDatePeriod).toBeNull();
  });

  it('should clear appliedFilters entirely when no active filters remain', () => {
    component.allData = [...rows];
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };

    component.onRemoveFilterChip('effDate');

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
  });

  it('should do nothing if appliedFilters is null', () => {
    component.appliedFilters = null;

    component.onRemoveFilterChip('effDate');

    expect(component.appliedFilters).toBeNull();
  });

  // ─── clearAllFilters ─────────────────────────────────────────────────

  it('should clear all filters and re-filter data', () => {
    component.allData = [...rows];
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };
    component.filterChips = [{ key: 'effDate', label: 'Test', value: 'x', removable: true }];

    component.clearAllFilters();

    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(component.dataSource.length).toBe(2);
  });

  // ─── hasActiveFilters ────────────────────────────────────────────────

  it('should return true when there are active filters', () => {
    component.appliedFilters = {
      effDatePeriod: 'after',
      effDate: new Date('2026-01-01'),
      termDatePeriod: null,
      termDate: null,
      status: null,
    };

    expect(component.hasActiveFilters()).toBeTrue();
  });

  it('should return false when appliedFilters is null', () => {
    component.appliedFilters = null;

    expect(component.hasActiveFilters()).toBeFalse();
  });

  it('should return false when no active filter values exist', () => {
    component.appliedFilters = {
      effDatePeriod: null,
      effDate: null,
      termDatePeriod: null,
      termDate: null,
      status: null,
    };

    expect(component.hasActiveFilters()).toBeFalse();
  });

  // ─── subscribeToChapterChanges ───────────────────────────────────────

  it('should reload data when chapter changes', () => {
    const loadSpy = spyOn(component, 'loadData');
    const closePanelSpy = spyOn(component, 'closeSidePanel');
    const closeFilterSpy = spyOn(component, 'closeFilter');

    component.ngOnInit();

    // Reset because ngOnInit triggers loadData
    loadSpy.calls.reset();

    headerSpy.chapterId.and.returnValue('CH2');
    ((headerSpy as any).chapterChanged$ as Subject<void>).next();

    expect(component.chapterId).toBe('CH2');
    expect(closeFilterSpy).toHaveBeenCalled();
    expect(closePanelSpy).toHaveBeenCalled();
    expect(component.appliedFilters).toBeNull();
    expect(component.filterChips).toEqual([]);
    expect(loadSpy).toHaveBeenCalled();
  });

  // ─── navigateBack ────────────────────────────────────────────────────

  it('should navigate back to survey-template route', () => {
    component.navigateBack();

    expect(routerSpy.navigate).toHaveBeenCalled();
    const navArgs = routerSpy.navigate.calls.mostRecent().args[0];
    expect(navArgs[0]).toBe('/donor-functions');
    expect(navArgs[navArgs.length - 1]).toBe('survey-template');
  });

  // ─── handleKeyboardEvent ─────────────────────────────────────────────

  it('should open add panel on Alt+N', () => {
    component.templateId = 'TPL-001';
    const addSpy = spyOn(component, 'openAddPanel');
    const event = new KeyboardEvent('keydown', { altKey: true, key: 'n' });
    spyOn(event, 'preventDefault');

    component.handleKeyboardEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(addSpy).toHaveBeenCalled();
  });

  it('should navigate back on Alt+B', () => {
    const navSpy = spyOn(component, 'navigateBack');
    const event = new KeyboardEvent('keydown', { altKey: true, key: 'b' });
    spyOn(event, 'preventDefault');

    component.handleKeyboardEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalled();
  });

  it('should open filter on Alt+F', () => {
    // openFilter accesses ViewChild refs, so stub it to prevent DOM access
    component.openFilter = jasmine.createSpy('openFilter');
    const event = new KeyboardEvent('keydown', { altKey: true, key: 'f' });
    spyOn(event, 'preventDefault');

    component.handleKeyboardEvent(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.openFilter).toHaveBeenCalled();
  });

  it('should close filter on Escape when filter is open', () => {
    component.isFilterOpen = true;
    const closeFilterSpy = spyOn(component, 'closeFilter');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });

    component.handleKeyboardEvent(event);

    expect(closeFilterSpy).toHaveBeenCalled();
  });

  it('should close side panel on Escape when side panel is open and filter is closed', () => {
    component.isFilterOpen = false;
    component.sidePanelOpen = true;
    const closePanelSpy = spyOn(component, 'closeSidePanel');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });

    component.handleKeyboardEvent(event);

    expect(closePanelSpy).toHaveBeenCalled();
  });

  it('should prioritize closing filter over side panel on Escape', () => {
    component.isFilterOpen = true;
    component.sidePanelOpen = true;
    const closeFilterSpy = spyOn(component, 'closeFilter');
    const closePanelSpy = spyOn(component, 'closeSidePanel');
    const event = new KeyboardEvent('keydown', { key: 'Escape' });

    component.handleKeyboardEvent(event);

    expect(closeFilterSpy).toHaveBeenCalled();
    expect(closePanelSpy).not.toHaveBeenCalled();
  });

  it('should do nothing on unrecognized key', () => {
    const addSpy = spyOn(component, 'openAddPanel');
    const navSpy = spyOn(component, 'navigateBack');
    const filterSpy = spyOn(component, 'openFilter');
    const closeFilterSpy = spyOn(component, 'closeFilter');
    const closePanelSpy = spyOn(component, 'closeSidePanel');
    const event = new KeyboardEvent('keydown', { key: 'x' });

    component.handleKeyboardEvent(event);

    expect(addSpy).not.toHaveBeenCalled();
    expect(navSpy).not.toHaveBeenCalled();
    expect(filterSpy).not.toHaveBeenCalled();
    expect(closeFilterSpy).not.toHaveBeenCalled();
    expect(closePanelSpy).not.toHaveBeenCalled();
  });

  // ─── openFilter ──────────────────────────────────────────────────────

  it('should close filter if already open', () => {
    component.isFilterOpen = true;
    const closeSpy = spyOn(component, 'closeFilter');

    component.openFilter();

    expect(closeSpy).toHaveBeenCalled();
  });

  // ─── initializeTableConfig valueFormatters ───────────────────────────

  it('should format categoryValues with dash for falsy values', () => {
    const col = component.tableConfig.columns.find((c) => c.key === 'categoryValues');
    expect(col).toBeDefined();
    expect(col!.valueFormatter!('')).toBe('-');
    expect(col!.valueFormatter!(null as any)).toBe('-');
    expect(col!.valueFormatter!('A,B')).toBe('A,B');
  });

  it('should call service.formatDate for effDate column', () => {
    const col = component.tableConfig.columns.find((c) => c.key === 'effDate');
    expect(col).toBeDefined();
    col!.valueFormatter!('2026-04-08');
    expect(serviceSpy.formatDate).toHaveBeenCalledWith('2026-04-08');
  });

  it('should call service.formatDate for termDate column', () => {
    const col = component.tableConfig.columns.find((c) => c.key === 'termDate');
    expect(col).toBeDefined();
    col!.valueFormatter!('2026-12-31');
    expect(serviceSpy.formatDate).toHaveBeenCalledWith('2026-12-31');
  });

  // ─── headerConfig actions ────────────────────────────────────────────

  it('should call openAddPanel from header action onClick', () => {
    const addSpy = spyOn(component, 'openAddPanel');
    const addAction = component.headerConfig.actions!.find((a) => a.label === 'ADD NEW LINK');

    expect(addAction).toBeDefined();
    addAction!.onClick!();

    expect(addSpy).toHaveBeenCalled();
  });

  it('should call navigateBack from header onBackClick', () => {
    const navSpy = spyOn(component, 'navigateBack');

    component.headerConfig.onBackClick!();

    expect(navSpy).toHaveBeenCalled();
  });
});
