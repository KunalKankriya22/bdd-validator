import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError, Observable, Subject } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { AccessManagementComponent } from './access-management';
import { AccessManagementService } from './services/access-management.service';
import { createMockMatSnackBar, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  AccessManagementModel,
  AccessManagementFilterValue
} from './models/access-management.model';

describe('AccessManagementComponent', () => {
  let mockPositionStrategy: any;
  let mockOverlayRef: any;
  let component: AccessManagementComponent;
  let fixture: ComponentFixture<AccessManagementComponent>;
  let mockService: jasmine.SpyObj<AccessManagementService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;

  const mockData: AccessManagementModel[] = [
    {
      chapterId: 'CH001',
      type: 'Regular donor',
      functionName: 'ONPDNCON',
      alertRequired: 'Yes',
      effectiveDate: '2025-01-01',
      terminationDate: '2025-12-31'
    },
    {
      chapterId: 'CH002',
      type: 'FastTrak donor',
      functionName: 'ONPDNREG',
      alertRequired: 'No',
      effectiveDate: '2025-02-01',
      terminationDate: null
    }
  ];

  beforeEach(() => {

    mockService = jasmine.createSpyObj('AccessManagementService', [
      'getAccessManagement',
      'getAccessManagementFilters',
      'getFormOptions'
    ]);

    mockSnackBar = createMockMatSnackBar();

    mockTranslateService = createMockTranslateService();
    // Create comprehensive Overlay mock
    const mockComponentRef = {
      instance: {
        currentFilters: null,
        apply: new Subject(),
        close: new Subject()
      }
    };

    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.attach.and.returnValue(mockComponentRef);
    mockOverlayRef.backdropClick.and.returnValue(of(null));

    mockPositionStrategy = jasmine.createSpyObj('FlexibleConnectedPositionStrategy',
      ['flexibleConnectedTo', 'withPositions', 'withPush', 'withViewportMargin', 'withFlexibleDimensions', 'withGrowAfterOpen']
    );
    mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withViewportMargin.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withFlexibleDimensions.and.returnValue(mockPositionStrategy);
    mockPositionStrategy.withGrowAfterOpen.and.returnValue(mockPositionStrategy);

    const mockScrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position']);
    mockOverlay.position.and.returnValue(mockPositionStrategy as any);
    mockOverlay.create.and.returnValue(mockOverlayRef);
    Object.defineProperty(mockOverlay, 'scrollStrategies', {
      value: mockScrollStrategies,
      writable: false
    });

    mockService.getAccessManagement.and.returnValue(
      of({ data: mockData, totalRecords: 2 })
    );

    mockService.getAccessManagementFilters.and.returnValue(
      of({
        item: {
          chapterIds: ['CH001', 'CH002'],
          alertRequiredOptions: ['Yes', 'No']
        }
      })
    );



      TestBed.configureTestingModule({
      imports: [AccessManagementComponent],
      providers: [
        provideAnimations(),
        provideHttpClient(),
        provideRouter([]),
        { provide: AccessManagementService, useValue: mockService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: Overlay, useValue: mockOverlay },
        { provide: TranslateService, useValue: mockTranslateService }
      ]
    });


    


      mockService.getAccessManagement.calls.reset();


      mockService.getAccessManagementFilters.calls.reset();


      mockService.getFormOptions.calls.reset();


      mockOverlayRef.attach.calls.reset();


      mockOverlayRef.dispose.calls.reset();


      mockOverlayRef.backdropClick.calls.reset();


      mockPositionStrategy.flexibleConnectedTo.calls.reset();


      mockPositionStrategy.withPositions.calls.reset();


      mockPositionStrategy.withPush.calls.reset();


      mockPositionStrategy.withViewportMargin.calls.reset();


      mockPositionStrategy.withFlexibleDimensions.calls.reset();


      mockPositionStrategy.withGrowAfterOpen.calls.reset();


      mockOverlay.create.calls.reset();


      mockOverlay.position.calls.reset();


      mockOverlayRef.attach.and.returnValue(mockComponentRef);


      mockOverlayRef.backdropClick.and.returnValue(of(null));


      mockPositionStrategy.flexibleConnectedTo.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPositions.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withPush.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withViewportMargin.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withFlexibleDimensions.and.returnValue(mockPositionStrategy);


      mockPositionStrategy.withGrowAfterOpen.and.returnValue(mockPositionStrategy);


      mockOverlay.position.and.returnValue(mockPositionStrategy as any);


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(AccessManagementComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {




    it('should initialize table config with row actions', () => {
      expect(component.tableConfig.rowActions).toBeDefined();
      expect(component.tableConfig.rowActions?.length).toBe(1);
      expect(component.tableConfig.rowActions?.[0].action).toBe('edit');
    });



    it('should initialize with sticky header and actions column', () => {
      expect(component.tableConfig.stickyHeader).toBeTrue();
      expect(component.tableConfig.stickyActionsColumn).toBeTrue();
    });



    it('should initialize search config with searchOnEnterOnly enabled', () => {
      expect(component.searchConfig.searchOnEnterOnly).toBeTrue();
      expect(component.searchConfig.placeholder).toBe('Search by Function Name');
      expect(component.searchConfig.minLength).toBe(2);
    });
  });

  describe('Data Loading', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should update data source after loading', fakeAsync(() => {
      component.loadData();
      tick();

      expect(component.dataSource).toEqual(mockData);
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle error during data loading', fakeAsync(() => {
      mockService.getAccessManagement.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadData();
      tick();

      expect(component.dataSource).toEqual([]);
      expect(component.isLoading).toBeFalse();
      expect(component.tableConfig.emptyMessage).toBe('No records found');
    }));

    it('should pass correct parameters to service', fakeAsync(() => {
      component.loadData();
      tick();

      expect(mockService.getAccessManagement).toHaveBeenCalledWith(
        1000,
        0,
        jasmine.any(Object)
      );
    }));
  });

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));





    it('should trim search term before searching', () => {
      component.onSearch('  test  ');
      expect(component.requestState.SearchKeyword).toBe('test');
    });



    it('should update empty message based on search', () => {
      component.onSearch('test');
      expect(component.tableConfig.emptyMessage).toBe('No records found');
    });
  });



  describe('Row Actions', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should call editRecord on edit action', () => {
      spyOn(component, 'editRecord');
      component.onRowAction({ action: 'edit', row: mockData[0] });
      expect(component.editRecord).toHaveBeenCalledWith(mockData[0]);
    });
  });
  describe('Edit Record', () => {


    it('should set side panel data', () => {
      component.editRecord(mockData[0]);
      expect(component.sidePanelData).toEqual(mockData[0]);
    });


  });

  describe('Side Panel Management', () => {




    it('should handle mode change', () => {
      component.sidePanelMode = 'edit';
      component.sidePanelData = mockData[0];

      component.onModeChange('add');

      expect(component.sidePanelMode).toBe('add');
      expect(component.sidePanelData).toBeNull();
    });
  });

  describe('Filter Management', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));



    it('should convert filters to chips', () => {
      const filters: AccessManagementFilterValue = {
        chapterId: 'CH001',
        alertRequired: 'Yes',
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    });







    it('should return true when filters are active', () => {
      component.appliedFilters = {
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };

      expect(component.hasActiveFilters()).toBeTrue();
    });




  });

  describe('Filter Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set filter open state when opening filter', () => {
      // Mock the tableCard ElementRef
      component['tableCard'] = { nativeElement: document.createElement('div') } as ElementRef;

      // Ensure overlayRef is not already set
      component['overlayRef'] = null;

      component.openFilter();

      expect(component.isFilterOpen).toBeTrue();
    });

    it('should close filter panel if already open', () => {
      const mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['dispose', 'backdropClick']);
      mockOverlayRef.backdropClick.and.returnValue(of(null));
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;

      component.openFilter();

      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBeFalse();
    });


  });
  describe('Component Cleanup', () => {




    it('should not error on destroy if no overlay exists', () => {
      component['overlayRef'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('Empty Message Updates', () => {
    it('should show filtered message when search is active', () => {
      component.requestState.SearchKeyword = 'test';
      component['updateEmptyMessage']();
      expect(component.tableConfig.emptyMessage).toBe('No records found');
    });

    it('should show filtered message when filters are active', () => {
      component.appliedFilters = {
        chapterId: 'CH001',
        alertRequired: null,
        effectiveDateFrom: null,
        effectiveDateTo: null,
        terminationDateFrom: null,
        terminationDateTo: null
      };
      component['updateEmptyMessage']();
      expect(component.tableConfig.emptyMessage).toBe('No records found');
    });

    it('should show default message when no search or filters', () => {
      component.requestState.SearchKeyword = undefined;
      component.appliedFilters = null;
      component['updateEmptyMessage']();
      expect(component.tableConfig.emptyMessage).toBe('No access management records available to display');
    });
  });
});
