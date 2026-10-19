import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  institutionNameValidator,
  shortNameValidator,
  printHeaderValidator,
  systemNameValidator,
  contractPrefixValidator,
  cityValidator,
  stateValidator,
  postalCodeValidator,
  countryValidator,
  phoneFaxValidator,
  internationalPhoneFaxValidator,
  codabarSchemeValidator,
  registrationNumberValidator,
  licenseNumberValidator,
  effectiveDateValidator,
  addressLineValidator,
  addressCompletenessValidator
} from '../validators/institution.validators';

export function buildInstitutionForm(fb: FormBuilder, mode: 'create' | 'edit' = 'create'): FormGroup {
  const form = fb.group({
    institutionId: [{ value: '', disabled: true }, [Validators.required]],

    institutionName: ['', [institutionNameValidator()]],
    contractPrefix: ['', [contractPrefixValidator()]],
    facilityShortName: ['', [shortNameValidator()]],
    printHeader: ['', [printHeaderValidator()]],
    systemName: ['', [systemNameValidator()]],

    // programId is auto-set by backend to ProgramIDConstant.Institutions ('VDIINST')
    // No validation needed as it's not user-editable
    programId: [''],

    registrationInfo: fb.group({
      registrationNumber: ['', [Validators.required, registrationNumberValidator()]],
      licenseNumber: ['', [Validators.required, licenseNumberValidator()]],
      codabarScheme: [null, [Validators.required, codabarSchemeValidator()]],
      effectiveDate: [null, [effectiveDateValidator(mode)]],
    }),

    contactInfo: fb.group({
      isInternational: [false],

      addr_1: ['', [addressLineValidator(true)]],
      addr_2: ['', [addressLineValidator(false)]],
      addr_3: ['', [addressLineValidator(false)]],
      city: ['', [cityValidator()]],
      state: [''],
      zipCode: ['', [postalCodeValidator()]],
      country: ['US', [countryValidator()]], // Default country to "US"

      phoneNumber: ['', [phoneFaxValidator()]],
      fax: ['', [phoneFaxValidator()]],
      internationalPhoneNumber: ['', [internationalPhoneFaxValidator()]],
      internationalFax: ['', [internationalPhoneFaxValidator()]],
    }, { validators: [addressCompletenessValidator()] }),
  });

  const stateControl = form.get('contactInfo.state');
  const zipCodeControl = form.get('contactInfo.zipCode');
  const countryControl = form.get('contactInfo.country');
  const isInternationalControl = form.get('contactInfo.isInternational');

  // Update validators when international checkbox changes
  const updateStateValidator = (isInternational: boolean | null) => {
    if (isInternational) {
      stateControl?.clearValidators();
    } else {
      stateControl?.setValidators([stateValidator()]);
    }

    stateControl?.updateValueAndValidity({ emitEvent: false });
  };

  // Update country default when international checkbox changes
  const updateCountryDefault = (isInternational: boolean | null) => {
    if (!isInternational) {
      // When unchecking international, set country to "US"
      countryControl?.setValue('US', { emitEvent: false });
    }
  };

  // Initialize validators based on initial state
  updateStateValidator(isInternationalControl?.value ?? false);

  // Subscribe to international checkbox changes
  isInternationalControl?.valueChanges.subscribe(value => {
    const isIntl = value ?? false;

    // Update state validator
    updateStateValidator(isIntl);

    // Update country default
    updateCountryDefault(isIntl);

    // Re-validate postal code with new international context
    zipCodeControl?.updateValueAndValidity({ emitEvent: false });
  });

  form.get('registrationInfo.codabarScheme')?.valueChanges.subscribe(() => {
    form.get('registrationInfo.registrationNumber')?.updateValueAndValidity({ emitEvent: false });
  });

  return form;
}
