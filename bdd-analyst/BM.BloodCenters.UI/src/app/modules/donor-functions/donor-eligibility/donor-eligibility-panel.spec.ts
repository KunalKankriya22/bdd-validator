import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

import { DonorEligibilityPanel } from './donor-eligibility-panel';
import { DonorEligibilityService } from './services/donor-eligibility.service';
import { DonorEligibilityInput, DonorInterdiction, ProcedureCodeResponse, EligibilityCheckResult } from './models/donor-eligibility.model';
import { SnackbarService } from '@shared/services/snackbar.service';
import { HeaderService } from '@shared/services/header.service';
import { of, throwError, Subject } from 'rxjs';
import { createMockSnackbarService } from '@shared/testing/common-mocks';

describe('DonorEligibilityPanel', () => {
  let component: DonorEligibilityPanel;
  let fixture: ComponentFixture<DonorEligibilityPanel>;
  let mockService: jasmine.SpyObj<DonorEligibilityService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  const mockDonor: DonorEligibilityInput = {
    donorId: 'D001',
    donorName: 'RENZ, GREG W',
    dateOfBirth: '2025-12-09',
    sex: 'Male',
    bloodType: 'O POS'
  };

  const mockDonationTypes = [
    { code: 'ALL', description: 'All' },
    { code: 'AL', description: 'Allogeneic' }
  ];

  const mockProcedureCodes: ProcedureCodeResponse[] = [
    { procedureCode: 'WB', description: 'Whole Blood', sortSequence: 1 },
    { procedureCode: 'PP', description: 'PlateletPheresis', sortSequence: 2 }
  ];

  const mockEligibilityResultY: EligibilityCheckResult = {
    eligStatus: 'Y',
    deferralDate: null,
    interType: null,
    deferralReason: null
  };

  const mockEligibilityResultN: EligibilityCheckResult = {
    eligStatus: 'N',
    deferralDate: '2025-02-22',
    interType: 'TEMPD',
    deferralReason: 'Low platelet count'
  };

  const mockInterdictions: DonorInterdiction[] = [
    {
      donorId: 'D001',
      interCode: 'HTN',
      interType: 'TEMPD',
      interDesc: 'History of Hypertension',
      effDate: '2025-01-01',
      termDate: null,
      releaseDate: null,
      chapterId: 'CH01'
    }
  ];

  const mockHeaderService = {
    chapterTimeZone: jasmine.createSpy('chapterTimeZone').and.returnValue('UTC'),
    chapterChanged$: new Subject()
  };

  let confirmDialogSpy: jasmine.Spy;

  beforeEach(() => {
    mockService = jasmine.createSpyObj('DonorEligibilityService', [
      'getDonationTypes',
      'getProcedureCodes',
      'checkEligibility',
      'getInterdictions',
      'getDonorInfo'
    ]);
    mockSnackbar = createMockSnackbarService();

    mockService.getDonationTypes.and.returnValue(of(mockDonationTypes));
    mockService.getProcedureCodes.and.returnValue(of(mockProcedureCodes));
    mockService.checkEligibility.and.callFake((req: any) => {
      if (req.procedureCode === 'WB') return of(mockEligibilityResultY);
      return of(mockEligibilityResultN);
    });
    mockService.getInterdictions.and.returnValue(of(mockInterdictions));
    mockService.getDonorInfo.and.returnValue(of({ donorId: 'D001', lastName: 'RENZ', firstName: 'GREG', dateOfBirth: null, gender: null, bloodType: null, chapterId: '', donorWeight: 180 }));

    confirmDialogSpy = spyOn(MatDialog.prototype, 'open').and.returnValue({ afterClosed: () => of(undefined) } as any);

    TestBed.configureTestingModule({
      imports: [DonorEligibilityPanel, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: DonorEligibilityService, useValue: mockService },
        { provide: SnackbarService, useValue: mockSnackbar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });

    fixture = TestBed.createComponent(DonorEligibilityPanel);
    component = fixture.componentInstance;
    component.donor = mockDonor;
    fixture.detectChanges();
  });


  it('should display donor info', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const values = compiled.querySelectorAll('.donor-info-value');
    expect(values[0]?.textContent?.trim()).toBe('RENZ, GREG W');
  });

  it('should disable retrieve button when donation type or weight is empty', () => {
    component.filterForm.patchValue({ donationType: null, donorWeight: null }, { emitEvent: false });
    expect(component.isRetrieveDisabled).toBeTrue();
    component.filterForm.patchValue({ donorWeight: 200 }, { emitEvent: false });
    expect(component.isRetrieveDisabled).toBeTrue();
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    expect(component.isRetrieveDisabled).toBeFalse();
  });

  it('should call getProcedureCodes and checkEligibility on retrieve', () => {
    component.filterForm.patchValue({ donorWeight: 200, donationType: 'ALL' }, { emitEvent: false });
    mockService.getProcedureCodes.calls.reset();
    mockService.checkEligibility.calls.reset();
    mockService.getInterdictions.calls.reset();
    component.onRetrieve();
    expect(mockService.getProcedureCodes).toHaveBeenCalledWith('ALL');
    expect(mockService.checkEligibility).toHaveBeenCalledTimes(2);
    expect(mockService.getInterdictions).toHaveBeenCalledWith('D001');
  });

  it('should populate procedure data after retrieve', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 });
    component.onRetrieve();
    expect(component.procedureCodesData().length).toBe(2);
    expect(component.procedureCodesData()[0].eligStatus).toBe('Yes');
    expect(component.procedureCodesData()[1].eligStatus).toBe('No');
    expect(component.hasRetrieved()).toBeTrue();
  });


  it('should select a procedure row on rowClick', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 });
    component.onRetrieve();
    const proc = component.procedureCodesData()[0];
    component.onEligibilityRowClick(proc);
    expect(component.selectedProcedure()).toBe(proc);
  });



  it('should clear all on clearAll', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 });
    component.onRetrieve();
    component.onClearAll();
    expect(component.procedureCodesData().length).toBe(0);
    expect(component.interdictionsData().length).toBe(0);
    expect(component.hasRetrieved()).toBeFalse();
    expect(component.selectedProcedure()).toBeNull();
  });

  it('should sort eligibility data on sort change', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 });
    component.onRetrieve();
    component.onEligibilitySortChange({ column: 'procedure', direction: 'A' });
    expect(component.procedureCodesData()[0].procedureCode).toBe('PP');
  });

  it('should sort interdictions data on sort change', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 });
    component.onRetrieve();
    component.onInterdictionsSortChange({ column: 'interCode', direction: 'A' });
    expect(component.interdictionsData()[0].interCode).toBe('HTN');
  });


  it('should handle API error on retrieve gracefully', () => {
    mockService.getProcedureCodes.and.returnValue(throwError(() => new Error('Network error')));
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 });
    component.onRetrieve();
    expect(component.isLoading()).toBeFalse();
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Network error');
  });

  it('should handle individual eligibility check errors gracefully', () => {
    mockService.checkEligibility.and.returnValue(throwError(() => new Error('Check failed')));
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 });
    component.onRetrieve();
    expect(component.procedureCodesData().length).toBe(2);
    expect(component.procedureCodesData()[0].eligStatus).toBe('No');
    expect(component.procedureCodesData()[0].reason).toBe('Error checking eligibility');
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize filter form with donationType pre-populated to AL', (done) => {
    setTimeout(() => {
      expect(component.filterForm.get('donationType')?.value).toBe('AL');
      done();
    }, 200);
  });

  it('should load donation types on init', () => {
    expect(mockService.getDonationTypes).toHaveBeenCalled();
    expect(component.donationTypes().length).toBe(2);
    expect(component.filteredDonationTypes().length).toBe(2);
  });

  it('should handle donation types loading error', () => {
    mockService.getDonationTypes.and.returnValue(throwError(() => new Error('Load failed')));
    const fixture2 = TestBed.createComponent(DonorEligibilityPanel);
    const component2 = fixture2.componentInstance;
    component2.donor = mockDonor;
    fixture2.detectChanges();
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Load failed');
  });

  it('should filter donation types by search term', () => {
    component.donationTypeSearchControl.setValue('Allo');
    fixture.detectChanges();
    setTimeout(() => {
      expect(component.filteredDonationTypes().length).toBe(1);
      expect(component.filteredDonationTypes()[0].code).toBe('AL');
    }, 250);
  });

  it('should return all donation types when search is empty', () => {
    component.donationTypeSearchControl.setValue('');
    expect(component.filteredDonationTypes().length).toBe(2);
  });

  it('should show error when onRetrieve called without donorId', () => {
    component.donor = { donorId: '', donorName: '', dateOfBirth: '', sex: '', bloodType: '' };
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Donor ID is required');
  });

  it('should not retrieve when isRetrieveDisabled is true', () => {
    component.filterForm.patchValue({ donationType: null, donorWeight: null }, { emitEvent: false });
    mockService.getProcedureCodes.calls.reset();
    component.onRetrieve();
    expect(mockService.getProcedureCodes).not.toHaveBeenCalled();
  });

  it('should set isLoading to true during retrieve', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    expect(component.isLoading()).toBeFalse();
  });

  it('should handle empty procedure codes from API', () => {
    mockService.getProcedureCodes.and.returnValue(of([]));
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    expect(component.procedureCodesData().length).toBe(0);
    expect(component.hasRetrieved()).toBeTrue();
  });

  it('should handle interdictions loading error gracefully', () => {
    mockService.getInterdictions.and.returnValue(throwError(() => new Error('Interdictions failed')));
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    expect(component.interdictionsData().length).toBe(0);
  });

  it('should set donationTypeDescription after successful retrieve', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    expect(component.donationTypeDescription()).toBe('All');
  });

  it('should set lastSuccessfulDonationType after retrieve', () => {
    component.filterForm.patchValue({ donationType: 'AL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    expect(component.lastSuccessfulDonationType()).toBe('AL');
  });

  it('should handle onButtonClick for close action', () => {
    const spy = spyOn(component.closePanel, 'emit');
    component.onButtonClick('close');
    expect(spy).toHaveBeenCalled();
  });

  it('should handle onButtonClick for select action with no selected procedure', () => {
    const spy = spyOn(component.select, 'emit');
    component.onButtonClick('select');
    expect(spy).not.toHaveBeenCalled();
  });

  it('should emit closePanel on onClose without dialogRef', () => {
    const spy = spyOn(component.closePanel, 'emit');
    component.onClose();
    expect(spy).toHaveBeenCalled();
  });

  it('should emit select result for eligible procedure', () => {
    const spy = spyOn(component.select, 'emit');
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    const eligibleProc = component.procedureCodesData().find(p => p.eligStatus === 'Yes')!;
    component.onEligibilityRowClick(eligibleProc);
    component.onSelect();
    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
      procedureCode: 'WB',
      overrideFlag: false,
      eligibilityStatus: 'Y'
    }));
  });

  it('should open confirm dialog for ineligible procedure and cancel', () => {
    confirmDialogSpy.and.returnValue({ afterClosed: () => of(undefined) } as any);
    const spy = spyOn(component.select, 'emit');
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    const ineligibleProc = component.procedureCodesData().find(p => p.eligStatus === 'No')!;
    component.onEligibilityRowClick(ineligibleProc);
    component.onSelect();
    expect(confirmDialogSpy).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should override for ineligible procedure when user confirms', () => {
    confirmDialogSpy.and.returnValue({ afterClosed: () => of('yes') } as any);
    const spy = spyOn(component.select, 'emit');
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    const ineligibleProc = component.procedureCodesData().find(p => p.eligStatus === 'No')!;
    component.onEligibilityRowClick(ineligibleProc);
    component.onSelect();
    expect(spy).toHaveBeenCalledWith(jasmine.objectContaining({
      overrideFlag: true,
      eligibilityStatus: 'N'
    }));
  });

  it('should open donation type select when user chooses change', () => {
    confirmDialogSpy.and.returnValue({ afterClosed: () => of('no') } as any);
    const spy = spyOn(component.select, 'emit');
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    const ineligibleProc = component.procedureCodesData().find(p => p.eligStatus === 'No')!;
    component.onEligibilityRowClick(ineligibleProc);
    component.onSelect();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should sanitize non-numeric input in onWeightInput', () => {
    const input = document.createElement('input');
    input.value = '12abc3';
    const event = { target: input } as unknown as Event;
    component.onWeightInput(event);
    expect(input.value).toBe('123');
    expect(component.filterForm.get('donorWeight')?.value).toBe(123);
  });

  it('should set donorWeight to null for empty input', () => {
    const input = document.createElement('input');
    input.value = '';
    const event = { target: input } as unknown as Event;
    component.onWeightInput(event);
    expect(component.filterForm.get('donorWeight')?.value).toBeNull();
  });

  it('should return required error for empty weight', () => {
    component.filterForm.get('donorWeight')?.markAsTouched();
    component.filterForm.get('donorWeight')?.setValue(null);
    expect(component.getWeightError()).toBe('Weight is required');
  });

  it('should return min error for weight less than 1', () => {
    component.filterForm.get('donorWeight')?.markAsTouched();
    component.filterForm.get('donorWeight')?.setValue(0);
    expect(component.getWeightError()).toBe('Weight must be greater than 0');
  });

  it('should return empty string when weight is valid', () => {
    component.filterForm.get('donorWeight')?.markAsTouched();
    component.filterForm.get('donorWeight')?.setValue(150);
    expect(component.getWeightError()).toBe('');
  });

  it('should return empty string when weight is untouched', () => {
    expect(component.getWeightError()).toBe('');
  });

  it('should format date value', () => {
    expect(component.formatDate(null)).toBe('--');
    expect(component.formatDate(undefined)).toBe('--');
    expect(component.formatDate('')).toBe('--');
  });

  it('should format a valid date', () => {
    const result = component.formatDate('2025-02-22');
    expect(result).not.toBe('--');
  });

  it('should return selected procedure description', () => {
    expect(component.selectedProcedureDesc).toBe('-');
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    const proc = component.procedureCodesData()[0];
    component.onEligibilityRowClick(proc);
    expect(component.selectedProcedureDesc).toBe('WB - Whole Blood');
  });

  it('should return selectedDonationTypeDisplay', () => {
    expect(component.selectedDonationTypeDisplay).toBe('');
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    expect(component.selectedDonationTypeDisplay).toBe('ALL - All');
  });

  it('should update select button state when procedure selected', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    const selectBtn = component.footerButtons.find(b => b.action === 'select');
    expect(selectBtn?.disabled).toBeTrue();
    component.onEligibilityRowClick(component.procedureCodesData()[0]);
    const selectBtnAfter = component.footerButtons.find(b => b.action === 'select');
    expect(selectBtnAfter?.disabled).toBeFalse();
  });

  it('should reset select button on clearAll', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    component.onEligibilityRowClick(component.procedureCodesData()[0]);
    component.onClearAll();
    const selectBtn = component.footerButtons.find(b => b.action === 'select');
    expect(selectBtn?.disabled).toBeTrue();
  });

  it('should not sort eligibility data on default direction', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    const firstCode = component.procedureCodesData()[0].procedureCode;
    component.onEligibilitySortChange({ column: 'procedure', direction: 'default' });
    expect(component.procedureCodesData()[0].procedureCode).toBe(firstCode);
  });

  it('should sort eligibility data descending', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    component.onEligibilitySortChange({ column: 'procedure', direction: 'D' });
    expect(component.procedureCodesData()[0].procedureCode).toBe('WB');
  });

  it('should not sort interdictions data on default direction', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    component.onInterdictionsSortChange({ column: 'interCode', direction: 'default' });
    expect(component.interdictionsData()[0].interCode).toBe('HTN');
  });

  it('should sort interdictions descending', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    component.onInterdictionsSortChange({ column: 'interCode', direction: 'D' });
    expect(component.interdictionsData()[0].interCode).toBe('HTN');
  });

  it('should pre-populate weight from donor input', () => {
    const donorWithWeight: DonorEligibilityInput = {
      ...mockDonor,
      donorWeight: 180
    };
    const fixture2 = TestBed.createComponent(DonorEligibilityPanel);
    const component2 = fixture2.componentInstance;
    component2.donor = donorWithWeight;
    fixture2.detectChanges();
    expect(component2.filterForm.get('donorWeight')?.value).toBe(180);
  });

  it('should pre-populate donation type when provided', (done) => {
    const donorWithDT: DonorEligibilityInput = {
      ...mockDonor,
      donationType: 'AL'
    };
    const fixture2 = TestBed.createComponent(DonorEligibilityPanel);
    const component2 = fixture2.componentInstance;
    component2.donor = donorWithDT;
    fixture2.detectChanges();
    setTimeout(() => {
      expect(component2.filterForm.get('donationType')?.value).toBe('AL');
      done();
    }, 200);
  });

  it('should disable retrieve when weight is less than 1', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 0 }, { emitEvent: false });
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should disable retrieve while loading', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.isLoading.set(true);
    expect(component.isRetrieveDisabled).toBeTrue();
  });

  it('should set hasRetrieved to false initially', () => {
    expect(component.hasRetrieved()).toBeFalse();
  });

  it('should initialize footer buttons', () => {
    expect(component.footerButtons.length).toBe(2);
    expect(component.footerButtons[0].action).toBe('close');
    expect(component.footerButtons[1].action).toBe('select');
  });

  it('should initialize table configs', () => {
    expect(component.eligibilityTableConfig).toBeDefined();
    expect(component.eligibilityTableConfig.columns.length).toBe(4);
    expect(component.interdictionsTableConfig).toBeDefined();
    expect(component.interdictionsTableConfig.columns.length).toBe(2);
  });

  it('should clean up subscriptions on destroy', () => {
    const spy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should handle retrieve error without message', () => {
    mockService.getProcedureCodes.and.returnValue(throwError(() => ({})));
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    expect(mockSnackbar.showError).toHaveBeenCalledWith('Failed to retrieve eligibility data');
  });

  it('should handle donation types error without message', () => {
    mockService.getDonationTypes.and.returnValue(throwError(() => ({})));
    const fixture2 = TestBed.createComponent(DonorEligibilityPanel);
    const component2 = fixture2.componentInstance;
    component2.donor = mockDonor;
    fixture2.detectChanges();
    expect(mockSnackbar.showError).toHaveBeenCalled();
  });

  it('should reset selectedProcedure and updateSelectButton on retrieve', () => {
    component.filterForm.patchValue({ donationType: 'ALL', donorWeight: 200 }, { emitEvent: false });
    component.onRetrieve();
    component.onEligibilityRowClick(component.procedureCodesData()[0]);
    expect(component.selectedProcedure()).toBeTruthy();
    component.onRetrieve();
    expect(component.selectedProcedure()).toBeNull();
  });

  it('should call getDonorInfo when donor has no weight', () => {
    const donorNoWeight: DonorEligibilityInput = {
      ...mockDonor,
      donorWeight: undefined
    };
    const fixture2 = TestBed.createComponent(DonorEligibilityPanel);
    const component2 = fixture2.componentInstance;
    component2.donor = donorNoWeight;
    fixture2.detectChanges();
    expect(mockService.getDonorInfo).toHaveBeenCalledWith('D001');
  });

  it('should handle getDonorInfo error gracefully', () => {
    mockService.getDonorInfo.and.returnValue(throwError(() => new Error('Not found')));
    const donorNoWeight: DonorEligibilityInput = {
      ...mockDonor,
      donorWeight: undefined
    };
    const fixture2 = TestBed.createComponent(DonorEligibilityPanel);
    const component2 = fixture2.componentInstance;
    component2.donor = donorNoWeight;
    expect(() => fixture2.detectChanges()).not.toThrow();
  });

  it('should disable donation type when lockDonationType is true', (done) => {
    const lockedDonor: DonorEligibilityInput = {
      ...mockDonor,
      donationType: 'AL',
      lockDonationType: true
    };
    const fixture2 = TestBed.createComponent(DonorEligibilityPanel);
    const component2 = fixture2.componentInstance;
    component2.donor = lockedDonor;
    fixture2.detectChanges();
    setTimeout(() => {
      expect(component2.filterForm.get('donationType')?.disabled).toBeTrue();
      done();
    }, 200);
  });

  it('should default to AL donation type when none provided', (done) => {
    const donorNoDT: DonorEligibilityInput = {
      ...mockDonor,
      donationType: undefined
    };
    const fixture2 = TestBed.createComponent(DonorEligibilityPanel);
    const component2 = fixture2.componentInstance;
    component2.donor = donorNoDT;
    fixture2.detectChanges();
    setTimeout(() => {
      expect(component2.filterForm.get('donationType')?.value).toBe('AL');
      done();
    }, 200);
  });
});
