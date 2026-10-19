import { mapInstitutionApiToForm } from './institution-from-api.mapper';
import { InstitutionApiResponseCamel } from '../interfaces/institution-api.interface';

describe('mapInstitutionApiToForm', () => {
  const createMockApiResponse = (overrides: Partial<InstitutionApiResponseCamel> = {}): InstitutionApiResponseCamel => ({
    instId: 'INST001',
    instName: 'Test Institution',
    instShortName: 'TI',
    printHdr: 'Test Header',
    systemName: 'Blood Centers',
    contractPrefix: 'TC',
    programId: 'BLOOD',
    codabarUnitScheme: 'A',
    regNo: 'REG123',
    licNo: 'LIC456',
    effDate: '2024-01-01T00:00:00.000Z',
    addressId: 1,
    auditKey: 100,
    lastModifiedDate: '2024-01-15T10:30:00.000Z',
    addr1: '123 Main St',
    addr2: 'Suite 100',
    addr3: 'Floor 3',
    city: 'New York',
    stateCode: 'NY',
    zip: '10001',
    country: 'USA',
    phoneNumber: '1234567890',
    intPhoneNumber: '+441234567890',
    faxNumber: '0987654321',
    telexNumber: '+440987654321',
    intFlag: 'N',
    ...overrides
  });

  it('should map all basic institution fields correctly', () => {
    const apiResponse = createMockApiResponse();
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.institutionId).toBe('INST001');
    expect(result.institutionName).toBe('Test Institution');
    expect(result.contractPrefix).toBe('TC');
    expect(result.facilityShortName).toBe('TI');
    expect(result.printHeader).toBe('Test Header');
    expect(result.systemName).toBe('Blood Centers');
    expect(result.programId).toBe('BLOOD');
  });

  it('should map registration info fields correctly', () => {
    const apiResponse = createMockApiResponse();
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.registrationInfo.registrationNumber).toBe('REG123');
    expect(result.registrationInfo.licenseNumber).toBe('LIC456');
    expect(result.registrationInfo.codabarScheme).toBe('A');
  });

  it('should convert date strings to Date objects', () => {
    const apiResponse = createMockApiResponse();
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.registrationInfo.effectiveDate).toBeInstanceOf(Date);
  });

  it('should map contact info fields correctly', () => {
    const apiResponse = createMockApiResponse();
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.contactInfo.addr_1).toBe('123 Main St');
    expect(result.contactInfo.addr_2).toBe('Suite 100');
    expect(result.contactInfo.addr_3).toBe('Floor 3');
    expect(result.contactInfo.city).toBe('New York');
    expect(result.contactInfo.state).toBe('NY');
    expect(result.contactInfo.zipCode).toBe('10001');
    expect(result.contactInfo.country).toBe('USA');
  });

  it('should map phone and fax fields correctly', () => {
    const apiResponse = createMockApiResponse();
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.contactInfo.phoneNumber).toBe('1234567890');
    expect(result.contactInfo.internationalPhoneNumber).toBe('+441234567890');
    expect(result.contactInfo.fax).toBe('0987654321');
    expect(result.contactInfo.internationalFax).toBe('+440987654321');
  });



  it('should handle empty string fields', () => {
    const apiResponse = createMockApiResponse({
      addr2: '',
      addr3: '',
      intPhoneNumber: '',
      telexNumber: ''
    });
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.contactInfo.addr_2).toBe('');
    expect(result.contactInfo.addr_3).toBe('');
    expect(result.contactInfo.internationalPhoneNumber).toBe('');
    expect(result.contactInfo.internationalFax).toBe('');
  });

  it('should handle null optional fields', () => {
    const apiResponse = createMockApiResponse({
      addr2: null,
      addr3: null,
      regNo: null,
      licNo: null
    });
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.contactInfo.addr_2).toBe('');
    expect(result.contactInfo.addr_3).toBe('');
    expect(result.registrationInfo.registrationNumber).toBe('');
    expect(result.registrationInfo.licenseNumber).toBe('');
  });

  it('should handle undefined optional fields', () => {
    const apiResponse = createMockApiResponse({
      addr2: undefined,
      addr3: undefined,
      regNo: undefined,
      licNo: undefined
    });
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.contactInfo.addr_2).toBe('');
    expect(result.contactInfo.addr_3).toBe('');
    expect(result.registrationInfo.registrationNumber).toBe('');
    expect(result.registrationInfo.licenseNumber).toBe('');
  });

  it('should handle all codabar scheme values', () => {
    const schemes = ['A', 'N', '8'];
    schemes.forEach(scheme => {
      const apiResponse = createMockApiResponse({ codabarUnitScheme: scheme });
      const result = mapInstitutionApiToForm(apiResponse);
      expect(result.registrationInfo.codabarScheme).toBe(scheme);
    });
  });

  it('should preserve exact field values without transformation', () => {
    const apiResponse = createMockApiResponse({
      instName: 'Test | Institution',
      city: 'San Francisco',
      country: 'United States of America'
    });
    const result = mapInstitutionApiToForm(apiResponse);

    expect(result.institutionName).toBe('Test | Institution');
    expect(result.contactInfo.city).toBe('San Francisco');
    expect(result.contactInfo.country).toBe('United States of America');
  });
});
