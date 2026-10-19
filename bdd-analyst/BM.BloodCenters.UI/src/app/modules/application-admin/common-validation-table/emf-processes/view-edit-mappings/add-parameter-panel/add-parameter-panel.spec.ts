import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { AddParameterPanel, AddParameterPayload } from './add-parameter-panel';
import { ParameterDefinitionDto } from '../../interfaces/parameter-definition.interface';
import { ManufLookupService } from '../../services/manuf-lookup.service';

describe('AddParameterPanel', () => {
  let component: AddParameterPanel;
  let fixture: ComponentFixture<AddParameterPanel>;
  let mockLookupService: jasmine.SpyObj<ManufLookupService>;

  const mockParameterData: ParameterDefinitionDto = {
    procCode: 'PROC001',
    parmNo: 1,
    parmCode: 'TEST_PARAM',
    parmType: 'CHAR',
    refTable: 'RefTable',
    refColumn: 'RefColumn',
    defaultValue: 'Default'
  };

  beforeEach(() => {

    mockLookupService = jasmine.createSpyObj('ManufLookupService', [
      'getTableNames',
      'getColumnNames',
      'validateTableName',
      'validateColumnName'
    ]);

    // Default mock behavior for async validators
    mockLookupService.validateTableName.and.returnValue(of(true));
    mockLookupService.validateColumnName.and.returnValue(of(true));
    mockLookupService.getTableNames.and.returnValue(of(['Table1', 'Table2', 'RefTable']));
    mockLookupService.getColumnNames.and.returnValue(of(['Column1', 'Column2', 'RefColumn']));



      TestBed.configureTestingModule({
      imports: [
        AddParameterPanel,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatIconModule,
        MatInputModule,
        MatFormFieldModule,
        MatSelectModule],
      providers: [
        { provide: ManufLookupService, useValue: mockLookupService }
      ]
    });


    


      mockLookupService.getTableNames.calls.reset();


      mockLookupService.getColumnNames.calls.reset();


      mockLookupService.validateTableName.calls.reset();


      mockLookupService.validateColumnName.calls.reset();


      mockLookupService.validateTableName.and.returnValue(of(true));


      mockLookupService.validateColumnName.and.returnValue(of(true));


      mockLookupService.getTableNames.and.returnValue(of(['Table1', 'Table2', 'RefTable']));


      mockLookupService.getColumnNames.and.returnValue(of(['Column1', 'Column2', 'RefColumn']));


    fixture = TestBed.createComponent(AddParameterPanel);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {


    it('should have correct parameter types', () => {
      fixture.detectChanges();

      expect(component.parameterTypes).toEqual(['CHAR', 'NUM', 'DATE']);
    });
  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should set isEdit to false', () => {
      expect(component.isEdit).toBe(false);
    });













    it('should show required error message for refTable', () => {
      const control = component.form.get('refTable');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getFieldError('refTable')).toBe('Reference Table is required');
    });

    it('should show required error message for refColumn', () => {
      const control = component.form.get('refColumn');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getFieldError('refColumn')).toBe('Reference Column is required');
    });

    it('should not require defaultValue field', () => {
      const control = component.form.get('defaultValue');

      control?.setValue('');
      expect(control?.hasError('required')).toBe(false);
    });





    it('should allow valid parmNo range', () => {
      const control = component.form.get('parmNo');

      control?.setValue(1);
      expect(control?.valid).toBe(true);

      control?.setValue(500);
      expect(control?.valid).toBe(true);

      control?.setValue(999);
      expect(control?.valid).toBe(true);
    });








  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.editData = mockParameterData;
      fixture.detectChanges();
    });



    it('should set isEdit to true', () => {
      expect(component.isEdit).toBe(true);
    });



    it('should update form when editData changes', () => {
      const newData: ParameterDefinitionDto = {
        procCode: 'PROC002',
        parmNo: 2,
        parmCode: 'NEW_PARAM',
        parmType: 'NUM',
        refTable: 'NewRefTable',
        refColumn: 'NewRefColumn',
        defaultValue: '100'
      };

      component.editData = newData;
      component.ngOnChanges({
        editData: {
          currentValue: newData,
          previousValue: mockParameterData,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('parmNo')?.value).toBe(2);
      expect(component.form.get('parmCode')?.value).toBe('NEW_PARAM');
      expect(component.form.get('parmType')?.value).toBe('NUM');
    });
  });

  describe('onSave', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });







    it('should emit save with only required fields', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        parmNo: 3,
        parmCode: 'MIN_PARAM',
        parmType: 'DATE',
        refTable: 'SOME_TABLE',
        refColumn: 'SOME_COLUMN'
      });

      component.onSave();

      expect(component.save.emit).toHaveBeenCalled();
      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.parmNo).toBe(3);
      expect(emittedData.parmCode).toBe('MIN_PARAM');
      expect(emittedData.parmType).toBe('DATE');
    });

    it('should include optional fields when provided', () => {
      spyOn(component.save, 'emit');

      component.form.patchValue({
        parmNo: 1,
        parmCode: 'FULL_PARAM',
        parmType: 'CHAR',
        refTable: 'TestTable',
        refColumn: 'TestColumn',
        defaultValue: 'TestDefault'
      });

      component.onSave();

      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.refTable).toBe('TestTable');
      expect(emittedData.refColumn).toBe('TestColumn');
      expect(emittedData.defaultValue).toBe('TestDefault');
    });
  });
  describe('Form Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate each parameter type', fakeAsync(() => {
      const types = ['CHAR', 'NUM', 'DATE'];

      types.forEach(type => {
        component.form.patchValue({
          parmNo: 1,
          parmCode: 'TEST',
          parmType: type,
          refTable: 'SOME_TABLE',
          refColumn: 'SOME_COLUMN'
        });
        tick(1000);

        expect(component.form.valid).toBe(true, `Form should be valid with type ${type}`);
      });
    }));

    it('should handle numeric parmNo values', () => {
      const control = component.form.get('parmNo');

      [1, 50, 100, 500, 999].forEach(val => {
        control?.setValue(val);
        expect(control?.valid).toBe(true, `parmNo ${val} should be valid`);
      });
    });

    it('should reject invalid parmNo values', () => {
      const control = component.form.get('parmNo');

      [0, -1, 1000, 1001].forEach(val => {
        control?.setValue(val);
        expect(control?.invalid).toBe(true, `parmNo ${val} should be invalid`);
      });
    });

    it('should allow empty defaultValue field', fakeAsync(() => {
      component.form.patchValue({
        parmNo: 1,
        parmCode: 'TEST',
        parmType: 'CHAR',
        refTable: 'SOME_TABLE',
        refColumn: 'SOME_COLUMN',
        defaultValue: ''
      });
      tick(1000);

      expect(component.form.valid).toBe(true);
    }));

    it('should trim and validate parmCode', () => {
      const control = component.form.get('parmCode');

      control?.setValue('  VALID_CODE  ');
      expect(control?.valid).toBe(true);
    });
  });

  describe('ngOnChanges', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should update form when editData changes', () => {
      component.editData = mockParameterData;
      component.ngOnChanges({
        editData: {
          currentValue: mockParameterData,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('parmCode')?.value).toBe('TEST_PARAM');
    });

    it('should not update form on first change', () => {
      const initialParmCode = component.form.get('parmCode')?.value;

      component.editData = mockParameterData;
      component.ngOnChanges({
        editData: {
          currentValue: mockParameterData,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.form.get('parmCode')?.value).toBe(initialParmCode);
    });

    it('should not update form when editData is unchanged', () => {
      component.form.get('parmCode')?.setValue('MANUAL_CHANGE');

      component.ngOnChanges({
        someOtherProp: {
          currentValue: 'value',
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('parmCode')?.value).toBe('MANUAL_CHANGE');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.existingParameterCodes = [];
      fixture.detectChanges();
    });



    it('should handle undefined optional fields in editData', () => {
      const incompleteData: ParameterDefinitionDto = {
        procCode: 'PROC001',
        parmNo: 2,
        parmCode: 'INCOMPLETE',
        parmType: 'CHAR',
        refTable: undefined,
        refColumn: undefined,
        defaultValue: undefined
      };

      component.editData = incompleteData;
      component.ngOnChanges({
        editData: {
          currentValue: incompleteData,
          previousValue: null,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.form.get('refTable')?.value).toBe('');
      expect(component.form.get('refColumn')?.value).toBe('');
      expect(component.form.get('defaultValue')?.value).toBe('');
    });

    it('should handle very long string values', fakeAsync(() => {
      const longString = 'A'.repeat(100);

      component.form.patchValue({
        parmNo: 1,
        parmCode: 'LONG_PARAM_CODE',
        parmType: 'CHAR',
        refTable: '',
        refColumn: '',
        defaultValue: longString
      });
      // Wait for any debounce timers and form updates
      tick(500);
      fixture.detectChanges();

      fixture.detectChanges();
      tick(2000); // Wait for all debounces and validators
      fixture.detectChanges();

      // Should successfully accept long default values
      expect(component.form.get('defaultValue')?.value).toBe(longString);
      expect(component.form.get('parmCode')?.value).toBe('LONG_PARAM_CODE');
    }));

    it('should handle special characters in fields', fakeAsync(() => {
      // Ensure validators return true for special character values
      mockLookupService.validateTableName.and.returnValue(of(true));
      mockLookupService.validateColumnName.and.returnValue(of(true));

      component.form.patchValue({
        parmNo: 1,
        parmCode: 'TEST_PARAM',
        parmType: 'CHAR',
        refTable: 'TABLE1',
        refColumn: 'COLUMN1',
        defaultValue: 'Test Value'
      });
      // Wait for debounceTime(300) on refTable change + async validators
      tick(500);
      fixture.detectChanges();

      fixture.detectChanges();

      // Wait for all async validators to complete
      // debounceTime(300) + refTable validator timer(500) + refColumn validator timer(500)
      tick(1500);
      fixture.detectChanges();

      expect(component.form.get('refTable')?.valid).toBe(true);
      expect(component.form.get('refColumn')?.valid).toBe(true);
      expect(component.form.valid).toBe(true);
    }));
  });

  describe('Integration', () => {
    it('should complete full add workflow', fakeAsync(() => {
      component.mode = 'add';
      fixture.detectChanges();

      spyOn(component.save, 'emit');

      expect(component.isEdit).toBe(false);
      expect(component.title).toBe('Add Parameter Definitions');

      component.form.patchValue({
        parmNo: 10,
        parmCode: 'NEW_PARAMETER',
        parmType: 'NUM',
        refTable: 'Reference',
        refColumn: 'ID',
        defaultValue: '0'
      });
      tick(1000);

      expect(component.form.valid).toBe(true);
      expect(component.isSaveDisabled).toBe(false);

      component.onSave();

      expect(component.save.emit).toHaveBeenCalledWith({
        parmNo: 10,
        parmCode: 'NEW_PARAMETER',
        parmType: 'NUM',
        refTable: 'Reference',
        refColumn: 'ID',
        defaultValue: '0'
      });
    }));

    it('should complete full edit workflow', () => {
      component.mode = 'edit';
      component.editData = mockParameterData;
      fixture.detectChanges();

      spyOn(component.save, 'emit');

      expect(component.isEdit).toBe(true);
      expect(component.title).toBe('Edit Parameter Definition');
      expect(component.form.get('parmCode')?.value).toBe('TEST_PARAM');

      component.form.patchValue({
        parmCode: 'UPDATED_PARAM',
        parmType: 'DATE'
      });

      component.onSave();

      const emittedData = (component.save.emit as jasmine.Spy).calls.mostRecent().args[0];
      expect(emittedData.parmCode).toBe('UPDATED_PARAM');
      expect(emittedData.parmType).toBe('DATE');
    });
  });

  describe('Async Validation - Reference Table', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate table name via API', fakeAsync(() => {
      mockLookupService.validateTableName.and.returnValue(of(true));

      const control = component.form.get('refTable');
      control?.setValue('VALID_TABLE');
      tick(1000); // debounceTime (300ms) + validator timer (500ms)

      expect(mockLookupService.validateTableName).toHaveBeenCalledWith('VALID_TABLE');
      expect(control?.valid).toBe(true);
    }));

    it('should fail validation for invalid table name', fakeAsync(() => {
      mockLookupService.validateTableName.and.returnValue(of(false));

      const control = component.form.get('refTable');
      control?.setValue('INVALID_TABLE');
      control?.markAsTouched();
      tick(1000); // debounceTime (300ms) + validator timer (500ms)

      expect(control?.hasError('invalidRefTable')).toBe(true);
    }));



    it('should validate comma-separated table names', fakeAsync(() => {
      mockLookupService.validateTableName.and.returnValue(of(true));

      const control = component.form.get('refTable');
      control?.setValue('TABLE1, TABLE2');
      tick(1000);

      expect(control?.valid).toBe(true);
    }));

    it('should not show error message during pending validation', () => {
      const control = component.form.get('refTable');
      control?.setValue('PENDING_TABLE');
      control?.markAsTouched();

      const errorMessage = component.getFieldError('refTable');
      expect(errorMessage).toBe('');
    });

    it('should display error message after failed validation', fakeAsync(() => {
      mockLookupService.validateTableName.and.returnValue(of(false));

      const control = component.form.get('refTable');
      control?.setValue('INVALID');
      control?.markAsTouched();
      tick(1000);

      const errorMessage = component.getFieldError('refTable');
      expect(errorMessage).toBe('One or more reference tables are invalid or not accessible');
    }));

    it('should show required error for empty table name', fakeAsync(() => {
      const control = component.form.get('refTable');
      control?.setValue('');
      tick(1000);

      expect(control?.hasError('required')).toBe(true);
    }));
  });

  describe('Async Validation - Reference Column', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should validate column name when table is provided', fakeAsync(() => {
      mockLookupService.validateColumnName.and.returnValue(of(true));

      component.form.patchValue({
        refTable: 'TABLE1',
        refColumn: 'COLUMN1'
      });
      tick(1000); // debounceTime (300ms) + validator timer (500ms) for table change
      tick(); // async validator

      expect(mockLookupService.validateColumnName).toHaveBeenCalledWith('TABLE1', 'COLUMN1');
      expect(component.form.get('refColumn')?.valid).toBe(true);
    }));

    it('should fail validation for invalid column name', fakeAsync(() => {
      mockLookupService.validateColumnName.and.returnValue(of(false));

      component.form.patchValue({
        refTable: 'TABLE1',
        refColumn: 'INVALID_COLUMN'
      });
      component.form.get('refColumn')?.markAsTouched();
      tick(1000);

      expect(component.form.get('refColumn')?.hasError('invalidRefColumn')).toBe(true);
    }));

    it('should require table before validating column', fakeAsync(() => {
      const control = component.form.get('refColumn');
      control?.setValue('COLUMN1');
      control?.markAsTouched();
      tick();

      expect(control?.hasError('refColumnWithoutTable')).toBe(true);
    }));

    it('should display error when column set without table', fakeAsync(() => {
      const control = component.form.get('refColumn');
      control?.setValue('COLUMN1');
      control?.markAsTouched();
      tick();

      const errorMessage = component.getFieldError('refColumn');
      expect(errorMessage).toBe('Reference table must be specified before reference column');
    }));

    it('should update column validator when table changes', fakeAsync(() => {
      // Set initial table and column
      component.form.patchValue({
        refTable: 'TABLE1',
        refColumn: 'COLUMN1'
      });
      tick(1000);

      mockLookupService.validateColumnName.calls.reset();

      // Change table
      component.form.get('refTable')?.setValue('TABLE2');
      tick(1000);

      // Column should be revalidated against new table
      expect(mockLookupService.validateColumnName).toHaveBeenCalledWith('TABLE2', 'COLUMN1');
    }));



    it('should show required error for empty column name', fakeAsync(() => {
      component.form.patchValue({
        refTable: 'TABLE1',
        refColumn: ''
      });
      tick(1000);

      expect(component.form.get('refColumn')?.hasError('required')).toBe(true);
    }));

    it('should display error message for invalid column', fakeAsync(() => {
      mockLookupService.validateColumnName.and.returnValue(of(false));

      component.form.patchValue({
        refTable: 'TABLE1',
        refColumn: 'BAD_COLUMN'
      });
      component.form.get('refColumn')?.markAsTouched();
      tick(1000);

      const errorMessage = component.getFieldError('refColumn');
      expect(errorMessage).toBe('Reference column not found in any of the specified tables');
    }));
  });

  describe('Async Validation - Error Messages', () => {
    beforeEach(() => {
      component.existingParameterCodes = ['DUP', 'EXISTING'];
      fixture.detectChanges();
    });

    it('should return correct error message for each error type', fakeAsync(() => {
      const testCases = [
        {
          field: 'parmNo',
          error: 'required',
          value: null,
          expected: 'Parm No is required'
        },
        {
          field: 'parmCode',
          error: 'duplicateParameterCode',
          value: 'DUP',
          expected: 'This parameter code already exists'
        },
        {
          field: 'parmType',
          error: 'invalidParameterType',
          value: 'INVALID',
          expected: 'Parameter Type must be CHAR, DATE, or NUM'
        }
      ];

      testCases.forEach(testCase => {
        const control = component.form.get(testCase.field);
        control?.setValue(testCase.value);
        control?.markAsTouched();
        tick();

        const errorMessage = component.getFieldError(testCase.field);
        expect(errorMessage).toContain(testCase.expected, `Error message for ${testCase.field}`);
      });
    }));

    it('should not display error messages for untouched fields', fakeAsync(() => {
      mockLookupService.validateTableName.and.returnValue(of(false));

      const control = component.form.get('refTable');
      control?.setValue('INVALID');
      tick(1000);

      // Field is touched = false
      const errorMessage = component.getFieldError('refTable');
      expect(errorMessage).toBe('');
    }));
  });

  describe('Form State with Async Validators', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });









    it('should keep save button disabled after failed validation', fakeAsync(() => {
      mockLookupService.validateTableName.and.returnValue(of(false));

      component.form.patchValue({
        parmNo: 1,
        parmCode: 'TEST',
        parmType: 'CHAR',
        refTable: 'INVALID_TABLE'
      });
      tick(1000);

      expect(component.isSaveDisabled).toBe(true);
    }));
  });

  describe('Max Length Validation', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should allow table names up to 30 characters', fakeAsync(() => {
      const maxLengthTable = 'A'.repeat(30);
      mockLookupService.validateTableName.and.returnValue(of(true));

      component.form.get('refTable')?.setValue(maxLengthTable);
      tick(1000);

      expect(component.form.get('refTable')?.valid).toBe(true);
    }));

    it('should allow column names up to 30 characters', fakeAsync(() => {
      const maxLengthColumn = 'B'.repeat(30);
      mockLookupService.validateColumnName.and.returnValue(of(true));

      component.form.patchValue({
        refTable: 'TABLE1',
        refColumn: maxLengthColumn
      });
      tick(1000);

      expect(component.form.get('refColumn')?.valid).toBe(true);
    }));
  });
});
