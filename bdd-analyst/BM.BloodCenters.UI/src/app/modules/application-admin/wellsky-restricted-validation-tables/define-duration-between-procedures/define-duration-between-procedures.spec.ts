import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { DefineDurationBetweenProceduresComponent } from './define-duration-between-procedures';
import { DefineDurationBetweenProceduresService } from './services/define-duration-between-procedures.service';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { of, throwError, Subject } from 'rxjs';
import {
  DefineDurationBetweenProceduresModel,
  DefineDurationBetweenProceduresFilterValue
} from './models/define-duration-between-procedures.model';
import { TranslateModule } from '@ngx-translate/core';
import { PageHeaderService } from '@shared/services/page-header.service';
import { signal } from '@angular/core';

describe('DefineDurationBetweenProceduresComponent', () => {
  let component: DefineDurationBetweenProceduresComponent;
  let fixture: ComponentFixture<DefineDurationBetweenProceduresComponent>;
  let mockService: jasmine.SpyObj<DefineDurationBetweenProceduresService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockOverlay: jasmine.SpyObj<Overlay>;
  let mockOverlayRef: jasmine.SpyObj<OverlayRef>;
  let mockPageHeaderService: any;

  const mockData: DefineDurationBetweenProceduresModel[] = [
    {
      currDonationType: 'WB',
      currDonationTypeDescription: 'Whole Blood',
      procedureCode: 'APH',
      procedureCodeDescription: 'Apheresis',
      prevProcedureCode: 'PLA',
      prevProcedureCodeDescription: 'Plasma',
      daysBetween: 56,
      effectiveDate: new Date('2028-06-01'),
      terminationDate: null,
      chapterId: 'ALL',
      programId: 'MANUAL',
      insertUser: 'DONSYS'
    },
    {
      currDonationType: 'RBC',
      currDonationTypeDescription: 'Red Blood Cells',
      procedureCode: 'PLT',
      procedureCodeDescription: 'Platelets',
      prevProcedureCode: 'WB',
      prevProcedureCodeDescription: 'Whole Blood',
      daysBetween: 112,
      effectiveDate: new Date('2028-06-15'),
      terminationDate: new Date('2028-12-31'),
      chapterId: 'ALL',
      programId: 'MANUAL',
      insertUser: 'DONSYS'
    }
  ];

  const mockResponse = {
    data: mockData,
    totalRecords: 2
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DefineDurationBetweenProceduresService', [
      'getDefineDurationBetweenProcedures',
      'getDonationTypes',
      'getProcedureCodes',
      'addDefineDuration',
      'updateDefineDuration'
    ]);
    mockService.getDefineDurationBetweenProcedures.and.returnValue(of(mockResponse));

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/',
      events: of(new NavigationEnd(0, '/', '/'))
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');

    const backdropClickSubject = new Subject<MouseEvent>();
    mockOverlayRef = jasmine.createSpyObj('OverlayRef', ['attach', 'dispose', 'backdropClick']);
    mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());

    const mockPositionStrategy = {
      withPositions: jasmine.createSpy('withPositions').and.callFake(function(this: any) { return this; }),
      withPush: jasmine.createSpy('withPush').and.callFake(function(this: any) { return this; })
    };

    mockOverlay = jasmine.createSpyObj('Overlay', ['create', 'position', 'scrollStrategies']);
    mockOverlay.position.and.returnValue({
      flexibleConnectedTo: jasmine.createSpy('flexibleConnectedTo').and.returnValue(mockPositionStrategy)
    } as any);
    mockOverlay.scrollStrategies = {
      block: jasmine.createSpy('block').and.returnValue({})
    } as any;
    mockOverlay.create.and.returnValue(mockOverlayRef);

    const pageHeaderDataSignal = signal({
      title: 'Define Duration Between Procedures',
      subtitle: ''
    });
    mockPageHeaderService = {
      pageHeaderData: pageHeaderDataSignal,
      getTitle: jasmine.createSpy('getTitle').and.returnValue('Define Duration Between Procedures'),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(''),
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem')
    } as any;



      TestBed.configureTestingModule({
      imports: [
        DefineDurationBetweenProceduresComponent,
        TranslateModule.forRoot()
      ],
      providers: [
        provideHttpClient(),
        { provide: DefineDurationBetweenProceduresService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: Overlay, useValue: mockOverlay },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} }, params: of({}), queryParams: of({}) } }
      ]
    });


      mockService.getDefineDurationBetweenProcedures.and.returnValue(of(mockResponse));


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockOverlayRef.backdropClick.and.returnValue(backdropClickSubject.asObservable());


      mockOverlay.create.and.returnValue(mockOverlayRef);


    fixture = TestBed.createComponent(DefineDurationBetweenProceduresComponent);
    component = fixture.componentInstance;


    });

  describe('Component Initialization', () => {
    it('should update header subtitle from PageHeaderService', () => {
      fixture.detectChanges();
      expect(component.headerConfig.subtitle).toBe('');
    });

    it('should preserve header actions when PageHeaderService updates title', () => {
      fixture.detectChanges();
      const action = component.headerConfig.actions?.find(a => a.label === 'ADD RULE');
      expect(action).toBeDefined();
    });

    it('should initialize with isSidePanelOpen as false', () => {
      expect(component.isSidePanelOpen).toBe(false);
    });

    it('should initialize with isReferencePanelOpen as false', () => {
      expect(component.isReferencePanelOpen).toBe(false);
    });

    it('should set currentYear to current year', () => {
      expect(component.currentYear).toBe(new Date().getFullYear());
    });

    it('should initialize requestState with activeOnly true', () => {
      expect(component.requestState.activeOnly).toBe(true);
    });
  });

  describe('loadData', () => {
    it('should handle 404 with empty data as success', fakeAsync(() => {
      mockService.getDefineDurationBetweenProcedures.and.returnValue(
        throwError(() => ({
          status: 404,
          error: { data: [] }
        }))
      );

      component.loadData();
      tick();

      expect(component.hasError).toBe(false);
      expect(component.dataSource).toEqual([]);
      expect(component.tableConfig.pagination?.totalRecords).toBe(0);
    }));

    it('should calculate skip value based on pagination', fakeAsync(() => {
      component.tableConfig.pagination!.pageIndex = 2;
      component.tableConfig.pagination!.pageSize = 25;

      component.loadData();
      tick();

      expect(mockService.getDefineDurationBetweenProcedures).toHaveBeenCalledWith(25, 50, jasmine.any(Object));
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
      expect(component.isSidePanelOpen).toBe(true);
    });

    it('should open side panel in edit mode when editRecord is called', () => {
      const record = mockData[0];

      component.editRecord(record);

      expect(component.sidePanelMode).toBe('edit');
      expect(component.sidePanelData).toBe(record);
      expect(component.isSidePanelOpen).toBe(true);
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
  });

  describe('Filter Operations', () => {
    it('should handle effective date with AFTER period', fakeAsync(() => {
      const testDate = new Date('2028-06-01');
      const filters: DefineDurationBetweenProceduresFilterValue = {
        currDonationType: null,
        procedureCode: null,
        activeOnly: true,
        effectiveDate: testDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.effectiveDateFrom).toBeDefined();
      expect(component.requestState.effectiveDateTo).toBeUndefined();
    }));

    it('should handle effective date with BEFORE period', fakeAsync(() => {
      const testDate = new Date('2028-06-01');
      const filters: DefineDurationBetweenProceduresFilterValue = {
        currDonationType: null,
        procedureCode: null,
        activeOnly: true,
        effectiveDate: testDate,
        effectiveDatePeriod: 'BEFORE',
        terminationDate: null,
        terminationDatePeriod: null
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.effectiveDateFrom).toBeUndefined();
      expect(component.requestState.effectiveDateTo).toBeDefined();
    }));

    it('should handle termination date with AFTER period', fakeAsync(() => {
      const testDate = new Date('2028-12-31');
      const filters: DefineDurationBetweenProceduresFilterValue = {
        currDonationType: null,
        procedureCode: null,
        activeOnly: true,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: testDate,
        terminationDatePeriod: 'AFTER'
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.terminationDateFrom).toBeDefined();
      expect(component.requestState.terminationDateTo).toBeUndefined();
    }));

    it('should handle termination date with BEFORE period', fakeAsync(() => {
      const testDate = new Date('2028-12-31');
      const filters: DefineDurationBetweenProceduresFilterValue = {
        currDonationType: null,
        procedureCode: null,
        activeOnly: true,
        effectiveDate: null,
        effectiveDatePeriod: null,
        terminationDate: testDate,
        terminationDatePeriod: 'BEFORE'
      };

      component.applyFilters(filters);
      tick();

      expect(component.requestState.terminationDateFrom).toBeUndefined();
      expect(component.requestState.terminationDateTo).toBeDefined();
    }));
  });

  describe('Keyboard Shortcuts', () => {
    it('should close filter panel on Escape when open', () => {
      component['overlayRef'] = mockOverlayRef;
      component.isFilterOpen = true;
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      spyOn(event, 'preventDefault');

      component.handleKeyboardShortcut(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(mockOverlayRef.dispose).toHaveBeenCalled();
      expect(component.isFilterOpen).toBe(false);
    });
  });
  describe('ngOnDestroy', () => {
    it('should not error if overlayRef is null', () => {
      component['overlayRef'] = null;

      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
  describe('Row Actions', () => {
    it('should have correct aria label for edit action', () => {
      const editAction = component.tableConfig.rowActions?.find(a => a.action === 'edit');
      expect(editAction?.ariaLabel).toContain('Edit duration rule');
    });

  });

  describe('Header Actions', () => {
    it('should have NEW RULE action', () => {
      const action = component.headerConfig.actions?.find(a => a.label === 'ADD RULE');
      expect(action).toBeDefined();
      expect(action?.icon).toBe('add');
      expect(action?.color).toBe('accent');
    });
  });

  describe('updateRequestStateFromFilters', () => {
    it('should clear filter params when appliedFilters is null', () => {
      component.requestState = {
        currDonationType: 'WB',
        procedureCode: 'APH',
        searchKeyword: 'test',
        activeOnly: false,
        effectiveDateFrom: new Date().toISOString()
      };
      component.appliedFilters = null;

      component['updateRequestStateFromFilters']();

      expect(component.requestState.currDonationType).toBeUndefined();
      expect(component.requestState.procedureCode).toBeUndefined();
      expect(component.requestState.effectiveDateFrom).toBeUndefined();
      expect(component.requestState.activeOnly).toBe(true);
      expect(component.requestState.searchKeyword).toBe('test');
    });

    it('should update request state from applied filters with dates', () => {
      const effectiveDate = new Date('2028-06-01');
      const terminationDate = new Date('2028-12-31');

      component.appliedFilters = {
        currDonationType: 'WB',
        procedureCode: 'APH',
        activeOnly: false,
        effectiveDate: effectiveDate,
        effectiveDatePeriod: 'AFTER',
        terminationDate: terminationDate,
        terminationDatePeriod: 'BEFORE'
      };

      component['updateRequestStateFromFilters']();

      expect(component.requestState.currDonationType).toBe('WB');
      expect(component.requestState.procedureCode).toBe('APH');
      expect(component.requestState.activeOnly).toBe(false);
      expect(component.requestState.effectiveDateFrom).toBeDefined();
      expect(component.requestState.terminationDateTo).toBeDefined();
    });
  });

  describe('Empty State', () => {
    it('should display empty message when no data', () => {
      expect(component.tableConfig.emptyMessage).toBe('No duration rules available to display');
    });
  });

  describe('Pagination Configuration', () => {
    it('should show first last buttons', () => {
      expect(component.tableConfig.pagination?.showFirstLastButtons).toBe(true);
    });

    it('should start at page index 0', () => {
      expect(component.tableConfig.pagination?.pageIndex).toBe(0);
    });
  });
});
