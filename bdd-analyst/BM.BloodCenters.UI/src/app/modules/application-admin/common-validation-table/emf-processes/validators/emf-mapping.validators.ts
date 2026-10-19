import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

/**
 * Custom validators for EMF Mapping Configuration Forms
 * Based on Oracle Forms FMB validations from vdiemcfg_fmb.xml
 */

/**
 * Error Code Reference:
 * 0069 - Duplicate record
 * 0080 - Required field missing
 * 2319 - Invalid value for field
 * 24001 - Invalid or inactive process code
 * 24003 - Duplicate mapping name
 * 24004 - Invalid table name
 * 24005 - Invalid column name
 * 24006 - Table name required before column
 * 24008 - Table and column must both be specified
 */

/**
 * Validates that a string field is not empty or whitespace-only
 * Use this instead of Validators.required when you need to reject whitespace
 */
export function requiredNonWhitespace(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    // If value is null, undefined, or empty string
    if (value === null || value === undefined || value === '') {
      return { required: true };
    }

    // If value is a string with only whitespace
    if (typeof value === 'string' && value.trim() === '') {
      return { required: true };
    }

    return null;
  };
}

/**
 * Validates maximum length with custom error message
 */
export function maxLengthWithMessage(maxLength: number, fieldName: string): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    if (value.length > maxLength) {
      return {
        maxLengthExceeded: {
          message: `${fieldName} cannot exceed ${maxLength} characters`,
          maxLength,
          actualLength: value.length
        }
      };
    }
    return null;
  };
}

/**
 * Validates that if column is provided, table must also be provided
 * Note: Table can be provided without column
 */
export function tableColumnConsistencyValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    // When used as a form validator, control IS the formGroup
    const table = control.get('dataTableName')?.value;
    const column = control.get('dataColumnName')?.value;

    // If column is filled but table is not, it's inconsistent
    // Table without column is allowed
    if (!table && column) {
      return { tableColumnInconsistent: true };
    }

    return null;
  };
}

/**
 * Validates that column name requires a table name
 * Also validates that if table is selected, column must be selected
 */
export function columnRequiresTableValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const columnValue = control.value;

    const formGroup = control.parent;
    if (!formGroup) return null;

    const tableValue = formGroup.get('dataTableName')?.value;

    // If column has value but no table - error
    if (columnValue && !tableValue) {
      return { columnWithoutTable: true };
    }

    // If table has value but no column - error
    if (tableValue && !columnValue) {
      return { tableWithoutColumn: true };
    }

    return null;
  };
}

/**
 * Validates that mapping name is not a duplicate
 */
export function duplicateMappingNameValidator(
  checkDuplicateFn: (processCode: string, mappingName: string, originalName?: string) => Observable<boolean>,
  processCode: string,
  originalMappingName?: string
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const mappingName = control.value;
    if (!mappingName) {
      return of(null);
    }

    // Trim the mapping name before checking for duplicates
    const trimmedName = typeof mappingName === 'string' ? mappingName.trim() : mappingName;

    return timer(500).pipe(
      switchMap(() => checkDuplicateFn(processCode, trimmedName, originalMappingName)),
      map(isDuplicate => (isDuplicate ? { duplicateMappingName: true } : null)),
      catchError(() => of(null))
    );
  };
}

/**
 * Validates that table name is valid
 */
export function validTableNameValidator(
  validateTableFn: (tableName: string) => Observable<boolean>
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const tableName = control.value;
    if (!tableName) {
      return of(null);
    }

    return timer(500).pipe(
      switchMap(() => validateTableFn(tableName)),
      map(isValid => (isValid ? null : { invalidTableName: true })),
      catchError(() => of({ invalidTableName: true }))
    );
  };
}

/**
 * Validates that column name is valid for the given table
 */
