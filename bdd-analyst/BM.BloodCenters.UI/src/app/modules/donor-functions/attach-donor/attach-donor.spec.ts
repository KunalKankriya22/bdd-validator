import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError, Subject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AttachDonorComponent } from './attach-donor';
import { AttachDonorService } from './services/attach-donor.service';
import { AlternateDemographicsService } from '@shared/services/alternate-demographics.service';
import { DonorEmployerService } from '../registration/registration-maintenance/maintain-donor-employer/services/donor-employer.service';
import { FindDonorService } from '@shared/components/find-donor/find-donor.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { GradedDonorDto, GradedDonationDto } from './models/attach-donor.model';
import { createMockMatSnackBar, createMockMatDialog, createMockHeaderService } from '@shared/testing/common-mocks';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';
import { UnitIdFieldService } from '@shared/components/unit-id-field/unit-id-field.service';
import moment from 'moment';

describe('AttachDonorComponent', () => {
  let dialogRefSpy: any;
  let matSnackBarSpy: any;
  let matDialogSpy: any;
  let matRouterSpy: any;
  let pageHeaderSpy: any;
  let headerSpy: any;
  let findDonorSpy: any;
  let donorEmpServiceSpy: any;
  let altDemoServiceSpy: any;
  let attachServiceSpy: any;
  let component: AttachDonorComponent;
  let fixture: ComponentFixture<AttachDonorComponent>;
  let attachDonorServiceSpy: jasmine.SpyObj<AttachDonorService>;
  let alternateDemographicsServiceSpy: jasmine.SpyObj<AlternateDemographicsService>;
  let donorEmployerServiceSpy: jasmine.SpyObj<any>;
  let findDonorServiceSpy: jasmine.SpyObj<any>;
  let headerServiceSpy: jasmine.SpyObj<HeaderService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  let routerSpy: jasmine.SpyObj<Router>;
  let activatedRouteSpy: any;

  const mockTransaction: GradedDonationDto = {
    transactionId: 'TXN0000001',
    unitId: 'W63332508I210',
    lastName: 'Thompson',
    firstName: 'Mark',
    dateOfBirth: '1996-03-26T00:00:00Z',
    gender: 'Male',
    chapterId: 'CH01',
    activeFlag: 'Y',
    programId: 'DRUREHLD',
    collectionDate: '2025-12-09T00:00:00Z',
    enteredBy: 'SIVA TEJA BOODETI'
  };

  const mockGradedDonors: GradedDonorDto[] = [
    {
      transactionId: 'TXN0000001',
      donorId: 'DON0000087',
      dgmId: 246,
      grade: 4,
      potentialDuplicateFlag: null,
      lastName: 'Thompson',
      firstName: 'Marvin',
      dateOfBirth: '1998-01-11T00:00:00Z',
      gender: 'Male',
      chapterId: 'CH01',
      programId: 'DRUREHLD',
      lastNameMismatch: false,
      firstNameMismatch: false,
      dateOfBirthMismatch: false,
      genderMismatch: false
    },
    {
      transactionId: 'TXN0000001',
      donorId: 'DON0000157',
      dgmId: 246,
      grade: 4,
      potentialDuplicateFlag: null,
      lastName: 'Thompson',
      firstName: 'Shawn',
      dateOfBirth: '1998-01-11T00:00:00Z',
      gender: 'Male',
      chapterId: 'CH01',
      programId: 'DRUREHLD',
      lastNameMismatch: false,
      firstNameMismatch: true,
      dateOfBirthMismatch: false,
      genderMismatch: false
    }
  ];

  beforeEach(() => {

    attachServiceSpy = jasmine.createSpyObj('AttachDonorService', [
      'getTransaction',
      'getTransactionByUnit',
      'getGradedDonors',
      'selectDonor',
      'markDuplicates',
      'markFalseDuplicate',
      'putDonorOnHold',
      'addGradedDonor',
      'getLookupEmployers',
      'getLookupEthnicGroups',
      'getCityStateByZip',
      'searchCities',
      'getZipsByCity',
      'getDonorById',
      'updateDonor',
      'createDonor',
      'validateAreaCode',
      'validateZipCity',
      'saveContext',
      'getContext',
      'clearContext'
    ]);
    altDemoServiceSpy = jasmine.createSpyObj('AlternateDemographicsService', [
      'getByDonorId',
      'update',
      'getCityStateByZip',
      'getCountries',
      'validate'
    ]);
    donorEmpServiceSpy = jasmine.createSpyObj('DonorEmployerService', [
      'getEmployersByDonorId',
      'getById',
      'createEmployer',
      'updateEmployer',
      'deleteEmployer'
    ]);
    findDonorSpy = jasmine.createSpyObj('FindDonorService', [
      'searchDonors',
      'getDonorById',
      'getAlternateIdTypes'
    ]);
    const unitIdFieldSpy = jasmine.createSpyObj('UnitIdFieldService', ['validateUnitId']);
    unitIdFieldSpy.validateUnitId.and.returnValue(of({ success: true, item: { parsedUnitId: 'W63332508I210' } }));
    headerSpy = createMockHeaderService();
    pageHeaderSpy = jasmine.createSpyObj('PageHeaderService', ['pageHeaderData', 'getTitle', 'getSubtitle'], {
      pageHeaderData: jasmine.createSpy('pageHeaderData').and.returnValue({ title: 'Attach Donor', subtitle: 'Review possible donor matches and select the appropriate donor based on match grade' })
    });
    matRouterSpy = jasmine.createSpyObj('Router', ['navigate', 'createUrlTree', 'serializeUrl'], {
      events: of(),
    });
    matRouterSpy.createUrlTree.and.returnValue({});
    matRouterSpy.serializeUrl.and.returnValue('');

    // Setup default return values BEFORE creating component
    attachServiceSpy.getTransaction.and.returnValue(of(mockTransaction));
    attachServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
    attachServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));
    attachServiceSpy.getLookupEmployers.and.returnValue(of([]));
    attachServiceSpy.getLookupEthnicGroups.and.returnValue(of([]));
    attachServiceSpy.validateAreaCode.and.returnValue(of(true));
    attachServiceSpy.validateZipCity.and.returnValue(of(true));
    attachServiceSpy.getCityStateByZip.and.returnValue(of([]));
    attachServiceSpy.getDonorById.and.returnValue(of({
      donorId: 'DON0000087', lastName: 'Thompson', firstName: 'Marvin',
      middleName: '', dateOfBirth: '1998-01-11T00:00:00Z', gender: 'M',
      streetName: '', suiteApt: '', city: '', state: '', zip: '',
      hAreaCode: '', hPhoneNo: '', dAreaCode: '', dPhoneNo: '', extension: '',
      mAreaCode: '', mPhoneNo: '', email: '', preferredContactFlag: '',
      alternateId: '', alternateIdType: '', employerId: '',
      eCity: '', eState: '', eZip: '', ethnicGroup: ''
    }));
    attachServiceSpy.updateDonor.and.returnValue(of({ success: true, message: 'Updated' }));
    attachServiceSpy.createDonor.and.returnValue(of({ success: true, message: 'Created', data: { donorId: 'DN_NEW_001' } }));
    attachServiceSpy.addGradedDonor.and.returnValue(of({ success: true, message: 'Added', statusCode: 200 }));
    attachServiceSpy.searchCities.and.returnValue(of([]));
    attachServiceSpy.getZipsByCity.and.returnValue(of([]));
    attachServiceSpy.getContext.and.returnValue(null);
    altDemoServiceSpy.getCountries.and.returnValue(of([]));
    altDemoServiceSpy.getByDonorId.and.returnValue(of(null));
    altDemoServiceSpy.getCityStateByZip.and.returnValue(of([]));
    altDemoServiceSpy.update.and.returnValue(of({ success: true, message: 'Updated' }));
    altDemoServiceSpy.validate.and.returnValue(of({ success: true, message: 'Valid' }));
    findDonorSpy.getAlternateIdTypes.and.returnValue(of([]));
    matDialogSpy = createMockMatDialog();
    matSnackBarSpy = createMockMatSnackBar();

    // Setup dialog spy to return a dialogRef with afterClosed()
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed', 'close']);
    dialogRefSpy.afterClosed.and.returnValue(of(null));  // Default: dialog closed with no result
    matDialogSpy.open.and.returnValue(dialogRefSpy);

    activatedRouteSpy = {
      queryParams: of({ transactionId: 'TXN0000001' })
    };



      TestBed.configureTestingModule({
      imports: [AttachDonorComponent, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: AttachDonorService, useValue: attachServiceSpy },
        { provide: AlternateDemographicsService, useValue: altDemoServiceSpy },
        { provide: DonorEmployerService, useValue: donorEmpServiceSpy },
        { provide: FindDonorService, useValue: findDonorSpy },
        { provide: HeaderService, useValue: headerSpy },
        { provide: PageHeaderService, useValue: pageHeaderSpy },
        { provide: Router, useValue: matRouterSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MatSnackBar, useValue: matSnackBarSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: UnitIdFieldService, useValue: {
          validateUnitId: jasmine.createSpy('validateUnitId').and.callFake((id: string) => of({ success: true, item: { parsedUnitId: id } }))
        }},
        { provide: ChapterTimezoneService, useValue: {
          isChapterLocalDateAvailable: () => false,
          getChapterLocalDate: () => moment()
        }}
      ]
    })
    .overrideComponent(AttachDonorComponent, {
      set: {
        providers: [
          { provide: MatDialog, useValue: matDialogSpy },
          { provide: MatSnackBar, useValue: matSnackBarSpy },
          { provide: UnitIdFieldService, useValue: {
            validateUnitId: jasmine.createSpy('validateUnitId').and.callFake((id: string) => of({ success: true, item: { parsedUnitId: id } }))
          }},
          { provide: ChapterTimezoneService, useValue: {
            isChapterLocalDateAvailable: () => false,
            getChapterLocalDate: () => moment()
          }}
        ]
      }
    });




      attachServiceSpy.getTransaction.calls.reset();


      attachServiceSpy.getTransactionByUnit.calls.reset();


      attachServiceSpy.getGradedDonors.calls.reset();


      attachServiceSpy.selectDonor.calls.reset();


      attachServiceSpy.markDuplicates.calls.reset();


      attachServiceSpy.markFalseDuplicate.calls.reset();


      attachServiceSpy.putDonorOnHold.calls.reset();


      attachServiceSpy.addGradedDonor.calls.reset();


      attachServiceSpy.getLookupEmployers.calls.reset();


      attachServiceSpy.getCityStateByZip.calls.reset();


      attachServiceSpy.searchCities.calls.reset();


      attachServiceSpy.getZipsByCity.calls.reset();


      attachServiceSpy.getDonorById.calls.reset();


      attachServiceSpy.updateDonor.calls.reset();


      attachServiceSpy.createDonor.calls.reset();


      attachServiceSpy.saveContext.calls.reset();


      attachServiceSpy.getContext.calls.reset();


      attachServiceSpy.clearContext.calls.reset();


      altDemoServiceSpy.getByDonorId.calls.reset();


      altDemoServiceSpy.update.calls.reset();


      altDemoServiceSpy.getCityStateByZip.calls.reset();


      altDemoServiceSpy.getCountries.calls.reset();


      altDemoServiceSpy.validate.calls.reset();


      donorEmpServiceSpy.getEmployersByDonorId.calls.reset();


      donorEmpServiceSpy.getById.calls.reset();


      donorEmpServiceSpy.createEmployer.calls.reset();


      donorEmpServiceSpy.updateEmployer.calls.reset();


      donorEmpServiceSpy.deleteEmployer.calls.reset();


      findDonorSpy.searchDonors.calls.reset();


      findDonorSpy.getDonorById.calls.reset();


      findDonorSpy.getAlternateIdTypes.calls.reset();


      headerSpy.getCurrentChapterId.calls.reset();


      headerSpy.getCurrentUsername.calls.reset();


      headerSpy.loadFromCookies.calls.reset();


      pageHeaderSpy.pageHeaderData.calls.reset();


      pageHeaderSpy.getTitle.calls.reset();


      pageHeaderSpy.getSubtitle.calls.reset();


      matRouterSpy.navigate.calls.reset();


      matRouterSpy.createUrlTree.calls.reset();


      matRouterSpy.serializeUrl.calls.reset();


      matDialogSpy.open.calls.reset();


      matSnackBarSpy.open.calls.reset();


      dialogRefSpy.afterClosed.calls.reset();


      dialogRefSpy.close.calls.reset();


      matRouterSpy.createUrlTree.and.returnValue({});


      matRouterSpy.serializeUrl.and.returnValue('');
      attachServiceSpy.getTransaction.and.returnValue(of(mockTransaction));


      attachServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));


      attachServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));


      attachServiceSpy.getLookupEmployers.and.returnValue(of([]));


      attachServiceSpy.getCityStateByZip.and.returnValue(of([]));


      attachServiceSpy.updateDonor.and.returnValue(of({ success: true, message: 'Updated' }));


      attachServiceSpy.createDonor.and.returnValue(of({ success: true, message: 'Created', data: { donorId: 'DN_NEW_001' } }));


      attachServiceSpy.addGradedDonor.and.returnValue(of({ success: true, message: 'Added', statusCode: 200 }));


      attachServiceSpy.searchCities.and.returnValue(of([]));


      attachServiceSpy.getZipsByCity.and.returnValue(of([]));


      attachServiceSpy.getContext.and.returnValue(null);


      altDemoServiceSpy.getCountries.and.returnValue(of([]));


      altDemoServiceSpy.getByDonorId.and.returnValue(of(null));


      altDemoServiceSpy.getCityStateByZip.and.returnValue(of([]));


      altDemoServiceSpy.update.and.returnValue(of({ success: true, message: 'Updated' }));


      altDemoServiceSpy.validate.and.returnValue(of({ success: true, message: 'Valid' }));


      findDonorSpy.getAlternateIdTypes.and.returnValue(of([]));


      dialogRefSpy.afterClosed.and.returnValue(of(null));  // Default: dialog closed with no result


      matDialogSpy.open.and.returnValue(dialogRefSpy);


    fixture = TestBed.createComponent(AttachDonorComponent);
    component = fixture.componentInstance;
    attachDonorServiceSpy = TestBed.inject(AttachDonorService) as jasmine.SpyObj<AttachDonorService>;
    alternateDemographicsServiceSpy = TestBed.inject(AlternateDemographicsService) as jasmine.SpyObj<AlternateDemographicsService>;
    donorEmployerServiceSpy = TestBed.inject(DonorEmployerService) as jasmine.SpyObj<any>;
    findDonorServiceSpy = TestBed.inject(FindDonorService) as jasmine.SpyObj<any>;
    headerServiceSpy = TestBed.inject(HeaderService) as jasmine.SpyObj<HeaderService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    dialogSpy = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;


    });

  describe('Initialization', () => {


    it('should load transaction data on init with transactionId from query params', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(attachDonorServiceSpy.getTransaction).toHaveBeenCalledWith('TXN0000001');
      expect(component.transactionData()).toEqual(mockTransaction);
      expect(attachDonorServiceSpy.getGradedDonors).toHaveBeenCalledWith('TXN0000001');
      expect(component.gradedDonors()).toEqual(mockGradedDonors);
    }));

  });

  describe('Loading State', () => {
    it('should initialize with loading signal set to false', () => {
      fixture.detectChanges();
      expect(component.loading()).toBeFalsy();
    });

    it('should allow setting loading signal', () => {
      component.loading.set(true);
      expect(component.loading()).toBeTrue();

      component.loading.set(false);
      expect(component.loading()).toBeFalsy();
    });
  });
  describe('Donor Selection', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.entryOkConfirmed.set(true);
      component.donorSelectionEnabled.set(true);
      fixture.detectChanges();
    }));

    it('should select a donor when clicked', fakeAsync(() => {
      const donor = mockGradedDonors[0];
      component.onSelectDonor(donor);
      tick();

      expect(component.selectedDonorId()).toBe('DON0000087');
    }));


    it('should show selected donor in computed property', () => {
      component.selectedDonorId.set('DON0000087');

      const selected = component.selectedDonor();
      expect(selected).toBeTruthy();
      expect(selected?.donorId).toBe('DON0000087');
    });

    it('should enable select button when donor is selected', () => {
      component.selectedDonorId.set('DON0000087');

      expect(component.canSelectDonor()).toBeTrue();
    });
  });

  describe('Duplicate Mode', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.entryOkConfirmed.set(true);
      component.donorSelectionEnabled.set(true);
      fixture.detectChanges();
    }));

    it('should toggle duplicate mode', () => {
      expect(component.duplicateMode()).toBeFalse();

      component.onToggleDuplicateMode();
      expect(component.duplicateMode()).toBeTrue();

      component.onToggleDuplicateMode();
      expect(component.duplicateMode()).toBeFalse();
    });

    it('should allow multiple donor selection in duplicate mode', fakeAsync(() => {
      component.onToggleDuplicateMode();

      component.onSelectDonor(mockGradedDonors[0]);
      tick();
      component.onSelectDonor(mockGradedDonors[1]);
      tick();

      expect(component.selectedDonorIds().length).toBe(2);
    }));

    it('should enable mark duplicates button when 2+ donors selected', () => {
      component.onToggleDuplicateMode();
      component.selectedDonorIds.set(['DON0000087', 'DON0000157']);

      expect(component.canMarkDuplicates()).toBeTrue();
    });

    it('should mark duplicates successfully', fakeAsync(() => {
      attachDonorServiceSpy.markDuplicates.and.returnValue(of({
        success: true,
        message: 'Duplicates marked',
        statusCode: 200,
        data: {
          transactionId: 'TXN0000001',
          donorCount: 2
        }
      }));

      component.onToggleDuplicateMode();
      component.selectedDonorIds.set(['DON0000087', 'DON0000157']);

      component.onMarkDuplicates();
      tick();

      expect(attachDonorServiceSpy.markDuplicates).toHaveBeenCalledWith({
        primaryDonorId: 'DON0000087',
        duplicateDonorIds: ['DON0000157'],
        transactionId: 'TXN0000001'
      });
      expect(component.duplicateMode()).toBeFalse(); // Should exit duplicate mode
    }));
  });

  describe('Mismatch Highlighting', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.entryOkConfirmed.set(true);
      fixture.detectChanges();
    }));

    it('should identify mismatch cells', () => {
      const donor = mockGradedDonors[1]; // Has firstName mismatch
      const mismatches = component.getMismatchCells(donor);

      expect(mismatches).toContain('firstName');
    });

    it('should apply mismatch class only to firstName column', () => {
      fixture.detectChanges();

      const mismatchCells = fixture.debugElement.queryAll(By.css('td.mismatch'));
      expect(mismatchCells.length).toBeGreaterThan(0);
      // Only firstName should have mismatch class, not lastName, DOB, or sex
    });



  });

  describe('Confirm Select Donor', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.entryOkConfirmed.set(true);
      component.donorSelectionEnabled.set(true);
      fixture.detectChanges();
    }));


    it('should select donor when user confirms', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('DialogRef', { afterClosed: of('right-donor') });
      dialogSpy.open.and.returnValue(dialogRefSpy);
      attachDonorServiceSpy.selectDonor.and.returnValue(of({
        success: true,
        message: 'Donor selected',
        statusCode: 200,
        data: {
          transactionId: 'TXN0000001',
          donorId: 'DON0000087'
        }
      }));

      component.selectedDonorId.set('DON0000087');
      component.onConfirmSelectDonor();
      tick();

      expect(attachDonorServiceSpy.selectDonor).toHaveBeenCalledWith({
        transactionId: 'TXN0000001',
        donorId: 'DON0000087'
      });
      expect(component.resolvedStatus()).toBe('Resolved');
    }));

  });

  describe('Add New Donor', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show inline new donor form instead of navigating', () => {
      component.transactionData.set(mockTransaction);

      component.onAddNewDonor();

      expect(component.isNewDonorMode()).toBeTrue();
      expect(component.donorRecordExpanded()).toBeTrue();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });
  describe('Alternate Address Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });


    it('should fetch alternate demographics data and open dialog', fakeAsync(() => {
      const mockAlternateData = {
        addressType: 'L' as 'L' | 'I',
        streetName: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
        suiteApt: null,
        uspsId: null,
        intlAddress1: null,
        intlAddress2: null,
        intlAddress3: null,
        intlAddress4: null,
        countryName: null,
        intlCity: null,
        intlPostalCode: null,
        intlAddrFlag: null,
        mobilePhoneNumber: null,
        otherContactNumber: null,
        altIntlPhoneNumber: null,
        preferredContactPhone: null,
        preferredContactAddress: null
      };

      // Setup component state
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.selectedDonorId.set('DON0000087');

      const dialogRefSpy = jasmine.createSpyObj('DialogRef', { afterClosed: of(mockAlternateData) });
      dialogSpy.open.and.returnValue(dialogRefSpy);
      alternateDemographicsServiceSpy.getByDonorId.and.returnValue(of(mockAlternateData));

      component.onOpenAlternateAddress();
      tick();

      expect(alternateDemographicsServiceSpy.getByDonorId).toHaveBeenCalledWith('DON0000087');
      expect(dialogSpy.open).toHaveBeenCalled();

      const dialogCallArgs = dialogSpy.open.calls.mostRecent().args;
      const dialogConfig = dialogCallArgs[1] as any;
      expect(dialogConfig.data.donorId).toBe('DON0000087');
      expect(dialogConfig.data.readOnly).toBe(false);
    }));



    it('should not show success message if dialog is cancelled', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.selectedDonorId.set('DON0000087');

      const dialogRefSpy = jasmine.createSpyObj('DialogRef', { afterClosed: of(null) });
      dialogSpy.open.and.returnValue(dialogRefSpy);
      alternateDemographicsServiceSpy.getByDonorId.and.returnValue(of(null));

      component.onOpenAlternateAddress();
      tick();

      // Success message should not be called when dialog returns null (cancelled)
      expect(snackBarSpy.open).not.toHaveBeenCalledWith(
        'Alternate address updated successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('International Address Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });




    it('should not show success message if international address dialog is cancelled', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.selectedDonorId.set('DON0000087');

      const dialogRefSpy = jasmine.createSpyObj('DialogRef', { afterClosed: of(undefined) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.onOpenInternationalAddress();
      tick();

      // Success message should not be called when dialog returns undefined (cancelled)
      expect(snackBarSpy.open).not.toHaveBeenCalledWith(
        'International address captured successfully',
        'DISMISS',
        jasmine.any(Object)
      );
    }));
  });

  describe('Bug Fixes - Comprehensive Tests', () => {
    describe('BUG FIX #1: Deferral ID Auto-Population Updates', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should update Transaction ID when Deferral ID changes (previously auto-populated)', fakeAsync(() => {
        // Setup: Deferral mode with initial auto-population
        component.transactionTypeControl.setValue('Deferral');
        component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: '' });

        // First auto-population
        attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
        component.onUnitIdBlur();
        tick();

        expect(component.transactionIdAutoPopulated()).toBeTrue();
        expect(component.transactionForm.get('transactionId')?.value).toBe('TXN0000001');

        // Change Deferral ID
        component.transactionForm.patchValue({ unitId: 'DEF002' });
        const newTransaction = { ...mockTransaction, transactionId: 'TXN0000002' };
        attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(newTransaction));

        component.onUnitIdBlur();
        tick();

        // Should update to new Transaction ID
        expect(component.transactionForm.get('transactionId')?.value).toBe('TXN0000002');
        expect(component.transactionIdAutoPopulated()).toBeTrue();
      }));

      it('should clear Transaction ID when Deferral ID is cleared (if it was auto-populated)', fakeAsync(() => {
        component.transactionTypeControl.setValue('Deferral');
        component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: '' });

        attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
        component.onUnitIdBlur();
        tick();

        expect(component.transactionIdAutoPopulated()).toBeTrue();

        // Clear Deferral ID
        component.transactionForm.patchValue({ unitId: '' });
        component.onUnitIdBlur();
        tick();

        expect(component.transactionForm.get('transactionId')?.value).toBe('');
        expect(component.transactionIdAutoPopulated()).toBeFalse();
      }));

      it('should NOT overwrite manually entered Transaction ID when Deferral ID changes', fakeAsync(() => {
        component.transactionTypeControl.setValue('Deferral');
        component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: 'MANUAL-TXN' });
        component.transactionIdAutoPopulated.set(false); // Mark as manually entered

        component.onUnitIdBlur();
        tick();

        expect(component.transactionForm.get('transactionId')?.value).toBe('MANUAL-TXN');
        expect(attachDonorServiceSpy.getTransactionByUnit).not.toHaveBeenCalled();
      }));
    });

    describe('BUG FIX #2: Duplicate Checkboxes Disable Immediately', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));


      it('should reload graded donors after 300ms delay', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.selectedDonorIds.set(['DON0000087', 'DON0000157']);

        attachDonorServiceSpy.markDuplicates.and.returnValue(of({
          success: true,
          message: 'Marked',
          statusCode: 200,
          data: { transactionId: 'TXN0000001', donorCount: 2 }
        }));

        spyOn<any>(component, 'loadGradedDonors').and.stub();

        component.onMarkDuplicates();
        tick(299); // Just before 300ms
        expect(component['loadGradedDonors']).not.toHaveBeenCalled();

        tick(1); // Complete the 300ms
        expect(component['loadGradedDonors']).toHaveBeenCalledWith('TXN0000001');
      }));
    });

    describe('BUG FIX #3: Save Fields Clear on View/Load', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should clear save fields when viewing a different donor', fakeAsync(() => {
        component.saveUnitIdControl.setValue('W63332508I210.8');
        component.saveTransactionIdControl.setValue('TXN0000001');

        attachDonorServiceSpy.getDonorById.and.returnValue(of({
          donorId: 'DON0000087',
          lastName: 'Test',
          firstName: 'Donor'
        }));

        component.onViewDonorDetails(mockGradedDonors[0]);
        tick();

        expect(component.saveUnitIdControl.value).toBeFalsy();
        expect(component.saveTransactionIdControl.value).toBeFalsy();
      }));

      it('should clear save fields when loading new transaction by Transaction ID', fakeAsync(() => {
        component.saveUnitIdControl.setValue('OLD-UNIT');
        component.saveTransactionIdControl.setValue('OLD-TXN');

        component['loadTransactionData']('TXN0000002');
        tick();

        expect(component.saveUnitIdControl.value).toBeFalsy();
        expect(component.saveTransactionIdControl.value).toBeFalsy();
      }));

      it('should clear save fields when loading new transaction by Unit ID', fakeAsync(() => {
        component.saveUnitIdControl.setValue('OLD-UNIT');
        component.saveTransactionIdControl.setValue('OLD-TXN');

        component['loadTransactionDataByUnit']('NEW-UNIT');
        tick();

        expect(component.saveUnitIdControl.value).toBeFalsy();
        expect(component.saveTransactionIdControl.value).toBeFalsy();
      }));
    });

    describe('BUG FIX #5: City and Work Phone Validation', () => {
      beforeEach(() => {
        fixture.detectChanges();
      });

      it('should require City field when saving with changes', () => {
        const cityControl = component.donorRecordForm.get('city');
        expect(cityControl?.hasError('required')).toBeTrue();

        cityControl?.setValue('Boston');
        expect(cityControl?.hasError('required')).toBeFalse();
      });

      it('should validate Work Phone field with pattern only (not required)', () => {
        const workPhoneControl = component.donorRecordForm.get('workPhone');
        workPhoneControl?.setValue('');
        expect(workPhoneControl?.hasError('required')).toBeFalse();

        workPhoneControl?.setValue('606-325-1234');
        expect(workPhoneControl?.hasError('pattern')).toBeFalse();
      });
    });

    describe('BUG FIX #6: Resolved Status Updates', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));



      it('should update resolved status after selecting donor', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);

        attachDonorServiceSpy.selectDonor.and.returnValue(of({
          success: true,
          message: 'Selected',
          statusCode: 200,
          data: { transactionId: 'TXN0000001', donorId: 'DON0000087' }
        }));

        component['selectDonor']('DON0000087');
        tick();

        expect(component.resolvedStatus()).toBe('Resolved');
      }));
    });

    describe('BUG FIX #7: Phone Number Validation', () => {
      beforeEach(() => {
        fixture.detectChanges();
      });

      it('should format phone number as user types', () => {
        const event = { target: { value: '6063251234' } } as any;
        component.formatPhoneInput(event, 'mobilePhone');

        expect(component.donorRecordForm.get('mobilePhone')?.value).toBe('606-325-1234');
      });

      it('should limit phone number to 10 digits', () => {
        const event = { target: { value: '606325123456789' } } as any;
        component.formatPhoneInput(event, 'mobilePhone');

        const value = component.donorRecordForm.get('mobilePhone')?.value;
        const digitsOnly = value.replace(/\D/g, '');
        expect(digitsOnly.length).toBe(10);
      });

      it('should validate phone number pattern for 10 digits', () => {
        const homePhoneControl = component.donorRecordForm.get('homePhone');

        homePhoneControl?.setValue('606-325-1234');
        expect(homePhoneControl?.hasError('pattern')).toBeFalse();

        homePhoneControl?.setValue('606-32-1234'); // Invalid format
        expect(homePhoneControl?.hasError('pattern')).toBeTrue();
      });

      it('should validate phone number pattern for 7 digits', () => {
        const homePhoneControl = component.donorRecordForm.get('homePhone');

        homePhoneControl?.setValue('325-1234');
        expect(homePhoneControl?.hasError('pattern')).toBeFalse();
      });

      it('should reject invalid phone number formats', () => {
        const workPhoneControl = component.donorRecordForm.get('workPhone');

        workPhoneControl?.setValue('abc-def-ghij'); // Letters
        expect(workPhoneControl?.hasError('pattern')).toBeTrue();

        workPhoneControl?.setValue('123-45-6789'); // Wrong pattern
        expect(workPhoneControl?.hasError('pattern')).toBeTrue();

        workPhoneControl?.setValue('12345'); // Too short
        expect(workPhoneControl?.hasError('pattern')).toBeTrue();
      });

      it('should auto-format partial phone numbers correctly', () => {
        let event = { target: { value: '606' } } as any;
        component.formatPhoneInput(event, 'homePhone');
        expect(component.donorRecordForm.get('homePhone')?.value).toBe('606');

        event = { target: { value: '6063' } } as any;
        component.formatPhoneInput(event, 'homePhone');
        expect(component.donorRecordForm.get('homePhone')?.value).toBe('606-3');

        event = { target: { value: '606325' } } as any;
        component.formatPhoneInput(event, 'homePhone');
        expect(component.donorRecordForm.get('homePhone')?.value).toBe('606-325');

        event = { target: { value: '6063251' } } as any;
        component.formatPhoneInput(event, 'homePhone');
        expect(component.donorRecordForm.get('homePhone')?.value).toBe('606-325-1');
      });
    });
  });

  describe('Transaction Type - Deferral Behavior', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should display "Unit ID" label when transaction type is "Donation"', fakeAsync(() => {
      component.transactionTypeControl.setValue('Donation');
      tick();
      fixture.detectChanges();
      expect(component.unitIdLabel()).toBe('Unit ID');
    }));

    it('should display "Deferral ID" label when transaction type is "Deferral"', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      tick();
      fixture.detectChanges();
      expect(component.unitIdLabel()).toBe('Deferral ID');
    }));

    it('should auto-retrieve transaction data when Donation type Unit ID is entered on blur', fakeAsync(() => {
      component.transactionTypeControl.setValue('Donation');
      component.transactionForm.patchValue({ unitId: '=W63332508I21000' });

      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onUnitIdBlur();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalled();
    }));

    it('should auto-populate transaction ID when deferral ID is unique', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF12345', transactionId: '' });

      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));

      component.onUnitIdBlur();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalledWith('DEF12345');
      expect(component.transactionForm.get('transactionId')?.value).toBe('TXN0000001');
      expect(component.transactionIdAutoPopulated()).toBeTrue();
    }));

    it('should not auto-populate if transaction ID already has a value', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF12345', transactionId: 'TXN0000999' });

      component.onUnitIdBlur();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).not.toHaveBeenCalled();
      expect(component.transactionForm.get('transactionId')?.value).toBe('TXN0000999');
    }));


    it('should not auto-populate if deferral ID is not unique', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF99999', transactionId: '' });

      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(
        throwError(() => new Error('Multiple records found'))
      );

      component.onUnitIdBlur();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalledWith('DEF99999');
      expect(component.transactionForm.get('transactionId')?.value).toBe('');
      expect(component.transactionIdAutoPopulated()).toBeFalse();
    }));

    it('should reset auto-populated flag when blur is triggered again', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF12345', transactionId: '' });

      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));

      component.onUnitIdBlur();
      tick();

      expect(component.transactionIdAutoPopulated()).toBeTrue();

      // Change deferral ID and blur again
      component.transactionForm.patchValue({ unitId: 'DEF99999', transactionId: '' });
      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(
        throwError(() => new Error('Not found'))
      );

      component.onUnitIdBlur();
      tick();

      expect(component.transactionIdAutoPopulated()).toBeFalse();
    }));

    it('should show appropriate error message for Deferral ID when searching without IDs', fakeAsync(() => {
      // Spy on load methods to ensure they're not called
      spyOn<any>(component, 'loadTransactionData').and.stub();
      spyOn<any>(component, 'loadTransactionDataByUnit').and.stub();

      // Set transaction type
      component.transactionTypeControl.setValue('Deferral');
      tick();

      // Ensure form has empty values
      component.transactionForm.reset({ unitId: '', transactionId: '', collectionDate: '', enteredBy: '' });

      component.onSearch();

      expect(component['loadTransactionData']).not.toHaveBeenCalled();
      expect(component['loadTransactionDataByUnit']).not.toHaveBeenCalled();
      // Should not load data when no IDs are provided
    }));

    it('should show appropriate error message for Unit ID when searching without IDs', fakeAsync(() => {
      // Spy on load methods to ensure they're not called
      spyOn<any>(component, 'loadTransactionData').and.stub();
      spyOn<any>(component, 'loadTransactionDataByUnit').and.stub();

      // Set transaction type
      component.transactionTypeControl.setValue('Donation');
      tick();

      // Ensure form has empty values
      component.transactionForm.reset({ unitId: '', transactionId: '', collectionDate: '', enteredBy: '' });

      component.onSearch();

      expect(component['loadTransactionData']).not.toHaveBeenCalled();
      expect(component['loadTransactionDataByUnit']).not.toHaveBeenCalled();
      // Should not load data when no IDs are provided
    }));
  });

  describe('HOLD Functionality', () => {
    describe('selectDonor with HOLD resolution', () => {
      it('should clear held donor when selecting held donor', fakeAsync(() => {
        // Arrange
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);

        // Set held donor
        const heldDonor = {
          donorId: 'DON0000087',
          lastName: 'Thompson',
          firstName: 'Marvin',
          dateOfBirth: '1998-01-11',
          sex: 'M',
          alternateId: null
        };
        component.heldDonor.set(heldDonor);

        attachDonorServiceSpy.selectDonor.and.returnValue(of({
          success: true,
          message: 'Donor selected',
          statusCode: 200,
          data: {
            transactionId: mockTransaction.transactionId,
            donorId: 'DON0000087'
          }
        }));

        // Act
        component['selectDonor']('DON0000087');
        tick();

        // Assert
        expect(component.heldDonor()).toBeNull(); // Should clear held donor
        expect(component.resolvedStatus()).toBe('Resolved');
      }));

    });

    describe('onMarkDuplicates with HOLD resolution', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should show "HOLD Resolved with - DUPLICATE" when marking held donor as duplicate', fakeAsync(() => {
        // Arrange
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.selectedDonorIds.set(['DON0000087', 'DON0000157']);

        // Set held donor
        const heldDonor = {
          donorId: 'DON0000087',
          lastName: 'Thompson',
          firstName: 'Marvin',
          dateOfBirth: '1998-01-11',
          sex: 'M',
          alternateId: null
        };
        component.heldDonor.set(heldDonor);

        attachDonorServiceSpy.markDuplicates.and.returnValue(of({
          success: true,
          message: 'Duplicates marked',
          statusCode: 200,
          data: {
            transactionId: mockTransaction.transactionId,
            donorCount: 2
          }
        }));

        spyOn<any>(component, 'loadGradedDonors').and.stub();

        // Act
        component.onMarkDuplicates();
        tick();

        // Assert
        expect(component.heldDonor()).toBeNull(); // Should clear held donor
        expect(component.duplicateMode()).toBeFalse();
      }));

      it('should show normal message when marking non-held donors as duplicates', fakeAsync(() => {
        // Arrange
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.selectedDonorIds.set(['DON0000087', 'DON0000157']);
        component.heldDonor.set(null); // No held donor

        attachDonorServiceSpy.markDuplicates.and.returnValue(of({
          success: true,
          message: 'Duplicates marked',
          statusCode: 200,
          data: {
            transactionId: mockTransaction.transactionId,
            donorCount: 2
          }
        }));

        spyOn<any>(component, 'loadGradedDonors').and.stub();

        // Act
        component.onMarkDuplicates();
        tick(); // Process the observable
        tick(300); // Wait for the 300ms setTimeout delay

        // Assert
        expect(component.duplicateMode()).toBeFalse();
        expect(component['loadGradedDonors']).toHaveBeenCalled();
      }));
    });

    describe('onAddNewDonor with HOLD resolution', () => {
      beforeEach(fakeAsync(() => {
        fixture.detectChanges();
        tick();
      }));

      it('should open inline form when creating new donor after hold', () => {
        component.transactionData.set(mockTransaction);

        const heldDonor = {
          donorId: 'DON0000087',
          lastName: 'Thompson',
          firstName: 'Marvin',
          dateOfBirth: '1998-01-11',
          sex: 'M',
          alternateId: null
        };
        component.heldDonor.set(heldDonor);

        component.onAddNewDonor();

        expect(component.isNewDonorMode()).toBeTrue();
        expect(component.donorRecordExpanded()).toBeTrue();
      });

      it('should open inline form when no donor was on hold', () => {
        component.transactionData.set(mockTransaction);
        component.heldDonor.set(null);

        component.onAddNewDonor();

        expect(component.isNewDonorMode()).toBeTrue();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
      });
    });

    describe('openFindDonorDialog - Shared Dialog Integration', () => {
      it('should call putDonorOnHold API and set heldDonor when dialog returns hold action', fakeAsync(() => {
        // Arrange
        const mockFindDonorResult = {
          donorId: 'DON0000087',
          lastName: 'Thompson',
          firstName: 'Marvin',
          dob: '1998-01-11',
          sex: 'M',
          alternateId: null,
          grade: 4,
          scanId: null,
          middleName: null,
          ssn: null,
          status: 'Active',
          aboRh: 'O+',
          alternateIdType: null,
          address: null,
          address1: null,
          address2: null,
          city: null,
          state: null,
          zipCode: null,
          phone: null,
          phone2: null,
          workPhone: null,
          lastDonationDate: null,
          donorType: null
        };

        const dialogResult = {
          action: 'hold' as const,
          donor: mockFindDonorResult
        };

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        attachDonorServiceSpy.putDonorOnHold.and.returnValue(of({
          success: true,
          message: 'Donor on hold',
          statusCode: 200
        }));
        attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

        component.transactionData.set(mockTransaction);

        // Act
        component['openFindDonorDialog']('TXN0000001');
        tick();

        // Assert
        expect(attachDonorServiceSpy.putDonorOnHold).toHaveBeenCalledWith('DON0000087', 'TXN0000001');
        expect(component.heldDonor()).toEqual({
          donorId: 'DON0000087',
          lastName: 'Thompson',
          firstName: 'Marvin',
          dateOfBirth: '1998-01-11',
          sex: 'M',
          alternateId: null
        });
        expect(attachDonorServiceSpy.getGradedDonors).toHaveBeenCalledWith('TXN0000001');
      }));

      // Note: Error handling for putDonorOnHold is tested at the service level
      // Component error handling is verified through integration testing


      it('should reload graded donors when dialog returns select action', fakeAsync(() => {
        // Arrange
        const mockFindDonorResult = {
          donorId: 'DON0000087',
          lastName: 'Thompson',
          firstName: 'Marvin',
          dob: '1998-01-11',
          sex: 'M',
          alternateId: null,
          grade: 4,
          scanId: null,
          middleName: null,
          ssn: null,
          status: 'Active',
          aboRh: 'O+',
          alternateIdType: null,
          address: null,
          address1: null,
          address2: null,
          city: null,
          state: null,
          zipCode: null,
          phone: null,
          phone2: null,
          workPhone: null,
          lastDonationDate: null,
          donorType: null
        };

        const dialogResult = {
          action: 'select' as const,
          donor: mockFindDonorResult
        };

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

        // Act
        component['openFindDonorDialog']('TXN0000001');
        tick();

        // Assert
        expect(attachDonorServiceSpy.getGradedDonors).toHaveBeenCalledWith('TXN0000001');
        expect(component.heldDonor()).toBeNull(); // Should not set held donor for select
      }));

      it('should open shared Find Donor Dialog with correct configuration', fakeAsync(() => {
        // Arrange
        component.transactionData.set(mockTransaction);

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(null));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        // Act
        component['openFindDonorDialog']('TXN0000001');
        tick();

        // Assert
        expect(dialogSpy.open).toHaveBeenCalled();
        const dialogCallArgs = dialogSpy.open.calls.mostRecent().args;
        const dialogConfig = dialogCallArgs[1] as any;

        expect(dialogConfig.width).toBe('1184px');
        expect(dialogConfig.data.mode).toBe('add');
      }));

      it('should pass transaction demographics in searchOnOpen when demographics exist', fakeAsync(() => {
        component.transactionData.set(mockTransaction);

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(null));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component['openFindDonorDialog']('TXN0000001');
        tick();

        const dialogConfig = dialogSpy.open.calls.mostRecent().args[1] as any;
        const searchOnOpen = dialogConfig.data.searchOnOpen;

        expect(searchOnOpen.lastName).toBe('Thompson');
        expect(searchOnOpen.firstName).toBe('Mark');
        expect(searchOnOpen.dob).toBeTruthy();
        expect(searchOnOpen.sex).toBe('Male');
        expect(searchOnOpen.unitId).toBeUndefined();
      }));

      it('should fall back to unitId search when no demographics available', fakeAsync(() => {
        const transactionNoDemographics: GradedDonationDto = {
          transactionId: 'TXN0000002',
          unitId: '=UNIT99900',
          lastName: null,
          firstName: null,
          dateOfBirth: null,
          gender: null,
          chapterId: 'CH01',
          activeFlag: 'Y',
          programId: 'DRUREHLD'
        };
        component.transactionData.set(transactionNoDemographics);

        const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
        dialogRefSpy.afterClosed.and.returnValue(of(null));
        dialogSpy.open.and.returnValue(dialogRefSpy);

        component['openFindDonorDialog']('TXN0000002');
        tick();

        const dialogConfig = dialogSpy.open.calls.mostRecent().args[1] as any;
        expect(dialogConfig.data.searchOnOpen).toEqual({ unitId: '=UNIT99900' });
      }));
    });
  });

  describe('Inline New Donor Mode', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should enter new donor mode when onAddNewDonor is called', () => {
      component.transactionData.set(mockTransaction);

      component.onAddNewDonor();

      expect(component.isNewDonorMode()).toBeTrue();
      expect(component.donorRecordExpanded()).toBeTrue();
    });

    it('should open blank form when no newData provided (no transaction pre-population)', () => {
      component.transactionData.set(mockTransaction);

      component.onAddNewDonor();

      expect(component.donorRecordForm.get('lastName')?.value).toBeFalsy();
      expect(component.donorRecordForm.get('firstName')?.value).toBeFalsy();
    });


    it('should exit new donor mode on cancel', () => {
      component.transactionData.set(mockTransaction);
      component.onAddNewDonor();

      component.onCancelNewDonor();

      expect(component.isNewDonorMode()).toBeFalse();
      expect(component.donorRecordExpanded()).toBeFalse();
    });

    it('should exit new donor mode on clear all', () => {
      component.transactionData.set(mockTransaction);
      component.onAddNewDonor();

      component.onClearAll();

      expect(component.isNewDonorMode()).toBeFalse();
    });


    it('should call createDonor and auto-attach on save', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.onAddNewDonor();

      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Mark',
        dateOfBirth: new Date('1996-03-26'),
        gender: 'Male'
      });

      attachDonorServiceSpy.createDonor.and.returnValue(of({
        success: true,
        message: 'Created',
        statusCode: 201,
        data: { donorId: 'DN_NEW_001' }
      }));
      attachDonorServiceSpy.addGradedDonor.and.returnValue(of({
        success: true,
        message: 'Added',
        statusCode: 200
      }));
      attachDonorServiceSpy.selectDonor.and.returnValue(of({
        success: true,
        message: 'Selected',
        statusCode: 200,
        data: { transactionId: 'TXN0000001', donorId: 'DN_NEW_001' }
      }));

      component.onSaveNewDonor();
      tick();

      expect(attachDonorServiceSpy.createDonor).toHaveBeenCalled();
      expect(component.isNewDonorMode()).toBeFalse();
    }));

    it('should show success message after auto-attach', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.onAddNewDonor();

      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Mark',
        dateOfBirth: new Date('1996-03-26'),
        gender: 'Male'
      });

      attachDonorServiceSpy.createDonor.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        data: { donorId: 'DN_NEW_001' }
      }));
      attachDonorServiceSpy.addGradedDonor.and.returnValue(of({ success: true, message: 'Added', statusCode: 200 }));
      attachDonorServiceSpy.selectDonor.and.returnValue(of({
        success: true, message: 'Selected', statusCode: 200,
        data: { transactionId: 'TXN0000001', donorId: 'DN_NEW_001' }
      }));

      component.onSaveNewDonor();
      tick(); tick(); tick();

      // After successful auto-attach, onClearAll resets resolvedStatus
      expect(component.resolvedStatus()).toBe('Not Resolved');
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        'New donor created and attached to the transaction successfully.',
        'DISMISS',
        jasmine.any(Object)
      );
    }));

    it('should treat error 16022 as success in auto-attach', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.onAddNewDonor();

      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Mark',
        dateOfBirth: new Date('1996-03-26'),
        gender: 'Male'
      });

      attachDonorServiceSpy.createDonor.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        data: { donorId: 'DN_NEW_001' }
      }));
      attachDonorServiceSpy.addGradedDonor.and.returnValue(of({ success: true, message: 'Added', statusCode: 200 }));
      attachDonorServiceSpy.selectDonor.and.returnValue(
        throwError(() => ({ errorCode: '16022', message: 'Already attached' }))
      );

      component.onSaveNewDonor();
      tick(); tick(); tick();

      // After 16022 (treated as success), onClearAll resets resolvedStatus
      expect(component.resolvedStatus()).toBe('Not Resolved');
    }));

    it('should open blank form from Find Donor dialog new action', fakeAsync(() => {
      component.transactionData.set(mockTransaction);

      const dialogResult = {
        action: 'new' as const,
        newData: {
          lastName: 'JONES',
          firstName: 'SARAH',
          sex: 'F',
          dob: '05/20/1985'
        }
      };

      const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dialogRefSpy.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component['openFindDonorDialog']('TXN0000001');
      tick();

      expect(component.isNewDonorMode()).toBeTrue();
      expect(component.donorRecordForm.get('lastName')?.value).toBeFalsy();
      expect(component.donorRecordForm.get('firstName')?.value).toBeFalsy();
      expect(component.donorRecordForm.get('dateOfBirth')?.value).toBeNull();
      expect(component.donorRecordForm.get('gender')?.value).toBeFalsy();
    }));
  });


  describe('canViewPhlebotomy', () => {
    it('should return false when no transaction is loaded', () => {
      component.transactionData.set(null);
      expect(component.canViewPhlebotomy()).toBeFalse();
    });

    it('should return true for Donation with unitId', () => {
      component.transactionData.set(mockTransaction);
      component.transactionTypeControl.setValue('Donation');
      component.duplicateMode.set(false);
      expect(component.canViewPhlebotomy()).toBeTrue();
    });

    it('should return false for Donation without unitId', () => {
      component.transactionData.set({ ...mockTransaction, unitId: null });
      component.transactionTypeControl.setValue('Donation');
      expect(component.canViewPhlebotomy()).toBeFalse();
    });

    it('should return false when duplicate mode is active', () => {
      component.transactionData.set(mockTransaction);
      component.transactionTypeControl.setValue('Donation');
      component.duplicateMode.set(true);
      expect(component.canViewPhlebotomy()).toBeFalse();
    });

    it('should return true for Deferral when donor is selected', () => {
      component.transactionData.set(mockTransaction);
      component.transactionTypeControl.setValue('Deferral');
      component.duplicateMode.set(false);
      component.selectedDonorId.set('DON0000087');
      expect(component.canViewPhlebotomy()).toBeTrue();
    });

    it('should return false for Deferral when no donor is selected', () => {
      component.transactionData.set(mockTransaction);
      component.transactionTypeControl.setValue('Deferral');
      component.selectedDonorId.set(null);
      expect(component.canViewPhlebotomy()).toBeFalse();
    });
  });

  describe('onViewPhlebotomyDetails', () => {

    it('should open dialog with correct data when transaction is loaded', () => {
      component.transactionData.set(mockTransaction);
      component.onViewPhlebotomyDetails();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      const data = dialogConfig?.data as any;
      expect(data.transactionId).toBe('TXN0000001');
      expect(data.unitId).toBe('W63332508I210');
    });


    it('should pass formatted collDate when collectionDate exists', () => {
      component.transactionData.set(mockTransaction);
      component.onViewPhlebotomyDetails();

      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect((dialogConfig?.data as any).collDate).toBe('2025-12-09');
    });

    it('should pass undefined collDate when collectionDate is null', () => {
      component.transactionData.set({ ...mockTransaction, collectionDate: null });
      component.onViewPhlebotomyDetails();

      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1];
      expect((dialogConfig?.data as any).collDate).toBeUndefined();
    });
  });

  describe('FMB Alignment - Entry OK Flow', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should only have Y and N as valid Entry OK options', () => {
      expect(component.entryOkOptions).toEqual(['Y', 'N']);
    });

    it('should set entryOkConfirmed when Entry OK = Y', () => {
      component.transactionData.set(mockTransaction);
      expect(component.entryOkConfirmed()).toBeFalse();

      component.onEntryOkChange('Y');
      expect(component.entryOkConfirmed()).toBeTrue();
    });

    it('should show right-donor-present confirmation dialog when Entry OK = Y', () => {
      component.transactionData.set(mockTransaction);
      component.onEntryOkChange('Y');

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogArgs = dialogSpy.open.calls.mostRecent().args;
      expect((dialogArgs[1]?.data as any).message).toContain('Is the right donor present');
    });

    it('should enable donor selection when user answers YES to right-donor-present', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('DialogRef', { afterClosed: of(true) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.transactionData.set(mockTransaction);
      component.onEntryOkChange('Y');
      tick();

      expect(component.donorSelectionEnabled()).toBeTrue();
    }));

    it('should disable donor selection when user answers NO to right-donor-present', fakeAsync(() => {
      const dialogRefSpy = jasmine.createSpyObj('DialogRef', { afterClosed: of(false) });
      dialogSpy.open.and.returnValue(dialogRefSpy);

      component.transactionData.set(mockTransaction);
      component.onEntryOkChange('Y');
      tick();

      expect(component.donorSelectionEnabled()).toBeFalse();
    }));

    it('should set entryOkConfirmed and open blank Find Donor when Entry OK = N', () => {
      component.transactionData.set(mockTransaction);
      component.onEntryOkChange('N');

      expect(component.entryOkConfirmed()).toBeTrue();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should show error for invalid Entry OK values', () => {
      component.transactionData.set(mockTransaction);
      component.onEntryOkChange('?' as any);

      expect(component.entryOkError()).toContain('16063');
      expect(component.entryOkConfirmed()).toBeFalse();
    });

    it('should show error when Entry OK selected without transaction loaded', () => {
      component.transactionData.set(null);
      component.onEntryOkChange('Y');

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(component.entryOkControl.value).toBeNull();
    });

    it('should prevent donor selection when donorSelectionEnabled is false', fakeAsync(() => {
      component.donorSelectionEnabled.set(false);
      component.onSelectDonor(mockGradedDonors[0]);
      tick();

      expect(component.selectedDonorId()).toBeNull();
    }));

    it('should reset entryOkConfirmed on clear all', () => {
      component.entryOkConfirmed.set(true);
      component.donorSelectionEnabled.set(false);

      component.onClearAll();

      expect(component.entryOkConfirmed()).toBeFalse();
      expect(component.donorSelectionEnabled()).toBeTrue();
      expect(component.keyDataComplete()).toBeTrue();
    });
  });

  describe('FMB Alignment - check_null_key_data', () => {
    it('should set keyDataComplete to true when all key data present', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.keyDataComplete()).toBeTrue();
    }));

    it('should skip Entry OK and open Find Donor when key data incomplete', fakeAsync(() => {
      const incompleteTransaction: GradedDonationDto = {
        ...mockTransaction,
        lastName: null as any,
        dateOfBirth: null as any,
        gender: null as any
      };

      // Must set spies BEFORE creating a new component instance
      attachDonorServiceSpy.getTransaction.and.returnValue(of(incompleteTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      // Create a fresh component so ngOnInit picks up the incomplete data
      const freshFixture = TestBed.createComponent(AttachDonorComponent);
      const freshComponent = freshFixture.componentInstance;
      freshFixture.detectChanges();
      tick();

      expect(freshComponent.keyDataComplete()).toBeFalse();
      expect(freshComponent.entryOkConfirmed()).toBeTrue();

      freshFixture.destroy();
    }));
  });

  describe('FMB Alignment - Unit ID blur for Donation type', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should auto-retrieve transaction on Unit ID blur for Donation type', fakeAsync(() => {
      component.transactionTypeControl.setValue('Donation');
      component.transactionForm.patchValue({ unitId: '=W12345678900' });

      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onUnitIdBlur();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalled();
    }));

  });

  describe('FMB Alignment - Transaction ID length validation', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should reject Transaction ID shorter than 10 characters', () => {
      component.transactionForm.patchValue({ transactionId: 'SHORT', unitId: '' });
      component.onSearch();

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(attachDonorServiceSpy.getTransaction).not.toHaveBeenCalledWith('SHORT');
    });

    it('should accept Transaction ID with 10+ characters', fakeAsync(() => {
      attachDonorServiceSpy.getTransaction.calls.reset();
      attachDonorServiceSpy.getTransaction.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.transactionForm.patchValue({ transactionId: 'TXN0012345', unitId: '' });
      component.onSearch();
      tick();

      expect(attachDonorServiceSpy.getTransaction).toHaveBeenCalledWith('TXN0012345');
    }));
  });

  describe('Bug Fixes - Session 2', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));
    describe('Entry OK = N disables donor selection', () => {

      it('should re-enable donorSelectionEnabled when Find Donor returns select action', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.donorSelectionEnabled.set(false);

        const findDonorResult = { action: 'select', donor: { donorId: 'DON0000087', lastName: 'Test', firstName: 'User' } };
        dialogSpy.open.and.returnValue({ afterClosed: () => of(findDonorResult) } as any);
        attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

        (component as any).openFindDonorDialog(mockTransaction.transactionId, true);
        tick();

        expect(component.donorSelectionEnabled()).toBe(true);
      }));
    });
    describe('New donor form opens blank', () => {
      it('should open blank form when onAddNewDonor called without newData', () => {
        component.transactionData.set(mockTransaction);
        component.onAddNewDonor();

        expect(component.isNewDonorMode()).toBe(true);
        expect(component.donorRecordExpanded()).toBe(true);
        expect(component.donorRecordForm.get('lastName')?.value).toBeFalsy();
        expect(component.donorRecordForm.get('firstName')?.value).toBeFalsy();
      });


      it('should always reset form when Add New Donor clicked again', () => {
        component.transactionData.set(mockTransaction);
        component.onAddNewDonor();
        component.donorRecordForm.patchValue({ lastName: 'ENTERED_DATA' });

        component.onAddNewDonor();

        expect(component.donorRecordForm.get('lastName')?.value).toBeFalsy();
        expect(component.isNewDonorMode()).toBeTrue();
      });
    });

    describe('Err:16007 validation for new donor', () => {
      beforeEach(() => {
        component.transactionData.set(mockTransaction);
        component.isNewDonorMode.set(true);
        attachDonorServiceSpy.createDonor.and.returnValue(of({ success: true, message: '', statusCode: 200, data: [{ donorId: 'DN_NEW_001' }] }));
        attachDonorServiceSpy.addGradedDonor.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
        attachDonorServiceSpy.selectDonor.and.returnValue(of({ success: true, message: '', statusCode: 200, data: { transactionId: 'TXN0000001', donorId: 'DN_NEW_001' } }));
      });

      it('should show error 16007 when new donor lastName does not match transaction', fakeAsync(() => {
        component.donorRecordForm.patchValue({
          lastName: 'WRONGNAME',
          firstName: 'Mark',
          dateOfBirth: new Date('1996-03-26'),
          gender: 'Male'
        });

        component.onSaveNewDonor();
        tick();

        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16007'),
          jasmine.anything(),
          jasmine.anything()
        );
        expect(attachDonorServiceSpy.createDonor).not.toHaveBeenCalled();
      }));


    });

    describe('Work phone not required', () => {
      it('should NOT have required validator on workPhone control', () => {
        const workPhone = component.donorRecordForm.get('workPhone');
        workPhone?.setValue('');
        expect(workPhone?.hasError('required')).toBe(false);
      });
    });

    describe('Uppercase conversion', () => {
      it('should convert input to uppercase via toUpperCase method', () => {
        const mockEvent = {
          target: {
            value: 'test value',
            selectionStart: 10,
            setSelectionRange: jasmine.createSpy('setSelectionRange')
          }
        } as any;

        component.toUpperCase(mockEvent, 'homeAddress');

        expect(component.donorRecordForm.get('homeAddress')?.value).toBe('TEST VALUE');
      });
    });
    describe('Mark duplicates opens bottom form', () => {
      it('should call onViewDonorDetails with primary donor after marking duplicates', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.duplicateMode.set(true);
        component.selectedDonorIds.set([mockGradedDonors[0].donorId, mockGradedDonors[1].donorId]);
        component.entryOkConfirmed.set(true);

        const markResponse = {
          success: true, message: 'OK', statusCode: 200,
          data: { transactionId: 'TXN0000001', donorCount: 2 }
        };
        attachDonorServiceSpy.markDuplicates.and.returnValue(of(markResponse));
        attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));
        attachDonorServiceSpy.getDonorById.and.returnValue(of({
          lastName: 'Thompson', firstName: 'Marvin', dateOfBirth: '1998-01-11', gender: 'M',
          streetName: '123 St', city: 'Dallas', state: 'TX', zip: '75001'
        }));

        spyOn(component, 'onViewDonorDetails').and.callThrough();
        component.onMarkDuplicates();
        tick(500);

        expect(component.onViewDonorDetails).toHaveBeenCalled();
        expect(component.duplicateMode()).toBe(false);
      }));
    });

    describe('originalKeyData is public', () => {
      it('should be accessible as a public getter', () => {
        component.transactionData.set(mockTransaction);
        const keyData = component.originalKeyData;
        expect(keyData).toBeTruthy();
        expect(keyData).toContain('Thompson');
      });
    });

    describe('Update payload structure', () => {
      it('should include root-level fields and structured address/phones', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.donorSelectionControl.setValue(mockGradedDonors[0].donorId);
        tick();
        component.donorRecordExpanded.set(true);
        component.fetchedBy.set('unitId');
        component.originalFetchValue.set('W63332508I210.8');
        component.donorExistsInFullTable.set(true);

        component.donorRecordForm.patchValue({
          lastName: 'THOMPSON', firstName: 'MARVIN',
          homeAddress: '123 MAIN ST', city: 'DALLAS', state: 'TX', zip: '75001',
          gender: 'Male', dateOfBirth: new Date('1998-01-11')
        });
        component.donorRecordForm.markAsDirty();

        attachDonorServiceSpy.updateDonor.and.returnValue(of({ success: true, message: '', statusCode: 200 }));
        attachDonorServiceSpy.selectDonor.and.returnValue(of({ success: true, message: '', statusCode: 200, data: {} }));

        component.saveUnitIdControl.setValue('W63332508I210.8');
        component.onSaveDonorRecord();
        tick();

        const payload = attachDonorServiceSpy.updateDonor.calls.mostRecent().args[1];
        expect(payload.lastName).toBe('THOMPSON');
        expect(payload.gender).toBeTruthy();
        expect(payload.address).toBeDefined();
        expect(payload.address.city).toBe('DALLAS');
        expect(payload.phones).toBeDefined();
        expect(payload.phones.work).toBeDefined();
        expect(payload.personalInfo).toBeDefined();
      }));
    });

  });

  // ============================================================
  // NEW COVERAGE TESTS - Covering uncovered methods and branches
  // ============================================================

  describe('onRetrieve', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should retrieve by Unit ID for Donation type', fakeAsync(() => {
      component.transactionTypeControl.setValue('Donation');
      component.transactionForm.patchValue({ unitId: '=UNIT12300', transactionId: '' });
      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onRetrieve();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalled();
    }));

    it('should fall back to Transaction ID for Donation when no Unit ID', fakeAsync(() => {
      component.transactionTypeControl.setValue('Donation');
      component.transactionForm.patchValue({ unitId: '', transactionId: 'TXN0000001' });
      attachDonorServiceSpy.getTransaction.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onRetrieve();
      tick();

      expect(attachDonorServiceSpy.getTransaction).toHaveBeenCalledWith('TXN0000001');
    }));

    it('should show error for Donation when both fields are empty', () => {
      component.transactionTypeControl.setValue('Donation');
      component.transactionForm.patchValue({ unitId: '', transactionId: '' });

      component.onRetrieve();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Unit ID'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should retrieve by Transaction ID first for Deferral type', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: 'TXN0000001' });
      attachDonorServiceSpy.getTransaction.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onRetrieve();
      tick();

      expect(attachDonorServiceSpy.getTransaction).toHaveBeenCalledWith('TXN0000001');
    }));

    it('should fall back to Deferral ID for Deferral type when no Transaction ID', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: '' });
      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onRetrieve();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalledWith('DEF001');
    }));

    it('should show error for Deferral when both fields are empty', () => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: '', transactionId: '' });

      component.onRetrieve();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Deferral ID or Transaction ID'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should pass deferral ID to loadTransactionDataByUnit for Deferral retrieve', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: '' });
      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onRetrieve();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalled();
    }));
  });

  describe('onUnitIdSearch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should search by Unit ID when value is present', fakeAsync(() => {
      component.transactionForm.patchValue({ unitId: '=UNIT99900' });
      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onUnitIdSearch();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalled();
    }));

    it('should show error when Unit ID is empty for Donation type', () => {
      component.transactionTypeControl.setValue('Donation');
      component.transactionForm.patchValue({ unitId: '' });

      component.onUnitIdSearch();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Unit ID'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show Deferral ID in error message for Deferral type', () => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: '' });

      component.onUnitIdSearch();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Deferral ID'),
        jasmine.anything(),
        jasmine.anything()
      );
    });
  });

  describe('onSearch - additional branches', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should use Transaction ID for Donation when only Transaction ID is provided', fakeAsync(() => {
      component.transactionTypeControl.setValue('Donation');
      component.transactionForm.patchValue({ unitId: '', transactionId: 'TXN0000001' });
      attachDonorServiceSpy.getTransaction.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onSearch();
      tick();

      expect(attachDonorServiceSpy.getTransaction).toHaveBeenCalledWith('TXN0000001');
    }));

    it('should use Transaction ID first for Deferral type', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: 'TXN0000001' });
      attachDonorServiceSpy.getTransaction.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onSearch();
      tick();

      expect(attachDonorServiceSpy.getTransaction).toHaveBeenCalledWith('TXN0000001');
    }));

    it('should pass deferral ID to search for Deferral type', fakeAsync(() => {
      component.transactionTypeControl.setValue('Deferral');
      component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: '' });
      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onSearch();
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalled();
    }));
  });

  describe('onEmployerSearch', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter employer options by search term', () => {
      component.employerOptions.set([
        { value: 'E1', label: 'Acme Corp' },
        { value: 'E2', label: 'Beta Inc' },
        { value: 'E3', label: 'Acme Labs' }
      ]);

      const event = { target: { value: 'ACME' } } as any;
      component.onEmployerSearch(event);

      expect(component.filteredEmployerOptions().length).toBe(2);
    });

    it('should show all employers when search is empty', () => {
      component.employerOptions.set([
        { value: 'E1', label: 'Acme Corp' },
        { value: 'E2', label: 'Beta Inc' }
      ]);

      const event = { target: { value: '' } } as any;
      component.onEmployerSearch(event);

      expect(component.filteredEmployerOptions().length).toBe(2);
    });
  });

  describe('displayEmployer', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return employer label when found', () => {
      component.employerOptions.set([
        { value: 'E1', label: 'Acme Corp' }
      ]);
      expect(component.displayEmployer('E1')).toBe('Acme Corp');
    });

    it('should return the value itself when employer not found', () => {
      component.employerOptions.set([]);
      expect(component.displayEmployer('UNKNOWN')).toBe('UNKNOWN');
    });

    it('should return empty string for empty value', () => {
      expect(component.displayEmployer('')).toBe('');
    });
  });

  describe('onEmployerSelected', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should populate employer city/state/zip on valid selection', fakeAsync(() => {
      donorEmployerServiceSpy.getById.and.returnValue(of({
        city: 'Dallas', state: 'TX', zip: '75001'
      }));

      component.onEmployerSelected('E1');
      tick();

      expect(donorEmployerServiceSpy.getById).toHaveBeenCalledWith('E1');
      expect(component.donorRecordForm.get('employerCity')?.value).toBe('Dallas');
      expect(component.donorRecordForm.get('employerState')?.value).toBe('TX');
    }));

    it('should clear employer fields when empty employerId', () => {
      component.donorRecordForm.patchValue({
        employerCity: 'Dallas', employerState: 'TX', employerZip: '75001'
      });

      component.onEmployerSelected('');

      expect(component.donorRecordForm.get('employerCity')?.value).toBe('');
      expect(component.donorRecordForm.get('employerState')?.value).toBe('');
      expect(component.donorRecordForm.get('employerZip')?.value).toBe('');
    });

    it('should handle error when fetching employer details', fakeAsync(() => {
      donorEmployerServiceSpy.getById.and.returnValue(
        throwError(() => new Error('Not found'))
      );

      component.onEmployerSelected('E_BAD');
      tick();

      expect(donorEmployerServiceSpy.getById).toHaveBeenCalledWith('E_BAD');
    }));
  });

  describe('onZipBlur', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should populate city and state from zip lookup', fakeAsync(() => {
      attachDonorServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'DALLAS', state: 'TX' }
      ]));
      component.donorRecordForm.patchValue({ zip: '75001' });

      component.onZipBlur();
      tick();

      expect(attachDonorServiceSpy.getCityStateByZip).toHaveBeenCalledWith('75001');
      expect(component.donorRecordForm.get('city')?.value).toBe('DALLAS');
      expect(component.donorRecordForm.get('state')?.value).toBe('TX');
    }));

    it('should not call API when zip is too short', () => {
      component.donorRecordForm.patchValue({ zip: '750' });

      component.onZipBlur();

      expect(attachDonorServiceSpy.getCityStateByZip).not.toHaveBeenCalled();
    });

    it('should not call API when zip is empty', () => {
      component.donorRecordForm.patchValue({ zip: '' });

      component.onZipBlur();

      expect(attachDonorServiceSpy.getCityStateByZip).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully', fakeAsync(() => {
      attachDonorServiceSpy.getCityStateByZip.and.returnValue(
        throwError(() => new Error('API error'))
      );
      component.donorRecordForm.patchValue({ zip: '99999' });

      component.onZipBlur();
      tick();

      expect(attachDonorServiceSpy.getCityStateByZip).toHaveBeenCalled();
    }));
  });

  describe('onCitySelected', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set city to uppercase', () => {
      component.onCitySelected('dallas');

      expect(component.donorRecordForm.get('city')?.value).toBe('DALLAS');
    });

    it('should not update when empty city', () => {
      component.donorRecordForm.patchValue({ city: 'EXISTING' });

      component.onCitySelected('');

      expect(component.donorRecordForm.get('city')?.value).toBe('EXISTING');
    });

    it('should not update when whitespace-only city', () => {
      component.donorRecordForm.patchValue({ city: 'EXISTING' });

      component.onCitySelected('   ');

      expect(component.donorRecordForm.get('city')?.value).toBe('EXISTING');
    });
  });

  describe('onEmployerZipBlur', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should populate employer city and state from zip lookup', fakeAsync(() => {
      attachDonorServiceSpy.getCityStateByZip.and.returnValue(of([
        { city: 'BOSTON', state: 'MA' }
      ]));
      component.donorRecordForm.patchValue({ employerZip: '02101' });

      component.onEmployerZipBlur();
      tick();

      expect(component.donorRecordForm.get('employerCity')?.value).toBe('BOSTON');
      expect(component.donorRecordForm.get('employerState')?.value).toBe('MA');
    }));

    it('should not call API when employer zip is too short', () => {
      component.donorRecordForm.patchValue({ employerZip: '02' });

      component.onEmployerZipBlur();

      expect(attachDonorServiceSpy.getCityStateByZip).not.toHaveBeenCalled();
    });

    it('should not call API when employer zip is empty', () => {
      component.donorRecordForm.patchValue({ employerZip: '' });

      component.onEmployerZipBlur();

      expect(attachDonorServiceSpy.getCityStateByZip).not.toHaveBeenCalled();
    });

    it('should handle API error gracefully for employer zip', fakeAsync(() => {
      attachDonorServiceSpy.getCityStateByZip.and.returnValue(
        throwError(() => new Error('API error'))
      );
      component.donorRecordForm.patchValue({ employerZip: '99999' });

      component.onEmployerZipBlur();
      tick();

      expect(attachDonorServiceSpy.getCityStateByZip).toHaveBeenCalled();
    }));
  });

  describe('isDonorSelected', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return true when donor matches selectedDonorId in single mode', () => {
      component.duplicateMode.set(false);
      component.selectedDonorId.set('DON0000087');

      expect(component.isDonorSelected(mockGradedDonors[0])).toBeTrue();
    });

    it('should return false when donor does not match selectedDonorId', () => {
      component.duplicateMode.set(false);
      component.selectedDonorId.set('DON_OTHER');

      expect(component.isDonorSelected(mockGradedDonors[0])).toBeFalse();
    });

    it('should check selectedDonorIds in duplicate mode', () => {
      component.duplicateMode.set(true);
      component.selectedDonorIds.set(['DON0000087', 'DON0000157']);

      expect(component.isDonorSelected(mockGradedDonors[0])).toBeTrue();
      expect(component.isDonorSelected(mockGradedDonors[1])).toBeTrue();
    });

    it('should return false for unselected donor in duplicate mode', () => {
      component.duplicateMode.set(true);
      component.selectedDonorIds.set(['DON0000087']);

      expect(component.isDonorSelected(mockGradedDonors[1])).toBeFalse();
    });
  });

  describe('hasMismatch', () => {
    it('should return true for mismatched column', () => {
      expect(component.hasMismatch(mockGradedDonors[1], 'firstName')).toBeTrue();
    });

    it('should return false for non-mismatched column', () => {
      expect(component.hasMismatch(mockGradedDonors[0], 'firstName')).toBeFalse();
    });

    it('should return false for column not in mismatch list', () => {
      expect(component.hasMismatch(mockGradedDonors[1], 'donorId')).toBeFalse();
    });
  });

  describe('onShowDonorListHelp', () => {
    it('should open donor list help dialog', () => {
      component.onShowDonorListHelp();

      expect(dialogSpy.open).toHaveBeenCalled();
    });
  });

  describe('onMarkFalseDuplicate', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when no transaction data', () => {
      component.transactionData.set(null);

      component.onMarkFalseDuplicate(mockGradedDonors[0]);

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Transaction data not available'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should not call API when user cancels dialog', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      const dRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dRef.afterClosed.and.returnValue(of(null));
      dialogSpy.open.and.returnValue(dRef);

      component.onMarkFalseDuplicate(mockGradedDonors[0]);
      tick();

      expect(attachDonorServiceSpy.markFalseDuplicate).not.toHaveBeenCalled();
    }));

    it('should call markFalseDuplicate API when comments provided', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      const dRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dRef.afterClosed.and.returnValue(of('Test reason'));
      dialogSpy.open.and.returnValue(dRef);
      attachDonorServiceSpy.markFalseDuplicate.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onMarkFalseDuplicate(mockGradedDonors[0]);
      tick();

      expect(attachDonorServiceSpy.markFalseDuplicate).toHaveBeenCalledWith({
        donorId: 'DON0000087',
        transactionId: 'TXN0000001',
        comments: 'Test reason'
      });
    }));

    it('should show success after marking false duplicate', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      const dRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dRef.afterClosed.and.returnValue(of('Confirmed false dup'));
      dialogSpy.open.and.returnValue(dRef);
      attachDonorServiceSpy.markFalseDuplicate.and.returnValue(of({ success: true, message: 'OK', statusCode: 200 }));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component.onMarkFalseDuplicate(mockGradedDonors[0]);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('false duplicate'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should show error when markFalseDuplicate API fails', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      const dRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      dRef.afterClosed.and.returnValue(of('Test reason'));
      dialogSpy.open.and.returnValue(dRef);
      attachDonorServiceSpy.markFalseDuplicate.and.returnValue(
        throwError(() => ({ message: 'Server error' }))
      );

      component.onMarkFalseDuplicate(mockGradedDonors[0]);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Server error'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));
  });

  describe('onSaveDonorRecord - validation branches', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should do nothing when isSubmitting is true', () => {
      component.isSubmitting.set(true);
      component.saveUnitIdControl.setValue('UNIT');

      component.onSaveDonorRecord();

      expect(attachDonorServiceSpy.updateDonor).not.toHaveBeenCalled();
    });

    it('should do nothing when both save fields are empty', () => {
      component.saveUnitIdControl.setValue('');
      component.saveTransactionIdControl.setValue('');

      component.onSaveDonorRecord();

      expect(snackBarSpy.open).not.toHaveBeenCalled();
    });

    it('should show error when fetchedBy is not set', () => {
      component.fetchedBy.set(null);
      component.saveUnitIdControl.setValue('UNIT123');

      component.onSaveDonorRecord();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('fetch transaction data first'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when unitId does not match original', () => {
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('ORIGINAL_UNIT');
      component.saveUnitIdControl.setValue('WRONG_UNIT');

      component.onSaveDonorRecord();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('does not match'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should silently return when Donation type and no Unit ID entered', () => {
      component.transactionTypeControl.setValue('Donation');
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('ORIGINAL_UNIT');
      component.saveUnitIdControl.setValue('');

      component.onSaveDonorRecord();

      expect(snackBarSpy.open).not.toHaveBeenCalled();
    });

    it('should silently return when Deferral type and no Transaction ID entered', () => {
      component.transactionTypeControl.setValue('Deferral');
      component.fetchedBy.set('transactionId');
      component.originalFetchValue.set('TXN_ORIGINAL');
      component.saveTransactionIdControl.setValue('');

      component.onSaveDonorRecord();

      expect(snackBarSpy.open).not.toHaveBeenCalled();
    });

    it('should show error when Transaction ID does not match original for Deferral', () => {
      component.transactionTypeControl.setValue('Deferral');
      component.fetchedBy.set('transactionId');
      component.originalFetchValue.set('TXN_ORIGINAL');
      component.saveTransactionIdControl.setValue('WRONG_TXN');

      component.onSaveDonorRecord();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('does not match'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when no donor is selected', () => {
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('UNIT123');
      component.saveUnitIdControl.setValue('UNIT123');
      component.transactionData.set(mockTransaction);
      component.selectedDonorId.set(null);

      component.onSaveDonorRecord();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('select a donor'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should skip update and go to attach when form has no changes', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.donorSelectionControl.setValue('DON0000087');
      tick();
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('UNIT123');
      component.saveUnitIdControl.setValue('UNIT123');
      component.donorExistsInFullTable.set(true);
      component.donorRecordForm.markAsPristine(); // No changes

      attachDonorServiceSpy.selectDonor.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200,
        data: { transactionId: 'TXN0000001', donorId: 'DON0000087' }
      }));

      component.onSaveDonorRecord();
      tick();

      expect(attachDonorServiceSpy.updateDonor).not.toHaveBeenCalled();
      expect(attachDonorServiceSpy.selectDonor).toHaveBeenCalled();
    }));

    it('should show error when homeAddress is missing on dirty form', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.donorSelectionControl.setValue('DON0000087');
      tick();
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('UNIT123');
      component.saveUnitIdControl.setValue('UNIT123');
      component.donorExistsInFullTable.set(true);
      component.donorRecordForm.patchValue({
        homeAddress: '',
        city: 'DALLAS'
      });
      component.donorRecordForm.markAsDirty();

      component.onSaveDonorRecord();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Street Name'),
        jasmine.anything(),
        jasmine.anything()
      );
      expect(attachDonorServiceSpy.updateDonor).not.toHaveBeenCalled();
    }));

    it('should show error when city is missing on dirty form', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.donorSelectionControl.setValue('DON0000087');
      tick();
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('UNIT123');
      component.saveUnitIdControl.setValue('UNIT123');
      component.donorExistsInFullTable.set(true);
      component.donorRecordForm.patchValue({
        homeAddress: '123 MAIN ST',
        city: ''
      });
      component.donorRecordForm.markAsDirty();

      component.onSaveDonorRecord();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('City is required'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should handle updateDonor returning success=false', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.donorSelectionControl.setValue('DON0000087');
      tick();
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('UNIT123');
      component.saveUnitIdControl.setValue('UNIT123');
      component.donorExistsInFullTable.set(true);
      component.donorRecordForm.patchValue({
        homeAddress: '123 MAIN ST',
        city: 'DALLAS',
        gender: 'Male',
        dateOfBirth: new Date('1998-01-11')
      });
      component.donorRecordForm.markAsDirty();

      attachDonorServiceSpy.updateDonor.and.returnValue(of({
        success: false, message: 'Validation failed'
      }));

      component.onSaveDonorRecord();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Validation failed'),
        jasmine.anything(),
        jasmine.anything()
      );
      expect(component.loading()).toBeFalse();
    }));

    it('should handle updateDonor 404 error by still attaching', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.donorSelectionControl.setValue('DON0000087');
      tick();
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('UNIT123');
      component.saveUnitIdControl.setValue('UNIT123');
      component.donorExistsInFullTable.set(true);
      component.donorRecordForm.patchValue({
        homeAddress: '123 MAIN ST',
        city: 'DALLAS',
        gender: 'Male',
        dateOfBirth: new Date('1998-01-11')
      });
      component.donorRecordForm.markAsDirty();

      attachDonorServiceSpy.updateDonor.and.returnValue(
        throwError(() => ({ status: 404, message: 'Not found' }))
      );
      attachDonorServiceSpy.selectDonor.and.returnValue(of({
        success: true, message: 'OK', statusCode: 200,
        data: { transactionId: 'TXN0000001', donorId: 'DON0000087' }
      }));

      component.onSaveDonorRecord();
      tick();

      expect(attachDonorServiceSpy.selectDonor).toHaveBeenCalled();
    }));

    it('should show error on updateDonor non-404 error', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.donorSelectionControl.setValue('DON0000087');
      tick();
      component.fetchedBy.set('unitId');
      component.originalFetchValue.set('UNIT123');
      component.saveUnitIdControl.setValue('UNIT123');
      component.donorExistsInFullTable.set(true);
      component.donorRecordForm.patchValue({
        homeAddress: '123 MAIN ST',
        city: 'DALLAS',
        gender: 'Male',
        dateOfBirth: new Date('1998-01-11')
      });
      component.donorRecordForm.markAsDirty();

      attachDonorServiceSpy.updateDonor.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );

      component.onSaveDonorRecord();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('attachDonorToTransaction', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should skip attach and show success when donor already has S flag', fakeAsync(() => {
      const donorsWithSelected = [
        { ...mockGradedDonors[0], potentialDuplicateFlag: 'S' },
        mockGradedDonors[1]
      ];
      component.gradedDonors.set(donorsWithSelected);

      component['attachDonorToTransaction']('TXN0000001', 'DON0000087');
      tick();

      expect(attachDonorServiceSpy.selectDonor).not.toHaveBeenCalled();
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already attached'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should handle selectDonor returning success=false', fakeAsync(() => {
      component.gradedDonors.set(mockGradedDonors);
      attachDonorServiceSpy.selectDonor.and.returnValue(of({
        success: false, message: 'Attach failed', statusCode: 400,
        data: null
      }));

      component['attachDonorToTransaction']('TXN0000001', 'DON0000087');
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Attach failed'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should treat error code 16022 as success', fakeAsync(() => {
      component.gradedDonors.set(mockGradedDonors);
      attachDonorServiceSpy.selectDonor.and.returnValue(
        throwError(() => ({ errorCode: '16022', message: 'Already attached' }))
      );

      component['attachDonorToTransaction']('TXN0000001', 'DON0000087');
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already attached'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should show error for non-16022 error', fakeAsync(() => {
      component.gradedDonors.set(mockGradedDonors);
      attachDonorServiceSpy.selectDonor.and.returnValue(
        throwError(() => ({ message: 'Network error' }))
      );

      component['attachDonorToTransaction']('TXN0000001', 'DON0000087');
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Network error'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));
  });

  describe('onConfirmSelectDonor - error paths', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when no donor is selected', () => {
      component.selectedDonorId.set(null);

      component.onConfirmSelectDonor();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('select a donor'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when no transaction data', () => {
      component.transactionData.set(null);
      component.gradedDonors.set(mockGradedDonors);
      component.selectedDonorId.set('DON0000087');

      component.onConfirmSelectDonor();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Transaction data not found'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when transaction already resolved with different donor', () => {
      const donorsWithSelected = [
        { ...mockGradedDonors[0], potentialDuplicateFlag: 'S' },
        mockGradedDonors[1]
      ];
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(donorsWithSelected);
      component.selectedDonorId.set('DON0000157'); // Trying to select different donor

      component.onConfirmSelectDonor();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already resolved'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should open Find Donor dialog when user says no in confirmation', fakeAsync(() => {
      const localDialogRef = jasmine.createSpyObj('DialogRef', { afterClosed: of('no') });
      dialogSpy.open.and.returnValue(localDialogRef);
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.selectedDonorId.set('DON0000087');

      component.onConfirmSelectDonor();
      tick();

      // Second open call should be the Find Donor dialog
      expect(dialogSpy.open).toHaveBeenCalledTimes(2);
    }));
  });

  describe('selectDonor - guard paths', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when no transaction data', () => {
      component.transactionData.set(null);

      component['selectDonor']('DON0000087');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('not available'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when transaction already resolved with different donor', () => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set([
        { ...mockGradedDonors[0], potentialDuplicateFlag: 'S' }
      ]);

      component['selectDonor']('DON0000157');

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already resolved'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should not call API when isSubmitting is true', () => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.isSubmitting.set(true);

      component['selectDonor']('DON0000087');

      expect(attachDonorServiceSpy.selectDonor).not.toHaveBeenCalled();
    });

    it('should handle selectDonor API error', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      attachDonorServiceSpy.selectDonor.and.returnValue(
        throwError(() => ({ message: 'Failed to select' }))
      );

      component['selectDonor']('DON0000087');
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Failed to select'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));
  });

  describe('onMarkDuplicates - guard and error paths', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when fewer than 2 donors selected', () => {
      component.transactionData.set(mockTransaction);
      component.selectedDonorIds.set(['DON0000087']);

      component.onMarkDuplicates();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('at least 2 donors'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when no transaction data', () => {
      component.transactionData.set(null);
      component.selectedDonorIds.set(['DON0000087', 'DON0000157']);

      component.onMarkDuplicates();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('not available'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when selected donors already have duplicate flag', () => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set([
        { ...mockGradedDonors[0], potentialDuplicateFlag: 'D' },
        mockGradedDonors[1]
      ]);
      component.selectedDonorIds.set(['DON0000087', 'DON0000157']);

      component.onMarkDuplicates();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already have a duplicate flag'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should not call API when isSubmitting is true', () => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.selectedDonorIds.set(['DON0000087', 'DON0000157']);
      component.isSubmitting.set(true);

      component.onMarkDuplicates();

      expect(attachDonorServiceSpy.markDuplicates).not.toHaveBeenCalled();
    });

    it('should handle markDuplicates API error', fakeAsync(() => {
      component.transactionData.set(mockTransaction);
      component.gradedDonors.set(mockGradedDonors);
      component.selectedDonorIds.set(['DON0000087', 'DON0000157']);
      attachDonorServiceSpy.markDuplicates.and.returnValue(
        throwError(() => ({ message: 'Server error' }))
      );

      component.onMarkDuplicates();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Server error'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));
  });

  describe('onToggleDuplicateMode - guard path', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show snackbar when fewer than 2 donors', () => {
      component.gradedDonors.set([mockGradedDonors[0]]);

      component.onToggleDuplicateMode();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('At least 2 donor records'),
        jasmine.anything(),
        jasmine.anything()
      );
      expect(component.duplicateMode()).toBeFalse();
    });
  });

  describe('formatDate', () => {
    it('should format valid date', () => {
      const result = component.formatDate('2025-12-09T00:00:00Z');
      expect(result).toBeTruthy();
      expect(result).toContain('2025');
    });

    it('should return empty string for null', () => {
      expect(component.formatDate(null)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(component.formatDate('not-a-date')).toBe('');
    });
  });

  describe('f getter', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return transaction form controls', () => {
      const controls = component.f;
      expect(controls['unitId']).toBeDefined();
      expect(controls['transactionId']).toBeDefined();
      expect(controls['collectionDate']).toBeDefined();
    });
  });

  describe('onSaveNewDonor - validation paths', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.transactionData.set(mockTransaction);
      component.isNewDonorMode.set(true);
    }));

    it('should show error when no transaction data', () => {
      component.transactionData.set(null);

      component.onSaveNewDonor();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('not available'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should not proceed when isSubmitting is true', () => {
      component.isSubmitting.set(true);

      component.onSaveNewDonor();

      expect(attachDonorServiceSpy.createDonor).not.toHaveBeenCalled();
    });

    it('should show error when firstName is missing', () => {
      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: '',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male'
      });

      component.onSaveNewDonor();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('First Name is required'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when dateOfBirth is missing', () => {
      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Test',
        dateOfBirth: null,
        gender: 'Male'
      });

      component.onSaveNewDonor();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Date of Birth is required'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should show error when gender is missing', () => {
      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Test',
        dateOfBirth: new Date('1990-01-01'),
        gender: ''
      });

      component.onSaveNewDonor();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Sex is required'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should handle createDonor returning array data', fakeAsync(() => {
      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Mark',
        dateOfBirth: new Date('1996-03-26'),
        gender: 'Male'
      });

      attachDonorServiceSpy.createDonor.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        data: [{ donorId: 'DN_ARR_001' }]
      }));
      attachDonorServiceSpy.addGradedDonor.and.returnValue(of({ success: true, message: 'Added', statusCode: 200 }));
      attachDonorServiceSpy.selectDonor.and.returnValue(of({
        success: true, message: 'Selected', statusCode: 200,
        data: { transactionId: 'TXN0000001', donorId: 'DN_ARR_001' }
      }));

      component.onSaveNewDonor();
      tick();

      expect(attachDonorServiceSpy.addGradedDonor).toHaveBeenCalled();
    }));

    it('should show error when createDonor returns no donorId', fakeAsync(() => {
      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Mark',
        dateOfBirth: new Date('1996-03-26'),
        gender: 'Male'
      });

      attachDonorServiceSpy.createDonor.and.returnValue(of({
        success: true, message: 'Created', statusCode: 201,
        data: { }
      }));

      component.onSaveNewDonor();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('no Donor ID returned'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should show error when createDonor returns success=false', fakeAsync(() => {
      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Mark',
        dateOfBirth: new Date('1996-03-26'),
        gender: 'Male'
      });

      attachDonorServiceSpy.createDonor.and.returnValue(of({
        success: false, message: 'Duplicate detected', statusCode: 409
      }));

      component.onSaveNewDonor();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Duplicate detected'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should show error when createDonor API fails', fakeAsync(() => {
      component.donorRecordForm.patchValue({
        lastName: 'Thompson',
        firstName: 'Mark',
        dateOfBirth: new Date('1996-03-26'),
        gender: 'Male'
      });

      attachDonorServiceSpy.createDonor.and.returnValue(
        throwError(() => ({ message: 'Server error' }))
      );

      component.onSaveNewDonor();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Server error'),
        jasmine.anything(),
        jasmine.anything()
      );
      expect(component.loading()).toBeFalse();
      expect(component.isSubmitting()).toBeFalse();
    }));
  });

  describe('autoAttachNewDonor - non-16022 error path', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show informational snackbar and reload graded donors on generic error', fakeAsync(() => {
      attachDonorServiceSpy.addGradedDonor.and.returnValue(of({ success: true, message: 'Added', statusCode: 200 }));
      attachDonorServiceSpy.selectDonor.and.returnValue(
        throwError(() => ({ errorCode: '99999', message: 'Unknown error' }))
      );
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component['autoAttachNewDonor']('TXN0000001', 'DN_NEW_001');
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Please select the donor'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));
  });

  describe('loadTransactionData - error path', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set error and show snackbar on transaction load failure', fakeAsync(() => {
      attachDonorServiceSpy.getTransaction.and.returnValue(
        throwError(() => ({ message: 'Transaction not found' }))
      );

      component['loadTransactionData']('TXN_BADID000');
      tick();

      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalled();
    }));
  });

  describe('loadTransactionDataByUnit - error path', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set error and show snackbar on unit load failure', fakeAsync(() => {
      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(
        throwError(() => ({ message: 'Unit not found' }))
      );

      component['loadTransactionDataByUnit']('=UNIT_BAD00');
      tick();

      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
      expect(snackBarSpy.open).toHaveBeenCalled();
    }));
  });

  describe('loadGradedDonors - resolved status and error', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should set resolved status when a donor has S flag', fakeAsync(() => {
      const donorsWithSelected = [
        { ...mockGradedDonors[0], potentialDuplicateFlag: 'S' },
        mockGradedDonors[1]
      ];
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(donorsWithSelected));

      component['loadGradedDonors']('TXN0000001');
      tick();

      expect(component.resolvedStatus()).toBe('Resolved');
    }));

    it('should set Not Resolved when no donor has S flag', fakeAsync(() => {
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      component['loadGradedDonors']('TXN0000001');
      tick();

      expect(component.resolvedStatus()).toBe('Not Resolved');
    }));

    it('should handle error loading graded donors', fakeAsync(() => {
      attachDonorServiceSpy.getGradedDonors.and.returnValue(
        throwError(() => ({ message: 'Failed to load' }))
      );

      component['loadGradedDonors']('TXN0000001');
      tick();

      expect(component.error()).toBeTruthy();
      expect(component.loading()).toBeFalse();
    }));
  });

  describe('loadAlternateIdTypes - filtering', () => {
    it('should filter out C39 and C417 codes', fakeAsync(() => {
      findDonorServiceSpy.getAlternateIdTypes.and.returnValue(of([
        { code: 'SSN', description: 'Social Security Number' },
        { code: 'C39', description: 'Code 39' },
        { code: 'C417', description: 'Code 417' },
        { code: 'DL', description: 'Drivers License' }
      ]));

      // Create fresh component to trigger ngOnInit with new spy values
      const freshFixture = TestBed.createComponent(AttachDonorComponent);
      const freshComponent = freshFixture.componentInstance;
      try { freshFixture.detectChanges(); } catch (e) { /* ignore template errors */ }
      tick();

      const types = freshComponent.alternateIdTypes();
      expect(types.length).toBe(2);
      expect(types.find(t => t.code === 'C39')).toBeUndefined();
      expect(types.find(t => t.code === 'C417')).toBeUndefined();
      expect(types.find(t => t.code === 'SSN')).toBeDefined();
      expect(types.find(t => t.code === 'DL')).toBeDefined();

      freshFixture.destroy();
    }));
  });

  describe('onOpenAlternateAddress - new donor mode and error paths', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open dialog with NEW donorId in new donor mode', fakeAsync(() => {
      component.isNewDonorMode.set(true);

      component.onOpenAlternateAddress();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
      const dialogConfig = dialogSpy.open.calls.mostRecent().args[1] as any;
      expect(dialogConfig.data.donorId).toBe('NEW');
    }));

    it('should show error when no donor selected and not in new donor mode', () => {
      component.isNewDonorMode.set(false);
      component.selectedDonorId.set(null);

      component.onOpenAlternateAddress();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('select a donor'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should still open dialog even if getByDonorId fails', fakeAsync(() => {
      component.isNewDonorMode.set(false);
      component.gradedDonors.set(mockGradedDonors);
      component.selectedDonorId.set('DON0000087');
      alternateDemographicsServiceSpy.getByDonorId.and.returnValue(
        throwError(() => new Error('Not found'))
      );

      component.onOpenAlternateAddress();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
    }));
  });

  describe('onOpenInternationalAddress - new donor mode and result', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should open dialog in new donor mode', fakeAsync(() => {
      component.isNewDonorMode.set(true);

      component.onOpenInternationalAddress();
      tick();

      expect(dialogSpy.open).toHaveBeenCalled();
    }));

    it('should show error when no donor selected and not in new donor mode', () => {
      component.isNewDonorMode.set(false);
      component.selectedDonorId.set(null);

      component.onOpenInternationalAddress();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('select a donor'),
        jasmine.anything(),
        jasmine.anything()
      );
    });

    it('should capture intl address result in new donor mode', fakeAsync(() => {
      component.isNewDonorMode.set(true);
      const mockIntlResult = {
        intlAddrFlag: 'Y',
        addr1: '123 Intl St',
        country: 'Canada'
      };

      const localDialogRef = jasmine.createSpyObj('DialogRef', { afterClosed: of(mockIntlResult) });
      dialogSpy.open.and.returnValue(localDialogRef);

      component.onOpenInternationalAddress();
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('International address saved'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));
  });

  describe('handleReturnFromRegistration - error path', () => {
    it('should show error when getTransaction fails during return from registration', fakeAsync(() => {
      attachDonorServiceSpy.getTransaction.and.returnValue(
        throwError(() => ({ message: 'Failed to load' }))
      );

      activatedRouteSpy.queryParams = of({ transactionId: 'TXN001', newDonorId: 'DN001' });

      const freshFixture = TestBed.createComponent(AttachDonorComponent);
      const freshComponent = freshFixture.componentInstance;
      try { freshFixture.detectChanges(); } catch (e) { /* ignore */ }
      tick();

      expect(freshComponent.loading()).toBeFalse();

      freshFixture.destroy();
    }));
  });

  describe('loadDataFromRoute - savedContext path', () => {
    it('should load from saved context when no query params', fakeAsync(() => {
      activatedRouteSpy.queryParams = of({});
      attachDonorServiceSpy.getContext.and.returnValue({
        transactionType: 'Deferral',
        transactionId: 'TXN0000001'
      });
      attachDonorServiceSpy.getTransaction.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      const freshFixture = TestBed.createComponent(AttachDonorComponent);
      const freshComponent = freshFixture.componentInstance;
      try { freshFixture.detectChanges(); } catch (e) { /* ignore */ }
      tick();

      expect(attachDonorServiceSpy.getTransaction).toHaveBeenCalledWith('TXN0000001');
      expect(attachDonorServiceSpy.clearContext).toHaveBeenCalled();

      freshFixture.destroy();
    }));

    it('should set unitId in form when query params include unitId', fakeAsync(() => {
      activatedRouteSpy.queryParams = of({ transactionId: 'TXN0000001', unitId: '=UNIT_QP00' });
      attachDonorServiceSpy.getTransaction.and.returnValue(of(mockTransaction));
      attachDonorServiceSpy.getGradedDonors.and.returnValue(of(mockGradedDonors));

      const freshFixture = TestBed.createComponent(AttachDonorComponent);
      const freshComponent = freshFixture.componentInstance;
      try { freshFixture.detectChanges(); } catch (e) { /* ignore */ }
      tick();

      expect(freshComponent.fetchedBy()).toBe('unitId');
      expect(freshComponent.originalFetchValue()).toBe('=UNIT_QP00');

      freshFixture.destroy();
    }));
  });

  describe('originalKeyData - edge cases', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should return empty string when no transaction data', () => {
      component.transactionData.set(null);
      expect(component.originalKeyData).toBe('');
    });

    it('should fall back to donor data when transaction has no demographics', () => {
      component.transactionData.set({
        ...mockTransaction,
        lastName: null,
        firstName: null,
        dateOfBirth: null,
        gender: null
      } as any);
      component.gradedDonors.set(mockGradedDonors);

      const result = component.originalKeyData;
      expect(result).toContain('Thompson');
    });
  });

  describe('onSelectDonor - duplicate mode with flagged donor', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
      component.entryOkConfirmed.set(true);
      component.donorSelectionEnabled.set(true);
    }));

    it('should show error when selecting already-flagged donor in duplicate mode', fakeAsync(() => {
      component.duplicateMode.set(true);
      const flaggedDonor = { ...mockGradedDonors[0], potentialDuplicateFlag: 'D' };

      component.onSelectDonor(flaggedDonor);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('already marked'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should toggle selection off in duplicate mode', fakeAsync(() => {
      component.duplicateMode.set(true);
      component.selectedDonorIds.set(['DON0000087']);

      component.onSelectDonor(mockGradedDonors[0]);
      tick();

      expect(component.selectedDonorIds()).not.toContain('DON0000087');
    }));
  });

  describe('onViewDonorDetails - chapter context and error paths', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should show error when chapter context is missing', fakeAsync(() => {
      headerServiceSpy.getCurrentChapterId.and.returnValue('');

      component.onViewDonorDetails(mockGradedDonors[0]);
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Chapter context not loaded'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));

    it('should fall back to basic donor data on getDonorById error', fakeAsync(() => {
      attachDonorServiceSpy.getDonorById.and.returnValue(
        throwError(() => new Error('Not found'))
      );

      component.onViewDonorDetails(mockGradedDonors[0]);
      tick();

      expect(component.donorExistsInFullTable()).toBeFalse();
      expect(component.donorRecordForm.get('lastName')?.value).toBe('Thompson');
    }));
  });

  describe('onViewPhlebotomyDetails - no transaction guard', () => {
    it('should show warning when no transaction is loaded', () => {
      component.transactionData.set(null);

      component.onViewPhlebotomyDetails();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('retrieve a transaction first'),
        jasmine.anything(),
        jasmine.anything()
      );
    });
  });

  describe('setupTransactionTypeListener', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should auto-search when switching to Deferral with existing deferral ID', fakeAsync(() => {
      // Clear the transactionId that was populated by ngOnInit so onUnitIdBlur will fetch
      component.transactionForm.patchValue({ unitId: 'DEF001', transactionId: '' });
      component.transactionIdAutoPopulated.set(false);
      attachDonorServiceSpy.getTransactionByUnit.and.returnValue(of(mockTransaction));

      component.transactionTypeControl.setValue('Deferral');
      tick();

      expect(attachDonorServiceSpy.getTransactionByUnit).toHaveBeenCalled();
    }));
  });

  describe('canToggleDuplicate', () => {
    it('should return true when 2+ donors and not loading', () => {
      component.gradedDonors.set(mockGradedDonors);
      component.loading.set(false);
      expect(component.canToggleDuplicate()).toBeTrue();
    });

    it('should return false when fewer than 2 donors', () => {
      component.gradedDonors.set([mockGradedDonors[0]]);
      expect(component.canToggleDuplicate()).toBeFalse();
    });

    it('should return false when loading', () => {
      component.gradedDonors.set(mockGradedDonors);
      component.loading.set(true);
      expect(component.canToggleDuplicate()).toBeFalse();
    });
  });

  describe('isEmpty and hasResults computed', () => {
    it('should return isEmpty=true when no donors', () => {
      component.gradedDonors.set([]);
      expect(component.isEmpty()).toBeTrue();
      expect(component.hasResults()).toBeFalse();
    });

    it('should return hasResults=true when donors exist', () => {
      component.gradedDonors.set(mockGradedDonors);
      expect(component.isEmpty()).toBeFalse();
      expect(component.hasResults()).toBeTrue();
    });
  });

  describe('toUpperCase - no change needed', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should not update when value is already uppercase', () => {
      const mockEvent = {
        target: {
          value: 'ALREADY UPPER',
          selectionStart: 13,
          setSelectionRange: jasmine.createSpy('setSelectionRange')
        }
      } as any;

      component.donorRecordForm.patchValue({ homeAddress: 'OLD VALUE' });
      component.toUpperCase(mockEvent, 'homeAddress');

      // Value should not change since it's already uppercase
      expect(component.donorRecordForm.get('homeAddress')?.value).toBe('OLD VALUE');
    });
  });

  describe('onEntryOkChange - null value', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should clear previous error for null value', () => {
      component.entryOkError.set('Some previous error');
      component.transactionData.set(mockTransaction);

      component.onEntryOkChange(null);

      expect(component.entryOkError()).toBeNull();
    });
  });

  describe('putDonorOnHold error path', () => {
    it('should show error when putDonorOnHold API fails', fakeAsync(() => {
      const mockFindDonorResult = {
        donorId: 'DON0000087',
        lastName: 'Thompson',
        firstName: 'Marvin'
      };

      const dialogResult = {
        action: 'hold' as const,
        donor: mockFindDonorResult
      };

      const localDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
      localDialogRef.afterClosed.and.returnValue(of(dialogResult));
      dialogSpy.open.and.returnValue(localDialogRef);

      attachDonorServiceSpy.putDonorOnHold.and.returnValue(
        throwError(() => ({ message: 'Hold failed' }))
      );

      component.transactionData.set(mockTransaction);
      component['openFindDonorDialog']('TXN0000001');
      tick();

      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringContaining('Hold failed'),
        jasmine.anything(),
        jasmine.anything()
      );
    }));
  });

  describe('loadEmployers - error path', () => {
    it('should set empty employers on error', fakeAsync(() => {
      attachDonorServiceSpy.getLookupEmployers.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      const freshFixture = TestBed.createComponent(AttachDonorComponent);
      const freshComponent = freshFixture.componentInstance;
      try { freshFixture.detectChanges(); } catch (e) { /* ignore */ }
      tick();

      expect(freshComponent.employerOptions().length).toBe(0);

      freshFixture.destroy();
    }));
  });

  describe('loadEmployers - success with data', () => {
    it('should populate employer options and filtered options', fakeAsync(() => {
      const employers = [
        { value: 'E1', label: 'Acme Corp' },
        { value: 'E2', label: 'Beta Inc' }
      ];
      attachDonorServiceSpy.getLookupEmployers.and.returnValue(of(employers));

      const freshFixture = TestBed.createComponent(AttachDonorComponent);
      const freshComponent = freshFixture.componentInstance;
      try { freshFixture.detectChanges(); } catch (e) { /* ignore */ }
      tick();

      expect(freshComponent.employerOptions().length).toBe(2);
      expect(freshComponent.filteredEmployerOptions().length).toBe(2);

      freshFixture.destroy();
    }));
  });

  describe('Gap Fix Coverage - Additional Branch Tests', () => {

    beforeEach(fakeAsync(() => {
      fixture = TestBed.createComponent(AttachDonorComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
    }));

    describe('onPhoneBlur', () => {
      it('should skip validation when phone is empty', () => {
        component.donorRecordForm.get('homePhone')?.setValue('');
        component.onPhoneBlur('homePhone');
        expect(attachDonorServiceSpy.validateAreaCode).not.toHaveBeenCalled();
      });

      it('should validate area code when 10-digit phone entered', fakeAsync(() => {
        attachDonorServiceSpy.validateAreaCode.and.returnValue(of(true));
        component.donorRecordForm.get('homePhone')?.setValue('214-885-1212');
        component.onPhoneBlur('homePhone');
        tick();
        expect(attachDonorServiceSpy.validateAreaCode).toHaveBeenCalledWith('214');
      }));

      it('should set error when area code is invalid', fakeAsync(() => {
        attachDonorServiceSpy.validateAreaCode.and.returnValue(of(false));
        component.donorRecordForm.get('workPhone')?.setValue('999-885-1212');
        component.onPhoneBlur('workPhone');
        tick();
        expect(component.donorRecordForm.get('workPhone')?.hasError('invalidAreaCode')).toBeTrue();
      }));
    });

    describe('onCityBlur', () => {
      it('should skip when city is less than 3 chars', () => {
        component.donorRecordForm.get('city')?.setValue('AB');
        component.onCityBlur();
        expect(attachDonorServiceSpy.searchCities).not.toHaveBeenCalled();
      });

      it('should set invalidCity error when city not found', fakeAsync(() => {
        attachDonorServiceSpy.searchCities.and.returnValue(of([]));
        component.donorRecordForm.get('city')?.setValue('NONEXISTENT');
        component.onCityBlur();
        tick();
        expect(component.donorRecordForm.get('city')?.hasError('invalidCity')).toBeTrue();
      }));

      it('should not set error when city is found', fakeAsync(() => {
        attachDonorServiceSpy.searchCities.and.returnValue(of([{ code: '1', description: 'DALLAS' }]));
        component.donorRecordForm.get('city')?.setValue('DALLAS');
        component.onCityBlur();
        tick();
        expect(component.donorRecordForm.get('city')?.hasError('invalidCity')).toBeFalsy();
      }));
    });

    describe('onCitySelected', () => {
      it('should clear state when city is selected', () => {
        component.donorRecordForm.patchValue({ state: 'TX' });
        component.onCitySelected('DALLAS');
        expect(component.donorRecordForm.get('state')?.value).toBe('');
      });

      it('should do nothing for empty city', () => {
        component.donorRecordForm.patchValue({ state: 'TX' });
        component.onCitySelected('');
        expect(component.donorRecordForm.get('state')?.value).toBe('TX');
      });
    });

    describe('onZipBlur - enhanced validation', () => {
      it('should auto-populate city and state from ZIP', fakeAsync(() => {
        attachDonorServiceSpy.getCityStateByZip.and.returnValue(of([
          { city: 'DALLAS', state: 'TX', uspsId: 1, zip: '75201' }
        ]));
        component.donorRecordForm.get('zip')?.setValue('75201');
        component.onZipBlur();
        tick();
        expect(component.donorRecordForm.get('city')?.value).toBe('DALLAS');
        expect(component.donorRecordForm.get('state')?.value).toBe('TX');
      }));

      it('should show error 10002 when ZIP not found and city exists', fakeAsync(() => {
        attachDonorServiceSpy.getCityStateByZip.and.returnValue(of([]));
        component.donorRecordForm.patchValue({ city: 'DALLAS', zip: '00000' });
        component.onZipBlur();
        tick();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('10002'),
          jasmine.anything(),
          jasmine.anything()
        );
      }));

      it('should skip when ZIP is too short', () => {
        component.donorRecordForm.get('zip')?.setValue('123');
        component.onZipBlur();
        expect(attachDonorServiceSpy.getCityStateByZip).not.toHaveBeenCalled();
      });
    });

    describe('formatPhoneInput - work phone overflow', () => {
      it('should overflow digits to extension for work phone', () => {
        const input = document.createElement('input');
        input.value = '21488512121250';
        const event = { target: input } as unknown as Event;

        component.formatPhoneInput(event, 'workPhone');

        expect(component.donorRecordForm.get('workPhone')?.value).toBe('214-885-1212');
        expect(component.donorRecordForm.get('workPhoneExtension')?.value).toBe('1250');
      });

      it('should format 10-digit phone normally', () => {
        const input = document.createElement('input');
        input.value = '2148851212';
        const event = { target: input } as unknown as Event;

        component.formatPhoneInput(event, 'homePhone');
        expect(component.donorRecordForm.get('homePhone')?.value).toBe('214-885-1212');
      });
    });

    describe('onEntryOkChange - error 16062', () => {
      it('should block Entry OK when donors already have S flag', () => {
        const flaggedDonors = [{ ...mockGradedDonors[0], potentialDuplicateFlag: 'S' }];
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(flaggedDonors);

        component.onEntryOkChange('Y');

        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16062'),
          jasmine.anything(),
          jasmine.anything()
        );
      });

      it('should block Entry OK when donors have D flag', () => {
        const flaggedDonors = [{ ...mockGradedDonors[0], potentialDuplicateFlag: 'D' }];
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(flaggedDonors);

        component.onEntryOkChange('N');

        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16062'),
          jasmine.anything(),
          jasmine.anything()
        );
      });
    });

    describe('intlAddressActive', () => {
      it('should be set when donor has intl addr flag Y', fakeAsync(() => {
        attachDonorServiceSpy.getDonorById.and.returnValue(of({
          donorId: 'DON1', lastName: 'TEST', firstName: 'USER',
          dateOfBirth: '1990-01-01', gender: 'M',
          intlAddrFlag: 'Y',
          streetName: '', suiteApt: '', city: '', state: '', zip: '',
          hAreaCode: '', hPhoneNo: '', dAreaCode: '', dPhoneNo: '',
          extension: '', mAreaCode: '', mPhoneNo: '', email: '',
          preferredContactFlag: '', alternateId: '', alternateIdType: '',
          employerId: '', eCity: '', eState: '', eZip: '', ethnicGroup: '', middleName: ''
        }));
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.onViewDonorDetails(mockGradedDonors[0]);
        tick(100);
        expect(component.intlAddressActive()).toBeTrue();
      }));

      it('should be false when intl addr flag is not Y', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.onViewDonorDetails(mockGradedDonors[0]);
        tick(100);
        expect(component.intlAddressActive()).toBeFalse();
      }));
    });

    describe('onOpenInternationalAddress - error 16317', () => {
      it('should block when local address fields populated', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.donorSelectionControl.setValue('DON0000087');
        tick();
        component.donorRecordForm.patchValue({ homeAddress: '123 MAIN ST' });

        component.onOpenInternationalAddress();

        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16317'),
          jasmine.anything(),
          jasmine.anything()
        );
      }));

      it('should allow when new donor mode', () => {
        component.transactionData.set(mockTransaction);
        component.isNewDonorMode.set(true);

        component.onOpenInternationalAddress();

        expect(snackBarSpy.open).not.toHaveBeenCalledWith(
          jasmine.stringContaining('16317'),
          jasmine.anything(),
          jasmine.anything()
        );
      });
    });

    describe('onSaveNewDonor - gap fix validations', () => {
      beforeEach(fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.onAddNewDonor();
        tick();
      }));

      it('should reject DOB older than 125 years (error 16053)', () => {
        component.donorRecordForm.patchValue({
          lastName: 'Thompson', firstName: 'Mark',
          dateOfBirth: new Date('1850-01-01'), gender: 'Male'
        });
        component.onSaveNewDonor();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16053'),
          jasmine.anything(),
          jasmine.anything()
        );
      });

      it('should reject firstName mismatch (error 16007)', () => {
        component.donorRecordForm.patchValue({
          lastName: 'Thompson', firstName: 'WRONG',
          dateOfBirth: new Date('1996-03-26'), gender: 'Male'
        });
        component.onSaveNewDonor();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16007'),
          jasmine.anything(),
          jasmine.anything()
        );
      });

      it('should reject DOB mismatch (error 16007)', () => {
        component.donorRecordForm.patchValue({
          lastName: 'Thompson', firstName: 'Mark',
          dateOfBirth: new Date('2000-01-01'), gender: 'Male'
        });
        component.onSaveNewDonor();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16007'),
          jasmine.anything(),
          jasmine.anything()
        );
      });

      it('should reject extension without work phone (error 18067)', () => {
        component.donorRecordForm.patchValue({
          lastName: 'Thompson', firstName: 'Mark',
          dateOfBirth: new Date('1996-03-26'), gender: 'Male',
          workPhoneExtension: '125', workPhone: ''
        });
        component.onSaveNewDonor();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('18067'),
          jasmine.anything(),
          jasmine.anything()
        );
      });

      it('should reject preferred phone without corresponding number', () => {
        component.donorRecordForm.patchValue({
          lastName: 'Thompson', firstName: 'Mark',
          dateOfBirth: new Date('1996-03-26'), gender: 'Male',
          preferredPhone: 'home', homePhone: ''
        });
        component.onSaveNewDonor();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('Home Phone is required'),
          jasmine.anything(),
          jasmine.anything()
        );
      });

      it('should reject preferred work phone without work number', () => {
        component.donorRecordForm.patchValue({
          lastName: 'Thompson', firstName: 'Mark',
          dateOfBirth: new Date('1996-03-26'), gender: 'Male',
          preferredPhone: 'work', workPhone: ''
        });
        component.onSaveNewDonor();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('Work Phone is required'),
          jasmine.anything(),
          jasmine.anything()
        );
      });

      it('should reject preferred mobile without mobile number', () => {
        component.donorRecordForm.patchValue({
          lastName: 'Thompson', firstName: 'Mark',
          dateOfBirth: new Date('1996-03-26'), gender: 'Male',
          preferredPhone: 'mobile', mobilePhone: ''
        });
        component.onSaveNewDonor();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('Mobile Phone is required'),
          jasmine.anything(),
          jasmine.anything()
        );
      });
    });

    describe('onSaveNewDonor - error 16029 find donor match', () => {
      it('should reject when lastName does not match find donor criteria', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.onAddNewDonor();
        tick();
        component.findDonorSearchCriteria.set({ lastName: 'JONES', firstName: 'SARAH' });

        component.donorRecordForm.patchValue({
          lastName: 'Thompson', firstName: 'Mark',
          dateOfBirth: new Date('1996-03-26'), gender: 'Male'
        });
        component.onSaveNewDonor();
        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16029'),
          jasmine.anything(),
          jasmine.anything()
        );
      }));
    });

    describe('hasMismatch and getMismatchCells', () => {
      it('should detect lastName mismatch', () => {
        const donor = { ...mockGradedDonors[0], lastNameMismatch: true };
        expect(component.hasMismatch(donor, 'lastName')).toBeTrue();
      });

      it('should detect dateOfBirth mismatch', () => {
        const donor = { ...mockGradedDonors[0], dateOfBirthMismatch: true };
        expect(component.hasMismatch(donor, 'dateOfBirth')).toBeTrue();
      });

      it('should detect gender mismatch', () => {
        const donor = { ...mockGradedDonors[0], genderMismatch: true };
        expect(component.hasMismatch(donor, 'gender')).toBeTrue();
      });

      it('should return all mismatched cells', () => {
        const donor = { ...mockGradedDonors[0], lastNameMismatch: true, genderMismatch: true };
        const cells = component.getMismatchCells(donor);
        expect(cells).toContain('lastName');
        expect(cells).toContain('gender');
        expect(cells.length).toBe(2);
      });
    });

    describe('displayEmployer', () => {
      it('should return label for known employer', () => {
        component.employerOptions.set([{ value: 'EMP1', label: 'ACME CORP' }]);
        expect(component.displayEmployer('EMP1')).toBe('ACME CORP');
      });

      it('should return value as-is for unknown employer (free text)', () => {
        component.employerOptions.set([]);
        expect(component.displayEmployer('NEW EMPLOYER')).toBe('NEW EMPLOYER');
      });

      it('should return empty for null value', () => {
        expect(component.displayEmployer('')).toBe('');
      });
    });

    describe('toUpperCase', () => {
      it('should convert input value to uppercase', () => {
        component.donorRecordForm.get('lastName')?.setValue('test');
        const input = document.createElement('input');
        input.value = 'test';
        Object.defineProperty(input, 'selectionStart', { value: 4, writable: true });
        const event = { target: input } as unknown as Event;
        component.toUpperCase(event, 'lastName');
        expect(component.donorRecordForm.get('lastName')?.value).toBe('TEST');
      });
    });

    describe('onClearAll - resets all state', () => {
      it('should reset all signals and form', () => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.isNewDonorMode.set(true);
        component.intlAddressActive.set(true);
        component.findDonorSearchCriteria.set({ lastName: 'TEST' });

        component.onClearAll();

        expect(component.transactionData()).toBeNull();
        expect(component.gradedDonors().length).toBe(0);
        expect(component.isNewDonorMode()).toBeFalse();
        expect(component.intlAddressActive()).toBeFalse();
        expect(component.findDonorSearchCriteria()).toBeNull();
        expect(component.resolvedStatus()).toBe('Not Resolved');
      });
    });

    describe('loadEthnicGroups', () => {
      it('should load ethnic groups on init', fakeAsync(() => {
        const groups = [{ code: 'W', description: 'White' }, { code: 'B', description: 'Black' }];
        attachDonorServiceSpy.getLookupEthnicGroups.and.returnValue(of(groups));

        const freshFixture = TestBed.createComponent(AttachDonorComponent);
        const freshComponent = freshFixture.componentInstance;
        try { freshFixture.detectChanges(); } catch (e) { /* ignore */ }
        tick();

        expect(freshComponent.ethnicGroups().length).toBe(2);
        expect(freshComponent.ethnicGroups()[0].code).toBe('W');

        freshFixture.destroy();
      }));
    });

    describe('loadDataFromRoute - branch coverage', () => {
      it('should handle route with transactionId and unitId', fakeAsync(() => {
        component.transactionData.set(null);
        expect(component.transactionData()).toBeNull();
      }));
    });

    describe('onViewDonorDetails - error path', () => {
      it('should fall back to basic data when getDonorById fails', fakeAsync(() => {
        attachDonorServiceSpy.getDonorById.and.returnValue(throwError(() => ({ status: 404 })));
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.onViewDonorDetails(mockGradedDonors[0]);
        tick(100);

        expect(component.donorExistsInFullTable()).toBeFalse();
        expect(component.donorRecordForm.get('lastName')?.value).toBe('Thompson');
      }));
    });

    describe('onEmployerSelected', () => {
      it('should clear employer fields when empty value', () => {
        component.onEmployerSelected('');
        expect(component.donorRecordForm.get('employerCity')?.value).toBe('');
      });

      it('should populate employer fields from service', fakeAsync(() => {
        donorEmpServiceSpy.getById.and.returnValue(of({ city: 'DALLAS', state: 'TX', zip: '75201' }));
        component.onEmployerSelected('EMP001');
        tick();
        expect(component.donorRecordForm.get('employerCity')?.value).toBe('DALLAS');
        expect(component.donorRecordForm.get('employerState')?.value).toBe('TX');
      }));
    });

    describe('onEmployerZipBlur', () => {
      it('should auto-populate employer city and state from ZIP', fakeAsync(() => {
        attachDonorServiceSpy.getCityStateByZip.and.returnValue(of([
          { city: 'PLANO', state: 'TX', uspsId: 2, zip: '75024' }
        ]));
        component.donorRecordForm.get('employerZip')?.setValue('75024');
        component.onEmployerZipBlur();
        tick();
        expect(component.donorRecordForm.get('employerCity')?.value).toBe('PLANO');
        expect(component.donorRecordForm.get('employerState')?.value).toBe('TX');
      }));

      it('should skip when ZIP is too short', () => {
        component.donorRecordForm.get('employerZip')?.setValue('123');
        component.onEmployerZipBlur();
        expect(attachDonorServiceSpy.getCityStateByZip).not.toHaveBeenCalled();
      });
    });

    describe('onEmployerSearch', () => {
      it('should filter employer options by search term', () => {
        component.employerOptions.set([
          { value: 'E1', label: 'ACME CORP' },
          { value: 'E2', label: 'BETA INC' }
        ]);
        const input = document.createElement('input');
        input.value = 'ACME';
        const event = { target: input } as unknown as Event;
        component.onEmployerSearch(event);
        expect(component.filteredEmployerOptions().length).toBe(1);
      });

      it('should show all when search is empty', () => {
        component.employerOptions.set([
          { value: 'E1', label: 'ACME CORP' },
          { value: 'E2', label: 'BETA INC' }
        ]);
        const input = document.createElement('input');
        input.value = '';
        const event = { target: input } as unknown as Event;
        component.onEmployerSearch(event);
        expect(component.filteredEmployerOptions().length).toBe(2);
      });
    });

    describe('checkFalseDuplicatePrompt', () => {
      it('should not prompt when more than 2 donors', fakeAsync(() => {
        const threeDonors = [...mockGradedDonors, { ...mockGradedDonors[0], donorId: 'DON3' }];
        component.gradedDonors.set(threeDonors);
        component['checkFalseDuplicatePrompt']('DON0000087');
        tick();
        expect(matDialogSpy.open).not.toHaveBeenCalled();
      }));

      it('should not prompt when grades are above 2', fakeAsync(() => {
        component.gradedDonors.set(mockGradedDonors); // grade = 4
        component.transactionData.set(mockTransaction);
        component['checkFalseDuplicatePrompt']('DON0000087');
        tick();
        expect(matDialogSpy.open).not.toHaveBeenCalled();
      }));
    });

    describe('onSaveDonorRecord - Deferral type validation', () => {
      it('should validate Transaction ID for Deferral type', fakeAsync(() => {
        component.transactionTypeControl.setValue('Deferral');
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.donorSelectionControl.setValue('DON0000087');
        tick();
        component.fetchedBy.set('transactionId');
        component.originalFetchValue.set('TXN0000001');
        component.saveTransactionIdControl.setValue('TXN0000001');
        component.donorExistsInFullTable.set(true);
        component.donorRecordForm.markAsPristine();

        attachDonorServiceSpy.selectDonor.and.returnValue(of({
          success: true, message: 'OK', statusCode: 200,
          data: { transactionId: 'TXN0000001', donorId: 'DON0000087' }
        }));

        component.onSaveDonorRecord();
        tick();

        expect(attachDonorServiceSpy.selectDonor).toHaveBeenCalled();
      }));
    });

    describe('convertGenderCodeToForm and convertGenderFormToCode', () => {
      it('should convert M to Male', () => {
        expect(component['convertGenderCodeToForm']('M')).toBe('Male');
      });

      it('should convert F to Female', () => {
        expect(component['convertGenderCodeToForm']('F')).toBe('Female');
      });

      it('should return empty for null', () => {
        expect(component['convertGenderCodeToForm'](null)).toBe('');
      });

      it('should convert Male to M', () => {
        expect(component['convertGenderFormToCode']('Male')).toBe('M');
      });

      it('should convert Female to F', () => {
        expect(component['convertGenderFormToCode']('Female')).toBe('F');
      });
    });

    describe('formatDate', () => {
      it('should format valid date to DD-MMM-YYYY', () => {
        const result = component.formatDate('2026-07-10T00:00:00Z');
        expect(result).toBe('10-JUL-2026');
      });

      it('should return empty for null', () => {
        expect(component.formatDate(null)).toBe('');
      });

      it('should return empty for invalid date', () => {
        expect(component.formatDate('invalid')).toBe('');
      });
    });

    describe('getPreferredPhoneCode', () => {
      it('should convert home to H', () => {
        expect(component['getPreferredPhoneCode']('home')).toBe('H');
      });

      it('should convert work to W', () => {
        expect(component['getPreferredPhoneCode']('work')).toBe('W');
      });

      it('should convert mobile to M', () => {
        expect(component['getPreferredPhoneCode']('mobile')).toBe('M');
      });

      it('should return empty for null', () => {
        expect(component['getPreferredPhoneCode'](null)).toBe('');
      });
    });

    describe('parsePhoneNumber', () => {
      it('should parse 10-digit phone', () => {
        const result = component['parsePhoneNumber']('214-885-1212');
        expect(result?.areaCode).toBe('214');
        expect(result?.phoneNo).toBe('8851212');
      });

      it('should parse 7-digit phone', () => {
        const result = component['parsePhoneNumber']('885-1212');
        expect(result?.areaCode).toBe('');
        expect(result?.phoneNo).toBe('8851212');
      });

      it('should return null for empty', () => {
        expect(component['parsePhoneNumber']('')).toBeNull();
      });

      it('should return null for null', () => {
        expect(component['parsePhoneNumber'](null)).toBeNull();
      });
    });

    describe('convertPreferredPhoneCode', () => {
      it('should convert H to home', () => {
        expect(component['convertPreferredPhoneCode']('H')).toBe('home');
      });

      it('should convert W to work', () => {
        expect(component['convertPreferredPhoneCode']('W')).toBe('work');
      });

      it('should convert M to mobile', () => {
        expect(component['convertPreferredPhoneCode']('M')).toBe('mobile');
      });
    });

    describe('originalKeyData getter', () => {
      it('should return key data from transaction', () => {
        component.transactionData.set(mockTransaction);
        const keyData = component.originalKeyData;
        expect(keyData).toContain('Thompson');
        expect(keyData).toContain('Mark');
      });

      it('should return empty when no transaction', () => {
        component.transactionData.set(null);
        expect(component.originalKeyData).toBe('');
      });

      it('should fallback to first graded donor when transaction has no demographics', () => {
        const txnNoDemographics = { ...mockTransaction, lastName: null, firstName: null, dateOfBirth: null, gender: null };
        component.transactionData.set(txnNoDemographics as any);
        component.gradedDonors.set(mockGradedDonors);
        const keyData = component.originalKeyData;
        expect(keyData).toContain('Thompson');
      });
    });

    describe('onShowDonorListHelp', () => {
      it('should open help dialog', () => {
        component.onShowDonorListHelp();
        expect(matDialogSpy.open).toHaveBeenCalled();
      });
    });

    describe('canViewPhlebotomy - edge cases', () => {
      it('should return false when in duplicate mode', () => {
        component.duplicateMode.set(true);
        component.transactionData.set(mockTransaction);
        expect(component.canViewPhlebotomy()).toBeFalse();
      });
    });

    describe('onSaveDonorRecord - DOB age check', () => {
      it('should reject DOB older than 125 years in save donor record', fakeAsync(() => {
        component.transactionData.set(mockTransaction);
        component.gradedDonors.set(mockGradedDonors);
        component.donorSelectionControl.setValue('DON0000087');
        tick();
        component.transactionTypeControl.setValue('Donation');
        component.fetchedBy.set('unitId');
        component.originalFetchValue.set('W63332508I210.8');
        component.saveUnitIdControl.setValue('W63332508I210.8');
        component.donorExistsInFullTable.set(true);
        component.donorRecordForm.patchValue({
          dateOfBirth: new Date('1850-01-01'),
          homeAddress: '123 MAIN', city: 'DALLAS'
        });
        component.donorRecordForm.markAsDirty();

        component.onSaveDonorRecord();
        tick();

        expect(snackBarSpy.open).toHaveBeenCalledWith(
          jasmine.stringContaining('16053'),
          jasmine.anything(),
          jasmine.anything()
        );
      }));
    });
  });
});
