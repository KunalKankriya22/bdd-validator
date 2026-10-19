import { Injectable, inject } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '@shared/services/api.service';
import { API } from '@core/constants/api.constants';
import { ErrorCodeService } from './error-code.service';

/**
 * Unit format type
 */
export type UnitFormatType = 'ISBT' | 'CODABAR';

/**
 * Unit validation result
 */
export interface UnitValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
  unitId?: string;
  checkDigit?: string;
  formatType?: UnitFormatType;
  isRegistered?: boolean;
  collectionDate?: string;
  donorId?: string;
  donorName?: string;
}

/**
 * Unit registration response from API
 */
export interface UnitRegistrationResponse {
  isRegistered: boolean;
  unitId: string;
  collectionDate?: string;
  collectionDates?: string[]; // Multiple collection dates
  donorId?: string;
  donorName?: string;
  source?: 'DONATIONS' | 'UNITS' | 'BOTH';
}

/**
 * Unit Validation Service
 * Handles all unit ID validations based on Oracle Forms logic
 */
@Injectable({
  providedIn: 'root'
})
export class UnitValidationService {
  private apiService = inject(ApiService);
  private errorCodeService = inject(ErrorCodeService);

  // Toggle for mock mode
  private useMockData = true;

  /**
   * Detect unit format type (ISBT128 or Codabar)
   */
  detectUnitFormat(unitId: string): UnitFormatType {
    if (!unitId) return 'CODABAR';

    // ISBT128: 15 characters (13 + 2 check digit) or 13 characters
    // Format: AAAAA99999999CC (A=alpha, 9=numeric, C=check digit)
    if (unitId.length === 15 || unitId.length === 13) {
      // Check if first 5 chars could be ISBT prefix (letters)
      const prefix = unitId.substring(0, 5);
      if (/^[A-Z]{5}$/.test(prefix)) {
        return 'ISBT';
      }
    }

    // Default to Codabar for all other formats
    return 'CODABAR';
  }

  /**
   * Validate ISBT128 format
   * Based on Oracle Forms VALIDATE_FIELD trigger
   */
  validateISBTFormat(unitId: string): UnitValidationResult {
    // ISBT should be 13 or 15 characters
    if (unitId.length !== 13 && unitId.length !== 15) {
      return {
        isValid: false,
        errorCode: 'INVALID_UNIT_FORMAT',
        errorMessage: 'ISBT unit ID must be 13 or 15 characters'
      };
    }

    // Validate prefix (first 5 characters should be letters)
    const prefix = unitId.substring(0, 5);
    if (!/^[A-Z]{5}$/.test(prefix)) {
      return {
        isValid: false,
        errorCode: '16206',
        errorMessage: this.errorCodeService.getErrorMessage('16206')
      };
    }

    // Validate numeric portion (characters 6-13 should be numeric)
    // Based on Oracle Forms: "if not number_check(substr(:special_units.unit_id,6,8))"
    const numericPortion = unitId.substring(5, 13);
    if (!/^\d{8}$/.test(numericPortion)) {
      return {
        isValid: false,
        errorCode: '16211',
        errorMessage: this.errorCodeService.getErrorMessage('16211')
      };
    }

    // Extract check digit if present
    const checkDigit = unitId.length === 15 ? unitId.substring(13, 15) : undefined;

    return {
      isValid: true,
      unitId: unitId.substring(0, 13), // Truncate to 13 for storage
      checkDigit: checkDigit,
      formatType: 'ISBT'
    };
  }

  /**
   * Validate Codabar format
   */
  validateCodabarFormat(unitId: string): UnitValidationResult {
    // Codabar can be various lengths, typically 8-16 characters
    // Allow alphanumeric
    if (unitId.length < 1 || unitId.length > 16) {
      return {
        isValid: false,
        errorCode: 'INVALID_UNIT_FORMAT',
        errorMessage: 'Unit ID must be between 1 and 16 characters'
      };
    }

    return {
      isValid: true,
      unitId: unitId,
      formatType: 'CODABAR'
    };
  }

  /**
   * Validate unit ID format
   */
  validateUnitFormat(unitId: string): UnitValidationResult {
    if (!unitId || unitId.trim() === '') {
      return {
        isValid: false,
        errorCode: 'REQUIRED_FIELD',
        errorMessage: this.errorCodeService.getErrorMessage('REQUIRED_FIELD')
      };
    }

    // Check for manual entry mode
    if (unitId.toUpperCase() === 'M') {
      return {
        isValid: true,
        unitId: 'M',
        formatType: 'CODABAR'
      };
    }

    const trimmedUnitId = unitId.trim().toUpperCase();
    const formatType = this.detectUnitFormat(trimmedUnitId);

    if (formatType === 'ISBT') {
      return this.validateISBTFormat(trimmedUnitId);
    } else {
      return this.validateCodabarFormat(trimmedUnitId);
    }
  }

  /**
   * Check if unit is registered in donations or units table
   * Based on Oracle Forms UNIT_ID.KEY-NEXT-ITEM trigger
   */
  checkUnitRegistration(unitId: string, chapterId: string): Observable<UnitRegistrationResponse> {
    console.log('🔍 UnitValidationService - checkUnitRegistration:', { unitId, chapterId });

    // Use mock data if enabled
    if (this.useMockData) {
      return this.getMockUnitRegistration(unitId);
    }

    // For ISBT, use truncated ID (13 chars)
    const formatValidation = this.validateUnitFormat(unitId);
    const queryUnitId = formatValidation.formatType === 'ISBT' && formatValidation.unitId
      ? formatValidation.unitId.substring(0, 13)
      : unitId;

    const url = (API as any).SPECIAL_PATIENTS.CHECK_UNIT_REGISTRATION(queryUnitId, chapterId);

    return this.apiService.get<any>(url).pipe(
      map(response => {
        console.log('✅ Unit Registration Response:', response);
        return {
          isRegistered: response.isRegistered || false,
          unitId: queryUnitId,
          collectionDate: response.collectionDate,
          collectionDates: response.collectionDates,
          donorId: response.donorId,
          donorName: response.donorName,
          source: response.source
        };
      }),
      catchError(error => {
        console.error('❌ Unit registration check failed:', error);
        return of({
          isRegistered: false,
          unitId: queryUnitId
        });
      })
    );
  }

