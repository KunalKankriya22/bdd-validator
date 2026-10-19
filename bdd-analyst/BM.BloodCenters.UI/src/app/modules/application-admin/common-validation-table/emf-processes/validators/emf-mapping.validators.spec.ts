import { FormControl, FormGroup } from '@angular/forms';
import { of, throwError } from 'rxjs';
import {
  requiredNonWhitespace,
  maxLengthWithMessage,
  tableColumnConsistencyValidator,
  columnRequiresTableValidator,
  duplicateMappingNameValidator,
  validTableNameValidator,
  validColumnNameValidator,
  validFunctionNameValidator,
  parameterTypeValidator,
  duplicateParameterCodeValidator,
  refColumnRequiresTableValidator,
  validReferenceTableValidator,
  validReferenceColumnValidator,
  defaultValueTypeValidator,
  getErrorMessage,
} from './emf-mapping.validators';

// =============================================================================
// requiredNonWhitespace
// =============================================================================

describe('requiredNonWhitespace', () => {
  const validator = requiredNonWhitespace();

  it('should return error for null value', () => {
    const control = new FormControl(null);
    expect(validator(control)).toEqual({ required: true });
  });

  it('should return error for undefined value', () => {
    const control = new FormControl(undefined);
    expect(validator(control)).toEqual({ required: true });
  });

  it('should return error for empty string', () => {
    const control = new FormControl('');
    expect(validator(control)).toEqual({ required: true });
  });

  it('should return error for whitespace-only string', () => {
    const control = new FormControl('   ');
    expect(validator(control)).toEqual({ required: true });
  });

  it('should return error for tab-only string', () => {
    const control = new FormControl('\t');
    expect(validator(control)).toEqual({ required: true });
  });

  it('should return null for valid string', () => {
    const control = new FormControl('hello');
    expect(validator(control)).toBeNull();
  });

  it('should return null for string with leading/trailing whitespace', () => {
    const control = new FormControl('  hello  ');
    expect(validator(control)).toBeNull();
  });

  it('should return null for numeric value (non-string, non-null)', () => {
    const control = new FormControl(42);
    expect(validator(control)).toBeNull();
  });

  it('should return null for boolean true (non-string, non-null)', () => {
    const control = new FormControl(true);
    expect(validator(control)).toBeNull();
  });
});

// =============================================================================
// maxLengthWithMessage
// =============================================================================

