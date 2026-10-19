import { TestBed } from '@angular/core/testing';
import { UnitValidationService, UnitValidationResult, UnitRegistrationResponse } from './unit-validation.service';
import { ApiService } from '@shared/services/api.service';
import { ErrorCodeService } from './error-code.service';
import { of, throwError } from 'rxjs';

describe('UnitValidationService', () => {
  let service: UnitValidationService;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let errorCodeServiceSpy: jasmine.SpyObj<ErrorCodeService>;

  beforeEach(() => {
    apiServiceSpy = jasmine.createSpyObj('ApiService', ['get', 'post']);
    errorCodeServiceSpy = jasmine.createSpyObj('ErrorCodeService', ['getErrorMessage']);

    // Default error message stub
    errorCodeServiceSpy.getErrorMessage.and.callFake((code: string) => {
      const messages: { [key: string]: string } = {
        '16206': 'Invalid ISBT unit prefix',
        '16211': 'ISBT unit ID characters 6-8 must be numeric',
        'REQUIRED_FIELD': 'This field is required',
        'DUPLICATE_UNIT': 'This unit is already linked to this patient',
        'INVALID_UNIT_PATIENT': 'This unit cannot be linked to the selected patient'
      };
      return messages[code] || 'An error occurred. Please try again.';
    });

    TestBed.configureTestingModule({
      providers: [
        UnitValidationService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ErrorCodeService, useValue: errorCodeServiceSpy }
      ]
    });

    service = TestBed.inject(UnitValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // detectUnitFormat
  // ---------------------------------------------------------------------------
  describe('detectUnitFormat', () => {
    it('should return CODABAR for empty string', () => {
      expect(service.detectUnitFormat('')).toBe('CODABAR');
    });

    it('should return CODABAR for null/undefined input', () => {
      expect(service.detectUnitFormat(null as any)).toBe('CODABAR');
      expect(service.detectUnitFormat(undefined as any)).toBe('CODABAR');
    });

    it('should return ISBT for 13-char ID starting with 5 uppercase letters', () => {
      // ABCDE + 8 digits = 13 chars
      expect(service.detectUnitFormat('ABCDE12345678')).toBe('ISBT');
    });

    it('should return ISBT for 15-char ID starting with 5 uppercase letters', () => {
      // ABCDE + 8 digits + 2 check digits = 15 chars
      expect(service.detectUnitFormat('ABCDE1234567899')).toBe('ISBT');
    });

    it('should return CODABAR for 13-char ID that does not start with 5 uppercase letters', () => {
      expect(service.detectUnitFormat('1234567890123')).toBe('CODABAR');
    });

    it('should return CODABAR for 13-char ID with lowercase prefix', () => {
      expect(service.detectUnitFormat('abcde12345678')).toBe('CODABAR');
    });

    it('should return CODABAR for IDs of length other than 13 or 15', () => {
      expect(service.detectUnitFormat('ABCDE1234')).toBe('CODABAR');
      expect(service.detectUnitFormat('ABCDE123456789012')).toBe('CODABAR');
      expect(service.detectUnitFormat('U001234')).toBe('CODABAR');
    });

    it('should return CODABAR for a short alphanumeric unit', () => {
      expect(service.detectUnitFormat('W123')).toBe('CODABAR');
    });
  });

  // ---------------------------------------------------------------------------
  // validateISBTFormat
  // ---------------------------------------------------------------------------
  describe('validateISBTFormat', () => {
    it('should return valid for a correct 13-char ISBT unit', () => {
      const result = service.validateISBTFormat('ABCDE12345678');

      expect(result.isValid).toBe(true);
      expect(result.unitId).toBe('ABCDE12345678');
      expect(result.checkDigit).toBeUndefined();
      expect(result.formatType).toBe('ISBT');
    });

    it('should return valid for a correct 15-char ISBT unit and extract check digit', () => {
      const result = service.validateISBTFormat('ABCDE1234567899');

      expect(result.isValid).toBe(true);
      expect(result.unitId).toBe('ABCDE12345678');
      expect(result.checkDigit).toBe('99');
      expect(result.formatType).toBe('ISBT');
    });

    it('should return invalid for unit with wrong length', () => {
      const result = service.validateISBTFormat('ABCDE1234');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_UNIT_FORMAT');
    });

    it('should return invalid for 14-char unit', () => {
      const result = service.validateISBTFormat('ABCDE123456789');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_UNIT_FORMAT');
    });

    it('should return invalid when prefix is not 5 uppercase letters', () => {
      const result = service.validateISBTFormat('ABcd312345678');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('16206');
      expect(errorCodeServiceSpy.getErrorMessage).toHaveBeenCalledWith('16206');
    });

    it('should return invalid when numeric portion contains letters', () => {
      const result = service.validateISBTFormat('ABCDE1234X678');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('16211');
      expect(errorCodeServiceSpy.getErrorMessage).toHaveBeenCalledWith('16211');
    });

    it('should return invalid when numeric portion has spaces', () => {
      const result = service.validateISBTFormat('ABCDE1234 678');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('16211');
    });
  });

  // ---------------------------------------------------------------------------
  // validateCodabarFormat
  // ---------------------------------------------------------------------------
  describe('validateCodabarFormat', () => {
    it('should return valid for a single character unit', () => {
      const result = service.validateCodabarFormat('A');

      expect(result.isValid).toBe(true);
      expect(result.unitId).toBe('A');
      expect(result.formatType).toBe('CODABAR');
    });

    it('should return valid for a 16-character unit', () => {
      const result = service.validateCodabarFormat('1234567890123456');

      expect(result.isValid).toBe(true);
      expect(result.unitId).toBe('1234567890123456');
      expect(result.formatType).toBe('CODABAR');
    });

    it('should return valid for typical short unit IDs', () => {
      const result = service.validateCodabarFormat('U001234');

      expect(result.isValid).toBe(true);
      expect(result.unitId).toBe('U001234');
    });

    it('should return invalid when unit exceeds 16 characters', () => {
      const result = service.validateCodabarFormat('12345678901234567');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_UNIT_FORMAT');
    });

    it('should return invalid for empty string', () => {
      const result = service.validateCodabarFormat('');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('INVALID_UNIT_FORMAT');
    });
  });

  // ---------------------------------------------------------------------------
  // validateUnitFormat
  // ---------------------------------------------------------------------------
  describe('validateUnitFormat', () => {
    it('should return invalid for null input', () => {
      const result = service.validateUnitFormat(null as any);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('REQUIRED_FIELD');
      expect(errorCodeServiceSpy.getErrorMessage).toHaveBeenCalledWith('REQUIRED_FIELD');
    });

    it('should return invalid for undefined input', () => {
      const result = service.validateUnitFormat(undefined as any);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('REQUIRED_FIELD');
    });

    it('should return invalid for empty string', () => {
      const result = service.validateUnitFormat('');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('REQUIRED_FIELD');
    });

    it('should return invalid for whitespace-only string', () => {
      const result = service.validateUnitFormat('   ');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('REQUIRED_FIELD');
    });

    it('should return valid for manual entry mode "M"', () => {
      const result = service.validateUnitFormat('M');

      expect(result.isValid).toBe(true);
      expect(result.unitId).toBe('M');
      expect(result.formatType).toBe('CODABAR');
    });

    it('should return valid for lowercase manual entry mode "m"', () => {
      const result = service.validateUnitFormat('m');

      expect(result.isValid).toBe(true);
      expect(result.unitId).toBe('M');
      expect(result.formatType).toBe('CODABAR');
    });

    it('should validate ISBT format for a 13-char unit with uppercase prefix', () => {
      const result = service.validateUnitFormat('ABCDE12345678');

      expect(result.isValid).toBe(true);
      expect(result.formatType).toBe('ISBT');
      expect(result.unitId).toBe('ABCDE12345678');
    });

    it('should validate ISBT format for a 15-char unit and extract check digit', () => {
      const result = service.validateUnitFormat('ABCDE1234567899');

      expect(result.isValid).toBe(true);
      expect(result.formatType).toBe('ISBT');
      expect(result.checkDigit).toBe('99');
    });

    it('should uppercase and trim input before validation', () => {
      const result = service.validateUnitFormat('  abcde12345678  ');

      expect(result.isValid).toBe(true);
      expect(result.formatType).toBe('ISBT');
      expect(result.unitId).toBe('ABCDE12345678');
    });

    it('should validate Codabar format for short alphanumeric unit IDs', () => {
      const result = service.validateUnitFormat('U001234');

      expect(result.isValid).toBe(true);
      expect(result.formatType).toBe('CODABAR');
      expect(result.unitId).toBe('U001234');
    });

    it('should return invalid for ISBT unit with bad numeric portion', () => {
      const result = service.validateUnitFormat('ABCDE1234X678');

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('16211');
    });
  });

  // ---------------------------------------------------------------------------
  // checkDuplicateUnit
  // ---------------------------------------------------------------------------
  describe('checkDuplicateUnit', () => {
    const existingUnits = [
      { unitId: 'W123', collectionDate: '2026-05-20' },
      { unitId: 'U001234', collectionDate: '2026-05-18' }
    ];

    it('should return invalid when unit ID is a duplicate (exact match)', () => {
      const result = service.checkDuplicateUnit('W123', 'PAT001', 'SURG001', '1', existingUnits);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_UNIT');
      expect(errorCodeServiceSpy.getErrorMessage).toHaveBeenCalledWith('DUPLICATE_UNIT');
    });

    it('should detect duplicates case-insensitively', () => {
      const result = service.checkDuplicateUnit('w123', 'PAT001', 'SURG001', '1', existingUnits);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_UNIT');
    });

    it('should detect duplicates with uppercase input against lowercase existing', () => {
      const lowerUnits = [{ unitId: 'u001234', collectionDate: '2026-05-18' }];
      const result = service.checkDuplicateUnit('U001234', 'PAT001', 'SURG001', '1', lowerUnits);

      expect(result.isValid).toBe(false);
      expect(result.errorCode).toBe('DUPLICATE_UNIT');
    });

    it('should return valid when unit is not a duplicate', () => {
      const result = service.checkDuplicateUnit('W999', 'PAT001', 'SURG001', '1', existingUnits);

      expect(result.isValid).toBe(true);
    });

    it('should return valid when existing linked units list is empty', () => {
      const result = service.checkDuplicateUnit('W123', 'PAT001', 'SURG001', '1', []);

      expect(result.isValid).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // checkUnitRegistration (mock mode)
  // ---------------------------------------------------------------------------
  describe('checkUnitRegistration', () => {
    it('should return registered data for known unit U001234', (done) => {
      service.checkUnitRegistration('U001234', '1').subscribe({
        next: (result: UnitRegistrationResponse) => {
          expect(result.isRegistered).toBe(true);
          expect(result.unitId).toBe('U001234');
          expect(result.donorId).toBe('D001');
          expect(result.donorName).toBe('Donor, John');
          expect(result.collectionDate).toBe('2026-05-20');
          expect(result.source).toBe('DONATIONS');
          done();
        }
      });
    });

    it('should return registered data for known unit U002567', (done) => {
      service.checkUnitRegistration('U002567', '1').subscribe({
        next: (result: UnitRegistrationResponse) => {
          expect(result.isRegistered).toBe(true);
          expect(result.unitId).toBe('U002567');
          expect(result.donorName).toBe('Smith, Jane');
          done();
        }
      });
    });

    it('should return registered data for known unit U005678', (done) => {
      service.checkUnitRegistration('U005678', '1').subscribe({
        next: (result: UnitRegistrationResponse) => {
          expect(result.isRegistered).toBe(true);
          expect(result.unitId).toBe('U005678');
          expect(result.donorName).toBe('Wilson, Bob');
          done();
        }
      });
    });

    it('should return registered data with multiple collection dates for U999999', (done) => {
      service.checkUnitRegistration('U999999', '1').subscribe({
        next: (result: UnitRegistrationResponse) => {
          expect(result.isRegistered).toBe(true);
          expect(result.collectionDates).toBeDefined();
          expect(result.collectionDates!.length).toBe(3);
          expect(result.source).toBe('BOTH');
          done();
        }
      });
    });

    it('should return not registered for unknown unit', (done) => {
      service.checkUnitRegistration('UNKNOWN', '1').subscribe({
        next: (result: UnitRegistrationResponse) => {
          expect(result.isRegistered).toBe(false);
          expect(result.unitId).toBe('UNKNOWN');
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // validatePatientUnitRelationship (mock mode)
  // ---------------------------------------------------------------------------
  describe('validatePatientUnitRelationship', () => {
    it('should return valid in mock mode', (done) => {
      service.validatePatientUnitRelationship('U001234', 'PAT001', 'SURG001', '1').subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(true);
          done();
        }
      });
    });

    it('should return valid for any unit/patient combination in mock mode', (done) => {
      service.validatePatientUnitRelationship('ANYTHING', 'ANY_PAT', 'ANY_SURG', '99').subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(true);
          done();
        }
      });
    });
  });

  // ---------------------------------------------------------------------------
  // validateUnit (full pipeline)
  // ---------------------------------------------------------------------------
  describe('validateUnit', () => {
    const existingLinkedUnits = [
      { unitId: 'W123', collectionDate: '2026-05-20' }
    ];

    it('should return invalid immediately when format validation fails', (done) => {
      service.validateUnit('', 'PAT001', 'SURG001', '1', existingLinkedUnits).subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('REQUIRED_FIELD');
          done();
        }
      });
    });

    it('should return invalid when unit is a duplicate', (done) => {
      service.validateUnit('W123', 'PAT001', 'SURG001', '1', existingLinkedUnits).subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('DUPLICATE_UNIT');
          done();
        }
      });
    });

    it('should return valid with registration data for a non-duplicate registered unit', (done) => {
      service.validateUnit('U001234', 'PAT001', 'SURG001', '1', []).subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.unitId).toBe('U001234');
          expect(result.isRegistered).toBe(true);
          expect(result.collectionDate).toBe('2026-05-20');
          expect(result.donorId).toBe('D001');
          expect(result.donorName).toBe('Donor, John');
          done();
        }
      });
    });

    it('should return valid with unregistered status for an unknown unit', (done) => {
      service.validateUnit('W999', 'PAT001', 'SURG001', '1', []).subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.isRegistered).toBe(false);
          done();
        }
      });
    });

    it('should validate ISBT unit through the full pipeline', (done) => {
      service.validateUnit('ABCDE12345678', 'PAT001', 'SURG001', '1', []).subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.formatType).toBe('ISBT');
          expect(result.unitId).toBe('ABCDE12345678');
          expect(result.isRegistered).toBe(false);
          done();
        }
      });
    });

    it('should validate ISBT unit with check digit through the full pipeline', (done) => {
      service.validateUnit('ABCDE1234567899', 'PAT001', 'SURG001', '1', []).subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.formatType).toBe('ISBT');
          expect(result.checkDigit).toBe('99');
          done();
        }
      });
    });

    it('should return invalid for ISBT unit with bad numeric portion', (done) => {
      service.validateUnit('ABCDE1234X678', 'PAT001', 'SURG001', '1', []).subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(false);
          expect(result.errorCode).toBe('16211');
          done();
        }
      });
    });

    it('should handle manual entry mode through the pipeline', (done) => {
      service.validateUnit('M', 'PAT001', 'SURG001', '1', []).subscribe({
        next: (result: UnitValidationResult) => {
          expect(result.isValid).toBe(true);
          expect(result.unitId).toBe('M');
          done();
        }
      });
    });
  });
});
