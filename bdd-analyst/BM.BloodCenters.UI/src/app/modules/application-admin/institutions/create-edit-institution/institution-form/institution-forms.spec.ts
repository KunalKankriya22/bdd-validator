import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import moment from 'moment';
import { InstitutionForms } from './institution-forms';
import { buildInstitutionForm } from '../../forms-factory/institution-form.factory';
import { TranslateModule } from '@ngx-translate/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { FormControl } from '@angular/forms';
import { addressLineValidator, addressCompletenessValidator } from '../../validators/institution.validators';
import { CodabarScheme } from '@shared/enums/codabar-scheme.enum';
import { InstitutionService } from '../../service/institution.service';
import { of } from 'rxjs';

describe('InstitutionForms', () => {
  let institutionServiceSpy: any;
  let component: InstitutionForms;
  let fixture: ComponentFixture<InstitutionForms>;
  let fb: FormBuilder;
  let institutionService: jasmine.SpyObj<InstitutionService>;

  beforeEach(() => {

    institutionServiceSpy = jasmine.createSpyObj('InstitutionService', [
      'getStatesLookup',
      'getCountriesLookup'
    ]);
    institutionServiceSpy.getStatesLookup.and.returnValue(of([]));
    institutionServiceSpy.getCountriesLookup.and.returnValue(of([]));



      TestBed.configureTestingModule({
      imports: [
        InstitutionForms,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatCardModule,
        MatIconModule,
        MatSelectModule,
      ],
      providers: [
        provideHttpClient(),
        { provide: InstitutionService, useValue: institutionServiceSpy }
      ]
    });


    


      institutionServiceSpy.getStatesLookup.calls.reset();


      institutionServiceSpy.getCountriesLookup.calls.reset();


      institutionServiceSpy.getStatesLookup.and.returnValue(of([]));


      institutionServiceSpy.getCountriesLookup.and.returnValue(of([]));


    institutionService = TestBed.inject(InstitutionService) as jasmine.SpyObj<InstitutionService>;
    fixture = TestBed.createComponent(InstitutionForms);
    component = fixture.componentInstance;
    fb = TestBed.inject(FormBuilder);
    component.form = buildInstitutionForm(fb);
    fixture.detectChanges();


    });

  describe('Component Initialization', () => {


    it('should initialize with default signal values', () => {
      expect(component.isDragging()).toBe(false);
      expect(component.selectedFile()).toBeNull();
      expect(component.uploadProgress()).toBe(0);
      expect(component.uploading()).toBe(false);
      expect(component.uploadCompleted()).toBe(false);
      expect(component.fileUrl()).toBeNull();
      expect(component.uploadError()).toBeNull();
      expect(component.fileSizeMB()).toBeNull();
    });


    it('should initialize matcher with isSubmitted function', () => {
      expect(component.matcher).toBeDefined();
      expect(component.isSubmitted).toBe(false);
    });

    it('should have UI and VALIDATION constants defined', () => {
      expect(component.UI).toBeDefined();
      expect(component.VALIDATION).toBeDefined();
    });
  });

  describe('Form Structure', () => {
    it('should have all root level form controls', () => {
      expect(component.form.get('institutionId')).toBeTruthy();
      expect(component.form.get('institutionName')).toBeTruthy();
      expect(component.form.get('contractPrefix')).toBeTruthy();
      expect(component.form.get('facilityShortName')).toBeTruthy();
      expect(component.form.get('printHeader')).toBeTruthy();
      expect(component.form.get('systemName')).toBeTruthy();
    });

    it('should have registrationInfo form group with controls', () => {
      const registrationInfo = component.form.get('registrationInfo');
      expect(registrationInfo).toBeTruthy();
      expect(registrationInfo?.get('registrationNumber')).toBeTruthy();
      expect(registrationInfo?.get('licenseNumber')).toBeTruthy();
      expect(registrationInfo?.get('codabarScheme')).toBeTruthy();
      expect(registrationInfo?.get('effectiveDate')).toBeTruthy();
    });

    it('should have contactInfo form group with controls', () => {
      const contactInfo = component.form.get('contactInfo');
      expect(contactInfo).toBeTruthy();
      expect(contactInfo?.get('isInternational')).toBeTruthy();
      expect(contactInfo?.get('addr_1')).toBeTruthy();
      expect(contactInfo?.get('addr_2')).toBeTruthy();
      expect(contactInfo?.get('addr_3')).toBeTruthy();
      expect(contactInfo?.get('city')).toBeTruthy();
      expect(contactInfo?.get('state')).toBeTruthy();
      expect(contactInfo?.get('zipCode')).toBeTruthy();
      expect(contactInfo?.get('country')).toBeTruthy();
      expect(contactInfo?.get('phoneNumber')).toBeTruthy();
      expect(contactInfo?.get('fax')).toBeTruthy();
      expect(contactInfo?.get('internationalPhoneNumber')).toBeTruthy();
      expect(contactInfo?.get('internationalFax')).toBeTruthy();
    });



    it('should initialize country field with default value "US"', () => {
      const countryControl = component.form.get('contactInfo.country');
      expect(countryControl?.value).toBe('US');
    });

    it('should initialize isInternational as false', () => {
      const isInternationalControl = component.form.get('contactInfo.isInternational');
      expect(isInternationalControl?.value).toBe(false);
    });
  });

  describe('Form Validation - Institution Details', () => {
    it('should validate institutionName as required', () => {
      const control = component.form.get('institutionName');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate institutionName max length', () => {
      const control = component.form.get('institutionName');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxLength')).toBe(true);
    });

    it('should validate institutionName pipe rule for >40 characters', () => {
      const control = component.form.get('institutionName');
      control?.setValue('a'.repeat(41));
      expect(control?.hasError('pipeRule')).toBe(true);
    });

    it('should accept institutionName with pipe for >40 characters', () => {
      const control = component.form.get('institutionName');
      control?.setValue('a'.repeat(20) + '|' + 'a'.repeat(20));
      expect(control?.valid).toBe(true);
    });

    it('should validate contractPrefix as required', () => {
      const control = component.form.get('contractPrefix');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate contractPrefix format (3 alphabetic chars)', () => {
      const control = component.form.get('contractPrefix');
      control?.setValue('AB');
      expect(control?.hasError('invalidContractPrefix')).toBe(true);

      control?.setValue('ABC1');
      expect(control?.hasError('invalidContractPrefix')).toBe(true);

      control?.setValue('123');
      expect(control?.hasError('invalidContractPrefix')).toBe(true);

      control?.setValue('ABC');
      expect(control?.valid).toBe(true);
    });

    it('should validate facilityShortName as required', () => {
      const control = component.form.get('facilityShortName');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate facilityShortName max length', () => {
      const control = component.form.get('facilityShortName');
      control?.setValue('a'.repeat(81));
      expect(control?.hasError('maxLength')).toBe(true);
    });

    it('should validate printHeader as required', () => {
      const control = component.form.get('printHeader');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate printHeader max length', () => {
      const control = component.form.get('printHeader');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxLength')).toBe(true);
    });

    it('should validate systemName as required', () => {
      const control = component.form.get('systemName');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate systemName max length', () => {
      const control = component.form.get('systemName');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBe(true);
    });
  });

  describe('Form Validation - Registration Info', () => {
    it('should fail when registration number exceeds 30 characters', () => {
      const control = component.form.get('registrationInfo.registrationNumber');
      control?.setValue('1' + 'A'.repeat(30));

      expect(control?.hasError('maxlength')).toBe(true);
    });


    it('should validate licenseNumber max length', () => {
      const control = component.form.get('registrationInfo.licenseNumber');
      control?.setValue('a'.repeat(31));
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should validate codabarScheme as required', () => {
      const control = component.form.get('registrationInfo.codabarScheme');
      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);
    });

    it('should accept valid codabarScheme enum values', () => {
      const control = component.form.get('registrationInfo.codabarScheme');

      control?.setValue(CodabarScheme.ALPHANUMERIC);
      expect(control?.errors).toBeNull();

      control?.setValue(CodabarScheme.NUMERIC);
      expect(control?.errors).toBeNull();

      control?.setValue(CodabarScheme.CODE128);
      expect(control?.errors).toBeNull();
    });


    it('should validate effectiveDate as required', () => {
      const control = component.form.get('registrationInfo.effectiveDate');
      control?.setValue(null);
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate effectiveDate not in past', () => {
      component.mode = 'create';
      component.ngOnInit();
      fixture.detectChanges();

      const control = component.form.get('registrationInfo.effectiveDate');
      const pastDate = moment().subtract(1000, 'days');

      control?.setValue(pastDate);
      control?.markAsDirty();
      control?.markAsTouched();
      control?.updateValueAndValidity();
      fixture.detectChanges();

      expect(control?.hasError('dateInPast')).toBe(true);
    });

    it('should accept future effectiveDate', () => {
      const control = component.form.get('registrationInfo.effectiveDate');
      const tomorrow = moment().add(1, 'days');

      control?.setValue(tomorrow);
      control?.markAsDirty();
      control?.updateValueAndValidity();
      expect(control?.valid).toBe(true);
    });
  });

  describe('Form Validation - Contact Info', () => {
    it('should validate addr_1 as required', () => {
      const control = component.form.get('contactInfo.addr_1');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate addr_1 max length', () => {
      const control = component.form.get('contactInfo.addr_1');
      control?.setValue('a'.repeat(51));
      expect(control?.hasError('maxlength')).toBe(true);
    });



    it('should validate city as required', () => {
      const control = component.form.get('contactInfo.city');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });



    it('should validate city max length', () => {
      const control = component.form.get('contactInfo.city');
      control?.setValue('a'.repeat(76));
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should validate state as required when not international', () => {
      component.form.get('contactInfo.isInternational')?.setValue(false);
      const control = component.form.get('contactInfo.state');

      control?.setValue('');
      control?.updateValueAndValidity();
      expect(control?.hasError('required')).toBe(true);
    });

    it('should not require state when international', () => {
      component.form.get('contactInfo.isInternational')?.setValue(true);
      const control = component.form.get('contactInfo.state');

      control?.setValue('');
      control?.updateValueAndValidity();
      expect(control?.hasError('required')).toBe(false);
    });

    it('should validate state length to be exactly 2 characters', () => {
      component.form.get('contactInfo.isInternational')?.setValue(false);
      const control = component.form.get('contactInfo.state');

      control?.setValue('C');
      control?.updateValueAndValidity();
      expect(control?.hasError('invalidLength')).toBe(true);

      control?.setValue('CAL');
      control?.updateValueAndValidity();
      expect(control?.hasError('invalidLength')).toBe(true);

      control?.setValue('CA');
      control?.updateValueAndValidity();
      expect(control?.valid).toBe(true);
    });

    it('should validate zipCode as required', () => {
      const control = component.form.get('contactInfo.zipCode');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });

    it('should validate zipCode max length for international addresses', () => {
      // Set to international mode to test max length
      const isInternational = component.form.get('contactInfo.isInternational');
      isInternational?.setValue(true);

      const control = component.form.get('contactInfo.zipCode');
      control?.setValue('A'.repeat(10)); // Exceeds max length of 9
      expect(control?.hasError('maxLength')).toBe(true);
    });

    it('should validate zipCode as exactly 5 digits for US addresses', () => {
      // Default is US (isInternational = false)
      const control = component.form.get('contactInfo.zipCode');

      control?.setValue('1234'); // Less than 5 digits
      expect(control?.hasError('invalidUSZipCode')).toBe(true);

      control?.setValue('12345'); // Exactly 5 digits
      expect(control?.valid).toBe(true);

      control?.setValue('123456'); // More than 5 digits
      expect(control?.hasError('invalidUSZipCode')).toBe(true);
    });

    it('should validate country as required', () => {
      const control = component.form.get('contactInfo.country');
      control?.setValue('');
      expect(control?.hasError('required')).toBe(true);
    });



    it('should validate country max length', () => {
      const control = component.form.get('contactInfo.country');
      control?.setValue('a'.repeat(16));
      expect(control?.hasError('maxlength')).toBe(true);
    });





    it('should validate phoneNumber accepts formatted input', () => {
      const control = component.form.get('contactInfo.phoneNumber');

      control?.setValue('123-456-7890');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);

      control?.setValue('1234567890');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);

      control?.setValue('123-ABC-7890');
      expect(control?.hasError('numbersOnly')).toBe(true);

      control?.setValue('123#456#7890');
      expect(control?.hasError('numbersOnly')).toBe(true);
    });

    it('should validate phoneNumber exact length (10 digits)', () => {
      const control = component.form.get('contactInfo.phoneNumber');

      control?.setValue('12345678901');
      expect(control?.hasError('exactLength')).toBe(true);
      expect(control?.errors?.['exactLength']?.requiredLength).toBe(10);
      expect(control?.errors?.['exactLength']?.actualLength).toBe(11);

      control?.setValue('123456789');
      expect(control?.hasError('exactLength')).toBe(true);
      expect(control?.errors?.['exactLength']?.actualLength).toBe(9);

      control?.setValue('1234567890');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);

      control?.setValue('123-456-7890');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);
    });

    it('should validate fax accepts formatted input', () => {
      const control = component.form.get('contactInfo.fax');

      // Valid: 10 digits with formatting
      control?.setValue('123-456-7890');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);

      // Valid: 10 digits without formatting
      control?.setValue('1234567890');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);

      // Invalid: less than 10 digits
      control?.setValue('12345');
      expect(control?.hasError('exactLength')).toBe(true);
      expect(control?.errors?.['exactLength']?.actualLength).toBe(5);

      // Invalid: 9 digits with formatting
      control?.setValue('123-456-789');
      expect(control?.hasError('exactLength')).toBe(true);
      expect(control?.errors?.['exactLength']?.actualLength).toBe(9);

      // Invalid: contains letters
      control?.setValue('123-ABC-7890');
      expect(control?.hasError('numbersOnly')).toBe(true);

      // Invalid: more than 10 digits
      control?.setValue('12345678901');
      expect(control?.hasError('exactLength')).toBe(true);
      expect(control?.errors?.['exactLength']?.actualLength).toBe(11);

      // Invalid: more than 10 digits with formatting
      control?.setValue('123-456-78901');
      expect(control?.hasError('exactLength')).toBe(true);
      expect(control?.errors?.['exactLength']?.actualLength).toBe(11);

      // Valid: empty value
      control?.setValue('');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);

      // Valid: null value
      control?.setValue(null);
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);
    });

    it('should validate internationalPhoneNumber allows special characters', () => {
      const control = component.form.get('contactInfo.internationalPhoneNumber');

      control?.setValue('+15551234567');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);
    });

    it('should validate internationalPhoneNumber rejects invalid characters', () => {
      const control = component.form.get('contactInfo.internationalPhoneNumber');
      control?.setValue('+1#555#1234567');
      expect(control?.hasError('invalidCharacters')).toBe(true);
    });

    it('should validate internationalPhoneNumber max length', () => {
      const control = component.form.get('contactInfo.internationalPhoneNumber');
      control?.setValue('+123456789012345678');
      expect(control?.hasError('maxlength')).toBe(true);
    });

    it('should validate internationalFax allows special characters', () => {
      const control = component.form.get('contactInfo.internationalFax');

      control?.setValue('+15551234567');
      expect(control?.errors).toBeNull();
      expect(control?.valid).toBe(true);
    });

    it('should validate internationalFax max length', () => {
      const control = component.form.get('contactInfo.internationalFax');
      control?.setValue('+123456789012345678');
      expect(control?.hasError('maxlength')).toBe(true);
    });
  });

  describe('User Interactions', () => {
    it('should format phone number on blur', () => {
      const control = component.form.get('contactInfo.phoneNumber');
      control?.setValue('1234567890');

      const event = new FocusEvent('blur');
      component.formatPhoneNumber(event, 'contactInfo.phoneNumber');

      expect(control?.value).toBe('123-456-7890');
    });

    it('should format fax number on blur', () => {
      const control = component.form.get('contactInfo.fax');
      control?.setValue('9876543210');

      const event = new FocusEvent('blur');
      component.formatPhoneNumber(event, 'contactInfo.fax');

      expect(control?.value).toBe('987-654-3210');
    });

    it('should not format phone number with non-10 digits', () => {
      const control = component.form.get('contactInfo.phoneNumber');
      control?.setValue('12345');

      const event = new FocusEvent('blur');
      component.formatPhoneNumber(event, 'contactInfo.phoneNumber');

      expect(control?.value).toBe('12345');
    });

    it('should strip spaces from international phone on input', () => {
      const control = component.form.get('contactInfo.internationalPhoneNumber');
      const input = document.createElement('input');
      input.value = '+44 123 456 7890';

      const event = { target: input } as any;
      component.onInternationalPhoneFaxInput(event, 'contactInfo.internationalPhoneNumber');

      expect(input.value).toBe('+441234567890');
    });

    it('should restrict phone input to 10 digits', () => {
      const control = component.form.get('contactInfo.phoneNumber');
      const input = document.createElement('input');
      input.value = '12345678901';

      const event = { target: input } as any;
      component.onPhoneOrFaxInput(event, 'contactInfo.phoneNumber');

      expect(input.value).toBe('1234567890');
    });

    it('should remove non-digits from phone input', () => {
      const control = component.form.get('contactInfo.phoneNumber');
      const input = document.createElement('input');
      input.value = '123abc456def7890';

      const event = { target: input } as any;
      component.onPhoneOrFaxInput(event, 'contactInfo.phoneNumber');

      expect(input.value).toBe('1234567890');
    });

    it('should restrict alphanumeric space input', () => {
      const control = component.form.get('systemName');
      const input = document.createElement('input');
      input.value = 'System@Name#123';

      const event = { target: input } as any;
      component.onAlphanumericSpaceInput(event, 'systemName');

      expect(input.value).toBe('SystemName123');
    });

    it('should remove leading spaces from alphanumeric input', () => {
      const control = component.form.get('systemName');
      const input = document.createElement('input');
      input.value = '   SystemName';

      const event = { target: input } as any;
      component.onAlphanumericSpaceInput(event, 'systemName');

      expect(input.value).toBe('SystemName');
    });

    it('should restrict institution name to alphanumeric, spaces, and pipe', () => {
      const control = component.form.get('institutionName');
      const input = document.createElement('input');
      input.value = 'Test@Institution#Name|123';

      const event = { target: input } as any;
      component.onInstitutionNameInput(event);

      expect(input.value).toBe('TestInstitutionName|123');
    });

    it('should restrict postal code input to digits only for US addresses', () => {
      // Default is US (isInternational = false)
      const control = component.form.get('contactInfo.zipCode');
      const input = document.createElement('input');
      input.value = '12345ABC@-';

      const event = { target: input } as any;
      component.onPostalCodeInput(event);

      expect(input.value).toBe('12345'); // Only digits allowed
    });

    it('should allow alphanumeric with spaces and special characters for international postal codes', () => {
      // Set to international mode
      component.form.get('contactInfo.isInternational')?.setValue(true);

      const control = component.form.get('contactInfo.zipCode');
      const input = document.createElement('input');
      input.value = 'A1-2B/3#4';

      const event = { target: input } as any;
      component.onPostalCodeInput(event);

      // Alphanumeric, spaces, hyphens, periods, slashes, commas, hashtags, and plus signs allowed
      expect(input.value).toBe('A1-2B/3#4');
    });

    it('should remove invalid special characters from international postal codes', () => {
      // Set to international mode
      component.form.get('contactInfo.isInternational')?.setValue(true);

      const control = component.form.get('contactInfo.zipCode');
      const input = document.createElement('input');
      input.value = 'M5H 2N2@$%&*()';

      const event = { target: input } as any;
      component.onPostalCodeInput(event);

      // Invalid special chars (@$%&*()) should be removed
      expect(input.value).toBe('M5H 2N2');
    });

    it('should restrict alphabetic space input', () => {
      const control = component.form.get('contactInfo.city');
      const input = document.createElement('input');
      input.value = 'Dallas123';

      const event = { target: input } as any;
      component.onAlphabeticSpaceInput(event, 'contactInfo.city');

      expect(input.value).toBe('Dallas');
    });

    it('should remove leading spaces from alphabetic input', () => {
      const control = component.form.get('contactInfo.city');
      const input = document.createElement('input');
      input.value = '   Dallas';

      const event = { target: input } as any;
      component.onAlphabeticSpaceInput(event, 'contactInfo.city');

      expect(input.value).toBe('Dallas');
    });

    it('should trigger address validation on institution name blur', () => {
      const contactInfoGroup = component.form.get('contactInfo') as FormGroup;

      // Fill partial address
      contactInfoGroup.patchValue({
        addr_1: '123 Main St',
        city: '',
        zipCode: '75001',
        country: 'USA',
        state: 'TX'
      });

      component.onInstitutionNameBlur();

      expect(contactInfoGroup.hasError('incompleteAddress')).toBe(true);
    });

    it('should mark address fields as touched when incomplete', () => {
      const contactInfoGroup = component.form.get('contactInfo') as FormGroup;

      contactInfoGroup.patchValue({
        addr_1: '123 Main St',
        city: '',
        zipCode: '',
        country: ''
      });

      component.onInstitutionNameBlur();

      expect(contactInfoGroup.get('city')?.touched).toBe(true);
      expect(contactInfoGroup.get('zipCode')?.touched).toBe(true);
      expect(contactInfoGroup.get('country')?.touched).toBe(true);
    });
  });

  describe('Character Counter Methods', () => {
    it('should return correct character count for institution name', () => {
      component.form.get('institutionName')?.setValue('Test');
      expect(component.getInstitutionNameCharCount()).toBe('characters remaining: 46');
    });

    it('should show institution name counter when value exists', () => {
      component.form.get('institutionName')?.setValue('Test');
      expect(component.showInstitutionNameCounter()).toBe(true);
    });

    it('should not show institution name counter when empty', () => {
      component.form.get('institutionName')?.setValue('');
      expect(component.showInstitutionNameCounter()).toBe(false);
    });

    it('should return correct character count for system name', () => {
      component.form.get('systemName')?.setValue('Blood Centers');
      expect(component.getSystemNameCharCount()).toBe('characters remaining: 37');
    });

    it('should show system name counter when value exists', () => {
      component.form.get('systemName')?.setValue('Blood Centers');
      expect(component.showSystemNameCounter()).toBe(true);
    });

    it('should return correct character count for print header', () => {
      component.form.get('printHeader')?.setValue('Header');
      expect(component.getPrintHeaderCharCount()).toBe('characters remaining: 44');
    });

    it('should show print header counter when value exists', () => {
      component.form.get('printHeader')?.setValue('Header');
      expect(component.showPrintHeaderCounter()).toBe(true);
    });

    it('should return correct character count for address line 1', () => {
      component.form.get('contactInfo.addr_1')?.setValue('123 Main Street');
      expect(component.getAddr1CharCount()).toBe('characters remaining: 35');
    });

    it('should show address line 1 counter when value exists', () => {
      component.form.get('contactInfo.addr_1')?.setValue('123 Main Street');
      expect(component.showAddr1Counter()).toBe(true);
    });

    it('should return correct character count for address line 2', () => {
      component.form.get('contactInfo.addr_2')?.setValue('Suite 100');
      expect(component.getAddr2CharCount()).toBe('characters remaining: 41');
    });

    it('should return correct character count for address line 3', () => {
      component.form.get('contactInfo.addr_3')?.setValue('Floor 3');
      expect(component.getAddr3CharCount()).toBe('characters remaining: 43');
    });
  });

  describe('File Upload Functionality', () => {
    it('should start upload with valid file', () => {
      const file = new File(['test'], 'logo.png', { type: 'image/png' });
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false
      });

      const event = { target: input } as any;
      component.onLogoSelected(event);

      expect(component.selectedFile()).toBe(file);
    });

    it('should reject invalid file type', () => {
      const file = new File(['test'], 'doc.pdf', { type: 'application/pdf' });
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [file],
        writable: false
      });

      const event = { target: input } as any;
      component.onLogoSelected(event);

      expect(component.uploadError()).toBe('Invalid file type. Only JPG, JPEG, PNG, GIF, and WEBP are allowed.');
    });

    it('should reject file exceeding size limit', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', {
        value: [largeFile],
        writable: false
      });

      const event = { target: input } as any;
      component.onLogoSelected(event);

      expect(component.uploadError()).toContain('File size is too large');
    });

    it('should handle drag and drop', () => {
      const file = new File(['test'], 'logo.png', { type: 'image/png' });
      const dataTransfer = {
        files: [file]
      };

      const event = {
        preventDefault: jasmine.createSpy('preventDefault'),
        dataTransfer
      } as any;

      component.onDrop(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.isDragging()).toBe(false);
    });

    it('should set dragging state on drag over', () => {
      const event = {
        preventDefault: jasmine.createSpy('preventDefault')
      } as any;

      component.onDragOver(event);

      expect(component.isDragging()).toBe(true);
      expect(event.preventDefault).toHaveBeenCalled();
    });



    it('should remove file and reset state', () => {
      component.selectedFile.set(new File(['test'], 'logo.png', { type: 'image/png' }));
      component.uploadProgress.set(100);
      component.uploadCompleted.set(true);
      component.fileUrl.set('blob:test');

      component.removeFile();

      expect(component.selectedFile()).toBeNull();
      expect(component.uploadProgress()).toBe(0);
      expect(component.uploadCompleted()).toBe(false);
      expect(component.fileUrl()).toBeNull();
    });


  });
  describe('Mode-specific Behavior', () => {
    it('should set minEffectiveDate to today in CREATE mode', () => {
      component.mode = 'create';
      component.ngOnInit();

      expect(component.minEffectiveDate).not.toBeNull();
    });



    it('should load states and countries lookups on init', () => {
      component.ngOnInit();

      expect(institutionService.getStatesLookup).toHaveBeenCalled();
      expect(institutionService.getCountriesLookup).toHaveBeenCalled();
    });
  });
});

