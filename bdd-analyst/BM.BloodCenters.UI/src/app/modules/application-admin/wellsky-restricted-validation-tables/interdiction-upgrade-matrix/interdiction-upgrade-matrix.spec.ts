import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { InterdictionUpgradeMatrixComponent } from './interdiction-upgrade-matrix';
import { InterdictionUpgradeMatrixService } from './services/interdiction-upgrade-matrix.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import { InterdictionUpgradeMatrixModel, InterdictionUpgradeMatrixFilterValue } from './models/interdiction-upgrade-matrix.model';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockPageHeaderService } from '@shared/testing/common-mocks';

describe('InterdictionUpgradeMatrixComponent', () => {
  let component: InterdictionUpgradeMatrixComponent;
  let fixture: ComponentFixture<InterdictionUpgradeMatrixComponent>;
  let mockService: jasmine.SpyObj<InterdictionUpgradeMatrixService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;

  const mockData: InterdictionUpgradeMatrixModel[] = [
    {
      sourceInterdiction: 'SRC001',
      existingInterdiction: 'EXT001',
      actionInterdiction: 'ACT001',
      action: 'P',
      effectiveDate: new Date('2025-01-01'),
      terminationDate: null
    },
    {
      sourceInterdiction: 'SRC002',
      existingInterdiction: 'EXT002',
      actionInterdiction: 'ACT002',
      action: 'R',
      effectiveDate: new Date('2025-02-01'),
      terminationDate: new Date('2025-12-31')
    }
  ];

  const mockResponse = {
    data: mockData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('InterdictionUpgradeMatrixService', [
      'getInterdictionUpgradeMatrix',
      'getInterdictionUpgradeMatrixFilters',
      'getInterdictionCodes',
      'addInterdictionUpgrade',
      'updateInterdictionUpgrade'
    ]);
    mockService.getInterdictionUpgradeMatrix.and.returnValue(of(mockResponse));
    mockService.getInterdictionCodes.and.returnValue(of({ data: [] }));
    mockService.getInterdictionUpgradeMatrixFilters.and.returnValue(of({ data: [] }));

    mockPageHeaderService = createMockPageHeaderService();
    const pageHeaderDataSignal = signal({ title: 'Interdiction Upgrade Matrix', subtitle: '' });
    Object.defineProperty(mockPageHeaderService, 'pageHeaderData', {
      get: () => pageHeaderDataSignal
    });

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/application-administration/wellsky-restricted/interdiction-upgrade-matrix',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    const backdropClickSubject = new Subject<MouseEvent>();
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    const mockPositionStrategy = {
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; }),
      withViewportMargin: jasmine.createSpy('withViewportMargin').and.callFake(function(this: any) { return this; }),
      withFlexibleDimensions: jasmine.createSpy('withFlexibleDimensions').and.callFake(function(this: any) { return this; }),
      withGrowAfterOpen: jasmine.createSpy('withGrowAfterOpen').and.callFake(function(this: any) { return this; })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);
    mockOverlay.scrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);



      TestBed.configureTestingModule({
      imports: [
        InterdictionUpgradeMatrixComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: InterdictionUpgradeMatrixService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });
      mockService.getInterdictionUpgradeMatrix.and.returnValue(of(mockResponse));


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(InterdictionUpgradeMatrixComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {












    it('should set currentYear to current year', () => {
      expect(component.currentYear).toBe(new Date().getFullYear());
    });


  });
  describe('loadData', () => {


    it('should handle error when loading data by showing empty table with No records found', fakeAsync(() => {
      mockService.getInterdictionUpgradeMatrix.and.returnValue(throwError(() => new Error('API Error')));

      component.ngOnInit();
      tick();

      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
      expect(component.tableConfig.emptyMessage).toBe('No records found');
      expect(component.isLoading).toBe(false);
    }));



    it('should calculate skip value based on pagination', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 10;

      component.loadData();
      tick();

      expect(mockService.getInterdictionUpgradeMatrix).toHaveBeenCalledWith(10, 20, jasmine.any(Object));
    }));
  });

  describe('onSearch', () => {








    it('should update empty message to "No records found" when search is active', fakeAsync(() => {
      component.onSearch('test');
      tick();

      expect(component.tableConfig.emptyMessage).toBe('No records found');
    }));
  });

  describe('onSearchCleared', () => {
    it('should clear search term and reload data', fakeAsync(() => {
      component.searchTerm = 'test search';
      component.requestState.SearchKeyword = 'test search';

      component.onSearchCleared();
      tick();

      expect(component.searchTerm).toBe('');
      expect(component.requestState.SearchKeyword).toBeUndefined();
      expect(mockService.getInterdictionUpgradeMatrix).toHaveBeenCalled();
    }));



    it('should update empty message when clearing search', fakeAsync(() => {
      component.searchTerm = 'test';
      component.tableConfig.emptyMessage = 'No records found';

      component.onSearchCleared();
      tick();

      expect(component.tableConfig.emptyMessage).toBe('No interdiction upgrades available to display');
    }));
  });
  describe('onSortChange', () => {




    it('should reset page index to 0 when sorting changes', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 3;
      const sortEvent = { column: 'effectiveDate', direction: 'A' as const };

      component.onSortChange(sortEvent);
      tick();

      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    }));
  });

  describe('onRowAction', () => {
    it('should call editRecord for edit action', () => {
      spyOn(component, 'editRecord');
      const row = mockData[0];

      component.onRowAction({ action: 'edit', row });

      expect(component.editRecord).toHaveBeenCalledWith(row);
    });
  });

  describe('Side Panel Operations', () => {
    it('should open side panel in add mode when createRecord is called', () => {
      component.createRecord();

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
      expect(component.sidePanelOpen).toBe(true);
    });

    it('should open side panel in edit mode when editRecord is called', () => {
      const record = mockData[0];

      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(record);
      expect(component.sidePanelOpen).toBe(true);
    });





    it('should update mode and clear data when switching to add mode', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });

    it('should update mode without clearing data when switching to edit mode', () => {
      component.sidePanelMode = 'add';
      component.sidePanelData = mockData[0];

      component.onModeChange('edit');

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(mockData[0]);
    });
  });

  describe('openFilter', () => {
    it('should dispose existing overlay and close filter when overlayRef exists', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component['overlayRef']).toBeNull();
      expect(component.isFilterOpen).toBe(false);
    });

    it('should create overlay and set isFilterOpen to true when overlayRef does not exist', () => {
      component['overlayRef'] = null;
      component.isFilterOpen = false;
      component['tableCard'] = { nativeElement: document.createElement('div') } as any;

      component.openFilter();

      expect(component.isFilterOpen).toBe(true);
    });
  });

  describe('Filter Operations', () => {












    it('should update empty message to "No records found" when filters are applied', fakeAsync(() => {
      const filters: InterdictionUpgradeMatrixFilterValue = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.tableConfig.emptyMessage).toBe('No records found');
    }));



    it('should update empty message when filter chip is removed', fakeAsync(() => {
      component.appliedFilters = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: null,
        actionInterdiction: null,
        action: null
      };
      component.tableConfig.emptyMessage = 'No records found';

      component.onRemoveFilterChip('sourceInterdiction');
      tick();

      // After removing the only filter, empty message should reset
      expect(component.tableConfig.emptyMessage).toBe('No interdiction upgrades available to display');
    }));
  });
  describe('Format Methods', () => {
    const mockRow = mockData[0];





    it('should format action P as Place', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'action');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter('P', mockRow)).toBe('Place');
      }
    });

    it('should format action R as Release', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'action');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter('R', mockRow)).toBe('Release');
      }
    });

    it('should return dash for undefined action', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'action');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter(undefined, mockRow)).toBe('-');
      }
    });

    it('should return original value for unknown action', () => {
      const column = component.tableConfig.columns.find(c => c.key === 'action');
      const formatter = column?.valueFormatter;

      if (formatter) {
        expect(formatter('X', mockRow)).toBe('X');
      }
    });
  });
  describe('Header Actions', () => {
    it('should have NEW INTERDICTION UPGRADE action', () => {
      component.ngOnInit();
      const action = component.headerConfig.actions?.find(a => a.label === 'NEW INTERDICTION UPGRADE');
      expect(action).toBeDefined();
      expect(action?.icon).toBe('add');
    });


  });

  describe('updateRequestStateFromFilters', () => {
    it('should clear filter params when appliedFilters is null', fakeAsync(() => {
      component.requestState = {
        SourceInterdiction: 'SRC001',
        ExistingInterdiction: 'EXT001',
        SearchKeyword: 'test'
      };
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.SourceInterdiction).toBeUndefined();
      expect(component.requestState.ExistingInterdiction).toBeUndefined();
      expect(component.requestState.SearchKeyword).toBe('test');
    }));

    it('should update request state from applied filters', () => {
      component.appliedFilters = {
        sourceInterdiction: 'SRC001',
        existingInterdiction: 'EXT001',
        actionInterdiction: 'ACT001',
        action: 'P'
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.SourceInterdiction).toBe('SRC001');
      expect(component.requestState.ExistingInterdiction).toBe('EXT001');
      expect(component.requestState.ActionInterdiction).toBe('ACT001');
      expect(component.requestState.Action).toBe('P');
    });
  });
});