  /**
   * Mock unit registration check (for testing)
   */
  private getMockUnitRegistration(unitId: string): Observable<UnitRegistrationResponse> {
    console.log('🎭 Using MOCK unit registration data');

    // Simulate registered units
    const registeredUnits: { [key: string]: UnitRegistrationResponse } = {
      'U001234': {
        isRegistered: true,
        unitId: 'U001234',
        collectionDate: '2026-05-20',
        donorId: 'D001',
        donorName: 'Donor, John',
        source: 'DONATIONS'
      },
      'U002567': {
        isRegistered: true,
        unitId: 'U002567',
        collectionDate: '2026-05-18',
        donorId: 'D002',
        donorName: 'Smith, Jane',
        source: 'DONATIONS'
      },
      'U005678': {
        isRegistered: true,
        unitId: 'U005678',
        collectionDate: '2026-05-21',
        donorId: 'D003',
        donorName: 'Wilson, Bob',
        source: 'DONATIONS'
      },
      'U999999': {
        isRegistered: true,
        unitId: 'U999999',
        collectionDates: ['2026-05-15', '2026-05-20', '2026-05-25'], // Multiple dates
        donorId: 'D999',
        donorName: 'Multiple, Dates',
        source: 'BOTH'
      }
    };

    const result = registeredUnits[unitId] || {
      isRegistered: false,
      unitId: unitId
    };

    return of(result);
  }

  /**
   * Check if unit is already linked to the patient
   * Prevents duplicate linking (SAME_SAME validation)
   */
  checkDuplicateUnit(
    unitId: string,
    patientId: string,
    surgId: string,
    chapterId: string,
    existingLinkedUnits: { unitId: string; collectionDate: string }[]
  ): UnitValidationResult {
    console.log('🔍 UnitValidationService - checkDuplicateUnit:', {
      unitId,
      patientId,
      surgId,
      existingLinkedUnits
    });

    // Check if unit already exists in linked units
    const isDuplicate = existingLinkedUnits.some(
      linkedUnit => linkedUnit.unitId.toUpperCase() === unitId.toUpperCase()
    );

    if (isDuplicate) {
      return {
        isValid: false,
        errorCode: 'DUPLICATE_UNIT',
        errorMessage: this.errorCodeService.getErrorMessage('DUPLICATE_UNIT')
      };
    }

    return {
      isValid: true
    };
  }

  /**
   * Validate patient-unit relationship (SAME_PATIENT_UNIT validation)
   * This would check business rules like blood type compatibility, etc.
   */
  validatePatientUnitRelationship(
    unitId: string,
    patientId: string,
    surgId: string,
    chapterId: string
  ): Observable<UnitValidationResult> {
    console.log('🔍 UnitValidationService - validatePatientUnitRelationship:', {
      unitId,
      patientId,
      surgId,
      chapterId
    });

    // Use mock data if enabled
    if (this.useMockData) {
      // Mock: allow all relationships
      return of({
        isValid: true
      });
    }

    const url = (API as any).SPECIAL_PATIENTS.VALIDATE_UNIT_PATIENT(unitId, patientId, surgId, chapterId);

    return this.apiService.get<any>(url).pipe(
      map(response => {
        if (response.isValid) {
          return {
            isValid: true
          };
        } else {
          return {
            isValid: false,
            errorCode: 'INVALID_UNIT_PATIENT',
            errorMessage: this.errorCodeService.getErrorMessage('INVALID_UNIT_PATIENT')
          };
        }
      }),
      catchError(error => {
        console.error('❌ Patient-unit validation failed:', error);
        return of({
          isValid: false,
          errorCode: 'INVALID_UNIT_PATIENT',
          errorMessage: this.errorCodeService.getErrorMessage('INVALID_UNIT_PATIENT')
        });
      })
    );
  }

  /**
   * Comprehensive unit validation
   * Combines format, registration, duplicate, and relationship checks
   */
  validateUnit(
    unitId: string,
    patientId: string,
    surgId: string,
    chapterId: string,
    existingLinkedUnits: { unitId: string; collectionDate: string }[]
  ): Observable<UnitValidationResult> {
    // Step 1: Validate format
    const formatValidation = this.validateUnitFormat(unitId);
    if (!formatValidation.isValid) {
      return of(formatValidation);
    }

    // Step 2: Check for duplicates
    const duplicateCheck = this.checkDuplicateUnit(
      formatValidation.unitId!,
      patientId,
      surgId,
      chapterId,
      existingLinkedUnits
    );
    if (!duplicateCheck.isValid) {
      return of(duplicateCheck);
    }

    // Step 3: Check registration and get collection date
    return this.checkUnitRegistration(formatValidation.unitId!, chapterId).pipe(
      map(registrationResult => {
        return {
          isValid: true,
          unitId: formatValidation.unitId,
          checkDigit: formatValidation.checkDigit,
          formatType: formatValidation.formatType,
          isRegistered: registrationResult.isRegistered,
          collectionDate: registrationResult.collectionDate,
          donorId: registrationResult.donorId,
          donorName: registrationResult.donorName
        };
      })
    );
  }
}
