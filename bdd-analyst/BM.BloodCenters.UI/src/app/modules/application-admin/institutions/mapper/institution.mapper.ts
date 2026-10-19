import { CreateInstitutionRequest, UpdateInstitutionRequest } from "../interfaces/institution-api.interface";
import { InstitutionForm } from "../interfaces/institution.interface";
import moment from 'moment';

/**
 * Removes all non-digit characters from a phone number string.
 * 
 * This function is used to sanitize phone and fax numbers before sending them to the API,
 * converting formatted strings like "123-456-7890" to "1234567890".
 * 
 * @param value - The phone number string to strip, may be undefined
 * @returns The phone number with only digits, or undefined if input is empty/undefined
 */

function stripPhoneFormatting(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const stripped = value.replace(/\D/g, ''); 
  return stripped.length > 0 ? stripped : undefined;
}

export function mapInstitutionFormToApi(
  form: InstitutionForm
): CreateInstitutionRequest {
  return {
    // Required fields
    INST_ID: form.institutionId?.toUpperCase(),
    INST_NAME: form.institutionName,
    INST_SHORT_NAME: form.facilityShortName,
    PRINT_HDR: form.printHeader,
    SYSTEM_NAME: form.systemName,
    CONTRACT_PREFIX: form.contractPrefix?.toUpperCase(),
    PROGRAM_ID: form.programId,

    // Registration Info - Optional fields (use null for empty values)
    CODABAR_UNIT_SCHEME: form.registrationInfo.codabarScheme || null,
    REG_NO: form.registrationInfo.registrationNumber || null, // Optional per FMB
    LIC_NO: form.registrationInfo.licenseNumber || null,
    EFF_DATE: form.registrationInfo.effectiveDate
      ? moment.utc(form.registrationInfo.effectiveDate).format('YYYY-MM-DD')
      : null,

    // Address - Required fields
    ADDR_1: form.contactInfo.addr_1,
    ADDR_2: form.contactInfo.addr_2 || null,
    ADDR_3: form.contactInfo.addr_3 || null,
    CITY: form.contactInfo.city,
    STATE_CODE: form.contactInfo.state || null,
    ZIP: form.contactInfo.zipCode,
    COUNTRY: form.contactInfo.country,

    // Contact - Optional fields
    PHONE_NUMBER: stripPhoneFormatting(form.contactInfo.phoneNumber) || null,
    INT_PHONE_NUMBER: form.contactInfo.internationalPhoneNumber || null,
    FAX_NUMBER: stripPhoneFormatting(form.contactInfo.fax) || null,
    TELEX_NUMBER: form.contactInfo.internationalFax || null,

    INT_FLAG: form.contactInfo.isInternational ? 'Y' : 'N'
  };
}

export function mapInstitutionFormToUpdateApi(
  form: InstitutionForm
): UpdateInstitutionRequest {
  return mapInstitutionFormToApi(form);
}