export function validColumnNameValidator(
  validateColumnFn: (tableName: string, columnName: string) => Observable<boolean>,
  tableControl: AbstractControl | null
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const columnName = control.value;
    if (!columnName || !tableControl) {
      return of(null);
    }

    const tableName = tableControl.value;
    if (!tableName) {
      return of(null);
    }

    return timer(500).pipe(
      switchMap(() => validateColumnFn(tableName, columnName)),
      map(isValid => (isValid ? null : { invalidColumnName: true })),
      catchError(() => of({ invalidColumnName: true }))
    );
  };
}

/**
 * Validates that all function names (comma-separated) exist in UTIL.FCN
 */
export function validFunctionNameValidator(
  validateFnNameFn: (functionName: string) => Observable<boolean>
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = control.value;
    if (!value) {
      return of(null);
    }

    const names = value.split(',').map((n: string) => n.trim()).filter((n: string) => n);
    if (names.length === 0) {
      return of(null);
    }

    return timer(500).pipe(
      switchMap(() => {
        const validations$ = names.map((name: string) =>
          validateFnNameFn(name).pipe(catchError(() => of(false)))
        );

        return new Observable<boolean>(observer => {
          let completed = 0;
          let hasInvalid = false;

          validations$.forEach((validation$: Observable<boolean>) => {
            validation$.subscribe({
              next: (isValid: boolean) => {
                if (!isValid) hasInvalid = true;
                completed++;
                if (completed === names.length) {
                  observer.next(!hasInvalid);
                  observer.complete();
                }
              },
              error: () => {
                hasInvalid = true;
                completed++;
                if (completed === names.length) {
                  observer.next(false);
                  observer.complete();
                }
              }
            });
          });
        });
      }),
      map(allValid => (allValid ? null : { invalidFunctionName: true })),
      catchError(() => of({ invalidFunctionName: true }))
    );
  };
}

/**
 * Validates parameter type is CHAR, NUM, or DATE
 */
export function parameterTypeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (!value) return null;

    const validTypes = ['CHAR', 'NUM', 'DATE'];
    if (!validTypes.includes(value.toUpperCase())) {
      return { invalidParameterType: true };
    }

    return null;
  };
}

/**
 * Validates that parameter code is not a duplicate
 */
export function duplicateParameterCodeValidator(
  existingCodes: string[],
  currentIndex?: number
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const code = control.value;
    if (!code) return null;

    // Trim the code before checking for duplicates
    const trimmedCode = typeof code === 'string' ? code.trim().toUpperCase() : String(code).toUpperCase();

    const isDuplicate = existingCodes.some((existingCode, index) => {
      // Skip comparison with self when editing
      if (currentIndex !== undefined && index === currentIndex) {
        return false;
      }
      const trimmedExistingCode = existingCode.trim().toUpperCase();
      return trimmedExistingCode === trimmedCode;
    });

    return isDuplicate ? { duplicateParameterCode: true } : null;
  };
}

/**
 * Validates that reference column requires a reference table
 */
export function refColumnRequiresTableValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const columnValue = control.value;
    if (!columnValue) return null;

    const formGroup = control.parent;
    if (!formGroup) return null;

    const tableValue = formGroup.get('refTable')?.value;
    if (!tableValue) {
      return { refColumnWithoutTable: true };
    }

    return null;
  };
}

/**
 * Validates that reference table name(s) are valid
 * Supports comma-separated list of tables
 */
