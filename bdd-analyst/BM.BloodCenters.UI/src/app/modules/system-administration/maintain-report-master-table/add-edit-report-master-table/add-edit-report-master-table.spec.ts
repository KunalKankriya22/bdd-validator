import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { AddEditReportMasterTable } from './add-edit-report-master-table';
import { ReportMasterTableService } from '../services/report-master-table.service';

/**
 * Helper to create a ClipboardEvent with clipboardData for jsdom.
 * jsdom does not support DataTransfer or passing clipboardData via
 * the ClipboardEvent constructor, so we build a plain Event and
 * attach the clipboardData property manually.
 */
function createPasteEvent(text: string): ClipboardEvent {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as any;
  event.clipboardData = {
    getData: (_format: string) => text,
    setData: () => {},
  };
  // Provide a spyable preventDefault
  event.preventDefault = jest.fn();
  return event as ClipboardEvent;
}

describe('AddEditReportMasterTable', () => {
  let reportServiceSpy: any;
  let dialogRefSpy: any;
  let component: AddEditReportMasterTable;
  let fixture: ComponentFixture<AddEditReportMasterTable>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<AddEditReportMasterTable>>;
  let snackBar: MatSnackBar;
  let reportService: jasmine.SpyObj<ReportMasterTableService>;

  const mockLovResponse = {
    warehouses: [
      { id: 'B', description: 'Blood Center Technologies' },
      { id: 'H', description: 'Home Warehouse' }
    ],
    chapters: [
      { id: 'DAL', name: 'Dallas Chapter' },
      { id: 'OBK', name: 'Dallas Chapter' }
    ]
  };

  const mockRecord = {
    chapterID: 'KKKK',
    type: 'RPT01',
    code: 'TEST001',
    description: 'Test Description',
    command: '10.20.30.45',
    port: '9100',
    sequence: '45',
    warehouse: 'W',
    clientHostName: 'scan-node-09'
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    
    const snackBarMock = {
      open: jasmine.createSpy('open').and.returnValue({
        dismiss: jasmine.createSpy('dismiss')
      })
    };
    
    reportServiceSpy = jasmine.createSpyObj('ReportMasterTableService', [
      'getWarehouseChapterDropdowns',
      'createReportMaster',
      'updateReportMaster'
    ]);

    reportServiceSpy.getWarehouseChapterDropdowns.and.returnValue(of(mockLovResponse));
    reportServiceSpy.createReportMaster.and.returnValue(of({ success: true }));
    reportServiceSpy.updateReportMaster.and.returnValue(of({ success: true }));

      TestBed.configureTestingModule({
      imports: [
        AddEditReportMasterTable,
        NoopAnimationsModule,
      ],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: ReportMasterTableService, useValue: reportServiceSpy },
        { provide: MAT_DIALOG_DATA, useValue: { mode: 'add' } },
      ],
    })
    .overrideComponent(AddEditReportMasterTable, {
      remove: { providers: [] },
      add: { providers: [{ provide: MatSnackBar, useValue: snackBarMock }] }
    });

    

      dialogRefSpy.close.calls.reset();

      reportServiceSpy.getWarehouseChapterDropdowns.calls.reset();

      reportServiceSpy.createReportMaster.calls.reset();

      reportServiceSpy.updateReportMaster.calls.reset();

      reportServiceSpy.getWarehouseChapterDropdowns.and.returnValue(of(mockLovResponse));

      reportServiceSpy.createReportMaster.and.returnValue(of({ success: true }));

      reportServiceSpy.updateReportMaster.and.returnValue(of({ success: true }));

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AddEditReportMasterTable>>;
    snackBar = TestBed.inject(MatSnackBar);
    reportService = TestBed.inject(ReportMasterTableService) as jasmine.SpyObj<ReportMasterTableService>;

    fixture = TestBed.createComponent(AddEditReportMasterTable);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Call detectChanges in beforeEach

    });

  describe('Initialization', () => {

    it('should initialize form in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditReportMasterTable);
      const editComponent = editFixture.componentInstance;
      editComponent.data = { mode: 'edit', record: mockRecord };
      editComponent.ngOnInit();

      expect(editComponent.mode).toBe('edit');
      expect(editComponent.title).toBe('Edit Record');
      expect(editComponent.form.get('chapterID')?.value).toBe(mockRecord.chapterID);
      expect(editComponent.form.get('chapterID')?.disabled).toBe(true);
      expect(editComponent.form.get('type')?.disabled).toBe(true);
    });


    it('should populate form with record data in edit mode', () => {
      const editFixture = TestBed.createComponent(AddEditReportMasterTable);
      const editComponent = editFixture.componentInstance;
      editComponent.data = { mode: 'edit', record: mockRecord };
      editComponent.ngOnInit();

      expect(editComponent.form.get('code')?.value).toBe(mockRecord.code);
      expect(editComponent.form.get('description')?.value).toBe(mockRecord.description);
      expect(editComponent.form.get('command')?.value).toBe(mockRecord.command);
      expect(editComponent.form.get('port')?.value).toBe(mockRecord.port);
    });
  });

  describe('Form Validation', () => {
    it('should require chapterID field in add mode', () => {
      component.mode = 'add';
      component.ngOnInit();
      const chapterControl = component.form.get('chapterID');
      chapterControl?.setValue('');
      expect(chapterControl?.hasError('required')).toBe(true);
    });

    it('should not require chapterID field in edit mode', () => {
      component.mode = 'edit';
      component.data = { mode: 'edit', record: mockRecord };
      component.ngOnInit();
      const chapterControl = component.form.get('chapterID');
      expect(chapterControl?.hasError('required')).toBe(false);
    });

    it('should require type field', () => {
      const typeControl = component.form.get('type');
      typeControl?.setValue('');
      expect(typeControl?.hasError('required')).toBe(true);
    });

    it('should validate type max length (6)', () => {
      const typeControl = component.form.get('type');
      typeControl?.setValue('TOOLONG'); // 7 chars — exceeds max
      expect(typeControl?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid type at max length (6)', () => {
      const typeControl = component.form.get('type');
      typeControl?.setValue('ABCDEF'); // exactly 6 chars
      expect(typeControl?.valid).toBe(true);
    });

    it('should require code field', () => {
      const codeControl = component.form.get('code');
      codeControl?.setValue('');
      expect(codeControl?.hasError('required')).toBe(true);
    });

    it('should validate code max length (15)', () => {
      const codeControl = component.form.get('code');
      codeControl?.setValue('a'.repeat(16));
      expect(codeControl?.hasError('maxlength')).toBe(true);
    });

    it('should accept valid code within max length', () => {
      const codeControl = component.form.get('code');
      codeControl?.setValue('a'.repeat(15));
      expect(codeControl?.valid).toBe(true);
    });

    it('should require description field', () => {
      const descControl = component.form.get('description');
      descControl?.setValue('');
      expect(descControl?.hasError('required')).toBe(true);
    });

    it('should validate description whitespace only', () => {
      const descControl = component.form.get('description');
      descControl?.setValue('   ');
      expect(descControl?.hasError('whitespaceOnly')).toBe(true);
    });

    it('should validate description max length (30)', () => {
      const descControl = component.form.get('description');
      descControl?.setValue('This is a very long description that exceeds thirty characters');
      expect(descControl?.hasError('maxlength')).toBe(true);
    });

    it('should validate command max length (50)', () => {
      const commandControl = component.form.get('command');
      commandControl?.setValue('a'.repeat(51));
      expect(commandControl?.hasError('maxlength')).toBe(true);
    });

    it('should validate port is numeric only', () => {
      const portControl = component.form.get('port');
      portControl?.setValue('abc123');
      expect(portControl?.hasError('pattern')).toBe(true);
    });

    it('should validate port minimum value (1)', () => {
      const portControl = component.form.get('port');
      portControl?.setValue('0');
      expect(portControl?.hasError('min')).toBe(true);
    });

    it('should validate port maximum value (65535)', () => {
      const portControl = component.form.get('port');
      portControl?.setValue('65536');
      expect(portControl?.hasError('max')).toBe(true);
    });

    it('should accept valid port value', () => {
      const portControl = component.form.get('port');
      portControl?.setValue('8080');
      expect(portControl?.valid).toBe(true);
    });

    it('should validate clientHostName max length (100)', () => {
      const clientControl = component.form.get('clientHostName');
      clientControl?.setValue('a'.repeat(101));
      expect(clientControl?.hasError('maxlength')).toBe(true);
    });

    it('should validate sequence minimum value (0)', () => {
      const seqControl = component.form.get('sequence');
      seqControl?.setValue(-1);
      expect(seqControl?.hasError('min')).toBe(true);
    });

    it('should accept sequence value of 0', () => {
      const seqControl = component.form.get('sequence');
      seqControl?.setValue(0);
      expect(seqControl?.valid).toBe(true);
    });

    it('should validate sequence maximum value (999)', () => {
      const seqControl = component.form.get('sequence');
      seqControl?.setValue(1000);
      expect(seqControl?.hasError('max')).toBe(true);
    });

    it('should accept valid sequence value', () => {
      const seqControl = component.form.get('sequence');
      seqControl?.setValue(500);
      expect(seqControl?.valid).toBe(true);
    });

  });
  describe('onSave - Add Mode', () => {
    beforeEach(() => {
      component.mode = 'add';
      component.form.patchValue({
        chapterID: 'KKKK',
        type: 'RPT01',
        code: 'TEST001',
        description: 'Test Description',
        command: '10.20.30.45',
        port: '9100',
        sequence: '45',
        warehouse: 'W',
        clientHostName: ''
      });
    });

    it('should show error message if form is invalid', () => {
      component.form.patchValue({ code: '' });
      component.form.get('code')?.markAsTouched();
      expect(component.form.invalid).toBe(true);
      expect(component.form.get('code')?.invalid).toBe(true);
      
      component.onSave();

      expect(snackBar.open).toHaveBeenCalled();
    });

    it('should create record successfully in add mode', fakeAsync(() => {
      component.onSave();
      flush();

      expect(reportService.createReportMaster).toHaveBeenCalledWith(jasmine.objectContaining({
        chapterId: 'KKKK',
        codeType: 'RPT01',
        code: 'TEST001',
        codeDescription: 'Test Description'
      }));
      
      tick();

      // Updated to match the actual message format from API
      expect(snackBar.open).toHaveBeenCalledWith(
        'New Report with code TEST001 has been added to the Master Table successfully',
        'DISMISS',
        {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar-position']
        }
      );
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    }));


    it('should convert sequence to number', () => {
      component.form.patchValue({ sequence: '100' });
      component.onSave();

      expect(reportService.createReportMaster).toHaveBeenCalledWith(jasmine.objectContaining({
        sequence: 100
      }));
    });
  });

  describe('onSave - Edit Mode', () => {
    beforeEach(() => {
      component.mode = 'edit';
      component.data = { mode: 'edit', record: mockRecord };
      component.ngOnInit();
      component.form.patchValue({
        description: 'Updated Description',
        command: '10.20.30.45',
        port: '9100',
        sequence: '45',
        warehouse: 'W',
        clientHostName: ''
      });
    });

    it('should update record successfully in edit mode', fakeAsync(() => {
      component.onSave();
      flush();

      expect(reportService.updateReportMaster).toHaveBeenCalled();
      
      tick();

      // Updated to match the actual message format from API
      expect(snackBar.open).toHaveBeenCalledWith(
        'Report with code TEST001 has been updated successfully',
        'DISMISS',
        {
          duration: 5000,
          horizontalPosition: 'right',
          verticalPosition: 'top',
          panelClass: ['custom-snackbar-position']
        }
      );
      expect(dialogRef.close).toHaveBeenCalledWith(true);
    }));


  });

  describe('loadDropdowns', () => {

    it('should populate chapterOptions from response chapters[].id', () => {
      component.loadDropdowns();
      expect(component.chapterOptions).toContain('DAL');
      expect(component.chapterOptions).toContain('OBK');
    });

    it('should sync filteredChapterOptions with chapterOptions after load', () => {
      component.loadDropdowns();
      expect(component.filteredChapterOptions).toEqual(component.chapterOptions);
    });

    it('should populate warehouseOptions mapping id→code and description→name', () => {
      component.loadDropdowns();
      expect(component.warehouseOptions.length).toBe(2);
      expect(component.warehouseOptions.some(w => w.code === 'B' && w.name === 'Blood Center Technologies')).toBe(true);
      expect(component.warehouseOptions.some(w => w.code === 'H' && w.name === 'Home Warehouse')).toBe(true);
    });

    it('should sync filteredWarehouseOptions with warehouseOptions after load', () => {
      component.loadDropdowns();
      expect(component.filteredWarehouseOptions).toEqual(component.warehouseOptions);
    });


    it('should handle error loading dropdowns', fakeAsync(() => {
      reportService.getWarehouseChapterDropdowns.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.loadDropdowns();
      flush();

      expect(snackBar.open).toHaveBeenCalledWith('Failed to load dropdown values', 'DISMISS', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
        panelClass: ['custom-snackbar-position']
      });
    }));

  });
  describe('onTypeInput', () => {
    it('should convert lowercase input to uppercase', () => {
      const mockInput = document.createElement('input');
      mockInput.value = 'rpt01';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: mockInput, enumerable: true });

      component.onTypeInput(event);

      expect(component.form.get('type')?.value).toBe('RPT01');
      expect(mockInput.value).toBe('RPT01');
    });

    it('should not call patchValue when input is already uppercase', () => {
      const mockInput = document.createElement('input');
      mockInput.value = 'RPT01';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: mockInput, enumerable: true });

      const patchSpy = spyOn(component.form, 'patchValue').and.callThrough();
      component.onTypeInput(event);

      expect(patchSpy).not.toHaveBeenCalled();
      expect(mockInput.value).toBe('RPT01');
    });

    it('should convert mixed case to uppercase', () => {
      const mockInput = document.createElement('input');
      mockInput.value = 'AbCdEf';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: mockInput, enumerable: true });

      component.onTypeInput(event);

      expect(component.form.get('type')?.value).toBe('ABCDEF');
      expect(mockInput.value).toBe('ABCDEF');
    });
  });

  describe('onCodeInput', () => {
    it('should convert lowercase code input to uppercase', () => {
      const mockInput = document.createElement('input');
      mockInput.value = 'test001';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: mockInput, enumerable: true });

      component.onCodeInput(event);

      expect(component.form.get('code')?.value).toBe('TEST001');
      expect(mockInput.value).toBe('TEST001');
    });

    it('should not call patchValue when code is already uppercase', () => {
      const mockInput = document.createElement('input');
      mockInput.value = 'TEST001';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: mockInput, enumerable: true });

      const patchSpy = spyOn(component.form, 'patchValue').and.callThrough();
      component.onCodeInput(event);

      expect(patchSpy).not.toHaveBeenCalled();
      expect(mockInput.value).toBe('TEST001');
    });

    it('should convert mixed alphanumeric input to uppercase', () => {
      const mockInput = document.createElement('input');
      mockInput.value = 'abc123xyz';
      const event = new Event('input');
      Object.defineProperty(event, 'target', { value: mockInput, enumerable: true });

      component.onCodeInput(event);

      expect(component.form.get('code')?.value).toBe('ABC123XYZ');
      expect(mockInput.value).toBe('ABC123XYZ');
    });
  });

  describe('onSequencePaste', () => {
    it('should paste valid number within range (0-999)', () => {
      const event = createPasteEvent('500');

      component.onSequencePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('sequence')?.value).toBe(500);
    });

    it('should sanitize pasted value with non-numeric characters', () => {
      const event = createPasteEvent('abc123def');

      component.onSequencePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('sequence')?.value).toBe(123);
    });

    it('should accept value of 0', () => {
      const event = createPasteEvent('0');

      component.onSequencePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('sequence')?.value).toBe(0);
    });

    it('should reject value below minimum (< 0)', () => {
      const event = createPasteEvent('-1');

      component.onSequencePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('sequence')?.value).not.toBe(-1);
    });

    it('should reject value above maximum (> 999)', () => {
      const event = createPasteEvent('1000');

      component.onSequencePaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('sequence')?.value).not.toBe(1000);
    });

  });


  describe('onPortPaste', () => {
    it('should paste valid port within range (1-65535)', () => {
      const event = createPasteEvent('8080');

      component.onPortPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('port')?.value).toBe('8080');
    });

    it('should sanitize pasted value with non-numeric characters', () => {
      const event = createPasteEvent('abc9100def');

      component.onPortPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('port')?.value).toBe('9100');
    });

    it('should accept edge case value (65535)', () => {
      const event = createPasteEvent('65535');

      component.onPortPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('port')?.value).toBe('65535');
    });

    it('should accept minimum valid port (1)', () => {
      const event = createPasteEvent('1');

      component.onPortPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('port')?.value).toBe('1');
    });

    it('should reject value below minimum (0)', () => {
      const event = createPasteEvent('0');

      component.onPortPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('port')?.value).not.toBe('0');
    });

    it('should reject value above maximum (65536)', () => {
      const event = createPasteEvent('65536');

      component.onPortPaste(event);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(component.form.get('port')?.value).not.toBe('65536');
    });
  });
});