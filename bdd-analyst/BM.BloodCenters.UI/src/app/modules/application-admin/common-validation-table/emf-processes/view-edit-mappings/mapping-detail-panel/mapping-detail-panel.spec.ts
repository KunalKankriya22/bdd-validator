import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { of, throwError } from 'rxjs';

import { MappingDetailPanel, MappingDetailPayload } from './mapping-detail-panel';
import { ManufLookupService } from '../../services/manuf-lookup.service';
import { ProcessMappingService } from '../../services/process-mapping.service';
import { ProcessMappingDto } from '../../interfaces/process-mapping.interface';

describe('MappingDetailPanel', () => {
  let component: MappingDetailPanel;
  let fixture: ComponentFixture<MappingDetailPanel>;
  let mockLookupService: jasmine.SpyObj<ManufLookupService>;
  let mockMappingService: jasmine.SpyObj<ProcessMappingService>;

  const mockTableNames = ['Table1', 'Table2', 'CustomerData', 'OrderHistory'];
  const mockColumnNames = ['Column1', 'Column2', 'CustomerID', 'OrderDate'];

  const mockMappingData: ProcessMappingDto = {
    processCode: 'PROC001',
    mappingName: 'TestMapping',
    dataTableName: 'Table1',
    dataColumnName: 'Column1',
    whereClause: 'ID > 100',
    sqlStmt: 'SELECT * FROM Table1 WHERE ID > 100'
  };

  beforeEach(() => {

    mockLookupService = jasmine.createSpyObj('ManufLookupService', [
      'getTableNames',
      'getColumnNames',
      'validateTableName',
      'validateColumnName'
    ]);

    mockMappingService = jasmine.createSpyObj('ProcessMappingService', [
      'checkDuplicateMappingName'
    ]);
    mockMappingService.checkDuplicateMappingName.and.returnValue(of(false));

    mockLookupService.getTableNames.and.returnValue(of(mockTableNames));
    mockLookupService.getColumnNames.and.returnValue(of(mockColumnNames));
    mockLookupService.validateTableName.and.returnValue(of(true));
    mockLookupService.validateColumnName.and.returnValue(of(true));



      TestBed.configureTestingModule({
      imports: [
        MappingDetailPanel,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatSelectModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        NgxMatSelectSearchModule],
      providers: [
        { provide: ManufLookupService, useValue: mockLookupService },
        { provide: ProcessMappingService, useValue: mockMappingService }
      ]
    });


    


      mockLookupService.getTableNames.calls.reset();


      mockLookupService.getColumnNames.calls.reset();


      mockLookupService.validateTableName.calls.reset();


      mockLookupService.validateColumnName.calls.reset();


      mockMappingService.checkDuplicateMappingName.calls.reset();


      mockMappingService.checkDuplicateMappingName.and.returnValue(of(false));


      mockLookupService.getTableNames.and.returnValue(of(mockTableNames));


      mockLookupService.getColumnNames.and.returnValue(of(mockColumnNames));


      mockLookupService.validateTableName.and.returnValue(of(true));


      mockLookupService.validateColumnName.and.returnValue(of(true));


    fixture = TestBed.createComponent(MappingDetailPanel);
    component = fixture.componentInstance;


    });


  describe('Initialization', () => {


    it('should load table names on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(mockLookupService.getTableNames).toHaveBeenCalledTimes(1);
      expect(component.tableOptions()).toEqual(mockTableNames);
    }));






  });

  describe('Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should initialize with empty form values', () => {
      expect(component.form.get('mappingName')?.value).toBe('');
      expect(component.form.get('dataTableName')?.value).toBe('');
      expect(component.form.get('dataColumnName')?.value).toBe('');
      expect(component.form.get('whereClause')?.value).toBe('');
      expect(component.form.get('sqlStmt')?.value).toBe('');
    });



    it('should not require dataTableName field', () => {
      const control = component.form.get('dataTableName');

      control?.setValue('');
      expect(control?.hasError('required')).toBe(false);
    });

    it('should not require dataColumnName field', () => {
      const control = component.form.get('dataColumnName');

      control?.setValue('');
      expect(control?.hasError('required')).toBe(false);
    });

    it('should not require sqlStmt field', () => {
      const control = component.form.get('sqlStmt');

      control?.setValue('');
      expect(control?.hasError('required')).toBe(false);
    });












  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.editData = mockMappingData;
      fixture.detectChanges();
    });



    it('should load column names when table is provided', fakeAsync(() => {
      tick();

      expect(mockLookupService.getColumnNames).toHaveBeenCalledWith('Table1');
      expect(component.columnOptions()).toEqual(mockColumnNames);
    }));


  });

  describe('Table and Column Selection', () => {
    beforeEach(() => {
      component.mode = 'add';
      fixture.detectChanges();
    });

    it('should load column names when table is selected', fakeAsync(() => {
      component.form.get('dataTableName')?.setValue('Table1');
      tick(300);

      expect(mockLookupService.getColumnNames).toHaveBeenCalledWith('Table1');
      expect(component.columnOptions()).toEqual(mockColumnNames);
    }));

    it('should clear column options when table is empty', fakeAsync(() => {
      component.form.get('dataTableName')?.setValue('Table1');
      tick(300);

      component.form.get('dataTableName')?.setValue('');
      tick(300);

      expect(component.columnOptions()).toEqual([]);
    }));




  });

  describe('Auto-Generated SQL', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should generate SQL from table name only', () => {
      component.form.patchValue({
        dataTableName: 'Table1'
      });

      expect(component.autoGeneratedSql).toBe('SELECT *\nFROM Table1');
    });

    it('should generate SQL with WHERE clause', () => {
      component.form.patchValue({
        dataTableName: 'Table1',
        whereClause: 'ID > 100'
      });

      expect(component.autoGeneratedSql).toBe('SELECT *\nFROM Table1\nWHERE ID > 100');
    });



    it('should trim WHERE clause whitespace', () => {
      component.form.patchValue({
        dataTableName: 'Table1',
        whereClause: '  Status = 1  '
      });

      expect(component.autoGeneratedSql).toBe('SELECT *\nFROM Table1\nWHERE Status = 1');
    });

    it('should not include WHERE clause if it is only whitespace', () => {
      component.form.patchValue({
        dataTableName: 'Table1',
        whereClause: '   '
      });

      expect(component.autoGeneratedSql).toBe('SELECT *\nFROM Table1');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(fakeAsync(() => {
      fixture.detectChanges();
      tick();
    }));

    it('should filter table options based on search', fakeAsync(() => {
      component.tableSearchControl.setValue('Customer');
      tick();

      const filtered = component.filteredTableOptions();
      expect(filtered).toEqual(['CustomerData']);
    }));

    it('should filter column options based on search', fakeAsync(() => {
      component.form.get('dataTableName')?.setValue('Table1');
      tick(300);

      component.columnSearchControl.setValue('Customer');
      tick();

      const filtered = component.filteredColumnOptions();
      expect(filtered).toEqual(['CustomerID']);
    }));





    it('should handle partial matches', fakeAsync(() => {
      component.tableSearchControl.setValue('able');
      tick();

      const filtered = component.filteredTableOptions();
      expect(filtered.length).toBe(2); // Table1, Table2
    }));
  });

  describe('Add and Create Another', () => {
    beforeEach(() => {
      component.processCode = 'PROC001';
      component.mode = 'add';
      fixture.detectChanges();
    });



    it('should reset form after save and create another', () => {
      component.form.patchValue({
        mappingName: 'TestMapping',
        dataTableName: 'Table1',
        dataColumnName: 'Column1'
      });

      component.onAddAndCreateAnother();

      expect(component.form.get('mappingName')?.value).toBe('');
      expect(component.form.get('dataTableName')?.value).toBe('');
      expect(component.form.get('dataColumnName')?.value).toBe('');
    });

    it('should clear column options after reset', () => {
      component.form.patchValue({
        mappingName: 'TestMapping',
        dataTableName: 'Table1'
      });

      component.onAddAndCreateAnother();

      expect(component.columnOptions()).toEqual([]);
    });

    it('should mark form as untouched after reset', () => {
      component.form.patchValue({
        mappingName: 'TestMapping'
      });
      component.form.markAllAsTouched();

      component.onAddAndCreateAnother();

      expect(component.form.touched).toBe(false);
    });


  });

  describe('Clear All', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should clear column options', () => {
      component.onClearAll();

      expect(component.columnOptions()).toEqual([]);
    });

    it('should mark form as untouched', () => {
      component.form.markAllAsTouched();

      component.onClearAll();

      expect(component.form.touched).toBe(false);
    });


  });
  describe('Form Validation with SQL Statement', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });



    it('should allow empty SQL statement', fakeAsync(() => {
      component.form.patchValue({
        mappingName: 'NoSQLMapping',
        sqlStmt: ''
      });

      tick(1000); // Wait for async validators to complete

      expect(component.form.valid).toBe(true);
    }));




  });
});
