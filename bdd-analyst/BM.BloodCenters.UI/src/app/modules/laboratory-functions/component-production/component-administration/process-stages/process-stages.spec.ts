import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError, Subject } from 'rxjs';

import { ProcessStagesComponent, getProcessStagesPaginatorIntl } from './process-stages';
import { ProcessStagesService } from './services/process-stages.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { ProcessStageDto } from './models/process-stages.model';
import { createMockHeaderService } from '@shared/testing/common-mocks';

describe('ProcessStagesComponent', () => {
  let pageHeaderService: any;
  let processStagesService: any;
  let component: ProcessStagesComponent;
  let fixture: ComponentFixture<ProcessStagesComponent>;
  let processStagesServiceSpy: jasmine.SpyObj<ProcessStagesService>;
  let pageHeaderServiceSpy: jasmine.SpyObj<PageHeaderService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;

  const mockProcessStages: ProcessStageDto[] = [
    {
      processCode: 'PROC1',
      stageCode: 'ST1',
      stageSequence: 1,
      effDate: '15-Jan-2024',
      termDate: null,
      insertDate: '01-Jan-2024',
      insertUser: 'ADMIN',
      auditKey: 123456,
    },
    {
      processCode: 'PROC1',
      stageCode: 'ST2',
      stageSequence: 2,
      effDate: '15-Jan-2024',
      termDate: null,
      insertDate: '01-Jan-2024',
      insertUser: 'ADMIN',
      auditKey: 123457,
    },
  ];

  beforeEach(() => {

    processStagesService = jasmine.createSpyObj('ProcessStagesService', [
      'getProcessStages',
    ]);
    pageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue({
        title: 'SP\' Processes and Stages',
      }),
    });
    pageHeaderService.getSubtitle.and.returnValue(undefined);
    const headerService = createMockHeaderService();



      TestBed.configureTestingModule({
      imports: [ProcessStagesComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ProcessStagesService, useValue: processStagesService },
        { provide: PageHeaderService, useValue: pageHeaderService },
        { provide: HeaderService, useValue: headerService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } },
      ],
    });




      processStagesService.getProcessStages.calls.reset();


      pageHeaderService.getSubtitle.calls.reset();


      pageHeaderService.getSubtitle.and.returnValue(undefined);


    processStagesServiceSpy = TestBed.inject(ProcessStagesService) as jasmine.SpyObj<ProcessStagesService>;
    pageHeaderServiceSpy = TestBed.inject(PageHeaderService) as jasmine.SpyObj<PageHeaderService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;

    processStagesServiceSpy.getProcessStages.and.returnValue(
      of({ data: mockProcessStages, totalRecords: 2 })
    );

    fixture = TestBed.createComponent(ProcessStagesComponent);
    component = fixture.componentInstance;


    });

  describe('Component Creation', () => {
    it('should create the component', () => {
      fixture.detectChanges();
      expect(component).toBeTruthy();
    });

    it('should have default state values', () => {
      expect(component.isLoading).toBeFalse();
      expect(component.hasError).toBeFalse();
      expect(component.errorMessage).toBe('');
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.dataSource).toEqual([]);
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should populate data source on successful load', () => {
      expect(component.dataSource).toEqual(mockProcessStages);
      expect(component.tableConfig.pagination?.totalRecords).toBe(2);
    });

    it('should handle error on data load', () => {
      processStagesServiceSpy.getProcessStages.and.returnValue(
        throwError(() => new Error('Load failed'))
      );

      component.loadData();

      expect(component.hasError).toBeTrue();
      expect(component.errorMessage).toBe('Failed to load process stages. Please try again.');
    });

    it('should set isLoading to false after successful load', () => {
      processStagesServiceSpy.getProcessStages.and.returnValue(
        of({ data: [], totalRecords: 0 })
      );
      component.loadData();
      expect(component.isLoading).toBeFalse();
    });

    it('should set isLoading to false after error', () => {
      processStagesServiceSpy.getProcessStages.and.returnValue(
        throwError(() => new Error('error'))
      );
      component.loadData();
      expect(component.isLoading).toBeFalse();
    });

    it('should reset hasError to false before loading', () => {
      component.hasError = true;
      processStagesServiceSpy.getProcessStages.and.returnValue(
        of({ data: mockProcessStages, totalRecords: 2 })
      );
      component.loadData();
      expect(component.hasError).toBeFalse();
    });

    it('should update totalRecords in pagination on success', () => {
      processStagesServiceSpy.getProcessStages.and.returnValue(
        of({ data: [mockProcessStages[0]], totalRecords: 1 })
      );
      component.loadData();
      expect(component.tableConfig.pagination?.totalRecords).toBe(1);
    });

    it('should pass requestState to service', () => {
      component.requestState = { searchKeyword: 'test', sortColumn: 'processCode', sortOrder: 'asc' };
      processStagesServiceSpy.getProcessStages.calls.reset();
      component.loadData();
      expect(processStagesServiceSpy.getProcessStages).toHaveBeenCalledWith(component.requestState);
    });

    it('should handle load when pagination is undefined', () => {
      component.tableConfig.pagination = undefined as any;
      processStagesServiceSpy.getProcessStages.and.returnValue(
        of({ data: mockProcessStages, totalRecords: 2 })
      );
      component.loadData();
      expect(component.dataSource).toEqual(mockProcessStages);
      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update request state on search', () => {
      component.onSearch('test');
      expect(component.requestState.searchKeyword).toBe('test');
    });

    it('should set searchKeyword to null for empty search', () => {
      component.onSearch('');
      expect(component.requestState.searchKeyword).toBeNull();
    });

    it('should reset pageIndex to 0 on search', () => {
      if (component.tableConfig.pagination) {
        component.tableConfig.pagination.pageIndex = 5;
      }
      component.onSearch('test');
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });

    it('should call loadData on search', () => {
      spyOn(component, 'loadData');
      component.onSearch('test');
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should handle search when pagination is undefined', () => {
      component.tableConfig.pagination = undefined as any;
      spyOn(component, 'loadData');
      component.onSearch('test');
      expect(component.requestState.searchKeyword).toBe('test');
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update pageIndex on page change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 25 } as any);
      expect(component.tableConfig.pagination?.pageIndex).toBe(2);
    });

    it('should update pageSize on page change', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 50 } as any);
      expect(component.tableConfig.pagination?.pageSize).toBe(50);
    });

    it('should call loadData on page change', () => {
      spyOn(component, 'loadData');
      component.onPageChange({ pageIndex: 1, pageSize: 25 } as any);
      expect(component.loadData).toHaveBeenCalled();
    });

    it('should handle page change when pagination is undefined', () => {
      component.tableConfig.pagination = undefined as any;
      spyOn(component, 'loadData');
      component.onPageChange({ pageIndex: 1, pageSize: 25 } as any);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update sort config column on sort change', () => {
      component.onSortChange({ column: 'stageCode', direction: 'asc' } as any);
      expect(component.tableConfig.sortConfig?.column).toBe('stageCode');
    });

    it('should update sort config direction on sort change', () => {
      component.onSortChange({ column: 'stageCode', direction: 'desc' } as any);
      expect(component.tableConfig.sortConfig?.direction).toBe('desc');
    });

    it('should set sortOrder to null for default direction', () => {
      component.onSortChange({ column: 'processCode', direction: 'default' } as any);
      expect(component.requestState.sortOrder).toBeNull();
    });

    it('should set sortOrder to direction value for non-default direction', () => {
      component.onSortChange({ column: 'processCode', direction: 'desc' } as any);
      expect(component.requestState.sortOrder).toBe('desc');
    });

    it('should update requestState sortColumn on sort change', () => {
      component.onSortChange({ column: 'stageCode', direction: 'asc' } as any);
      expect(component.requestState.sortColumn).toBe('stageCode');
    });

    it('should call loadData on sort change', () => {
      spyOn(component, 'loadData');
      component.onSortChange({ column: 'processCode', direction: 'asc' } as any);
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call editRecord when action is edit', () => {
      spyOn(component, 'editRecord');
      const row = mockProcessStages[0];
      component.onRowAction({ action: 'edit', row } as any);
      expect(component.editRecord).toHaveBeenCalledWith(row);
    });

    it('should not call editRecord for non-edit actions', () => {
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'delete', row: mockProcessStages[0] } as any);
      expect(component.editRecord).not.toHaveBeenCalled();
    });

    it('should set activeRow on dataTableComponent when it exists', () => {
      const row = mockProcessStages[0];
      component.dataTableComponent = { activeRow: null } as any;
      component.onRowAction({ action: 'edit', row } as any);
      expect(component.dataTableComponent.activeRow).toBe(row);
    });

    it('should not throw when dataTableComponent is undefined', () => {
      component.dataTableComponent = undefined as any;
      expect(() => {
        component.onRowAction({ action: 'edit', row: mockProcessStages[0] } as any);
      }).not.toThrow();
    });
  });

  describe('Side Panel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open side panel in add mode on createRecord', () => {
      component.createRecord();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should open side panel in edit mode on editRecord', () => {
      const record = mockProcessStages[0];
      component.editRecord(record);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(record);
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should close side panel and clear data on closeSidePanel', () => {
      component.sidePanelOpen = true;
      component.sidePanelData = mockProcessStages[0];
      component.closeSidePanel();
      expect(component.sidePanelOpen).toBeFalse();
      expect(component.sidePanelData).toBeNull();
    });

    it('should update mode on mode change', () => {
      component.sidePanelMode = 'edit';
      component.onModeChange('add');
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should not clear sidePanelData when mode changes to edit', () => {
      component.sidePanelData = mockProcessStages[0];
      component.onModeChange('edit');
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockProcessStages[0]);
    });

    it('should clear sidePanelData when mode changes to add', () => {
      component.sidePanelData = mockProcessStages[0];
      component.onModeChange('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call createRecord on Alt+C', () => {
      spyOn(component, 'createRecord');
      const event = { altKey: true, key: 'c', preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should call createRecord on Alt+C (uppercase)', () => {
      spyOn(component, 'createRecord');
      const event = { altKey: true, key: 'C', preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.createRecord).toHaveBeenCalled();
    });

    it('should close side panel on Escape when panel is open', () => {
      component.sidePanelOpen = true;
      spyOn(component, 'closeSidePanel');
      const event = { altKey: false, key: 'Escape', preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.handleKeyboardShortcut(event);
      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.closeSidePanel).toHaveBeenCalled();
    });

    it('should not close side panel on Escape when panel is closed', () => {
      component.sidePanelOpen = false;
      spyOn(component, 'closeSidePanel');
      const event = { altKey: false, key: 'Escape', preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.handleKeyboardShortcut(event);
      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });

    it('should not respond to other keys', () => {
      spyOn(component, 'createRecord');
      spyOn(component, 'closeSidePanel');
      const event = { altKey: false, key: 'a', preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.handleKeyboardShortcut(event);
      expect(component.createRecord).not.toHaveBeenCalled();
      expect(component.closeSidePanel).not.toHaveBeenCalled();
    });

    it('should not create record when Alt is not pressed', () => {
      spyOn(component, 'createRecord');
      const event = { altKey: false, key: 'c', preventDefault: jasmine.createSpy() } as unknown as KeyboardEvent;
      component.handleKeyboardShortcut(event);
      expect(component.createRecord).not.toHaveBeenCalled();
    });
  });

  describe('Save Success', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call loadData on save success', () => {
      spyOn(component, 'loadData');
      component.onSaveSuccess();
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Table Columns', () => {
    it('should have 5 columns configured', () => {
      fixture.detectChanges();
      expect(component.tableConfig.columns.length).toBe(5);
    });

    it('should have processCode column', () => {
      fixture.detectChanges();
      const col = component.tableConfig.columns.find((c) => c.key === 'processCode');
      expect(col).toBeTruthy();
      expect(col?.header).toBe('Process Code');
    });

    it('should have stageCode column', () => {
      fixture.detectChanges();
      const col = component.tableConfig.columns.find((c) => c.key === 'stageCode');
      expect(col).toBeTruthy();
      expect(col?.header).toBe('Stage Code');
    });

    it('should format stageSequence with a valid value', () => {
      fixture.detectChanges();
      const seqColumn = component.tableConfig.columns.find((col) => col.key === 'stageSequence');
      expect(seqColumn?.valueFormatter?.(3, {} as ProcessStageDto)).toBe('3');
    });

    it('should format stageSequence as -- for null value', () => {
      fixture.detectChanges();
      const seqColumn = component.tableConfig.columns.find((col) => col.key === 'stageSequence');
      expect(seqColumn?.valueFormatter?.(null, {} as ProcessStageDto)).toBe('--');
    });

    it('should format stageSequence as value for 0', () => {
      fixture.detectChanges();
      const seqColumn = component.tableConfig.columns.find((col) => col.key === 'stageSequence');
      expect(seqColumn?.valueFormatter?.(0, {} as ProcessStageDto)).toBe('0');
    });

    it('should format effective date using formatTableDate', () => {
      fixture.detectChanges();
      const effColumn = component.tableConfig.columns.find((col) => col.key === 'effDate');
      const result = effColumn?.valueFormatter?.('2024-01-15', {} as ProcessStageDto);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('should format termination date correctly', () => {
      const termColumn = component.tableConfig.columns.find((col) => col.key === 'termDate');
      expect(termColumn?.valueFormatter?.(null, {} as ProcessStageDto)).toBe('--');
    });

    it('should format termDate with a valid value', () => {
      fixture.detectChanges();
      const termColumn = component.tableConfig.columns.find((col) => col.key === 'termDate');
      const result = termColumn?.valueFormatter?.('15-Jan-2024', {} as ProcessStageDto);
      expect(result).toBeDefined();
      expect(result).not.toBe('--');
    });
  });

  describe('Table Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have one row action configured', () => {
      expect(component.tableConfig.rowActions?.length).toBe(1);
    });

    it('should have edit action', () => {
      expect(component.tableConfig.rowActions?.[0].action).toBe('edit');
    });

    it('should have edit icon', () => {
      expect(component.tableConfig.rowActions?.[0].icon).toBe('edit');
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup on destroy', () => {
      fixture.detectChanges();
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should call loadData on init', () => {
      spyOn(component, 'loadData');
      component.ngOnInit();
      expect(component.loadData).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display error message on load failure', () => {
      component.hasError = true;
      component.errorMessage = 'Test error';
      fixture.detectChanges();

      expect(component.errorMessage).toBe('Test error');
    });

    it('should clear error on successful retry', () => {
      component.hasError = true;
      processStagesServiceSpy.getProcessStages.and.returnValue(
        of({ data: mockProcessStages, totalRecords: 2 })
      );

      component.loadData();

      expect(component.hasError).toBeFalse();
    });

    it('should set error message on load failure', () => {
      processStagesServiceSpy.getProcessStages.and.returnValue(
        throwError(() => new Error('Server error'))
      );
      component.loadData();
      expect(component.errorMessage).toBe('Failed to load process stages. Please try again.');
      expect(component.hasError).toBeTrue();
    });
  });

  describe('Configuration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should initialize headerConfig with ADD NEW action', () => {
      expect(component.headerConfig.actions?.length).toBeGreaterThanOrEqual(1);
      const addAction = component.headerConfig.actions?.find((a: any) => a.label === 'ADD NEW');
      expect(addAction).toBeTruthy();
    });

    it('should initialize headerConfig breadcrumbs with Home', () => {
      expect(component.headerConfig.breadcrumbs.length).toBeGreaterThanOrEqual(1);
      expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
      expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
    });

    it('should have default search config', () => {
      expect(component.searchConfig.placeholder).toBe('Search');
      expect(component.searchConfig.minLength).toBe(2);
      expect(component.searchConfig.ariaLabel).toBe('Search process stages');
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
      expect(component.searchConfig.alwaysShowTooltip).toBeTrue();
    });

    it('should have default table config settings', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
      expect(component.tableConfig.showPagination).toBeTrue();
      expect(component.tableConfig.emptyMessage).toBe('No process stages available to display');
      expect(component.tableConfig.loadingMessage).toBe('Loading process stages...');
    });

    it('should have default pagination settings', () => {
      expect(component.tableConfig.pagination?.pageSize).toBe(25);
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
      expect(component.tableConfig.pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(component.tableConfig.pagination?.showFirstLastButtons).toBeTrue();
    });

    it('should have default sort config', () => {
      expect(component.tableConfig.sortConfig?.column).toBe('processCode');
      expect(component.tableConfig.sortConfig?.direction).toBe('default');
    });

    it('should invoke createRecord when header ADD NEW action is clicked', () => {
      spyOn(component, 'createRecord');
      const addAction = component.headerConfig.actions?.find((a: any) => a.label === 'ADD NEW');
      addAction?.onClick?.();
      expect(component.createRecord).toHaveBeenCalled();
    });
  });

  describe('getProcessStagesPaginatorIntl', () => {
    it('should return a MatPaginatorIntl with custom itemsPerPageLabel', () => {
      const result = getProcessStagesPaginatorIntl();
      expect(result.itemsPerPageLabel).toBe('Rows per page:');
    });

    it('should return a MatPaginatorIntl instance', () => {
      const result = getProcessStagesPaginatorIntl();
      expect(result).toBeTruthy();
    });
  });
});

