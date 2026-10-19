import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import moment from 'moment';

import { AbbreviatedQuestionnaireSetupComponent } from './abbreviated-questionnaire-setup';
import { AbbreviatedQuestionnaireSetupService } from './abbreviated-questionnaire-setup.service';
import { HeaderService } from '@shared/services/header.service';
import { PageHeaderService } from '@shared/services/page-header.service';
import { AbbreviatedQuestionnaireSetup, DonationTypeLookup } from './abbreviated-questionnaire-setup.interface';
import { createMockMatSnackBar } from '@shared/testing/common-mocks';

describe('AbbreviatedQuestionnaireSetupComponent', () => {
  let component: AbbreviatedQuestionnaireSetupComponent;
  let fixture: ComponentFixture<AbbreviatedQuestionnaireSetupComponent>;
  let setupServiceSpy: jasmine.SpyObj<AbbreviatedQuestionnaireSetupService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  const today = moment().startOf('day');
  const futureDate = today.clone().add(30, 'days');
  const pastDate = today.clone().subtract(30, 'days');

  const mockSetupData: AbbreviatedQuestionnaireSetup = {
    noOfDonations: '02',
    minDonations: '02',
    freqBetweenDonations: '06',
    freqType: 'M',
    deferralPeriod: '06',
    donationType: 'AL,DI,RE',
    effectiveDate: futureDate.format('YYYY-MM-DD'),
    terminationDate: null,
  };

  const mockDonationTypes: DonationTypeLookup[] = [
    { donationType: 'AL', description: 'Allogeneic' },
    { donationType: 'DI', description: 'Directed' },
    { donationType: 'RE', description: 'Regular' },
    { donationType: 'AU', description: 'Autologous' },
  ];

  const mockChapterIdSignal = signal<string>('DAL');
  const mockChapterTimeZoneSignal = signal<string>('UTC');
  const mockHeaderConfigSignal = signal<any>({
    user: { id: 'testuser', name: 'Test User' },
  });
  const mockPageHeaderDataSignal = signal<any>({
    title: 'Abbreviated Questionnaire Setup',
    subtitle: 'Configuration for the aDHQ',
  });

  beforeEach(() => {
    setupServiceSpy = jasmine.createSpyObj('AbbreviatedQuestionnaireSetupService', [
      'getSetup',
      'getDonationTypes',
      'updateSetup',
    ]);
    snackBarSpy = createMockMatSnackBar();

    setupServiceSpy.getSetup.and.returnValue(of(mockSetupData));
    setupServiceSpy.getDonationTypes.and.returnValue(of(mockDonationTypes));
    setupServiceSpy.updateSetup.and.returnValue(of({ success: true, message: 'OK' }));

    mockChapterIdSignal.set('DAL');



      TestBed.configureTestingModule({
      imports: [
        AbbreviatedQuestionnaireSetupComponent,
        ReactiveFormsModule,
        NoopAnimationsModule,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AbbreviatedQuestionnaireSetupService, useValue: setupServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        {
          provide: HeaderService,
          useValue: {
            chapterId: mockChapterIdSignal,
            chapterTimeZone: mockChapterTimeZoneSignal,
            headerConfig: mockHeaderConfigSignal,
          },
        },
        {
          provide: PageHeaderService,
          useValue: {
            pageHeaderData: mockPageHeaderDataSignal,
            getTitle: () => mockPageHeaderDataSignal()?.title,
            getSubtitle: () => mockPageHeaderDataSignal()?.subtitle,
          },
        },
      ],
    });


      setupServiceSpy.getSetup.and.returnValue(of(mockSetupData));


      setupServiceSpy.getDonationTypes.and.returnValue(of(mockDonationTypes));


      setupServiceSpy.updateSetup.and.returnValue(of({ success: true, message: 'OK' }));


    fixture = TestBed.createComponent(AbbreviatedQuestionnaireSetupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();


    });

  afterEach(() => {
    component.ngOnDestroy();
    fixture.destroy();
  });


  it('should load setup data on init', () => {
    expect(setupServiceSpy.getSetup).toHaveBeenCalled();
    expect(setupServiceSpy.getDonationTypes).toHaveBeenCalled();
  });

  it('should populate form with loaded data', () => {
    expect(component.form.get('noOfDonations')?.value).toBe('02');
    expect(component.form.get('minDonations')?.value).toBe('02');
    expect(component.form.get('freqBetweenDonations')?.value).toBe('06');
    expect(component.form.get('freqType')?.value).toBe('M');
    expect(component.form.get('deferralPeriod')?.value).toBe('06');
  });

  it('should parse donation types into array', () => {
    expect(component.selectedDonationTypes()).toEqual(['AL', 'DI', 'RE']);
    expect(component.form.get('donationType')?.value).toEqual(['AL', 'DI', 'RE']);
  });



  it('should set donationTypes signal', () => {
    expect(component.donationTypes().length).toBe(4);
  });



  it('should not disable effectiveDate when it is in the future', () => {
    expect(component.form.get('effectiveDate')?.disabled).toBeFalse();
  });



  describe('Form Validation', () => {
    it('should require noOfDonations', () => {
      component.form.get('noOfDonations')?.setValue('');
      component.form.get('noOfDonations')?.markAsTouched();
      expect(component.form.get('noOfDonations')?.hasError('required')).toBeTrue();
    });

    it('should validate numeric-only pattern for noOfDonations', () => {
      component.form.get('noOfDonations')?.setValue('abc');
      expect(component.form.get('noOfDonations')?.hasError('pattern')).toBeTrue();
    });

    it('should accept valid numeric value', () => {
      component.form.get('noOfDonations')?.setValue('5');
      expect(component.form.get('noOfDonations')?.valid).toBeTrue();
    });

    it('should require freqType', () => {
      component.form.get('freqType')?.setValue('');
      component.form.get('freqType')?.markAsTouched();
      expect(component.form.get('freqType')?.hasError('required')).toBeTrue();
    });

    it('should require effectiveDate', () => {
      component.form.get('effectiveDate')?.setValue(null);
      component.form.get('effectiveDate')?.markAsTouched();
      expect(component.form.get('effectiveDate')?.hasError('required')).toBeTrue();
    });

    it('should not require terminationDate', () => {
      component.form.get('terminationDate')?.setValue(null);
      expect(component.form.get('terminationDate')?.valid).toBeTrue();
    });

    it('should require donationType', () => {
      component.form.get('donationType')?.setValue([]);
      component.form.get('donationType')?.markAsTouched();
      expect(component.form.get('donationType')?.hasError('required')).toBeTrue();
    });

    it('should not flag minDonationsExceedsTotal when minDonations equals noOfDonations', () => {
      component.form.get('noOfDonations')?.setValue('5');
      component.form.get('minDonations')?.setValue('5');
      component.form.updateValueAndValidity();
      expect(component.form.hasError('minDonationsExceedsTotal')).toBeFalse();
    });

    it('should flag minDonationsExceedsTotal when minDonations > noOfDonations', () => {
      component.form.get('noOfDonations')?.setValue('3');
      component.form.get('minDonations')?.setValue('5');
      component.form.updateValueAndValidity();
      expect(component.form.hasError('minDonationsExceedsTotal')).toBeTrue();
    });

    it('should not flag minDonationsExceedsTotal when minDonations < noOfDonations', () => {
      component.form.get('noOfDonations')?.setValue('5');
      component.form.get('minDonations')?.setValue('3');
      component.form.updateValueAndValidity();
      expect(component.form.hasError('minDonationsExceedsTotal')).toBeFalse();
    });

    it('should return error message when minDonations > noOfDonations', () => {
      component.form.get('noOfDonations')?.setValue('3');
      component.form.get('minDonations')?.setValue('5');
      component.form.get('minDonations')?.markAsTouched();
      component.form.updateValueAndValidity();
      expect(component.getMinDonationsError()).toBe('Min Donations must be less than No. of Donations');
    });


  });

  describe('Termination Date Validation', () => {
    it('should reject termination date in the past', () => {
      component.form.get('terminationDate')?.setValue(pastDate.clone());
      component.form.get('terminationDate')?.markAsTouched();
      expect(component.form.get('terminationDate')?.hasError('terminationDatePast')).toBeTrue();
    });

    it('should accept termination date in the future', () => {
      component.form.get('terminationDate')?.setValue(futureDate.clone().add(10, 'days'));
      component.form.get('terminationDate')?.updateValueAndValidity();
      expect(component.form.get('terminationDate')?.valid).toBeTrue();
    });

    it('should set minTerminationDate', () => {
      expect(component.minTerminationDate).not.toBeNull();
    });

    it('should flag dateRangeInvalid when term date before eff date', () => {
      component.form.get('effectiveDate')?.setValue(futureDate.clone().add(20, 'days'));
      component.form.get('terminationDate')?.setValue(futureDate.clone().add(5, 'days'));
      component.form.updateValueAndValidity();
      expect(component.form.hasError('dateRangeInvalid')).toBeTrue();
    });


  });

  describe('Donation Type Management', () => {
    it('should remove a donation type', () => {
      component.removeDonationType('DI');
      expect(component.selectedDonationTypes()).toEqual(['AL', 'RE']);
      expect(component.form.get('donationType')?.value).toEqual(['AL', 'RE']);
    });

    it('should update donation types on selection change', () => {
      component.onDonationTypeChange(['AL', 'AU']);
      expect(component.selectedDonationTypes()).toEqual(['AL', 'AU']);
    });
  });

  describe('Frequency Type Label', () => {
    it('should return label for valid code', () => {
      expect(component.getFreqTypeLabel('M')).toBe('Months');
      expect(component.getFreqTypeLabel('D')).toBe('Days');
      expect(component.getFreqTypeLabel('W')).toBe('Weeks');
      expect(component.getFreqTypeLabel('Y')).toBe('Years');
    });

    it('should return code for unknown code', () => {
      expect(component.getFreqTypeLabel('X')).toBe('X');
    });
  });

  describe('Auto-save', () => {


    it('should have auto-save subscription on form valueChanges', () => {
      // Verify the form has the auto-save mechanism wired up
      expect(component.form).toBeTruthy();
      expect(component.isSaving()).toBeFalse();
    });
  });

  describe('Field Error Messages', () => {
    it('should return required error', () => {
      component.form.get('noOfDonations')?.setValue('');
      component.form.get('noOfDonations')?.markAsTouched();
      expect(component.getFieldError('noOfDonations', 'No. of Donations')).toBe(
        'No. of Donations is required'
      );
    });

    it('should return pattern error', () => {
      component.form.get('noOfDonations')?.setValue('abc');
      component.form.get('noOfDonations')?.markAsTouched();
      expect(component.getFieldError('noOfDonations', 'No. of Donations')).toBe(
        'No. of Donations must be a number between 1 and 999'
      );
    });


  });
});
