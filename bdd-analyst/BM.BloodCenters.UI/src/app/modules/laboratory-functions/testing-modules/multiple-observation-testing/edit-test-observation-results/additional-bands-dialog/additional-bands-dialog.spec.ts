import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AdditionalBandsDialogComponent, AdditionalBandsDialogData } from './additional-bands-dialog';

describe('AdditionalBandsDialogComponent', () => {
  let component: AdditionalBandsDialogComponent;
  let fixture: ComponentFixture<AdditionalBandsDialogComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AdditionalBandsDialogComponent>>;

  const mockDialogData: AdditionalBandsDialogData = {
    unitId: 'W12342402705-Q',
    otherBands: [
      { tech: '1', band1: 'riba1', band2: null },
      { tech: '2', band1: 'riba2', band2: null },
      { tech: 'S', band1: 'A', band2: null },
    ],
    testData: {
      header: {
        unitId: 'W12342402705-Q',
        testChapterId: 'CH01',
        testId: 'TEST01',
        tbId: 'TB01',
        tbSeqNo: 1,
        testType: 'M',
        testTypeDesc: 'Manual',
        ctrlVal: null,
        supYn: 'Y',
        otherBandsEnabled: 'Y',
        systemMessage: null,
        superIntp: null,
        superUser: null,
        superDate: null,
        tech1Intp: null,
        tech1User: null,
        tech1Date: null,
        tech2Intp: null,
        tech2User: null,
        tech2Date: null,
        noteId: null,
        reconFlag: null,
        programId: null,
      },
      details: [],
      otherBands: [],
    },
  };

  beforeEach(() => {

    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

      TestBed.configureTestingModule({
imports: [AdditionalBandsDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
      ],
    });

    });

  beforeEach(() => {

      dialogRefSpy.close.calls.reset();

    fixture = TestBed.createComponent(AdditionalBandsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    });

  describe('Initialization', () => {

    it('should display unit ID from dialog data', () => {
      const unitIdElement = fixture.debugElement.query(By.css('.unit-id-display .value'));
      expect(unitIdElement.nativeElement.textContent).toBe(mockDialogData.unitId);
    });

    it('should initialize rows', () => {
      expect((component as any).rows().length).toBeGreaterThan(0);
    });

    it('should have form groups for each row with supervisor control', () => {
      (component as any).rows().forEach((row: any) => {
        expect(row.formGroup).toBeDefined();
        expect(row.formGroup.get('supervisor')).toBeDefined();
      });
    });
  });

  describe('Table Display', () => {
    it('should display table with headers', () => {
      const headers = fixture.debugElement.queryAll(By.css('.other-bands-table thead th'));
      expect(headers.length).toBe(3);
      expect(headers[0].nativeElement.textContent).toContain('Tech 1');
      expect(headers[1].nativeElement.textContent).toContain('Tech 2');
      expect(headers[2].nativeElement.textContent).toContain('Supervisor');
    });
  });

  describe('Add New Functionality', () => {
    it('should create form group for new row', () => {
      const initialCount = (component as any).rows().length;

      component.onAddNew();

      const newRow = (component as any).rows()[initialCount];
      expect(newRow.formGroup).toBeDefined();
      expect(newRow.formGroup.get('supervisor')).toBeDefined();
    });

    it('should set empty supervisor value for new row', () => {
      component.onAddNew();

      const rows = (component as any).rows();
      const newRow = rows[rows.length - 1];
      expect(newRow.supervisor).toBe('');
    });
  });

  describe('Save Functionality', () => {
    it('should close dialog with result when save is clicked', () => {
      component.onSave();

      expect(dialogRefSpy.close).toHaveBeenCalled();
      const result = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBeTrue();
    });

    it('should collect form data from all rows', () => {
      const rows = (component as any).rows();
      rows[0].formGroup.patchValue({ supervisor: 'A' });

      component.onSave();

      const result = dialogRefSpy.close.calls.mostRecent().args[0];
      expect(result[0].supervisor).toBe('A');
    });
  });
  describe('Dropdown Options', () => {
    it('should have supervisor options', () => {
      expect((component as any).supervisorOptions().length).toBeGreaterThan(0);
    });

    it('should include expected supervisor values', () => {
      const options = (component as any).supervisorOptions();
      const values = options.map((o: any) => o.value);
      expect(values).toContain('A');
      expect(values).toContain('B');
      expect(values).toContain('D');
    });
  });

  describe('Form Validation', () => {
    it('should update supervisor value when form control changes', () => {
      const firstRow = (component as any).rows()[0];
      const supervisorControl = firstRow.formGroup.get('supervisor');

      supervisorControl?.setValue('B');

      expect(supervisorControl?.value).toBe('B');
    });
  });

  describe('Unique ID Generation', () => {
    it('should generate unique component IDs for multiple instances', () => {
      const fixture2 = TestBed.createComponent(AdditionalBandsDialogComponent);
      const component2 = fixture2.componentInstance;

      expect((component as any).componentId).not.toBe((component2 as any).componentId);
    });
  });

  describe('Initial Data Display', () => {
    it('should show supervisor value from other bands data', () => {
      const firstRow = (component as any).rows()[0];
      expect(firstRow.formGroup.get('supervisor')?.value).toBe('A');
    });
  });

  describe('Row Initialization', () => {
    it('should ensure minimum of 6 rows', () => {
      const rows = (component as any).rows();
      expect(rows.length).toBeGreaterThanOrEqual(6);
    });
  });
});
