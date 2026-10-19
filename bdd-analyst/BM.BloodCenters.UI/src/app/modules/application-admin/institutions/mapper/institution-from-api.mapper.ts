import { InstitutionForm } from '../interfaces/institution.interface';
import { InstitutionApiResponseCamel } from '../interfaces/institution-api.interface';
import { convertUTCToTimezone } from '@shared/date/timezone.util';

/**
 * Maps Institution API response to form model
 * Converts GMT dates from API to chapter local timezone for display
 * Mimics Oracle Forms behavior: lifetrack_timezone_convert.get_local_time()
 *
 * @param api - API response with dates in GMT
 * @param chapterTimezone - IANA timezone identifier (e.g., "America/Chicago")
 * @returns InstitutionForm with dates in chapter local timezone
 */
export function mapInstitutionApiToForm(
  api: InstitutionApiResponseCamel,
  chapterTimezone?: string
): InstitutionForm {
  // Convert GMT dates to chapter local timezone if timezone is provided
  const effectiveDate = api.effDate
    ? (chapterTimezone ? convertUTCToTimezone(api.effDate, chapterTimezone) : new Date(api.effDate))
    : null;

  const terminationDate = api.termDate
    ? (chapterTimezone ? convertUTCToTimezone(api.termDate, chapterTimezone) : new Date(api.termDate))
    : null;

  return {
    institutionId: api.instId,
    programId: api.programId,

    institutionName: api.instName,
    contractPrefix: api.contractPrefix ?? '',
    facilityShortName: api.instShortName,
    printHeader: api.printHdr,
    systemName: api.systemName,

    registrationInfo: {
      registrationNumber: api.regNo ?? '',
      licenseNumber: api.licNo ?? '',
      codabarScheme: api.codabarUnitScheme,
      effectiveDate: api.effDate ? new Date(api.effDate) : null
    },

    contactInfo: {
      isInternational: api.intFlag === 'Y',

      addr_1: api.addr1,
      addr_2: api.addr2 ?? '',
      addr_3: api.addr3 ?? '',
      city: api.city,
      state: api.stateCode ?? '',
      zipCode: api.zip ?? '',
      country: api.country,

      phoneNumber: api.phoneNumber ?? '',
      internationalPhoneNumber: api.intPhoneNumber ?? '',
      fax: api.faxNumber ?? '',
      internationalFax: api.telexNumber ?? api.faxNumber ?? ''
    }
  };
}