describe('maxLengthWithMessage', () => {
  const validator = maxLengthWithMessage(10, 'Field Name');

  it('should return null for null value', () => {
    const control = new FormControl(null);
    expect(validator(control)).toBeNull();
  });

  it('should return null for undefined value', () => {
    const control = new FormControl(undefined);
    expect(validator(control)).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return null for string within max length', () => {
    const control = new FormControl('short');
    expect(validator(control)).toBeNull();
  });

  it('should return null for string at exactly max length', () => {
    const control = new FormControl('1234567890');
    expect(validator(control)).toBeNull();
  });

  it('should return error for string exceeding max length', () => {
    const control = new FormControl('12345678901');
    expect(validator(control)).toEqual({
      maxLengthExceeded: {
        message: 'Field Name cannot exceed 10 characters',
        maxLength: 10,
        actualLength: 11,
      },
    });
  });

  it('should include custom field name in error message', () => {
    const customValidator = maxLengthWithMessage(5, 'Mapping Name');
    const control = new FormControl('toolong');
    const result = customValidator(control);
    expect(result!['maxLengthExceeded'].message).toBe('Mapping Name cannot exceed 5 characters');
  });

  it('should handle array-like values with length property', () => {
    const control = new FormControl([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(validator(control)).toEqual({
      maxLengthExceeded: {
        message: 'Field Name cannot exceed 10 characters',
        maxLength: 10,
        actualLength: 11,
      },
    });
  });
});

// =============================================================================
// tableColumnConsistencyValidator
// =============================================================================

describe('tableColumnConsistencyValidator', () => {
  it('should return null when both table and column are empty', () => {
    const form = new FormGroup(
      {
        dataTableName: new FormControl(null),
        dataColumnName: new FormControl(null),
      },
      { validators: tableColumnConsistencyValidator() }
    );
    expect(form.errors).toBeNull();
  });

  it('should return null when table has value and column is empty', () => {
    const form = new FormGroup(
      {
        dataTableName: new FormControl('TABLE1'),
        dataColumnName: new FormControl(null),
      },
      { validators: tableColumnConsistencyValidator() }
    );
    expect(form.errors).toBeNull();
  });

  it('should return null when both table and column have values', () => {
    const form = new FormGroup(
      {
        dataTableName: new FormControl('TABLE1'),
        dataColumnName: new FormControl('COL1'),
      },
      { validators: tableColumnConsistencyValidator() }
    );
    expect(form.errors).toBeNull();
  });

  it('should return error when column has value but table is empty', () => {
    const form = new FormGroup(
      {
        dataTableName: new FormControl(null),
        dataColumnName: new FormControl('COL1'),
      },
      { validators: tableColumnConsistencyValidator() }
    );
    expect(form.errors).toEqual({ tableColumnInconsistent: true });
  });

  it('should return error when column has value and table is empty string', () => {
    const form = new FormGroup(
      {
        dataTableName: new FormControl(''),
        dataColumnName: new FormControl('COL1'),
      },
      { validators: tableColumnConsistencyValidator() }
    );
    expect(form.errors).toEqual({ tableColumnInconsistent: true });
  });
});

// =============================================================================
// columnRequiresTableValidator
// =============================================================================

describe('columnRequiresTableValidator', () => {
  it('should return null when control has no parent', () => {
    const control = new FormControl('COL1', columnRequiresTableValidator());
    // Detach from any parent to test the !formGroup path
    // FormControl created standalone has no parent
    const validator = columnRequiresTableValidator();
    const standaloneControl = new FormControl('COL1');
    expect(validator(standaloneControl)).toBeNull();
  });

  it('should return null when both column and table are empty', () => {
    const form = new FormGroup({
      dataTableName: new FormControl(null),
      dataColumnName: new FormControl(null, columnRequiresTableValidator()),
    });
    expect(form.get('dataColumnName')!.errors).toBeNull();
  });

  it('should return null when both column and table have values', () => {
    const form = new FormGroup({
      dataTableName: new FormControl('TABLE1'),
      dataColumnName: new FormControl('COL1', columnRequiresTableValidator()),
    });
    expect(form.get('dataColumnName')!.errors).toBeNull();
  });

  it('should return columnWithoutTable error when column has value but table is empty', () => {
    const form = new FormGroup({
      dataTableName: new FormControl(null),
      dataColumnName: new FormControl('COL1', columnRequiresTableValidator()),
    });
    form.get('dataColumnName')!.updateValueAndValidity();
    expect(form.get('dataColumnName')!.hasError('columnWithoutTable')).toBe(true);
  });

  it('should return tableWithoutColumn error when table has value but column is empty', () => {
    const form = new FormGroup({
      dataTableName: new FormControl('TABLE1'),
      dataColumnName: new FormControl(null, columnRequiresTableValidator()),
    });
    form.get('dataColumnName')!.updateValueAndValidity();
    expect(form.get('dataColumnName')!.hasError('tableWithoutColumn')).toBe(true);
  });

  it('should return tableWithoutColumn error when table has value and column is empty string', () => {
    const form = new FormGroup({
      dataTableName: new FormControl('TABLE1'),
      dataColumnName: new FormControl('', columnRequiresTableValidator()),
    });
    form.get('dataColumnName')!.updateValueAndValidity();
    expect(form.get('dataColumnName')!.hasError('tableWithoutColumn')).toBe(true);
  });
});

// =============================================================================
// duplicateMappingNameValidator (async)
// =============================================================================

describe('duplicateMappingNameValidator', () => {
  it('should return null for empty mapping name', (done) => {
    const checkFn = jasmine.createSpy('checkDuplicateFn').and.returnValue(of(false));
    const validator = duplicateMappingNameValidator(checkFn, 'PROC1');
    const control = new FormControl('');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(checkFn).not.toHaveBeenCalled();
      done();
    });
  });

  it('should return null for null mapping name', (done) => {
    const checkFn = jasmine.createSpy('checkDuplicateFn').and.returnValue(of(false));
    const validator = duplicateMappingNameValidator(checkFn, 'PROC1');
    const control = new FormControl(null);

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return duplicateMappingName error when duplicate found', (done) => {
    const checkFn = jasmine.createSpy('checkDuplicateFn').and.returnValue(of(true));
    const validator = duplicateMappingNameValidator(checkFn, 'PROC1');
    const control = new FormControl('MappingA');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ duplicateMappingName: true });
      expect(checkFn).toHaveBeenCalledWith('PROC1', 'MappingA', undefined);
      done();
    });
  }, 10000);

  it('should return null when no duplicate found', (done) => {
    const checkFn = jasmine.createSpy('checkDuplicateFn').and.returnValue(of(false));
    const validator = duplicateMappingNameValidator(checkFn, 'PROC1');
    const control = new FormControl('UniqueMapping');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(checkFn).toHaveBeenCalledWith('PROC1', 'UniqueMapping', undefined);
      done();
    });
  }, 10000);

  it('should pass originalMappingName when provided', (done) => {
    const checkFn = jasmine.createSpy('checkDuplicateFn').and.returnValue(of(false));
    const validator = duplicateMappingNameValidator(checkFn, 'PROC1', 'OriginalName');
    const control = new FormControl('NewName');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(checkFn).toHaveBeenCalledWith('PROC1', 'NewName', 'OriginalName');
      done();
    });
  }, 10000);

  it('should trim string mapping names before checking', (done) => {
    const checkFn = jasmine.createSpy('checkDuplicateFn').and.returnValue(of(false));
    const validator = duplicateMappingNameValidator(checkFn, 'PROC1');
    const control = new FormControl('  MappingA  ');

    (validator(control) as any).subscribe((result: any) => {
      expect(checkFn).toHaveBeenCalledWith('PROC1', 'MappingA', undefined);
      done();
    });
  }, 10000);

  it('should handle non-string mapping name without trimming', (done) => {
    const checkFn = jasmine.createSpy('checkDuplicateFn').and.returnValue(of(false));
    const validator = duplicateMappingNameValidator(checkFn, 'PROC1');
    const control = new FormControl(123);

    (validator(control) as any).subscribe((result: any) => {
      expect(checkFn).toHaveBeenCalledWith('PROC1', 123, undefined);
      done();
    });
  }, 10000);

  it('should return null on error from checkDuplicateFn', (done) => {
    const checkFn = jasmine.createSpy('checkDuplicateFn').and.returnValue(
      throwError(() => new Error('Network error'))
    );
    const validator = duplicateMappingNameValidator(checkFn, 'PROC1');
    const control = new FormControl('MappingA');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  }, 10000);
});

