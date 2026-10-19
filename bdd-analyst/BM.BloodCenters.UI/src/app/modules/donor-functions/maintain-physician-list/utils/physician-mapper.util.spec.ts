import { PhysicianMapper } from './physician-mapper.util';
import { PhysicianDto } from '../models/physician-api.model';
import { CreatePhysicianRequest as UICreateRequest, UpdatePhysicianRequest as UIUpdateRequest } from '../models/physician.model';

describe('PhysicianMapper', () => {

  // ---------------------------------------------------------------------------
  // Helpers: reusable minimal DTOs / UI requests
  // ---------------------------------------------------------------------------

  function buildBaseDomesticDto(overrides: Partial<PhysicianDto> = {}): PhysicianDto {
    return {
      phyId: 'PHY001',
      chapterId: 'CH01',
      lastName: 'Smith',
      firstName: 'John',
      mi: 'A',
      specialtyCode: 'IM',
      specialtyDesc: 'Internal Medicine',
      streetName: '123 Main St',
      uspsId: 45678,
      areaCode: '817',
      phoneNo: '8928118',
      zipCode: '76102',
      city: 'Fort Worth',
      state: 'TX',
      effDate: '2024-01-15',
      termDate: '2025-12-31',
      comments: 'Test comment',
      intlAddrFlag: 'N',
      insertUser: 'admin',
      insertDate: '2024-01-01',
      ...overrides
    };
  }

  function buildBaseInternationalDto(overrides: Partial<PhysicianDto> = {}): PhysicianDto {
    return {
      phyId: 'PHY002',
      chapterId: 'CH01',
      lastName: 'Tanaka',
      firstName: 'Yuki',
      mi: null,
      specialtyCode: 'GP',
      specialtyDesc: 'General Practice',
      streetName: null,
      uspsId: 99,
      areaCode: null,
      phoneNo: null,
      zipCode: null,
      city: null,
      state: null,
      effDate: '2024-06-01',
      termDate: null,
      comments: null,
      intlAddrFlag: 'Y',
      intlAddress1: '1-2-3 Shibuya',
      intlAddress2: 'Shibuya-ku',
      intlAddress3: 'Tokyo',
      intlAddress4: null,
      countryName: 'Japan',
      intlPostalCode: '150-0002',
      intlHomePhoneNo: '03-1234-5678',
      intlWorkPhoneNo: '03-9876-5432',
      intlWorkPhoneExt: '101',
      intlMobilePhoneNo: '090-1234-5678',
      intlFaxNo: '03-1111-2222',
      insertUser: null,
      insertDate: null,
      ...overrides
    };
  }

  function buildBaseUICreateRequest(overrides: Partial<UICreateRequest> = {}): UICreateRequest {
    return {
      lastName: 'Doe',
      firstName: 'Jane',
      middleName: 'M',
      specialtyCode: 'IM',
      phoneNumber: '(+817) 892-81-18',
      streetAddress: '456 Oak Ave',
      uspsId: 12345,
      effectiveDate: '2024-03-01',
      terminationDate: '2025-06-30',
      comments: 'New physician',
      chapterId: 'CH01',
      loggedInUserName: 'admin',
      intlAddrFlag: 'N',
      ...overrides
    };
  }

  function buildBaseUIUpdateRequest(overrides: Partial<UIUpdateRequest> = {}): UIUpdateRequest {
    return {
      physicianId: 'PHY001',
      lastName: 'Doe',
      firstName: 'Jane',
      middleName: 'M',
      specialtyCode: 'IM',
      phoneNumber: '(+817) 892-81-18',
      streetAddress: '456 Oak Ave',
      uspsId: 12345,
      effectiveDate: '2024-03-01',
      terminationDate: '2025-06-30',
      comments: 'Updated physician',
      chapterId: 'CH01',
      loggedInUserName: 'admin',
      intlAddrFlag: 'N',
      ...overrides
    };
  }

  // ---------------------------------------------------------------------------
  // toModel
  // ---------------------------------------------------------------------------

  describe('toModel', () => {

    describe('physician name building', () => {

      it('should build name as "lastName, firstName MI" when all parts present', () => {
        const dto = buildBaseDomesticDto({ lastName: 'Smith', firstName: 'John', mi: 'A' });

        const result = PhysicianMapper.toModel(dto);

        expect(result.physicianName).toBe('Smith, John A');
      });

      it('should build name as "lastName, firstName" when MI is null', () => {
        const dto = buildBaseDomesticDto({ lastName: 'Smith', firstName: 'John', mi: null });

        const result = PhysicianMapper.toModel(dto);

        expect(result.physicianName).toBe('Smith, John');
      });

      it('should build name as "lastName, firstName" when MI is undefined', () => {
        const dto = buildBaseDomesticDto({ lastName: 'Smith', firstName: 'John', mi: undefined });

        const result = PhysicianMapper.toModel(dto);

        expect(result.physicianName).toBe('Smith, John');
      });

      it('should build name as "lastName" only when firstName is empty string', () => {
        const dto = buildBaseDomesticDto({ lastName: 'Smith', firstName: '', mi: 'A' });

        const result = PhysicianMapper.toModel(dto);

        expect(result.physicianName).toBe('Smith');
      });
    });

    describe('domestic address mapping', () => {

      it('should map all fields for a complete domestic DTO', () => {
        const dto = buildBaseDomesticDto();

        const result = PhysicianMapper.toModel(dto);

        expect(result.physicianId).toBe('PHY001');
        expect(result.lastName).toBe('Smith');
        expect(result.firstName).toBe('John');
        expect(result.middleName).toBe('A');
        expect(result.specialtyCode).toBe('IM');
        expect(result.specialtyDescription).toBe('Internal Medicine');
        expect(result.streetAddress).toBe('123 Main St');
        expect(result.hasInternationalAddress).toBe(false);
        expect(result.uspsId).toBe(45678);
        expect(result.internationalAddressId).toBeNull();
        expect(result.zipCode).toBe('76102');
        expect(result.city).toBe('Fort Worth');
        expect(result.state).toBe('TX');
        expect(result.effectiveDate).toBe('2024-01-15');
        expect(result.terminationDate).toBe('2025-12-31');
        expect(result.comments).toBe('Test comment');
        expect(result.chapterId).toBe('CH01');
        expect(result.createdBy).toBe('admin');
        expect(result.createdDate).toBe('2024-01-01');
      });

      it('should set uspsId for domestic address and internationalAddressId to null', () => {
        const dto = buildBaseDomesticDto({ intlAddrFlag: 'N', uspsId: 100 });

        const result = PhysicianMapper.toModel(dto);

        expect(result.uspsId).toBe(100);
        expect(result.internationalAddressId).toBeNull();
      });

      it('should treat null intlAddrFlag as domestic address', () => {
        const dto = buildBaseDomesticDto({ intlAddrFlag: null, uspsId: 200 });

        const result = PhysicianMapper.toModel(dto);

        expect(result.hasInternationalAddress).toBe(false);
        expect(result.uspsId).toBe(200);
        expect(result.internationalAddressId).toBeNull();
      });

      it('should treat undefined intlAddrFlag as domestic address', () => {
        const dto = buildBaseDomesticDto({ intlAddrFlag: undefined, uspsId: 300 });

        const result = PhysicianMapper.toModel(dto);

        expect(result.hasInternationalAddress).toBe(false);
        expect(result.uspsId).toBe(300);
        expect(result.internationalAddressId).toBeNull();
      });
    });

    describe('international address mapping', () => {

      it('should map all international address fields when intlAddrFlag is Y', () => {
        const dto = buildBaseInternationalDto();

        const result = PhysicianMapper.toModel(dto);

        expect(result.hasInternationalAddress).toBe(true);
        expect(result.internationalAddressId).toBe(99);
        expect(result.uspsId).toBeNull();
        expect(result.intlAddress1).toBe('1-2-3 Shibuya');
        expect(result.intlAddress2).toBe('Shibuya-ku');
        expect(result.intlAddress3).toBe('Tokyo');
        expect(result.intlAddress4).toBeNull();
        expect(result.countryName).toBe('Japan');
        expect(result.intlPostalCode).toBe('150-0002');
        expect(result.intlHomePhoneNo).toBe('03-1234-5678');
        expect(result.intlWorkPhoneNo).toBe('03-9876-5432');
        expect(result.intlWorkPhoneExt).toBe('101');
        expect(result.intlMobilePhoneNo).toBe('090-1234-5678');
        expect(result.intlFaxNo).toBe('03-1111-2222');
      });

      it('should set internationalAddressId from uspsId and clear uspsId', () => {
        const dto = buildBaseInternationalDto({ uspsId: 42 });

        const result = PhysicianMapper.toModel(dto);

        expect(result.internationalAddressId).toBe(42);
        expect(result.uspsId).toBeNull();
      });

      it('should set internationalAddressId to null when uspsId is null for international', () => {
        const dto = buildBaseInternationalDto({ uspsId: null });

        const result = PhysicianMapper.toModel(dto);

        expect(result.internationalAddressId).toBeNull();
      });
    });

    describe('null/undefined defaults', () => {

      it('should default optional string fields to null when undefined in DTO', () => {
        const dto = buildBaseDomesticDto({
          mi: undefined,
          specialtyDesc: undefined,
          streetName: undefined,
          termDate: undefined,
          comments: undefined,
          zipCode: undefined,
          city: undefined,
          state: undefined
        });

        const result = PhysicianMapper.toModel(dto);

        expect(result.middleName).toBeNull();
        expect(result.specialtyDescription).toBeNull();
        expect(result.streetAddress).toBeNull();
        expect(result.terminationDate).toBeNull();
        expect(result.comments).toBeNull();
        expect(result.zipCode).toBeNull();
        expect(result.city).toBeNull();
        expect(result.state).toBeNull();
      });

      it('should set createdBy to undefined when insertUser is null', () => {
        const dto = buildBaseDomesticDto({ insertUser: null, insertDate: null });

        const result = PhysicianMapper.toModel(dto);

        expect(result.createdBy).toBeUndefined();
        expect(result.createdDate).toBeUndefined();
      });
    });

    describe('phone number formatting (via formatPhoneNumberForUI)', () => {

      it('should format 7-digit phone with area code as "(+areaCode) xxx-xx-xx"', () => {
        const dto = buildBaseDomesticDto({ areaCode: '817', phoneNo: '8928118' });

        const result = PhysicianMapper.toModel(dto);

        expect(result.phoneNumber).toBe('(+817) 892-81-18');
      });

      it('should return phoneNo as-is when areaCode is null', () => {
        const dto = buildBaseDomesticDto({ areaCode: null, phoneNo: '8928118' });

        const result = PhysicianMapper.toModel(dto);

        expect(result.phoneNumber).toBe('8928118');
      });

      it('should return null when phoneNo is null', () => {
        const dto = buildBaseDomesticDto({ areaCode: '817', phoneNo: null });

        const result = PhysicianMapper.toModel(dto);

        expect(result.phoneNumber).toBeNull();
      });

      it('should return null when both areaCode and phoneNo are null', () => {
        const dto = buildBaseDomesticDto({ areaCode: null, phoneNo: null });

        const result = PhysicianMapper.toModel(dto);

        expect(result.phoneNumber).toBeNull();
      });

      it('should return phoneNo as-is when areaCode is undefined', () => {
        const dto = buildBaseDomesticDto({ areaCode: undefined, phoneNo: '8928118' });

        const result = PhysicianMapper.toModel(dto);

        expect(result.phoneNumber).toBe('8928118');
      });

      it('should use basic format for non-7-digit phone numbers', () => {
        const dto = buildBaseDomesticDto({ areaCode: '817', phoneNo: '12345' });

        const result = PhysicianMapper.toModel(dto);

        expect(result.phoneNumber).toBe('(+817) 12345');
      });

      it('should strip non-digit characters before checking length', () => {
        const dto = buildBaseDomesticDto({ areaCode: '817', phoneNo: '892-81-18' });

        const result = PhysicianMapper.toModel(dto);

        // '892-81-18' has 7 digits after stripping, so formatted
        expect(result.phoneNumber).toBe('(+817) 892-81-18');
      });

      it('should use basic format when phone has more than 7 digits', () => {
        const dto = buildBaseDomesticDto({ areaCode: '1', phoneNo: '12345678' });

        const result = PhysicianMapper.toModel(dto);

        expect(result.phoneNumber).toBe('(+1) 12345678');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // toCreateRequest
  // ---------------------------------------------------------------------------

  describe('toCreateRequest', () => {

    it('should map all UI fields to API field names', () => {
      const uiRequest = buildBaseUICreateRequest();

      const result = PhysicianMapper.toCreateRequest(uiRequest);

      expect(result.lastName).toBe('Doe');
      expect(result.firstName).toBe('Jane');
      expect(result.mi).toBe('M');
      expect(result.specialtyCode).toBe('IM');
      expect(result.streetName).toBe('456 Oak Ave');
      expect(result.uspsId).toBe(12345);
      expect(result.effDate).toBe('2024-03-01');
      expect(result.termDate).toBe('2025-06-30');
      expect(result.comments).toBe('New physician');
      expect(result.intlAddrFlag).toBe('N');
    });

    it('should default firstName to empty string when null', () => {
      const uiRequest = buildBaseUICreateRequest({ firstName: null });

      const result = PhysicianMapper.toCreateRequest(uiRequest);

      expect(result.firstName).toBe('');
    });

    it('should default middleName (mi) to null when undefined', () => {
      const uiRequest = buildBaseUICreateRequest({ middleName: undefined });

      const result = PhysicianMapper.toCreateRequest(uiRequest);

      expect(result.mi).toBeNull();
    });

    it('should default specialtyCode to empty string when null', () => {
      const uiRequest = buildBaseUICreateRequest({ specialtyCode: null });

      const result = PhysicianMapper.toCreateRequest(uiRequest);

      expect(result.specialtyCode).toBe('');
    });

    it('should map optional null fields to null', () => {
      const uiRequest = buildBaseUICreateRequest({
        streetAddress: null,
        uspsId: null,
        terminationDate: null,
        comments: null
      });

      const result = PhysicianMapper.toCreateRequest(uiRequest);

      expect(result.streetName).toBeNull();
      expect(result.uspsId).toBeNull();
      expect(result.termDate).toBeNull();
      expect(result.comments).toBeNull();
    });

    it('should map international address fields', () => {
      const uiRequest = buildBaseUICreateRequest({
        intlAddrFlag: 'Y',
        intlAddress1: 'Line 1',
        intlAddress2: 'Line 2',
        intlAddress3: 'Line 3',
        intlAddress4: 'Line 4',
        countryName: 'Canada',
        intlPostalCode: 'K1A 0B1',
        intlHomePhoneNo: '613-555-0100',
        intlWorkPhoneNo: '613-555-0200',
        intlWorkPhoneExt: '42',
        intlMobilePhoneNo: '613-555-0300',
        intlFaxNo: '613-555-0400'
      });

      const result = PhysicianMapper.toCreateRequest(uiRequest);

      expect(result.intlAddrFlag).toBe('Y');
      expect(result.intlAddress1).toBe('Line 1');
      expect(result.intlAddress2).toBe('Line 2');
      expect(result.intlAddress3).toBe('Line 3');
      expect(result.intlAddress4).toBe('Line 4');
      expect(result.countryName).toBe('Canada');
      expect(result.intlPostalCode).toBe('K1A 0B1');
      expect(result.intlHomePhoneNo).toBe('613-555-0100');
      expect(result.intlWorkPhoneNo).toBe('613-555-0200');
      expect(result.intlWorkPhoneExt).toBe('42');
      expect(result.intlMobilePhoneNo).toBe('613-555-0300');
      expect(result.intlFaxNo).toBe('613-555-0400');
    });

    describe('phone number splitting (via splitPhoneNumber)', () => {

      it('should split "(+817) 892-81-18" format into areaCode and phoneNo', () => {
        const uiRequest = buildBaseUICreateRequest({ phoneNumber: '(+817) 892-81-18' });

        const result = PhysicianMapper.toCreateRequest(uiRequest);

        expect(result.areaCode).toBe('817');
        expect(result.phoneNo).toBe('8928118');
      });

      it('should return both null when phoneNumber is null', () => {
        const uiRequest = buildBaseUICreateRequest({ phoneNumber: null });

        const result = PhysicianMapper.toCreateRequest(uiRequest);

        expect(result.areaCode).toBeNull();
        expect(result.phoneNo).toBeNull();
      });

      it('should return both null when phoneNumber is undefined', () => {
        const uiRequest = buildBaseUICreateRequest({ phoneNumber: undefined });

        const result = PhysicianMapper.toCreateRequest(uiRequest);

        expect(result.areaCode).toBeNull();
        expect(result.phoneNo).toBeNull();
      });

      it('should split 10-digit number into 3-digit area code and 7-digit phone', () => {
        const uiRequest = buildBaseUICreateRequest({ phoneNumber: '8178928118' });

        const result = PhysicianMapper.toCreateRequest(uiRequest);

        expect(result.areaCode).toBe('817');
        expect(result.phoneNo).toBe('8928118');
      });

      it('should handle 7-digit number with no area code', () => {
        const uiRequest = buildBaseUICreateRequest({ phoneNumber: '8928118' });

        const result = PhysicianMapper.toCreateRequest(uiRequest);

        expect(result.areaCode).toBeNull();
        expect(result.phoneNo).toBe('8928118');
      });

      it('should return original string as phoneNo for unrecognized format', () => {
        const uiRequest = buildBaseUICreateRequest({ phoneNumber: '12345' });

        const result = PhysicianMapper.toCreateRequest(uiRequest);

        expect(result.areaCode).toBeNull();
        expect(result.phoneNo).toBe('12345');
      });

      it('should handle formatted 10-digit number like "(817) 892-8118"', () => {
        const uiRequest = buildBaseUICreateRequest({ phoneNumber: '(817) 892-8118' });

        const result = PhysicianMapper.toCreateRequest(uiRequest);

        expect(result.areaCode).toBe('817');
        expect(result.phoneNo).toBe('8928118');
      });

      it('should handle single-digit area code in (+x) format', () => {
        const uiRequest = buildBaseUICreateRequest({ phoneNumber: '(+1) 892-81-18' });

        const result = PhysicianMapper.toCreateRequest(uiRequest);

        expect(result.areaCode).toBe('1');
        expect(result.phoneNo).toBe('8928118');
      });
    });
  });

  // ---------------------------------------------------------------------------
  // toUpdateRequest
  // ---------------------------------------------------------------------------

  describe('toUpdateRequest', () => {

    it('should map all UI fields to API field names', () => {
      const uiRequest = buildBaseUIUpdateRequest();

      const result = PhysicianMapper.toUpdateRequest(uiRequest);

      expect(result.lastName).toBe('Doe');
      expect(result.firstName).toBe('Jane');
      expect(result.mi).toBe('M');
      expect(result.specialtyCode).toBe('IM');
      expect(result.streetName).toBe('456 Oak Ave');
      expect(result.uspsId).toBe(12345);
      expect(result.effDate).toBe('2024-03-01');
      expect(result.termDate).toBe('2025-06-30');
      expect(result.comments).toBe('Updated physician');
      expect(result.intlAddrFlag).toBe('N');
    });

    it('should split phone number for update request', () => {
      const uiRequest = buildBaseUIUpdateRequest({ phoneNumber: '(+817) 892-81-18' });

      const result = PhysicianMapper.toUpdateRequest(uiRequest);

      expect(result.areaCode).toBe('817');
      expect(result.phoneNo).toBe('8928118');
    });

    it('should handle null phone number in update request', () => {
      const uiRequest = buildBaseUIUpdateRequest({ phoneNumber: null });

      const result = PhysicianMapper.toUpdateRequest(uiRequest);

      expect(result.areaCode).toBeNull();
      expect(result.phoneNo).toBeNull();
    });

    it('should default firstName to empty string when null', () => {
      const uiRequest = buildBaseUIUpdateRequest({ firstName: null });

      const result = PhysicianMapper.toUpdateRequest(uiRequest);

      expect(result.firstName).toBe('');
    });

    it('should map international address fields in update request', () => {
      const uiRequest = buildBaseUIUpdateRequest({
        intlAddrFlag: 'Y',
        intlAddress1: 'Addr Line 1',
        countryName: 'Germany'
      });

      const result = PhysicianMapper.toUpdateRequest(uiRequest);

      expect(result.intlAddrFlag).toBe('Y');
      expect(result.intlAddress1).toBe('Addr Line 1');
      expect(result.countryName).toBe('Germany');
    });

    it('should default null optional fields to null', () => {
      const uiRequest = buildBaseUIUpdateRequest({
        middleName: null,
        streetAddress: null,
        uspsId: null,
        terminationDate: null,
        comments: null,
        intlAddress1: null,
        intlAddress2: null,
        intlAddress3: null,
        intlAddress4: null,
        countryName: null,
        intlPostalCode: null,
        intlHomePhoneNo: null,
        intlWorkPhoneNo: null,
        intlWorkPhoneExt: null,
        intlMobilePhoneNo: null,
        intlFaxNo: null
      });

      const result = PhysicianMapper.toUpdateRequest(uiRequest);

      expect(result.mi).toBeNull();
      expect(result.streetName).toBeNull();
      expect(result.uspsId).toBeNull();
      expect(result.termDate).toBeNull();
      expect(result.comments).toBeNull();
      expect(result.intlAddress1).toBeNull();
      expect(result.intlAddress2).toBeNull();
      expect(result.intlAddress3).toBeNull();
      expect(result.intlAddress4).toBeNull();
      expect(result.countryName).toBeNull();
      expect(result.intlPostalCode).toBeNull();
      expect(result.intlHomePhoneNo).toBeNull();
      expect(result.intlWorkPhoneNo).toBeNull();
      expect(result.intlWorkPhoneExt).toBeNull();
      expect(result.intlMobilePhoneNo).toBeNull();
      expect(result.intlFaxNo).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Round-trip consistency
  // ---------------------------------------------------------------------------

  describe('round-trip consistency', () => {

    it('should round-trip phone number through toModel and back via toCreateRequest', () => {
      const dto = buildBaseDomesticDto({ areaCode: '817', phoneNo: '8928118' });

      const model = PhysicianMapper.toModel(dto);
      const apiRequest = PhysicianMapper.toCreateRequest({
        lastName: model.lastName,
        phoneNumber: model.phoneNumber,
        effectiveDate: model.effectiveDate as string,
        chapterId: model.chapterId,
        loggedInUserName: 'admin',
        intlAddrFlag: 'N'
      } as UICreateRequest);

      expect(apiRequest.areaCode).toBe('817');
      expect(apiRequest.phoneNo).toBe('8928118');
    });
  });
});
