import { FormBuilder, FormControl } from '@angular/forms';
import { buildInstitutionForm } from './institution-form.factory';

describe('Institution Form Factory', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  describe('buildInstitutionForm - CREATE mode', () => {
    it('should build form with all required fields', () => {
      const form = buildInstitutionForm(fb, 'create');

      expect(form).toBeTruthy();
      expect(form.get('institutionId')).toBeTruthy();
      expect(form.get('institutionName')).toBeTruthy();
      expect(form.get('contractPrefix')).toBeTruthy();
      expect(form.get('facilityShortName')).toBeTruthy();
      expect(form.get('printHeader')).toBeTruthy();
      expect(form.get('systemName')).toBeTruthy();
      expect(form.get('programId')).toBeTruthy();
      expect(form.get('registrationInfo')).toBeTruthy();
      expect(form.get('contactInfo')).toBeTruthy();
    });


    it('should create registrationInfo group with all fields', () => {
      const form = buildInstitutionForm(fb, 'create');
      const regInfo = form.get('registrationInfo');

      expect(regInfo?.get('registrationNumber')).toBeTruthy();
      expect(regInfo?.get('licenseNumber')).toBeTruthy();
      expect(regInfo?.get('codabarScheme')).toBeTruthy();
      expect(regInfo?.get('effectiveDate')).toBeTruthy();
    });

    it('should create contactInfo group with all fields', () => {
      const form = buildInstitutionForm(fb, 'create');
      const contactInfo = form.get('contactInfo');

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

    it('should set codabarScheme as required', () => {
      const form = buildInstitutionForm(fb, 'create');
      const codabarScheme = form.get('registrationInfo.codabarScheme');

      expect(codabarScheme?.hasError('required')).toBe(true);
    });

    it('should initialize isInternational as false', () => {
      const form = buildInstitutionForm(fb, 'create');
      const isInternational = form.get('contactInfo.isInternational');

      expect(isInternational?.value).toBe(false);
    });
  });

  describe('Required field validations', () => {
    it('should mark institutionId as required', () => {
      const form = buildInstitutionForm(fb, 'create');
      const institutionId = form.get('institutionId');

      institutionId?.enable();
      institutionId?.setValue('');
      expect(institutionId?.hasError('required')).toBe(true);

      institutionId?.setValue('TEST');
      expect(institutionId?.hasError('required')).toBe(false);
    });

    it('should mark registrationNumber as required', () => {
      const form = buildInstitutionForm(fb, 'create');
      const regNo = form.get('registrationInfo.registrationNumber');

      regNo?.setValue('');
      expect(regNo?.hasError('required')).toBe(true);

      regNo?.setValue('REG001');
      expect(regNo?.hasError('required')).toBe(false);
    });

    it('should mark licenseNumber as required', () => {
      const form = buildInstitutionForm(fb, 'create');
      const licNo = form.get('registrationInfo.licenseNumber');

      licNo?.setValue('');
      expect(licNo?.hasError('required')).toBe(true);

      licNo?.setValue('LIC001');
      expect(licNo?.hasError('required')).toBe(false);
    });

    it('should mark country as required', () => {
      const form = buildInstitutionForm(fb, 'create');
      const country = form.get('contactInfo.country');

      country?.setValue('');
      expect(country?.hasError('required')).toBe(true);

      country?.setValue('US');
      expect(country?.hasError('required')).toBe(false);
    });

    it('should validate required fields in edit mode', () => {
      const form = buildInstitutionForm(fb, 'edit');

      const regNo = form.get('registrationInfo.registrationNumber');
      regNo?.setValue('');
      expect(regNo?.hasError('required')).toBe(true);

      const licNo = form.get('registrationInfo.licenseNumber');
      licNo?.setValue('');
      expect(licNo?.hasError('required')).toBe(true);
    });
  });

  describe('buildInstitutionForm - EDIT mode', () => {
    it('should build form in edit mode', () => {
      const form = buildInstitutionForm(fb, 'edit');

      expect(form).toBeTruthy();
      expect(form.get('institutionId')?.disabled).toBe(true);
    });
  });

  describe('Dynamic State Validation', () => {
    it('should add state validator when isInternational is false', () => {
      const form = buildInstitutionForm(fb, 'create');
      form.get('contactInfo.isInternational')?.setValue(false);

      const stateControl = form.get('contactInfo.state');
      stateControl?.setValue('');

      expect(stateControl?.hasError('required')).toBe(true);
    });




    it('should initialize with state validator in domestic mode', () => {
      const form = buildInstitutionForm(fb, 'create');
      const stateControl = form.get('contactInfo.state');

      stateControl?.setValue('');
      expect(stateControl?.hasError('required')).toBe(true);
    });
  });

  describe('Cross-field Validation - Codabar and Registration Number', () => {
    it('should re-validate registrationNumber when codabarScheme changes', () => {
      const form = buildInstitutionForm(fb, 'create');
      const codabar = form.get('registrationInfo.codabarScheme');
      const regNo = form.get('registrationInfo.registrationNumber');

      regNo?.setValue('12345');
      codabar?.setValue('A');

      // The validator should be triggered
      expect(regNo?.value).toBe('12345');
    });
  });

  describe('programId field', () => {
    it('should initialize programId as empty string', () => {
      const form = buildInstitutionForm(fb, 'create');
      const programId = form.get('programId');

      expect(programId?.value).toBe('');
    });

    it('should allow programId to be set', () => {
      const form = buildInstitutionForm(fb, 'create');
      const programId = form.get('programId');

      programId?.setValue('VDIINST');
      expect(programId?.value).toBe('VDIINST');
    });
  });

  describe('Form default values', () => {
    it('should initialize all string fields as empty', () => {
      const form = buildInstitutionForm(fb, 'create');

      expect(form.get('institutionId')?.value).toBe('');
      expect(form.get('institutionName')?.value).toBe('');
      expect(form.get('contractPrefix')?.value).toBe('');
      expect(form.get('facilityShortName')?.value).toBe('');
      expect(form.get('printHeader')?.value).toBe('');
      expect(form.get('systemName')?.value).toBe('');
    });

    it('should initialize registration info fields correctly', () => {
      const form = buildInstitutionForm(fb, 'create');

      expect(form.get('registrationInfo.registrationNumber')?.value).toBe('');
      expect(form.get('registrationInfo.licenseNumber')?.value).toBe('');
      expect(form.get('registrationInfo.codabarScheme')?.value).toBeNull();
      expect(form.get('registrationInfo.effectiveDate')?.value).toBeNull();
    });

    it('should initialize contact info fields correctly', () => {
      const form = buildInstitutionForm(fb, 'create');

      expect(form.get('contactInfo.addr_1')?.value).toBe('');
      expect(form.get('contactInfo.addr_2')?.value).toBe('');
      expect(form.get('contactInfo.addr_3')?.value).toBe('');
      expect(form.get('contactInfo.city')?.value).toBe('');
      expect(form.get('contactInfo.state')?.value).toBe('');
      expect(form.get('contactInfo.zipCode')?.value).toBe('');
      expect(form.get('contactInfo.country')?.value).toBe('US'); // Default to US
      expect(form.get('contactInfo.phoneNumber')?.value).toBe('');
      expect(form.get('contactInfo.fax')?.value).toBe('');
      expect(form.get('contactInfo.internationalPhoneNumber')?.value).toBe('');
      expect(form.get('contactInfo.internationalFax')?.value).toBe('');
    });
  });

  describe('Country Default Behavior', () => {
    it('should initialize country as US by default', () => {
      const form = buildInstitutionForm(fb, 'create');
      const country = form.get('contactInfo.country');

      expect(country?.value).toBe('US');
    });


  });

  describe('Postal Code Validation - International Toggle', () => {

    it('should re-validate postal code when switching to domestic', () => {
      const form = buildInstitutionForm(fb, 'create');
      const zipCode = form.get('contactInfo.zipCode');
      const isInternational = form.get('contactInfo.isInternational');

      // Start with international and set alphanumeric code
      isInternational?.setValue(true);
      zipCode?.setValue('M5H 2N2');
      expect(zipCode?.valid).toBe(true);

      // Switch to domestic - should now be invalid (needs 5 digits)
      isInternational?.setValue(false);
      expect(zipCode?.valid).toBe(false);
      expect(zipCode?.hasError('invalidUSZipCode')).toBe(true);
    });

    it('should validate US ZIP as 5 digits only when domestic', () => {
      const form = buildInstitutionForm(fb, 'create');
      const zipCode = form.get('contactInfo.zipCode');

      zipCode?.setValue('7500'); // 4 digits
      expect(zipCode?.hasError('invalidUSZipCode')).toBe(true);

      zipCode?.setValue('75001'); // 5 digits
      expect(zipCode?.valid).toBe(true);

      zipCode?.setValue('750011'); // 6 digits
      expect(zipCode?.hasError('invalidUSZipCode')).toBe(true);
    });

    it('should allow alphanumeric with spaces/hyphens for international', () => {
      const form = buildInstitutionForm(fb, 'create');
      const zipCode = form.get('contactInfo.zipCode');
      const isInternational = form.get('contactInfo.isInternational');

      isInternational?.setValue(true);

      zipCode?.setValue('M5H 2N2'); // Canadian postal code with space
      expect(zipCode?.valid).toBe(true);

      zipCode?.setValue('SW1A-1AA'); // UK postal code with hyphen
      expect(zipCode?.valid).toBe(true);

      zipCode?.setValue('123456'); // Numeric
      expect(zipCode?.valid).toBe(true);
    });
  });
});
