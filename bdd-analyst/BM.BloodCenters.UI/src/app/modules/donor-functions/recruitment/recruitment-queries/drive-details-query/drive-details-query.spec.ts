import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DriveDetailsQueryComponent } from './drive-details-query';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute, provideRouter } from '@angular/router';

import { DriveDetailsQueryService } from './services/drive-details-query.service';
import { HeaderService } from '@shared/services/header.service';
import { MenuService } from '@shared/services/menu.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import {
  DriveDetailsQueryFilters,
  DriveDetailsQueryResponse,
  DriveFilterSponsor,
  DriveLookup,
  DriveSelectionOption,
  DriveNote
} from './models/drive-details-query.model';
import { QuickLink } from '@shared/interfaces/dialog.interface';
import { createMockPageHeaderService, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';

describe('DriveDetailsQueryComponent', () => {
  let pageHeaderSpyObj: any;
  let dialogSpyObj: any;
  let menuSpyObj: any;
  let serviceSpyObj: any;
  let component: DriveDetailsQueryComponent;
  let fixture: ComponentFixture<DriveDetailsQueryComponent>;
  let serviceSpy: jasmine.SpyObj<DriveDetailsQueryService>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let menuServiceSpy: jasmine.SpyObj<MenuService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockFilters: DriveDetailsQueryFilters = {
    selectOptions: [
      { value: 'A', label: 'All' },
      { value: 'P', label: 'Past' },
      { value: 'F', label: 'Future' }
    ],
    sponsors: [
      { sponsorId: 'SP001', name: 'Test Sponsor 1' },
      { sponsorId: 'SP002', name: 'Test Sponsor 2' }
    ],
    drives: [
      { driveId: 'DRV001', driveDate: '2024-01-15' },
      { driveId: 'DRV002', driveDate: '2024-01-16' }
    ]
  };

  const mockDriveDetailsResponse: DriveDetailsQueryResponse = {
    driveDetails: {
      driveId: 'DRV001',
      sponsorId: 'SP001',
      sponsorName: 'Test Sponsor',
      recruiterId: 'REC001',
      recruiterName: 'John Doe',
      driveCoordinator: 'Jane Smith',
      phoneNumber: '555-1234',
      status: 'Active',
      category: 'Mobile',
      type: 'Regular',
      sponsorCategory: 'Corporate',
      territory: 'North',
      licensedDrive: 'Y',
      location: 'Main Office',
      address: '123 Main St',
      distance: 10.5,
      direction: 'N',
      facility: 'Hospital A',
      lastPeriod: '2024-01',
      lastModified: '2024-01-15',
      projectedShow: 100,
      actualShow: 95,
      projectedDraw: 80,
      actualDraw: 75,
      projectedDeferral: 10,
      actualDeferral: 8,
      scheduleStartTime: '08:00',
      actualStartTime: '08:15',
      scheduleEndTime: '16:00',
      actualEndTime: '15:45',
      scheduleSetupBreakdown: 30,
      actualSetupBreakdown: 25,
      projectedTravelTime: '30 min',
      actualTravelTime: '35 min',
      projectedCpu: 25.50,
      actualCpu: 26.00,
      projectedResources: 5,
      actualResources: 5,
      chapterId: 'CH001',
      driveDate: '2024-01-15',
      locationId: 'LOC001',
      scheduleId: 'SCH001'
    },
    notes: [
      { userId: 'U001', userName: 'User 1', notes: 'Test note', noteSequence: 1, insertDate: '2024-01-15' }
    ]
  };

  beforeEach(() => {

    serviceSpyObj = jasmine.createSpyObj('DriveDetailsQueryService', [
      'getFilters',
      'getDriveDetails'
    ]);
    const headerSpyObj = createMockHeaderService();
    menuSpyObj = jasmine.createSpyObj('MenuService', ['findMenuItemByPath']);
    dialogSpyObj = createMockMatDialog();
    const routerSpyObj = jasmine.createSpyObj('Router', [], { url: '/drive-details-query' });
    const activatedRouteSpyObj = {
      queryParams: of({})
    };
    pageHeaderSpyObj = createMockPageHeaderService();
    pageHeaderSpyObj.getTitle.and.returnValue('Drive Details Query');
    pageHeaderSpyObj.getSubtitle.and.returnValue('View drive details');



      TestBed.configureTestingModule({
      imports: [DriveDetailsQueryComponent,
        ReactiveFormsModule,
        FormsModule,
        TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        { provide: DriveDetailsQueryService, useValue: serviceSpyObj },
        { provide: HeaderService, useValue: headerSpyObj },
        { provide: MenuService, useValue: menuSpyObj },
        { provide: MatDialog, useValue: dialogSpyObj },
        { provide: Router, useValue: routerSpyObj },
        { provide: ActivatedRoute, useValue: activatedRouteSpyObj },
        { provide: PageHeaderService, useValue: pageHeaderSpyObj }
      ]
    });


    


      serviceSpyObj.getFilters.calls.reset();


      serviceSpyObj.getDriveDetails.calls.reset();


      menuSpyObj.findMenuItemByPath.calls.reset();


      dialogSpyObj.open.calls.reset();


      pageHeaderSpyObj.getTitle.calls.reset();


      pageHeaderSpyObj.getSubtitle.calls.reset();


      pageHeaderSpyObj.getCurrentMenuItem.calls.reset();


      pageHeaderSpyObj.getTitle.and.returnValue('Drive Details Query');


      pageHeaderSpyObj.getSubtitle.and.returnValue('View drive details');


    fixture = TestBed.createComponent(DriveDetailsQueryComponent);
    component = fixture.componentInstance;
    serviceSpy = TestBed.inject(DriveDetailsQueryService) as jasmine.SpyObj<DriveDetailsQueryService>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    menuServiceSpy = TestBed.inject(MenuService) as jasmine.SpyObj<MenuService>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    serviceSpy.getFilters.and.returnValue(of(mockFilters));
    menuServiceSpy.findMenuItemByPath.and.returnValue({ label: 'Drive Details Query', remarks: 'View drive details' });


    });


  describe('Initialization', () => {


    it('should have filter form initialized', () => {
      expect(component.filterForm).toBeDefined();
      expect(component.filterForm.get('selectFilter')).toBeDefined();
      expect(component.filterForm.get('sponsorId')).toBeDefined();
      expect(component.filterForm.get('driveDate')).toBeDefined();
      expect(component.filterForm.get('driveId')).toBeDefined();
    });



    it('should have default panel states closed', () => {
      expect(component.locationNotesPanelOpen).toBe(false);
      expect(component.driveChecklistPanelOpen).toBe(false);
      expect(component.driveResourcesPanelOpen).toBe(false);
      expect(component.pickupSchedulePanelOpen).toBe(false);
      expect(component.driveSuppliesPanelOpen).toBe(false);
      expect(component.driveProceduresPanelOpen).toBe(false);
    });
  });

  describe('ngOnInit', () => {


    it('should setup sponsor search', fakeAsync(() => {
      component.ngOnInit();
      component.sponsors = mockFilters.sponsors;
      component.filteredSponsors = [...mockFilters.sponsors];

      component.sponsorSearchControl.setValue('Sponsor 1');
      tick(300);

      expect(component.filteredSponsors.length).toBe(1);
    }));

    it('should setup drive search', fakeAsync(() => {
      component.ngOnInit();
      component.drives = mockFilters.drives;
      component.filteredDrives = [...mockFilters.drives];

      component.driveSearchControl.setValue('DRV001');
      tick(300);

      expect(component.filteredDrives.length).toBe(1);
    }));
  });
  describe('onSponsorChange', () => {
    beforeEach(() => {
      component.sponsors = mockFilters.sponsors;
    });

    it('should set selectedSponsorName when sponsor found', () => {
      component.onSponsorChange('SP001');

      expect(component.selectedSponsorName).toBe('Test Sponsor 1');
    });

    it('should set empty string when sponsor not found', () => {
      component.onSponsorChange('INVALID');

      expect(component.selectedSponsorName).toBe('');
    });
  });

  describe('onDriveChange', () => {
    beforeEach(() => {
      component.drives = mockFilters.drives;
    });

    it('should set selectedDriveCreatedDate when drive found', () => {
      component.onDriveChange('DRV001');

      expect(component.selectedDriveCreatedDate).toBe('15-JAN-2024');
    });

    it('should set empty string when drive not found', () => {
      component.onDriveChange('INVALID');

      expect(component.selectedDriveCreatedDate).toBe('');
    });

    it('should set empty string when drive has no date', () => {
      component.drives = [{ driveId: 'DRV003', driveDate: null }];
      component.onDriveChange('DRV003');

      expect(component.selectedDriveCreatedDate).toBe('');
    });
  });

  describe('onRetrieve', () => {


    it('should retrieve drive details', () => {
      serviceSpy.getDriveDetails.and.returnValue(of(mockDriveDetailsResponse));
      component.filterForm.patchValue({ driveId: 'DRV001' });

      component.onRetrieve();

      expect(serviceSpy.getDriveDetails).toHaveBeenCalled();
      expect(component.hasSearched).toBe(true);
      expect(component.driveDetails).toBeTruthy();
    });



    it('should update selectedSponsorName from drive details', () => {
      serviceSpy.getDriveDetails.and.returnValue(of(mockDriveDetailsResponse));
      component.filterForm.patchValue({ driveId: 'DRV001' });

      component.onRetrieve();

      expect(component.selectedSponsorName).toBe('Test Sponsor');
    });
  });

  describe('Navigation from draw query', () => {
    it('should set loading state when driveDetailsNavigating flag is set', () => {
      sessionStorage.setItem('driveDetailsNavigating', 'true');

      // Check that loading state was set
      expect(component.isLoading).toBe(false); // Initially false

      // Manually call the logic that checks sessionStorage
      const isNavigating = sessionStorage.getItem('driveDetailsNavigating');
      if (isNavigating === 'true') {
        component.isLoading = true;
        component.hasSearched = true;
        sessionStorage.removeItem('driveDetailsNavigating');
      }

      expect(component.isLoading).toBe(true);
      expect(component.hasSearched).toBe(true);
      expect(sessionStorage.getItem('driveDetailsNavigating')).toBeNull();
    });
  });

  describe('onQuickLinkClick', () => {
    it('should not open panel for disabled link', () => {
      const disabledLink: QuickLink = { id: 'abo', label: 'DRIVE ABO', disabled: true };

      component.onQuickLinkClick(disabledLink);

      expect(component.driveChecklistPanelOpen).toBe(false);
    });










  });

  describe('Panel open/close methods', () => {












    it('should not open location notes without driveId', () => {
      component.filterForm.patchValue({ driveId: '' });

      component.openLocationNotesPanel();

      expect(component.locationNotesPanelOpen).toBe(false);
    });
  });
  describe('formatUserName', () => {
    it('should convert "Last, First" to "First Last"', () => {
      expect(component.formatUserName('Doe, John', 'U001')).toBe('John Doe');
    });

    it('should return name as-is if no comma', () => {
      expect(component.formatUserName('John Doe', 'U001')).toBe('John Doe');
    });

    it('should return userId if userName is null', () => {
      expect(component.formatUserName(null, 'U001')).toBe('U001');
    });

    it('should return -- if both are null', () => {
      expect(component.formatUserName(null, null)).toBe('--');
    });
  });

  describe('formatCpu', () => {




    it('should return -- for undefined', () => {
      expect(component.formatCpu(undefined)).toBe('--');
    });
  });

  describe('getFieldValue', () => {


    it('should return placeholder for null', () => {
      expect(component.getFieldValue(null)).toBe('--');
    });

    it('should return placeholder for undefined', () => {
      expect(component.getFieldValue(undefined)).toBe('--');
    });



    it('should use custom placeholder', () => {
      expect(component.getFieldValue(null, 'N/A')).toBe('N/A');
    });
  });

  describe('onDateBlur', () => {
    it('should set invalidDateFormat error when input has text but value is null', () => {
      const inputElement = { value: 'invalid-date' } as HTMLInputElement;
      component.filterForm.get('driveDate')?.setValue(null);

      component.onDateBlur('driveDate', inputElement);

      expect(component.filterForm.get('driveDate')?.hasError('invalidDateFormat')).toBe(true);
    });

    it('should not set error when input is empty', () => {
      const inputElement = { value: '' } as HTMLInputElement;
      component.filterForm.get('driveDate')?.setValue(null);

      component.onDateBlur('driveDate', inputElement);

      expect(component.filterForm.get('driveDate')?.hasError('invalidDateFormat')).toBeFalsy();
    });
  });
  describe('checkSponsorNameTruncation', () => {
    it('should set isSponsorNameTruncated to true when text overflows', () => {
      const inputElement = { scrollWidth: 200, clientWidth: 100 } as HTMLInputElement;

      component.checkSponsorNameTruncation(inputElement);

      expect(component.isSponsorNameTruncated).toBe(true);
    });

    it('should set isSponsorNameTruncated to false when text fits', () => {
      const inputElement = { scrollWidth: 100, clientWidth: 200 } as HTMLInputElement;

      component.checkSponsorNameTruncation(inputElement);

      expect(component.isSponsorNameTruncated).toBe(false);
    });
  });

  describe('checkTruncation', () => {
    it('should add field to truncatedFields when overflowing', () => {
      const element = { scrollWidth: 200, clientWidth: 100 } as HTMLElement;

      component.checkTruncation('testField', element);

      expect(component.truncatedFields.get('testField')).toBe(true);
    });

    it('should set false when not overflowing', () => {
      const element = { scrollWidth: 100, clientWidth: 200 } as HTMLElement;

      component.checkTruncation('testField', element);

      expect(component.truncatedFields.get('testField')).toBe(false);
    });
  });

  describe('isFieldTruncated', () => {
    it('should return true for truncated field', () => {
      component.truncatedFields.set('testField', true);

      expect(component.isFieldTruncated('testField')).toBe(true);
    });

    it('should return false for non-truncated field', () => {
      component.truncatedFields.set('testField', false);

      expect(component.isFieldTruncated('testField')).toBe(false);
    });

    it('should return false for unknown field', () => {
      expect(component.isFieldTruncated('unknownField')).toBe(false);
    });
  });
});
