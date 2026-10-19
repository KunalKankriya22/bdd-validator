import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { Overlay, OverlayModule } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { signal } from '@angular/core';

import { GroupSitesComponent } from './group-sites';
import { GroupSitesService } from './services/group-sites.service';
import { GroupSitesModel, GroupSitesFilterValue } from './models/group-sites.model';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { createMockTranslateService } from '@shared/testing/common-mocks';

describe('GroupSitesComponent', () => {
  let component: GroupSitesComponent;
  let fixture: ComponentFixture<GroupSitesComponent>;
  let mockGroupSitesService: jasmine.SpyObj<GroupSitesService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockActivatedRoute: any;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: any;

  const mockGroupSitesData: GroupSitesModel[] = [
    {
      chapterId: '001',
      groupSiteId: 'S1540',
      groupSiteInd: 'S',
      siteName: 'Test Site 1',
      osokFlag: 'Y',
      effectiveDate: new Date('2024-01-15'),
      terminationDate: null,
      lastModifiedDate: new Date('2024-12-01'),
      type: 'Site',
      code: 'S1540',
      name: 'Test Site 1',
      outOfState: true,
      status: 'Active'
    },
    {
      chapterId: '002',
      groupSiteId: 'G100',
      groupSiteInd: 'G',
      siteName: 'Test Group 1',
      osokFlag: 'N',
      effectiveDate: new Date('2024-02-01'),
      terminationDate: new Date('2024-12-31'),
      lastModifiedDate: new Date('2024-11-15'),
      type: 'Group',
      code: 'G100',
      name: 'Test Group 1',
      outOfState: false,
      status: 'Terminated'
    }
  ];

  const mockApiResponse = {
    data: mockGroupSitesData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockGroupSitesService = jasmine.createSpyObj('GroupSitesService', [
      'getGroupSites'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: new Subject()
    });

    mockTranslateService = createMockTranslateService();

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: signal({ title: 'Group/Sites', subtitle: '' })
    });

    mockHeaderService = {
      chapterChanged$: new Subject<void>().asObservable()
    };

    mockActivatedRoute = {
      snapshot: {
        params: {},
        queryParams: {},
        data: {}
      },
      params: of({}),
      queryParams: of({}),
      data: of({})
    };

    mockGroupSitesService.getGroupSites.and.returnValue(of(mockApiResponse));



      TestBed.configureTestingModule({
      imports: [GroupSitesComponent, NoopAnimationsModule, OverlayModule],
      providers: [
        provideHttpClient(),
        { provide: GroupSitesService, useValue: mockGroupSitesService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockGroupSitesService.getGroupSites.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockGroupSitesService.getGroupSites.and.returnValue(of(mockApiResponse));


    fixture = TestBed.createComponent(GroupSitesComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should initialize search configuration', () => {
      expect(component.searchConfig).toBeDefined();
      expect(component.searchConfig.placeholder).toBe('Search by code or name');
      expect(component.searchConfig.minLength).toBe(3);
    });





    it('should set current year', () => {
      const currentYear = new Date().getFullYear();
      expect(component.currentYear).toBe(currentYear);
    });
  });

  describe('Table Configuration', () => {




    it('should configure pagination correctly', () => {
      const pagination = component.tableConfig.pagination;
      expect(pagination?.pageSize).toBe(25);
      expect(pagination?.pageIndex).toBe(0);
      expect(pagination?.pageSizeOptions).toEqual([10, 25, 50, 100]);
      expect(pagination?.showFirstLastButtons).toBeTrue();
    });

    it('should enable sticky header', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
    });

    it('should enable sticky actions column', () => {
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
    });


  });

  describe('Data Loading', () => {
    it('should load data with correct pagination parameters', () => {
      component.tableConfig.pagination!.pageIndex = 0;
      component.tableConfig.pagination!.pageSize = 10;

      component.loadData();

      expect(mockGroupSitesService.getGroupSites).toHaveBeenCalledWith(
        10,
        0,
        jasmine.any(Object)
      );
    });


    it('should clear loading state after data is loaded', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.isLoading).toBeFalse();
        done();
      }, 100);
    });

    it('should update dataSource with transformed data', () => {
      fixture.detectChanges();

      expect(component.dataSource.length).toBe(2);
      expect(component.dataSource[0].type).toBe('Site');
      expect(component.dataSource[0].code).toBe('S1540');
      expect(component.dataSource[1].type).toBe('Group');
    });



    it('should handle error during data loading', () => {
      mockGroupSitesService.getGroupSites.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      spyOn(console, 'error');

      component.loadData();

      expect(component.hasError).toBeTrue();
      expect(component.isLoading).toBeFalse();
      expect(component.errorMessage).toBe('Failed to load group/sites data. Please try again.');
    });

    it('should transform API data to UI model correctly', () => {
      fixture.detectChanges();

      const firstItem = component.dataSource[0];
      expect(firstItem.type).toBe('Site');
      expect(firstItem.code).toBe('S1540');
      expect(firstItem.name).toBe('Test Site 1');
      expect(firstItem.outOfState).toBe(true);
      expect(firstItem.status).toBe('Active');
    });
  });



  describe('Pagination', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });





    it('should calculate correct skip value for pagination', () => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;

      component.loadData();

      expect(mockGroupSitesService.getGroupSites).toHaveBeenCalledWith(
        10,
        20,
        jasmine.any(Object)
      );
    });
  });

  describe('Sorting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should update requestState with sort parameters', () => {
      const sortEvent = { column: 'code', direction: 'A' as const };

      component.onSortChange(sortEvent);

      expect(component.requestState.Sort).toBe('A');
    });








  });

  describe('Row Actions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should call editRecord for edit action', () => {
      const editRecordSpy = spyOn(component, 'editRecord');
      const rowActionEvent = {
        action: 'edit',
        row: mockGroupSitesData[0]
      };

      component.onRowAction(rowActionEvent);

      expect(editRecordSpy).toHaveBeenCalledWith(mockGroupSitesData[0]);
    });
  });

  describe('Side Panel Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should open side panel for creating new record', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should open side panel for editing record', () => {
      component.editRecord(mockGroupSitesData[0]);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockGroupSitesData[0]);
      expect(component.sidePanelOpen).toBeTrue();
    });





    it('should handle mode change', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockGroupSitesData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should not clear data when switching to edit mode', () => {
      component.sidePanelMode = 'add';
      component.sidePanelData = mockGroupSitesData[0];

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toEqual(mockGroupSitesData[0]);
    });
  });

  describe('Filter Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should apply filters', () => {
      const filters: GroupSitesFilterValue = {
        chapterId: '001'
      };

      component.applyFilters(filters);

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.chapterIds).toBe('001');
    });











    it('should detect active filters', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBeFalse();

      component.appliedFilters = { chapterId: '001' };
      expect(component.hasActiveFilters()).toBeTrue();
    });
  });

  describe('Data Transformation', () => {
    it('should map groupSiteInd "G" to type "Group"', () => {
      fixture.detectChanges();

      const groupRecord = component.dataSource.find(item => item.groupSiteInd === 'G');
      expect(groupRecord?.type).toBe('Group');
    });

    it('should map groupSiteInd "S" to type "Site"', () => {
      fixture.detectChanges();

      const siteRecord = component.dataSource.find(item => item.groupSiteInd === 'S');
      expect(siteRecord?.type).toBe('Site');
    });

    it('should map osokFlag "Y" to outOfState true', () => {
      fixture.detectChanges();

      const recordWithY = component.dataSource.find(item => item.osokFlag === 'Y');
      expect(recordWithY?.outOfState).toBe(true);
    });

    it('should map osokFlag "N" to outOfState false', () => {
      fixture.detectChanges();

      const recordWithN = component.dataSource.find(item => item.osokFlag === 'N');
      expect(recordWithN?.outOfState).toBe(false);
    });

    it('should calculate status as Active for current records', () => {
      fixture.detectChanges();

      const activeRecord = component.dataSource[0];
      expect(activeRecord.status).toBe('Active');
    });

    it('should calculate status as Terminated for terminated records', () => {
      fixture.detectChanges();

      const terminatedRecord = component.dataSource[1];
      expect(terminatedRecord.status).toBe('Terminated');
    });
  });





  describe('Cleanup', () => {




    it('should not throw error if overlay does not exist on destroy', () => {
      component['overlayRef'] = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Header Configuration', () => {


    it('should have add new record action', () => {
      const actions = component.headerConfig.actions;
      expect(actions).toBeDefined();
      expect(actions!.length).toBeGreaterThan(0);
      expect(actions![0].label).toBe('ADD NEW RECORD');
    });

    it('should call createRecord when header action is clicked', () => {
      const createRecordSpy = spyOn(component, 'createRecord');
      const actions = component.headerConfig.actions;
      expect(actions).toBeDefined();
      const action = actions![0];

      action.onClick();

      expect(createRecordSpy).toHaveBeenCalled();
    });
  });

  describe('Row Highlighting', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set sidePanelData when editing a record', () => {
      const recordToEdit = mockGroupSitesData[0];

      component.editRecord(recordToEdit);

      expect(component.sidePanelData).toEqual(recordToEdit);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should highlight the edited row by passing sidePanelData to DataTable', () => {
      const recordToEdit = mockGroupSitesData[0];

      component.editRecord(recordToEdit);
      // Don't call detectChanges to avoid rendering side panel component

      // sidePanelData should contain the record being edited
      // This is bound to [highlightedRow] in the template
      expect(component.sidePanelData).toBe(recordToEdit);
    });

    it('should not highlight any row when adding a new record', () => {
      component.createRecord();
      // Don't call detectChanges to avoid rendering side panel component

      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should clear row highlight when side panel is closed', () => {
      // First, edit a record to set sidePanelData
      component.editRecord(mockGroupSitesData[0]);
      expect(component.sidePanelData).not.toBeNull();

      // Close the panel
      component.closeSidePanel();

      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBeFalse();
    });

    it('should switch highlight when editing a different record', () => {
      const firstRecord = mockGroupSitesData[0];
      const secondRecord = mockGroupSitesData[1];

      // Edit first record
      component.editRecord(firstRecord);
      expect(component.sidePanelData).toBe(firstRecord);

      // Edit second record without closing panel
      component.editRecord(secondRecord);
      expect(component.sidePanelData).toBe(secondRecord);
      expect(component.sidePanelData).not.toBe(firstRecord);
    });

    it('should maintain highlight during save operation', () => {
      const recordToEdit = mockGroupSitesData[0];

      component.editRecord(recordToEdit);
      expect(component.sidePanelData).toBe(recordToEdit);

      // Simulate save success (which reloads data)
      component.onSaveSuccess();

      // sidePanelData should still contain the record
      // Highlight persists until panel is closed
      expect(component.sidePanelData).toBe(recordToEdit);
    });



    it('should set sidePanelData through row action event', () => {
      const rowActionEvent = {
        action: 'edit',
        row: mockGroupSitesData[1]
      };

      component.onRowAction(rowActionEvent);

      expect(component.sidePanelData).toEqual(mockGroupSitesData[1]);
      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelOpen).toBeTrue();
    });

    it('should clear sidePanelData when switching from edit to add mode', () => {
      // Start with edit mode
      component.editRecord(mockGroupSitesData[0]);
      expect(component.sidePanelData).not.toBeNull();

      // Switch to add mode
      component.onModeChange('add');

      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelMode).toBe('add');
    });

    it('should preserve sidePanelData when staying in edit mode', () => {
      const recordToEdit = mockGroupSitesData[0];
      component.sidePanelData = recordToEdit;
      component.sidePanelMode = 'add';

      // Switch to edit mode (sidePanelData already set)
      component.onModeChange('edit');

      expect(component.sidePanelData).toBe(recordToEdit);
      expect(component.sidePanelMode).toBe('edit');
    });
  });
});
