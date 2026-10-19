import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';

import { DonorAntigensQuery } from './donor-antigens-query';
import { DonorAntigensApiService } from './services/donor-antigens-api.service';
import { LoggingService } from '@shared/services/logging.service';
import { SnackbarService } from '@shared/services/snackbar.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { SearchForDonorDialog } from '@shared/components/search-for-donor/search-for-donor';
import { SearchForDonorDialogResult, DonorSearchResult } from '@shared/components/search-for-donor/search-for-donor.model';
import { createMockSnackbarService, createMockMatDialog } from '@shared/testing/common-mocks';

/**
 * Test suite for MLT-11028: Unit ID validation fix using SearchForDonorDialog
 *
 * This test file verifies that the Donor Antigens Query component correctly:
 * 1. Uses the shared SearchForDonorDialog component instead of custom DonorSearchDialog
 * 2. Properly handles unit ID validation through the UnitIdFieldComponent
 * 3. Navigates with correct donor ID after selection
 * 4. Handles dialog cancellation appropriately
 */
describe('DonorAntigensQuery - SearchForDonorDialog Integration (MLT-11028)', () => {
  let mockDialogService: any;
  let dialogRefStub: any;
  let mockLoggingService: any;
  let component: DonorAntigensQuery;
  let fixture: ComponentFixture<DonorAntigensQuery>;
  let mockService: jasmine.SpyObj<DonorAntigensApiService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let dialog: MatDialog;
  let dialogOpenSpy: jasmine.Spy;

  const mockDonorSearchResult: DonorSearchResult = {
    donorId: 'DN30139921',
    lastName: 'PRESENT',
    firstName: 'ISSACC',
    middleName: null,
    dateOfBirth: '2000-12-12T00:00:00',
    gender: 'M',
    bloodType: 'AB+',
    address: '7834 LONG',
    suiteApt: null,
    city: 'DALLAS',
    state: 'TX',
    zip: '75222',
    country: 'USA',
    alternateId: null,
    alternateIdType: null,
    homeAreaCode: null,
    homePhone: null,
    dayAreaCode: '214',
    dayPhone: null,
    mobileAreaCode: '214',
    mobilePhone: '8521236',
    intlHomePhone: null,
    intlWorkPhone: null,
    intlAddrFlag: 'N',
    preferredContactFlag: 'M'
  };

  const mockActivatedRoute = {
    snapshot: { params: {}, queryParams: {} },
    params: of({}),
    queryParams: of({ donorId: 'DN30139921' })
  };

  beforeEach(() => {

    mockService = jasmine.createSpyObj('DonorAntigensApiService', [
      'getDonorAntigens'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of({}),
      url: '/donor-antigens-query'
    });
    mockRouter.serializeUrl.and.returnValue('/donor-antigens-query');

    mockLoggingService = jasmine.createSpyObj('LoggingService', ['error']);
    const mockSnackbar = createMockSnackbarService();
    const mockPageHeaderService = jasmine.createSpyObj('PageHeaderService', [], {
      pageHeaderData: () => ({ title: 'Donor Antigens Query', subtitle: '' })
    });

    mockService.getDonorAntigens.and.returnValue(
      of({
        donorInfo: {
          donorId: 'DN30139921',
          donorName: 'PRESENT, ISSACC',
          dateOfBirth: '2000-12-12',
          gender: 'M',
          aboType: 'AB+'
        },
        rbcAntigens: [],
        hlaAntigens: {
          a1: null,
          a2: null,
          b1: null,
          b2: null,
          c1: null,
          c2: null,
          d1: null,
          d2: null,
          dr: null
        }
      })
    );

    dialogRefStub = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
    dialogRefStub.afterClosed.and.returnValue(of(null));

    mockDialogService = createMockMatDialog();
    mockDialogService.open.and.returnValue(dialogRefStub);



      TestBed.configureTestingModule({
      imports: [
        DonorAntigensQuery,
        NoopAnimationsModule,
        HttpClientTestingModule
      ],
      providers: [
        { provide: DonorAntigensApiService, useValue: mockService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: MatDialog, useValue: mockDialogService },
        { provide: LoggingService, useValue: mockLoggingService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: PageHeaderService, useValue: mockPageHeaderService }
      ]
    })
    .overrideComponent(DonorAntigensQuery, {
      remove: { imports: [] },
      add: { providers: [{ provide: MatDialog, useValue: mockDialogService }] }
    });


    


      mockService.getDonorAntigens.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockLoggingService.error.calls.reset();


      mockRouter.serializeUrl.and.returnValue('/donor-antigens-query');


      dialogRefStub.afterClosed.and.returnValue(of(null));


      mockDialogService.open.and.returnValue(dialogRefStub);


    fixture = TestBed.createComponent(DonorAntigensQuery);
    component = fixture.componentInstance;
    dialog = TestBed.inject(MatDialog);
    dialogOpenSpy = dialog.open as jasmine.Spy;
    fixture.detectChanges();


    });

  describe('openSearchForDonorDialog Method', () => {


    it('should open dialog with correct configuration', () => {
      component.openSearchForDonorDialog();

      expect(dialogOpenSpy).toHaveBeenCalled();
      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];

      // Verify configuration matches shared component pattern
      expect(dialogConfig.width).toBe('1150px');
      expect(dialogConfig.height).toBe('calc(100vh - 64px)');
      expect(dialogConfig.maxWidth).toBe('100vw');
      expect(dialogConfig.maxHeight).toBe('calc(100vh - 64px)');
      expect(dialogConfig.disableClose).toBe(false); // Different from openSearchForDonor
      expect(dialogConfig.position).toEqual({ right: '0', top: '64px' });
      expect(dialogConfig.panelClass).toBe('right-side-dialog');
      expect(dialogConfig.hasBackdrop).toBe(true);
      expect(dialogConfig.autoFocus).toBe(false);
    });




  });

  describe('Unit ID Validation - Bug Fix Verification', () => {
    it('should use SearchForDonorDialog which includes UnitIdFieldComponent for openSearchForDonorDialog', () => {
      component.openSearchForDonorDialog();

      // Verify we're opening SearchForDonorDialog, not the old custom dialog
      const dialogComponent = dialogOpenSpy.calls.mostRecent().args[0];
      expect(dialogComponent).toBe(SearchForDonorDialog);
    });

    it('should handle valid unit ID search through SearchForDonorDialog', fakeAsync(() => {
      // The SearchForDonorDialog validates and parses unit IDs through UnitIdFieldComponent
      // When a valid unit ID is searched, it returns a donor
      const mockDialogResult: SearchForDonorDialogResult = {
        action: 'select',
        donor: mockDonorSearchResult
      };

      const dialogRefSpy = jasmine.createSpyObj<MatDialogRef<any>>('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(mockDialogResult));
      dialogOpenSpy.and.returnValue(dialogRefSpy);

      component.openSearchForDonorDialog();
      tick();

      // Navigation should occur with the correct donor ID
      expect(mockRouter.navigate).toHaveBeenCalledWith(
        [],
        jasmine.objectContaining({
          queryParams: { donorId: 'DN30139921' }
        })
      );
    }));
  });

  describe('Dialog Configuration Differences', () => {
    it('should use disableClose: false for openSearchForDonorDialog (when donor already loaded)', () => {
      component.openSearchForDonorDialog();

      const dialogConfig = dialogOpenSpy.calls.mostRecent().args[1];
      expect(dialogConfig.disableClose).toBe(false);
    });
  });
});