// =============================================================================
// validTableNameValidator (async)
// =============================================================================

describe('validTableNameValidator', () => {
  it('should return null for empty table name', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validTableNameValidator(validateFn);
    const control = new FormControl('');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(validateFn).not.toHaveBeenCalled();
      done();
    });
  });

  it('should return null for null table name', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validTableNameValidator(validateFn);
    const control = new FormControl(null);

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null for valid table name', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validTableNameValidator(validateFn);
    const control = new FormControl('VALID_TABLE');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(validateFn).toHaveBeenCalledWith('VALID_TABLE');
      done();
    });
  }, 10000);

  it('should return invalidTableName for invalid table', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(false));
    const validator = validTableNameValidator(validateFn);
    const control = new FormControl('BAD_TABLE');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidTableName: true });
      done();
    });
  }, 10000);

  it('should return invalidTableName on error', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(
      throwError(() => new Error('err'))
    );
    const validator = validTableNameValidator(validateFn);
    const control = new FormControl('TABLE');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidTableName: true });
      done();
    });
  }, 10000);
});

// =============================================================================
// validColumnNameValidator (async)
// =============================================================================

describe('validColumnNameValidator', () => {
  it('should return null when columnName is empty', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const tableControl = new FormControl('TABLE1');
    const validator = validColumnNameValidator(validateFn, tableControl);
    const control = new FormControl('');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null when tableControl is null', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const validator = validColumnNameValidator(validateFn, null);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null when tableName is empty', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const tableControl = new FormControl('');
    const validator = validColumnNameValidator(validateFn, tableControl);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null for valid column name', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const tableControl = new FormControl('TABLE1');
    const validator = validColumnNameValidator(validateFn, tableControl);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(validateFn).toHaveBeenCalledWith('TABLE1', 'COL1');
      done();
    });
  }, 10000);

  it('should return invalidColumnName for invalid column', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(false));
    const tableControl = new FormControl('TABLE1');
    const validator = validColumnNameValidator(validateFn, tableControl);
    const control = new FormControl('BAD_COL');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidColumnName: true });
      done();
    });
  }, 10000);

  it('should return invalidColumnName on error', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(
      throwError(() => new Error('err'))
    );
    const tableControl = new FormControl('TABLE1');
    const validator = validColumnNameValidator(validateFn, tableControl);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidColumnName: true });
      done();
    });
  }, 10000);
});

