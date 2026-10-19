import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { ViewSqlDialogComponent, ViewSqlDialogData } from './view-sql-dialog';
import { SqlStatement } from '../../services/define-process.service';

beforeAll(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.resolve() },
    writable: true,
    configurable: true
  });
});

describe('ViewSqlDialogComponent', () => {
  let component: ViewSqlDialogComponent;
  let fixture: ComponentFixture<ViewSqlDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ViewSqlDialogComponent>>;

  const mockSqlStatements: SqlStatement[] = [
    { processCode: 'PROC1', processSeq: 1, lookingFor: 'BLOOD_TYPE', sqlStmt: 'SELECT * FROM T1' },
    { processCode: 'PROC1', processSeq: 2, lookingFor: 'WEIGHT', sqlStmt: 'SELECT * FROM T2' }
  ];

  const mockData: ViewSqlDialogData = {
    processCode: 'PROC1',
    sqlStatements: mockSqlStatements
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [ViewSqlDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: mockData },
        { provide: MatDialogRef, useValue: mockDialogRef }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .overrideComponent(ViewSqlDialogComponent, {
      set: { imports: [], template: '<div></div>' }
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewSqlDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should receive data via MAT_DIALOG_DATA', () => {
    expect(component.data.processCode).toBe('PROC1');
    expect(component.data.sqlStatements.length).toBe(2);
  });

  describe('onCopy', () => {
    it('should call clipboard writeText with SQL', () => {
      const spy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      component.onCopy('SELECT * FROM T1', 0);
      expect(spy).toHaveBeenCalledWith('SELECT * FROM T1');
    });

    it('should set copiedIndex then reset after 2000ms', fakeAsync(() => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      component.onCopy('SQL', 0);
      expect(component.copiedIndex).toBe(0);
      tick(2000);
      expect(component.copiedIndex).toBeNull();
    }));
  });

  describe('onCopyAll', () => {
    it('should concatenate all SQL with headers', () => {
      const spy = spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      component.onCopyAll();
      const copiedText = spy.calls.mostRecent().args[0];
      expect(copiedText).toContain('-- 1. BLOOD_TYPE (Process Seq: 1)');
      expect(copiedText).toContain('SELECT * FROM T1');
      expect(copiedText).toContain('-- 2. WEIGHT (Process Seq: 2)');
      expect(copiedText).toContain('SELECT * FROM T2');
    });

    it('should set copiedIndex to -1', fakeAsync(() => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
      component.onCopyAll();
      expect(component.copiedIndex).toBe(-1);
      tick(2000);
      expect(component.copiedIndex).toBeNull();
    }));
  });

  describe('onClose', () => {
    it('should close dialog', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });
});
