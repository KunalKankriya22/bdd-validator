import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of, throwError } from 'rxjs';
import { DonorInterdictionOverride } from './donor-interdiction-override';
import { DonorInterdictionOverrideService } from '../services/donor-interdiction-override.service';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';
import {
  DonorInterdictionOverrideModel,
  DonorInterdictionOverrideFilterValue,
  VerifyInterdictionResponse
} from '../models/donor-interdiction-override.model';

describe('DonorInterdictionOverride', () => {
  let overlaySpy: any;
  let overlayPositionBuilderSpy: any;
  let overlayRefSpy: any;
  let snackBarSpy: any;
  let snackBarRefSpy: any;
  let serviceSpy: any;
  let component: DonorInterdictionOverride;
  let fixture: ComponentFixture<DonorInterdictionOverride>;
  let service: jasmine.SpyObj<DonorInterdictionOverrideService>;
  let snackBar: jasmine.SpyObj<MatSnackBar>;
  let overlay: jasmine.SpyObj<Overlay>;

  const mockTableData: DonorInterdictionOverrideModel[] = [
    {
      audit_Key: 1,
      donorDecisionCode: 'A',
      decisionDesc: 'Ambiguous',
      productType: 'FFP',
      prodTypeDesc: 'Fresh Frozen Plasma',
      attribGroup: 'AG1',
      attribCode: 'AC1',
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
      audit_Key: 2,
      donorDecisionCode: 'A',
      decisionDesc: 'Ambiguous',
      productType: 'RBC',
      prodTypeDesc: 'Red Blood Cell',
      attribGroup: 'AG2',
      attribCode: 'AC2',
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

    serviceSpy = jasmine.createSpyObj('DonorInterdictionOverrideService', [
      'getDonorInterdictionOverrides',
      'verifyInterdictions'
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



      TestBed.configureTestingModule({
      imports: [
        DonorInterdictionOverride,
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        NoopAnimationsModule
      ],
      providers: [
        provideRouter([]),
        { provide: DonorInterdictionOverrideService, useValue: serviceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        { provide: Overlay, useValue: overlaySpy }
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


    fixture = TestBed.createComponent(DonorInterdictionOverride);
    component = fixture.componentInstance;
    service = TestBed.inject(DonorInterdictionOverrideService) as jasmine.SpyObj<DonorInterdictionOverrideService>;
    snackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
    overlay = TestBed.inject(Overlay) as jasmine.SpyObj<Overlay>;

    // Default service responses
    service.getDonorInterdictionOverrides.and.returnValue(of(mockApiResponse));


    });

  describe('Component Initialization', () => {


    it('should initialize with correct header config', () => {
      // Header config is now populated dynamically via PageHeaderService
      // Initial state should be empty
      expect(component.headerConfig.title).toBe('');
      expect(component.headerConfig.subtitle).toBe('');
      expect(component.headerConfig.breadcrumbs.length).toBe(0);
    });

    it('should initialize with correct search config', () => {
      expect(component.searchConfig.placeholder).toBe('Search by Interdiction or Description');
      expect(component.searchConfig.debounceTime).toBe(600);
      expect(component.searchConfig.minLength).toBe(0);
    });



    it('should load table data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledTimes(1);
    }));

    it('should extract unique filter values from all data', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.uniqueCueOptions.length).toBeGreaterThan(0);
      expect(component.uniqueTypeOptions.length).toBeGreaterThan(0);
    }));
  });

  describe('Data Loading', () => {
    it('should load table data successfully', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      expect(component.dataSource.length).toBe(2);
      expect(component.isLoading).toBe(false);
    }));

    it('should load all records and populate filter options', fakeAsync(() => {
      const largeMockData: DonorInterdictionOverrideModel[] = Array.from({ length: 25 }, (_, i) => ({
        audit_Key: i + 1,
        donorDecisionCode: `CODE${i}`,
        decisionDesc: `Description ${i}`,
        productType: 'FFP',
        prodTypeDesc: 'Fresh Frozen Plasma',
        attribGroup: 'AG1',
        attribCode: 'AC1',
        interCode: 'HIVI',
        interDescription: 'HIV-1/2 Inter A',
        interType: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
        overrideDesc: 'Override',
        effDate: '2024-01-01',
        lastModifiedDate: '2024-06-15',
        programId: 'PROG001',
        moveDate: '2024-01-01',
        user: 'USER001',
        choose: 'Y'
      }));

      service.getDonorInterdictionOverrides.and.returnValue(of({
        data: largeMockData,
        totalRecords: 25
      }));

      component.loadInitialData();
      tick();

      expect(component.uniqueCueOptions.length).toBeGreaterThan(0);
      expect(component.uniqueTypeOptions.length).toBe(3);
      expect(component.dataSource.length).toBe(25);
    }));


  });

  describe('Donor Decision Code (Cue) Filtering', () => {
    it('should filter by donor decision code', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters?.donorDecisionCode).toBe('A');
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledWith(
        jasmine.objectContaining({ donorDecisionCode: 'A' })
      );
    }));

    it('should extract unique donor decision codes', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.uniqueCueOptions).toBeDefined();
      expect(component.uniqueCueOptions.length).toBeGreaterThan(0);
      const cue = component.uniqueCueOptions.find(c => c.code === 'A');
      expect(cue).toBeDefined();
      expect(cue?.display).toContain('Ambiguous');
    }));

    it('should create filter chip for donor decision code', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A'
      };

      component.applyFilters(filters);

      expect(component.filterChips.length).toBeGreaterThan(0);
      const cueChip = component.filterChips.find(chip => chip.key === 'donorDecisionCode');
      expect(cueChip).toBeDefined();
      expect(cueChip?.value).toBe('A');
    }));
  });

  // Infinite Scroll tests removed - feature no longer exists in component

  describe('Sorting', () => {
    it('should sort ascending (A) when clicking on column', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSortClick('donorDecisionCode');
      tick();

      expect(component.currentSortColumn).toBe('donorDecisionCode');
      expect(component.currentSortDirection).toBe('A');
      expect(component.requestState.sortOrder).toBe('A');
      expect(component.requestState.sortColumn).toBe('donorDecisionCode');
    }));

    it('should sort descending (D) when clicking on same column again', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSortClick('donorDecisionCode');
      tick();
      component.onSortClick('donorDecisionCode');
      tick();

      expect(component.currentSortDirection).toBe('D');
      expect(component.requestState.sortOrder).toBe('D');
      expect(component.requestState.sortColumn).toBe('donorDecisionCode');
    }));

    it('should clear sort when clicking on same column third time', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSortClick('donorDecisionCode');
      component.onSortClick('donorDecisionCode');
      component.onSortClick('donorDecisionCode');
      tick();

      expect(component.currentSortDirection).toBe('default');
      expect(component.requestState.sortOrder).toBeUndefined();
      expect(component.requestState.sortColumn).toBeUndefined();
    }));







    it('should display unfold_more icon when not sorted', () => {
      component.currentSortColumn = '';
      component.currentSortDirection = 'default';

      const icon = component.getSortIcon('donorDecisionCode');
      expect(icon).toBe('unfold_more');
    });






  });

  describe('Search', () => {
    it('should search with debounce', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.onSearch('HIVI');
      tick();

      expect(component.requestState.searchText).toBe('HIVI');
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalled();
    }));




  });

  describe('Filtering', () => {
    it('should apply filters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: DonorInterdictionOverrideFilterValue = {
        donorDecisionCode: 'A',
        interType: 'B'
      };

      component.applyFilters(filters);
      tick();

      expect(component.appliedFilters).toEqual(filters);
      expect(service.getDonorInterdictionOverrides).toHaveBeenCalledWith(
        jasmine.objectContaining({
          donorDecisionCode: 'A',
          interType: 'B'
        })
      );
    }));

    it('should create filter chips from applied filters', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const filters: DonorInterdictionOverrideFilterValue = {
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
      component.filterChips = [];
      expect(component.hasActiveFilters()).toBe(false);
    });





    it('should handle removing filter by key', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      component.appliedFilters = {
        donorDecisionCode: 'A',
        interType: 'B'
      };
      component.buildFilterChips();

      component.removeFilter('donorDecisionCode');
      tick();

      expect(component.appliedFilters?.donorDecisionCode).toBeUndefined();
      expect(component.appliedFilters?.interType).toBe('B');
    }));
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

    it('should return false for someRowsSelected when none selected', () => {
      component.dataSource = mockTableData;
      component.selectedRows.clear();
      expect(component.someRowsSelected()).toBe(false);
    });

    it('should only toggle current page rows, not all selections', () => {
      const page1Data: DonorInterdictionOverrideModel[] = [
        { ...mockTableData[0], audit_Key: 1 },
        { ...mockTableData[1], audit_Key: 2 }
      ];

      
      const page2Data: DonorInterdictionOverrideModel[] = [
        { ...mockTableData[0], audit_Key: 3 },
        { ...mockTableData[1], audit_Key: 4 }
      ];

    
      component.dataSource = page1Data;
      component.toggleAllRows();
      expect(component.selectedRows.has(1)).toBe(true);
      expect(component.selectedRows.has(2)).toBe(true);
      expect(component.selectedRows.size).toBe(2);

      
      component.dataSource = page2Data;
      component.toggleAllRows();
      expect(component.selectedRows.has(3)).toBe(true);
      expect(component.selectedRows.has(4)).toBe(true);
      expect(component.selectedRows.size).toBe(4); // All 4 rows selected

      
      component.toggleAllRows();
      expect(component.selectedRows.has(3)).toBe(false);
      expect(component.selectedRows.has(4)).toBe(false);
      
      expect(component.selectedRows.has(1)).toBe(true);
      expect(component.selectedRows.has(2)).toBe(true);
      expect(component.selectedRows.size).toBe(2);
    });


  });

  describe('Verify Functionality', () => {




    it('should reload data after successful verification', fakeAsync(() => {
      const verifyResponse: VerifyInterdictionResponse = {
        success: true,
        verifiedCount: 1,
        errors: [],
        verifiedAuditKeys: [1],
        failedAuditKeys: []
      };

      service.verifyInterdictions.and.returnValue(of(verifyResponse));
      component.selectedRows.add(1);

      const loadSpy = spyOn(component, 'loadTableData');
      component.onVerify();
      tick();

      expect(loadSpy).toHaveBeenCalled();
      expect(component.selectedRows.size).toBe(0);
    }));

    it('should handle verification error', fakeAsync(() => {
      service.verifyInterdictions.and.returnValue(
        throwError(() => new Error('Verification error'))
      );
      component.selectedRows.add(1);

      component.onVerify();
      tick();

      expect(component.isVerifying).toBe(false);
    }));




  });

  describe('Cleanup', () => {




    it('should not throw error if overlay does not exist on destroy', () => {
      component['overlayRef'] = null;
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });
  describe('Filter Options Extraction', () => {
    it('should extract unique cue options correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const cueOptions = component.uniqueCueOptions;
      expect(cueOptions.length).toBeGreaterThan(0);

      const firstOption = cueOptions[0];
      expect(firstOption.code).toBeDefined();
      expect(firstOption.display).toBeDefined();
    }));

    it('should extract unique type options correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const typeOptions = component.uniqueTypeOptions;
      expect(typeOptions.length).toBeGreaterThan(0);
      expect(typeOptions.find(o => o.code === 'B')).toBeDefined();
    }));
  });
});
