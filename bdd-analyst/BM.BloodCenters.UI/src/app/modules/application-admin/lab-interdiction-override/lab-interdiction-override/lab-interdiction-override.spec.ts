import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { LabInterdictionOverride } from './lab-interdiction-override';
import { LabInterdictionOverrideService } from '../services/lab-interdiction-override.service';
import { LoginService } from '@shared/services/login.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  LabInterdictionOverrideModel,
  LabInterdictionOverrideFilterValue,
  VerifyInterdictionResponse
} from '../models/lab-interdiction-override.model';

describe('LabInterdictionOverride', () => {
  let loginServiceSpy: any;
  let overlaySpy: any;
  let overlayPositionBuilderSpy: any;
  let overlayRefSpy: any;
  let snackBarSpy: any;
  let snackBarRefSpy: any;
  let serviceSpy: any;
  let component: LabInterdictionOverride;
  let fixture: ComponentFixture<LabInterdictionOverride>;
  let service: jasmine.SpyObj<LabInterdictionOverrideService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let overlay: jasmine.SpyObj<Overlay>;

  const mockTableData: LabInterdictionOverrideModel[] = [
    {
      auditKey: 1,
      donorDecisionCode: 'A',
      decisionDesc: 'Ambiguous',
      productType: 'FFP',
      prodTypeDesc: 'Fresh Frozen Plasma',
      interCode: 'HIVI',
      interDescription: 'HIV-1/2 Inter A',
      interType: 'B',
      overrideDesc: 'HIV attribute override',
      effDate: '2024-01-01',
      lastModifiedDate: '2024-06-15',
      programId: 'PROG001',
      moveDate: '2024-01-01',
      user: 'USER001',
      choose: 'Y'
    },
    {
      auditKey: 2,
      donorDecisionCode: 'A',
      decisionDesc: 'Ambiguous',
      productType: 'RBC',
      prodTypeDesc: 'Red Blood Cell',
      interCode: 'HIVI',
      interDescription: 'HIV-1/2 Inter A',
      interType: 'B',
      overrideDesc: 'HIV attribute override',
      effDate: '2024-01-01',
      lastModifiedDate: '2024-06-15',
      programId: 'PROG001',
      moveDate: '2024-01-01',
      user: 'USER001',
      choose: 'Y'
    }
  ];

  const mockApiResponse = { data: mockTableData, totalRecords: 2 };

  beforeEach(() => {

    serviceSpy = jasmine.createSpyObj('LabInterdictionOverrideService', [
      'getLabInterdictionOverrides',
      'verifyInterdictions',
      'getFilterDropdownOptions'
    ]);

    snackBarRefSpy = jasmine.createSpyObj('MatSnackBarRef', ['afterDismissed', 'onAction']);
    snackBarRefSpy.afterDismissed.and.returnValue(of(null));
    snackBarRefSpy.onAction.and.returnValue(of(null));

    snackBarSpy = createMockMatSnackBar();
    snackBarSpy.open.and.returnValue(snackBarRefSpy);

    overlayRefSpy = jasmine.createSpyObj('OverlayRef', [
      'attach',
      'dispose',
      'backdropClick'
    ]);
    overlayRefSpy.backdropClick.and.returnValue(of(null));

    overlayPositionBuilderSpy = jasmine.createSpyObj('OverlayPositionBuilder', [
      'flexibleConnectedTo',
      'withPositions',
      'withPush'
    ]);
    overlayPositionBuilderSpy.flexibleConnectedTo.and.returnValue(overlayPositionBuilderSpy);
    overlayPositionBuilderSpy.withPositions.and.returnValue(overlayPositionBuilderSpy);
    overlayPositionBuilderSpy.withPush.and.returnValue(overlayPositionBuilderSpy);

    overlaySpy = jasmine.createSpyObj('Overlay', ['position', 'create', 'scrollStrategies']);
    overlaySpy.position.and.returnValue(overlayPositionBuilderSpy);
    overlaySpy.create.and.returnValue(overlayRefSpy);
    overlaySpy.scrollStrategies = {
      block: () => ({})
    } as any;

    loginServiceSpy = jasmine.createSpyObj('LoginService', ['getLoggedInUser']);
    const pageHeaderServiceSpy = {
      pageHeaderData: signal(null),
      getTitle: jasmine.createSpy('getTitle').and.returnValue(undefined),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(undefined)
    };



      TestBed.configureTestingModule({
      imports: [
        LabInterdictionOverride,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: LabInterdictionOverrideService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Overlay, useValue: overlaySpy },
        { provide: LoginService, useValue: loginServiceSpy },
        { provide: PageHeaderService, useValue: pageHeaderServiceSpy }
      ]
    });
      snackBarRefSpy.afterDismissed.and.returnValue(of(null));


      snackBarRefSpy.onAction.and.returnValue(of(null));


      snackBarSpy.open.and.returnValue(snackBarRefSpy);


      overlayRefSpy.backdropClick.and.returnValue(of(null));


      overlayPositionBuilderSpy.flexibleConnectedTo.and.returnValue(overlayPositionBuilderSpy);


      overlayPositionBuilderSpy.withPositions.and.returnValue(overlayPositionBuilderSpy);


      overlayPositionBuilderSpy.withPush.and.returnValue(overlayPositionBuilderSpy);


      overlaySpy.position.and.returnValue(overlayPositionBuilderSpy);


      overlaySpy.create.and.returnValue(overlayRefSpy);


    fixture = TestBed.createComponent(LabInterdictionOverride);
    component = fixture.componentInstance;
    service = TestBed.inject(LabInterdictionOverrideService) as jasmine.SpyObj<LabInterdictionOverrideService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    overlay = TestBed.inject(Overlay) as jasmine.SpyObj<Overlay>;

    service.getLabInterdictionOverrides.and.returnValue(of(mockApiResponse));


    });

  describe('Component Initialization', () => {


    it('should initialize with correct header config', () => {
      expect(component.headerConfig.title).toBe('');
      expect(component.headerConfig.subtitle).toBe('');
      expect(component.headerConfig.breadcrumbs.length).toBe(0);
    });






  });

  describe('Data Loading', () => {


    it('should handle loading error', fakeAsync(() => {
      service.getLabInterdictionOverrides.and.returnValue(
        throwError(() => new Error('Loading failed'))
      );

      component.loadTableData();
      tick();

      expect(component.isLoading).toBe(false);
    }));


  });

  describe('Donor Decision Code (Cue) Filtering', () => {
    it('should filter by donor decision code', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters?.donorDecisionCode).toBe('A');
      expect(service.getLabInterdictionOverrides).toHaveBeenCalledWith(
        jasmine.objectContaining({ donorDecisionCode: 'A' })
      );
    }));

    it('should create filter chip for donor decision code', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
      const cueChip = component.filterChips.find(chip => chip.key === 'donorDecisionCode');
      expect(cueChip).toBeDefined();
      expect(cueChip?.value).toBe('A');
    }));
  });

  describe('Sorting', () => {
    it('should sort ascending (A) when clicking on a new column', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSortClick('interType');
      tick();

      expect(component.currentSortColumn).toBe('interType');
      expect(component.currentSortDirection).toBe('A');
      expect(component.requestState.sortOrder).toBe('A');
      expect(component.requestState.sortColumn).toBe('interType');
    }));









    it('should display unfold_more icon when not sorted', () => {
      component.currentSortColumn = 'interType';

      const icon = component.getSortIcon('donorDecisionCode');
      expect(icon).toBe('unfold_more');
    });




  });

  describe('Search', () => {
    it('should search on Enter key press', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.searchBarComponent = { searchText: 'HIVI' } as any;
      component.onEnterSearch();
      tick();

      expect(component.requestState.searchText).toBe('HIVI');
      expect(component.requestState.skip).toBe(0);
      expect(service.getLabInterdictionOverrides).toHaveBeenCalled();
    }));



    it('should clear search when search text is empty', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.requestState.searchText = 'previous';
      component.onSearch('');
      tick();

      expect(component.requestState.searchText).toBeUndefined();
      expect(service.getLabInterdictionOverrides).toHaveBeenCalled();
    }));
  });

  describe('Filtering', () => {
    it('should apply filters and reset page', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A',
        interType: 'B'
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(component.requestState.skip).toBe(0);
      expect(service.getLabInterdictionOverrides).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donorDecisionCode: 'A',
          interType: 'B'
        })
      );
    }));

    it('should create filter chips from applied filters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: LabInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A',
        interType: 'B'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
    }));





    it('should return true if filters are active', () => {
      component.appliedFilters = { donorDecisionCode: 'A' };
      component.buildFilterChips();
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false if no filters are active', () => {
      component.appliedFilters = null;
      expect(component.hasActiveFilters()).toBe(false);
    });






  });

  describe('Row Selection', () => {
    it('should select a row', () => {
      component.toggleRowSelection(mockTableData[0]);
      expect(component.selectedRows.has(1)).toBe(true);
    });

    it('should deselect a row', () => {
      component.selectedRows.add(1);
      component.toggleRowSelection(mockTableData[0]);
      expect(component.selectedRows.has(1)).toBe(false);
    });







    it('should return true for someRowsSelected', () => {
      component.dataSource = mockTableData;
      component.selectedRows.add(1);
      expect(component.someRowsSelected()).toBe(true);
    });

    it('should return false for someRowsSelected when all selected', () => {
      component.dataSource = mockTableData;
      component.selectedRows = new Set([1, 2]);
      expect(component.someRowsSelected()).toBe(false);
    });
  });
});
