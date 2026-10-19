import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { SqlStatementDialogComponent, SqlStatementDialogData } from './sql-statement-dialog';
import { ProcessStep } from '../process-steps-list/process-steps-list';
import { ReflexiveAction } from '../reflexive-actions-list/reflexive-actions-list';

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.resolve() },
    writable: true,
    configurable: true
  });
});

describe('SqlStatementDialogComponent', () => {
  let component: SqlStatementDialogComponent;
  let fixture: ComponentFixture<SqlStatementDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<SqlStatementDialogComponent>>;

  const mockSteps: ProcessStep[] = [
    {
      id: '1', sequence: '1.00', name: 'BLOOD_TYPE',
      conditions: [
        { id: '1.01', sequence: '1.01', description: 'BLOOD_TYPE | DONOR_INFO / BLOOD_CD, EQUALS, A+' }
      ]
    },
    {
      id: '2', sequence: '2.00', name: 'WEIGHT',
      conditions: [
        { id: '2.01', sequence: '2.01', description: 'WEIGHT | DONOR_PHYS / WEIGHT_KG, IS, NULL' }
      ]
    }
  ];

  const mockActions: ReflexiveAction[] = [
    { id: '1', code: '1', name: 'INSERT', actionOn: 'DONOR', actionValue: 'Y', badge: 'F1' }
  ];

  const mockActionData = {
    group: '1',
    action: 'INSERT',
    tableName: 'TARGET_TABLE',
    actionOn: 'DONOR',
    columnName: 'COL1',
    actionValue: 'Y',
    processOrder: '1,2',
    alternateProcessOrder: '',
    parentGroup: '',
    operator: 'OR',
    response: 'PASS',
    functions: 'F1'
  };

  function createComponent(data?: Partial<SqlStatementDialogData>) {
    const dialogData: SqlStatementDialogData = {
      processCode: 'TEST_PROC',
      processSteps: mockSteps,
      reflexiveActions: mockActions,
      selectedActionData: mockActionData,
      ...data
    };

    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [SqlStatementDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: mockDialogRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(SqlStatementDialogComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(SqlStatementDialogComponent);
    component = fixture.componentInstance;
  }

  describe('Initialization', () => {
    it('should create component and generate SQL', () => {
      createComponent();
      expect(component).toBeTruthy();
      expect(component.sql).toContain('TEST_PROC');
    });

    it('should return "-- No action selected" when actionData is null', () => {
      createComponent({ selectedActionData: null });
      expect(component.sql).toBe('-- No action selected');
    });
  });

  describe('generateSql', () => {
    it('should produce header comments', () => {
      createComponent();
      expect(component.sql).toContain('-- Process:');
      expect(component.sql).toContain('-- Define Process - TEST_PROC');
      expect(component.sql).toContain('-- Generated SQL for Process Steps');
    });

    it('should generate SELECT/FROM blocks', () => {
      createComponent();
      expect(component.sql).toContain('SELECT *');
      expect(component.sql).toContain('FROM TARGET_TABLE');
    });

    it('should handle conditions with pipe-delimited descriptions', () => {
      createComponent();
      expect(component.sql).toContain("BLOOD_CD = 'A+'");
    });

    it('should handle IS NULL conditions', () => {
      createComponent();
      expect(component.sql).toContain('WEIGHT_KG IS NULL');
    });

    it('should append action-level WHERE clauses on last step', () => {
      createComponent();
      expect(component.sql).toContain("Action = 'INSERT'");
      expect(component.sql).toContain("Process_Order = '1,2'");
    });

    it('should include step comments', () => {
      createComponent();
      expect(component.sql).toContain('-- Step 1.00: BLOOD_TYPE');
      expect(component.sql).toContain('-- Step 2.00: WEIGHT');
    });
  });

  describe('onCopy', () => {
    it('should call clipboard writeText', () => {
      createComponent();
      const clipboardSpy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      component.onCopy();
      expect(clipboardSpy).toHaveBeenCalledWith(component.sql);
    });

    it('should set copied true then reset after 1000ms', fakeAsync(() => {
      createComponent();
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      component.onCopy();
      expect(component.copied).toBe(true);
      tick(1000);
      expect(component.copied).toBe(false);
    }));
  });

  describe('onGenerateSql', () => {
    it('should regenerate SQL', () => {
      createComponent();
      const originalSql = component.sql;
      component.onGenerateSql();
      expect(component.sql).toBe(originalSql);
    });
  });

  describe('onClose', () => {
    it('should close dialog', () => {
      createComponent();
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