// =============================================================================
// parameterTypeValidator
// =============================================================================

describe('parameterTypeValidator', () => {
  const validator = parameterTypeValidator();

  it('should return null for null value', () => {
    const control = new FormControl(null);
    expect(validator(control)).toBeNull();
  });

  it('should return null for empty string', () => {
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return null for CHAR', () => {
    const control = new FormControl('CHAR');
    expect(validator(control)).toBeNull();
  });

  it('should return null for NUM', () => {
    const control = new FormControl('NUM');
    expect(validator(control)).toBeNull();
  });

  it('should return null for DATE', () => {
    const control = new FormControl('DATE');
    expect(validator(control)).toBeNull();
  });

  it('should return null for lowercase char (case insensitive)', () => {
    const control = new FormControl('char');
    expect(validator(control)).toBeNull();
  });

  it('should return null for mixed case Num', () => {
    const control = new FormControl('Num');
    expect(validator(control)).toBeNull();
  });

  it('should return error for invalid type', () => {
    const control = new FormControl('STRING');
    expect(validator(control)).toEqual({ invalidParameterType: true });
  });

  it('should return error for INT', () => {
    const control = new FormControl('INT');
    expect(validator(control)).toEqual({ invalidParameterType: true });
  });

  it('should return error for BOOLEAN', () => {
    const control = new FormControl('BOOLEAN');
    expect(validator(control)).toEqual({ invalidParameterType: true });
  });
});

// =============================================================================
// duplicateParameterCodeValidator
// =============================================================================

describe('duplicateParameterCodeValidator', () => {
  it('should return null for empty code', () => {
    const validator = duplicateParameterCodeValidator(['CODE1', 'CODE2']);
    const control = new FormControl('');
    expect(validator(control)).toBeNull();
  });

  it('should return null for null code', () => {
    const validator = duplicateParameterCodeValidator(['CODE1', 'CODE2']);
    const control = new FormControl(null);
    expect(validator(control)).toBeNull();
  });

  it('should return null when code is unique', () => {
    const validator = duplicateParameterCodeValidator(['CODE1', 'CODE2']);
    const control = new FormControl('CODE3');
    expect(validator(control)).toBeNull();
  });

  it('should return error when code is a duplicate', () => {
    const validator = duplicateParameterCodeValidator(['CODE1', 'CODE2']);
    const control = new FormControl('CODE1');
    expect(validator(control)).toEqual({ duplicateParameterCode: true });
  });

  it('should be case-insensitive', () => {
    const validator = duplicateParameterCodeValidator(['CODE1', 'CODE2']);
    const control = new FormControl('code1');
    expect(validator(control)).toEqual({ duplicateParameterCode: true });
  });

  it('should trim whitespace before comparison', () => {
    const validator = duplicateParameterCodeValidator(['CODE1', 'CODE2']);
    const control = new FormControl('  CODE1  ');
    expect(validator(control)).toEqual({ duplicateParameterCode: true });
  });

  it('should skip self when currentIndex is provided', () => {
    const validator = duplicateParameterCodeValidator(['CODE1', 'CODE2', 'CODE3'], 0);
    const control = new FormControl('CODE1');
    expect(validator(control)).toBeNull(); // Skips index 0
  });

  it('should still detect duplicates at other indices when currentIndex is provided', () => {
    const validator = duplicateParameterCodeValidator(['CODE1', 'CODE2', 'CODE1'], 0);
    const control = new FormControl('CODE1');
    // Skips index 0 but finds duplicate at index 2
    expect(validator(control)).toEqual({ duplicateParameterCode: true });
  });

  it('should handle non-string code by converting to string', () => {
    const validator = duplicateParameterCodeValidator(['123']);
    const control = new FormControl(123);
    expect(validator(control)).toEqual({ duplicateParameterCode: true });
  });

  it('should return null with empty existing codes', () => {
    const validator = duplicateParameterCodeValidator([]);
    const control = new FormControl('CODE1');
    expect(validator(control)).toBeNull();
  });
});

