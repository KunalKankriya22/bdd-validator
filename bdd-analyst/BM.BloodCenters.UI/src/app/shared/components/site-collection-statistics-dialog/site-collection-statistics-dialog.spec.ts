import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { SiteCollectionStatisticsDialog } from './site-collection-statistics-dialog';
import { SiteCollectionStatisticsService } from '@shared/services/site-collection-statistics.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import {
  SiteStatisticsDto,
  DonationBreakdownDto,
  UnitDetailDto,
  SiteDropdownDto,
} from '@shared/models/site-collection-statistics.model';

describe('SiteCollectionStatisticsDialog', () => {
  let component: any;
  let fixture: ComponentFixture<SiteCollectionStatisticsDialog>;
  let siteStatisticsServiceSpy: jasmine.SpyObj<SiteCollectionStatisticsService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackbarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<SiteCollectionStatisticsDialog>>;

  const mockSites: SiteDropdownDto[] = [
    { siteId: 'SITE001', locationName: 'Downtown Blood Center' },
    { siteId: 'SITE002', locationName: 'Uptown Clinic' },
  ];

  const mockSiteStatistics: SiteStatisticsDto[] = [
    {
      siteId: 'SITE001',
      locationName: 'Downtown Blood Center',
      collectionDate: '2024-01-15T00:00:00Z',
      actualDraws: 45,
      actualDeferrals: 5,
    },
    {
      siteId: 'SITE001',
      locationName: 'Downtown Blood Center',
      collectionDate: '2024-01-16T00:00:00Z',
      actualDraws: 30,
      actualDeferrals: 3,
    },
  ];

  const mockDonationBreakdown: DonationBreakdownDto[] = [
    { donationType: 'WB', procedureCode: '450', count: 30 },
    { donationType: 'AP', procedureCode: 'PLT', count: 15 },
  ];

  const mockUnitDetails: UnitDetailDto[] = [
    {
      unitId: 'DIN1234567890123',
      displayUnitId: 'DIN123456789012345',
      collectionDate: '2024-01-15T00:00:00Z',
      donationType: 'WB',
      procedureCode: '450',
      attributes: {
        difficultStick: 'Y',
        doubleStick: null,
        od: null,
        qns: 'Y',
        nb: null,
        nuc: null,
        rbcsNotReturned: null,
        qnsLessThan175: null,
      },
    },
  ];

  beforeEach(() => {
    siteStatisticsServiceSpy = jasmine.createSpyObj('SiteCollectionStatisticsService', [
      'getSites',
      'getSiteStatistics',
      'getDonationBreakdown',
      'getUnitDetails',
      'getGoals',
    ]);

    snackbarServiceSpy = createMockSnackbarService();

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    siteStatisticsServiceSpy.getSites.and.returnValue(of(mockSites));
    siteStatisticsServiceSpy.getSiteStatistics.and.returnValue(
      of({
        data: mockSiteStatistics,
        totalActualDraws: 75,
        totalActualDeferrals: 8,
      })
    );
    siteStatisticsServiceSpy.getDonationBreakdown.and.returnValue(of(mockDonationBreakdown));
    siteStatisticsServiceSpy.getUnitDetails.and.returnValue(of(mockUnitDetails));

    TestBed.configureTestingModule({
      imports: [SiteCollectionStatisticsDialog, NoopAnimationsModule],
      providers: [
        { provide: SiteCollectionStatisticsService, useValue: siteStatisticsServiceSpy },
        { provide: SnackbarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: null },
      ],
    });

    siteStatisticsServiceSpy.getSites.calls.reset();
    siteStatisticsServiceSpy.getSiteStatistics.calls.reset();
    siteStatisticsServiceSpy.getDonationBreakdown.calls.reset();
    siteStatisticsServiceSpy.getUnitDetails.calls.reset();
    siteStatisticsServiceSpy.getGoals.calls.reset();
    dialogRefSpy.close.calls.reset();
    siteStatisticsServiceSpy.getSites.and.returnValue(of(mockSites));
    siteStatisticsServiceSpy.getDonationBreakdown.and.returnValue(of(mockDonationBreakdown));
    siteStatisticsServiceSpy.getUnitDetails.and.returnValue(of(mockUnitDetails));

    fixture = TestBed.createComponent(SiteCollectionStatisticsDialog);
    component = fixture.componentInstance;
  });

  describe('Initialization', () => {
    it('should load sites on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(siteStatisticsServiceSpy.getSites).toHaveBeenCalled();
      expect(component.sites().length).toBe(2);
      expect(component.sites()[0].siteId).toBe('SITE001');
    }));

    it('should initialize with dialog data if provided', () => {
      const dialogData = {
        siteId: 'SITE001',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [SiteCollectionStatisticsDialog, NoopAnimationsModule],
        providers: [
          { provide: SiteCollectionStatisticsService, useValue: siteStatisticsServiceSpy },
          { provide: SnackbarService, useValue: snackbarServiceSpy },
          { provide: MatDialogRef, useValue: dialogRefSpy },
          { provide: MAT_DIALOG_DATA, useValue: dialogData },
        ],
      });

      const newFixture = TestBed.createComponent(SiteCollectionStatisticsDialog);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.filterForm.get('siteId')?.value).toBe('SITE001');
      expect(newComponent.filterForm.get('fromDate')?.value).toBeTruthy();
      expect(newComponent.filterForm.get('toDate')?.value).toBeTruthy();
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should require From Date', () => {
      const fromDateControl = component.filterForm.get('fromDate');
      expect(fromDateControl?.hasError('required')).toBeTrue();
    });

    it('should require To Date', () => {
      const toDateControl = component.filterForm.get('toDate');
      expect(toDateControl?.hasError('required')).toBeTrue();
    });

    it('should allow optional siteId', () => {
      component.filterForm.patchValue({
        siteId: null,
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });

      expect(component.filterForm.valid).toBeTrue();
    });
  });

  describe('Retrieve Data', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should retrieve statistics when form is valid', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });

      component.onRetrieve();
      tick();

      expect(siteStatisticsServiceSpy.getSiteStatistics).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        siteId: undefined,
      });

      expect(component.siteStatistics().length).toBe(2);
      expect(component.totalActualDraws()).toBe(75);
      expect(component.totalActualDeferrals()).toBe(8);
    }));

    it('should include siteId when selected', fakeAsync(() => {
      component.filterForm.patchValue({
        siteId: 'SITE001',
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });

      component.onRetrieve();
      tick();

      expect(siteStatisticsServiceSpy.getSiteStatistics).toHaveBeenCalledWith({
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        siteId: 'SITE001',
      });
    }));

    it('should not retrieve when end date is before start date (form-level validation)', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-31'),
        toDate: moment('2024-01-01'),
      });

      component.onRetrieve();

      expect(component.filterForm.hasError('dateRangeInvalid')).toBeTrue();
      expect(siteStatisticsServiceSpy.getSiteStatistics).not.toHaveBeenCalled();
    });
  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reset form, clear all data, and re-enable form', () => {
      component.filterForm.patchValue({
        siteId: 'SITE001',
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });
      component.siteStatistics.set(mockSiteStatistics);
      component.totalActualDraws.set(75);
      component.submitted = true;

      component.onClearAll();

      expect(component.filterForm.get('siteId')?.value).toBe('');
      expect(component.filterForm.get('fromDate')?.value).toBeNull();
      expect(component.filterForm.get('toDate')?.value).toBeNull();
      expect(component.submitted).toBeFalse();
      expect(component.siteStatistics().length).toBe(0);
      expect(component.totalActualDraws()).toBe(0);
    });
  });

  describe('Site Row Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.siteStatistics.set(mockSiteStatistics);
    });

    it('should select row and load donation breakdown', fakeAsync(() => {
      component.onSiteRowClick(mockSiteStatistics[0]);
      tick();

      expect(component.selectedSiteRow()).toEqual(mockSiteStatistics[0]);
      expect(siteStatisticsServiceSpy.getDonationBreakdown).toHaveBeenCalledWith({
        siteId: 'SITE001',
        collectionDate: '2024-01-15',
      });
      expect(component.donationBreakdown().length).toBe(2);
    }));

    it('should reload units when selecting a new row while units tab is active', fakeAsync(() => {
      component.activeTab.set('units');
      component.unitDetails.set(mockUnitDetails);

      component.onSiteRowClick(mockSiteStatistics[1]);
      tick();

      expect(component.unitDetails.set).toBeTruthy();
      expect(siteStatisticsServiceSpy.getUnitDetails).toHaveBeenCalledWith({
        siteId: 'SITE001',
        collectionDate: '2024-01-16',
        donationType: undefined,
        procedureCode: undefined,
      });
    }));

    it('should identify selected row correctly', () => {
      component.selectedSiteRow.set(mockSiteStatistics[0]);

      expect(component.isRowSelected(mockSiteStatistics[0])).toBeTrue();
      expect(component.isRowSelected(mockSiteStatistics[1])).toBeFalse();
    });

    it('should update filter siteId when row is clicked', fakeAsync(() => {
      component.onSiteRowClick(mockSiteStatistics[0]);
      tick();

      expect(component.filterForm.get('siteId')?.value).toBe('SITE001');
    }));

    it('should update filter siteId even when form is disabled', fakeAsync(() => {
      component.filterForm.disable();

      component.onSiteRowClick(mockSiteStatistics[0]);
      tick();

      expect(component.filterForm.get('siteId')?.value).toBe('SITE001');
      expect(component.filterForm.get('siteId')?.disabled).toBeTrue();
    }));

    it('should handle breakdown load error', fakeAsync(() => {
      siteStatisticsServiceSpy.getDonationBreakdown.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.onSiteRowClick(mockSiteStatistics[0]);
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load donation breakdown');
    }));
  });

  describe('Show/Hide Units Toggle', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.siteStatistics.set(mockSiteStatistics);
    });

    it('should show full units view and load unit details', fakeAsync(() => {
      component.selectedSiteRow.set(mockSiteStatistics[0]);

      component.onToggleUnits();
      tick();

      expect(component.showFullUnits()).toBeTrue();
      expect(siteStatisticsServiceSpy.getUnitDetails).toHaveBeenCalledWith({
        siteId: 'SITE001',
        collectionDate: '2024-01-15',
        donationType: undefined,
        procedureCode: undefined,
      });
      expect(component.unitDetails().length).toBe(1);
    }));

    it('should hide units when toggled again', fakeAsync(() => {
      component.selectedSiteRow.set(mockSiteStatistics[0]);
      component.showFullUnits.set(true);

      component.onToggleUnits();

      expect(component.showFullUnits()).toBeFalse();
      expect(siteStatisticsServiceSpy.getUnitDetails).not.toHaveBeenCalled();
    }));

    it('should filter units by selected breakdown row', fakeAsync(() => {
      component.selectedSiteRow.set(mockSiteStatistics[0]);
      component.selectedBreakdownRow.set(mockDonationBreakdown[0]);

      component.onToggleUnits();
      tick();

      expect(siteStatisticsServiceSpy.getUnitDetails).toHaveBeenCalledWith({
        siteId: 'SITE001',
        collectionDate: '2024-01-15',
        donationType: 'WB',
        procedureCode: '450',
      });
    }));

    it('should handle unit details load error', fakeAsync(() => {
      siteStatisticsServiceSpy.getUnitDetails.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.selectedSiteRow.set(mockSiteStatistics[0]);
      component.onToggleUnits();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load unit details');
    }));
  });

  describe('Tab Navigation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should load unit details when switching to units tab with a selected row', fakeAsync(() => {
      component.selectedSiteRow.set(mockSiteStatistics[0]);
      component.unitDetails.set([]);

      component.onTabChange('units');
      tick();

      expect(siteStatisticsServiceSpy.getUnitDetails).toHaveBeenCalledWith({
        siteId: 'SITE001',
        collectionDate: '2024-01-15',
        donationType: undefined,
        procedureCode: undefined,
      });
    }));

    it('should include breakdown filters when loading units via tab switch', fakeAsync(() => {
      component.selectedSiteRow.set(mockSiteStatistics[0]);
      component.selectedBreakdownRow.set(mockDonationBreakdown[0]);
      component.unitDetails.set([]);

      component.onTabChange('units');
      tick();

      expect(siteStatisticsServiceSpy.getUnitDetails).toHaveBeenCalledWith({
        siteId: 'SITE001',
        collectionDate: '2024-01-15',
        donationType: 'WB',
        procedureCode: '450',
      });
    }));
  });

  describe('Date Input Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set value to null and mark touched when input is cleared', () => {
      const control = component.filterForm.get('fromDate');
      control?.setValue(moment('2024-01-15'));

      const mockEvent = {
        target: { value: '' } as HTMLInputElement,
      } as unknown as Event;

      component.onDateInput(mockEvent, 'fromDate');

      expect(control?.value).toBeNull();
      expect(control?.touched).toBeTrue();
    });

    it('should not modify control when input has text', () => {
      const control = component.filterForm.get('fromDate');
      const original = control?.value;

      const mockEvent = {
        target: { value: '15-JAN-2024' } as HTMLInputElement,
      } as unknown as Event;

      component.onDateInput(mockEvent, 'fromDate');

      expect(control?.value).toBe(original);
    });

    it('should handle whitespace-only input as empty', () => {
      const control = component.filterForm.get('fromDate');
      control?.setValue(moment('2024-01-15'));

      const mockEvent = {
        target: { value: '   ' } as HTMLInputElement,
      } as unknown as Event;

      component.onDateInput(mockEvent, 'fromDate');

      expect(control?.value).toBeNull();
      expect(control?.touched).toBeTrue();
    });
  });

  describe('Clear Action', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all data and re-enable form', () => {
      component.selectedSiteRow.set(mockSiteStatistics[0]);
      component.donationBreakdown.set(mockDonationBreakdown);
      component.unitDetails.set(mockUnitDetails);
      component.showFullUnits.set(true);

      component.onClear();

      expect(component.selectedSiteRow()).toBeNull();
      expect(component.donationBreakdown().length).toBe(0);
      expect(component.unitDetails().length).toBe(0);
      expect(component.showFullUnits()).toBeFalse();
      expect(component.siteStatistics().length).toBe(0);
    });
  });

  describe('Zero Draws Row Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear breakdown and unit details when row has zero draws', () => {
      const zeroDrawRow: SiteStatisticsDto = {
        siteId: 'SITE001',
        locationName: 'Downtown Blood Center',
        collectionDate: '2024-01-15T00:00:00Z',
        actualDraws: 0,
        actualDeferrals: 5,
      };

      component.unitDetails.set(mockUnitDetails);

      component.onSiteRowClick(zeroDrawRow);

      expect(component.selectedSiteRow()).toEqual(zeroDrawRow);
      expect(component.donationBreakdown().length).toBe(0);
      expect(component.unitDetails().length).toBe(0);
      expect(siteStatisticsServiceSpy.getDonationBreakdown).not.toHaveBeenCalled();
    });
  });

  describe('Form Disable After Retrieve', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not disable form when no records found', fakeAsync(() => {
      siteStatisticsServiceSpy.getSiteStatistics.and.returnValue(
        of({ data: [], totalActualDraws: 0, totalActualDeferrals: 0 })
      );

      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });

      component.onRetrieve();
      tick();

      expect(component.filterForm.disabled).toBeFalse();
    }));

    it('should reset submitted flag on CLEAR ALL', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });
      component.onRetrieve();
      tick();

      expect(component.submitted).toBeTrue();

      component.onClearAll();

      expect(component.submitted).toBeFalse();
      expect(component.filterForm.enabled).toBeTrue();
    }));

    it('should re-enable form on CLEAR ALL', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });
      component.onRetrieve();
      tick();

      component.onClearAll();

      expect(component.filterForm.enabled).toBeTrue();
    }));
  });

  describe('Breakdown Row Selection', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should select breakdown row', () => {
      component.onBreakdownRowClick(mockDonationBreakdown[0]);

      expect(component.selectedBreakdownRow()).toEqual(mockDonationBreakdown[0]);
    });

    it('should clear breakdown row when site row changes', fakeAsync(() => {
      component.selectedBreakdownRow.set(mockDonationBreakdown[0]);

      component.onSiteRowClick(mockSiteStatistics[0]);
      tick();

      expect(component.selectedBreakdownRow()).toBeNull();
    }));
  });

  describe('Site Search Filter', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.sites.set(mockSites);
    });

    it('should return all sites when search is empty', () => {
      expect(component.filteredSites().length).toBe(2);
    });
  });

  describe('Site Dropdown Opened Change', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear search term when dropdown closes', () => {
      component.siteSearchCtrl.setValue('test');

      component.onSiteDropdownOpenedChange(false);

      expect(component.siteSearchCtrl.value).toBe('');
    });

    it('should not clear search term when dropdown opens', () => {
      component.siteSearchCtrl.setValue('test');

      component.onSiteDropdownOpenedChange(true);

      expect(component.siteSearchCtrl.value).toBe('test');
    });
  });

  describe('hasAnyFilterValue', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should be false when all filters are empty', () => {
      component.filterForm.patchValue({ siteId: '', fromDate: null, toDate: null });
      expect(component.hasAnyFilterValue()).toBeFalse();
    });

    it('should be true when siteId is set', () => {
      component.filterForm.patchValue({ siteId: 'SITE001' });
      expect(component.hasAnyFilterValue()).toBeTrue();
    });

    it('should be true when fromDate is set', () => {
      component.filterForm.patchValue({ fromDate: moment('2024-01-01') });
      expect(component.hasAnyFilterValue()).toBeTrue();
    });

    it('should be true when toDate is set', () => {
      component.filterForm.patchValue({ toDate: moment('2024-01-31') });
      expect(component.hasAnyFilterValue()).toBeTrue();
    });
  });

  describe('Date Error Messages', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return invalid when control has required error but raw input has text', () => {
      const control = component.filterForm.get('fromDate');
      control?.markAsTouched();
      component.fromDateInput = { nativeElement: { value: '02-02-02' } } as any;
      expect(component.getFromDateError()).toBe('From Date is invalid');
    });

    it('should show date range error under fromDate when fromDate was last modified', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-31'),
        toDate: moment('2024-01-01'),
      });
      component.filterForm.get('fromDate')?.markAsTouched();
      component.lastModifiedDateField.set('fromDate');
      expect(component.getFromDateError()).toBe('From Date cannot be after To Date');
    });

    it('should not show date range error under fromDate when toDate was last modified', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-31'),
        toDate: moment('2024-01-01'),
      });
      component.filterForm.get('fromDate')?.markAsTouched();
      component.lastModifiedDateField.set('toDate');
      expect(component.getFromDateError()).toBe('');
    });

    it('should show date range error under toDate when toDate was last modified', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-31'),
        toDate: moment('2024-01-01'),
      });
      component.filterForm.get('toDate')?.markAsTouched();
      component.lastModifiedDateField.set('toDate');
      expect(component.getToDateError()).toBe('To Date must be on or after From Date');
    });

    it('should not show date range error under toDate when fromDate was last modified', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-31'),
        toDate: moment('2024-01-01'),
      });
      component.filterForm.get('toDate')?.markAsTouched();
      component.lastModifiedDateField.set('fromDate');
      expect(component.getToDateError()).toBe('');
    });
  });

  describe('Retrieve Button and Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark all fields as touched when form is invalid on retrieve', () => {
      component.onRetrieve();

      expect(component.filterForm.get('fromDate')?.touched).toBeTrue();
      expect(component.filterForm.get('toDate')?.touched).toBeTrue();
    });

    it('should enable retrieve when both dates are valid', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });
      expect(component.filterForm.invalid).toBeFalse();
    });

    it('should disable retrieve when only siteId is set without dates', () => {
      component.filterForm.patchValue({ siteId: 'SITE001' });
      expect(component.filterForm.invalid).toBeTrue();
    });

    it('should disable retrieve when date range is invalid', () => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-31'),
        toDate: moment('2024-01-01'),
      });
      expect(component.filterForm.invalid).toBeTrue();
    });
  });

  describe('Last Modified Date Field Tracking', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should track fromDate as last modified when fromDate changes', () => {
      component.filterForm.get('fromDate')?.setValue(moment('2024-01-01'));
      expect(component.lastModifiedDateField()).toBe('fromDate');
    });

    it('should track toDate as last modified when toDate changes', () => {
      component.filterForm.get('toDate')?.setValue(moment('2024-01-31'));
      expect(component.lastModifiedDateField()).toBe('toDate');
    });

    it('should update tracking when switching between fields', () => {
      component.filterForm.get('fromDate')?.setValue(moment('2024-01-01'));
      expect(component.lastModifiedDateField()).toBe('fromDate');

      component.filterForm.get('toDate')?.setValue(moment('2024-01-31'));
      expect(component.lastModifiedDateField()).toBe('toDate');

      component.filterForm.get('fromDate')?.setValue(moment('2024-02-01'));
      expect(component.lastModifiedDateField()).toBe('fromDate');
    });

    it('should reset lastModifiedDateField on clear all', () => {
      component.filterForm.get('fromDate')?.setValue(moment('2024-01-01'));
      expect(component.lastModifiedDateField()).toBe('fromDate');

      component.onClearAll();
      expect(component.lastModifiedDateField()).toBeNull();
    });
  });

  describe('Helper Functions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should get selected site name from dropdown', () => {
      component.sites.set(mockSites);
      component.filterForm.patchValue({ siteId: 'SITE001' });

      expect(component.getFilterSiteName()).toBe('Downtown Blood Center');
    });

    it('should return empty string when no site selected and not submitted', () => {
      component.sites.set(mockSites);
      component.filterForm.patchValue({ siteId: '' });

      expect(component.getFilterSiteName()).toBe('');
    });

    it('should return ALL SITES when no site selected and submitted', () => {
      component.sites.set(mockSites);
      component.filterForm.patchValue({ siteId: '' });
      component.submitted = true;

      expect(component.getFilterSiteName()).toBe('ALL SITES');
    });

    it('should return empty string when site not found in list', () => {
      component.sites.set(mockSites);
      component.filterForm.patchValue({ siteId: 'UNKNOWN' });

      expect(component.getFilterSiteName()).toBe('');
    });

    it('should return form controls via f getter', () => {
      expect(component.f).toBe(component.filterForm.controls);
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should track loading sites state', () => {
      component.loadingSites.set(true);
      expect(component.loadingSites()).toBeTrue();
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should compute isEmpty correctly', () => {
      component.siteStatistics.set([]);
      expect(component.isEmpty()).toBeTrue();

      component.siteStatistics.set(mockSiteStatistics);
      expect(component.isEmpty()).toBeFalse();
    });

    it('should compute hasBreakdown correctly', () => {
      component.donationBreakdown.set([]);
      expect(component.hasBreakdown()).toBeFalse();

      component.donationBreakdown.set(mockDonationBreakdown);
      expect(component.hasBreakdown()).toBeTrue();
    });

    it('should compute hasUnits correctly', () => {
      component.unitDetails.set([]);
      expect(component.hasUnits()).toBeFalse();

      component.unitDetails.set(mockUnitDetails);
      expect(component.hasUnits()).toBeTrue();
    });

    it('should compute selectedSiteName correctly', () => {
      component.selectedSiteRow.set(null);
      expect(component.selectedSiteName()).toBe('');

      component.selectedSiteRow.set(mockSiteStatistics[0]);
      expect(component.selectedSiteName()).toBe('SITE001');
    });
  });

  describe('Close Dialog', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should close dialog when onClose is called', () => {
      component.onClose();

      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('Format Date', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format valid date as DD-MMM-YYYY uppercase', () => {
      expect(component.formatDate('2024-01-15T00:00:00Z')).toBe('15-JAN-2024');
    });

    it('should return empty string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('');
    });
  });

  describe('Format Venipuncture Attribute', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return Y for Y value', () => {
      expect(component.formatVeniAttribute('Y')).toBe('Y');
    });

    it('should return empty string for null', () => {
      expect(component.formatVeniAttribute(null)).toBe('');
    });

    it('should return empty string for non-Y value', () => {
      expect(component.formatVeniAttribute('N')).toBe('');
    });
  });

  describe('Track By Functions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should track site stats by siteId and collectionDate', () => {
      const result = component.trackBySiteStats(0, mockSiteStatistics[0]);
      expect(result).toBe('SITE001-2024-01-15T00:00:00Z');
    });

    it('should track breakdown by donationType and procedureCode', () => {
      const result = component.trackByBreakdown(0, mockDonationBreakdown[0]);
      expect(result).toBe('WB-450');
    });

    it('should track unit by unitId', () => {
      const result = component.trackByUnit(0, mockUnitDetails[0]);
      expect(result).toBe('DIN1234567890123');
    });

    it('should track deferral unit by index when unitId is null', () => {
      const deferralUnit: UnitDetailDto = {
        ...mockUnitDetails[0],
        unitId: null as any,
      };
      const result = component.trackByUnit(3, deferralUnit);
      expect(result).toBe('deferral-3');
    });
  });

  describe('Tooltip Overflow', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should disable tooltip when content does not overflow', () => {
      const mockElement = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;
      const mockTooltip = { disabled: false } as any;

      component.showTooltipIfOverflowing(mockElement, mockTooltip);

      expect(mockTooltip.disabled).toBeTrue();
    });

    it('should enable tooltip when content overflows', () => {
      const mockElement = { scrollWidth: 300, clientWidth: 200 } as HTMLElement;
      const mockTooltip = { disabled: true } as any;

      component.showTooltipIfOverflowing(mockElement, mockTooltip);

      expect(mockTooltip.disabled).toBeFalse();
    });
  });

  describe('Toggle Units Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show error when toggling units with no row selected', () => {
      component.selectedSiteRow.set(null);

      component.onToggleUnits();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Please select a site row first');
      expect(component.showFullUnits()).toBeFalse();
    });
  });

  describe('Tab Change Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set active tab to general without loading anything', () => {
      component.activeTab.set('units');

      component.onTabChange('general');

      expect(component.activeTab()).toBe('general');
      expect(siteStatisticsServiceSpy.getUnitDetails).not.toHaveBeenCalled();
    });

    it('should not reload units when switching to units tab if units already loaded', fakeAsync(() => {
      component.selectedSiteRow.set(mockSiteStatistics[0]);
      component.unitDetails.set(mockUnitDetails);

      component.onTabChange('units');
      tick();

      expect(siteStatisticsServiceSpy.getUnitDetails).not.toHaveBeenCalled();
    }));

    it('should not load units when switching to units tab without selected row', () => {
      component.selectedSiteRow.set(null);

      component.onTabChange('units');

      expect(siteStatisticsServiceSpy.getUnitDetails).not.toHaveBeenCalled();
    });
  });

  describe('Retrieve Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show API error message on retrieve failure', fakeAsync(() => {
      siteStatisticsServiceSpy.getSiteStatistics.and.returnValue(
        throwError(() => ({
          error: { errorResponse: { error: 'Custom API Error' } }
        }))
      );

      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Custom API Error');
    }));

    it('should show default error message when API error has no details', fakeAsync(() => {
      siteStatisticsServiceSpy.getSiteStatistics.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to retrieve data');
    }));

    it('should keep form enabled after successful retrieve with data', fakeAsync(() => {
      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });

      component.onRetrieve();
      tick();

      expect(component.filterForm.enabled).toBeTrue();
    }));

    it('should show no records error when data is empty', fakeAsync(() => {
      siteStatisticsServiceSpy.getSiteStatistics.and.returnValue(
        of({ data: [], totalActualDraws: 0, totalActualDeferrals: 0 })
      );

      component.filterForm.patchValue({
        fromDate: moment('2024-01-01'),
        toDate: moment('2024-01-31'),
      });

      component.onRetrieve();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Err: 9188: No records found');
    }));
  });

  describe('Load Sites Error Handling', () => {
    it('should show error when loading sites fails', fakeAsync(() => {
      siteStatisticsServiceSpy.getSites.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to load sites');
    }));
  });

  describe('Site Search Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.sites.set(mockSites);
    });

    it('should filter sites by siteId match', () => {
      component.siteSearchTerm.set('site001');
      expect(component.filteredSites().length).toBe(1);
      expect(component.filteredSites()[0].siteId).toBe('SITE001');
    });

    it('should filter sites by locationName match', () => {
      component.siteSearchTerm.set('uptown');
      expect(component.filteredSites().length).toBe(1);
      expect(component.filteredSites()[0].siteId).toBe('SITE002');
    });

    it('should return empty when no sites match search', () => {
      component.siteSearchTerm.set('nonexistent');
      expect(component.filteredSites().length).toBe(0);
    });
  });

  describe('Date Error Messages - Additional', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return required error for fromDate when empty and touched', () => {
      const control = component.filterForm.get('fromDate');
      control?.markAsTouched();
      component.fromDateInput = { nativeElement: { value: '' } } as any;
      expect(component.getFromDateError()).toBe('From Date is required');
    });

    it('should return required error for toDate when empty and touched', () => {
      const control = component.filterForm.get('toDate');
      control?.markAsTouched();
      component.toDateInput = { nativeElement: { value: '' } } as any;
      expect(component.getToDateError()).toBe('To Date is required');
    });

    it('should return empty when fromDate control is not touched', () => {
      expect(component.getFromDateError()).toBe('');
    });

    it('should return empty when toDate control is not touched', () => {
      expect(component.getToDateError()).toBe('');
    });

    it('should return invalid when toDate control has required error but raw input has text', () => {
      const control = component.filterForm.get('toDate');
      control?.markAsTouched();
      component.toDateInput = { nativeElement: { value: '02-02-02' } } as any;
      expect(component.getToDateError()).toBe('To Date is invalid');
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy$ on ngOnDestroy', () => {
      fixture.detectChanges();
      const destroySpy = spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
    });
  });
});
