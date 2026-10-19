import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { Subject, of, throwError } from 'rxjs';
import { DrawQuery } from './draw-query';
import { DrawQueryService } from './services/draw-query.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { HeaderService } from '@shared/services/header.service';
import { DriveProjectionSummary, DonationType } from './models/draw-query.model';
import { createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';
import { DateFieldValidationUtility } from '@shared/components/DateFieldUtility/date-field-validation.utility';

describe('DrawQuery', () => {
  let dialogRefSpy: any;
  let component: DrawQuery;
  let fixture: ComponentFixture<DrawQuery>;
  let mockDrawQueryService: jasmine.SpyObj<DrawQueryService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockPageHeaderService: jasmine.SpyObj<PageHeaderService>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;
  let chapterChangedSubject$: Subject<void>;

  const mockDonationTypes: DonationType[] = [
    { code: 'WB', description: 'Whole Blood' },
    { code: 'PL', description: 'Platelets' }
  ];

  const mockDriveProjections: DriveProjectionSummary[] = [
    {
      driveDate: '2024-01-15',
      driveDay: 'Mon',
      numberOfDrives: 5,
      projectedShow: 100,
      projectedDraw: 90,
      goal: 95,
      actualDraw: 88,
      actualDeferral: 2,
      prelab: 3,
      rnft: 2,
      veni03: 1,
      veni04: 1,
      veni05: 0,
      veni06: 7,
      veni07: 0,
      projectedDeferral: 10,
      deferralPercent: 11.11,
      actualDeferralPercent: 2.27,
      veniTotal: 7
    },
    {
      driveDate: '2024-01-16',
      driveDay: 'Tue',
      numberOfDrives: 3,
      projectedShow: 60,
      projectedDraw: 55,
      goal: 50,
      actualDraw: 52,
      actualDeferral: 3,
      prelab: 2,
      rnft: 1,
      veni03: 0,
      veni04: 1,
      veni05: 1,
      veni06: 5,
      veni07: 0,
      projectedDeferral: 5,
      deferralPercent: 8.33,
      actualDeferralPercent: 5.77,
      veniTotal: 5
    }
  ];

  beforeEach(() => {
    chapterChangedSubject$ = new Subject<void>();

    mockDrawQueryService = jasmine.createSpyObj('DrawQueryService', [
      'getDonationTypes',
      'getDriveProjections',
      'getDriveDetails'
    ]);

    mockDialog = createMockMatDialog();

    mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: jasmine.createSpy().and.returnValue(null)
    });

    mockHeaderService = createMockHeaderService({
      chapterId: signal('CH001'),
      headerConfig: signal({ title: 'Blood Centers', subtitle: '', logoUrl: '', user: { id: 'testuser', name: 'Test User' } })
    });
    (mockHeaderService as any).chapterChanged$ = chapterChangedSubject$;

    // Setup default return values
    mockDrawQueryService.getDonationTypes.and.returnValue(of(mockDonationTypes));
    mockDrawQueryService.getDriveProjections.and.returnValue(of(mockDriveProjections));

    TestBed.configureTestingModule({
      imports: [
        DrawQuery,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        { provide: DrawQueryService, useValue: mockDrawQueryService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: PageHeaderService, useValue: mockPageHeaderService },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    fixture = TestBed.createComponent(DrawQuery);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  describe('Component Initialization', () => {
    it('should have drive type options', () => {
      expect(component.driveTypes.length).toBe(3);
      expect(component.driveTypes[0].code).toBe('FIX');
      expect(component.driveTypes[1].code).toBe('MOB');
      expect(component.driveTypes[2].code).toBe('BOTH');
    });
  });

  describe('Form Validation', () => {
    it('should not require donationType field', () => {
      const donationTypeControl = component.filterForm.get('donationType');
      expect(donationTypeControl?.hasError('required')).toBe(false);
    });
  });

  describe('Data Loading', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        driveType: 'FIX',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });
    });

    it('should load drive projections when retrieve is clicked', () => {
      component.onRetrieve();

      expect(mockDrawQueryService.getDriveProjections).toHaveBeenCalled();
      expect(component.dataSource).toEqual(mockDriveProjections);
    });

    it('should handle error when loading drive projections', () => {
      mockDrawQueryService.getDriveProjections.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.onRetrieve();

      expect(component.isLoadingData).toBe(false);
    });

    it('should send correct request parameters', () => {
      component.filterForm.patchValue({
        driveType: 'MOB',
        donationType: 'WB',
        fromDate: new Date('2024-01-15'),
        toDate: new Date('2024-01-20')
      });

      component.onRetrieve();

      const callArgs = mockDrawQueryService.getDriveProjections.calls.mostRecent().args[0];
      expect(callArgs.driveType).toBe('MOB');
      expect(callArgs.donationType).toBe('WB');
      expect(callArgs.fromDate).toBe('2024-01-15');
      expect(callArgs.toDate).toBe('2024-01-20');
      expect(callArgs.chapterId).toBe('CH001');
      expect(callArgs.loggedInUserName).toBe('testuser');
    });
  });

  describe('Formatting Functions', () => {
    it('should handle empty date string', () => {
      expect(component.formatDate('')).toBe('');
    });

    it('should format percent correctly', () => {
      expect(component.formatPercent(11.111)).toBe('11.11');
      expect(component.formatPercent(5.5)).toBe('5.50');
      expect(component.formatPercent(0)).toBe('0.00');
    });

    it('should get full day name from short day', () => {
      expect(component['getFullDayName']('Mon')).toBe('Monday');
      expect(component['getFullDayName']('Tue')).toBe('Tuesday');
      expect(component['getFullDayName']('Wed')).toBe('Wednesday');
      expect(component['getFullDayName']('Thu')).toBe('Thursday');
      expect(component['getFullDayName']('Fri')).toBe('Friday');
      expect(component['getFullDayName']('Sat')).toBe('Saturday');
      expect(component['getFullDayName']('Sun')).toBe('Sunday');
    });

    it('should return original value for unknown day abbreviation', () => {
      expect(component['getFullDayName']('XYZ')).toBe('XYZ');
    });

    it('should handle empty day string', () => {
      expect(component['getFullDayName']('')).toBe('');
    });
  });

  describe('Footer Calculations', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        driveType: 'FIX',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });
    });

    it('should calculate footer totals correctly', () => {
      component.onRetrieve();

      expect(component.footerData).toBeDefined();
      expect(component.footerData?.recordCount).toBe(2);
      expect(component.footerData?.goal).toBe(145); // 95 + 50
      expect(component.footerData?.numberOfDrives).toBe(8); // 5 + 3
      expect(component.footerData?.projectedShow).toBe(160); // 100 + 60
      expect(component.footerData?.projectedDraw).toBe(145); // 90 + 55
      expect(component.footerData?.actualDraw).toBe(140); // 88 + 52
    });

    it('should handle null values in calculations', () => {
      const dataWithNulls: DriveProjectionSummary[] = [
        {
          ...mockDriveProjections[0],
          goal: null as any,
          actualDraw: null as any
        }
      ];

      mockDrawQueryService.getDriveProjections.and.returnValue(of(dataWithNulls));
      component.onRetrieve();

      expect(component.footerData?.goal).toBe(0);
      expect(component.footerData?.actualDraw).toBe(0);
    });
  });

  describe('Row Actions', () => {
    const mockRow: DriveProjectionSummary = mockDriveProjections[0];

    beforeEach(() => {
      component.filterForm.patchValue({ driveType: 'FIX' });
    });

    it('should handle display-drives action', () => {
      dialogRefSpy = jasmine.createSpyObj('MatDialogRef', { afterClosed: of(null) });
      mockDialog.open.and.returnValue(dialogRefSpy);

      // Spy on the private method instead to avoid dialog dependency issues
      spyOn<any>(component, 'onDisplayDrives').and.stub();

      component.onRowAction({ action: 'display-drives', row: mockRow });

      expect(component['onDisplayDrives']).toHaveBeenCalledWith(mockRow);
    });
  });

  describe('Date Formatting for API', () => {
    it('should format Date object for API', () => {
      const date = new Date('2024-01-15');
      const formatted = component['formatDateForApi'](date);
      expect(formatted).toBe('2024-01-15');
    });

    it('should format moment object for API', () => {
      const momentLike = {
        _isAMomentObject: true,
        format: (pattern: string) => '2024-01-15'
      };
      const formatted = component['formatDateForApi'](momentLike);
      expect(formatted).toBe('2024-01-15');
    });

    it('should return empty string for null or undefined date', () => {
      expect(component['formatDateForApi'](null)).toBe('');
      expect(component['formatDateForApi'](undefined)).toBe('');
    });
  });

  describe('onClearAll', () => {
    it('should reset form, data, and footer', () => {
      component.filterForm.patchValue({
        driveType: 'MOB',
        donationType: 'WB',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-07')
      });
      component.dataSource = [...mockDriveProjections];
      component.footerData = { recordCount: 2 } as any;
      component.errorMessage = 'some error';

      component.onClearAll();

      expect(component.filterForm.value.driveType).toBe('BOTH');
      expect(component.filterForm.value.donationType).toBe('');
      expect(component.filterForm.value.fromDate).toBeNull();
      expect(component.filterForm.value.toDate).toBeNull();
      expect(component.dataSource).toEqual([]);
      expect(component.footerData).toBeNull();
      expect(component.errorMessage).toBeNull();
    });

    it('should mark form as pristine after clear', () => {
      component.filterForm.markAsDirty();
      component.onClearAll();
      expect(component.filterForm.pristine).toBe(true);
    });
  });

  describe('Getter properties', () => {
    it('isRetrieveDisabled should be true when loading', () => {
      component.isLoadingData = true;
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('isRetrieveDisabled should be true when fromDate is missing', () => {
      component.isLoadingData = false;
      component.filterForm.patchValue({ fromDate: null, toDate: new Date() });
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('isRetrieveDisabled should be true when toDate is missing', () => {
      component.isLoadingData = false;
      component.filterForm.patchValue({ fromDate: new Date(), toDate: null });
      expect(component.isRetrieveDisabled).toBe(true);
    });

    it('isClearAllDisabled should be true when form is pristine', () => {
      component.filterForm.markAsPristine();
      component.isLoadingData = false;
      expect(component.isClearAllDisabled).toBe(true);
    });

    it('isClearAllDisabled should be true when loading data', () => {
      component.filterForm.markAsDirty();
      component.isLoadingData = true;
      expect(component.isClearAllDisabled).toBe(true);
    });

    it('isClearAllDisabled should be false when dirty and not loading', () => {
      component.filterForm.markAsDirty();
      component.isLoadingData = false;
      expect(component.isClearAllDisabled).toBe(false);
    });

    it('selectedDriveTypeDescription should return matching description', () => {
      component.filterForm.patchValue({ driveType: 'FIX' });
      expect(component.selectedDriveTypeDescription).toBe('Fixed Drives');
    });

    it('selectedDriveTypeDescription should return "All Drives" for unknown code', () => {
      component.filterForm.patchValue({ driveType: 'UNKNOWN' });
      expect(component.selectedDriveTypeDescription).toBe('All Drives');
    });

    it('selectedDriveTypeDescription should return "All Drives" for BOTH drive type', () => {
      component.filterForm.get('driveType')?.setValue('BOTH');
      expect(component.selectedDriveTypeDescription).toBe('All Drives');
    });
  });

  describe('onRetrieve with invalid form', () => {
    it('should not call service when form is invalid', () => {
      mockDrawQueryService.getDriveProjections.calls.reset();
      component.filterForm.patchValue({ fromDate: null, toDate: null });
      component.filterForm.get('fromDate')?.setErrors({ required: true });

      component.onRetrieve();

      expect(mockDrawQueryService.getDriveProjections).not.toHaveBeenCalled();
    });
  });

  describe('Lifecycle', () => {
    it('should call loadDropdowns on ngOnInit', () => {
      component.ngOnInit();
      expect(mockDrawQueryService.getDonationTypes).toHaveBeenCalled();
    });

    it('should populate donationTypes on ngOnInit', () => {
      component.ngOnInit();
      expect(component.donationTypes).toEqual(mockDonationTypes);
      expect(component.filteredDonationTypes).toEqual(mockDonationTypes);
    });

    it('should handle getDonationTypes error gracefully', () => {
      mockDrawQueryService.getDonationTypes.and.returnValue(throwError(() => new Error('API Error')));
      component.ngOnInit();
      expect(component.isLoadingDropdowns).toBe(false);
    });

    it('should complete destroy$ on ngOnDestroy', () => {
      component.ngOnInit();
      let completed = false;
      component['destroy$'].subscribe({ complete: () => completed = true });
      component.ngOnDestroy();
      expect(completed).toBe(true);
    });
  });

  describe('Chapter Changes', () => {
    it('should clear data when chapter changes', () => {
      component.ngOnInit();
      component.dataSource = mockDriveProjections;
      component.footerData = { recordCount: 2 } as any;
      component.errorMessage = 'some error';

      chapterChangedSubject$.next();

      expect(component.dataSource).toEqual([]);
      expect(component.footerData).toBeNull();
      expect(component.errorMessage).toBeNull();
    });
  });

  describe('onRowAction routing', () => {
    const mockRow: DriveProjectionSummary = mockDriveProjections[0];

    beforeEach(() => {
      component.filterForm.patchValue({ driveType: 'FIX' });
    });

    it('should call onSiteStatistics for site-statistics action', () => {
      spyOn<any>(component, 'onSiteStatistics').and.stub();
      component.onRowAction({ action: 'site-statistics', row: mockRow });
      expect(component['onSiteStatistics']).toHaveBeenCalledWith(mockRow);
    });

    it('should call onCollectionStatistics for collection-statistics action', () => {
      spyOn<any>(component, 'onCollectionStatistics').and.stub();
      component.onRowAction({ action: 'collection-statistics', row: mockRow });
      expect(component['onCollectionStatistics']).toHaveBeenCalledWith(mockRow);
    });
  });

  describe('onSiteStatistics', () => {
    const mockRow: DriveProjectionSummary = mockDriveProjections[0];
    let dialogSpy: jasmine.Spy;

    beforeEach(() => {
      dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(null) } as any);
    });

    it('should open dialog with site statistics data', () => {
      component['onSiteStatistics'](mockRow);

      expect(dialogSpy).toHaveBeenCalled();
      const dialogData = dialogSpy.calls.mostRecent().args[1]?.data;
      expect(dialogData.startDate).toBe('2024-01-15');
      expect(dialogData.endDate).toBe('2024-01-15');
    });

    it('should pass correct dialog config', () => {
      component['onSiteStatistics'](mockRow);

      const dialogConfig = dialogSpy.calls.mostRecent().args[1];
      expect(dialogConfig?.width).toBe('1400px');
      expect(dialogConfig?.panelClass).toBe('collection-statistics-panel');
    });

    it('should open dialog for different row dates', () => {
      const otherRow = { ...mockRow, driveDate: '2024-02-20' };
      component['onSiteStatistics'](otherRow);

      expect(dialogSpy).toHaveBeenCalled();
      const dialogData = dialogSpy.calls.mostRecent().args[1]?.data;
      expect(dialogData.startDate).toBe('2024-02-20');
    });
  });

  describe('onCollectionStatistics', () => {
    it('should open CollectionStatistics dialog', () => {
      const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      component['onCollectionStatistics'](mockDriveProjections[0]);

      expect(dialogSpy).toHaveBeenCalled();
    });
  });

  describe('loadDriveProjections error branches', () => {
    beforeEach(() => {
      component.filterForm.patchValue({
        driveType: 'FIX',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });
    });

    it('should extract error from errorResponse.error', () => {
      mockDrawQueryService.getDriveProjections.and.returnValue(
        throwError(() => ({ error: { errorResponse: { error: 'Custom API Error' } } }))
      );

      component.onRetrieve();

      expect(component.errorMessage).toBe('Custom API Error');
      expect(component.dataSource).toEqual([]);
      expect(component.footerData).toBeNull();
    });

    it('should extract error from error.message', () => {
      mockDrawQueryService.getDriveProjections.and.returnValue(
        throwError(() => ({ error: { message: 'Server message' } }))
      );

      component.onRetrieve();

      expect(component.errorMessage).toBe('Server message');
    });

    it('should extract error from top-level message', () => {
      mockDrawQueryService.getDriveProjections.and.returnValue(
        throwError(() => ({ message: 'Generic message' }))
      );

      component.onRetrieve();

      expect(component.errorMessage).toBe('Generic message');
    });

    it('should use default message when no specific error is available', () => {
      mockDrawQueryService.getDriveProjections.and.returnValue(
        throwError(() => ({}))
      );

      component.onRetrieve();

      expect(component.errorMessage).toBe('An error occurred while loading data');
    });

    it('should clear dataSource and footerData on error', () => {
      component.dataSource = mockDriveProjections;
      component.footerData = { recordCount: 2 } as any;
      mockDrawQueryService.getDriveProjections.and.returnValue(
        throwError(() => new Error('Fail'))
      );
      component.onRetrieve();
      expect(component.dataSource).toEqual([]);
      expect(component.footerData).toBeNull();
    });
  });

  describe('loadDropdowns error path', () => {
    it('should handle error when loading donation types', () => {
      spyOn(console, 'error');
      mockDrawQueryService.getDonationTypes.and.returnValue(
        throwError(() => new Error('Dropdown error'))
      );

      component['loadDropdowns']();

      expect(component.isLoadingDropdowns).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setupSearchControls', () => {
    beforeEach(() => {
      component['setupSearchControls']();
    });

    it('should filter drive types by description', () => {
      component.driveTypeSearchControl.setValue('fixed');

      expect(component.filteredDriveTypes.length).toBe(1);
      expect(component.filteredDriveTypes[0].code).toBe('FIX');
    });

    it('should filter drive types by code', () => {
      component.driveTypeSearchControl.setValue('mob');

      expect(component.filteredDriveTypes.length).toBe(1);
      expect(component.filteredDriveTypes[0].code).toBe('MOB');
    });

    it('should show all drive types when search is empty', () => {
      component.driveTypeSearchControl.setValue('');

      expect(component.filteredDriveTypes.length).toBe(3);
    });

    it('should filter donation types by code', () => {
      component.donationTypes = mockDonationTypes;
      component.filteredDonationTypes = [...mockDonationTypes];

      component.donationTypeSearchControl.setValue('wb');

      expect(component.filteredDonationTypes.length).toBe(1);
      expect(component.filteredDonationTypes[0].code).toBe('WB');
    });

    it('should handle null search value for drive types', () => {
      component.driveTypeSearchControl.setValue(null as any);
      expect(component.filteredDriveTypes.length).toBe(3);
    });

    it('should show all donation types when search is cleared', () => {
      component.donationTypes = mockDonationTypes;
      component.filteredDonationTypes = [...mockDonationTypes];

      component.donationTypeSearchControl.setValue('wb');
      component.donationTypeSearchControl.setValue('');
      expect(component.filteredDonationTypes.length).toBe(mockDonationTypes.length);
    });
  });

  describe('formatDate with valid date', () => {
    it('should format a valid date string', () => {
      const result = component.formatDate('2024-01-15');
      expect(result).toBe('15-JAN-2024');
    });

    it('should format another valid date string', () => {
      const result = component.formatDate('2024-12-25');
      expect(result).toBe('25-DEC-2024');
    });

    it('should format ISO datetime string by stripping time component', () => {
      const result = component.formatDate('2024-06-15T00:00:00');
      expect(result).toContain('JUN');
      expect(result).toContain('2024');
      expect(result).not.toContain('T');
    });

    it('should return dateString on exception in formatDate', () => {
      const result = component.formatDate('not-a-date-but-parseable');
      expect(result).toBeDefined();
    });
  });

  describe('formatPercent edge cases', () => {
    it('should return 0.00 for null', () => {
      expect(component.formatPercent(null as any)).toBe('0.00');
    });

    it('should return 0.00 for undefined', () => {
      expect(component.formatPercent(undefined as any)).toBe('0.00');
    });
  });

  describe('formatDateForApi edge cases', () => {
    it('should return empty string for null', () => {
      expect(component['formatDateForApi'](null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(component['formatDateForApi'](undefined)).toBe('');
    });
  });

  describe('calculateFooterTotals edge cases', () => {
    it('should set footerData to null for empty array', () => {
      component['calculateFooterTotals']([]);
      expect(component.footerData).toBeNull();
    });

    it('should set footerData to null for null input', () => {
      component['calculateFooterTotals'](null as any);
      expect(component.footerData).toBeNull();
    });
  });

  describe('onDateBlur', () => {
    it('should auto-format DDMMYY input to moment date', () => {
      const inputEl = { value: '211126' } as HTMLInputElement;
      component.onDateBlur('fromDate', inputEl);

      const control = component.filterForm.get('fromDate');
      expect(control?.value).toBeTruthy();
    });

    it('should set invalidDateFormat error when input has text but control value is null', () => {
      const inputEl = { value: 'invalid-date' } as HTMLInputElement;
      const control = component.filterForm.get('fromDate');
      control?.setValue(null, { emitEvent: false });

      component.onDateBlur('fromDate', inputEl);

      expect(control?.hasError('invalidDateFormat')).toBe(true);
    });

    it('should not set error for empty input', () => {
      const inputEl = { value: '' } as HTMLInputElement;
      const control = component.filterForm.get('fromDate');
      control?.setValue(null, { emitEvent: false });

      component.onDateBlur('fromDate', inputEl);

      expect(control?.hasError('invalidDateFormat')).toBeFalsy();
    });

    it('should handle invalid DDMMYY that does not parse to valid date', () => {
      const inputEl = { value: '999999' } as HTMLInputElement;
      const control = component.filterForm.get('fromDate');
      control?.setValue(null, { emitEvent: false });

      component.onDateBlur('fromDate', inputEl);

      // 999999 matches pattern but moment('99-99-2099') is invalid, so falls through
      expect(control?.hasError('invalidDateFormat')).toBe(true);
    });
  });

  describe('onFromDateInput and onToDateInput', () => {
    it('should call DateFieldValidationUtility.handleStartDateInput for fromDate', () => {
      const event = { target: { value: '15012024' } } as unknown as Event;
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');

      component.onFromDateInput(event);

      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '15012024',
        component.filterForm.get('fromDate')
      );
    });

    it('should call DateFieldValidationUtility.handleStartDateInput for toDate', () => {
      const event = { target: { value: '20012024' } } as unknown as Event;
      spyOn(DateFieldValidationUtility, 'handleStartDateInput');

      component.onToDateInput(event);

      expect(DateFieldValidationUtility.handleStartDateInput).toHaveBeenCalledWith(
        '20012024',
        component.filterForm.get('toDate')
      );
    });
  });

  describe('getFromDateError and getToDateError', () => {
    it('should return error message for fromDate', () => {
      spyOn(DateFieldValidationUtility, 'getDateErrorMessage').and.returnValue('From Date is required');
      const result = component.getFromDateError();
      expect(result).toBe('From Date is required');
    });

    it('should return error message for toDate', () => {
      spyOn(DateFieldValidationUtility, 'getDateErrorMessage').and.returnValue('To Date must be on or after From Date');
      const result = component.getToDateError();
      expect(result).toBe('To Date must be on or after From Date');
    });
  });

  describe('loadDriveProjections without optional filters', () => {
    it('should not include driveType when empty', () => {
      component.filterForm.patchValue({
        driveType: '',
        donationType: '',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-31')
      });

      // Call private method directly to bypass form validation (driveType required)
      component['loadDriveProjections']();

      const callArgs = mockDrawQueryService.getDriveProjections.calls.mostRecent().args[0];
      expect(callArgs.driveType).toBeUndefined();
      expect(callArgs.donationType).toBeUndefined();
    });
  });

  describe('checkAndReopenDialog', () => {
    afterEach(() => {
      sessionStorage.removeItem('shouldRestoreDrawQuery');
      sessionStorage.removeItem('drawDetailsDialogData');
      sessionStorage.removeItem('drawQueryFormData');
      sessionStorage.removeItem('drawQueryTableData');
    });

    it('should restore form and table data from sessionStorage', () => {
      const formData = {
        driveType: 'MOB',
        donationType: 'WB',
        fromDate: new Date('2024-01-01').toISOString(),
        toDate: new Date('2024-01-07').toISOString()
      };
      const tableData = {
        dataSource: mockDriveProjections,
        footerData: { recordCount: 2 }
      };

      sessionStorage.setItem('shouldRestoreDrawQuery', 'true');
      sessionStorage.setItem('drawQueryFormData', JSON.stringify(formData));
      sessionStorage.setItem('drawQueryTableData', JSON.stringify(tableData));

      component['checkAndReopenDialog']();

      expect(component.filterForm.value.driveType).toBe('MOB');
      expect(component.filterForm.value.donationType).toBe('WB');
      expect(component.dataSource).toEqual(mockDriveProjections);
      expect(component.footerData).toEqual({ recordCount: 2 } as any);
    });

    it('should clear sessionStorage after restoring', () => {
      sessionStorage.setItem('shouldRestoreDrawQuery', 'true');
      sessionStorage.setItem('drawQueryFormData', JSON.stringify({ driveType: 'FIX' }));

      component['checkAndReopenDialog']();

      expect(sessionStorage.getItem('shouldRestoreDrawQuery')).toBeNull();
      expect(sessionStorage.getItem('drawQueryFormData')).toBeNull();
    });

    it('should not restore when shouldRestoreDrawQuery is not true', () => {
      sessionStorage.setItem('shouldRestoreDrawQuery', 'false');
      const originalDataSource = [...component.dataSource];

      component['checkAndReopenDialog']();

      expect(component.dataSource).toEqual(originalDataSource);
    });

    it('should handle JSON parse errors gracefully', () => {
      spyOn(console, 'error');
      sessionStorage.setItem('shouldRestoreDrawQuery', 'true');
      sessionStorage.setItem('drawQueryFormData', 'invalid-json');

      component['checkAndReopenDialog']();

      expect(console.error).toHaveBeenCalled();
      expect(sessionStorage.getItem('shouldRestoreDrawQuery')).toBeNull();
    });

    it('should queue dialog reopen when drawDetailsDialogData is in sessionStorage', () => {
      const dialogData = { driveDate: '2024-01-15', driveDay: 'Mon', numberOfDrives: 5, driveType: 'FIX' };
      sessionStorage.setItem('shouldRestoreDrawQuery', 'true');
      sessionStorage.setItem('drawDetailsDialogData', JSON.stringify(dialogData));

      component['checkAndReopenDialog']();

      // Session storage should be cleared immediately (outside the setTimeout)
      expect(sessionStorage.getItem('shouldRestoreDrawQuery')).toBeNull();
      expect(sessionStorage.getItem('drawDetailsDialogData')).toBeNull();
    });
  });

  describe('onDisplayDrives', () => {
    it('should store form and table data in sessionStorage and open dialog', () => {
      const dialogSpy = spyOn(component['dialog'], 'open').and.returnValue({ afterClosed: () => of(null) } as any);
      component.filterForm.patchValue({
        driveType: 'FIX',
        donationType: 'WB',
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-01-07')
      });
      component.dataSource = mockDriveProjections;
      component.footerData = { recordCount: 2 } as any;

      component['onDisplayDrives'](mockDriveProjections[0]);

      expect(dialogSpy).toHaveBeenCalled();
      const storedFormData = sessionStorage.getItem('drawQueryFormData');
      expect(storedFormData).toBeTruthy();
      const parsed = JSON.parse(storedFormData!);
      expect(parsed.driveType).toBe('FIX');
      expect(parsed.donationType).toBe('WB');

      const storedTableData = sessionStorage.getItem('drawQueryTableData');
      expect(storedTableData).toBeTruthy();
    });

    it('should open DrawDetailsDialog with correct data', () => {
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
      spyOn(component['dialog'], 'open').and.returnValue(dialogRefSpy);
      component.filterForm.patchValue({ driveType: 'MOB' });

      component['onDisplayDrives'](mockDriveProjections[0]);

      expect(component['dialog'].open).toHaveBeenCalledWith(
        jasmine.anything(),
        jasmine.objectContaining({
          data: jasmine.objectContaining({
            driveDate: mockDriveProjections[0].driveDate,
            driveDay: mockDriveProjections[0].driveDay,
            numberOfDrives: mockDriveProjections[0].numberOfDrives,
            driveType: 'MOB'
          })
        })
      );
    });
  });

  describe('tableConfig valueFormatters', () => {
    it('should format driveDate column via valueFormatter', () => {
      const driveDateCol = component.tableConfig.columns.find(c => c.key === 'driveDate');
      expect(driveDateCol?.valueFormatter).toBeDefined();
      expect(driveDateCol!.valueFormatter!('2024-03-15')).toBe('15-MAR-2024');
    });

    it('should format driveDay column via valueFormatter', () => {
      const driveDayCol = component.tableConfig.columns.find(c => c.key === 'driveDay');
      expect(driveDayCol?.valueFormatter).toBeDefined();
      expect(driveDayCol!.valueFormatter!('Mon')).toBe('Monday');
    });

    it('should format deferralPercent column via valueFormatter', () => {
      const deferralPercentCol = component.tableConfig.columns.find(c => c.key === 'deferralPercent');
      expect(deferralPercentCol?.valueFormatter).toBeDefined();
      expect(deferralPercentCol!.valueFormatter!(11.111)).toBe('11.11');
    });

    it('should format actualDeferralPercent column via valueFormatter', () => {
      const col = component.tableConfig.columns.find(c => c.key === 'actualDeferralPercent');
      expect(col?.valueFormatter).toBeDefined();
      expect(col!.valueFormatter!(5.777)).toBe('5.78');
    });
  });
});