export function validReferenceTableValidator(
  validateTableFn: (tableName: string) => Observable<boolean>
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const refTable = control.value?.trim().toUpperCase();

    if (!refTable) {
      return of(null);
    }

    // Split by comma for multiple tables
    const tables = refTable.split(',').map((t: string) => t.trim()).filter((t: string) => t);

    if (tables.length === 0) {
      return of(null);
    }

    // Validate all tables
    const validations$ = tables.map((table: string) => validateTableFn(table));

    return timer(500).pipe(
      switchMap(() => {
        // Check all tables in parallel
        return new Observable<boolean>(observer => {
          let completed = 0;
          let hasInvalid = false;

          validations$.forEach((validation$: Observable<boolean>) => {
            validation$.subscribe({
              next: (isValid: boolean) => {
                if (!isValid) hasInvalid = true;
                completed++;
                if (completed === tables.length) {
                  observer.next(!hasInvalid);
                  observer.complete();
                }
              },
              error: () => {
                hasInvalid = true;
                completed++;
                if (completed === tables.length) {
                  observer.next(false);
                  observer.complete();
                }
              }
            });
          });
        });
      }),
      map(allValid => (allValid ? null : { invalidRefTable: true })),
      catchError(() => of({ invalidRefTable: true }))
    );
  };
}

/**
 * Validates that reference column exists in at least one of the reference tables
 */
export function validReferenceColumnValidator(
  validateColumnFn: (tableName: string, columnName: string) => Observable<boolean>,
  refTableControl: AbstractControl | null
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const columnName = control.value;
    if (!columnName || !refTableControl) {
      return of(null);
    }

    const refTable = refTableControl.value?.trim().toUpperCase();

    if (!columnName || !refTable) {
      return of(null);
    }

    // Split by comma for multiple tables
    const tables = refTable.split(',').map((t: string) => t.trim()).filter((t: string) => t);

    if (tables.length === 0) {
      return of(null);
    }

    return timer(500).pipe(
      switchMap(() => {
        // Check if column exists in at least one table
        const validations$ = tables.map((table: string) =>
          validateColumnFn(table, columnName).pipe(catchError(() => of(false)))
        );

        return new Observable<boolean>(observer => {
          let completed = 0;
          let foundInAny = false;

          validations$.forEach((validation$: Observable<boolean>) => {
            validation$.subscribe({
              next: (isValid: boolean) => {
                if (isValid) foundInAny = true;
                completed++;
                if (completed === tables.length) {
                  observer.next(foundInAny);
                  observer.complete();
                }
              },
              error: () => {
                completed++;
                if (completed === tables.length) {
                  observer.next(foundInAny);
                  observer.complete();
                }
              }
            });
          });
        });
      }),
      map(foundInAny => (foundInAny ? null : { invalidRefColumn: true })),
      catchError(() => of({ invalidRefColumn: true }))
    );
  };
}

/**
 * Validates default value based on parameter type
 */
export function defaultValueTypeValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const defaultValue = control.value;
    if (!defaultValue) return null; // Optional field

    const formGroup = control.parent;
    if (!formGroup) return null;

    const parmType = formGroup.get('parmType')?.value?.toUpperCase();
    if (!parmType) return null;

    switch (parmType) {
      case 'NUM':
        // Must be a valid number
        if (isNaN(Number(defaultValue))) {
          return { invalidDefaultValueForType: { expectedType: 'number' } };
        }
        break;

      case 'DATE':
        // Must be a valid date format using regex validation
        // Supported formats: DD-MMM-YYYY, DD/MMM/YYYY, DD.MMM.YYYY, YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, MMDDYYYY, YYYYMMDD
        if (!isValidDateFormat(defaultValue)) {
          return { invalidDefaultValueForType: { expectedType: 'date' } };
        }
        break;

      case 'CHAR':
        // Any string value is acceptable
        break;
    }

    return null;
  };
}

/**
 * Validates if a string matches supported date formats
 * Supports formats: DD-MMM-YYYY, DD/MMM/YYYY, DD.MMM.YYYY, YYYY-MM-DD, MM/DD/YYYY, MM-DD-YYYY, MM.DD.YYYY
 */
