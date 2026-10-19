import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';

import { DonorEligibilityPage } from './donor-eligibility-page';
import { DonorEligibilityService } from './services/donor-eligibility.service';
import { DonorBasicInfoResponse } from './models/donor-eligibility.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { createMockSnackbarService } from '@shared/testing/common-mocks';
import { PageHeaderWithBreadcrumb } from '@shared/components/page-header-with-breadcrumb/page-header-with-breadcrumb';
import { PageHeaderWithBreadcrumbStub } from '@shared/testing/component-stubs';

describe('DonorEligibilityPage', () => {
  let component: DonorEligibilityPage;
  let fixture: ComponentFixture<DonorEligibilityPage>;
  let mockService: jasmine.SpyObj<DonorEligibilityService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let queryParams$: BehaviorSubject<any>;

  const mockDonorInfo: DonorBasicInfoResponse = {
    donorId: 'D001',
    lastName: 'RENZ',
    firstName: 'GREG',
    dateOfBirth: '1990-01-15',
    gender: 'M',
    bloodType: 'O POS',
    chapterId: 'CH01',
    donorWeight: 180
  };

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DonorEligibilityService', [
      'getDonationTypes',
      'getProcedureCodes',
      'checkEligibility',
      'getInterdictions',
      'getDonorInfo'
    ]);
    mockSnackbar = createMockSnackbarService();
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    queryParams$ = new BehaviorSubject<any>({});

    mockService.getDonorInfo.and.returnValue(of(mockDonorInfo));
    mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);

    TestBed.configureTestingModule({
      imports: [
        DonorEligibilityPage,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: DonorEligibilityService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: { queryParams: queryParams$.asObservable() } }
      ]
    }).overrideComponent(DonorEligibilityPage, {
      remove: { imports: [PageHeaderWithBreadcrumb] },
      add: { imports: [PageHeaderWithBreadcrumbStub] }
    });

    fixture = TestBed.createComponent(DonorEligibilityPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize headerConfig with correct breadcrumbs and title', () => {
    expect(component.headerConfig).toBeDefined();
    expect(component.headerConfig.title).toBe('Donor Eligibility & Attributes');
    expect(component.headerConfig.subtitle).toBe('Check donor eligibility for donation procedures');
    expect(component.headerConfig.breadcrumbs.length).toBe(3);
    expect(component.headerConfig.breadcrumbs[0].label).toBe('Home');
    expect(component.headerConfig.breadcrumbs[0].link).toBe('/home');
    expect(component.headerConfig.breadcrumbs[1].label).toBe('Donor Functions');
    expect(component.headerConfig.breadcrumbs[1].link).toBeNull();
    expect(component.headerConfig.breadcrumbs[2].label).toBe('Donor Eligibility');
    expect(component.headerConfig.breadcrumbs[2].link).toBeNull();
  });

  it('should initialize searchForm with empty donorId and required validator', () => {
    expect(component.searchForm).toBeDefined();
    expect(component.searchForm.get('donorId')?.value).toBe('');
    expect(component.searchForm.get('donorId')?.hasError('required')).toBeTrue();
  });

  it('should return form controls via f getter', () => {
    expect(component.f).toBe(component.searchForm.controls);
    expect(component.f['donorId']).toBeDefined();
  });

  it('should initialize isLoadingDonor to false', () => {
    expect(component.isLoadingDonor()).toBeFalse();
  });

  describe('isViewDisabled', () => {
    it('should return true when donorId is empty', () => {
      component.searchForm.patchValue({ donorId: '' });
      expect(component.isViewDisabled).toBeTrue();
    });

    it('should return true when donorId is whitespace only', () => {
      component.searchForm.patchValue({ donorId: '   ' });
      expect(component.isViewDisabled).toBeTrue();
    });

    it('should return false when donorId has a value', () => {
      component.searchForm.patchValue({ donorId: 'D001' });
      expect(component.isViewDisabled).toBeFalse();
    });
  });

  describe('ngOnInit - queryParams', () => {
    it('should patch form and open panel when donorId in queryParams', () => {
      const fixture2 = TestBed.createComponent(DonorEligibilityPage);
      const component2 = fixture2.componentInstance;
      queryParams$.next({ donorId: 'D999' });
      fixture2.detectChanges();
      expect(component2.searchForm.get('donorId')?.value).toBe('D999');
      expect(mockService.getDonorInfo).toHaveBeenCalledWith('D999');
    });

    it('should not open panel when no donorId in queryParams', () => {
      mockService.getDonorInfo.calls.reset();
      mockDialog.open.calls.reset();
      queryParams$.next({});
      fixture.detectChanges();
      expect(mockService.getDonorInfo).not.toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('should clean up subscriptions on destroy', () => {
      const nextSpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      component.ngOnDestroy();
      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('openEligibilityPanel', () => {
    it('should mark form as touched and return if form is invalid', () => {
      component.searchForm.patchValue({ donorId: '' });
      component.openEligibilityPanel();
      expect(component.searchForm.get('donorId')?.touched).toBeTrue();
      expect(mockService.getDonorInfo).not.toHaveBeenCalled();
    });

    it('should return early when donorId trims to empty', () => {
      mockService.getDonorInfo.calls.reset();
      component.searchForm.patchValue({ donorId: '   ' });
      component.openEligibilityPanel();
      expect(mockService.getDonorInfo).not.toHaveBeenCalled();
    });

    it('should call getDonorInfo with trimmed donorId', () => {
      mockService.getDonorInfo.calls.reset();
      component.searchForm.patchValue({ donorId: '  D001  ' });
      component.openEligibilityPanel();
      expect(mockService.getDonorInfo).toHaveBeenCalledWith('D001');
    });

    it('should set isLoadingDonor to true while loading', () => {
      const donorInfoSubject = new Subject<DonorBasicInfoResponse>();
      mockService.getDonorInfo.and.returnValue(donorInfoSubject.asObservable());
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(component.isLoadingDonor()).toBeTrue();
    });

    it('should set isLoadingDonor to false after successful load', () => {
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(component.isLoadingDonor()).toBeFalse();
    });

    it('should open dialog with correct donor data on success', () => {
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(mockDialog.open).toHaveBeenCalled();
      const dialogCallArgs = mockDialog.open.calls.mostRecent().args;
      const dialogData = dialogCallArgs[1]?.data;
      expect(dialogData.donorId).toBe('D001');
      expect(dialogData.donorName).toBe('RENZ, GREG');
      expect(dialogData.dateOfBirth).toBe('1990-01-15');
      expect(dialogData.sex).toBe('Male');
      expect(dialogData.bloodType).toBe('O POS');
      expect(dialogData.donorWeight).toBe(180);
    });

    it('should format donorName as lastName only when firstName is empty', () => {
      mockService.getDonorInfo.and.returnValue(of({
        ...mockDonorInfo,
        firstName: '',
        lastName: 'RENZ'
      }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.donorName).toBe('RENZ');
    });

    it('should handle null lastName and firstName', () => {
      mockService.getDonorInfo.and.returnValue(of({
        ...mockDonorInfo,
        firstName: '',
        lastName: ''
      }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.donorName).toBe('');
    });

    it('should map gender M to Male', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, gender: 'M' }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.sex).toBe('Male');
    });

    it('should map gender F to Female', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, gender: 'F' }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.sex).toBe('Female');
    });

    it('should map gender U to Unknown', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, gender: 'U' }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.sex).toBe('Unknown');
    });

    it('should return empty string for null gender', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, gender: null }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.sex).toBe('');
    });

    it('should pass through unrecognized gender value as-is', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, gender: 'X' }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.sex).toBe('X');
    });

    it('should map lowercase gender correctly', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, gender: 'f' }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.sex).toBe('Female');
    });

    it('should handle null dateOfBirth from API', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, dateOfBirth: null }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.dateOfBirth).toBe('');
    });

    it('should handle null bloodType from API', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, bloodType: null }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.bloodType).toBe('');
    });

    it('should open dialog with correct configuration', () => {
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogConfig = mockDialog.open.calls.mostRecent().args[1];
      expect(dialogConfig?.width).toBe('1100px');
      expect(dialogConfig?.height).toBe('calc(100vh - 64px)');
      expect(dialogConfig?.maxWidth).toBe('100vw');
      expect(dialogConfig?.maxHeight).toBe('calc(100vh - 64px)');
      expect(dialogConfig?.disableClose).toBeFalse();
      expect(dialogConfig?.panelClass).toBe('code-dialog-panel-right');
      expect(dialogConfig?.hasBackdrop).toBeTrue();
      expect(dialogConfig?.backdropClass).toBe('code-dialog-backdrop');
      expect(dialogConfig?.position).toEqual({ right: '0', top: '64px' });
    });

    it('should show error and reset loading on getDonorInfo failure with message', () => {
      mockService.getDonorInfo.and.returnValue(throwError(() => new Error('Donor not found')));
      component.searchForm.patchValue({ donorId: 'D999' });
      component.openEligibilityPanel();
      expect(component.isLoadingDonor()).toBeFalse();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Donor not found');
    });

    it('should show fallback error when getDonorInfo fails without message', () => {
      mockService.getDonorInfo.and.returnValue(throwError(() => ({})));
      component.searchForm.patchValue({ donorId: 'D999' });
      component.openEligibilityPanel();
      expect(mockSnackbar.showError).toHaveBeenCalledWith('Donor not found');
    });

    it('should not open dialog on getDonorInfo error', () => {
      mockService.getDonorInfo.and.returnValue(throwError(() => new Error('fail')));
      mockDialog.open.calls.reset();
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });
  });

  describe('dialog afterClosed', () => {
    it('should show success snackbar when dialog returns eligible result', () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of({ procedureCode: 'WB', eligibilityStatus: 'Y' })
      } as any);
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Selected: WB (Eligible)');
    });

    it('should show success snackbar with Override for ineligible result', () => {
      mockDialog.open.and.returnValue({
        afterClosed: () => of({ procedureCode: 'PP', eligibilityStatus: 'N' })
      } as any);
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(mockSnackbar.showSuccess).toHaveBeenCalledWith('Selected: PP (Override)');
    });

    it('should not show snackbar when dialog is closed without selection', () => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(undefined) } as any);
      mockSnackbar.showSuccess.calls.reset();
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(mockSnackbar.showSuccess).not.toHaveBeenCalled();
    });

    it('should not show snackbar when dialog result has no procedureCode', () => {
      mockDialog.open.and.returnValue({ afterClosed: () => of({}) } as any);
      mockSnackbar.showSuccess.calls.reset();
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(mockSnackbar.showSuccess).not.toHaveBeenCalled();
    });

    it('should not show snackbar when dialog result is null', () => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(null) } as any);
      mockSnackbar.showSuccess.calls.reset();
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      expect(mockSnackbar.showSuccess).not.toHaveBeenCalled();
    });
  });

  describe('donor weight handling', () => {
    it('should pass donorWeight from API response to dialog data', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, donorWeight: 200 }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.donorWeight).toBe(200);
    });

    it('should pass null donorWeight when not available', () => {
      mockService.getDonorInfo.and.returnValue(of({ ...mockDonorInfo, donorWeight: null }));
      component.searchForm.patchValue({ donorId: 'D001' });
      component.openEligibilityPanel();
      const dialogData = mockDialog.open.calls.mostRecent().args[1]?.data;
      expect(dialogData.donorWeight).toBeNull();
    });
  });
});