describe('addressLineValidator', () => {

  describe('when field is required', () => {
    const validator = addressLineValidator(true);

    it('should return required error when value is empty', () => {
      const control = new FormControl('');
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return required error when value is whitespace only', () => {
      const control = new FormControl('   ');
      expect(validator(control)).toEqual({ required: true });
    });

    it('should return null for valid non-empty value', () => {
      const control = new FormControl('123 Main Street');
      expect(validator(control)).toBeNull();
    });
  });

  describe('when field is optional', () => {
    const validator = addressLineValidator(false);

    it('should return null when value is empty', () => {
      const control = new FormControl('');
      expect(validator(control)).toBeNull();
    });

    it('should return null when value is whitespace', () => {
      const control = new FormControl('   ');
      expect(validator(control)).toBeNull();
    });
  });

  describe('maxlength validation', () => {
    const validator = addressLineValidator(false);

    it('should return maxlength error when value exceeds 50 characters', () => {
      const value = 'A'.repeat(51);
      const control = new FormControl(value);

      expect(validator(control)).toEqual({
        maxlength: {
          requiredLength: 50,
          actualLength: 51,
        },
      });
    });

    it('should return null when value length is exactly 50 characters', () => {
      const value = 'A'.repeat(50);
      const control = new FormControl(value);

      expect(validator(control)).toBeNull();
    });
  });

});

