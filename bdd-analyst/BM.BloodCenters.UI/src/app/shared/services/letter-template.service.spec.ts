import { TestBed } from '@angular/core/testing';
import { LetterTemplateService } from './letter-template.service';

describe('LetterTemplateService', () => {
  let service: LetterTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LetterTemplateService],
    });
    service = TestBed.inject(LetterTemplateService);
  });

  // ---------------------------------------------------------------------------
  // replaceTemplatePlaceholders
  // ---------------------------------------------------------------------------
  describe('replaceTemplatePlaceholders', () => {

    // -- guard: falsy template returns empty string --
    it('should return empty string for null template', () => {
      expect(service.replaceTemplatePlaceholders(null as any, {})).toBe('');
    });

    it('should return empty string for undefined template', () => {
      expect(service.replaceTemplatePlaceholders(undefined as any, {})).toBe('');
    });

    it('should return empty string for empty string template', () => {
      expect(service.replaceTemplatePlaceholders('', {})).toBe('');
    });

    // -- date placeholders --
    it('should replace PrintDate with current date', () => {
      const result = service.replaceTemplatePlaceholders('Date: &&PrintDate&&', null);
      expect(result).toMatch(/Date: \d{2}\/\d{2}\/\d{4}/);
    });

    it('should replace CurrentDate with current date', () => {
      const result = service.replaceTemplatePlaceholders('Date: &&CurrentDate&&', null);
      expect(result).toMatch(/Date: \d{2}\/\d{2}\/\d{4}/);
    });

    it('should replace TodayDate with current date', () => {
      const result = service.replaceTemplatePlaceholders('Date: &&TodayDate&&', null);
      expect(result).toMatch(/Date: \d{2}\/\d{2}\/\d{4}/);
    });

    it('should replace Today with current date', () => {
      const result = service.replaceTemplatePlaceholders('Date: &&Today&&', null);
      expect(result).toMatch(/Date: \d{2}\/\d{2}\/\d{4}/);
    });

    // -- donor name --
    it('should replace DonorName from name field', () => {
      const result = service.replaceTemplatePlaceholders('Dear &&DonorName&&,', { name: 'John Doe' });
      expect(result).toBe('Dear John Doe,');
    });

    it('should replace DonorName from donorName field', () => {
      const result = service.replaceTemplatePlaceholders('Dear &&DonorName&&,', { donorName: 'Jane Smith' });
      expect(result).toBe('Dear Jane Smith,');
    });

    it('should replace DonorName from fullName field', () => {
      const result = service.replaceTemplatePlaceholders('Dear &&DonorName&&,', { fullName: 'Bob Builder' });
      expect(result).toBe('Dear Bob Builder,');
    });

    it('should show default when DonorName is not in data', () => {
      const result = service.replaceTemplatePlaceholders('Dear &&DonorName&&,', {});
      expect(result).toBe('Dear [Donor Name],');
    });

    it('should show default when DonorName data is null', () => {
      const result = service.replaceTemplatePlaceholders('Dear &&DonorName&&,', null);
      expect(result).toBe('Dear [Donor Name],');
    });

    // -- Name --
    it('should replace Name from name field', () => {
      const result = service.replaceTemplatePlaceholders('&&Name&&', { name: 'Alice' });
      expect(result).toBe('Alice');
    });

    it('should show default [Name] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Name&&', {});
      expect(result).toBe('[Name]');
    });

    // -- DonorId / Id --
    it('should replace DonorId from donorId field', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorId&&', { donorId: 'D100' });
      expect(result).toBe('D100');
    });

    it('should replace DonorId from id field', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorId&&', { id: 'D200' });
      expect(result).toBe('D200');
    });

    it('should show default [Donor ID] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorId&&', {});
      expect(result).toBe('[Donor ID]');
    });

    it('should replace Id from donorId field', () => {
      const result = service.replaceTemplatePlaceholders('&&Id&&', { donorId: '123' });
      expect(result).toBe('123');
    });

    it('should show default [ID] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Id&&', {});
      expect(result).toBe('[ID]');
    });

    // -- DateOfBirth / DOB --
    it('should replace DateOfBirth from dateOfBirth field', () => {
      const result = service.replaceTemplatePlaceholders('&&DateOfBirth&&', { dateOfBirth: '01/01/2000' });
      expect(result).toBe('01/01/2000');
    });

    it('should replace DateOfBirth from dob field', () => {
      const result = service.replaceTemplatePlaceholders('&&DateOfBirth&&', { dob: '02/02/1990' });
      expect(result).toBe('02/02/1990');
    });

    it('should show default [Date of Birth] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&DateOfBirth&&', {});
      expect(result).toBe('[Date of Birth]');
    });

    it('should replace DOB from dob field', () => {
      const result = service.replaceTemplatePlaceholders('&&DOB&&', { dob: '01/01/2000' });
      expect(result).toBe('01/01/2000');
    });

    it('should show default [DOB] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&DOB&&', {});
      expect(result).toBe('[DOB]');
    });

    // -- Sex / Gender --
    it('should replace Sex from sex field', () => {
      const result = service.replaceTemplatePlaceholders('&&Sex&&', { sex: 'Male' });
      expect(result).toBe('Male');
    });

    it('should replace Sex from gender field', () => {
      const result = service.replaceTemplatePlaceholders('&&Sex&&', { gender: 'Female' });
      expect(result).toBe('Female');
    });

    it('should show default [Sex] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Sex&&', {});
      expect(result).toBe('[Sex]');
    });

    it('should replace Gender from gender field', () => {
      const result = service.replaceTemplatePlaceholders('&&Gender&&', { gender: 'Female' });
      expect(result).toBe('Female');
    });

    it('should replace Gender from sex field', () => {
      const result = service.replaceTemplatePlaceholders('&&Gender&&', { sex: 'Male' });
      expect(result).toBe('Male');
    });

    it('should show default [Gender] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Gender&&', {});
      expect(result).toBe('[Gender]');
    });

    // -- Address --
    it('should replace DonorAddress from address field', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorAddress&&', { address: '123 Main St' });
      expect(result).toBe('123 Main St');
    });

    it('should show default [Address] when DonorAddress data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorAddress&&', {});
      expect(result).toBe('[Address]');
    });

    it('should replace Address from address field', () => {
      const result = service.replaceTemplatePlaceholders('&&Address&&', { address: '456 Elm St' });
      expect(result).toBe('456 Elm St');
    });

    it('should show default [Address] when Address data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Address&&', {});
      expect(result).toBe('[Address]');
    });

    // -- Address1 / Address2 / DonorAddress1 / DonorAddress2 --
    it('should replace Address1 from addressLine1 field', () => {
      const result = service.replaceTemplatePlaceholders('&&Address1&&', { addressLine1: '123 Main' });
      expect(result).toBe('123 Main');
    });

    it('should replace Address2 from addressLine2 field', () => {
      const result = service.replaceTemplatePlaceholders('&&Address2&&', { addressLine2: 'Suite 5' });
      expect(result).toBe('Suite 5');
    });

    it('should replace DonorAddress1 from addressLine1 field', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorAddress1&&', { addressLine1: '123 Main St' });
      expect(result).toBe('123 Main St');
    });

    it('should replace DonorAddress2 from addressLine2 field', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorAddress2&&', { addressLine2: 'Apt 4' });
      expect(result).toBe('Apt 4');
    });

    it('should fall through to getAddressLine for Address1 when addressLine1 absent', () => {
      const result = service.replaceTemplatePlaceholders('&&Address1&&', { address: '123 Main St\nApt 4B' });
      expect(result).toBe('123 Main St');
    });

    it('should fall through to getAddressLine for Address2 when addressLine2 absent', () => {
      const result = service.replaceTemplatePlaceholders('&&Address2&&', { address: '123 Main St\nApt 4B' });
      expect(result).toBe('Apt 4B');
    });

    it('should fall through to getAddressLine for DonorAddress1 from multi-line address', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorAddress1&&', { address: '789 Oak Ave\nFloor 3' });
      expect(result).toBe('789 Oak Ave');
    });

    it('should fall through to getAddressLine for DonorAddress2 from multi-line address', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorAddress2&&', { address: '789 Oak Ave\nFloor 3' });
      expect(result).toBe('Floor 3');
    });

    it('should show default [Address Line 1] when no address data for Address1', () => {
      const result = service.replaceTemplatePlaceholders('&&Address1&&', {});
      expect(result).toBe('[Address Line 1]');
    });

    it('should show default [Address Line 2] when no address data for Address2', () => {
      const result = service.replaceTemplatePlaceholders('&&Address2&&', {});
      expect(result).toBe('[Address Line 2]');
    });

    it('should show default [Address Line 1] when no address data for DonorAddress1', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorAddress1&&', {});
      expect(result).toBe('[Address Line 1]');
    });

    it('should show default [Address Line 2] when no address data for DonorAddress2', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorAddress2&&', {});
      expect(result).toBe('[Address Line 2]');
    });

    it('should handle comma-separated address for address lines when no newlines', () => {
      const result = service.replaceTemplatePlaceholders('&&Address1&& / &&Address2&&', { address: '123 Main St, Apt 4B' });
      expect(result).toBe('123 Main St / Apt 4B');
    });

    it('should return empty for address line index out of bounds', () => {
      // Address2 from a single-line, non-comma address has no line at index 1
      const result = service.replaceTemplatePlaceholders('&&Address2&&', { address: '123 Main St' });
      expect(result).toBe('[Address Line 2]');
    });

    // -- City --
    it('should replace City from city field', () => {
      const result = service.replaceTemplatePlaceholders('&&City&&', { city: 'Springfield' });
      expect(result).toBe('Springfield');
    });

    it('should extract city from formatted address with 3+ parts', () => {
      const result = service.replaceTemplatePlaceholders('&&City&&', { address: '123 Main St, Springfield, IL 62704' });
      expect(result).toBe('Springfield');
    });

    it('should return default [City] when address has fewer than 3 parts', () => {
      const result = service.replaceTemplatePlaceholders('&&City&&', { address: '123 Main St' });
      expect(result).toBe('[City]');
    });

    it('should return default [City] for address with exactly 2 parts', () => {
      const result = service.replaceTemplatePlaceholders('&&City&&', { address: '123 Main St, IL 62704' });
      // Only 2 parts -> extractCityFromAddress returns '' -> falls through to default
      expect(result).toBe('[City]');
    });

    // -- State --
    it('should replace State from state field', () => {
      const result = service.replaceTemplatePlaceholders('&&State&&', { state: 'IL' });
      expect(result).toBe('IL');
    });

    it('should extract state from formatted address', () => {
      const result = service.replaceTemplatePlaceholders('&&State&&', { address: '123 Main St, Springfield, IL 62704' });
      expect(result).toBe('IL');
    });

    it('should return default [State] when address has no state pattern', () => {
      const result = service.replaceTemplatePlaceholders('&&State&&', { address: '123 Main St' });
      expect(result).toBe('[State]');
    });

    it('should return default [State] when last part has no state abbreviation pattern', () => {
      // 2+ parts but last part does not start with 2 uppercase letters followed by a digit
      const result = service.replaceTemplatePlaceholders('&&State&&', { address: '123 Main St, Springfield' });
      expect(result).toBe('[State]');
    });

    // -- ZipCode / Zip --
    it('should replace ZipCode from zipCode field', () => {
      const result = service.replaceTemplatePlaceholders('&&ZipCode&&', { zipCode: '62704' });
      expect(result).toBe('62704');
    });

    it('should replace ZipCode from zip field', () => {
      const result = service.replaceTemplatePlaceholders('&&ZipCode&&', { zip: '90210' });
      expect(result).toBe('90210');
    });

    it('should replace ZipCode from postalCode field', () => {
      const result = service.replaceTemplatePlaceholders('&&ZipCode&&', { postalCode: '10001' });
      expect(result).toBe('10001');
    });

    it('should show default [Zip Code] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&ZipCode&&', {});
      expect(result).toBe('[Zip Code]');
    });

    it('should replace Zip from postalCode field', () => {
      const result = service.replaceTemplatePlaceholders('&&Zip&&', { postalCode: '62704' });
      expect(result).toBe('62704');
    });

    it('should show default [Zip] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Zip&&', {});
      expect(result).toBe('[Zip]');
    });

    it('should extract zip from formatted address', () => {
      const result = service.replaceTemplatePlaceholders('&&ZipCode&&', { address: '123 Main St, Springfield, IL 62704' });
      expect(result).toBe('62704');
    });

    it('should extract zip+4 from formatted address', () => {
      const result = service.replaceTemplatePlaceholders('&&ZipCode&&', { address: '123 Main St, Springfield, IL 62704-1234' });
      expect(result).toBe('62704-1234');
    });

    // -- Country --
    it('should replace Country from country field', () => {
      const result = service.replaceTemplatePlaceholders('&&Country&&', { country: 'US' });
      expect(result).toBe('US');
    });

    it('should show default [Country] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Country&&', {});
      expect(result).toBe('[Country]');
    });

    // -- Phone / HomePhone / WorkPhone --
    it('should replace HomePhone from homePhone field', () => {
      const result = service.replaceTemplatePlaceholders('&&HomePhone&&', { homePhone: '555-1234' });
      expect(result).toBe('555-1234');
    });

    it('should replace HomePhone from phone field', () => {
      const result = service.replaceTemplatePlaceholders('&&HomePhone&&', { phone: '555-0000' });
      expect(result).toBe('555-0000');
    });

    it('should show default [Home Phone] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&HomePhone&&', {});
      expect(result).toBe('[Home Phone]');
    });

    it('should replace WorkPhone from workPhone field', () => {
      const result = service.replaceTemplatePlaceholders('&&WorkPhone&&', { workPhone: '555-5678' });
      expect(result).toBe('555-5678');
    });

    it('should replace WorkPhone from businessPhone field', () => {
      const result = service.replaceTemplatePlaceholders('&&WorkPhone&&', { businessPhone: '555-9999' });
      expect(result).toBe('555-9999');
    });

    it('should show default [Work Phone] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&WorkPhone&&', {});
      expect(result).toBe('[Work Phone]');
    });

    it('should replace Phone from homePhone field', () => {
      const result = service.replaceTemplatePlaceholders('&&Phone&&', { homePhone: '555-1111' });
      expect(result).toBe('555-1111');
    });

    it('should replace Phone from phone field', () => {
      const result = service.replaceTemplatePlaceholders('&&Phone&&', { phone: '555-2222' });
      expect(result).toBe('555-2222');
    });

    it('should replace Phone falling through to workPhone field', () => {
      const result = service.replaceTemplatePlaceholders('&&Phone&&', { workPhone: '555-3333' });
      expect(result).toBe('555-3333');
    });

    it('should show default [Phone] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Phone&&', {});
      expect(result).toBe('[Phone]');
    });

    // -- Email --
    it('should replace Email from email field', () => {
      const result = service.replaceTemplatePlaceholders('&&Email&&', { email: 'test@example.com' });
      expect(result).toBe('test@example.com');
    });

    it('should replace Email from emailAddress field', () => {
      const result = service.replaceTemplatePlaceholders('&&Email&&', { emailAddress: 'alt@example.com' });
      expect(result).toBe('alt@example.com');
    });

    it('should show default [Email] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Email&&', {});
      expect(result).toBe('[Email]');
    });

    // -- ABO / BloodType --
    it('should replace ABO from aboType field', () => {
      const result = service.replaceTemplatePlaceholders('&&ABO&&', { aboType: 'O POS' });
      expect(result).toBe('O POS');
    });

    it('should replace ABO from bloodType field', () => {
      const result = service.replaceTemplatePlaceholders('&&ABO&&', { bloodType: 'A NEG' });
      expect(result).toBe('A NEG');
    });

    it('should replace ABO from abo field', () => {
      const result = service.replaceTemplatePlaceholders('&&ABO&&', { abo: 'B POS' });
      expect(result).toBe('B POS');
    });

    it('should show default [Blood Type] when ABO data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&ABO&&', {});
      expect(result).toBe('[Blood Type]');
    });

    it('should replace BloodType from aboType field', () => {
      const result = service.replaceTemplatePlaceholders('&&BloodType&&', { aboType: 'AB+' });
      expect(result).toBe('AB+');
    });

    it('should replace BloodType from bloodType field', () => {
      const result = service.replaceTemplatePlaceholders('&&BloodType&&', { bloodType: 'AB-' });
      expect(result).toBe('AB-');
    });

    it('should show default [Blood Type] when BloodType data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&BloodType&&', {});
      expect(result).toBe('[Blood Type]');
    });

    // -- DonationType --
    it('should replace DonationType from donationType field', () => {
      const result = service.replaceTemplatePlaceholders('&&DonationType&&', { donationType: 'WB' });
      expect(result).toBe('WB');
    });

    it('should replace DonationType from procedureType field', () => {
      const result = service.replaceTemplatePlaceholders('&&DonationType&&', { procedureType: 'APHERESIS' });
      expect(result).toBe('APHERESIS');
    });

    it('should show default [Donation Type] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&DonationType&&', {});
      expect(result).toBe('[Donation Type]');
    });

    // -- ProcedureCode --
    it('should replace ProcedureCode from procedureCode field', () => {
      const result = service.replaceTemplatePlaceholders('&&ProcedureCode&&', { procedureCode: 'PC1' });
      expect(result).toBe('PC1');
    });

    it('should replace ProcedureCode from procedure field', () => {
      const result = service.replaceTemplatePlaceholders('&&ProcedureCode&&', { procedure: 'PROC-2' });
      expect(result).toBe('PROC-2');
    });

    it('should show default [Procedure Code] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&ProcedureCode&&', {});
      expect(result).toBe('[Procedure Code]');
    });

    // -- DonationDate --
    it('should replace DonationDate from donationDate field', () => {
      const result = service.replaceTemplatePlaceholders('&&DonationDate&&', { donationDate: '01/15/2024' });
      expect(result).toBe('01/15/2024');
    });

    it('should show default [Donation Date] when data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&DonationDate&&', {});
      expect(result).toBe('[Donation Date]');
    });

    // -- HBC / AntiHBC --
    it('should replace HBC from hbc field', () => {
      const result = service.replaceTemplatePlaceholders('&&HBC&&', { hbc: 'Negative' });
      expect(result).toBe('Negative');
    });

    it('should replace HBC from antiHBC field', () => {
      const result = service.replaceTemplatePlaceholders('&&HBC&&', { antiHBC: 'Positive' });
      expect(result).toBe('Positive');
    });

    it('should show default [Test Result] when HBC data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&HBC&&', {});
      expect(result).toBe('[Test Result]');
    });

    it('should replace AntiHBC from antiHBC field', () => {
      const result = service.replaceTemplatePlaceholders('&&AntiHBC&&', { antiHBC: 'Positive' });
      expect(result).toBe('Positive');
    });

    it('should replace AntiHBC from hbc field', () => {
      const result = service.replaceTemplatePlaceholders('&&AntiHBC&&', { hbc: 'Negative' });
      expect(result).toBe('Negative');
    });

    it('should show default [Test Result] when AntiHBC data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&AntiHBC&&', {});
      expect(result).toBe('[Test Result]');
    });

    // -- TestResult / Result --
    it('should replace TestResult from testResult field', () => {
      const result = service.replaceTemplatePlaceholders('&&TestResult&&', { testResult: 'Pass' });
      expect(result).toBe('Pass');
    });

    it('should show default [Test Result] when TestResult data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&TestResult&&', {});
      expect(result).toBe('[Test Result]');
    });

    it('should replace Result from result field', () => {
      const result = service.replaceTemplatePlaceholders('&&Result&&', { result: 'Negative' });
      expect(result).toBe('Negative');
    });

    it('should replace Result from testResult field', () => {
      const result = service.replaceTemplatePlaceholders('&&Result&&', { testResult: 'Positive' });
      expect(result).toBe('Positive');
    });

    it('should show default [Result] when Result data empty', () => {
      const result = service.replaceTemplatePlaceholders('&&Result&&', {});
      expect(result).toBe('[Result]');
    });

    // -- multiple placeholders in one template --
    it('should replace multiple placeholders in a single template', () => {
      const template = 'Dear &&Name&&, Your ID is &&DonorId&& and blood type is &&ABO&&.';
      const data = { name: 'John Doe', donorId: 'D12345', aboType: 'O POS' };
      const result = service.replaceTemplatePlaceholders(template, data);

      expect(result).toBe('Dear John Doe, Your ID is D12345 and blood type is O POS.');
    });

    // -- case-insensitive placeholder matching --
    it('should match placeholders case-insensitively against the variable mapping', () => {
      const result = service.replaceTemplatePlaceholders('Dear &&DONORNAME&&,', { name: 'Jane Smith' });
      expect(result).toBe('Dear Jane Smith,');
    });

    it('should match mixed-case placeholder against mapping', () => {
      const result = service.replaceTemplatePlaceholders('&&donorname&&', { name: 'Test' });
      expect(result).toBe('Test');
    });

    // -- custom mapping --
    it('should use custom mapping when provided', () => {
      const customMapping = { CustomField: () => 'Custom Value' };
      const result = service.replaceTemplatePlaceholders('Custom: &&CustomField&&', null, customMapping);

      expect(result).toBe('Custom: Custom Value');
    });

    it('should let custom mapping override built-in mapping', () => {
      const data = { name: 'John Doe' };
      const customMapping = { Name: () => 'Custom Name' };
      const result = service.replaceTemplatePlaceholders('Name: &&Name&&', data, customMapping);

      expect(result).toBe('Name: Custom Name');
    });

    // -- unmatched placeholder --
    it('should keep placeholder unchanged if no mapping or data match', () => {
      const result = service.replaceTemplatePlaceholders('Unknown: &&UnknownField&&', null);
      expect(result).toBe('Unknown: &&UnknownField&&');
    });

    it('should keep placeholder if data is provided but key does not exist', () => {
      const result = service.replaceTemplatePlaceholders('&&NoSuchKey&&', { otherKey: 'val' });
      expect(result).toBe('&&NoSuchKey&&');
    });

    // -- direct data object lookup for unmapped placeholders --
    it('should resolve unmapped placeholder directly from data object', () => {
      const result = service.replaceTemplatePlaceholders('&&customProp&&', { customProp: 'myVal' });
      expect(result).toBe('myVal');
    });

    it('should resolve unmapped placeholder case-insensitively from data object', () => {
      // The placeholder variableName is "myField" but data key is "MyField"
      const result = service.replaceTemplatePlaceholders('&&myField&&', { MyField: 'caseVal' });
      expect(result).toBe('caseVal');
    });

    // -- getValue: case-insensitive key resolution on data --
    it('should resolve mapped placeholder via case-insensitive data key match', () => {
      // DonorName maps to keys ['name', 'donorName', 'fullName']
      // Data has 'Name' (capital N) which should match case-insensitively
      const result = service.replaceTemplatePlaceholders('&&DonorName&&', { Name: 'CaseTest' });
      expect(result).toBe('CaseTest');
    });

    // -- getValue: non-string data values converted to String --
    it('should convert numeric data values to strings', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorId&&', { donorId: 42 });
      expect(result).toBe('42');
    });

    it('should convert boolean data values to strings', () => {
      const result = service.replaceTemplatePlaceholders('&&customBool&&', { customBool: true });
      expect(result).toBe('true');
    });

    it('should handle zero as a valid value (not falsy)', () => {
      const result = service.replaceTemplatePlaceholders('&&customZero&&', { customZero: 0 });
      expect(result).toBe('0');
    });

    // -- getValue: null / undefined values in data should not match --
    it('should not match null values in data and fall through to default', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorId&&', { donorId: null, id: 'FALLBACK' });
      expect(result).toBe('FALLBACK');
    });

    it('should not match undefined values in data and fall through to default', () => {
      const result = service.replaceTemplatePlaceholders('&&DonorId&&', { donorId: undefined, id: 'FALLBACK2' });
      expect(result).toBe('FALLBACK2');
    });
  });

  // ---------------------------------------------------------------------------
  // formatDate
  // ---------------------------------------------------------------------------
  describe('formatDate', () => {
    it('should format date as MM/DD/YYYY by default', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024 (local time, avoids TZ issues)
      expect(service.formatDate(date)).toBe('03/15/2024');
    });

    it('should format date as DD/MM/YYYY', () => {
      const date = new Date(2024, 2, 15);
      expect(service.formatDate(date, 'DD/MM/YYYY')).toBe('15/03/2024');
    });

    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2024, 2, 15);
      expect(service.formatDate(date, 'YYYY-MM-DD')).toBe('2024-03-15');
    });

    it('should format date as MMMM DD, YYYY', () => {
      const date = new Date(2024, 2, 15);
      expect(service.formatDate(date, 'MMMM DD, YYYY')).toBe('March 15, 2024');
    });

    it('should format all twelve months correctly for MMMM DD, YYYY', () => {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
      ];
      for (let m = 0; m < 12; m++) {
        const date = new Date(2024, m, 1);
        expect(service.formatDate(date, 'MMMM DD, YYYY')).toBe(`${monthNames[m]} 01, 2024`);
      }
    });

    it('should handle string date input', () => {
      const result = service.formatDate('2024-03-15');
      expect(result).toMatch(/03\/15\/2024/);
    });

    it('should return [Invalid Date] for invalid date string', () => {
      expect(service.formatDate('not-a-date')).toBe('[Invalid Date]');
    });

    it('should return [Invalid Date] for invalid Date object', () => {
      expect(service.formatDate(new Date(NaN))).toBe('[Invalid Date]');
    });

    it('should fall back to MM/DD/YYYY for unknown format string', () => {
      const date = new Date(2024, 2, 15);
      expect(service.formatDate(date, 'UNKNOWN')).toBe('03/15/2024');
    });

    it('should handle format string case-insensitively', () => {
      const date = new Date(2024, 2, 15);
      // 'yyyy-mm-dd' should be uppercased internally and match 'YYYY-MM-DD'
      expect(service.formatDate(date, 'yyyy-mm-dd')).toBe('2024-03-15');
    });

    it('should pad single-digit months and days with leading zeros', () => {
      const date = new Date(2024, 0, 5); // January 5
      expect(service.formatDate(date)).toBe('01/05/2024');
    });
  });

  // ---------------------------------------------------------------------------
  // validateTemplate
  // ---------------------------------------------------------------------------
  describe('validateTemplate', () => {
    it('should return array of unresolved placeholders including delimiters', () => {
      const result = service.validateTemplate('Dear &&Name&&, your ID is &&DonorId&&.');
      expect(result).toEqual(['&&Name&&', '&&DonorId&&']);
    });

    it('should return empty array when no placeholders exist', () => {
      expect(service.validateTemplate('No placeholders here.')).toEqual([]);
    });

    it('should find placeholders with underscores and numbers', () => {
      const result = service.validateTemplate('&&Field_1&& and &&Test123&&');
      expect(result).toEqual(['&&Field_1&&', '&&Test123&&']);
    });

    it('should handle template with only placeholders', () => {
      const result = service.validateTemplate('&&A&&&&B&&');
      expect(result).toEqual(['&&A&&', '&&B&&']);
    });

    it('should handle empty template', () => {
      expect(service.validateTemplate('')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // extractPlaceholders
  // ---------------------------------------------------------------------------
  describe('extractPlaceholders', () => {
    it('should extract placeholder variable names without delimiters', () => {
      const result = service.extractPlaceholders('Dear &&Name&&, your ID is &&DonorId&&.');
      expect(result).toEqual(['Name', 'DonorId']);
    });

    it('should return empty array when no placeholders', () => {
      expect(service.extractPlaceholders('No placeholders here.')).toEqual([]);
    });

    it('should extract placeholders with numbers and underscores', () => {
      const result = service.extractPlaceholders('Field: &&Field_1&& and &&Test123&&');
      expect(result).toEqual(['Field_1', 'Test123']);
    });

    it('should handle adjacent placeholders', () => {
      const result = service.extractPlaceholders('&&A&&&&B&&');
      expect(result).toEqual(['A', 'B']);
    });

    it('should handle empty template', () => {
      expect(service.extractPlaceholders('')).toEqual([]);
    });

    it('should not extract partial delimiters like &Name& or &&&Name&&&', () => {
      // Only &&...&& pattern should match; single & or triple &&& are not valid
      const result = service.extractPlaceholders('&Name& and &&&Extra&&&');
      // &&&Extra&&& contains &&Extra&& inside it, so that should still match
      expect(result).toContain('Extra');
      expect(result).not.toContain('Name');
    });
  });

  // ---------------------------------------------------------------------------
  // Private helper coverage via replaceTemplatePlaceholders
  // ---------------------------------------------------------------------------
  describe('private helper: getAddressLine', () => {
    it('should split newline-separated address and return first line', () => {
      const result = service.replaceTemplatePlaceholders('&&Address1&&', { address: 'Line1\nLine2\nLine3' });
      expect(result).toBe('Line1');
    });

    it('should split newline-separated address and return second line', () => {
      const result = service.replaceTemplatePlaceholders('&&Address2&&', { address: 'Line1\nLine2\nLine3' });
      expect(result).toBe('Line2');
    });

    it('should split comma-separated address when no newlines and return correct parts', () => {
      const result = service.replaceTemplatePlaceholders('&&Address1&&', { address: 'PartA, PartB, PartC' });
      expect(result).toBe('PartA');
    });

    it('should return empty string when lineIndex exceeds comma-separated parts', () => {
      // Only one part after splitting (no commas, no newlines): index 1 is out of bounds
      const result = service.replaceTemplatePlaceholders('&&Address2&&', { address: 'SingleLine' });
      expect(result).toBe('[Address Line 2]');
    });

    it('should filter out blank lines from address', () => {
      const result = service.replaceTemplatePlaceholders('&&Address1&&', { address: '\n\n  123 Main St  \n\n' });
      expect(result).toBe('123 Main St');
    });
  });

  describe('private helper: extractCityFromAddress', () => {
    it('should extract second-to-last part when 3+ comma-separated parts', () => {
      const result = service.replaceTemplatePlaceholders('&&City&&', { address: '123 Main, Springfield, IL 62704' });
      expect(result).toBe('Springfield');
    });

    it('should return default [City] when address has 2 comma parts', () => {
      const result = service.replaceTemplatePlaceholders('&&City&&', { address: 'Springfield, IL 62704' });
      expect(result).toBe('[City]');
    });

    it('should return default [City] when address has 1 part', () => {
      const result = service.replaceTemplatePlaceholders('&&City&&', { address: '123 Main St' });
      expect(result).toBe('[City]');
    });
  });

  describe('private helper: extractStateFromAddress', () => {
    it('should extract 2-letter state abbreviation from last comma-part', () => {
      const result = service.replaceTemplatePlaceholders('&&State&&', { address: '123 Main, Springfield, IL 62704' });
      expect(result).toBe('IL');
    });

    it('should return default when last part starts with lowercase', () => {
      const result = service.replaceTemplatePlaceholders('&&State&&', { address: '123 Main, il 62704' });
      expect(result).toBe('[State]');
    });

    it('should return default when last part has no digits after state', () => {
      const result = service.replaceTemplatePlaceholders('&&State&&', { address: '123 Main, Springfield' });
      expect(result).toBe('[State]');
    });

    it('should return default for single-part address', () => {
      const result = service.replaceTemplatePlaceholders('&&State&&', { address: 'OnePart' });
      expect(result).toBe('[State]');
    });
  });

  describe('private helper: extractZipFromAddress', () => {
    it('should extract 5-digit zip from end of address', () => {
      const result = service.replaceTemplatePlaceholders('&&Zip&&', { address: '123 Main St, Springfield, IL 62704' });
      expect(result).toBe('62704');
    });

    it('should extract zip+4 from end of address', () => {
      const result = service.replaceTemplatePlaceholders('&&Zip&&', { address: '123 Main, Springfield, IL 62704-1234' });
      expect(result).toBe('62704-1234');
    });

    it('should use fallback alphanumeric regex for non-US postal codes', () => {
      // No 5-digit zip at end, but "M5V 2T6" matches the fallback /\b([A-Z0-9]{3,}\s*[A-Z0-9]*)\s*$/
      const result = service.replaceTemplatePlaceholders('&&Zip&&', { address: '100 Queen St, Toronto, ON M5V 2T6' });
      expect(result).toBe('M5V 2T6');
    });

    it('should return default [Zip] when no zip pattern matches at all', () => {
      // "123 Main St" has no 5-digit zip and lowercase letters prevent fallback regex match
      const result = service.replaceTemplatePlaceholders('&&Zip&&', { address: '123 Main St' });
      expect(result).toBe('[Zip]');
    });

    it('should return default [Zip] when address is entirely non-alphanumeric', () => {
      const result = service.replaceTemplatePlaceholders('&&Zip&&', { address: '---' });
      expect(result).toBe('[Zip]');
    });
  });
});
