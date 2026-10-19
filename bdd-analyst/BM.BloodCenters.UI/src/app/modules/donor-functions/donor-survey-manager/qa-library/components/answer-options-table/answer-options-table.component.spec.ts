import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { AnswerOptionsTableComponent } from './answer-options-table.component';
import { Answer } from '../../models/qa-library.models';

describe('AnswerOptionsTableComponent', () => {
  let component: AnswerOptionsTableComponent;
  let fixture: ComponentFixture<AnswerOptionsTableComponent>;

  const mockAnswers: Answer[] = [
    {
      sequence: 1,
      answerCode: 'A001',
      answerCodeDescription: 'Answer 1',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      auditKey: 1,
      isEditable: true,
      errors: {}
    },
    {
      sequence: 2,
      answerCode: 'A002',
      answerCodeDescription: 'Answer 2',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: new Date('2024-12-31'),
      auditKey: 1,
      isEditable: true,
      errors: {}
    },
    {
      sequence: 3,
      answerCode: 'A003',
      answerCodeDescription: 'Answer 3',
      effectiveDate: new Date('2024-01-01'),
      terminationDate: null,
      auditKey: 0, // New row
      isEditable: true,
      errors: {}
    }
  ];

  beforeEach(() => {



      TestBed.configureTestingModule({
      imports: [
        AnswerOptionsTableComponent,
        FormsModule],
      providers: [provideHttpClient()]
    });


    



    fixture = TestBed.createComponent(AnswerOptionsTableComponent);
    component = fixture.componentInstance;


    });


  describe('initialization', () => {
    it('should initialize with empty answerOptions', () => {
      expect(component.answerOptions).toEqual([]);
    });

    it('should initialize with empty dirtyRows Set', () => {
      expect(component.dirtyRows.size).toBe(0);
    });


  });

  describe('drag and drop - sequence swapping', () => {
    beforeEach(() => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));
    });

    it('should swap objects and sequences when dragging from index 0 to index 2', () => {
      const event: CdkDragDrop<Answer[]> = {
        previousIndex: 0,
        currentIndex: 2,
        item: null as any,
        container: null as any,
        previousContainer: null as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: null as any
      };

      spyOn(component.optionsChange, 'emit');

      component.onDrop(event);

      // Objects swap positions: A003 moves to index 0, A001 moves to index 2
      expect(component.answerOptions[0].answerCode).toBe('A003');
      expect(component.answerOptions[2].answerCode).toBe('A001');
      // Sequences reflect new positions (double swap = sequences stay with positions)
      expect(component.answerOptions[0].sequence).toBe(1);
      expect(component.answerOptions[2].sequence).toBe(3);
      expect(component.optionsChange.emit).toHaveBeenCalled();
    });

    it('should swap objects and sequences when dragging from index 2 to index 0', () => {
      const event: CdkDragDrop<Answer[]> = {
        previousIndex: 2,
        currentIndex: 0,
        item: null as any,
        container: null as any,
        previousContainer: null as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: null as any
      };

      spyOn(component.optionsChange, 'emit');

      component.onDrop(event);

      // Objects swap positions: A003 moves to index 0, A001 moves to index 2
      expect(component.answerOptions[0].answerCode).toBe('A003');
      expect(component.answerOptions[2].answerCode).toBe('A001');
      // Sequences reflect new positions
      expect(component.answerOptions[0].sequence).toBe(1);
      expect(component.answerOptions[2].sequence).toBe(3);
      expect(component.optionsChange.emit).toHaveBeenCalled();
    });

    it('should not change sequences when dropping at same position', () => {
      const event: CdkDragDrop<Answer[]> = {
        previousIndex: 1,
        currentIndex: 1,
        item: null as any,
        container: null as any,
        previousContainer: null as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: null as any
      };

      const originalSequences = component.answerOptions.map(a => a.sequence);
      spyOn(component.optionsChange, 'emit');

      component.onDrop(event);

      expect(component.answerOptions.map(a => a.sequence)).toEqual(originalSequences);
      expect(component.optionsChange.emit).not.toHaveBeenCalled();
    });




  });

  describe('add new option', () => {
    it('should add new option with next sequence number', () => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));
      spyOn(component.optionsChange, 'emit');

      component.addNewOption();

      expect(component.answerOptions.length).toBe(4);
      expect(component.answerOptions[3].sequence).toBe(4);
      expect(component.answerOptions[3].auditKey).toBe(0);
      expect(component.optionsChange.emit).toHaveBeenCalled();
    });

    it('should add first option with sequence 1 when array is empty', () => {
      component.answerOptions = [];
      spyOn(component.optionsChange, 'emit');

      component.addNewOption();

      expect(component.answerOptions.length).toBe(1);
      expect(component.answerOptions[0].sequence).toBe(1);
      expect(component.answerOptions[0].auditKey).toBe(0);
    });

    it('should initialize new option with empty values', () => {
      component.addNewOption();

      const newOption = component.answerOptions[0];
      expect(newOption.answerCode).toBe('');
      expect(newOption.answerCodeDescription).toBe('');
      expect(newOption.effectiveDate).toBeNull();
      expect(newOption.terminationDate).toBeNull();
      expect(newOption.errors).toEqual({});
    });


  });

  describe('delete row', () => {
    beforeEach(() => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));
    });

    it('should delete row with auditKey 0 (new row)', () => {
      spyOn(component.optionsChange, 'emit');

      component.deleteRow(2); // A003 has auditKey 0

      expect(component.answerOptions.length).toBe(2);
      expect(component.answerOptions.find(a => a.answerCode === 'A003')).toBeUndefined();
      expect(component.optionsChange.emit).toHaveBeenCalled();
    });

    it('should not delete row with auditKey > 0 (existing row)', () => {
      spyOn(component.optionsChange, 'emit');

      component.deleteRow(0); // A001 has auditKey 1

      expect(component.answerOptions.length).toBe(3);
      expect(component.answerOptions[0].answerCode).toBe('A001');
      expect(component.optionsChange.emit).not.toHaveBeenCalled();
    });

    it('should remove from dirtyRows when deleting', () => {
      component.dirtyRows.add(2);

      component.deleteRow(2);

      expect(component.dirtyRows.has(2)).toBe(false);
    });


  });

  describe('field change tracking', () => {
    beforeEach(() => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));
    });

    it('should mark row as dirty when field changes', () => {
      component.onFieldChange(0, 'answerCode', 'A001');

      expect(component.dirtyRows.has(0)).toBe(true);
    });



    it('should not clear other field errors', fakeAsync(() => {
      component.answerOptions[0].errors = {
        answerCode: 'Required',
        answerCodeDescription: 'Required'
      };

      component.onFieldChange(0, 'answerCode', 'A001');
      tick();

      expect(component.answerOptions[0].errors?.['answerCode']).toBeUndefined();
      expect(component.answerOptions[0].errors?.['answerCodeDescription']).toBe('Required');
    }));


  });

  describe('row validation', () => {
    let testRow: Answer;
    const futureDate = new Date('2099-12-31');
    const futureDatePlus1 = new Date('2100-01-01');

    beforeEach(() => {
      testRow = {
        sequence: 1,
        answerCode: 'A001',
        answerCodeDescription: 'Answer 1',
        effectiveDate: futureDate,  // Future date to avoid past-date validation failure
        terminationDate: null,
        auditKey: 0,
        isEditable: true,
        errors: {}
      };
      // Place testRow in answerOptions so validateRow can find it by index
      component.answerOptions = [testRow];
    });













    it('should invalidate when terminationDate < effectiveDate', () => {
      testRow.effectiveDate = futureDatePlus1;
      testRow.terminationDate = futureDate; // Strictly before effective

      const isValid = component.validateRow(testRow);

      expect(isValid).toBe(false);
      expect(testRow.errors?.['terminationDate']).toBeDefined();
    });

    it('should validate when terminationDate > effectiveDate (both future)', () => {
      testRow.effectiveDate = futureDate;
      testRow.terminationDate = futureDatePlus1;

      const isValid = component.validateRow(testRow);

      expect(isValid).toBe(true);
      expect(testRow.errors?.['terminationDate']).toBeUndefined();
    });

    it('should validate when terminationDate is null', () => {
      testRow.terminationDate = null;

      const isValid = component.validateRow(testRow);

      expect(isValid).toBe(true);
    });



    it('should accumulate multiple validation errors', () => {
      testRow.answerCode = '';
      testRow.answerCodeDescription = '';
      testRow.effectiveDate = null;

      const isValid = component.validateRow(testRow);

      expect(isValid).toBe(false);
      expect(testRow.errors?.['answerCode']).toBeDefined();
      expect(testRow.errors?.['answerCodeDescription']).toBeDefined();
      expect(testRow.errors?.['effectiveDate']).toBeDefined();
    });




  });

  describe('validateAllRows', () => {
    it('should return true when all rows are valid (existing rows with valid data)', () => {
      // Use existing rows (auditKey > 0) so past-date check is skipped
      const validRows: Answer[] = [
        {
          sequence: 1,
          answerCode: 'A001',
          answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'),
          terminationDate: null,
          auditKey: 1, // existing row — no past date check
          isEditable: true,
          errors: {}
        },
        {
          sequence: 2,
          answerCode: 'A002',
          answerCodeDescription: 'Answer 2',
          effectiveDate: new Date('2024-01-01'),
          terminationDate: null,
          auditKey: 1, // existing row — no past date check
          isEditable: true,
          errors: {}
        }
      ];
      component.answerOptions = validRows;
      // Trigger ngOnChanges to snapshot originalDates so existing rows are recognized as unchanged
      component.ngOnChanges({
        answerOptions: { currentValue: validRows, previousValue: [], firstChange: false, isFirstChange: () => false }
      });

      const isValid = component.validateAllRows();

      expect(isValid).toBe(true);
    });

    it('should return false when any row is invalid', () => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));
      component.answerOptions[1].answerCode = ''; // Make second row invalid

      const isValid = component.validateAllRows();

      expect(isValid).toBe(false);
    });

    it('should validate all rows in the array', () => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));
      spyOn(component, 'validateRow').and.callThrough();

      component.validateAllRows();

      expect(component.validateRow).toHaveBeenCalledTimes(3);
    });

    it('should return true for empty array', () => {
      component.answerOptions = [];

      const isValid = component.validateAllRows();

      expect(isValid).toBe(true);
    });

    it('should set errors on all invalid rows', () => {
      // Row 1 and 2 are existing (auditKey: 1); row 3 is new (auditKey: 0) so effectiveDate null check applies.
      // Existing rows skip effective date validation (per business rule: past dates are valid for saved records).
      const rows: Answer[] = [
        {
          sequence: 1,
          answerCode: '', // invalid: empty
          answerCodeDescription: 'Answer 1',
          effectiveDate: new Date('2024-01-01'),
          terminationDate: null,
          auditKey: 1,
          isEditable: true,
          errors: {}
        },
        {
          sequence: 2,
          answerCode: 'A002',
          answerCodeDescription: 'Answer 2',
          effectiveDate: new Date('2024-01-01'),
          terminationDate: null,
          auditKey: 1,
          isEditable: true,
          errors: {}
        },
        {
          sequence: 3,
          answerCode: 'A003',
          answerCodeDescription: 'Answer 3',
          effectiveDate: null, // invalid: missing (new row — auditKey: 0 — so null check applies)
          terminationDate: null,
          auditKey: 0,
          isEditable: true,
          errors: {}
        }
      ];
      component.answerOptions = rows;
      // Trigger ngOnChanges to snapshot originalDates for existing rows
      component.ngOnChanges({
        answerOptions: { currentValue: rows, previousValue: [], firstChange: false, isFirstChange: () => false }
      });

      component.validateAllRows();

      expect(component.answerOptions[0].errors?.['answerCode']).toBeDefined();
      expect(component.answerOptions[1].errors).toEqual({});
      expect(component.answerOptions[2].errors?.['effectiveDate']).toBeDefined();
    });
  });

  describe('hasNewRows', () => {
    it('should return true when there are rows with auditKey 0', () => {
      component.answerOptions = mockAnswers.map(a => ({ ...a })); // Contains one with auditKey 0

      expect(component.hasNewRows()).toBe(true);
    });

    it('should return false when all rows have auditKey > 0', () => {
      component.answerOptions = mockAnswers.slice(0, 2).map(a => ({ ...a })); // Only existing rows

      expect(component.hasNewRows()).toBe(false);
    });

    it('should return false for empty array', () => {
      component.answerOptions = [];

      expect(component.hasNewRows()).toBe(false);
    });

    it('should return true even if only one new row exists', () => {
      component.answerOptions = [
        { ...mockAnswers[0], auditKey: 1 },
        { ...mockAnswers[1], auditKey: 1 },
        { ...mockAnswers[2], auditKey: 0 }
      ];

      expect(component.hasNewRows()).toBe(true);
    });
  });

  describe('removeBlankRows', () => {
    it('should remove new rows with empty answerCode and description', () => {
      component.answerOptions = [
        { ...mockAnswers[0] }, // existing row (auditKey 1)
        {
          sequence: 2, answerCode: '', answerCodeDescription: '',
          effectiveDate: new Date(), terminationDate: null,
          auditKey: 0, isEditable: true, errors: {}
        }
      ];

      const removed = component.removeBlankRows();

      expect(removed).toBe(1);
      expect(component.answerOptions.length).toBe(1);
      expect(component.answerOptions[0].answerCode).toBe('A001');
    });











    it('should return 0 when there are no blank rows', () => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));

      const removed = component.removeBlankRows();

      expect(removed).toBe(0);
    });
  });

  describe('addNewOption with question dates', () => {
    it('should auto-populate effectiveDate from questionEffectiveDate', () => {
      const qEffDate = new Date('2025-06-01');
      component.questionEffectiveDate = qEffDate;
      component.answerOptions = [];

      component.addNewOption();

      expect(component.answerOptions[0].effectiveDate).toBe(qEffDate);
    });

    it('should auto-populate terminationDate from questionTerminationDate', () => {
      const qTermDate = new Date('2025-12-31');
      component.questionTerminationDate = qTermDate;
      component.answerOptions = [];

      component.addNewOption();

      expect(component.answerOptions[0].terminationDate).toBe(qTermDate);
    });



    it('should always set isEditable to true for new rows', () => {
      component.answerOptions = [];

      component.addNewOption();

      expect(component.answerOptions[0].isEditable).toBe(true);
    });
  });

  describe('hasValidationErrors', () => {
    it('should return false when no rows have errors', () => {
      component.answerOptions = [
        { ...mockAnswers[0], errors: {} },
        { ...mockAnswers[1], errors: {} }
      ];

      expect(component.hasValidationErrors).toBe(false);
    });

    it('should return true when any row has errors', () => {
      component.answerOptions = [
        { ...mockAnswers[0], errors: {} },
        { ...mockAnswers[1], errors: { answerCode: 'Required' } }
      ];

      expect(component.hasValidationErrors).toBe(true);
    });

    it('should return false for empty array', () => {
      component.answerOptions = [];

      expect(component.hasValidationErrors).toBe(false);
    });
  });

  describe('hasRowErrors', () => {
    it('should return false when errors is empty object', () => {
      const row: Answer = { ...mockAnswers[0], errors: {} };

      expect(component.hasRowErrors(row)).toBe(false);
    });

    it('should return true when errors has entries', () => {
      const row: Answer = { ...mockAnswers[0], errors: { answerCode: 'Error' } };

      expect(component.hasRowErrors(row)).toBe(true);
    });

    it('should return false when errors is undefined', () => {
      const row: Answer = { ...mockAnswers[0], errors: undefined as any };

      expect(component.hasRowErrors(row)).toBe(false);
    });
  });

  describe('validateRow - effectiveDate before question effectiveDate', () => {
    it('should invalidate when option effectiveDate is before question effectiveDate', () => {
      component.questionEffectiveDate = new Date('2099-06-01');
      const row: Answer = {
        sequence: 1, answerCode: 'A01', answerCodeDescription: 'Desc',
        effectiveDate: new Date('2099-03-01'), terminationDate: null,
        auditKey: 0, isEditable: true, errors: {}
      };
      // Place row in answerOptions so validateRow can find it by index
      component.answerOptions = [row];

      component.validateRow(row);

      expect(row.errors?.['effectiveDate']).toBe('Effective Date cannot be before Question Effective Date');
    });

    it('should allow when option effectiveDate equals question effectiveDate', () => {
      component.questionEffectiveDate = new Date('2099-06-01');
      const row: Answer = {
        sequence: 1, answerCode: 'A01', answerCodeDescription: 'Desc',
        effectiveDate: new Date('2099-06-01'), terminationDate: null,
        auditKey: 0, isEditable: true, errors: {}
      };

      const isValid = component.validateRow(row);

      expect(isValid).toBe(true);
      expect(row.errors?.['effectiveDate']).toBeUndefined();
    });
  });
  describe('answer code uppercase conversion', () => {
    beforeEach(() => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));
    });

    it('should convert answer code to uppercase', () => {
      const input = document.createElement('input');
      input.value = 'abc123';
      const event = { target: input } as unknown as Event;
      spyOn(component.optionsChange, 'emit');

      component.onAnswerCodeInput(event, 0);

      expect(input.value).toBe('ABC123');
      expect(component.answerOptions[0].answerCode).toBe('ABC123');
      expect(component.optionsChange.emit).toHaveBeenCalled();
    });



    it('should not emit when value is already uppercase alphanumeric', () => {
      const input = document.createElement('input');
      input.value = 'ABC123';
      const event = { target: input } as unknown as Event;
      spyOn(component.optionsChange, 'emit');

      component.onAnswerCodeInput(event, 0);

      expect(component.answerOptions[0].answerCode).toBe('A001');
      expect(component.optionsChange.emit).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {


    it('should handle multiple adds and deletes', () => {
      component.answerOptions = [];

      component.addNewOption();
      component.addNewOption();
      expect(component.answerOptions.length).toBe(2);

      component.deleteRow(0);
      expect(component.answerOptions.length).toBe(1);

      component.addNewOption();
      expect(component.answerOptions.length).toBe(2);
    });

    it('should preserve data during sequence swap', () => {
      component.answerOptions = mockAnswers.map(a => ({ ...a }));
      const firstRowData = { ...component.answerOptions[0] };
      const thirdRowData = { ...component.answerOptions[2] };

      const event: CdkDragDrop<Answer[]> = {
        previousIndex: 0,
        currentIndex: 2,
        item: null as any,
        container: null as any,
        previousContainer: null as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
        event: null as any
      };

      component.onDrop(event);

      // Data should be preserved except sequence
      expect(component.answerOptions[2].answerCode).toBe(firstRowData.answerCode);
      expect(component.answerOptions[0].answerCode).toBe(thirdRowData.answerCode);
    });
  });
});
