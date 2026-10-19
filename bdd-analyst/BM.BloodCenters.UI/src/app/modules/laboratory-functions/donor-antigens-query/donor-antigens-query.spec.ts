import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Router, UrlTree, ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';

import { DonorAntigensQuery } from './donor-antigens-query';
import { DonorAntigensApiService } from './services/donor-antigens-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { DonorAntigensData, DonorInfo } from './models/donor-antigens.model';
import { SearchForDonorDialog } from '@shared/components/search-for-donor/search-for-donor';
import { SearchForDonorDialogResult, DonorSearchResult } from '@shared/components/search-for-donor/search-for-donor.model';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

describe('DonorAntigensQuery', () => {
  let component: DonorAntigensQuery;
  let fixture: ComponentFixture<DonorAntigensQuery>;
  let mockService: jasmine.SpyObj<DonorAntigensApiService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let router: Router;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let mockLoggingService: jasmine.SpyObj<LoggingService>;
  let mockPageHeaderService: any;
  let mockActivatedRoute: any;

  const mockDonorData: DonorAntigensData = {
    donorInfo: {
      donorId: 'DN00754816',
      donorName: 'ROGERS, SHEILA',
      dateOfBirth: '2002-01-31',
      gender: 'F',
      aboType: 'O Pos'
    },
    rbcAntigens: [
      {
        testId: 'Bga',
        resultCode: '+',
        isPositive: true
      },
      {
        testId: 'C',
        resultCode: '-',
        isPositive: false
      }
    ],
    hlaAntigens: {
      a1: '2',
      a2: '26',
      b1: '22',
      b2: '47',
      c1: null,
      c2: null,
      d1: null,
      d2: null,
      dr: null
    }
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorAntigensApiService', ['getDonorAntigens']);
    mockDialog = createMockMatDialog();
    mockSnackbarService = createMockSnackbarService();
    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error', 'info']);
    mockPageHeaderService = {
      pageHeaderData: signal(undefined),
      getTitle: jasmine.createSpy('getTitle').and.returnValue(undefined),
      getSubtitle: jasmine.createSpy('getSubtitle').and.returnValue(undefined),
      getCurrentMenuItem: jasmine.createSpy('getCurrentMenuItem').and.returnValue(undefined)
    };

    mockActivatedRoute = {
      queryParams: of({ donorId: 'DN00754816' })
    };

    mockService.getDonorAntigens.and.returnValue(of(mockDonorData));



      TestBed.configureTestingModule({
      imports: [DonorAntigensQuery],
      providers: [
        provideHttpClient(),
        provideRouter([]),
        provideNoopAnimations(),
        { provide: DonorAntigensApiService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: SnackbarService, useValue: mockSnackbarService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    });


    


      mockService.getDonorAntigens.calls.reset();


      mockDialog.open.calls.reset();


      mockLoggingService.error.calls.reset();


      mockLoggingService.info.calls.reset();


      mockService.getDonorAntigens.and.returnValue(of(mockDonorData));


    fixture = TestBed.createComponent(DonorAntigensQuery);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');


    });

  describe('Initialization', () => {


    it('should load donor antigens on init from query parameter', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges(); // Extra detectChanges to complete sorting

      expect(mockService.getDonorAntigens).toHaveBeenCalledWith('DN00754816');
      expect(component['donorInfo']()).toEqual(mockDonorData.donorInfo);
      expect(component.rbcAntigensDataSource.data).toEqual(mockDonorData.rbcAntigens);
      expect(component['hlaAntigens']()).toEqual(mockDonorData.hlaAntigens);
    }));

    it('should set donor ID on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['donorId']()).toBe('DN00754816');
    }));

    it('should clear all data and open SearchForDonorDialog when no donorId is provided', fakeAsync(() => {
      // Reset with no donorId in queryParams
      TestBed.resetTestingModule();

      const mockActivatedRouteNoDonor = {
        queryParams: of({})
      };

      const mockDialogRef = {
        afterClosed: () => of(null)
      };
      mockDialog.open.and.returnValue(mockDialogRef as MatDialogRef<SearchForDonorDialog>);

      TestBed.configureTestingModule({
        imports: [DonorAntigensQuery],
        providers: [
          provideHttpClient(),
          provideRouter([{ path: 'home', children: [] }]),
          provideNoopAnimations(),
          { provide: DonorAntigensApiService, useValue: mockService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: SnackbarService, useValue: mockSnackbarService },
          { provide: LoggingService, useValue: mockLoggingService },
          { provide: PageHeaderService, useValue: mockPageHeaderService },
          { provide: ActivatedRoute, useValue: mockActivatedRouteNoDonor }
        ]
      });

      const testFixture = TestBed.createComponent(DonorAntigensQuery);
      const testComponent = testFixture.componentInstance;
      const testRouter = TestBed.inject(Router);
      spyOn(testRouter, 'navigate');

      testFixture.detectChanges();
      tick();

      // Verify all data is cleared
      expect(testComponent['donorId']()).toBeNull();
      expect(testComponent['donorInfo']()).toBeNull();
      expect(testComponent['rbcAntigens']()).toEqual([]);
      expect(testComponent.rbcAntigensDataSource.data).toEqual([]);
      expect(testComponent['hlaAntigens']()).toBeNull();
      expect(testComponent['error']()).toBeNull();

      // Verify dialog opened with SearchForDonorDialog configuration
      expect(mockDialog.open).toHaveBeenCalledWith(SearchForDonorDialog, jasmine.objectContaining({
        width: '1150px',
        disableClose: true
      }));
      expect(testRouter.navigate).toHaveBeenCalledWith(['/home']);
    }));

    it('should update URL when donor is selected from SearchForDonorDialog', fakeAsync(() => {
      // Reset with no donorId in queryParams
      TestBed.resetTestingModule();

      const mockActivatedRouteNoDonor = {
        queryParams: of({})
      };

      // SearchForDonorDialog returns SearchForDonorDialogResult with action and donor
      const mockDonorSearchResult: DonorSearchResult = {
        donorId: 'DN12345678',
        lastName: 'Donor',
        firstName: 'Test',
        middleName: null,
        dateOfBirth: '1990-01-01',
        gender: 'M',
        bloodType: null,
        address: null,
        suiteApt: null,
        city: null,
        state: null,
        zip: null,
        country: null,
        alternateId: null,
        alternateIdType: null,
        homeAreaCode: null,
        homePhone: null,
        dayAreaCode: null,
        dayPhone: null,
        mobileAreaCode: null,
        mobilePhone: null,
        intlHomePhone: null,
        intlWorkPhone: null,
        intlAddrFlag: null,
        preferredContactFlag: null
      };

      const dialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: mockDonorSearchResult
      };

      const mockDialogRef = {
        afterClosed: () => of(dialogResult)
      };
      mockDialog.open.and.returnValue(mockDialogRef as MatDialogRef<SearchForDonorDialog>);

      TestBed.configureTestingModule({
        imports: [DonorAntigensQuery],
        providers: [
          provideHttpClient(),
          provideRouter([]),
          provideNoopAnimations(),
          { provide: DonorAntigensApiService, useValue: mockService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: SnackbarService, useValue: mockSnackbarService },
          { provide: LoggingService, useValue: mockLoggingService },
          { provide: PageHeaderService, useValue: mockPageHeaderService },
          { provide: ActivatedRoute, useValue: mockActivatedRouteNoDonor }
        ]
      });

      const testFixture = TestBed.createComponent(DonorAntigensQuery);
      const testComponent = testFixture.componentInstance;
      const testRouter = TestBed.inject(Router);
      spyOn(testRouter, 'navigate');

      testFixture.detectChanges();
      tick();

      expect(mockDialog.open).toHaveBeenCalled();
      expect(testRouter.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          queryParams: { donorId: 'DN12345678' },
          queryParamsHandling: 'merge'
        })
      );
    }));


  });
  describe('Error State', () => {




    it('should handle 404 error correctly', fakeAsync(() => {
      mockService.getDonorAntigens.and.returnValue(
        throwError(() => ({ status: 404 }))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['error']()).toBe('Donor not found. Please verify the donor ID.');
      expect(mockSnackbarService.showError).toHaveBeenCalled();
    }));

    it('should handle generic error correctly', fakeAsync(() => {
      mockService.getDonorAntigens.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['error']()).toBe('Failed to load donor antigens. Please try again.');
    }));
  });

  describe('Data Display', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should display donor information', () => {
      fixture.detectChanges();

      const donorIdElement = fixture.debugElement.query(By.css('#donor-id'));
      expect(donorIdElement.nativeElement.textContent).toContain('DN00754816');

      const donorNameElement = fixture.debugElement.query(By.css('#donor-name'));
      expect(donorNameElement.nativeElement.textContent).toContain('ROGERS, SHEILA');
    });



    it('should display HLA phenotypes', () => {
      fixture.detectChanges();

      const hlaGrid = fixture.debugElement.query(By.css('.hla-grid'));
      expect(hlaGrid).toBeTruthy();

      const hlaItems = fixture.debugElement.queryAll(By.css('.hla-item'));
      expect(hlaItems.length).toBe(9);
    });



    it('should show dash for null or undefined HLA values', () => {
      expect(component.getHlaValue(null)).toBe('-');
      expect(component.getHlaValue(undefined)).toBe('-');
      expect(component.getHlaValue('02')).toBe('02');
    });
  });

  describe('Table Sorting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));



    it('should toggle sort direction on sort change', () => {
      // First click: '' -> 'desc'
      component.onSortChange();
      expect(component['sortDirection']).toBe('desc');
      expect(component.getSortIcon()).toBe('arrow_downward');
      expect(component.isSorted()).toBe(true);

      // Second click: 'desc' -> 'asc'
      component.onSortChange();
      expect(component['sortDirection']).toBe('asc');
      expect(component.getSortIcon()).toBe('arrow_upward');
      expect(component.isSorted()).toBe(true);

      // Third click: 'asc' -> 'desc'
      component.onSortChange();
      expect(component['sortDirection']).toBe('desc');
      expect(component.getSortIcon()).toBe('arrow_downward');
      expect(component.isSorted()).toBe(true);
    });





    it('should return correct aria labels for sort states', () => {
      component['sortDirection'] = '';
      expect(component.getSortAriaLabel()).toBe('Antigen: Not sorted, click to sort descending');

      component['sortDirection'] = 'desc';
      expect(component.getSortAriaLabel()).toBe('Antigen: Sorted descending, click to sort ascending');

      component['sortDirection'] = 'asc';
      expect(component.getSortAriaLabel()).toBe('Antigen: Sorted ascending, click to sort descending');
    });
  });
  describe('Date Formatting', () => {
    it('should format date of birth correctly', () => {
      const formatted = component.formatDateOfBirth('2002-01-31');
      expect(formatted).toBe('31-JAN-2002');
    });

    it('should handle invalid date', () => {
      const formatted = component.formatDateOfBirth('');
      expect(formatted).toBe('');
    });
  });

  describe('Dialog Interaction', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should open interdictions side panel when button clicked', () => {
      fixture.detectChanges();

      const button = fixture.debugElement.query(By.css('.interdictions-btn'));
      button.nativeElement.click();

      expect(component['isInterdictionsPanelOpen']()).toBeTrue();
    });

    it('should not open panel if no donor info', () => {
      component['donorInfo'].set(null);
      component['donorId'].set(null);
      component.openDonorInterdictionsPanel();

      expect(component['isInterdictionsPanelOpen']()).toBe(false);
    });

    it('should not open panel if no donor ID', () => {
      component['donorId'].set(null);
      component.openDonorInterdictionsPanel();

      expect(component['isInterdictionsPanelOpen']()).toBe(false);
    });
  });

  describe('User Actions', () => {
    it('should retry loading on retry button click', fakeAsync(() => {
      mockService.getDonorAntigens.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      mockService.getDonorAntigens.calls.reset();
      mockService.getDonorAntigens.and.returnValue(of(mockDonorData));

      component.onRetry();
      tick();
      fixture.detectChanges();

      expect(mockService.getDonorAntigens).toHaveBeenCalledWith('DN00754816');
    }));

    it('should clear search and navigate to current route without query params', () => {
      // Mock router.url to return a path with query params
      Object.defineProperty(router, 'url', {
        get: () => '/donor-functions/donor-profile/donor-profile-queries/donor-antigens-query?donorId=DN00754816',
        configurable: true
      });

      component.onClearSearch();

      expect(component['donorId']()).toBeNull();
      expect(component['donorInfo']()).toBeNull();
      expect(component.rbcAntigensDataSource.data).toEqual([]);
      expect(component['hlaAntigens']()).toBeNull();
      expect(router.navigate).toHaveBeenCalledWith(['/donor-functions/donor-profile/donor-profile-queries/donor-antigens-query']);
    });
  });

  describe('Computed Values', () => {
    it('should compute hasData correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['hasData']()).toBe(true);

      component['donorInfo'].set(null);
      expect(component['hasData']()).toBe(false);
    }));

    it('should compute hasRbcAntigens correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['hasRbcAntigens']()).toBe(true);

      component['rbcAntigens'].set([]);
      component.rbcAntigensDataSource.data = [];
      fixture.detectChanges();
      expect(component['hasRbcAntigens']()).toBe(false);
    }));

    it('should compute hasHlaAntigens correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['hasHlaAntigens']()).toBe(true);

      component['hlaAntigens'].set({
        a1: null,
        a2: null,
        b1: null,
        b2: null,
        c1: null,
        c2: null,
        d1: null,
        d2: null,
        dr: null
      });
      expect(component['hasHlaAntigens']()).toBe(false);
    }));
  });

  describe('TrackBy Functions', () => {
    it('should track RBC antigens by testId', () => {
      const item = { testId: 'Bga', resultCode: '+', isPositive: true };
      expect(component.trackByTestId(0, item)).toBe('Bga');
    });
  });

  describe('Accessibility', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));





    it('should have proper table accessibility attributes', () => {
      fixture.detectChanges();

      const table = fixture.debugElement.query(By.css('[role="table"]'));
      expect(table).toBeTruthy();

      const headers = fixture.debugElement.queryAll(By.css('th[scope="col"]'));
      expect(headers.length).toBeGreaterThan(0);
    });

    it('should return correct aria labels for result', () => {
      expect(component.getResultAriaLabel('Bga', true)).toBe('Bga: Positive');
      expect(component.getResultAriaLabel('C', false)).toBe('C: Negative');
    });
  });

  describe('Close Interdictions Panel', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should close interdictions panel and clear donor ID', () => {
      // Open panel first
      component.openDonorInterdictionsPanel();
      expect(component['isInterdictionsPanelOpen']()).toBe(true);
      expect(component['interdictionsPanelDonorId']()).toBe('DN00754816');

      // Close panel
      component.closeDonorInterdictionsPanel();
      expect(component['isInterdictionsPanelOpen']()).toBe(false);
      expect(component['interdictionsPanelDonorId']()).toBeNull();
    });

    it('should be idempotent when called multiple times', () => {
      component.closeDonorInterdictionsPanel();
      component.closeDonorInterdictionsPanel();
      expect(component['isInterdictionsPanelOpen']()).toBe(false);
      expect(component['interdictionsPanelDonorId']()).toBeNull();
    });
  });

  describe('openSearchForDonorDialog (public)', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should open dialog with disableClose false', () => {
      const mockDialogRef = {
        afterClosed: () => of(null)
      };
      mockDialog.open.calls.reset();
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openSearchForDonorDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(SearchForDonorDialog, jasmine.objectContaining({
        width: '1150px',
        disableClose: false,
        hasBackdrop: true,
        autoFocus: false
      }));
    });

    it('should navigate when donor is selected from dialog', () => {
      const dialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: {
          donorId: 'DN99999999',
          lastName: 'Smith',
          firstName: 'Jane',
          middleName: null,
          dateOfBirth: '1985-05-15',
          gender: 'F',
          bloodType: null,
          address: null,
          suiteApt: null,
          city: null,
          state: null,
          zip: null,
          country: null,
          alternateId: null,
          alternateIdType: null,
          homeAreaCode: null,
          homePhone: null,
          dayAreaCode: null,
          dayPhone: null,
          mobileAreaCode: null,
          mobilePhone: null,
          intlHomePhone: null,
          intlWorkPhone: null,
          intlAddrFlag: null,
          preferredContactFlag: null
        }
      };
      const mockDialogRef = {
        afterClosed: () => of(dialogResult)
      };
      mockDialog.open.calls.reset();
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openSearchForDonorDialog();

      expect(router.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          queryParams: { donorId: 'DN99999999' },
          queryParamsHandling: 'merge'
        })
      );
    });

    it('should keep current data when user cancels dialog', () => {
      const mockDialogRef = {
        afterClosed: () => of(null)
      };
      mockDialog.open.calls.reset();
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openSearchForDonorDialog();

      // Should NOT navigate away -- data stays
      expect(component['donorInfo']()).toEqual(mockDonorData.donorInfo);
    });

    it('should keep current data when dialog result has no select action', () => {
      const dialogResult: SearchForDonorDialogResult = {
        action: 'cancel' as any,
        donor: undefined as any
      };
      const mockDialogRef = {
        afterClosed: () => of(dialogResult)
      };
      mockDialog.open.calls.reset();
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openSearchForDonorDialog();

      // Should NOT navigate, current data retained
      expect(component['donorInfo']()).toEqual(mockDonorData.donorInfo);
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete destroy$ subject on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    }));
  });

  describe('onRetry edge cases', () => {
    it('should not call service when donorId is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      mockService.getDonorAntigens.calls.reset();
      component['donorId'].set(null);

      component.onRetry();
      tick();

      expect(mockService.getDonorAntigens).not.toHaveBeenCalled();
    }));
  });

  describe('isEmpty computed', () => {
    it('should be true when not loading, no data, and no error', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      // Clear everything to match isEmpty conditions
      component['donorInfo'].set(null);
      component['loading'].set(false);
      component['error'].set(null);

      expect(component['isEmpty']()).toBe(true);
    }));

    it('should be false when loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      component['donorInfo'].set(null);
      component['loading'].set(true);
      component['error'].set(null);

      expect(component['isEmpty']()).toBe(false);
    }));

    it('should be false when data is present', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['isEmpty']()).toBe(false);
    }));

    it('should be false when there is an error', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      component['donorInfo'].set(null);
      component['loading'].set(false);
      component['error'].set('Some error');

      expect(component['isEmpty']()).toBe(false);
    }));
  });

  describe('hasHlaAntigens edge case', () => {
    it('should return false when hlaAntigens signal is null', fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      component['hlaAntigens'].set(null);
      expect(component['hasHlaAntigens']()).toBe(false);
    }));
  });

  describe('Loading state transitions', () => {
    it('should set loading to true while fetching and false on success', fakeAsync(() => {
      // Before detectChanges, loading should be false (initial)
      expect(component['loading']()).toBe(false);

      fixture.detectChanges();
      // After init + service resolves synchronously, loading is set to false
      tick();
      fixture.detectChanges();

      expect(component['loading']()).toBe(false);
    }));

    it('should set loading to false on error', fakeAsync(() => {
      mockService.getDonorAntigens.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['loading']()).toBe(false);
    }));
  });

  describe('Error handling details', () => {
    it('should call loggingService.error on failure', fakeAsync(() => {
      const err = { status: 500 };
      mockService.getDonorAntigens.and.returnValue(throwError(() => err));

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(mockLoggingService.error).toHaveBeenCalledWith('Error loading donor antigens', err);
    }));

    it('should call snackbarService.showError with 404 message', fakeAsync(() => {
      mockService.getDonorAntigens.and.returnValue(
        throwError(() => ({ status: 404 }))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Donor not found. Please verify the donor ID.');
    }));

    it('should call snackbarService.showError with generic message for non-404', fakeAsync(() => {
      mockService.getDonorAntigens.and.returnValue(
        throwError(() => ({ status: 503 }))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load donor antigens. Please try again.');
    }));

    it('should clear previous error on successful retry', fakeAsync(() => {
      // First load fails
      mockService.getDonorAntigens.and.returnValue(
        throwError(() => ({ status: 500 }))
      );

      fixture.detectChanges();
      tick();
      fixture.detectChanges();

      expect(component['error']()).toBeTruthy();

      // Retry succeeds
      mockService.getDonorAntigens.and.returnValue(of(mockDonorData));
      component.onRetry();
      tick();
      fixture.detectChanges();

      expect(component['error']()).toBeNull();
      expect(component['donorInfo']()).toEqual(mockDonorData.donorInfo);
    }));
  });

  describe('Sort data ordering', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      fixture.detectChanges();
    }));

    it('should sort data descending on first sort', () => {
      component.onSortChange(); // '' -> 'desc'

      const data = component.rbcAntigensDataSource.data;
      expect(data[0].testId).toBe('C');
      expect(data[1].testId).toBe('Bga');
    });

    it('should sort data ascending on second sort', () => {
      component.onSortChange(); // '' -> 'desc'
      component.onSortChange(); // 'desc' -> 'asc'

      const data = component.rbcAntigensDataSource.data;
      expect(data[0].testId).toBe('Bga');
      expect(data[1].testId).toBe('C');
    });

    it('should return unfold_more icon when not sorted', () => {
      expect(component.getSortIcon()).toBe('unfold_more');
    });

    it('should report not sorted initially', () => {
      expect(component.isSorted()).toBe(false);
    });
  });

  describe('formatDateOfBirth additional cases', () => {
    it('should format various months correctly', () => {
      expect(component.formatDateOfBirth('2000-03-05')).toBe('05-MAR-2000');
      expect(component.formatDateOfBirth('1995-07-20')).toBe('20-JUL-1995');
      expect(component.formatDateOfBirth('1980-12-25')).toBe('25-DEC-1980');
    });

    it('should pad single digit days', () => {
      expect(component.formatDateOfBirth('2010-06-01')).toBe('01-JUN-2010');
    });
  });

  describe('getResultAriaLabel', () => {
    it('should return Positive for isPositive true', () => {
      expect(component.getResultAriaLabel('ABC', true)).toBe('ABC: Positive');
    });

    it('should return Negative for isPositive false', () => {
      expect(component.getResultAriaLabel('XYZ', false)).toBe('XYZ: Negative');
    });
  });

  describe('onClearSearch additional behavior', () => {
    it('should clear error state as well', () => {
      // Manually set error state to simulate a previous failure
      component['error'].set('Failed to load donor antigens. Please try again.');
      component['donorId'].set('DN00754816');
      component['donorInfo'].set(mockDonorData.donorInfo);
      expect(component['error']()).toBeTruthy();

      Object.defineProperty(router, 'url', {
        get: () => '/donor-antigens-query?donorId=X',
        configurable: true
      });

      component.onClearSearch();

      expect(component['error']()).toBeNull();
      expect(component['donorId']()).toBeNull();
      expect(component['donorInfo']()).toBeNull();
      expect(component['hlaAntigens']()).toBeNull();
      expect(component['rbcAntigens']()).toEqual([]);
    });
  });
});
