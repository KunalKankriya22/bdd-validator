import { mapInstitutionFormToApi, mapInstitutionFormToUpdateApi } from './institution.mapper';
import { InstitutionForm } from '../interfaces/institution.interface';
import moment from 'moment';

describe('Institution Mapper - Form to API', () => {
  const getPastDate = (daysAgo: number = 90): Date => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  const getFutureDate = (daysFromNow: number = 180): Date => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  };

  const createMockFormData = (overrides: Partial<InstitutionForm> = {}): InstitutionForm => ({
    institutionId: 'INST001',
    institutionName: 'Test Institution',
    facilityShortName: 'TI',
    printHeader: 'Test Header',
    systemName: 'Blood Centers',
    contractPrefix: 'TC',
    programId: 'BLOOD',

    registrationInfo: {
      registrationNumber: 'REG123',
      licenseNumber: 'LIC456',
      codabarScheme: 'A',
      effectiveDate: getPastDate(90)
    },

    contactInfo: {
      isInternational: false,
      addr_1: '123 Main St',
      addr_2: 'Suite 100',
      addr_3: 'Floor 3',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      phoneNumber: '123-456-7890',
      internationalPhoneNumber: '+441234567890',
      fax: '098-765-4321',
      internationalFax: '+440987654321'
    },
    ...overrides
  });

  describe('mapInstitutionFormToApi', () => {
    it('should map all basic institution fields correctly', () => {
      const formData = createMockFormData();
      const result = mapInstitutionFormToApi(formData);

      expect(result.INST_ID).toBe('INST001');
      expect(result.INST_NAME).toBe('Test Institution');
      expect(result.CONTRACT_PREFIX).toBe('TC');
      expect(result.INST_SHORT_NAME).toBe('TI');
      expect(result.PRINT_HDR).toBe('Test Header');
      expect(result.SYSTEM_NAME).toBe('Blood Centers');
      expect(result.PROGRAM_ID).toBe('BLOOD');
    });

    it('should map registration info fields correctly', () => {
      const formData = createMockFormData();
      const result = mapInstitutionFormToApi(formData);

      expect(result.REG_NO).toBe('REG123');
      expect(result.LIC_NO).toBe('LIC456');
      expect(result.CODABAR_UNIT_SCHEME).toBe('A');
    });

    it('should format dates as YYYY-MM-DD strings', () => {
      const formData = createMockFormData();
      const result = mapInstitutionFormToApi(formData);

      // Verify dates are formatted as YYYY-MM-DD
      expect(result.EFF_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify the dates match the input dates when formatted
      const effDate = formData.registrationInfo.effectiveDate;
      if (effDate) {
        const expected = moment.utc(effDate).format('YYYY-MM-DD');
        expect(result.EFF_DATE).toBe(expected);
      }
    });

    it('should map contact info fields correctly', () => {
      const formData = createMockFormData();
      const result = mapInstitutionFormToApi(formData);

      expect(result.ADDR_1).toBe('123 Main St');
      expect(result.ADDR_2).toBe('Suite 100');
      expect(result.ADDR_3).toBe('Floor 3');
      expect(result.CITY).toBe('New York');
      expect(result.STATE_CODE).toBe('NY');
      expect(result.ZIP).toBe('10001');
      expect(result.COUNTRY).toBe('USA');
    });





    it('should convert empty strings to null for optional fields', () => {
      const formData = createMockFormData({
        registrationInfo: {
          registrationNumber: '',
          licenseNumber: '',
          codabarScheme: 'A',
          effectiveDate: getPastDate(90)
        },
        contactInfo: {
          ...createMockFormData().contactInfo,
          addr_2: '',
          addr_3: '',
          state: '',
          phoneNumber: '',
          fax: ''
        }
      });
      const result = mapInstitutionFormToApi(formData);

      expect(result.REG_NO).toBeNull();
      expect(result.LIC_NO).toBeNull();
      expect(result.ADDR_2).toBeNull();
      expect(result.ADDR_3).toBeNull();
      expect(result.STATE_CODE).toBeNull();
      expect(result.PHONE_NUMBER).toBeNull();
      expect(result.FAX_NUMBER).toBeNull();
    });

    it('should handle phone numbers that are undefined', () => {
      const formData = createMockFormData({
        contactInfo: {
          ...createMockFormData().contactInfo,
          phoneNumber: undefined,
          fax: undefined
        }
      });
      const result = mapInstitutionFormToApi(formData);

      expect(result.PHONE_NUMBER).toBeNull();
      expect(result.FAX_NUMBER).toBeNull();
    });

    it('should handle phone numbers with only non-digit characters', () => {
      const formData = createMockFormData({
        contactInfo: {
          ...createMockFormData().contactInfo,
          phoneNumber: '---',
          fax: '()'
        }
      });
      const result = mapInstitutionFormToApi(formData);

      expect(result.PHONE_NUMBER).toBeNull();
      expect(result.FAX_NUMBER).toBeNull();
    });

    it('should handle international phone numbers with empty strings', () => {
      const formData = createMockFormData({
        contactInfo: {
          ...createMockFormData().contactInfo,
          internationalPhoneNumber: '',
          internationalFax: ''
        }
      });
      const result = mapInstitutionFormToApi(formData);

      expect(result.INT_PHONE_NUMBER).toBeNull();
      expect(result.TELEX_NUMBER).toBeNull();
    });

    it('should handle all codabar scheme values', () => {
      const schemes = ['A', 'N', '8'];
      schemes.forEach(scheme => {
        const formData = createMockFormData({
          registrationInfo: {
            ...createMockFormData().registrationInfo,
            codabarScheme: scheme
          }
        });
        const result = mapInstitutionFormToApi(formData);
        expect(result.CODABAR_UNIT_SCHEME).toBe(scheme);
      });
    });

    it('should preserve exact field values without transformation', () => {
      const formData = createMockFormData({
        institutionName: 'Test | Institution',
        contactInfo: {
          ...createMockFormData().contactInfo,
          city: 'San Francisco',
          country: 'United States of America'
        }
      });
      const result = mapInstitutionFormToApi(formData);

      expect(result.INST_NAME).toBe('Test | Institution');
      expect(result.CITY).toBe('San Francisco');
      expect(result.COUNTRY).toBe('United States of America');
    });

  });

  describe('mapInstitutionFormToUpdateApi', () => {
    it('should call mapInstitutionFormToApi and return same result', () => {
      const formData = createMockFormData();
      const createResult = mapInstitutionFormToApi(formData);
      const updateResult = mapInstitutionFormToUpdateApi(formData);

      expect(updateResult).toEqual(createResult);
    });

    it('should handle all fields same as create mapper', () => {
      const formData = createMockFormData();
      const result = mapInstitutionFormToUpdateApi(formData);

      expect(result.INST_ID).toBe('INST001');
      expect(result.INST_NAME).toBe('Test Institution');
      expect(result.PHONE_NUMBER).toBe('1234567890');
      expect(result.INT_FLAG).toBe('N');
    });
  });
});