// =============================================================================
// refColumnRequiresTableValidator
// =============================================================================

describe('refColumnRequiresTableValidator', () => {
  it('should return null when column value is empty', () => {
    const form = new FormGroup({
      refTable: new FormControl(null),
      refColumn: new FormControl(null, refColumnRequiresTableValidator()),
    });
    expect(form.get('refColumn')!.errors).toBeNull();
  });

  it('should return null when column value is empty string', () => {
    const form = new FormGroup({
      refTable: new FormControl(null),
      refColumn: new FormControl('', refColumnRequiresTableValidator()),
    });
    expect(form.get('refColumn')!.errors).toBeNull();
  });

  it('should return null when control has no parent', () => {
    const validator = refColumnRequiresTableValidator();
    const control = new FormControl('COL1');
    expect(validator(control)).toBeNull();
  });

  it('should return null when both column and table have values', () => {
    const form = new FormGroup({
      refTable: new FormControl('TABLE1'),
      refColumn: new FormControl('COL1', refColumnRequiresTableValidator()),
    });
    expect(form.get('refColumn')!.errors).toBeNull();
  });

  it('should return error when column has value but table is empty', () => {
    const form = new FormGroup({
      refTable: new FormControl(null),
      refColumn: new FormControl('COL1', refColumnRequiresTableValidator()),
    });
    form.get('refColumn')!.updateValueAndValidity();
    expect(form.get('refColumn')!.hasError('refColumnWithoutTable')).toBe(true);
  });

  it('should return error when column has value and table is empty string', () => {
    const form = new FormGroup({
      refTable: new FormControl(''),
      refColumn: new FormControl('COL1', refColumnRequiresTableValidator()),
    });
    form.get('refColumn')!.updateValueAndValidity();
    expect(form.get('refColumn')!.hasError('refColumnWithoutTable')).toBe(true);
  });
});

// =============================================================================
// validReferenceTableValidator (async)
// =============================================================================

describe('validReferenceTableValidator', () => {
  it('should return null for empty refTable', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl('');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null for null refTable', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl(null);

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null for whitespace-only refTable', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl('   ');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null for valid single table', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl('TABLE1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(validateFn).toHaveBeenCalledWith('TABLE1');
      done();
    });
  }, 10000);

  it('should return invalidRefTable for invalid single table', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(false));
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl('BAD_TABLE');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidRefTable: true });
      done();
    });
  }, 10000);

  it('should return null when all comma-separated tables are valid', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl('TABLE1, TABLE2, TABLE3');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(validateFn).toHaveBeenCalledTimes(3);
      done();
    });
  }, 10000);

  it('should return invalidRefTable when any comma-separated table is invalid', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.callFake(
      (table: string) => of(table !== 'BAD_TABLE')
    );
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl('TABLE1, BAD_TABLE, TABLE3');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidRefTable: true });
      done();
    });
  }, 10000);

  it('should return invalidRefTable when validation throws error for a table', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(
      throwError(() => new Error('err'))
    );
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl('TABLE1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidRefTable: true });
      done();
    });
  }, 10000);

  it('should handle comma-only input (empty after filtering)', (done) => {
    const validateFn = jasmine.createSpy('validateTableFn').and.returnValue(of(true));
    const validator = validReferenceTableValidator(validateFn);
    const control = new FormControl(',,,');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull(); // tables array is empty after filter
      done();
    });
  });
});

// =============================================================================
// validReferenceColumnValidator (async)
// =============================================================================