describe('ProcessStagesComponent - Chapter Changes', () => {
  let component: ProcessStagesComponent;
  let fixture: ComponentFixture<ProcessStagesComponent>;
  let processStagesServiceSpy: jasmine.SpyObj<ProcessStagesService>;
  let chapterSubject: Subject<void>;

  const mockProcessStages: ProcessStageDto[] = [
    {
      processCode: 'PROC1',
      stageCode: 'ST1',
      stageSequence: 1,
      effDate: '15-Jan-2024',
      termDate: null,
      insertDate: '01-Jan-2024',
      insertUser: 'ADMIN',
      auditKey: 123456,
    },
  ];

  beforeEach(() => {
    chapterSubject = new Subject<void>();

    const processStagesService = jasmine.createSpyObj('ProcessStagesService', ['getProcessStages']);
    const pageHeaderService = jasmine.createSpyObj('PageHeaderService', ['getSubtitle'], {
      pageHeaderData: jasmine.createSpy().and.returnValue({
        title: 'Test Title',
      }),
    });
    pageHeaderService.getSubtitle.and.returnValue(undefined);
    const headerService = createMockHeaderService({
      chapterChanged$: chapterSubject.asObservable(),
    });

    TestBed.configureTestingModule({
      imports: [ProcessStagesComponent, NoopAnimationsModule, TranslateModule.forRoot()],
      providers: [
        { provide: ProcessStagesService, useValue: processStagesService },
        { provide: PageHeaderService, useValue: pageHeaderService },
        { provide: HeaderService, useValue: headerService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } },
      ],
    });

    processStagesServiceSpy = TestBed.inject(ProcessStagesService) as jasmine.SpyObj<ProcessStagesService>;
    processStagesServiceSpy.getProcessStages.and.returnValue(
      of({ data: mockProcessStages, totalRecords: 1 })
    );

    fixture = TestBed.createComponent(ProcessStagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should reload data when chapter changes', () => {
    processStagesServiceSpy.getProcessStages.calls.reset();
    chapterSubject.next();
    expect(processStagesServiceSpy.getProcessStages).toHaveBeenCalled();
  });

  it('should not reload after component is destroyed', () => {
    component.ngOnDestroy();
    processStagesServiceSpy.getProcessStages.calls.reset();
    chapterSubject.next();
    expect(processStagesServiceSpy.getProcessStages).not.toHaveBeenCalled();
  });
});