describe('addressCompletenessValidator', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  it('should return null when no address fields are filled', () => {
    const group = fb.group({
      isInternational: [false],
      addr_1: [''],
      addr_2: [''],
      addr_3: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: ['']
    }, { validators: [addressCompletenessValidator()] });

    expect(group.hasError('incompleteAddress')).toBe(false);
  });

  it('should return incompleteAddress error when only addr_1 is filled (missing city, zipCode, country)', () => {
    const group = fb.group({
      isInternational: [false],
      addr_1: ['123 Main St'],
      addr_2: [''],
      addr_3: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: ['']
    }, { validators: [addressCompletenessValidator()] });

    group.updateValueAndValidity();

    expect(group.hasError('incompleteAddress')).toBe(true);
    const error = group.getError('incompleteAddress');
    expect(error.missingFields).toContain('City');
    expect(error.missingFields).toContain('Postal Code');
    expect(error.missingFields).toContain('Country');
    expect(error.missingFields).toContain('State');
  });

  it('should return incompleteAddress error when only city is filled', () => {
    const group = fb.group({
      isInternational: [false],
      addr_1: [''],
      addr_2: [''],
      addr_3: [''],
      city: ['New York'],
      state: [''],
      zipCode: [''],
      country: ['']
    }, { validators: [addressCompletenessValidator()] });

    group.updateValueAndValidity();

    expect(group.hasError('incompleteAddress')).toBe(true);
    const error = group.getError('incompleteAddress');
    expect(error.missingFields).toContain('Address Line 1');
    expect(error.missingFields).toContain('Postal Code');
    expect(error.missingFields).toContain('Country');
    expect(error.missingFields).toContain('State');
  });

  it('should return null when all required domestic fields are filled', () => {
    const group = fb.group({
      isInternational: [false],
      addr_1: ['123 Main St'],
      addr_2: [''],
      addr_3: [''],
      city: ['New York'],
      state: ['NY'],
      zipCode: ['10001'],
      country: ['USA']
    }, { validators: [addressCompletenessValidator()] });

    group.updateValueAndValidity();

    expect(group.hasError('incompleteAddress')).toBe(false);
  });

  it('should not require state for international addresses', () => {
    const group = fb.group({
      isInternational: [true],
      addr_1: ['123 Main St'],
      addr_2: [''],
      addr_3: [''],
      city: ['London'],
      state: [''],
      zipCode: ['SW1A 1AA'],
      country: ['UK']
    }, { validators: [addressCompletenessValidator()] });

    group.updateValueAndValidity();

    expect(group.hasError('incompleteAddress')).toBe(false);
  });

  it('should return incompleteAddress error when international address is missing required fields', () => {
    const group = fb.group({
      isInternational: [true],
      addr_1: ['123 Main St'],
      addr_2: [''],
      addr_3: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: ['']
    }, { validators: [addressCompletenessValidator()] });

    group.updateValueAndValidity();

    expect(group.hasError('incompleteAddress')).toBe(true);
    const error = group.getError('incompleteAddress');
    expect(error.missingFields).toContain('City');
    expect(error.missingFields).toContain('Postal Code');
    expect(error.missingFields).toContain('Country');
    expect(error.missingFields).not.toContain('State'); // State not required for international
  });

  it('should ignore whitespace-only values', () => {
    const group = fb.group({
      isInternational: [false],
      addr_1: ['   '],
      addr_2: [''],
      addr_3: [''],
      city: [''],
      state: [''],
      zipCode: [''],
      country: ['']
    }, { validators: [addressCompletenessValidator()] });

    group.updateValueAndValidity();

    // Whitespace-only addr_1 should be treated as empty
    expect(group.hasError('incompleteAddress')).toBe(false);
  });
});