describe('validReferenceColumnValidator', () => {
  it('should return null when column name is empty', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const refTableControl = new FormControl('TABLE1');
    const validator = validReferenceColumnValidator(validateFn, refTableControl);
    const control = new FormControl('');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null when refTableControl is null', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const validator = validReferenceColumnValidator(validateFn, null);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null when refTable value is empty', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const refTableControl = new FormControl('');
    const validator = validReferenceColumnValidator(validateFn, refTableControl);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null when column exists in at least one table', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.callFake(
      (table: string, col: string) => of(table === 'TABLE1')
    );
    const refTableControl = new FormControl('TABLE1, TABLE2');
    const validator = validReferenceColumnValidator(validateFn, refTableControl);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  }, 10000);

  it('should return invalidRefColumn when column not found in any table', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(false));
    const refTableControl = new FormControl('TABLE1, TABLE2');
    const validator = validReferenceColumnValidator(validateFn, refTableControl);
    const control = new FormControl('BAD_COL');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidRefColumn: true });
      done();
    });
  }, 10000);

  it('should return null when column found in single table', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const refTableControl = new FormControl('TABLE1');
    const validator = validReferenceColumnValidator(validateFn, refTableControl);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  }, 10000);

  it('should return invalidRefColumn on outer catchError', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(
      throwError(() => new Error('err'))
    );
    const refTableControl = new FormControl('TABLE1');
    const validator = validReferenceColumnValidator(validateFn, refTableControl);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      // catchError inside map returns of(false) per table,
      // but all tables failing means foundInAny is false => invalidRefColumn
      expect(result).toEqual({ invalidRefColumn: true });
      done();
    });
  }, 10000);

  it('should handle comma-only refTable (empty after filtering)', (done) => {
    const validateFn = jasmine.createSpy('validateColumnFn').and.returnValue(of(true));
    const refTableControl = new FormControl(',,,');
    const validator = validReferenceColumnValidator(validateFn, refTableControl);
    const control = new FormControl('COL1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull(); // tables array is empty
      done();
    });
  });
});

// =============================================================================
// defaultValueTypeValidator
// =============================================================================

