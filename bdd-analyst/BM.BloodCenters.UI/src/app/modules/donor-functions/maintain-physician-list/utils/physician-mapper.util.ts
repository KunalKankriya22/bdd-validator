import { PhysicianDto, CreatePhysicianRequest, UpdatePhysicianRequest } from '../models/physician-api.model';
import { PhysicianModel, CreatePhysicianRequest as UICreateRequest, UpdatePhysicianRequest as UIUpdateRequest } from '../models/physician.model';

export class PhysicianMapper {
  static toModel(dto: PhysicianDto): PhysicianModel {
    // Build full physician name - handle null/undefined firstName
    let physicianName = dto.lastName;
    if (dto.firstName) {
      physicianName += `, ${dto.firstName}`;
      if (dto.mi) {
        physicianName += ` ${dto.mi}`;
      }
    }

    // Build phone number from area code and phone in format: (+xxx) xxx-xx-xx
    const phoneNumber = this.formatPhoneNumberForUI(dto.areaCode, dto.phoneNo);

    const hasIntlAddress = dto.intlAddrFlag === 'Y';

    return {
      physicianId: dto.phyId,
      lastName: dto.lastName,
      firstName: dto.firstName,
      middleName: dto.mi || null,
      physicianName: physicianName,
      specialtyCode: dto.specialtyCode,
      specialtyDescription: dto.specialtyDesc || null,
      phoneNumber: phoneNumber,
      streetAddress: dto.streetName || null,
      // If intlAddrFlag is null, undefined, or not 'Y', treat as domestic address
      hasInternationalAddress: hasIntlAddress,
      // uspsId maps to different UI fields: address record ID (intl) vs ZIP lookup ID (domestic)
      internationalAddressId: hasIntlAddress ? dto.uspsId || null : null,
      uspsId: !hasIntlAddress ? dto.uspsId || null : null,
      intlAddress1: dto.intlAddress1 || null,
      intlAddress2: dto.intlAddress2 || null,
      intlAddress3: dto.intlAddress3 || null,
      intlAddress4: dto.intlAddress4 || null,
      countryName: dto.countryName || null,
      intlPostalCode: dto.intlPostalCode || null,
      intlHomePhoneNo: dto.intlHomePhoneNo || null,
      intlWorkPhoneNo: dto.intlWorkPhoneNo || null,
      intlWorkPhoneExt: dto.intlWorkPhoneExt || null,
      intlMobilePhoneNo: dto.intlMobilePhoneNo || null,
      intlFaxNo: dto.intlFaxNo || null,
      zipCode: dto.zipCode || null,
      city: dto.city || null,
      state: dto.state || null,
      effectiveDate: dto.effDate,
      terminationDate: dto.termDate || null,
      comments: dto.comments || null,
      chapterId: dto.chapterId,
      createdBy: dto.insertUser || undefined,
      createdDate: dto.insertDate || undefined
    };
  }

  static toCreateRequest(uiRequest: UICreateRequest): CreatePhysicianRequest {
    const { areaCode, phoneNo } = this.splitPhoneNumber(uiRequest.phoneNumber);

    return {
      lastName: uiRequest.lastName,
      firstName: uiRequest.firstName || '',
      mi: uiRequest.middleName || null,
      specialtyCode: uiRequest.specialtyCode || '',
      streetName: uiRequest.streetAddress || null,
      uspsId: uiRequest.uspsId || null,
      areaCode: areaCode,
      phoneNo: phoneNo,
      effDate: uiRequest.effectiveDate,
      termDate: uiRequest.terminationDate || null,
      comments: uiRequest.comments || null,
      intlAddrFlag: uiRequest.intlAddrFlag,
      // International address fields
      intlAddress1: uiRequest.intlAddress1 || null,
      intlAddress2: uiRequest.intlAddress2 || null,
      intlAddress3: uiRequest.intlAddress3 || null,
      intlAddress4: uiRequest.intlAddress4 || null,
      countryName: uiRequest.countryName || null,
      intlPostalCode: uiRequest.intlPostalCode || null,
      intlHomePhoneNo: uiRequest.intlHomePhoneNo || null,
      intlWorkPhoneNo: uiRequest.intlWorkPhoneNo || null,
      intlWorkPhoneExt: uiRequest.intlWorkPhoneExt || null,
      intlMobilePhoneNo: uiRequest.intlMobilePhoneNo || null,
      intlFaxNo: uiRequest.intlFaxNo || null
    };
  }

  static toUpdateRequest(uiRequest: UIUpdateRequest): UpdatePhysicianRequest {
    const { areaCode, phoneNo } = this.splitPhoneNumber(uiRequest.phoneNumber);

    return {
      lastName: uiRequest.lastName,
      firstName: uiRequest.firstName || '',
      mi: uiRequest.middleName || null,
      specialtyCode: uiRequest.specialtyCode || '',
      streetName: uiRequest.streetAddress || null,
      uspsId: uiRequest.uspsId || null,
      areaCode: areaCode,
      phoneNo: phoneNo,
      effDate: uiRequest.effectiveDate,
      termDate: uiRequest.terminationDate || null,
      comments: uiRequest.comments || null,
      intlAddrFlag: uiRequest.intlAddrFlag,
      // International address fields
      intlAddress1: uiRequest.intlAddress1 || null,
      intlAddress2: uiRequest.intlAddress2 || null,
      intlAddress3: uiRequest.intlAddress3 || null,
      intlAddress4: uiRequest.intlAddress4 || null,
      countryName: uiRequest.countryName || null,
      intlPostalCode: uiRequest.intlPostalCode || null,
      intlHomePhoneNo: uiRequest.intlHomePhoneNo || null,
      intlWorkPhoneNo: uiRequest.intlWorkPhoneNo || null,
      intlWorkPhoneExt: uiRequest.intlWorkPhoneExt || null,
      intlMobilePhoneNo: uiRequest.intlMobilePhoneNo || null,
      intlFaxNo: uiRequest.intlFaxNo || null
    };
  }

  private static formatPhoneNumberForUI(areaCode?: string | null, phoneNo?: string | null): string | null {
    if (!areaCode && !phoneNo) {
      return null;
    }
    if (!areaCode) {
      return phoneNo || null;
    }
    if (!phoneNo) {
      return null;
    }

    const digits = phoneNo.replace(/\D/g, '');

    if (digits.length === 7) {
      const formatted = `${digits.substring(0, 3)}-${digits.substring(3, 5)}-${digits.substring(5, 7)}`;
      return `(+${areaCode}) ${formatted}`;
    }

    return `(+${areaCode}) ${phoneNo}`;
  }

  private static splitPhoneNumber(phoneNumber?: string | null): { areaCode: string | null; phoneNo: string | null } {
    if (!phoneNumber) {
      return { areaCode: null, phoneNo: null };
    }

    const newFormatMatch = phoneNumber.match(/^\(\+(\d{1,3})\)\s(\d{3})-(\d{2})-(\d{2})$/);
    if (newFormatMatch) {
      return {
        areaCode: newFormatMatch[1],
        phoneNo: newFormatMatch[2] + newFormatMatch[3] + newFormatMatch[4]
      };
    }

    const digits = phoneNumber.replace(/\D/g, '');

    if (digits.length === 10) {
      return {
        areaCode: digits.substring(0, 3),
        phoneNo: digits.substring(3)
      };
    } else if (digits.length === 7) {
      return {
        areaCode: null,
        phoneNo: digits
      };
    } else {
      return {
        areaCode: null,
        phoneNo: phoneNumber
      };
    }
  }
}