describe('InstitutionForms - onInstitutionNameBlur', () => {
  let component: InstitutionForms;
  let fixture: ComponentFixture<InstitutionForms>;
  let fb: FormBuilder;
  let institutionService: jasmine.SpyObj<InstitutionService>;

  beforeEach(async () => {
    const institutionServiceSpy = jasmine.createSpyObj('InstitutionService', [
      'getStatesLookup',
      'getCountriesLookup'
    ]);
    institutionServiceSpy.getStatesLookup.and.returnValue(of([]));
    institutionServiceSpy.getCountriesLookup.and.returnValue(of([]));

    TestBed.configureTestingModule({
      imports: [
        InstitutionForms,
        ReactiveFormsModule,
        NoopAnimationsModule,
        TranslateModule.forRoot(),
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatDatepickerModule,
        MatMomentDateModule,
        MatCardModule,
        MatIconModule,
        MatSelectModule,
      ],
      providers: [
        provideHttpClient(),
        { provide: InstitutionService, useValue: institutionServiceSpy }
      ]
    });

    institutionService = TestBed.inject(InstitutionService) as jasmine.SpyObj<InstitutionService>;
    fixture = TestBed.createComponent(InstitutionForms);
    component = fixture.componentInstance;
    fb = TestBed.inject(FormBuilder);
    component.form = buildInstitutionForm(fb);
    fixture.detectChanges();
  });



  it('should mark address fields as touched when address is incomplete', () => {
    const contactInfoGroup = component.form.get('contactInfo') as FormGroup;

    // Fill only addr_1, leaving other required fields empty (incomplete address)
    contactInfoGroup.get('addr_1')?.setValue('123 Main St');
    contactInfoGroup.get('city')?.setValue('');
    contactInfoGroup.get('state')?.setValue('');
    contactInfoGroup.get('zipCode')?.setValue('');
    contactInfoGroup.get('country')?.setValue('');

    // Trigger blur handler
    component.onInstitutionNameBlur();

    // All address fields should be marked as touched
    expect(contactInfoGroup.get('addr_1')?.touched).toBe(true);
    expect(contactInfoGroup.get('city')?.touched).toBe(true);
    expect(contactInfoGroup.get('state')?.touched).toBe(true);
    expect(contactInfoGroup.get('zipCode')?.touched).toBe(true);
    expect(contactInfoGroup.get('country')?.touched).toBe(true);

    // Group should have incompleteAddress error
    expect(contactInfoGroup.hasError('incompleteAddress')).toBe(true);
  });

  it('should not mark fields as touched when address is complete', () => {
    const contactInfoGroup = component.form.get('contactInfo') as FormGroup;

    // Fill all required fields (complete address)
    contactInfoGroup.get('addr_1')?.setValue('123 Main St');
    contactInfoGroup.get('city')?.setValue('New York');
    contactInfoGroup.get('state')?.setValue('NY');
    contactInfoGroup.get('zipCode')?.setValue('10001');
    contactInfoGroup.get('country')?.setValue('USA');

    // Mark all as untouched initially
    contactInfoGroup.get('addr_1')?.markAsUntouched();
    contactInfoGroup.get('city')?.markAsUntouched();
    contactInfoGroup.get('state')?.markAsUntouched();
    contactInfoGroup.get('zipCode')?.markAsUntouched();
    contactInfoGroup.get('country')?.markAsUntouched();

    // Trigger blur handler
    component.onInstitutionNameBlur();

    // Fields should NOT be marked as touched (address is complete)
    expect(contactInfoGroup.get('addr_1')?.touched).toBe(false);
    expect(contactInfoGroup.get('city')?.touched).toBe(false);
    expect(contactInfoGroup.get('state')?.touched).toBe(false);
    expect(contactInfoGroup.get('zipCode')?.touched).toBe(false);
    expect(contactInfoGroup.get('country')?.touched).toBe(false);

    // Group should NOT have incompleteAddress error
    expect(contactInfoGroup.hasError('incompleteAddress')).toBe(false);
  });

  it('should not mark fields as touched when no address data is entered', () => {
    const contactInfoGroup = component.form.get('contactInfo') as FormGroup;

    // All address fields empty
    contactInfoGroup.get('addr_1')?.setValue('');
    contactInfoGroup.get('city')?.setValue('');
    contactInfoGroup.get('state')?.setValue('');
    contactInfoGroup.get('zipCode')?.setValue('');
    contactInfoGroup.get('country')?.setValue('');

    // Mark all as untouched initially
    contactInfoGroup.get('addr_1')?.markAsUntouched();
    contactInfoGroup.get('city')?.markAsUntouched();

    // Trigger blur handler
    component.onInstitutionNameBlur();

    // Fields should NOT be touched (no data entered, no validation needed)
    expect(contactInfoGroup.get('addr_1')?.touched).toBe(false);
    expect(contactInfoGroup.get('city')?.touched).toBe(false);

    // Group should NOT have incompleteAddress error (no data entered)
    expect(contactInfoGroup.hasError('incompleteAddress')).toBe(false);
  });
});