describe('defaultValueTypeValidator', () => {
  function createFormWithParmType(parmType: string | null, defaultValue: any): FormGroup {
    const form = new FormGroup({
      parmType: new FormControl(parmType),
      defaultValue: new FormControl(defaultValue, defaultValueTypeValidator()),
    });
    form.get('defaultValue')!.updateValueAndValidity();
    return form;
  }

  describe('when defaultValue is empty', () => {
    it('should return null for null defaultValue', () => {
      const form = createFormWithParmType('NUM', null);
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for empty string defaultValue', () => {
      const form = createFormWithParmType('NUM', '');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });
  });

  describe('when parmType is missing', () => {
    it('should return null when parmType is null', () => {
      const form = createFormWithParmType(null, '123');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null when parmType is empty string', () => {
      const form = createFormWithParmType('', '123');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });
  });

  describe('when control has no parent', () => {
    it('should return null for standalone control', () => {
      const validator = defaultValueTypeValidator();
      const control = new FormControl('123');
      expect(validator(control)).toBeNull();
    });
  });

  describe('parmType = NUM', () => {
    it('should return null for valid integer', () => {
      const form = createFormWithParmType('NUM', '42');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for valid decimal', () => {
      const form = createFormWithParmType('NUM', '3.14');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for negative number', () => {
      const form = createFormWithParmType('NUM', '-5');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for zero', () => {
      const form = createFormWithParmType('NUM', '0');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return error for non-numeric string', () => {
      const form = createFormWithParmType('NUM', 'abc');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
      expect(form.get('defaultValue')!.errors!['invalidDefaultValueForType']).toEqual({ expectedType: 'number' });
    });

    it('should return error for mixed alphanumeric', () => {
      const form = createFormWithParmType('NUM', '12abc');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
    });

    it('should handle lowercase parmType num', () => {
      const form = createFormWithParmType('num', '42');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });
  });

  describe('parmType = DATE', () => {
    it('should return null for DD-MMM-YYYY format', () => {
      const form = createFormWithParmType('DATE', '20-MAR-2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for DD/MMM/YYYY format', () => {
      const form = createFormWithParmType('DATE', '20/MAR/2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for DD.MMM.YYYY format', () => {
      const form = createFormWithParmType('DATE', '20.MAR.2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for YYYY-MM-DD format', () => {
      const form = createFormWithParmType('DATE', '2026-03-20');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for MM/DD/YYYY format', () => {
      const form = createFormWithParmType('DATE', '03/20/2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for MM-DD-YYYY format', () => {
      const form = createFormWithParmType('DATE', '03-20-2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for MM.DD.YYYY format', () => {
      const form = createFormWithParmType('DATE', '03.20.2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for case-insensitive month name', () => {
      const form = createFormWithParmType('DATE', '20-mar-2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for single-digit day DD-MMM-YYYY', () => {
      const form = createFormWithParmType('DATE', '1-JAN-2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return error for invalid date format', () => {
      const form = createFormWithParmType('DATE', 'not-a-date');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
      expect(form.get('defaultValue')!.errors!['invalidDefaultValueForType']).toEqual({ expectedType: 'date' });
    });

    it('should return error for invalid calendar date (Feb 30)', () => {
      const form = createFormWithParmType('DATE', '30-FEB-2026');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
    });

    it('should return error for day 0', () => {
      const form = createFormWithParmType('DATE', '00-JAN-2026');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
    });

    it('should return error for day 32', () => {
      const form = createFormWithParmType('DATE', '32-JAN-2026');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
    });

    it('should return error for year before 1900', () => {
      const form = createFormWithParmType('DATE', '01-JAN-1899');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
    });

    it('should return error for year after 2100', () => {
      const form = createFormWithParmType('DATE', '01-JAN-2101');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
    });

    it('should accept year 1900 (boundary)', () => {
      const form = createFormWithParmType('DATE', '01-JAN-1900');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should accept year 2100 (boundary)', () => {
      const form = createFormWithParmType('DATE', '01-JAN-2100');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return error for empty string value in isValidDateFormat', () => {
      // This tests the isValidDateFormat internal guard
      const form = createFormWithParmType('DATE', ' ');
      // ' ' is truthy so it enters the DATE case, but trim produces ''
      // Actually ' ' is truthy, so it passes !defaultValue check, enters DATE,
      // calls isValidDateFormat(' ') which trims to '' and no regex matches => false
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
    });

    it('should handle lowercase parmType date', () => {
      const form = createFormWithParmType('date', '20-MAR-2026');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should accept Feb 29 on leap year', () => {
      const form = createFormWithParmType('DATE', '29-FEB-2024');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should reject Feb 29 on non-leap year', () => {
      const form = createFormWithParmType('DATE', '29-FEB-2025');
      expect(form.get('defaultValue')!.hasError('invalidDefaultValueForType')).toBe(true);
    });
  });

  describe('parmType = CHAR', () => {
    it('should return null for any string value', () => {
      const form = createFormWithParmType('CHAR', 'anything goes');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for numeric string', () => {
      const form = createFormWithParmType('CHAR', '123');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });

    it('should return null for special characters', () => {
      const form = createFormWithParmType('CHAR', '!@#$%^&*');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });
  });

  describe('unknown parmType', () => {
    it('should return null for unrecognized parmType', () => {
      const form = createFormWithParmType('BOOLEAN', 'true');
      expect(form.get('defaultValue')!.errors).toBeNull();
    });
  });
});

// =============================================================================
// validFunctionNameValidator (async)
// =============================================================================

describe('validFunctionNameValidator', () => {
  it('should return null for empty function name', (done) => {
    const validateFn = jasmine.createSpy('validateFnNameFn').and.returnValue(of(true));
    const validator = validFunctionNameValidator(validateFn);
    const control = new FormControl('');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(validateFn).not.toHaveBeenCalled();
      done();
    });
  });

  it('should return null for null function name', (done) => {
    const validateFn = jasmine.createSpy('validateFnNameFn').and.returnValue(of(true));
    const validator = validFunctionNameValidator(validateFn);
    const control = new FormControl(null);

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      done();
    });
  });

  it('should return null for valid single function name', (done) => {
    const validateFn = jasmine.createSpy('validateFnNameFn').and.returnValue(of(true));
    const validator = validFunctionNameValidator(validateFn);
    const control = new FormControl('PROC_DONOR');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(validateFn).toHaveBeenCalledWith('PROC_DONOR');
      done();
    });
  }, 10000);

  it('should return invalidFunctionName for invalid single function', (done) => {
    const validateFn = jasmine.createSpy('validateFnNameFn').and.returnValue(of(false));
    const validator = validFunctionNameValidator(validateFn);
    const control = new FormControl('BAD_FUNC');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidFunctionName: true });
      done();
    });
  }, 10000);

  it('should return invalidFunctionName on error', (done) => {
    const validateFn = jasmine.createSpy('validateFnNameFn').and.returnValue(
      throwError(() => new Error('err'))
    );
    const validator = validFunctionNameValidator(validateFn);
    const control = new FormControl('FUNC1');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidFunctionName: true });
      done();
    });
  }, 10000);

  it('should return null when all comma-separated functions are valid', (done) => {
    const validateFn = jasmine.createSpy('validateFnNameFn').and.returnValue(of(true));
    const validator = validFunctionNameValidator(validateFn);
    const control = new FormControl('FUNC1,FUNC2,FUNC3');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toBeNull();
      expect(validateFn).toHaveBeenCalledTimes(3);
      expect(validateFn).toHaveBeenCalledWith('FUNC1');
      expect(validateFn).toHaveBeenCalledWith('FUNC2');
      expect(validateFn).toHaveBeenCalledWith('FUNC3');
      done();
    });
  }, 10000);

  it('should return invalidFunctionName when any comma-separated function is invalid', (done) => {
    const validateFn = jasmine.createSpy('validateFnNameFn').and.callFake((name: string) => {
      return of(name !== 'BAD_FUNC');
    });
    const validator = validFunctionNameValidator(validateFn);
    const control = new FormControl('FUNC1,BAD_FUNC,FUNC3');

    (validator(control) as any).subscribe((result: any) => {
      expect(result).toEqual({ invalidFunctionName: true });
      done();
    });
  }, 10000);
});

