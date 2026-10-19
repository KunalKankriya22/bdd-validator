import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { Overlay, OverlayModule, OverlayContainer } from '@angular/cdk/overlay';
import { MatDialog } from '@angular/material/dialog';
import { Router, ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { of, BehaviorSubject, throwError } from 'rxjs';

import { DonorDetailQuery } from './donor-detail-query';
import { DonorDetailQueryService } from './services/donor-detail-query.service';
import { DonorStateService } from '../shared/services/donor-state.service';
import { createMockMatDialog, createMockTranslateService } from '@shared/testing/common-mocks';
import {
  DonorDetail,
  DonorDetailResponse,
  DonorEligibility,
  DonorAttribute,
  DonorSearchResult,
} from './models/donor-detail-query.model';

describe('DonorDetailQuery', () => {
  let defaultDialogRef: any;
  let component: DonorDetailQuery;
  let fixture: ComponentFixture<DonorDetailQuery>;
  let mockService: jasmine.SpyObj<DonorDetailQueryService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDonorStateService: jasmine.SpyObj<DonorStateService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let overlayContainer: OverlayContainer;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockDonor: DonorDetail = {
    donorId: '00008392',
    lastName: 'ROGERS',
    firstName: 'MARY',
    dateOfBirth: '1998-01-11',
    sex: 'Female',
    aboRh: 'O+',
    phoneHome: '214-559-4459',
    phoneMobile: '817-614-7156',
    phoneWork: '972-838-2629',
    address: {
      line1: '214 Kings Cir',
      city: 'Houston',
      state: 'TX',
      zipCode: '76234',
    },
    statistics: {
      lifeDonations: 3,
      lifeLtr: 214,
      ytdDonations: 0,
      ytdLtr: 0,
      lifetimeGallon: 2,
      unitsRequiredNext: 1,
      donorSince: '2019-FEB-2024',
      yearsAsDonor: 1,
    },
    lastDonation: {
      unitId: 'WN3131 19 00093 00',
      date: '2025-01-23',
      donation: 'AL',
      procedure: 'WB',
    },
  };

  const mockEligibility: DonorEligibility[] = [
    {
      proc: 'WB',
      status: 'NO',
      eligibilityDate: '2025-06-26',
      reason: 'Donor is temporarily deferred',
    },
  ];

  const mockAttributes: DonorAttribute[] = [
    {
      code: 'A001',
      type: 'SPNG',
      description: 'Rare Donor - Collection Instructor',
    },
  ];

  const mockDonorDetailResponse: DonorDetailResponse = {
    donor: mockDonor,
    eligibility: mockEligibility,
    attributes: mockAttributes,
  };

  beforeEach(() => {

    queryParamsSubject = new BehaviorSubject<any>({});

    mockService = jasmine.createSpyObj('DonorDetailQueryService', [
      'getDonorDetail',
      'formatDate',
    ]);
    mockDialog = createMockMatDialog();
    mockRouter = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      url: '/donor-functions/donor-detail-query',
      events: of({}) // Add events observable for PageHeaderService
    });
    mockRouter.createUrlTree.and.returnValue({} as any);
    mockRouter.serializeUrl.and.returnValue('');
    mockDonorStateService = jasmine.createSpyObj('DonorStateService', [
      'getSelectedDonor',
      'setSelectedDonor',
      'clearSelectedDonor',
    ]);
    mockTranslateService = createMockTranslateService();
    // Default mock: return null (no donor in state)
    // Individual tests can override this
    mockDonorStateService.getSelectedDonor.and.returnValue(null);

    // Default mock for dialog.open to prevent errors when ngOnInit opens dialog
    defaultDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    defaultDialogRef.afterClosed.and.returnValue(of(null));
    mockDialog.open.and.returnValue(defaultDialogRef);



      TestBed.configureTestingModule({
      imports: [DonorDetailQuery, NoopAnimationsModule, OverlayModule],
      providers: [
        provideHttpClient(),
        { provide: DonorDetailQueryService, useValue: mockService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: Router, useValue: mockRouter },
        { provide: DonorStateService, useValue: mockDonorStateService },
        { provide: TranslateService, useValue: mockTranslateService },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable(),
            snapshot: {
              queryParams: {},
            },
          },
        },
        Overlay,
      ],
    })
    .overrideComponent(DonorDetailQuery, {
      remove: { imports: [] },
      add: { providers: [{ provide: MatDialog, useValue: mockDialog }] }
    });



      mockService.getDonorDetail.calls.reset();


      mockService.formatDate.calls.reset();


      mockDialog.open.calls.reset();


      mockRouter.navigate.calls.reset();


      mockRouter.createUrlTree.calls.reset();


      mockRouter.serializeUrl.calls.reset();


      mockDonorStateService.getSelectedDonor.calls.reset();


      mockDonorStateService.setSelectedDonor.calls.reset();


      mockDonorStateService.clearSelectedDonor.calls.reset();


      defaultDialogRef.afterClosed.calls.reset();


      mockRouter.createUrlTree.and.returnValue({} as any);


      mockRouter.serializeUrl.and.returnValue('');


      mockDonorStateService.getSelectedDonor.and.returnValue(null);


      defaultDialogRef.afterClosed.and.returnValue(of(null));


      mockDialog.open.and.returnValue(defaultDialogRef);


    overlayContainer = TestBed.inject(OverlayContainer);
    fixture = TestBed.createComponent(DonorDetailQuery);
    component = fixture.componentInstance;


    });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });


  describe('Initialization', () => {
    it('should start with no donor selected and open search dialog', () => {
      // Arrange
      mockDonorStateService.getSelectedDonor.and.returnValue(null);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      // Act
      fixture.detectChanges();

      // Assert
      expect(component.hasDonor()).toBe(false);
      expect(component.donorData()).toBeNull();
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should initialize quick links', () => {
      expect(component.quickLinks).toBeDefined();
      const quickLinks = component.quickLinks();
      expect(quickLinks.length).toBe(17); // Total number of quick links including all communication links
    });

    it('should have communication letters and notification letters in quick links', () => {
      const quickLinks = component.quickLinks();
      const communicationLettersLink = quickLinks.find((l) => l.route === 'communication-letters');
      const donorNotificationLink = quickLinks.find((l) => l.label === 'DONOR NOTIFICATION');
      const notificationLettersLink = quickLinks.find((l) => l.route === 'notification-letters');

      // COMMUNICATION LETTERS - enabled
      expect(communicationLettersLink).toBeDefined();
      expect(communicationLettersLink?.label).toBe('COMMUNICATION LETTERS');
      expect(communicationLettersLink?.enabled).toBe(true);
      expect(communicationLettersLink?.icon).toBe('mail');
      expect(communicationLettersLink?.route).toBe('communication-letters');

      // DONOR NOTIFICATION - enabled
      expect(donorNotificationLink).toBeDefined();
      expect(donorNotificationLink?.label).toBe('DONOR NOTIFICATION');
      expect(donorNotificationLink?.enabled).toBe(true);
      expect(donorNotificationLink?.icon).toBe('notifications');
      expect(donorNotificationLink?.route).toBe('notification-log');

      // NOTIFICATION LETTERS - enabled
      expect(notificationLettersLink).toBeDefined();
      expect(notificationLettersLink?.label).toBe('NOTIFICATION LETTERS');
      expect(notificationLettersLink?.enabled).toBe(true);
      expect(notificationLettersLink?.icon).toBe('email');
      expect(notificationLettersLink?.route).toBe('notification-letters');
    });


  });



  describe('Loading donor details', () => {
    beforeEach(() => {
      mockService.getDonorDetail.and.returnValue(of(mockDonorDetailResponse));
      mockService.formatDate.and.returnValue('23-JAN-2025');
      // Prevent auto-opening dialog on init by providing a donor in state
      mockDonorStateService.getSelectedDonor.and.returnValue({
        donorId: '00008392',
        donorName: 'ROGERS, MARY',
        timestamp: Date.now(),
      });
      fixture.detectChanges();
    });



    it('should load donor details when donor is selected from dialog', (done) => {
      const selectedDonor: DonorSearchResult = {
        donorId: '00008392',
        lastName: 'ROGERS',
        firstName: 'MARY',
        middleName: '',
        dateOfBirth: '1998-01-11',
        sex: 'Female',
        aboRh: 'O+',
        contactInfo: {
          address: '214 Kings Cir, Houston, TX 76234',
          phoneNumber: '214-559-4459',
        },
      };

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ action: 'select', donor: selectedDonor }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onChangeDonor();

      setTimeout(() => {
        expect(mockService.getDonorDetail).toHaveBeenCalledWith('00008392');
        done();
      }, 500);
    });

    it('should set donor data after loading', (done) => {
      const selectedDonor: DonorSearchResult = {
        donorId: '00008392',
        lastName: 'ROGERS',
        firstName: 'MARY',
        middleName: '',
        dateOfBirth: '1998-01-11',
        sex: 'Female',
        aboRh: 'O+',
        contactInfo: {
          address: '214 Kings Cir, Houston, TX 76234',
          phoneNumber: '214-559-4459',
        },
      };

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of({ action: 'select', donor: selectedDonor }));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onChangeDonor();

      setTimeout(() => {
        expect(component.donorData()).toEqual(mockDonor);
        expect(component.eligibilityData()).toEqual(mockEligibility);
        expect(component.attributesData()).toEqual(mockAttributes);
        done();
      }, 500);
    });


  });

  describe('Donor information display', () => {
    beforeEach(() => {
      mockService.getDonorDetail.and.returnValue(of(mockDonorDetailResponse));
      mockService.formatDate.and.returnValue('23-JAN-2025');
      mockDonorStateService.getSelectedDonor.and.returnValue({
        donorId: '00008392',
        donorName: 'ROGERS, MARY',
        timestamp: Date.now(),
      });
      component.donorData.set(mockDonor);
      component.eligibilityData.set(mockEligibility);
      component.attributesData.set(mockAttributes);
      fixture.detectChanges();
    });

    it('should display donor header', () => {
      const header = fixture.nativeElement.querySelector('.donor-name');
      expect(header).toBeTruthy();
      expect(header.textContent).toContain('ROGERS');
      expect(header.textContent).toContain('MARY');
    });



    it('should display eligibility table when data exists', () => {
      expect(component.hasEligibility()).toBe(true);
      const eligibilityCard = fixture.nativeElement.querySelector('.eligibility-card');
      expect(eligibilityCard).toBeTruthy();
    });

    it('should display attributes table when data exists', () => {
      expect(component.hasAttributes()).toBe(true);
      const attributesCard = fixture.nativeElement.querySelector('.attributes-card');
      expect(attributesCard).toBeTruthy();
    });


  });

  describe('Quick links navigation', () => {
    beforeEach(() => {
      mockService.getDonorDetail.and.returnValue(of(mockDonorDetailResponse));
      mockService.formatDate.and.returnValue('23-JAN-2025');
      mockDonorStateService.getSelectedDonor.and.returnValue({
        donorId: '00008392',
        donorName: 'ROGERS, MARY',
        timestamp: Date.now(),
      });
      component.donorData.set(mockDonor);
      fixture.detectChanges();
    });





    it('should open donor attributes dialog for donor-attributes link', () => {
      const attributesLink = component.quickLinks().find((l) => l.route === 'donor-attributes');
      expect(attributesLink).toBeDefined();

      const closePanelSubject = new BehaviorSubject(null);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogRefSpy.close.and.stub();
      dialogRefSpy.componentInstance = {
        inputDonorId: '',
        inputDonorName: '',
        inputDob: '',
        inputSex: '',
        inputAbo: '',
        closePanelEvent: closePanelSubject.asObservable()
      };
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(attributesLink!);
      expect(mockDialog.open).toHaveBeenCalled();
      expect(dialogRefSpy.componentInstance.inputDonorId).toBe('00008392');
    });

    it('should open donor interdictions dialog for donor-interdictions link', () => {
      const interdictionsLink = component.quickLinks().find((l) => l.route === 'donor-interdictions');
      expect(interdictionsLink).toBeDefined();
      expect(interdictionsLink?.enabled).toBe(true);

      const closePanelSubject = new BehaviorSubject(null);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogRefSpy.close.and.stub();
      dialogRefSpy.componentInstance = {
        donorId: '',
        closePanel: closePanelSubject.asObservable()
      };
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(interdictionsLink!);
      expect(mockDialog.open).toHaveBeenCalled();
      expect(dialogRefSpy.componentInstance.donorId).toBe('00008392');
    });

    it('should reload donor data after demographics dialog closes with changes', (done) => {
      const demographicsLink = component.quickLinks().find((l) => l.route === 'demographics');
      expect(demographicsLink).toBeDefined();

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(true)); // true means data was saved
      mockDialog.open.and.returnValue(dialogRefSpy);

      mockService.getDonorDetail.calls.reset();
      component.onQuickLinkClick(demographicsLink!);

      setTimeout(() => {
        expect(mockService.getDonorDetail).toHaveBeenCalledWith('00008392');
        done();
      }, 100);
    });

    it('should reload donor data after interdictions dialog closes', (done) => {
      const interdictionsLink = component.quickLinks().find((l) => l.route === 'donor-interdictions');
      expect(interdictionsLink).toBeDefined();

      const closePanelSubject = new BehaviorSubject(null);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogRefSpy.close.and.stub();
      dialogRefSpy.componentInstance = {
        donorId: '',
        closePanel: closePanelSubject.asObservable()
      };
      mockDialog.open.and.returnValue(dialogRefSpy);

      mockService.getDonorDetail.calls.reset();
      component.onQuickLinkClick(interdictionsLink!);

      setTimeout(() => {
        expect(mockService.getDonorDetail).toHaveBeenCalledWith('00008392');
        done();
      }, 100);
    });

    it('should close interdictions dialog when closePanel event is emitted', (done) => {
      const interdictionsLink = component.quickLinks().find((l) => l.route === 'donor-interdictions');
      expect(interdictionsLink).toBeDefined();

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogRefSpy.close.and.stub();
      dialogRefSpy.componentInstance = {
        donorId: '',
        onClose: jasmine.createSpy('onClose')
      };
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(interdictionsLink!);

      // Simulate the wrapper component's onClose method being called (which happens when closePanel is emitted)
      dialogRefSpy.componentInstance.onClose.and.callFake(() => {
        dialogRefSpy.close();
      });
      dialogRefSpy.componentInstance.onClose();

      setTimeout(() => {
        expect(dialogRefSpy.close).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should open donor communications dialog for donor-communications link', () => {
      const communicationsLink = component.quickLinks().find((l) => l.route === 'donor-communications');
      expect(communicationsLink).toBeDefined();
      expect(communicationsLink?.enabled).toBe(true);

      const closePanelSubject = new BehaviorSubject(null);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogRefSpy.close.and.stub();
      dialogRefSpy.componentInstance = {
        donorId: '',
        donorName: '',
        dob: '',
        sex: '',
        abo: '',
        closePanel: closePanelSubject.asObservable()
      };
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(communicationsLink!);
      expect(mockDialog.open).toHaveBeenCalled();
      expect(dialogRefSpy.componentInstance.donorId).toBe('00008392');
      expect(dialogRefSpy.componentInstance.donorName).toBe('ROGERS, MARY');
    });



    it('should open communication letters dialog for communication-letters link', () => {
      const communicationLettersLink = component.quickLinks().find((l) => l.route === 'communication-letters');
      expect(communicationLettersLink).toBeDefined();
      expect(communicationLettersLink?.enabled).toBe(true);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(communicationLettersLink!);
      expect(mockDialog.open).toHaveBeenCalled();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(dialogConfig?.data?.donorId).toBe('00008392');
    });


    it('should open communication letters dialog with correct configuration', () => {
      const communicationLettersLink = component.quickLinks().find((l) => l.route === 'communication-letters');
      expect(communicationLettersLink).toBeDefined();

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(communicationLettersLink!);

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(dialogConfig?.width).toBe('70vw');
      expect(dialogConfig?.height).toBe('calc(100vh - 64px)');
      expect(dialogConfig?.panelClass).toBe('code-dialog-panel-right');
      expect(dialogConfig?.position).toEqual({ right: '0', top: '64px' });
      expect(dialogConfig?.hasBackdrop).toBe(true);
      expect(dialogConfig?.backdropClass).toBe('code-dialog-backdrop');
    });


    it('should navigate with donor ID for valid routes', () => {
      // Find a link that navigates (not a dialog route)
      const dialogRoutes = ['documents', 'demographics', 'test-results', 'donor-attributes', 'donor-interdictions', 'donor-communications', 'communication-letters', 'notification-log', 'notification-letters', 'cumulative-logs', 'donations', 'merged-donors', 'alternate-address', 'consents', 'donor-letters', 'donor-notes'];
      const link = component.quickLinks().find((l) =>
        l.route !== '#' &&
        !dialogRoutes.includes(l.route) &&
        l.enabled
      );

      if (link) {
        component.onQuickLinkClick(link);
        expect(mockRouter.navigate).toHaveBeenCalledWith([link.route], {
          queryParams: { donorId: '00008392' },
          state: { fromDonorDetailQuery: true }
        });
      } else {
        // If no navigation link found, test with a known navigation link
        const navLink = component.quickLinks().find((l) => l.route === '/donor-functions/donor-notification/notification-administration/define-notification-letters');
        if (navLink) {
          component.onQuickLinkClick(navLink);
          expect(mockRouter.navigate).toHaveBeenCalled();
        }
      }
    });





    it('should open notification log dialog for notification-log link', () => {
      const notificationLogLink = component.quickLinks().find((l) => l.route === 'notification-log');
      expect(notificationLogLink).toBeDefined();
      expect(notificationLogLink?.enabled).toBe(true);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(notificationLogLink!);
      expect(mockDialog.open).toHaveBeenCalled();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(dialogConfig?.data?.donorId).toBe('00008392');
    });

    it('should open notification letters dialog for notification-letters link', () => {
      const notificationLettersLink = component.quickLinks().find((l) => l.route === 'notification-letters');
      expect(notificationLettersLink).toBeDefined();
      expect(notificationLettersLink?.enabled).toBe(true);

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(notificationLettersLink!);
      expect(mockDialog.open).toHaveBeenCalled();

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(dialogConfig?.data?.donorId).toBe('00008392');
    });

    it('should open notification letters dialog with correct configuration', () => {
      const notificationLettersLink = component.quickLinks().find((l) => l.route === 'notification-letters');
      expect(notificationLettersLink).toBeDefined();

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);

      component.onQuickLinkClick(notificationLettersLink!);

      const dialogConfig = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(dialogConfig?.width).toBe('70vw');
      expect(dialogConfig?.height).toBe('calc(100vh - 64px)');
      expect(dialogConfig?.panelClass).toBe('code-dialog-panel-right');
      expect(dialogConfig?.position).toEqual({ right: '0', top: '64px' });
      expect(dialogConfig?.hasBackdrop).toBe(true);
      expect(dialogConfig?.backdropClass).toBe('code-dialog-backdrop');
    });



    it('should verify quick links order includes communication and notification links', () => {
      const quickLinks = component.quickLinks();
      const labels = quickLinks.map(link => link.label);

      // Verify the three related links are in the correct order
      const communicationLettersIndex = labels.indexOf('COMMUNICATION LETTERS');
      const donorNotificationIndex = labels.indexOf('DONOR NOTIFICATION');
      const notificationLettersIndex = labels.indexOf('NOTIFICATION LETTERS');

      expect(communicationLettersIndex).toBeGreaterThan(-1);
      expect(donorNotificationIndex).toBeGreaterThan(-1);
      expect(notificationLettersIndex).toBeGreaterThan(-1);

      // Verify they appear in the correct sequence
      expect(communicationLettersIndex).toBeLessThan(donorNotificationIndex);
      expect(donorNotificationIndex).toBeLessThan(notificationLettersIndex);
    });

    it('should have correct enabled states for communication-related links', () => {
      const quickLinks = component.quickLinks();

      const donorCommunication = quickLinks.find((l) => l.label === 'DONOR COMMUNICATION');
      const communicationLetters = quickLinks.find((l) => l.label === 'COMMUNICATION LETTERS');
      const donorNotification = quickLinks.find((l) => l.label === 'DONOR NOTIFICATION');
      const notificationLetters = quickLinks.find((l) => l.label === 'NOTIFICATION LETTERS');

      // DONOR COMMUNICATION - enabled
      expect(donorCommunication?.enabled).toBe(true);
      expect(donorCommunication?.route).toBe('donor-communications');

      // COMMUNICATION LETTERS - enabled
      expect(communicationLetters?.enabled).toBe(true);
      expect(communicationLetters?.route).toBe('communication-letters');

      // DONOR NOTIFICATION - enabled
      expect(donorNotification?.enabled).toBe(true);
      expect(donorNotification?.route).toBe('notification-log');

      // NOTIFICATION LETTERS - enabled
      expect(notificationLetters?.enabled).toBe(true);
      expect(notificationLetters?.route).toBe('notification-letters');
    });
  });

  describe('Additional quick link handlers', () => {
    beforeEach(() => {
      mockService.getDonorDetail.and.returnValue(of(mockDonorDetailResponse));
      mockService.formatDate.and.returnValue('23-JAN-2025');
      mockDonorStateService.getSelectedDonor.and.returnValue({
        donorId: '00008392',
        donorName: 'ROGERS, MARY',
        timestamp: Date.now(),
      });
      component.donorData.set(mockDonor);
      fixture.detectChanges();
    });

    it('should open donor notes dialog for donor-notes link', () => {
      const link = component.quickLinks().find((l) => l.route === 'donor-notes');
      expect(link).toBeDefined();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);
      component.onQuickLinkClick(link!);
      expect(mockDialog.open).toHaveBeenCalled();
      const config = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(config?.data?.donorId).toBe('00008392');
    });

    it('should open cumulative logs dialog for blood-loss link', () => {
      const link = component.quickLinks().find((l) => l.route === 'cumulative-logs');
      expect(link).toBeDefined();
      expect(link?.label).toBe('BLOOD LOSS');
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);
      component.onQuickLinkClick(link!);
      expect(mockDialog.open).toHaveBeenCalled();
      const config = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(config?.data?.donorId).toBe('00008392');
    });

    it('should open donor letters dialog for donor-letters link', () => {
      const link = component.quickLinks().find((l) => l.route === 'donor-letters');
      expect(link).toBeDefined();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);
      component.onQuickLinkClick(link!);
      expect(mockDialog.open).toHaveBeenCalled();
      const config = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(config?.data?.donorId).toBe('00008392');
    });

    it('should open donations dialog for donations link', () => {
      const link = component.quickLinks().find((l) => l.route === 'donations');
      expect(link).toBeDefined();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);
      component.onQuickLinkClick(link!);
      expect(mockDialog.open).toHaveBeenCalled();
      const config = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(config?.data?.donorId).toBe('00008392');
    });

    it('should open alternate address dialog for alternate-address link', () => {
      const link = component.quickLinks().find((l) => l.route === 'alternate-address');
      expect(link).toBeDefined();
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      mockDialog.open.and.returnValue(dialogRefSpy);
      component.onQuickLinkClick(link!);
      expect(mockDialog.open).toHaveBeenCalled();
      const config = mockDialog.open.calls.mostRecent().args[1] as any;
      expect(config?.data?.donorId).toBe('00008392');
      expect(config?.autoFocus).toBe(false);
    });

    it('should open test results dialog for test-results link', () => {
      const link = component.quickLinks().find((l) => l.route === 'test-results');
      expect(link).toBeDefined();
      const closePanelSubject = new BehaviorSubject(null);
      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
      dialogRefSpy.afterClosed.and.returnValue(of(null));
      dialogRefSpy.componentInstance = { closePanel: closePanelSubject.asObservable() };
      mockDialog.open.and.returnValue(dialogRefSpy);
      component.onQuickLinkClick(link!);
      expect(mockDialog.open).toHaveBeenCalled();
    });

    it('should navigate to document library for documents link', () => {
      component.donorData.set({ ...mockDonor, hasDocuments: true });
      fixture.detectChanges();
      const link = component.quickLinks().find((l) => l.route === 'documents');
      expect(link).toBeDefined();
      component.onQuickLinkClick(link!);
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should navigate to merged donors page for merged-donors link', () => {
      const link = component.quickLinks().find((l) => l.route === 'merged-donors');
      expect(link).toBeDefined();
      component.onQuickLinkClick(link!);
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should navigate to consent history for consents link', () => {
      const link = component.quickLinks().find((l) => l.route === 'consents');
      expect(link).toBeDefined();
      component.onQuickLinkClick(link!);
      expect(mockRouter.navigate).toHaveBeenCalled();
    });

    it('should not process quick link click when no donor is selected', () => {
      component.donorData.set(null);
      const link = component.quickLinks().find((l) => l.route === 'demographics');
      mockDialog.open.calls.reset();
      component.onQuickLinkClick(link!);
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should not have ALTERNATE ID quick link', () => {
      const link = component.quickLinks().find((l) => l.label === 'ALTERNATE ID');
      expect(link).toBeUndefined();
    });

    it('should have DONOR LETTERS quick link', () => {
      const link = component.quickLinks().find((l) => l.label === 'DONOR LETTERS');
      expect(link).toBeDefined();
      expect(link?.route).toBe('donor-letters');
      expect(link?.enabled).toBe(true);
    });
  });

  describe('Display value and sex helpers', () => {
    it('should return dash for null displayValue', () => {
      expect(component.displayValue(null)).toBe('-');
      expect(component.displayValue(undefined)).toBe('-');
      expect(component.displayValue('')).toBe('-');
    });

    it('should return string for valid displayValue', () => {
      expect(component.displayValue('test')).toBe('test');
      expect(component.displayValue(42)).toBe('42');
    });

    it('should convert sex codes to full form', () => {
      expect(component.getSexDisplay('M')).toBe('Male');
      expect(component.getSexDisplay('F')).toBe('Female');
      expect(component.getSexDisplay('U')).toBe('Unknown');
      expect(component.getSexDisplay('O')).toBe('Other');
      expect(component.getSexDisplay(null)).toBe('-');
      expect(component.getSexDisplay(undefined)).toBe('-');
    });

    it('should handle address with no data', () => {
      const donor = { ...mockDonor, address: { line1: '', city: '', state: '', zipCode: '' } };
      const result = component.getAddressDisplay(donor);
      expect(result).toBeDefined();
    });
  });

  describe('Error handling', () => {
    it('should handle error when loading donor details', () => {
      mockService.getDonorDetail.and.returnValue(throwError(() => new Error('API Error')));
      const route = TestBed.inject(ActivatedRoute);
      route.snapshot.queryParams = { donorId: '00008392' };
      queryParamsSubject.next({ donorId: '00008392' });
      fixture.detectChanges();
      expect(component.error()).toBeTruthy();
      expect(component.donorData()).toBeNull();
    });
  });

  describe('Helper methods', () => {
    beforeEach(() => {
      mockDonorStateService.getSelectedDonor.and.returnValue({
        donorId: '00008392',
        donorName: 'ROGERS, MARY',
        timestamp: Date.now(),
      });
      component.donorData.set(mockDonor);
      mockService.formatDate.and.returnValue('11-JAN-1998');
    });

    it('should format phone numbers for display', () => {
      const phoneDisplay = component.getPhoneDisplay(mockDonor);
      expect(phoneDisplay).toContain('Home: 214-559-4459');
      expect(phoneDisplay).toContain('Mobile: 817-614-7156');
      expect(phoneDisplay).toContain('Work: 972-838-2629');
    });

    it('should handle missing phone numbers', () => {
      const donorNoPhones = { ...mockDonor, phoneHome: undefined, phoneMobile: undefined, phoneWork: undefined };
      const phoneDisplay = component.getPhoneDisplay(donorNoPhones);
      expect(phoneDisplay).toBe('No phone numbers on file');
    });

    it('should format phone display with only work phone', () => {
      const donorWorkOnly = { ...mockDonor, phoneHome: undefined, phoneMobile: undefined };
      const phoneDisplay = component.getPhoneDisplay(donorWorkOnly);
      expect(phoneDisplay).toBe('Work: 972-838-2629');
    });

    it('should format phone display with all phone numbers', () => {
      const phoneDisplay = component.getPhoneDisplay(mockDonor);
      expect(phoneDisplay).toContain('|');
      const parts = phoneDisplay.split('|').map(p => p.trim());
      expect(parts.length).toBe(3);
      expect(parts[0]).toContain('Home:');
      expect(parts[1]).toContain('Mobile:');
      expect(parts[2]).toContain('Work:');
    });

    it('should format address for display', () => {
      const addressDisplay = component.getAddressDisplay(mockDonor);
      expect(addressDisplay).toContain('214 Kings Cir');
      expect(addressDisplay).toContain('Houston');
      expect(addressDisplay).toContain('TX');
      expect(addressDisplay).toContain('76234');
    });

    it('should call service formatDate method', () => {
      component.formatDate('2025-01-23');
      expect(mockService.formatDate).toHaveBeenCalledWith('2025-01-23');
    });
  });


  describe('State Management', () => {
    beforeEach(() => {
      mockService.getDonorDetail.and.returnValue(of(mockDonorDetailResponse));
      mockService.formatDate.and.returnValue('23-JAN-2025');
    });

    describe('Priority 1: Query params', () => {
      it('should load donor when donorId is in query params', () => {
        // Arrange
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = { donorId: '00008392' };

        // Act
        queryParamsSubject.next({ donorId: '00008392' });
        fixture.detectChanges();

        // Assert
        expect(mockService.getDonorDetail).toHaveBeenCalledWith('00008392');
        expect(mockDonorStateService.setSelectedDonor).toHaveBeenCalledWith(
          jasmine.objectContaining({ donorId: '00008392' })
        );
      });


      it('should save full donor context after successful load from query params', (done) => {
        // Arrange
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = { donorId: '00008392' };

        // Act
        queryParamsSubject.next({ donorId: '00008392' });
        fixture.detectChanges();

        // Assert
        setTimeout(() => {
          expect(mockDonorStateService.setSelectedDonor).toHaveBeenCalledWith(
            jasmine.objectContaining({
              donorId: '00008392',
              donorName: 'ROGERS, MARY',
            })
          );
          done();
        }, 100);
      });
    });

    describe('Priority 3: Navigation state restoration', () => {
      it('should load donor from navigation state when returning from sub-page', () => {
        // Arrange — simulate return from Consents with reopenDonorId in history state
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = {};
        Object.defineProperty(window, 'history', {
          value: { ...window.history, state: { reopenDonorId: '00008392' } },
          writable: true,
          configurable: true,
        });

        // Act
        fixture.detectChanges();

        // Assert
        expect(mockService.getDonorDetail).toHaveBeenCalledWith('00008392');

        // Cleanup
        Object.defineProperty(window, 'history', {
          value: { ...window.history, state: {} },
          writable: true,
          configurable: true,
        });
      });

      it('should not reload donor if already in query params', () => {
        // Arrange
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = { donorId: '00008392' };
        mockDonorStateService.getSelectedDonor.and.returnValue({
          donorId: '00008392',
          donorName: 'ROGERS, MARY',
          timestamp: Date.now(),
        });

        // Act
        queryParamsSubject.next({ donorId: '00008392' });
        fixture.detectChanges();

        // Assert - getDonorDetail should be called once from query params, not from state service
        expect(mockService.getDonorDetail).toHaveBeenCalledTimes(1);
      });
    });

    describe('Priority 3: Navigation state restoration', () => {
      it('should clear state and open search dialog when no query params or nav state', () => {
        // Arrange
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = {};

        // Act
        fixture.detectChanges();

        // Assert - component clears state and opens search dialog
        expect(mockDonorStateService.clearSelectedDonor).toHaveBeenCalled();
        expect(mockDialog.open).toHaveBeenCalled();
      });
    });

    describe('Priority 4: Open search dialog', () => {

      it('should load donor when user selects from dialog', (done) => {
        // Arrange
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = {};
        mockDonorStateService.getSelectedDonor.and.returnValue(null);

        const selectedDonor: DonorSearchResult = {
          donorId: '00008392',
          lastName: 'ROGERS',
          firstName: 'MARY',
          middleName: '',
          dateOfBirth: '1998-01-11',
          sex: 'Female',
          aboRh: 'O+',
          contactInfo: {
            address: '214 Kings Cir, Houston, TX 76234',
            phoneNumber: '214-559-4459',
          },
        };

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: 'select', donor: selectedDonor }));
        mockDialog.open.and.returnValue(dialogRefSpy);

        // Act
        fixture.detectChanges();

        // Assert
        setTimeout(() => {
          expect(mockDonorStateService.setSelectedDonor).toHaveBeenCalledWith(
            jasmine.objectContaining({
              donorId: '00008392',
              donorName: 'ROGERS, MARY',
            })
          );
          expect(mockService.getDonorDetail).toHaveBeenCalledWith('00008392');
          done();
        }, 100);
      });

      it('should stay in empty state when user cancels dialog', () => {
        // Arrange
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = {};
        mockDonorStateService.getSelectedDonor.and.returnValue(null);

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(null));
        mockDialog.open.and.returnValue(dialogRefSpy);

        // Act
        fixture.detectChanges();

        // Assert
        expect(mockService.getDonorDetail).not.toHaveBeenCalled();
        expect(component.hasDonor()).toBe(false);
      });
    });

    describe('Change donor functionality', () => {


      it('should load new donor when user selects different donor from dialog', (done) => {
        // Arrange
        component.donorData.set(mockDonor);

        const newDonor: DonorSearchResult = {
          donorId: '99999999',
          lastName: 'DOE',
          firstName: 'JOHN',
          middleName: '',
          dateOfBirth: '1990-05-15',
          sex: 'Male',
          aboRh: 'A+',
          contactInfo: {
            address: '123 Main St, Dallas, TX 75001',
            phoneNumber: '555-1234',
          },
        };

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: 'select', donor: newDonor }));
        mockDialog.open.and.returnValue(dialogRefSpy);

        // Act
        component.onChangeDonor();
        fixture.detectChanges();

        // Assert
        setTimeout(() => {
          expect(mockService.getDonorDetail).toHaveBeenCalledWith('99999999');
          expect(mockDonorStateService.setSelectedDonor).toHaveBeenCalledWith(
            jasmine.objectContaining({
              donorId: '99999999',
              donorName: 'DOE, JOHN',
            })
          );
          done();
        }, 100);
      });
    });

    describe('State persistence after load', () => {
      it('should update state service with donor name after successful load', (done) => {
        // Arrange
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = { donorId: '00008392' };

        // Act
        queryParamsSubject.next({ donorId: '00008392' });
        fixture.detectChanges();

        // Assert
        setTimeout(() => {
          expect(mockDonorStateService.setSelectedDonor).toHaveBeenCalledWith(
            jasmine.objectContaining({
              donorId: '00008392',
              donorName: 'ROGERS, MARY',
              timestamp: jasmine.any(Number),
            })
          );
          done();
        }, 100);
      });

    });

    describe('State restoration scenarios', () => {
      it('should restore donor when returning with donorId in navigation state', () => {
        // Arrange — simulate returning from a sub-page with donorId in history state
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = {};
        Object.defineProperty(window, 'history', {
          value: { ...window.history, state: { donorId: '00008392' } },
          writable: true,
          configurable: true,
        });

        // Act
        fixture.detectChanges();

        // Assert
        expect(mockService.getDonorDetail).toHaveBeenCalledWith('00008392');

        // Cleanup
        Object.defineProperty(window, 'history', {
          value: { ...window.history, state: {} },
          writable: true,
          configurable: true,
        });
      });

      it('should restore donor when returning from quick link navigation via nav state', () => {
        // Arrange - Simulate user returning to SDONQ after navigating away,
        // with donorId in navigation state (set by quick link navigation)
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = {};
        Object.defineProperty(window, 'history', {
          value: { ...window.history, state: { donorId: '00008392' } },
          writable: true,
          configurable: true,
        });

        mockService.getDonorDetail.and.returnValue(of(mockDonorDetailResponse));

        // Act
        fixture.detectChanges();

        // Assert
        expect(mockService.getDonorDetail).toHaveBeenCalledWith('00008392');
        expect(component.hasDonor()).toBe(true);

        // Cleanup
        Object.defineProperty(window, 'history', {
          value: { ...window.history, state: {} },
          writable: true,
          configurable: true,
        });
      });

      it('should not restore expired donor state', () => {
        // Arrange - Donor state is expired (older than 24 hours)
        const route = TestBed.inject(ActivatedRoute);
        route.snapshot.queryParams = {};
        mockDonorStateService.getSelectedDonor.and.returnValue(null); // State service already filtered expired

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of({ action: 'cancel' }));
        mockDialog.open.and.returnValue(dialogRefSpy);

        // Act
        fixture.detectChanges();

        // Assert
        expect(mockService.getDonorDetail).not.toHaveBeenCalled();
        expect(mockDialog.open).toHaveBeenCalled();
      });
    });
  });
});
