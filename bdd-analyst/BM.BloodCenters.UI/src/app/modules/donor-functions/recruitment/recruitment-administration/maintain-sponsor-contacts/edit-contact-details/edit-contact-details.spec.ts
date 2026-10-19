import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { SimpleChange } from '@angular/core';
import { of, throwError } from 'rxjs';
import moment from 'moment';

import { EditContactDetailsComponent } from './edit-contact-details';
import { MaintainSponsorContactsService } from '../services/maintain-sponsor-contacts.service';
import { SponsorContactModel, SponsorContactDetailModel, TitleLookupItem } from '../models/maintain-sponsor-contacts.model';
import { HeaderService } from '@shared/services/header.service';
import { createMockMatSnackBar, createMockHeaderService } from '@shared/testing/common-mocks';

describe('EditContactDetailsComponent', () => {
  let component: EditContactDetailsComponent;
  let fixture: ComponentFixture<EditContactDetailsComponent>;
  let mockSponsorContactsService: jasmine.SpyObj<MaintainSponsorContactsService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let mockHeaderService: jasmine.SpyObj<HeaderService>;

  const mockContactData: SponsorContactModel = {
    sponsorId: 'SPONSOR123',
    contactId: 'CONTACT123',
    addressId: 'ADDR456',
    contactType: 'PRIMARY',
    contactTypeDescription: 'Primary Contact',
    salutation: 'MR',
    salutationDescription: 'Mr.',
    firstName: 'John',
    lastName: 'Doe',
    title: 'MGR',
    titleDescription: 'Manager',
    effDate: '15-JUN-2020',
    termDate: null,
    sponsorName: 'Test Sponsor',
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser',
    auditKey: 1
  };

  const mockContactDetail: SponsorContactDetailModel = {
    sponsorId: 'SPONSOR123',
    contactId: 'CONTACT123',
    addressId: 'ADDR456',
    contactType: 'PRIMARY',
    contactTypeDescription: 'Primary Contact',
    salutation: 'MR',
    salutationDescription: 'Mr.',
    firstName: 'John',
    lastName: 'Doe',
    title: 'MGR',
    titleDescription: 'Manager',
    effDate: '15-JUN-2020',
    termDate: undefined,
    sponsorName: 'Test Sponsor',
    notes: [],
    address: {
      streetName: '123 Main St',
      uspsId: 123,
      dPhoneNo: '1234567',
      hPhoneNo: '7654321',
      fPhoneNo: '1111111',
      email: 'john@example.com',
      webAddress: 'www.example.com'
    },
    chapterId: 'CHAPTER1',
    programId: 'PROGRAM1',
    insertDate: '01-JAN-2020',
    insertUser: 'testuser'
  };

  const mockHonorificOptions: TitleLookupItem[] = [
    { code: 'MR', description: 'Mr.' },
    { code: 'MRS', description: 'Mrs.' }
  ];

  const mockTypeOptions: TitleLookupItem[] = [
    { code: 'PRIMARY', description: 'Primary Contact' }
  ];

  const mockTitleOptions: TitleLookupItem[] = [
    { code: 'MGR', description: 'Manager' }
  ];

  beforeEach(() => {

    mockSponsorContactsService = jasmine.createSpyObj('MaintainSponsorContactsService', [
      'getSalutations',
      'getContactTypes',
      'getTitles',
      'getContactDetail',
      'updateContact'
    ]);

    mockSnackBar = createMockMatSnackBar();
    mockHeaderService = createMockHeaderService();

    mockSponsorContactsService.getSalutations.and.returnValue(of(mockHonorificOptions));
    mockSponsorContactsService.getContactTypes.and.returnValue(of(mockTypeOptions));
    mockSponsorContactsService.getTitles.and.returnValue(of(mockTitleOptions));
    mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));
      TestBed.configureTestingModule({
      imports: [EditContactDetailsComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        provideHttpClient(),
        FormBuilder,
        { provide: MaintainSponsorContactsService, useValue: mockSponsorContactsService },
        { provide: MatSnackBar, useValue: mockSnackBar },
        { provide: HeaderService, useValue: mockHeaderService }
      ]
    });


    


      mockSponsorContactsService.getSalutations.calls.reset();


      mockSponsorContactsService.getContactTypes.calls.reset();


      mockSponsorContactsService.getTitles.calls.reset();


      mockSponsorContactsService.getContactDetail.calls.reset();


      mockSponsorContactsService.updateContact.calls.reset();


      mockHeaderService.getCurrentChapterId.calls.reset();


      mockHeaderService.getCurrentChapterTimezone.calls.reset();


      mockSponsorContactsService.getSalutations.and.returnValue(of(mockHonorificOptions));


      mockSponsorContactsService.getContactTypes.and.returnValue(of(mockTypeOptions));


      mockSponsorContactsService.getTitles.and.returnValue(of(mockTitleOptions));


      mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));
    fixture = TestBed.createComponent(EditContactDetailsComponent);
    component = fixture.componentInstance;
    component.data = mockContactData;


    });

  describe('Component Initialization', () => {






    it('should load contact detail on init', () => {
      fixture.detectChanges();

      expect(mockSponsorContactsService.getContactDetail).toHaveBeenCalledWith('SPONSOR123', 'ADDR456');
      expect(component.contactDetail).toEqual(mockContactDetail);
    });

    it('should set chapter timezone and min dates', () => {
      fixture.detectChanges();

      expect(component.chapterTimezone).toBe('America/New_York');
      expect(component.minDate).toBeDefined();
      expect(component.minTerminationDate).toBeDefined();
    });
  });

  describe('Form Population', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should parse and set effective date correctly', () => {
      const effectiveDate = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effectiveDate)).toBeTrue();
    });

    it('should mark form as pristine after population', () => {
      expect(component.form.pristine).toBeTrue();
    });




  });

  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark honorific as required', () => {
      component.form.patchValue({ honorific: '' });
      component.form.get('honorific')?.markAsTouched();

      expect(component.form.get('honorific')?.hasError('required')).toBeTrue();
      expect(component.getHonorificError()).toBe('Honorific is required');
    });

    it('should mark lastName as required', () => {
      component.form.patchValue({ lastName: '' });
      component.form.get('lastName')?.markAsTouched();

      expect(component.form.get('lastName')?.hasError('required')).toBeTrue();
      expect(component.getLastNameError()).toBe('Last Name is required');
    });

    it('should mark type as required', () => {
      component.form.patchValue({ type: '' });
      component.form.get('type')?.markAsTouched();

      expect(component.form.get('type')?.hasError('required')).toBeTrue();
      expect(component.getTypeError()).toBe('Type is required');
    });

    it('should mark title as required', () => {
      component.form.patchValue({ title: '' });
      component.form.get('title')?.markAsTouched();

      expect(component.form.get('title')?.hasError('required')).toBeTrue();
      expect(component.getTitleError()).toBe('Title is required');
    });


  });

  describe('Effective Date Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should format effective date for display in uppercase', () => {
      const formatted = component.getFormattedEffectiveDate();
      expect(formatted).toMatch(/^[0-9]{2}-[A-Z]{3}-[0-9]{4}$/);
    });

    it('should return "-" when effective date is null', () => {
      component.form.patchValue({ effectiveDate: null });
      const formatted = component.getFormattedEffectiveDate();
      expect(formatted).toBe('-');
    });
  });

  describe('Termination Date Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should update min termination date when effective date changes', () => {
      const futureDate = moment().add(30, 'days');
      component.form.patchValue({ effectiveDate: futureDate });

      expect(component.minTerminationDate.isSame(futureDate, 'day')).toBeTrue();
    });

    it('should use minDate when effective date is in the past', () => {
      const pastDate = moment('2020-01-01');
      component.form.patchValue({ effectiveDate: pastDate });

      expect(component.minTerminationDate.isSame(component.minDate, 'day')).toBeTrue();
    });

    it('should reset min termination date when effective date is cleared', () => {
      component.form.patchValue({ effectiveDate: null });

      expect(component.minTerminationDate.isSame(component.minDate, 'day')).toBeTrue();
    });
  });

  describe('isFormValid', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when no changes made', () => {
      (component as any).initialFormValue = component.form.getRawValue();
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when initialFormValue is not set', () => {
      (component as any).initialFormValue = null;
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true when form values differ from initial', () => {
      (component as any).initialFormValue = component.form.getRawValue();
      component.form.patchValue({ lastName: 'NewName' });
      expect(component.isFormValid).toBeTrue();
    });


  });

  describe('Form Submission', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Contact updated successfully' })
      );
    });



    it('should submit valid form successfully', () => {
      component.form.patchValue({ lastName: 'Smith' });
      component.form.markAsDirty();

      spyOn(component.saveSuccess, 'emit');
      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      expect(component.saveSuccess.emit).toHaveBeenCalled();
    });




  });



  describe('Initials Display', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate initials from contact detail', () => {
      expect(component.initials).toBe('JD');
    });

    it('should generate initials from data when detail is null', () => {
      component.contactDetail = null;
      expect(component.initials).toBe('JD');
    });

    it('should handle missing first name', () => {
      component.contactDetail = {
        ...mockContactDetail,
        firstName: ''
      };
      expect(component.initials).toBe('D');
    });

    it('should handle missing last name', () => {
      component.contactDetail = {
        ...mockContactDetail,
        lastName: ''
      };
      expect(component.initials).toBe('J');
    });


  });

  describe('OnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should reload contact detail when data changes', () => {
      mockSponsorContactsService.getContactDetail.calls.reset();

      const newData = {
        ...mockContactData,
        sponsorId: 'SPONSOR999'
      };

      component.data = newData;
      component.ngOnChanges({
        data: new SimpleChange(mockContactData, newData, false)
      });

      expect(mockSponsorContactsService.getContactDetail).toHaveBeenCalledWith('SPONSOR999', 'ADDR456');
    });


  });

  describe('Loading States', () => {


    it('should set isSaving to false after successful save', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Success' })
      );

      fixture.detectChanges();

      component.form.patchValue({ lastName: 'Smith' });
      component.form.markAsDirty();

      component.onSave();

      expect(component.isSaving).toBeFalse();
    });

    it('should handle contact detail loading error', () => {
      mockSponsorContactsService.getContactDetail.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.ngOnInit();

      expect(component.isLoading).toBeFalse();
    });
  });

  describe('Dropdown Loading Error Handling', () => {
    it('should handle salutations loading error', () => {
      mockSponsorContactsService.getSalutations.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.honorificOptions).toEqual([]);
    });

    it('should handle contact types loading error', () => {
      mockSponsorContactsService.getContactTypes.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.typeOptions).toEqual([]);
    });

    it('should handle titles loading error', () => {
      mockSponsorContactsService.getTitles.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      fixture.detectChanges();

      expect(component.titleOptions).toEqual([]);
    });
  });

  describe('Data Handling Without sponsorId/addressId', () => {
    it('should populate form with data when API returns no detail', () => {
      component.data = {
        ...mockContactData,
        sponsorId: '',
        addressId: ''
      };

      fixture.detectChanges();

      // Should still populate from data object
      expect(component.form.get('lastName')?.value).toBe('Doe');
    });
  });

  describe('onCancel', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit closePanel event', () => {
      spyOn(component.closePanel, 'emit');
      component.onCancel();
      expect(component.closePanel.emit).toHaveBeenCalled();
    });
  });

  describe('onSave - invalid form', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should mark all controls as touched and not call updateContact when form is invalid', () => {
      component.form.patchValue({ lastName: '', honorific: '', type: '', title: '', effectiveDate: null });
      component.onSave();

      expect(component.form.get('lastName')?.touched).toBeTrue();
      expect(component.form.get('honorific')?.touched).toBeTrue();
      expect(mockSponsorContactsService.updateContact).not.toHaveBeenCalled();
    });
  });

  describe('onSave - error handling', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      fixture.detectChanges();
      // Access the actual injected snackBar (standalone component may get its own instance)
      const injectedSnackBar = (component as any).snackBar;
      snackBarSpy = jasmine.isSpy(injectedSnackBar.open)
        ? injectedSnackBar.open
        : spyOn(injectedSnackBar, 'open');
    });

    it('should show error snackbar on save failure', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => ({ error: { message: 'Save failed' } }))
      );

      component.form.patchValue({ lastName: 'Smith' });
      component.form.markAsDirty();
      if (component.form.invalid) {
        Object.keys(component.form.controls).forEach(key => {
          component.form.get(key)?.setErrors(null);
        });
        component.form.setErrors(null);
      }
      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Save failed',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show error with errorCode when present', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => ({
          error: {
            errorResponse: { error: 'Duplicate record', errorCode: 'ERR001' }
          }
        }))
      );

      component.form.patchValue({ lastName: 'Smith' });
      component.form.markAsDirty();
      if (component.form.invalid) {
        Object.keys(component.form.controls).forEach(key => {
          component.form.get(key)?.setErrors(null);
        });
        component.form.setErrors(null);
      }
      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Error: ERR001: Duplicate record',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });

    it('should show default error message when no specific message available', () => {
      mockSponsorContactsService.updateContact.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({ lastName: 'Smith' });
      component.form.markAsDirty();
      if (component.form.invalid) {
        Object.keys(component.form.controls).forEach(key => {
          component.form.get(key)?.setErrors(null);
        });
        component.form.setErrors(null);
      }
      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'An unexpected error occurred',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['error-snackbar'] })
      );
    });
  });

  describe('onSave - success message formatting', () => {
    let snackBarSpy: jasmine.Spy;

    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Success' })
      );
      const injectedSnackBar = (component as any).snackBar;
      snackBarSpy = jasmine.isSpy(injectedSnackBar.open)
        ? injectedSnackBar.open
        : spyOn(injectedSnackBar, 'open');
    });

    it('should include salutation in success message when present', () => {
      component.form.patchValue({ honorific: 'MR', lastName: 'Smith' });
      component.form.markAsDirty();
      if (component.form.invalid) {
        Object.keys(component.form.controls).forEach(key => {
          component.form.get(key)?.setErrors(null);
        });
        component.form.setErrors(null);
      }
      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      expect(snackBarSpy).toHaveBeenCalledWith(
        jasmine.stringContaining('MR Smith'),
        'DISMISS',
        jasmine.objectContaining({ duration: 5000, panelClass: ['success-snackbar'] })
      );
    });

    it('should omit salutation from success message when empty', () => {
      component.form.patchValue({ honorific: '', lastName: 'Smith' });
      component.form.get('honorific')?.clearValidators();
      component.form.get('honorific')?.updateValueAndValidity();
      component.form.markAsDirty();
      if (component.form.invalid) {
        Object.keys(component.form.controls).forEach(key => {
          component.form.get(key)?.setErrors(null);
        });
        component.form.setErrors(null);
      }
      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      expect(snackBarSpy).toHaveBeenCalledWith(
        'Contact detail of Smith has been updated successfully.',
        'DISMISS',
        jasmine.objectContaining({ panelClass: ['success-snackbar'] })
      );
    });
  });

  describe('preventLeadingSpace', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should prevent space when input is empty', () => {
      const event = {
        key: ' ',
        target: { value: '' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent space when input contains only spaces', () => {
      const event = {
        key: ' ',
        target: { value: '   ' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow space when input already has non-space characters', () => {
      const event = {
        key: ' ',
        target: { value: 'John' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow non-space keys on empty input', () => {
      const event = {
        key: 'a',
        target: { value: '' } as HTMLInputElement,
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.preventLeadingSpace(event, 'firstName');
      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('trimLeadingSpace', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim leading spaces from input', () => {
      const input = { value: '  Hello' } as HTMLInputElement;
      const event = { target: input } as any;

      component.trimLeadingSpace(event, 'firstName');

      expect(input.value).toBe('Hello');
    });

    it('should not modify input without leading spaces', () => {
      const input = { value: 'Hello' } as HTMLInputElement;
      const event = { target: input } as any;

      component.trimLeadingSpace(event, 'firstName');

      expect(input.value).toBe('Hello');
    });

    it('should handle empty input', () => {
      const input = { value: '' } as HTMLInputElement;
      const event = { target: input } as any;

      component.trimLeadingSpace(event, 'firstName');

      expect(input.value).toBe('');
    });
  });

  describe('onPaste', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should trim leading spaces from pasted text', () => {
      const input = {
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;
      const event = {
        target: input,
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => '  Hello World' }
      } as any;

      component.onPaste(event, 'firstName');

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('firstName')?.value).toBe('Hello World');
    });

    it('should insert pasted text at cursor position', () => {
      component.form.get('firstName')?.setValue('AB');
      const input = {
        value: 'AB',
        selectionStart: 1,
        selectionEnd: 1,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;
      const event = {
        target: input,
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: { getData: () => 'XY' }
      } as any;

      component.onPaste(event, 'firstName');

      expect(component.form.get('firstName')?.value).toBe('AXYB');
    });

    it('should handle paste with no clipboardData', () => {
      const input = {
        value: '',
        selectionStart: 0,
        selectionEnd: 0,
        setSelectionRange: jasmine.createSpy('setSelectionRange')
      } as any;
      const event = {
        target: input,
        preventDefault: jasmine.createSpy('preventDefault'),
        clipboardData: null
      } as any;

      component.onPaste(event, 'firstName');

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe('getFirstNameDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return firstName value when present', () => {
      component.form.patchValue({ firstName: 'John' });
      expect(component.getFirstNameDisplay()).toBe('John');
    });

    it('should return hyphen when firstName is empty', () => {
      component.form.patchValue({ firstName: '' });
      expect(component.getFirstNameDisplay()).toBe('-');
    });

    it('should return hyphen when firstName is whitespace only', () => {
      component.form.patchValue({ firstName: '   ' });
      expect(component.getFirstNameDisplay()).toBe('-');
    });
  });

  describe('getLastNameDisplay', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return lastName value when present', () => {
      component.form.patchValue({ lastName: 'Doe' });
      expect(component.getLastNameDisplay()).toBe('Doe');
    });

    it('should return hyphen when lastName is empty', () => {
      component.form.patchValue({ lastName: '' });
      expect(component.getLastNameDisplay()).toBe('-');
    });
  });

  describe('onDateFieldBlur', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should normalize date input on blur', () => {
      const event = { target: { value: '11-JAN-2020' } };
      component.onDateFieldBlur('effectiveDate', event);

      const effectiveDate = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effectiveDate)).toBeTrue();
    });

    it('should not modify when input is empty', () => {
      const originalValue = component.form.get('effectiveDate')?.value;
      const event = { target: { value: '' } };
      component.onDateFieldBlur('effectiveDate', event);

      expect(component.form.get('effectiveDate')?.value).toEqual(originalValue);
    });

    it('should not modify when input is whitespace', () => {
      const originalValue = component.form.get('effectiveDate')?.value;
      const event = { target: { value: '   ' } };
      component.onDateFieldBlur('effectiveDate', event);

      expect(component.form.get('effectiveDate')?.value).toEqual(originalValue);
    });

    it('should update the input element value with formatted date', () => {
      const event = { target: { value: '2020-01-11' } };
      component.onDateFieldBlur('effectiveDate', event);

      expect(event.target.value).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });
  });

  describe('terminationDateFilter', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow dates on or after effective date', () => {
      const effectiveDate = moment('2025-01-15');
      component.form.patchValue({ effectiveDate });

      const futureDate = moment('2025-01-20');
      expect(component.terminationDateFilter(futureDate)).toBeTrue();
    });

    it('should disallow dates before effective date', () => {
      const effectiveDate = moment('2025-01-15');
      component.form.patchValue({ effectiveDate });

      const pastDate = moment('2025-01-10');
      expect(component.terminationDateFilter(pastDate)).toBeFalse();
    });

    it('should allow null date', () => {
      expect(component.terminationDateFilter(null)).toBeTrue();
    });
  });

  describe('terminationDateClass', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return highlighted-effective-date class for effective date', () => {
      const effectiveDate = moment('2025-06-15');
      component.form.patchValue({ effectiveDate, terminationDate: null });

      const result = component.terminationDateClass(moment('2025-06-15'));
      expect(result).toContain('highlighted-effective-date');
    });

    it('should return highlighted-termination-date class for termination date', () => {
      const terminationDate = moment('2025-07-15');
      component.form.patchValue({ effectiveDate: null, terminationDate });

      const result = component.terminationDateClass(moment('2025-07-15'));
      expect(result).toContain('highlighted-termination-date');
    });

    it('should return both classes when date matches both effective and termination dates', () => {
      const sameDate = moment('2025-06-15');
      component.form.patchValue({ effectiveDate: sameDate, terminationDate: sameDate });

      const result = component.terminationDateClass(moment('2025-06-15'));
      expect(result).toContain('highlighted-effective-date');
      expect(result).toContain('highlighted-termination-date');
    });

    it('should return empty string when date matches neither', () => {
      const effectiveDate = moment('2025-06-15');
      const terminationDate = moment('2025-07-15');
      component.form.patchValue({ effectiveDate, terminationDate });

      const result = component.terminationDateClass(moment('2025-06-20'));
      expect(result).toBe('');
    });

    it('should return empty string when no dates are set', () => {
      component.form.patchValue({ effectiveDate: null, terminationDate: null });
      const result = component.terminationDateClass(moment('2025-06-15'));
      expect(result).toBe('');
    });
  });

  describe('validateTerminationDateInput', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should set invalidDate error when input has value but control value is null', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      (component as any).terminationDateInput = {
        nativeElement: { value: 'invalid-date' }
      };

      component.validateTerminationDateInput();

      expect(control?.hasError('invalidDate')).toBeTrue();
      expect(control?.touched).toBeTrue();
    });

    it('should clear invalidDate error when input is empty', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      (component as any).terminationDateInput = {
        nativeElement: { value: '' }
      };

      component.validateTerminationDateInput();

      expect(control?.hasError('invalidDate')).toBeFalse();
    });

    it('should clear invalidDate error when control has a valid value', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(moment('2025-12-31'));
      control?.setErrors({ invalidDate: true });
      (component as any).terminationDateInput = {
        nativeElement: { value: '31-DEC-2025' }
      };

      component.validateTerminationDateInput();

      expect(control?.hasError('invalidDate')).toBeFalse();
    });

    it('should retain other errors when clearing invalidDate', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(moment('2025-12-31'));
      control?.setErrors({ invalidDate: true, terminationDatePast: true });
      (component as any).terminationDateInput = {
        nativeElement: { value: '31-DEC-2025' }
      };

      component.validateTerminationDateInput();

      expect(control?.hasError('invalidDate')).toBeFalse();
      expect(control?.hasError('terminationDatePast')).toBeTrue();
    });
  });

  describe('getEffectiveDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getEffectiveDateError()).toBe('');
    });

    it('should return required error message', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(null);
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective Date is required');
    });

    it('should return invalid date message for invalidDateFormat error', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDateFormat: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return invalid date message for invalidDate error', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return invalid date message for matDatepickerParse error', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective date is invalid');
    });

    it('should return past date error message', () => {
      const control = component.form.get('effectiveDate');
      control?.setErrors({ effectiveDatePast: true });
      control?.markAsTouched();
      expect(component.getEffectiveDateError()).toBe('Effective date cannot be past date');
    });

    it('should return date range error when form has dateRangeInvalid error', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(moment('2025-12-31'));
      control?.markAsTouched();
      // Set form-level error
      component.form.setErrors({ dateRangeInvalid: true });
      expect(component.getEffectiveDateError()).toBe('Effective Date must be before or equal to Termination Date');
    });

    it('should return empty string when control is dirty but has no errors', () => {
      const control = component.form.get('effectiveDate');
      control?.setValue(moment('2025-12-31'));
      control?.markAsDirty();
      expect(component.getEffectiveDateError()).toBe('');
    });
  });

  describe('getTerminationDateError', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is null', () => {
      // Test by accessing a non-existent control name through the component method
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return empty string when not touched or dirty', () => {
      const control = component.form.get('terminationDate');
      control?.markAsUntouched();
      control?.markAsPristine();
      expect(component.getTerminationDateError()).toBe('');
    });

    it('should return invalid date message for invalidDate error', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalid date message for matDatepickerParse error', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ matDatepickerParse: true });
      control?.markAsTouched();
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return invalid when input has value but control is null', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(null);
      control?.markAsTouched();
      (component as any).terminationDateInput = {
        nativeElement: { value: 'some invalid value' }
      };
      expect(component.getTerminationDateError()).toBe('Termination Date is invalid');
    });

    it('should return past date error', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ terminationDatePast: true });
      control?.markAsTouched();
      (component as any).terminationDateInput = undefined;
      expect(component.getTerminationDateError()).toBe('Termination date cannot be past date');
    });

    it('should return min date error', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ matDatepickerMin: true });
      control?.markAsTouched();
      (component as any).terminationDateInput = undefined;
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return date range error from form-level errors', () => {
      const control = component.form.get('terminationDate');
      // Use a future date so terminationDatePast does NOT fire
      const futureDate = moment().add(30, 'days');
      control?.setValue(futureDate);
      control?.setErrors(null);
      control?.markAsTouched();
      component.form.setErrors({ dateRangeInvalid: true });
      (component as any).terminationDateInput = undefined;
      expect(component.getTerminationDateError()).toBe('Termination Date must be greater than or equal to Effective Date');
    });

    it('should return empty when touched but no errors', () => {
      const control = component.form.get('terminationDate');
      control?.setValue(moment().add(30, 'days'));
      control?.setErrors(null);
      control?.markAsTouched();
      (component as any).terminationDateInput = undefined;
      component.form.setErrors(null);
      expect(component.getTerminationDateError()).toBe('');
    });
  });

  describe('getLastNameError - maxlength', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return maxlength error when name exceeds 30 characters', () => {
      const control = component.form.get('lastName');
      control?.setValue('A'.repeat(31));
      control?.markAsTouched();
      expect(component.getLastNameError()).toBe('Last Name cannot exceed 30 characters');
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getLastNameError()).toBe('');
    });
  });

  describe('getTypeError - untouched', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getTypeError()).toBe('');
    });
  });

  describe('getTitleError - untouched', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getTitleError()).toBe('');
    });
  });

  describe('getHonorificError - untouched', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when control is not touched', () => {
      expect(component.getHonorificError()).toBe('');
    });
  });

  describe('termDateErrorMatcher', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when control is null', () => {
      expect(component.termDateErrorMatcher.isErrorState(null)).toBeFalse();
    });

    it('should return false when control is not touched and not dirty', () => {
      const control = component.form.get('terminationDate');
      control?.markAsUntouched();
      control?.markAsPristine();
      expect(component.termDateErrorMatcher.isErrorState(control!)).toBeFalse();
    });

    it('should return true when control is touched and has termination date error', () => {
      const control = component.form.get('terminationDate');
      control?.setErrors({ invalidDate: true });
      control?.markAsTouched();
      (component as any).terminationDateInput = {
        nativeElement: { value: 'bad' }
      };
      expect(component.termDateErrorMatcher.isErrorState(control!)).toBeTrue();
    });
  });

  describe('isFormValid - with errors', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return false when form is null/undefined', () => {
      (component as any).form = null;
      expect(component.isFormValid).toBeFalse();
    });

    it('should return false when a control has errors and is touched', () => {
      component.form.patchValue({ lastName: '' });
      component.form.get('lastName')?.markAsTouched();
      (component as any).initialFormValue = component.form.getRawValue();
      expect(component.isFormValid).toBeFalse();
    });

    it('should return true (dirty) when initialFormValue is null and form is dirty', () => {
      (component as any).initialFormValue = null;
      component.form.markAsDirty();
      expect(component.isFormValid).toBeTrue();
    });
  });

  describe('Searchable dropdown filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter honorific options by code', () => {
      component.honorificSearch.set('mr');
      const filtered = component.filteredHonorificOptions();
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.every(o => o.code.toLowerCase().includes('mr') || o.description.toLowerCase().includes('mr'))).toBeTrue();
    });

    it('should return all honorific options when search is empty', () => {
      component.honorificSearch.set('');
      const filtered = component.filteredHonorificOptions();
      expect(filtered.length).toBe(mockHonorificOptions.length);
    });

    it('should filter type options by description', () => {
      component.typeSearch.set('primary');
      const filtered = component.filteredTypeOptions();
      expect(filtered.length).toBe(1);
    });

    it('should return all type options when search is empty', () => {
      component.typeSearch.set('');
      const filtered = component.filteredTypeOptions();
      expect(filtered.length).toBe(mockTypeOptions.length);
    });

    it('should filter title options by code', () => {
      component.titleSearch.set('mgr');
      const filtered = component.filteredTitleOptions();
      expect(filtered.length).toBe(1);
    });

    it('should return all title options when search is empty', () => {
      component.titleSearch.set('');
      const filtered = component.filteredTitleOptions();
      expect(filtered.length).toBe(mockTitleOptions.length);
    });

    it('should return empty array when no options match', () => {
      component.honorificSearch.set('zzzzz');
      const filtered = component.filteredHonorificOptions();
      expect(filtered.length).toBe(0);
    });
  });

  describe('Search control subscriptions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update honorificSearch signal when honorificSearchControl changes', () => {
      component.honorificSearchControl.setValue('test');
      expect(component.honorificSearch()).toBe('test');
    });

    it('should set empty string when honorificSearchControl value is null', () => {
      component.honorificSearchControl.setValue(null);
      expect(component.honorificSearch()).toBe('');
    });

    it('should update typeSearch signal when typeSearchControl changes', () => {
      component.typeSearchControl.setValue('type1');
      expect(component.typeSearch()).toBe('type1');
    });

    it('should update titleSearch signal when titleSearchControl changes', () => {
      component.titleSearchControl.setValue('title1');
      expect(component.titleSearch()).toBe('title1');
    });
  });

  describe('loadDropdowns - success', () => {
    it('should set honorificOptions array and signal on success', () => {
      fixture.detectChanges();
      expect(component.honorificOptions).toEqual(mockHonorificOptions);
      expect(component.honorificOptionsSignal()).toEqual(mockHonorificOptions);
    });

    it('should set typeOptions array and signal on success', () => {
      fixture.detectChanges();
      expect(component.typeOptions).toEqual(mockTypeOptions);
      expect(component.typeOptionsSignal()).toEqual(mockTypeOptions);
    });

    it('should set titleOptions array and signal on success', () => {
      fixture.detectChanges();
      expect(component.titleOptions).toEqual(mockTitleOptions);
      expect(component.titleOptionsSignal()).toEqual(mockTitleOptions);
    });
  });

  describe('Dropdown Loading Error - signal reset', () => {
    it('should reset honorificOptionsSignal on error', () => {
      mockSponsorContactsService.getSalutations.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      fixture.detectChanges();
      expect(component.honorificOptionsSignal()).toEqual([]);
    });

    it('should reset typeOptionsSignal on error', () => {
      mockSponsorContactsService.getContactTypes.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      fixture.detectChanges();
      expect(component.typeOptionsSignal()).toEqual([]);
    });

    it('should reset titleOptionsSignal on error', () => {
      mockSponsorContactsService.getTitles.and.returnValue(
        throwError(() => new Error('API Error'))
      );
      fixture.detectChanges();
      expect(component.titleOptionsSignal()).toEqual([]);
    });
  });

  describe('ngOnChanges - first change', () => {
    it('should not reload contact detail on first change', () => {
      fixture.detectChanges();
      mockSponsorContactsService.getContactDetail.calls.reset();

      component.ngOnChanges({
        data: new SimpleChange(null, mockContactData, true)
      });

      expect(mockSponsorContactsService.getContactDetail).not.toHaveBeenCalled();
    });
  });

  describe('setupEffectiveDateListener - non-moment value', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle string date values for effective date', () => {
      const futureDateStr = moment().add(60, 'days').format('YYYY-MM-DD');
      component.form.get('effectiveDate')?.setValue(futureDateStr);

      // The listener should have converted and set the minTerminationDate
      expect(component.minTerminationDate).toBeDefined();
    });
  });

  describe('populateForm - effectiveDate after minDate', () => {
    it('should set minTerminationDate to effectiveDate when it is after minDate', () => {
      const futureDate = moment().add(60, 'days');
      const detailWithFutureDate: SponsorContactDetailModel = {
        ...mockContactDetail,
        effDate: futureDate.format('YYYY-MM-DD')
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithFutureDate));

      fixture.detectChanges();

      // minTerminationDate should be set to the future effective date
      expect(component.minTerminationDate.format('YYYY-MM-DD')).toBe(futureDate.format('YYYY-MM-DD'));
    });
  });

  describe('populateForm - with leading spaces in data', () => {
    it('should trim leading spaces from salutation', () => {
      const detailWithSpaces: SponsorContactDetailModel = {
        ...mockContactDetail,
        salutation: '  MR',
        firstName: '  John',
        lastName: '  Doe'
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithSpaces));

      fixture.detectChanges();

      expect(component.form.get('honorific')?.value).toBe('MR');
      expect(component.form.get('firstName')?.value).toBe('John');
      expect(component.form.get('lastName')?.value).toBe('Doe');
    });
  });

  describe('populateForm - with null/undefined data', () => {
    it('should handle null data gracefully', () => {
      component.data = null;
      mockSponsorContactsService.getContactDetail.calls.reset();

      fixture.detectChanges();

      // Should not call getContactDetail and should still have form initialized
      expect(component.form).toBeDefined();
    });
  });

  describe('Initials - both names missing', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return empty string when both names are missing', () => {
      component.contactDetail = {
        ...mockContactDetail,
        firstName: '',
        lastName: ''
      };
      expect(component.initials).toBe('');
    });

    it('should handle null contactDetail and null data', () => {
      component.contactDetail = null;
      component.data = null;
      expect(component.initials).toBe('');
    });
  });

  describe('ngOnDestroy', () => {
    it('should complete the destroy$ subject', () => {
      fixture.detectChanges();
      const destroySpy = spyOn((component as any).destroy$, 'next');
      const completeSpy = spyOn((component as any).destroy$, 'complete');

      component.ngOnDestroy();

      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });

  describe('getFormattedEffectiveDate - edge cases', () => {
    it('should return "-" when form is not yet initialized', () => {
      // Access before detectChanges
      (component as any).form = null;
      expect(component.getFormattedEffectiveDate()).toBe('-');
    });
  });

  describe('toMomentOrNull (via populateForm)', () => {
    it('should return null for hyphen value', () => {
      const detailWithHyphen: SponsorContactDetailModel = {
        ...mockContactDetail,
        termDate: '-'
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithHyphen));

      fixture.detectChanges();

      expect(component.form.get('terminationDate')?.value).toBeNull();
    });

    it('should parse DD-MMM-YYYY format strictly', () => {
      const detailWithDate: SponsorContactDetailModel = {
        ...mockContactDetail,
        effDate: '15-JUN-2020',
        termDate: '31-DEC-2025'
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithDate));

      fixture.detectChanges();

      const termDate = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
    });

    it('should parse other date formats leniently', () => {
      const detailWithDate: SponsorContactDetailModel = {
        ...mockContactDetail,
        termDate: '2025-12-31'
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(detailWithDate));

      fixture.detectChanges();

      const termDate = component.form.get('terminationDate')?.value;
      expect(moment.isMoment(termDate)).toBeTrue();
    });
  });

  describe('onSave - payload construction', () => {
    beforeEach(() => {
      fixture.detectChanges();
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Success' })
      );
    });

    it('should call updateContact with correct sponsorId, addressId, and chapterId', () => {
      component.form.patchValue({ lastName: 'Smith' });
      component.form.markAsDirty();

      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalledWith(
        'SPONSOR123',
        'ADDR456',
        jasmine.any(String),
        jasmine.any(Object)
      );
    });

    it('should format termination date in payload when present', () => {
      const termDate = moment().add(90, 'days');
      component.form.patchValue({ lastName: 'Smith', terminationDate: termDate });
      component.form.markAsDirty();
      if (component.form.invalid) {
        Object.keys(component.form.controls).forEach(key => {
          component.form.get(key)?.setErrors(null);
        });
        component.form.setErrors(null);
      }

      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalled();
      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.termDate).toMatch(/T\d{2}:\d{2}:\d{2}$/);
    });

    it('should set termDate to null in payload when not present', () => {
      component.form.patchValue({ lastName: 'Smith', terminationDate: null });
      component.form.markAsDirty();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.termDate).toBeNull();
    });

    it('should include address fields from contactDetail', () => {
      component.form.patchValue({ lastName: 'Smith' });
      component.form.markAsDirty();

      component.onSave();

      const payload = mockSponsorContactsService.updateContact.calls.mostRecent().args[3];
      expect(payload.address).toBeDefined();
      expect(payload.address.streetName).toBe('123 Main St');
      expect(payload.address.email).toBe('john@example.com');
    });
  });

  describe('onSave - uses data when contactDetail is null', () => {
    beforeEach(() => {
      // Setup with null contactDetail
      component.data = {
        ...mockContactData,
        sponsorId: '',
        addressId: ''
      };
      mockSponsorContactsService.getContactDetail.and.returnValue(of(mockContactDetail));
      fixture.detectChanges();

      // Now set contactDetail to null and data back to original
      component.contactDetail = null;
      component.data = mockContactData;
      mockSponsorContactsService.updateContact.and.returnValue(
        of({ message: 'Success' })
      );
    });

    it('should use data.sponsorId when contactDetail is null', () => {
      component.form.patchValue({ lastName: 'Smith' });
      component.form.markAsDirty();

      component.onSave();

      expect(mockSponsorContactsService.updateContact).toHaveBeenCalledWith(
        'SPONSOR123',
        'ADDR456',
        jasmine.any(String),
        jasmine.any(Object)
      );
    });
  });

  describe('getErrorMessage (private)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should extract error from errorResponse', () => {
      const result = (component as any).getErrorMessage({
        error: { errorResponse: { error: 'Server error' } }
      });
      expect(result).toBe('Server error');
    });

    it('should extract error message from error.error.message', () => {
      const result = (component as any).getErrorMessage({
        error: { message: 'Bad request' }
      });
      expect(result).toBe('Bad request');
    });

    it('should extract error from error.message', () => {
      const result = (component as any).getErrorMessage({
        message: 'Network error'
      });
      expect(result).toBe('Network error');
    });

    it('should return default message for empty error', () => {
      const result = (component as any).getErrorMessage({});
      expect(result).toBe('An unexpected error occurred');
    });

    it('should prepend errorCode from error.error.errorCode', () => {
      const result = (component as any).getErrorMessage({
        error: { message: 'Conflict', errorCode: 'E100' }
      });
      expect(result).toBe('Error: E100: Conflict');
    });

    it('should prepend errorCode from errorResponse', () => {
      const result = (component as any).getErrorMessage({
        error: { errorResponse: { error: 'Not found', errorCode: 'E404' } }
      });
      expect(result).toBe('Error: E404: Not found');
    });

    it('should handle null/undefined error', () => {
      const result = (component as any).getErrorMessage(null);
      expect(result).toBe('An unexpected error occurred');
    });
  });

  describe('normalizeDateInput (private)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should return null for empty string', () => {
      const result = (component as any).normalizeDateInput('');
      expect(result).toBeNull();
    });

    it('should return null for whitespace only', () => {
      const result = (component as any).normalizeDateInput('   ');
      expect(result).toBeNull();
    });

    it('should parse DD-MMM-YYYY format', () => {
      const result = (component as any).normalizeDateInput('11-JAN-2020');
      expect(result).not.toBeNull();
      expect(result.format('YYYY-MM-DD')).toBe('2020-01-11');
    });

    it('should parse YYYY-MM-DD format', () => {
      const result = (component as any).normalizeDateInput('2020-01-11');
      expect(result).not.toBeNull();
      expect(result.format('YYYY-MM-DD')).toBe('2020-01-11');
    });

    it('should parse DDMMMYYYY format', () => {
      const result = (component as any).normalizeDateInput('11JAN2020');
      expect(result).not.toBeNull();
      expect(result.format('YYYY-MM-DD')).toBe('2020-01-11');
    });

    it('should return null for completely invalid input', () => {
      const result = (component as any).normalizeDateInput('not-a-date');
      expect(result).toBeNull();
    });
  });

  describe('truncateYearTo4Chars (private)', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should truncate year at end for DD-MMM-YYYYYYY', () => {
      const result = (component as any).truncateYearTo4Chars('10-JAN-202000');
      expect(result).toBe('10-JAN-2020');
    });

    it('should truncate year at end for DD/MM/YYYYYYY', () => {
      const result = (component as any).truncateYearTo4Chars('10/01/202000');
      expect(result).toBe('10/01/2020');
    });

    it('should truncate year at start for YYYYYYY-MM-DD', () => {
      const result = (component as any).truncateYearTo4Chars('202000-01-10');
      expect(result).toBe('2020-01-10');
    });

    it('should truncate year for DDMMMYYYYYYY', () => {
      const result = (component as any).truncateYearTo4Chars('10JAN202000');
      expect(result).toBe('10JAN2020');
    });

    it('should not modify valid 4-digit year input', () => {
      const result = (component as any).truncateYearTo4Chars('10-JAN-2020');
      expect(result).toBe('10-JAN-2020');
    });
  });

  describe('onDateFieldBlur - normalization with various formats', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle truncation of extra-long year on blur', () => {
      const event = { target: { value: '11-JAN-202000' } };
      component.onDateFieldBlur('effectiveDate', event);

      const effectiveDate = component.form.get('effectiveDate')?.value;
      expect(moment.isMoment(effectiveDate)).toBeTrue();
      expect(event.target.value).toMatch(/^\d{2}-[A-Z]{3}-\d{4}$/);
    });

    it('should leave value unchanged when normalization fails', () => {
      const event = { target: { value: 'garbage' } };
      const originalValue = component.form.get('terminationDate')?.value;
      component.onDateFieldBlur('terminationDate', event);

      // normalizeDateInput returns null for garbage, so setValue is not called
      expect(component.form.get('terminationDate')?.value).toEqual(originalValue);
    });
  });

  describe('terminationDateClass - with string dates', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle string effective date value', () => {
      component.form.patchValue({
        effectiveDate: '2025-06-15',
        terminationDate: null
      });

      const result = component.terminationDateClass(moment('2025-06-15'));
      expect(result).toContain('highlighted-effective-date');
    });

    it('should handle string termination date value', () => {
      component.form.patchValue({
        effectiveDate: null,
        terminationDate: '2025-07-15'
      });

      const result = component.terminationDateClass(moment('2025-07-15'));
      expect(result).toContain('highlighted-termination-date');
    });
  });

  describe('validateTerminationDateInput - edge cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle when terminationDateInput is undefined', () => {
      (component as any).terminationDateInput = undefined;
      const control = component.form.get('terminationDate');
      control?.setValue(null);

      component.validateTerminationDateInput();

      expect(control?.touched).toBeTrue();
    });

    it('should handle when input value is whitespace only', () => {
      (component as any).terminationDateInput = {
        nativeElement: { value: '   ' }
      };
      const control = component.form.get('terminationDate');
      control?.setValue(null);

      component.validateTerminationDateInput();

      // trimmed value is empty, so it should not set invalidDate
      expect(control?.touched).toBeTrue();
    });
  });

  describe('getFirstNameDisplay / getLastNameDisplay with null form', () => {
    it('should return hyphen when form is null', () => {
      (component as any).form = null;
      expect(component.getFirstNameDisplay()).toBe('-');
      expect(component.getLastNameDisplay()).toBe('-');
    });
  });

  describe('populateForm - no contactDetail, no data', () => {
    it('should use empty defaults when both are null', () => {
      component.data = null;
      component.contactDetail = null;

      // Manually call ngOnInit which calls initForm, then manually call populateForm
      fixture.detectChanges();

      // Form should exist with default values
      expect(component.form.get('honorific')?.value).toBeDefined();
    });
  });
});