function isValidDateFormat(value: string): boolean {
  if (!value || typeof value !== 'string') return false;

  const trimmedValue = value.trim();
  const monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  // DD-MMM-YYYY format (e.g., 20-MAR-2026, 01-JAN-2025)
  const ddMmmYyyyRegex = /^(\d{1,2})-(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)-(\d{4})$/i;
  let match = trimmedValue.match(ddMmmYyyyRegex);
  if (match) {
    return isValidDate(parseInt(match[3], 10), monthNames.indexOf(match[2].toUpperCase()), parseInt(match[1], 10));
  }

  // DD/MMM/YYYY format (e.g., 20/MAR/2026)
  const ddMmmYyyySlashRegex = /^(\d{1,2})\/(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\/(\d{4})$/i;
  match = trimmedValue.match(ddMmmYyyySlashRegex);
  if (match) {
    return isValidDate(parseInt(match[3], 10), monthNames.indexOf(match[2].toUpperCase()), parseInt(match[1], 10));
  }

  // DD.MMM.YYYY format (e.g., 20.MAR.2026)
  const ddMmmYyyyDotRegex = /^(\d{1,2})\.(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\.(\d{4})$/i;
  match = trimmedValue.match(ddMmmYyyyDotRegex);
  if (match) {
    return isValidDate(parseInt(match[3], 10), monthNames.indexOf(match[2].toUpperCase()), parseInt(match[1], 10));
  }

  // YYYY-MM-DD format (e.g., 2026-03-20)
  const yyyyMmDdRegex = /^(\d{4})-(\d{1,2})-(\d{1,2})$/;
  match = trimmedValue.match(yyyyMmDdRegex);
  if (match) {
    return isValidDate(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }

  // MM/DD/YYYY format (e.g., 03/20/2026)
  const mmDdYyyySlashRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
  match = trimmedValue.match(mmDdYyyySlashRegex);
  if (match) {
    return isValidDate(parseInt(match[3], 10), parseInt(match[1], 10) - 1, parseInt(match[2], 10));
  }

  // MM-DD-YYYY format (e.g., 03-20-2026)
  const mmDdYyyyDashRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})$/;
  match = trimmedValue.match(mmDdYyyyDashRegex);
  if (match) {
    return isValidDate(parseInt(match[3], 10), parseInt(match[1], 10) - 1, parseInt(match[2], 10));
  }

  // MM.DD.YYYY format (e.g., 03.20.2026)
  const mmDdYyyyDotRegex = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;
  match = trimmedValue.match(mmDdYyyyDotRegex);
  if (match) {
    return isValidDate(parseInt(match[3], 10), parseInt(match[1], 10) - 1, parseInt(match[2], 10));
  }

  return false;
}

/**
 * Validates that year, month, and day form a valid calendar date
 */
function isValidDate(year: number, monthIndex: number, day: number): boolean {
  if (monthIndex < 0 || monthIndex > 11) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false; // Reasonable year range

  const date = new Date(year, monthIndex, day);
  return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day;
}

/**
 * Get error message from validation errors
 */
export function getErrorMessage(errors: ValidationErrors): string {
  const errorKey = Object.keys(errors)[0];
  const errorValue = errors[errorKey];

  if (typeof errorValue === 'object' && errorValue.message) {
    return errorValue.message;
  }

  // Fallback generic messages
  const messages: { [key: string]: string } = {
    required: 'This field is required',
    maxLengthExceeded: 'Maximum length exceeded',
    duplicateMappingName: 'Duplicate mapping name',
    invalidTableName: 'Invalid table name',
    invalidColumnName: 'Invalid column name',
    columnWithoutTable: 'Table name required',
    tableWithoutColumn: 'Column name required',
    tableColumnInconsistent: 'Table and column must both be specified',
    duplicateParameterCode: 'Duplicate parameter code',
    invalidParameterType: 'Invalid parameter type',
    refColumnWithoutTable: 'Reference table required',
    invalidRefTable: 'Invalid reference table',
    invalidRefColumn: 'Invalid reference column',
    invalidDefaultValueForType: 'Default value does not match parameter type',
    invalidFunctionName: 'Invalid function name'
  };

  return messages[errorKey] || 'Invalid value';
}