// =============================================================================
// getErrorMessage
// =============================================================================

describe('getErrorMessage', () => {
  it('should return custom message from error value object', () => {
    const errors = { maxLengthExceeded: { message: 'Too long!', maxLength: 10, actualLength: 15 } };
    expect(getErrorMessage(errors)).toBe('Too long!');
  });

  it('should return fallback for required error', () => {
    expect(getErrorMessage({ required: true })).toBe('This field is required');
  });

  it('should return fallback for duplicateMappingName', () => {
    expect(getErrorMessage({ duplicateMappingName: true })).toBe('Duplicate mapping name');
  });

  it('should return fallback for invalidTableName', () => {
    expect(getErrorMessage({ invalidTableName: true })).toBe('Invalid table name');
  });

  it('should return fallback for invalidColumnName', () => {
    expect(getErrorMessage({ invalidColumnName: true })).toBe('Invalid column name');
  });

  it('should return fallback for columnWithoutTable', () => {
    expect(getErrorMessage({ columnWithoutTable: true })).toBe('Table name required');
  });

  it('should return fallback for tableWithoutColumn', () => {
    expect(getErrorMessage({ tableWithoutColumn: true })).toBe('Column name required');
  });

  it('should return fallback for tableColumnInconsistent', () => {
    expect(getErrorMessage({ tableColumnInconsistent: true })).toBe('Table and column must both be specified');
  });

  it('should return fallback for duplicateParameterCode', () => {
    expect(getErrorMessage({ duplicateParameterCode: true })).toBe('Duplicate parameter code');
  });

  it('should return fallback for invalidParameterType', () => {
    expect(getErrorMessage({ invalidParameterType: true })).toBe('Invalid parameter type');
  });

  it('should return fallback for refColumnWithoutTable', () => {
    expect(getErrorMessage({ refColumnWithoutTable: true })).toBe('Reference table required');
  });

  it('should return fallback for invalidRefTable', () => {
    expect(getErrorMessage({ invalidRefTable: true })).toBe('Invalid reference table');
  });

  it('should return fallback for invalidRefColumn', () => {
    expect(getErrorMessage({ invalidRefColumn: true })).toBe('Invalid reference column');
  });

  it('should return fallback for invalidDefaultValueForType', () => {
    expect(getErrorMessage({ invalidDefaultValueForType: true })).toBe('Default value does not match parameter type');
  });

  it('should return fallback for invalidFunctionName', () => {
    expect(getErrorMessage({ invalidFunctionName: true })).toBe('Invalid function name');
  });

  it('should return fallback for maxLengthExceeded without message', () => {
    expect(getErrorMessage({ maxLengthExceeded: true })).toBe('Maximum length exceeded');
  });

  it('should return "Invalid value" for unknown error key', () => {
    expect(getErrorMessage({ unknownError: true })).toBe('Invalid value');
  });

  it('should use first error key when multiple errors exist', () => {
    const errors = { required: true, invalidTableName: true };
    const result = getErrorMessage(errors);
    // Object.keys returns keys in insertion order; first key is 'required'
    expect(result).toBe('This field is required');
  });
});
