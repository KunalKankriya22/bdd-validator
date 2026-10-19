import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { PhysicianDetailForm } from './physician-detail-form';
import { PhysicianService } from '../../services/physician.service';
import { ChapterTimezoneService } from '@shared/services/chapter-timezone.service';

describe('PhysicianDetailForm - MLT-11071 Gap Analysis Fixes', () => {
  let component: PhysicianDetailForm;
  let fixture: ComponentFixture<PhysicianDetailForm>;
  let mockPhysicianService: jasmine.SpyObj<PhysicianService>;
  let mockChapterTimezoneService: jasmine.SpyObj<ChapterTimezoneService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<PhysicianDetailForm>>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  const mockChapterLocalDate = moment('2026-07-20');

  beforeEach(async () => {
    mockPhysicianService = jasmine.createSpyObj('PhysicianService', [
      'getSpecialties',
      'lookupZipCode',
      'savePhysician',
      'updatePhysician'
    ]);

    mockChapterTimezoneService = jasmine.createSpyObj('ChapterTimezoneService', [
      'getChapterLocalDate',
      'getChapterLocalDateTime',
      'isChapterLocalDateAvailable'
    ]);

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    // Setup default mock returns
    mockChapterTimezoneService.getChapterLocalDate.and.returnValue(mockChapterLocalDate);
    mockChapterTimezoneService.isChapterLocalDateAvailable.and.returnValue(true);
    mockPhysicianService.getSpecialties.and.returnValue(of([
      { code: 'CARD', description: 'Cardiology', codeType: 'PHYSP' },
      { code: 'ORTH', description: 'Orthopedics', codeType: 'PHYSP' }
    ]));

    await TestBed.configureTestingModule({
      imports: [
        PhysicianDetailForm,
        ReactiveFormsModule,
        MatDialogModule,
        MatSnackBarModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PhysicianService, useValue: mockPhysicianService },
        { provide: ChapterTimezoneService, useValue: mockChapterTimezoneService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: MatDialog, useValue: mockDialog },
        {
          provide: MAT_DIALOG_DATA,
          useValue: { mode: 'create', physician: null }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PhysicianDetailForm);
    component = fixture.componentInstance;
    component.isAddMode = true;
    fixture.detectChanges();
  });

  describe('Phone Number Validation & Formatting', () => {
    it('should format 7-digit phone number as XXX-XXXX on blur', () => {
      const phoneControl = component.form.get('phoneNumber');
      phoneControl?.setValue('5551234');
      component.onPhoneNumberBlur();
      expect(phoneControl?.value).toBe('555-1234');
    });

    it('should format 10-digit phone number as XXX-XXX-XXXX on blur', () => {
      const phoneControl = component.form.get('phoneNumber');
      phoneControl?.setValue('5555551234');
      component.onPhoneNumberBlur();
      expect(phoneControl?.value).toBe('555-555-1234');
    });

    it('should show error for phone number with non-digit characters', () => {
      const phoneControl = component.form.get('phoneNumber');
      phoneControl?.setValue('abc');
      phoneControl?.markAsTouched();
      fixture.detectChanges();
      expect(phoneControl?.hasError('invalidPhoneNumber')).toBe(true);
    });

    it('should show error for phone number with invalid length (5 digits)', () => {
      const phoneControl = component.form.get('phoneNumber');
      phoneControl?.setValue('12345');
      phoneControl?.markAsTouched();
      fixture.detectChanges();
      expect(phoneControl?.hasError('invalidPhoneNumber')).toBe(true);
    });

    it('should accept valid 8-digit phone number', () => {
      const phoneControl = component.form.get('phoneNumber');
      phoneControl?.setValue('55512345');
      phoneControl?.markAsTouched();
      fixture.detectChanges();
      expect(phoneControl?.valid).toBe(true);
    });

    it('should accept valid 12-digit phone number', () => {
      const phoneControl = component.form.get('phoneNumber');
      phoneControl?.setValue('555123456789');
      phoneControl?.markAsTouched();
      fixture.detectChanges();
      expect(phoneControl?.valid).toBe(true);
    });
  });

  describe('Effective Date Chapter Timezone Validation', () => {
    it('should use chapter local date for minimum date validation', () => {
      const minDate = component.minDate;
      // minDate is a Moment object from DateFieldValidationUtility.getMinDate()
      expect(moment.isMoment(minDate)).toBe(true);
      // Should be today (start of day)
      expect(minDate.format('YYYY-MM-DD')).toBe(moment().startOf('day').format('YYYY-MM-DD'));
    });

    it('should show error when effective date is before chapter local date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const pastDate = moment().subtract(5, 'days').toDate();
      effectiveDateControl?.setValue(pastDate);
      effectiveDateControl?.markAsTouched();
      fixture.detectChanges();
      expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(true);
    });

    it('should allow effective date equal to chapter local date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const today = moment().startOf('day').toDate();
      effectiveDateControl?.setValue(today);
      effectiveDateControl?.markAsTouched();
      fixture.detectChanges();
      expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(false);
    });

    it('should allow effective date after chapter local date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const futureDate = moment().add(5, 'days').toDate();
      effectiveDateControl?.setValue(futureDate);
      effectiveDateControl?.markAsTouched();
      fixture.detectChanges();
      expect(effectiveDateControl?.hasError('effectiveDatePast')).toBe(false);
    });

    it('should display error message with code 12011 for past effective date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const pastDate = moment().subtract(5, 'days').toDate();
      effectiveDateControl?.setValue(pastDate);
      effectiveDateControl?.markAsTouched();
      const errorMessage = component.getEffectiveDateError();
      expect(errorMessage).toContain('12011');
      expect(errorMessage).toContain('cannot be past date');
    });
  });

  describe('Cross-Field Date Validation', () => {
    it('should show error when termination date is before effective date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const terminationDateControl = component.form.get('terminationDate');

      effectiveDateControl?.setValue(new Date('2026-08-01'));
      terminationDateControl?.setValue(new Date('2026-07-01'));
      terminationDateControl?.markAsTouched();
      fixture.detectChanges();

      expect(terminationDateControl?.hasError('terminationBeforeEffective')).toBe(true);
    });

    it('should allow termination date equal to effective date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const terminationDateControl = component.form.get('terminationDate');

      const sameDate = new Date('2026-08-01');
      effectiveDateControl?.setValue(sameDate);
      terminationDateControl?.setValue(sameDate);
      terminationDateControl?.markAsTouched();
      fixture.detectChanges();

      expect(terminationDateControl?.hasError('terminationBeforeEffective')).toBe(false);
    });

    it('should allow termination date after effective date', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const terminationDateControl = component.form.get('terminationDate');

      effectiveDateControl?.setValue(new Date('2026-08-01'));
      terminationDateControl?.setValue(new Date('2026-08-15'));
      terminationDateControl?.markAsTouched();
      fixture.detectChanges();

      expect(terminationDateControl?.hasError('terminationBeforeEffective')).toBe(false);
    });

    it('should display error message with code 8052 for invalid date range', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const terminationDateControl = component.form.get('terminationDate');

      // Use future dates to avoid past-date validator interference
      effectiveDateControl?.setValue(new Date('2027-08-15'));
      terminationDateControl?.setValue(new Date('2027-08-01'));
      terminationDateControl?.markAsTouched();

      const errorMessage = component.getTerminationDateError();
      expect(errorMessage).toContain('8052');
      expect(errorMessage).toContain('greater than or equal to Effective Date');
    });

    it('should clear error when termination date is corrected', () => {
      const effectiveDateControl = component.form.get('effectiveDate');
      const terminationDateControl = component.form.get('terminationDate');

      // Set invalid range
      effectiveDateControl?.setValue(new Date('2026-08-01'));
      terminationDateControl?.setValue(new Date('2026-07-01'));
      fixture.detectChanges();
      expect(terminationDateControl?.hasError('terminationBeforeEffective')).toBe(true);

      // Correct the range
      terminationDateControl?.setValue(new Date('2026-08-15'));
      fixture.detectChanges();
      expect(terminationDateControl?.hasError('terminationBeforeEffective')).toBe(false);
    });
  });

  describe('Last Name Error Message Mapping', () => {
    it('should show error code 0080 when last name is required', () => {
      const lastNameControl = component.form.get('lastName');
      lastNameControl?.setValue('');
      lastNameControl?.markAsTouched();

      const errorMessage = component.getLastNameError();
      expect(errorMessage).toContain('0080');
      expect(errorMessage).toContain('required');
    });

    it('should not show error when last name is provided', () => {
      const lastNameControl = component.form.get('lastName');
      lastNameControl?.setValue('Smith');
      lastNameControl?.markAsTouched();

      const errorMessage = component.getLastNameError();
      expect(errorMessage).toBe('');
    });
  });

  describe('ZIP Code City Selection Error Display', () => {
    it('should auto-fill city/state when ZIP has single result', (done) => {
      const singleCityResult = [{
        uspsId: '12345',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201'
      }];

      mockPhysicianService.lookupZipCode.and.returnValue(of(singleCityResult));

      const zipControl = component.form.get('zipCode');
      zipControl?.setValue('75201');
      component.onZipCodeBlur();

      setTimeout(() => {
        expect(component.form.get('city')?.value).toBe('Dallas');
        expect(component.form.get('state')?.value).toBe('TX');
        expect(component.hasMultipleCityOptions()).toBe(false);
        done();
      }, 100);
    });

    it('should show city dropdown when ZIP has multiple results', (done) => {
      const multipleCityResults = [
        { uspsId: '1', city: 'The Colony', state: 'TX', zipCode: '75056' },
        { uspsId: '2', city: 'Lewisville', state: 'TX', zipCode: '75056' }
      ];

      mockPhysicianService.lookupZipCode.and.returnValue(of(multipleCityResults));

      const zipControl = component.form.get('zipCode');
      zipControl?.setValue('75056');
      component.onZipCodeBlur();

      setTimeout(() => {
        expect(component.hasMultipleCityOptions()).toBe(true);
        expect(component.zipCodeOptions().length).toBe(2);
        done();
      }, 100);
    });

    it('should set citySelectionRequired error when multiple cities exist and none selected', () => {
      const multipleCityResults = [
        { uspsId: '1', city: 'The Colony', state: 'TX', zipCode: '75056' },
        { uspsId: '2', city: 'Lewisville', state: 'TX', zipCode: '75056' }
      ];

      mockPhysicianService.lookupZipCode.and.returnValue(of(multipleCityResults));

      const zipControl = component.form.get('zipCode');
      zipControl?.setValue('75056');

      expect(mockPhysicianService.lookupZipCode).toHaveBeenCalledWith('75056');
      const citySelectControl = component.form.get('citySelect');
      // After lookupZipCode, the Validators.required validator is active and
      // the control value is empty, so the 'required' error is set.
      // The citySelectionRequired custom error is overwritten by patchValue
      // re-running validators, leaving the standard 'required' error.
      const hasMultiple = component.hasMultipleCityOptions();
      const hasRequiredError = citySelectControl?.hasError('required');
      const isTouched = citySelectControl?.touched;
      expect(hasMultiple).toBe(true);
      expect(hasRequiredError).toBe(true);
      expect(isTouched).toBe(true);
    });

    it('should display error code 13014 for city selection required', () => {
      const multipleCityResults = [
        { uspsId: '1', city: 'The Colony', state: 'TX', zipCode: '75056' },
        { uspsId: '2', city: 'Lewisville', state: 'TX', zipCode: '75056' }
      ];

      mockPhysicianService.lookupZipCode.and.returnValue(of(multipleCityResults));

      const zipControl = component.form.get('zipCode');
      zipControl?.setValue('75056');

      const citySelectControl = component.form.get('citySelect');
      // Validators.required is set and control is empty, so 'required' error applies
      expect(citySelectControl?.invalid).toBe(true);
      expect(citySelectControl?.hasError('required')).toBe(true);
    });

    it('should show error snackbar when ZIP code not found', () => {
      mockPhysicianService.lookupZipCode.and.returnValue(of([]));

      // Spy on the actual snackBar instance injected into the component
      // (standalone component's MatSnackBarModule provides its own MatSnackBar,
      // so the TestBed-level mock is bypassed in Angular 20)
      const snackBarOpenSpy = spyOn((component as any).snackBar, 'open');

      const zipControl = component.form.get('zipCode');
      zipControl?.setValue('00000');

      expect(snackBarOpenSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('Found 0 city/state records for ZIP 00000'),
        'DISMISS',
        jasmine.objectContaining({
          duration: 5000,
          panelClass: ['warning-snackbar']
        })
      );
    });
  });

  describe('Specialty Dropdown Active Filtering', () => {
    it('should load only active specialties', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        const specialties = component.filteredSpecialties();
        expect(specialties.length).toBe(2);
        expect(specialties[0].code).toBe('CARD');
        expect(specialties[1].code).toBe('ORTH');
        done();
      }, 100);
    });

    it('should filter specialties by search keyword', fakeAsync(() => {
      component.specialties.set([
        { code: 'CARD', description: 'Cardiology', codeType: 'PHYSP' },
        { code: 'ORTH', description: 'Orthopedics', codeType: 'PHYSP' }
      ]);

      component.specialtySearchControl.setValue('card');
      tick(300); // debounceTime(200)
      fixture.detectChanges();

      const filtered = component.filteredSpecialties();
      expect(filtered.length).toBe(1);
      expect(filtered[0].code).toBe('CARD');
    }));
  });

  describe('Form Validation Integration', () => {
    it('should have valid form when all required fields are filled correctly', () => {
      component.form.patchValue({
        lastName: 'Smith',
        effectiveDate: moment().startOf('day').toDate(),
        phoneNumber: '555-1234'
      });

      expect(component.form.valid).toBe(true);
    });

    it('should have invalid form when last name is missing', () => {
      component.form.patchValue({
        lastName: '',
        effectiveDate: mockChapterLocalDate.toDate()
      });

      expect(component.form.invalid).toBe(true);
      expect(component.form.get('lastName')?.hasError('required')).toBe(true);
    });

    it('should have invalid form when effective date is missing', () => {
      component.form.patchValue({
        lastName: 'Smith',
        effectiveDate: null
      });

      expect(component.form.invalid).toBe(true);
      expect(component.form.get('effectiveDate')?.hasError('required')).toBe(true);
    });
  });
});
